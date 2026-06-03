/**
 * Claudian 轻量聊天记录存档与跨设备查看（内嵌于 Obsidian增强体验）
 * - 只读 .claudian/sessions/*.meta.json 与本机 Codex jsonl
 * - 只写 vault/.claudian-sync/chat-archives/
 * - 不修改 Claudian 插件与 Codex sessions 目录
 */

import { App, Modal, Notice, Setting, normalizePath } from "obsidian";

import {
  ARCHIVE_ROOT,
  CLAUDIAN_META_DIR,
  DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS,
  buildArchiveRecord,
  dedupeArchiveItems,
  getArchiveRelativePath,
  inheritMessagesFromPeerArchive,
  normalizeClaudianArchiveSettings,
  parseSessionMeta,
  pickRicherArchiveRecord,
  planPeerArchiveUpgrades,
  resolveDeviceId,
  sanitizePathSegment,
  type ChatArchiveMessage,
  type ChatArchiveRecord,
  type ClaudianChatArchiveSettings,
  type ClaudianSessionMeta,
  type ArchiveListItem,
} from "./claudian-archive-core";
import { parseCodexJsonlFilePath, resolveCodexSessionFilePath } from "./claudian-codex-parser";
import { getNodeModule } from "./node-bridge";
import { EmbeddedSubModule, SubPluginHost } from "./sub-plugin-host";

/** 功能开关页展开「详细设置」时使用 */
let activeClaudianRunner: ClaudianChatArchiveRunner | null = null;

export class ClaudianChatArchiveRunner {
  settings: ClaudianChatArchiveSettings = { ...DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS };
  private autoTimer: number | null = null;
  private archiving = false;
  private statusBarItem: HTMLElement | null = null;

  constructor(public host: SubPluginHost) {}

  async start() {
    const saved = await this.host.loadData();
    this.settings = normalizeClaudianArchiveSettings(saved);
    if (!this.settings.enabled) {
      await this.updateSettings({ enabled: true });
    }
    this.registerCommands();
    this.syncAutoArchiveTimer();
    if (this.settings.enabled) {
      window.setTimeout(() => void this.bootstrapArchives(), 2500);
    }
  }

  async stop() {
    this.clearAutoArchiveTimer();
    this.statusBarItem?.remove();
    this.statusBarItem = null;
  }

  /** 启动时扫描 + 跨设备正文补齐 + 状态栏提示 */
  private async bootstrapArchives() {
    await this.scanAndArchiveAll({ manual: false });
    await this.refreshCrossDeviceStatusBar();
  }

  async updateSettings(patch: Partial<ClaudianChatArchiveSettings>) {
    this.settings = normalizeClaudianArchiveSettings({ ...this.settings, ...patch });
    await this.host.saveData(this.settings);
    this.syncAutoArchiveTimer();
  }

  private registerCommands() {
    this.host.addCommand({
      id: "claudian-open-archives",
      name: "打开 Claudian 跨设备存档",
      callback: () => new ArchiveListModal(this.host.app, this).open(),
    });
    this.host.addCommand({
      id: "claudian-scan-archives",
      name: "扫描并归档 Claudian 会话",
      callback: () => void this.scanAndArchiveAll({ manual: true }),
    });
  }

  private syncAutoArchiveTimer() {
    this.clearAutoArchiveTimer();
    if (!this.settings.enabled || !this.settings.autoArchive) return;
    const minutes = this.settings.autoArchiveIntervalMinutes;
    this.autoTimer = window.setInterval(
      () => void this.scanAndArchiveAll({ manual: false }),
      minutes * 60 * 1000
    );
  }

