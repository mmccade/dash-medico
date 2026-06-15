// src/services/pdf.js
// + Bloco "Metas" no PDF de paciente e evolução
// + baixarPdfMetaBatida(): PDF de parabenização (antes/depois, IMC, gordura visceral,
//   mensagem do médico editável)

import { imc, br, fmtData, primeiroCiclo, ultimoCiclo, mesesTrat, imcMeta } from "../lib/utils.js";

const esc = (s) =>
  (s == null ? "" : String(s)).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

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

// Bloco de metas (compartilhado entre PDF de paciente e evolução)
function blocoMetas(p) {
  if (!p.pesoMeta && !p.visceralMeta) return "";
  const u = p.ciclos.length ? ultimoCiclo(p) : null;
  const imcM = p.pesoMeta && p.altura ? imcMeta(p.pesoMeta, p.altura) : null;
  const pesoBatida = p.pesoMeta && u && u.peso <= p.pesoMeta;
  const visceralBatida = p.visceralMeta && u && u.visceral != null && u.visceral <= p.visceralMeta;

  const linhaMeta = (lbl, atual, meta, unit, batida) => `
    <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;font-weight:600">${lbl}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;text-align:center">${atual != null ? br(atual) + unit : "—"}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;text-align:center;color:#0d7a82;font-weight:700">${meta != null ? br(meta) + unit : "—"}</td>
    <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;text-align:center;color:${batida ? "#1f9d6b" : "#a5b0b0"};font-weight:700">${batida ? "✓ Batida" : "—"}</td>
  `;

  return `
    <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:10px;page-break-inside:avoid">Metas do paciente</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;page-break-inside:avoid">
      <thead><tr>
        <th style="padding:9px 12px;background:#f0f4f4;text-align:left;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Indicador</th>
        <th style="padding:9px 12px;background:#f0f4f4;text-align:center;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Atual</th>
        <th style="padding:9px 12px;background:#f0f4f4;text-align:center;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Meta</th>
        <th style="padding:9px 12px;background:#f0f4f4;text-align:center;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Status</th>
      </tr></thead>
      <tbody>
        ${p.pesoMeta ? `<tr>${linhaMeta("Peso", u?.peso, p.pesoMeta, " kg", pesoBatida)}</tr>` : ""}
        ${imcM ? `<tr>${linhaMeta("IMC", u ? imc(u.peso, p.altura) : null, imcM, "", pesoBatida)}</tr>` : ""}
        ${p.visceralMeta ? `<tr>${linhaMeta("Gordura visceral", u?.visceral, p.visceralMeta, "", visceralBatida)}</tr>` : ""}
      </tbody>
    </table>`;
}

function blocoPaciente(p) {
  const total = p.ciclos.length;
  return `
    <div style="background:#f0f4f4;border-radius:10px;padding:16px 18px;margin-bottom:20px">
      <div style="font-size:18px;font-weight:700;color:#27322f">${esc(p.nome)}</div>
      <div style="font-size:13px;color:#5a6663;margin-top:4px">
        ${p.idade} anos · ${esc(p.sexo)} · ${br(Number(p.altura).toFixed(2))} m · Início ${fmtData(p.inicio)} · ${total} ${total === 1 ? "ciclo" : "ciclos"}
      </div>
      <div style="font-size:13px;color:#5a6663;margin-top:6px"><b style="color:#27322f">Objetivo:</b> ${esc(p.objetivo)}</div>
      ${p.comorbidades && p.comorbidades !== "Nenhuma relatada"
        ? `<div style="font-size:13px;color:#5a6663;margin-top:3px"><b style="color:#27322f">Condições:</b> ${esc(p.comorbidades)}</div>` : ""}
    </div>`;
}

// ---------- PDF 1: FICHA DO PACIENTE ----------
export function htmlPaciente(p, config) {
  const ciclos = p.ciclos.map((c) => `
    <div style="border:1px solid #dde5e5;border-radius:10px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:15px;font-weight:700;color:#27322f">${esc(c.mes)}${c.data ? ` · ${fmtData(c.data)}` : ""}</span>
        <span style="font-size:12px;color:#0d7a82;font-weight:600">${br(c.peso)} kg · ${br(c.gordura)}% gordura · visceral ${c.visceral}</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        ${c.doses.map((d, i) => `
          <div style="flex:1;text-align:center;background:#f0f4f4;border-radius:6px;padding:6px 2px">
            <div style="font-size:13px;font-weight:700;color:#27322f">${br(d)} ${c.unidade.toLowerCase()}</div>
            <div style="font-size:9.5px;color:#8a9693">Sem ${i + 1}</div>
          </div>`).join("")}
      </div>
      <div style="font-size:12px;color:#5a6663;line-height:1.6">
        <b style="color:#27322f">Local:</b> ${esc(c.local)} &nbsp;·&nbsp;
        <b style="color:#27322f">Suplementação:</b> ${esc(c.suplementacao) || "—"}<br>
        <b style="color:#27322f">Colaterais:</b> ${esc(c.colaterais) || "—"}<br>
        <b style="color:#27322f">Observações:</b> ${esc(c.obs) || "—"}
      </div>
    </div>`).join("");

  return `
    <div style="width:720px;padding:32px;font-family:'Geist',Arial,sans-serif;color:#27322f;background:#fff;box-sizing:border-box">
      ${cabecalho(config, "Ficha do paciente")}
      ${blocoPaciente(p)}
      ${blocoMetas(p)}
      <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:12px">Histórico de ciclos</div>
      ${ciclos}
      ${rodape(config)}
    </div>`;
}

