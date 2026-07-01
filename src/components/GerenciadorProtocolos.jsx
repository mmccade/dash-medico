// src/components/GerenciadorProtocolos.jsx
// Biblioteca de protocolos de suplementação reutilizáveis (nível médico).
// Fluxo:
//   1. Vista padrão: protocolo aplicado ao paciente + biblioteca de protocolos salvos.
//   2. "Adicionar novo protocolo" → builder com nome + PlanejadorSuplementos
//      (via, concentração, dose por item + sinergia/antagonismo).
//   3. Salva na biblioteca (reutilizável) e COMBINA com o que já estiver
//      aplicado ao paciente — dá pra aplicar mais de um protocolo no mesmo
//      paciente/ciclo (ex: "Suporte GLP-1" + "Pós-bariátrica" juntos).
//
// Props:
//   protocoloAplicado : array de itens atualmente no paciente (p.suplementosProtocolo)
//   protocolosAplicadosNomes : nomes dos protocolos da biblioteca já combinados no paciente
//   biblioteca        : array de protocolos salvos (config.protocolosSuplementacao)
//   sugestoesDepleção : nomes sugeridos pelos exames
//   onAplicar(itens, nomeProtocolo)  : combina um conjunto de itens ao paciente (merge, não substitui)
//   onRemoverItem(nome)  : remove um único item do protocolo aplicado ao paciente
//   onSalvarBiblioteca(protocolo) : salva/atualiza protocolo na biblioteca (retorna registro)
//   onRemoverBiblioteca(id)       : remove protocolo da biblioteca
//   onExportarPdf()   : exporta PDF do protocolo aplicado

import { useState, useEffect } from "react";
import { Plus, FileText, FolderPlus, Check, X, Pencil, Trash2, Library, ArrowLeft, Layers } from "lucide-react";
import PlanejadorSuplementos from "./PlanejadorSuplementos.jsx";

// Formata um item do protocolo para exibição (independente do PlanejadorSuplementos,
// para não depender de exports que podem variar entre versões).
const VIA_LABEL_LOCAL = { oral: "Oral", sublingual: "Sublingual", sc: "Injetável SC", im: "Injetável IM", topico: "Tópico" };
function resumoItem(it) {
  if (typeof it === "string") return it;
  const partes = [it.nome];
  if (it.conc && it.concUnidade && it.concUnidade !== "—") partes.push(`${it.conc} ${it.concUnidade}`);
  if (it.dose) partes.push(`${it.dose} ${it.doseUnidade || it.unidade || "mg"}`);
  partes.push(VIA_LABEL_LOCAL[it.via] || "Oral");
  return partes.join(" · ");
}

