// src/screens/NovoPaciente.jsx
// Alteração: validação via validate.js antes de salvar

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { validatePaciente, primeiroErro } from "../lib/validate.js";

export default function NovoPaciente({ navegar }) {
  const { addPaciente } = useStore();
  const toast = useToast();
  const [f, setF] = useState({
    nome: "", idade: "", altura: "", sexo: "Feminino",
    inicio: new Date().toISOString().slice(0, 10),
    objetivo: "", comorbidades: "",
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const { data, errors } = validatePaciente(f);
    if (errors.length) {
      toast(primeiroErro(errors));
      return;
    }
    setSalvando(true);
    try {
      const novo = await addPaciente(data);
      toast("Paciente cadastrado");
      navegar("ficha", novo.id);
    } catch (e) {
      console.error(e);
      toast("Erro ao salvar paciente");
      setSalvando(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <button onClick={() => navegar("pacientes")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13 }}>
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>
      <div><h1 className="page-title">Cadastrar paciente</h1><p className="page-sub">Dados que não mudam ao longo do tratamento.</p></div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Dados do paciente</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Nome completo *</label>
            <input type="text" maxLength={150} value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome do paciente" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Idade</label>
              <input type="number" inputMode="numeric" min={0} max={130} value={f.idade} onChange={(e) => set("idade", e.target.value)} placeholder="42" />
            </div>
            <div className="field">
              <label>Altura (m)</label>
              <input type="number" inputMode="decimal" step="0.01" min={0.5} max={2.5} value={f.altura} onChange={(e) => set("altura", e.target.value)} placeholder="1,64" />
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
            <label>Início do tratamento</label>
            <input type="date" value={f.inicio} onChange={(e) => set("inicio", e.target.value)} />
          </div>
          <div className="field">
            <label>Objetivo</label>
            <input type="text" maxLength={300} value={f.objetivo} onChange={(e) => set("objetivo", e.target.value)} placeholder="Emagrecimento e controle metabólico…" />
          </div>
          <div className="field">
            <label>Condições relatadas</label>
            <input type="text" maxLength={300} value={f.comorbidades} onChange={(e) => set("comorbidades", e.target.value)} placeholder="Nenhuma relatada / comorbidades…" />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-ghost" onClick={() => navegar("pacientes")}>Cancelar</button>
        <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ opacity: salvando ? 0.7 : 1 }}>
          {salvando ? "Salvando…" : "Salvar paciente"}
        </button>
      </div>
    </div>
  );
}
