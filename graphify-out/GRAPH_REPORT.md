# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 110 files · ~86,009 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 719 nodes · 1969 edges · 35 communities (27 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da55e11b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- arbitres/[id]/page.tsx
- fbi-match-row.tsx
- fbi-sync/route.ts
- createClient
- suggestions.ts
- espace/page.tsx
- stats.ts
- package.json
- geocoding.ts
- fbi/page.tsx
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- AlertToast
- getCurrentUser
- write.ts
- fetch.ts
- searchDesignations.ts
- disponibilites/[id]/page.tsx
- matchs/[id]/page.tsx
- FbiClient
- current-user.ts
- matchs/page.tsx
- matches.ts
- next
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
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `handlePreview()` --calls--> `previewAutoDesignation()`  [EXTRACTED]
  src/components/fbi-matches-panel.tsx → src/lib/actions/auto-designate-actions.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (35 total, 8 thin omitted)

### Community 0 - "arbitres/[id]/page.tsx"
Cohesion: 0.08
Nodes (37): dynamic, MultiDesignatePage(), dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), createReferee() (+29 more)

### Community 1 - "fbi-match-row.tsx"
Cohesion: 0.16
Nodes (17): react, ConflictBadge(), DesignateAction, FbiMatchRow(), presenceStyles, FbiMatchesPanel(), handleConfirm(), handlePreview() (+9 more)

### Community 2 - "fbi-sync/route.ts"
Cohesion: 0.15
Nodes (21): dynamic, GET(), maxDuration, readableError(), syncFbiOfficielsToDesignations(), FbiOfficiel, fbiSortKey(), fetchFbiRencontres() (+13 more)

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (36): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+28 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.07
Nodes (65): divisionPriorityRank(), PlanItem, previewAutoDesignation(), ageAt(), CommitteeSettings, divisionAgeCategory(), divisionReasons(), DivisionRules (+57 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.14
Nodes (21): AvailabilityPeriodsPage(), createPeriod(), dynamic, formatDay(), dynamic, One, RefereeSpacePage(), changePassword() (+13 more)

### Community 6 - "stats.ts"
Cohesion: 0.09
Nodes (38): dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata(), isCd45Level() (+30 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.09
Nodes (41): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), dynamic, EditMatchPage(), deleteMatch() (+33 more)

### Community 9 - "fbi/page.tsx"
Cohesion: 0.16
Nodes (17): dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay() (+9 more)

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

### Community 19 - "AlertToast"
Cohesion: 0.12
Nodes (20): react-dom, back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES (+12 more)

### Community 20 - "getCurrentUser"
Cohesion: 0.13
Nodes (24): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+16 more)

### Community 21 - "write.ts"
Cohesion: 0.22
Nodes (18): overlaps(), analyzeFbiDay(), assignRefereeToFbiRencontre(), checkFbiOfficielEligibility(), dayCache, DayData, deleteOfficielRow(), FbiAssignResult (+10 more)

### Community 22 - "fetch.ts"
Cohesion: 0.20
Nodes (16): dynamic, FbiRencontrePage(), maxDuration, presenceStyles, clean(), FbiRencontreDetail, FbiRencontreInfo, formDesignationFields() (+8 more)

### Community 24 - "searchDesignations.ts"
Cohesion: 0.20
Nodes (16): describe(), dynamic, GET(), maxDuration, Step, timed(), cellText(), DataTablesResponse (+8 more)

### Community 25 - "disponibilites/[id]/page.tsx"
Cohesion: 0.25
Nodes (16): AvailabilityPeriodPage(), clearRefereeAvailability(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, activeReferees(), announcementMessage() (+8 more)

### Community 27 - "matchs/[id]/page.tsx"
Cohesion: 0.20
Nodes (12): dynamic, MatchDetailPage(), labels, StatusBadge(), styles, matches(), normalize(), SuggestionsList() (+4 more)

### Community 28 - "FbiClient"
Cohesion: 0.21
Nodes (6): BodyMode, FbiClient, FbiDump, FetchedResponse, fetchWithRetry(), throttle()

### Community 29 - "current-user.ts"
Cohesion: 0.20
Nodes (10): dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic, CurrentReferee, CurrentUser (+2 more)

### Community 30 - "matchs/page.tsx"
Cohesion: 0.31
Nodes (9): dynamic, MatchesPage(), designate(), SwipeNav(), addWeeks(), formatDayMonthFr(), weekRange(), listActiveReferees() (+1 more)

### Community 31 - "matches.ts"
Cohesion: 0.17
Nodes (16): ControlsPage(), dynamic, PERIODS, dynamic, GymnaseJourneePage(), todayIso(), InfoText(), formatDateFr() (+8 more)

### Community 33 - "fbi-rencontre-row.tsx"
Cohesion: 0.33
Nodes (5): EtatBadge(), etatStyles, FbiRencontreRow(), presenceStyles, FbiDesignationRow

### Community 35 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

## Knowledge Gaps
- **201 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+196 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 231 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `arbitres/[id]/page.tsx`, `fbi-match-row.tsx`, `fbi-sync/route.ts`, `createClient`, `espace/page.tsx`, `stats.ts`, `package.json`, `geocoding.ts`, `fbi/page.tsx`, `nav.tsx`, `AlertToast`, `getCurrentUser`, `fetch.ts`, `searchDesignations.ts`, `disponibilites/[id]/page.tsx`, `matchs/[id]/page.tsx`, `current-user.ts`, `matchs/page.tsx`, `matches.ts`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _201 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `arbitres/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07955596669750231 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `arbitres/[id]/page.tsx`, `fbi-match-row.tsx`, `fbi-sync/route.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `geocoding.ts`, `fbi/page.tsx`, `nav.tsx`, `AlertToast`, `searchDesignations.ts`, `disponibilites/[id]/page.tsx`, `matchs/[id]/page.tsx`, `current-user.ts`, `matchs/page.tsx`, `matches.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.07955596669750231 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `arbitres/[id]/page.tsx`, `fbi-match-row.tsx`, `fbi-sync/route.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `geocoding.ts`, `AlertToast`, `disponibilites/[id]/page.tsx`, `matchs/[id]/page.tsx`, `matches.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07042253521126761 - nodes in this community are weakly interconnected._