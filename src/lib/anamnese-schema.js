// src/lib/anamnese-schema.js
// Ficha de anamnese — AUDITADA para protocolo de emagrecimento (GLP-1 / tirzepatida).
// Removidas seções de medicina integrativa que não agregam ao nicho e desvalorizam
// o produto: Toxinas/Exposição Ambiental, Nutrição Funcional, Imunológico,
// Saúde Mitocondrial, Exames de Imagem. Mantido o núcleo clínico relevante.
//
// Campo:
//   k           → chave no objeto de dados
//   label       → rótulo exibido
//   tipo        → "text" | "textarea" | "select" | "decimal" | "inteiro" | "data" | "tel"
//   opts        → opções (apenas para select)
//   obrigatorio → true se precisa ser preenchido para criar o paciente
//   digitos/decimais → controle de máscara para tipo "decimal"
//   max         → limite para tipo "inteiro"
//   unidade     → sufixo informativo (cm, kg, °C…)
//   destacaPaciente → campo usado para criar/identificar o paciente
//   sexo        → restringe a seção a um sexo ("Feminino")
//
// Reutilizado pela tela (Anamnese.jsx) e pelo gerador de PDF (pdf-clinico.js).

export const SECOES_ANAMNESE = [
  {
    id: "dados",
    titulo: "Dados Pessoais",
    campos: [
      { k: "nomeCompleto", label: "Nome completo", tipo: "text", obrigatorio: true, destacaPaciente: true },
      { k: "dataNascimento", label: "Data de nascimento", tipo: "data" },
      { k: "idade", label: "Idade", tipo: "inteiro", max: 120, unidade: "anos", obrigatorio: true, destacaPaciente: true },
      { k: "sexo", label: "Sexo", tipo: "select", opts: ["Feminino", "Masculino"], obrigatorio: true, destacaPaciente: true },
      { k: "telefone", label: "Telefone", tipo: "tel" },
      { k: "email", label: "E-mail", tipo: "text" },
    ],
  },
  {
    id: "fisico",
    titulo: "Sinais Físicos e Vitais",
    campos: [
      { k: "peso", label: "Peso", tipo: "decimal", digitos: 4, decimais: 1, unidade: "kg", obrigatorio: true },
      { k: "altura", label: "Altura", tipo: "inteiro", max: 250, unidade: "cm", obrigatorio: true },
      { k: "circAbdominal", label: "Circunferência abdominal", tipo: "decimal", digitos: 4, decimais: 1, unidade: "cm" },
      { k: "pressaoArterial", label: "Pressão arterial", tipo: "text", placeholder: "Ex: 120/80 mmHg" },
      { k: "frequenciaCardiaca", label: "Frequência cardíaca", tipo: "inteiro", max: 250, unidade: "bpm" },
      { k: "temperatura", label: "Temperatura corporal", tipo: "decimal", digitos: 3, decimais: 1, unidade: "°C" },
    ],
  },
  {
    id: "queixa",
    titulo: "Objetivo e Queixa",
    campos: [
      { k: "queixaPrincipal", label: "Objetivo principal / queixa", tipo: "textarea", obrigatorio: true, placeholder: "Ex: emagrecimento, perder gordura visceral, controle glicêmico…" },
      { k: "tentativasAnteriores", label: "Tentativas anteriores de emagrecimento", tipo: "textarea", placeholder: "Dietas, medicações, cirurgias prévias…" },
      { k: "pesoMaximo", label: "Maior peso que já teve", tipo: "decimal", digitos: 4, decimais: 1, unidade: "kg" },
      { k: "expectativas", label: "Expectativas do tratamento", tipo: "textarea" },
    ],
  },
  {
    id: "historico",
    titulo: "Histórico de Saúde",
    campos: [
      { k: "comorbidades", label: "Comorbidades (diabetes, hipertensão, tireoide…)", tipo: "textarea" },
      { k: "cirurgiasAnteriores", label: "Cirurgias anteriores", tipo: "textarea" },
      { k: "alergias", label: "Alergias", tipo: "text" },
      { k: "historicoFamiliar", label: "Histórico familiar (obesidade, diabetes, cardíaco)", tipo: "textarea" },
      { k: "medicamentoEmUso", label: "Medicamentos em uso contínuo", tipo: "textarea" },
    ],
  },
  {
    id: "feminino",
    titulo: "Saúde Feminina",
    sexo: "Feminino",
    campos: [
      { k: "menstruacao", label: "Menstruação (ciclo / regularidade)", tipo: "text" },
      { k: "gestacoes", label: "Gestações / partos", tipo: "text" },
      { k: "metodoContraceptivo", label: "Método contraceptivo", tipo: "text" },
      { k: "menopausa", label: "Menopausa", tipo: "select", opts: ["Não", "Pré", "Sim"] },
    ],
  },
  {
    id: "habitos",
    titulo: "Hábitos de Vida",
    campos: [
      { k: "atividadeFisica", label: "Atividade física (tipo / frequência)", tipo: "textarea" },
      { k: "rotinaSono", label: "Rotina e qualidade do sono", tipo: "text" },
      { k: "tabagismo", label: "Tabagismo", tipo: "select", opts: ["Não", "Sim", "Ex-fumante"] },
      { k: "consumoAlcool", label: "Consumo de álcool", tipo: "select", opts: ["Não", "Social", "Frequente", "Diário"] },
      { k: "nivelEstresse", label: "Nível de estresse", tipo: "select", opts: ["Baixo", "Moderado", "Alto"] },
    ],
  },
  {
    id: "alimentar",
    titulo: "Histórico Alimentar",
    campos: [
      { k: "padraoAlimentar", label: "Padrão alimentar atual", tipo: "textarea", placeholder: "Número de refeições, horários, comportamento…" },
      { k: "compulsaoAlimentar", label: "Compulsão / beliscar fora de hora", tipo: "select", opts: ["Não", "Às vezes", "Frequente"] },
      { k: "intoleranciaAlimentar", label: "Intolerâncias / restrições alimentares", tipo: "text" },
      { k: "hidratacao", label: "Hidratação (água por dia)", tipo: "text", placeholder: "Ex: 2 litros" },
      { k: "alimentosProcessados", label: "Consumo de ultraprocessados", tipo: "select", opts: ["Baixo", "Moderado", "Alto"] },
    ],
  },
  {
    id: "hormonal",
    titulo: "Saúde Hormonal e Metabólica",
    campos: [
      { k: "tireoide", label: "Tireoide (alteração / medicação)", tipo: "text" },
      { k: "resistenciaInsulina", label: "Resistência à insulina / pré-diabetes", tipo: "select", opts: ["Não", "Suspeita", "Sim"] },
      { k: "sintomasHormonais", label: "Sintomas de desequilíbrio hormonal", tipo: "textarea" },
    ],
  },
  {
    id: "psicologica",
    titulo: "Saúde Psicológica",
    campos: [
      { k: "estadoEmocional", label: "Estado emocional", tipo: "select", opts: ["Estável", "Ansioso", "Deprimido", "Oscilante"] },
      { k: "ansiedadeDepressao", label: "Ansiedade / depressão", tipo: "select", opts: ["Não", "Leve", "Moderado", "Intenso"] },
      { k: "relacaoComida", label: "Relação com a comida (emocional)", tipo: "textarea" },
      { k: "acompanhamentoPsi", label: "Acompanhamento psicológico/psiquiátrico", tipo: "text" },
    ],
  },
  {
    id: "adicionais",
    titulo: "Observações Adicionais",
    campos: [
      { k: "observacoesImportantes", label: "Observações importantes", tipo: "textarea" },
    ],
  },
];

