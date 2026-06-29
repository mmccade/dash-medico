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

// Dias desde o último ciclo registrado (usa campo data do ciclo ou data de início do paciente).
export const diasSemCiclo = (p) => {
  if (!p.ciclos?.length) return null;
  const u = ultimoCiclo(p);
  const iso = u.data || p.inicio;
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso + "T12:00:00")) / 86400000);
};

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

// ─── Metas mensais ───────────────────────────────────────────
// metasMensais: array [{ mes: "Jun/26", peso: 85.0 }]
// Retorna a meta do mês de um ciclo (busca por c.mes exato, ou null).
export const metaDoMes = (p, ciclo) => {
  if (!ciclo?.mes || !p.metasMensais?.length) return null;
  const m = p.metasMensais.find((x) => x.mes === ciclo.mes);
  return m ? m.peso : null;
};

// Delta entre peso atual do ciclo e a meta do mês (positivo = acima da meta = ruim).
export const deltaMetaMes = (p, ciclo) => {
  const meta = metaDoMes(p, ciclo);
  if (meta == null || ciclo.peso == null) return null;
  return +(Number(ciclo.peso) - meta).toFixed(1);
};

// Progresso percentual em direção à meta final (0-100).
// 0% = peso inicial, 100% = meta atingida.
export const progressoMetaFinal = (p) => {
  const pesoInicial = primeiroCiclo(p)?.peso;
  const pesoAtual   = ultimoCiclo(p)?.peso;
  const meta        = p.pesoMeta; // mantém compatibilidade com campo existente
  if (!pesoInicial || !pesoAtual || !meta) return null;
  if (pesoInicial <= meta) return 100; // já estava na meta
  const total = pesoInicial - meta;
  const feito = pesoInicial - pesoAtual;
  return Math.min(100, Math.max(0, Math.round((feito / total) * 100)));
};

// ─── Timeline do paciente ─────────────────────────────────────
// Gera array de eventos { data, tipo, descricao } a partir dos dados do paciente.
// Tipos: "inicio" | "ciclo" | "meta" | "exame" | "anamnese"
export const gerarTimeline = (p, exames = []) => {
  const eventos = [];
  const fmt = (iso) => { try { return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }); } catch { return iso; } };

  // Primeira consulta
  if (p.inicio) eventos.push({ data: p.inicio, tipo: "inicio", desc: "Primeira consulta" });

  // Ciclos
  (p.ciclos || []).forEach((c, i) => {
    if (!c.data && !c.mes) return;
    const iso = c.data || p.inicio;
    const perdaStr = i > 0 && c.peso != null && p.ciclos[i - 1]?.peso != null
      ? ` · ${+(p.ciclos[i - 1].peso - c.peso).toFixed(1) > 0 ? "-" : "+"}${Math.abs(+(p.ciclos[i - 1].peso - c.peso).toFixed(1))} kg`
      : (c.peso ? ` · ${br(c.peso)} kg` : "");
    eventos.push({ data: iso, tipo: "ciclo", desc: `${c.mes || `Ciclo ${i + 1}`}${perdaStr}` });

    // Meta batida nesse ciclo?
    if (p.pesoMeta && c.peso != null && c.peso <= p.pesoMeta) {
      eventos.push({ data: iso, tipo: "meta", desc: `Meta de ${br(p.pesoMeta)} kg atingida 🏆` });
    }
  });

  // Exames laboratoriais
  (exames || []).forEach((ex) => {
    if (ex.data) eventos.push({ data: ex.data, tipo: "exame", desc: `Exames enviados${ex.rotulo ? ` — ${ex.rotulo}` : ""}` });
  });

  return eventos.sort((a, b) => (a.data || "").localeCompare(b.data || ""));
};

// ─── Resumo inteligente do paciente (sem IA, calculado) ──────
export const gerarResumo = (p, exames = []) => {
  const frases = [];
  const nome1 = (p.nome || "Paciente").split(" ")[0];
  const u = p.ciclos?.length ? ultimoCiclo(p) : null;
  const prim = p.ciclos?.length ? primeiroCiclo(p) : null;

  // Início e IMC inicial
  if (prim?.peso && p.altura) {
    const imcI = imc(prim.peso, p.altura);
    frases.push(`${nome1} iniciou o tratamento com IMC ${br(imcI)}`);
  } else if (p.inicio) {
    frases.push(`${nome1} iniciou o tratamento em ${fmtData(p.inicio)}`);
  }

  // Perda de peso total
  if (p.ciclos?.length > 1 && prim?.peso && u?.peso) {
    const perda = +(prim.peso - u.peso).toFixed(1);
    if (perda > 0) frases.push(`já eliminou ${br(perda)} kg`);
    else if (perda < 0) frases.push(`registrou variação de +${br(Math.abs(perda))} kg`);
  }

  // Dias sem novo ciclo
  if (u?.data) {
    const diasSem = Math.floor((Date.now() - new Date(u.data + "T12:00:00")) / 86400000);
    if (diasSem > 14) frases.push(`está há ${diasSem} dias sem novo ciclo registrado`);
  }

  // Marcadores de exame que mudaram (delta último vs penúltimo exame)
  if (exames?.length >= 2) {
    const ult = exames[exames.length - 1];
    const ant = exames[exames.length - 2];
    const melhoraram = [], pioraram = [];
    (ult.marcadores || []).forEach((m) => {
      const mAnt = (ant.marcadores || []).find((x) => x.nome === m.nome);
      if (!mAnt || m.valor == null || mAnt.valor == null) return;
      const delta = m.valor - mAnt.valor;
      // marcadores onde subir é ruim
      const maisBaixoMelhor = ["Glicose", "HbA1c", "HOMA-IR", "Colesterol total", "LDL", "Triglicerídeos", "PCR", "TSH", "Insulina", "Peso"];
      if (maisBaixoMelhor.includes(m.nome)) {
        if (delta < 0) melhoraram.push(m.nome);
        else if (delta > 0) pioraram.push(m.nome);
      } else {
        if (delta > 0) melhoraram.push(m.nome);
        else if (delta < 0) pioraram.push(m.nome);
      }
    });
    if (melhoraram.length) frases.push(`${melhoraram.slice(0, 2).join(" e ")} melhoraram nos últimos exames`);
    if (pioraram.length) frases.push(`${pioraram.slice(0, 2).join(" e ")} pioraram — requer atenção`);
  }

  // Sugestão de ação
  if (u?.data) {
    const dias = Math.floor((Date.now() - new Date(u.data + "T12:00:00")) / 86400000);
    if (dias > 30) frases.push("sugere agendamento de retorno");
  }

  return frases.length ? frases.map((f, i) => i === 0 ? f.charAt(0).toUpperCase() + f.slice(1) : f).join(". ") + "." : null;
};
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
