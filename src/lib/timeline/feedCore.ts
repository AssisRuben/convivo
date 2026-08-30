import { prisma } from "@/lib/prisma";
import { formatDateLabel, todayDateString } from "@/lib/timeline/format";
import { getExtraInfo } from "@/lib/timeline/extraInfo";
import { getReactionStates } from "@/lib/timeline/reactions";
import {
  fetchCoverImage,
  fetchDiverseCoverImages,
  fetchFinanceSnippet,
  fetchFunQuote,
  fetchNews,
  fetchNinjaFacts,
} from "@/lib/timeline/externalContent";
import type { TimelineFeedItem } from "@/lib/timeline/types";

/**
 * Lógica de feed usada pelas rotas mobile (`app/api/mobile/feed/**`,
 * `app/api/mobile/minhas-postagens`) — cada rota só resolve o `userId`
 * (JWT Bearer) e delega pra cá.
 */

const CONTENT_PREFIXES = ["fact-", "finance-", "quote-", "news-"];
const NEWS_TEASER_LENGTH = 140;

// Títulos variados pros posts de curiosidade — evita repetir "Curiosidade
// do dia" em todo card do feed, que fica repetitivo num scroll infinito.
const FACT_TITLES = [
  "Curiosidade do dia",
  "Você sabia?",
  "Fato curioso",
  "Sabia que...",
  "Pra deixar seu dia mais interessante",
];

/**
 * Cards de conteúdo do dia não têm linha no banco — sempre pessoal, sem
 * checagem adicional. Conquistas só podem ser curtidas/comentadas pelo
 * próprio dono OU, depois de compartilhadas, por qualquer usuário logado.
 */
export async function assertCanInteract(userId: string, itemKey: string): Promise<void> {
  if (CONTENT_PREFIXES.some((prefix) => itemKey.startsWith(prefix))) return;

  const event = await prisma.timelineEvent.findUnique({ where: { id: itemKey } });
  if (!event) return;
  if (event.userId === userId) return;
  if (!event.sharedAt) {
    throw new Error("Essa conquista ainda não foi compartilhada");
  }
}

export async function toggleLikeForUser(userId: string, itemKey: string): Promise<boolean> {
  await assertCanInteract(userId, itemKey);

  const existing = await prisma.timelineReaction.findUnique({
    where: { userId_itemKey: { userId, itemKey } },
  });

  if (existing) {
    await prisma.timelineReaction.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.timelineReaction.create({ data: { userId, itemKey } });
  return true;
}

/**
 * Torna uma conquista pública — consentimento explícito do dono, exigido
 * pela LGPD já que é dado de saúde. Sem uma rota de feed público ativa no
 * momento (removida em favor de "Minhas postagens"), isso só marca
 * `sharedAt`; mantido pra quando um feed público voltar a existir.
 */
export async function shareAchievementForUser(userId: string, eventId: string): Promise<void> {
  const event = await prisma.timelineEvent.findUnique({ where: { id: eventId } });
  if (!event || event.userId !== userId) {
    throw new Error("Sem permissão pra compartilhar essa conquista");
  }
  await prisma.timelineEvent.update({ where: { id: eventId }, data: { sharedAt: new Date() } });
}

export async function unshareAchievementForUser(userId: string, eventId: string): Promise<void> {
  const event = await prisma.timelineEvent.findUnique({ where: { id: eventId } });
  if (!event || event.userId !== userId) {
    throw new Error("Sem permissão pra alterar essa conquista");
  }
  await prisma.timelineEvent.update({ where: { id: eventId }, data: { sharedAt: null } });
}

export async function getPublicFeedPage(
  userId: string,
  offset: number,
  limit = 10
): Promise<{ items: TimelineFeedItem[]; hasMore: boolean }> {
  const events = await prisma.timelineEvent.findMany({
    where: { sharedAt: { not: null } },
    orderBy: { sharedAt: "desc" },
    skip: offset,
    take: limit + 1,
    include: { user: { select: { name: true } } },
  });

  const hasMore = events.length > limit;
  const page = events.slice(0, limit);
  const reactionStates = await getReactionStates(userId, page.map((e) => e.id));

  const items: TimelineFeedItem[] = page.map((event) => {
    const state = reactionStates[event.id];
    return {
      id: event.id,
      itemKey: event.id,
      kind: "achievement",
      title: event.title,
      message: event.message,
      extra: getExtraInfo(event.type),
      dateLabel: formatDateLabel(event.sharedAt ?? event.occurredAt),
      liked: state.likedByMe,
      likeCount: state.likeCount,
      comments: state.comments,
      authorName: event.user.name,
    };
  });

  return { items, hasMore };
}

export async function getAchievementsPage(
  userId: string,
  offset: number,
  limit = 10
): Promise<{ items: TimelineFeedItem[]; hasMore: boolean }> {
  const events = await prisma.timelineEvent.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    skip: offset,
    take: limit + 1,
  });

  const hasMore = events.length > limit;
  const page = events.slice(0, limit);
  const reactionStates = await getReactionStates(userId, page.map((e) => e.id));

  const items: TimelineFeedItem[] = page.map((event) => {
    const state = reactionStates[event.id];
    return {
      id: event.id,
      itemKey: event.id,
      kind: "achievement",
      title: event.title,
      message: event.message,
      extra: getExtraInfo(event.type),
      dateLabel: formatDateLabel(event.occurredAt),
      liked: state.likedByMe,
      likeCount: state.likeCount,
      comments: state.comments,
      shareState: event.sharedAt ? "shared" : "shareable",
      goalType: event.goalType ?? undefined,
      milestoneValue: event.milestoneValue ?? undefined,
      stage: event.stage ?? undefined,
    };
  });

  return { items, hasMore };
}

