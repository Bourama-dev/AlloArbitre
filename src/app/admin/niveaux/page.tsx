import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LevelMappingAdminPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/matchs");
  }

  const [competitionLevels, refereeLevels] = await Promise.all([
    prisma.competitionLevel.findMany({
      include: { mapping: { include: { minRefereeLevel: true } } },
      orderBy: { label: "asc" },
    }),
    prisma.refereeLevel.findMany({ orderBy: { rank: "asc" } }),
  ]);

  async function saveMapping(formData: FormData) {
    "use server";
    const session = await auth();
    if (session?.user.role !== "ADMIN") return;

    const competitionLevelId = String(formData.get("competitionLevelId"));
    const minRefereeLevelId = String(formData.get("minRefereeLevelId"));

    await prisma.levelMapping.upsert({
      where: { competitionLevelId },
      update: { minRefereeLevelId },
      create: { competitionLevelId, minRefereeLevelId },
    });
    revalidatePath("/admin/niveaux");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">
          Correspondance niveaux de compétition → niveau d&apos;arbitre minimum
        </h1>
        <p className="text-sm text-neutral-500">
          Cette table pilote le filtre de niveau de l&apos;algorithme de suggestion
          d&apos;arbitres. Modifiez-la librement, rien n&apos;est figé dans le code.
        </p>
      </div>

      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Niveau de compétition</th>
              <th className="px-3 py-2 font-medium">Niveau d&apos;arbitre minimum</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {competitionLevels.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 whitespace-nowrap">{c.label}</td>
                <td className="px-3 py-2">
                  <form action={saveMapping} className="flex items-center gap-2">
                    <input type="hidden" name="competitionLevelId" value={c.id} />
                    <select
                      name="minRefereeLevelId"
                      defaultValue={c.mapping?.minRefereeLevel.id ?? ""}
                      className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
                    >
                      <option value="" disabled>
                        Non défini
                      </option>
                      {refereeLevels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded bg-neutral-900 text-white text-xs px-3 py-1.5 hover:bg-neutral-800"
                    >
                      Enregistrer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
