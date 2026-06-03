/**
 * 内嵌 block-link-plus 的宿主层 UX：统一右键菜单、块 ID 隐藏/保护、命令与 API 增强。
 * 不替代 bundle 核心复制逻辑；不改 vault data.json 用户字段（仅 BLP 模块 settings 经用户保存）。
 */

import { App, Editor, MarkdownView, Menu, Notice, Plugin, TFolder } from "obsidian";

import { getEmbeddedBlockLinkPlusInstance } from "./block-link-plus-embedded";
import { SubPluginHost } from "./sub-plugin-host";

export const FDTB_UNIFIED_LINK_MENU_MARK = Symbol.for("feishu-doc-toolbar.unifiedLinkMenu");

const ALLOW_ANCHOR_EDIT_FLAG = Symbol.for("feishu-doc-toolbar.allowBlockAnchorEdit");
const REVEAL_BLOCK_IDS_BODY_CLASS = "fdtb-reveal-block-ids";

const STANDALONE_BLOCK_ID_LINE_RE = /^\^[a-zA-Z0-9-]{3,7}\s*$/;
const INLINE_TRAILING_BLOCK_ID_RE = /\s+\^[a-zA-Z0-9-]{3,7}$/;
const INLINE_TRAILING_BLOCK_ID_CAPTURE_RE = /(\s+\^[a-zA-Z0-9-]{3,7})$/;

const FOLDER_DUAL_LINK_MENU_MARK = "__fdtbFolderDualLinkMenu";
export const FOLDER_DUAL_LINK_MENU_TITLE = "复制文件夹超短双链";

type BlockLinkMenuApi = {
  appendEditorLinkMenuItems: (
    menu: Menu,
    editor: Editor,
    view: MarkdownView,
    opts?: { preferLine?: number; preferEndLine?: number; suppressFailureHints?: boolean }
  ) => boolean;
  copyFolderDualLink?: (folder: TFolder) => Promise<void>;
};

export type BlockLinkPlusHostInstance = Plugin & {
  _blpLastContextMenuLine?: number;
  settings?: {
    enable_right_click_block?: boolean;
    enable_right_click_embed?: boolean;
    enable_right_click_url?: boolean;
    protectBlockIdAnchors?: boolean;
    hideStandaloneBlockIdLines?: boolean;
    hideInlineTrailingBlockIds?: boolean;
  };
  api?: BlockLinkMenuApi;
};

function getCmStateModule(): {
  EditorState: {
    transactionFilter: {
      of: (fn: (tr: TransactionLike) => TransactionLike | readonly TransactionLike[]) => unknown;
    };
  };
} | null {
  try {
    const req = (globalThis as { require?: (id: string) => unknown }).require;
    if (typeof req !== "function") return null;
    return req("@codemirror/state") as ReturnType<typeof getCmStateModule>;
  } catch {
    return null;
  }
}

type TransactionLike = {
  docChanged: boolean;
  isUserEvent: (type: string) => boolean;
  startState: { doc: DocLike };
  state: { doc: DocLike };
};

type DocLike = {
  lines: number;
  line: (n: number) => { text: string };
};

function normalizeLineText(text: string): string {
  return text.replace(/\u200b/g, "");
}

function countStandaloneBlockIdLines(doc: DocLike): number {
  let count = 0;
  for (let i = 1; i <= doc.lines; i++) {
    const text = normalizeLineText(doc.line(i).text).trim();
    if (STANDALONE_BLOCK_ID_LINE_RE.test(text)) count += 1;
  }
  return count;
}

function trailingBlockIdsInDoc(doc: DocLike): string[] {
  const ids: string[] = [];
  for (let i = 1; i <= doc.lines; i++) {
    const match = normalizeLineText(doc.line(i).text).match(INLINE_TRAILING_BLOCK_ID_RE);
    if (match) ids.push(match[0].trim());
  }
  return ids;
}

function isAnchorEditAllowed(): boolean {
  return !!(globalThis as Record<symbol, unknown>)[ALLOW_ANCHOR_EDIT_FLAG];
}

export function runWithAnchorEditAllowed<T>(fn: () => T): T {
  const bag = globalThis as Record<symbol, unknown>;
  bag[ALLOW_ANCHOR_EDIT_FLAG] = true;
  try {
    return fn();
  } finally {
    delete bag[ALLOW_ANCHOR_EDIT_FLAG];
  }
}

function transactionWouldDamageBlockAnchors(tr: TransactionLike): boolean {
  if (isAnchorEditAllowed()) return false;
  if (!tr.docChanged) return false;
  if (!tr.isUserEvent("delete") && !tr.isUserEvent("input") && !tr.isUserEvent("cut")) {
    return false;
  }

  const oldDoc = tr.startState.doc;
  const newDoc = tr.state.doc;

  if (countStandaloneBlockIdLines(newDoc) < countStandaloneBlockIdLines(oldDoc)) {
    return true;
  }

  const oldTrailing = trailingBlockIdsInDoc(oldDoc);
  const newTrailing = trailingBlockIdsInDoc(newDoc);
  for (const id of oldTrailing) {
    if (!newTrailing.includes(id)) return true;
  }

  return false;
}

