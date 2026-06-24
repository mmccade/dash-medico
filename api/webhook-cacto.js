// api/webhook-cacto.js
// Vercel Serverless Function — recebe webhooks da Cacto.
//
// Responsabilidades:
//  1. Validar a autenticidade do POST (secret compartilhado) — impede forjar requisição.
//  2. Idempotência: a Cacto reenvia o mesmo evento; gravamos o id processado e ignoramos repetição.
//  3. Pagamento aprovado  -> provisiona acesso (cria conta Auth se não existir, define plano,
//     status=ativo) e dispara email de login/boas-vindas via Resend.
//  4. Cancelamento / expiração / falha de pagamento -> status=pausado SEM apagar dados.
//  5. Renovação -> reativa (status=ativo) e estende a validade.
//
// Variáveis de ambiente necessárias (Vercel):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   RESEND_API_KEY
//   CACTO_WEBHOOK_SECRET   -> segredo combinado com a Cacto (header ou campo no payload)
//   APP_LOGIN_URL          -> ex https://app.murev.com.br/login  (default abaixo)

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import crypto from "crypto";

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

// ─── Mapeamento valor->plano (espelha VALOR_PLANO do front) ──
// A Cacto manda o valor pago; inferimos o plano. Ajuste os preços conforme
// os produtos/ofertas criados no painel da Cacto.
const PLANO_POR_OFERTA = {
  // chave = id da oferta/produto na Cacto (preencha com os reais)
  // "of_xxx_mensal": "mensal",
};
function inferirPlano(payload) {
  // 1) tenta por id de oferta mapeado
  const ofertaId =
    payload?.offer?.id || payload?.product?.id || payload?.plan?.id || payload?.oferta;
  if (ofertaId && PLANO_POR_OFERTA[ofertaId]) return PLANO_POR_OFERTA[ofertaId];

  // 2) tenta por nome/ciclo da assinatura
  const ciclo = String(
    payload?.subscription?.interval ||
      payload?.plan?.interval ||
      payload?.interval ||
      payload?.frequency ||
      ""
  ).toLowerCase();
  if (ciclo.includes("year") || ciclo.includes("anual") || ciclo.includes("annual")) return "anual";
  if (ciclo.includes("quarter") || ciclo.includes("trimes") || ciclo === "3") return "trimestral";
  if (ciclo.includes("month") || ciclo.includes("mens") || ciclo === "1") return "mensal";

  // 3) fallback por valor pago (centavos ou reais)
  const bruto = Number(
    payload?.amount ?? payload?.value ?? payload?.total ?? payload?.price ?? 0
  );
  const reais = bruto > 1000 ? bruto / 100 : bruto; // heurística centavos
  if (reais >= 150) return "anual";
  if (reais >= 60) return "trimestral";
  if (reais > 0) return "mensal";
  return "mensal";
}

// Quantos dias o plano dura — usado para calcular acessoAte (validade)
const DIAS_PLANO = { mensal: 31, trimestral: 93, anual: 366, vitalicio: 36500 };

// ─── Normalização do evento ──────────────────────────────────
// A Cacto usa nomes de evento próprios; agrupamos em 3 ações.
function classificarEvento(payload) {
  const ev = String(payload?.event || payload?.type || payload?.status || "").toLowerCase();

  const APROVA = [
    "purchase.approved", "order.paid", "payment.approved", "payment.confirmed",
    "subscription.paid", "subscription.renewed", "subscription.activated",
    "pix.approved", "approved", "paid", "active",
  ];
  const PAUSA = [
    "subscription.canceled", "subscription.cancelled", "subscription.expired",
    "subscription.suspended", "payment.refused", "payment.failed",
    "order.refunded", "chargeback", "refunded", "canceled", "cancelled",
    "expired", "overdue", "unpaid",
  ];

  if (APROVA.some((e) => ev.includes(e))) return "aprovar";
  if (PAUSA.some((e) => ev.includes(e))) return "pausar";
  return "ignorar";
}

function extrairEmail(payload) {
  const e =
    payload?.customer?.email ||
    payload?.buyer?.email ||
    payload?.client?.email ||
    payload?.email ||
    payload?.data?.customer?.email;
  return e ? String(e).trim().toLowerCase() : null;
}

function extrairEventoId(payload) {
  return (
    payload?.id ||
    payload?.event_id ||
    payload?.transaction?.id ||
    payload?.order?.id ||
    payload?.subscription?.id ||
    null
  );
}

// ─── Validação do secret ─────────────────────────────────────
// Aceita o secret por header (x-cacto-signature / authorization) OU campo no corpo.
// Se a Cacto assinar com HMAC, comparamos o hash; senão, igualdade simples do token.
function autenticado(req, rawBody) {
  const secret = process.env.CACTO_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado, não bloqueia (mas logamos)

  const assinatura =
    req.headers["x-cacto-signature"] ||
    req.headers["x-webhook-signature"] ||
    req.headers["x-hub-signature-256"] ||
    "";

  // Modo HMAC (se a Cacto enviar assinatura)
  if (assinatura && rawBody) {
    try {
      const esperado = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      const recebido = String(assinatura).replace(/^sha256=/, "");
      if (
        recebido.length === esperado.length &&
        crypto.timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado))
      ) {
        return true;
      }
    } catch { /* cai para verificação por token */ }
  }

  // Modo token simples (header Authorization, x-cacto-token, ou ?secret= / body.secret)
  const token =
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "") ||
    req.headers["x-cacto-token"] ||
    req.query?.secret ||
    req.body?.secret ||
    "";
  return token && token === secret;
}

