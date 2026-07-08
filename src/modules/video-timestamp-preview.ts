import { ItemView, MarkdownView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { EmbeddedSubModule, SubPluginHost } from "./sub-plugin-host";
import {
  absolutePathToFileUrl,
  buildOnlineEmbedUrl,
  buildSeekUrl,
  buildVideoSummaryMediaCandidates,
  convertLegacyTimelineMarkdown,
  detectVideoPlatform,
  mediaTypeFromPath,
  parseSeekUrl,
  parseTimestampToSeconds,
  parseTimelineText,
  type VideoSeekTarget,
} from "./video-timestamp-preview-helpers";

type VideoTimestampPreviewSettings = {
  playerWidth: number;
};

type VideoSummaryMetadata = {
  sourceUrl: string;
  platform: string;
  title: string;
  videoId: string;
  mediaPath: string;
  mediaUrl: string;
  mediaPageUrl: string;
  mediaType: string;
  duration: number;
};

type ResolvedMedia = {
  src: string;
  vaultPath?: string;
  copied: boolean;
  source: "local" | "cloud" | "embed";
  mode: PlaybackMode;
};

type PlaybackMode = "online" | "local";

const DEFAULT_SETTINGS: VideoTimestampPreviewSettings = {
  playerWidth: 420,
};

const STYLE_ID = "fdtb-video-timestamp-preview-style";
const VIEW_TYPE = "fdtb-video-timestamp-preview";
const MODULE_STYLE = `
.fdtb-video-preview-root {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--background-primary);
}
.fdtb-video-preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--background-modifier-border);
  background: var(--background-secondary);
}
.fdtb-video-preview-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 600;
}
.fdtb-video-preview-close {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}
.fdtb-video-preview-source-toggle {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
.fdtb-video-preview-source-button {
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  background: var(--background-primary);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 5px 7px;
}
.fdtb-video-preview-source-button.is-active {
  background: var(--interactive-accent);
  border-color: var(--interactive-accent);
  color: var(--text-on-accent, #fff);
}
.fdtb-video-preview-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}
.fdtb-video-preview-root video,
.fdtb-video-preview-root audio,
.fdtb-video-preview-root iframe {
  width: 100%;
  max-height: 62vh;
  display: block;
  background: #000;
  border-radius: 8px;
}
.fdtb-video-preview-root iframe {
  aspect-ratio: 16 / 9;
  height: auto;
  border: 0;
}
.fdtb-video-preview-meta {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 12px;
}
.fdtb-video-preview-empty {
  color: var(--text-muted);
  padding: 18px 12px;
  font-size: 13px;
}
`;

function injectStyle() {
  if (typeof document === "undefined" || !document.head) return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = MODULE_STYLE;
  document.head.appendChild(style);
}

function removeStyle() {
  document.getElementById(STYLE_ID)?.remove();
}

function getActiveMarkdownFile(host: SubPluginHost): TFile | null {
  const view = host.app.workspace.getActiveViewOfType(MarkdownView);
  return view?.file ?? null;
}

function getMarkdownFileFromDomTarget(host: SubPluginHost, target: HTMLElement | null): TFile | null {
  if (!target) return null;
  const leaves = (host.app.workspace as any).getLeavesOfType?.("markdown") ?? [];
  for (const leaf of leaves) {
    const view = leaf?.view as MarkdownView | undefined;
    const containerEl = (view as any)?.containerEl as HTMLElement | undefined;
    if (view?.file && containerEl?.contains?.(target)) return view.file;
  }
  return getActiveMarkdownFile(host);
}

function frontmatterValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readVideoSummaryFrontmatter(host: SubPluginHost, file: TFile | null): VideoSummaryMetadata | null {
  if (!file) return null;
  const cache = host.app.metadataCache.getFileCache(file);
  const raw = cache?.frontmatter?.video_summary;
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const mediaPath = frontmatterValue(data.media_path);
  const mediaUrl = frontmatterValue(data.media_url);
  const sourceUrl = frontmatterValue(data.source_url);
  if (!mediaPath && !mediaUrl && !sourceUrl) return null;
  const mediaPageUrl = frontmatterValue(data.media_page_url);
  return {
    sourceUrl,
    platform: frontmatterValue(data.platform) || detectVideoPlatform(sourceUrl),
    title: frontmatterValue(data.title),
    videoId: frontmatterValue(data.video_id),
    mediaPath,
    mediaUrl,
    mediaPageUrl,
    mediaType: frontmatterValue(data.media_type) || mediaTypeFromPath(mediaPath || mediaUrl),
    duration: typeof data.duration === "number" ? data.duration : Number(data.duration) || 0,
  };
}

function parseLegacyTimelineLine(line: string): VideoSeekTarget | null {
  const match = String(line || "").match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\]/);
  if (!match) return null;
  const start = parseTimestampToSeconds(match[1]);
  const end = parseTimestampToSeconds(match[2]);
  if (start === null) return null;
  return { start, end: end ?? undefined };
}

