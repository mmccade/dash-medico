// src/screens/NovoPaciente.jsx
// + Campos de meta: peso meta, IMC meta (calculado), gordura visceral meta
// + Componentes centralizados de inputs

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { validatePaciente, primeiroErro } from "../lib/validate.js";
import { parseNum, imcMeta } from "../lib/utils.js";
import { InputDecimal, InputInteiro, InputData } from "../components/inputs.jsx";

export default function NovoPaciente({ navegar }) {
  const { addPaciente } = useStore();
  const toast = useToast();
  const [f, setF] = useState({
    nome: "", idade: "", altura: "", sexo: "Feminino",
    inicio: new Date().toISOString().slice(0, 10),
    objetivo: "", comorbidades: "",
    pesoAtual: "", pesoMeta: "",
    gordura: "", visceral: "",
    visceralMeta: "",
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [salvando, setSalvando] = useState(false);

  const temDados = f.nome.trim() || f.objetivo.trim() || f.comorbidades.trim();
  const voltar = () => {
    if (temDados && !window.confirm("Descartar os dados preenchidos e voltar?")) return;
    navegar("pacientes");
  };

  // IMC atual ao vivo
  const pesoNum = parseNum(f.pesoAtual);
  const altNum  = parseNum(f.altura);
  const imcCalc = pesoNum > 0 && altNum > 0 ? +(pesoNum / (altNum * altNum)).toFixed(1) : null;

  // IMC meta ao vivo
  const pesoMetaNum = parseNum(f.pesoMeta);
  const imcMetaCalc = pesoMetaNum > 0 && altNum > 0 ? imcMeta(pesoMetaNum, altNum) : null;

  const salvar = async () => {
    if (!f.inicio) { toast("Informe o início do tratamento"); return; }
    const { data, errors } = validatePaciente(f);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    const pesoMeta     = parseNum(f.pesoMeta)     || null;
    const pesoAtual    = parseNum(f.pesoAtual)    || null;
    const gordura      = parseNum(f.gordura)      || null;
    const visceral     = parseNum(f.visceral)     || null;
    const visceralMeta = parseNum(f.visceralMeta) || null;

    let ciclos = [];
    if (pesoAtual) {
      const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const dInicio = new Date(f.inicio + "T12:00:00");
      ciclos = [{
        mes: `${meses[dInicio.getMonth()]}/${String(dInicio.getFullYear()).slice(2)}`,
        data: f.inicio,
        peso: pesoAtual,
        gordura: gordura || 0,
        visceral: visceral || 0,
        unidade: "MG",
        doses: [0, 0, 0, 0],
        local: "Casa",
        suplementacao: "",
        colaterais: "",
        obs: "Cadastro inicial",
      }];
    }

    setSalvando(true);
    try {
      const novo = await addPaciente({ ...data, pesoMeta, visceralMeta, ciclos });
      toast("Paciente cadastrado");
      navegar("ficha", novo.id);
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar paciente");
      setSalvando(false);
    }
  };

  const inpStyle = { width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <button onClick={voltar} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13 }}>
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>
      <div>
        <h1 className="page-title">Cadastrar paciente</h1>
        <p className="page-sub">Dados básicos, metas e medições iniciais.</p>
      </div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Dados do paciente</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Nome completo *</label>
            <input type="text" maxLength={150} value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome do paciente" style={inpStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Idade</label>
              <InputInteiro value={f.idade} onChange={(v) => set("idade", v)} placeholder="42" max={130} />
            </div>
            <div className="field">
              <label>Altura (m)</label>
              <InputDecimal value={f.altura} onChange={(v) => set("altura", v)} placeholder="1,64" digitos={3} decimais={2} />
            </div>
          </div>

          <div className="field">
            <label>Sexo</label>
            <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
              {["Feminino", "Masculino"].map((s) => (
                <button key={s} onClick={() => set("sexo", s)} style={{ borderRadius: 8, padding: "8px 22px", fontSize: 13, fontWeight: 600, background: f.sexo === s ? "var(--surface)" : "transparent", color: f.sexo === s ? "var(--brand)" : "var(--inkFaint)", boxShadow: f.sexo === s ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{s}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Início do tratamento *</label>
            <InputData value={f.inicio} onChange={(v) => set("inicio", v)} />
          </div>

          <div className="field">
            <label>Objetivo</label>
            <input type="text" maxLength={300} value={f.objetivo} onChange={(e) => set("objetivo", e.target.value)} placeholder="Emagrecimento e controle metabólico…" style={inpStyle} />
          </div>

          <div className="field">
            <label>Condições relatadas</label>
            <input type="text" maxLength={300} value={f.comorbidades} onChange={(e) => set("comorbidades", e.target.value)} placeholder="Nenhuma relatada / comorbidades…" style={inpStyle} />
          </div>
        </div>
      </div>

      {/* ─── Metas ─── */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Metas</h3>
        <p style={{ fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 16 }}>
          Vamos notificar quando o paciente bater as metas definidas.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, alignItems: "flex-end" }}>
          <div className="field">
            <label>Peso meta (kg)</label>
            <InputDecimal value={f.pesoMeta} onChange={(v) => set("pesoMeta", v)} placeholder="70,0" digitos={4} decimais={1} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>IMC meta</div>
            <div style={{
              padding: "10px 12px", borderRadius: 9, background: "var(--surface2)",
              border: "1px solid var(--line)", fontSize: 16, fontWeight: 700,
              color: imcMetaCalc ? "var(--brand)" : "var(--inkFaint)",
              minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {imcMetaCalc ? String(imcMetaCalc).replace(".", ",") : "—"}
            </div>
            <span style={{ fontSize: 11, color: "var(--inkFaint)", marginTop: 4, display: "block" }}>
              Calculado: peso meta ÷ altura²
            </span>
          </div>
          <div className="field">
            <label>Gordura visceral meta</label>
            <InputInteiro value={f.visceralMeta} onChange={(v) => set("visceralMeta", v)} placeholder="9" max={50} />
          </div>
        </div>
      </div>

      {/* ─── Medições iniciais ─── */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Medições iniciais</h3>
        <p style={{ fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 16 }}>
          Opcional — se preenchido, cria o primeiro ciclo automaticamente.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, alignItems: "flex-end" }}>
          <div className="field">
            <label>Peso atual (kg)</label>
            <InputDecimal value={f.pesoAtual} onChange={(v) => set("pesoAtual", v)} placeholder="109,5" digitos={4} decimais={1} />
          </div>
          <div className="field">
            <label>% Gordura</label>
            <InputDecimal value={f.gordura} onChange={(v) => set("gordura", v)} placeholder="34,0" digitos={3} decimais={1} />
          </div>
          <div className="field">
            <label>Gordura visceral</label>
            <InputInteiro value={f.visceral} onChange={(v) => set("visceral", v)} placeholder="9" max={50} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>IMC atual</div>
            <div style={{
              padding: "10px 12px", borderRadius: 9, background: "var(--surface2)",
              border: "1px solid var(--line)", fontSize: 16, fontWeight: 700,
              color: imcCalc ? "var(--brand)" : "var(--inkFaint)",
              minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {imcCalc ? String(imcCalc).replace(".", ",") : "—"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={voltar}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ opacity: salvando ? 0.7 : 1 }}>
          {salvando ? "Salvando…" : "Salvar paciente"}
        </button>
      </div>
    </div>
  );
}