let lastProtectNoticeAt = 0;

function maybeNotifyBlockIdProtected(): void {
  const now = Date.now();
  if (now - lastProtectNoticeAt < 4000) return;
  lastProtectNoticeAt = now;
  new Notice(
    "块链接锚点 ^ID 受保护。若要删除请用命令「删除当前块锚点」；若要排查可「临时显示块锚点」。",
    3200
  );
}

export type RemovableAnchor =
  | { kind: "standalone"; line: number }
  | { kind: "trailing"; line: number; from: number; to: number };

export function findRemovableAnchorNearLine(editor: Editor, centerLine: number): RemovableAnchor | null {
  const lineCount = editor.lineCount();
  const scanFrom = Math.max(0, centerLine - 1);
  const scanTo = Math.min(lineCount - 1, centerLine + 4);

  for (let line = scanFrom; line <= scanTo; line++) {
    const raw = normalizeLineText(editor.getLine(line));
    const trimmed = raw.trim();
    if (STANDALONE_BLOCK_ID_LINE_RE.test(trimmed)) {
      return { kind: "standalone", line };
    }
    const trailing = raw.match(INLINE_TRAILING_BLOCK_ID_CAPTURE_RE);
    if (trailing) {
      const token = trailing[1];
      const to = raw.length;
      const from = Math.max(0, to - token.length);
      return { kind: "trailing", line, from, to };
    }
  }
  return null;
}

export function removeBlockAnchorNearCursor(app: App, instance: BlockLinkPlusHostInstance): boolean {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  const editor = view?.editor;
  if (!editor) {
    new Notice("请在 Markdown 笔记编辑区使用此命令", 2500);
    return false;
  }

  const centerLine =
    instance._blpLastContextMenuLine ?? editor.getCursor("from").line ?? editor.getCursor().line ?? 0;
  const target = findRemovableAnchorNearLine(editor, centerLine);
  if (!target) {
    new Notice("当前段落附近没有找到 ^块ID 锚点（可能在更远的独占行）", 2800);
    return false;
  }

  runWithAnchorEditAllowed(() => {
    if (target.kind === "standalone") {
      const lineText = editor.getLine(target.line);
      const from = { line: target.line, ch: 0 };
      const to =
        target.line < editor.lineCount() - 1
          ? { line: target.line + 1, ch: 0 }
          : { line: target.line, ch: lineText.length };
      editor.replaceRange("", from, to);
    } else {
      editor.replaceRange("", { line: target.line, ch: target.from }, { line: target.line, ch: target.to });
    }
  });

  new Notice("已删除当前段落附近的块锚点", 2200);
  return true;
}

function resolvePreferLines(
  instance: BlockLinkPlusHostInstance,
  editor: Editor,
  opts?: { preferLine?: number; preferEndLine?: number }
): { preferLine: number; preferEndLine: number } {
  const cursorLine = editor.getCursor("from")?.line ?? editor.getCursor().line ?? 0;
  const preferLine = opts?.preferLine ?? instance._blpLastContextMenuLine ?? cursorLine;
  const preferEndLine = opts?.preferEndLine ?? preferLine;
  return { preferLine, preferEndLine };
}

/**
 * 段落链接生成失败时的兜底菜单。
 * 不再插入「（此处无法生成段落链接）」这类不可点的占位死项（占菜单一行又无功能）；
 * 只保留真正可点的「将光标移到当前块正文」帮助用户重试。
 */
export function appendMenuFailureHints(menu: Menu, editor: Editor, preferLine: number): void {
  menu.addItem((item) => {
    item.setTitle("将光标移到当前块正文").setIcon("arrow-down").onClick(() => {
      try {
        editor.setCursor({ line: Math.max(0, preferLine), ch: 0 });
      } catch {
        // reading view may not support setCursor
      }
    });
  });
}

/** 默认关闭 bundle 分散 editor-menu；宿主统一追加（仅内存，不 saveSettings） */
export function applyEmbeddedBlpMenuPolicy(instance: BlockLinkPlusHostInstance): void {
  const settings = instance.settings ?? {};
  settings.enable_right_click_block = false;
  settings.enable_right_click_embed = false;
  settings.enable_right_click_url = false;
  if (settings.protectBlockIdAnchors !== false) {
    settings.protectBlockIdAnchors = true;
  }
  if (settings.hideStandaloneBlockIdLines !== false) {
    settings.hideStandaloneBlockIdLines = true;
  }
  if (settings.hideInlineTrailingBlockIds !== false) {
    settings.hideInlineTrailingBlockIds = true;
  }
  instance.settings = settings;
}

