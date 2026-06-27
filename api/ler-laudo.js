// api/ler-laudo.js
// Lê um laudo laboratorial (imagem OU PDF) via Claude API e extrai os marcadores.
// A API key fica SEMPRE no servidor (env), nunca no browser.
//
// Body esperado (JSON): {
//   mediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
//   base64: "<conteúdo base64 sem prefixo data:>",
//   nomesValidos: ["Glicose", "Insulina", ...]   // lista dos biomarcadores conhecidos
// }
// Header obrigatório: Authorization: Bearer <firebase-id-token>
// Responde: { data: { marcadores: [{ nome, valor }] }, error: null }

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const TAMANHO_MAX_BYTES = 15 * 1024 * 1024; // ~15MB de payload base64

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

async function verificarAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { auth } = admin();
    return await auth.verifyIdToken(token);
  } catch (e) {
    console.warn("[ler-laudo] token inválido:", e.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ data: null, error: "Método não permitido." });
  }

  // 1. Auth obrigatória — só médico logado pode usar
  const usuario = await verificarAuth(req);
  if (!usuario) {
    return res.status(401).json({ data: null, error: "Não autorizado." });
  }

  // 2. Validação de input
  const { mediaType, base64, nomesValidos } = req.body || {};

  if (!mediaType || !TIPOS_PERMITIDOS.includes(mediaType)) {
    return res.status(400).json({ data: null, error: "Tipo de arquivo não suportado." });
  }
  if (!base64 || typeof base64 !== "string") {
    return res.status(400).json({ data: null, error: "Arquivo ausente ou inválido." });
  }
  // Estimativa de tamanho: base64 expande ~33%
  if (base64.length * 0.75 > TAMANHO_MAX_BYTES) {
    return res.status(413).json({ data: null, error: "Arquivo muito grande. Máximo 15MB." });
  }
  if (!Array.isArray(nomesValidos) || nomesValidos.length === 0) {
    return res.status(400).json({ data: null, error: "Lista de marcadores ausente." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ler-laudo] ANTHROPIC_API_KEY não configurada");
    return res.status(500).json({ data: null, error: "Serviço de leitura indisponível." });
  }

  // 3. Monta o bloco de conteúdo conforme o tipo (PDF usa "document", imagem usa "image")
  const blocoArquivo = mediaType === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image",    source: { type: "base64", media_type: mediaType,        data: base64 } };

  const prompt = `Analise este laudo laboratorial e extraia SOMENTE os marcadores que conseguir identificar com clareza.

Responda APENAS com um JSON válido, sem texto adicional, sem markdown, sem explicações:

{ "marcadores": [ { "nome": "NOME_EXATO", "valor": "VALOR_NUMERICO" } ] }

Use EXATAMENTE estes nomes quando corresponderem:
${nomesValidos.join(", ")}

Regras:
- Inclua apenas marcadores visíveis com valor numérico legível
- Valor deve ser apenas o número (ex: "95", não "95 mg/dL"; use ponto decimal)
- Se não conseguir ler um valor com confiança, não inclua o marcador
- Se não houver marcadores reconhecíveis, retorne { "marcadores": [] }`;

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: [blocoArquivo, { type: "text", text: prompt }] }],
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("[ler-laudo] erro Anthropic:", dados?.error?.message);
      return res.status(502).json({ data: null, error: "Falha na leitura do laudo." });
    }

    const texto = dados.content?.find((b) => b.type === "text")?.text || "{}";
    const limpo = texto.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(limpo);
    } catch {
      console.error("[ler-laudo] JSON inválido da IA:", limpo.slice(0, 200));
      return res.status(502).json({ data: null, error: "Não foi possível interpretar o laudo." });
    }

    const nomesSet = new Set(nomesValidos);
    const marcadores = (parsed.marcadores || []).filter(
      (m) => m && m.nome && m.valor != null && m.valor !== "" && nomesSet.has(m.nome)
    );

    return res.status(200).json({ data: { marcadores }, error: null });
  } catch (e) {
    console.error("[ler-laudo] erro:", e);
    return res.status(500).json({ data: null, error: "Erro ao processar o laudo." });
  }
}
