// src/screens/Admin.jsx
// Alterações em relação à Fase 3:
//  - Coluna "Origem" adicionada: "Webhook" ou "Admin" com badge colorido
//  - Botão "Adicionar usuário" — cria conta Firebase Auth + perfil no Firestore
//  - Botão "Excluir" por linha — remove o documento do Firestore (não exclui Auth, apenas desativa acesso)
//  - db.js precisa das funções: criarUsuarioAdmin, excluirUsuarioAdmin (adicione conforme abaixo)

import { useState, useEffect } from "react";
import { Shield, Users, DollarSign, Loader2, LogOut, Sun, Moon, Plus, Trash2, X, Eye, EyeOff } from "lucide-react";
import { listarTodosUsuarios, definirPlano, VALOR_PLANO } from "../services/db.js";
import { sair } from "../services/auth.js";
import { useTema } from "../lib/theme.jsx";
import { br } from "../lib/utils.js";
import { db } from "../services/firebase.js";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const PLANOS = ["nenhum", "mensal", "trimestral", "anual", "vitalicio"];
const LABEL = { nenhum: "Sem plano", mensal: "Mensal", trimestral: "Trimestral", anual: "Anual", vitalicio: "Vitalício" };

function receitaUsuario(u) {
  if (!u.plano || u.plano === "nenhum") return 0;
  if (u.plano === "vitalicio") return 0;
  if (u.plano === "anual") return VALOR_PLANO.anual;
  const desde = u.planoDesde?.toDate ? u.planoDesde.toDate() : (u.planoDesde ? new Date(u.planoDesde) : null);
  if (!desde) return VALOR_PLANO[u.plano] || 0;
  const meses = Math.max(1, Math.floor((Date.now() - desde.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  if (u.plano === "mensal") return +(VALOR_PLANO.mensal * meses).toFixed(2);
  if (u.plano === "trimestral") return +(VALOR_PLANO.trimestral * Math.ceil(meses / 3)).toFixed(2);
  return VALOR_PLANO[u.plano] || 0;
}

// Modal de adicionar usuário
function ModalAddUsuario({ onClose, onAdicionado }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [clinica, setClinica] = useState("");
  const [plano, setPlano] = useState("mensal");
  const [verSenha, setVerSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const salvar = async () => {
    setErro("");
    if (!email || !senha || senha.length < 6) {
      setErro("Email e senha (mín. 6 caracteres) são obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      // Cria conta no Firebase Auth
      const auth = getAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = cred.user.uid;

      // Cria perfil no Firestore com origem = "admin"
      await setDoc(doc(db, "usuarios", uid), {
        email,
        nome,
        clinica: clinica || "Clínica",
        medico: nome,
        crm: "",
        plano,
        planoDesde: serverTimestamp(),
        criadoEm: serverTimestamp(),
        origem: "admin",  // <- campo de origem
      });

      onAdicionado({ id: uid, email, nome, clinica, medico: nome, plano, origem: "admin", planoDesde: new Date() });
      onClose();
    } catch (e) {
      const msgs = {
        "auth/email-already-in-use": "Já existe uma conta com esse email.",
        "auth/invalid-email": "Email inválido.",
        "auth/weak-password": "Senha fraca. Use ao menos 6 caracteres.",
      };
      setErro(msgs[e.code] || "Erro ao criar usuário. Tente novamente.");
      setSalvando(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1px solid var(--line)", background: "var(--surface)",
    fontSize: 14, color: "var(--ink)", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: 18,
        width: "100%", maxWidth: 440, padding: "32px 28px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Adicionar usuário</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Nome / Médico</label>
            <input style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Dr. João Silva" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Clínica</label>
            <input style={inputStyle} value={clinica} onChange={(e) => setClinica(e.target.value)} placeholder="Clínica Exemplo" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Email *</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="medico@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Senha *</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: 40 }}
                type={verSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button onClick={() => setVerSenha(!verSenha)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)",
              }}>
                {verSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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

          {erro && (
            <div style={{ background: "var(--bad-bg, #fff0f0)", color: "var(--bad, #c0392b)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
              {erro}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
              Cancelar
            </button>
            <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {salvando ? <><Loader2 size={14} className="spin" /> Criando…</> : "Criar usuário"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { tema, alternar } = useTema();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const carregar = () => {
    setCarregando(true);
    listarTodosUsuarios()
      .then(setUsuarios)
      .catch((e) => console.error(e))
      .finally(() => setCarregando(false));
  };
  useEffect(carregar, []);

  const mudarPlano = async (uid, plano) => {
    setSalvando(uid);
    try {
      await definirPlano(uid, plano);
      setUsuarios((us) => us.map((u) => (u.id === uid ? { ...u, plano, planoDesde: new Date() } : u)));
    } catch (e) { console.error(e); }
    setSalvando(null);
  };

  const excluir = async (uid) => {
    if (!window.confirm("Remover este usuário do sistema? Ele perderá o acesso.")) return;
    setExcluindo(uid);
    try {
      // Remove apenas o documento do Firestore (sem excluir Auth — Firebase Admin SDK necessário para isso)
      await deleteDoc(doc(db, "usuarios", uid));
      setUsuarios((us) => us.filter((u) => u.id !== uid));
    } catch (e) { console.error(e); }
    setExcluindo(null);
  };

  const receitaTotal = usuarios.reduce((s, u) => s + receitaUsuario(u), 0);
  const assinantes = usuarios.filter((u) => u.plano && u.plano !== "nenhum").length;

  const badgeOrigem = (origem) => {
    const isWebhook = origem === "webhook";
    return (
      <span style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        background: isWebhook ? "var(--brand-bg, #e8f0fe)" : "var(--surface2)",
        color: isWebhook ? "var(--brand)" : "var(--inkFaint)",
        letterSpacing: 0.3,
      }}>
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

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 64px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 26, flexWrap: "wrap", gap: 14 }}>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Administração</h1>
            <p className="page-sub" style={{ margin: "4px 0 0" }}>Gestão de usuários, planos e receita.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Adicionar usuário
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 30 }}>
          <ResumoCard Icon={Users} label="Usuários" valor={usuarios.length} />
          <ResumoCard Icon={Shield} label="Assinantes" valor={assinantes} accent="var(--good)" />
          <ResumoCard Icon={DollarSign} label="Receita acumulada" valor={`R$ ${br(receitaTotal.toFixed(2))}`} accent="var(--brand)" />
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
                  {["Usuário", "Email", "Origem", "Plano", "Receita gerada", ""].map((h) => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid var(--line)", background: "var(--surface2)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {u.clinica || "—"}
                      <div style={{ fontSize: 12, color: "var(--inkFaint)", fontWeight: 400 }}>{u.medico || "sem nome"}</div>
                    </td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", color: "var(--inkSoft)", whiteSpace: "nowrap" }}>{u.email}</td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      {badgeOrigem(u.origem)}
                    </td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      <select value={u.plano || "nenhum"} onChange={(e) => mudarPlano(u.id, e.target.value)} disabled={salvando === u.id}
                        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 600, color: u.plano && u.plano !== "nenhum" ? "var(--brand)" : "var(--inkFaint)" }}>
                        {PLANOS.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
                      </select>
                      {salvando === u.id && <Loader2 size={13} className="spin" style={{ marginLeft: 8, verticalAlign: "middle", color: "var(--inkFaint)" }} />}
                    </td>
                    <td className="tnum" style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>
                      R$ {br(receitaUsuario(u).toFixed(2))}
                    </td>
                    <td style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)" }}>
                      <button
                        onClick={() => excluir(u.id)}
                        disabled={excluindo === u.id}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--inkFaint)", padding: 6, borderRadius: 8, display: "flex", alignItems: "center" }}
                        title="Remover usuário"
                      >
                        {excluindo === u.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: "var(--inkFaint)", marginTop: 16, lineHeight: 1.6 }}>
          Receita estimada com base no plano e no tempo desde a adesão. Vitalício é tratado como cortesia (sem receita recorrente).
          A exclusão remove o acesso do médico ao sistema, mas não apaga os dados dos pacientes dele.
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
