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

// src/modules/managed-plugin-auto-updater.ts
var managed_plugin_auto_updater_exports = {};
__export(managed_plugin_auto_updater_exports, {
  AUTO_UPDATE_BLOCKED_PLUGIN_IDS: () => AUTO_UPDATE_BLOCKED_PLUGIN_IDS,
  AUTO_UPDATE_PLUGIN_LABELS: () => AUTO_UPDATE_PLUGIN_LABELS,
  DEFAULT_AUTO_UPDATE_PLUGIN_IDS: () => DEFAULT_AUTO_UPDATE_PLUGIN_IDS,
  formatAutoUpdateResult: () => formatAutoUpdateResult,
  isAutoUpdateBlockedPluginId: () => isAutoUpdateBlockedPluginId,
  isRemotePluginVersionNewer: () => isRemotePluginVersionNewer,
  normalizeAutoUpdatePluginIds: () => normalizeAutoUpdatePluginIds,
  normalizeAutoUpdateResults: () => normalizeAutoUpdateResults,
  readPluginUpdatesRecord: () => readPluginUpdatesRecord,
  resetAutoUpdateCatalogCacheForTests: () => resetAutoUpdateCatalogCacheForTests,
  resolveAutoUpdatePluginId: () => resolveAutoUpdatePluginId,
  resolveWhitelistPluginUpdates: () => resolveWhitelistPluginUpdates,
  runManagedPluginAutoUpdate: () => runManagedPluginAutoUpdate
});
module.exports = __toCommonJS(managed_plugin_auto_updater_exports);
var import_obsidian = require("obsidian");
var DEFAULT_AUTO_UPDATE_PLUGIN_IDS = ["yolo", "realclaudian"];
var AUTO_UPDATE_BLOCKED_PLUGIN_IDS = [
  "feishu-doc-toolbar",
  "markdown-table-enhancer",
  "block-link-plus",
  "onenote-archive-migrator"
];
var AUTO_UPDATE_PLUGIN_LABELS = {
  yolo: "YOLO",
  realclaudian: "Claudian",
  claudian: "Claudian"
};
var COMMUNITY_PLUGINS_URL = "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json";
var GITHUB_RAW = "https://raw.githubusercontent.com";
var CATALOG_CACHE_MS = 60 * 60 * 1e3;
var FETCH_TIMEOUT_MS = 3e4;
var INSTALL_TIMEOUT_MS = 18e4;
var catalogCache = null;
function resolveAutoUpdatePluginId(pluginId) {
  const trimmed = pluginId.trim();
  if (!trimmed) return "";
  if (trimmed === "claudian") return "realclaudian";
  return trimmed;
}
function isAutoUpdateBlockedPluginId(pluginId) {
  const resolved = resolveAutoUpdatePluginId(pluginId);
  return AUTO_UPDATE_BLOCKED_PLUGIN_IDS.includes(
    resolved
  );
}
function normalizeAutoUpdatePluginIds(value) {
  if (!Array.isArray(value)) return [...DEFAULT_AUTO_UPDATE_PLUGIN_IDS];
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const resolved = resolveAutoUpdatePluginId(item);
    if (!resolved || !/^[a-zA-Z0-9._-]+$/.test(resolved) || seen.has(resolved) || isAutoUpdateBlockedPluginId(resolved)) {
      continue;
    }
    seen.add(resolved);
    result.push(resolved);
  }
  return result.length > 0 ? result : [...DEFAULT_AUTO_UPDATE_PLUGIN_IDS];
}
function normalizeAutoUpdateResults(value) {
  if (!value || typeof value !== "object") return {};
  const next = {};
  for (const [rawId, rawResult] of Object.entries(value)) {
    const pluginId = resolveAutoUpdatePluginId(rawId);
    if (!pluginId || !rawResult || typeof rawResult !== "object") continue;
    const result = rawResult;
    const status = result.status;
    if (status !== "updated" && status !== "up_to_date" && status !== "not_installed" && status !== "skipped" && status !== "failed") {
      continue;
    }
    next[pluginId] = {
      pluginId,
      status,
      fromVersion: typeof result.fromVersion === "string" ? result.fromVersion : void 0,
      toVersion: typeof result.toVersion === "string" ? result.toVersion : void 0,
      message: typeof result.message === "string" ? result.message.slice(0, 160) : void 0,
      at: Number.isFinite(result.at) ? Number(result.at) : 0
    };
  }
  return next;
}
function isRemotePluginVersionNewer(localVersion, remoteVersion) {
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
function parseVersionParts(version) {
  return String(version).trim().split(/[.+_-]/).map((part) => {
    const match = part.match(/\d+/);
    return match ? Number(match[0]) : 0;
  });
}
function normalizePluginUpdateInfo(value) {
  if (!value || typeof value !== "object") return null;
  const raw = value;
  const repo = typeof raw.repo === "string" ? raw.repo : "";
  const version = typeof raw.version === "string" ? raw.version : "";
  const manifest = raw.manifest;
  if (!repo || !version || !manifest || typeof manifest !== "object") return null;
  return {
    repo,
    version,
    manifest
  };
}
function readPluginUpdatesRecord(updates) {
  if (!updates) return {};
  if (updates instanceof Map) {
    const record = {};
    for (const [pluginId, value] of updates.entries()) {
      const normalized = normalizePluginUpdateInfo(value);
      if (normalized) record[String(pluginId)] = normalized;
    }
    return record;
  }
  if (typeof updates === "object") {
    const record = {};
    for (const [pluginId, value] of Object.entries(updates)) {
      const normalized = normalizePluginUpdateInfo(value);
      if (normalized) record[pluginId] = normalized;
    }
    return record;
  }
  return {};
}
async function defaultFetchJson(url) {
  const response = await Promise.race([
    (0, import_obsidian.requestUrl)({
      url,
      method: "GET",
      headers: { "User-Agent": "ZengQiang-Enhanced-Plugin-Auto-Update" },
      throw: false
    }),
    new Promise((_, reject) => {
      globalThis.setTimeout(() => reject(new Error(`\u8BF7\u6C42\u8D85\u65F6\uFF1A${url}`)), FETCH_TIMEOUT_MS);
    })
  ]);
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json;
}
async function loadCommunityCatalog(fetchJson) {
  const now = Date.now();
  if (catalogCache && now - catalogCache.at < CATALOG_CACHE_MS) {
    return catalogCache.entries;
  }
  const raw = await fetchJson(COMMUNITY_PLUGINS_URL);
  if (!Array.isArray(raw)) {
    throw new Error("\u793E\u533A\u63D2\u4EF6\u76EE\u5F55\u683C\u5F0F\u65E0\u6548");
  }
  const entries = raw.filter((item) => !!item && typeof item === "object");
  catalogCache = { at: now, entries };
  return entries;
}
function buildCatalogIndex(entries) {
  const index = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    if (typeof entry.id === "string" && typeof entry.repo === "string") {
      index.set(entry.id, entry);
    }
  }
  return index;
}
async function fetchRemoteManifest(repo, pluginId, fetchJson) {
  const manifestUrl = `${GITHUB_RAW}/${repo}/HEAD/manifest.json`;
  const raw = await fetchJson(manifestUrl);
  if (!raw || typeof raw !== "object") {
    throw new Error("\u8FDC\u7A0B manifest \u65E0\u6548");
  }
  const manifest = raw;
  if (manifest.id !== pluginId) {
    throw new Error(`\u8FDC\u7A0B manifest id \u4E0D\u5339\u914D\uFF08\u671F\u671B ${pluginId}\uFF0C\u5B9E\u9645 ${manifest.id ?? "\u672A\u77E5"}\uFF09`);
  }
  if (!manifest.version) {
    throw new Error("\u8FDC\u7A0B manifest \u7F3A\u5C11 version");
  }
  return manifest;
}
async function resolveWhitelistPluginUpdates(app, pluginIds, options = {}) {
  const manager = getPluginManager(app);
  if (!manager) throw new Error("\u65E0\u6CD5\u8BBF\u95EE Obsidian \u63D2\u4EF6\u7BA1\u7406\u5668");
  const fetchJson = options.fetchJson ?? defaultFetchJson;
  const allowlist = normalizeAutoUpdatePluginIds(pluginIds);
  const catalog = await loadCommunityCatalog(fetchJson);
  const catalogIndex = buildCatalogIndex(catalog);
  const updates = {};
  for (const rawId of allowlist) {
    const pluginId = resolveAutoUpdatePluginId(rawId);
    if (isAutoUpdateBlockedPluginId(pluginId)) continue;
    const entry = catalogIndex.get(pluginId);
    if (!entry?.repo) continue;
    const localVersion = String(manager.manifests?.[pluginId]?.version ?? "");
    if (!localVersion && !manager.manifests?.[pluginId]) continue;
    options.onProgress?.(`\u68C0\u67E5 ${AUTO_UPDATE_PLUGIN_LABELS[pluginId] ?? pluginId}\u2026`);
    const remoteManifest = await fetchRemoteManifest(entry.repo, pluginId, fetchJson);
    if (!isRemotePluginVersionNewer(localVersion, remoteManifest.version)) continue;
    updates[pluginId] = {
      repo: entry.repo,
      version: remoteManifest.version,
      manifest: remoteManifest
    };
  }
  return updates;
}
function getPluginManager(app) {
  const manager = app.plugins;
  return manager && typeof manager === "object" ? manager : null;
}
function getInstalledVersion(manager, pluginId) {
  return String(manager.manifests?.[pluginId]?.version ?? "");
}
function getPluginDisplayName(pluginId, manager) {
  return AUTO_UPDATE_PLUGIN_LABELS[pluginId] ?? String(manager.manifests?.[pluginId]?.name ?? pluginId);
}
function isManagedPluginEnabled(manager, pluginId) {
  const enabled = manager.enabledPlugins;
  if (!enabled) return false;
  if (enabled instanceof Set) return enabled.has(pluginId);
  if (Array.isArray(enabled)) return enabled.includes(pluginId);
  return false;
}
async function installPluginUpdate(manager, pluginId, updateInfo, wasEnabled) {
  if (typeof manager.installPlugin !== "function") {
    throw new Error("\u5F53\u524D Obsidian \u672A\u66B4\u9732 installPlugin \u63A5\u53E3");
  }
  if (wasEnabled && typeof manager.disablePlugin === "function") {
    await manager.disablePlugin(pluginId);
  }
  await Promise.race([
    manager.installPlugin(updateInfo.repo, updateInfo.version, updateInfo.manifest),
    new Promise((_, reject) => {
      globalThis.setTimeout(
        () => reject(new Error("\u5B89\u88C5\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u5728\u793E\u533A\u63D2\u4EF6\u9875\u624B\u52A8\u786E\u8BA4")),
        INSTALL_TIMEOUT_MS
      );
    })
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
async function runManagedPluginAutoUpdate(app, pluginIds, options = {}) {
  const manager = getPluginManager(app);
  if (!manager) {
    throw new Error("\u65E0\u6CD5\u8BBF\u95EE Obsidian \u63D2\u4EF6\u7BA1\u7406\u5668");
  }
  if (typeof manager.installPlugin !== "function") {
    throw new Error("\u5F53\u524D Obsidian \u672A\u66B4\u9732\u63D2\u4EF6\u5B89\u88C5\u63A5\u53E3");
  }
  const allowlist = normalizeAutoUpdatePluginIds(pluginIds);
  const results = [];
  const now = Date.now();
  options.onProgress?.("\u6B63\u5728\u68C0\u67E5\u767D\u540D\u5355\u63D2\u4EF6\u66F4\u65B0\u2026");
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
        fromVersion: installedVersion || void 0,
        message: `${displayName} \u4E3A\u81EA\u7814\u63D2\u4EF6\uFF0C\u8DF3\u8FC7\u81EA\u52A8\u66F4\u65B0`,
        at: now
      });
      continue;
    }
    if (!installedVersion && !manager.manifests?.[pluginId]) {
      results.push({
        pluginId,
        status: "not_installed",
        message: `${displayName} \u672A\u5B89\u88C5`,
        at: now
      });
      continue;
    }
    const updateInfo = updatesRecord[pluginId];
    if (!updateInfo) {
      results.push({
        pluginId,
        status: "up_to_date",
        fromVersion: installedVersion || void 0,
        message: `${displayName} \u5DF2\u662F\u6700\u65B0`,
        at: now
      });
      continue;
    }
    try {
      options.onProgress?.(`\u6B63\u5728\u66F4\u65B0 ${displayName}\u2026`);
      await installPluginUpdate(manager, pluginId, updateInfo, wasEnabled);
      results.push({
        pluginId,
        status: "updated",
        fromVersion: installedVersion || void 0,
        toVersion: updateInfo.version,
        message: `${displayName} ${installedVersion || "?"} \u2192 ${updateInfo.version}`,
        at: now
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        pluginId,
        status: "failed",
        fromVersion: installedVersion || void 0,
        toVersion: updateInfo.version,
        message: options.force ? message : `${displayName} \u66F4\u65B0\u5931\u8D25\uFF1A${message}`,
        at: now
      });
    }
  }
  const updatedCount = results.filter((item) => item.status === "updated").length;
  const failedCount = results.filter((item) => item.status === "failed").length;
  const summary = updatedCount > 0 ? `\u5DF2\u81EA\u52A8\u66F4\u65B0 ${updatedCount} \u4E2A\u63D2\u4EF6` : failedCount > 0 ? `\u63D2\u4EF6\u81EA\u52A8\u66F4\u65B0\u5931\u8D25 ${failedCount} \u4E2A` : "\u767D\u540D\u5355\u63D2\u4EF6\u5747\u5DF2\u662F\u6700\u65B0\u7248\u672C";
  return { results, summary };
}
function formatAutoUpdateResult(result) {
  const label = AUTO_UPDATE_PLUGIN_LABELS[result.pluginId] ?? result.pluginId;
  switch (result.status) {
    case "updated":
      return `${label}\uFF1A${result.fromVersion || "?"} \u2192 ${result.toVersion || "?"}`;
    case "up_to_date":
      return `${label}\uFF1A\u5DF2\u662F\u6700\u65B0${result.fromVersion ? `\uFF08${result.fromVersion}\uFF09` : ""}`;
    case "not_installed":
      return `${label}\uFF1A\u672A\u5B89\u88C5`;
    case "failed":
      return `${label}\uFF1A\u66F4\u65B0\u5931\u8D25${result.message ? `\uFF08${result.message}\uFF09` : ""}`;
    case "skipped":
      return `${label}\uFF1A\u5DF2\u8DF3\u8FC7${result.message ? `\uFF08${result.message}\uFF09` : ""}`;
    default:
      return `${label}\uFF1A\u5DF2\u8DF3\u8FC7`;
  }
}
function resetAutoUpdateCatalogCacheForTests() {
  catalogCache = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AUTO_UPDATE_BLOCKED_PLUGIN_IDS,
  AUTO_UPDATE_PLUGIN_LABELS,
  DEFAULT_AUTO_UPDATE_PLUGIN_IDS,
  formatAutoUpdateResult,
  isAutoUpdateBlockedPluginId,
  isRemotePluginVersionNewer,
  normalizeAutoUpdatePluginIds,
  normalizeAutoUpdateResults,
  readPluginUpdatesRecord,
  resetAutoUpdateCatalogCacheForTests,
  resolveAutoUpdatePluginId,
  resolveWhitelistPluginUpdates,
  runManagedPluginAutoUpdate
});