  private clearAutoArchiveTimer() {
    if (this.autoTimer !== null) {
      window.clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  async scanAndArchiveAll(options: { manual: boolean }) {
    if (this.archiving) {
      if (options.manual) new Notice("归档正在进行中，请稍候");
      return { archived: 0, skipped: 0, errors: 0 };
    }
    this.archiving = true;
    let archived = 0;
    let skipped = 0;
    let errors = 0;
    try {
      const metas = await this.listSessionMetas();
      const deviceId = resolveDeviceId(this.settings);
      for (const meta of metas) {
        try {
          const result = await this.archiveOneSession(meta, deviceId);
          if (result === "archived") archived += 1;
          else skipped += 1;
        } catch (error) {
          errors += 1;
          console.error("[claudian-archive] archive failed", meta.id, error);
        }
      }
      const reconciled = await this.reconcilePeerArchives();
      await this.refreshCrossDeviceStatusBar();
      if (options.manual) {
        const reconcileHint = reconciled > 0 ? `，${reconciled} 个跨设备正文已补齐` : "";
        new Notice(`归档完成：${archived} 个会话已更新，${skipped} 个跳过，${errors} 个失败${reconcileHint}`);
      } else if (reconciled > 0) {
        new Notice(`已从其它设备补齐 ${reconciled} 条聊天正文，可在「打开跨设备存档」查看`, 8000);
      }
    } finally {
      this.archiving = false;
    }
    return { archived, skipped, errors };
  }

  /** iCloud 同步到 richer 存档后，把本机/其它设备的空 JSON 补齐为只读正文 */
  async reconcilePeerArchives(): Promise<number> {
    const items = await this.listAllArchiveItems();
    const upgrades = planPeerArchiveUpgrades(items);
    if (upgrades.length === 0) return 0;

    const adapter = this.host.app.vault.adapter;
    for (const item of upgrades) {
      await adapter.write(item.path, JSON.stringify(item.record, null, 2));
    }
    return upgrades.length;
  }

  async listSessionMetas(): Promise<ClaudianSessionMeta[]> {
    const adapter = this.host.app.vault.adapter;
    const dir = normalizePath(CLAUDIAN_META_DIR);
    const byId = new Map<string, ClaudianSessionMeta>();

    const pushMeta = (meta: ClaudianSessionMeta) => {
      const existing = byId.get(meta.id);
      if (!existing || (Number(meta.updatedAt) || 0) >= (Number(existing.updatedAt) || 0)) {
        byId.set(meta.id, meta);
      }
    };

    const listed = await adapter.list(dir).catch(() => null);
    if (listed?.files?.length) {
      for (const filePath of listed.files) {
        if (!filePath.endsWith(".meta.json")) continue;
        const content = await adapter.read(filePath).catch(() => "");
        const meta = parseSessionMeta(content);
        if (meta) pushMeta(meta);
      }
    }

    // Obsidian adapter 对 .claudian 等点目录常漏列；合并磁盘扫描（含 iCloud 同步的 meta）
    await this.listSessionMetasViaFs(pushMeta);

    const metas = Array.from(byId.values());
    metas.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
    return metas;
  }

  private async listSessionMetasViaFs(pushMeta: (meta: ClaudianSessionMeta) => void): Promise<void> {
    await this.walkFilesViaFs(CLAUDIAN_META_DIR, (relPath, content) => {
      if (!relPath.endsWith(".meta.json")) return;
      const meta = parseSessionMeta(content);
      if (meta) pushMeta(meta);
    });
  }

  async archiveOneSession(meta: ClaudianSessionMeta, deviceId: string): Promise<"archived" | "skipped"> {
    const providerId = meta.providerId ?? "unknown";
    const relPath = getArchiveRelativePath(providerId, meta.id, deviceId);
    const adapter = this.host.app.vault.adapter;

    let messages: ChatArchiveMessage[] = [];
    const omitted: ChatArchiveRecord["omitted"] = {
      toolLogs: true,
      images: true,
      attachments: true,
      largeOutputs: false,
    };

    if (providerId !== "codex") {
      omitted.providerSkipped = true;
    } else {
      const sessionPath = resolveCodexSessionFilePath(meta);
      if (sessionPath) {
        const parsed = await parseCodexJsonlFilePath(sessionPath, {
          maxMessageBytes: this.settings.maxMessageBytes,
          maxTotalBytes: this.settings.maxArchiveBytes,
        });
        messages = parsed.messages;
        omitted.stoppedBySizeLimit = parsed.stoppedBySizeLimit;
        omitted.largeOutputs = parsed.stoppedBySizeLimit;
        omitted.truncatedMessages = parsed.messages.filter((m) => m.truncated).length;
        if (messages.length === 0 && parsed.linesRead > 0) {
          omitted.noLocalSessionFile = false;
        }
      } else {
        omitted.noLocalSessionFile = true;
      }
    }

    let record = buildArchiveRecord(meta, messages, deviceId, omitted);
    if (record.messages.length === 0 && (omitted.noLocalSessionFile || omitted.providerSkipped)) {
      const peer = await this.findPeerArchiveRecord(providerId, meta.id);
      if (peer?.messages?.length) {
        record = inheritMessagesFromPeerArchive(record, peer);
        omitted.noLocalSessionFile = record.omitted.noLocalSessionFile;
      }
    }

    const json = JSON.stringify(record, null, 2);
    if (Buffer.byteLength(json, "utf-8") > this.settings.maxArchiveBytes * 1.1) {
      record.messages = record.messages.slice(0, Math.max(1, Math.floor(record.messages.length / 2)));
      record.omitted.stoppedBySizeLimit = true;
      record.omitted.largeOutputs = true;
    }

    const existingContent = await adapter.read(relPath).catch(() => "");
    if (messages.length === 0 && omitted.noLocalSessionFile && existingContent) {
      try {
        const existingRecord = JSON.parse(existingContent) as ChatArchiveRecord;
        if (existingRecord.messages?.length > 0) {
          existingRecord.title = record.title;
          existingRecord.updatedAt = record.updatedAt;
          existingRecord.lastArchivedAt = record.lastArchivedAt;
          existingRecord.currentNote = record.currentNote;
          existingRecord.model = record.model;
          await adapter.write(relPath, JSON.stringify(existingRecord, null, 2));
          return "archived";
        }
      } catch {
        // fall through to fresh write
      }
    }

    const finalJson = JSON.stringify(record, null, 2);
    await adapter.write(relPath, finalJson);
    return "archived";
  }

  async listArchives(): Promise<ArchiveListItem[]> {
    await this.reconcilePeerArchives();
    const items = await this.listAllArchiveItems();
    const currentDevice = resolveDeviceId(this.settings);
    return dedupeArchiveItems(items, currentDevice);
  }

  private getVaultBasePath(): string | null {
    const adapter = this.host.app.vault.adapter as {
      getBasePath?: () => string;
      basePath?: string;
      getFullPath?: (normalizedPath: string) => string;
    };
    if (typeof adapter.getBasePath === "function") {
      const base = adapter.getBasePath();
      if (base) return base;
    }
    if (typeof adapter.basePath === "string" && adapter.basePath.trim()) {
      return adapter.basePath.trim();
    }
    if (typeof adapter.getFullPath === "function") {
      const probe = this.host.app.vault.getMarkdownFiles()[0];
      if (probe?.path) {
        const full = adapter.getFullPath(probe.path);
        const pathMod = getNodeModule<typeof import("path")>("path");
        if (pathMod && full) {
          return pathMod.dirname(full);
        }
      }
    }
    return null;
  }

  private async refreshCrossDeviceStatusBar() {
    const archives = await this.listArchives();
    const readableCross = archives.filter(
      (item) => item.isCrossDevice && (item.record.messages?.length ?? 0) > 0
    ).length;
    if (readableCross === 0) {
      this.statusBarItem?.remove();
      this.statusBarItem = null;
      return;
    }
    if (!this.statusBarItem) {
      this.statusBarItem = this.host.addStatusBarItem();
      this.statusBarItem.addClass("fdtb-claudian-archive-status");
      this.statusBarItem.onClickEvent(() => new ArchiveListModal(this.host.app, this).open());
    }
    this.statusBarItem.empty();
    this.statusBarItem.setText(`跨设备存档 ${readableCross}`);
    this.statusBarItem.setAttr("title", "点击查看其它设备同步来的 Claudian 聊天正文（只读）");
  }

  private async findPeerArchiveRecord(
    providerId: string,
    conversationId: string
  ): Promise<ChatArchiveRecord | null> {
    const provider = sanitizePathSegment(providerId || "unknown");
    const conv = sanitizePathSegment(conversationId);
    const prefix = normalizePath(`${ARCHIVE_ROOT}/${provider}/${conv}@`);
    const peers: ChatArchiveRecord[] = [];
    const currentDevice = resolveDeviceId(this.settings);

    const collectPeer = (filePath: string, content: string) => {
      const normalized = normalizePath(filePath);
      if (!normalized.startsWith(prefix) || !normalized.endsWith(".json")) return;
      try {
        const parsed = JSON.parse(content) as ChatArchiveRecord;
        if (parsed?.conversationId !== conversationId) return;
        if (parsed.sourceDevice === currentDevice) return;
        peers.push(parsed);
      } catch {
        // skip corrupt
      }
    };

    await this.walkFilesViaFs(`${ARCHIVE_ROOT}/${provider}`, collectPeer);
    if (peers.length === 0) {
      await this.walkArchivesViaAdapter(`${ARCHIVE_ROOT}/${provider}`, collectPeer);
    }

    return pickRicherArchiveRecord(peers);
  }

  /** vault adapter 遍历（Node fs 不可用时的回退，含 iCloud 已同步的跨设备存档） */
  private async walkArchivesViaAdapter(
    dir: string,
    onFile: (filePath: string, content: string) => void
  ): Promise<void> {
    const adapter = this.host.app.vault.adapter;
    const listed = await adapter.list(normalizePath(dir)).catch(() => null);
    if (!listed) return;
    for (const file of listed.files) {
      if (!file.endsWith(".json")) continue;
      const content = await adapter.read(file).catch(() => "");
      if (content) onFile(file, content);
    }
    for (const child of listed.folders) {
      await this.walkArchivesViaAdapter(child, onFile);
    }
  }

  private async walkFilesViaFs(
    root: string,
    onFile: (relPath: string, content: string) => void
  ): Promise<void> {
    const fs = getNodeModule<typeof import("fs")>("fs");
    const path = getNodeModule<typeof import("path")>("path");
    const base = this.getVaultBasePath();
    if (!fs || !path || !base) return;

    const absRoot = path.join(base, root);
    if (!fs.existsSync(absRoot)) return;

    const stack = [absRoot];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      let entries: import("fs").Dirent[];
      try {
        entries = fs.readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
          continue;
        }
        if (!entry.isFile()) continue;
        const rel = normalizePath(path.relative(base, full));
        try {
          onFile(rel, fs.readFileSync(full, "utf-8"));
        } catch {
          // skip unreadable
        }
      }
    }
  }

