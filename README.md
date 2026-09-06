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
ref `rtecvnqsyvpehgesrmgn`). Deux chaînes de connexion sont nécessaires :

- `DATABASE_URL` : pooler Supavisor en mode transaction (port 6543) —
  utilisée par l'application au runtime, adaptée au serverless
- `DIRECT_URL` : pooler Supavisor en mode session (port 5432) — utilisée
  par Prisma pour les migrations (`prisma migrate dev`/`deploy`)

Format (voir Project Settings > Database sur le dashboard Supabase) :

```
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Le mot de passe doit être encodé en URL (ex: `!` devient `%21`).

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

## Variables d'environnement (`.env` en local, Vercel Project Settings > Environment Variables en prod)

- `DATABASE_URL`, `DIRECT_URL` : voir section Base de données ci-dessus
- `AUTH_SECRET` : secret NextAuth (générer avec `openssl rand -base64 32`)
- `AUTH_TRUST_HOST` : `true` (utile en local/self-hosted ; sans effet sur Vercel)

## Déploiement

- **Base de données** : Supabase (Postgres managé, déjà provisionné)
- **Application** : Vercel — connecter le repo GitHub, brancher sur
  `claude/referee-assignment-system-zy1i9t` (ou `main` une fois mergé),
  renseigner les variables d'environnement ci-dessus dans les settings du
  projet Vercel, puis déployer. Le script `postinstall` (`prisma generate`)
  s'exécute automatiquement à chaque build.
