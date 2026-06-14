// src/lib/utils.js
export const imc = (peso, altura) => +(peso / (altura * altura)).toFixed(1);
export const br = (n) => (n == null ? "" : n.toString().replace(".", ","));
export const fmtData = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
export const ultimoCiclo = (p) => p.ciclos[p.ciclos.length - 1];
export const primeiroCiclo = (p) => p.ciclos[0];
export const perdaPeso = (p) =>
  p.ciclos.length > 1 ? +(primeiroCiclo(p).peso - ultimoCiclo(p).peso).toFixed(1) : 0;

// ✅ CORRIGIDO — era new Date("2026-05-08"), fixo no tempo
export const mesesTrat = (iso) => {
  const hoje = new Date();
  const i = new Date(iso);
  return (hoje.getFullYear() - i.getFullYear()) * 12 + (hoje.getMonth() - i.getMonth());
};

// ✅ CORRIGIDO — era hardcodado para abril de 2026
export const novoEsteMes = (iso) => {
  const hoje = new Date();
  const i = new Date(iso);
  return i.getFullYear() === hoje.getFullYear() && i.getMonth() === hoje.getMonth();
};

export const iniciais = (nome) =>
  nome.split(" ").map((n) => n[0]).slice(0, 2).join("");

// parse seguro de número que pode vir com vírgula
export const parseNum = (v) => {
  if (typeof v === "number") return v;
  return +(String(v ?? "").replace(",", ".")) || 0;
};

// cores para gráficos (HEX, canvas-safe), cientes do tema
export function chartColors(tema) {
  if (tema === "escuro") {
    return {
      brand: "#3db8c0", good: "#3fc88a", gord: "#e08060", visc: "#9d86e0",
      idade: "#d4a850", line: "#2c3836", ink: "#e8eeec", inkSoft: "#a3b0ad", inkFaint: "#75827f",
    };
  }
  return {
    brand: "#0d7a82", good: "#1f9d6b", gord: "#c2543a", visc: "#6b4fc4",
    idade: "#b8862f", line: "#dde5e5", ink: "#27322f", inkSoft: "#5a6663", inkFaint: "#8a9693",
  };
}
