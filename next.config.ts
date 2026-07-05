import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génère un serveur autonome (.next/standalone) pour une image Docker minimale.
  output: "standalone",
  images: {
    // Icônes d'items du jeu. Le CDN n'envoie pas de Cache-Control :
    // l'optimiseur Next les met en cache 31 jours (elles sont statiques).
    remotePatterns: [new URL("https://artifactsmmo.com/images/items/**")],
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
