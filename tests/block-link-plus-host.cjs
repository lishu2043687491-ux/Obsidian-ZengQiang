/**
 * 块 ID 防误删、锚点查找与删除的纯逻辑冒烟
 */
const assert = require("node:assert/strict");

const STANDALONE_BLOCK_ID_LINE_RE = /^\^[a-zA-Z0-9-]{3,7}\s*$/;
const INLINE_TRAILING_BLOCK_ID_RE = /\s+\^[a-zA-Z0-9-]{3,7}$/;
const INLINE_TRAILING_BLOCK_ID_CAPTURE_RE = /(\s+\^[a-zA-Z0-9-]{3,7})$/;

function normalizeLineText(text) {
  return String(text).replace(/\u200b/g, "");
}

function countStandaloneBlockIdLines(lines) {
  let count = 0;
  for (const raw of lines) {
    const text = normalizeLineText(raw).trim();
    if (STANDALONE_BLOCK_ID_LINE_RE.test(text)) count += 1;
  }
  return count;
}

function trailingBlockIdsInLines(lines) {
  const ids = [];
  for (const raw of lines) {
    const match = normalizeLineText(raw).match(INLINE_TRAILING_BLOCK_ID_RE);
    if (match) ids.push(match[0].trim());
  }
  return ids;
}

function wouldDamageAnchors(before, after) {
  if (countStandaloneBlockIdLines(after) < countStandaloneBlockIdLines(before)) return true;
  const oldTrailing = trailingBlockIdsInLines(before);
  const newTrailing = trailingBlockIdsInLines(after);
  return oldTrailing.some((id) => !newTrailing.includes(id));
}

function findRemovableAnchorNearLine(lines, centerLine) {
  const scanFrom = Math.max(0, centerLine - 1);
  const scanTo = Math.min(lines.length - 1, centerLine + 4);
  for (let line = scanFrom; line <= scanTo; line++) {
    const raw = normalizeLineText(lines[line] ?? "");
    const trimmed = raw.trim();
    if (STANDALONE_BLOCK_ID_LINE_RE.test(trimmed)) {
      return { kind: "standalone", line };
    }
    const trailing = raw.match(INLINE_TRAILING_BLOCK_ID_CAPTURE_RE);
    if (trailing) {
      const token = trailing[1];
      const to = raw.length;
      const from = Math.max(0, to - token.length);
      return { kind: "trailing", line, from, to };
    }
  }
  return null;
}

assert.equal(
  wouldDamageAnchors(["段落正文 ^abc1", "^xyz9"], ["段落正文", "^xyz9"]),
  true,
  "删除段末内联 ^id 应被拦截"
);

assert.equal(
  wouldDamageAnchors(["段落", "^abc1"], ["段落"]),
  true,
  "删除独占 ^ 行应被拦截"
);

assert.equal(
  wouldDamageAnchors(["段落 ^abc1"], ["段落 ^abc1", "新增"]),
  false,
  "在锚点之外增删内容不应误拦"
);

const lines = ["图文段落", "", "![图](a.png)", "", "^6twt"];
const anchor = findRemovableAnchorNearLine(lines, 0);
assert.equal(anchor?.kind, "standalone", "应找到段后独占锚点行");
assert.equal(anchor?.line, 4, "独占锚点应在第 5 行");

const inlineLines = ["正文结尾 ^ab12"];
const inlineAnchor = findRemovableAnchorNearLine(inlineLines, 0);
assert.equal(inlineAnchor?.kind, "trailing", "应识别段末内联锚点");

console.log("block-link-plus-host logic test passed");
