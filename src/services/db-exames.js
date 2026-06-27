// src/services/db-exames.js
// Funções Firestore para anamnese e exames laboratoriais
// Adicionar os imports no db.js existente ou importar daqui separado

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";

// ─── Helpers ──────────────────────────────────────────────────
function anamneseRef(uid, pid) {
  return doc(db, "usuarios", uid, "pacientes", pid, "anamnese", "dados");
}
function examesCol(uid, pid) {
  return collection(db, "usuarios", uid, "pacientes", pid, "exames");
}
function exameRef(uid, pid, eid) {
  return doc(db, "usuarios", uid, "pacientes", pid, "exames", eid);
}

// ─── Anamnese ─────────────────────────────────────────────────
export async function getAnamnese(uid, pid) {
  const snap = await getDoc(anamneseRef(uid, pid));
  return snap.exists() ? snap.data() : null;
}

export async function salvarAnamnese(uid, pid, dados) {
  await setDoc(anamneseRef(uid, pid), {
    ...dados,
    atualizadoEm: serverTimestamp(),
  }, { merge: true });
}

// ─── Exames ───────────────────────────────────────────────────
export async function listarExames(uid, pid) {
  const q = query(examesCol(uid, pid), orderBy("criadoEm", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function salvarExame(uid, pid, dados) {
  const ref = await addDoc(examesCol(uid, pid), {
    ...dados,
    criadoEm: serverTimestamp(),
  });
  return { id: ref.id, ...dados };
}

export async function atualizarExame(uid, pid, eid, dados) {
  await updateDoc(exameRef(uid, pid, eid), {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}

export async function excluirExame(uid, pid, eid) {
  await deleteDoc(exameRef(uid, pid, eid));
}

// ─── Protocolo (medicamentos + suplementos) ───────────────────
function protocoloRef(uid, pid) {
  return doc(db, "usuarios", uid, "pacientes", pid, "protocolo", "dados");
}

export async function getProtocolo(uid, pid) {
  const snap = await getDoc(protocoloRef(uid, pid));
  return snap.exists() ? snap.data() : null;
}

export async function salvarProtocolo(uid, pid, dados) {
  await setDoc(protocoloRef(uid, pid), {
    ...dados,
    atualizadoEm: serverTimestamp(),
  }, { merge: true });
}

// ─── Contadores brutos (para Relatório) ───────────────────────
// Conta total de exames lidos e anamneses preenchidas em todos os pacientes.
export async function contarClinico(uid, pacienteIds) {
  let totalExames = 0;
  let totalAnamneses = 0;
  await Promise.all(pacienteIds.map(async (pid) => {
    try {
      const exSnap = await getDocs(examesCol(uid, pid));
      totalExames += exSnap.size;
      const anSnap = await getDoc(anamneseRef(uid, pid));
      if (anSnap.exists()) totalAnamneses += 1;
    } catch (e) { console.warn("contarClinico falhou para", pid, e); }
  }));
  return { totalExames, totalAnamneses };
}
