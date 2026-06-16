// src/lib/validate.js
// Schema de validação leve (sem Zod, sem dependência extra).
// Sanitiza e valida os dados antes de qualquer addDoc/setDoc/updateDoc.
// Use: const { data, errors } = validatePaciente(rawFormData)
// Se errors.length > 0, não salve.

const STR_MAX = 300;   // limite geral de string
const OBJ_MAX = 1000;  // objetivo e comorbidades podem ser maiores
const NOME_MAX = 150;
const CRM_MAX  = 20;
const OBS_MAX  = 2000;

// Remove tags HTML e caracteres de controle
function sanitize(v) {
  if (typeof v !== "string") return String(v ?? "");
  return v
    .replace(/<[^>]*>/g, "")          // strip HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // control chars
    .trim();
}

function str(v, max = STR_MAX, required = false) {
  const s = sanitize(v);
  if (required && !s) return { value: s, error: "obrigatório" };
  if (s.length > max) return { value: s.slice(0, max), error: `máximo ${max} caracteres` };
  return { value: s, error: null };
}

function num(v, { min = 0, max = 9999, required = false } = {}) {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  if (required && isNaN(n)) return { value: 0, error: "obrigatório" };
  if (isNaN(n)) return { value: 0, error: null };
  if (n < min || n > max) return { value: n, error: `deve estar entre ${min} e ${max}` };
  return { value: n, error: null };
}

function int(v, { min = 0, max = 9999, required = false } = {}) {
  const n = parseInt(v);
  if (required && isNaN(n)) return { value: 0, error: "obrigatório" };
  if (isNaN(n)) return { value: 0, error: null };
  if (n < min || n > max) return { value: n, error: `deve estar entre ${min} e ${max}` };
  return { value: n, error: null };
}

function isoDate(v) {
  const s = sanitize(v);
  if (!s) return { value: "", error: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { value: s, error: "data inválida (use AAAA-MM-DD)" };
  const d = new Date(s);
  if (isNaN(d)) return { value: s, error: "data inválida" };
  return { value: s, error: null };
}

// ─── Paciente ────────────────────────────────────────────────
export function validatePaciente(raw) {
  const errors = [];
  const push = (campo, err) => { if (err) errors.push({ campo, err }); };

  const nome      = str(raw.nome, NOME_MAX, true);
  const sexo      = str(raw.sexo, 20);
  const objetivo  = str(raw.objetivo, OBJ_MAX);
  const comorbidades = str(raw.comorbidades, OBJ_MAX);
  const inicio    = isoDate(raw.inicio);
  const idadeR    = int(raw.idade, { min: 0, max: 130 });
  // altura pode vir em cm (100-250) ou metros (0.5-2.5) — converte para metros
  const alturaRaw = parseFloat(String(raw.altura ?? "").replace(",", "."));
  const alturaMetros = (!isNaN(alturaRaw) && alturaRaw >= 100) ? alturaRaw / 100 : alturaRaw;
  const alturaR   = num(alturaMetros, { min: 0.5, max: 2.5 });

  push("nome", nome.error);
  push("sexo", sexo.error);
  push("objetivo", objetivo.error);
  push("comorbidades", comorbidades.error);
  push("inicio", inicio.error);
  push("idade", idadeR.error);
  push("altura", alturaR.error);

  const SEXOS_VALIDOS = ["feminino", "masculino", "outro", "prefiro não informar"];
  if (sexo.value && !SEXOS_VALIDOS.includes(sexo.value.toLowerCase())) {
    // permite qualquer valor mas registra
  }

  return {
    errors,
    data: {
      nome: nome.value,
      sexo: sexo.value || "Feminino",
      objetivo: objetivo.value || "—",
      comorbidades: comorbidades.value || "Nenhuma relatada",
      inicio: inicio.value || new Date().toISOString().slice(0, 10),
      idade: idadeR.value,
      altura: alturaR.value || 1.7,
    },
  };
}

// ─── Ciclo ───────────────────────────────────────────────────
export function validateCiclo(raw) {
  const errors = [];
  const push = (campo, err) => { if (err) errors.push({ campo, err }); };

  const mes           = str(raw.mes, 20, true);
  const dataR         = isoDate(raw.data);   // campo opcional DD/MM/AAAA salvo como AAAA-MM-DD
  const pesoR         = num(raw.peso, { min: 20, max: 400, required: true });
  const gorduraR      = num(raw.gordura, { min: 0, max: 100 });
  const visceralR     = int(raw.visceral, { min: 0, max: 50 });
  const unidade       = str(raw.unidade, 5);
  const local         = str(raw.local, 100);
  const suplementacao = str(raw.suplementacao, OBS_MAX);
  const colaterais    = str(raw.colaterais, OBS_MAX);
  const obs           = str(raw.obs, OBS_MAX);

  push("mes", mes.error);
  push("data", dataR.error);
  push("peso", pesoR.error);
  push("gordura", gorduraR.error);
  push("visceral", visceralR.error);

  const doses = Array.isArray(raw.doses)
    ? raw.doses.map((d) => {
        const r = num(d, { min: 0, max: 100 });
        return r.value;
      })
    : [0, 0, 0, 0];

  return {
    errors,
    data: {
      mes: mes.value,
      data: dataR.value || "",
      peso: pesoR.value,
      gordura: gorduraR.value,
      visceral: visceralR.value,
      unidade: unidade.value || "MG",
      doses,
      local: local.value || "Casa",
      suplementacao: suplementacao.value,
      colaterais: colaterais.value,
      obs: obs.value,
    },
  };
}

// ─── Config de clínica ───────────────────────────────────────
export function validateConfig(raw) {
  const errors = [];
  const push = (campo, err) => { if (err) errors.push({ campo, err }); };

  const clinica = str(raw.clinica, STR_MAX, true);
  const medico  = str(raw.medico, NOME_MAX);
  const crm     = str(raw.crm, CRM_MAX);

  push("clinica", clinica.error);
  push("medico", medico.error);
  push("crm", crm.error);

  return {
    errors,
    data: {
      clinica: clinica.value,
      medico: medico.value,
      crm: crm.value,
      logo: raw.logo || null,
      murevNoPdf: raw.murevNoPdf !== false,
    },
  };
}

// ─── Usuário novo pelo admin ──────────────────────────────────
export function validateNovoUsuario(raw) {
  const errors = [];
  const push = (campo, err) => { if (err) errors.push({ campo, err }); };

  const email   = str(raw.email, 254, true);
  const nome    = str(raw.nome, NOME_MAX);
  const clinica = str(raw.clinica, STR_MAX);
  const senha   = raw.senha ?? "";

  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    errors.push({ campo: "email", err: "email inválido" });
  }
  if (!senha || senha.length < 8) {
    errors.push({ campo: "senha", err: "mínimo 8 caracteres" });
  }
  if (!/[A-Z]/.test(senha)) {
    errors.push({ campo: "senha", err: "use ao menos uma letra maiúscula" });
  }
  if (!/[0-9]/.test(senha)) {
    errors.push({ campo: "senha", err: "use ao menos um número" });
  }

  push("nome", nome.error);
  push("clinica", clinica.error);

  return {
    errors,
    data: {
      email: email.value.toLowerCase(),
      nome: nome.value,
      clinica: clinica.value || "Clínica",
    },
  };
}

// ─── Helper para exibir o primeiro erro como toast ────────────
export function primeiroErro(errors) {
  if (!errors.length) return null;
  const e = errors[0];
  return `${e.campo}: ${e.err}`;
}
