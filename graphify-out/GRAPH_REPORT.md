# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 103 files · ~61,624 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 653 nodes · 1815 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d2c0d872`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- write.ts
- matches.ts
- getCurrentUser
- createClient
- suggestions.ts
- espace/page.tsx
- stats.ts
- package.json
- admin.ts
- arbitres/[id]/page.tsx
- react
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 90 edges
2. `next` - 48 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `getMatchCandidates()` - 21 edges
9. `GET()` - 18 edges
10. `AvailabilityPeriodPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `handlePreview()` --calls--> `previewAutoDesignation()`  [EXTRACTED]
  src/components/fbi-matches-panel.tsx → src/lib/actions/auto-designate-actions.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `GroupsAdminPage()` --calls--> `CheckboxPicker()`  [EXTRACTED]
  src/app/admin/groupes/page.tsx → src/components/checkbox-picker.tsx
- `createGroup()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/groupes/page.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (18 total, 4 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (76): cheerio, dynamic, GET(), maxDuration, readableError(), dynamic, FbiRencontrePage(), maxDuration (+68 more)

### Community 1 - "matches.ts"
Cohesion: 0.06
Nodes (62): dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration, parseIsoDay() (+54 more)

### Community 2 - "getCurrentUser"
Cohesion: 0.05
Nodes (69): nextConfig, next, dynamic, GroupRow, GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup() (+61 more)

### Community 3 - "createClient"
Cohesion: 0.05
Nodes (50): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+42 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.08
Nodes (56): ControlsPage(), dynamic, PERIODS, LEVEL_PRIORITY, levelPriorityRank(), PlanItem, previewAutoDesignation(), ageAt() (+48 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.11
Nodes (37): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+29 more)

### Community 6 - "stats.ts"
Cohesion: 0.09
Nodes (37): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+29 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "admin.ts"
Cohesion: 0.14
Nodes (29): submit(), createMatch(), dynamic, FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords(), removeDuplicateRencontres(), backfillMissingCoordinates() (+21 more)

### Community 9 - "arbitres/[id]/page.tsx"
Cohesion: 0.15
Nodes (23): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+15 more)

### Community 10 - "react"
Cohesion: 0.13
Nodes (15): react, CheckboxPicker(), normalize(), PickerItem, CopyText(), PersonalLinkButton(), generate(), matches() (+7 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 13 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, fluid, regions

## Knowledge Gaps
- **185 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+180 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `getCurrentUser` to `write.ts`, `matches.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `package.json`, `admin.ts`, `arbitres/[id]/page.tsx`, `react`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _185 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05491268672417421 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `matches.ts`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `admin.ts`, `arbitres/[id]/page.tsx`, `react`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `matches.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05880780539962577 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `write.ts`, `matches.ts`, `getCurrentUser`, `createClient`, `suggestions.ts`, `espace/page.tsx`, `stats.ts`, `arbitres/[id]/page.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `getCurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.05225718194254446 - nodes in this community are weakly interconnected._