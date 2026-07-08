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

// src/modules/claudian-mention-exclude-guard.ts
var claudian_mention_exclude_guard_exports = {};
__export(claudian_mention_exclude_guard_exports, {
  CLAUDIAN_MENTION_EXCLUDED_PATHS: () => CLAUDIAN_MENTION_EXCLUDED_PATHS,
  CLAUDIAN_MENTION_GUARD_LOG_PATH: () => CLAUDIAN_MENTION_GUARD_LOG_PATH,
  CLAUDIAN_SETTINGS_PATH: () => CLAUDIAN_SETTINGS_PATH,
  VAULT_IGNORE_PATH: () => VAULT_IGNORE_PATH,
  ensureClaudianMentionExcludeGuard: () => ensureClaudianMentionExcludeGuard,
  normalizeClaudianMentionExcludedPath: () => normalizeClaudianMentionExcludedPath,
  upsertClaudianExcludedPathsJson: () => upsertClaudianExcludedPathsJson,
  upsertVaultIgnoreRules: () => upsertVaultIgnoreRules
});
module.exports = __toCommonJS(claudian_mention_exclude_guard_exports);
var CLAUDIAN_MENTION_EXCLUDED_PATHS = ["\u5F00\u53D1\u63D2\u4EF6\uFF08Obsidian\u4F18\u5316\uFF09"];
var CLAUDIAN_SETTINGS_PATH = ".claudian/claudian-settings.json";
var VAULT_IGNORE_PATH = ".ignore";
var CLAUDIAN_MENTION_GUARD_LOG_PATH = "\u5F00\u53D1\u63D2\u4EF6\uFF08Obsidian\u4F18\u5316\uFF09/0\uFE0F\u20E3\u7CFB\u7EDF\u4FE1\u606F\u5E93/\u65E5\u5FD7/\u81EA\u52A8\u5316\u63D0\u9192/claudian-mention-exclude-guard.md";
function normalizeClaudianMentionExcludedPath(path) {
  return String(path || "").replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/\*\*$/, "").replace(/\/\*$/, "").replace(/\/+$/, "").trim();
}
function uniqueNormalizedPaths(paths) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const path of paths) {
    const normalized = normalizeClaudianMentionExcludedPath(path);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}
