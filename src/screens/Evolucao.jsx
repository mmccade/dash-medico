// src/screens/Evolucao.jsx
// Alteração: adicionado filtro de data (ciclo de/até) antes de exportar PDF.
// O usuário seleciona o intervalo de ciclos e o PDF é gerado apenas com esse recorte.

import { useState } from "react";
import { TrendingUp, FileDown, Filter } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { imc, br } from "../lib/utils.js";
import { LinhaChart } from "../components/charts.jsx";
import { useIsMobile } from "../components/Shell.jsx";
import { baixarPdfEvolucao, textoResumo } from "../services/pdf.js";

export default function Evolucao() {
  const { pacientes, config } = useStore();
  const toast = useToast();
  const isMobile = useIsMobile();
  const [pid, setPid] = useState("");
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);

  // Filtro de data para PDF
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const elegiveis = pacientes.filter((p) => p.ciclos.length > 0);
  const p = elegiveis.find((x) => x.id === +pid || x.id === pid);

  const gerarPdf = async () => {
    if (!p) return;
    toast("Gerando evolução em PDF…");
    try {
      // Filtra ciclos pelo intervalo de data selecionado
      let pacienteParaPdf = p;
      if (dataInicio || dataFim) {
        const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
        const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;

        const ciclosFiltrados = p.ciclos.filter((c) => {
          // Tenta parsear a data do ciclo (campo "data" ou "mes" como "YYYY-MM")
          const dataCiclo = c.data
            ? new Date(c.data)
            : c.mes
            ? new Date(c.mes + "-01")
            : null;
          if (!dataCiclo) return true; // sem data, inclui
          if (inicio && dataCiclo < inicio) return false;
          if (fim && dataCiclo > fim) return false;
          return true;
        });

        if (ciclosFiltrados.length === 0) {
          toast("Nenhum ciclo no período selecionado");
          return;
        }
        pacienteParaPdf = { ...p, ciclos: ciclosFiltrados };
      }

      await baixarPdfEvolucao(pacienteParaPdf, config);
      toast("Evolução gerada");
    } catch (e) {
      console.error(e);
      toast("Erro ao gerar PDF");
    }
  };

  let ia = a, ib = b;
  if (p) {
    if (ia == null || ia >= p.ciclos.length) ia = 0;
    if (ib == null || ib >= p.ciclos.length) ib = p.ciclos.length - 1;
  }

  const inputStyle = {
    padding: "9px 12px", borderRadius: 9,
    border: "1px solid var(--line)", background: "var(--surface)",
    fontSize: 13, color: "var(--ink)",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 6 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Evolução do paciente</h1>
        {p && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Botão de filtro de data */}
            <button
              className={`btn ${filtroAberto ? "btn-primary" : "btn-ghost"}`}
              style={{ width: isMobile ? "100%" : "auto" }}
              onClick={() => setFiltroAberto(!filtroAberto)}
            >
              <Filter size={15} /> Filtrar período
            </button>
            <button
              className="btn btn-primary"
              style={{ width: isMobile ? "100%" : "auto" }}
              onClick={gerarPdf}
            >
              <FileDown size={16} /> Baixar PDF de evolução
            </button>
          </div>
        )}
      </div>

      <p className="page-sub" style={{ marginBottom: 22 }}>Selecione um paciente e compare os indicadores ao longo dos meses.</p>

      {/* Painel de filtro de data — aparece ao clicar em "Filtrar período" */}
      {p && filtroAberto && (
        <div style={{
          background: "var(--surface2)", border: "1px solid var(--line)",
          borderRadius: 12, padding: "16px 18px", marginBottom: 20,
          display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end",
        }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => { setDataInicio(""); setDataFim(""); }}
            style={{ fontSize: 13 }}
          >
            Limpar
          </button>
          {(dataInicio || dataFim) && (
            <span style={{ fontSize: 12, color: "var(--brand)", alignSelf: "center" }}>
              Filtro ativo — PDF será gerado com ciclos do período selecionado
            </span>
          )}
        </div>
      )}

      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>Paciente</label>
        <select value={pid} onChange={(e) => { setPid(e.target.value); setA(null); setB(null); setDataInicio(""); setDataFim(""); setFiltroAberto(false); }}
          style={{ width: "100%", maxWidth: 380, padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, fontWeight: 500 }}>
          <option value="">Selecione um paciente…</option>
          {elegiveis.map((px) => (
            <option key={px.id} value={px.id}>{px.nome}</option>
          ))}
        </select>
      </div>

      {!p && (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--inkFaint)" }}>
          Selecione um paciente para visualizar a evolução.
        </div>
      )}

      {p && (() => {
        const ciclos = p.ciclos;
        const f = ciclos[ia], u = ciclos[ib];
        if (!f || !u) return null;

        const serie = ciclos.map((c) => ({
          x: c.mes,
          peso: c.peso,
          imc: imc(c.peso, p.altura),
          gordura: c.gordura,
          visceral: c.visceral,
        }));

        const serieFiltrada = serie.slice(ia, ib + 1);

        const Stat = ({ label, v1, v2, unit, bom }) => {
          const diff = +(v2 - v1).toFixed(1);
          const positivo = bom === "baixo" ? diff < 0 : diff > 0;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{label}</span>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{br(v2.toFixed(1))}{unit}</span>
              <span style={{ fontSize: 13, color: diff === 0 ? "var(--inkFaint)" : positivo ? "var(--good)" : "var(--bad, #e74c3c)", fontWeight: 600 }}>
                {diff > 0 ? "+" : ""}{br(diff.toFixed(1))}{unit} desde o início
              </span>
            </div>
          );
        };

        return (
          <>
            {/* Seletor de intervalo de comparação */}
            <div className="card" style={{ marginBottom: 18, padding: "16px 18px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Ciclo inicial</label>
                <select value={ia} onChange={(e) => setA(+e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 500 }}>
                  {ciclos.map((c, i) => <option key={i} value={i}>Mês {c.mes} — {br(c.peso.toFixed(1))} kg</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Ciclo final</label>
                <select value={ib} onChange={(e) => setB(+e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 500 }}>
                  {ciclos.map((c, i) => <option key={i} value={i}>Mês {c.mes} — {br(c.peso.toFixed(1))} kg</option>)}
                </select>
              </div>
            </div>

            {/* Stats de comparação */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
              <div className="card" style={{ padding: "18px 20px" }}>
                <Stat label="Peso" v1={f.peso} v2={u.peso} unit=" kg" bom="baixo" />
              </div>
              <div className="card" style={{ padding: "18px 20px" }}>
                <Stat label="IMC" v1={imc(f.peso, p.altura)} v2={imc(u.peso, p.altura)} unit="" bom="baixo" />
              </div>
              {f.gordura != null && u.gordura != null && (
                <div className="card" style={{ padding: "18px 20px" }}>
                  <Stat label="Gordura corporal" v1={f.gordura} v2={u.gordura} unit="%" bom="baixo" />
                </div>
              )}
              {f.visceral != null && u.visceral != null && (
                <div className="card" style={{ padding: "18px 20px" }}>
                  <Stat label="Gordura visceral" v1={f.visceral} v2={u.visceral} unit="" bom="baixo" />
                </div>
              )}
            </div>

            {/* Resumo textual */}
            <div className="card" style={{ padding: "16px 20px", marginBottom: 20, fontSize: 14, lineHeight: 1.7, color: "var(--inkSoft)" }}>
              {textoResumo(p, ia, ib)}
            </div>

            {/* Gráficos */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div className="card" style={{ padding: "18px 16px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Peso (kg)</div>
                <LinhaChart data={serieFiltrada} xKey="x" yKey="peso" cor="var(--brand)" />
              </div>
              <div className="card" style={{ padding: "18px 16px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>IMC</div>
                <LinhaChart data={serieFiltrada} xKey="x" yKey="imc" cor="var(--good)" />
              </div>
              {serieFiltrada.some((s) => s.gordura != null) && (
                <div className="card" style={{ padding: "18px 16px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Gordura (%)</div>
                  <LinhaChart data={serieFiltrada} xKey="x" yKey="gordura" cor="#f39c12" />
                </div>
              )}
              {serieFiltrada.some((s) => s.visceral != null) && (
                <div className="card" style={{ padding: "18px 16px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Gordura visceral</div>
                  <LinhaChart data={serieFiltrada} xKey="x" yKey="visceral" cor="#e74c3c" />
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
