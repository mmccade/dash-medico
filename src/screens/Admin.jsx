// src/screens/Admin.jsx
import { useState, useEffect, useRef } from "react";
import { Shield, Users, DollarSign, Loader2, LogOut, Sun, Moon, Plus, Trash2, X, Eye, EyeOff, RotateCcw, Clock, AlertTriangle, MessageSquare, Check } from "lucide-react";
import { listarTodosUsuarios, definirPlano, excluirUsuario, restaurarUsuario, excluirPermanente, contarPacientesPorUsuario, VALOR_PLANO, DIAS_PLANO } from "../services/db.js";
import { sair } from "../services/auth.js";
import { useTema } from "../lib/theme.jsx";
import { useAuth } from "../lib/auth.jsx";
import { br } from "../lib/utils.js";
import { validateNovoUsuario, primeiroErro } from "../lib/validate.js";
import { doc, setDoc, serverTimestamp, getFirestore, Timestamp, collection, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const PLANOS = ["nenhum", "semanal", "mensal", "trimestral", "semestral", "anual", "vitalicio"];
const LABEL  = { nenhum: "Sem plano", semanal: "Semanal", mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual", vitalicio: "Vitalício" };
const ABAS      = ["ativos", "desativados", "cakto", "sugestoes", "admin"];
const LABEL_ABA = { ativos: "Ativos", desativados: "Desativados", cakto: "Cakto", sugestoes: "Sugestões", admin: "Admin" };

function fmtData(val) {
  if (!val) return null;
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return null; }
}

function diasRestantes(acessoAte) {
  if (!acessoAte) return null;
  try {
    const d = acessoAte?.toDate ? acessoAte.toDate() : new Date(acessoAte);
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

function receitaUsuario(u) {
  if (!u.plano || u.plano === "nenhum" || u.plano === "vitalicio") return 0;
  const desde = u.planoDesde?.toDate ? u.planoDesde.toDate() : (u.planoDesde ? new Date(u.planoDesde) : null);
  if (!desde) return VALOR_PLANO[u.plano] || 0;
  const dias = Math.max(1, Math.floor((Date.now() - desde.getTime()) / (1000 * 60 * 60 * 24)));
  const ciclo = DIAS_PLANO[u.plano] || 30;
  return +((VALOR_PLANO[u.plano] || 0) * Math.ceil(dias / ciclo)).toFixed(2);
}

// ─── Modal exclusão permanente ────────────────────────────────
function ModalExcluirPermanente({ usuario, onClose, onExcluido }) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const { user } = useAuth();
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);

  const confirmar = async () => {
    if (confirmEmail.trim().toLowerCase() !== usuario.email.toLowerCase()) {
      setErro("Email não confere. Digite exatamente o email do usuário.");
      return;
    }
    setExcluindo(true);
    try {
      await excluirPermanente(usuario.id, user?.uid);
      onExcluido(usuario.id);
      onClose();
    } catch (e) {
      setErro("Erro ao excluir: " + e.message);
      setExcluindo(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 420, padding: "32px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <AlertTriangle size={20} color="#e74c3c" />
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#e74c3c" }}>Excluir permanentemente</h2>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--inkSoft)", lineHeight: 1.6, marginBottom: 8 }}>
          Esta ação é <strong>irreversível</strong>. O perfil e todos os dados do Firestore serão deletados.<br />
          O acesso ao Firebase Auth precisa ser removido manualmente no console.
        </p>
        <div style={{ background: "#fdf2f2", border: "1px solid #fcc", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13 }}>
          <strong>{usuario.email}</strong>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 6 }}>
            Digite o email do usuário para confirmar
          </label>
          <input
            ref={inputRef}
            type="email"
            value={confirmEmail}
            onChange={(e) => { setConfirmEmail(e.target.value); setErro(""); }}
            placeholder={usuario.email}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: erro ? "1.5px solid #e74c3c" : "1px solid var(--line)", background: "var(--surface)", fontSize: 14, color: "var(--ink)", boxSizing: "border-box" }}
            onKeyDown={(e) => e.key === "Enter" && confirmar()}
          />
          {erro && <p style={{ fontSize: 12, color: "#e74c3c", marginTop: 6 }}>{erro}</p>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button
            onClick={confirmar}
            disabled={excluindo || !confirmEmail}
            style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: "none", background: confirmEmail ? "#e74c3c" : "var(--surface2)", color: confirmEmail ? "#fff" : "var(--inkFaint)", fontWeight: 600, fontSize: 14, cursor: confirmEmail ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          >
            {excluindo ? <><Loader2 size={14} className="spin" /> Excluindo…</> : "Excluir permanentemente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal adicionar usuário ──────────────────────────────────
async function criarUsuarioCompleto({ email, senha, perfil }) {
  const mainApp = getApps()[0];
  const secondaryApp = initializeApp(mainApp.options, "secondary_" + Date.now());
  try {
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryDb   = getFirestore(secondaryApp);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, senha);
    await setDoc(doc(secondaryDb, "usuarios", cred.user.uid), perfil);
    await secondaryAuth.signOut();
    return cred.user.uid;
  } finally {
    try { await deleteApp(secondaryApp); } catch {}
  }
}

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
      const dias = DIAS_PLANO[plano] || 0;
      const acessoAte = (dias && dias < 99999) ? Timestamp.fromDate(new Date(Date.now() + dias * 86400000)) : null;
      const perfilDoc = {
        email: data.email, nome: data.nome, clinica: data.clinica, medico: data.nome, crm: "",
        plano, planoDesde: serverTimestamp(), acessoAte,
        status: "ativo", statusAssinatura: "ativo",
        criadoEm: serverTimestamp(), origem: "admin", excluido: false,
      };
      const uid = await criarUsuarioCompleto({ email: data.email, senha, perfil: perfilDoc });
      onAdicionado({ id: uid, email: data.email, nome: data.nome, clinica: data.clinica, medico: data.nome, plano, origem: "admin", planoDesde: new Date(), acessoAte: acessoAte?.toDate(), excluido: false, status: "ativo" });
      onClose();
    } catch (e) {
      const msgs = { "auth/email-already-in-use": "Já existe uma conta com esse email.", "auth/invalid-email": "Email inválido.", "auth/weak-password": "Senha fraca.", "auth/network-request-failed": "Falha de rede.", "permission-denied": "Sem permissão no Firestore." };
      setErros([{ campo: "email", err: msgs[e.code] || `Erro: ${e.message}` }]);
      setSalvando(false);
    }
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, color: "var(--ink)", boxSizing: "border-box" };
  const reqs = [{ ok: senha.length >= 8, label: "Mínimo 8 caracteres" }, { ok: /[A-Z]/.test(senha), label: "1 maiúscula" }, { ok: /[0-9]/.test(senha), label: "1 número" }];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 440, padding: "32px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Adicionar usuário</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); salvar(); }} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[["Nome / Médico", nome, setNome, "Dr. João Silva", "text"], ["Clínica", clinica, setClinica, "Clínica Exemplo", "text"], ["Email *", email, setEmail, "medico@email.com", "email"]].map(([label, val, set, ph, type]) => (
            <div key={label}>
              <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>{label}</label>
              <input style={inp} type={type} maxLength={type === "email" ? 254 : 300} value={val} onChange={(e) => set(e.target.value)} placeholder={ph} autoComplete="off" />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Senha *</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: 40 }} type={verSenha ? "text" : "password"} maxLength={128} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
              <button type="button" onClick={() => setVerSenha(!verSenha)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)" }}>{verSenha ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {reqs.map((r) => <div key={r.label} style={{ fontSize: 12, color: r.ok ? "var(--good)" : "var(--inkFaint)", display: "flex", gap: 6 }}><span>{r.ok ? "✓" : "○"}</span>{r.label}</div>)}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Plano</label>
            <select value={plano} onChange={(e) => setPlano(e.target.value)} style={{ ...inp, fontWeight: 600, color: "var(--brand)" }}>
              {PLANOS.filter((p) => p !== "nenhum").map((p) => (
                <option key={p} value={p}>{LABEL[p]}{VALOR_PLANO[p] ? ` — R$ ${br(VALOR_PLANO[p].toFixed(2))}` : " — Gratuito"}</option>
              ))}
            </select>
            {DIAS_PLANO[plano] && DIAS_PLANO[plano] < 99999 && (
              <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 6 }}>Acesso por {DIAS_PLANO[plano]} dias a partir de hoje.</p>
            )}
          </div>
          {erros.length > 0 && <div style={{ background: "var(--surface2)", color: "var(--bad, #c0392b)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{primeiroErro(erros)}</div>}
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
  const [todos, setTodos]                   = useState([]);
  const [pacientesCount, setPacientesCount] = useState({});
  const [carregando, setCarregando]         = useState(true);
  const [salvando, setSalvando]             = useState(null);
  const [excluindo, setExcluindo]           = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [aba, setAba]                       = useState("ativos");
  const [modalExcluir, setModalExcluir]     = useState(null);
  const [sugestoes, setSugestoes]           = useState([]);
  const [carregandoSug, setCarregandoSug]   = useState(false);

  // Carrega sugestões quando a aba é selecionada
  useEffect(() => {
    if (aba !== "sugestoes") return;
    setCarregandoSug(true);
    const db = getFirestore();
    getDocs(query(collection(db, "sugestoes"), orderBy("criadoEm", "desc")))
      .then((snap) => setSugestoes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setCarregandoSug(false));
  }, [aba]);

  const carregar = () => {
    setCarregando(true);
    listarTodosUsuarios()
      .then(async (lista) => {
        setTodos(lista);
        const counts = await contarPacientesPorUsuario(lista.map((u) => u.id));
        setPacientesCount(counts);
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  };
  useEffect(carregar, []);

  // Filtro por aba
  const usuarios = todos.filter((u) => {
    if (aba === "ativos")      return !u.excluido;
    if (aba === "desativados") return u.excluido;
    if (aba === "cakto")       return !u.excluido && (u.origem === "cacto" || u.origem === "webhook");
    if (aba === "admin")       return !u.excluido && u.origem === "admin";
    return true;
  });

  const contarAba = (a) => todos.filter((u) => {
    if (a === "ativos")      return !u.excluido;
    if (a === "desativados") return u.excluido;
    if (a === "cakto")       return !u.excluido && (u.origem === "cacto" || u.origem === "webhook");
    if (a === "admin")       return !u.excluido && u.origem === "admin";
    return true;
  }).length;

  const mudarPlano = async (uid, plano) => {
    setSalvando(uid);
    try {
      await definirPlano(uid, plano, user?.uid);
      const dias = DIAS_PLANO[plano] || 0;
      const novoAcessoAte = (dias && dias < 99999) ? new Date(Date.now() + dias * 86400000) : null;
      setTodos((us) => us.map((u) => u.id === uid ? { ...u, plano, planoDesde: new Date(), acessoAte: novoAcessoAte, status: plano === "nenhum" ? "inativo" : "ativo" } : u));
    } catch (e) { console.error(e); }
    setSalvando(null);
  };

  const desativar = async (u) => {
    if (!window.confirm(`Desativar ${u.email}? Os dados clínicos serão preservados.`)) return;
    setExcluindo(u.id);
    try {
      await excluirUsuario(u.id, user?.uid);
      setTodos((us) => us.map((x) => x.id === u.id ? { ...x, excluido: true } : x));
    } catch (e) { console.error(e); }
    setExcluindo(null);
  };

  const restaurar = async (u) => {
    setExcluindo(u.id);
    try {
      await restaurarUsuario(u.id, user?.uid);
      setTodos((us) => us.map((x) => x.id === u.id ? { ...x, excluido: false } : x));
    } catch (e) { console.error(e); }
    setExcluindo(null);
  };

  const receitaTotal = todos.filter((u) => !u.excluido).reduce((s, u) => s + receitaUsuario(u), 0);
  const assinantes   = todos.filter((u) => !u.excluido && u.plano && u.plano !== "nenhum").length;
  const totalAtivos  = todos.filter((u) => !u.excluido).length;

  const badgeOrigem = (origem) => {
    const isCakto = origem === "cacto" || origem === "webhook";
    return (
      <span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: isCakto ? "#e8f4f8" : "var(--surface2)", color: isCakto ? "var(--brand)" : "var(--inkFaint)" }}>
        {isCakto ? "Cakto" : "Admin"}
      </span>
    );
  };

  const badgeAcesso = (u) => {
    if (u.plano === "vitalicio") return <span style={{ fontSize: 12, color: "var(--good)", fontWeight: 600 }}>Vitalício</span>;
    if (!u.acessoAte) return <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>—</span>;
    const dias = diasRestantes(u.acessoAte);
    const venceu = dias <= 0;
    const urgente = !venceu && dias <= 5;
    return (
      <div style={{ lineHeight: 1.3 }}>
        <span style={{ fontSize: 12, fontWeight: venceu || urgente ? 700 : 400, color: venceu ? "var(--warn)" : urgente ? "#e67e22" : "var(--inkSoft)" }}>
          {venceu ? "Expirado" : `${dias}d restantes`}
        </span>
        <div style={{ fontSize: 11, color: "var(--inkFaint)" }}>{fmtData(u.acessoAte)}</div>
      </div>
    );
  };

  const tabStyle = (a) => ({
    padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: aba === a ? 700 : 500,
    background: aba === a ? "var(--brand)" : "var(--surface2)",
    color: aba === a ? "#fff" : "var(--inkSoft)",
    transition: "all .15s",
    display: "flex", alignItems: "center", gap: 6,
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} color="var(--brand)" />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Painel administrativo · Murev Acompanha</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={alternar} className="btn btn-ghost sm" style={{ padding: 8 }}>{tema === "escuro" ? <Sun size={16} /> : <Moon size={16} />}</button>
          <button onClick={() => sair()} className="btn btn-ghost sm"><LogOut size={14} /> Sair</button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Administração</h1>
            <p className="page-sub" style={{ margin: "4px 0 0" }}>Gestão de usuários, planos e receita.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Adicionar usuário</button>
        </div>

        {/* Cards de resumo */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 26 }}>
          <ResumoCard Icon={Users}      label="Usuários ativos"   valor={totalAtivos} />
          <ResumoCard Icon={Shield}     label="Assinantes"        valor={assinantes}  accent="var(--good)" />
          <ResumoCard Icon={DollarSign} label="Receita acumulada" valor={`R$ ${br(receitaTotal.toFixed(2))}`} accent="var(--brand)" />
        </div>

        {/* Abas */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {ABAS.map((a) => (
            <button key={a} style={tabStyle(a)} onClick={() => setAba(a)}>
              {LABEL_ABA[a]}
              <span style={{ background: aba === a ? "rgba(255,255,255,0.25)" : "var(--line)", borderRadius: 99, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                {contarAba(a)}
              </span>
            </button>
          ))}
        </div>

        {/* ─── Aba sugestões ─── */}
        {aba === "sugestoes" && (
          carregandoSug ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
              <Loader2 size={28} className="spin" color="var(--inkFaint)" />
            </div>
          ) : sugestoes.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--inkFaint)" }}>
              Nenhuma sugestão recebida ainda.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sugestoes.map((s) => (
                <div key={s.id} className="card" style={{ padding: "16px 20px", opacity: s.lida ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", padding: "2px 10px", borderRadius: 99, background: "var(--brandSoft)", color: "var(--brand)" }}>
                        {s.categoria || "outro"}
                      </span>
                      {!s.lida && <span style={{ fontSize: 10, fontWeight: 700, color: "#d4a017", background: "#fff8e6", padding: "2px 8px", borderRadius: 99 }}>NOVO</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11.5, color: "var(--inkFaint)" }}>
                        {s.email || "—"} · {s.criadoEm?.toDate ? s.criadoEm.toDate().toLocaleDateString("pt-BR") : ""}
                      </span>
                      {!s.lida && (
                        <button
                          onClick={async () => {
                            const db = getFirestore();
                            await updateDoc(doc(db, "sugestoes", s.id), { lida: true });
                            setSugestoes((ss) => ss.map((x) => x.id === s.id ? { ...x, lida: true } : x));
                          }}
                          style={{ fontSize: 11.5, color: "var(--good)", display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 7, border: "1px solid var(--good)" }}>
                          <Check size={12} /> Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{s.texto}</div>
                </div>
              ))}
            </div>
          )
        )}

        {aba !== "sugestoes" && (carregando ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <Loader2 size={28} className="spin" color="var(--inkFaint)" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--inkFaint)" }}>
            Nenhum usuário nesta categoria.
          </div>
        ) : (
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr>
                  {["Usuário", "Email", "Origem", "Plano", "Acesso até", "Pacientes", "Receita", ""].map((h) => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--line)", background: "var(--surface2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} style={{ opacity: u.excluido ? 0.5 : 1 }}>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {u.clinica || "—"}
                      <div style={{ fontSize: 12, color: "var(--inkFaint)", fontWeight: 400 }}>{u.medico || "sem nome"}</div>
                      {u.excluido && <div style={{ fontSize: 11, color: "#e74c3c", fontWeight: 600 }}>Desativado</div>}
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
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>{badgeAcesso(u)}</td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      {pacientesCount[u.id] ? (
                        <div style={{ lineHeight: 1.3 }}>
                          <span className="tnum" style={{ fontSize: 14, fontWeight: 700 }}>{pacientesCount[u.id].total}</span>
                          <div className="tnum" style={{ fontSize: 11, color: "var(--inkFaint)" }}>{pacientesCount[u.id].ativos} ativo{pacientesCount[u.id].ativos !== 1 ? "s" : ""}</div>
                        </div>
                      ) : <span style={{ color: "var(--inkFaint)" }}>—</span>}
                    </td>
                    <td className="tnum" style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>
                      R$ {br(receitaUsuario(u).toFixed(2))}
                    </td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {u.excluido ? (
                          <>
                            <button onClick={() => restaurar(u)} disabled={excluindo === u.id}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--good)", padding: 6, borderRadius: 8 }} title="Restaurar">
                              {excluindo === u.id ? <Loader2 size={15} className="spin" /> : <RotateCcw size={15} />}
                            </button>
                            <button onClick={() => setModalExcluir(u)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#e74c3c", padding: 6, borderRadius: 8 }} title="Excluir permanentemente">
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => desativar(u)} disabled={excluindo === u.id}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)", padding: 6, borderRadius: 8 }} title="Desativar">
                            {excluindo === u.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <p style={{ fontSize: 11.5, color: "var(--inkFaint)", marginTop: 16, lineHeight: 1.6 }}>
          Ao mudar o plano, o prazo de acesso é recalculado automaticamente. Exclusão permanente remove o Firestore — remova o Auth manualmente no console Firebase.
        </p>
      </div>

      {showModal && <ModalAddUsuario onClose={() => setShowModal(false)} onAdicionado={(novo) => setTodos((us) => [novo, ...us])} />}

      {modalExcluir && (
        <ModalExcluirPermanente
          usuario={modalExcluir}
          onClose={() => setModalExcluir(null)}
          onExcluido={(uid) => setTodos((us) => us.filter((u) => u.id !== uid))}
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
