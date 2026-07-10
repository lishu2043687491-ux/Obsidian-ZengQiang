import {
  Alignment,
  FormatType,
  ITextEditor,
  Point,
  Range,
  SortOrder,
  TableEditor,
  optionsWithDefaults,
  type Options,
} from "@tgrosinger/md-advanced-tables";

export type AdvancedTableFormatType = "normal" | "weak";

export type AdvancedTableSettings = {
  bindTab: boolean;
  bindEnter: boolean;
  formatType: AdvancedTableFormatType;
  showRibbonIcon: boolean;
};

export type AdvancedTableOperation =
  | "next-cell"
  | "previous-cell"
  | "next-row"
  | "escape-table"
  | "format-table"
  | "format-all-tables"
  | "insert-row"
  | "insert-column"
  | "delete-row"
  | "delete-column"
  | "move-row-up"
  | "move-row-down"
  | "move-column-left"
  | "move-column-right"
  | "left-align-column"
  | "center-align-column"
  | "right-align-column"
  | "sort-rows-ascending"
  | "sort-rows-descending"
  | "transpose"
  | "evaluate-formulas";

export type AdvancedTableCursor = {
  line: number;
  ch: number;
};

export type AdvancedTableRunResult = {
  handled: boolean;
  changed: boolean;
  text: string;
  cursor: AdvancedTableCursor;
  error?: string;
};

export const DEFAULT_ADVANCED_TABLE_SETTINGS: AdvancedTableSettings = {
  bindTab: true,
  bindEnter: true,
  formatType: "weak",
  showRibbonIcon: false,
};

type ObsidianLikeEditor = {
  getValue?: () => string;
  setValue?: (value: string) => void;
  getCursor?: () => { line: number; ch: number };
  setCursor?: (position: { line: number; ch: number }) => void;
  setSelection?: (anchor: { line: number; ch: number }, head: { line: number; ch: number }) => void;
  lastLine?: () => number;
  lineCount?: () => number;
  getLine?: (line: number) => string;
  replaceRange?: (replacement: string, from: { line: number; ch: number }, to?: { line: number; ch: number }) => void;
};

export function normalizeAdvancedTableSettings(input: Partial<AdvancedTableSettings> | null | undefined): AdvancedTableSettings {
  return {
    bindTab: typeof input?.bindTab === "boolean" ? input.bindTab : DEFAULT_ADVANCED_TABLE_SETTINGS.bindTab,
    bindEnter: typeof input?.bindEnter === "boolean" ? input.bindEnter : DEFAULT_ADVANCED_TABLE_SETTINGS.bindEnter,
    formatType: input?.formatType === "normal" ? "normal" : "weak",
    showRibbonIcon:
      typeof input?.showRibbonIcon === "boolean"
        ? input.showRibbonIcon
        : DEFAULT_ADVANCED_TABLE_SETTINGS.showRibbonIcon,
  };
}

export function createAdvancedTableOptions(settings?: Partial<AdvancedTableSettings>): Options {
  const normalized = normalizeAdvancedTableSettings(settings);
  return optionsWithDefaults({
    formatType: normalized.formatType === "weak" ? FormatType.WEAK : FormatType.NORMAL,
    smartCursor: true,
  });
}

export class MemoryAdvancedTableTextEditor extends ITextEditor {
  protected lines: string[];
  protected cursor: Point;
  protected selection: Range | null = null;
  private readonly originalEndsWithNewline: boolean;

  constructor(text: string, cursor: AdvancedTableCursor = { line: 0, ch: 0 }) {
    super();
    this.originalEndsWithNewline = /\r?\n$/.test(text);
    this.lines = text.replace(/\r\n?/g, "\n").split("\n");
    if (this.lines.length > 1 && this.lines[this.lines.length - 1] === "" && this.originalEndsWithNewline) {
      this.lines.pop();
    }
    if (this.lines.length === 0) {
      this.lines = [""];
    }
    this.cursor = new Point(this.clampRow(cursor.line), Math.max(0, cursor.ch));
  }

  getText() {
    const text = this.lines.join("\n");
    return this.originalEndsWithNewline ? `${text}\n` : text;
  }

  getPlainText() {
    return this.lines.join("\n");
  }

