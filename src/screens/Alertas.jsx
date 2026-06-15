// src/screens/Alertas.jsx
// + useTotalAlertas considera dismissed (badge some quando você ignora)
// + dispatch event "alertas_changed" pro Shell recalcular o badge na hora
// + Nova regra: paciente bateu meta mas ainda está ativo → sugere desativar com PDF

import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, Clock, TrendingDown, UserX, Check, ArrowRight, Trophy } from "lucide-react";
import { useStore } from "../lib/store.jsx";
import { useToast } from "../lib/toast.jsx";
import { ultimoCiclo, br, metaPesoBatida, metaVisceralBatida } from "../lib/utils.js";
import { Avatar } from "../components/ui.jsx";

const DIAS_SEM_CICLO     = 45;
const DIAS_ESTAGNACAO    = 60;
const PERDA_MIN_KG       = 0.5;
const DIAS_PRIMEIRO_CICLO = 14;

const HOJE = () => new Date();

function diasDesde(data) {
  if (!data) return null;
  try {
    const d = data?.toDate ? data.toDate() : new Date(data);
    return Math.floor((HOJE() - d) / (1000 * 60 * 60 * 24));
  } catch { return null; }
}

function ultimaAtividade(p) {
  const c = ultimoCiclo(p);
  if (c?.data) return new Date(c.data);
  if (c?.criadoEm) return c.criadoEm?.toDate ? c.criadoEm.toDate() : new Date(c.criadoEm);
  if (p.inicio) return new Date(p.inicio);
  return null;
}

function lerDismissed() {
  try { return new Set(JSON.parse(localStorage.getItem("alertas_dismissed") || "[]")); }
  catch { return new Set(); }
}

export function calcularAlertas(pacientes) {
  const alertas = [];

  pacientes.forEach((p) => {
    if (!p.ativo) return;

    // ✅ NOVA REGRA: meta batida + ainda ativo
    const pesoBatido = metaPesoBatida(p);
    const visceralBatido = metaVisceralBatida(p);
    if (pesoBatido || visceralBatido) {
      alertas.push({
        id: `meta-${p.id}`,
        tipo: "meta_batida",
        paciente: p,
        dias: 0,
        severidade: "media",
        titulo: `🏆 ${p.nome} bateu ${pesoBatido && visceralBatido ? "as metas" : pesoBatido ? "a meta de peso" : "a meta de gordura visceral"}`,
        descricao: `Considere desativar o paciente com o PDF de parabenização. Você pode reativar a qualquer momento.`,
      });
    }

    const ultData = ultimaAtividade(p);
    const dias = ultData ? Math.floor((HOJE() - ultData) / (1000 * 60 * 60 * 24)) : null;

    if (p.ciclos.length === 0) {
      const dCad = diasDesde(p.inicio || p.criadoEm);
      if (dCad != null && dCad >= DIAS_PRIMEIRO_CICLO) {
        alertas.push({
          id: `nociclo-${p.id}`,
          tipo: "sem_ciclo",
          paciente: p,
          dias: dCad,
          severidade: dCad >= 30 ? "alta" : "media",
          titulo: `${p.nome} ainda não tem nenhum ciclo registrado`,
          descricao: `Cadastrado há ${dCad} dias sem nenhuma medição. Esse paciente ainda está ativo? Tem ${dCad} dias que você não atualiza ele. Caso esteja inativo, mude o status dele na aba Pacientes ou faça um follow-up.`,
        });
      }
      return;
    }

    if (dias != null && dias >= DIAS_SEM_CICLO) {
      alertas.push({
        id: `inativo-${p.id}`,
        tipo: "sem_ciclo_recente",
        paciente: p,
        dias,
        severidade: dias >= 90 ? "alta" : "media",
        titulo: `${p.nome} sem novo ciclo há ${dias} dias`,
        descricao: `Esse paciente está ativo? Tem ${dias} dias que você não atualiza ele. Caso esteja inativo, mude o status dele na aba Pacientes ou faça um follow-up.`,
      });
    }

    if (p.ciclos.length >= 2) {
      const ult = ultimoCiclo(p);
      const ultDataC = ult.data ? new Date(ult.data) : null;
      if (ultDataC) {
        for (let i = p.ciclos.length - 2; i >= 0; i--) {
          const c = p.ciclos[i];
          if (!c.data) continue;
          const dGap = Math.floor((ultDataC - new Date(c.data)) / (1000 * 60 * 60 * 24));
          if (dGap >= DIAS_ESTAGNACAO) {
            const diferenca = c.peso - ult.peso;
            if (diferenca < PERDA_MIN_KG) {
              alertas.push({
                id: `estagnacao-${p.id}`,
                tipo: "estagnacao",
                paciente: p,
                dias: dGap,
                diferenca: +diferenca.toFixed(1),
                severidade: diferenca <= 0 ? "alta" : "media",
                titulo: `${p.nome} estagnou nos últimos ${dGap} dias`,
                descricao: diferenca <= 0
                  ? `Ganhou ${br(Math.abs(diferenca).toFixed(1))} kg nos últimos ${dGap} dias. Pode ser hora de revisar dose ou suplementação.`
                  : `Perdeu apenas ${br(diferenca.toFixed(1))} kg em ${dGap} dias. Considere ajustar o protocolo.`,
              });
            }
            break;
          }
        }
      }
    }
  });

  return alertas.sort((a, b) => {
    const ordem = { alta: 0, media: 1, baixa: 2 };
    if (ordem[a.severidade] !== ordem[b.severidade]) return ordem[a.severidade] - ordem[b.severidade];
    return (b.dias || 0) - (a.dias || 0);
  });
}

