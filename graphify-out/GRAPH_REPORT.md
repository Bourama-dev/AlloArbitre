# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 104 files · ~78,696 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 697 nodes · 1901 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e8e047e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- write.ts
- matches.ts
- getCurrentUser
- createClient
- suggestions.ts
- espace/page.tsx
- export/page.tsx
- package.json
- geocoding.ts
- stats.ts
- react
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- next
- designation-rules.ts
- current-user.ts
- arbitres/[id]/page.tsx
- utilisateurs/page.tsx
- controls.ts
- evaluateMatchCandidates
- matchs/[id]/page.tsx
- suggestions-list.tsx
- refereeOwnClubTeam

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 93 edges
2. `next` - 49 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `evaluateMatchCandidates()` - 22 edges
9. `AvailabilityPeriodPage()` - 18 edges
10. `GET()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `saveSettings()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/parametres/page.tsx → src/lib/current-user.ts
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

## Communities (30 total, 6 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (82): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+74 more)

### Community 1 - "matches.ts"
Cohesion: 0.06
Nodes (61): dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay() (+53 more)

### Community 2 - "getCurrentUser"
Cohesion: 0.16
Nodes (21): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow, dynamic, LevelMappingAdminPage() (+13 more)

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (36): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+28 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.13
Nodes (23): handlePreview(), LEVEL_PRIORITY, levelPriorityRank(), PlanItem, previewAutoDesignation(), AvailabilityStatus, CandidateContext, CandidateDesignation (+15 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.12
Nodes (32): AvailabilityPeriodPage(), clearRefereeAvailability(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage(), createPeriod() (+24 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.25
Nodes (14): dynamic, ExportPage(), fmtDay(), generateMetadata(), isCd45Level(), levelClass(), matchTime(), Params (+6 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.10
Nodes (37): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), updateReferee(), createReferee(), EditMatchPage() (+29 more)

### Community 9 - "stats.ts"
Cohesion: 0.13
Nodes (23): exceljs, dynamic, GET(), maxDuration, dynamic, euros(), generateMetadata(), kms() (+15 more)

### Community 10 - "react"
Cohesion: 0.08
Nodes (23): react, geistMono, geistSans, metadata, RootLayout(), CheckboxPicker(), normalize(), PickerItem (+15 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 19 - "next"
Cohesion: 0.14
Nodes (21): nextConfig, next, react-dom, dynamic, GroupRow, dynamic, dynamic, EditRefereePage() (+13 more)

### Community 20 - "designation-rules.ts"
Cohesion: 0.16
Nodes (13): dynamic, ReglementPage(), SEVERITY_LABEL, checkQuotaRules(), dayRange(), DESIGNATION_RULES, DesignationRule, MAX_PER_3_DAYS (+5 more)

### Community 21 - "current-user.ts"
Cohesion: 0.24
Nodes (10): RefereeSpacePage(), changePassword(), saveAvailability(), CurrentReferee, CurrentUser, getCurrentReferee, getSessionProfile, SessionProfile (+2 more)

### Community 22 - "arbitres/[id]/page.tsx"
Cohesion: 0.16
Nodes (21): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+13 more)

### Community 24 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

### Community 25 - "controls.ts"
Cohesion: 0.16
Nodes (16): SettingsAdminPage(), saveSettings(), ControlsPage(), dynamic, PERIODS, getSettings(), ControlIssue, DoubleOpportunity (+8 more)

### Community 26 - "evaluateMatchCandidates"
Cohesion: 0.19
Nodes (14): ageAt(), CommitteeSettings, divisionAgeCategory(), divisionReasons(), DivisionRules, getDivisionRules(), maxDistanceReason(), MIN_DESIGNATION_AGE (+6 more)

### Community 27 - "matchs/[id]/page.tsx"
Cohesion: 0.32
Nodes (9): dynamic, MatchDetailPage(), designate(), estimatePayment(), cachedRoadDistances(), coordKey(), fetchMatrix(), roadDistance (+1 more)

### Community 28 - "suggestions-list.tsx"
Cohesion: 0.43
Nodes (6): matches(), normalize(), SuggestionsList(), renderRow(), IneligibleReferee, RefereeSuggestion

### Community 29 - "refereeOwnClubTeam"
Cohesion: 1.00
Nodes (3): normalize(), refereeOwnClubTeam(), teamClubSegments()

## Knowledge Gaps
- **197 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+192 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 223 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `write.ts`, `matches.ts`, `getCurrentUser`, `createClient`, `espace/page.tsx`, `export/page.tsx`, `package.json`, `geocoding.ts`, `stats.ts`, `react`, `designation-rules.ts`, `arbitres/[id]/page.tsx`, `utilisateurs/page.tsx`, `controls.ts`, `matchs/[id]/page.tsx`, `suggestions-list.tsx`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _197 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `matches.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `geocoding.ts`, `stats.ts`, `react`, `next`, `designation-rules.ts`, `current-user.ts`, `arbitres/[id]/page.tsx`, `utilisateurs/page.tsx`, `controls.ts`, `matchs/[id]/page.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Should `matches.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06263173742848539 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `next` to `write.ts`, `matches.ts`, `getCurrentUser`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `geocoding.ts`, `stats.ts`, `current-user.ts`, `arbitres/[id]/page.tsx`, `utilisateurs/page.tsx`, `controls.ts`, `evaluateMatchCandidates`, `matchs/[id]/page.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.07955596669750231 - nodes in this community are weakly interconnected._