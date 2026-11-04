# Graph Report - AlloArbitre  (2026-11-04)

## Corpus Check
- 118 files · ~79,184 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 703 nodes · 1876 edges · 24 communities (17 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb3ee475`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- disponibilites/[id]/page.tsx
- boite-a-outils/page.tsx
- communication/page.tsx
- auto-designate-actions.ts
- suggestions.ts
- export/page.tsx
- package.json
- createClient
- espace/page.tsx
- nav.tsx
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
2. `next` - 58 edges
3. `createClient()` - 33 edges
4. `supabaseAdmin` - 32 edges
5. `AlertToast()` - 31 edges
6. `SubmitButton()` - 28 edges
7. `designateReferee()` - 26 edges
8. `evaluateMatchCandidates()` - 24 edges
9. `react` - 21 edges
10. `MatchDetailPage()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `generateMetadata()` --calls--> `parseSeason()`  [EXTRACTED]
  src/app/statistiques/page.tsx → src/lib/stats.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `GroupsPanel()` --calls--> `CheckboxPicker()`  [EXTRACTED]
  src/app/admin/divisions/groupes-panel.tsx → src/components/checkbox-picker.tsx

## Import Cycles
- None detected.

## Communities (24 total, 7 thin omitted)

### Community 0 - "disponibilites/[id]/page.tsx"
Cohesion: 0.07
Nodes (41): react, AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic (+33 more)

### Community 1 - "boite-a-outils/page.tsx"
Cohesion: 0.17
Nodes (22): GET(), addDocument(), deleteDocument(), deleteFaq(), dynamic, FaqFields(), go(), requireAdmin() (+14 more)

### Community 2 - "communication/page.tsx"
Cohesion: 0.22
Nodes (10): CommunicationPage(), dynamic, RefereeRow, CommunicationStudio(), PendingReferee, CopyButton(), fillTemplate(), INDIVIDUAL_REMINDER (+2 more)

### Community 3 - "auto-designate-actions.ts"
Cohesion: 0.18
Nodes (19): AutoDesignateButton(), apply(), compute(), AutoDesignatePanel(), apply(), boxes(), compute(), selectAll() (+11 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.08
Nodes (59): dynamic, MatchDetailPage(), designate(), designate(), matches(), normalize(), SuggestionsList(), renderRow() (+51 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.15
Nodes (22): dynamic, ExportPage(), fmtDay(), generateMetadata(), isCd45Level(), levelClass(), matchTime(), Params (+14 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (34): eslintConfig, dependencies, exceljs, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+26 more)

### Community 8 - "createClient"
Cohesion: 0.06
Nodes (46): @supabase/ssr, dynamic, GET(), changePassword(), dynamic, PendingPage(), logout(), dynamic (+38 more)

### Community 9 - "espace/page.tsx"
Cohesion: 0.08
Nodes (46): exceljs, dynamic, GET(), maxDuration, dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction() (+38 more)

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

### Community 24 - "admin.ts"
Cohesion: 0.12
Nodes (27): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+19 more)

### Community 25 - "getCurrentUser"
Cohesion: 0.06
Nodes (67): react-dom, dynamic, GroupRow, GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks() (+59 more)

### Community 27 - "next"
Cohesion: 0.06
Nodes (46): nextConfig, next, dynamic, MultiDesignatePage(), ControlsPage(), dynamic, PERIODS, dynamic (+38 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.07
Nodes (49): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+41 more)

## Knowledge Gaps
- **183 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `disponibilites/[id]/page.tsx`, `boite-a-outils/page.tsx`, `communication/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `auto-designate-actions.ts`, `export/page.tsx`, `package.json`, `createClient`, `espace/page.tsx`, `nav.tsx`, `admin.ts`, `getCurrentUser`?**
  _High betweenness centrality (0.239) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `disponibilites/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07467532467532467 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `disponibilites/[id]/page.tsx`, `communication/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `auto-designate-actions.ts`, `createClient`, `espace/page.tsx`, `nav.tsx`, `admin.ts`, `next`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `disponibilites/[id]/page.tsx`, `boite-a-outils/page.tsx`, `communication/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `createClient`, `espace/page.tsx`, `getCurrentUser`, `next`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._