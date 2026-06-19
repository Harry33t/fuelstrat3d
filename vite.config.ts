import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 展示站构建配置。base 设为相对,方便部署到 GitHub Pages 子路径。
export default defineConfig({
  plugins: [react()],
  base: "./",
});
