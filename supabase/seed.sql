-- Données de référence pour AlloArbitre (déjà appliquées sur le projet
-- Supabase "FFBB arbitre" - ce fichier sert de documentation/point de
-- départ pour un nouveau projet, il n'est pas exécuté automatiquement.
-- Idempotent (ON CONFLICT DO NOTHING) : peut être rejoué sans dupliquer.

insert into "RefereeLevel" (label, rank) values
  ('Jeune Arbitre', 1),
  ('Arbitre Stagiaire', 2),
  ('Arbitre District 3', 3),
  ('Arbitre District 2', 4),
  ('Arbitre District 1', 5),
  ('Arbitre Excellence Départementale', 6)
on conflict (label) do nothing;

insert into "CompetitionLevel" (label) values
  ('U13'), ('U15'), ('U18'),
  ('Seniors D4'), ('Seniors D3'), ('Seniors D2'), ('Seniors D1'), ('Seniors Excellence'),
  ('Féminines'), ('Coupe Départementale')
on conflict (label) do nothing;

insert into "LevelMapping" ("competitionLevelId", "minRefereeLevelId")
select c.id, r.id
from (values
  ('U13', 1), ('U15', 2), ('U18', 3), ('Seniors D4', 2), ('Seniors D3', 3),
  ('Seniors D2', 4), ('Seniors D1', 5), ('Seniors Excellence', 6),
  ('Féminines', 3), ('Coupe Départementale', 4)
) as m(competition_label, referee_rank)
join "CompetitionLevel" c on c.label = m.competition_label
join "RefereeLevel" r on r.rank = m.referee_rank
on conflict ("competitionLevelId") do nothing;

insert into "Referee" ("firstName", "lastName", zone, phone, "levelId")
select v.first, v.last, v.zone, v.phone, r.id
from (values
  ('Julien', 'Marchand', 'Orléans', '0601020304', 5),
  ('Claire', 'Dubuisson', 'Montargis', '0602030405', 4),
  ('Amine', 'Belkacem', 'Pithiviers', '0603040506', 3),
  ('Sophie', 'Renard', 'Orléans', '0604050607', 6),
  ('Karim', 'Ferhat', 'Gien', '0605060708', 2),
  ('Marion', 'Petit', 'Orléans', '0606070809', 3),
  ('Thomas', 'Girard', 'Montargis', '0607080910', 1),
  ('Nadia', 'Boumediene', 'Pithiviers', '0608091011', 4)
) as v(first, last, zone, phone, rank)
join "RefereeLevel" r on r.rank = v.rank
where not exists (
  select 1 from "Referee" existing where existing."firstName" = v.first and existing."lastName" = v.last
);

-- Les comptes utilisateurs sont gérés par Supabase Auth (dashboard >
-- Authentication > Users, ou /signup), pas par ce seed. Un Profile est créé
-- automatiquement à l'inscription (trigger handle_new_user) avec le rôle
-- REPARTITEUR par défaut ; promouvoir un compte en ADMIN se fait avec :
--   UPDATE "Profile" SET role = 'ADMIN' WHERE email = '...';