// ---------- PDF 2: EVOLUÇÃO ----------
export function textoResumo(p, indiceA, indiceB) {
  const cA = typeof indiceA === "number" ? p.ciclos[indiceA] : indiceA;
  const cB = typeof indiceB === "number" ? p.ciclos[indiceB] : indiceB;
  if (!cA || !cB) return "";
  const artigo = p.sexo === "Feminino" ? "a paciente" : "o paciente";
  const dPeso = +(cB.peso - cA.peso).toFixed(1);
  const pct = cA.peso ? Math.abs(+(((cB.peso - cA.peso) / cA.peso) * 100).toFixed(1)) : 0;
  const dGord = +(cB.gordura - cA.gordura).toFixed(1);
  const dVisc = cB.visceral - cA.visceral;
  const movPeso = dPeso < 0 ? `redução de ${br(Math.abs(dPeso))} kg (${br(pct)}% do peso corporal)`
    : dPeso > 0 ? `aumento de ${br(Math.abs(dPeso))} kg (${br(pct)}%)` : "peso estável";
  const movGord = dGord < 0 ? `queda de ${br(Math.abs(dGord))} pontos percentuais`
    : dGord > 0 ? `aumento de ${br(Math.abs(dGord))} pontos percentuais` : "percentual estável";
  const movVisc = dVisc < 0 ? `redução de ${Math.abs(dVisc)} (de ${cA.visceral} para ${cB.visceral})`
    : dVisc > 0 ? `aumento de ${Math.abs(dVisc)} (de ${cA.visceral} para ${cB.visceral})` : `mantido em ${cB.visceral}`;
  const n = typeof indiceA === "number" && typeof indiceB === "number" ? Math.abs(indiceB - indiceA) : 0;
  const per = n > 0 ? `No período de ${cA.mes} a ${cB.mes} (${n} ${n === 1 ? "mês" : "meses"})` : `No ciclo de ${cA.mes}`;
  return `${per}, ${artigo} apresentou ${movPeso} no peso, passando de ${br(cA.peso)} kg para ${br(cB.peso)} kg. O IMC variou de ${br(imc(cA.peso, p.altura))} para ${br(imc(cB.peso, p.altura))} kg/m². O percentual de gordura corporal teve ${movGord} (de ${br(cA.gordura)}% para ${br(cB.gordura)}%), e a gordura visceral apresentou ${movVisc}.`;
}

function graficoPNG(labels, data, cor, titulo, Chart) {
  if (!Chart) return null;
  try {
    const cv = document.createElement("canvas");
    cv.width = 660; cv.height = 220;
    cv.style.position = "fixed"; cv.style.left = "-9999px";
    document.body.appendChild(cv);
    const ch = new Chart(cv, {
      type: "line",
      data: { labels, datasets: [{ data, borderColor: cor, backgroundColor: cor, borderWidth: 3, tension: 0.35, pointRadius: 4, pointBackgroundColor: cor, pointBorderWidth: 0, fill: false }] },
      options: {
        responsive: false, animation: false, devicePixelRatio: 2,
        plugins: { legend: { display: false }, title: { display: true, text: titulo, color: "#27322f", font: { size: 14, weight: "600" } } },
        scales: { x: { grid: { color: "#e5eaea" }, ticks: { color: "#5a6663" } }, y: { grid: { color: "#e5eaea" }, ticks: { color: "#5a6663" }, grace: "8%" } },
      },
    });
    const url = cv.toDataURL("image/png", 1.0);
    ch.destroy(); document.body.removeChild(cv);
    return url;
  } catch { return null; }
}

