/**
 * 文件自动本地化模块（原 image-localizer 插件，整段内嵌进总插件）。
 *
 * 这是一个最小改造移植：
 * - 把原 main.js 的 plugin class 改成 FileAutoLocalizerRunner，构造时拿 SubPluginHost。
 * - 所有 this.app / this.addCommand / this.registerEvent / this.saveData 都走 host。
 * - 设置 UI 渲染函数 renderFileAutoLocalizerSettings 独立导出，供总设置页调用。
 * - 保留全部辅助函数与 __test 出口（供后续编写 smoke 用）。
 */

import {
  App,
  Modal,
  Notice,
  Setting,
  TFile,
  TFolder,
  requestUrl,
} from "obsidian";

import { EmbeddedSubModule, SubPluginHost } from "./sub-plugin-host";

export type FileAutoLocalizerSettings = {
  attachmentFolder: string;
  defaultFolders: string[];
  rewriteMode: "markdown" | "wiki-path" | "basename";
  overwriteExisting: boolean;
  autoProcessActiveNote: boolean;
  autoProcessAllMarkdown: boolean;
  processWeChatImages: boolean;
  processCuboxImages: boolean;
  processOneNoteImages: boolean;
  processOneNoteLinks: boolean;
  oneNoteBasePath: string;
  processOtherRemoteImages: boolean;
  processScatteredLocalImages: boolean;
  removeTransparentPlaceholders: boolean;
};

const DEFAULT_SETTINGS: FileAutoLocalizerSettings = {
  attachmentFolder: "_attachments",
  defaultFolders: [],
  rewriteMode: "markdown",
  overwriteExisting: false,
  autoProcessActiveNote: true,
  autoProcessAllMarkdown: true,
  processWeChatImages: true,
  processCuboxImages: true,
  processOneNoteImages: true,
  processOneNoteLinks: true,
  oneNoteBasePath: "",
  processOtherRemoteImages: true,
  processScatteredLocalImages: true,
  removeTransparentPlaceholders: true,
};

const HTTP_RE = /^https?:\/\//i;
const DATA_IMAGE_RE = /^data:image\//i;
const LOCAL_IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/i;
const SCATTERED_ATTACHMENT_RE = /(?:^|\/)(?:assets\/attachments|\.attachments)(?:\/|$)/i;
const AUTO_PROCESS_DELAY_MS = 3000;
const AUTO_PROCESS_MIN_INTERVAL_MS = 10 * 60 * 1000;
const AUTO_PROCESS_MAX_PENDING_FILES = 10;
const AUTO_PROCESS_MAX_FILE_BYTES = 500_000;

type ImageMatch = {
  raw: string;
  alt: string;
  url: string;
  type: "remote" | "data";
  index: number;
};

type LocalEmbedMatch = {
  raw: string;
  linkPath: string;
  suffix: string;
};

class FileAutoLocalizerRunner {
  settings: FileAutoLocalizerSettings = { ...DEFAULT_SETTINGS };
  processingPaths: Set<string> = new Set();
  autoTimers: Map<string, number> = new Map();
  lastAutoProcessAt: Map<string, number> = new Map();
  lastAutoProcessHash: Map<string, string> = new Map();

  constructor(public host: SubPluginHost) {}