/**
 * Intercala várias listas em rodízio (1 de cada por vez) em vez de emendar
 * uma atrás da outra — é o que faz o feed alternar curiosidade / notícia /
 * conquista em vez de vir em blocos separados por fonte. Fontes mais
 * curtas (conquistas, notícias) somem da rotação primeiro; a mais longa
 * (curiosidades) segue sozinha até acabar.
 */
function interleave<T>(lists: T[][]): T[] {
  const result: T[] = [];
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) result.push(list[i]);
    }
  }
  return result;
}

// PRNG determinístico (mulberry32) — o embaralhado precisa ser igual em
// toda página do mesmo scroll (offset crescente), senão item repete ou
// some conforme o usuário rola. Por isso não é Math.random(): é semeado
// por usuário+hora, então o resultado é estável durante uma sessão de
// scroll mas muda de hora em hora (e de usuário pra usuário).
export function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return hash;
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed | 0;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type PoolEntry = Omit<TimelineFeedItem, "liked" | "likeCount" | "comments">;

/**
 * Feed único, estilo Instagram: curiosidades (API Ninjas, até 30/dia),
 * notícias (NewsData.io/RSS) e conquistas/progresso do usuário,
 * intercaladas numa única lista e paginadas por um `offset` — quem chama
 * não sabe (nem precisa saber) de qual fonte cada item veio. Usada tanto
 * pra carga inicial da home quanto pro scroll infinito, na web e no
 * mobile.
 */
