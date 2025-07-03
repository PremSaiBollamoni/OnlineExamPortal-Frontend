import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const apiUrl = process.env.VITE_API_URL || 'https://onlineexamportal-backend.onrender.com';
  console.log('Build Mode:', mode);
  console.log('API URL:', apiUrl);
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Ensure credentials are included
              proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
              if (req.headers.cookie) {
                proxyReq.setHeader('Cookie', req.headers.cookie);
              }
            });
          }
        }
      }
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  };
});
