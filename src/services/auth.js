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
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase.js";

// Entrar — persistência configurável
// lembrar = true → sessão persiste após fechar o browser (localStorage)
// lembrar = false → sessão some ao fechar a aba (sessionStorage)
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

// Enviar email de redefinição (para tela de login — "esqueci minha senha")
export function enviarEmailRedefinicao(email) {
  return sendPasswordResetEmail(auth, email);
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
  };
  return mapa[code] || "Não foi possível concluir. Tente novamente.";
}
