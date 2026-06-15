// src/screens/Pacientes.jsx
// + Filtro por idade
// + Stats: total / ativos / inativos
// + Ações em massa: seleção múltipla, ativar/desativar em lote
// + Toggle abre ModalDesativar em vez de desativar direto

import { useState } from "react";
import { Upload, Plus, Search, Download, ArrowUpDown, CheckSquare, Square, ListChecks } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { ultimoCiclo, perdaPeso, mesesTrat, br, faixaEtaria } from "../lib/utils.js";
import { Avatar, Toggle, Chip } from "../components/ui.jsx";
import { useIsMobile } from "../components/Shell.jsx";
import ModalDesativar from "../components/ModalDesativar.jsx";
import { baixarPdfMetaBatida } from "../services/pdf.js";

const ORDENS = [
  { id: "cadastro", label: "Mais recentes" },
  { id: "az", label: "A–Z" },
  { id: "perda", label: "Maior perda" },
];

const FAIXAS = [
  { id: "todas", label: "Todas idades" },
  { id: "<30",   label: "Menos de 30" },
  { id: "30-39", label: "30-39 anos" },
  { id: "40-49", label: "40-49 anos" },
  { id: "50-59", label: "50-59 anos" },
  { id: "60-69", label: "60-69 anos" },
  { id: "70+",   label: "70+ anos" },
];

