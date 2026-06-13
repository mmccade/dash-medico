// src/services/auth.js
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase.js";

export function entrar(email, senha) {
  return signInWithEmailAndPassword(auth, email, senha);
}

export function cadastrar(email, senha) {
  return createUserWithEmailAndPassword(auth, email, senha);
}

export function sair() {
  return signOut(auth);
}

export function observarSessao(callback) {
  return onAuthStateChanged(auth, callback);
}

// Traduz códigos de erro do Firebase para mensagens em português
export function traduzErroAuth(code) {
  const mapa = {
    "auth/invalid-email": "Email inválido.",
    "auth/user-not-found": "Não encontramos uma conta com esse email.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/invalid-credential": "Email ou senha incorretos.",
    "auth/email-already-in-use": "Já existe uma conta com esse email.",
    "auth/weak-password": "A senha precisa ter ao menos 6 caracteres.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente em instantes.",
    "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
  };
  return mapa[code] || "Não foi possível concluir. Tente novamente.";
}
