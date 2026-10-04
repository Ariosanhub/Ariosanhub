// Fluenta — servidor HTTP mínimo (sem framework).
// Serve o frontend estático de /public e expõe 3 endpoints de IA:
//   POST /api/plan    -> gera o cronograma personalizado a partir do questionário
//   POST /api/chat    -> conversa com o tutor (resposta + correções + vocabulário)
//   POST /api/review  -> gera a aula de revisão semanal a partir do que o aluno errou/aprendeu
// Sem credencial da Anthropic configurada, roda em MODO DEMO com respostas simuladas.

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));

// Carrega fluenta/.env (ANTHROPIC_API_KEY=...) se existir — funciona igual no Windows, Mac e Linux.
try {
  process.loadEnvFile(path.join(here, ".env"));
} catch {
  // sem .env: usa as variáveis do sistema ou roda em modo demo
}
const PUBLIC_DIR = path.join(here, "public");
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.FLUENTA_MODEL || "claude-opus-5-5";
// Opcional: modelo só para o chat (ex.: claude-sonnet-5-5 responde mais rápido). Padrão: o mesmo MODEL.
const CHAT_MODEL = process.env.FLUENTA_CHAT_MODEL || MODEL;
const DEMO = !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN;

// Chave com escopo de Organização precisa dizer em qual workspace rodar (ANTHROPIC_WORKSPACE_ID=wrkspc_...).
const client = DEMO
  ? null
  : new Anthropic(process.env.ANTHROPIC_WORKSPACE_ID
    ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
    : {});

// ---------- Schemas de saída estruturada ----------

