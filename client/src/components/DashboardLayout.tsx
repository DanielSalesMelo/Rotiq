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
  Building2,
  LogOut,
  PanelLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Calculator,
  Sun,
  Moon,
  Monitor,
  UserCog,
  Send,
} from "lucide-react";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Send, label: "Despachante", path: "/despachante" },
    ],
  },
  {
    label: "Frota",
    items: [
      { icon: Truck, label: "Veículos", path: "/veiculos" },
      { icon: Fuel, label: "Abastecimentos", path: "/abastecimentos" },
      { icon: Wrench, label: "Manutenções", path: "/manutencoes" },
      { icon: ClipboardCheck, label: "Checklist", path: "/checklist" },
      { icon: MapPin, label: "Viagens", path: "/viagens" },
      { icon: BarChart3, label: "Custos Operacionais", path: "/custos" },
    ],
  },
  {
    label: "RH",
    items: [
      { icon: Users, label: "Funcionários", path: "/funcionarios" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { icon: TrendingDown, label: "Contas a Pagar", path: "/financeiro" },
      { icon: TrendingUp, label: "Contas a Receber", path: "/financeiro/receber" },
      { icon: Wallet, label: "Adiantamentos", path: "/financeiro/adiantamentos" },
    ],
  },
  {
    label: "Configurações",
    items: [
      { icon: Building2, label: "Empresa", path: "/empresa" },
      { icon: UserCog, label: "Usuários", path: "/usuarios" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

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
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  const activeItem = menuGroups.flatMap(g => g.items).find(item => {
    if (item.path === "/") return location === "/";
    return location.startsWith(item.path);
  });

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0">
          {/* Header */}
          <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2">
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
          <SidebarContent className="gap-0 py-2">
            {menuGroups.map(group => (
              <SidebarGroup key={group.label} className="py-1">
                {!isCollapsed && (
                  <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider px-4 py-1">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarMenu className="px-2">
                  {group.items.map(item => {
                    const isActive = item.path === "/"
                      ? location === "/"
                      : location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className={`h-9 transition-all font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent ${isActive ? "bg-sidebar-accent text-sidebar-foreground font-medium" : ""}`}
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-sidebar-primary" : ""}`} />
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
          <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
            {/* Seletor de tema */}
            {!isCollapsed && (
              <div className="flex items-center gap-1 rounded-lg bg-sidebar-accent/50 p-1">
                <button
                  onClick={() => setTheme("light")}
                  title="Tema Claro"
                  className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors ${
                    theme === "light"
                      ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Sun className="h-3 w-3" />
                  <span>Claro</span>
                </button>
                <button
                  onClick={() => setTheme("gray")}
                  title="Tema Cinza"
                  className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors ${
                    theme === "gray"
                      ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Monitor className="h-3 w-3" />
                  <span>Cinza</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  title="Tema Escuro"
                  className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors ${
                    theme === "dark"
                      ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Moon className="h-3 w-3" />
                  <span>Escuro</span>
                </button>
              </div>
            )}
            {isCollapsed && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "gray" : "dark")}
                title="Alternar tema"
                className="w-full flex items-center justify-center rounded-lg py-2 hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 border border-sidebar-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-sidebar-accent text-sidebar-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate leading-none">
                        {user?.name || "Usuário"}
                      </p>
                      <p className="text-xs text-sidebar-foreground/50 truncate mt-1">
                        {user?.email || ""}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center gap-3 bg-background/95 px-4 backdrop-blur sticky top-0 z-40">
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                <Truck className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">{activeItem?.label ?? "Menu"}</span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
