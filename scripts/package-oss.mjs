import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const version = String(manifest.version || "0.0.0");
const distDir = path.join(root, "dist");
const packageName = `Obsidian-ZengQiang-${version}`;
const packageDir = path.join(distDir, packageName);
const zipPath = path.join(distDir, `${packageName}.zip`);

fs.rmSync(packageDir, { recursive: true, force: true });
fs.mkdirSync(packageDir, { recursive: true });
for (const fileName of ["main.js", "manifest.json", "styles.css"]) {
  fs.copyFileSync(path.join(root, fileName), path.join(packageDir, fileName));
}
fs.rmSync(zipPath, { force: true });
childProcess.execFileSync("/usr/bin/zip", ["-qry", path.basename(zipPath), packageName], {
  cwd: distDir,
  stdio: "inherit",
});

console.log(JSON.stringify({ ok: true, zipPath, packageDir }, null, 2));