// Campos usados ao criar paciente a partir da anamnese.
// altura no schema é em CM (inteiro) → convertida para METROS no paciente.
export function anamneseParaPaciente(dados) {
  const alturaCm = dados.altura ? Number(String(dados.altura).replace(",", ".")) : null;
  const alturaM = alturaCm ? +(alturaCm / 100).toFixed(2) : null;
  const pesoNum = dados.peso ? Number(String(dados.peso).replace(",", ".")) : null;
  return {
    nome: dados.nomeCompleto || "",
    idade: dados.idade ? Number(dados.idade) : null,
    sexo: dados.sexo || "Feminino",
    altura: alturaM,
    telefone: dados.telefone || "",
    email: dados.email || "",
    objetivo: dados.queixaPrincipal || "",
    comorbidades: dados.comorbidades || dados.historicoFamiliar || "Nenhuma relatada",
    pesoInicial: pesoNum,
    inicio: new Date().toISOString().slice(0, 10),
  };
}

// Lista de campos obrigatórios faltando, respeitando lógica de sexo.
export function camposObrigatoriosFaltando(dados) {
  const faltando = [];
  for (const secao of SECOES_ANAMNESE) {
    if (secao.sexo && dados.sexo !== secao.sexo) continue;
    for (const c of secao.campos) {
      if (c.obrigatorio && (!dados[c.k] || String(dados[c.k]).trim() === "")) {
        faltando.push(c.label);
      }
    }
  }
  return faltando;
}
