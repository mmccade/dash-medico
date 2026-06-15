// src/components/SeletorPaciente.jsx
// Reutilizável: abas Ativos/Inativos/Todos + busca por nome + filtro por idade.
// Props:
//  - pacientes: array
//  - onSelecionar: (paciente) => void

import { useState } from "react";
import { Search } from "lucide-react";
import { Avatar, Toggle } from "./ui.jsx";
import { ultimoCiclo, br, perdaPeso, faixaEtaria } from "../lib/utils.js";

const FAIXAS = [
  { id: "todas", label: "Todas idades" },
  { id: "<30",   label: "Menos de 30" },
  { id: "30-39", label: "30-39 anos" },
  { id: "40-49", label: "40-49 anos" },
  { id: "50-59", label: "50-59 anos" },
  { id: "60-69", label: "60-69 anos" },
  { id: "70+",   label: "70+ anos" },
];

export default function SeletorPaciente({ pacientes, onSelecionar }) {
  const [filtro, setFiltro] = useState("ativo");
  const [busca, setBusca]   = useState("");
  const [faixa, setFaixa]   = useState("todas");

  const lista = pacientes
    .filter((p) => filtro === "todos" ? true : filtro === "ativo" ? p.ativo : !p.ativo)
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((p) => faixa === "todas" || faixaEtaria(p.idade || 0) === faixa);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Abas */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
        {[["ativo", "Ativos"], ["inativo", "Inativos"], ["todos", "Todos"]].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            flex: 1, borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600,
            background: filtro === k ? "var(--surface)" : "transparent",
            color: filtro === k ? "var(--ink)" : "var(--inkFaint)",
            boxShadow: filtro === k ? "0 1px 2px rgba(0,0,0,.06)" : "none",
          }}>{l}</button>
        ))}
      </div>

      {/* Busca + faixa etária */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome…"
            style={{ width: "100%", padding: "9px 14px 9px 34px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, boxSizing: "border-box" }} />
        </div>
        <select value={faixa} onChange={(e) => setFaixa(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, fontWeight: 500 }}>
          {FAIXAS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="card" style={{ overflow: "hidden" }}>
        {lista.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--inkFaint)", fontSize: 14 }}>
            Nenhum paciente neste filtro.
          </div>
        )}
        {lista.map((p) => {
          const u = p.ciclos.length ? ultimoCiclo(p) : null;
          return (
            <button key={p.id} onClick={() => onSelecionar(p)} style={{
              width: "100%", padding: "14px 18px", textAlign: "left",
              display: "flex", alignItems: "center", gap: 12,
              borderBottom: "1px solid var(--line)",
              background: p.ativo ? "transparent" : "var(--surface2)",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--brandSoft)"}
            onMouseOut={(e) => e.currentTarget.style.background = p.ativo ? "transparent" : "var(--surface2)"}>
              <Avatar nome={p.nome} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</div>
                <div style={{ fontSize: 12, color: "var(--inkFaint)" }}>
                  {p.idade} anos · {p.sexo}
                  {u && <> · {br(u.peso)} kg</>}
                  {p.ciclos.length > 1 && <> · −{br(perdaPeso(p))} kg</>}
                  {!p.ativo && <> · <span style={{ color: "var(--warn)" }}>inativo</span></>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
