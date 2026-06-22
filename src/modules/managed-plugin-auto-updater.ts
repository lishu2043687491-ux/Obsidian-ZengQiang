import { requestUrl, type App, type PluginManifest } from "obsidian";

export const DEFAULT_AUTO_UPDATE_PLUGIN_IDS = ["yolo", "realclaudian"] as const;

/** 自研/本地真相源插件：禁止自动更新（本地 main.js 才是最新） */
export const AUTO_UPDATE_BLOCKED_PLUGIN_IDS = [
  "feishu-doc-toolbar",
  "markdown-table-enhancer",
  "block-link-plus",
  "onenote-archive-migrator",
] as const;

export const AUTO_UPDATE_PLUGIN_LABELS: Record<string, string> = {
  yolo: "YOLO",
  realclaudian: "Claudian",
  claudian: "Claudian",
};

const COMMUNITY_PLUGINS_URL =
  "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json";
const GITHUB_RAW = "https://raw.githubusercontent.com";
const CATALOG_CACHE_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 30_000;
const INSTALL_TIMEOUT_MS = 180_000;

export type ManagedPluginAutoUpdateStatus =
  | "updated"
  | "up_to_date"
  | "not_installed"
  | "skipped"
  | "failed";

export type ManagedPluginAutoUpdateResult = {
  pluginId: string;
  status: ManagedPluginAutoUpdateStatus;
  fromVersion?: string;
  toVersion?: string;
  message?: string;
  at: number;
};

export type PluginUpdateInfo = {
  repo: string;
  version: string;
  manifest: PluginManifest;
};

type CommunityPluginEntry = {
  id?: string;
  name?: string;
  repo?: string;
};

type ObsidianPluginManager = {
  manifests?: Record<string, PluginManifest>;
  enabledPlugins?: Set<string> | string[];
  installPlugin?: (repo: string, version: string, manifest: PluginManifest) => Promise<void>;
  isEnabled?: () => boolean;
  disablePlugin?: (id: string) => Promise<void>;
  enablePlugin?: (id: string) => Promise<void>;
  enablePluginAndSave?: (id: string) => Promise<void>;
  loadManifest?: (id: string) => Promise<void>;
};

export type AutoUpdateRunOptions = {
  force?: boolean;
  fetchJson?: (url: string) => Promise<unknown>;
  onProgress?: (message: string) => void;
};

let catalogCache: { at: number; entries: CommunityPluginEntry[] } | null = null;

export function resolveAutoUpdatePluginId(pluginId: string): string {
  const trimmed = pluginId.trim();
  if (!trimmed) return "";
  if (trimmed === "claudian") return "realclaudian";
  return trimmed;
}

export function isAutoUpdateBlockedPluginId(pluginId: string): boolean {
  const resolved = resolveAutoUpdatePluginId(pluginId);
  return AUTO_UPDATE_BLOCKED_PLUGIN_IDS.includes(
    resolved as (typeof AUTO_UPDATE_BLOCKED_PLUGIN_IDS)[number]
  );
}

export function normalizeAutoUpdatePluginIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_AUTO_UPDATE_PLUGIN_IDS];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const resolved = resolveAutoUpdatePluginId(item);
    if (
      !resolved ||
      !/^[a-zA-Z0-9._-]+$/.test(resolved) ||
      seen.has(resolved) ||
      isAutoUpdateBlockedPluginId(resolved)
    ) {
      continue;
    }
    seen.add(resolved);
    result.push(resolved);
  }
  return result.length > 0 ? result : [...DEFAULT_AUTO_UPDATE_PLUGIN_IDS];
}

