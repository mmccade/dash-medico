// src/screens/Config.jsx
// Seção de conta removida daqui — foi para MeuPerfil.jsx

import { useState, useRef } from "react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { validateConfig, primeiroErro } from "../lib/validate.js";

export default function Config() {
  const { config, salvarConfig } = useStore();
  const toast = useToast();
  const logoRef = useRef(null);
  const [f, setF] = useState({ ...config });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const onLogo = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Logo deve ter até 2 MB"); return; }
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      toast("Use PNG, JPEG ou WebP"); return;
    }
    const reader = new FileReader();
    reader.onload = (e) => set("logo", e.target.result);
    reader.readAsDataURL(file);
  };

  const salvar = () => {
    const { data, errors } = validateConfig(f);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    salvarConfig(data);
    toast("Configurações salvas");
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-sub">Dados que aparecem nos PDFs gerados.</p>
      </div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Identidade da clínica</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Nome da clínica *</label>
            <input type="text" maxLength={300} value={f.clinica} onChange={(e) => set("clinica", e.target.value)} placeholder="Clínica Exemplo" />
          </div>
          <div className="field">
            <label>Nome do médico</label>
            <input type="text" maxLength={150} value={f.medico} onChange={(e) => set("medico", e.target.value)} placeholder="Dr. Nome Sobrenome" />
          </div>
          <div className="field">
            <label>CRM</label>
            <input type="text" maxLength={20} value={f.crm} onChange={(e) => set("crm", e.target.value)} placeholder="CRM/SP 12345" />
          </div>

          <div className="field">
            <label>Logo da clínica</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 4 }}>
              {f.logo ? (
                <img src={f.logo} alt="Logo" style={{ height: 52, maxWidth: 140, objectFit: "contain", borderRadius: 8, border: "1px solid var(--line)", cursor: "pointer" }}
                  onClick={() => logoRef.current?.click()} title="Clique para trocar" />
              ) : (
                <div onClick={() => logoRef.current?.click()}
                  style={{ height: 52, width: 120, border: "1px dashed var(--line)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--inkFaint)", fontSize: 12, cursor: "pointer" }}>
                  Clique para adicionar
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button className="btn btn-ghost sm" onClick={() => logoRef.current?.click()} style={{ fontSize: 12 }}>
                  {f.logo ? "Trocar logo" : "Adicionar logo"}
                </button>
                {f.logo && (
                  <button className="btn btn-ghost sm" onClick={() => set("logo", null)} style={{ fontSize: 12, color: "var(--bad)" }}>
                    Remover
                  </button>
                )}
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" style={{ display: "none" }} onChange={(e) => onLogo(e.target.files[0])} />
            <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 6 }}>PNG, JPEG ou WebP · máx. 2 MB</p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "var(--surface2)", borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Rodapé Murev Acompanha no PDF</div>
              <div style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 2 }}>Exibe "Gerado por Murev Acompanha" nos PDFs</div>
            </div>
            <div onClick={() => set("murevNoPdf", !f.murevNoPdf)}
              style={{ width: 42, height: 24, borderRadius: 99, background: f.murevNoPdf ? "var(--brand)" : "var(--line)", cursor: "pointer", position: "relative", transition: "background .2s" }}>
              <div style={{ width: 18, height: 18, background: "#fff", borderRadius: 99, position: "absolute", top: 3, left: f.murevNoPdf ? 21 : 3, transition: "left .2s" }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={salvar}>Salvar configurações</button>
      </div>
    </div>
  );
}
