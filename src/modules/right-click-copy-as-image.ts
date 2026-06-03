import { Editor, MarkdownRenderer, MarkdownView, Menu, Notice } from "obsidian";
import * as HtmlToImage from "html-to-image";

import { EmbeddedSubModule, SubPluginHost } from "./sub-plugin-host";

const MENU_TITLE = "复制成图片";
const CANVAS_SUCCESS_NOTICE = "已复制当前卡片为 PNG 图片";
const TABLE_SUCCESS_NOTICE = "已复制当前表格为 PNG 图片";
const SELECTION_SUCCESS_NOTICE = "已复制当前选区为 PNG 图片";
const PAGE_SUCCESS_NOTICE = "已复制整个页面为 PNG 图片";
const FAILURE_NOTICE = "复制图片失败，请稍后再试";
const DESKTOP_ONLY_NOTICE = "当前环境不支持复制图片到剪贴板";
const EXPORT_PADDING = 12;
const EXPORT_PIXEL_RATIO = 2;
const EXPORT_STAGING_OFFSET = 16;
const MARKDOWN_MENU_TABLE_TITLE = "复制当前表格成图";
const MARKDOWN_MENU_SELECTION_TITLE = "复制当前选区成图";
const MARKDOWN_MENU_PAGE_TITLE = "复制整个页面成图";
const CONTEXT_TTL_MS = 1_500;
const MENU_AUGMENTED_FLAG = "__canvasCopyAsImageMarkdownAugmented";
const MENU_SELECTION_FLAG = "__canvasCopyAsImageSelectionAdded";
const MENU_TABLE_FLAG = "__canvasCopyAsImageTableAdded";
const MENU_PAGE_FLAG = "__canvasCopyAsImagePageAdded";
const LIVE_REGION_BORDER_PADDING = 2;

const TABLE_SELECTION_SELECTORS = [
  "td[aria-selected='true']",
  "th[aria-selected='true']",
  "[role='gridcell'][aria-selected='true']",
  "[role='columnheader'][aria-selected='true']",
  "[role='rowheader'][aria-selected='true']",
  "td.is-selected",
  "th.is-selected",
  "td.mod-selected",
  "th.mod-selected",
  "td.selected",
  "th.selected",
  "[role='gridcell'].is-selected",
  "[role='gridcell'].mod-selected",
  "[role='gridcell'][data-selected='true']",
  "[data-selected='true']",
].join(", ");

type CanvasNodeLike = {
  id?: string;
  canvas?: CanvasLike;
  nodeEl?: HTMLElement;
  zIndex?: number;
  getData?: () => {
    id?: string;
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    [key: string]: unknown;
  };
};

type CanvasLike = {
  getSelectionData?: () => {
    nodes?: Array<{ id: string }>;
  };
  getContainingNodes?: (bbox: { minX: number; minY: number; maxX: number; maxY: number }) => CanvasNodeLike[];
  nodes?: Map<string, CanvasNodeLike>;
};

type ExportBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type MarkdownContextTarget = {
  at: number;
  target: HTMLElement;
  view: MarkdownView;
  clientX: number;
  clientY: number;
};

type WrapperCleanup = {
  wrapper: HTMLElement;
  stage: HTMLElement;
  destroy: () => void;
};

class RightClickCopyAsImageRunner {
  private lastMarkdownContext: MarkdownContextTarget | null = null;

  constructor(public host: SubPluginHost) {}

  async start() {
    const workspace = this.host.app.workspace as any;
    this.registerMarkdownMenuPatch();

    this.host.registerEvent(
      workspace.on("canvas:node-menu", (menu: Menu, node: CanvasNodeLike) => {
        if (!this.isExportableNode(node)) return;
        this.addCanvasMenuItem(menu, () => this.copyNodesAsImage(this.getExportPlanForNodes([node], node.canvas)));
      })
    );

    this.host.registerEvent(
      workspace.on("canvas:selection-menu", (menu: Menu, canvas: CanvasLike) => {
        const selectedNodes = this.getSelectedNodes(canvas);
        if (selectedNodes.length === 0) return;
        this.addCanvasMenuItem(menu, () => this.copyNodesAsImage(this.getExportPlanForNodes(selectedNodes, canvas)));
      })
    );

    this.host.registerDomEvent(
      document,
      "contextmenu",
      (event) => this.handleDocumentContextMenu(event as MouseEvent),
      true
    );

    this.host.registerEvent(
      this.host.app.workspace.on("editor-menu", (menu, editor, info) => {
        if (!(info instanceof MarkdownView)) return;
        this.addMarkdownMenuItems(menu, info, editor, this.getFreshContextTarget(info));
      })
    );
  }

