/**
 * 指向链接增强（block-link-plus）内嵌模块。
 * 原插件 main.js 整包拷贝在 block-link-plus.bundle.js，本文件不修改原 bundle。
 */

import { App, Editor, MarkdownView, Plugin, TFile } from "obsidian";

import { installBlockLinkHostLayer } from "./block-link-plus-host";
import { createObsidianModuleResolver, ensureObsidianRequireBinding } from "./node-bridge";
import { EmbeddedSubModule, SubPluginHost } from "./sub-plugin-host";
import {
  BLOCK_LINK_PLUS_VIEW_TYPES,
  releaseBlockLinkPlusViewTypes,
} from "./block-link-plus-view-registry";

const BLOCK_LINK_PLUS_ID = "block-link-plus";

const CODEMIRROR_PRIME_IDS = [
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/commands",
  "@codemirror/language",
  "@codemirror/search",
  "@codemirror/autocomplete",
  "@codemirror/lint",
] as const;

const NODE_PRIME_IDS = ["crypto"] as const;

/** 标记内嵌实例，避免与「同名外部插件已加载」检测混淆 */
export const FDTB_EMBEDDED_PLUGIN_MARK = Symbol.for("feishu-doc-toolbar.embeddedSubPlugin");

const ENABLED_PLUGINS_HAS_PATCH = Symbol.for("feishu-doc-toolbar.blpEnabledPluginsHasPatch");

type BlockLinkPlusInstance = Plugin & {
  [FDTB_EMBEDDED_PLUGIN_MARK]?: boolean;
  _blpLastContextMenuLine?: number;
  settings?: {
    hideStandaloneBlockIdLines?: boolean;
    hideInlineTrailingBlockIds?: boolean;
    protectBlockIdAnchors?: boolean;
  };
};

const INLINE_TRAILING_BLOCK_ID_IN_TEXT_RE = /\s+\^[a-zA-Z0-9-]{3,7}$/;

function shouldHideInlineTrailingBlockIds(instance: BlockLinkPlusInstance): boolean {
  return instance.settings?.hideInlineTrailingBlockIds !== false;
}

/** 段末 ^id：编辑区用 cm-blockid 样式，阅读视图用后处理器去掉尾部显示 */
function installHideInlineTrailingBlockIds(host: SubPluginHost, instance: BlockLinkPlusInstance): void {
  const syncBodyClass = () => {
    if (typeof document?.body?.classList?.toggle !== "function") return;
    document.body.classList.toggle("fdtb-hide-inline-block-ids", shouldHideInlineTrailingBlockIds(instance));
  };
  syncBodyClass();
  host.register(() => {
    document.body?.classList?.remove?.("fdtb-hide-inline-block-ids");
  });

  host.registerMarkdownPostProcessor((el) => {
    if (!shouldHideInlineTrailingBlockIds(instance)) return;
    const root = el.closest(".markdown-preview-view, .markdown-reading-view");
    if (!root) return;

    for (const block of el.querySelectorAll("p, li, td")) {
      const last = block.lastChild;
      if (!last || last.nodeType !== Node.TEXT_NODE) continue;
      const text = last.textContent ?? "";
      const trimmed = text.replace(/\u200b/g, "");
      const match = trimmed.match(INLINE_TRAILING_BLOCK_ID_IN_TEXT_RE);
      if (!match) continue;
      last.textContent = trimmed.slice(0, trimmed.length - match[0].length);
    }
  });
}

type EditorWithCm = Editor & {
  cm?: {
    posAtCoords: (coords: { left: number; top: number }) => number | null;
    state: { doc: { lineAt: (offset: number) => { number: number } } };
  };
  offsetToPos?: (offset: number) => { line: number; ch: number };
};

const BLOCK_LINK_PLUS_MANIFEST = {
  id: BLOCK_LINK_PLUS_ID,
  name: "指向链接增强",
  version: "1.0.0",
  minAppVersion: "1.5.0",
  description: "Create short block and folder links that open targets in the Obsidian file tree.",
  author: "lishu",
  isDesktopOnly: false,
} as const;

type BlockLinkPlusConstructor = new (app: App, manifest: Plugin["manifest"]) => Plugin;

type FdtbBlpLangStore = Map<string, string>;

declare global {
  interface Window {
    __FDTB_BLP_LANG__?: FdtbBlpLangStore;
  }
}

/** bundle 内 i18n 求值阶段读语言键；用插件私有 Map，不触碰 window.localStorage */
function ensureBundleRuntimeGlobals(): void {
  if (typeof window === "undefined") return;
  if (window.__FDTB_BLP_LANG__) return;
  window.__FDTB_BLP_LANG__ = new Map();
}

