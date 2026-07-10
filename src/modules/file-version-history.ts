/**
 * 本地文件版本历史：不依赖 Obsidian Sync / 文件恢复核心插件。
 * iCloud 库路径、Sync 断连时，官方「版本历史」常报「无法检索版本历史记录」；
 * 本模块把快照存在 vault 内插件目录，随库同步、可稳定读取。
 */

import {
  App,
  Menu,
  Modal,
  Notice,
  Setting,
  TFile,
  normalizePath,
} from "obsidian";

import { EmbeddedSubModule, SubPluginHost } from "./sub-plugin-host";

const OUTLINER_VIEW_TYPE = "blp-file-outliner-view";
const SYNC_PLUGIN_ID = "sync";
const FILE_RECOVERY_PLUGIN_ID = "file-recovery";

const MODULE_ID = "file-version-history";
const VERSIONS_ROOT = normalizePath(`.obsidian/plugins/feishu-doc-toolbar/file-versions`);
const INDEX_DIR = normalizePath(`${VERSIONS_ROOT}/indexes`);
const SNAPSHOT_DIR = normalizePath(`${VERSIONS_ROOT}/snapshots`);

const DEFAULT_SETTINGS: FileVersionHistorySettings = {
  autoSnapshotEnabled: true,
  minIntervalMs: 5 * 60 * 1000,
  retentionDays: 30,
  maxSnapshotsPerFile: 80,
};

const PAGE_SIZE = 40;

export type FileVersionHistorySettings = {
  autoSnapshotEnabled: boolean;
  minIntervalMs: number;
  retentionDays: number;
  maxSnapshotsPerFile: number;
};

type SnapshotMeta = {
  id: string;
  createdAt: number;
  reason: string;
  size: number;
};

type FileIndex = {
  filePath: string;
  snapshots: SnapshotMeta[];
};

let activeRunner: FileVersionHistoryRunner | null = null;