  async start() {
    const saved = (await this.host.loadData()) as Partial<FileAutoLocalizerSettings> | null;
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, saved ?? {}));

    this.host.addCommand({
      id: "localize-current-note-images",
      name: "本地化当前笔记图片和 OneNote 链接",
      checkCallback: (checking) => {
        const file = this.host.app.workspace.getActiveFile();
        const canRun = file instanceof TFile && file.extension === "md";
        if (checking) return canRun;
        void this.localizeCurrentFile();
        return true;
      },
    });

    this.host.addCommand({
      id: "localize-folder-images",
      name: "本地化指定文件夹图片和 OneNote 链接",
      callback: () => {
        new FolderPickerModal(this.host.app, this.settings.defaultFolders, async (folderPaths) => {
          this.settings.defaultFolders = folderPaths.map(normalizeVaultPath).filter(Boolean);
          await this.saveSettings();
          await this.localizeFolders(this.settings.defaultFolders);
        }).open();
      },
    });

    this.host.registerDomEvent(document, "paste", (event: ClipboardEvent) => {
      this.queueAutoProcessFromPaste(event);
    }, true);

    this.host.register(() => {
      for (const timer of this.autoTimers.values()) {
        window.clearTimeout(timer);
      }
      this.autoTimers.clear();
    });
  }

  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.host.saveData(this.settings);
  }

  async localizeCurrentFile() {
    const file = this.host.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || file.extension !== "md") {
      new Notice("请先打开一篇 Markdown 笔记");
      return;
    }

    const result = await this.localizeFile(file);
    new Notice(`文件自动本地化完成：${result.downloaded} 张下载，${result.reused} 张复用，${result.links || 0} 个链接转换，${result.removed || 0} 个占位移除，${result.failed} 张失败`);
  }

  async localizeFolders(folderPaths: string[]) {
    const normalizedFolders = [...new Set((folderPaths || []).map(normalizeVaultPath).filter(Boolean))];
    const files = this.host.app.vault
      .getMarkdownFiles()
      .filter((file) => normalizedFolders.length === 0 || normalizedFolders.some((folder) => isInsideFolder(file.path, folder)));

    if (files.length === 0) {
      new Notice(normalizedFolders.length > 0 ? "所选文件夹没有 Markdown 文件" : "当前 vault 没有 Markdown 文件");
      return;
    }

    let downloaded = 0;
    let reused = 0;
    let failed = 0;
    let removed = 0;
    let links = 0;
    let changed = 0;

    new Notice(`开始处理 ${files.length} 篇 Markdown`);

    for (const file of files) {
      const result = await this.localizeFile(file);
      downloaded += result.downloaded;
      reused += result.reused;
      failed += result.failed;
      removed += result.removed || 0;
      links += result.links || 0;
      if (result.changed) changed += 1;
    }

    new Notice(`批量完成：${changed}/${files.length} 篇有更新，${downloaded} 张下载，${reused} 张复用，${links} 个链接转换，${removed} 个占位移除，${failed} 张失败`);
  }

  async localizeFile(file: TFile, sourceOverride?: string) {
    if (this.processingPaths.has(file.path)) {
      return { downloaded: 0, reused: 0, failed: 0, links: 0, removed: 0, migrated: 0, changed: false };
    }

    this.processingPaths.add(file.path);
    try {
      const source = typeof sourceOverride === "string"
        ? sourceOverride
        : await this.host.app.vault.read(file);
      const legacyResult = this.normalizeLegacyAttachmentLinks(source, file.path);
      const linkResult = this.normalizeOneNoteLinksWrap(legacyResult.markdown);
      let workingMarkdown = linkResult.markdown;
      let changed = legacyResult.changed || linkResult.changed;
      let migrated = 0;

      if (this.settings.processScatteredLocalImages) {
        const scatteredResult = await this.normalizeScatteredLocalImages(workingMarkdown, file.path);
        workingMarkdown = scatteredResult.markdown;
        migrated = scatteredResult.migrated;
        changed = changed || scatteredResult.changed;
      }

      const matches = findProcessableMarkdownImages(workingMarkdown);
      const replacements = new Map<string, string>();
      let downloaded = 0;
      let reused = 0;
      let failed = 0;
      let removed = 0;

      if (matches.length > 0) {
        await this.ensureFolder(this.settings.attachmentFolder);

        for (const match of matches) {
          if (replacements.has(match.raw)) continue;

          try {
            if (match.type === "data" && this.settings.removeTransparentPlaceholders && isTransparentPlaceholderDataUrl(match.url)) {
              replacements.set(match.raw, "");
              removed += 1;
              continue;
            }

            if (!this.shouldProcessImage(match)) {
              continue;
            }

            const asset = match.type === "data"
              ? await this.resolveDataAsset(match.url)
              : await this.resolveRemoteAsset(match.url);

            if (asset.created) downloaded += 1;
            else reused += 1;

            const localEmbed = this.buildLocalEmbed(asset.path, asset.basename, file.path);
            replacements.set(match.raw, localEmbed);
          } catch (error) {
            failed += 1;
            console.error("[file-auto-localizer] 图片下载失败", match.url, error);
          }
        }
      }

      let updated = workingMarkdown;
      for (const [raw, replacement] of replacements.entries()) {
        updated = replaceAll(updated, raw, replacement);
      }

      if (updated !== source) {
        await this.host.app.vault.modify(file, updated);
        changed = true;
      }

      return {
        downloaded,
        reused,
        failed,
        removed,
        migrated,
        links: linkResult.converted,
        changed,
      };
    } finally {
      this.processingPaths.delete(file.path);
    }
  }

  queueAutoProcess(file: TFile | null) {
    if (!this.shouldQueueAutoProcess(file)) return;

    const existingTimer = this.autoTimers.get(file.path);
    if (existingTimer) window.clearTimeout(existingTimer);

    const timer = window.setTimeout(async () => {
      this.autoTimers.delete(file.path);
      try {
        if (!this.shouldQueueAutoProcess(file)) return;

        const source = await this.host.app.vault.read(file);
        const sourceHash = stableHash(source);
        const previousHash = this.lastAutoProcessHash.get(file.path);
        const lastRunAt = this.lastAutoProcessAt.get(file.path) || 0;
        const now = Date.now();
        if (previousHash === sourceHash && now - lastRunAt < AUTO_PROCESS_MIN_INTERVAL_MS) {
          return;
        }

        this.lastAutoProcessHash.set(file.path, sourceHash);
        this.lastAutoProcessAt.set(file.path, now);
        if (!hasActionableAutoProcessWork(source, this.settings)) {
          return;
        }

        const currentlyActive = this.host.app.workspace.getActiveFile();
        const result = await this.localizeFile(file, source);
        if ((result.changed || result.failed > 0) && currentlyActive === file) {
          new Notice(`文件自动本地化（后台）：${result.downloaded} 张下载，${result.reused} 张复用，${result.links || 0} 个链接转换，${result.removed || 0} 个占位移除，${result.failed} 张失败`);
        }
      } catch (error) {
        console.error("[file-auto-localizer] 后台自动处理失败", file.path, error);
      }
    }, AUTO_PROCESS_DELAY_MS);

    this.autoTimers.set(file.path, timer);
  }

  queueAutoProcessFromPaste(event: ClipboardEvent) {
    if (!this.settings.autoProcessActiveNote) return;
    if (!isEditorPasteTarget(event.target)) return;
    if (!pasteCouldNeedAutoProcess(event.clipboardData)) return;

    const file = this.host.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || file.extension !== "md") return;
    this.queueAutoProcess(file);
  }

  shouldQueueAutoProcess(file: TFile | null) {
    if (!this.settings.autoProcessActiveNote) return false;
    if (!(file instanceof TFile) || file.extension !== "md") return false;
    if (this.processingPaths.has(file.path)) return false;
    if ((file.stat?.size || 0) > AUTO_PROCESS_MAX_FILE_BYTES) return false;

    const activeFile = this.host.app.workspace.getActiveFile();
    if (activeFile !== file) return false;

    const existingTimer = this.autoTimers.get(file.path);
    if (!existingTimer && this.autoTimers.size >= AUTO_PROCESS_MAX_PENDING_FILES) return false;

    const lastRunAt = this.lastAutoProcessAt.get(file.path) || 0;
    if (Date.now() - lastRunAt < AUTO_PROCESS_MIN_INTERVAL_MS) return false;

    return true;
  }

  async resolveRemoteAsset(url: string) {
    const hash = stableHash(url);
    const guessedExt = guessExtensionFromUrl(url);
    const initialPath = normalizeVaultPath(`${this.settings.attachmentFolder}/${hash}${guessedExt}`);

    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(initialPath)) {
      return { path: initialPath, basename: `${hash}${guessedExt}`, created: false };
    }

    const response = await requestUrl({
      url,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 Obsidian Image Localizer",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      throw: false,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }

    const ext = guessExtensionFromContentType(response.headers["content-type"]) || guessedExt;
    const finalPath = normalizeVaultPath(`${this.settings.attachmentFolder}/${hash}${ext}`);

    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(finalPath)) {
      return { path: finalPath, basename: `${hash}${ext}`, created: false };
    }

    await this.ensureFolder(this.settings.attachmentFolder);
    await this.host.app.vault.adapter.writeBinary(finalPath, response.arrayBuffer);

    return { path: finalPath, basename: `${hash}${ext}`, created: true };
  }

  async resolveDataAsset(dataUrl: string) {
    const parsed = parseDataUrl(dataUrl);
    const ext = guessExtensionFromContentType(parsed.contentType) || ".png";
    const hash = stableHash(dataUrl);
    const finalPath = normalizeVaultPath(`${this.settings.attachmentFolder}/${hash}${ext}`);

    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(finalPath)) {
      return { path: finalPath, basename: `${hash}${ext}`, created: false };
    }

    await this.ensureFolder(this.settings.attachmentFolder);
    await this.host.app.vault.adapter.writeBinary(finalPath, parsed.arrayBuffer);
    return { path: finalPath, basename: `${hash}${ext}`, created: true };
  }

  async ensureFolder(folderPath: string) {
    const normalized = normalizeVaultPath(folderPath);
    if (!normalized) return;

    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!await this.host.app.vault.adapter.exists(current)) {
        await this.host.app.vault.createFolder(current);
      }
    }
  }

  buildLocalEmbed(path: string, basename: string, notePath: string, suffix = "") {
    if (suffix) {
      if (this.settings.rewriteMode === "basename") {
        return `![[${basename}${suffix}]]`;
      }
      return `![[${path}${suffix}]]`;
    }
    if (this.settings.rewriteMode === "basename") {
      return `![[${basename}]]`;
    }
    if (this.settings.rewriteMode === "wiki-path") {
      return `![[${path}]]`;
    }
    return `![](${encodeMarkdownPath(relativePathFromNote(notePath, path))})`;
  }

  async normalizeScatteredLocalImages(markdown: string, notePath: string) {
    if (!this.settings.processScatteredLocalImages) {
      return { markdown, changed: false, migrated: 0 };
    }

    const attachmentFolder = normalizeVaultPath(this.settings.attachmentFolder);
    const matches = findScatteredLocalEmbeds(markdown);
    if (matches.length === 0) {
      return { markdown, changed: false, migrated: 0 };
    }

    await this.ensureFolder(attachmentFolder);

    const replacements = new Map<string, string>();
    let migrated = 0;

    for (const match of matches) {
      if (replacements.has(match.raw)) continue;

      const resolvedPath = resolveLocalImagePath(notePath, match.linkPath, this.host.app);
      if (!resolvedPath || !isScatteredAttachmentPath(resolvedPath, attachmentFolder)) {
        continue;
      }

      try {
        const targetPath = await this.migrateLocalImageToAttachmentFolder(resolvedPath, attachmentFolder);
        const basename = targetPath.split("/").pop() || targetPath;
        replacements.set(match.raw, this.buildLocalEmbed(targetPath, basename, notePath, match.suffix));
        migrated += 1;
      } catch (error) {
        console.error("[file-auto-localizer] 散落附件迁移失败", resolvedPath, error);
      }
    }

    let next = markdown;
    for (const [raw, replacement] of replacements.entries()) {
      next = replaceAll(next, raw, replacement);
    }

    return { markdown: next, changed: next !== markdown, migrated };
  }

  async migrateLocalImageToAttachmentFolder(sourcePath: string, attachmentFolder: string) {
    const normalizedSource = normalizeVaultPath(sourcePath);
    const ext = guessExtensionFromPath(normalizedSource);
    const hash = stableHash(normalizedSource);
    const targetPath = normalizeVaultPath(`${attachmentFolder}/${hash}${ext}`);

    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(targetPath)) {
      return targetPath;
    }

    const data = await this.host.app.vault.adapter.readBinary(normalizedSource);
    await this.ensureFolder(attachmentFolder);
    await this.host.app.vault.adapter.writeBinary(targetPath, data);
    return targetPath;
  }

  normalizeLegacyAttachmentLinks(markdown: string, notePath: string) {
    let changed = false;
    const attachmentFolder = normalizeVaultPath(this.settings.attachmentFolder);

    const replaceLegacy = (name: string, suffix = "") => {
      changed = true;
      const targetPath = `${attachmentFolder}/${name}`;
      if (this.settings.rewriteMode === "wiki-path") {
        return suffix ? `![[${targetPath}${suffix}]]` : `![[${targetPath}]]`;
      }
      if (this.settings.rewriteMode === "basename") {
        return suffix ? `![[${name}${suffix}]]` : `![[${name}]]`;
      }
      return `![](${encodeMarkdownPath(relativePathFromNote(notePath, targetPath))})`;
    };

    const encodedAttachmentWidthRe = new RegExp(
      "!\\[\\]\\((?:\\.\\./)*_attachments/([^)|]+\\.(?:png|jpe?g|gif|webp|avif|svg|bmp|tiff?))%7C(\\d+)\\)",
      "gi"
    );
    const next = markdown
      .replace(/!\[\[\.attachments\/([^\]|]+)(\|[^\]]*)?\]\]/g, (_match, name, suffix) => replaceLegacy(name, suffix))
      .replace(/!\[\]\((?:\.\.\/)*\.attachments\/([^)]+)\)/g, (_match, name) => replaceLegacy(name))
      .replace(/!\[([\s\S]*?)\]\((?:\.\.\/)*\.attachments\/([^)]+)\)/g, (_match, _alt, name) => replaceLegacy(name))
      .replace(encodedAttachmentWidthRe, (_match, name, width) => {
        changed = true;
        return `![[_attachments/${name}|${width}]]`;
      })
      .replace(/!\[([\s\S]*?)\]\(((?:\.\.\/)*_attachments\/[^)]+)\)/g, (_match, alt, ref) => {
        if (!alt || !/[\r\n]/.test(alt)) return _match;
        changed = true;
        return `![](${ref})`;
      });

    return { markdown: next, changed };
  }

  normalizeOneNoteLinksWrap(markdown: string) {
    if (!this.settings.processOneNoteLinks) {
      return { markdown, changed: false, converted: 0 };
    }
    return normalizeOneNoteLinks(markdown, this.settings);
  }

  shouldProcessImage(match: ImageMatch) {
    if (match.type === "data") {
      return Boolean(this.settings.processOneNoteImages);
    }

    const source = classifyRemoteSource(match.url);
    if (source === "cubox") return Boolean(this.settings.processCuboxImages);
    if (source === "wechat") return Boolean(this.settings.processWeChatImages);
    return Boolean(this.settings.processOtherRemoteImages);
  }
}