function obsidianRequire(id: string): unknown {
  ensureObsidianRequireBinding();
  return createObsidianModuleResolver()(id);
}

/** 启动内嵌前卸掉同名外部插件实例，避免 registerView / enabledPlugins 冲突 */
export async function evictStandaloneBlockLinkPlus(app: App): Promise<void> {
  const pluginManager = (app as any)?.plugins;
  if (!pluginManager) return;

  const existing = pluginManager.plugins?.[BLOCK_LINK_PLUS_ID] as BlockLinkPlusInstance | undefined;
  if (existing && existing[FDTB_EMBEDDED_PLUGIN_MARK] !== true) {
    releaseBlockLinkPlusViewTypes(app, existing);
    try {
      const runner = existing as Plugin & { unload?: () => void | Promise<void> };
      if (typeof runner.unload === "function") await runner.unload();
      else if (typeof runner.onunload === "function") await runner.onunload();
    } catch (error) {
      console.warn("[feishu-doc-toolbar] 卸载外部 block-link-plus 失败", error);
    }
    releaseBlockLinkPlusViewTypes(app);
    if (pluginManager.plugins?.[BLOCK_LINK_PLUS_ID] === existing) {
      delete pluginManager.plugins[BLOCK_LINK_PLUS_ID];
    }
  }

  const enabledSet = pluginManager.enabledPlugins as Set<string> | undefined;
  if (enabledSet?.has?.(BLOCK_LINK_PLUS_ID)) {
    try {
      if (typeof pluginManager.disablePluginAndSave === "function") {
        await pluginManager.disablePluginAndSave(BLOCK_LINK_PLUS_ID);
      } else if (typeof pluginManager.disablePlugin === "function") {
        await pluginManager.disablePlugin(BLOCK_LINK_PLUS_ID);
      } else {
        enabledSet.delete(BLOCK_LINK_PLUS_ID);
      }
    } catch (error) {
      console.warn("[feishu-doc-toolbar] 关闭外部 block-link-plus 开关失败", error);
      try {
        enabledSet.delete(BLOCK_LINK_PLUS_ID);
      } catch {
        // ignore
      }
    }
  }
}

/** 内联 bundle 求值前预热 Obsidian 白名单模块（CM + crypto 等） */
function primeObsidianRuntimeModules(): void {
  for (const id of CODEMIRROR_PRIME_IDS) {
    try {
      obsidianRequire(id);
    } catch {
      // 非 Obsidian 测试环境可能没有白名单 require
    }
  }
  try {
    const state = obsidianRequire("@codemirror/state") as {
      EditorState?: { transactionFilter?: unknown };
    };
    if (!state?.EditorState?.transactionFilter) {
      console.warn("[feishu-doc-toolbar] @codemirror/state 缺少 EditorState.transactionFilter，继续尝试加载 bundle");
    }
    const view = obsidianRequire("@codemirror/view") as { lineNumbers?: unknown };
    if (typeof view?.lineNumbers !== "function") {
      console.warn("[feishu-doc-toolbar] @codemirror/view 缺少 lineNumbers，继续尝试加载 bundle");
    }
  } catch (error) {
    console.warn("[feishu-doc-toolbar] CodeMirror 预热失败，继续尝试加载 bundle", error);
  }

  for (const id of NODE_PRIME_IDS) {
    try {
      obsidianRequire(id);
    } catch {
      // Obsidian 桌面端经 window.require 注入
    }
  }
}

function getBlockLinkPlusClass(): BlockLinkPlusConstructor {
  ensureBundleRuntimeGlobals();
  ensureObsidianRequireBinding();
  primeObsidianRuntimeModules();
  // 延迟加载；esbuild 将 bundle 内联为 require_block_link_plus_bundle()（不可外置兄弟文件）
  const bundle = require("./block-link-plus.bundle.js") as
    | BlockLinkPlusConstructor
    | { default: BlockLinkPlusConstructor };
  const ctor =
    typeof bundle === "function"
      ? bundle
      : bundle?.default;
  if (!ctor) {
    throw new Error("block-link-plus.bundle.js 未导出 default 插件类");
  }
  return ctor;
}

let activeRunner: Plugin | null = null;

export function getEmbeddedBlockLinkPlusInstance(): Plugin | null {
  return activeRunner;
}

