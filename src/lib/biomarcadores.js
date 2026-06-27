// src/lib/biomarcadores.js
// Fonte: planilha de anamnese integrativa (Nutromni)
// Estrutura: { nome, categoria, refTexto, ideal: { M: [min,max], F: [min,max] }, interpretacao: { alto, baixo } }

export const CATEGORIAS_EXAME = [
  "Avaliação Sanguínea",
  "Hematologia específica",
  "Perfil Lipídico",
  "Avaliação Hormonal",
  "Avaliação Metabólica",
  "Avaliação Hepática",
  "Avaliação Nutricional",
  "Avaliação Renal",
  "Metais Pesados",
  "Avaliação Cardíaca",
  "Microbiota",
  "Marcadores Tumorais",
];

// null = sem limite naquele lado (ex: ">90")
export const BIOMARCADORES = [
  // ── Avaliação Sanguínea ──────────────────────────────────────
  { nome: "Hemácias",              categoria: "Avaliação Sanguínea",    refTexto: "4,5 a 6",         ideal: { M: [5.0, 5.5], F: [4.5, 5.5] }, unidade: "mi/µL" },
  { nome: "Hemoglobina",           categoria: "Avaliação Sanguínea",    refTexto: "13–17 / 12–15,5", ideal: { M: [14.0, 16.0], F: [13.5, 15.5] }, unidade: "g/dL",
    interpretacao: { baixo: "Investigar possível anemia, aumentar ingestão de ferro, revisar alimentação.", alto: "Avaliar sinais de desidratação, considerar causas pulmonares ou cardíacas." } },
  { nome: "Hematócrito",           categoria: "Avaliação Sanguínea",    refTexto: "39–52 / 36–47",   ideal: { M: [42, 48], F: [39, 46] }, unidade: "%",
    interpretacao: { baixo: "Pode indicar anemia ou deficiência nutricional; revisar alimentação.", alto: "Pode sugerir desidratação; aumentar ingestão de líquidos." } },
  { nome: "VCM",                   categoria: "Avaliação Sanguínea",    refTexto: "80–98",            ideal: { M: [88, 92], F: [88, 92] }, unidade: "fL" },
  { nome: "HCM",                   categoria: "Avaliação Sanguínea",    refTexto: "26–34",            ideal: { M: [27, 33], F: [28, 32] }, unidade: "pg" },
  { nome: "CHCM",                  categoria: "Avaliação Sanguínea",    refTexto: "31–36",            ideal: { M: [31, 35], F: [32, 35] }, unidade: "g/dL" },
  { nome: "RDW",                   categoria: "Avaliação Sanguínea",    refTexto: "11,5–14,5%",       ideal: { M: [11.5, 13.0], F: [11.5, 13.0] }, unidade: "%" },
  { nome: "Plaquetas",             categoria: "Avaliação Sanguínea",    refTexto: "150.000–450.000",  ideal: { M: [250000, 300000], F: [180000, 300000] }, unidade: "/mm³",
    interpretacao: { baixo: "Pode sugerir distúrbios de coagulação; evitar traumas, monitorar sangramento.", alto: "Possível reação inflamatória; investigar histórico de infecções." } },
  { nome: "Leucócitos",            categoria: "Avaliação Sanguínea",    refTexto: "4.000–11.000",     ideal: { M: [4000, 6500], F: [4000, 6500] }, unidade: "/mm³",
    interpretacao: { baixo: "Investigar sinais de imunossupressão, histórico de infecções recentes.", alto: "Pode indicar infecção ou inflamação; observar sintomas associados." } },
  { nome: "Neutrófilos",           categoria: "Avaliação Sanguínea",    refTexto: "1.700–8.000",      ideal: { M: [4000, 6500], F: [4000, 6500] }, unidade: "/mm³" },
  { nome: "Linfócitos",            categoria: "Avaliação Sanguínea",    refTexto: "900–2.900",        ideal: { M: [2800, 2800], F: [2500, 2800] }, unidade: "/mm³" },
  { nome: "Rel. Neutrófilos/Linfócitos", categoria: "Avaliação Sanguínea", refTexto: "< 5",          ideal: { M: [null, 1.5], F: [null, 1.5] } },
  { nome: "Eosinófilos",           categoria: "Avaliação Sanguínea",    refTexto: "50–500/mm³",       ideal: { M: [0, 1], F: [0, 1] }, unidade: "/mm³" },
  { nome: "Monócitos",             categoria: "Avaliação Sanguínea",    refTexto: "100–1.000/mm³",    ideal: { M: [3, 8], F: [3, 8] }, unidade: "/mm³" },
  { nome: "Basófilos",             categoria: "Avaliação Sanguínea",    refTexto: "0–200",            ideal: { M: [0, 0.5], F: [0, 0.5] }, unidade: "/mm³" },

  // ── Hematologia específica ───────────────────────────────────
  { nome: "Homocisteína",          categoria: "Hematologia específica", refTexto: "3–14 mcmol/L",     ideal: { M: [5, 9], F: [5, 9] }, unidade: "mcmol/L",
    interpretacao: { alto: "Pode indicar metilação ineficiente, deficiência de B12/folato/B6 ou resistência à insulina.", baixo: "Pode indicar maior atividade de metilação ou alta ingestão de cofatores." } },
  { nome: "Ferritina",             categoria: "Hematologia específica", refTexto: "30–300 mcg/L",     ideal: { M: [100, 100], F: [100, 130] }, unidade: "mcg/L",
    interpretacao: { baixo: "Possível deficiência de ferro; melhorar ingestão alimentar.", alto: "Pode indicar inflamação ou sobrecarga de ferro." } },
  { nome: "Ferro (Sérico)",        categoria: "Hematologia específica", refTexto: "50–200 µg/dL",     ideal: { M: [80, 150], F: [70, 120] }, unidade: "µg/dL" },
  { nome: "Sat. transferrina",     categoria: "Hematologia específica", refTexto: "20–50%",           ideal: { M: [0, 30], F: [10, 30] }, unidade: "%" },
  { nome: "Transferrina Livre",    categoria: "Hematologia específica", refTexto: "212–360",          ideal: { M: [212, 360], F: [212, 360] }, unidade: "µg/dL" },
  { nome: "Fibrinogênio",          categoria: "Hematologia específica", refTexto: "150–350",          ideal: { M: [0, 250], F: [150, 250] }, unidade: "mg/dL" },
  { nome: "TFG",                   categoria: "Hematologia específica", refTexto: "> 90",             ideal: { M: [90, null], F: [90, null] }, unidade: "mL/min" },
  { nome: "Cistatina C",           categoria: "Hematologia específica", refTexto: "< 1 mg/L",        ideal: { M: [null, 1], F: [0.5, 1] }, unidade: "mg/L",
    interpretacao: { alto: "Pode indicar redução da TFG e possível doença renal inicial." } },

  // ── Perfil Lipídico ──────────────────────────────────────────
  { nome: "Colesterol Total",      categoria: "Perfil Lipídico",        refTexto: "< 200 mg/dL",     ideal: { M: [null, 240], F: [null, 240] }, unidade: "mg/dL",
    interpretacao: { alto: "Pode aumentar risco cardiovascular; reduzir gordura saturada, praticar exercícios." } },
  { nome: "LDL",                   categoria: "Perfil Lipídico",        refTexto: "< 130 mg/dL",     ideal: { M: [100, 130], F: [100, 130] }, unidade: "mg/dL",
    interpretacao: { alto: "Aumenta risco de doenças cardíacas; melhorar alimentação, aumentar atividade física." } },
  { nome: "HDL",                   categoria: "Perfil Lipídico",        refTexto: "> 45 mg/dL",      ideal: { M: [50, 73], F: [60, 93] }, unidade: "mg/dL",
    interpretacao: { baixo: "Reduz proteção cardiovascular; aumentar atividade física, incluir gorduras boas." } },
  { nome: "VLDL",                  categoria: "Perfil Lipídico",        refTexto: "5–40 mg/dL",      ideal: { M: [5, 20], F: [5, 20] }, unidade: "mg/dL" },
  { nome: "Triglicerídeos",        categoria: "Perfil Lipídico",        refTexto: "100–400 mg/dL",   ideal: { M: [null, 250], F: [null, 100] }, unidade: "mg/dL",
    interpretacao: { alto: "Relacionado a risco cardiovascular; reduzir açúcares e gorduras, aumentar exercícios." } },
  { nome: "Rel. TG/HDL",          categoria: "Perfil Lipídico",        refTexto: "< 3",              ideal: { M: [null, 1.8], F: [null, 1.8] },
    interpretacao: { alto: "Pode indicar resistência à insulina, esteatose hepática e maior risco cardiometabólico.", baixo: "Pode indicar boa sensibilidade à insulina e menor risco metabólico." } },
  { nome: "Rel. LDL/HDL",         categoria: "Perfil Lipídico",        refTexto: "< 3",              ideal: { M: [null, 2.3], F: [null, 2.3] } },
  { nome: "Rel. CT/HDL",          categoria: "Perfil Lipídico",        refTexto: "< 4,5",            ideal: { M: [null, 3.3], F: [null, 3.3] } },
  { nome: "Apo A1",               categoria: "Perfil Lipídico",        refTexto: "88–180 mg/dL",     ideal: { M: [null, 130], F: [null, 145] }, unidade: "mg/dL" },
  { nome: "Apo B",                categoria: "Perfil Lipídico",        refTexto: "55–151 mg/dL",     ideal: { M: [null, 100], F: [null, 100] }, unidade: "mg/dL",
    interpretacao: { alto: "Pode indicar maior número de partículas aterogênicas e risco aumentado de aterosclerose." } },
  { nome: "Lp(a)",                categoria: "Perfil Lipídico",        refTexto: "< 30 mg/dL",       ideal: { M: [15, 17], F: [15, 17] }, unidade: "mg/dL",
    interpretacao: { alto: "Pode indicar risco genético aumentado para doença cardiovascular e eventos trombóticos." } },
  { nome: "Adiponectina",         categoria: "Perfil Lipídico",        refTexto: "1,5–25",            ideal: { M: [10, 15], F: [10, 15] }, unidade: "ng/mL",
    interpretacao: { baixo: "Pode indicar resistência à insulina e inflamação metabólica.", alto: "Pode indicar perfil metabólico mais favorável." } },

  // ── Avaliação Hormonal ───────────────────────────────────────
  { nome: "TSH",                  categoria: "Avaliação Hormonal",      refTexto: "0,3–4,2 mcUI/mL", ideal: { M: [1, 2], F: [1, 2.5] }, unidade: "mcUI/mL",
    interpretacao: { baixo: "Pode indicar alteração tireoidiana; observar sintomas como ansiedade, perda de peso.", alto: "Pode indicar alteração tireoidiana; observar sintomas como cansaço, ganho de peso." } },
  { nome: "T4 livre",             categoria: "Avaliação Hormonal",      refTexto: "0,7–1,9 ng/dL",   ideal: { M: [null, 1.4], F: [null, 1.4] }, unidade: "ng/dL",
    interpretacao: { baixo: "Pode indicar alteração na função tireoidiana; monitorar fadiga e sonolência.", alto: "Pode indicar alteração tireoidiana; monitorar nervosismo e palpitações." } },
  { nome: "T3 livre",             categoria: "Avaliação Hormonal",      refTexto: "2,5–3,9 pg/mL",   ideal: { M: [3, 3.4], F: [3, 3.4] }, unidade: "pg/mL" },
  { nome: "T3 reverso",           categoria: "Avaliação Hormonal",      refTexto: "0,1–0,35 ng/mL",  ideal: { M: [0.1, 0.2], F: [0.1, 0.2] }, unidade: "ng/mL" },
  { nome: "ANTI-TPO",             categoria: "Avaliação Hormonal",      refTexto: "< 34 U/mL",       ideal: { M: [null, 34], F: [null, 34] }, unidade: "U/mL" },
  { nome: "Leptina",              categoria: "Avaliação Hormonal",      refTexto: "1–9 / 1–27 ng/ml",ideal: { M: [4, 6], F: [4, 6] }, unidade: "ng/mL",
    interpretacao: { alto: "Pode indicar resistência à leptina associada à obesidade e inflamação.", baixo: "Pode indicar baixo tecido adiposo ou balanço energético negativo." } },
  { nome: "Testosterona Total",   categoria: "Avaliação Hormonal",      refTexto: "300–1200 / 15–70", ideal: { M: [500, 900], F: [50, 70] }, unidade: "ng/dL" },
  { nome: "Testosterona Livre",   categoria: "Avaliação Hormonal",      refTexto: "5–25 / 1–8 pg/mL",ideal: { M: [6, 8], F: [5, 7] }, unidade: "pg/mL" },
  { nome: "Estradiol",            categoria: "Avaliação Hormonal",      refTexto: "10–60 / 30–400",   ideal: { M: [30, 50], F: [150, 350] }, unidade: "pg/mL" },
  { nome: "SHBG",                 categoria: "Avaliação Hormonal",      refTexto: "16,5–55,9 nMol/L", ideal: { M: [20, 40], F: [40, 60] }, unidade: "nMol/L" },
  { nome: "LH",                   categoria: "Avaliação Hormonal",      refTexto: "1,5–9,3 mUI/mL",  ideal: { M: [3, 6], F: [5, 15] }, unidade: "mUI/mL" },
  { nome: "FSH",                  categoria: "Avaliação Hormonal",      refTexto: "1,4–18,1 mUI/mL", ideal: { M: [3, 6], F: [3, 8] }, unidade: "mUI/mL" },
  { nome: "Prolactina",           categoria: "Avaliação Hormonal",      refTexto: "2,1–30",           ideal: { M: [null, 20], F: [null, 20] }, unidade: "ng/mL" },
  { nome: "DHEA",                 categoria: "Avaliação Hormonal",      refTexto: "31–701 / 65–380",  ideal: { M: [350, 500], F: [200, 300] }, unidade: "µg/dL" },
  { nome: "Cortisol sérico (manhã)", categoria: "Avaliação Hormonal",   refTexto: "5–20 mg/dL",      ideal: { M: [10, 20], F: [10, 20] }, unidade: "mg/dL" },
  { nome: "Somatomedina C (IGF-1)", categoria: "Avaliação Hormonal",   refTexto: "115–307 ng/mL",    ideal: { M: [200, 300], F: [200, 300] }, unidade: "ng/mL",
    interpretacao: { baixo: "Pode indicar baixa sinalização anabólica, desnutrição ou deficiência hormonal.", alto: "Pode indicar hiperinsulinemia; em elevações marcantes, pode indicar acromegalia." } },

  // ── Avaliação Metabólica ─────────────────────────────────────
  { nome: "Glicose",              categoria: "Avaliação Metabólica",    refTexto: "70–110 mg/dL",     ideal: { M: [75, 90], F: [75, 90] }, unidade: "mg/dL",
    interpretacao: { baixo: "Pode indicar hipoglicemia; fracionar refeições e monitorar sintomas.", alto: "Pode sugerir alteração do metabolismo; reduzir açúcar, praticar atividade física." } },
  { nome: "Insulina",             categoria: "Avaliação Metabólica",    refTexto: "5–25 mcUI/mL",     ideal: { M: [null, 6], F: [null, 6] }, unidade: "mcUI/mL" },
  { nome: "HOMA-IR",             categoria: "Avaliação Metabólica",    refTexto: "< 4",               ideal: { M: [null, 1.3], F: [null, 1.3] },
    interpretacao: { alto: "Pode indicar resistência à insulina e hiperinsulinemia, com risco cardiometabólico.", baixo: "Pode indicar boa sensibilidade à insulina." } },
  { nome: "Hemoglobina Glicada",  categoria: "Avaliação Metabólica",    refTexto: "4,7–8,5%",         ideal: { M: [null, 5], F: [null, 5] }, unidade: "%",
    interpretacao: { alto: "Sugere controle glicêmico inadequado; rever dieta, aumentar atividade física." } },
  { nome: "Peptídeo C",           categoria: "Avaliação Metabólica",    refTexto: "0,9–3,3 ng/mL",    ideal: { M: [1.5, 2], F: [1.5, 2] }, unidade: "ng/mL",
    interpretacao: { baixo: "Pode indicar baixa reserva das células beta e risco de hiperglicemia.", alto: "Pode indicar hiperinsulinemia por resistência à insulina." } },

  // ── Avaliação Hepática ───────────────────────────────────────
  { nome: "TGO",                  categoria: "Avaliação Hepática",      refTexto: "< 35 U/L",         ideal: { M: [15, 25], F: [15, 25] }, unidade: "U/L" },
  { nome: "TGP",                  categoria: "Avaliação Hepática",      refTexto: "< 35 U/L",         ideal: { M: [15, 25], F: [15, 25] }, unidade: "U/L",
    interpretacao: { alto: "Pode indicar lesão hepática; evitar álcool, revisar medicamentos e suplementos." } },
  { nome: "Gama GT",              categoria: "Avaliação Hepática",      refTexto: "8–78 U/L",         ideal: { M: [null, 16], F: [null, 16] }, unidade: "U/L",
    interpretacao: { alto: "Pode indicar alteração hepática ou uso excessivo de álcool." } },
  { nome: "PCR",                  categoria: "Avaliação Hepática",      refTexto: "< 2 mg/L",         ideal: { M: [null, 1], F: [null, 1] }, unidade: "mg/L",
    interpretacao: { alto: "Indica processo inflamatório agudo; identificar possíveis focos de inflamação." } },
  { nome: "PCR ultrassensível",   categoria: "Avaliação Hepática",      refTexto: "< 0,5 mg/L",       ideal: { M: [null, 0.5], F: [null, 0.5] }, unidade: "mg/L" },
  { nome: "Bilirrubina Total",    categoria: "Avaliação Hepática",      refTexto: "0,1–1 mg/dL",      ideal: { M: [null, 1.2], F: [null, 1.2] }, unidade: "mg/dL" },
  { nome: "Fosfatase Alcalina",   categoria: "Avaliação Hepática",      refTexto: "13–130 U/L",       ideal: { M: [null, 80], F: [null, 80] }, unidade: "U/L" },
  { nome: "Albumina",             categoria: "Avaliação Hepática",      refTexto: "3,5–5,4 g/dL",     ideal: { M: [35, 55], F: [35, 55] }, unidade: "g/dL",
    interpretacao: { baixo: "Pode indicar desnutrição ou problemas hepáticos; melhorar ingestão de proteínas." } },

  // ── Avaliação Nutricional ────────────────────────────────────
  { nome: "Vitamina A (Retinol)", categoria: "Avaliação Nutricional",   refTexto: "0,3–0,7 mg/L",    ideal: { M: [null, 0.5], F: [null, 0.5] }, unidade: "mg/L" },
  { nome: "Vitamina B12",         categoria: "Avaliação Nutricional",   refTexto: "300–900 ng/L",     ideal: { M: [500, 1200], F: [500, 1200] }, unidade: "ng/L",
    interpretacao: { baixo: "Pode causar anemia ou perda de memória; ajustar dieta, avaliar suplementação." } },
  { nome: "Ácido Fólico (B9)",    categoria: "Avaliação Nutricional",   refTexto: "> 5 ng/mL",       ideal: { M: [12, 17], F: [12, 17] }, unidade: "ng/mL" },
  { nome: "Vitamina C",           categoria: "Avaliação Nutricional",   refTexto: "0,4–1,5 mg/L",    ideal: { M: [1.4, 1.9], F: [1.4, 1.9] }, unidade: "mg/L" },
  { nome: "Vitamina D (25OHD3)",  categoria: "Avaliação Nutricional",   refTexto: "20–60 ng/mL",     ideal: { M: [50, 150], F: [50, 150] }, unidade: "ng/mL",
    interpretacao: { baixo: "Pode causar deficiência óssea ou imunológica; aumentar exposição solar, considerar suplementação." } },
  { nome: "Magnésio",             categoria: "Avaliação Nutricional",   refTexto: "1,5–2,3 mg/dL",   ideal: { M: [2, 2.2], F: [2, 2.2] }, unidade: "mg/dL" },
  { nome: "Zinco sérico",         categoria: "Avaliação Nutricional",   refTexto: "66–110 mcg/dL",   ideal: { M: [96, 115], F: [96, 115] }, unidade: "mcg/dL" },
  { nome: "Selênio",              categoria: "Avaliação Nutricional",   refTexto: "20–190 µg/L",      ideal: { M: [120, 180], F: [120, 180] }, unidade: "µg/L" },
  { nome: "Cálcio Sérico",        categoria: "Avaliação Nutricional",   refTexto: "9–10,5 mg/dL",    ideal: { M: [9.3, 10.2], F: [9.3, 10.2] }, unidade: "mg/dL",
    interpretacao: { baixo: "Pode causar fraqueza muscular ou óssea; aumentar ingestão de cálcio.", alto: "Pode indicar distúrbio hormonal ou doença óssea." } },
  { nome: "Potássio",             categoria: "Avaliação Nutricional",   refTexto: "3,5–5 mEq/L",     ideal: { M: [null, 4], F: [null, 4] }, unidade: "mEq/L",
    interpretacao: { baixo: "Pode causar sintomas musculares; ajustar dieta com alimentos ricos em potássio.", alto: "Pode indicar alteração renal ou uso de medicamentos." } },
  { nome: "Sódio",                categoria: "Avaliação Nutricional",   refTexto: "136–145 mEq/L",   ideal: { M: [null, 140], F: [null, 140] }, unidade: "mEq/L",
    interpretacao: { baixo: "Pode indicar distúrbio eletrolítico; aumentar ingestão de líquidos.", alto: "Pode indicar desidratação; aumentar consumo de água." } },

  // ── Avaliação Renal ──────────────────────────────────────────
  { nome: "Creatinina (soro)",    categoria: "Avaliação Renal",        refTexto: "0,7–1,3 mg/dL",   ideal: { M: [0.8, 1.2], F: [0.8, 1.2] }, unidade: "mg/dL",
    interpretacao: { alto: "Pode sugerir alteração renal; aumentar hidratação e monitorar consumo de proteínas." } },
  { nome: "Ureia",                categoria: "Avaliação Renal",        refTexto: "25–45 mg/dL",      ideal: { M: [35, 45], F: [35, 45] }, unidade: "mg/dL",
    interpretacao: { alto: "Pode indicar disfunção renal ou desidratação; aumentar hidratação.", baixo: "Pode indicar dieta pobre em proteínas ou alterações hepáticas." } },
  { nome: "Ácido Úrico",          categoria: "Avaliação Renal",        refTexto: "2,5–8 mg/dL",      ideal: { M: [null, 3.9], F: [null, 3.9] }, unidade: "mg/dL",
    interpretacao: { alto: "Pode causar gota ou problemas renais; reduzir consumo de carnes e bebidas alcoólicas." } },

  // ── Avaliação Cardíaca ───────────────────────────────────────
  { nome: "D-Dímero",             categoria: "Avaliação Cardíaca",     refTexto: "< 500 ng/mL",      ideal: { M: [null, 200], F: [null, 200] }, unidade: "ng/mL" },
  { nome: "Aldosterona",          categoria: "Avaliação Cardíaca",     refTexto: "< 28 ng/dL",       ideal: { M: [6, 15], F: [6, 15] }, unidade: "ng/dL" },
  { nome: "Renina",               categoria: "Avaliação Cardíaca",     refTexto: "0,2–3,3 ng/mL",    ideal: { M: [1.5, 2], F: [1.5, 2] }, unidade: "ng/mL" },
];

