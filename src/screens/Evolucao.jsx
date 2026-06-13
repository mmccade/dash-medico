// src/screens/Evolucao.jsx
import { useState } from "react";
import { TrendingUp, FileDown } from "lucide-react";
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

  const elegiveis = pacientes.filter((p) => p.ciclos.length > 0);
  const p = elegiveis.find((x) => x.id === +pid);

  const gerarPdf = async () => {
    if (!p) return;
    toast("Gerando evolução em PDF…");
    try { await baixarPdfEvolucao(p, config); toast("Evolução gerada"); }
    catch (e) { console.error(e); toast("Erro ao gerar PDF"); }
  };

  let ia = a, ib = b;
  if (p) {
    if (ia == null || ia >= p.ciclos.length) ia = 0;
    if (ib == null || ib >= p.ciclos.length) ib = p.ciclos.length - 1;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 6 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Evolução do paciente</h1>
        {p && (
          <button className="btn btn-primary" style={{ width: isMobile ? "100%" : "auto" }} onClick={gerarPdf}>
            <FileDown size={16} /> Baixar PDF de evolução
          </button>
        )}
      </div>
      <p className="page-sub" style={{ marginBottom: 22 }}>Selecione um paciente e compare os indicadores ao longo dos meses.</p>

      <div style={{ marginBottom: 22 }}>
        <label style={{ display: "block", fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>Paciente</label>
        <select value={pid} onChange={(e) => { setPid(e.target.value); setA(null); setB(null); }}
          style={{ width: "100%", maxWidth: 380, padding: "11px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, fontWeight: 500 }}>
          <option value="">Selecione um paciente…</option>
          {elegiveis.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
        </select>
      </div>

      {!p ? (
        <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
          <TrendingUp size={32} style={{ color: "var(--inkFaint)", marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Selecione um paciente</div>
          <div className="page-sub">Escolha acima para comparar a evolução mês a mês.</div>
        </div>
      ) : (() => {
        const cA = p.ciclos[ia], cB = p.ciclos[ib];
        const DeltaCard = ({ lbl, valor, delta, unit }) => {
          const d = +delta.toFixed(1); const sinal = d > 0 ? "+" : "";
          const cor = d < 0 ? "var(--good)" : d > 0 ? "var(--warn)" : "var(--inkFaint)";
          return (
            <div style={{ background: "var(--surface2)", borderRadius: 11, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>{lbl}</div>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{valor}</div>
              <div className="tnum" style={{ fontSize: 13, fontWeight: 700, color: cor }}>{sinal}{br(d)} {unit}</div>
            </div>
          );
        };
        const serie = p.ciclos.map((c) => ({ x: c.mes, peso: c.peso, imc: imc(c.peso, p.altura), gordura: c.gordura, visceral: c.visceral }));
        return (
          <>
            <div className="card" style={{ padding: "20px 22px", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ flex: isMobile ? 1 : "none" }}>
                  <label style={{ display: "block", fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>De</label>
                  <select value={ia} onChange={(e) => setA(+e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, fontWeight: 600 }}>
                    {p.ciclos.map((c, i) => <option key={i} value={i}>{c.mes}</option>)}
                  </select>
                </div>
                <span style={{ color: "var(--inkFaint)", paddingBottom: 9 }}>→</span>
                <div style={{ flex: isMobile ? 1 : "none" }}>
                  <label style={{ display: "block", fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>Até</label>
                  <select value={ib} onChange={(e) => setB(+e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, fontWeight: 600 }}>
                    {p.ciclos.map((c, i) => <option key={i} value={i}>{c.mes}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(150px, 1fr))", gap: isMobile ? 10 : 14 }}>
                <DeltaCard lbl="Peso" valor={`${br(cA.peso)}→${br(cB.peso)} kg`} delta={cB.peso - cA.peso} unit="kg" />
                <DeltaCard lbl="IMC" valor={`${br(imc(cA.peso, p.altura))}→${br(imc(cB.peso, p.altura))}`} delta={imc(cB.peso, p.altura) - imc(cA.peso, p.altura)} unit="" />
                <DeltaCard lbl="% Gordura" valor={`${br(cA.gordura)}→${br(cB.gordura)}%`} delta={cB.gordura - cA.gordura} unit="p.p." />
                <DeltaCard lbl="Visceral" valor={`${cA.visceral}→${cB.visceral}`} delta={cB.visceral - cA.visceral} unit="" />
              </div>
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Resumo do período</div>
                <p style={{ fontSize: 14, lineHeight: 1.65 }}>{textoResumo(p, cA, cB)}</p>
              </div>
            </div>

            <h2 className="sec-title">Comparativo mês a mês</h2>
            <div className="card" style={{ overflowX: "auto", marginBottom: 32 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--inkFaint)", borderBottom: "1px solid var(--line)", background: "var(--surface2)", position: "sticky", left: 0 }}>Indicador</th>
                    {p.ciclos.map((c, i) => <th key={i} style={{ padding: "12px 14px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "var(--inkFaint)", borderBottom: "1px solid var(--line)", background: "var(--surface2)", whiteSpace: "nowrap" }}>{c.mes}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[["Peso (kg)", (c) => br(c.peso)], ["IMC", (c) => br(imc(c.peso, p.altura))], ["% Gordura", (c) => br(c.gordura)], ["Visceral", (c) => c.visceral], ["Dose final", (c) => br(c.doses[c.doses.length - 1]) + " " + c.unidade.toLowerCase()], ["Local", (c) => c.local]].map(([lbl, fn]) => (
                    <tr key={lbl}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, borderBottom: "1px solid var(--line)", position: "sticky", left: 0, background: "var(--surface)", whiteSpace: "nowrap" }}>{lbl}</td>
                      {p.ciclos.map((c, i) => <td key={i} className="tnum" style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{fn(c)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="sec-title">Gráficos de evolução</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(230px, 1fr))", gap: isMobile ? 10 : 14 }}>
              <LinhaChart data={serie} dataKey="peso" title="Peso" unit="kg" height={150} />
              <LinhaChart data={serie} dataKey="imc" title="IMC" unit="kg/m²" height={150} />
              <LinhaChart data={serie} dataKey="gordura" color="var(--gord)" title="% Gordura" unit="%" height={150} />
              <LinhaChart data={serie} dataKey="visceral" color="var(--visc)" title="Visceral" unit="nível" height={150} />
            </div>
          </>
        );
      })()}
    </div>
  );
}
