# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 103 files · ~62,312 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 681 nodes · 1864 edges · 25 communities (19 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1cd87c3d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- write.ts
- matches.ts
- getCurrentUser
- nav.tsx
- suggestions.ts
- admin.ts
- export/page.tsx
- package.json
- geocoding.ts
- arbitres/[id]/page.tsx
- referee-auth.ts
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- createClient
- designation-rules.ts
- server.ts
- connexion/page.tsx
- next

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 90 edges
2. `next` - 48 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `getMatchCandidates()` - 21 edges
9. `GET()` - 18 edges
10. `AvailabilityPeriodPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `ReglementPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/reglement/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (25 total, 6 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (76): cheerio, dynamic, GET(), maxDuration, readableError(), dynamic, FbiRencontrePage(), maxDuration (+68 more)

### Community 1 - "matches.ts"
Cohesion: 0.05
Nodes (67): react, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration (+59 more)

### Community 2 - "getCurrentUser"
Cohesion: 0.06
Nodes (55): dynamic, GroupRow, GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow (+47 more)

### Community 3 - "nav.tsx"
Cohesion: 0.13
Nodes (14): geistMono, geistSans, metadata, RootLayout(), MobileNav(), NavLink, adminLinks, linkClass() (+6 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.07
Nodes (65): ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), matches(), normalize() (+57 more)

### Community 5 - "admin.ts"
Cohesion: 0.09
Nodes (39): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+31 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (26): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+18 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.10
Nodes (38): dynamic, ImportMatchsPage(), maxDuration, submit(), dynamic, EditMatchPage(), deleteMatch(), toggleCancelled() (+30 more)

### Community 9 - "arbitres/[id]/page.tsx"
Cohesion: 0.14
Nodes (24): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+16 more)

### Community 10 - "referee-auth.ts"
Cohesion: 0.26
Nodes (13): dynamic, RefereeActivationPage(), activate(), activateRefereeAccount(), AuthResult, createPersonalLink(), findAuthUserId(), findByLicense() (+5 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 13 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, fluid, regions

### Community 18 - "schema.sql"
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 19 - "createClient"
Cohesion: 0.21
Nodes (13): dynamic, GET(), RefereeSpacePage(), changePassword(), logout(), saveAvailability(), LoginPage(), login() (+5 more)

### Community 20 - "designation-rules.ts"
Cohesion: 0.15
Nodes (12): dynamic, ReglementPage(), SEVERITY_LABEL, dayRange(), DESIGNATION_RULES, DesignationRule, MAX_PER_3_DAYS, MAX_PER_DAY (+4 more)

### Community 21 - "server.ts"
Cohesion: 0.22
Nodes (8): @supabase/ssr, SUPABASE_ANON_KEY, SUPABASE_URL, AUTH_ROUTES, config, REFEREE_PUBLIC_ROUTES, REFEREE_ROUTES, SELF_AUTH_API_ROUTES

### Community 22 - "connexion/page.tsx"
Cohesion: 0.47
Nodes (5): dynamic, RefereeLoginPage(), login(), findByEmail(), resolveLoginEmail()

## Knowledge Gaps
- **190 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 218 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `write.ts`, `matches.ts`, `getCurrentUser`, `nav.tsx`, `suggestions.ts`, `admin.ts`, `export/page.tsx`, `package.json`, `geocoding.ts`, `arbitres/[id]/page.tsx`, `referee-auth.ts`, `createClient`, `designation-rules.ts`, `server.ts`, `connexion/page.tsx`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05491268672417421 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `matches.ts`, `nav.tsx`, `suggestions.ts`, `admin.ts`, `export/page.tsx`, `geocoding.ts`, `arbitres/[id]/page.tsx`, `createClient`, `designation-rules.ts`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Should `matches.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054945054945054944 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `write.ts`, `matches.ts`, `getCurrentUser`, `suggestions.ts`, `geocoding.ts`, `arbitres/[id]/page.tsx`, `referee-auth.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `getCurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.061018437225636525 - nodes in this community are weakly interconnected._