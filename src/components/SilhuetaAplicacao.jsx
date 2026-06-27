// src/components/SilhuetaAplicacao.jsx
// Seletor de local de aplicação subcutânea (GLP-1 / tirzepatida) em 2 níveis:
//   1. Silhueta geral → escolhe a região (abdômen, braço, coxa)
//   2. Zoom da região → zonas PERMITIDAS (verde) e PROIBIDAS (vermelho), escolhe o ponto
//
// Locais finais (id salvo no ciclo):
//   abdomen_se, abdomen_sd, abdomen_ie, abdomen_id  (quadrantes, longe do umbigo)
//   braco_e, braco_d   (posterior)
//   coxa_e, coxa_d     (frontal/lateral)

import { useState } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";

// ── Locais e metadados ────────────────────────────────────────
export const LOCAIS_APLICACAO = [
  { id: "abdomen_se", nome: "Abdômen superior esquerdo (≥5cm do umbigo)", regiao: "abdomen" },
  { id: "abdomen_sd", nome: "Abdômen superior direito (≥5cm do umbigo)",  regiao: "abdomen" },
  { id: "abdomen_ie", nome: "Abdômen inferior esquerdo (≥5cm do umbigo)", regiao: "abdomen" },
  { id: "abdomen_id", nome: "Abdômen inferior direito (≥5cm do umbigo)",  regiao: "abdomen" },
  { id: "flanco_e",   nome: "Flanco esquerdo (lateral, acima do quadril)", regiao: "flanco" },
  { id: "flanco_d",   nome: "Flanco direito (lateral, acima do quadril)",  regiao: "flanco" },
  { id: "braco_e",    nome: "Braço esquerdo — posterior, terço médio",  regiao: "braco" },
  { id: "braco_d",    nome: "Braço direito — posterior, terço médio",   regiao: "braco" },
  { id: "coxa_e",     nome: "Coxa esquerda — face frontal/lateral, terço médio", regiao: "coxa" },
  { id: "coxa_d",     nome: "Coxa direita — face frontal/lateral, terço médio",  regiao: "coxa" },
];

export function nomeLocal(id) {
  return LOCAIS_APLICACAO.find((l) => l.id === id)?.nome || "";
}
function regiaoDe(id) {
  return LOCAIS_APLICACAO.find((l) => l.id === id)?.regiao || null;
}

const REGIOES = [
  { id: "abdomen", nome: "Abdômen",  cx: 60, cy: 118 },
  { id: "flanco",  nome: "Flancos",  cx: 20, cy: 130 },
  { id: "braco",   nome: "Braços",   cx: 24, cy: 92 },
  { id: "coxa",    nome: "Coxas",    cx: 47, cy: 180 },
];

const CORPO_PATH =
  "M60 18 c-7 0 -12 5 -12 12 0 5 2 8 5 11 -8 2 -16 6 -22 12 -5 5 -7 14 -8 24 " +
  "l-3 26 c0 3 4 4 6 1 l3 -20 1 0 -2 34 c-1 8 -1 22 1 34 l3 50 c1 5 9 5 10 0 " +
  "l4 -44 2 0 4 44 c1 5 9 5 10 0 l3 -50 c2 -12 2 -26 1 -34 l-2 -34 1 0 3 20 " +
  "c2 3 6 2 6 -1 l-3 -26 c-1 -10 -3 -19 -8 -24 -6 -6 -14 -10 -22 -12 3 -3 5 -6 5 -11 " +
  "0 -7 -5 -12 -12 -12 z";

const VERDE = "#1a9e6e", VERDE_BG = "#e1f5ee";
const VERM = "#d64545", VERM_BG = "#fdecec";

