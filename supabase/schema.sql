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
-- rank 1 = niveau le plus élevé (rank croissant = niveau plus bas). Éditable
-- pour coller à la grille réelle du CD45.
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
  "nationalNumber" text,
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
  "durationMinutes" integer not null default 120,
  "homeTeam" text not null,
  "awayTeam" text not null,
  venue text,
  city text,
  "venueAddress" text,
  lat double precision,
  lng double precision,
  poule text,
  notes text,
  "refereesRequired" integer not null default 2 check ("refereesRequired" >= 2),
  cancelled boolean not null default false,
  "competitionLevelId" text not null references "CompetitionLevel"(id),
  -- Identifiant FBI (idRencontre) une fois résolu, pour éviter de rechercher
  -- à nouveau la rencontre côté FBI à chaque push de désignation.
  "fbiIdRencontre" text,
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

-- Mémorise qu'un admin a explicitement retiré tel arbitre de tel match, pour
-- que la reprise automatique des officiels FBI (designation-sync.ts) ne le
-- réimporte pas silencieusement au prochain affichage du détail - FBI, lui,
-- n'a pas été modifié.
create table "DesignationRemoval" (
  "matchId" text not null references "Match"(id) on delete cascade,
  "refereeId" text not null references "Referee"(id) on delete cascade,
  "removedAt" timestamp(3) not null default now(),
  primary key ("matchId", "refereeId")
);

-- Désignation d'un arbitre sur un match. Toujours créée après validation manuelle
-- d'une suggestion - jamais d'auto-assignation silencieuse.
-- position : 1 (arbitre 1) ou 2 (arbitre 2). Pas d'unicité imposée en base sur
-- (matchId, position) - maintenue par l'application (designateReferee), pour
-- permettre l'échange atomique des positions lors de la rotation 1/2 entre
-- deux matchs consécutifs d'un même binôme.
create table "Designation" (
  id text primary key default gen_random_uuid()::text,
  "matchId" text not null references "Match"(id) on delete cascade,
  "refereeId" text not null references "Referee"(id),
  "createdById" uuid not null references "Profile"(id),
  "createdAt" timestamp(3) not null default current_timestamp,
  "position" smallint not null default 1 check ("position" in (1, 2)),
  unique ("matchId", "refereeId")
);

-- Division désignée par le CD45 (auto-désignation) ; false = à la main uniquement.
-- alter table "CompetitionLevel" add column "autoDesignation" boolean not null default true;

-- Âge minimum de l'arbitre (à la date du match) par division ; NULL = pas de contrôle.
alter table "CompetitionLevel" add column "minRefereeAge" integer
  check ("minRefereeAge" is null or "minRefereeAge" between 10 and 99);

-- Paramètres du comité (une seule ligne, id = 1) - voir /admin/parametres.
create table "Settings" (
  id smallint primary key default 1 check (id = 1),
  "maxDistanceKm" double precision check ("maxDistanceKm" is null or "maxDistanceKm" > 0),
  "updatedAt" timestamp(3) not null default now()
);

-- Groupes de désignation (viviers) - voir /admin/groupes. Une division
-- rattachée à au moins un groupe n'est ouverte qu'aux membres de ces groupes.
create table "RefereeGroup" (
  id text primary key default gen_random_uuid()::text,
  label text not null unique,
  "createdAt" timestamp(3) not null default current_timestamp
);
create table "RefereeGroupMember" (
  "groupId" text not null references "RefereeGroup"(id) on delete cascade,
  "refereeId" text not null references "Referee"(id) on delete cascade,
  primary key ("groupId", "refereeId")
);
create table "RefereeGroupDivision" (
  "groupId" text not null references "RefereeGroup"(id) on delete cascade,
  "competitionLevelId" text not null references "CompetitionLevel"(id) on delete cascade,
  primary key ("groupId", "competitionLevelId")
);

-- Cache des distances routières Google Routes (src/lib/routing.ts) ; clés =
-- coordonnées arrondies à 4 décimales "lat,lng".
create table "RouteDistance" (
  "originKey" text not null,
  "destKey" text not null,
  "distanceKm" double precision not null,
  "durationMinutes" double precision not null,
  "createdAt" timestamp(3) not null default now(),
  primary key ("originKey", "destKey")
);

-- Espace arbitre : rôle ARBITRE (fixé via auth app_metadata.role par
-- src/lib/referee-auth.ts) et rattachement du profil à la fiche arbitre.
-- handle_new_user() lit app_metadata.role / refereeId (voir migration
-- espace_arbitre_disponibilites).
alter type "UserRole" add value 'ARBITRE';
alter table "Profile" add column "refereeId" text unique references "Referee"(id) on delete set null;

-- Campagnes de saisie des disponibilités (voir src/lib/availability.ts).
create table "AvailabilityPeriod" (
  id text primary key default gen_random_uuid()::text,
  label text not null,
  "startDate" date not null,
  "endDate" date not null,
  deadline timestamptz not null,
  "invitationSentAt" timestamptz,
  "reminderSentAt" timestamptz,
  "reportSentAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  check ("endDate" >= "startDate")
);
create table "AvailabilityResponse" (
  "periodId" text not null references "AvailabilityPeriod"(id) on delete cascade,
  "refereeId" text not null references "Referee"(id) on delete cascade,
  "respondedAt" timestamptz not null default now(),
  comment text,
  primary key ("periodId", "refereeId")
);
create table "AvailabilitySlot" (
  "periodId" text not null references "AvailabilityPeriod"(id) on delete cascade,
  "refereeId" text not null references "Referee"(id) on delete cascade,
  day date not null,
  slot text not null check (slot in ('matin', 'debut-apres-midi', 'fin-apres-midi', 'soir')),
  primary key ("periodId", "refereeId", day, slot)
);
alter table "Settings" add column "requireAvailability" boolean not null default false;
-- (invitationSentAt / reminderSentAt / reportSentAt d'AvailabilityPeriod :
-- inutilisés depuis l'abandon des e-mails, annonces et relances via WhatsApp.)

-- Tentatives d'activation du compte arbitre (licence + date de naissance) :
-- 5 échecs en 1 h sur une licence bloquent l'activation (src/lib/referee-auth.ts).
create table "RefereeActivationAttempt" (
  id bigint generated always as identity primary key,
  "licenseKey" text not null,
  success boolean not null,
  "createdAt" timestamptz not null default now()
);

-- GoTrue pose app_metadata APRÈS l'insertion : handle_new_user ne voit pas
-- role = ARBITRE. Ce trigger recale le profil (rôle + fiche) à chaque
-- modification de raw_app_meta_data (migration profil_arbitre_sync_app_metadata).
-- create trigger on_auth_user_app_metadata_updated after update of raw_app_meta_data
--   on auth.users for each row execute function public.sync_profile_role_from_app_metadata();

-- Règles de désignation modifiables depuis Admin > Règles (migration
-- designation_rules_table). Les règles de base (builtin) sont semées par la
-- migration ; sans table ou vide, l'application retombe sur DEFAULT_RULES.
create table "DesignationRule" (
  id text primary key,
  kind text not null check (kind in ('quota', 'tqr-repos', 'forbid')),
  label text not null,
  description text not null default '',
  severity text not null default 'bloquant' check (severity in ('bloquant', 'avertissement')),
  active boolean not null default true,
  builtin boolean not null default false,
  params jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
alter table "DesignationRule" enable row level security;
