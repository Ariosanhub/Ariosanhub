export type Lesson = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  orderIndex: number;
};

export const LESSONS: Lesson[] = [
  {
    slug: "boas-vindas-bem-estar",
    title: "O que é bem-estar, de verdade",
    category: "Fundamentos",
    orderIndex: 1,
    summary:
      "Bem-estar não é um estado fixo — é o equilíbrio dinâmico entre corpo, mente e emoções, construído por escolhas diárias.",
    content: `Bem-estar costuma ser tratado como sorte ou personalidade — "tem gente que nasceu mais tranquila". Na prática, é o resultado de três dimensões que se influenciam o tempo todo:

- **Físico**: sono, movimento, alimentação, energia disponível para o dia.
- **Mental**: como você interpreta os eventos — seus pensamentos automáticos, crenças e o diálogo interno.
- **Emocional**: sua capacidade de reconhecer, nomear e regular o que sente, sem reprimir nem ser dominado por isso.

Nenhuma dessas dimensões existe isolada. Uma noite mal dormida (físico) deixa a amígdala mais reativa e reduz a capacidade do córtex pré-frontal de regular impulsos (mental/emocional) — é por isso que tudo parece mais ameaçador quando você está exausto.

### Por que isso importa para você agora
Você está numa fase de transição: reconhecer um padrão antigo (ser permissivo, evitar confronto, temer autoridade) é o primeiro passo de qualquer mudança de comportamento. Esse reconhecimento não é fraqueza — é a parte mais difícil já feita.

**Prática de hoje**: escreva, em uma frase, qual comportamento você quer deixar de repetir e qual quer começar a praticar. Isso vira sua bússola nas próximas lições.`,
  },
  {
    slug: "cerebro-ameaca-social",
    title: "Por que dizer 'não' dá tanto medo",
    category: "Neurociência",
    orderIndex: 2,
    summary:
      "O cérebro trata rejeição social e ameaça física de forma parecida. Entender isso tira o peso moral de sentir medo ao se posicionar.",
    content: `Quando você imagina discordar do seu chefe ou colocar um limite, o corpo reage como se houvesse perigo real: coração acelera, pensamento trava, vontade de recuar. Isso não é falta de caráter — é fisiologia.

A **amígdala**, estrutura responsável por detectar ameaças, não distingue muito bem entre "posso ser demitido" e "um leão está me atacando". Estudos de neurociência social (Eisenberger e colegas) mostram que a exclusão e a desaprovação social ativam regiões parecidas com as da dor física.

Ao mesmo tempo, o **córtex pré-frontal** — responsável por avaliar riscos reais, planejar e regular emoções — é a região que "desliga" primeiro sob estresse alto. Resultado: quanto mais nervoso você fica antes de se posicionar, menos acesso tem à parte do cérebro que argumenta bem.

### O que fazer com essa informação
1. **Nomear o que está acontecendo**: "isto é meu sistema de ameaça ativado, não um fato sobre o risco real" já reduz a intensidade da resposta (rotulação afetiva, técnica validada em neurociência afetiva).
2. **Regular o corpo antes de agir**: respiração lenta (4s inspirar, 6s expirar) ativa o sistema parassimpático e devolve acesso ao córtex pré-frontal.
3. **Separar ameaça percebida de ameaça real**: seu emprego provavelmente não depende de um único momento de discordância bem colocada — isso é avaliação de risco, não intuição.

**Prática de hoje**: da próxima vez que sentir a "trava" antes de falar algo importante, pause 10 segundos, respire e pergunte: "isso é perigo real ou é meu sistema de alarme disparando cedo demais?"`,
  },
  {
    slug: "passivo-agressivo-assertivo",
    title: "Passivo, agressivo e assertivo: a diferença prática",
    category: "Assertividade",
    orderIndex: 3,
    summary:
      "Assertividade não é agressividade disfarçada. É comunicar sua posição com clareza, sem anular o outro nem anular a si mesmo.",
    content: `Muita gente evita se impor porque confunde **assertividade** com **agressividade**. São coisas diferentes:

- **Passivo**: você anula suas próprias necessidades para evitar conflito. Concorda mesmo discordando. Combustível: medo da reação do outro.
- **Agressivo**: você impõe sua posição desconsiderando o outro. Combustível: necessidade de controle ou vingança de algo reprimido.
- **Assertivo**: você expressa sua posição, necessidade ou limite com clareza e respeito — pelos outros e por você mesmo. Combustível: autorrespeito.

O padrão passivo tende a se acumular: cada "sim" que devia ser "não" gera ressentimento silencioso, que eventualmente explode como reação agressiva desproporcional — ou vira exaustão e desmotivação.

### Estrutura prática: DESC
Uma técnica clássica de treino assertivo (terapia comportamental) para conversas difíceis:

1. **D**escreva o fato, sem julgamento: "Notei que a tarefa foi redistribuída sem me avisar."
2. **E**xprese o efeito/sentimento: "Isso me deixou incerto sobre minhas responsabilidades."
3. **S**ugira o que você precisa: "Prefiro ser avisado antes de mudanças assim."
4. **C**onsequência positiva: "Vamos evitar retrabalho e alinhar expectativas mais cedo."

**Prática de hoje**: escolha uma situação real pendente (com seu chefe ou um liderado) e escreva as 4 frases do DESC para ela, mesmo que ainda não vá usar hoje.`,
  },
  {
    slug: "limites-no-trabalho",
    title: "Colocar limites sem culpa",
    category: "Assertividade",
    orderIndex: 4,
    summary:
      "Um limite bem colocado protege a relação profissional a longo prazo — quem nunca diz não também nunca é levado totalmente a sério.",
    content: `Um erro comum é achar que colocar limite = criar conflito. Na prática, ausência de limites cria os piores conflitos: expectativas mal alinhadas, sobrecarga silenciosa e ressentimento que aparece de forma indireta.

### Por que você evita
Provavelmente existe uma crença por trás ("se eu disser não, vão achar que não sou comprometido" / "se eu discordar do meu chefe, posso ser visto como problema"). Essas são **previsões**, não fatos — e no CBT (Terapia Cognitiva Comportamental) tratamos previsões catastróficas como hipóteses a testar, não verdades.

### Como testar a hipótese (experimento comportamental)
1. Escolha um limite de baixo risco para praticar primeiro (não o mais assustador).
2. Comunique de forma factual e calma, sem se justificar demais.
3. Observe o que **de fato** aconteceu — não o que você temia que aconteceria.
4. Registre o resultado real no seu diário. Isso constrói evidência contra a crença antiga.

### Frases prontas para adaptar
- "Consigo entregar isso até [data], mas não até amanhã — prefiro entregar com qualidade."
- "Entendo a urgência. Para eu priorizar corretamente, o que sai da minha lista atual?"
- "Não vou conseguir assumir essa responsabilidade extra agora, mas posso ajudar em [algo específico]."

**Prática de hoje**: identifique 1 situação em que você normalmente diria "sim" por reflexo, e planeje uma resposta que reflita sua real capacidade.`,
  },
  {
    slug: "reestruturacao-cognitiva",
    title: "Reestruturação cognitiva: mudando o pensamento automático",
    category: "TCC",
    orderIndex: 5,
    summary:
      "A técnica central da Terapia Cognitivo-Comportamental: identificar o pensamento automático, checar as evidências e construir um pensamento mais equilibrado.",
    content: `Pensamentos automáticos são rápidos, involuntários e parecem verdade absoluta no momento — mas frequentemente carregam distorções cognitivas (ex: catastrofização, leitura mental, tudo-ou-nada).

### O modelo ABC (Ellis) usado na TCC
- **A** (situação/gatilho): o que aconteceu de fato.
- **B** (crença/pensamento automático): o que você pensou sobre isso.
- **C** (consequência emocional e comportamental): como você se sentiu e agiu.

A maioria das pessoas acha que A causa C diretamente. Na TCC, é **B** que determina C — e é aí que mora a possibilidade de mudança, porque pensamentos podem ser examinados e reconstruídos.

### Os 5 passos do registro de pensamento (thought record)
1. Qual foi a situação?
2. Qual pensamento automático passou pela sua cabeça?
3. Qual emoção isso gerou, e com que intensidade (0-10)?
4. Quais evidências apoiam e quais contradizem esse pensamento?
5. Qual seria um pensamento mais equilibrado, baseado nas evidências reais?

Esse é exatamente o formato do **Diário TCC** deste app — cada vez que você o preenche, está treinando o cérebro a fazer essa checagem automaticamente, com o tempo.

**Prática de hoje**: registre um pensamento automático real de hoje no Diário TCC e complete os 5 passos.`,
  },
  {
    slug: "medo-de-perder-emprego",
    title: "Separando ameaça real de ameaça imaginada no trabalho",
    category: "Assertividade",
    orderIndex: 6,
    summary:
      "O medo de ser demitido por se posicionar raramente é proporcional ao risco real. Aprenda a avaliar isso com critério, não só com ansiedade.",
    content: `Medo de perder o emprego é um medo legítimo — tem base real (segurança financeira, identidade, rotina). O problema não é sentir o medo; é deixar que ele decida por você sem passar por uma avaliação racional.

### Perguntas para avaliar o risco real
1. Historicamente, pessoas foram demitidas nessa empresa por discordarem de forma respeitosa? Ou isso é uma suposição?
2. Você está confundindo "posicionar-se bem" com "ser insubordinado"? (veja a lição sobre assertividade)
3. Qual é o pior cenário realista — não o pior cenário imaginável — e o que você faria se ele acontecesse?
4. Qual é o custo de **não** se posicionar, mantido por anos? (esgotamento, estagnação, perda de autoestima)

### Um dado de neurociência útil aqui
Sob ameaça percebida (mesmo que não real), o corpo libera cortisol, que em excesso crônico prejudica memória, foco e regulação emocional. Ou seja: viver permanentemente "encolhido" no trabalho tem um custo biológico mensurável — não é só desconfortável, é caro para o seu cérebro a longo prazo.

### Reformulação prática
Trocar "preciso ser aceito o tempo todo para estar seguro" por "preciso ser competente, íntegro e claro — a aceitação incondicional de todos não é um objetivo realista nem necessário".

**Prática de hoje**: escreva o pior cenário *realista* (não catastrófico) de uma conversa difícil que você está evitando, e um plano simples para esse cenário.`,
  },
  {
    slug: "autoconfianca-neurociencia",
    title: "Como a autoconfiança é construída (não nasce pronta)",
    category: "Neurociência",
    orderIndex: 7,
    summary:
      "Autoconfiança é um circuito reforçado por repetição, não um traço fixo de personalidade. Cada ação assertiva pequena conta.",
    content: `Autoconfiança não é um sentimento que aparece antes da ação — na maioria das vezes, é uma consequência da ação repetida. Isso é neuroplasticidade aplicada: cada vez que você age de forma assertiva e sobrevive à experiência (mesmo que desconfortável), o cérebro atualiza a previsão de ameaça para baixo.

### O ciclo que mantém a insegurança
Evitar → alívio imediato (reforço negativo) → a crença de incapacidade nunca é testada → a próxima situação parecida continua assustadora.

### O ciclo que constrói confiança
Agir com desconforto controlado → observar o resultado real → atualizar a crença com dados novos → o próximo passo fica um pouco menos assustador.

Isso é literalmente **exposição gradual**, uma das técnicas mais estudadas da terapia comportamental: começar pelo degrau mais baixo da escada do medo, não pelo topo.

### Construindo sua escada
Liste de 3 a 5 situações que envolvem se posicionar, da menos para a mais assustadora. Exemplo:
1. Discordar de um colega de confiança em uma reunião pequena.
2. Dizer não a um pedido de um liderado.
3. Levar uma discordância técnica ao seu chefe.
4. Negociar um prazo ou expectativa diretamente com o chefe.

**Prática de hoje**: monte sua própria escada com 4 degraus e marque qual você já está pronto para tentar essa semana.`,
  },
  {
    slug: "lideranca-com-autoridade",
    title: "Liderar sem precisar ser aceito por todos",
    category: "Assertividade",
    orderIndex: 8,
    summary:
      "Para quem lidera pessoas: autoridade genuína vem de clareza e consistência, não de controle ou de agradar a todos.",
    content: `Se você lidera pessoas e também sente dificuldade em se impor, existe um padrão comum: tentar compensar a insegurança sendo excessivamente permissivo com a equipe, na esperança de ser bem-visto — o que, paradoxalmente, corrói a autoridade real.

### O que constrói autoridade de verdade
- **Clareza**: a equipe sabe o que se espera dela porque você comunica isso sem ambiguidade.
- **Consistência**: suas decisões não mudam conforme o humor ou a pressão do momento.
- **Consequência**: combinados têm peso — o que foi definido é sustentado.
- **Cuidado genuíno**: firmeza não exclui empatia; são complementares, não opostos.

### A armadilha da aprovação
Buscar aprovação constante de liderados e de superiores ao mesmo tempo é insustentável — os interesses nem sempre coincidem. Uma pergunta mais útil do que "vão gostar de mim?" é: "essa decisão é justa, clara e alinhada com o que a situação exige?"

### Neurociência da liderança sob estresse
Líderes sob alta ativação de ameaça tendem a decidir por impulsividade (reação da amígdala) ou por paralisia (evitação). Regular o próprio estado fisiológico antes de decisões importantes — respiração, pausa, nomear a emoção — é uma ferramenta de liderança, não luxo.

**Prática de hoje**: identifique uma decisão que você está adiando por medo da reação de alguém (chefe ou liderado), e escreva qual seria a decisão mais clara e justa, independente da aprovação.`,
  },
  {
    slug: "corpo-como-base",
    title: "Sono, movimento e o sistema nervoso: a base de tudo",
    category: "Fundamentos",
    orderIndex: 9,
    summary:
      "Nenhuma técnica cognitiva funciona bem em cima de um sistema nervoso exausto. Corpo regulado é pré-requisito para mente clara.",
    content: `Antes de qualquer técnica de reestruturação cognitiva ou assertividade, existe um fator que multiplica (ou sabota) todos os outros: o estado do seu sistema nervoso.

- **Sono insuficiente** reduz a atividade do córtex pré-frontal e aumenta a reatividade da amígdala — literalmente fica mais difícil pensar com clareza e mais fácil reagir por medo ou irritação.
- **Movimento físico regular** reduz cortisol basal e aumenta BDNF (fator neurotrófico), associado a neuroplasticidade e regulação de humor.
- **Respiração e pausas curtas ao longo do dia** ativam o sistema nervoso parassimpático, contrabalançando o estado de alerta constante do ambiente de trabalho.

Isso não substitui o trabalho cognitivo e comportamental das outras lições — é a fundação que faz esse trabalho render mais.

**Prática de hoje**: defina 1 hábito de base para acompanhar nesta semana (sono, movimento ou pausas) e cadastre-o na aba Hábitos.`,
  },
];
