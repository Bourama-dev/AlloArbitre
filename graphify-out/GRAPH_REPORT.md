# Graph Report - AlloArbitre  (2026-10-15)

## Corpus Check
- 117 files · ~78,458 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 696 nodes · 1857 edges · 23 communities (16 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12dab463`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- boite-a-outils/page.tsx
- react
- next
- suggestions.ts
- stats.ts
- package.json
- createClient
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- geocoding.ts
- getCurrentUser
- matches.ts
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 91 edges
2. `next` - 57 edges
3. `supabaseAdmin` - 32 edges
4. `AlertToast()` - 31 edges
5. `createClient()` - 30 edges
6. `SubmitButton()` - 28 edges
7. `designateReferee()` - 26 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 21 edges
10. `MatchDetailPage()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/espace/page.tsx → src/lib/supabase/server.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `GroupsPanel()` --calls--> `CheckboxPicker()`  [EXTRACTED]
  src/app/admin/divisions/groupes-panel.tsx → src/components/checkbox-picker.tsx

## Import Cycles
- None detected.

## Communities (23 total, 7 thin omitted)

### Community 0 - "espace/page.tsx"
Cohesion: 0.11
Nodes (40): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+32 more)

### Community 1 - "boite-a-outils/page.tsx"
Cohesion: 0.17
Nodes (22): GET(), addDocument(), deleteDocument(), deleteFaq(), dynamic, FaqFields(), go(), requireAdmin() (+14 more)

### Community 2 - "react"
Cohesion: 0.08
Nodes (25): react, CommunicationPage(), dynamic, RefereeRow, CheckboxPicker(), normalize(), PickerItem, CommunicationStudio() (+17 more)

### Community 3 - "next"
Cohesion: 0.11
Nodes (12): nextConfig, next, ControlsPage(), dynamic, PERIODS, dynamic, GymnaseJourneePage(), todayIso() (+4 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (65): AutoDesignateButton(), apply(), compute(), AutoDesignatePanel(), apply(), boxes(), compute(), selectAll() (+57 more)

### Community 6 - "stats.ts"
Cohesion: 0.06
Nodes (61): exceljs, dynamic, GET(), maxDuration, dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction() (+53 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (34): eslintConfig, dependencies, exceljs, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+26 more)

### Community 8 - "createClient"
Cohesion: 0.07
Nodes (40): @supabase/ssr, dynamic, GET(), changePassword(), dynamic, PendingPage(), logout(), dynamic (+32 more)

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

### Community 24 - "geocoding.ts"
Cohesion: 0.12
Nodes (26): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+18 more)

### Community 25 - "getCurrentUser"
Cohesion: 0.06
Nodes (67): react-dom, dynamic, GroupRow, GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks() (+59 more)

### Community 27 - "matches.ts"
Cohesion: 0.08
Nodes (45): dynamic, MultiDesignatePage(), dynamic, MatchDetailPage(), designate(), dynamic, MatchesPage(), designate() (+37 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (45): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+37 more)

## Knowledge Gaps
- **182 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+177 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `react`, `designation-rules.ts`, `suggestions.ts`, `stats.ts`, `package.json`, `createClient`, `nav.tsx`, `geocoding.ts`, `getCurrentUser`, `matches.ts`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _182 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `espace/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10815602836879433 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `espace/page.tsx`, `react`, `next`, `designation-rules.ts`, `suggestions.ts`, `stats.ts`, `createClient`, `nav.tsx`, `geocoding.ts`, `matches.ts`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08097165991902834 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `espace/page.tsx` to `boite-a-outils/page.tsx`, `react`, `designation-rules.ts`, `suggestions.ts`, `stats.ts`, `createClient`, `geocoding.ts`, `getCurrentUser`, `matches.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._