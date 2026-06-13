// src/screens/Login.jsx
import { useState } from "react";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import { entrar, cadastrar, traduzErroAuth } from "../services/auth.js";
import { useTema } from "../lib/theme.jsx";
import { Sun, Moon } from "lucide-react";
import Logo from "../components/Logo.jsx";

export default function Login() {
  const { tema, alternar } = useTema();
  const [modo, setModo] = useState("entrar"); // entrar | cadastrar
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const submeter = async () => {
    setErro("");
    if (!email.trim() || !senha) { setErro("Preencha email e senha."); return; }
    setCarregando(true);
    try {
      if (modo === "entrar") await entrar(email.trim(), senha);
      else await cadastrar(email.trim(), senha);
      // o observador de sessão cuida do redirecionamento
    } catch (e) {
      setErro(traduzErroAuth(e.code));
      setCarregando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "var(--bg)" }}>
      <button onClick={alternar} className="btn btn-ghost sm" style={{ position: "fixed", top: 20, right: 20, padding: 8 }}>
        {tema === "escuro" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><Logo /></div>
        <div className="card" style={{ padding: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--inkSoft)", marginBottom: 22 }}>
            {modo === "entrar" ? "Acesse o acompanhamento dos seus pacientes." : "Comece a acompanhar seus pacientes."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submeter()} placeholder="seu@email.com" autoComplete="email" />
            </div>
            <div className="field">
              <label>Senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submeter()} placeholder="••••••••"
                autoComplete={modo === "entrar" ? "current-password" : "new-password"} />
            </div>

            {erro && (
              <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>
                {erro}
              </div>
            )}

            <button className="btn btn-primary" onClick={submeter} disabled={carregando} style={{ marginTop: 4, opacity: carregando ? 0.7 : 1 }}>
              {carregando ? <Loader2 size={16} className="spin" /> : modo === "entrar" ? <LogIn size={16} /> : <UserPlus size={16} />}
              {modo === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--inkSoft)" }}>
            {modo === "entrar" ? "Ainda não tem conta? " : "Já tem conta? "}
            <button onClick={() => { setModo(modo === "entrar" ? "cadastrar" : "entrar"); setErro(""); }}
              style={{ color: "var(--brand)", fontWeight: 600 }}>
              {modo === "entrar" ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11.5, color: "var(--inkFaint)", lineHeight: 1.6 }}>
          Murev Acompanha · ferramenta de apoio ao acompanhamento clínico
        </div>
      </div>
    </div>
  );
}