class FolderPickerModal extends Modal {
  selected: Set<string>;
  onSubmit: (folderPaths: string[]) => Promise<void> | void;
  query: string;

  constructor(app: App, initialFolders: string[], onSubmit: (folderPaths: string[]) => Promise<void> | void) {
    super(app);
    this.selected = new Set((initialFolders || []).map(normalizeVaultPath).filter(Boolean));
    this.onSubmit = onSubmit;
    this.query = "";
  }

  onOpen() {
    this.render();
  }

  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "选择要处理的文件夹" });
    contentEl.createEl("p", { text: "可多选；不选任何文件夹时处理整个 vault。" });

    new Setting(contentEl)
      .setName("搜索文件夹")
      .addText((text) => {
        text.setPlaceholder("输入关键词过滤")
          .setValue(this.query)
          .onChange((nextValue) => {
            this.query = nextValue;
            this.render();
          });
        text.inputEl.focus();
      });

    const folders = this.app.vault
      .getAllLoadedFiles()
      .filter((file): file is TFolder => file instanceof TFolder && !!file.path)
      .map((folder) => folder.path)
      .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
    const visibleFolders = folders.filter((folder) => !this.query || folder.toLowerCase().includes(this.query.toLowerCase()));

    const listEl = contentEl.createDiv();
    listEl.style.maxHeight = "420px";
    listEl.style.overflow = "auto";
    listEl.style.border = "1px solid var(--background-modifier-border)";
    listEl.style.borderRadius = "8px";
    listEl.style.padding = "8px";

    if (visibleFolders.length === 0) {
      listEl.createEl("div", { text: "没有匹配的文件夹" });
    }

    for (const folder of visibleFolders) {
      new Setting(listEl)
        .setName(folder)
        .addToggle((toggle) => toggle
          .setValue(this.selected.has(folder))
          .onChange((value) => {
            if (value) this.selected.add(folder);
            else this.selected.delete(folder);
          }));
    }

    new Setting(contentEl)
      .setName(`已选择 ${this.selected.size} 个文件夹`)
      .setDesc(this.selected.size > 0 ? Array.from(this.selected).join("、") : "未选择，将处理整个 vault")
      .addButton((button) => {
        button.setButtonText("开始处理")
          .setCta()
          .onClick(async () => {
            this.close();
            await this.onSubmit(Array.from(this.selected));
          });
      })
      .addButton((button) => {
        button.setButtonText("清空选择")
          .onClick(() => {
            this.selected.clear();
            this.render();
          });
      })
      .addButton((button) => {
        button.setButtonText("取消")
          .onClick(() => this.close());
      });
  }

  onClose() {
    this.contentEl.empty();
  }
}

