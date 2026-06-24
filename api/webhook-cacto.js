// api/webhook-cacto.js
// Vercel Serverless Function — recebe webhooks da Cakto.
//
// Estrutura REAL do payload da Cakto (confirmada na doc oficial):
//   {
//     "payload": {                 // às vezes o corpo já é o conteúdo direto
//       "data": {
//         "customer": { "email": "...", "name": "...", "phone": "...", "docNumber": "..." },
//         "offer":    { "id": "...", "name": "...", "price": 5 },
//         "product":  { "id": "...", "name": "...", "type": "unique|subscription" },
//         "amount": 5,
//         "status": "paid",
//         "subscription": null | { ... },
//         "subscription_period": null | "monthly" | ...,
//         "id": "b3df956e-..."      // id da transação
//       },
//       "event": "purchase_approved",
//       "secret": "8402b43f-..."
//     }
//   }
//
// Alguns provedores enviam o conteúdo de "payload" direto na raiz do corpo,
// então o código abaixo aceita as duas formas (req.body.payload OU req.body).
//
// Variáveis de ambiente (Vercel):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   RESEND_API_KEY
//   CACTO_WEBHOOK_SECRET   -> mesmo secret configurado no painel da Cakto
//   APP_LOGIN_URL          -> ex https://app.murev.com.br/login

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

// ─── Firebase Admin (singleton) ──────────────────────────────
function admin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return { auth: getAuth(), db: getFirestore() };
}

// ─── Normaliza o corpo recebido ──────────────────────────────
// Aceita { payload: {...} } ou o objeto direto.
function extrairConteudo(body) {
  const raw = typeof body === "string" ? safeParse(body) : (body || {});
  const p = raw.payload || raw;       // o "miolo" do evento
  const data = p.data || p;           // os dados da venda
  const event = p.event || raw.event || data.event || "";
  const secret = p.secret || raw.secret || data.secret || "";
  return { data, event, secret };
}

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }

// ─── Classificação do evento (custom_id oficiais da Cakto) ───
const EVENTOS_APROVA = new Set([
  "purchase_approved",      // compra aprovada
  "subscription_renewed",   // assinatura renovada
]);
const EVENTOS_PAUSA = new Set([
  "subscription_canceled",        // assinatura cancelada
  "subscription_renewal_refused", // renovação recusada
  "refund",                       // reembolso
  "chargeback",                   // chargeback
]);

function classificar(event) {
  const e = String(event || "").toLowerCase();
  if (EVENTOS_APROVA.has(e)) return "aprovar";
  if (EVENTOS_PAUSA.has(e)) return "pausar";
  // fallback por texto, caso a Cakto mude algo
  if (e.includes("approved") || e.includes("renewed")) return "aprovar";
  if (e.includes("cancel") || e.includes("refus") || e.includes("refund") || e.includes("chargeback"))
    return "pausar";
  return "ignorar";
}

// ─── Inferência de plano ─────────────────────────────────────
// A Cakto manda subscription_period (ex: "monthly") e/ou o tipo do produto.
function inferirPlano(data) {
  const periodo = String(
    data.subscription_period ||
    data.subscription?.period ||
    data.subscription?.interval ||
    data.offer?.period ||
    ""
  ).toLowerCase();

  if (periodo.includes("year") || periodo.includes("anual") || periodo.includes("annual")) return "anual";
  if (periodo.includes("quarter") || periodo.includes("trimes") || periodo.includes("3")) return "trimestral";
  if (periodo.includes("month") || periodo.includes("mens")) return "mensal";

  // fallback por valor pago
  const bruto = Number(data.amount ?? data.offer?.price ?? data.baseAmount ?? 0);
  if (bruto >= 150) return "anual";
  if (bruto >= 60) return "trimestral";
  if (bruto > 0) return "mensal";
  return "mensal";
}

const DIAS_PLANO = { mensal: 31, trimestral: 93, anual: 366, vitalicio: 36500 };

// ─── Extração de campos ──────────────────────────────────────
function extrairEmail(data) {
  const e = data.customer?.email || data.buyer?.email || data.email;
  return e ? String(e).trim().toLowerCase() : null;
}
function extrairNome(data) {
  return data.customer?.name || data.buyer?.name || data.name || "";
}
function extrairEventoId(data) {
  return data.id || data.refId || data.subscription?.id || data.checkout || null;
}

// ─── Handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { data, event, secret } = extrairConteudo(req.body);

  // ── Validação do secret (vem no corpo: payload.secret) ──
  const esperado = process.env.CACTO_WEBHOOK_SECRET;
  if (esperado) {
    // aceita também via header, por garantia
    const headerSecret =
      (req.headers["authorization"] || "").replace(/^Bearer\s+/i, "") ||
      req.headers["x-cakto-signature"] ||
      req.headers["x-webhook-secret"] ||
      "";
    const recebido = secret || headerSecret;
    if (recebido !== esperado) {
      console.warn("[webhook-cacto] secret inválido");
      return res.status(401).json({ error: "Não autorizado." });
    }
  }

  const acao = classificar(event);
  const email = extrairEmail(data);
  const eventoId = extrairEventoId(data);

  // responde 200 em "ignorar" pra Cakto não reenviar
  if (acao === "ignorar") {
    return res.status(200).json({ ok: true, ignorado: true, event });
  }
  if (!email) {
    console.warn("[webhook-cacto] payload sem email", { event, acao });
    return res.status(200).json({ ok: true, semEmail: true });
  }

  try {
    const { auth, db } = admin();

    // ── Idempotência ──
    if (eventoId) {
      const evRef = db.collection("cacto_eventos").doc(String(eventoId) + "_" + event);
      const ja = await evRef.get();
      if (ja.exists) {
        return res.status(200).json({ ok: true, duplicado: true });
      }
      await evRef.set({
        email, acao, event,
        recebidoEm: FieldValue.serverTimestamp(),
      });
    }

    if (acao === "aprovar") {
      await aprovar({ auth, db, email, data });
    } else if (acao === "pausar") {
      await pausar({ db, email, event });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[webhook-cacto] erro:", e);
    return res.status(500).json({ error: "Falha ao processar webhook." });
  }
}

