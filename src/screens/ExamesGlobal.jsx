\// src/screens/ExamesGlobal.jsx
// Aba global de Exames (menu lateral) — leitura avulsa de laudo.
// Como não há ficha de paciente, o médico escolhe o gênero (afeta as faixas ideais).

import { useState } from "react";
import Exames from "./Exames.jsx";

export default function ExamesGlobal({ navegar }) {
  const [genero, setGenero] = useState("M");

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title" style={{ fontSize: 24, fontWeight: 600 }}>Exames laboratoriais</h1>
        <p className="page-sub">Leia qualquer laudo, baixe o PDF ou vincule a um paciente.</p>
      </div>

      {/* Seletor de gênero — afeta a classificação dos marcadores */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--inkSoft)" }}>Gênero do paciente:</span>
        <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
          {[["M", "Masculino"], ["F", "Feminino"]].map(([v, label]) => (
            <button key={v} onClick={() => setGenero(v)}
              style={{ borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, background: genero === v ? "var(--surface)" : "transparent", color: genero === v ? "var(--brand)" : "var(--inkFaint)", boxShadow: genero === v ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: "var(--inkFaint)" }}>
          Altera as faixas ideais de marcadores como ferritina, testosterona e HDL.
        </span>
      </div>

      <Exames navegar={navegar} pacienteGenero={genero} />
    </div>
  );
}
