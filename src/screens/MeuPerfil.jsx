// src/screens/MeuPerfil.jsx
// Tela dedicada ao perfil do usuário logado.
// Seções:
//  - Resumo: email, plano ativo, data de adesão
//  - Trocar email
//  - Redefinir senha

import { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, KeyRound, User, CreditCard, ArrowUpDown, XCircle, MessageCircle } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { redefinirSenha, traduzErroAuth } from "../services/auth.js";
import {
  updateEmail, reauthenticateWithCredential,
  EmailAuthProvider, verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth } from "../services/firebase.js";
import { useToast } from "../lib/toast.jsx";

const LABEL_PLANO = {
  nenhum: "Sem plano ativo",
  mensal: "Mensal — R$ 29,90/mês",
  trimestral: "Trimestral — R$ 79,90/trim.",
  anual: "Anual — R$ 199,00/ano",
  vitalicio: "Vitalício",
};

function fmtData(val) {
  if (!val) return null;
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return null; }
}

// ─── Seção genérica com título ────────────────────────────────
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

// ─── Bloco de info somente leitura ────────────────────────────
function InfoRow({ label, value, accent }) {
  return (
    <div style={{ padding: "11px 14px", background: "var(--surface2)", borderRadius: 10, marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: accent || "var(--ink)" }}>{value || "—"}</div>
    </div>
  );
}

// ─── Tela principal ───────────────────────────────────────────
// WhatsApp comercial da Murev — usado como canal de gestão de assinatura
// enquanto o portal de autogestão da Cacto não estiver plugado.
const WHATSAPP_MUREV = "https://wa.me/55SEUNUMERO"; // TODO: trocar pelo número real

