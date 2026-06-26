// api/create-portal.js
// Gera um link para o Stripe Customer Portal onde o médico pode:
// - trocar de plano
// - cancelar a assinatura
// - atualizar cartão
//
// Requer que o médico já tenha stripeCustomerId no Firestore.
// Body esperado (JSON): { email: string }
// Responde: { url: "https://billing.stripe.com/..." }

import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
  return { db: getFirestore() };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email obrigatório." });
  }

  try {
    const { db } = admin();
    const stripe = stripeClient();
    const appUrl = process.env.APP_LOGIN_URL?.replace("/login", "") || "https://app.murev.com.br";

    // Busca stripeCustomerId no Firestore
    const emailNorm = email.trim().toLowerCase();
    const q = await db.collection("usuarios").where("email", "==", emailNorm).limit(1).get();

    let customerId = q.empty ? null : q.docs[0].data().stripeCustomerId;

    // Se não tem customer na Stripe ainda, busca pelo email lá
    if (!customerId) {
      const existing = await stripe.customers.list({ email: emailNorm, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
        // Atualiza no Firestore pra próxima vez
        if (!q.empty) {
          await q.docs[0].ref.update({ stripeCustomerId: customerId });
        }
      }
    }

    if (!customerId) {
      return res.status(404).json({
        error: "Nenhuma assinatura Stripe encontrada para este email.",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/perfil`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("[create-portal] erro:", e);
    return res.status(500).json({ error: "Falha ao abrir portal de assinatura." });
  }
}