function attachHostDelegates(instance: Plugin, host: SubPluginHost): void {
  const target = instance as Plugin & Record<string, unknown>;
  target.addCommand = host.addCommand.bind(host);
  target.registerEvent = host.registerEvent.bind(host);
  target.registerDomEvent = host.registerDomEvent.bind(host);
  target.registerInterval = host.registerInterval.bind(host);
  target.register = host.register.bind(host);
  target.registerMarkdownPostProcessor = host.registerMarkdownPostProcessor.bind(host);
  target.registerMarkdownCodeBlockProcessor = host.registerMarkdownCodeBlockProcessor.bind(host);
  target.registerEditorExtension = host.registerEditorExtension.bind(host);
  target.registerObsidianProtocolHandler = host.registerObsidianProtocolHandler.bind(host);
  target.registerView = host.registerView.bind(host);
  target.unregisterView = host.unregisterView.bind(host);
  target.loadData = host.loadData.bind(host);
  target.saveData = host.saveData.bind(host);
  target.addSettingTab = host.addSettingTab.bind(host);
  target.addRibbonIcon = host.addRibbonIcon.bind(host);
  target.addStatusBarItem = host.addStatusBarItem.bind(host);
  // addChild 保留在 BLP 实例上，便于 Component.load/unload 正确管理子树
}

async function migrateLegacyPluginData(host: SubPluginHost): Promise<void> {
  const current = await host.loadData();
  if (current && typeof current === "object" && Object.keys(current as object).length > 0) {
    return;
  }

  const legacyPath = `${host.app.vault.configDir}/plugins/${BLOCK_LINK_PLUS_ID}/data.json`;
  try {
    if (!(await host.app.vault.adapter.exists(legacyPath))) return;
    const raw = await host.app.vault.adapter.read(legacyPath);
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      await host.saveData(parsed);
    }
  } catch (error) {
    console.warn("[feishu-doc-toolbar] block-link-plus legacy data migration skipped", error);
  }
}

/** 内嵌版不走 PluginManager，需让 bundle 内 blpIsPluginEnabled 能识别已启用 */
function patchEnabledPluginsForEmbedded(app: App, instance: BlockLinkPlusInstance): void {
  const enabled = app.plugins.enabledPlugins;
  if (!enabled || typeof enabled.has !== "function") return;

  try {
    enabled.add?.(BLOCK_LINK_PLUS_ID);
  } catch {
    // ignore — 部分环境 enabledPlugins 不可变
  }

  const store = enabled as Set<string> & {
    [ENABLED_PLUGINS_HAS_PATCH]?: (id: string) => boolean;
  };
  if (store[ENABLED_PLUGINS_HAS_PATCH]) return;

  const originalHas = enabled.has.bind(enabled);
  store[ENABLED_PLUGINS_HAS_PATCH] = originalHas;
  enabled.has = (id: string) => {
    if (id === BLOCK_LINK_PLUS_ID) {
      const plugins = app.plugins.plugins as Record<string, Plugin | undefined>;
      const current = plugins[BLOCK_LINK_PLUS_ID];
      if (
        current === instance &&
        (current as BlockLinkPlusInstance)[FDTB_EMBEDDED_PLUGIN_MARK] === true
      ) {
        return true;
      }
    }
    return originalHas(id);
  };
}

function restoreEnabledPluginsPatch(app: App): void {
  const enabled = app.plugins.enabledPlugins as Set<string> & {
    [ENABLED_PLUGINS_HAS_PATCH]?: (id: string) => boolean;
  };
  const originalHas = enabled?.[ENABLED_PLUGINS_HAS_PATCH];
  if (!originalHas) return;
  enabled.has = originalHas.bind(enabled);
  delete enabled[ENABLED_PLUGINS_HAS_PATCH];
}

function resolveLineFromDomTarget(target: HTMLElement): number | null {
  const dataLineEl = target.closest("[data-line]");
  if (dataLineEl) {
    const parsed = parseInt(dataLineEl.getAttribute("data-line") ?? "", 10);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }

  const cmLine = target.closest(".cm-line");
  if (cmLine?.parentElement) {
    const lines = cmLine.parentElement.querySelectorAll(":scope > .cm-line");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === cmLine) return i;
    }
  }

  return null;
}

function resolveEditorLineFromContextMenu(view: MarkdownView, evt: MouseEvent): number | null {
  const target = evt.target instanceof HTMLElement ? evt.target : null;
  if (!target) return null;

  const fromDom = resolveLineFromDomTarget(target);
  if (fromDom != null) return fromDom;

  const editor = view.editor as EditorWithCm;
  const cm = editor?.cm;
  if (cm && typeof cm.posAtCoords === "function") {
    try {
      const offset = cm.posAtCoords({ left: evt.clientX, top: evt.clientY });
      if (offset != null && Number.isFinite(offset)) {
        const line = cm.state.doc.lineAt(offset).number - 1;
        if (Number.isFinite(line) && line >= 0) return line;
      }
    } catch {
      // posAtCoords 在图片/表格 widget 上常失败
    }
  }

  return null;
}

