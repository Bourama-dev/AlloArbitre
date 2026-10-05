# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 104 files · ~78,319 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 694 nodes · 1894 edges · 26 communities (20 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49af4f59`
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
- AlertToast
- designation-rules.ts
- next
- disponibilites/[id]/page.tsx
- utilisateurs/page.tsx
- disponibilites/page.tsx

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 93 edges
2. `next` - 49 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `createClient()` - 27 edges
6. `designateReferee()` - 26 edges
7. `SubmitButton()` - 25 edges
8. `evaluateMatchCandidates()` - 21 edges
9. `AvailabilityPeriodPage()` - 18 edges
10. `GET()` - 17 edges

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

## Communities (26 total, 6 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (82): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+74 more)

### Community 1 - "matches.ts"
Cohesion: 0.06
Nodes (67): dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay() (+59 more)

### Community 2 - "getCurrentUser"
Cohesion: 0.19
Nodes (19): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingAdminPage(), addCompetitionLevel(), addRefereeLevel() (+11 more)

### Community 3 - "createClient"
Cohesion: 0.08
Nodes (36): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+28 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.07
Nodes (63): ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), matches(), normalize() (+55 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.17
Nodes (16): dynamic, One, RefereeSpacePage(), changePassword(), saveAvailability(), AvailabilityIndex, AvailabilityPeriod, AvailabilityVerdict (+8 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.25
Nodes (14): dynamic, ExportPage(), fmtDay(), generateMetadata(), isCd45Level(), levelClass(), matchTime(), Params (+6 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "geocoding.ts"
Cohesion: 0.10
Nodes (37): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), updateReferee(), createReferee(), EditMatchPage() (+29 more)

### Community 9 - "stats.ts"
Cohesion: 0.07
Nodes (45): dynamic, GET(), maxDuration, dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction() (+37 more)

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

### Community 19 - "AlertToast"
Cohesion: 0.19
Nodes (15): react-dom, dynamic, EditRefereePage(), deleteReferee(), dynamic, NewRefereePage(), dynamic, dynamic (+7 more)

### Community 20 - "designation-rules.ts"
Cohesion: 0.15
Nodes (12): dynamic, ReglementPage(), SEVERITY_LABEL, dayRange(), DESIGNATION_RULES, DesignationRule, MAX_PER_3_DAYS, MAX_PER_DAY (+4 more)

### Community 21 - "next"
Cohesion: 0.14
Nodes (13): nextConfig, next, dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), dynamic (+5 more)

### Community 22 - "disponibilites/[id]/page.tsx"
Cohesion: 0.28
Nodes (14): AvailabilityPeriodPage(), clearRefereeAvailability(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, activeReferees(), announcementMessage() (+6 more)

### Community 24 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

### Community 25 - "disponibilites/page.tsx"
Cohesion: 0.53
Nodes (5): AvailabilityPeriodsPage(), createPeriod(), dynamic, formatDay(), parisLocalToDate()

## Knowledge Gaps
- **196 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `write.ts`, `matches.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `export/page.tsx`, `package.json`, `geocoding.ts`, `stats.ts`, `react`, `AlertToast`, `designation-rules.ts`, `disponibilites/[id]/page.tsx`, `utilisateurs/page.tsx`, `disponibilites/page.tsx`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `matches.ts`, `createClient`, `suggestions.ts`, `geocoding.ts`, `stats.ts`, `react`, `AlertToast`, `designation-rules.ts`, `next`, `disponibilites/[id]/page.tsx`, `utilisateurs/page.tsx`, `disponibilites/page.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Should `matches.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05799373040752351 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `next` to `write.ts`, `matches.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `geocoding.ts`, `stats.ts`, `AlertToast`, `disponibilites/[id]/page.tsx`, `utilisateurs/page.tsx`, `disponibilites/page.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.07955596669750231 - nodes in this community are weakly interconnected._