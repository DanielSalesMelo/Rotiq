import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Users, ShieldCheck, Eye, Truck, UserCog, AlertTriangle } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  master_admin: "Master Admin",
  admin: "Administrador",
  monitor: "Monitor",
  dispatcher: "Despachante",
  user: "Operador",
};

const ROLE_COLORS: Record<string, string> = {
  master_admin: "bg-purple-500/10 text-purple-700 border-purple-200",
  admin: "bg-red-500/10 text-red-700 border-red-200",
  monitor: "bg-blue-500/10 text-blue-700 border-blue-200",
  dispatcher: "bg-orange-500/10 text-orange-700 border-orange-200",
  user: "bg-green-500/10 text-green-700 border-green-200",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  master_admin: <Shield className="h-3.5 w-3.5" />,
  admin: <ShieldCheck className="h-3.5 w-3.5" />,
  monitor: <Eye className="h-3.5 w-3.5" />,
  dispatcher: <Truck className="h-3.5 w-3.5" />,
  user: <UserCog className="h-3.5 w-3.5" />,
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  master_admin: "Acesso total a todas as empresas. Pode restaurar registros da lixeira.",
  admin: "Gerencia uma empresa. Pode deletar registros e ver auditoria.",
  monitor: "Visualiza tudo. Pode mover para lixeira com motivo obrigatório.",
  dispatcher: "Registra saída/chegada de veículos e cria viagens.",
  user: "Adiciona e edita registros. Não pode deletar.",
};

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<string>("");

  const { data: users, refetch } = trpc.dashboard.listUsers.useQuery({ empresaId: 1 });
  const updateRole = trpc.dashboard.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Permissão atualizada com sucesso!");
      setEditingId(null);
      refetch();
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const handleSaveRole = (userId: number) => {
    if (!newRole) return;
    updateRole.mutate({ userId, role: newRole as any });
  };

  const isCurrentUserMasterAdmin = (currentUser as any)?.role === "master_admin";
  const isCurrentUserAdmin = (currentUser as any)?.role === "admin" || isCurrentUserMasterAdmin;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle de acesso e permissões por usuário
          </p>
        </div>

        {/* Aviso de permissão */}
        {!isCurrentUserAdmin && (
          <Card className="border-yellow-200 bg-yellow-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-700">
                Você não tem permissão para alterar níveis de acesso. Apenas administradores podem modificar permissões.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Legenda de níveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <Card key={role} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs border gap-1 ${ROLE_COLORS[role]}`}>
                    {ROLE_ICONS[role]}
                    {label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Lista de usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuários com Acesso</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!users || users.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum usuário cadastrado ainda.</p>
                <p className="text-xs mt-1">Os usuários aparecem aqui após fazerem login pela primeira vez.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {users.map((u: any) => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                    {/* Avatar e info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {(u.name ?? u.openId ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{u.name ?? u.openId ?? "Usuário"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.openId}</p>
                      </div>
                    </div>

                    {/* Role atual */}
                    <div className="flex items-center gap-3">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ROLE_LABELS)
                                .filter(([r]) => r !== "master_admin" || isCurrentUserMasterAdmin)
                                .map(([r, l]) => (
                                  <SelectItem key={r} value={r} className="text-xs">{l}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleSaveRole(u.id)}
                            disabled={updateRole.isPending}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => setEditingId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge className={`text-xs border gap-1 ${ROLE_COLORS[u.role] ?? ROLE_COLORS.user}`}>
                            {ROLE_ICONS[u.role] ?? ROLE_ICONS.user}
                            {ROLE_LABELS[u.role] ?? u.role}
                          </Badge>
                          {isCurrentUserAdmin && u.id !== (currentUser as any)?.id && u.role !== "master_admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => { setEditingId(u.id); setNewRole(u.role); }}
                            >
                              Alterar
                            </Button>
                          )}
                          {u.id === (currentUser as any)?.id && (
                            <span className="text-xs text-muted-foreground">(você)</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Como adicionar um novo usuário:</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Compartilhe o link do sistema com a pessoa</li>
              <li>Ela faz login com a conta Manus dela</li>
              <li>O nome aparece aqui automaticamente com nível "Operador"</li>
              <li>Você altera o nível conforme necessário</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
