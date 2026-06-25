// src/lib/auth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { observarSessao } from "../services/auth.js";
import { criarPerfilSeNovo } from "../services/db.js";
import { FIREBASE_ATIVO, ADMIN_EMAIL } from "../services/firebase.js";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [perfil, setPerfil]     = useState(null);
  const [carregando, setCarregando] = useState(FIREBASE_ATIVO);

  useEffect(() => {
    if (!FIREBASE_ATIVO) { setCarregando(false); return; }
    const unsub = observarSessao(async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await criarPerfilSeNovo(u);

          // Se o email do Auth diverge do Firestore (cliente confirmou troca),
          // atualiza o doc automaticamente — admin vê o novo email na hora.
          if (p.email && p.email !== u.email) {
            await updateDoc(doc(db, "usuarios", u.uid), { email: u.email });
            p.email = u.email;
          }

          setPerfil(p);
        } catch (e) {
          console.error("Erro ao carregar perfil:", e);
          setPerfil(null);
        } finally {
          setCarregando(false);
        }
      } else {
        setPerfil(null);
        setCarregando(false);
      }
    });
    return unsub;
  }, []);

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  return (
    <AuthCtx.Provider value={{ user, perfil, setPerfil, carregando, isAdmin, firebaseAtivo: FIREBASE_ATIVO }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
