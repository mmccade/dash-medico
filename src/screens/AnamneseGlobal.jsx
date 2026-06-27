// src/screens/AnamneseGlobal.jsx
// Wrapper da aba global de Anamnese (menu lateral) — preenche e cria/vincula paciente.

import Anamnese from "./Anamnese.jsx";

export default function AnamneseGlobal({ navegar }) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <h1 className="page-title" style={{ fontSize: 24, fontWeight: 600 }}>Nova Anamnese</h1>
        <p className="page-sub">Preencha a ficha clínica e exporte ou cadastre o paciente.</p>
      </div>
      <Anamnese navegar={navegar} />
    </div>
  );
}
