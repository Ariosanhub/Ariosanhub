// Fluenta — SPA sem build. Rotas por hash:
//   #/                landing (venda)
//   #/start           questionário (nivelamento + contexto de vida + rotina)
//   #/app             hoje (dashboard)
//   #/app/plan        cronograma de estudos
//   #/app/chat        conversa com o tutor de IA
//   #/app/review      aula de revisão semanal
//   #/app/words       caderno de vocabulário
// MVP: dados do aluno ficam no localStorage. Próximo passo: Supabase (auth + banco).

import { pict, icon, logo, streakFlame } from "/icons.js";

// ---------- Estado ----------

const STORE_KEY = "fluenta:v1";
const emptyState = () => ({
  profile: null, plan: null, startDate: null,
  progress: {}, chats: {}, corrections: [], vocab: [], reviews: {}, settings: {},
});

function load() {
  try {
    return { ...emptyState(), ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return emptyState();
  }
}
let state = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* modo privado */ }
  schedulePush();
}

// ---------- Conta e nuvem (Supabase) ----------
// Com Supabase configurado no servidor: login por e-mail e senha, e o estado do aluno
// fica na tabela learner_state, protegida por RLS (cada aluno só acessa a própria linha).
// Sem Supabase: tudo continua funcionando, salvo apenas neste navegador.

let config = { demo: true };
let sb = null; // cliente Supabase
let session = null;
let pushTimer = null;

function schedulePush() {
  if (!sb || !session) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushState, 800);
}

async function pushState() {
  if (!sb || !session) return;
  const { error } = await sb.from("learner_state").upsert({ user_id: session.user.id, data: state });
  if (error) toast("Não consegui salvar na nuvem agora. Seus dados estão guardados neste aparelho.");
}

async function pullState() {
  const { data, error } = await sb.from("learner_state").select("data").eq("user_id", session.user.id).maybeSingle();
  if (error) { toast("Não consegui carregar seus dados da nuvem."); return; }
  if (data?.data?.plan) {
    state = { ...emptyState(), ...data.data };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  } else if (state.plan) {
    await pushState(); // primeiro login: leva para a nuvem o que já foi feito neste aparelho
  }
}

const ready = (async () => {
  try {
    config = await (await fetch("/api/config")).json();
    if (config.supabase) {
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
      sb = createClient(config.supabase.url, config.supabase.key);
      session = (await sb.auth.getSession()).data.session;
      sb.auth.onAuthStateChange((event, s) => {
        session = s;
        if (event === "PASSWORD_RECOVERY") location.hash = "#/reset";
      });
      if (session) await pullState();
      // links de confirmação/recuperação voltam com tokens no endereço: limpa e segue
      if (/access_token|error_description/.test(location.hash)) {
        history.replaceState(null, "", location.pathname + (session ? "#/app" : "#/login"));
      }
    }
  } catch {
    toast("Falha ao iniciar a conexão. Verifique a internet.");
  }
})();

async function authHeader() {
  if (!sb) return {};
  const s = (await sb.auth.getSession()).data.session; // renova o token se precisar
  return s ? { Authorization: `Bearer ${s.access_token}` } : {};
}

// ---------- Utilidades ----------

const $ = (sel, el = document) => el.querySelector(sel);
const root = $("#root");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const iso = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 86400000);
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABEL = { mon: "Seg", tue: "Ter", wed: "Qua", thu: "Qui", fri: "Sex", sat: "Sáb", sun: "Dom" };
const WEEK_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const TYPE_STYLE = {
  lesson: { bg: "bg-cream", pict: "book", label: "Aula" },
  conversation: { bg: "bg-mint", pict: "talk", label: "Conversa" },
  review: { bg: "bg-plum", pict: "brain", label: "Revisão", dark: true },
  rest: { bg: "bg-sky", pict: "heart", label: "Descanso" },
};

