import { render } from "preact";
import "./styles.css";
import { detectAndSetLocale, t } from "./i18n";
import { App } from "./ui";

function init() {
  detectAndSetLocale();
  const root = document.getElementById("icaroon-root");
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
