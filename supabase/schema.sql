-- =====================================================================
-- BATCAV — schéma Supabase
-- À coller dans Supabase > SQL Editor > New query, puis "Run".
-- =====================================================================

-- ---------- PROFILS ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  pseudo text,
  role text not null default 'student' check (role in ('student', 'coach')),
  goal_amount integer not null default 1500,          -- objectif en euros
  weekly_messages_goal integer not null default 100,
  show_in_leaderboard boolean not null default false, -- consentement explicite
  situation text,
  hours_per_week text,
  target text,
  blocker text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Crée automatiquement un profil à chaque nouveau compte
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'coach');
$$;

-- Un élève ne peut pas se donner le rôle coach
create or replace function public.protect_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() est vide quand la requête vient du SQL Editor / de la clé service_role (toi) : autorisé
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_coach() then
    new.role := old.role;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

-- ---------- PAIEMENTS (déclarés par l'élève, validés par le coach) ----------
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  amount integer not null check (amount > 0 and amount <= 100000), -- euros
  note text,
  paid_on date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- Un élève déclare toujours en "pending" et ne peut pas valider lui-même
create or replace function public.force_pending()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_coach() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.user_id := auth.uid();
    elsif new.status is distinct from old.status then
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists payments_force_pending on public.payments;
create trigger payments_force_pending
  before insert or update on public.payments
  for each row execute function public.force_pending();

-- ---------- ACTIVITÉ (messages de prospection, clients signés) ----------
create table if not exists public.activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('messages', 'client')),
  qty integer not null check (qty > 0 and qty <= 1000),
  note text,
  day date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- MISSIONS DU JOUR ----------
create table if not exists public.missions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  label text not null,
  day date not null default current_date,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists missions_user_day on public.missions (user_id, day);

-- =====================================================================
-- SÉCURITÉ (Row Level Security)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.activity enable row level security;
alter table public.missions enable row level security;

drop policy if exists "profil: lire le sien ou coach" on public.profiles;
create policy "profil: lire le sien ou coach" on public.profiles
  for select using (id = auth.uid() or public.is_coach());
drop policy if exists "profil: modifier le sien" on public.profiles;
create policy "profil: modifier le sien" on public.profiles
  for update using (id = auth.uid() or public.is_coach());

drop policy if exists "paiements: lire" on public.payments;
create policy "paiements: lire" on public.payments
  for select using (user_id = auth.uid() or public.is_coach());
drop policy if exists "paiements: déclarer" on public.payments;
create policy "paiements: déclarer" on public.payments
  for insert with check (user_id = auth.uid() or public.is_coach());
drop policy if exists "paiements: supprimer en attente" on public.payments;
create policy "paiements: supprimer en attente" on public.payments
  for delete using ((user_id = auth.uid() and status = 'pending') or public.is_coach());
drop policy if exists "paiements: coach valide" on public.payments;
create policy "paiements: coach valide" on public.payments
  for update using (public.is_coach());

drop policy if exists "activité: les siennes" on public.activity;
create policy "activité: les siennes" on public.activity
  for all using (user_id = auth.uid() or public.is_coach()) with check (user_id = auth.uid());

drop policy if exists "missions: les siennes" on public.missions;
create policy "missions: les siennes" on public.missions
  for all using (user_id = auth.uid() or public.is_coach()) with check (user_id = auth.uid() or public.is_coach());

-- =====================================================================
-- FONCTIONS PUBLIQUES (agrégats seulement : aucune donnée privée exposée)
-- =====================================================================

-- Nom affiché : pseudo, sinon prénom
create or replace function public.display_name(p public.profiles)
returns text language sql immutable as $$
  select coalesce(nullif(trim(p.pseudo), ''), nullif(trim(p.first_name), ''), 'Membre');
$$;

-- Total généré par toute la Batcav (paiements validés)
create or replace function public.batcav_totals()
returns table (total bigint, week_total bigint, members bigint)
language sql stable security definer set search_path = public as $$
  select
    coalesce((select sum(amount) from payments where status = 'approved'), 0),
    coalesce((select sum(amount) from payments where status = 'approved' and paid_on >= date_trunc('week', current_date)::date), 0),
    (select count(*) from profiles where role = 'student');
$$;

