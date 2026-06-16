// src/screens/Relatorio.jsx
// Período personalizado, PDF, aba Metas Batidas, sem mensagem motivacional

import { useState, useMemo } from "react";
import {
  Calendar, TrendingDown, UserPlus, UserMinus, Activity,
  Trophy, FileText, ChevronDown, X
} from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { br, faixaEtaria, fmtData, imc, primeiroCiclo, ultimoCiclo } from "../lib/utils.js";
import { gerarPdfRelatorio } from "../services/pdf.js";

// ── Períodos pré-definidos ──────────────────────────────────────
const PERIODOS_PRESET = [
  { id: "7d",  label: "7 dias",   dias: 7 },
  { id: "15d", label: "15 dias",  dias: 15 },
  { id: "30d", label: "30 dias",  dias: 30 },
  { id: "3m",  label: "3 meses",  dias: 90 },
  { id: "6m",  label: "6 meses",  dias: 180 },
  { id: "12m", label: "12 meses", dias: 365 },
  { id: "max", label: "Máximo",   dias: null },
  { id: "custom", label: "Personalizado", dias: null },
];

const FAIXAS_LABEL = ["<30", "30-39", "40-49", "50-59", "60-69", "70+"];

function parseQualquerData(v) {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  return new Date(v);
}

function toIso(d) {
  return d ? d.toISOString().slice(0, 10) : "";
}

