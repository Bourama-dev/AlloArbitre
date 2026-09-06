import Link from "next/link";
import { listRefereesWithLoad, listRefereeLevels, listZones } from "@/lib/referees";

export const dynamic = "force-dynamic";

export default async function RefereesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; zone?: string }>;
}) {
  const params = await searchParams;
  const levelId = params.level || undefined;
  const zone = params.zone || undefined;

  const [referees, levels, zones] = await Promise.all([
    listRefereesWithLoad({ levelId, zone }),
    listRefereeLevels(),
    listZones(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Arbitres</h1>
        <Link
          href="/arbitres/nouveau"
          className="btn btn-primary text-sm"
        >
          + Nouvel arbitre
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 card p-4">
        <div>
          <label className="field-label">Niveau</label>
          <select
            name="level"
            defaultValue={levelId ?? ""}
            className="input"
          >
            <option value="">Tous les niveaux</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Zone</label>
          <select
            name="zone"
            defaultValue={zone ?? ""}
            className="input"
          >
            <option value="">Toutes les zones</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
        >
          Filtrer
        </button>
      </form>

      <div className="table-shell overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 font-medium">Nom</th>
              <th className="px-3 py-2 font-medium">Niveau</th>
              <th className="px-3 py-2 font-medium">Zone</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Charge actuelle</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {referees.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.firstName} {r.lastName}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{r.level.label}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">
                  {r.zone ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--muted)]">
                  {r.phone ?? r.email ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.currentLoad} désignation{r.currentLoad > 1 ? "s" : ""}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link
                    href={`/arbitres/${r.id}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Fiche
                  </Link>
                </td>
              </tr>
            ))}
            {referees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[var(--muted)]">
                  Aucun arbitre ne correspond à ces filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