/**
 * BLP bundle 在 capture 阶段用 editor.posAtCoords；CM6 对 widget 会回退到第 0 行。
 * 在 bubble 阶段用 DOM / cm.posAtCoords 纠正 _blpLastContextMenuLine。
 */
const TRAILING_BLOCK_ID_RE = /\^([a-zA-Z0-9-]+)/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Obsidian 常无法索引表格末格内联 ^id；点击块链接时回退到源码行定位 */
async function openInlineBlockRefFallback(
  app: App,
  filePath: string,
  blockId: string
): Promise<boolean> {
  const file = app.vault.getAbstractFileByPath(filePath);
  if (!(file instanceof TFile)) return false;

  const content = await app.vault.read(file);
  const lines = content.split("\n");
  const pattern = new RegExp(`\\^${escapeRegExp(blockId)}(?=\\s|$|\\|)`);

  for (let line = 0; line < lines.length; line++) {
    if (!pattern.test(lines[line])) continue;
    const leaf = app.workspace.getLeaf(false);
    await leaf.openFile(file);
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    const editor = view?.editor;
    if (editor) {
      editor.setCursor({ line, ch: 0 });
      editor.scrollIntoView(
        { from: { line, ch: 0 }, to: { line, ch: Math.max(0, lines[line].length - 1) } },
        true
      );
    }
    return true;
  }
  return false;
}

function parseBlockIdFromInternalHref(href: string): { linkPath: string; blockId: string } | null {
  const decoded = decodeURIComponent(href.replace(/^\//, ""));
  const hashIndex = decoded.indexOf("#");
  const linkPath = (hashIndex >= 0 ? decoded.slice(0, hashIndex) : decoded).trim();
  const hash = hashIndex >= 0 ? decoded.slice(hashIndex + 1) : "";
  const blockMatch = (hash.match(TRAILING_BLOCK_ID_RE) ?? decoded.match(TRAILING_BLOCK_ID_RE));
  if (!blockMatch) return null;
  return { linkPath, blockId: blockMatch[1] };
}

function blockExistsInMetadataCache(app: App, filePath: string, blockId: string): boolean {
  const cache = app.metadataCache.getCache(filePath);
  if (!cache?.blocks) return false;
  return Object.values(cache.blocks).some((block) => block.id === blockId);
}

function installInlineTableBlockRefClickFix(host: SubPluginHost): void {
  host.registerDomEvent(
    document,
    "click",
    (evt: MouseEvent) => {
      void (async () => {
        const target = evt.target;
        if (!(target instanceof HTMLElement)) return;
        const linkEl = target.closest("a.internal-link, a.tag");
        if (!(linkEl instanceof HTMLAnchorElement)) return;

        const href = linkEl.getAttribute("href") ?? linkEl.getAttribute("data-href") ?? "";
        if (!href.includes("^") && !href.includes("%5E")) return;

        const parsed = parseBlockIdFromInternalHref(href);
        if (!parsed) return;

        let destPath = parsed.linkPath;
        if (!destPath) {
          const active = host.app.workspace.getActiveFile();
          if (!active) return;
          destPath = active.path;
        }

        const dest = host.app.metadataCache.getFirstLinkpathDest(destPath, "");
        if (!dest) return;
        if (blockExistsInMetadataCache(host.app, dest.path, parsed.blockId)) return;

        const opened = await openInlineBlockRefFallback(host.app, dest.path, parsed.blockId);
        if (!opened) return;

        evt.preventDefault();
        evt.stopPropagation();
      })();
    },
    true
  );
}

function installContextMenuLineCaptureFix(host: SubPluginHost, instance: BlockLinkPlusInstance): void {
  host.registerDomEvent(document, "contextmenu", (evt: MouseEvent) => {
    const view = host.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) return;
    const target = evt.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.closest(".markdown-source-view, .markdown-reading-view, .cm-editor, .cm-content")) {
      return;
    }
    const line = resolveEditorLineFromContextMenu(view, evt);
    if (line != null) {
      instance._blpLastContextMenuLine = line;
    }
  });
}

function installPluginShim(app: App, instance: BlockLinkPlusInstance): void {
  const plugins = app.plugins.plugins as Record<string, Plugin | undefined>;
  plugins[BLOCK_LINK_PLUS_ID] = instance;
  patchEnabledPluginsForEmbedded(app, instance);
}

