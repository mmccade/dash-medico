// src/screens/PlanoAcompanhamento.jsx
// Plano de acompanhamento estruturado do paciente:
//  - início + duração prevista → término calculado + barra de progresso
//  - marcos/etapas com data prevista, descrição e status (pendente/concluído)
//  - templates prontos de protocolo de tirzepatida
// Salva no documento do paciente (campo `plano`) via editarPaciente.

import { useState, useEffect } from "react";
import {
  Loader2, Save, Check, Plus, X, Target, Calendar,
  CircleCheck, Circle, Clock, Sparkles, Trash2,
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";

// ── Templates prontos ─────────────────────────────────────────
const TEMPLATES = {
  titulacao6m: {
    nome: "Titulação tirzepatida — 6 meses",
    duracaoMeses: 6,
    marcos: [
      { mes: 0, titulo: "Início — 2,5 mg", desc: "Dose inicial. Orientar aplicação e rodízio de locais." },
      { mes: 1, titulo: "Titular para 5 mg", desc: "Avaliar tolerância e efeitos colaterais." },
      { mes: 2, titulo: "Reavaliação clínica", desc: "Peso, medidas e adesão. Ajustar se necessário." },
      { mes: 3, titulo: "Exames de controle", desc: "Solicitar glicose, insulina, HbA1c, perfil lipídico, hepático." },
      { mes: 4, titulo: "Titular conforme resposta", desc: "Avaliar progressão de dose (7,5–10 mg)." },
      { mes: 6, titulo: "Meta e reavaliação geral", desc: "Avaliar meta de peso, exames finais e plano de manutenção." },
    ],
  },
  manutencao3m: {
    nome: "Manutenção — 3 meses",
    duracaoMeses: 3,
    marcos: [
      { mes: 0, titulo: "Início manutenção", desc: "Manter dose efetiva. Reforçar hábitos." },
      { mes: 1, titulo: "Check-in mensal", desc: "Peso, adesão e colaterais." },
      { mes: 2, titulo: "Check-in mensal", desc: "Peso, adesão e colaterais." },
      { mes: 3, titulo: "Reavaliação", desc: "Exames e decisão de continuidade." },
    ],
  },
  intensivo12m: {
    nome: "Acompanhamento completo — 12 meses",
    duracaoMeses: 12,
    marcos: [
      { mes: 0, titulo: "Início — 2,5 mg", desc: "Dose inicial e orientações." },
      { mes: 1, titulo: "Titular para 5 mg", desc: "Avaliar tolerância." },
      { mes: 3, titulo: "Exames de controle", desc: "Painel metabólico, hormonal e hepático." },
      { mes: 6, titulo: "Reavaliação semestral", desc: "Meta intermediária + exames." },
      { mes: 9, titulo: "Ajuste de protocolo", desc: "Revisar dose e suplementação." },
      { mes: 12, titulo: "Encerramento de ciclo", desc: "Exames finais, meta e manutenção." },
    ],
  },
};

function addMeses(dataIso, meses) {
  const d = new Date(dataIso + "T12:00:00");
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}
function fmtBr(iso) {
  if (!iso) return "—";
  try { return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return iso; }
}
function diasEntre(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

export default function PlanoAcompanhamento({ pacienteId, pacienteNome }) {
  const { getPaciente, editarPaciente } = useStore();
  const toast = useToast();
  const paciente = getPaciente(pacienteId);

  const [plano, setPlano] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);

  useEffect(() => {
    if (paciente?.plano) setPlano(paciente.plano);
    else setPlano(null);
  }, [pacienteId]);

  const aplicarTemplate = (key) => {
    const t = TEMPLATES[key];
    const inicio = paciente?.inicio || new Date().toISOString().slice(0, 10);
    setPlano({
      inicio,
      duracaoMeses: t.duracaoMeses,
      titulo: t.nome,
      marcos: t.marcos.map((m, i) => ({
        id: `m${i}`,
        data: addMeses(inicio, m.mes),
        titulo: m.titulo,
        desc: m.desc,
        concluido: false,
      })),
    });
    setSujo(true);
  };

  const criarVazio = () => {
    const inicio = paciente?.inicio || new Date().toISOString().slice(0, 10);
    setPlano({ inicio, duracaoMeses: 6, titulo: "Plano de acompanhamento", marcos: [] });
    setSujo(true);
  };

  const set = (patch) => { setPlano((p) => ({ ...p, ...patch })); setSujo(true); };
  const setMarco = (id, patch) => { setPlano((p) => ({ ...p, marcos: p.marcos.map((m) => m.id === id ? { ...m, ...patch } : m) })); setSujo(true); };
  const addMarco = () => {
    const novo = { id: `m${Date.now()}`, data: plano.inicio, titulo: "", desc: "", concluido: false };
    setPlano((p) => ({ ...p, marcos: [...p.marcos, novo] })); setSujo(true);
  };
  const removerMarco = (id) => { setPlano((p) => ({ ...p, marcos: p.marcos.filter((m) => m.id !== id) })); setSujo(true); };

  const salvar = async () => {
    setSalvando(true);
    try {
      await editarPaciente(pacienteId, { plano });
      toast("Plano salvo.");
      setSujo(false);
    } catch (e) { console.error(e); toast("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  const excluirPlano = async () => {
    if (!window.confirm("Excluir o plano de acompanhamento?")) return;
    setSalvando(true);
    try {
      await editarPaciente(pacienteId, { plano: null });
      setPlano(null); setSujo(false);
      toast("Plano excluído.");
    } catch (e) { console.error(e); toast("Erro ao excluir."); }
    finally { setSalvando(false); }
  };

  // ── Estado vazio: escolher template ou criar do zero ──
  if (!plano) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Plano de Acompanhamento</h2>
          <p style={{ fontSize: 13, color: "var(--inkFaint)", margin: "4px 0 0" }}>
            Defina início, duração e marcos do tratamento{pacienteNome ? ` de ${pacienteNome}` : ""}.
          </p>
        </div>
        <div className="card" style={{ padding: "32px 24px", textAlign: "center", marginBottom: 16 }}>
          <Target size={36} color="var(--inkFaint)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum plano criado</div>
          <div style={{ fontSize: 13, color: "var(--inkFaint)", marginBottom: 20 }}>Use um template pronto ou monte do zero.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420, margin: "0 auto" }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button key={key} onClick={() => aplicarTemplate(key)} className="btn btn-ghost"
                style={{ justifyContent: "space-between", padding: "14px 18px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Sparkles size={15} color="var(--brand)" /> {t.nome}
                </span>
                <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{t.duracaoMeses} meses</span>
              </button>
            ))}
            <button onClick={criarVazio} className="btn btn-primary" style={{ justifyContent: "center", padding: "14px", marginTop: 4 }}>
              <Plus size={15} /> Criar plano do zero
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Cálculos de progresso ──
  const termino = addMeses(plano.inicio, plano.duracaoMeses);
  const hoje = new Date().toISOString().slice(0, 10);
  const totalDias = Math.max(1, diasEntre(plano.inicio, termino));
  const decorrido = Math.min(totalDias, Math.max(0, diasEntre(plano.inicio, hoje)));
  const pctTempo = Math.round((decorrido / totalDias) * 100);
  const mesAtual = Math.max(0, Math.min(plano.duracaoMeses, Math.floor(decorrido / 30)));
  const marcosConcluidos = plano.marcos.filter((m) => m.concluido).length;
  const pctMarcos = plano.marcos.length ? Math.round((marcosConcluidos / plano.marcos.length) * 100) : 0;

  const inp = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Plano de Acompanhamento</h2>
          <p style={{ fontSize: 13, color: "var(--inkFaint)", margin: "4px 0 0" }}>{plano.titulo}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={excluirPlano} className="btn btn-ghost" style={{ color: "var(--danger, #d64545)" }}><Trash2 size={15} /> Excluir</button>
          <button onClick={salvar} disabled={salvando || !sujo} className="btn btn-primary" style={{ opacity: sujo ? 1 : 0.5 }}>
            {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : sujo ? <><Save size={15} /> Salvar</> : <><Check size={15} /> Salvo</>}
          </button>
        </div>
      </div>

      {/* Resumo de progresso */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.4 }}>Início</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{fmtBr(plano.inicio)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.4 }}>Término previsto</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{fmtBr(termino)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.4 }}>Fase atual</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>Mês {mesAtual} de {plano.duracaoMeses}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.4 }}>Marcos</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>{marcosConcluidos}/{plano.marcos.length}</div>
          </div>
        </div>

        {/* Barra de tempo */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 5 }}>
            <span>Progresso do tempo</span><span>{pctTempo}%</span>
          </div>
          <div style={{ height: 8, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${pctTempo}%`, height: "100%", background: "var(--brand)", borderRadius: 99, transition: "width .3s" }} />
          </div>
        </div>
        {/* Barra de marcos */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 5 }}>
            <span>Marcos concluídos</span><span>{pctMarcos}%</span>
          </div>
          <div style={{ height: 8, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${pctMarcos}%`, height: "100%", background: "var(--good, #22c55e)", borderRadius: 99, transition: "width .3s" }} />
          </div>
        </div>
      </div>

      {/* Configuração de início/duração */}
      <div className="card" style={{ padding: "18px 22px", marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="field">
          <label>Data de início</label>
          <input type="date" value={plano.inicio} onChange={(e) => set({ inicio: e.target.value })} style={{ ...inp, width: "100%" }} />
        </div>
        <div className="field">
          <label>Duração prevista (meses)</label>
          <input type="number" min="1" max="36" value={plano.duracaoMeses} onChange={(e) => set({ duracaoMeses: Math.max(1, Number(e.target.value) || 1) })} style={{ ...inp, width: "100%" }} />
        </div>
      </div>

      {/* Timeline de marcos */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Marcos do tratamento</span>
          <button onClick={addMarco} className="btn btn-ghost" style={{ fontSize: 13 }}><Plus size={14} /> Adicionar marco</button>
        </div>

        {plano.marcos.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--inkFaint)", textAlign: "center", padding: "20px 0" }}>
            Nenhum marco. Adicione etapas ao tratamento.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...plano.marcos].sort((a, b) => (a.data || "").localeCompare(b.data || "")).map((m) => {
              const atrasado = !m.concluido && m.data && m.data < hoje;
              return (
                <div key={m.id} style={{ display: "flex", gap: 12, padding: "14px 16px", background: "var(--surface2)", borderRadius: 10, borderLeft: `3px solid ${m.concluido ? "var(--good,#22c55e)" : atrasado ? "var(--warn,#e6a817)" : "var(--line)"}` }}>
                  <button onClick={() => setMarco(m.id, { concluido: !m.concluido })} style={{ flexShrink: 0, marginTop: 2 }}>
                    {m.concluido ? <CircleCheck size={20} color="var(--good,#22c55e)" /> : <Circle size={20} color="var(--inkFaint)" />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input value={m.titulo} onChange={(e) => setMarco(m.id, { titulo: e.target.value })} placeholder="Título do marco"
                      style={{ border: "none", background: "transparent", fontSize: 14, fontWeight: 600, width: "100%", padding: 0, color: "var(--ink)", textDecoration: m.concluido ? "line-through" : "none", opacity: m.concluido ? 0.6 : 1 }} />
                    <input value={m.desc} onChange={(e) => setMarco(m.id, { desc: e.target.value })} placeholder="Descrição"
                      style={{ border: "none", background: "transparent", fontSize: 12.5, color: "var(--inkSoft)", width: "100%", padding: "2px 0 0", marginTop: 2 }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <Calendar size={13} color="var(--inkFaint)" />
                      <input type="date" value={m.data} onChange={(e) => setMarco(m.id, { data: e.target.value })}
                        style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "4px 8px", fontSize: 12, background: "var(--surface)" }} />
                      {atrasado && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--warn,#e6a817)", fontWeight: 600 }}><Clock size={11} /> atrasado</span>}
                    </div>
                  </div>
                  <button onClick={() => removerMarco(m.id)} style={{ flexShrink: 0, color: "var(--inkFaint)", padding: 4, height: "fit-content" }}><X size={15} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button onClick={salvar} disabled={salvando || !sujo} className="btn btn-primary" style={{ opacity: sujo ? 1 : 0.5 }}>
          {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : sujo ? <><Save size={15} /> Salvar plano</> : <><Check size={15} /> Tudo salvo</>}
        </button>
      </div>
    </div>
  );
}