// --- helper functions, 原 image-localizer/main.js 中的纯函数原样保留 ---

function normalizeOneNoteLinks(markdown: string, settings: Partial<FileAutoLocalizerSettings> = {}) {
  let converted = 0;
  let next = String(markdown || "");

  next = next.replace(/\[([^\]\n]+)\]\(\[([^\]\n]+)\]\((onenote:[^)]+)\)\)/gi, (_match, outerLabel, innerLabel, uri) => {
    converted += 1;
    return `[${outerLabel || innerLabel}](${formatOneNoteMarkdownDestination(normalizeOneNoteUri(uri))})`;
  });

  const linked = rewriteMarkdownLinkDestinations(next, settings, () => {
    converted += 1;
  });
  next = linked.markdown;

  next = next.replace(/https:\/\/onedrive\.live\.com\/view\.aspx\?[^\s<>\]]+/gi, (raw) => {
    const { url, suffix } = trimTrailingUrlPunctuation(raw);
    const localUri = buildOneNoteUriFromOneDriveUrl(url, settings);
    if (!localUri) return raw;
    converted += 1;
    return `[OneNote 本地链接](${formatOneNoteMarkdownDestination(localUri)})${suffix}`;
  });

  next = next.replace(/(^|[\s(])((?:onenote:)?https:\/\/d\.docs\.live\.net\/[^\s<>\]]+)/gi, (raw, prefix, uri) => {
    if (raw.includes("](<")) return raw;
    const { url, suffix } = trimTrailingUrlPunctuation(uri);
    const localUri = normalizeOneNoteUri(url);
    if (!localUri) return raw;
    converted += 1;
    return `${prefix}[OneNote 本地链接](${formatOneNoteMarkdownDestination(localUri)})${suffix}`;
  });

  next = next.replace(/(^|[\s(])(onenote:https:\/\/[^\s<>\]]+)/gi, (raw, prefix, uri) => {
    if (raw.includes("](<")) return raw;
    const { url, suffix } = trimTrailingUrlPunctuation(uri);
    const localUri = normalizeOneNoteUri(url);
    if (!localUri) return raw;
    converted += 1;
    return `${prefix}[OneNote 本地链接](${formatOneNoteMarkdownDestination(localUri)})${suffix}`;
  });

  next = collapseConsecutiveDuplicateOneNoteLinks(next);

  return { markdown: next, changed: next !== markdown, converted };
}

function rewriteMarkdownLinkDestinations(
  markdown: string,
  settings: Partial<FileAutoLocalizerSettings>,
  onConvert: () => void
) {
  let index = 0;
  let last = 0;
  let output = "";
  let changed = false;

  while (index < markdown.length) {
    const labelStart = markdown.indexOf("[", index);
    if (labelStart === -1) break;

    if (labelStart > 0 && markdown[labelStart - 1] === "!") {
      index = labelStart + 1;
      continue;
    }

    const labelEnd = markdown.indexOf("]", labelStart + 1);
    if (labelEnd === -1 || markdown[labelEnd + 1] !== "(") {
      index = labelStart + 1;
      continue;
    }

    const destination = readBalancedParentheses(markdown, labelEnd + 1);
    if (!destination) {
      index = labelEnd + 1;
      continue;
    }

    const label = markdown.slice(labelStart + 1, labelEnd);
    const rawDestination = destination.inner;
    const destinationUrl = extractLinkDestination(rawDestination);
    const localUri =
      buildOneNoteUriFromOneDriveUrl(destinationUrl, settings) ||
      normalizeOneNoteUri(destinationUrl);

    if (!localUri) {
      index = destination.end + 1;
      continue;
    }

    output += markdown.slice(last, labelStart);
    output += `[${label}](${formatOneNoteMarkdownDestination(localUri)})`;
    last = destination.end + 1;
    index = last;
    changed = true;
    onConvert();
  }

  if (!changed) {
    return { markdown, changed: false };
  }

  output += markdown.slice(last);
  return { markdown: output, changed: true };
}

