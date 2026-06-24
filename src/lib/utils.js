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

// ─── Massa magra ─────────────────────────────────────────────
// Retorna a massa magra (kg) de um ciclo. Prioridade:
//  1. massaMagra explícita (kg) informada pelo médico
//  2. derivada de peso e % gordura: peso × (1 − gordura/100)
//  3. derivada de massaMagraPct (%) × peso
// Retorna null se não houver dados suficientes.
export const massaMagraKg = (c) => {
  if (c == null) return null;
  if (c.massaMagra != null && c.massaMagra !== "") return +(+c.massaMagra).toFixed(1);
  if (c.massaMagraPct != null && c.massaMagraPct !== "" && c.peso) {
    return +((c.peso * c.massaMagraPct) / 100).toFixed(1);
  }
  if (c.gordura != null && c.gordura !== "" && c.peso) {
    return +(c.peso * (1 - c.gordura / 100)).toFixed(1);
  }
  return null;
};

// Massa magra como % do peso. Usa massaMagraPct se houver, senão deriva de % gordura.
export const massaMagraPct = (c) => {
  if (c == null) return null;
  if (c.massaMagraPct != null && c.massaMagraPct !== "") return +(+c.massaMagraPct).toFixed(1);
  const kg = massaMagraKg(c);
  if (kg != null && c.peso) return +((kg / c.peso) * 100).toFixed(1);
  if (c.gordura != null && c.gordura !== "") return +(100 - c.gordura).toFixed(1);
  return null;
};

export const perdaPeso = (p) =>
  p.ciclos.length > 1 ? +(primeiroCiclo(p).peso - ultimoCiclo(p).peso).toFixed(1) : 0;

export const mesesTrat = (iso) => {
  const hoje = new Date();
  const i = new Date(iso);
  return (hoje.getFullYear() - i.getFullYear()) * 12 + (hoje.getMonth() - i.getMonth());
};

export const novoEsteMes = (iso) => {
  const hoje = new Date();
  const i = new Date(iso);
  return i.getFullYear() === hoje.getFullYear() && i.getMonth() === hoje.getMonth();
};

export const iniciais = (nome) =>
  nome.split(" ").map((n) => n[0]).slice(0, 2).join("");

export const parseNum = (v) => {
  if (typeof v === "number") return v;
  return +(String(v ?? "").replace(",", ".")) || 0;
};

// ─── Helpers de meta ─────────────────────────────────────────
// Calcula o IMC meta a partir do peso meta e altura
export const imcMeta = (pesoMeta, altura) => {
  if (!pesoMeta || !altura) return null;
  return +(pesoMeta / (altura * altura)).toFixed(1);
};

// Verifica se o paciente bateu a meta de peso
export const metaPesoBatida = (p) => {
  if (!p.pesoMeta || !p.ciclos.length) return false;
  const u = ultimoCiclo(p);
  return u.peso <= p.pesoMeta;
};

// Verifica se bateu a meta de gordura visceral
export const metaVisceralBatida = (p) => {
  if (!p.visceralMeta || !p.ciclos.length) return false;
  const u = ultimoCiclo(p);
  return u.visceral != null && u.visceral <= p.visceralMeta;
};

// Idade em anos (do paciente)
export const idade = (p) => p.idade || 0;

// Faixa etária (string "30-39", "40-49"…)
export const faixaEtaria = (i) => {
  if (i < 30) return "<30";
  if (i < 40) return "30-39";
  if (i < 50) return "40-49";
  if (i < 60) return "50-59";
  if (i < 70) return "60-69";
  return "70+";
};

// cores para gráficos
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
