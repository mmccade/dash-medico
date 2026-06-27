// src/screens/Protocolo.jsx
// Tab "Medicamentos e Suplementos" dentro do paciente (prontuário).
//   - Medicamentos em uso → depleção de nutrientes
//   - Planejador de suplementos → sinergismo/antagonismo + reposição sugerida
// Salva no Firestore do paciente. A anamnese lê/escreve o mesmo campo medicamentosLista.

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Check, Pill, FlaskConical } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { useToast } from "../lib/toast.jsx";
import { getProtocolo, salvarProtocolo, getAnamnese, salvarAnamnese } from "../services/db-exames.js";
import { nutrientesDepletados } from "../lib/medicamentos.js";
import DeplecaoMedicamentos from "../components/DeplecaoMedicamentos.jsx";
import PlanejadorSuplementos from "../components/PlanejadorSuplementos.jsx";

export default function Protocolo({ pacienteId, pacienteNome }) {
  const { user } = useAuth();
  const toast = useToast();
  const [medicamentos, setMedicamentos] = useState([]);
  const [suplementos, setSuplementos] = useState([]);
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
      setSuplementos(proto?.suplementos || []);
    } catch (e) { console.error(e); toast("Erro ao carregar protocolo."); }
    finally { setCarregando(false); }
  }, [user, pacienteId]);

  useEffect(() => { carregar(); }, [carregar]);

  const setMeds = (lista) => { setMedicamentos(lista); setSujo(true); };
  const setSups = (lista) => { setSuplementos(lista); setSujo(true); };

  const salvar = async () => {
    setSalvando(true);
    try {
      await salvarProtocolo(user.uid, pacienteId, { medicamentos, suplementos });
      // mantém a anamnese sincronizada com os medicamentos
      await salvarAnamnese(user.uid, pacienteId, { medicamentosLista: medicamentos });
      toast("Protocolo salvo.");
      setSujo(false);
    } catch (e) { console.error(e); toast("Erro ao salvar."); }
    finally { setSalvando(false); }
  };

  if (carregando) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 size={24} className="spin" color="var(--inkFaint)" /></div>;
  }

  const depletados = Object.keys(nutrientesDepletados(medicamentos));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Medicamentos e Suplementos</h2>
          <p style={{ fontSize: 13, color: "var(--inkFaint)", margin: "4px 0 0" }}>
            Monte o protocolo{pacienteNome ? ` de ${pacienteNome}` : ""} e veja interações.
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

      {/* Suplementos */}
      <div className="card" style={{ padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <FlaskConical size={17} color="var(--brand)" />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Planejador de suplementos</span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--inkFaint)", marginBottom: 16 }}>
          Monte o protocolo de suplementação. O sistema mostra sinergismos e antagonismos entre os itens.
        </p>
        <PlanejadorSuplementos valor={suplementos} onChange={setSups} sugestoesDepleção={depletados} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={salvar} disabled={salvando || !sujo} className="btn btn-primary" style={{ opacity: sujo ? 1 : 0.5 }}>
          {salvando ? <><Loader2 size={14} className="spin" /> Salvando…</> : sujo ? <><Save size={15} /> Salvar protocolo</> : <><Check size={15} /> Tudo salvo</>}
        </button>
      </div>
    </div>
  );
}
