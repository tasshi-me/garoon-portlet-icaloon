import "./styles.css";
import { detectAndSetLocale, t } from "./i18n";
import { mount } from "./ui";

function init() {
  detectAndSetLocale();
  const root = document.getElementById("icaroon-root");
  if (!root) {
    console.warn(t("rootNotFound"));
    return;
  }
  mount(root);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
