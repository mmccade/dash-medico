// src/services/pdf.js
// PDFs de paciente, ciclo, meta batida, evolução e relatório.
// Reconstruído para manter o mesmo estilo visual do pdf-clinico.js.
// A API key do Claude não é usada aqui — geração 100% client-side (html2pdf).

import {
  imc, br, ultimoCiclo, primeiroCiclo, perdaPeso,
  parseNum, massaMagraKg,
} from "../lib/utils.js";
import { silhuetaSvgPdf, nomeLocal } from "../components/SilhuetaAplicacao.jsx";

// ─── Helpers de render (espelham pdf-clinico.js) ─────────────
const esc = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function cabecalho(config = {}, titulo = "") {
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
        <div style="font-size:12px;color:#8a9693;margin-top:4px">${esc(titulo)}</div>
      </div>
    </div>`;
}

function rodape(config = {}) {
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

const PAGINA = (corpo) => `
  <div style="width:720px;padding:32px;font-family:'Geist',Arial,sans-serif;color:#27322f;background:#fff;box-sizing:border-box">
    ${corpo}
  </div>`;

const slug = (s) => (s || "paciente").replace(/[^a-zA-Z0-9]+/g, "_");

// ─── Motor de geração (igual ao pdf-clinico.js) ──────────────
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

// ─── Blocos reutilizáveis ────────────────────────────────────
function blocoPaciente(p) {
  const linha2 = [
    p.idade ? `${p.idade} anos` : "",
    p.sexo || "",
    p.altura ? `${(p.altura * 100).toFixed(0)} cm` : "",
  ].filter(Boolean).join(" · ");
  return `
    <div style="background:#f0f4f4;border-radius:10px;padding:16px 18px;margin-bottom:20px">
      <div style="font-size:18px;font-weight:700;color:#27322f">${esc(p.nome)}</div>
      ${linha2 ? `<div style="font-size:13px;color:#5a6663;margin-top:4px">${esc(linha2)}</div>` : ""}
    </div>`;
}

function statCard(label, valor, sub = "") {
  return `
    <div style="background:#f0f4f4;border-radius:9px;padding:14px 16px">
      <div style="font-size:11px;color:#8a9693;text-transform:uppercase;letter-spacing:.4px">${esc(label)}</div>
      <div style="font-size:17px;font-weight:700;margin-top:3px;color:#27322f">${esc(valor)}</div>
      ${sub ? `<div style="font-size:11px;color:#8a9693;margin-top:2px">${esc(sub)}</div>` : ""}
    </div>`;
}

function linhaMedicao(label, valor, unidade = "") {
  if (valor == null || valor === "") return "";
  return `
    <tr style="page-break-inside:avoid">
      <td style="padding:7px 12px;border-bottom:1px solid #eef2f2;font-size:12px;color:#5a6663;font-weight:600;width:42%">${esc(label)}</td>
      <td style="padding:7px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;color:#27322f;font-weight:700">${esc(br(valor))}${unidade ? ` <span style="font-weight:400;color:#8a9693">${esc(unidade)}</span>` : ""}</td>
    </tr>`;
}

function blocoCiclo(c, config) {
  const doses = (c.doses || []).filter((d) => d != null && d !== 0);
  const dosesTxt = doses.length
    ? doses.map((d, i) => `S${i + 1}: ${br(d)} ${c.unidade === "ML" ? "ml" : "mg"}`).join("  ·  ")
    : "—";
  const localTxt = c.localAplicacao ? nomeLocal(c.localAplicacao) : "";
  const silhueta = c.localAplicacao ? silhuetaSvgPdf(c.localAplicacao) : "";

  return `
    <div style="border:1px solid #dde5e5;border-radius:10px;padding:16px 18px;margin-bottom:16px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:15px;font-weight:700;color:#27322f">${esc(c.mes || "Ciclo")}</span>
        <span style="font-size:12px;color:#8a9693">${fmtDataBr(c.data)}</span>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:6px">
        ${linhaMedicao("Peso", c.peso, "kg")}
        ${linhaMedicao("Gordura corporal", c.gordura, "%")}
        ${c.massaMagra ? linhaMedicao("Massa magra", c.massaMagra, "kg") : (massaMagraKg(c) != null ? linhaMedicao("Massa magra (estim.)", massaMagraKg(c), "kg") : "")}
        ${linhaMedicao("Gordura visceral", c.visceral, "(1–12)")}
        ${c.peso ? linhaMedicao("Local da aplicação", localTxt) : ""}
      </table>

      <div style="font-size:12px;font-weight:700;color:#0d7a82;margin:12px 0 4px">Titulação da dose</div>
      <div style="font-size:12.5px;color:#27322f;margin-bottom:8px">${esc(dosesTxt)}</div>

      ${silhueta ? `
      <div style="display:flex;gap:14px;align-items:center;margin:10px 0 4px">
        ${silhueta}
        <div style="font-size:12px;color:#5a6663">Ponto de aplicação registrado:<br><b style="color:#27322f">${esc(localTxt)}</b></div>
      </div>` : ""}

      ${c.medicacao ? `
      <div style="background:#eaf7f0;border:1px solid #1f9d6b;border-radius:8px;padding:10px 12px;margin-top:10px">
        <div style="font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.3px;margin-bottom:3px">Medicação prescrita</div>
        <div style="font-size:12.5px;color:#27322f;white-space:pre-wrap">${esc(c.medicacao)}</div>
      </div>` : ""}

      ${c.suplementacao ? `
      <div style="margin-top:10px"><span style="font-size:11px;font-weight:700;color:#0d7a82;text-transform:uppercase">Suplementação:</span>
        <div style="font-size:12.5px;color:#27322f;margin-top:2px;white-space:pre-wrap">${esc(c.suplementacao)}</div></div>` : ""}

      ${c.colaterais ? `
      <div style="margin-top:10px"><span style="font-size:11px;font-weight:700;color:#b45309;text-transform:uppercase">Efeitos colaterais:</span>
        <div style="font-size:12.5px;color:#27322f;margin-top:2px;white-space:pre-wrap">${esc(c.colaterais)}</div></div>` : ""}

      ${c.obs ? `
      <div style="margin-top:10px"><span style="font-size:11px;font-weight:700;color:#8a9693;text-transform:uppercase">Observações:</span>
        <div style="font-size:12.5px;color:#27322f;margin-top:2px;white-space:pre-wrap">${esc(c.obs)}</div></div>` : ""}
    </div>`;
}

// ─── Resumo textual da evolução (usado também na tela) ───────
export function textoResumo(p, ia, ib) {
  if (!p || !p.ciclos || p.ciclos.length === 0) return "Sem ciclos registrados.";
  const a = p.ciclos[ia] || primeiroCiclo(p);
  const b = p.ciclos[ib] || ultimoCiclo(p);
  if (!a || !b) return "Dados insuficientes para o resumo.";

  const dPeso = (a.peso != null && b.peso != null) ? +(a.peso - b.peso).toFixed(1) : null;
  const partes = [];
  partes.push(`${(p.nome || "Paciente").split(" ")[0]} iniciou o acompanhamento`);
  if (a.peso != null) partes.push(`com ${br(a.peso)} kg`);
  if (dPeso != null && dPeso !== 0) {
    const verbo = dPeso > 0 ? "reduziu" : "aumentou";
    partes.push(`e ${verbo} ${br(Math.abs(dPeso))} kg ao longo do período`);
  }
  if (b.peso != null && p.altura) {
    partes.push(`chegando a um IMC de ${br(imc(b.peso, p.altura))}`);
  }
  const dGord = (a.gordura != null && b.gordura != null && a.gordura !== "" && b.gordura !== "")
    ? +(a.gordura - b.gordura).toFixed(1) : null;
  if (dGord != null && dGord !== 0) {
    partes.push(`${dGord > 0 ? "com queda" : "com aumento"} de ${br(Math.abs(dGord))} pontos percentuais de gordura corporal`);
  }
  return partes.join(" ") + ".";
}

// ─── PDF de Paciente (ficha completa) ────────────────────────
export function htmlPaciente(p, config) {
  const ciclos = p.ciclos || [];
  const u = ciclos.length ? ultimoCiclo(p) : null;
  const perda = ciclos.length > 1 ? perdaPeso(p) : 0;

  const cards = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      ${statCard("Ciclos", String(ciclos.length))}
      ${u && u.peso != null ? statCard("Peso atual", `${br(u.peso)} kg`) : statCard("Peso atual", "—")}
      ${perda > 0 ? statCard("Perda total", `${br(perda)} kg`) : (perda < 0 ? statCard("Variação", `${br(perda)} kg`) : statCard("Perda total", "—"))}
    </div>`;

  const resumo = ciclos.length
    ? `<div style="background:#f0f4f4;border-radius:9px;padding:14px 16px;margin-bottom:20px;font-size:13px;line-height:1.6;color:#27322f">${esc(textoResumo(p, 0, ciclos.length - 1))}</div>`
    : "";

  const corpoCiclos = ciclos.length
    ? `<div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:10px">Ciclos registrados</div>${ciclos.map((c) => blocoCiclo(c, config)).join("")}`
    : `<div style="color:#8a9693;font-size:13px">Nenhum ciclo registrado.</div>`;

  return PAGINA(`
    ${cabecalho(config, "Ficha do paciente")}
    ${blocoPaciente(p)}
    ${cards}
    ${resumo}
    ${corpoCiclos}
    ${rodape(config)}
  `);
}

