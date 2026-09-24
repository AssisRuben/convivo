/**
 * Conteúdo de "Gotas de Fé" — devocional diário, mesma dinâmica das
 * Pílulas de sabedoria (ver constants/wisdomPills.ts), só com o tema e
 * os textos trocados. Texto aceita **negrito**, *itálico* e ***negrito
 * itálico*** inline, renderizado por <RichText> na tela de leitura.
 *
 * Mais de um LIVRO agora (Provérbios, Evangelho de Marcos, ...) — cada
 * um com sua própria sequência de capítulos e progresso/streak
 * independente (ver FaithProgress no schema.prisma, chaveado por
 * userId+bookSlug). A tela de "Gotas de Fé" vira um hub de livros; cada
 * livro tem sua própria lista de capítulos.
 */
export type FaithBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  // Aviso do autor no fim de cada capítulo — citações bíblicas de
  // memória, vale conferir a referência exata antes de uso público.
  | { type: "footnote"; text: string };

export type FaithChapter = {
  number: number;
  title: string;
  subtitle: string;
  blocks: FaithBlock[];
};

export type FaithBook = {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  chapters: FaithChapter[];
};

const CITATION_FOOTNOTE =
  "Nota: as citações de Provérbios seguem a tradução de Almeida, de memória — vale conferir a referência exata numa Bíblia física ou digital antes de usar o conteúdo publicamente.";

