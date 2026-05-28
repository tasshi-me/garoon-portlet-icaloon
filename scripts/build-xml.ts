import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname ?? ".", "..");
const distDir = resolve(root, "dist");
const jsPath = resolve(distDir, "icaroon.iife.js");
const cssPath = resolve(distDir, "icaroon.css");
const outPath = resolve(distDir, "iCaroon.xml");

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
  <name><![CDATA[iCaroon]]></name>
  <type>grn.portal.html</type>
  <version>1</version>
  <source>${wrapCdata(source)}</source>
  <available_myportal>1</available_myportal>
  <editor>0</editor>
  <files count="0"/>
 </html_portlet>
</html_portlets>
`;

writeFileSync(outPath, xml, "utf8");

const sizeKb = (xml.length / 1024).toFixed(1);
console.log(`Wrote ${outPath} (${sizeKb} KB)`);

function wrapCdata(content: string): string {
  const safe = content.replaceAll("]]>", "]]]]><![CDATA[>");
  return `<![CDATA[${safe}]]>`;
}
