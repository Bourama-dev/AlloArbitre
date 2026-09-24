import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/current-user";
import { parseMatchesWorkbook, importMatches } from "@/lib/import-matches";
import { backfillMissingCoordinates } from "@/lib/geocoding-backfill";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function submit(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/matchs");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/import?error=${encodeURIComponent("Aucun fichier sélectionné.")}`);
  }

  let params: URLSearchParams;
  try {
    const buffer = await file.arrayBuffer();
    const rows = await parseMatchesWorkbook(buffer);
    const summary = await importMatches(rows);
    params = new URLSearchParams({
      created: String(summary.created),
      updated: String(summary.updated),
      levels: summary.competitionLevelsCreated.join(", "),
      errors: summary.errors.join(" | "),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    redirect(`/admin/import?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/matchs");
  redirect(`/admin/import?${params.toString()}`);
}

async function geocode() {
  "use server";
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/matchs");
  }

  let params: URLSearchParams;
  try {
    const summary = await backfillMissingCoordinates();
    // Une liste d'échecs illimitée dans l'URL de redirection dépasse la
    // limite de longueur d'URI de la plateforme (URI_TOO_LONG) dès que
    // beaucoup d'adresses ne sont pas géocodables : on tronque à quelques
    // exemples et on indique le total.
    const maxShown = 5;
    const geoFailed =
      summary.failed.length > maxShown
        ? `${summary.failed.slice(0, maxShown).join(" | ")} | … et ${summary.failed.length - maxShown} autre(s)`
        : summary.failed.join(" | ");
    params = new URLSearchParams({
      geoReferees: String(summary.refereesGeocoded),
      geoMatches: String(summary.matchesGeocoded),
      geoFailedCount: String(summary.failed.length),
      geoFailed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    redirect(`/admin/import?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/matchs");
  revalidatePath("/arbitres");
  redirect(`/admin/import?${params.toString()}`);
}

export default async function ImportMatchsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    levels?: string;
    errors?: string;
    error?: string;
    geoReferees?: string;
    geoMatches?: string;
    geoFailedCount?: string;
    geoFailed?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    redirect("/matchs");
  }

  const params = await searchParams;

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Import des matchs (Excel)</h1>
        <p className="text-sm text-[var(--muted)]">
          Fichier .xlsx avec les colonnes : <strong>Équipe domicile</strong> (ou{" "}
          <strong>Equipe 1</strong>), <strong>Équipe extérieur</strong> (ou{" "}
          <strong>Equipe 2</strong>), <strong>Date</strong> (AAAA-MM-JJ ou JJ/MM/AAAA),{" "}
          <strong>Heure</strong> (HH:MM), <strong>Lieu</strong> (ou{" "}
          <strong>Salle</strong>), <strong>Niveau</strong> (ou{" "}
          <strong>Code</strong>) — compatible avec l&apos;export &laquo;&nbsp;Recherche
          désignation&nbsp;&raquo; de FFBB Compet. Les niveaux de compétition inconnus
          sont créés automatiquement. Un match déjà présent (même date, mêmes équipes,
          même niveau) est complété/mis à jour plutôt que dupliqué — l&apos;import peut
          être rejoué sans risque.
        </p>
      </div>

      {params.error && (
        <div className="rounded-lg bg-[var(--danger-bg)] text-[var(--danger)] text-sm px-3 py-2">
          {params.error}
        </div>
      )}

      {(params.created !== undefined || params.updated !== undefined) && !params.error && (
        <div className="rounded-lg bg-[var(--success-bg)] text-[var(--success)] text-sm px-3 py-2 space-y-1">
          <p>
            {params.created} match(s) créé(s), {params.updated} match(s) mis à jour.
          </p>
          {params.levels && (
            <p>Niveaux de compétition créés automatiquement : {params.levels}</p>
          )}
          {params.errors && (
            <p className="text-[var(--danger)]">Erreurs : {params.errors}</p>
          )}
        </div>
      )}

      <form action={submit} className="space-y-3 card p-4">
        <input type="file" name="file" accept=".xlsx" required className="block w-full text-sm" />
        <SubmitButton pendingLabel="Import en cours…">Importer</SubmitButton>
      </form>

      <div className="space-y-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Géocodage des adresses manquantes</h2>
          <p className="text-sm text-[var(--muted)]">
            Calcule les coordonnées (lat/lng) des arbitres et matchs dont l&apos;adresse est connue mais pas encore
            géocodée - nécessaire pour le tri par proximité, le calcul de rémunération estimée, et la prise en compte
            du temps de trajet entre deux gymnases lors d&apos;une désignation. À relancer après un import en masse
            (Excel, FBI) ou l&apos;ajout de <code>GOOGLE_MAPS_API_KEY</code>.
          </p>
        </div>
        {(params.geoReferees !== undefined || params.geoMatches !== undefined) && !params.error && (
          <div className="rounded-lg bg-[var(--success-bg)] text-[var(--success)] text-sm px-3 py-2 space-y-1">
            <p>
              {params.geoReferees} arbitre(s) et {params.geoMatches} match(s) géocodé(s).
            </p>
            {params.geoFailed && (
              <p className="text-[var(--danger)]">
                Non géocodables{params.geoFailedCount ? ` (${params.geoFailedCount})` : ""} : {params.geoFailed}
              </p>
            )}
          </div>
        )}
        <form action={geocode}>
          <SubmitButton className="btn btn-secondary" pendingLabel="Géocodage en cours…">
            Géocoder les adresses manquantes
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