  private async listAllArchiveItems(): Promise<ArchiveListItem[]> {
    const adapter = this.host.app.vault.adapter;
    const root = normalizePath(ARCHIVE_ROOT);
    const currentDevice = resolveDeviceId(this.settings);
    const items: ArchiveListItem[] = [];

    const seenPaths = new Set<string>();
    const pushRecord = (file: string, record: ChatArchiveRecord) => {
      const normalized = normalizePath(file);
      if (seenPaths.has(normalized)) return;
      seenPaths.add(normalized);
      items.push({
        path: normalized,
        record,
        isCrossDevice: record.sourceDevice !== currentDevice,
      });
    };

    const walk = async (dir: string) => {
      const listed = await adapter.list(dir).catch(() => null);
      if (!listed) return;
      for (const file of listed.files) {
        if (!file.endsWith(".json")) continue;
        const content = await adapter.read(file).catch(() => "");
        try {
          const record = JSON.parse(content) as ChatArchiveRecord;
          if (!record?.conversationId) continue;
          pushRecord(file, record);
        } catch {
          // skip corrupt
        }
      }
      for (const child of listed.folders) {
        await walk(child);
      }
    };

    await walk(root);
    // Obsidian adapter 对 .claudian-sync 等点目录常漏列；桌面端始终合并磁盘扫描结果（含 iCloud 同步文件）
    await this.listArchivesViaFs(root, pushRecord);
    items.sort((a, b) => (Number(b.record.updatedAt) || 0) - (Number(a.record.updatedAt) || 0));
    return items;
  }

