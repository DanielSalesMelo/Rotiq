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

function Router() {
  return (
    <Switch>
      {/* Raiz */}
      <Route path="/" component={Home} />

      {/* Dashboard */}
      <Route path="/dashboard" component={Dashboard} />

      {/* Frota */}
      <Route path="/veiculos" component={Veiculos} />
      <Route path="/abastecimentos" component={Abastecimentos} />
      <Route path="/manutencoes" component={Manutencoes} />
      <Route path="/checklist" component={Checklist} />
      <Route path="/viagens" component={Viagens} />

      {/* RH */}
      <Route path="/funcionarios" component={Funcionarios} />

      {/* Financeiro */}
      <Route path="/financeiro" component={Financeiro} />
      <Route path="/financeiro/receber" component={Financeiro} />
      <Route path="/financeiro/adiantamentos" component={Adiantamentos} />
      <Route path="/adiantamentos" component={Adiantamentos} />

      {/* Configurações */}
      <Route path="/empresa" component={Empresa} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
