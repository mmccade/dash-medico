// src/lib/dados.js — dados de exemplo (modo demo, antes do Firebase)
export const PACIENTES_DEMO = [
  { id: 1, nome: "Mariana Alves Costa", idade: 42, sexo: "Feminino", altura: 1.64, objetivo: "Emagrecimento e controle de resistência insulínica", comorbidades: "Pré-diabetes, esteatose hepática grau I", inicio: "2025-12-08", ativo: true, ciclos: [
    { mes: "Dez/25", peso: 94.2, gordura: 41.0, visceral: 13, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Casa", suplementacao: "Vit. D 7.000 UI/sem · B12 · Ômega-3", colaterais: "Náusea leve nos primeiros dias", obs: "Início de protocolo. Orientada quanto à hidratação." },
    { mes: "Jan/26", peso: 90.8, gordura: 39.4, visceral: 12, unidade: "MG", doses: [2.5, 2.5, 5, 5], local: "Casa", suplementacao: "Vit. D · B12 · Ômega-3 · Magnésio", colaterais: "Constipação ocasional", obs: "Titulação para 5mg na 3ª semana. Boa adesão." },
    { mes: "Fev/26", peso: 87.1, gordura: 37.8, visceral: 11, unidade: "MG", doses: [5, 5, 5, 5], local: "Casa", suplementacao: "Vit. D · B12 · Ômega-3 · Magnésio", colaterais: "Sem queixas relevantes", obs: "Manutenção em 5mg. Mais disposição." },
    { mes: "Mar/26", peso: 84.0, gordura: 36.1, visceral: 10, unidade: "MG", doses: [5, 5, 7.5, 7.5], local: "Casa", suplementacao: "Vit. D · B12 · Ômega-3 · Magnésio · Creatina", colaterais: "Náusea leve ao subir dose", obs: "Titulação para 7.5mg. Iniciada creatina." },
    { mes: "Abr/26", peso: 81.3, gordura: 34.7, visceral: 9, unidade: "MG", doses: [7.5, 7.5, 7.5, 7.5], local: "Casa", suplementacao: "Vit. D · B12 · Ômega-3 · Magnésio · Creatina", colaterais: "Boa tolerância", obs: "Evolução consistente. Reavaliação laboratorial agendada." },
  ] },
  { id: 2, nome: "Roberto Tavares Lima", idade: 51, sexo: "Masculino", altura: 1.78, objetivo: "Redução de peso e melhora do perfil glicêmico", comorbidades: "Diabetes tipo 2, hipertensão", inicio: "2026-01-15", ativo: true, ciclos: [
    { mes: "Jan/26", peso: 108.5, gordura: 34.2, visceral: 17, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Clínica", suplementacao: "Vit. D · Ômega-3", colaterais: "Náusea moderada", obs: "Início. Acompanhamento próximo pela comorbidade." },
    { mes: "Fev/26", peso: 104.1, gordura: 32.9, visceral: 16, unidade: "MG", doses: [2.5, 5, 5, 5], local: "Clínica", suplementacao: "Vit. D · Ômega-3 · Magnésio", colaterais: "Melhora da náusea", obs: "Glicemia em queda. Boa resposta." },
    { mes: "Mar/26", peso: 100.3, gordura: 31.5, visceral: 14, unidade: "MG", doses: [5, 5, 5, 5], local: "Clínica", suplementacao: "Vit. D · Ômega-3 · Magnésio", colaterais: "Sem queixas", obs: "Mantida dose. Paciente engajado." },
    { mes: "Abr/26", peso: 96.8, gordura: 30.1, visceral: 13, unidade: "MG", doses: [5, 5, 7.5, 7.5], local: "Clínica", suplementacao: "Vit. D · Ômega-3 · Magnésio · Creatina", colaterais: "Boa tolerância", obs: "Titulação para 7.5mg. Excelente evolução metabólica." },
  ] },
  { id: 3, nome: "Patrícia Nunes Ferreira", idade: 38, sexo: "Feminino", altura: 1.59, objetivo: "Emagrecimento estético e composição corporal", comorbidades: "Nenhuma relatada", inicio: "2026-02-01", ativo: true, ciclos: [
    { mes: "Fev/26", peso: 78.4, gordura: 38.0, visceral: 9, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Casa", suplementacao: "Vit. D · Colágeno", colaterais: "Leve náusea", obs: "Início. Foco em preservar massa magra." },
    { mes: "Mar/26", peso: 75.1, gordura: 36.4, visceral: 8, unidade: "MG", doses: [2.5, 2.5, 5, 5], local: "Casa", suplementacao: "Vit. D · Colágeno · Creatina", colaterais: "Boa tolerância", obs: "Titulação para 5mg. Treino de força orientado." },
    { mes: "Abr/26", peso: 72.6, gordura: 34.9, visceral: 8, unidade: "MG", doses: [5, 5, 5, 5], local: "Casa", suplementacao: "Vit. D · Colágeno · Creatina", colaterais: "Sem queixas", obs: "Composição corporal melhorando bem." },
  ] },
  { id: 4, nome: "Carlos Eduardo Pinto", idade: 47, sexo: "Masculino", altura: 1.72, objetivo: "Redução de gordura visceral", comorbidades: "Dislipidemia", inicio: "2026-03-10", ativo: true, ciclos: [
    { mes: "Mar/26", peso: 98.2, gordura: 33.5, visceral: 15, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Casa", suplementacao: "Ômega-3 · Vit. D", colaterais: "Náusea leve", obs: "Início de protocolo." },
    { mes: "Abr/26", peso: 94.6, gordura: 32.1, visceral: 14, unidade: "MG", doses: [2.5, 2.5, 5, 5], local: "Casa", suplementacao: "Ômega-3 · Vit. D · Magnésio", colaterais: "Boa tolerância", obs: "Titulação para 5mg. Resposta inicial positiva." },
  ] },
  { id: 5, nome: "Juliana Reis Barbosa", idade: 34, sexo: "Feminino", altura: 1.67, objetivo: "Emagrecimento pós-gestacional", comorbidades: "Hipotireoidismo controlado", inicio: "2026-04-05", ativo: true, ciclos: [
    { mes: "Abr/26", peso: 82.7, gordura: 37.2, visceral: 10, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Casa", suplementacao: "Vit. D · B12 · Ferro", colaterais: "Náusea leve", obs: "Início. Atenção à reposição de ferro." },
  ] },
  { id: 6, nome: "Anderson Souza Melo", idade: 55, sexo: "Masculino", altura: 1.75, objetivo: "Controle de peso e longevidade", comorbidades: "Pré-diabetes", inicio: "2025-11-20", ativo: false, ciclos: [
    { mes: "Nov/25", peso: 101.0, gordura: 32.0, visceral: 16, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Clínica", suplementacao: "Vit. D · Ômega-3", colaterais: "Náusea", obs: "Início." },
    { mes: "Dez/25", peso: 97.5, gordura: 30.8, visceral: 15, unidade: "MG", doses: [2.5, 5, 5, 5], local: "Clínica", suplementacao: "Vit. D · Ômega-3", colaterais: "Sem queixas", obs: "Boa resposta. Pausou tratamento por viagem." },
  ] },
  { id: 7, nome: "Fernanda Castro Dias", idade: 45, sexo: "Feminino", altura: 1.61, objetivo: "Emagrecimento e resistência insulínica", comorbidades: "SOP", inicio: "2026-04-12", ativo: true, ciclos: [
    { mes: "Abr/26", peso: 88.9, gordura: 40.1, visceral: 11, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Casa", suplementacao: "Vit. D · Inositol · Ômega-3", colaterais: "Náusea leve", obs: "Início. Inositol para suporte ao perfil de SOP." },
  ] },
  { id: 8, nome: "Marcelo Antunes Rocha", idade: 39, sexo: "Masculino", altura: 1.80, objetivo: "Redução de peso e performance", comorbidades: "Nenhuma relatada", inicio: "2026-01-28", ativo: false, ciclos: [
    { mes: "Jan/26", peso: 105.3, gordura: 28.5, visceral: 14, unidade: "MG", doses: [2.5, 2.5, 2.5, 2.5], local: "Casa", suplementacao: "Creatina · Vit. D", colaterais: "Sem queixas", obs: "Início." },
    { mes: "Fev/26", peso: 101.0, gordura: 27.2, visceral: 13, unidade: "MG", doses: [2.5, 5, 5, 5], local: "Casa", suplementacao: "Creatina · Vit. D", colaterais: "Boa tolerância", obs: "Interrompeu por conta própria. Marcado retorno." },
  ] },
];

export const CONFIG_INICIAL = {
  clinica: "Clínica Vida Metabólica",
  medico: "Dra. Helena Marques",
  crm: "CRM-SP 123456",
  logo: null,
  murevNoPdf: true,
};
