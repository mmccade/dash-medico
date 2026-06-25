// src/screens/Pacientes.jsx
import { useState } from "react";
import { Upload, Plus, Search, Download, ArrowUpDown, CheckSquare, Square, ListChecks, Trash2, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { ultimoCiclo, perdaPeso, mesesTrat, br, faixaEtaria } from "../lib/utils.js";
import { Avatar, Toggle, Chip } from "../components/ui.jsx";
import { useIsMobile } from "../components/Shell.jsx";
import ModalDesativar from "../components/ModalDesativar.jsx";
import { baixarPdfMetaBatida } from "../services/pdf.js";

const ORDENS = [
  { id: "cadastro", label: "Mais recentes" },
  { id: "az",      label: "A–Z" },
  { id: "perda",   label: "Maior perda" },
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

const DIAS_LIXEIRA = 30;

function diasNaLixeira(excluidoEm) {
  if (!excluidoEm) return 0;
  return Math.floor((Date.now() - new Date(excluidoEm).getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Modal exclusão permanente ────────────────────────────────
function ModalExcluirPermanente({ paciente, onConfirmar, onFechar }) {
  const [confirmNome, setConfirmNome] = useState("");
  const [excluindo, setExcluindo] = useState(false);

  const confirmar = async () => {
    if (confirmNome.trim().toLowerCase() !== paciente.nome.toLowerCase()) return;
    setExcluindo(true);
    await onConfirmar(paciente.id);
    onFechar();
  };

  const bate = confirmNome.trim().toLowerCase() === paciente.nome.toLowerCase();

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 400, padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <AlertTriangle size={19} color="#e74c3c" />
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#e74c3c" }}>Excluir permanentemente</h2>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--inkSoft)", lineHeight: 1.6, marginBottom: 16 }}>
          Todos os ciclos e dados de <strong>{paciente.nome}</strong> serão deletados para sempre. Esta ação não pode ser desfeita.
        </p>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 6 }}>
            Digite o nome do paciente para confirmar
          </label>
          <input
            type="text" value={confirmNome}
            onChange={(e) => setConfirmNome(e.target.value)}
            placeholder={paciente.nome}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && bate && confirmar()}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, color: "var(--ink)", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onFechar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} disabled={!bate || excluindo}
            style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14, cursor: bate ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: bate ? "#e74c3c" : "var(--surface2)", color: bate ? "#fff" : "var(--inkFaint)" }}>
            {excluindo ? <><Loader2 size={14} className="spin" /> Excluindo…</> : "Excluir para sempre"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Pacientes({ navegar }) {
  const { pacientes, config, toggleAtivo, desativarPaciente, ativarEmMassa, desativarEmMassa, exportarCSV, moverParaLixeira, restaurarDaLixeira, excluirPermanente } = useStore();
  const toast = useToast();
  const [aba, setAba]           = useState("ativo"); // "ativo" | "inativo" | "todos" | "lixeira"
  const [busca, setBusca]       = useState("");
  const [ordem, setOrdem]       = useState("cadastro");
  const [faixa, setFaixa]       = useState("todas");
  const [mostrarOrdem, setMostrarOrdem] = useState(false);
  const [modoSelecao, setModoSelecao]   = useState(false);
  const [selecionados, setSelecionados] = useState(new Set());
  const [desativando, setDesativando]   = useState(null);
  const [saindo, setSaindo]             = useState(null);
  const [modalExcluir, setModalExcluir] = useState(null);
  const isMobile = useIsMobile();

  // Separar lixeira do resto
  const naLixeira  = pacientes.filter((p) => !!p.excluidoEm);
  const ativos     = pacientes.filter((p) => !p.excluidoEm);
  const totalGeral  = ativos.length;
  const totalAtivos = ativos.filter((p) => p.ativo).length;
  const totalInativ = totalGeral - totalAtivos;

  const lista = (aba === "lixeira" ? naLixeira : ativos)
    .filter((p) => {
      if (aba === "lixeira") return true;
      if (aba === "ativo")   return p.ativo;
      if (aba === "inativo") return !p.ativo;
      return true;
    })
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((p) => faixa === "todas" || faixaEtaria(p.idade || 0) === faixa)
    .slice()
    .sort((a, b) => {
      if (aba === "lixeira")  return new Date(b.excluidoEm) - new Date(a.excluidoEm);
      if (ordem === "az")     return a.nome.localeCompare(b.nome, "pt-BR");
      if (ordem === "perda")  return perdaPeso(b) - perdaPeso(a);
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
      setDesativando(p);
    } else {
      setSaindo(p.id);
      setTimeout(() => { toggleAtivo(p.id); setSaindo(null); }, 220);
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

  const handleMoverLixeira = async (p) => {
    if (!window.confirm(`Mover ${p.nome} para a lixeira? Você poderá restaurá-lo por ${DIAS_LIXEIRA} dias.`)) return;
    setSaindo(p.id);
    await new Promise((r) => setTimeout(r, 200));
    await moverParaLixeira(p.id);
    toast("Paciente movido para a lixeira");
    setSaindo(null);
  };

  const handleRestaurar = async (p) => {
    await restaurarDaLixeira(p.id);
    toast(`${p.nome} restaurado`);
  };

  const handleExcluirPermanente = async (id) => {
    await excluirPermanente(id);
    toast("Paciente excluído permanentemente");
  };

  const baixarPdfMeta = async (paciente, mensagem) => {
    try { await baixarPdfMetaBatida(paciente, config, mensagem); toast("PDF gerado"); }
    catch (e) { console.error(e); toast("Erro ao gerar PDF"); }
  };

  const ativarSelecionados = async () => {
    if (selecionados.size === 0) return;
    await ativarEmMassa([...selecionados]);
    toast(`${selecionados.size} ativado${selecionados.size > 1 ? "s" : ""}`);
    setSelecionados(new Set()); setModoSelecao(false);
  };
  const desativarSelecionados = async () => {
    if (selecionados.size === 0) return;
    if (!window.confirm(`Desativar ${selecionados.size} paciente(s)?`)) return;
    await desativarEmMassa([...selecionados], "nao_informar");
    toast(`${selecionados.size} desativado${selecionados.size > 1 ? "s" : ""}`);
    setSelecionados(new Set()); setModoSelecao(false);
  };

  const abas = [
    { id: "ativo",   label: "Ativos",      count: totalAtivos },
    { id: "inativo", label: "Inativos",     count: totalInativ },
    { id: "todos",   label: "Todos",        count: totalGeral },
    { id: "lixeira", label: "Lixeira",      count: naLixeira.length, warn: naLixeira.length > 0 },
  ];

  const labelMotivo = (m) => ({ meta_batida: "Bateu a meta", sumiu: "Sumiu / Não voltou", outros: "Outros motivos", nao_informar: null })[m] ?? null;

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
            {naLixeira.length > 0 && <> · <span style={{ color: "var(--warn)", fontWeight: 600 }}>{naLixeira.length} na lixeira</span></>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
          {aba !== "lixeira" && (
            <>
              <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={() => { setModoSelecao(!modoSelecao); setSelecionados(new Set()); }}>
                <ListChecks size={16} /> {modoSelecao ? "Sair da seleção" : "Selecionar vários"}
              </button>
              <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={exportarCSV} title="Exportar como CSV">
                <Download size={16} /> Exportar CSV
              </button>
              <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={() => navegar("importar")}>
                <Upload size={16} /> Importar
              </button>
              <button className="btn btn-primary" style={{ flex: isMobile ? 1 : "none" }} onClick={() => navegar("novopaciente")}>
                <Plus size={16} /> Cadastrar paciente
              </button>
            </>
          )}
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: "flex", gap: 6, background: "var(--surface2)", borderRadius: 10, padding: 3, alignSelf: "flex-start", flexWrap: "wrap" }}>
        {abas.map((a) => (
          <button key={a.id} onClick={() => { setAba(a.id); setModoSelecao(false); setSelecionados(new Set()); }}
            style={{ borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, background: aba === a.id ? "var(--surface)" : "transparent", color: aba === a.id ? (a.warn ? "var(--warn)" : "var(--ink)") : "var(--inkFaint)", boxShadow: aba === a.id ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>
            {a.label}
            {a.count > 0 && (
              <span style={{ background: a.warn ? "var(--warn)" : "var(--line)", color: a.warn ? "#fff" : "var(--inkSoft)", borderRadius: 99, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>
                {a.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aviso lixeira */}
      {aba === "lixeira" && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "var(--inkSoft)", lineHeight: 1.6 }}>
          Pacientes na lixeira são <strong>excluídos automaticamente após {DIAS_LIXEIRA} dias</strong>. Você pode restaurá-los ou excluir permanentemente antes disso.
        </div>
      )}

      {/* Seleção em massa */}
      {modoSelecao && aba !== "lixeira" && (
        <div style={{ background: "var(--brandSoft)", border: "1px solid var(--brand)", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 13.5, color: "var(--brand)", fontWeight: 600 }}>
            {selecionados.size} selecionado{selecionados.size !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost sm" onClick={selecionarTodos}>
              {selecionados.size === lista.length ? "Desmarcar todos" : "Selecionar todos visíveis"}
            </button>
            <button className="btn btn-ghost sm" onClick={ativarSelecionados} disabled={selecionados.size === 0}>Ativar</button>
            <button className="btn btn-primary sm" onClick={desativarSelecionados} disabled={selecionados.size === 0}>Desativar</button>
          </div>
        </div>
      )}

      {/* Filtros — só mostrar fora da lixeira */}
      {aba !== "lixeira" && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: isMobile ? "100%" : 200 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome…"
              style={{ width: "100%", padding: "9px 14px 9px 34px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5 }} />
          </div>
          <select value={faixa} onChange={(e) => setFaixa(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5 }}>
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
      )}

      {/* Lista */}
      <div className="card" style={{ overflow: "hidden" }}>
        {!isMobile && !modoSelecao && aba !== "lixeira" && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 150px", padding: "12px 20px", borderBottom: "1px solid var(--line)", fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Paciente</span><span>Tempo</span><span>Peso atual</span><span>Evolução</span><span>Ações</span>
          </div>
        )}
        {!isMobile && aba === "lixeira" && lista.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 150px", padding: "12px 20px", borderBottom: "1px solid var(--line)", fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Paciente</span><span>Dias na lixeira</span><span>Ações</span>
          </div>
        )}
        {lista.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--inkFaint)", fontSize: 14 }}>
            {aba === "lixeira" ? "Lixeira vazia." : "Nenhum paciente neste filtro."}
          </div>
        )}

        {lista.map((p) => {
          const temCiclo    = p.ciclos.length > 0;
          const ev          = p.ciclos.length > 1 ? `−${br(perdaPeso(p))} kg` : "—";
          const selecionado = selecionados.has(p.id);
          const animClass   = saindo === p.id ? "paciente-saindo" : "";
          const dias        = diasNaLixeira(p.excluidoEm);
          const urgente     = dias >= DIAS_LIXEIRA - 5;

          // ── Lixeira ──
          if (aba === "lixeira") {
            if (isMobile) {
              return (
                <div key={p.id} className={animClass} style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar nome={p.nome} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: urgente ? "var(--warn)" : "var(--inkFaint)", fontWeight: urgente ? 700 : 400 }}>
                      {dias === 0 ? "Movido hoje" : `${dias} dia${dias !== 1 ? "s" : ""} na lixeira`}
                      {urgente && " · expira em breve"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => handleRestaurar(p)} title="Restaurar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--good)", padding: 8, borderRadius: 8 }}>
                      <RotateCcw size={16} />
                    </button>
                    <button onClick={() => setModalExcluir(p)} title="Excluir permanentemente" style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", padding: 8, borderRadius: 8 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div key={p.id} className={animClass} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 150px", padding: "14px 20px", alignItems: "center", borderBottom: "1px solid var(--line)", background: "var(--surface2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <Avatar nome={p.nome} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</div>
                    <div style={{ fontSize: 12, color: "var(--inkFaint)" }}>{p.idade} anos · {p.sexo}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13.5, color: urgente ? "var(--warn)" : "var(--inkSoft)", fontWeight: urgente ? 700 : 400 }}>
                  {dias === 0 ? "Hoje" : `${dias} dia${dias !== 1 ? "s" : ""}`}
                  {urgente && <div style={{ fontSize: 12, fontWeight: 700 }}>⚠️ Expira em breve</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => handleRestaurar(p)} className="btn btn-ghost sm" style={{ gap: 6, color: "var(--good)" }}>
                    <RotateCcw size={14} /> Restaurar
                  </button>
                  <button onClick={() => setModalExcluir(p)} style={{ padding: "7px 10px", borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#e74c3c" }} title="Excluir permanentemente">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          }

          // ── Lista normal ──
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
                      {p.idade} anos · {p.sexo}{temCiclo && <> · {br(ultimoCiclo(p).peso)} kg</>}
                    </span>
                    {!p.ativo && labelMotivo(p.motivoDesativacao) && (
                      <span style={{ fontSize: 11, color: "var(--warn)", fontWeight: 600, display: "block", marginTop: 1 }}>
                        {labelMotivo(p.motivoDesativacao)}{p.detalhesDesativacao && p.motivoDesativacao !== "meta_batida" && p.motivoDesativacao !== "sumiu" ? ` · ${p.detalhesDesativacao}` : ""}
                      </span>
                    )}
                  </span>
                </button>
                {!modoSelecao && (
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <Toggle on={p.ativo} onClick={() => handleToggle(p)} />
                    <button onClick={() => handleMoverLixeira(p)} title="Mover para lixeira" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)", padding: 6, borderRadius: 8 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={p.id} className={animClass} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 150px", padding: "14px 20px", alignItems: "center", borderBottom: "1px solid var(--line)", background: p.ativo ? "transparent" : "var(--surface2)" }}>
              <button onClick={() => navegar("ficha", p.id)} style={{ display: "flex", alignItems: "center", gap: 13, textAlign: "left" }}>
                <Avatar nome={p.nome} />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, display: "block" }}>{p.nome}</span>
                  <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{p.idade} anos · {p.sexo}</span>
                  {!p.ativo && labelMotivo(p.motivoDesativacao) && (
                    <span style={{ fontSize: 11, color: "var(--warn)", fontWeight: 600, display: "block", marginTop: 1 }}>
                      {labelMotivo(p.motivoDesativacao)}{p.detalhesDesativacao && p.motivoDesativacao !== "meta_batida" && p.motivoDesativacao !== "sumiu" ? ` · ${p.detalhesDesativacao}` : ""}
                    </span>
                  )}
                </span>
              </button>
              <span style={{ fontSize: 13.5, color: "var(--inkSoft)" }}>{mesesTrat(p.inicio)} meses</span>
              <span className="tnum" style={{ fontSize: 13.5 }}>{temCiclo ? br(ultimoCiclo(p).peso) + " kg" : "—"}</span>
              <span className="tnum" style={{ fontSize: 13.5, fontWeight: 600, color: p.ciclos.length > 1 ? "var(--good)" : "var(--inkFaint)" }}>{ev}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Toggle on={p.ativo} onClick={() => handleToggle(p)} />
                <button onClick={() => handleMoverLixeira(p)} title="Mover para lixeira" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)", padding: 5, borderRadius: 7 }}>
                  <Trash2 size={14} />
                </button>
              </div>
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

      {modalExcluir && (
        <ModalExcluirPermanente
          paciente={modalExcluir}
          onConfirmar={handleExcluirPermanente}
          onFechar={() => setModalExcluir(null)}
        />
      )}
    </div>
  );
}
