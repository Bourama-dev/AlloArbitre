# Graph Report - AlloArbitre  (2026-10-08)

## Corpus Check
- 118 files · ~90,796 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 772 nodes · 2133 edges · 34 communities (27 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28dbd1ed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getCurrentUser
- dates.ts
- sync.ts
- createClient
- suggestions.ts
- utilisateurs/page.tsx
- stats.ts
- package.json
- geocoding.ts
- fbi-match-row.tsx
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
- fbi/page.tsx
- current-user.ts
- espace/page.tsx
- matches.ts
- import-matches.ts
- CheckboxPicker
- next
- gymnase/page.tsx
- react
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
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `handlePreview()` --calls--> `previewAutoDesignation()`  [EXTRACTED]
  src/components/fbi-matches-panel.tsx → src/lib/actions/auto-designate-actions.ts

## Import Cycles
- None detected.

## Communities (34 total, 7 thin omitted)

### Community 0 - "getCurrentUser"
Cohesion: 0.19
Nodes (19): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+11 more)

### Community 1 - "dates.ts"
Cohesion: 0.19
Nodes (13): dynamic, MatchesPage(), SwipeNav(), addWeeks(), formatDayMonthFr(), hasSchedulingConflict(), MatchSlot, overlaps() (+5 more)

### Community 2 - "sync.ts"
Cohesion: 0.36
Nodes (8): FbiDesignationRow, compareWithAlloArbitre(), FbiMismatch, matchesFbiRow(), MatchRow, normalize(), parseFbiDateTime(), teamNamesMatch()

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (36): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+28 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (70): dynamic, MatchDetailPage(), designate(), designate(), matches(), normalize(), SuggestionsList(), renderRow() (+62 more)

### Community 5 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

### Community 6 - "stats.ts"
Cohesion: 0.09
Nodes (37): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+29 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.23
Nodes (16): geocode(), FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+8 more)

### Community 9 - "fbi-match-row.tsx"
Cohesion: 0.17
Nodes (16): ConflictBadge(), DesignateAction, FbiMatchRow(), presenceStyles, MatchesTable(), PushToFbiButton(), STATUS_STYLE, labels (+8 more)

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
Cohesion: 0.15
Nodes (23): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "DesignationRule", "LevelMapping" (+15 more)

### Community 19 - "referees.ts"
Cohesion: 0.16
Nodes (20): RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso(), addPunctualUnavailability() (+12 more)

### Community 20 - "matchs/nouveau/page.tsx"
Cohesion: 0.21
Nodes (14): EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), EditMatchPage(), deleteMatch(), toggleCancelled(), updateMatch() (+6 more)

### Community 21 - "write.ts"
Cohesion: 0.05
Nodes (75): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+67 more)

### Community 22 - "fbi/page.tsx"
Cohesion: 0.14
Nodes (19): dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay() (+11 more)

### Community 24 - "current-user.ts"
Cohesion: 0.14
Nodes (19): dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, dynamic, dynamic (+11 more)

### Community 25 - "espace/page.tsx"
Cohesion: 0.08
Nodes (46): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+38 more)

### Community 27 - "matches.ts"
Cohesion: 0.23
Nodes (13): dynamic, MultiDesignatePage(), MultiDesignatePanel(), handleSubmit(), applyRefereeToMatches(), ownClubMessage(), isLaterMatchSameVenueSameDay(), annotateDesignationConflicts() (+5 more)

### Community 28 - "import-matches.ts"
Cohesion: 0.22
Nodes (12): dynamic, ImportMatchsPage(), maxDuration, submit(), excelDateToIso(), excelTimeToHm(), HEADER_ALIASES, importMatches() (+4 more)

### Community 29 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 30 - "next"
Cohesion: 0.19
Nodes (5): nextConfig, next, dynamic, dynamic, SubmitButton()

### Community 31 - "gymnase/page.tsx"
Cohesion: 0.27
Nodes (9): ControlsPage(), dynamic, PERIODS, dynamic, GymnaseJourneePage(), todayIso(), InfoText(), formatDateFr() (+1 more)

### Community 32 - "react"
Cohesion: 0.43
Nodes (5): react, react-dom, ConfirmModal(), ConflictConfirm(), GroupChoices()

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (45): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+37 more)

## Knowledge Gaps
- **210 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+205 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 241 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `dates.ts`, `createClient`, `suggestions.ts`, `utilisateurs/page.tsx`, `stats.ts`, `package.json`, `fbi-match-row.tsx`, `nav.tsx`, `referees.ts`, `matchs/nouveau/page.tsx`, `write.ts`, `fbi/page.tsx`, `current-user.ts`, `espace/page.tsx`, `matches.ts`, `import-matches.ts`, `gymnase/page.tsx`, `react`, `designation-rules.ts`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _210 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.07955596669750231 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `dates.ts`, `createClient`, `suggestions.ts`, `utilisateurs/page.tsx`, `stats.ts`, `geocoding.ts`, `fbi-match-row.tsx`, `nav.tsx`, `referees.ts`, `matchs/nouveau/page.tsx`, `write.ts`, `fbi/page.tsx`, `current-user.ts`, `espace/page.tsx`, `matches.ts`, `import-matches.ts`, `next`, `gymnase/page.tsx`, `designation-rules.ts`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06358024691358025 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `dates.ts`, `sync.ts`, `designation-rules.ts`, `suggestions.ts`, `utilisateurs/page.tsx`, `createClient`, `stats.ts`, `geocoding.ts`, `fbi-match-row.tsx`, `referees.ts`, `matchs/nouveau/page.tsx`, `write.ts`, `espace/page.tsx`, `matches.ts`, `import-matches.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `stats.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0859465737514518 - nodes in this community are weakly interconnected._