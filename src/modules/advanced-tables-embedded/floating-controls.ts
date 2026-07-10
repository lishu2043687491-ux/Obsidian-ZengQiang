import { App, MarkdownView, Notice, setIcon } from 'obsidian';
import { getRightClickCopyAsImageRunner } from '../right-click-copy-as-image';
import {
  ADVANCED_TABLE_ACTION_GROUPS,
  type AdvancedTableAction,
  type AdvancedTableActionId,
} from './actions';

const ACTIVE_CLASS = 'advanced-tables-micro-enhancement-active';
const COLOR_CLASS = 'advanced-tables-color-blocks-enabled';
const ZEBRA_CLASS = 'advanced-tables-zebra-stripes-enabled';

export type AdvancedTablesFloatingControlsHost = {
  app: App;
  runAction: (actionId: AdvancedTableActionId) => Promise<boolean>;
  rememberView: (view: MarkdownView) => void;
  getShowFloatingControls: () => boolean;
  getShowColorBlocks: () => boolean;
  getShowZebraStripes: () => boolean;
  setShowColorBlocks: (value: boolean) => Promise<void>;
  setShowZebraStripes: (value: boolean) => Promise<void>;
};

export class AdvancedTablesFloatingControls {
  private activeTableEl: HTMLTableElement | null = null;
  private tableHandleEl: HTMLButtonElement | null = null;
  private imageHandleEl: HTMLButtonElement | null = null;
  private popoverEl: HTMLDivElement | null = null;
  private positionFrame = 0;

  constructor(private readonly host: AdvancedTablesFloatingControlsHost) {}

  start(): void {
    if (!this.canUseDom()) return;
    document
      .querySelectorAll<HTMLElement>('.mdtp-sidebar-handle, .mdtp-sidebar-popover')
      .forEach((element) => element.remove());
    document.body.classList.add(ACTIVE_CLASS);
    this.updateFromSettings();
    document.addEventListener('pointerdown', this.handlePointerDown, true);
    document.addEventListener('focusin', this.handleFocusIn, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('resize', this.schedulePosition);
    window.addEventListener('scroll', this.schedulePosition, true);
  }

  destroy(): void {
    if (!this.canUseDom()) return;
    document.removeEventListener('pointerdown', this.handlePointerDown, true);
    document.removeEventListener('focusin', this.handleFocusIn, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    window.removeEventListener('resize', this.schedulePosition);
    window.removeEventListener('scroll', this.schedulePosition, true);
    if (this.positionFrame) cancelAnimationFrame(this.positionFrame);
    this.positionFrame = 0;
    this.hideAll();
    this.tableHandleEl?.remove();
    this.imageHandleEl?.remove();
    this.tableHandleEl = null;
    this.imageHandleEl = null;
    document.body.classList.remove(ACTIVE_CLASS, COLOR_CLASS, ZEBRA_CLASS);
  }

  updateFromSettings(): void {
    if (!this.canUseDom()) return;
    document.body.classList.toggle(COLOR_CLASS, this.host.getShowColorBlocks());
    document.body.classList.toggle(
      ZEBRA_CLASS,
      this.host.getShowColorBlocks() && this.host.getShowZebraStripes(),
    );
    if (!this.host.getShowFloatingControls()) {
      this.hideAll();
      return;
    }
    this.ensureHandles();
    this.schedulePosition();
  }

  private canUseDom(): boolean {
    return typeof document !== 'undefined'
      && typeof window !== 'undefined'
      && !!document.body
      && typeof document.body.appendChild === 'function'
      && typeof document.body.classList?.add === 'function'
      && typeof document.body.classList?.remove === 'function'
      && typeof document.body.classList?.toggle === 'function'
      && typeof document.addEventListener === 'function'
      && typeof window.addEventListener === 'function';
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      this.hideAll();
      return;
    }
    if (this.isControlTarget(target)) return;

    // Clicking any content outside this popover closes only the popover first.
    // A table click immediately re-targets the two compact handles to that table.
    this.hidePopover();
    const tableEl = this.findTableFromTarget(target);
    if (tableEl) {
      this.activateTable(tableEl);
      return;
    }
    this.hideAll();
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const target = event.target;
    if (!(target instanceof Element) || this.isControlTarget(target)) return;
    const tableEl = this.findTableFromTarget(target);
    if (tableEl) this.activateTable(tableEl);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.popoverEl) {
      event.stopPropagation();
      this.hidePopover();
    }
  };

