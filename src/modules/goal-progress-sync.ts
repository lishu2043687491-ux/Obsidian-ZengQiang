export type GoalProgressCategory = "工作" | "生活健康" | "找对象";

declare const __OSS_RELEASE__: boolean;

export type GoalProgressEntry = {
  weekLabel: string;
  category: GoalProgressCategory;
  goal: string;
  actual: string;
  gap: string;
  reviewPath: string;
  planPath?: string;
};

export type GoalProgressPlanFile = {
  path: string;
  basename?: string;
};

type ReviewSection = {
  heading: string;
  month: number;
  day: number;
  text: string;
  planPath?: string;
};

export type BuildGoalProgressEntriesOptions = {
  reviewText: string;
  reviewPath?: string;
  planFiles?: GoalProgressPlanFile[];
};

export type BuildGoalProgressSyncUpdateOptions = BuildGoalProgressEntriesOptions & {
  targetText: string;
  generatedAt?: string;
};

export type BuildGoalProgressSyncUpdateResult = {
  ok: boolean;
  targetText: string;
  entries: GoalProgressEntry[];
  warnings: string[];
  changed: boolean;
  appendedCount: number;
  skippedCount: number;
  reason?: string;
};

declare const __OSS_RELEASE__: boolean | undefined;

const GOAL_PROGRESS_OSS = typeof __OSS_RELEASE__ !== "undefined" && __OSS_RELEASE__ === true;

export const GOAL_PROGRESS_REVIEW_PATH = GOAL_PROGRESS_OSS
  ? "reviews/weekly-review.example.md"
  : "❷自我管理/3️⃣我的实操/4 复盘/日复盘26.4.1（最新）.md";
export const GOAL_PROGRESS_TARGET_PATH = GOAL_PROGRESS_OSS
  ? "goals/annual-progress.example.md"
  : "❷自我管理/3️⃣我的实操/1目标/2026年 目标进展.md";
export const GOAL_PROGRESS_PLAN_ROOT_PATH = GOAL_PROGRESS_OSS
  ? "plans/weekly"
  : "❷自我管理/3️⃣我的实操/2计划/每周计划进展";

export const GOAL_PROGRESS_SYNC_START = "<!-- goal-progress-sync:start -->";
export const GOAL_PROGRESS_SYNC_END = "<!-- goal-progress-sync:end -->";

const REVIEW_HEADING_RE =
  /^##\s+((\d{1,2})\.(\d{1,2})(?:\s*[-—~至]\s*\d{1,2})?\s*(?:日)?(?:周复盘|日周复盘))\s*$/gm;

const WEEK_NUMBER_LABELS = ["", "一", "二", "三", "四", "五", "六"];

const TARGET_SECTION_RULES: Array<{
  category: GoalProgressCategory;
  heading: RegExp;
  columns: 4 | 5;
}> = [
  { category: "工作", heading: /^#\s*一[、.]\s*工作目标/m, columns: 5 },
  { category: "生活健康", heading: /^#\s*二[、.]\s*生活目标/m, columns: 4 },
  { category: "找对象", heading: /^#\s*三[、.].*(找女朋友|找对象).*目标/m, columns: 4 },
];

export function buildGoalProgressEntries(
  options: BuildGoalProgressEntriesOptions
): GoalProgressEntry[] {
  const planFiles = options.planFiles ?? [];
  const reviewPath = options.reviewPath ?? GOAL_PROGRESS_REVIEW_PATH;
  const sections = parseReviewSections(options.reviewText, planFiles);
  const entries: GoalProgressEntry[] = [];

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
        planPath: section.planPath,
      });
    }
  }

  return entries;
}

export function buildGoalProgressSyncUpdate(
  options: BuildGoalProgressSyncUpdateOptions
): BuildGoalProgressSyncUpdateResult {
  const entries = buildGoalProgressEntries(options);
  const warnings: string[] = [];
  if (entries.length === 0) {
    return {
      ok: false,
      targetText: options.targetText,
      entries,
      warnings: ["没有识别到可同步的目标进展表"],
      changed: false,
      appendedCount: 0,
      skippedCount: 0,
      reason: "未识别到周复盘目标进展表",
    };
  }

  for (const entry of entries) {
    if (!entry.planPath) {
      warnings.push(`${entry.weekLabel}：未匹配周计划`);
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
      reason: cleaned.reason,
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
      reason: appended.reason,
    };
  }

  return {
    ok: true,
    targetText: appended.text,
    entries,
    warnings,
    changed: appended.text !== options.targetText,
    appendedCount: appended.appendedCount,
    skippedCount: appended.skippedCount,
  };
}

