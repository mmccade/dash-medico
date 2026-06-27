// src/services/pdf-clinico.js
// PDFs de exames laboratoriais e anamnese — mesmo estilo visual do pdf.js.
// Cores de status: verde (normal) / vermelho (alto) / amarelo (baixo).

import { BIOMARCADORES, CATEGORIAS_EXAME, classificar, getInterpretacao } from "../lib/biomarcadores.js";
import { SECOES_ANAMNESE } from "../lib/anamnese-schema.js";

const esc = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const COR_PDF = {
  alto:   { bg: "#fdecec", border: "#d64545", txt: "#b91c1c", label: "ALTO" },
  baixo:  { bg: "#fff8e6", border: "#e0a800", txt: "#9a6700", label: "BAIXO" },
  normal: { bg: "#eaf7f0", border: "#1f9d6b", txt: "#15803d", label: "NORMAL" },
};

function cabecalho(config, titulo) {
  const logo = config.logo
    ? `<img src="${config.logo}" style="max-height:48px;max-width:130px;object-fit:contain" />`
    : "";
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:0 0 16px;border-bottom:2px solid #0d7a82;margin-bottom:20px">
      <div>
        <div style="font-size:20px;font-weight:700;color:#27322f">${esc(config.clinica)}</div>
        <div style="font-size:12.5px;color:#5a6663;margin-top:3px">${esc(config.medico)} · ${esc(config.crm)}</div>
      </div>
      <div style="text-align:right">${logo}
        <div style="font-size:12px;color:#8a9693;margin-top:4px">${titulo}</div>
      </div>
    </div>`;
}

function rodape(config) {
  return `
    <div style="border-top:1px solid #dde5e5;padding-top:12px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#a5b0b0">
      <span>${esc(config.clinica)} · ${esc(config.medico)}</span>
      ${config.murevNoPdf !== false ? `<span>feito com <b style="color:#0d7a82">MUREV</b> Acompanha</span>` : ""}
    </div>
    <div style="font-size:9.5px;color:#b5bfbf;margin-top:8px;line-height:1.4">
      Documento gerado para acompanhamento clínico. As condutas terapêuticas são de responsabilidade exclusiva do profissional médico responsável.
    </div>`;
}

function fmtDataBr(iso) {
  if (!iso) return "";
  try { return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR"); }
  catch { return iso; }
}

// ─── PDF de Exames ────────────────────────────────────────────
export function htmlExames({ paciente, exames, genero, config }) {
  const blocoPaciente = paciente ? `
    <div style="background:#f0f4f4;border-radius:10px;padding:16px 18px;margin-bottom:20px">
      <div style="font-size:18px;font-weight:700;color:#27322f">${esc(paciente.nome)}</div>
      <div style="font-size:13px;color:#5a6663;margin-top:4px">
        ${paciente.idade ? `${paciente.idade} anos · ` : ""}${esc(paciente.sexo || "")}
      </div>
    </div>` : "";

  const blocosExames = exames.map((exame, idx) => {
    const anterior = exames[idx + 1] || null;

    const categorias = CATEGORIAS_EXAME.map((cat) => {
      const marcs = (exame.marcadores || []).filter(
        (m) => BIOMARCADORES.find((b) => b.nome === m.nome)?.categoria === cat
      );
      if (!marcs.length) return "";

      const linhas = marcs.map((m) => {
        const st = classificar(m.nome, m.valor, genero) || "normal";
        const c = COR_PDF[st];
        const bio = BIOMARCADORES.find((b) => b.nome === m.nome);
        const interp = getInterpretacao(m.nome, st);
        const ant = anterior?.marcadores?.find((x) => x.nome === m.nome);
        const vA = parseFloat(String(m.valor).replace(",", "."));
        const vAnt = ant ? parseFloat(String(ant.valor).replace(",", ".")) : null;
        const delta = !isNaN(vA) && vAnt != null && !isNaN(vAnt) ? +(vA - vAnt).toFixed(2) : null;

        return `
          <tr style="page-break-inside:avoid">
            <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;color:#27322f">
              <b>${esc(m.nome)}</b>${bio?.unidade ? ` <span style="color:#8a9693">(${esc(bio.unidade)})</span>` : ""}
              ${interp ? `<div style="font-size:10.5px;color:#5a6663;margin-top:2px;line-height:1.4">${esc(interp)}</div>` : ""}
              ${delta != null && delta !== 0 ? `<div style="font-size:10.5px;color:${delta > 0 ? "#b45309" : "#15803d"};margin-top:2px">${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)} ${esc(bio?.unidade || "")} vs anterior</div>` : ""}
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:13px;font-weight:700;text-align:center;white-space:nowrap">${esc(m.valor)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;text-align:center">
              <span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${c.bg};border:1px solid ${c.border};color:${c.txt}">${c.label}</span>
            </td>
          </tr>`;
      }).join("");

      return `
        <div style="font-size:12px;font-weight:700;color:#0d7a82;text-transform:uppercase;letter-spacing:.4px;margin:14px 0 6px">${esc(cat)}</div>
        <table style="width:100%;border-collapse:collapse">${linhas}</table>`;
    }).join("");

    return `
      <div style="border:1px solid #dde5e5;border-radius:10px;padding:16px 18px;margin-bottom:16px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:15px;font-weight:700;color:#27322f">${esc(exame.titulo)}</span>
          <span style="font-size:12px;color:#8a9693">${fmtDataBr(exame.data)}</span>
        </div>
        ${categorias}
      </div>`;
  }).join("");

  return `
    <div style="width:720px;padding:32px;font-family:'Geist',Arial,sans-serif;color:#27322f;background:#fff;box-sizing:border-box">
      ${cabecalho(config, "Exames laboratoriais")}
      ${blocoPaciente}
      ${exames.length ? blocosExames : '<div style="color:#8a9693;font-size:13px">Nenhum exame registrado.</div>'}
      ${rodape(config)}
    </div>`;
}

// ─── PDF de Anamnese ──────────────────────────────────────────
export function htmlAnamnese({ paciente, dados, config }) {
  const nome = paciente?.nome || dados?.nomeCompleto || "Paciente";

  const secoes = SECOES_ANAMNESE.map((sec) => {
    const campos = sec.campos.filter((c) => dados[c.k]);
    if (!campos.length) return "";
    const linhas = campos.map((c) => `
      <tr style="page-break-inside:avoid">
        <td style="padding:7px 12px;border-bottom:1px solid #eef2f2;font-size:12px;color:#5a6663;font-weight:600;width:38%;vertical-align:top">${esc(c.label)}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;color:#27322f">${esc(dados[c.k])}</td>
      </tr>`).join("");
    return `
      <div style="font-size:13px;font-weight:700;color:#0d7a82;margin:16px 0 6px;page-break-after:avoid">${esc(sec.titulo)}</div>
      <table style="width:100%;border-collapse:collapse">${linhas}</table>`;
  }).join("");

  return `
    <div style="width:720px;padding:32px;font-family:'Geist',Arial,sans-serif;color:#27322f;background:#fff;box-sizing:border-box">
      ${cabecalho(config, "Ficha de Anamnese")}
      <div style="background:#f0f4f4;border-radius:10px;padding:16px 18px;margin-bottom:8px">
        <div style="font-size:18px;font-weight:700;color:#27322f">${esc(nome)}</div>
      </div>
      ${secoes || '<div style="color:#8a9693;font-size:13px;margin-top:12px">Anamnese ainda não preenchida.</div>'}
      ${rodape(config)}
    </div>`;
}

// ─── Geração (mesmo mecanismo do pdf.js) ──────────────────────
async function gerar(htmlString, nomeArquivo) {
  const html2pdf = (await import("html2pdf.js")).default;
  const wrap = document.createElement("div");
  wrap.style.position = "fixed"; wrap.style.left = "-9999px"; wrap.style.top = "0";
  wrap.style.background = "#fff";
  wrap.innerHTML = htmlString;
  document.body.appendChild(wrap);
  const opt = {
    margin: [8, 8, 8, 8],
    filename: nomeArquivo,
    image: { type: "jpeg", quality: 0.96 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: 760 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"], avoid: ["tr", "img"] },
  };
  try {
    await html2pdf().set(opt).from(wrap.firstElementChild).save();
  } finally {
    if (wrap.parentNode) document.body.removeChild(wrap);
  }
}

const slug = (s) => (s || "paciente").replace(/[^a-zA-Z0-9]+/g, "_");

export async function baixarPdfExames({ paciente, exames, genero, config }) {
  await gerar(htmlExames({ paciente, exames, genero, config }), `Exames_${slug(paciente?.nome)}.pdf`);
}

export async function baixarPdfAnamnese({ paciente, dados, config }) {
  await gerar(htmlAnamnese({ paciente, dados, config }), `Anamnese_${slug(paciente?.nome || dados?.nomeCompleto)}.pdf`);
}

// ─── PDF do Plano de Acompanhamento ──────────────────────────
export function htmlPlano({ paciente, plano, config }) {
  if (!plano) return `<div>Nenhum plano definido.</div>`;

  function addMeses(iso, m) {
    const d = new Date(iso + "T12:00:00");
    d.setMonth(d.getMonth() + m);
    return d.toISOString().slice(0, 10);
  }
  const termino = addMeses(plano.inicio, plano.duracaoMeses);
  const hoje = new Date().toISOString().slice(0, 10);
  const totalDias = Math.max(1, Math.round((new Date(termino) - new Date(plano.inicio)) / 86400000));
  const decorrido = Math.min(totalDias, Math.max(0, Math.round((new Date(hoje) - new Date(plano.inicio)) / 86400000)));
  const pctTempo = Math.round((decorrido / totalDias) * 100);
  const marcosConcluidos = (plano.marcos || []).filter((m) => m.concluido).length;

  const marcosHtml = [...(plano.marcos || [])].sort((a, b) => (a.data || "").localeCompare(b.data || "")).map((m) => {
    const atrasado = !m.concluido && m.data && m.data < hoje;
    const cor = m.concluido ? "#1f9d6b" : atrasado ? "#e6a817" : "#5a6663";
    const icone = m.concluido ? "✓" : atrasado ? "⏰" : "○";
    return `
      <tr style="page-break-inside:avoid">
        <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;width:24px;color:${cor};font-weight:700;font-size:14px">${icone}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:13px;font-weight:${m.concluido ? 400 : 600};color:${m.concluido ? "#8a9693" : "#27322f"};text-decoration:${m.concluido ? "line-through" : "none"}">${esc(m.titulo)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12px;color:#8a9693;white-space:nowrap">${m.data ? new Date(m.data + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12px;color:#5a6663">${esc(m.desc || "")}</td>
      </tr>`;
  }).join("");

  const barraProgresso = (pct, cor) => `
    <div style="height:8px;background:#eef2f2;border-radius:99px;overflow:hidden;margin-top:6px">
      <div style="width:${pct}%;height:100%;background:${cor};border-radius:99px"></div>
    </div>`;

  return `
    <div style="width:720px;padding:32px;font-family:'Geist',Arial,sans-serif;color:#27322f;background:#fff;box-sizing:border-box">
      ${cabecalho(config, "Plano de Acompanhamento")}
      <div style="background:#f0f4f4;border-radius:10px;padding:16px 18px;margin-bottom:20px">
        <div style="font-size:18px;font-weight:700">${esc(paciente?.nome || "")}</div>
        <div style="font-size:13px;color:#5a6663;margin-top:4px">${esc(plano.titulo || "")}</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        <div style="background:#f0f4f4;border-radius:9px;padding:14px 16px">
          <div style="font-size:11px;color:#8a9693;text-transform:uppercase;letter-spacing:.4px">Início</div>
          <div style="font-size:15px;font-weight:700;margin-top:3px">${fmtDataBr(plano.inicio)}</div>
        </div>
        <div style="background:#f0f4f4;border-radius:9px;padding:14px 16px">
          <div style="font-size:11px;color:#8a9693;text-transform:uppercase;letter-spacing:.4px">Término previsto</div>
          <div style="font-size:15px;font-weight:700;margin-top:3px">${fmtDataBr(termino)}</div>
        </div>
        <div style="background:#f0f4f4;border-radius:9px;padding:14px 16px">
          <div style="font-size:11px;color:#8a9693;text-transform:uppercase;letter-spacing:.4px">Marcos</div>
          <div style="font-size:15px;font-weight:700;margin-top:3px">${marcosConcluidos}/${(plano.marcos||[]).length} concluídos</div>
        </div>
      </div>

      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#5a6663;margin-bottom:4px">
          <span>Progresso do tempo</span><span>${pctTempo}%</span>
        </div>
        ${barraProgresso(pctTempo, "#0d7a82")}
      </div>

      <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:10px">Marcos do tratamento</div>
      ${(plano.marcos||[]).length ? `
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr>
          <th style="padding:8px 12px;background:#f0f4f4;text-align:left;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5"></th>
          <th style="padding:8px 12px;background:#f0f4f4;text-align:left;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Marco</th>
          <th style="padding:8px 12px;background:#f0f4f4;text-align:left;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Data</th>
          <th style="padding:8px 12px;background:#f0f4f4;text-align:left;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Descrição</th>
        </tr></thead>
        <tbody>${marcosHtml}</tbody>
      </table>` : `<div style="color:#8a9693;font-size:13px">Nenhum marco definido.</div>`}

      ${rodape(config)}
    </div>`;
}

export async function baixarPdfPlano({ paciente, plano, config }) {
  await gerar(htmlPlano({ paciente, plano, config }), `Plano_${(paciente?.nome || "paciente").replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`);
}
