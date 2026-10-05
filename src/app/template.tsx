// Re-monté à chaque navigation : transition d'entrée légère entre les écrans.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
