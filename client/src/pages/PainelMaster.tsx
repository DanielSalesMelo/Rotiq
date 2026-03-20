import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, Building2, Users, Truck, Shield, Settings, Plus, Search, CheckCircle, XCircle, Activity } from "lucide-react";
import { toast } from "sonner";

const EMPRESA_ID = 1;

export default function PainelMaster() {
  const { user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<"visao-geral" | "empresas" | "logs" | "config">("visao-geral");

  const { data: veiculos = [] } = trpc.veiculos.list.useQuery({ empresaId: EMPRESA_ID });
  const { data: motoristas = [] } = trpc.funcionarios.listMotoristas.useQuery({ empresaId: EMPRESA_ID });
  const { data: viagens = [] } = trpc.viagens.list.useQuery({ empresaId: EMPRESA_ID });
  const { data: manutencoes = [] } = trpc.frota.manutencoes.list.useQuery({ empresaId: EMPRESA_ID });

  // Empresas (localStorage — multi-tenant simulado)
  const [empresas, setEmpresas] = useState<any[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rotiq_empresas_master") || "[]");
      if (saved.length === 0) {
        // Empresa padrão
        const padrao = [{ id: 1, nome: "Empresa Principal", cnpj: "", status: "ativa", plano: "premium", maxVeiculos: 50, maxMotoristas: 30, criadaEm: new Date().toISOString() }];
        localStorage.setItem("rotiq_empresas_master", JSON.stringify(padrao));
        return padrao;
      }
      return saved;
    } catch { return []; }
  });

  // Logs de atividade (localStorage)
  const logs: any[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("rotiq_logs_master") || "[]"); } catch { return []; }
  }, []);

  const [modalEmpresa, setModalEmpresa] = useState(false);
  const [formEmpresa, setFormEmpresa] = useState({ nome: "", cnpj: "", plano: "basico", maxVeiculos: "10", maxMotoristas: "5" });

  const salvarEmpresa = () => {
    if (!formEmpresa.nome) { toast.error("Informe o nome da empresa"); return; }
    const nova = {
      id: Date.now(),
      ...formEmpresa,
      maxVeiculos: Number(formEmpresa.maxVeiculos) || 10,
      maxMotoristas: Number(formEmpresa.maxMotoristas) || 5,
      status: "ativa",
      criadaEm: new Date().toISOString(),
    };
    const novas = [...empresas, nova];
    setEmpresas(novas);
    localStorage.setItem("rotiq_empresas_master", JSON.stringify(novas));
    toast.success("Empresa cadastrada!");
    setModalEmpresa(false);
    setFormEmpresa({ nome: "", cnpj: "", plano: "basico", maxVeiculos: "10", maxMotoristas: "5" });
  };

  const toggleStatusEmpresa = (id: number) => {
    const atualizadas = empresas.map((e: any) => e.id === id ? { ...e, status: e.status === "ativa" ? "inativa" : "ativa" } : e);
    setEmpresas(atualizadas);
    localStorage.setItem("rotiq_empresas_master", JSON.stringify(atualizadas));
    toast.success("Status atualizado!");
  };

  const viagensAtivas = viagens.filter((v: any) => v.status === "em_andamento").length;
  const manutencoesAbertas = manutencoes.filter((m: any) => m.status === "pendente" || m.status === "agendada").length;

  const planoConfig: Record<string, { label: string; color: string }> = {
    basico:   { label: "Básico",   color: "bg-gray-100 text-gray-700 border-gray-300" },
    padrao:   { label: "Padrão",   color: "bg-blue-100 text-blue-700 border-blue-300" },
    premium:  { label: "Premium",  color: "bg-purple-100 text-purple-700 border-purple-300" },
    enterprise: { label: "Enterprise", color: "bg-amber-100 text-amber-700 border-amber-300" },
  };

  return (
<div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" />
            Painel Master
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão centralizada do sistema — acesso restrito</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700 border border-amber-300 gap-1">
          <Shield className="w-3 h-3" /> Administrador
        </Badge>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b pb-2">
        {([
          { key: "visao-geral", label: "Visão Geral", icon: <Activity className="w-4 h-4" /> },
          { key: "empresas", label: "Empresas", icon: <Building2 className="w-4 h-4" /> },
          { key: "logs", label: "Logs de Atividade", icon: <Settings className="w-4 h-4" /> },
          { key: "config", label: "Configurações", icon: <Settings className="w-4 h-4" /> },
        ] as const).map(aba => (
          <Button key={aba.key} variant={abaAtiva === aba.key ? "default" : "ghost"} size="sm" className="gap-1.5"
            onClick={() => setAbaAtiva(aba.key)}>
            {aba.icon} {aba.label}
          </Button>
        ))}
      </div>

      {/* Visão Geral */}
      {abaAtiva === "visao-geral" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-blue-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-muted-foreground uppercase">Empresas Ativas</p><p className="text-2xl font-bold mt-1 text-blue-600">{empresas.filter(e => e.status === "ativa").length}</p></div>
                  <Building2 className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-muted-foreground uppercase">Veículos Cadastrados</p><p className="text-2xl font-bold mt-1 text-green-600">{veiculos.length}</p></div>
                  <Truck className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-muted-foreground uppercase">Motoristas Ativos</p><p className="text-2xl font-bold mt-1 text-purple-600">{motoristas.length}</p></div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-muted-foreground uppercase">Viagens em Andamento</p><p className="text-2xl font-bold mt-1 text-orange-600">{viagensAtivas}</p></div>
                  <Activity className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo rápido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Manutenções Pendentes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-600">{manutencoesAbertas}</p>
                <p className="text-xs text-muted-foreground mt-1">manutenções aguardando execução</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Total de Viagens</CardTitle></CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{viagens.length}</p>
                <p className="text-xs text-muted-foreground mt-1">viagens registradas no sistema</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empresas */}
      {abaAtiva === "empresas" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={modalEmpresa} onOpenChange={setModalEmpresa}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Empresa</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar Empresa</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1 col-span-2">
                    <Label>Nome da Empresa *</Label>
                    <Input placeholder="Razão social" value={formEmpresa.nome} onChange={e => setFormEmpresa(f => ({ ...f, nome: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>CNPJ</Label>
                    <Input placeholder="00.000.000/0000-00" value={formEmpresa.cnpj} onChange={e => setFormEmpresa(f => ({ ...f, cnpj: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Plano</Label>
                    <Select value={formEmpresa.plano} onValueChange={(v) => setFormEmpresa(f => ({ ...f, plano: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="padrao">Padrão</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Máx. Veículos</Label>
                    <Input type="number" value={formEmpresa.maxVeiculos} onChange={e => setFormEmpresa(f => ({ ...f, maxVeiculos: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Máx. Motoristas</Label>
                    <Input type="number" value={formEmpresa.maxMotoristas} onChange={e => setFormEmpresa(f => ({ ...f, maxMotoristas: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setModalEmpresa(false)}>Cancelar</Button>
                  <Button onClick={salvarEmpresa}>Cadastrar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground text-xs uppercase">
                      <th className="text-left px-4 py-3">Empresa</th>
                      <th className="text-left px-4 py-3">CNPJ</th>
                      <th className="text-left px-4 py-3">Plano</th>
                      <th className="text-center px-4 py-3">Veículos</th>
                      <th className="text-center px-4 py-3">Motoristas</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresas.map((e: any) => {
                      const plano = planoConfig[e.plano] || planoConfig.basico;
                      return (
                        <tr key={e.id} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{e.nome}</td>
                          <td className="px-4 py-3 text-muted-foreground">{e.cnpj || "—"}</td>
                          <td className="px-4 py-3"><Badge className={`border text-xs ${plano.color}`}>{plano.label}</Badge></td>
                          <td className="px-4 py-3 text-center">{e.id === 1 ? veiculos.length : 0} / {e.maxVeiculos}</td>
                          <td className="px-4 py-3 text-center">{e.id === 1 ? motoristas.length : 0} / {e.maxMotoristas}</td>
                          <td className="px-4 py-3">
                            <Badge className={e.status === "ativa" ? "bg-green-100 text-green-700 border border-green-300" : "bg-red-100 text-red-700 border border-red-300"}>
                              {e.status === "ativa" ? "Ativa" : "Inativa"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleStatusEmpresa(e.id)}>
                              {e.status === "ativa" ? "Desativar" : "Ativar"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs */}
      {abaAtiva === "logs" && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">Logs de Atividade</p>
            <p className="text-sm mt-1">Os logs de atividade do sistema aparecerão aqui conforme os usuários interagem com o sistema.</p>
            <p className="text-xs mt-3">Registros de login, criação de viagens, abastecimentos, manutenções e outras ações serão exibidos automaticamente.</p>
          </CardContent>
        </Card>
      )}

      {/* Configurações */}
      {abaAtiva === "config" && (
        <div className="space-y-4">
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