// Hook usado pelo Shell pra mostrar o badge — escuta evento "alertas_changed"
export function useTotalAlertas() {
  const { pacientes } = useStore();
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const handler = () => setTrigger((t) => t + 1);
    window.addEventListener("alertas_changed", handler);
    return () => window.removeEventListener("alertas_changed", handler);
  }, []);

  return useMemo(() => {
    const dismissed = lerDismissed();
    return calcularAlertas(pacientes).filter((a) => !dismissed.has(a.id)).length;
  }, [pacientes, trigger]);
}

const COR = {
  alta:  { bg: "var(--warnSoft)",  border: "var(--warn)",  ink: "var(--warn)" },
  media: { bg: "var(--surface2)",  border: "var(--line)",  ink: "var(--inkSoft)" },
};

const ICONE = {
  sem_ciclo: UserX,
  sem_ciclo_recente: Clock,
  estagnacao: TrendingDown,
  meta_batida: Trophy,
};

export default function Alertas({ navegar }) {
  const { pacientes } = useStore();
  const toast = useToast();
  const [dismissed, setDismissed] = useState(lerDismissed);

  const alertasRaw = useMemo(() => calcularAlertas(pacientes), [pacientes]);
  const alertas = alertasRaw.filter((a) => !dismissed.has(a.id));

  const dispararEvento = () => {
    try { window.dispatchEvent(new Event("alertas_changed")); } catch {}
  };

  const ignorar = (id) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try { localStorage.setItem("alertas_dismissed", JSON.stringify([...next])); } catch {}
    dispararEvento();
    toast("Alerta dispensado");
  };

  const restaurarTodos = () => {
    setDismissed(new Set());
    localStorage.removeItem("alertas_dismissed");
    dispararEvento();
    toast("Alertas restaurados");
  };

  const porSeveridade = {
    alta: alertas.filter((a) => a.severidade === "alta").length,
    media: alertas.filter((a) => a.severidade === "media").length,
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 className="page-title">Alertas</h1>
          <p className="page-sub">Pacientes que precisam da sua atenção.</p>
        </div>
        {dismissed.size > 0 && (
          <button onClick={restaurarTodos} className="btn btn-ghost" style={{ fontSize: 13 }}>
            Restaurar ignorados ({dismissed.size})
          </button>
        )}
      </div>

      {alertas.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>Prioridade alta</span>
            <span className="tnum" style={{ fontSize: 24, fontWeight: 700, color: "var(--warn)" }}>{porSeveridade.alta}</span>
          </div>
          <div className="card" style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--inkFaint)" }}>Atenção média</span>
            <span className="tnum" style={{ fontSize: 24, fontWeight: 700, color: "var(--inkSoft)" }}>{porSeveridade.media}</span>
          </div>
        </div>
      )}

      {alertas.length === 0 ? (
        <div className="card" style={{ padding: "60px 30px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: 14, borderRadius: 99, background: "var(--goodSoft, #d6f0e4)", marginBottom: 16 }}>
            <Check size={28} color="var(--good)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Tudo em dia</div>
          <p style={{ fontSize: 14, color: "var(--inkSoft)", maxWidth: 380, margin: "0 auto" }}>
            Nenhum paciente ativo precisa de atenção urgente no momento. Continue acompanhando os ciclos.
          </p>
          {dismissed.size > 0 && (
            <button onClick={restaurarTodos} className="btn btn-ghost" style={{ marginTop: 20 }}>
              Ver {dismissed.size} ignorado{dismissed.size !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alertas.map((a) => {
            const cor = COR[a.severidade] || COR.media;
            const Icon = ICONE[a.tipo] || AlertTriangle;
            return (
              <div key={a.id} className="card" style={{
                padding: "16px 18px",
                borderLeft: `4px solid ${a.tipo === "meta_batida" ? "var(--good)" : cor.border}`,
                background: a.tipo === "meta_batida" ? "var(--brandSoft)" : a.severidade === "alta" ? cor.bg : "var(--surface)",
              }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0 }}>
                    <Avatar nome={a.paciente.nome} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <Icon size={15} color={a.tipo === "meta_batida" ? "var(--good)" : cor.ink} />
                      <span style={{ fontSize: 14.5, fontWeight: 700 }}>{a.titulo}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--inkSoft)", lineHeight: 1.55, marginBottom: 12 }}>{a.descricao}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn btn-primary sm" onClick={() => navegar("ficha", a.paciente.id)}>
                        Abrir ficha <ArrowRight size={13} />
                      </button>
                      {a.tipo !== "meta_batida" && (
                        <button className="btn btn-ghost sm" onClick={() => navegar("novociclo", a.paciente.id)}>
                          Registrar ciclo
                        </button>
                      )}
                      <button className="btn btn-ghost sm" onClick={() => ignorar(a.id)} style={{ color: "var(--inkFaint)", marginLeft: "auto" }}>
                        Dispensar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontSize: 11.5, color: "var(--inkFaint)", lineHeight: 1.6, textAlign: "center", padding: "8px 16px" }}>
        Alertas são calculados localmente a partir dos dados dos seus pacientes ativos. Dispensados ficam ocultos só neste navegador — você pode restaurá-los a qualquer momento.
      </div>
    </div>
  );
}
