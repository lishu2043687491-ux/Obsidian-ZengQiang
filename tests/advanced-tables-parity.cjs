const assert = require("node:assert/strict");

const {
  exportAdvancedTableCsvFromText,
  normalizeAdvancedTableSettings,
  runAdvancedTableOperationOnText,
} = require("./advanced-table-helpers-bundle.cjs");

function run(text, cursor, operation, settings) {
  const result = runAdvancedTableOperationOnText(text, cursor, operation, settings);
  assert.equal(result.handled, true, `${operation} should handle a table cursor`);
  return result;
}

{
  const result = run("| A | B |\n| --- | --- |\n| x | longer |", { line: 0, ch: 2 }, "format-table");
  assert.equal(result.text, "| A | B |\n| --- | --- |\n| x | longer |");
}

{
  const padded =
    "| A                 | B      |\n" +
    "| ----------------- | ------ |\n" +
    "| short             | value  |";
  const result = run(padded, { line: 2, ch: 3 }, "format-table", { formatType: "weak" });
  assert.equal(result.text, "| A | B |\n| --- | --- |\n| short | value |");
  assert.doesNotMatch(result.text, / {8,}/, "light formatting should remove long padding spaces");
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 2 |\n| Ann | 10 |", { line: 2, ch: 3 }, "next-cell");
  assert.equal(result.cursor.line, 2);
  assert.ok(result.cursor.ch > 3, "next-cell should move to the next cell");
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 2 |\n| Ann | 10 |", { line: 2, ch: 3 }, "previous-cell");
  assert.equal(result.cursor.line, 0);
  assert.ok(result.cursor.ch > 3, "previous-cell from first body cell should wrap to the previous row");
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 2 |", { line: 2, ch: 3 }, "next-row");
  assert.equal(result.cursor.line, 3);
  assert.match(result.text, /\|\s+\|\s+\|$/);
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 2 |\n| Ann | 10 |", { line: 2, ch: 3 }, "insert-row");
  assert.match(result.text, /\|\s+\|\s+\|\n\| Bob/);
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 2 |", { line: 2, ch: 3 }, "insert-column");
  assert.match(result.text, /^\|\s+\| Name \| Score \|/);
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 2 |\n| Ann | 10 |", { line: 2, ch: 3 }, "move-row-down");
  assert.ok(result.text.indexOf("| Ann") < result.text.indexOf("| Bob"));
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 10 |\n| Ann | 2 |", { line: 2, ch: 10 }, "sort-rows-ascending");
  assert.ok(result.text.indexOf("| Ann") < result.text.indexOf("| Bob"));
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 10 |\n| Ann | 2 |", { line: 2, ch: 10 }, "sort-rows-descending");
  assert.ok(result.text.indexOf("| Bob") < result.text.indexOf("| Ann"));
}

{
  const result = run("| Name | Score |\n| --- | --- |\n| Bob | 2 |\n| Ann | 10 |", { line: 2, ch: 3 }, "transpose");
  assert.match(result.text, /^\| Name\s+\| Bob \| Ann \|/);
  assert.match(result.text, /\| Score \| 2\s+\| 10\s+\|/);
}

{
  const formulaTable =
    "| Item | Value |\n" +
    "| --- | ---: |\n" +
    "| A | 2 |\n" +
    "| B | 3 |\n" +
    "| Total |  |\n" +
    "<!-- TBLFM: @>$2=sum(@I..@-1) -->";
  const result = run(formulaTable, { line: 5, ch: 10 }, "evaluate-formulas");
  assert.match(result.text, /\| Total \|\s+5 \|/);
}

{
  const table = "| Name | Score |\n| --- | --- |\n| Bob | 2 |\n| Ann | 10 |";
  assert.equal(exportAdvancedTableCsvFromText(table, { line: 2, ch: 3 }, false), "Bob\t2\nAnn\t10");
  assert.equal(exportAdvancedTableCsvFromText(table, { line: 2, ch: 3 }, true), "Name\tScore\n---\t---\nBob\t2\nAnn\t10");
}

{
  assert.deepEqual(normalizeAdvancedTableSettings({ bindTab: false, formatType: "weak" }), {
    bindTab: false,
    bindEnter: true,
    formatType: "weak",
    showRibbonIcon: false,
  });
}

{
  assert.deepEqual(normalizeAdvancedTableSettings({ bindEnter: false, showRibbonIcon: true }), {
    bindTab: true,
    bindEnter: false,
    formatType: "weak",
    showRibbonIcon: true,
  });
}

console.log("advanced tables parity passed");
