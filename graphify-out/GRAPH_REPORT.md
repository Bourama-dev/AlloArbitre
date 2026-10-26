# Graph Report - AlloArbitre  (2026-10-26)

## Corpus Check
- 118 files · ~79,067 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 702 nodes · 1874 edges · 27 communities (20 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f4c0a4b2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- boite-a-outils/page.tsx
- communication/page.tsx
- auto-designate-actions.ts
- suggestions.ts
- getCurrentUser
- export/page.tsx
- package.json
- current-user.ts
- referees.ts
- react
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- admin.ts
- utilisateurs/page.tsx
- geocoding.ts
- AlertToast
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
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 21 edges
10. `MatchDetailPage()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (27 total, 7 thin omitted)

### Community 0 - "espace/page.tsx"
Cohesion: 0.07
Nodes (52): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod() (+44 more)

### Community 1 - "boite-a-outils/page.tsx"
Cohesion: 0.17
Nodes (22): GET(), addDocument(), deleteDocument(), deleteFaq(), dynamic, FaqFields(), go(), requireAdmin() (+14 more)

### Community 2 - "communication/page.tsx"
Cohesion: 0.22
Nodes (10): CommunicationPage(), dynamic, RefereeRow, CommunicationStudio(), PendingReferee, CopyButton(), fillTemplate(), INDIVIDUAL_REMINDER (+2 more)

### Community 3 - "auto-designate-actions.ts"
Cohesion: 0.16
Nodes (21): AutoDesignateButton(), apply(), compute(), AutoDesignatePanel(), apply(), boxes(), compute(), selectAll() (+13 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.09
Nodes (58): ageAt(), CommitteeSettings, divisionReasons(), DivisionRules, getDivisionRules(), getSettings(), maxDistanceReason(), loadAvailabilityIndex() (+50 more)

### Community 5 - "getCurrentUser"
Cohesion: 0.16
Nodes (22): GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow, dynamic, LevelMappingPanel() (+14 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (27): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+19 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (35): eslintConfig, dependencies, exceljs, next, react, react-dom, @supabase/ssr, @supabase/supabase-js (+27 more)

### Community 8 - "current-user.ts"
Cohesion: 0.06
Nodes (54): @supabase/ssr, dynamic, GET(), changePassword(), dynamic, PendingPage(), logout(), dynamic (+46 more)

### Community 9 - "referees.ts"
Cohesion: 0.26
Nodes (12): dynamic, RefereesPage(), todayIso(), computeUnavailableRefereeIds(), listRefereeLevels(), listRefereesWithLoad(), listZones(), RawReferee (+4 more)

### Community 10 - "react"
Cohesion: 0.08
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

### Community 19 - "admin.ts"
Cohesion: 0.21
Nodes (7): dynamic, GroupRow, CheckboxPicker(), normalize(), PickerItem, removeDesignation(), supabaseAdmin

### Community 20 - "utilisateurs/page.tsx"
Cohesion: 0.23
Nodes (11): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+3 more)

### Community 24 - "geocoding.ts"
Cohesion: 0.12
Nodes (26): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+18 more)

### Community 25 - "AlertToast"
Cohesion: 0.14
Nodes (25): dynamic, EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), dynamic, NewRefereePage(), ComptePage() (+17 more)

### Community 27 - "next"
Cohesion: 0.06
Nodes (52): nextConfig, next, dynamic, MultiDesignatePage(), ControlsPage(), dynamic, PERIODS, dynamic (+44 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.07
Nodes (46): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+38 more)

## Knowledge Gaps
- **183 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+178 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `communication/page.tsx`, `designation-rules.ts`, `auto-designate-actions.ts`, `getCurrentUser`, `export/page.tsx`, `package.json`, `current-user.ts`, `referees.ts`, `react`, `admin.ts`, `utilisateurs/page.tsx`, `geocoding.ts`, `AlertToast`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _183 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `espace/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06946386946386947 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `espace/page.tsx`, `communication/page.tsx`, `designation-rules.ts`, `auto-designate-actions.ts`, `export/page.tsx`, `current-user.ts`, `react`, `admin.ts`, `utilisateurs/page.tsx`, `geocoding.ts`, `AlertToast`, `next`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08531746031746032 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `communication/page.tsx`, `designation-rules.ts`, `suggestions.ts`, `getCurrentUser`, `current-user.ts`, `referees.ts`, `utilisateurs/page.tsx`, `geocoding.ts`, `AlertToast`, `next`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `export/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._