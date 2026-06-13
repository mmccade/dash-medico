// src/screens/Admin.jsx
import { useState, useEffect } from "react";
import { Shield, Users, DollarSign, Loader2, LogOut, Sun, Moon } from "lucide-react";
import { listarTodosUsuarios, definirPlano, VALOR_PLANO } from "../services/db.js";
import { sair } from "../services/auth.js";
import { useTema } from "../lib/theme.jsx";
import { br } from "../lib/utils.js";

const PLANOS = ["nenhum", "mensal", "trimestral", "anual", "vitalicio"];
const LABEL = { nenhum: "Sem plano", mensal: "Mensal", trimestral: "Trimestral", anual: "Anual", vitalicio: "Vitalício" };

// receita acumulada estimada por usuário, conforme plano e tempo desde a adesão
function receitaUsuario(u) {
  if (!u.plano || u.plano === "nenhum") return 0;
  if (u.plano === "vitalicio") return 0; // vitalício: cortesia/parceiro, sem receita recorrente
  if (u.plano === "anual") return VALOR_PLANO.anual;
  const desde = u.planoDesde?.toDate ? u.planoDesde.toDate() : (u.planoDesde ? new Date(u.planoDesde) : null);
  if (!desde) return VALOR_PLANO[u.plano] || 0;
  const meses = Math.max(1, Math.floor((Date.now() - desde.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  if (u.plano === "mensal") return +(VALOR_PLANO.mensal * meses).toFixed(2);
  if (u.plano === "trimestral") return +(VALOR_PLANO.trimestral * Math.ceil(meses / 3)).toFixed(2);
  return VALOR_PLANO[u.plano] || 0;
}

export default function Admin() {
  const { tema, alternar } = useTema();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(null);

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

  const receitaTotal = usuarios.reduce((s, u) => s + receitaUsuario(u), 0);
  const assinantes = usuarios.filter((u) => u.plano && u.plano !== "nenhum").length;

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
        <h1 className="page-title">Administração</h1>
        <p className="page-sub" style={{ marginBottom: 26 }}>Gestão de usuários, planos e receita.</p>

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
                  {["Usuário", "Email", "Plano", "Receita gerada"].map((h) => (
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
                      <select value={u.plano || "nenhum"} onChange={(e) => mudarPlano(u.id, e.target.value)} disabled={salvando === u.id}
                        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, fontWeight: 600, color: u.plano && u.plano !== "nenhum" ? "var(--brand)" : "var(--inkFaint)" }}>
                        {PLANOS.map((p) => <option key={p} value={p}>{LABEL[p]}</option>)}
                      </select>
                      {salvando === u.id && <Loader2 size={13} className="spin" style={{ marginLeft: 8, verticalAlign: "middle", color: "var(--inkFaint)" }} />}
                    </td>
                    <td className="tnum" style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>
                      R$ {br(receitaUsuario(u).toFixed(2))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: 11.5, color: "var(--inkFaint)", marginTop: 16, lineHeight: 1.6 }}>
          Receita estimada com base no plano e no tempo desde a adesão. Vitalício é tratado como cortesia (sem receita recorrente).
        </p>
      </div>
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
