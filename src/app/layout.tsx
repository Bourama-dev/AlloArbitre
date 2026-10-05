import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/current-user";
import { Nav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlloArbitre",
  description: "Désignation des arbitres - CD45",
  applicationName: "AlloArbitre",
  // Installée sur l'écran d'accueil : plein écran, sans barre d'adresse.
  appleWebApp: { capable: true, title: "AlloArbitre", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Contenu jusque sous l'encoche / la barre système (safe areas gérées en CSS).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {user && <Nav user={user} />}
        <main className="app-main" data-shell={user ? "staff" : "plain"}>
          {children}
        </main>
      </body>
    </html>
  );
}