function currentWeekIndex() {
  if (!state.plan || !state.startDate) return 0;
  const idx = Math.floor(daysBetween(state.startDate, iso()) / 7);
  return Math.max(0, Math.min(idx, state.plan.weeks.length - 1));
}
function todayKey() { return DAY_KEYS[new Date().getDay()]; }
function todayPlan() {
  const week = state.plan?.weeks[currentWeekIndex()];
  return week?.days.find((d) => d.day === todayKey()) || null;
}
// Datas (ISO) da semana corrente, de segunda a domingo
function weekDates() {
  const now = new Date();
  const offset = (now.getDay() + 6) % 7; // segunda = 0
  return WEEK_ORDER.map((_, i) => iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset + i)));
}
function streak() {
  let n = 0;
  const d = new Date();
  if (!state.progress[iso(d)]?.done) d.setDate(d.getDate() - 1); // hoje ainda não conta contra
  while (state.progress[iso(d)]?.done) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function markDone(minutes = 0) {
  const k = iso();
  const prev = state.progress[k] || {};
  state.progress[k] = { done: true, minutes: Math.max(prev.minutes || 0, minutes) };
  save();
  if (!prev.done) celebrate();
}

// ---------- Celebração de dia concluído ----------
function celebrate() {
  const n = streak();
  const today = iso();
  const words = state.vocab.filter((v) => v.date === today).length;
  const fixes = state.corrections.filter((c) => c.date === today).length;
  const minutes = state.progress[today]?.minutes || 0;
  const dates = weekDates();
  const doneWeek = dates.filter((d) => state.progress[d]?.done).length;
  const colors = ["#d5ebcb", "#fce8b6", "#cfe2f8", "#fab9a8", "#5f4c5e", "#1f2a44"];
  const confetti = Array.from({ length: 46 }, (_, i) =>
    `<i style="left:${(i * 37) % 100}%;background:${colors[i % colors.length]};animation-delay:${(i % 9) * 0.07}s;animation-duration:${1.6 + (i % 5) * 0.25}s;transform:rotate(${i * 23}deg)"></i>`).join("");
  const message = n >= 7 ? "Uma semana inteira. Isso é hábito de verdade."
    : n >= 3 ? "Três dias ou mais: seu cérebro já está criando o caminho."
    : n === 2 ? "Dois dias seguidos. Amanhã vira sequência!"
    : "Primeiro passo dado. O mais difícil é começar.";

  const el = document.createElement("div");
  el.className = "celebrate";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Dia concluído");
  el.innerHTML = `
    <div class="confetti" aria-hidden="true">${confetti}</div>
    <div class="celebrate-card">
      <div class="big-flame">${streakFlame(true)}</div>
      <div class="eyebrow">Dia concluído</div>
      <h2>${n} ${n === 1 ? "dia" : "dias"} de sequência</h2>
      <p class="muted">${message}</p>
      <div class="week-flames" aria-label="${doneWeek} de 7 dias nesta semana">
        ${dates.map((d, i) => `<span class="${state.progress[d]?.done ? "lit" : ""}">${state.progress[d]?.done ? streakFlame(true) : ""}<small>${DAY_LABEL[WEEK_ORDER[i]]}</small></span>`).join("")}
      </div>
      <div class="celebrate-stats">
        <div><b>${minutes}</b><small>minutos</small></div>
        <div><b>${words}</b><small>palavras novas</small></div>
        <div><b>${fixes}</b><small>erros corrigidos</small></div>
      </div>
      <button class="btn block" id="celebrate-ok">Continuar</button>
    </div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector("#celebrate-ok").addEventListener("click", close);
  el.addEventListener("click", (e) => { if (e.target === el) close(); });
  el.querySelector("#celebrate-ok").focus();
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

async function api(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

// ---------- Topbar ----------

function renderTopbar() {
  $("#logo").innerHTML = `${logo}<span>Fluenta</span>`;
  const inApp = location.hash.startsWith("#/app");
  const demo = config.demo ? `<span class="demo-badge" title="Defina ANTHROPIC_API_KEY no servidor">Modo demo</span>` : "";
  const logout = sb && session ? `<button class="btn ghost sm" id="logout" title="${esc(session.user.email)}">Sair</button>` : "";
  $("#topbar-right").innerHTML = inApp
    ? `${demo}<button class="btn ghost sm" id="reset">Refazer perfil</button>${logout}`
    : `${demo}${sb && !session ? `<a class="btn ghost sm" href="#/login" id="signin-link">Entrar</a>` : ""}${state.plan ? `<a class="btn sm" href="#/app">Minha área</a>` : `<a class="btn sm" href="#/start">Começar grátis</a>`}`;
  $("#logout")?.addEventListener("click", async () => {
    clearTimeout(pushTimer);
    await pushState();
    await sb.auth.signOut();
    session = null;
    state = emptyState();
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ } // não deixa dados num computador compartilhado
    location.hash = "#/";
  });
  $("#reset")?.addEventListener("click", () => {
    if (confirm("Apagar seu progresso e refazer o questionário?")) {
      state = emptyState(); save(); location.hash = "#/start";
    }
  });
}

// ---------- Landing ----------

function renderLanding() {
  const tiles = [
    ["bg-mint", "sun", "Feito para", "a sua rotina"],
    ["bg-cream", "talk", "Converse", "todos os dias"],
    ["bg-sky", "calendar", "Cronograma", "pronto, sem pensar"],
    ["bg-plum dark", "brain", "Revisão", "toda semana"],
    ["bg-navy dark", "headphones", "Fale e ouça", "com voz"],
    ["bg-salmon", "climb", "Fluência", "no seu ritmo"],
  ];
  root.innerHTML = `
  <main>
    <section class="container hero">
      <div>
        <div class="eyebrow">Inglês para tecnologia, dados e operações</div>
        <h1 style="margin-top:12px">Os melhores livros, cursos e vagas de tech estão em inglês. <em>Chegou a sua vez.</em></h1>
        <p class="lead">Em 3 minutos a Fluenta entende seu nível, seu trabalho e sua rotina. Depois, um tutor de IA conversa com você todo dia sobre o que você vive: daily com time remoto, dashboards, código, operação. Até o inglês sair natural.</p>
        <div class="cta-row">
          <a class="btn" href="#/start">Fazer meu teste grátis</a>
          <a class="btn ghost" href="#como">Como funciona</a>
        </div>
        <p class="muted" style="margin-top:14px;font-size:14px">Inglês · Espanhol · Francês · Alemão · Italiano · Português</p>
      </div>
      <div class="hero-card bg-sky" aria-label="Exemplo de conversa">
        <div class="eyebrow" style="margin-bottom:12px">Cenário: daily com time remoto</div>
        <div class="stack">
          <div class="bubble ai">Morning! What did you work on yesterday?</div>
          <div class="bubble me">I finish the sales dashboard and fix two bug in the API.</div>
          <div class="fix"><s>I finish… fix two bug</s> → <b>I finished… fixed two bugs</b><br/>Ontem pede passado, e "bugs" vai no plural.</div>
          <div class="bubble ai">Nice! Which data source did you connect to the dashboard?</div>
        </div>
      </div>
    </section>

    <section class="container" aria-label="Diferenciais">
      <div class="grid-3">
        ${tiles.map(([bg, p, a, b]) => `
          <div class="tile ${bg}">
            ${pict[p]}<hr/>
            <div class="eyebrow">${a}</div>
            <div class="title">${b}</div>
          </div>`).join("")}
      </div>
    </section>

    <section class="container section" id="para-quem">
      <div class="section-head">
        <div class="eyebrow">Para quem</div>
        <h2>Para quem trabalha (ou quer trabalhar) com tecnologia</h2>
        <p class="muted">A documentação, os livros de IA, as conferências e as melhores vagas remotas estão em inglês. A Fluenta treina você exatamente nesse inglês.</p>
      </div>
      <div class="grid-3 audience">
        <div class="tile bg-cream">${pict.desk}<hr/><div class="eyebrow">Desenvolvimento</div><div class="title">Code review, daily e entrevista técnica</div></div>
        <div class="tile bg-sky">${pict.book}<hr/><div class="eyebrow">Dados e IA</div><div class="title">Livros, papers e apresentar insights</div></div>
        <div class="tile bg-mint">${pict.globe}<hr/><div class="eyebrow">Operações e logística</div><div class="title">Fornecedores, clientes e times globais</div></div>
      </div>
    </section>

    <section class="container section" id="como">
      <div class="section-head">
        <div class="eyebrow">Como funciona</div>
        <h2>Do teste à fluência em 4 passos</h2>
      </div>
      <div class="steps">
        <div class="step"><h3>Questionário</h3><p class="muted">Nível, objetivo, profissão, interesses e rotina. Um mini teste confirma onde você está.</p></div>
        <div class="step"><h3>Plano sob medida</h3><p class="muted">A IA monta seu cronograma diário encaixado nos minutos que você tem livres.</p></div>
        <div class="step"><h3>Conversa diária</h3><p class="muted">Pratique por texto ou voz com situações reais do seu dia. Correções na hora.</p></div>
        <div class="step"><h3>Revisão semanal</h3><p class="muted">Todo domingo, uma aula criada com os seus erros e palavras da semana.</p></div>
      </div>
    </section>

    <section class="container section" id="planos">
      <div class="section-head">
        <div class="eyebrow">Planos</div>
        <h2>Menos que uma aula particular por mês</h2>
      </div>
      <div class="pricing">
        <div class="price bg-white">
          <div class="eyebrow">Teste</div><div class="amount">Grátis</div>
          <ul><li>Questionário e plano completo</li><li>7 dias de conversa com o tutor</li><li>1 revisão semanal</li></ul>
          <a class="btn ghost block" href="#/start">Começar</a>
        </div>
        <div class="price bg-mint featured">
          <div class="eyebrow">Mensal</div><div class="amount">R$ 39<small style="font-size:16px">/mês</small></div>
          <ul><li>Conversa ilimitada (texto e voz)</li><li>Cronograma renovado todo mês</li><li>Revisão toda semana</li><li>Caderno de vocabulário</li></ul>
          <a class="btn block" href="#/start">Quero ficar fluente</a>
        </div>
        <div class="price bg-cream">
          <div class="eyebrow">Anual</div><div class="amount">R$ 299<small style="font-size:16px">/ano</small></div>
          <ul><li>Tudo do mensal</li><li>2 idiomas no mesmo plano</li><li>Economia de 36%</li></ul>
          <a class="btn ghost block" href="#/start">Assinar anual</a>
        </div>
      </div>
    </section>
  </main>
  <footer class="site"><div class="container">© ${new Date().getFullYear()} Fluenta · Aprenda falando.</div></footer>`;
}

// ---------- Questionário ----------

const LANGS = [
  { id: "English", flag: "🇺🇸", label: "Inglês" },
  { id: "Spanish", flag: "🇪🇸", label: "Espanhol" },
  { id: "French", flag: "🇫🇷", label: "Francês" },
  { id: "German", flag: "🇩🇪", label: "Alemão" },
  { id: "Italian", flag: "🇮🇹", label: "Italiano" },
  { id: "Portuguese", flag: "🇧🇷", label: "Português" },
];
const SPEECH_LANG = { English: "en-US", Spanish: "es-ES", French: "fr-FR", German: "de-DE", Italian: "it-IT", Portuguese: "pt-BR" };

// Mini teste de nivelamento: 5 questões de dificuldade crescente (A1 → B2)
const PLACEMENT = {
  English: [
    ["She ___ a teacher.", ["is", "are", "am", "be"], 0],
    ["I ___ to the gym yesterday.", ["go", "went", "gone", "going"], 1],
    ["If it rains, we ___ at home.", ["stay", "will stay", "stayed", "would stayed"], 1],
    ["I've lived here ___ 2019.", ["for", "since", "from", "during"], 1],
    ["Had I known, I ___ earlier.", ["would come", "will come", "would have come", "came"], 2],
  ],
  Spanish: [
    ["Yo ___ estudiante.", ["soy", "estoy", "es", "eres"], 0],
    ["Ayer ___ al cine.", ["voy", "fui", "iba", "iré"], 1],
    ["Me gusta ___ libros.", ["leo", "leer", "leyendo", "leído"], 1],
    ["Espero que tú ___ bien.", ["estás", "estarás", "estés", "estar"], 2],
    ["Si tuviera tiempo, ___ más.", ["viajo", "viajaría", "viajaré", "viajé"], 1],
  ],
  French: [
    ["Je ___ brésilien.", ["suis", "es", "est", "être"], 0],
    ["Nous ___ au marché hier.", ["allons", "sommes allés", "irons", "allions"], 1],
    ["Il faut que tu ___ patient.", ["es", "sois", "seras", "être"], 1],
    ["Je n'ai ___ vu.", ["rien", "jamais rien", "personne", "pas"], 0],
    ["Si j'avais su, je ___ venu.", ["serais", "suis", "serai", "étais"], 0],
  ],
  German: [
    ["Ich ___ Ana.", ["heiße", "heißt", "heißen", "heiß"], 0],
    ["Wir ___ gestern ins Kino gegangen.", ["haben", "sind", "werden", "waren"], 1],
    ["Ich gebe ___ Mann das Buch.", ["der", "den", "dem", "des"], 2],
    ["Er sagt, dass er müde ___.", ["ist", "sein", "war ist", "bist"], 0],
    ["Wenn ich Zeit hätte, ___ ich reisen.", ["werde", "würde", "wurde", "wäre"], 1],
  ],
  Italian: [
    ["Io ___ italiano.", ["sono", "sei", "è", "siamo"], 0],
    ["Ieri ___ al mare.", ["vado", "sono andato", "andrò", "andavo"], 1],
    ["Mi piace ___ musica.", ["la", "il", "lo", "le"], 0],
    ["Penso che lui ___ ragione.", ["ha", "abbia", "avrà", "avere"], 1],
    ["Se avessi soldi, ___ una casa.", ["compro", "comprerei", "comprerò", "comprai"], 1],
  ],
  Portuguese: [
    ["Eu ___ estudante.", ["sou", "estou", "é", "somos"], 0],
    ["Ontem eu ___ ao cinema.", ["vou", "fui", "ia", "irei"], 1],
    ["Espero que você ___ bem.", ["está", "esteja", "estará", "estar"], 1],
    ["Se eu ___ tempo, viajaria.", ["tenho", "tivesse", "terei", "tive"], 1],
    ["Quando você ___, me avise.", ["chega", "chegar", "chegou", "chegaria"], 1],
  ],
};

const INTERESTS = ["IA e programação", "Dados e BI", "Tecnologia", "Negócios", "Viagens", "Esportes", "Música", "Séries e filmes", "Games", "Culinária", "Saúde", "Moda", "Ciência", "Livros"];

let onb = { step: 0, a: { interests: [], placement: [], dailyMinutes: "20", nativeLanguage: "Portuguese", wakeTime: "06:30", studyTime: "Manhã, antes do trabalho" } };

const choice = (field, value, inner, selected) =>
  `<button type="button" class="choice ${selected ? "selected" : ""}" data-pick="${field}" data-value="${esc(value)}">${inner}</button>`;

const STEPS = [
  {
    title: "Qual idioma você quer falar?",
    sub: "Você pode adicionar outro depois.",
    render: (a) => `<div class="choices">${LANGS.filter((l) => l.id !== a.nativeLanguage)
      .map((l) => choice("targetLanguage", l.id, `<span class="flag">${l.flag}</span>${l.label}`, a.targetLanguage === l.id)).join("")}</div>
      <div class="field" style="margin-top:20px"><label for="native">Seu idioma nativo</label>
        <select class="input" id="native" data-field="nativeLanguage">
          ${LANGS.map((l) => `<option value="${l.id}" ${a.nativeLanguage === l.id ? "selected" : ""}>${l.label}</option>`).join("")}
        </select></div>`,
    ok: (a) => a.targetLanguage && a.targetLanguage !== a.nativeLanguage,
  },
  {
    title: "Como você descreveria seu nível hoje?",
    sub: "Seja sincero — o teste a seguir confirma.",
    render: (a) => `<div class="choices cols-1">${[
      ["A1 — Do zero", "Sei poucas palavras"],
      ["A2 — Básico", "Me apresento e entendo frases simples"],
      ["B1 — Intermediário", "Me viro em viagens, mas travo para falar"],
      ["B2 — Intermediário avançado", "Converso, mas quero naturalidade"],
      ["C1 — Avançado", "Quero polir e soar nativo"],
    ].map(([v, s]) => choice("selfLevel", v, `<div><b>${v}</b><small>${s}</small></div>`, a.selfLevel === v)).join("")}</div>`,
    ok: (a) => a.selfLevel,
  },
  {
    title: "Mini teste de nivelamento",
    sub: "5 perguntas rápidas. Pode pular as que não souber.",
    render: (a) => (PLACEMENT[a.targetLanguage] || []).map(([q, opts], i) => `
      <div class="field"><label>${i + 1}. ${esc(q)}</label>
        <div class="choices cols-3" style="grid-template-columns:repeat(4,1fr)">
          ${opts.map((o, j) => `<button type="button" class="choice ${a.placement[i] === j ? "selected" : ""}" data-placement="${i}" data-value="${j}" style="justify-content:center;min-height:46px">${esc(o)}</button>`).join("")}
        </div></div>`).join(""),
    ok: () => true,
  },
  {
    title: "Por que você quer ficar fluente?",
    sub: "Isso muda o vocabulário e as situações das suas aulas.",
    render: (a) => `<div class="choices">${[
      ["Vaga internacional ou remota", "🌎"], ["Ler livros, cursos e documentação técnica", "📚"], ["Reuniões e dailies em inglês", "💼"],
      ["Entrevistas de emprego", "🎯"], ["Viajar sem depender de ninguém", "✈️"], ["Cultura, séries e amigos", "🎬"],
    ].map(([v, e]) => choice("goal", v, `<span class="flag">${e}</span>${v}`, a.goal === v)).join("")}</div>`,
    ok: (a) => a.goal,
  },
  {
    title: "Conte um pouco da sua vida",
    sub: "O tutor vai usar isso para criar conversas que parecem o seu dia.",
    render: (a) => `
      <div class="field"><label for="occ">O que você faz? (profissão ou ocupação)</label>
        <input class="input" id="occ" data-field="occupation" placeholder="Ex.: dev front-end, analista de dados, coordenador de logística" value="${esc(a.occupation || "")}" /></div>
      <div class="field"><label>Do que você gosta? (escolha até 5)</label>
        <div class="chips">${INTERESTS.map((i) => `<button type="button" class="chip ${a.interests.includes(i) ? "selected" : ""}" data-multi="interests" data-value="${i}">${i}</button>`).join("")}</div></div>`,
    ok: (a) => (a.occupation || "").trim().length > 1,
  },
  {
    title: "Como é a sua rotina?",
    sub: "Seu cronograma vai caber exatamente no tempo que você tem.",
    render: (a) => `
      <div class="row">
        <div class="field"><label for="wake">Que horas você acorda?</label>
          <input class="input" id="wake" type="time" data-field="wakeTime" value="${esc(a.wakeTime)}" /></div>
        <div class="field"><label for="st">Melhor momento para estudar</label>
          <select class="input" id="st" data-field="studyTime">
            ${["Manhã, antes do trabalho", "Hora do almoço", "No trajeto / transporte", "Noite, depois do trabalho", "Antes de dormir"]
              .map((o) => `<option ${a.studyTime === o ? "selected" : ""}>${o}</option>`).join("")}
          </select></div>
      </div>
      <div class="field"><label>Quantos minutos por dia você consegue?</label>
        <div class="choices" style="grid-template-columns:repeat(4,1fr)">
          ${["10", "20", "30", "45"].map((m) => choice("dailyMinutes", m, `<div style="text-align:center;width:100%"><b class="serif" style="font-size:20px;font-weight:400">${m}</b><small>min</small></div>`, a.dailyMinutes === m)).join("")}
        </div></div>
      <div class="field"><label for="dead">Tem algum "tempo morto" na rotina? (opcional)</label>
        <input class="input" id="dead" data-field="deadTime" placeholder="Ex.: 40 min de ônibus, academia às 19h" value="${esc(a.deadTime || "")}" /></div>`,
    ok: (a) => a.wakeTime && a.dailyMinutes,
  },
  {
    title: "Último passo",
    sub: "Como você aprende melhor e qual o seu prazo?",
    render: (a) => `
      <div class="field"><label>Estilo preferido</label>
        <div class="choices">${[
          ["Falando (voz)", "🎙️"], ["Escrevendo (chat)", "⌨️"], ["Misto", "🔀"], ["Direto ao ponto, com gramática", "📐"],
        ].map(([v, e]) => choice("style", v, `<span class="flag">${e}</span>${v}`, a.style === v)).join("")}</div></div>
      <div class="field"><label>Quando você quer estar conversando com confiança?</label>
        <div class="choices" style="grid-template-columns:repeat(4,1fr)">
          ${["3 meses", "6 meses", "1 ano", "Sem pressa"].map((v) => choice("deadline", v, v, a.deadline === v)).join("")}
        </div></div>`,
    ok: (a) => a.style && a.deadline,
  },
];

function renderOnboarding() {
  const s = STEPS[onb.step];
  const a = onb.a;
  root.innerHTML = `
  <main class="onb"><div class="onb-card">
    <div class="progress"><span style="width:${((onb.step + 1) / STEPS.length) * 100}%"></span></div>
    <div class="eyebrow">Passo ${onb.step + 1} de ${STEPS.length}</div>
    <h2 class="q-title">${s.title}</h2>
    <p class="q-sub">${s.sub}</p>
    <form id="onb-form" onsubmit="return false">${s.render(a)}</form>
    <div class="onb-nav">
      <button class="btn ghost" id="back" ${onb.step === 0 ? "style=visibility:hidden" : ""}>Voltar</button>
      <button class="btn" id="next" ${s.ok(a) ? "" : "disabled"}>${onb.step === STEPS.length - 1 ? "Gerar meu plano" : "Continuar"}</button>
    </div>
  </div></main>`;

  const form = $("#onb-form");
  const refreshNext = () => { $("#next").disabled = !s.ok(a); };
  form.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.pick) { a[b.dataset.pick] = b.dataset.value; renderOnboarding(); }
    else if (b.dataset.placement) { a.placement[Number(b.dataset.placement)] = Number(b.dataset.value); renderOnboarding(); }
    else if (b.dataset.multi) {
      const list = a[b.dataset.multi];
      const i = list.indexOf(b.dataset.value);
      if (i >= 0) list.splice(i, 1); else if (list.length < 5) list.push(b.dataset.value);
      renderOnboarding();
    }
  });
  form.addEventListener("input", (e) => {
    const f = e.target.dataset.field;
    if (!f) return;
    a[f] = e.target.value;
    if (f === "nativeLanguage" && a.targetLanguage === a.nativeLanguage) { a.targetLanguage = null; renderOnboarding(); return; }
    if (e.target.tagName === "SELECT") renderOnboarding(); else refreshNext();
  });
  $("#back").addEventListener("click", () => { onb.step--; renderOnboarding(); });
  $("#next").addEventListener("click", () => {
    if (!s.ok(a)) return;
    if (onb.step < STEPS.length - 1) { onb.step++; renderOnboarding(); window.scrollTo(0, 0); }
    else generatePlan();
  });
}

async function generatePlan() {
  if (sb && !session) {
    // guarda as respostas e pede a conta antes de gastar IA; depois do login o plano é gerado
    try { sessionStorage.setItem("fluenta:pendingOnb", JSON.stringify(onb.a)); } catch { /* ignore */ }
    location.hash = "#/login";
    return;
  }
  const a = onb.a;
  const test = PLACEMENT[a.targetLanguage] || [];
  const score = test.reduce((n, [, , right], i) => n + (a.placement[i] === right ? 1 : 0), 0);
  const profile = { ...a, placementScore: score, placementTotal: test.length };

  root.innerHTML = `<main class="onb"><div class="onb-card loading-screen">
    <div class="loading-tiles"><span class="bg-mint"></span><span class="bg-cream"></span><span class="bg-sky"></span><span class="bg-plum"></span><span class="bg-salmon"></span></div>
    <h2>Montando seu plano...</h2>
    <p class="muted" id="load-msg">Analisando seu nível e sua rotina</p>
    <p class="muted" style="font-size:13px">Leva cerca de 30 segundos. Não feche a página.</p>
  </div></main>`;
  const msgs = ["Analisando seu nível e sua rotina", "Criando cenários com o seu trabalho", "Encaixando as aulas nos seus horários", "Preparando sua primeira conversa"];
  let i = 0;
  const timer = setInterval(() => { const el = $("#load-msg"); if (el) el.textContent = msgs[++i % msgs.length]; }, 2200);

  try {
    const plan = await api("/api/plan", { profile });
    profile.level = plan.level;
    state = { ...emptyState(), profile, plan, startDate: iso() };
    save();
    location.hash = "#/app";
  } catch (err) {
    root.innerHTML = `<main class="onb"><div class="onb-card loading-screen">
      <div class="error-box">Não consegui gerar o plano: ${esc(err.message)}</div>
      <button class="btn" id="retry">Tentar de novo</button></div></main>`;
    $("#retry").addEventListener("click", generatePlan);
  } finally {
    clearInterval(timer);
  }
}

// ---------- Área do aluno ----------

function shell(active, content) {
  const links = [
    ["", "home", "Hoje"], ["chat", "chat", "Conversar"], ["plan", "plan", "Cronograma"],
    ["review", "review", "Revisão"], ["words", "words", "Palavras"],
  ];
  root.innerHTML = `<div class="app">
    <nav class="sidenav" aria-label="Navegação">
      ${links.map(([r, ic, label]) => `<a class="navlink ${active === r ? "active" : ""}" href="#/app${r ? "/" + r : ""}">${icon[ic]}<span>${label}</span></a>`).join("")}
    </nav>
    <main class="main">${content}</main>
  </div>`;
}

// ---------- Agenda (lembrete diário pelo calendário do aluno) ----------

// Horário sugerido a partir da rotina informada no questionário; o aluno pode ajustar.
function studyAt() {
  if (state.settings?.studyAt) return state.settings.studyAt;
  const p = state.profile;
  const [h, m] = (p.wakeTime || "06:30").split(":").map(Number);
  const plus = (mins) => {
    const t = h * 60 + m + mins;
    return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };
  return {
    "Manhã, antes do trabalho": plus(30),
    "Hora do almoço": "12:15",
    "No trajeto / transporte": plus(60),
    "Noite, depois do trabalho": "19:30",
    "Antes de dormir": "21:45",
  }[p.studyTime] || plus(30);
}

function nextStart() {
  const [h, m] = studyAt().split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d < new Date()) d.setDate(d.getDate() + 1);
  return d;
}
const calStamp = (d) => `${iso(d).replace(/-/g, "")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
const calTitle = () => `Fluenta: ${state.plan.dailyMinutes} min de ${LANGS.find((l) => l.id === state.profile.targetLanguage)?.label || "idioma"}`;
const calDetails = () => `Sua prática diária com o tutor de IA. Abra: ${location.origin}/#/app`;

function googleCalendarUrl() {
  const start = nextStart();
  const end = new Date(start.getTime() + state.plan.dailyMinutes * 60000);
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: calTitle(),
    details: calDetails(),
    dates: `${calStamp(start)}/${calStamp(end)}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recur: "RRULE:FREQ=DAILY",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

function downloadIcs() {
  const start = nextStart();
  const end = new Date(start.getTime() + state.plan.dailyMinutes * 60000);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Fluenta//Study//PT", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:fluenta-${Date.now()}@fluenta`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=${tz}:${calStamp(start)}`,
    `DTEND;TZID=${tz}:${calStamp(end)}`,
    "RRULE:FREQ=DAILY",
    `SUMMARY:${calTitle()}`,
    `DESCRIPTION:${calDetails()}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Hora do seu inglês", "TRIGGER:-PT5M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = "fluenta-estudo.ics";
  a.click();
  toast("Abra o arquivo para adicionar à agenda (lembrete 5 min antes).");
}

function renderToday() {
  const { profile, plan } = state;
  const wi = currentWeekIndex();
  const week = plan.weeks[wi];
  const day = todayPlan();
  const st = TYPE_STYLE[day?.type] || TYPE_STYLE.lesson;
  const doneToday = state.progress[iso()]?.done;
  const totalMin = Object.values(state.progress).reduce((n, p) => n + (p.minutes || 0), 0);
  const dates = weekDates();
  const lang = LANGS.find((l) => l.id === profile.targetLanguage);
  const cta = day?.type === "review" ? ["#/app/review", "Começar revisão"] : ["#/app/chat", "Começar conversa"];
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  shell("", `
    <div class="page-head">
      <div><div class="eyebrow">${lang?.flag || ""} ${lang?.label || ""} · Nível ${esc(plan.level)} · Semana ${wi + 1} de ${plan.weeks.length}</div>
      <h2 style="margin-top:6px">${hello}! Sua meta hoje: ${day?.minutes || plan.dailyMinutes} minutos.</h2></div>
    </div>

    <div class="stats">
      <div class="stat streak-stat"><div class="num">${streak()} ${streakFlame(streak() > 0)}</div><div class="lbl">dias seguidos</div></div>
      <div class="stat"><div class="num">${totalMin}</div><div class="lbl">minutos praticados</div></div>
      <div class="stat"><div class="num">${state.vocab.length}</div><div class="lbl">palavras novas</div></div>
      <div class="stat"><div class="num">${state.corrections.length}</div><div class="lbl">erros corrigidos</div></div>
    </div>

    <section class="today ${st.bg} ${st.dark ? "tile dark" : ""}" style="${st.dark ? "text-align:left;align-items:center;display:grid" : ""}">
      ${pict[st.pict]}
      <div>
        <div class="eyebrow">Hoje · ${st.label}${doneToday ? " · ✓ Concluído" : ""}</div>
        <h3 style="font-size:26px;margin-top:6px">${esc(day?.title || "Conversa livre")}</h3>
        <ul>${(day?.tasks || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn ${st.dark ? "light" : ""}" href="${cta[0]}">${cta[1]}</a>
          ${doneToday ? "" : `<button class="btn ghost" id="mark" style="${st.dark ? "color:#fff;border-color:#fff" : ""}">Marcar como feito</button>`}
        </div>
      </div>
    </section>

    <div class="week-strip" aria-label="Semana">
      ${WEEK_ORDER.map((k, i) => {
        const d = week.days.find((x) => x.day === k);
        const s = TYPE_STYLE[d?.type] || TYPE_STYLE.rest;
        const done = state.progress[dates[i]]?.done;
        return `<div class="wday ${s.bg} ${done ? "done" : ""} ${k === todayKey() ? "today-mark" : ""}" style="${s.dark ? "color:#fff" : ""}" title="${esc(d?.title || "")}">
          <span>${DAY_LABEL[k]}</span><b>${dates[i].slice(8)}</b>${done ? `<span class="stamp">${streakFlame(true)}</span>` : `<span class="dot"></span>`}</div>`;
      }).join("")}
    </div>

    <section class="card commit">
      <div class="commit-head">
        ${pict.calendar}
        <div>
          <div class="eyebrow">Seu compromisso de estudo</div>
          <h3 style="margin:4px 0 2px">Todos os dias, ${plan.dailyMinutes} minutos</h3>
          <p class="muted" style="font-size:14px">Coloque na sua agenda: o celular te lembra na hora certa, mesmo com o app fechado.</p>
        </div>
      </div>
      <div class="commit-row">
        <label class="field" style="margin:0"><span style="font-size:13px;font-weight:600">Horário</span>
          <input class="input" type="time" id="study-at" value="${studyAt()}" style="width:130px" /></label>
        <a class="btn sm" id="gcal" target="_blank" rel="noopener" href="${googleCalendarUrl()}">Adicionar ao Google Agenda</a>
        <button class="btn ghost sm" id="ics">Apple / Outlook (.ics)</button>
      </div>
    </section>

    <div class="grid-2">
      <div class="card"><div class="eyebrow">Tema da semana</div><h3 style="margin:6px 0">${esc(week.theme)}</h3><p class="muted">${esc(week.goal)}</p></div>
      <div class="card"><div class="eyebrow">Sua estratégia</div><p style="margin-top:6px">${esc(plan.summary)}</p></div>
    </div>`);

  $("#study-at").addEventListener("change", (e) => {
    state.settings = { ...state.settings, studyAt: e.target.value };
    save();
    $("#gcal").href = googleCalendarUrl();
  });
  $("#gcal").addEventListener("click", () => toast("Confirme o evento no Google Agenda e ative a notificação."));
  $("#ics").addEventListener("click", downloadIcs);
  $("#mark")?.addEventListener("click", () => { markDone(day?.minutes || 0); renderToday(); });
}

function renderPlan() {
  const { plan } = state;
  const wi = currentWeekIndex();
  const start = state.startDate;
  shell("plan", `
    <div class="page-head"><div><div class="eyebrow">Cronograma de estudos</div><h2 style="margin-top:6px">Seu plano de ${plan.weeks.length} semanas</h2></div></div>
    <div class="legend">${Object.values(TYPE_STYLE).map((s) => `<span><i class="${s.bg}"></i>${s.label}</span>`).join("")}</div>
    ${plan.weeks.map((w, i) => `
      <section class="plan-week">
        <div class="plan-week-head">
          <h3>Semana ${w.week}: ${esc(w.theme)} ${i === wi ? `<span class="demo-badge" style="vertical-align:middle;background:var(--mint)">atual</span>` : ""}</h3>
          <span class="muted" style="font-size:14px">${esc(w.goal)}</span>
        </div>
        <div class="plan-grid">
          ${WEEK_ORDER.map((k) => {
            const d = w.days.find((x) => x.day === k);
            if (!d) return `<div class="pday bg-white"></div>`;
            const s = TYPE_STYLE[d.type] || TYPE_STYLE.lesson;
            const isToday = i === wi && k === todayKey();
            const date = datesForWeek(start, i)[k];
            const done = date && state.progress[date]?.done;
            return `<div class="pday ${s.bg} ${s.dark ? "dark" : ""} ${isToday ? "current" : ""}">
              <div class="eyebrow" style="font-size:11px">${DAY_LABEL[k]} · ${s.label} · ${d.minutes} min</div>
              <div class="pd-title">${esc(d.title)}</div>
              <ul>${d.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
              ${done ? `<span class="check">✓ feito</span>` : ""}
            </div>`;
          }).join("")}
        </div>
      </section>`).join("")}`);
}

// Mapeia dia da semana -> data ISO para a semana i do plano
function datesForWeek(start, i) {
  const out = {};
  for (let d = 0; d < 7; d++) {
    const dt = new Date(start + "T12:00");
    dt.setDate(dt.getDate() + i * 7 + d);
    out[DAY_KEYS[dt.getDay()]] = iso(dt);
  }
  return out;
}

// ---------- Conversa com o tutor ----------

let recognition = null;
let listening = false; // microfone ligado até o aluno tocar de novo
let recorder = null; // grava a voz do aluno para ele se ouvir depois
let pendingAudio = null; // URL do último áudio gravado, ainda não enviado
const myAudio = new Map(); // id da mensagem -> URL do áudio (só nesta sessão do navegador; não salvamos áudio)

const DEFAULT_RATE = () => (["A1", "A2"].includes(state.plan?.level) ? 0.7 : 0.9);
const voiceRate = () => state.settings?.rate ?? DEFAULT_RATE();

function speak(text) {
  if (!("speechSynthesis" in window)) return toast("Seu navegador não tem leitura em voz alta.");
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/^\[demo\]\s*/, ""));
  u.lang = SPEECH_LANG[state.profile.targetLanguage] || "en-US";
  u.rate = voiceRate();
  speechSynthesis.speak(u);
}

function msgHtml(m, i) {
  if (m.role === "user" && m.hidden) return "";
  if (m.role === "user") {
    const audio = m.id && myAudio.get(m.id);
    return `<div class="msg me">
      <div class="bubble me">${esc(m.content)}</div>
      ${m.translation ? `<div class="tr" hidden id="tr-${i}">${esc(m.translation)}</div>` : ""}
      <div class="tools">
        ${audio ? `<button data-mine="${i}">▶ minha voz</button>` : ""}
        <button data-speak="${i}">🔊 ouvir pronúncia</button>
        ${m.translation ? `<button data-tr="${i}">traduzir</button>` : ""}
      </div>
    </div>`;
  }
  return `<div class="msg ai">
    <div class="bubble ai">${esc(m.content)}</div>
    ${m.translation ? `<div class="tr" hidden id="tr-${i}">${esc(m.translation)}</div>` : ""}
    <div class="tools"><button data-speak="${i}">🔊 ouvir</button>${m.translation ? `<button data-tr="${i}">traduzir</button>` : ""}</div>
    ${(m.corrections || []).map((c, j) => `<div class="corr"><span><s>${esc(c.original)}</s> → <b>${esc(c.corrected)}</b>
      <button class="say-btn" data-corr="${i}:${j}" title="Ouvir a frase correta para repetir">🔊 repetir</button></span>
      <span class="muted">${esc(c.explanation)}</span></div>`).join("")}
    ${m.newVocab?.length ? `<div>${m.newVocab.map((v) => `<span class="vocab-pill"><b>${esc(v.term)}</b> · ${esc(v.meaning)}</span>`).join("")}</div>` : ""}
  </div>`;
}

function renderChat() {
  const today = iso();
  const day = todayPlan();
  const scenario = day?.type === "review" ? "Conversa livre sobre a semana" : day?.scenario || "Conversa livre sobre o seu dia";
  state.chats[today] ||= [];
  const history = state.chats[today];
  const userCount = history.filter((m) => m.role === "user" && !m.hidden).length;
  const goal = 6;
  const hasSpeech = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

  shell("chat", `
    <div class="chat-wrap">
      <div class="chat-head">
        <div><div class="eyebrow">Tutor de conversação · ${userCount}/${goal} mensagens hoje</div>
          <div class="scenario" style="margin-top:8px">🎬 ${esc(scenario)}</div></div>
        <div class="chat-actions">
          <label class="speed" title="Velocidade da voz do tutor">
            <span>${icon.speaker}</span>
            <input type="range" id="rate" min="0.3" max="1" step="0.05" value="${voiceRate()}" aria-label="Velocidade da voz" />
            <b id="rate-val">${voiceRate().toFixed(2)}x</b>
          </label>
          ${history.length ? "" : `<button class="btn sm" id="start-chat">Tutor, comece!</button>`}
        </div>
      </div>
      <div class="messages" id="messages" aria-live="polite">
        ${history.length ? history.map(msgHtml).join("") : `
          <div class="empty">${pict.talk}<h3>Pronto para falar?</h3>
          <p class="muted">Escreva ou grave sua voz no idioma que está aprendendo. Errar faz parte — o tutor corrige com carinho.</p></div>`}
      </div>
      <div class="mic-hint" id="mic-hint" hidden>Gravando, fale no seu ritmo. As pausas não enviam nada. Toque no microfone para parar, revise o texto e envie.</div>
      <form class="composer" id="composer">
        ${hasSpeech ? `<button type="button" class="icon-btn" id="mic" title="Falar">${icon.mic}<span class="sr-only">Falar</span></button>` : ""}
        <textarea class="input" id="text" rows="1" placeholder="Escreva sua resposta..." aria-label="Mensagem"></textarea>
        <button class="icon-btn" type="submit" title="Enviar" style="background:var(--ink)"><span style="filter:invert(1)">${icon.send}</span><span class="sr-only">Enviar</span></button>
      </form>
    </div>`);

  const box = $("#messages");
  box.scrollTop = box.scrollHeight;
  const ta = $("#text");
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").requestSubmit(); }
  });
  ta.addEventListener("input", () => {
    ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
    if (!ta.value.trim() && !listening) pendingAudio = null;
  });

  box.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.speak) speak(history[Number(b.dataset.speak)].content);
    if (b.dataset.mine) {
      const url = myAudio.get(history[Number(b.dataset.mine)].id);
      if (url) { speechSynthesis?.cancel(); new Audio(url).play(); }
    }
    if (b.dataset.corr) {
      const [mi, ci] = b.dataset.corr.split(":").map(Number);
      speak(history[mi].corrections[ci].corrected);
    }
    if (b.dataset.tr) $(`#tr-${b.dataset.tr}`).hidden ^= true;
  });

  $("#start-chat")?.addEventListener("click", () => send("Hi! Let's start today's practice.", true));
  $("#composer").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (text) send(text);
  });

  const rate = $("#rate");
  rate.addEventListener("input", () => { $("#rate-val").textContent = Number(rate.value).toFixed(2) + "x"; });
  rate.addEventListener("change", () => {
    state.settings = { ...state.settings, rate: Number(rate.value) };
    save();
    const last = [...history].reverse().find((m) => m.role === "assistant");
    speak(last?.content || "This is how fast I will speak.");
  });

  // Microfone: liga com um toque e só desliga com outro toque. Pausas para pensar não enviam nada;
  // o texto fica na caixa para o aluno revisar e enviar quando quiser.
  $("#mic")?.addEventListener("click", () => {
    if (listening) { stopListening(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const mic = $("#mic");
    let spoken = ta.value.trim() ? ta.value.trim() + " " : "";
    listening = true;
    mic.classList.add("active");
    $("#mic-hint").hidden = false;
    speechSynthesis?.cancel();

    const startSession = () => {
      recognition = new SR();
      recognition.lang = SPEECH_LANG[state.profile.targetLanguage] || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) spoken += r[0].transcript.trim() + " ";
          else interim += r[0].transcript;
        }
        ta.value = (spoken + interim).trimStart();
        ta.dispatchEvent(new Event("input"));
      };
      // O navegador encerra a sessão após um silêncio longo; se o aluno não pediu para parar, religa.
      recognition.onend = () => { if (listening) startSession(); };
      recognition.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return; // silêncio: segue ouvindo
        toast(e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Permita o uso do microfone no navegador."
          : "O ditado por voz falhou. Verifique a internet ou escreva sua resposta.");
        stopListening();
      };
      recognition.start();
    };
    startSession();
    startRecording();
  });

  async function startRecording() {
    if (!window.MediaRecorder || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!listening) { stream.getTracks().forEach((t) => t.stop()); return; }
      const chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop()); // desliga o microfone de verdade
        if (chunks.length) {
          if (pendingAudio) URL.revokeObjectURL(pendingAudio);
          pendingAudio = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
        }
        recorder._done?.();
      };
      recorder.start();
    } catch {
      recorder = null; // sem gravação: o ditado continua funcionando
    }
  }

  function stopListening() {
    listening = false;
    recognition?.stop();
    recognition = null;
    const audioReady = new Promise((resolve) => {
      if (recorder && recorder.state !== "inactive") { recorder._done = resolve; recorder.stop(); }
      else resolve();
    }).then(() => { recorder = null; });
    $("#mic")?.classList.remove("active");
    const hint = $("#mic-hint");
    if (hint) hint.hidden = true;
    ta.focus();
    return audioReady;
  }

  async function send(text, hidden = false) {
    if (listening) await stopListening();
    const msg = { role: "user", content: text, hidden, id: Date.now() };
    if (!hidden && pendingAudio) { myAudio.set(msg.id, pendingAudio); pendingAudio = null; }
    history.push(msg);
    save();
    if (!hidden) box.insertAdjacentHTML("beforeend", msgHtml(msg));
    box.querySelector(".empty")?.remove();
    ta.value = ""; ta.style.height = "auto";
    box.insertAdjacentHTML("beforeend", `<div class="typing" id="typing"><span></span><span></span><span></span></div>`);
    box.scrollTop = box.scrollHeight;

    try {
      const out = await api("/api/chat", {
        profile: { ...state.profile, level: state.plan.level },
        scenario,
        history: history.map(({ role, content }) => ({ role, content })),
      });
      if (out.userTranslation && !hidden) msg.translation = out.userTranslation;
      const reply = { role: "assistant", content: out.reply, translation: out.translation, corrections: out.corrections, newVocab: out.newVocab };
      history.push(reply);
      out.corrections?.forEach((c) => state.corrections.push({ ...c, date: today }));
      out.newVocab?.forEach((v) => {
        if (!state.vocab.some((x) => x.term.toLowerCase() === v.term.toLowerCase())) state.vocab.push({ ...v, date: today });
      });
      const sent = history.filter((m) => m.role === "user" && !m.hidden).length;
      const minutes = Math.round(sent * 1.5);
      state.progress[today] = { ...(state.progress[today] || {}), minutes };
      if (sent === goal && !state.progress[today].done) markDone(minutes);
      save();
      renderChat();
      if (state.profile.style === "Falando (voz)") speak(out.reply);
    } catch (err) {
      history.pop(); // permite reenviar
      if (myAudio.has(msg.id)) pendingAudio = myAudio.get(msg.id);
      save();
      $("#typing")?.remove();
      box.insertAdjacentHTML("beforeend", `<div class="error-box">${esc(err.message)}</div>`);
      ta.value = text;
    }
  }
}

