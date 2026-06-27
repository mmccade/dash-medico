// src/screens/NovoCiclo.jsx

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { parseNum } from "../lib/utils.js";
import { validateCiclo, primeiroErro } from "../lib/validate.js";
import { InputDecimal, InputInteiro, InputData } from "../components/inputs.jsx";
import SilhuetaAplicacao from "../components/SilhuetaAplicacao.jsx";

function labelMes(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T12:00:00");
    const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
  } catch { return iso; }
}

export default function NovoCiclo({ pacienteId, navegar }) {
  const { getPaciente, addCiclo } = useStore();
  const toast = useToast();
  const p = getPaciente(pacienteId);

  const hoje = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    data: hoje,
    peso: "", gordura: "", massaMagra: "", visceral: "",
    unidade: "MG", d1: "", d2: "", d3: "", d4: "",
    local: "Casa", localAplicacao: "", medicacao: "", suplementacao: "", colaterais: "", obs: "",
  });

  if (!p) { navegar("pacientes"); return null; }
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const isMG = f.unidade === "MG";
  const [salvando, setSalvando] = useState(false);
  const temDados = f.peso || f.obs.trim();

  // Sugestão de massa magra = peso × (1 − %gordura/100), quando ambos preenchidos
  const pesoN = parseNum(f.peso);
  const gordN = parseNum(f.gordura);
  const sugestaoMagra = pesoN > 0 && gordN > 0 ? +(pesoN * (1 - gordN / 100)).toFixed(1) : null;

  const voltar = () => {
    if (temDados && !window.confirm("Descartar os dados preenchidos e voltar?")) return;
    navegar("ficha", p.id);
  };

  const salvar = async () => {
    if (!f.data) { toast("Informe a data de referência"); return; }
    const mesLabel = labelMes(f.data);
    const rawCiclo = {
      mes: mesLabel, data: f.data,
      peso: f.peso, gordura: f.gordura, massaMagra: f.massaMagra, visceral: f.visceral,
      unidade: f.unidade,
      doses: [f.d1, f.d2, f.d3, f.d4].map(parseNum),
      local: f.local, localAplicacao: f.localAplicacao, medicacao: f.medicacao, suplementacao: f.suplementacao, colaterais: f.colaterais, obs: f.obs,
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
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Data de referência *</label>
          <InputData value={f.data} onChange={(v) => set("data", v)} />
          {f.data && (
            <span style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 4, display: "block" }}>
              ciclo: {labelMes(f.data)}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
          <div className="field">
            <label>Peso (kg) *</label>
            <InputDecimal value={f.peso} onChange={(v) => set("peso", v)} placeholder="109,5" digitos={4} decimais={1} />
          </div>
          <div className="field">
            <label>% Gordura</label>
            <InputDecimal value={f.gordura} onChange={(v) => set("gordura", v)} placeholder="34,0" digitos={3} decimais={1} />
          </div>
          <div className="field">
            <label>Massa magra (kg)</label>
            <InputDecimal value={f.massaMagra} onChange={(v) => set("massaMagra", v)} placeholder="62,5" digitos={4} decimais={1} />
            {sugestaoMagra && !f.massaMagra && (
              <button type="button" onClick={() => set("massaMagra", String(sugestaoMagra).replace(".", ","))}
                style={{ fontSize: 11.5, color: "var(--brand)", marginTop: 5, display: "block" }}>
                Estimar ≈ {String(sugestaoMagra).replace(".", ",")} kg (peso − gordura)
              </button>
            )}
          </div>
          <div className="field">
            <label>Gordura visceral</label>
            <InputInteiro value={f.visceral} onChange={(v) => set("visceral", v)} placeholder="9" max={50} />
          </div>
        </div>
      </Secao>

      <Secao titulo="Titulação da dose">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 7 }}>Unidade</label>
          <Segment
            opcoes={["MG", "UI"]}
            valor={f.unidade}
            on={(v) => { set("unidade", v); set("d1",""); set("d2",""); set("d3",""); set("d4",""); }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[["d1","Semana 1"],["d2","Semana 2"],["d3","Semana 3"],["d4","Semana 4"]].map(([k, l]) => (
            <div key={k} className="field">
              <label>{l}</label>
              {isMG
                ? <InputDecimal value={f[k]} onChange={(v) => set(k, v)} placeholder="2,5" digitos={3} decimais={1} />
                : <InputInteiro value={f[k]} onChange={(v) => set(k, v)} placeholder="20" max={99} />
              }
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 10 }}>
          {isMG ? "MG: ex 2,5 · 5,0 · 10,0 (máx 99,9)" : "UI: inteiros — ex 20 · 40 (máx 99)"}
        </p>
      </Secao>

      <Secao titulo="Aplicação e adesão">
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 7 }}>Onde aplicou</label>
          <Segment opcoes={["Casa", "Clínica"]} valor={f.local} on={(v) => set("local", v)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 10 }}>Local de aplicação no corpo</label>
          <p style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 12 }}>
            Marque o ponto onde a dose foi aplicada. Alternar o local a cada aplicação evita irritação e lipodistrofia.
          </p>
          <SilhuetaAplicacao valor={f.localAplicacao} onChange={(v) => set("localAplicacao", v)} />
        </div>
        <CampoTexto label="Medicação prescrita" v={f.medicacao} on={(v) => set("medicacao", v)} ph="Ex: Tirzepatida 5mg/semana + Metformina 500mg 2x/dia…" max={1000} />
        <div style={{ marginTop: 14 }}>
          <CampoTexto label="Suplementação" v={f.suplementacao} on={(v) => set("suplementacao", v)} ph="Ex: vitamina D 5.000 UI, magnésio quelato…" max={500} />
        </div>
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

function CampoTexto({ label, v, on, ph, max }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="text" value={v} onChange={(e) => on(e.target.value)} placeholder={ph} maxLength={max}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, boxSizing: "border-box" }} />
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
