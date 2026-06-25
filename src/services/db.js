// src/services/db.js
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, query, orderBy, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

// ─── Planos ───────────────────────────────────────────────────
export const DIAS_PLANO = {
  semanal:    7,
  mensal:     30,
  trimestral: 90,
  semestral:  180,
  anual:      365,
  vitalicio:  99999,
  nenhum:     0,
};

export const VALOR_PLANO = {
  semanal:    19.9,
  mensal:     67,
  trimestral: 177,
  semestral:  0,
  anual:      0,
  vitalicio:  0,
  nenhum:     0,
};

function calcularAcessoAte(plano) {
  const dias = DIAS_PLANO[plano] || 0;
  if (!dias || dias >= 99999) return null;
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return Timestamp.fromDate(d);
}

// ─── Audit Log ────────────────────────────────────────────────
export async function auditLog(adminUid, acao, alvoUid, detalhes = {}) {
  try {
    await addDoc(collection(db, "audit_logs"), {
      adminUid, acao, alvoUid, detalhes, timestamp: serverTimestamp(),
    });
  } catch (e) { console.warn("audit_log falhou:", e); }
}

// ─── Perfil ───────────────────────────────────────────────────
export async function getPerfil(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function criarPerfilSeNovo(user, origem = "direto") {
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const perfil = {
      email: user.email, nome: user.displayName || "",
      clinica: "Minha Clínica", medico: "", crm: "",
      plano: "nenhum", criadoEm: serverTimestamp(), planoDesde: null,
      acessoAte: null, status: "inativo", statusAssinatura: "inativo",
      origem, excluido: false,
    };
    await setDoc(ref, perfil);
    return { id: user.uid, ...perfil };
  }
  return { id: snap.id, ...snap.data() };
}

export async function salvarConfigUsuario(uid, config) {
  await updateDoc(doc(db, "usuarios", uid), {
    clinica: config.clinica, medico: config.medico, crm: config.crm,
    logo: config.logo || null, murevNoPdf: config.murevNoPdf !== false,
  });
}

// ─── Pacientes ────────────────────────────────────────────────
function pacientesCol(uid) { return collection(db, "usuarios", uid, "pacientes"); }

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

function limparUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function atualizarPaciente(uid, pacienteId, campos) {
  await updateDoc(doc(db, "usuarios", uid, "pacientes", pacienteId), limparUndefined(campos));
}

export async function removerPaciente(uid, pacienteId) {
  await deleteDoc(doc(db, "usuarios", uid, "pacientes", pacienteId));
}

// ─── Admin ────────────────────────────────────────────────────
export async function listarTodosUsuarios(incluirExcluidos = false) {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => incluirExcluidos || !u.excluido)
    .sort((a, b) => {
      const ta = a.criadoEm?.toMillis?.() ?? 0;
      const tb = b.criadoEm?.toMillis?.() ?? 0;
      return tb - ta;
    });
}

export async function buscarUsuario(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function contarPacientesPorUsuario(uids) {
  const resultado = {};
  await Promise.all(uids.map(async (uid) => {
    try {
      const snap = await getDocs(pacientesCol(uid));
      let ativos = 0;
      snap.docs.forEach((d) => { if (d.data().ativo !== false) ativos++; });
      resultado[uid] = { total: snap.size, ativos };
    } catch (e) {
      console.warn("contarPacientes falhou para", uid, e);
      resultado[uid] = { total: 0, ativos: 0 };
    }
  }));
  return resultado;
}

export async function definirPlano(uid, plano, adminUid = null) {
  const acessoAte = calcularAcessoAte(plano);
  await updateDoc(doc(db, "usuarios", uid), {
    plano,
    planoDesde: serverTimestamp(),
    acessoAte,
    status: plano === "nenhum" ? "inativo" : "ativo",
    statusAssinatura: plano === "nenhum" ? "inativo" : "ativo",
  });
  if (adminUid) await auditLog(adminUid, "alterar_plano", uid, { plano });
}

export async function excluirUsuario(uid, adminUid) {
  await updateDoc(doc(db, "usuarios", uid), {
    excluido: true, excluidoEm: serverTimestamp(), excluidoPor: adminUid,
    status: "inativo",
  });
  await auditLog(adminUid, "excluir_usuario", uid);
}

export async function restaurarUsuario(uid, adminUid) {
  await updateDoc(doc(db, "usuarios", uid), {
    excluido: false, excluidoEm: null, excluidoPor: null,
  });
  await auditLog(adminUid, "restaurar_usuario", uid);
}