function inferMetadataFromMarkdown(markdown: string): VideoSummaryMetadata | null {
  const bvMatch = markdown.match(/https?:\/\/(?:www\.)?bilibili\.com\/video\/(BV[0-9A-Za-z]+)/);
  if (bvMatch) {
    const videoId = bvMatch[1];
    return {
      sourceUrl: bvMatch[0],
      platform: "bilibili",
      title: "",
      videoId,
      mediaPath: "",
      mediaUrl: "",
      mediaPageUrl: "",
      mediaType: "video",
      duration: 0,
    };
  }
  const sourceMatch = markdown.match(/https?:\/\/[^\s)\]>"]+/);
  if (sourceMatch) {
    const sourceUrl = sourceMatch[0];
    const platform = detectVideoPlatform(sourceUrl);
    if (platform) {
      let videoId = "";
      try {
        const parsed = new URL(sourceUrl);
        videoId =
          platform === "youtube"
            ? parsed.hostname.includes("youtu.be")
              ? parsed.pathname.replace(/^\/+/, "").split("/")[0] ?? ""
              : parsed.searchParams.get("v") ?? parsed.pathname.match(/\/(?:shorts|embed)\/([^/?#]+)/)?.[1] ?? ""
            : sourceUrl.match(/\/video\/(BV[0-9A-Za-z]+)/)?.[1] ?? "";
      } catch {
        videoId = "";
      }
      return {
        sourceUrl,
        platform,
        title: markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "",
        videoId,
        mediaPath: "",
        mediaUrl: "",
        mediaPageUrl: "",
        mediaType: "video",
        duration: 0,
      };
    }
  }
  return null;
}

function buildFrontmatter(metadata: VideoSummaryMetadata): string {
  return [
    "---",
    "video_summary:",
    `  source_url: ${JSON.stringify(metadata.sourceUrl)}`,
    `  platform: ${JSON.stringify(metadata.platform)}`,
    `  title: ${JSON.stringify(metadata.title)}`,
    `  video_id: ${JSON.stringify(metadata.videoId)}`,
    `  media_path: ${JSON.stringify(metadata.mediaPath)}`,
    `  media_url: ${JSON.stringify(metadata.mediaUrl)}`,
    `  media_page_url: ${JSON.stringify(metadata.mediaPageUrl)}`,
    `  media_type: ${JSON.stringify(metadata.mediaType)}`,
    `  duration: ${Number.isFinite(metadata.duration) ? metadata.duration : 0}`,
    "---",
    "",
  ].join("\n");
}

function ensureFrontmatter(markdown: string, metadata: VideoSummaryMetadata | null): string {
  if (!metadata || markdown.trimStart().startsWith("---")) return markdown;
  return `${buildFrontmatter(metadata)}${markdown}`;
}

function sanitizeFilename(name: string): string {
  return String(name || "video")
    .replace(/[\\/:*?"<>|#%{}[\]^~`]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "video";
}

function getNodeRequire(): ((id: string) => any) | null {
  const req =
    (typeof window !== "undefined" ? (window as any).require : undefined) ??
    (globalThis as any).require;
  return typeof req === "function" ? req : null;
}

async function ensureFolder(adapter: any, folderPath: string) {
  const parts = String(folderPath || "").split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!(await adapter.exists(current))) {
      await adapter.mkdir(current);
    }
  }
}

function bufferToArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

class VideoTimestampPreviewView extends ItemView {
  private mediaEl: HTMLVideoElement | HTMLAudioElement | null = null;
  private iframeEl: HTMLIFrameElement | null = null;
  private metadata: VideoSummaryMetadata | null = null;
  private switchSource: ((mode: PlaybackMode) => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "视频预览";
  }

  getIcon() {
    return "play-circle";
  }

  async onOpen() {
    this.renderEmpty();
  }

  async onClose() {
    this.pause();
  }

  show(
    metadata: VideoSummaryMetadata,
    media: ResolvedMedia,
    seek: VideoSeekTarget,
    switchSource: (mode: PlaybackMode) => void
  ) {
    this.metadata = metadata;
    this.switchSource = switchSource;
    this.renderPlayer(metadata, media);
    this.seekTo(media, seek);
  }

  private renderEmpty() {
    this.pause();
    this.switchSource = null;
    this.contentEl.empty();
    this.contentEl.addClass("fdtb-video-preview-root");
    this.contentEl.createDiv({
      cls: "fdtb-video-preview-empty",
      text: "点击视频总结时间轴后，会在这里预览本地视频。",
    });
  }

  private renderPlayer(metadata: VideoSummaryMetadata, resolved: ResolvedMedia) {
    if (resolved.source === "embed") {
      this.renderEmbedPlayer(metadata, resolved);
      return;
    }
    const mediaType = metadata.mediaType === "audio" ? "audio" : "video";
    const currentType = this.mediaEl?.tagName.toLowerCase();
    const currentSrc = this.mediaEl?.getAttribute("src") ?? "";
    const nextSrc = resolved.src;
    if (this.mediaEl && currentType === mediaType && currentSrc === nextSrc) return;

    this.pause();
    this.contentEl.empty();
    this.contentEl.addClass("fdtb-video-preview-root");
    const header = this.contentEl.createDiv({ cls: "fdtb-video-preview-header" });
    header.createDiv({ cls: "fdtb-video-preview-title", text: metadata.title || metadata.videoId || "视频预览" });
    this.appendSourceToggle(header, resolved.mode);
    const close = header.createEl("button", { cls: "fdtb-video-preview-close", text: "×" });
    close.addEventListener("click", () => this.leaf.detach());
    const body = this.contentEl.createDiv({ cls: "fdtb-video-preview-body" });
    const media = body.createEl(mediaType, {
      attr: {
        controls: "true",
        src: nextSrc,
      },
    }) as HTMLVideoElement | HTMLAudioElement;
    body.createDiv({
      cls: "fdtb-video-preview-meta",
      text: resolved.copied
        ? "已复制到 Obsidian 本地媒体缓存"
        : resolved.mode === "online"
          ? resolved.source === "cloud"
            ? "在线 raw 媒体预览；另一台 Mac 没有本地缓存时也可播放"
            : "在线源预览；如有广告或源站失效，可切换到本地。"
          : metadata.mediaType === "audio"
          ? "当前为音频缓存预览"
          : "本地视频缓存预览；通过仅本机可访问的播放通道读取已配置媒体库。",
    });
    this.mediaEl = media;
  }

  private renderEmbedPlayer(metadata: VideoSummaryMetadata, resolved: ResolvedMedia) {
    const currentSrc = this.iframeEl?.getAttribute("src") ?? "";
    if (this.iframeEl && currentSrc === resolved.src) return;

    this.pause();
    this.contentEl.empty();
    this.contentEl.addClass("fdtb-video-preview-root");
    const header = this.contentEl.createDiv({ cls: "fdtb-video-preview-header" });
    header.createDiv({ cls: "fdtb-video-preview-title", text: metadata.title || metadata.videoId || "在线视频预览" });
    this.appendSourceToggle(header, resolved.mode);
    const close = header.createEl("button", { cls: "fdtb-video-preview-close", text: "×" });
    close.addEventListener("click", () => this.leaf.detach());
    const body = this.contentEl.createDiv({ cls: "fdtb-video-preview-body" });
    const frame = body.createEl("iframe", {
      attr: {
        src: resolved.src,
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowfullscreen: "true",
      },
    }) as HTMLIFrameElement;
    body.createDiv({
      cls: "fdtb-video-preview-meta",
      text: "在线源预览；如有广告或源站失效，可切换到本地。",
    });
    this.iframeEl = frame;
  }

  private appendSourceToggle(header: HTMLElement, activeMode: PlaybackMode) {
    const group = header.createDiv({ cls: "fdtb-video-preview-source-toggle" });
    for (const mode of ["online", "local"] as PlaybackMode[]) {
      const button = group.createEl("button", {
        cls: `fdtb-video-preview-source-button${activeMode === mode ? " is-active" : ""}`,
        text: mode === "online" ? "在线" : "本地",
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.switchSource?.(mode);
      });
    }
  }

  private seekTo(resolved: ResolvedMedia, seek: VideoSeekTarget) {
    if (resolved.source === "embed") {
      if (this.iframeEl?.getAttribute("src") !== resolved.src) {
        this.iframeEl?.setAttribute("src", resolved.src);
      }
      return;
    }
    if (!this.mediaEl) return;
    const src = resolved.src;
    if (this.mediaEl.getAttribute("src") !== src) {
      this.mediaEl.setAttribute("src", src);
    }
    const applySeek = () => {
      if (!this.mediaEl) return;
      try {
        this.mediaEl.currentTime = seek.start;
        void this.mediaEl.play?.();
      } catch (error) {
        console.warn("[video-timestamp-preview] seek failed", error);
      }
    };
    if (this.mediaEl.readyState >= 1) {
      applySeek();
    } else {
      this.mediaEl.addEventListener("loadedmetadata", applySeek, { once: true });
      this.mediaEl.load();
    }
  }

  private pause() {
    try {
      this.mediaEl?.pause?.();
    } catch {
      // ignore
    }
    this.mediaEl = null;
    this.iframeEl = null;
  }
}

class VideoTimestampPreviewRunner {
  private settings: VideoTimestampPreviewSettings = DEFAULT_SETTINGS;
  private lastOpenKey = "";
  private lastOpenAt = 0;
  private localMediaServer: any = null;
  private localMediaServerStarting: Promise<void> | null = null;
  private localMediaPort = 0;
  private localMediaPathTokens = new Map<string, string>();
  private localMediaTokenPaths = new Map<string, string>();
  private playbackModeByNote = new Map<string, PlaybackMode>();
  private defaultPlaybackMode: PlaybackMode = "online";

  constructor(private host: SubPluginHost) {}

  async start() {
    const saved = (await this.host.loadData()) as Partial<VideoTimestampPreviewSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
    injectStyle();
    this.host.registerView(VIEW_TYPE, (leaf: WorkspaceLeaf) => new VideoTimestampPreviewView(leaf));

    this.host.registerDomEvent(document, "mousedown", (event) => this.handleDocumentPointer(event), true);
    this.host.registerDomEvent(document, "click", (event) => this.handleDocumentClick(event), true);
    this.host.registerEvent(
      this.host.app.workspace.on("editor-menu", (menu, editor, view) => {
        this.extendEditorMenu(menu, editor, view);
      })
    );

    this.host.addCommand({
      id: "convert-current-note",
      name: "补全当前视频总结的可点击时间轴",
      callback: () => void this.convertCurrentNote(),
    });

    this.host.register(() => {
      removeStyle();
      this.stopLocalMediaServer();
    });
  }

  private handleDocumentPointer(event: MouseEvent) {
    const hit = this.resolveTimelineHit(event);
    if (!hit) return;
    this.consumeEvent(event);
    if (this.isDuplicateOpen(hit)) return;
    void this.openForFile(hit.file, hit.seek);
  }

  private handleDocumentClick(event: MouseEvent) {
    const hit = this.resolveTimelineHit(event);
    if (!hit) return;
    this.consumeEvent(event);
    if (this.isDuplicateOpen(hit)) return;
    void this.openForFile(hit.file, hit.seek);
  }

  private isDuplicateOpen(hit: { seek: VideoSeekTarget; file: TFile | null }): boolean {
    const key = `${hit.file?.path ?? "active"}:${hit.seek.start}:${hit.seek.end ?? ""}`;
    const now = Date.now();
    if (key === this.lastOpenKey && now - this.lastOpenAt < 350) return true;
    this.lastOpenKey = key;
    this.lastOpenAt = now;
    return false;
  }

  private resolveTimelineHit(event: MouseEvent): { seek: VideoSeekTarget; file: TFile | null } | null {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest?.(
      "a[href*='video-summary-seek?'], a[href^='video-summary://seek']"
    ) as HTMLAnchorElement | null;
    if (anchor) {
      const seek = parseSeekUrl(anchor.getAttribute("href") || "");
      if (seek) return { seek, file: getMarkdownFileFromDomTarget(this.host, target) };
    }

    const directSeek = parseTimelineText(target?.textContent ?? "");
    if (directSeek && this.isLikelyTimelineTextTarget(target)) {
      return { seek: directSeek, file: getMarkdownFileFromDomTarget(this.host, target) };
    }

    const line = target?.closest?.(".cm-line, .HyperMD-list-line, li, p") as HTMLElement | null;
    const lineSeek = parseTimelineText(line?.textContent ?? "");
    if (lineSeek && this.isClickNearTimelineStart(event, line)) {
      return { seek: lineSeek, file: getMarkdownFileFromDomTarget(this.host, target) };
    }

    return null;
  }

  private consumeEvent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event as any).stopImmediatePropagation?.();
  }

  private isLikelyTimelineTextTarget(target: HTMLElement | null): boolean {
    if (!target) return false;
    const text = (target.textContent ?? "").trim();
    if (text.length <= 32 && parseTimelineText(text)) return true;
    return Boolean(target.closest?.(".cm-link, .cm-hmd-internal-link, .internal-link"));
  }

  private isClickNearTimelineStart(event: MouseEvent, line: HTMLElement | null): boolean {
    if (!line) return false;
    const rect = line.getBoundingClientRect?.();
    if (!rect || rect.width <= 0) return true;
    return event.clientX <= rect.left + Math.min(220, rect.width);
  }

  private extendEditorMenu(menu: any, editor: any, view: MarkdownView) {
    if (!view?.file || typeof editor?.getLine !== "function") return;
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : null;
    const lineNo = typeof cursor?.line === "number" ? cursor.line : 0;
    const line = String(editor.getLine(lineNo) ?? "");
    const seek =
      parseSeekUrl(line.match(/\]\(((?:#video-summary-seek|video-summary:\/\/seek)\?[^)]+)\)/)?.[1] ?? "") ??
      parseLegacyTimelineLine(line);
    if (!seek) return;
    menu.addSeparator();
    menu.addItem((item: any) => {
      item.setTitle("预览视频到此时间");
      item.setIcon?.("play-circle");
      item.onClick(() => void this.openForFile(view.file, seek));
    });
  }

  private async openForFile(file: TFile | null, seek: VideoSeekTarget, mode?: PlaybackMode) {
    let metadata = readVideoSummaryFrontmatter(this.host, file);
    if (!metadata && file) {
      const markdown = await this.host.app.vault.read(file);
      metadata = inferMetadataFromMarkdown(markdown);
    }
    if (!metadata?.mediaPath && !metadata?.mediaUrl && !metadata?.sourceUrl) {
      new Notice("当前笔记没有媒体路径或源视频链接。请先运行「补全当前视频总结的可点击时间轴」或重新生成视频总结。", 8000);
      return;
    }
    try {
      const modeKey = this.getPlaybackModeKey(file, metadata);
      const playbackMode = mode ?? this.playbackModeByNote.get(modeKey) ?? this.defaultPlaybackMode;
      const media = await this.resolveMedia(metadata, seek, playbackMode);
      this.rememberPlaybackMode(modeKey, media.mode);
      const view = await this.openPreviewView();
      view.show(metadata, media, seek, (mode) => void this.openForFile(file, seek, mode));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[video-timestamp-preview] open failed", error);
      new Notice(`视频预览打开失败：${message}`, 9000);
    }
  }

  private getPlaybackModeKey(file: TFile | null, metadata: VideoSummaryMetadata): string {
    return file?.path || metadata.videoId || metadata.sourceUrl || "__video-summary-current-note__";
  }

  private rememberPlaybackMode(key: string, mode: PlaybackMode) {
    this.playbackModeByNote.set(key, mode);
    this.defaultPlaybackMode = mode;
  }

  private async resolveMedia(metadata: VideoSummaryMetadata, seek: VideoSeekTarget, mode: PlaybackMode): Promise<ResolvedMedia> {
    const errors: string[] = [];
    if (mode === "online") {
      const online = this.resolveOnlineMedia(metadata, seek);
      if (online) return online;
    }
    const fallbackMode: PlaybackMode = mode === "online" ? "local" : mode;
    const preferredVaultMedia = await this.resolvePreferredVaultMedia(metadata, fallbackMode);
    if (preferredVaultMedia) return preferredVaultMedia;
    if (metadata.mediaPath) {
      try {
        return await this.resolveLocalMedia(metadata.mediaPath, fallbackMode);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    const online = this.resolveOnlineMedia(metadata, seek);
    if (online) return online;
    throw new Error(errors[0] || "当前笔记没有可播放的本地、云端媒体地址，源站也不支持内嵌预览");
  }

  private resolveOnlineMedia(metadata: VideoSummaryMetadata, seek: VideoSeekTarget): ResolvedMedia | null {
    if (metadata.mediaUrl) {
      return { src: metadata.mediaUrl, copied: false, source: "cloud", mode: "online" };
    }
    const embedUrl = buildOnlineEmbedUrl(metadata.sourceUrl, metadata.platform, seek.start);
    if (embedUrl) {
      return { src: embedUrl, copied: false, source: "embed", mode: "online" };
    }
    return null;
  }

  private async resolvePreferredVaultMedia(metadata: VideoSummaryMetadata, mode: PlaybackMode): Promise<ResolvedMedia | null> {
    const adapter = this.host.app.vault.adapter as any;
    for (const candidate of buildVideoSummaryMediaCandidates(
      metadata.videoId,
      metadata.mediaPath,
      metadata.platform,
      this.getMediaLibraryPath()
    )) {
      if (candidate.startsWith("/")) {
        try {
          return await this.resolveLocalMedia(candidate, mode);
        } catch {
          continue;
        }
      }
      if (typeof adapter?.exists === "function" && await adapter.exists(candidate)) {
        return { src: this.getVaultResourcePath(candidate), vaultPath: candidate, copied: false, source: "local", mode };
      }
    }
    return null;
  }

  private async resolveLocalMedia(mediaPath: string, mode: PlaybackMode): Promise<ResolvedMedia> {
    if (/^(https?:|app:|file:)/i.test(mediaPath)) {
      return { src: mediaPath, copied: false, source: /^https?:/i.test(mediaPath) ? "cloud" : "local", mode };
    }

    const adapter = this.host.app.vault.adapter as any;
    const basePath = typeof adapter.getBasePath === "function" ? String(adapter.getBasePath()).replace(/\\/g, "/") : "";
    const normalizedMediaPath = mediaPath.replace(/\\/g, "/");
    if (basePath && normalizedMediaPath.startsWith(`${basePath}/`)) {
      const relative = normalizedMediaPath.slice(basePath.length + 1);
      if (!(await adapter.exists(relative))) throw new Error(`找不到 vault 内媒体文件：${relative}`);
      return { src: this.getVaultResourcePath(relative), vaultPath: relative, copied: false, source: "local", mode };
    }

    if (!normalizedMediaPath.startsWith("/")) {
      if (!(await adapter.exists(normalizedMediaPath))) throw new Error(`找不到 vault 内媒体文件：${normalizedMediaPath}`);
      return { src: this.getVaultResourcePath(normalizedMediaPath), vaultPath: normalizedMediaPath, copied: false, source: "local", mode };
    }

    return { src: await this.getExternalLocalMediaUrl(normalizedMediaPath), copied: false, source: "local", mode };
  }

  private async getExternalLocalMediaUrl(mediaPath: string): Promise<string> {
    const req = getNodeRequire();
    if (!req) return absolutePathToFileUrl(mediaPath);
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");
    const resolvedPath = path.resolve(mediaPath);
    let stat: import("fs").Stats;
    try {
      stat = fs.statSync(resolvedPath);
    } catch {
      throw new Error(`找不到本地媒体文件：${mediaPath}`);
    }
    if (!stat.isFile()) throw new Error(`本地媒体路径不是文件：${mediaPath}`);
    await this.ensureLocalMediaServer(req);
    let token = this.localMediaPathTokens.get(resolvedPath);
    if (!token) {
      const crypto = req("crypto") as typeof import("crypto");
      token = crypto.randomBytes(18).toString("base64url");
      this.localMediaPathTokens.set(resolvedPath, token);
      this.localMediaTokenPaths.set(token, resolvedPath);
    }
    return `http://127.0.0.1:${this.localMediaPort}/${encodeURIComponent(token)}/${encodeURIComponent(path.basename(resolvedPath))}`;
  }

  private async ensureLocalMediaServer(req: (id: string) => any): Promise<void> {
    if (this.localMediaServer && this.localMediaPort > 0) return;
    if (this.localMediaServerStarting) {
      await this.localMediaServerStarting;
      return;
    }
    this.localMediaServerStarting = new Promise((resolve, reject) => {
      const http = req("http") as typeof import("http");
      const server = http.createServer((request, response) => {
        this.handleLocalMediaRequest(req, request, response);
      });
      const onError = (error: Error) => {
        this.localMediaServerStarting = null;
        reject(error);
      };
      server.once("error", onError);
      server.listen(0, "127.0.0.1", () => {
        server.off?.("error", onError);
        const address = server.address();
        if (!address || typeof address === "string") {
          try {
            server.close();
          } catch {
            // ignore
          }
          this.localMediaServerStarting = null;
          reject(new Error("本地媒体播放通道启动失败"));
          return;
        }
        this.localMediaServer = server;
        this.localMediaPort = address.port;
        server.unref?.();
        this.localMediaServerStarting = null;
        resolve();
      });
    });
    await this.localMediaServerStarting;
  }

  private handleLocalMediaRequest(req: (id: string) => any, request: any, response: any) {
    const method = String(request.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    let mediaPath = "";
    try {
      const parsed = new URL(String(request.url || "/"), "http://127.0.0.1");
      const token = decodeURIComponent(parsed.pathname.split("/").filter(Boolean)[0] || "");
      mediaPath = this.localMediaTokenPaths.get(token) || "";
    } catch {
      mediaPath = "";
    }
    if (!mediaPath) {
      response.writeHead(404);
      response.end();
      return;
    }

    const fs = req("fs") as typeof import("fs");
    let stat: import("fs").Stats;
    try {
      stat = fs.statSync(mediaPath);
    } catch {
      response.writeHead(404);
      response.end();
      return;
    }
    if (!stat.isFile()) {
      response.writeHead(404);
      response.end();
      return;
    }

    const size = stat.size;
    const contentType = this.contentTypeForMediaPath(mediaPath);
    const baseHeaders: Record<string, string | number> = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    };
    const range = String(request.headers?.range || "");
    const rangeMatch = range.match(/^bytes=(\d*)-(\d*)$/);
    if (rangeMatch) {
      const start = rangeMatch[1] ? Number(rangeMatch[1]) : 0;
      const end = rangeMatch[2] ? Number(rangeMatch[2]) : size - 1;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
        response.writeHead(416, { ...baseHeaders, "Content-Range": `bytes */${size}` });
        response.end();
        return;
      }
      const safeEnd = Math.min(end, size - 1);
      response.writeHead(206, {
        ...baseHeaders,
        "Content-Length": safeEnd - start + 1,
        "Content-Range": `bytes ${start}-${safeEnd}/${size}`,
      });
      if (method === "HEAD") {
        response.end();
        return;
      }
      this.pipeMediaFile(fs, mediaPath, response, start, safeEnd);
      return;
    }

    response.writeHead(200, {
      ...baseHeaders,
      "Content-Length": size,
    });
    if (method === "HEAD") {
      response.end();
      return;
    }
    this.pipeMediaFile(fs, mediaPath, response);
  }

  private pipeMediaFile(fs: typeof import("fs"), mediaPath: string, response: any, start?: number, end?: number) {
    const stream = fs.createReadStream(mediaPath, typeof start === "number" ? { start, end } : undefined);
    stream.on("error", () => {
      try {
        response.destroy();
      } catch {
        // ignore
      }
    });
    stream.pipe(response);
  }

  private contentTypeForMediaPath(mediaPath: string): string {
    const ext = mediaPath.toLowerCase().split(".").pop() || "";
    if (ext === "mp4" || ext === "m4v") return "video/mp4";
    if (ext === "webm") return "video/webm";
    if (ext === "mov") return "video/quicktime";
    if (ext === "mp3") return "audio/mpeg";
    if (ext === "m4a" || ext === "aac") return "audio/aac";
    if (ext === "wav") return "audio/wav";
    if (ext === "ogg") return "audio/ogg";
    return "application/octet-stream";
  }

  private stopLocalMediaServer() {
    const server = this.localMediaServer;
    this.localMediaServer = null;
    this.localMediaServerStarting = null;
    this.localMediaPort = 0;
    this.localMediaPathTokens.clear();
    this.localMediaTokenPaths.clear();
    if (!server) return;
    try {
      server.close();
    } catch {
      // ignore
    }
  }

  private getMediaLibraryPath(): string {
    try {
      const settings = (this.host.component as any)?.getVideoSummarySettings?.();
      return typeof settings?.mediaLibraryPath === "string" ? settings.mediaLibraryPath.trim() : "";
    } catch {
      return "";
    }
  }

  private getVaultResourcePath(vaultPath: string): string {
    const file = this.host.app.vault.getAbstractFileByPath(vaultPath);
    if (file instanceof TFile) {
      return this.host.app.vault.getResourcePath(file);
    }
    const adapter = this.host.app.vault.adapter as any;
    if (typeof adapter.getResourcePath === "function") {
      return adapter.getResourcePath(vaultPath);
    }
    throw new Error(`找不到 vault 内媒体文件：${vaultPath}`);
  }

  private async openPreviewView(): Promise<VideoTimestampPreviewView> {
    const workspace = this.host.app.workspace as any;
    let leaf = workspace.getLeavesOfType?.(VIEW_TYPE)?.[0] ?? null;
    if (!leaf) {
      leaf = workspace.getRightLeaf?.(true) ?? workspace.getLeaf?.("split", "vertical") ?? workspace.getLeaf?.(true);
      await leaf?.setViewState?.({ type: VIEW_TYPE, active: true });
    }
    if (!leaf?.view || leaf.view.getViewType?.() !== VIEW_TYPE) {
      throw new Error("视频预览侧边栏打开失败");
    }
    workspace.revealLeaf?.(leaf);
    return leaf.view as VideoTimestampPreviewView;
  }

  private async convertCurrentNote() {
    const file = getActiveMarkdownFile(this.host);
    if (!file) {
      new Notice("请先打开一个视频总结笔记。");
      return;
    }
    const original = await this.host.app.vault.read(file);
    const metadata = readVideoSummaryFrontmatter(this.host, file) ?? inferMetadataFromMarkdown(original);
    const converted = ensureFrontmatter(convertLegacyTimelineMarkdown(original), metadata);
    if (converted === original) {
      new Notice("当前笔记没有需要转换的时间轴，或已经是可点击格式。");
      return;
    }
    await this.host.app.vault.modify(file, converted);
    new Notice("已补全当前视频总结的可点击时间轴。");
  }
}

export const videoTimestampPreviewModule: EmbeddedSubModule = {
  id: "video-timestamp-preview",
  displayName: "视频时间轴预览",
  description: "点击视频总结里的时间轴，在 Obsidian 内预览本地或云端视频缓存",
  defaultEnabled: true,
  async load(host) {
    const runner = new VideoTimestampPreviewRunner(host);
    await runner.start();
  },
};
