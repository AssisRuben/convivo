/**
 * Conteúdo das "Pílulas de sabedoria" — um capítulo curto por dia.
 * Estruturado em blocos (em vez de markdown solto) pra cada tela de
 * leitura controlar tipografia e espaçamento sem precisar parsear texto.
 * Novos capítulos entram só adicionando ao array abaixo.
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

export const WISDOM_CHAPTERS: WisdomChapter[] = [
  {
    number: 1,
    title: "Os Dois Cérebros que Decidem por Você",
    subtitle: "Por que pessoas inteligentes tomam decisões ruins",
    blocks: [
      { type: "paragraph", text: "Imagine dois cenários." },
      {
        type: "paragraph",
        text: "No primeiro, você está atravessando a rua e um carro surge em alta velocidade. Você não \"pensa\" — seu corpo já pulou para a calçada antes mesmo de você processar conscientemente o perigo.",
      },
      {
        type: "paragraph",
        text: "No segundo, você está lendo um contrato de fornecedor, tentando decidir se aquela cláusula de reajuste é vantajosa a longo prazo. Você lê devagar, recalcula, compara cenários, hesita.",
      },
      { type: "paragraph", text: "Duas decisões. Dois cérebros completamente diferentes trabalhando." },
      {
        type: "paragraph",
        text: "O psicólogo Daniel Kahneman passou a carreira estudando essa dualidade e a resumiu em dois sistemas. O Sistema 1 é rápido, automático, intuitivo — o que te tirou da frente do carro. O Sistema 2 é lento, deliberado, custoso — o que analisou o contrato. Um não é \"melhor\" que o outro; são ferramentas para problemas diferentes.",
      },
      {
        type: "paragraph",
        text: "O problema é que o Sistema 1, por ser rápido e não pedir esforço, acaba tomando conta de decisões que deveriam ser do Sistema 2. Ele foi moldado pela evolução para julgar predadores em frações de segundo — não para avaliar se um investimento faz sentido em cinco anos. Quando você usa reflexo onde deveria usar reflexão, o erro que aparece não é aleatório. Ele é sistemático e previsível. É isso que chamamos de viés cognitivo: não uma falha de caráter ou de inteligência, mas o preço estrutural de pensar rápido.",
      },
      {
        type: "paragraph",
        text: "Entender essa mecânica muda a pergunta que você faz de si mesmo. Ao invés de \"por que errei essa decisão?\", a pergunta certa vira: \"em que momento deixei o Sistema 1 decidir sozinho algo que exigia o Sistema 2?\"",
      },
      { type: "heading", text: "O espelho que só mostra o que você quer ver" },
      {
        type: "paragraph",
        text: "O primeiro vício de fábrica do Sistema 1 é buscar confirmação, não verdade. Chama-se viés de confirmação: a tendência de procurar, notar e lembrar com mais força as informações que sustentam o que você já acredita — e de descartar ou minimizar o que contradiz.",
      },
      {
        type: "paragraph",
        text: "Pense num empreendedor que acredita que seu novo produto vai bombar. Ele conversa com cinco potenciais clientes. Três demonstram entusiasmo educado, dois fazem objeções sérias sobre preço. Na cabeça dele, a conversa vira \"3 de 5 amaram\" — as objeções somem do resumo mental, porque não cabem na história que ele já queria contar.",
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
        text: "Uma reforma que já consumiu o dobro do orçamento previsto, mas continua sendo bancada \"porque já gastamos tanto, não dá pra parar agora\". Um projeto que todo mundo sabe, silenciosamente, que não vai dar certo — mas ninguém encerra, porque encerrar significaria admitir que o investimento anterior foi em vão.",
      },
      {
        type: "paragraph",
        text: "O erro lógico aqui é claro quando você o vê de fora: dinheiro gasto no passado é irrecuperável, quer você continue quer pare. A única pergunta racional é sobre o futuro — \"dado o que sei hoje, vale a pena continuar investindo a partir de agora?\" — e essa pergunta nunca deveria ter o passado como argumento.",
      },
      { type: "heading", text: "A ilusão da certeza" },
      {
        type: "paragraph",
        text: "O terceiro vício é o mais silencioso e o mais estudado em decisões de negócio: excesso de confiança. A maioria das pessoas superestima sistematicamente a precisão do que sabe e a probabilidade de estar certa.",
      },
      {
        type: "paragraph",
        text: "O sintoma é fácil de reconhecer: alguém diz \"isso vai dar certo\" com convicção total, mas nunca escreveu, nem para si mesmo, uma lista honesta de por que poderia não dar certo. A confiança nasceu da ausência de contra-argumento, não da presença de evidência.",
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
        text: "A pergunta convencional antes de decidir é \"por que isso vai dar certo?\" — e essa pergunta, você já sabe, ativa exatamente o viés de confirmação, porque o cérebro corre atrás de razões para confirmar o que já quer fazer.",
      },
      { type: "paragraph", text: "O pré-mortem inverte a pergunta:" },
      {
        type: "quote",
        text: "Já se passou um ano. Esse projeto foi um fracasso completo. O que aconteceu?",
      },
      {
        type: "paragraph",
        text: "A diferença parece pequena, mas é enorme na prática. Ao tratar o fracasso como fato consumado — não como possibilidade hipotética e desconfortável — o cérebro para de se defender e começa a investigar. As pessoas listam riscos reais que jamais mencionariam numa reunião de \"vamos avaliar os riscos\", porque ali ainda soa como admitir fraqueza antes de começar.",
      },
      {
        type: "paragraph",
        text: "Imagine aplicar isso ao empreendedor do produto que \"vai bombar\": ao invés de perguntar por que vai dar certo, ele pergunta o que fez o produto fracassar em um ano. As respostas que emergem — \"o preço estava alto demais\", \"não validei com clientes reais, só com conhecidos\", \"o distribuidor atrasou a entrega\" — são exatamente os sinais que o viés de confirmação tinha apagado da conversa original.",
      },
      { type: "heading", text: "Síntese: o quadro mental" },
      {
        type: "paragraph",
        text: "Três vieses, um antídoto, uma pergunta que resume tudo:",
      },
      {
        type: "quote",
        text: "Antes de qualquer decisão importante, pergunte: \"Isso que estou sentindo é convicção baseada em evidência, ou é só a ausência de ter procurado o contrário?\"",
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
        text: "Um vendedor de carros pede R$ 80 mil por um veículo que, na cabeça dele, vale R$ 60 mil. Você entra na negociação sabendo disso. Ainda assim, quando fecha em R$ 65 mil, sai satisfeito — \"consegui um baita desconto\". Só que o número de referência nunca foi o valor real do carro. Foi o número que o vendedor disse primeiro.",
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
        text: "Ancoragem distorce o *ponto de partida*. Disponibilidade distorce a *percepção de risco*. Juntas, elas explicam boa parte das decisões ruins que parecem \"intuitivamente óbvias\" na hora, mas não resistem a uma análise fria.",
      },
      {
        type: "paragraph",
        text: "Um exemplo comum: uma empresa recebe uma proposta inicial de fornecedor com valor inflado de propósito. Mesmo negociando para baixo, o valor final continua alto — porque a âncora definiu a faixa de referência. Ao mesmo tempo, o comprador lembra de uma vez em que trocou de fornecedor e \"deu errado\", e essa lembrança disponível pesa mais do que deveria na decisão de continuar com o fornecedor atual, mesmo caro.",
      },
      { type: "heading", text: "Como se defender" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Antes de ouvir qualquer proposta, gere sua própria estimativa independente.** Pesquise o valor de mercado, calcule seu próprio número, antes de saber o que o outro lado está pedindo. Isso quebra o efeito da âncora antes que ela seja plantada.",
          "**Desconfie de decisões baseadas em \"um caso que eu lembro\".** Pergunte: qual é a taxa real, os dados agregados — não a exceção que ficou marcada na memória.",
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
        text: "**No mercado financeiro**, ela explica o \"efeito disposição\": investidores seguram ações que estão perdendo valor por tempo demais (esperando \"recuperar\", evitando reconhecer a perda formalmente) e vendem ações que estão ganhando valor cedo demais (com medo de perder o ganho já obtido) — exatamente o oposto do que a lógica de longo prazo recomendaria.",
      },
      {
        type: "paragraph",
        text: "**Na gestão de equipes**, ela explica por que mudanças organizacionais encontram tanta resistência. Um novo processo pode trazer ganhos reais de eficiência — mas as pessoas sentem, com mais força, o que estão \"perdendo\" da rotina antiga (controle, familiaridade, status) do que o ganho futuro incerto. Resistência a mudança raramente é preguiça; geralmente é aversão à perda operando.",
      },
      {
        type: "paragraph",
        text: "**Em precificação**, empresas aprenderam a explorar isso: \"você está perdendo R$ 200 se não aproveitar essa promoção hoje\" converte muito mais do que \"você pode ganhar R$ 200 de desconto\" — mesmo sendo matematicamente a mesma oferta. O cérebro reage de forma diferente à mesma informação, dependendo de como ela é enquadrada como ganho ou como perda.",
      },
      { type: "heading", text: "O lado traiçoeiro: decisões movidas por medo de perder, não por lógica" },
      {
        type: "paragraph",
        text: "O problema não é sentir aversão à perda — isso é parte da natureza humana. O problema é quando essa aversão **substitui** a análise racional. Alguém mantém um funcionário de baixa performance porque demitir \"parece uma perda\" (do investimento em treiná-lo), quando manter na verdade custa mais caro a longo prazo. Alguém não muda de fornecedor, de carreira, de estratégia — porque o medo de perder o que já tem pesa mais do que a avaliação honesta do que poderia ganhar.",
      },
      { type: "heading", text: "Como neutralizar" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Reformule a pergunta em termos de custo de oportunidade.** Ao invés de \"o que eu perco se mudar?\", pergunte \"o que eu já estou perdendo, todo dia, por não mudar?\" — isso equilibra a balança emocional.",
          "**Separe a decisão da história emocional por trás dela.** Um investimento ruim continua ruim independente de quanto você já \"sofreu\" nele — isso conecta com a falácia do custo afundado do capítulo anterior.",
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
          "Da próxima vez que sentir forte resistência a uma decisão, pergunte: \"isso é aversão à perda falando, ou é análise real de risco?\"",
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
        text: "A resposta intuitiva da maioria das pessoas é \"99%\". A resposta correta, na maioria dos cenários reais, costuma ser muito menor — às vezes abaixo de 10%. A diferença está numa informação que o cérebro ignora sistematicamente: a **taxa base**, ou seja, quão rara a doença é na população em geral. Se a doença afeta 1 em cada 10.000 pessoas, mesmo um teste muito preciso vai gerar mais falsos positivos do que verdadeiros positivos, simplesmente porque há muito mais gente saudável sendo testada do que gente doente.",
      },
      {
        type: "paragraph",
        text: "Esse erro — ignorar a informação geral (taxa base) e focar só no caso específico e vívido diante dos olhos — se chama **negligência da taxa base**, e ele não aparece só em medicina.",
      },
      { type: "heading", text: "Onde isso aparece nos negócios" },
      {
        type: "paragraph",
        text: "Um vendedor teve um mês espetacular. A empresa toda quer saber \"o que ele fez de diferente\" para replicar o sucesso — sem considerar que parte desse resultado pode ser simplesmente variação estatística normal, não competência excepcional replicável.",
      },
      {
        type: "paragraph",
        text: "Isso conecta com outro fenômeno próximo: a **regressão à média**. Desempenhos extremos — muito bons ou muito ruins — tendem a se normalizar ao longo do tempo, simplesmente por estatística, não porque algo mudou de fato. Um time que teve um trimestre excepcional provavelmente vai ter um trimestre \"normal\" a seguir — não porque piorou, mas porque o trimestre excepcional já continha uma boa dose de sorte que não se repete.",
      },
      {
        type: "paragraph",
        text: "O erro clássico de gestão: elogiar excessivamente o mês bom (achando que descobriu a fórmula do sucesso) e punir excessivamente o mês ruim seguinte (achando que houve queda de performance) — quando, estatisticamente, os dois foram só o pêndulo normal voltando ao centro.",
      },
      { type: "heading", text: "Por que o cérebro prefere a história à estatística" },
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
        text: "Numa reunião, alguém propõe reduzir o número de etapas de aprovação de um processo. Um colega responde: \"então você quer que a gente aprove qualquer coisa sem nenhum controle?\" Ninguém disse isso. A proposta era reduzir etapas redundantes, não eliminar controle. Mas a versão distorcida é mais fácil de atacar — e é nela que o debate vai se concentrar, se ninguém perceber o truque.",
      },
      {
        type: "paragraph",
        text: "Isso é o **espantalho** (*strawman*): distorcer o argumento do outro para uma versão mais fraca e exagerada, mais fácil de derrubar, e atacar essa versão em vez do argumento real. É uma das falácias mais comuns em qualquer discussão — profissional, política, familiar — porque funciona muito bem para \"vencer\" a discussão sem realmente refutar nada.",
      },
      { type: "heading", text: "\"Porque foi o chefe que disse\"" },
      {
        type: "paragraph",
        text: "A segunda falácia comum é o **apelo à autoridade**: aceitar uma afirmação como verdadeira só porque veio de alguém com posição, título ou experiência — sem avaliar o mérito do argumento em si.",
      },
      {
        type: "paragraph",
        text: "Autoridade é um bom indício, não uma prova. Um especialista pode estar errado; um argumento fraco não fica forte só porque quem disse tem cargo alto. O problema aparece quando \"foi o diretor que decidiu\" vira o fim da discussão, em vez do começo de uma avaliação — porque, dessa forma, decisões ruins nunca são questionadas, só obedecidas.",
      },
      { type: "heading", text: "\"Ou isso, ou aquilo\"" },
      {
        type: "paragraph",
        text: "A terceira é o **falso dilema**: apresentar apenas duas opções como se fossem as únicas possíveis, quando na verdade existe um espectro de alternativas.",
      },
      {
        type: "paragraph",
        text: "\"Ou cortamos custos, ou vamos falir\" ignora dezenas de posições intermediárias — renegociar contratos, aumentar receita, redesenhar processos. O falso dilema é sedutor porque simplifica a decisão e cria urgência — mas simplifica demais, e urgência artificial é uma ótima forma de empurrar decisões ruins.",
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
          "**Separe \"quem disse\" de \"o que foi dito\".** Pergunte: esse argumento se sustentaria mesmo se viesse de alguém sem cargo nenhum?",
          "**Quando alguém apresentar só duas opções, pergunte em voz alta: \"que outras opções existem entre essas duas?\"** — isso sozinho já quebra a maioria dos falsos dilemas.",
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
        text: "Um cliente que sempre respondeu rápido demora três dias para responder um e-mail. A reação automática de muita gente é: \"ele desistiu do negócio\". Mas essa conclusão ignora uma pergunta essencial: **quão provável era isso antes** de você ver esse sinal, e **quanto esse sinal específico realmente deveria mudar** essa probabilidade?",
      },
      {
        type: "paragraph",
        text: "Isso é o núcleo do **raciocínio bayesiano**: a ideia de que devemos atualizar nossas crenças de forma *proporcional* à força da nova evidência, sem nunca ignorar completamente o que já sabíamos antes (a crença prévia, ou \"prior\").",
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
          "**Quanto essa evidência deveria, racionalmente, mover minha crença original?** (Pouco. Talvez de \"95% que o negócio avança\" para \"85%\" — não para \"o negócio morreu\", como o pânico sugere.)",
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
        text: "Esse tipo de raciocínio é especialmente valioso em decisões com informação incompleta e incerteza real — negociações em andamento, avaliação de desempenho de equipe, decisões de investimento, diagnóstico de problemas técnicos. Em vez de \"isso prova que está tudo bem\" ou \"isso prova que está tudo errado\", a pergunta madura é sempre: \"o quanto isso muda o que eu já sabia?\"",
      },
      { type: "heading", text: "Como aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Antes de reagir a uma informação nova, escreva (mentalmente ou no papel) qual era sua crença antes dela.**",
          "**Classifique a força do sinal**: é um dado isolado e explicável por várias causas, ou é parte de um padrão consistente?",
          "**Ajuste sua crença de forma proporcional — não binária.** Raramente uma única informação deveria levar de \"tudo bem\" direto para \"tudo perdido\", ou vice-versa.",
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Pense numa vez em que você reagiu de forma extrema a um sinal fraco e isolado. O que sua crença anterior, mais sólida, dizia?",
          "Existe alguma crença forte que você mantém hoje apesar de evidências recentes consistentes na direção contrária?",
          "Na próxima situação incerta, tente escrever: \"antes disso eu achava X%; esse sinal muda para Y%\" — e veja se o ajuste que você fez de cabeça é exagerado ou proporcional.",
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
        text: "Numa sala de reunião, o líder apresenta uma proposta com entusiasmo visível. Ele pergunta se alguém tem objeções. Silêncio. Todo mundo concorda com a cabeça. A decisão é aprovada por unanimidade. Meses depois, o projeto fracassa — e, em conversas individuais, quase todo mundo admite que tinha dúvidas na hora da reunião, mas não quis ser \"o chato\" que trava o consenso.",
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
          "**Pressão sobre dissidentes**: quem levanta uma objeção é sutilmente visto como \"não estar no time\", o que ensina todo mundo a ficar quieto da próxima vez.",
          "**Excesso de confiança coletiva**: o grupo, reforçando-se mutuamente, desenvolve uma convicção mais forte do que qualquer evidência real sustentaria — o inverso do Capítulo 1, mas em versão coletiva.",
        ],
      },
      {
        type: "paragraph",
        text: "O perigo do groupthink é que ele não parece disfuncional de dentro. Parece harmonia, eficiência, \"estarmos todos alinhados\". É exatamente por parecer saudável que ele é tão difícil de perceber enquanto acontece.",
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
          "**Designe formalmente um \"advogado do diabo\"** — alguém com a tarefa explícita de argumentar contra a decisão favorita do grupo, mesmo que pessoalmente concorde com ela. Isso remove o custo social de discordar, porque a discordância virou papel, não opinião pessoal.",
          "**Colete opiniões individuais antes da discussão em grupo**, por escrito ou anonimamente. Isso evita que a opinião de quem fala primeiro ancore (veja o Capítulo 2) a opinião de todo mundo.",
          "**O líder deve declarar sua posição por último, não primeiro.** Quando quem lidera fala primeiro, a reunião inteira vira busca por confirmação, não avaliação real.",
          "**Trate silêncio como ausência de informação, nunca como concordância.** Pergunte diretamente: \"alguém vê um jeito disso dar errado?\" — em vez de \"alguém discorda?\".",
        ],
      },
      { type: "heading", text: "Para refletir e aplicar" },
      {
        type: "list",
        ordered: true,
        items: [
          "Lembra de uma decisão em grupo que, em retrospecto, todo mundo tinha dúvidas mas ninguém falou? O que impediu a fala?",
          "Da próxima vez que liderar uma discussão, você consegue falar por último?",
          "Que decisão futura sua poderia se beneficiar de um \"advogado do diabo\" formal antes de ser fechada?",
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
        text: "Isso não elimina o risco — mas tira a decisão do terreno emocional (\"tenho um bom pressentimento\") e coloca em números comparáveis entre opções diferentes.",
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
