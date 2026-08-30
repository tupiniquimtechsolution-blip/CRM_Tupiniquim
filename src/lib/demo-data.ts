export const demoCompanies = [
  { id: "c1", name: "Aurora Alimentos", segment: "Indústria", lifecycle: "Oportunidade", owner: "Marina Lima", contacts: 4 },
  { id: "c2", name: "Clínica Horizonte", segment: "Saúde", lifecycle: "Lead", owner: "Rafael Dias", contacts: 2 },
  { id: "c3", name: "Vértice Engenharia", segment: "Construção", lifecycle: "Cliente", owner: "Marina Lima", contacts: 6 },
  { id: "c4", name: "Escola Raízes", segment: "Educação", lifecycle: "Prospect", owner: "Caio Nunes", contacts: 3 },
  { id: "c5", name: "Mercado Bom Vizinho", segment: "Varejo", lifecycle: "Cliente", owner: "Rafael Dias", contacts: 2 },
];

export const demoLeads = [
  { id: "l1", company: "Aurora Alimentos", title: "Automação do comercial", source: "Indicação", status: "Qualificado", score: 86, owner: "Marina" },
  { id: "l2", company: "Clínica Horizonte", title: "Site + captação", source: "Landing page", status: "Validado", score: 72, owner: "Rafael" },
  { id: "l3", company: "Escola Raízes", title: "CRM para matrículas", source: "Prospecção", status: "Novo", score: 61, owner: "Caio" },
  { id: "l4", company: "LogSul Transportes", title: "Integração operacional", source: "Evento", status: "Pendente", score: 48, owner: "Marina" },
];

export const demoStages = [
  {
    id: "s1",
    name: "Qualificação",
    color: "#60a5fa",
    opportunities: [
      { id: "o1", title: "CRM para matrículas", company: "Escola Raízes", value: 18900, owner: "Caio", due: "16 ago" },
      { id: "o2", title: "Portal B2B", company: "Norte Distribuidora", value: 32000, owner: "Marina", due: "19 ago" },
    ],
  },
  {
    id: "s2",
    name: "Diagnóstico",
    color: "#a78bfa",
    opportunities: [
      { id: "o3", title: "Automação comercial", company: "Aurora Alimentos", value: 48000, owner: "Marina", due: "14 ago" },
    ],
  },
  {
    id: "s3",
    name: "Proposta",
    color: "#f59e0b",
    opportunities: [
      { id: "o4", title: "Site + captação", company: "Clínica Horizonte", value: 24500, owner: "Rafael", due: "12 ago" },
      { id: "o5", title: "Analytics executivo", company: "Grupo Serra", value: 36000, owner: "Caio", due: "22 ago" },
    ],
  },
  {
    id: "s4",
    name: "Negociação",
    color: "#22c55e",
    opportunities: [
      { id: "o6", title: "Aplicativo de vendas", company: "Mercado Bom Vizinho", value: 62500, owner: "Rafael", due: "15 ago" },
    ],
  },
];

export const demoActivities = [
  { id: "a1", title: "Revisar proposta da Clínica Horizonte", type: "Proposta", due: "Hoje, 11:30", owner: "Rafael", status: "Vencendo", company: "Clínica Horizonte" },
  { id: "a2", title: "Ligação de diagnóstico", type: "Ligação", due: "Hoje, 14:00", owner: "Marina", status: "Aberta", company: "Aurora Alimentos" },
  { id: "a3", title: "Follow-up do portal B2B", type: "Follow-up", due: "Amanhã, 09:00", owner: "Marina", status: "Aberta", company: "Norte Distribuidora" },
  { id: "a4", title: "Reunião de kick-off", type: "Reunião", due: "13 ago, 15:00", owner: "Caio", status: "Aberta", company: "Vértice Engenharia" },
];

