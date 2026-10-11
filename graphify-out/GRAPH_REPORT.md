# Graph Report - AlloArbitre  (2026-10-11)

## Corpus Check
- 124 files · ~91,644 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 789 nodes · 2176 edges · 27 communities (20 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fc901a5d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- disponibilites/[id]/page.tsx
- referees.ts
- current-user.ts
- suggestions.ts
- stats.ts
- next
- package.json
- arbitres/[id]/page.tsx
- matches.ts
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
- CheckboxPicker
- getCurrentUser
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
  src/components/nav.tsx → src/lib/supabase/server.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `GroupsPanel()` --calls--> `CheckboxPicker()`  [EXTRACTED]
  src/app/admin/divisions/groupes-panel.tsx → src/components/checkbox-picker.tsx
- `createGroup()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/divisions/groupes-panel.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (27 total, 7 thin omitted)

### Community 0 - "espace/page.tsx"
Cohesion: 0.15
Nodes (19): dynamic, One, RefereeSpacePage(), changePassword(), saveAvailability(), AvailabilityIndex, AvailabilityPeriod, AvailabilityStatus (+11 more)

### Community 1 - "disponibilites/[id]/page.tsx"
Cohesion: 0.24
Nodes (16): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, activeReferees() (+8 more)

### Community 2 - "referees.ts"
Cohesion: 0.27
Nodes (11): dynamic, RefereesPage(), todayIso(), computeUnavailableRefereeIds(), listRefereesWithLoad(), listZones(), RawReferee, RefereeAvailabilityFilter (+3 more)

### Community 3 - "current-user.ts"
Cohesion: 0.06
Nodes (46): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, PendingPage(), logout() (+38 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (78): ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), designate(), handlePreview() (+70 more)

### Community 5 - "stats.ts"
Cohesion: 0.22
Nodes (10): clubOfTeam(), ClubStats, computeSeasonStats(), fetchAll(), One, RawMatch, RawReferee, RefereeDesignationLine (+2 more)

### Community 6 - "next"
Cohesion: 0.07
Nodes (29): nextConfig, exceljs, next, dynamic, GET(), maxDuration, dynamic, ExportPage() (+21 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "arbitres/[id]/page.tsx"
Cohesion: 0.31
Nodes (10): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), addPunctualUnavailability(), addRecurringUnavailability(), getRefereeSheet() (+2 more)

### Community 9 - "matches.ts"
Cohesion: 0.05
Nodes (67): react, react-dom, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES (+59 more)

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
Cohesion: 0.36
Nodes (5): CopyText(), PersonalLinkButton(), generate(), generatePersonalLink(), appUrl()

### Community 20 - "disponibilites/page.tsx"
Cohesion: 0.39
Nodes (7): AvailabilityPeriodsPage(), createPeriod(), dynamic, formatDay(), InfoText(), parisLocalToDate(), isDeadlinePassed()

### Community 21 - "write.ts"
Cohesion: 0.05
Nodes (82): describe(), dynamic, GET(), maxDuration, Step, timed(), dynamic, GET() (+74 more)

### Community 22 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 24 - "getCurrentUser"
Cohesion: 0.05
Nodes (89): dynamic, GroupRow, GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow (+81 more)

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (46): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+38 more)

## Knowledge Gaps
- **211 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 245 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `disponibilites/[id]/page.tsx`, `referees.ts`, `current-user.ts`, `suggestions.ts`, `designation-rules.ts`, `package.json`, `arbitres/[id]/page.tsx`, `matches.ts`, `nav.tsx`, `disponibilites/page.tsx`, `write.ts`, `getCurrentUser`?**
  _High betweenness centrality (0.222) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `current-user.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.062146892655367235 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `disponibilites/[id]/page.tsx`, `current-user.ts`, `suggestions.ts`, `designation-rules.ts`, `next`, `arbitres/[id]/page.tsx`, `matches.ts`, `nav.tsx`, `referee-access-actions.ts`, `disponibilites/page.tsx`, `write.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05543345543345543 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `getCurrentUser` to `espace/page.tsx`, `disponibilites/[id]/page.tsx`, `referees.ts`, `designation-rules.ts`, `suggestions.ts`, `current-user.ts`, `stats.ts`, `matches.ts`, `disponibilites/page.tsx`, `write.ts`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._