export function htmlEvolucao(p, config, Chart) {
  const f = primeiroCiclo(p), u = ultimoCiclo(p);
  const delta = (lbl, vi, vf, unit) => {
    const d = +(vf - vi).toFixed(1); const sinal = d > 0 ? "+" : "";
    const cor = d < 0 ? "#1f9d6b" : d > 0 ? "#c2543a" : "#888";
    return `<tr>
      <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;font-weight:600">${lbl}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;text-align:center;color:#5a6663">${br(vi)}${unit}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;text-align:center;color:#5a6663">${br(vf)}${unit}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #e5eaea;text-align:center;font-weight:700;color:${cor}">${sinal}${br(d)}${unit}</td>
    </tr>`;
  };
  const labels = p.ciclos.map((c) => c.mes);
  const graficos = Chart ? [
    graficoPNG(labels, p.ciclos.map((c) => c.peso), "#0d7a82", "Peso (kg)", Chart),
    graficoPNG(labels, p.ciclos.map((c) => imc(c.peso, p.altura)), "#0d7a82", "IMC", Chart),
    graficoPNG(labels, p.ciclos.map((c) => c.gordura), "#c2543a", "% Gordura", Chart),
    graficoPNG(labels, p.ciclos.map((c) => c.visceral), "#6b4fc4", "Visceral", Chart),
  ].filter(Boolean) : [];
  const gridGraf = graficos.length
    ? `<div style="font-size:15px;font-weight:700;color:#0d7a82;margin:4px 0 10px;page-break-before:auto">Gráficos de evolução</div>
       <div style="display:flex;flex-wrap:wrap;justify-content:space-between">
         ${graficos.map((g) => `<div style="width:48%;margin-bottom:12px;page-break-inside:avoid"><img src="${g}" style="width:100%;border:1px solid #e5eaea;border-radius:8px" /></div>`).join("")}
       </div>` : "";

  const meses_h = p.ciclos.map((c) => `<th style="padding:8px 10px;background:#f0f4f4;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5;text-align:center">${c.mes}</th>`).join("");
  const linhaTab = (lbl, fn) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eef2f2;font-weight:600;white-space:nowrap">${lbl}</td>${p.ciclos.map((c) => `<td style="padding:8px 10px;border-bottom:1px solid #eef2f2;text-align:center">${fn(c)}</td>`).join("")}</tr>`;

  return `
    <div style="width:720px;padding:32px;font-family:'Geist',Arial,sans-serif;color:#27322f;background:#fff;box-sizing:border-box">
      ${cabecalho(config, "Relatório de evolução")}
      ${blocoPaciente(p)}
      ${blocoMetas(p)}
      <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:10px;page-break-inside:avoid">Evolução do início ao momento atual</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;page-break-inside:avoid">
        <thead><tr>
          <th style="padding:9px 12px;background:#f0f4f4;text-align:left;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Indicador</th>
          <th style="padding:9px 12px;background:#f0f4f4;text-align:center;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">${f.mes}</th>
          <th style="padding:9px 12px;background:#f0f4f4;text-align:center;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">${u.mes}</th>
          <th style="padding:9px 12px;background:#f0f4f4;text-align:center;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Variação</th>
        </tr></thead>
        <tbody>
          ${delta("Peso", f.peso, u.peso, " kg")}
          ${delta("IMC", imc(f.peso, p.altura), imc(u.peso, p.altura), "")}
          ${delta("% Gordura", f.gordura, u.gordura, "%")}
          ${delta("Gordura visceral", f.visceral, u.visceral, "")}
        </tbody>
      </table>
      <div style="background:#f0f4f4;border-left:3px solid #0d7a82;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;page-break-inside:avoid">
        <div style="font-size:11px;font-weight:700;color:#5a6663;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Resumo do acompanhamento</div>
        <div style="font-size:13px;line-height:1.6">${esc(textoResumo(p, 0, p.ciclos.length - 1))}</div>
      </div>
      <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:10px;page-break-inside:avoid">Histórico mês a mês</div>
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:20px;page-break-inside:avoid">
        <thead><tr><th style="padding:8px 12px;background:#f0f4f4;text-align:left;font-size:11px;color:#5a6663;border-bottom:1px solid #dde5e5">Indicador</th>${meses_h}</tr></thead>
        <tbody>
          ${linhaTab("Peso (kg)", (c) => br(c.peso))}
          ${linhaTab("IMC", (c) => br(imc(c.peso, p.altura)))}
          ${linhaTab("% Gordura", (c) => br(c.gordura))}
          ${linhaTab("Visceral", (c) => c.visceral)}
          ${linhaTab("Dose final", (c) => br(c.doses[c.doses.length - 1]) + " " + c.unidade.toLowerCase())}
        </tbody>
      </table>
      ${gridGraf}
      ${rodape(config)}
    </div>`;
}