const PROVERBIOS_CHAPTERS: FaithChapter[] = [
  {
    number: 1,
    title: "Saber Que Não Se Sabe",
    subtitle: "A porta estreita da sabedoria",
    blocks: [
      {
        type: "paragraph",
        text: "Há uma frase que abre o livro de Provérbios e funciona quase como uma chave de leitura para tudo que vem depois:",
      },
      {
        type: "quote",
        text: "\"O temor do Senhor é o princípio do conhecimento; os insensatos desprezam a sabedoria e a instrução.\" (Provérbios 1:7)",
      },
      {
        type: "paragraph",
        text: "E, repetida quase palavra por palavra alguns capítulos depois:",
      },
      {
        type: "quote",
        text: "\"O temor do Senhor é o princípio da sabedoria, e o conhecimento do Santo é entendimento.\" (Provérbios 9:10)",
      },
      {
        type: "paragraph",
        text: "À primeira leitura, \"temor\" soa como medo — e isso afasta muita gente da frase, como se sabedoria começasse com pavor. Mas no sentido hebraico original, o termo carrega mais o significado de **reverência, humildade diante de algo maior que você** — o reconhecimento de que existe uma ordem no mundo que não começa e nem termina em você mesmo. Não é terror paralisante; é a postura de quem entende sua própria pequenez diante do que ainda não sabe.",
      },
      {
        type: "paragraph",
        text: "É exatamente essa postura — humildade como ponto de partida, não como fraqueza — que conecta Provérbios a uma das cenas mais famosas da filosofia ocidental.",
      },
      { type: "heading", text: "Sócrates e o oráculo" },
      {
        type: "paragraph",
        text: "Um amigo de Sócrates foi ao Oráculo de Delfos e perguntou se havia alguém mais sábio que Sócrates em toda Atenas. O oráculo respondeu que não. Sócrates, intrigado — porque não se considerava sábio em nada — passou a interrogar publicamente os homens tidos como mais sábios da cidade: políticos, poetas, artesãos. Descobriu que todos tinham convicção de saber coisas que, ao serem questionados a fundo, não sabiam de verdade.",
      },
      {
        type: "paragraph",
        text: "Sócrates concluiu que só era mais sábio que os outros em um único ponto: **ele sabia que não sabia**, enquanto os outros acreditavam saber sem realmente saber. Essa consciência da própria ignorância — e não o acúmulo de informação — era, para ele, o verdadeiro início da sabedoria.",
      },
      {
        type: "paragraph",
        text: "É praticamente o mesmo movimento de Provérbios 1:7, só que com vocabulário diferente. Onde Provérbios fala de \"temor\" diante de algo maior, Sócrates fala de humildade diante do que ainda não se sabe. Nos dois casos, a sabedoria não começa com uma resposta — começa com o reconhecimento honesto de uma pergunta ainda em aberto.",
      },
      { type: "heading", text: "O oposto: o insensato que despreza instrução" },
      {
        type: "paragraph",
        text: "Provérbios contrasta o sábio com uma figura recorrente: o **insensato** (em hebraico, *kesil*) — não alguém sem inteligência, mas alguém que rejeita correção, que já \"sabe tudo\" e por isso não escuta.",
      },
      {
        type: "quote",
        text: "\"O caminho do insensato é reto aos seus próprios olhos, mas o que dá ouvidos ao conselho é sábio.\" (Provérbios 12:15)",
      },
      {
        type: "paragraph",
        text: "Esse é o retrato exato dos atenienses que Sócrates interrogou: pessoas competentes em suas áreas, mas fechadas à possibilidade de estarem erradas — e por isso, paradoxalmente, mais distantes da sabedoria do que quem admite não saber.",
      },
      {
        type: "paragraph",
        text: "A ironia socrática (fingir não saber para fazer o outro revelar sua própria ignorância) e a insistência de Provérbios em buscar conselho e correção são, no fundo, o mesmo antídoto aplicado ao mesmo problema: a convicção prematura fecha a porta antes mesmo dela ser aberta.",
      },
      { type: "heading", text: "Por que isso importa na prática" },
      {
        type: "paragraph",
        text: "Essa ideia tem uma consequência direta e incômoda: **sabedoria não é sinônimo de acúmulo de conhecimento técnico**. Uma pessoa pode ter um diploma, um cargo, décadas de experiência — e ainda assim ser \"insensata\" no sentido bíblico, se estiver fechada a ser corrigida. E uma pessoa mais jovem, com menos bagagem, pode estar mais próxima da sabedoria genuína só por manter a postura certa: abertura, humildade, disposição de ouvir antes de concluir.",
      },
      {
        type: "paragraph",
        text: "Isso conecta diretamente com algo que já vimos na trilha anterior — excesso de confiança (Capítulo 1 da trilha de vieses cognitivos) é quase uma tradução moderna, em linguagem de psicologia comportamental, do que tanto Sócrates quanto Provérbios descreveram há milênios: a convicção sem evidência suficiente é o principal obstáculo para decidir e viver bem.",
      },
      { type: "heading", text: "Síntese" },
      {
        type: "paragraph",
        text: "O ponto de partida da sabedoria, em Provérbios e na filosofia socrática, não é uma informação nova — é uma postura: reconhecer que ainda não se sabe o suficiente, e permanecer aberto a ser corrigido. Tudo o que vier depois nos próximos capítulos — disciplina, domínio próprio, relacionamentos, trabalho, riqueza — só rende fruto real em quem já aceitou esse primeiro passo.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma área da sua vida onde você age com a convicção \"sei tudo que preciso saber\" — e que talvez mereça mais humildade?",
          "Pense na última vez que alguém tentou te corrigir ou aconselhar. Sua reação foi mais parecida com o sábio de Provérbios 12:15, ou com o insensato que \"acha seu caminho reto aos próprios olhos\"?",
          "Se Sócrates te interrogasse hoje sobre algo em que você se considera competente, o que ele provavelmente revelaria que você não sabe tão bem quanto pensa?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
  {
    number: 2,
    title: "O Território Mais Difícil de Conquistar",
    subtitle: "Uma cidade tomada, um espírito não dominado",
    blocks: [
      {
        type: "quote",
        text: "\"Melhor é o longânimo do que o valente, e o que domina o seu espírito do que o que toma uma cidade.\" (Provérbios 16:32)",
      },
      {
        type: "paragraph",
        text: "Essa comparação é deliberadamente desproporcional. Tomar uma cidade era, no mundo antigo, o feito máximo de força e estratégia — o topo do que um homem poderoso podia realizar. Provérbios coloca ao lado dessa conquista algo aparentemente menor: dominar o próprio espírito diante da provocação. E diz que o segundo é *maior* que o primeiro.",
      },
      { type: "paragraph", text: "A ideia se repete, com outra imagem:" },
      {
        type: "quote",
        text: "\"Quem tarda em irar-se é grande em entendimento, mas o que é de espírito impaciente exalta a loucura.\" (Provérbios 14:29)",
      },
      {
        type: "paragraph",
        text: "Paciência diante da provocação não é fraqueza nem passividade — é a forma mais alta de força que Provérbios reconhece, porque é a única conquista que não depende de exército, sorte ou circunstância. Depende só de você.",
      },
      { type: "heading", text: "Sêneca e a raiva como loucura temporária" },
      {
        type: "paragraph",
        text: "Sêneca escreveu um tratado inteiro sobre isso, *De Ira* (Sobre a Ira), no qual chama a raiva de \"a mais hedionda e frenética de todas as emoções\" — não porque sentir raiva seja errado em si, mas porque a raiva, uma vez que assume o controle, sequestra o julgamento. Para Sêneca, a pessoa enraivecida temporariamente perde acesso à própria razão — é, literalmente, uma forma de loucura passageira.",
      },
      {
        type: "paragraph",
        text: "O ponto central do estoicismo aqui não é suprimir a emoção, mas interromper o intervalo entre o estímulo e a reação. Epicteto, outro estoico, resumiu isso na célebre distinção entre o que está e o que não está sob nosso controle: os eventos externos — o insulto, a provocação, a injustiça — não estão sob nosso controle. Nossa resposta a eles, sim. Toda a liberdade humana, para Epicteto, mora exatamente nesse intervalo estreito entre o que acontece e como reagimos.",
      },
      {
        type: "paragraph",
        text: "Marco Aurélio, imperador e também estoico, escrevia para si mesmo, nas *Meditações*, lembretes constantes para não deixar a provocação alheia ditar seu estado interior — praticando, todos os dias, o mesmo domínio próprio que Provérbios chama de \"maior que tomar uma cidade\".",
      },
      { type: "heading", text: "A resposta branda como ferramenta prática" },
      {
        type: "paragraph",
        text: "Provérbios não fica só na virtude abstrata — oferece uma técnica concreta:",
      },
      {
        type: "quote",
        text: "\"A resposta branda desvia o furor, mas a palavra dura suscita a ira.\" (Provérbios 15:1)",
      },
      {
        type: "paragraph",
        text: "Isso é quase um manual de escalada e desescalada de conflito. A reação impulsiva alimenta a reação impulsiva do outro — ira gera ira, numa espiral. A resposta ponderada, mesmo diante de provocação, quebra esse ciclo antes que ele comece. É o domínio próprio do estoico aplicado não só ao mundo interior, mas ao efeito real sobre a outra pessoa.",
      },
      { type: "heading", text: "O oposto: o insensato de espírito descontrolado" },
      {
        type: "quote",
        text: "\"Como a cidade derribada, sem muro, assim é o homem que não pode conter o seu espírito.\" (Provérbios 25:28)",
      },
      {
        type: "paragraph",
        text: "Uma cidade sem muralha estava, no mundo antigo, à mercê de qualquer invasor. É essa a imagem de quem não tem domínio próprio: exposto, vulnerável a qualquer provocação externa, sem nenhuma defesa interna. A muralha, aqui, não é isolamento emocional — é a capacidade de escolher a resposta, em vez de ser arrastado por ela.",
      },
      { type: "heading", text: "Síntese" },
      {
        type: "paragraph",
        text: "Provérbios e os estoicos chegam, por caminhos diferentes, à mesma conclusão prática: a verdadeira força não está em controlar o mundo externo — que é instável e não está sob seu domínio — mas em controlar sua própria resposta a ele. Essa é uma conquista silenciosa, sem aplausos, mas é a única que ninguém pode tirar de você.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pense na última vez que você reagiu por impulso a uma provocação. Olhando agora, qual seria uma \"resposta branda\" possível naquele momento?",
          "Existe alguma situação recorrente na sua rotina onde seu \"espírito\" costuma ficar sem muralha — mais vulnerável a perder o controle?",
          "Epicteto perguntaria: nessa situação que te irrita, o que exatamente está sob seu controle, e o que não está?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
  {
    number: 3,
    title: "Vida e Morte Numa Única Ferramenta",
    subtitle: "O poder desproporcional das palavras",
    blocks: [
      {
        type: "quote",
        text: "\"A morte e a vida estão no poder da língua; e aquele que a ama comerá do seu fruto.\" (Provérbios 18:21)",
      },
      {
        type: "paragraph",
        text: "Nenhum outro órgão do corpo recebe, em Provérbios, um peso comparável a esse. Não são as mãos que constroem ou destroem, nem os pés que constroem caminhos — é a língua. Uma promessa, uma acusação, um elogio, uma mentira: tudo isso é pura palavra, sem massa nem força física, e ainda assim capaz de erguer ou arruinar uma relação, uma reputação, uma vida inteira.",
      },
      {
        type: "quote",
        text: "\"Na multidão de palavras não falta transgressão, mas o que refreia os seus lábios é prudente.\" (Provérbios 10:19)",
      },
      {
        type: "paragraph",
        text: "O risco não está só em mentir ou ofender — está no simples excesso. Quanto mais se fala, estatisticamente maior a chance de dizer algo que devia ter ficado em silêncio.",
      },
      { type: "heading", text: "Aristóteles e o meio-termo da fala" },
      {
        type: "paragraph",
        text: "Aristóteles, na *Ética a Nicômaco*, propõe que toda virtude é um meio-termo entre dois vícios — um por excesso, outro por falta. Coragem é o meio-termo entre covardia (falta) e temeridade (excesso). Aplicando essa mesma lógica à fala: existe um vício por excesso (falar demais, fofocar, adular, interromper) e um vício por falta (silêncio covarde, sonegar a verdade quando ela precisa ser dita). A virtude — a fala prudente que Provérbios recomenda — não é nem uma coisa nem outra. É saber, em cada situação, quanto e quando falar.",
      },
      { type: "paragraph", text: "Isso conecta diretamente com outro provérbio, quase irônico:" },
      {
        type: "quote",
        text: "\"Até o tolo, quando se cala, será reputado por sábio; e o que cerra os seus lábios, por entendido.\" (Provérbios 17:28)",
      },
      {
        type: "paragraph",
        text: "O silêncio, por si só, não é sabedoria — é só a ausência de prova de insensatez. A sabedoria real de que Aristóteles fala não é calar sempre, mas calibrar: saber quando o silêncio serve e quando a palavra é necessária.",
      },
      { type: "heading", text: "Retórica: a palavra a serviço do caráter" },
      {
        type: "paragraph",
        text: "Aristóteles também escreveu um tratado inteiro sobre persuasão, a *Retórica*, onde argumenta que a palavra eficaz depende de três elementos: *ethos* (o caráter de quem fala), *pathos* (a conexão emocional com quem ouve) e *logos* (a lógica do argumento). O ponto central para Aristóteles é que a palavra bem construída não é separável do caráter de quem a profere — um discurso tecnicamente perfeito, vindo de alguém sem credibilidade, convence menos do que uma fala simples vinda de alguém íntegro.",
      },
      { type: "paragraph", text: "Provérbios chega numa conclusão parecida por outro caminho:" },
      {
        type: "quote",
        text: "\"Como maçãs de ouro em salvas de prata, assim é a palavra dita a seu tempo.\" (Provérbios 25:11)",
      },
      {
        type: "paragraph",
        text: "A palavra certa não é só sobre conteúdo — é sobre timing, contexto, e a relação de confiança entre quem fala e quem escuta. Sem isso, mesmo a verdade dita soa vazia ou hostil.",
      },
      { type: "heading", text: "Síntese" },
      {
        type: "paragraph",
        text: "Tanto Provérbios quanto Aristóteles tratam a fala como uma ferramenta poderosa demais para ser usada sem critério. Não se trata de falar pouco ou falar muito por regra fixa — trata-se de calibrar, situação a situação, entre o excesso que fere e a omissão que trai. É um domínio que se aprende com prática, não com regra memorizada.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pense numa conversa recente em que você falou demais. O que teria mudado se tivesse dito menos?",
          "Existe alguma situação em que seu silêncio, hoje, é covardia disfarçada de prudência?",
          "Da próxima vez que for dizer algo importante, pergunte-se: isso é uma \"maçã de ouro em salva de prata\" — dita no momento certo — ou estou só descarregando o que sinto, sem calibrar o timing?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
  {
    number: 4,
    title: "O Que a Formiga Sabe Sem Ter Chefe",
    subtitle: "Uma aula de gestão dada por um inseto",
    blocks: [
      {
        type: "quote",
        text: "\"Vai-te à formiga, ó preguiçoso; olha os seus caminhos, e sê sábio: a qual, não tendo superior, nem oficial, nem dominador, prepara no verão o seu pão; na sega ajunta o seu mantimento.\" (Provérbios 6:6-8)",
      },
      {
        type: "paragraph",
        text: "A imagem é deliberadamente humilhante para quem a lê com orgulho: um inseto, sem hierarquia, sem supervisão, sem ninguém cobrando — organiza-se sozinho para garantir o futuro. Não por medo de punição, não por pressão externa, mas por disciplina interna. Provérbios usa a formiga exatamente para mostrar que diligência genuína não depende de vigilância; ela é um traço de caráter, não uma resposta a controle externo.",
      },
      {
        type: "paragraph",
        text: "O contraste com a preguiça é retratado sem meias palavras em todo o livro:",
      },
      {
        type: "quote",
        text: "\"A mão preguiçosa empobrece, mas a mão dos diligentes enriquece.\" (Provérbios 10:4)",
      },
      {
        type: "quote",
        text: "\"Aquele que lavra a sua terra se fartará de pão, mas o que segue os ociosos se fartará de pobreza.\" (Provérbios 28:19)",
      },
      { type: "heading", text: "Aristóteles e a virtude como hábito" },
      {
        type: "paragraph",
        text: "Aristóteles, na *Ética a Nicômaco*, faz uma afirmação que resume perfeitamente o espírito desses provérbios: \"somos aquilo que fazemos repetidamente. A excelência, então, não é um ato, mas um hábito.\" Para Aristóteles, ninguém nasce diligente ou preguiçoso por natureza fixa — a virtude se constrói pela repetição de atos virtuosos, até que eles se tornem segunda natureza. Um homem se torna disciplinado praticando disciplina, do mesmo jeito que se torna músico praticando música — não existe atalho de \"força de vontade pura\" sem prática acumulada.",
      },
      {
        type: "paragraph",
        text: "Isso conecta com o conceito central de Aristóteles chamado ***phronesis*** — sabedoria prática. Diferente do conhecimento teórico (saber *que* algo é verdade), *phronesis* é saber *o que fazer*, na situação concreta, no momento certo. A formiga de Provérbios é, nesse sentido, uma imagem perfeita de *phronesis*: ela não teoriza sobre o inverno, ela age no verão, no tempo certo, sem precisar ser lembrada.",
      },
      { type: "heading", text: "Disciplina não é sobre motivação" },
      {
        type: "paragraph",
        text: "Um erro comum na cultura contemporânea é tratar disciplina como dependente de motivação — \"quando eu estiver inspirado, eu ajo\". Tanto Provérbios quanto Aristóteles invertem essa lógica: a ação vem primeiro, o caráter (e frequentemente até a motivação) vem depois, como consequência da prática repetida. A formiga não espera se sentir motivada no verão — ela age porque agir no tempo certo é, para ela, como a natureza funciona.",
      },
      {
        type: "quote",
        text: "\"O que trabalha a sua terra se fartará de pão, mas o que segue os vadios está falto de juízo.\" (Provérbios 12:11)",
      },
      {
        type: "paragraph",
        text: "\"Falto de juízo\" aqui é uma tradução interessante — a preguiça, para Provérbios, não é neutra moralmente; é tratada como um déficit de sabedoria prática, exatamente o mesmo território da *phronesis* aristotélica.",
      },
      { type: "heading", text: "Síntese" },
      {
        type: "paragraph",
        text: "A sabedoria prática, tanto em Provérbios quanto em Aristóteles, não é medida pelo que você sabe, mas pelo que você faz de forma consistente, sem precisar de supervisão externa. A formiga não tem chefe porque não precisa — a disciplina dela já é interna. Esse é o padrão que ambas as tradições apontam como o caminho real para prosperidade, não como recompensa moral abstrata, mas como consequência prática direta de agir no tempo certo.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma área da sua vida onde você age \"como a formiga\" — disciplinado mesmo sem ninguém cobrando — e outra onde só age sob supervisão externa?",
          "Pense num hábito que você quer construir. Que ação pequena e repetível, praticada agora, começaria a formar esse caráter, independente de motivação?",
          "Aristóteles diria: você se tornou quem é pelos hábitos que repetiu até aqui. Que hábito, se repetido pelos próximos 12 meses, mudaria quem você é?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
  {
    number: 5,
    title: "O Atrito Que Afia",
    subtitle: "Uma imagem que incomoda antes de fazer sentido",
    blocks: [
      {
        type: "quote",
        text: "\"Ferro com ferro se afia; assim o homem afia o rosto do seu amigo.\" (Provérbios 27:17)",
      },
      {
        type: "paragraph",
        text: "Não é uma imagem confortável. Afiar não é um processo suave — envolve atrito, faísca, desgaste controlado de uma superfície contra a outra. Provérbios escolhe justamente essa imagem, e não uma mais óbvia (como \"amigo é apoio\" ou \"amigo é abrigo\"), para descrever o que a amizade genuína realmente faz: ela desafia, confronta, expõe pontos cegos — e é exatamente esse atrito que produz o corte mais afiado, mais útil.",
      },
      {
        type: "paragraph",
        text: "Isso contrasta com uma visão comum de amizade como só conforto e validação mútua. Provérbios discorda diretamente:",
      },
      {
        type: "quote",
        text: "\"Fiéis são as feridas feitas pelo que ama, mas os beijos do que odeia são enganosos.\" (Provérbios 27:6)",
      },
      {
        type: "paragraph",
        text: "A amizade que só elogia, sem nunca confrontar, é tratada aqui quase como suspeita — \"beijos enganosos\". A amizade real inclui a disposição de ferir, quando necessário, para o bem do outro.",
      },
      { type: "heading", text: "Aristóteles e as três amizades" },
      {
        type: "paragraph",
        text: "Aristóteles dedica boa parte da *Ética a Nicômaco* ao tema, distinguindo três tipos de amizade:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Amizade por utilidade** — baseada no que cada um ganha com o outro (contatos de negócio, colegas de trabalho). Dura enquanto a utilidade dura.",
          "**Amizade por prazer** — baseada na companhia agradável, diversão compartilhada. Dura enquanto o prazer dura.",
          "**Amizade por virtude (ou completa)** — baseada na admiração mútua pelo caráter do outro, no desejo do bem do outro pelo próprio bem do outro, não pelo que se ganha com isso. É rara, exige tempo para se construir, e é a única capaz de sustentar confronto honesto sem se romper.",
        ],
      },
      {
        type: "paragraph",
        text: "O \"ferro que afia ferro\" só é possível na terceira categoria. Numa amizade por utilidade ou prazer, uma crítica honesta ameaça o próprio motivo da relação — porque o vínculo depende de manter as coisas agradáveis. Só a amizade de virtude, onde o bem do outro é o objetivo real, sustenta o desconforto de ser corrigido sem quebrar.",
      },
      { type: "heading", text: "O risco do mau companheiro" },
      {
        type: "paragraph",
        text: "Provérbios também alerta sobre o efeito inverso — más companhias corrompem, do mesmo jeito que boas companhias afiam:",
      },
      {
        type: "quote",
        text: "\"Aquele que anda com os sábios ficará sábio, mas o companheiro dos tolos sofrerá aflição.\" (Provérbios 13:20)",
      },
      {
        type: "paragraph",
        text: "Isso é quase um princípio de contágio de caráter: você tende a se tornar, ao longo do tempo, uma média das pessoas com quem convive de perto. Aristóteles concordaria — para ele, o caráter se forma por hábito e imitação, e a companhia constante é uma das formas mais poderosas de moldar hábito, para o bem ou para o mal.",
      },
      { type: "heading", text: "Síntese" },
      {
        type: "paragraph",
        text: "Provérbios e Aristóteles convergem numa ideia contraintuitiva: a amizade mais valiosa não é a mais confortável, é a que sustenta verdade mesmo quando dói. Amizade de utilidade e de prazer têm seu lugar — mas só a amizade de caráter, rara e construída ao longo do tempo, tem a solidez para afiar de verdade, sem se romper no processo.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Entre suas amizades atuais, quais seriam por utilidade, quais por prazer, e quais — se houver — seriam de caráter, no sentido aristotélico?",
          "Existe alguém que, nos últimos meses, te disse uma verdade desconfortável por se importar de verdade? Como você reagiu?",
          "Você tem sido, para alguém próximo, um \"ferro que afia\" — ou tem preferido só agradar, mesmo quando uma correção honesta seria mais útil?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
  {
    number: 6,
    title: "O Paradoxo de Quem Espalha e Ainda Ganha",
    subtitle: "Uma matemática que não fecha à primeira vista",
    blocks: [
      {
        type: "quote",
        text: "\"Há quem espalha, e ainda se lhe acrescenta; e há quem retém mais do que é justo, mas fica em necessidade.\" (Provérbios 11:24)",
      },
      {
        type: "paragraph",
        text: "À lógica comum, reter deveria significar acumular, e distribuir deveria significar perder. Provérbios inverte essa expectativa de forma quase provocadora: quem espalha generosamente prospera, quem retém além do justo empobrece. Não é uma promessa mágica de causa e efeito automático — é uma observação sobre como a avareza, ao fechar relações e confiança ao redor de alguém, tende a empobrecer de formas que vão além do dinheiro em caixa.",
      },
      {
        type: "paragraph",
        text: "E há um alerta direto contra colocar a riqueza como objetivo central da vida:",
      },
      {
        type: "quote",
        text: "\"Não te fatigues para enriqueceres; dá de mão à tua própria prudência. Fitando-a bem os teus olhos, ela se vai embora, porque, na verdade, faz para si asas, como a águia, e voa para os céus.\" (Provérbios 23:4-5)",
      },
      {
        type: "paragraph",
        text: "A riqueza é descrita como instável por natureza — algo que pode \"voar\" a qualquer momento, e que não merece o esgotamento de quem se cansa perseguindo-a como fim último.",
      },
      { type: "heading", text: "Sêneca: riqueza como coisa indiferente" },
      {
        type: "paragraph",
        text: "Sêneca, apesar de ter sido um dos homens mais ricos de Roma, escreveu extensamente sobre como a riqueza deveria ser tratada pelo sábio: não como um bem em si, nem como um mal em si, mas como algo *indiferente* — útil se bem usada, mas irrelevante para a verdadeira felicidade (que para os estoicos reside inteiramente na virtude). Em *Sobre a Vida Feliz*, Sêneca argumenta que o sábio pode ter riqueza, desde que não seja possuído por ela — a diferença entre ter posses e ser tido por elas é, para ele, a linha que separa sabedoria de escravidão disfarçada de sucesso.",
      },
      { type: "paragraph", text: "Essa distinção ecoa diretamente em outro provérbio:" },
      {
        type: "quote",
        text: "\"Melhor é o pouco com justiça do que a abundância de rendas com injustiça.\" (Provérbios 16:8)",
      },
      {
        type: "paragraph",
        text: "A quantidade de riqueza, para ambas as tradições, é secundária. O que importa é a forma como ela foi obtida e a relação que se mantém com ela depois.",
      },
      { type: "heading", text: "Epicuro: o problema não é ter pouco, é desejar demais" },
      {
        type: "paragraph",
        text: "Epicuro, frequentemente mal compreendido como um defensor do prazer irrestrito, na verdade pregava exatamente o oposto quando se tratava de riqueza. Para ele, o sofrimento humano em torno do dinheiro vinha quase sempre de desejos artificiais, ilimitados por natureza — status, luxo, comparação social — em contraste com desejos naturais e necessários (comida, abrigo, relações), que são poucos e fáceis de satisfazer. Sua frase mais conhecida sobre o tema resume bem o espírito: \"nada é suficiente para quem considera suficiente pouco demais.\"",
      },
      { type: "paragraph", text: "Isso é quase uma paráfrase filosófica do provérbio:" },
      {
        type: "quote",
        text: "\"O que ama o dinheiro nunca se farta de dinheiro; e quem ama a abundância nunca se farta da renda; também isso é vaidade.\" (Eclesiastes 5:10 — do mesmo círculo de literatura sapiencial de Provérbios)",
      },
      { type: "heading", text: "Síntese" },
      {
        type: "paragraph",
        text: "Provérbios, Sêneca e Epicuro concordam num ponto central, apesar de linguagens diferentes: o problema nunca é a riqueza em si, mas a relação de escravidão que se estabelece com ela — seja pela avareza que empobrece relações, seja pelo desejo ilimitado que nunca se sente satisfeito, não importa quanto se acumule. A generosidade, nesse quadro, não é sacrifício — é a prática que quebra essa escravidão antes que ela se instale.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma área da sua vida financeira onde reter além do necessário está, na prática, custando relações ou oportunidades?",
          "Epicuro perguntaria: dos seus desejos atuais ligados a dinheiro, quais são realmente necessários, e quais são desejos artificiais, sem limite natural de satisfação?",
          "Pense numa vez em que você foi generoso além do confortável. O que voltou para você — não necessariamente em dinheiro, mas em relação, confiança ou tranquilidade?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
  {
    number: 7,
    title: "A Balança Que Ninguém Está Vendo",
    subtitle: "Integridade quando ninguém confere o peso",
    blocks: [
      {
        type: "quote",
        text: "\"Balanças enganosas são abominação para o Senhor, mas o peso justo é o seu prazer.\" (Provérbios 11:1)",
      },
      {
        type: "paragraph",
        text: "No comércio antigo, era comum um vendedor manipular sutilmente os pesos da balança para cobrar mais do que devia — uma fraude pequena, quase invisível, que só o próprio vendedor sabia estar cometendo. Provérbios escolhe justamente esse exemplo discreto, não um crime evidente, para falar de integridade: o teste real de caráter não é o que você faz sendo observado, é o que você faz quando só você saberia.",
      },
      {
        type: "quote",
        text: "\"Melhor é o pobre que anda na sua sinceridade do que o perverso de lábios e tolo.\" (Provérbios 19:1)",
      },
      {
        type: "quote",
        text: "\"A integridade dos retos os encaminhará, mas a perversidade dos infiéis os destruirá.\" (Provérbios 11:3)",
      },
      {
        type: "paragraph",
        text: "Integridade, na raiz da palavra, é sobre inteireza — ser a mesma pessoa por dentro e por fora, com ou sem plateia.",
      },
      { type: "heading", text: "Platão e o Anel de Giges" },
      {
        type: "paragraph",
        text: "Platão, na *República*, apresenta um experimento mental através do personagem Gláucon: imagine um anel mágico que torna seu dono invisível sempre que quiser. Gláucon pergunta a Sócrates — mesmo o homem mais justo continuaria justo se pudesse roubar, mentir e trair sem nunca ser descoberto? Se a resposta for não, isso revela que a \"justiça\" dessa pessoa nunca foi genuína — era apenas medo de ser pega, disfarçado de virtude.",
      },
      {
        type: "paragraph",
        text: "A resposta de Sócrates, que ocupa boa parte da *República*, é que a verdadeira justiça não é sobre reputação externa nem consequência de ser flagrado — é sobre a **ordem interna da alma**. Para Platão, a alma tem três partes (razão, espírito e apetite), e a pessoa justa é aquela em que a razão governa, mantendo as outras partes em equilíbrio — independente de haver testemunha ou punição externa. A pessoa injusta, mesmo que nunca seja descoberta, já está em desordem interna, e essa desordem é, por si só, a punição.",
      },
      {
        type: "paragraph",
        text: "É exatamente o mesmo território da \"balança enganosa\" de Provérbios: a corrupção não começa quando alguém é flagrado, começa no momento em que a balança é manipulada em segredo — o resto é só consequência visível de uma desordem que já existia por dentro.",
      },
      { type: "heading", text: "O teste real de caráter" },
      {
        type: "paragraph",
        text: "Provérbios oferece, em outro trecho, uma variação do mesmo teste — não sobre dinheiro, mas sobre discurso público versus verdade privada:",
      },
      {
        type: "quote",
        text: "\"O justo odeia a palavra da falsidade, mas o ímpio se faz odioso e se confunde.\" (Provérbios 13:5)",
      },
      {
        type: "paragraph",
        text: "O padrão de coerência entre o que se diz em público e o que se pratica em privado é, para ambas as tradições, o critério mais confiável de justiça real — muito mais do que a reputação que alguém consegue construir enquanto está sendo observado.",
      },
      { type: "heading", text: "Síntese" },
      {
        type: "paragraph",
        text: "Platão e Provérbios concordam num ponto que atravessa milênios: a verdadeira justiça não se mede pelo comportamento sob vigilância, mas pela ordem interna que se sustenta mesmo na ausência total de consequência externa. O Anel de Giges e a balança enganosa são, no fundo, a mesma pergunta feita de formas diferentes: quem você é quando ninguém está calculando o peso?",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma \"balança\" na sua vida — uma pequena decisão, invisível aos outros — onde você ajusta o peso a seu favor?",
          "Se você tivesse o Anel de Giges por uma semana, inteiramente invisível e sem consequência, o que mudaria no seu comportamento? O que essa resposta revela?",
          "Platão diria que a desordem interna é, por si só, uma forma de punição. Existe alguma incoerência entre o que você defende publicamente e o que pratica em privado que já esteja custando sua própria paz?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
  {
    number: 8,
    title: "O Homem Que Admitiu Não Saber",
    subtitle: "A confissão que fecha o livro",
    blocks: [
      {
        type: "paragraph",
        text: "Nos capítulos finais de Provérbios, aparece uma voz diferente das anteriores — não é mais Salomão instruindo com autoridade, é um homem chamado Agur, cujas primeiras palavras são de humildade quase desconcertante:",
      },
      {
        type: "quote",
        text: "\"Certamente que eu sou mais brutal do que ninguém, não tenho o entendimento do homem.\" (Provérbios 30:2)",
      },
      {
        type: "quote",
        text: "\"Quem subiu ao céu, e desceu? quem encerrou os ventos nos seus punhos? quem amarrou as águas numa roupa? quem estabeleceu todas as extremidades da terra? qual é o seu nome, e qual é o nome de seu filho, se é que o sabes?\" (Provérbios 30:4)",
      },
      {
        type: "paragraph",
        text: "Depois de 29 capítulos de instrução, conselho e afirmações confiantes sobre como viver, o livro escolhe terminar com alguém admitindo abertamente os limites do próprio entendimento diante do que é maior e mais complexo do que qualquer sabedoria humana pode abarcar. Não é enfraquecimento do livro — é, estruturalmente, seu ponto culminante.",
      },
      { type: "heading", text: "O círculo se fecha com Sócrates" },
      {
        type: "paragraph",
        text: "Esse é o momento exato em que a trilha volta ao seu ponto de partida, no Capítulo 1: Sócrates, considerado o homem mais sábio de Atenas exatamente por reconhecer, com honestidade, o que não sabia. Agur faz o mesmo movimento, com outro vocabulário: ao invés de fingir domínio completo sobre as grandes questões (a origem do céu, dos ventos, dos limites da terra), ele admite abertamente sua pequenez diante delas.",
      },
      {
        type: "paragraph",
        text: "A diferença é que, em Sócrates, essa humildade era sobretudo epistêmica — sobre o que é possível conhecer com certeza. Em Agur, ela é também existencial — sobre a posição do ser humano diante de algo maior que a própria razão consegue alcançar completamente. As duas tradições concordam, porém, no ponto central: **sabedoria madura reconhece sua própria borda**. Ela não finge alcançar o que está além do alcance humano.",
      },
      { type: "heading", text: "O pedido de Agur: nem pobreza, nem riqueza" },
      {
        type: "paragraph",
        text: "Depois de admitir os limites do que sabe sobre o cosmos, Agur faz um pedido notavelmente prático e equilibrado:",
      },
      {
        type: "quote",
        text: "\"Duas coisas te pedi; não mas negues, antes que morra: afasta de mim a vaidade e a palavra mentirosa; não me dês nem a pobreza nem a riqueza; mantém-me do pão que me é necessário: para que porventura de farto não te negue, e diga: Quem é o Senhor? ou que, empobrecendo, não venha a furtar, e profane o nome do meu Deus.\" (Provérbios 30:7-9)",
      },
      {
        type: "paragraph",
        text: "Esse pedido conecta diretamente com o Capítulo 6 desta trilha (riqueza e generosidade) — Agur não pede prosperidade nem pobreza, mas suficiência, reconhecendo que tanto o excesso quanto a falta distorcem o caráter de formas diferentes, mas igualmente perigosas. É praticamente uma antecipação, milênios antes, da ideia epicurista de que o desejo desregulado — para mais ou para menos — é a raiz da inquietação humana.",
      },
      { type: "heading", text: "Por que terminar assim é sabedoria, não fraqueza" },
      {
        type: "paragraph",
        text: "Um livro inteiro dedicado a ensinar sabedoria escolhe, no fim, admitir os limites dessa mesma sabedoria. Isso não é contradição — é coerência total com o que foi dito desde o primeiro capítulo desta trilha: \"o temor do Senhor é o princípio da sabedoria\" nunca significou domínio completo, significou humildade como ponto de partida. Agur mostra que essa humildade não é só o começo — é também o fim, o destino de quem realmente levou a sabedoria a sério.",
      },
      { type: "heading", text: "Síntese da trilha completa" },
      {
        type: "paragraph",
        text: "Ao longo destes oito capítulos, vimos: humildade como início (Cap. 1), domínio próprio diante da provocação (Cap. 2), a palavra como ferramenta de vida e morte (Cap. 3), disciplina sem necessidade de vigilância (Cap. 4), amizade que afia em vez de só agradar (Cap. 5), riqueza tratada como meio, não como fim (Cap. 6), integridade quando ninguém está calculando o peso (Cap. 7) — e agora, fechando o círculo, a humildade novamente, dessa vez como maturidade final, não como ponto de partida ingênuo.",
      },
      {
        type: "paragraph",
        text: "Sabedoria, tanto em Provérbios quanto na filosofia grega, não é um destino que se alcança e se possui para sempre. É uma postura que se renova a cada nova borda do próprio entendimento.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma grande questão da sua vida (sentido, propósito, o que vem depois da morte, a origem de tudo) diante da qual você, como Agur, poderia admitir honestamente \"não sei\"?",
          "Olhando para os sete capítulos anteriores desta trilha, qual foi o que mais te desafiou a mudar algo concreto na prática?",
          "O pedido de Agur foi por suficiência, não por excesso nem por falta. Como seria, na sua vida hoje, essa mesma suficiência — nem pobreza, nem riqueza, apenas \"o pão que é necessário\"?",
        ],
      },
      { type: "footnote", text: CITATION_FOOTNOTE },
    ],
  },
];

// Conteúdo ainda não escrito — o livro aparece no hub como "Em breve"
// (0 capítulos) até o texto chegar, ver isso tratado em
// gotas-de-fe/index.tsx. Mesmo formato devocional de Provérbios: citação
// + reflexão + referência filosófica/histórica, não o texto bíblico cru.
const MARCOS_CHAPTERS: FaithChapter[] = [
  {
    number: 1,
    title: "O Paradoxo Absoluto",
    subtitle: "Uma voz do céu sobre um homem no rio",
    blocks: [
      { type: "quote", text: "\"Assim que Jesus saiu da água, viu o céu se abrindo e o Espírito descendo sobre ele como pomba. Então uma voz dos céus disse: Tu és o meu Filho amado; em ti me agrado.\" (Marcos 1:10-11, NVI)" },
      { type: "paragraph", text: "Marcos não perde tempo com genealogias ou narrativas de nascimento, como Mateus e Lucas. Ele abre o evangelho direto no rio Jordão, com um homem adulto sendo batizado por João — um rito para pecadores em arrependimento — e imediatamente identificado pelo céu como \"Filho amado\". A tensão está armada logo na primeira cena: por que o Filho de Deus se submete a um batismo de arrependimento, feito para pecadores?" },
      { type: "paragraph", text: "Essa tensão é o núcleo da **cristologia**: a doutrina sistemática que tenta articular como Jesus pode ser, ao mesmo tempo, plenamente divino e plenamente humano — não metade de cada coisa, mas as duas naturezas completas, sem mistura nem separação, na mesma pessoa. O Concílio de Calcedônia (451 d.C.) formalizaria essa fórmula séculos depois, mas a cena do batismo já a apresenta em ação, sem explicação teórica: o divino se submete voluntariamente ao rito humano." },
      { type: "heading", text: "Kierkegaard e o Paradoxo Absoluto" },
      { type: "paragraph", text: "O filósofo dinamarquês Søren Kierkegaard chamou a encarnação de \"o Paradoxo Absoluto\" — a afirmação de que o eterno entrou no tempo, que o infinito se fez finito, é, para Kierkegaard, literalmente incompreensível pela razão humana. Não porque seja ilógico como um \"círculo quadrado\", mas porque excede qualquer categoria que a razão consiga processar. A fé, para Kierkegaard, não é a conclusão de um raciocínio — é um **salto** (o famoso \"salto de fé\") justamente porque a razão, sozinha, nunca chega lá." },
      { type: "paragraph", text: "O deserto que vem logo em seguida no capítulo reforça esse paradoxo:" },
      { type: "quote", text: "\"Logo em seguida o Espírito o impeliu para o deserto, onde foi tentado por Satanás durante quarenta dias.\" (Marcos 1:12-13, NVI)" },
      { type: "paragraph", text: "O Filho amado, recém-aprovado pela voz celestial, é imediatamente exposto à tentação. Kierkegaard notaria aqui outra camada do paradoxo: a divindade plena não isenta da experiência humana da provação — pelo contrário, a experimenta genuinamente." },
      { type: "heading", text: "A autoridade que surpreende" },
      { type: "paragraph", text: "O capítulo fecha com Jesus ensinando \"como quem tem autoridade, e não como os mestres da lei\" (Marcos 1:22, NVI) e expulsando um espírito imundo com uma simples ordem. A reação da multidão — espanto, não compreensão plena — reflete exatamente a postura que Kierkegaard descreveria como a única honesta diante do Paradoxo Absoluto: não a explicação racional completa, mas o assombro que antecede (ou substitui) a fé." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "Marcos abre seu evangelho recusando-se a facilitar a questão da identidade de Jesus. Não há explicação teológica prévia, só a cena crua: um homem batizado como pecador, aprovado como Filho, tentado como qualquer ser humano, ensinando com autoridade que ninguém sabe explicar. Kierkegaard diria que essa é a única forma honesta de apresentar o paradoxo — deixando que ele permaneça paradoxo, em vez de dissolvê-lo prematuramente numa fórmula confortável." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma verdade da sua fé (ou da sua visão de mundo) que você tende a \"explicar demais\", perdendo o assombro genuíno diante dela?",
          "Kierkegaard fala de um \"salto\" que a razão sozinha não alcança. Existe alguma decisão importante na sua vida que também exigiu mais que pura lógica?",
          "A tentação no deserto vem logo depois da aprovação celestial. Que padrão isso sugere sobre momentos de afirmação seguidos de provação na sua própria experiência?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 2,
    title: "Quem Pode Perdoar?",
    subtitle: "Um teto aberto e uma acusação silenciosa",
    blocks: [
      { type: "quote", text: "\"Vendo a fé que eles tinham, Jesus disse ao paralítico: Filho, os seus pecados estão perdoados.\" (Marcos 2:5, NVI)" },
      { type: "paragraph", text: "A cena é quase cômica na sua logística: amigos de um paralítico, sem conseguir chegar até Jesus por causa da multidão, abrem um buraco no teto e descem o homem por ali. Mas o que Marcos destaca não é o milagre físico — é a frase que vem antes dele. Jesus não começa dizendo \"levante-se\". Ele começa declarando perdão de pecados, uma prerrogativa que os mestres da lei presentes reconhecem, corretamente, como exclusiva de Deus:" },
      { type: "quote", text: "\"Ele está blasfemando! Quem pode perdoar pecados, a não ser somente Deus?\" (Marcos 2:7, NVI)" },
      { type: "paragraph", text: "Essa é, teologicamente, uma das cenas mais diretas de auto-revelação cristológica em todo o evangelho — Jesus assume, sem hesitação, uma autoridade que os próprios opositores reconhecem como divina. A cura física que vem em seguida funciona quase como *prova* pública de uma afirmação que, sozinha, seria invisível: \"para que vocês saibam que o Filho do homem tem autoridade na terra para perdoar pecados... eu te ordeno, levante-se\" (Marcos 2:10-11, NVI)." },
      { type: "heading", text: "Anselmo e a lógica da satisfação" },
      { type: "paragraph", text: "Séculos depois, o teólogo Anselmo de Cantuária, em *Cur Deus Homo* (Por Que Deus Se Fez Homem), perguntaria: por que o perdão dos pecados exigiria a encarnação e a morte de Cristo, e não uma simples decisão divina de \"deixar passar\"? Sua resposta — a chamada teoria da satisfação — argumenta que o pecado é uma ofensa à honra e à ordem infinita de Deus, e que uma ofensa infinita exige uma satisfação proporcional, que nenhum ser humano finito poderia oferecer sozinho." },
      { type: "paragraph", text: "A cena do paralítico antecipa essa lógica de forma narrativa, não teórica: o perdão não é tratado como um gesto barato ou automático — ele é declarado por alguém que, segundo o próprio texto, precisaria ter autoridade equivalente à de Deus para fazê-lo com legitimidade." },
      { type: "heading", text: "Nietzsche e a suspeita sobre o perdão" },
      { type: "paragraph", text: "Vale colocar ao lado um contraponto crítico. Nietzsche, em *Genealogia da Moral*, via o perdão cristão com desconfiança — para ele, muitas vezes o perdão religioso disfarça o que chamou de *ressentiment*: uma impotência disfarçada de virtude, onde o fraco \"perdoa\" porque não tem poder para retaliar, e depois moraliza essa impotência como superioridade ética." },
      { type: "paragraph", text: "Colocar Nietzsche ao lado dessa cena serve como teste: o perdão que Jesus declara ao paralítico não nasce de impotência — vem de alguém que, no mesmo fôlego, demonstra poder físico concreto sobre a paralisia. Não é o perdão do fraco que não pode agir; é o perdão de quem, segundo a narrativa, tem autoridade total e escolhe exercê-la como cura e restauração, não como substituto de poder ausente." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "A cena do paralítico é, ao mesmo tempo, uma afirmação cristológica ousada (autoridade divina de perdoar) e uma antecipação, em miniatura, de perguntas que a teologia sistemática levaria séculos para formalizar: por que o perdão exige tanto, e o que distingue perdão genuíno de mera fraqueza disfarçada." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma situação em que você \"perdoou\" por impotência, no sentido que Nietzsche descreveria, em vez de por escolha genuína?",
          "A cura física, na cena, serve como prova visível de algo invisível (o perdão). Que \"provas visíveis\" você usa hoje para validar decisões ou convicções invisíveis?",
          "Anselmo argumenta que ofensas sérias exigem satisfação proporcional, não apenas ser \"deixadas passar\". Isso muda como você pensa sobre pedir ou conceder perdão em situações sérias da sua vida?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 3,
    title: "A Casa Dividida e o Pecado Sem Perdão",
    subtitle: "Uma acusação que se autodestrói",
    blocks: [
      { type: "quote", text: "\"Se um reino se dividir contra si mesmo, não poderá subsistir. E, se uma casa se dividir contra si mesma, tal casa não poderá subsistir.\" (Marcos 3:24-25, NVI)" },
      { type: "paragraph", text: "Os mestres da lei, incapazes de negar os exorcismos que Jesus realizava, propõem uma explicação alternativa: ele expulsaria demônios pelo poder do próprio \"príncipe dos demônios\". Jesus responde com uma simples observação lógica — nenhum reino, nenhuma casa, nenhum sistema sobrevive dividido contra si mesmo. Se Satanás estivesse expulsando Satanás, seu próprio domínio já teria ruído." },
      { type: "paragraph", text: "O que parece, à primeira vista, apenas um argumento lógico eficiente é também uma afirmação teológica sobre a natureza do mal: o mal, para se sustentar, precisa de coerência interna mínima — ele não pode, por definição, trabalhar sistematicamente contra si mesmo." },
      { type: "heading", text: "Agostinho e o mal como privação" },
      { type: "paragraph", text: "Agostinho de Hipona, um dos pais da teologia sistemática cristã, desenvolveu a ideia do mal como *privatio boni* — privação do bem, não uma substância própria e independente. Para Agostinho, o mal não é uma força positiva simétrica ao bem (como num dualismo); é a ausência, a corrupção, a distorção de algo que originalmente era bom. Um reino do mal \"dividido contra si mesmo\" faz sentido justamente nessa lógica: o mal não tem substância própria coesa o suficiente para se organizar como um verdadeiro reino rival e unificado — ele é sempre parasitário do bem que corrompe." },
      { type: "heading", text: "O pecado que não pode ser perdoado" },
      { type: "paragraph", text: "A parte mais teologicamente delicada do capítulo vem logo depois:" },
      { type: "quote", text: "\"Digo-lhes a verdade: Todos os pecados e blasfêmias serão perdoados aos homens, mas quem blasfemar contra o Espírito Santo nunca terá perdão; será culpado de pecado eterno.\" (Marcos 3:28-29, NVI)" },
      { type: "paragraph", text: "Esse versículo gerou séculos de debate em teologia sistemática (hamartiologia — a doutrina do pecado). A leitura mais consistente com o contexto imediato: a \"blasfêmia contra o Espírito\" não é um deslize pontual de linguagem, mas o estado de atribuir deliberadamente a obra visível e boa de Deus ao mal — exatamente o que os mestres da lei acabaram de fazer, chamando o Espírito que expulsava demônios de \"espírito imundo\". É menos sobre uma frase específica e mais sobre um endurecimento tão completo do coração que a própria capacidade de reconhecer o bem como bem se corrompe — e sem esse reconhecimento mínimo, não há arrependimento possível, e sem arrependimento, não há perdão possível." },
      { type: "heading", text: "O verdadeiro parentesco" },
      { type: "paragraph", text: "O capítulo fecha com Jesus redefinindo família:" },
      { type: "quote", text: "\"Quem faz a vontade de Deus, esse é meu irmão, minha irmã e minha mãe.\" (Marcos 3:35, NVI)" },
      { type: "paragraph", text: "Isso reforça o tema: pertencimento à \"casa\" de Jesus não é por parentesco biológico (estrutura externa), mas por alinhamento interno com a vontade de Deus — o oposto exato da casa dividida contra si mesma do início do capítulo. Uma casa unificada, aqui, é definida por coerência de vontade, não por laço de sangue." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo inteiro gira em torno de coerência interna versus divisão: um reino do mal não pode ter coerência real (Agostinho), um coração endurecido a ponto de chamar o bem de mal perde a capacidade de arrependimento genuíno, e a verdadeira família de Jesus se define pela coerência de vontade com Deus, não por estrutura externa." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Agostinho via o mal como corrupção do bem, não uma força independente. Isso muda como você pensa sobre lidar com más escolhas — suas ou de outros?",
          "Existe alguma área da sua vida onde há \"divisão interna\" — valores ou ações que competem entre si, minando sua própria coerência?",
          "O texto sugere que o endurecimento gradual do coração, não um ato isolado, é o que fecha a porta ao arrependimento. Que pequenos endurecimentos você percebe em si mesmo antes que se tornem padrão?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 4,
    title: "A Verdade Que Se Esconde Para Se Revelar",
    subtitle: "Por que falar em enigmas?",
    blocks: [
      { type: "quote", text: "\"Os discípulos lhe perguntaram sobre as parábolas, e ele respondeu: A vocês foi dado o mistério do Reino de Deus; mas aos que estão de fora tudo é dito por parábolas.\" (Marcos 4:10-11, NVI)" },
      { type: "paragraph", text: "À primeira vista, isso parece o oposto do que se esperaria de alguém tentando ensinar: por que usar histórias enigmáticas, em vez de explicação direta, se o objetivo é revelar verdade? Marcos aponta aqui para uma tensão central na **teologia da revelação**: a verdade divina não se impõe de forma neutra e igualmente acessível a qualquer observador — ela se revela de forma proporcional à disposição de quem escuta." },
      { type: "paragraph", text: "A parábola do semeador, logo no início do capítulo, já demonstra isso na própria estrutura: a mesma semente (a mesma palavra) produz resultados completamente diferentes dependendo do tipo de solo (a disposição de quem recebe). A revelação não falha por ser obscura — ela é recebida de formas diferentes porque os ouvintes chegam a ela de formas diferentes." },
      { type: "heading", text: "Platão e a caverna, invertida" },
      { type: "paragraph", text: "A alegoria da caverna de Platão, na *República*, descreve prisioneiros que confundem sombras projetadas na parede com a realidade — e o filósofo que sai da caverna, vê o sol (a verdadeira realidade), e ao voltar para explicar aos outros, é recebido com hostilidade e incompreensão, porque a verdade excede o que os prisioneiros têm categoria para processar." },
      { type: "paragraph", text: "Há uma inversão interessante entre as duas imagens. Em Platão, a verdade é acessível objetivamente para quem se dispõe ao esforço filosófico de sair da caverna — o problema está inteiramente na resistência de quem prefere ficar. Em Marcos, a parábola parece funcionar de forma mais relacional: não é um esforço puramente intelectual que abre o mistério do Reino, mas uma disposição do coração — os discípulos recebem explicação em particular não porque são mais inteligentes, mas porque estão dispostos a perguntar, a permanecer perto, a se importar com a resposta." },
      { type: "heading", text: "Kierkegaard e a comunicação indireta" },
      { type: "paragraph", text: "Kierkegaard, séculos depois, defenderia deliberadamente o uso de parábolas, pseudônimos e comunicação indireta como método filosófico-religioso — porque, para ele, certas verdades (especialmente as existenciais e espirituais) não podem ser simplesmente *transferidas* de uma cabeça para outra como informação neutra. Elas precisam ser *apropriadas* pessoalmente, e a comunicação direta, paradoxalmente, muitas vezes bloqueia essa apropriação — porque permite ao ouvinte processar a ideia intelectualmente sem nunca se confrontar existencialmente com ela." },
      { type: "paragraph", text: "Isso ilumina por que Jesus, segundo Marcos, prefere a parábola: ela obriga quem escuta a se envolver ativamente, a decidir se vai investigar mais fundo — exatamente o padrão que separa os discípulos (que perguntam) da multidão (que ouve e vai embora)." },
      { type: "heading", text: "O poder sobre o caos" },
      { type: "paragraph", text: "O capítulo fecha com a tempestade acalmada:" },
      { type: "quote", text: "\"Ele se levantou, repreendeu o vento e disse ao mar: Aquiete-se! Acalme-se! O vento se aquietou, e fez-se completa bonança.\" (Marcos 4:39, NVI)" },
      { type: "paragraph", text: "No imaginário do Antigo Testamento, o domínio sobre o mar caótico era prerrogativa exclusivamente divina (como em Jó 38 e nos Salmos). A cena reforça, em ação, o que as parábolas comunicam em palavras veladas: a identidade daquele que fala não é uma questão de simples informação — é algo que se revela a quem presta atenção o suficiente para perguntar \"quem é este, que até o vento e o mar lhe obedecem?\" (Marcos 4:41, NVI)." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "Revelação, em Marcos, não é distribuição neutra de informação — é um convite que exige disposição para se aproximar e perguntar. Platão aponta para o esforço intelectual necessário; Kierkegaard, para a apropriação existencial pessoal. Os dois, juntos, ajudam a entender por que a verdade mais importante do evangelho chega, deliberadamente, em forma de história — e não de definição." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma verdade importante da sua vida que você só compreendeu de fato depois de vivê-la, não apenas de ouvi-la explicada?",
          "Kierkegaard diria que informação direta às vezes impede apropriação genuína. Onde isso pode estar acontecendo com você — sabendo algo \"de cabeça\" sem nunca ter se confrontado com isso de verdade?",
          "Qual \"solo\" você tem sido, ultimamente, diante de ideias ou verdades importantes que chegam até você — raso, espinhoso, ou fértil?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 5,
    title: "Poder Sobre o Caos, a Doença e a Morte",
    subtitle: "Três formas de desordem, uma única resposta",
    blocks: [
      { type: "paragraph", text: "O capítulo 5 de Marcos é estruturado como uma progressão deliberada: primeiro um homem dominado por uma legião de espíritos imundos, vivendo entre túmulos; depois uma mulher com um fluxo de sangue havia doze anos, ritualmente impura e socialmente isolada; por fim, uma menina de doze anos, já morta quando Jesus chega. Caos espiritual, deterioração física crônica, e morte — as três formas mais radicais de desordem que a existência humana enfrenta — aparecem em sequência, e as três recebem a mesma resposta: restauração completa." },
      { type: "quote", text: "\"Vá em paz e fique curada do seu sofrimento.\" (Marcos 5:34, NVI)" },
      { type: "quote", text: "\"Talita cumi!, que significa: Menina, eu ordeno que você se levante!\" (Marcos 5:41, NVI)" },
      { type: "heading", text: "Kierkegaard e a doença mortal" },
      { type: "paragraph", text: "Kierkegaard escreveu um tratado inteiro chamado *O Desespero Humano* (também traduzido como *A Doença Mortal*), no qual argumenta que a verdadeira \"doença mortal\" não é a morte física, mas o desespero — a desconexão da pessoa consigo mesma e com Deus. Para ele, existem formas de desespero que nem sequer são percebidas como tal: alguém pode parecer plenamente funcional e ainda estar em desespero profundo, simplesmente por não reconhecer a própria condição." },
      { type: "paragraph", text: "O endemoninhado gadareno é uma imagem quase literal dessa ideia levada ao extremo físico: um homem tão fragmentado internamente (\"Legião é o meu nome, porque somos muitos\", Marcos 5:9, NVI) que vive entre os mortos, incapaz de ser contido por correntes. A cura não é apenas expulsão de espíritos — é a restauração de uma identidade unificada: quando as pessoas chegam depois, encontram o homem \"vestido e em perfeito juízo\" (Marcos 5:15, NVI). O oposto exato da fragmentação anterior." },
      { type: "heading", text: "A fé que toca sem pedir permissão" },
      { type: "paragraph", text: "A mulher com o fluxo de sangue age de forma silenciosa e quase desesperada — ela não pede, apenas toca a borda do manto de Jesus, convencida de que isso bastaria. A resposta de Jesus não trata isso como acidente mágico, mas reconhece a fé por trás do gesto: \"sua fé a curou\" (Marcos 5:34, NVI). Teologicamente, isso reforça um princípio recorrente em Marcos: o poder divino responde à disposição de aproximação, não a fórmulas ou rituais corretos." },
      { type: "heading", text: "A morte tratada como sono" },
      { type: "paragraph", text: "Diante da menina já morta, Jesus faz uma afirmação que soa quase absurda aos presentes: \"a menina não está morta, mas dormindo\" (Marcos 5:39, NVI), o que gera zombaria imediata. A frase não nega a realidade física da morte — nega seu caráter definitivo diante do poder que está prestes a agir. Isso antecipa, em miniatura, o tema central que só será plenamente resolvido no capítulo 16: a morte, na estrutura teológica do evangelho, não é o ponto final absoluto que parece ser." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "As três curas do capítulo formam uma escada teológica: poder sobre a fragmentação interior, poder sobre a deterioração física crônica, poder sobre a morte em si. Kierkegaard ajuda a nomear a primeira camada — o desespero como doença mais profunda que qualquer sintoma visível — mas as três cenas juntas apontam para uma afirmação maior do que qualquer categoria filosófica isolada consegue conter: nenhuma forma de desordem humana está fora do alcance dessa restauração." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Kierkegaard fala de formas de desespero que passam despercebidas por quem as vive. Existe alguma \"fragmentação\" na sua vida que, de fora, parece controlada, mas por dentro não está?",
          "A mulher agiu por fé silenciosa, sem pedir permissão formal. Existe alguma situação em que você está esperando \"permissão\" ou \"condições perfeitas\" para agir, quando um gesto simples de aproximação já bastaria?",
          "Jesus trata a morte como algo não definitivo diante do poder que ele representa. Como essa ideia, se levada a sério, mudaria a forma como você encara suas maiores perdas ou medos?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 6,
    title: "O Milagre e Quem Está Disposto a Vê-lo",
    subtitle: "Um profeta sem honra na própria terra",
    blocks: [
      { type: "quote", text: "\"Jesus lhes disse: Só em sua terra, entre seus parentes e em sua própria casa é que um profeta não tem honra. Ele não pôde fazer milagres ali, a não ser impor as mãos sobre alguns doentes e curá-los. E ficou admirado com a incredulidade deles.\" (Marcos 6:4-6, NVI)" },
      { type: "paragraph", text: "Há algo teologicamente notável nessa passagem: o texto sugere uma limitação real na ação miraculosa de Jesus em Nazaré, associada diretamente à incredulidade coletiva. Isso não encaixa numa visão simplista de onipotência mecânica e indiferente ao contexto humano — a narrativa apresenta o poder divino operando em relação genuína com a disposição de quem recebe, não como força bruta imposta sobre qualquer resistência." },
      { type: "paragraph", text: "Logo depois, o capítulo narra dois dos milagres mais conhecidos do evangelho: a multiplicação dos pães para cerca de cinco mil pessoas, e Jesus caminhando sobre o mar da Galileia — ambos, ao contrário de Nazaré, diante de multidões e discípulos em contextos de necessidade real e atenção genuína." },
      { type: "heading", text: "Hume e o problema epistemológico do milagre" },
      { type: "paragraph", text: "David Hume, no ensaio \"Sobre os Milagres\", argumentou que nunca seria racional acreditar num relato de milagre, porque a evidência da experiência uniforme (as leis da natureza sempre observadas) sempre pesará mais do que o testemunho de uma exceção — por mais confiável que o relato pareça. Para Hume, é sempre mais provável que o relator esteja enganado, mentindo ou exagerando do que que a lei natural tenha sido genuinamente violada." },
      { type: "paragraph", text: "É um argumento poderoso, e vale apresentá-lo com justiça — mas também vale notar sua limitação lógica, apontada por filósofos posteriores (como C.S. Lewis, mais teólogo que filósofo estrito, mas útil aqui): o argumento de Hume pressupõe, antes mesmo de examinar qualquer caso específico, que milagres são impossíveis — o que faz da conclusão praticamente uma repetição da premissa, não uma investigação aberta da evidência." },
      { type: "paragraph", text: "Marcos, interessantemente, não parece interessado em convencer o cético relutante através de prova acumulada — o padrão do evangelho é: o milagre acontece diante de quem já está disposto a se aproximar (a multidão faminta, os discípulos assustados no barco), e é limitado justamente onde a disposição está ausente (Nazaré). Isso desloca o debate de \"os milagres são fisicamente possíveis?\" para \"que tipo de relação epistemológica a fé exige, diferente de prova bruta e impessoal?\"" },
      { type: "heading", text: "Caminhando sobre o caos, de novo" },
      { type: "quote", text: "\"Quando os discípulos o viram andando sobre o mar, pensaram que fosse um fantasma e gritaram... Mas Jesus imediatamente falou com eles: Coragem! Sou eu. Não tenham medo.\" (Marcos 6:49-50, NVI)" },
      { type: "paragraph", text: "A cena ecoa diretamente o capítulo 4 (a tempestade acalmada) — de novo, poder sobre o mar caótico, associado no Antigo Testamento exclusivamente a Deus. A frase \"sou eu\" no grego original carrega ecos da autorrevelação divina do Êxodo (\"Eu Sou o que Sou\"). Mesmo os discípulos, que já haviam testemunhado tanto, reagem com medo, não reconhecimento imediato — reforçando que a revelação, mesmo repetida, não se torna automática ou óbvia." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 6 apresenta uma tensão real entre poder divino e disposição humana — não como contradição da onipotência, mas como retrato consistente de uma revelação relacional, não mecânica. Hume desafia a racionalidade de aceitar qualquer milagre; Marcos responde, implicitamente, que a questão nunca foi só sobre prova acumulada, mas sobre que tipo de aproximação a fé exige." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma área da sua vida onde sua própria falta de disposição (\"terra natal\", familiaridade excessiva) pode estar limitando o que você consegue ver ou receber?",
          "Hume exige prova esmagadora antes de aceitar qualquer exceção às regras conhecidas. Existe alguma convicção sua que você também trata assim — exigindo prova impossível antes de reconsiderar?",
          "Os discípulos, mesmo depois de tanta experiência, ainda reagiram com medo diante do desconhecido. Que \"fantasmas\" você ainda confunde com coisas que, de perto, seriam reconhecíveis e familiares?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 7,
    title: "O Que Realmente Contamina",
    subtitle: "Mãos sujas, coração limpo",
    blocks: [
      { type: "quote", text: "\"Nada que entra no homem, vindo de fora, pode torná-lo impuro; mas o que sai do homem é que o torna impuro... Pois é do interior do coração dos homens que procedem os maus pensamentos.\" (Marcos 7:15, 21, NVI)" },
      { type: "paragraph", text: "Os fariseus criticam os discípulos por comerem sem o ritual de lavagem das mãos exigido pela tradição dos anciãos — uma prática que havia se tornado, na prática religiosa da época, tão importante quanto a própria lei escrita. Jesus responde com uma inversão radical: a contaminação moral não vem de fora para dentro (comida, ritual, contato externo), mas de dentro para fora — do coração humano." },
      { type: "paragraph", text: "Essa é uma afirmação central de **antropologia teológica**: a doutrina sobre a natureza humana e a origem do pecado. O texto localiza a raiz do problema moral não em circunstâncias externas ou falhas de conformidade ritual, mas numa condição interna que precede qualquer ato — o coração como fonte, não os atos isolados como causa primeira." },
      { type: "heading", text: "Kant e a boa vontade" },
      { type: "paragraph", text: "Immanuel Kant, na *Fundamentação da Metafísica dos Costumes*, abre com uma afirmação famosa: \"nada no mundo, ou mesmo fora dele, pode ser considerado bom sem qualificação, exceto uma boa vontade.\" Para Kant, o valor moral de uma ação não está no resultado nem na conformidade externa a uma regra, mas na intenção — na qualidade da vontade por trás do ato. Duas pessoas podem realizar exatamente a mesma ação externa (por exemplo, pagar uma dívida) por motivos completamente diferentes — uma por dever genuíno, outra por medo de ser pega — e, para Kant, apenas a primeira tem valor moral real." },
      { type: "paragraph", text: "Há uma ressonância clara com a crítica de Jesus aos fariseus: a conformidade externa perfeita ao ritual (mãos lavadas corretamente) não garante nada sobre a condição interna da vontade. Onde Kant fala de \"boa vontade\" como origem do valor moral, o texto de Marcos fala do \"coração\" como origem tanto do bem quanto do mal — ambos deslocam o centro de gravidade ético do comportamento observável para a disposição interior que o precede." },
      { type: "heading", text: "A mulher sirofenícia: fé que atravessa fronteiras" },
      { type: "paragraph", text: "A segunda metade do capítulo narra um episódio desconcertante: uma mulher grega, de origem sirofenícia, pede a Jesus que cure sua filha, e a resposta inicial dele soa quase ríspida — \"não é certo tirar o pão dos filhos e lançá-lo aos cachorrinhos\" (Marcos 7:27, NVI), referindo-se à prioridade da missão para Israel. A mulher responde com uma réplica notável: \"mesmo os cachorrinhos, debaixo da mesa, comem as migalhas que caem da mesa dos filhos\" (Marcos 7:28, NVI)." },
      { type: "paragraph", text: "Jesus elogia sua resposta e cura a filha à distância. Teologicamente, o episódio antecipa um tema que se tornará central mais tarde no Novo Testamento (nas cartas de Paulo): a graça não está confinada por fronteiras étnicas ou rituais — ela responde à fé genuína, de dentro para fora, independentemente da origem externa de quem a demonstra. É o mesmo princípio do início do capítulo, aplicado agora não à comida, mas à identidade e pertencimento." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 7 desloca, duas vezes, o critério moral e espiritual do externo para o interno: primeiro na questão da pureza ritual (o coração, não a comida, contamina), depois na questão da identidade étnica (a fé, não a origem, qualifica). Kant oferece um paralelo filosófico rigoroso para a primeira parte — o valor está na disposição da vontade, não na conformidade observável." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma área da sua vida onde você mantém conformidade externa perfeita, mas sabe que o \"coração\" por trás dela não está alinhado?",
          "Kant diferencia ação por dever genuíno de ação por medo de consequência. Ao rever suas próprias ações recentes, qual motivação predominou?",
          "A mulher sirofenícia insiste, mesmo diante de uma resposta inicial desanimadora. Existe alguma \"fronteira\" (de origem, de mérito, de pertencimento) que você deixa te impedir de insistir em algo importante?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 8,
    title: "Quem Vocês Dizem Que Eu Sou?",
    subtitle: "A pergunta que exige uma resposta pessoal",
    blocks: [
      { type: "quote", text: "\"E vocês, quem dizem que eu sou?\" Pedro respondeu: \"Tu és o Cristo.\" (Marcos 8:29, NVI)" },
      { type: "paragraph", text: "Depois de coletar opiniões de terceiros (\"alguns dizem João Batista, outros Elias, outros um dos profetas\"), Jesus muda o registro da pergunta de forma decisiva: não \"o que as pessoas dizem\", mas \"o que vocês dizem\". A confissão de Pedro é o ponto central estrutural do evangelho de Marcos — o momento em que a identidade messiânica de Jesus, até então velada em parábolas e ações ambíguas, é finalmente declarada abertamente, ainda que só entre os discípulos." },
      { type: "paragraph", text: "Mas a cena não termina em triunfo. Imediatamente depois:" },
      { type: "quote", text: "\"Ele começou a ensinar-lhes que era necessário que o Filho do homem sofresse muitas coisas... fosse morto e ressuscitasse depois de três dias.\" (Marcos 8:31, NVI)" },
      { type: "paragraph", text: "Pedro, o mesmo que acabara de confessar corretamente a identidade de Jesus, reage repreendendo-o — e recebe de volta uma das repreensões mais duras do evangelho: \"Para trás de mim, Satanás! Você não pensa nas coisas de Deus, mas nas dos homens.\" (Marcos 8:33, NVI)" },
      { type: "heading", text: "Lutero: teologia da cruz contra teologia da glória" },
      { type: "paragraph", text: "Martinho Lutero, nos seus primeiros escritos (a Disputa de Heidelberg, 1518), distingue entre uma \"teologia da glória\" (*theologia gloriae*) — que busca conhecer a Deus através de poder, sucesso visível e força — e uma \"teologia da cruz\" (*theologia crucis*) — que reconhece a Deus precisamente no lugar oposto: sofrimento, fraqueza aparente, derrota visível. Para Lutero, Pedro personifica exatamente o erro da teologia da glória: ele aceita corretamente \"Jesus é o Cristo\", mas rejeita instintivamente a ideia de que esse Cristo passaria pelo sofrimento — porque isso contraria toda expectativa de como o poder de Deus deveria se manifestar." },
      { type: "paragraph", text: "A repreensão de Jesus a Pedro é, nesse sentido, uma correção cristológica precisa: confessar a identidade certa (Cristo) com a expectativa errada (glória sem cruz) ainda é, segundo o texto, pensar \"nas coisas dos homens\"." },
      { type: "heading", text: "Carregar a própria cruz" },
      { type: "paragraph", text: "O capítulo fecha com uma das exigências mais radicais do evangelho:" },
      { type: "quote", text: "\"Se alguém quer ser meu discípulo, negue-se a si mesmo, tome a sua cruz e siga-me. Pois quem quiser salvar a sua vida a perderá; mas quem perder a sua vida por minha causa e pelo evangelho, a salvará.\" (Marcos 8:34-35, NVI)" },
      { type: "heading", text: "Kierkegaard e o eu autêntico" },
      { type: "paragraph", text: "Kierkegaard argumentava que o eu genuíno não se constrói por autoafirmação, mas por uma relação correta consigo mesmo diante de Deus — o que frequentemente exige negar o eu superficial (construído por comparação social, ambição, medo) para alcançar o eu verdadeiro. \"Perder a vida para salvá-la\" não é masoquismo — é o reconhecimento de que o eu construído sobre autopreservação a qualquer custo é, paradoxalmente, o eu que menos vive de verdade." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 8 marca a virada cristológica do evangelho: a identidade de Jesus como Cristo é finalmente confessada, mas imediatamente redefinida — não como poder triunfante, mas como caminho de sofrimento e entrega. Lutero nomeia essa inversão como o centro da teologia cristã; Kierkegaard mostra como ela se aplica, de forma pessoal, a qualquer um que decida seguir esse caminho." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma área da sua vida onde você, como Pedro, aceita a verdade certa mas rejeita instintivamente o caminho difícil que ela exige?",
          "Lutero distingue buscar Deus no poder visível versus buscá-lo no sofrimento e na fraqueza aparente. Onde você tem procurado sentido — mais no sucesso visível, ou também no que é difícil e invisível?",
          "Kierkegaard fala de um \"eu superficial\" construído por autopreservação. Que parte de você — hábito, imagem, ambição — talvez precise ser \"negada\" para que algo mais verdadeiro possa emergir?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 9,
    title: "A Glória Que Se Esconde",
    subtitle: "Um véu momentaneamente retirado",
    blocks: [
      { type: "quote", text: "\"Ali foi transfigurado diante deles. Suas roupas se tornaram de um branco resplandecente, branco como a neve, de um branco que nenhum lavandeiro na terra jamais conseguiria dar-lhes.\" (Marcos 9:2-3, NVI)" },
      { type: "paragraph", text: "No topo de um monte, diante de apenas três discípulos, algo da glória divina de Jesus se torna momentaneamente visível — a mesma glória que, no resto do evangelho, permanece velada sob a aparência humana comum. Moisés e Elias aparecem conversando com ele, representando a Lei e os Profetas, e a voz do céu repete quase literalmente a declaração do batismo, no capítulo 1: \"Este é o meu Filho amado. Escutem-no.\" (Marcos 9:7, NVI)" },
      { type: "paragraph", text: "O episódio ocorre logo depois da previsão da paixão, no capítulo anterior, e imediatamente antes de uma segunda previsão da paixão, neste mesmo capítulo. A glória, estruturalmente, está encaixada entre dois anúncios de sofrimento — não como alternativa a ele, mas em tensão direta com ele." },
      { type: "heading", text: "Pascal e o Deus escondido" },
      { type: "paragraph", text: "Blaise Pascal, nos *Pensamentos*, reflete extensamente sobre o que chama de *Deus absconditus* — o Deus que se esconde. Para Pascal, se Deus se revelasse de forma plena e inegável o tempo todo, a fé deixaria de ser fé — tornaria-se coação intelectual, sem espaço para a liberdade de resposta do coração. Mas se Deus permanecesse totalmente oculto, sem nenhum vislumbre, a busca sincera não teria por onde começar. Pascal argumenta que Deus se revela \"o suficiente para quem o busca de coração, e se esconde o suficiente para quem não busca\" — um equilíbrio deliberado, não uma falha de comunicação." },
      { type: "paragraph", text: "A transfiguração é exatamente esse vislumbre momentâneo, dado a um grupo pequeno e específico, e imediatamente seguido pela ordem de não contar a ninguém \"até que o Filho do homem ressuscitasse dos mortos\" (Marcos 9:9, NVI). A glória é real, mas deliberadamente contida — coerente com o padrão pascaliano de revelação parcial, suficiente e não coercitiva." },
      { type: "heading", text: "O menino, o pai e a fé imperfeita" },
      { type: "paragraph", text: "A segunda metade do capítulo narra a cura de um menino com um espírito que o fazia convulsionar. O pai, diante da dúvida, faz uma das confissões mais honestas de todo o evangelho:" },
      { type: "quote", text: "\"Creio! Ajuda-me a vencer a minha incredulidade!\" (Marcos 9:24, NVI)" },
      { type: "paragraph", text: "Não é uma fé perfeita e sem dúvida — é uma fé que admite sua própria insuficiência enquanto ainda se dirige a Jesus. Teologicamente, isso resiste a uma visão de fé como certeza absoluta e sem fissuras; a narrativa acolhe a fé genuína mesmo quando ela vem misturada com dúvida confessada." },
      { type: "heading", text: "Quem é o maior?" },
      { type: "paragraph", text: "O capítulo fecha com os discípulos discutindo, no caminho, quem seria o maior entre eles — e Jesus respondendo com uma inversão radical: \"se alguém quiser ser o primeiro, será o último de todos e servo de todos\" (Marcos 9:35, NVI), colocando uma criança no meio deles como ilustração. A glória momentânea do monte e a grandeza que os discípulos ainda perseguem operam em lógicas opostas — uma se esconde por escolha, a outra se afirma por ambição." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 9 mantém, lado a lado, glória velada e sofrimento anunciado, fé genuína e dúvida confessada, grandeza verdadeira e ambição invertida. Pascal ajuda a entender por que a revelação divina, neste evangelho, nunca é total nem ausente — é sempre proporcional, um convite, não uma imposição." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pascal fala de um Deus que se revela o suficiente para quem busca, e se esconde para quem não busca. Existe alguma verdade importante na sua vida que só ficou visível depois que você realmente começou a procurar?",
          "A confissão do pai — \"creio, ajuda-me a vencer minha incredulidade\" — mistura fé e dúvida na mesma frase. Existe alguma convicção sua que também vive nessa mistura honesta, em vez de certeza absoluta?",
          "Os discípulos discutiam grandeza por comparação. Onde, na sua vida, a busca por ser \"o maior\" poderia ser substituída por a busca de servir sem precisar de reconhecimento?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 10,
    title: "Servir em Vez de Dominar",
    subtitle: "Um homem que se vai triste",
    blocks: [
      { type: "quote", text: "\"Vá, venda tudo o que você tem e dê aos pobres, e você terá um tesouro no céu; então, venha e siga-me. Sua fisionomia mudou, e ele se foi triste, pois possuía muitos bens.\" (Marcos 10:21-22, NVI)" },
      { type: "paragraph", text: "O jovem se aproxima cumprindo perfeitamente os mandamentos externos e perguntando o que ainda falta para herdar a vida eterna. A resposta de Jesus não acrescenta mais uma regra à lista — ela expõe a única coisa que o jovem ainda não havia colocado sob autoridade de Deus: sua riqueza. A reação dos discípulos (\"quem então pode ser salvo?\", Marcos 10:26) revela o choque de uma cultura que via prosperidade material como sinal de bênção divina, não como possível obstáculo." },
      { type: "heading", text: "A pergunta ambiciosa de Tiago e João" },
      { type: "paragraph", text: "Logo depois, dois dos discípulos mais próximos pedem os lugares de honra ao lado de Jesus \"em sua glória\" (Marcos 10:37, NVI). A resposta de Jesus reformula radicalmente o que significa grandeza dentro do movimento que ele lidera:" },
      { type: "quote", text: "\"Vocês sabem que os que são considerados governantes das nações as dominam, e os seus altos oficiais exercem poder sobre elas. Mas não é assim entre vocês. Ao contrário, quem quiser tornar-se grande entre vocês deverá ser servo... pois o Filho do homem não veio para ser servido, mas para servir.\" (Marcos 10:42-45, NVI)" },
      { type: "heading", text: "Nietzsche e a vontade de poder, invertida" },
      { type: "paragraph", text: "Nietzsche descreveu a \"vontade de poder\" (*Wille zur Macht*) como o impulso fundamental e legítimo de toda vida — a busca por expansão, domínio, superação. Para ele, a moral cristã de humildade e servidão era, na melhor das hipóteses, uma inversão artificial e decadente desse impulso natural — o que ele chamou de \"moral de escravos\", nascida do ressentimento de quem não tem poder para dominar." },
      { type: "paragraph", text: "Vale colocar essa crítica lado a lado com o texto, com justiça: Marcos 10 não apresenta o servir como resignação de quem não tem outra opção. Jesus, segundo a estrutura teológica do próprio evangelho, é apresentado com autoridade máxima (sobre demônios, doenças, morte, natureza) — ele não serve por impotência, mas por escolha deliberada, a partir de uma posição de poder genuíno. Isso é exatamente o oposto do diagnóstico de Nietzsche: não é fraqueza disfarçada de virtude, é força que escolhe conscientemente não dominar. A subversão não está em negar poder — está em recusar usá-lo como as \"nações\" o usam." },
      { type: "heading", text: "Bartimeu: fé que não aceita silêncio" },
      { type: "paragraph", text: "O capítulo fecha com o mendigo cego Bartimeu gritando por Jesus, sendo repreendido pela multidão para ficar quieto, e gritando ainda mais alto: \"Filho de Davi, tem misericórdia de mim!\" (Marcos 10:48, NVI). Curado, ele imediatamente \"seguiu Jesus pelo caminho\" (Marcos 10:52, NVI) — tornando-se, literalmente, um discípulo no sentido mais simples da palavra: alguém que segue." },
      { type: "paragraph", text: "Bartimeu funciona como contraste direto ao jovem rico: um tinha tudo e foi embora triste; o outro não tinha nada, insistiu apesar da resistência social, e seguiu." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 10 desmonta duas formas comuns de buscar segurança e status — riqueza material e posição de honra — e as substitui por um modelo de grandeza fundado em serviço deliberado, não em impotência disfarçada. Nietzsche oferece o contraponto mais afiado a essa ideia; o próprio texto responde mostrando poder genuíno escolhendo, por vontade própria, o caminho oposto ao domínio." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma \"posse\" (não necessariamente dinheiro — pode ser reputação, controle, uma identidade) que você teria dificuldade de entregar se fosse pedido diretamente?",
          "Nietzsche via servir como fraqueza disfarçada. Você consegue distinguir, na sua própria vida, entre servir por impotência e servir por escolha deliberada a partir de uma posição de força?",
          "Bartimeu insistiu apesar da multidão tentando silenciá-lo. Existe algo importante que você parou de pedir ou buscar porque as pessoas ao redor sugeriram que ficasse quieto?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 11,
    title: "Que Autoridade É Essa?",
    subtitle: "Uma árvore amaldiçoada como sinal",
    blocks: [
      { type: "quote", text: "\"Vendo de longe uma figueira com folhas, foi ver se encontrava nela algum fruto... e disse: Nunca mais ninguém coma fruto de você! E os discípulos ouviram isso.\" (Marcos 11:13-14, NVI)" },
      { type: "paragraph", text: "Marcos usa aqui uma técnica narrativa característica sua — intercalar duas cenas, uma \"dentro\" da outra, para que se interpretem mutuamente: a maldição da figueira sem frutos envolve, nos dois lados, a purificação do templo. Jesus entra em Jerusalém, expulsa os vendedores do templo dizendo \"minha casa será chamada casa de oração para todas as nações, mas vocês a transformaram num covil de ladrões\" (Marcos 11:17, NVI), e a figueira — que tinha folhas (aparência de vida) mas nenhum fruto — seca até a raiz." },
      { type: "paragraph", text: "A leitura estruturalmente mais consistente: o templo, como a figueira, tem aparência exterior de vitalidade religiosa (folhas), mas não está produzindo o fruto que deveria (oração genuína, justiça, acolhimento das nações) — e ambos recebem o mesmo julgamento profético simbólico." },
      { type: "heading", text: "Weber e os tipos de autoridade" },
      { type: "paragraph", text: "O sociólogo Max Weber distinguiu três tipos ideais de autoridade legítima: **tradicional** (baseada em costume estabelecido — \"sempre foi assim\"), **legal-racional** (baseada em regras e cargos formalmente definidos) e **carismática** (baseada na qualidade pessoal excepcional reconhecida por seguidores, independente de cargo ou tradição)." },
      { type: "paragraph", text: "Quando os líderes religiosos confrontam Jesus — \"com que autoridade você faz essas coisas? Quem lhe deu autoridade para fazê-las?\" (Marcos 11:28, NVI) — eles estão, na prática, exigindo que ele se encaixe nas categorias tradicionais ou legais que eles reconhecem e controlam. Jesus responde com uma contra-pergunta sobre a autoridade de João Batista, colocando-os numa armadilha lógica: se disserem que a autoridade de João era divina, terão de explicar por que não creram nele; se disserem que era apenas humana, temerão a reação popular. Eles recusam responder, e Jesus também recusa identificar formalmente a fonte da própria autoridade." },
      { type: "paragraph", text: "Essa recusa é, ela mesma, teologicamente significativa: a autoridade que Jesus exerce ao longo do evangelho — sobre doenças, demônios, natureza, e agora sobre o próprio templo — não se encaixa perfeitamente em nenhuma das três categorias de Weber. Não é tradicional (ele rompe tradições estabelecidas), não é legal-racional (ele não ocupa cargo religioso reconhecido), e \"carismática\" descreve o efeito sobre as multidões, mas não explica sua origem. O texto parece deliberadamente resistir à domesticação da autoridade de Jesus em qualquer categoria puramente sociológica." },
      { type: "heading", text: "Fé que move montanhas" },
      { type: "paragraph", text: "Quando os discípulos notam a figueira seca, Jesus responde com uma afirmação sobre fé e oração:" },
      { type: "quote", text: "\"Se alguém disser a este monte: Levante-se e atire-se no mar, e não duvidar em seu coração, mas crer que acontecerá o que disser, assim lhe será feito.\" (Marcos 11:23, NVI)" },
      { type: "paragraph", text: "Colocado logo após o julgamento do templo, o ensinamento ganha uma leitura mais específica do que costuma receber isoladamente: \"este monte\" provavelmente aponta para o próprio Monte do Templo, à vista deles. A fé genuína, aqui, não é fórmula mágica para desejos pessoais, mas confiança de que a velha estrutura religiosa — mesmo parecendo permanente e inabalável como uma montanha — pode ser removida diante de algo novo que Deus está fazendo." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 11 questiona diretamente que tipo de autoridade legitima ação religiosa e espiritual — e recusa, deliberadamente, as categorias sociológicas convencionais que Weber descreveria. A figueira sem fruto e o templo sem oração genuína compartilham o mesmo diagnóstico: aparência sem substância real." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma área da sua vida (profissional, espiritual, pessoal) com \"folhas\" visíveis — boa aparência externa — mas sem fruto real por trás?",
          "Weber descreve autoridade tradicional como \"sempre foi assim\". Existe alguma prática ou crença sua que você mantém só por tradição, sem nunca ter examinado se ainda produz fruto?",
          "A fé descrita aqui não é sobre desejos pessoais, mas sobre confiar que estruturas antigas e aparentemente permanentes podem mudar. Que \"montanha\" na sua vida você trata como imutável, sem nunca ter realmente testado essa suposição?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 12,
    title: "O Mandamento Que Resume Todos os Outros",
    subtitle: "Uma pergunta honesta em meio a armadilhas",
    blocks: [
      { type: "paragraph", text: "O capítulo 12 é uma sequência de confrontos: uma parábola de julgamento (os lavradores maus), uma armadilha política sobre pagar impostos a César, uma tentativa dos saduceus de ridicularizar a ressurreição com um cenário hipotético absurdo. No meio dessa hostilidade acumulada, um mestre da lei faz uma pergunta que parece genuinamente sincera: \"qual é o mandamento mais importante de todos?\" (Marcos 12:28, NVI)" },
      { type: "quote", text: "\"O mais importante é: Ouça, Israel, o Senhor, o nosso Deus, é o único Senhor. Ame o Senhor, o seu Deus, de todo o seu coração, de toda a sua alma, de todo o seu entendimento e de todas as suas forças. O segundo é: Ame o seu próximo como a si mesmo. Não há mandamento maior do que estes.\" (Marcos 12:29-31, NVI)" },
      { type: "heading", text: "Kant e o dever formal" },
      { type: "paragraph", text: "Immanuel Kant construiu sua ética em torno do **imperativo categórico**: aja apenas segundo uma máxima que você poderia querer que se tornasse lei universal. É uma ética baseada em dever racional, formal, aplicável de forma consistente e impessoal a qualquer situação — a virtude, para Kant, está em agir corretamente *por dever*, independente de inclinação emocional." },
      { type: "paragraph", text: "O mandamento que Jesus cita não é formal nesse mesmo sentido — não é uma regra universal e impessoal de conduta, mas uma exigência de *amor*, dirigida a Deus e ao próximo, envolvendo coração, alma, entendimento e força — a pessoa inteira, não apenas a vontade racional isolada. Há uma diferença estrutural importante: onde Kant busca uma ética que funcione mesmo sem inclinação (o dever cumprido \"apesar de\" não sentir vontade), o mandamento maior exige a própria inclinação transformada — amar de coração, não apenas obedecer com correção formal. Não é ausência de regra — é uma regra que só se cumpre genuinamente quando o próprio desejo está alinhado com ela, o que a coloca além do puro formalismo kantiano, ainda que compartilhe com Kant a ambição de resumir toda a ética moral numa única exigência coerente." },
      { type: "heading", text: "A viúva e o verdadeiro valor da oferta" },
      { type: "paragraph", text: "O capítulo fecha com uma cena silenciosa, em contraste com toda a hostilidade anterior:" },
      { type: "quote", text: "\"Ele chamou seus discípulos e disse: Digo-lhes a verdade: esta pobre viúva depositou mais do que todos os outros que contribuíram para o tesouro. Todos deram do que lhes sobrava; mas ela, da sua pobreza, deu tudo o que tinha para viver.\" (Marcos 12:43-44, NVI)" },
      { type: "paragraph", text: "O valor de uma oferta, aqui, não é medido pela quantia absoluta, mas pela proporção de entrega real em relação ao que a pessoa tinha. É uma ilustração viva do mandamento maior: os ricos deram do excedente, cumprindo formalmente a expectativa religiosa sem custo pessoal real; a viúva deu a partir do próprio amor e confiança, com custo total. A cena conecta diretamente de volta ao capítulo 10 — o jovem rico que não conseguiu entregar tudo, e agora a viúva que entrega tudo sem hesitação." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 12 apresenta o mandamento maior como o centro gravitacional de toda a ética teológica do evangelho — não uma regra formal entre outras, mas a exigência que reorganiza todas as demais. Kant oferece um paralelo filosófico rigoroso de ética centrada em um único princípio, mas o texto exige algo que ultrapassa a pura racionalidade do dever: a transformação do próprio desejo." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Kant valoriza agir por dever mesmo sem inclinação. O mandamento maior pede inclinação genuína (amor real). Onde na sua vida você cumpre \"por dever formal\" o que deveria vir de um desejo mais profundo e transformado?",
          "A viúva deu proporcionalmente mais dando menos em quantidade absoluta. Em que área da sua vida você mede generosidade (de tempo, atenção, recursos) pela quantidade absoluta, em vez de pela proporção real de entrega?",
          "Existe algum \"mandamento maior\" — um princípio organizador central — que, se você o levasse a sério, reorganizaria a maioria das suas outras prioridades?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 13,
    title: "Vigiar Sem Saber a Hora",
    subtitle: "Pedras que não ficarão umas sobre as outras",
    blocks: [
      { type: "quote", text: "\"Não ficará pedra sobre pedra; tudo será derrubado.\" (Marcos 13:2, NVI)" },
      { type: "paragraph", text: "Diante do templo — símbolo máximo de permanência religiosa e nacional — Jesus anuncia sua destruição total. Os discípulos, alarmados, perguntam quando isso acontecerá e que sinal indicará sua proximidade. O que se segue é o discurso escatológico mais extenso do evangelho de Marcos: guerras, terremotos, fome, perseguição, falsos messias, e finalmente a vinda do Filho do homem \"com grande poder e glória\" (Marcos 13:26, NVI)." },
      { type: "paragraph", text: "O capítulo termina com uma instrução repetida insistentemente: vigiar." },
      { type: "quote", text: "\"Ninguém sabe o dia nem a hora, nem os anjos nos céus, nem o Filho, senão somente o Pai... Portanto, vigiem, porque vocês não sabem quando voltará o dono da casa.\" (Marcos 13:32, 35, NVI)" },
      { type: "heading", text: "O \"já e ainda não\"" },
      { type: "paragraph", text: "Em **escatologia sistemática**, essa tensão recebe um nome técnico: o \"já e ainda não\" (*already/not yet*) — o Reino de Deus já foi inaugurado na primeira vinda de Jesus, mas sua consumação plena permanece futura e incerta quanto ao tempo. O discurso do capítulo 13 vive exatamente nessa tensão: eventos históricos concretos (a queda do templo, ocorrida historicamente em 70 d.C.) se misturam com uma expectativa mais ampla, cósmica, sem data marcada." },
      { type: "heading", text: "Heidegger e o ser-para-a-morte" },
      { type: "paragraph", text: "Martin Heidegger, em *Ser e Tempo*, descreve a existência humana autêntica como aquela que vive conscientemente em relação à própria finitude — o que ele chama de \"ser-para-a-morte\" (*Sein-zum-Tode*). Para Heidegger, a maioria das pessoas vive em modo inautêntico, distraída, tratando a morte como um evento abstrato e distante, \"que acontece aos outros\" — e é justamente essa negação que impede uma vida plenamente apropriada e presente. A autenticidade surge quando a pessoa incorpora, sem paralisia nem negação, a certeza de que sua existência é finita e o momento é incerto." },
      { type: "paragraph", text: "Há uma ressonância estrutural clara com a instrução de \"vigiar\" em Marcos 13 — mas também uma diferença teológica importante. Heidegger fala de uma finitude sem horizonte além dela mesma: viver autenticamente é aceitar que a morte é o fim absoluto, e essa aceitação é o que gera urgência existencial. O discurso de Marcos pede vigilância não diante do fim absoluto, mas diante de uma vinda — um horizonte que aponta para além da própria finitude, não para dentro dela. A urgência é semelhante (não saber a hora, viver de forma desperta e atenta), mas o objeto da espera é radicalmente diferente: onde Heidegger vê o nada, o texto aponta para uma consumação com sentido." },
      { type: "heading", text: "Vigiar não é adivinhar" },
      { type: "paragraph", text: "É notável que o texto explicitamente desencoraja cálculos e especulações sobre datas — inclusive afirmando que nem o próprio Filho sabe o dia. A instrução repetida não é \"calculem\", é \"vigiem\" — uma postura de atenção contínua e fidelidade prática, não de especulação teórica sobre cronologia. Isso tem sido, historicamente, um dos pontos mais frequentemente ignorados por movimentos que tentam prever datas específicas para eventos escatológicos — indo diretamente contra a instrução explícita do próprio texto." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 13 sustenta uma tensão deliberada entre eventos históricos concretos e uma expectativa futura sem data marcada, pedindo vigilância contínua em vez de cálculo especulativo. Heidegger oferece um paralelo filosófico poderoso sobre como a consciência da finitude gera urgência existencial genuína — mas o horizonte escatológico do texto aponta para além da finitude, não para dentro dela." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Heidegger diria que muita gente vive \"distraída\" da própria finitude. Em que áreas da sua vida você vive no modo distraído, adiando o que realmente importa como se o tempo fosse ilimitado?",
          "O texto pede vigilância, não cálculo especulativo sobre datas. Existe alguma área da sua vida onde você substitui ação presente por especulação sobre o futuro?",
          "Se você soubesse, com certeza, que só teria mais um ano de vida consciente e funcional, o que mudaria hoje na forma como você usa seu tempo?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 14,
    title: "A Angústia Antes da Entrega",
    subtitle: "Um novo pacto anunciado à mesa",
    blocks: [
      { type: "quote", text: "\"Isto é o meu corpo... Isto é o meu sangue da aliança, que é derramado em favor de muitos.\" (Marcos 14:22, 24, NVI)" },
      { type: "paragraph", text: "Na última refeição com os discípulos, Jesus reinterpreta os elementos da Páscoa judaica — pão e vinho, símbolos da libertação do Egito — como seu próprio corpo e sangue, anunciando uma nova aliança. Teologicamente, esse é o ponto de inauguração da doutrina da expiação que só se completará na cruz: a linguagem de \"sangue da aliança\" ecoa diretamente Êxodo 24, quando Moisés selou a antiga aliança no Sinai com sangue de sacrifício. O texto apresenta a morte iminente de Jesus não como acidente trágico, mas como ato deliberado de fundação de uma nova relação entre Deus e seu povo." },
      { type: "heading", text: "Getsêmani: a angústia genuína" },
      { type: "paragraph", text: "Logo depois, no jardim do Getsêmani, o texto apresenta uma cena de vulnerabilidade humana extrema:" },
      { type: "quote", text: "\"Ele começou a ficar aflito e angustiado. E lhes disse: A minha alma está profundamente triste, numa tristeza mortal... Abba, Pai, tudo é possível para ti. Afasta de mim este cálice; contudo, não seja o que eu quero, mas sim o que tu queres.\" (Marcos 14:33-36, NVI)" },
      { type: "paragraph", text: "Essa é, talvez, a passagem mais teologicamente desafiadora do evangelho: como conciliar a angústia genuína (não encenada) diante do sofrimento iminente com a plena divindade de Cristo? A tradição teológica resiste tanto a minimizar essa angústia (o que negaria a humanidade real de Jesus) quanto a vê-la como falta de fé ou hesitação pecaminosa (o que contradiria sua submissão final: \"não seja o que eu quero, mas o que tu queres\")." },
      { type: "heading", text: "Kierkegaard e a angústia diante do absoluto" },
      { type: "paragraph", text: "Em *Temor e Tremor*, Kierkegaard analisa a angústia de Abraão diante da ordem de sacrificar Isaque — um momento em que a obediência a Deus parece entrar em conflito direto com toda categoria ética e humana compreensível. Kierkegaard chama isso de \"suspensão teleológica do ético\": Abraão suspende temporariamente a ética universal (não matarás) em obediência a uma exigência divina particular que a razão não consegue justificar de fora." },
      { type: "paragraph", text: "Getsêmani apresenta uma estrutura de angústia semelhante, mas invertida em um ponto crucial: Jesus não está confuso sobre o que Deus pede — ele sabe exatamente o que está por vir. A angústia não vem de incerteza moral, mas do peso genuíno e antecipado do próprio sofrimento. Ainda assim, o padrão de submissão apesar da angústia genuína — \"não seja o que eu quero\" — ecoa a mesma estrutura que Kierkegaard descreve em Abraão: fé não como ausência de angústia, mas como obediência que atravessa a angústia sem negá-la." },
      { type: "heading", text: "A queda de Pedro" },
      { type: "paragraph", text: "O capítulo fecha com a tripla negação de Pedro, cumprindo exatamente o que Jesus havia previsto horas antes, quando Pedro jurara nunca abandoná-lo. A cena não serve como condenação isolada de Pedro — ela se conecta com o tema mais amplo do capítulo 8 (a confissão certa com expectativa errada) e prepara, estruturalmente, a restauração que virá depois da ressurreição, ainda não narrada em Marcos, mas implícita no restante do Novo Testamento." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 14 apresenta, lado a lado, a fundação deliberada de uma nova aliança e a angústia genuína de quem está prestes a pagar seu custo. Kierkegaard oferece uma categoria filosófica — a angústia que atravessa a obediência sem negá-la — que ilumina Getsêmani sem reduzir nem a humanidade nem a submissão final de Jesus." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe alguma decisão difícil na sua vida onde você sentiu (ou sente) angústia genuína, mesmo já sabendo qual é o caminho certo a seguir?",
          "Kierkegaard descreve fé não como ausência de angústia, mas como obediência que a atravessa. Isso muda como você julga seus próprios momentos de hesitação diante de decisões corretas, mas difíceis?",
          "Pedro jurou fidelidade e falhou horas depois. Existe alguma promessa que você fez, convicto de sua própria força, que se revelou mais frágil do que esperava sob pressão real?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 15,
    title: "Deus Abandonado por Deus",
    subtitle: "O grito que ninguém esperava",
    blocks: [
      { type: "quote", text: "\"Às três horas da tarde, Jesus bradou em alta voz: Eloí, Eloí, lamá sabactâni?, que significa: Meu Deus, meu Deus, por que me abandonaste?\" (Marcos 15:34, NVI)" },
      { type: "paragraph", text: "É, talvez, o versículo mais desconcertante de todo o Novo Testamento: o Filho, cuja identidade divina foi afirmada desde o primeiro capítulo, grita — na língua original, não traduzida por Marcos, preservando o peso bruto do momento — uma sensação de abandono por Deus. A frase cita diretamente o Salmo 22, o que sugere não desespero sem estrutura, mas a experiência viva de um lamento antigo levado ao seu limite absoluto." },
      { type: "heading", text: "Teorias sistemáticas da expiação" },
      { type: "paragraph", text: "A morte de Jesus na cruz é o evento que a **teologia sistemática** tenta articular através de diferentes \"teorias da expiação\" — modelos que buscam explicar *como* e *por que* essa morte reconcilia Deus e humanidade:" },
      { type: "paragraph", text: "- **Substituição penal**: Jesus carrega, em lugar do ser humano, a punição merecida pelo pecado — a leitura mais associada à tradição protestante ocidental." },
      { type: "paragraph", text: "- **Christus Victor**: a cruz como vitória cósmica sobre as potências do mal, pecado e morte — o modelo predominante na teologia dos primeiros séculos da igreja." },
      { type: "paragraph", text: "- **Influência moral**: a cruz como demonstração suprema do amor de Deus, capaz de transformar o coração humano por seu exemplo — associada a Abelardo, na Idade Média." },
      { type: "paragraph", text: "Nenhuma teoria isolada esgota completamente o que o texto de Marcos apresenta — o rasgar do véu do templo no momento da morte (Marcos 15:38) sugere acesso restaurado a Deus (ressoando com substituição e reconciliação); a confissão do centurião romano, \"verdadeiramente este homem era Filho de Deus\" (Marcos 15:39), sugere um efeito revelador e transformador sobre quem testemunha o evento (ressoando com influência moral)." },
      { type: "heading", text: "Nietzsche: \"Deus está morto\"" },
      { type: "paragraph", text: "Nietzsche, através do personagem do \"louco\" em *A Gaia Ciência*, proclamou \"Deus está morto, e nós o matamos\" — uma afirmação sobre o colapso cultural da crença religiosa como fundamento moral compartilhado na modernidade europeia, não uma afirmação metafísica literal sobre a existência de Deus." },
      { type: "paragraph", text: "Há uma ironia profunda em colocar essa frase ao lado de Marcos 15: no evangelho, Deus (o Filho) de fato morre — literalmente, não metaforicamente — e é a própria humanidade, através de seus líderes religiosos e políticos, quem o entrega à morte. O que para Nietzsche é diagnóstico cultural de perda de sentido, o texto cristão apresenta como evento histórico específico com significado teológico oposto: não o colapso do sentido, mas — segundo a estrutura de toda a narrativa que só se completa no capítulo 16 — a própria fundação de um sentido novo, através da morte que não é ponto final." },
      { type: "heading", text: "O silêncio de Deus como parte da narrativa" },
      { type: "paragraph", text: "O grito de abandono não é seguido, no capítulo 15, por nenhuma explicação teológica imediata que o resolva — Jesus morre logo depois, e o capítulo termina com seu sepultamento. A ausência de resolução dentro do próprio capítulo é, estruturalmente, deliberada: o texto se recusa a apressar o luto ou explicar prematuramente o sofrimento, deixando-o pesar em toda sua gravidade antes de qualquer reviravolta." },
      { type: "heading", text: "Síntese" },
      { type: "paragraph", text: "O capítulo 15 apresenta o momento mais radicalmente paradoxal da narrativa: o Filho de Deus experimentando abandono divino, uma morte que a teologia sistemática interpreta simultaneamente como substituição, vitória e revelação de amor, sem que nenhum modelo isolado esgote o evento. Nietzsche oferece um contraponto irônico que, colocado ao lado do texto, evidencia por contraste o que o cristianismo afirma estar realmente acontecendo ali." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe algum sofrimento na sua vida que você tentou explicar ou resolver rápido demais, sem deixar espaço para que ele fosse plenamente reconhecido primeiro?",
          "Das três teorias da expiação apresentadas — substituição, vitória, influência moral — qual ressoa mais com sua própria forma de entender sofrimento e reconciliação?",
          "O centurião, um estranho ao movimento de Jesus, reconhece algo verdadeiro justamente ao testemunhar o sofrimento, não o triunfo. Existe algum momento de sofrimento — seu ou de alguém próximo — que revelou algo verdadeiro que o sucesso nunca teria mostrado?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
  {
    number: 16,
    title: "O Túmulo Vazio e o Fim Que Não Termina",
    subtitle: "Um final estranhamente abrupto",
    blocks: [
      { type: "quote", text: "\"Elas saíram e fugiram do sepulcro, tremendo e atônitas. E, cheias de medo, nada disseram a ninguém.\" (Marcos 16:8, NVI)" },
      { type: "paragraph", text: "Nos manuscritos mais antigos e confiáveis, o evangelho de Marcos termina exatamente aqui — sem aparição do Cristo ressuscitado, sem comissão final solene, apenas mulheres apavoradas fugindo em silêncio de um túmulo vazio. (Versões posteriores, incluindo boa parte das edições impressas modernas, acrescentam um final mais longo, de autenticidade textual amplamente debatida entre estudiosos — vale a NVI, geralmente, sinaliza isso com uma nota editorial.) Esse final abrupto intrigou intérpretes por séculos: por que terminar um evangelho inteiro sobre boas novas com medo e silêncio?" },
      { type: "paragraph", text: "Uma leitura consistente com todo o padrão do livro: Marcos, do primeiro ao último capítulo, resiste a entregar respostas fáceis e completas. A revelação sempre exigiu disposição de quem recebe (capítulos 1, 4, 6); a glória sempre esteve entrelaçada com sofrimento (capítulos 8, 9, 15); e agora, a ressurreição — o evento mais decisivo de toda a narrativa — é anunciada, mas não plenamente testemunhada dentro do próprio texto. O leitor é deixado, estruturalmente, no mesmo lugar que as mulheres: diante de um túmulo vazio, com um anúncio (\"ele ressuscitou, não está aqui\", Marcos 16:6) que exige uma resposta própria, não fornecida pelo texto." },
      { type: "heading", text: "O problema epistemológico do testemunho, revisitado" },
      { type: "paragraph", text: "Isso nos leva de volta à questão levantada no capítulo 6, com Hume: como avaliar racionalmente o testemunho de um evento que contraria toda experiência ordinária? O filósofo Nicholas Wolterstorff, num registro bem diferente de Hume, argumenta que testemunho não é uma forma inferior ou secundária de conhecimento — é, na prática, a base da maior parte de tudo o que qualquer ser humano sabe sobre o mundo (história, geografia, até ciência, para quem não repete pessoalmente cada experimento). A questão relevante nunca é \"testemunho é confiável em geral?\", mas \"este testemunho específico, com este padrão de coerência interna e disposição dos testemunhas, merece crédito?\"" },
      { type: "paragraph", text: "O próprio texto, de forma quase autoconsciente, não facilita essa avaliação: as testemunhas fogem com medo, não anunciam triunfantemente. Não é o relato de pessoas buscando construir uma narrativa convincente — é, estruturalmente, o oposto: gente apavorada, inicialmente silenciada pelo próprio choque. Isso não prova o evento, mas resiste à leitura de Hume de que todo relato extraordinário nasce necessariamente de exagero interessado ou credulidade ingênua." },
      { type: "heading", text: "Kierkegaard, de volta ao início" },
      { type: "paragraph", text: "O círculo se fecha com o Paradoxo Absoluto do Capítulo 1. Se a encarnação já excedia a capacidade da razão pura, a ressurreição a leva ainda mais longe — não apenas Deus se fazendo homem, mas a morte sendo revertida em favor da vida. Kierkegaard diria que aqui, mais do que em qualquer outro ponto do evangelho, a fé não pode ser o resultado de um processo de acúmulo racional de evidência suficiente — ela permanece, irredutivelmente, um salto. O túmulo vazio não obriga a conclusão de ressurreição por lógica pura; ele deixa aberto exatamente o espaço que a fé, segundo Kierkegaard, precisa para ser genuinamente livre." },
      { type: "heading", text: "Esperança contra o absurdo" },
      { type: "paragraph", text: "Vale um contraponto final: Albert Camus, no *Mito de Sísifo*, descreve a condição humana como fundamentalmente absurda — a busca de sentido diante de um universo silencioso que não oferece resposta, e propõe que a dignidade humana está em continuar vivendo e criando apesar dessa ausência de sentido cósmico, sem recorrer a \"saltos\" religiosos que ele considerava um tipo de suicídio filosófico." },
      { type: "paragraph", text: "O evangelho de Marcos termina, estruturalmente, recusando exatamente essa conclusão — não porque resolve todo o mistério com prova irrefutável, mas porque aponta para um sentido que não precisa ser inventado pela vontade humana diante do silêncio: um anúncio, um túmulo vazio, e um convite deixado em aberto para quem estiver disposto a segui-lo até a Galileia, como o anjo instrui as mulheres (Marcos 16:7)." },
      { type: "heading", text: "Síntese da trilha completa" },
      { type: "paragraph", text: "Do batismo no rio Jordão ao túmulo vazio, os dezesseis capítulos de Marcos sustentam a mesma tensão do início ao fim: revelação que exige disposição, glória entrelaçada com sofrimento, poder que escolhe servir, e uma verdade final que não se impõe por prova bruta, mas convida a uma resposta pessoal. Kierkegaard chamou isso de Paradoxo Absoluto no Capítulo 1; ele permanece paradoxo, deliberadamente, até a última linha." },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "O evangelho termina sem resolver tudo de forma confortável, deixando espaço para resposta própria do leitor. Existe alguma área da sua vida onde você também precisa agir sem esperar certeza absoluta antes?",
          "Wolterstorff argumenta que quase todo conhecimento humano depende de testemunho de outros. Em que você confia hoje, sem nunca ter verificado pessoalmente, e por quê?",
          "Revendo os dezesseis capítulos desta trilha: qual tensão específica — glória e sofrimento, poder e serviço, fé e dúvida — mais se repetiu na sua própria experiência este ano?",
        ],
      },
      { type: "footnote", text: "Nota: as citações seguem a NVI, de memória — a redação exata pode variar, especialmente quanto ao final longo/curto de Marcos 16, que tem debate textual conhecido; vale conferir numa Bíblia física ou digital antes de usar o conteúdo publicamente, já que não tenho acesso a busca neste momento." },
    ],
  },
];

export const FAITH_BOOKS: FaithBook[] = [
  {
    slug: "proverbios",
    title: "Provérbios",
    subtitle: "Sabedoria prática, um capítulo por dia",
    icon: "water",
    color: "#3b82f6",
    chapters: PROVERBIOS_CHAPTERS,
  },
  {
    slug: "marcos",
    title: "Evangelho de Marcos",
    subtitle: "A vida de Jesus, um capítulo por dia",
    icon: "book",
    color: "#8b5cf6",
    chapters: MARCOS_CHAPTERS,
  },
];

export function getFaithBook(slug: string): FaithBook | undefined {
  return FAITH_BOOKS.find((book) => book.slug === slug);
}
