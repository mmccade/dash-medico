// src/lib/suplementos.js
// Interações entre nutrientes/suplementos — fonte: planilha clínica.
// Sinergismo = potencializa absorção/efeito. Antagonismo = competem/reduzem absorção.
// Uso informativo. A prescrição é de responsabilidade do médico.

export const SUPLEMENTOS = [
  "Biotina",
  "Boro",
  "Calcio",
  "Carotenóides",
  "Cloreto",
  "CoQ10",
  "Cobre",
  "Coenzima A",
  "Coenzima Q10",
  "Cromo",
  "Cálcio",
  "Ferro",
  "Folato",
  "Fósforo",
  "Magnesio",
  "Magnésio",
  "NAC",
  "Potássio",
  "Proteína",
  "Selênio",
  "Sódio",
  "Taurina",
  "Vitamina A",
  "Vitamina B1",
  "Vitamina B1 (Tiamina)",
  "Vitamina B12",
  "Vitamina B2",
  "Vitamina B2 (Riboflavina)",
  "Vitamina B3",
  "Vitamina B3 (Niacina)",
  "Vitamina B5 (Ácido Pantotênico)",
  "Vitamina B6",
  "Vitamina B9 (Ácido Fólico)",
  "Vitamina C",
  "Vitamina D",
  "Vitamina E",
  "Vitamina K",
  "Vitamina K2",
  "Zinco",
  "Ácido Alfa-lipóico",
  "Ácido Fítico",
  "Ácido Fólico",
  "Ômega-3"
];

