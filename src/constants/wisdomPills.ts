/**
 * Conteúdo das "Pílulas de sabedoria" — um capítulo curto por dia.
 * Estruturado em blocos (em vez de markdown solto) pra cada tela de
 * leitura controlar tipografia e espaçamento sem precisar parsear texto.
 *
 * Mais de um TÓPICO agora (Decisões e Vieses, Estoicismo, Odisseia — mesma
 * dinâmica de FAITH_BOOKS em constants/faithDrops.ts), cada um com sua
 * própria sequência de capítulos e progresso/streak independente (ver
 * WisdomProgress no schema.prisma, chaveado por userId+topicSlug). A tela
 * de "Pílulas de sabedoria" é um hub de tópicos; cada tópico tem sua
 * própria lista de capítulos, numerada a partir de 1.
 */
// Texto de paragraph/quote/list items aceita **negrito** e *itálico*
// inline (markdown simplificado) — renderizado por <RichText> na tela de
// leitura, sem precisar quebrar o texto em segmentos aqui.
export type WisdomBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean };

export type WisdomChapter = {
  number: number;
  title: string;
  subtitle: string;
  blocks: WisdomBlock[];
};

export type WisdomTopic = {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  chapters: WisdomChapter[];
};

export const DECISOES_VIESES_CHAPTERS: WisdomChapter[] = [
  {
    number: 1,
    title: "Os Dois Cérebros que Decidem por Você",
    subtitle: "Por que pessoas inteligentes tomam decisões ruins",
    blocks: [
      { type: "paragraph", text: "Imagine dois cenários." },
      {
        type: "paragraph",
        text: 'No primeiro, você está atravessando a rua e um carro surge em alta velocidade. Você não "pensa" — seu corpo já pulou para a calçada antes mesmo de você processar conscientemente o perigo.',
      },
      {
        type: "paragraph",
        text: "No segundo, você está lendo um contrato de fornecedor, tentando decidir se aquela cláusula de reajuste é vantajosa a longo prazo. Você lê devagar, recalcula, compara cenários, hesita.",
      },
      {
        type: "paragraph",
        text: "Duas decisões. Dois cérebros completamente diferentes trabalhando.",
      },
      {
        type: "paragraph",
        text: 'O psicólogo Daniel Kahneman passou a carreira estudando essa dualidade e a resumiu em dois sistemas. O Sistema 1 é rápido, automático, intuitivo — o que te tirou da frente do carro. O Sistema 2 é lento, deliberado, custoso — o que analisou o contrato. Um não é "melhor" que o outro; são ferramentas para problemas diferentes.',
      },
      {
        type: "paragraph",
        text: "O problema é que o Sistema 1, por ser rápido e não pedir esforço, acaba tomando conta de decisões que deveriam ser do Sistema 2. Ele foi moldado pela evolução para julgar predadores em frações de segundo — não para avaliar se um investimento faz sentido em cinco anos. Quando você usa reflexo onde deveria usar reflexão, o erro que aparece não é aleatório. Ele é sistemático e previsível. É isso que chamamos de viés cognitivo: não uma falha de caráter ou de inteligência, mas o preço estrutural de pensar rápido.",
      },
      {
        type: "paragraph",
        text: 'Entender essa mecânica muda a pergunta que você faz de si mesmo. Ao invés de "por que errei essa decisão?", a pergunta certa vira: "em que momento deixei o Sistema 1 decidir sozinho algo que exigia o Sistema 2?"',
      },
      { type: "heading", text: "O espelho que só mostra o que você quer ver" },
      {
        type: "paragraph",
        text: "O primeiro vício de fábrica do Sistema 1 é buscar confirmação, não verdade. Chama-se viés de confirmação: a tendência de procurar, notar e lembrar com mais força as informações que sustentam o que você já acredita — e de descartar ou minimizar o que contradiz.",
      },
      {
        type: "paragraph",
        text: 'Pense num empreendedor que acredita que seu novo produto vai bombar. Ele conversa com cinco potenciais clientes. Três demonstram entusiasmo educado, dois fazem objeções sérias sobre preço. Na cabeça dele, a conversa vira "3 de 5 amaram" — as objeções somem do resumo mental, porque não cabem na história que ele já queria contar.',
      },
      {
        type: "paragraph",
        text: "O viés não é mentira consciente. É seletividade automática, silenciosa, que acontece antes de qualquer reflexão.",
      },
      { type: "heading", text: "O peso do que já foi gasto" },
      {
        type: "paragraph",
        text: "O segundo vício é ainda mais caro: a falácia do custo afundado. É a tendência de continuar investindo tempo, dinheiro ou esforço em algo porque você já investiu muito, não porque ainda faz sentido investir a partir de agora.",
      },
      {
        type: "paragraph",
        text: 'Uma reforma que já consumiu o dobro do orçamento previsto, mas continua sendo bancada "porque já gastamos tanto, não dá pra parar agora". Um projeto que todo mundo sabe, silenciosamente, que não vai dar certo — mas ninguém encerra, porque encerrar significaria admitir que o investimento anterior foi em vão.',
      },
      {
        type: "paragraph",
        text: 'O erro lógico aqui é claro quando você o vê de fora: dinheiro gasto no passado é irrecuperável, quer você continue quer pare. A única pergunta racional é sobre o futuro — "dado o que sei hoje, vale a pena continuar investindo a partir de agora?" — e essa pergunta nunca deveria ter o passado como argumento.',
      },
      { type: "heading", text: "A ilusão da certeza" },
      {
        type: "paragraph",
        text: "O terceiro vício é o mais silencioso e o mais estudado em decisões de negócio: excesso de confiança. A maioria das pessoas superestima sistematicamente a precisão do que sabe e a probabilidade de estar certa.",
      },
      {
        type: "paragraph",
        text: 'O sintoma é fácil de reconhecer: alguém diz "isso vai dar certo" com convicção total, mas nunca escreveu, nem para si mesmo, uma lista honesta de por que poderia não dar certo. A confiança nasceu da ausência de contra-argumento, não da presença de evidência.',
      },
      {
        type: "paragraph",
        text: "Isso é perigoso porque confiança parece competência — para quem decide e para quem observa. Mas são coisas diferentes. Confiança é um sentimento; competência é um histórico de acerto. Confundir os dois é como confundir a temperatura do motor com a qualidade do carro.",
      },
      { type: "heading", text: "O antídoto: matar o projeto antes de nascer" },
      {
        type: "paragraph",
        text: "Existe uma ferramenta simples que ataca os três vícios ao mesmo tempo: o pré-mortem.",
      },
      {
        type: "paragraph",
        text: 'A pergunta convencional antes de decidir é "por que isso vai dar certo?" — e essa pergunta, você já sabe, ativa exatamente o viés de confirmação, porque o cérebro corre atrás de razões para confirmar o que já quer fazer.',
      },
      { type: "paragraph", text: "O pré-mortem inverte a pergunta:" },
      {
        type: "quote",
        text: "Já se passou um ano. Esse projeto foi um fracasso completo. O que aconteceu?",
      },
      {
        type: "paragraph",
        text: 'A diferença parece pequena, mas é enorme na prática. Ao tratar o fracasso como fato consumado — não como possibilidade hipotética e desconfortável — o cérebro para de se defender e começa a investigar. As pessoas listam riscos reais que jamais mencionariam numa reunião de "vamos avaliar os riscos", porque ali ainda soa como admitir fraqueza antes de começar.',
      },
      {
        type: "paragraph",
        text: 'Imagine aplicar isso ao empreendedor do produto que "vai bombar": ao invés de perguntar por que vai dar certo, ele pergunta o que fez o produto fracassar em um ano. As respostas que emergem — "o preço estava alto demais", "não validei com clientes reais, só com conhecidos", "o distribuidor atrasou a entrega" — são exatamente os sinais que o viés de confirmação tinha apagado da conversa original.',
      },
      { type: "heading", text: "Síntese: o quadro mental" },
      {
        type: "paragraph",
        text: "Três vieses, um antídoto, uma pergunta que resume tudo:",
      },
      {
        type: "quote",
        text: 'Antes de qualquer decisão importante, pergunte: "Isso que estou sentindo é convicção baseada em evidência, ou é só a ausência de ter procurado o contrário?"',
      },
      {
        type: "paragraph",
        text: "Se a resposta for incerta, é sinal de que o Sistema 1 está decidindo sozinho — e é hora de convocar o Sistema 2 para revisar o trabalho antes que ele vire ação.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        items: [
          "Pense numa decisão que você tomou recentemente com convicção total. Que evidência contrária você não procurou?",
          "Existe algo em que você continua investindo hoje só porque já investiu muito até aqui?",
          "Escolha uma decisão que está avaliando agora e escreva o pré-mortem dela: daqui a um ano, ela fracassou — por quê?",
        ],
      },
    ],
  },
  {
    number: 2,
    title: "O Primeiro Número Que Você Ouve",
    subtitle: "Por que a primeira informação prende sua mente",
    blocks: [
      {
        type: "paragraph",
        text: 'Um vendedor de carros pede R$ 80 mil por um veículo que, na cabeça dele, vale R$ 60 mil. Você entra na negociação sabendo disso. Ainda assim, quando fecha em R$ 65 mil, sai satisfeito — "consegui um baita desconto". Só que o número de referência nunca foi o valor real do carro. Foi o número que o vendedor disse primeiro.',
      },
      {
        type: "paragraph",
        text: "Isso é **ancoragem**: a mente humana, ao estimar um valor desconhecido, se prende desproporcionalmente ao primeiro número apresentado — mesmo sabendo que esse número é arbitrário ou interessado. Kahneman e Tversky mostraram isso em um experimento clássico: pediram para pessoas girarem uma roleta (que só podia parar em 10 ou 65) e depois estimarem a porcentagem de países africanos na ONU. Quem viu a roleta parar em 65 deu estimativas bem mais altas que quem viu parar em 10 — um número completamente aleatório, sem relação alguma com a pergunta, ainda assim puxou a resposta.",
      },
      {
        type: "paragraph",
        text: "No mundo prático, ancoragem aparece em toda negociação: salário, orçamento de projeto, preço de fornecedor. Quem fala o primeiro número, na maioria das vezes, define o território onde a negociação inteira vai acontecer.",
      },
      { type: "heading", text: "O irmão gêmeo: heurística da disponibilidade" },
      {
        type: "paragraph",
        text: "Existe um segundo atalho mental que trabalha em conjunto com a ancoragem: julgamos a probabilidade de algo acontecer pela **facilidade com que exemplos vêm à mente** — não pela frequência real.",
      },
      {
        type: "paragraph",
        text: "É por isso que muita gente tem mais medo de andar de avião do que de carro, mesmo o carro sendo estatisticamente muito mais perigoso. Acidentes de avião são raros, mas extremamente memoráveis — viram manchete, ficam na memória. Acidentes de carro são comuns demais para virar notícia, e por isso parecem menos ameaçadores do que são.",
      },
      {
        type: "paragraph",
        text: "No trabalho, isso aparece assim: um gestor lembra vividamente de um fornecedor que atrasou uma entrega há dois anos, e por causa dessa lembrança vívida, evita aquele fornecedor — mesmo que os dados mostrem que ele cumpre prazo em 95% dos casos. Um caso marcante pesa mais na decisão do que cem casos silenciosos e bem-sucedidos.",
      },
      { type: "heading", text: "Como as duas armadilhas se combinam" },
      {
        type: "paragraph",
        text: 'Ancoragem distorce o *ponto de partida*. Disponibilidade distorce a *percepção de risco*. Juntas, elas explicam boa parte das decisões ruins que parecem "intuitivamente óbvias" na hora, mas não resistem a uma análise fria.',
      },
      {
        type: "paragraph",
        text: 'Um exemplo comum: uma empresa recebe uma proposta inicial de fornecedor com valor inflado de propósito. Mesmo negociando para baixo, o valor final continua alto — porque a âncora definiu a faixa de referência. Ao mesmo tempo, o comprador lembra de uma vez em que trocou de fornecedor e "deu errado", e essa lembrança disponível pesa mais do que deveria na decisão de continuar com o fornecedor atual, mesmo caro.',
      },
      { type: "heading", text: "Como se defender" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Antes de ouvir qualquer proposta, gere sua própria estimativa independente.** Pesquise o valor de mercado, calcule seu próprio número, antes de saber o que o outro lado está pedindo. Isso quebra o efeito da âncora antes que ela seja plantada.",
          '**Desconfie de decisões baseadas em "um caso que eu lembro".** Pergunte: qual é a taxa real, os dados agregados — não a exceção que ficou marcada na memória.',
          "**Numa negociação, considere falar primeiro** (se você tiver informação razoável) — quem ancora, geralmente ganha vantagem estrutural na conversa.",
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pense numa negociação recente. Qual foi o primeiro número mencionado — e o quanto ele definiu o resultado final?",
          "Existe alguma decisão que você evita hoje por causa de um caso marcante, mesmo sem saber a frequência real do problema?",
          "Da próxima vez que for negociar algo, escreva seu número de referência *antes* de ouvir a proposta do outro lado.",
        ],
      },
    ],
  },
  {
    number: 3,
    title: "Perder Dói o Dobro de Ganhar",
    subtitle: "O experimento que mudou a economia comportamental",
    blocks: [
      {
        type: "paragraph",
        text: "Imagine duas situações. Na primeira, alguém te oferece R$ 100 de graça. Na segunda, você tem R$ 100 na mão e alguém pede de volta. Em teoria, o impacto emocional das duas situações deveria ser simétrico — R$ 100 é R$ 100. Na prática, não é. Estudos mostram que a dor psicológica de perder R$ 100 é aproximadamente **duas vezes mais intensa** que o prazer de ganhar a mesma quantia.",
      },
      {
        type: "paragraph",
        text: "Esse fenômeno se chama **aversão à perda**, e é uma das descobertas mais robustas da psicologia comportamental. Ele explica um número enorme de comportamentos que, à primeira vista, parecem irracionais.",
      },
      { type: "heading", text: "Onde a aversão à perda se esconde" },
      {
        type: "paragraph",
        text: '**No mercado financeiro**, ela explica o "efeito disposição": investidores seguram ações que estão perdendo valor por tempo demais (esperando "recuperar", evitando reconhecer a perda formalmente) e vendem ações que estão ganhando valor cedo demais (com medo de perder o ganho já obtido) — exatamente o oposto do que a lógica de longo prazo recomendaria.',
      },
      {
        type: "paragraph",
        text: '**Na gestão de equipes**, ela explica por que mudanças organizacionais encontram tanta resistência. Um novo processo pode trazer ganhos reais de eficiência — mas as pessoas sentem, com mais força, o que estão "perdendo" da rotina antiga (controle, familiaridade, status) do que o ganho futuro incerto. Resistência a mudança raramente é preguiça; geralmente é aversão à perda operando.',
      },
      {
        type: "paragraph",
        text: '**Em precificação**, empresas aprenderam a explorar isso: "você está perdendo R$ 200 se não aproveitar essa promoção hoje" converte muito mais do que "você pode ganhar R$ 200 de desconto" — mesmo sendo matematicamente a mesma oferta. O cérebro reage de forma diferente à mesma informação, dependendo de como ela é enquadrada como ganho ou como perda.',
      },
      {
        type: "heading",
        text: "O lado traiçoeiro: decisões movidas por medo de perder, não por lógica",
      },
      {
        type: "paragraph",
        text: 'O problema não é sentir aversão à perda — isso é parte da natureza humana. O problema é quando essa aversão **substitui** a análise racional. Alguém mantém um funcionário de baixa performance porque demitir "parece uma perda" (do investimento em treiná-lo), quando manter na verdade custa mais caro a longo prazo. Alguém não muda de fornecedor, de carreira, de estratégia — porque o medo de perder o que já tem pesa mais do que a avaliação honesta do que poderia ganhar.',
      },
      { type: "heading", text: "Como neutralizar" },
      {
        type: "list",
        ordered: true,
        items: [
          '**Reformule a pergunta em termos de custo de oportunidade.** Ao invés de "o que eu perco se mudar?", pergunte "o que eu já estou perdendo, todo dia, por não mudar?" — isso equilibra a balança emocional.',
          '**Separe a decisão da história emocional por trás dela.** Um investimento ruim continua ruim independente de quanto você já "sofreu" nele — isso conecta com a falácia do custo afundado do capítulo anterior.',
          "**Quando for propor uma mudança para outras pessoas, enquadre o que elas ganham, não só o que muda.** Aversão à perda não desaparece — mas o enquadramento certo reduz a resistência automática.",
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Existe algo (um investimento, uma relação profissional, um hábito) que você mantém mais por medo de perder do que por ainda fazer sentido?",
          "Pense numa mudança que você quer propor a alguém. Como reformular a proposta destacando o que a pessoa ganha, em vez do que muda?",
          'Da próxima vez que sentir forte resistência a uma decisão, pergunte: "isso é aversão à perda falando, ou é análise real de risco?"',
        ],
      },
    ],
  },
  {
    number: 4,
    title: "A História Vívida Contra o Número Frio",
    subtitle: "O teste que engana quase todo mundo",
    blocks: [
      {
        type: "paragraph",
        text: "Um exame detecta uma doença rara com 99% de precisão. Você faz o teste e dá positivo. Qual a chance de você realmente ter a doença?",
      },
      {
        type: "paragraph",
        text: 'A resposta intuitiva da maioria das pessoas é "99%". A resposta correta, na maioria dos cenários reais, costuma ser muito menor — às vezes abaixo de 10%. A diferença está numa informação que o cérebro ignora sistematicamente: a **taxa base**, ou seja, quão rara a doença é na população em geral. Se a doença afeta 1 em cada 10.000 pessoas, mesmo um teste muito preciso vai gerar mais falsos positivos do que verdadeiros positivos, simplesmente porque há muito mais gente saudável sendo testada do que gente doente.',
      },
      {
        type: "paragraph",
        text: "Esse erro — ignorar a informação geral (taxa base) e focar só no caso específico e vívido diante dos olhos — se chama **negligência da taxa base**, e ele não aparece só em medicina.",
      },
      { type: "heading", text: "Onde isso aparece nos negócios" },
      {
        type: "paragraph",
        text: 'Um vendedor teve um mês espetacular. A empresa toda quer saber "o que ele fez de diferente" para replicar o sucesso — sem considerar que parte desse resultado pode ser simplesmente variação estatística normal, não competência excepcional replicável.',
      },
      {
        type: "paragraph",
        text: 'Isso conecta com outro fenômeno próximo: a **regressão à média**. Desempenhos extremos — muito bons ou muito ruins — tendem a se normalizar ao longo do tempo, simplesmente por estatística, não porque algo mudou de fato. Um time que teve um trimestre excepcional provavelmente vai ter um trimestre "normal" a seguir — não porque piorou, mas porque o trimestre excepcional já continha uma boa dose de sorte que não se repete.',
      },
      {
        type: "paragraph",
        text: "O erro clássico de gestão: elogiar excessivamente o mês bom (achando que descobriu a fórmula do sucesso) e punir excessivamente o mês ruim seguinte (achando que houve queda de performance) — quando, estatisticamente, os dois foram só o pêndulo normal voltando ao centro.",
      },
      {
        type: "heading",
        text: "Por que o cérebro prefere a história à estatística",
      },
      {
        type: "paragraph",
        text: "Uma taxa base é abstrata, sem rosto, sem narrativa. Um caso específico — aquele vendedor, aquele cliente que cancelou, aquele mês excepcional — é vívido, tem nome, tem enredo. O cérebro humano é, antes de tudo, uma máquina de contar e absorver histórias, não uma calculadora. Por isso, entre um número frio e um caso emocionante, a história quase sempre vence — mesmo quando o número é a informação mais confiável.",
      },
      { type: "heading", text: "Como se defender" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Antes de reagir a um caso individual — bom ou ruim — pergunte pela taxa base.** Qual é a frequência real desse tipo de evento? Esse caso é exceção ou padrão?",
          "**Desconfie de picos e vales isolados.** Um resultado muito fora da curva, positivo ou negativo, tende a se corrigir sozinho no próximo período — antes de agir drasticamente, espere confirmar se é tendência ou ruído.",
          "**Prefira decisões baseadas em séries de dados, não em eventos isolados**, especialmente quando a decisão tem custo alto de reverter.",
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pense numa decisão recente movida por um caso específico e marcante. Qual seria a taxa base por trás dele?",
          "Existe algum resultado excepcional (bom ou ruim) na sua rotina que você atribuiu a competência ou incompetência, quando poderia ser regressão à média?",
          "Da próxima vez que avaliar uma performance, pergunte: isso é uma tendência real ou o pêndulo normal voltando ao centro?",
        ],
      },
    ],
  },
  {
    number: 5,
    title: "Os Truques que a Lógica Não Perdoa",
    subtitle: "Discordar do argumento errado",
    blocks: [
      {
        type: "paragraph",
        text: 'Numa reunião, alguém propõe reduzir o número de etapas de aprovação de um processo. Um colega responde: "então você quer que a gente aprove qualquer coisa sem nenhum controle?" Ninguém disse isso. A proposta era reduzir etapas redundantes, não eliminar controle. Mas a versão distorcida é mais fácil de atacar — e é nela que o debate vai se concentrar, se ninguém perceber o truque.',
      },
      {
        type: "paragraph",
        text: 'Isso é o **espantalho** (*strawman*): distorcer o argumento do outro para uma versão mais fraca e exagerada, mais fácil de derrubar, e atacar essa versão em vez do argumento real. É uma das falácias mais comuns em qualquer discussão — profissional, política, familiar — porque funciona muito bem para "vencer" a discussão sem realmente refutar nada.',
      },
      { type: "heading", text: '"Porque foi o chefe que disse"' },
      {
        type: "paragraph",
        text: "A segunda falácia comum é o **apelo à autoridade**: aceitar uma afirmação como verdadeira só porque veio de alguém com posição, título ou experiência — sem avaliar o mérito do argumento em si.",
      },
      {
        type: "paragraph",
        text: 'Autoridade é um bom indício, não uma prova. Um especialista pode estar errado; um argumento fraco não fica forte só porque quem disse tem cargo alto. O problema aparece quando "foi o diretor que decidiu" vira o fim da discussão, em vez do começo de uma avaliação — porque, dessa forma, decisões ruins nunca são questionadas, só obedecidas.',
      },
      { type: "heading", text: '"Ou isso, ou aquilo"' },
      {
        type: "paragraph",
        text: "A terceira é o **falso dilema**: apresentar apenas duas opções como se fossem as únicas possíveis, quando na verdade existe um espectro de alternativas.",
      },
      {
        type: "paragraph",
        text: '"Ou cortamos custos, ou vamos falir" ignora dezenas de posições intermediárias — renegociar contratos, aumentar receita, redesenhar processos. O falso dilema é sedutor porque simplifica a decisão e cria urgência — mas simplifica demais, e urgência artificial é uma ótima forma de empurrar decisões ruins.',
      },
      { type: "heading", text: "Por que essas falácias funcionam tão bem" },
      {
        type: "paragraph",
        text: "As três têm algo em comum: elas encurtam o esforço de pensar. É mais fácil atacar uma versão exagerada do argumento do outro do que enfrentar a versão real. É mais fácil aceitar a palavra de quem manda do que avaliar o mérito sozinho. É mais fácil escolher entre duas opções do que mapear um espectro inteiro de alternativas. Cada falácia é, no fundo, um atalho do Sistema 1 disfarçado de argumento do Sistema 2.",
      },
      { type: "heading", text: "Como se defender" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Ao discordar de alguém, repita o argumento original nas suas palavras antes de rebater.** Se a outra pessoa concordar que você entendeu certo, você está atacando o argumento real, não um espantalho.",
          '**Separe "quem disse" de "o que foi dito".** Pergunte: esse argumento se sustentaria mesmo se viesse de alguém sem cargo nenhum?',
          '**Quando alguém apresentar só duas opções, pergunte em voz alta: "que outras opções existem entre essas duas?"** — isso sozinho já quebra a maioria dos falsos dilemas.',
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Lembra de alguma discussão recente em que você (ou alguém) atacou uma versão exagerada do argumento do outro, em vez do argumento real?",
          "Existe alguma decisão que você aceitou recentemente só porque veio de alguém com autoridade, sem avaliar o mérito?",
          "Da próxima vez que alguém te apresentar só duas opções, force a pergunta: qual seria a terceira?",
        ],
      },
    ],
  },
  {
    number: 6,
    title: "Atualizando Crenças, Não Trocando Elas",
    subtitle: "O erro de reagir com peso demais a uma informação nova",
    blocks: [
      {
        type: "paragraph",
        text: 'Um cliente que sempre respondeu rápido demora três dias para responder um e-mail. A reação automática de muita gente é: "ele desistiu do negócio". Mas essa conclusão ignora uma pergunta essencial: **quão provável era isso antes** de você ver esse sinal, e **quanto esse sinal específico realmente deveria mudar** essa probabilidade?',
      },
      {
        type: "paragraph",
        text: 'Isso é o núcleo do **raciocínio bayesiano**: a ideia de que devemos atualizar nossas crenças de forma *proporcional* à força da nova evidência, sem nunca ignorar completamente o que já sabíamos antes (a crença prévia, ou "prior").',
      },
      { type: "heading", text: "Os três ingredientes, sem fórmula matemática" },
      {
        type: "paragraph",
        text: "Você não precisa de estatística avançada para pensar de forma bayesiana no dia a dia. Precisa de três perguntas, nessa ordem:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Qual era minha crença antes desse sinal?** (O cliente tinha um histórico de 20 interações rápidas e positivas — a crença prévia de que o negócio está bem encaminhado é forte.)",
          "**Quão forte é essa nova evidência, de verdade?** (Um atraso de três dias tem várias explicações banais — viagem, final de semana, prioridade interna — e é um sinal fraco comparado a 20 interações positivas anteriores.)",
          '**Quanto essa evidência deveria, racionalmente, mover minha crença original?** (Pouco. Talvez de "95% que o negócio avança" para "85%" — não para "o negócio morreu", como o pânico sugere.)',
        ],
      },
      {
        type: "paragraph",
        text: "O erro mais comum é pular direto para a conclusão dramática (passo 3) ignorando os passos 1 e 2 — reagir ao sinal como se ele apagasse tudo que você já sabia.",
      },
      { type: "heading", text: "O oposto também é um erro" },
      {
        type: "paragraph",
        text: "Existe um erro simétrico, menos falado: ignorar evidência nova demais, só porque a crença anterior era muito forte. Alguém confia tanto em um fornecedor, baseado em anos de bom histórico, que ignora três sinais recentes e consistentes de queda de qualidade. A crença prévia forte não deveria imunizar contra evidência real — só exige uma evidência mais consistente (não um único incidente) para justificar a mudança.",
      },
      {
        type: "paragraph",
        text: "O raciocínio bayesiano bem aplicado evita os dois extremos: nem pânico a cada sinal fraco, nem teimosia diante de um padrão real de evidência.",
      },
      { type: "heading", text: "Onde isso rende mais" },
      {
        type: "paragraph",
        text: 'Esse tipo de raciocínio é especialmente valioso em decisões com informação incompleta e incerteza real — negociações em andamento, avaliação de desempenho de equipe, decisões de investimento, diagnóstico de problemas técnicos. Em vez de "isso prova que está tudo bem" ou "isso prova que está tudo errado", a pergunta madura é sempre: "o quanto isso muda o que eu já sabia?"',
      },
      { type: "heading", text: "Como aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Antes de reagir a uma informação nova, escreva (mentalmente ou no papel) qual era sua crença antes dela.**",
          "**Classifique a força do sinal**: é um dado isolado e explicável por várias causas, ou é parte de um padrão consistente?",
          '**Ajuste sua crença de forma proporcional — não binária.** Raramente uma única informação deveria levar de "tudo bem" direto para "tudo perdido", ou vice-versa.',
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pense numa vez em que você reagiu de forma extrema a um sinal fraco e isolado. O que sua crença anterior, mais sólida, dizia?",
          "Existe alguma crença forte que você mantém hoje apesar de evidências recentes consistentes na direção contrária?",
          'Na próxima situação incerta, tente escrever: "antes disso eu achava X%; esse sinal muda para Y%" — e veja se o ajuste que você fez de cabeça é exagerado ou proporcional.',
        ],
      },
    ],
  },
  {
    number: 7,
    title: "Quando o Grupo Pensa Pior que Qualquer Indivíduo Sozinho",
    subtitle: "A reunião onde ninguém discordou",
    blocks: [
      {
        type: "paragraph",
        text: 'Numa sala de reunião, o líder apresenta uma proposta com entusiasmo visível. Ele pergunta se alguém tem objeções. Silêncio. Todo mundo concorda com a cabeça. A decisão é aprovada por unanimidade. Meses depois, o projeto fracassa — e, em conversas individuais, quase todo mundo admite que tinha dúvidas na hora da reunião, mas não quis ser "o chato" que trava o consenso.',
      },
      {
        type: "paragraph",
        text: "Esse fenômeno tem nome: **groupthink** (pensamento de grupo). Ele acontece quando o desejo de harmonia e conformidade dentro de um grupo se sobrepõe à avaliação realista das alternativas — e o resultado, paradoxalmente, é que grupos inteiros tomam decisões piores do que uma única pessoa bem informada tomaria sozinha.",
      },
      { type: "heading", text: "Os sintomas que denunciam o groupthink" },
      {
        type: "list",
        items: [
          "**Ilusão de unanimidade**: silêncio é interpretado como concordância, quando na verdade é só desconforto de discordar em público.",
          "**Autocensura**: cada pessoa guarda suas dúvidas para si, assumindo (errado) que é a única que discorda.",
          '**Pressão sobre dissidentes**: quem levanta uma objeção é sutilmente visto como "não estar no time", o que ensina todo mundo a ficar quieto da próxima vez.',
          "**Excesso de confiança coletiva**: o grupo, reforçando-se mutuamente, desenvolve uma convicção mais forte do que qualquer evidência real sustentaria — o inverso do Capítulo 1, mas em versão coletiva.",
        ],
      },
      {
        type: "paragraph",
        text: 'O perigo do groupthink é que ele não parece disfuncional de dentro. Parece harmonia, eficiência, "estarmos todos alinhados". É exatamente por parecer saudável que ele é tão difícil de perceber enquanto acontece.',
      },
      { type: "heading", text: "Por que grupos são especialmente vulneráveis" },
      {
        type: "paragraph",
        text: "Um indivíduo sozinho, ao discordar de si mesmo, não sofre nenhum custo social. Num grupo, discordar tem custo — social, reputacional, às vezes hierárquico. Isso significa que grupos sistematicamente suprimem a informação mais valiosa que poderiam ter: a objeção honesta de alguém que enxergou um risco real.",
      },
      {
        type: "paragraph",
        text: "Quanto mais coeso e mais hierárquico o grupo, maior o risco — porque coesão aumenta o custo social de discordar, e hierarquia aumenta o medo de contrariar quem está no topo.",
      },
      { type: "heading", text: "Como neutralizar" },
      {
        type: "list",
        ordered: true,
        items: [
          '**Designe formalmente um "advogado do diabo"** — alguém com a tarefa explícita de argumentar contra a decisão favorita do grupo, mesmo que pessoalmente concorde com ela. Isso remove o custo social de discordar, porque a discordância virou papel, não opinião pessoal.',
          "**Colete opiniões individuais antes da discussão em grupo**, por escrito ou anonimamente. Isso evita que a opinião de quem fala primeiro ancore (veja o Capítulo 2) a opinião de todo mundo.",
          "**O líder deve declarar sua posição por último, não primeiro.** Quando quem lidera fala primeiro, a reunião inteira vira busca por confirmação, não avaliação real.",
          '**Trate silêncio como ausência de informação, nunca como concordância.** Pergunte diretamente: "alguém vê um jeito disso dar errado?" — em vez de "alguém discorda?".',
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Lembra de uma decisão em grupo que, em retrospecto, todo mundo tinha dúvidas mas ninguém falou? O que impediu a fala?",
          "Da próxima vez que liderar uma discussão, você consegue falar por último?",
          'Que decisão futura sua poderia se beneficiar de um "advogado do diabo" formal antes de ser fechada?',
        ],
      },
    ],
  },
  {
    number: 8,
    title: "Colocando o Raciocínio no Papel",
    subtitle: "Por que ferramentas simples vencem a intuição sozinha",
    blocks: [
      {
        type: "paragraph",
        text: "Os últimos sete capítulos mostraram como o cérebro se engana de formas previsíveis: ancorando em números arbitrários, temendo perdas mais do que valoriza ganhos, ignorando taxas base, caindo em falácias, reagindo de forma desproporcional a sinais fracos, se acomodando no consenso do grupo. O fio comum entre todas as defesas é o mesmo: **tirar a decisão da cabeça e colocar no papel**. Isso sozinho já ativa o Sistema 2 e neutraliza boa parte dos vieses do Sistema 1.",
      },
      {
        type: "paragraph",
        text: "Este capítulo fecha a trilha com três ferramentas simples, sem matemática complicada, que fazem exatamente isso.",
      },
      { type: "heading", text: "Ferramenta 1 — Matriz de decisão ponderada" },
      {
        type: "paragraph",
        text: "Quando você tem várias opções e vários critérios importantes ao mesmo tempo (por exemplo, escolher entre fornecedores, candidatos, ou estratégias), a mente tende a decidir pelo critério mais vívido do momento — não pelo conjunto real de fatores.",
      },
      { type: "paragraph", text: "**Como montar:**" },
      {
        type: "list",
        ordered: true,
        items: [
          "Liste as opções (ex: Fornecedor A, B, C).",
          "Liste os critérios que importam (preço, prazo, qualidade, confiabilidade).",
          "Dê um peso a cada critério (some 100%: preço 40%, prazo 20%, qualidade 30%, confiabilidade 10%).",
          "Dê uma nota de 1 a 5 para cada opção em cada critério.",
          "Multiplique nota × peso, some por opção.",
        ],
      },
      {
        type: "paragraph",
        text: "A opção com maior pontuação total venceu — segundo os critérios que *você definiu antes* de ver os resultados, não segundo qual te convenceu mais na conversa.",
      },
      { type: "heading", text: "Ferramenta 2 — Valor esperado" },
      {
        type: "paragraph",
        text: "Quando a decisão envolve risco e incerteza (uma aposta, um investimento, uma escolha com resultados possíveis diferentes), o valor esperado combina probabilidade e resultado numa única conta:",
      },
      {
        type: "quote",
        text: "Valor esperado = (probabilidade de sucesso × ganho) − (probabilidade de fracasso × perda)",
      },
      {
        type: "paragraph",
        text: "Exemplo: um projeto tem 70% de chance de gerar R$ 50 mil de retorno, e 30% de chance de gerar R$ 10 mil de prejuízo. Valor esperado = (0,7 × 50.000) − (0,3 × 10.000) = 35.000 − 3.000 = **R$ 32.000**.",
      },
      {
        type: "paragraph",
        text: 'Isso não elimina o risco — mas tira a decisão do terreno emocional ("tenho um bom pressentimento") e coloca em números comparáveis entre opções diferentes.',
      },
      { type: "heading", text: "Ferramenta 3 — Árvore de decisão" },
      {
        type: "paragraph",
        text: "Para decisões com etapas sequenciais (decisão A leva a resultado, que leva a decisão B), desenhar uma árvore simples — cada ramo representando uma escolha ou um evento possível, com probabilidades e valores nas pontas — ajuda a enxergar o caminho completo, não só o próximo passo.",
      },
      {
        type: "paragraph",
        text: "O maior ganho da árvore de decisão não é o cálculo final — é o processo de desenhar: forçar a si mesmo a listar *todos* os caminhos possíveis, não só o mais otimista, que é justamente onde o viés de confirmação do Capítulo 1 mais gosta de atuar.",
      },
      { type: "heading", text: "O princípio por trás das três ferramentas" },
      {
        type: "paragraph",
        text: "Nenhuma delas exige ser expert em estatística. O que as três têm em comum é: **forçar critérios e probabilidades a serem explícitos antes da decisão**, ao invés de racionalizados depois dela. É a mesma lógica do pré-mortem do Capítulo 1 — tornar visível, no papel, o que normalmente fica implícito e vulnerável a viés na cabeça.",
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pegue uma decisão real que você está adiando. Monte uma matriz de decisão simples com no máximo 4 critérios.",
          "Existe uma decisão com risco/incerteza real na sua rotina onde calcular o valor esperado mudaria sua percepção?",
          "Revisando os 8 capítulos desta trilha: qual dos vieses (confirmação, custo afundado, excesso de confiança, ancoragem, disponibilidade, aversão à perda, taxa base, groupthink) você reconhece mais em si mesmo?",
        ],
      },
    ],
  },
];