  private handleDocumentContextMenu(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const view = this.getContainingMarkdownView(target);
    if (!view) return;

    this.lastMarkdownContext = {
      at: Date.now(),
      target,
      view,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  }

  private addCanvasMenuItem(menu: Menu, onClick: () => Promise<void>) {
    menu.addItem((item) => {
      item.setTitle(MENU_TITLE);
      item.setIcon("copy");
      item.onClick(() => void onClick());
    });
  }

  private addMarkdownMenuItems(menu: Menu, view: MarkdownView, editor: Editor | null, target: HTMLElement | null) {
    const menuAny = menu as any;

    let itemCount = 0;
    const tableTarget = this.findTableTarget(target, view);
    const hasSelection = this.hasSelectionExport(view, editor, target);
    const hasPage = this.hasPageExport(view, editor);
    const addOnce = (
      flag: string,
      title: string,
      icon: string,
      onClick: () => void | Promise<void>
    ) => {
      if (menuAny[flag]) return;
      menu.addItem((item) => {
        item.setTitle(title);
        item.setIcon(icon);
        item.onClick(() => void onClick());
      });
      menuAny[flag] = true;
      itemCount += 1;
    };

    if (hasSelection) {
      addOnce(
        MENU_SELECTION_FLAG,
        MARKDOWN_MENU_SELECTION_TITLE,
        "image-file",
        () => this.copyCurrentSelectionAsImage(view, editor, target)
      );
    }

    if (tableTarget) {
      addOnce(
        MENU_TABLE_FLAG,
        MARKDOWN_MENU_TABLE_TITLE,
        "table",
        () => this.copyCurrentTableAsImage(view, editor, target)
      );
    }

    if (hasPage) {
      addOnce(
        MENU_PAGE_FLAG,
        MARKDOWN_MENU_PAGE_TITLE,
        "image-file",
        () => this.copyCurrentPageAsImage(view, editor)
      );
    }

    if (itemCount > 0) {
      menuAny[MENU_AUGMENTED_FLAG] = true;
    }

    return itemCount;
  }

  private registerMarkdownMenuPatch() {
    const menuPrototype = Menu.prototype as any;
    const originalShowAtPosition = menuPrototype.showAtPosition;
    const originalShowAtMouseEvent = menuPrototype.showAtMouseEvent;
    const runner = this;

    if (typeof originalShowAtPosition === "function") {
      menuPrototype.showAtPosition = function (...args: any[]) {
        runner.tryAugmentNativeMarkdownMenu(this as Menu);
        return originalShowAtPosition.apply(this, args);
      };
    }

    if (typeof originalShowAtMouseEvent === "function") {
      menuPrototype.showAtMouseEvent = function (...args: any[]) {
        runner.tryAugmentNativeMarkdownMenu(this as Menu);
        return originalShowAtMouseEvent.apply(this, args);
      };
    }

    this.host.register(() => {
      menuPrototype.showAtPosition = originalShowAtPosition;
      if (typeof originalShowAtMouseEvent === "function") {
        menuPrototype.showAtMouseEvent = originalShowAtMouseEvent;
      }
    });
  }

  private tryAugmentNativeMarkdownMenu(menu: Menu) {
    const context = this.getFreshMarkdownContext();
    if (!context) return;

    const editor = this.getEditorForView(context.view);
    const itemCount = this.addMarkdownMenuItems(menu, context.view, editor, context.target);
    if (itemCount > 0) {
      this.lastMarkdownContext = null;
    }
  }

  private getSelectedNodes(canvas: CanvasLike): CanvasNodeLike[] {
    const selection = canvas.getSelectionData?.();
    const selectedNodes = selection?.nodes ?? [];
    if (selectedNodes.length === 0) return [];

    return selectedNodes
      .map((selectedNode) => selectedNode?.id ? canvas.nodes?.get(selectedNode.id) : null)
      .filter((node): node is CanvasNodeLike => node !== null && node !== undefined);
  }

  private isExportableNode(node: CanvasNodeLike | null | undefined): node is CanvasNodeLike & { nodeEl: HTMLElement } {
    return !!node?.nodeEl;
  }

  private async copyNodesAsImage(plan: { bounds: ExportBounds; nodes: CanvasNodeLike[] } | null) {
    if (!plan || plan.nodes.length === 0) {
      new Notice(FAILURE_NOTICE);
      return;
    }

    const cleanup = this.cloneNodesForExport(plan.nodes, plan.bounds);
    await this.exportPreparedWrapper(cleanup, CANVAS_SUCCESS_NOTICE);
  }

  private async copyCurrentSelectionAsImage(view: MarkdownView, editor: Editor | null, target: HTMLElement | null) {
    const tableCells = this.getSelectedTableCells(target, view);
    if (tableCells.length > 0) {
      const table = this.findTableTarget(target, view);
      if (table) {
        const region = this.getElementsBounds(tableCells);
        if (region) {
          await this.copyLiveNodeRegionAsImage(table, region, SELECTION_SUCCESS_NOTICE, "var(--background-primary)");
          return;
        }
      }
    }

    const domRange = this.getSelectionRangeWithinView(view);
    if (domRange) {
      await this.copyRangeAsImage(domRange, this.getRangeExportWidth(domRange, view), SELECTION_SUCCESS_NOTICE);
      return;
    }

    const selectedMarkdown = editor?.getSelection?.() ?? "";
    if (selectedMarkdown.trim()) {
      await this.copyRenderedMarkdownAsImage(
        selectedMarkdown,
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        SELECTION_SUCCESS_NOTICE
      );
      return;
    }

    new Notice(FAILURE_NOTICE);
  }

  private async copyCurrentTableAsImage(view: MarkdownView, editor: Editor | null, target: HTMLElement | null) {
    const tableTarget = this.findTableTarget(target, view);
    if (tableTarget) {
      await this.copyLiveNodeAsImage(tableTarget, TABLE_SUCCESS_NOTICE, "var(--background-primary)");
      return;
    }

    const tableMarkdown = editor ? this.extractMarkdownTableAtSelection(editor) : null;
    if (tableMarkdown) {
      await this.copyRenderedMarkdownAsImage(
        tableMarkdown,
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        TABLE_SUCCESS_NOTICE
      );
      return;
    }

    new Notice(FAILURE_NOTICE);
  }

  private async copyCurrentPageAsImage(view: MarkdownView, editor: Editor | null) {
    if (editor) {
      await this.copyRenderedMarkdownAsImage(
        editor.getValue(),
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        PAGE_SUCCESS_NOTICE
      );
      return;
    }

    const pageEl = this.getPreviewPageElement(view);
    if (pageEl) {
      await this.copyLiveNodeAsImage(pageEl, PAGE_SUCCESS_NOTICE, "var(--background-primary)");
      return;
    }

    const fileText = await this.readMarkdownFile(view.file);
    if (fileText !== null) {
      await this.copyRenderedMarkdownAsImage(
        fileText,
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        PAGE_SUCCESS_NOTICE
      );
      return;
    }

    new Notice(FAILURE_NOTICE);
  }

  private hasSelectionExport(view: MarkdownView, editor: Editor | null, target: HTMLElement | null) {
    return (
      this.getSelectedTableCells(target, view).length > 0 ||
      !!this.getSelectionRangeWithinView(view) ||
      !!editor?.getSelection?.().trim()
    );
  }

  private hasPageExport(view: MarkdownView, editor: Editor | null) {
    return !!editor || !!this.getPreviewPageElement(view) || !!view.file;
  }

  private findTableTarget(target: HTMLElement | null, view: MarkdownView) {
    if (target) {
      const found = target.closest("table");
      if (found instanceof HTMLElement && view.contentEl.contains(found)) {
        return found;
      }
    }

    const selectionCells = this.getSelectedTableCells(target, view);
    const selectionTable = selectionCells[0]?.closest("table");
    if (selectionTable instanceof HTMLElement && view.contentEl.contains(selectionTable)) {
      return selectionTable;
    }

    return null;
  }

  private getSelectedTableCells(target: HTMLElement | null, view: MarkdownView) {
    const immediateTable = this.findImmediateTable(target, view);
    const tables = immediateTable
      ? [immediateTable]
      : Array.from(view.contentEl.querySelectorAll<HTMLElement>("table"));

    return tables.flatMap((table) =>
      Array.from(table.querySelectorAll<HTMLElement>(TABLE_SELECTION_SELECTORS))
        .filter((element) => this.isProbablyTableCell(element) && table.contains(element))
    );
  }

  private findImmediateTable(target: HTMLElement | null, view: MarkdownView) {
    if (!target) return null;
    const table = target.closest("table");
    if (table instanceof HTMLElement && view.contentEl.contains(table)) {
      return table;
    }
    return null;
  }

  private isProbablyTableCell(element: HTMLElement) {
    const tagName = element.tagName.toLowerCase();
    if (tagName === "td" || tagName === "th") return true;

    const role = element.getAttribute("role");
    if (role === "gridcell" || role === "columnheader" || role === "rowheader") return true;

    const className = element.className;
    return typeof className === "string" && /cell/i.test(className);
  }

  private extractMarkdownTableAtSelection(editor: Editor) {
    const totalLines = editor.lineCount();
    if (totalLines === 0) return null;

    const startLine = editor.getCursor("from").line;
    const endLine = editor.getCursor("to").line;
    let minLine = startLine;
    let maxLine = endLine;

    const isTableLine = (line: string) => /^\s*\|?.*\|.*\|?\s*$/.test(line.trim()) && line.includes("|");

    let hasTableLine = false;
    for (let line = minLine; line <= maxLine; line += 1) {
      if (isTableLine(editor.getLine(line))) {
        hasTableLine = true;
        break;
      }
    }

    if (!hasTableLine) {
      if (!isTableLine(editor.getLine(startLine))) return null;
      minLine = startLine;
      maxLine = startLine;
    }

    while (minLine > 0 && isTableLine(editor.getLine(minLine - 1))) {
      minLine -= 1;
    }
    while (maxLine < totalLines - 1 && isTableLine(editor.getLine(maxLine + 1))) {
      maxLine += 1;
    }

    const lines: string[] = [];
    for (let line = minLine; line <= maxLine; line += 1) {
      lines.push(editor.getLine(line));
    }

    if (lines.length < 2) return null;

    const dividerLine = lines.find((line) => /^(\s*\|)?[\s:|-]+(\|\s*)?$/.test(line.trim()));
    if (!dividerLine) return null;

    return lines.join("\n");
  }

  private getSelectionRangeWithinView(view: MarkdownView) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const container = commonAncestor instanceof HTMLElement
      ? commonAncestor
      : commonAncestor.parentElement;

    if (!container || !view.contentEl.contains(container)) return null;
    return range.cloneRange();
  }

