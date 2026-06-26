// src/screens/ContaPausada.jsx
// Exibida quando perfil.status === "pausado".
// Oferece os 3 planos diretamente → Stripe Checkout.

import { useState } from "react";
import { PauseCircle, LogOut, Loader2 } from "lucide-react";
import { sair } from "../services/auth.js";
import { useAuth } from "../lib/auth.jsx";

const PLANOS = [
  {
    id: "mensal",
    label: "Mensal",
    preco: "R$ 67,00",
    sub: "por mês",
    destaque: false,
  },
  {
    id: "trimestral",
    label: "Trimestral",
    preco: "R$ 177,00",
    sub: "a cada 3 meses · economia de R$ 24",
    destaque: true,
  },
  {
    id: "anual",
    label: "Anual",
    preco: "R$ 499,90",
    sub: "por ano · economia de R$ 304",
    destaque: false,
  },
];

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
  const [carregando, setCarregando] = useState(null); // id do plano sendo carregado

  const renovar = async (planoId) => {
    setCarregando(planoId);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: planoId, email: user?.email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Falha ao iniciar pagamento.");
      window.location.href = body.url;
    } catch (e) {
      alert(e.message || "Não foi possível iniciar o pagamento. Tente novamente.");
      setCarregando(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "24px 16px",
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 20, maxWidth: 480, width: "100%",
        padding: "40px 32px 32px", boxShadow: "0 24px 64px rgba(0,0,0,0.14)", textAlign: "center",
      }}>
        {/* Ícone */}
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
          Sua assinatura não está ativa. Renove agora para voltar a acessar o sistema.
        </p>
        <p style={{ fontSize: 14, color: "var(--inkSoft)", lineHeight: 1.6, margin: "0 0 24px" }}>
          <strong>Seus pacientes e registros continuam salvos.</strong>
        </p>

        {desde && (
          <div style={{
            fontSize: 12.5, color: "var(--inkFaint)", background: "var(--surface2)",
            padding: "10px 14px", borderRadius: 10, marginBottom: 24,
          }}>
            Pausado em {desde}
          </div>
        )}

        {/* Planos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {PLANOS.map((p) => (
            <button
              key={p.id}
              onClick={() => renovar(p.id)}
              disabled={!!carregando}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", borderRadius: 12, cursor: carregando ? "not-allowed" : "pointer",
                border: p.destaque ? "2px solid var(--brand)" : "1.5px solid var(--line)",
                background: p.destaque ? "var(--brandSoft, #e6f4f5)" : "var(--surface2)",
                opacity: carregando && carregando !== p.id ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {p.label}
                  {p.destaque && (
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 600,
                      background: "var(--brand)", color: "#fff",
                      padding: "2px 7px", borderRadius: 99,
                    }}>
                      Mais popular
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 2 }}>{p.sub}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {carregando === p.id ? (
                  <Loader2 size={18} className="spin" color="var(--brand)" />
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--brand)" }}>{p.preco}</div>
                )}
              </div>
            </button>
          ))}
        </div>

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
