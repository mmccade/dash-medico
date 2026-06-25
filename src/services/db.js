// src/services/db.js
import {
  collection, doc, getDocs, getDoc, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

// ─── Planos: dias de acesso e valores ────────────────────────
export const DIAS_PLANO = {
  semanal:     7,
  mensal:      30,
  trimestral:  90,
  semestral:   180,
  anual:       365,
  vitalicio:   99999,
  nenhum:      0,
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

// ─── Calcula acessoAte a partir de hoje + dias do plano ──────
function calcularAcessoAte(plano) {
  const dias = DIAS_PLANO[plano] || 0;
  if (!dias) return null;
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return Timestamp.fromDate(d);
}

// ─── Helpers ─────────────────────────────────────────────────
export async function auditLog(adminUid, acao, alvoUid, extra = {}) {
  try {
    await addDoc(collection(db, "auditoria"), {
      adminUid, acao, alvoUid, ...extra,
      criadoEm: serverTimestamp(),
    });
  } catch (e) {
    console.warn("[auditLog] falhou:", e);
  }
}

// ─── Usuários ─────────────────────────────────────────────────
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

// Ao definir plano pelo admin: recalcula acessoAte automaticamente
export async function definirPlano(uid, plano, adminUid = null) {
  const acessoAte = calcularAcessoAte(plano);
  await updateDoc(doc(db, "usuarios", uid), {
    plano,
    planoDesde: serverTimestamp(),
    acessoAte,
    // reativa se estava pausado
    status: plano === "nenhum" ? "inativo" : "ativo",
    statusAssinatura: plano === "nenhum" ? "inativo" : "ativo",
  });
  if (adminUid) await auditLog(adminUid, "alterar_plano", uid, { plano, acessoAte: acessoAte?.toDate().toISOString() });
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

// ─── Pacientes ────────────────────────────────────────────────
export async function contarPacientesPorUsuario(uids) {
  if (!uids.length) return {};
  const counts = {};
  await Promise.all(
    uids.map(async (uid) => {
      try {
        const snap = await getDocs(
          query(collection(db, "usuarios", uid, "pacientes"))
        );
        const total = snap.size;
        const ativos = snap.docs.filter((d) => !d.data().arquivado && !d.data().excluido).length;
        counts[uid] = { total, ativos };
      } catch {
        counts[uid] = { total: 0, ativos: 0 };
      }
    })
  );
  return counts;
}

export { auditLog as default };
