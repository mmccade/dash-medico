// src/components/ModalDesativar.jsx
// Modal que pergunta motivo da desativação e roteia para ações apropriadas.

import { useState } from "react";
import { X, Trophy, UserX, AlertCircle, Loader2, FileDown, ArrowRight, EyeOff } from "lucide-react";

const MOTIVOS = [
  { id: "meta_batida",   label: "Bateu a meta",        Icon: Trophy,      cor: "var(--good)" },
  { id: "sumiu",         label: "Sumiu / Não voltou",  Icon: UserX,       cor: "var(--warn)" },
  { id: "outros",        label: "Outros motivos",      Icon: AlertCircle, cor: "var(--inkSoft)" },
  { id: "nao_informar",  label: "Não quero informar",  Icon: EyeOff,      cor: "var(--inkFaint)" },
];

const MSG_PARABENS_PADRAO =
  "Parabéns pela conquista! É uma honra ter participado dessa jornada com você. " +
  "Que esse resultado seja só o começo de uma nova fase de saúde e bem-estar.";

const DICAS_OUTROS = [
  "Anote o motivo no detalhe pra lembrar depois (mudança de cidade, alergia, custo, etc.)",
  "Considere mandar uma mensagem cordial de encerramento — fica registrado o cuidado",
  "Se foi por insatisfação clínica, vale revisar o protocolo antes de fechar a ficha",
];

export default function ModalDesativar({ paciente, onConfirmar, onFechar, navegar, onBaixarPdfMeta }) {
  const [motivo, setMotivo] = useState(null);
  const [detalhe, setDetalhe] = useState("");
  const [sumiuVeio, setSumiuVeio] = useState(null); // "sim" | "nao" | null
  const [mensagemMedico, setMensagemMedico] = useState(MSG_PARABENS_PADRAO);
  const [salvando, setSalvando] = useState(false);

  const finalizar = async (gerarPdf = false) => {
    setSalvando(true);
    try {
      const detalhesFinais = motivo === "meta_batida"
        ? mensagemMedico
        : motivo === "sumiu"
          ? `Veio antes de sumir: ${sumiuVeio === "sim" ? "sim" : "não"}`
          : motivo === "outros"
            ? detalhe
            : "";
      await onConfirmar(motivo, detalhesFinais);

      if (gerarPdf && onBaixarPdfMeta) {
        await onBaixarPdfMeta(paciente, mensagemMedico);
      }
      if (motivo === "sumiu" && sumiuVeio === "nao") {
        // Encaminha para evolução pra entender o que aconteceu
        navegar("evolucao", paciente.id);
      }
      onFechar();
    } catch (e) {
      console.error(e);
      setSalvando(false);
    }
  };

  const motivoObj = MOTIVOS.find((m) => m.id === motivo);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--surface)", borderRadius: 18, width: "100%", maxWidth: 500, padding: "28px 26px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Desativar paciente</h2>
          <button onClick={onFechar} style={{ color: "var(--inkFaint)" }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: "var(--inkSoft)", marginBottom: 20 }}>
          {paciente.nome} — qual o motivo da desativação?
        </p>

        {/* Seleção do motivo */}
        {!motivo && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOTIVOS.map((m) => (
              <button key={m.id} onClick={() => setMotivo(m.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                background: "var(--surface2)", borderRadius: 11, textAlign: "left",
                border: "1px solid transparent", transition: "all 0.15s",
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = m.cor}
              onMouseOut={(e) => e.currentTarget.style.borderColor = "transparent"}>
                <div style={{ padding: 9, borderRadius: 8, background: "var(--surface)" }}>
                  <m.Icon size={18} color={m.cor} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
                <ArrowRight size={15} color="var(--inkFaint)" style={{ marginLeft: "auto" }} />
              </button>
            ))}
          </div>
        )}

        {/* ─ Meta batida ─ */}
        {motivo === "meta_batida" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--brandSoft)", borderRadius: 11 }}>
              <Trophy size={20} color="var(--good)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Que conquista!</div>
                <div style={{ fontSize: 12, color: "var(--inkSoft)" }}>Vamos celebrar com um PDF de parabenização.</div>
              </div>
            </div>
            <div className="field">
              <label>Mensagem de agradecimento (opcional)</label>
              <textarea
                rows={4}
                value={mensagemMedico}
                onChange={(e) => setMensagemMedico(e.target.value)}
                maxLength={500}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
              />
              <span style={{ fontSize: 11.5, color: "var(--inkFaint)", marginTop: 4, display: "block" }}>
                Sai no PDF de meta batida. Você pode editar a mensagem padrão.
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
              <button onClick={() => finalizar(true)} disabled={salvando} className="btn btn-primary" style={{ justifyContent: "center" }}>
                {salvando ? <Loader2 size={14} className="spin" /> : <FileDown size={14} />} Desativar e baixar PDF de meta batida
              </button>
              <button onClick={() => finalizar(false)} disabled={salvando} className="btn btn-ghost" style={{ justifyContent: "center" }}>
                Desativar sem gerar PDF
              </button>
              <button onClick={() => setMotivo(null)} className="btn btn-ghost" style={{ justifyContent: "center", color: "var(--inkFaint)" }}>
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* ─ Sumiu ─ */}
        {motivo === "sumiu" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13.5, color: "var(--inkSoft)", lineHeight: 1.55 }}>
              Antes de sumir, o paciente chegou a comparecer alguma vez?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSumiuVeio("sim")} className={`btn ${sumiuVeio === "sim" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1, justifyContent: "center" }}>
                Sim, veio
              </button>
              <button onClick={() => setSumiuVeio("nao")} className={`btn ${sumiuVeio === "nao" ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1, justifyContent: "center" }}>
                Não veio nenhuma vez
              </button>
            </div>
            {sumiuVeio === "nao" && (
              <div style={{ padding: "12px 14px", background: "var(--warnSoft)", borderRadius: 10, fontSize: 12.5, color: "var(--inkSoft)", lineHeight: 1.6 }}>
                Vamos te levar pra tela de Evolução do paciente pra você ver o que foi registrado e decidir o próximo passo.
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMotivo(null)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                Voltar
              </button>
              <button onClick={() => finalizar(false)} disabled={!sumiuVeio || salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", opacity: !sumiuVeio || salvando ? 0.6 : 1 }}>
                {salvando ? <Loader2 size={14} className="spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        )}

        {/* ─ Outros ─ */}
        {motivo === "outros" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--inkSoft)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>Dicas</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "var(--inkSoft)", lineHeight: 1.6 }}>
                {DICAS_OUTROS.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
            <div className="field">
              <label>Detalhes (opcional)</label>
              <textarea
                rows={3}
                value={detalhe}
                onChange={(e) => setDetalhe(e.target.value)}
                maxLength={500}
                placeholder="Ex: mudou de cidade, optou por outra estratégia, custo..."
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMotivo(null)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                Voltar
              </button>
              <button onClick={() => finalizar(false)} disabled={salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {salvando ? <Loader2 size={14} className="spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        )}

        {/* ─ Não informar ─ */}
        {motivo === "nao_informar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 13.5, color: "var(--inkSoft)", lineHeight: 1.55 }}>
              O paciente será desativado sem nenhum motivo registrado. Você pode reativar a qualquer momento.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setMotivo(null)} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                Voltar
              </button>
              <button onClick={() => finalizar(false)} disabled={salvando} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                {salvando ? <Loader2 size={14} className="spin" /> : "Desativar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
