/**
 * 路径规范化：半角/全角冒号、NFC 后哈希键一致
 */
const assert = require("node:assert/strict");

function normalizePath(p) {
  return String(p).replace(/\\/g, "/");
}

function canonicalizeVaultPath(filePath) {
  let p = normalizePath(String(filePath).trim());
  try {
    p = p.normalize("NFC");
  } catch {
    // ignore
  }
  return p.replace(/:/g, "：");
}

function hashContent(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function hashStorageKey(filePath) {
  const normalized = canonicalizeVaultPath(filePath);
  let out = "";
  for (let round = 0; round < 5; round += 1) {
    out += hashContent(`fv-hash:${round}:${normalized}:${out}`);
  }
  return `h_${out.replace(/[^a-z0-9]/gi, "x").slice(0, 32)}`;
}

function pathsMatch(a, b) {
  const ca = canonicalizeVaultPath(a);
  const cb = canonicalizeVaultPath(b);
  if (ca === cb) return true;
  return (ca.split("/").pop() ?? ca) === (cb.split("/").pop() ?? cb);
}

const full =
  "❶可迁移（new）/200通用能力/210个体能力/213表达力/3️⃣我的实践/02讲可信/场景实践/场景1：youcore学员证言.md";
const half = full.replace(/：/g, ":");

assert.ok(pathsMatch(full, half), "colon variants should match basename");
assert.equal(hashStorageKey(full), hashStorageKey(half), "hash key must match after canonicalize");
assert.ok(hashStorageKey("YOLO/skills/a.md").startsWith("h_"), "all paths use h_ key");

console.log("file-version-history-path.cjs OK");
