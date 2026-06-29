// src/components/ModalPlanos.jsx
// Exibe popup de planos quando o usuário está logado mas sem plano ativo.
// Usado em App.jsx, envolvendo AppMedico.
// Origem: plano "nenhum" no perfil do Firestore (não veio pelo webhook / não pagou).

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { definirPlano } from "../services/db.js";
import { useAuth } from "../lib/auth.jsx";

const PLANOS = [
  {
    id: "mensal",
    label: "Mensal",
    preco: "R$ 67,00",
    periodo: "/mês",
    destaque: false,
    itens: [
      "Pacientes ilimitados",
      "Fichas e evoluções completas",
      "Geração de PDF",
      "Importação por planilha",
    ],
  },
  {
    id: "trimestral",
    label: "Trimestral",
    preco: "R$ 177,00",
    periodo: "/trimestre",
    destaque: true,
    tag: "Mais popular",
    itens: [
      "Tudo do plano mensal",
      "Economia de R$ 24,00",
      "Suporte prioritário",
      "Acesso a novidades antes",
    ],
  },
  {
    id: "anual",
    label: "Anual",
    preco: "R$ 499,90",
    periodo: "/ano",
    destaque: false,
    itens: [
      "Tudo do plano trimestral",
      "Economia de R$ 304,10",
      "Acesso vitalício às atualizações do ano",
    ],
  },
];

export default function ModalPlanos() {
  const { user, setPerfil } = useAuth();
  const [salvando, setSalvando] = useState(null);

  const escolher = async (planoId) => {
    if (!user) return;
    setSalvando(planoId);
    try {
      await definirPlano(user.uid, planoId);
      // Atualiza perfil no contexto para fechar o modal imediatamente
      setPerfil((pf) => ({ ...pf, plano: planoId, planoDesde: new Date() }));
    } catch (e) {
      console.error("Erro ao salvar plano:", e);
      setSalvando(null);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 20,
        maxWidth: 820, width: "100%",
        padding: "40px 32px 36px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-block", background: "var(--brand)", color: "#fff",
            fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
            padding: "4px 12px", borderRadius: 99, marginBottom: 14,
          }}>
            Murev Acompanha
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, marginBottom: 8 }}>
            Escolha seu plano
          </h2>
          <p style={{ fontSize: 14, color: "var(--inkSoft)", maxWidth: 440, margin: "0 auto" }}>
            Para acessar o sistema, selecione o plano que melhor se encaixa na sua rotina clínica.
          </p>
        </div>

        {/* Cards de planos */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}>
          {PLANOS.map((plano) => (
            <div key={plano.id} style={{
              border: plano.destaque ? "2px solid var(--brand)" : "1px solid var(--line)",
              borderRadius: 16,
              padding: "24px 20px",
              background: plano.destaque ? "var(--surface2)" : "var(--surface)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
              {plano.tag && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: "var(--brand)", color: "#fff",
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap",
                }}>
                  {plano.tag}
                </div>
              )}

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 8 }}>
                  {plano.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: plano.destaque ? "var(--brand)" : "var(--ink)" }}>
                    {plano.preco}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{plano.periodo}</span>
                </div>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {plano.itens.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--inkSoft)" }}>
                    <Check size={14} color="var(--good)" style={{ marginTop: 2, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => escolher(plano.id)}
                disabled={!!salvando}
                className={plano.destaque ? "btn btn-primary" : "btn btn-ghost"}
                style={{ marginTop: "auto", width: "100%", justifyContent: "center" }}
              >
                {salvando === plano.id
                  ? <><Loader2 size={14} className="spin" /> Salvando…</>
                  : `Assinar ${plano.label}`
                }
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "var(--inkFaint)", textAlign: "center", marginTop: 24 }}>
          Precisa de acesso? Entre em contato com a Murev pelo WhatsApp.
        </p>
      </div>
    </div>
  );
}