export function normalizeAutoUpdateResults(
  value: unknown
): Record<string, ManagedPluginAutoUpdateResult> {
  if (!value || typeof value !== "object") return {};
  const next: Record<string, ManagedPluginAutoUpdateResult> = {};
  for (const [rawId, rawResult] of Object.entries(value as Record<string, unknown>)) {
    const pluginId = resolveAutoUpdatePluginId(rawId);
    if (!pluginId || !rawResult || typeof rawResult !== "object") continue;
    const result = rawResult as Partial<ManagedPluginAutoUpdateResult>;
    const status = result.status;
    if (
      status !== "updated" &&
      status !== "up_to_date" &&
      status !== "not_installed" &&
      status !== "skipped" &&
      status !== "failed"
    ) {
      continue;
    }
    next[pluginId] = {
      pluginId,
      status,
      fromVersion: typeof result.fromVersion === "string" ? result.fromVersion : undefined,
      toVersion: typeof result.toVersion === "string" ? result.toVersion : undefined,
      message: typeof result.message === "string" ? result.message.slice(0, 160) : undefined,
      at: Number.isFinite(result.at) ? Number(result.at) : 0,
    };
  }
  return next;
}

/** 比较版本：remote 更新则返回 true */
export function isRemotePluginVersionNewer(localVersion: string, remoteVersion: string): boolean {
  const localParts = parseVersionParts(localVersion);
  const remoteParts = parseVersionParts(remoteVersion);
  const length = Math.max(localParts.length, remoteParts.length);
  for (let index = 0; index < length; index += 1) {
    const local = localParts[index] ?? 0;
    const remote = remoteParts[index] ?? 0;
    if (remote > local) return true;
    if (remote < local) return false;
  }
  return false;
}

function parseVersionParts(version: string): number[] {
  return String(version)
    .trim()
    .split(/[.+_-]/)
    .map((part) => {
      const match = part.match(/\d+/);
      return match ? Number(match[0]) : 0;
    });
}

function normalizePluginUpdateInfo(value: unknown): PluginUpdateInfo | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const repo = typeof raw.repo === "string" ? raw.repo : "";
  const version = typeof raw.version === "string" ? raw.version : "";
  const manifest = raw.manifest;
  if (!repo || !version || !manifest || typeof manifest !== "object") return null;
  return {
    repo,
    version,
    manifest: manifest as PluginManifest,
  };
}

/** 兼容旧逻辑；新路径不再依赖 Obsidian updates 对象 */
export function readPluginUpdatesRecord(updates: unknown): Record<string, PluginUpdateInfo> {
  if (!updates) return {};
  if (updates instanceof Map) {
    const record: Record<string, PluginUpdateInfo> = {};
    for (const [pluginId, value] of updates.entries()) {
      const normalized = normalizePluginUpdateInfo(value);
      if (normalized) record[String(pluginId)] = normalized;
    }
    return record;
  }
  if (typeof updates === "object") {
    const record: Record<string, PluginUpdateInfo> = {};
    for (const [pluginId, value] of Object.entries(updates as Record<string, unknown>)) {
      const normalized = normalizePluginUpdateInfo(value);
      if (normalized) record[pluginId] = normalized;
    }
    return record;
  }
  return {};
}

async function defaultFetchJson(url: string): Promise<unknown> {
  const response = await Promise.race([
    requestUrl({
      url,
      method: "GET",
      headers: { "User-Agent": "ZengQiang-Enhanced-Plugin-Auto-Update" },
      throw: false,
    }),
    new Promise<never>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error(`请求超时：${url}`)), FETCH_TIMEOUT_MS);
    }),
  ]);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json;
}

async function loadCommunityCatalog(fetchJson: (url: string) => Promise<unknown>) {
  const now = Date.now();
  if (catalogCache && now - catalogCache.at < CATALOG_CACHE_MS) {
    return catalogCache.entries;
  }
  const raw = await fetchJson(COMMUNITY_PLUGINS_URL);
  if (!Array.isArray(raw)) {
    throw new Error("社区插件目录格式无效");
  }
  const entries = raw.filter((item): item is CommunityPluginEntry => !!item && typeof item === "object");
  catalogCache = { at: now, entries };
  return entries;
}

function buildCatalogIndex(entries: CommunityPluginEntry[]) {
  const index = new Map<string, CommunityPluginEntry>();
  for (const entry of entries) {
    if (typeof entry.id === "string" && typeof entry.repo === "string") {
      index.set(entry.id, entry);
    }
  }
  return index;
}

