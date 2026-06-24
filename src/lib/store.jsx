// src/lib/store.jsx
// + desativarPaciente(id, motivo, detalhes) — desativa com registro de motivo

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { PACIENTES_DEMO, CONFIG_INICIAL } from "./dados.js";
import { massaMagraKg } from "./utils.js";
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
    const novo = { ...dados, id: nextId, ciclos: dados.ciclos || [], ativo: true };
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

  const editarCiclo = useCallback(async (pacienteId, idx, dadosNovos) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    const novosCiclos = p.ciclos.map((c, i) => (i === idx ? { ...c, ...dadosNovos } : c));
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, { ciclos: novosCiclos });
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ciclos: novosCiclos } : x)));
  }, [usandoFirebase, user, pacientes]);

  const excluirCiclo = useCallback(async (pacienteId, idx) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    const novosCiclos = p.ciclos.filter((_, i) => i !== idx);
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, { ciclos: novosCiclos });
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ciclos: novosCiclos } : x)));
  }, [usandoFirebase, user, pacientes]);

  const editarPaciente = useCallback(async (pacienteId, dados) => {
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, dados);
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ...dados } : x)));
  }, [usandoFirebase, user]);

  // Ativa/desativa simples (sem motivo) — mantido pra retrocompatibilidade
  const toggleAtivo = useCallback(async (pacienteId) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    const novoStatus = !p.ativo;
    const patch = novoStatus
      ? { ativo: true, desativadoEm: null, motivoDesativacao: null, detalhesDesativacao: null }
      : { ativo: false, desativadoEm: new Date().toISOString() };
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, patch);
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ...patch } : x)));
  }, [usandoFirebase, user, pacientes]);

  // ✅ NOVO — desativar com motivo
  // motivo: "meta_batida" | "sumiu" | "outros" | "nao_informar"
  const desativarPaciente = useCallback(async (pacienteId, motivo, detalhes = "") => {
    const patch = {
      ativo: false,
      desativadoEm: new Date().toISOString(),
      motivoDesativacao: motivo,
      detalhesDesativacao: detalhes || null,
    };
    if (usandoFirebase) await dbApi.atualizarPaciente(user.uid, pacienteId, patch);
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ...patch } : x)));
  }, [usandoFirebase, user]);

  // ✅ NOVO — ações em massa
  const ativarEmMassa = useCallback(async (ids) => {
    const patch = { ativo: true, desativadoEm: null, motivoDesativacao: null, detalhesDesativacao: null };
    if (usandoFirebase) await Promise.all(ids.map((id) => dbApi.atualizarPaciente(user.uid, id, patch)));
    setPacientes((ps) => ps.map((x) => (ids.includes(x.id) ? { ...x, ...patch } : x)));
  }, [usandoFirebase, user]);

  const desativarEmMassa = useCallback(async (ids, motivo = "nao_informar") => {
    const patch = {
      ativo: false,
      desativadoEm: new Date().toISOString(),
      motivoDesativacao: motivo,
    };
    if (usandoFirebase) await Promise.all(ids.map((id) => dbApi.atualizarPaciente(user.uid, id, patch)));
    setPacientes((ps) => ps.map((x) => (ids.includes(x.id) ? { ...x, ...patch } : x)));
  }, [usandoFirebase, user]);

  const salvarConfig = useCallback(async (nova) => {
    setConfig(nova);
    if (usandoFirebase) {
      await dbApi.salvarConfigUsuario(user.uid, nova);
      setPerfil((pf) => ({ ...pf, ...nova }));
    }
  }, [usandoFirebase, user, setPerfil]);

  const exportarCSV = useCallback(() => {
    const linhas = [];
    const cab = ["Nome", "Idade", "Sexo", "Altura(m)", "Inicio", "Objetivo", "Condicoes", "Ativo",
      "Mes", "Peso(kg)", "Gordura(%)", "MassaMagra(kg)", "Visceral", "Unidade", "Dose_S1", "Dose_S2", "Dose_S3", "Dose_S4",
      "Local", "Suplementacao", "Colaterais", "Obs"];
    linhas.push(cab.join(";"));
    pacientes.forEach((p) => {
      if (p.ciclos.length === 0) {
        linhas.push([p.nome, p.idade, p.sexo, p.altura, p.inicio, p.objetivo, p.comorbidades, p.ativo ? "sim" : "não",
          "", "", "", "", "", "", "", "", "", "", "", "", "", ""].join(";"));
      } else {
        p.ciclos.forEach((c) => {
          linhas.push([
            p.nome, p.idade, p.sexo, p.altura, p.inicio, p.objetivo, p.comorbidades, p.ativo ? "sim" : "não",
            c.mes, c.peso, c.gordura, (massaMagraKg(c) ?? ""), c.visceral, c.unidade,
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
      toggleAtivo, desativarPaciente, ativarEmMassa, desativarEmMassa,
      salvarConfig, exportarCSV,
    }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);
