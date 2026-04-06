import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Building2, Users, Truck, Shield, Settings, Plus, Activity,
  Eye, RefreshCw, Copy, CheckCircle, XCircle, Hash, Key
} from "lucide-react";
import { toast } from "sonner";
import { useViewAs } from "@/contexts/ViewAsContext";
import { useEffect } from "react";

export default function PainelMaster() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { enterAdminView } = useViewAs();
  const [, navigate] = useLocation();

  const [abaAtiva, setAbaAtiva] = useState<"visao-geral" | "empresas" | "admins" | "config">("visao-geral");
  const isMaster = !loading && !!user && (user as any).role === "master_admin";

  // ─── Dados do banco de dados real ────────────────────────────────────────────
  const { data: empresas = [], refetch: refetchEmpresas, isLoading: loadingEmpresas } =
    trpc.empresas.list.useQuery(undefined, { enabled: isMaster });

  const { data: allUsers = [], isLoading: loadingUsers } =
    trpc.dashboard.listUsers.useQuery({}, { enabled: isMaster });

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const criarEmpresaMut = trpc.empresas.criar.useMutation({
    onSuccess: (data) => {
      toast.success(data.mensagem || "Empresa criada com sucesso!");
      setModalEmpresa(false);
      setFormEmpresa({ nome: "", cnpj: "", email: "", telefone: "", cidade: "", estado: "", tipoEmpresa: "independente" });
      refetchEmpresas();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleAtivoMut = trpc.empresas.toggleAtivo.useMutation({
    onSuccess: (data) => {
      toast.success(data.mensagem);
      refetchEmpresas();
    },
    onError: (e) => toast.error(e.message),
  });

  const regenerarConviteMut = trpc.empresas.regenerarConvite.useMutation({
    onSuccess: (data) => {
      toast.success(`Novo código de convite: ${data.codigoConvite}`);
      refetchEmpresas();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRoleMut = trpc.dashboard.updateUserRole.useMutation({
    onSuccess: () => { toast.success("Permissão atualizada!"); },
    onError: (e) => toast.error(e.message),
  });

  // ─── Estado do formulário ─────────────────────────────────────────────────────
  const [modalEmpresa, setModalEmpresa] = useState(false);
  const [formEmpresa, setFormEmpresa] = useState({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    tipoEmpresa: "independente" as "independente" | "matriz" | "filial",
  });

  // ─── Guard: somente master_admin ──────────────────────────────────────────────
  useEffect(() => {
    if (!loading && user && (user as any).role !== "master_admin") {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) return null;
  if (!user || (user as any).role !== "master_admin") return null;

  // ─── Funções auxiliares ───────────────────────────────────────────────────────
  const copiarTexto = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      toast.success(`${label} copiado!`);
    });
  };

  const salvarEmpresa = () => {
    if (!formEmpresa.nome.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    criarEmpresaMut.mutate({
      nome: formEmpresa.nome.trim(),
      cnpj: formEmpresa.cnpj || undefined,
      email: formEmpresa.email || undefined,
      telefone: formEmpresa.telefone || undefined,
      cidade: formEmpresa.cidade || undefined,
      estado: formEmpresa.estado || undefined,
      tipoEmpresa: formEmpresa.tipoEmpresa,
    });
  };

  // ─── Estatísticas ─────────────────────────────────────────────────────────────
  const empresasAtivas = empresas.filter((e: any) => e.ativo).length;
  const totalUsuarios = allUsers.length;

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            Painel Master
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestão centralizada do sistema — acesso restrito ao Master Administrador
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border border-amber-300 gap-1">
          <Shield className="w-3 h-3" /> Master Admin
        </Badge>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b pb-2 flex-wrap">
        {([
          { key: "visao-geral", label: "Visão Geral", icon: <Activity className="w-4 h-4" /> },
          { key: "empresas", label: "Empresas", icon: <Building2 className="w-4 h-4" /> },
          { key: "admins", label: "Administradores", icon: <Shield className="w-4 h-4" /> },
          { key: "config", label: "Configurações", icon: <Settings className="w-4 h-4" /> },
        ] as const).map(aba => (
          <Button
            key={aba.key}
            variant={abaAtiva === aba.key ? "default" : "ghost"}
            size="sm"
            className="gap-1.5"
            onClick={() => setAbaAtiva(aba.key)}
          >
            {aba.icon} {aba.label}
          </Button>
        ))}
      </div>

      {/* ─── VISÃO GERAL ──────────────────────────────────────────────────────── */}
      {abaAtiva === "visao-geral" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-blue-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Empresas Ativas</p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">{empresasAtivas}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{empresas.length} total</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Usuários</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">{totalUsuarios}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">cadastrados</p>
                  </div>
                  <Users className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Pendentes</p>
                    <p className="text-2xl font-bold mt-1 text-purple-600">
                      {allUsers.filter((u: any) => u.status === "pending").length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">aguardando aprovação</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Admins</p>
                    <p className="text-2xl font-bold mt-1 text-amber-600">
                      {allUsers.filter((u: any) => u.role === "admin" || u.role === "master_admin").length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">administradores</p>
                  </div>
                  <Crown className="w-8 h-8 text-amber-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista rápida de empresas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Empresas Cadastradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEmpresas ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : empresas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {empresas.slice(0, 5).map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between p-2 rounded border text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{e.nome}</span>
                        <Badge variant="outline" className="text-xs">ID: {e.id}</Badge>
                      </div>
                      <Badge className={e.ativo ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>
                        {e.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  ))}
                  {empresas.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{empresas.length - 5} outras empresas. Veja em "Empresas".
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── EMPRESAS ─────────────────────────────────────────────────────────── */}
      {abaAtiva === "empresas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Gerencie todas as empresas do sistema. Cada empresa possui um <strong>ID único</strong> e um <strong>código de convite</strong> para cadastro de usuários.
            </p>
            <Dialog open={modalEmpresa} onOpenChange={setModalEmpresa}>
              <DialogTrigger asChild>
                <Button className="gap-2 shrink-0">
                  <Plus className="w-4 h-4" /> Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> Cadastrar Nova Empresa
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm text-blue-700">
                    <strong>Atenção:</strong> Um código de convite aleatório será gerado automaticamente para esta empresa.
                    Compartilhe-o com os usuários que precisam se cadastrar.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                      <Label>Nome da Empresa *</Label>
                      <Input
                        placeholder="Razão social ou nome fantasia"
                        value={formEmpresa.nome}
                        onChange={e => setFormEmpresa(f => ({ ...f, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CNPJ</Label>
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={formEmpresa.cnpj}
                        onChange={e => setFormEmpresa(f => ({ ...f, cnpj: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select
                        value={formEmpresa.tipoEmpresa}
                        onValueChange={(v: any) => setFormEmpresa(f => ({ ...f, tipoEmpresa: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="independente">Independente</SelectItem>
                          <SelectItem value="matriz">Matriz</SelectItem>
                          <SelectItem value="filial">Filial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        placeholder="contato@empresa.com"
                        value={formEmpresa.email}
                        onChange={e => setFormEmpresa(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Telefone</Label>
                      <Input
                        placeholder="(00) 00000-0000"
                        value={formEmpresa.telefone}
                        onChange={e => setFormEmpresa(f => ({ ...f, telefone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Cidade</Label>
                      <Input
                        placeholder="São Paulo"
                        value={formEmpresa.cidade}
                        onChange={e => setFormEmpresa(f => ({ ...f, cidade: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Estado (UF)</Label>
                      <Input
                        placeholder="SP"
                        maxLength={2}
                        value={formEmpresa.estado}
                        onChange={e => setFormEmpresa(f => ({ ...f, estado: e.target.value.toUpperCase() }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setModalEmpresa(false)}>Cancelar</Button>
                    <Button onClick={salvarEmpresa} disabled={criarEmpresaMut.isPending}>
                      {criarEmpresaMut.isPending ? "Cadastrando..." : "Cadastrar Empresa"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingEmpresas ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Carregando empresas...
              </CardContent>
            </Card>
          ) : empresas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Nenhuma empresa cadastrada</p>
                <p className="text-sm mt-1">Clique em "Nova Empresa" para começar.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {empresas.map((e: any) => (
                <Card key={e.id} className={`border ${e.ativo ? "border-border" : "border-red-200 bg-red-50/30"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{e.nome}</h3>
                          <Badge className={e.ativo ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>
                            {e.ativo ? <><CheckCircle className="w-3 h-3 mr-1" />Ativa</> : <><XCircle className="w-3 h-3 mr-1" />Inativa</>}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {e.tipoEmpresa === "matriz" ? "Matriz" : e.tipoEmpresa === "filial" ? "Filial" : "Independente"}
                          </Badge>
                        </div>

                        {/* Dados secundários */}
                        <div className="mt-2 space-y-1.5">
                          {e.cnpj && (
                            <p className="text-xs text-muted-foreground">CNPJ: {e.cnpj}</p>
                          )}
                          {(e.cidade || e.estado) && (
                            <p className="text-xs text-muted-foreground">
                              {[e.cidade, e.estado].filter(Boolean).join(" - ")}
                            </p>
                          )}
                        </div>

                        {/* IDs de segurança */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* ID da Empresa */}
                          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                            <Hash className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">ID da Empresa</p>
                              <p className="font-mono text-sm font-bold text-slate-700">{e.id}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 shrink-0"
                              onClick={() => copiarTexto(String(e.id), "ID da empresa")}
                              title="Copiar ID"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* Código de Convite */}
                          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <Key className="w-4 h-4 text-amber-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-amber-700">Código de Convite</p>
                              <p className="font-mono text-sm font-bold text-amber-800 tracking-widest">
                                {e.codigoConvite || "—"}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {e.codigoConvite && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => copiarTexto(e.codigoConvite, "Código de convite")}
                                  title="Copiar código"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-amber-600"
                                onClick={() => {
                                  if (confirm(`Regenerar código de convite da empresa "${e.nome}"? O código atual ficará inválido.`)) {
                                    regenerarConviteMut.mutate({ id: e.id });
                                  }
                                }}
                                title="Regenerar código"
                                disabled={regenerarConviteMut.isPending}
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 gap-1.5 whitespace-nowrap"
                          onClick={() => {
                            enterAdminView(e.id, e.nome);
                            navigate("/dashboard");
                            toast.success(`Visualizando como Admin da ${e.nome}`);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver como Admin
                        </Button>
                        <Button
                          size="sm"
                          variant={e.ativo ? "ghost" : "outline"}
                          className={`text-xs h-8 whitespace-nowrap ${e.ativo ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
                          onClick={() => {
                            if (confirm(`${e.ativo ? "Desativar" : "Ativar"} a empresa "${e.nome}"?`)) {
                              toggleAtivoMut.mutate({ id: e.id });
                            }
                          }}
                          disabled={toggleAtivoMut.isPending}
                        >
                          {e.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ADMINISTRADORES ──────────────────────────────────────────────────── */}
      {abaAtiva === "admins" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" /> Gestão de Administradores
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Promova ou remova permissões de administrador para outros usuários do sistema.
              </p>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Carregando usuários...</p>
              ) : allUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {allUsers.map((u: any) => {
                    const empresaDoUsuario = empresas.find((e: any) => e.id === u.empresaId);
                    return (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                            {(u.name || u.email || "?").substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{u.name || u.email}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            {empresaDoUsuario && (
                              <p className="text-xs text-blue-600 mt-0.5">
                                <Building2 className="w-3 h-3 inline mr-0.5" />
                                {empresaDoUsuario.nome}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              u.role === "master_admin"
                                ? "bg-red-100 text-red-700 border border-red-300"
                                : u.role === "admin"
                                ? "bg-orange-100 text-orange-700 border border-orange-300"
                                : u.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                            }
                          >
                            {u.role === "master_admin"
                              ? "Master Admin"
                              : u.role === "admin"
                              ? "Admin"
                              : u.role === "monitor"
                              ? "Monitor"
                              : u.role === "dispatcher"
                              ? "Despachante"
                              : "Usuário"}
                          </Badge>
                          {u.status === "pending" && (
                            <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs">
                              Pendente
                            </Badge>
                          )}
                          {u.id !== (user as any)?.id && u.role !== "master_admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Promover ${u.name || u.email} a Administrador Master?`)) {
                                  updateRoleMut.mutate({ userId: u.id, role: "master_admin" });
                                }
                              }}
                              disabled={updateRoleMut.isPending}
                            >
                              <Crown className="w-3 h-3 mr-1" /> Promover a Master
                            </Button>
                          )}
                          {u.id !== (user as any)?.id && u.role === "master_admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => {
                                if (confirm(`Remover permissão Master Admin de ${u.name || u.email}?`)) {
                                  updateRoleMut.mutate({ userId: u.id, role: "admin" });
                                }
                              }}
                              disabled={updateRoleMut.isPending}
                            >
                              Remover Master
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── CONFIGURAÇÕES ────────────────────────────────────────────────────── */}
      {abaAtiva === "config" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Como funciona o Sistema de Convites</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-blue-50/50">
                  <h4 className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-blue-600" /> ID da Empresa
                  </h4>
                  <p>Cada empresa possui um ID numérico único gerado automaticamente. Usuários podem usar este ID para se cadastrar.</p>
                </div>
                <div className="p-4 rounded-lg border bg-amber-50/50">
                  <h4 className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-600" /> Código de Convite
                  </h4>
                  <p>Um código alfanumérico aleatório de 8 caracteres. Mais seguro que o ID pois pode ser regenerado a qualquer momento.</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium text-foreground mb-1">Cadastro de Usuários</h4>
                  <p>Para se cadastrar, o usuário deve informar o ID da empresa ou o código de convite. Após o cadastro, aguarda aprovação do admin.</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium text-foreground mb-1">Segurança</h4>
                  <p>IDs não são sequenciais para dificultar enumeração. Códigos de convite podem ser regenerados se comprometidos.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Configurações do Sistema</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-1">Backup Automático</h4>
                  <p className="text-sm text-muted-foreground">O backup é realizado automaticamente pela plataforma.</p>
                  <Badge className="mt-2 bg-green-100 text-green-700 border border-green-300">Ativo</Badge>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-1">Notificações por E-mail</h4>
                  <p className="text-sm text-muted-foreground">Alertas de vencimento e manutenções enviados por e-mail.</p>
                  <Badge className="mt-2 bg-yellow-100 text-yellow-700 border border-yellow-300">Configurar</Badge>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-1">Integração WhatsApp</h4>
                  <p className="text-sm text-muted-foreground">Envio de alertas e notificações via WhatsApp.</p>
                  <Badge className="mt-2 bg-gray-100 text-gray-700 border border-gray-300">Em breve</Badge>
                </div>
                <div className="p-4 rounded-lg border">
                  <h4 className="font-medium mb-1">API Externa</h4>
                  <p className="text-sm text-muted-foreground">Integração com sistemas de rastreamento e ERP.</p>
                  <Badge className="mt-2 bg-gray-100 text-gray-700 border border-gray-300">Em breve</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