const strictObject = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const PLAN_SCHEMA = strictObject({
  level: { type: "string", description: "Nível CEFR estimado: A1, A2, B1, B2, C1 ou C2" },
  summary: { type: "string", description: "2-3 frases explicando a estratégia para esta pessoa" },
  dailyMinutes: { type: "integer" },
  weeks: {
    type: "array",
    items: strictObject({
      week: { type: "integer" },
      theme: { type: "string" },
      goal: { type: "string" },
      days: {
        type: "array",
        description: "7 dias: segunda a domingo. Domingo é sempre revisão.",
        items: strictObject({
          day: { type: "string", enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
          type: { type: "string", enum: ["lesson", "conversation", "review", "rest"] },
          title: { type: "string" },
          tasks: { type: "array", items: { type: "string" } },
          minutes: { type: "integer" },
          scenario: { type: "string", description: "Cenário de conversa ligado à rotina real da pessoa" },
        }),
      },
    }),
  },
});

const CHAT_SCHEMA = strictObject({
  reply: { type: "string", description: "Resposta do tutor no idioma-alvo, adequada ao nível" },
  translation: { type: "string", description: "Tradução curta da resposta no idioma nativo do aluno" },
  userTranslation: { type: "string", description: "Tradução da ÚLTIMA mensagem do aluno para o idioma nativo dele (como você entendeu). Vazio se ela já estiver no idioma nativo" },
  corrections: {
    type: "array",
    items: strictObject({
      original: { type: "string" },
      corrected: { type: "string" },
      explanation: { type: "string", description: "No idioma nativo do aluno, 1 frase" },
    }),
  },
  newVocab: {
    type: "array",
    items: strictObject({
      term: { type: "string" },
      meaning: { type: "string" },
    }),
  },
});

const REVIEW_SCHEMA = strictObject({
  title: { type: "string" },
  recap: { type: "string", description: "Resumo motivador do que a pessoa aprendeu na semana" },
  questions: {
    type: "array",
    items: strictObject({
      prompt: { type: "string" },
      options: { type: "array", items: { type: "string" } },
      answerIndex: { type: "integer" },
      explanation: { type: "string" },
    }),
  },
  speakingChallenge: { type: "string", description: "Desafio de conversa para fechar a revisão" },
});

// ---------- Chamada ao Claude ----------

async function askClaude({ system, messages, schema, effort, maxTokens = 16000, model = MODEL }) {
  // Streaming: o plano é uma resposta longa e o SDK exige stream nesses casos.
  const response = await client.beta.messages.stream({
    model,
    max_tokens: maxTokens,
    // Se o classificador de segurança recusar, a API refaz no modelo recomendado.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: { type: "json_schema", schema } },
    system,
    messages,
  }).finalMessage();

  if (response.stop_reason === "refusal") {
    throw Object.assign(new Error("O tutor não pôde responder a esta mensagem."), { status: 422 });
  }
  if (response.stop_reason === "max_tokens") {
    throw Object.assign(new Error("Resposta longa demais, tente novamente."), { status: 502 });
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw Object.assign(new Error("Resposta vazia do modelo."), { status: 502 });
  return JSON.parse(text);
}

function profileBlock(p) {
  return [
    `Idioma nativo: ${p.nativeLanguage}`,
    `Idioma-alvo: ${p.targetLanguage}`,
    `Nível autodeclarado: ${p.selfLevel}`,
    `Acertos no teste de nivelamento: ${p.placementScore ?? "?"} de ${p.placementTotal ?? "?"}`,
    `Objetivo: ${p.goal}`,
    `Profissão / ocupação: ${p.occupation}`,
    `Interesses: ${(p.interests || []).join(", ")}`,
    `Rotina: acorda ${p.wakeTime}, melhor horário para estudar: ${p.studyTime}`,
    `Minutos livres por dia: ${p.dailyMinutes}`,
    `Momentos mortos da rotina (trânsito, academia...): ${p.deadTime || "não informado"}`,
    `Estilo preferido: ${p.style}`,
    `Prazo desejado: ${p.deadline}`,
  ].join("\n");
}

const PLAN_SYSTEM = `Você é o coordenador pedagógico da Fluenta, uma escola de idiomas com IA focada em conversação.
Princípios: fluência vem de falar todos os dias; todo conteúdo deve sair da vida real do aluno (trabalho, hobbies, rotina);
blocos curtos que cabem nos minutos disponíveis; domingo é sempre aula de revisão da semana.
Monte um plano de 4 semanas (a pessoa renova o plano depois). Cada dia útil tem uma tarefa de conversa com o tutor de IA.
Os "scenarios" devem ser situações concretas da rotina descrita (ex.: reunião com fornecedor, pedir café antes do trabalho).
Escreva títulos, tarefas e o resumo no idioma nativo do aluno; os cenários podem mencionar frases no idioma-alvo.
Seja conciso: títulos curtos, no máximo 3 tarefas por dia (uma linha cada), cenário em uma frase, resumo em até 3 frases.`;

function chatSystem(p, scenario) {
  return `Você é o tutor de conversação da Fluenta. Converse SEMPRE no idioma-alvo (${p.targetLanguage}), ajustado ao nível ${p.level || p.selfLevel}.
Perfil do aluno:
${profileBlock(p)}

Cenário de hoje: ${scenario || "conversa livre sobre o dia do aluno"}.

Regras:
- Respostas curtas (1-3 frases) e sempre termine com uma pergunta para o aluno continuar falando.
- Use o vocabulário do trabalho, interesses e rotina do aluno.
- Corrija só erros relevantes (máx. 3) em "corrections"; se não houver erros, devolva lista vazia.
- Em "newVocab" liste até 3 palavras/expressões úteis que você usou e que o aluno provavelmente não conhece.
- "translation" e "explanation" ficam no idioma nativo do aluno (${p.nativeLanguage}).
- Em "userTranslation", traduza a última mensagem do aluno para ${p.nativeLanguage}, para ele conferir se o ditado por voz captou o que quis dizer.
- Se o aluno escrever no idioma nativo, ajude-o a dizer aquilo no idioma-alvo e peça para ele repetir.`;
}

const REVIEW_SYSTEM = `Você cria a aula de revisão semanal da Fluenta. Use os erros e o vocabulário reais da semana do aluno.
Crie 8 questões de múltipla escolha (4 opções cada), misturando: corrigir frase, escolher a palavra certa, traduzir expressão.
Explicações no idioma nativo do aluno. Feche com um desafio de conversa ligado à rotina dele.`;

// ---------- Respostas simuladas (modo demo) ----------

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function demoPlan(p) {
  const themes = [
    ["Apresentações e rotina", "Falar sobre você e seu dia sem travar"],
    [`Seu trabalho: ${p.occupation || "carreira"}`, "Explicar o que você faz e resolver situações do trabalho"],
    [`Seus interesses: ${(p.interests || ["hobbies"])[0]}`, "Ter conversas longas sobre o que você gosta"],
    ["Viagens e imprevistos", "Se virar sozinho em qualquer situação"],
  ];
  const minutes = Number(p.dailyMinutes) || 20;
  return {
    level: p.selfLevel?.slice(0, 2) || "A2",
    summary: `Plano de ${minutes} min/dia encaixado no seu horário (${p.studyTime}). Toda aula usa situações do seu trabalho e da sua rotina, com conversa diária com o tutor e revisão aos domingos.`,
    dailyMinutes: minutes,
    weeks: themes.map(([theme, goal], i) => ({
      week: i + 1,
      theme,
      goal,
      days: DAY_KEYS.map((day, d) => {
        if (day === "sun") {
          return { day, type: "review", title: "Aula de revisão da semana", tasks: ["Quiz com seus erros da semana", "Desafio de conversa final"], minutes, scenario: "Revisão" };
        }
        const conv = d % 2 === 1;
        return {
          day,
          type: conv ? "conversation" : "lesson",
          title: conv ? `Conversa: ${theme.toLowerCase()}` : `Aula ${d + 1}: ${theme}`,
          tasks: conv
            ? [`${Math.round(minutes * 0.7)} min de conversa com o tutor`, "Revise as correções no final"]
            : ["5 palavras novas do tema", `${Math.round(minutes * 0.5)} min de conversa guiada`, "Grave 1 áudio de 30s"],
          minutes,
          scenario: `${theme} — situação real do seu dia a dia`,
        };
      }),
    })),
  };
}

const DEMO_REPLIES = [
  "Nice to meet you! So, tell me: what does a normal day at work look like for you?",
  "That sounds busy! What is the most challenging part of your job?",
  "Interesting. How do you usually relax after a long day?",
  "Great answer! If you could travel anywhere next month, where would you go?",
];

function demoChat(history) {
  const turn = history.filter((m) => m.role === "user").length;
  const last = history.at(-1)?.content || "";
  const corrections = /\bi am work\b|\bi go to work in\b|\bpeoples\b/i.test(last)
    ? [{ original: last.slice(0, 60), corrected: "I work at...", explanation: "Use 'I work at' para dizer onde você trabalha." }]
    : turn % 2 === 0
      ? [{ original: "I have 30 years", corrected: "I am 30 years old", explanation: "Em inglês idade usa o verbo 'to be'." }]
      : [];
  return {
    reply: `[demo] ${DEMO_REPLIES[turn % DEMO_REPLIES.length]}`,
    translation: "(modo demo — configure ANTHROPIC_API_KEY para conversar com a IA de verdade)",
    userTranslation: "(modo demo) tradução da sua mensagem aparece aqui",
    corrections,
    newVocab: [{ term: turn % 2 ? "challenging" : "a normal day", meaning: turn % 2 ? "desafiador" : "um dia comum" }],
  };
}

function demoReview(body) {
  const vocab = body.vocab?.length ? body.vocab : [{ term: "challenging", meaning: "desafiador" }];
  const questions = vocab.slice(0, 4).map((v) => ({
    prompt: `O que significa "${v.term}"?`,
    options: [v.meaning, "cansado", "barato", "rápido"],
    answerIndex: 0,
    explanation: `"${v.term}" = ${v.meaning}.`,
  }));
  questions.push({
    prompt: "Qual frase está correta?",
    options: ["I have 30 years", "I am 30 years old", "I am 30 years", "I have 30 years old"],
    answerIndex: 1,
    explanation: "Idade em inglês usa 'to be' + 'years old'.",
  });
  return {
    title: `Revisão da semana ${body.week || 1}`,
    recap: `Você praticou ${body.messagesCount || 0} mensagens e aprendeu ${vocab.length} expressões. Vamos fixar!`,
    questions,
    speakingChallenge: "Conte ao tutor, em 4 frases, como foi sua semana usando 2 palavras novas.",
  };
}

// ---------- Rotas ----------

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw Object.assign(new Error("Payload muito grande"), { status: 413 });
  }
  return raw ? JSON.parse(raw) : {};
}

