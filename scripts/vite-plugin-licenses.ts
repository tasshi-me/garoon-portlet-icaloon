// バンドルに含まれる本番依存の OSS ライセンスを、仮想モジュール `virtual:licenses` として提供する。
// ビルドのたびに `pnpm licenses list --prod` から生成するので、依存を更新しても一覧が古くならない。
// MPL 2.0 (ical.js) は実行形式で配布する際にソースの入手方法を示す必要があるため、sourceUrl も含める。
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:licenses";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

type LicenseEntry = {
  name: string;
  version: string;
  license: string;
  licenseText: string;
  sourceUrl: string;
};

type PnpmLicensePackage = {
  name: string;
  versions: string[];
  paths: string[];
  license: string;
};

export function licensesPlugin(root: string): Plugin {
  return {
    name: "icaloon:licenses",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      const appLicenseText = readFileSync(resolve(root, "LICENSE"), "utf8").trim();
      return [
        `export const appLicenseText = ${JSON.stringify(appLicenseText)};`,
        `export const licenses = ${JSON.stringify(collectLicenses(root))};`,
      ].join("\n");
    },
  };
}

function collectLicenses(root: string): LicenseEntry[] {
  const output = execFileSync("pnpm", ["licenses", "list", "--prod", "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  const byLicense = JSON.parse(output) as Record<string, PnpmLicensePackage[]>;
  return Object.values(byLicense)
    .flat()
    .flatMap((pkg) =>
      pkg.versions.map((version, i) => ({
        name: pkg.name,
        version,
        license: pkg.license,
        licenseText: readLicenseText(pkg.paths[i]),
        sourceUrl: readSourceUrl(pkg.paths[i], pkg.name, version),
      })),
    )
    .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

function readLicenseText(dir: string | undefined): string {
  if (!dir) return "";
  const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f));
  return file ? readFileSync(join(dir, file), "utf8").trim() : "";
}

// package.json の repository（無ければ homepage、それも無ければ npm のページ）をブラウザで開ける URL にする
function readSourceUrl(dir: string | undefined, name: string, version: string): string {
  const npmUrl = `https://www.npmjs.com/package/${name}/v/${version}`;
  if (!dir) return npmUrl;
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
    repository?: string | { url?: string };
    homepage?: string;
  };
  const repo = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  return (repo && normalizeRepositoryUrl(repo)) || pkg.homepage || npmUrl;
}

function normalizeRepositoryUrl(repo: string): string | undefined {
  // "owner/repo" や "github:owner/repo" の省略形
  const shorthand = /^(?:github:)?([\w.-]+\/[\w.-]+)$/.exec(repo);
  if (shorthand) return `https://github.com/${shorthand[1]}`;
  const url = repo
    .replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/^git@([^:]+):/, "https://$1/")
    .replace(/\.git$/, "");
  return url.startsWith("https://") ? url : undefined;
}
