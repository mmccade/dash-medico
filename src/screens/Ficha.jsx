// src/screens/Ficha.jsx
// + Toggle ativo/inativo no header com animação
// + Modal de desativação com motivo
// + Metas no modal editar paciente (peso, IMC, visceral)
// + InputData em todos os campos de data
// + PDF de meta batida disponível quando bater

import { useState, useEffect } from "react";
import { ArrowLeft, Trash2, Stethoscope, FileText, ChevronDown, Pencil, X, Loader2, Check, Trophy, Activity, FlaskConical, ClipboardList, Pill, Target, Clock, GitCompare, Plus, Minus, Sparkles } from "lucide-react";
import PlanejadorSuplementos from "../components/PlanejadorSuplementos.jsx";
import Exames from "./Exames.jsx";
import ExamesComparacao from "./ExamesComparacao.jsx";
import Anamnese from "./Anamnese.jsx";
import Protocolo from "./Protocolo.jsx";
import PlanoAcompanhamento from "./PlanoAcompanhamento.jsx";
import SilhuetaAplicacao, { nomeLocal } from "../components/SilhuetaAplicacao.jsx";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { imc, br, fmtData, primeiroCiclo, ultimoCiclo, perdaPeso, mesesTrat, parseNum, imcMeta, metaPesoBatida, metaVisceralBatida, massaMagraKg, gerarTimeline, gerarResumo, progressoMetaFinal, deltaMetaMes, metaDoMes } from "../lib/utils.js";
import { listarExames } from "../services/db-exames.js";
import { getSugestoes } from "../lib/biomarcadores.js";
import { useAuth } from "../lib/auth.jsx";
import { Avatar, Toggle } from "../components/ui.jsx";
import { LinhaChart } from "../components/charts.jsx";
import { useIsMobile } from "../components/Shell.jsx";
import { baixarPdfPaciente, baixarPdfMetaBatida, baixarPdfCiclo } from "../services/pdf.js";
import { baixarPdfPlano } from "../services/pdf-clinico.js";
import { validateCiclo, validatePaciente, primeiroErro } from "../lib/validate.js";
import { InputDecimal, InputInteiro, InputData, numeroParaMascara } from "../components/inputs.jsx";
import ModalDesativar from "../components/ModalDesativar.jsx";

// ─── Tela de sucesso pós-edição ──────────────────────────────
function TelaEdicaoSucesso({ onFechar }) {
  const [segundos, setSegundos] = useState(5);

  useEffect(() => {
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) { clearInterval(t); onFechar(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onFechar]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 400, padding: "40px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--goodSoft, #d1f5e8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Check size={30} color="var(--good)" strokeWidth={2.5} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Informações salvas!</h2>
        <p style={{ fontSize: 13.5, color: "var(--inkSoft)", marginBottom: 28, lineHeight: 1.5 }}>
          As alterações foram salvas com sucesso.
        </p>
        <button onClick={onFechar} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Voltar
        </button>
        <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 14 }}>
          Fechando automaticamente em {segundos}s…
        </p>
      </div>
    </div>
  );
}

