-- Fluenta — esquema inicial (MVP)
-- Princípios de segurança:
--   1. Toda tabela com dado de aluno tem RLS ligado; o usuário só acessa a própria linha.
--   2. Visitantes não logados (role anon) não têm acesso a nada.
--   3. O contador de uso da IA não pode ser editado pelo aluno: só a função
--      consume_ai_credit() incrementa, e ela nunca diminui o valor.

-- ---------- Estado do aluno (perfil, plano, progresso, conversas, vocabulário) ----------
create table public.learner_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- impede abuso de armazenamento (≈ 2 MB por aluno)
  constraint learner_state_size check (pg_column_size(data) < 2000000)
);

alter table public.learner_state enable row level security;

revoke all on public.learner_state from anon, authenticated;
grant select, insert, update, delete on public.learner_state to authenticated;

create policy "learner_state: ler o próprio"
  on public.learner_state for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "learner_state: criar o próprio"
  on public.learner_state for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "learner_state: atualizar o próprio"
  on public.learner_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "learner_state: apagar o próprio"
  on public.learner_state for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger learner_state_touch
  before update on public.learner_state
  for each row execute function public.touch_updated_at();

-- ---------- Uso diário da IA (limite de custo por aluno) ----------
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  count   integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- O aluno pode ver o próprio consumo, mas não inserir nem alterar.
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;

create policy "ai_usage: ler o próprio"
  on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);

-- Incrementa o contador do dia de forma atômica e diz se ainda está dentro do limite.
-- SECURITY DEFINER: roda com permissão do dono para escrever em ai_usage,
-- mas sempre usando o auth.uid() de quem chamou (ninguém consome crédito de outra pessoa).
create or replace function public.consume_ai_credit(p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    return false;
  end if;

  insert into public.ai_usage as u (user_id, day, count)
  values (v_uid, current_date, 1)
  on conflict (user_id, day) do update set count = u.count + 1
  returning u.count into v_count;

  return v_count <= greatest(p_limit, 0);
end;
$$;

revoke all on function public.consume_ai_credit(integer) from public, anon;
grant execute on function public.consume_ai_credit(integer) to authenticated;
