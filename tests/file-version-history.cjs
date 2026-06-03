const assert = require("node:assert/strict");

function normalizePath(p) {
  return String(p).replace(/\\/g, "/");
}

function encodePath(filePath) {
  return encodeURIComponent(normalizePath(filePath)).replace(/%/g, "_");
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

assert.ok(encodePath("a/b.md").includes("_"));
assert.notEqual(hashContent("a"), hashContent("b"));
assert.match(computeLineDiff("a\nb", "a\nc"), /^-/m);

console.log("file-version-history.cjs OK");
