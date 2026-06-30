var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/modules/goal-progress-sync.ts
var goal_progress_sync_exports = {};
__export(goal_progress_sync_exports, {
  GOAL_PROGRESS_PLAN_ROOT_PATH: () => GOAL_PROGRESS_PLAN_ROOT_PATH,
  GOAL_PROGRESS_REVIEW_PATH: () => GOAL_PROGRESS_REVIEW_PATH,
  GOAL_PROGRESS_SYNC_END: () => GOAL_PROGRESS_SYNC_END,
  GOAL_PROGRESS_SYNC_START: () => GOAL_PROGRESS_SYNC_START,
  GOAL_PROGRESS_TARGET_PATH: () => GOAL_PROGRESS_TARGET_PATH,
  buildGoalProgressEntries: () => buildGoalProgressEntries,
  buildGoalProgressSyncUpdate: () => buildGoalProgressSyncUpdate,
  countGoalProgressSyncBlocks: () => countGoalProgressSyncBlocks,
  renderGoalProgressSyncBlock: () => renderGoalProgressSyncBlock
});
module.exports = __toCommonJS(goal_progress_sync_exports);
var GOAL_PROGRESS_OSS = false;
var GOAL_PROGRESS_REVIEW_PATH = GOAL_PROGRESS_OSS ? "reviews/weekly-review.example.md" : "\u2777\u81EA\u6211\u7BA1\u7406/3\uFE0F\u20E3\u6211\u7684\u5B9E\u64CD/4 \u590D\u76D8/\u65E5\u590D\u76D826.4.1\uFF08\u6700\u65B0\uFF09.md";
var GOAL_PROGRESS_TARGET_PATH = GOAL_PROGRESS_OSS ? "goals/annual-progress.example.md" : "\u2777\u81EA\u6211\u7BA1\u7406/3\uFE0F\u20E3\u6211\u7684\u5B9E\u64CD/1\u76EE\u6807/2026\u5E74 \u76EE\u6807\u8FDB\u5C55.md";
var GOAL_PROGRESS_PLAN_ROOT_PATH = GOAL_PROGRESS_OSS ? "plans/weekly" : "\u2777\u81EA\u6211\u7BA1\u7406/3\uFE0F\u20E3\u6211\u7684\u5B9E\u64CD/2\u8BA1\u5212/\u6BCF\u5468\u8BA1\u5212\u8FDB\u5C55";
var GOAL_PROGRESS_SYNC_START = "<!-- goal-progress-sync:start -->";
var GOAL_PROGRESS_SYNC_END = "<!-- goal-progress-sync:end -->";
var REVIEW_HEADING_RE = /^##\s+((\d{1,2})\.(\d{1,2})(?:\s*[-—~至]\s*\d{1,2})?\s*(?:日)?(?:周复盘|日周复盘))\s*$/gm;
var WEEK_NUMBER_LABELS = ["", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"];
var TARGET_SECTION_RULES = [
  { category: "\u5DE5\u4F5C", heading: /^#\s*一[、.]\s*工作目标/m, columns: 5 },
  { category: "\u751F\u6D3B\u5065\u5EB7", heading: /^#\s*二[、.]\s*生活目标/m, columns: 4 },
  { category: "\u627E\u5BF9\u8C61", heading: /^#\s*三[、.].*(找女朋友|找对象).*目标/m, columns: 4 }
];
function buildGoalProgressEntries(options) {
  const planFiles = options.planFiles ?? [];
  const reviewPath = options.reviewPath ?? GOAL_PROGRESS_REVIEW_PATH;
  const sections = parseReviewSections(options.reviewText, planFiles);
  const entries = [];
  for (const section of sections) {
    const tableRows = parseFirstGoalTable(section.text);
    for (const row of tableRows) {
      entries.push({
        weekLabel: section.heading,
        category: row.category,
        goal: row.goal,
        actual: row.actual,
        gap: row.gap,
        reviewPath,
        planPath: section.planPath
      });
    }
  }
  return entries;
}
function buildGoalProgressSyncUpdate(options) {
  const entries = buildGoalProgressEntries(options);
  const warnings = [];
  if (entries.length === 0) {
    return {
      ok: false,
      targetText: options.targetText,
      entries,
      warnings: ["\u6CA1\u6709\u8BC6\u522B\u5230\u53EF\u540C\u6B65\u7684\u76EE\u6807\u8FDB\u5C55\u8868"],
      changed: false,
      appendedCount: 0,
      skippedCount: 0,
      reason: "\u672A\u8BC6\u522B\u5230\u5468\u590D\u76D8\u76EE\u6807\u8FDB\u5C55\u8868"
    };
  }
  for (const entry of entries) {
    if (!entry.planPath) {
      warnings.push(`${entry.weekLabel}\uFF1A\u672A\u5339\u914D\u5468\u8BA1\u5212`);
    }
  }
  const cleaned = removeGoalProgressSyncBlock(options.targetText);
  if (!cleaned.ok) {
    return {
      ok: false,
      targetText: options.targetText,
      entries,
      warnings,
      changed: false,
      appendedCount: 0,
      skippedCount: 0,
      reason: cleaned.reason
    };
  }
  const appended = appendEntriesToExistingTargetTables(cleaned.text, entries);
  if (!appended.ok) {
    return {
      ok: false,
      targetText: options.targetText,
      entries,
      warnings,
      changed: false,
      appendedCount: 0,
      skippedCount: 0,
      reason: appended.reason
    };
  }
  return {
    ok: true,
    targetText: appended.text,
    entries,
    warnings,
    changed: appended.text !== options.targetText,
    appendedCount: appended.appendedCount,
    skippedCount: appended.skippedCount
  };
}
function countGoalProgressSyncBlocks(text) {
  return countOccurrences(text, GOAL_PROGRESS_SYNC_START);
}
function renderGoalProgressSyncBlock(entries, options = {}) {
  const grouped = groupEntriesByCategory(entries);
  const generatedAt = options.generatedAt ?? "\u624B\u52A8\u66F4\u65B0";
  const lines = [
    GOAL_PROGRESS_SYNC_START,
    "## \u76EE\u6807\u8FDB\u5C55\u81EA\u52A8\u540C\u6B65",
    "",
    `\u66F4\u65B0\u65F6\u95F4\uFF1A${generatedAt}`,
    "",
    "> \u672C\u533A\u7531\u547D\u4EE4\u300C\u66F4\u65B0\u76EE\u6807\u8FDB\u5C55\u603B\u89C8\u300D\u751F\u6210\uFF1B\u539F\u6709\u624B\u5DE5\u8868\u683C\u4E0D\u4F1A\u88AB\u6539\u52A8\u3002",
    ""
  ];
  for (const category of ["\u5DE5\u4F5C", "\u751F\u6D3B\u5065\u5EB7", "\u627E\u5BF9\u8C61"]) {
    const categoryEntries = grouped.get(category) ?? [];
    lines.push(`### ${category}\u76EE\u6807`, "");
    if (categoryEntries.length === 0) {
      lines.push("\u6682\u65E0\u8BC6\u522B\u5230\u7684\u8FDB\u5C55\u3002", "");
      continue;
    }
    lines.push("| \u5468\u6B21 | \u5468\u76EE\u6807 | \u73B0\u72B6 | \u5DEE\u8DDD | \u6765\u6E90 |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const entry of categoryEntries) {
      lines.push(
        [
          tableCell(entry.weekLabel),
          tableCell(entry.goal),
          tableCell(entry.actual),
          tableCell(entry.gap || "/"),
          tableCell(formatEntrySource(entry))
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
      );
    }
    lines.push("");
  }
  lines.push(GOAL_PROGRESS_SYNC_END);
  return lines.join("\n");
}
function removeGoalProgressSyncBlock(targetText) {
  const start = targetText.indexOf(GOAL_PROGRESS_SYNC_START);
  const end = targetText.indexOf(GOAL_PROGRESS_SYNC_END);
  if (start >= 0 || end >= 0) {
    if (start < 0 || end < 0 || end < start) {
      return { ok: false, reason: "\u76EE\u6807\u9875\u5DF2\u6709\u540C\u6B65\u6807\u8BB0\u4E0D\u5B8C\u6574\uFF0C\u672A\u5199\u5165" };
    }
    const afterEnd = end + GOAL_PROGRESS_SYNC_END.length;
    return {
      ok: true,
      text: `${targetText.slice(0, start)}${targetText.slice(afterEnd)}`.replace(/\n{4,}/g, "\n\n\n")
    };
  }
  return { ok: true, text: targetText };
}
function appendEntriesToExistingTargetTables(targetText, entries) {
  let text = targetText;
  let appendedCount = 0;
  let skippedCount = 0;
  for (const rule of TARGET_SECTION_RULES) {
    const sectionEntries = entries.filter((entry) => entry.category === rule.category);
    if (sectionEntries.length === 0) continue;
    const section = findTargetSection(text, rule.heading);
    if (!section) return { ok: false, reason: `\u76EE\u6807\u9875\u672A\u627E\u5230\u300C${formatCategoryName(rule.category)}\u300D\u533A\u57DF\uFF0C\u672A\u5199\u5165` };
    const table = findFirstMarkdownTable(text.slice(section.start, section.end));
    if (!table) return { ok: false, reason: `\u76EE\u6807\u9875\u300C${formatCategoryName(rule.category)}\u300D\u533A\u57DF\u672A\u627E\u5230\u76EE\u6807\u8868\uFF0C\u672A\u5199\u5165` };
    const absoluteTableEnd = section.start + table.end;
    const existingSectionText = text.slice(section.start, section.end);
    const rows = buildTargetRows(sectionEntries, rule.columns, existingSectionText);
    const rowsToAppend = rows.filter((row) => !row.skip).map((row) => row.line);
    skippedCount += rows.length - rowsToAppend.length;
    if (rowsToAppend.length === 0) continue;
    const prefix = text.slice(0, absoluteTableEnd).replace(/\s*$/, "\n");
    const suffix = text.slice(absoluteTableEnd);
    text = `${prefix}${rowsToAppend.join("\n")}
${suffix}`;
    appendedCount += rowsToAppend.length;
  }
  return { ok: true, text, appendedCount, skippedCount };
}
function findTargetSection(text, heading) {
  const match = heading.exec(text);
  heading.lastIndex = 0;
  if (!match || match.index == null) return null;
  const start = match.index;
  const nextHeading = text.slice(start + 1).search(/^#\s+/m);
  const end = nextHeading < 0 ? text.length : start + 1 + nextHeading;
  return { start, end };
}
function findFirstMarkdownTable(sectionText) {
  const lines = sectionText.split(/\r?\n/);
  let offset = 0;
  for (let index = 0; index < lines.length - 1; index += 1) {
    const lineStart = offset;
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];
    if (isTableLine(headerLine) && isSeparatorRow(separatorLine)) {
      let endLine = index + 2;
      while (endLine < lines.length && isTableLine(lines[endLine])) endLine += 1;
      const end = lines.slice(0, endLine).join("\n").length;
      return { start: lineStart, end };
    }
    offset += headerLine.length + 1;
  }
  return null;
}
function buildTargetRows(entries, columns, existingSectionText) {
  const labelCounts = /* @__PURE__ */ new Map();
  return entries.map((entry) => {
    const label = formatTargetWeekLabel(entry);
    const rowLabel = (labelCounts.get(label) ?? 0) === 0 ? label : "/";
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    const cells = columns === 5 ? [rowLabel, entry.goal, entry.actual, entry.gap || "/", ""] : [rowLabel, entry.goal, entry.actual, entry.gap || "/"];
    return {
      line: `| ${cells.map(tableCell).join(" | ")} |`,
      skip: hasTargetEntry(existingSectionText, entry, label)
    };
  });
}
function hasTargetEntry(sectionText, entry, label) {
  const normalizedSection = normalizeForDuplicateCheck(sectionText);
  const normalizedGoal = normalizeForDuplicateCheck(entry.goal);
  const normalizedActual = normalizeForDuplicateCheck(entry.actual);
  const normalizedLabel = normalizeForDuplicateCheck(label);
  if (entry.category === "\u627E\u5BF9\u8C61" && normalizedSection.includes(normalizedLabel)) return true;
  if (normalizedGoal && normalizedActual) {
    return normalizedSection.includes(normalizedGoal) && normalizedSection.includes(normalizedActual);
  }
  if (normalizedGoal) return normalizedSection.includes(normalizedLabel) && normalizedSection.includes(normalizedGoal);
  return normalizedSection.includes(normalizedLabel);
}
function formatTargetWeekLabel(entry) {
  const planName = entry.planPath ? basenameWithoutMd(entry.planPath) : "";
  const planMatch = normalizePlanName(planName).match(/^(\d{1,2})月第(\d+)周计划$/);
  if (planMatch) return `${Number(planMatch[1])}\u6708\u7B2C${Number(planMatch[2])}\u5468\u76EE\u6807`;
  const reviewMatch = entry.weekLabel.match(/^(\d{1,2})\.(\d{1,2})/);
  if (!reviewMatch) return entry.weekLabel.replace(/周复盘|日周复盘/g, "\u76EE\u6807");
  const month = Number(reviewMatch[1]);
  const day = Number(reviewMatch[2]);
  return `${month}\u6708\u7B2C${getWeekOfMonth(month, day)}\u5468\u76EE\u6807`;
}
function formatCategoryName(category) {
  if (category === "\u751F\u6D3B\u5065\u5EB7") return "\u751F\u6D3B\u76EE\u6807";
  if (category === "\u627E\u5BF9\u8C61") return "\u627E\u5BF9\u8C61\u76EE\u6807";
  return "\u5DE5\u4F5C\u76EE\u6807";
}
function parseReviewSections(text, planFiles) {
  const matches = Array.from(text.matchAll(REVIEW_HEADING_RE));
  const sections = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const heading = normalizeWhitespace(match[1] ?? "");
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!heading || !month || !day) continue;
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
    const sectionText = text.slice(start, end);
    sections.push({
      heading,
      month,
      day,
      text: sectionText,
      planPath: matchPlanPath(sectionText, month, day, planFiles)
    });
  }
  return sections;
}
function parseFirstGoalTable(sectionText) {
  const lines = sectionText.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];
    if (!isTableLine(headerLine) || !isSeparatorRow(separatorLine)) continue;
    const header = splitMarkdownTableRow(headerLine).map(normalizeHeaderCell);
    const indexes = resolveGoalTableIndexes(header);
    if (!indexes) continue;
    const rows = [];
    let lastCategory = null;
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex += 1) {
      const rowLine = lines[rowIndex];
      if (!isTableLine(rowLine)) break;
      if (isSeparatorRow(rowLine)) continue;
      const cells = splitMarkdownTableRow(rowLine);
      const rawCategory = cleanCell(cells[indexes.category] ?? "");
      const goal = cleanCell(cells[indexes.goal] ?? "");
      const actual = cleanCell(cells[indexes.actual] ?? "");
      const gap = cleanCell(cells[indexes.gap] ?? "");
      if (!goal && !actual && !gap) continue;
      const inferred = inferCategory(rawCategory, goal, actual);
      const category = inferred ?? lastCategory;
      if (!category) continue;
      if (rawCategory || inferred) lastCategory = category;
      rows.push({ category, goal, actual, gap });
    }
    return rows;
  }
  return [];
}
function resolveGoalTableIndexes(header) {
  const category = header.findIndex((cell) => cell.includes("\u7C7B\u578B") || cell.includes("\u7EF4\u5EA6"));
  const goal = header.findIndex((cell) => cell.includes("\u76EE\u6807"));
  const actual = header.findIndex((cell) => cell.includes("\u73B0\u72B6"));
  const gap = header.findIndex((cell) => cell.includes("\u5DEE\u8DDD") || cell.includes("\u8FDB\u5C55"));
  if (category < 0 || goal < 0 || actual < 0 || gap < 0) return null;
  return { category, goal, actual, gap };
}
function matchPlanPath(sectionText, month, day, planFiles) {
  if (planFiles.length === 0) return void 0;
  const explicitLinks = Array.from(sectionText.matchAll(/\[\[([^\]]*周计划[^\]]*)\]\]/g)).map((match) => normalizePlanName(match[1] ?? "")).filter(Boolean);
  for (const link of explicitLinks) {
    const explicitMatch = planFiles.find((file) => normalizePlanName(file.basename ?? basename(file.path)) === link);
    if (explicitMatch) return explicitMatch.path;
  }
  const weekNumber = getWeekOfMonth(month, day);
  const candidates = buildPlanNameCandidates(month, weekNumber).map(normalizePlanName);
  const matched = planFiles.find((file) => candidates.includes(normalizePlanName(file.basename ?? basename(file.path))));
  return matched?.path;
}
function buildPlanNameCandidates(month, weekNumber) {
  const chineseWeek = WEEK_NUMBER_LABELS[weekNumber] ?? String(weekNumber);
  return [
    `${month}\u6708\u7B2C${weekNumber}\u5468\u8BA1\u5212`,
    `${month} \u6708\u7B2C${weekNumber}\u5468\u8BA1\u5212`,
    `${month}\u6708\u7B2C ${weekNumber} \u5468\u8BA1\u5212`,
    `${month} \u6708\u7B2C ${weekNumber} \u5468\u8BA1\u5212`,
    `${month}\u6708\u7B2C${chineseWeek}\u5468\u8BA1\u5212`,
    `${month} \u6708\u7B2C${chineseWeek}\u5468\u8BA1\u5212`,
    `${month}\u6708\u7B2C ${chineseWeek} \u5468\u8BA1\u5212`,
    `${month} \u6708\u7B2C ${chineseWeek} \u5468\u8BA1\u5212`
  ];
}
function getWeekOfMonth(month, day) {
  const firstDay = new Date(2026, month - 1, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  return Math.floor((day + mondayOffset - 1) / 7) + 1;
}
function inferCategory(rawCategory, goal, actual) {
  const text = `${rawCategory} ${goal} ${actual}`;
  if (/找对象|女朋友|女生|恋爱/.test(text)) return "\u627E\u5BF9\u8C61";
  if (/生活|健康|体力|睡眠|运动|增肌|拳击/.test(text)) return "\u751F\u6D3B\u5065\u5EB7";
  if (/工作|绩效|直播|企微|投放|收款|月报|汇报/.test(text)) return "\u5DE5\u4F5C";
  return null;
}
function groupEntriesByCategory(entries) {
  const grouped = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }
  return grouped;
}
function formatEntrySource(entry) {
  const reviewName = basenameWithoutMd(entry.reviewPath);
  const reviewLink = `[[${reviewName}#${entry.weekLabel}|\u590D\u76D8]]`;
  if (!entry.planPath) return `${reviewLink}<br>\u672A\u5339\u914D\u5468\u8BA1\u5212`;
  return `${reviewLink}<br>[[${basenameWithoutMd(entry.planPath)}|\u8BA1\u5212]]`;
}
function tableCell(value) {
  return cleanCell(value).replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|").trim();
}
function splitMarkdownTableRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cleanCell);
}
function isTableLine(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}
function isSeparatorRow(line) {
  if (!isTableLine(line)) return false;
  const cells = splitMarkdownTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, "")));
}
function normalizeHeaderCell(value) {
  return cleanCell(value).replace(/\s/g, "");
}
function normalizeWhitespace(value) {
  return value.replace(/\s+/g, "");
}
function normalizeForDuplicateCheck(value) {
  return cleanCell(value).replace(/<br\s*\/?>/gi, "").replace(/\\\|/g, "|").replace(/\*\*/g, "").replace(/\s+/g, "");
}
function cleanCell(value) {
  return String(value ?? "").trim();
}
function normalizePlanName(value) {
  return basenameWithoutMd(value).replace(/\s+/g, "").replace(/第三/g, "\u7B2C3").replace(/第二/g, "\u7B2C2").replace(/第一/g, "\u7B2C1").replace(/第四/g, "\u7B2C4").replace(/第五/g, "\u7B2C5").replace(/第六/g, "\u7B2C6");
}
function basename(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}
function basenameWithoutMd(filePath) {
  return basename(filePath).replace(/\.md$/i, "");
}
function countOccurrences(text, pattern) {
  let count = 0;
  let index = 0;
  while (true) {
    const found = text.indexOf(pattern, index);
    if (found < 0) return count;
    count += 1;
    index = found + pattern.length;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GOAL_PROGRESS_PLAN_ROOT_PATH,
  GOAL_PROGRESS_REVIEW_PATH,
  GOAL_PROGRESS_SYNC_END,
  GOAL_PROGRESS_SYNC_START,
  GOAL_PROGRESS_TARGET_PATH,
  buildGoalProgressEntries,
  buildGoalProgressSyncUpdate,
  countGoalProgressSyncBlocks,
  renderGoalProgressSyncBlock
});