// ─── Utilitários ──────────────────────────────────────────────

/** Classifica um valor como 'baixo' | 'normal' | 'alto' baseado no gênero */
export function classificar(nome, valor, genero = "M") {
  const b = BIOMARCADORES.find((m) => m.nome === nome);
  if (!b || valor == null || valor === "") return null;
  const v = parseFloat(String(valor).replace(",", "."));
  if (isNaN(v)) return null;
  const faixa = b.ideal[genero] || b.ideal["M"];
  if (!faixa) return null;
  const [min, max] = faixa;
  if (max !== null && v > max) return "alto";
  if (min !== null && v < min) return "baixo";
  return "normal";
}

/** Retorna interpretação textual para um resultado */
export function getInterpretacao(nome, classificacao) {
  const b = BIOMARCADORES.find((m) => m.nome === nome);
  if (!b || !classificacao || !b.interpretacao) return null;
  return b.interpretacao[classificacao] || null;
}

/** Retorna todos os biomarcadores de uma categoria */
export function getBiomarcadoresPorCategoria(categoria) {
  return BIOMARCADORES.filter((b) => b.categoria === categoria);
}

/** Mapa nome → biomarcador para lookup rápido */
export const BIOMARCADOR_MAP = Object.fromEntries(BIOMARCADORES.map((b) => [b.nome, b]));