const routes = {
  "/api/config": async () => ({ demo: DEMO, model: DEMO ? null : MODEL }),

  "/api/plan": async (body) => {
    const p = body.profile || {};
    if (DEMO) return demoPlan(p);
    return askClaude({
      system: PLAN_SYSTEM,
      messages: [{ role: "user", content: `Monte o plano para este aluno:\n${profileBlock(p)}` }],
      schema: PLAN_SCHEMA,
      effort: "low", // plano é estruturado e direto: low corta bastante o tempo de espera
      maxTokens: 32000,
    });
  },

  "/api/chat": async (body) => {
    const history = (body.history || []).slice(-30);
    if (DEMO) return demoChat(history);
    const messages = history.map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
    return askClaude({
      system: chatSystem(body.profile || {}, body.scenario),
      messages,
      schema: CHAT_SCHEMA,
      effort: "low", // conversa precisa ser rápida
      model: CHAT_MODEL,
      maxTokens: 4000,
    });
  },

  "/api/review": async (body) => {
    if (DEMO) return demoReview(body);
    const material = {
      week: body.week,
      corrections: (body.corrections || []).slice(-40),
      vocab: (body.vocab || []).slice(-40),
    };
    return askClaude({
      system: REVIEW_SYSTEM,
      messages: [{
        role: "user",
        content: `Perfil:\n${profileBlock(body.profile || {})}\n\nMaterial da semana (JSON):\n${JSON.stringify(material)}`,
      }],
      schema: REVIEW_SCHEMA,
      effort: "medium",
    });
  },
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};

