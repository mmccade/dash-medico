// src/screens/Exames.jsx
// Módulo de exames laboratoriais.
// Dois modos:
//   - vinculado a um paciente (pacienteId): histórico salvo no Firestore do paciente
//   - global (sem pacienteId): lê laudo avulso → vê marcadores → PDF ou vincula/cria paciente
// Cores: verde (normal) / vermelho (alto) / amarelo (baixo)

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, X, Check, Loader2, FlaskConical, ChevronDown,
  Trash2, AlertTriangle, ArrowDown, ArrowUp, Minus, FileText, UserPlus,
} from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { auth } from "../services/firebase.js";
import { BIOMARCADORES, CATEGORIAS_EXAME, classificar, getInterpretacao, getSugestoes } from "../lib/biomarcadores.js";
import { salvarExame, listarExames, excluirExame, atualizarExame } from "../services/db-exames.js";
import { baixarPdfExames } from "../services/pdf-clinico.js";
import SeletorPaciente from "../components/SeletorPaciente.jsx";

// Verde normal / Vermelho alto / Amarelo baixo
const COR_STATUS = {
  alto:   { bg: "#fdecec", border: "#d64545", color: "#b91c1c" },
  baixo:  { bg: "#fff8e6", border: "#e0a800", color: "#9a6700" },
  normal: { bg: "#eaf7f0", border: "#1f9d6b", color: "#15803d" },
};
const LABEL_STATUS = { alto: "ALTO", baixo: "BAIXO", normal: "NORMAL" };
const ICON_STATUS = {
  alto:   <ArrowUp size={11} strokeWidth={3} />,
  baixo:  <ArrowDown size={11} strokeWidth={3} />,
  normal: <Minus size={11} strokeWidth={3} />,
};
const TIPOS_OK = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];

function BadgeStatus({ status }) {
  if (!status) return null;
  const s = COR_STATUS[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {ICON_STATUS[status]} {LABEL_STATUS[status]}
    </span>
  );
}

