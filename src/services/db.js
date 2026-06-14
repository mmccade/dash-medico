// src/services/db.js
// Camada de dados sobre o Firestore.
// Alterações em relação à Fase 3:
//  - Soft-delete: excluirUsuario marca excluido:true em vez de deleteDoc
//  - Audit log: toda ação de admin grava em audit_logs/{uid_admin}_{timestamp}
//  - criarPerfilSeNovo: salva campo `origem` (default "direto")
//  - listarTodosUsuarios: filtra excluidos por padrão

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { ADMIN_EMAIL } from "./firebase.js";

// ─── Audit Log ───────────────────────────────────────────────
// Grava na coleção audit_logs toda ação administrativa sensível.
async function auditLog(adminUid, acao, alvoUid, detalhes = {}) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      adminUid,
      acao,          // ex: "alterar_plano", "excluir_usuario", "criar_usuario"
      alvoUid,
      detalhes,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    // Nunca deixa o audit log quebrar a ação principal
    console.warn("audit_log falhou:", e);
  }
}

// ─── PERFIL DO USUÁRIO ────────────────────────────────────────
export async function getPerfil(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function criarPerfilSeNovo(user, origem = "direto") {
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const perfil = {
      email: user.email,
      nome: user.displayName || "",
      clinica: "Minha Clínica",
      medico: "",
      crm: "",
      plano: "nenhum",
      criadoEm: serverTimestamp(),
      planoDesde: null,
      origem,          // "webhook" | "admin" | "direto"
      excluido: false,
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

// ─── PACIENTES ────────────────────────────────────────────────
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

// ─── ADMIN ────────────────────────────────────────────────────
const VALOR_PLANO = { mensal: 29.9, trimestral: 79.9, anual: 199, vitalicio: 0, nenhum: 0 };

export async function listarTodosUsuarios(incluirExcluidos = false) {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => incluirExcluidos || !u.excluido);
}

export async function definirPlano(uid, plano, adminUid = null) {
  await updateDoc(doc(db, "usuarios", uid), {
    plano,
    planoDesde: serverTimestamp(),
  });
  if (adminUid) {
    await auditLog(adminUid, "alterar_plano", uid, { plano });
  }
}

// Soft-delete: marca excluido:true, preserva dados clínicos
export async function excluirUsuario(uid, adminUid) {
  await updateDoc(doc(db, "usuarios", uid), {
    excluido: true,
    excluidoEm: serverTimestamp(),
    excluidoPor: adminUid,
  });
  await auditLog(adminUid, "excluir_usuario", uid);
}

// Restaura usuário excluído
export async function restaurarUsuario(uid, adminUid) {
  await updateDoc(doc(db, "usuarios", uid), {
    excluido: false,
    excluidoEm: null,
    excluidoPor: null,
  });
  await auditLog(adminUid, "restaurar_usuario", uid);
}

export { VALOR_PLANO, auditLog };
