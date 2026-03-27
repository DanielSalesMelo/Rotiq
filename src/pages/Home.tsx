import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Truck, BarChart3, Users, Fuel, Wrench, Shield, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

function getFeatures(lang: string) {
  const features = {
    pt: [
      { icon: Truck, title: "Frota Completa", desc: "Veículos, cavalos, carretas e checklist" },
      { icon: Fuel, title: "Abastecimentos", desc: "Diesel, ARLA e controle de tanque" },
      { icon: Wrench, title: "Manutenções", desc: "Preventiva, corretiva e histórico" },
      { icon: Users, title: "RH Integrado", desc: "Motoristas, ajudantes e freelancers" },
      { icon: BarChart3, title: "Financeiro", desc: "Contas, adiantamentos e CTEs" },
      { icon: Shield, title: "Auditoria", desc: "Soft delete e log de todas as ações" },
    ],
    en: [
      { icon: Truck, title: "Complete Fleet", desc: "Vehicles, horses, trailers and checklist" },
      { icon: Fuel, title: "Fuel Management", desc: "Diesel, ARLA and tank control" },
      { icon: Wrench, title: "Maintenance", desc: "Preventive, corrective and history" },
      { icon: Users, title: "Integrated HR", desc: "Drivers, helpers and freelancers" },
      { icon: BarChart3, title: "Financial", desc: "Accounts, advances and CTEs" },
      { icon: Shield, title: "Audit", desc: "Soft delete and log of all actions" },
    ],
    es: [
      { icon: Truck, title: "Flota Completa", desc: "Vehículos, caballos, remolques y lista de verificación" },
      { icon: Fuel, title: "Abastecimiento", desc: "Diésel, ARLA y control de tanque" },
      { icon: Wrench, title: "Mantenimiento", desc: "Preventivo, correctivo e historial" },
      { icon: Users, title: "RRHH Integrado", desc: "Conductores, ayudantes y autónomos" },
      { icon: BarChart3, title: "Financiero", desc: "Cuentas, anticipos y CTEs" },
      { icon: Shield, title: "Auditoría", desc: "Eliminación suave y registro de todas las acciones" },
    ],
    fr: [
      { icon: Truck, title: "Flotte Complète", desc: "Véhicules, chevaux, remorques et checklist" },
      { icon: Fuel, title: "Carburant", desc: "Diesel, ARLA et contrôle de réservoir" },
      { icon: Wrench, title: "Maintenance", desc: "Préventive, corrective et historique" },
      { icon: Users, title: "RH Intégré", desc: "Conducteurs, aides et pigistes" },
      { icon: BarChart3, title: "Financier", desc: "Comptes, avances et CTEs" },
      { icon: Shield, title: "Audit", desc: "Suppression logicielle et journal de toutes les actions" },
    ],
    zh: [
      { icon: Truck, title: "完整車隊", desc: "車輛、馬匹、拖車和檢查清單" },
      { icon: Fuel, title: "燃料管理", desc: "柴油、ARLA 和油箱控制" },
      { icon: Wrench, title: "維護", desc: "預防性、糾正性和歷史" },
      { icon: Users, title: "集成人力資源", desc: "駕駛員、助手和自由職業者" },
      { icon: BarChart3, title: "財務", desc: "帳戶、預付款和 CTE" },
      { icon: Shield, title: "審計", desc: "軟刪除和所有操作的日誌" },
    ],
  };
  return features[lang as keyof typeof features] || features.pt;
}

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();

  // Removido o redirecionamento automático para permitir ver a Landing Page mesmo logado
  // useEffect(() => {
  //   if (!loading && user) {
  //     setLocation("/dashboard");
  //   }
  // }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

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
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {[
              { code: 'pt', label: '🇧🇷', title: 'Português' },
              { code: 'en', label: '🇺🇸', title: 'English' },
              { code: 'es', label: '🇪🇸', title: 'Español' },
              { code: 'fr', label: '🇫🇷', title: 'Français' },
              { code: 'zh', label: '🇹🇼', title: '繁體中文' },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                title={lang.title}
                className={`px-2 py-1 rounded text-sm transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'hover:bg-background'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <Button onClick={() => { setLocation("/login"); }}>
            {i18n.language === 'pt' ? 'Entrar' : i18n.language === 'en' ? 'Login' : i18n.language === 'es' ? 'Iniciar sesión' : i18n.language === 'fr' ? 'Connexion' : '登入'} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
            <Shield className="h-3.5 w-3.5" />
            Sistema de Gestão de Frota e Logística
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {i18n.language === 'pt' ? 'Gerencie sua frota com' : i18n.language === 'en' ? 'Manage your fleet with' : i18n.language === 'es' ? 'Administre su flota con' : i18n.language === 'fr' ? 'Gérez votre flotte avec' : '智能管理您的車隊'} <span className="text-primary">{i18n.language === 'pt' ? 'inteligência' : i18n.language === 'en' ? 'intelligence' : i18n.language === 'es' ? 'inteligencia' : i18n.language === 'fr' ? 'intelligence' : '效率'}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {i18n.language === 'pt' ? 'Controle veículos, motoristas, abastecimentos, manutenções e finanças em um único lugar. Substitua suas planilhas por um sistema moderno e integrado.' : i18n.language === 'en' ? 'Control vehicles, drivers, fuel, maintenance and finances in one place. Replace your spreadsheets with a modern integrated system.' : i18n.language === 'es' ? 'Controle vehículos, conductores, combustible, mantenimiento y finanzas en un solo lugar. Reemplace sus hojas de cálculo con un sistema moderno e integrado.' : i18n.language === 'fr' ? 'Contrôlez les véhicules, les conducteurs, le carburant, la maintenance et les finances en un seul endroit. Remplacez vos feuilles de calcul par un système moderne et intégré.' : '在一個地方控制車輛、駕駛員、燃料、維護和財務。用現代集成系統替換您的電子表格。'}
          </p>
          <Button size="lg" onClick={() => { setLocation("/login"); }} className="text-base px-8">
            {i18n.language === 'pt' ? 'Acessar o sistema' : i18n.language === 'en' ? 'Access the system' : i18n.language === 'es' ? 'Acceder al sistema' : i18n.language === 'fr' ? 'Accéder au système' : '訪問系統'} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-16 max-w-3xl w-full">
          {getFeatures(i18n.language).map(f => (
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
        © 2025 Rotiq — {i18n.language === 'pt' ? 'Sistema de Gestão de Frota' : i18n.language === 'en' ? 'Fleet Management System' : i18n.language === 'es' ? 'Sistema de Gestión de Flotas' : i18n.language === 'fr' ? 'Système de Gestion de Flotte' : '車隊管理系統'}
      </footer>
    </div>
  );
}