export const ESTOICISMO_CHAPTERS: WisdomChapter[] = [
  {
    number: 1,
    title: "Dicotomia do Controle",
    subtitle: "O que depende de você, e o que não depende",
    blocks: [
      {
        type: "paragraph",
        text: "Imagine que você está esperando um ônibus que nunca chega. Você olha o relógio, reclama mentalmente, sente a irritação subir — e nada disso muda o fato de que o ônibus não está ali. Agora imagine a mesma cena, mas você já aceitou, desde o início, que o horário do ônibus não está sob seu controle. A irritação não desaparece por mágica, mas ela perde a força. Você não está mais lutando contra algo que não pode vencer.",
      },
      {
        type: "paragraph",
        text: "Essa é a essência da dicotomia do controle, talvez a ideia mais central de todo o estoicismo. Epicteto, que nasceu escravo e depois se tornou um dos filósofos mais influentes de Roma, resumiu tudo numa frase que atravessou dois mil anos:",
      },
      {
        type: "quote",
        text: "Existem coisas que dependem de nós, e coisas que não dependem. Julgamentos, desejos, ações — essas são nossas. Corpo, reputação, riqueza, o que os outros pensam, o resultado final de qualquer esforço — essas não são.",
      },
      {
        type: "paragraph",
        text: "O erro que cometemos quase sempre é o mesmo: tratamos o que não controlamos como se fosse nossa responsabilidade, e o que controlamos como se não fosse. Ficamos ansiosos com a opinião alheia, que não governamos, e negligentes com nossas próprias reações, que governamos completamente. A ansiedade, nesse sentido, é muitas vezes o sintoma de ter investido energia na coluna errada da planilha.",
      },
      { type: "heading", text: "O que realmente está sob seu controle" },
      {
        type: "paragraph",
        text: 'Vale a pena detalhar o que exatamente está sob nosso controle, porque a linha é mais fina do que parece à primeira vista. Epicteto listava como verdadeiramente nossos: os julgamentos que fazemos sobre as coisas, os desejos que alimentamos, as aversões que cultivamos, os impulsos para agir e as escolhas de assentir ou recusar. Tudo o mais — o corpo, a propriedade, a reputação, os cargos, as pessoas que amamos — é classificado por ele como "não nosso", no sentido de que não depende da nossa vontade para acontecer ou permanecer.',
      },
      { type: "heading", text: "Agir sem se apegar ao resultado" },
      {
        type: "paragraph",
        text: "Mas há uma sutileza importante aqui. Dizer que algo não está sob nosso controle não significa dizer que não devemos agir sobre isso. Significa que devemos agir sem confundir nosso esforço com o resultado. Você pode treinar para uma prova, mas não controla se vai passar. Pode cuidar do seu corpo, mas não controla se vai adoecer. Pode ser gentil com alguém, mas não controla se essa pessoa vai retribuir. O esforço é seu; o desfecho tem variáveis que não são.",
      },
      {
        type: "paragraph",
        text: 'Os estoicos faziam uma distinção útil entre "causas principais" e "causas auxiliares". A causa principal de uma ação é a sua escolha, sua intenção, seu julgamento — isso é totalmente seu. As causas auxiliares são as condições externas, as circunstâncias, as outras pessoas — isso não é seu. Uma flecha pode ser lançada com perfeição, mas o vento pode desviá-la. O arqueiro estoico se concentra na perfeição do lançamento, não no capricho do vento.',
      },
      {
        type: "paragraph",
        text: 'A pergunta que a dicotomia propõe não é "como faço isso dar certo?", mas sim: "isso que estou tentando controlar está realmente sob meu comando?". Se estiver, aja. Se não estiver, solte. Não porque o resultado não importa, mas porque segurá-lo com força não o torna mais provável — só torna você mais cansado.',
      },
      { type: "heading", text: "O evento e o julgamento sobre o evento" },
      {
        type: "paragraph",
        text: "Há ainda um terceiro nível que os estoicos exploravam: a distinção entre o evento e o julgamento sobre o evento. Não é o ônibus atrasado que te irrita — é a sua opinião de que o atraso é intolerável. Não é a crítica que te fere — é a sua crença de que aquela crítica define quem você é.",
      },
      {
        type: "quote",
        text: "As pessoas não são perturbadas pelas coisas, mas pelas opiniões que têm sobre as coisas.",
      },
      {
        type: "paragraph",
        text: "Isso é revolucionário porque desloca todo o poder para dentro: se a perturbação vem do julgamento, e o julgamento é meu, então a perturbação é algo que posso examinar e, com prática, dissolver.",
      },
      {
        type: "paragraph",
        text: 'Isso não significa negar a dor ou fingir que nada importa. Significa reconhecer que entre o evento e a reação existe um espaço — e nesse espaço mora a nossa liberdade. Os estoicos chamavam isso de "proaíresis", a faculdade de escolha. É a única coisa que ninguém pode tirar de você, nem mesmo um imperador, nem mesmo a morte. Um escravo pode ser acorrentado, mas não pode ser impedido de escolher como interpreta suas correntes. É por isso que Epicteto, escravo, era mais livre do que muitos senadores romanos.',
      },
    ],
  },
  {
    number: 2,
    title: "Virtude Como Único Bem Verdadeiro",
    subtitle: "O que o fogo não pode queimar",
    blocks: [
      {
        type: "paragraph",
        text: 'Existe uma pergunta que os estoicos fazem e que soa estranha aos ouvidos modernos: o que é, de fato, um bem? A resposta comum seria saúde, dinheiro, amor, sucesso. Mas os estoicos apontavam uma fissura nessa lista: todos esses "bens" podem ser tirados de você. A saúde falha, o dinheiro some, o amor acaba, o sucesso vira memória. Se um bem pode ser perdido sem que você tenha feito nada de errado, ele não é bem de verdade — é circunstância.',
      },
      {
        type: "paragraph",
        text: "O único bem que não pode ser arrancado de você é a virtude: a qualidade do seu caráter, a forma como você escolhe agir. Coragem, justiça, temperança, sabedoria. Ninguém pode te obrigar a ser covarde ou injusto; isso é sempre uma escolha sua, mesmo sob coação. Essa era a aposta estoica: o que importa não é o que acontece com você, mas quem você se torna diante do que acontece.",
      },
      { type: "heading", text: "As quatro virtudes cardeais" },
      {
        type: "paragraph",
        text: "Os estoicos dividiam a virtude em quatro virtudes cardeais, que se entrelaçavam como faces de uma mesma pedra. A sabedoria (sophia) é a capacidade de discernir o que é verdadeiro e o que é falso, o que está sob seu controle e o que não está. A coragem (andreia) é a disposição de agir conforme esse discernimento, mesmo diante do medo, da dor ou da perda. A justiça (dikaiosyne) é a virtude que orienta suas ações em relação aos outros — dar a cada um o que lhe é devido, tratar as pessoas como fins e não como meios. A temperança (sophrosyne) é o autodomínio, a moderação dos desejos, a capacidade de não ser arrastado por impulsos desordenados.",
      },
      {
        type: "paragraph",
        text: "Essas quatro virtudes não eram vistas como regras separadas, mas como aspectos de uma única sabedoria prática. Sócrates, que foi uma espécie de patrono filosófico dos estoicos, dizia que a virtude é conhecimento — quem realmente compreende o que é bom age bem, e quem age mal o faz por ignorância sobre o que é verdadeiramente bom. Os estoicos radicalizaram isso: todas as virtudes são uma só, e quem tem uma tem todas. Não se pode ser corajoso sem ser justo, nem sábio sem ser temperante, porque todas brotam da mesma fonte — a compreensão correta da natureza das coisas.",
      },
      { type: "heading", text: "Indiferentes preferíveis" },
      {
        type: "paragraph",
        text: 'Isso não significa indiferença ao mundo. Significa reordenar a hierarquia. Saúde é preferível à doença, riqueza à pobreza — os estoicos chamavam essas coisas de "indiferentes preferíveis" (proegmena). Mas são preferências, não bens. Você trabalha por elas, mas não depende delas para estar bem. A diferença é sutil e decisiva: quem faz da virtude o único bem pode perder tudo e ainda assim não perder a si mesmo.',
      },
      {
        type: "paragraph",
        text: "Há um exemplo clássico que ilustra bem essa distinção. Imagine dois homens que perdem tudo num incêndio. Um deles entra em desespero, porque sua identidade estava investida nas posses. O outro aceita a perda, porque sua identidade estava investida no caráter. O primeiro sofre uma perda total; o segundo sofre uma perda material, mas não uma perda de si. Para os estoicos, o segundo homem é o único verdadeiramente rico, porque carrega consigo o único bem que o fogo não pode queimar.",
      },
      { type: "heading", text: "A felicidade que não depende do mundo" },
      {
        type: "paragraph",
        text: "Os estoicos também insistiam que a virtude é suficiente para a felicidade (eudaimonia). Isso não quer dizer que o virtuoso não sinta dor ou tristeza — quer dizer que ele não precisa de nada externo para viver bem.",
      },
      {
        type: "quote",
        text: "Não busques que os acontecimentos aconteçam como desejas; deseja que aconteçam como acontecem, e tua vida fluirá bem.",
      },
      {
        type: "paragraph",
        text: "A felicidade estoica não é a ausência de dificuldades, mas a presença de uma alma em ordem, independentemente das circunstâncias. É uma felicidade que não depende do mundo para existir — e por isso não pode ser tirada pelo mundo.",
      },
    ],
  },
  {
    number: 3,
    title: "Premeditatio Malorum",
    subtitle: "Ensaiar a adversidade antes que ela chegue",
    blocks: [
      {
        type: "paragraph",
        text: "Antes de uma viagem, os estoicos não imaginavam apenas o destino bonito. Imaginavam o atraso, o roubo, a doença, o retorno incerto. Não por pessimismo, mas por preparação. Essa prática se chama premeditatio malorum — a premeditação dos males.",
      },
      {
        type: "paragraph",
        text: "A lógica é simples e contraintuitiva: o sofrimento maior não vem do evento ruim em si, mas da surpresa. Quando algo nos atinge de forma inesperada, somos arrastados pela emoção bruta. Quando já ensaiamos aquilo mentalmente, o golpe encontra um corpo preparado. Sêneca recomendava até fazer isso com as coisas boas da vida: lembrar que o filho, a casa, a saúde que você tem hoje podem não estar aqui amanhã. Não para viver com medo, mas para viver com atenção.",
      },
      {
        type: "paragraph",
        text: "Há um efeito colateral curioso dessa prática: ela não só reduz o impacto da perda, como aumenta a gratidão pelo que existe agora. Quando você ensaia a ausência de algo, o presente daquilo ganha peso. A premeditação não é um exercício de morbidez — é um exercício de lucidez. Você olha de frente para o que pode dar errado, e ao fazer isso, para de ser pego desprevenido pela vida.",
      },
      { type: "heading", text: "Os três níveis da premeditação" },
      {
        type: "paragraph",
        text: "Os estoicos praticavam a premeditação em vários níveis. O primeiro era o nível prático: antes de agir, considerar os obstáculos possíveis. Vou fazer uma viagem — o que pode dar errado? O avião pode atrasar, a bagagem pode se perder, o hotel pode ser pior do que o esperado. Não se trata de desistir da viagem, mas de entrar nela com os olhos abertos. O segundo nível era o existencial: lembrar que tudo o que você ama é temporário. Seu filho é mortal, sua esposa é mortal, seus amigos são mortais. Não no sentido de viver com medo da perda, mas no sentido de não tratar o que é frágil como se fosse eterno.",
      },
      {
        type: "paragraph",
        text: "Sêneca escreveu uma carta famosa sobre isso, na qual dizia que devemos amar nossos entes queridos sabendo que eles podem ser tirados de nós — não para sofrer antecipadamente, mas para não sermos pegos de surpresa quando isso acontecer. Ele comparava essa prática a um general que estuda os possíveis ataques do inimigo antes da batalha. Não é pessimismo; é estratégia. Aquele que já enfrentou a perda em pensamento tem mais recursos para enfrentá-la na realidade.",
      },
      { type: "heading", text: "A premeditação da própria morte" },
      {
        type: "paragraph",
        text: "Há ainda um terceiro nível, mais radical: a premeditação da própria morte. Os estoicos recomendavam meditar sobre a mortalidade não como morbidez, mas como forma de calibrar o que importa. Se você sabe que vai morrer, o que realmente vale a pena? A resposta costuma ser: não a competição por status, não a acumulação de posses, não a ansiedade sobre o que os outros pensam. A morte, encarada de frente, funciona como um filtro que separa o essencial do acessório.",
      },
      {
        type: "paragraph",
        text: "Marco Aurélio praticava isso constantemente. Em seus cadernos, ele escrevia lembretes como:",
      },
      {
        type: "quote",
        text: "Você pode deixar a vida agora mesmo. Que isso determine o que você faz, diz e pensa.",
      },
      {
        type: "paragraph",
        text: "Não era uma ameaça, mas um chamado à atenção. Se o tempo é limitado — e é —, então cada momento ganha peso. A premeditação da morte não é um exercício fúnebre; é um exercício de vida.",
      },
    ],
  },
  {
    number: 4,
    title: "O Presente Como Único Tempo Real",
    subtitle: "Por que viver no passado ou no futuro é viver no exílio",
    blocks: [
      {
        type: "paragraph",
        text: "Você já notou que quase nunca está onde está? No trabalho, pensa na casa. Em casa, pensa no trabalho. No presente, remoói o passado ou antecipa o futuro. Os estoicos diriam que isso é uma forma de desperdício — o único tempo que você realmente possui é este, agora, e você o entrega a tempos que não existem.",
      },
      {
        type: "paragraph",
        text: "Marco Aurélio, escrevendo para si mesmo em seus cadernos, repetia uma ideia com insistência quase obsessiva: mesmo a vida mais longa se reduz a isto — o momento presente. O passado já foi, o futuro ainda não é. Tudo o que você pode perder é o agora, porque é a única coisa que você tem. E ninguém pode perder algo que não possui.",
      },
      { type: "heading", text: "Três tempos, um só onde agir" },
      {
        type: "paragraph",
        text: "Os estoicos faziam uma distinção importante entre três tipos de tempo. O passado é imutável — não pode ser mudado, apenas lembrado ou esquecido. O futuro é incerto — não pode ser controlado, apenas antecipado ou temido. O presente é o único tempo em que se pode agir. É por isso que Marco Aurélio dizia que devemos viver como se estivéssemos morrendo — não porque a morte é iminente, mas porque o presente é o único lugar onde a vida realmente acontece.",
      },
      {
        type: "paragraph",
        text: "Isso não significa viver no imediatismo ou ignorar o planejamento. Significa reconhecer que o planejamento acontece agora, que a ação acontece agora, e que a ansiedade sobre o futuro também acontece agora — e que essa última é uma escolha ruim de onde colocar a atenção. O presente é o único palco em que você pode agir. Tudo o mais é ensaio mental ou memória.",
      },
      {
        type: "paragraph",
        text: "Há uma passagem famosa de Marco Aurélio que resume essa ideia:",
      },
      {
        type: "quote",
        text: "Não deixes que o futuro te perturbe. Tu vais encontrá-lo, se tiveres de o encontrar, com a mesma razão que agora usas para lidar com o presente.",
      },
      {
        type: "paragraph",
        text: "O futuro não é um lugar para onde você viaja; é uma série de presentes que chegarão um a um. A ansiedade sobre o futuro é uma tentativa de resolver hoje um problema que só existirá amanhã — e que, quando existir, terá recursos que hoje você não tem.",
      },
      { type: "heading", text: "Os dois tempos fantasmas" },
      {
        type: "paragraph",
        text: "Sêneca também insistia nisso. Ele dizia que a maior parte do sofrimento humano vem de duas coisas: remoer o passado e temer o futuro. Ambos são tempos que não existem. O passado não pode ser mudado; o futuro não pode ser controlado. Só o presente pode ser vivido. E no entanto, passamos a maior parte da vida em um desses dois tempos fantasmas, enquanto o único tempo real escorre entre os dedos.",
      },
      {
        type: "paragraph",
        text: 'Os estoicos chamavam isso de "viver no exílio" — estar ausente de onde se está. A cura não é uma técnica complicada: é simplesmente trazer a atenção de volta para o que está acontecendo agora. Não para o que aconteceu, não para o que pode acontecer, mas para o que está acontecendo. E agir sobre isso, se for o caso. Se não for, aceitar. O presente é o único lugar onde a vida pode ser vivida — e o único lugar onde a virtude pode ser praticada.',
      },
    ],
  },
  {
    number: 5,
    title: "Amor Fati",
    subtitle: "A diferença entre aceitar e amar o que acontece",
    blocks: [
      {
        type: "paragraph",
        text: "Há uma diferença entre aceitar o que acontece e amar o que acontece. A aceitação é passiva — você não luta, mas também não abraça. O amor fati é outra coisa: é a disposição de querer que as coisas sejam exatamente como são, inclusive as difíceis, porque foi isso que a realidade entregou.",
      },
      {
        type: "paragraph",
        text: 'Nietzsche cunhou a expressão, mas a raiz é estoica. Epicteto dizia que não devemos desejar que os acontecimentos sigam nosso desejo, mas desejar que sigam como seguem — e assim a vida fluirá bem. Não se trata de gostar da dor ou fingir que a perda é boa. Trata-se de parar de brigar com o fato consumado. A energia gasta em "isso não deveria ter acontecido" é energia que não sobra para "o que faço a partir disso?".',
      },
      {
        type: "paragraph",
        text: 'Amor fati não é conformismo. É a percepção de que o universo não está conspirando contra você nem a favor — ele simplesmente é. E dentro desse "simplesmente é", você ainda escolhe como responder. Amar o destino é parar de exigir que ele peça licença antes de acontecer.',
      },
      { type: "heading", text: "O cão amarrado à carroça" },
      {
        type: "paragraph",
        text: "Os estoicos tinham uma metáfora poderosa para isso: a do cão amarrado a uma carroça. Se o cão puxa a coleira na direção oposta ao movimento da carroça, ele é arrastado de qualquer forma — só que sofrendo. Se ele corre na mesma direção, ele é arrastado do mesmo jeito, mas sem sofrimento. A carroça é o destino; a coleira é a vida. Não podemos escolher para onde a carroça vai, mas podemos escolher se vamos resistir ou acompanhar. O amor fati é a arte de acompanhar.",
      },
      {
        type: "paragraph",
        text: "Isso não significa que não devemos tentar mudar as coisas. Os estoicos eram pessoas de ação — Marco Aurélio governava um império, Sêneca administrava finanças, Epicteto ensinava. Mas eles agiam sabendo que o resultado não estava em suas mãos. Faziam o que podiam, e depois aceitavam o que vinha. Não como derrota, mas como reconhecimento de que o universo tem mais variáveis do que a nossa vontade.",
      },
      { type: "heading", text: "Alinhar o desejo com a realidade" },
      {
        type: "paragraph",
        text: "Há uma passagem de Epicteto que ilustra bem isso:",
      },
      {
        type: "quote",
        text: "Não busques que os acontecimentos aconteçam como desejas; deseja que aconteçam como acontecem, e tua vida fluirá bem.",
      },
      {
        type: "paragraph",
        text: "A frase soa passiva, mas não é. Ela está dizendo: alinhe seu desejo com a realidade, em vez de exigir que a realidade se alinhe com seu desejo. Isso não é resignação; é sabedoria prática. Quem luta contra o que já aconteceu está lutando contra o impossível. Quem aceita o que aconteceu e decide o que fazer a partir daí está lidando com o possível.",
      },
      {
        type: "paragraph",
        text: "Amor fati é, no fundo, uma forma de gratidão radical. Não porque tudo é bom, mas porque tudo é o que é — e o que é pode ser trabalhado, transformado, transcendido. A pedra no caminho não é um obstáculo; é o caminho. O obstáculo não é algo a ser evitado; é algo a ser usado. Como dizia Marco Aurélio:",
      },
      {
        type: "quote",
        text: "O que impede a ação impulsiona a ação. O que está no caminho torna-se o caminho.",
      },
    ],
  },
  {
    number: 6,
    title: "Dever e Função Social",
    subtitle:
      "Por que Marco Aurélio via o poder como obrigação, não privilégio",
    blocks: [
      {
        type: "paragraph",
        text: "Marco Aurélio era imperador de Roma, o homem mais poderoso do mundo conhecido, e escrevia de madrugada para si mesmo lembretes sobre o que importava. Um deles aparecia sempre: você nasceu para cooperar. A imagem que ele usava era a das mãos e dos pés, dos olhos e das pálpebras — partes do mesmo corpo trabalhando juntas. A humanidade, para ele, era isso: um corpo só, com funções diferentes.",
      },
      {
        type: "paragraph",
        text: "A ideia de dever, no estoicismo, não é a de obrigação imposta de fora. É a de função natural. Assim como uma abelha produz mel porque é o que faz, o ser humano age em benefício do todo porque é o que faz. Isolar-se, agir apenas por interesse próprio, era para Marco Aurélio uma espécie de amputação — cortar-se do corpo a que pertence.",
      },
      { type: "heading", text: "A razão como ferramenta de cooperação" },
      {
        type: "paragraph",
        text: "Os estoicos viam a natureza humana como essencialmente social. Não somos indivíduos isolados que depois decidem cooperar; somos partes de um todo desde o início. A razão, que é o que nos distingue dos outros animais, não é uma ferramenta para competir melhor — é uma ferramenta para cooperar melhor. Marco Aurélio dizia que o que não é bom para a colmeia não é bom para a abelha. O interesse individual e o interesse coletivo não são opostos; são aspectos da mesma coisa.",
      },
      {
        type: "paragraph",
        text: "Isso não significa anular-se em favor do grupo. Os estoicos não pregavam o sacrifício cego do indivíduo. Pregavam o reconhecimento de que o indivíduo só se realiza plenamente quando age em harmonia com sua natureza social. Um ser humano que vive apenas para si está vivendo contra a própria natureza — e por isso não pode ser feliz. A virtude da justiça, nesse contexto, não é uma regra moral imposta de fora, mas a expressão natural de quem entende que faz parte de um todo maior.",
      },
      { type: "heading", text: "O dever que dá sentido à posição" },
      {
        type: "paragraph",
        text: "Marco Aurélio escrevia isso não como imperador, mas apesar de ser imperador. O poder não o dispensava da função social; o obrigava mais a ela. O dever não era um fardo imposto pela posição — era o que dava sentido à posição. Para o estoico, o que você faz pelos outros não é desconto na sua vida; é a própria vida se realizando.",
      },
      {
        type: "paragraph",
        text: "Há uma passagem famosa dos cadernos de Marco Aurélio que resume bem essa ideia:",
      },
      {
        type: "quote",
        text: "Ao amanhecer, quando custar levantar da cama, tenha em mente: eu me levanto para fazer o trabalho de um ser humano. Por que estou insatisfeito se vou fazer aquilo para que nasci e para o que fui trazido ao mundo? Ou fui feito para me aquecer debaixo das cobertas?",
      },
      {
        type: "paragraph",
        text: "A frase é um lembrete de que o trabalho, o dever, a contribuição — tudo isso não é um fardo, mas a realização da própria natureza. O imperador que se levanta para governar não está se sacrificando; está sendo quem é.",
      },
    ],
  },
  {
    number: 7,
    title: "Aceitação da Morte",
    subtitle: "Por que encarar a morte de frente é libertador, não mórbido",
    blocks: [
      {
        type: "paragraph",
        text: 'Você vai morrer. Os estoicos não achavam isso mórbido — achavam libertador. Sêneca dizia que quem aprendeu a morrer desaprendeu a servir. A morte, encarada de frente, esvazia o poder de muita coisa que nos escraviza: o medo da opinião alheia, a corrida por status, a ansiedade sobre o futuro. Nada disso sobrevive à pergunta "e se eu morrer amanhã?".',
      },
      {
        type: "paragraph",
        text: "A prática estoica não era temer a morte nem desejá-la, mas tê-la sempre presente como parte da vida. Não como ameaça, mas como conselheira. Marco Aurélio escrevia que a morte é um processo natural, como nascer, crescer, envelhecer — temer a natureza é temer a si mesmo. Você é feito de coisas que retornarão ao todo. Isso não é triste; é o que é.",
      },
      { type: "heading", text: "Uma visão sem além" },
      {
        type: "paragraph",
        text: "Os estoicos tinham uma visão materialista da morte: a alma, para eles, era também corpórea, e se dissolvia com o corpo. Não havia um além para onde ir, nem um julgamento final, nem uma recompensa eterna. A morte era simplesmente o fim — a dissolução dos elementos que compunham o ser. Eles não viam isso como um problema. Se a morte é a ausência de sensação, então não há nada a temer: onde a morte está, eu não estou; onde eu estou, a morte não está.",
      },
      {
        type: "paragraph",
        text: "Epicuro, que não era estoico, mas compartilhava essa visão, dizia:",
      },
      {
        type: "quote",
        text: "A morte não é nada para nós, porque o que se dissolve é insensível, e o que é insensível não é nada para nós.",
      },
      { type: "heading", text: "A morte como conselheira" },
      {
        type: "paragraph",
        text: "Mas os estoicos não paravam na lógica. Eles usavam a morte como ferramenta de vida. Sêneca dizia que devemos viver cada dia como se fosse o último — não no sentido de aproveitar desesperadamente, mas no sentido de não adiar o que importa. Se você soubesse que morreria hoje, o que faria? Provavelmente não perderia tempo com brigas mesquinhas, com ansiedades sobre o que os outros pensam, com a corrida por coisas que não importam. A morte, como conselheira, revela a hierarquia real dos valores.",
      },
      {
        type: "paragraph",
        text: "Marco Aurélio praticava isso constantemente. Em seus cadernos, ele escrevia:",
      },
      {
        type: "quote",
        text: "Não aja como se fosse viver dez mil anos. A morte paira sobre você. Enquanto vive, enquanto é possível, torne-se bom.",
      },
      {
        type: "paragraph",
        text: "A frase é um chamado à urgência — não à pressa, mas à seriedade. Se o tempo é limitado, então o que importa agora importa de verdade. A morte não é o oposto da vida — é o que dá contorno a ela. Sem o limite, nada teria peso. Com ele, cada escolha ganha gravidade e cada dia ganha valor.",
      },
      { type: "heading", text: "O grande igualador" },
      {
        type: "paragraph",
        text: "Há ainda uma dimensão social nessa aceitação. Os estoicos lembravam que a morte é o destino comum de todos — ricos e pobres, imperadores e escravos, sábios e tolos. Isso nivelava tudo. Marco Aurélio gostava de listar os imperadores que vieram antes dele, todos mortos e esquecidos. O que restou deles? Cinzas e histórias. A morte é o grande igualador, e por isso é também o grande libertador. Quem entende que vai morrer para de se levar tão a sério — e começa a levar a vida a sério.",
      },
    ],
  },
];