async function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  let filePath = path.normalize(path.join(PUBLIC_DIR, decodeURIComponent(url.pathname)));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    filePath = path.join(PUBLIC_DIR, "index.html"); // SPA fallback
  }
  const data = await fs.readFile(filePath);
  res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const handler = routes[pathname];
  if (!handler) return serveStatic(req, res);

  try {
    const body = req.method === "POST" ? await readJson(req) : {};
    const started = Date.now();
    const result = await handler(body);
    if (req.method === "POST") console.log(`[${pathname}] ${((Date.now() - started) / 1000).toFixed(1)}s`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err) {
    let status = err.status || 500;
    let message = err.message || "Erro interno";
    if (err instanceof Anthropic.RateLimitError) message = "Muitos acessos agora, tente em alguns segundos.";
    else if (err instanceof Anthropic.AuthenticationError) message = "Chave da API inválida: confira o ANTHROPIC_API_KEY no arquivo .env.";
    else if (err instanceof Anthropic.PermissionDeniedError) message = "Esta chave não tem permissão para a API. Crie uma chave nova no Console da Anthropic.";
    else if (err instanceof Anthropic.BadRequestError && /credit balance/i.test(err.message)) message = "Sua conta da Anthropic está sem crédito. Adicione fundos em console.anthropic.com > Faturamento.";
    else if (err instanceof Anthropic.APIConnectionError) { status = 503; message = "Sem conexão com a IA."; }
    else if (err instanceof SyntaxError) { status = 400; message = "JSON inválido."; }
    console.error(`[${pathname}]`, err);
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(PORT, () => {
  console.log(`Fluenta rodando em http://localhost:${PORT}`);
  const key = process.env.ANTHROPIC_API_KEY || "";
  if (DEMO) console.log("MODO DEMO: nenhuma chave encontrada. Crie o arquivo .env com ANTHROPIC_API_KEY=sk-ant-...");
  else if (key && !key.startsWith("sk-ant-")) console.log(`ATENÇÃO: a chave carregada não parece válida (começa com "${key.slice(0, 6)}"). Ela deve começar com sk-ant-`);
  else if (key) console.log(`Chave carregada: ${key.slice(0, 10)}...${key.slice(-4)}`);
});
