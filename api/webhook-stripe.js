// api/webhook-stripe.js
// Vercel Serverless Function — recebe webhooks da Stripe.
//
// Variáveis de ambiente (Vercel):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//   RESEND_API_KEY
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   -> whsec_... do painel da Stripe
//   STRIPE_PRICE_MENSAL, STRIPE_PRICE_TRIMESTRAL, STRIPE_PRICE_ANUAL
//   APP_LOGIN_URL

import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

// ─── Stripe (singleton) ───────────────────────────────────────
function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });
}

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

// ─── Mapa price_id → plano ───────────────────────────────────
function inferirPlanoPorPrice(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_MENSAL]:      "mensal",
    [process.env.STRIPE_PRICE_TRIMESTRAL]:  "trimestral",
    [process.env.STRIPE_PRICE_ANUAL]:       "anual",
  };
  return map[priceId] || "mensal";
}

const DIAS_PLANO = { mensal: 31, trimestral: 93, anual: 366, vitalicio: 36500 };

// ─── Handler principal ────────────────────────────────────────
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  // Lê o body raw (necessário para verificar assinatura Stripe)
  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    const stripe = stripeClient();
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.warn("[webhook-stripe] assinatura inválida:", e.message);
    return res.status(400).json({ error: "Assinatura inválida." });
  }

  try {
    await processarEvento(event);
    return res.status(200).json({ ok: true, type: event.type });
  } catch (e) {
    console.error("[webhook-stripe] erro:", e);
    return res.status(500).json({ error: "Falha ao processar evento." });
  }
}

// ─── Roteador de eventos ──────────────────────────────────────
async function processarEvento(event) {
  const { auth, db } = admin();

  switch (event.type) {

    // Novo pagamento concluído (checkout)
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription") break;
      const stripe = stripeClient();
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = sub.items.data[0]?.price?.id;
      const plano = inferirPlanoPorPrice(priceId);
      const email = session.customer_details?.email || session.customer_email;
      const customerId = session.customer;
      await aprovar({ auth, db, email, plano, customerId, sub });
      break;
    }

    // Renovação automática paga
    case "invoice.paid": {
      const invoice = event.data.object;
      if (invoice.billing_reason === "subscription_create") break; // já tratado no checkout
      const customerId = invoice.customer;
      const priceId = invoice.lines?.data[0]?.price?.id;
      const plano = inferirPlanoPorPrice(priceId);
      const email = invoice.customer_email;
      if (email) await renovar({ db, email, plano, customerId });
      break;
    }

    // Falha de pagamento → pausa
    case "invoice.payment_failed":
    case "invoice.payment_action_required": {
      const invoice = event.data.object;
      const email = invoice.customer_email;
      if (email) await pausar({ db, email, motivo: event.type });
      break;
    }

    // Assinatura cancelada pelo cliente (via portal)
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const stripe = stripeClient();
      const customer = await stripe.customers.retrieve(sub.customer);
      const email = customer.email;
      if (email) await pausar({ db, email, motivo: "subscription_canceled" });
      break;
    }

    // Assinatura pausada por inadimplência
    case "customer.subscription.paused": {
      const sub = event.data.object;
      const stripe = stripeClient();
      const customer = await stripe.customers.retrieve(sub.customer);
      const email = customer.email;
      if (email) await pausar({ db, email, motivo: "subscription_paused" });
      break;
    }

    // Troca de plano (upgrade/downgrade via portal)
    case "customer.subscription.updated": {
      const sub = event.data.object;
      if (sub.status !== "active") break;
      const stripe = stripeClient();
      const customer = await stripe.customers.retrieve(sub.customer);
      const email = customer.email;
      const priceId = sub.items.data[0]?.price?.id;
      const plano = inferirPlanoPorPrice(priceId);
      if (email) await atualizarPlano({ db, email, plano, sub });
      break;
    }

    default:
      console.log("[webhook-stripe] evento ignorado:", event.type);
  }
}