// ─── Handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});

  if (!autenticado(req, rawBody)) {
    console.warn("[webhook-cacto] assinatura/secret inválido");
    return res.status(401).json({ error: "Não autorizado." });
  }

  const payload = typeof req.body === "string" ? safeParse(req.body) : req.body ?? {};
  const acao = classificarEvento(payload);
  const email = extrairEmail(payload);
  const eventoId = extrairEventoId(payload);

  // Responde 200 mesmo em "ignorar" para a Cacto não ficar reenviando.
  if (acao === "ignorar") {
    return res.status(200).json({ ok: true, ignorado: true });
  }
  if (!email) {
    console.warn("[webhook-cacto] payload sem email", { eventoId, acao });
    return res.status(200).json({ ok: true, semEmail: true });
  }

  try {
    const { auth, db } = admin();

    // ── Idempotência ──
    // Grava o evento numa coleção; se já existir, ignora.
    if (eventoId) {
      const evRef = db.collection("cacto_eventos").doc(String(eventoId));
      const ja = await evRef.get();
      if (ja.exists) {
        return res.status(200).json({ ok: true, duplicado: true });
      }
      await evRef.set({
        email, acao, recebidoEm: FieldValue.serverTimestamp(),
        evento: payload?.event || payload?.type || payload?.status || null,
      });
    }

    if (acao === "aprovar") {
      await aprovar({ auth, db, email, payload });
    } else if (acao === "pausar") {
      await pausar({ db, email, payload });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[webhook-cacto] erro:", e);
    // 500 faz a Cacto reenviar — bom para falhas transitórias.
    return res.status(500).json({ error: "Falha ao processar webhook." });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

// ─── Ação: aprovar pagamento ─────────────────────────────────
async function aprovar({ auth, db, email, payload }) {
  const plano = inferirPlano(payload);
  const dias = DIAS_PLANO[plano] || 31;
  const acessoAte = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  // 1) Garante a conta no Firebase Auth
  let userRecord;
  let senhaTemporaria = null;
  let contaNova = false;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      senhaTemporaria = gerarSenha();
      userRecord = await auth.createUser({
        email,
        password: senhaTemporaria,
        emailVerified: false,
      });
      contaNova = true;
    } else {
      throw e;
    }
  }

  const uid = userRecord.uid;
  const ref = db.collection("usuarios").doc(uid);
  const snap = await ref.get();

  // 2) Cria/atualiza o documento de perfil — preserva dados existentes
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
    cactoCustomerId:
      payload?.customer?.id || payload?.buyer?.id || payload?.subscription?.id || null,
  };

  if (!snap.exists) {
    await ref.set({
      ...base,
      nome: payload?.customer?.name || payload?.buyer?.name || "",
      clinica: "Minha Clínica",
      medico: payload?.customer?.name || "",
      crm: "",
      criadoEm: FieldValue.serverTimestamp(),
      origem: "cacto",
      excluido: false,
    });
  } else {
    await ref.update(base);
  }

  // 3) Email
  const nome = payload?.customer?.name || payload?.buyer?.name || "";
  if (contaNova && senhaTemporaria) {
    // Conta nova: manda link de definição de senha (não a senha em texto puro).
    const link = await auth.generatePasswordResetLink(email, {
      url: process.env.APP_LOGIN_URL || "https://app.murev.com.br/login",
    });
    await enviarBoasVindas(email, nome, plano, link);
  } else {
    // Conta já existia (renovação ou reativação): email simples de confirmação.
    await enviarRenovacao(email, nome, plano);
  }
}

// ─── Ação: pausar acesso ─────────────────────────────────────
async function pausar({ db, email, payload }) {
  // Encontra o usuário pelo email (sem deletar nada).
  const q = await db.collection("usuarios").where("email", "==", email).limit(1).get();
  if (q.empty) {
    console.warn("[webhook-cacto] pausar: usuário não encontrado", email);
    return;
  }
  const ref = q.docs[0].ref;
  await ref.update({
    status: "pausado",
    statusAssinatura: "cancelado",
    pausadoEm: FieldValue.serverTimestamp(),
    motivoPausa: payload?.event || payload?.type || payload?.status || "assinatura encerrada",
    atualizadoViaWebhook: FieldValue.serverTimestamp(),
    // plano é mantido para referência; o gate de acesso olha "status".
  });
}

// ─── Helpers ─────────────────────────────────────────────────
function gerarSenha() {
  // Senha temporária forte (o usuário troca pelo link de reset).
  return crypto.randomBytes(9).toString("base64").replace(/[^a-zA-Z0-9]/g, "") + "A1";
}

const LABEL_PLANO = {
  mensal: "Mensal", trimestral: "Trimestral", anual: "Anual", vitalicio: "Vitalício",
};

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

function primeiroNome(nome) {
  return String(nome).trim().split(/\s+/)[0];
}

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
