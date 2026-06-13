// src/screens/Config.jsx
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { Toggle } from "../components/ui.jsx";

export default function Config() {
  const { config, salvarConfig } = useStore();
  const toast = useToast();
  const [f, setF] = useState(config);
  const logoRef = useRef(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const onLogo = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Selecione uma imagem (PNG ou JPG)"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { set("logo", e.target.result); toast("Logo carregada"); };
    reader.onerror = () => toast("Erro ao ler a imagem");
    reader.readAsDataURL(file);
  };

  const salvar = () => { salvarConfig(f); toast("Configurações salvas"); };

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div><h1 className="page-title">Configurações</h1><p className="page-sub">Como sua clínica aparece na ficha e no PDF entregue ao paciente.</p></div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Identidade da clínica</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field"><label>Nome da clínica</label><input type="text" value={f.clinica} onChange={(e) => set("clinica", e.target.value)} /></div>
          <div className="field"><label>Nome do médico</label><input type="text" value={f.medico} onChange={(e) => set("medico", e.target.value)} /></div>
          <div className="field"><label>CRM</label><input type="text" value={f.crm} onChange={(e) => set("crm", e.target.value)} /></div>
          <div className="field">
            <label>Logo da clínica (opcional)</label>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/jpg" style={{ display: "none" }} onChange={(e) => onLogo(e.target.files[0])} />
            {f.logo ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, border: "1px solid var(--line)", borderRadius: 11, background: "var(--surface2)" }}>
                <img src={f.logo} alt="logo" style={{ maxHeight: 48, maxWidth: 120, objectFit: "contain" }} />
                <button onClick={() => set("logo", null)} className="btn btn-ghost sm" style={{ marginLeft: "auto" }}>
                  <X size={14} /> Remover
                </button>
              </div>
            ) : (
              <button onClick={() => logoRef.current?.click()} style={{
                width: "100%", border: "1.5px dashed var(--line)", borderRadius: 11, padding: 22,
                background: "var(--surface2)", color: "var(--inkSoft)", fontSize: 13, display: "flex",
                flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <Upload size={20} color="var(--brand)" />
                Clique para enviar a logo · PNG ou JPG
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Marca no PDF do paciente</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>Exibir assinatura Murev no rodapé</div>
            <div style={{ fontSize: 12.5, color: "var(--inkSoft)", lineHeight: 1.5 }}>Marca discreta "feito com Murev" no rodapé. O protagonismo continua sendo da sua clínica.</div>
          </div>
          <Toggle on={f.murevNoPdf} onClick={() => set("murevNoPdf", !f.murevNoPdf)} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" onClick={salvar}>Salvar configurações</button>
      </div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Prévia do cabeçalho do relatório</h3>
        <div style={{ border: "1px solid var(--line)", borderRadius: 11, padding: "18px 20px", background: "var(--surface2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{f.clinica}</div>
              <div style={{ fontSize: 12.5, color: "var(--inkSoft)", marginTop: 2 }}>{f.medico} · {f.crm}</div>
            </div>
            {f.logo
              ? <img src={f.logo} alt="logo" style={{ maxHeight: 44, maxWidth: 110, objectFit: "contain" }} />
              : <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--inkFaint)" }}>logo</div>}
          </div>
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11.5, color: "var(--inkFaint)" }}>Relatório de acompanhamento</span>
            {f.murevNoPdf && <span style={{ fontSize: 10.5, color: "var(--inkFaint)" }}>feito com <b style={{ color: "var(--brand)" }}>MUREV</b> Acompanha</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
