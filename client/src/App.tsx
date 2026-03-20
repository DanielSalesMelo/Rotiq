import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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
import { GestaoPlaceholder } from "./pages/GestaoPlaceholder";
import {
  Gauge, AlertTriangle, Shield, DollarSign, BookOpen,
  FileText, Bell, Calendar, ClipboardList
} from "lucide-react";

function Router() {
  return (
    <Switch>
      {/* Raiz */}
      <Route path="/" component={Home} />

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
      <Route path="/plano-manutencao" component={() => (
        <GestaoPlaceholder
          titulo="Plano de Manutenção"
          descricao="Gerencie os planos preventivos de manutenção por km ou período"
          icone={<ClipboardList className="h-6 w-6 text-primary" />}
        />
      )} />

      {/* Gestão */}
      <Route path="/gestao/estoque-combustivel" component={() => (
        <GestaoPlaceholder
          titulo="Estoque de Combustível"
          descricao="Controle o estoque interno de diesel e ARLA"
          icone={<Gauge className="h-6 w-6 text-primary" />}
        />
      )} />
      <Route path="/gestao/multas" component={() => (
        <GestaoPlaceholder
          titulo="Multas"
          descricao="Registre e acompanhe as multas de trânsito da frota"
          icone={<AlertTriangle className="h-6 w-6 text-primary" />}
        />
      )} />
      <Route path="/gestao/acidentes" component={() => (
        <GestaoPlaceholder
          titulo="Acidentes"
          descricao="Registre e gerencie ocorrências de acidentes"
          icone={<Shield className="h-6 w-6 text-primary" />}
        />
      )} />
      <Route path="/gestao/acertos" component={() => (
        <GestaoPlaceholder
          titulo="Acertos"
          descricao="Controle os acertos financeiros com motoristas e ajudantes"
          icone={<DollarSign className="h-6 w-6 text-primary" />}
        />
      )} />
      <Route path="/checklist" component={Checklist} />
      <Route path="/gestao/relatos" component={() => (
        <GestaoPlaceholder
          titulo="Relatos"
          descricao="Registre ocorrências e relatos operacionais"
          icone={<BookOpen className="h-6 w-6 text-primary" />}
        />
      )} />
      <Route path="/gestao/documentos" component={() => (
        <GestaoPlaceholder
          titulo="Documentos"
          descricao="Gerencie documentos de veículos e motoristas"
          icone={<FileText className="h-6 w-6 text-primary" />}
        />
      )} />
      <Route path="/gestao/alertas" component={() => (
        <GestaoPlaceholder
          titulo="Alertas"
          descricao="Alertas automáticos de vencimentos, manutenções e documentos"
          icone={<Bell className="h-6 w-6 text-primary" />}
        />
      )} />
      <Route path="/gestao/calendario" component={() => (
        <GestaoPlaceholder
          titulo="Calendário"
          descricao="Visualize viagens, manutenções e eventos no calendário"
          icone={<Calendar className="h-6 w-6 text-primary" />}
        />
      )} />

      {/* Sistema */}
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

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
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