async function fetchRemoteManifest(
  repo: string,
  pluginId: string,
  fetchJson: (url: string) => Promise<unknown>
): Promise<PluginManifest> {
  const manifestUrl = `${GITHUB_RAW}/${repo}/HEAD/manifest.json`;
  const raw = await fetchJson(manifestUrl);
  if (!raw || typeof raw !== "object") {
    throw new Error("远程 manifest 无效");
  }
  const manifest = raw as PluginManifest;
  if (manifest.id !== pluginId) {
    throw new Error(`远程 manifest id 不匹配（期望 ${pluginId}，实际 ${manifest.id ?? "未知"}）`);
  }
  if (!manifest.version) {
    throw new Error("远程 manifest 缺少 version");
  }
  return manifest;
}

/** 只查白名单插件，不走 Obsidian 全量 checkForUpdates */
export async function resolveWhitelistPluginUpdates(
  app: App,
  pluginIds: string[],
  options: AutoUpdateRunOptions = {}
): Promise<Record<string, PluginUpdateInfo>> {
  const manager = getPluginManager(app);
  if (!manager) throw new Error("无法访问 Obsidian 插件管理器");

  const fetchJson = options.fetchJson ?? defaultFetchJson;
  const allowlist = normalizeAutoUpdatePluginIds(pluginIds);
  const catalog = await loadCommunityCatalog(fetchJson);
  const catalogIndex = buildCatalogIndex(catalog);
  const updates: Record<string, PluginUpdateInfo> = {};

  for (const rawId of allowlist) {
    const pluginId = resolveAutoUpdatePluginId(rawId);
    if (isAutoUpdateBlockedPluginId(pluginId)) continue;

    const entry = catalogIndex.get(pluginId);
    if (!entry?.repo) continue;

    const localVersion = String(manager.manifests?.[pluginId]?.version ?? "");
    if (!localVersion && !manager.manifests?.[pluginId]) continue;

    options.onProgress?.(`检查 ${AUTO_UPDATE_PLUGIN_LABELS[pluginId] ?? pluginId}…`);
    const remoteManifest = await fetchRemoteManifest(entry.repo, pluginId, fetchJson);
    if (!isRemotePluginVersionNewer(localVersion, remoteManifest.version)) continue;

    updates[pluginId] = {
      repo: entry.repo,
      version: remoteManifest.version,
      manifest: remoteManifest,
    };
  }

  return updates;
}

function getPluginManager(app: App): ObsidianPluginManager | null {
  const manager = (app as { plugins?: ObsidianPluginManager }).plugins;
  return manager && typeof manager === "object" ? manager : null;
}

function getInstalledVersion(manager: ObsidianPluginManager, pluginId: string): string {
  return String(manager.manifests?.[pluginId]?.version ?? "");
}

function getPluginDisplayName(pluginId: string, manager: ObsidianPluginManager): string {
  return (
    AUTO_UPDATE_PLUGIN_LABELS[pluginId] ??
    String(manager.manifests?.[pluginId]?.name ?? pluginId)
  );
}

function isManagedPluginEnabled(manager: ObsidianPluginManager, pluginId: string): boolean {
  const enabled = manager.enabledPlugins;
  if (!enabled) return false;
  if (enabled instanceof Set) return enabled.has(pluginId);
  if (Array.isArray(enabled)) return enabled.includes(pluginId);
  return false;
}

async function installPluginUpdate(
  manager: ObsidianPluginManager,
  pluginId: string,
  updateInfo: PluginUpdateInfo,
  wasEnabled: boolean
): Promise<void> {
  if (typeof manager.installPlugin !== "function") {
    throw new Error("当前 Obsidian 未暴露 installPlugin 接口");
  }

  if (wasEnabled && typeof manager.disablePlugin === "function") {
    await manager.disablePlugin(pluginId);
  }

  await Promise.race([
    manager.installPlugin(updateInfo.repo, updateInfo.version, updateInfo.manifest),
    new Promise<never>((_, reject) => {
      globalThis.setTimeout(
        () => reject(new Error("安装超时，请稍后在社区插件页手动确认")),
        INSTALL_TIMEOUT_MS
      );
    }),
  ]);

  if (typeof manager.loadManifest === "function") {
    await manager.loadManifest(pluginId);
  }

  if (wasEnabled) {
    if (typeof manager.enablePluginAndSave === "function") {
      await manager.enablePluginAndSave(pluginId);
    } else if (typeof manager.enablePlugin === "function") {
      await manager.enablePlugin(pluginId);
    }
  }
}

