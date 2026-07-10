import { icons } from './icons';
import { TableEditorPluginSettings } from './settings';
import { TableEditor } from './table-editor';
import {
  Editor,
  ItemView,
  MarkdownView,
  Notice,
  WorkspaceLeaf,
} from 'obsidian';

export const TableControlsViewType = 'advanced-tables-toolbar';

export class TableControlsView extends ItemView {
  private readonly settings: TableEditorPluginSettings;
  private readonly resolveMarkdownView: () => MarkdownView | null;

  constructor(
    leaf: WorkspaceLeaf,
    settings: TableEditorPluginSettings,
    resolveMarkdownView: () => MarkdownView | null,
  ) {
    super(leaf);
    this.settings = settings;
    this.resolveMarkdownView = resolveMarkdownView;
  }

  public getViewType(): string {
    return TableControlsViewType;
  }

  public getDisplayText(): string {
    return '成熟版表格工具栏';
  }

  public getIcon(): string {
    return 'spreadsheet';
  }

  public load(): void {
    super.load();
    this.draw();
  }

  private readonly draw = (): void => {
    const container = this.containerEl.children[1];

    const rootEl = activeDocument.createElement('div');
    rootEl.addClass('advanced-tables-buttons');

    rootEl.createDiv().
      createSpan({ cls: 'title' }).
      setText('成熟版表格工具栏')

    const navHeader = rootEl.createDiv({ cls: 'nav-header' });
    const rowOneBtns = navHeader.createDiv({ cls: 'nav-buttons-container' });
    rowOneBtns.createSpan({ cls: 'advanced-tables-row-label' }).setText('对齐：');
    this.drawBtn(rowOneBtns, 'alignLeft', '当前列左对齐', (te) =>
      te.leftAlignColumn(),
    );
    this.drawBtn(rowOneBtns, 'alignCenter', '当前列居中对齐', (te) =>
      te.centerAlignColumn(),
    );
    this.drawBtn(rowOneBtns, 'alignRight', '当前列右对齐', (te) =>
      te.rightAlignColumn(),
    );

    const rowTwoBtns = navHeader.createDiv({ cls: 'nav-buttons-container' });
    rowTwoBtns.createSpan({ cls: 'advanced-tables-row-label' }).setText('移动：');
    this.drawBtn(rowTwoBtns, 'moveRowDown', '当前行下移', (te) =>
      te.moveRowDown(),
    );
    this.drawBtn(rowTwoBtns, 'moveRowUp', '当前行上移', (te) =>
      te.moveRowUp(),
    );
    this.drawBtn(rowTwoBtns, 'moveColumnRight', '当前列右移', (te) =>
      te.moveColumnRight(),
    );
    this.drawBtn(rowTwoBtns, 'moveColumnLeft', '当前列左移', (te) =>
      te.moveColumnLeft(),
    );
    this.drawBtn(rowTwoBtns, 'transpose', '转置当前表格', (te) =>
      te.transpose(),
    );

    const rowThreeBtns = navHeader.createDiv({ cls: 'nav-buttons-container' });
    rowThreeBtns.createSpan({ cls: 'advanced-tables-row-label' }).setText('编辑：');
    this.drawBtn(rowThreeBtns, 'insertRow', '在上方插入行', (te) =>
      te.insertRow(),
    );
    this.drawBtn(rowThreeBtns, 'insertColumn', '在左侧插入列', (te) =>
      te.insertColumn(),
    );
    this.drawBtn(rowThreeBtns, 'deleteRow', '删除当前行', (te) =>
      te.deleteRow(),
    );
    this.drawBtn(rowThreeBtns, 'deleteColumn', '删除当前列', (te) =>
      te.deleteColumn(),
    );

    const rowFourBtns = navHeader.createDiv({ cls: 'nav-buttons-container' });
    rowFourBtns.createSpan({ cls: 'advanced-tables-row-label' }).setText('排序：');
    this.drawBtn(rowFourBtns, 'sortAsc', '按当前列升序排序', (te) =>
      te.sortRowsAsc(),
    );
    this.drawBtn(rowFourBtns, 'sortDesc', '按当前列降序排序', (te) =>
      te.sortRowsDesc(),
    );
    this.drawBtn(rowFourBtns, 'formula', '计算表格公式', (te) =>
      te.evaluateFormulas(),
    );

    const rowFiveBtns = navHeader.createDiv({ cls: 'nav-buttons-container' });
    rowFiveBtns.createSpan({ cls: 'advanced-tables-row-label' }).setText('其他：');
    this.drawBtn(rowFiveBtns, 'csv', '导出逗号分隔文本', (te) =>
      te.exportCSVModal(),
    );
    this.drawBtn(rowFiveBtns, 'help', '查看说明', () => {
      new Notice('成熟版表格增强支持跳格、格式化、增删移动、排序、转置、公式计算和导出逗号分隔文本。');
    });

    container.empty();
    container.appendChild(rootEl);
  };

  private readonly drawBtn = (
    parent: HTMLDivElement,
    iconName: string,
    title: string,
    fn: (te: TableEditor) => void,
  ): void => {
    const cursorCheck = (te: TableEditor): boolean => {
      if (title === '计算表格公式') {
        return te.cursorIsInTable() || te.cursorIsInTableFormula();
      }
      return te.cursorIsInTable();
    };

    const button = parent.createDiv({ cls: 'advanced-tables-button nav-action-button', title });
    button.onClickEvent(() => this.withTE(fn, cursorCheck));
    button.appendChild(Element(icons[iconName]));
  };

  private readonly withTE = (
    fn: (te: TableEditor) => void,
    cursorCheck: (te: TableEditor) => boolean,
    alertOnNoTable = true,
  ): void => {
    const view = this.resolveMarkdownView();
    if (!view?.file || !view.editor) {
      console.warn('成熟版表格增强：无法定位当前编辑器。');
      new Notice('请先打开一篇 Markdown 笔记，并把光标放到表格里。');
      return;
    }

    const editor: Editor = view.editor;
    const te = new TableEditor(this.app, view.file, editor, this.settings);
    if (!cursorCheck(te)) {
      if (alertOnNoTable) {
        new Notice('请先把光标放到 Markdown 表格里。');
      }
      return;
    }

    fn(te);
  };
}

/**
 * Convert an svg string into an HTML element.
 *
 * @param svgText svg image as a string
 */
const Element = (svgText: string): HTMLElement => {
  const parser = new DOMParser();
  return parser.parseFromString(svgText, 'text/xml').documentElement;
};
