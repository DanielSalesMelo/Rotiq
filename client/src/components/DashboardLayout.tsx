import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard, Truck, Users, Fuel, Wrench, DollarSign,
  ClipboardCheck, MapPin, LogOut, Menu, TrendingUp, TrendingDown,
  Wallet, BarChart3, Sun, Moon, Monitor, UserCog, Send, RotateCcw,
  Navigation, AlertTriangle, FileText, Bell, Calendar, Gauge,
  ClipboardList, BookOpen, Shield, Settings, Star, ChevronLeft,
  ChevronRight, Calculator,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuGroups = [
  {
    label: "Principal",
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" }],
  },
  {
    label: "Despachante",
    items: [
      { icon: MapPin, label: "Saída de Entrega", path: "/despachante/entrega" },
      { icon: Send, label: "Saída de Viagem", path: "/despachante/viagem" },
      { icon: RotateCcw, label: "Retorno de Veículo", path: "/despachante/retorno" },
    ],
  },
  {
    label: "Operacional",
    items: [
      { icon: Navigation, label: "Viagens", path: "/viagens" },
      { icon: Fuel, label: "Abastecimentos", path: "/abastecimentos" },
      { icon: Calculator, label: "Simulador de Viagem", path: "/simulador-viagem" },
    ],
  },
  {
    label: "Frota",
    items: [
      { icon: Truck, label: "Veículos", path: "/veiculos" },
      { icon: Users, label: "Motoristas", path: "/funcionarios" },
      { icon: Wrench, label: "Manutenção", path: "/manutencoes" },
      { icon: ClipboardList, label: "Plano Manutenção", path: "/plano-manutencao" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { icon: Gauge, label: "Estoque Combustível", path: "/gestao/estoque-combustivel" },
      { icon: AlertTriangle, label: "Multas", path: "/gestao/multas" },
      { icon: Shield, label: "Acidentes", path: "/gestao/acidentes" },
      { icon: DollarSign, label: "Acertos", path: "/gestao/acertos" },
      { icon: ClipboardCheck, label: "Checklist", path: "/checklist" },
      { icon: BookOpen, label: "Relatos", path: "/gestao/relatos" },
      { icon: FileText, label: "Documentos", path: "/gestao/documentos" },
      { icon: Bell, label: "Alertas", path: "/gestao/alertas" },
      { icon: Calendar, label: "Calendário", path: "/gestao/calendario" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
      { icon: UserCog, label: "Usuários", path: "/usuarios" },
      { icon: Settings, label: "Configurações", path: "/empresa" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { icon: TrendingDown, label: "Contas a Pagar", path: "/financeiro" },
      { icon: TrendingUp, label: "Contas a Receber", path: "/financeiro/receber" },
      { icon: Wallet, label: "Adiantamentos", path: "/financeiro/adiantamentos" },
      { icon: BarChart3, label: "Custos Operacionais", path: "/custos" },
    ],
  },
  {
    label: "Master",
    items: [{ icon: Star, label: "Permissões", path: "/usuarios" }],
  },
];

// Sidebar as a stable component — never re-mounts on navigation, preserves scroll
function Sidebar({
  collapsed,
  setCollapsed,
  location,
  navigate,
  user,
  logout,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  location: string;
  navigate: (path: string) => void;
  user: any;
  logout: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const navRef = useRef<HTMLElement>(null);

  const isActive = (path: string) =>
    location === path || (path !== "/" && location.startsWith(path + "/"));

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const roleLabel =
    user?.role === "master_admin" ? "Master ADM" :
    user?.role === "admin" ? "Administrador" :
    user?.role === "dispatcher" ? "Despachante" :
    user?.role === "monitor" ? "Monitor" : "Usuário";

  const handleNav = (path: string) => {
    const scrollTop = navRef.current?.scrollTop ?? 0;
    navigate(path);
    requestAnimationFrame(() => {
      if (navRef.current) navRef.current.scrollTop = scrollTop;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Truck className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground tracking-tight">Rotiq</span>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto p-1 rounded hover:bg-accent transition-colors"
            title="Recolher menu"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Menu items */}
      <nav ref={navRef} className="flex-1 overflow-y-auto py-2">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-4 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </span>
              </div>
            )}
            {collapsed && <div className="h-2" />}
            {group.items.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border shrink-0 p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {[
              { key: "light" as const, icon: Sun, label: "Claro" },
              { key: "gray" as const, icon: Monitor, label: "Cinza" },
              { key: "dark" as const, icon: Moon, label: "Escuro" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors ${
                  theme === t.key
                    ? "bg-background text-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-3 w-3" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-2 w-full rounded-lg p-2 hover:bg-accent transition-colors ${collapsed ? "justify-center" : ""}`}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium text-foreground truncate">{user?.name ?? "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {user?.email ?? user?.name}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Rotiq</span>
          </div>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">
            Entrar
          </Button>
        </div>
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (path: string) => {
    setLocation(path);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — stable component, never re-mounts */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 shrink-0 relative ${
          collapsed ? "w-14" : "w-60"
        }`}
      >
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute left-10 top-4 z-50 p-1 rounded-full bg-primary text-primary-foreground shadow-md"
            title="Expandir menu"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          location={location}
          navigate={navigate}
          user={user}
          logout={logout}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col border-r border-border bg-card transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          collapsed={false}
          setCollapsed={() => {}}
          location={location}
          navigate={navigate}
          user={user}
          logout={logout}
        />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
