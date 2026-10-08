# Graph Report - AlloArbitre  (2026-10-08)

## Corpus Check
- 124 files · ~91,435 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 788 nodes · 2171 edges · 30 communities (22 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fffb2b62`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- matchs/page.tsx
- admin.ts
- referee-auth.ts
- suggestions.ts
- fbi-match-row.tsx
- stats.ts
- package.json
- matches.ts
- fbi/page.tsx
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- app-nav.tsx
- next
- write.ts
- server.ts
- getCurrentUser
- react
- createClient
- connexion/page.tsx
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 96 edges
2. `next` - 58 edges
3. `supabaseAdmin` - 34 edges
4. `createClient()` - 30 edges
5. `AlertToast()` - 29 edges
6. `designateReferee()` - 29 edges
7. `SubmitButton()` - 28 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 21 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/en-attente/page.tsx → src/lib/supabase/server.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `createGroup()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/divisions/groupes-panel.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (30 total, 8 thin omitted)

### Community 0 - "espace/page.tsx"
Cohesion: 0.08
Nodes (46): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+38 more)

### Community 1 - "matchs/page.tsx"
Cohesion: 0.17
Nodes (16): dynamic, GymnaseJourneePage(), todayIso(), dynamic, MatchesPage(), MatchViewTabs(), SwipeNav(), addWeeks() (+8 more)

### Community 2 - "admin.ts"
Cohesion: 0.10
Nodes (39): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), dynamic, maxDuration, FbiImportSummary (+31 more)

### Community 3 - "referee-auth.ts"
Cohesion: 0.26
Nodes (13): dynamic, RefereeActivationPage(), activate(), activateRefereeAccount(), AuthResult, createPersonalLink(), findAuthUserId(), findByLicense() (+5 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (74): ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), designate(), handlePreview() (+66 more)

### Community 5 - "fbi-match-row.tsx"
Cohesion: 0.18
Nodes (13): ConflictBadge(), DesignateState, FbiMatchRow(), presenceStyles, MatchesTable(), PushToFbiButton(), STATUS_STYLE, labels (+5 more)

### Community 6 - "stats.ts"
Cohesion: 0.06
Nodes (60): exceljs, dynamic, GET(), maxDuration, dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction() (+52 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "matches.ts"
Cohesion: 0.20
Nodes (15): dynamic, MultiDesignatePage(), MultiDesignatePanel(), handleSubmit(), applyRefereeToMatches(), AutoDesignateSummary, ownClubMessage(), isLaterMatchSameVenueSameDay() (+7 more)

### Community 9 - "fbi/page.tsx"
Cohesion: 0.15
Nodes (19): dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay() (+11 more)

### Community 10 - "nav.tsx"
Cohesion: 0.15
Nodes (12): geistMono, geistSans, metadata, RootLayout(), viewport, AppNavLink, adminLinks, more (+4 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.15
Nodes (23): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "DesignationRule", "LevelMapping" (+15 more)

### Community 19 - "app-nav.tsx"
Cohesion: 0.21
Nodes (9): AppNav(), buzz(), isActive(), Props, NavIcon(), NavIconName, PATHS, RefereeTabs() (+1 more)

### Community 21 - "write.ts"
Cohesion: 0.05
Nodes (73): describe(), dynamic, GET(), maxDuration, Step, timed(), GET(), readableError() (+65 more)

### Community 22 - "server.ts"
Cohesion: 0.22
Nodes (8): @supabase/ssr, SUPABASE_ANON_KEY, SUPABASE_URL, AUTH_ROUTES, config, REFEREE_PUBLIC_ROUTES, REFEREE_ROUTES, SELF_AUTH_API_ROUTES

### Community 24 - "getCurrentUser"
Cohesion: 0.05
Nodes (75): react-dom, dynamic, GroupRow, GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks() (+67 more)

### Community 25 - "react"
Cohesion: 0.52
Nodes (4): react, ConfirmModal(), ConflictConfirm(), GroupChoices()

### Community 27 - "createClient"
Cohesion: 0.24
Nodes (9): dynamic, GET(), changePassword(), logout(), LoginPage(), login(), SignupPage(), signup() (+1 more)

### Community 28 - "connexion/page.tsx"
Cohesion: 0.47
Nodes (5): dynamic, RefereeLoginPage(), login(), findByEmail(), resolveLoginEmail()

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (46): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+38 more)

## Knowledge Gaps
- **211 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 245 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `matchs/page.tsx`, `admin.ts`, `referee-auth.ts`, `suggestions.ts`, `fbi-match-row.tsx`, `stats.ts`, `package.json`, `matches.ts`, `fbi/page.tsx`, `nav.tsx`, `app-nav.tsx`, `write.ts`, `server.ts`, `getCurrentUser`, `react`, `createClient`, `connexion/page.tsx`, `designation-rules.ts`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `espace/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08123904149620105 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `espace/page.tsx`, `matchs/page.tsx`, `admin.ts`, `designation-rules.ts`, `suggestions.ts`, `fbi-match-row.tsx`, `stats.ts`, `matches.ts`, `fbi/page.tsx`, `nav.tsx`, `write.ts`, `createClient`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `admin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0975177304964539 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `espace/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `fbi-match-row.tsx`, `referee-auth.ts`, `stats.ts`, `matches.ts`, `write.ts`, `getCurrentUser`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05693664795509222 - nodes in this community are weakly interconnected._