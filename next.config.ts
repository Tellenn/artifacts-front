import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Génère un serveur autonome (.next/standalone) pour une image Docker minimale.
  output: "standalone",
};

export default nextConfig;