function SugestoesMarcador({ nome, status, onAdicionarSuplemento }) {
  if (!status || status === "normal") return null;
  const sugs = getSugestoes(nome, status);
  if (!sugs || !sugs.length) return null;
  return (
    <div style={{ marginTop: 8, padding: "8px 12px", background: status === "baixo" ? "#fff8e6" : "#fdecec", borderRadius: 8, border: `1px solid ${status === "baixo" ? "#e0a800" : "#d64545"}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: status === "baixo" ? "#9a6700" : "#b91c1c", marginBottom: 6 }}>
        💊 Sugestão de suporte nutricional — {status === "baixo" ? "nível baixo" : "nível elevado"}
      </div>
      <ul style={{ margin: 0, padding: "0 0 0 14px", listStyle: "disc" }}>
        {sugs.map((s, i) => (
          <li key={i} style={{ fontSize: 11.5, color: "#374151", marginBottom: 2 }}>
            {s}
            {onAdicionarSuplemento && (
              <button onClick={() => onAdicionarSuplemento(s.split(" (")[0].trim())}
                style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: "var(--brand)", textDecoration: "underline" }}>
                + adicionar ao protocolo
              </button>
            )}
          </li>
        ))}
      </ul>
      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6, fontStyle: "italic" }}>
        ⚕️ Sugestão de referência. A conduta terapêutica é de responsabilidade exclusiva do médico.
      </div>
    </div>
  );
}

// ─── Modal de upload + leitura ─────────────────────────────────
function ModalLeitura({ onConfirmar, onFechar, genero = "M" }) {
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tipoArquivo, setTipoArquivo] = useState(null);
  const [lendo, setLendo] = useState(false);
  const [marcadores, setMarcadores] = useState([]);
  const [etapa, setEtapa] = useState("upload");
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const toast = useToast();
  const inputRef = useRef();

  const handleArquivo = (file) => {
    if (!file) return;
    if (!TIPOS_OK.includes(file.type)) { toast("Use imagem (JPG/PNG/WEBP) ou PDF."); return; }
    if (file.size > 15 * 1024 * 1024) { toast("Arquivo muito grande. Máximo 15MB."); return; }
    setArquivo(file);
    if (file.type === "application/pdf") { setTipoArquivo("pdf"); setPreview(file.name); }
    else {
      setTipoArquivo("imagem");
      const r = new FileReader(); r.onload = (e) => setPreview(e.target.result); r.readAsDataURL(file);
    }
  };

  const lerComIA = async () => {
    if (!arquivo) return;
    setLendo(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target.result.split(",")[1]);
        r.onerror = rej; r.readAsDataURL(arquivo);
      });
      const token = await auth.currentUser?.getIdToken();
      if (!token) { toast("Sessão expirada."); setLendo(false); return; }

      const resp = await fetch("/api/ler-laudo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mediaType: arquivo.type === "image/jpg" ? "image/jpeg" : arquivo.type,
          base64,
          nomesValidos: BIOMARCADORES.map((b) => b.nome),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Erro na leitura");

      const extraidos = (json.data?.marcadores || []).filter(
        (m) => m.nome && m.valor && BIOMARCADORES.find((b) => b.nome === m.nome)
      );
      if (extraidos.length === 0) { toast("Nenhum marcador reconhecido. Adicione manualmente."); setMarcadores([]); }
      else { toast(`${extraidos.length} marcadores extraídos.`); setMarcadores(extraidos); }
      setEtapa("revisao");
    } catch (e) {
      console.error("Erro ao ler laudo:", e);
      toast(e.message || "Erro ao ler o laudo.");
      setMarcadores([]); setEtapa("revisao");
    } finally { setLendo(false); }
  };

  const adicionar = () => setMarcadores((ms) => [...ms, { nome: BIOMARCADORES[0].nome, valor: "" }]);
  const atualizar = (idx, novo) => setMarcadores((ms) => ms.map((m, i) => (i === idx ? novo : m)));
  const remover = (idx) => setMarcadores((ms) => ms.filter((_, i) => i !== idx));

  const confirmar = () => {
    const validos = marcadores.filter((m) => m.nome && m.valor !== "");
    if (validos.length === 0) { toast("Adicione ao menos um marcador."); return; }
    onConfirmar({
      titulo: titulo || `Laudo ${new Date(data + "T12:00:00").toLocaleDateString("pt-BR")}`,
      data, marcadores: validos,
    });
  };

  const inp = { padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 620, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{etapa === "upload" ? "Enviar laudo" : "Confirmar marcadores"}</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>

        {etapa === "upload" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div className="field"><label>Título (opcional)</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Rotina — Jan/25" style={inp} /></div>
              <div className="field"><label>Data do exame</label>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inp} /></div>
            </div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: "none" }} onChange={(e) => handleArquivo(e.target.files[0])} />
            {!preview ? (
              <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleArquivo(e.dataTransfer.files[0]); }}
                style={{ border: "2px dashed var(--line)", borderRadius: 14, padding: "48px 24px", textAlign: "center", cursor: "pointer" }}>
                <Upload size={32} color="var(--inkFaint)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Clique ou arraste o laudo</div>
                <div style={{ fontSize: 13, color: "var(--inkFaint)" }}>Imagem (JPG/PNG/WEBP) ou PDF · Máx 15MB</div>
              </div>
            ) : tipoArquivo === "pdf" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px", background: "var(--surface2)", borderRadius: 12, marginBottom: 16 }}>
                <FileText size={28} color="var(--brand)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>
                  <div style={{ fontSize: 12, color: "var(--inkFaint)" }}>PDF pronto para leitura</div>
                </div>
                <button onClick={() => { setArquivo(null); setPreview(null); setTipoArquivo(null); }} style={{ color: "var(--inkFaint)", padding: 6 }}><X size={16} /></button>
              </div>
            ) : (
              <div style={{ position: "relative", marginBottom: 16 }}>
                <img src={preview} alt="Laudo" style={{ width: "100%", borderRadius: 12, maxHeight: 300, objectFit: "contain", background: "var(--surface2)" }} />
                <button onClick={() => { setArquivo(null); setPreview(null); setTipoArquivo(null); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", borderRadius: "50%", padding: 6, color: "#fff" }}><X size={14} /></button>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={onFechar} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Cancelar</button>
              <button onClick={preview ? lerComIA : () => { setEtapa("revisao"); setMarcadores([]); }} disabled={lendo} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {lendo ? <><Loader2 size={14} className="spin" /> Lendo laudo…</> : preview ? <><FlaskConical size={14} /> Ler com IA</> : "Inserir manualmente"}
              </button>
            </div>
          </>
        )}

        {etapa === "revisao" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div className="field"><label>Título</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={`Laudo ${new Date(data + "T12:00:00").toLocaleDateString("pt-BR")}`} style={inp} /></div>
              <div className="field"><label>Data</label>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inp} /></div>
            </div>
            {marcadores.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--inkFaint)", fontSize: 13, marginBottom: 12 }}>Nenhum marcador. Adicione manualmente.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {marcadores.map((m, i) => {
                const st = classificar(m.nome, m.valor, genero);
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 80px auto", gap: 8, alignItems: "center", padding: "8px 12px", background: "var(--surface2)", borderRadius: 9 }}>
                    <select value={m.nome} onChange={(e) => atualizar(i, { ...m, nome: e.target.value })} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13, width: "100%", boxSizing: "border-box" }}>
                      {BIOMARCADORES.map((b) => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
                    </select>
                    <input type="text" value={m.valor} onChange={(e) => atualizar(i, { ...m, valor: e.target.value })} placeholder="Valor" style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, width: "100%", boxSizing: "border-box" }} />
                    <div><BadgeStatus status={st} /></div>
                    <button onClick={() => remover(i)} style={{ color: "var(--inkFaint)", padding: 6 }}><X size={14} /></button>
                  </div>
                );
              })}
            </div>
            <button onClick={adicionar} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}>+ Adicionar marcador</button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEtapa("upload")} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>Voltar</button>
              <button onClick={confirmar} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}><Check size={14} /> Confirmar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Card de exame ─────────────────────────────────────────────
function CardExame({ exame, genero, aberto, onToggle, onExcluir, onRenomear, exameAnterior, onAdicionarSuplemento }) {
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState(exame.titulo || "");
  const alteracoes = exame.marcadores?.filter((m) => { const s = classificar(m.nome, m.valor, genero); return s && s !== "normal"; });
  const comSugestao = (alteracoes || []).filter((m) => {
    const s = classificar(m.nome, m.valor, genero);
    const sugs = getSugestoes(m.nome, s);
    return sugs && sugs.length > 0;
  });
  return (
    <div className="card" style={{ overflow: "hidden", borderColor: aberto ? "var(--brand)" : "var(--line)" }}>
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", textAlign: "left" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, flexWrap: "wrap" }}>
          <span>
            {editandoTitulo ? (
              <span onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { onRenomear?.(novoTitulo); setEditandoTitulo(false); } if (e.key === "Escape") setEditandoTitulo(false); }}
                  style={{ fontSize: 14, fontWeight: 600, padding: "4px 8px", borderRadius: 7, border: "1px solid var(--brand)", background: "var(--surface)", width: 200 }}
                  autoFocus />
                <button onClick={(e) => { e.stopPropagation(); onRenomear?.(novoTitulo); setEditandoTitulo(false); }}
                  style={{ fontSize: 12, color: "var(--good)", fontWeight: 700, padding: "3px 8px", borderRadius: 7, border: "1px solid var(--good)" }}>✓</button>
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{exame.titulo}</span>
                {onRenomear && (
                  <button onClick={(e) => { e.stopPropagation(); setEditandoTitulo(true); }}
                    style={{ color: "var(--inkFaint)", padding: "2px 6px", borderRadius: 6, fontSize: 11 }} title="Renomear">✎</button>
                )}
              </span>
            )}
            {exame.data && <span style={{ fontSize: 12, color: "var(--inkFaint)", display: "block" }}>{new Date(exame.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
          </span>
          <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>{exame.marcadores?.length || 0} marcadores</span>
          {alteracoes?.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--warn)", fontWeight: 600 }}><AlertTriangle size={13} /> {alteracoes.length} alterados</span>}
          {comSugestao.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--brand)", fontWeight: 600 }}>💊 {comSugestao.length} sugestõe{comSugestao.length > 1 ? "s" : ""} de suplemento</span>}
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
          {onExcluir && <button onClick={(e) => { e.stopPropagation(); onExcluir(); }} style={{ padding: 6, borderRadius: 7, color: "var(--inkFaint)" }}><Trash2 size={14} /></button>}
          <ChevronDown size={18} style={{ color: "var(--inkFaint)", transform: aberto ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: 4 }} />
        </div>
      </button>
      {aberto && (
        <div style={{ padding: "4px 20px 20px" }}>
          {comSugestao.length > 0 && (
            <div style={{ marginBottom: 16, padding: "14px 16px", background: "linear-gradient(135deg, var(--brandSoft,#d1f5e8), var(--surface))", border: "1px solid var(--brand)", borderRadius: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--brand)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                💊 Sugestões de suplementação baseadas neste exame
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {comSugestao.map((m, i) => {
                  const s = classificar(m.nome, m.valor, genero);
                  const sugs = getSugestoes(m.nome, s) || [];
                  return (
                    <div key={i} style={{ fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{m.nome}</span>
                      <span style={{ color: s === "baixo" ? "#9a6700" : "#b91c1c", fontWeight: 600, marginLeft: 6 }}>
                        {s === "baixo" ? "↓ baixo" : "↑ elevado"}
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
                        {sugs.map((sug, j) => {
                          const nomeSup = sug.split(" (")[0].trim();
                          return (
                            <button key={j} type="button"
                              onClick={onAdicionarSuplemento ? () => onAdicionarSuplemento(nomeSup) : undefined}
                              disabled={!onAdicionarSuplemento}
                              style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "var(--surface)", color: "var(--brand)", border: "1px solid var(--brand)", cursor: onAdicionarSuplemento ? "pointer" : "default" }}
                              title={onAdicionarSuplemento ? "Adicionar ao protocolo do paciente" : "Vincule a um paciente para adicionar ao protocolo"}>
                              {onAdicionarSuplemento ? "+ " : ""}{sug}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--inkFaint)", marginTop: 10, fontStyle: "italic" }}>
                ⚕️ Sugestões de referência. A conduta terapêutica é de responsabilidade exclusiva do médico.
              </div>
            </div>
          )}
          {CATEGORIAS_EXAME.map((cat) => {
            const marcsCat = exame.marcadores?.filter((m) => BIOMARCADORES.find((b) => b.nome === m.nome)?.categoria === cat);
            if (!marcsCat || marcsCat.length === 0) return null;
            return (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--inkFaint)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{cat}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {marcsCat.map((m, i) => {
                    const ant = exameAnterior?.marcadores?.find((x) => x.nome === m.nome);
                    const stAtual = classificar(m.nome, m.valor, genero);
                    const vAtual = parseFloat(String(m.valor).replace(",", "."));
                    const vAnt = ant ? parseFloat(String(ant.valor).replace(",", ".")) : null;
                    const delta = !isNaN(vAtual) && vAnt != null && !isNaN(vAnt) ? +(vAtual - vAnt).toFixed(2) : null;
                    const bio = BIOMARCADORES.find((b) => b.nome === m.nome);
                    const interp = getInterpretacao(m.nome, stAtual);
                    return (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px", gap: 8, alignItems: "start", padding: "9px 12px", background: stAtual && stAtual !== "normal" ? COR_STATUS[stAtual].bg : "var(--surface2)", borderLeft: stAtual && stAtual !== "normal" ? `3px solid ${COR_STATUS[stAtual].border}` : "3px solid transparent", borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{m.nome}</div>
                          {interp && <div style={{ fontSize: 11, color: "var(--inkSoft)", marginTop: 2, lineHeight: 1.4 }}>{interp}</div>}
                          {delta !== null && delta !== 0 && <div style={{ fontSize: 11, marginTop: 2, color: delta > 0 ? "var(--warn)" : "var(--good)", fontWeight: 600 }}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)} {bio?.unidade || ""} vs anterior</div>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{m.valor} {bio?.unidade && <span style={{ fontSize: 11, fontWeight: 400, color: "var(--inkFaint)" }}>{bio.unidade}</span>}</div>
                        <div><BadgeStatus status={stAtual} /></div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <SugestoesMarcador nome={m.nome} status={stAtual} onAdicionarSuplemento={onAdicionarSuplemento} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Modal de vínculo (global)
function ModalVincular({ pacientes, onVincularExistente, onCriarNovo, onFechar, salvando }) {
  const [modo, setModo] = useState("escolha");
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 560, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Vincular exame</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        {modo === "escolha" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={onCriarNovo} disabled={salvando} className="btn btn-primary" style={{ justifyContent: "center", padding: 14 }}>
              {salvando ? <><Loader2 size={15} className="spin" /> Criando…</> : <><UserPlus size={16} /> Criar paciente novo com este exame</>}
            </button>
            <button onClick={() => setModo("existente")} className="btn btn-ghost" style={{ justifyContent: "center", padding: 14 }}>Vincular a um paciente existente</button>
          </div>
        )}
        {modo === "existente" && <SeletorPaciente pacientes={pacientes} onSelecionar={onVincularExistente} />}
      </div>
    </div>
  );
}

export default function Exames({ pacienteId, pacienteGenero = "M", pacienteNome, navegar, onExamesAlterados, onAdicionarSuplemento }) {
  const { user } = useAuth();
  const { config, pacientes, addPaciente } = useStore();
  const toast = useToast();
  const global = !pacienteId;

  const [exames, setExames] = useState([]);
  const [carregando, setCarregando] = useState(!!pacienteId);
  const [modal, setModal] = useState(false);
  const [abaAberta, setAbaAberta] = useState(null);

  // modo global: exame lido em memória (ainda não salvo)
  const [exameAvulso, setExameAvulso] = useState(null);
  const [modalVincular, setModalVincular] = useState(false);
  const [vinculando, setVinculando] = useState(false);

  const carregar = useCallback(async () => {
    if (!user || !pacienteId) { setCarregando(false); return; }
    try {
      const lista = await listarExames(user.uid, pacienteId);
      setExames(lista);
      if (lista.length > 0) setAbaAberta(lista[0].id);
    } catch (e) { console.error(e); toast("Erro ao carregar exames."); }
    finally { setCarregando(false); }
  }, [user, pacienteId]);

  useEffect(() => { carregar(); }, [carregar]);

  // ── modo vinculado: salva direto ──
  const handleConfirmarVinculado = async (dados) => {
    try {
      const novo = await salvarExame(user.uid, pacienteId, dados);
      setExames((prev) => [novo, ...prev]);
      setAbaAberta(novo.id);
      setModal(false);
      toast("Exame salvo.");
      onExamesAlterados?.();
    } catch (e) { console.error(e); toast("Erro ao salvar."); }
  };

  // ── modo global: guarda em memória ──
  const handleConfirmarGlobal = (dados) => {
    setExameAvulso({ ...dados, id: "avulso" });
    setAbaAberta("avulso");
    setModal(false);
  };

  const handleExcluir = async (eid) => {
    if (!window.confirm("Excluir este exame? Ação irreversível.")) return;
    try {
      await excluirExame(user.uid, pacienteId, eid);
      setExames((prev) => prev.filter((e) => e.id !== eid));
      toast("Exame excluído.");
      onExamesAlterados?.();
    } catch (e) { console.error(e); toast("Erro ao excluir."); }
  };

  const exportarPdf = async () => {
    try {
      const lista = global ? (exameAvulso ? [exameAvulso] : []) : exames;
      const paciente = global ? null : { nome: pacienteNome, sexo: pacienteGenero === "M" ? "Masculino" : "Feminino" };
      await baixarPdfExames({ paciente, exames: lista, genero: pacienteGenero, config });
      toast("PDF gerado.");
    } catch (e) { console.error(e); toast("Erro ao gerar PDF."); }
  };

  const criarNovo = async () => {
    setVinculando(true);
    try {
      const novoPaciente = await addPaciente({
        nome: "Paciente " + new Date().toLocaleDateString("pt-BR"),
        idade: null, sexo: pacienteGenero === "M" ? "Masculino" : "Feminino",
        altura: null, objetivo: "", comorbidades: "Nenhuma relatada",
        inicio: new Date().toISOString().slice(0, 10),
      });
      const { id, ...dadosExame } = exameAvulso;
      await salvarExame(user.uid, novoPaciente.id, dadosExame);
      toast(`Paciente criado com o exame.`);
      setModalVincular(false);
      if (navegar) navegar("ficha", novoPaciente.id);
    } catch (e) { console.error(e); toast("Erro ao criar paciente."); }
    finally { setVinculando(false); }
  };

  const vincularExistente = async (paciente) => {
    setVinculando(true);
    try {
      const { id, ...dadosExame } = exameAvulso;
      await salvarExame(user.uid, paciente.id, dadosExame);
      toast(`Exame vinculado a ${paciente.nome}.`);
      setModalVincular(false);
      if (navegar) navegar("ficha", paciente.id);
    } catch (e) { console.error(e); toast("Erro ao vincular."); }
    finally { setVinculando(false); }
  };

  if (carregando) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 size={24} className="spin" color="var(--inkFaint)" /></div>;
  }

  const listaExibida = global ? (exameAvulso ? [exameAvulso] : []) : exames;
  const temExame = listaExibida.length > 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Exames Laboratoriais</h2>
          <p style={{ fontSize: 13, color: "var(--inkFaint)", margin: "4px 0 0" }}>
            {global ? "Leia um laudo, exporte o PDF ou vincule a um paciente." : "Envie a foto ou PDF do laudo para extração automática."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {temExame && <button onClick={exportarPdf} className="btn btn-ghost"><FileText size={15} /> Exportar PDF</button>}
          {global && temExame && <button onClick={() => setModalVincular(true)} className="btn btn-ghost"><UserPlus size={15} /> Vincular</button>}
          <button onClick={() => setModal(true)} className="btn btn-primary"><Upload size={15} /> {global ? "Ler laudo" : "Novo laudo"}</button>
        </div>
      </div>

      {!temExame ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <FlaskConical size={36} color="var(--inkFaint)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nenhum exame {global ? "lido" : "registrado"}</div>
          <div style={{ fontSize: 13, color: "var(--inkFaint)", marginBottom: 18 }}>Envie a foto ou PDF de um laudo para começar.</div>
          <button onClick={() => setModal(true)} className="btn btn-primary" style={{ display: "inline-flex" }}><Upload size={15} /> {global ? "Ler primeiro laudo" : "Enviar primeiro laudo"}</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {listaExibida.map((exame, idx) => (
            <CardExame
              key={exame.id}
              exame={exame}
              genero={pacienteGenero}
              aberto={abaAberta === exame.id}
              onToggle={() => setAbaAberta(abaAberta === exame.id ? null : exame.id)}
              onExcluir={global ? null : () => handleExcluir(exame.id)}
              onRenomear={global || !user?.uid ? null : async (novoTitulo) => {
                await atualizarExame(user.uid, pacienteId, exame.id, { titulo: novoTitulo });
                setLista((ls) => ls.map((e) => e.id === exame.id ? { ...e, titulo: novoTitulo } : e));
              }}
              exameAnterior={global ? null : listaExibida[idx + 1] || null}
              onAdicionarSuplemento={global ? null : onAdicionarSuplemento}
            />
          ))}
        </div>
      )}

      {modal && <ModalLeitura onConfirmar={global ? handleConfirmarGlobal : handleConfirmarVinculado} onFechar={() => setModal(false)} genero={pacienteGenero} />}
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
