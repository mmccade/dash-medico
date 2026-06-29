// src/components/PlanejadorSuplementos.jsx
// Builder de itens de um protocolo de suplementação.
// Cada item: { nome, via, conc, concUnidade, dose, doseUnidade }
//   via         → "oral" | "sublingual" | "sc" | "im" | "topico"
//   conc        → concentração (string numérica, ex "5")  — ex.: B12 5 mg/mL
//   concUnidade → "mg/mL" | "mcg/mL" | "%" | "—"
//   dose        → string numérica (ex "1")
//   doseUnidade → "mg" | "mcg" | ... | "mL"
// Mantém compatibilidade com formatos antigos: string OU { nome, dose, unidade }.
// onChange recebe SEMPRE o array completo de itens no formato novo.

import { useState, useRef, useEffect } from "react";
import { Search, X, Plus, Check, AlertTriangle, Sparkles, Info, Pencil } from "lucide-react";
import { SUPLEMENTOS, interacoesEntre, sugestoesSinergicas } from "../lib/suplementos.js";

export const VIAS = [
  { id: "oral", label: "Oral" },
  { id: "sublingual", label: "Sublingual" },
  { id: "sc", label: "Injetável SC" },
  { id: "im", label: "Injetável IM" },
  { id: "topico", label: "Tópico" },
];
const VIA_LABEL = Object.fromEntries(VIAS.map((v) => [v.id, v.label]));

const UNIDADES_DOSE = ["mg", "mcg", "g", "mL", "UI", "gotas", "cápsulas", "comprimidos"];
const UNIDADES_CONC = ["—", "mg/mL", "mcg/mL", "g/mL", "UI/mL", "%"];

// Normaliza para o formato novo, aceitando string ou objeto antigo {nome,dose,unidade}
function normalizarItem(v) {
  if (typeof v === "string") {
    return { nome: v, via: "oral", conc: "", concUnidade: "—", dose: "", doseUnidade: "mg" };
  }
  return {
    nome: v.nome,
    via: v.via || "oral",
    conc: v.conc ?? "",
    concUnidade: v.concUnidade ?? "—",
    dose: v.dose ?? "",
    doseUnidade: v.doseUnidade || v.unidade || "mg",
  };
}
function normalizar(val) {
  if (!Array.isArray(val)) return [];
  return val.map(normalizarItem);
}

// Resumo textual de um item (usado em PDF e listas)
export function resumoItem(it) {
  const i = normalizarItem(it);
  const partes = [i.nome];
  if (i.conc && i.concUnidade !== "—") partes.push(`${i.conc} ${i.concUnidade}`);
  if (i.dose) partes.push(`${i.dose} ${i.doseUnidade}`);
  partes.push(VIA_LABEL[i.via] || "Oral");
  return partes.join(" · ");
}