export default function Pacientes({ navegar }) {
  const { pacientes, config, toggleAtivo, desativarPaciente, ativarEmMassa, desativarEmMassa, exportarCSV } = useStore();
  const toast = useToast();
  const [filtro, setFiltro] = useState("ativo");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("cadastro");
  const [faixa, setFaixa] = useState("todas");
  const [mostrarOrdem, setMostrarOrdem] = useState(false);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState(new Set());
  const [desativando, setDesativando] = useState(null); // paciente em desativação
  const [saindo, setSaindo] = useState(null); // id do paciente saindo (animação)
  const isMobile = useIsMobile();

  const totalGeral   = pacientes.length;
  const totalAtivos  = pacientes.filter((p) => p.ativo).length;
  const totalInativ  = totalGeral - totalAtivos;

  const lista = pacientes
    .filter((p) => filtro === "todos" ? true : filtro === "ativo" ? p.ativo : !p.ativo)
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((p) => faixa === "todas" || faixaEtaria(p.idade || 0) === faixa)
    .slice()
    .sort((a, b) => {
      if (ordem === "az") return a.nome.localeCompare(b.nome, "pt-BR");
      if (ordem === "perda") return perdaPeso(b) - perdaPeso(a);
      return 0;
    });

  const labelOrdem = ORDENS.find((o) => o.id === ordem)?.label;

  const toggleSelecao = (id) => {
    const next = new Set(selecionados);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelecionados(next);
  };

  const selecionarTodos = () => {
    if (selecionados.size === lista.length) setSelecionados(new Set());
    else setSelecionados(new Set(lista.map((p) => p.id)));
  };

  const handleToggle = (p) => {
    if (p.ativo) {
      // Vai desativar — abre modal de motivo
      setDesativando(p);
    } else {
      // Reativando — animação suave
      setSaindo(p.id);
      setTimeout(() => {
        toggleAtivo(p.id);
        setSaindo(null);
      }, 220);
    }
  };

  const confirmarDesativacao = async (motivo, detalhes) => {
    if (!desativando) return;
    setSaindo(desativando.id);
    await new Promise((r) => setTimeout(r, 200));
    await desativarPaciente(desativando.id, motivo, detalhes);
    toast("Paciente desativado");
    setSaindo(null);
  };

  const baixarPdfMeta = async (paciente, mensagem) => {
    try {
      await baixarPdfMetaBatida(paciente, config, mensagem);
      toast("PDF gerado");
    } catch (e) { console.error(e); toast("Erro ao gerar PDF"); }
  };

  const ativarSelecionados = async () => {
    if (selecionados.size === 0) return;
    await ativarEmMassa([...selecionados]);
    toast(`${selecionados.size} ativado${selecionados.size > 1 ? "s" : ""}`);
    setSelecionados(new Set());
    setModoSelecao(false);
  };

  const desativarSelecionados = async () => {
    if (selecionados.size === 0) return;
    if (!window.confirm(`Desativar ${selecionados.size} paciente(s)?`)) return;
    await desativarEmMassa([...selecionados], "nao_informar");
    toast(`${selecionados.size} desativado${selecionados.size > 1 ? "s" : ""}`);
    setSelecionados(new Set());
    setModoSelecao(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <style>{`
        @keyframes paciente-sai { 0% { opacity:1; transform: translateX(0); } 100% { opacity:0; transform: translateX(40px); } }
        .paciente-saindo { animation: paciente-sai 0.22s ease-out forwards; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-sub">
            {totalGeral} no total · <span style={{ color: "var(--good)", fontWeight: 600 }}>{totalAtivos} ativos</span> · <span style={{ color: "var(--inkFaint)" }}>{totalInativ} inativos</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
          <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={() => { setModoSelecao(!modoSelecao); setSelecionados(new Set()); }}>
            <ListChecks size={16} /> {modoSelecao ? "Sair da seleção" : "Selecionar vários"}
          </button>
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

      {/* Barra de ações em massa */}
      {modoSelecao && (
        <div style={{ background: "var(--brandSoft)", border: "1px solid var(--brand)", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 13.5, color: "var(--brand)", fontWeight: 600 }}>
            {selecionados.size} selecionado{selecionados.size !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost sm" onClick={selecionarTodos}>
              {selecionados.size === lista.length ? "Desmarcar todos" : "Selecionar todos visíveis"}
            </button>
            <button className="btn btn-ghost sm" onClick={ativarSelecionados} disabled={selecionados.size === 0}>
              Ativar
            </button>
            <button className="btn btn-primary sm" onClick={desativarSelecionados} disabled={selecionados.size === 0}>
              Desativar
            </button>
          </div>
        </div>
      )}

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

        <select value={faixa} onChange={(e) => setFaixa(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, fontWeight: 500 }}>
          {FAIXAS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>

        <div style={{ position: "relative" }}>
          <button onClick={() => setMostrarOrdem(!mostrarOrdem)} className="btn btn-ghost" style={{ fontSize: 13, gap: 6 }}>
            <ArrowUpDown size={14} /> {labelOrdem}
          </button>
          {mostrarOrdem && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 160, overflow: "hidden" }}>
              {ORDENS.map((o) => (
                <button key={o.id} onClick={() => { setOrdem(o.id); setMostrarOrdem(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", fontSize: 13.5, fontWeight: ordem === o.id ? 700 : 400, color: ordem === o.id ? "var(--brand)" : "var(--ink)", background: ordem === o.id ? "var(--brandSoft)" : "transparent" }}>
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {!isMobile && !modoSelecao && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "12px 20px", borderBottom: "1px solid var(--line)", fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Paciente</span><span>Tempo</span><span>Peso atual</span><span>Evolução</span><span>Status</span>
          </div>
        )}
        {lista.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--inkFaint)", fontSize: 14 }}>Nenhum paciente neste filtro.</div>}
        {lista.map((p) => {
          const temCiclo = p.ciclos.length > 0;
          const ev = p.ciclos.length > 1 ? `−${br(perdaPeso(p))} kg` : "—";
          const selecionado = selecionados.has(p.id);
          const animClass = saindo === p.id ? "paciente-saindo" : "";

          if (isMobile || modoSelecao) {
            return (
              <div key={p.id} className={animClass} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", background: selecionado ? "var(--brandSoft)" : p.ativo ? "transparent" : "var(--surface2)", display: "flex", alignItems: "center", gap: 11 }}>
                {modoSelecao && (
                  <button onClick={() => toggleSelecao(p.id)} style={{ color: "var(--brand)" }}>
                    {selecionado ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                )}
                <button onClick={() => modoSelecao ? toggleSelecao(p.id) : navegar("ficha", p.id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", flex: 1, minWidth: 0 }}>
                  <Avatar nome={p.nome} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                    <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>
                      {p.idade} anos · {p.sexo}
                      {temCiclo && <> · {br(ultimoCiclo(p).peso)} kg</>}
                    </span>
                  </span>
                </button>
                {!modoSelecao && <Toggle on={p.ativo} onClick={() => handleToggle(p)} />}
              </div>
            );
          }
          return (
            <div key={p.id} className={animClass} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 120px", padding: "14px 20px", alignItems: "center", borderBottom: "1px solid var(--line)", background: p.ativo ? "transparent" : "var(--surface2)" }}>
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
              <Toggle on={p.ativo} onClick={() => handleToggle(p)} />
            </div>
          );
        })}
      </div>

      {desativando && (
        <ModalDesativar
          paciente={desativando}
          onConfirmar={confirmarDesativacao}
          onFechar={() => setDesativando(null)}
          navegar={navegar}
          onBaixarPdfMeta={baixarPdfMeta}
        />
      )}
    </div>
  );
}
