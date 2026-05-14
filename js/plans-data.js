/* =========================================================
   AURA — Dados centralizados dos planos.
   Single source of truth pro app, planos.html e index.html.

   13/05/2026 (revisão): 5 planos -> 3 planos. As verticais
   (Odonto, Beauty, Food, Pet) viram modulo adicional de R$ 39
   disponivel em Negocio e Expansao, indicado pelas 4 bolinhas
   coloridas no card. Lista de features proporcional:
     Essencial (16) < Negocio (22) < Expansao (25)
   ========================================================= */
window.AURA_PLANS = {
  essencial: {
    label: 'Essencial',
    name: 'Pra começar',
    price: 89, priceCents: null,
    tagline: 'Pra quem está começando o negócio.',
    features: [
      'PDV completo no celular, tablet ou computador',
      'Cupom fiscal NFC-e direto do caixa',
      'Recebimento por Pix com QR Code',
      'Estoque com código de barras e leitor',
      'Variantes de produto (cor, tamanho, sabor, voltagem)',
      'Importação em massa via planilha CSV (até 1.000)',
      'NF-e e NFC-e (até 50 emissões/mês)',
      'Cadastro de clientes (até 1.000)',
      'Cadastro de equipe (até 3 vendedores)',
      'Contas a pagar e a receber',
      'Conciliação bancária via OFX',
      'DRE básica e categorização automática',
      'Apoio contábil guiado (MEI e Simples Nacional)',
      'Cálculo de DAS-MEI e guias fiscais',
      '1 acesso de usuário',
      'Suporte via chat com Analista de Negócios',
    ],
  },
  negocio: {
    label: 'Negócio',
    name: 'Operação completa',
    price: 169, priceCents: 90,
    tagline: 'Pra quem quer crescer sem improviso.',
    featured: true,
    badge: 'Mais escolhido',
    hasVerticalAddon: true,
    features: [
      'Tudo do Essencial, e mais:',
      'Cadastro de clientes (até 5.000)',
      'Cadastro de equipe (até 50 funcionários)',
      'NF-e e NFC-e ilimitadas',
      'NFS-e (serviços) ilimitada',
      'CRM com ranking de clientes por LTV',
      'Retenção: clientes em risco e perdidos',
      'Aniversariantes com cupom automático',
      'Avaliações de clientes pós-venda',
      'Crediário (fiado) por cliente com saldo',
      'Folha de pagamento (INSS, IRRF, FGTS)',
      'Holerite individual enviado por e-mail',
      'Ranking de vendas por vendedor',
      'Comissões automáticas sobre venda',
      'Agenda online para serviços',
      'Canal Digital: loja online inclusa',
      'Domínio personalizado .com.br opcional',
      'WhatsApp Business com templates',
      'Até 3 usuários com login e permissões',
      'Fluxo de caixa projetado',
      'Categorização de despesas por IA',
      'Suporte prioritário com Analista de Negócios',
    ],
  },
  expansao: {
    label: 'Expansão',
    name: 'Pra escalar com IA',
    price: 269, priceCents: 90,
    tagline: 'Multi-CNPJ, IA prescritiva, integrações ilimitadas.',
    hasVerticalAddon: true,
    features: [
      'Tudo do Negócio, e mais:',
      'Clientes ilimitados',
      'Funcionários ilimitados',
      'Usuários com login ilimitados',
      'Multi-CNPJ: gerencie vários negócios em um login',
      'Visão consolidada de todas as suas empresas',
      'Lista única de clientes entre os CNPJs',
      '5 agentes de IA (vendas, estoque, fiscal, marketing, financeiro)',
      'Insights prescritivos por IA',
      'Smart alerts (anomalias de despesa)',
      'Projeção de fluxo de caixa com cenários',
      'DRE Simples pronta para o contador',
      'Metas de vendas por vendedor com acompanhamento',
      'Reativação automática de clientes inativos',
      'Margem por produto e ranking de lucratividade',
      'Análise de cohorts e LTV avançado',
      'Relatórios customizados (BI)',
      'Gateway personalizado (use sua própria maquininha)',
      'Multi-gateway (Asaas, Stone, Cielo, etc.)',
      'API completa para integrações',
      'HUB Social: Instagram + WhatsApp em automação',
      'Webhooks para automações próprias',
      'Customer Success dedicado',
      'Onboarding personalizado com a equipe',
      'SLA de suporte de 4h úteis',
    ],
  },
};

window.AURA_ADDONS = [
  { name: 'Módulo vertical', price: 'R$ 39/mês', desc: 'Camada especialista do seu setor: Odonto, Beauty, Food ou Pet. Disponível a partir do Negócio.', dots: true },
  { name: 'Usuário adicional', price: 'R$ 19/mês', desc: 'Para cada pessoa a mais com login no app, por mês.' },
  { name: 'Consultoria sob medida', price: 'Sob consulta', desc: 'Configuração, treinamento, automações e integrações personalizadas pro seu negócio.', cta: true },
];
