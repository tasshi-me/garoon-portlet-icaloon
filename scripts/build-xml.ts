// vite build の成果物 (icaroon.iife.js / icaroon.css) から
// Garoon の HTML ポートレット用の成果物を生成する（ファイル名にバージョン＋ビルド日時）:
//   - dist/icaroon_v<version>_<日時>.xml   「XMLファイルから読み込む」でインポートする XML
//   - dist/icaroon_v<version>_<日時>.html  既存ポートレットの内容欄に貼り付ける HTML 断片
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname ?? ".", "..");
const distDir = resolve(root, "dist");
const jsPath = resolve(distDir, "icaroon.iife.js");
const cssPath = resolve(distDir, "icaroon.css");

const { version } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  version: string;
};
// どのビルドが載っているか分かるよう、バージョンとビルド日時（JST・分単位）を名前に入れる
const builtAt = new Date().toLocaleString("sv-SE", {
  timeZone: "Asia/Tokyo",
  dateStyle: "short",
  timeStyle: "short",
});
const portletName = `iCaroon v${version} (${builtAt})`;

const js = readFileSync(jsPath, "utf8");
const css = readFileSync(cssPath, "utf8");

const source = [
  `<style>${css}</style>`,
  `<div id="icaroon-root"></div>`,
  `<script>${js}</script>`,
].join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<html_portlets>
 <html_portlet>
  <name>${wrapCdata(portletName)}</name>
  <type>grn.portal.html</type>
  <version>1</version>
  <source>${wrapCdata(source)}</source>
  <available_myportal>1</available_myportal>
  <editor>0</editor>
  <files count="0"/>
 </html_portlet>
</html_portlets>
`;

// ファイル名にはコロンとスペースを使わない
const stamp = builtAt.replace(" ", "-").replaceAll(":", "");
const base = `icaroon_v${version}_${stamp}`;
const xmlPath = resolve(distDir, `${base}.xml`);
const htmlPath = resolve(distDir, `${base}.html`);

writeFileSync(xmlPath, xml, "utf8");
writeFileSync(htmlPath, source, "utf8");

console.log(`Wrote ${xmlPath} (${sizeKb(xml)})`);
console.log(`Wrote ${htmlPath} (${sizeKb(source)})`);

function wrapCdata(content: string): string {
  const safe = content.replaceAll("]]>", "]]]]><![CDATA[>");
  return `<![CDATA[${safe}]]>`;
}

function sizeKb(content: string): string {
  return `${(Buffer.byteLength(content, "utf8") / 1024).toFixed(1)} KB`;
}
