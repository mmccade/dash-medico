// src/screens/Ficha.jsx
import { useState } from "react";
import { ArrowLeft, Stethoscope, FileText, ChevronDown } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { imc, br, fmtData, primeiroCiclo, ultimoCiclo, perdaPeso, mesesTrat } from "../lib/utils.js";
import { Avatar } from "../components/ui.jsx";
import { LinhaChart } from "../components/charts.jsx";
import { useIsMobile } from "../components/Shell.jsx";
import { baixarPdfPaciente } from "../services/pdf.js";

export default function Ficha({ pacienteId, navegar }) {
  const { getPaciente, config } = useStore();
  const toast = useToast();
  const isMobile = useIsMobile();
  const p = getPaciente(pacienteId);
  const [aberto, setAberto] = useState(p && p.ciclos.length ? p.ciclos.length - 1 : -1);

  if (!p) { navegar("pacientes"); return null; }

  const gerarPdf = async () => {
    if (!p.ciclos.length) { toast("Paciente sem ciclos registrados"); return; }
    toast("Gerando ficha em PDF…");
    try { await baixarPdfPaciente(p, config); toast("Ficha gerada"); }
    catch (e) { console.error(e); toast("Erro ao gerar PDF"); }
  };

  const Header = (
    <>
      <button onClick={() => navegar("pacientes")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13, marginBottom: 18 }}>
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar nome={p.nome} lg />
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, letterSpacing: -0.3, marginBottom: 5, wordBreak: "break-word" }}>{p.nome}</h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--inkSoft)" }}>
              <span>{p.idade} anos</span><span>·</span><span>{p.sexo}</span><span>·</span>
              <span>{br(p.altura.toFixed(2))} m</span><span>·</span><span>Início {fmtData(p.inicio)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto" }}>
          <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={() => navegar("novociclo", p.id)}>
            <Stethoscope size={16} /> Novo ciclo
          </button>
          <button className="btn btn-primary" style={{ flex: isMobile ? 1 : "none" }} onClick={gerarPdf}>
            <FileText size={16} /> PDF do paciente
          </button>
        </div>
      </div>
      <div style={{ padding: "16px 18px", background: "var(--surface2)", borderRadius: 12, display: "flex", gap: isMobile ? 14 : 40, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", marginBottom: 24 }}>
        <div><div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Objetivo</div><div style={{ fontSize: 13.5 }}>{p.objetivo}</div></div>
        <div><div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Condições relatadas</div><div style={{ fontSize: 13.5 }}>{p.comorbidades}</div></div>
      </div>
    </>
  );

  if (!p.ciclos.length) {
    return (
      <div>
        {Header}
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum ciclo registrado ainda</div>
          <div className="page-sub" style={{ marginBottom: 18 }}>Registre o primeiro ciclo mensal para começar a acompanhar a evolução.</div>
          <button className="btn btn-primary" style={{ display: "inline-flex" }} onClick={() => navegar("novociclo", p.id)}>
            <Stethoscope size={16} /> Registrar primeiro ciclo
          </button>
        </div>
      </div>
    );
  }

  const f = primeiroCiclo(p), u = ultimoCiclo(p);
  const serie = p.ciclos.map((c) => ({ x: c.mes, peso: c.peso, imc: imc(c.peso, p.altura), gordura: c.gordura, visceral: c.visceral }));

  const Resumo = ({ label, value, unit, sub }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span className="tnum" style={{ fontSize: 26, fontWeight: 600 }}>{value}</span>
        {unit && <span style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{unit}</span>}
      </span>
      {sub && <span className="tnum" style={{ fontSize: 12, color: "var(--good)" }}>{sub}</span>}
    </div>
  );

  return (
    <div>
      {Header}
      <div className="card" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))", gap: isMobile ? 18 : 24, padding: "22px 24px", marginBottom: 28 }}>
        <Resumo label="Tempo" value={mesesTrat(p.inicio)} unit="meses" />
        <Resumo label="Peso atual" value={br(u.peso)} unit="kg" sub={`−${br(perdaPeso(p))} kg`} />
        <Resumo label="IMC" value={br(imc(u.peso, p.altura))} sub={`era ${br(imc(f.peso, p.altura))}`} />
        <Resumo label="% Gordura" value={br(u.gordura)} unit="%" sub={`−${br(+(f.gordura - u.gordura).toFixed(1))} p.p.`} />
        <Resumo label="Visceral" value={u.visceral} sub={`era ${f.visceral}`} />
      </div>

      <h2 className="sec-title">Evolução ao longo do tratamento</h2>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(230px, 1fr))", gap: isMobile ? 10 : 14, marginBottom: 32 }}>
        <LinhaChart data={serie} dataKey="peso" title="Peso" unit="kg" />
        <LinhaChart data={serie} dataKey="imc" title="IMC" unit="kg/m²" />
        <LinhaChart data={serie} dataKey="gordura" colorKey="gord" color="var(--gord)" title="% Gordura" unit="%" />
        <LinhaChart data={serie} dataKey="visceral" color="var(--visc)" title="Visceral" unit="nível" />
      </div>

      <h2 className="sec-title">Ciclos mensais</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {p.ciclos.map((c, i) => {
          const open = aberto === i;
          return (
            <div key={i} className="card" style={{ overflow: "hidden", borderColor: open ? "var(--brand)" : "var(--line)" }}>
              <button onClick={() => setAberto(open ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", textAlign: "left" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15.5, fontWeight: 600, minWidth: 62 }}>{c.mes}</span>
                  <span style={{ fontSize: 13, color: "var(--inkSoft)" }}>{br(c.peso)} kg · {br(c.gordura)}% gordura</span>
                  <span style={{ fontSize: 11.5, color: "var(--brand)", background: "var(--brandSoft)", padding: "3px 9px", borderRadius: 20, fontWeight: 600 }}>{br(c.doses[c.doses.length - 1])} {c.unidade.toLowerCase()} · {c.local}</span>
                </span>
                <ChevronDown size={18} style={{ color: "var(--inkFaint)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {open && (
                <div style={{ padding: "4px 20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Titulação da dose · semana a semana</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                      {c.doses.map((d, j) => (
                        <div key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                          <div style={{ width: "100%", height: 48, background: "var(--surface2)", borderRadius: 7, position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}>
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.min((d / 15) * 100, 100)}%`, background: "var(--brandSoft)", borderTop: "2px solid var(--brand)" }} />
                            <span className="tnum" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{br(d)}</span>
                          </div>
                          <span style={{ fontSize: 10.5, color: "var(--inkFaint)" }}>Sem {j + 1}</span>
                        </div>
                      ))}
                      <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600, paddingBottom: 22 }}>{c.unidade.toLowerCase()}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
                    <KV k="Suplementação" v={c.suplementacao} />
                    <KV k="Local de aplicação" v={c.local} />
                    <KV k="Colaterais relatados" v={c.colaterais} />
                  </div>
                  <KV k="Observações do médico" v={c.obs} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 4 }}>{k}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{v || "—"}</div>
    </div>
  );
}
