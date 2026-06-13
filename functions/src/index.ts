// functions/src/index.ts
// Cloud Function callable: exclui Auth + documento Firestore de um usuário.
// Só pode ser chamada pelo admin (validado por custom claim OU email fixo).
//
// Deploy:
//   firebase deploy --only functions:excluirUsuarioAdmin
//
// Pré-requisito (uma vez, via Admin SDK ou script):
//   admin.auth().setCustomUserClaims(adminUid, { admin: true })
// Alternativa sem custom claim: valida por email (ADMIN_EMAIL abaixo).

import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "souzasoaresgabrie9@gmail.com";

export const excluirUsuarioAdmin = functions.onCall(
  { region: "southamerica-east1", enforceAppCheck: false },
  async (request) => {
    const auth = request.auth;

    if (!auth) {
      throw new functions.HttpsError("unauthenticated", "Login necessário.");
    }

    const isAdmin = auth.token.admin === true || auth.token.email === ADMIN_EMAIL;
    if (!isAdmin) {
      throw new functions.HttpsError("permission-denied", "Apenas o admin pode excluir usuários.");
    }

    const targetUid = request.data?.uid;
    if (!targetUid || typeof targetUid !== "string") {
      throw new functions.HttpsError("invalid-argument", "uid é obrigatório.");
    }

    if (targetUid === auth.uid) {
      throw new functions.HttpsError("invalid-argument", "Não é possível excluir a própria conta admin por aqui.");
    }

    const db = admin.firestore();

    // Apaga subcoleção de pacientes em lote antes do documento principal.
    const pacientesRef = db.collection("usuarios").doc(targetUid).collection("pacientes");
    const pacientesSnap = await pacientesRef.get();
    const batchSize = 400;
    for (let i = 0; i < pacientesSnap.docs.length; i += batchSize) {
      const batch = db.batch();
      pacientesSnap.docs.slice(i, i + batchSize).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Apaga o documento de perfil.
    await db.collection("usuarios").doc(targetUid).delete();

    // Apaga a conta no Firebase Auth (Admin SDK; impossível no client).
    try {
      await admin.auth().deleteUser(targetUid);
    } catch (e: any) {
      // Se a conta Auth já não existir, segue normalmente (idempotente).
      if (e.code !== "auth/user-not-found") throw e;
    }

    return { ok: true };
  }
);
