import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search, BookOpen, HelpCircle, FileText, Video, Mail, MessageSquare,
  ChevronRight, ExternalLink, Download, Copy, Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const SECOES = [
  {
    id: "introducao",
    titulo: "Introdução",
    descricao: "Conheça o Rotiq e suas funcionalidades principais",
    conteudo: `
O Rotiq é um sistema ERP especializado em gestão de frotas de transporte e distribuição. 
Ele oferece controle completo sobre veículos, motoristas, viagens, carregamentos, notas fiscais, financeiro e muito mais.

**Principais Características:**
- Multi-empresa: Suporte para matriz e filiais com dados isolados
- Modo "Ver como Admin": Master admin simula visão de admin sem trocar de conta
- Rastreamento de NF: Acompanhamento completo de notas fiscais por viagem
- Carregamento e Romaneio: Montagem de carga com geração de PDF
- Acerto de Carga: Fechamento financeiro de viagens com comissão
- Integrações: Arquivei (NF-e) e Winthor (65 rotinas)
- Relatórios Avançados: KPIs gerenciais em tempo real
- Importação/Exportação: Templates Excel para dados
    `,
  },
  {
    id: "dashboard",
    titulo: "Dashboard",
    descricao: "Sua porta de entrada para o sistema",
    conteudo: `
O dashboard é sua porta de entrada. Ele mostra:

**KPIs do Mês:** Viagens realizadas, KM rodado, receita, despesas
**Veículos em Campo:** Quantos veículos estão em rota agora
**Alertas:** Documentos vencendo, manutenções pendentes
**Últimas Viagens:** Lista das viagens mais recentes
**Gráficos:** Tendências de receita, despesas e viagens

**Seletor de Empresa:**
Se você trabalha com múltiplas empresas (matriz/filiais):
1. Clique no botão de empresa no topo do menu
2. Selecione a empresa desejada
3. O sistema recarrega com os dados daquela empresa

**Modo "Ver como Admin":**
Apenas para Master Admin - Simule a visão de um admin de filial sem trocar de conta.
1. Vá para Administração → Painel Master
2. Aba "Empresas"
3. Clique em "Ver como Admin" ao lado da empresa
4. Um banner amarelo aparecerá no topo indicando a simulação
5. Clique em "Sair" no banner para voltar à visão master
    `,
  },
  {
    id: "viagens",
    titulo: "Viagens",
    descricao: "Gerenciamento completo de viagens",
    conteudo: `
**Criar Viagem:**
1. Clique em "+ Nova Viagem"
2. Preencha os dados:
   - Data: Data da viagem
   - Veículo: Selecione a placa
   - Motorista: Selecione o motorista
   - Tipo: Entrega ou Viagem
   - Status: Planejada, Em Andamento, Concluída, Cancelada
3. Clique em "Salvar"

**Acompanhar Viagem:**
1. Clique na viagem na lista
2. Expanda para ver detalhes
3. Você verá dados da viagem, notas fiscais vinculadas, acerto de carga e histórico

**Registrar Saída/Retorno:**
Ao sair: Clique em "Registrar Saída", preencha data/hora e KM inicial
Ao retornar: Clique em "Registrar Retorno", preencha data/hora e KM final
    `,
  },
  {
    id: "notas-fiscais",
    titulo: "Notas Fiscais",
    descricao: "Rastreamento de entregas por NF",
    conteudo: `
**Vincular NF a uma Viagem:**
1. Clique em "+ Adicionar NF"
2. Preencha os dados: Número, Série, Chave de Acesso, Destinatário, CNPJ, Endereço, Cidade/UF, Valor, Peso, Volumes
3. Clique em "Salvar"

**Atualizar Status da NF:**
1. Clique em "Status" na NF
2. Selecione o novo status: Pendente, Entregue, Devolvida, Parcial, Extraviada
3. Preencha os dados: Data/Hora da Entrega, Data do Canhoto, Recebido por, Motivo da Devolução, Observações, Foto do Canhoto
4. Clique em "Salvar Status"

**Lançar Canhoto Rápido:**
Para marcar uma NF como entregue rapidamente:
1. Clique em "Canhoto" na NF
2. Preencha: Data e Recebido por
3. Clique em "Confirmar"
    `,
  },
  {
    id: "carregamento",
    titulo: "Carregamento",
    descricao: "Montagem de cargas e geração de romaneio",
    conteudo: `
**Montar uma Carga:**
1. Clique em "+ Novo Carregamento"
2. Preencha: Data, Veículo, Motorista, Ajudante, Rota
3. Clique em "Criar"

**Adicionar NFs ao Carregamento:**
1. Clique em "+ Adicionar NF" dentro do carregamento
2. Selecione as NFs que fazem parte da carga
3. Clique em "Adicionar"

**Gerar Romaneio em PDF:**
1. Clique em "Romaneio" no carregamento
2. Uma nova aba abre com o documento formatado
3. Clique em "Imprimir / Salvar PDF" para baixar
4. O PDF inclui dados do veículo, motorista, tabela com NFs e campos para assinatura

**Registrar Saída/Retorno:**
1. Clique em "Marcar como Pronto" quando a carga estiver conferida
2. Clique em "Registrar Saída" quando o veículo sair
3. Ao retornar, clique em "Registrar Retorno"
4. Clique em "Encerrar" para finalizar a carga
    `,
  },
  {
    id: "acerto",
    titulo: "Acerto de Carga",
    descricao: "Fechamento financeiro de viagens",
    conteudo: `
**Criar Acerto:**
1. Clique em "+ Novo Acerto"
2. Selecione a viagem
3. Preencha os valores:
   - Adiantamento Concedido: O que a empresa deu ao motorista
   - Frete Recebido: O que o motorista cobrou dos clientes
   - Despesas: Pedágio, combustível, alimentação, etc.
   - Valor Devolvido: Troco que o motorista devolveu
4. O sistema calcula automaticamente:
   - Comissão: Percentual sobre o frete
   - Saldo Final: O que a empresa deve pagar ou receber

**Exemplo:**
Adiantamento Concedido: R$ 500,00
Frete Recebido: R$ 1.200,00
Despesas (Pedágio): -R$ 150,00
Despesas (Combustível): -R$ 200,00
Valor Devolvido: -R$ 100,00
Comissão (10%): -R$ 120,00
SALDO FINAL: R$ 630,00 (empresa deve pagar)

**Aprovar Acerto:**
1. Clique em "Aprovar" no acerto
2. O status muda para "Fechado"
3. Clique em "Marcar como Pago" quando o motorista receber
    `,
  },
  {
    id: "financeiro",
    titulo: "Financeiro",
    descricao: "Gestão de contas a pagar e receber",
    conteudo: `
**Contas a Pagar:**
1. Clique em "+ Nova Conta"
2. Preencha: Descrição, Categoria, Valor, Data de Vencimento, Fornecedor
3. Clique em "Salvar"
4. Para pagar: Clique na conta, "Marcar como Pago", preencha data e forma de pagamento

**Contas a Receber:**
1. Clique em "+ Nova Conta"
2. Preencha: Descrição, Cliente, Valor, Data de Vencimento
3. Clique em "Salvar"
4. Para receber: Clique na conta, "Marcar como Recebido", preencha data e forma de pagamento

**Adiantamentos:**
1. Clique em "+ Novo Adiantamento"
2. Preencha: Motorista, Valor, Data, Motivo
3. Clique em "Salvar"
4. O adiantamento é automaticamente acertado quando você fecha o Acerto de Carga
    `,
  },
  {
    id: "frota",
    titulo: "Frota",
    descricao: "Gestão de veículos e motoristas",
    conteudo: `
**Cadastrar Veículo:**
1. Clique em "+ Novo Veículo"
2. Preencha: Placa, Tipo, Marca, Modelo, Ano, Cor, RENAVAM, Chassi, Capacidade de Carga, Motorista Padrão, Documentação
3. Clique em "Salvar"

**Cadastrar Motorista:**
1. Clique em "+ Novo Motorista"
2. Preencha dados pessoais: Nome, CPF, RG, Telefone, Email
3. Preencha dados profissionais: Função, Tipo de Contrato, Salário
4. Preencha dados de CNH: CNH, Categoria, Vencimento, MOPP
5. Clique em "Salvar"

**Registrar Manutenção:**
1. Clique em "+ Nova Manutenção"
2. Preencha: Veículo, Data, Tipo, Descrição, Empresa, Valor, KM Atual, Próxima Manutenção
3. Clique em "Salvar"

**Plano de Manutenção:**
1. Clique em "+ Novo Plano"
2. Preencha: Veículo, Tipo, Intervalo (KM), Intervalo (Dias)
3. Clique em "Salvar"
O sistema alertará quando uma manutenção estiver vencida.
    `,
  },
  {
    id: "integrações",
    titulo: "Integrações",
    descricao: "Arquivei e Winthor",
    conteudo: `
**Arquivei (Qive):**
1. Vá para Integrações → Arquivei
2. Preencha: App ID e API Key do Arquivei
3. Clique em "Salvar"
4. Digite a chave de acesso (44 dígitos) da NF
5. Clique em "Buscar"
6. O sistema retorna: Número, série, valor da NF, emitente, botão para Baixar XML, botão para Baixar DANFE (PDF)

**Winthor:**
1. Vá para Integrações → Winthor
2. Configure o servidor Oracle: Host, Porta, Usuário, Senha, SID
3. Clique em "Conectar"
4. Selecione a rotina desejada (65 rotinas disponíveis)
5. Clique em "Executar"

O Rotiq tem 65 rotinas reais do Winthor organizadas em 6 módulos:
- Veículos/Motoristas (521, 929, 965, 969, 970, 971)
- Carregamento (901–996, 20 rotinas)
- Acerto/Motorista (407–422, 10 rotinas)
- Expedição (931–959, 6 rotinas)
- Rota/Frete (911–1474, 19 rotinas)
- Vendas (316, 317, 1425, 1428)
    `,
  },
  {
    id: "relatorios",
    titulo: "Relatórios",
    descricao: "Análises e KPIs gerenciais",
    conteudo: `
**Relatórios Avançados:**
Vá para Sistema → Relatórios Avançados

4 abas com KPIs gerenciais:

**Operacional:**
- Viagens Realizadas: Total, completas, com atraso
- KM Total Rodado: Quilometragem total e média
- Combustível Gasto: Litros e custo
- Taxa de Atraso: Percentual de viagens atrasadas
- Desempenho por Motorista: Top 5 motoristas

**Financeiro:**
- Receita Total: Faturamento do período
- Despesas Totais: Custos operacionais
- Lucro Líquido: Lucro e margem
- Contas Vencidas: Alertas de atraso
- Fluxo de Caixa: Receitas vs Despesas por semana

**RH:**
- Motoristas Ativos: Total e afastados
- Custo RH: Folha de pagamento
- Rotatividade: Percentual de saída
- Idade Média: Experiência média
- Distribuição por Experiência: Gráfico de experiência

**Risco:**
- Acidentes: Número de acidentes
- Multas de Trânsito: Infrações registradas
- Manutenções Pendentes: Veículos aguardando
- Documentos Vencendo: Próximos 30 dias
- Alertas de Segurança: Lista de situações críticas

**Filtro por Período:**
Escolha: Última Semana, Último Mês, Último Trimestre, Último Ano
    `,
  },
  {
    id: "administração",
    titulo: "Administração",
    descricao: "Gestão de usuários e empresas",
    conteudo: `
**Painel Master (Apenas Master Admin):**

Aba Usuários:
- Listar Usuários: Veja todos os usuários
- Aprovar Usuário: Clique em "Aprovar" para liberar acesso
- Rejeitar Usuário: Clique em "Rejeitar" para negar acesso
- Mudar Papel: Altere o papel (Admin, Monitor, etc.)
- Mudar Empresa: Vincule o usuário a uma empresa
- Desativar Usuário: Clique em "Desativar" para bloquear

Aba Empresas:
- Listar Empresas: Veja todas as empresas
- Criar Empresa: Clique em "+ Nova Empresa"
- Editar Empresa: Clique em "Editar" para alterar dados
- Tipo de Empresa: Independente, Matriz ou Filial
- Vincular Filial: Selecione a matriz para vincular como filial
- Ver como Admin: Simule a visão de um admin da empresa

Aba Permissões:
- Admin: Acesso total à empresa
- Monitor: Apenas consulta (sem edição)
- Despachante: Operacional (viagens, carregamento)
- Usuário: Acesso limitado

**Convidar Usuário:**
1. Vá para Administração → Usuários
2. Clique em "+ Convidar Usuário"
3. Preencha: Email e Papel
4. Clique em "Enviar Convite"
O usuário receberá um email com link para criar conta.
    `,
  },
  {
    id: "faq",
    titulo: "FAQ",
    descricao: "Perguntas frequentes",
    conteudo: `
**P: Como recuperar uma viagem deletada?**
R: Viagens deletadas não podem ser recuperadas. Sempre faça backup de dados importantes.

**P: Posso usar o Rotiq offline?**
R: Não. O Rotiq é um sistema web que requer conexão com a internet.

**P: Como exportar todos os dados?**
R: Vá para Sistema → Importar/Exportar e clique em "Exportar" em cada módulo.

**P: Qual é o limite de usuários?**
R: Não há limite. Você pode criar quantos usuários precisar.

**P: Como mudar a empresa de um usuário?**
R: Vá para Administração → Painel Master → Usuários, clique no usuário e selecione a nova empresa.

**P: O sistema faz backup automático?**
R: Sim. O Rotiq faz backup automático diariamente.

**P: Como integrar com meu sistema atual?**
R: O Rotiq oferece API REST. Entre em contato com o suporte para documentação técnica.

**P: Posso usar o Rotiq em mobile?**
R: Sim. O Rotiq é responsivo e funciona em smartphones e tablets.

**P: Como resetar minha senha?**
R: Na tela de login, clique em "Esqueceu a senha?" e siga as instruções.

**P: Onde posso ver meu histórico de ações?**
R: Cada módulo mantém um histórico. Clique em "Histórico" ou "Log" para ver as ações realizadas.
    `,
  },
];

