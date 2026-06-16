// api/reset-password.js
// Vercel Edge/Serverless Function
// Gera o link de reset via Firebase Admin e envia pelo Resend
// com remetente noreply@murev.com.br

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Resend } from "resend";

// Inicializa o Firebase Admin uma única vez (evita reinicializar em hot-reload)
function getAdminAuth() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // A chave privada vem com \n escapados no .env — precisa desescapar
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getAuth();
}

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  const { email } = req.body ?? {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Email inválido." });
  }

  try {
    const adminAuth = getAdminAuth();

    // 1. Gera o link de redefinição via Firebase Admin
    const link = await adminAuth.generatePasswordResetLink(email.trim().toLowerCase(), {
      url: process.env.RESET_REDIRECT_URL || "https://dash-medico.vercel.app/login",
    });

    // 2. Dispara o email pelo Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Murev Acompanha <noreply@murev.com.br>",
      to: email.trim(),
      subject: "Redefinição de senha — Murev Acompanha",
      html: htmlEmail(link),
    });

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error("[reset-password] Erro:", e);

    // Se o email não existir no Firebase, retorna 404 sem revelar o motivo
    if (e.code === "auth/user-not-found") {
      // Retorna 200 mesmo assim — não queremos revelar se o email está cadastrado
      return res.status(200).json({ ok: true });
    }

    return res.status(500).json({ error: "Não foi possível enviar o email. Tente novamente." });
  }
}

// ── Template HTML do email ──────────────────────────────────────
function htmlEmail(link) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinição de senha</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f4;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0d7a82;padding:28px 32px;">
              <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Murev Acompanha
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">
                Ferramenta de acompanhamento clínico
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="font-size:20px;font-weight:700;color:#27322f;margin:0 0 12px;">
                Redefinição de senha
              </h1>
              <p style="font-size:14px;color:#5a6663;line-height:1.6;margin:0 0 24px;">
                Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#0d7a82;border-radius:10px;">
                    <a href="${link}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:-0.2px;">
                      Redefinir minha senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#8a9693;line-height:1.6;margin:0 0 16px;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="font-size:12px;color:#0d7a82;word-break:break-all;margin:0 0 28px;background:#f0f4f4;padding:12px;border-radius:8px;">
                ${link}
              </p>

              <p style="font-size:13px;color:#8a9693;line-height:1.6;margin:0;">
                Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanece a mesma.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e8eeec;">
              <p style="font-size:12px;color:#a3b0ad;margin:0;line-height:1.6;">
                Murev Acompanha · Este email foi enviado automaticamente, não responda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
