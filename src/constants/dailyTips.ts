/**
 * Dica do dia do card "Bom dia" (Home) — muda uma vez por dia, na mesma
 * ordem pra todo mundo. Orientação geral de hábito, sem recomendação de
 * remédio ou dose: isso é com o médico/farmacêutico.
 */
export const DAILY_TIPS: string[] = [
  "Beba um copo de água logo ao acordar — o corpo passa a noite sem hidratação.",
  "Tome o remédio sempre no mesmo horário: fica mais fácil não esquecer e o efeito é mais estável.",
  "Uma caminhada de 30 minutos por dia já faz diferença na pressão e no humor.",
  "Guarde os remédios longe do calor e da umidade — o banheiro não é o melhor lugar.",
  "Prefira temperos naturais (alho, cebola, ervas) e use menos sal na comida.",
  "Durma de 7 a 8 horas: o sono regula a pressão, o açúcar no sangue e a memória.",
  "Faça pausas a cada hora sentado: levante, alongue e caminhe um pouco.",
  "Coma uma fruta no lanche no lugar do doce ou do biscoito.",
  "Esqueceu uma dose? Não tome dose dobrada sem orientar-se com o farmacêutico.",
  "Meça a pressão sempre no mesmo braço e sentado, depois de 5 minutos de descanso.",
  "Leve a lista dos seus remédios em toda consulta — inclusive vitaminas e chás.",
  "Mastigue devagar: comer com calma ajuda a digestão e a saciedade.",
  "Proteja a pele do sol entre 10h e 16h, mesmo em dia nublado.",
  "Confira a validade dos remédios de casa uma vez por mês.",
  "Respire fundo por 1 minuto quando sentir estresse: inspire em 4, solte em 6.",
  "Inclua verduras em pelo menos uma refeição do dia.",
  "Antibiótico se toma até o fim, mesmo que os sintomas melhorem antes.",
  "Lave as mãos antes de comer e ao chegar em casa — é a vacina mais simples.",
  "Reduza refrigerantes e sucos de caixinha: têm muito açúcar escondido.",
  "Uma conversa com alguém querido também é cuidado com a saúde.",
  "Prefira a escada ao elevador quando der: é exercício de graça.",
  "Faça o check-up anual mesmo se estiver se sentindo bem.",
  "Evite telas na última hora antes de dormir — a luz atrapalha o sono.",
  "Mantenha a carteira de vacinação em dia; adulto também toma vacina.",
  "Beba água ao longo do dia, não só quando sentir sede.",
  "Alongue-se ao acordar: 5 minutos já soltam o corpo.",
  "Remédio de uso contínuo não se para por conta própria — fale com o médico antes.",
  "Leia o rótulo dos alimentos: sódio e açúcar aparecem com outros nomes.",
  "Um dia de cada vez: o que importa é a constância, não a perfeição.",
  "Tire um tempo pra você hoje — ler, orar, ouvir música ou só descansar.",
];

/** Dica de hoje: mesma o dia inteiro, troca à meia-noite do celular. */
export function tipOfTheDay(now: Date = new Date()): string {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}
