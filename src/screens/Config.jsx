// src/screens/Config.jsx
// Alterações:
//  - Seção "Conta" com email do usuário e redefinir senha (pede senha atual + nova)
//  - Validação de senha nova: 8+ chars, 1 maiúscula, 1 número (mesmos requisitos do admin)

import { useState, useRef } from "react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { useAuth } from "../lib/auth.jsx";
import { validateConfig, primeiroErro } from "../lib/validate.js";
import { redefinirSenha, traduzErroAuth } from "../services/auth.js";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function Config() {
  const { config, salvarConfig } = useStore();
  const { user, perfil } = useAuth();
  const toast = useToast();
  const logoRef = useRef(null);
  const [f, setF] = useState({ ...config });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  // Estado de troca de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConf, setSenhaConf] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");

  const reqs = [
    { ok: senhaNova.length >= 8, label: "Mínimo 8 caracteres" },
    { ok: /[A-Z]/.test(senhaNova), label: "1 letra maiúscula" },
    { ok: /[0-9]/.test(senhaNova), label: "1 número" },
  ];
  const senhaValida = reqs.every((r) => r.ok);

  const onLogo = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Logo deve ter até 2 MB"); return; }
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast("Use PNG, JPEG ou WebP"); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => set("logo", e.target.result);
    reader.readAsDataURL(file);
  };

  const salvar = () => {
    const { data, errors } = validateConfig(f);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    salvarConfig(data);
    toast("Configurações salvas");
  };

  const trocarSenha = async () => {
    setErroSenha("");
    if (!senhaAtual) { setErroSenha("Informe a senha atual."); return; }
    if (!senhaValida) { setErroSenha("A nova senha não atende aos requisitos."); return; }
    if (senhaNova !== senhaConf) { setErroSenha("A confirmação não confere."); return; }
    setTrocandoSenha(true);
    try {
      await redefinirSenha(senhaAtual, senhaNova);
      toast("Senha alterada com sucesso");
      setSenhaAtual(""); setSenhaNova(""); setSenhaConf("");
    } catch (e) {
      setErroSenha(traduzErroAuth(e.code));
    }
    setTrocandoSenha(false);
  };

  const inp = { width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, color: "var(--ink)", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div><h1 className="page-title">Configurações</h1><p className="page-sub">Dados que aparecem nos PDFs gerados.</p></div>

      {/* ── Identidade da clínica ── */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Identidade da clínica</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Nome da clínica *</label>
            <input type="text" maxLength={300} value={f.clinica} onChange={(e) => set("clinica", e.target.value)} placeholder="Clínica Exemplo" />
          </div>
          <div className="field">
            <label>Nome do médico</label>
            <input type="text" maxLength={150} value={f.medico} onChange={(e) => set("medico", e.target.value)} placeholder="Dr. Nome Sobrenome" />
          </div>
          <div className="field">
            <label>CRM</label>
            <input type="text" maxLength={20} value={f.crm} onChange={(e) => set("crm", e.target.value)} placeholder="CRM/SP 12345" />
          </div>

          {/* Logo */}
          <div className="field">
            <label>Logo da clínica</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
              {f.logo ? (
                <img src={f.logo} alt="Logo" style={{ height: 52, maxWidth: 140, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", cursor: "pointer" }}
                  onClick={() => logoRef.current?.click()} title="Clique para trocar" />
              ) : (
                <div onClick={() => logoRef.current?.click()}
                  style={{ height: 52, width: 120, border: "1px dashed var(--line)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--inkFaint)", fontSize: 12, cursor: "pointer" }}>
                  Clique para adicionar
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button className="btn btn-ghost sm" onClick={() => logoRef.current?.click()} style={{ fontSize: 12 }}>
                  {f.logo ? "Trocar logo" : "Adicionar logo"}
                </button>
                {f.logo && (
                  <button className="btn btn-ghost sm" onClick={() => set("logo", null)} style={{ fontSize: 12, color: "var(--bad)" }}>
                    Remover
                  </button>
                )}
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: "none" }} onChange={(e) => onLogo(e.target.files[0])} />
            <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 6 }}>PNG, JPEG ou WebP · máx. 2 MB</p>
          </div>

          {/* Branding Murev no PDF */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "var(--surface2)", borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Rodapé Murev Acompanha no PDF</div>
              <div style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 2 }}>Exibe "Gerado por Murev Acompanha" nos PDFs</div>
            </div>
            <div onClick={() => set("murevNoPdf", !f.murevNoPdf)}
              style={{ width: 42, height: 24, borderRadius: 99, background: f.murevNoPdf ? "var(--brand)" : "var(--line)", cursor: "pointer", position: "relative", transition: "background .2s" }}>
              <div style={{ width: 18, height: 18, background: "#fff", borderRadius: 99, position: "absolute", top: 3, left: f.murevNoPdf ? 21 : 3, transition: "left .2s" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={salvar}>Salvar configurações</button>
      </div>

      {/* ── Conta ── */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Conta</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Email */}
          <div style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Email da conta</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.email || "—"}</div>
          </div>

          {/* Plano ativo */}
          {perfil?.plano && perfil.plano !== "nenhum" && (
            <div style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Plano ativo</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand)", textTransform: "capitalize" }}>{perfil.plano}</div>
              </div>
              {perfil.planoDesde && (
                <div style={{ fontSize: 12, color: "var(--inkFaint)", textAlign: "right" }}>
                  desde {new Date(perfil.planoDesde?.toDate?.() ?? perfil.planoDesde).toLocaleDateString("pt-BR")}
                </div>
              )}
            </div>
          )}

          {/* Redefinir senha */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Alterar senha</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="field">
                <label>Senha atual</label>
                <input style={inp} type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
              <div className="field">
                <label>Nova senha</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inp, paddingRight: 40 }} type={verSenha ? "text" : "password"} value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                  <button onClick={() => setVerSenha(!verSenha)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }}>
                    {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {senhaNova && (
                  <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    {reqs.map((r) => (
                      <span key={r.label} style={{ fontSize: 12, color: r.ok ? "var(--good)" : "var(--inkFaint)" }}>
                        {r.ok ? "✓" : "○"} {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="field">
                <label>Confirmar nova senha</label>
                <input style={inp} type="password" value={senhaConf} onChange={(e) => setSenhaConf(e.target.value)} placeholder="Repita a nova senha" autoComplete="new-password" />
                {senhaConf && senhaNova !== senhaConf && (
                  <span style={{ fontSize: 12, color: "var(--warn)", marginTop: 4 }}>As senhas não conferem.</span>
                )}
              </div>

              {erroSenha && (
                <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>
                  {erroSenha}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={trocarSenha} disabled={trocandoSenha || !senhaAtual || !senhaNova || !senhaConf}
                  style={{ opacity: (trocandoSenha || !senhaAtual || !senhaNova || !senhaConf) ? 0.6 : 1 }}>
                  {trocandoSenha ? <><Loader2 size={14} className="spin" /> Alterando…</> : "Alterar senha"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