export const INTERACOES = [
  {
    "a": "Ácido Alfa-lipóico",
    "b": "Vitamina C",
    "tipo": "sinergismo"
  },
  {
    "a": "Ácido Alfa-lipóico",
    "b": "Zinco",
    "tipo": "antagonismo"
  },
  {
    "a": "Ácido Alfa-lipóico",
    "b": "Magnesio",
    "tipo": "antagonismo"
  },
  {
    "a": "Ácido Alfa-lipóico",
    "b": "Calcio",
    "tipo": "antagonismo"
  },
  {
    "a": "Ácido Alfa-lipóico",
    "b": "Vitamina E",
    "tipo": "sinergismo"
  },
  {
    "a": "Ácido Alfa-lipóico",
    "b": "CoQ10",
    "tipo": "sinergismo"
  },
  {
    "a": "Ácido Alfa-lipóico",
    "b": "NAC",
    "tipo": "sinergismo"
  },
  {
    "a": "Cálcio",
    "b": "Vitamina D",
    "tipo": "sinergismo"
  },
  {
    "a": "Cálcio",
    "b": "Ácido Fítico",
    "tipo": "antagonismo"
  },
  {
    "a": "Cálcio",
    "b": "Boro",
    "tipo": "sinergismo"
  },
  {
    "a": "Cálcio",
    "b": "Proteína",
    "tipo": "sinergismo"
  },
  {
    "a": "Cálcio",
    "b": "Sódio",
    "tipo": "antagonismo"
  },
  {
    "a": "Cálcio",
    "b": "Zinco",
    "tipo": "antagonismo"
  },
  {
    "a": "Cobre",
    "b": "Zinco",
    "tipo": "antagonismo"
  },
  {
    "a": "Ferro",
    "b": "Cobre",
    "tipo": "sinergismo"
  },
  {
    "a": "Ferro",
    "b": "Vitamina C",
    "tipo": "sinergismo"
  },
  {
    "a": "Ferro",
    "b": "Cálcio",
    "tipo": "antagonismo"
  },
  {
    "a": "Ferro",
    "b": "Zinco",
    "tipo": "antagonismo"
  },
  {
    "a": "Ferro",
    "b": "Ácido Fítico",
    "tipo": "antagonismo"
  },
  {
    "a": "Ferro",
    "b": "Vitamina A",
    "tipo": "sinergismo"
  },
  {
    "a": "Ferro",
    "b": "Vitamina B6",
    "tipo": "sinergismo"
  },
  {
    "a": "Ferro",
    "b": "Ácido Fólico",
    "tipo": "sinergismo"
  },
  {
    "a": "Fósforo",
    "b": "Magnésio",
    "tipo": "antagonismo"
  },
  {
    "a": "Fósforo",
    "b": "Vitamina D",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Cálcio",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Potássio",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Vitamina B1",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Vitamina D",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Zinco",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Ácido Fítico",
    "tipo": "antagonismo"
  },
  {
    "a": "Magnésio",
    "b": "Vitamina C",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Cloreto",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Cromo",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Taurina",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Vitamina B2",
    "tipo": "sinergismo"
  },
  {
    "a": "Magnésio",
    "b": "Vitamina B3",
    "tipo": "sinergismo"
  },
  {
    "a": "Ômega-3",
    "b": "Vitamina E",
    "tipo": "sinergismo"
  },
  {
    "a": "Ômega-3",
    "b": "Vitamina D",
    "tipo": "sinergismo"
  },
  {
    "a": "Ômega-3",
    "b": "Vitamina C",
    "tipo": "sinergismo"
  },
  {
    "a": "Selênio",
    "b": "Magnésio",
    "tipo": "sinergismo"
  },
  {
    "a": "Selênio",
    "b": "Vitamina E",
    "tipo": "sinergismo"
  },
  {
    "a": "Selênio",
    "b": "Ácido Fólico",
    "tipo": "sinergismo"
  },
  {
    "a": "Selênio",
    "b": "Zinco",
    "tipo": "sinergismo"
  },
  {
    "a": "Selênio",
    "b": "Coenzima Q10",
    "tipo": "sinergismo"
  },
  {
    "a": "Selênio",
    "b": "Vitamina A",
    "tipo": "sinergismo"
  },
  {
    "a": "Selênio",
    "b": "Vitamina C",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina A",
    "b": "Vitamina E",
    "tipo": "antagonismo"
  },
  {
    "a": "Vitamina A",
    "b": "Zinco",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina A",
    "b": "Carotenóides",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina A",
    "b": "Vitamina B12",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina A",
    "b": "Vitamina D",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B1",
    "b": "Ácido Fólico",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B1 (Tiamina)",
    "b": "Zinco",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B12",
    "b": "Biotina",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B12",
    "b": "Folato",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B12",
    "b": "Vitamina B6",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B12",
    "b": "Vitamina E",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B2",
    "b": "Vitamina B6",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B2 (Riboflavina)",
    "b": "Ferro",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B3 (Niacina)",
    "b": "Vitamina B6",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B5 (Ácido Pantotênico)",
    "b": "Coenzima A",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B6",
    "b": "Magnésio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B6",
    "b": "Vitamina B12",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B6",
    "b": "Ácido Fólico",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B6",
    "b": "Ácido Alfa-lipóico",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B9 (Ácido Fólico)",
    "b": "Vitamina C",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B9 (Ácido Fólico)",
    "b": "Vitamina B12",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina B9 (Ácido Fólico)",
    "b": "Vitamina B2",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina C",
    "b": "Selênio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina C",
    "b": "Vitamina E",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina C",
    "b": "Cobre",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina C",
    "b": "Vitamina K",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina C",
    "b": "Ácido Fólico",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina D",
    "b": "Cálcio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina D",
    "b": "Vitamina K2",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina D",
    "b": "Vitamina B12",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina D",
    "b": "Magnésio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina D",
    "b": "Selênio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina D",
    "b": "Vitamina A",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina D",
    "b": "Vitamina B5 (Ácido Pantotênico)",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina E",
    "b": "Vitamina A",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina E",
    "b": "Selênio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina E",
    "b": "Coenzima Q10",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina E",
    "b": "Ferro",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina K",
    "b": "Magnésio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina K2",
    "b": "Cálcio",
    "tipo": "sinergismo"
  },
  {
    "a": "Vitamina K2",
    "b": "Vitamina D",
    "tipo": "sinergismo"
  },
  {
    "a": "Zinco",
    "b": "Cobre",
    "tipo": "antagonismo"
  },
  {
    "a": "Zinco",
    "b": "Ferro",
    "tipo": "antagonismo"
  },
  {
    "a": "Zinco",
    "b": "Vitamina A",
    "tipo": "sinergismo"
  },
  {
    "a": "Zinco",
    "b": "Vitamina B6",
    "tipo": "sinergismo"
  },
  {
    "a": "Zinco",
    "b": "Vitamina D",
    "tipo": "sinergismo"
  },
  {
    "a": "Zinco",
    "b": "Vitamina K",
    "tipo": "sinergismo"
  },
  {
    "a": "Zinco",
    "b": "Ácido Alfa-lipóico",
    "tipo": "sinergismo"
  },
  {
    "a": "Zinco",
    "b": "Ácido Fólico",
    "tipo": "sinergismo"
  }
];

// Dado um conjunto de suplementos selecionados, retorna as interações entre eles
export function interacoesEntre(selecionados) {
  const set = new Set(selecionados);
  const sinergismos = [];
  const antagonismos = [];
  for (const it of INTERACOES) {
    if (set.has(it.a) && set.has(it.b)) {
      (it.tipo === "sinergismo" ? sinergismos : antagonismos).push(it);
    }
  }
  return { sinergismos, antagonismos };
}

// Sugere suplementos que combinam (sinergismo) com os já selecionados e ainda não estão na lista
export function sugestoesSinergicas(selecionados) {
  const set = new Set(selecionados);
  const sug = {};
  for (const it of INTERACOES) {
    if (it.tipo !== "sinergismo") continue;
    if (set.has(it.a) && !set.has(it.b)) sug[it.b] = (sug[it.b] || 0) + 1;
    if (set.has(it.b) && !set.has(it.a)) sug[it.a] = (sug[it.a] || 0) + 1;
  }
  return Object.entries(sug).sort((x, y) => y[1] - x[1]).map(([nome]) => nome);
}
