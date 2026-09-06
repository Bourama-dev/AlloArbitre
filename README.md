# AlloArbitre

Outil de désignation des arbitres pour le CD45. Next.js (App Router) +
TypeScript + Supabase (Postgres + Auth), via `@supabase/supabase-js`.

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

## Architecture des données

Le projet parle directement à Supabase via `@supabase/supabase-js` (pas
d'ORM). Deux clients :

- `src/lib/supabase/server.ts` : client lié à la session du visiteur
  (cookies), utilisé uniquement pour l'authentification (login/signup/
  session Supabase Auth)
- `src/lib/supabase/admin.ts` : client "service_role", utilisé pour toutes
  les données applicatives (matchs, arbitres, désignations...). Contourne
  volontairement les policies RLS - l'autorisation (qui peut faire quoi)
  est vérifiée par notre propre code (`getCurrentUser()` + rôle), jamais
  par la base

`supabase/schema.sql` et `supabase/seed.sql` documentent le schéma et les
données de référence (déjà appliqués sur le projet). Ce ne sont pas des
migrations exécutées automatiquement : toute évolution de schéma se fait
en SQL direct sur le projet Supabase (dashboard > SQL editor, ou les
outils MCP Supabase), puis en mettant à jour `supabase/schema.sql`.

## Authentification (Supabase Auth)

L'authentification passe entièrement par le service Auth natif de Supabase
(GoTrue), via `@supabase/ssr`. Deux pages : `/login` et `/signup`
(inscription libre, ouverte à qui a l'URL - pas de code d'invitation).
Un nouveau compte créé via `/signup` obtient le rôle `REPARTITEUR` par
défaut ; à évaluer si un contrôle d'accès plus strict devient nécessaire
(code d'invitation, validation manuelle...).

Table `Profile` (schéma `public`) : id = `auth.users.id`, email, name,
role (`ADMIN` ou `REPARTITEUR`, défaut `REPARTITEUR`). Un trigger Postgres
(`handle_new_user`, voir `supabase/schema.sql`) crée automatiquement la
ligne `Profile` à chaque nouvelle inscription dans `auth.users`, que ce
soit via `/signup` ou créée manuellement depuis le dashboard Supabase.

**Créer un compte manuellement** (alternative à `/signup`) : dashboard
Supabase > Authentication > Users > Add user (cocher "Auto Confirm User"
pour se connecter immédiatement sans email de confirmation).

**Promouvoir un compte en ADMIN** (accès à `/admin/niveaux`) :

```sql
UPDATE "Profile" SET role = 'ADMIN' WHERE email = 'quelquun@example.com';
```

## Variables d'environnement

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` : URL et clé
  publique du projet Supabase (Project Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY` : clé secrète (même page, section
  "service_role") - **ne jamais** l'exposer côté client, uniquement utilisée
  dans du code serveur (`src/lib/supabase/admin.ts`)

**Piège fréquent en collant une valeur dans les Environment Variables de
Vercel** : ne pas inclure les guillemets (le format `.env` en a, Vercel
non) - une URL du genre `"https://...supabase.co"` avec les guillemets
inclus est invalide et fait planter toutes les pages (500 générique). Le
code tente de nettoyer ça automatiquement (`src/lib/supabase/env.ts`),
mais autant coller la valeur propre dès le départ.

## Démarrage

```bash
npm install
npm run dev
```

Créer ensuite un compte via `/signup` ou le dashboard Supabase (voir
section Authentification ci-dessus) pour pouvoir te connecter.

## Déploiement

- **Base de données + Auth** : Supabase (déjà provisionné)
- **Application** : Vercel — connecter le repo GitHub, brancher sur
  `claude/referee-assignment-system-zy1i9t` (ou `main` une fois mergé),
  renseigner les trois variables d'environnement ci-dessus (cocher
  Production + Preview pour chacune), puis déployer.
