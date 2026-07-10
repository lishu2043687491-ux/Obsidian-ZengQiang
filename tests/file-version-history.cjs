const assert = require("node:assert/strict");

function normalizePath(p) {
  return String(p).replace(/\\/g, "/");
}

const MAX_LEGACY_ENCODED_LEN = 200;

function encodePath(filePath) {
  return encodeURIComponent(normalizePath(filePath)).replace(/%/g, "_");
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

function hashStorageKey(filePath) {
  const normalized = canonicalizeVaultPath(filePath);
  let out = "";
  for (let round = 0; round < 5; round += 1) {
    out += hashContent(`fv-hash:${round}:${normalized}:${out}`);
  }
  return `h_${out.replace(/[^a-z0-9]/gi, "x").slice(0, 32)}`;
}

function primaryStorageKey(filePath) {
  return hashStorageKey(filePath);
}

function hashContent(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function computeLineDiff(before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  const lines = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      if (left !== undefined) lines.push(` ${left}`);
      continue;
    }
    if (left !== undefined) lines.push(`-${left}`);
    if (right !== undefined) lines.push(`+${right}`);
  }
  return lines.join("\n");
}

const DEEP_PATH =
  "❶可迁移（new）/200通用能力/210个体能力/213表达力/3️⃣我的实践/02讲可信/场景实践/场景1：youcore学员证言.md";

assert.ok(encodePath("a/b.md").includes("_"));
assert.notEqual(hashContent("a"), hashContent("b"));
assert.match(computeLineDiff("a\nb", "a\nc"), /^-/m);
assert.ok(encodePath(DEEP_PATH).length > 255, "deep path legacy key should exceed fs limit");
const shortKey = primaryStorageKey(DEEP_PATH);
assert.ok(shortKey.startsWith("h_"), "all paths use hash storage key");
assert.ok(shortKey.length <= 40, `hash key too long: ${shortKey.length}`);
assert.notEqual(primaryStorageKey("a/b.md"), primaryStorageKey("a/c.md"));
assert.equal(primaryStorageKey("short.md").startsWith("h_"), true, "short path also uses h_");

console.log("file-version-history.cjs OK");
