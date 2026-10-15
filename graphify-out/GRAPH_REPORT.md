# Graph Report - AlloArbitre  (2026-10-15)

## Corpus Check
- 116 files · ~77,977 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 690 nodes · 1832 edges · 22 communities (15 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fa769fd9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- boite-a-outils/page.tsx
- arbitres/[id]/page.tsx
- suggestions.ts
- stats.ts
- package.json
- current-user.ts
- react
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- SubmitButton
- getCurrentUser
- next
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 91 edges
2. `next` - 56 edges
3. `supabaseAdmin` - 32 edges
4. `AlertToast()` - 31 edges
5. `createClient()` - 30 edges
6. `SubmitButton()` - 28 edges
7. `designateReferee()` - 26 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 20 edges
10. `MatchDetailPage()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `GroupsPanel()` --calls--> `AlertToast()`  [EXTRACTED]
  src/app/admin/divisions/groupes-panel.tsx → src/components/alert-toast.tsx

## Import Cycles
- None detected.

## Communities (22 total, 7 thin omitted)

### Community 0 - "espace/page.tsx"
Cohesion: 0.08
Nodes (49): dynamic, GroupRow, dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES (+41 more)

### Community 1 - "boite-a-outils/page.tsx"
Cohesion: 0.17
Nodes (22): GET(), addDocument(), deleteDocument(), deleteFaq(), dynamic, FaqFields(), go(), requireAdmin() (+14 more)

### Community 2 - "arbitres/[id]/page.tsx"
Cohesion: 0.10
Nodes (32): dynamic, EditRefereePage(), deleteReferee(), dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction() (+24 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.07
Nodes (68): dynamic, MatchDetailPage(), designate(), AutoDesignateButton(), apply(), compute(), ConfirmModal(), ConflictConfirm() (+60 more)

### Community 6 - "stats.ts"
Cohesion: 0.08
Nodes (40): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+32 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (35): eslintConfig, dependencies, exceljs, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+27 more)

### Community 8 - "current-user.ts"
Cohesion: 0.06
Nodes (46): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, PendingPage(), logout() (+38 more)

### Community 10 - "react"
Cohesion: 0.06
Nodes (35): react, CommunicationPage(), dynamic, RefereeRow, geistMono, geistSans, metadata, RootLayout() (+27 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.15
Nodes (23): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "DesignationRule", "LevelMapping" (+15 more)

### Community 24 - "SubmitButton"
Cohesion: 0.07
Nodes (49): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), updateReferee(), createReferee(), dynamic (+41 more)

### Community 25 - "getCurrentUser"
Cohesion: 0.13
Nodes (28): GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow, dynamic, LevelMappingPanel() (+20 more)

### Community 27 - "next"
Cohesion: 0.06
Nodes (50): nextConfig, next, dynamic, MultiDesignatePage(), ControlsPage(), dynamic, PERIODS, dynamic (+42 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (44): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+36 more)

## Knowledge Gaps
- **182 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `arbitres/[id]/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `stats.ts`, `package.json`, `current-user.ts`, `react`, `SubmitButton`, `getCurrentUser`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `espace/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08415300546448087 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `espace/page.tsx`, `arbitres/[id]/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `stats.ts`, `current-user.ts`, `react`, `SubmitButton`, `next`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `arbitres/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0951219512195122 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `espace/page.tsx` to `boite-a-outils/page.tsx`, `arbitres/[id]/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `stats.ts`, `current-user.ts`, `react`, `SubmitButton`, `getCurrentUser`, `next`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06882716049382716 - nodes in this community are weakly interconnected._