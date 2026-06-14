// src/screens/Importar.jsx
// NOVO FORMATO: 1 linha = 1 ciclo. Paciente com 18 meses = 18 linhas com o mesmo nome.
// O sistema agrupa as linhas pelo nome do paciente e monta os ciclos em ordem de data.
// Campos opcionais: gordura, visceral, dose_s1..s4, local, suplementacao, colaterais, obs
// Campo novo: data_inicio (quando o médico começou a tratar esse paciente)

import { useState, useRef } from "react";
import { ArrowLeft, Download, Upload, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { parseNum } from "../lib/utils.js";
import { validatePaciente, validateCiclo } from "../lib/validate.js";

// ─── Modelo de planilha ───────────────────────────────────────
const CABECALHO = [
  "nome",           // obrigatório — agrupa ciclos do mesmo paciente
  "data_inicio",    // AAAA-MM-DD — início do tratamento (mesmo valor em todas as linhas do paciente)
  "idade",
  "sexo",           // Feminino | Masculino
  "altura",         // metros: 1.64
  "objetivo",
  "condicoes",
  "mes",            // obrigatório — ex: Mai/26, Jun/26
  "data_ciclo",     // AAAA-MM-DD — data do ciclo (para ordenar corretamente)
  "peso",           // obrigatório — kg
  "gordura",        // % gordura corporal (opcional)
  "visceral",       // gordura visceral (opcional)
  "unidade",        // MG | UI (opcional, default MG)
  "dose_s1",        // semana 1 (opcional)
  "dose_s2",
  "dose_s3",
  "dose_s4",
  "local",          // Casa | Clínica (opcional)
  "suplementacao",
  "colaterais",
  "obs",
];

const EXEMPLOS = [
  // Paciente 1 — 3 meses de histórico
  ["Maria Oliveira", "2026-03-01", 42, "Feminino", 1.64, "Emagrecimento", "Pré-diabetes", "Mar/26", "2026-03-15", 94.2, 41.0, 13, "MG", 2.5, 2.5, 2.5, 5.0, "Casa", "Vitamina D", "Náusea leve", "Adaptação inicial"],
  ["Maria Oliveira", "2026-03-01", 42, "Feminino", 1.64, "Emagrecimento", "Pré-diabetes", "Abr/26", "2026-04-15", 90.8, 39.5, 12, "MG", 5.0, 5.0, 5.0, 5.0, "Casa", "Vitamina D", "", "Boa adesão"],
  ["Maria Oliveira", "2026-03-01", 42, "Feminino", 1.64, "Emagrecimento", "Pré-diabetes", "Mai/26", "2026-05-15", 87.1, 37.2, 11, "MG", 5.0, 7.5, 7.5, 7.5, "Casa", "Vitamina D", "", "Perda acelerada"],
  // Paciente 2 — 1 ciclo
  ["João Costa",    "2026-04-01", 51, "Masculino", 1.78, "Controle glicêmico", "Diabetes tipo 2", "Mai/26", "2026-05-10", 108.5, 34.2, 17, "MG", 2.5, 2.5, 2.5, 2.5, "Clínica", "", "Constipação", "Início de protocolo"],
];

// ─── Tela ─────────────────────────────────────────────────────
export default function Importar({ navegar }) {
  const { addPacientesEmLote } = useStore();
  const toast = useToast();
  const [resultado, setResultado] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  // Baixa modelo .xlsx
  const baixarModelo = async () => {
    try {
      const XLSX = await import("xlsx");
      const dados = [CABECALHO, ...EXEMPLOS];
      const ws = XLSX.utils.aoa_to_sheet(dados);
      ws["!cols"] = CABECALHO.map((c) =>
        ["nome", "objetivo", "condicoes", "obs", "colaterais", "suplementacao"].includes(c)
          ? { wch: 26 }
          : { wch: 13 }
      );
      // Congela cabeçalho
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
      XLSX.writeFile(wb, "modelo_pacientes_murev.xlsx");
      toast("Modelo baixado");
    } catch (e) {
      console.error(e);
      toast("Erro ao gerar modelo");
    }
  };

  // Agrupa linhas por nome de paciente e monta objetos
  const processar = async (file) => {
    if (!file) return;
    toast("Lendo planilha…");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const pacientesMap = new Map(); // nome normalizado → {dadosPaciente, ciclos[]}
      const erros = [];

      linhas.forEach((row, i) => {
        const num = i + 2;
        const nome = String(row.nome || "").trim();
        if (!nome) { erros.push({ linha: num, motivo: "sem nome" }); return; }

        const nomeKey = nome.toLowerCase();

        if (!pacientesMap.has(nomeKey)) {
          // Primeira vez que vemos esse paciente: valida dados base
          const rawPac = {
            nome,
            idade: row.idade,
            sexo: String(row.sexo || "Feminino").trim(),
            altura: row.altura,
            objetivo: String(row.objetivo || "").trim(),
            comorbidades: String(row.condicoes || "").trim(),
            inicio: String(row.data_inicio || "").trim() || new Date().toISOString().slice(0, 10),
          };
          const { data: dadosPac, errors: errPac } = validatePaciente(rawPac);
          if (errPac.length) {
            erros.push({ linha: num, motivo: `paciente inválido: ${errPac[0].campo} ${errPac[0].err}` });
            return;
          }
          pacientesMap.set(nomeKey, { dados: dadosPac, ciclos: [], linhasComErro: [] });
        }

        const entrada = pacientesMap.get(nomeKey);

        // Valida ciclo desta linha
        const rawCiclo = {
          mes: String(row.mes || "").trim(),
          peso: row.peso,
          gordura: row.gordura,
          visceral: row.visceral,
          unidade: String(row.unidade || "MG").trim().toUpperCase() || "MG",
          doses: [row.dose_s1, row.dose_s2, row.dose_s3, row.dose_s4].map(parseNum),
          local: String(row.local || "Casa").trim(),
          suplementacao: String(row.suplementacao || "").trim(),
          colaterais: String(row.colaterais || "").trim(),
          obs: String(row.obs || "").trim() || "Importado via planilha",
        };

        const { data: dadosCiclo, errors: errCiclo } = validateCiclo(rawCiclo);
        if (errCiclo.length) {
          erros.push({ linha: num, motivo: `ciclo inválido: ${errCiclo[0].campo} ${errCiclo[0].err}` });
          entrada.linhasComErro.push(num);
          return;
        }

        // Adiciona data_ciclo para ordenação (se informada)
        const dataCicloRaw = String(row.data_ciclo || "").trim();
        dadosCiclo._dataOrdenacao = dataCicloRaw || `9999-${entrada.ciclos.length}`;
        entrada.ciclos.push(dadosCiclo);
      });

      // Monta lista final de pacientes com ciclos ordenados por data
      const pacientes = [];
      for (const [, entrada] of pacientesMap) {
        if (entrada.ciclos.length === 0) continue;
        entrada.ciclos.sort((a, b) => a._dataOrdenacao.localeCompare(b._dataOrdenacao));
        // Remove campo interno antes de salvar
        entrada.ciclos.forEach((c) => delete c._dataOrdenacao);
        pacientes.push({ ...entrada.dados, ciclos: entrada.ciclos, ativo: true });
      }

      let importados = 0;
      if (pacientes.length) {
        await addPacientesEmLote(pacientes);
        importados = pacientes.length;
      }

      setResultado({ ok: importados, ciclos: pacientes.reduce((s, p) => s + p.ciclos.length, 0), erros });
      setPreview(pacientes);
      toast(`${importados} paciente(s) importado(s)`);
    } catch (e) {
      console.error(e);
      toast("Erro ao ler a planilha");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <button onClick={() => navegar("pacientes")} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--inkFaint)", fontSize: 13 }}>
        <ArrowLeft size={15} /> Voltar para pacientes
      </button>
      <div>
        <h1 className="page-title">Importar planilha</h1>
        <p className="page-sub">Cadastre vários pacientes com todo o histórico de uma vez.</p>
      </div>

      {/* Instruções */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Como funciona</h3>
        <ol style={{ fontSize: 13.5, color: "var(--inkSoft)", lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li>Baixe o modelo de planilha.</li>
          <li><strong>Cada linha é um ciclo mensal.</strong> Se o paciente tem 18 meses, são 18 linhas com o mesmo nome.</li>
          <li>Repita os dados do paciente (nome, altura, etc.) em todas as linhas dele — o sistema agrupa automaticamente.</li>
          <li>Use <code>data_ciclo</code> (AAAA-MM-DD) para garantir a ordem correta dos ciclos.</li>
          <li>Suba o arquivo preenchido (.xlsx ou .csv).</li>
        </ol>

        <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--surface2)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Info size={15} color="var(--brand)" style={{ marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--inkSoft)" }}>
            Campos obrigatórios: <strong>nome</strong>, <strong>mes</strong>, <strong>peso</strong>. Todos os outros são opcionais.
          </span>
        </div>

        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={baixarModelo}>
          <Download size={16} /> Baixar modelo de planilha
        </button>
      </div>

      {/* Upload */}
      <div className="card" style={{ padding: "20px 22px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Carregar arquivo</h3>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed var(--line)", borderRadius: 12, padding: "36px 24px",
            textAlign: "center", cursor: "pointer", transition: "border-color .2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--brand)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line)"}
        >
          <Upload size={28} color="var(--inkFaint)" style={{ margin: "0 auto 10px" }} />
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Clique para selecionar</p>
          <p style={{ fontSize: 13, color: "var(--inkFaint)" }}>.xlsx ou .csv</p>
        </div>
        <input ref={inputRef} type="file" accept=".xlsx,.csv" style={{ display: "none" }}
          onChange={(e) => processar(e.target.files[0])} />
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="card" style={{ padding: "20px 22px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Resultado da importação</h3>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: resultado.erros.length ? 16 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--good)", fontWeight: 600 }}>
              <CheckCircle2 size={18} /> {resultado.ok} paciente(s) importado(s) · {resultado.ciclos} ciclo(s)
            </div>
          </div>

          {resultado.erros.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--bad, #c0392b)", fontWeight: 600, marginBottom: 10 }}>
                <AlertCircle size={16} /> {resultado.erros.length} linha(s) com erro ignorada(s)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {resultado.erros.map((e, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--inkSoft)", padding: "8px 12px", background: "var(--surface2)", borderRadius: 8 }}>
                    Linha {e.linha}: {e.motivo}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview dos pacientes importados */}
          {preview && preview.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--inkFaint)", marginBottom: 10 }}>Pacientes importados</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {preview.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{p.nome}</span>
                    <span style={{ color: "var(--inkFaint)" }}>{p.ciclos.length} ciclo(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navegar("pacientes")}>Ver pacientes</button>
            <button className="btn btn-ghost" onClick={() => { setResultado(null); setPreview(null); }}>Importar mais</button>
          </div>
        </div>
      )}
    </div>
  );
}
