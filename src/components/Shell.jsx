// src/components/Shell.jsx
// Alteração: item "Sobre a Murev" adicionado ao nav (sutil, no rodapé do menu)

import { useState, useEffect } from "react";
import { LayoutDashboard, Users, TrendingUp, Settings, Sun, Moon, LogOut, UserCircle, Sparkles } from "lucide-react";
import { useTema } from "../lib/theme.jsx";
import { useStore } from "../lib/store.jsx";
import { useAuth } from "../lib/auth.jsx";
import Logo from "./Logo.jsx";

const NAV = [
  { id: "dashboard", label: "Visão geral", Icon: LayoutDashboard },
  { id: "pacientes", label: "Pacientes", Icon: Users, alias: ["ficha", "novociclo", "novopaciente", "importar"] },
  { id: "evolucao",  label: "Evolução", Icon: TrendingUp },
  { id: "config",    label: "Configurações", Icon: Settings },
];

function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < 760 : false);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 760);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return m;
}

export default function Shell({ tela, navegar, onLogout, children }) {
  const { tema, alternar } = useTema();
  const { config } = useStore();
  const { user, perfil } = useAuth();
  const isMobile = useIsMobile();

  const ativo = (item) => tela === item.id || (item.alias && item.alias.includes(tela));

  const planoAtivo = perfil?.plano && perfil.plano !== "nenhum";
  const labelPlano = { mensal: "Mensal", trimestral: "Trimestral", anual: "Anual", vitalicio: "Vitalício" };

  if (isMobile) {
    // Mobile: nav só com principais. "Sobre" entra como item flutuante no topo direito.
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header style={{
          display: "flex", flexDirection: "column", gap: 10, background: "var(--surface)",
          borderBottom: "1px solid var(--line)", padding: "10px 14px",
          position: "sticky", top: 0, zIndex: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Logo small />
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => navegar("sobre")}
                className="btn btn-ghost sm"
                style={{ padding: 8, color: tela === "sobre" ? "var(--brand)" : "var(--inkFaint)" }}
                title="Sobre a Murev"
              >
                <Sparkles size={16} />
              </button>
              <button className="btn btn-ghost sm" onClick={alternar} style={{ padding: 8 }}>
                {tema === "escuro" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            {[...NAV, { id: "meuperfil", label: "Meu perfil", Icon: UserCircle }].map((item) => (
              <button key={item.id} onClick={() => navegar(item.id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 4px", borderRadius: 8, fontSize: 10.5, fontWeight: 600,
                background: ativo(item) ? "var(--brandSoft)" : "var(--surface2)",
                color: ativo(item) ? "var(--brand)" : "var(--inkSoft)",
              }}>
                <item.Icon size={16} />
                {item.label.split(" ")[0]}
              </button>
            ))}
          </nav>
        </header>
        <main style={{ flex: 1, padding: "20px 16px 80px", width: "100%", maxWidth: "100%" }}>{children}</main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <aside style={{
        width: 220, flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--line)",
        padding: "22px 16px", display: "flex", flexDirection: "column", gap: 28,
        position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ padding: "0 8px" }}><Logo /></div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((item) => (
            <button key={item.id} onClick={() => navegar(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 9, fontSize: 14, textAlign: "left", width: "100%",
              fontWeight: ativo(item) ? 600 : 500,
              color: ativo(item) ? "var(--brand)" : "var(--inkSoft)",
              background: ativo(item) ? "var(--brandSoft)" : "transparent",
            }}>
              <item.Icon size={18} /> {item.label}
            </button>
          ))}

          {/* Item "Sobre a Murev" — separado, mais sutil */}
          <div style={{ height: 1, background: "var(--line)", margin: "10px 4px" }} />
          <button onClick={() => navegar("sobre")} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            borderRadius: 9, fontSize: 13.5, textAlign: "left", width: "100%",
            fontWeight: tela === "sobre" ? 600 : 500,
            color: tela === "sobre" ? "var(--brand)" : "var(--inkFaint)",
            background: tela === "sobre" ? "var(--brandSoft)" : "transparent",
          }}>
            <Sparkles size={16} /> Sobre a Murev
          </button>
        </nav>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => navegar("meuperfil")} style={{
            padding: 12, background: tela === "meuperfil" ? "var(--brandSoft)" : "var(--surface2)",
            borderRadius: 11, textAlign: "left", width: "100%",
            border: tela === "meuperfil" ? "1px solid var(--brand)" : "1px solid transparent",
            transition: "all 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: planoAtivo ? 6 : 0 }}>
              <UserCircle size={18} color={tela === "meuperfil" ? "var(--brand)" : "var(--inkFaint)"} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {config.medico || config.clinica || "Meu perfil"}
                </div>
                <div style={{ fontSize: 11, color: "var(--inkFaint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email}
                </div>
              </div>
            </div>
            {planoAtivo && (
              <div style={{
                display: "inline-block", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3,
                color: "var(--brand)", background: "var(--brandSoft)",
                padding: "2px 8px", borderRadius: 99, marginLeft: 27,
              }}>
                {labelPlano[perfil.plano] || perfil.plano}
              </div>
            )}
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={onLogout} className="btn btn-ghost sm" style={{ gap: 6 }}>
              <LogOut size={14} /> Sair
            </button>
            <button onClick={alternar} className="btn btn-ghost sm" style={{ padding: 8 }}>
              {tema === "escuro" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: "32px 40px 64px", maxWidth: 1120, margin: "0 auto", width: "100%" }}>
        {children}
      </main>
    </div>
  );
}

export { useIsMobile };
