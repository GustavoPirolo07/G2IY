-- Execute no Supabase: SQL Editor > New query > Run
-- Acrescenta o histórico de melhores resultados. Não altera nada do que já existe.

-- 1) Tabela de recordes (uma linha por jogador e por jogo)
create table if not exists public.melhores_resultados (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  jogo text not null check (jogo in ('caca_palavras', 'adivinhacao', 'quiz')),
  melhor_pontuacao integer not null default 0 check (melhor_pontuacao between 0 and 100),
  melhor_tempo_segundos integer check (melhor_tempo_segundos > 0),
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, jogo)
);

-- 2) RLS: o jogador só lê os próprios recordes; ninguém grava direto pelo navegador
alter table public.melhores_resultados enable row level security;

drop policy if exists "ler proprios resultados" on public.melhores_resultados;
create policy "ler proprios resultados"
  on public.melhores_resultados for select
  using (auth.uid() = usuario_id);

-- 3) Função que registra a partida (gravação só passa por aqui)
create or replace function public.registrar_resultado(
  p_jogo text,
  p_pontos integer,
  p_tempo integer default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_max integer;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  v_max := case p_jogo
    when 'caca_palavras' then 100
    when 'quiz'          then 100
    when 'adivinhacao'   then 90
    else null
  end;

  if v_max is null then
    raise exception 'Jogo inválido';
  end if;
  if p_pontos is null or p_pontos < 0 or p_pontos > v_max then
    raise exception 'Pontuação inválida para este jogo';
  end if;
  if p_jogo = 'caca_palavras' and (p_tempo is null or p_tempo <= 0 or p_tempo > 86400) then
    raise exception 'Tempo inválido';
  end if;

  insert into public.melhores_resultados (usuario_id, jogo, melhor_pontuacao, melhor_tempo_segundos)
  values (auth.uid(), p_jogo, p_pontos, case when p_jogo = 'caca_palavras' then p_tempo end)
  on conflict (usuario_id, jogo) do update set
    melhor_pontuacao = greatest(melhores_resultados.melhor_pontuacao, excluded.melhor_pontuacao),
    melhor_tempo_segundos = case
      when excluded.melhor_tempo_segundos is null then melhores_resultados.melhor_tempo_segundos
      when melhores_resultados.melhor_tempo_segundos is null then excluded.melhor_tempo_segundos
      else least(melhores_resultados.melhor_tempo_segundos, excluded.melhor_tempo_segundos)
    end,
    atualizado_em = now();

  -- mantém a pontuação ecológica total que aparece no menu
  update public.perfis_jogadores
     set pontuacao_ecologica = pontuacao_ecologica + p_pontos
   where id = auth.uid();
end;
$$;

-- Só usuários logados podem chamar a função
revoke all on function public.registrar_resultado(text, integer, integer) from public, anon;
grant execute on function public.registrar_resultado(text, integer, integer) to authenticated;
