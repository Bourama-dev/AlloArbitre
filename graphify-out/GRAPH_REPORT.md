# Graph Report - AlloArbitre  (2026-10-15)

## Corpus Check
- 115 files · ~77,550 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 686 nodes · 1812 edges · 23 communities (16 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40230777`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- boite-a-outils/page.tsx
- arbitres/[id]/page.tsx
- communication/page.tsx
- suggestions.ts
- export/page.tsx
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
- admin.ts
- getCurrentUser
- next
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 91 edges
2. `next` - 55 edges
3. `supabaseAdmin` - 32 edges
4. `AlertToast()` - 31 edges
5. `createClient()` - 30 edges
6. `SubmitButton()` - 28 edges
7. `designateReferee()` - 26 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 19 edges
10. `AvailabilityPeriodPage()` - 19 edges

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
Cohesion: 0.08
Nodes (45): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+37 more)

### Community 1 - "boite-a-outils/page.tsx"
Cohesion: 0.17
Nodes (22): GET(), addDocument(), deleteDocument(), deleteFaq(), dynamic, FaqFields(), go(), requireAdmin() (+14 more)

### Community 2 - "arbitres/[id]/page.tsx"
Cohesion: 0.14
Nodes (24): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+16 more)

### Community 3 - "communication/page.tsx"
Cohesion: 0.22
Nodes (10): CommunicationPage(), dynamic, RefereeRow, CommunicationStudio(), PendingReferee, CopyButton(), fillTemplate(), INDIVIDUAL_REMINDER (+2 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (80): dynamic, MatchDetailPage(), designate(), matches(), normalize(), SuggestionsList(), renderRow(), applyAutoDesignation() (+72 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (27): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+19 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (34): eslintConfig, dependencies, exceljs, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+26 more)

### Community 8 - "current-user.ts"
Cohesion: 0.06
Nodes (44): @supabase/ssr, dynamic, GET(), changePassword(), dynamic, PendingPage(), logout(), dynamic (+36 more)

### Community 10 - "react"
Cohesion: 0.07
Nodes (28): react, geistMono, geistSans, metadata, RootLayout(), viewport, AppNav(), AppNavLink (+20 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 18 - "schema.sql"
Cohesion: 0.15
Nodes (23): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "DesignationRule", "LevelMapping" (+15 more)

### Community 24 - "admin.ts"
Cohesion: 0.12
Nodes (27): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+19 more)

### Community 25 - "getCurrentUser"
Cohesion: 0.07
Nodes (62): react-dom, dynamic, GroupRow, GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks() (+54 more)

### Community 27 - "next"
Cohesion: 0.06
Nodes (48): nextConfig, next, dynamic, MultiDesignatePage(), ControlsPage(), dynamic, PERIODS, dynamic (+40 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (44): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+36 more)

## Knowledge Gaps
- **183 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `arbitres/[id]/page.tsx`, `communication/page.tsx`, `suggestions.ts`, `designation-rules.ts`, `export/page.tsx`, `package.json`, `current-user.ts`, `react`, `admin.ts`, `getCurrentUser`?**
  _High betweenness centrality (0.236) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `espace/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0822746521476104 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `espace/page.tsx`, `arbitres/[id]/page.tsx`, `communication/page.tsx`, `suggestions.ts`, `designation-rules.ts`, `export/page.tsx`, `current-user.ts`, `react`, `admin.ts`, `next`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `arbitres/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `arbitres/[id]/page.tsx`, `communication/page.tsx`, `suggestions.ts`, `designation-rules.ts`, `current-user.ts`, `getCurrentUser`, `next`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05958485958485959 - nodes in this community are weakly interconnected._