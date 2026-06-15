// src/components/inputs.jsx
// Componentes padronizados de input — vírgula automática, limite real de dígitos,
// máscara de data DD/MM/AAAA com ano limitado a 4 dígitos.

import { useState, useEffect } from "react";

// ─── Máscara decimal (vírgula automática estilo dinheiro) ─────
// Exemplo: digitos=4 decimais=1 → digita "1095" → vira "109,5"
function mascararDecimal(raw, digitos, decimais) {
  let s = String(raw ?? "").replace(/\D/g, "");
  if (s === "") return "";
  if (s.length > digitos) s = s.slice(0, digitos);
  if (decimais === 0) return s;
  while (s.length <= decimais) s = "0" + s;
  const inteiro = s.slice(0, s.length - decimais);
  const dec = s.slice(s.length - decimais);
  const inteiroLimpo = inteiro.replace(/^0+/, "") || "0";
  return `${inteiroLimpo},${dec}`;
}

// Converte número do banco em string mascarada (pra preencher campo de edição)
export function numeroParaMascara(n, digitos, decimais) {
  if (n == null || n === "") return "";
  const raw = String(Math.round(Number(n) * Math.pow(10, decimais)));
  return mascararDecimal(raw, digitos, decimais);
}

const inpStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 9,
  border: "1px solid var(--line)", background: "var(--surface)",
  fontSize: 14, color: "var(--ink)", boxSizing: "border-box",
};

export function InputDecimal({ value, onChange, placeholder = "0,0", digitos = 4, decimais = 1, style = {} }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(mascararDecimal(e.target.value, digitos, decimais))}
      placeholder={placeholder}
      style={{ ...inpStyle, ...style }}
    />
  );
}

export function InputInteiro({ value, onChange, placeholder, max = 999, style = {} }) {
  const handleChange = (e) => {
    let v = String(e.target.value).replace(/\D/g, "");
    if (v === "") { onChange(""); return; }
    if (parseInt(v) > max) v = String(max);
    onChange(v);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      style={{ ...inpStyle, ...style }}
    />
  );
}

// ─── Máscara de data DD/MM/AAAA ──────────────────────────────
// Aceita só dígitos, formata com / automaticamente.
// Ano limitado a 4 dígitos. Valida 1900-2099 e dias por mês.
// Internamente trabalha com ISO "AAAA-MM-DD" pra compatibilidade.
// value/onChange = string ISO ("" se incompleta).

function isoParaBr(iso) {
  if (!iso) return "";
  const [a, m, d] = String(iso).split("-");
  if (!d) return "";
  return `${d}/${m}/${a}`;
}

function brParaIso(br) {
  if (!br) return "";
  const limpo = br.replace(/\D/g, "");
  if (limpo.length !== 8) return "";
  const d = limpo.slice(0, 2);
  const m = limpo.slice(2, 4);
  const a = limpo.slice(4, 8);
  const di = parseInt(d), mi = parseInt(m), ai = parseInt(a);
  if (mi < 1 || mi > 12) return "";
  if (di < 1 || di > 31) return "";
  if (ai < 1900 || ai > 2099) return "";
  const dt = new Date(ai, mi - 1, di);
  if (dt.getFullYear() !== ai || dt.getMonth() !== mi - 1 || dt.getDate() !== di) return "";
  return `${a}-${m}-${d}`;
}

function mascararBr(raw) {
  let s = String(raw ?? "").replace(/\D/g, "").slice(0, 8);
  if (s.length <= 2) return s;
  if (s.length <= 4) return `${s.slice(0,2)}/${s.slice(2)}`;
  return `${s.slice(0,2)}/${s.slice(2,4)}/${s.slice(4)}`;
}

export function InputData({ value, onChange, placeholder = "DD/MM/AAAA", style = {} }) {
  const [texto, setTexto] = useState(() => isoParaBr(value));

  useEffect(() => {
    const novoBr = isoParaBr(value);
    if (novoBr !== texto && (texto === "" || !value)) setTexto(novoBr);
  }, [value]); // eslint-disable-line

  const handleChange = (e) => {
    const novo = mascararBr(e.target.value);
    setTexto(novo);
    const iso = brParaIso(novo);
    onChange(iso); // "" se incompleta/inválida; ISO se válida
  };

  const handleBlur = () => {
    if (texto && texto.replace(/\D/g, "").length !== 8) {
      setTexto("");
      onChange("");
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={texto}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={10}
      style={{ ...inpStyle, ...style }}
    />
  );
}
