// src/components/PlanejadorSuplementos.jsx
// Médico monta o protocolo de suplementação → vê sinergismos (✓ combina)
// e antagonismos (⚠ não tomar junto) entre os suplementos escolhidos.
// Props:
//  - valor: array de nomes de suplementos
//  - onChange: (novoArray) => void
//  - sugestoesDepleção: array opcional de nutrientes vindos da depleção por medicamentos

import { useState } from "react";
import { Search, X, Plus, Check, AlertTriangle, Sparkles, Info } from "lucide-react";
import { SUPLEMENTOS, interacoesEntre, sugestoesSinergicas } from "../lib/suplementos.js";

export default function PlanejadorSuplementos({ valor = [], onChange, sugestoesDepleção = [] }) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  const disponiveis = SUPLEMENTOS.filter((s) => !valor.includes(s));
  const resultados = disponiveis.filter((s) => s.toLowerCase().includes(busca.toLowerCase())).slice(0, 8);

  const { sinergismos, antagonismos } = interacoesEntre(valor);
  const sugestoes = sugestoesSinergicas(valor).filter((s) => !valor.includes(s)).slice(0, 5);

  // nutrientes depletados que ainda não estão no protocolo (sugestão de reposição)
  const reposicaoSugerida = [...new Set(sugestoesDepleção)].filter(
    (n) => SUPLEMENTOS.includes(n) && !valor.includes(n)
  );

  const adicionar = (nome) => { if (!valor.includes(nome)) onChange([...valor, nome]); setBusca(""); setAberto(false); };
  const remover = (nome) => onChange(valor.filter((s) => s !== nome));

  return (
    <div>
      {/* Busca */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }} />
        <input
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          placeholder="Adicionar suplemento ao protocolo…"
          style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, boxSizing: "border-box" }}
        />
        {aberto && busca && resultados.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20, maxHeight: 240, overflowY: "auto" }}>
            {resultados.map((s) => (
              <button key={s} onClick={() => adicionar(s)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid var(--line)" }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--brandSoft)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                <Plus size={14} color="var(--inkFaint)" /> <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reposição sugerida pela depleção de medicamentos */}
      {reposicaoSugerida.length > 0 && (
        <div style={{ marginBottom: 14, padding: "11px 14px", background: "var(--brandSoft)", borderRadius: 9 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--brand)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={13} /> Reposição sugerida (depletados pelos medicamentos)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {reposicaoSugerida.map((n) => (
              <button key={n} onClick={() => adicionar(n)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 99, background: "var(--surface)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
                <Plus size={12} /> {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suplementos selecionados */}
      {valor.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {valor.map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 99, background: "var(--brandSoft)", color: "var(--brand)" }}>
              {s}
              <button onClick={() => remover(s)} style={{ display: "flex", color: "var(--brand)" }}><X size={13} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Antagonismos — atenção */}
      {antagonismos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <AlertTriangle size={13} /> Antagonismos — evitar tomar juntos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {antagonismos.map((it, i) => (
              <div key={i} style={{ padding: "10px 14px", background: "#fff8e6", borderRadius: 9, borderLeft: "3px solid #e0a800", fontSize: 13 }}>
                <b>{it.a}</b> + <b>{it.b}</b>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)", marginTop: 2 }}>competem pela absorção — separar os horários.</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sinergismos — bom */}
      {sinergismos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Check size={13} /> Sinergismos — potencializam
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sinergismos.map((it, i) => (
              <div key={i} style={{ padding: "10px 14px", background: "#eaf7f0", borderRadius: 9, borderLeft: "3px solid #1f9d6b", fontSize: 13 }}>
                <b>{it.a}</b> + <b>{it.b}</b>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)", marginTop: 2 }}>boa combinação — potencializa absorção/efeito.</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões sinérgicas */}
      {sugestoes.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 8 }}>Combinam com o protocolo atual:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sugestoes.map((s) => (
              <button key={s} onClick={() => adicionar(s)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 99, background: "var(--surface2)", color: "var(--inkSoft)" }}>
                <Plus size={12} /> {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {valor.length === 0 && reposicaoSugerida.length === 0 && (
        <div style={{ fontSize: 12.5, color: "var(--inkFaint)", padding: "8px 0" }}>
          Adicione os suplementos do protocolo para ver sinergismos e antagonismos.
        </div>
      )}

      {/* Aviso */}
      {valor.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: "11px 14px", background: "var(--surface2)", borderRadius: 9, fontSize: 11.5, color: "var(--inkSoft)", lineHeight: 1.5, marginTop: 4 }}>
          <Info size={15} color="var(--inkFaint)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Interações <b>informativas</b> baseadas na literatura. Doses, posologia e a prescrição final são de <b>responsabilidade exclusiva do médico</b>.</span>
        </div>
      )}
    </div>
  );
}
