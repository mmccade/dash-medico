// src/App.jsx

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { StoreProvider } from "./lib/store.jsx";
import { useAuth } from "./lib/auth.jsx";
import { sair } from "./services/auth.js";
import Shell from "./components/Shell.jsx";
import Login from "./screens/Login.jsx";
import Admin from "./screens/Admin.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Pacientes from "./screens/Pacientes.jsx";
import Ficha from "./screens/Ficha.jsx";
import Evolucao from "./screens/Evolucao.jsx";
import NovoCiclo from "./screens/NovoCiclo.jsx";
import NovoPaciente from "./screens/NovoPaciente.jsx";
import Importar from "./screens/Importar.jsx";
import Config from "./screens/Config.jsx";
import MeuPerfil from "./screens/MeuPerfil.jsx";
import ContaPausada from "./screens/ContaPausada.jsx";
import Sobre from "./screens/Sobre.jsx";
import Alertas from "./screens/Alertas.jsx";
import Relatorio from "./screens/Relatorio.jsx";
import ModalPlanos from "./components/ModalPlanos.jsx";

function TelaCarregando() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <Loader2 size={30} className="spin" color="var(--inkFaint)" />
    </div>
  );
}

function AppMedico() {
  const [tela, setTela] = useState("dashboard");
  const [pacienteId, setPacienteId] = useState(null);

  const navegar = (novaTela, pid) => {
    if (pid !== undefined) setPacienteId(pid);
    setTela(novaTela);
    window.scrollTo(0, 0);
  };

  return (
    <Shell tela={tela} navegar={navegar} onLogout={() => sair()}>
      {tela === "dashboard"    && <Dashboard navegar={navegar} />}
      {tela === "pacientes"    && <Pacientes navegar={navegar} />}
      {tela === "ficha"        && <Ficha pacienteId={pacienteId} navegar={navegar} />}
      {tela === "evolucao"     && <Evolucao pacienteIdInicial={pacienteId} />}
      {tela === "novociclo"    && <NovoCiclo pacienteId={pacienteId} navegar={navegar} />}
      {tela === "novopaciente" && <NovoPaciente navegar={navegar} />}
      {tela === "importar"     && <Importar navegar={navegar} />}
      {tela === "config"       && <Config />}
      {tela === "meuperfil"    && <MeuPerfil />}
      {tela === "sobre"        && <Sobre />}
      {tela === "alertas"      && <Alertas navegar={navegar} />}
      {tela === "relatorio"    && <Relatorio />}
    </Shell>
  );
}

export default function App() {
  const { user, perfil, carregando, isAdmin, firebaseAtivo } = useAuth();

  if (!firebaseAtivo) return <StoreProvider><AppMedico /></StoreProvider>;
  if (carregando) return <TelaCarregando />;
  if (!user) return <Login />;
  if (isAdmin) return <Admin />;

  // Assinatura pausada (cancelamento/expiração via webhook Cacto):
  // bloqueia o acesso SEM apagar dados. Admin nunca é pausado (return acima).
  if (perfil?.status === "pausado") return <ContaPausada />;

  // Acesso expirado por prazo (acessoAte no passado)
  if (perfil?.acessoAte && perfil.plano !== "vitalicio") {
    const ate = perfil.acessoAte?.toDate ? perfil.acessoAte.toDate() : new Date(perfil.acessoAte);
    if (ate < new Date()) return <ContaPausada />;
  }

  const semPlano = perfil && (!perfil.plano || perfil.plano === "nenhum");

  return (
    <StoreProvider>
      <AppMedico />
      {semPlano && <ModalPlanos />}
    </StoreProvider>
  );
}
