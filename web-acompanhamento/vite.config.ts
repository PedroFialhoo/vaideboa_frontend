import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "GOOGLE_MAPS_API_KEY");
  return {
    // Somente a chave pública do mapa é exposta; as outras variáveis permanecem privadas.
    define: {
      "import.meta.env.GOOGLE_MAPS_API_KEY": JSON.stringify(process.env.GOOGLE_MAPS_API_KEY ?? env.GOOGLE_MAPS_API_KEY ?? ""),
    },
  };
});
