const assert = require("node:assert/strict");
const {
  buildNativeAutoFillValues,
  containsNativeLatex,
  evaluateNativeTableFormula,
} = require("./native-table-video-helpers-bundle.cjs");

const table = [
  ["序号", "列1", "列2", "列3"],
  ["1", "A1", "31", ""],
  ["2", "A2", "25", ""],
  ["3", "A3", "-25", ""],
  ["合计", "", "=sum", "=avg(C2:C4)"],
];

assert.deepEqual(buildNativeAutoFillValues(["A1"], 5), ["A2", "A3", "A4", "A5", "A6"]);
assert.deepEqual(buildNativeAutoFillValues(["1"], 3), ["2", "3", "4"]);
assert.deepEqual(buildNativeAutoFillValues(["-25"], 3), ["-24", "-23", "-22"]);
assert.deepEqual(buildNativeAutoFillValues(["纯文字"], 3), ["纯文字", "纯文字", "纯文字"]);
assert.deepEqual(buildNativeAutoFillValues(["A6"], 3, -1), ["A5", "A4", "A3"]);

assert.equal(evaluateNativeTableFormula("=sum", table, { row: 4, col: 2 }).value, "31");
assert.equal(evaluateNativeTableFormula("=avg(C2:C4)", table, { row: 4, col: 3 }).value, "10.333333");
assert.equal(evaluateNativeTableFormula("=min(C2:C4)", table, { row: 4, col: 3 }).value, "-25");
assert.equal(evaluateNativeTableFormula("=max(C2:C4)", table, { row: 4, col: 3 }).value, "31");
assert.equal(evaluateNativeTableFormula("=sum(A1:B2)", table, { row: 4, col: 1 }).value, "1");
assert.equal(evaluateNativeTableFormula("=evil(1)", table, { row: 4, col: 1 }), null);

assert.equal(containsNativeLatex("$a^2+b^2=c^2$"), true);
assert.equal(containsNativeLatex("plain text"), false);

console.log("native-table-video-helpers smoke passed");
