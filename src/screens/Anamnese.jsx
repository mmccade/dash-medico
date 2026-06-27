// src/screens/Anamnese.jsx
// Ficha de anamnese completa (16 seções da planilha clínica).
// Dois modos:
//   - vinculada a um paciente (pacienteId): salva no Firestore do paciente
//   - global (sem pacienteId): preenche e pode exportar PDF ou criar paciente novo
// Ações: Salvar (modo vinculado) · Exportar PDF · Vincular a paciente / Criar paciente

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, Save, ChevronDown, FileText, UserPlus, X } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { getAnamnese, salvarAnamnese } from "../services/db-exames.js";
import { baixarPdfAnamnese } from "../services/pdf-clinico.js";
import { SECOES_ANAMNESE, anamneseParaPaciente } from "../lib/anamnese-schema.js";
import SeletorPaciente from "../components/SeletorPaciente.jsx";
import DeplecaoMedicamentos from "../components/DeplecaoMedicamentos.jsx";

function Campo({ campo, valor, onChange }) {
  const base = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", boxSizing: "border-box", color: "var(--ink)" };
  if (campo.tipo === "textarea") {
    return (
      <div className="field">
        <label>{campo.label}</label>
        <textarea value={valor || ""} onChange={(e) => onChange(e.target.value)} rows={3}
          style={{ ...base, minHeight: 68, resize: "vertical", fontFamily: "inherit" }} />
      </div>
    );
  }
  if (campo.tipo === "select") {
    return (
      <div className="field">
        <label>{campo.label}</label>
        <select value={valor || ""} onChange={(e) => onChange(e.target.value)} style={base}>
          <option value="">—</option>
          {campo.opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="field">
      <label>{campo.label}</label>
      <input type={campo.tipo === "number" ? "text" : "text"} value={valor || ""} onChange={(e) => onChange(e.target.value)} style={base} />
    </div>
  );
}

function SecaoCard({ secao, dados, onChange, abertaInicial }) {
  const [aberta, setAberta] = useState(abertaInicial);
  const preenchidos = secao.campos.filter((c) => dados[c.k]).length;
  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: 12 }}>
      <button onClick={() => setAberta(!aberta)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", textAlign: "left" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{secao.titulo}</span>
          <span style={{ fontSize: 11.5, color: "var(--inkFaint)", background: "var(--surface2)", padding: "2px 9px", borderRadius: 99 }}>
            {preenchidos}/{secao.campos.length}
          </span>
        </span>
        <ChevronDown size={18} style={{ color: "var(--inkFaint)", transform: aberta ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {aberta && (
        <div style={{ padding: "4px 20px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {secao.campos.map((c) => (
            <div key={c.k} style={{ gridColumn: c.tipo === "textarea" ? "1 / -1" : "auto" }}>
              <Campo campo={c} valor={dados[c.k]} onChange={(v) => onChange(c.k, v)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Modal de vínculo: escolher paciente existente ou criar novo
function ModalVincular({ pacientes, onVincularExistente, onCriarNovo, onFechar, salvando }) {
  const [modo, setModo] = useState("escolha"); // escolha | existente
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 560, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Vincular anamnese</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>

        {modo === "escolha" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={onCriarNovo} disabled={salvando} className="btn btn-primary" style={{ justifyContent: "center", padding: "14px" }}>
              {salvando ? <><Loader2 size={15} className="spin" /> Criando…</> : <><UserPlus size={16} /> Criar paciente novo com esta anamnese</>}
            </button>
            <button onClick={() => setModo("existente")} className="btn btn-ghost" style={{ justifyContent: "center", padding: "14px" }}>
              Vincular a um paciente existente
            </button>
          </div>
        )}

        {modo === "existente" && (
          <SeletorPaciente pacientes={pacientes} onSelecionar={onVincularExistente} />
        )}
      </div>
    </div>
  );
}

export default function Anamnese({ pacienteId, pacienteNome, navegar }) {
  const { user } = useAuth();
  const { pacientes, addPaciente } = useStore();
  const toast = useToast();
  const { config } = useStore();
  const [dados, setDados] = useState({});
  const [carregando, setCarregando] = useState(!!pacienteId);
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);
  const [modalVincular, setModalVincular] = useState(false);
  const [vinculando, setVinculando] = useState(false);

  const global = !pacienteId;

  const carregar = useCallback(async () => {
    if (!user || !pacienteId) { setCarregando(false); return; }
    try {
      const a = await getAnamnese(user.uid, pacienteId);
      if (a) setDados(a);
    } catch (e) { console.error(e); toast("Erro ao carregar anamnese."); }
    finally { setCarregando(false); }
  }, [user, pacienteId]);

  useEffect(() => { carregar(); }, [carregar]);

  const set = (k, v) => { setDados((d) => ({ ...d, [k]: v })); setSujo(true); };

  const salvar = async () => {
    if (global) return;
    setSalvando(true);
    try {
      await salvarAnamnese(user.uid, pacienteId, dados);
      toast("Anamnese salva.");
      setSujo(false);
    } catch (e) { console.error(e); toast("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  const exportarPdf = async () => {
    try {
      const paciente = pacienteId ? { nome: pacienteNome } : null;
      await baixarPdfAnamnese({ paciente, dados, config });
      toast("PDF gerado.");
    } catch (e) { console.error(e); toast("Erro ao gerar PDF."); }
  };

  const criarNovo = async () => {
    if (!dados.nomeCompleto) { toast("Preencha ao menos o nome completo."); return; }
    setVinculando(true);
    try {
      const novoPaciente = await addPaciente(anamneseParaPaciente(dados));
      await salvarAnamnese(user.uid, novoPaciente.id, dados);
      toast(`Paciente ${novoPaciente.nome} criado com anamnese.`);
      setModalVincular(false);
      if (navegar) navegar("ficha", novoPaciente.id);
    } catch (e) { console.error(e); toast("Erro ao criar paciente."); }
    finally { setVinculando(false); }
  };

  const vincularExistente = async (paciente) => {
    setVinculando(true);
    try {
      await salvarAnamnese(user.uid, paciente.id, dados);
      toast(`Anamnese vinculada a ${paciente.nome}.`);
      setModalVincular(false);
      if (navegar) navegar("ficha", paciente.id);
    } catch (e) { console.error(e); toast("Erro ao vincular."); }
    finally { setVinculando(false); }
  };

  if (carregando) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 size={24} className="spin" color="var(--inkFaint)" /></div>;
  }

  const temConteudo = Object.values(dados).some((v) => v);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Anamnese</h2>
          <p style={{ fontSize: 13, color: "var(--inkFaint)", margin: "4px 0 0" }}>
            {global ? "Preencha a ficha e exporte ou vincule a um paciente." : `Ficha clínica${pacienteNome ? ` de ${pacienteNome}` : ""}.`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={exportarPdf} disabled={!temConteudo} className="btn btn-ghost" style={{ opacity: temConteudo ? 1 : 0.5 }}>
            <FileText size={15} /> Exportar PDF
          </button>
          {global ? (
            <button onClick={() => setModalVincular(true)} disabled={!temConteudo} className="btn btn-primary" style={{ opacity: temConteudo ? 1 : 0.5 }}>
              <UserPlus size={15} /> Vincular a paciente
            </button>
          ) : (
            <button onClick={salvar} disabled={salvando || !sujo} className="btn btn-primary" style={{ opacity: sujo ? 1 : 0.5 }}>
              {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : <><Save size={15} /> Salvar</>}
            </button>
          )}
        </div>
      </div>

      {SECOES_ANAMNESE.map((s, i) => (
        <SecaoCard key={s.id} secao={s} dados={dados} onChange={set} abertaInicial={i === 0} />
      ))}

      {/* Seção especial: depleção por medicamentos */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 12, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Medicamentos e depleção nutricional</span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 16 }}>
          Selecione os medicamentos em uso para identificar nutrientes que podem precisar de atenção no protocolo.
        </p>
        <DeplecaoMedicamentos
          valor={dados.medicamentosLista || []}
          onChange={(lista) => set("medicamentosLista", lista)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 10 }}>
        <button onClick={exportarPdf} disabled={!temConteudo} className="btn btn-ghost" style={{ opacity: temConteudo ? 1 : 0.5 }}>
          <FileText size={15} /> Exportar PDF
        </button>
        {global ? (
          <button onClick={() => setModalVincular(true)} disabled={!temConteudo} className="btn btn-primary" style={{ opacity: temConteudo ? 1 : 0.5 }}>
            <UserPlus size={15} /> Vincular a paciente
          </button>
        ) : (
          <button onClick={salvar} disabled={salvando || !sujo} className="btn btn-primary" style={{ opacity: sujo ? 1 : 0.5 }}>
            {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : sujo ? <><Save size={15} /> Salvar</> : <><Check size={15} /> Tudo salvo</>}
          </button>
        )}
      </div>

      {modalVincular && (
        <ModalVincular
          pacientes={pacientes.filter((p) => !p.excluidoEm)}
          onVincularExistente={vincularExistente}
          onCriarNovo={criarNovo}
          onFechar={() => setModalVincular(false)}
          salvando={vinculando}
        />
      )}
    </div>
  );
}
