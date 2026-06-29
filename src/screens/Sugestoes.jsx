// src/screens/Sugestoes.jsx
// Aba global de sugestões — médico envia feedback/ideia pra noreply@murev.com.br
// Salva no Firestore (coleção "sugestoes") e dispara email via /api/sugestao.js

import { useState } from "react";
import { Send, CheckCircle2, Lightbulb, Bug, Star, MessageSquare } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { useToast } from "../lib/toast.jsx";

const CATEGORIAS = [
  { id: "ideia",     label: "Nova ideia",        Icon: Lightbulb },
  { id: "bug",       label: "Bug / problema",     Icon: Bug },
  { id: "melhoria",  label: "Melhoria existente", Icon: Star },
  { id: "outro",     label: "Outro",              Icon: MessageSquare },
];

export default function Sugestoes() {
  const { user } = useAuth();
  const toast = useToast();
  const [categoria, setCategoria] = useState("ideia");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (!texto.trim()) { toast("Descreva sua sugestão antes de enviar."); return; }
    setEnviando(true);
    try {
      const res = await fetch("/api/sugestao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria,
          texto: texto.trim(),
          email: user?.email || "",
          uid: user?.uid || "",
        }),
      });
      if (!res.ok) throw new Error("Falha no envio.");
      setEnviado(true);
      setTexto("");
    } catch (e) {
      console.error(e);
      toast("Erro ao enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--brandSoft, #d1f5e8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <CheckCircle2 size={32} color="var(--good, #1f9d6b)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Sugestão enviada!</h2>
        <p style={{ fontSize: 14, color: "var(--inkSoft)", margin: "0 0 28px", lineHeight: 1.6 }}>
          Obrigado pelo feedback. Lemos cada mensagem e priorizamos as melhorias com base nelas.
        </p>
        <button className="btn btn-ghost" onClick={() => setEnviado(false)}>
          Enviar outra sugestão
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 className="page-title">Sugestões</h1>
        <p className="page-sub">Tem uma ideia, achou um bug ou quer ver algo melhorado? Conta pra gente.</p>
      </div>

      {/* Categoria */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 12 }}>Categoria</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CATEGORIAS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setCategoria(id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                borderRadius: 10, border: `1.5px solid ${categoria === id ? "var(--brand)" : "var(--line)"}`,
                background: categoria === id ? "var(--brandSoft, #d1f5e8)" : "var(--surface)",
                color: categoria === id ? "var(--brand)" : "var(--ink)",
                fontWeight: categoria === id ? 700 : 400, fontSize: 13.5, cursor: "pointer",
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Texto */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
          Descreva sua sugestão
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Seja específico — quanto mais detalhe, mais fácil pra gente implementar..."
          maxLength={2000}
          rows={6}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--line)",
            background: "var(--surface)", fontSize: 13.5, resize: "vertical", fontFamily: "inherit",
            color: "var(--ink)", boxSizing: "border-box", minHeight: 120,
          }}
        />
        <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginTop: 6, textAlign: "right" }}>
          {texto.length}/2000
        </div>
      </div>

      <button className="btn btn-primary" onClick={enviar} disabled={enviando || !texto.trim()}
        style={{ alignSelf: "flex-end", padding: "13px 24px" }}>
        {enviando ? "Enviando…" : <><Send size={15} /> Enviar sugestão</>}
      </button>
    </div>
  );
}
