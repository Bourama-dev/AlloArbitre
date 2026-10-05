// Squelette affiché pendant le chargement d'un écran : donne une impression
// de fluidité (la mise en page est déjà là) plutôt qu'un simple spinner.
export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-12 w-full" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-28 w-full" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}