function buildOneNoteUriFromOneDriveUrl(rawUrl: string, settings: Partial<FileAutoLocalizerSettings> = {}) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    return null;
  }

  if (parsed.hostname.toLowerCase() !== "onedrive.live.com" || !parsed.pathname.toLowerCase().endsWith("/view.aspx")) {
    return null;
  }

  const resid = parsed.searchParams.get("resid") || parsed.searchParams.get("wdsectionfileid") || "";
  const driveId = resid.split("!")[0];
  const target = safeDecodeURIComponent(parsed.searchParams.get("wd") || "").trim();
  const targetMatch = target.match(/^target\(([\s\S]*)\)$/i);
  if (!driveId || !targetMatch) return null;

  const targetParts = targetMatch[1].split("|");
  if (targetParts.length < 3) return null;

  const filePath = normalizeVaultPath(targetParts[0]);
  const sectionAndTitle = targetParts[1].trim();
  const titleSep = sectionAndTitle.indexOf("/");
  const sectionId = titleSep === -1 ? sectionAndTitle : sectionAndTitle.slice(0, titleSep);
  const pageTitle = titleSep === -1 ? "" : sectionAndTitle.slice(titleSep + 1);
  const pageId = targetParts[2].replace(/\/+$/g, "").trim();
  if (!filePath || !sectionId || !pageId) return null;

  const rootPath = normalizeVaultPath(settings.oneNoteBasePath || DEFAULT_SETTINGS.oneNoteBasePath);
  const fullPath =
    rootPath && !filePath.startsWith(`${rootPath}/`) && !filePath.startsWith("文档/")
      ? `${rootPath}/${filePath}`
      : filePath;

  const hashPart = pageTitle ? `#${pageTitle}` : "";
  return normalizeOneNoteUri(
    `onenote:https://d.docs.live.net/${driveId}/${fullPath}${hashPart}&section-id=${wrapGuid(sectionId)}&page-id=${wrapGuid(pageId)}&end`
  );
}

function normalizeOneNoteUri(rawUri: string): string | null {
  const uri = String(rawUri || "").trim();
  if (!uri) return null;
  if (/^onenote:https:\/\/d\.docs\.live\.net\//i.test(uri)) return uri;
  if (/^https:\/\/d\.docs\.live\.net\//i.test(uri)) return `onenote:${uri}`;
  return null;
}

function formatOneNoteMarkdownDestination(uri: string | null) {
  return `<${String(uri).replace(/>/g, "%3E")}>`;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function wrapGuid(value: string) {
  const guid = String(value || "").trim().replace(/[{}]/g, "");
  return `{${guid}}`;
}

function trimTrailingUrlPunctuation(value: string) {
  let url = String(value || "");
  let suffix = "";
  while (/[，。；;,.]$/.test(url)) {
    suffix = url.slice(-1) + suffix;
    url = url.slice(0, -1);
  }

  while (url.endsWith(")") && countChar(url, "(") < countChar(url, ")")) {
    suffix = ")" + suffix;
    url = url.slice(0, -1);
  }

  return { url, suffix };
}

function countChar(value: string, char: string) {
  return Array.from(String(value || "")).filter((item) => item === char).length;
}

function collapseConsecutiveDuplicateOneNoteLinks(markdown: string) {
  const lines = String(markdown || "").split(/\n/);
  const output: string[] = [];
  let previousOneNoteDestination = "";

  for (const line of lines) {
    const destination = extractSingleLineOneNoteMarkdownDestination(line);
    if (destination && destination === previousOneNoteDestination) {
      continue;
    }

    output.push(line);
    previousOneNoteDestination = destination || "";
  }

  return output.join("\n");
}

function extractSingleLineOneNoteMarkdownDestination(line: string) {
  const match = String(line || "").trim().match(/^\[[^\]\n]+]\(<(onenote:https:\/\/[^>]+)>\)$/i);
  return match ? match[1] : "";
}

function findScatteredLocalEmbeds(markdown: string): LocalEmbedMatch[] {
  const matches: LocalEmbedMatch[] = [];
  const wikiRe = /!\[\[([^\]|]+)(\|[^\]]*)?\]\]/g;
  let wikiMatch: RegExpExecArray | null;

  while ((wikiMatch = wikiRe.exec(markdown)) !== null) {
    const linkPath = wikiMatch[1].trim();
    if (HTTP_RE.test(linkPath) || DATA_IMAGE_RE.test(linkPath)) continue;
    if (!LOCAL_IMAGE_EXT_RE.test(linkPath)) continue;
    matches.push({
      raw: wikiMatch[0],
      linkPath,
      suffix: wikiMatch[2] || "",
    });
  }

  let index = 0;
  while (index < markdown.length) {
    const imageStart = markdown.indexOf("![", index);
    if (imageStart === -1) break;

    const altEnd = markdown.indexOf("]", imageStart + 2);
    if (altEnd === -1 || markdown[altEnd + 1] !== "(") {
      index = imageStart + 2;
      continue;
    }

    const destination = readBalancedParentheses(markdown, altEnd + 1);
    if (!destination) {
      index = altEnd + 2;
      continue;
    }

    const rawUrl = extractLinkDestination(destination.inner);
    if (HTTP_RE.test(rawUrl) || DATA_IMAGE_RE.test(rawUrl) || !LOCAL_IMAGE_EXT_RE.test(rawUrl)) {
      index = destination.end + 1;
      continue;
    }

    matches.push({
      raw: markdown.slice(imageStart, destination.end + 1),
      linkPath: rawUrl,
      suffix: "",
    });
    index = destination.end + 1;
  }

  return matches;
}

function resolveLocalImagePath(notePath: string, linkPath: string, app: App): string | null {
  const clean = String(linkPath || "").trim().split("|")[0].trim();
  if (!clean || HTTP_RE.test(clean) || DATA_IMAGE_RE.test(clean)) return null;

  const linked = app.metadataCache.getFirstLinkpathDest(clean, notePath);
  if (linked instanceof TFile) return linked.path;

  const normalized = normalizeVaultPath(clean);
  const direct = app.vault.getAbstractFileByPath(normalized);
  if (direct instanceof TFile) return direct.path;

  const noteParts = normalizeVaultPath(notePath).split("/");
  noteParts.pop();
  while (noteParts.length >= 0) {
    const candidate = normalizeVaultPath([...noteParts, clean].join("/"));
    const file = app.vault.getAbstractFileByPath(candidate);
    if (file instanceof TFile) return file.path;
    noteParts.pop();
  }

  return null;
}

function isScatteredAttachmentPath(vaultPath: string, attachmentFolder: string) {
  const normalized = normalizeVaultPath(vaultPath);
  const folder = normalizeVaultPath(attachmentFolder);
  if (!normalized || isInsideFolder(normalized, folder)) return false;
  return SCATTERED_ATTACHMENT_RE.test(normalized);
}

function hasActionableAutoProcessWork(markdown: string, settings: FileAutoLocalizerSettings) {
  const source = String(markdown || "");
  if (!source.trim()) return false;

  if (hasLegacyAttachmentSyntax(source, settings.attachmentFolder)) return true;
  if (settings.processOneNoteLinks && hasOneNoteWebLink(source)) return true;

  if (settings.processScatteredLocalImages) {
    const attachmentFolder = normalizeVaultPath(settings.attachmentFolder || DEFAULT_SETTINGS.attachmentFolder);
    const localEmbeds = findScatteredLocalEmbeds(source);
    if (localEmbeds.some((embed) => {
      const normalized = normalizeVaultPath(embed.linkPath.split("|")[0]);
      return SCATTERED_ATTACHMENT_RE.test(normalized) && !isInsideFolder(normalized, attachmentFolder);
    })) {
      return true;
    }
  }

  const images = findProcessableMarkdownImages(source);
  return images.some((image) => shouldAutoProcessImage(image, settings));
}

