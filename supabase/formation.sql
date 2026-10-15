-- =====================================================================
-- BATCAV — progression de la formation
-- À coller dans Supabase > SQL Editor > New query, puis "Run" (une seule fois).
-- =====================================================================
create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  lesson_slug text not null,
  quiz_score integer,          -- bonnes réponses (null pour un résumé)
  quiz_total integer,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_slug)
);

alter table public.lesson_progress enable row level security;

drop policy if exists "progression: lire la sienne ou coach" on public.lesson_progress;
create policy "progression: lire la sienne ou coach" on public.lesson_progress
  for select using (user_id = auth.uid() or public.is_coach());

drop policy if exists "progression: écrire la sienne" on public.lesson_progress;
create policy "progression: écrire la sienne" on public.lesson_progress
  for insert with check (user_id = auth.uid());

drop policy if exists "progression: modifier la sienne" on public.lesson_progress;
create policy "progression: modifier la sienne" on public.lesson_progress
  for update using (user_id = auth.uid());