export default function GerenciadorProtocolos({
  protocoloAplicado = [],
  protocolosAplicadosNomes = [],
  biblioteca = [],
  sugestoesDepleção = [],
  sementeSugerida = null,
  onSementeConsumida,
  onAplicar,
  onRemoverItem,
  onSalvarBiblioteca,
  onRemoverBiblioteca,
  onExportarPdf,
}) {
  // modo: "lista" | "novo" | "editar"
  const [modo, setModo] = useState("lista");
  const [nome, setNome] = useState("");
  const [itens, setItens] = useState([]);
  const [editId, setEditId] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Quando a comparação de exames manda suplementos sugeridos, abre o builder
  // já preenchido com esses itens (formato novo: via oral, dose/conc em branco).
  useEffect(() => {
    if (sementeSugerida && sementeSugerida.length) {
      setEditId(null);
      setNome("");
      setItens(sementeSugerida.map((n) => (
        typeof n === "string"
          ? { nome: n, via: "oral", conc: "", concUnidade: "—", dose: "", doseUnidade: "mg" }
          : n
      )));
      setModo("novo");
      onSementeConsumida && onSementeConsumida();
    }
  }, [sementeSugerida]);

  const abrirNovo = () => {
    setEditId(null);
    setNome("");
    // semente: começa do que já está aplicado no paciente, se houver
    setItens(protocoloAplicado.length ? protocoloAplicado : []);
    setModo("novo");
  };

  const abrirEdicao = (prot) => {
    setEditId(prot.id);
    setNome(prot.nome);
    setItens(prot.itens || []);
    setModo("editar");
  };

  const cancelar = () => { setModo("lista"); setNome(""); setItens([]); setEditId(null); };

  const salvar = async (aplicar) => {
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      const registro = await onSalvarBiblioteca({ id: editId, nome: nome.trim(), itens });
      if (aplicar) await onAplicar(registro.itens, registro.nome);
      cancelar();
    } finally {
      setSalvando(false);
    }
  };

  const lbl = { fontSize: 11.5, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 6, display: "block" };
  const inp = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, boxSizing: "border-box", color: "var(--ink)" };

  // ─── Builder (criar/editar) ─────────────────────────────────
  if (modo === "novo" || modo === "editar") {
    return (
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={cancelar} className="btn btn-ghost" style={{ fontSize: 13, gap: 6, padding: "4px 8px" }}>
            <ArrowLeft size={15} /> Voltar
          </button>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {modo === "editar" ? "Editar protocolo" : "Novo protocolo de suplementação"}
          </span>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Nome do protocolo</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus
            placeholder="Ex: Suporte GLP-1 · Reposição B12 · Pós-bariátrica" style={inp} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Suplementos do protocolo</div>
        <PlanejadorSuplementos
          valor={itens}
          onChange={setItens}
          sugestoesDepleção={sugestoesDepleção}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button disabled={!nome.trim() || salvando} onClick={() => salvar(true)}
            className="btn btn-primary" style={{ flex: 1, justifyContent: "center", opacity: !nome.trim() ? 0.5 : 1 }}>
            <Check size={15} /> {salvando ? "Salvando…" : "Salvar e combinar com o paciente"}
          </button>
          <button disabled={!nome.trim() || salvando} onClick={() => salvar(false)}
            className="btn btn-ghost" style={{ justifyContent: "center", opacity: !nome.trim() ? 0.5 : 1 }}>
            Salvar só na biblioteca
          </button>
        </div>
      </div>
    );
  }

  // ─── Vista padrão (lista) ───────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <button onClick={abrirNovo} className="btn btn-primary" style={{ gap: 7 }}>
          <FolderPlus size={16} /> Adicionar novo protocolo de suplementação
        </button>
        {protocoloAplicado.length > 0 && (
          <button className="btn btn-ghost" style={{ fontSize: 13, gap: 7 }} onClick={onExportarPdf}>
            <FileText size={14} /> Exportar PDF
          </button>
        )}
      </div>

      {/* Protocolo aplicado ao paciente */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Protocolo atual do paciente</div>

        {protocolosAplicadosNomes.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 4 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--inkFaint)" }}>
              <Layers size={12} /> Combinando:
            </span>
            {protocolosAplicadosNomes.map((n) => (
              <span key={n} style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: "var(--brandSoft)", color: "var(--brand)" }}>
                {n}
              </span>
            ))}
          </div>
        )}

        {protocoloAplicado.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--inkFaint)", padding: "8px 0" }}>
            Nenhum protocolo aplicado. Crie um novo ou aplique um da biblioteca abaixo — dá pra aplicar mais de um, eles se combinam.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
            {protocoloAplicado.map((it, i) => {
              const nomeItem = typeof it === "string" ? it : it.nome;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 13, padding: "8px 12px", background: "var(--surface2)", borderRadius: 9 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Check size={13} color="var(--brand)" style={{ flexShrink: 0 }} />
                    <span>{resumoItem(it)}</span>
                  </span>
                  {onRemoverItem && (
                    <button onClick={() => onRemoverItem(nomeItem)} style={{ color: "var(--inkFaint)", padding: "3px 6px", borderRadius: 7, flexShrink: 0 }} title="Remover item">
                      <X size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Biblioteca de protocolos */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Library size={15} color="var(--inkFaint)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Biblioteca de protocolos</span>
          <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>({biblioteca.length})</span>
        </div>

        {biblioteca.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--inkFaint)", padding: "4px 0" }}>
            Você ainda não salvou nenhum protocolo. Os protocolos salvos ficam disponíveis para
            qualquer paciente e podem ser aplicados em novos ciclos.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {biblioteca.map((prot) => (
              <div key={prot.id} style={{ border: "1px solid var(--line)", borderRadius: 11, padding: "13px 15px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{prot.nome}</div>
                    <div style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 3 }}>
                      {(prot.itens || []).length} {(prot.itens || []).length === 1 ? "item" : "itens"}
                      {prot.itens?.length ? ` · ${prot.itens.slice(0, 3).map((i) => i.nome).join(", ")}${prot.itens.length > 3 ? "…" : ""}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => onAplicar(prot.itens || [], prot.nome)}
                      className="btn btn-ghost" style={{ fontSize: 12, gap: 5, padding: "5px 10px", color: "var(--brand)" }}>
                      <Plus size={13} /> {protocolosAplicadosNomes.includes(prot.nome) ? "Combinado" : "Combinar"}
                    </button>
                    <button onClick={() => abrirEdicao(prot)}
                      style={{ color: "var(--inkFaint)", padding: "5px 7px", borderRadius: 7 }} title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (window.confirm(`Remover o protocolo "${prot.nome}" da biblioteca?`)) onRemoverBiblioteca(prot.id); }}
                      style={{ color: "var(--inkFaint)", padding: "5px 7px", borderRadius: 7 }} title="Remover">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