// ---------- Revisão semanal ----------

let quiz = null; // { data, i, answers: [] }

function weekMaterial() {
  const since = iso(new Date(Date.now() - 7 * 86400000));
  const corrections = state.corrections.filter((c) => c.date >= since);
  const vocab = state.vocab.filter((v) => v.date >= since);
  const messagesCount = Object.entries(state.chats)
    .filter(([d]) => d >= since)
    .reduce((n, [, h]) => n + h.filter((m) => m.role === "user" && !m.hidden).length, 0);
  return { corrections, vocab, messagesCount };
}

function renderReview() {
  const wi = currentWeekIndex();
  const weekNo = wi + 1;
  const past = state.reviews[weekNo];
  const isSunday = todayKey() === "sun";
  const mat = weekMaterial();

  if (quiz?.loading) {
    return shell("review", `<div class="loading-screen">
      <div class="loading-tiles"><span class="bg-mint"></span><span class="bg-cream"></span><span class="bg-sky"></span><span class="bg-plum"></span><span class="bg-salmon"></span></div>
      <h2>Criando sua revisão...</h2><p class="muted">Usando seus ${mat.corrections.length} erros e ${mat.vocab.length} palavras desta semana</p></div>`);
  }

  if (quiz?.data) return renderQuiz(weekNo);

  shell("review", `
    <div class="page-head"><div><div class="eyebrow">Aula de revisão · Semana ${weekNo}</div>
      <h2 style="margin-top:6px">Revise o que você aprendeu</h2></div></div>
    <section class="today bg-plum tile dark" style="text-align:left;display:grid">
      ${pict.brain}
      <div>
        <div class="eyebrow">${isSunday ? "Hoje é dia de revisão" : "Disponível todo domingo · pode adiantar"}</div>
        <h3 style="font-size:24px;margin:6px 0 10px">Uma aula criada com os seus erros reais</h3>
        <p style="opacity:.85;margin-bottom:18px">Nesta semana: ${mat.messagesCount} mensagens, ${mat.corrections.length} correções e ${mat.vocab.length} palavras novas.</p>
        <button class="btn light" id="gen">${past ? "Refazer revisão" : "Gerar minha revisão"}</button>
      </div>
    </section>
    ${past ? `<div class="card" style="margin-top:16px"><div class="eyebrow">Último resultado</div>
      <p style="margin-top:6px"><span class="serif" style="font-size:28px">${past.score}/${past.total}</span> <span class="muted">em ${esc(past.date)}</span></p></div>` : ""}
    ${past?.mindMap ? `<section class="card" style="margin-top:16px"><div class="eyebrow">Seu mapa mental da semana ${weekNo}</div>${mindMapHtml(past.mindMap)}</section>` : ""}
    ${!mat.corrections.length && !mat.vocab.length ? `<p class="muted" style="margin-top:16px">Dica: converse com o tutor durante a semana para a revisão ficar mais personalizada.</p>` : ""}`);

  $("#gen").addEventListener("click", async () => {
    quiz = { loading: true };
    renderReview();
    try {
      const data = await api("/api/review", { profile: { ...state.profile, level: state.plan.level }, week: weekNo, ...mat });
      quiz = { data, i: -1, answers: [] }; // -1 = tela do mapa mental antes do quiz
    } catch (err) {
      quiz = null;
      toast(err.message);
    }
    renderReview();
  });
}

