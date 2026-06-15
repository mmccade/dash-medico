// src/screens/Relatorio.jsx
// Relatório mensal / trimestral / semestral / anual
// Mostra: novos no período, inativos no período, ciclos no período,
// somatório de kgs de gordura eliminados, faixas etárias.

import { useState, useMemo } from "react";
import { Calendar, TrendingDown, UserPlus, UserMinus, Activity, Trophy } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { br, faixaEtaria } from "../lib/utils.js";

const PERIODOS = [
  { id: "mensal", label: "Mensal", dias: 30 },
  { id: "trimestral", label: "Trimestral", dias: 90 },
  { id: "semestral", label: "Semestral", dias: 180 },
  { id: "anual", label: "Anual", dias: 365 },
];

const FAIXAS_LABEL = ["<30", "30-39", "40-49", "50-59", "60-69", "70+"];

function parseQualquerData(v) {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  return new Date(v);
}

export default function Relatorio() {
  const { pacientes } = useStore();
  const [periodo, setPeriodo] = useState("mensal");

  const dados = useMemo(() => {
    const cfg = PERIODOS.find((p) => p.id === periodo);
    const hoje = new Date();
    const limite = new Date(hoje.getTime() - cfg.dias * 86400000);

    let kgGorduraTotal = 0;
    let pesoTotalReduzido = 0;
    const novosNoPeriodo = [];
    const inativosNoPeriodo = [];
    let ciclosNoPeriodo = 0;

    pacientes.forEach((p) => {
      // Novos = início dentro do período
      const dInicio = parseQualquerData(p.inicio);
      if (dInicio && dInicio >= limite && dInicio <= hoje) {
        novosNoPeriodo.push(p);
      }
      // Inativos = desativadoEm dentro do período
      const dDes = parseQualquerData(p.desativadoEm);
      if (!p.ativo && dDes && dDes >= limite && dDes <= hoje) {
        inativosNoPeriodo.push(p);
      }
      // Ciclos: conta ciclos com data dentro do período
      if (p.ciclos && p.ciclos.length) {
        p.ciclos.forEach((c) => {
          const dC = parseQualquerData(c.data);
          if (dC && dC >= limite && dC <= hoje) ciclosNoPeriodo++;
        });

        // Gordura eliminada = soma da diferença (gordura% × peso) entre primeiro e último ciclo
        // que estejam ambos dentro do período (ou comparando contra ciclo anterior fora)
        const ciclosOrdenados = [...p.ciclos].sort((a, b) => {
          const da = parseQualquerData(a.data) || 0;
          const db = parseQualquerData(b.data) || 0;
          return da - db;
        });
        const primeiroNoPeriodo = ciclosOrdenados.findIndex((c) => {
          const dC = parseQualquerData(c.data);
          return dC && dC >= limite;
        });
        if (primeiroNoPeriodo !== -1) {
          // Ponto de partida = ciclo anterior (se existir), senão o primeiro no período
          const base = primeiroNoPeriodo > 0 ? ciclosOrdenados[primeiroNoPeriodo - 1] : ciclosOrdenados[primeiroNoPeriodo];
          const ultimo = ciclosOrdenados[ciclosOrdenados.length - 1];
          if (base && ultimo && base !== ultimo) {
            const reducaoPeso = base.peso - ultimo.peso;
            if (reducaoPeso > 0) pesoTotalReduzido += reducaoPeso;
            // Gordura (estimativa): se temos % gordura, calcula massa de gordura antes e depois
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

    // Faixas etárias
    const contarFaixas = (lista) => {
      const out = Object.fromEntries(FAIXAS_LABEL.map((f) => [f, 0]));
      lista.forEach((p) => {
        const fa = faixaEtaria(p.idade || 0);
        if (out[fa] != null) out[fa]++;
      });
      return out;
    };

    return {
      cfg,
      novos: novosNoPeriodo.length,
      inativos: inativosNoPeriodo.length,
      ciclos: ciclosNoPeriodo,
      kgGordura: +kgGorduraTotal.toFixed(1),
      pesoTotal: +pesoTotalReduzido.toFixed(1),
      faixasNovos: contarFaixas(novosNoPeriodo),
      faixasInativos: contarFaixas(inativosNoPeriodo),
    };
  }, [pacientes, periodo]);

  const mensagemKg = (() => {
    const periodoLabel = {
      mensal: "este mês",
      trimestral: "neste trimestre",
      semestral: "neste semestre",
      anual: "neste ano",
    }[periodo];
    if (dados.kgGordura < 0.1) {
      return `Nenhuma redução de gordura registrada ${periodoLabel} ainda. Bora puxar?`;
    }
    return `${periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1)} você contribuiu para uma redução de ${br(dados.kgGordura.toFixed(1))} kg de gordura corporal somando todos os seus pacientes. Parabéns pelo seu ótimo trabalho!`;
  })();

  const FaixaBar = ({ faixas, cor }) => {
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
              <span className="tnum" style={{ fontSize: 12.5, color: "var(--inkSoft)", minWidth: 22, textAlign: "right", fontWeight: 600 }}>
                {v}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const Card = ({ Icon, label, valor, cor, sub }) => (
    <div className="card" style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon size={16} color={cor || "var(--inkFaint)"} />
        <span style={{ fontSize: 12.5, color: "var(--inkFaint)", fontWeight: 600 }}>{label}</span>
      </div>
      <div className="tnum" style={{ fontSize: 28, fontWeight: 700, color: cor || "var(--ink)" }}>{valor}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--inkFaint)" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 className="page-title">Relatório</h1>
        <p className="page-sub">Resumo do seu trabalho no período selecionado.</p>
      </div>

      {/* Seletor de período */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3, alignSelf: "flex-start", flexWrap: "wrap" }}>
        {PERIODOS.map((p) => (
          <button key={p.id} onClick={() => setPeriodo(p.id)} style={{
            borderRadius: 8, padding: "9px 18px", fontSize: 13.5, fontWeight: 600,
            background: periodo === p.id ? "var(--surface)" : "transparent",
            color: periodo === p.id ? "var(--brand)" : "var(--inkFaint)",
            boxShadow: periodo === p.id ? "0 1px 2px rgba(0,0,0,.06)" : "none",
          }}>{p.label}</button>
        ))}
      </div>

      {/* Big card de celebração */}
      <div style={{
        background: "linear-gradient(135deg, var(--brand), var(--brandDeep, #0a5d63))",
        borderRadius: 16, padding: "26px 28px", color: "#fff",
        display: "flex", alignItems: "center", gap: 18,
      }}>
        <div style={{ flexShrink: 0, padding: 14, background: "rgba(255,255,255,0.15)", borderRadius: 99 }}>
          <Trophy size={24} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
            {dados.cfg.label} · {dados.cfg.dias} dias
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>
            {mensagemKg}
          </div>
        </div>
      </div>

      {/* Stats principais */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Card Icon={UserPlus}     label="Novos pacientes" valor={dados.novos}    cor="var(--good)" />
        <Card Icon={UserMinus}    label="Desativados"     valor={dados.inativos} cor="var(--warn)" />
        <Card Icon={Activity}     label="Ciclos no período" valor={dados.ciclos} cor="var(--brand)" />
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
    </div>
  );
}
