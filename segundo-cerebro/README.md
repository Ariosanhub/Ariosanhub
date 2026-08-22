# Âncora — segundo cérebro

Um app pessoal de autoconhecimento e regulação emocional, inspirado no Liven, mas
construído sob medida: baseado em **Terapia Cognitivo-Comportamental (TCC)** e
**neurociência aplicada**, com foco em autoconfiança, assertividade e limites —
principalmente no ambiente de trabalho.

Não é um produto para terceiros: é um espaço de uso pessoal, sem modelo de
assinatura, sem múltiplos usuários — só o seu histórico, com data, guardado para
você voltar e entender seus próprios padrões ao longo do tempo.

## O que tem

- **Onboarding** — mapeia seus desafios e objetivos principais.
- **Check-in de humor** — baseado no Mood Meter (RULER/Yale): energia × agrado,
  emoções específicas e fatores associados (chefe, sono, trabalho, etc).
- **Diário de TCC** — registro de pensamento guiado (situação → pensamento
  automático → emoção → distorções cognitivas → evidências → pensamento
  equilibrado → plano de ação), além de escrita livre.
- **Nina** — assistente de IA (Claude) com contexto do seu perfil, humor recente e
  diário, orientada por TCC e neurociência, sem julgamentos.
- **Lições** — microcursos sobre bem-estar, neurociência do medo social,
  assertividade (passivo/agressivo/assertivo, técnica DESC), limites no trabalho,
  reestruturação cognitiva, liderança sem precisar agradar todo mundo.
- **Hábitos** — checklist diário com sequências (streaks).
- **Agenda** — compromissos e lembretes com data/hora, mais um link de assinatura
  (.ics) para ver os mesmos compromissos no Google Calendar ou no Apple Calendar
  — sem precisar de login OAuth, atualiza sozinho a cada hora.
- **Painel** — histórico visual: tendência de humor, distorções cognitivas mais
  frequentes, progresso de lições, hábitos ativos.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** (Postgres + Auth + Row Level Security) — cada tabela é protegida
  por `auth.uid()`, só você acessa seus próprios dados
- **Anthropic Claude API** para a Nina (streaming)
- PWA (instalável no celular como app)

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Copie `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

O projeto Supabase já foi provisionado (plano ~US$10/mês, região `sa-east-1`):

```
NEXT_PUBLIC_SUPABASE_URL=https://zfyffagwusjfwtvatqql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<pegue em supabase.com/dashboard/project/zfyffagwusjfwtvatqql/settings/api>
```

A chave anônima (`anon key`) é segura para expor no cliente — o acesso real aos
dados é controlado pelas políticas de RLS no banco, não pela chave. Pegue o valor
atual no painel do Supabase (Project Settings → API).

Falta só a sua chave da Anthropic:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Gere uma em [console.anthropic.com](https://console.anthropic.com/settings/keys).

Por padrão a Nina usa o `claude-haiku-4-5` — o modelo mais barato da Anthropic
(US$1/US$5 por milhão de tokens de entrada/saída), o que para uso pessoal diário
custa centavos por mês. Se quiser respostas mais elaboradas e não se importar com
o custo maior, defina `ANTHROPIC_MODEL=claude-sonnet-5` ou `claude-opus-5` no
`.env.local` — veja preços atuais em [anthropic.com/pricing](https://anthropic.com/pricing).

### 3. Rodar localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000), crie sua conta (e-mail/senha)
e siga o onboarding.

> Por padrão o Supabase exige confirmação por e-mail ao criar conta. Para um app
> só seu, você pode desativar isso em Supabase Dashboard → Authentication →
> Sign In / Providers → Email → "Confirm email" (desligar), se preferir entrar
> direto sem checar e-mail.

### 4. Deploy (opcional)

Funciona bem na [Vercel](https://vercel.com): importe o repositório, configure as
mesmas variáveis de ambiente no dashboard do projeto, e instale como PWA no
celular pelo navegador ("Adicionar à tela de início").

## Estrutura de dados (Supabase)

`profiles`, `onboarding_answers`, `mood_checkins`, `journal_entries`,
`chat_messages`, `lessons` (conteúdo compartilhado, somente leitura),
`lesson_progress`, `habits`, `habit_logs`, `agenda_events` — todas com RLS
habilitada e escopadas por usuário (exceto `lessons`, que é a biblioteca de
conteúdo).

> O link de assinatura da Agenda (`/api/ics/<token>`) usa um token aleatório
> guardado em `profiles.ics_token` para funcionar sem login (é assim que o
> Google/Apple Calendar conseguem buscá-lo). Trate esse link como uma senha —
> quem tiver o link vê seus compromissos. Se ele vazar, é só gerar um novo token
> no banco (`update profiles set ics_token = gen_random_uuid() where id = ...`).

## Aviso importante

Este app é uma ferramenta de autoconhecimento e autogestão emocional — **não
substitui acompanhamento profissional**. Se em algum momento surgir sofrimento
intenso, pensamentos de autolesão ou algo que pareça maior do que autoajuda,
procure um psicólogo, psiquiatra ou serviço de saúde mental.
