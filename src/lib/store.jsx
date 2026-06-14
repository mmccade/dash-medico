// src/lib/store.jsx
// Alterações:
//  - editarCiclo(pacienteId, index, dadosNovos) — substitui ciclo por índice
//  - excluirCiclo(pacienteId, index) — remove ciclo por índice
//  - editarPaciente(pacienteId, dados) — atualiza campos do paciente
//  - exportarCSV() — gera e baixa CSV de todos os pacientes

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { PACIENTES_DEMO, CONFIG_INICIAL } from "./dados.js";
import { useAuth } from "./auth.jsx";
import * as dbApi from "../services/db.js";

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const { user, perfil, setPerfil, firebaseAtivo } = useAuth();
  const usandoFirebase = firebaseAtivo && !!user;

  const [pacientes, setPacientes] = useState(usandoFirebase ? [] : PACIENTES_DEMO);
  const [config, setConfig] = useState(CONFIG_INICIAL);
  const [nextId, setNextId] = useState(9);
  const [carregando, setCarregando] = useState(usandoFirebase);

  useEffect(() => {
    if (!usandoFirebase) { setPacientes(PACIENTES_DEMO); setConfig(CONFIG_INICIAL); return; }
    let vivo = true;
    setCarregando(true);
    dbApi.listarPacientes(user.uid)
      .then((ps) => { if (vivo) setPacientes(ps); })
      .catch((e) => console.error("Erro ao listar pacientes:", e))
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [usandoFirebase, user]);

  useEffect(() => {
    if (usandoFirebase && perfil) {
      setConfig({
        clinica: perfil.clinica || "Minha Clínica",
        medico: perfil.medico || "",
        crm: perfil.crm || "",
        logo: perfil.logo || null,
        murevNoPdf: perfil.murevNoPdf !== false,
        pesoMeta: perfil.pesoMeta || null,
      });
    }
  }, [usandoFirebase, perfil]);

  const getPaciente = useCallback(
    (id) => pacientes.find((p) => p.id === id || p.id === String(id) || p.id === Number(id)),
    [pacientes]
  );

  const addPaciente = useCallback(async (dados) => {
    if (usandoFirebase) {
      const novo = await dbApi.criarPaciente(user.uid, dados);
      setPacientes((ps) => [novo, ...ps]);
      return novo;
    }
    const novo = { ...dados, id: nextId, ciclos: [], ativo: true };
    setNextId((n) => n + 1);
    setPacientes((ps) => [novo, ...ps]);
    return novo;
  }, [usandoFirebase, user, nextId]);

  const addPacientesEmLote = useCallback(async (lista) => {
    if (usandoFirebase) {
      const novos = await dbApi.criarPacientesEmLote(user.uid, lista);
      setPacientes((ps) => [...novos, ...ps]);
      return novos;
    }
    let id = nextId;
    const novos = lista.map((d) => ({ ...d, id: id++ }));
    setNextId(id);
    setPacientes((ps) => [...novos, ...ps]);
    return novos;
  }, [usandoFirebase, user, nextId]);

  const addCiclo = useCallback(async (pacienteId, ciclo) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    const novosCiclos = [...p.ciclos, ciclo];
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, { ciclos: novosCiclos });
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ciclos: novosCiclos } : x)));
  }, [usandoFirebase, user, pacientes]);

  // ✅ NOVO — editar ciclo por índice
  const editarCiclo = useCallback(async (pacienteId, idx, dadosNovos) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    const novosCiclos = p.ciclos.map((c, i) => (i === idx ? { ...c, ...dadosNovos } : c));
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, { ciclos: novosCiclos });
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ciclos: novosCiclos } : x)));
  }, [usandoFirebase, user, pacientes]);

  // ✅ NOVO — excluir ciclo por índice
  const excluirCiclo = useCallback(async (pacienteId, idx) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    const novosCiclos = p.ciclos.filter((_, i) => i !== idx);
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, { ciclos: novosCiclos });
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ciclos: novosCiclos } : x)));
  }, [usandoFirebase, user, pacientes]);

  // ✅ NOVO — editar dados do paciente
  const editarPaciente = useCallback(async (pacienteId, dados) => {
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, dados);
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ...dados } : x)));
  }, [usandoFirebase, user]);

  const toggleAtivo = useCallback(async (pacienteId) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, { ativo: !p.ativo });
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ativo: !x.ativo } : x)));
  }, [usandoFirebase, user, pacientes]);

  const salvarConfig = useCallback(async (nova) => {
    setConfig(nova);
    if (usandoFirebase) {
      await dbApi.salvarConfigUsuario(user.uid, nova);
      setPerfil((pf) => ({ ...pf, ...nova }));
    }
  }, [usandoFirebase, user, setPerfil]);

  // ✅ NOVO — exportar todos os pacientes como CSV
  const exportarCSV = useCallback(() => {
    const linhas = [];
    const cab = ["Nome", "Idade", "Sexo", "Altura(m)", "Inicio", "Objetivo", "Condicoes", "Ativo",
      "Mes", "Peso(kg)", "Gordura(%)", "Visceral", "Unidade", "Dose_S1", "Dose_S2", "Dose_S3", "Dose_S4",
      "Local", "Suplementacao", "Colaterais", "Obs"];
    linhas.push(cab.join(";"));
    pacientes.forEach((p) => {
      if (p.ciclos.length === 0) {
        linhas.push([p.nome, p.idade, p.sexo, p.altura, p.inicio, p.objetivo, p.comorbidades, p.ativo ? "sim" : "não",
          "", "", "", "", "", "", "", "", "", "", "", "", ""].join(";"));
      } else {
        p.ciclos.forEach((c) => {
          linhas.push([
            p.nome, p.idade, p.sexo, p.altura, p.inicio, p.objetivo, p.comorbidades, p.ativo ? "sim" : "não",
            c.mes, c.peso, c.gordura, c.visceral, c.unidade,
            c.doses?.[0] ?? "", c.doses?.[1] ?? "", c.doses?.[2] ?? "", c.doses?.[3] ?? "",
            c.local, c.suplementacao, c.colaterais, c.obs,
          ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"));
        });
      }
    });
    const blob = new Blob(["\uFEFF" + linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pacientes_murev_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [pacientes]);

  return (
    <StoreCtx.Provider value={{
      pacientes, config, carregando, usandoFirebase,
      getPaciente, addPaciente, addPacientesEmLote, addCiclo,
      editarCiclo, excluirCiclo, editarPaciente,
      toggleAtivo, salvarConfig, exportarCSV,
    }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);
