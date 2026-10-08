# Graph Report - AlloArbitre  (2026-10-08)

## Corpus Check
- 118 files · ~90,517 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 769 nodes · 2113 edges · 38 communities (29 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4cd7cc3d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getCurrentUser
- write.ts
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
- arbitres/[id]/page.tsx
- matches.ts
- fetch.ts
- fbi/page.tsx
- AlertToast
- espace/page.tsx
- current-user.ts
- import-matches.ts
- CheckboxPicker
- next
- auto-designate-actions.ts
- fbi-sync/route.ts
- dates.ts
- searchDesignations.ts
- designation-rules.ts
- FbiClient
- client.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 91 edges
2. `next` - 52 edges
3. `supabaseAdmin` - 34 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 29 edges
6. `SubmitButton()` - 28 edges
7. `createClient()` - 27 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 21 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `GroupsAdminPage()` --calls--> `AlertToast()`  [EXTRACTED]
  src/app/admin/groupes/page.tsx → src/components/alert-toast.tsx
- `GroupsAdminPage()` --calls--> `CheckboxPicker()`  [EXTRACTED]
  src/app/admin/groupes/page.tsx → src/components/checkbox-picker.tsx

## Import Cycles
- None detected.

## Communities (38 total, 9 thin omitted)

### Community 0 - "getCurrentUser"
Cohesion: 0.16
Nodes (23): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+15 more)

### Community 1 - "write.ts"
Cohesion: 0.20
Nodes (20): overlaps(), FbiExportRow, analyzeFbiDay(), assignRefereeToFbiRencontre(), dayCache, DayData, deleteOfficielRow(), FbiAlreadyDesignatedError (+12 more)

### Community 2 - "sync.ts"
Cohesion: 0.43
Nodes (7): compareWithAlloArbitre(), FbiMismatch, matchesFbiRow(), MatchRow, normalize(), parseFbiDateTime(), teamNamesMatch()

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (36): @supabase/ssr, dynamic, GET(), changePassword(), dynamic, RefereeActivationPage(), activate(), dynamic (+28 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (63): MatchDetailPage(), designate(), designate(), matches(), normalize(), SuggestionsList(), renderRow(), ageAt() (+55 more)

### Community 5 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

### Community 6 - "stats.ts"
Cohesion: 0.08
Nodes (38): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+30 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.25
Nodes (16): FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary, cleanPlaceName() (+8 more)

### Community 9 - "fbi-match-row.tsx"
Cohesion: 0.15
Nodes (18): react, ConfirmModal(), ConflictBadge(), ConflictConfirm(), DesignateAction, FbiMatchRow(), presenceStyles, GroupChoices() (+10 more)

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

### Community 19 - "arbitres/[id]/page.tsx"
Cohesion: 0.15
Nodes (23): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+15 more)

### Community 20 - "matches.ts"
Cohesion: 0.20
Nodes (14): dynamic, MultiDesignatePage(), dynamic, GymnaseJourneePage(), todayIso(), MultiDesignatePanel(), handleSubmit(), applyRefereeToMatches() (+6 more)

### Community 21 - "fetch.ts"
Cohesion: 0.13
Nodes (22): cheerio, dynamic, FbiRencontrePage(), maxDuration, presenceStyles, EtatBadge(), etatStyles, FbiRencontreRow() (+14 more)

### Community 22 - "fbi/page.tsx"
Cohesion: 0.16
Nodes (17): dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay() (+9 more)

### Community 24 - "AlertToast"
Cohesion: 0.17
Nodes (18): dynamic, EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), dynamic, NewRefereePage(), ComptePage() (+10 more)

### Community 25 - "espace/page.tsx"
Cohesion: 0.09
Nodes (42): AvailabilityPeriodPage(), clearRefereeAvailability(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage(), createPeriod() (+34 more)

### Community 27 - "current-user.ts"
Cohesion: 0.17
Nodes (12): dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, CurrentReferee, CurrentUser (+4 more)

### Community 28 - "import-matches.ts"
Cohesion: 0.20
Nodes (13): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), excelDateToIso(), excelTimeToHm(), HEADER_ALIASES (+5 more)

### Community 29 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 31 - "auto-designate-actions.ts"
Cohesion: 0.18
Nodes (14): ControlsPage(), dynamic, PERIODS, FbiMatchesPanel(), handleConfirm(), handlePreview(), applyAutoDesignation(), AutoDesignateSummary (+6 more)

### Community 32 - "fbi-sync/route.ts"
Cohesion: 0.25
Nodes (14): dynamic, GET(), maxDuration, readableError(), fetchFbiRencontres(), formatDateFr(), withFbiSession(), FbiPushPositionResult (+6 more)

### Community 33 - "dates.ts"
Cohesion: 0.23
Nodes (11): dynamic, MatchesPage(), CollapsibleFilters(), SwipeNav(), addWeeks(), formatDayMonthFr(), MatchSlot, PRE_MATCH_PRESENCE_MINUTES (+3 more)

### Community 34 - "searchDesignations.ts"
Cohesion: 0.22
Nodes (13): describe(), dynamic, GET(), maxDuration, Step, timed(), cellText(), DataTablesResponse (+5 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.07
Nodes (48): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+40 more)

### Community 37 - "client.ts"
Cohesion: 0.38
Nodes (6): BodyMode, cooldownError(), FbiDump, FetchedResponse, fetchWithRetry(), throttle()

## Knowledge Gaps
- **207 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+202 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 240 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `createClient`, `suggestions.ts`, `utilisateurs/page.tsx`, `stats.ts`, `package.json`, `fbi-match-row.tsx`, `nav.tsx`, `arbitres/[id]/page.tsx`, `matches.ts`, `fetch.ts`, `fbi/page.tsx`, `AlertToast`, `espace/page.tsx`, `current-user.ts`, `import-matches.ts`, `auto-designate-actions.ts`, `fbi-sync/route.ts`, `dates.ts`, `searchDesignations.ts`, `designation-rules.ts`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _207 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.0786308973172988 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `fbi-sync/route.ts`, `dates.ts`, `searchDesignations.ts`, `createClient`, `suggestions.ts`, `utilisateurs/page.tsx`, `stats.ts`, `designation-rules.ts`, `fbi-match-row.tsx`, `nav.tsx`, `arbitres/[id]/page.tsx`, `matches.ts`, `fbi/page.tsx`, `AlertToast`, `espace/page.tsx`, `current-user.ts`, `import-matches.ts`, `auto-designate-actions.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06277665995975855 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `fbi-sync/route.ts`, `sync.ts`, `designation-rules.ts`, `suggestions.ts`, `utilisateurs/page.tsx`, `createClient`, `stats.ts`, `geocoding.ts`, `arbitres/[id]/page.tsx`, `matches.ts`, `AlertToast`, `espace/page.tsx`, `import-matches.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `stats.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08416389811738649 - nodes in this community are weakly interconnected._