function renderQuiz(weekNo) {
  const { data, i, answers } = quiz;
  const total = data.questions.length;

  if (i === -1) {
    shell("review", `
      <div class="page-head"><div><div class="eyebrow">${esc(data.title)}</div>
        <h2 style="margin-top:6px">O mapa da sua semana</h2>
        <p class="muted" style="margin-top:8px;max-width:640px">${esc(data.recap)}</p></div></div>
      <section class="card">${data.mindMap ? mindMapHtml(data.mindMap) : ""}</section>
      <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" id="startq">Começar o quiz (${total} perguntas)</button>
      </div>`);
    $("#startq").addEventListener("click", () => { quiz.i = 0; renderQuiz(weekNo); });
    return;
  }

  if (i >= total) {
    const score = answers.filter((a, k) => a === data.questions[k].answerIndex).length;
    state.reviews[weekNo] = { score, total, date: iso(), mindMap: data.mindMap || null };
    if (todayKey() === "sun") markDone(state.plan.dailyMinutes);
    save();
    shell("review", `<div class="card" style="text-align:center;display:grid;gap:14px;justify-items:center;padding:36px 22px">
      ${pict.climb}
      <div class="eyebrow">Revisão concluída</div>
      <div class="score-big">${score}/${total}</div>
      <p class="muted" style="max-width:460px">${score / total >= 0.75 ? "Excelente! Você fixou o conteúdo da semana." : "Bom treino! Os pontos que você errou vão voltar nas próximas conversas."}</p>
      <div class="card bg-cream" style="border:0;text-align:left;max-width:520px">
        <div class="eyebrow">Desafio final de conversa</div><p style="margin-top:6px">${esc(data.speakingChallenge)}</p></div>
      ${data.mindMap ? `<div style="width:100%;text-align:left"><div class="eyebrow" style="margin-bottom:6px">Seu mapa da semana (fica salvo na aba Revisão)</div>${mindMapHtml(data.mindMap)}</div>` : ""}
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <a class="btn" href="#/app/chat">Fazer o desafio com o tutor</a>
        <button class="btn ghost" id="done">Voltar</button>
      </div></div>`);
    $("#done").addEventListener("click", () => { quiz = null; location.hash = "#/app"; });
    return;
  }

  const q = data.questions[i];
  const answered = answers[i] !== undefined;
  shell("review", `
    <div class="page-head"><div><div class="eyebrow">${esc(data.title)}</div>
</div>
      <span class="muted">${i + 1} / ${total}</span></div>
    <div class="progress"><span style="width:${(i / total) * 100}%"></span></div>
    <div class="card quiz-q">
      <h3>${esc(q.prompt)}</h3>
      <div class="choices cols-1">
        ${q.options.map((o, j) => {
          let cls = "";
          if (answered && j === q.answerIndex) cls = "right";
          else if (answered && j === answers[i]) cls = "wrong";
          return `<button class="choice opt ${cls}" data-opt="${j}" ${answered ? "disabled" : ""}>${esc(o)}</button>`;
        }).join("")}
      </div>
      ${answered ? `<div class="explain">${esc(q.explanation)}</div><button class="btn" id="nextq">${i === total - 1 ? "Ver resultado" : "Próxima"}</button>` : ""}
    </div>`);

  root.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => {
    answers[i] = Number(b.dataset.opt);
    renderQuiz(weekNo);
  }));
  $("#nextq")?.addEventListener("click", () => { quiz.i++; renderQuiz(weekNo); });
}

