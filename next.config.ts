/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Permite concluir o build de produção mesmo que haja avisos/erros de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;