  private async listArchivesViaFs(
    root: string,
    pushRecord: (file: string, record: ChatArchiveRecord) => void
  ): Promise<void> {
    await this.walkFilesViaFs(root, (relPath, content) => {
      if (!relPath.endsWith(".json")) return;
      try {
        const record = JSON.parse(content) as ChatArchiveRecord;
        if (!record?.conversationId) return;
        pushRecord(relPath, record);
      } catch {
        // skip corrupt
      }
    });
  }

  async cleanupOversizedArchives(): Promise<{ removed: number; trimmed: number }> {
    const adapter = this.host.app.vault.adapter;
    const items = await this.listAllArchiveItems();
    let removed = 0;
    let trimmed = 0;
    for (const item of items) {
      const size = Buffer.byteLength(JSON.stringify(item.record), "utf-8");
      if (size <= this.settings.maxArchiveBytes) continue;
      try {
        const half = item.record.messages.slice(0, Math.max(1, Math.floor(item.record.messages.length / 2)));
        if (half.length === 0) {
          await adapter.remove(item.path);
          removed += 1;
        } else {
          item.record.messages = half;
          item.record.omitted.stoppedBySizeLimit = true;
          item.record.omitted.largeOutputs = true;
          await adapter.write(item.path, JSON.stringify(item.record, null, 2));
          trimmed += 1;
        }
      } catch (error) {
        console.error("[claudian-archive] cleanup failed", item.path, error);
      }
    }
    return { removed, trimmed };
  }
}

