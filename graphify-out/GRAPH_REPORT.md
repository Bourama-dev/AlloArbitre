# Graph Report - AlloArbitre  (2026-10-07)

## Corpus Check
- 113 files · ~87,152 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 728 nodes · 1996 edges · 31 communities (24 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5b39ae0c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getCurrentUser
- next
- import.ts
- createClient
- suggestions.ts
- utilisateurs/page.tsx
- export/page.tsx
- package.json
- geocoding.ts
- fbi/page.tsx
- react
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- designer/page.tsx
- AlertToast
- write.ts
- matches.ts
- admin.ts
- current-user.ts
- conflict-confirm.tsx
- dates.ts
- auto-designate-actions.ts
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 93 edges
2. `next` - 51 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `evaluateMatchCandidates()` - 22 edges
9. `react` - 21 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
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

## Communities (31 total, 7 thin omitted)

### Community 0 - "getCurrentUser"
Cohesion: 0.19
Nodes (19): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+11 more)

### Community 1 - "next"
Cohesion: 0.13
Nodes (12): nextConfig, next, ConflictBadge(), DesignateAction, presenceStyles, PushToFbiButton(), STATUS_STYLE, labels (+4 more)

### Community 2 - "import.ts"
Cohesion: 0.26
Nodes (13): FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), FbiDesignationRow, compareWithAlloArbitre(), FbiMismatch, matchesFbiRow() (+5 more)

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (35): @supabase/ssr, dynamic, GET(), changePassword(), dynamic, RefereeActivationPage(), activate(), dynamic (+27 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (75): dynamic, MatchDetailPage(), designate(), matches(), normalize(), SuggestionsList(), renderRow(), ageAt() (+67 more)

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
Cohesion: 0.14
Nodes (23): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+15 more)

### Community 9 - "fbi/page.tsx"
Cohesion: 0.14
Nodes (19): dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay() (+11 more)

### Community 10 - "react"
Cohesion: 0.08
Nodes (25): react, geistMono, geistSans, metadata, RootLayout(), viewport, AppNav(), AppNavLink (+17 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 19 - "designer/page.tsx"
Cohesion: 0.27
Nodes (9): dynamic, MultiDesignatePage(), MultiDesignatePanel(), handleSubmit(), applyRefereeToMatches(), AutoDesignateSummary, MatchSort, MatchWithRelations (+1 more)

### Community 20 - "AlertToast"
Cohesion: 0.15
Nodes (25): dynamic, EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), dynamic, NewRefereePage(), ComptePage() (+17 more)

### Community 21 - "write.ts"
Cohesion: 0.05
Nodes (77): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+69 more)

### Community 22 - "matches.ts"
Cohesion: 0.31
Nodes (8): dynamic, GymnaseJourneePage(), todayIso(), formatDateFr(), ActiveReferee, computeMinReferees(), findMatches(), mapMatch()

### Community 24 - "admin.ts"
Cohesion: 0.32
Nodes (5): CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, supabaseAdmin

### Community 25 - "current-user.ts"
Cohesion: 0.05
Nodes (73): dynamic, GroupRow, dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic (+65 more)

### Community 27 - "conflict-confirm.tsx"
Cohesion: 0.60
Nodes (3): react-dom, ConfirmModal(), ConflictConfirm()

### Community 30 - "dates.ts"
Cohesion: 0.22
Nodes (12): dynamic, MatchesPage(), designate(), MatchesTable(), SwipeNav(), addWeeks(), formatDayMonthFr(), MatchSlot (+4 more)

### Community 31 - "auto-designate-actions.ts"
Cohesion: 0.19
Nodes (12): ControlsPage(), dynamic, PERIODS, handlePreview(), InfoText(), divisionPriorityRank(), PlanItem, previewAutoDesignation() (+4 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.15
Nodes (12): dynamic, ReglementPage(), SEVERITY_LABEL, dayRange(), DESIGNATION_RULES, DesignationRule, MAX_PER_3_DAYS, MAX_PER_DAY (+4 more)

## Knowledge Gaps
- **202 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+197 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 233 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `suggestions.ts`, `utilisateurs/page.tsx`, `export/page.tsx`, `package.json`, `geocoding.ts`, `fbi/page.tsx`, `react`, `designation-rules.ts`, `designer/page.tsx`, `AlertToast`, `write.ts`, `matches.ts`, `admin.ts`, `current-user.ts`, `conflict-confirm.tsx`, `dates.ts`, `auto-designate-actions.ts`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _202 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `next`, `createClient`, `suggestions.ts`, `utilisateurs/page.tsx`, `export/page.tsx`, `designation-rules.ts`, `geocoding.ts`, `fbi/page.tsx`, `react`, `designer/page.tsx`, `AlertToast`, `write.ts`, `matches.ts`, `admin.ts`, `current-user.ts`, `dates.ts`, `auto-designate-actions.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.08115942028985507 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `next`, `import.ts`, `createClient`, `suggestions.ts`, `utilisateurs/page.tsx`, `geocoding.ts`, `AlertToast`, `write.ts`, `matches.ts`, `current-user.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06134453781512605 - nodes in this community are weakly interconnected._