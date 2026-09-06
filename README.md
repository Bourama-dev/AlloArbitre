# AlloArbitre

Outil de désignation des arbitres pour le CD45. Next.js (App Router) +
TypeScript + Prisma + PostgreSQL (Supabase) + Supabase Auth (multi-utilisateurs).

## Fonctionnalités (V1)

- Liste des matchs filtrable par semaine, niveau de compétition et statut
- Vue dédiée "matchs incomplets"
- Fiche arbitre (niveau, zone, contact, charge actuelle)
- Algorithme de suggestion d'arbitres par match : filtre par niveau minimum
  requis (table éditable dans "Admin niveaux"), exclusion des conflits
  d'horaire, tri par équité (nombre de désignations croissant)
- Validation manuelle obligatoire : une désignation n'est jamais créée
  automatiquement, toujours par un clic explicite sur une suggestion
- Authentification multi-utilisateurs via Supabase Auth (email + mot de passe)

## Volontairement non traité pour l'instant

- Pas de filtre de disponibilité des arbitres (table Disponibilités pas
  encore fournie)
- La correspondance niveau de compétition -> niveau d'arbitre minimum est
  une valeur par défaut construite pour ce projet ; à corriger via
  "Admin niveaux" (réservé aux comptes ADMIN) si elle ne colle pas à la
  grille réelle du CD45

## Base de données

Le projet utilise Postgres hébergé sur Supabase (projet "FFBB arbitre",
ref `rtecvnqsyvpehgesrmgn`), connecté au projet Vercel via l'**intégration
officielle Vercel-Supabase**. Cette intégration synchronise automatiquement
les variables de connexion dans les settings du projet Vercel — pas besoin
de les copier-coller à la main. `prisma/schema.prisma` lit directement ces
noms de variables :

- `POSTGRES_PRISMA_URL` : pooler (pgbouncer) — utilisée par l'application
  au runtime, adaptée au serverless
- `POSTGRES_URL_NON_POOLING` : connexion directe — utilisée par Prisma
  pour les migrations (`prisma migrate dev`/`deploy`)

En local (sans l'intégration), reproduire ces deux variables dans `.env`
avec les chaînes de connexion du dashboard Supabase (Project Settings >
Database), mot de passe encodé en URL (ex: `!` devient `%21`) :

```
POSTGRES_PRISMA_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

## Authentification (Supabase Auth)

L'authentification passe entièrement par le service Auth natif de Supabase
(GoTrue), via `@supabase/ssr`. Il n'y a **pas** de page d'inscription dans
l'app : les comptes sont créés côté Supabase.

Table `Profile` (schéma `public`, gérée par Prisma) : id = `auth.users.id`,
email, name, role (`ADMIN` ou `REPARTITEUR`, défaut `REPARTITEUR`). Un
trigger Postgres (`handle_new_user`, voir la migration
`20260906180000_profile_supabase_auth`) crée automatiquement la ligne
`Profile` à chaque nouvelle inscription dans `auth.users`.

**Créer un compte répartiteur** : dashboard Supabase > Authentication >
Users > Add user (email + mot de passe, cocher "Auto Confirm User" pour
qu'il puisse se connecter immédiatement sans email de confirmation).

**Promouvoir un compte en ADMIN** (accès à `/admin/niveaux`) :

```sql
UPDATE "Profile" SET role = 'ADMIN' WHERE email = 'quelquun@example.com';
```

## Variables d'environnement

- `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` : voir section Base de
  données
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` : URL et clé
  publique du projet Supabase (Project Settings > API) — fournies elles
  aussi par l'intégration Vercel-Supabase, sinon à renseigner dans `.env`

## Démarrage

```bash
npm install
npx prisma migrate deploy   # applique le schéma sur la base configurée
npx prisma db seed          # niveaux, mapping par défaut, arbitres/matchs d'exemple
npm run dev
```

Créer ensuite un compte via le dashboard Supabase (voir section
Authentification ci-dessus) pour pouvoir te connecter.

## Déploiement

- **Base de données + Auth** : Supabase (déjà provisionné)
- **Application** : Vercel — connecter le repo GitHub, brancher sur
  `claude/referee-assignment-system-zy1i9t` (ou `main` une fois mergé),
  puis dans les settings du projet Vercel, onglet Integrations, connecter
  l'intégration Supabase existante au projet "FFBB arbitre" (elle injecte
  automatiquement les variables ci-dessus), puis déployer. Le script
  `postinstall` (`prisma generate`) s'exécute automatiquement à chaque
  build.