export function countGoalProgressSyncBlocks(text: string): number {
  return countOccurrences(text, GOAL_PROGRESS_SYNC_START);
}

export function renderGoalProgressSyncBlock(
  entries: GoalProgressEntry[],
  options: { generatedAt?: string } = {}
): string {
  const grouped = groupEntriesByCategory(entries);
  const generatedAt = options.generatedAt ?? "手动更新";
  const lines: string[] = [
    GOAL_PROGRESS_SYNC_START,
    "## 目标进展自动同步",
    "",
    `更新时间：${generatedAt}`,
    "",
    "> 本区由命令「更新目标进展总览」生成；原有手工表格不会被改动。",
    "",
  ];

  for (const category of ["工作", "生活健康", "找对象"] as GoalProgressCategory[]) {
    const categoryEntries = grouped.get(category) ?? [];
    lines.push(`### ${category}目标`, "");
    if (categoryEntries.length === 0) {
      lines.push("暂无识别到的进展。", "");
      continue;
    }
    lines.push("| 周次 | 周目标 | 现状 | 差距 | 来源 |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const entry of categoryEntries) {
      lines.push(
        [
          tableCell(entry.weekLabel),
          tableCell(entry.goal),
          tableCell(entry.actual),
          tableCell(entry.gap || "/"),
          tableCell(formatEntrySource(entry)),
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
      );
    }
    lines.push("");
  }

  lines.push(GOAL_PROGRESS_SYNC_END);
  return lines.join("\n");
}

function removeGoalProgressSyncBlock(
  targetText: string
): { ok: true; text: string } | { ok: false; reason: string } {
  const start = targetText.indexOf(GOAL_PROGRESS_SYNC_START);
  const end = targetText.indexOf(GOAL_PROGRESS_SYNC_END);

  if (start >= 0 || end >= 0) {
    if (start < 0 || end < 0 || end < start) {
      return { ok: false, reason: "目标页已有同步标记不完整，未写入" };
    }
    const afterEnd = end + GOAL_PROGRESS_SYNC_END.length;
    return {
      ok: true,
      text: `${targetText.slice(0, start)}${targetText.slice(afterEnd)}`.replace(/\n{4,}/g, "\n\n\n"),
    };
  }

  return { ok: true, text: targetText };
}

function appendEntriesToExistingTargetTables(
  targetText: string,
  entries: GoalProgressEntry[]
): { ok: true; text: string; appendedCount: number; skippedCount: number } | { ok: false; reason: string } {
  let text = targetText;
  let appendedCount = 0;
  let skippedCount = 0;

  for (const rule of TARGET_SECTION_RULES) {
    const sectionEntries = entries.filter((entry) => entry.category === rule.category);
    if (sectionEntries.length === 0) continue;

    const section = findTargetSection(text, rule.heading);
    if (!section) return { ok: false, reason: `目标页未找到「${formatCategoryName(rule.category)}」区域，未写入` };

    const table = findFirstMarkdownTable(text.slice(section.start, section.end));
    if (!table) return { ok: false, reason: `目标页「${formatCategoryName(rule.category)}」区域未找到目标表，未写入` };

    const absoluteTableEnd = section.start + table.end;
    const existingSectionText = text.slice(section.start, section.end);
    const rows = buildTargetRows(sectionEntries, rule.columns, existingSectionText);
    const rowsToAppend = rows.filter((row) => !row.skip).map((row) => row.line);
    skippedCount += rows.length - rowsToAppend.length;
    if (rowsToAppend.length === 0) continue;

    const prefix = text.slice(0, absoluteTableEnd).replace(/\s*$/, "\n");
    const suffix = text.slice(absoluteTableEnd);
    text = `${prefix}${rowsToAppend.join("\n")}\n${suffix}`;
    appendedCount += rowsToAppend.length;
  }

  return { ok: true, text, appendedCount, skippedCount };
}

function findTargetSection(text: string, heading: RegExp) {
  const match = heading.exec(text);
  heading.lastIndex = 0;
  if (!match || match.index == null) return null;
  const start = match.index;
  const nextHeading = text.slice(start + 1).search(/^#\s+/m);
  const end = nextHeading < 0 ? text.length : start + 1 + nextHeading;
  return { start, end };
}

function findFirstMarkdownTable(sectionText: string) {
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

function buildTargetRows(entries: GoalProgressEntry[], columns: 4 | 5, existingSectionText: string) {
  const labelCounts = new Map<string, number>();
  return entries.map((entry) => {
    const label = formatTargetWeekLabel(entry);
    const rowLabel = (labelCounts.get(label) ?? 0) === 0 ? label : "/";
    labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    const cells =
      columns === 5
        ? [rowLabel, entry.goal, entry.actual, entry.gap || "/", ""]
        : [rowLabel, entry.goal, entry.actual, entry.gap || "/"];
    return {
      line: `| ${cells.map(tableCell).join(" | ")} |`,
      skip: hasTargetEntry(existingSectionText, entry, label),
    };
  });
}

function hasTargetEntry(sectionText: string, entry: GoalProgressEntry, label: string) {
  const normalizedSection = normalizeForDuplicateCheck(sectionText);
  const normalizedGoal = normalizeForDuplicateCheck(entry.goal);
  const normalizedActual = normalizeForDuplicateCheck(entry.actual);
  const normalizedLabel = normalizeForDuplicateCheck(label);

  if (entry.category === "找对象" && normalizedSection.includes(normalizedLabel)) return true;
  if (normalizedGoal && normalizedActual) {
    return normalizedSection.includes(normalizedGoal) && normalizedSection.includes(normalizedActual);
  }
  if (normalizedGoal) return normalizedSection.includes(normalizedLabel) && normalizedSection.includes(normalizedGoal);
  return normalizedSection.includes(normalizedLabel);
}

function formatTargetWeekLabel(entry: GoalProgressEntry) {
  const planName = entry.planPath ? basenameWithoutMd(entry.planPath) : "";
  const planMatch = normalizePlanName(planName).match(/^(\d{1,2})月第(\d+)周计划$/);
  if (planMatch) return `${Number(planMatch[1])}月第${Number(planMatch[2])}周目标`;

  const reviewMatch = entry.weekLabel.match(/^(\d{1,2})\.(\d{1,2})/);
  if (!reviewMatch) return entry.weekLabel.replace(/周复盘|日周复盘/g, "目标");
  const month = Number(reviewMatch[1]);
  const day = Number(reviewMatch[2]);
  return `${month}月第${getWeekOfMonth(month, day)}周目标`;
}

function formatCategoryName(category: GoalProgressCategory) {
  if (category === "生活健康") return "生活目标";
  if (category === "找对象") return "找对象目标";
  return "工作目标";
}

function parseReviewSections(text: string, planFiles: GoalProgressPlanFile[]): ReviewSection[] {
  const matches = Array.from(text.matchAll(REVIEW_HEADING_RE));
  const sections: ReviewSection[] = [];

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
      planPath: matchPlanPath(sectionText, month, day, planFiles),
    });
  }

  return sections;
}

