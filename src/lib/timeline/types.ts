export type CommentItem = {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
};

export type TimelineFeedItem = {
  id: string;
  itemKey: string;
  title: string;
  message: string;
  extra: string;
  imageUrl?: string | null;
  dateLabel: string;
  kind: "achievement" | "content";
  liked: boolean;
  likeCount: number;
  comments: CommentItem[];
  /** Presente no feed público: quem conquistou. */
  authorName?: string;
  /** Presente só na sua própria home, em conquistas: controla o botão de compartilhar. */
  shareState?: "shareable" | "shared";
  /** Presente em posts de notícia: link pra matéria original. */
  sourceUrl?: string;
  /** Presentes só em conquistas de meta em escada (peso/rotina/indicação). */
  goalType?: "PESO" | "ROTINA" | "INDICACAO";
  milestoneValue?: number;
  stage?: number;
};
