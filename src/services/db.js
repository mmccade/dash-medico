// src/services/db.js
// Camada de dados sobre o Firestore.
// Cada médico tem seus pacientes isolados em usuarios/{uid}/pacientes.
// O documento usuarios/{uid} guarda o perfil + plano/assinatura.
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase.js";

// ---------- PERFIL DO USUÁRIO ----------
export async function getPerfil(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function criarPerfilSeNovo(user) {
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const perfil = {
      email: user.email,
      nome: user.displayName || "",
      clinica: "Minha Clínica",
      medico: "",
      crm: "",
      plano: "nenhum",          // nenhum | mensal | trimestral | anual | vitalicio
      criadoEm: serverTimestamp(),
      planoDesde: null,
    };
    await setDoc(ref, perfil);
    return { id: user.uid, ...perfil };
  }
  return { id: snap.id, ...snap.data() };
}

export async function salvarConfigUsuario(uid, config) {
  await updateDoc(doc(db, "usuarios", uid), {
    clinica: config.clinica,
    medico: config.medico,
    crm: config.crm,
    logo: config.logo || null,
    murevNoPdf: config.murevNoPdf !== false,
  });
}

// ---------- PACIENTES (subcoleção do usuário) ----------
function pacientesCol(uid) {
  return collection(db, "usuarios", uid, "pacientes");
}

export async function listarPacientes(uid) {
  const q = query(pacientesCol(uid), orderBy("criadoEm", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function criarPaciente(uid, dados) {
  const ref = await addDoc(pacientesCol(uid), {
    ...dados, ciclos: dados.ciclos || [], ativo: true, criadoEm: serverTimestamp(),
  });
  return { id: ref.id, ...dados, ciclos: dados.ciclos || [], ativo: true };
}

export async function criarPacientesEmLote(uid, lista) {
  const criados = [];
  for (const d of lista) {
    const ref = await addDoc(pacientesCol(uid), {
      ...d, ciclos: d.ciclos || [], ativo: true, criadoEm: serverTimestamp(),
    });
    criados.push({ id: ref.id, ...d, ciclos: d.ciclos || [], ativo: true });
  }
  return criados;
}

export async function atualizarPaciente(uid, pacienteId, campos) {
  await updateDoc(doc(db, "usuarios", uid, "pacientes", pacienteId), campos);
}

export async function removerPaciente(uid, pacienteId) {
  await deleteDoc(doc(db, "usuarios", uid, "pacientes", pacienteId));
}

// ---------- ADMIN ----------
const VALOR_PLANO = { mensal: 29.9, trimestral: 79.9, anual: 199, vitalicio: 0, nenhum: 0 };

export async function listarTodosUsuarios() {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function definirPlano(uid, plano) {
  await updateDoc(doc(db, "usuarios", uid), {
    plano,
    planoDesde: serverTimestamp(),
  });
}

// Exclusão real (Auth + Firestore + pacientes) via Cloud Function.
// O client NUNCA tem permissão de delete direto (ver firestore.rules).
export async function excluirUsuarioAdmin(uid) {
  const fn = httpsCallable(functions, "excluirUsuarioAdmin");
  const res = await fn({ uid });
  return res.data;
}

export { VALOR_PLANO };
