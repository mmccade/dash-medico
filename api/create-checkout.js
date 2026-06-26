// api/create-checkout.js
// Gera uma Stripe Checkout Session e retorna a URL de pagamento.
// Chamado pelo frontend quando o médico clica em assinar um plano.
//
// Body esperado (JSON): { plano: "mensal" | "trimestral" | "anual", email?: string }
// Responde: { url: "https://checkout.stripe.com/..." }

import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });
}

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
  return { auth: getAuth() };
}

const PRICE_MAP = {
  mensal:      () => process.env.STRIPE_PRICE_MENSAL,
  trimestral:  () => process.env.STRIPE_PRICE_TRIMESTRAL,
  anual:       () => process.env.STRIPE_PRICE_ANUAL,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { plano, email } = req.body || {};

  if (!plano || !PRICE_MAP[plano]) {
    return res.status(400).json({ error: "Plano inválido." });
  }

  const priceId = PRICE_MAP[plano]();
  if (!priceId) {
    return res.status(500).json({ error: "Price ID não configurado para este plano." });
  }

  try {
    const stripe = stripeClient();
    const appUrl = process.env.APP_LOGIN_URL?.replace("/login", "") || "https://app.murev.com.br";

    // Se veio email, tenta buscar ou criar customer na Stripe para pré-preencher o checkout
    let customer;
    if (email) {
      const emailNorm = email.trim().toLowerCase();
      const existing = await stripe.customers.list({ email: emailNorm, limit: 1 });
      if (existing.data.length > 0) {
        customer = existing.data[0].id;
      }
    }

    const sessionParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancel`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      payment_method_types: ["card"],
    };

    if (customer) {
      sessionParams.customer = customer;
    } else if (email) {
      sessionParams.customer_email = email.trim().toLowerCase();
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("[create-checkout] erro:", e);
    return res.status(500).json({ error: "Falha ao criar sessão de pagamento." });
  }
}
