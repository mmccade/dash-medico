// src/services/firebase.js
// Inicialização do Firebase. As chaves vêm do .env (VITE_FIREBASE_*).
// Enquanto o .env não estiver preenchido, o app roda em MODO DEMO (dados locais).

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Detecta se o Firebase está configurado de verdade
export const FIREBASE_ATIVO =
  !!config.apiKey && config.apiKey !== "cole_aqui" && !!config.projectId;

export const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "souzasoaresgabrie9@gmail.com";

let app = null;
let auth = null;
let db = null;
let functions = null;

if (FIREBASE_ATIVO) {
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app, "southamerica-east1");
  } catch (e) {
    console.error("Falha ao inicializar Firebase:", e);
  }
}

export { app, auth, db, functions };
