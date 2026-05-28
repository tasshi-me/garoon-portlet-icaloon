import { en } from "./en";
import { ja } from "./ja";
import type { Messages } from "./messages";

type Params = Record<string, string | number>;

const dictionaries: Record<string, Messages> = { ja, en };

let current: Messages = en;

export function detectAndSetLocale(): string {
  const raw =
    document.documentElement.lang || (typeof navigator !== "undefined" ? navigator.language : "");
  const base = (raw || "en").toLowerCase().split("-")[0] ?? "en";
  if (base in dictionaries) {
    const picked = dictionaries[base];
    if (picked) {
      current = picked;
      return base;
    }
  }
  current = en;
  return "en";
}

export function t<K extends keyof Messages>(key: K, params?: Params): string {
  let s = current[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, String(v));
    }
  }
  return s;
}
