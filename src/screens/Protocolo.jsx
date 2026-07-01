// src/screens/Protocolo.jsx
// Tab "Medicamentos" dentro do paciente (prontuário).
//   - Medicamentos em uso → depleção de nutrientes
//   - Ação para levar os nutrientes depletados direto para o protocolo de
//     suplementação real do paciente (aba "Suplementos"), seja criando um
//     protocolo novo, aplicando a um já existente da biblioteca, ou
//     adicionando direto ao protocolo atualmente aplicado ao paciente.
// Salva no Firestore do paciente. A anamnese lê/escreve o mesmo campo medicamentosLista.

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Check, Pill, Sparkles, ArrowRight, Plus } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { useToast } from "../lib/toast.jsx";
import { getProtocolo, salvarProtocolo, getAnamnese, salvarAnamnese } from "../services/db-exames.js";
import { nutrientesDepletados } from "../lib/medicamentos.js";
import DeplecaoMedicamentos from "../components/DeplecaoMedicamentos.jsx";

export default function Protocolo({ pacienteId, pacienteNome, suplementosAtuais = [], onAdicionarSuplemento, onEnviarParaSuplementos }) {
  const { user } = useAuth();
  const toast = useToast();
  const [medicamentos, setMedicamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sujo, setSujo] = useState(false);

  const carregar = useCallback(async () => {
    if (!user || !pacienteId) return;
    try {
      const proto = await getProtocolo(user.uid, pacienteId);
      // medicamentos podem ter sido preenchidos na anamnese — usa o mais completo
      const anam = await getAnamnese(user.uid, pacienteId);
      const medsAnam = anam?.medicamentosLista || [];
      const medsProto = proto?.medicamentos || [];
      const meds = medsProto.length ? medsProto : medsAnam;
      setMedicamentos(meds);
    } catch (e) { console.error(e); toast("Erro ao carregar protocolo."); }
    finally { setCarregando(false); }
  }, [user, pacienteId]);

  useEffect(() => { carregar(); }, [carregar]);

  const setMeds = (lista) => { setMedicamentos(lista); setSujo(true); };

  const salvar = async () => {
    setSalvando(true);
    try {
      await salvarProtocolo(user.uid, pacienteId, { medicamentos });
      // mantém a anamnese sincronizada com os medicamentos
      await salvarAnamnese(user.uid, pacienteId, { medicamentosLista: medicamentos });
      toast("Medicamentos salvos.");
      setSujo(false);
    } catch (e) { console.error(e); toast("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  if (carregando) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 size={24} className="spin" color="var(--inkFaint)" /></div>;
  }

  const mapaDepletados = nutrientesDepletados(medicamentos);
  const depletados = Object.keys(mapaDepletados);
  const nomesAtuais = suplementosAtuais.map((i) => (typeof i === "string" ? i : i.nome));
  const pendentes = depletados.filter((n) => !nomesAtuais.includes(n));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Medicamentos</h2>
          <p style={{ fontSize: 13, color: "var(--inkFaint)", margin: "4px 0 0" }}>
            Medicamentos em uso{pacienteNome ? ` de ${pacienteNome}` : ""} e nutrientes possivelmente depletados.
          </p>
        </div>
        <button onClick={salvar} disabled={salvando || !sujo} className="btn btn-primary" style={{ opacity: sujo ? 1 : 0.5 }}>
          {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : sujo ? <><Save size={15} /> Salvar</> : <><Check size={15} /> Salvo</>}
        </button>
      </div>

      {/* Medicamentos */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Pill size={17} color="var(--brand)" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Medicamentos em uso</span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 16 }}>
          Os medicamentos do paciente e os nutrientes que podem ser reduzidos por eles.
        </p>
        <DeplecaoMedicamentos valor={medicamentos} onChange={setMeds} />
      </div>

      {/* Ponte para o protocolo de suplementação real do paciente */}
      {depletados.length > 0 && (
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Sparkles size={16} color="var(--brand)" />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Levar para o protocolo de suplementação</span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 14 }}>
            {pendentes.length > 0
              ? "Estes nutrientes ainda não estão no protocolo atual do paciente:"
              : "Todos os nutrientes depletados já estão no protocolo atual do paciente."}
          </p>

          {pendentes.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {pendentes.map((n) => (
                <button key={n} onClick={() => onAdicionarSuplemento && onAdicionarSuplemento(n)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 99, background: "var(--surface)", color: "var(--brand)", border: "1px solid var(--brand)" }}>
                  <Plus size={13} /> {n}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-primary" style={{ fontSize: 13, gap: 7 }}
              onClick={() => onEnviarParaSuplementos && onEnviarParaSuplementos(depletados)}>
              <ArrowRight size={14} /> Criar novo protocolo com estes itens
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 13, gap: 7 }}
              onClick={() => onEnviarParaSuplementos && onEnviarParaSuplementos(null)}>
              Ver biblioteca / vincular a protocolo existente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
