import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { config } from "dotenv";
const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  config({ path: "./.env.production" });
} else {
  config();
}
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: process.env.DIST_FOLDER,
  },
});