  private getPreviewPageElement(view: MarkdownView) {
    const previewSizer = view.contentEl.querySelector<HTMLElement>(
      ".markdown-preview-sizer, .markdown-source-view.mod-cm6 .cm-sizer"
    );
    if (previewSizer) return previewSizer;

    const readingView = view.contentEl.querySelector<HTMLElement>(".markdown-reading-view");
    if (readingView) return readingView;

    return null;
  }

  private getPreferredContentWidth(view: MarkdownView) {
    const candidate = view.contentEl.querySelector<HTMLElement>(
      ".markdown-preview-sizer, .cm-sizer, .cm-content, .markdown-reading-view"
    );
    const rectWidth = candidate?.getBoundingClientRect().width ?? 0;
    const scrollWidth = candidate?.scrollWidth ?? 0;
    const width = Math.max(rectWidth, scrollWidth, 680);
    return Math.min(1800, Math.max(420, Math.ceil(width)));
  }

  private getRangeExportWidth(range: Range, view: MarkdownView) {
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    const rectWidth = rects.length > 0
      ? Math.max(...rects.map((rect) => rect.right)) - Math.min(...rects.map((rect) => rect.left))
      : range.getBoundingClientRect().width;
    const preferredWidth = this.getPreferredContentWidth(view);
    return Math.min(preferredWidth, Math.max(120, Math.ceil(rectWidth || preferredWidth)));
  }