function uninstallPluginShim(app: App, instance: Plugin | null): void {
  if (!instance) return;
  const plugins = app.plugins.plugins as Record<string, Plugin | undefined>;
  if (plugins[BLOCK_LINK_PLUS_ID] === instance) {
    delete plugins[BLOCK_LINK_PLUS_ID];
  }
  restoreEnabledPluginsPatch(app);
  const enabled = app.plugins.enabledPlugins;
  if (
    enabled &&
    typeof enabled.has === "function" &&
    enabled.has(BLOCK_LINK_PLUS_ID) &&
    typeof enabled.delete === "function"
  ) {
    try {
      enabled.delete(BLOCK_LINK_PLUS_ID);
    } catch {
      // ignore
    }
  }
  if ((window as Window & { BlockLinkPlus?: unknown }).BlockLinkPlus === instance) {
    delete (window as Window & { BlockLinkPlus?: unknown }).BlockLinkPlus;
  }
}

function unregisterBlockLinkPlusViews(host: SubPluginHost): void {
  releaseBlockLinkPlusViewTypes(host.app, host.component);
  for (const viewType of BLOCK_LINK_PLUS_VIEW_TYPES) {
    try {
      host.unregisterView(viewType);
    } catch (error) {
      console.warn(`[feishu-doc-toolbar] unregisterView ${viewType} skipped`, error);
    }
  }
}

async function teardownStaleEmbeddedBlockLinkPlus(host: SubPluginHost): Promise<void> {
  const prev = activeRunner;
  if (prev) {
    unregisterBlockLinkPlusViews(host);
    uninstallPluginShim(host.app, prev);
    try {
      const runner = prev as Plugin & { unload?: () => void | Promise<void> };
      if (typeof runner.unload === "function") await runner.unload();
      else if (typeof runner.onunload === "function") await runner.onunload();
    } catch (error) {
      console.warn("[feishu-doc-toolbar] 清理上次内嵌 block-link-plus 失败", error);
    }
    if (activeRunner === prev) activeRunner = null;
  } else {
    releaseBlockLinkPlusViewTypes(host.app, host.component);
  }
}

export const blockLinkPlusModule: EmbeddedSubModule = {
  id: BLOCK_LINK_PLUS_ID,
  displayName: "指向链接增强",
  description:
    "段落链接与文件夹链接均生成超短链接（^块ID / blp-folder://open?id=）；点击文件夹链接可在文件树定位并自定义高亮时长",
  defaultEnabled: true,
  replacesExternalPluginId: BLOCK_LINK_PLUS_ID,
  async load(host) {
    ensureObsidianRequireBinding();
    await teardownStaleEmbeddedBlockLinkPlus(host);
    await evictStandaloneBlockLinkPlus(host.app);
    releaseBlockLinkPlusViewTypes(host.app, host.component);
    await migrateLegacyPluginData(host);
    unregisterBlockLinkPlusViews(host);
    let BlockLinkPlusClass: BlockLinkPlusConstructor;
    try {
      BlockLinkPlusClass = getBlockLinkPlusClass();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`加载指向链接代码包失败: ${message}`);
    }
    const instance = new BlockLinkPlusClass(host.app, BLOCK_LINK_PLUS_MANIFEST) as BlockLinkPlusInstance;
    instance.manifest = { ...BLOCK_LINK_PLUS_MANIFEST };
    instance[FDTB_EMBEDDED_PLUGIN_MARK] = true;
    attachHostDelegates(instance, host);
    activeRunner = instance;
    installPluginShim(host.app, instance);
    host.register(() => {
      unregisterBlockLinkPlusViews(host);
      uninstallPluginShim(host.app, instance);
      if (activeRunner === instance) activeRunner = null;
      void (async () => {
        try {
          const runner = instance as Plugin & { unload?: () => void | Promise<void> };
          if (typeof runner.unload === "function") await runner.unload();
        } catch (error) {
          console.warn("[feishu-doc-toolbar] block-link-plus unload failed", error);
        }
      })();
    });
    try {
      const runner = instance as Plugin & {
        load?: () => void | Promise<void>;
        onload?: () => void | Promise<void>;
      };
      if (typeof runner.load === "function") {
        await runner.load();
      } else {
        await runner.onload?.();
      }
      installBlockLinkHostLayer(host, instance);
      installContextMenuLineCaptureFix(host, instance);
      installInlineTableBlockRefClickFix(host);
      installHideInlineTrailingBlockIds(host, instance);
    } catch (error) {
      uninstallPluginShim(host.app, instance);
      unregisterBlockLinkPlusViews(host);
      activeRunner = null;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`指向链接增强 onload 失败: ${message}`);
    }
  },
};
