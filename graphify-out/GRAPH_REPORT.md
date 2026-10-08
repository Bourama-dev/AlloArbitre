# Graph Report - AlloArbitre  (2026-10-08)

## Corpus Check
- 117 files · ~90,509 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 769 nodes · 2115 edges · 31 communities (23 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9398d7ab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getCurrentUser
- write.ts
- fbi-sync/route.ts
- createClient
- suggestions.ts
- utilisateurs/page.tsx
- stats.ts
- package.json
- admin.ts
- next
- nav.tsx
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- searchDesignations.ts
- AlertToast
- fetch.ts
- FbiClient
- current-user.ts
- espace/page.tsx
- fbi-rencontre-row.tsx
- client.ts
- CheckboxPicker
- designation-rules.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 96 edges
2. `next` - 52 edges
3. `supabaseAdmin` - 35 edges
4. `AlertToast()` - 31 edges
5. `designateReferee()` - 29 edges
6. `SubmitButton()` - 28 edges
7. `createClient()` - 27 edges
8. `evaluateMatchCandidates()` - 23 edges
9. `react` - 21 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deletePeriod()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/disponibilites/[id]/page.tsx → src/lib/current-user.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/app/espace/page.tsx → src/lib/supabase/server.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts

## Import Cycles
- None detected.

## Communities (31 total, 8 thin omitted)

### Community 0 - "getCurrentUser"
Cohesion: 0.16
Nodes (21): GroupsAdminPage(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), CompetitionLevelRow, dynamic, LevelMappingAdminPage() (+13 more)

### Community 1 - "write.ts"
Cohesion: 0.20
Nodes (20): overlaps(), analyzeFbiDay(), assignRefereeToFbiRencontre(), checkFbiOfficielEligibility(), dayCache, DayData, deleteOfficielRow(), FbiAlreadyDesignatedError (+12 more)

### Community 2 - "fbi-sync/route.ts"
Cohesion: 0.17
Nodes (19): dynamic, GET(), maxDuration, readableError(), syncFbiOfficielsToDesignations(), FbiOfficiel, formatDateFr(), FbiPushPositionResult (+11 more)

### Community 3 - "createClient"
Cohesion: 0.07
Nodes (39): @supabase/ssr, dynamic, GET(), ComptePage(), changePassword(), dynamic, RefereeActivationPage(), activate() (+31 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.06
Nodes (73): MatchDetailPage(), designate(), designate(), handlePreview(), matches(), normalize(), SuggestionsList(), renderRow() (+65 more)

### Community 5 - "utilisateurs/page.tsx"
Cohesion: 0.24
Nodes (10): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+2 more)

### Community 6 - "stats.ts"
Cohesion: 0.06
Nodes (61): exceljs, dynamic, GET(), maxDuration, dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction() (+53 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (37): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+29 more)

### Community 8 - "admin.ts"
Cohesion: 0.13
Nodes (29): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), FbiImportSummary, importFbiRencontresAsMatches(), resolveVenueCoords() (+21 more)

### Community 9 - "next"
Cohesion: 0.05
Nodes (65): nextConfig, next, react, dynamic, MultiDesignatePage(), dynamic, FbiPage(), designate() (+57 more)

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

### Community 19 - "searchDesignations.ts"
Cohesion: 0.20
Nodes (15): describe(), dynamic, GET(), maxDuration, Step, timed(), cellText(), DataTablesResponse (+7 more)

### Community 20 - "AlertToast"
Cohesion: 0.15
Nodes (24): dynamic, EditRefereePage(), deleteReferee(), updateReferee(), createReferee(), dynamic, NewRefereePage(), dynamic (+16 more)

### Community 21 - "fetch.ts"
Cohesion: 0.19
Nodes (18): dynamic, FbiRencontrePage(), maxDuration, presenceStyles, clean(), FbiRencontreDetail, FbiRencontreInfo, formDesignationFields() (+10 more)

### Community 24 - "current-user.ts"
Cohesion: 0.20
Nodes (7): dynamic, GroupRow, dynamic, CurrentReferee, CurrentUser, getSessionProfile, SessionProfile

### Community 25 - "espace/page.tsx"
Cohesion: 0.09
Nodes (44): ControlsPage(), dynamic, PERIODS, AvailabilityPeriodPage(), clearRefereeAvailability(), deletePeriod(), saveRefereeAvailability(), updateDeadline() (+36 more)

### Community 27 - "fbi-rencontre-row.tsx"
Cohesion: 0.33
Nodes (5): EtatBadge(), etatStyles, FbiRencontreRow(), presenceStyles, FbiDesignationRow

### Community 28 - "client.ts"
Cohesion: 0.38
Nodes (6): BodyMode, cooldownError(), FbiDump, FetchedResponse, fetchWithRetry(), throttle()

### Community 29 - "CheckboxPicker"
Cohesion: 0.40
Nodes (3): CheckboxPicker(), normalize(), PickerItem

### Community 35 - "designation-rules.ts"
Cohesion: 0.08
Nodes (46): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+38 more)

## Knowledge Gaps
- **211 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+206 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 242 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `getCurrentUser`, `fbi-sync/route.ts`, `designation-rules.ts`, `createClient`, `utilisateurs/page.tsx`, `stats.ts`, `package.json`, `admin.ts`, `suggestions.ts`, `nav.tsx`, `searchDesignations.ts`, `AlertToast`, `fetch.ts`, `current-user.ts`, `espace/page.tsx`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _211 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.06988120195667366 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `fbi-sync/route.ts`, `designation-rules.ts`, `createClient`, `utilisateurs/page.tsx`, `stats.ts`, `suggestions.ts`, `admin.ts`, `next`, `nav.tsx`, `searchDesignations.ts`, `AlertToast`, `current-user.ts`, `espace/page.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `suggestions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061122538936232734 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `admin.ts` to `getCurrentUser`, `fbi-sync/route.ts`, `designation-rules.ts`, `suggestions.ts`, `utilisateurs/page.tsx`, `createClient`, `stats.ts`, `next`, `AlertToast`, `current-user.ts`, `espace/page.tsx`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Should `stats.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05541346973572037 - nodes in this community are weakly interconnected._