export async function baixarPdfPaciente(paciente, config) {
  await gerar(htmlPaciente(paciente, config), `Ficha_${slug(paciente?.nome)}.pdf`);
}

// ─── PDF de Ciclo individual ─────────────────────────────────
export function htmlCiclo({ paciente, ciclo, config }) {
  return PAGINA(`
    ${cabecalho(config, "Ciclo de acompanhamento")}
    ${blocoPaciente(paciente)}
    ${blocoCiclo(ciclo, config)}
    ${rodape(config)}
  `);
}

export async function baixarPdfCiclo({ paciente, ciclo, config }) {
  await gerar(htmlCiclo({ paciente, ciclo, config }), `Ciclo_${slug(paciente?.nome)}.pdf`);
}

// ─── PDF de Meta batida (mensagem de parabéns ao paciente) ───
export function htmlMetaBatida(paciente, config, mensagem) {
  const u = paciente.ciclos?.length ? ultimoCiclo(paciente) : null;
  const prim = paciente.ciclos?.length ? primeiroCiclo(paciente) : null;
  const perda = paciente.ciclos?.length > 1 ? perdaPeso(paciente) : 0;

  return PAGINA(`
    ${cabecalho(config, "Conquista de meta")}
    <div style="text-align:center;padding:24px 0 8px">
      <div style="font-size:46px;margin-bottom:8px">🏆</div>
      <div style="font-size:22px;font-weight:700;color:#15803d">Meta alcançada!</div>
      <div style="font-size:15px;color:#27322f;margin-top:6px">${esc(paciente.nome)}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0">
      ${prim?.peso != null ? statCard("Peso inicial", `${br(prim.peso)} kg`) : ""}
      ${u?.peso != null ? statCard("Peso atual", `${br(u.peso)} kg`) : ""}
      ${perda > 0 ? statCard("Total perdido", `${br(perda)} kg`) : ""}
    </div>
    ${mensagem ? `<div style="background:#eaf7f0;border-left:4px solid #1f9d6b;border-radius:8px;padding:16px 18px;font-size:14px;line-height:1.6;color:#27322f;font-style:italic">${esc(mensagem)}</div>` : ""}
    ${rodape(config)}
  `);
}

