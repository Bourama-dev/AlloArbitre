-- Schéma de référence d'AlloArbitre (projet Supabase "FFBB arbitre").
-- Ce fichier documente l'état de la base pour comprendre/recréer le schéma
-- si besoin - ce n'est PAS exécuté automatiquement par l'application
-- (il n'y a plus de Prisma/ORM ; l'app parle directement à Supabase via
-- @supabase/supabase-js). Pour appliquer une évolution de schéma, exécuter
-- le SQL directement sur le projet Supabase (dashboard > SQL editor, ou
-- les outils MCP Supabase).

create type "UserRole" as enum ('ADMIN', 'REPARTITEUR');

-- Profil applicatif (nom, rôle) d'un utilisateur Supabase Auth.
-- id = auth.users.id ; une ligne est créée automatiquement à l'inscription
-- par le trigger handle_new_user ci-dessous.
create table "Profile" (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  role "UserRole" not null default 'REPARTITEUR',
  "createdAt" timestamp(3) not null default current_timestamp
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public."Profile" (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'REPARTITEUR'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Niveau d'arbitre (ex: Jeune Arbitre, District 3, District 2, District 1...).
-- rank croissant = niveau plus élevé. Éditable pour coller à la grille réelle du CD45.
create table "RefereeLevel" (
  id text primary key default gen_random_uuid()::text,
  label text not null unique,
  rank integer not null unique
);

create table "Referee" (
  id text primary key default gen_random_uuid()::text,
  "firstName" text not null,
  "lastName" text not null,
  phone text,
  email text,
  zone text,
  address text,
  lat double precision,
  lng double precision,
  "licenseNumber" text,
  "birthDate" date,
  "qualificationDate" date,
  "medicalFileDate" date,
  "recyclingDate" date,
  active boolean not null default true,
  notes text,
  "levelId" text not null references "RefereeLevel"(id),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default now()
);

-- Niveau de compétition (ex: Seniors D1, U18, Coupe départementale...).
create table "CompetitionLevel" (
  id text primary key default gen_random_uuid()::text,
  label text not null unique
);

-- Correspondance niveau de compétition -> niveau d'arbitre minimum requis.
-- Table éditable (voir /admin/niveaux) pour ne jamais dépendre d'une valeur figée dans le code.
create table "LevelMapping" (
  id text primary key default gen_random_uuid()::text,
  "competitionLevelId" text not null unique references "CompetitionLevel"(id) on delete cascade,
  "minRefereeLevelId" text not null references "RefereeLevel"(id)
);

create table "Match" (
  id text primary key default gen_random_uuid()::text,
  date timestamp(3) not null,
  "durationMinutes" integer not null default 100,
  "homeTeam" text not null,
  "awayTeam" text not null,
  venue text,
  city text,
  "venueAddress" text,
  lat double precision,
  lng double precision,
  poule text,
  notes text,
  "refereesRequired" integer not null default 1,
  cancelled boolean not null default false,
  "competitionLevelId" text not null references "CompetitionLevel"(id),
  "createdAt" timestamp(3) not null default current_timestamp,
  "updatedAt" timestamp(3) not null default now()
);
create index "Match_date_idx" on "Match"(date);

-- Indisponibilité d'un arbitre sur une période (date à date, inclusif).
-- Exclut l'arbitre des suggestions pour tout match dont la date tombe dans
-- l'intervalle.
-- recurring=false : période ponctuelle (startDate/endDate obligatoires).
-- recurring=true : jour de semaine récurrent (dayOfWeek, 0=dimanche..6=samedi),
-- avec startTime/endTime optionnels (NULL = journée entière bloquée).
create table "Unavailability" (
  id text primary key default gen_random_uuid()::text,
  "refereeId" text not null references "Referee"(id) on delete cascade,
  recurring boolean not null default false,
  "startDate" date,
  "endDate" date,
  "dayOfWeek" smallint,
  "startTime" text,
  "endTime" text,
  note text,
  "createdAt" timestamp(3) not null default current_timestamp,
  check (
    (recurring = false and "startDate" is not null and "endDate" is not null and "endDate" >= "startDate")
    or
    (recurring = true and "dayOfWeek" between 0 and 6)
  )
);
create index "Unavailability_refereeId_idx" on "Unavailability"("refereeId");

-- Désignation d'un arbitre sur un match. Toujours créée après validation manuelle
-- d'une suggestion - jamais d'auto-assignation silencieuse.
create table "Designation" (
  id text primary key default gen_random_uuid()::text,
  "matchId" text not null references "Match"(id) on delete cascade,
  "refereeId" text not null references "Referee"(id),
  "createdById" uuid not null references "Profile"(id),
  "createdAt" timestamp(3) not null default current_timestamp,
  unique ("matchId", "refereeId")
);
