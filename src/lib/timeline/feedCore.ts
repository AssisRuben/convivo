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
 * `app/api/mobile/comunidade`) — cada rota só resolve o `userId` (JWT
 * Bearer) e delega pra cá.
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
 * pela LGPD já que é dado de saúde. Sem isso, a conquista nunca aparece
 * pra outros usuários em /comunidade.
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
      prisma.timelineEvent.findMany({
        where: { userId },
        orderBy: { occurredAt: "desc" },
        take: 100,
      }),
      fetchFinanceSnippet(),
      fetchFunQuote(),
      fetchCoverImage("dinheiro finanças"),
      fetchCoverImage("motivação"),
    ]);

  // Mercado/frase são fixos no dia (uma leitura só, não tem por que
  // paginar) — sempre no topo do pool, antes de curiosidade/notícia/
  // conquista intercaladas.
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
  }));

  const pool = [...pinnedItems, ...interleave([factItems, newsItems, achievementItems])];
  const pageEntries = pool.slice(offset, offset + limit);

  const reactionStates = await getReactionStates(userId, pageEntries.map((e) => e.itemKey));
  const items: TimelineFeedItem[] = pageEntries.map((entry) => {
    const state = reactionStates[entry.itemKey];
    return { ...entry, liked: state.likedByMe, likeCount: state.likeCount, comments: state.comments };
  });

  return { items, hasMore: offset + items.length < pool.length };
}
