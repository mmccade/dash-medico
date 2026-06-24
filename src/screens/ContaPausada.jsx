// src/screens/ContaPausada.jsx
// Exibida quando perfil.status === "pausado" (assinatura cancelada/expirada via webhook Cacto).
// Os DADOS do médico continuam intactos no Firestore — só o acesso fica bloqueado.
// Quando o pagamento for retomado, o webhook volta status para "ativo" e o app destrava.

import { PauseCircle, LogOut, MessageCircle } from "lucide-react";
import { sair } from "../services/auth.js";
import { useAuth } from "../lib/auth.jsx";

const WHATSAPP = "https://wa.me/55SEUNUMERO"; // TODO: trocar pelo número comercial da Murev

function fmtData(val) {
  if (!val) return null;
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return null; }
}

export default function ContaPausada() {
  const { perfil, user } = useAuth();
  const desde = fmtData(perfil?.pausadoEm);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "24px 16px",
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 20, maxWidth: 460, width: "100%",
        padding: "40px 32px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.14)", textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 99, background: "var(--warnSoft)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <PauseCircle size={32} color="var(--warn)" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", letterSpacing: -0.3 }}>
          Acesso pausado
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--inkSoft)", lineHeight: 1.6, margin: "0 0 6px" }}>
          Sua assinatura do Murev Acompanha não está ativa no momento, então o acesso ao sistema foi
          temporariamente pausado.
        </p>
        <p style={{ fontSize: 14, color: "var(--inkSoft)", lineHeight: 1.6, margin: "0 0 24px" }}>
          <strong>Seus pacientes e registros continuam salvos.</strong> Assim que o pagamento for
          regularizado, tudo volta exatamente como estava.
        </p>

        {desde && (
          <div style={{
            fontSize: 12.5, color: "var(--inkFaint)", background: "var(--surface2)",
            padding: "10px 14px", borderRadius: 10, marginBottom: 24,
          }}>
            Pausado em {desde}
          </div>
        )}

        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", marginBottom: 10, textDecoration: "none" }}>
          <MessageCircle size={16} /> Regularizar pelo WhatsApp
        </a>

        <button onClick={() => sair()} className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "center", gap: 6 }}>
          <LogOut size={14} /> Sair da conta
        </button>

        <p style={{ fontSize: 11.5, color: "var(--inkFaint)", marginTop: 20 }}>
          {user?.email}
        </p>
      </div>
    </div>
  );
}