export const demoProposals = [
  { id: "p1", number: "#0018", title: "Automação comercial", company: "Aurora Alimentos", total: 48000, status: "Em aprovação", validUntil: "18 ago" },
  { id: "p2", number: "#0017", title: "Site + captação", company: "Clínica Horizonte", total: 24500, status: "Enviada", validUntil: "15 ago" },
  { id: "p3", number: "#0016", title: "Aplicativo de vendas", company: "Mercado Bom Vizinho", total: 62500, status: "Aceita", validUntil: "10 ago" },
  { id: "p4", number: "#0015", title: "CRM para matrículas", company: "Escola Raízes", total: 18900, status: "Rascunho", validUntil: "25 ago" },
];

export const demoRevenues = [
  { id: "r1", company: "Vértice Engenharia", type: "MRR", description: "Suporte e evolução", amount: 4200, status: "Ativa" },
  { id: "r2", company: "Mercado Bom Vizinho", type: "Projeto", description: "Aplicativo de vendas", amount: 62500, status: "Ativa" },
  { id: "r3", company: "Aurora Alimentos", type: "Upsell", description: "Módulo de automação", amount: 12000, status: "Forecast" },
  { id: "r4", company: "Grupo Serra", type: "MRR", description: "Analytics executivo", amount: 6800, status: "Forecast" },
];

export const demoCustomers = [
  {
    id: "c3",
    name: "Vértice Engenharia",
    segment: "Construção",
    owner: "Marina Lima",
    health: { score: 92, band: "Saudável", risks: [] as string[] },
    mrr: 4200,
    projectRevenue: 48000,
    journey: { leads: 1, opportunities: 2, proposals: 2, contracts: 1, activities: 8 },
    onboarding: {
      id: "onb-1", name: "Implantação CRM", status: "Em andamento", progress: 80,
      steps: [
        { id: "step-1", title: "Kick-off", status: "Concluída" },
        { id: "step-2", title: "Configuração", status: "Concluída" },
        { id: "step-3", title: "Treinamento", status: "Concluída" },
        { id: "step-4", title: "Go-live", status: "Em andamento" },
      ],
    },
    tickets: [{ id: "tk-1", number: "#0012", subject: "Ajuste no painel comercial", status: "Em andamento", priority: "Média", sla: "Hoje, 17:00", overdue: false }],
    renewals: [{ id: "ren-1", title: "Renovação suporte anual", status: "Em negociação", amount: 50400, date: "30 set 2026", days: 49 }],
    upsells: [{ id: "up-1", title: "Automação de propostas", status: "Qualificado", value: 12500, date: "15 set 2026" }],
  },
  {
    id: "c5",
    name: "Mercado Bom Vizinho",
    segment: "Varejo",
    owner: "Rafael Dias",
    health: { score: 54, band: "Em risco", risks: ["Cliente sem interação recente", "Ticket com SLA vencido"] },
    mrr: 6800,
    projectRevenue: 62500,
    journey: { leads: 2, opportunities: 3, proposals: 2, contracts: 1, activities: 5 },
    onboarding: {
      id: "onb-2", name: "Aplicativo de vendas", status: "Bloqueado", progress: 50,
      steps: [
        { id: "step-5", title: "Kick-off", status: "Concluída" },
        { id: "step-6", title: "Integração de produtos", status: "Bloqueada" },
      ],
    },
    tickets: [
      { id: "tk-2", number: "#0011", subject: "Sincronização de estoque", status: "Aberto", priority: "Urgente", sla: "Vencido há 3h", overdue: true },
      { id: "tk-3", number: "#0008", subject: "Dúvida sobre relatórios", status: "Aguardando cliente", priority: "Baixa", sla: "Amanhã, 12:00", overdue: false },
    ],
    renewals: [{ id: "ren-2", title: "Renovação plataforma", status: "Próxima", amount: 81600, date: "20 ago 2026", days: 8 }],
    upsells: [{ id: "up-2", title: "Módulo de fidelidade", status: "Identificado", value: 18900, date: "Sem previsão" }],
  },
];
