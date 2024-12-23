import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/puzzle": {
        target: "http://0.0.0.0:8000",
        changeOrigin: true,
        secure: false,
      },
      "/submit_guess": {
        target: "http://0.0.0.0:8000",
        changeOrigin: true,
        secure: false,
      },
      "/next_puzzle": {
        target: "http://0.0.0.0:8000",
        changeOrigin: true,
        secure: false,
      },
      "/reset_puzzle": {
        target: "http://0.0.0.0:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