function upsertClaudianExcludedPathsJson(rawJson, requiredPaths = CLAUDIAN_MENTION_EXCLUDED_PATHS) {
  const parsed = rawJson.trim() ? JSON.parse(rawJson) : {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Claudian \u8BBE\u7F6E\u6587\u4EF6\u4E0D\u662F JSON \u5BF9\u8C61");
  }
  const settings = parsed;
  const existing = Array.isArray(settings.excludedPaths) ? settings.excludedPaths.filter((item) => typeof item === "string") : [];
  const next = uniqueNormalizedPaths([...existing, ...requiredPaths]);
  const changed = !Array.isArray(settings.excludedPaths) || existing.length !== next.length || existing.some((item, index) => normalizeClaudianMentionExcludedPath(item) !== next[index]);
  if (!changed) return { changed: false, json: rawJson };
  return {
    changed: true,
    json: `${JSON.stringify({ ...settings, excludedPaths: next }, null, 2)}
`
  };
}
function upsertVaultIgnoreRules(rawIgnore, requiredPaths = CLAUDIAN_MENTION_EXCLUDED_PATHS) {
  const lines = rawIgnore.split(/\r?\n/);
  const existing = new Set(lines.map((line) => line.trim()).filter(Boolean));
  const additions = [];
  for (const path of uniqueNormalizedPaths(requiredPaths)) {
    const folderRule = `${path}/`;
    const descendantRule = `${path}/**`;
    if (!existing.has(folderRule)) additions.push(folderRule);
    if (!existing.has(descendantRule)) additions.push(descendantRule);
  }
  if (additions.length === 0) return { changed: false, content: rawIgnore };
  const prefix = rawIgnore.trim() ? rawIgnore.replace(/\s*$/, "\n") : "# Hide plugin-development archives from Codex/@ file search and rg-style indexers.\n";
  return {
    changed: true,
    content: `${prefix}${additions.join("\n")}
`
  };
}
async function ensureClaudianMentionExcludeGuard(app, options = {}) {
  const adapter = app.vault.adapter;
  const excludedPaths = options.excludedPaths ?? CLAUDIAN_MENTION_EXCLUDED_PATHS;
  const result = {
    ok: true,
    changed: false,
    messages: [],
    errors: []
  };
  try {
    const changed = await ensureClaudianSettingsExcludedPaths(adapter, excludedPaths);
    result.changed || (result.changed = changed);
    result.messages.push(changed ? "\u5DF2\u8865\u9F50 Claudian excludedPaths" : "Claudian excludedPaths \u5DF2\u5B58\u5728");
  } catch (error) {
    result.ok = false;
    result.errors.push(`Claudian \u8BBE\u7F6E\u4FEE\u590D\u5931\u8D25\uFF1A${formatGuardError(error)}`);
  }
  try {
    const changed = await ensureVaultIgnoreRules(adapter, excludedPaths);
    result.changed || (result.changed = changed);
    result.messages.push(changed ? "\u5DF2\u8865\u9F50 vault .ignore" : "vault .ignore \u5DF2\u5B58\u5728");
  } catch (error) {
    result.ok = false;
    result.errors.push(`.ignore \u4FEE\u590D\u5931\u8D25\uFF1A${formatGuardError(error)}`);
  }
  if (!result.ok) {
    await appendGuardFailureLog(adapter, result.errors, options.now?.() ?? /* @__PURE__ */ new Date()).catch((error) => {
      result.errors.push(`\u63D0\u9192\u65E5\u5FD7\u5199\u5165\u5931\u8D25\uFF1A${formatGuardError(error)}`);
    });
    options.notifyFailure?.("Claudian @ \u6392\u9664\u89C4\u5219\u81EA\u52A8\u4FEE\u590D\u5931\u8D25\uFF0C\u5DF2\u5199\u5165\u63D0\u9192\u65E5\u5FD7\u3002");
    options.console?.warn?.("[feishu-doc-toolbar] Claudian mention exclude guard failed", result.errors);
  } else if (result.changed) {
    options.console?.info?.("[feishu-doc-toolbar] Claudian mention exclude guard applied", result.messages);
  }
  return result;
}
async function ensureClaudianSettingsExcludedPaths(adapter, excludedPaths) {
  await ensureParentFolder(adapter, CLAUDIAN_SETTINGS_PATH);
  const exists = await adapter.exists(CLAUDIAN_SETTINGS_PATH);
  const raw = exists ? await adapter.read(CLAUDIAN_SETTINGS_PATH) : "{}\n";
  const next = upsertClaudianExcludedPathsJson(raw, excludedPaths);
  if (next.changed || !exists) {
    await adapter.write(CLAUDIAN_SETTINGS_PATH, next.json);
    return true;
  }
  return false;
}
async function ensureVaultIgnoreRules(adapter, excludedPaths) {
  const exists = await adapter.exists(VAULT_IGNORE_PATH);
  const raw = exists ? await adapter.read(VAULT_IGNORE_PATH) : "";
  const next = upsertVaultIgnoreRules(raw, excludedPaths);
  if (next.changed || !exists) {
    await adapter.write(VAULT_IGNORE_PATH, next.content);
    return true;
  }
  return false;
}
async function appendGuardFailureLog(adapter, errors, now) {
  await ensureParentFolder(adapter, CLAUDIAN_MENTION_GUARD_LOG_PATH);
  const exists = await adapter.exists(CLAUDIAN_MENTION_GUARD_LOG_PATH);
  const header = exists ? "" : "# Claudian @ \u6392\u9664\u89C4\u5219\u81EA\u52A8\u4FEE\u590D\u63D0\u9192\n\n\u8FD9\u91CC\u8BB0\u5F55 Obsidian\u589E\u5F3A\u4F53\u9A8C\u542F\u52A8\u65F6\u672A\u80FD\u81EA\u52A8\u8865\u9F50\u7684 Claudian \u6392\u9664\u89C4\u5219\uFF0C\u65B9\u4FBF Agent \u540E\u7EED\u5904\u7406\u3002\n\n";
  const entry = [
    `## ${formatLocalTimestamp(now)}`,
    "",
    ...errors.map((error) => `- ${error}`),
    ""
  ].join("\n");
  const content = `${header}${entry}`;
  if (exists && typeof adapter.append === "function") {
    await adapter.append(CLAUDIAN_MENTION_GUARD_LOG_PATH, content);
    return;
  }
  const current = exists ? await adapter.read(CLAUDIAN_MENTION_GUARD_LOG_PATH) : "";
  await adapter.write(CLAUDIAN_MENTION_GUARD_LOG_PATH, `${current}${content}`);
}
async function ensureParentFolder(adapter, filePath) {
  if (typeof adapter.mkdir !== "function") return;
  const parts = filePath.split("/").slice(0, -1);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (await adapter.exists(current)) continue;
    await adapter.mkdir(current);
  }
}
function formatGuardError(error) {
  return error instanceof Error ? error.message : String(error);
}
function formatLocalTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLAUDIAN_MENTION_EXCLUDED_PATHS,
  CLAUDIAN_MENTION_GUARD_LOG_PATH,
  CLAUDIAN_SETTINGS_PATH,
  VAULT_IGNORE_PATH,
  ensureClaudianMentionExcludeGuard,
  normalizeClaudianMentionExcludedPath,
  upsertClaudianExcludedPathsJson,
  upsertVaultIgnoreRules
});
