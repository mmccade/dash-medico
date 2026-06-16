// src/services/auth.js
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "./firebase.js";

// Entrar — persistência configurável
export async function entrar(email, senha, lembrar = true) {
  await setPersistence(auth, lembrar ? browserLocalPersistence : browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, senha);
}

export function sair() {
  return signOut(auth);
}

export function observarSessao(callback) {
  return onAuthStateChanged(auth, callback);
}

// Redefinir senha do usuário logado (precisa reautenticar antes)
export async function redefinirSenha(senhaAtual, senhaNova) {
  const user = auth.currentUser;
  if (!user) throw new Error("Nenhum usuário logado.");
  const cred = EmailAuthProvider.credential(user.email, senhaAtual);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, senhaNova);
}

// Enviar email de redefinição via API Vercel + Resend
// O email sai de noreply@murev.com.br em vez do Firebase
export async function enviarEmailRedefinicao(email) {
  const res = await fetch("/api/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || "Falha ao enviar email.");
    err.code = "api/reset-failed";
    throw err;
  }

  return res.json();
}

export function traduzErroAuth(code) {
  const mapa = {
    "auth/invalid-email": "Email inválido.",
    "auth/user-not-found": "Não encontramos uma conta com esse email.",
    "auth/wrong-password": "Senha atual incorreta.",
    "auth/invalid-credential": "Email ou senha incorretos.",
    "auth/email-already-in-use": "Já existe uma conta com esse email.",
    "auth/weak-password": "A senha precisa ter ao menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente em instantes.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
    "auth/requires-recent-login": "Por segurança, faça login novamente antes de trocar a senha.",
    "api/reset-failed": "Não foi possível enviar o email. Tente novamente.",
  };
  return mapa[code] || "Não foi possível concluir. Tente novamente.";
}