function parseFirstGoalTable(sectionText: string) {
  const lines = sectionText.split(/\r?\n/);

  for (let index = 0; index < lines.length - 1; index += 1) {
    const headerLine = lines[index];
    const separatorLine = lines[index + 1];
    if (!isTableLine(headerLine) || !isSeparatorRow(separatorLine)) continue;

    const header = splitMarkdownTableRow(headerLine).map(normalizeHeaderCell);
    const indexes = resolveGoalTableIndexes(header);
    if (!indexes) continue;

    const rows: Array<{
      category: GoalProgressCategory;
      goal: string;
      actual: string;
      gap: string;
    }> = [];
    let lastCategory: GoalProgressCategory | null = null;

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

function resolveGoalTableIndexes(header: string[]) {
  const category = header.findIndex((cell) => cell.includes("类型") || cell.includes("维度"));
  const goal = header.findIndex((cell) => cell.includes("目标"));
  const actual = header.findIndex((cell) => cell.includes("现状"));
  const gap = header.findIndex((cell) => cell.includes("差距") || cell.includes("进展"));
  if (category < 0 || goal < 0 || actual < 0 || gap < 0) return null;
  return { category, goal, actual, gap };
}

function matchPlanPath(
  sectionText: string,
  month: number,
  day: number,
  planFiles: GoalProgressPlanFile[]
) {
  if (planFiles.length === 0) return undefined;
  const explicitLinks = Array.from(sectionText.matchAll(/\[\[([^\]]*周计划[^\]]*)\]\]/g))
    .map((match) => normalizePlanName(match[1] ?? ""))
    .filter(Boolean);

  for (const link of explicitLinks) {
    const explicitMatch = planFiles.find((file) => normalizePlanName(file.basename ?? basename(file.path)) === link);
    if (explicitMatch) return explicitMatch.path;
  }

  const weekNumber = getWeekOfMonth(month, day);
  const candidates = buildPlanNameCandidates(month, weekNumber).map(normalizePlanName);
  const matched = planFiles.find((file) => candidates.includes(normalizePlanName(file.basename ?? basename(file.path))));
  return matched?.path;
}

