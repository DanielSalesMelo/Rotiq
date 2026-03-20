import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Plus, Fuel, Droplets } from "lucide-react";
import { toast } from "sonner";

const EMPRESA_ID = 1;

const COMBUSTIVEL_LABELS: Record<string, string> = {
  diesel: "Diesel",
  arla: "ARLA 32",
  gasolina: "Gasolina",
  etanol: "Etanol",
  gas: "Gás",
  outro: "Outro",
};

const COMBUSTIVEL_COLORS: Record<string, string> = {
  diesel: "bg-gray-100 text-gray-700",
  arla: "bg-blue-100 text-blue-700",
  gasolina: "bg-yellow-100 text-yellow-700",
  etanol: "bg-green-100 text-green-700",
  gas: "bg-orange-100 text-orange-700",
  outro: "bg-purple-100 text-purple-700",
};

function formatCurrency(v: any) {
  if (!v) return "—";
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AbastecimentoForm({ veiculos, motoristas, onSave, onClose }: {
  veiculos: any[];
  motoristas: any[];
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    veiculoId: "",
    motoristaId: "",
    data: new Date().toISOString().split("T")[0],
    tipoCombustivel: "diesel",
    quantidade: "",
    valorUnitario: "",
    valorTotal: "",
    kmAtual: "",
    local: "",
    tipoAbastecimento: "interno",
    observacoes: "",
  });

  function calcTotal() {
    const q = parseFloat(form.quantidade);
    const v = parseFloat(form.valorUnitario);
    if (!isNaN(q) && !isNaN(v)) {
      setForm(f => ({ ...f, valorTotal: (q * v).toFixed(2) }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.veiculoId) { toast.error("Selecione um veículo"); return; }
    onSave({
      empresaId: EMPRESA_ID,
      veiculoId: Number(form.veiculoId),
      motoristaId: form.motoristaId ? Number(form.motoristaId) : null,
      data: form.data,
      tipoCombustivel: form.tipoCombustivel,
      quantidade: form.quantidade,
      valorUnitario: form.valorUnitario || null,
      valorTotal: form.valorTotal || null,
      kmAtual: form.kmAtual ? Number(form.kmAtual) : null,
      local: form.local || undefined,
      tipoAbastecimento: form.tipoAbastecimento as "interno" | "externo",
      observacoes: form.observacoes || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Veículo *</Label>
          <Select value={form.veiculoId} onValueChange={v => setForm(f => ({ ...f, veiculoId: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              {veiculos.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.placa}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Motorista</Label>
          <Select value={form.motoristaId || "none"} onValueChange={v => setForm(f => ({ ...f, motoristaId: v === "none" ? "" : v }))}>
            <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informado</SelectItem>
              {motoristas.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Data *</Label>
          <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} required />
        </div>
        <div className="space-y-1.5">
          <Label>Combustível *</Label>
          <Select value={form.tipoCombustivel} onValueChange={v => setForm(f => ({ ...f, tipoCombustivel: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(COMBUSTIVEL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Quantidade (L) *</Label>
          <Input type="number" step="0.01" value={form.quantidade}
            onChange={e => setForm(f => ({ ...f, quantidade: e.target.value }))}
            onBlur={calcTotal} required />
        </div>
        <div className="space-y-1.5">
          <Label>Valor Unitário (R$/L)</Label>
          <Input type="number" step="0.001" value={form.valorUnitario}
            onChange={e => setForm(f => ({ ...f, valorUnitario: e.target.value }))}
            onBlur={calcTotal} />
        </div>
        <div className="space-y-1.5">
          <Label>Valor Total</Label>
          <Input type="number" step="0.01" value={form.valorTotal}
            onChange={e => setForm(f => ({ ...f, valorTotal: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>KM Atual</Label>
          <Input type="number" value={form.kmAtual} onChange={e => setForm(f => ({ ...f, kmAtual: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Local / Posto</Label>
          <Input value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} placeholder="Nome do posto..." />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={form.tipoAbastecimento} onValueChange={v => setForm(f => ({ ...f, tipoAbastecimento: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="interno">Tanque interno</SelectItem>
              <SelectItem value="externo">Posto externo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit">Registrar</Button>
      </div>
    </form>
  );
}

export default function Abastecimentos() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: lista = [], isLoading } = trpc.frota.abastecimentos.list.useQuery({ empresaId: EMPRESA_ID, limit: 100 });
  const { data: veiculos = [] } = trpc.veiculos.list.useQuery({ empresaId: EMPRESA_ID });
  const { data: motoristas = [] } = trpc.funcionarios.listMotoristas.useQuery({ empresaId: EMPRESA_ID });
  const { data: tanque } = trpc.frota.tanque.saldoAtual.useQuery({ empresaId: EMPRESA_ID });

  const createMut = trpc.frota.abastecimentos.create.useMutation({
    onSuccess: () => { utils.frota.abastecimentos.list.invalidate(); setOpen(false); toast.success("Abastecimento registrado!"); },
    onError: (e) => toast.error(e.message),
  });

  const veiculoMap = Object.fromEntries(veiculos.map(v => [v.id, v.placa]));
  const motoristaMap = Object.fromEntries(motoristas.map(m => [m.id, m.nome]));

  const totalMes = lista
    .filter(a => new Date(a.data).getMonth() === new Date().getMonth())
    .reduce((acc, a) => acc + (Number(a.valorTotal) || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Abastecimentos</h1>
            <p className="text-sm text-muted-foreground">{lista.length} registros</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Abastecimento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Registrar Abastecimento</DialogTitle></DialogHeader>
              <AbastecimentoForm veiculos={veiculos} motoristas={motoristas} onSave={d => createMut.mutate(d)} onClose={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Gasto no mês</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(totalMes)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Saldo Diesel (tanque)</p>
              <p className="text-xl font-bold mt-1">{tanque ? `${Number(tanque.diesel).toFixed(0)}L` : "..."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Saldo ARLA (tanque)</p>
              <p className="text-xl font-bold mt-1">{tanque ? `${Number(tanque.arla).toFixed(0)}L` : "..."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total de registros</p>
              <p className="text-xl font-bold mt-1">{lista.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead className="text-right">Qtd (L)</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>KM</TableHead>
                    <TableHead>Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : lista.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Fuel className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhum abastecimento registrado
                    </TableCell></TableRow>
                  ) : lista.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm">{new Date(a.data).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-medium text-sm">{veiculoMap[a.veiculoId] ?? a.veiculoId}</TableCell>
                      <TableCell className="text-sm">{a.motoristaId ? (motoristaMap[a.motoristaId] ?? "—") : "—"}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${COMBUSTIVEL_COLORS[a.tipoCombustivel] ?? ""}`}>
                          {COMBUSTIVEL_LABELS[a.tipoCombustivel] ?? a.tipoCombustivel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{Number(a.quantidade).toFixed(1)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(a.valorTotal)}</TableCell>
                      <TableCell className="text-sm">{a.kmAtual ? Number(a.kmAtual).toLocaleString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.local ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
