// api/sugestao.js
// Recebe sugestão do médico, salva no Firestore e dispara email pra noreply@murev.com.br
// Não exige auth — qualquer usuário logado no app pode enviar.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

function admin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

const CATEGORIAS_PT = {
  ideia:    "Nova ideia",
  bug:      "Bug / problema",
  melhoria: "Melhoria existente",
  outro:    "Outro",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const { categoria, texto, email, uid } = req.body || {};

  if (!texto?.trim()) return res.status(400).json({ error: "Texto vazio." });

  const categoriaPt = CATEGORIAS_PT[categoria] || categoria || "Outro";

  try {
    const db = admin();

    // Salva no Firestore para histórico no painel Admin
    await db.collection("sugestoes").add({
      categoria: categoria || "outro",
      texto: texto.trim(),
      email: email || "",
      uid: uid || "",
      criadoEm: FieldValue.serverTimestamp(),
      lida: false,
    });

    // Dispara email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Murev Acompanha <noreply@murev.com.br>",
      to:   "noreply@murev.com.br",
      subject: `[Sugestão] ${categoriaPt} — ${email || "usuário"}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#27322f">
          <div style="background:#0d7a82;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">Nova sugestão — Murev Acompanha</h2>
          </div>
          <div style="background:#f8fafa;padding:24px;border-radius:0 0 12px 12px;border:1px solid #dde5e5;border-top:none">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr><td style="padding:8px 0;font-size:13px;color:#8a9693;width:110px">Categoria</td>
                  <td style="padding:8px 0;font-size:13px;font-weight:700">${categoriaPt}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#8a9693">Médico</td>
                  <td style="padding:8px 0;font-size:13px">${email || "—"}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#8a9693">UID</td>
                  <td style="padding:8px 0;font-size:11px;color:#8a9693">${uid || "—"}</td></tr>
            </table>
            <div style="background:#fff;border:1px solid #dde5e5;border-radius:10px;padding:16px 18px">
              <div style="font-size:11px;color:#8a9693;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Mensagem</div>
              <div style="font-size:14px;line-height:1.7;white-space:pre-wrap">${texto.trim()}</div>
            </div>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[sugestao]", e);
    return res.status(500).json({ error: "Erro interno." });
  }
}
