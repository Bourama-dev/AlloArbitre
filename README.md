# AlloArbitre

Outil de désignation des arbitres pour le CD45. Next.js (App Router) +
TypeScript + Prisma + PostgreSQL (Supabase) + NextAuth (multi-utilisateurs).

## Fonctionnalités (V1)

- Liste des matchs filtrable par semaine, niveau de compétition et statut
- Vue dédiée "matchs incomplets"
- Fiche arbitre (niveau, zone, contact, charge actuelle)
- Algorithme de suggestion d'arbitres par match : filtre par niveau minimum
  requis (table éditable dans "Admin niveaux"), exclusion des conflits
  d'horaire, tri par équité (nombre de désignations croissant)
- Validation manuelle obligatoire : une désignation n'est jamais créée
  automatiquement, toujours par un clic explicite sur une suggestion
- Authentification multi-utilisateurs (email + mot de passe)

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

## Démarrage

```bash
npm install
npx prisma migrate deploy   # applique le schéma sur la base configurée
npx prisma db seed          # niveaux, mapping par défaut, arbitres/matchs d'exemple, compte admin
npm run dev
```

Le seed crée un compte ADMIN avec l'email `bouramad900@gmail.com` et le mot
de passe `changeme123` (ou les valeurs de `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` si définies) — à changer après la première connexion.

## Variables d'environnement

- `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` : fournies
  automatiquement par l'intégration Vercel-Supabase (voir section Base de
  données ci-dessus) ; à défaut, renseigner `.env` en local
- `AUTH_SECRET` : secret NextAuth (générer avec `openssl rand -base64 32`)
- `AUTH_TRUST_HOST` : `true` (utile en local/self-hosted ; sans effet sur Vercel)

## Déploiement

- **Base de données** : Supabase (Postgres managé, déjà provisionné)
- **Application** : Vercel — connecter le repo GitHub, brancher sur
  `claude/referee-assignment-system-zy1i9t` (ou `main` une fois mergé),
  puis dans les settings du projet Vercel, onglet Integrations, connecter
  l'intégration Supabase existante au projet "FFBB arbitre" (elle injecte
  automatiquement `POSTGRES_PRISMA_URL`/`POSTGRES_URL_NON_POOLING`).
  Ajouter ensuite `AUTH_SECRET` manuellement, puis déployer. Le script
  `postinstall` (`prisma generate`) s'exécute automatiquement à chaque
  build.
