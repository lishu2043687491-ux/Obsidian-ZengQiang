#!/usr/bin/env node
/**
 * 打包 Obsidian增强体验 为可安装的独立插件目录（release/dist/feishu-doc-toolbar）。
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "release", "dist", "feishu-doc-toolbar");

const files = [
  { src: "main.js", required: true },
  { src: "styles.css", required: true },
  { src: "manifest.json", required: true },
  { src: "README.md", required: false },
  { src: "LICENSE", required: false },
];

fs.mkdirSync(outDir, { recursive: true });

for (const item of files) {
  const from = path.join(root, item.src);
  if (!fs.existsSync(from)) {
    if (item.required) {
      console.error(`缺少必需文件: ${item.src}，请先 npm run build`);
      process.exit(1);
    }
    continue;
  }
  fs.copyFileSync(from, path.join(outDir, item.src));
}

const manifest = JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
const stats = fs.statSync(path.join(outDir, "main.js"));
console.log(`已打包: ${outDir}`);
console.log(`  插件 id: ${manifest.id}`);
console.log(`  版本: ${manifest.version}`);
console.log(`  main.js: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
