// src/screens/Ficha.jsx
// Alterações desta versão:
//  - Botão PDF abre modal de filtro: Total ou meses selecionados por checkboxes
//  - Data de referência (DD/MM/AAAA) exibida no header de cada ciclo
//  - Indicador ▲▼ por ciclo comparando com anterior
//  - Editar ciclo / excluir ciclo / editar dados do paciente
//  - Barra de progresso da meta de peso

import { useState } from "react";
import { ArrowLeft, Stethoscope, FileText, ChevronDown, Pencil, Trash2, X, Loader2, Check, Filter } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { imc, br, fmtData, primeiroCiclo, ultimoCiclo, perdaPeso, mesesTrat, parseNum } from "../lib/utils.js";
import { Avatar } from "../components/ui.jsx";
import { LinhaChart } from "../components/charts.jsx";
import { useIsMobile } from "../components/Shell.jsx";
import { baixarPdfPaciente } from "../services/pdf.js";
import { validateCiclo, validatePaciente, primeiroErro } from "../lib/validate.js";

// Converte AAAA-MM-DD → DD/MM/AAAA
function isoParaBr(s) {
  if (!s) return "";
  const [a, m, d] = s.split("-");
  if (!d) return s;
  return `${d}/${m}/${a}`;
}

// ─── Modal de filtro de PDF ───────────────────────────────────
function ModalFiltroPdf({ ciclos, onGerar, onFechar }) {
  const [modo, setModo] = useState("total"); // "total" | "selecionados"
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

        {/* Modo */}
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

        {/* Lista de ciclos para selecionar */}
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
                      {c.data ? isoParaBr(c.data) : ""} · {br(c.peso)} kg
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

// ─── Máscara decimal estilo dinheiro ──────────────────────────
function mascararDecimal(raw, digitos, decimais) {
  let s = String(raw ?? "").replace(/\D/g, "");
  if (s === "") return "";
  if (s.length > digitos) s = s.slice(0, digitos);
  if (decimais === 0) return s;
  while (s.length <= decimais) s = "0" + s;
  const inteiro = s.slice(0, s.length - decimais);
  const dec = s.slice(s.length - decimais);
  const inteiroLimpo = inteiro.replace(/^0+/, "") || "0";
  return `${inteiroLimpo},${dec}`;
}

function InputDecimal({ value, onChange, placeholder = "0,0", digitos = 4, decimais = 1, style: extraStyle = {} }) {
  const handleChange = (e) => onChange(mascararDecimal(e.target.value, digitos, decimais));
  const inp = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", color: "var(--ink)", boxSizing: "border-box", ...extraStyle };
  return <input type="text" inputMode="decimal" value={value} onChange={handleChange} placeholder={placeholder} style={inp} />;
}

function InputInteiro({ value, onChange, placeholder, max = 999, style: extraStyle = {} }) {
  const handleChange = (e) => {
    let v = String(e.target.value).replace(/\D/g, "");
    if (v === "") { onChange(""); return; }
    if (parseInt(v) > max) v = String(max);
    onChange(v);
  };
  const inp = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", color: "var(--ink)", boxSizing: "border-box", ...extraStyle };
  return <input type="text" inputMode="numeric" value={value} onChange={handleChange} placeholder={placeholder} style={inp} />;
}

// ─── Modal de edição de ciclo ─────────────────────────────────
function ModalEditarCiclo({ ciclo, alturaBase, onSalvar, onFechar }) {
  // Converte número do banco → string mascarada para exibir
  const pesoToMask = (n, dig, dec) => n != null && n !== "" ? mascararDecimal(String(Math.round(n * Math.pow(10, dec))), dig, dec) : "";

  const [f, setF] = useState({
    ...ciclo,
    data: ciclo.data || "",
    altura: alturaBase ? pesoToMask(alturaBase, 3, 2) : "",
    peso: pesoToMask(ciclo.peso, 4, 1),
    gordura: pesoToMask(ciclo.gordura, 3, 1),
    visceral: ciclo.visceral != null ? String(ciclo.visceral) : "",
    d1: ciclo.unidade === "MG" ? pesoToMask(ciclo.doses?.[0], 3, 1) : String(ciclo.doses?.[0] ?? ""),
    d2: ciclo.unidade === "MG" ? pesoToMask(ciclo.doses?.[1], 3, 1) : String(ciclo.doses?.[1] ?? ""),
    d3: ciclo.unidade === "MG" ? pesoToMask(ciclo.doses?.[2], 3, 1) : String(ciclo.doses?.[2] ?? ""),
    d4: ciclo.unidade === "MG" ? pesoToMask(ciclo.doses?.[3], 3, 1) : String(ciclo.doses?.[3] ?? ""),
  });
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const pesoNum = parseNum(f.peso);
  const altNum  = parseNum(f.altura);
  const imcCalc = pesoNum > 0 && altNum > 0 ? +(pesoNum / (altNum * altNum)).toFixed(1) : null;

  const salvar = async () => {
    const raw = {
      ...f,
      doses: [f.d1, f.d2, f.d3, f.d4].map((d) => parseNum(d)),
    };
    const { data, errors } = validateCiclo(raw);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    setSalvando(true);
    await onSalvar(data);
    onFechar();
  };

  const inp = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", color: "var(--ink)", boxSizing: "border-box" };
  const isMG = (f.unidade || "MG") === "MG";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 520, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Editar ciclo · {ciclo.mes}</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field"><label>Mês *</label><input style={inp} value={f.mes} onChange={(e) => set("mes", e.target.value)} maxLength={20} /></div>
            <div className="field">
              <label>Data de referência</label>
              <input style={inp} type="date" value={f.data} onChange={(e) => set("data", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Peso (kg) *</label>
              <InputDecimal value={f.peso} onChange={(v) => set("peso", v)} placeholder="109,5" digitos={4} decimais={1} />
            </div>
            <div className="field">
              <label>Altura (m) <span style={{ fontSize: 11, color: "var(--inkFaint)" }}>opc.</span></label>
              <InputDecimal value={f.altura} onChange={(v) => set("altura", v)} placeholder="1,64" digitos={3} decimais={2} />
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>% Gordura</label>
              <InputDecimal value={f.gordura} onChange={(v) => set("gordura", v)} placeholder="34,0" digitos={3} decimais={1} />
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

          <div className="field"><label>Local</label>
            <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
              {["Casa","Clínica"].map((o) => (
                <button key={o} onClick={() => set("local", o)} style={{ borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, background: f.local === o ? "var(--surface)" : "transparent", color: f.local === o ? "var(--brand)" : "var(--inkFaint)" }}>{o}</button>
              ))}
            </div>
          </div>

          <div className="field"><label>Suplementação</label><input style={inp} value={f.suplementacao || ""} onChange={(e) => set("suplementacao", e.target.value)} maxLength={500} /></div>
          <div className="field"><label>Colaterais</label><textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={f.colaterais || ""} onChange={(e) => set("colaterais", e.target.value)} maxLength={1000} /></div>
          <div className="field"><label>Observações</label><textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={f.obs || ""} onChange={(e) => set("obs", e.target.value)} maxLength={2000} /></div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onFechar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
            <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : <><Check size={14} /> Salvar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de edição do paciente ──────────────────────────────
function ModalEditarPaciente({ p, onSalvar, onFechar }) {
  const [f, setF] = useState({ nome: p.nome, idade: p.idade, altura: p.altura, sexo: p.sexo, inicio: p.inicio, objetivo: p.objetivo, comorbidades: p.comorbidades, pesoMeta: p.pesoMeta || "" });
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const salvar = async () => {
    const { data, errors } = validatePaciente(f);
    if (errors.length) { toast(primeiroErro(errors)); return; }
    const pesoMeta = parseNum(f.pesoMeta) || null;
    setSalvando(true);
    await onSalvar({ ...data, pesoMeta });
    onFechar();
  };

  const inp = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", color: "var(--ink)", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 480, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Editar paciente</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div className="field"><label>Nome *</label><input style={inp} value={f.nome} onChange={(e) => set("nome", e.target.value)} maxLength={150} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field"><label>Idade</label><input style={inp} type="number" value={f.idade} onChange={(e) => set("idade", e.target.value)} min={0} max={130} /></div>
            <div className="field"><label>Altura (m)</label><input style={inp} type="number" step="0.01" value={f.altura} onChange={(e) => set("altura", e.target.value)} min={0.5} max={2.5} /></div>
          </div>
          <div className="field"><label>Sexo</label>
            <div style={{ display: "inline-flex", background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
              {["Feminino","Masculino"].map((s) => (
                <button key={s} onClick={() => set("sexo", s)} style={{ borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, background: f.sexo === s ? "var(--surface)" : "transparent", color: f.sexo === s ? "var(--brand)" : "var(--inkFaint)" }}>{s}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>Início do tratamento</label><input style={inp} type="date" value={f.inicio} onChange={(e) => set("inicio", e.target.value)} /></div>
          <div className="field"><label>Objetivo</label><input style={inp} value={f.objetivo} onChange={(e) => set("objetivo", e.target.value)} maxLength={300} /></div>
          <div className="field"><label>Condições relatadas</label><input style={inp} value={f.comorbidades} onChange={(e) => set("comorbidades", e.target.value)} maxLength={300} /></div>
          <div className="field"><label>Peso meta (kg)</label><input style={inp} type="number" value={f.pesoMeta} onChange={(e) => set("pesoMeta", e.target.value)} placeholder="Ex: 70" min={20} max={400} /></div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onFechar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
            <button onClick={salvar} disabled={salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
              {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delta ▲▼ ─────────────────────────────────────────────────
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
export default function Ficha({ pacienteId, navegar }) {
  const { getPaciente, config, editarCiclo, excluirCiclo, editarPaciente } = useStore();
  const toast = useToast();
  const isMobile = useIsMobile();
  const p = getPaciente(pacienteId);
  const [aberto, setAberto] = useState(p && p.ciclos.length ? p.ciclos.length - 1 : -1);
  const [editandoCicloIdx, setEditandoCicloIdx] = useState(null);
  const [editandoPaciente, setEditandoPaciente] = useState(false);
  const [excluindoIdx, setExcluindoIdx] = useState(null);
  const [modalPdf, setModalPdf] = useState(false);

  if (!p) { navegar("pacientes"); return null; }

  const gerarPdf = async (indices) => {
    toast("Gerando PDF…");
    try {
      // Se indices = null → todos os ciclos; senão → filtra
      const pacParaPdf = indices
        ? { ...p, ciclos: indices.map((i) => p.ciclos[i]) }
        : p;
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

  const meta = p.pesoMeta;
  const u = p.ciclos.length ? ultimoCiclo(p) : null;
  const f0 = p.ciclos.length ? primeiroCiclo(p) : null;
  let progresso = null;
  if (meta && f0 && u && f0.peso > meta) {
    progresso = Math.min(100, Math.round(((f0.peso - u.peso) / (f0.peso - meta)) * 100));
  }

  const Header = (
    <>
      <button onClick={() => navegar("pacientes")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13, marginBottom: 18 }}>
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar nome={p.nome} lg />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 600, letterSpacing: -0.3, marginBottom: 5, wordBreak: "break-word" }}>{p.nome}</h1>
              <button onClick={() => setEditandoPaciente(true)} title="Editar" style={{ color: "var(--inkFaint)", padding: 4, borderRadius: 7, marginTop: -4 }}>
                <Pencil size={15} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--inkSoft)" }}>
              <span>{p.idade} anos</span><span>·</span><span>{p.sexo}</span><span>·</span>
              <span>{br(p.altura.toFixed(2))} m</span><span>·</span><span>Início {fmtData(p.inicio)}</span>
              {meta && <><span>·</span><span style={{ color: "var(--brand)", fontWeight: 600 }}>Meta: {br(meta)} kg</span></>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto" }}>
          <button className="btn btn-ghost" style={{ flex: isMobile ? 1 : "none" }} onClick={() => navegar("novociclo", p.id)}>
            <Stethoscope size={16} /> Novo ciclo
          </button>
          <button className="btn btn-primary" style={{ flex: isMobile ? 1 : "none" }} onClick={() => p.ciclos.length ? setModalPdf(true) : toast("Paciente sem ciclos")}>
            <FileText size={16} /> PDF do paciente
          </button>
        </div>
      </div>

      {meta && progresso !== null && (
        <div style={{ marginBottom: 16, padding: "14px 18px", background: "var(--surface2)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 8 }}>
            <span>Progresso para a meta ({br(meta)} kg)</span>
            <span style={{ fontWeight: 700, color: "var(--brand)" }}>{progresso}%</span>
          </div>
          <div style={{ height: 8, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${progresso}%`, height: "100%", background: "var(--brand)", borderRadius: 99, transition: "width 0.4s" }} />
          </div>
        </div>
      )}

      <div style={{ padding: "16px 18px", background: "var(--surface2)", borderRadius: 12, display: "flex", gap: isMobile ? 14 : 40, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", marginBottom: 24 }}>
        <div><div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Objetivo</div><div style={{ fontSize: 13.5 }}>{p.objetivo}</div></div>
        <div><div style={{ fontSize: 12, color: "var(--inkFaint)", marginBottom: 3 }}>Condições relatadas</div><div style={{ fontSize: 13.5 }}>{p.comorbidades}</div></div>
      </div>
    </>
  );

  if (!p.ciclos.length) {
    return (
      <div>
        {Header}
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum ciclo registrado ainda</div>
          <div className="page-sub" style={{ marginBottom: 18 }}>Registre o primeiro ciclo mensal para começar a acompanhar a evolução.</div>
          <button className="btn btn-primary" style={{ display: "inline-flex" }} onClick={() => navegar("novociclo", p.id)}>
            <Stethoscope size={16} /> Registrar primeiro ciclo
          </button>
        </div>
        {editandoPaciente && <ModalEditarPaciente p={p} onSalvar={(d) => editarPaciente(p.id, d)} onFechar={() => setEditandoPaciente(false)} />}
      </div>
    );
  }

  const serie = p.ciclos.map((c) => ({ x: c.mes, peso: c.peso, imc: imc(c.peso, p.altura), gordura: c.gordura, visceral: c.visceral }));

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
    <div>
      {Header}

      <div className="card" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))", gap: isMobile ? 18 : 24, padding: "22px 24px", marginBottom: 28 }}>
        <Resumo label="Tempo" value={mesesTrat(p.inicio)} unit="meses" />
        <Resumo label="Peso atual" value={br(ultimoCiclo(p).peso)} unit="kg" sub={`−${br(perdaPeso(p))} kg`} />
        <Resumo label="IMC" value={br(imc(ultimoCiclo(p).peso, p.altura))} sub={`era ${br(imc(primeiroCiclo(p).peso, p.altura))}`} />
        <Resumo label="% Gordura" value={br(ultimoCiclo(p).gordura)} unit="%" sub={`−${br(+(primeiroCiclo(p).gordura - ultimoCiclo(p).gordura).toFixed(1))} p.p.`} />
        <Resumo label="Visceral" value={ultimoCiclo(p).visceral} sub={`era ${primeiroCiclo(p).visceral}`} />
      </div>

      <h2 className="sec-title">Evolução ao longo do tratamento</h2>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(230px, 1fr))", gap: isMobile ? 10 : 14, marginBottom: 32 }}>
        <LinhaChart data={serie} dataKey="peso" title="Peso" unit="kg" />
        <LinhaChart data={serie} dataKey="imc" title="IMC" unit="kg/m²" />
        <LinhaChart data={serie} dataKey="gordura" colorKey="gord" color="var(--gord)" title="% Gordura" unit="%" />
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
                    {c.data && <span style={{ fontSize: 11, color: "var(--inkFaint)" }}>{isoParaBr(c.data)}</span>}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--inkSoft)" }}>
                    {br(c.peso)} kg
                    <Delta atual={c.peso} anterior={prev?.peso} bom="baixo" unit=" kg" />
                    {" · "}{br(c.gordura)}% gordura
                    <Delta atual={c.gordura} anterior={prev?.gordura} bom="baixo" unit="%" />
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
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
                    <KV k="Suplementação" v={c.suplementacao} />
                    <KV k="Local de aplicação" v={c.local} />
                    <KV k="Colaterais relatados" v={c.colaterais} />
                  </div>
                  <KV k="Observações do médico" v={c.obs} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editandoCicloIdx !== null && (
        <ModalEditarCiclo ciclo={p.ciclos[editandoCicloIdx]} alturaBase={p.altura} onSalvar={(d) => editarCiclo(p.id, editandoCicloIdx, d)} onFechar={() => setEditandoCicloIdx(null)} />
      )}
      {editandoPaciente && (
        <ModalEditarPaciente p={p} onSalvar={(d) => editarPaciente(p.id, d)} onFechar={() => setEditandoPaciente(false)} />
      )}
      {modalPdf && (
        <ModalFiltroPdf ciclos={p.ciclos} onGerar={gerarPdf} onFechar={() => setModalPdf(false)} />
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