export async function baixarPdfMetaBatida(paciente, config, mensagem) {
  await gerar(htmlMetaBatida(paciente, config, mensagem), `Meta_${slug(paciente?.nome)}.pdf`);
}

// ─── PDF de Evolução ─────────────────────────────────────────
export function htmlEvolucao(p, config) {
  const ciclos = p.ciclos || [];
  if (!ciclos.length) return PAGINA(`${cabecalho(config, "Evolução")}${blocoPaciente(p)}<div style="color:#8a9693;font-size:13px">Sem ciclos no período.</div>${rodape(config)}`);

  const linhas = ciclos.map((c) => `
    <tr style="page-break-inside:avoid">
      <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12px;color:#27322f;font-weight:600">${esc(c.mes || "")}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:11.5px;color:#8a9693">${fmtDataBr(c.data)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;text-align:center;font-weight:700">${c.peso != null ? br(c.peso) : "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;text-align:center">${c.gordura != null && c.gordura !== "" ? br(c.gordura) + "%" : "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;text-align:center">${massaMagraKg(c) != null ? br(massaMagraKg(c)) : "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;text-align:center">${c.visceral != null && c.visceral !== "" ? br(c.visceral) : "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;text-align:center">${p.altura && c.peso ? br(imc(c.peso, p.altura)) : "—"}</td>
    </tr>`).join("");

  const th = (t, center) => `<th style="padding:8px 12px;background:#f0f4f4;text-align:${center ? "center" : "left"};font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">${t}</th>`;

  return PAGINA(`
    ${cabecalho(config, "Evolução do tratamento")}
    ${blocoPaciente(p)}
    <div style="background:#f0f4f4;border-radius:9px;padding:14px 16px;margin-bottom:20px;font-size:13px;line-height:1.6;color:#27322f">${esc(textoResumo(p, 0, ciclos.length - 1))}</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>${th("Ciclo")}${th("Data")}${th("Peso", true)}${th("Gord.", true)}${th("M.magra", true)}${th("Visc.", true)}${th("IMC", true)}</tr></thead>
      <tbody>${linhas}</tbody>
    </table>
    ${rodape(config)}
  `);
}

