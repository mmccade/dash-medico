// src/screens/Login.jsx
// Alterações:
//  - Checkbox "Manter conectado" (passa lembrar=true/false para entrar())
//  - Link "Esqueci minha senha" → manda email de redefinição pelo Firebase

import { useState } from "react";
import { LogIn, Loader2, Mail } from "lucide-react";
import { entrar, enviarEmailRedefinicao, traduzErroAuth } from "../services/auth.js";
import { useTema } from "../lib/theme.jsx";
import { Sun, Moon } from "lucide-react";
import Logo from "../components/Logo.jsx";

export default function Login() {
  const { tema, alternar } = useTema();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Estado do fluxo "esqueci minha senha"
  const [modoReset, setModoReset] = useState(false);
  const [emailReset, setEmailReset] = useState("");
  const [resetEnviado, setResetEnviado] = useState(false);
  const [resetCarregando, setResetCarregando] = useState(false);
  const [resetErro, setResetErro] = useState("");

  const submeter = async () => {
    setErro("");
    if (!email.trim() || !senha) { setErro("Preencha email e senha."); return; }
    setCarregando(true);
    try {
      await entrar(email.trim(), senha, lembrar);
    } catch (e) {
      setErro(traduzErroAuth(e.code));
      setCarregando(false);
    }
  };

  const enviarReset = async () => {
    setResetErro("");
    if (!emailReset.trim()) { setResetErro("Informe seu email."); return; }
    setResetCarregando(true);
    try {
      await enviarEmailRedefinicao(emailReset.trim());
      setResetEnviado(true);
    } catch (e) {
      setResetErro(traduzErroAuth(e.code));
    }
    setResetCarregando(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "var(--bg)" }}>
      <button onClick={alternar} className="btn btn-ghost sm" style={{ position: "fixed", top: 20, right: 20, padding: 8 }}>
        {tema === "escuro" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}><Logo /></div>

        {/* ── Tela de login ── */}
        {!modoReset && (
          <div className="card" style={{ padding: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Entrar</h1>
            <p style={{ fontSize: 13.5, color: "var(--inkSoft)", marginBottom: 22 }}>
              Acesse o acompanhamento dos seus pacientes.
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
                  onKeyDown={(e) => e.key === "Enter" && submeter()} placeholder="••••••••" autoComplete="current-password" />
              </div>

              {/* Manter conectado */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                <div onClick={() => setLembrar(!lembrar)} style={{
                  width: 42, height: 24, borderRadius: 99,
                  background: lembrar ? "var(--brand)" : "var(--line)",
                  position: "relative", transition: "background .2s", flexShrink: 0,
                }}>
                  <div style={{
                    width: 18, height: 18, background: "#fff", borderRadius: 99,
                    position: "absolute", top: 3, left: lembrar ? 21 : 3, transition: "left .2s",
                  }} />
                </div>
                <span style={{ fontSize: 13, color: "var(--inkSoft)" }}>Manter conectado</span>
              </label>

              {erro && (
                <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>
                  {erro}
                </div>
              )}

              <button className="btn btn-primary" onClick={submeter} disabled={carregando}
                style={{ marginTop: 4, opacity: carregando ? 0.7 : 1 }}>
                {carregando ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
                Entrar
              </button>

              {/* Link esqueci minha senha */}
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <button onClick={() => { setModoReset(true); setEmailReset(email); setErro(""); }}
                  style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600 }}>
                  Esqueci minha senha
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tela de reset de senha ── */}
        {modoReset && (
          <div className="card" style={{ padding: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Redefinir senha</h1>
            <p style={{ fontSize: 13.5, color: "var(--inkSoft)", marginBottom: 22 }}>
              Enviaremos um link para o seu email.
            </p>

            {resetEnviado ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
                <Mail size={36} color="var(--good)" />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Email enviado!</div>
                  <div style={{ fontSize: 13.5, color: "var(--inkSoft)" }}>
                    Verifique sua caixa de entrada em <strong>{emailReset}</strong> e siga o link para criar uma nova senha.
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => { setModoReset(false); setResetEnviado(false); }}>
                  Voltar ao login
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="field">
                  <label>Email da conta</label>
                  <input type="email" value={emailReset} onChange={(e) => setEmailReset(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && enviarReset()} placeholder="seu@email.com" autoComplete="email" />
                </div>

                {resetErro && (
                  <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>
                    {resetErro}
                  </div>
                )}

                <button className="btn btn-primary" onClick={enviarReset} disabled={resetCarregando}
                  style={{ opacity: resetCarregando ? 0.7 : 1 }}>
                  {resetCarregando ? <Loader2 size={16} className="spin" /> : <Mail size={16} />}
                  Enviar link de redefinição
                </button>

                <button className="btn btn-ghost" onClick={() => setModoReset(false)}>
                  Voltar ao login
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11.5, color: "var(--inkFaint)", lineHeight: 1.6 }}>
          Murev Acompanha · ferramenta de apoio ao acompanhamento clínico
        </div>
      </div>
    </div>
  );
}