// ─── Aprovar: novo cliente ────────────────────────────────────
async function aprovar({ auth, db, email, plano, customerId, sub }) {
  if (!email) return;
  const emailNorm = email.trim().toLowerCase();
  const dias = DIAS_PLANO[plano] || 31;
  const acessoAte = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  let userRecord;
  let contaNova = false;
  try {
    userRecord = await auth.getUserByEmail(emailNorm);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      userRecord = await auth.createUser({ email: emailNorm, emailVerified: false });
      contaNova = true;
    } else throw e;
  }

  const uid = userRecord.uid;
  const ref = db.collection("usuarios").doc(uid);
  const snap = await ref.get();

  const base = {
    email: emailNorm,
    plano,
    status: "ativo",
    statusAssinatura: "ativo",
    acessoAte,
    planoDesde: FieldValue.serverTimestamp(),
    pausadoEm: null,
    motivoPausa: null,
    stripeCustomerId: customerId || null,
    stripeSubscriptionId: sub?.id || null,
    paymentMethod: "cartao",
    atualizadoViaWebhook: FieldValue.serverTimestamp(),
  };

  if (!snap.exists) {
    await ref.set({
      ...base,
      nome: "",
      clinica: "Minha Clínica",
      medico: "",
      crm: "",
      criadoEm: FieldValue.serverTimestamp(),
      origem: "stripe",
      excluido: false,
    });
  } else {
    await ref.update(base);
  }

  if (contaNova || !snap.exists) {
    const link = await auth.generatePasswordResetLink(emailNorm, {
      url: process.env.APP_LOGIN_URL || "https://app.murev.com.br/login",
    });
    await enviarBoasVindas(emailNorm, plano, link);
  } else {
    await enviarRenovacao(emailNorm, plano);
  }
}

// ─── Renovar: pagamento recorrente confirmado ─────────────────
async function renovar({ db, email, plano, customerId }) {
  const emailNorm = email.trim().toLowerCase();
  const q = await db.collection("usuarios").where("email", "==", emailNorm).limit(1).get();
  if (q.empty) return;

  const dias = DIAS_PLANO[plano] || 31;
  const acessoAte = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  await q.docs[0].ref.update({
    plano,
    status: "ativo",
    statusAssinatura: "ativo",
    acessoAte,
    pausadoEm: null,
    motivoPausa: null,
    stripeCustomerId: customerId || null,
    atualizadoViaWebhook: FieldValue.serverTimestamp(),
  });

  await enviarRenovacao(emailNorm, plano);
}

// ─── Atualizar plano (troca via portal) ──────────────────────
async function atualizarPlano({ db, email, plano, sub }) {
  const emailNorm = email.trim().toLowerCase();
  const q = await db.collection("usuarios").where("email", "==", emailNorm).limit(1).get();
  if (q.empty) return;

  const dias = DIAS_PLANO[plano] || 31;
  const acessoAte = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

  await q.docs[0].ref.update({
    plano,
    status: "ativo",
    statusAssinatura: "ativo",
    acessoAte,
    stripeSubscriptionId: sub?.id || null,
    atualizadoViaWebhook: FieldValue.serverTimestamp(),
  });
}

// ─── Pausar ───────────────────────────────────────────────────
async function pausar({ db, email, motivo }) {
  const emailNorm = email.trim().toLowerCase();
  const q = await db.collection("usuarios").where("email", "==", emailNorm).limit(1).get();
  if (q.empty) {
    console.warn("[webhook-stripe] pausar: usuário não encontrado", emailNorm);
    return;
  }
  await q.docs[0].ref.update({
    status: "pausado",
    statusAssinatura: "cancelado",
    pausadoEm: FieldValue.serverTimestamp(),
    motivoPausa: motivo || "stripe",
    atualizadoViaWebhook: FieldValue.serverTimestamp(),
  });
}

// ─── Lê body raw (necessário para stripe.webhooks.constructEvent) ────
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ─── Emails ───────────────────────────────────────────────────
const LABEL_PLANO = { mensal: "Mensal", trimestral: "Trimestral", anual: "Anual", vitalicio: "Vitalício" };

async function enviarBoasVindas(email, plano, link) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Murev Acompanha <noreply@app.murev.com.br>",
    to: email,
    subject: "Seu acesso ao Murev Acompanha está pronto 🎉",
    html: emailHtml({
      titulo: "Bem-vindo ao Murev Acompanha",
      saudacao: "Olá!",
      corpo: `Seu pagamento foi confirmado e o plano <strong>${LABEL_PLANO[plano] || plano}</strong> já está ativo. Para acessar, defina sua senha clicando no botão abaixo:`,
      ctaTexto: "Definir senha e acessar",
      ctaLink: link,
      rodapeExtra: "Por segurança, o link expira em 1 hora. Se precisar, gere um novo na tela de login em \"Esqueci minha senha\".",
    }),
  });
}

async function enviarRenovacao(email, plano) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Murev Acompanha <noreply@app.murev.com.br>",
    to: email,
    subject: "Assinatura Murev Acompanha confirmada ✓",
    html: emailHtml({
      titulo: "Assinatura confirmada",
      saudacao: "Olá!",
      corpo: `Recebemos a confirmação do seu plano <strong>${LABEL_PLANO[plano] || plano}</strong>. Seu acesso continua liberado normalmente.`,
      ctaTexto: "Acessar o sistema",
      ctaLink: process.env.APP_LOGIN_URL || "https://app.murev.com.br/login",
    }),
  });
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
