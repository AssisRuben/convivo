/**
 * Conteúdo de "Gotas de Fé" — devocional diário, mesma dinâmica das
 * Pílulas de sabedoria (ver constants/wisdomPills.ts), só com o tema e
 * os textos trocados. Texto aceita **negrito**, *itálico* e ***negrito
 * itálico*** inline, renderizado por <RichText> na tela de leitura.
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

const CITATION_FOOTNOTE =
  "Nota: as citações de Provérbios seguem a tradução de Almeida, de memória — vale conferir a referência exata numa Bíblia física ou digital antes de usar o conteúdo publicamente.";

export const FAITH_CHAPTERS: FaithChapter[] = [
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
