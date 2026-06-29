// src/screens/ExamesComparacao.jsx
// Compara dois laudos de exame lado a lado:
// marcador por marcador, delta numérico, seta de tendência,
// destaque visual quando sai de fora do range pra dentro (melhora) ou vice-versa.

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Sparkles } from "lucide-react";
import { classificar, BIOMARCADORES } from "../lib/biomarcadores.js";
import { interacoesEntre, sugestoesSinergicas } from "../lib/suplementos.js";
import { br } from "../lib/utils.js";

// Marcadores onde cair é positivo clinicamente
const MAIS_BAIXO_MELHOR = new Set([
  "Glicose", "HbA1c", "HOMA-IR", "Colesterol total", "LDL",
  "Triglicerídeos", "PCR", "TSH", "Insulina", "Peso",
  "Gordura corporal", "Gordura visceral",
]);

function seta(nome, anterior, atual) {
  if (anterior == null || atual == null) return null;
  const delta = atual - anterior;
  if (Math.abs(delta) < 0.001) return "estavel";
  const subir = delta > 0;
  const bom = MAIS_BAIXO_MELHOR.has(nome) ? !subir : subir;
  return bom ? "melhora" : "piora";
}

function corSeta(direcao) {
  if (direcao === "melhora") return "var(--good, #1f9d6b)";
  if (direcao === "piora") return "var(--bad, #c0392b)";
  return "var(--inkFaint)";
}

function IconeSeta({ direcao }) {
  const cor = corSeta(direcao);
  if (direcao === "melhora") return <TrendingUp size={14} color={cor} />;
  if (direcao === "piora")   return <TrendingDown size={14} color={cor} />;
  return <Minus size={14} color={cor} />;
}

function badgeStatus(status) {
  if (!status || status === "normal") return null;
  const cor = status === "alto" ? "#b45309" : "#1d6fa8";
  const bg  = status === "alto" ? "#fff8e6" : "#e8f2fb";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: bg, color: cor, textTransform: "uppercase" }}>
      {status}
    </span>
  );
}

