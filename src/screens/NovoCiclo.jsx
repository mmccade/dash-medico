// src/screens/NovoCiclo.jsx
// Alterações:
//  - Campo "Mês de referência" virou "Data de referência" (DD/MM/AAAA via input type=date)
//  - Titulação MG: máscara 0,0 com até 3 dígitos (ex: 2,5 / 10,0) — máx 99,9
//  - Titulação UI: apenas inteiros, máx 2 dígitos (1-99)
//  - Suplementação, colaterais, obs: tipo text/textarea sem inputMode=decimal
//  - Confirmação ao sair se dados preenchidos

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { parseNum } from "../lib/utils.js";
import { validateCiclo, primeiroErro } from "../lib/validate.js";

// Converte "DD/MM/AAAA" → "AAAA-MM-DD" para salvar
function brParaIso(s) {
  if (!s) return "";
  const [d, m, a] = s.split("/");
  if (!d || !m || !a) return s;
  return `${a}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
}

// Converte "AAAA-MM-DD" → "DD/MM/AAAA" para exibir
function isoParaBr(s) {
  if (!s) return "";
  const [a, m, d] = s.split("-");
  if (!d) return s;
  return `${d}/${m}/${a}`;
}

// Label curto para o accordion: "Mai/26" a partir de "2026-05-08"
function labelMes(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T12:00:00");
    const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${meses[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
  } catch { return iso; }
}

// ─── Input MG: aceita 0,0 / 0,5 / 2,5 / 10,0 — máx 99,9 ──────
function InputMG({ value, onChange }) {
  const handleChange = (e) => {
    let v = e.target.value;
    // Permite só dígitos e vírgula/ponto
    v = v.replace(/[^0-9.,]/g, "");
    // Normaliza separador
    v = v.replace(".", ",");
    // Apenas uma vírgula
    const partes = v.split(",");
    if (partes.length > 2) v = partes[0] + "," + partes.slice(1).join("");
    // Parte inteira máx 2 dígitos
    if (partes[0].length > 2) partes[0] = partes[0].slice(0, 2);
    // Parte decimal máx 1 dígito
    if (partes[1] !== undefined) partes[1] = partes[1].slice(0, 1);
    v = partes.join(partes.length > 1 ? "," : "");
    // Valor numérico máx 99,9
    const num = parseFloat(v.replace(",", "."));
    if (!isNaN(num) && num > 99.9) return;
    onChange(v);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={handleChange}
      placeholder="2,5"
      style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14 }}
    />
  );
}

// ─── Input UI: apenas inteiros 1-99 ────────────────────────────
function InputUI({ value, onChange }) {
  const handleChange = (e) => {
    let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    if (v !== "" && parseInt(v) > 99) v = "99";
    onChange(v);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder="20"
      style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14 }}
    />
  );
}

export default function NovoCiclo({ pacienteId, navegar }) {
  const { getPaciente, addCiclo } = useStore();
  const toast = useToast();
  const p = getPaciente(pacienteId);

  const hoje = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    data: hoje,   // AAAA-MM-DD internamente
    peso: "", gordura: "", visceral: "",
    unidade: "MG", d1: "", d2: "", d3: "", d4: "",
    local: "Casa", suplementacao: "", colaterais: "", obs: "",
  });

  if (!p) { navegar("pacientes"); return null; }
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const isMG = f.unidade === "MG";
  const [salvando, setSalvando] = useState(false);

  const temDados = f.peso || f.obs.trim();

  const voltar = () => {
    if (temDados && !window.confirm("Descartar os dados preenchidos e voltar?")) return;
    navegar("ficha", p.id);
  };

  const salvar = async () => {
    // Monta label do mês a partir da data
    const mesLabel = labelMes(f.data) || isoParaBr(f.data);

    const rawCiclo = {
      mes: mesLabel,
      data: f.data,
      peso: f.peso,
      gordura: f.gordura,
      visceral: f.visceral,
      unidade: f.unidade,
      doses: [f.d1, f.d2, f.d3, f.d4].map((d) => parseNum(d)),
      local: f.local,
      suplementacao: f.suplementacao,
      colaterais: f.colaterais,
      obs: f.obs,
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
          {/* Data DD/MM/AAAA */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Data de referência *</label>
            <input
              type="date"
              value={f.data}
              onChange={(e) => set("data", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14 }}
            />
            {f.data && (
              <span style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 4, display: "block" }}>
                {isoParaBr(f.data)} · ciclo: {labelMes(f.data)}
              </span>
            )}
          </div>
          <Campo label="Peso (kg) *" tipo="number" v={f.peso} on={(v) => set("peso", v)} ph="78,5" min={20} max={400} />
          <Campo label="% Gordura" tipo="number" v={f.gordura} on={(v) => set("gordura", v)} ph="34,0" min={0} max={100} />
          <Campo label="Gordura visceral" tipo="number" v={f.visceral} on={(v) => set("visceral", v)} ph="9" min={0} max={50} />
        </div>
      </Secao>

      <Secao titulo="Titulação da dose">
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, color: "var(--inkSoft)", fontWeight: 600, display: "block", marginBottom: 7 }}>Unidade</label>
          <Segment opcoes={["MG", "UI"]} valor={f.unidade} on={(v) => { set("unidade", v); set("d1",""); set("d2",""); set("d3",""); set("d4",""); }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[["d1","Semana 1"],["d2","Semana 2"],["d3","Semana 3"],["d4","Semana 4"]].map(([k, l]) => (
            <div key={k} className="field">
              <label>{l}</label>
              {isMG
                ? <InputMG value={f[k]} onChange={(v) => set(k, v)} />
                : <InputUI value={f[k]} onChange={(v) => set(k, v)} />
              }
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 10 }}>
          {isMG ? "MG: formato X,X — ex: 2,5 · 5,0 · 10,0 (máx 99,9)" : "UI: apenas inteiros — ex: 20 · 40 (máx 99)"}
        </p>
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
