import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const EMPRESA_ID = 1;

const tiposDoc = [
  "CRLV (Licenciamento)",
  "Seguro Obrigatório (DPVAT)",
  "Seguro Frota",
  "Tacógrafo",
  "Vistoria Técnica",
  "Licença ANTT",
  "Habilitação do Motorista (CNH)",
  "Certificado de Rastreamento",
  "Outros",
];

function getDiasRestantes(vencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento);
  venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ vencimento }: { vencimento: string }) {
  const dias = getDiasRestantes(vencimento);
  if (dias < 0) return <Badge className="bg-red-100 text-red-700 border border-red-300">Vencido ({Math.abs(dias)}d)</Badge>;
  if (dias <= 30) return <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">Vence em {dias}d</Badge>;
  if (dias <= 90) return <Badge className="bg-orange-100 text-orange-700 border border-orange-300">Vence em {dias}d</Badge>;
  return <Badge className="bg-green-100 text-green-700 border border-green-300">Em dia ({dias}d)</Badge>;
}

export default function DocumentacaoFrota() {
  const [modalOpen, setModalOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [form, setForm] = useState({
    tipo: "",
    veiculoId: "",
    motoristaId: "",
    numero: "",
    emissao: "",
    vencimento: "",
    orgaoEmissor: "",
    observacoes: "",
  });

  const { data: veiculos = [] } = trpc.veiculos.list.useQuery({ empresaId: EMPRESA_ID });
  const { data: motoristas = [] } = trpc.funcionarios.listMotoristas.useQuery({ empresaId: EMPRESA_ID });

  const [documentos, setDocumentos] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("rotiq_documentos") || "[]"); } catch { return []; }
  });

  const salvarDocumento = () => {
    if (!form.tipo) { toast.error("Selecione o tipo de documento"); return; }
    if (!form.vencimento) { toast.error("Informe a data de vencimento"); return; }
    if (!form.veiculoId && !form.motoristaId) { toast.error("Vincule a um veículo ou motorista"); return; }

    const veiculo = veiculos.find((v: any) => String(v.id) === form.veiculoId);
    const motorista = motoristas.find((m: any) => String(m.id) === form.motoristaId);

    const novoDoc = {
      id: Date.now(),
      ...form,
      veiculoPlaca: veiculo?.placa || null,
      veiculoModelo: veiculo?.modelo || null,
      motoristaNome: motorista?.nome || null,
      createdAt: new Date().toISOString(),
    };
    const novos = [novoDoc, ...documentos];
    setDocumentos(novos);
    localStorage.setItem("rotiq_documentos", JSON.stringify(novos));
    toast.success("Documento registrado!");
    setModalOpen(false);
    setForm({ tipo: "", veiculoId: "", motoristaId: "", numero: "", emissao: "", vencimento: "", orgaoEmissor: "", observacoes: "" });
  };

  const docsFiltrados = documentos.filter((d: any) => {
    const matchBusca = !busca ||
      d.tipo?.toLowerCase().includes(busca.toLowerCase()) ||
      d.veiculoPlaca?.toLowerCase().includes(busca.toLowerCase()) ||
      d.motoristaNome?.toLowerCase().includes(busca.toLowerCase());
    if (filtroStatus === "todos") return matchBusca;
    const dias = getDiasRestantes(d.vencimento);
    if (filtroStatus === "vencido") return matchBusca && dias < 0;
    if (filtroStatus === "avencer") return matchBusca && dias >= 0 && dias <= 30;
    if (filtroStatus === "emdia") return matchBusca && dias > 30;
    return matchBusca;
  });

  const vencidos = documentos.filter(d => getDiasRestantes(d.vencimento) < 0).length;
  const aVencer30 = documentos.filter(d => { const dias = getDiasRestantes(d.vencimento); return dias >= 0 && dias <= 30; }).length;
  const aVencer90 = documentos.filter(d => { const dias = getDiasRestantes(d.vencimento); return dias > 30 && dias <= 90; }).length;
  const emDia = documentos.filter(d => getDiasRestantes(d.vencimento) > 90).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Documentação da Frota
          </h1>
          <p className="text-muted-foreground text-sm mt-1">CRLV, seguros, habilitações e licenças</p>
        </div>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Documento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Documento</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1 col-span-2">
                <Label>Tipo de Documento *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    {tiposDoc.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Veículo</Label>
                <Select value={form.veiculoId} onValueChange={(v) => setForm(f => ({ ...f, veiculoId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {veiculos.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.placa} — {v.modelo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Motorista</Label>
                <Select value={form.motoristaId} onValueChange={(v) => setForm(f => ({ ...f, motoristaId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {motoristas.map((m: any) => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Número / Protocolo</Label>
                <Input placeholder="Ex: 12345678" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Órgão Emissor</Label>
                <Input placeholder="Ex: DETRAN-DF" value={form.orgaoEmissor} onChange={e => setForm(f => ({ ...f, orgaoEmissor: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Data de Emissão</Label>
                <Input type="date" value={form.emissao} onChange={e => setForm(f => ({ ...f, emissao: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Data de Vencimento *</Label>
                <Input type="date" value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Observações</Label>
                <Input placeholder="Observações opcionais" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={salvarDocumento}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencidos</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{vencidos}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencem em 30d</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{aVencer30}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencem em 90d</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">{aVencer90}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-200 mt-1" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Em Dia</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{emDia}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por tipo, placa, motorista..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os documentos</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
            <SelectItem value="avencer">A vencer (30 dias)</SelectItem>
            <SelectItem value="emdia">Em dia</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {docsFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum documento cadastrado</p>
              <p className="text-xs mt-1">Clique em "Novo Documento" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground text-xs uppercase">
                    <th className="text-left px-4 py-3">Tipo</th>
                    <th className="text-left px-4 py-3">Veículo / Motorista</th>
                    <th className="text-left px-4 py-3">Número</th>
                    <th className="text-left px-4 py-3">Emissão</th>
                    <th className="text-left px-4 py-3">Vencimento</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {docsFiltrados.map((d: any) => (
                    <tr key={d.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{d.tipo}</td>
                      <td className="px-4 py-3">
                        {d.veiculoPlaca && <span className="block font-medium">{d.veiculoPlaca} — {d.veiculoModelo}</span>}
                        {d.motoristaNome && <span className="block text-muted-foreground">{d.motoristaNome}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.numero || "—"}</td>
                      <td className="px-4 py-3">{d.emissao ? new Date(d.emissao).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="px-4 py-3">{new Date(d.vencimento).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3"><StatusBadge vencimento={d.vencimento} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
