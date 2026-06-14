// src/screens/Sobre.jsx
// Página institucional + CTA WhatsApp para Gabriel (representante comercial)

import { MessageCircle, Pill, Stethoscope, ShieldCheck, ArrowRight } from "lucide-react";
import { useIsMobile } from "../components/Shell.jsx";

// Edite aqui para mudar o número/mensagem do WhatsApp
const WHATSAPP_NUMERO = "5511999999999"; // ⚠️ TROQUE pelo número real com DDI (55) + DDD + número
const WHATSAPP_MSG    = encodeURIComponent(
  "Olá Gabriel, vi a Murev no Acompanha e gostaria de conversar sobre os protocolos."
);
const WHATSAPP_URL    = `https://wa.me/${WHATSAPP_NUMERO}?text=${WHATSAPP_MSG}`;

function Pilar({ Icon, titulo, texto }) {
  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <div style={{ display: "inline-flex", padding: 10, borderRadius: 10, background: "var(--brandSoft)", marginBottom: 14 }}>
        <Icon size={20} color="var(--brand)" />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{titulo}</h3>
      <p style={{ fontSize: 13.5, color: "var(--inkSoft)", lineHeight: 1.55 }}>{texto}</p>
    </div>
  );
}

export default function Sobre() {
  const isMobile = useIsMobile();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 36 }}>
      {/* Hero */}
      <div style={{ textAlign: isMobile ? "left" : "center" }}>
        <div style={{
          display: "inline-block", background: "var(--brandSoft)", color: "var(--brand)",
          fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
          padding: "4px 12px", borderRadius: 99, marginBottom: 18,
        }}>
          Sobre a Murev
        </div>
        <h1 style={{ fontSize: isMobile ? 26 : 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15, marginBottom: 12 }}>
          Tecnologia clínica para quem leva o emagrecimento a sério.
        </h1>
        <p style={{ fontSize: 15.5, color: "var(--inkSoft)", lineHeight: 1.6, maxWidth: 560, margin: isMobile ? 0 : "0 auto" }}>
          A Murev é uma rede de soluções clínicas voltada para o segmento magistral
          injetável de dupla ação. Conectamos médicos a farmácias parceiras, oferecemos
          ferramentas de acompanhamento como este sistema e damos suporte técnico para
          que cada protocolo seja entregue com segurança e previsibilidade.
        </p>
      </div>

      {/* Pilares */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
        <Pilar
          Icon={Pill}
          titulo="Rede magistral"
          texto="Acesso curado a farmácias de manipulação especializadas no segmento, com padrões consistentes de qualidade e logística."
        />
        <Pilar
          Icon={Stethoscope}
          titulo="Apoio ao médico"
          texto="Suporte técnico para construção de protocolos, materiais educativos e ferramentas digitais para gestão de pacientes."
        />
        <Pilar
          Icon={ShieldCheck}
          titulo="Segurança & conformidade"
          texto="Tudo dentro do que a legislação brasileira permite ao segmento magistral, com responsabilidade técnica e farmacêutica."
        />
      </div>

      {/* Sobre o Murev Acompanha */}
      <div className="card" style={{ padding: "26px 28px" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
          Murev Acompanha — onde você está agora
        </h2>
        <p style={{ fontSize: 14, color: "var(--inkSoft)", lineHeight: 1.65 }}>
          Esta ferramenta é parte do nosso compromisso com você. Foi desenhada para
          tirar a operação do papel e do WhatsApp, dar visibilidade real da evolução
          dos seus pacientes e gerar relatórios clínicos prontos para entrega. Acreditamos
          que o médico que acompanha melhor retém melhor — e a retenção é o que
          sustenta o seu negócio.
        </p>
      </div>

      {/* CTA WhatsApp */}
      <div style={{
        background: "linear-gradient(135deg, var(--brand), var(--brandDeep, #0a5d63))",
        borderRadius: 18,
        padding: isMobile ? "28px 22px" : "36px 32px",
        color: "#fff",
      }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 22, alignItems: isMobile ? "flex-start" : "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: 0.7, marginBottom: 8 }}>
              Quer ampliar sua operação?
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.25 }}>
              Fale com Gabriel, nosso representante.
            </h2>
            <p style={{ fontSize: 14, opacity: 0.92, lineHeight: 1.55 }}>
              Se você ainda não trabalha com nossa rede magistral ou quer condições especiais
              para volume, é só chamar. Atendimento direto, sem intermediários.
            </p>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              background: "#fff", color: "var(--brand)",
              padding: "13px 22px", borderRadius: 11,
              fontSize: 15, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
              whiteSpace: "nowrap",
            }}
          >
            <MessageCircle size={18} /> Chamar no WhatsApp <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* Rodapé sutil */}
      <div style={{ textAlign: "center", fontSize: 12, color: "var(--inkFaint)", lineHeight: 1.6, paddingBottom: 8 }}>
        Murev · Segmento magistral · CNPJ e responsabilidade técnica conforme legislação aplicável.
      </div>
    </div>
  );
}