// ── Zoom de cada região: zonas + pontos selecionáveis ─────────
function ZoomAbdomen({ valor, onChange }) {
  const pts = [
    { id: "abdomen_se", cx: 38, cy: 45, nome: "Sup. esquerdo" },
    { id: "abdomen_sd", cx: 82, cy: 45, nome: "Sup. direito" },
    { id: "abdomen_ie", cx: 38, cy: 95, nome: "Inf. esquerdo" },
    { id: "abdomen_id", cx: 82, cy: 95, nome: "Inf. direito" },
  ];
  return (
    <svg viewBox="0 0 120 140" width="240" height="280">
      {/* área abdominal */}
      <rect x="10" y="15" width="100" height="110" rx="14" fill={VERDE_BG} stroke={VERDE} strokeWidth="1.5" />
      {/* zona proibida: 5cm ao redor do umbigo */}
      <circle cx="60" cy="70" r="20" fill={VERM_BG} stroke={VERM} strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="60" cy="70" r="3" fill={VERM} />
      <text x="60" y="70" dy="-26" textAnchor="middle" fontSize="7" fill={VERM} fontWeight="700">umbigo</text>
      <text x="60" y="70" dy="34" textAnchor="middle" fontSize="6.5" fill={VERM}>zona proibida (5 cm)</text>
      {/* pontos */}
      {pts.map((p) => {
        const on = valor === p.id;
        return (
          <g key={p.id} style={{ cursor: "pointer" }} onClick={() => onChange(on ? "" : p.id)}>
            <circle cx={p.cx} cy={p.cy} r="11" fill="transparent" />
            <circle cx={p.cx} cy={p.cy} r={on ? 8 : 6} fill={on ? VERDE : "#fff"} stroke={VERDE} strokeWidth="2" style={{ transition: "all .15s" }} />
            {on && <circle cx={p.cx} cy={p.cy} r="3" fill="#fff" />}
          </g>
        );
      })}
    </svg>
  );
}

function ZoomBraco({ valor, onChange }) {
  // dois braços, região posterior (terço médio)
  const pts = [
    { id: "braco_e", cx: 35, cy: 60, nome: "Braço esquerdo" },
    { id: "braco_d", cx: 85, cy: 60, nome: "Braço direito" },
  ];
  return (
    <svg viewBox="0 0 120 140" width="240" height="280">
      {[35, 85].map((cx, i) => (
        <g key={i}>
          {/* braço */}
          <rect x={cx - 14} y="15" width="28" height="110" rx="14" fill={VERDE_BG} stroke={VERDE} strokeWidth="1.5" />
          {/* zona permitida: terço médio posterior */}
          <rect x={cx - 11} y="48" width="22" height="34" rx="9" fill="#fff" stroke={VERDE} strokeWidth="1.2" strokeDasharray="3 2" />
          {/* zonas proibidas: perto de ombro e cotovelo */}
          <rect x={cx - 14} y="15" width="28" height="22" rx="11" fill={VERM_BG} opacity="0.6" />
          <rect x={cx - 14} y="103" width="28" height="22" rx="11" fill={VERM_BG} opacity="0.6" />
        </g>
      ))}
      <text x="60" y="10" textAnchor="middle" fontSize="6.5" fill={VERM}>evite ombro e cotovelo</text>
      {pts.map((p) => {
        const on = valor === p.id;
        return (
          <g key={p.id} style={{ cursor: "pointer" }} onClick={() => onChange(on ? "" : p.id)}>
            <circle cx={p.cx} cy={p.cy} r="11" fill="transparent" />
            <circle cx={p.cx} cy={p.cy} r={on ? 8 : 6} fill={on ? VERDE : "#fff"} stroke={VERDE} strokeWidth="2" style={{ transition: "all .15s" }} />
            {on && <circle cx={p.cx} cy={p.cy} r="3" fill="#fff" />}
          </g>
        );
      })}
    </svg>
  );
}

function ZoomCoxa({ valor, onChange }) {
  const pts = [
    { id: "coxa_e", cx: 38, cy: 60, nome: "Coxa esquerda" },
    { id: "coxa_d", cx: 82, cy: 60, nome: "Coxa direita" },
  ];
  return (
    <svg viewBox="0 0 120 140" width="240" height="280">
      {[38, 82].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 16} y="12" width="32" height="116" rx="15" fill={VERDE_BG} stroke={VERDE} strokeWidth="1.5" />
          {/* zona permitida: face frontal/lateral, terço médio */}
          <rect x={cx - 12} y="45" width="24" height="40" rx="10" fill="#fff" stroke={VERDE} strokeWidth="1.2" strokeDasharray="3 2" />
          {/* proibido: virilha (topo) e joelho (base) */}
          <rect x={cx - 16} y="12" width="32" height="22" rx="11" fill={VERM_BG} opacity="0.6" />
          <rect x={cx - 16} y="106" width="32" height="22" rx="11" fill={VERM_BG} opacity="0.6" />
        </g>
      ))}
      <text x="60" y="9" textAnchor="middle" fontSize="6.5" fill={VERM}>evite virilha e joelho</text>
      {pts.map((p) => {
        const on = valor === p.id;
        return (
          <g key={p.id} style={{ cursor: "pointer" }} onClick={() => onChange(on ? "" : p.id)}>
            <circle cx={p.cx} cy={p.cy} r="11" fill="transparent" />
            <circle cx={p.cx} cy={p.cy} r={on ? 8 : 6} fill={on ? VERDE : "#fff"} stroke={VERDE} strokeWidth="2" style={{ transition: "all .15s" }} />
            {on && <circle cx={p.cx} cy={p.cy} r="3" fill="#fff" />}
          </g>
        );
      })}
    </svg>
  );
}


