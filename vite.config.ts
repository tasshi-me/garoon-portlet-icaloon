import { readFileSync } from "node:fs";
import https from "node:https";
import { resolve } from "node:path";
import preact from "@preact/preset-vite";
import { defineConfig, loadEnv } from "vite";
import { licensesPlugin } from "./scripts/vite-plugin-licenses";

const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8")) as {
  version: string;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [preact(), licensesPlugin(__dirname)],
    build: {
      target: "es2020",
      outDir: "dist",
      emptyOutDir: true,
      cssCodeSplit: false,
      lib: {
        entry: resolve(__dirname, "src/main.tsx"),
        name: "ICaloon",
        formats: ["iife"],
        fileName: () => "icaloon.iife.js",
      },
      rollupOptions: {
        output: {
          assetFileNames: "icaloon.css",
          inlineDynamicImports: true,
        },
      },
      minify: "esbuild",
      sourcemap: false,
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
      __APP_VERSION__: JSON.stringify(pkg.version),
      // proxy モードの garoon shim が使うログインユーザーコード。パスワードは埋め込まない
      __DEV_LOGIN_USER_CODE__: JSON.stringify(env.GAROON_USERNAME ?? ""),
    },
    server: {
      // Garoon ページ内に挿入した開発用ポートレットから読み込めるよう、
      // ポートを固定し、生成する URL と HMR を絶対 URL（localhost:5173）にする
      port: 5173,
      strictPort: true,
      cors: true,
      origin: "http://localhost:5173",
      proxy: env.GAROON_BASE_URL
        ? {
            "/g/api": {
              target: env.GAROON_BASE_URL.replace(/\/+$/, ""),
              changeOrigin: true,
              headers: {
                "X-Cybozu-Authorization": Buffer.from(
                  `${env.GAROON_USERNAME}:${env.GAROON_PASSWORD}`,
                ).toString("base64"),
              },
              // セキュアアクセス（<subdomain>.s.cybozu.com）はクライアント証明書が必要
              agent: env.GAROON_PFX_PATH
                ? new https.Agent({
                    pfx: readFileSync(env.GAROON_PFX_PATH),
                    passphrase: env.GAROON_PFX_PASSPHRASE,
                  })
                : undefined,
            },
          }
        : undefined,
    },
  };
});
