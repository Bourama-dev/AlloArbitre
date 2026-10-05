# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 110 files · ~85,864 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 717 nodes · 1967 edges · 28 communities (21 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3f201bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- arbitres/[id]/page.tsx
- next
- write.ts
- createClient
- suggestions.ts
- espace/page.tsx
- stats.ts
- package.json
- geocoding.ts
- designation-rules.ts
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
- deleteUser
- arbitres/nouveau/page.tsx
- import-matches.ts
- matchs/nouveau/page.tsx
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
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `saveSettings()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/parametres/page.tsx → src/lib/current-user.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/espace/page.tsx → src/lib/supabase/server.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (28 total, 7 thin omitted)

### Community 0 - "arbitres/[id]/page.tsx"
Cohesion: 0.15
Nodes (22): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+14 more)

### Community 1 - "next"
Cohesion: 0.05
Nodes (68): nextConfig, next, react, dynamic, MultiDesignatePage(), dynamic, dynamic, FbiPage() (+60 more)

### Community 2 - "write.ts"
Cohesion: 0.05
Nodes (80): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+72 more)

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (35): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+27 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (75): ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), designate(), InfoText() (+67 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.08
Nodes (45): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+37 more)

### Community 6 - "stats.ts"
Cohesion: 0.09
Nodes (37): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+29 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.23
Nodes (16): geocode(), FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+8 more)

### Community 9 - "designation-rules.ts"
Cohesion: 0.18
Nodes (10): dynamic, ReglementPage(), SEVERITY_LABEL, DESIGNATION_RULES, DesignationRule, MAX_PER_3_DAYS, MAX_PER_DAY, MAX_PER_DAY_TQR (+2 more)

### Community 10 - "nav.tsx"
Cohesion: 0.10
Nodes (21): geistMono, geistSans, metadata, RootLayout(), viewport, AppNav(), AppNavLink, buzz() (+13 more)

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
Cohesion: 0.11
Nodes (26): dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, SettingsAdminPage(), saveSettings() (+18 more)

### Community 20 - "getCurrentUser"
Cohesion: 0.19
Nodes (19): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+11 more)

### Community 21 - "deleteUser"
Cohesion: 0.67
Nodes (3): back(), changeRole(), deleteUser()

### Community 22 - "arbitres/nouveau/page.tsx"
Cohesion: 0.50
Nodes (4): createReferee(), dynamic, NewRefereePage(), listRefereeLevels()

### Community 27 - "import-matches.ts"
Cohesion: 0.22
Nodes (12): dynamic, ImportMatchsPage(), maxDuration, submit(), excelDateToIso(), excelTimeToHm(), HEADER_ALIASES, importMatches() (+4 more)

### Community 31 - "matchs/nouveau/page.tsx"
Cohesion: 0.31
Nodes (9): EditMatchPage(), deleteMatch(), toggleCancelled(), updateMatch(), createMatch(), dynamic, geocodeAddress(), matchDurationMinutes() (+1 more)

### Community 35 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

## Knowledge Gaps
- **199 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 229 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `arbitres/[id]/page.tsx`, `write.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `package.json`, `designation-rules.ts`, `nav.tsx`, `current-user.ts`, `arbitres/nouveau/page.tsx`, `import-matches.ts`, `matchs/nouveau/page.tsx`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.05280875236692615 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `arbitres/[id]/page.tsx`, `next`, `write.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `geocoding.ts`, `designation-rules.ts`, `nav.tsx`, `current-user.ts`, `deleteUser`, `arbitres/nouveau/page.tsx`, `import-matches.ts`, `matchs/nouveau/page.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0516404581634634 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `arbitres/[id]/page.tsx`, `next`, `write.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `geocoding.ts`, `arbitres/nouveau/page.tsx`, `import-matches.ts`, `matchs/nouveau/page.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.0821256038647343 - nodes in this community are weakly interconnected._