import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Veiculos from "./pages/Veiculos";
import Funcionarios from "./pages/Funcionarios";
import Abastecimentos from "./pages/Abastecimentos";
import Manutencoes from "./pages/Manutencoes";
import Financeiro from "./pages/Financeiro";
import Adiantamentos from "./pages/Adiantamentos";
import Viagens from "./pages/Viagens";
import Checklist from "./pages/Checklist";
import Empresa from "./pages/Empresa";
import Custos from "./pages/Custos";
import SimuladorViagem from "./pages/SimuladorViagem";
import Despachante from "./pages/Despachante";
import Usuarios from "./pages/Usuarios";
import SaidaEntrega from "./pages/SaidaEntrega";
import SaidaViagem from "./pages/SaidaViagem";
import RetornoVeiculo from "./pages/RetornoVeiculo";
import Relatorios from "./pages/Relatorios";
import EstoqueCombustivel from "./pages/EstoqueCombustivel";
import Multas from "./pages/Multas";
import Relatos from "./pages/Relatos";
import DocumentacaoFrota from "./pages/DocumentacaoFrota";
import Alertas from "./pages/Alertas";
import Acertos from "./pages/Acertos";
import Calendario from "./pages/Calendario";
import Acidentes from "./pages/Acidentes";
import PlanoManutencao from "./pages/PlanoManutencao";
import PainelMaster from "./pages/PainelMaster";
import Permissoes from "./pages/Permissoes";
import Chat from "./pages/Chat";
import Login from "./pages/Login";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        {/* Dashboard */}
        <Route path="/dashboard" component={Dashboard} />

        {/* Despachante */}
        <Route path="/despachante" component={Despachante} />
        <Route path="/despachante/entrega" component={SaidaEntrega} />
        <Route path="/despachante/viagem" component={SaidaViagem} />
        <Route path="/despachante/retorno" component={RetornoVeiculo} />

        {/* Operacional */}
        <Route path="/viagens" component={Viagens} />
        <Route path="/abastecimentos" component={Abastecimentos} />

        {/* Frota */}
        <Route path="/veiculos" component={Veiculos} />
        <Route path="/funcionarios" component={Funcionarios} />
        <Route path="/manutencoes" component={Manutencoes} />
        <Route path="/plano-manutencao" component={PlanoManutencao} />

        {/* Gestão */}
        <Route path="/gestao/estoque-combustivel" component={EstoqueCombustivel} />
        <Route path="/gestao/multas" component={Multas} />
        <Route path="/gestao/acidentes" component={Acidentes} />
        <Route path="/gestao/acertos" component={Acertos} />
        <Route path="/checklist" component={Checklist} />
        <Route path="/gestao/relatos" component={Relatos} />
        <Route path="/gestao/documentos" component={DocumentacaoFrota} />
        <Route path="/gestao/alertas" component={Alertas} />
        <Route path="/gestao/calendario" component={Calendario} />

        {/* Sistema */}
        <Route path="/chat" component={Chat} />
        <Route path="/relatorios" component={Relatorios} />
        <Route path="/usuarios" component={Usuarios} />
        <Route path="/empresa" component={Empresa} />

        {/* Financeiro */}
        <Route path="/financeiro" component={Financeiro} />
        <Route path="/financeiro/receber" component={Financeiro} />
        <Route path="/financeiro/adiantamentos" component={Adiantamentos} />
        <Route path="/adiantamentos" component={Adiantamentos} />
        <Route path="/custos" component={Custos} />
        <Route path="/simulador-viagem" component={SimuladorViagem} />

        {/* Master */}
        <Route path="/master/painel" component={PainelMaster} />
        <Route path="/master/permissoes" component={Permissoes} />

        {/* Fallback dentro do dashboard */}
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Landing page sem sidebar */}
      <Route path="/" component={Home} />

      {/* Login page */}
      <Route path="/login" component={Login} />

      {/* 404 explícito */}
      <Route path="/404" component={NotFound} />

      {/* Todas as outras rotas com DashboardLayout persistente */}
      <Route>
        <DashboardRoutes />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
