# AlloArbitre

Outil de désignation des arbitres pour le CD45. Next.js (App Router) +
TypeScript + Prisma + SQLite + NextAuth (multi-utilisateurs).

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

## Démarrage

```bash
npm install
npx prisma migrate dev   # crée prisma/dev.db et applique le schéma
npx prisma db seed       # niveaux, mapping par défaut, arbitres/matchs d'exemple, compte admin
npm run dev
```

Le seed crée un compte ADMIN avec l'email `bouramad900@gmail.com` et le mot
de passe `changeme123` (ou les valeurs de `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` si définies) — à changer après la première connexion.

## Variables d'environnement (`.env`)

- `DATABASE_URL` : chemin du fichier SQLite (par défaut `file:./dev.db`)
- `AUTH_SECRET` : secret NextAuth (générer avec `openssl rand -base64 32`)
- `AUTH_TRUST_HOST` : `true` en local/self-hosted (pas nécessaire sur Vercel)

## Limite connue pour un déploiement en production

Le fichier SQLite est stocké sur disque local. Sur une plateforme serverless
(Vercel notamment), le système de fichiers est éphémère : la base ne
survivrait pas aux déploiements. Pour une mise en production multi-
utilisateurs durable, prévoir soit un serveur Node persistant (VPS, Docker),
soit une migration vers une base hébergée (Postgres, Turso/LibSQL...).