export async function runManagedPluginAutoUpdate(
  app: App,
  pluginIds: string[],
  options: AutoUpdateRunOptions = {}
): Promise<{
  results: ManagedPluginAutoUpdateResult[];
  summary: string;
}> {
  const manager = getPluginManager(app);
  if (!manager) {
    throw new Error("无法访问 Obsidian 插件管理器");
  }
  if (typeof manager.installPlugin !== "function") {
    throw new Error("当前 Obsidian 未暴露插件安装接口");
  }

  const allowlist = normalizeAutoUpdatePluginIds(pluginIds);
  const results: ManagedPluginAutoUpdateResult[] = [];
  const now = Date.now();

  options.onProgress?.("正在检查白名单插件更新…");
  const updatesRecord = await resolveWhitelistPluginUpdates(app, allowlist, options);

  for (const rawId of allowlist) {
    const pluginId = resolveAutoUpdatePluginId(rawId);
    const displayName = getPluginDisplayName(pluginId, manager);
    const installedVersion = getInstalledVersion(manager, pluginId);
    const wasEnabled = isManagedPluginEnabled(manager, pluginId);

    if (isAutoUpdateBlockedPluginId(pluginId)) {
      results.push({
        pluginId,
        status: "skipped",
        fromVersion: installedVersion || undefined,
        message: `${displayName} 为自研插件，跳过自动更新`,
        at: now,
      });
      continue;
    }

    if (!installedVersion && !manager.manifests?.[pluginId]) {
      results.push({
        pluginId,
        status: "not_installed",
        message: `${displayName} 未安装`,
        at: now,
      });
      continue;
    }

    const updateInfo = updatesRecord[pluginId];
    if (!updateInfo) {
      results.push({
        pluginId,
        status: "up_to_date",
        fromVersion: installedVersion || undefined,
        message: `${displayName} 已是最新`,
        at: now,
      });
      continue;
    }

    try {
      options.onProgress?.(`正在更新 ${displayName}…`);
      await installPluginUpdate(manager, pluginId, updateInfo, wasEnabled);
      results.push({
        pluginId,
        status: "updated",
        fromVersion: installedVersion || undefined,
        toVersion: updateInfo.version,
        message: `${displayName} ${installedVersion || "?"} → ${updateInfo.version}`,
        at: now,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        pluginId,
        status: "failed",
        fromVersion: installedVersion || undefined,
        toVersion: updateInfo.version,
        message: options.force ? message : `${displayName} 更新失败：${message}`,
        at: now,
      });
    }
  }

  const updatedCount = results.filter((item) => item.status === "updated").length;
  const failedCount = results.filter((item) => item.status === "failed").length;
  const summary =
    updatedCount > 0
      ? `已自动更新 ${updatedCount} 个插件`
      : failedCount > 0
        ? `插件自动更新失败 ${failedCount} 个`
        : "白名单插件均已是最新版本";

  return { results, summary };
}

export function formatAutoUpdateResult(result: ManagedPluginAutoUpdateResult): string {
  const label = AUTO_UPDATE_PLUGIN_LABELS[result.pluginId] ?? result.pluginId;
  switch (result.status) {
    case "updated":
      return `${label}：${result.fromVersion || "?"} → ${result.toVersion || "?"}`;
    case "up_to_date":
      return `${label}：已是最新${result.fromVersion ? `（${result.fromVersion}）` : ""}`;
    case "not_installed":
      return `${label}：未安装`;
    case "failed":
      return `${label}：更新失败${result.message ? `（${result.message}）` : ""}`;
    case "skipped":
      return `${label}：已跳过${result.message ? `（${result.message}）` : ""}`;
    default:
      return `${label}：已跳过`;
  }
}

/** 测试用：清空社区目录缓存 */
export function resetAutoUpdateCatalogCacheForTests() {
  catalogCache = null;
}
