import { render } from "preact";
import "./styles.css";
import { detectAndSetLocale, t } from "./i18n";
import { App } from "./ui";

async function init() {
  // ローカル開発時は garoon グローバルが無いので代替を差し込む（本番ビルドでは除去される）
  if (import.meta.env.DEV && !window.garoon) {
    const { installGaroonShim } = await import("./dev/garoon-shim");
    installGaroonShim();
  }
  detectAndSetLocale();
  const root = document.getElementById("icaloon-root");
  if (!root) {
    console.warn(t("rootNotFound"));
    return;
  }
  render(<App />, root);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