function ZoomFlanco({ valor, onChange }) {
  const pts = [
    { id: "flanco_e", cx: 35, cy: 60, nome: "Flanco esquerdo" },
    { id: "flanco_d", cx: 85, cy: 60, nome: "Flanco direito" },
  ];
  return (
    <svg viewBox="0 0 120 140" width="240" height="280">
      {[35, 85].map((cx, i) => (
        <g key={i}>
          {/* Região do flanco */}
          <ellipse cx={cx} cy={60} rx={18} ry={50} fill={VERDE_BG} stroke={VERDE} strokeWidth="1.5" />
          {/* Zona permitida */}
          <ellipse cx={cx} cy={60} rx={13} ry={32} fill="#fff" stroke={VERDE} strokeWidth="1.2" strokeDasharray="3 2" />
          {/* Proibido: muito próximo à crista ilíaca */}
          <ellipse cx={cx} cy={100} rx={18} ry={12} fill={VERM_BG} opacity="0.6" />
        </g>
      ))}
      <text x="60" y="9" textAnchor="middle" fontSize="6.5" fill={VERM}>evite crista ilíaca e costelas</text>
      {pts.map((p) => {
        const on = valor === p.id;
        return (
          <g key={p.id} style={{ cursor: "pointer" }} onClick={() => onChange(on ? "" : p.id)}>
            <circle cx={p.cx} cy={p.cy} r="11" fill="transparent" />
            <circle cx={p.cx} cy={p.cy} r={on ? 8 : 6} fill={on ? VERDE : "#fff"} stroke={VERDE} strokeWidth="2" style={{ transition: "all .15s" }} />
            {on && <circle cx={p.cx} cy={p.cy} r="3" fill="#fff" />}
          </g>
        );
      })}
    </svg>
  );
}

const AVISO_REGIAO = {
  abdomen: "Mantenha pelo menos 5 cm de distância do umbigo. Evite cicatrizes e estrias.",
  flanco:  "Aplique na região lateral, acima do quadril. Evite a crista ilíaca e costelas. Bom local para rodízio.",
  braco:   "Aplique na região posterior (atrás), no terço médio. Evite ombro e cotovelo.",
  coxa:    "Aplique na face frontal ou lateral externa, terço médio. Evite virilha e joelho.",
};

