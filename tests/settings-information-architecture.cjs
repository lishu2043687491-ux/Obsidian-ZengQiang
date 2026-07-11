const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const main = fs.readFileSync(path.join(root, "src/main.ts"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function check(condition, message) {
  if (!condition) throw new Error(message);
}

for (const label of [
  "功能总览",
  "编辑与排版",
  "知识组织",
  "内容与素材",
  "第三方插件管理",
  "自动化与 AI",
]) {
  check(main.includes(`label: "${label}"`), `缺少一级页面：${label}`);
}

check(
  /id:\s*"plugins"[\s\S]*?label:\s*"第三方插件管理"[\s\S]*?emphasized:\s*true/.test(main),
  "第三方插件管理必须保留为强调展示的独立一级页面"
);
check(main.includes('aliasInput.placeholder = "中文名"'), "第三方插件必须保留中文名输入框");
check(main.includes('noteInput.placeholder = "用途备注：它是做什么的？"'), "第三方插件必须保留用途备注输入框");
check(main.includes("updateManagedPluginNote(item.id, noteInput.value)"), "用途备注必须写回既有 managedPluginNotes 数据源");
check(main.includes("搜索中文名、英文名、插件 id 或用途备注"), "第三方插件页面必须保留中文搜索入口");

const descriptorsBlock = main.match(/const OWN_MODULE_DESCRIPTORS:[\s\S]*?= \[([\s\S]*?)\n\];/);
const areasBlock = main.match(/const OWN_MODULE_IDS_BY_AREA = \{([\s\S]*?)\n\} as const;/);
check(descriptorsBlock && areasBlock, "无法读取功能项或场景分类定义");
const descriptorIds = [...descriptorsBlock[1].matchAll(/moduleId:\s*"([^"]+)"/g)].map((match) => match[1]).sort();
const groupedIds = [...areasBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]).sort();
check(descriptorIds.length === 11, `功能总账应有 11 个功能项，实际 ${descriptorIds.length}`);
check(JSON.stringify(descriptorIds) === JSON.stringify(groupedIds), "每个功能项必须且只能归入一个用户场景分类");

const tabTypeBlock = main.match(/type ExperienceSettingsTabId =([\s\S]*?);/);
const defaultOrderBlock = main.match(/const DEFAULT_SETTINGS_TAB_ORDER:[\s\S]*?= \[([\s\S]*?)\];/);
check(tabTypeBlock && defaultOrderBlock, "无法读取设置页历史 tab id");
for (const id of ["toolbar", "nativeTable", "templateLibrary", "modules", "plugins", "videoSummary"]) {
  check(tabTypeBlock[1].includes(`"${id}"`), `历史 tab id 被删除：${id}`);
  check(defaultOrderBlock[1].includes(`"${id}"`), `历史排序 id 被删除：${id}`);
}
check(!tabTypeBlock[1].includes('"overview"'), "禁止为了总览页迁移既有 settingsTabOrder 数据");

for (const selector of [
  ".fdtb-overview-grid",
  ".fdtb-settings-tabs",
  ".fdtb-plugin-manager-search",
  ".fdtb-plugin-manager-note-input",
]) {
  check(styles.includes(selector), `缺少设置页样式：${selector}`);
}
check(styles.includes("@media (max-width: 760px)"), "设置页必须保留窄窗口响应式布局");

console.log("settings information architecture: ok");