export async function getFeedPage(
  userId: string,
  offset: number,
  limit = 10
): Promise<{ items: TimelineFeedItem[]; hasMore: boolean }> {
  const day = todayDateString();
  const [facts, factImages, news, achievements, finance, quote, financeImage, quoteImage] =
    await Promise.all([
      fetchNinjaFacts(),
      fetchDiverseCoverImages(30),
      fetchNews(),
      // Desempate por id além de occurredAt — sem isso, dois eventos com o
      // mesmo timestamp (comum quando várias conquistas disparam juntas)
      // podiam vir em ordem relativa diferente entre duas chamadas
      // separadas (achado via "two children with the same key" no feed:
      // pool.slice(offset...) de duas chamadas com ordens diferentes faz
      // o mesmo evento cair em duas páginas — e outro sumir).
      prisma.timelineEvent.findMany({
        where: { userId },
        orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
        take: 100,
      }),
      fetchFinanceSnippet(),
      fetchFunQuote(),
      fetchCoverImage("dinheiro finanças"),
      fetchCoverImage("motivação"),
    ]);

  // Mercado/frase são fixos no dia (uma leitura só, não tem por que
  // paginar) — viram só mais uma fonte no rodízio abaixo, em vez de
  // grudados sempre na posição 0/1 (era isso que fazia o topo do feed
  // parecer sempre igual a cada abertura do app).
  const pinnedItems: PoolEntry[] = [];
  if (finance) {
    pinnedItems.push({
      id: "content-finance",
      itemKey: `finance-${day}`,
      kind: "content",
      title: "Mercado hoje",
      message: finance.text,
      extra: getExtraInfo("content-finance"),
      imageUrl: financeImage,
      dateLabel: "Hoje",
    });
  }
  if (quote) {
    pinnedItems.push({
      id: "content-quote",
      itemKey: `quote-${day}`,
      kind: "content",
      title: "Frase do dia",
      message: `"${quote.text}" — ${quote.author}`,
      extra: getExtraInfo("content-quote"),
      imageUrl: quoteImage,
      dateLabel: "Hoje",
    });
  }

  const factItems: PoolEntry[] = facts.map((fact, i) => ({
    id: `content-fact-${i}`,
    itemKey: `fact-${day}-${i}`,
    kind: "content",
    title: FACT_TITLES[i % FACT_TITLES.length],
    message: fact.text,
    // Sem "Ver mais": cada curiosidade já é um fato completo, não sobra
    // texto de verdade pra expandir (diferente da notícia, que tem mais
    // descrição por trás).
    extra: "",
    imageUrl: factImages.length > 0 ? factImages[i % factImages.length] : null,
    dateLabel: "Hoje",
  }));

  const newsItems: PoolEntry[] = news.map((article, i) => {
    // "Ver mais" só faz sentido se sobrar texto de verdade — o resto da
    // própria descrição da notícia, não um aviso genérico repetido em
    // todo post.
    const hasMore = article.message.length > NEWS_TEASER_LENGTH;
    return {
      id: `content-news-${i}`,
      itemKey: `news-${day}-${i}`,
      kind: "content",
      title: article.title,
      message: hasMore
        ? `${article.message.slice(0, NEWS_TEASER_LENGTH).trimEnd()}…`
        : article.message,
      extra: hasMore ? article.message : "",
      imageUrl: article.imageUrl,
      sourceUrl: article.sourceUrl,
      dateLabel: "Hoje",
    };
  });

  const achievementItems: PoolEntry[] = achievements.map((event) => ({
    id: event.id,
    itemKey: event.id,
    kind: "achievement",
    title: event.title,
    message: event.message,
    extra: getExtraInfo(event.type),
    dateLabel: formatDateLabel(event.occurredAt),
    shareState: event.sharedAt ? "shared" : "shareable",
    // Sem isso, FeedCard nunca sabia que era uma conquista de meta (peso/
    // rotina/indicação) — hasPet ficava sempre false e a postagem caía no
    // layout de texto puro, sem foto nem bichinho, mesmo quando o evento
    // tinha esses dados no banco. getAchievementsPage (Minhas Postagens)
    // já fazia certo; essa função (feed principal) tinha ficado pra trás.
    goalType: event.goalType ?? undefined,
    milestoneValue: event.milestoneValue ?? undefined,
    stage: event.stage ?? undefined,
  }));

  // Semente por usuário+hora: mesma ordem durante uma sessão de scroll
  // (paginação por offset continua consistente), mas muda a cada hora e
  // por pessoa — reabrir o app mais tarde não repete sempre a mesma
  // sequência do topo.
  const hourBucket = Math.floor(Date.now() / (1000 * 60 * 60));
  const seed = hashSeed(`${userId}-${hourBucket}`);

  const sourceLists = seededShuffle(
    [pinnedItems, factItems, newsItems, achievementItems].filter((list) => list.length > 0),
    seed
  ).map((list, i) => seededShuffle(list, seed + i + 1));

  const pool = interleave(sourceLists);
  const pageEntries = pool.slice(offset, offset + limit);

  const reactionStates = await getReactionStates(userId, pageEntries.map((e) => e.itemKey));
  const items: TimelineFeedItem[] = pageEntries.map((entry) => {
    const state = reactionStates[entry.itemKey];
    return { ...entry, liked: state.likedByMe, likeCount: state.likeCount, comments: state.comments };
  });

  return { items, hasMore: offset + items.length < pool.length };
}