-- Classement : 'month' ou 'all'. Les élèves qui n'ont pas accepté apparaissent en "Membre anonyme".
create or replace function public.leaderboard(period text default 'month')
returns table (rank bigint, user_id uuid, name text, amount bigint, is_me boolean)
language sql stable security definer set search_path = public as $$
  with sums as (
    select p.id, p.show_in_leaderboard, public.display_name(p) as dn,
      coalesce(sum(pay.amount) filter (
        where pay.status = 'approved'
          and (period = 'all' or pay.paid_on >= date_trunc('month', current_date)::date)
      ), 0) as total
    from profiles p
    left join payments pay on pay.user_id = p.id
    where p.role = 'student'
    group by p.id
  )
  select
    rank() over (order by total desc) as rank,
    case when id = auth.uid() then id else null end as user_id,
    case when id = auth.uid() or show_in_leaderboard then dn else 'Membre anonyme' end as name,
    total as amount,
    id = auth.uid() as is_me
  from sums
  order by total desc, dn;
$$;

-- Dernières victoires (paiements validés des membres qui ont accepté d'apparaître)
create or replace function public.recent_wins(max_rows integer default 12)
returns table (name text, amount integer, paid_on date)
language sql stable security definer set search_path = public as $$
  select public.display_name(p), pay.amount, pay.paid_on
  from payments pay join profiles p on p.id = pay.user_id
  where pay.status = 'approved' and p.show_in_leaderboard
  order by pay.reviewed_at desc nulls last, pay.paid_on desc
  limit max_rows;
$$;

grant execute on function public.batcav_totals() to authenticated;
grant execute on function public.leaderboard(text) to authenticated;
grant execute on function public.recent_wins(integer) to authenticated;

-- =====================================================================
-- SUIVI DES ÉLÈVES (visible uniquement par le coach)
-- =====================================================================
create table if not exists public.student_tracking (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  coaching_price integer not null default 0,   -- prix de l'accompagnement (€)
  coaching_paid integer not null default 0,    -- déjà payé par l'élève (€)
  stage text not null default 'Démarrage',
  notes text,
  updated_at timestamptz not null default now()
);
alter table public.student_tracking enable row level security;
drop policy if exists "suivi: coach uniquement" on public.student_tracking;
create policy "suivi: coach uniquement" on public.student_tracking
  for all using (public.is_coach()) with check (public.is_coach());

-- =====================================================================
-- APPELS 1:1 : disponibilités du coach + réservations
-- =====================================================================
create table if not exists public.call_slots (
  id bigint generated always as identity primary key,
  starts_at timestamptz not null,
  duration_min integer not null default 45 check (duration_min between 10 and 240),
  booked_by uuid references public.profiles (id) on delete set null,
  booked_at timestamptz,
  topic text,
  created_at timestamptz not null default now()
);
create index if not exists call_slots_start on public.call_slots (starts_at);
alter table public.call_slots enable row level security;

-- L'élève voit les créneaux libres et les siens ; le coach voit tout
drop policy if exists "créneaux: lire" on public.call_slots;
create policy "créneaux: lire" on public.call_slots
  for select using (public.is_coach() or booked_by is null or booked_by = auth.uid());
drop policy if exists "créneaux: coach gère" on public.call_slots;
create policy "créneaux: coach gère" on public.call_slots
  for all using (public.is_coach()) with check (public.is_coach());

-- Réserver : uniquement un créneau libre et futur, 1 réservation à venir max par élève
create or replace function public.book_slot(slot_id bigint, slot_topic text default null)
returns text language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then return 'non_connecte'; end if;
  select count(*) into n from call_slots where booked_by = auth.uid() and starts_at > now();
  if n > 0 then return 'deja_reserve'; end if;
  update call_slots set booked_by = auth.uid(), booked_at = now(), topic = left(slot_topic, 300)
    where id = slot_id and booked_by is null and starts_at > now();
  if not found then return 'indisponible'; end if;
  return 'ok';
end $$;

-- Annuler sa réservation (au moins 2 h avant)
create or replace function public.cancel_booking(slot_id bigint)
returns text language plpgsql security definer set search_path = public as $$
begin
  update call_slots set booked_by = null, booked_at = null, topic = null
    where id = slot_id and booked_by = auth.uid() and starts_at > now() + interval '2 hours';
  if not found then return 'impossible'; end if;
  return 'ok';
end $$;

grant execute on function public.book_slot(bigint, text) to authenticated;
grant execute on function public.cancel_booking(bigint) to authenticated;

-- =====================================================================
-- APRÈS AVOIR CRÉÉ TON COMPTE (Authentication > Users > Add user), passe-toi coach :
--   update public.profiles set role = 'coach', onboarded = true, first_name = 'Ton prénom'
--   where id = (select id from auth.users where email = 'TON_EMAIL');
-- =====================================================================