export default function Ajuda() {
  const { t } = useTranslation();
  const [secaoAtiva, setSecaoAtiva] = useState("introducao");
  const [busca, setBusca] = useState("");
  const [copiado, setCopiado] = useState(false);

  const secaosFiltradas = SECOES.filter(
    (s) =>
      s.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      s.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      s.conteudo.toLowerCase().includes(busca.toLowerCase()),
  );

  const secaoAtualizada = SECOES.find((s) => s.id === secaoAtiva);

  const handleDownloadPDF = () => {
    const link = document.createElement("a");
    link.href = "/MANUAL_ROTIQ_COMPLETO.pdf";
    link.download = "MANUAL_ROTIQ_COMPLETO.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopiarEmail = () => {
    navigator.clipboard.writeText("suporte@rotiq.com.br");
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HelpCircle className="w-8 h-8" />
            Ajuda e Documentação
          </h1>
          <p className="text-muted-foreground mt-2">
            Guia completo do Rotiq com instruções passo a passo
          </p>
        </div>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Baixar Manual PDF
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar na documentação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com Seções */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-lg">Seções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {secaosFiltradas.map((secao) => (
                <button
                  key={secao.id}
                  onClick={() => setSecaoAtiva(secao.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    secaoAtiva === secao.id
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "hover:bg-muted text-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{secao.titulo}</span>
                    {secaoAtiva === secao.id && <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
          {secaoAtualizada && (
            <Card>
              <CardHeader>
                <CardTitle>{secaoAtualizada.titulo}</CardTitle>
                <CardDescription>{secaoAtualizada.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                  {secaoAtualizada.conteudo.split("\n").map((linha, idx) => {
                    if (linha.startsWith("**") && linha.endsWith(":**")) {
                      return (
                        <p key={idx} className="font-semibold text-base mt-4 mb-2">
                          {linha.replace(/\*\*/g, "")}
                        </p>
                      );
                    }
                    if (linha.startsWith("- ")) {
                      return (
                        <p key={idx} className="ml-4 my-1">
                          • {linha.substring(2)}
                        </p>
                      );
                    }
                    if (linha.trim() === "") {
                      return <div key={idx} className="h-2" />;
                    }
                    return (
                      <p key={idx} className="my-2">
                        {linha}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Suporte */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Ainda tem dúvidas?
          </CardTitle>
          <CardDescription>Entre em contato com nosso suporte</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Email</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                suporte@rotiq.com.br
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopiarEmail}
                className="h-8 w-8 p-0"
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Chat</p>
            <p className="text-xs text-muted-foreground">Disponível no menu (ícone de chat)</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Documentação</p>
            <a
              href="https://docs.rotiq.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              docs.rotiq.com.br
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
