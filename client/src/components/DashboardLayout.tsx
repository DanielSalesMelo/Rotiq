import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  Truck,
  Users,
  Fuel,
  Wrench,
  DollarSign,
  ClipboardCheck,
  MapPin,
  LogOut,
  PanelLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Sun,
  Moon,
  Monitor,
  UserCog,
  Send,
  RotateCcw,
  Navigation,
  AlertTriangle,
  FileText,
  Bell,
  Calendar,
  Gauge,
  ClipboardList,
  BookOpen,
  Shield,
  Settings,
  Star,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ],
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
    items: [
      { icon: Star, label: "Permissões", path: "/usuarios" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Rotiq</span>
            </div>
            <h1 className="text-xl font-semibold text-center text-foreground">
              Acesse sua conta para continuar
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Sistema de Gestão de Frota e Logística
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  const activeItem = menuGroups.flatMap(g => g.items).find(item => {
    if (item.path === "/") return location === "/";
    return location === item.path || location.startsWith(item.path + "/");
  });

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <>
      <Sidebar collapsible="icon">
        {/* Header */}
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex h-14 items-center px-3 gap-3">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors shrink-0"
            >
              <PanelLeft className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
            {!isCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-sidebar-foreground tracking-tight truncate">
                  Rotiq
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Menu */}
        <SidebarContent>
          {menuGroups.map(group => (
            <SidebarGroup key={group.label}>
              {!isCollapsed && (
                <SidebarGroupLabel>
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarMenu>
                {group.items.map(item => {
                  const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path + "/"));
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="p-2 space-y-2">
            {/* Seletor de tema */}
            {!isCollapsed && (
              <div className="flex items-center gap-1 rounded-lg bg-sidebar-accent/50 p-1">
                {[
                  { key: "light" as const, icon: Sun, label: "Claro" },
                  { key: "gray" as const, icon: Monitor, label: "Cinza" },
                  { key: "dark" as const, icon: Moon, label: "Escuro" },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTheme(t.key)}
                    title={`Tema ${t.label}`}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors ${
                      theme === t.key
                        ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <t.icon className="h-3 w-3" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* User */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium text-sidebar-foreground truncate">
                        {user?.name ?? "Usuário"}
                      </p>
                      <p className="text-xs text-sidebar-foreground/50 truncate">
                        {user?.role === "master_admin" ? "Master ADM" :
                          user?.role === "admin" ? "Administrador" :
                          user?.role === "dispatcher" ? "Despachante" :
                          user?.role === "monitor" ? "Monitor" : "Usuário"}
                      </p>
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
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
          {isMobile && (
            <SidebarTrigger className="h-8 w-8" />
          )}
          <div className="flex-1 min-w-0">
            {activeItem && (
              <div className="flex items-center gap-2 text-sm">
                <activeItem.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground truncate">{activeItem.label}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
