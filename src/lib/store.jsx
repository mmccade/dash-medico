// src/lib/store.jsx
// Estado central. Se o Firebase estiver ativo e houver usuário logado,
// lê/grava no Firestore. Caso contrário, roda em modo demo (memória).
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

  // Carrega do Firestore quando há usuário
  useEffect(() => {
    if (!usandoFirebase) {
      setPacientes(PACIENTES_DEMO);
      setConfig(CONFIG_INICIAL);
      return;
    }
    let vivo = true;
    setCarregando(true);
    dbApi.listarPacientes(user.uid)
      .then((ps) => { if (vivo) setPacientes(ps); })
      .catch((e) => console.error("Erro ao listar pacientes:", e))
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [usandoFirebase, user]);

  // Config vem do perfil quando logado
  useEffect(() => {
    if (usandoFirebase && perfil) {
      setConfig({
        clinica: perfil.clinica || "Minha Clínica",
        medico: perfil.medico || "",
        crm: perfil.crm || "",
        logo: perfil.logo || null,
        murevNoPdf: perfil.murevNoPdf !== false,
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
    if (usandoFirebase) {
      await dbApi.atualizarPaciente(user.uid, pacienteId, { ciclos: novosCiclos });
    }
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ciclos: novosCiclos } : x)));
  }, [usandoFirebase, user, pacientes]);

  const toggleAtivo = useCallback(async (pacienteId) => {
    const p = pacientes.find((x) => x.id === pacienteId);
    if (!p) return;
    if (usandoFirebase) {
      await dbApi.atualizarPaciente(user.uid, pacienteId, { ativo: !p.ativo });
    }
    setPacientes((ps) => ps.map((x) => (x.id === pacienteId ? { ...x, ativo: !x.ativo } : x)));
  }, [usandoFirebase, user, pacientes]);

  const salvarConfig = useCallback(async (nova) => {
    setConfig(nova);
    if (usandoFirebase) {
      await dbApi.salvarConfigUsuario(user.uid, nova);
      setPerfil((pf) => ({ ...pf, ...nova }));
    }
  }, [usandoFirebase, user, setPerfil]);

  return (
    <StoreCtx.Provider value={{
      pacientes, config, carregando, usandoFirebase,
      getPaciente, addPaciente, addPacientesEmLote, addCiclo, toggleAtivo, salvarConfig,
    }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);