// ── Componente filtro de período ────────────────────────────────
function FiltroPeriodo({ periodo, setPeriodo, dataInicio, setDataInicio, dataFim, setDataFim }) {
  const [aberto, setAberto] = useState(false);

  const labelAtual = (() => {
    if (periodo === "custom") {
      if (dataInicio && dataFim) return `${fmtData(dataInicio)} → ${fmtData(dataFim)}`;
      return "Personalizado";
    }
    if (periodo === "max") return "Todo o período";
    return PERIODOS_PRESET.find(p => p.id === periodo)?.label ?? periodo;
  })();

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setAberto(!aberto)}
        className="btn btn-ghost"
        style={{ gap: 8, minWidth: 180 }}
      >
        <Calendar size={15} />
        <span>{labelAtual}</span>
        <ChevronDown size={14} style={{ marginLeft: "auto", transform: aberto ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {aberto && (
        <>
          <div onClick={() => setAberto(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
            background: "var(--surface)", borderRadius: 14, padding: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)", minWidth: 240,
            border: "1px solid var(--line)",
          }}>
            {PERIODOS_PRESET.map((p) => (
              <button
                key={p.id}
                onClick={() => { setPeriodo(p.id); if (p.id !== "custom") setAberto(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "9px 14px", borderRadius: 9, fontSize: 13.5, fontWeight: 500,
                  background: periodo === p.id ? "var(--brandSoft)" : "transparent",
                  color: periodo === p.id ? "var(--brand)" : "var(--ink)",
                }}
              >
                {p.label}
              </button>
            ))}

            {periodo === "custom" && (
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10, padding: "12px 14px 8px" }}>
                <div>
                  <div style={{ fontSize: 11.5, color: "var(--inkFaint)", fontWeight: 600, marginBottom: 5 }}>Data inicial</div>
                  <input
                    type="date" value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface2)", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: "var(--inkFaint)", fontWeight: 600, marginBottom: 5 }}>Data final</div>
                  <input
                    type="date" value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface2)", fontSize: 13, boxSizing: "border-box" }}
                  />
                </div>
                <button onClick={() => setAberto(false)} className="btn btn-primary" style={{ justifyContent: "center", marginTop: 4 }}>
                  Aplicar período
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── FaixaBar ────────────────────────────────────────────────────
function FaixaBar({ faixas, cor }) {
  const max = Math.max(1, ...Object.values(faixas));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {FAIXAS_LABEL.map((f) => {
        const v = faixas[f] || 0;
        const pct = (v / max) * 100;
        return (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "var(--inkFaint)", minWidth: 50, fontWeight: 600 }}>{f}</span>
            <div style={{ flex: 1, height: 8, background: "var(--surface2)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 99, transition: "width 0.3s" }} />
            </div>
            <span className="tnum" style={{ fontSize: 12.5, color: "var(--inkSoft)", minWidth: 22, textAlign: "right", fontWeight: 600 }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Card stat ───────────────────────────────────────────────────
function Card({ Icon, label, valor, cor, sub }) {
  return (
    <div className="card" style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon size={16} color={cor || "var(--inkFaint)"} />
        <span style={{ fontSize: 12.5, color: "var(--inkFaint)", fontWeight: 600 }}>{label}</span>
      </div>
      <div className="tnum" style={{ fontSize: 28, fontWeight: 700, color: cor || "var(--ink)" }}>{valor}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--inkFaint)" }}>{sub}</div>}
    </div>
  );
}

// ── Aba Metas Batidas ────────────────────────────────────────────
function MetasBatidas({ pacientes }) {
  const metaBatidos = useMemo(() => {
    return pacientes
      .filter(p => p.ciclos && p.ciclos.length > 0)
      .filter(p => {
        const u = ultimoCiclo(p);
        const pesoBatido = p.pesoMeta && u.peso <= p.pesoMeta;
        const visceralBatido = p.visceralMeta && u.visceral != null && u.visceral <= p.visceralMeta;
        return pesoBatido || visceralBatido;
      })
      .map(p => {
        const u = ultimoCiclo(p);
        const f0 = primeiroCiclo(p);
        return {
          p,
          pesoBatido: p.pesoMeta && u.peso <= p.pesoMeta,
          visceralBatido: p.visceralMeta && u.visceral != null && u.visceral <= p.visceralMeta,
          perdaPeso: f0 && u ? +(f0.peso - u.peso).toFixed(1) : null,
          imcAtual: u.peso && p.altura ? imc(u.peso, p.altura) : null,
        };
      });
  }, [pacientes]);

  if (metaBatidos.length === 0) {
    return (
      <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <Trophy size={32} color="var(--inkFaint)" style={{ margin: "0 auto 12px" }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhuma meta batida ainda</div>
        <p className="page-sub">Quando um paciente atingir sua meta de peso ou gordura visceral, aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Trophy size={18} color="var(--good)" />
        <span style={{ fontSize: 14, fontWeight: 700 }}>{metaBatidos.length} {metaBatidos.length === 1 ? "paciente" : "pacientes"} com meta{metaBatidos.length === 1 ? "" : "s"} batida{metaBatidos.length === 1 ? "" : "s"}</span>
      </div>
      {metaBatidos.map(({ p, pesoBatido, visceralBatido, perdaPeso, imcAtual }) => (
        <div key={p.id} className="card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.nome}</div>
              <div style={{ fontSize: 12.5, color: "var(--inkSoft)" }}>
                {p.idade} anos · {p.sexo} · Início {fmtData(p.inicio)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {pesoBatido && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "var(--goodSoft, #d1f5e8)", color: "var(--good)" }}>
                  ✓ Meta de peso
                </span>
              )}
              {visceralBatido && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "var(--goodSoft, #d1f5e8)", color: "var(--good)" }}>
                  ✓ Meta visceral
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 14, padding: "12px 14px", background: "var(--surface2)", borderRadius: 10 }}>
            {p.pesoMeta && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 3 }}>Peso atual / meta</div>
                <div className="tnum" style={{ fontSize: 15, fontWeight: 700 }}>
                  {br(ultimoCiclo(p).peso)} kg <span style={{ color: "var(--inkFaint)", fontWeight: 400 }}>/ {br(p.pesoMeta)} kg</span>
                </div>
              </div>
            )}
            {perdaPeso !== null && perdaPeso > 0 && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 3 }}>Total eliminado</div>
                <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: "var(--good)" }}>−{br(perdaPeso)} kg</div>
              </div>
            )}
            {imcAtual && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 3 }}>IMC atual</div>
                <div className="tnum" style={{ fontSize: 15, fontWeight: 700 }}>{br(imcAtual)}</div>
              </div>
            )}
            {p.visceralMeta && (
              <div>
                <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 3 }}>Visceral atual / meta</div>
                <div className="tnum" style={{ fontSize: 15, fontWeight: 700 }}>
                  {ultimoCiclo(p).visceral ?? "—"} <span style={{ color: "var(--inkFaint)", fontWeight: 400 }}>/ {p.visceralMeta}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tela principal ───────────────────────────────────────────────