// ---------- Mapa mental ----------
// Desktop: mapa radial em SVG (centro + ramos ligados por curvas). Celular: árvore vertical legível.
function mindMapHtml(mm) {
  const branches = (mm.branches || []).slice(0, 5);
  const fills = ["#d5ebcb", "#fce8b6", "#cfe2f8", "#fab9a8", "#1f2a44"];
  const cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
  const W = 860, H = 540, cx = W / 2, cy = H / 2, cardW = 220;
  const n = branches.length || 1;
  const nodes = branches.map((b, k) => {
    const angle = -Math.PI / 2 + (k * 2 * Math.PI) / n + (n % 2 === 0 ? Math.PI / n : 0);
    const items = (b.items || []).slice(0, 4);
    const h = 40 + items.length * 24;
    const x = Math.min(W - cardW - 8, Math.max(8, cx + Math.cos(angle) * 280 - cardW / 2));
    const y = Math.min(H - h - 8, Math.max(8, cy + Math.sin(angle) * 175 - h / 2));
    return { b, items, h, x, y, fill: fills[k % fills.length], dark: k % fills.length === 4 };
  });
  const svg = `<svg class="mm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa mental: ${esc(mm.center)}">
    ${nodes.map((nd) => {
      const tx = nd.x + cardW / 2, ty = nd.y + nd.h / 2;
      return `<path d="M${cx},${cy} Q${(cx + tx) / 2},${cy} ${tx},${ty}" fill="none" stroke="#141414" stroke-opacity=".35" stroke-width="2"/>`;
    }).join("")}
    ${nodes.map((nd) => `
      <g>
        <rect x="${nd.x}" y="${nd.y}" width="${cardW}" height="${nd.h}" rx="14" fill="${nd.fill}" stroke="#141414" stroke-opacity=".12"/>
        <text x="${nd.x + 14}" y="${nd.y + 26}" font-family="Libre Baskerville, Georgia, serif" font-size="16" fill="${nd.dark ? "#fff" : "#141414"}">${esc(cut(nd.b.title, 22))}</text>
        ${nd.items.map((it, j) => `<text x="${nd.x + 14}" y="${nd.y + 50 + j * 24}" font-family="Inter, system-ui, sans-serif" font-size="13.5" fill="${nd.dark ? "#e8ecf5" : "#333"}">• ${esc(cut(it, 28))}</text>`).join("")}
      </g>`).join("")}
    <ellipse cx="${cx}" cy="${cy}" rx="112" ry="46" fill="#5f4c5e"/>
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="Libre Baskerville, Georgia, serif" font-size="17" fill="#fff">${esc(cut(mm.center || "", 24))}</text>
  </svg>`;
  const tree = `<div class="mm-tree">
    <div class="mm-center">${esc(mm.center)}</div>
    ${nodes.map((nd) => `<div class="mm-branch" style="background:${nd.fill};${nd.dark ? "color:#fff" : ""}">
      <b>${esc(nd.b.title)}</b><ul>${nd.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul></div>`).join("")}
  </div>`;
  return `<div class="mindmap">${svg}${tree}</div>`;
}

// ---------- Vocabulário ----------

function renderWords() {
  const list = [...state.vocab].reverse();
  shell("words", `
    <div class="page-head"><div><div class="eyebrow">Caderno de vocabulário</div>
      <h2 style="margin-top:6px">${list.length} palavras e expressões</h2></div></div>
    ${list.length ? `<div class="vocab-list">${list.map((v, i) => `
      <div class="vocab-item">
        <div class="term">${esc(v.term)}</div>
        <div class="muted">${esc(v.meaning)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px" class="muted">
          <span>${esc(v.date)}</span><button class="btn ghost sm" data-say="${i}" style="padding:4px 10px">🔊</button></div>
      </div>`).join("")}</div>`
    : `<div class="empty">${pict.book}<h3>Seu caderno está vazio</h3><p class="muted">As palavras novas que o tutor usar nas conversas aparecem aqui automaticamente.</p><a class="btn" href="#/app/chat">Começar a conversar</a></div>`}`);
  root.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => speak(list[Number(b.dataset.say)].term)));
}

