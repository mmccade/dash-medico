// src/components/FiltroPeriodo.jsx
// Filtro de período (Hoje / 7 dias / 30 dias) + botão de atualizar.
// Uso: <FiltroPeriodo valor={periodo} onChange={setPeriodo} onRefresh={recarregar} carregando={carregando} />
// `onChange` recebe a chave selecionada: "hoje" | "7d" | "30d"
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "./Shell.jsx";

const OPCOES = [
  ["hoje", "Hoje"],
  ["7d", "7 dias"],
  ["30d", "30 dias"],
];

export default function FiltroPeriodo({ valor, onChange, onRefresh, carregando }) {
  const isMobile = useIsMobile();

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
        {OPCOES.map(([k, l]) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            style={{
              borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600,
              background: valor === k ? "var(--surface)" : "transparent",
              color: valor === k ? "var(--ink)" : "var(--inkFaint)",
              boxShadow: valor === k ? "0 1px 2px rgba(0,0,0,.06)" : "none",
              border: "none", cursor: "pointer",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        onClick={onRefresh}
        disabled={carregando}
        title="Atualizar"
        style={{
          background: "var(--surface2)", border: "none", borderRadius: 10,
          width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: carregando ? "default" : "pointer", color: "var(--inkFaint)",
          flexShrink: 0,
        }}
      >
        <RefreshCw size={15} className={carregando ? "spin" : ""} />
      </button>
    </div>
  );
}

// ---------- helper de filtragem por data ----------
// Recebe um Timestamp do Firestore (ou Date/string) e a chave do período.
// "hoje" = desde 00:00 de hoje · "7d" = últimos 7 dias · "30d" = últimos 30 dias
export function dentroDoPeriodo(data, periodo) {
  if (!data) return false;
  const d = data?.toDate ? data.toDate() : new Date(data);
  if (isNaN(d.getTime())) return false;

  const agora = new Date();
  let limite;
  if (periodo === "hoje") {
    limite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  } else if (periodo === "7d") {
    limite = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (periodo === "30d") {
    limite = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else {
    return true; // sem filtro
  }
  return d.getTime() >= limite.getTime();
}
