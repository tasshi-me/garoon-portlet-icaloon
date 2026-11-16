/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: "mock" | "proxy";
}

// proxy モードで使うログインユーザーコード（vite.config.ts の define で注入）
declare const __DEV_LOGIN_USER_CODE__: string;

// package.json の version（vite.config.ts の define で注入）
declare const __APP_VERSION__: string;