// ---------- Roteador ----------

// ---------- Login ----------

function renderLogin(mode) {
  if (!sb) { location.hash = "#/start"; return; }
  if (session) { afterLogin(); return; }
  const pending = (() => { try { return sessionStorage.getItem("fluenta:pendingOnb"); } catch { return null; } })();
  mode ||= pending ? "signup" : "signin";
  const isSignup = mode === "signup";
  root.innerHTML = `
  <main class="onb"><div class="onb-card auth-card">
    ${pict.talk}
    <div class="eyebrow">${pending ? "Seu plano está quase pronto" : "Sua conta Fluenta"}</div>
    <h2 class="q-title">${isSignup ? "Crie sua conta para salvar seu progresso" : "Bem-vindo de volta"}</h2>
    <p class="q-sub">${isSignup ? "Seu plano, conversas e vocabulário ficam salvos com segurança e acessíveis em qualquer aparelho." : "Entre para continuar de onde parou."}</p>
    <form id="auth-form" novalidate>
      <div class="field"><label for="email">E-mail</label>
        <input class="input" id="email" type="email" autocomplete="email" required /></div>
      <div class="field"><label for="password">Senha ${isSignup ? "(mínimo 8 caracteres)" : ""}</label>
        <input class="input" id="password" type="password" minlength="8" autocomplete="${isSignup ? "new-password" : "current-password"}" required /></div>
      <div class="error-box" id="auth-msg" hidden></div>
      <button class="btn block" type="submit" id="auth-submit">${isSignup ? "Criar conta" : "Entrar"}</button>
    </form>
    <div class="auth-links">
      <button class="link-btn" id="switch">${isSignup ? "Já tenho conta: entrar" : "Não tenho conta: criar"}</button>
      ${isSignup ? "" : `<button class="link-btn" id="forgot">Esqueci minha senha</button>`}
    </div>
    <p class="muted" style="font-size:12px;margin-top:14px">Suas mensagens são enviadas a um provedor de IA para gerar as respostas do tutor. Não compartilhe dados sensíveis. O áudio da sua voz não é salvo.</p>
  </div></main>`;

  const msg = (text, ok = false) => {
    const box = $("#auth-msg");
    box.hidden = false;
    box.textContent = text;
    box.className = ok ? "ok-box" : "error-box";
  };
  $("#switch").addEventListener("click", () => renderLogin(isSignup ? "signin" : "signup"));
  $("#forgot")?.addEventListener("click", async () => {
    const email = $("#email").value.trim();
    if (!email) return msg("Digite seu e-mail acima e clique de novo em \"Esqueci minha senha\".");
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/` });
    msg(error ? traduzErro(error) : "Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha.", !error);
  });
  $("#auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#email").value.trim();
    const password = $("#password").value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return msg("Digite um e-mail válido.");
    if (password.length < 8) return msg("A senha precisa ter pelo menos 8 caracteres.");
    const btn = $("#auth-submit");
    btn.disabled = true;
    try {
      if (isSignup) {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/` } });
        if (error) return msg(traduzErro(error));
        if (!data.session) return msg("Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e volte aqui para entrar.", true);
        session = data.session;
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) return msg(traduzErro(error));
        session = data.session;
      }
      await pullState();
      afterLogin();
    } finally {
      btn.disabled = false;
    }
  });
}

