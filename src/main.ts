import "./styles.css";
import { mount } from "./ui";

function init() {
  const root = document.getElementById("icaroon-root");
  if (!root) {
    console.warn("[iCaroon] #icaroon-root が見つかりません");
    return;
  }
  mount(root);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