export default function Relatorio() {
  const { pacientes, config } = useStore();
  const [periodo, setPeriodo] = useState("30d");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [aba, setAba] = useState("resumo"); // "resumo" | "metas"
  const [gerando, setGerando] = useState(false);

  // Calcula intervalo efetivo
  const { limite, hoje, labelPeriodo } = useMemo(() => {
    const hoje = new Date();
    let limite = null;
    let labelPeriodo = "";

    if (periodo === "custom" && dataInicio && dataFim) {
      limite = new Date(dataInicio + "T00:00:00");
      labelPeriodo = `${fmtData(dataInicio)} a ${fmtData(dataFim)}`;
    } else if (periodo === "max") {
      limite = new Date("2000-01-01");
      labelPeriodo = "Todo o período";
    } else {
      const preset = PERIODOS_PRESET.find(p => p.id === periodo);
      if (preset?.dias) {
        limite = new Date(hoje.getTime() - preset.dias * 86400000);
        labelPeriodo = `Últimos ${preset.label}`;
      }
    }

    return { limite, hoje, labelPeriodo };
  }, [periodo, dataInicio, dataFim]);

  const dados = useMemo(() => {
    if (!limite) return null;

    const fimEfetivo = (periodo === "custom" && dataFim)
      ? new Date(dataFim + "T23:59:59")
      : hoje;

    let kgGorduraTotal = 0;
    let pesoTotalReduzido = 0;
    const novosNoPeriodo = [];
    const inativosNoPeriodo = [];
    let ciclosNoPeriodo = 0;

    pacientes.forEach((p) => {
      const dInicio = parseQualquerData(p.inicio);
      if (dInicio && dInicio >= limite && dInicio <= fimEfetivo) novosNoPeriodo.push(p);

      const dDes = parseQualquerData(p.desativadoEm);
      if (!p.ativo && dDes && dDes >= limite && dDes <= fimEfetivo) inativosNoPeriodo.push(p);

      if (p.ciclos && p.ciclos.length) {
        p.ciclos.forEach((c) => {
          const dC = parseQualquerData(c.data);
          if (dC && dC >= limite && dC <= fimEfetivo) ciclosNoPeriodo++;
        });

        const ciclosOrdenados = [...p.ciclos].sort((a, b) => {
          const da = parseQualquerData(a.data) || 0;
          const db = parseQualquerData(b.data) || 0;
          return da - db;
        });
        const primeiroNoPeriodo = ciclosOrdenados.findIndex((c) => {
          const dC = parseQualquerData(c.data);
          return dC && dC >= limite && dC <= fimEfetivo;
        });
        if (primeiroNoPeriodo !== -1) {
          const base = primeiroNoPeriodo > 0 ? ciclosOrdenados[primeiroNoPeriodo - 1] : ciclosOrdenados[primeiroNoPeriodo];
          const ultimo = ciclosOrdenados[ciclosOrdenados.length - 1];
          if (base && ultimo && base !== ultimo) {
            const reducaoPeso = base.peso - ultimo.peso;
            if (reducaoPeso > 0) pesoTotalReduzido += reducaoPeso;
            if (base.gordura != null && ultimo.gordura != null) {
              const gA = (base.peso * base.gordura) / 100;
              const gB = (ultimo.peso * ultimo.gordura) / 100;
              const dif = gA - gB;
              if (dif > 0) kgGorduraTotal += dif;
            }
          }
        }
      }
    });

    const contarFaixas = (lista) => {
      const out = Object.fromEntries(FAIXAS_LABEL.map((f) => [f, 0]));
      lista.forEach((p) => {
        const fa = faixaEtaria(p.idade || 0);
        if (out[fa] != null) out[fa]++;
      });
      return out;
    };

    return {
      novos: novosNoPeriodo.length,
      inativos: inativosNoPeriodo.length,
      ciclos: ciclosNoPeriodo,
      kgGordura: +kgGorduraTotal.toFixed(1),
      pesoTotal: +pesoTotalReduzido.toFixed(1),
      faixasNovos: contarFaixas(novosNoPeriodo),
      faixasInativos: contarFaixas(inativosNoPeriodo),
    };
  }, [pacientes, limite, hoje, periodo, dataFim]);

  const handleGerarPdf = async () => {
    if (!dados) return;
    setGerando(true);
    try {
      await gerarPdfRelatorio({ dados, labelPeriodo, config, pacientes });
    } catch (e) {
      console.error("Erro ao gerar PDF do relatório", e);
    }
    setGerando(false);
  };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Relatório</h1>
          <p className="page-sub">Resumo do seu trabalho no período selecionado.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleGerarPdf}
          disabled={gerando || !dados}
          style={{ alignSelf: "flex-end" }}
        >
          <FileText size={15} /> {gerando ? "Gerando…" : "Exportar PDF"}
        </button>
      </div>

      {/* Filtro de período */}
      <FiltroPeriodo
        periodo={periodo} setPeriodo={setPeriodo}
        dataInicio={dataInicio} setDataInicio={setDataInicio}
        dataFim={dataFim} setDataFim={setDataFim}
      />

      {/* Abas */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3, alignSelf: "flex-start" }}>
        {[["resumo", "Resumo"], ["metas", "Metas batidas"]].map(([id, label]) => (
          <button key={id} onClick={() => setAba(id)} style={{
            borderRadius: 8, padding: "9px 18px", fontSize: 13.5, fontWeight: 600,
            background: aba === id ? "var(--surface)" : "transparent",
            color: aba === id ? "var(--brand)" : "var(--inkFaint)",
            boxShadow: aba === id ? "0 1px 2px rgba(0,0,0,.06)" : "none",
            display: "flex", alignItems: "center", gap: 7,
          }}>
            {id === "metas" && <Trophy size={14} />}
            {label}
          </button>
        ))}
      </div>

      {aba === "metas" ? (
        <MetasBatidas pacientes={pacientes} />
      ) : dados ? (
        <>
          {/* Stats principais */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <Card Icon={UserPlus}     label="Novos pacientes"    valor={dados.novos}    cor="var(--good)" />
            <Card Icon={UserMinus}    label="Desativados"        valor={dados.inativos} cor="var(--warn)" />
            <Card Icon={Activity}     label="Ciclos no período"  valor={dados.ciclos}   cor="var(--brand)" />
            <Card Icon={TrendingDown} label="Peso eliminado total" valor={`${br(dados.pesoTotal.toFixed(1))} kg`} cor="var(--brand)" sub="Soma de todos os pacientes" />
          </div>

          {/* Faixas etárias */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="card" style={{ padding: "20px 22px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={15} color="var(--good)" /> Faixa etária — novos
              </h3>
              {dados.novos === 0 ? (
                <p style={{ fontSize: 13, color: "var(--inkFaint)" }}>Nenhum novo paciente no período.</p>
              ) : (
                <FaixaBar faixas={dados.faixasNovos} cor="var(--good)" />
              )}
            </div>
            <div className="card" style={{ padding: "20px 22px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <UserMinus size={15} color="var(--warn)" /> Faixa etária — inativos
              </h3>
              {dados.inativos === 0 ? (
                <p style={{ fontSize: 13, color: "var(--inkFaint)" }}>Nenhum desativado no período.</p>
              ) : (
                <FaixaBar faixas={dados.faixasInativos} cor="var(--warn)" />
              )}
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: "var(--inkFaint)", lineHeight: 1.6, textAlign: "center", padding: "8px 16px" }}>
            Os números são calculados a partir dos dados registrados no sistema. Peso eliminado considera a diferença entre o primeiro e o último ciclo de cada paciente dentro do período.
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: "40px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 13.5, color: "var(--inkFaint)" }}>Selecione um período para visualizar os dados.</p>
        </div>
      )}
    </div>
  );
}
