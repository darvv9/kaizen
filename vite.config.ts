import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/kaizen/",
  // Carimbo do build, mostrado nos Ajustes: serve pra saber se a versão atualizou.
  define: {
    __BUILD_ID__: JSON.stringify(
      new Date().toISOString().slice(0, 16).replace("T", " ")
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // O registro é feito em src/main.tsx (recarrega ao ativar e checa no foco).
      injectRegister: null,
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon.svg"],
      manifest: {
        name: "Kaizen",
        short_name: "Kaizen",
        description: "Sua rotina, evoluindo todo dia.",
        theme_color: "#0a0a0c",
        background_color: "#0a0a0c",
        display: "standalone",
        orientation: "portrait",
        scope: "/kaizen/",
        start_url: "/kaizen/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