function buildPlanNameCandidates(month: number, weekNumber: number) {
  const chineseWeek = WEEK_NUMBER_LABELS[weekNumber] ?? String(weekNumber);
  return [
    `${month}月第${weekNumber}周计划`,
    `${month} 月第${weekNumber}周计划`,
    `${month}月第 ${weekNumber} 周计划`,
    `${month} 月第 ${weekNumber} 周计划`,
    `${month}月第${chineseWeek}周计划`,
    `${month} 月第${chineseWeek}周计划`,
    `${month}月第 ${chineseWeek} 周计划`,
    `${month} 月第 ${chineseWeek} 周计划`,
  ];
}

function getWeekOfMonth(month: number, day: number) {
  const firstDay = new Date(2026, month - 1, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  return Math.floor((day + mondayOffset - 1) / 7) + 1;
}

function inferCategory(rawCategory: string, goal: string, actual: string): GoalProgressCategory | null {
  const text = `${rawCategory} ${goal} ${actual}`;
  if (/找对象|女朋友|女生|恋爱/.test(text)) return "找对象";
  if (/生活|健康|体力|睡眠|运动|增肌|拳击/.test(text)) return "生活健康";
  if (/工作|绩效|直播|企微|投放|收款|月报|汇报/.test(text)) return "工作";
  return null;
}

function groupEntriesByCategory(entries: GoalProgressEntry[]) {
  const grouped = new Map<GoalProgressCategory, GoalProgressEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }
  return grouped;
}

function formatEntrySource(entry: GoalProgressEntry) {
  const reviewName = basenameWithoutMd(entry.reviewPath);
  const reviewLink = `[[${reviewName}#${entry.weekLabel}|复盘]]`;
  if (!entry.planPath) return `${reviewLink}<br>未匹配周计划`;
  return `${reviewLink}<br>[[${basenameWithoutMd(entry.planPath)}|计划]]`;
}

function tableCell(value: string) {
  return cleanCell(value)
    .replace(/\r?\n/g, "<br>")
    .replace(/\|/g, "\\|")
    .trim();
}

function splitMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(cleanCell);
}

function isTableLine(line: string) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSeparatorRow(line: string) {
  if (!isTableLine(line)) return false;
  const cells = splitMarkdownTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, "")));
}

function normalizeHeaderCell(value: string) {
  return cleanCell(value).replace(/\s/g, "");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, "");
}

function normalizeForDuplicateCheck(value: string) {
  return cleanCell(value)
    .replace(/<br\s*\/?>/gi, "")
    .replace(/\\\|/g, "|")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, "");
}

function cleanCell(value: string) {
  return String(value ?? "").trim();
}

function normalizePlanName(value: string) {
  return basenameWithoutMd(value)
    .replace(/\s+/g, "")
    .replace(/第三/g, "第3")
    .replace(/第二/g, "第2")
    .replace(/第一/g, "第1")
    .replace(/第四/g, "第4")
    .replace(/第五/g, "第5")
    .replace(/第六/g, "第6");
}

function basename(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}

function basenameWithoutMd(filePath: string) {
  return basename(filePath).replace(/\.md$/i, "");
}

function countOccurrences(text: string, pattern: string) {
  let count = 0;
  let index = 0;
  while (true) {
    const found = text.indexOf(pattern, index);
    if (found < 0) return count;
    count += 1;
    index = found + pattern.length;
  }
}