export const ODISSEIA_CHAPTERS: WisdomChapter[] = [
  {
    number: 1,
    title: "Partida e Nostalgia de Ítaca",
    subtitle: "O herói mais esperto da guerra ainda não sabe voltar pra casa",
    blocks: [
      {
        type: "paragraph",
        text: "Depois da Guerra de Troia, o primeiro inimigo que Odisseu enfrenta não é o Ciclope, nem a feiticeira Circe, nem as sereias — é o próprio coração. Dez anos de combate deveriam ter tornado a volta para casa uma necessidade absoluta, superior a qualquer outra coisa. No entanto, a viagem que Odisseu mais tarde narra aos feácios está cheia de desvios de rota, paradas voluntárias e decisões que mergulham a tripulação em perigo desnecessário. A Odisseia não é apenas a história de um homem que quer voltar para casa; é a história de um homem que, em vários momentos, parece esquecer que quer voltar para casa — ou, pior, parece querer outras coisas com a mesma força.",
      },
      {
        type: "paragraph",
        text: "Odisseu chora por Ítaca. Na ilha de Calipso, ele passa os dias sentado à beira-mar, olhando o horizonte, consumindo-se em lágrimas. Homero descreve essa cena com uma insistência quase dolorosa: o herói de mil ardis, o destruidor de Troia, o homem que enganou o Ciclope, reduzido a um náufrago sentimental que passa os dias olhando o mar. Na corte de Circe, depois de um ano de banquetes e prazeres, são os companheiros que precisam lembrá-lo de que ainda há um lar esperando. É um detalhe revelador: o líder precisa ser liderado de volta ao seu próprio desejo. Odisseu, em vários momentos, parece mais confortável na viagem do que no destino.",
      },
      { type: "heading", text: "O saqueador que não sabe parar de guerrear" },
      {
        type: "paragraph",
        text: "Mas há um detalhe ainda mais revelador: a primeira parada depois de Troia é Ismaro, cidade dos cícones, onde Odisseu e seus homens saqueiam, matam os homens e dividem as mulheres e o ouro. Isso não é comportamento de quem está voltando para casa — é a inércia da guerra continuando por conta própria. A primeira coisa que ele faz depois de dez anos de combate é... continuar combatendo. Não porque precise, mas porque não sabe fazer outra coisa.",
      },
      { type: "heading", text: "A glória como parte do que ele quer" },
      {
        type: "paragraph",
        text: 'Há uma passagem famosa no canto IX em que Odisseu interrompe sua narrativa para elogiar a própria astúcia. Ele conta como enganou Polifemo, como escapou, como venceu. E o faz com um prazer evidente, quase infantil. Odisseu não quer apenas chegar; ele quer chegar como o herói de uma história que valha a pena ser contada. Cada monstro vencido é material para o kleos — a glória imortal que os poetas cantam. Odisseu não "sofre" suas aventuras; ele as coleciona.',
      },
      {
        type: "paragraph",
        text: "Isso cria uma tensão que atravessa toda a epopeia. Odisseu quer voltar para Ítaca, mas também quer que a volta valha a pena. E essas duas coisas — o desejo de casa e o desejo de glória — nem sempre apontam para a mesma direção. Às vezes, a glória exige desvios. E Odisseu, quase sempre, escolhe o interessante.",
      },
      {
        type: "heading",
        text: "O caçador que ainda se mede pelo mundo heroico",
      },
      {
        type: "paragraph",
        text: 'Na décima rapsódia, Odisseu caça um cervo enorme na ilha de Circe. Homero descreve em detalhes como ele torce galhos de oliveira para fazer uma corda, como carrega o animal nos ombros até o acampamento. A cena é a caracterização de um homem que ainda se mede pelos padrões do mundo heroico. Ele não caça porque está com fome; caça porque é um caçador. Voltar para Ítaca, para ele, não é apenas voltar para casa: é voltar para o lugar onde ele é Odisseu, o de muitos ardis, o que não pode ser reduzido a "ninguém".',
      },
      { type: "heading", text: "Nostalgia de si mesmo" },
      {
        type: "paragraph",
        text: "Há ainda uma dimensão política nessa nostalgia. Odisseu é rei de Ítaca. A guerra o tirou de seu lugar no mundo e o colocou num navio, onde ele é apenas o comandante de um grupo de homens cansados. A nostalgia de Ítaca não é apenas saudade de casa; é saudade de si mesmo. É saudade de um tempo em que ele sabia quem era e qual era o seu lugar. A viagem é uma longa crise de identidade. Ítaca é o lugar onde todas as suas identidades — o saqueador, o prisioneiro, o amante, o sobrevivente — se reúnem e se resolvem.",
      },
      { type: "heading", text: "Uma Ítaca que só existe na memória" },
      {
        type: "paragraph",
        text: "Mas há um problema. Vinte anos se passaram. A Ítaca que Odisseu deixou não existe mais. Penélope envelheceu. Telêmaco cresceu. Os pretendentes ocuparam o palácio. Odisseu passa a maior parte da epopeia tentando voltar para um lugar que já não é o que ele deixou. E quando finalmente chega, precisa reconquistar tudo — o trono, a esposa, o filho, a casa. A nostalgia de Ítaca é, no fundo, nostalgia de uma Ítaca que só existe na memória. A viagem é longa não apenas porque o caminho é difícil, mas porque o destino também mudou.",
      },
    ],
  },
  {
    number: 2,
    title: "O Ciclope — Hybris e Astúcia",
    subtitle: "A inteligência vence a força, mas não vence a vaidade",
    blocks: [
      {
        type: "paragraph",
        text: "A caverna de Polifemo é um experimento sobre poder e inteligência levado ao extremo. O Ciclope tem força absoluta, mas não planta, não constrói navios, não conhece leis, não respeita Zeus.",
      },
      {
        type: "quote",
        text: "Os Ciclopes não se importam com Zeus, porque são mais fortes do que ele.",
      },
      {
        type: "paragraph",
        text: "A lei deles é o próprio punho. Isso é hybris — a desmedida, a recusa de reconhecer qualquer ordem superior a si mesmo. Polifemo não é apenas um monstro; é uma tese filosófica. Ele é o que acontece quando alguém decide que não há nada acima de si, nem deuses, nem leis, nem outros seres humanos.",
      },
      { type: "heading", text: "A hospitalidade sagrada negada" },
      {
        type: "paragraph",
        text: "Odisseu entra na caverna em nome da xenia, a hospitalidade sagrada. Na Grécia homérica, receber bem o estrangeiro era uma obrigação sagrada, protegida por Zeus Xenios. Polifemo não apenas recusa o dever de hospedar: ele devora seis dos companheiros de Odisseu. Naquele momento, o gigante reduz o valor humano ao valor de carne. É a negação mais radical da civilização — a recusa de reconhecer o outro como outro.",
      },
      { type: "heading", text: "Ninguém: a astúcia da linguagem" },
      {
        type: "paragraph",
        text: "Odisseu quer sacar a espada e matá-lo ali mesmo. Mas percebe rápido: se matar Polifemo, ninguém conseguirá remover a pedra que bloqueia a entrada. Precisa de algo mais do que força. Precisa de mētis.",
      },
      {
        type: "paragraph",
        text: 'Odisseu se apresenta como "Ninguém" (Outis). É um truque de linguagem, não de força. Quando Polifemo grita aos outros Ciclopes que "Ninguém" o está ferindo, a própria palavra o trai. Odisseu cega o gigante com uma estaca de oliveira endurecida no fogo — uma arma que é também um símbolo: a oliveira é a árvore de Atena, a deusa da sabedoria. A inteligência vence a força.',
      },
      {
        type: "paragraph",
        text: "A cegueira do Ciclope é a metáfora perfeita da hybris: quem se acha acima de tudo não vê nada. Polifemo não vê Odisseu porque não acredita que precise ver. Sua força o cegou antes mesmo de a estaca o cegar.",
      },
      { type: "heading", text: "O preço da vaidade" },
      {
        type: "paragraph",
        text: "Mas a vitória tem um preço. Ao fugir, Odisseu não resiste e grita seu nome verdadeiro, sua linhagem, sua glória. É esse momento de vaidade que permite a Polifemo invocar seu pai, Poseidon, e lançar a maldição: que Odisseu nunca chegue em casa, ou que chegue tarde, sozinho, em navio alheio, para encontrar uma casa cheia de desgraças. Sua falha não foi de estratégia, foi de caráter. No momento em que deveria silenciar, ele escolheu se exibir.",
      },
      {
        type: "paragraph",
        text: "Há uma ironia profunda nisso. Odisseu venceu Polifemo usando a astúcia, mas depois se comporta como Polifemo. Ele grita seu nome para o mar, como se o mundo precisasse saber quem ele é. É exatamente o que o Ciclope fazia: afirmar-se acima de tudo e de todos. A hybris de Odisseu é mais sutil que a de Polifemo, mas é a mesma hybris.",
      },
      { type: "heading", text: "Um espelho, não um monstro absoluto" },
      {
        type: "paragraph",
        text: 'Há ainda um detalhe que muitas vezes passa despercebido. Polifemo, ao contrário dos outros monstros que Odisseu encontra, não é uma criatura mágica nem um deus. Ele é um pastor, com ovelhas, queijo, uma vida simples. O que o torna monstruoso não é sua natureza, mas sua escolha. Isso significa que Polifemo não é um "outro" absoluto — é uma possibilidade humana. Qualquer um pode escolher viver como Polifemo. O Ciclope não é apenas um monstro; é um espelho.',
      },
    ],
  },
  {
    number: 3,
    title: "Éolo — A Tempestade Autoinfligida",
    subtitle: "A destruição que vem de dentro do próprio navio",
    blocks: [
      {
        type: "paragraph",
        text: "Éolo, senhor dos ventos, dá a Odisseu um presente perfeito: um saco de couro contendo todos os ventos contrários, deixando apenas o Zéfiro do lado de fora, soprando brandamente na direção de Ítaca. É um caminho livre para casa, um dom dos deuses. Não precisa lutar, não precisa enganar, não precisa sofrer. Basta navegar.",
      },
      { type: "heading", text: "A costa à vista" },
      {
        type: "paragraph",
        text: 'Nove dias se passam. No décimo, a costa de Ítaca aparece. Odisseu diz: "Já podemos ver os fogos acesos." Depois de vinte anos, o lar está ali, a poucas horas de distância. É o momento mais tenso de toda a epopeia — não porque haja um monstro à frente, mas porque não há. O perigo não está no mar; está no navio.',
      },
      {
        type: "paragraph",
        text: "Odisseu está exausto. Pela primeira vez em dez anos, ele solta o leme e dorme. É justamente aí que o erro acontece. Seus companheiros, vendo o saco de couro que Éolo deu a Odisseu, presumem que ele esconde ouro e prata. Abrem o saco. Todos os ventos presos escapam de uma vez, arrastando a frota de volta à ilha de Éolo.",
      },
      { type: "heading", text: "A desconfiança dos companheiros" },
      {
        type: "quote",
        text: "Ele traz ouro e prata para casa, e nós voltamos de mãos vazias.",
      },
      {
        type: "paragraph",
        text: "A desconfiança não nasce do nada. Ela nasce de uma assimetria: Odisseu recebeu um presente que não dividiu. A cena é uma aula de psicologia de grupo. Não importa que Odisseu estivesse certo; importa que os outros não sabiam disso. A confiança não é um dado; é uma construção. E Odisseu, por cansaço ou por descuido, deixou a confiança se degradar.",
      },
      { type: "heading", text: "O desejo de morrer" },
      {
        type: "paragraph",
        text: "Odisseu acorda e sua primeira reação é o suicídio. Ele pensa em se jogar ao mar e afundar. A volta para casa estava tão perto que podia ser vista. E agora se foi. A dor de ver o lar e perdê-lo é maior do que a dor de nunca tê-lo visto.",
      },
      {
        type: "paragraph",
        text: 'Mas Odisseu resiste. A frota volta ao ponto de partida, e Éolo desta vez o expulsa, declarando que Odisseu é "odiado pelos deuses". Éolo não diz que Odisseu errou; diz que Odisseu é odiado. O erro foi dos companheiros, mas a punição é de Odisseu. O líder responde pelos liderados. Sempre.',
      },
      { type: "heading", text: "O saco como metáfora do inconsciente" },
      {
        type: "paragraph",
        text: "Há uma leitura possível dessa passagem. O saco de couro é o inconsciente. Ele contém as forças que o herói não controla. Os companheiros, que representam os impulsos não dominados, abrem o saco e liberam o caos. A mensagem é clara: o que você não examina em si mesmo, mais cedo ou mais tarde, escapa e arrasta você de volta ao ponto de partida. E Odisseu, no auge do cansaço, falha nesse ponto. Ele dorme quando deveria vigiar. Ele confia quando deveria explicar. Ele guarda quando deveria dividir.",
      },
    ],
  },
  {
    number: 4,
    title: "Circe — Transformação e Apetite",
    subtitle: "O que sobra de um homem quando ele só quer comer e dormir",
    blocks: [
      {
        type: "paragraph",
        text: 'O palácio de Circe fica na ilha de Eeia, cercado por uma floresta densa. Lobos e leões vagueiam diante da porta — já foram homens, transformados em feras por suas poções. Ela tece em seu tear e canta com voz de deusa, e sua "hospitalidade" consiste em transformar os hóspedes em porcos.',
      },
      { type: "heading", text: "O chiqueiro da hospitalidade invertida" },
      {
        type: "paragraph",
        text: 'Odisseu envia vinte e dois companheiros para explorar. Circe os recebe com queijo, farinha, mel claro e vinho, misturando à comida "uma droga terrível, para que esquecessem a terra natal". Depois toca cada um com sua varinha e os tranca no chiqueiro. Eles têm cabeça, voz, cerdas e forma de porcos, mas a mente permanece como antes. Os homens não perdem a consciência; perdem a forma. É a metáfora perfeita da condição humana quando dominada pelo apetite: você sabe que poderia ser mais, mas está reduzido ao que come.',
      },
      {
        type: "paragraph",
        text: "Apenas Euríloco escapa, porque parou no umbral, desconfiado. É um detalhe importante: a salvação vem da hesitação. Quem entra sem pensar é transformado; quem para na porta e desconfia escapa.",
      },
      { type: "heading", text: "Móly e a negociação da astúcia" },
      {
        type: "paragraph",
        text: "Quando volta ao navio e relata, Odisseu pega a espada e corre para o palácio. Mas Hermes o intercepta no caminho e lhe dá uma erva mágica, o móly, e instruções: quando Circe tocar você com a varinha, saque a espada e finja que vai matá-la, exigindo que ela jure não te fazer mal.",
      },
      {
        type: "paragraph",
        text: "Odisseu obedece. Quando a domina, com a lâmina no pescoço da feiticeira, Circe se rende. A negociação é fria, calculada, quase contratual. Odisseu não se deixa levar pelo desejo nem pela raiva; ele impõe condições. É a mētis outra vez, mas agora aplicada à sedução.",
      },
      { type: "heading", text: "Um ano de esquecimento" },
      {
        type: "paragraph",
        text: "Ficam na ilha um ano inteiro, entre banquetes, vinhos e leitos. Só quando os companheiros começam a pressioná-lo é que Odisseu se lembra de Ítaca. Odisseu não acorda um dia e decide partir; são os outros que o acordam. Ele está confortável demais para querer ir.",
      },
      { type: "heading", text: "O porco como símbolo do apetite" },
      {
        type: "paragraph",
        text: "Circe e Polifemo formam um par revelador. O Ciclope tenta devorar Odisseu pela violência; Circe tenta retê-lo pelo desejo. A transformação em porco é, no fundo, a supressão do impulso heroico: o guerreiro vira animal satisfeito, que come e dorme e não pergunta mais nada. O porco é o símbolo do homem que só quer comer, dormir e procriar — o homem que trocou o logos pelo apetite.",
      },
      { type: "heading", text: "Perigo e sabedoria da mesma fonte" },
      {
        type: "paragraph",
        text: "Há ainda um detalhe interessante: Circe é a primeira figura feminina poderosa que Odisseu encontra, e a primeira que ele precisa enfrentar com armas. Ela começa como ameaça e termina como aliada — dá a Odisseu as instruções para o Hades, para as Sereias, para Cila e Caríbdis. Sem Circe, Odisseu não chega em casa. A mensagem é que o perigo e a sabedoria podem vir da mesma fonte. Não se trata de evitar Circe; trata-se de negociar com ela.",
      },
    ],
  },
  {
    number: 5,
    title: "A Descida ao Hades — Confronto com a Mortalidade",
    subtitle: "O que a morte ensina sobre por que vale a pena viver",
    blocks: [
      {
        type: "paragraph",
        text: "Antes de partir, Circe revela: para chegar em casa, você precisa ir ao Hades e consultar Tirésias, o profeta cego de Tebas. Odisseu chora — que homem vivo quer descer ao reino dos mortos? Mas vai. A descida ao Hades é o centro espiritual da Odisseia. Tudo antes é preparação; tudo depois é consequência.",
      },
      { type: "heading", text: "O ritual antes do mergulho" },
      {
        type: "paragraph",
        text: "O Hades fica nos confins do mundo, na terra do eterno crepúsculo. Odisseu cava uma cova, derrama mel, leite, vinho e água, sacrifica ovelhas e deixa o sangue correr para a fossa. As almas dos mortos sobem para beber, mas Odisseu as afasta com a espada, até que Tirésias apareça. Odisseu não entra no Hades como um turista; ele entra como um sacerdote.",
      },
      { type: "heading", text: "A profecia de Tirésias" },
      {
        type: "paragraph",
        text: "A profecia é curta e pesada: você pode voltar para casa, mas só se controlar seus desejos e os de seus homens. Quando chegarem à ilha de Trinácia, não toquem no gado do Sol — se tocarem, o navio e todos os homens serão destruídos. A profecia é uma síntese de toda a Odisseia: o retorno é possível, mas condicionado. Não basta querer voltar; é preciso merecer voltar. E o preço é o autodomínio.",
      },
      { type: "heading", text: "O abraço que se desfaz três vezes" },
      {
        type: "paragraph",
        text: "Mas o que quebra Odisseu não é a profecia. É a aparição de sua mãe, Anticleia, que morreu de saudade enquanto ele estava em Troia. Ela lhe diz que foi o carinho e a sabedoria dele que lhe tiraram a doce vida. Odisseu tenta abraçá-la três vezes; três vezes ela se desfaz como sombra ou sonho entre seus braços. É a primeira vez que ele entende o que é a morte — não os cadáveres do campo de batalha, mas a ternura que você nunca mais vai tocar.",
      },
      { type: "heading", text: "Aquiles: a glória vista do outro lado" },
      {
        type: "paragraph",
        text: "No Hades, Odisseu encontra Aquiles e diz que ele é mais glorioso que todos os mortais. Aquiles responde:",
      },
      {
        type: "quote",
        text: "Não embeleze a morte, Odisseu. Prefiro ser um trabalhador assalariado de um homem pobre na terra do que ser rei de todos os mortos.",
      },
      {
        type: "paragraph",
        text: "É a maior subversão de Homero aos valores heroicos. A glória do campo de batalha, vista do outro lado, é poeira. A Odisseia, que começa como continuação da Ilíada, termina como sua negação. A guerra não vale a pena. A glória não vale a pena. A vida vale a pena.",
      },
      { type: "heading", text: "Agamêmnon e a dúvida sobre o retorno" },
      {
        type: "paragraph",
        text: "Odisseu também encontra Agamêmnon, que lhe conta como foi assassinado pela esposa, Clitemnestra, ao voltar da guerra. A história é um aviso: o retorno pode ser mais perigoso que a partida. Odisseu ouve isso e pensa em Penélope. A descida ao Hades não é apenas um confronto com a morte; é um confronto com a dúvida.",
      },
      {
        type: "paragraph",
        text: "Odisseu sai vivo do Hades, mas sai com uma pergunta: se a morte é isso, para que serve viver? A resposta que ele encontra, aos poucos, é que a vida serve para voltar. Para abraçar a mãe que não pode mais ser abraçada. Para ver o filho que cresceu. Para sentar-se à mesa com a esposa que envelheceu. A vida não serve para a glória, nem para a aventura. Serve para o amor. E o amor, no Hades, é a única coisa que não se dissolve.",
      },
    ],
  },
  {
    number: 6,
    title: "Sereias, Cila e Caríbdis — Escolher Entre Dois Males",
    subtitle: "Quando não existe a opção boa, só a menos ruim",
    blocks: [
      {
        type: "paragraph",
        text: "Circe, antes da partida, entrega a Odisseu todas as instruções da rota. As Sereias encantam todos os que passam: os marinheiros saltam ao mar atrás do canto e morrem afogados. A solução: tapar os ouvidos dos companheiros com cera. Se você quiser ouvir, que eles te amarrem ao mastro. Odisseu escolhe ouvir.",
      },
      { type: "heading", text: "O canto que promete conhecimento" },
      {
        type: "paragraph",
        text: "Por quê? As Sereias não cantam apenas prazer. Elas cantam conhecimento:",
      },
      {
        type: "quote",
        text: "Sabemos tudo o que aconteceu em Troia, sabemos tudo o que acontece na terra larga.",
      },
      {
        type: "paragraph",
        text: "Para Odisseu, o homem de muitos ardis, não saber é uma forma de miséria. Ele prefere ser amarrado e sofrer do que passar ao largo sem ouvir. É a curiosidade como vício, como hybris intelectual.",
      },
      { type: "heading", text: "Amarrado pra poder ouvir" },
      {
        type: "paragraph",
        text: "Há um detalhe importante: Odisseu é o único que ouve. Os companheiros, com os ouvidos tapados, remam em silêncio, alheios ao canto. A cena é uma metáfora do conhecimento: quem sabe sofre mais, mas também vive mais. A cera nos ouvidos é a ignorância; as cordas no mastro são a disciplina. Odisseu escolhe a disciplina para poder ter a experiência.",
      },
      { type: "heading", text: "Escolher entre Cila e Caríbdis" },
      {
        type: "paragraph",
        text: "Quase sem tempo para digerir as Sereias, surge a próxima escolha: Cila, o monstro de seis cabeças que devora seis homens de uma vez; ou Caríbdis, o redemoinho capaz de tragar o navio inteiro. Circe diz: Cila é a melhor escolha, porque Caríbdis destrói a embarcação toda. Quando Odisseu olha para o redemoinho de Caríbdis, Cila estica as seis cabeças do outro lado e arrebata os seis homens mais fortes, que gritam seu nome no ar enquanto são devorados. Ele não pode salvá-los. Só pode ver.",
      },
      { type: "heading", text: "O cálculo trágico da liderança" },
      {
        type: "paragraph",
        text: '"Escolher entre dois males" tornou-se um problema clássico da filosofia política e da ética. Não é escolher entre o bem e o mal, mas entre qual mal é menor. Odisseu escolhe Cila porque perde seis em vez de todos. É uma escolha racional, mas não é uma escolha feliz. A racionalidade não elimina o sofrimento; apenas o distribui. A partir de Cila, ele sabe que não é onipotente.',
      },
      { type: "heading", text: "Duas formas de perigo" },
      {
        type: "paragraph",
        text: "Há ainda uma leitura possível em que Cila e Caríbdis representam dois tipos de perigo: o ataque súbito e violento que vem de fora, e o redemoinho interno que suga para dentro e destrói por inteiro. Odisseu escolhe o trauma externo porque pode sobreviver a ele. A mensagem é que é melhor enfrentar o inimigo de fora do que o inimigo de dentro. Mas Odisseu ainda perde seis homens. Não há vitória sem perda.",
      },
    ],
  },
  {
    number: 7,
    title: "Calipso — A Tentação da Imortalidade Confortável",
    subtitle: "Escolher ser humano quando a eternidade está à disposição",
    blocks: [
      {
        type: "paragraph",
        text: "A ilha de Calipso é onde Odisseu fica por mais tempo: sete anos. Ela é uma deusa, o ama, quer torná-lo seu marido, promete-lhe juventude imortal e vida eterna. A ilha é um paraíso: florestas, fontes, vinhas, pássaros, flores. É o lugar mais bonito da Odisseia. E é também a prisão mais sutil.",
      },
      { type: "heading", text: "O paraíso que também é prisão" },
      {
        type: "paragraph",
        text: "Odisseu passa os dias sentado à beira-mar, chorando, consumindo a própria vida com lágrimas. Mas quando Hermes chega, enviado por Zeus para ordenar que Calipso o liberte, ela faz uma pergunta afiada:",
      },
      {
        type: "quote",
        text: "Vocês, deuses, por que têm ciúmes dos mortais? Por que se opõem a que um homem durma com uma deusa?",
      },
      {
        type: "paragraph",
        text: "A pergunta é retórica, mas é também uma acusação. Calipso ama Odisseu. Ela não o prende por maldade; prende por amor. E o amor, quando não sabe soltar, vira prisão.",
      },
      { type: "heading", text: "Uma escolha entre dois bens" },
      {
        type: "paragraph",
        text: "Calipso oferece a Odisseu uma opção real: ficar, tornar-se imortal, permanecer jovem, amado, poupado para sempre do mar, dos monstros, da fome e da morte. Não é uma opção ruim. É confortável. É até razoável. E é por isso que a recusa é tão difícil. Não é uma escolha entre o bem e o mal; é uma escolha entre dois bens. Ficar é bom. Voltar é bom. O problema é que os dois não cabem na mesma vida.",
      },
      { type: "heading", text: "A recusa da imortalidade" },
      {
        type: "paragraph",
        text: "Mas Odisseu recusa. Escolhe voltar para Ítaca, para Penélope — uma esposa mortal, envelhecendo, talvez já casada com outro, cercada por mais de cem pretendentes. Escolhe um futuro incerto em vez de uma eternidade garantida. A escolha é o momento mais heroico da Odisseia, e não envolve nenhuma luta. Envolve apenas dizer não.",
      },
      {
        type: "paragraph",
        text: "Há uma passagem no canto V em que Odisseu responde a Calipso:",
      },
      {
        type: "quote",
        text: "Senhora, não fique zangada comigo. Sei que Penélope é inferior a você em beleza e em estatura. Ela é mortal; você é imortal e nunca envelhece. Mas mesmo assim, quero voltar para casa.",
      },
      {
        type: "paragraph",
        text: "A resposta é notável por sua honestidade. Odisseu não finge que Penélope é mais bonita ou mais interessante. Ele admite que Calipso é superior em tudo. E ainda assim quer voltar. O que ele quer não é beleza, nem juventude, nem prazer. É casa. É pertencimento.",
      },
      { type: "heading", text: "A mortalidade como condição da narrativa" },
      {
        type: "paragraph",
        text: "A imortalidade de Calipso é uma negação do tempo. Se Odisseu ficasse, nada mudaria nunca — nem envelhecimento, nem perda, nem morte, mas também nenhum crescimento, nenhuma escolha, nenhuma história. A imortalidade é a morte da narrativa. Odisseu quer uma vida que tenha começo, meio e fim — uma vida que possa ser contada. E uma vida contada é uma vida mortal.",
      },
      { type: "heading", text: "O paraíso privado contra o mundo com deveres" },
      {
        type: "paragraph",
        text: "Há ainda uma dimensão política. Odisseu é rei. Se ficar em Ogígia, abandona seu povo, sua esposa, seu filho. A recusa da imortalidade é também a recusa do individualismo: ele não pode ser feliz sozinho num paraíso; precisa ser feliz em Ítaca, com os seus. Calipso oferece o paraíso; Odisseu escolhe o mundo.",
      },
    ],
  },
  {
    number: 8,
    title: "Os Feácios — Hospitalidade (Xenia)",
    subtitle: "O único povo que trata Odisseu como gente, não como presa",
    blocks: [
      {
        type: "paragraph",
        text: "Os feácios são o único povo verdadeiramente civilizado que Odisseu encontra. Navegadores exímios, protegidos de inimigos, vivendo em paz e abundância. Quando Odisseu, nu, coberto de salmoura, é jogado em sua costa pelas ondas, a princesa Nausícaa o encontra.",
      },
      { type: "heading", text: "Nausícaa na praia" },
      {
        type: "paragraph",
        text: "Ela não foge nem ri: dá-lhe roupa e comida, explica como entrar no palácio, como pedir ajuda à rainha Arete. Nausícaa é jovem, solteira, e encontra um homem nu na praia. Ela poderia se assustar, poderia fugir. Em vez disso, ela o trata como um ser humano.",
      },
      { type: "heading", text: "Uma hospitalidade ritual" },
      {
        type: "paragraph",
        text: "O rei Alcínoo e os feácios recebem Odisseu com banquetes, jogos, danças e, sobretudo, escuta. A xenia dos feácios é uma restauração da humanidade de Odisseu. Depois de anos sendo engolido, transformado e retido por monstros e deusas, finalmente alguém simplesmente o trata bem — um tratamento ritual, sagrado, que reconhece Odisseu como hóspede, como ser humano.",
      },
      { type: "heading", text: "A cura pela narrativa" },
      {
        type: "paragraph",
        text: "Eles ouvem a história de Odisseu sem interromper, sem duvidar, sem exigir provas. É a primeira vez, em toda a epopeia, que Odisseu pode simplesmente contar o que aconteceu. A narrativa é a cura. Ao contar, ele organiza o caos. Ao contar, ele se torna o herói da própria história.",
      },
      { type: "heading", text: "O preço da generosidade" },
      {
        type: "paragraph",
        text: 'Mas a história dos feácios tem um final sombrio. Quando finalmente levam Odisseu a Ítaca, Poseidon pune o povo por essa "ajuda excessiva": transforma o navio deles em pedra e sela o porto da cidade. Os feácios fizeram tudo certo — receberam o estrangeiro, honraram a xenia, ajudaram o necessitado — e foram destruídos por isso. A mensagem é que a justiça não é uma garantia. Às vezes, fazer o bem custa caro.',
      },
      { type: "heading", text: "Uma utopia que não sobrevive ao mundo real" },
      {
        type: "paragraph",
        text: "Os feácios são uma utopia que não pode sobreviver ao contato com o mundo real. Eles vivem isolados, protegidos, em paz; quando ajudam Odisseu, quebram o isolamento e atraem a ira de Poseidon. A civilização, para existir, precisa de fronteiras — a hospitalidade absoluta é impossível num mundo governado por deuses vingativos. Os feácios são bons demais para este mundo, e o mundo os pune por isso.",
      },
    ],
  },
  {
    number: 9,
    title: "O Retorno Disfarçado a Ítaca",
    subtitle: "Precisar virar ninguém de novo pra poder ser alguém outra vez",
    blocks: [
      {
        type: "paragraph",
        text: "Odisseu finalmente volta a Ítaca — mas chega adormecido, depositado na praia por marinheiros feácios. Acorda sem reconhecer sua própria ilha, porque Atena cobriu tudo com névoa. A deusa aparece disfarçada de pastor adolescente e lhe diz:",
      },
      { type: "quote", text: "Você está em Ítaca." },
      {
        type: "paragraph",
        text: "A reação de Odisseu não é êxtase, é desconfiança. Depois de vinte anos de monstros, feiticeiras e deuses mentirosos, Odisseu desconfia até da própria casa.",
      },
      { type: "heading", text: "Transformado em mendigo" },
      {
        type: "paragraph",
        text: 'Atena revela sua forma verdadeira e ri. Mas não o ajuda a vencer de imediato: primeiro o transforma num mendigo andrajoso, careca, enrugado. Odisseu precisa voltar ao próprio palácio como "ninguém", e usar mais uma vez a mētis — agora não contra monstros, mas contra pessoas. Odisseu passou vinte anos tentando voltar a ser Odisseu. Agora, ao chegar, precisa deixar de ser Odisseu outra vez.',
      },
      { type: "heading", text: "A hospitalidade de Eumeu" },
      {
        type: "paragraph",
        text: 'Ele vai primeiro à cabana do velho porqueiro Eumeu. Eumeu não o reconhece, mas mesmo assim lhe dá comida e cama — a xenia em sua forma mais pura: bondade a um completo estranho. Odisseu não pode revelar quem é, mas começa a contar uma história inventada sobre "Odisseu", uma história em que ele voltará. O mentiroso diz a verdade sem saber; o crédulo ouve a mentira sem desconfiar.',
      },
      { type: "heading", text: "Argos, o cão que esperou" },
      {
        type: "paragraph",
        text: "Depois entra em seu próprio palácio como mendigo. Vê Penélope, os pretendentes que consomem sua herança, e o velho cão Argos, deitado no esterco, à beira da morte. Argos o reconhece, abana o rabo e morre. É o momento mais silencioso e mais doloroso da epopeia: um cão reconheceu o dono, mas não pôde esperar que ele tirasse o disfarce.",
      },
      {
        type: "paragraph",
        text: "Odisseu vê Argos e chora, mas disfarça as lágrimas — precisa manter o disfarce. Mas o cão sabe. O cão sempre sabe. Nem sempre quem nos conhece melhor é quem mais fala.",
      },
      { type: "heading", text: "Mētis como a arte de esperar" },
      {
        type: "paragraph",
        text: "O disfarce de mendigo é a prova final de Odisseu. Ele passou vinte anos usando a astúcia contra inimigos. Agora precisa usá-la contra si mesmo — conter a raiva quando é humilhado, conter o orgulho quando é expulso do próprio salão, conter o amor quando vê Penélope. A mētis, no fim, é a arte de esperar. Odisseu não reconquista Ítaca com força; reconquista com paciência. E a paciência, no fim, é a forma mais difícil de coragem.",
      },
    ],
  },
  {
    number: 10,
    title: "Reconhecimento Final e Vingança",
    subtitle: "O segredo que só os dois sabem, e o sangue que restaura a ordem",
    blocks: [
      {
        type: "paragraph",
        text: 'Homero dedica um canto inteiro ao reconhecimento entre Odisseu e Penélope. Não é um simples "voltei". Penélope não acredita em ninguém. Vinte anos de espera e cento e oito pretendentes a cercando a tornaram cautelosa com tudo.',
      },
      { type: "heading", text: "O teste da cicatriz" },
      {
        type: "paragraph",
        text: "Ela manda a velha ama Euricleia lavar os pés do mendigo — se for Odisseu, a cicatriz no pé falará. Euricleia, ao lavar os pés, apalpa a cicatriz da presa do javali no monte Parnaso. Ela o reconhece e quase grita. Odisseu tapa sua boca:",
      },
      { type: "quote", text: "Quer me matar?" },
      { type: "heading", text: "O teste da cama" },
      {
        type: "paragraph",
        text: "Mas Penélope ainda não o reconhece. Ela arma um teste: manda trazer a cama de casal para o hóspede dormir. Odisseu explode:",
      },
      {
        type: "quote",
        text: "Quem pode mover aquela cama? Fui eu que a fiz, com meus próprios braços. Um dos pés é uma oliveira viva, que eu serrei e trabalhei como coluna.",
      },
      {
        type: "paragraph",
        text: "Só Odisseu sabe esse segredo. Os joelhos de Penélope fraquejam. Ela corre para ele, chorando. Penélope não reconhece Odisseu pelo rosto, nem pela voz. Reconhece pelo segredo — a intimidade que resistiu a vinte anos de separação. A cama de oliveira é a metáfora perfeita do casamento: uma árvore viva, enraizada na terra, que ninguém pode mover.",
      },
      { type: "heading", text: "A chacina no salão" },
      {
        type: "paragraph",
        text: "Na manhã seguinte, Odisseu tranca as portas do salão. Começa a flechar, sem piedade, sem hesitação. Antínoo — o mais arrogante dos pretendentes — cai primeiro. Quando as flechas acabam, Odisseu veste a armadura, pega a lança e luta ao lado de Telêmaco, Eumeu e Filético. O palácio é lavado com sangue.",
      },
      { type: "heading", text: "Justiça cósmica, não vingança pessoal" },
      {
        type: "paragraph",
        text: "A vingança é brutal. Mas é preciso entender o contexto: na Grécia homérica, a honra era tudo. Os pretendentes não apenas ocuparam a casa de Odisseu; violaram a xenia, consumiram sua herança, assediaram sua esposa, conspiraram contra seu filho. Eles mereciam morrer, segundo os padrões da época. Odisseu não mata apenas para se vingar; mata para reconquistar o trono e restaurar a ordem. A matança é uma limpeza política — violenta, cruel, mas necessária.",
      },
      { type: "heading", text: "Uma reconstrução, não um retorno" },
      {
        type: "paragraph",
        text: 'Ítaca volta a ser de Odisseu. Mas não é um final de conto de fadas. Ele ainda terá que partir de novo, conforme a profecia de Tirésias, e só então voltar a Ítaca para esperar a morte "vinda do mar". Odisseu não volta para Ítaca; ele constrói uma nova Ítaca, com sangue e astúcia. A vida não termina quando você chega em casa. A vida continua. E Odisseu, o homem de muitos ardis, continua sendo o homem que não pode ficar parado.',
      },
    ],
  },
];

export const WISDOM_TOPICS: WisdomTopic[] = [
  {
    slug: "decisoes-vieses",
    title: "Decisões e Vieses",
    subtitle: "Como o cérebro se engana ao decidir",
    icon: "git-branch-outline",
    color: "#3b82f6",
    chapters: DECISOES_VIESES_CHAPTERS,
  },
  {
    slug: "estoicismo",
    title: "Estoicismo",
    subtitle: "Serenidade diante do que não depende de você",
    icon: "shield-outline",
    color: "#8b5cf6",
    chapters: ESTOICISMO_CHAPTERS,
  },
  {
    slug: "odisseia",
    title: "Odisseia",
    subtitle: "Lições da jornada de Ulisses",
    icon: "boat-outline",
    color: "#2ec4b6",
    chapters: ODISSEIA_CHAPTERS,
  },
];

export function getWisdomTopic(slug: string): WisdomTopic | undefined {
  return WISDOM_TOPICS.find((topic) => topic.slug === slug);
}
