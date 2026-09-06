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
        <h1 className="text-lg font-semibold">Arbitres</h1>
        <Link
          href="/arbitres/nouveau"
          className="px-2 py-1 text-sm rounded bg-neutral-900 text-white hover:bg-neutral-800"
        >
          + Nouvel arbitre
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 bg-white border border-neutral-200 rounded-lg p-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Niveau</label>
          <select
            name="level"
            defaultValue={levelId ?? ""}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
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
          <label className="block text-xs text-neutral-500 mb-1">Zone</label>
          <select
            name="zone"
            defaultValue={zone ?? ""}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
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
          className="rounded bg-neutral-900 text-white text-sm px-4 py-1.5 hover:bg-neutral-800"
        >
          Filtrer
        </button>
      </form>

      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Nom</th>
              <th className="px-3 py-2 font-medium">Niveau</th>
              <th className="px-3 py-2 font-medium">Zone</th>
              <th className="px-3 py-2 font-medium">Contact</th>
              <th className="px-3 py-2 font-medium">Charge actuelle</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {referees.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.firstName} {r.lastName}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{r.level.label}</td>
                <td className="px-3 py-2 whitespace-nowrap text-neutral-500">
                  {r.zone ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-neutral-500">
                  {r.phone ?? r.email ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.currentLoad} désignation{r.currentLoad > 1 ? "s" : ""}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link
                    href={`/arbitres/${r.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Fiche
                  </Link>
                </td>
              </tr>
            ))}
            {referees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-neutral-500">
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