  private readonly schedulePosition = (): void => {
    if (this.positionFrame) return;
    this.positionFrame = requestAnimationFrame(() => {
      this.positionFrame = 0;
      this.positionControls();
    });
  };

  private isControlTarget(target: Element): boolean {
    return !!target.closest('.advanced-tables-floating-handle, .advanced-tables-floating-popover');
  }

  private findTableFromTarget(target: Element): HTMLTableElement | null {
    const direct = target.closest('table');
    if (direct instanceof HTMLTableElement) return direct;
    const widget = target.closest('.cm-table-widget, .markdown-preview-section');
    const nested = widget?.querySelector('table');
    return nested instanceof HTMLTableElement ? nested : null;
  }

  private activateTable(tableEl: HTMLTableElement): void {
    if (!this.host.getShowFloatingControls() || !tableEl.isConnected) return;
    const view = this.findMarkdownView(tableEl);
    if (!view) return;
    this.host.rememberView(view);
    this.activeTableEl = tableEl;
    this.ensureHandles();
    this.schedulePosition();
  }

  private findMarkdownView(tableEl: HTMLTableElement): MarkdownView | null {
    for (const leaf of this.host.app.workspace.getLeavesOfType('markdown')) {
      const view = leaf.view as MarkdownView;
      if (view?.contentEl instanceof HTMLElement && view.contentEl.contains(tableEl)) {
        return view;
      }
    }
    return null;
  }

