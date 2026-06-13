// src/services/pdf.js
// DOIS documentos distintos:
//  - pdfPaciente(): ficha completa do paciente (dados + ciclos + doses + suplementação)
//  - pdfEvolucao(): relatório de evolução (comparação temporal + gráficos)
// Paginação configurada com avoid para não cortar blocos no meio.
import { imc, br, fmtData, primeiroCiclo, ultimoCiclo, mesesTrat } from "../lib/utils.js";

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
      ${config.murevNoPdf ? `<span>feito com <b style="color:#0d7a82">MUREV</b> Acompanha</span>` : ""}
    </div>
    <div style="font-size:9.5px;color:#b5bfbf;margin-top:8px;line-height:1.4">
      Documento gerado para acompanhamento clínico. As condutas terapêuticas são de responsabilidade exclusiva do profissional médico responsável.
    </div>`;
}

function blocoPaciente(p) {
  const total = p.ciclos.length;
  return `
    <div style="background:#f0f4f4;border-radius:10px;padding:16px 18px;margin-bottom:20px">
      <div style="font-size:18px;font-weight:700;color:#27322f">${esc(p.nome)}</div>
      <div style="font-size:13px;color:#5a6663;margin-top:4px">
        ${p.idade} anos · ${esc(p.sexo)} · ${br(p.altura.toFixed(2))} m · Início ${fmtData(p.inicio)} · ${total} ${total === 1 ? "ciclo" : "ciclos"}
      </div>
      <div style="font-size:13px;color:#5a6663;margin-top:6px"><b style="color:#27322f">Objetivo:</b> ${esc(p.objetivo)}</div>
      ${p.comorbidades && p.comorbidades !== "Nenhuma relatada"
        ? `<div style="font-size:13px;color:#5a6663;margin-top:3px"><b style="color:#27322f">Condições:</b> ${esc(p.comorbidades)}</div>` : ""}
    </div>`;
}

// ---------- PDF 1: FICHA DO PACIENTE (ciclos detalhados) ----------
export function htmlPaciente(p, config) {
  const ciclos = p.ciclos.map((c) => `
    <div style="border:1px solid #dde5e5;border-radius:10px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:15px;font-weight:700;color:#27322f">${esc(c.mes)}</span>
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
      <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:12px">Histórico de ciclos</div>
      ${ciclos}
      ${rodape(config)}
    </div>`;
}

// ---------- PDF 2: EVOLUÇÃO (comparação temporal) ----------
export function textoResumo(p, cA, cB) {
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
  const idxA = p.ciclos.indexOf(cA), idxB = p.ciclos.indexOf(cB);
  const n = Math.abs(idxB - idxA);
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
        <div style="font-size:13px;line-height:1.6">${esc(textoResumo(p, f, u))}</div>
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
      <div style="font-size:15px;font-weight:700;color:#0d7a82;margin-bottom:10px">Registro fotográfico</div>
      <div style="display:flex;gap:14px;margin-bottom:20px;page-break-inside:avoid">
        <div style="flex:1;border:1.5px dashed #c5d0d0;border-radius:10px;height:180px;display:flex;align-items:center;justify-content:center;color:#a5b0b0;font-size:12px">Foto · Antes</div>
        <div style="flex:1;border:1.5px dashed #c5d0d0;border-radius:10px;height:180px;display:flex;align-items:center;justify-content:center;color:#a5b0b0;font-size:12px">Foto · Depois</div>
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
