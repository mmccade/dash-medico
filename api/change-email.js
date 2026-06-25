// api/change-email.js
// Envia email de confirmação de troca via Resend (igual ao reset-password)
// O Firebase manda o link de verificação pro novo email — só troca após confirmação.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Resend } from "resend";

function getAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getAuth();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  const { emailAtual, emailNovo } = req.body ?? {};

  if (!emailAtual || !emailNovo) return res.status(400).json({ error: "Dados incompletos." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNovo)) return res.status(400).json({ error: "Novo email inválido." });
  if (emailAtual.toLowerCase() === emailNovo.toLowerCase()) return res.status(400).json({ error: "O novo email é igual ao atual." });

  try {
    const adminAuth = getAdminAuth();

    // Verifica se o usuário atual existe
    await adminAuth.getUserByEmail(emailAtual);

    // Gera link de verificação para o NOVO email (Firebase envia por padrão pelo proprio serviço,
    // mas aqui pegamos o link e mandamos via Resend)
    const link = await adminAuth.generateEmailVerificationLink(emailNovo, {
      url: process.env.APP_LOGIN_URL || "https://app.murev.com.br/login",
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Murev Acompanha <noreply@app.murev.com.br>",
      to: emailNovo,
      subject: "Confirme seu novo email — Murev Acompanha",
      html: htmlEmail(link, emailNovo),
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[change-email] erro:", e);
    if (e.code === "auth/user-not-found") return res.status(200).json({ ok: true }); // não revelar
    if (e.code === "auth/email-already-exists") return res.status(400).json({ error: "Este email já está em uso por outra conta." });
    return res.status(500).json({ error: "Não foi possível enviar o email. Tente novamente." });
  }
}

function htmlEmail(link, novoEmail) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f4f4;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f4;padding:40px 20px;"><tr><td align="center">
<table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
<tr><td style="background:#0d7a82;padding:28px 32px;">
  <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Murev Acompanha</div>
  <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">Ferramenta de acompanhamento clínico</div>
</td></tr>
<tr><td style="padding:36px 32px;">
  <h1 style="font-size:20px;font-weight:700;color:#27322f;margin:0 0 12px;">Confirme seu novo email</h1>
  <p style="font-size:14px;color:#5a6663;line-height:1.6;margin:0 0 8px;">
    Você solicitou a troca de email para:
  </p>
  <p style="font-size:14px;font-weight:700;color:#0d7a82;margin:0 0 20px;background:#f0f4f4;padding:10px 14px;border-radius:8px;">
    ${novoEmail}
  </p>
  <p style="font-size:14px;color:#5a6663;line-height:1.6;margin:0 0 24px;">
    Clique no botão abaixo para confirmar. O email só será atualizado após a confirmação.
  </p>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td style="background:#0d7a82;border-radius:10px;">
    <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
      Confirmar novo email
    </a>
  </td></tr></table>
  <p style="font-size:13px;color:#8a9693;line-height:1.6;margin:0;">
    Se você não solicitou esta troca, ignore este email. Seu email atual permanece ativo.
  </p>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e8eeec;">
  <p style="font-size:12px;color:#a3b0ad;margin:0;line-height:1.6;">Murev Acompanha · Este email foi enviado automaticamente, não responda.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}
