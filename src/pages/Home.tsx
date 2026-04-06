import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Truck, BarChart3, Users, Fuel, Wrench, Shield, ArrowRight,
  MapPin, FileText, Package, DollarSign, Bell, CheckSquare,
  Zap, Globe, ChevronRight, Star, TrendingUp, Clock, Lock,
} from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { loading } = useAuth();
  const [, setLocation] = useLocation();
  const { i18n } = useTranslation();
  const lang = i18n.language || "pt";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const modules = [
    { icon: Truck,       label: lang === "pt" ? "Viagens"        : "Trips",        color: "text-blue-400",   bg: "bg-blue-500/10" },
    { icon: Package,     label: lang === "pt" ? "Carregamento"   : "Loading",      color: "text-purple-400", bg: "bg-purple-500/10" },
    { icon: FileText,    label: lang === "pt" ? "Notas Fiscais"  : "Invoices",     color: "text-green-400",  bg: "bg-green-500/10" },
    { icon: DollarSign,  label: lang === "pt" ? "Acerto de Carga": "Settlement",   color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { icon: Fuel,        label: lang === "pt" ? "Abastecimentos" : "Fuel",         color: "text-orange-400", bg: "bg-orange-500/10" },
    { icon: Wrench,      label: lang === "pt" ? "Manutenções"    : "Maintenance",  color: "text-red-400",    bg: "bg-red-500/10" },
    { icon: Users,       label: lang === "pt" ? "Motoristas"     : "Drivers",      color: "text-cyan-400",   bg: "bg-cyan-500/10" },
    { icon: CheckSquare, label: lang === "pt" ? "Checklist"      : "Checklist",    color: "text-teal-400",   bg: "bg-teal-500/10" },
    { icon: BarChart3,   label: lang === "pt" ? "Financeiro"     : "Financial",    color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: MapPin,      label: lang === "pt" ? "Despachante"    : "Dispatcher",   color: "text-pink-400",   bg: "bg-pink-500/10" },
    { icon: Bell,        label: lang === "pt" ? "Alertas"        : "Alerts",       color: "text-amber-400",  bg: "bg-amber-500/10" },
    { icon: Zap,         label: lang === "pt" ? "Integrações"    : "Integrations", color: "text-lime-400",   bg: "bg-lime-500/10" },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: lang === "pt" ? "Visibilidade Total" : "Full Visibility",
      desc: lang === "pt"
        ? "Dashboard em tempo real com KPIs de frota, financeiro e operacional em uma única tela."
        : "Real-time dashboard with fleet, financial and operational KPIs on a single screen.",
    },
    {
      icon: Clock,
      title: lang === "pt" ? "Economia de Tempo" : "Time Savings",
      desc: lang === "pt"
        ? "Automatize romaneios, acertos de carga e notas fiscais. Elimine planilhas e retrabalho."
        : "Automate loading lists, cargo settlements and invoices. Eliminate spreadsheets and rework.",
    },
    {
      icon: Lock,
      title: lang === "pt" ? "Controle por Empresa" : "Multi-Company Control",
      desc: lang === "pt"
        ? "Gerencie matriz e filiais com hierarquia de permissões. Cada empresa com seus dados isolados."
        : "Manage headquarters and branches with permission hierarchy. Each company with isolated data.",
    },
    {
      icon: Globe,
      title: lang === "pt" ? "Integrações Nativas" : "Native Integrations",
      desc: lang === "pt"
        ? "Conecte-se ao Arquivei para busca de NF-e e ao Winthor com 65 rotinas disponíveis."
        : "Connect to Arquivei for NF-e search and Winthor with 65 available routines.",
    },
  ];

  const stats = [
    { value: "12+",  label: lang === "pt" ? "Módulos Integrados" : "Integrated Modules" },
    { value: "65",   label: lang === "pt" ? "Rotinas Winthor"    : "Winthor Routines" },
    { value: "5",    label: lang === "pt" ? "Idiomas Suportados" : "Supported Languages" },
    { value: "100%", label: lang === "pt" ? "Web & Mobile"       : "Web & Mobile" },
  ];

  const languages = [
    { code: "pt", label: "🇧🇷", title: "Português" },
    { code: "en", label: "🇺🇸", title: "English" },
    { code: "es", label: "🇪🇸", title: "Español" },
    { code: "fr", label: "🇫🇷", title: "Français" },
    { code: "zh", label: "🇹🇼", title: "繁體中文" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm bg-black/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Rotiq</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => i18n.changeLanguage(l.code)}
                  title={l.title}
                  className={`px-2 py-1 rounded text-sm transition-all ${
                    i18n.language === l.code
                      ? "bg-blue-600 text-white font-bold scale-105"
                      : "hover:bg-white/10 text-white/70"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setLocation("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-600/30"
            >
              {lang === "pt" ? "Entrar" : lang === "en" ? "Login" : lang === "es" ? "Entrar" : lang === "fr" ? "Connexion" : "登入"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-2 rounded-full">
            <Star className="h-3.5 w-3.5" />
            {lang === "pt" ? "Sistema de Gestão de Frota e Logística" : lang === "en" ? "Fleet & Logistics Management System" : lang === "es" ? "Sistema de Gestión de Flota y Logística" : lang === "fr" ? "Système de Gestion de Flotte et Logistique" : "車隊與物流管理系統"}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            {lang === "pt" ? "Gerencie sua frota" : lang === "en" ? "Manage your fleet" : lang === "es" ? "Administre su flota" : lang === "fr" ? "Gérez votre flotte" : "智能管理"}
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {lang === "pt" ? "com inteligência" : lang === "en" ? "with intelligence" : lang === "es" ? "con inteligencia" : lang === "fr" ? "avec intelligence" : "您的車隊"}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            {lang === "pt"
              ? "Controle veículos, motoristas, abastecimentos, manutenções, finanças e integrações em um único sistema. Substitua planilhas por dados em tempo real."
              : lang === "en"
              ? "Control vehicles, drivers, fuel, maintenance, finances and integrations in one system. Replace spreadsheets with real-time data."
              : lang === "es"
              ? "Controle vehículos, conductores, combustible, mantenimiento, finanzas e integraciones en un solo sistema."
              : lang === "fr"
              ? "Contrôlez les véhicules, conducteurs, carburant, maintenance, finances et intégrations dans un seul système."
              : "在一個系統中控制車輛、駕駛員、燃料、維護、財務和整合。"}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => setLocation("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0 text-base px-8 py-6 shadow-xl shadow-blue-600/30 rounded-xl"
            >
              {lang === "pt" ? "Acessar o sistema" : lang === "en" ? "Access the system" : lang === "es" ? "Acceder al sistema" : lang === "fr" ? "Accéder au système" : "訪問系統"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <button
              onClick={() => setLocation("/login")}
              className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
            >
              {lang === "pt" ? "Ver demonstração" : lang === "en" ? "View demo" : lang === "es" ? "Ver demostración" : lang === "fr" ? "Voir la démo" : "查看演示"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-10 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-sm text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {lang === "pt" ? "Tudo que sua operação precisa" : lang === "en" ? "Everything your operation needs" : lang === "es" ? "Todo lo que su operación necesita" : lang === "fr" ? "Tout ce dont votre opération a besoin" : "您的運營所需的一切"}
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              {lang === "pt"
                ? "12 módulos integrados cobrindo toda a cadeia logística — do despacho ao financeiro."
                : "12 integrated modules covering the entire logistics chain — from dispatch to finance."}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {modules.map((m) => (
              <div
                key={m.label}
                className="group p-4 rounded-2xl border border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10 transition-all cursor-default"
              >
                <div className={`h-10 w-10 rounded-xl ${m.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <p className="font-semibold text-sm text-white/90">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative z-10 py-20 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {lang === "pt" ? "Por que escolher o Rotiq?" : lang === "en" ? "Why choose Rotiq?" : lang === "es" ? "¿Por qué elegir Rotiq?" : lang === "fr" ? "Pourquoi choisir Rotiq?" : "為什麼選擇 Rotiq？"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex gap-5 p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/3 to-transparent hover:border-blue-500/20 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <b.icon className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Zap className="h-3.5 w-3.5" />
            {lang === "pt" ? "Integrações Nativas" : "Native Integrations"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {lang === "pt" ? "Conectado ao seu ecossistema" : "Connected to your ecosystem"}
          </h2>
          <p className="text-white/50 mb-10 max-w-xl mx-auto">
            {lang === "pt"
              ? "Integração nativa com Arquivei para consulta e download de NF-e, e Winthor com 65 rotinas disponíveis para sincronização de dados."
              : "Native integration with Arquivei for NF-e query and download, and Winthor with 65 routines available for data synchronization."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {[
              { name: "Arquivei",    desc: lang === "pt" ? "Consulta e download de NF-e" : "NF-e query and download", color: "from-green-500/20 to-green-600/10 border-green-500/20" },
              { name: "Winthor",     desc: lang === "pt" ? "65 rotinas de sincronização" : "65 sync routines",        color: "from-blue-500/20 to-blue-600/10 border-blue-500/20" },
              { name: "PDF / Excel", desc: lang === "pt" ? "Exportação de relatórios"    : "Report export",           color: "from-orange-500/20 to-orange-600/10 border-orange-500/20" },
            ].map((int) => (
              <div key={int.name} className={`flex-1 max-w-xs p-5 rounded-2xl border bg-gradient-to-br ${int.color}`}>
                <p className="font-bold text-lg mb-1">{int.name}</p>
                <p className="text-white/50 text-sm">{int.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-purple-600/5">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              {lang === "pt" ? "Pronto para modernizar sua frota?" : lang === "en" ? "Ready to modernize your fleet?" : lang === "es" ? "¿Listo para modernizar su flota?" : lang === "fr" ? "Prêt à moderniser votre flotte?" : "準備好現代化您的車隊了嗎？"}
            </h2>
            <p className="text-white/50 mb-8 text-lg">
              {lang === "pt"
                ? "Acesse agora e tenha controle total da sua operação logística."
                : "Access now and have full control of your logistics operation."}
            </p>
            <Button
              size="lg"
              onClick={() => setLocation("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0 text-base px-10 py-6 shadow-xl shadow-blue-600/30 rounded-xl"
            >
              {lang === "pt" ? "Acessar o Rotiq" : lang === "en" ? "Access Rotiq" : lang === "es" ? "Acceder a Rotiq" : lang === "fr" ? "Accéder à Rotiq" : "訪問 Rotiq"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white/80">Rotiq</span>
          </div>
          <p className="text-white/30 text-sm">
            © 2025 Rotiq —{" "}
            {lang === "pt" ? "Sistema de Gestão de Frota e Logística" : lang === "en" ? "Fleet & Logistics Management System" : lang === "es" ? "Sistema de Gestión de Flota y Logística" : lang === "fr" ? "Système de Gestion de Flotte et Logistique" : "車隊與物流管理系統"}
          </p>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => i18n.changeLanguage(l.code)}
                title={l.title}
                className={`px-2 py-1 rounded text-sm transition-all ${
                  i18n.language === l.code ? "bg-blue-600 text-white font-bold" : "hover:bg-white/10 text-white/50"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