// ---------- PDF 3: META BATIDA (parabenização) ----------
export function htmlMetaBatida(p, config, mensagemMedico) {
  const f = primeiroCiclo(p);
  const u = ultimoCiclo(p);
  if (!f || !u) return "";
  const imcA = imc(f.peso, p.altura);
  const imcB = imc(u.peso, p.altura);
  const dPeso = +(f.peso - u.peso).toFixed(1);
  const dImc  = +(imcA - imcB).toFixed(1);
  const dGord = f.gordura != null && u.gordura != null ? +(f.gordura - u.gordura).toFixed(1) : null;
  const dVisc = f.visceral != null && u.visceral != null ? (f.visceral - u.visceral) : null;

  const card = (lbl, antes, depois, unit, dif) => `
    <div style="background:#fff;border:2px solid #d6f0e4;border-radius:14px;padding:18px;margin-bottom:12px;page-break-inside:avoid">
      <div style="font-size:11px;font-weight:700;color:#5a6663;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">${lbl}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:14px">
        <div style="text-align:center;flex:1">
          <div style="font-size:10.5px;color:#8a9693;margin-bottom:4px">ANTES</div>
          <div style="font-size:22px;font-weight:700;color:#a5b0b0">${br(antes)}${unit}</div>
        </div>
        <div style="font-size:24px;color:#1f9d6b">→</div>
        <div style="text-align:center;flex:1">
          <div style="font-size:10.5px;color:#1f9d6b;margin-bottom:4px">DEPOIS</div>
          <div style="font-size:28px;font-weight:700;color:#1f9d6b">${br(depois)}${unit}</div>
        </div>
      </div>
      ${dif != null && dif > 0 ? `
        <div style="text-align:center;margin-top:10px;font-size:13px;font-weight:700;color:#1f9d6b">
          −${br(dif)}${unit} de redução
        </div>` : ""}
    </div>
  `;

  const msgFinal = mensagemMedico && mensagemMedico.trim()
    ? mensagemMedico
    : "Parabéns pela conquista! É uma honra ter participado dessa jornada com você. Que esse resultado seja só o começo de uma nova fase de saúde e bem-estar.";

  return `
    <div style="width:720px;padding:32px;font-family:'Geist',Arial,sans-serif;color:#27322f;background:#fff;box-sizing:border-box">
      ${cabecalho(config, "Conquista de meta")}

      <!-- Hero -->
      <div style="background:linear-gradient(135deg,#1f9d6b,#0d7a82);border-radius:16px;padding:36px 28px;text-align:center;color:#fff;margin-bottom:24px;page-break-inside:avoid">
        <div style="font-size:60px;line-height:1;margin-bottom:8px">🏆</div>
        <div style="font-size:13px;font-weight:700;letter-spacing:2px;opacity:0.9;text-transform:uppercase;margin-bottom:6px">Conquista alcançada</div>
        <div style="font-size:30px;font-weight:700;letter-spacing:-0.5px;margin-bottom:6px">Parabéns, ${esc(p.nome)}!</div>
        <div style="font-size:14px;opacity:0.95">Você atingiu sua meta após ${mesesTrat(p.inicio)} ${mesesTrat(p.inicio) === 1 ? "mês" : "meses"} de acompanhamento.</div>
      </div>

      <!-- Cards de antes/depois -->
      <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:12px">Sua jornada em números</div>
      ${card("Peso corporal", f.peso, u.peso, " kg", dPeso)}
      ${card("IMC", imcA, imcB, "", dImc)}
      ${dGord != null ? card("Gordura corporal", f.gordura, u.gordura, "%", dGord) : ""}
      ${dVisc != null ? card("Gordura visceral", f.visceral, u.visceral, "", dVisc) : ""}

      <!-- Mensagem do médico -->
      <div style="background:#f0f4f4;border-left:4px solid #1f9d6b;border-radius:0 12px 12px 0;padding:20px 24px;margin-top:8px;page-break-inside:avoid">
        <div style="font-size:11px;font-weight:700;color:#5a6663;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Mensagem do seu médico</div>
        <div style="font-size:14.5px;line-height:1.7;color:#27322f;font-style:italic">"${esc(msgFinal)}"</div>
        <div style="font-size:12.5px;color:#5a6663;margin-top:14px;text-align:right">
          — ${esc(config.medico || config.clinica)}${config.crm ? ` · ${esc(config.crm)}` : ""}
        </div>
      </div>

      ${rodape(config)}
    </div>`;
}

// ---------- gerador comum ----------
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

export async function baixarPdfPaciente(p, config) {
  await gerar(htmlPaciente(p, config), `Ficha_${p.nome.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`);
}

export async function baixarPdfEvolucao(p, config) {
  let Chart = null;
  try { Chart = (await import("chart.js/auto")).default; } catch { /* gráficos opcionais */ }
  await gerar(htmlEvolucao(p, config, Chart), `Evolucao_${p.nome.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`);
}

export async function baixarPdfMetaBatida(p, config, mensagemMedico) {
  await gerar(htmlMetaBatida(p, config, mensagemMedico), `Conquista_${p.nome.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`);
}
