# Graph Report - AlloArbitre  (2026-10-08)

## Corpus Check
- 118 files · ~90,749 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 771 nodes · 2132 edges · 32 communities (24 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92c43429`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getCurrentUser
- createClient
- sync.ts
- referee-auth.ts
- suggestions.ts
- utilisateurs/page.tsx
- export/page.tsx
- package.json
- geocoding.ts
- matches.ts
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- referees.ts
- matchs/nouveau/page.tsx
- write.ts
- server.ts
- current-user.ts
- espace/page.tsx
- layout.tsx
- import-matches.ts
- CheckboxPicker
- next
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 96 edges
2. `next` - 52 edges
3. `supabaseAdmin` - 35 edges
4. `AlertToast()` - 31 edges
5. `designateReferee()` - 29 edges
6. `SubmitButton()` - 28 edges
7. `createClient()` - 27 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 21 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `saveSettings()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/parametres/page.tsx → src/lib/current-user.ts
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (32 total, 8 thin omitted)

### Community 0 - "getCurrentUser"
Cohesion: 0.23
Nodes (16): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+8 more)

### Community 1 - "createClient"
Cohesion: 0.20
Nodes (11): dynamic, GET(), ComptePage(), changePassword(), dynamic, logout(), LoginPage(), login() (+3 more)

### Community 2 - "sync.ts"
Cohesion: 0.36
Nodes (8): FbiDesignationRow, compareWithAlloArbitre(), FbiMismatch, matchesFbiRow(), MatchRow, normalize(), parseFbiDateTime(), teamNamesMatch()

### Community 3 - "referee-auth.ts"
Cohesion: 0.19
Nodes (18): dynamic, RefereeActivationPage(), activate(), dynamic, RefereeLoginPage(), login(), activateRefereeAccount(), AuthResult (+10 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.05
Nodes (77): dynamic, SettingsAdminPage(), saveSettings(), ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage() (+69 more)

### Community 5 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (26): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+18 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.25
Nodes (15): FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary, cleanPlaceName() (+7 more)

### Community 9 - "matches.ts"
Cohesion: 0.05
Nodes (67): react, react-dom, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES (+59 more)

### Community 10 - "nav.tsx"
Cohesion: 0.14
Nodes (14): AppNav(), AppNavLink, buzz(), isActive(), Props, adminLinks, NavIcon(), NavIconName (+6 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.15
Nodes (23): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "DesignationRule", "LevelMapping" (+15 more)

### Community 19 - "referees.ts"
Cohesion: 0.26
Nodes (12): dynamic, RefereesPage(), todayIso(), computeUnavailableRefereeIds(), listRefereeLevels(), listRefereesWithLoad(), listZones(), RawReferee (+4 more)

### Community 20 - "matchs/nouveau/page.tsx"
Cohesion: 0.21
Nodes (14): EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), EditMatchPage(), deleteMatch(), toggleCancelled(), updateMatch() (+6 more)

### Community 21 - "write.ts"
Cohesion: 0.05
Nodes (79): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+71 more)

### Community 22 - "server.ts"
Cohesion: 0.22
Nodes (8): @supabase/ssr, SUPABASE_ANON_KEY, SUPABASE_URL, AUTH_ROUTES, config, REFEREE_PUBLIC_ROUTES, REFEREE_ROUTES, SELF_AUTH_API_ROUTES

### Community 24 - "current-user.ts"
Cohesion: 0.15
Nodes (18): dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, dynamic, NewRefereePage() (+10 more)

### Community 25 - "espace/page.tsx"
Cohesion: 0.06
Nodes (66): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod() (+58 more)

### Community 27 - "layout.tsx"
Cohesion: 0.25
Nodes (7): geistMono, geistSans, metadata, RootLayout(), viewport, Nav(), logout()

### Community 28 - "import-matches.ts"
Cohesion: 0.20
Nodes (13): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), excelDateToIso(), excelTimeToHm(), HEADER_ALIASES (+5 more)

### Community 29 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (46): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+38 more)

## Knowledge Gaps
- **209 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 240 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `designation-rules.ts`, `suggestions.ts`, `utilisateurs/page.tsx`, `export/page.tsx`, `package.json`, `referee-auth.ts`, `matches.ts`, `nav.tsx`, `referees.ts`, `matchs/nouveau/page.tsx`, `write.ts`, `server.ts`, `current-user.ts`, `espace/page.tsx`, `layout.tsx`, `import-matches.ts`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05445665445665446 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `createClient`, `designation-rules.ts`, `suggestions.ts`, `utilisateurs/page.tsx`, `export/page.tsx`, `matches.ts`, `matchs/nouveau/page.tsx`, `write.ts`, `current-user.ts`, `espace/page.tsx`, `layout.tsx`, `import-matches.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `export/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `sync.ts`, `designation-rules.ts`, `suggestions.ts`, `utilisateurs/page.tsx`, `referee-auth.ts`, `geocoding.ts`, `matches.ts`, `referees.ts`, `matchs/nouveau/page.tsx`, `write.ts`, `espace/page.tsx`, `import-matches.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._