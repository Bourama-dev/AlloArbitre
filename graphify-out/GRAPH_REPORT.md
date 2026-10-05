# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 110 files · ~86,198 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 720 nodes · 1971 edges · 38 communities (30 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `faaddcbf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- referees.ts
- fbi-match-row.tsx
- fbi-sync/route.ts
- referee-auth.ts
- suggestions.ts
- current-user.ts
- export/page.tsx
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
- matches.ts
- getCurrentUser
- write.ts
- fetch.ts
- searchDesignations.ts
- disponibilites/[id]/page.tsx
- server.ts
- FbiClient
- arbitres/[id]/page.tsx
- matchs/page.tsx
- dates.ts
- next
- fbi-rencontre-row.tsx
- createClient
- designation-rules.ts
- client.ts
- FbiMatchesPanel

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
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `handlePreview()` --calls--> `previewAutoDesignation()`  [EXTRACTED]
  src/components/fbi-matches-panel.tsx → src/lib/actions/auto-designate-actions.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `createGroup()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/groupes/page.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (38 total, 8 thin omitted)

### Community 0 - "referees.ts"
Cohesion: 0.27
Nodes (11): dynamic, RefereesPage(), todayIso(), computeUnavailableRefereeIds(), listRefereesWithLoad(), listZones(), RawReferee, RefereeAvailabilityFilter (+3 more)

### Community 1 - "fbi-match-row.tsx"
Cohesion: 0.16
Nodes (19): react, ConflictBadge(), DesignateAction, FbiMatchRow(), presenceStyles, MatchesTable(), PushToFbiButton(), STATUS_STYLE (+11 more)

### Community 2 - "fbi-sync/route.ts"
Cohesion: 0.17
Nodes (19): dynamic, GET(), maxDuration, readableError(), syncFbiOfficielsToDesignations(), FbiOfficiel, formatDateFr(), FbiPushPositionResult (+11 more)

### Community 3 - "referee-auth.ts"
Cohesion: 0.19
Nodes (18): dynamic, RefereeActivationPage(), activate(), dynamic, RefereeLoginPage(), login(), activateRefereeAccount(), AuthResult (+10 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (80): dynamic, MatchDetailPage(), handleSubmit(), matches(), normalize(), SuggestionsList(), renderRow(), applyRefereeToMatches() (+72 more)

### Community 5 - "current-user.ts"
Cohesion: 0.21
Nodes (14): dynamic, One, RefereeSpacePage(), changePassword(), saveAvailability(), mapPeriod(), CurrentReferee, CurrentUser (+6 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (26): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+18 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.13
Nodes (28): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords() (+20 more)

### Community 9 - "fbi/page.tsx"
Cohesion: 0.18
Nodes (15): dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay() (+7 more)

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

### Community 19 - "matches.ts"
Cohesion: 0.24
Nodes (10): dynamic, MultiDesignatePage(), dynamic, NewMatchPage(), MultiDesignatePanel(), MatchSlot, findMatches(), listCompetitionLevels() (+2 more)

### Community 20 - "getCurrentUser"
Cohesion: 0.05
Nodes (65): dynamic, GroupRow, GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow (+57 more)

### Community 21 - "write.ts"
Cohesion: 0.20
Nodes (20): overlaps(), analyzeFbiDay(), assignRefereeToFbiRencontre(), checkFbiOfficielEligibility(), dayCache, DayData, deleteOfficielRow(), FbiAlreadyDesignatedError (+12 more)

### Community 22 - "fetch.ts"
Cohesion: 0.19
Nodes (18): dynamic, FbiRencontrePage(), maxDuration, presenceStyles, clean(), FbiRencontreDetail, FbiRencontreInfo, formDesignationFields() (+10 more)

### Community 24 - "searchDesignations.ts"
Cohesion: 0.20
Nodes (15): describe(), dynamic, GET(), maxDuration, Step, timed(), cellText(), DataTablesResponse (+7 more)

### Community 25 - "disponibilites/[id]/page.tsx"
Cohesion: 0.09
Nodes (36): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+28 more)

### Community 27 - "server.ts"
Cohesion: 0.22
Nodes (8): @supabase/ssr, SUPABASE_ANON_KEY, SUPABASE_URL, AUTH_ROUTES, config, REFEREE_PUBLIC_ROUTES, REFEREE_ROUTES, SELF_AUTH_API_ROUTES

### Community 29 - "arbitres/[id]/page.tsx"
Cohesion: 0.31
Nodes (10): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), addPunctualUnavailability(), addRecurringUnavailability(), getRefereeSheet() (+2 more)

### Community 30 - "matchs/page.tsx"
Cohesion: 0.31
Nodes (9): dynamic, MatchesPage(), designate(), SwipeNav(), addWeeks(), formatDayMonthFr(), weekRange(), listActiveReferees() (+1 more)

### Community 31 - "dates.ts"
Cohesion: 0.22
Nodes (10): ControlsPage(), dynamic, PERIODS, dynamic, GymnaseJourneePage(), todayIso(), InfoText(), formatDateFr() (+2 more)

### Community 32 - "next"
Cohesion: 0.22
Nodes (3): nextConfig, next, dynamic

### Community 33 - "fbi-rencontre-row.tsx"
Cohesion: 0.33
Nodes (5): EtatBadge(), etatStyles, FbiRencontreRow(), presenceStyles, FbiDesignationRow

### Community 34 - "createClient"
Cohesion: 0.27
Nodes (8): dynamic, GET(), logout(), LoginPage(), login(), SignupPage(), signup(), createClient()

### Community 35 - "designation-rules.ts"
Cohesion: 0.22
Nodes (8): dayRange(), DesignationRule, MAX_PER_3_DAYS, MAX_PER_DAY, MAX_PER_DAY_TQR, RuleSeverity, RuleViolation, weekendRange()

### Community 36 - "client.ts"
Cohesion: 0.38
Nodes (6): BodyMode, cooldownError(), FbiDump, FetchedResponse, fetchWithRetry(), throttle()

### Community 37 - "FbiMatchesPanel"
Cohesion: 0.50
Nodes (4): FbiMatchesPanel(), handleConfirm(), handlePreview(), applyAutoDesignation()

## Knowledge Gaps
- **201 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+196 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 231 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `referees.ts`, `fbi-match-row.tsx`, `fbi-sync/route.ts`, `referee-auth.ts`, `suggestions.ts`, `current-user.ts`, `export/page.tsx`, `package.json`, `geocoding.ts`, `fbi/page.tsx`, `nav.tsx`, `matches.ts`, `getCurrentUser`, `fetch.ts`, `searchDesignations.ts`, `disponibilites/[id]/page.tsx`, `server.ts`, `arbitres/[id]/page.tsx`, `matchs/page.tsx`, `dates.ts`, `createClient`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _201 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06056166056166056 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `next`, `fbi-match-row.tsx`, `fbi-sync/route.ts`, `suggestions.ts`, `FbiMatchesPanel`, `export/page.tsx`, `current-user.ts`, `geocoding.ts`, `fbi/page.tsx`, `nav.tsx`, `matches.ts`, `searchDesignations.ts`, `disponibilites/[id]/page.tsx`, `arbitres/[id]/page.tsx`, `matchs/page.tsx`, `dates.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `export/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `suggestions.ts` to `referees.ts`, `fbi-match-row.tsx`, `fbi-sync/route.ts`, `referee-auth.ts`, `current-user.ts`, `geocoding.ts`, `matches.ts`, `getCurrentUser`, `disponibilites/[id]/page.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._