export function appendUnifiedBlockLinkMenu(
  menu: Menu,
  editor: Editor,
  view: MarkdownView,
  opts?: { preferLine?: number; preferEndLine?: number }
): boolean {
  const menuAny = menu as Menu & {
    [FDTB_UNIFIED_LINK_MENU_MARK]?: boolean;
    __blpLinkMenuAugmented?: boolean;
  };
  if (menuAny[FDTB_UNIFIED_LINK_MENU_MARK] || menuAny.__blpLinkMenuAugmented) {
    return false;
  }

  const instance = getEmbeddedBlockLinkPlusInstance() as BlockLinkPlusHostInstance | null;
  const append = instance?.api?.appendEditorLinkMenuItems;
  if (!append) return false;

  const lineOpts = instance ? resolvePreferLines(instance, editor, opts) : opts;
  const settings = instance.settings ?? {};
  const prev = {
    block: settings.enable_right_click_block,
    embed: settings.enable_right_click_embed,
    url: settings.enable_right_click_url,
  };
  settings.enable_right_click_block = true;
  settings.enable_right_click_embed = true;
  settings.enable_right_click_url = true;

  let added = false;
  try {
    (menu as Menu & { addSeparator?: () => void }).addSeparator?.();
    menu.addItem((item) => {
      item.setTitle("指向链接增强").setIcon("link").setDisabled(true);
    });
    added = append(menu, editor, view, lineOpts);
    if (!added) {
      return false;
    }
  } catch (error) {
    console.warn("[feishu-doc-toolbar] 追加指向链接菜单失败", error);
    added = false;
  } finally {
    settings.enable_right_click_block = prev.block;
    settings.enable_right_click_embed = prev.embed;
    settings.enable_right_click_url = prev.url;
  }

  menuAny[FDTB_UNIFIED_LINK_MENU_MARK] = true;
  menuAny.__blpLinkMenuAugmented = true;
  return added;
}

function wrapAppendEditorLinkMenuItems(instance: BlockLinkPlusHostInstance): void {
  const api = instance.api;
  if (!api?.appendEditorLinkMenuItems) return;
  if ((api as BlockLinkMenuApi & { __fdtbWrapped?: boolean }).__fdtbWrapped) return;

  const original = api.appendEditorLinkMenuItems.bind(api);
  api.appendEditorLinkMenuItems = (menu, editor, view, opts) => {
    const lineOpts = resolvePreferLines(instance, editor, opts);
    const added = original(menu, editor, view, lineOpts);
    if (!added && !opts?.suppressFailureHints) {
      appendMenuFailureHints(menu, editor, lineOpts.preferLine);
    }
    return added;
  };
  (api as BlockLinkMenuApi & { __fdtbWrapped?: boolean }).__fdtbWrapped = true;
}

let revealBlockIdsTimer: ReturnType<typeof setTimeout> | null = null;

export function setRevealBlockIdsTemporary(seconds = 30): void {
  if (typeof document?.body?.classList?.add !== "function") return;
  document.body.classList.add(REVEAL_BLOCK_IDS_BODY_CLASS);
  if (revealBlockIdsTimer) clearTimeout(revealBlockIdsTimer);
  revealBlockIdsTimer = setTimeout(() => {
    document.body?.classList?.remove?.(REVEAL_BLOCK_IDS_BODY_CLASS);
    revealBlockIdsTimer = null;
  }, Math.max(5, seconds) * 1000);
  new Notice(`已临时显示块锚点 ^ID（${seconds} 秒后恢复隐藏）`, 2500);
}

function getMenuItemTitle(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  const row = item as { titleEl?: { textContent?: string }; title?: string };
  return String(row.titleEl?.textContent ?? row.title ?? "").trim();
}

/** 文件树右键：复制文件夹超短双链（宿主备份，不依赖外部 block-link-plus 是否加载） */
export function appendFolderDualLinkMenuItem(
  menu: Menu,
  folder: TFolder,
  onCopy: () => void | Promise<void>
): void {
  const menuAny = menu as Menu & { [key: string]: boolean | undefined };
  if (menuAny[FOLDER_DUAL_LINK_MENU_MARK]) return;
  menuAny[FOLDER_DUAL_LINK_MENU_MARK] = true;

  let addedToSubmenu = false;
  const items = (menu as Menu & { items?: unknown[]; children?: unknown[] }).items ??
    (menu as Menu & { children?: unknown[] }).children;
  if (Array.isArray(items)) {
    const copyPathItem = items.find((item) => {
      const title = getMenuItemTitle(item);
      return (
        title === "复制路径" ||
        title === "Copy path" ||
        title === "Copy Path" ||
        title.toLowerCase().includes("copy path") ||
        title.includes("路径")
      );
    }) as { submenu?: Menu } | undefined;
    if (copyPathItem?.submenu && typeof copyPathItem.submenu.addItem === "function") {
      copyPathItem.submenu.addItem((subItem) => {
        subItem.setTitle(FOLDER_DUAL_LINK_MENU_TITLE).setIcon("link").onClick(() => {
          void onCopy();
        });
      });
      addedToSubmenu = true;
    }
  }

  if (!addedToSubmenu) {
    menu.addItem((item) => {
      item.setTitle(FOLDER_DUAL_LINK_MENU_TITLE).setIcon("link").onClick(() => {
        void onCopy();
      });
    });
  }
}

