/**
 * Texte d'aide : replié sous « En savoir plus » sur mobile (peu de texte à
 * l'écran), affiché en clair à partir des grands écrans.
 */
export function InfoText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <details className={`lg:hidden text-xs text-[var(--muted)] ${className}`}>
        <summary className="cursor-pointer text-[var(--accent)] font-semibold py-1 select-none">En savoir plus</summary>
        <p className="mt-1">{children}</p>
      </details>
      <p className={`hidden lg:block text-xs text-[var(--muted)] ${className}`}>{children}</p>
    </>
  );
}
