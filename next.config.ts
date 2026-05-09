import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compatibilidade com links antigos para /entrar (rota removida).
  // Login único agora é /login para todos os roles — ROLE_REDIRECT
  // (lib/auth-client.ts) cuida do destino pós-login conforme o role.
  async redirects() {
    return [
      {
        source: "/entrar",
        destination: "/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
