import type { App } from "obsidian";

export const CLAUDIAN_MENTION_EXCLUDED_PATHS = ["开发插件（Obsidian优化）"] as const;
export const CLAUDIAN_SETTINGS_PATH = ".claudian/claudian-settings.json";
export const VAULT_IGNORE_PATH = ".ignore";
export const CLAUDIAN_MENTION_GUARD_LOG_PATH =
  "开发插件（Obsidian优化）/0️⃣系统信息库/日志/自动化提醒/claudian-mention-exclude-guard.md";

type AdapterLike = {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  append?: (path: string, data: string) => Promise<void>;
  mkdir?: (path: string) => Promise<void>;
};

export type ClaudianMentionExcludeGuardResult = {
  ok: boolean;
  changed: boolean;
  messages: string[];
  errors: string[];
};

export function normalizeClaudianMentionExcludedPath(path: string): string {
  return String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/\*\*$/, "")
    .replace(/\/\*$/, "")
    .replace(/\/+$/, "")
    .trim();
}

function uniqueNormalizedPaths(paths: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const path of paths) {
    const normalized = normalizeClaudianMentionExcludedPath(path);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function upsertClaudianExcludedPathsJson(
  rawJson: string,
  requiredPaths: readonly string[] = CLAUDIAN_MENTION_EXCLUDED_PATHS
): { changed: boolean; json: string } {
  const parsed = rawJson.trim() ? JSON.parse(rawJson) : {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Claudian 设置文件不是 JSON 对象");
  }

  const settings = parsed as Record<string, unknown>;
  const existing = Array.isArray(settings.excludedPaths)
    ? settings.excludedPaths.filter((item): item is string => typeof item === "string")
    : [];
  const next = uniqueNormalizedPaths([...existing, ...requiredPaths]);
  const changed =
    !Array.isArray(settings.excludedPaths) ||
    existing.length !== next.length ||
    existing.some((item, index) => normalizeClaudianMentionExcludedPath(item) !== next[index]);

  if (!changed) return { changed: false, json: rawJson };

  return {
    changed: true,
    json: `${JSON.stringify({ ...settings, excludedPaths: next }, null, 2)}\n`,
  };
}

export function upsertVaultIgnoreRules(
  rawIgnore: string,
  requiredPaths: readonly string[] = CLAUDIAN_MENTION_EXCLUDED_PATHS
): { changed: boolean; content: string } {
  const lines = rawIgnore.split(/\r?\n/);
  const existing = new Set(lines.map((line) => line.trim()).filter(Boolean));
  const additions: string[] = [];

  for (const path of uniqueNormalizedPaths(requiredPaths)) {
    const folderRule = `${path}/`;
    const descendantRule = `${path}/**`;
    if (!existing.has(folderRule)) additions.push(folderRule);
    if (!existing.has(descendantRule)) additions.push(descendantRule);
  }

  if (additions.length === 0) return { changed: false, content: rawIgnore };

  const prefix = rawIgnore.trim()
    ? rawIgnore.replace(/\s*$/, "\n")
    : "# Hide plugin-development archives from Codex/@ file search and rg-style indexers.\n";
  return {
    changed: true,
    content: `${prefix}${additions.join("\n")}\n`,
  };
}

export async function ensureClaudianMentionExcludeGuard(
  app: App,
  options: {
    excludedPaths?: readonly string[];
    now?: () => Date;
    notifyFailure?: (message: string) => void;
    console?: Pick<Console, "info" | "warn">;
  } = {}
): Promise<ClaudianMentionExcludeGuardResult> {
  const adapter = app.vault.adapter as unknown as AdapterLike;
  const excludedPaths = options.excludedPaths ?? CLAUDIAN_MENTION_EXCLUDED_PATHS;
  const result: ClaudianMentionExcludeGuardResult = {
    ok: true,
    changed: false,
    messages: [],
    errors: [],
  };

  try {
    const changed = await ensureClaudianSettingsExcludedPaths(adapter, excludedPaths);
    result.changed ||= changed;
    result.messages.push(changed ? "已补齐 Claudian excludedPaths" : "Claudian excludedPaths 已存在");
  } catch (error) {
    result.ok = false;
    result.errors.push(`Claudian 设置修复失败：${formatGuardError(error)}`);
  }

  try {
    const changed = await ensureVaultIgnoreRules(adapter, excludedPaths);
    result.changed ||= changed;
    result.messages.push(changed ? "已补齐 vault .ignore" : "vault .ignore 已存在");
  } catch (error) {
    result.ok = false;
    result.errors.push(`.ignore 修复失败：${formatGuardError(error)}`);
  }

  if (!result.ok) {
    await appendGuardFailureLog(adapter, result.errors, options.now?.() ?? new Date()).catch((error) => {
      result.errors.push(`提醒日志写入失败：${formatGuardError(error)}`);
    });
    options.notifyFailure?.("Claudian @ 排除规则自动修复失败，已写入提醒日志。");
    options.console?.warn?.("[feishu-doc-toolbar] Claudian mention exclude guard failed", result.errors);
  } else if (result.changed) {
    options.console?.info?.("[feishu-doc-toolbar] Claudian mention exclude guard applied", result.messages);
  }

  return result;
}

async function ensureClaudianSettingsExcludedPaths(
  adapter: AdapterLike,
  excludedPaths: readonly string[]
): Promise<boolean> {
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

async function ensureVaultIgnoreRules(adapter: AdapterLike, excludedPaths: readonly string[]): Promise<boolean> {
  const exists = await adapter.exists(VAULT_IGNORE_PATH);
  const raw = exists ? await adapter.read(VAULT_IGNORE_PATH) : "";
  const next = upsertVaultIgnoreRules(raw, excludedPaths);
  if (next.changed || !exists) {
    await adapter.write(VAULT_IGNORE_PATH, next.content);
    return true;
  }
  return false;
}

async function appendGuardFailureLog(adapter: AdapterLike, errors: string[], now: Date): Promise<void> {
  await ensureParentFolder(adapter, CLAUDIAN_MENTION_GUARD_LOG_PATH);
  const exists = await adapter.exists(CLAUDIAN_MENTION_GUARD_LOG_PATH);
  const header = exists
    ? ""
    : "# Claudian @ 排除规则自动修复提醒\n\n这里记录 Obsidian增强体验启动时未能自动补齐的 Claudian 排除规则，方便 Agent 后续处理。\n\n";
  const entry = [
    `## ${formatLocalTimestamp(now)}`,
    "",
    ...errors.map((error) => `- ${error}`),
    "",
  ].join("\n");
  const content = `${header}${entry}`;
  if (exists && typeof adapter.append === "function") {
    await adapter.append(CLAUDIAN_MENTION_GUARD_LOG_PATH, content);
    return;
  }
  const current = exists ? await adapter.read(CLAUDIAN_MENTION_GUARD_LOG_PATH) : "";
  await adapter.write(CLAUDIAN_MENTION_GUARD_LOG_PATH, `${current}${content}`);
}

async function ensureParentFolder(adapter: AdapterLike, filePath: string): Promise<void> {
  if (typeof adapter.mkdir !== "function") return;
  const parts = filePath.split("/").slice(0, -1);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (await adapter.exists(current)) continue;
    await adapter.mkdir(current);
  }
}

function formatGuardError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatLocalTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
}
