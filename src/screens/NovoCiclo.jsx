// src/screens/NovoCiclo.jsx
// Alteração: confirmação ao clicar "Voltar" ou "Cancelar" se peso já foi preenchido

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { parseNum } from "../lib/utils.js";
import { validateCiclo, primeiroErro } from "../lib/validate.js";

export default function NovoCiclo({ pacienteId, navegar }) {
  const { getPaciente, addCiclo } = useStore();
  const toast = useToast();
  const p = getPaciente(pacienteId);
  const [f, setF] = useState({
    mes: "", peso: "", gordura: "", visceral: "",
    unidade: "MG", d1: "", d2: "", d3: "", d4: "",
    local: "Casa", suplementacao: "", colaterais: "", obs: "",
  });
  if (!p) { navegar("pacientes"); return null; }
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const un = f.unidade.toLowerCase();
  const [salvando, setSalvando] = useState(false);

  const temDados = f.peso || f.mes || f.obs.trim();

  const voltar = () => {
    if (temDados && !window.confirm("Descartar os dados preenchidos e voltar?")) return;
    navegar("ficha", p.id);
  };

  const salvar = async () => {
    const rawCiclo = {
      mes: f.mes, peso: f.peso, gordura: f.gordura, visceral: f.visceral,
      unidade: f.unidade, doses: [f.d1, f.d2, f.d3, f.d4].map(parseNum),
      local: f.local, suplementacao: f.suplementacao, colaterais: f.colaterais, obs: f.obs,
    };
    const { data, errors } = validateCiclo(rawCiclo);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    setSalvando(true);
    try {
      await addCiclo(p.id, data);
      toast("Ciclo salvo");
      navegar("ficha", p.id);
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar ciclo");
      setSalvando(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <button onClick={voltar} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13 }}>
        <ArrowLeft size={15} /> Voltar para a ficha
      </button>
      <div><h1 className="page-title">Novo ciclo mensal</h1><p className="page-sub">{p.nome}</p></div>

      <Secao titulo="Medições do mês">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
          <Campo label="Mês de referência *" tipo="text" v={f.mes} on={(v) => set("mes", v)} ph="Mai/26" max={20} />
          <Campo label="Peso (kg) *" tipo="number" v={f.peso} on={(v) => set("peso", v)} ph="78,5" min={20} max={400} />
          <Campo label="% Gordura" tipo="number" v={f.gordura} on={(v) => set("gordura", v)} ph="34,0" min={0} max={100} />
          <Campo label="Gordura visceral" tipo="number" v={f.visceral} on={(v) => set("visceral", v)} ph="9" min={0} max={50} />
        </div>
      </Secao>

      <Secao titulo="Titulação da dose">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 7 }}>Unidade</label>
          <Segment opcoes={["MG", "UI"]} valor={f.unidade} on={(v) => set("unidade", v)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[["d1", "Semana 1"], ["d2", "Semana 2"], ["d3", "Semana 3"], ["d4", "Semana 4"]].map(([k, l]) => (
            <Campo key={k} label={l} tipo="number" v={f[k]} on={(v) => set(k, v)} ph={un === "mg" ? "2,5" : "20"} min={0} max={100} />
          ))}
        </div>
      </Secao>

      <Secao titulo="Aplicação e adesão">
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 7 }}>Local de aplicação</label>
          <Segment opcoes={["Casa", "Clínica"]} valor={f.local} on={(v) => set("local", v)} />
        </div>
        <Campo label="Suplementação" tipo="text" v={f.suplementacao} on={(v) => set("suplementacao", v)} ph="Ex: vitamina D, creatina…" max={500} />
      </Secao>

      <Secao titulo="Observações clínicas">
        <Textarea label="Efeitos colaterais" v={f.colaterais} on={(v) => set("colaterais", v)} ph="Náusea leve nas primeiras semanas…" max={1000} />
        <div style={{ marginTop: 14 }}>
          <Textarea label="Observações gerais" v={f.obs} on={(v) => set("obs", v)} ph="Paciente relata…" max={2000} />
        </div>
      </Secao>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={voltar}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ opacity: salvando ? 0.7 : 1 }}>
          {salvando ? "Salvando…" : "Salvar ciclo"}
        </button>
      </div>
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{titulo}</h3>
      {children}
    </div>
  );
}

function Campo({ label, tipo, v, on, ph, min, max }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={tipo} value={v} onChange={(e) => on(e.target.value)} placeholder={ph}
        {...(min != null ? { min } : {})}
        {...(max != null ? { max } : {})}
        {...(tipo === "text" && max ? { maxLength: max } : {})}
        inputMode={tipo === "number" ? "decimal" : undefined}
      />
    </div>
  );
}

function Textarea({ label, v, on, ph, max }) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea rows={3} maxLength={max} value={v} onChange={(e) => on(e.target.value)} placeholder={ph}
        style={{ resize: "vertical", fontFamily: "inherit", fontSize: 14, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", width: "100%", boxSizing: "border-box" }}
      />
    </div>
  );
}

function Segment({ opcoes, valor, on }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
      {opcoes.map((o) => (
        <button key={o} onClick={() => on(o)} style={{ borderRadius: 8, padding: "8px 22px", fontSize: 13, fontWeight: 600, background: valor === o ? "var(--surface)" : "transparent", color: valor === o ? "var(--brand)" : "var(--inkFaint)", boxShadow: valor === o ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{o}</button>
      ))}
    </div>
  );
}
