// src/screens/MeuPerfil.jsx
import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, KeyRound, User, CreditCard, ArrowUpDown, XCircle } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { redefinirSenha, traduzErroAuth } from "../services/auth.js";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../services/firebase.js";
import { useToast } from "../lib/toast.jsx";

const LABEL_PLANO = {
  nenhum:     "Sem plano ativo",
  mensal:     "Mensal — R$ 67,00/mês",
  trimestral: "Trimestral — R$ 177,00/trim.",
  anual:      "Anual — R$ 499,90/ano",
  vitalicio:  "Vitalício",
};

function fmtData(val) {
  if (!val) return null;
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return null; }
}

function diasRestantes(val) {
  if (!val) return null;
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

function Secao({ titulo, Icon, children }) {
  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
        <Icon size={17} color="var(--brand)" />
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, accent, sub }) {
  return (
    <div style={{ padding: "11px 14px", background: "var(--surface2)", borderRadius: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: accent || "var(--ink)" }}>{value || "—"}</div>
      {sub && <div style={{ fontSize: 12, color: accent || "var(--inkFaint)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function MeuPerfil() {
  const { user, perfil } = useAuth();
  const toast = useToast();

  // ── portal Stripe ──
  const [abrindoPortal, setAbrindoPortal] = useState(false);

  const abrirPortal = async () => {
    setAbrindoPortal(true);
    try {
      const res = await fetch("/api/create-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Falha ao abrir portal.");
      window.location.href = body.url;
    } catch (e) {
      toast(e.message || "Não foi possível abrir o portal de assinatura.", "error");
      setAbrindoPortal(false);
    }
  };

  // ── trocar email via Resend ──
  const [novoEmail, setNovoEmail]         = useState("");
  const [senhaEmail, setSenhaEmail]       = useState("");
  const [trocandoEmail, setTrocandoEmail] = useState(false);
  const [erroEmail, setErroEmail]         = useState("");
  const [emailEnviado, setEmailEnviado]   = useState(false);

  const trocarEmail = async () => {
    setErroEmail("");
    if (!novoEmail.trim()) { setErroEmail("Informe o novo email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail.trim())) { setErroEmail("Email inválido."); return; }
    if (!senhaEmail) { setErroEmail("Confirme sua senha atual."); return; }
    setTrocandoEmail(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, senhaEmail);
      await reauthenticateWithCredential(auth.currentUser, cred);

      const res = await fetch("/api/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAtual: user.email, emailNovo: novoEmail.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Falha ao enviar email.");

      setEmailEnviado(true);
      toast("Link de confirmação enviado para " + novoEmail.trim());
      setNovoEmail(""); setSenhaEmail("");
    } catch (e) {
      setErroEmail(e.message || traduzErroAuth(e.code));
    }
    setTrocandoEmail(false);
  };

  // ── alterar senha ──
  const [senhaAtual, setSenhaAtual]       = useState("");
  const [senhaNova, setSenhaNova]         = useState("");
  const [senhaConf, setSenhaConf]         = useState("");
  const [verSenha, setVerSenha]           = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [erroSenha, setErroSenha]         = useState("");

  const reqs = [
    { ok: senhaNova.length >= 8,    label: "Mínimo 8 caracteres" },
    { ok: /[A-Z]/.test(senhaNova),  label: "1 maiúscula" },
    { ok: /[0-9]/.test(senhaNova),  label: "1 número" },
  ];

  const trocarSenha = async () => {
    setErroSenha("");
    if (!senhaAtual) { setErroSenha("Informe a senha atual."); return; }
    if (!reqs.every((r) => r.ok)) { setErroSenha("A nova senha não atende aos requisitos."); return; }
    if (senhaNova !== senhaConf) { setErroSenha("As senhas não conferem."); return; }
    setTrocandoSenha(true);
    try {
      await redefinirSenha(senhaAtual, senhaNova);
      toast("Senha alterada com sucesso");
      setSenhaAtual(""); setSenhaNova(""); setSenhaConf("");
    } catch (e) { setErroSenha(traduzErroAuth(e.code)); }
    setTrocandoSenha(false);
  };

  const inp = {
    width: "100%", padding: "10px 12px", borderRadius: 9,
    border: "1px solid var(--line)", background: "var(--surface)",
    fontSize: 14, color: "var(--ink)", boxSizing: "border-box",
  };

  const planoAtivo   = perfil?.plano && perfil.plano !== "nenhum";
  const dataAdesao   = fmtData(perfil?.planoDesde);
  const dataValidade = fmtData(perfil?.acessoAte);
  const dias         = diasRestantes(perfil?.acessoAte);
  const vencendo     = dias !== null && dias <= 5 && dias > 0;
  const vencido      = dias !== null && dias <= 0;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 className="page-title">Meu perfil</h1>
        <p className="page-sub">Dados da sua conta e assinatura.</p>
      </div>

      {/* ── Conta ── */}
      <Secao titulo="Conta" Icon={User}>
        <InfoRow label="Email" value={user?.email} />
        <InfoRow
          label="Plano"
          value={LABEL_PLANO[perfil?.plano] || LABEL_PLANO.nenhum}
          accent={planoAtivo ? "var(--brand)" : "var(--inkFaint)"}
        />
        {planoAtivo && dataAdesao && <InfoRow label="Assinante desde" value={dataAdesao} />}
        {planoAtivo && perfil?.plano !== "vitalicio" && dataValidade && (
          <InfoRow
            label="Acesso válido até"
            value={dataValidade}
            accent={vencido ? "var(--warn)" : vencendo ? "#e67e22" : undefined}
            sub={
              vencido    ? "⚠️ Acesso expirado — renove sua assinatura" :
              vencendo   ? `⚠️ Expira em ${dias} dia${dias !== 1 ? "s" : ""}` :
              dias !== null ? `${dias} dias restantes` : null
            }
          />
        )}
        {perfil?.plano === "vitalicio" && (
          <InfoRow label="Acesso válido até" value="Vitalício" accent="var(--good)" />
        )}
      </Secao>

      {/* ── Assinatura ── */}
      {planoAtivo && perfil?.plano !== "vitalicio" && (
        <Secao titulo="Assinatura" Icon={CreditCard}>
          <p style={{ fontSize: 13, color: "var(--inkSoft)", marginBottom: 16, lineHeight: 1.6 }}>
            Gerencie seu plano, troque o cartão ou cancele a renovação diretamente pelo portal seguro da Stripe.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={abrirPortal}
              disabled={abrindoPortal}
              style={{ width: "100%", justifyContent: "flex-start", gap: 9 }}
            >
              {abrindoPortal
                ? <><Loader2 size={14} className="spin" /> Abrindo portal…</>
                : <><ArrowUpDown size={15} color="var(--brand)" /> Trocar de plano</>
              }
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (!window.confirm("Ao cancelar, seu acesso continua até o fim do período já pago. Deseja continuar?")) return;
                abrirPortal();
              }}
              disabled={abrindoPortal}
              style={{ width: "100%", justifyContent: "flex-start", gap: 9 }}
            >
              <XCircle size={15} color="var(--warn)" /> Cancelar renovação
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 14, lineHeight: 1.6 }}>
            Ao cancelar, seu acesso permanece ativo até o fim do período já pago. Seus pacientes e
            registros nunca são apagados.
          </p>
        </Secao>
      )}

      {/* ── Trocar email ── */}
      <Secao titulo="Trocar email" Icon={Mail}>
        {emailEnviado ? (
          <div style={{ fontSize: 14, color: "var(--good)", background: "var(--surface2)", padding: "14px 16px", borderRadius: 10, lineHeight: 1.6 }}>
            ✓ Link de confirmação enviado.<br />
            <span style={{ fontSize: 13, color: "var(--inkFaint)" }}>O email só muda após você clicar no link recebido.</span>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--inkSoft)", marginBottom: 16, lineHeight: 1.6 }}>
              Enviaremos um link de confirmação para o novo endereço. O email só muda após você confirmar pelo link.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="field">
                <label>Novo email</label>
                <input style={inp} type="email" maxLength={254} value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value.replace(/\s/g, ""))}
                  placeholder="novo@email.com" autoComplete="email" />
              </div>
              <div className="field">
                <label>Confirme sua senha atual</label>
                <input style={inp} type="password" value={senhaEmail}
                  onChange={(e) => setSenhaEmail(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" />
              </div>
              {erroEmail && (
                <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>{erroEmail}</div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={trocarEmail}
                  disabled={trocandoEmail || !novoEmail || !senhaEmail}
                  style={{ opacity: (trocandoEmail || !novoEmail || !senhaEmail) ? 0.6 : 1 }}>
                  {trocandoEmail ? <><Loader2 size={14} className="spin" /> Enviando…</> : "Enviar confirmação"}
                </button>
              </div>
            </div>
          </>
        )}
      </Secao>

      {/* ── Alterar senha ── */}
      <Secao titulo="Alterar senha" Icon={KeyRound}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label>Senha atual</label>
            <input style={inp} type="password" value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          <div className="field">
            <label>Nova senha</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: 40 }} type={verSenha ? "text" : "password"}
                value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)}
                placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              <button onClick={() => setVerSenha(!verSenha)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)", background: "none", border: "none", cursor: "pointer" }}>
                {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {senhaNova && (
              <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
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
            <input style={inp} type="password" value={senhaConf}
              onChange={(e) => setSenhaConf(e.target.value)} placeholder="Repita a nova senha" autoComplete="new-password" />
            {senhaConf && senhaNova !== senhaConf && (
              <span style={{ fontSize: 12, color: "var(--warn)", marginTop: 4, display: "block" }}>As senhas não conferem.</span>
            )}
          </div>
          {erroSenha && (
            <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>{erroSenha}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={trocarSenha}
              disabled={trocandoSenha || !senhaAtual || !senhaNova || !senhaConf}
              style={{ opacity: (trocandoSenha || !senhaAtual || !senhaNova || !senhaConf) ? 0.6 : 1 }}>
              {trocandoSenha ? <><Loader2 size={14} className="spin" /> Alterando…</> : "Alterar senha"}
            </button>
          </div>
        </div>
      </Secao>
    </div>
  );
}
