# Rotiq — Sistema ERP de Frota

## Infraestrutura
- [x] Schema do banco com 15 tabelas (soft delete em todas)
- [x] Log de auditoria (audit_log)
- [x] Multi-tenant (empresas)
- [x] Roles: user, admin, master_admin, monitor, dispatcher
- [ ] Corrigir adminProcedure para aceitar master_admin e monitor
- [ ] Router de auditoria (listar logs, restaurar registros)
- [ ] Router de viagens completo
- [ ] Router de checklist completo
- [ ] Router de adiantamentos completo
- [ ] Router de tanque de combustível

## Frontend — Páginas
- [x] Home (landing page com login)
- [x] Dashboard (KPIs básicos)
- [x] Veículos (com separação cavalo/carreta)
- [x] Funcionários (CLT + freelancer + motorista + ajudante)
- [x] Abastecimentos
- [x] Manutenções
- [x] Financeiro (contas a pagar)
- [ ] Dashboard elevado (gráficos, consumo mensal, despesas por categoria)
- [ ] Financeiro — Contas a Receber
- [ ] Financeiro — Adiantamentos (dinheiro para motorista viajar)
- [ ] Viagens (despacho com motorista + múltiplos ajudantes + cavalo/carreta)
- [ ] Checklist Digital (35 itens, conforme/não conforme/NA)
- [ ] Tanque de Combustível (controle de estoque interno)
- [ ] Auditoria (log de ações, lixeira, restauração)
- [ ] Empresa (cadastro, configurações)
- [ ] Acidentes

## Importação de Dados
- [ ] Importar veículos das planilhas Excel
- [ ] Importar motoristas das planilhas Excel
- [ ] Importar abastecimentos (2.043 registros)
- [ ] Importar manutenções (1.470 registros)
- [ ] Importar controle de tanque
- [ ] Criar empresa BSB no banco

## Melhorias Futuras
- [ ] Multilíngua (PT, EN, ES)
- [ ] Integração Winthor (cargas, rotas, peso)
- [ ] Login por e-mail (quando 4 empresas estiverem rodando)
- [ ] Módulo de CTEs (Conhecimento de Transporte Eletrônico)
- [ ] Módulo de Empilhadeiras (gás, manutenção)
- [ ] Checklist independente para carreta acoplada

## Validação e Erros
- [ ] Helper centralizado de tratamento de erros (mapear erros MySQL para mensagens amigáveis)
- [ ] Validação mínima em todos os routers (só campos essenciais obrigatórios)
- [ ] Mensagens de erro amigáveis no frontend (sem mensagens técnicas de banco)
- [ ] Log de erros internos para diagnóstico sem expor ao usuário

## Calculadora de Viagem
- [ ] Endpoint tRPC calcularCustoViagem (recebe veículo, distância, frete, ajudantes)
- [ ] Cálculo automático: combustível estimado (km / média consumo × preço diesel)
- [ ] Cálculo de diárias de motorista e ajudantes (valor × dias estimados)
- [ ] Cálculo de pedágios estimados (por rota)
- [ ] Margem de lucro: frete total - (combustível + diárias + pedágio + outros)
- [ ] Indicador visual: verde (lucrativo) / amarelo (margem baixa) / vermelho (prejuízo)
- [ ] Integrado na página de Viagens (antes de despachar)
- [ ] Card resumo no Dashboard Financeiro
- [ ] Histórico de precisão: comparar estimado vs real após conclusão da viagem

## Financeiro — Custo Total Real por Veículo
- [ ] Custo por km: (combustível + manutenções + pneus + seguro + IPVA) ÷ km rodado
- [ ] Manutenção preventiva por km: alertas quando veículo se aproximar do km programado
- [ ] Custo de manutenção rateado por viagem (custo médio manutenção ÷ km entre manutenções)
- [ ] Custo de pneus por km (valor pneu ÷ vida útil estimada em km)
- [ ] Custo fixo mensal por veículo (seguro, IPVA, licenciamento ÷ 12)
- [ ] Calculadora de viagem usa custo total real (não só combustível)
- [ ] Dashboard financeiro: gráfico de custo por km por veículo (comparativo)
- [ ] Alerta: veículo com custo por km acima da média da frota
- [ ] Relatório mensal: receita de fretes vs custo total operacional por veículo

## Bugs reportados (20/03/2026)
- [x] 404 em /empresa — rota não registrada no App.tsx
- [x] 404 em /financeiro/adiantamentos — rota não registrada
- [x] 404 em /checklist — rota não registrada
- [x] Criar página Empresa (configurações da empresa)
- [x] Criar página Adiantamentos completa
- [x] Criar página Checklist digital (35 itens)
- [x] Criar página Gerenciamento de Usuários (permissões por empresa)
- [x] Custos Operacionais — item de menu não clicável (falta rota e página)
- [x] Filtros em Abastecimentos: por data (período), veículo, motorista, tipo (diesel/arla/gasolina)
- [x] Filtros em Manutenções: por data, veículo, empresa/oficina, tipo de serviço
- [ ] Filtros em Viagens: por data, motorista, veículo, destino, status
- [ ] Filtros em Financeiro (Contas): por data, status (pago/pendente), categoria
- [x] Criar página Custos Operacionais com gráficos e filtros por veículo/período
- [x] Painel do Despachante — tela dedicada para registrar saída/chegada, motorista, ajudantes, KM
- [x] Página Custos Operacionais (/custos) — criar página e rota
- [x] Filtros em Manutenções — adicionar painel de filtros na tela
- [ ] Contas a Receber — página separada da Contas a Pagar
- [x] Gerenciamento de Usuários — dar/revogar acesso por nível de permissão
- [x] Seletor de tema: claro, escuro e cinza (salvo por usuário, persiste entre sessões)
- [x] Responsividade completa: mobile, tablet e desktop em todas as páginas
- [ ] Bug: ícone duplo/sobreposto no item Despachante do menu
- [ ] Bug: menu lateral desorganizado — seções e itens fora de ordem
- [ ] Bug: Despachante não abre ao clicar
- [ ] Bug: Despachante — erro "Select.Item must have a non-empty value" ao abrir a página

## Funcionalidades do Sistema Antigo (FrotaSegura) a Implementar

- [ ] Reorganizar menu: seções DESPACHANTE, OPERACIONAL, FROTA, GESTÃO, SISTEMA, MASTER
- [ ] Criar página Saída de Entrega (/despachante/entrega) - entrega local, sai e volta no mesmo dia
- [ ] Criar página Saída de Viagem (/despachante/viagem) - viagens longas
- [ ] Criar página Retorno de Veículo (/despachante/retorno) com checklist de inspeção
- [ ] Criar página Plano de Manutenção (/plano-manutencao)
- [ ] Criar página Estoque de Combustível (/gestao/estoque-combustivel)
- [ ] Criar página Multas (/gestao/multas)
- [ ] Criar página Acidentes (/gestao/acidentes)
- [ ] Criar página Acertos (/gestao/acertos)
- [ ] Criar página Relatos (/gestao/relatos)
- [ ] Criar página Documentos (/gestao/documentos)
- [ ] Criar página Alertas (/gestao/alertas)
- [ ] Criar página Calendário (/gestao/calendario)
- [ ] Criar página Relatórios com abas Viagens/Abastecimentos/Manutenções (/relatorios)
- [ ] Adicionar campo ARLA (litros) no formulário de Abastecimento