  private ensureHandles(): void {
    if (!this.tableHandleEl) {
      this.tableHandleEl = this.createHandle('table', '表', 'table-2', '打开成熟版表格操作面板');
      this.tableHandleEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.togglePopover();
      });
    }
    if (!this.imageHandleEl) {
      this.imageHandleEl = this.createHandle('image', '图', 'image', '复制当前表格为 PNG 图片');
      this.imageHandleEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.copyActiveTableAsImage();
      });
    }
  }

  private createHandle(kind: 'table' | 'image', label: string, icon: string, title: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'advanced-tables-floating-handle';
    button.dataset.handleKind = kind;
    button.setAttribute('aria-label', title);
    button.title = title;
    button.style.display = 'none';
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    const iconEl = document.createElement('span');
    iconEl.className = 'advanced-tables-floating-handle-icon';
    setIcon(iconEl, icon);
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    button.append(iconEl, labelEl);
    document.body.appendChild(button);
    return button;
  }

  private positionControls(): void {
    if (!this.host.getShowFloatingControls() || !this.activeTableEl?.isConnected) {
      this.hideAll();
      return;
    }

    const rect = this.activeTableEl.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
      this.hideHandles();
      return;
    }

    const left = rect.left >= 64 ? rect.left - 58 : Math.max(8, rect.left + 4);
    const top = Math.max(72, Math.min(window.innerHeight - 64, rect.top + 8));
    this.placeHandle(this.tableHandleEl, left, top);
    this.placeHandle(this.imageHandleEl, left, top + 31);
    this.positionPopover(left, top);
  }

  private placeHandle(handle: HTMLButtonElement | null, left: number, top: number): void {
    if (!handle) return;
    handle.style.left = `${Math.round(left)}px`;
    handle.style.top = `${Math.round(top)}px`;
    handle.style.display = 'flex';
  }

  private positionPopover(handleLeft: number, handleTop: number): void {
    if (!this.popoverEl) return;
    const width = Math.min(356, window.innerWidth - 24);
    const preferredLeft = handleLeft + 58;
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, preferredLeft));
    const height = this.popoverEl.offsetHeight || 420;
    const top = Math.max(72, Math.min(window.innerHeight - Math.min(height, window.innerHeight - 84) - 12, handleTop));
    this.popoverEl.style.left = `${Math.round(left)}px`;
    this.popoverEl.style.top = `${Math.round(top)}px`;
  }

  private togglePopover(): void {
    if (!this.activeTableEl) return;
    if (this.popoverEl) {
      this.hidePopover();
      return;
    }
    this.showPopover();
  }

  private showPopover(): void {
    const popover = document.createElement('div');
    popover.className = 'advanced-tables-floating-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', '成熟版表格操作');

    const heading = document.createElement('div');
    heading.className = 'advanced-tables-floating-title';
    heading.textContent = '成熟版表格操作';
    popover.appendChild(heading);

    const visualSection = this.createSection('显示');
    const colorButton = this.createSpecialButton(
      this.host.getShowColorBlocks() ? '关闭视觉色块' : '显示视觉色块',
      'palette',
      '只改变当前成熟模式下的显示，不写入笔记或表格数据。',
      async () => {
        await this.host.setShowColorBlocks(!this.host.getShowColorBlocks());
        this.updateFromSettings();
        this.hidePopover();
        this.showPopover();
      },
    );
    visualSection.appendChild(colorButton);

    const zebraButton = this.createSpecialButton(
      this.host.getShowZebraStripes() ? '关闭斑马纹' : '启用斑马纹',
      'rows-3',
      '启用后保留表头高亮和斑马纹，并关闭鼠标悬停或编辑焦点所在行的额外高亮。',
      async () => {
        await this.host.setShowZebraStripes(!this.host.getShowZebraStripes());
        this.updateFromSettings();
        this.hidePopover();
        this.showPopover();
      },
    );
    visualSection.appendChild(zebraButton);
    popover.appendChild(visualSection);

    for (const group of ADVANCED_TABLE_ACTION_GROUPS) {
      const section = this.createSection(group.label, group.hint);
      for (const action of group.actions) {
        section.appendChild(this.createActionButton(action));
      }
      popover.appendChild(section);
    }

    document.body.appendChild(popover);
    this.popoverEl = popover;
    this.schedulePosition();
  }

  private createSection(label: string, hint?: string): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'advanced-tables-floating-section';
    const title = document.createElement('div');
    title.className = 'advanced-tables-floating-section-title';
    title.textContent = label;
    if (hint) title.title = hint;
    section.appendChild(title);
    return section;
  }

  private createActionButton(action: AdvancedTableAction): HTMLButtonElement {
    return this.createSpecialButton(action.label, action.icon, action.label, async (button) => {
      button.disabled = true;
      try {
        await this.host.runAction(action.id);
      } finally {
        button.disabled = false;
        this.schedulePosition();
      }
    }, action.danger, action.id);
  }

  private createSpecialButton(
    label: string,
    icon: string,
    title: string,
    onClick: (button: HTMLButtonElement) => Promise<void>,
    danger = false,
    actionId?: AdvancedTableActionId,
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'advanced-tables-floating-action';
    if (danger) button.classList.add('is-danger');
    if (actionId) button.dataset.advancedActionId = actionId;
    button.title = title;
    button.setAttribute('aria-label', label);
    button.addEventListener('pointerdown', (event) => event.preventDefault());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void onClick(button);
    });
    const iconEl = document.createElement('span');
    iconEl.className = 'advanced-tables-floating-action-icon';
    setIcon(iconEl, icon);
    const labelEl = document.createElement('span');
    labelEl.className = 'advanced-tables-floating-action-label';
    labelEl.textContent = label;
    button.append(iconEl, labelEl);
    return button;
  }

  private async copyActiveTableAsImage(): Promise<void> {
    const tableEl = this.activeTableEl;
    if (!tableEl?.isConnected) return;
    const view = this.findMarkdownView(tableEl);
    if (!view) {
      new Notice('没有找到当前表格所在的 Markdown 笔记。');
      return;
    }
    const runner = getRightClickCopyAsImageRunner();
    if (!runner) {
      new Notice('请先启用“右键复制成图”功能。');
      return;
    }
    await runner.copyTableElementAsImage(view, tableEl);
  }

  private hideHandles(): void {
    if (this.tableHandleEl) this.tableHandleEl.style.display = 'none';
    if (this.imageHandleEl) this.imageHandleEl.style.display = 'none';
    this.hidePopover();
  }

  private hidePopover(): void {
    this.popoverEl?.remove();
    this.popoverEl = null;
  }

  private hideAll(): void {
    this.hideHandles();
    this.activeTableEl = null;
  }
}
