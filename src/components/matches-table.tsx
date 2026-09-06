import Link from "next/link";
import { matchStatus } from "@/lib/matches";
import { formatDateTimeFr } from "@/lib/dates";
import { StatusBadge } from "@/components/status-badge";
import type { Prisma } from "@/generated/prisma/client";
import { matchWithRelationsInclude } from "@/lib/matches";

type MatchRow = Prisma.MatchGetPayload<{
  include: typeof matchWithRelationsInclude;
}>;

export function MatchesTable({ matches }: { matches: MatchRow[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-neutral-500 py-8 text-center">
        Aucun match ne correspond à ces filtres.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-neutral-500 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Niveau</th>
            <th className="px-3 py-2 font-medium">Affiche</th>
            <th className="px-3 py-2 font-medium">Lieu</th>
            <th className="px-3 py-2 font-medium">Arbitres</th>
            <th className="px-3 py-2 font-medium">Statut</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {matches.map((m) => {
            const status = matchStatus(m);
            return (
              <tr key={m.id} className="hover:bg-neutral-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatDateTimeFr(m.date)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {m.competitionLevel.label}
                </td>
                <td className="px-3 py-2">
                  {m.homeTeam} - {m.awayTeam}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-neutral-500">
                  {m.venue ?? "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {m.designations.length}/{m.refereesRequired}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={status} />
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link
                    href={`/matchs/${m.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Détails
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
