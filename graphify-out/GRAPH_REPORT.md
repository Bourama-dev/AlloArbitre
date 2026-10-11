# Graph Report - AlloArbitre  (2026-10-11)

## Corpus Check
- 128 files · ~93,330 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 804 nodes · 2207 edges · 33 communities (25 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41403b18`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- disponibilites/[id]/page.tsx
- referees.ts
- createClient
- suggestions.ts
- stats.ts
- export/page.tsx
- package.json
- referee-auth.ts
- fbi-match-row.tsx
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- referee-access-actions.ts
- disponibilites/page.tsx
- write.ts
- getCurrentUser
- admin.ts
- SubmitButton
- communication/page.tsx
- next
- server.ts
- current-user.ts
- suggestions-list.tsx
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 98 edges
2. `next` - 59 edges
3. `supabaseAdmin` - 35 edges
4. `createClient()` - 30 edges
5. `AlertToast()` - 29 edges
6. `designateReferee()` - 29 edges
7. `SubmitButton()` - 28 edges
8. `react` - 23 edges
9. `evaluateMatchCandidates()` - 23 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/en-attente/page.tsx → src/lib/supabase/server.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (33 total, 8 thin omitted)

### Community 0 - "espace/page.tsx"
Cohesion: 0.15
Nodes (18): dynamic, One, RefereeSpacePage(), changePassword(), saveAvailability(), AvailabilityIndex, AvailabilityPeriod, AvailabilityStatus (+10 more)

### Community 1 - "disponibilites/[id]/page.tsx"
Cohesion: 0.20
Nodes (16): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, ConfirmSubmitButton() (+8 more)

### Community 2 - "referees.ts"
Cohesion: 0.24
Nodes (12): dynamic, RefereesPage(), todayIso(), computeUnavailableRefereeIds(), listRefereesWithLoad(), listZones(), RawReferee, RefereeAvailabilityFilter (+4 more)

### Community 3 - "createClient"
Cohesion: 0.18
Nodes (13): dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeLoginPage(), login(), logout() (+5 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.05
Nodes (87): ControlsPage(), dynamic, PERIODS, dynamic, GymnaseJourneePage(), todayIso(), dynamic, MatchDetailPage() (+79 more)

### Community 5 - "stats.ts"
Cohesion: 0.14
Nodes (23): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), formatDateOnlyFr(), formatDateTimeFr(), addPunctualUnavailability() (+15 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (27): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+19 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "referee-auth.ts"
Cohesion: 0.24
Nodes (15): dynamic, RefereeActivationPage(), activate(), activateRefereeAccount(), AuthResult, createPersonalLink(), findAuthUserId(), findByEmail() (+7 more)

### Community 9 - "fbi-match-row.tsx"
Cohesion: 0.07
Nodes (47): react, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration (+39 more)

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

### Community 19 - "referee-access-actions.ts"
Cohesion: 0.52
Nodes (4): PersonalLinkButton(), generate(), generatePersonalLink(), appUrl()

### Community 20 - "disponibilites/page.tsx"
Cohesion: 0.36
Nodes (7): AvailabilityPeriodsPage(), createPeriod(), dynamic, formatDay(), CollapsibleFilters(), parisLocalToDate(), PERIOD_SELECT

### Community 21 - "write.ts"
Cohesion: 0.05
Nodes (77): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+69 more)

### Community 22 - "getCurrentUser"
Cohesion: 0.07
Nodes (41): dynamic, GroupRow, GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow (+33 more)

### Community 24 - "admin.ts"
Cohesion: 0.09
Nodes (46): geocode(), submit(), dynamic, EditMatchPage(), deleteMatch(), toggleCancelled(), updateMatch(), createMatch() (+38 more)

### Community 25 - "SubmitButton"
Cohesion: 0.21
Nodes (10): dynamic, ImportMatchsPage(), maxDuration, dynamic, createReferee(), dynamic, NewRefereePage(), dynamic (+2 more)

### Community 27 - "communication/page.tsx"
Cohesion: 0.22
Nodes (10): CommunicationPage(), dynamic, RefereeRow, CommunicationStudio(), PendingReferee, CopyButton(), fillTemplate(), INDIVIDUAL_REMINDER (+2 more)

### Community 29 - "server.ts"
Cohesion: 0.22
Nodes (8): @supabase/ssr, SUPABASE_ANON_KEY, SUPABASE_URL, AUTH_ROUTES, config, REFEREE_PUBLIC_ROUTES, REFEREE_ROUTES, SELF_AUTH_API_ROUTES

### Community 30 - "current-user.ts"
Cohesion: 0.22
Nodes (10): dynamic, PendingPage(), logout(), dynamic, Home(), CurrentReferee, CurrentUser, getPendingAccount (+2 more)

### Community 31 - "suggestions-list.tsx"
Cohesion: 0.43
Nodes (6): matches(), normalize(), SuggestionsList(), renderRow(), IneligibleReferee, RefereeSuggestion

### Community 35 - "designation-rules.ts"
Cohesion: 0.07
Nodes (48): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+40 more)

## Knowledge Gaps
- **214 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+209 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 249 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `disponibilites/[id]/page.tsx`, `referees.ts`, `createClient`, `suggestions.ts`, `stats.ts`, `export/page.tsx`, `package.json`, `referee-auth.ts`, `fbi-match-row.tsx`, `nav.tsx`, `disponibilites/page.tsx`, `write.ts`, `getCurrentUser`, `admin.ts`, `SubmitButton`, `communication/page.tsx`, `server.ts`, `current-user.ts`, `suggestions-list.tsx`, `designation-rules.ts`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _214 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0522911051212938 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `disponibilites/[id]/page.tsx`, `createClient`, `suggestions.ts`, `stats.ts`, `export/page.tsx`, `designation-rules.ts`, `fbi-match-row.tsx`, `nav.tsx`, `referee-access-actions.ts`, `disponibilites/page.tsx`, `write.ts`, `admin.ts`, `SubmitButton`, `communication/page.tsx`, `current-user.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `stats.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `espace/page.tsx`, `disponibilites/[id]/page.tsx`, `referees.ts`, `designation-rules.ts`, `suggestions.ts`, `stats.ts`, `referee-auth.ts`, `fbi-match-row.tsx`, `disponibilites/page.tsx`, `write.ts`, `getCurrentUser`, `SubmitButton`, `communication/page.tsx`, `current-user.ts`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `export/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._