  private async copyRenderedMarkdownAsImage(markdown: string, sourcePath: string, width: number, successNotice: string) {
    const cleanup = this.createWrapperForDynamicContent(width, 1, "var(--background-primary)");
    const content = document.createElement("div");
    content.className = "markdown-preview-view markdown-rendered";
    content.style.width = `${width}px`;
    content.style.maxWidth = `${width}px`;
    content.style.padding = "0";
    content.style.margin = "0";
    cleanup.stage.appendChild(content);

    try {
      await MarkdownRenderer.renderMarkdown(markdown, content, sourcePath, this.host.component);
      this.normalizeRenderedMarkdown(content);
      await this.waitForRenderSettled(content);

      const exportWidth = Math.max(width, Math.ceil(content.scrollWidth || content.getBoundingClientRect().width || width));
      const exportHeight = Math.max(1, Math.ceil(content.scrollHeight || content.getBoundingClientRect().height || 1));
      content.style.width = `${exportWidth}px`;
      content.style.maxWidth = `${exportWidth}px`;
      cleanup.stage.style.width = `${exportWidth}px`;
      cleanup.stage.style.height = `${exportHeight}px`;
      cleanup.wrapper.style.width = `${exportWidth + EXPORT_PADDING * 2}px`;
      cleanup.wrapper.style.height = `${exportHeight + EXPORT_PADDING * 2}px`;

      await this.exportPreparedWrapper(cleanup, successNotice);
    } catch (error) {
      cleanup.destroy();
      console.error("[canvas-copy-as-image] Failed to render markdown for export", error);
      new Notice(FAILURE_NOTICE);
    }
  }

  private async copyRangeAsImage(range: Range, width: number, successNotice: string) {
    const cleanup = this.createWrapperForDynamicContent(width, 1, "var(--background-primary)");
    const content = document.createElement("div");
    content.className = "markdown-preview-view markdown-rendered";
    content.style.width = `${width}px`;
    content.style.maxWidth = `${width}px`;
    content.appendChild(range.cloneContents());
    this.stripNonContentArtifacts(content);
    cleanup.stage.appendChild(content);

    const exportWidth = Math.max(width, Math.ceil(content.scrollWidth || content.getBoundingClientRect().width || width));
    const exportHeight = Math.max(1, Math.ceil(content.scrollHeight || content.getBoundingClientRect().height || 1));
    content.style.width = `${exportWidth}px`;
    content.style.maxWidth = `${exportWidth}px`;
    cleanup.stage.style.width = `${exportWidth}px`;
    cleanup.stage.style.height = `${exportHeight}px`;
    cleanup.wrapper.style.width = `${exportWidth + EXPORT_PADDING * 2}px`;
    cleanup.wrapper.style.height = `${exportHeight + EXPORT_PADDING * 2}px`;

    await this.exportPreparedWrapper(cleanup, successNotice);
  }

