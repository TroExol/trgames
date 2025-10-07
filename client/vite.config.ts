import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      ViteImageOptimizer({
        png: { quality: 80 },
        jpeg: { quality: 75 },
        webp: { quality: 80 },
      }),
    ],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Expose environment variables to client
      __API_BASE_URL__: JSON.stringify(env.VITE_API_BASE_URL),
    },
  };
});