// ─── Ação: aprovar ───────────────────────────────────────────
async function aprovar({ auth, db, email, data }) {
  const plano = inferirPlano(data);
  const dias = DIAS_PLANO[plano] || 31;
  const acessoAte = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  let userRecord;
  let contaNova = false;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      userRecord = await auth.createUser({ email, emailVerified: false });
      contaNova = true;
    } else {
      throw e;
    }
  }

  const uid = userRecord.uid;
  const ref = db.collection("usuarios").doc(uid);
  const snap = await ref.get();

  const base = {
    email,
    plano,
    status: "ativo",
    statusAssinatura: "ativo",
    acessoAte,
    planoDesde: FieldValue.serverTimestamp(),
    pausadoEm: null,
    motivoPausa: null,
    atualizadoViaWebhook: FieldValue.serverTimestamp(),
    cactoCustomerId: data.customer?.docNumber || data.subscription?.id || null,
  };

  if (!snap.exists) {
    await ref.set({
      ...base,
      nome: extrairNome(data),
      clinica: "Minha Clínica",
      medico: extrairNome(data),
      crm: "",
      criadoEm: FieldValue.serverTimestamp(),
      origem: "cacto",
      excluido: false,
    });
  } else {
    await ref.update(base);
  }

  const nome = extrairNome(data);
  if (contaNova) {
    const link = await auth.generatePasswordResetLink(email, {
      url: process.env.APP_LOGIN_URL || "https://app.murev.com.br/login",
    });
    await enviarBoasVindas(email, nome, plano, link);
  } else {
    await enviarRenovacao(email, nome, plano);
  }
}

// ─── Ação: pausar ────────────────────────────────────────────
async function pausar({ db, email, event }) {
  const q = await db.collection("usuarios").where("email", "==", email).limit(1).get();
  if (q.empty) {
    console.warn("[webhook-cacto] pausar: usuário não encontrado", email);
    return;
  }
  await q.docs[0].ref.update({
    status: "pausado",
    statusAssinatura: "cancelado",
    pausadoEm: FieldValue.serverTimestamp(),
    motivoPausa: event || "assinatura encerrada",
    atualizadoViaWebhook: FieldValue.serverTimestamp(),
  });
}

// ─── E-mails ─────────────────────────────────────────────────
const LABEL_PLANO = { mensal: "Mensal", trimestral: "Trimestral", anual: "Anual", vitalicio: "Vitalício" };

async function enviarBoasVindas(email, nome, plano, link) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Murev Acompanha <noreply@murev.com.br>",
    to: email,
    subject: "Seu acesso ao Murev Acompanha está pronto 🎉",
    html: emailHtml({
      titulo: "Bem-vindo ao Murev Acompanha",
      saudacao: nome ? `Olá, ${primeiroNome(nome)}!` : "Olá!",
      corpo: `Seu pagamento foi confirmado e o plano <strong>${LABEL_PLANO[plano] || plano}</strong> já está ativo. Para acessar, defina sua senha clicando no botão abaixo:`,
      ctaTexto: "Definir senha e acessar",
      ctaLink: link,
      rodapeExtra: "Por segurança, o link expira em 1 hora. Se precisar, gere um novo na tela de login em \"Esqueci minha senha\".",
    }),
  });
}

async function enviarRenovacao(email, nome, plano) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Murev Acompanha <noreply@murev.com.br>",
    to: email,
    subject: "Assinatura Murev Acompanha confirmada",
    html: emailHtml({
      titulo: "Assinatura confirmada",
      saudacao: nome ? `Olá, ${primeiroNome(nome)}!` : "Olá!",
      corpo: `Recebemos a confirmação do seu plano <strong>${LABEL_PLANO[plano] || plano}</strong>. Seu acesso continua liberado normalmente.`,
      ctaTexto: "Acessar o sistema",
      ctaLink: process.env.APP_LOGIN_URL || "https://app.murev.com.br/login",
    }),
  });
}

function primeiroNome(nome) { return String(nome).trim().split(/\s+/)[0]; }

function emailHtml({ titulo, saudacao, corpo, ctaTexto, ctaLink, rodapeExtra }) {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f4f4;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f4;padding:40px 20px;"><tr><td align="center">
<table width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
<tr><td style="background:#0d7a82;padding:28px 32px;">
<div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.3px;">Murev Acompanha</div>
<div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Ferramenta de acompanhamento clínico</div>
</td></tr>
<tr><td style="padding:36px 32px;">
<h1 style="font-size:20px;font-weight:700;color:#27322f;margin:0 0 6px;">${titulo}</h1>
<p style="font-size:15px;color:#27322f;font-weight:600;margin:0 0 14px;">${saudacao}</p>
<p style="font-size:14px;color:#5a6663;line-height:1.6;margin:0 0 24px;">${corpo}</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td style="background:#0d7a82;border-radius:10px;">
<a href="${ctaLink}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px;">${ctaTexto}</a>
</td></tr></table>
${rodapeExtra ? `<p style="font-size:13px;color:#8a9693;line-height:1.6;margin:0;">${rodapeExtra}</p>` : ""}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e8eeec;">
<p style="font-size:12px;color:#a3b0ad;margin:0;line-height:1.6;">Murev Acompanha · Este email foi enviado automaticamente, não responda.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}