  private async copyWholeNodeAsImage(sourceNode: HTMLElement, successNotice: string, background: string) {
    const width = Math.max(1, Math.ceil(Math.max(sourceNode.scrollWidth, sourceNode.getBoundingClientRect().width)));
    const height = Math.max(1, Math.ceil(Math.max(sourceNode.scrollHeight, sourceNode.getBoundingClientRect().height)));
    const cleanup = this.createWrapperForDynamicContent(width, height, background);
    const clone = sourceNode.cloneNode(true) as HTMLElement;
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.width = `${width}px`;
    clone.style.maxWidth = `${width}px`;
    this.stripNonContentArtifacts(clone);
    cleanup.stage.appendChild(clone);
    await this.exportPreparedWrapper(cleanup, successNotice);
  }

  private async copyLiveNodeAsImage(sourceNode: HTMLElement, successNotice: string, background: string) {
    try {
      await this.waitForRenderSettled(sourceNode);
      const blob = await HtmlToImage.toBlob(sourceNode, {
        cacheBust: true,
        backgroundColor: this.resolveBackgroundColor(sourceNode, background),
        pixelRatio: Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO),
        filter: (node) => this.shouldIncludeLiveNode(node),
      });

      if (!blob) {
        throw new Error("Failed to export PNG blob");
      }

      await this.writeBlobToClipboard(blob);
      new Notice(successNotice);
    } catch (error) {
      console.error("[canvas-copy-as-image] Failed to copy live node image", error);
      new Notice(FAILURE_NOTICE);
    }
  }

  private async copyNodeRegionAsImage(sourceNode: HTMLElement, region: DOMRect, successNotice: string) {
    const width = Math.max(1, Math.ceil(region.width));
    const height = Math.max(1, Math.ceil(region.height));
    const sourceRect = sourceNode.getBoundingClientRect();
    const cleanup = this.createWrapperForDynamicContent(width, height, "var(--background-primary)");
    const clone = sourceNode.cloneNode(true) as HTMLElement;
    clone.style.margin = "0";
    clone.style.transform = `translate(${-Math.round(region.left - sourceRect.left)}px, ${-Math.round(region.top - sourceRect.top)}px)`;
    clone.style.transformOrigin = "top left";
    this.stripNonContentArtifacts(clone);
    cleanup.stage.appendChild(clone);
    await this.exportPreparedWrapper(cleanup, successNotice);
  }

  private async copyLiveNodeRegionAsImage(
    sourceNode: HTMLElement,
    region: DOMRect,
    successNotice: string,
    background: string
  ) {
    try {
      await this.waitForRenderSettled(sourceNode);
      const pixelRatio = Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO);
      const sourceRect = sourceNode.getBoundingClientRect();
      const canvas = await HtmlToImage.toCanvas(sourceNode, {
        cacheBust: true,
        backgroundColor: this.resolveBackgroundColor(sourceNode, background),
        pixelRatio,
        filter: (node) => this.shouldIncludeLiveNode(node),
      });

      const relativeLeft = Math.max(0, region.left - sourceRect.left - LIVE_REGION_BORDER_PADDING);
      const relativeTop = Math.max(0, region.top - sourceRect.top - LIVE_REGION_BORDER_PADDING);
      const relativeRight = Math.min(sourceRect.width, region.right - sourceRect.left + LIVE_REGION_BORDER_PADDING);
      const relativeBottom = Math.min(sourceRect.height, region.bottom - sourceRect.top + LIVE_REGION_BORDER_PADDING);
      const cropWidth = Math.max(1, Math.ceil((relativeRight - relativeLeft) * pixelRatio));
      const cropHeight = Math.max(1, Math.ceil((relativeBottom - relativeTop) * pixelRatio));

      const cropped = document.createElement("canvas");
      cropped.width = cropWidth;
      cropped.height = cropHeight;
      const context = cropped.getContext("2d");
      if (!context) {
        throw new Error("Failed to create crop canvas");
      }

      context.drawImage(
        canvas,
        Math.round(relativeLeft * pixelRatio),
        Math.round(relativeTop * pixelRatio),
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const blob = await new Promise<Blob | null>((resolve) => cropped.toBlob((value) => resolve(value), "image/png"));
      if (!blob) {
        throw new Error("Failed to export region PNG blob");
      }

      await this.writeBlobToClipboard(blob);
      new Notice(successNotice);
    } catch (error) {
      console.error("[canvas-copy-as-image] Failed to copy live node region image", error);
      new Notice(FAILURE_NOTICE);
    }
  }

  private createWrapperForDynamicContent(exportWidth: number, exportHeight: number, background: string): WrapperCleanup {
    const wrapper = document.createElement("div");
    wrapper.className = "canvas-copy-as-image-wrapper";
    wrapper.style.position = "fixed";
    wrapper.style.left = `${EXPORT_STAGING_OFFSET}px`;
    wrapper.style.top = `${EXPORT_STAGING_OFFSET}px`;
    wrapper.style.zIndex = "-1";
    wrapper.style.pointerEvents = "none";
    wrapper.style.background = background;
    wrapper.style.overflow = "hidden";
    wrapper.style.contain = "layout paint style";
    wrapper.style.isolation = "isolate";
    wrapper.style.padding = `${EXPORT_PADDING}px`;
    wrapper.style.boxSizing = "border-box";
    wrapper.style.width = `${exportWidth + EXPORT_PADDING * 2}px`;
    wrapper.style.height = `${exportHeight + EXPORT_PADDING * 2}px`;

    const stage = document.createElement("div");
    stage.className = "canvas-copy-as-image-stage";
    stage.style.position = "relative";
    stage.style.width = `${exportWidth}px`;
    stage.style.height = `${exportHeight}px`;
    stage.style.overflow = "hidden";
    stage.style.background = background;
    wrapper.appendChild(stage);

    document.body.appendChild(wrapper);

    return {
      wrapper,
      stage,
      destroy: () => wrapper.remove(),
    };
  }

  private async exportPreparedWrapper(cleanup: WrapperCleanup, successNotice: string) {
    try {
      await this.waitForRenderSettled(cleanup.wrapper);
      const blob = await HtmlToImage.toBlob(cleanup.wrapper, {
        cacheBust: true,
        pixelRatio: Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO),
      });

      if (!blob) {
        throw new Error("Failed to export PNG blob");
      }

      await this.writeBlobToClipboard(blob);
      new Notice(successNotice);
    } catch (error) {
      console.error("[canvas-copy-as-image] Failed to copy image", error);
      new Notice(FAILURE_NOTICE);
    } finally {
      cleanup.destroy();
    }
  }

  private normalizeRenderedMarkdown(root: HTMLElement) {
    root.querySelectorAll("p").forEach((paragraph) => {
      paragraph.style.marginTop = "0";
    });
  }

  private async waitForRenderSettled(root: HTMLElement) {
    await this.waitForNextFrame();
    await this.waitForNextFrame();

    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(images.map((image) => this.waitForImage(image)));
    await this.waitForNextFrame();
  }

  private waitForImage(image: HTMLImageElement) {
    if (image.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  }

  private waitForNextFrame() {
    return new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  private getElementsBounds(elements: HTMLElement[]) {
    if (elements.length === 0) return null;

    const rects = elements
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0);

    if (rects.length === 0) return null;

    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));

    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON() {
        return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top };
      },
    } as DOMRect;
  }

  private stripNonContentArtifacts(root: HTMLElement) {
    this.stripSelectionArtifacts(root);
    const selectors = [
      ".cm-cursor",
      ".cm-selectionLayer",
      ".cm-activeLine",
      ".markdown-source-view.mod-cm6 .cm-gutters",
      ".markdown-source-view.mod-cm6 .cm-activeLineGutter",
      ".menu",
      ".suggestion-container",
      ".popover",
      ".workspace-tab-header",
      ".fdtb-handle",
      ".fdtb-popover",
      ".fdtb-submenu",
      ".mdtp-sidebar-handle",
      ".mdtp-sidebar-popover",
      ".mdtp-image-manipulator",
      ".mdtp-inline-editor",
      ".mdtp-resize-handle",
    ];

    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => element.remove());
    }
  }

  private shouldIncludeLiveNode(node: HTMLElement | Node) {
    if (!(node instanceof HTMLElement)) {
      return true;
    }

    if (this.matchesArtifactSelector(node)) {
      return false;
    }

    const ariaLabel = node.getAttribute("aria-label") || node.getAttribute("aria-description") || "";
    const title = node.getAttribute("title") || "";
    const tooltip = `${ariaLabel} ${title}`.trim();
    if (tooltip && /(新增行|新增列|移动行|移动列|删除行|删除列|复制行|复制列|对齐|排序|更多选项)/.test(tooltip)) {
      return false;
    }

    return true;
  }

  private matchesArtifactSelector(element: HTMLElement) {
    const selectors = [
      ".cm-cursor",
      ".cm-selectionLayer",
      ".cm-activeLine",
      ".markdown-source-view.mod-cm6 .cm-gutters",
      ".markdown-source-view.mod-cm6 .cm-activeLineGutter",
      ".menu",
      ".suggestion-container",
      ".popover",
      ".workspace-tab-header",
      ".canvas-node-resizer",
      ".canvas-node-handle",
      ".canvas-node-toolbar",
      ".canvas-node-menu",
      ".canvas-node-menu-button",
      ".canvas-node-controls",
      ".canvas-selection-box",
      ".canvas-zoom-btn",
      ".canvas-floating-button",
      ".canvas-node-placeholder",
      ".fdtb-handle",
      ".fdtb-popover",
      ".fdtb-submenu",
      ".mdtp-sidebar-handle",
      ".mdtp-sidebar-popover",
      ".mdtp-image-manipulator",
      ".mdtp-inline-editor",
      ".mdtp-resize-handle",
    ];

    return selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
  }

  private resolveBackgroundColor(sourceNode: HTMLElement, background: string) {
    const trimmed = background.trim();
    if (trimmed.startsWith("var(")) {
      const variableName = trimmed.slice(4, -1).trim();
      const fromNode = getComputedStyle(sourceNode).getPropertyValue(variableName).trim();
      if (fromNode) return fromNode;
      const fromBody = getComputedStyle(document.body).getPropertyValue(variableName).trim();
      if (fromBody) return fromBody;
    }

    return trimmed || "#ffffff";
  }

  private getFreshContextTarget(view: MarkdownView) {
    return this.getFreshMarkdownContext(view)?.target ?? null;
  }

  private getFreshMarkdownContext(view?: MarkdownView) {
    if (!this.lastMarkdownContext) return null;
    if (view && this.lastMarkdownContext.view !== view) return null;
    if (Date.now() - this.lastMarkdownContext.at > CONTEXT_TTL_MS) return null;
    if (!this.lastMarkdownContext.view.contentEl.contains(this.lastMarkdownContext.target)) return null;
    return this.lastMarkdownContext;
  }

  private getContainingMarkdownView(target: HTMLElement) {
    for (const leaf of this.host.app.workspace.getLeavesOfType("markdown")) {
      const view = leaf.view;
      if (view instanceof MarkdownView && view.contentEl.contains(target)) {
        return view;
      }
    }
    return null;
  }

  private getEditorForView(view: MarkdownView) {
    const editor = (view as any)?.editor;
    if (editor && typeof editor.getValue === "function") {
      return editor as Editor;
    }

    return null;
  }

  private async readMarkdownFile(file: MarkdownView["file"]) {
    if (!file) return null;
    return await this.host.app.vault.cachedRead(file);
  }

  private getExportPlanForNodes(selectedNodes: CanvasNodeLike[], canvas?: CanvasLike) {
    const exportNodesMap = new Map<string, CanvasNodeLike>();
    const boundsSources: CanvasNodeLike[] = [];

    for (const node of selectedNodes) {
      if (!this.isExportableNode(node)) continue;

      const nodeId = this.getNodeId(node);
      if (nodeId) exportNodesMap.set(nodeId, node);
      boundsSources.push(node);

      if (this.isGroupNode(node) && canvas?.getContainingNodes) {
        const bounds = this.getNodeBounds(node);
        if (!bounds) continue;

        const containedNodes = canvas.getContainingNodes(bounds);
        for (const containedNode of containedNodes) {
          if (!this.isExportableNode(containedNode)) continue;
          const containedId = this.getNodeId(containedNode);
          if (!containedId) continue;
          exportNodesMap.set(containedId, containedNode);
        }
      }
    }

    const exportNodes = [...exportNodesMap.values()];
    const bounds = this.combineBounds(boundsSources.length > 0 ? boundsSources : exportNodes);
    if (!bounds || exportNodes.length === 0) return null;

    const sortedNodes = exportNodes.sort((left, right) => this.getNodeZIndex(left) - this.getNodeZIndex(right));
    return { bounds, nodes: sortedNodes };
  }

  private cloneNodesForExport(sourceNodes: CanvasNodeLike[], bounds: ExportBounds) {
    const exportWidth = Math.max(1, Math.ceil(bounds.maxX - bounds.minX));
    const exportHeight = Math.max(1, Math.ceil(bounds.maxY - bounds.minY));
    const cleanup = this.createWrapperForDynamicContent(exportWidth, exportHeight, "transparent");

    for (const sourceNode of sourceNodes) {
      if (!this.isExportableNode(sourceNode)) continue;
      const clone = this.cloneSingleNode(sourceNode, bounds);
      cleanup.stage.appendChild(clone);
    }

    return cleanup;
  }

  private cloneSingleNode(sourceNode: CanvasNodeLike & { nodeEl: HTMLElement }, bounds: ExportBounds) {
    const exportSize = this.getExportSize(sourceNode);
    const nodeBounds = this.getNodeBounds(sourceNode);
    const clone = sourceNode.nodeEl.cloneNode(true) as HTMLElement;

    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.position = "absolute";
    clone.style.left = `${Math.round((nodeBounds?.minX ?? bounds.minX) - bounds.minX)}px`;
    clone.style.top = `${Math.round((nodeBounds?.minY ?? bounds.minY) - bounds.minY)}px`;
    clone.style.width = `${exportSize.width}px`;
    clone.style.height = `${exportSize.height}px`;
    clone.style.zIndex = `${this.getNodeZIndex(sourceNode)}`;
    clone.style.setProperty("--canvas-node-width", `${exportSize.width}px`);
    clone.style.setProperty("--canvas-node-height", `${exportSize.height}px`);

    clone.classList.remove("is-selected", "mod-selected", "has-focus", "is-focused", "is-editing");
    this.stripSelectionArtifacts(clone);

    return clone;
  }

  private getExportSize(sourceNode: CanvasNodeLike & { nodeEl: HTMLElement }) {
    const rect = sourceNode.nodeEl.getBoundingClientRect();
    const computedStyle = getComputedStyle(sourceNode.nodeEl);
    const data = sourceNode.getData?.();

    const width = this.getDimensionValue(
      data?.width,
      sourceNode.nodeEl.style.width,
      computedStyle.getPropertyValue("--canvas-node-width"),
      computedStyle.width,
      sourceNode.nodeEl.clientWidth,
      rect.width
    );
    const height = this.getDimensionValue(
      data?.height,
      sourceNode.nodeEl.style.height,
      computedStyle.getPropertyValue("--canvas-node-height"),
      computedStyle.height,
      sourceNode.nodeEl.clientHeight,
      rect.height
    );

    return {
      width: Math.max(1, Math.ceil(width)),
      height: Math.max(1, Math.ceil(height)),
    };
  }

  private getDimensionValue(...values: Array<string | number>) {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
      }

      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }

    return 1;
  }

  private getNumericValue(...values: Array<string | number>) {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return 0;
  }

  private getNodeBounds(node: CanvasNodeLike): ExportBounds | null {
    const data = node.getData?.();
    const width = this.getDimensionValue(data?.width ?? 0);
    const height = this.getDimensionValue(data?.height ?? 0);
    const x = this.getNumericValue(data?.x ?? 0);
    const y = this.getNumericValue(data?.y ?? 0);

    if (width <= 0 || height <= 0) return null;

    return {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
    };
  }

  private combineBounds(nodes: CanvasNodeLike[]) {
    const bounds = nodes
      .map((node) => this.getNodeBounds(node))
      .filter((bbox): bbox is ExportBounds => bbox !== null);

    if (bounds.length === 0) return null;

    return bounds.reduce((combined, current) => ({
      minX: Math.min(combined.minX, current.minX),
      minY: Math.min(combined.minY, current.minY),
      maxX: Math.max(combined.maxX, current.maxX),
      maxY: Math.max(combined.maxY, current.maxY),
    }));
  }

  private isGroupNode(node: CanvasNodeLike) {
    return node.getData?.().type === "group";
  }

  private getNodeId(node: CanvasNodeLike) {
    return node.getData?.().id ?? node.id ?? null;
  }

  private getNodeZIndex(node: CanvasNodeLike) {
    if (typeof node.zIndex === "number" && Number.isFinite(node.zIndex)) {
      return node.zIndex;
    }

    const styleZIndex = this.isExportableNode(node) ? Number.parseFloat(node.nodeEl.style.zIndex || "0") : 0;
    if (Number.isFinite(styleZIndex)) return styleZIndex;
    return 0;
  }

  private stripSelectionArtifacts(root: HTMLElement) {
    const selectors = [
      ".canvas-node-resizer",
      ".canvas-node-handle",
      ".canvas-node-toolbar",
      ".canvas-node-menu",
      ".canvas-node-menu-button",
      ".canvas-node-controls",
      ".canvas-selection-box",
      ".canvas-zoom-btn",
      ".canvas-floating-button",
      ".canvas-node-placeholder",
    ];

    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => element.remove());
    }
  }

  private async writeBlobToClipboard(blob: Blob) {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type || "image/png"]: blob,
          }),
        ]);
        return;
      } catch (error) {
        console.warn("[canvas-copy-as-image] navigator.clipboard.write failed, falling back to electron clipboard", error);
      }
    }

    const electronClipboard = this.getElectronClipboard();
    if (!electronClipboard) {
      throw new Error(DESKTOP_ONLY_NOTICE);
    }

    const { clipboard, nativeImage } = electronClipboard;
    const buffer = Buffer.from(await blob.arrayBuffer());
    clipboard.writeImage(nativeImage.createFromBuffer(buffer));
  }

  private getElectronClipboard():
    | {
        clipboard: { writeImage: (image: unknown) => void };
        nativeImage: { createFromBuffer: (buffer: Buffer) => unknown };
      }
    | null {
    const electron = (window as any)?.require?.("electron");
    if (!electron?.clipboard || !electron?.nativeImage) return null;
    return electron;
  }

  async copyTableElementAsImage(view: MarkdownView, tableEl: HTMLTableElement) {
    if (!(view.contentEl instanceof HTMLElement) || !view.contentEl.contains(tableEl)) {
      new Notice(FAILURE_NOTICE);
      return;
    }
    await this.copyLiveNodeAsImage(tableEl, TABLE_SUCCESS_NOTICE, "var(--background-primary)");
  }
}

let activeCopyAsImageRunner: RightClickCopyAsImageRunner | null = null;

export function getRightClickCopyAsImageRunner() {
  return activeCopyAsImageRunner;
}

export const rightClickCopyAsImageModule: EmbeddedSubModule = {
  id: "right-click-copy-as-image",
  displayName: "右键复制成图",
  description: "右键卡片/表格/选区/整页复制为 PNG 图片（原 canvas-copy-as-image 插件）",
  defaultEnabled: true,
  replacesExternalPluginId: "canvas-copy-as-image",
  async load(host) {
    const runner = new RightClickCopyAsImageRunner(host);
    activeCopyAsImageRunner = runner;
    host.register(() => {
      if (activeCopyAsImageRunner === runner) {
        activeCopyAsImageRunner = null;
      }
    });
    await runner.start();
  },
};