export default function MeuPerfil() {
  const { user, perfil } = useAuth();
  const toast = useToast();

  // ── gerenciar assinatura ──
  const [abrindoPortal, setAbrindoPortal] = useState(false);

  // Abre o portal de autogestão da Cacto (se houver URL configurada) ou cai pro WhatsApp.
  // Quando a Cacto expuser o link do customer portal, basta preencher perfil.cactoPortalUrl
  // (gravado pelo webhook) ou a env VITE_CACTO_PORTAL_URL.
  const abrirGestaoAssinatura = (assunto) => {
    setAbrindoPortal(true);
    const portal = perfil?.cactoPortalUrl || import.meta.env.VITE_CACTO_PORTAL_URL;
    if (portal) {
      window.open(portal, "_blank", "noopener,noreferrer");
    } else {
      const msg = encodeURIComponent(
        `Olá! Sou ${user?.email} e gostaria de ${assunto} da minha assinatura do Murev Acompanha.`
      );
      window.open(`${WHATSAPP_MUREV}?text=${msg}`, "_blank", "noopener,noreferrer");
    }
    setTimeout(() => setAbrindoPortal(false), 800);
  };

  const trocarPlano = () => abrirGestaoAssinatura("trocar o plano");
  const cancelarAssinatura = () => {
    if (!window.confirm("Deseja solicitar o cancelamento da renovação? Seu acesso continua ativo até o fim do período já pago.")) return;
    abrirGestaoAssinatura("cancelar a renovação");
  };

  // ── trocar email ──
  const [novoEmail, setNovoEmail] = useState("");
  const [senhaEmail, setSenhaEmail] = useState("");
  const [trocandoEmail, setTrocandoEmail] = useState(false);
  const [erroEmail, setErroEmail] = useState("");

  const trocarEmail = async () => {
    setErroEmail("");
    if (!novoEmail.trim()) { setErroEmail("Informe o novo email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail.trim())) { setErroEmail("Email inválido."); return; }
    if (!senhaEmail) { setErroEmail("Confirme sua senha atual."); return; }
    setTrocandoEmail(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, senhaEmail);
      await reauthenticateWithCredential(auth.currentUser, cred);
      // verifyBeforeUpdateEmail envia confirmação para o novo endereço antes de trocar
      await verifyBeforeUpdateEmail(auth.currentUser, novoEmail.trim());
      toast("Enviamos um link de confirmação para " + novoEmail.trim() + ". Verifique sua caixa de entrada.");
      setNovoEmail(""); setSenhaEmail("");
    } catch (e) {
      setErroEmail(traduzErroAuth(e.code));
    }
    setTrocandoEmail(false);
  };

  // ── redefinir senha ──
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConf, setSenhaConf] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");

  const reqs = [
    { ok: senhaNova.length >= 8, label: "Mínimo 8 caracteres" },
    { ok: /[A-Z]/.test(senhaNova), label: "1 maiúscula" },
    { ok: /[0-9]/.test(senhaNova), label: "1 número" },
  ];
  const senhaValida = reqs.every((r) => r.ok);

  const trocarSenha = async () => {
    setErroSenha("");
    if (!senhaAtual) { setErroSenha("Informe a senha atual."); return; }
    if (!senhaValida) { setErroSenha("A nova senha não atende aos requisitos."); return; }
    if (senhaNova !== senhaConf) { setErroSenha("As senhas não conferem."); return; }
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

  const inp = {
    width: "100%", padding: "10px 12px", borderRadius: 9,
    border: "1px solid var(--line)", background: "var(--surface)",
    fontSize: 14, color: "var(--ink)", boxSizing: "border-box",
  };

  const dataPlano = fmtData(perfil?.planoDesde);
  const planoAtivo = perfil?.plano && perfil.plano !== "nenhum";

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1 className="page-title">Meu perfil</h1>
        <p className="page-sub">Dados da sua conta e assinatura.</p>
      </div>

      {/* ── Resumo da conta ── */}
      <Secao titulo="Conta" Icon={User}>
        <InfoRow label="Email" value={user?.email} />
        <InfoRow
          label="Plano"
          value={LABEL_PLANO[perfil?.plano] || LABEL_PLANO.nenhum}
          accent={planoAtivo ? "var(--brand)" : "var(--inkFaint)"}
        />
        {planoAtivo && dataPlano && (
          <InfoRow label="Assinante desde" value={dataPlano} />
        )}
        {!planoAtivo && (
          <div style={{ fontSize: 13, color: "var(--inkFaint)", marginTop: 4 }}>
            Entre em contato com a Murev pelo WhatsApp para ativar ou mudar seu plano.
          </div>
        )}
      </Secao>

      {/* ── Gerenciar assinatura ── */}
      {planoAtivo && (
        <Secao titulo="Assinatura" Icon={CreditCard}>
          <p style={{ fontSize: 13, color: "var(--inkSoft)", marginBottom: 16, lineHeight: 1.6 }}>
            Sua cobrança é processada com segurança pela Cacto. Você pode trocar de plano ou
            cancelar a renovação a qualquer momento.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-ghost" onClick={trocarPlano} disabled={abrindoPortal}
              style={{ width: "100%", justifyContent: "flex-start", gap: 9 }}>
              <ArrowUpDown size={15} color="var(--brand)" /> Trocar de plano
            </button>
            <button className="btn btn-ghost" onClick={cancelarAssinatura} disabled={abrindoPortal}
              style={{ width: "100%", justifyContent: "flex-start", gap: 9 }}>
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
        <p style={{ fontSize: 13, color: "var(--inkSoft)", marginBottom: 16, lineHeight: 1.6 }}>
          Enviaremos um link de confirmação para o novo endereço. O email só muda após você confirmar pelo link.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label>Novo email</label>
            <input style={inp} type="email" maxLength={254} value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value.replace(/\s/g, ""))} placeholder="novo@email.com" autoComplete="email" />
          </div>
          <div className="field">
            <label>Confirme sua senha atual</label>
            <input style={inp} type="password" value={senhaEmail}
              onChange={(e) => setSenhaEmail(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </div>
          {erroEmail && (
            <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>
              {erroEmail}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={trocarEmail}
              disabled={trocandoEmail || !novoEmail || !senhaEmail}
              style={{ opacity: (trocandoEmail || !novoEmail || !senhaEmail) ? 0.6 : 1 }}>
              {trocandoEmail ? <><Loader2 size={14} className="spin" /> Enviando…</> : "Enviar confirmação"}
            </button>
          </div>
        </div>
      </Secao>

      {/* ── Redefinir senha ── */}
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
              <button onClick={() => setVerSenha(!verSenha)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }}>
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
            <div style={{ fontSize: 13, color: "var(--warn)", background: "var(--warnSoft)", padding: "10px 12px", borderRadius: 9 }}>
              {erroSenha}
            </div>
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
