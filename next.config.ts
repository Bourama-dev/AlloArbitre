import type { NextConfig } from "next";

// Les dates de match sont l'heure du gymnase stockée sans fuseau et relue en
// UTC partout dans l'application (comme sur Vercel, où le serveur est en
// UTC). Sur un poste à l'heure de Paris (version locale), Node relisait ces
// horaires en heure locale et les décalait de 1 à 2 h : on impose UTC.
process.env.TZ = "UTC";

const nextConfig: NextConfig = {
  // Boîte à outils : envoi de documents officiels (PDF...) jusqu'à 10 Mo par un administrateur.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  // L'ancienne page FBI n'existe plus : les favoris renvoient vers la liste des matchs.
  async redirects() {
    return [{ source: "/fbi/:path*", destination: "/matchs", permanent: false }];
  },
};

export default nextConfig;
