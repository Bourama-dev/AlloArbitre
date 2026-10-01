import type { NextConfig } from "next";

// Les dates de match sont l'heure du gymnase stockée sans fuseau et relue en
// UTC partout dans l'application (comme sur Vercel, où le serveur est en
// UTC). Sur un poste à l'heure de Paris (version locale), Node relisait ces
// horaires en heure locale et les décalait de 1 à 2 h : on impose UTC.
process.env.TZ = "UTC";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
