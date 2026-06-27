// src/lib/medicamentos.js
// Depleção de nutrientes por medicamento — fonte: planilha clínica.
// Uso educativo/informativo. A conduta e prescrição são 100% do médico.

export const MEDICAMENTOS = [
  {
    "nome": "Ácido Acetilsalicílico",
    "depleta": [
      "Vitamina C",
      "Ácido Fólico",
      "Potássio",
      "Vitamina B12"
    ]
  },
  {
    "nome": "Alendronato",
    "depleta": [
      "Cálcio",
      "Vitamina D",
      "Magnésio"
    ]
  },
  {
    "nome": "Alopurinol",
    "depleta": [
      "Vitamina B12",
      "Selênio",
      "Magnésio",
      "Vitamina D"
    ]
  },
  {
    "nome": "Alprazolam",
    "depleta": [
      "Vitamina B12",
      "Magnésio",
      "Zinco"
    ]
  },
  {
    "nome": "Amiodarona",
    "depleta": [
      "Iodo"
    ]
  },
  {
    "nome": "Amitriptilina",
    "depleta": [
      "Potássio",
      "Magnésio",
      "Vitamina B12",
      "Vitamina D"
    ]
  },
  {
    "nome": "Anlodipino",
    "depleta": [
      "Potássio",
      "Magnésio",
      "Zinco",
      "Ácido Fólico",
      "Vitamina D"
    ]
  },
  {
    "nome": "Aripiprazol",
    "depleta": [
      "Zinco",
      "Cálcio",
      "Potássio"
    ]
  },
  {
    "nome": "Atenolol",
    "depleta": [
      "Coenzima Q10",
      "Magnésio",
      "Potássio",
      "Vitamina D",
      "Cálcio",
      "Zinco"
    ]
  },
  {
    "nome": "Bisoprolol",
    "depleta": [
      "Coenzima Q10",
      "Vitamina D",
      "Magnésio"
    ]
  },
  {
    "nome": "Bromocriptina",
    "depleta": [
      "Vitamina B6",
      "Magnésio",
      "Zinco"
    ]
  },
  {
    "nome": "Carbamazepina",
    "depleta": [
      "Vitamina D",
      "Cálcio",
      "Vitamina B12",
      "Ácido Fólico"
    ]
  },
  {
    "nome": "Carvedilol",
    "depleta": [
      "Coenzima Q10",
      "Magnésio",
      "Potássio",
      "Vitamina D"
    ]
  },
  {
    "nome": "Cefalexina",
    "depleta": [
      "Vitamina K",
      "Ferro",
      "Magnésio"
    ]
  },
  {
    "nome": "Ciclosporina",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Zinco"
    ]
  },
  {
    "nome": "Cimetidina",
    "depleta": [
      "Vitamina B12",
      "Ferro",
      "Zinco"
    ]
  },
  {
    "nome": "Ciprofloxacino",
    "depleta": [
      "Cálcio",
      "Zinco",
      "Magnésio",
      "Ferro"
    ]
  },
  {
    "nome": "Citalopram",
    "depleta": [
      "Magnésio",
      "Selênio",
      "Vitamina D",
      "Potássio"
    ]
  },
  {
    "nome": "Clindamicina",
    "depleta": [
      "Vitamina K",
      "Magnésio",
      "Zinco"
    ]
  },
  {
    "nome": "Clomifeno",
    "depleta": [
      "Zinco",
      "Magnésio",
      "Vitamina B6",
      "Vitamina E"
    ]
  },
  {
    "nome": "Clonazepam",
    "depleta": [
      "Magnésio",
      "Zinco",
      "Potássio"
    ]
  },
  {
    "nome": "Clonidina",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Cálcio",
      "Zinco"
    ]
  },
  {
    "nome": "Clopidogrel",
    "depleta": [
      "Vitamina B12",
      "Ácido Fólico",
      "Vitamina K"
    ]
  },
  {
    "nome": "Dexametasona",
    "depleta": [
      "Vitamina D",
      "Cálcio",
      "Potássio",
      "Magnésio"
    ]
  },
  {
    "nome": "Diazepam",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Vitamina D"
    ]
  },
  {
    "nome": "Digoxina",
    "depleta": [
      "Potássio"
    ]
  },
  {
    "nome": "Diltiazem",
    "depleta": [
      "Potássio",
      "Magnésio",
      "Cálcio"
    ]
  },
  {
    "nome": "Doxazosina",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Zinco",
      "Vitamina D"
    ]
  },
  {
    "nome": "Doxiciclina",
    "depleta": [
      "Magnésio",
      "Ferro",
      "Cálcio",
      "Zinco"
    ]
  },
  {
    "nome": "Esomeprazol",
    "depleta": [
      "Cálcio",
      "Magnésio",
      "Zinco",
      "Vitamina B12"
    ]
  },
  {
    "nome": "Espironolactona",
    "depleta": [
      "Potássio",
      "Magnésio",
      "Zinco"
    ]
  },
  {
    "nome": "Fenitoína",
    "depleta": [
      "Vitamina D",
      "Ácido Fólico",
      "Cálcio"
    ]
  },
  {
    "nome": "Fenobarbital",
    "depleta": [
      "Vitamina D",
      "Vitamina K",
      "Ácido Fólico"
    ]
  },
  {
    "nome": "Fentermina",
    "depleta": [
      "Coenzima Q10",
      "Magnésio",
      "Vitamina B12"
    ]
  },
  {
    "nome": "Finasterida",
    "depleta": [
      "Zinco",
      "Vitamina D",
      "Selênio"
    ]
  },
  {
    "nome": "Fluoxetina",
    "depleta": [
      "Sódio",
      "Magnésio",
      "Selênio",
      "Ácido Fólico",
      "Potássio",
      "Cálcio"
    ]
  },
  {
    "nome": "Fluvoxamina",
    "depleta": [
      "Magnésio",
      "Zinco",
      "Potássio"
    ]
  },
  {
    "nome": "Furosemida",
    "depleta": [
      "Potássio",
      "Magnésio",
      "Cálcio",
      "Vitamina B1 (Tiamina)"
    ]
  },
  {
    "nome": "Gabapentina",
    "depleta": [
      "Magnésio",
      "Selênio",
      "Vitamina B12",
      "Ferro",
      "Vitamina D"
    ]
  },
  {
    "nome": "Haloperidol",
    "depleta": [
      "Magnésio",
      "Zinco",
      "Potássio"
    ]
  },
  {
    "nome": "Hidroclorotiazida",
    "depleta": [
      "Potássio"
    ]
  },
  {
    "nome": "Ibuprofeno",
    "depleta": [
      "Ferro",
      "Selênio",
      "Vitamina D"
    ]
  },
  {
    "nome": "Isosorbida",
    "depleta": [
      "Coenzima Q10",
      "Magnésio",
      "Potássio"
    ]
  },
  {
    "nome": "Isotretinoína",
    "depleta": [
      "Vitamina A",
      "Vitamina E",
      "Vitamina D"
    ]
  },
  {
    "nome": "Lamotrigina",
    "depleta": [
      "Magnésio",
      "Zinco",
      "Ácido Fólico"
    ]
  },
  {
    "nome": "Levodopa",
    "depleta": [
      "Vitamina B6",
      "Vitamina B12",
      "Ácido Fólico"
    ]
  },
  {
    "nome": "Levotiroxina",
    "depleta": [
      "Iodo",
      "Ferro",
      "Vitamina D",
      "Zinco",
      "Selênio"
    ]
  },
  {
    "nome": "Lisinopril",
    "depleta": [
      "Potássio",
      "Magnésio",
      "Zinco",
      "Vitamina D"
    ]
  },
  {
    "nome": "Lítio",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Zinco",
      "Sódio"
    ]
  },
  {
    "nome": "Loratadina",
    "depleta": [
      "Vitamina C",
      "Magnésio",
      "Potássio",
      "Zinco"
    ]
  },
  {
    "nome": "Losartana",
    "depleta": [
      "Potássio",
      "Vitamina D",
      "Ácido Fólico",
      "Coenzima Q10"
    ]
  },
  {
    "nome": "Metformina",
    "depleta": [
      "Vitamina B12",
      "Magnésio",
      "Ácido Fólico",
      "Zinco",
      "Selênio",
      "Vitamina D",
      "Ferro"
    ]
  },
  {
    "nome": "Metoprolol",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Vitamina D",
      "Zinco",
      "Coenzima Q10"
    ]
  },
  {
    "nome": "Metronidazol",
    "depleta": [
      "Magnésio",
      "Zinco",
      "Ferro"
    ]
  },
  {
    "nome": "Mirtazapina",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Vitamina D"
    ]
  },
  {
    "nome": "Olanzapina",
    "depleta": [
      "Vitamina B6",
      "Magnésio",
      "Zinco",
      "Ácido Fólico"
    ]
  },
  {
    "nome": "Orlistate",
    "depleta": [
      "Vitamina A",
      "Vitamina D",
      "Vitamina E",
      "Vitamina K"
    ]
  },
  {
    "nome": "Omeprazol",
    "depleta": [
      "Magnésio",
      "Ferro",
      "Cálcio",
      "Zinco",
      "Vitamina D"
    ]
  },
  {
    "nome": "Pantoprazol",
    "depleta": [
      "Cálcio"
    ]
  },
  {
    "nome": "Paroxetina",
    "depleta": [
      "Magnésio"
    ]
  },
  {
    "nome": "Prednisona",
    "depleta": [
      "Potássio",
      "Cálcio",
      "Magnésio",
      "Zinco",
      "Vitamina D",
      "Ácido Fólico",
      "Coenzima Q10"
    ]
  },
  {
    "nome": "Propafenona",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Coenzima Q10"
    ]
  },
  {
    "nome": "Quetiapina",
    "depleta": [
      "Vitamina D",
      "Magnésio",
      "Zinco"
    ]
  },
  {
    "nome": "Ramipril",
    "depleta": [
      "Potássio",
      "Magnésio"
    ]
  },
  {
    "nome": "Ranitidina",
    "depleta": [
      "Vitamina B12",
      "Ferro",
      "Zinco"
    ]
  },
  {
    "nome": "Rifamicina",
    "depleta": [
      "Vitamina B6",
      "Vitamina D",
      "Ácido Fólico"
    ]
  },
  {
    "nome": "Risedronato",
    "depleta": [
      "Cálcio",
      "Vitamina D",
      "Magnésio"
    ]
  },
  {
    "nome": "Risperidona",
    "depleta": [
      "Potássio",
      "Cálcio",
      "Magnésio",
      "Vitamina D"
    ]
  },
  {
    "nome": "Rivaroxabana",
    "depleta": [
      "Vitamina K",
      "Magnésio",
      "Cálcio"
    ]
  },
  {
    "nome": "Rosuvastatina",
    "depleta": [
      "Coenzima Q10",
      "Vitamina D",
      "Selênio"
    ]
  },
  {
    "nome": "Sinvastatina",
    "depleta": [
      "Coenzima Q10",
      "Vitamina D",
      "Selênio",
      "Magnésio"
    ]
  },
  {
    "nome": "Sulfasalazina",
    "depleta": [
      "Ácido Fólico",
      "Vitamina B12",
      "Ferro"
    ]
  },
  {
    "nome": "Tacrolimo",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Zinco",
      "Vitamina D"
    ]
  },
  {
    "nome": "Tamsulosina",
    "depleta": [
      "Magnésio",
      "Zinco",
      "Potássio"
    ]
  },
  {
    "nome": "Tetraciclina",
    "depleta": [
      "Cálcio",
      "Magnésio",
      "Zinco",
      "Ferro"
    ]
  },
  {
    "nome": "Topiramato",
    "depleta": [
      "Ácido Fólico",
      "Potássio",
      "Magnésio"
    ]
  },
  {
    "nome": "Tramadol",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Vitamina B12"
    ]
  },
  {
    "nome": "Valproato DeSódio",
    "depleta": [
      "Vitamina D",
      "Ácido Fólico",
      "Vitamina B12",
      "Magnésio"
    ]
  },
  {
    "nome": "Varfarina",
    "depleta": [
      "Vitamina K",
      "Magnésio",
      "Ácido Fólico",
      "Ferro",
      "Coenzima Q10",
      "Vitamina E"
    ]
  },
  {
    "nome": "Venlafaxina",
    "depleta": [
      "Ferro",
      "Magnésio",
      "Selênio"
    ]
  },
  {
    "nome": "Verapamil",
    "depleta": [
      "Magnésio",
      "Potássio",
      "Cálcio"
    ]
  },
  {
    "nome": "Cálcio",
    "depleta": [
      "1"
    ]
  },
  {
    "nome": "Ferro",
    "depleta": [
      "1"
    ]
  },
  {
    "nome": "Magnésio",
    "depleta": [
      "1"
    ]
  },
  {
    "nome": "Vitamina D",
    "depleta": [
      "1"
    ]
  },
  {
    "nome": "Zinco",
    "depleta": [
      "1"
    ]
  },
  {
    "nome": "Fe",
    "depleta": [
      "1"
    ]
  },
  {
    "nome": "C",
    "depleta": [
      "1"
    ]
  },
  {
    "nome": "D",
    "depleta": [
      "1"
    ]
  }
];

export function buscarMedicamentos(termo) {
  const t = (termo || "").toLowerCase().trim();
  if (!t) return MEDICAMENTOS;
  return MEDICAMENTOS.filter((m) => m.nome.toLowerCase().includes(t));
}

// Agrega todos os nutrientes depletados por uma lista de medicamentos
export function nutrientesDepletados(nomesMeds) {
  const mapa = {};
  for (const nome of nomesMeds) {
    const med = MEDICAMENTOS.find((m) => m.nome === nome);
    if (!med) continue;
    for (const n of med.depleta) {
      if (!mapa[n]) mapa[n] = [];
      mapa[n].push(med.nome);
    }
  }
  return mapa; // { "Vitamina B12": ["Omeprazol", "Metformina"], ... }
}