export default function PlanejadorSuplementos({ valor = [], onChange, sugestoesDepleção = [] }) {
  const itens = normalizar(valor);
  const nomes = itens.map((i) => i.nome);

  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState(null); // nome em edição
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);

  const disponiveis = SUPLEMENTOS.filter((s) => !nomes.includes(s));
  const resultados = disponiveis.filter((s) => s.toLowerCase().includes(busca.toLowerCase())).slice(0, 8);
  const { sinergismos, antagonismos } = interacoesEntre(nomes);
  const sugestoes = sugestoesSinergicas(nomes).filter((s) => !nomes.includes(s)).slice(0, 5);
  const reposicaoSugerida = [...new Set(sugestoesDepleção)].filter(
    (n) => SUPLEMENTOS.includes(n) && !nomes.includes(n)
  );

  useEffect(() => {
    if (!aberto || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const alturaEstimada = Math.min(240, resultados.length * 44 + 8);
    const espacoAbaixo = window.innerHeight - rect.bottom;
    const abrePraCima = espacoAbaixo < alturaEstimada + 24;
    setDropdownStyle(abrePraCima
      ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
      : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [aberto, busca, resultados.length]);

  const adicionar = (nome) => {
    if (!nomes.includes(nome)) {
      onChange([...itens, normalizarItem(nome)]);
      setEditando(nome); // já abre pra preencher via/conc/dose
    }
    setBusca(""); setAberto(false);
  };
  const remover = (nome) => onChange(itens.filter((i) => i.nome !== nome));
  const atualizar = (nome, campo, val) =>
    onChange(itens.map((i) => i.nome === nome ? { ...i, [campo]: val } : i));

  const inp = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, boxSizing: "border-box", color: "var(--ink)", width: "100%" };
  const lbl = { fontSize: 11, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 4, display: "block" };

  return (
    <div>
      {/* Campo de busca */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }} />
        <input ref={inputRef} value={busca}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Adicionar suplemento ao protocolo…"
          style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, boxSizing: "border-box" }} />
        {aberto && busca && resultados.length > 0 && (
          <div style={{ ...dropdownStyle, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, maxHeight: 240, overflowY: "auto" }}>
            {resultados.map((s) => (
              <button key={s} onClick={() => adicionar(s)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid var(--line)" }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--brandSoft)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                <Plus size={14} color="var(--inkFaint)" />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reposição sugerida pela depleção */}
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

      {/* Lista de itens */}
      {itens.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {itens.map((it) => (
            <div key={it.nome} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", background: "var(--surface)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editando === it.nome ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{it.nome}</span>
                  {(it.dose || (it.conc && it.concUnidade !== "—")) && (
                    <span style={{ fontSize: 12, color: "var(--inkFaint)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 99 }}>
                      {it.conc && it.concUnidade !== "—" ? `${it.conc} ${it.concUnidade}` : ""}
                      {it.conc && it.concUnidade !== "—" && it.dose ? " · " : ""}
                      {it.dose ? `${it.dose} ${it.doseUnidade}` : ""}
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)", background: "var(--brandSoft)", padding: "2px 8px", borderRadius: 99 }}>
                    {VIA_LABEL[it.via] || "Oral"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditando(editando === it.nome ? null : it.nome)}
                    style={{ color: "var(--brand)", padding: "3px 8px", borderRadius: 7, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <Pencil size={12} /> {editando === it.nome ? "Fechar" : "Editar"}
                  </button>
                  <button onClick={() => remover(it.nome)} style={{ color: "var(--inkFaint)", padding: "3px 6px", borderRadius: 7 }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              {editando === it.nome && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={lbl}>Via de administração</label>
                    <select value={it.via} onChange={(e) => atualizar(it.nome, "via", e.target.value)} style={inp}>
                      {VIAS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Concentração do insumo</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 8 }}>
                      <input type="text" inputMode="decimal" value={it.conc}
                        onChange={(e) => atualizar(it.nome, "conc", e.target.value)}
                        placeholder="Ex: 5" style={inp} />
                      <select value={it.concUnidade} onChange={(e) => atualizar(it.nome, "concUnidade", e.target.value)} style={inp}>
                        {UNIDADES_CONC.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--inkFaint)", marginTop: 4 }}>
                      Ex.: B12 metilcobalamina pode variar de 500 mcg/mL a 5 mg/mL.
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Dose / posologia</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 8 }}>
                      <input type="text" inputMode="decimal" value={it.dose}
                        onChange={(e) => atualizar(it.nome, "dose", e.target.value)}
                        placeholder="Ex: 1" style={inp} />
                      <select value={it.doseUnidade} onChange={(e) => atualizar(it.nome, "doseUnidade", e.target.value)} style={inp}>
                        {UNIDADES_DOSE.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Antagonismos */}
      {antagonismos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <AlertTriangle size={13} /> Antagonismos — evitar tomar juntos
          </div>
          {antagonismos.map((it, i) => (
            <div key={i} style={{ padding: "10px 14px", background: "#fff8e6", borderRadius: 9, borderLeft: "3px solid #e0a800", fontSize: 13, marginBottom: 6 }}>
              <b>{it.a}</b> + <b>{it.b}</b>
              <div style={{ fontSize: 11.5, color: "var(--inkSoft)", marginTop: 2 }}>competem pela absorção — separar os horários.</div>
            </div>
          ))}
        </div>
      )}

      {/* Sinergismos */}
      {sinergismos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <Check size={13} /> Sinergismos — potencializam
          </div>
          {sinergismos.map((it, i) => (
            <div key={i} style={{ padding: "10px 14px", background: "#eaf7f0", borderRadius: 9, borderLeft: "3px solid #1f9d6b", fontSize: 13, marginBottom: 6 }}>
              <b>{it.a}</b> + <b>{it.b}</b>
              <div style={{ fontSize: 11.5, color: "var(--inkSoft)", marginTop: 2 }}>boa combinação — potencializa absorção/efeito.</div>
            </div>
          ))}
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

      {itens.length === 0 && reposicaoSugerida.length === 0 && (
        <div style={{ fontSize: 12.5, color: "var(--inkFaint)", padding: "8px 0" }}>
          Adicione os suplementos do protocolo para ver sinergismos e antagonismos.
        </div>
      )}

      {itens.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: "11px 14px", background: "var(--surface2)", borderRadius: 9, fontSize: 11.5, color: "var(--inkSoft)", lineHeight: 1.5, marginTop: 4 }}>
          <Info size={15} color="var(--inkFaint)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Interações <b>informativas</b> baseadas na literatura. Doses, posologia, via e a prescrição final são de <b>responsabilidade exclusiva do médico</b>.</span>
        </div>
      )}
    </div>
  );
}
