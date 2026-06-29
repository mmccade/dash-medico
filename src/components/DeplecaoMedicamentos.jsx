// src/components/DeplecaoMedicamentos.jsx
// Médico seleciona os medicamentos do paciente → mostra nutrientes depletados.
// Sempre com o aviso de que a conduta é de responsabilidade do médico.
// Props:
//  - valor: array de nomes de medicamentos selecionados
//  - onChange: (novoArray) => void

import { useState, useRef, useEffect } from "react";
import { Search, X, Pill, Info } from "lucide-react";
import { MEDICAMENTOS, buscarMedicamentos, nutrientesDepletados } from "../lib/medicamentos.js";

export default function DeplecaoMedicamentos({ valor = [], onChange }) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);

  const resultados = buscarMedicamentos(busca).slice(0, 8);
  const mapa = nutrientesDepletados(valor);
  const nutrientes = Object.entries(mapa).sort((a, b) => b[1].length - a[1].length);

  // Calcula posição do dropdown como fixed pra escapar de overflow:hidden no container pai.
  useEffect(() => {
    if (!aberto || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const alturaEstimada = Math.min(240, resultados.length * 56 + 16);
    const espacoAbaixo = window.innerHeight - rect.bottom;
    const abrePraCima = espacoAbaixo < alturaEstimada + 24;

    setDropdownStyle(abrePraCima ? {
      position: "fixed", bottom: window.innerHeight - rect.top + 4,
      left: rect.left, width: rect.width,
    } : {
      position: "fixed", top: rect.bottom + 4,
      left: rect.left, width: rect.width,
    });
  }, [aberto, busca, resultados.length]);

  const adicionar = (nome) => {
    if (!valor.includes(nome)) onChange([...valor, nome]);
    setBusca(""); setAberto(false);
  };
  const remover = (nome) => onChange(valor.filter((m) => m !== nome));

  return (
    <div>
      {/* Busca */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--inkFaint)" }} />
        <input
          ref={inputRef}
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          placeholder="Buscar medicamento do paciente…"
          style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, boxSizing: "border-box" }}
        />
        {aberto && busca && resultados.length > 0 && (
          <div style={{ ...dropdownStyle, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999, maxHeight: 240, overflowY: "auto" }}>
            {resultados.map((m) => (
              <button key={m.nome} onClick={() => adicionar(m.nome)}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid var(--line)" }}
                onMouseOver={(e) => e.currentTarget.style.background = "var(--brandSoft)"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                <Pill size={14} color="var(--inkFaint)" />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.nome}</div>
                  <div style={{ fontSize: 11.5, color: "var(--inkFaint)" }}>depleta {m.depleta.length} nutriente{m.depleta.length > 1 ? "s" : ""}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selecionados */}
      {valor.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {valor.map((nome) => (
            <span key={nome} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, padding: "5px 10px", borderRadius: 99, background: "var(--brandSoft)", color: "var(--brand)" }}>
              {nome}
              <button onClick={() => remover(nome)} style={{ display: "flex", color: "var(--brand)" }}><X size={13} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Resultado de depleção */}
      {nutrientes.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
            Nutrientes possivelmente reduzidos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {nutrientes.map(([nutriente, meds]) => (
              <div key={nutriente} style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 9, borderLeft: "3px solid var(--warn)" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nutriente}</div>
                <div style={{ fontSize: 11.5, color: "var(--inkSoft)", marginTop: 2 }}>
                  por: {meds.join(", ")}
                </div>
              </div>
            ))}
          </div>

          {/* Aviso obrigatório */}
          <div style={{ display: "flex", gap: 8, padding: "11px 14px", background: "var(--surface2)", borderRadius: 9, fontSize: 11.5, color: "var(--inkSoft)", lineHeight: 1.5 }}>
            <Info size={15} color="var(--inkFaint)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Estas associações são <b>informativas</b> e baseadas na literatura de interações fármaco-nutriente.
              A avaliação, a indicação de suplementação e toda a conduta são de <b>responsabilidade exclusiva do médico</b>.
            </span>
          </div>
        </div>
      )}

      {valor.length === 0 && (
        <div style={{ fontSize: 12.5, color: "var(--inkFaint)", padding: "8px 0" }}>
          Adicione os medicamentos em uso para ver quais nutrientes podem estar sendo reduzidos.
        </div>
      )}
    </div>
  );
}
