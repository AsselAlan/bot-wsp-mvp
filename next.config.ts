import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para Turbopack (Next.js 16+)
  turbopack: {},

  // Deshabilitar optimización de paquetes específicos
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer', 'qrcode-terminal'],
};

export default nextConfig;
