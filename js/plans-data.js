/* =========================================================
   AURA — Dados centralizados dos planos.
   Single source of truth pro app, planos.html e index.html.
   Sincronizado com aura-app/app/(tabs)/planos.tsx (PLAN-EXPAND 12/05).
   ========================================================= */
window.AURA_PLANS = {
  essencial: {
    label: 'Essencial',
    name: 'Pra começar',
    price: 89, priceCents: null,
    tagline: 'Pra quem está começando o negócio.',
    features: [
      // Vendas
      'PDV completo no celular, tablet ou computador',
      'Cupom fiscal NFC-e direto do caixa',
      'Troca de produtos e cancelamento de venda',
      'Descontos por cupom no momento da venda',
      // Estoque
      'Estoque com código de barras e leitor',
      'Variantes de produto (cor, tamanho, sabor, voltagem)',
      'Importação em massa via planilha CSV (até 1.000)',
      'Etiquetas com código de barras para impressão',
      // Fiscal
      'NF-e e NFC-e (até 50 emissões/mês)',
      'Importação de NF-e via XML do fornecedor',
      // Clientes
      'Cadastro de clientes (até 1.000)',
      'Histórico de compras por cliente',
      // Equipe
      'Cadastro de equipe (até 3 vendedores)',
      'Atribuição de venda por vendedor no caixa',
      // Financeiro
      'Contas a pagar e a receber',
      'Conciliação bancária via OFX',
      'DRE básica e categorização automática',
      'Lançamentos recorrentes',
      'Recebimento por Pix com QR Code',
      // Contábil
      'Apoio contábil guiado (MEI e Simples Nacional)',
      'Cálculo de DAS-MEI e guias fiscais',
      // Suporte
      '1 acesso de usuário',
      'Suporte via chat com Analista de Negócios',
    ],
  },
  negocio: {
    label: 'Negócio',
    name: 'Operação completa',
    price: 169, priceCents: 90,
    tagline: 'Pra quem quer crescer sem improviso.',
    features: [
      'Tudo do Essencial, e mais:',
      // Clientes avançado
      'Cadastro de clientes (até 5.000)',
      'CRM com ranking de clientes por LTV',
      'Retenção: clientes em risco e perdidos',
      'Aniversariantes com cupom automático',
      'Avaliações de clientes pós-venda',
      'Crediário (fiado) por cliente com saldo',
      // Equipe e folha
      'Cadastro de equipe (até 50 funcionários)',
      'Folha de pagamento (INSS, IRRF, FGTS)',
      'Holerite individual enviado por e-mail',
      'Ranking de vendas por vendedor',
      'Comissões automáticas sobre venda',
      // Fiscal
      'NF-e e NFC-e ilimitadas',
      'NFS-e (serviços) ilimitada',
      // Operação
      'Agenda online para serviços',
      'Estoque com baixa automática via PDV',
      // Canais digitais
      'Canal Digital: loja online inclusa',
      'Domínio personalizado .com.br opcional',
      'WhatsApp Business com templates',
      // Acessos
      'Até 3 usuários com login e permissões próprias',
      // Financeiro avançado
      'Fluxo de caixa projetado',
      'Categorização de despesas por IA',
      // Suporte
      'Suporte prioritário com Analista de Negócios',
    ],
  },
  negocioVertical: {
    label: 'Negócio · Vertical',
    name: 'Com camada do seu setor',
    price: 169, priceCents: 90,
    featured: true,
    badge: 'Mais escolhido',
    tagline: 'Tudo do Negócio + camada especialista (Odonto, Beauty, Food ou Pet).',
    features: [
      'Tudo do Negócio, e mais:',
      'Camada vertical especialista do seu setor',
      'Telas, fluxos e relatórios do nicho',
      'Tom de voz e identidade próprios',
      'IA com contexto do seu setor (Negócio+)',
      'Vocabulário do setor (consulta, comanda, banho/tosa, etc.)',
      'KPIs específicos do nicho',
    ],
  },
  expansao: {
    label: 'Expansão',
    name: 'Pra escalar com IA',
    price: 269, priceCents: 90,
    tagline: 'Multi-CNPJ, IA prescritiva, integrações ilimitadas.',
    features: [
      'Tudo do Negócio, e mais:',
      // Sem limites
      'Clientes e funcionários ilimitados',
      'Usuários com login ilimitados',
      // Multi-CNPJ
      'Multi-CNPJ: gerencie vários negócios em um login',
      'Visão consolidada de todas as suas empresas',
      'Lista única de clientes entre os CNPJs',
      // IA premium
      '5 agentes de IA: vendas, estoque, fiscal, marketing, financeiro',
      'Insights prescritivos por IA',
      'Smart alerts (anomalias de despesa)',
      // Financeiro premium
      'Projeção de fluxo de caixa com cenários',
      'DRE Simples pronta para o contador',
      'Metas de vendas por vendedor com acompanhamento',
      'Reativação automática de clientes inativos',
      'Margem por produto e ranking de lucratividade',
      // Pagamentos
      'Gateway personalizado (use sua própria maquininha)',
      'Multi-gateway (Asaas, Stone, Cielo, etc.)',
      // Integrações
      'API completa para integrações',
      'HUB Social: Instagram + WhatsApp em automação',
      // Atendimento premium
      'Customer Success dedicado',
      'Onboarding personalizado com a equipe',
    ],
  },
  expansaoVertical: {
    label: 'Expansão · Vertical',
    name: 'O máximo + camada vertical',
    price: 269, priceCents: 90,
    tagline: 'Tudo do Expansão + camada vertical completa do seu setor.',
    features: [
      'Tudo do Expansão, e mais:',
      'Camada vertical completa',
      'Multi-CNPJ com fluxos verticais',
      'BI e dashboards específicos do setor',
      'IA com contexto profundo do nicho',
      'Treinamento dedicado pela equipe Aura',
      'Customer Success próprio da vertical',
    ],
  },
};

window.AURA_ADDONS = [
  { name: 'Usuário adicional', price: 'R$ 19/mês', desc: 'Para cada pessoa a mais com login no app, por mês.' },
  { name: 'Módulo vertical extra', price: 'R$ 39/mês', desc: 'A partir do Negócio. Adicione um setor especializado além do incluso no seu plano.' },
  { name: 'Consultoria sob medida', price: 'Sob consulta', desc: 'Configuração, treinamento, automações e integrações personalizadas pro seu negócio.', cta: true },
];
