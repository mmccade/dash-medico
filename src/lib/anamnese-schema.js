// src/lib/anamnese-schema.js
// Estrutura da ficha de anamnese — baseada na aba INICIAL da planilha clínica.
// Reutilizado pela tela (Anamnese.jsx) e pelo gerador de PDF (pdf-clinico.js).
//
// tipo: "text" | "textarea" | "select" | "number"
// "destacaPaciente: true" → campos usados para criar/identificar o paciente

export const SECOES_ANAMNESE = [
  {
    id: "dados",
    titulo: "Dados Pessoais",
    campos: [
      { k: "nomeCompleto", label: "Nome completo", tipo: "text", destacaPaciente: true },
      { k: "dataNascimento", label: "Data de nascimento", tipo: "text" },
      { k: "idade", label: "Idade", tipo: "number", destacaPaciente: true },
      { k: "sexo", label: "Sexo", tipo: "select", opts: ["Feminino", "Masculino"], destacaPaciente: true },
      { k: "telefone", label: "Telefone", tipo: "text" },
      { k: "email", label: "E-mail", tipo: "text" },
      { k: "estadoCivil", label: "Estado civil", tipo: "text" },
      { k: "profissao", label: "Profissão", tipo: "text" },
      { k: "endereco", label: "Endereço", tipo: "text" },
    ],
  },
  {
    id: "fisico",
    titulo: "Sinais Físicos e Vitais",
    campos: [
      { k: "peso", label: "Peso (kg)", tipo: "number" },
      { k: "altura", label: "Altura (m)", tipo: "number" },
      { k: "pressaoArterial", label: "Pressão arterial", tipo: "text" },
      { k: "frequenciaCardiaca", label: "Frequência cardíaca", tipo: "text" },
      { k: "frequenciaRespiratoria", label: "Frequência respiratória", tipo: "text" },
      { k: "temperatura", label: "Temperatura corporal", tipo: "text" },
      { k: "exameFisicoGeral", label: "Exame físico geral", tipo: "textarea" },
    ],
  },
  {
    id: "queixa",
    titulo: "Queixa",
    campos: [
      { k: "queixaPrincipal", label: "Queixa principal", tipo: "textarea" },
      { k: "inicioSintomas", label: "Início dos sintomas", tipo: "text" },
      { k: "fatoresMelhoraPiora", label: "Fatores para melhora / piora", tipo: "textarea" },
      { k: "evolucaoSintomas", label: "Evolução dos sintomas", tipo: "textarea" },
      { k: "tratamentosAnteriores", label: "Tratamentos anteriores", tipo: "textarea" },
    ],
  },
  {
    id: "historico",
    titulo: "Histórico",
    campos: [
      { k: "cirurgiasAnteriores", label: "Cirurgias anteriores", tipo: "textarea" },
      { k: "alergias", label: "Alergias", tipo: "text" },
      { k: "historicoFamiliar", label: "Histórico familiar (doenças)", tipo: "textarea" },
      { k: "hospitalizacoes", label: "Hospitalizações", tipo: "textarea" },
      { k: "vacinacao", label: "Vacinação", tipo: "text" },
      { k: "medicamentoEmUso", label: "Medicamento em uso", tipo: "textarea" },
    ],
  },
  {
    id: "feminino",
    titulo: "Saúde Feminina",
    campos: [
      { k: "menstruacao", label: "Menstruação (ciclo / regularidade)", tipo: "text" },
      { k: "gestacoes", label: "Gestações / partos", tipo: "text" },
      { k: "metodoContraceptivo", label: "Método contraceptivo", tipo: "text" },
      { k: "menopausa", label: "Menopausa", tipo: "select", opts: ["Não", "Pré", "Sim", "Não se aplica"] },
    ],
  },
  {
    id: "habitos",
    titulo: "Hábitos de Vida",
    campos: [
      { k: "alimentacaoHabito", label: "Alimentação", tipo: "textarea" },
      { k: "atividadeFisica", label: "Atividade física", tipo: "textarea" },
      { k: "tabagismo", label: "Tabagismo", tipo: "select", opts: ["Não", "Sim", "Ex-fumante"] },
      { k: "conexaoSocial", label: "Conexão social e suporte comunitário", tipo: "textarea" },
      { k: "consumoAlcool", label: "Consumo de álcool", tipo: "select", opts: ["Não", "Social", "Frequente", "Diário"] },
      { k: "usoDrogas", label: "Uso de drogas", tipo: "text" },
      { k: "rotinaSono", label: "Rotina de sono", tipo: "textarea" },
      { k: "saudeEspiritual", label: "Autoavaliação de saúde espiritual", tipo: "text" },
      { k: "religiosidadeMeditacao", label: "Religiosidade e meditação", tipo: "text" },
      { k: "impactoTrabalho", label: "Impacto do trabalho e relacionamentos na saúde", tipo: "textarea" },
      { k: "estresseSaudeMental", label: "Estresse e saúde mental", tipo: "textarea" },
    ],
  },
  {
    id: "alimentar",
    titulo: "Histórico Alimentar",
    campos: [
      { k: "intoleranciaAlimentar", label: "Intolerâncias e sensibilidades alimentares", tipo: "textarea" },
      { k: "frequenciaRefeicoes", label: "Frequência de refeições", tipo: "text" },
      { k: "hidratacao", label: "Hidratação", tipo: "text" },
      { k: "alimentosProcessados", label: "Consumo de alimentos processados", tipo: "select", opts: ["Baixo", "Moderado", "Alto"] },
      { k: "suplementosNutricionais", label: "Consumo de suplementos nutricionais", tipo: "textarea" },
    ],
  },
  {
    id: "psicologica",
    titulo: "Saúde Psicológica",
    campos: [
      { k: "estadoEmocional", label: "Estado emocional", tipo: "select", opts: ["Estável", "Ansioso", "Deprimido", "Irritado", "Oscilante"] },
      { k: "estresseMental", label: "Estresse e saúde mental", tipo: "textarea" },
      { k: "historicoPsicologico", label: "Histórico de tratamento psicológico/psiquiátrico", tipo: "textarea" },
      { k: "ansiedadeDepressao", label: "Sintomas de ansiedade / depressão", tipo: "select", opts: ["Não", "Leve", "Moderado", "Intenso"] },
    ],
  },
  {
    id: "toxinas",
    titulo: "Toxinas e Exposição Ambiental",
    campos: [
      { k: "metaisPesados", label: "Exposição a metais pesados", tipo: "text" },
      { k: "produtosHigiene", label: "Uso de produtos de higiene (composição química)", tipo: "textarea" },
      { k: "agrotoxicosPoluentes", label: "Exposição a agrotóxicos e poluentes", tipo: "textarea" },
      { k: "exposicaoOcupacional", label: "Histórico de exposição ocupacional a tóxicos", tipo: "textarea" },
    ],
  },
  {
    id: "hormonal",
    titulo: "Saúde Hormonal",
    campos: [
      { k: "equilibrioHormonal", label: "Equilíbrio hormonal (cortisol, tireoide, sexuais)", tipo: "textarea" },
      { k: "eixoHPA", label: "Eixo Hipotálamo-Hipófise-Adrenal (HPA)", tipo: "textarea" },
      { k: "sintomasDesequilibrio", label: "Sintomas de desequilíbrio hormonal", tipo: "textarea" },
      { k: "impactoEstresseHormonios", label: "Impacto do estresse crônico nos hormônios", tipo: "textarea" },
    ],
  },
  {
    id: "nutricao",
    titulo: "Nutrição Funcional",
    campos: [
      { k: "metabolismoBasal", label: "Metabolismo basal e gasto energético", tipo: "text" },
      { k: "indiceInflamacao", label: "Índice de inflamação", tipo: "text" },
      { k: "microbiotaIntestinal", label: "Avaliação da microbiota intestinal", tipo: "textarea" },
      { k: "necessidadesNutricionais", label: "Necessidades nutricionais específicas (antioxidantes, ômega-3)", tipo: "textarea" },
    ],
  },
  {
    id: "imunologico",
    titulo: "Imunológico",
    campos: [
      { k: "infeccoesRecorrentes", label: "Histórico de infecções recorrentes", tipo: "textarea" },
      { k: "doencasAutoimunes", label: "Doenças autoimunes", tipo: "text" },
      { k: "inflamacaoCronica", label: "Sintomas de inflamação crônica", tipo: "textarea" },
      { k: "respostaInflamatoria", label: "Resposta inflamatória ao estresse", tipo: "textarea" },
    ],
  },
  {
    id: "mitocondrial",
    titulo: "Saúde Mitocondrial",
    campos: [
      { k: "energiaFadiga", label: "Níveis de energia e fadiga", tipo: "select", opts: ["Boa", "Regular", "Baixa", "Fadiga crônica"] },
      { k: "fadigaCronica", label: "Síndrome de fadiga crônica", tipo: "select", opts: ["Não", "Suspeita", "Sim"] },
      { k: "estresseOxidativo", label: "Estresse oxidativo", tipo: "text" },
      { k: "funcionalidadeMitocondrial", label: "Funcionalidade mitocondrial", tipo: "textarea" },
    ],
  },
  {
    id: "imagem",
    titulo: "Exames de Imagem",
    campos: [
      { k: "radiografias", label: "Radiografias", tipo: "textarea" },
      { k: "ultrassonografias", label: "Ultrassonografias", tipo: "textarea" },
      { k: "tomografias", label: "Tomografias computadorizadas", tipo: "textarea" },
      { k: "ressonancias", label: "Ressonâncias magnéticas", tipo: "textarea" },
    ],
  },
  {
    id: "adicionais",
    titulo: "Adicionais",
    campos: [
      { k: "comentariosGerais", label: "Comentários gerais", tipo: "textarea" },
      { k: "feedbackPaciente", label: "Feedback do paciente (geral)", tipo: "textarea" },
      { k: "observacoesImportantes", label: "Observações importantes", tipo: "textarea" },
    ],
  },
];

// Campos usados ao criar paciente a partir da anamnese
export function anamneseParaPaciente(dados) {
  return {
    nome: dados.nomeCompleto || "",
    idade: dados.idade ? Number(dados.idade) : null,
    sexo: dados.sexo || "Feminino",
    altura: dados.altura ? Number(String(dados.altura).replace(",", ".")) : null,
    objetivo: dados.queixaPrincipal || "",
    comorbidades: dados.historicoFamiliar || "Nenhuma relatada",
    inicio: new Date().toISOString().slice(0, 10),
  };
}