function getFileExplorerSelectedFolder(app: App): TFolder | null {
  const leaves = app.workspace.getLeavesOfType("file-explorer");
  for (const leaf of leaves) {
    const view = leaf.view as {
      getSelectedFolder?: () => TFolder | null;
      selectedFolder?: TFolder | null;
    };
    const folder = view?.getSelectedFolder?.() ?? view?.selectedFolder ?? null;
    if (folder instanceof TFolder) return folder;
  }
  return null;
}

async function copyFolderDualLinkForFolder(
  instance: BlockLinkPlusHostInstance,
  folder: TFolder
): Promise<boolean> {
  const copy = instance.api?.copyFolderDualLink;
  if (!copy) {
    new Notice("指向链接增强未就绪，请确认 Obsidian增强体验 已启用内嵌「指向链接增强」", 3500);
    return false;
  }
  await copy(folder);
  return true;
}

export function installFolderLinkFileMenu(host: SubPluginHost, instance: BlockLinkPlusHostInstance): void {
  host.registerEvent(
    host.app.workspace.on("file-menu", (menu, file) => {
      if (!(file instanceof TFolder)) return;
      appendFolderDualLinkMenuItem(menu, file, () => copyFolderDualLinkForFolder(instance, file));
    })
  );
}

export function installBlockLinkHostCommands(host: SubPluginHost, instance: BlockLinkPlusHostInstance): void {
  host.addCommand({
    id: "blp-copy-folder-dual-link",
    name: FOLDER_DUAL_LINK_MENU_TITLE,
    callback: () => {
      const folder = getFileExplorerSelectedFolder(host.app);
      if (!folder) {
        new Notice("请先在左侧文件树选中一个文件夹", 2800);
        return;
      }
      void copyFolderDualLinkForFolder(instance, folder);
    },
  });

  host.addCommand({
    id: "blp-remove-anchor-at-cursor",
    name: "删除当前块锚点",
    editorCheckCallback: (checking) => {
      const view = host.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view?.editor) return false;
      if (checking) return true;
      return removeBlockAnchorNearCursor(host.app, instance);
    },
  });

  host.addCommand({
    id: "blp-reveal-block-ids-temporary",
    name: "临时显示块锚点（30 秒）",
    callback: () => setRevealBlockIdsTemporary(30),
  });
}

export function installUnifiedBlockLinkEditorMenu(host: SubPluginHost): void {
  host.registerEvent(
    host.app.workspace.on("editor-menu", (menu, editor, view) => {
      if (!view?.file) return;
      appendUnifiedBlockLinkMenu(menu, editor, view);
    })
  );
}

export function installBlockIdAnchorProtection(
  host: SubPluginHost,
  instance: BlockLinkPlusHostInstance
): void {
  const cm = getCmStateModule();
  if (!cm?.EditorState?.transactionFilter) return;

  const filter = cm.EditorState.transactionFilter.of((tr) => {
    // 守卫（红线 22）：transactionFilter 抛错会让所有编辑器 EditorState 失效，
    // 历史文件全打不开；任何异常一律原样放行，最多让「防误删」失效，绝不拖垮编辑器。
    try {
      if (instance.settings?.protectBlockIdAnchors === false) return tr;
      if (transactionWouldDamageBlockAnchors(tr as TransactionLike)) {
        maybeNotifyBlockIdProtected();
        return [];
      }
      return tr;
    } catch (error) {
      console.warn("[feishu-doc-toolbar] 块锚点保护过滤器异常，已放行", error);
      return tr;
    }
  });

  host.registerEditorExtension(filter);
}

/** 宿主层一次性安装（内嵌 onload 成功后调用） */
export function installBlockLinkHostLayer(host: SubPluginHost, instance: BlockLinkPlusHostInstance): void {
  applyEmbeddedBlpMenuPolicy(instance);
  wrapAppendEditorLinkMenuItems(instance);
  installUnifiedBlockLinkEditorMenu(host);
  installFolderLinkFileMenu(host, instance);
  installBlockIdAnchorProtection(host, instance);
  installBlockLinkHostCommands(host, instance);
}
