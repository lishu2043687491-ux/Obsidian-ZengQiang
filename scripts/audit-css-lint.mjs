import fs from "node:fs";

const cssFiles = ["styles.css", "src/modules/native-table-enhancer-embedded.css"];

const allowedImportantPatterns = [
  /marker-line/,
  /hidden-marker-line/,
  /fdtb-style-marker-line/,
  /fdtb-hide-inline-block-ids/,
  /fdtb-reveal-block-ids/,
  /blp-inline-edit-/,
  /blp-hidden-standalone-block-id/,
  /blp-file-outliner-editor/,
  /blp-folder-reveal-highlight/,
];

const allowedHasPatterns = [
  {
    pattern: /p:has\(br\)/,
    reason: "block-link-plus 文件大纲里仅用于处理段内换行，保留为低频局部选择器",
  },
];

function lineMatchesAny(line, patterns) {
  return patterns.some((pattern) => pattern.test(line));
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  let selectorBuffer = "";
  let currentSelector = "";
  const result = {
    filePath,
    important: [],
    allowedImportant: [],
    has: [],
    allowedHas: [],
    textDecorationLine: [],
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("/*") && !trimmed.startsWith("@") && !trimmed.includes("{") && currentSelector === "") {
      selectorBuffer = `${selectorBuffer} ${trimmed}`.trim();
    }
    if (line.includes("{")) {
      const selectorPart = line.slice(0, line.indexOf("{")).trim();
      currentSelector = `${selectorBuffer} ${selectorPart}`.trim();
      selectorBuffer = "";
    }
    if (line.includes("!important")) {
      const context = `${currentSelector} ${line}`;
      const target = lineMatchesAny(context, allowedImportantPatterns) ? result.allowedImportant : result.important;
      target.push({ lineNumber, line: trimmed, selector: currentSelector });
    }
    if (line.includes(":has(")) {
      const allowed = allowedHasPatterns.find((item) => item.pattern.test(line));
      if (allowed) {
        result.allowedHas.push({ lineNumber, line: trimmed, reason: allowed.reason });
      } else {
        result.has.push({ lineNumber, line: trimmed });
      }
    }
    if (line.includes("text-decoration-line")) {
      result.textDecorationLine.push({ lineNumber, line: trimmed });
    }
    if (line.includes("}")) {
      currentSelector = "";
      selectorBuffer = "";
    }
  });

  return result;
}

const results = cssFiles.map(analyzeFile);
const totals = results.reduce(
  (acc, result) => {
    acc.important += result.important.length;
    acc.allowedImportant += result.allowedImportant.length;
    acc.has += result.has.length;
    acc.allowedHas += result.allowedHas.length;
    acc.textDecorationLine += result.textDecorationLine.length;
    return acc;
  },
  { important: 0, allowedImportant: 0, has: 0, allowedHas: 0, textDecorationLine: 0 }
);

console.log("CSS audit summary:");
console.log(JSON.stringify(totals, null, 2));

for (const result of results) {
  console.log(`\n${result.filePath}`);
  console.log(`  !important: ${result.important.length} active, ${result.allowedImportant.length} allowlisted`);
  console.log(`  :has: ${result.has.length} active, ${result.allowedHas.length} allowlisted`);
  console.log(`  text-decoration-line: ${result.textDecorationLine.length}`);
  for (const item of result.has) {
    console.log(`  active :has ${item.lineNumber}: ${item.line}`);
  }
  for (const item of result.important) {
    console.log(`  active !important ${item.lineNumber}: ${item.selector} => ${item.line}`);
  }
  for (const item of result.textDecorationLine) {
    console.log(`  text-decoration-line ${item.lineNumber}: ${item.line}`);
  }
}

if (totals.textDecorationLine > 0) {
  console.error("CSS audit failed: text-decoration-line should be replaced with text-decoration.");
  process.exitCode = 1;
}