  getCursor(): AdvancedTableCursor {
    return { line: this.cursor.row, ch: this.cursor.column };
  }

  getSelection() {
    return this.selection;
  }

  getCursorPosition() {
    return this.cursor;
  }

  setCursorPosition(pos: Point) {
    this.selection = null;
    this.cursor = new Point(this.clampRow(pos.row), Math.max(0, pos.column));
  }

  setSelectionRange(range: Range) {
    this.selection = range;
    this.cursor = range.end;
  }

  getLastRow() {
    return Math.max(0, this.lines.length - 1);
  }

  acceptsTableEdit(row: number) {
    if (row < 0 || row >= this.lines.length) return false;
    let inFence = false;
    for (let index = 0; index < row; index += 1) {
      if (/^\s*(```|~~~)/.test(this.lines[index] ?? "")) {
        inFence = !inFence;
      }
    }
    return !inFence;
  }

  getLine(row: number) {
    return this.lines[row] ?? "";
  }

  insertLine(row: number, line: string) {
    const insertAt = Math.max(0, Math.min(row, this.lines.length));
    this.lines.splice(insertAt, 0, line);
  }

  deleteLine(row: number) {
    if (row < 0 || row >= this.lines.length) return;
    this.lines.splice(row, 1);
    if (this.lines.length === 0) {
      this.lines = [""];
    }
  }

  replaceLines(startRow: number, endRow: number, lines: string[]) {
    const start = Math.max(0, Math.min(startRow, this.lines.length));
    const end = Math.max(start, Math.min(endRow, this.lines.length));
    this.lines.splice(start, end - start, ...lines);
    if (this.lines.length === 0) {
      this.lines = [""];
    }
  }

  transact(func: () => void) {
    func();
  }

  protected clampRow(row: number) {
    return Math.max(0, Math.min(row, Math.max(0, this.lines.length - 1)));
  }
}

export class ObsidianAdvancedTableTextEditor extends MemoryAdvancedTableTextEditor {
  constructor(private readonly editor: ObsidianLikeEditor) {
    super(readEditorText(editor), readEditorCursor(editor));
  }

  transact(func: () => void) {
    const before = this.getPlainText();
    func();
    const after = this.getPlainText();
    if (after !== before) {
      writeEditorText(this.editor, after);
    }
    this.applyCursorOrSelection();
  }

  private applyCursorOrSelection() {
    const selection = this.getSelection();
    if (selection && typeof this.editor.setSelection === "function") {
      this.editor.setSelection(pointToEditorPos(selection.start), pointToEditorPos(selection.end));
      return;
    }
    if (typeof this.editor.setCursor === "function") {
      this.editor.setCursor(pointToEditorPos(this.getCursorPosition()));
    }
  }
}

export function runAdvancedTableOperationOnText(
  text: string,
  cursor: AdvancedTableCursor,
  operation: AdvancedTableOperation,
  settings?: Partial<AdvancedTableSettings>
): AdvancedTableRunResult {
  const adapter = new MemoryAdvancedTableTextEditor(text, cursor);
  const before = adapter.getText();
  const handled = runAdvancedTableOperation(adapter, operation, settings);
  return {
    handled,
    changed: before !== adapter.getText(),
    text: adapter.getText(),
    cursor: adapter.getCursor(),
  };
}

export function runAdvancedTableOperationOnEditor(
  editor: ObsidianLikeEditor,
  operation: AdvancedTableOperation,
  settings?: Partial<AdvancedTableSettings>
) {
  const adapter = new ObsidianAdvancedTableTextEditor(editor);
  return runAdvancedTableOperation(adapter, operation, settings);
}

export function exportAdvancedTableCsvFromText(
  text: string,
  cursor: AdvancedTableCursor,
  withHeaders: boolean,
  settings?: Partial<AdvancedTableSettings>
) {
  const adapter = new MemoryAdvancedTableTextEditor(text, cursor);
  return exportAdvancedTableCsv(adapter, withHeaders, settings);
}

export function exportAdvancedTableCsvFromEditor(
  editor: ObsidianLikeEditor,
  withHeaders: boolean,
  settings?: Partial<AdvancedTableSettings>
) {
  const adapter = new ObsidianAdvancedTableTextEditor(editor);
  return exportAdvancedTableCsv(adapter, withHeaders, settings);
}

export function runAdvancedTableOperation(
  adapter: ITextEditor,
  operation: AdvancedTableOperation,
  settings?: Partial<AdvancedTableSettings>
) {
  const options = createAdvancedTableOptions(settings);
  const tableEditor = new TableEditor(adapter);
  const canRunCurrentTable =
    tableEditor.cursorIsInTable(options) || tableEditor.cursorIsInTableFormula(options);
  if (!canRunCurrentTable && operation !== "format-all-tables") {
    return false;
  }

  switch (operation) {
    case "next-cell":
      tableEditor.nextCell(options);
      break;
    case "previous-cell":
      tableEditor.previousCell(options);
      break;
    case "next-row":
      tableEditor.nextRow(options);
      break;
    case "escape-table":
      tableEditor.escape(options);
      break;
    case "format-table":
      tableEditor.format(options);
      break;
    case "format-all-tables":
      tableEditor.formatAll(options);
      break;
    case "insert-row":
      tableEditor.insertRow(options);
      break;
    case "insert-column":
      tableEditor.insertColumn(options);
      break;
    case "delete-row":
      tableEditor.deleteRow(options);
      break;
    case "delete-column":
      tableEditor.deleteColumn(options);
      break;
    case "move-row-up":
      tableEditor.moveRow(-1, options);
      break;
    case "move-row-down":
      tableEditor.moveRow(1, options);
      break;
    case "move-column-left":
      tableEditor.moveColumn(-1, options);
      break;
    case "move-column-right":
      tableEditor.moveColumn(1, options);
      break;
    case "left-align-column":
      tableEditor.alignColumn(Alignment.LEFT, options);
      break;
    case "center-align-column":
      tableEditor.alignColumn(Alignment.CENTER, options);
      break;
    case "right-align-column":
      tableEditor.alignColumn(Alignment.RIGHT, options);
      break;
    case "sort-rows-ascending":
      tableEditor.sortRows(SortOrder.Ascending, options);
      break;
    case "sort-rows-descending":
      tableEditor.sortRows(SortOrder.Descending, options);
      break;
    case "transpose":
      tableEditor.transpose(options);
      break;
    case "evaluate-formulas": {
      const error = tableEditor.evaluateFormulas(options);
      if (error) throw error;
      break;
    }
    default:
      return false;
  }

  return true;
}

export function exportAdvancedTableCsv(
  adapter: ITextEditor,
  withHeaders: boolean,
  settings?: Partial<AdvancedTableSettings>
) {
  const options = createAdvancedTableOptions(settings);
  const tableEditor = new TableEditor(adapter);
  if (!tableEditor.cursorIsInTable(options)) {
    return undefined;
  }
  return tableEditor.exportCSV(withHeaders, options);
}

function readEditorText(editor: ObsidianLikeEditor) {
  if (typeof editor.getValue === "function") {
    return editor.getValue();
  }

  const lastLine = getEditorLastLine(editor);
  const lines: string[] = [];
  for (let line = 0; line <= lastLine; line += 1) {
    lines.push(editor.getLine?.(line) ?? "");
  }
  return lines.join("\n");
}

function writeEditorText(editor: ObsidianLikeEditor, text: string) {
  if (typeof editor.setValue === "function") {
    editor.setValue(text);
    return;
  }

  const lastLine = getEditorLastLine(editor);
  if (typeof editor.replaceRange === "function") {
    editor.replaceRange(text, { line: 0, ch: 0 }, { line: lastLine, ch: editor.getLine?.(lastLine)?.length ?? 0 });
  }
}

function readEditorCursor(editor: ObsidianLikeEditor): AdvancedTableCursor {
  const cursor = editor.getCursor?.();
  return {
    line: cursor?.line ?? 0,
    ch: cursor?.ch ?? 0,
  };
}

function getEditorLastLine(editor: ObsidianLikeEditor) {
  if (typeof editor.lastLine === "function") {
    return Math.max(0, editor.lastLine());
  }
  if (typeof editor.lineCount === "function") {
    return Math.max(0, editor.lineCount() - 1);
  }
  return 0;
}

function pointToEditorPos(point: Point) {
  return {
    line: point.row,
    ch: point.column,
  };
}
