# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 108 files · ~85,305 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 711 nodes · 1929 edges · 28 communities (21 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4386105b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- write.ts
- fbi-match-row.tsx
- fbi/page.tsx
- createClient
- suggestions.ts
- current-user.ts
- export/page.tsx
- package.json
- admin.ts
- matches.ts
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- getCurrentUser
- designation-rules.ts
- designer/page.tsx
- arbitres/[id]/page.tsx
- matchs/page.tsx
- dates.ts
- next

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 93 edges
2. `next` - 50 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `evaluateMatchCandidates()` - 22 edges
9. `react` - 18 edges
10. `AvailabilityPeriodPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/espace/page.tsx → src/lib/supabase/server.ts
- `ReglementPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/reglement/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx

## Import Cycles
- None detected.

## Communities (28 total, 7 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (74): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+66 more)

### Community 1 - "fbi-match-row.tsx"
Cohesion: 0.19
Nodes (13): react, dynamic, ConflictBadge(), DesignateState, FbiMatchRow(), presenceStyles, MatchesTable(), PushToFbiButton() (+5 more)

### Community 2 - "fbi/page.tsx"
Cohesion: 0.21
Nodes (14): dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay() (+6 more)

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (35): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+27 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (78): dynamic, GET(), maxDuration, MatchDetailPage(), designate(), FbiMatchesPanel(), handleConfirm(), handlePreview() (+70 more)

### Community 5 - "current-user.ts"
Cohesion: 0.08
Nodes (47): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+39 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.15
Nodes (23): dynamic, ExportPage(), fmtDay(), generateMetadata(), isCd45Level(), levelClass(), matchTime(), Params (+15 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "admin.ts"
Cohesion: 0.10
Nodes (37): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords() (+29 more)

### Community 9 - "matches.ts"
Cohesion: 0.26
Nodes (8): DesignateAction, labels, styles, matchStatus, ActiveReferee, findMatches(), mapMatch(), MatchWithRelations

### Community 10 - "nav.tsx"
Cohesion: 0.10
Nodes (19): geistMono, geistSans, metadata, RootLayout(), viewport, AppNav(), AppNavLink, buzz() (+11 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 19 - "getCurrentUser"
Cohesion: 0.06
Nodes (61): react-dom, dynamic, GroupRow, GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks() (+53 more)

### Community 20 - "designation-rules.ts"
Cohesion: 0.15
Nodes (12): dynamic, ReglementPage(), SEVERITY_LABEL, dayRange(), DESIGNATION_RULES, DesignationRule, MAX_PER_3_DAYS, MAX_PER_DAY (+4 more)

### Community 21 - "designer/page.tsx"
Cohesion: 0.31
Nodes (8): dynamic, MultiDesignatePage(), MultiDesignatePanel(), handleSubmit(), applyRefereeToMatches(), AutoDesignateSummary, MatchSort, getRefereeSheet()

### Community 22 - "arbitres/[id]/page.tsx"
Cohesion: 0.14
Nodes (24): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+16 more)

### Community 24 - "matchs/page.tsx"
Cohesion: 0.33
Nodes (8): dynamic, MatchesPage(), designate(), SwipeNav(), addWeeks(), formatDayMonthFr(), weekRange(), listMatchCities()

### Community 25 - "dates.ts"
Cohesion: 0.19
Nodes (11): ControlsPage(), dynamic, PERIODS, dynamic, GymnaseJourneePage(), todayIso(), formatDateFr(), formatDateTimeFr() (+3 more)

### Community 28 - "next"
Cohesion: 0.17
Nodes (9): nextConfig, next, dynamic, matches(), normalize(), SuggestionsList(), renderRow(), IneligibleReferee (+1 more)

## Knowledge Gaps
- **198 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 228 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `write.ts`, `fbi-match-row.tsx`, `fbi/page.tsx`, `createClient`, `suggestions.ts`, `current-user.ts`, `export/page.tsx`, `package.json`, `admin.ts`, `matches.ts`, `nav.tsx`, `getCurrentUser`, `designation-rules.ts`, `designer/page.tsx`, `arbitres/[id]/page.tsx`, `matchs/page.tsx`, `dates.ts`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05394736842105263 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `fbi-match-row.tsx`, `fbi/page.tsx`, `createClient`, `suggestions.ts`, `current-user.ts`, `admin.ts`, `nav.tsx`, `designation-rules.ts`, `designer/page.tsx`, `arbitres/[id]/page.tsx`, `matchs/page.tsx`, `dates.ts`, `next`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.0821256038647343 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `write.ts`, `fbi-match-row.tsx`, `createClient`, `suggestions.ts`, `current-user.ts`, `matches.ts`, `getCurrentUser`, `arbitres/[id]/page.tsx`, `next`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05851619644723093 - nodes in this community are weakly interconnected._