export async function baixarPdfEvolucao(paciente, config) {
  await gerar(htmlEvolucao(paciente, config), `Evolucao_${slug(paciente?.nome)}.pdf`);
}

// ─── PDF de Relatório do consultório ─────────────────────────
export function htmlRelatorio({ dados, labelPeriodo, config }) {
  const faixasHtml = (faixas) => {
    const ordem = ["<30", "30-39", "40-49", "50-59", "60-69", "70+"];
    return ordem.map((f) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #eef2f2;font-size:12px;color:#5a6663">${f}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;text-align:right;font-weight:700">${faixas?.[f] || 0}</td>
      </tr>`).join("");
  };

  const motivos = (dados.motivosRanking || []).map(([m, n]) => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eef2f2;font-size:12px;color:#5a6663">${esc(m)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eef2f2;font-size:12.5px;text-align:right;font-weight:700">${n}</td>
    </tr>`).join("");

  return PAGINA(`
    ${cabecalho(config, "Relatório do consultório")}
    <div style="background:#f0f4f4;border-radius:10px;padding:16px 18px;margin-bottom:20px">
      <div style="font-size:13px;color:#8a9693;text-transform:uppercase;letter-spacing:.4px">Período</div>
      <div style="font-size:17px;font-weight:700;color:#27322f;margin-top:2px">${esc(labelPeriodo)}</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:22px">
      ${statCard("Novos pacientes", String(dados.novos))}
      ${statCard("Pacientes inativados", String(dados.inativos))}
      ${statCard("Ciclos registrados", String(dados.ciclos))}
      ${statCard("Peso total reduzido", `${br(dados.pesoTotal)} kg`)}
    </div>

    ${dados.kgGordura ? `<div style="background:#eaf7f0;border-radius:9px;padding:14px 16px;margin-bottom:22px;font-size:13px;color:#15803d"><b>${br(dados.kgGordura)} kg</b> de gordura corporal reduzida no conjunto de pacientes no período.</div>` : ""}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:8px">
      <div>
        <div style="font-size:13px;font-weight:700;color:#0d7a82;margin-bottom:6px">Novos por faixa etária</div>
        <table style="width:100%;border-collapse:collapse">${faixasHtml(dados.faixasNovos)}</table>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#0d7a82;margin-bottom:6px">Motivos de inativação</div>
        <table style="width:100%;border-collapse:collapse">${motivos || '<tr><td style="padding:6px 12px;font-size:12px;color:#8a9693">Nenhum</td></tr>'}</table>
      </div>
    </div>

    ${rodape(config)}
  `);
}

export async function gerarPdfRelatorio({ dados, labelPeriodo, config, pacientes }) {
  await gerar(htmlRelatorio({ dados, labelPeriodo, config, pacientes }), `Relatorio_${slug(config?.clinica)}.pdf`);
}