// ─── Modal de confirmação de edição ──────────────────────────
function ModalConfirmacaoEdicao({ titulo, campos, salvando, onConfirmar, onEditar, onFechar }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 480, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{titulo}</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: "var(--inkSoft)", marginBottom: 20 }}>Confira suas alterações antes de salvar.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 22, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
          {campos.map((c, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "11px 14px", gap: 12,
              background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)",
            }}>
              <span style={{ fontSize: 12.5, color: "var(--inkFaint)", fontWeight: 600, minWidth: 120, flexShrink: 0 }}>{c.label}</span>
              <span style={{ fontSize: 13, color: "var(--ink)", textAlign: "right", wordBreak: "break-word", maxWidth: "60%" }}>{c.valor || "—"}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onEditar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
            <Pencil size={14} /> Editar
          </button>
          <button onClick={onConfirmar} disabled={salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
            {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : <><Check size={14} /> Está certo, salvar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de filtro de PDF ───────────────────────────────────
function ModalFiltroPdf({ ciclos, onGerar, onFechar }) {
  const [modo, setModo] = useState("total");
  const [selecionados, setSelecionados] = useState(new Set(ciclos.map((_, i) => i)));

  const toggleIdx = (idx) => setSelecionados((prev) => {
    const next = new Set(prev);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return next;
  });

  const toggleTodos = () => {
    if (selecionados.size === ciclos.length) setSelecionados(new Set());
    else setSelecionados(new Set(ciclos.map((_, i) => i)));
  };

  const confirmar = () => {
    if (modo === "total") { onGerar(null); return; }
    const indices = [...selecionados].sort((a, b) => a - b);
    if (indices.length === 0) return;
    onGerar(indices);
  };

  const podeGerar = modo === "total" || selecionados.size > 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 440, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Gerar PDF do paciente</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {[["total", "Todos os ciclos"], ["selecionados", "Ciclos selecionados"]].map(([k, l]) => (
            <button key={k} onClick={() => setModo(k)} style={{
              flex: 1, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600,
              background: modo === k ? "var(--surface)" : "transparent",
              color: modo === k ? "var(--brand)" : "var(--inkFaint)",
              boxShadow: modo === k ? "0 1px 3px rgba(0,0,0,.08)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {modo === "selecionados" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12.5, color: "var(--inkFaint)", fontWeight: 600 }}>
                {selecionados.size} de {ciclos.length} selecionados
              </span>
              <button onClick={toggleTodos} style={{ fontSize: 12.5, color: "var(--brand)", fontWeight: 600 }}>
                {selecionados.size === ciclos.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
              {ciclos.map((c, i) => (
                <label key={i} onClick={() => toggleIdx(i)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  background: selecionados.has(i) ? "var(--brandSoft)" : "var(--surface2)",
                  borderRadius: 10, cursor: "pointer",
                  border: selecionados.has(i) ? "1px solid var(--brand)" : "1px solid transparent",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    background: selecionados.has(i) ? "var(--brand)" : "var(--surface)",
                    border: selecionados.has(i) ? "none" : "1.5px solid var(--line)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {selecionados.has(i) && <Check size={11} color="#fff" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.mes}</div>
                    <div style={{ fontSize: 12, color: "var(--inkFaint)" }}>
                      {c.data ? fmtData(c.data) : ""} · {br(c.peso)} kg
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {modo === "total" && (
          <div style={{ padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, fontSize: 13, color: "var(--inkSoft)", marginBottom: 20 }}>
            O PDF incluirá todos os {ciclos.length} ciclo{ciclos.length !== 1 ? "s" : ""} do paciente.
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onFechar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
          <button onClick={confirmar} disabled={!podeGerar} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", opacity: podeGerar ? 1 : 0.5 }}>
            <FileText size={14} /> Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal editar ciclo ──────────────────────────────────────
function ModalEditarCiclo({ ciclo, alturaBase, onSalvar, onFechar }) {
  const [f, setF] = useState({
    ...ciclo,
    data: ciclo.data || "",
    altura: alturaBase ? String(Math.round(alturaBase * 100)) : "",
    peso: numeroParaMascara(ciclo.peso, 4, 1),
    gordura: numeroParaMascara(ciclo.gordura, 3, 1),
    massaMagra: ciclo.massaMagra != null ? numeroParaMascara(ciclo.massaMagra, 4, 1) : "",
    visceral: ciclo.visceral != null ? String(ciclo.visceral) : "",
    d1: ciclo.unidade === "MG" ? numeroParaMascara(ciclo.doses?.[0], 3, 1) : String(ciclo.doses?.[0] ?? ""),
    d2: ciclo.unidade === "MG" ? numeroParaMascara(ciclo.doses?.[1], 3, 1) : String(ciclo.doses?.[1] ?? ""),
    d3: ciclo.unidade === "MG" ? numeroParaMascara(ciclo.doses?.[2], 3, 1) : String(ciclo.doses?.[2] ?? ""),
    d4: ciclo.unidade === "MG" ? numeroParaMascara(ciclo.doses?.[3], 3, 1) : String(ciclo.doses?.[3] ?? ""),
  });
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState("form"); // "form" | "revisar" | "sucesso"
  const [dadosValidados, setDadosValidados] = useState(null);
  const toast = useToast();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const pesoNum = parseNum(f.peso);
  const altNum  = parseNum(f.altura);
  const altMetros = altNum >= 100 ? altNum / 100 : altNum;
  const imcCalc = pesoNum > 0 && altMetros > 0 ? +(pesoNum / (altMetros * altMetros)).toFixed(1) : null;

  const irParaConfirmacao = () => {
    const raw = { ...f, doses: [f.d1, f.d2, f.d3, f.d4].map((d) => parseNum(d)) };
    const { data, errors } = validateCiclo(raw);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    setDadosValidados(data);
    setEtapa("revisar");
  };

  const salvar = async () => {
    if (!dadosValidados) return;
    setSalvando(true);
    try {
      await onSalvar(dadosValidados);
      setEtapa("sucesso");
    } catch (e) {
      console.error("Erro ao salvar ciclo", e);
      toast("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const isMG = (f.unidade || "MG") === "MG";

  if (etapa === "sucesso") return <TelaEdicaoSucesso onFechar={onFechar} />;

  if (etapa === "revisar" && dadosValidados) return (
    <ModalConfirmacaoEdicao
      titulo={`Revisar edição — ciclo ${ciclo.mes}`}
      campos={[
        { label: "Data", valor: dadosValidados.data ? fmtData(dadosValidados.data) : "—" },
        { label: "Peso", valor: `${br(dadosValidados.peso)} kg` },
        { label: "% Gordura", valor: dadosValidados.gordura ? `${br(dadosValidados.gordura)}%` : "—" },
        { label: "Massa magra", valor: dadosValidados.massaMagra ? `${br(dadosValidados.massaMagra)} kg` : "—" },
        { label: "Gordura visceral", valor: dadosValidados.visceral || "—" },
        { label: "Doses (S1-S4)", valor: dadosValidados.doses.map(d => br(d)).join(" · ") + ` ${dadosValidados.unidade?.toLowerCase()}` },
        { label: "Onde aplicou", valor: dadosValidados.local },
        { label: "Local no corpo", valor: dadosValidados.localAplicacao ? nomeLocal(dadosValidados.localAplicacao) : "—" },
        { label: "Suplementação", valor: dadosValidados.suplementacao || "—" },
        { label: "Colaterais", valor: dadosValidados.colaterais || "—" },
        { label: "Observações", valor: dadosValidados.obs || "—" },
      ]}
      salvando={salvando}
      onConfirmar={salvar}
      onEditar={() => setEtapa("form")}
      onFechar={onFechar}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 520, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Editar ciclo · {ciclo.mes}</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Data</label>
              <InputData value={f.data} onChange={(v) => set("data", v)} />
            </div>
            <div className="field">
              <label>Mês</label>
              <input value={f.mes} onChange={(e) => set("mes", e.target.value)} maxLength={20}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Peso (kg) *</label>
              <InputDecimal value={f.peso} onChange={(v) => set("peso", v)} placeholder="109,5" digitos={4} decimais={1} />
            </div>
            <div className="field">
              <label>Altura (cm) <span style={{ fontSize: 11, color: "var(--inkFaint)" }}>opc.</span></label>
              <InputInteiro value={f.altura} onChange={(v) => set("altura", v)} placeholder="164" max={250} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>IMC</div>
              <div style={{
                padding: "9px 12px", borderRadius: 9, background: "var(--surface2)",
                border: "1px solid var(--line)", fontSize: 16, fontWeight: 700,
                color: imcCalc ? "var(--brand)" : "var(--inkFaint)",
                minHeight: 40, display: "flex", alignItems: "center",
              }}>
                {imcCalc ? String(imcCalc).replace(".", ",") : "—"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>% Gordura</label>
              <InputDecimal value={f.gordura} onChange={(v) => set("gordura", v)} placeholder="34,0" digitos={3} decimais={1} />
            </div>
            <div className="field">
              <label>Massa magra (kg)</label>
              <InputDecimal value={f.massaMagra} onChange={(v) => set("massaMagra", v)} placeholder="62,5" digitos={4} decimais={1} />
            </div>
            <div className="field">
              <label>Gordura visceral</label>
              <InputInteiro value={f.visceral} onChange={(v) => set("visceral", v)} placeholder="9" max={50} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--inkFaint)", display: "block", marginBottom: 8 }}>Doses semanais ({f.unidade || "MG"})</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[["d1","S1"],["d2","S2"],["d3","S3"],["d4","S4"]].map(([k,l]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "var(--inkFaint)", marginBottom: 4 }}>{l}</div>
                  {isMG
                    ? <InputDecimal value={f[k]} onChange={(v) => set(k, v)} placeholder="2,5" digitos={3} decimais={1} />
                    : <InputInteiro value={f[k]} onChange={(v) => set(k, v)} placeholder="20" max={99} />
                  }
                </div>
              ))}
            </div>
          </div>

          <div className="field"><label>Onde aplicou</label>
            <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
              {["Casa","Clínica"].map((o) => (
                <button key={o} onClick={() => set("local", o)} style={{ borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, background: f.local === o ? "var(--surface)" : "transparent", color: f.local === o ? "var(--brand)" : "var(--inkFaint)" }}>{o}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Local de aplicação no corpo</label>
            <div style={{ marginTop: 8 }}>
              <SilhuetaAplicacao valor={f.localAplicacao || ""} onChange={(v) => set("localAplicacao", v)} />
            </div>
          </div>

          <Campo label="Suplementação" v={f.suplementacao} on={(v) => set("suplementacao", v)} max={500} />
          <CampoTextarea label="Colaterais" v={f.colaterais} on={(v) => set("colaterais", v)} max={1000} />
          <CampoTextarea label="Observações" v={f.obs} on={(v) => set("obs", v)} max={2000} />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onFechar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
            <button onClick={irParaConfirmacao} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              <Check size={14} /> Revisar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal editar paciente — com metas + IMC meta ─────────────
function ModalEditarPaciente({ p, onSalvar, onFechar }) {
  const [f, setF] = useState({
    nome: p.nome,
    idade: p.idade != null ? String(p.idade) : "",
    altura: p.altura ? String(Math.round(p.altura * 100)) : "",
    sexo: p.sexo,
    inicio: p.inicio,
    objetivo: p.objetivo,
    comorbidades: p.comorbidades,
    pesoMeta: p.pesoMeta ? numeroParaMascara(p.pesoMeta, 4, 1) : "",
    visceralMeta: p.visceralMeta != null ? String(p.visceralMeta) : "",
  });
  // Metas mensais: [{ mes: "Jun/26", peso: "85,0" }, ...]
  const [metasMensais, setMetasMensais] = useState(
    (p.metasMensais || []).map((m) => ({ mes: m.mes, peso: numeroParaMascara(m.peso, 4, 1) }))
  );
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState("form"); // "form" | "revisar" | "sucesso"
  const [dadosValidados, setDadosValidados] = useState(null);
  const toast = useToast();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const addMetaMes = () => setMetasMensais((ms) => [...ms, { mes: "", peso: "" }]);
  const setMetaMes = (i, k, v) => setMetasMensais((ms) => ms.map((m, j) => j === i ? { ...m, [k]: v } : m));
  const removeMetaMes = (i) => setMetasMensais((ms) => ms.filter((_, j) => j !== i));

  const pesoMetaNum = parseNum(f.pesoMeta);
  const altNum = parseNum(f.altura);
  const altMetros2 = altNum >= 100 ? altNum / 100 : altNum;
  const imcMetaCalc = pesoMetaNum > 0 && altMetros2 > 0 ? imcMeta(pesoMetaNum, altMetros2) : null;

  const irParaConfirmacao = () => {
    const { data, errors } = validatePaciente(f);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    const pesoMeta = parseNum(f.pesoMeta) || null;
    const visceralMeta = parseNum(f.visceralMeta) || null;
    const metasMensaisLimpas = metasMensais
      .filter((m) => m.mes.trim() && m.peso)
      .map((m) => ({ mes: m.mes.trim(), peso: parseNum(m.peso) }));
    setDadosValidados({ ...data, pesoMeta, visceralMeta, metasMensais: metasMensaisLimpas });
    setEtapa("revisar");
  };

  const salvar = async () => {
    if (!dadosValidados) return;
    setSalvando(true);
    try {
      await onSalvar(dadosValidados);
      setEtapa("sucesso");
    } catch (e) {
      console.error("Erro ao salvar paciente", e);
      toast("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const inpStyle = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", color: "var(--ink)", boxSizing: "border-box" };

  if (etapa === "sucesso") return <TelaEdicaoSucesso onFechar={onFechar} />;

  if (etapa === "revisar" && dadosValidados) return (
    <ModalConfirmacaoEdicao
      titulo="Revisar edição do paciente"
      campos={[
        { label: "Nome", valor: dadosValidados.nome },
        { label: "Idade", valor: dadosValidados.idade ? `${dadosValidados.idade} anos` : "—" },
        { label: "Altura", valor: dadosValidados.altura ? `${Math.round(dadosValidados.altura * 100)} cm` : "—" },
        { label: "Sexo", valor: dadosValidados.sexo },
        { label: "Início", valor: fmtData(dadosValidados.inicio) },
        { label: "Objetivo", valor: dadosValidados.objetivo },
        { label: "Condições relatadas", valor: dadosValidados.comorbidades },
        { label: "Peso meta", valor: dadosValidados.pesoMeta ? `${br(dadosValidados.pesoMeta)} kg` : "—" },
        { label: "Visceral meta", valor: dadosValidados.visceralMeta ?? "—" },
      ]}
      salvando={salvando}
      onConfirmar={salvar}
      onEditar={() => setEtapa("form")}
      onFechar={onFechar}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 520, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Editar paciente</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div className="field"><label>Nome *</label>
            <input style={inpStyle} value={f.nome} onChange={(e) => set("nome", e.target.value)} maxLength={150} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Idade</label>
              <InputInteiro value={f.idade} onChange={(v) => set("idade", v)} placeholder="42" max={130} style={inpStyle} />
            </div>
            <div className="field">
              <label>Altura (cm)</label>
              <InputInteiro value={f.altura} onChange={(v) => set("altura", v)} placeholder="164" max={250} style={inpStyle} />
            </div>
          </div>

          <div className="field"><label>Sexo</label>
            <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
              {["Feminino","Masculino"].map((s) => (
                <button key={s} onClick={() => set("sexo", s)} style={{ borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, background: f.sexo === s ? "var(--surface)" : "transparent", color: f.sexo === s ? "var(--brand)" : "var(--inkFaint)" }}>{s}</button>
              ))}
            </div>
          </div>

          <div className="field"><label>Início do tratamento</label>
            <InputData value={f.inicio} onChange={(v) => set("inicio", v)} style={inpStyle} />
          </div>

          <div className="field"><label>Objetivo</label>
            <input style={inpStyle} value={f.objetivo} onChange={(e) => set("objetivo", e.target.value)} maxLength={300} />
          </div>
          <div className="field"><label>Condições relatadas</label>
            <input style={inpStyle} value={f.comorbidades} onChange={(e) => set("comorbidades", e.target.value)} maxLength={300} />
          </div>

          {/* Metas */}
          <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "14px 14px 10px", marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--inkSoft)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>Metas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "flex-end" }}>
              <div className="field">
                <label>Peso meta (kg)</label>
                <InputDecimal value={f.pesoMeta} onChange={(v) => set("pesoMeta", v)} placeholder="70,0" digitos={4} decimais={1} style={inpStyle} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 6 }}>IMC meta</div>
                <div style={{ padding: "9px 12px", borderRadius: 9, background: "var(--surface)", border: "1px solid var(--line)", fontSize: 14, fontWeight: 700, color: imcMetaCalc ? "var(--brand)" : "var(--inkFaint)", minHeight: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {imcMetaCalc ? String(imcMetaCalc).replace(".", ",") : "—"}
                </div>
              </div>
              <div className="field">
                <label>Visceral meta</label>
                <InputInteiro value={f.visceralMeta} onChange={(v) => set("visceralMeta", v)} placeholder="9" max={50} style={inpStyle} />
              </div>
            </div>
          </div>

          {/* Metas mensais */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Metas mensais de peso</label>
              <button type="button" onClick={addMetaMes} className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px", gap: 5 }}>
                <Plus size={13} /> Adicionar mês
              </button>
            </div>
            {metasMensais.length === 0 && (
              <div style={{ fontSize: 12.5, color: "var(--inkFaint)", fontStyle: "italic" }}>Nenhuma meta mensal definida.</div>
            )}
            {metasMensais.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input value={m.mes} onChange={(e) => setMetaMes(i, "mes", e.target.value)}
                  placeholder="Jun/26" style={inpStyle} maxLength={8} />
                <InputDecimal value={m.peso} onChange={(v) => setMetaMes(i, "peso", v)}
                  digitos={4} decimais={1} placeholder="85,0" style={inpStyle} />
                <button type="button" onClick={() => removeMetaMes(i)} style={{ color: "var(--bad,#c0392b)", padding: 4, borderRadius: 7 }}>
                  <Minus size={15} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onFechar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
            <button onClick={irParaConfirmacao} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              <Check size={14} /> Revisar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, v, on, max }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={v || ""} onChange={(e) => on(e.target.value)} maxLength={max}
        style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", boxSizing: "border-box" }} />
    </div>
  );
}
function CampoTextarea({ label, v, on, max }) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea value={v || ""} onChange={(e) => on(e.target.value)} maxLength={max} rows={3}
        style={{ padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", boxSizing: "border-box", minHeight: 72, resize: "vertical", fontFamily: "inherit" }} />
    </div>
  );
}

function Delta({ atual, anterior, bom = "baixo", unit = "" }) {
  if (anterior == null || atual == null) return null;
  const diff = +(atual - anterior).toFixed(1);
  if (diff === 0) return null;
  const positivo = bom === "baixo" ? diff < 0 : diff > 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: positivo ? "var(--good)" : "var(--warn)", marginLeft: 4 }}>
      {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}{unit}
    </span>
  );
}

// ─── Tela principal ───────────────────────────────────────────
export default function Ficha({ pacienteId, navegar, abaInicial }) {
  const { getPaciente, config, editarCiclo, excluirCiclo, editarPaciente, toggleAtivo, desativarPaciente, moverParaLixeira } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const isMobile = useIsMobile();
  const p = getPaciente(pacienteId);
  const [aberto, setAberto] = useState(p && p.ciclos.length ? p.ciclos.length - 1 : -1);
  const [editandoCicloIdx, setEditandoCicloIdx] = useState(null);
  const [editandoPaciente, setEditandoPaciente] = useState(false);
  const [excluindoIdx, setExcluindoIdx] = useState(null);
  const [modalPdf, setModalPdf] = useState(false);
  const [modalDesativar, setModalDesativar] = useState(false);
  const [animarSaindo, setAnimarSaindo] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState(abaInicial || "ciclos");
  const [subViewExames, setSubViewExames] = useState("lista"); // "lista" | "comparar"
  const [examesLista, setExamesLista] = useState([]);

  // Carrega exames do paciente para timeline, resumo e comparação
  useEffect(() => {
    if (!user?.uid || !pacienteId) return;
    listarExames(user.uid, pacienteId)
      .then(setExamesLista)
      .catch(() => {});
  }, [user?.uid, pacienteId]);

  if (!p) { navegar("pacientes"); return null; }

  const gerarPdf = async (indices) => {
    toast("Gerando PDF…");
    try {
      const pacParaPdf = indices ? { ...p, ciclos: indices.map((i) => p.ciclos[i]) } : p;
      await baixarPdfPaciente(pacParaPdf, config);
      toast("PDF gerado");
    } catch (e) { console.error(e); toast("Erro ao gerar PDF"); }
    setModalPdf(false);
  };

  const handleExcluirCiclo = async (idx) => {
    if (!window.confirm(`Excluir o ciclo "${p.ciclos[idx].mes}"? Essa ação não pode ser desfeita.`)) return;
    setExcluindoIdx(idx);
    try { await excluirCiclo(p.id, idx); toast("Ciclo excluído"); setAberto(-1); }
    catch (e) { console.error(e); toast("Erro ao excluir ciclo"); }
    setExcluindoIdx(null);
  };

  const handleToggleAtivo = () => {
    if (p.ativo) {
      setModalDesativar(true);
    } else {
      setAnimarSaindo(true);
      setTimeout(async () => {
        await toggleAtivo(p.id);
        setAnimarSaindo(false);
        toast("Paciente reativado");
      }, 250);
    }
  };

  const confirmarDesativacao = async (motivo, detalhes) => {
    setAnimarSaindo(true);
    await new Promise((r) => setTimeout(r, 250));
    await desativarPaciente(p.id, motivo, detalhes);
    toast("Paciente desativado");
    setAnimarSaindo(false);
  };

  const handleMoverLixeira = async () => {
    if (!window.confirm(`Mover ${p.nome} para a lixeira? Você pode restaurá-lo por 30 dias em Pacientes > Lixeira.`)) return;
    await moverParaLixeira(p.id);
    navegar("pacientes");
  };

  const baixarPdfMeta = async (paciente, mensagem) => {
    try {
      await baixarPdfMetaBatida(paciente, config, mensagem);
      toast("PDF de meta gerado");
    } catch (e) { console.error(e); toast("Erro ao gerar PDF"); }
  };

  const meta = p.pesoMeta;
  const u = p.ciclos.length ? ultimoCiclo(p) : null;
  const f0 = p.ciclos.length ? primeiroCiclo(p) : null;
  let progresso = null;
  if (meta && f0 && u && f0.peso > meta) {
    progresso = Math.min(100, Math.round(((f0.peso - u.peso) / (f0.peso - meta)) * 100));
  }

  const pesoBatido = metaPesoBatida(p);
  const visceralBatido = metaVisceralBatida(p);
  const algumaMetaBatida = pesoBatido || visceralBatido;

  const Header = (
    <>
      <style>{`
        @keyframes ficha-sai { 0% { opacity:1; transform: scale(1); } 100% { opacity:0; transform: scale(0.97); } }
        .ficha-saindo { animation: ficha-sai 0.25s ease-out forwards; }
      `}</style>
      <button onClick={() => navegar("pacientes")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13, marginBottom: 18 }}>
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar nome={p.nome} lg />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, letterSpacing: -0.3, marginBottom: 5, wordBreak: "break-word" }}>{p.nome}</h1>
              <button onClick={() => setEditandoPaciente(true)} title="Editar" style={{ color: "var(--inkFaint)", padding: 4, borderRadius: 7, marginTop: -4 }}>
                <Pencil size={15} />
              </button>
              {!p.ativo && (
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: "3px 9px", borderRadius: 99, background: "var(--surface2)", color: "var(--inkFaint)" }}>
                  INATIVO
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--inkSoft)" }}>
              <span>{p.idade} anos</span><span>·</span><span>{p.sexo}</span><span>·</span>
              <span>{br(Number(p.altura).toFixed(2))} m</span><span>·</span><span>Início {fmtData(p.inicio)}</span>
              {meta && <><span>·</span><span style={{ color: "var(--brand)", fontWeight: 600 }}>Meta: {br(meta)} kg</span></>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", width: isMobile ? "100%" : "auto", flexWrap: "wrap" }}>
          {/* Toggle ativo/inativo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--surface2)", borderRadius: 10 }}>
            <Toggle on={p.ativo} onClick={handleToggleAtivo} />
          </div>
          {algumaMetaBatida && (
            <button className="btn btn-ghost" style={{ background: "var(--brandSoft)", color: "var(--good)", fontWeight: 700 }} onClick={() => baixarPdfMeta(p, "Parabéns pela conquista! É uma honra ter participado dessa jornada com você.")}>
              <Trophy size={15} /> Baixar PDF de meta batida
            </button>
          )}
          <button className="btn btn-ghost" onClick={handleMoverLixeira} style={{ flex: isMobile ? 1 : "none", color: "var(--inkFaint)" }}>
            <Trash2 size={15} /> Lixeira
          </button>
          <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={() => navegar("novociclo", p.id)}>
            <Stethoscope size={16} /> Novo ciclo
          </button>
          <button className="btn btn-primary" style={{ flex: isMobile ? 1 : "none" }} onClick={() => p.ciclos.length ? setModalPdf(true) : toast("Paciente sem ciclos")}>
            <FileText size={16} /> PDF do paciente
          </button>
        </div>
      </div>

      {/* Notificação de meta batida */}
      {algumaMetaBatida && (
        <div style={{ marginBottom: 16, padding: "14px 18px", background: "linear-gradient(90deg, var(--brandSoft), transparent)", borderLeft: "4px solid var(--good)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <Trophy size={22} color="var(--good)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--good)" }}>
              {pesoBatido && visceralBatido ? "Metas batidas!" : pesoBatido ? "Meta de peso batida!" : "Meta de gordura visceral batida!"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--inkSoft)" }}>
              Considere gerar o PDF de parabenização e celebrar com o paciente.
            </div>
          </div>
        </div>
      )}

      {meta && progresso !== null && (
        <div style={{ marginBottom: 16, padding: "14px 18px", background: "var(--surface2)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 8 }}>
            <span>Progresso para a meta ({br(meta)} kg)</span>
            <span style={{ fontWeight: 700, color: "var(--brand)" }}>{progressoMeta}%</span>
          </div>
          <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${progressoMeta}%`, height: "100%", background: "var(--brand)", borderRadius: 99, transition: "width 0.4s" }} />
          </div>
        </div>
      )}

      <div style={{ padding: "16px 18px", background: "var(--surface2)", borderRadius: 12, display: "flex", gap: isMobile ? 14 : 40, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", marginBottom: 24 }}>
        <div><div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Objetivo</div><div style={{ fontSize: 13.5 }}>{p.objetivo}</div></div>
        <div><div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Condições relatadas</div><div style={{ fontSize: 13.5 }}>{p.comorbidades}</div></div>
      </div>
    </>
  );

  const genero = p.sexo === "Masculino" ? "M" : "F";
  const resumoTexto = gerarResumo(p, examesLista);
  const timeline = gerarTimeline(p, examesLista);
  const progressoMeta = progressoMetaFinal(p);

  const CardResumo = resumoTexto ? (
    <div style={{ background: "linear-gradient(135deg, var(--brandSoft,#d1f5e8), var(--surface))", border: "1px solid var(--brand,#0d7a82)22", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>🩺</div>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: ".4px", marginBottom: 5 }}>Resumo clínico</div>
        <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.65 }}>{resumoTexto}</div>
        {progressoMeta != null && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--inkFaint)", marginBottom: 4 }}>
              <span>Progresso até a meta</span><span style={{ fontWeight: 700, color: "var(--brand)" }}>{progressoMeta}%</span>
            </div>
            <div style={{ height: 6, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressoMeta}%`, background: "var(--brand)", borderRadius: 99, transition: "width .4s" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  const Tabs = (
    <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 12, padding: 4, marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      {[
        { id: "ciclos",    label: "Ciclos",      Icon: Activity },
        { id: "plano",     label: "Plano",       Icon: Target },
        { id: "exames",    label: "Exames",      Icon: FlaskConical },
        { id: "timeline",  label: "Timeline",    Icon: Clock },
        { id: "anamnese",  label: "Anamnese",    Icon: ClipboardList },
        { id: "protocolo",    label: "Medicamentos", Icon: Pill },
        { id: "suplementos",  label: "Suplementos",  Icon: Sparkles },
      ].map((t) => (
        <button key={t.id} onClick={() => { setAbaAtiva(t.id); setSubViewExames("lista"); }} style={{
          flex: "0 0 auto",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
          background: abaAtiva === t.id ? "var(--surface)" : "transparent",
          color: abaAtiva === t.id ? "var(--brand)" : "var(--inkFaint)",
          boxShadow: abaAtiva === t.id ? "0 1px 3px rgba(0,0,0,.08)" : "none",
          transition: "all 0.15s",
        }}>
          <t.Icon size={14} /> {t.label}
        </button>
      ))}
    </div>
  );

  // ─── Painel Exames com sub-view de comparação ───────────────
  const PainelExames = subViewExames === "comparar" ? (
    <ExamesComparacao
      exames={examesLista}
      genero={genero}
      onVoltar={() => setSubViewExames("lista")}
    />
  ) : (
    <div>
      {examesLista.length >= 2 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button className="btn btn-ghost" style={{ fontSize: 13, gap: 7 }} onClick={() => setSubViewExames("comparar")}>
            <GitCompare size={15} /> Comparar exames
          </button>
        </div>
      )}
      <Exames pacienteId={p.id} pacienteGenero={genero} pacienteNome={p.nome} navegar={navegar} />
    </div>
  );

  // ─── Painel Timeline ─────────────────────────────────────────
  const CORES_TIPO = { inicio: "var(--brand)", ciclo: "#6b4fc4", meta: "#d4a017", exame: "#1d6fa8", anamnese: "var(--inkFaint)" };
  const ICONES_TIPO = { inicio: "🏁", ciclo: "📊", meta: "🏆", exame: "🔬", anamnese: "📋" };
  const PainelTimeline = (
    <div>
      {timeline.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--inkFaint)", fontSize: 14 }}>
          Nenhum evento registrado ainda.
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 36 }}>
          <div style={{ position: "absolute", left: 16, top: 0, bottom: 0, width: 2, background: "var(--line)", borderRadius: 2 }} />
          {timeline.map((ev, i) => (
            <div key={i} style={{ position: "relative", marginBottom: 24 }}>
              {/* Bolinha */}
              <div style={{ position: "absolute", left: -28, top: 2, width: 26, height: 26, borderRadius: "50%", background: "var(--surface)", border: `2px solid ${CORES_TIPO[ev.tipo] || "var(--line)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                {ICONES_TIPO[ev.tipo] || "•"}
              </div>
              {/* Data */}
              <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 3 }}>
                {ev.data ? new Date(ev.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : ""}
              </div>
              {/* Descrição principal */}
              <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600, lineHeight: 1.4 }}>{ev.desc}</div>
              {/* Detalhe */}
              {ev.detalhe && (
                <div style={{ fontSize: 12.5, color: "var(--inkSoft)", marginTop: 3 }}>{ev.detalhe}</div>
              )}
              {/* Link ver ciclo */}
              {ev.tipo === "ciclo" && ev.cicloIdx != null && (
                <button onClick={() => { setAbaAtiva("ciclos"); setTimeout(() => { const els = document.querySelectorAll("[data-ciclo-idx]"); if (els[ev.cicloIdx]) els[ev.cicloIdx].scrollIntoView({ behavior: "smooth", block: "center" }); }, 100); }}
                  style={{ fontSize: 12, color: "var(--brand)", marginTop: 5, textDecoration: "underline", fontWeight: 500 }}>
                  Ver detalhes do ciclo →
                </button>
              )}
              {ev.tipo === "exame" && (
                <button onClick={() => setAbaAtiva("exames")}
                  style={{ fontSize: 12, color: "var(--brand)", marginTop: 5, textDecoration: "underline", fontWeight: 500 }}>
                  Ver exames →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const PainelAnamnese = <Anamnese pacienteId={p.id} pacienteNome={p.nome} navegar={navegar} />;
  const PainelProtocolo = <Protocolo pacienteId={p.id} pacienteNome={p.nome} />;

  // Sugestões de suplemento baseadas nos últimos exames do paciente
  const sugestoesDosExames = (() => {
    if (!examesLista.length) return [];
    const ultimo = examesLista[examesLista.length - 1];
    const sugs = new Set();
    (ultimo.marcadores || []).forEach((m) => {
      if (!m.status || m.status === "normal") return;
      const lista = getSugestoes(m.nome, m.status) || [];
      lista.forEach((s) => sugs.add(s.split(" (")[0]));
    });
    return [...sugs].slice(0, 6);
  })();

  const PainelSuplemento = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {sugestoesDosExames.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, var(--brandSoft,#d1f5e8), var(--surface))", border: "1px solid var(--brand)22", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Sparkles size={15} color="var(--brand)" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: ".4px" }}>
              Sugestões baseadas nos últimos exames
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {sugestoesDosExames.map((s) => (
              <button key={s} onClick={async () => {
                const atual = p.suplementosProtocolo || [];
                if (!atual.includes(s)) {
                  await editarPaciente(p.id, { suplementosProtocolo: [...atual, s] });
                }
              }} style={{ fontSize: 12.5, padding: "5px 12px", borderRadius: 99, background: "var(--surface)", border: "1px solid var(--brand)", color: "var(--brand)", fontWeight: 600, cursor: "pointer" }}>
                + {s}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--inkFaint)", marginTop: 10, fontStyle: "italic" }}>
            Clique para adicionar ao protocolo. Conduta sob responsabilidade do médico.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Protocolo de suplementação</div>
        <PlanejadorSuplementos
          valor={p.suplementosProtocolo || []}
          onChange={async (lista) => await editarPaciente(p.id, { suplementosProtocolo: lista })}
          sugestoesDepleção={sugestoesDosExames}
        />
      </div>
    </div>
  );
  const gerarPdfPlano = async () => {
    toast("Gerando PDF do plano…");
    try { await baixarPdfPlano({ paciente: p, plano: p.plano, config }); toast("PDF gerado"); }
    catch (e) { console.error(e); toast("Erro ao gerar PDF"); }
  };
  const PainelPlano = (
    <div>
      {p.plano && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button className="btn btn-ghost" onClick={gerarPdfPlano} style={{ fontSize: 13 }}>
            <FileText size={14} /> PDF do plano
          </button>
        </div>
      )}
      <PlanoAcompanhamento pacienteId={p.id} pacienteNome={p.nome} />
    </div>
  );

  if (!p.ciclos.length) {
    return (
      <div className={animarSaindo ? "ficha-saindo" : ""}>
        {Header}
        {CardResumo}
        {Tabs}
        {abaAtiva === "exames" && PainelExames}
        {abaAtiva === "anamnese" && PainelAnamnese}
        {abaAtiva === "protocolo" && PainelProtocolo}
        {abaAtiva === "suplementos" && PainelSuplemento}
        {abaAtiva === "plano" && PainelPlano}
        {abaAtiva === "timeline" && PainelTimeline}
        {abaAtiva === "ciclos" && (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum ciclo registrado ainda</div>
            <div className="page-sub" style={{ marginBottom: 18 }}>Registre o primeiro ciclo mensal para começar a acompanhar a evolução.</div>
            <button className="btn btn-primary" style={{ display: "inline-flex" }} onClick={() => navegar("novociclo", p.id)}>
              <Stethoscope size={16} /> Registrar primeiro ciclo
            </button>
          </div>
        )}
        {editandoPaciente && <ModalEditarPaciente p={p} onSalvar={(d) => editarPaciente(p.id, d)} onFechar={() => setEditandoPaciente(false)} />}
        {modalDesativar && (
          <ModalDesativar paciente={p} onConfirmar={confirmarDesativacao} onFechar={() => setModalDesativar(false)} navegar={navegar} onBaixarPdfMeta={baixarPdfMeta} />
        )}
      </div>
    );
  }

  const serie = p.ciclos.map((c) => ({ x: c.mes, peso: c.peso, imc: imc(c.peso, p.altura), gordura: c.gordura, visceral: c.visceral, magra: massaMagraKg(c) }));
  const temMagra = serie.some((s) => s.magra != null);

  const Resumo = ({ label, value, unit, sub }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span className="tnum" style={{ fontSize: 26, fontWeight: 600 }}>{value}</span>
        {unit && <span style={{ fontSize: 12.5, color: "var(--inkFaint)" }}>{unit}</span>}
      </span>
      {sub && <span className="tnum" style={{ fontSize: 12, color: "var(--good)" }}>{sub}</span>}
    </div>
  );

  return (
    <div className={animarSaindo ? "ficha-saindo" : ""}>
      {Header}
      {CardResumo}
      {Tabs}

      {abaAtiva === "exames" && PainelExames}
      {abaAtiva === "anamnese" && PainelAnamnese}
      {abaAtiva === "protocolo" && PainelProtocolo}
      {abaAtiva === "suplementos" && PainelSuplemento}
      {abaAtiva === "plano" && PainelPlano}
      {abaAtiva === "timeline" && PainelTimeline}

      {abaAtiva === "ciclos" && (<>

      {/* Banner de alerta se paciente ficou muito tempo sem ciclo */}
      {(() => {
        const u = ultimoCiclo(p);
        const iso = u?.data || p.inicio;
        const dias = iso ? Math.floor((Date.now() - new Date(iso + "T12:00:00")) / 86400000) : null;
        if (!dias || dias < 30 || !p.ativo) return null;
        const cor = dias > 60 ? "#c0392b" : "#b45309";
        const bg  = dias > 60 ? "#fff0f0" : "#fff8e6";
        return (
          <div style={{ background: bg, border: `1px solid ${cor}22`, borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{dias > 60 ? "🔴" : "🟡"}</span>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: cor }}>
                {p.nome.split(" ")[0]} está há {dias} dias sem novo ciclo registrado
              </span>
              <div style={{ fontSize: 12, color: cor, opacity: .8, marginTop: 2 }}>
                {dias > 60 ? "Considere entrar em contato para verificar a adesão." : "Pode ser hora de agendar um retorno."}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="card" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))", gap: isMobile ? 18 : 24, padding: "22px 24px", marginBottom: 28 }}>
        <Resumo label="Tempo" value={mesesTrat(p.inicio)} unit="meses" />
        <Resumo label="Peso atual" value={br(ultimoCiclo(p).peso)} unit="kg" sub={`−${br(perdaPeso(p))} kg`} />
        <Resumo label="IMC" value={br(imc(ultimoCiclo(p).peso, p.altura))} sub={`era ${br(imc(primeiroCiclo(p).peso, p.altura))}`} />
        <Resumo label="% Gordura" value={br(ultimoCiclo(p).gordura)} unit="%" sub={`−${br(+(primeiroCiclo(p).gordura - ultimoCiclo(p).gordura).toFixed(1))} p.p.`} />
        {temMagra && (() => {
          const mAtual = massaMagraKg(ultimoCiclo(p));
          const mIni = massaMagraKg(primeiroCiclo(p));
          const delta = mAtual != null && mIni != null ? +(mAtual - mIni).toFixed(1) : null;
          return (
            <Resumo label="Massa magra" value={mAtual != null ? br(mAtual) : "—"} unit="kg"
              sub={delta != null ? `${delta >= 0 ? "+" : ""}${br(delta)} kg` : null} />
          );
        })()}
        <Resumo label="Visceral" value={ultimoCiclo(p).visceral} sub={`era ${primeiroCiclo(p).visceral}`} />
      </div>

      <h2 className="sec-title">Evolução ao longo do tratamento</h2>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(230px, 1fr))", gap: isMobile ? 10 : 14, marginBottom: 32 }}>
        <LinhaChart data={serie} dataKey="peso" title="Peso" unit="kg" />
        <LinhaChart data={serie} dataKey="imc" title="IMC" unit="kg/m²" />
        <LinhaChart data={serie} dataKey="gordura" colorKey="gord" color="var(--gord)" title="% Gordura" unit="%" />
        {temMagra && <LinhaChart data={serie} dataKey="magra" color="var(--good)" title="Massa magra" unit="kg" />}
        <LinhaChart data={serie} dataKey="visceral" color="var(--visc)" title="Visceral" unit="nível" />
      </div>

      <h2 className="sec-title">Ciclos mensais</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {p.ciclos.map((c, i) => {
          const open = aberto === i;
          const prev = i > 0 ? p.ciclos[i - 1] : null;
          return (
            <div key={i} className="card" style={{ overflow: "hidden", borderColor: open ? "var(--brand)" : "var(--line)" }}>
              <button onClick={() => setAberto(open ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", textAlign: "left" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flex: 1 }}>
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 80 }}>
                    <span style={{ fontSize: 15.5, fontWeight: 600 }}>{c.mes}</span>
                    {c.data && <span style={{ fontSize: 11, color: "var(--inkFaint)" }}>{fmtData(c.data)}</span>}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--inkSoft)" }}>
                    {br(c.peso)} kg
                    <Delta atual={c.peso} anterior={prev?.peso} bom="baixo" unit=" kg" />
                    {" · "}{br(c.gordura)}% gordura
                    <Delta atual={c.gordura} anterior={prev?.gordura} bom="baixo" unit="%" />
                    {massaMagraKg(c) != null && (
                      <>
                        {" · "}{br(massaMagraKg(c))} kg magra
                        <Delta atual={massaMagraKg(c)} anterior={prev ? massaMagraKg(prev) : null} bom="alto" unit=" kg" />
                      </>
                    )}
                  </span>
                  <span style={{ fontSize: 11.5, color: "var(--brand)", background: "var(--brandSoft)", padding: "3px 9px", borderRadius: 20, fontWeight: 600 }}>
                    {br(c.doses?.[c.doses.length - 1])} {c.unidade?.toLowerCase()} · {c.local}
                  </span>
                </span>
                <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); setEditandoCicloIdx(i); }} style={{ padding: 6, borderRadius: 7, color: "var(--inkFaint)" }} title="Editar ciclo">
                    <Pencil size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleExcluirCiclo(i); }} disabled={excluindoIdx === i} style={{ padding: 6, borderRadius: 7, color: "var(--inkFaint)" }} title="Excluir ciclo">
                    {excluindoIdx === i ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                  </button>
                  <ChevronDown size={18} style={{ color: "var(--inkFaint)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: 4 }} />
                </div>
              </button>

              {open && (
                <div style={{ padding: "4px 20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11.5, color: "var(--inkFaint)", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Titulação da dose · semana a semana</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                      {c.doses?.map((d, j) => (
                        <div key={j} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                          <div style={{ width: "100%", height: 48, background: "var(--surface2)", borderRadius: 7, position: "relative", overflow: "hidden", border: "1px solid var(--line)" }}>
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${Math.min((d / 15) * 100, 100)}%`, background: "var(--brandSoft)", borderTop: "2px solid var(--brand)" }} />
                            <span className="tnum" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{br(d)}</span>
                          </div>
                          <span style={{ fontSize: 10.5, color: "var(--inkFaint)" }}>Sem {j + 1}</span>
                        </div>
                      ))}
                      <span style={{ fontSize: 12, color: "var(--inkSoft)", fontWeight: 600, paddingBottom: 22 }}>{c.unidade?.toLowerCase()}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(120px, 1fr))", gap: 18 }}>
                    <div>
                      <KV k="Peso" v={`${br(c.peso)} kg`} />
                      {(() => {
                        const delta = deltaMetaMes(p, c);
                        if (delta == null) return null;
                        const ok = delta <= 0;
                        return (
                          <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 700, color: ok ? "var(--good)" : "var(--bad,#c0392b)", display: "flex", alignItems: "center", gap: 4 }}>
                            {ok ? "✓" : "↑"} {ok ? "Meta atingida" : `+${br(Math.abs(delta))} kg acima da meta`}
                            <span style={{ fontWeight: 400, color: "var(--inkFaint)" }}>({br(metaDoMes(p, c))} kg)</span>
                          </div>
                        );
                      })()}
                    </div>
                    <KV k="% Gordura" v={c.gordura != null ? `${br(c.gordura)}%` : "—"} />
                    <KV k="Massa magra" v={massaMagraKg(c) != null ? `${br(massaMagraKg(c))} kg` : "—"} />
                    <KV k="Gordura visceral" v={c.visceral != null ? c.visceral : "—"} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
                    <KV k="Medicação prescrita" v={c.medicacao} />
                    <KV k="Suplementação" v={c.suplementacao} />
                    <KV k="Onde aplicou" v={c.local} />
                    <KV k="Colaterais relatados" v={c.colaterais} />
                  </div>
                  {c.localAplicacao && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderTop: "1px solid var(--line)" }}>
                      <SilhuetaAplicacao valor={c.localAplicacao} somenteLeitura tamanho={130} />
                      <div>
                        <div style={{ fontSize: 11.5, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5 }}>Local de aplicação</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--brand)", marginTop: 3 }}>{nomeLocal(c.localAplicacao)}</div>
                      </div>
                    </div>
                  )}
                  <KV k="Observações do médico" v={c.obs} />
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => {
                        toast("Gerando PDF do ciclo…");
                        baixarPdfCiclo({ paciente: p, ciclo: c, config })
                          .then(() => toast("PDF gerado"))
                          .catch(() => toast("Erro ao gerar PDF"));
                      }}
                    >
                      <FileText size={13} /> PDF deste ciclo
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>)}

      {editandoCicloIdx !== null && (
        <ModalEditarCiclo ciclo={p.ciclos[editandoCicloIdx]} alturaBase={p.altura} onSalvar={(d) => editarCiclo(p.id, editandoCicloIdx, d)} onFechar={() => setEditandoCicloIdx(null)} />
      )}
      {editandoPaciente && (
        <ModalEditarPaciente p={p} onSalvar={(d) => editarPaciente(p.id, d)} onFechar={() => setEditandoPaciente(false)} />
      )}
      {modalPdf && (
        <ModalFiltroPdf ciclos={p.ciclos} onGerar={gerarPdf} onFechar={() => setModalPdf(false)} />
      )}
      {modalDesativar && (
        <ModalDesativar paciente={p} onConfirmar={confirmarDesativacao} onFechar={() => setModalDesativar(false)} navegar={navegar} onBaixarPdfMeta={baixarPdfMeta} />
      )}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 4 }}>{k}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{v || "—"}</div>
    </div>
  );
}