class ArchiveListModal extends Modal {
  constructor(
    app: App,
    private runner: ClaudianChatArchiveRunner
  ) {
    super(app);
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("fdtb-claudian-archive-modal");
    contentEl.createEl("h2", { text: "Claudian 跨设备存档" });

    const metas = await this.runner.listSessionMetas();
    const archives = await this.runner.listArchives();
    const showBadge = this.runner.settings.showCrossDeviceBadge;

    const banner = contentEl.createDiv({ cls: "fdtb-claudian-archive-banner" });
    banner.setText(
      `存档目录：${ARCHIVE_ROOT}/ · 本机 ${resolveDeviceId(this.runner.settings)} · 共 ${archives.length} 份存档`
    );

    contentEl.createEl("p", {
      cls: "setting-item-description fdtb-claudian-archive-hint",
      text:
        "Claudian 侧边栏历史里标注的「Current session」只表示当前正在聊的那一条，不是跨设备同步入口。" +
        "其它电脑的完整正文请在本窗口下方「已归档」列表查看（需先在聊天所在电脑开启同步并扫描）。",
    });

    const toolbar = contentEl.createDiv({ cls: "fdtb-claudian-archive-toolbar" });
    toolbar.createEl("button", { text: "重新扫描", cls: "mod-cta" }).addEventListener("click", () => {
      void this.runner.scanAndArchiveAll({ manual: true }).then(() => this.onOpen());
    });

    if (metas.length > 0) {
      const localTitle = contentEl.createDiv({ text: "本机 Claudian 会话（元数据）" });
      localTitle.addClass("fdtb-claudian-section-title");
      const localList = contentEl.createDiv({ cls: "fdtb-claudian-archive-list" });
      for (const meta of metas) {
        const row = localList.createDiv({ cls: "fdtb-claudian-archive-row fdtb-claudian-archive-row-local" });
        const main = row.createDiv({ cls: "fdtb-claudian-archive-row-main" });
        main.createDiv({ cls: "fdtb-claudian-archive-row-title", text: meta.title ?? meta.id });
        const metaLine = main.createDiv({ cls: "fdtb-claudian-archive-row-meta" });
        metaLine.setText(new Date(Number(meta.updatedAt) || 0).toLocaleString());
        row.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-local", text: "本机" });
      }
    }

    const archiveTitle = contentEl.createDiv({ text: "已归档（可跨设备查看）" });
    archiveTitle.addClass("fdtb-claudian-section-title");

    if (archives.length === 0) {
      contentEl.createEl("p", {
        cls: "setting-item-description",
        text: "暂无存档。开启「Claudian 聊天记录同步」后会自动写入 .claudian-sync/chat-archives/。",
      });
      return;
    }

    const emptyCrossDevice = archives.filter(
      (item) => item.isCrossDevice && (item.record.messages?.length ?? 0) === 0
    ).length;
    if (emptyCrossDevice > 0) {
      contentEl.createEl("p", {
        cls: "setting-item-description fdtb-claudian-archive-hint",
        text:
          `有 ${emptyCrossDevice} 条跨设备存档仅有标题、无正文。请在聊天所在电脑开启同步并点「重新扫描」；` +
          "正文来自本机 ~/.codex/sessions，不会随 iCloud 自动同步。Cursor/OpenCode 会话暂不支持正文归档。",
      });
    }

    const list = contentEl.createDiv({ cls: "fdtb-claudian-archive-list" });
    for (const item of archives) {
      const row = list.createDiv({ cls: "fdtb-claudian-archive-row" });
      row.addEventListener("click", () => {
        new ArchiveViewerModal(this.app, item.record, showBadge && item.isCrossDevice).open();
      });
      const main = row.createDiv({ cls: "fdtb-claudian-archive-row-main" });
      main.createDiv({ cls: "fdtb-claudian-archive-row-title", text: item.record.title });
      const meta = main.createDiv({ cls: "fdtb-claudian-archive-row-meta" });
      const peerHint =
        item.peerSourceDevices?.length && item.record.sourceDevice === resolveDeviceId(this.runner.settings)
          ? ` · 正文来自 ${item.peerSourceDevices.join("、")}`
          : "";
      meta.setText(
        `${item.record.sourceDevice} · ${new Date(item.record.lastArchivedAt).toLocaleString()} · ${item.record.messages.length} 条消息${peerHint}`
      );
      if (showBadge && item.isCrossDevice) {
        const badge = row.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-cross" });
        badge.setText("跨设备");
      } else if (!item.isCrossDevice) {
        row.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-local", text: "本机存档" });
      }
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

class ArchiveViewerModal extends Modal {
  constructor(
    app: App,
    private record: ChatArchiveRecord,
    private showCrossBadge: boolean
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("fdtb-claudian-viewer");
    contentEl.createEl("h2", { text: this.record.title });
    const notice = contentEl.createDiv({ cls: "fdtb-claudian-viewer-notice" });
    notice.setText("只读存档，不可在此续聊。");
    if (this.showCrossBadge) {
      const badge = notice.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-cross" });
      badge.setText("跨设备");
    }
    const meta = contentEl.createDiv({ cls: "fdtb-claudian-viewer-meta" });
    meta.setText(
      `${this.record.sourceDevice} · ${this.record.model ?? ""} · 更新 ${new Date(this.record.updatedAt).toLocaleString()}`
    );
    const chat = contentEl.createDiv({ cls: "fdtb-claudian-viewer-chat" });
    if (this.record.messages.length === 0) {
      chat.createEl("p", {
        cls: "setting-item-description",
        text: this.record.omitted?.noLocalSessionFile
          ? "本机无 Codex 会话文件，仅同步了标题与元数据。"
          : "暂无可读消息正文。",
      });
      return;
    }
    for (const message of this.record.messages) {
      const bubble = chat.createDiv({
        cls: `fdtb-claudian-message fdtb-claudian-message-${message.role}`,
      });
      const role = bubble.createDiv({ cls: "fdtb-claudian-message-role" });
      role.setText(message.role === "user" ? "你" : "助手");
      const body = bubble.createDiv({ cls: "fdtb-claudian-message-body" });
      body.setText(message.text);
      if (message.truncated) {
        bubble.createDiv({ cls: "fdtb-claudian-message-flag", text: "（已截断）" });
      }
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

/** 功能开关 → 展开「详细设置」；日常只用模块总开关 */
export function renderClaudianChatArchiveSettings(containerEl: HTMLElement, onRefresh: () => void) {
  const runner = activeClaudianRunner;
  if (!runner) {
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "请先打开上方「Claudian 聊天记录同步」开关。",
    });
    return;
  }

  containerEl.createEl("p", {
    cls: "setting-item-description",
    text:
      "轻量 JSON 写入 .claudian-sync/chat-archives/，经 iCloud 跨设备只读查看。入口：下方「打开列表」或状态栏「跨设备存档」——不是 Claudian 侧边栏里的 Current session。" +
      "正文仅 Codex 会话且需在聊天所在电脑先「扫描归档」（读取 ~/.codex/sessions，不会随 iCloud 同步）；Cursor/OpenCode 仅标题。",
  });

  new Setting(containerEl)
    .setName("打开跨设备存档")
    .addButton((button) =>
      button.setButtonText("打开列表").onClick(() => new ArchiveListModal(runner.host.app, runner).open())
    );

  new Setting(containerEl)
    .setName("立即扫描归档")
    .addButton((button) =>
      button.setButtonText("开始扫描").onClick(() => void runner.scanAndArchiveAll({ manual: true }))
    );

  const advanced = containerEl.createEl("details", { cls: "fdtb-claudian-advanced-settings" });
  advanced.createEl("summary", { text: "高级设置（可选）" });
  const body = advanced.createDiv({ cls: "fdtb-claudian-advanced-settings-body" });

  const s = runner.settings;

  new Setting(body)
    .setName("自动归档本机会话")
    .setDesc("定时扫描 .claudian/sessions 并更新轻量存档")
    .addToggle((toggle) =>
      toggle.setValue(s.autoArchive).onChange(async (value) => {
        await runner.updateSettings({ autoArchive: value });
        onRefresh();
      })
    );

  new Setting(body)
    .setName("自动归档间隔（分钟）")
    .addText((text) =>
      text
        .setPlaceholder("10")
        .setValue(String(s.autoArchiveIntervalMinutes))
        .onChange(async (value) => {
          await runner.updateSettings({ autoArchiveIntervalMinutes: Number(value) || 10 });
        })
    );

  new Setting(body)
    .setName("显示跨设备 badge")
    .addToggle((toggle) =>
      toggle.setValue(s.showCrossDeviceBadge).onChange(async (value) => {
        await runner.updateSettings({ showCrossDeviceBadge: value });
        onRefresh();
      })
    );

  new Setting(body)
    .setName("单条消息上限（字节）")
    .addText((text) =>
      text.setValue(String(s.maxMessageBytes)).onChange(async (value) => {
        await runner.updateSettings({ maxMessageBytes: Number(value) || 51200 });
      })
    );

  new Setting(body)
    .setName("单会话存档上限（字节）")
    .addText((text) =>
      text.setValue(String(s.maxArchiveBytes)).onChange(async (value) => {
        await runner.updateSettings({ maxArchiveBytes: Number(value) || 1048576 });
      })
    );

  new Setting(body)
    .setName("本机设备标识")
    .setDesc("留空则使用系统主机名")
    .addText((text) =>
      text.setValue(s.deviceId).onChange(async (value) => {
        await runner.updateSettings({ deviceId: value.trim() });
      })
    );

  new Setting(body)
    .setName("清理超限存档")
    .addButton((button) =>
      button.setButtonText("清理").onClick(async () => {
        const result = await runner.cleanupOversizedArchives();
        new Notice(`清理完成：删除 ${result.removed}，裁剪 ${result.trimmed}`);
      })
    );
}

export const claudianChatArchiveModule: EmbeddedSubModule = {
  id: "claudian-chat-archive",
  displayName: "Claudian 聊天记录同步",
  description:
    "将 Claudian/Codex 会话提取为轻量 JSON 存入 vault，经 iCloud 跨设备只读查看；不修改 Claudian 标题与会话目录",
  defaultEnabled: true,
  load: async (host) => {
    const runner = new ClaudianChatArchiveRunner(host);
    await runner.start();
    activeClaudianRunner = runner;
    (host as SubPluginHost & { __claudianRunner?: ClaudianChatArchiveRunner }).__claudianRunner = runner;
    const plugin = host.component as { claudianArchiveRunner?: ClaudianChatArchiveRunner };
    plugin.claudianArchiveRunner = runner;
  },
  unload: async (host) => {
    activeClaudianRunner = null;
    const plugin = host.component as { claudianArchiveRunner?: ClaudianChatArchiveRunner };
    if (plugin.claudianArchiveRunner) {
      await plugin.claudianArchiveRunner.stop();
      plugin.claudianArchiveRunner = null;
    }
  },
};

/** smoke / 单测出口 */
export type { ClaudianChatArchiveSettings } from "./claudian-archive-core";
