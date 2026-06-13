// src/screens/NovoCiclo.jsx
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { parseNum } from "../lib/utils.js";

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
  const salvar = async () => {
    setSalvando(true);
    try {
      await addCiclo(p.id, {
        mes: f.mes.trim() || "Novo mês",
        peso: parseNum(f.peso), gordura: parseNum(f.gordura), visceral: parseInt(f.visceral) || 0,
        unidade: f.unidade, doses: [f.d1, f.d2, f.d3, f.d4].map(parseNum),
        local: f.local, suplementacao: f.suplementacao.trim(), colaterais: f.colaterais.trim(), obs: f.obs.trim(),
      });
      toast("Ciclo salvo");
      navegar("ficha", p.id);
    } catch (e) {
      console.error(e); toast("Erro ao salvar ciclo"); setSalvando(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <button onClick={() => navegar("ficha", p.id)} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13 }}>
        <ArrowLeft size={15} /> Voltar para a ficha
      </button>
      <div><h1 className="page-title">Novo ciclo mensal</h1><p className="page-sub">{p.nome}</p></div>

      <Secao titulo="Medições do mês">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
          <Campo label="Mês de referência" tipo="text" v={f.mes} on={(v) => set("mes", v)} ph="Mai/26" />
          <Campo label="Peso (kg)" tipo="number" v={f.peso} on={(v) => set("peso", v)} ph="78,5" />
          <Campo label="% Gordura" tipo="number" v={f.gordura} on={(v) => set("gordura", v)} ph="34,0" />
          <Campo label="Gordura visceral" tipo="number" v={f.visceral} on={(v) => set("visceral", v)} ph="9" />
        </div>
      </Secao>

      <Secao titulo="Titulação da dose">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 7 }}>Unidade</label>
          <Segment opcoes={["MG", "UI"]} valor={f.unidade} on={(v) => set("unidade", v)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[["d1", "Semana 1"], ["d2", "Semana 2"], ["d3", "Semana 3"], ["d4", "Semana 4"]].map(([k, l]) => (
            <div key={k} className="field">
              <label>{l}</label>
              <div style={{ position: "relative" }}>
                <input type="number" inputMode="decimal" value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder="0"
                  style={{ width: "100%", padding: "10px 30px 10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14 }} />
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--inkFaint)", pointerEvents: "none" }}>{un}</span>
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <Secao titulo="Protocolo e acompanhamento">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 7 }}>Local de aplicação</label>
          <Segment opcoes={["Casa", "Clínica"]} valor={f.local} on={(v) => set("local", v)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Campo label="Suplementação" tipo="text" v={f.suplementacao} on={(v) => set("suplementacao", v)} ph="Vit. D · B12 · Ômega-3…" />
          <Campo label="Colaterais relatados" tipo="text" v={f.colaterais} on={(v) => set("colaterais", v)} ph="Náusea leve, constipação…" />
          <div className="field">
            <label>Observações do médico</label>
            <textarea value={f.obs} onChange={(e) => set("obs", e.target.value)} rows={3} placeholder="Anotações sobre conduta, evolução, orientações…" />
          </div>
        </div>
      </Secao>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={() => navegar("ficha", p.id)}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ opacity: salvando ? 0.7 : 1 }}>{salvando ? "Salvando…" : "Salvar ciclo"}</button>
      </div>
    </div>
  );
}

function Secao({ titulo, children }) {
  return <div className="card" style={{ padding: "20px 22px" }}><h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{titulo}</h3>{children}</div>;
}
function Campo({ label, tipo, v, on, ph }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type={tipo} inputMode={tipo === "number" ? "decimal" : undefined} value={v} onChange={(e) => on(e.target.value)} placeholder={ph} />
    </div>
  );
}
function Segment({ opcoes, valor, on }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
      {opcoes.map((o) => (
        <button key={o} onClick={() => on(o)} style={{
          borderRadius: 8, padding: "8px 22px", fontSize: 13, fontWeight: 600,
          background: valor === o ? "var(--surface)" : "transparent",
          color: valor === o ? "var(--brand)" : "var(--inkFaint)",
          boxShadow: valor === o ? "0 1px 2px rgba(0,0,0,.06)" : "none",
        }}>{o}</button>
      ))}
    </div>
  );
}
