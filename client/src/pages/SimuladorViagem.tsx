import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator, TrendingUp, TrendingDown, Fuel, Wrench, DollarSign,
  MapPin, Truck, CheckCircle2, AlertTriangle, Clock, BarChart3, Save
} from "lucide-react";

interface SimulacaoForm {
  descricao: string;
  veiculoId: string;
  origem: string;
  destino: string;
  distanciaKm: string;
  // Receita
  valorFrete: string;
  // Combustível
  mediaConsumoKmL: string;
  precoDieselLitro: string;
  // Pedágios
  valorPedagios: string;
  // Diárias / Alimentação
  diasViagem: string;
  valorDiaria: string;
  // Manutenção estimada
  custoManutencaoKm: string;
  // Outros
  outrosCustos: string;
  observacoes: string;
}

const FORM_INICIAL: SimulacaoForm = {
  descricao: "",
  veiculoId: "",
  origem: "",
  destino: "",
  distanciaKm: "",
  valorFrete: "",
  mediaConsumoKmL: "3.5",
  precoDieselLitro: "6.50",
  valorPedagios: "",
  diasViagem: "1",
  valorDiaria: "120",
  custoManutencaoKm: "0.15",
  outrosCustos: "",
  observacoes: "",
};

function calcular(form: SimulacaoForm) {
  const dist = parseFloat(form.distanciaKm) || 0;
  const frete = parseFloat(form.valorFrete) || 0;
  const media = parseFloat(form.mediaConsumoKmL) || 3.5;
  const diesel = parseFloat(form.precoDieselLitro) || 6.5;
  const pedagios = parseFloat(form.valorPedagios) || 0;
  const dias = parseFloat(form.diasViagem) || 1;
  const diaria = parseFloat(form.valorDiaria) || 0;
  const manutKm = parseFloat(form.custoManutencaoKm) || 0;
  const outros = parseFloat(form.outrosCustos) || 0;

  const litros = dist > 0 && media > 0 ? dist / media : 0;
  const custoCombustivel = litros * diesel;
  const custoDiarias = dias * diaria;
  const custoManutencao = dist * manutKm;

  const custoTotal = custoCombustivel + pedagios + custoDiarias + custoManutencao + outros;
  const margemBruta = frete - custoTotal;
  const margemPct = frete > 0 ? (margemBruta / frete) * 100 : 0;
  const custoPorKm = dist > 0 ? custoTotal / dist : 0;
  const receitaPorKm = dist > 0 ? frete / dist : 0;

  return {
    litros,
    custoCombustivel,
    custoDiarias,
    custoManutencao,
    custoTotal,
    margemBruta,
    margemPct,
    custoPorKm,
    receitaPorKm,
    viavel: margemPct >= 15,
  };
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtN(v: number, dec = 2) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export default function SimuladorViagem() {
  const [form, setForm] = useState<SimulacaoForm>(FORM_INICIAL);
  const [simulado, setSimulado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const { data: veiculos } = trpc.veiculos.list.useQuery({ empresaId: 1 });
  const { data: historico, refetch } = trpc.frota.listSimulacoes.useQuery({ empresaId: 1 });

  const salvarSimulacao = trpc.frota.salvarSimulacao.useMutation({
    onSuccess: () => {
      toast.success("Simulação salva no histórico!");
      setSalvando(false);
      refetch();
    },
    onError: (e) => { toast.error(e.message); setSalvando(false); },
  });

  const resultado = calcular(form);

  const handleSimular = () => {
    if (!form.distanciaKm || !form.valorFrete) {
      toast.error("Informe a distância e o valor do frete para simular");
      return;
    }
    setSimulado(true);
  };

  const handleSalvar = () => {
    if (!simulado) { toast.error("Simule primeiro antes de salvar"); return; }
    setSalvando(true);
    salvarSimulacao.mutate({
      empresaId: 1,
      descricao: form.descricao || `${form.origem || "Origem"} → ${form.destino || "Destino"}`,
      veiculoId: form.veiculoId ? parseInt(form.veiculoId) : undefined,
      origem: form.origem || undefined,
      destino: form.destino || undefined,
      distanciaKm: parseFloat(form.distanciaKm),
      valorFrete: parseFloat(form.valorFrete),
      custoTotal: resultado.custoTotal,
      margemBruta: resultado.margemBruta,
      margemPct: resultado.margemPct,
      detalhes: JSON.stringify({
        custoCombustivel: resultado.custoCombustivel,
        pedagios: parseFloat(form.valorPedagios) || 0,
        diarias: resultado.custoDiarias,
        manutencao: resultado.custoManutencao,
        outros: parseFloat(form.outrosCustos) || 0,
        mediaConsumo: form.mediaConsumoKmL,
        precoDiesel: form.precoDieselLitro,
      }),
      observacoes: form.observacoes || undefined,
    });
  };

  const f = (field: keyof SimulacaoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
<div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Simulador de Viagem
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Calcule se a viagem compensa antes de aceitar o frete — preencha os dados e veja a margem prevista
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="xl:col-span-2 space-y-4">
            {/* Identificação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Dados da Viagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Descrição / Referência</Label>
                    <Input placeholder="Ex: Frete Brasília → SP" value={form.descricao} onChange={f("descricao")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Veículo (opcional)</Label>
                    <Select value={form.veiculoId} onValueChange={v => setForm(p => ({ ...p, veiculoId: v === "__none__" ? "" : v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o veículo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {(veiculos ?? []).map(v => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.placa} — {v.modelo ?? v.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Input placeholder="Cidade de origem" value={form.origem} onChange={f("origem")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Destino</Label>
                    <Input placeholder="Cidade de destino" value={form.destino} onChange={f("destino")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Distância Total (km) *</Label>
                    <Input type="number" placeholder="Ex: 1200" value={form.distanciaKm} onChange={f("distanciaKm")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receita */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Valor do Frete (R$) *</Label>
                  <Input type="number" placeholder="Ex: 4500.00" value={form.valorFrete} onChange={f("valorFrete")} />
                </div>
              </CardContent>
            </Card>

            {/* Custos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Custos Estimados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Combustível */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Fuel className="h-3.5 w-3.5" /> Combustível
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Média de Consumo (km/L)</Label>
                      <Input type="number" step="0.1" value={form.mediaConsumoKmL} onChange={f("mediaConsumoKmL")} />
                      {form.distanciaKm && form.mediaConsumoKmL && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {fmtN(parseFloat(form.distanciaKm) / parseFloat(form.mediaConsumoKmL), 1)} litros necessários
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Preço do Diesel (R$/L)</Label>
                      <Input type="number" step="0.01" value={form.precoDieselLitro} onChange={f("precoDieselLitro")} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pedágios e Diárias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pedágios (R$)</Label>
                    <Input type="number" placeholder="Ex: 350.00" value={form.valorPedagios} onChange={f("valorPedagios")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Outros Custos (R$)</Label>
                    <Input type="number" placeholder="Ex: refeições extras, etc." value={form.outrosCustos} onChange={f("outrosCustos")} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Dias de Viagem
                    </Label>
                    <Input type="number" min="1" value={form.diasViagem} onChange={f("diasViagem")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Diária do Motorista (R$/dia)</Label>
                    <Input type="number" step="10" value={form.valorDiaria} onChange={f("valorDiaria")} />
                  </div>
                </div>

                <Separator />

                {/* Manutenção */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5" />
                    Custo de Manutenção por KM (R$/km)
                  </Label>
                  <Input type="number" step="0.01" value={form.custoManutencaoKm} onChange={f("custoManutencaoKm")} />
                  <p className="text-xs text-muted-foreground">
                    Custo médio de manutenção por km rodado (pneus, óleo, peças, etc.)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Anotações sobre esta simulação..."
                value={form.observacoes}
                onChange={f("observacoes")}
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSimular} className="flex-1" size="lg">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Viabilidade
              </Button>
              {simulado && (
                <Button onClick={handleSalvar} variant="outline" size="lg" disabled={salvando}>
                  <Save className="h-4 w-4 mr-2" />
                  {salvando ? "Salvando..." : "Salvar no Histórico"}
                </Button>
              )}
            </div>
          </div>

          {/* Resultado */}
          <div className="space-y-4">
            {simulado ? (
              <>
                {/* Veredito */}
                <Card className={`border-2 ${resultado.viavel ? "border-green-400 bg-green-500/5" : "border-red-400 bg-red-500/5"}`}>
                  <CardContent className="p-5 text-center space-y-2">
                    {resultado.viavel ? (
                      <>
                        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                        <p className="text-lg font-bold text-green-700">Viagem Viável</p>
                        <p className="text-sm text-green-600">Margem acima de 15% — frete compensador</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
                        <p className="text-lg font-bold text-red-700">Atenção!</p>
                        <p className="text-sm text-red-600">Margem abaixo de 15% — revise os valores</p>
                      </>
                    )}
                    <div className="mt-3 p-3 rounded-lg bg-white/50 border">
                      <p className="text-3xl font-bold" style={{ color: resultado.viavel ? "#16a34a" : "#dc2626" }}>
                        {fmtN(resultado.margemPct, 1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">Margem de Lucro</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo financeiro */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-green-600 font-medium">Receita (Frete)</span>
                      <span className="font-bold text-green-600">{fmt(parseFloat(form.valorFrete) || 0)}</span>
                    </div>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground"><Fuel className="h-3.5 w-3.5" /> Combustível</span>
                        <span className="text-red-600">- {fmt(resultado.custoCombustivel)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pedágios</span>
                        <span className="text-red-600">- {fmt(parseFloat(form.valorPedagios) || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Diárias</span>
                        <span className="text-red-600">- {fmt(resultado.custoDiarias)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground"><Wrench className="h-3.5 w-3.5" /> Manutenção</span>
                        <span className="text-red-600">- {fmt(resultado.custoManutencao)}</span>
                      </div>
                      {parseFloat(form.outrosCustos) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Outros</span>
                          <span className="text-red-600">- {fmt(parseFloat(form.outrosCustos))}</span>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm font-semibold">Custo Total</span>
                      <span className="font-bold text-red-600">{fmt(resultado.custoTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 rounded-lg bg-muted/30 px-2">
                      <span className="text-sm font-semibold">Margem Bruta</span>
                      <span className={`font-bold text-lg ${resultado.margemBruta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {fmt(resultado.margemBruta)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Indicadores por KM */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por Quilômetro</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-lg bg-green-500/10">
                        <p className="text-lg font-bold text-green-600">R$ {fmtN(resultado.receitaPorKm, 2)}</p>
                        <p className="text-xs text-muted-foreground">Receita/km</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-red-500/10">
                        <p className="text-lg font-bold text-red-600">R$ {fmtN(resultado.custoPorKm, 2)}</p>
                        <p className="text-xs text-muted-foreground">Custo/km</p>
                      </div>
                    </div>
                    {form.distanciaKm && (
                      <div className="text-center text-xs text-muted-foreground">
                        {fmtN(resultado.litros, 1)} litros de diesel para {Number(form.distanciaKm).toLocaleString("pt-BR")} km
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center space-y-3">
                  <Calculator className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-muted-foreground text-sm">
                    Preencha os dados e clique em <strong>Calcular Viabilidade</strong> para ver o resultado
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Histórico de simulações */}
        {(historico ?? []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Histórico de Simulações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2 pr-4">Descrição</th>
                      <th className="text-left py-2 pr-4">Rota</th>
                      <th className="text-right py-2 pr-4">Distância</th>
                      <th className="text-right py-2 pr-4">Frete</th>
                      <th className="text-right py-2 pr-4">Custo</th>
                      <th className="text-right py-2 pr-4">Margem</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(historico ?? []).map((s: any) => {
                      const margem = Number(s.margemPct) || 0;
                      const viavel = margem >= 15;
                      return (
                        <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-2 pr-4 font-medium">{s.descricao}</td>
                          <td className="py-2 pr-4 text-muted-foreground text-xs">
                            {s.origem && s.destino ? `${s.origem} → ${s.destino}` : s.origem || s.destino || "—"}
                          </td>
                          <td className="py-2 pr-4 text-right">{Number(s.distanciaKm).toLocaleString("pt-BR")} km</td>
                          <td className="py-2 pr-4 text-right text-green-600">{fmt(Number(s.valorFrete))}</td>
                          <td className="py-2 pr-4 text-right text-red-600">{fmt(Number(s.custoTotal))}</td>
                          <td className="py-2 pr-4 text-right font-semibold" style={{ color: viavel ? "#16a34a" : "#dc2626" }}>
                            {fmtN(margem, 1)}%
                          </td>
                          <td className="py-2 text-center">
                            <Badge className={viavel ? "bg-green-500/10 text-green-700 border-green-200" : "bg-red-500/10 text-red-700 border-red-200"}>
                              {viavel ? "Viável" : "Revisar"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
);
}
