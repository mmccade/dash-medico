// src/screens/Dashboard.jsx
import { useStore } from "../lib/store.jsx";
import { ultimoCiclo, perdaPeso, mesesTrat, novoEsteMes, br } from "../lib/utils.js";
import { StatCard, Avatar } from "../components/ui.jsx";
import { BarraChart } from "../components/charts.jsx";

export default function Dashboard({ navegar }) {
  const { pacientes } = useStore();
  const ativos = pacientes.filter((p) => p.ativo);
  const comCiclo = ativos.filter((p) => p.ciclos.length > 0);
  const novos = pacientes.filter((p) => novoEsteMes(p.inicio));
  const mIdade = Math.round(pacientes.reduce((s, p) => s + p.idade, 0) / pacientes.length);
  const pesos = comCiclo.map((p) => ultimoCiclo(p).peso);
  const mPeso = pesos.length ? +(pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : 0;
  const perdas = ativos.filter((p) => p.ciclos.length > 1).map(perdaPeso);
  const mPerda = perdas.length ? +(perdas.reduce((a, b) => a + b, 0) / perdas.length).toFixed(1) : 0;

  const perdaPorPac = ativos.filter((p) => p.ciclos.length > 1)
    .map((p) => ({ x: p.nome.split(" ")[0], v: perdaPeso(p) }))
    .sort((a, b) => b.v - a.v);

  const porMes = {};
  pacientes.forEach((p) => { const k = p.inicio.slice(0, 7); porMes[k] = (porMes[k] || 0) + 1; });
  const nm = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const novosMes = Object.keys(porMes).sort().map((k) => {
    const [y, m] = k.split("-"); return { x: `${nm[+m - 1]}/${y.slice(2)}`, v: porMes[k] };
  });

  const faixas = [["30-39", 30, 39], ["40-49", 40, 49], ["50-59", 50, 59]]
    .map((f) => ({ x: f[0], v: pacientes.filter((p) => p.idade >= f[1] && p.idade <= f[2]).length }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 className="page-title">Visão geral</h1>
        <p className="page-sub">Resumo da sua base de pacientes em acompanhamento.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }} className="grid-stats">
        <StatCard label="Pacientes ativos" value={ativos.length} sub={`${pacientes.length} no total`} accent="var(--brand)" />
        <StatCard label="Novos este mês" value={novos.length} sub="abr/2026" accent="var(--good)" />
        <StatCard label="Média de idade" value={mIdade} unit="anos" />
        <StatCard label="Peso médio (ativos)" value={br(mPeso)} unit="kg" />
        <StatCard label="Perda média de peso" value={`−${br(mPerda)}`} unit="kg" sub="entre ativos" accent="var(--good)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }} className="grid-charts">
        <BarraChart data={perdaPorPac} dataKey="v" colorKey="good" title="Perda de peso por paciente" unit="kg" />
        <BarraChart data={novosMes} dataKey="v" colorKey="brand" title="Novos pacientes por mês" unit="qtd" intY />
        <BarraChart data={faixas} dataKey="v" colorKey="idade" title="Distribuição por faixa etária" unit="pacientes" intY />
      </div>

      <div>
        <h2 className="sec-title">Acompanhamentos recentes</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {comCiclo.slice(0, 4).map((p) => (
            <button key={p.id} onClick={() => navegar("ficha", p.id)} className="card" style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", textAlign: "left", width: "100%",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar nome={p.nome} />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, display: "block" }}>{p.nome}</span>
                  <span style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{mesesTrat(p.inicio)} meses · {ultimoCiclo(p).mes}</span>
                </span>
              </span>
              {p.ciclos.length > 1 && <span style={{ fontSize: 13, color: "var(--good)", fontWeight: 600 }}>−{br(perdaPeso(p))} kg</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
