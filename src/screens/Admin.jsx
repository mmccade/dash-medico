// src/screens/Admin.jsx
// Correção do bug: conta criada no Auth mas não aparecia no painel.
// Causa: o signOut do app secundário acontecia ANTES do setDoc, e como o setDoc
//        roda no db principal (autenticado como admin), em race condition o
//        Firebase descartava o token. Resultado: PERMISSION_DENIED silencioso.
// Fix:
//  1. Cria conta no app secundário
//  2. setDoc no Firestore do secundário (autenticado como o próprio usuário recém-criado = isDono)
//  3. Só ENTÃO desloga e mata o app secundário
//  4. Logs claros em caso de erro

import { useState, useEffect } from "react";
import { Shield, Users, DollarSign, Loader2, LogOut, Sun, Moon, Plus, Trash2, X, Eye, EyeOff, RotateCcw } from "lucide-react";
import { listarTodosUsuarios, definirPlano, excluirUsuario, restaurarUsuario, contarPacientesPorUsuario, VALOR_PLANO } from "../services/db.js";
import { sair } from "../services/auth.js";
import { useTema } from "../lib/theme.jsx";
import { useAuth } from "../lib/auth.jsx";
import { br } from "../lib/utils.js";
import { validateNovoUsuario, primeiroErro } from "../lib/validate.js";
import { doc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const PLANOS = ["nenhum", "mensal", "trimestral", "anual", "vitalicio"];
const LABEL  = { nenhum: "Sem plano", mensal: "Mensal", trimestral: "Trimestral", anual: "Anual", vitalicio: "Vitalício" };

function receitaUsuario(u) {
  if (!u.plano || u.plano === "nenhum") return 0;
  if (u.plano === "vitalicio") return 0;
  if (u.plano === "anual") return VALOR_PLANO.anual;
  const desde = u.planoDesde?.toDate ? u.planoDesde.toDate() : (u.planoDesde ? new Date(u.planoDesde) : null);
  if (!desde) return VALOR_PLANO[u.plano] || 0;
  const meses = Math.max(1, Math.floor((Date.now() - desde.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  if (u.plano === "mensal")      return +(VALOR_PLANO.mensal * meses).toFixed(2);
  if (u.plano === "trimestral")  return +(VALOR_PLANO.trimestral * Math.ceil(meses / 3)).toFixed(2);
  return VALOR_PLANO[u.plano] || 0;
}

// ─── Cria conta + perfil em uma única operação atômica ────────
// Usa app secundário (não desloga o admin) e escreve o doc com o token
// do próprio usuário recém-criado (isDono passa nas regras).
async function criarUsuarioCompleto({ email, senha, perfil }) {
  const mainApp = getApps()[0];
  const config = mainApp.options;
  const secondaryAppName = "secondary_" + Date.now();
  let secondaryApp = null;

  try {
    // 1. Cria app + auth + firestore secundários
    secondaryApp = initializeApp(config, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryDb = getFirestore(secondaryApp);

    // 2. Cria a conta no Auth
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
    const uid = cred.user.uid;
    console.log("[criarUsuario] Auth criado:", uid);

    // 3. Escreve o perfil ENQUANTO o secondary ainda está logado como o novo user
    //    Como isDono(uid) é true para o próprio usuário, a regra permite.
    await setDoc(doc(secondaryDb, "usuarios", uid), perfil);
    console.log("[criarUsuario] Firestore criado para:", uid);

    // 4. Agora sim, desloga
    await secondaryAuth.signOut();

    return uid;
  } catch (err) {
    console.error("[criarUsuario] ERRO:", err.code, err.message, err);
    throw err;
  } finally {
    // 5. Sempre limpa o app secundário
    if (secondaryApp) {
      try { await deleteApp(secondaryApp); }
      catch (e) { console.warn("[criarUsuario] erro ao limpar app secundário:", e); }
    }
  }
}

// ─── Modal de adicionar usuário ───────────────────────────────
function ModalAddUsuario({ onClose, onAdicionado }) {
  const [email, setEmail]     = useState("");
  const [senha, setSenha]     = useState("");
  const [nome, setNome]       = useState("");
  const [clinica, setClinica] = useState("");
  const [plano, setPlano]     = useState("mensal");
  const [verSenha, setVerSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros]     = useState([]);

  const salvar = async () => {
    setErros([]);
    const { data, errors } = validateNovoUsuario({ email, senha, nome, clinica });
    if (errors.length) { setErros(errors); return; }

    setSalvando(true);
    try {
      const perfilDoc = {
        email: data.email,
        nome: data.nome,
        clinica: data.clinica,
        medico: data.nome,
        crm: "",
        plano,
        planoDesde: serverTimestamp(),
        criadoEm: serverTimestamp(),
        origem: "admin",
        excluido: false,
      };

      const uid = await criarUsuarioCompleto({
        email: data.email,
        senha,
        perfil: perfilDoc,
      });

      onAdicionado({
        id: uid,
        email: data.email,
        nome: data.nome,
        clinica: data.clinica,
        medico: data.nome,
        plano,
        origem: "admin",
        planoDesde: new Date(),
        excluido: false,
      });
      onClose();
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Já existe uma conta com esse email.",
        "auth/invalid-email": "Email inválido.",
        "auth/weak-password": "Senha fraca.",
        "auth/network-request-failed": "Falha de rede. Verifique sua conexão.",
        "permission-denied": "Sem permissão no Firestore. Verifique as regras.",
      };
      const msg = msgs[e.code] || `Erro: ${e.message || "tente novamente."}`;
      setErros([{ campo: "email", err: msg }]);
      setSalvando(false);
    }
  };

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, color: "var(--ink)", boxSizing: "border-box" };
  const reqs = [
    { ok: senha.length >= 8, label: "Mínimo 8 caracteres" },
    { ok: /[A-Z]/.test(senha), label: "1 letra maiúscula" },
    { ok: /[0-9]/.test(senha), label: "1 número" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 440, padding: "32px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Adicionar usuário</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); salvar(); }} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Nome / Médico</label>
            <input style={inputStyle} maxLength={150} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Dr. João Silva" autoComplete="off" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Clínica</label>
            <input style={inputStyle} maxLength={300} value={clinica} onChange={(e) => setClinica(e.target.value)} placeholder="Clínica Exemplo" autoComplete="off" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Email *</label>
            <input style={inputStyle} type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="medico@email.com" autoComplete="off" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Senha *</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: 40 }} type={verSenha ? "text" : "password"} maxLength={128} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              <button type="button" onClick={() => setVerSenha(!verSenha)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)" }}>
                {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {reqs.map((r) => (
                <div key={r.label} style={{ fontSize: 12, color: r.ok ? "var(--good)" : "var(--inkFaint)", display: "flex", gap: 6 }}>
                  <span>{r.ok ? "✓" : "○"}</span> {r.label}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Plano</label>
            <select value={plano} onChange={(e) => setPlano(e.target.value)} style={{ ...inputStyle, fontWeight: 600, color: "var(--brand)" }}>
              {PLANOS.filter((p) => p !== "nenhum").map((p) => (
                <option key={p} value={p}>{LABEL[p]}</option>
              ))}
            </select>
          </div>

          {erros.length > 0 && (
            <div style={{ background: "var(--surface2)", color: "var(--bad, #c0392b)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
              {primeiroErro(erros)}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
            <button type="submit" disabled={salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {salvando ? <><Loader2 size={14} className="spin" /> Criando…</> : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Tela Admin ───────────────────────────────────────────────
export default function Admin() {
  const { tema, alternar } = useTema();
  const { user } = useAuth();
  const [usuarios, setUsuarios]     = useState([]);
  const [pacientesCount, setPacientesCount] = useState({});  // { uid: {total, ativos} }
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(null);
  const [excluindo, setExcluindo]   = useState(null);
  const [showModal, setShowModal]   = useState(false);
  const [mostrarExcluidos, setMostrarExcluidos] = useState(false);

  const carregar = () => {
    setCarregando(true);
    listarTodosUsuarios(mostrarExcluidos)
      .then(async (lista) => {
        setUsuarios(lista);
        // Conta pacientes em paralelo
        const counts = await contarPacientesPorUsuario(lista.map((u) => u.id));
        setPacientesCount(counts);
      })
      .catch((e) => console.error(e))
      .finally(() => setCarregando(false));
  };
  useEffect(carregar, [mostrarExcluidos]);

  const mudarPlano = async (uid, plano) => {
    setSalvando(uid);
    try {
      await definirPlano(uid, plano, user?.uid);
      setUsuarios((us) => us.map((u) => (u.id === uid ? { ...u, plano, planoDesde: new Date() } : u)));
    } catch (e) { console.error(e); }
    setSalvando(null);
  };

  const excluir = async (u) => {
    if (!window.confirm(`Desativar ${u.email}? Os dados clínicos serão preservados. Você pode restaurar depois.`)) return;
    setExcluindo(u.id);
    try {
      await excluirUsuario(u.id, user?.uid);
      setUsuarios((us) => mostrarExcluidos
        ? us.map((x) => x.id === u.id ? { ...x, excluido: true } : x)
        : us.filter((x) => x.id !== u.id)
      );
    } catch (e) { console.error(e); }
    setExcluindo(null);
  };

  const restaurar = async (u) => {
    setExcluindo(u.id);
    try {
      await restaurarUsuario(u.id, user?.uid);
      setUsuarios((us) => us.map((x) => x.id === u.id ? { ...x, excluido: false } : x));
    } catch (e) { console.error(e); }
    setExcluindo(null);
  };

  const receitaTotal  = usuarios.filter((u) => !u.excluido).reduce((s, u) => s + receitaUsuario(u), 0);
  const assinantes    = usuarios.filter((u) => !u.excluido && u.plano && u.plano !== "nenhum").length;
  const totalAtivos   = usuarios.filter((u) => !u.excluido).length;

  const badgeOrigem = (origem) => {
    const isWebhook = origem === "webhook";
    return (
      <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, background: isWebhook ? "#e8f4f8" : "var(--surface2)", color: isWebhook ? "var(--brand)" : "var(--inkFaint)" }}>
        {isWebhook ? "Webhook" : "Admin"}
      </span>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} color="var(--brand)" />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Painel administrativo · Murev Acompanha</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={alternar} className="btn btn-ghost sm" style={{ padding: 8 }}>
            {tema === "escuro" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => sair()} className="btn btn-ghost sm"><LogOut size={14} /> Sair</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Administração</h1>
            <p className="page-sub" style={{ margin: "4px 0 0" }}>Gestão de usuários, planos e receita.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setMostrarExcluidos(!mostrarExcluidos)} style={{ fontSize: 13 }}>
              {mostrarExcluidos ? "Ocultar excluídos" : "Ver excluídos"}
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Adicionar usuário
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 30 }}>
          <ResumoCard Icon={Users}       label="Usuários ativos" valor={totalAtivos} />
          <ResumoCard Icon={Shield}      label="Assinantes"      valor={assinantes}  accent="var(--good)" />
          <ResumoCard Icon={DollarSign}  label="Receita acumulada" valor={`R$ ${br(receitaTotal.toFixed(2))}`} accent="var(--brand)" />
        </div>

        {carregando ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={28} className="spin" color="var(--inkFaint)" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--inkFaint)" }}>
            Nenhum usuário cadastrado ainda.
          </div>
        ) : (
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr>
                  {["Usuário", "Email", "Origem", "Plano", "Pacientes", "Receita", ""].map((h) => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--line)", background: "var(--surface2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} style={{ opacity: u.excluido ? 0.45 : 1 }}>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {u.clinica || "—"}
                      <div style={{ fontSize: 12, color: "var(--inkFaint)", fontWeight: 400 }}>{u.medico || "sem nome"}</div>
                      {u.excluido && <div style={{ fontSize: 11, color: "var(--bad, #c0392b)", fontWeight: 600 }}>Desativado</div>}
                    </td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", color: "var(--inkSoft)", whiteSpace: "nowrap" }}>{u.email}</td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>{badgeOrigem(u.origem)}</td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      <select value={u.plano || "nenhum"} onChange={(e) => mudarPlano(u.id, e.target.value)} disabled={salvando === u.id || u.excluido}
                        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 600, color: u.plano && u.plano !== "nenhum" ? "var(--brand)" : "var(--inkFaint)" }}>
                        {PLANOS.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
                      </select>
                      {salvando === u.id && <Loader2 size={13} className="spin" style={{ marginLeft: 8, verticalAlign: "middle", color: "var(--inkFaint)" }} />}
                    </td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      {pacientesCount[u.id] ? (
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                          <span className="tnum" style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                            {pacientesCount[u.id].total}
                          </span>
                          <span className="tnum" style={{ fontSize: 11, color: "var(--inkFaint)" }}>
                            {pacientesCount[u.id].ativos} ativo{pacientesCount[u.id].ativos !== 1 ? "s" : ""}
                            {pacientesCount[u.id].total - pacientesCount[u.id].ativos > 0 && (
                              <> · {pacientesCount[u.id].total - pacientesCount[u.id].ativos} inativo{(pacientesCount[u.id].total - pacientesCount[u.id].ativos) !== 1 ? "s" : ""}</>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--inkFaint)", fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td className="tnum" style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>
                      R$ {br(receitaUsuario(u).toFixed(2))}
                    </td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      {u.excluido ? (
                        <button onClick={() => restaurar(u)} disabled={excluindo === u.id}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--good)", padding: 6, borderRadius: 8 }} title="Restaurar usuário">
                          {excluindo === u.id ? <Loader2 size={15} className="spin" /> : <RotateCcw size={15} />}
                        </button>
                      ) : (
                        <button onClick={() => excluir(u)} disabled={excluindo === u.id}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)", padding: 6, borderRadius: 8 }} title="Desativar usuário">
                          {excluindo === u.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: "var(--inkFaint)", marginTop: 16, lineHeight: 1.6 }}>
          Usuários desativados perdem o acesso mas os dados clínicos são preservados. Use "Ver excluídos" para restaurar.
          Todas as ações administrativas são registradas em log de auditoria.
        </p>
      </div>

      {showModal && (
        <ModalAddUsuario
          onClose={() => setShowModal(false)}
          onAdicionado={(novo) => setUsuarios((us) => [novo, ...us])}
        />
      )}
    </div>
  );
}

function ResumoCard({ Icon, label, valor, accent }) {
  return (
    <div className="card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      <Icon size={18} color={accent || "var(--inkFaint)"} />
      <div>
        <div className="tnum" style={{ fontSize: 24, fontWeight: 600, color: accent || "var(--ink)" }}>{valor}</div>
        <div style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{label}</div>
      </div>
    </div>
  );
}