export default function ExamesComparacao({ exames = [], genero = "F", onVoltar }) {
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(Math.min(1, exames.length - 1));

  if (exames.length < 2) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "var(--inkFaint)", fontSize: 14 }}>
        São necessários ao menos 2 laudos para comparar.
      </div>
    );
  }

  const exA = exames[idxA];
  const exB = exames[idxB];

  // União dos marcadores dos dois laudos (por nome)
  const nomesA = new Set((exA.marcadores || []).map((m) => m.nome));
  const nomesB = new Set((exB.marcadores || []).map((m) => m.nome));
  const todosNomes = [...new Set([...nomesA, ...nomesB])].sort();

  const linhas = todosNomes.map((nome) => {
    const mA = exA.marcadores?.find((m) => m.nome === nome);
    const mB = exB.marcadores?.find((m) => m.nome === nome);
    const valA = mA?.valor != null ? Number(mA.valor) : null;
    const valB = mB?.valor != null ? Number(mB.valor) : null;
    const delta = valA != null && valB != null ? +(valB - valA).toFixed(2) : null;
    const dir = seta(nome, valA, valB);
    const stA = mA ? classificar(nome, valA, genero) : null;
    const stB = mB ? classificar(nome, valB, genero) : null;
    const unidade = mA?.unidade || mB?.unidade || "";
    return { nome, valA, valB, delta, dir, stA, stB, unidade };
  });

  // Separar por categoria: alterados, melhorados, sem mudança
  const alterados  = linhas.filter((l) => l.dir === "piora");
  const melhorados = linhas.filter((l) => l.dir === "melhora");
  const estaveis   = linhas.filter((l) => l.dir === "estavel" || l.dir === null);

  const sel = { padding: "8px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" };
  const th  = { padding: "10px 14px", fontSize: 11.5, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: ".4px", fontWeight: 700 };

  const Tabela = ({ linhas: ls, titulo, cor }) => ls.length === 0 ? null : (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: cor, marginBottom: 8 }}>{titulo} ({ls.length})</div>
      <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--surface2)" }}>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>Marcador</th>
              <th style={{ ...th, textAlign: "right" }}>{exA.titulo || "Exame A"}</th>
              <th style={{ ...th, textAlign: "center" }}>Δ</th>
              <th style={{ ...th, textAlign: "right" }}>{exB.titulo || "Exame B"}</th>
              <th style={{ ...th, textAlign: "center" }}>Tend.</th>
            </tr>
          </thead>
          <tbody>
            {ls.map((l) => (
              <tr key={l.nome} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{l.nome}</td>
                <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "right", color: l.stA && l.stA !== "normal" ? corSeta(l.stA === "alto" ? "piora" : "melhora") : "var(--ink)" }}>
                  {l.valA != null ? `${br(l.valA)} ${l.unidade}` : "—"}
                  {l.stA && l.stA !== "normal" && <> {badgeStatus(l.stA)}</>}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", fontSize: 12, fontWeight: 700, color: l.dir ? corSeta(l.dir) : "var(--inkFaint)" }}>
                  {l.delta != null ? `${l.delta > 0 ? "+" : ""}${br(l.delta)}` : "—"}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, textAlign: "right", color: l.stB && l.stB !== "normal" ? corSeta(l.stB === "alto" ? "piora" : "melhora") : "var(--ink)" }}>
                  {l.valB != null ? `${br(l.valB)} ${l.unidade}` : "—"}
                  {l.stB && l.stB !== "normal" && <> {badgeStatus(l.stB)}</>}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center" }}>
                  {l.dir ? <IconeSeta direcao={l.dir} /> : <Minus size={14} color="var(--inkFaint)" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        {onVoltar && (
          <button onClick={onVoltar} style={{ color: "var(--inkFaint)", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <ArrowLeft size={15} /> Voltar
          </button>
        )}
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Comparar exames</h2>
      </div>

      {/* Seletores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <label style={{ fontSize: 11.5, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Exame anterior</label>
          <select value={idxA} onChange={(e) => setIdxA(+e.target.value)} style={sel}>
            {exames.map((ex, i) => <option key={i} value={i}>{ex.titulo || `Exame ${i + 1}`} {ex.data ? `(${new Date(ex.data + "T12:00:00").toLocaleDateString("pt-BR")})` : ""}</option>)}
          </select>
        </div>
        <div style={{ textAlign: "center", fontSize: 18, color: "var(--inkFaint)", paddingTop: 18 }}>→</div>
        <div>
          <label style={{ fontSize: 11.5, color: "var(--inkFaint)", display: "block", marginBottom: 5 }}>Exame mais recente</label>
          <select value={idxB} onChange={(e) => setIdxB(+e.target.value)} style={sel}>
            {exames.map((ex, i) => <option key={i} value={i}>{ex.titulo || `Exame ${i + 1}`} {ex.data ? `(${new Date(ex.data + "T12:00:00").toLocaleDateString("pt-BR")})` : ""}</option>)}
          </select>
        </div>
      </div>

      {idxA === idxB && (
        <div style={{ padding: "14px 16px", background: "var(--surface2)", borderRadius: 10, fontSize: 13, color: "var(--inkFaint)", marginBottom: 20 }}>
          Selecione dois laudos diferentes para comparar.
        </div>
      )}

      {idxA !== idxB && (() => {
        // Coleta sugestões de suplemento dos marcadores que pioraram no exame mais recente
        const sugestoesMap = {};
        alterados.concat(linhas.filter(l => l.stB && l.stB !== "normal")).forEach((l) => {
          const bm = BIOMARCADORES.find((b) => b.nome === l.nome);
          if (!bm?.ideal?.sugestoes) return;
          const status = l.stB || (l.dir === "piora" ? (MAIS_BAIXO_MELHOR.has(l.nome) ? "alto" : "baixo") : null);
          const lista = status === "alto" ? bm.ideal.sugestoes.alto : bm.ideal.sugestoes.baixo;
          if (!lista?.length) return;
          lista.forEach((s) => {
            if (!sugestoesMap[s]) sugestoesMap[s] = [];
            sugestoesMap[s].push(l.nome);
          });
        });
        const sugestoes = Object.entries(sugestoesMap).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
        if (!sugestoes.length) return null;

        // Calcula sinergismos entre os suplementos sugeridos
        const nomesSupl = sugestoes.map(([s]) => s);
        const { sinergismos } = interacoesEntre(nomesSupl);

        return (
          <div style={{ background: "linear-gradient(135deg, var(--brandSoft,#d1f5e8), var(--surface))", border: "1px solid var(--brand,#0d7a82)22", borderRadius: 14, padding: "18px 20px", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Sparkles size={16} color="var(--brand)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: ".4px" }}>
                Sugestão de suplementação
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: sinergismos.length ? 14 : 0 }}>
              {sugestoes.map(([supl, marcadores]) => (
                <div key={supl} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{supl}</div>
                  <div style={{ fontSize: 11, color: "var(--inkFaint)", marginTop: 2 }}>
                    indicado por: {marcadores.slice(0, 2).join(", ")}
                  </div>
                </div>
              ))}
            </div>
            {sinergismos.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--good)", marginTop: 4 }}>
                ✓ Sinergismo identificado: {sinergismos.slice(0, 2).map(s => `${s.a} + ${s.b}`).join(" · ")}
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--inkFaint)", marginTop: 10, fontStyle: "italic" }}>
              Sugestões baseadas nos marcadores alterados. Conduta é responsabilidade do médico responsável.
            </div>
          </div>
        );
      })()}

      {idxA !== idxB && (
        <>
          {/* Sumário */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Melhoraram", n: melhorados.length, cor: "var(--good)" },
              { label: "Pioraram",   n: alterados.length,  cor: "var(--bad, #c0392b)" },
              { label: "Estáveis",   n: estaveis.length,   cor: "var(--inkFaint)" },
            ].map(({ label, n, cor }) => (
              <div key={label} style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: cor }}>{n}</div>
                <div style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <Tabela linhas={alterados}  titulo="Pioraram" cor="var(--bad, #c0392b)" />
          <Tabela linhas={melhorados} titulo="Melhoraram" cor="var(--good)" />
          <Tabela linhas={estaveis}   titulo="Sem mudança significativa" cor="var(--inkFaint)" />
        </>
      )}
    </div>
  );
}
