# Graph Report - AlloArbitre  (2026-10-11)

## Corpus Check
- 132 files · ~95,401 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 831 nodes · 2285 edges · 42 communities (33 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `53998afe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- espace/page.tsx
- boite-a-outils/page.tsx
- matches.ts
- designation-rules.ts
- suggestions.ts
- stats.ts
- export/page.tsx
- package.json
- createClient
- fbi-match-row.tsx
- react
- compilerOptions
- AlloArbitre
- vercel.json
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs
- schema.sql
- write.ts
- searchDesignations.ts
- fetch.ts
- getCurrentUser
- geocoding.ts
- AlertToast
- matchs/page.tsx
- next
- fbi-sync/route.ts
- current-user.ts
- matchs/[id]/page.tsx
- fbi/page.tsx
- rules-store.ts
- gymnase/page.tsx
- reglement/page.tsx
- controls.ts
- utilisateurs/page.tsx
- auto-designate-actions.ts
- FbiClient
- sync.ts
- client.ts

## God Nodes (most connected - your core abstractions)
1. `getCurrentUser` - 98 edges
2. `next` - 62 edges
3. `supabaseAdmin` - 37 edges
4. `AlertToast()` - 31 edges
5. `SubmitButton()` - 30 edges
6. `createClient()` - 30 edges
7. `designateReferee()` - 29 edges
8. `react` - 24 edges
9. `evaluateMatchCandidates()` - 23 edges
10. `AvailabilityPeriodPage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `deleteReferee()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/arbitres/[id]/modifier/page.tsx → src/lib/current-user.ts
- `toggleCancelled()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `deleteMatch()` --calls--> `getCurrentUser`  [EXTRACTED]
  src/app/matchs/[id]/modifier/page.tsx → src/lib/current-user.ts
- `handlePreview()` --calls--> `previewAutoDesignation()`  [EXTRACTED]
  src/components/fbi-matches-panel.tsx → src/lib/actions/auto-designate-actions.ts
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  src/components/nav.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (42 total, 9 thin omitted)

### Community 0 - "espace/page.tsx"
Cohesion: 0.06
Nodes (66): dynamic, RefereeSheetPage(), addPunctualAction(), addRecurringAction(), removeUnavailabilityAction(), dynamic, RefereesPage(), todayIso() (+58 more)

### Community 1 - "boite-a-outils/page.tsx"
Cohesion: 0.17
Nodes (22): GET(), addDocument(), deleteDocument(), deleteFaq(), dynamic, FaqFields(), go(), requireAdmin() (+14 more)

### Community 2 - "matches.ts"
Cohesion: 0.19
Nodes (16): dynamic, MultiDesignatePage(), MultiDesignatePanel(), handleSubmit(), applyRefereeToMatches(), AutoDesignateSummary, ownClubMessage(), runDesignationControls() (+8 more)

### Community 3 - "designation-rules.ts"
Cohesion: 0.15
Nodes (18): divisionAgeCategory(), ageOn(), checkQuotaRules(), checkRefereeRules(), dayRange(), divisionMatches(), MAX_PER_DAY, PERIOD_LABEL (+10 more)

### Community 4 - "suggestions.ts"
Cohesion: 0.16
Nodes (22): designate(), ageAt(), CommitteeSettings, divisionReasons(), getDivisionRules(), maxDistanceReason(), AvailabilityStatus, buildWhy() (+14 more)

### Community 5 - "stats.ts"
Cohesion: 0.19
Nodes (14): normalize(), refereeOwnClubTeam(), teamClubSegments(), isLaterMatchSameVenueSameDay(), clubOfTeam(), ClubStats, computeSeasonStats(), fetchAll() (+6 more)

### Community 6 - "export/page.tsx"
Cohesion: 0.12
Nodes (27): exceljs, dynamic, GET(), maxDuration, dynamic, ExportPage(), fmtDay(), generateMetadata() (+19 more)

### Community 7 - "package.json"
Cohesion: 0.06
Nodes (35): eslintConfig, dependencies, cheerio, exceljs, next, react, react-dom, @supabase/ssr (+27 more)

### Community 8 - "createClient"
Cohesion: 0.07
Nodes (42): @supabase/ssr, dynamic, GET(), changePassword(), dynamic, PendingPage(), logout(), dynamic (+34 more)

### Community 9 - "fbi-match-row.tsx"
Cohesion: 0.12
Nodes (22): ConfirmModal(), ConflictBadge(), ConflictConfirm(), DesignateAction, FbiMatchRow(), presenceStyles, FbiMatchesPanel(), handleConfirm() (+14 more)

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

### Community 19 - "write.ts"
Cohesion: 0.21
Nodes (19): overlaps(), analyzeFbiDay(), assignRefereeToFbiRencontre(), checkFbiOfficielEligibility(), dayCache, DayData, deleteOfficielRow(), FbiAlreadyDesignatedError (+11 more)

### Community 20 - "searchDesignations.ts"
Cohesion: 0.18
Nodes (17): cheerio, describe(), dynamic, GET(), maxDuration, Step, timed(), cellText() (+9 more)

### Community 21 - "fetch.ts"
Cohesion: 0.13
Nodes (23): dynamic, FbiRencontrePage(), maxDuration, presenceStyles, EtatBadge(), etatStyles, FbiRencontreRow(), presenceStyles (+15 more)

### Community 22 - "getCurrentUser"
Cohesion: 0.18
Nodes (20): GroupsPanel(), createGroup(), deleteGroup(), renameGroup(), saveLinks(), LevelMappingPanel(), addCompetitionLevel(), addRefereeLevel() (+12 more)

### Community 24 - "geocoding.ts"
Cohesion: 0.11
Nodes (35): dynamic, geocode(), ImportMatchsPage(), maxDuration, submit(), updateReferee(), createReferee(), updateMatch() (+27 more)

### Community 25 - "AlertToast"
Cohesion: 0.16
Nodes (21): react-dom, dynamic, EditRefereePage(), deleteReferee(), dynamic, NewRefereePage(), ComptePage(), dynamic (+13 more)

### Community 27 - "matchs/page.tsx"
Cohesion: 0.19
Nodes (14): dynamic, MatchesPage(), designate(), SwipeNav(), addWeeks(), formatDayMonthFr(), MatchSlot, PRE_MATCH_PRESENCE_MINUTES (+6 more)

### Community 29 - "fbi-sync/route.ts"
Cohesion: 0.24
Nodes (12): dynamic, GET(), maxDuration, readableError(), syncFbiOfficielsToDesignations(), FbiOfficiel, formatDateFr(), FbiPushPositionResult (+4 more)

### Community 30 - "current-user.ts"
Cohesion: 0.20
Nodes (10): dynamic, GroupRow, CompetitionLevelRow, dynamic, normalizeMapping(), AnyProfile, CurrentReferee, CurrentUser (+2 more)

### Community 31 - "matchs/[id]/page.tsx"
Cohesion: 0.19
Nodes (13): dynamic, MatchDetailPage(), designate(), matches(), normalize(), SuggestionsList(), renderRow(), distanceKm() (+5 more)

### Community 32 - "fbi/page.tsx"
Cohesion: 0.22
Nodes (13): dynamic, FbiPage(), GROUPES, maxDuration, parseIsoDay(), todayParis(), toIsoDay(), DesignateState (+5 more)

### Community 33 - "rules-store.ts"
Cohesion: 0.20
Nodes (13): DEFAULT_RULES, ForbidParams, QuotaParams, Rule, RuleSeverity, Kind, RuleInput, getAllRules() (+5 more)

### Community 34 - "gymnase/page.tsx"
Cohesion: 0.27
Nodes (10): ControlsPage(), dynamic, PERIODS, dynamic, GymnaseJourneePage(), todayIso(), InfoText(), MatchViewTabs() (+2 more)

### Community 35 - "reglement/page.tsx"
Cohesion: 0.19
Nodes (19): CommonFields(), DIVISION_SCOPES, dynamic, ForbidFields(), PERIODS, QuotaFields(), RuleCard(), RulesAdminPage() (+11 more)

### Community 36 - "controls.ts"
Cohesion: 0.24
Nodes (11): DivisionRules, ControlIssue, DoubleOpportunity, One, RawMatch, RawReferee, cachedRoadDistances(), coordKey() (+3 more)

### Community 37 - "utilisateurs/page.tsx"
Cohesion: 0.23
Nodes (11): back(), dynamic, formatWhen(), ProfileRow, RefereeRow, Role, STAFF_ROLES, UsersAdminPage() (+3 more)

### Community 38 - "auto-designate-actions.ts"
Cohesion: 0.23
Nodes (11): divisionPriorityRank(), PlanItem, previewAutoDesignation(), CandidateDesignation, explainSuggestion(), fetchPaged(), firstOf(), getMatchForSuggestion() (+3 more)

### Community 40 - "sync.ts"
Cohesion: 0.43
Nodes (7): compareWithAlloArbitre(), FbiMismatch, matchesFbiRow(), MatchRow, normalize(), parseFbiDateTime(), teamNamesMatch()

### Community 41 - "client.ts"
Cohesion: 0.38
Nodes (6): BodyMode, cooldownError(), FbiDump, FetchedResponse, fetchWithRetry(), throttle()

## Knowledge Gaps
- **216 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+211 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `matches.ts`, `export/page.tsx`, `package.json`, `createClient`, `fbi-match-row.tsx`, `react`, `searchDesignations.ts`, `fetch.ts`, `getCurrentUser`, `geocoding.ts`, `AlertToast`, `matchs/page.tsx`, `fbi-sync/route.ts`, `current-user.ts`, `matchs/[id]/page.tsx`, `fbi/page.tsx`, `gymnase/page.tsx`, `reglement/page.tsx`, `utilisateurs/page.tsx`?**
  _High betweenness centrality (0.224) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _216 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `espace/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059018367961457395 - nodes in this community are weakly interconnected._
- **Why does `getCurrentUser` connect `getCurrentUser` to `espace/page.tsx`, `matches.ts`, `suggestions.ts`, `export/page.tsx`, `createClient`, `fbi-match-row.tsx`, `react`, `searchDesignations.ts`, `geocoding.ts`, `AlertToast`, `matchs/page.tsx`, `fbi-sync/route.ts`, `current-user.ts`, `matchs/[id]/page.tsx`, `fbi/page.tsx`, `gymnase/page.tsx`, `reglement/page.tsx`, `utilisateurs/page.tsx`, `auto-designate-actions.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `designation-rules.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `supabaseAdmin` connect `current-user.ts` to `espace/page.tsx`, `boite-a-outils/page.tsx`, `matches.ts`, `reglement/page.tsx`, `suggestions.ts`, `utilisateurs/page.tsx`, `controls.ts`, `rules-store.ts`, `sync.ts`, `createClient`, `react`, `stats.ts`, `geocoding.ts`, `AlertToast`, `fbi-sync/route.ts`, `matchs/[id]/page.tsx`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `export/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._