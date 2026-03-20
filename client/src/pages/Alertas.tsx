import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Clock, Wrench, FileText, DollarSign, CheckCircle } from "lucide-react";

const EMPRESA_ID = 1;

function getDiasRestantes(vencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento);
  venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Alertas() {
  const { data: veiculos = [] } = trpc.veiculos.list.useQuery({ empresaId: EMPRESA_ID });
  const { data: manutencoes = [] } = trpc.frota.manutencoes.list.useQuery({ empresaId: EMPRESA_ID });
  const { data: multas = [] } = trpc.multas.list.useQuery({ empresaId: EMPRESA_ID });

  // Documentos do localStorage
  const documentos: any[] = (() => {
    try { return JSON.parse(localStorage.getItem("rotiq_documentos") || "[]"); } catch { return []; }
  })();

  const alertas: { tipo: string; titulo: string; descricao: string; nivel: "critico" | "alto" | "medio"; icon: React.ReactNode }[] = [];

  // Alertas de manutenção
  manutencoes.forEach((m: any) => {
    if (m.status === "pendente" || m.status === "agendada") {
      const veiculo = veiculos.find((v: any) => v.id === m.veiculoId);
      alertas.push({
        tipo: "Manutenção",
        titulo: `Manutenção pendente — ${veiculo?.placa || "Veículo"}`,
        descricao: `${m.tipo || m.descricao || "Serviço"} — ${m.empresa || "Oficina não informada"}`,
        nivel: m.status === "agendada" ? "medio" : "alto",
        icon: <Wrench className="w-5 h-5" />,
      });
    }
  });

  // Alertas de multas pendentes com vencimento próximo
  multas.forEach((m: any) => {
    if (m.status === "pendente" && m.vencimento) {
      const dias = getDiasRestantes(m.vencimento);
      if (dias < 0) {
        alertas.push({
          tipo: "Multa",
          titulo: `Multa vencida — ${m.veiculoPlaca || "Veículo"}`,
          descricao: `${m.descricao} — ${Number(m.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          nivel: "critico",
          icon: <DollarSign className="w-5 h-5" />,
        });
      } else if (dias <= 7) {
        alertas.push({
          tipo: "Multa",
          titulo: `Multa vence em ${dias} dia(s) — ${m.veiculoPlaca || "Veículo"}`,
          descricao: `${m.descricao} — ${Number(m.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          nivel: "alto",
          icon: <DollarSign className="w-5 h-5" />,
        });
      }
    }
  });

  // Alertas de documentos
  documentos.forEach((d: any) => {
    const dias = getDiasRestantes(d.vencimento);
    if (dias < 0) {
      alertas.push({
        tipo: "Documento",
        titulo: `${d.tipo} vencido — ${d.veiculoPlaca || d.motoristaNome || ""}`,
        descricao: `Venceu há ${Math.abs(dias)} dia(s)`,
        nivel: "critico",
        icon: <FileText className="w-5 h-5" />,
      });
    } else if (dias <= 30) {
      alertas.push({
        tipo: "Documento",
        titulo: `${d.tipo} vence em ${dias} dia(s) — ${d.veiculoPlaca || d.motoristaNome || ""}`,
        descricao: `Vencimento: ${new Date(d.vencimento).toLocaleDateString("pt-BR")}`,
        nivel: dias <= 7 ? "alto" : "medio",
        icon: <FileText className="w-5 h-5" />,
      });
    }
  });

  // Veículos sem KM atualizado há mais de 30 dias (simulado)
  veiculos.forEach((v: any) => {
    if (v.kmAtual && v.proximaRevisaoKm && Number(v.kmAtual) >= Number(v.proximaRevisaoKm)) {
      alertas.push({
        tipo: "Revisão",
        titulo: `Revisão necessária — ${v.placa}`,
        descricao: `KM atual ${Number(v.kmAtual).toLocaleString("pt-BR")} atingiu o KM de revisão ${Number(v.proximaRevisaoKm).toLocaleString("pt-BR")}`,
        nivel: "alto",
        icon: <Wrench className="w-5 h-5" />,
      });
    }
  });

  const nivelConfig = {
    critico: { label: "Crítico", color: "bg-red-100 text-red-700 border-red-300", bg: "border-l-4 border-l-red-500" },
    alto:    { label: "Alto",    color: "bg-orange-100 text-orange-700 border-orange-300", bg: "border-l-4 border-l-orange-500" },
    medio:   { label: "Médio",   color: "bg-yellow-100 text-yellow-700 border-yellow-300", bg: "border-l-4 border-l-yellow-500" },
  };

  const criticos = alertas.filter(a => a.nivel === "critico").length;
  const altos = alertas.filter(a => a.nivel === "alto").length;
  const medios = alertas.filter(a => a.nivel === "medio").length;

  return (
<div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-red-500" />
          Central de Alertas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Alertas automáticos baseados nos dados do sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold mt-1">{alertas.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Críticos</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{criticos}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Altos</p>
            <p className="text-2xl font-bold mt-1 text-orange-600">{altos}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Médios</p>
            <p className="text-2xl font-bold mt-1 text-yellow-600">{medios}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alertas */}
      {alertas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="text-lg font-medium text-green-600">Tudo em ordem!</p>
            <p className="text-sm mt-1">Nenhum alerta ativo no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Críticos primeiro */}
          {(["critico", "alto", "medio"] as const).map(nivel => {
            const grupo = alertas.filter(a => a.nivel === nivel);
            if (grupo.length === 0) return null;
            const cfg = nivelConfig[nivel];
            return (
              <div key={nivel}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {cfg.label} ({grupo.length})
                </h3>
                <div className="space-y-2">
                  {grupo.map((alerta, i) => (
                    <Card key={i} className={cfg.bg}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${cfg.color.split(" ").slice(0, 1).join(" ")} shrink-0`}>
                            <span className={cfg.color.split(" ").slice(1).join(" ")}>{alerta.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{alerta.titulo}</span>
                              <Badge className={`border text-xs ${cfg.color}`}>{alerta.tipo}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{alerta.descricao}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
);
}
