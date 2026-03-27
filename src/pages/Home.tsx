import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

import { Truck, BarChart3, Users, Fuel, Wrench, Shield, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Rotiq</span>
        </div>
        <Button onClick={() => { setLocation("/login"); }}>
          Entrar <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
            <Shield className="h-3.5 w-3.5" />
            Sistema de Gestão de Frota e Logística
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Gerencie sua frota com <span className="text-primary">inteligência</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Controle veículos, motoristas, abastecimentos, manutenções e finanças em um único lugar. 
            Substitua suas planilhas por um sistema moderno e integrado.
          </p>
          <Button size="lg" onClick={() => { setLocation("/login"); }} className="text-base px-8">
            Acessar o sistema <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
          {[
            { icon: Truck, title: "Frota Completa", desc: "Veículos, cavalos, carretas e checklist" },
            { icon: Fuel, title: "Abastecimentos", desc: "Diesel, ARLA e controle de tanque" },
            { icon: Wrench, title: "Manutenções", desc: "Preventiva, corretiva e histórico" },
            { icon: Users, title: "RH Integrado", desc: "Motoristas, ajudantes e freelancers" },
            { icon: BarChart3, title: "Financeiro", desc: "Contas, adiantamentos e CTEs" },
            { icon: Shield, title: "Auditoria", desc: "Soft delete e log de todas as ações" },
          ].map(f => (
            <div key={f.title} className="p-4 rounded-xl border bg-card text-left space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        © 2025 Rotiq — Sistema de Gestão de Frota
      </footer>
    </div>
  );
}