function hasLegacyAttachmentSyntax(markdown: string, attachmentFolder: string) {
  const folder = escapeRegExp(normalizeVaultPath(attachmentFolder || DEFAULT_SETTINGS.attachmentFolder));
  return /!\[\[\.attachments\/[^\]]+]]/i.test(markdown)
    || /!\[[\s\S]*?]\((?:\.\.\/)*\.attachments\/[^)]+\)/i.test(markdown)
    || new RegExp(`!\\[\\]\\((?:\\.\\./)*${folder}/[^)|]+\\.(?:png|jpe?g|gif|webp|avif|svg|bmp|tiff?)%7C\\d+\\)`, "i").test(markdown)
    || new RegExp(`!\\[[\\s\\S]*?[\\r\\n][\\s\\S]*?\\]\\((?:\\.\\./)*${folder}/[^)]+\\)`, "i").test(markdown);
}

function hasOneNoteWebLink(markdown: string) {
  return /https:\/\/(?:www\.)?onedrive\.live\.com\/redir/i.test(markdown)
    || /https:\/\/(?:www\.)?sharepoint\.com\/:[a-z]:/i.test(markdown)
    || /https:\/\/onedrive\.live\.com\/edit/i.test(markdown);
}

function shouldAutoProcessImage(match: ImageMatch, settings: FileAutoLocalizerSettings) {
  if (match.type === "data") {
    return Boolean(settings.processOneNoteImages);
  }

  const source = classifyRemoteSource(match.url);
  if (source === "cubox") return Boolean(settings.processCuboxImages);
  if (source === "wechat") return Boolean(settings.processWeChatImages);
  return Boolean(settings.processOtherRemoteImages);
}

function isEditorPasteTarget(target: EventTarget | null) {
  const el = target instanceof HTMLElement ? target : null;
  if (!el) return false;
  if (el.closest("input, textarea, select, .modal, .menu")) return false;
  return Boolean(el.closest(".markdown-source-view, .markdown-reading-view, .markdown-preview-view, .cm-editor, .cm-content"));
}