// ── Componente principal ──────────────────────────────────────
export default function SilhuetaAplicacao({ valor, onChange, somenteLeitura = false, tamanho = 240 }) {
  // Se já tem valor, abre direto na região dele; senão começa na visão geral
  const [regiao, setRegiao] = useState(valor ? regiaoDe(valor) : null);

  // Modo leitura: silhueta pequena com o ponto destacado
  if (somenteLeitura) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <svg viewBox="0 0 120 240" width={tamanho * 0.45} height={tamanho * 0.9}>
          <path d={CORPO_PATH} fill="var(--surface2,#eef2f2)" stroke="var(--line,#dde5e5)" strokeWidth="1.5" />
          {valor && (() => {
            const r = REGIOES.find((x) => x.id === regiaoDe(valor));
            if (!r) return null;
            return <>
              <circle cx={r.cx} cy={r.cy} r="8" fill={VERDE} stroke={VERDE} strokeWidth="2" />
              <circle cx={r.cx} cy={r.cy} r="3" fill="#fff" />
            </>;
          })()}
        </svg>
        {valor && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)" }}>{nomeLocal(valor)}</div>}
      </div>
    );
  }

  // Nível 1: escolher região na silhueta geral
  if (!regiao) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <p style={{ fontSize: 12.5, color: "var(--inkFaint)", textAlign: "center", margin: 0 }}>
          Toque na região do corpo onde a dose será aplicada.
        </p>
        <svg viewBox="0 0 120 240" width={tamanho * 0.5} height={tamanho} style={{ overflow: "visible" }}>
          <path d={CORPO_PATH} fill="var(--surface2,#eef2f2)" stroke="var(--line,#dde5e5)" strokeWidth="1.5" />
          {REGIOES.map((r) => {
            const temPonto = valor && regiaoDe(valor) === r.id;
            return (
              <g key={r.id} style={{ cursor: "pointer" }} onClick={() => setRegiao(r.id)}>
                <circle cx={r.cx} cy={r.cy} r="14" fill={temPonto ? VERDE_BG : "transparent"} stroke={VERDE} strokeWidth="1.5" strokeDasharray={temPonto ? "0" : "3 2"} />
                <circle cx={r.cx} cy={r.cy} r={temPonto ? 6 : 3} fill={temPonto ? VERDE : "var(--inkFaint)"} />
              </g>
            );
          })}
        </svg>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {REGIOES.map((r) => (
            <button key={r.id} type="button" onClick={() => setRegiao(r.id)}
              style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: "var(--surface2)", color: "var(--inkSoft)", border: "1px solid transparent" }}>
              {r.nome}
            </button>
          ))}
        </div>
        {valor && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand)" }}>Selecionado: {nomeLocal(valor)}</div>}
      </div>
    );
  }

  // Nível 2: zoom da região com zonas
  const ZoomComp = regiao === "abdomen" ? ZoomAbdomen : regiao === "flanco" ? ZoomFlanco : regiao === "braco" ? ZoomBraco : ZoomCoxa;
  const nomeRegiao = REGIOES.find((r) => r.id === regiao)?.nome;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <button type="button" onClick={() => setRegiao(null)}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--inkFaint)", fontWeight: 600 }}>
        <ArrowLeft size={14} /> Trocar região
      </button>

      <div style={{ fontSize: 14, fontWeight: 700 }}>{nomeRegiao}</div>

      {/* legenda */}
      <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--inkSoft)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: VERDE_BG, border: `1px solid ${VERDE}` }} /> Permitida
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: VERM_BG, border: `1px solid ${VERM}` }} /> Proibida
        </span>
      </div>

      <ZoomComp valor={valor} onChange={onChange} />

      {/* aviso de zona proibida */}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: VERM_BG, borderRadius: 9, fontSize: 11.5, color: "#9a2828", lineHeight: 1.5, maxWidth: 320 }}>
        <AlertTriangle size={15} color={VERM} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{AVISO_REGIAO[regiao]}</span>
      </div>

      {valor && regiaoDe(valor) === regiao && (
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--brand)" }}>✓ {nomeLocal(valor)}</div>
      )}
    </div>
  );
}

// ── SVG estático para PDF (silhueta + ponto destacado) ────────
// Mapa de posições para PDF (centro visual de cada região)
const PDF_POSICOES = {
  abdomen_se: { cx: 48, cy: 108 }, abdomen_sd: { cx: 72, cy: 108 },
  abdomen_ie: { cx: 48, cy: 128 }, abdomen_id: { cx: 72, cy: 128 },
  flanco_e: { cx: 22, cy: 125 }, flanco_d: { cx: 98, cy: 125 },
  braco_e: { cx: 18, cy: 88 }, braco_d: { cx: 102, cy: 88 },
  coxa_e: { cx: 44, cy: 178 }, coxa_d: { cx: 76, cy: 178 },
};

export function silhuetaSvgPdf(localId) {
  const r = REGIOES.find((x) => x.id === regiaoDe(localId));
  const pos = localId ? PDF_POSICOES[localId] : null;
  const ponto = pos
    ? `<circle cx="${pos.cx}" cy="${pos.cy}" r="7" fill="#0d7a82" stroke="#0d7a82" stroke-width="2" /><circle cx="${pos.cx}" cy="${pos.cy}" r="2.5" fill="#fff" />`
    : r
    ? `<circle cx="${r.cx}" cy="${r.cy}" r="7" fill="#0d7a82" stroke="#0d7a82" stroke-width="2" /><circle cx="${r.cx}" cy="${r.cy}" r="2.5" fill="#fff" />`
    : "";
  return `<svg viewBox="0 0 120 240" width="70" height="140" style="overflow:visible">
    <path d="${CORPO_PATH}" fill="#f0f4f4" stroke="#dde5e5" stroke-width="1.5" />
    ${ponto}
  </svg>`;
}
