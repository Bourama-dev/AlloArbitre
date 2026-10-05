# Graph Report - AlloArbitre  (2026-10-05)

## Corpus Check
- 103 files · ~62,151 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 680 nodes · 1871 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36ac6878`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- write.ts
- matches.ts
- getCurrentUser
- next
- suggestions.ts
- espace/page.tsx
- export/page.tsx
- package.json
- admin.ts
- arbitres/[id]/page.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 91 edges
2. `next` - 48 edges
3. `supabaseAdmin` - 33 edges
4. `AlertToast()` - 29 edges
5. `designateReferee()` - 27 edges
6. `createClient()` - 27 edges
7. `SubmitButton()` - 25 edges
8. `getMatchCandidates()` - 25 edges
9. `GET()` - 18 edges
10. `AvailabilityPeriodPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/espace/page.tsx → src/lib/supabase/server.ts
- `ReglementPage()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/reglement/page.tsx → src/lib/current-user.ts
- `renderRow()` --calls--> `SubmitButton()`  [EXTRACTED]
  src/components/suggestions-list.tsx → src/components/submit-button.tsx
- `createGroup()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/admin/groupes/page.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "write.ts"
Cohesion: 0.05
Nodes (81): cheerio, dynamic, GET(), maxDuration, readableError(), dynamic, FbiRencontrePage(), maxDuration (+73 more)

### Community 1 - "matches.ts"
Cohesion: 0.06
Nodes (66): react, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate(), GROUPES, maxDuration (+58 more)

### Community 2 - "getCurrentUser"
Cohesion: 0.06
Nodes (62): dynamic, GroupRow, GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow (+54 more)

### Community 3 - "next"
Cohesion: 0.05
Nodes (51): nextConfig, next, @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic (+43 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.07
Nodes (70): ControlsPage(), dynamic, PERIODS, dynamic, MatchDetailPage(), designate(), matches(), normalize() (+62 more)

### Community 5 - "espace/page.tsx"
Cohesion: 0.08
Nodes (43): AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline(), back(), dynamic, AvailabilityPeriodsPage() (+35 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (27): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+19 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (36): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+28 more)

### Community 8 - "admin.ts"
Cohesion: 0.15
Nodes (22): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), backfillMissingCoordinates(), resolve(), GeocodingBackfillSummary (+14 more)

### Community 9 - "arbitres/[id]/page.tsx"
Cohesion: 0.13
Nodes (24): dynamic, dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage() (+16 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "AlloArbitre"
Cohesion: 0.22
Nodes (8): AlloArbitre, Architecture des données, Authentification (Supabase Auth), Démarrage, Déploiement, Fonctionnalités (V1), Variables d'environnement, Volontairement non traité pour l'instant

### Community 13 - "vercel.json"
Cohesion: 0.50
Nodes (3): crons, fluid, regions

### Community 18 - "schema.sql"
Cohesion: 0.16
Nodes (22): "AvailabilityPeriod", "AvailabilityResponse", "AvailabilitySlot", "CompetitionLevel", "Designation", "DesignationRemoval", "LevelMapping", "Match" (+14 more)

### Community 20 - "designation-rules.ts"
Cohesion: 0.15
Nodes (12): dynamic, ReglementPage(), SEVERITY_LABEL, dayRange(), DESIGNATION_RULES, DesignationRule, MAX_PER_3_DAYS, MAX_PER_DAY (+4 more)

## Knowledge Gaps
- **190 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+185 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 216 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `write.ts`, `matches.ts`, `getCurrentUser`, `suggestions.ts`, `espace/page.tsx`, `export/page.tsx`, `package.json`, `admin.ts`, `arbitres/[id]/page.tsx`, `designation-rules.ts`?**
  _High betweenness centrality (0.211) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `write.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052091112770724424 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `write.ts`, `matches.ts`, `next`, `suggestions.ts`, `espace/page.tsx`, `export/page.tsx`, `admin.ts`, `arbitres/[id]/page.tsx`, `designation-rules.ts`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Should `matches.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05692883895131086 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `write.ts`, `matches.ts`, `getCurrentUser`, `next`, `suggestions.ts`, `espace/page.tsx`, `arbitres/[id]/page.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `getCurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.0590990990990991 - nodes in this community are weakly interconnected._