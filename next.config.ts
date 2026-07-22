import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin puxa dependencias ESM-only (jose, via jwks-rsa) que quebram
  // se o Turbopack tentar empacota-las no bundle do servidor. Isso faz o Next
  // usar o require() nativo do Node para esse pacote em vez de empacotar.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;