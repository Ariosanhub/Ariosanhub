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
}

let config = { demo: true };
fetch("/api/config").then((r) => r.json()).then((c) => { config = c; renderTopbar(); }).catch(() => {});

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
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

async function api(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

// ---------- Topbar ----------

function renderTopbar() {
  $("#logo").innerHTML = `${logo}<span>Fluenta</span>`;
  const inApp = location.hash.startsWith("#/app");
  const demo = config.demo ? `<span class="demo-badge" title="Defina ANTHROPIC_API_KEY no servidor">Modo demo</span>` : "";
  $("#topbar-right").innerHTML = inApp
    ? `${demo}<button class="btn ghost sm" id="reset">Refazer perfil</button>`
    : `${demo}${state.plan ? `<a class="btn sm" href="#/app">Minha área</a>` : `<a class="btn sm" href="#/start">Começar grátis</a>`}`;
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
        <div class="eyebrow">Escola de idiomas com inteligência artificial</div>
        <h1 style="margin-top:12px">Fale inglês de verdade, com aulas feitas para a <em>sua</em> vida.</h1>
        <p class="lead">Você responde um questionário de 3 minutos. A Fluenta entende seu nível, seu trabalho e sua rotina — e monta um plano diário com um tutor de IA que conversa com você até a fluência.</p>
        <div class="cta-row">
          <a class="btn" href="#/start">Fazer meu teste grátis</a>
          <a class="btn ghost" href="#como">Como funciona</a>
        </div>
        <p class="muted" style="margin-top:14px;font-size:14px">Inglês · Espanhol · Francês · Alemão · Italiano · Português</p>
      </div>
      <div class="hero-card bg-sky" aria-label="Exemplo de conversa">
        <div class="eyebrow" style="margin-bottom:12px">Cenário: reunião com fornecedor</div>
        <div class="stack">
          <div class="bubble ai">Good morning! Did the trucks arrive on time today?</div>
          <div class="bubble me">Yes, but two trucks was late because of traffic.</div>
          <div class="fix"><s>two trucks was late</s> → <b>two trucks were late</b><br/>Plural pede "were".</div>
          <div class="bubble ai">Got it. How did you adjust the dock schedule?</div>
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

const INTERESTS = ["Tecnologia", "Negócios", "Viagens", "Esportes", "Música", "Séries e filmes", "Games", "Culinária", "Saúde", "Moda", "Ciência", "Livros"];

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
      ["Carreira e trabalho", "💼"], ["Viajar sem depender de ninguém", "✈️"], ["Morar fora", "🏡"],
      ["Entrevistas de emprego", "🎯"], ["Estudos e certificações", "🎓"], ["Cultura, séries e amigos", "🎬"],
    ].map(([v, e]) => choice("goal", v, `<span class="flag">${e}</span>${v}`, a.goal === v)).join("")}</div>`,
    ok: (a) => a.goal,
  },
  {
    title: "Conte um pouco da sua vida",
    sub: "O tutor vai usar isso para criar conversas que parecem o seu dia.",
    render: (a) => `
      <div class="field"><label for="occ">O que você faz? (profissão ou ocupação)</label>
        <input class="input" id="occ" data-field="occupation" placeholder="Ex.: coordenador de logística" value="${esc(a.occupation || "")}" /></div>
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
          <span>${DAY_LABEL[k]}</span><b>${dates[i].slice(8)}</b><span class="dot"></span></div>`;
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
  $("#mark")?.addEventListener("click", () => { markDone(day?.minutes || 0); toast("Dia concluído. Sua chama da conversa cresceu!"); renderToday(); });
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
      if (sent === goal && !state.progress[today].done) { markDone(minutes); toast("Meta do dia batida. Sua chama da conversa cresceu!"); }
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
    ${!mat.corrections.length && !mat.vocab.length ? `<p class="muted" style="margin-top:16px">Dica: converse com o tutor durante a semana para a revisão ficar mais personalizada.</p>` : ""}`);

  $("#gen").addEventListener("click", async () => {
    quiz = { loading: true };
    renderReview();
    try {
      const data = await api("/api/review", { profile: { ...state.profile, level: state.plan.level }, week: weekNo, ...mat });
      quiz = { data, i: 0, answers: [] };
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

  if (i >= total) {
    const score = answers.filter((a, k) => a === data.questions[k].answerIndex).length;
    state.reviews[weekNo] = { score, total, date: iso() };
    if (todayKey() === "sun") markDone(state.plan.dailyMinutes);
    save();
    shell("review", `<div class="card" style="text-align:center;display:grid;gap:14px;justify-items:center;padding:36px 22px">
      ${pict.climb}
      <div class="eyebrow">Revisão concluída</div>
      <div class="score-big">${score}/${total}</div>
      <p class="muted" style="max-width:460px">${score / total >= 0.75 ? "Excelente! Você fixou o conteúdo da semana." : "Bom treino! Os pontos que você errou vão voltar nas próximas conversas."}</p>
      <div class="card bg-cream" style="border:0;text-align:left;max-width:520px">
        <div class="eyebrow">Desafio final de conversa</div><p style="margin-top:6px">${esc(data.speakingChallenge)}</p></div>
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
      ${i === 0 ? `<p style="margin-top:8px;max-width:620px">${esc(data.recap)}</p>` : ""}</div>
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

function route() {
  const h = location.hash || "#/";
  listening = false;
  if (recognition) { recognition.stop(); recognition = null; }
  if (recorder && recorder.state !== "inactive") recorder.stop();
  renderTopbar();
  window.scrollTo(0, 0);

  if (h.startsWith("#/app")) {
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
route();