function normalizeSettings(raw: Partial<FileVersionHistorySettings> | null | undefined): FileVersionHistorySettings {
  const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  return {
    autoSnapshotEnabled: merged.autoSnapshotEnabled !== false,
    minIntervalMs: clampNumber(merged.minIntervalMs, 60_000, 24 * 60 * 60 * 1000, DEFAULT_SETTINGS.minIntervalMs),
    retentionDays: clampNumber(merged.retentionDays, 1, 365, DEFAULT_SETTINGS.retentionDays),
    maxSnapshotsPerFile: clampNumber(merged.maxSnapshotsPerFile, 5, 500, DEFAULT_SETTINGS.maxSnapshotsPerFile),
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/** macOS 单段文件名上限约 255；深层中文路径 URL 编码后可达 300+，会触发 ENAMETOOLONG */
const MAX_LEGACY_ENCODED_LEN = 200;

const LOCAL_READ_ERROR_NOTICE = "本地版本历史读取失败，详见控制台";
const storageKeyCache = new Map<string, string>();

type BridgePatchStatus = {
  syncPrototype: boolean;
  syncCommand: boolean;
  fileRecovery: boolean;
  patchedMethods: string[];
};

let bridgePatchStatus: BridgePatchStatus = {
  syncPrototype: false,
  syncCommand: false,
  fileRecovery: false,
  patchedMethods: [],
};

/** 统一路径：NFC、半角冒号→全角、去空白（兼容 Sync 与 vault 路径差异） */
export function canonicalizeVaultPath(filePath: string): string {
  let p = normalizePath(String(filePath).trim());
  try {
    p = p.normalize("NFC");
  } catch {
    // ignore
  }
  return p.replace(/:/g, "：");
}

function pathsMatch(a: string, b: string): boolean {
  const ca = canonicalizeVaultPath(a);
  const cb = canonicalizeVaultPath(b);
  if (ca === cb) return true;
  return (ca.split("/").pop() ?? ca) === (cb.split("/").pop() ?? cb);
}

function encodePath(filePath: string): string {
  return encodeURIComponent(canonicalizeVaultPath(filePath)).replace(/%/g, "_");
}

function hashStorageKey(filePath: string): string {
  const normalized = canonicalizeVaultPath(filePath);
  const cached = storageKeyCache.get(normalized);
  if (cached) return cached;
  let out = "";
  for (let round = 0; round < 5; round += 1) {
    out += hashContent(`fv-hash:${round}:${normalized}:${out}`);
  }
  const key = `h_${out.replace(/[^a-z0-9]/gi, "x").slice(0, 32)}`;
  storageKeyCache.set(normalized, key);
  return key;
}

/** 写入统一走短哈希键；读取仍兼容 legacy encode */
function primaryStorageKey(filePath: string): string {
  return hashStorageKey(filePath);
}

function allStorageKeys(filePath: string): string[] {
  const canonical = canonicalizeVaultPath(filePath);
  const hash = hashStorageKey(canonical);
  const keys = new Set<string>([hash]);
  const legacyCanonical = encodePath(canonical);
  if (legacyCanonical !== hash && legacyCanonical.length <= MAX_LEGACY_ENCODED_LEN) {
    keys.add(legacyCanonical);
  }
  const legacyRaw = encodeURIComponent(normalizePath(filePath)).replace(/%/g, "_");
  if (legacyRaw !== hash && legacyRaw.length <= MAX_LEGACY_ENCODED_LEN) {
    keys.add(legacyRaw);
  }
  return [...keys];
}

function hashContent(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function formatWhen(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function computeLineDiff(before: string, after: string): string {
  const a = before.split("\n");
  const b = after.split("\n");
  const lines: string[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      if (left !== undefined) lines.push(` ${left}`);
      continue;
    }
    if (left !== undefined) lines.push(`-${left}`);
    if (right !== undefined) lines.push(`+${right}`);
  }
  return lines.join("\n");
}

export class FileVersionHistoryStore {
  constructor(private readonly app: App) {}

  private indexPath(filePath: string, storageKey = primaryStorageKey(filePath)): string {
    return normalizePath(`${INDEX_DIR}/${storageKey}.json`);
  }

  private snapshotPath(filePath: string, snapshotId: string, storageKey = primaryStorageKey(filePath)): string {
    return normalizePath(`${SNAPSHOT_DIR}/${storageKey}/${snapshotId}.md`);
  }

  async ensureDirs(): Promise<void> {
    for (const dir of [VERSIONS_ROOT, INDEX_DIR, SNAPSHOT_DIR]) {
      if (await this.app.vault.adapter.exists(dir)) continue;
      try {
        await this.app.vault.createFolder(dir);
      } catch {
        const adapter = this.app.vault.adapter as { mkdir?: (path: string) => Promise<void> };
        if (typeof adapter.mkdir === "function") {
          await adapter.mkdir(dir);
        }
      }
    }
  }

  async readIndex(filePath: string): Promise<FileIndex> {
    const canonical = canonicalizeVaultPath(filePath);
    for (const key of allStorageKeys(canonical)) {
      const direct = await this.readIndexFile(this.indexPath(canonical, key), canonical);
      if (direct.snapshots.length > 0) return direct;
    }
    return this.findIndexByStoredPath(canonical);
  }

  private async readIndexFile(path: string, filePath: string): Promise<FileIndex> {
    const adapter = this.app.vault.adapter;
    try {
      if (!(await adapter.exists(path))) {
        return { filePath, snapshots: [] };
      }
      const raw = JSON.parse(await adapter.read(path)) as FileIndex;
      const snapshots = Array.isArray(raw?.snapshots) ? raw.snapshots : [];
      const storedPath = typeof raw?.filePath === "string" ? raw.filePath : filePath;
      return {
        filePath: storedPath,
        snapshots: snapshots
          .filter((s) => s && typeof s.id === "string" && Number.isFinite(Number(s.createdAt)))
          .sort((x, y) => Number(y.createdAt) - Number(x.createdAt)),
      };
    } catch {
      return { filePath, snapshots: [] };
    }
  }

  /** 路径编码不一致时，按 index 内记录的 filePath 回查 */
  private async findIndexByStoredPath(filePath: string): Promise<FileIndex> {
    const adapter = this.app.vault.adapter;
    try {
      if (!(await adapter.exists(INDEX_DIR))) {
        return { filePath, snapshots: [] };
      }
    } catch {
      return { filePath, snapshots: [] };
    }
    const normalized = canonicalizeVaultPath(filePath);
    let indexFiles: string[] = [];
    try {
      const listing = (await adapter.list(INDEX_DIR)) as { files?: string[]; folders?: string[] } | string[];
      indexFiles = Array.isArray(listing) ? listing : (listing.files ?? []);
    } catch {
      return { filePath: normalized, snapshots: [] };
    }
    for (const rawName of indexFiles) {
      const name = String(rawName).includes("/")
        ? (String(rawName).split("/").pop() ?? String(rawName))
        : String(rawName);
      if (!name.endsWith(".json")) continue;
      const idx = await this.readIndexFile(normalizePath(`${INDEX_DIR}/${name}`), normalized);
      if (idx.snapshots.length === 0) continue;
      if (pathsMatch(idx.filePath, normalized)) {
        return idx;
      }
    }
    return { filePath, snapshots: [] };
  }

  private async writeIndex(index: FileIndex): Promise<void> {
    await this.ensureDirs();
    index.filePath = canonicalizeVaultPath(index.filePath);
    await this.app.vault.adapter.write(this.indexPath(index.filePath), JSON.stringify(index, null, 2));
  }

  async listSnapshots(filePath: string, offset = 0, limit = PAGE_SIZE): Promise<{ items: SnapshotMeta[]; total: number }> {
    try {
      const index = await this.readIndex(filePath);
      const total = index.snapshots.length;
      return { items: index.snapshots.slice(offset, offset + limit), total };
    } catch (err) {
      console.error("[file-version-history] listSnapshots failed", err);
      return { items: [], total: 0 };
    }
  }

  /** 读取快照内容；索引路径与查询路径不一致时按 index 内路径读文件 */
  private async resolveSnapshotFilePath(filePath: string): Promise<string> {
    const index = await this.readIndex(filePath);
    return index.filePath || filePath;
  }

  async readSnapshotContent(filePath: string, snapshotId: string): Promise<string | null> {
    const resolvedPath = await this.resolveSnapshotFilePath(filePath);
    const keys = [...new Set([...allStorageKeys(resolvedPath), ...allStorageKeys(filePath)])];
    for (const key of keys) {
      const path = this.snapshotPath(resolvedPath, snapshotId, key);
      try {
        if (!(await this.app.vault.adapter.exists(path))) continue;
        return await this.app.vault.adapter.read(path);
      } catch {
        // 路径过长或文件缺失时继续尝试其它 storage key
      }
    }
    return null;
  }

  async createSnapshot(file: TFile, reason: string, opts?: { force?: boolean; settings?: FileVersionHistorySettings }): Promise<SnapshotMeta | null> {
    if (file.extension !== "md") return null;
    try {
      const settings = opts?.settings ?? DEFAULT_SETTINGS;
      const content = await this.app.vault.cachedRead(file);
      const contentHash = hashContent(content);
      const index = await this.readIndex(file.path);
      const latest = index.snapshots[0];
      const now = Date.now();
      if (!opts?.force && latest) {
        const latestContent = await this.readSnapshotContent(file.path, latest.id);
        if (latestContent !== null && hashContent(latestContent) === contentHash) {
          return null;
        }
        if (!opts?.force && now - Number(latest.createdAt) < settings.minIntervalMs) {
          return null;
        }
      }

      await this.ensureDirs();
      const storageKey = primaryStorageKey(file.path);
      const snapshotId = `${now}-${Math.random().toString(36).slice(2, 8)}`;
      const snapshotPath = this.snapshotPath(file.path, snapshotId, storageKey);
      const dir = snapshotPath.slice(0, snapshotPath.lastIndexOf("/"));
      if (!(await this.app.vault.adapter.exists(dir))) {
        try {
          await this.app.vault.createFolder(dir);
        } catch {
          const adapter = this.app.vault.adapter as { mkdir?: (path: string) => Promise<void> };
          if (typeof adapter.mkdir === "function") {
            await adapter.mkdir(dir);
          }
        }
      }
      await this.app.vault.adapter.write(snapshotPath, content);

      const meta: SnapshotMeta = {
        id: snapshotId,
        createdAt: now,
        reason,
        size: content.length,
      };
      index.snapshots.unshift(meta);
      await this.pruneIndex(file.path, index, settings);
      await this.writeIndex(index);
      return meta;
    } catch (err) {
      console.error("[file-version-history] createSnapshot failed", err);
      return null;
    }
  }

  private async pruneIndex(filePath: string, index: FileIndex, settings: FileVersionHistorySettings): Promise<void> {
    const adapter = this.app.vault.adapter;
    const cutoff = Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000;
    const kept: SnapshotMeta[] = [];
    const keys = allStorageKeys(index.filePath || filePath);
    for (const snap of index.snapshots) {
      const tooOld = Number(snap.createdAt) < cutoff;
      const overLimit = kept.length >= settings.maxSnapshotsPerFile;
      if (tooOld || overLimit) {
        for (const key of keys) {
          const p = this.snapshotPath(index.filePath || filePath, snap.id, key);
          try {
            if (await adapter.exists(p)) {
              await adapter.remove(p);
            }
          } catch {
            // ignore missing / invalid path
          }
        }
        continue;
      }
      kept.push(snap);
    }
    index.snapshots = kept;
  }

  async restoreSnapshot(file: TFile, snapshotId: string): Promise<boolean> {
    const content = await this.readSnapshotContent(file.path, snapshotId);
    if (content === null) return false;
    await this.createSnapshot(file, "before-restore", { force: true });
    await this.app.vault.modify(file, content);
    return true;
  }
}

class FileVersionHistoryModal extends Modal {
  private snapshots: SnapshotMeta[] = [];
  private selectedId: string | null = null;
  private offset = 0;
  private total = 0;
  private showDiff = false;
  private listEl: HTMLElement | null = null;
  private previewEl: HTMLElement | null = null;
  private loadMoreEl: HTMLElement | null = null;
  private diffToggleEl: HTMLElement | null = null;
  private loading = false;
  private loadError: string | null = null;

  constructor(
    app: App,
    private readonly runner: FileVersionHistoryRunner,
    private readonly file: TFile
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, modalEl, titleEl } = this;
    contentEl.empty();
    contentEl.addClass("fdtb-version-history-modal");
    modalEl.addClass("fdtb-version-history-modal-shell");
    titleEl.setText(this.file.basename);

    const toolbar = contentEl.createDiv({ cls: "fdtb-version-history-toolbar" });
    const diffWrap = toolbar.createDiv({ cls: "fdtb-version-history-diff-wrap" });
    diffWrap.createSpan({ text: "显示差异" });
    this.diffToggleEl = diffWrap.createEl("input", { type: "checkbox" });
    this.diffToggleEl.addEventListener("change", () => {
      this.showDiff = this.diffToggleEl?.checked === true;
      void this.renderPreview();
    });

    const actions = toolbar.createDiv({ cls: "fdtb-version-history-actions" });
    actions.createEl("button", { text: "复制", cls: "mod-muted" }).addEventListener("click", () => {
      void this.copySelected();
    });
    actions.createEl("button", { text: "恢复此版本", cls: "mod-cta" }).addEventListener("click", () => {
      void this.restoreSelected();
    });

    const body = contentEl.createDiv({ cls: "fdtb-version-history-body" });
    this.listEl = body.createDiv({ cls: "fdtb-version-history-list" });
    this.previewEl = body.createDiv({ cls: "fdtb-version-history-preview" });
    this.loadMoreEl = this.listEl.createDiv({ cls: "fdtb-version-history-load-more", text: "加载更多" });
    this.loadMoreEl.addEventListener("click", () => {
      void this.loadMore();
    });

    void this.reload(true);
  }

  private async reload(selectFirst: boolean): Promise<void> {
    this.loading = true;
    this.loadError = null;
    this.offset = 0;
    this.snapshots = [];
    try {
      await this.runner.ensureBootstrapSnapshot(this.file).catch((err) => {
        console.warn("[file-version-history] bootstrap snapshot skipped", err);
      });
      const page = await this.runner.store.listSnapshots(this.file.path, 0, PAGE_SIZE);
      this.snapshots = page.items;
      this.total = page.total;
      if (selectFirst) {
        this.selectedId = this.snapshots[0]?.id ?? null;
      }
      if (this.snapshots.length === 0) {
        this.loadError = "暂无本地快照";
      }
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : String(err);
      console.error("[file-version-history] reload failed", err);
      new Notice(LOCAL_READ_ERROR_NOTICE);
    } finally {
      this.loading = false;
      this.renderList();
      try {
        await this.renderPreview();
      } catch (err) {
        console.error("[file-version-history] preview failed", err);
      }
    }
  }

  private async loadMore(): Promise<void> {
    if (this.loading) return;
    if (this.snapshots.length >= this.total) return;
    this.loading = true;
    try {
      this.offset = this.snapshots.length;
      const page = await this.runner.store.listSnapshots(this.file.path, this.offset, PAGE_SIZE);
      this.snapshots.push(...page.items);
      this.total = page.total;
    } catch {
      new Notice(LOCAL_READ_ERROR_NOTICE);
    } finally {
      this.loading = false;
      this.renderList();
    }
  }

  private renderList(): void {
    if (!this.listEl || !this.loadMoreEl) return;
    this.listEl.empty();
    const openBtn = this.listEl.createEl("button", {
      cls: "fdtb-version-history-open-list mod-cta",
      text: "打开快照列表",
    });
    openBtn.addEventListener("click", () => {
      void this.reload(true);
    });

    if (this.loadError) {
      const msg =
        this.loadError === "暂无本地快照"
          ? "暂无快照。保存文件后会自动记录；也可点上方按钮刷新。"
          : "本地版本历史读取失败，可点上方按钮重试或查看控制台";
      this.listEl.createDiv({ cls: "fdtb-version-history-empty", text: msg });
      this.listEl.appendChild(this.loadMoreEl);
      this.loadMoreEl.toggleAttribute("hidden", true);
      return;
    }

    if (this.snapshots.length === 0) {
      this.listEl.createDiv({
        cls: "fdtb-version-history-empty",
        text: "暂无快照。保存文件后会自动记录；也可点上方按钮刷新。",
      });
      this.listEl.appendChild(this.loadMoreEl);
      this.loadMoreEl.toggleAttribute("hidden", true);
      return;
    }

    for (const snap of this.snapshots) {
      const row = this.listEl.createDiv({
        cls: `fdtb-version-history-item${this.selectedId === snap.id ? " is-active" : ""}`,
        text: formatWhen(Number(snap.createdAt)),
      });
      row.createDiv({ cls: "fdtb-version-history-item-meta", text: snap.reason || "自动快照" });
      row.addEventListener("click", () => {
        this.selectedId = snap.id;
        this.renderList();
        void this.renderPreview();
      });
    }

    this.listEl.appendChild(this.loadMoreEl);
    this.loadMoreEl.toggleAttribute("hidden", this.snapshots.length >= this.total);
    this.loadMoreEl.setText(this.snapshots.length >= this.total ? "没有更多了" : "加载更多");
  }

  private async renderPreview(): Promise<void> {
    if (!this.previewEl) return;
    this.previewEl.empty();
    if (!this.selectedId) {
      this.previewEl.createDiv({ cls: "fdtb-version-history-empty", text: "请选择左侧快照" });
      return;
    }
    const content = await this.runner.store.readSnapshotContent(this.file.path, this.selectedId);
    if (content === null) {
      this.previewEl.createDiv({ cls: "fdtb-version-history-empty", text: "快照文件缺失，无法预览" });
      return;
    }
    if (this.showDiff) {
      const current = await this.app.vault.cachedRead(this.file);
      const pre = this.previewEl.createEl("pre", { cls: "fdtb-version-history-diff" });
      pre.setText(computeLineDiff(content, current));
      return;
    }
    const pre = this.previewEl.createEl("pre", { cls: "fdtb-version-history-content" });
    pre.setText(content);
  }

  private async copySelected(): Promise<void> {
    if (!this.selectedId) {
      new Notice("请先选择快照");
      return;
    }
    const content = await this.runner.store.readSnapshotContent(this.file.path, this.selectedId);
    if (content === null) {
      new Notice("快照不存在");
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      new Notice("已复制到剪贴板");
    } catch {
      new Notice("复制失败");
    }
  }

  private async restoreSelected(): Promise<void> {
    if (!this.selectedId) {
      new Notice("请先选择快照");
      return;
    }
    const ok = await this.runner.store.restoreSnapshot(this.file, this.selectedId);
    new Notice(ok ? "已恢复此版本" : "恢复失败");
    if (ok) {
      await this.reload(false);
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class FileVersionHistoryRunner {
  readonly store: FileVersionHistoryStore;
  settings: FileVersionHistorySettings = { ...DEFAULT_SETTINGS };
  private timers = new Map<string, number>();

  constructor(public host: SubPluginHost) {
    this.store = new FileVersionHistoryStore(host.app);
  }

  async start(): Promise<void> {
    const saved = (await this.host.loadData()) as Partial<FileVersionHistorySettings> | null;
    this.settings = normalizeSettings(saved);
    await this.store.ensureDirs();

    this.host.addCommand({
      id: "open-file-version-history",
      name: "打开当前文件版本历史",
      checkCallback: (checking) => {
        const file = getActiveMarkdownFile(this.host.app);
        const can = !!file;
        if (checking) return can;
        if (file) this.openForFile(file);
        return true;
      },
    });

    this.host.addCommand({
      id: "diagnose-file-version-history",
      name: "诊断本地文件版本历史",
      checkCallback: (checking) => {
        const file = getActiveMarkdownFile(this.host.app);
        if (!file) return false;
        if (checking) return true;
        void this.runDiagnose(file);
        return true;
      },
    });

    installVersionHistoryBridge(this.host);

    this.host.registerEvent(
      this.host.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        menu.addItem((item) => {
          item.setTitle("版本历史").setIcon("history").onClick(() => this.openForFile(file));
        });
      })
    );

    if (this.settings.autoSnapshotEnabled) {
      this.host.registerEvent(
        this.host.app.vault.on("modify", (file) => {
          if (file instanceof TFile) this.queueSnapshot(file, "自动快照");
        })
      );
      this.host.registerEvent(
        this.host.app.vault.on("create", (file) => {
          if (file instanceof TFile) this.queueSnapshot(file, "创建快照");
        })
      );
    }

    this.host.register(() => {
      for (const timer of this.timers.values()) {
        window.clearTimeout(timer);
      }
      this.timers.clear();
    });
  }

  openForFile(file: TFile): void {
    if (file.extension !== "md") {
      new Notice("仅支持 Markdown 文件");
      return;
    }
    new FileVersionHistoryModal(this.host.app, this, file).open();
  }

  async ensureBootstrapSnapshot(file: TFile): Promise<void> {
    const page = await this.store.listSnapshots(file.path, 0, 1);
    if (page.total > 0) return;
    await this.store.createSnapshot(file, "首次打开", { force: true, settings: this.settings });
  }

  private queueSnapshot(file: TFile, reason: string): void {
    if (!this.settings.autoSnapshotEnabled || file.extension !== "md") return;
    const prev = this.timers.get(file.path);
    if (prev) window.clearTimeout(prev);
    const timer = window.setTimeout(() => {
      this.timers.delete(file.path);
      void this.store.createSnapshot(file, reason, { settings: this.settings }).catch((err) => {
        console.error("[file-version-history] snapshot failed", err);
      });
    }, 1200);
    this.timers.set(file.path, timer);
  }

  async saveSettings(next: Partial<FileVersionHistorySettings>): Promise<void> {
    this.settings = normalizeSettings({ ...this.settings, ...next });
    await this.host.saveData(this.settings);
  }

  async runDiagnose(file: TFile): Promise<void> {
    const canonical = canonicalizeVaultPath(file.path);
    const storageKey = primaryStorageKey(file.path);
    const page = await this.store.listSnapshots(file.path, 0, 5);
    const bridge = getVersionHistoryBridgeStatus();
    let indexExists = false;
    try {
      indexExists = await this.host.app.vault.adapter.exists(
        normalizePath(`${INDEX_DIR}/${storageKey}.json`)
      );
    } catch {
      indexExists = false;
    }
    const report = {
      filePath: file.path,
      canonicalPath: canonical,
      storageKey,
      indexExists,
      snapshotTotal: page.total,
      bridge,
    };
    console.info("[file-version-history] diagnose", report);
    new Notice(`版本历史诊断：快照 ${page.total} 条（详情见控制台）`, 6000);
  }
}

export function renderFileVersionHistorySettings(containerEl: HTMLElement, onRefresh: () => void): void {
  const runner = activeRunner;
  containerEl.empty();
  containerEl.createEl("h3", { text: "本地文件版本历史" });
  containerEl.createEl("p", {
    cls: "setting-item-description",
    text: "快照保存在库内插件目录，不依赖 Obsidian Sync。Sync/文件恢复失败时仍可用。",
  });
  if (!runner) {
    containerEl.createEl("p", { text: "模块未运行（请在上方打开开关）。" });
    return;
  }
  new Setting(containerEl)
    .setName("自动保存快照")
    .setDesc("编辑笔记后自动写入本地版本历史（默认每 5 分钟最多一条）")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.autoSnapshotEnabled).onChange(async (value) => {
        await runner.saveSettings({ autoSnapshotEnabled: value });
        onRefresh();
      })
    );
  new Setting(containerEl)
    .setName("快照最短间隔（分钟）")
    .addText((text) =>
      text
        .setValue(String(Math.round(runner.settings.minIntervalMs / 60_000)))
        .onChange(async (raw) => {
          const minutes = clampNumber(Number(raw), 1, 1440, 5);
          await runner.saveSettings({ minIntervalMs: minutes * 60_000 });
        })
    );
  new Setting(containerEl)
    .setName("保留天数")
    .addText((text) =>
      text.setValue(String(runner.settings.retentionDays)).onChange(async (raw) => {
        const days = clampNumber(Number(raw), 1, 365, DEFAULT_SETTINGS.retentionDays);
        await runner.saveSettings({ retentionDays: days });
      })
    );

  const bridge = getVersionHistoryBridgeStatus();
  const bridgeLabel = bridge.syncPrototype || bridge.syncCommand ? "已接管 Sync/恢复入口" : "未完全接管（请用右键/命令面板）";
  containerEl.createEl("p", {
    cls: "setting-item-description",
    text: `Sync 桥接：${bridgeLabel}${bridge.patchedMethods.length ? `（${bridge.patchedMethods.join(", ")}）` : ""}`,
  });
}

export const fileVersionHistoryModule: EmbeddedSubModule = {
  id: MODULE_ID,
  displayName: "本地文件版本历史",
  description: "库内自动快照 + 版本历史弹窗；Sync/文件恢复不可用时的稳定兜底",
  defaultEnabled: true,
  async load(host) {
    const runner = new FileVersionHistoryRunner(host);
    activeRunner = runner;
    host.register(() => {
      if (activeRunner === runner) activeRunner = null;
    });
    await runner.start();
  },
};

export function getFileVersionHistoryRunner(): FileVersionHistoryRunner | null {
  return activeRunner;
}

/** Outliner / 自定义视图下 getActiveFile 可能为空，需从 leaf.view.file 取 */
export function getActiveMarkdownFile(app: App): TFile | null {
  const fromActive = app.workspace.getActiveFile();
  if (fromActive instanceof TFile && fromActive.extension === "md") {
    return fromActive;
  }
  const leaf = app.workspace.activeLeaf;
  const view = leaf?.view as { file?: unknown; getViewType?: () => string } | undefined;
  if (view?.file instanceof TFile && view.file.extension === "md") {
    return view.file;
  }
  return null;
}

export function resolveMarkdownFile(app: App, filePath: string): TFile | null {
  const normalized = canonicalizeVaultPath(filePath);
  const direct = app.vault.getAbstractFileByPath(normalized);
  if (direct instanceof TFile && direct.extension === "md") {
    return direct;
  }
  const rawNormalized = normalizePath(filePath);
  const rawDirect = app.vault.getAbstractFileByPath(rawNormalized);
  if (rawDirect instanceof TFile && rawDirect.extension === "md") {
    return rawDirect;
  }
  const matches = app.vault
    .getMarkdownFiles()
    .filter((f) => pathsMatch(f.path, normalized) || f.path === rawNormalized);
  if (matches.length === 1) return matches[0];
  return matches.find((f) => pathsMatch(f.path, normalized)) ?? null;
}

export function getVersionHistoryBridgeStatus(): BridgePatchStatus {
  return { ...bridgePatchStatus, patchedMethods: [...bridgePatchStatus.patchedMethods] };
}

/** 供总插件或其它模块调用 */
export function openFileVersionHistory(app: App, file: TFile): void {
  const runner = activeRunner;
  if (!runner) {
    new Notice("版本历史模块未启用");
    return;
  }
  runner.openForFile(file);
}

export function openFileVersionHistoryByPath(app: App, filePath: string): void {
  const file = resolveMarkdownFile(app, filePath);
  if (!file) {
    new Notice("找不到对应的 Markdown 文件");
    return;
  }
  openFileVersionHistory(app, file);
}

type InternalPluginLike = {
  showVersionHistory?: (path: string) => unknown;
  openModal?: (path: string) => unknown;
  __fdtbVersionHistoryPatched?: boolean;
};

const PATCH_FLAG = "__fdtbVersionHistoryPatched";

const SYNC_VERSION_METHOD_CANDIDATES = [
  "showVersionHistory",
  "openVersionHistory",
  "viewVersionHistory",
  "viewHistory",
];

function patchPluginPrototypeMethod(
  app: App,
  pluginId: string,
  method: string
): boolean {
  const plugins = app.internalPlugins as
    | {
        getPluginById?: (id: string) => InternalPluginLike | null;
        getEnabledPluginById?: (id: string) => InternalPluginLike | null;
      }
    | undefined;
  if (!plugins?.getPluginById && !plugins?.getEnabledPluginById) return false;

  const sample =
    plugins.getPluginById?.(pluginId) ?? plugins.getEnabledPluginById?.(pluginId) ?? null;
  if (!sample) return false;

  const proto = Object.getPrototypeOf(sample) as InternalPluginLike & Record<string, unknown>;
  const flag = `${PATCH_FLAG}:${pluginId}:${method}`;
  if (!proto || proto[flag]) return false;
  if (typeof proto[method] !== "function") return false;

  proto[flag] = true;
  proto[method] = function patchedVersionHistoryEntry(this: unknown, path: string) {
    void this;
    openFileVersionHistoryByPath(app, path);
  };
  if (!bridgePatchStatus.patchedMethods.includes(`${pluginId}.${method}`)) {
    bridgePatchStatus.patchedMethods.push(`${pluginId}.${method}`);
  }
  return true;
}

function patchSyncVersionHistoryMethods(app: App): boolean {
  const plugins = app.internalPlugins as
    | {
        getPluginById?: (id: string) => InternalPluginLike | null;
        getEnabledPluginById?: (id: string) => InternalPluginLike | null;
      }
    | undefined;
  if (!plugins?.getPluginById && !plugins?.getEnabledPluginById) return false;

  const sample =
    plugins.getPluginById?.(SYNC_PLUGIN_ID) ?? plugins.getEnabledPluginById?.(SYNC_PLUGIN_ID) ?? null;
  if (!sample) return false;

  const proto = Object.getPrototypeOf(sample) as Record<string, unknown>;
  const candidates = new Set<string>(SYNC_VERSION_METHOD_CANDIDATES);
  for (const name of Object.getOwnPropertyNames(proto)) {
    if (/version.*history|history.*version/i.test(name)) {
      candidates.add(name);
    }
  }

  let patched = false;
  for (const method of candidates) {
    if (patchPluginPrototypeMethod(app, SYNC_PLUGIN_ID, method)) {
      patched = true;
    }
  }
  return patched;
}

function patchFileRecoveryOpenCommand(app: App): boolean {
  const commands = app.commands as {
    findCommand?: (id: string) => { callback?: () => unknown; __fdtbPatched?: boolean } | null;
  };
  const cmd = commands.findCommand?.("file-recovery:open");
  if (!cmd || cmd.__fdtbPatched) return false;
  cmd.__fdtbPatched = true;
  cmd.callback = () => {
    const file = getActiveMarkdownFile(app);
    if (!file) {
      new Notice("请先打开一个 Markdown 文件");
      return;
    }
    openFileVersionHistory(app, file);
  };
  return true;
}

function patchSyncViewHistoryCommand(app: App): boolean {
  const commands = app.commands as {
    findCommand?: (id: string) => { checkCallback?: (...args: unknown[]) => unknown; __fdtbPatched?: boolean } | null;
  };
  const cmd = commands.findCommand?.("sync:view-version-history");
  if (!cmd || cmd.__fdtbPatched) return false;
  cmd.__fdtbPatched = true;
  cmd.checkCallback = (checking: boolean) => {
    const file = getActiveMarkdownFile(app);
    if (!file) return false;
    if (checking) return true;
    openFileVersionHistory(app, file);
    return true;
  };
  return true;
}

function patchOutlinerPaneMenu(app: App): boolean {
  const leaves = app.workspace.getLeavesOfType(OUTLINER_VIEW_TYPE);
  if (leaves.length === 0) return false;
  const sampleView = leaves[0]?.view as { onPaneMenu?: (menu: Menu, source: string) => void } | undefined;
  if (!sampleView) return false;
  const proto = Object.getPrototypeOf(sampleView) as {
    onPaneMenu?: (menu: Menu, source: string) => void;
    __fdtbVersionHistoryMenuPatched?: boolean;
  };
  if (!proto.onPaneMenu || proto.__fdtbVersionHistoryMenuPatched) return false;
  proto.__fdtbVersionHistoryMenuPatched = true;
  const original = proto.onPaneMenu.bind(proto);
  proto.onPaneMenu = function patchedOutlinerPaneMenu(menu: Menu, source: string) {
    original.call(this, menu, source);
    if (source !== "more-options") return;
    const view = this as { file?: TFile };
    if (!(view.file instanceof TFile) || view.file.extension !== "md") return;
    menu.addItem((item) => {
      item.setTitle("版本历史").setIcon("history").onClick(() => {
        openFileVersionHistory(app, view.file as TFile);
      });
    });
  };
  return true;
}

/** 把 Obsidian Sync / 文件恢复 的版本历史入口改走本地快照 */
export function installVersionHistoryBridge(host: SubPluginHost): void {
  const { app } = host;
  let patchAttempts = 0;
  const MAX_PATCH_ATTEMPTS = 60;

  const tryPatchAll = (): boolean => {
    try {
      const syncOk = patchSyncVersionHistoryMethods(app);
      const recoveryOk = patchPluginPrototypeMethod(app, FILE_RECOVERY_PLUGIN_ID, "openModal");
      const cmdOk = patchSyncViewHistoryCommand(app);
      patchFileRecoveryOpenCommand(app);
      patchOutlinerPaneMenu(app);
      bridgePatchStatus.syncPrototype = syncOk;
      bridgePatchStatus.syncCommand = cmdOk;
      bridgePatchStatus.fileRecovery = recoveryOk;
      return syncOk || cmdOk;
    } catch (err) {
      console.warn("[file-version-history] bridge patch skipped", err);
      return false;
    }
  };

  tryPatchAll();
  host.registerEvent(app.workspace.on("layout-ready", () => tryPatchAll()));
  host.registerEvent(
    app.workspace.on("active-leaf-change", () => {
      window.setTimeout(() => tryPatchAll(), 300);
    })
  );

  const timer = window.setInterval(() => {
    patchAttempts += 1;
    const done = tryPatchAll();
    if (done || patchAttempts >= MAX_PATCH_ATTEMPTS) {
      window.clearInterval(timer);
      if (!done) {
        console.warn("[file-version-history] bridge patch incomplete after retries", bridgePatchStatus);
      }
    }
  }, 1000);
  host.register(() => window.clearInterval(timer));
}

// --- test hooks ---
export const __test = {
  encodePath,
  canonicalizeVaultPath,
  pathsMatch,
  hashStorageKey,
  primaryStorageKey,
  allStorageKeys,
  hashContent,
  computeLineDiff,
  normalizeSettings,
  FileVersionHistoryStore,
  resolveMarkdownFile,
  getActiveMarkdownFile,
  getVersionHistoryBridgeStatus,
  patchPluginPrototypeMethod,
  patchSyncVersionHistoryMethods,
  patchSyncViewHistoryCommand,
  patchOutlinerPaneMenu,
  INDEX_DIR,
  DEEP_PATH_FIXTURE:
    "❶可迁移（new）/200通用能力/210个体能力/213表达力/3️⃣我的实践/02讲可信/场景实践/场景1：youcore学员证言.md",
};