function traduzErro(error) {
  const m = (error?.message || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Este e-mail já tem conta. Clique em \"Já tenho conta: entrar\".";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  if (m.includes("password")) return "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.";
  return "Não foi possível concluir agora. Tente novamente.";
}

function afterLogin() {
  renderTopbar();
  let pending = null;
  try { pending = JSON.parse(sessionStorage.getItem("fluenta:pendingOnb") || "null"); sessionStorage.removeItem("fluenta:pendingOnb"); } catch { /* ignore */ }
  if (state.plan) { location.hash = "#/app"; return; }
  if (pending) { onb.a = pending; generatePlan(); return; }
  location.hash = "#/start";
}

function renderReset() {
  if (!sb || !session) { location.hash = "#/login"; return; }
  root.innerHTML = `
  <main class="onb"><div class="onb-card auth-card">
    <div class="eyebrow">Nova senha</div>
    <h2 class="q-title">Crie uma nova senha</h2>
    <form id="reset-form">
      <div class="field"><label for="np">Nova senha (mínimo 8 caracteres)</label>
        <input class="input" id="np" type="password" minlength="8" autocomplete="new-password" required /></div>
      <div class="error-box" id="reset-msg" hidden></div>
      <button class="btn block" type="submit">Salvar nova senha</button>
    </form>
  </div></main>`;
  $("#reset-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = $("#np").value;
    const box = $("#reset-msg");
    if (password.length < 8) { box.hidden = false; box.textContent = "A senha precisa ter pelo menos 8 caracteres."; return; }
    const { error } = await sb.auth.updateUser({ password });
    if (error) { box.hidden = false; box.textContent = traduzErro(error); return; }
    toast("Senha atualizada!");
    afterLogin();
  });
}

function route() {
  const h = location.hash || "#/";
  listening = false;
  if (recognition) { recognition.stop(); recognition = null; }
  if (recorder && recorder.state !== "inactive") recorder.stop();
  renderTopbar();
  window.scrollTo(0, 0);

  if (h === "#/login") { renderLogin(); return; }
  if (h === "#/reset") { renderReset(); return; }

  if (h.startsWith("#/app")) {
    if (sb && !session) { location.hash = "#/login"; return; }
    if (!state.plan) { location.hash = "#/start"; return; }
    const sub = h.split("/")[2] || "";
    ({ "": renderToday, plan: renderPlan, chat: renderChat, review: renderReview, words: renderWords }[sub] || renderToday)();
    return;
  }
  if (h === "#/start") {
    onb.step = 0;
    renderOnboarding();
    return;
  }
  renderLanding();
  if (h.length > 2 && !h.startsWith("#/")) document.getElementById(h.slice(1))?.scrollIntoView();
}

window.addEventListener("hashchange", route);
ready.then(route);
