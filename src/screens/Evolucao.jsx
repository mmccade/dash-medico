// src/screens/Evolucao.jsx
// + Substitui o <select> por SeletorPaciente (abas Ativos/Inativos/Todos + busca + faixa idade)
// + Mantém o fluxo de comparação de ciclos e PDF

import { useState } from "react";
import { FileDown, Filter, ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { imc, br, massaMagraKg } from "../lib/utils.js";
import { LinhaChart } from "../components/charts.jsx";
import { useIsMobile } from "../components/Shell.jsx";
import { baixarPdfEvolucao, textoResumo } from "../services/pdf.js";
import SeletorPaciente from "../components/SeletorPaciente.jsx";
import { InputData } from "../components/inputs.jsx";

export default function Evolucao({ pacienteIdInicial }) {
  const { pacientes, config } = useStore();
  const toast = useToast();
  const isMobile = useIsMobile();
  const [pid, setPid] = useState(pacienteIdInicial || "");
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);

  const [filtroAberto, setFiltroAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const elegiveis = pacientes.filter((p) => p.ciclos.length > 0);
  const p = elegiveis.find((x) => x.id === pid || x.id === +pid || x.id === String(pid));

  const gerarPdf = async () => {
    if (!p) return;
    toast("Gerando evolução em PDF…");
    try {
      let pacienteParaPdf = p;
      if (dataInicio || dataFim) {
        const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
        const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
        const ciclosFiltrados = p.ciclos.filter((c) => {
          const dataCiclo = c.data ? new Date(c.data) : c.mes ? new Date(c.mes + "-01") : null;
          if (!dataCiclo) return true;
          if (inicio && dataCiclo < inicio) return false;
          if (fim && dataCiclo > fim) return false;
          return true;
        });
        if (ciclosFiltrados.length === 0) { toast("Nenhum ciclo no período selecionado"); return; }
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

  // Tela de seleção (quando ainda não escolheu paciente)
  if (!p) {
    return (
      <div>
        <h1 className="page-title" style={{ margin: 0 }}>Evolução do paciente</h1>
        <p className="page-sub" style={{ marginBottom: 22 }}>
          Selecione um paciente para visualizar e comparar os indicadores ao longo dos meses.
        </p>
        <SeletorPaciente
          pacientes={pacientes.filter((x) => x.ciclos.length > 0)}
          onSelecionar={(paciente) => { setPid(paciente.id); setA(null); setB(null); }}
        />
        {elegiveis.length === 0 && (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--inkFaint)", marginTop: 16 }}>
            Nenhum paciente tem ciclos registrados ainda.
          </div>
        )}
      </div>
    );
  }

  const ciclos = p.ciclos;
  const fInicial = ciclos[ia], uFinal = ciclos[ib];

  const serie = ciclos.map((c) => ({
    x: c.mes, peso: c.peso, imc: imc(c.peso, p.altura),
    gordura: c.gordura, visceral: c.visceral, magra: massaMagraKg(c),
  }));
  const serieFiltrada = serie.slice(ia, ib + 1);

  const Stat = ({ label, v1, v2, unit, bom }) => {
    const n1 = Number(v1), n2 = Number(v2);
    if (!isFinite(n1) || !isFinite(n2)) return null;
    const diff = +(n2 - n1).toFixed(1);
    const positivo = bom === "baixo" ? diff < 0 : diff > 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{br(n2.toFixed(1))}{unit}</span>
        <span style={{ fontSize: 13, color: diff === 0 ? "var(--inkFaint)" : positivo ? "var(--good)" : "var(--bad, #e74c3c)", fontWeight: 600 }}>
          {diff > 0 ? "+" : ""}{br(diff.toFixed(1))}{unit} desde o início
        </span>
      </div>
    );
  };

  return (
    <div>
      <button onClick={() => { setPid(""); setA(null); setB(null); setDataInicio(""); setDataFim(""); setFiltroAberto(false); }}
        style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13, marginBottom: 18 }}>
        <ArrowLeft size={15} /> Trocar paciente
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 6 }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Evolução · {p.nome}</h1>
          <p className="page-sub" style={{ margin: "4px 0 0" }}>{p.idade} anos · {p.sexo} · {p.ciclos.length} ciclo{p.ciclos.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className={`btn ${filtroAberto ? "btn-primary" : "btn-ghost"}`} style={{ width: isMobile ? "100%" : "auto" }} onClick={() => setFiltroAberto(!filtroAberto)}>
            <Filter size={15} /> Filtrar período
          </button>
          <button className="btn btn-primary" style={{ width: isMobile ? "100%" : "auto" }} onClick={gerarPdf}>
            <FileDown size={16} /> Baixar PDF
          </button>
        </div>
      </div>

      {filtroAberto && (
        <div style={{ background: "var(--surface2)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px", marginBottom: 20, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginTop: 18 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>De</label>
            <InputData value={dataInicio} onChange={setDataInicio} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Até</label>
            <InputData value={dataFim} onChange={setDataFim} />
          </div>
          <button className="btn btn-ghost" onClick={() => { setDataInicio(""); setDataFim(""); }} style={{ fontSize: 13 }}>
            Limpar
          </button>
          {(dataInicio || dataFim) && (
            <span style={{ fontSize: 12, color: "var(--brand)", alignSelf: "center" }}>
              Filtro ativo
            </span>
          )}
        </div>
      )}

      {!fInicial || !uFinal ? null : (
        <>
          {/* Seletor de intervalo */}
          <div className="card" style={{ marginBottom: 18, padding: "16px 18px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginTop: 18 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Ciclo inicial</label>
              <select value={ia} onChange={(e) => setA(+e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 500 }}>
                {ciclos.map((c, i) => <option key={i} value={i}>Mês {c.mes}{c.peso != null && c.peso !== "" ? ` — ${br(Number(c.peso).toFixed(1))} kg` : ""}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Ciclo final</label>
              <select value={ib} onChange={(e) => setB(+e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 500 }}>
                {ciclos.map((c, i) => <option key={i} value={i}>Mês {c.mes}{c.peso != null && c.peso !== "" ? ` — ${br(Number(c.peso).toFixed(1))} kg` : ""}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
            <div className="card" style={{ padding: "18px 20px" }}><Stat label="Peso" v1={fInicial.peso} v2={uFinal.peso} unit=" kg" bom="baixo" /></div>
            <div className="card" style={{ padding: "18px 20px" }}><Stat label="IMC" v1={imc(fInicial.peso, p.altura)} v2={imc(uFinal.peso, p.altura)} unit="" bom="baixo" /></div>
            {fInicial.gordura != null && uFinal.gordura != null && (
              <div className="card" style={{ padding: "18px 20px" }}><Stat label="Gordura corporal" v1={fInicial.gordura} v2={uFinal.gordura} unit="%" bom="baixo" /></div>
            )}
            {fInicial.visceral != null && uFinal.visceral != null && (
              <div className="card" style={{ padding: "18px 20px" }}><Stat label="Gordura visceral" v1={fInicial.visceral} v2={uFinal.visceral} unit="" bom="baixo" /></div>
            )}
            {massaMagraKg(fInicial) != null && massaMagraKg(uFinal) != null && (
              <div className="card" style={{ padding: "18px 20px" }}><Stat label="Massa magra" v1={massaMagraKg(fInicial)} v2={massaMagraKg(uFinal)} unit=" kg" bom="alto" /></div>
            )}
          </div>

          <div className="card" style={{ padding: "16px 20px", marginBottom: 20, fontSize: 14, lineHeight: 1.7, color: "var(--inkSoft)" }}>
            {textoResumo(p, ia, ib)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div className="card" style={{ padding: "18px 16px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Peso (kg)</div>
              <LinhaChart data={serieFiltrada} dataKey="peso" title="Peso" />
            </div>
            <div className="card" style={{ padding: "18px 16px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>IMC</div>
              <LinhaChart data={serieFiltrada} dataKey="imc" title="IMC" />
            </div>
            {serieFiltrada.some((s) => s.gordura != null) && (
              <div className="card" style={{ padding: "18px 16px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Gordura (%)</div>
                <LinhaChart data={serieFiltrada} dataKey="gordura" color="var(--gord)" title="% Gordura" />
              </div>
            )}
            {serieFiltrada.some((s) => s.visceral != null) && (
              <div className="card" style={{ padding: "18px 16px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Gordura visceral</div>
                <LinhaChart data={serieFiltrada} dataKey="visceral" color="var(--visc)" title="Visceral" />
              </div>
            )}
            {serieFiltrada.some((s) => s.magra != null) && (
              <div className="card" style={{ padding: "18px 16px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Massa magra (kg)</div>
                <LinhaChart data={serieFiltrada} dataKey="magra" color="var(--good)" title="Massa magra" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
