// src/screens/Pacientes.jsx
// Alterações:
//  - Ordenação customizável: cadastro (padrão), A-Z, maior perda de peso
//  - Botão "Exportar CSV" que chama store.exportarCSV()

import { useState } from "react";
import { Upload, Plus, Search, Download, ArrowUpDown } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { ultimoCiclo, perdaPeso, mesesTrat, br } from "../lib/utils.js";
import { Avatar, Toggle, Chip } from "../components/ui.jsx";
import { useIsMobile } from "../components/Shell.jsx";

const ORDENS = [
  { id: "cadastro", label: "Mais recentes" },
  { id: "az", label: "A–Z" },
  { id: "perda", label: "Maior perda" },
];

export default function Pacientes({ navegar }) {
  const { pacientes, toggleAtivo, exportarCSV } = useStore();
  const [filtro, setFiltro] = useState("ativo");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("cadastro");
  const [mostrarOrdem, setMostrarOrdem] = useState(false);
  const isMobile = useIsMobile();

  const lista = pacientes
    .filter((p) => (filtro === "todos" ? true : filtro === "ativo" ? p.ativo : !p.ativo))
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .slice()
    .sort((a, b) => {
      if (ordem === "az") return a.nome.localeCompare(b.nome, "pt-BR");
      if (ordem === "perda") return perdaPeso(b) - perdaPeso(a);
      return 0; // cadastro: mantém ordem original (mais recente primeiro, do Firestore)
    });

  const labelOrdem = ORDENS.find((o) => o.id === ordem)?.label;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-sub">{pacientes.filter((p) => p.ativo).length} ativos · {pacientes.length} no total</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
          <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={exportarCSV} title="Exportar todos como CSV">
            <Download size={16} /> Exportar CSV
          </button>
          <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={() => navegar("importar")}>
            <Upload size={16} /> Importar
          </button>
          <button className="btn btn-primary" style={{ flex: isMobile ? 1 : "none" }} onClick={() => navegar("novopaciente")}>
            <Plus size={16} /> Cadastrar paciente
          </button>
        </div>
      </div>

      {/* Filtros + busca + ordenação */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3, flex: isMobile ? 1 : "none" }}>
          {[["ativo", "Ativos"], ["inativo", "Inativos"], ["todos", "Todos"]].map(([k, l]) => (
            <button key={k} onClick={() => setFiltro(k)} style={{
              flex: 1, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600,
              background: filtro === k ? "var(--surface)" : "transparent",
              color: filtro === k ? "var(--ink)" : "var(--inkFaint)",
              boxShadow: filtro === k ? "0 1px 2px rgba(0,0,0,.06)" : "none",
            }}>{l}</button>
          ))}
        </div>

        <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 200 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome…"
            style={{ width: "100%", padding: "9px 14px 9px 34px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5 }} />
        </div>

        {/* Seletor de ordenação */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setMostrarOrdem(!mostrarOrdem)} className="btn btn-ghost" style={{ fontSize: 13, gap: 6 }}>
            <ArrowUpDown size={14} /> {labelOrdem}
          </button>
          {mostrarOrdem && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
              background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 160, overflow: "hidden",
            }}>
              {ORDENS.map((o) => (
                <button key={o.id} onClick={() => { setOrdem(o.id); setMostrarOrdem(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "11px 16px",
                    fontSize: 13.5, fontWeight: ordem === o.id ? 700 : 400,
                    color: ordem === o.id ? "var(--brand)" : "var(--ink)",
                    background: ordem === o.id ? "var(--brandSoft)" : "transparent",
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {!isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "12px 20px", borderBottom: "1px solid var(--line)", fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Paciente</span><span>Tempo</span><span>Peso atual</span><span>Evolução</span><span>Status</span>
          </div>
        )}
        {lista.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--inkFaint)", fontSize: 14 }}>Nenhum paciente neste filtro.</div>}
        {lista.map((p) => {
          const temCiclo = p.ciclos.length > 0;
          const ev = p.ciclos.length > 1 ? `−${br(perdaPeso(p))} kg` : "—";
          if (isMobile) {
            return (
              <div key={p.id} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", background: p.ativo ? "transparent" : "var(--surface2)", display: "flex", flexDirection: "column", gap: 11 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <button onClick={() => navegar("ficha", p.id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", flex: 1, minWidth: 0 }}>
                    <Avatar nome={p.nome} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                      <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{p.idade} anos · {p.sexo}</span>
                    </span>
                  </button>
                  <Toggle on={p.ativo} onClick={() => toggleAtivo(p.id)} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingLeft: 50 }}>
                  <Chip>{mesesTrat(p.inicio)} meses</Chip>
                  {temCiclo && <Chip>{br(ultimoCiclo(p).peso)} kg</Chip>}
                  {p.ciclos.length > 1 && <Chip tone="good">−{br(perdaPeso(p))} kg</Chip>}
                </div>
              </div>
            );
          }
          return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "14px 20px", alignItems: "center", borderBottom: "1px solid var(--line)", background: p.ativo ? "transparent" : "var(--surface2)" }}>
              <button onClick={() => navegar("ficha", p.id)} style={{ display: "flex", alignItems: "center", gap: 13, textAlign: "left" }}>
                <Avatar nome={p.nome} />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, display: "block" }}>{p.nome}</span>
                  <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{p.idade} anos · {p.sexo}</span>
                </span>
              </button>
              <span style={{ fontSize: 13.5, color: "var(--inkSoft)" }}>{mesesTrat(p.inicio)} meses</span>
              <span className="tnum" style={{ fontSize: 13.5 }}>{temCiclo ? br(ultimoCiclo(p).peso) + " kg" : "—"}</span>
              <span className="tnum" style={{ fontSize: 13.5, fontWeight: 600, color: p.ciclos.length > 1 ? "var(--good)" : "var(--inkFaint)" }}>{ev}</span>
              <Toggle on={p.ativo} onClick={() => toggleAtivo(p.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
