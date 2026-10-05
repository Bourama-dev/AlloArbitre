# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 110 files · ~85,783 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 716 nodes · 1958 edges · 36 communities (29 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2bdc6683`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- fetch.ts
- next
- write.ts
- referee-auth.ts
- suggestions.ts
- espace/page.tsx
- stats.ts
- package.json
- geocoding.ts
- searchDesignations.ts
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- current-user.ts
- getCurrentUser
- FbiClient
- arbitres/[id]/modifier/page.tsx
- push.ts
- gymnase/page.tsx
- import-matches.ts
- server.ts
- createClient
- AlertToast
- matchs/nouveau/page.tsx
- fbi-sync/route.ts
- layout.tsx
- fbi-rencontre-row.tsx
- CheckboxPicker

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 93 edges
2. `next` - 50 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `evaluateMatchCandidates()` - 22 edges
9. `react` - 19 edges
10. `AvailabilityPeriodPage()` - 18 edges

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

## Communities (36 total, 7 thin omitted)

### Community 0 - "fetch.ts"
Cohesion: 0.16
Nodes (19): cheerio, dynamic, FbiRencontrePage(), maxDuration, presenceStyles, clean(), FbiOfficiel, FbiRencontreInfo (+11 more)

### Community 1 - "next"
Cohesion: 0.06
Nodes (57): nextConfig, next, react, dynamic, MultiDesignatePage(), dynamic, dynamic, FbiPage() (+49 more)

### Community 2 - "write.ts"
Cohesion: 0.20
Nodes (20): overlaps(), FbiExportRow, analyzeFbiDay(), assignRefereeToFbiRencontre(), dayCache, DayData, deleteOfficielRow(), FbiAlreadyDesignatedError (+12 more)

### Community 3 - "referee-auth.ts"
Cohesion: 0.19
Nodes (18): dynamic, RefereeActivationPage(), activate(), dynamic, RefereeLoginPage(), login(), activateRefereeAccount(), AuthResult (+10 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (83): ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), matches(), normalize() (+75 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.06
Nodes (66): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+58 more)

### Community 6 - "stats.ts"
Cohesion: 0.09
Nodes (35): dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata(), isCd45Level() (+27 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.23
Nodes (16): geocode(), FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+8 more)

### Community 9 - "searchDesignations.ts"
Cohesion: 0.22
Nodes (13): describe(), dynamic, GET(), maxDuration, Step, timed(), cellText(), DataTablesResponse (+5 more)

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
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 19 - "current-user.ts"
Cohesion: 0.13
Nodes (19): dynamic, GroupRow, back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role (+11 more)

### Community 20 - "getCurrentUser"
Cohesion: 0.16
Nodes (20): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+12 more)

### Community 21 - "FbiClient"
Cohesion: 0.25
Nodes (4): FbiClient, FbiDump, fetchWithRetry(), throttle()

### Community 22 - "arbitres/[id]/modifier/page.tsx"
Cohesion: 0.29
Nodes (9): dynamic, EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), dynamic, NewRefereePage(), geocodeAddress() (+1 more)

### Community 24 - "push.ts"
Cohesion: 0.24
Nodes (13): formatDateFr(), FbiPushPositionResult, MatchForPush, pushMatchToFbi(), pushOnePosition(), resolveFbiIdRencontre(), compareWithAlloArbitre(), FbiMismatch (+5 more)

### Community 25 - "gymnase/page.tsx"
Cohesion: 0.43
Nodes (6): dynamic, GymnaseJourneePage(), todayIso(), InfoText(), formatDateFr(), computeMinReferees()

### Community 27 - "import-matches.ts"
Cohesion: 0.22
Nodes (12): dynamic, ImportMatchsPage(), maxDuration, submit(), excelDateToIso(), excelTimeToHm(), HEADER_ALIASES, importMatches() (+4 more)

### Community 28 - "server.ts"
Cohesion: 0.22
Nodes (8): @supabase/ssr, SUPABASE_ANON_KEY, SUPABASE_URL, AUTH_ROUTES, config, REFEREE_PUBLIC_ROUTES, REFEREE_ROUTES, SELF_AUTH_API_ROUTES

### Community 29 - "createClient"
Cohesion: 0.23
Nodes (10): dynamic, GET(), ComptePage(), changePassword(), logout(), LoginPage(), login(), SignupPage() (+2 more)

### Community 30 - "AlertToast"
Cohesion: 0.21
Nodes (9): CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, SettingsAdminPage(), saveSettings(), AlertToast(), Variant (+1 more)

### Community 31 - "matchs/nouveau/page.tsx"
Cohesion: 0.29
Nodes (9): EditMatchPage(), deleteMatch(), toggleCancelled(), updateMatch(), createMatch(), dynamic, NewMatchPage(), matchDurationMinutes() (+1 more)

### Community 32 - "fbi-sync/route.ts"
Cohesion: 0.39
Nodes (8): dynamic, GET(), maxDuration, readableError(), syncFbiOfficielsToDesignations(), fetchDesignationsExport(), fetchDesignationsExportRows(), checkFbiOfficielEligibility()

### Community 33 - "layout.tsx"
Cohesion: 0.25
Nodes (7): geistMono, geistSans, metadata, RootLayout(), viewport, Nav(), logout()

### Community 34 - "fbi-rencontre-row.tsx"
Cohesion: 0.29
Nodes (6): EtatBadge(), etatStyles, FbiRencontreRow(), presenceStyles, FbiRencontreDetail, FbiDesignationRow

### Community 35 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

## Knowledge Gaps
- **199 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 229 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `fetch.ts`, `referee-auth.ts`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `package.json`, `searchDesignations.ts`, `nav.tsx`, `current-user.ts`, `getCurrentUser`, `arbitres/[id]/modifier/page.tsx`, `gymnase/page.tsx`, `import-matches.ts`, `server.ts`, `createClient`, `AlertToast`, `matchs/nouveau/page.tsx`, `fbi-sync/route.ts`, `layout.tsx`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.056910569105691054 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `fbi-sync/route.ts`, `next`, `layout.tsx`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `geocoding.ts`, `searchDesignations.ts`, `current-user.ts`, `arbitres/[id]/modifier/page.tsx`, `gymnase/page.tsx`, `import-matches.ts`, `createClient`, `AlertToast`, `matchs/nouveau/page.tsx`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05575426046707343 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `fbi-sync/route.ts`, `next`, `fetch.ts`, `referee-auth.ts`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `geocoding.ts`, `arbitres/[id]/modifier/page.tsx`, `push.ts`, `import-matches.ts`, `AlertToast`, `matchs/nouveau/page.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `espace/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05740740740740741 - nodes in this community are weakly interconnected._