// src/components/ui.jsx
import { iniciais } from "../lib/utils.js";

export function Avatar({ nome, lg }) {
  const s = lg ? 54 : 38;
  return (
    <div style={{
      width: s, height: s, borderRadius: lg ? 14 : 10, flexShrink: 0,
      background: "var(--brandSoft)", color: "var(--brand)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: lg ? 19 : 13.5, fontWeight: 600,
    }}>
      {iniciais(nome)}
    </div>
  );
}

export function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: 0,
    }}>
      <span style={{
        width: 36, height: 21, borderRadius: 20, position: "relative", flexShrink: 0,
        background: on ? "var(--good)" : "var(--line)", transition: "background 0.2s",
      }}>
        <span style={{
          position: "absolute", top: 2.5, left: on ? 17.5 : 2.5,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s cubic-bezier(.25,1,.5,1)",
          boxShadow: "0 1px 2px rgba(0,0,0,.2)",
        }} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: on ? "var(--good)" : "var(--inkFaint)" }}>
        {on ? "Ativo" : "Inativo"}
      </span>
    </button>
  );
}

export function Chip({ children, tone }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
      background: tone === "good" ? "var(--goodSoft)" : "var(--surface2)",
      color: tone === "good" ? "var(--good)" : "var(--inkSoft)",
    }}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, unit, sub, accent }) {
  return (
    <div className="card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span className="tnum" style={{ fontSize: 30, fontWeight: 600, color: accent || "var(--ink)", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: "var(--inkFaint)" }}>{unit}</span>}
      </span>
      {sub && <span style={{ fontSize: 12.5, color: "var(--inkSoft)" }}>{sub}</span>}
    </div>
  );
}
