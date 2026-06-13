// src/screens/Importar.jsx
import { useState, useRef } from "react";
import { ArrowLeft, Download, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { parseNum } from "../lib/utils.js";

export default function Importar({ navegar }) {
  const { addPacientesEmLote } = useStore();
  const toast = useToast();
  const [resultado, setResultado] = useState(null);
  const inputRef = useRef(null);

  const baixarModelo = async () => {
    try {
      const XLSX = await import("xlsx");
      const dados = [
        ["nome", "idade", "sexo", "altura", "objetivo", "condicoes", "mes", "peso", "gordura", "visceral"],
        ["Paciente Exemplo", 42, "Feminino", 1.64, "Emagrecimento", "Pré-diabetes", "Mai/26", 94.2, 41.0, 13],
        ["Outro Exemplo", 51, "Masculino", 1.78, "Controle glicêmico", "Diabetes tipo 2", "Mai/26", 108.5, 34.2, 17],
      ];
      const ws = XLSX.utils.aoa_to_sheet(dados);
      ws["!cols"] = [{ wch: 22 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 26 }, { wch: 22 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
      XLSX.writeFile(wb, "modelo_pacientes_murev.xlsx");
      toast("Modelo baixado");
    } catch (e) { console.error(e); toast("Erro ao gerar modelo"); }
  };

  const processar = async (file) => {
    if (!file) return;
    toast("Lendo planilha…");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const ok = [], erros = [];
      linhas.forEach((row, i) => {
        const num = i + 2;
        const nome = String(row.nome || "").trim();
        if (!nome) { erros.push({ linha: num, motivo: "sem nome" }); return; }
        const pac = {
          nome, idade: parseInt(row.idade) || 0, sexo: String(row.sexo || "").trim() || "Feminino",
          altura: parseNum(row.altura) || 1.7, objetivo: String(row.objetivo || "").trim() || "—",
          comorbidades: String(row.condicoes || "").trim() || "Nenhuma relatada",
          inicio: "2026-05-08", ativo: true, ciclos: [],
        };
        if (row.peso || row.mes) {
          pac.ciclos.push({
            mes: String(row.mes || "Mês 1").trim(), peso: parseNum(row.peso), gordura: parseNum(row.gordura),
            visceral: parseInt(row.visceral) || 0, unidade: "MG", doses: [0, 0, 0, 0], local: "Casa",
            suplementacao: "", colaterais: "", obs: "Importado via planilha",
          });
        }
        ok.push(pac);
      });
      if (ok.length) await addPacientesEmLote(ok);
      setResultado({ ok: ok.length, erros });
      toast(`${ok.length} paciente(s) importado(s)`);
    } catch (e) { console.error(e); toast("Erro ao ler a planilha"); }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <button onClick={() => navegar("pacientes")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13 }}>
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>
      <div><h1 className="page-title">Importar planilha</h1><p className="page-sub">Cadastre vários pacientes de uma vez.</p></div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Como funciona</h3>
        <ol style={{ fontSize: 13.5, color: "var(--inkSoft)", lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>Baixe o modelo de planilha.</li>
          <li>Preencha uma linha por paciente.</li>
          <li>Suba o arquivo preenchido (.xlsx ou .csv).</li>
        </ol>
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={baixarModelo}>
          <Download size={16} /> Baixar modelo de planilha
        </button>
      </div>

      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Enviar planilha preenchida</h3>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => processar(e.target.files[0])} />
        <button onClick={() => inputRef.current?.click()} style={{
          width: "100%", border: "1.5px dashed var(--line)", borderRadius: 11, padding: 26,
          background: "var(--surface2)", color: "var(--inkSoft)", fontSize: 13.5, display: "flex",
          flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <Upload size={22} color="var(--brand)" />
          Clique para selecionar · .xlsx ou .csv
        </button>
        <p style={{ fontSize: 12, color: "var(--inkFaint)", marginTop: 10, lineHeight: 1.5 }}>
          Colunas: nome, idade, sexo, altura, objetivo, condicoes. Opcionais (1º ciclo): mes, peso, gordura, visceral.
        </p>
      </div>

      {resultado && (
        <div className="card" style={{ padding: "20px 22px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Resultado</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: resultado.erros.length ? 16 : 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 20, background: "var(--goodSoft)", color: "var(--good)" }}>
              <CheckCircle2 size={15} /> {resultado.ok} importado(s)
            </span>
            {resultado.erros.length > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 20, background: "var(--warnSoft)", color: "var(--warn)" }}>
                <AlertCircle size={15} /> {resultado.erros.length} com erro
              </span>
            )}
          </div>
          {resultado.erros.length > 0 && (
            <div style={{ fontSize: 12.5, color: "var(--inkSoft)", lineHeight: 1.7 }}>
              {resultado.erros.map((e, i) => <div key={i}>Linha {e.linha}: {e.motivo}</div>)}
            </div>
          )}
          {resultado.ok > 0 && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navegar("pacientes")}>Ver pacientes</button>}
        </div>
      )}
    </div>
  );
}