function pasteCouldNeedAutoProcess(data: DataTransfer | null) {
  if (!data) return false;

  for (const item of Array.from(data.items || [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) return true;
  }

  const html = data.getData("text/html") || "";
  if (html && /<img\b|data:image\/|https?:\/\/|onedrive\.live\.com|sharepoint\.com|\.attachments\//i.test(html)) {
    return true;
  }

  const text = data.getData("text/plain") || data.getData("text/uri-list") || "";
  return /!\[[\s\S]*?]\(\s*(?:https?:\/\/|data:image\/)|!\[\[\.attachments\/|https:\/\/(?:www\.)?onedrive\.live\.com|https:\/\/(?:www\.)?sharepoint\.com/i.test(text);
}

function guessExtensionFromPath(path: string) {
  const match = normalizeVaultPath(path).match(/\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/i);
  return match ? normalizeExtension(match[1]) : ".png";
}

function findProcessableMarkdownImages(markdown: string): ImageMatch[] {
  const matches: ImageMatch[] = [];
  let index = 0;

  while (index < markdown.length) {
    const imageStart = markdown.indexOf("![", index);
    if (imageStart === -1) break;

    const altEnd = markdown.indexOf("]", imageStart + 2);
    if (altEnd === -1 || markdown[altEnd + 1] !== "(") {
      index = imageStart + 2;
      continue;
    }

    const destination = readBalancedParentheses(markdown, altEnd + 1);
    if (!destination) {
      index = altEnd + 2;
      continue;
    }

    const rawUrl = extractLinkDestination(destination.inner);
    const type: ImageMatch["type"] | "" = HTTP_RE.test(rawUrl)
      ? "remote"
      : DATA_IMAGE_RE.test(rawUrl)
      ? "data"
      : "";
    if (!type) {
      index = destination.end + 1;
      continue;
    }

    matches.push({
      raw: markdown.slice(imageStart, destination.end + 1),
      alt: markdown.slice(imageStart + 2, altEnd),
      url: rawUrl,
      type,
      index: imageStart,
    });

    index = destination.end + 1;
  }

  return matches;
}

function readBalancedParentheses(source: string, openIndex: number) {
  let depth = 0;

  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    const previous = source[i - 1];

    if (char === "(" && previous !== "\\") {
      depth += 1;
    } else if (char === ")" && previous !== "\\") {
      depth -= 1;
      if (depth === 0) {
        return {
          inner: source.slice(openIndex + 1, i),
          end: i,
        };
      }
    }
  }

  return null;
}

function extractLinkDestination(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("<")) {
    const close = trimmed.indexOf(">");
    if (close !== -1) return trimmed.slice(1, close);
  }

  const titleMatch = trimmed.match(/^(\S+)\s+["'][^"']*["']\s*$/);
  return titleMatch ? titleMatch[1] : trimmed;
}

function isInsideFolder(filePath: string, folderPath: string) {
  const normalized = normalizeVaultPath(folderPath);
  if (!normalized) return true;
  return filePath === normalized || filePath.startsWith(`${normalized}/`);
}

function normalizeSettings(settings: Partial<FileAutoLocalizerSettings> & { defaultFolder?: string }): FileAutoLocalizerSettings {
  const normalized = Object.assign({}, DEFAULT_SETTINGS, settings || {}) as FileAutoLocalizerSettings & { defaultFolder?: string };
  if (!Array.isArray(normalized.defaultFolders)) {
    normalized.defaultFolders = normalized.defaultFolder ? [normalized.defaultFolder] : [];
  }
  normalized.defaultFolders = normalized.defaultFolders.map(normalizeVaultPath).filter(Boolean);
  normalized.oneNoteBasePath = normalizeVaultPath(normalized.oneNoteBasePath || DEFAULT_SETTINGS.oneNoteBasePath);
  normalized.processOneNoteLinks = normalized.processOneNoteLinks !== false;
  normalized.processScatteredLocalImages = normalized.processScatteredLocalImages !== false;
  delete normalized.defaultFolder;
  return normalized;
}

function formatFolderSelection(folderPaths: string[]) {
  const folders = (folderPaths || []).map(normalizeVaultPath).filter(Boolean);
  if (folders.length === 0) return "未选择时处理整个 vault；点击按钮可多选已有文件夹";
  return `已选择 ${folders.length} 个：${folders.join("、")}`;
}

function classifyRemoteSource(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (error) {
    return "other";
  }

  const host = parsed.hostname.toLowerCase();
  if (host.includes("cubox.pro")) return "cubox";
  if (host.includes("mmbiz.qpic.cn") || host.includes("mp.weixin.qq.com")) return "wechat";

  const imageUrl = parsed.searchParams.get("imageUrl");
  if (imageUrl) {
    try {
      const nestedHost = new URL(decodeURIComponent(imageUrl)).hostname.toLowerCase();
      if (nestedHost.includes("mmbiz.qpic.cn") || nestedHost.includes("mp.weixin.qq.com")) return "wechat";
    } catch (error) {
      return "other";
    }
  }

  return "other";
}

function normalizeVaultPath(path: string) {
  return String(path || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function escapeRegExp(value: string) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function encodeMarkdownPath(path: string) {
  return String(path || "")
    .split("/")
    .map((part) => encodeURIComponent(part).replace(/%20/g, "%20"))
    .join("/");
}

function relativePathFromNote(notePath: string, targetPath: string) {
  const noteParts = normalizeVaultPath(notePath).split("/");
  noteParts.pop();
  const targetParts = normalizeVaultPath(targetPath).split("/");

  while (noteParts.length > 0 && targetParts.length > 0 && noteParts[0] === targetParts[0]) {
    noteParts.shift();
    targetParts.shift();
  }

  const prefix = noteParts.map(() => "..");
  const relativeParts = prefix.concat(targetParts);
  return relativeParts.length > 0 ? relativeParts.join("/") : targetPath;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)((?:;[^,]+)*),(.*)$/i);
  if (!match) throw new Error("Invalid data URL");

  const contentType = match[1].toLowerCase();
  const flags = match[2] || "";
  const data = match[3] || "";
  const bytes = flags.includes(";base64")
    ? binaryStringToArrayBuffer(atob(data))
    : new TextEncoder().encode(decodeURIComponent(data)).buffer;

  return { contentType, arrayBuffer: bytes };
}

function binaryStringToArrayBuffer(binary: string) {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function isTransparentPlaceholderDataUrl(dataUrl: string) {
  try {
    const parsed = parseDataUrl(dataUrl);
    if (parsed.contentType !== "image/svg+xml") return false;
    const svg = new TextDecoder().decode(parsed.arrayBuffer);
    const isOnePixel = /width=['"]1px['"]/i.test(svg)
      && /height=['"]1px['"]/i.test(svg)
      && /viewBox=['"]0 0 1 1['"]/i.test(svg);
    const isTransparent = /fill-opacity=['"]0['"]/i.test(svg) || /opacity=['"]0['"]/i.test(svg);
    return isOnePixel && isTransparent;
  } catch (error) {
    return false;
  }
}

function guessExtensionFromUrl(url: string) {
  const candidates = [url];

  try {
    const parsed = new URL(url);
    const imageUrl = parsed.searchParams.get("imageUrl");
    if (imageUrl) candidates.unshift(decodeURIComponent(imageUrl));
  } catch (error) {
    // Use the raw URL fallback below.
  }

  for (const candidate of candidates) {
    const clean = candidate.split("#")[0].split("?")[0];
    const match = clean.match(/\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/i);
    if (match) return normalizeExtension(match[1]);
  }

  return ".png";
}

function guessExtensionFromContentType(contentType: string | undefined) {
  if (!contentType) return "";
  const type = contentType.split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
  };
  return map[type] || "";
}

function normalizeExtension(ext: string) {
  const lower = ext.toLowerCase().replace(/^\./, "");
  if (lower === "jpeg") return ".jpg";
  if (lower === "tif") return ".tiff";
  return `.${lower}`;
}

function stableHash(value: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `img-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function replaceAll(source: string, search: string, replacement: string) {
  return source.split(search).join(replacement);
}

// --- 单实例：保证只在 load 之后存在一个 runner，便于设置 UI 拿到引用 ---

let activeRunner: FileAutoLocalizerRunner | null = null;

export const fileAutoLocalizerModule: EmbeddedSubModule = {
  id: "file-auto-localizer",
  displayName: "文件自动本地化",
  description: "原 OneNote 本地化插件：自动把笔记中的远程图片、OneDrive/OneNote 链接转换为本地文件与可打开链接",
  defaultEnabled: true,
  replacesExternalPluginId: "image-localizer",
  async load(host) {
    const runner = new FileAutoLocalizerRunner(host);
    activeRunner = runner;
    host.register(() => {
      if (activeRunner === runner) activeRunner = null;
    });
    await runner.start();
  },
};

/** 在总设置页"功能开关"页签里渲染该模块的设置项。如果模块未启用，调用者应跳过。 */
export function renderFileAutoLocalizerSettings(containerEl: HTMLElement) {
  const runner = activeRunner;
  if (!runner) {
    containerEl.createEl("p", {
      text: "文件自动本地化未启用，启用后可在此调整设置。",
      cls: "setting-item-description",
    });
    return;
  }

  containerEl.empty();

  const actions = containerEl.createDiv({ cls: "fdtb-localizer-quick-actions" });
  new Setting(actions)
    .setName("快捷处理")
    .setDesc("手动触发本地化，不依赖自动处理开关")
    .addButton((button) =>
      button.setButtonText("立即处理当前笔记").onClick(() => {
        void runner.localizeCurrentFile();
      })
    )
    .addButton((button) =>
      button.setButtonText("选择文件夹批量处理").onClick(() => {
        new FolderPickerModal(runner.host.app, runner.settings.defaultFolders, async (folderPaths) => {
          runner.settings.defaultFolders = folderPaths.map(normalizeVaultPath).filter(Boolean);
          await runner.saveSettings();
          await runner.localizeFolders(runner.settings.defaultFolders);
        }).open();
      })
    );

  const autoSection = containerEl.createEl("details", { cls: "fdtb-localizer-section" });
  autoSection.createEl("summary", { text: "自动处理" });
  const autoBody = autoSection.createDiv();

  new Setting(autoBody)
    .setName("粘贴后自动处理当前笔记")
    .setDesc("仅在编辑器里粘贴图片、远程图片或 OneNote 链接后检查；平时打开、编辑、保存笔记不触发")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.autoProcessActiveNote).onChange(async (value) => {
        runner.settings.autoProcessActiveNote = value;
        await runner.saveSettings();
      })
    );

  new Setting(autoBody)
    .setName("后台文件事件处理")
    .setDesc("已停用：为避免卡顿，不再监听打开、修改、新建文件；批量导入后请用上方“选择文件夹批量处理”")
    .addToggle((toggle) =>
      toggle.setValue(false).setDisabled(true).onChange(async (value) => {
        runner.settings.autoProcessAllMarkdown = value;
        await runner.saveSettings();
      })
    );

  const sourceSection = containerEl.createEl("details", { cls: "fdtb-localizer-section" });
  sourceSection.createEl("summary", { text: "来源开关（微信 · Cubox · OneNote · 远程图 · 散落附件）" });
  const sourceBody = sourceSection.createDiv();

  new Setting(sourceBody)
    .setName("自动下载微信图片")
    .setDesc("处理 mmbiz.qpic.cn、mp.weixin.qq.com 等微信文章图片")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.processWeChatImages).onChange(async (value) => {
        runner.settings.processWeChatImages = value;
        await runner.saveSettings();
      })
    );

  new Setting(sourceBody)
    .setName("自动下载 Cubox 图片")
    .setDesc("处理 Cubox 代理图片链接，例如 cubox.pro/c/filters...")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.processCuboxImages).onChange(async (value) => {
        runner.settings.processCuboxImages = value;
        await runner.saveSettings();
      })
    );

  new Setting(sourceBody)
    .setName("自动保存 OneNote 图片")
    .setDesc("处理 OneNote 复制进来的 data:image/base64 图片，转成本地图片文件")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.processOneNoteImages).onChange(async (value) => {
        runner.settings.processOneNoteImages = value;
        await runner.saveSettings();
      })
    );

  new Setting(sourceBody)
    .setName("自动转换 OneNote 页面链接")
    .setDesc("把 OneDrive 网页视图链接转换为可打开本地 OneNote 的 onenote: 链接")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.processOneNoteLinks).onChange(async (value) => {
        runner.settings.processOneNoteLinks = value;
        await runner.saveSettings();
      })
    );

  new Setting(sourceBody)
    .setName("自动下载其他远程图片")
    .setDesc("处理非微信、非 Cubox 的普通 http/https 图片")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.processOtherRemoteImages).onChange(async (value) => {
        runner.settings.processOtherRemoteImages = value;
        await runner.saveSettings();
      })
    );

  new Setting(sourceBody)
    .setName("自动迁移散落本地附件")
    .setDesc("把 assets/attachments、.attachments 等可见目录里的图片搬到隐藏附件目录，并改写笔记引用")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.processScatteredLocalImages).onChange(async (value) => {
        runner.settings.processScatteredLocalImages = value;
        await runner.saveSettings();
      })
    );

  new Setting(sourceBody)
    .setName("移除透明占位图")
    .setDesc("自动清理微信剪藏里常见的 1px data:image 占位，避免破图框")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.removeTransparentPlaceholders).onChange(async (value) => {
        runner.settings.removeTransparentPlaceholders = value;
        await runner.saveSettings();
      })
    );

  const advancedSection = containerEl.createEl("details", { cls: "fdtb-localizer-section" });
  advancedSection.createEl("summary", { text: "高级路径与引用格式" });
  const advancedBody = advancedSection.createDiv();

  new Setting(advancedBody)
    .setName("隐藏附件目录")
    .setDesc("图片会下载到 vault 内这个目录。默认 _attachments，并通过 CSS 在文件列表隐藏")
    .addText((text) =>
      text
        .setPlaceholder("_attachments")
        .setValue(runner.settings.attachmentFolder)
        .onChange(async (value) => {
          runner.settings.attachmentFolder = normalizeVaultPath(value) || DEFAULT_SETTINGS.attachmentFolder;
          await runner.saveSettings();
        })
    );

  new Setting(advancedBody)
    .setName("批量默认文件夹")
    .setDesc(formatFolderSelection(runner.settings.defaultFolders))
    .addButton((button) =>
      button.setButtonText("选择文件夹").onClick(() => {
        new FolderPickerModal(runner.host.app, runner.settings.defaultFolders, async (folderPaths) => {
          runner.settings.defaultFolders = folderPaths.map(normalizeVaultPath).filter(Boolean);
          await runner.saveSettings();
          renderFileAutoLocalizerSettings(containerEl);
        }).open();
      })
    )
    .addButton((button) =>
      button.setButtonText("清空").onClick(async () => {
        runner.settings.defaultFolders = [];
        await runner.saveSettings();
        renderFileAutoLocalizerSettings(containerEl);
      })
    );

  new Setting(advancedBody)
    .setName("引用格式")
    .setDesc("推荐标准 Markdown 相对路径，避免 Obsidian 找不到 wiki 图片")
    .addDropdown((dropdown) =>
      dropdown
        .addOption("markdown", "![](_attachments/xxx.png)")
        .addOption("wiki-path", "![[_attachments/xxx.png]]")
        .addOption("basename", "![[xxx.png]]")
        .setValue(runner.settings.rewriteMode)
        .onChange(async (value) => {
          runner.settings.rewriteMode = value as FileAutoLocalizerSettings["rewriteMode"];
          await runner.saveSettings();
        })
    );

  new Setting(advancedBody)
    .setName("OneNote 根路径")
    .setDesc("用于从 OneDrive 网页链接补全本地 OneNote 路径；留空则跳过链接转换")
    .addText((text) =>
      text
        .setPlaceholder("例如：Documents/MyNotebook/Section")
        .setValue(runner.settings.oneNoteBasePath)
        .onChange(async (value) => {
          runner.settings.oneNoteBasePath = normalizeVaultPath(value);
          await runner.saveSettings();
        })
    );

  new Setting(advancedBody)
    .setName("覆盖已存在图片")
    .setDesc("默认关闭；同一 URL 会复用 hash 文件，避免重复下载")
    .addToggle((toggle) =>
      toggle.setValue(runner.settings.overwriteExisting).onChange(async (value) => {
        runner.settings.overwriteExisting = value;
        await runner.saveSettings();
      })
    );
}

export const __fileAutoLocalizerTest = {
  normalizeOneNoteLinks,
  buildOneNoteUriFromOneDriveUrl,
  normalizeOneNoteUri,
  collapseConsecutiveDuplicateOneNoteLinks,
  findProcessableMarkdownImages,
  hasActionableAutoProcessWork,
  isEditorPasteTarget,
  pasteCouldNeedAutoProcess,
  findScatteredLocalEmbeds,
  resolveLocalImagePath,
  isScatteredAttachmentPath,
  guessExtensionFromPath,
  guessExtensionFromUrl,
  guessExtensionFromContentType,
  stableHash,
  normalizeVaultPath,
  relativePathFromNote,
  isTransparentPlaceholderDataUrl,
};
