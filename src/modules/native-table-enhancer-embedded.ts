import {
  MarkdownPostProcessorContext,
  MarkdownView,
  Menu,
  Modal,
  Notice,
  Plugin,
  TFile,
  normalizePath,
} from "obsidian";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import {
  buildNativeAutoFillValues,
  containsNativeLatex,
  evaluateNativeTableFormula,
} from "./native-table-video-helpers";
import {
  DEFAULT_ADVANCED_TABLE_SETTINGS,
  exportAdvancedTableCsvFromEditor,
  normalizeAdvancedTableSettings,
  runAdvancedTableOperationOnEditor,
  type AdvancedTableFormatType,
  type AdvancedTableOperation,
  type AdvancedTableSettings,
} from "./native-table-advanced-helpers";

const PLUGIN_ID = "markdown-table-enhancer";
const TEMPLATE_LIBRARY_FOLDER = ".模板库";
const INITIALIZE_COMMAND_NAME = "为当前文件全部表格启用原生表格增强（批量）";
const INITIALIZE_CURRENT_TABLE_COMMAND_NAME = "对当前表格美化";
const INITIALIZE_CURRENT_TABLE_LAYOUT_COMMAND_ID = "initialize-current-table-native-layout";
const INITIALIZE_CURRENT_TABLE_LAYOUT_COMMAND_NAME = "对当前表格美化";
const INSERT_NATIVE_COLOR_TABLE_COMMAND_ID = "insert-native-color-table-template";
const INSERT_NATIVE_COLOR_TABLE_COMMAND_NAME = "插入彩色原生空表格";
const MIGRATE_CURRENT_FILE_TABLE_MARKERS_COMMAND_ID = "migrate-current-file-table-markers-to-markerless";
const MIGRATE_CURRENT_FILE_TABLE_MARKERS_COMMAND_NAME = "清理当前笔记旧表格标记";
const SET_NATIVE_ROW_COLOR_COMMAND_ID = "set-current-native-table-row-color";
const SET_NATIVE_ROW_COLOR_COMMAND_NAME = "设置当前原生表格选区填充颜色";
const OPEN_NATIVE_ROW_BANDS_COMMAND_ID = "open-current-native-table-row-bands";
const OPEN_NATIVE_ROW_BANDS_COMMAND_NAME = "打开当前原生表格行段配色";
const INSERT_TEMPLATE_COMMAND_NAME = "插入原生表格模板";
const OPEN_TEMPLATE_LIBRARY_COMMAND_ID = "open-template-library";
const OPEN_TEMPLATE_LIBRARY_COMMAND_NAME = "模板库";
const RESTORE_COMMAND_NAME = "恢复当前文件最近一次表格增强快照";
const STATUS_COMMAND_NAME = "查看当前文件表格增强状态";
const SET_SELECTION_YELLOW_COMMAND_ID = "set-current-table-selection-yellow";
const SET_SELECTION_YELLOW_COMMAND_NAME = "将当前表格选区设为浅黄";
const CLEAR_SELECTION_COLOR_COMMAND_ID = "clear-current-table-selection-color";
const CLEAR_SELECTION_COLOR_COMMAND_NAME = "清除当前表格选区颜色";
const PASTE_IMAGE_COMMAND_NAME = "将剪贴板图片粘贴到当前原生表格单元格";
const PASTE_ONENOTE_RICH_TABLE_COMMAND_ID = "paste-onenote-rich-table";
const PASTE_ONENOTE_RICH_TABLE_COMMAND_NAME = "粘贴OneNote";
const TOGGLE_EXPERIMENTAL_FEATURE_GATE_COMMAND_NAME = "切换原生表格测试版能力";
const ADVANCED_TABLE_CONTROL_BAR_COMMAND_ID = "table-control-bar";
const ADVANCED_TABLE_CONTROL_BAR_COMMAND_NAME = "打开 Advanced Tables 表格控制栏";
const ADVANCED_TABLE_EXPORT_CSV_WITH_HEADERS_COMMAND_ID = "export-csv";
const ADVANCED_TABLE_EXPORT_CSV_WITHOUT_HEADERS_COMMAND_ID = "export-csv-without-headers";
const ADVANCED_TABLE_EXPORT_CSV_WITH_HEADERS_COMMAND_NAME = "导出当前表格 CSV";
const ADVANCED_TABLE_EXPORT_CSV_WITHOUT_HEADERS_COMMAND_NAME = "导出当前表格 CSV（不含表头）";
const SNAPSHOT_LIMIT = 60;
const TABLE_ID_PREFIX = "tbl_";
const HTML_TABLE_MARKER_RE = /^\s*<!--\s*mdtp:(tbl_[a-z0-9_-]+)\s*-->\s*$/i;
const OBSIDIAN_TABLE_MARKER_RE = /^\s*%%\s*mdtp:(tbl_[a-z0-9_-]+)\s*%%\s*$/i;
const REFERENCE_TABLE_MARKER_RE = /^\s*\[\/\/\]:\s*#\s*\(mdtp:(tbl_[a-z0-9_-]+)\)\s*$/i;
const VISIBLE_REFERENCE_TABLE_MARKER_RE = /^\s*\/\/\s*#\s*\(mdtp:(tbl_[a-z0-9_-]+)\)\s*$/i;
const TEMPLATE_TABLE_METADATA_RE = /^\s*%%\s*mdtp-template:(\{.*\})\s*%%\s*$/i;
const PALETTE = [
  { label: "浅黄", value: "#FFF3BF" },
  { label: "浅蓝", value: "#D0EBFF" },
  { label: "浅绿", value: "#D3F9D8" },
  { label: "浅红", value: "#FFE3E3" },
  { label: "浅灰", value: "#F1F3F5" },
];
const TEXT_COLOR_PALETTE = [
  { label: "默认橙色", value: "#ED7D31" },
  { label: "黑色", value: "#111111" },
  { label: "深灰", value: "#595959" },
  { label: "蓝色", value: "#2F75B5" },
  { label: "绿色", value: "#548235" },
  { label: "红色", value: "#C00000" },
];
const NATIVE_COLOR_PRESET_BLUE_ZEBRA = "blueZebra";
const NATIVE_COLOR_DEFAULT_PRESET_ID = "green";
const NATIVE_COLOR_TABLE_HEADER = "#A9D18E";
const NATIVE_COLOR_TABLE_LEGACY_HEADER = "#2F5F9F";
const NATIVE_COLOR_TABLE_HEADER_TEXT = "#111111";
const NATIVE_COLOR_TABLE_BASE_ROW = "#FFFFFF";
const NATIVE_COLOR_TABLE_ALT_ROW = "#E2F0D9";
const NATIVE_LAYOUT_CURRENT_TABLE_LABEL = "对当前表格美化";
const NATIVE_LAYOUT_PAGE_TABLES_LABEL = "对本页面所有的表格美化";
const NATIVE_LAYOUT_TABLE_STYLE_LABEL = "套用表格样式";
const NATIVE_LAYOUT_CLEAR_TABLE_STYLE_LABEL = "取消斑马样式";
const NATIVE_LAYOUT_ROW_COLOR_LABEL = "填充颜色";
const NATIVE_LAYOUT_ROW_BANDS_LABEL = "行段配色";
const NATIVE_LAYOUT_BORDER_ENABLE_LABEL = "开启边框样式";
const NATIVE_LAYOUT_BORDER_DISABLE_LABEL = "关闭边框样式";
const NATIVE_LAYOUT_SCALE_LABEL = "整体比例";
const NATIVE_LAYOUT_SIZE_LABEL = "尺寸调节";
const NATIVE_LAYOUT_TEXT_COLOR_LABEL = "文字颜色";
const NATIVE_LAYOUT_CLEAR_TEXT_COLOR_LABEL = "恢复文字颜色";
const NATIVE_LAYOUT_FORMULA_HELP_LABEL = "公式提示";
const NATIVE_LAYOUT_ALIGN_LEFT_LABEL = "居左";
const NATIVE_LAYOUT_ALIGN_CENTER_LABEL = "居中";
const NATIVE_LAYOUT_ALIGN_RIGHT_LABEL = "居右";
const NATIVE_LAYOUT_FILL_DOWN_LABEL = "向下自动填充";
const NATIVE_LAYOUT_FILL_RIGHT_LABEL = "向右自动填充";
const MIN_COLUMN_WIDTH = 60;
const MIN_ROW_HEIGHT = 28;
const MAX_COLUMN_WIDTH = 640;
const MAX_ROW_HEIGHT = 120;
const NATIVE_TABLE_DEFAULT_SCALE = 1;
const NATIVE_TABLE_MIN_SCALE = 0.75;
const NATIVE_TABLE_MAX_SCALE = 1.5;
const NATIVE_TABLE_DEFAULT_COLUMN_WIDTH = 170;
const NATIVE_TABLE_DEFAULT_ROW_HEIGHT = 34;
const NATIVE_TABLE_DEFAULT_TEXT_COLOR = "#ED7D31";
const DRAGGER_HANDLE_SELECTOR = ".dnd-drag-handle[data-block-start]";
const HISTORY_LIMIT = 100;
const PASTE_EVENT_SUPPRESSION_MS = 2000;
const DEFAULT_CELL_IMAGE_WIDTH = 220;
const HIDDEN_MARKER_LINE_DECORATION = Decoration.line({
  class: "mdtp-hidden-marker-line",
});

const ADVANCED_TABLE_COMMANDS: Array<{
  id: AdvancedTableOperation;
  name: string;
}> = [
  { id: "next-cell", name: "跳到下一个表格单元格" },
  { id: "previous-cell", name: "跳到上一个表格单元格" },
  { id: "next-row", name: "跳到下一行表格单元格" },
  { id: "format-table", name: "格式化当前表格" },
  { id: "format-all-tables", name: "格式化当前文件全部表格" },
  { id: "insert-row", name: "在当前表格插入行" },
  { id: "insert-column", name: "在当前表格插入列" },
  { id: "delete-row", name: "删除当前表格行" },
  { id: "delete-column", name: "删除当前表格列" },
  { id: "move-row-up", name: "当前表格行上移" },
  { id: "move-row-down", name: "当前表格行下移" },
  { id: "move-column-left", name: "当前表格列左移" },
  { id: "move-column-right", name: "当前表格列右移" },
  { id: "left-align-column", name: "当前表格列左对齐" },
  { id: "center-align-column", name: "当前表格列居中对齐" },
  { id: "right-align-column", name: "当前表格列右对齐" },
  { id: "sort-rows-ascending", name: "按当前列升序排序表格" },
  { id: "sort-rows-descending", name: "按当前列降序排序表格" },
  { id: "transpose", name: "转置当前表格" },
  { id: "evaluate-formulas", name: "计算当前表格公式" },
  { id: "escape-table", name: "跳出当前表格" },
];

type TableMergeMetadata = {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
};

type NativeColorBuiltInPresetId = "blue" | "green";
type NativeColorPresetId = NativeColorBuiltInPresetId | "custom" | string;

type NativeColorPalette = {
  header: string;
  headerText: string;
  baseRow: string;
  altRow: string;
  border: string;
};

type NativeColorSavedPalette = {
  id: string;
  label: string;
  palette: NativeColorPalette;
  createdAt: number;
  updatedAt: number;
};

type TableLayoutMetadata = {
  colWidths: Record<string, number>;
  rowHeights: Record<string, number>;
  cellColors: Record<string, string>;
  rowColors: Record<string, string>;
  colColors: Record<string, string>;
  cellTextColors: Record<string, string>;
  cellAlignments: Record<string, "left" | "center" | "right">;
  cellImageWidths: Record<string, number>;
  merges: TableMergeMetadata[];
  tableScale?: number;
  nativeColorPreset?: "blueZebra";
  nativeColorPalette?: NativeColorPalette;
  nativeBorderEnabled?: boolean;
};

type NativeTableIdentity = {
  tableIndex: number;
  tableHash: string;
  headerHash: string;
  structureHash: string;
  rowCount: number;
  columnCount: number;
  startLine: number;
  endLine: number;
};

type NativeTableSizeBase = {
  colWidths: Record<string, number>;
  rowHeights: Record<string, number>;
};

type TableRecordMode = "enhanced" | "nativeLayout";

type TableRecord = {
  tableId: string;
  mode?: TableRecordMode;
  markerless?: boolean;
  identity?: NativeTableIdentity;
  filePath: string;
  createdAt: number;
  updatedAt: number;
  lastKnownHash: string;
  lastKnownRange: {
    startLine: number;
    endLine: number;
  };
  layout: TableLayoutMetadata;
};

type SnapshotRecord = {
  snapshotId: string;
  filePath: string;
  createdAt: number;
  reason: string;
  tableIds: string[];
  backupPath: string;
  tableRecords: Record<string, TableRecord>;
};

type PluginDataShape = {
  version: 1;
  tables: Record<string, TableRecord>;
  snapshots: SnapshotRecord[];
  experimentalFeatureGate?: boolean;
  nativeColorDefaultPresetId?: NativeColorPresetId;
  nativeColorCustomPalette?: NativeColorPalette;
  nativeColorSavedPalettes?: NativeColorSavedPalette[];
  nativeTableDefaultScale?: number;
  nativeTableDefaultColumnWidth?: number;
  nativeTableDefaultRowHeight?: number;
  nativeTableDefaultTextColor?: string;
  nativeTableDefaultZebraEnabled?: boolean;
  nativeTableDefaultBorderEnabled?: boolean;
  nativeTableDefaultHeaderAlignment?: NativeTableAutoAlignment;
  nativeTableDefaultFirstColumnAlignment?: NativeTableAutoAlignment;
  advancedTableBindTab?: boolean;
  advancedTableBindEnter?: boolean;
  advancedTableFormatType?: AdvancedTableFormatType;
  advancedTableShowRibbonIcon?: boolean;
};

type NativeTableAutoAlignment = "off" | "left" | "center" | "right";
type NativeLayoutRangeMode = "selection" | "row" | "column";

type TemplateRecord = {
  name: string;
  path: string;
  folderPath: string;
  relativePath: string;
  folderSegments: string[];
};

type TemplateTreeNode = {
  folders: Map<string, TemplateTreeNode>;
  templates: TemplateRecord[];
};

type TemplateTableMetadata = {
  version: 1;
  tableOrder?: string[];
  tables: Record<
    string,
    {
      mode?: TableRecordMode;
      layout?: Partial<TableLayoutMetadata>;
    }
  >;
};

type HistoryState = {
  filePath: string;
  content: string;
  tableRecords: Record<string, TableRecord>;
};

type HistoryEntry = {
  label: string;
  filePath: string;
  tableIds: string[];
  before: HistoryState;
  after: HistoryState;
};

type ParsedTableBlock = {
  startLine: number;
  endLine: number;
  markerLine: number | null;
  tableId: string | null;
  raw: string;
};

type OneNoteConvertedContent = {
  content: string;
  tableRecords: TableRecord[];
};

type OneNoteTableConversion = {
  markdown: string;
  record: TableRecord;
};

const NATIVE_COLOR_PRESET_PALETTES: Record<NativeColorBuiltInPresetId, NativeColorPalette & { label: string }> = {
  blue: {
    label: "蓝色 / 浅蓝",
    header: "#9CC2E5",
    headerText: "#111111",
    baseRow: "#FFFFFF",
    altRow: "#EAF3FF",
    border: "#9FBAD8",
  },
  green: {
    label: "绿色 / 浅绿",
    header: NATIVE_COLOR_TABLE_HEADER,
    headerText: NATIVE_COLOR_TABLE_HEADER_TEXT,
    baseRow: NATIVE_COLOR_TABLE_BASE_ROW,
    altRow: NATIVE_COLOR_TABLE_ALT_ROW,
    border: "#9EAD93",
  },
};

const NATIVE_COLOR_CUSTOM_DEFAULT: NativeColorPalette = {
  header: "#A9D18E",
  headerText: "#111111",
  baseRow: "#FFFFFF",
  altRow: "#E2F0D9",
  border: "#9EAD93",
};

type CellCoord = {
  row: number;
  col: number;
};

type SelectionRect = {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
};

type ResizeState =
  | {
      kind: "column";
      tableEl: HTMLTableElement;
      tableId: string;
      file: TFile;
      index: number;
      startClient: number;
      startSize: number;
    }
  | {
      kind: "row";
      tableEl: HTMLTableElement;
      tableId: string;
      file: TFile;
      index: number;
      startClient: number;
      startSize: number;
    }
  | {
      kind: "scale";
      tableEl: HTMLTableElement;
      tableId: string;
      file: TFile;
      startClientX: number;
      startClientY: number;
      startScale: number;
      currentScale: number;
      sizeBase: NativeTableSizeBase;
    };

type SelectionDragState = {
  tableEl: HTMLTableElement;
  anchor: CellCoord;
};

type AutoFillDragState = {
  tableEl: HTMLTableElement;
  tableId: string;
  file: TFile;
  sourceCoord: CellCoord;
  targetCoord: CellCoord | null;
};

type TableRuntimeState = {
  file: TFile;
  parsedTable: ParsedTableBlock | null;
  selection: SelectionRect | null;
  anchor: CellCoord | null;
};

type TableStructure = {
  rows: HTMLTableRowElement[];
  matrix: HTMLTableCellElement[][];
};

type TableContextTarget = {
  at: number;
  filePath: string;
  tableEl: HTMLTableElement;
  target: HTMLElement;
  x: number;
  y: number;
};

type UninitializedTableContext = {
  file: TFile;
  parsedTable: ParsedTableBlock;
  coord: CellCoord;
  tableEl?: HTMLTableElement | null;
};

type NativeTableSidebarContext = {
  mode: "native";
  file: TFile;
  parsedTable: ParsedTableBlock;
  coord: CellCoord;
  tableEl: HTMLTableElement;
};

type NativeLayoutTableSidebarContext = {
  mode: "nativeLayout";
  file: TFile;
  tableId: string;
  parsedTable: ParsedTableBlock | null;
  selection: SelectionRect | null;
  coord: CellCoord;
  tableEl: HTMLTableElement;
};

type EnhancedTableSidebarContext = {
  mode: "enhanced";
  file: TFile;
  tableId: string;
  parsedTable: ParsedTableBlock | null;
  selection: SelectionRect | null;
  coord: CellCoord;
  tableEl: HTMLTableElement;
};

type TableSidebarContext = NativeTableSidebarContext | NativeLayoutTableSidebarContext | EnhancedTableSidebarContext;

type ParsedRawTable = {
  header: string[];
  divider: string[];
  body: string[][];
};

type InlineEditorState = {
  tableEl: HTMLTableElement;
  file: TFile;
  tableId: string | null;
  parsedTable: ParsedTableBlock | null;
  cell: HTMLTableCellElement;
  row: HTMLTableRowElement;
  coord: CellCoord;
  wrapper: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  imageContainer: HTMLDivElement;
  imageMarkups: string[];
  initialValue: string;
  originalRowHeight: string;
  originalRowMinHeight: string;
  originalCellHeight: string;
  originalCellMinHeight: string;
  layoutFrame: number | null;
  closing: boolean;
};

type ImagePreviewTarget = {
  displayPath: string;
  resourcePath: string;
  width?: number;
};

type ImageToolbarState = {
  tableEl: HTMLTableElement;
  file: TFile;
  tableId: string;
  coord: CellCoord;
  cell: HTMLTableCellElement;
  root: HTMLDivElement;
};

type ImageManipulatorState = {
  tableEl: HTMLTableElement;
  file: TFile;
  tableId: string;
  coord: CellCoord;
  cell: HTMLTableCellElement;
  imageEl: HTMLImageElement;
  root: HTMLDivElement;
  resizeHandle: HTMLButtonElement;
  deleteButton: HTMLButtonElement;
};

type ImageDragState = {
  manipulator: ImageManipulatorState;
  startClientX: number;
  startWidth: number;
  previewWidth: number;
};

const DEFAULT_DATA: PluginDataShape = {
  version: 1,
  tables: {},
  snapshots: [],
  experimentalFeatureGate: false,
  nativeColorDefaultPresetId: NATIVE_COLOR_DEFAULT_PRESET_ID,
  nativeColorCustomPalette: NATIVE_COLOR_CUSTOM_DEFAULT,
  nativeColorSavedPalettes: [],
  nativeTableDefaultScale: NATIVE_TABLE_DEFAULT_SCALE,
  nativeTableDefaultColumnWidth: NATIVE_TABLE_DEFAULT_COLUMN_WIDTH,
  nativeTableDefaultRowHeight: NATIVE_TABLE_DEFAULT_ROW_HEIGHT,
  nativeTableDefaultTextColor: NATIVE_TABLE_DEFAULT_TEXT_COLOR,
  nativeTableDefaultZebraEnabled: true,
  nativeTableDefaultBorderEnabled: false,
  nativeTableDefaultHeaderAlignment: "center",
  nativeTableDefaultFirstColumnAlignment: "left",
  advancedTableBindTab: DEFAULT_ADVANCED_TABLE_SETTINGS.bindTab,
  advancedTableBindEnter: DEFAULT_ADVANCED_TABLE_SETTINGS.bindEnter,
  advancedTableFormatType: DEFAULT_ADVANCED_TABLE_SETTINGS.formatType,
  advancedTableShowRibbonIcon: DEFAULT_ADVANCED_TABLE_SETTINGS.showRibbonIcon,
};

type SidebarActionDescriptor = {
  label: string;
  wide?: boolean;
  experimental?: boolean;
};

type SidebarPopoverAction = {
  label: string;
  run: () => void | Promise<void>;
  wide?: boolean;
};

type SidebarPopoverCategory = {
  id: string;
  label: string;
  actions: SidebarPopoverAction[];
  render?: (panel: HTMLElement) => void;
};

type SyncTableRecordsOptions = {
  forceMode?: TableRecordMode;
  modeOverrides?: Record<string, TableRecordMode>;
};

class TemplateNameModal extends Modal {
  private hiddenMetadataPrefix: string;
  private visibleTemplateContent: string;
  private previewTextarea: HTMLTextAreaElement | null = null;

  constructor(
    private plugin: MarkdownTableEnhancerPlugin,
    private templateContent: string
  ) {
    super(plugin.app);
    const split = this.plugin.splitTemplateContentForPreview(templateContent);
    this.hiddenMetadataPrefix = split.hiddenPrefix;
    this.visibleTemplateContent = split.visible;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-template-modal");

    const title = document.createElement("h2");
    title.textContent = "保存为模板";
    contentEl.appendChild(title);

    const label = document.createElement("label");
    label.className = "mdtp-template-field";
    const labelText = document.createElement("span");
    labelText.textContent = "模板名称";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "例如：周计划表格";
    input.className = "mdtp-template-input";
    label.append(labelText, input);
    contentEl.appendChild(label);

    const previewLabel = document.createElement("label");
    previewLabel.className = "mdtp-template-field";
    const previewLabelText = document.createElement("span");
    previewLabelText.textContent = "模板内容（可编辑）";
    const preview = document.createElement("textarea");
    preview.className = "mdtp-template-preview";
    preview.value = this.visibleTemplateContent;
    preview.readOnly = false;
    previewLabel.append(previewLabelText, preview);
    contentEl.appendChild(previewLabel);
    this.previewTextarea = preview;

    const actions = document.createElement("div");
    actions.className = "mdtp-template-actions";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "取消";
    cancelButton.addEventListener("click", () => this.close());
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "mod-cta";
    saveButton.textContent = "保存";
    saveButton.addEventListener("click", () => void this.submit(input.value));
    actions.append(cancelButton, saveButton);
    contentEl.appendChild(actions);

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void this.submit(input.value);
    });
    window.setTimeout(() => input.focus(), 50);
  }

  onClose() {
    this.contentEl.replaceChildren();
    this.previewTextarea = null;
  }

  private async submit(rawName: string) {
    const name = rawName.trim();
    if (!name) {
      new Notice("请先填写模板名称");
      return;
    }
    const visibleValue = this.previewTextarea?.value ?? this.visibleTemplateContent;
    const finalContent = this.plugin.combineTemplateContentForSave(this.hiddenMetadataPrefix, visibleValue);
    const created = await this.plugin.createTemplateFromContent(name, finalContent);
    if (created) this.close();
  }
}

class TemplateCreateModal extends Modal {
  constructor(
    private plugin: MarkdownTableEnhancerPlugin,
    private onCreated?: () => void | Promise<void>
  ) {
    super(plugin.app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-template-modal");

    const title = document.createElement("h2");
    title.textContent = "新建模板";
    contentEl.appendChild(title);

    const nameLabel = document.createElement("label");
    nameLabel.className = "mdtp-template-field";
    const nameText = document.createElement("span");
    nameText.textContent = "模板名称";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "例如：周计划/复盘模板";
    input.className = "mdtp-template-input";
    nameLabel.append(nameText, input);
    contentEl.appendChild(nameLabel);

    const contentLabel = document.createElement("label");
    contentLabel.className = "mdtp-template-field";
    const contentText = document.createElement("span");
    contentText.textContent = "模板内容";
    const textarea = document.createElement("textarea");
    textarea.className = "mdtp-template-editor";
    textarea.placeholder = "可以先写模板内容；也可以留空，新建后再编辑。";
    contentLabel.append(contentText, textarea);
    contentEl.appendChild(contentLabel);

    const actions = document.createElement("div");
    actions.className = "mdtp-template-actions";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "取消";
    cancelButton.addEventListener("click", () => this.close());
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "mod-cta";
    saveButton.textContent = "创建";
    saveButton.addEventListener("click", () => void this.submit(input.value, textarea.value));
    actions.append(cancelButton, saveButton);
    contentEl.appendChild(actions);

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      void this.submit(input.value, textarea.value);
    });
    window.setTimeout(() => input.focus(), 50);
  }

  onClose() {
    this.contentEl.replaceChildren();
  }

  private async submit(rawName: string, rawContent: string) {
    const created = await this.plugin.createTemplateFromModalInput(rawName, rawContent);
    if (!created) return;
    await this.onCreated?.();
    this.close();
  }
}

class TemplateLibraryModal extends Modal {
  constructor(private plugin: MarkdownTableEnhancerPlugin) {
    super(plugin.app);
  }

  async onOpen() {
    this.contentEl.classList.add("mdtp-template-modal");
    await this.render();
  }

  onClose() {
    this.contentEl.replaceChildren();
  }

  private getFeishuToolbarPlugin(): any {
    const id = "feishu-doc-toolbar";
    return (this.plugin.app as any)?.plugins?.plugins?.[id] ?? null;
  }

  private async render() {
    const { contentEl } = this;
    contentEl.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "模板库";
    contentEl.appendChild(title);

    const hint = document.createElement("p");
    hint.className = "mdtp-template-hint";
    hint.textContent = "模板保存在隐藏文件夹中，不会占用主目录。";
    contentEl.appendChild(hint);

    const feishu = this.getFeishuToolbarPlugin();
    const canBridge = !!feishu && typeof feishu.buildFullTemplateTree === "function";

    const toolbar = document.createElement("div");
    toolbar.className = "mdtp-template-toolbar";
    const createButton = document.createElement("button");
    createButton.type = "button";
    createButton.className = "mod-cta";
    createButton.textContent = "新建模板";
    createButton.addEventListener("click", () => {
      new TemplateCreateModal(this.plugin, () => this.render()).open();
    });
    toolbar.appendChild(createButton);

    if (canBridge && typeof feishu.createTemplateSubfolder === "function") {
      const createGroupButton = document.createElement("button");
      createGroupButton.type = "button";
      createGroupButton.textContent = "新建分组";
      createGroupButton.addEventListener("click", () => {
        this.beginInlineRename(createGroupButton, {
          initial: "",
          placeholder: "分组名称，例如「复盘」或「工作/复盘」",
          onCommit: async (value) => {
            const ok = await feishu.createTemplateSubfolder(value);
            if (ok) await this.render();
          },
        });
      });
      toolbar.appendChild(createGroupButton);
    }
    contentEl.appendChild(toolbar);

    if (canBridge) {
      await this.renderBridgedTree(contentEl, feishu);
      return;
    }

    const templates = await this.plugin.getTemplateRecords();
    if (templates.length === 0) {
      const empty = document.createElement("div");
      empty.className = "mdtp-template-empty";
      empty.textContent = "还没有模板。可以先选中内容右键保存为模板，也可以新建空模板后编辑。";
      contentEl.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "mdtp-template-list";
    const tree = this.buildTemplateTree(templates);
    this.appendTemplateTree(list, tree, 0);
    contentEl.appendChild(list);
  }

  private async renderBridgedTree(contentEl: HTMLElement, feishu: any) {
    let tree: { folders: Map<string, any>; templates: any[] };
    let groupOptions: Array<{ value: string; label: string }>;
    try {
      tree = await feishu.buildFullTemplateTree();
      groupOptions =
        typeof feishu.getTemplateGroupMoveOptions === "function"
          ? await feishu.getTemplateGroupMoveOptions()
          : [{ value: "", label: this.getUngroupedLabel(feishu) }];
    } catch (error) {
      console.warn("[mdte] bridged template tree failed", error);
      const fallback = document.createElement("div");
      fallback.className = "mdtp-template-empty";
      fallback.textContent = "读取模板库失败，请稍后重试。";
      contentEl.appendChild(fallback);
      return;
    }

    const list = document.createElement("div");
    list.className = "mdtp-template-list";

    const hasTemplates = tree.templates.length > 0;
    const hasFolders = tree.folders.size > 0;
    if (!hasTemplates && !hasFolders) {
      const empty = document.createElement("div");
      empty.className = "mdtp-template-empty";
      empty.textContent = "还没有模板或分组。可以「新建分组」、「新建模板」或右键保存当前内容。";
      contentEl.appendChild(empty);
      return;
    }

    this.renderUngroupedSection(list, tree, groupOptions, feishu);
    const folders = Array.from(tree.folders.entries()).sort(([a], [b]) =>
      String(a).localeCompare(String(b), "zh-Hans-CN")
    );
    for (const [folderName, child] of folders) {
      this.renderFolderSection(list, String(folderName), child, String(folderName), groupOptions, feishu);
    }
    contentEl.appendChild(list);
  }

  private getUngroupedLabel(feishu: any): string {
    if (feishu && typeof feishu.getTemplateUngroupedLabel === "function") {
      try {
        return feishu.getTemplateUngroupedLabel();
      } catch {
        /* noop */
      }
    }
    return "未分组";
  }

  private sortTemplates(feishu: any, list: any[]): any[] {
    if (feishu && typeof feishu.sortTemplateDescriptors === "function") {
      try {
        return feishu.sortTemplateDescriptors(list);
      } catch {
        /* noop */
      }
    }
    return [...list];
  }

  private renderUngroupedSection(
    container: HTMLElement,
    root: { folders: Map<string, any>; templates: any[] },
    groupOptions: Array<{ value: string; label: string }>,
    feishu: any
  ) {
    const group = document.createElement("details");
    group.className = "mdtp-template-folder";
    group.open = true;

    const summary = document.createElement("summary");
    summary.className = "mdtp-template-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "mdtp-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "mdtp-template-folder-title-text";
    titleText.textContent = this.getUngroupedLabel(feishu);
    titleWrap.appendChild(titleText);

    if (typeof feishu.setTemplateUngroupedLabel === "function") {
      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "mdtp-template-folder-rename-btn";
      renameBtn.textContent = "改名";
      renameBtn.title = "修改「未分组」在界面上的显示名称（不移动文件）";
      renameBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.beginInlineRename(titleText, {
          initial: this.getUngroupedLabel(feishu),
          onCommit: async (value) => {
            await feishu.setTemplateUngroupedLabel(value);
            await this.render();
          },
        });
      });
      titleWrap.appendChild(renameBtn);
    }

    if (typeof feishu.deleteUngroupedTemplateGroup === "function") {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "mdtp-template-folder-delete-btn";
      deleteBtn.textContent = "删除";
      deleteBtn.title = "无模板时恢复默认名称「未分组」；有模板时删除根目录全部模板";
      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void feishu.deleteUngroupedTemplateGroup().then((ok: boolean) => {
          if (ok) void this.render();
        });
      });
      titleWrap.appendChild(deleteBtn);
    }
    summary.appendChild(titleWrap);
    group.appendChild(summary);

    const body = document.createElement("div");
    body.className = "mdtp-template-folder-children";
    if (root.templates.length === 0) {
      const note = document.createElement("p");
      note.className = "mdtp-template-empty";
      note.textContent = "根目录暂无模板。可用每行「移到」把其他分组的模板迁回这里。";
      body.appendChild(note);
    } else {
      for (const template of this.sortTemplates(feishu, root.templates)) {
        body.appendChild(this.createTemplateRow(template, groupOptions, feishu));
      }
    }
    group.appendChild(body);
    container.appendChild(group);
  }

  private renderFolderSection(
    container: HTMLElement,
    folderName: string,
    node: { folders: Map<string, any>; templates: any[] },
    relativePath: string,
    groupOptions: Array<{ value: string; label: string }>,
    feishu: any
  ) {
    const group = document.createElement("details");
    group.className = "mdtp-template-folder";
    group.open = true;

    const summary = document.createElement("summary");
    summary.className = "mdtp-template-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "mdtp-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "mdtp-template-folder-title-text";
    titleText.textContent = folderName;
    titleWrap.appendChild(titleText);

    if (typeof feishu.renameTemplateGroup === "function") {
      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "mdtp-template-folder-rename-btn";
      renameBtn.textContent = "改名";
      renameBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.beginInlineRename(titleText, {
          initial: folderName,
          onCommit: async (value) => {
            const ok = await feishu.renameTemplateGroup(relativePath, value);
            if (ok) await this.render();
          },
        });
      });
      titleWrap.appendChild(renameBtn);
    }

    if (typeof feishu.deleteTemplateGroup === "function") {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "mdtp-template-folder-delete-btn";
      deleteBtn.textContent = "删除";
      deleteBtn.title = "删除分组；组内模板将移至根目录";
      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void feishu.deleteTemplateGroup(relativePath).then((ok: boolean) => {
          if (ok) void this.render();
        });
      });
      titleWrap.appendChild(deleteBtn);
    }
    summary.appendChild(titleWrap);
    group.appendChild(summary);

    const body = document.createElement("div");
    body.className = "mdtp-template-folder-children";

    if (node.templates.length === 0 && node.folders.size === 0) {
      const note = document.createElement("p");
      note.className = "mdtp-template-empty";
      note.textContent = "分组已创建，暂无模板。可在上方「新建模板」填写「分组名/模板名」，或把其他模板移入本分组。";
      body.appendChild(note);
    }

    for (const template of this.sortTemplates(feishu, node.templates)) {
      body.appendChild(this.createTemplateRow(template, groupOptions, feishu));
    }

    const nested = Array.from(node.folders.entries()).sort(([a], [b]) =>
      String(a).localeCompare(String(b), "zh-Hans-CN")
    );
    for (const [childName, childNode] of nested) {
      const childRel = `${relativePath}/${String(childName)}`;
      this.renderFolderSection(body, String(childName), childNode, childRel, groupOptions, feishu);
    }

    group.appendChild(body);
    container.appendChild(group);
  }

  private beginInlineRename(
    anchor: HTMLElement,
    options: {
      initial: string;
      placeholder?: string;
      onCommit: (value: string) => void | Promise<void>;
    }
  ) {
    const parent = anchor.parentElement;
    if (!parent) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mdtp-template-folder-rename-input";
    input.value = options.initial;
    if (options.placeholder) input.placeholder = options.placeholder;
    const previousDisplay = anchor.style.display;
    anchor.style.display = "none";
    parent.appendChild(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = async (commit: boolean) => {
      if (finished) return;
      finished = true;
      input.remove();
      anchor.style.display = previousDisplay;
      if (!commit) return;
      const next = input.value.trim();
      if (!next) return;
      if (next === options.initial) return;
      await options.onCommit(next);
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        void finish(false);
      }
    });
    input.addEventListener("blur", () => void finish(true));
  }

  private buildTemplateTree(templates: TemplateRecord[]) {
    const root: TemplateTreeNode = { folders: new Map(), templates: [] };
    for (const template of templates) {
      let node = root;
      for (const segment of template.folderSegments) {
        if (!node.folders.has(segment)) {
          node.folders.set(segment, { folders: new Map(), templates: [] });
        }
        node = node.folders.get(segment)!;
      }
      node.templates.push(template);
    }
    return root;
  }

  private appendTemplateTree(container: HTMLElement, node: TemplateTreeNode, depth: number) {
    for (const template of node.templates) {
      container.appendChild(this.createTemplateRow(template));
    }

    const folders = Array.from(node.folders.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"));
    for (const [folderName, childNode] of folders) {
      const details = document.createElement("details");
      details.className = "mdtp-template-folder";
      details.open = true;
      details.dataset.depth = String(depth);

      const summary = document.createElement("summary");
      summary.className = "mdtp-template-folder-title";
      summary.textContent = folderName;
      details.appendChild(summary);

      const children = document.createElement("div");
      children.className = "mdtp-template-folder-children";
      this.appendTemplateTree(children, childNode, depth + 1);
      details.appendChild(children);
      container.appendChild(details);
    }
  }

  private createTemplateRow(
    template: TemplateRecord | any,
    groupOptions?: Array<{ value: string; label: string }>,
    feishu?: any
  ) {
    const row = document.createElement("div");
    row.className = "mdtp-template-row";

    const name = document.createElement("div");
    name.className = "mdtp-template-name";
    const displayName = (template as any).name ?? (template as any).title ?? "";
    name.textContent = displayName;
    name.title = (template as any).relativePath ?? (template as any).path ?? displayName;

    const actions = document.createElement("div");
    actions.className = "mdtp-template-row-actions";

    if (groupOptions && feishu && typeof feishu.moveTemplateToGroup === "function") {
      const moveWrap = document.createElement("label");
      moveWrap.className = "mdtp-template-move-wrap";
      moveWrap.title = "移到其他分组";
      const moveLabel = document.createElement("span");
      moveLabel.className = "mdtp-template-move-label";
      moveLabel.textContent = "移到";
      const moveSelect = document.createElement("select");
      moveSelect.className = "mdtp-template-move-select";
      const segments: string[] = Array.isArray((template as any).folderSegments)
        ? (template as any).folderSegments
        : [];
      const currentGroup = segments.join("/");
      for (const option of groupOptions) {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.label;
        opt.selected = option.value === currentGroup;
        moveSelect.appendChild(opt);
      }
      moveSelect.addEventListener("change", async () => {
        const target = moveSelect.value;
        if (target === currentGroup) return;
        moveSelect.disabled = true;
        const ok = await feishu.moveTemplateToGroup(template.path, target);
        if (ok) {
          await this.render();
          return;
        }
        moveSelect.disabled = false;
        moveSelect.value = currentGroup;
      });
      moveWrap.append(moveLabel, moveSelect);
      actions.appendChild(moveWrap);
    }

    const insertButton = document.createElement("button");
    insertButton.type = "button";
    insertButton.textContent = "插入";
    insertButton.addEventListener("click", async () => {
      const inserted = await this.plugin.insertTemplateByPath(template.path);
      if (inserted) this.close();
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "编辑";
    editButton.addEventListener("click", async () => {
      this.close();
      await this.plugin.openTemplateForEdit(template.path);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mdtp-template-delete-button";
    deleteButton.textContent = "删除";
    deleteButton.setAttribute("aria-label", `删除模板：${displayName}`);
    deleteButton.addEventListener("click", async () => {
      const deleted = await this.plugin.deleteTemplateByPath(template.path);
      if (deleted) await this.render();
    });

    actions.append(insertButton, editButton, deleteButton);
    row.append(name, actions);
    return row;
  }
}

class TemplateEditModal extends Modal {
  constructor(
    private plugin: MarkdownTableEnhancerPlugin,
    private template: TemplateRecord
  ) {
    super(plugin.app);
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-template-modal");

    const title = document.createElement("h2");
    title.textContent = `编辑模板：${this.template.name}`;
    contentEl.appendChild(title);

    const textarea = document.createElement("textarea");
    textarea.className = "mdtp-template-editor";
    textarea.value = await this.plugin.readTemplateContent(this.template.path);
    contentEl.appendChild(textarea);

    const actions = document.createElement("div");
    actions.className = "mdtp-template-actions";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "取消";
    cancelButton.addEventListener("click", () => this.close());
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "mod-cta";
    saveButton.textContent = "保存";
    saveButton.addEventListener("click", async () => {
      await this.plugin.writeTemplateContent(this.template.path, textarea.value);
      new Notice("模板已更新");
      this.close();
    });
    actions.append(cancelButton, saveButton);
    contentEl.appendChild(actions);

    window.setTimeout(() => textarea.focus(), 50);
  }

  onClose() {
    this.contentEl.replaceChildren();
  }
}

class OneNoteRichPasteModal extends Modal {
  constructor(
    private plugin: MarkdownTableEnhancerPlugin,
    private file: TFile
  ) {
    super(plugin.app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-onenote-paste-modal");

    const title = document.createElement("h2");
    title.textContent = "粘贴 OneNote（原生表格）";
    contentEl.appendChild(title);

    const hint = document.createElement("p");
    hint.textContent = "从 OneNote 复制后，点下面区域按 ⌘V 粘贴，将转为 Obsidian 原生 Markdown 表格（含图片本地化，无增强表格标记）。";
    contentEl.appendChild(hint);

    const pasteZone = document.createElement("div");
    pasteZone.className = "mdtp-onenote-paste-zone";
    pasteZone.tabIndex = 0;
    pasteZone.setAttribute("contenteditable", "true");
    pasteZone.setAttribute("role", "textbox");
    pasteZone.setAttribute("aria-label", "粘贴 OneNote 内容");
    pasteZone.textContent = "在这里粘贴";
    pasteZone.addEventListener("focus", () => {
      if (pasteZone.textContent === "在这里粘贴") {
        pasteZone.textContent = "";
      }
    });
    pasteZone.addEventListener(
      "paste",
      (event) => void this.handlePaste(event as ClipboardEvent),
      true
    );
    contentEl.appendChild(pasteZone);

    const exportRow = document.createElement("div");
    exportRow.className = "mdtp-onenote-paste-export-row";
    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.textContent = "导出原始 HTML（调试样本）";
    exportBtn.addEventListener("click", () => void this.exportOneNoteClipboardHtml());
    exportRow.appendChild(exportBtn);
    contentEl.appendChild(exportRow);

    window.setTimeout(() => pasteZone.focus(), 50);
  }

  private async exportOneNoteClipboardHtml() {
    const html = await this.plugin.resolveOneNoteClipboardHtml();
    if (!html.trim()) {
      new Notice("剪贴板里没有 OneNote HTML，请先从 OneNote 复制");
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `onenote-clipboard-${stamp}.html`;
    try {
      const electron = (window as any).require?.("electron");
      const { clipboard } = electron ?? {};
      if (clipboard?.writeText) {
        clipboard.writeText(html);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(html);
      }
    } catch {
      // clipboard write optional
    }
    console.log(`[mdtp] OneNote HTML export (${html.length} chars)`, fileName, html.slice(0, 500));
    new Notice(`已复制原始 HTML 到剪贴板（${html.length} 字）。请保存为 tests/samples/${fileName}`);
  }

  onClose() {
    this.contentEl.replaceChildren();
  }

  private async handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    const ok = await this.plugin.importOneNoteRichClipboardEvent(this.file, event);
    if (ok) {
      this.close();
    }
  }
}

class NativeRowBandColorModal extends Modal {
  constructor(
    private plugin: MarkdownTableEnhancerPlugin,
    private file: TFile,
    private tableId: string,
    private tableEl: HTMLTableElement
  ) {
    super(plugin.app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mdtp-template-modal");
    contentEl.createEl("h2", { text: "行段配色" });
    contentEl.createEl("p", {
      text: "按行号批量设置底色。表头是第 0 行，正文从第 1 行开始。",
      cls: "setting-item-description",
    });

    const rowCount = Math.max(1, this.tableEl.rows.length);
    const palette = this.plugin.getNativeRowColorChoicesForTable(this.tableId);
    const controls = contentEl.createDiv({ cls: "mdtp-row-band-controls" });
    const startInput = controls.createEl("input", { type: "number", attr: { min: "0", max: String(rowCount - 1), value: "1" } });
    const endInput = controls.createEl("input", { type: "number", attr: { min: "0", max: String(rowCount - 1), value: "1" } });
    const colorInput = controls.createEl("input", { type: "color" });
    colorInput.value = palette[0]?.value ?? NATIVE_COLOR_TABLE_ALT_ROW;
    const applyBtn = controls.createEl("button", { text: "应用到行段" });
    applyBtn.addEventListener("click", () => {
      const start = this.normalizeRowIndex(startInput.value, 0, rowCount - 1);
      const end = this.normalizeRowIndex(endInput.value, start, rowCount - 1);
      void this.plugin.setNativeLayoutRowRangeColor(
        this.tableId,
        this.file,
        this.tableEl,
        Math.min(start, end),
        Math.max(start, end),
        colorInput.value
      );
    });

    const quickWrap = contentEl.createDiv({ cls: "mdtp-row-band-palette" });
    for (const item of palette) {
      const btn = quickWrap.createEl("button", { text: item.label });
      btn.style.setProperty("--mdtp-row-band-color", item.value);
      btn.addClass("mdtp-row-band-swatch-button");
      btn.addEventListener("click", () => {
        colorInput.value = item.value;
      });
    }

    const list = contentEl.createDiv({ cls: "mdtp-row-band-list" });
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const row = list.createDiv({ cls: "mdtp-row-band-row" });
      row.createEl("span", { text: rowIndex === 0 ? "表头 0" : `正文 ${rowIndex}` });
      const rowColorInput = row.createEl("input", { type: "color" });
      rowColorInput.value = this.plugin.getNativeLayoutResolvedRowColor(this.tableId, rowIndex);
      rowColorInput.addEventListener("change", () => {
        void this.plugin.setNativeLayoutRowRangeColor(this.tableId, this.file, this.tableEl, rowIndex, rowIndex, rowColorInput.value);
      });
      const clearBtn = row.createEl("button", { text: "恢复默认" });
      clearBtn.addEventListener("click", () => {
        void this.plugin.setNativeLayoutRowRangeColor(this.tableId, this.file, this.tableEl, rowIndex, rowIndex, null);
      });
    }
  }

  private normalizeRowIndex(value: string, fallback: number, max: number) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.min(max, parsed));
  }
}

class AdvancedTableCsvExportModal extends Modal {
  private textarea: HTMLTextAreaElement | null = null;
  private includeHeadersInput: HTMLInputElement | null = null;
  private csvText = "";

  constructor(
    private plugin: MarkdownTableEnhancerPlugin,
    private exporter: (withHeaders: boolean) => Promise<string | null | undefined> | string | null | undefined,
    private initialWithHeaders: boolean
  ) {
    super(plugin.app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.addClass("mdtp-csv-export-modal");

    const title = document.createElement("h2");
    title.textContent = "导出 CSV";
    contentEl.appendChild(title);

    const headerToggleLabel = document.createElement("label");
    headerToggleLabel.className = "mdtp-csv-export-checkbox";
    const headerToggle = document.createElement("input");
    headerToggle.type = "checkbox";
    headerToggle.checked = this.initialWithHeaders;
    headerToggle.addEventListener("change", () => void this.refreshCsvText());
    headerToggleLabel.append(headerToggle, document.createTextNode(" 包含表头"));
    contentEl.appendChild(headerToggleLabel);
    this.includeHeadersInput = headerToggle;

    const textarea = document.createElement("textarea");
    textarea.className = "mdtp-csv-export-textarea";
    textarea.rows = 12;
    textarea.readOnly = true;
    contentEl.appendChild(textarea);
    this.textarea = textarea;

    const footer = document.createElement("div");
    footer.className = "mdtp-csv-export-footer";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", async () => {
      const copied = await this.plugin.copyTextToSystemClipboard(this.csvText);
      new Notice(copied ? "已复制 CSV" : "复制失败，请手动选中文本复制");
    });
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.textContent = "关闭";
    closeButton.addEventListener("click", () => this.close());
    footer.append(copyButton, closeButton);
    contentEl.appendChild(footer);

    void this.refreshCsvText();
    textarea.focus();
    textarea.select();
  }

  onClose() {
    this.textarea = null;
    this.includeHeadersInput = null;
    this.contentEl.replaceChildren();
  }

  private async refreshCsvText() {
    const withHeaders = this.includeHeadersInput?.checked ?? this.initialWithHeaders;
    const nextText = await this.exporter(withHeaders);
    if (typeof nextText !== "string") {
      new Notice("没有读到当前表格内容");
      return;
    }
    this.csvText = nextText;
    if (this.textarea) {
      this.textarea.value = nextText;
      this.textarea.select();
    }
  }
}

export default class MarkdownTableEnhancerPlugin extends Plugin {
  private dataStore: PluginDataShape = DEFAULT_DATA;
  private runtimeState = new Map<HTMLTableElement, TableRuntimeState>();
  private activeResize: ResizeState | null = null;
  private activeSelectionDrag: SelectionDragState | null = null;
  private activeAutoFill: AutoFillDragState | null = null;
  private refreshTimer: number | null = null;
  private lastTableContext: TableContextTarget | null = null;
  private refreshBurstToken = 0;
  private injectedStyleEl: HTMLStyleElement | null = null;
  private activeEditor: InlineEditorState | null = null;
  private activeNativeTableContext: UninitializedTableContext | null = null;
  private plainTableSidebarFallbackTimer: number | null = null;
  private tableSidebarHandleEl: HTMLButtonElement | null = null;
  private tableSidebarPopoverEl: HTMLDivElement | null = null;
  private activeTableSidebarContext: TableSidebarContext | null = null;
  private activeImageToolbar: ImageToolbarState | null = null;
  private activeImageManipulator: ImageManipulatorState | null = null;
  private activeImageDrag: ImageDragState | null = null;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private historyApplying = false;
  private suppressDocumentPasteUntil = 0;
  private oneNoteStatusBarGroupEl: HTMLElement | null = null;
  private oneNoteStatusButtonEl: HTMLElement | null = null;

  async onload() {
    await this.installRuntimeStyles();
    this.registerEditorExtension(this.createHiddenMarkerEditorExtension());
    const savedData = await this.loadData();
    const savedTables = Object.fromEntries(
      Object.entries(savedData?.tables ?? {}).map(([tableId, record]) => {
        return [tableId, this.normalizeLoadedTableRecord(record)];
      })
    );
    const savedNativeColorPalettes = this.normalizeNativeColorSavedPalettes(savedData?.nativeColorSavedPalettes);
    const savedAdvancedTableSettings = normalizeAdvancedTableSettings({
      bindTab: savedData?.advancedTableBindTab,
      bindEnter: savedData?.advancedTableBindEnter,
      formatType: savedData?.advancedTableFormatType,
      showRibbonIcon: savedData?.advancedTableShowRibbonIcon,
    });
    this.dataStore = {
      ...DEFAULT_DATA,
      ...(savedData ?? {}),
      tables: {
        ...DEFAULT_DATA.tables,
        ...savedTables,
      },
      snapshots: Array.isArray(savedData?.snapshots) ? savedData.snapshots : [],
      experimentalFeatureGate: false,
      nativeColorSavedPalettes: savedNativeColorPalettes,
      nativeColorDefaultPresetId: this.normalizeNativeColorPresetId(savedData?.nativeColorDefaultPresetId, savedNativeColorPalettes),
      nativeColorCustomPalette: this.normalizeNativeColorPalette(savedData?.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT),
      nativeTableDefaultScale: this.normalizeNativeTableScale(savedData?.nativeTableDefaultScale, NATIVE_TABLE_DEFAULT_SCALE),
      nativeTableDefaultColumnWidth: this.normalizeNativeTableDefaultSize(
        savedData?.nativeTableDefaultColumnWidth,
        NATIVE_TABLE_DEFAULT_COLUMN_WIDTH,
        MIN_COLUMN_WIDTH,
        MAX_COLUMN_WIDTH
      ),
      nativeTableDefaultRowHeight: this.normalizeNativeTableDefaultSize(
        savedData?.nativeTableDefaultRowHeight,
        NATIVE_TABLE_DEFAULT_ROW_HEIGHT,
        MIN_ROW_HEIGHT,
        MAX_ROW_HEIGHT
      ),
      nativeTableDefaultTextColor: this.normalizeHexColor(savedData?.nativeTableDefaultTextColor, NATIVE_TABLE_DEFAULT_TEXT_COLOR),
      nativeTableDefaultZebraEnabled:
        typeof savedData?.nativeTableDefaultZebraEnabled === "boolean"
          ? savedData.nativeTableDefaultZebraEnabled
          : DEFAULT_DATA.nativeTableDefaultZebraEnabled,
      nativeTableDefaultBorderEnabled:
        typeof savedData?.nativeTableDefaultBorderEnabled === "boolean"
          ? savedData.nativeTableDefaultBorderEnabled
          : DEFAULT_DATA.nativeTableDefaultBorderEnabled,
      nativeTableDefaultHeaderAlignment: this.normalizeNativeTableAutoAlignment(
        savedData?.nativeTableDefaultHeaderAlignment,
        DEFAULT_DATA.nativeTableDefaultHeaderAlignment
      ),
      nativeTableDefaultFirstColumnAlignment: this.normalizeNativeTableAutoAlignment(
        savedData?.nativeTableDefaultFirstColumnAlignment,
        DEFAULT_DATA.nativeTableDefaultFirstColumnAlignment
      ),
      advancedTableBindTab: savedAdvancedTableSettings.bindTab,
      advancedTableBindEnter: savedAdvancedTableSettings.bindEnter,
      advancedTableFormatType: savedAdvancedTableSettings.formatType,
      advancedTableShowRibbonIcon: savedAdvancedTableSettings.showRibbonIcon,
    };

    this.addCommand({
      id: INITIALIZE_CURRENT_TABLE_LAYOUT_COMMAND_ID,
      name: INITIALIZE_CURRENT_TABLE_LAYOUT_COMMAND_NAME,
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.initializeCurrentTableNativeLayout();
        }
        return true;
      },
    });

    this.addCommand({
      id: INSERT_NATIVE_COLOR_TABLE_COMMAND_ID,
      name: INSERT_NATIVE_COLOR_TABLE_COMMAND_NAME,
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.insertNativeColorTableTemplate();
        }
        return true;
      },
    });

    this.addCommand({
      id: MIGRATE_CURRENT_FILE_TABLE_MARKERS_COMMAND_ID,
      name: MIGRATE_CURRENT_FILE_TABLE_MARKERS_COMMAND_NAME,
      checkCallback: (checking) => {
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.migrateCurrentFileTableMarkersToMarkerless(file);
        }
        return true;
      },
    });

    this.addCommand({
      id: SET_NATIVE_ROW_COLOR_COMMAND_ID,
      name: SET_NATIVE_ROW_COLOR_COMMAND_NAME,
      checkCallback: (checking) => {
        const context = this.getActiveNativeLayoutCommandContext(checking);
        if (!context) return false;
        if (!checking) {
          this.showNativeLayoutRowColorPalette(
            context.file,
            context.tableEl,
            context.tableId,
            context.selection,
            context.anchor
          );
        }
        return true;
      },
    });

    this.addCommand({
      id: OPEN_NATIVE_ROW_BANDS_COMMAND_ID,
      name: OPEN_NATIVE_ROW_BANDS_COMMAND_NAME,
      checkCallback: (checking) => {
        const context = this.getActiveNativeLayoutCommandContext(checking);
        if (!context) return false;
        if (!checking) {
          new NativeRowBandColorModal(this, context.file, context.tableId, context.tableEl).open();
        }
        return true;
      },
    });

    this.addCommand({
      id: OPEN_TEMPLATE_LIBRARY_COMMAND_ID,
      name: OPEN_TEMPLATE_LIBRARY_COMMAND_NAME,
      callback: () => {
        this.openTemplateLibraryModal();
      },
    });

    this.addRibbonIcon("copy", OPEN_TEMPLATE_LIBRARY_COMMAND_NAME, () => {
      this.openTemplateLibraryModal();
    });

    this.addCommand({
      id: PASTE_ONENOTE_RICH_TABLE_COMMAND_ID,
      name: PASTE_ONENOTE_RICH_TABLE_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isOneNotePasteFeatureEnabled()) return false;
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.pasteOneNoteFromSystemClipboardOrOpenModal(file);
        }
        return true;
      },
    });

    this.registerAdvancedTableCommands();
    this.addAdvancedTableRibbonIconIfEnabled();

    this.oneNoteStatusBarGroupEl = this.addStatusBarItem();
    this.oneNoteStatusBarGroupEl.addClass("mdtp-onenote-status-bar-group");
    this.oneNoteStatusBarGroupEl.style.display = "none";

    this.oneNoteStatusButtonEl = this.oneNoteStatusBarGroupEl.createDiv("mdtp-onenote-status-button");
    this.oneNoteStatusButtonEl.setText("粘贴OneNote");
    this.oneNoteStatusButtonEl.setAttr("role", "button");
    this.oneNoteStatusButtonEl.setAttr("aria-label", PASTE_ONENOTE_RICH_TABLE_COMMAND_NAME);
    this.oneNoteStatusButtonEl.addEventListener("click", () => {
      const file = this.getActiveMarkdownFile();
      if (!file) {
        new Notice("请先打开一个 Markdown 笔记");
        return;
      }
      void this.pasteOneNoteFromSystemClipboardOrOpenModal(file);
    });

    this.registerMarkdownPostProcessor((element, context) => {
      this.decorateOneNoteRichTables(element, context);
      void this.decorateRenderedTables(element, context);
    });

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, info) => {
        const view = this.resolveMarkdownViewFromMenuInfo(info);
        if (!view) return;
        this.addEditorMenuItems(menu, view);
      })
    );

    this.registerEvent(this.app.workspace.on("file-open", () => this.queueRefreshBurst()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.queueRefreshBurst()));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.queueRefreshBurst()));
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (!(file instanceof TFile) || file.extension !== "md") return;
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile?.path !== file.path) return;
        this.queueRefreshBurst();
      })
    );

    this.registerDomEvent(document, "pointerdown", (event) => this.handleDocumentPointerDown(event as PointerEvent), true);
    this.registerDomEvent(document, "click", (event) => void this.handleDocumentClick(event as MouseEvent), true);
    this.registerDomEvent(document, "dblclick", (event) => void this.handleDocumentDoubleClick(event as MouseEvent), true);
    this.registerDomEvent(document, "contextmenu", (event) => void this.handleDocumentContextMenu(event as MouseEvent), true);
    this.registerDomEvent(document, "keydown", (event) => void this.handleDocumentKeyDown(event as KeyboardEvent), true);
    this.registerDomEvent(document, "paste", (event) => void this.handleDocumentPaste(event as ClipboardEvent), true);
    this.registerDomEvent(document, "selectionchange", () => this.schedulePlainTableSidebarFallback(null), true);
    this.registerDomEvent(document, "pointermove", (event) => this.handleGlobalPointerMove(event as PointerEvent), true);
    this.registerDomEvent(document, "pointerup", () => void this.handleGlobalPointerUp(), true);
    this.registerDomEvent(document, "pointercancel", () => void this.handleGlobalPointerUp(), true);

    this.updateOneNoteStatusBarVisibility();
    this.queueRefreshBurst();
  }

  private async migrateLegacyMarkersToHtmlComments() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    for (const file of markdownFiles) {
      const originalContent = await this.app.vault.cachedRead(file);
      if (
        !originalContent.includes("[//]: # (mdtp:") &&
        !originalContent.includes("// # (mdtp:") &&
        !originalContent.includes("<!-- mdtp:")
      ) {
        continue;
      }

      const { lines, originalEndsWithNewline } = this.splitContentLines(originalContent);
      const markerIds: string[] = [];
      let changed = false;

      for (let index = 0; index < lines.length; index += 1) {
        const referenceMatch = lines[index].match(REFERENCE_TABLE_MARKER_RE);
        const visibleMatch = lines[index].match(VISIBLE_REFERENCE_TABLE_MARKER_RE);
        const htmlMatch = lines[index].match(HTML_TABLE_MARKER_RE);
        const tableId = referenceMatch?.[1] ?? visibleMatch?.[1] ?? htmlMatch?.[1] ?? null;
        if (!tableId) continue;
        markerIds.push(tableId);
        lines[index] = this.formatTableMarker(tableId);
        changed = true;
      }

      if (!changed) {
        continue;
      }

      const updatedContent = this.joinLines(lines, originalEndsWithNewline);

      if (updatedContent === originalContent) {
        continue;
      }

      await this.createSnapshot(file, "before-marker-html-migration", markerIds);
      await this.app.vault.modify(file, updatedContent);
    }
  }

  private async migrateCurrentFileTableMarkersToMarkerless(file: TFile) {
    const originalContent = await this.app.vault.cachedRead(file);
    const { lines, originalEndsWithNewline } = this.splitContentLines(originalContent);
    const markerLineIndexes = new Set<number>();
    const markerIds = new Set<string>();

    lines.forEach((line, index) => {
      const markerId = this.extractTableMarkerId(line);
      if (!markerId) return;
      markerLineIndexes.add(index);
      markerIds.add(markerId);
    });

    if (markerLineIndexes.size === 0) {
      new Notice("当前笔记没有旧表格标记需要清理");
      return false;
    }

    const sourceTables = this.parseMarkdownTables(originalContent);
    const tableIdsByOrder = new Map<number, string>();
    sourceTables.forEach((table, index) => {
      if (table.tableId) tableIdsByOrder.set(index, table.tableId);
    });

    await this.createSnapshot(file, "before-markerless-migration", [...markerIds]);

    const updatedContent = this.joinLines(
      lines.filter((_line, index) => !markerLineIndexes.has(index)),
      originalEndsWithNewline
    );
    if (updatedContent !== originalContent) {
      await this.app.vault.modify(file, updatedContent);
    }

    const updatedTables = this.parseMarkdownTables(updatedContent);
    const now = Date.now();
    let changedRecords = false;

    for (const [tableIndex, tableId] of tableIdsByOrder) {
      const updatedTable = updatedTables[tableIndex];
      if (!updatedTable) continue;

      const existing = this.dataStore.tables[tableId];
      const record: TableRecord = existing
        ? this.cloneTableRecord(existing)
        : {
            tableId,
            mode: "nativeLayout",
            markerless: true,
            filePath: file.path,
            createdAt: now,
            updatedAt: now,
            lastKnownHash: "",
            lastKnownRange: { startLine: 0, endLine: 0 },
            layout: this.createEmptyLayout(),
          };

      record.mode = "nativeLayout";
      this.updateTableRecordSource(record, file, updatedTable, tableIndex, true);
      record.updatedAt = now;
      this.dataStore.tables[tableId] = record;
      changedRecords = true;
    }

    if (changedRecords) {
      await this.savePluginData();
    }

    this.queueRefreshBurst();
    new Notice(`已清理 ${markerLineIndexes.size} 个旧表格标记，样式已转为非入侵记录`);
    return true;
  }

  onunload() {
    void this.closeActiveEditor("cancel");
    this.hideImageToolbar();
    this.hideImageManipulator();
    this.activeImageDrag = null;
    this.injectedStyleEl?.remove();
    this.injectedStyleEl = null;
  }

  private getActiveMarkdownFile(silent = false) {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile) || file.extension !== "md") {
      if (!silent) {
        new Notice("当前没有打开 Markdown 文件");
      }
      return null;
    }
    return file;
  }

  private registerAdvancedTableCommands() {
    this.addCommand({
      id: ADVANCED_TABLE_CONTROL_BAR_COMMAND_ID,
      name: ADVANCED_TABLE_CONTROL_BAR_COMMAND_NAME,
      checkCallback: (checking) => {
        const hasContext = !!this.activeTableSidebarContext || !!this.getActiveNativeLayoutCommandContext(true);
        const editor = this.getActiveMarkdownEditor();
        if (!hasContext && !editor) return false;
        if (!checking) void this.openAdvancedTableControlBar();
        return true;
      },
    });

    for (const command of ADVANCED_TABLE_COMMANDS) {
      this.addCommand({
        id: command.id,
        name: command.name,
        checkCallback: (checking) => {
          const hasNativeContext = !!this.getActiveNativeLayoutCommandContext(true);
          const editor = this.getActiveMarkdownEditor();
          if (!hasNativeContext && !editor) return false;
          if (!checking) {
            void this.runAdvancedTableCommand(command.id, command.name);
          }
          return true;
        },
      });
    }

    this.addCommand({
      id: ADVANCED_TABLE_EXPORT_CSV_WITH_HEADERS_COMMAND_ID,
      name: ADVANCED_TABLE_EXPORT_CSV_WITH_HEADERS_COMMAND_NAME,
      checkCallback: (checking) => {
        const hasNativeContext = !!this.getActiveNativeLayoutCommandContext(true);
        const editor = this.getActiveMarkdownEditor();
        if (!hasNativeContext && !editor) return false;
        if (!checking) void this.showAdvancedTableCsvExport(true);
        return true;
      },
    });

    this.addCommand({
      id: ADVANCED_TABLE_EXPORT_CSV_WITHOUT_HEADERS_COMMAND_ID,
      name: ADVANCED_TABLE_EXPORT_CSV_WITHOUT_HEADERS_COMMAND_NAME,
      checkCallback: (checking) => {
        const hasNativeContext = !!this.getActiveNativeLayoutCommandContext(true);
        const editor = this.getActiveMarkdownEditor();
        if (!hasNativeContext && !editor) return false;
        if (!checking) void this.showAdvancedTableCsvExport(false);
        return true;
      },
    });
  }

  private getAdvancedTableSettings(): AdvancedTableSettings {
    return normalizeAdvancedTableSettings({
      bindTab: this.dataStore.advancedTableBindTab,
      bindEnter: this.dataStore.advancedTableBindEnter,
      formatType: this.dataStore.advancedTableFormatType,
      showRibbonIcon: this.dataStore.advancedTableShowRibbonIcon,
    });
  }

  getAdvancedTableSettingsForManager() {
    return this.getAdvancedTableSettings();
  }

  async updateAdvancedTableSettingsFromManager(input: Partial<AdvancedTableSettings>) {
    const current = this.getAdvancedTableSettings();
    const next = normalizeAdvancedTableSettings({
      ...current,
      ...input,
    });
    this.dataStore.advancedTableBindTab = next.bindTab;
    this.dataStore.advancedTableBindEnter = next.bindEnter;
    this.dataStore.advancedTableFormatType = next.formatType;
    this.dataStore.advancedTableShowRibbonIcon = next.showRibbonIcon;
    await this.savePluginData();
    return this.getAdvancedTableSettings();
  }

  private addAdvancedTableRibbonIconIfEnabled() {
    if (!this.getAdvancedTableSettings().showRibbonIcon) return;
    this.addRibbonIcon("spreadsheet", "Advanced Tables Toolbar", () => {
      void this.openAdvancedTableControlBar();
    });
  }

  private getActiveMarkdownEditor() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (view as any)?.editor;
    if (editor && typeof editor.getCursor === "function") {
      return editor;
    }
    return null;
  }

  private async runAdvancedTableCommand(operation: AdvancedTableOperation, label: string) {
    const nativeContext = this.getActiveNativeLayoutCommandContext(true);
    if (nativeContext && (await this.runNativeLayoutAdvancedTableOperation(nativeContext, operation))) {
      return true;
    }

    const editor = this.getActiveMarkdownEditor();
    if (!editor) {
      new Notice("请先把光标放到 Markdown 表格里");
      return false;
    }

    try {
      const handled = runAdvancedTableOperationOnEditor(editor, operation, this.getAdvancedTableSettings());
      if (!handled) {
        new Notice("请先把光标放到 Markdown 表格里");
        return false;
      }
      if (operation !== "next-cell" && operation !== "previous-cell" && operation !== "next-row") {
        new Notice(`已执行：${label}`);
      }
      return true;
    } catch (error) {
      console.error("[mdtp] advanced table command failed", error);
      new Notice("表格操作失败，请检查当前表格格式");
      return false;
    }
  }

  private async openAdvancedTableControlBar() {
    const context = await this.resolveAdvancedTableControlBarContext();
    if (!context) {
      new Notice("请先把光标放到 Markdown 表格里");
      return false;
    }

    this.showTableSidebar(context);
    this.showTableSidebarPopover(context);
    return true;
  }

  private async resolveAdvancedTableControlBarContext(): Promise<TableSidebarContext | null> {
    if (this.activeTableSidebarContext?.tableEl && document.body.contains(this.activeTableSidebarContext.tableEl)) {
      return this.activeTableSidebarContext;
    }

    const nativeLayoutContext = this.getActiveNativeLayoutCommandContext(true);
    if (nativeLayoutContext) {
      return {
        mode: "nativeLayout",
        file: nativeLayoutContext.file,
        tableId: nativeLayoutContext.tableId,
        parsedTable: nativeLayoutContext.parsedTable,
        selection: nativeLayoutContext.selection,
        coord: nativeLayoutContext.anchor,
        tableEl: nativeLayoutContext.tableEl,
      };
    }

    const nativeContext = await this.getActiveUninitializedTableContext();
    if (nativeContext?.tableEl) {
      return {
        mode: "native",
        file: nativeContext.file,
        parsedTable: nativeContext.parsedTable,
        coord: nativeContext.coord,
        tableEl: nativeContext.tableEl,
      };
    }

    return null;
  }

  private async showAdvancedTableCsvExport(initialWithHeaders: boolean) {
    const canExport = !!this.getActiveNativeLayoutCommandContext(true) || !!this.getActiveMarkdownEditor();
    if (!canExport) {
      new Notice("请先把光标放到 Markdown 表格里");
      return;
    }

    new AdvancedTableCsvExportModal(
      this,
      (withHeaders) => this.createAdvancedTableCsvText(withHeaders),
      initialWithHeaders
    ).open();
  }

  private async createAdvancedTableCsvText(withHeaders: boolean) {
    const nativeContext = this.getActiveNativeLayoutCommandContext(true);
    if (nativeContext) {
      const csv = await this.exportNativeLayoutTableCsv(nativeContext.file, nativeContext.tableId, withHeaders);
      return csv;
    }

    const editor = this.getActiveMarkdownEditor();
    if (!editor) {
      return null;
    }

    try {
      return exportAdvancedTableCsvFromEditor(editor, withHeaders, this.getAdvancedTableSettings());
    } catch (error) {
      console.error("[mdtp] advanced table csv export failed", error);
      new Notice("CSV 导出失败，请检查当前表格格式");
      return null;
    }
  }

  private getActiveInteractionContext(silent = false) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file || !(view.contentEl instanceof HTMLElement)) {
      if (!silent) new Notice("当前没有打开 Markdown 表格视图");
      return null;
    }

    let tableEl: HTMLTableElement | null = null;
    let anchorCell = view.contentEl.querySelector(
      "table.mdtp-table-shell .mdtp-cell-anchor"
    ) as HTMLTableCellElement | null;

    if (anchorCell) {
      tableEl = anchorCell.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    }

    let runtime = tableEl ? this.runtimeState.get(tableEl) ?? null : null;
    let anchor = anchorCell ? this.getCellCoord(anchorCell) : null;

    if (!tableEl || !runtime || !anchor) {
      const focusedElement = document.activeElement as HTMLElement | null;
      const candidateTables = Array.from(
        view.contentEl.querySelectorAll("table.mdtp-table-shell")
      ) as HTMLTableElement[];

      let fallbackTable: HTMLTableElement | null =
        focusedElement?.closest("table.mdtp-table-shell") as HTMLTableElement | null;

      if (!fallbackTable || !candidateTables.includes(fallbackTable)) {
        fallbackTable =
          candidateTables.find((candidate) => {
            const candidateRuntime = this.runtimeState.get(candidate);
            return !!candidateRuntime?.anchor;
          }) ?? null;
      }

      if (!fallbackTable) {
        if (!silent) new Notice("当前没有选中表格单元格");
        return null;
      }

      tableEl = fallbackTable;
      runtime = this.runtimeState.get(tableEl) ?? null;
      anchor = runtime?.anchor ?? null;

      if (!runtime || !anchor) {
        if (!silent) new Notice("当前表格选区状态不可用");
        return null;
      }
    }

    const tableId = tableEl.dataset.mdtpTableId || "";
    return {
      file: view.file,
      tableEl,
      tableId: tableId && this.getTableRecordMode(this.dataStore.tables[tableId]) === "enhanced" ? tableId : null,
      parsedTable: runtime.parsedTable,
      anchor,
      selection: runtime.selection,
    };
  }

  private getPlainTableCellCoord(cell: HTMLTableCellElement): CellCoord | null {
    const rowEl = cell.parentElement;
    if (!(rowEl instanceof HTMLTableRowElement)) return null;
    const row = rowEl.rowIndex;
    const col = cell.cellIndex;
    if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || col < 0) return null;
    return { row, col };
  }

  /** Resolve a plain (non-mdtp-shell) markdown table from click/right-click target, including Obsidian Table Widget. */
  private resolvePlainMarkdownTableFromTarget(target: HTMLElement | null): {
    tableEl: HTMLTableElement;
    cell: HTMLTableCellElement | null;
    coord: CellCoord | null;
  } | null {
    if (!target) return null;
    const initializedTable = target.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    if (initializedTable && this.isInitializedTable(initializedTable)) return null;

    let cell = target.closest("th, td") as HTMLTableCellElement | null;
    let tableEl = cell?.closest("table") as HTMLTableElement | null;

    if (!tableEl) {
      tableEl = (target.closest("table") ??
        target.closest(".cm-table-widget")?.querySelector("table")) as HTMLTableElement | null;
      if (tableEl && !cell) {
        cell = (target.closest("th, td") ??
          tableEl.querySelector("th, td")) as HTMLTableCellElement | null;
      }
    }

    if (!tableEl) return null;
    if (tableEl.matches(".mdtp-table-shell") && this.isInitializedTable(tableEl)) return null;

    const coord = cell ? this.getPlainTableCellCoord(cell) : null;
    return { tableEl, cell, coord };
  }

  private async getTargetUninitializedTableContext(target?: HTMLElement | null): Promise<UninitializedTableContext | null> {
    const focusTarget = target ?? (document.activeElement as HTMLElement | null);
    if (!focusTarget) return null;

    const resolved = this.resolvePlainMarkdownTableFromTarget(focusTarget);
    if (!resolved) return null;

    const view = this.getContainingMarkdownView(focusTarget);
    if (!view?.file || !(view.contentEl instanceof HTMLElement)) return null;

    const parsedTables = this.parseMarkdownTables(await this.app.vault.cachedRead(view.file));
    const renderedTables = Array.from(view.contentEl.querySelectorAll("table")) as HTMLTableElement[];
    const tableIndex = renderedTables.indexOf(resolved.tableEl);
    const parsedTable =
      (tableIndex >= 0 ? parsedTables[tableIndex] ?? null : null) ??
      (parsedTables.length === 1 ? parsedTables[0] : null);
    if (!parsedTable || parsedTable.tableId) return null;

    const coord = resolved.coord ?? { row: 0, col: 0 };

    return {
      file: view.file,
      parsedTable,
      coord,
      tableEl: resolved.tableEl,
    };
  }

  private async getActiveUninitializedTableContext(target?: HTMLElement | null) {
    const targetContext = await this.getTargetUninitializedTableContext(target);
    if (targetContext) return targetContext;

    const focusTarget = target ?? (document.activeElement as HTMLElement | null);
    if (focusTarget) {
      const resolved = this.resolvePlainMarkdownTableFromTarget(focusTarget);
      if (resolved) {
        const view = this.getContainingMarkdownView(focusTarget);
        if (view?.file && view.contentEl instanceof HTMLElement) {
          const renderedTables = Array.from(view.contentEl.querySelectorAll("table")) as HTMLTableElement[];
          const tableIndex = renderedTables.indexOf(resolved.tableEl);
          if (tableIndex >= 0) {
            const parsedTables = this.parseMarkdownTables(await this.app.vault.cachedRead(view.file));
            const parsedTable = parsedTables[tableIndex] ?? null;
            if (parsedTable && !parsedTable.tableId) {
              return {
                file: view.file,
                parsedTable,
                coord: resolved.coord ?? { row: 0, col: 0 },
                tableEl: resolved.tableEl,
              };
            }
          }
        }
      }
    }

    return this.getCursorBasedUninitializedTableContext();
  }

  private async getCursorBasedUninitializedTableContext() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const file = view?.file;
    const editor = (view as any)?.editor;
    if (!file || typeof editor?.getCursor !== "function") return null;

    const cursor = editor.getCursor();
    if (!cursor || !Number.isFinite(cursor.line) || !Number.isFinite(cursor.ch)) return null;

    const content = await this.app.vault.cachedRead(file);
    const allParsedTables = this.parseMarkdownTables(content);
    const parsedTables = allParsedTables.filter((table) => !table.tableId);
    const parsedTable =
      parsedTables.find((table) => cursor.line >= table.startLine && cursor.line <= table.endLine) ?? null;
    if (!parsedTable) return null;

    if (cursor.line === parsedTable.startLine + 1) {
      return null;
    }

    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return null;

    const lineText =
      typeof editor.getLine === "function"
        ? String(editor.getLine(cursor.line) ?? "")
        : content.split(/\r?\n/)[cursor.line] ?? "";
    const col = this.resolveCursorTableColumn(lineText, cursor.ch, rawTable.header.length);
    if (col === null) return null;

    const row = cursor.line === parsedTable.startLine ? 0 : cursor.line - parsedTable.startLine - 1;
    if (row < 0) return null;

    return {
      file,
      parsedTable,
      coord: { row, col },
      tableEl: this.findRenderedTableForParsedBlock(view, allParsedTables, parsedTable),
    };
  }

  private findRenderedTableForParsedBlock(
    view: MarkdownView,
    parsedTables: ParsedTableBlock[],
    parsedTable: ParsedTableBlock
  ) {
    if (!(view.contentEl instanceof HTMLElement)) return null;
    const tableIndex = parsedTables.indexOf(parsedTable);
    if (tableIndex < 0) return null;
    const renderedTables = Array.from(view.contentEl.querySelectorAll("table")) as HTMLTableElement[];
    const tableEl = renderedTables[tableIndex] ?? null;
    if (!tableEl) return null;
    if (tableEl.matches(".mdtp-table-shell") && this.isInitializedTable(tableEl)) return null;
    return tableEl;
  }

  private resolveCursorTableColumn(line: string, cursorCh: number, expectedLength: number) {
    if (!expectedLength) return null;
    const safeCursor = Math.max(0, Math.min(cursorCh, line.length));
    let cellIndex = 0;
    const scanStart = line.startsWith("|") ? 1 : 0;

    for (let index = scanStart; index < line.length; index += 1) {
      const char = line[index];
      const nextChar = line[index + 1];
      if (char === "\\" && (nextChar === "|" || nextChar === "\\")) {
        index += 1;
        continue;
      }

      if (char !== "|") continue;
      if (safeCursor <= index) {
        return Math.max(0, Math.min(cellIndex, expectedLength - 1));
      }
      cellIndex += 1;
    }

    return Math.max(0, Math.min(cellIndex, expectedLength - 1));
  }

  private getActiveSelectionCommandContext(silent = false) {
    const context = this.getActiveInteractionContext(silent);
    if (!context) return null;
    if (!context.tableId) {
      if (!silent) new Notice("当前表格还没有启用增强");
      return null;
    }

    return context;
  }

  private getActiveNativeLayoutCommandContext(silent = false) {
    const context = this.getActiveInteractionContext(silent);
    if (!context) return null;
    const tableId = context.tableEl.dataset.mdtpTableId || context.parsedTable?.tableId || "";
    const record = tableId ? this.dataStore.tables[tableId] : null;
    if (!tableId || record?.mode !== "nativeLayout") {
      if (!silent) new Notice("当前表格还没有启用颜色+长宽高");
      return null;
    }

    return {
      ...context,
      tableId,
      coord: context.anchor,
    };
  }

  async initializeCurrentFileTables(file: TFile) {
    const originalContent = await this.app.vault.cachedRead(file);
    const parsedTables = this.parseMarkdownTables(originalContent);

    if (parsedTables.length === 0) {
      new Notice("当前文件没有识别到 Markdown 表格");
      return;
    }

    await this.syncTableRecords(file, parsedTables, { forceMode: "nativeLayout" });
    let createdCount = 0;
    for (let index = 0; index < parsedTables.length; index += 1) {
      const table = parsedTables[index];
      if (this.resolveTableRecordIdForParsedTable(file, table, parsedTables)) continue;
      const tableId = this.generateTableId();
      const now = Date.now();
      const record: TableRecord = {
        tableId,
        mode: "nativeLayout",
        markerless: true,
        filePath: file.path,
        createdAt: now,
        updatedAt: now,
        lastKnownHash: this.hashString(table.raw),
        lastKnownRange: {
          startLine: table.startLine,
          endLine: table.endLine,
        },
        identity: this.createNativeTableIdentity(table, index),
        layout: this.createEmptyLayout(),
      };
      this.applyNativeLayoutBeautifyToRecord(record, this.parseRawTable(table.raw));
      this.dataStore.tables[tableId] = record;
      createdCount += 1;
    }

    if (createdCount > 0) {
      await this.savePluginData();
    }
    this.scheduleVisibleTableRefresh();
    new Notice(
      createdCount > 0
        ? `已为当前文件 ${createdCount} 张表格启用非入侵增强`
        : `当前文件 ${parsedTables.length} 张表格已具备原生表格增强`
    );
  }

  private async initializeCurrentTable() {
    const context = await this.getActiveUninitializedTableContext();
    if (!context) {
      new Notice("当前没有可启用增强的 Markdown 表格");
      return false;
    }
    return this.initializeSpecificTable(context.file, context.parsedTable);
  }

  private async initializeCurrentTableNativeLayout() {
    const context = await this.getActiveUninitializedTableContext();
    if (!context) {
      new Notice("当前没有可启用原生表格增强的 Markdown 表格");
      return false;
    }
    return this.initializeSpecificTableNativeLayout(context.file, context.parsedTable);
  }

  private async initializeSpecificTable(file: TFile, parsedTable: ParsedTableBlock | null) {
    return this.initializeSpecificTableNativeLayout(file, parsedTable);
  }

  private async initializeSpecificTableNativeLayout(file: TFile, parsedTable: ParsedTableBlock | null) {
    if (!parsedTable) {
      new Notice("没有识别到目标表格");
      return false;
    }

    const originalContent = await this.app.vault.cachedRead(file);
    const currentTables = this.parseMarkdownTables(originalContent);
    const targetTable =
      currentTables.find(
        (table) =>
          table.startLine === parsedTable.startLine &&
          table.endLine === parsedTable.endLine &&
          table.raw === parsedTable.raw
      ) ?? currentTables.find((table) => table.startLine === parsedTable.startLine);

    if (!targetTable) {
      new Notice("当前表格定位失败，请重新选中表格后再试");
      return false;
    }

    const existingTableId = this.resolveTableRecordIdForParsedTable(file, targetTable, currentTables);
    if (existingTableId) {
      await this.syncTableRecords(file, currentTables);
      const record = this.dataStore.tables[existingTableId];
      if (record?.mode === "enhanced") {
        if (this.canConvertEnhancedRecordToNativeLayout(record)) {
          this.applyNativeLayoutBeautifyToRecord(record, this.parseRawTable(targetTable.raw));
          await this.savePluginData();
          this.scheduleVisibleTableRefresh();
          new Notice("已对当前表格美化");
          return true;
        }
        new Notice("当前表已启用增强，已经支持长宽高调节");
        return true;
      }
      if (record) {
        this.applyNativeLayoutBeautifyToRecord(record, this.parseRawTable(targetTable.raw));
        await this.savePluginData();
      }
      this.scheduleVisibleTableRefresh();
      new Notice("已对当前表格美化");
      return true;
    }

    const tableId = this.generateTableId();
    const tableIndex = Math.max(0, currentTables.indexOf(targetTable));
    const now = Date.now();
    const record: TableRecord = {
      tableId,
      mode: "nativeLayout",
      markerless: true,
      filePath: file.path,
      createdAt: now,
      updatedAt: now,
      lastKnownHash: this.hashString(targetTable.raw),
      lastKnownRange: {
        startLine: targetTable.startLine,
        endLine: targetTable.endLine,
      },
      identity: this.createNativeTableIdentity(targetTable, tableIndex),
      layout: this.createEmptyLayout(),
    };
    this.applyNativeLayoutBeautifyToRecord(record, this.parseRawTable(targetTable.raw));
    this.dataStore.tables[tableId] = record;
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    new Notice("已对当前表格美化（无正文标记）");
    return true;
  }

  private resolveParsedTableInContent(parsedTable: ParsedTableBlock, currentTables: ParsedTableBlock[]) {
    return (
      currentTables.find(
        (table) =>
          table.startLine === parsedTable.startLine &&
          table.endLine === parsedTable.endLine &&
          table.raw === parsedTable.raw
      ) ?? currentTables.find((table) => table.startLine === parsedTable.startLine) ??
      null
    );
  }

  private getParsedTableIndex(parsedTables: ParsedTableBlock[] | null | undefined, parsedTable: ParsedTableBlock | null | undefined) {
    if (!parsedTables || !parsedTable) return -1;
    const index = parsedTables.indexOf(parsedTable);
    if (index >= 0) return index;
    return parsedTables.findIndex(
      (table) =>
        table.startLine === parsedTable.startLine &&
        table.endLine === parsedTable.endLine &&
        table.raw === parsedTable.raw
    );
  }

  private createNativeTableIdentity(parsedTable: ParsedTableBlock, tableIndex: number): NativeTableIdentity {
    const rawTable = this.parseRawTable(parsedTable.raw);
    const columnCount = rawTable?.header.length ?? this.estimateTableColumnCount(parsedTable.raw);
    const rowCount = rawTable ? rawTable.body.length + 1 : Math.max(0, parsedTable.endLine - parsedTable.startLine);
    const headerText = rawTable ? rawTable.header.join("|").trim() : parsedTable.raw.split(/\r?\n/)[0]?.trim() ?? "";
    return {
      tableIndex,
      tableHash: this.hashString(parsedTable.raw),
      headerHash: this.hashString(headerText),
      structureHash: this.hashString(`${columnCount}:${rowCount}`),
      rowCount,
      columnCount,
      startLine: parsedTable.startLine,
      endLine: parsedTable.endLine,
    };
  }

  private estimateTableColumnCount(raw: string) {
    const firstLine = raw.split(/\r?\n/)[0] ?? "";
    const trimmed = firstLine.trim();
    if (!trimmed) return 0;
    return trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").length;
  }

  private updateTableRecordSource(
    record: TableRecord,
    file: TFile,
    parsedTable: ParsedTableBlock,
    tableIndex: number,
    markerless = record.markerless === true || !parsedTable.tableId
  ) {
    const identity = this.createNativeTableIdentity(parsedTable, tableIndex);
    record.filePath = file.path;
    record.markerless = markerless;
    record.identity = identity;
    record.lastKnownHash = identity.tableHash;
    record.lastKnownRange = {
      startLine: parsedTable.startLine,
      endLine: parsedTable.endLine,
    };
  }

  private findBestMarkerlessRecordIdForParsedTable(
    file: TFile,
    parsedTable: ParsedTableBlock,
    tableIndex: number,
    reservedIds: Set<string> = new Set()
  ) {
    const identity = this.createNativeTableIdentity(parsedTable, tableIndex);
    let best: { tableId: string; score: number } | null = null;
    let secondBestScore = -1;

    for (const record of Object.values(this.dataStore.tables)) {
      if (!record || record.markerless !== true) continue;
      if (record.filePath !== file.path) continue;
      if (reservedIds.has(record.tableId)) continue;

      const score = this.scoreMarkerlessTableMatch(record, identity);
      if (!best || score > best.score) {
        secondBestScore = best?.score ?? -1;
        best = { tableId: record.tableId, score };
      } else if (score > secondBestScore) {
        secondBestScore = score;
      }
    }

    if (!best) return null;
    if (best.score < 80) return null;
    if (best.score === secondBestScore) return null;
    return best.tableId;
  }

  private scoreMarkerlessTableMatch(record: TableRecord, identity: NativeTableIdentity) {
    const saved = record.identity;
    let score = 0;

    if (record.lastKnownHash === identity.tableHash || saved?.tableHash === identity.tableHash) score += 120;
    if (saved?.tableIndex === identity.tableIndex) score += 26;
    if (saved?.headerHash === identity.headerHash) score += 36;
    if (saved?.structureHash === identity.structureHash) score += 28;
    if (saved?.columnCount === identity.columnCount) score += 10;
    if (saved?.rowCount === identity.rowCount) score += 8;

    const savedStart = saved?.startLine ?? record.lastKnownRange?.startLine;
    const savedEnd = saved?.endLine ?? record.lastKnownRange?.endLine;
    if (Number.isFinite(savedStart)) {
      const distance = Math.abs(Number(savedStart) - identity.startLine);
      if (distance === 0) score += 20;
      else if (distance <= 3) score += 12;
      else if (distance <= 10) score += 4;
    }
    if (Number.isFinite(savedEnd) && Math.abs(Number(savedEnd) - identity.endLine) <= 3) {
      score += 6;
    }

    return score;
  }

  private resolveTableRecordIdForParsedTable(
    file: TFile,
    parsedTable: ParsedTableBlock | null,
    parsedTables?: ParsedTableBlock[],
    reservedIds: Set<string> = new Set()
  ) {
    if (!parsedTable) return null;
    if (parsedTable.tableId && this.dataStore.tables[parsedTable.tableId]) return parsedTable.tableId;
    const tableIndex = Math.max(0, this.getParsedTableIndex(parsedTables, parsedTable));
    return this.findBestMarkerlessRecordIdForParsedTable(file, parsedTable, tableIndex, reservedIds);
  }

  private findParsedTableForRecordId(content: string, file: TFile, tableId: string) {
    const parsedTables = this.parseMarkdownTables(content);
    const markedTable = parsedTables.find((table) => table.tableId === tableId);
    if (markedTable) return markedTable;

    const record = this.dataStore.tables[tableId];
    if (!record) return null;
    if (record.markerless !== true) return null;

    const tableIndex = record.identity?.tableIndex ?? -1;
    const indexedTable = tableIndex >= 0 ? parsedTables[tableIndex] ?? null : null;
    if (indexedTable && this.findBestMarkerlessRecordIdForParsedTable(file, indexedTable, tableIndex) === tableId) {
      return indexedTable;
    }

    const reserved = new Set<string>();
    for (let index = 0; index < parsedTables.length; index += 1) {
      const table = parsedTables[index];
      if (this.findBestMarkerlessRecordIdForParsedTable(file, table, index, reserved) === tableId) {
        return table;
      }
      const matched = this.findBestMarkerlessRecordIdForParsedTable(file, table, index, reserved);
      if (matched) reserved.add(matched);
    }

    return null;
  }

  private findInsertedParsedTable(parsedTables: ParsedTableBlock[], tableRaw: string, preferredStartLine: number) {
    const exactMatches = parsedTables.filter((table) => table.raw.trim() === tableRaw.trim());
    if (exactMatches.length === 0) return parsedTables[parsedTables.length - 1] ?? null;
    const afterCursor = exactMatches.find((table) => table.startLine >= preferredStartLine);
    return afterCursor ?? exactMatches[exactMatches.length - 1] ?? null;
  }

  private isTableNativeLayoutBeautified(tableId: string | null | undefined) {
    return !!tableId && this.getTableRecordMode(this.dataStore.tables[tableId]) === "nativeLayout";
  }

  private canBeautifyParsedTableAsNativeLayout(parsedTable: ParsedTableBlock, record: TableRecord | null | undefined) {
    if (!record) return true;
    if (record.mode === "nativeLayout") return false;
    if (record.mode === "enhanced") return this.canConvertEnhancedRecordToNativeLayout(record);
    if (!parsedTable.tableId) return true;
    return true;
  }

  private applyNativeLayoutBeautifyToRecord(record: TableRecord, rawTable?: ParsedRawTable | null) {
    record.mode = "nativeLayout";
    this.stripLegacyEnhancedLayout(record.layout);
    this.applyNativeColorPresetToLayout(record.layout);
    this.applyNativeTableDefaultLayoutSettings(record.layout, rawTable);
    record.updatedAt = Date.now();
  }

  private stripLegacyEnhancedLayout(layout: TableLayoutMetadata) {
    layout.cellColors = {};
    layout.rowColors = {};
    layout.colColors = {};
    layout.cellTextColors = {};
    layout.cellAlignments = {};
    layout.cellImageWidths = {};
    layout.merges = [];
  }

  private async getVisibleParsedTablesInActiveView(file: TFile): Promise<ParsedTableBlock[]> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file || view.file.path !== file.path) return [];
    const contentEl = view.contentEl;
    if (!(contentEl instanceof HTMLElement)) return [];

    const renderedTables = this.getRenderedTables(contentEl);
    if (renderedTables.length === 0) return [];

    const parsedTables = this.parseMarkdownTables(await this.app.vault.cachedRead(file));
    const visible: ParsedTableBlock[] = [];
    for (let index = 0; index < renderedTables.length && index < parsedTables.length; index += 1) {
      const parsedTable = parsedTables[index];
      if (parsedTable) visible.push(parsedTable);
    }
    return visible;
  }

  private async initializeVisiblePageTablesNativeLayout(file: TFile): Promise<boolean> {
    const visibleTables = await this.getVisibleParsedTablesInActiveView(file);
    if (visibleTables.length === 0) {
      new Notice("当前页面没有可见表格");
      return false;
    }

    const originalContent = await this.app.vault.cachedRead(file);
    let currentTables = this.parseMarkdownTables(originalContent);
    await this.syncTableRecords(file, currentTables);

    const tablesToCreate: ParsedTableBlock[] = [];
    const tableIdsToConvert: string[] = [];
    const rawTablesById = new Map<string, ParsedRawTable | null>();

    for (const parsedTable of visibleTables) {
      const targetTable = this.resolveParsedTableInContent(parsedTable, currentTables);
      if (!targetTable) continue;

      const tableId = this.resolveTableRecordIdForParsedTable(file, targetTable, currentTables);
      const record = tableId ? this.dataStore.tables[tableId] : null;
      if (!this.canBeautifyParsedTableAsNativeLayout(targetTable, record)) continue;

      if (!tableId) {
        tablesToCreate.push(targetTable);
        continue;
      }

      if (record?.mode === "enhanced" && !this.canConvertEnhancedRecordToNativeLayout(record)) {
        continue;
      }

      tableIdsToConvert.push(tableId);
      rawTablesById.set(tableId, this.parseRawTable(targetTable.raw));
    }

    if (tablesToCreate.length === 0 && tableIdsToConvert.length === 0) {
      new Notice("当前页面可见表格都已美化");
      return true;
    }

    let createdCount = 0;
    for (const table of tablesToCreate) {
      const tableId = this.generateTableId();
      const tableIndex = Math.max(0, currentTables.indexOf(table));
      const now = Date.now();
      const record: TableRecord = {
        tableId,
        mode: "nativeLayout",
        markerless: true,
        filePath: file.path,
        createdAt: now,
        updatedAt: now,
        lastKnownHash: this.hashString(table.raw),
        lastKnownRange: {
          startLine: table.startLine,
          endLine: table.endLine,
        },
        identity: this.createNativeTableIdentity(table, tableIndex),
        layout: this.createEmptyLayout(),
      };
      this.applyNativeLayoutBeautifyToRecord(record, this.parseRawTable(table.raw));
      this.dataStore.tables[tableId] = record;
      createdCount += 1;
    }

    let convertedCount = 0;
    for (const tableId of tableIdsToConvert) {
      const record = this.dataStore.tables[tableId];
      if (!record || record.mode === "nativeLayout") continue;
      if (record.mode === "enhanced" && !this.canConvertEnhancedRecordToNativeLayout(record)) continue;
      this.applyNativeLayoutBeautifyToRecord(record, rawTablesById.get(tableId) ?? null);
      convertedCount += 1;
    }

    if (convertedCount > 0 || createdCount > 0) {
      await this.savePluginData();
    }

    const beautifiedCount = createdCount + convertedCount;
    this.scheduleVisibleTableRefresh();
    new Notice(`已对本页 ${beautifiedCount} 张表格美化（无正文标记）`);
    return beautifiedCount > 0;
  }

  private async insertEnhancedTableTemplate() {
    return this.insertNativeColorTableTemplate();
  }

  private async insertNativeColorTableTemplate() {
    const file = this.getActiveMarkdownFile();
    if (!file) return false;

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (view as any)?.editor;
    const tableId = this.generateTableId();
    const rawTable = this.buildNativeColorRawTable();
    const tableLines = this.buildRawTable(rawTable);
    const tableRaw = tableLines.join("\n");
    const template = [tableRaw, ""].join("\n");
    const record = this.createNativeColorTableRecord(file, tableId, tableRaw);

    if (editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() ? "\n\n" : "";
      const preferredStartLine = cursor.line + (prefix ? 2 : 0);
      editor.replaceRange(`${prefix}${template}\n`, cursor);
      const nextContent =
        typeof editor.getValue === "function" ? String(editor.getValue() ?? "") : await this.app.vault.cachedRead(file);
      const parsedTables = this.parseMarkdownTables(nextContent);
      const insertedTable = this.findInsertedParsedTable(parsedTables, tableRaw, preferredStartLine);
      if (insertedTable) {
        this.updateTableRecordSource(record, file, insertedTable, Math.max(0, parsedTables.indexOf(insertedTable)), true);
      }
      this.dataStore.tables[tableId] = record;
      await this.savePluginData();
      window.setTimeout(() => this.queueRefreshBurst(), 120);
      new Notice("已插入彩色原生空表格（无正文标记）");
      return true;
    }

    const originalContent = await this.app.vault.cachedRead(file);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const separator = originalContent.trim().length === 0 ? "" : originalEndsWithNewline ? "\n" : "\n\n";
    const updatedContent = `${originalContent}${separator}${template}\n`;
    await this.app.vault.modify(file, updatedContent);
    const parsedTables = this.parseMarkdownTables(updatedContent);
    const insertedTable = this.findInsertedParsedTable(parsedTables, tableRaw, parsedTables.length > 0 ? parsedTables[parsedTables.length - 1].startLine : 0);
    if (insertedTable) {
      this.updateTableRecordSource(record, file, insertedTable, Math.max(0, parsedTables.indexOf(insertedTable)), true);
    }
    this.dataStore.tables[tableId] = record;
    await this.savePluginData();
    this.queueRefreshBurst();
    new Notice("已插入彩色原生空表格（无正文标记）");
    return true;
  }

  private buildNativeColorRawTable(): ParsedRawTable {
    return {
      header: ["", "", ""],
      divider: ["---", "---", "---"],
      body: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ],
    };
  }

  private createNativeColorTableRecord(file: TFile, tableId: string, tableRaw: string): TableRecord {
    const now = Date.now();
    const layout = this.createNativeColorTableLayout();
    return {
      tableId,
      mode: "nativeLayout",
      markerless: true,
      filePath: file.path,
      createdAt: now,
      updatedAt: now,
      lastKnownHash: this.hashString(tableRaw),
      lastKnownRange: {
        startLine: 0,
        endLine: 0,
      },
      layout,
    };
  }

  private createNativeColorTableLayout() {
    const layout = this.createEmptyLayout();
    this.applyNativeColorPresetToLayout(layout);
    this.applyNativeTableDefaultLayoutSettings(layout, this.buildNativeColorRawTable());
    return layout;
  }

  private applyNativeColorPresetToLayout(layout: TableLayoutMetadata) {
    const palette = this.getCurrentNativeColorPalette();
    layout.cellColors = {};
    layout.rowColors = {};
    layout.colColors = {};
    layout.nativeColorPalette = palette;
    layout.rowColors["0"] = palette.header;
    layout.nativeBorderEnabled = this.getNativeTableDefaultBorderEnabled();
    if (this.getNativeTableDefaultZebraEnabled()) {
      layout.nativeColorPreset = NATIVE_COLOR_PRESET_BLUE_ZEBRA;
    } else {
      delete layout.nativeColorPreset;
    }
  }

  private applyNativeTableDefaultLayoutSettings(_layout: TableLayoutMetadata, _rawTable?: ParsedRawTable | null) {
    // Size metadata is created only after manual adjustment, so beautify keeps the native table dimensions.
    // Header and first-column alignment are runtime defaults, not persisted cell overrides.
  }

  private normalizeNativeColorPresetLayout(layout: TableLayoutMetadata) {
    const palette = this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
    layout.nativeColorPalette = palette;
    if (!layout.rowColors["0"] || this.isLegacyNativeColorTableHeaderColor(layout.rowColors["0"])) {
      layout.rowColors["0"] = palette.header;
    }
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return;
  }

  private canConvertEnhancedRecordToNativeLayout(record: TableRecord | null | undefined) {
    if (!record || record.mode !== "enhanced") return false;
    return true;
  }

  getNativeColorSettingsForManager() {
    const savedPresets = this.getNativeColorSavedPalettes().map((item) => ({
      id: item.id,
      label: item.label,
      palette: { ...item.palette },
      saved: true,
    }));
    return {
      defaultPresetId: this.normalizeNativeColorPresetId(this.dataStore.nativeColorDefaultPresetId),
      presets: [
        {
          id: "blue" as const,
          label: NATIVE_COLOR_PRESET_PALETTES.blue.label,
          palette: { ...NATIVE_COLOR_PRESET_PALETTES.blue },
        },
        {
          id: "green" as const,
          label: NATIVE_COLOR_PRESET_PALETTES.green.label,
          palette: { ...NATIVE_COLOR_PRESET_PALETTES.green },
        },
        ...savedPresets,
        {
          id: "custom" as const,
          label: "自定义",
          palette: this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT),
        },
      ],
      customPalette: this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT),
      savedPalettes: savedPresets,
      defaultScale: this.getNativeTableDefaultScale(),
      defaultColumnWidth: this.getNativeTableDefaultColumnWidth(),
      defaultRowHeight: this.getNativeTableDefaultRowHeight(),
      defaultTextColor: this.getNativeTableDefaultTextColor(),
      defaultZebraEnabled: this.getNativeTableDefaultZebraEnabled(),
      defaultBorderEnabled: this.getNativeTableDefaultBorderEnabled(),
      defaultHeaderAlignment: this.getNativeTableDefaultHeaderAlignment(),
      defaultFirstColumnAlignment: this.getNativeTableDefaultFirstColumnAlignment(),
    };
  }

  async updateNativeColorSettingsFromManager(input: {
    defaultPresetId?: string;
    customPalette?: Partial<NativeColorPalette>;
  }) {
    this.dataStore.nativeColorDefaultPresetId = this.normalizeNativeColorPresetId(input.defaultPresetId);
    if (input.customPalette) {
      this.dataStore.nativeColorCustomPalette = this.normalizeNativeColorPalette(
        input.customPalette,
        this.dataStore.nativeColorCustomPalette ?? NATIVE_COLOR_CUSTOM_DEFAULT
      );
    }
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    new Notice("已更新原生表格颜色预设");
    return this.getNativeColorSettingsForManager();
  }

  async updateNativeTableDefaultsFromManager(input: {
    defaultScale?: number;
    defaultColumnWidth?: number;
    defaultRowHeight?: number;
    defaultTextColor?: string;
    defaultZebraEnabled?: boolean;
    defaultBorderEnabled?: boolean;
    defaultHeaderAlignment?: NativeTableAutoAlignment;
    defaultFirstColumnAlignment?: NativeTableAutoAlignment;
  }) {
    const previousHeaderAlignment = this.getNativeTableDefaultHeaderAlignment();
    const previousFirstColumnAlignment = this.getNativeTableDefaultFirstColumnAlignment();
    const shouldRefreshAutoAlignment =
      input.defaultHeaderAlignment !== undefined || input.defaultFirstColumnAlignment !== undefined;

    if (input.defaultScale !== undefined) {
      this.dataStore.nativeTableDefaultScale = this.normalizeNativeTableScale(input.defaultScale, this.getNativeTableDefaultScale());
    }
    if (input.defaultColumnWidth !== undefined) {
      this.dataStore.nativeTableDefaultColumnWidth = this.normalizeNativeTableDefaultSize(
        input.defaultColumnWidth,
        this.getNativeTableDefaultColumnWidth(),
        MIN_COLUMN_WIDTH,
        MAX_COLUMN_WIDTH
      );
    }
    if (input.defaultRowHeight !== undefined) {
      this.dataStore.nativeTableDefaultRowHeight = this.normalizeNativeTableDefaultSize(
        input.defaultRowHeight,
        this.getNativeTableDefaultRowHeight(),
        MIN_ROW_HEIGHT,
        MAX_ROW_HEIGHT
      );
    }
    if (input.defaultTextColor !== undefined) {
      this.dataStore.nativeTableDefaultTextColor = this.normalizeHexColor(input.defaultTextColor, this.getNativeTableDefaultTextColor());
    }
    if (input.defaultZebraEnabled !== undefined) {
      this.dataStore.nativeTableDefaultZebraEnabled = input.defaultZebraEnabled !== false;
    }
    if (input.defaultBorderEnabled !== undefined) {
      this.dataStore.nativeTableDefaultBorderEnabled = input.defaultBorderEnabled === true;
    }
    if (input.defaultHeaderAlignment !== undefined) {
      this.dataStore.nativeTableDefaultHeaderAlignment = this.normalizeNativeTableAutoAlignment(
        input.defaultHeaderAlignment,
        this.getNativeTableDefaultHeaderAlignment()
      );
    }
    if (input.defaultFirstColumnAlignment !== undefined) {
      this.dataStore.nativeTableDefaultFirstColumnAlignment = this.normalizeNativeTableAutoAlignment(
        input.defaultFirstColumnAlignment,
        this.getNativeTableDefaultFirstColumnAlignment()
      );
    }
    if (shouldRefreshAutoAlignment) {
      this.clearPersistedNativeAutoAlignment(previousHeaderAlignment, previousFirstColumnAlignment);
    }
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    new Notice("已更新原生表格设置");
    return this.getNativeColorSettingsForManager();
  }

  async saveCurrentNativeColorPaletteAsManager(label?: string) {
    const now = Date.now();
    const palette = this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT);
    const title = this.normalizeNativeColorSavedPaletteLabel(label, this.getNextNativeColorSavedPaletteLabel());
    const item: NativeColorSavedPalette = {
      id: `saved_${now.toString(36)}`,
      label: title,
      palette,
      createdAt: now,
      updatedAt: now,
    };
    this.dataStore.nativeColorSavedPalettes = [...this.getNativeColorSavedPalettes(), item].slice(-12);
    this.dataStore.nativeColorDefaultPresetId = item.id;
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    new Notice(`已保存配色方案：${title}`);
    return this.getNativeColorSettingsForManager();
  }

  async deleteNativeColorPaletteFromManager(id: string) {
    const normalizedId = String(id ?? "").trim();
    if (!normalizedId.startsWith("saved_")) return this.getNativeColorSettingsForManager();
    this.dataStore.nativeColorSavedPalettes = this.getNativeColorSavedPalettes().filter((item) => item.id !== normalizedId);
    if (this.dataStore.nativeColorDefaultPresetId === normalizedId) {
      this.dataStore.nativeColorDefaultPresetId = NATIVE_COLOR_DEFAULT_PRESET_ID;
    }
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    return this.getNativeColorSettingsForManager();
  }

  private normalizeNativeColorPresetId(value: unknown, savedPalettes?: NativeColorSavedPalette[]): NativeColorPresetId {
    const raw = typeof value === "string" ? value.trim() : "";
    if (raw === "blue" || raw === "green" || raw === "custom") return raw;
    const saved = savedPalettes ?? this.getNativeColorSavedPalettes();
    return saved.some((item) => item.id === raw) ? raw : NATIVE_COLOR_DEFAULT_PRESET_ID;
  }

  private getCurrentNativeColorPalette() {
    const presetId = this.normalizeNativeColorPresetId(this.dataStore.nativeColorDefaultPresetId);
    if (presetId === "custom") {
      return this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT);
    }
    const savedPreset = this.getNativeColorSavedPalettes().find((item) => item.id === presetId);
    if (savedPreset) {
      return this.normalizeNativeColorPalette(savedPreset.palette, NATIVE_COLOR_CUSTOM_DEFAULT);
    }
    const builtInPresetId: NativeColorBuiltInPresetId = presetId === "blue" || presetId === "green" ? presetId : NATIVE_COLOR_DEFAULT_PRESET_ID;
    return this.normalizeNativeColorPalette(NATIVE_COLOR_PRESET_PALETTES[builtInPresetId], NATIVE_COLOR_PRESET_PALETTES[builtInPresetId]);
  }

  private getNativeColorSavedPalettes() {
    return this.normalizeNativeColorSavedPalettes(this.dataStore.nativeColorSavedPalettes);
  }

  private normalizeNativeColorSavedPalettes(value: unknown): NativeColorSavedPalette[] {
    if (!Array.isArray(value)) return [];
    const result: NativeColorSavedPalette[] = [];
    const seen = new Set<string>();
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const candidate = item as Partial<NativeColorSavedPalette>;
      const id = typeof candidate.id === "string" && candidate.id.trim().startsWith("saved_") ? candidate.id.trim() : "";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      result.push({
        id,
        label: this.normalizeNativeColorSavedPaletteLabel(candidate.label, `配色方案 ${result.length + 1}`),
        palette: this.normalizeNativeColorPalette(candidate.palette, NATIVE_COLOR_CUSTOM_DEFAULT),
        createdAt: Number.isFinite(candidate.createdAt) ? Number(candidate.createdAt) : Date.now(),
        updatedAt: Number.isFinite(candidate.updatedAt) ? Number(candidate.updatedAt) : Date.now(),
      });
    }
    return result.slice(-12);
  }

  private normalizeNativeColorSavedPaletteLabel(value: unknown, fallback: string) {
    const text = typeof value === "string" ? value.trim() : "";
    return (text || fallback).slice(0, 24);
  }

  private getNextNativeColorSavedPaletteLabel() {
    return `配色方案 ${this.getNativeColorSavedPalettes().length + 1}`;
  }

  private getLayoutNativeColorPalette(layout: TableLayoutMetadata) {
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return null;
    return this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
  }

  private normalizeNativeColorPalette(value: unknown, fallback: NativeColorPalette): NativeColorPalette {
    const candidate = value && typeof value === "object" ? (value as Partial<NativeColorPalette>) : {};
    return {
      header: this.normalizeHexColor(candidate.header, fallback.header),
      headerText: this.normalizeHexColor(candidate.headerText, fallback.headerText),
      baseRow: this.normalizeHexColor(candidate.baseRow, fallback.baseRow),
      altRow: this.normalizeHexColor(candidate.altRow, fallback.altRow),
      border: this.normalizeHexColor(candidate.border, fallback.border),
    };
  }

  private normalizeHexColor(value: unknown, fallback: string) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase();
    }
    return fallback.toUpperCase();
  }

  private normalizeOptionalHexColor(value: unknown) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) return "";
    return this.normalizeHexColor(raw, "");
  }

  private normalizeNativeTableScale(value: unknown, fallback = NATIVE_TABLE_DEFAULT_SCALE) {
    const numeric = Number(value);
    const base = Number.isFinite(numeric) ? numeric : fallback;
    const clamped = Math.min(NATIVE_TABLE_MAX_SCALE, Math.max(NATIVE_TABLE_MIN_SCALE, base));
    return Math.round(clamped * 20) / 20;
  }

  private normalizeNativeTableDefaultSize(value: unknown, fallback: number, min: number, max: number) {
    const numeric = Number(value);
    const base = Number.isFinite(numeric) ? numeric : fallback;
    return Math.round(Math.min(max, Math.max(min, base)));
  }

  private getNativeTableDefaultScale() {
    return this.normalizeNativeTableScale(this.dataStore.nativeTableDefaultScale, NATIVE_TABLE_DEFAULT_SCALE);
  }

  private getNativeTableDefaultColumnWidth() {
    return this.normalizeNativeTableDefaultSize(
      this.dataStore.nativeTableDefaultColumnWidth,
      NATIVE_TABLE_DEFAULT_COLUMN_WIDTH,
      MIN_COLUMN_WIDTH,
      MAX_COLUMN_WIDTH
    );
  }

  private getNativeTableDefaultRowHeight() {
    return this.normalizeNativeTableDefaultSize(
      this.dataStore.nativeTableDefaultRowHeight,
      NATIVE_TABLE_DEFAULT_ROW_HEIGHT,
      MIN_ROW_HEIGHT,
      MAX_ROW_HEIGHT
    );
  }

  private getNativeTableDefaultTextColor() {
    return this.normalizeHexColor(this.dataStore.nativeTableDefaultTextColor, NATIVE_TABLE_DEFAULT_TEXT_COLOR);
  }

  private getNativeTableDefaultZebraEnabled() {
    return this.dataStore.nativeTableDefaultZebraEnabled !== false;
  }

  private getNativeTableDefaultBorderEnabled() {
    return this.dataStore.nativeTableDefaultBorderEnabled === true;
  }

  private getNativeTableDefaultHeaderAlignment() {
    return this.normalizeNativeTableAutoAlignment(this.dataStore.nativeTableDefaultHeaderAlignment, "center");
  }

  private getNativeTableDefaultFirstColumnAlignment() {
    return this.normalizeNativeTableAutoAlignment(this.dataStore.nativeTableDefaultFirstColumnAlignment, "left");
  }

  private normalizeNativeTableAutoAlignment(value: unknown, fallback: NativeTableAutoAlignment = "off"): NativeTableAutoAlignment {
    return value === "left" || value === "center" || value === "right" || value === "off" ? value : fallback;
  }

  private clearPersistedNativeAutoAlignment(
    previousHeaderAlignment: NativeTableAutoAlignment,
    previousFirstColumnAlignment: NativeTableAutoAlignment
  ) {
    for (const record of Object.values(this.dataStore.tables)) {
      if (!record || record.mode !== "nativeLayout") continue;
      for (const [key, alignment] of Object.entries(record.layout.cellAlignments)) {
        const coord = this.parseCellKey(key);
        if (!coord) continue;
        if (coord.row === 0 && previousHeaderAlignment !== "off" && alignment === previousHeaderAlignment) {
          delete record.layout.cellAlignments[key];
          record.updatedAt = Date.now();
          continue;
        }
        if (coord.row > 0 && coord.col === 0 && previousFirstColumnAlignment !== "off" && alignment === previousFirstColumnAlignment) {
          delete record.layout.cellAlignments[key];
          record.updatedAt = Date.now();
        }
      }
    }
  }

  private colorsMatch(left: string, right: string) {
    return left.trim().toUpperCase() === right.trim().toUpperCase();
  }

  private openTemplateNameModal(templateContent: string) {
    const normalized = templateContent.trim().length > 0 ? templateContent : "";
    if (!normalized) {
      new Notice("请先选中要保存为模板的内容");
      return;
    }
    new TemplateNameModal(this, templateContent).open();
  }

  openTemplateLibraryModal() {
    new TemplateLibraryModal(this).open();
  }

  private getActiveTemplateSelectionContent(silent = false) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (view as any)?.editor;
    if (editor && typeof editor.getSelection === "function") {
      const selected = String(editor.getSelection() ?? "");
      if (selected.trim().length > 0) return selected;
    }

    const browserSelection = typeof window !== "undefined" ? window.getSelection?.() : null;
    const selectedText = String(browserSelection?.toString?.() ?? "");
    if (selectedText.trim().length > 0) return selectedText;

    if (!silent) {
      new Notice("请先选中要保存为模板的内容");
    }
    return null;
  }

  private isTemplateSectionBoundaryLine(line: string) {
    const trimmed = String(line ?? "").trim();
    if (!trimmed) return false;
    if (/^#{1,6}\s+/.test(trimmed)) return true;
    if (/^---+$/.test(trimmed)) return true;
    if (/^==.+==$/.test(trimmed)) return true;
    return false;
  }

  private getTemplateSectionRangeAtLine(editor: { lineCount(): number; getLine(line: number): string }, line: number) {
    const lineCount = editor.lineCount();
    let startLine = line;
    for (let current = line; current >= 0; current -= 1) {
      const content = String(editor.getLine(current) ?? "");
      if (this.isTemplateSectionBoundaryLine(content)) {
        startLine = current;
        break;
      }
      if (current === 0) startLine = 0;
    }

    let endLine = line;
    for (let current = line + 1; current < lineCount; current += 1) {
      if (this.isTemplateSectionBoundaryLine(String(editor.getLine(current) ?? ""))) {
        break;
      }
      endLine = current;
    }

    return { startLine, endLine };
  }

  private readEditorLines(editor: { getLine(line: number): string }, startLine: number, endLine: number) {
    const lines: string[] = [];
    for (let line = startLine; line <= endLine; line += 1) {
      lines.push(String(editor.getLine(line) ?? ""));
    }
    return lines.join("\n");
  }

  private getParsedTableAtEditorLine(view: MarkdownView): ParsedTableBlock | null {
    const editor = (view as MarkdownView & { editor?: { getCursor?: () => { line: number }; getValue?: () => string } })
      .editor;
    if (!editor || typeof editor.getCursor !== "function") return null;
    const line = Math.max(0, editor.getCursor()?.line ?? 0);
    const content = typeof editor.getValue === "function" ? String(editor.getValue() ?? "") : "";
    if (!content.trim()) return null;
    return this.parseMarkdownTables(content).find((table) => line >= table.startLine && line <= table.endLine) ?? null;
  }

  private getEditorTemplateSaveContent(view?: MarkdownView | null, silent = false) {
    const selected = this.getActiveTemplateSelectionContent(true);
    if (selected?.trim()) return selected;

    const activeView = view ?? this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (
      activeView as MarkdownView & {
        editor?: { getCursor?: () => { line: number }; lineCount?: () => number; getLine?: (line: number) => string };
      }
    )?.editor;
    if (
      editor &&
      typeof editor.getCursor === "function" &&
      typeof editor.lineCount === "function" &&
      typeof editor.getLine === "function"
    ) {
      const cursorLine = Math.max(0, editor.getCursor()?.line ?? 0);
      const sectionRange = this.getTemplateSectionRangeAtLine(editor, cursorLine);
      const sectionContent = this.readEditorLines(editor, sectionRange.startLine, sectionRange.endLine);
      if (sectionContent.trim().length > 0) return sectionContent;
    }

    const feishu = this.app.plugins.plugins["feishu-doc-toolbar"] as
      | { getTemplateContentForEditor?: (editor: unknown, line: number) => string | null }
      | undefined;
    if (typeof feishu?.getTemplateContentForEditor === "function" && editor && typeof editor.getCursor === "function") {
      const bridged = feishu.getTemplateContentForEditor(editor, Math.max(0, editor.getCursor()?.line ?? 0));
      if (bridged?.trim()) return bridged;
    }

    if (!silent) {
      new Notice("请先选中要保存为模板的内容");
    }
    return null;
  }

  async createTemplateFromContent(rawName: string, templateContent: string) {
    const content = templateContent.trim().length > 0 ? templateContent : "";
    if (!content) {
      new Notice("模板内容为空，未保存");
      return false;
    }

    await this.ensureFolderExists(TEMPLATE_LIBRARY_FOLDER);
    const safeRelativePath = this.sanitizeTemplateRelativePath(rawName);
    const path = await this.getAvailableTemplatePath(safeRelativePath);
    await this.ensureFolderExists(this.getParentPath(path));
    try {
      await this.app.vault.create(path, content);
    } catch (error) {
      console.warn("[mdtp] vault.create template failed, falling back to adapter.write", error);
      await this.app.vault.adapter.write(path, content);
    }
    new Notice(`已保存模板：${this.getTemplateNameFromPath(path)}`);
    return true;
  }

  async createTemplateFromModalInput(rawName: string, rawContent: string) {
    const name = rawName.trim();
    if (!name) {
      new Notice("请先填写模板名称");
      return false;
    }

    const content = String(rawContent ?? "");
    if (content.trim().length > 0) {
      return this.createTemplateFromContent(name, content);
    }

    return this.createEmptyTemplate(name);
  }

  async createEmptyTemplate(rawName: string) {
    await this.ensureFolderExists(TEMPLATE_LIBRARY_FOLDER);
    const safeRelativePath = this.sanitizeTemplateRelativePath(rawName);
    const path = await this.getAvailableTemplatePath(safeRelativePath);
    await this.ensureFolderExists(this.getParentPath(path));
    try {
      await this.app.vault.create(path, "");
    } catch (error) {
      console.warn("[mdtp] vault.create empty template failed, falling back to adapter.write", error);
      await this.app.vault.adapter.write(path, "");
    }
    new Notice(`已新建模板：${this.getTemplateNameFromPath(path)}`);
    return { name: this.getTemplateNameFromPath(path), path };
  }

  async getTemplateRecords(): Promise<TemplateRecord[]> {
    await this.ensureFolderExists(TEMPLATE_LIBRARY_FOLDER);
    const paths = await this.listTemplateMarkdownPaths(TEMPLATE_LIBRARY_FOLDER);
    return paths
      .map((filePath: string) => this.createTemplateRecord(filePath))
      .sort((a: TemplateRecord, b: TemplateRecord) => {
        const folderCompare = a.folderPath.localeCompare(b.folderPath, "zh-Hans-CN");
        if (folderCompare !== 0) return folderCompare;
        return a.name.localeCompare(b.name, "zh-Hans-CN");
      });
  }

  async insertTemplateByPath(templatePath: string) {
    const adapter = this.app.vault.adapter;
    const normalizedPath = normalizePath(templatePath);
    if (!(await adapter.exists(normalizedPath))) {
      new Notice("模板文件不存在");
      return false;
    }

    const content = await adapter.read(normalizedPath);
    const inserted = await this.insertTemplateContentAtCursor(content);
    if (inserted) {
      new Notice(`已插入模板：${this.getTemplateNameFromPath(normalizedPath)}`);
    }
    return inserted;
  }

  async openTemplateForEdit(templatePath: string) {
    const normalizedPath = normalizePath(templatePath);
    const template = {
      name: this.getTemplateNameFromPath(normalizedPath),
      path: normalizedPath,
    };
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
      return true;
    }

    if (!(await this.app.vault.adapter.exists(normalizedPath))) {
      new Notice("模板文件不存在");
      return false;
    }
    new TemplateEditModal(this, template).open();
    return true;
  }

  async readTemplateContent(templatePath: string) {
    const normalizedPath = normalizePath(templatePath);
    if (!(await this.app.vault.adapter.exists(normalizedPath))) return "";
    return this.app.vault.adapter.read(normalizedPath);
  }

  async writeTemplateContent(templatePath: string, content: string) {
    const normalizedPath = normalizePath(templatePath);
    await this.ensureFolderExists(TEMPLATE_LIBRARY_FOLDER);
    await this.app.vault.adapter.write(normalizedPath, content);
  }

  async deleteTemplateByPath(templatePath: string) {
    const feishu = this.app.plugins?.plugins?.["feishu-doc-toolbar"] as
      | { deleteTemplateAtPath?: (path: string) => Promise<boolean> }
      | undefined;
    if (typeof feishu?.deleteTemplateAtPath === "function") {
      return feishu.deleteTemplateAtPath(templatePath);
    }

    const normalizedPath = normalizePath(templatePath);
    if (!normalizedPath.startsWith(`${TEMPLATE_LIBRARY_FOLDER}/`) || !normalizedPath.toLowerCase().endsWith(".md")) {
      new Notice("只能删除模板库中的模板文件");
      return false;
    }

    const templateName = this.getTemplateNameFromPath(normalizedPath);
    const confirmed = window.confirm(`确定删除模板“${templateName}”吗？\n\n删除后会从模板库移除。`);
    if (!confirmed) return false;

    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    try {
      if (file instanceof TFile && typeof this.app.vault.trash === "function") {
        await this.app.vault.trash(file, true);
      } else if (file instanceof TFile && typeof this.app.vault.delete === "function") {
        await this.app.vault.delete(file);
      } else if (await this.app.vault.adapter.exists(normalizedPath)) {
        await this.app.vault.adapter.remove(normalizedPath);
      } else {
        new Notice("模板文件不存在");
        return false;
      }
      new Notice(`已删除模板：${templateName}`);
      return true;
    } catch (error) {
      console.warn("[mdtp] delete template failed", error);
      new Notice("删除模板失败");
      return false;
    }
  }

  async insertTemplateContentAtCursor(content: string, position?: { line: number; ch: number }) {
    const file = this.getActiveMarkdownFile();
    if (!file) return false;
    if (content.trim().length === 0) {
      new Notice("模板内容为空");
      return false;
    }

    const prepared = this.prepareTemplateContentForInsertion(content, file);
    if (prepared.content.trim().length === 0) {
      new Notice("模板内容为空");
      return false;
    }
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (view as any)?.editor;
    if (editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = position ?? editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() && !prepared.content.startsWith("\n") ? "\n\n" : "";
      const preferredStartLine = cursor.line + (prefix ? 2 : 0);
      editor.replaceRange(`${prefix}${prepared.content}`, cursor);
      const nextContent =
        typeof editor.getValue === "function" ? String(editor.getValue() ?? "") : await this.app.vault.cachedRead(file);
      await this.savePreparedTemplateTableRecords(file, prepared.tableRecords, nextContent, preferredStartLine);
      window.setTimeout(() => this.queueRefreshBurst(), 120);
      return true;
    }

    const originalContent = await this.app.vault.cachedRead(file);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const separator = originalContent.trim().length === 0 ? "" : originalEndsWithNewline ? "\n" : "\n\n";
    const nextContent = `${originalContent}${separator}${prepared.content}`;
    await this.app.vault.modify(file, nextContent);
    await this.savePreparedTemplateTableRecords(
      file,
      prepared.tableRecords,
      nextContent,
      originalContent.split(/\r?\n/).length
    );
    this.queueRefreshBurst();
    return true;
  }

  private async savePreparedTemplateTableRecords(
    file: TFile,
    records: TableRecord[],
    content: string,
    preferredStartLine: number
  ) {
    if (records.length === 0) return;
    const parsedTables = this.parseMarkdownTables(content);
    const candidates = parsedTables.filter((table) => table.startLine >= preferredStartLine);
    const targetTables = candidates.length >= records.length ? candidates : parsedTables.slice(-records.length);
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const parsedTable = targetTables[index];
      if (record && parsedTable) {
        this.updateTableRecordSource(record, file, parsedTable, Math.max(0, parsedTables.indexOf(parsedTable)), true);
        this.dataStore.tables[record.tableId] = record;
      }
    }
    await this.savePluginData();
  }

  private async saveEnhancedTableSelectionAsTemplate(
    file: TFile,
    tableId: string,
    selection: SelectionRect
  ) {
    const content = await this.buildEnhancedTableTemplateContent(file, tableId, selection);
    if (!content) return false;
    this.openTemplateNameModal(content);
    return true;
  }

  private async buildEnhancedTableTemplateContent(file: TFile, tableId: string, selection: SelectionRect) {
    const content = await this.app.vault.cachedRead(file);
    const parsedTable = this.findParsedTableForRecordId(content, file, tableId);
    if (!parsedTable) {
      new Notice("没有读到当前表格");
      return null;
    }
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) {
      new Notice("没有读到当前表格内容");
      return null;
    }
    const record = this.dataStore.tables[tableId];
    const fullSelection = this.isFullTableSelection(rawTable, selection);
    if (fullSelection) {
      const metadata = this.serializeTemplateTableMetadata({
        [tableId]: {
          mode: "nativeLayout",
          layout: record?.layout ? this.cloneLayout(record.layout) : this.createEmptyLayout(),
        },
      });
      return `${metadata}\n\n${parsedTable.raw}\n`;
    }

    const matrix = await this.readSelectionSourceMatrix(file, tableId, selection, { preserveRaw: true });
    if (!matrix) {
      new Notice("没有读到当前表格选区");
      return null;
    }
    const rowCount = matrix.length;
    const colCount = Math.max(...matrix.map((row) => row.length), 0);
    if (rowCount <= 1 && colCount <= 1) {
      return this.buildHighFidelityClipboardTextFromMatrix(matrix);
    }

    const nextTableId = this.generateTableId();
    const tableMarkdown = this.buildClipboardTextFromMatrix(matrix).trim();
    const layout = record?.layout ? this.extractLayoutForSelection(record.layout, selection) : this.createEmptyLayout();
      const metadata = this.serializeTemplateTableMetadata({
        [nextTableId]: {
          mode: "nativeLayout",
          layout,
        },
      });
    return `${metadata}\n\n${tableMarkdown}\n`;
  }

  private async savePlainTableSelectionAsTemplate(context: UninitializedTableContext) {
    const rawTable = this.parseRawTable(context.parsedTable.raw);
    if (!rawTable) {
      new Notice("没有读到当前表格内容");
      return false;
    }
    const rect = this.resolvePlainTableTemplateSelection(context.tableEl ?? null, context.coord);
    const matrix: string[][] = [];
    for (let row = rect.startRow; row <= rect.endRow; row += 1) {
      const values: string[] = [];
      for (let col = rect.startCol; col <= rect.endCol; col += 1) {
        values.push(this.getCellValue(rawTable, { row, col }) ?? "");
      }
      matrix.push(values);
    }
    const content = this.buildHighFidelityClipboardTextFromMatrix(matrix);
    this.openTemplateNameModal(content);
    return true;
  }

  private async savePlainTableAsTemplate(context: Pick<UninitializedTableContext, "parsedTable">) {
    const content = this.normalizeTemplateTableContent(context.parsedTable.raw);
    if (!content.trim()) {
      new Notice("没有读到当前表格内容");
      return false;
    }
    this.openTemplateNameModal(content);
    return true;
  }

  private async saveManagedTableAsTemplate(file: TFile, parsedTable: ParsedTableBlock | null, tableId?: string | null) {
    if (!parsedTable) {
      new Notice("没有读到当前表格内容");
      return false;
    }
    const content = this.buildManagedWholeTableTemplateContent(parsedTable, tableId ?? parsedTable.tableId);
    if (!content.trim()) {
      new Notice("没有读到当前表格内容");
      return false;
    }
    this.openTemplateNameModal(content);
    void file;
    return true;
  }

  private buildManagedWholeTableTemplateContent(parsedTable: ParsedTableBlock, tableId?: string | null) {
    const effectiveTableId = tableId ?? parsedTable.tableId;
    if (!effectiveTableId) {
      return this.normalizeTemplateTableContent(parsedTable.raw);
    }
    const record = this.dataStore.tables[effectiveTableId];
    if (this.getTableRecordMode(record) !== "nativeLayout") {
      return this.normalizeTemplateTableContent(parsedTable.raw);
    }
    const metadata = this.serializeTemplateTableMetadata({
      [effectiveTableId]: {
        mode: "nativeLayout",
        layout: record?.layout ? this.cloneLayout(record.layout) : this.createEmptyLayout(),
      },
    });
    return `${metadata}\n\n${this.normalizeTemplateTableContent(parsedTable.raw)}`;
  }

  private normalizeTemplateTableContent(raw: string) {
    const trimmed = String(raw ?? "").trim();
    return trimmed ? `${trimmed}\n` : "";
  }

  private resolvePlainTableTemplateSelection(tableEl: HTMLTableElement | null, fallbackCoord: CellCoord): SelectionRect {
    if (!tableEl) return this.normalizeSelection(fallbackCoord, fallbackCoord);
    const selectedCoords = this.collectPlainTableSelectedCoords(tableEl);
    if (selectedCoords.length === 0) return this.normalizeSelection(fallbackCoord, fallbackCoord);
    const rows = selectedCoords.map((coord) => coord.row);
    const cols = selectedCoords.map((coord) => coord.col);
    return {
      startRow: Math.min(...rows),
      endRow: Math.max(...rows),
      startCol: Math.min(...cols),
      endCol: Math.max(...cols),
    };
  }

  private collectPlainTableSelectedCoords(tableEl: HTMLTableElement) {
    const selection = window.getSelection?.() ?? null;
    const cells = Array.from(tableEl.querySelectorAll("th, td")) as HTMLTableCellElement[];
    const selected: CellCoord[] = [];
    for (const cell of cells) {
      if (!this.isPlainTableCellSelected(cell, selection)) continue;
      const coord = this.getPlainTableCellCoord(cell);
      if (coord) selected.push(coord);
    }
    return selected;
  }

  private isPlainTableCellSelected(cell: HTMLTableCellElement, selection: Selection | null) {
    if (
      cell.matches(
        [
          ".is-selected",
          ".mod-selected",
          ".table-cell-selected",
          ".table-editor-cell-selected",
          ".cm-table-widget-cell-selected",
          "[aria-selected='true']",
          "[data-selected='true']",
          "[data-is-selected='true']",
        ].join(",")
      )
    ) {
      return true;
    }

    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      for (let index = 0; index < selection.rangeCount; index += 1) {
        const range = selection.getRangeAt(index);
        try {
          if (range.intersectsNode(cell)) return true;
        } catch {
          // Some Obsidian virtualized nodes can disappear between contextmenu and range inspection.
        }
      }
    }

    return document.activeElement === cell || cell.contains(document.activeElement);
  }

  private async saveTemplateFromMenuContext(options?: {
    file?: TFile;
    tableId?: string;
    tableSelection?: SelectionRect | null;
    plainTableContext?: UninitializedTableContext | null;
  }) {
    const selectedContent = this.getEditorTemplateSaveContent(this.app.workspace.getActiveViewOfType(MarkdownView), true);
    if (selectedContent?.trim()) {
      this.openTemplateNameModal(selectedContent);
      return true;
    }
    if (options?.plainTableContext) {
      return this.savePlainTableSelectionAsTemplate(options.plainTableContext);
    }
    new Notice("请先选中要保存为模板的内容");
    return false;
  }

  private isFullTableSelection(rawTable: ParsedRawTable, selection: SelectionRect) {
    return (
      selection.startRow === 0 &&
      selection.startCol === 0 &&
      selection.endRow === rawTable.body.length &&
      selection.endCol === rawTable.header.length - 1
    );
  }

  private serializeTemplateTableMetadata(tables: TemplateTableMetadata["tables"]) {
    return `%% mdtp-template:${JSON.stringify({ version: 1, tableOrder: Object.keys(tables), tables })} %%`;
  }

  splitTemplateContentForPreview(content: string): { hiddenPrefix: string; visible: string } {
    const lines = String(content ?? "").split(/\r?\n/);
    const hiddenLines: string[] = [];
    let cursor = 0;
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (TEMPLATE_TABLE_METADATA_RE.test(line) || this.extractTableMarkerId(line)) {
        hiddenLines.push(line);
        cursor += 1;
        continue;
      }
      break;
    }
    const visibleLines = lines.slice(cursor);
    while (visibleLines.length > 0 && visibleLines[0].trim() === "") {
      visibleLines.shift();
    }
    while (visibleLines.length > 0 && visibleLines[visibleLines.length - 1].trim() === "") {
      visibleLines.pop();
    }
    return {
      hiddenPrefix: hiddenLines.join("\n"),
      visible: visibleLines.join("\n"),
    };
  }

  combineTemplateContentForSave(hiddenPrefix: string, visible: string): string {
    const trimmedVisible = String(visible ?? "").replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
    const trimmedPrefix = String(hiddenPrefix ?? "").trim();
    if (!trimmedVisible) {
      return trimmedPrefix ? `${trimmedPrefix}\n` : "";
    }
    if (!trimmedPrefix) {
      return `${trimmedVisible}\n`;
    }
    return `${trimmedPrefix}\n\n${trimmedVisible}\n`;
  }

  private extractTemplateTableMetadata(content: string): { content: string; metadata: TemplateTableMetadata } {
    const metadata: TemplateTableMetadata = { version: 1, tables: {} };
    const lines = content.split(/\r?\n/);
    const kept: string[] = [];
    for (const line of lines) {
      const match = line.match(TEMPLATE_TABLE_METADATA_RE);
      if (!match) {
        kept.push(line);
        continue;
      }
      try {
        const parsed = JSON.parse(match[1]) as TemplateTableMetadata;
        if (parsed?.tables && typeof parsed.tables === "object") {
          metadata.tables = { ...metadata.tables, ...parsed.tables };
        }
        if (Array.isArray(parsed?.tableOrder)) {
          metadata.tableOrder = parsed.tableOrder.filter((id) => typeof id === "string");
        }
      } catch (error) {
        console.warn("[mdtp] invalid template table metadata ignored", error);
      }
    }
    return {
      content: kept.join("\n"),
      metadata,
    };
  }

  private prepareTemplateContentForInsertion(content: string, file: TFile) {
    const extracted = this.extractTemplateTableMetadata(content);
    const markerlessContent = this.stripTableMarkersFromContent(extracted.content);
    const transformedTables = this.parseMarkdownTables(markerlessContent);
    const now = Date.now();
    const tableRecords: TableRecord[] = [];
    const sourceTables = this.parseMarkdownTables(extracted.content);
    const orderedTemplateIds = [
      ...(extracted.metadata.tableOrder ?? []),
      ...sourceTables.map((table) => table.tableId).filter((tableId): tableId is string => !!tableId),
      ...Object.keys(extracted.metadata.tables),
    ];
    const seenTemplateIds = new Set<string>();
    const uniqueTemplateIds = orderedTemplateIds.filter((tableId) => {
      if (seenTemplateIds.has(tableId)) return false;
      seenTemplateIds.add(tableId);
      return true;
    });

    for (let index = 0; index < uniqueTemplateIds.length && index < transformedTables.length; index += 1) {
      const sourceTableId = uniqueTemplateIds[index];
      const targetTable = transformedTables[index];
      if (!sourceTableId || !targetTable) continue;
      const templateRecord = extracted.metadata.tables[sourceTableId];
      const sourceRecord = this.dataStore.tables[sourceTableId];
      const mode = templateRecord?.mode ?? this.getTableRecordMode(sourceRecord);
      if (mode !== "nativeLayout") continue;
      const layout = this.normalizeLayout(templateRecord?.layout ?? sourceRecord?.layout ?? this.createEmptyLayout());
      const tableId = this.generateTableId();
      tableRecords.push({
        tableId,
        mode: "nativeLayout",
        markerless: true,
        identity: this.createNativeTableIdentity(targetTable, index),
        filePath: file.path,
        createdAt: now,
        updatedAt: now,
        lastKnownHash: this.hashString(targetTable.raw),
        lastKnownRange: {
          startLine: targetTable.startLine,
          endLine: targetTable.endLine,
        },
        layout,
      });
    }

    return {
      content: markerlessContent,
      tableRecords,
    };
  }

  private stripTableMarkersFromContent(content: string) {
    const { lines, originalEndsWithNewline } = this.splitContentLines(content);
    const markerlessLines = lines.filter((line) => !this.extractTableMarkerId(line));
    return this.joinLines(markerlessLines, originalEndsWithNewline);
  }

  private extractLayoutForSelection(layout: TableLayoutMetadata, selection: SelectionRect): TableLayoutMetadata {
    const next = this.createEmptyLayout();
    for (let col = selection.startCol; col <= selection.endCol; col += 1) {
      const value = layout.colWidths[String(col)];
      if (value !== undefined) next.colWidths[String(col - selection.startCol)] = value;
      const color = layout.colColors[String(col)];
      if (color !== undefined) next.colColors[String(col - selection.startCol)] = color;
    }
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      const value = layout.rowHeights[String(row)];
      if (value !== undefined) next.rowHeights[String(row - selection.startRow)] = value;
      const color = layout.rowColors[String(row)];
      if (color !== undefined) next.rowColors[String(row - selection.startRow)] = color;
    }
    for (const [key, value] of Object.entries(layout.cellColors)) {
      const coord = this.parseCellKey(key);
      if (!coord || !this.selectionContains(selection, coord)) continue;
      next.cellColors[this.getCellKey({ row: coord.row - selection.startRow, col: coord.col - selection.startCol })] = value;
    }
    for (const [key, value] of Object.entries(layout.cellTextColors)) {
      const coord = this.parseCellKey(key);
      if (!coord || !this.selectionContains(selection, coord)) continue;
      next.cellTextColors[this.getCellKey({ row: coord.row - selection.startRow, col: coord.col - selection.startCol })] = value;
    }
    for (const [key, value] of Object.entries(layout.cellAlignments)) {
      const coord = this.parseCellKey(key);
      if (!coord || !this.selectionContains(selection, coord)) continue;
      next.cellAlignments[this.getCellKey({ row: coord.row - selection.startRow, col: coord.col - selection.startCol })] = value;
    }
    for (const [key, value] of Object.entries(layout.cellImageWidths)) {
      const coord = this.parseCellKey(key);
      if (!coord || !this.selectionContains(selection, coord)) continue;
      next.cellImageWidths[this.getCellKey({ row: coord.row - selection.startRow, col: coord.col - selection.startCol })] = value;
    }
    next.merges = layout.merges
      .filter((merge) => {
        const endRow = merge.row + merge.rowspan - 1;
        const endCol = merge.col + merge.colspan - 1;
        return (
          merge.row >= selection.startRow &&
          merge.col >= selection.startCol &&
          endRow <= selection.endRow &&
          endCol <= selection.endCol
        );
      })
      .map((merge) => ({
        row: merge.row - selection.startRow,
        col: merge.col - selection.startCol,
        rowspan: merge.rowspan,
        colspan: merge.colspan,
      }));
    return next;
  }

  private createTemplateRecord(templatePath: string): TemplateRecord {
    const normalizedPath = normalizePath(templatePath);
    const relativePath = normalizedPath.startsWith(`${TEMPLATE_LIBRARY_FOLDER}/`)
      ? normalizedPath.slice(TEMPLATE_LIBRARY_FOLDER.length + 1)
      : normalizedPath;
    const segments = relativePath.split("/").filter(Boolean);
    const folderSegments = segments.slice(0, -1);
    return {
      name: this.getTemplateNameFromPath(normalizedPath),
      path: normalizedPath,
      folderPath: folderSegments.join("/"),
      relativePath,
      folderSegments,
    };
  }

  private async listTemplateMarkdownPaths(folderPath: string) {
    const adapter = this.app.vault.adapter;
    const paths = new Set<string>();
    if (!(await adapter.exists(folderPath))) return [];

    const collect = async (currentFolder: string) => {
      const listing = await adapter.list(currentFolder);
      for (const filePath of listing.files ?? []) {
        if (!filePath.toLowerCase().endsWith(".md")) continue;
        paths.add(normalizePath(filePath));
      }
      for (const childFolder of listing.folders ?? []) {
        await collect(normalizePath(childFolder));
      }
    };

    await collect(folderPath);
    return Array.from(paths);
  }

  private sanitizeTemplateRelativePath(rawName: string) {
    const rawSegments = rawName
      .trim()
      .replace(/\\/g, "/")
      .split("/")
      .map((segment) => this.sanitizeTemplatePathSegment(segment))
      .filter(Boolean);
    if (rawSegments.length === 0) return "未命名模板";
    return rawSegments.join("/");
  }

  private sanitizeTemplatePathSegment(rawName: string) {
    const sanitized = rawName
      .trim()
      .replace(/[:*?"<>|\n\r\t]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\.+/, "")
      .slice(0, 60)
      .trim();
    return sanitized;
  }

  private async getAvailableTemplatePath(safeRelativePath: string) {
    const adapter = this.app.vault.adapter;
    let index = 1;
    const normalizedRelativePath = normalizePath(safeRelativePath);
    const basePath = normalizePath(`${TEMPLATE_LIBRARY_FOLDER}/${normalizedRelativePath}`);
    let candidate = `${basePath}.md`;
    while (await adapter.exists(candidate)) {
      index += 1;
      candidate = `${basePath} ${index}.md`;
    }
    return candidate;
  }

  private getParentPath(filePath: string) {
    const normalizedPath = normalizePath(filePath);
    const slashIndex = normalizedPath.lastIndexOf("/");
    return slashIndex > 0 ? normalizedPath.slice(0, slashIndex) : "";
  }

  private getTemplateNameFromPath(templatePath: string) {
    const fileName = templatePath.split("/").pop() ?? templatePath;
    return fileName.replace(/\.md$/i, "");
  }

  private openOneNoteRichPasteModal(file: TFile) {
    new OneNoteRichPasteModal(this, file).open();
  }

  private async pasteOneNoteFromSystemClipboardOrOpenModal(file: TFile) {
    const html = await this.resolveOneNoteClipboardHtml();
    if (html.trim()) {
      const ok = await this.importOneNoteRichContent(file, html, []);
      if (ok) return;
    }
    this.openOneNoteRichPasteModal(file);
  }

  private async restoreLatestSnapshot(file: TFile) {
    const snapshot = this.dataStore.snapshots.find((item) => item.filePath === file.path);
    if (!snapshot) {
      new Notice("当前文件没有可恢复的表格增强快照");
      return;
    }

    const adapter = this.app.vault.adapter;
    const exists = await adapter.exists(snapshot.backupPath);
    if (!exists) {
      new Notice("最近一次快照文件不存在，无法恢复");
      return;
    }

    await this.createSnapshot(file, "before-restore", snapshot.tableIds);
    const backupContent = await adapter.read(snapshot.backupPath);
    await this.app.vault.modify(file, backupContent);

    for (const [tableId, record] of Object.entries(snapshot.tableRecords)) {
      this.dataStore.tables[tableId] = this.cloneTableRecord(record);
    }

    const parsedTables = this.parseMarkdownTables(backupContent);
    await this.syncTableRecords(file, parsedTables);
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    new Notice("已恢复当前文件最近一次表格增强快照");
  }

  private async showCurrentFileStatus(file: TFile) {
    const content = await this.app.vault.cachedRead(file);
    const parsedTables = this.parseMarkdownTables(content);
    const anchoredCount = parsedTables.filter((table) => !!table.tableId).length;
    const enhancedCount = parsedTables.filter(
      (table) => !!table.tableId && this.getTableRecordMode(this.dataStore.tables[table.tableId]) === "enhanced"
    ).length;
    const nativeLayoutCount = parsedTables.filter(
      (table) => !!table.tableId && this.getTableRecordMode(this.dataStore.tables[table.tableId]) === "nativeLayout"
    ).length;
    const snapshotCount = this.dataStore.snapshots.filter((snapshot) => snapshot.filePath === file.path).length;
    new Notice(
      `当前文件共 ${parsedTables.length} 张表格，已标识 ${anchoredCount} 张，其中增强 ${enhancedCount} 张，长宽高调节 ${nativeLayoutCount} 张，可恢复快照 ${snapshotCount} 份`,
      6000
    );
  }

  private isExperimentalFeatureEnabled() {
    return false;
  }

  private isOneNotePasteFeatureEnabled() {
    const feishu = this.app.plugins.plugins["feishu-doc-toolbar"] as
      | { isOneNoteRichPasteEnabled?: () => boolean }
      | undefined;
    if (typeof feishu?.isOneNoteRichPasteEnabled === "function") {
      return feishu.isOneNoteRichPasteEnabled();
    }
    return false;
  }

  shouldShowEnhancedTableEntrances() {
    return false;
  }

  async setExperimentalFeatureGate(enabled: boolean) {
    this.dataStore.experimentalFeatureGate = false;
    await this.savePluginData();
    this.hideImageManipulator();
    this.updateOneNoteStatusBarVisibility();
    void enabled;
  }

  private updateOneNoteStatusBarVisibility() {
    const feishu = this.app.plugins.plugins["feishu-doc-toolbar"] as
      | { isOneNoteRichPasteEnabled?: () => boolean }
      | undefined;
    const visible =
      typeof feishu?.isOneNoteRichPasteEnabled === "function"
        ? feishu.isOneNoteRichPasteEnabled()
        : false;
    if (this.oneNoteStatusBarGroupEl) {
      this.oneNoteStatusBarGroupEl.style.display = visible ? "inline-flex" : "none";
    }
  }

  private async toggleExperimentalFeatureGate() {
    this.dataStore.experimentalFeatureGate = false;
    await this.savePluginData();
    this.hideImageManipulator();
    new Notice("增强表格测试版能力已移除");
  }

  private decorateOneNoteRichTables(element: HTMLElement, context: MarkdownPostProcessorContext) {
    const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
    if (!(file instanceof TFile) || file.extension !== "md") return;

    const roots = [
      ...(element.matches(".mdtp-onenote-rich-table") ? [element] : []),
      ...Array.from(element.querySelectorAll(".mdtp-onenote-rich-table")),
    ] as HTMLElement[];

    for (const root of roots) {
      for (const table of Array.from(root.querySelectorAll("table"))) {
        table.classList.add("mdtp-onenote-table");
      }

      for (const image of Array.from(root.querySelectorAll("img[data-mdtp-src]")) as HTMLImageElement[]) {
        const rawPath = image.dataset.mdtpSrc?.trim() ?? "";
        if (!rawPath) continue;
        const resolved =
          this.app.metadataCache.getFirstLinkpathDest(rawPath, file.path) ??
          this.app.vault.getAbstractFileByPath(normalizePath(rawPath));
        if (resolved instanceof TFile) {
          image.src = this.app.vault.getResourcePath(resolved);
        }
      }
    }
  }

  private async decorateRenderedTables(element: HTMLElement, context: MarkdownPostProcessorContext) {
    const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
    if (!(file instanceof TFile) || file.extension !== "md") return;

    const renderedTables = this.getRenderedTables(element);
    if (renderedTables.length === 0) return;

    const content = await this.app.vault.cachedRead(file);
    const parsedTables = this.getRelevantParsedTables(this.parseMarkdownTables(content), context, element);
    if (parsedTables.length === 0) return;

    for (let index = 0; index < renderedTables.length && index < parsedTables.length; index += 1) {
      const tableEl = renderedTables[index];
      const parsedTable = parsedTables[index] ?? null;
      await this.enhanceRenderedTable(tableEl, file, parsedTable, parsedTables);
    }
  }

  private scheduleVisibleTableRefresh() {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshVisibleTablesInWorkspace();
    }, 80);
  }

  private queueRefreshBurst() {
    const token = ++this.refreshBurstToken;
    const offsets = [0, 120, 360, 900, 1800];
    for (const offset of offsets) {
      window.setTimeout(() => {
        if (token !== this.refreshBurstToken) return;
        this.scheduleVisibleTableRefresh();
      }, offset);
    }
  }

  private async refreshVisibleTablesInWorkspace() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view as any;
      const file = view?.file;
      if (!(file instanceof TFile) || file.extension !== "md") continue;

      const contentEl = view?.contentEl;
      if (!(contentEl instanceof HTMLElement)) continue;

      this.hideVisibleMarkerLines(contentEl);
      this.decorateOneNoteRichTables(contentEl, { sourcePath: file.path } as MarkdownPostProcessorContext);

      const tables = this.getRenderedTables(contentEl);
      if (tables.length === 0) continue;

      const content = await this.app.vault.cachedRead(file);
      const parsedTables = this.parseMarkdownTables(content);
      if (parsedTables.length === 0) continue;

      for (let index = 0; index < tables.length && index < parsedTables.length; index += 1) {
        await this.enhanceRenderedTable(tables[index], file, parsedTables[index] ?? null, parsedTables);
      }
    }
  }

  private hideVisibleMarkerLines(root: HTMLElement) {
    const previouslyHidden = Array.from(root.querySelectorAll("[data-mdtp-marker-hidden='true']")) as HTMLElement[];
    for (const element of previouslyHidden) {
      element.style.display = "";
      element.removeAttribute("data-mdtp-marker-hidden");
      element.classList.remove("mdtp-marker-line");
    }

    const candidates = Array.from(root.querySelectorAll("*")) as HTMLElement[];
    for (const element of candidates) {
      const normalizedText = (element.textContent ?? "").replace(/\u200b/g, "").trim();
      const isMarker = this.isHiddenMarkerText(normalizedText);
      if (!isMarker) continue;
      const container = this.resolveMarkerContainer(element, root);
      if (!container || container.dataset.mdtpMarkerHidden === "true") continue;
      container.classList.add("mdtp-marker-line");
      container.style.display = "none";
      container.dataset.mdtpMarkerHidden = "true";
    }
  }

  private resolveMarkerContainer(element: HTMLElement, root: HTMLElement) {
    const selectors = [
      ".cm-line",
      ".HyperMD-codeblock",
      ".HyperMD-comment",
      "p",
      "li",
      "div",
    ];
    const container = element.closest(selectors.join(", ")) as HTMLElement | null;
    if (container && root.contains(container)) {
      const normalizedText = (container.textContent ?? "").replace(/\u200b/g, "").trim();
      if (this.isHiddenMarkerText(normalizedText)) {
        return container;
      }
    }
    return root.contains(element) ? element : null;
  }

  private createHiddenMarkerEditorExtension() {
    const isMarkerText = (text: string) => this.isHiddenMarkerText(text.trim());
    const buildDecorations = (view: EditorView) => {
      const builder = new RangeSetBuilder<Decoration>();
      const seen = new Set<number>();

      for (const range of view.visibleRanges) {
        let line = view.state.doc.lineAt(range.from);

        while (true) {
          if (!seen.has(line.from) && isMarkerText(line.text)) {
            builder.add(line.from, line.from, HIDDEN_MARKER_LINE_DECORATION);
          }

          seen.add(line.from);
          if (line.to >= range.to || line.number >= view.state.doc.lines) {
            break;
          }

          line = view.state.doc.line(line.number + 1);
        }
      }

      return builder.finish();
    };

    return ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = buildDecorations(view);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = buildDecorations(update.view);
          }
        }
      },
      {
        decorations: (value) => value.decorations,
      }
    );
  }

  private getRenderedTables(element: HTMLElement) {
    const tables = Array.from(element.querySelectorAll("table")).filter(
      (table) => !table.closest(".mdtp-onenote-rich-table")
    );
    if (element.matches("table") && !element.closest(".mdtp-onenote-rich-table")) {
      return [element as HTMLTableElement, ...tables];
    }
    return tables as HTMLTableElement[];
  }

  private getRelevantParsedTables(
    parsedTables: ParsedTableBlock[],
    context: MarkdownPostProcessorContext,
    element: HTMLElement
  ) {
    const contextAny = context as any;
    const sectionInfo = contextAny.getSectionInfo?.(element) ?? contextAny.getSectionInfo?.(element.parentElement);
    if (!sectionInfo) return parsedTables;

    return parsedTables.filter((table) => table.endLine >= sectionInfo.lineStart && table.startLine <= sectionInfo.lineEnd);
  }

  private async enhanceRenderedTable(
    tableEl: HTMLTableElement,
    file: TFile,
    parsedTable: ParsedTableBlock | null,
    parsedTables: ParsedTableBlock[] = parsedTable ? [parsedTable] : []
  ) {
    const tableId = this.resolveTableRecordIdForParsedTable(file, parsedTable, parsedTables);
    if (!tableId || !parsedTable) {
      this.runtimeState.delete(tableEl);
      this.restoreNativeTable(tableEl);
      this.registerPlainTableSidebarEntry(tableEl, file, parsedTable);
      return;
    }

    tableEl.dataset.mdtpBound = "true";
    const runtime = this.runtimeState.get(tableEl) ?? {
      file,
      parsedTable,
      selection: null,
      anchor: null,
    };
    runtime.file = file;
    runtime.parsedTable = parsedTable;
    this.runtimeState.set(tableEl, runtime);

    tableEl.classList.add("mdtp-table-shell");
    this.indexTableCells(tableEl);
    this.clearInjectedTableArtifacts(tableEl);
    tableEl.dataset.mdtpTableId = tableId;
    const record = this.dataStore.tables[tableId] ?? null;
    if (!record) {
      this.runtimeState.delete(tableEl);
      this.restoreNativeTable(tableEl);
      return;
    }

    if (record.mode === "nativeLayout") {
      runtime.selection = null;
      runtime.anchor = null;
      tableEl.classList.remove("mdtp-table-uninitialized", "mdtp-table-enhanced");
      tableEl.classList.add("mdtp-table-native-layout");
      this.applyNativeLayout(tableEl, record.layout);
      this.renderNativeTableComputedCells(tableEl, parsedTable);
      this.injectResizeHandles(tableEl, record.layout);
      this.injectAutoFillHandles(tableEl);
      return;
    }

    runtime.selection = null;
    runtime.anchor = null;
    this.runtimeState.delete(tableEl);
    this.restoreNativeTable(tableEl);
  }

  private registerPlainTableSidebarEntry(tableEl: HTMLTableElement, file: TFile, parsedTable: ParsedTableBlock | null) {
    if (!parsedTable) return;
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.path !== file.path) return;
    const rect = tableEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    if (rect.bottom < 72 || rect.top > window.innerHeight) return;
    const context: NativeTableSidebarContext = {
      mode: "native",
      file,
      parsedTable,
      coord: { row: 0, col: 0 },
      tableEl,
    };
    this.activeNativeTableContext = context;
    this.showTableSidebar(context);
  }

  private async ensureRecordForParsedTable(file: TFile, parsedTable: ParsedTableBlock) {
    const tableId = parsedTable.tableId;
    if (!tableId) {
      throw new Error("Cannot ensure record without tableId");
    }

    const existing = this.dataStore.tables[tableId];
    if (existing) {
      return existing;
    }

    const now = Date.now();
    const record: TableRecord = {
      tableId,
      mode: "nativeLayout",
      filePath: file.path,
      createdAt: now,
      updatedAt: now,
      lastKnownHash: this.hashString(parsedTable.raw),
      lastKnownRange: {
        startLine: parsedTable.startLine,
        endLine: parsedTable.endLine,
      },
      layout: this.createEmptyLayout(),
    };

    this.dataStore.tables[tableId] = record;
    await this.savePluginData();
    return record;
  }

  private indexTableCells(tableEl: HTMLTableElement) {
    const rows = Array.from(tableEl.rows);
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      row.dataset.mdtpRow = String(rowIndex);
      const cells = Array.from(row.cells) as HTMLTableCellElement[];
      for (let colIndex = 0; colIndex < cells.length; colIndex += 1) {
        const cell = cells[colIndex];
        cell.dataset.mdtpRow = String(rowIndex);
        cell.dataset.mdtpCol = String(colIndex);
        cell.classList.add("mdtp-cell");
      }
    }
  }

  private clearInjectedTableArtifacts(tableEl: HTMLTableElement) {
    for (const element of Array.from(tableEl.querySelectorAll(".mdtp-resize-handle"))) {
      element.remove();
    }
    for (const element of Array.from(tableEl.querySelectorAll(".mdtp-autofill-handle"))) {
      element.remove();
    }

    const rows = Array.from(tableEl.rows);
    for (const row of rows) {
      row.style.removeProperty("--mdtp-row-height");
      row.style.height = "";
      row.classList.remove("mdtp-row-resized");
      const cells = Array.from(row.cells) as HTMLTableCellElement[];
      for (const cell of cells) {
        cell.style.removeProperty("--mdtp-col-width");
        cell.style.removeProperty("--mdtp-cell-bg");
        cell.style.removeProperty("--mdtp-cell-text-color");
        cell.style.removeProperty("--mdtp-col-bg");
        cell.style.removeProperty("--mdtp-row-bg");
        cell.style.width = "";
        cell.style.minWidth = "";
        cell.style.backgroundColor = "";
        cell.style.boxShadow = "";
        cell.style.color = "";
        cell.style.textAlign = "";
        cell.style.verticalAlign = "";
        cell.style.display = "";
        cell.rowSpan = 1;
        cell.colSpan = 1;
        const hadFormulaTitle = cell.classList.contains("mdtp-formula-cell") || !!cell.dataset.mdtpFormulaSource;
        this.restoreFormulaCellContent(cell);
        cell.classList.remove(
          "mdtp-col-resized",
          "mdtp-cell-selected",
          "mdtp-cell-anchor",
          "mdtp-cell-dark-header",
          "mdtp-cell-text-colored",
          "mdtp-merge-start",
          "mdtp-merge-covered",
          "mdtp-formula-cell",
          "mdtp-formula-error",
          "mdtp-latex-cell",
          "mdtp-autofill-source",
          "mdtp-autofill-preview"
        );
        delete cell.dataset.mdtpFormulaSource;
        if (hadFormulaTitle) cell.removeAttribute("title");
        for (const wrapper of Array.from(cell.querySelectorAll(".image-embed, .internal-embed, .media-embed")) as HTMLElement[]) {
          wrapper.style.display = "";
          wrapper.style.maxWidth = "";
          wrapper.style.verticalAlign = "";
        }
        for (const image of Array.from(cell.querySelectorAll("img")) as HTMLImageElement[]) {
          image.style.display = "";
          image.style.width = "";
          image.style.maxWidth = "";
          image.style.height = "";
        }
      }
    }
  }

  private restoreNativeTable(tableEl: HTMLTableElement) {
    this.clearInjectedTableArtifacts(tableEl);
    tableEl.classList.remove(
      "mdtp-table-shell",
      "mdtp-table-enhanced",
      "mdtp-table-native-layout",
      "mdtp-table-uninitialized",
      "mdtp-table-colored",
      "mdtp-table-bordered"
    );
    tableEl.style.tableLayout = "";
    tableEl.style.removeProperty("--mdtp-native-color-border");
    tableEl.style.removeProperty("--mdtp-table-scale");
    delete tableEl.dataset.mdtpBound;
    delete tableEl.dataset.mdtpTableId;

    const rows = Array.from(tableEl.rows);
    for (const row of rows) {
      delete row.dataset.mdtpRow;
      const cells = Array.from(row.cells) as HTMLTableCellElement[];
      for (const cell of cells) {
        delete cell.dataset.mdtpRow;
        delete cell.dataset.mdtpCol;
        cell.classList.remove("mdtp-cell");
        cell.removeAttribute("tabindex");
      }
    }
  }

  private applyLayout(tableEl: HTMLTableElement, layout: TableLayoutMetadata) {
    tableEl.style.tableLayout = "fixed";
    const structure = this.collectTableStructure(tableEl);

    this.applySizeLayout(tableEl, layout);
    this.applyColors(structure, layout);
    this.applyMerges(structure, layout.merges);
  }

  private applyNativeLayout(tableEl: HTMLTableElement, layout: TableLayoutMetadata) {
    this.normalizeNativeColorPresetLayout(layout);
    const nativePalette = this.getLayoutNativeColorPalette(layout);
    const borderPalette = this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
    if (layout.nativeBorderEnabled) {
      tableEl.style.setProperty("--mdtp-native-color-border", (nativePalette ?? borderPalette).border);
    } else {
      tableEl.style.removeProperty("--mdtp-native-color-border");
    }
    tableEl.style.tableLayout = Object.keys(layout.colWidths).length > 0 ? "fixed" : "auto";
    tableEl.style.setProperty("--mdtp-table-scale", String(this.getLayoutTableScale(layout)));
    tableEl.classList.toggle("mdtp-table-colored", this.hasLayoutColors(layout));
    tableEl.classList.toggle("mdtp-table-bordered", layout.nativeBorderEnabled === true);
    this.applySizeLayout(tableEl, layout);
    this.applyColors(this.collectTableStructure(tableEl), layout);
  }

  private renderNativeTableComputedCells(tableEl: HTMLTableElement, parsedTable: ParsedTableBlock) {
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return;

    const matrix = this.buildRawTableMatrix(rawTable);
    const structure = this.collectTableStructure(tableEl);
    for (let row = 0; row < structure.matrix.length; row += 1) {
      for (let col = 0; col < structure.matrix[row].length; col += 1) {
        const cell = structure.matrix[row][col];
        const rawValue = matrix[row]?.[col] ?? "";
        if (!cell || !rawValue) continue;

        if (containsNativeLatex(rawValue)) {
          cell.classList.add("mdtp-latex-cell");
        }

        if (!rawValue.trim().startsWith("=")) continue;
        const result = evaluateNativeTableFormula(rawValue, matrix, { row, col });
        if (!result) {
          cell.classList.add("mdtp-formula-error");
          cell.title = "公式暂未识别，已保留原文";
          continue;
        }

        const source = document.createElement("span");
        source.className = "mdtp-formula-source";
        while (cell.firstChild) {
          source.appendChild(cell.firstChild);
        }

        const display = document.createElement("span");
        display.className = "mdtp-formula-result";
        display.textContent = result.value;

        cell.replaceChildren(source, display);
        cell.classList.add("mdtp-formula-cell");
        cell.dataset.mdtpFormulaSource = rawValue;
        cell.title = rawValue;
      }
    }
  }

  private restoreFormulaCellContent(cell: HTMLTableCellElement) {
    const source = cell.querySelector(":scope > .mdtp-formula-source");
    if (!source) return;
    const restored = Array.from(source.childNodes);
    cell.replaceChildren(...restored);
  }

  private hasLayoutColors(layout: TableLayoutMetadata) {
    return (
      layout.nativeColorPreset === NATIVE_COLOR_PRESET_BLUE_ZEBRA ||
      Object.keys(layout.cellColors).length > 0 ||
      Object.keys(layout.rowColors).length > 0 ||
      Object.keys(layout.colColors).length > 0
    );
  }

  private applySizeLayout(tableEl: HTMLTableElement, layout: TableLayoutMetadata) {
    const structure = this.collectTableStructure(tableEl);
    const scale = this.getLayoutTableScale(layout);

    for (const [colKey, width] of Object.entries(layout.colWidths)) {
      const colIndex = Number.parseInt(colKey, 10);
      if (!Number.isFinite(colIndex)) continue;
      this.applyColumnWidth(structure, colIndex, width, scale);
    }

    for (const [rowKey, height] of Object.entries(layout.rowHeights)) {
      const rowIndex = Number.parseInt(rowKey, 10);
      if (!Number.isFinite(rowIndex)) continue;
      this.applyRowHeight(structure, rowIndex, height, scale);
    }
  }

  private previewNativeLayoutTableScale(
    tableEl: HTMLTableElement,
    layout: TableLayoutMetadata,
    scale: number,
    sizeBase?: NativeTableSizeBase
  ) {
    const previewLayout = sizeBase
      ? { ...layout, colWidths: { ...sizeBase.colWidths }, rowHeights: { ...sizeBase.rowHeights }, tableScale: scale }
      : { ...layout, tableScale: scale };
    if (Object.keys(previewLayout.colWidths).length > 0) {
      tableEl.style.tableLayout = "fixed";
    }
    tableEl.style.setProperty("--mdtp-table-scale", String(scale));
    this.applySizeLayout(tableEl, previewLayout);
  }

  private captureNativeLayoutSizeBase(tableEl: HTMLTableElement, layout: TableLayoutMetadata): NativeTableSizeBase {
    const structure = this.collectTableStructure(tableEl);
    const scale = this.getLayoutTableScale(layout);
    const unscale = (value: number, minimum: number) => Math.max(minimum, Math.round(value / scale));
    const maxColumns = Math.max(...structure.matrix.map((row) => row.length), 0);
    const colWidths: Record<string, number> = {};
    const rowHeights: Record<string, number> = {};

    for (let colIndex = 0; colIndex < maxColumns; colIndex += 1) {
      const key = String(colIndex);
      const stored = Number(layout.colWidths[key]);
      colWidths[key] = Number.isFinite(stored) && stored > 0
        ? Math.round(stored)
        : unscale(this.getColumnWidth(structure, colIndex), MIN_COLUMN_WIDTH);
    }

    for (let rowIndex = 0; rowIndex < structure.rows.length; rowIndex += 1) {
      const key = String(rowIndex);
      const stored = Number(layout.rowHeights[key]);
      rowHeights[key] = Number.isFinite(stored) && stored > 0
        ? Math.round(stored)
        : unscale(this.getRowHeight(structure, rowIndex), MIN_ROW_HEIGHT);
    }

    return { colWidths, rowHeights };
  }

  private materializeNativeLayoutSizeBase(layout: TableLayoutMetadata, sizeBase: NativeTableSizeBase) {
    layout.colWidths = { ...sizeBase.colWidths };
    layout.rowHeights = { ...sizeBase.rowHeights };
  }

  private collectTableStructure(tableEl: HTMLTableElement): TableStructure {
    const rows = Array.from(tableEl.rows);
    const matrix: HTMLTableCellElement[][] = [];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      matrix[rowIndex] = Array.from(rows[rowIndex].cells) as HTMLTableCellElement[];
    }
    return { rows, matrix };
  }

  private applyColumnWidth(structure: TableStructure, colIndex: number, width: number, scale = 1) {
    const storedWidth = Number(width);
    if (!Number.isFinite(storedWidth) || storedWidth <= 0) return;
    const nextWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(storedWidth * scale));
    for (const row of structure.matrix) {
      const cell = row[colIndex];
      if (!cell) continue;
      cell.style.setProperty("--mdtp-col-width", `${nextWidth}px`);
      cell.style.width = `${nextWidth}px`;
      cell.style.minWidth = `${nextWidth}px`;
      cell.classList.add("mdtp-col-resized");
    }
  }

  private applyRowHeight(structure: TableStructure, rowIndex: number, height: number, scale = 1) {
    const storedHeight = Number(height);
    if (!Number.isFinite(storedHeight) || storedHeight <= 0) return;
    const nextHeight = Math.max(MIN_ROW_HEIGHT, Math.round(storedHeight * scale));
    const row = structure.rows[rowIndex];
    if (!row) return;
    row.style.setProperty("--mdtp-row-height", `${nextHeight}px`);
    row.style.height = `${nextHeight}px`;
    row.classList.add("mdtp-row-resized");
  }

  private applyColors(structure: TableStructure, layout: TableLayoutMetadata) {
    for (let rowIndex = 0; rowIndex < structure.matrix.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < structure.matrix[rowIndex].length; colIndex += 1) {
        const cell = structure.matrix[rowIndex][colIndex];
        if (!cell) continue;

        const cellKey = this.getCellKey({ row: rowIndex, col: colIndex });
        const color = this.resolveCellBackgroundColor(layout, rowIndex, colIndex, cellKey);

        if (color) {
          cell.style.setProperty("--mdtp-cell-bg", color);
          cell.style.backgroundColor = color;
        }

        const headerTextColor = rowIndex === 0 ? this.getNativeHeaderTextColor(layout, color) : "";
        const cellTextColor = this.resolveCellTextColor(layout, rowIndex, cellKey);
        const effectiveTextColor = cellTextColor || headerTextColor;
        if (effectiveTextColor) {
          cell.style.setProperty("--mdtp-cell-text-color", effectiveTextColor);
          cell.style.color = effectiveTextColor;
          cell.classList.add(cellTextColor ? "mdtp-cell-text-colored" : "mdtp-cell-dark-header");
        } else {
          cell.style.removeProperty("--mdtp-cell-text-color");
        }

        const alignment = this.resolveNativeCellAlignment(layout, rowIndex, colIndex, cellKey);
        cell.style.textAlign = alignment;
        this.applyImagePresentationToCell(cell, layout.cellImageWidths[cellKey]);
      }
    }
  }

  private resolveNativeCellAlignment(layout: TableLayoutMetadata, rowIndex: number, colIndex: number, cellKey: string) {
    const manualAlignment = layout.cellAlignments[cellKey];
    if (manualAlignment) return manualAlignment;

    if (rowIndex === 0) {
      const headerAlignment = this.getNativeTableDefaultHeaderAlignment();
      return headerAlignment === "off" ? "" : headerAlignment;
    }

    if (colIndex === 0) {
      const firstColumnAlignment = this.getNativeTableDefaultFirstColumnAlignment();
      return firstColumnAlignment === "off" ? "" : firstColumnAlignment;
    }

    return "";
  }

  private isNativeColorTableHeaderColor(color: string) {
    const normalized = color.trim().toUpperCase();
    return (
      normalized === NATIVE_COLOR_TABLE_HEADER.toUpperCase() ||
      normalized === NATIVE_COLOR_TABLE_LEGACY_HEADER.toUpperCase() ||
      normalized === NATIVE_COLOR_PRESET_PALETTES.blue.header.toUpperCase()
    );
  }

  private isLegacyNativeColorTableHeaderColor(color: string) {
    return color.trim().toUpperCase() === NATIVE_COLOR_TABLE_LEGACY_HEADER.toUpperCase();
  }

  private resolveCellBackgroundColor(
    layout: TableLayoutMetadata,
    rowIndex: number,
    colIndex: number,
    cellKey: string
  ) {
    return (
      layout.cellColors[cellKey] ??
      layout.rowColors[String(rowIndex)] ??
      layout.colColors[String(colIndex)] ??
      this.getNativeColorPresetRowColor(layout, rowIndex) ??
      ""
    );
  }

  private getNativeColorPresetRowColor(layout: TableLayoutMetadata, rowIndex: number) {
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return null;
    const palette = this.getLayoutNativeColorPalette(layout) ?? this.getCurrentNativeColorPalette();
    if (rowIndex === 0) return palette.header;
    return rowIndex % 2 === 0 ? palette.altRow : palette.baseRow;
  }

  private getLayoutTableScale(layout: TableLayoutMetadata) {
    return this.normalizeNativeTableScale(layout.tableScale, NATIVE_TABLE_DEFAULT_SCALE);
  }

  private resolveCellTextColor(layout: TableLayoutMetadata, rowIndex: number, cellKey: string) {
    if (rowIndex === 0) return "";
    return this.normalizeOptionalHexColor(layout.cellTextColors[cellKey]);
  }

  private getNativeHeaderTextColor(layout: TableLayoutMetadata, color: string) {
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return "";
    const palette = this.getLayoutNativeColorPalette(layout) ?? this.getCurrentNativeColorPalette();
    return this.colorsMatch(color, palette.header) || this.isNativeColorTableHeaderColor(color)
      ? palette.headerText
      : "";
  }

  private applyImagePresentationToCell(cell: HTMLTableCellElement, width?: number) {
    for (const wrapper of Array.from(
      cell.querySelectorAll(".image-embed, .internal-embed, .media-embed, .mdtp-rendered-image-embed")
    ) as HTMLElement[]) {
      wrapper.style.display = "inline-block";
      wrapper.style.maxWidth = "100%";
      wrapper.style.verticalAlign = "top";
    }

    for (const image of Array.from(cell.querySelectorAll("img")) as HTMLImageElement[]) {
      image.style.display = "inline-block";
      image.style.maxWidth = "100%";
      image.style.height = "auto";
      if (width) {
        image.style.width = `${Math.max(80, Math.round(width))}px`;
      }
    }
  }

  private renderImageMarkupInEnhancedCells(
    tableEl: HTMLTableElement,
    file: TFile,
    parsedTable: ParsedTableBlock,
    layout: TableLayoutMetadata
  ) {
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return;

    const structure = this.collectTableStructure(tableEl);
    for (let row = 0; row < structure.matrix.length; row += 1) {
      for (let col = 0; col < structure.matrix[row].length; col += 1) {
        const coord = { row, col };
        const value = this.getCellValue(rawTable, coord);
        if (!value || !this.containsImageMarkup(value)) continue;

        const cell = structure.matrix[row]?.[col];
        if (!cell) continue;
        this.renderCellImageMarkup(cell, file, value);
        this.applyImagePresentationToCell(cell, layout.cellImageWidths[this.getCellKey(coord)]);
      }
    }
  }

  private renderCellImageMarkup(cell: HTMLTableCellElement, file: TFile, value: string) {
    const segments = this.splitImageMarkupForCellRender(value, file);
    if (!segments.some((segment) => segment.kind === "image")) return;

    const root = document.createElement("div");
    root.className = "mdtp-rendered-cell-content";

    for (const segment of segments) {
      if (segment.kind === "text") {
        this.appendRenderedCellText(root, segment.value);
        continue;
      }

      const wrapper = document.createElement("span");
      wrapper.className = "mdtp-rendered-image-embed image-embed internal-embed";
      wrapper.dataset.mdtpImageSource = segment.displayPath;
      wrapper.title = segment.displayPath;

      const image = document.createElement("img");
      image.className = "mdtp-rendered-cell-image";
      image.src = segment.resourcePath;
      image.alt = segment.alt || segment.displayPath;
      image.loading = "lazy";
      image.decoding = "async";
      if (segment.width) {
        image.style.width = `${Math.max(80, Math.round(segment.width))}px`;
      }
      wrapper.appendChild(image);
      root.appendChild(wrapper);
    }

    cell.replaceChildren(root);
  }

  private appendRenderedCellText(root: HTMLElement, text: string) {
    const normalized = this.normalizeClipboardCellForPlainText(text).replace(/\n{3,}/g, "\n\n");
    if (!normalized.trim()) return;

    const span = document.createElement("span");
    span.className = "mdtp-rendered-cell-text";
    const lines = normalized.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      if (index > 0) {
        span.appendChild(document.createElement("br"));
      }
      this.appendRenderedCellInlineContent(span, lines[index]);
    }
    root.appendChild(span);
  }

  private appendRenderedCellInlineContent(root: HTMLElement, text: string) {
    const linkPattern = /(?<!!)\[([^\]\n]+)]\(([^)\n]+)\)/g;
    let lastIndex = 0;

    for (const match of text.matchAll(linkPattern)) {
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        root.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
      }

      const label = match[1] ?? "";
      const href = this.sanitizeOneNoteUrl(match[2] ?? "", false);
      if (href) {
        const anchor = document.createElement("a");
        anchor.className = "mdtp-rendered-cell-link";
        anchor.href = href;
        anchor.textContent = label;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        root.appendChild(anchor);
      } else {
        root.appendChild(document.createTextNode(match[0] ?? ""));
      }

      lastIndex = matchIndex + (match[0]?.length ?? 0);
    }

    if (lastIndex < text.length) {
      root.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  private applyMerges(structure: TableStructure, merges: TableMergeMetadata[]) {
    for (const merge of merges) {
      if (!this.isMergeShapeValid(structure, merge)) continue;
      if (!this.isMergeWithinSameSection(structure, merge)) continue;

      const startCell = structure.matrix[merge.row]?.[merge.col];
      if (!startCell) continue;

      startCell.rowSpan = merge.rowspan;
      startCell.colSpan = merge.colspan;
      startCell.style.verticalAlign = "top";
      startCell.classList.add("mdtp-merge-start");

      for (let row = merge.row; row < merge.row + merge.rowspan; row += 1) {
        for (let col = merge.col; col < merge.col + merge.colspan; col += 1) {
          if (row === merge.row && col === merge.col) continue;
          const coveredCell = structure.matrix[row]?.[col];
          if (!coveredCell) continue;
          coveredCell.style.display = "none";
          coveredCell.classList.add("mdtp-merge-covered");
        }
      }
    }
  }

  private isMergeShapeValid(structure: TableStructure, merge: TableMergeMetadata) {
    if (merge.rowspan < 1 || merge.colspan < 1) return false;
    const endRow = merge.row + merge.rowspan - 1;
    const endCol = merge.col + merge.colspan - 1;
    return !!structure.matrix[merge.row]?.[merge.col] && !!structure.matrix[endRow]?.[endCol];
  }

  private isMergeWithinSameSection(structure: TableStructure, merge: TableMergeMetadata) {
    const startRow = structure.rows[merge.row];
    const endRow = structure.rows[merge.row + merge.rowspan - 1];
    if (!startRow || !endRow) return false;
    return startRow.parentElement?.tagName === endRow.parentElement?.tagName;
  }

  private injectResizeHandles(tableEl: HTMLTableElement, layout: TableLayoutMetadata) {
    const structure = this.collectTableStructure(tableEl);
    const scale = this.getLayoutTableScale(layout);
    for (let rowIndex = 0; rowIndex < structure.matrix.length; rowIndex += 1) {
      const row = structure.matrix[rowIndex] ?? [];
      for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
        const cell = row[colIndex];
        if (!cell) continue;
        const handle = document.createElement("div");
        handle.className = "mdtp-resize-handle mdtp-col-handle";
        handle.dataset.mdtpResizeKind = "column";
        handle.dataset.mdtpIndex = String(colIndex);
        handle.style.position = "absolute";
        handle.style.top = "0";
        handle.style.right = "-4px";
        handle.style.width = "8px";
        handle.style.height = "100%";
        handle.style.cursor = "col-resize";
        handle.style.zIndex = "5";
        handle.style.opacity = "0.12";
        this.prepareInjectedTableControl(handle);
        cell.appendChild(handle);
      }
    }

    for (let rowIndex = 0; rowIndex < structure.rows.length; rowIndex += 1) {
      const cell = structure.matrix[rowIndex]?.[0];
      if (!cell) continue;
      const handle = document.createElement("div");
      handle.className = "mdtp-resize-handle mdtp-row-handle";
      handle.dataset.mdtpResizeKind = "row";
      handle.dataset.mdtpIndex = String(rowIndex);
      handle.style.position = "absolute";
      handle.style.left = "0";
      handle.style.bottom = "-4px";
      handle.style.width = "100%";
      handle.style.height = "8px";
      handle.style.cursor = "row-resize";
      handle.style.zIndex = "5";
      handle.style.opacity = "0.12";
      this.prepareInjectedTableControl(handle);
      cell.appendChild(handle);
      if (layout.rowHeights[String(rowIndex)]) {
        const scaledHeight = Math.max(MIN_ROW_HEIGHT, Math.round(layout.rowHeights[String(rowIndex)] * scale));
        structure.rows[rowIndex].style.setProperty("--mdtp-row-height", `${scaledHeight}px`);
        structure.rows[rowIndex].style.height = `${scaledHeight}px`;
      }
    }

    const lastRow = structure.matrix[structure.matrix.length - 1];
    const lastCell = lastRow?.[lastRow.length - 1];
    if (lastCell) {
      const handle = document.createElement("div");
      handle.className = "mdtp-resize-handle mdtp-scale-handle";
      handle.dataset.mdtpResizeKind = "scale";
      handle.title = "拖拽调节整体比例";
      this.prepareInjectedTableControl(handle);
      lastCell.appendChild(handle);
    }
  }

  private injectAutoFillHandles(tableEl: HTMLTableElement) {
    const structure = this.collectTableStructure(tableEl);
    for (let rowIndex = 0; rowIndex < structure.matrix.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < structure.matrix[rowIndex].length; colIndex += 1) {
        const cell = structure.matrix[rowIndex][colIndex];
        if (!cell) continue;
        const handle = document.createElement("div");
        handle.className = "mdtp-autofill-handle";
        handle.dataset.mdtpRow = String(rowIndex);
        handle.dataset.mdtpCol = String(colIndex);
        handle.title = "拖拽自动填充";
        this.prepareInjectedTableControl(handle);
        cell.appendChild(handle);
      }
    }
  }

  private prepareInjectedTableControl(element: HTMLElement) {
    element.contentEditable = "false";
    element.draggable = false;
    element.tabIndex = -1;
    element.setAttribute("aria-hidden", "true");
    element.dataset.mdtpInjectedControl = "true";
  }

  private handleDocumentPointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(".mdtp-sidebar-handle, .mdtp-sidebar-popover")) return;
    if (target.closest(".mdtp-image-manipulator")) return;
    if (target.closest(".mdtp-inline-editor")) return;

    if (this.tableSidebarPopoverEl) {
      this.hideTableSidebarPopover();
    }

    const plainTableTarget = this.resolvePlainMarkdownTableFromTarget(target);
    if (plainTableTarget) {
      void this.showPlainTableSidebarFromTarget(target);
      this.clearAllEnhancedSelections();
      this.hideImageToolbar();
      this.hideImageManipulator();
      return;
    }

    const tableEl = target.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    if (!tableEl) {
      this.schedulePlainTableSidebarFallback(target);
      if (!target.closest("table:not(.mdtp-table-shell)")) {
        this.activeNativeTableContext = null;
      }
      this.hideTableSidebar(true);
      this.clearAllEnhancedSelections();
      this.hideImageToolbar();
      this.hideImageManipulator();
      return;
    }

    this.activeNativeTableContext = null;
    if (!this.isInitializedTable(tableEl)) {
      this.hideTableSidebar(true);
      this.clearAllEnhancedSelections();
      this.hideImageToolbar();
      this.hideImageManipulator();
      return;
    }

    if (this.isInitializedEnhancedTable(tableEl) && !target.closest("img, .image-embed, .internal-embed, .media-embed")) {
      this.hideImageManipulator();
    }

    this.handleTablePointerDown(event, tableEl);
  }

  private async showPlainTableSidebarFromTarget(target: HTMLElement) {
    const nativeContext =
      (await this.getTargetUninitializedTableContext(target)) ??
      (this.isMarkdownContentTarget(target) ? await this.getActiveUninitializedTableContext(target) : null);
    if (!nativeContext?.tableEl) return;
    this.activeNativeTableContext = nativeContext;
    this.showTableSidebar({
      mode: "native",
      file: nativeContext.file,
      parsedTable: nativeContext.parsedTable,
      coord: nativeContext.coord,
      tableEl: nativeContext.tableEl,
    });
  }

  private schedulePlainTableSidebarFallback(target: HTMLElement | null) {
    if (target && !this.isMarkdownContentTarget(target)) return;
    if (this.plainTableSidebarFallbackTimer) {
      window.clearTimeout(this.plainTableSidebarFallbackTimer);
    }
    this.plainTableSidebarFallbackTimer = window.setTimeout(() => {
      this.plainTableSidebarFallbackTimer = null;
      void this.showPlainTableSidebarFromCursor();
    }, 40);
  }

  private async showPlainTableSidebarFromCursor() {
    const nativeContext = await this.getCursorBasedUninitializedTableContext();
    if (!nativeContext?.tableEl) return;
    this.activeNativeTableContext = nativeContext;
    this.showTableSidebar({
      mode: "native",
      file: nativeContext.file,
      parsedTable: nativeContext.parsedTable,
      coord: nativeContext.coord,
      tableEl: nativeContext.tableEl,
    });
  }

  private async handleDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(".mdtp-sidebar-handle, .mdtp-sidebar-popover")) return;
    if (target.closest(".mdtp-image-manipulator")) return;

    const nativeContext =
      (await this.getTargetUninitializedTableContext(target)) ??
      (this.isMarkdownContentTarget(target) ? await this.getActiveUninitializedTableContext(target) : null);
    if (nativeContext) {
      this.activeNativeTableContext = nativeContext;
      if (nativeContext.tableEl) {
        this.showTableSidebar({
          mode: "native",
          file: nativeContext.file,
          parsedTable: nativeContext.parsedTable,
          coord: nativeContext.coord,
          tableEl: nativeContext.tableEl,
        });
      }
    } else if (!target.closest("table.mdtp-table-shell")) {
      this.activeNativeTableContext = null;
      this.hideTableSidebar(true);
      this.schedulePlainTableSidebarFallback(target);
    }

    const nativeLayoutContext = this.getNativeLayoutTableSidebarContext(target);
    if (nativeLayoutContext) {
      this.activeNativeTableContext = null;
      this.showTableSidebar(nativeLayoutContext);
    }

    if (await this.maybeOpenEnhancedCellEditorFromClick(event, target)) {
      return;
    }

    this.hideImageToolbar();
    this.hideImageManipulator();
  }

  private isMarkdownContentTarget(target: HTMLElement) {
    return !!target.closest(".markdown-source-view, .markdown-reading-view, .cm-editor, .workspace-leaf-content");
  }

  private async maybeOpenEnhancedCellEditorFromClick(event: MouseEvent, target: HTMLElement) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
    if (
      target.closest(
        [
          ".mdtp-inline-editor",
          ".mdtp-resize-handle",
          ".mdtp-sidebar-handle",
          ".mdtp-sidebar-popover",
          ".mdtp-image-manipulator",
          "img",
          ".image-embed",
          ".internal-embed",
          ".media-embed",
          ".markdown-embed",
        ].join(", ")
      )
    ) {
      return false;
    }

    const cell = target.closest("th, td") as HTMLTableCellElement | null;
    const tableEl = target.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    if (!cell || !tableEl || !tableEl.contains(cell) || !this.isInitializedEnhancedTable(tableEl)) return false;

    const runtime = this.runtimeState.get(tableEl);
    const tableId = this.getInitializedTableId(tableEl);
    const coord = this.getCellCoord(cell);
    if (!runtime || !tableId || !coord) return false;

    const selection = runtime.selection;
    const isSingleSelected =
      selection &&
      selection.startRow === coord.row &&
      selection.endRow === coord.row &&
      selection.startCol === coord.col &&
      selection.endCol === coord.col;
    const isAnchor = runtime.anchor?.row === coord.row && runtime.anchor?.col === coord.col;
    if (!isSingleSelected || !isAnchor) return false;

    event.preventDefault();
    event.stopPropagation();
    await this.openInlineEditor(tableEl, runtime.file, tableId, runtime.parsedTable, cell, coord);
    return true;
  }

  private async handleDocumentDoubleClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(".mdtp-inline-editor")) return;
    if (target.closest("img, .image-embed, .internal-embed, .media-embed, .markdown-embed")) return;

    const cell = target.closest("th, td") as HTMLTableCellElement | null;
    const tableEl = target.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    if (cell && tableEl && tableEl.contains(cell) && this.isInitializedEnhancedTable(tableEl)) {
      const runtime = this.runtimeState.get(tableEl);
      const tableId = tableEl.dataset.mdtpTableId || null;
      if (!runtime) return;

      const coord = this.getCellCoord(cell);
      if (!coord) return;

      event.preventDefault();
      event.stopPropagation();
      await this.openInlineEditor(tableEl, runtime.file, tableId, runtime.parsedTable, cell, coord);
      return;
    }
  }

  private async handleDocumentContextMenu(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const contextView = this.getContainingMarkdownView(target);
    const isTableContextTarget = !!contextView && !!target.closest("table, .cm-table-widget");
    if (isTableContextTarget) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    const tableEl = target.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    if (!tableEl) {
      const plainContext = await this.getActiveUninitializedTableContext(target);
      if (plainContext) {
        const menu = new Menu();
        this.addNativeLayoutMenuItem(menu, plainContext.file, plainContext.parsedTable);
        (menu as any).addSeparator?.();
        this.addTemplateMenuItems(menu, { plainTableContext: plainContext });
        const view = contextView;
        this.showTableContextMenu(menu, event, view, {
          parsedTable: plainContext.parsedTable,
          coord: plainContext.coord,
        });
        return;
      }
      this.clearAllEnhancedSelections();
      return;
    }
    const runtime = this.runtimeState.get(tableEl);
    if (!runtime) return;

    if (!this.isInitializedEnhancedTable(tableEl)) {
      if (this.isNativeLayoutTable(tableEl)) {
        this.handleTableContextMenu(event, tableEl);
      }
      return;
    }

    const cell = target.closest("th, td") as HTMLTableCellElement | null;
    const coord = cell ? this.getCellCoord(cell) : null;
    if (coord) {
      runtime.anchor = coord;
      runtime.selection = this.selectionContains(runtime.selection, coord)
        ? runtime.selection
        : this.normalizeSelection(coord, coord);
      this.renderSelection(tableEl, runtime.selection, runtime.anchor);
    }

    const view = contextView;
    if (view) {
      this.lastTableContext = {
        at: Date.now(),
        filePath: view.file?.path ?? runtime.file.path,
        tableEl,
        target,
        x: event.clientX,
        y: event.clientY,
      };
    }

    const effectiveTableId = tableEl.dataset.mdtpTableId || runtime.parsedTable?.tableId || "";
    if (effectiveTableId || !this.shouldUseNativeEditorMenu(target, view)) {
      this.handleTableContextMenu(event, tableEl);
    }
  }

  private appendBlockLinkPlusMenuItems(
    menu: Menu,
    view: MarkdownView | null,
    hint?: { parsedTable?: ParsedTableBlock | null; coord?: CellCoord | null }
  ) {
    const blp = this.app.plugins.plugins["block-link-plus"] as
      | {
          settings?: { injectBlockLinkInTableMenus?: boolean };
          api?: {
            appendEditorLinkMenuItems?: (
              menu: Menu,
              editor: unknown,
              view: MarkdownView,
              opts?: { preferLine?: number; preferEndLine?: number }
            ) => boolean;
            tableCoordToSourceLine?: (parsedTable: ParsedTableBlock, coord: CellCoord) => number | null;
          };
        }
      | undefined;
    if (
      !blp?.api?.appendEditorLinkMenuItems ||
      !view ||
      !this.app.plugins.enabledPlugins.has("block-link-plus") ||
      blp.settings?.injectBlockLinkInTableMenus === false
    ) {
      return;
    }
    const editor = (view as MarkdownView & { editor?: { getCursor: (which?: string) => { line: number } } }).editor;
    if (!editor) return;

    let preferLine: number | undefined;
    if (hint?.parsedTable && hint?.coord && blp.api.tableCoordToSourceLine) {
      const line = blp.api.tableCoordToSourceLine(hint.parsedTable, hint.coord);
      if (line == null) {
        return;
      }
      preferLine = line;
    }

    if (preferLine != null && typeof (editor as { setCursor?: (pos: { line: number; ch: number }) => void }).setCursor === "function") {
      try {
        (editor as { setCursor: (pos: { line: number; ch: number }) => void }).setCursor({ line: preferLine, ch: 0 });
      } catch {
        // ignore cursor sync failures in reading view
      }
    }

    (menu as { addSeparator?: () => void }).addSeparator?.();
    const added = blp.api.appendEditorLinkMenuItems(
      menu,
      editor,
      view,
      preferLine != null
        ? { preferLine, preferEndLine: preferLine, suppressFailureHints: true }
        : { suppressFailureHints: true }
    );
    if (!added) {
      return;
    }
  }

  private showTableContextMenu(
    menu: Menu,
    event: MouseEvent,
    view: MarkdownView | null,
    hint?: { parsedTable?: ParsedTableBlock | null; coord?: CellCoord | null }
  ) {
    this.appendBlockLinkPlusMenuItems(menu, view, hint);
    event.preventDefault();
    event.stopPropagation();
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }

  private addEditorMenuItems(menu: Menu, view: MarkdownView) {
    const menuAny = menu as any;
    if (menuAny.__mdtpAugmented) return;

    const context = this.getEditorMenuContext(view);
    if (!context) {
      const nativeContext =
        this.activeNativeTableContext && this.activeNativeTableContext.file.path === view.file?.path
          ? this.activeNativeTableContext
          : null;
      const parsedTableAtCursor = this.getParsedTableAtEditorLine(view);
      if (nativeContext && nativeContext.file.path === view.file?.path) {
        this.addNativeLayoutMenuItem(menu, nativeContext.file, nativeContext.parsedTable);
        (menu as any).addSeparator?.();
      }
      if (parsedTableAtCursor?.tableId && view.file && this.dataStore.tables[parsedTableAtCursor.tableId]) {
        this.addTemplateMenuItems(menu, {
          file: view.file,
          tableId: parsedTableAtCursor.tableId,
        });
      } else {
        this.addTemplateMenuItems(menu, {
          plainTableContext:
            nativeContext ??
            (parsedTableAtCursor && view.file
              ? {
                  file: view.file,
                  parsedTable: parsedTableAtCursor,
                  coord: { row: 0, col: 0 },
                  tableEl: null,
                }
              : null),
        });
      }
      this.appendBlockLinkPlusMenuItems(menu, view, {
        parsedTable: nativeContext?.parsedTable ?? null,
        coord: nativeContext?.coord ?? null,
      });
      menuAny.__mdtpAugmented = true;
      return;
    }
    const { runtime, coord, tableId } = context;

    if (!tableId) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable);
      (menu as any).addSeparator?.();
      this.addTemplateMenuItems(menu, {
        plainTableContext: runtime.parsedTable && coord ? {
          file: runtime.file,
          parsedTable: runtime.parsedTable,
          coord,
          tableEl: context.tableEl,
        } : null,
      });
      this.appendBlockLinkPlusMenuItems(menu, view, {
        parsedTable: runtime.parsedTable,
        coord,
      });
      menuAny.__mdtpAugmented = true;
      return;
    }

    const record = this.dataStore.tables[tableId];
    if (record?.mode === "nativeLayout") {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable, tableId);
      if (coord) {
        this.addNativeLayoutRowColorMenuItems(
          menu,
          runtime.file,
          tableId,
          context.tableEl,
          runtime.selection ?? this.normalizeSelection(coord, coord),
          coord
        );
      }
      (menu as any).addSeparator?.();
      this.addTemplateMenuItems(menu, {
        file: runtime.file,
        tableId,
      });
      this.appendBlockLinkPlusMenuItems(menu, view, {
        parsedTable: runtime.parsedTable,
        coord,
      });
      menuAny.__mdtpAugmented = true;
      return;
    }

    if (!coord) return;

    if (this.canConvertEnhancedRecordToNativeLayout(record)) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable, tableId);
      (menu as any).addSeparator?.();
    }

    this.addTemplateMenuItems(menu, {
      file: runtime.file,
      tableId,
      tableSelection: runtime.selection ?? this.normalizeSelection(coord, coord),
    });
    this.appendBlockLinkPlusMenuItems(menu, view, {
      parsedTable: runtime.parsedTable,
      coord,
    });
    menuAny.__mdtpAugmented = true;
  }

  private addTemplateMenuItems(
    menu: Menu,
    options?: {
      file?: TFile;
      tableId?: string;
      tableSelection?: SelectionRect | null;
      plainTableContext?: UninitializedTableContext | null;
    }
  ) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const hasEditorSelection = !!this.getEditorTemplateSaveContent(activeView, true)?.trim();
    const hasTableSelection = !!options?.file && !!options.tableId && !!options.tableSelection;
    const hasPlainTableSelection = !!options?.plainTableContext;
    const parsedTableAtCursor = activeView ? this.getParsedTableAtEditorLine(activeView) : null;
    const hasCurrentTable =
      !!options?.plainTableContext ||
      (!!options?.file && !!options.tableId) ||
      !!parsedTableAtCursor;

    menu.addItem((item) => {
      item.setTitle("保存当前表格为模板");
      item.setIcon("table-properties");
      item.setDisabled(!hasCurrentTable);
      item.onClick(() => {
        void this.saveCurrentTableTemplateFromMenuContext(options);
      });
    });

    menu.addItem((item) => {
      item.setTitle("保存选中内容为模板");
      item.setIcon("bookmark-plus");
      item.setDisabled(!hasEditorSelection && !hasTableSelection && !hasPlainTableSelection);
      item.onClick(() => {
        void this.saveTemplateFromMenuContext(options);
      });
    });

    menu.addItem((item) => {
      item.setTitle("插入模板");
      item.setIcon("list-plus");
      item.onClick(() => this.openTemplateLibraryModal());
    });

    menu.addItem((item) => {
      item.setTitle("模板库");
      item.setIcon("folder-open");
      item.onClick(() => this.openTemplateLibraryModal());
    });
  }

  private async saveCurrentTableTemplateFromMenuContext(options?: {
    file?: TFile;
    tableId?: string;
    tableSelection?: SelectionRect | null;
    plainTableContext?: UninitializedTableContext | null;
  }) {
    if (options?.plainTableContext) {
      return this.savePlainTableAsTemplate(options.plainTableContext);
    }
    if (options?.file && options.tableId) {
      const content = await this.app.vault.cachedRead(options.file);
      const parsedTable = this.findParsedTableForRecordId(content, options.file, options.tableId);
      return this.saveManagedTableAsTemplate(options.file, parsedTable, options.tableId);
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view?.file) {
      const parsedTableAtCursor = this.getParsedTableAtEditorLine(view);
      if (parsedTableAtCursor?.tableId && this.dataStore.tables[parsedTableAtCursor.tableId]) {
        return this.saveManagedTableAsTemplate(view.file, parsedTableAtCursor, parsedTableAtCursor.tableId);
      }
      if (parsedTableAtCursor) {
        return this.savePlainTableAsTemplate({
          file: view.file,
          parsedTable: parsedTableAtCursor,
          coord: { row: 0, col: 0 },
          tableEl: null,
        });
      }
    }

    new Notice("没有读到当前表格内容");
    return false;
  }

  private getEnhancedTableSidebarContext(target: HTMLElement | null): EnhancedTableSidebarContext | null {
    if (!target) return null;
    const tableEl = target.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    if (!tableEl || !this.isInitializedEnhancedTable(tableEl)) return null;
    const runtime = this.runtimeState.get(tableEl);
    const cell = target.closest("th, td") as HTMLTableCellElement | null;
    const coord = cell ? this.getCellCoord(cell) : runtime?.anchor ?? null;
    const tableId = this.getInitializedTableId(tableEl);
    if (!runtime || !coord || !tableId) return null;
    return {
      mode: "enhanced",
      file: runtime.file,
      tableId,
      parsedTable: runtime.parsedTable,
      selection: runtime.selection,
      coord,
      tableEl,
    };
  }

  private getNativeLayoutTableSidebarContext(target: HTMLElement | null): NativeLayoutTableSidebarContext | null {
    if (!target) return null;
    const tableEl = target.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    if (!tableEl || !this.isNativeLayoutTable(tableEl)) return null;
    const runtime = this.runtimeState.get(tableEl);
    const tableId = this.getManagedTableId(tableEl);
    const cell = target.closest("th, td") as HTMLTableCellElement | null;
    const coord = cell ? this.getCellCoord(cell) : runtime?.anchor;
    if (!runtime || !tableId || !coord) return null;
    return {
      mode: "nativeLayout",
      file: runtime.file,
      tableId,
      parsedTable: runtime.parsedTable,
      selection: runtime.selection,
      coord,
      tableEl,
    };
  }

  private ensureTableSidebarHandle() {
    if (this.tableSidebarHandleEl) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mdtp-sidebar-handle";
    button.textContent = "表";
    button.setAttribute("aria-label", "打开表格增强面板");
    button.title = "打开表格增强面板";
    button.style.display = "none";
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.toggleTableSidebarPopover();
    });

    document.body.appendChild(button);
    this.tableSidebarHandleEl = button;
  }

  private showTableSidebar(context: TableSidebarContext) {
    if (context.mode === "enhanced") return;
    this.ensureTableSidebarHandle();
    this.activeTableSidebarContext = context;
    this.renderTableSidebarHandle(context);
  }

  private renderTableSidebarHandle(context: TableSidebarContext) {
    if (!this.tableSidebarHandleEl) return;
    const draggerHandle = this.findDraggerHandleForTableSidebarContext(context);
    const positionHandle = (handle: HTMLButtonElement, top: number, left: number, integrated: boolean) => {
      if (integrated) {
        handle.dataset.mdtpIntegrated = "dragger";
      } else {
        delete handle.dataset.mdtpIntegrated;
      }
      handle.style.left = `${left}px`;
      handle.style.top = `${top}px`;
      handle.style.display = "flex";
    };

    if (draggerHandle) {
      const draggerRect = draggerHandle.getBoundingClientRect();
      const top = Math.max(72, draggerRect.top + Math.max(0, (draggerRect.height - 22) / 2));
      const left = Math.max(8, draggerRect.left - 54);
      positionHandle(this.tableSidebarHandleEl, top, left, true);
      return;
    }

    const rect = context.tableEl.getBoundingClientRect();
    const top = Math.max(72, rect.top + 8);
    const left = Math.max(12, rect.left - 58);
    positionHandle(this.tableSidebarHandleEl, top, left, false);
  }

  private findDraggerHandleForTableSidebarContext(context: TableSidebarContext) {
    const line = context.parsedTable?.startLine;
    if (typeof line !== "number" || !Number.isFinite(line)) return null;

    const root = context.tableEl.closest(".markdown-source-view, .cm-editor") as HTMLElement | null;
    const scope = root ?? document.body;
    const handles = Array.from(scope.querySelectorAll(DRAGGER_HANDLE_SELECTOR)) as HTMLElement[];
    for (const handle of handles) {
      if (handle.classList.contains("dnd-hidden")) continue;
      const start = Number.parseInt(handle.dataset.blockStart ?? "", 10);
      const end = Number.parseInt(handle.dataset.blockEnd ?? handle.dataset.blockStart ?? "", 10);
      if (!Number.isFinite(start)) continue;
      const safeEnd = Number.isFinite(end) ? end : start;
      if (line >= start && line <= safeEnd) {
        return handle;
      }
    }

    return null;
  }

  private toggleTableSidebarPopover() {
    const context = this.activeTableSidebarContext;
    if (!context) return;
    if (this.tableSidebarPopoverEl) {
      this.hideTableSidebarPopover();
      return;
    }
    this.showTableSidebarPopover(context);
  }

  private hideTableSidebar(force = false) {
    this.hideTableSidebarPopover();
    if (this.tableSidebarHandleEl) {
      this.tableSidebarHandleEl.style.display = "none";
    }
    if (force) {
      this.activeTableSidebarContext = null;
    }
  }

  private hideTableSidebarPopover() {
    if (!this.tableSidebarPopoverEl) return;
    this.tableSidebarPopoverEl.remove();
    this.tableSidebarPopoverEl = null;
  }

  private showTableSidebarPopover(context: TableSidebarContext) {
    this.hideTableSidebarPopover();

    const root = document.createElement("div");
    root.className = "mdtp-sidebar-popover";
    root.addEventListener("pointerdown", (event) => event.stopPropagation());
    root.addEventListener("click", (event) => event.stopPropagation());

    const addSectionTitle = (label: string) => {
      const title = document.createElement("div");
      title.className = "mdtp-sidebar-section-title";
      title.textContent = label;
      root.appendChild(title);
    };

    const addButton = (
      label: string,
      onClick: () => void | Promise<void>,
      options?: { wide?: boolean; experimental?: boolean }
    ) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mdtp-sidebar-button${options?.wide ? " is-wide" : ""}`;
      button.textContent = options?.experimental ? `${label}（实验）` : label;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void onClick();
      });
      root.appendChild(button);
    };

    if (context.mode === "native") {
      addSectionTitle("原生表格");
      const nativeLayoutTableId = context.parsedTable.tableId || context.tableEl.dataset.mdtpTableId || "";
      const nativeLayoutRecord = nativeLayoutTableId ? this.dataStore.tables[nativeLayoutTableId] : null;
      for (const descriptor of this.getNativeSidebarActionDescriptors()) {
        if (!this.shouldExposeExperimentalAction(descriptor.experimental)) continue;
        if (descriptor.label === NATIVE_LAYOUT_CURRENT_TABLE_LABEL) {
          addButton(descriptor.label, async () => {
            const didInit = await this.initializeSpecificTableNativeLayout(context.file, context.parsedTable);
            if (didInit) this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === NATIVE_LAYOUT_PAGE_TABLES_LABEL) {
          addButton(descriptor.label, async () => {
            const didInit = await this.initializeVisiblePageTablesNativeLayout(context.file);
            if (didInit) this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === NATIVE_LAYOUT_ROW_COLOR_LABEL) {
          if (nativeLayoutRecord?.mode === "nativeLayout") {
            addButton(descriptor.label, () => {
              this.showNativeLayoutRowColorPalette(
                context.file,
                context.tableEl,
                nativeLayoutTableId,
                this.normalizeSelection(context.coord, context.coord),
                context.coord
              );
            }, { wide: descriptor.wide, experimental: descriptor.experimental });
          }
          continue;
        }
        if (descriptor.label === NATIVE_LAYOUT_ROW_BANDS_LABEL) {
          if (nativeLayoutRecord?.mode === "nativeLayout") {
            addButton(descriptor.label, () => {
              new NativeRowBandColorModal(this, context.file, nativeLayoutTableId, context.tableEl).open();
              this.hideTableSidebarPopover();
            }, { wide: descriptor.wide, experimental: descriptor.experimental });
          }
          continue;
        }
        if (descriptor.label === NATIVE_LAYOUT_TABLE_STYLE_LABEL || descriptor.label === NATIVE_LAYOUT_CLEAR_TABLE_STYLE_LABEL) {
          if (nativeLayoutRecord?.mode === "nativeLayout") {
            addButton(descriptor.label, async () => {
              await this.setNativeLayoutTableStyle(
                nativeLayoutTableId,
                context.file,
                context.tableEl,
                descriptor.label === NATIVE_LAYOUT_TABLE_STYLE_LABEL
              );
              this.hideTableSidebarPopover();
            }, { wide: descriptor.wide, experimental: descriptor.experimental });
          }
          continue;
        }
        const nativeAlignment = this.getNativeLayoutAlignmentForLabel(descriptor.label);
        if (nativeAlignment !== undefined) {
          if (nativeLayoutRecord?.mode === "nativeLayout") {
            addButton(descriptor.label, async () => {
              await this.setNativeLayoutCellRangeAlignment(
                nativeLayoutTableId,
                context.file,
                context.tableEl,
                null,
                context.coord,
                nativeAlignment
              );
              this.hideTableSidebarPopover();
            }, { wide: descriptor.wide, experimental: descriptor.experimental });
          }
          continue;
        }
        if (descriptor.label === NATIVE_LAYOUT_FILL_DOWN_LABEL || descriptor.label === NATIVE_LAYOUT_FILL_RIGHT_LABEL) {
          if (nativeLayoutRecord?.mode === "nativeLayout") {
            addButton(descriptor.label, async () => {
              const target = this.getNativeAutoFillSidebarTarget(
                context.tableEl,
                context.coord,
                descriptor.label === NATIVE_LAYOUT_FILL_DOWN_LABEL ? "down" : "right"
              );
              if (target) await this.applyNativeAutoFill(nativeLayoutTableId, context.file, context.tableEl, context.coord, target);
              this.hideTableSidebarPopover();
            }, { wide: descriptor.wide, experimental: descriptor.experimental });
          }
          continue;
        }
        if (descriptor.label === "保存当前表格为模板") {
          addButton(descriptor.label, async () => {
            await this.savePlainTableAsTemplate(context);
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === "插入模板" || descriptor.label === "模板库") {
          addButton(descriptor.label, () => {
            this.openTemplateLibraryModal();
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
      }
    } else if (context.mode === "nativeLayout") {
      void addSectionTitle;
      void addButton;
      this.appendNativeLayoutSidebarCategories(root, this.refreshNativeLayoutSidebarContext(context));
    }

    document.body.appendChild(root);
    this.tableSidebarPopoverEl = root;
    this.positionTableSidebarPopover(context);
  }

  private appendNativeLayoutSidebarCategories(root: HTMLElement, context: NativeLayoutTableSidebarContext) {
    root.classList.add("mdtp-sidebar-popover-categorized");

    const categories = this.buildNativeLayoutSidebarCategories(context).filter((category) => category.actions.length > 0 || !!category.render);
    if (categories.length === 0) return;

    const primary = document.createElement("div");
    primary.className = "mdtp-sidebar-primary-actions";
    const primaryButton = document.createElement("button");
    primaryButton.type = "button";
    primaryButton.className = "mdtp-sidebar-button is-primary is-wide";
    primaryButton.textContent = NATIVE_LAYOUT_CURRENT_TABLE_LABEL;
    primaryButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void (async () => {
        if (context.parsedTable) {
          await this.initializeSpecificTableNativeLayout(context.file, context.parsedTable);
        } else {
          await this.setNativeLayoutTableStyle(context.tableId, context.file, context.tableEl, true);
        }
        this.hideTableSidebarPopover();
      })();
    });
    primary.appendChild(primaryButton);
    root.appendChild(primary);

    const nav = document.createElement("div");
    nav.className = "mdtp-sidebar-category-list";
    const panel = document.createElement("div");
    panel.className = "mdtp-sidebar-action-panel";
    root.append(nav, panel);

    let activeId = categories[0].id;
    const renderCategory = (category: SidebarPopoverCategory) => {
      activeId = category.id;
      for (const button of Array.from(nav.querySelectorAll(".mdtp-sidebar-category-button"))) {
        button.classList.toggle("is-active", (button as HTMLElement).dataset.categoryId === activeId);
      }
      panel.replaceChildren();
      const title = document.createElement("div");
      title.className = "mdtp-sidebar-section-title";
      title.textContent = category.label;
      panel.appendChild(title);
      category.render?.(panel);
      for (const action of category.actions) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `mdtp-sidebar-button${action.wide ? " is-wide" : ""}`;
        button.textContent = action.label;
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          void action.run();
        });
        panel.appendChild(button);
      }
    };

    for (const category of categories) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mdtp-sidebar-category-button";
      button.dataset.categoryId = category.id;
      button.textContent = category.label;
      button.addEventListener("pointerenter", () => renderCategory(category));
      button.addEventListener("focus", () => renderCategory(category));
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        renderCategory(category);
      });
      nav.appendChild(button);
    }

    renderCategory(categories[0]);
  }

  private refreshNativeLayoutSidebarContext(context: NativeLayoutTableSidebarContext): NativeLayoutTableSidebarContext {
    const latestSelection = this.resolveLatestNativeLayoutSelection(context.tableEl, context.selection);
    if (!latestSelection) return context;

    const runtime = this.runtimeState.get(context.tableEl);
    if (runtime) {
      runtime.selection = latestSelection;
      runtime.anchor = runtime.anchor ?? context.coord;
    }

    return {
      ...context,
      selection: latestSelection,
    };
  }

  private buildNativeLayoutSidebarCategories(context: NativeLayoutTableSidebarContext): SidebarPopoverCategory[] {
    const close = () => this.hideTableSidebarPopover();
    const beautify: SidebarPopoverAction[] = [
      {
        label: NATIVE_LAYOUT_PAGE_TABLES_LABEL,
        wide: true,
        run: async () => {
          const didInit = await this.initializeVisiblePageTablesNativeLayout(context.file);
          if (didInit) close();
        },
      },
      {
        label: NATIVE_LAYOUT_TABLE_STYLE_LABEL,
        wide: true,
        run: async () => {
          await this.setNativeLayoutTableStyle(context.tableId, context.file, context.tableEl, true);
          close();
        },
      },
      {
        label: NATIVE_LAYOUT_CLEAR_TABLE_STYLE_LABEL,
        wide: true,
        run: async () => {
          await this.setNativeLayoutTableStyle(context.tableId, context.file, context.tableEl, false);
          close();
        },
      },
      {
        label: NATIVE_LAYOUT_BORDER_ENABLE_LABEL,
        wide: true,
        run: async () => {
          await this.setNativeLayoutTableBorderStyle(context.tableId, context.file, context.tableEl, true);
          close();
        },
      },
      {
        label: NATIVE_LAYOUT_BORDER_DISABLE_LABEL,
        wide: true,
        run: async () => {
          await this.setNativeLayoutTableBorderStyle(context.tableId, context.file, context.tableEl, false);
          close();
        },
      },
    ];

    const size: SidebarPopoverAction[] = [
      {
        label: NATIVE_LAYOUT_SCALE_LABEL,
        wide: true,
        run: () => this.showNativeLayoutScaleMenu(context.file, context.tableEl, context.tableId),
      },
      {
        label: "列宽 -",
        run: async () => {
          await this.adjustNativeLayoutSelectedColumnWidth(context.tableId, context.file, context.tableEl, context.selection, context.coord, -10);
          close();
        },
      },
      {
        label: "列宽 +",
        run: async () => {
          await this.adjustNativeLayoutSelectedColumnWidth(context.tableId, context.file, context.tableEl, context.selection, context.coord, 10);
          close();
        },
      },
      {
        label: "行高 -",
        run: async () => {
          await this.adjustNativeLayoutSelectedRowHeight(context.tableId, context.file, context.tableEl, context.selection, context.coord, -4);
          close();
        },
      },
      {
        label: "行高 +",
        run: async () => {
          await this.adjustNativeLayoutSelectedRowHeight(context.tableId, context.file, context.tableEl, context.selection, context.coord, 4);
          close();
        },
      },
    ];

    const style: SidebarPopoverAction[] = [
      {
        label: NATIVE_LAYOUT_ROW_COLOR_LABEL,
        wide: true,
        run: () => this.showNativeLayoutRowColorPalette(context.file, context.tableEl, context.tableId, context.selection, context.coord),
      },
      {
        label: NATIVE_LAYOUT_ROW_BANDS_LABEL,
        wide: true,
        run: () => {
          new NativeRowBandColorModal(this, context.file, context.tableId, context.tableEl).open();
          close();
        },
      },
      {
        label: NATIVE_LAYOUT_TEXT_COLOR_LABEL,
        wide: true,
        run: () => this.showNativeLayoutTextColorPalette(context.file, context.tableEl, context.tableId, context.selection, context.coord),
      },
      {
        label: NATIVE_LAYOUT_CLEAR_TEXT_COLOR_LABEL,
        wide: true,
        run: async () => {
          await this.setNativeLayoutCellRangeTextColor(context.tableId, context.file, context.tableEl, context.selection, context.coord, null);
          close();
        },
      },
    ];

    const alignments: SidebarPopoverAction[] = [
      { label: NATIVE_LAYOUT_ALIGN_LEFT_LABEL, alignment: "left" as const },
      { label: NATIVE_LAYOUT_ALIGN_CENTER_LABEL, alignment: "center" as const },
      { label: NATIVE_LAYOUT_ALIGN_RIGHT_LABEL, alignment: "right" as const },
    ].map(({ label, alignment }) => ({
      label,
      run: async () => {
        await this.setNativeLayoutCellRangeAlignment(
          context.tableId,
          context.file,
          context.tableEl,
          context.selection,
          context.coord,
          alignment
        );
        close();
      },
    }));

    const fillActions: SidebarPopoverAction[] = [];
    const downTarget = this.getNativeAutoFillSidebarTarget(context.tableEl, context.coord, "down");
    if (downTarget) {
      fillActions.push({
        label: NATIVE_LAYOUT_FILL_DOWN_LABEL,
        run: async () => {
          await this.applyNativeAutoFill(context.tableId, context.file, context.tableEl, context.coord, downTarget);
          close();
        },
      });
    }
    const rightTarget = this.getNativeAutoFillSidebarTarget(context.tableEl, context.coord, "right");
    if (rightTarget) {
      fillActions.push({
        label: NATIVE_LAYOUT_FILL_RIGHT_LABEL,
        run: async () => {
          await this.applyNativeAutoFill(context.tableId, context.file, context.tableEl, context.coord, rightTarget);
          close();
        },
      });
    }

    const editActions: SidebarPopoverAction[] = [
      {
        label: "格式化表格",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "format-table");
          close();
        },
      },
      {
        label: "插入行",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "insert-row");
          close();
        },
      },
      {
        label: "插入列",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "insert-column");
          close();
        },
      },
      {
        label: "删除行",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "delete-row");
          close();
        },
      },
      {
        label: "删除列",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "delete-column");
          close();
        },
      },
      {
        label: "行上移",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "move-row-up");
          close();
        },
      },
      {
        label: "行下移",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "move-row-down");
          close();
        },
      },
      {
        label: "列左移",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "move-column-left");
          close();
        },
      },
      {
        label: "列右移",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "move-column-right");
          close();
        },
      },
      {
        label: "升序排序",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "sort-rows-ascending");
          close();
        },
      },
      {
        label: "降序排序",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "sort-rows-descending");
          close();
        },
      },
      {
        label: "转置",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "transpose");
          close();
        },
      },
      {
        label: "计算公式",
        run: async () => {
          await this.runNativeLayoutAdvancedTableOperation(context as any, "evaluate-formulas");
          close();
        },
      },
    ];

    const output: SidebarPopoverAction[] = [
      {
        label: "保存当前表格为模板",
        wide: true,
        run: async () => {
          await this.saveManagedTableAsTemplate(context.file, context.parsedTable, context.tableId);
          close();
        },
      },
      {
        label: "导出 CSV",
        wide: true,
        run: async () => {
          await this.showAdvancedTableCsvExport(true);
          close();
        },
      },
      {
        label: "模板库",
        wide: true,
        run: () => {
          this.openTemplateLibraryModal();
          close();
        },
      },
    ];

    return [
      { id: "beautify", label: "美化", actions: beautify },
      { id: "size", label: NATIVE_LAYOUT_SIZE_LABEL, actions: size },
      { id: "style", label: "颜色字体", actions: style },
      { id: "align", label: "对齐", actions: alignments },
      { id: "fill", label: "填充", actions: fillActions },
      { id: "edit", label: "编辑排序", actions: editActions },
      { id: "formula", label: NATIVE_LAYOUT_FORMULA_HELP_LABEL, actions: [], render: (panel) => this.appendNativeFormulaHelp(panel) },
      { id: "output", label: "模板导出", actions: output },
    ];
  }

  private appendNativeFormulaHelp(panel: HTMLElement) {
    const table = document.createElement("table");
    table.className = "mdtp-formula-help-table";
    const rows = [
      ["输入", "效果"],
      ["=sum", "自动汇总当前列上方数字"],
      ["=sum(C2:C4)", "汇总指定范围"],
      ["=avg(C2:C4)", "平均值；也支持 =average(...)"],
      ["=min(C2:C4)", "最小值"],
      ["=max(C2:C4)", "最大值"],
      ["A1 / C2:C4", "支持单元格与范围引用"],
      ["$a^2+b^2=c^2$", "轻量 LaTeX 识别显示"],
      ["拖拽右下小方块", "自动填充数字序列或 A1/A2"],
    ];
    for (const [index, row] of rows.entries()) {
      const tr = document.createElement("tr");
      const first = document.createElement(index === 0 ? "th" : "td");
      const second = document.createElement(index === 0 ? "th" : "td");
      first.textContent = row[0];
      second.textContent = row[1];
      tr.append(first, second);
      table.appendChild(tr);
    }
    panel.appendChild(table);
  }

  private positionTableSidebarPopover(context: TableSidebarContext) {
    if (!this.tableSidebarPopoverEl) return;
    const anchorRect = this.tableSidebarHandleEl?.getBoundingClientRect();
    const fallbackRect = context.tableEl.getBoundingClientRect();
    const rect = anchorRect && anchorRect.width > 0 && anchorRect.height > 0 ? anchorRect : fallbackRect;
    this.tableSidebarPopoverEl.style.left = `${Math.max(16, rect.right + 8)}px`;
    this.tableSidebarPopoverEl.style.top = `${Math.max(72, rect.top - 4)}px`;
  }

  private getNativeLayoutAlignmentForLabel(label: string): "left" | "center" | "right" | undefined {
    if (label === NATIVE_LAYOUT_ALIGN_LEFT_LABEL) return "left";
    if (label === NATIVE_LAYOUT_ALIGN_CENTER_LABEL) return "center";
    if (label === NATIVE_LAYOUT_ALIGN_RIGHT_LABEL) return "right";
    return undefined;
  }

  private getNativeAutoFillSidebarTarget(tableEl: HTMLTableElement, coord: CellCoord, direction: "down" | "right") {
    const structure = this.collectTableStructure(tableEl);
    if (direction === "down") {
      const maxRow = Math.max(0, structure.rows.length - 1);
      return coord.row < maxRow ? { row: maxRow, col: coord.col } : null;
    }

    const maxCol = Math.max(0, ...structure.matrix.map((row) => row.length - 1));
    return coord.col < maxCol ? { row: coord.row, col: maxCol } : null;
  }

  getNativeSidebarActionDescriptors(): SidebarActionDescriptor[] {
    return [
      { label: NATIVE_LAYOUT_CURRENT_TABLE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_PAGE_TABLES_LABEL, wide: true },
      { label: NATIVE_LAYOUT_TABLE_STYLE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_COLOR_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_BANDS_LABEL, wide: true },
      { label: NATIVE_LAYOUT_TEXT_COLOR_LABEL, wide: true },
      { label: NATIVE_LAYOUT_SCALE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ALIGN_LEFT_LABEL },
      { label: NATIVE_LAYOUT_ALIGN_CENTER_LABEL },
      { label: NATIVE_LAYOUT_ALIGN_RIGHT_LABEL },
      { label: NATIVE_LAYOUT_FILL_DOWN_LABEL },
      { label: NATIVE_LAYOUT_FILL_RIGHT_LABEL },
      { label: "格式化表格" },
      { label: "插入行" },
      { label: "插入列" },
      { label: "删除行" },
      { label: "删除列" },
      { label: "升序排序" },
      { label: "降序排序" },
      { label: "转置" },
      { label: "导出 CSV（含表头）", wide: true },
      { label: "保存当前表格为模板", wide: true },
      { label: "插入模板", wide: true },
      { label: "模板库", wide: true },
    ];
  }

  getNativeLayoutSidebarActionDescriptors(): SidebarActionDescriptor[] {
    return [
      { label: NATIVE_LAYOUT_CURRENT_TABLE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_PAGE_TABLES_LABEL, wide: true },
      { label: NATIVE_LAYOUT_TABLE_STYLE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_CLEAR_TABLE_STYLE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_COLOR_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_BANDS_LABEL, wide: true },
      { label: NATIVE_LAYOUT_TEXT_COLOR_LABEL, wide: true },
      { label: NATIVE_LAYOUT_CLEAR_TEXT_COLOR_LABEL, wide: true },
      { label: NATIVE_LAYOUT_SCALE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ALIGN_LEFT_LABEL },
      { label: NATIVE_LAYOUT_ALIGN_CENTER_LABEL },
      { label: NATIVE_LAYOUT_ALIGN_RIGHT_LABEL },
      { label: NATIVE_LAYOUT_FILL_DOWN_LABEL },
      { label: NATIVE_LAYOUT_FILL_RIGHT_LABEL },
      { label: "格式化表格" },
      { label: "插入行" },
      { label: "插入列" },
      { label: "删除行" },
      { label: "删除列" },
      { label: "行上移" },
      { label: "行下移" },
      { label: "列左移" },
      { label: "列右移" },
      { label: "升序排序" },
      { label: "降序排序" },
      { label: "转置" },
      { label: "计算公式" },
      { label: "导出 CSV（含表头）", wide: true },
      { label: "导出 CSV（不含表头）", wide: true },
      { label: "保存当前表格为模板", wide: true },
      { label: "插入模板", wide: true },
      { label: "模板库", wide: true },
    ];
  }

  getEnhancedSidebarActionDescriptors(): SidebarActionDescriptor[] {
    return [];
  }

  private shouldExposeExperimentalAction(experimental?: boolean) {
    return !experimental || !!this.dataStore?.experimentalFeatureGate;
  }

  private getEditorMenuContext(view: MarkdownView) {
    const freshContext = this.getFreshTableContext(view);
    if (freshContext) {
      const runtime = this.runtimeState.get(freshContext.tableEl);
      const cell = freshContext.target.closest("th, td") as HTMLTableCellElement | null;
      const coord = cell ? this.getCellCoord(cell) : null;
      const datasetTableId = freshContext.tableEl.dataset.mdtpTableId || "";
      const parsedTableId = runtime?.parsedTable?.tableId ?? "";
      const tableId =
        (datasetTableId && this.dataStore.tables[datasetTableId] ? datasetTableId : "") ||
        this.getInitializedTableId(freshContext.tableEl) ||
        (parsedTableId && this.dataStore.tables[parsedTableId]
          ? parsedTableId
          : "");
      if (runtime && cell && coord) {
        return {
          tableEl: freshContext.tableEl,
          runtime,
          cell,
          coord,
          tableId,
          x: freshContext.x,
          y: freshContext.y,
        };
      }
    }

    const activeContext = this.getActiveInteractionContext(true);
    if (!activeContext || activeContext.file.path !== view.file?.path) return null;
    const runtime = this.runtimeState.get(activeContext.tableEl);
    if (!runtime) return null;

    const anchorCell = activeContext.tableEl.querySelector(
      `[data-mdtp-row='${activeContext.anchor.row}'][data-mdtp-col='${activeContext.anchor.col}']`
    ) as HTMLTableCellElement | null;
    if (!anchorCell) return null;

    return {
      tableEl: activeContext.tableEl,
      runtime,
      cell: anchorCell,
      coord: activeContext.anchor,
      tableId:
        (activeContext.tableEl.dataset.mdtpTableId && this.dataStore.tables[activeContext.tableEl.dataset.mdtpTableId]
          ? activeContext.tableEl.dataset.mdtpTableId
          : "") ||
        activeContext.tableId ||
        (runtime.parsedTable?.tableId && this.dataStore.tables[runtime.parsedTable.tableId]
          ? runtime.parsedTable.tableId
          : ""),
      x: 0,
      y: 0,
    };
  }

  private getFreshTableContext(view: MarkdownView) {
    const context = this.lastTableContext;
    if (!context) return null;
    if (Date.now() - context.at > 1500) return null;
    if (!view.file || context.filePath !== view.file.path) return null;
    if (!document.body.contains(context.tableEl)) return null;
    return context;
  }

  private resolveMarkdownViewFromMenuInfo(info: unknown) {
    if (info instanceof MarkdownView) {
      return info;
    }

    const infoFilePath =
      info && typeof info === "object" && "file" in info && (info as { file?: TFile | null }).file instanceof TFile
        ? (info as { file?: TFile }).file?.path ?? null
        : null;

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView?.file && (!infoFilePath || activeView.file.path === infoFilePath)) {
      return activeView;
    }

    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof MarkdownView) || !view.file) continue;
      if (!infoFilePath || view.file.path === infoFilePath) {
        return view;
      }
    }

    return null;
  }

  private getContainingMarkdownView(target: HTMLElement) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView?.contentEl instanceof HTMLElement && activeView.contentEl.contains(target)) {
      return activeView;
    }

    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) continue;
      const contentEl = (view as any).contentEl;
      if (contentEl instanceof HTMLElement && contentEl.contains(target)) {
        return view;
      }
    }
    return null;
  }

  private shouldUseNativeEditorMenu(target: HTMLElement | null, view: MarkdownView | null) {
    if (!target || !view) return false;
    if (target.closest(".mdtp-inline-editor")) return false;
    return !!target.closest(".markdown-source-view, .cm-editor, .cm-content");
  }

  private async handleDocumentKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || this.historyApplying) return;
    const target = event.target as HTMLElement | null;
    const context = this.getActiveInteractionContext(true);
    const isTypingTarget = !!target?.closest("input, textarea, [contenteditable='true'], .cm-content");
    const isDirectFormTypingTarget = !!target?.closest("input, textarea, select, .mdtp-inline-editor, .mdtp-onenote-paste-zone");
    const isForeignEditableTarget =
      !!target?.closest("[contenteditable='true']") && !target?.closest(".cm-content") && !target?.closest(".mdtp-onenote-paste-zone");

    if (this.handleAdvancedTableSourceKeyDown(event, target)) {
      return;
    }

    if (
      this.isExperimentalFeatureEnabled() &&
      this.activeImageManipulator &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !isDirectFormTypingTarget &&
      !isForeignEditableTarget &&
      (event.key === "Backspace" || event.key === "Delete")
    ) {
      const handled = await this.removeActiveImageFromCell(this.activeImageManipulator);
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (
      this.isExperimentalFeatureEnabled() &&
      context?.tableId &&
      !this.activeEditor &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey &&
      !isTypingTarget &&
      event.key === "Enter"
    ) {
      const runtime = this.runtimeState.get(context.tableEl);
      const cell = context.tableEl.querySelector(
        `[data-mdtp-row='${context.anchor.row}'][data-mdtp-col='${context.anchor.col}']`
      ) as HTMLTableCellElement | null;
      if (runtime && cell) {
        event.preventDefault();
        event.stopPropagation();
        await this.openInlineEditor(context.tableEl, context.file, context.tableId, runtime.parsedTable, cell, context.anchor);
        return;
      }
    }

    if (
      this.isExperimentalFeatureEnabled() &&
      context?.tableId &&
      !this.activeEditor &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !isDirectFormTypingTarget &&
      !isForeignEditableTarget &&
      (event.key === "Backspace" || event.key === "Delete")
    ) {
      const selection = context.selection ?? this.normalizeSelection(context.anchor, context.anchor);
      const handled = await this.clearSelectionContents(context.file, context.tableId, selection);
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (!(event.metaKey || event.ctrlKey)) return;

    const key = event.key.toLowerCase();
    if (target?.closest(".mdtp-inline-editor")) {
      if (key !== "v" || !this.activeEditor) return;
      const imageFile = await this.readImageFromAvailableClipboard();
      if (!imageFile) return;

      event.preventDefault();
      event.stopPropagation();
      const imageMarkup = await this.createAttachmentMarkup(this.activeEditor.file, imageFile);
      if (!imageMarkup) return;
      this.appendImageMarkupToActiveEditor(imageMarkup);
      this.suppressDocumentPasteUntil = Date.now() + PASTE_EVENT_SUPPRESSION_MS;
      return;
    }
    if (this.isExperimentalFeatureEnabled() && context?.tableId) {
      if (key === "c") {
        const selection = context.selection ?? this.normalizeSelection(context.anchor, context.anchor);
        const handled = await this.copySelectionToClipboard(context.file, context.tableId, selection);
        if (handled) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (key === "v") {
        const handled = await this.handleClipboardContentPasteForSelectedCell(context.file, context.tableId, context.anchor);
        if (handled) {
          this.suppressDocumentPasteUntil = Date.now() + PASTE_EVENT_SUPPRESSION_MS;
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        await this.undoLastAction(context.file.path, context.tableId);
        return;
      }

      if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        event.stopPropagation();
        await this.redoLastAction(context.file.path, context.tableId);
        return;
      }
    }

    if (key !== "c" && key !== "v") return;

    return;
  }

  private handleAdvancedTableSourceKeyDown(event: KeyboardEvent, target: HTMLElement | null) {
    if (event.defaultPrevented || event.isComposing) return false;
    if (event.metaKey || event.ctrlKey || event.altKey) return false;
    if (!target?.closest(".cm-content")) return false;

    const settings = this.getAdvancedTableSettings();
    let operation: AdvancedTableOperation | null = null;
    if (event.key === "Tab" && settings.bindTab) {
      operation = event.shiftKey ? "previous-cell" : "next-cell";
    } else if (event.key === "Enter" && !event.shiftKey && settings.bindEnter) {
      operation = "next-row";
    }
    if (!operation) return false;

    const view = this.getContainingMarkdownView(target);
    const editor = (view as any)?.editor ?? this.getActiveMarkdownEditor();
    if (!editor) return false;

    try {
      const handled = runAdvancedTableOperationOnEditor(editor, operation, settings);
      if (!handled) return false;
      event.preventDefault();
      event.stopPropagation();
      return true;
    } catch (error) {
      console.error("[mdtp] advanced table key binding failed", error);
      return false;
    }
  }

  private async handleDocumentPaste(event: ClipboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest(".mdtp-onenote-paste-zone")) return;

    if (Date.now() < this.suppressDocumentPasteUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const imageFile = await this.readImageFromAvailableClipboard(event);

    if (this.activeEditor) {
      if (!imageFile) return;
      event.preventDefault();
      event.stopPropagation();
      const imageMarkup = await this.createAttachmentMarkup(this.activeEditor.file, imageFile);
      if (!imageMarkup) return;
      this.appendImageMarkupToActiveEditor(imageMarkup);
      return;
    }

    const context = this.getActiveInteractionContext(true);
    if (this.isExperimentalFeatureEnabled() && context) {
      if (!context.tableId) {
        return;
      }
      if (!imageFile) {
        const clipboardHtml = this.getHtmlFromClipboardEvent(event);
        const clipboardText = this.getTextFromClipboardEvent(event);
        const matrix = this.parseClipboardHtmlMatrix(clipboardHtml) ?? this.parseClipboardMatrix(clipboardText);
        if (!matrix) return;

        event.preventDefault();
        event.stopPropagation();
        await this.pasteMatrixIntoTable(context.file, context.tableId, context.anchor, matrix);
        this.suppressDocumentPasteUntil = Date.now() + PASTE_EVENT_SUPPRESSION_MS;
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const imageMarkup = await this.createAttachmentMarkup(context.file, imageFile);
      if (!imageMarkup) return;
      await this.appendImageToCell(context.file, context.tableId, context.anchor, imageMarkup);
      this.suppressDocumentPasteUntil = Date.now() + PASTE_EVENT_SUPPRESSION_MS;
      return;
    }

    return;
  }

  private async handleClipboardPasteForSelectedCell(file: TFile, tableId: string, coord: CellCoord) {
    const imageFile = await this.readImageFromAvailableClipboard();
    if (!imageFile) {
      new Notice("当前剪贴板里没有可用图片");
      return false;
    }
    const imageMarkup = await this.createAttachmentMarkup(file, imageFile);
    if (!imageMarkup) return false;
    await this.appendImageToCell(file, tableId, coord, imageMarkup);
    return true;
  }

  private async handleClipboardContentPasteForSelectedCell(file: TFile, tableId: string, coord: CellCoord) {
    const imageFile = await this.readImageFromAvailableClipboard();
    if (imageFile) {
      const imageMarkup = await this.createAttachmentMarkup(file, imageFile);
      if (!imageMarkup) return false;
      await this.appendImageToCell(file, tableId, coord, imageMarkup);
      return true;
    }

    const clipboardText = await this.readTextFromAvailableClipboard();
    if (!clipboardText) return false;
    const matrix = this.parseClipboardMatrix(clipboardText);
    if (!matrix) return false;
    await this.pasteMatrixIntoTable(file, tableId, coord, matrix);
    return true;
  }

  private async handleClipboardContentPasteForUninitializedCell(
    file: TFile,
    parsedTable: ParsedTableBlock | null,
    coord: CellCoord
  ) {
    if (!parsedTable) return false;

    const imageFile = await this.readImageFromAvailableClipboard();
    if (imageFile) {
      const imageMarkup = await this.createAttachmentMarkup(file, imageFile);
      if (!imageMarkup) return false;
      await this.appendImageToUninitializedCell(file, parsedTable, coord, imageMarkup);
      return true;
    }

    const clipboardText = await this.readTextFromAvailableClipboard();
    if (!clipboardText) return false;
    const matrix = this.parseClipboardMatrix(clipboardText);
    if (!matrix) return false;
    await this.pasteMatrixIntoUninitializedTable(file, parsedTable, coord, matrix);
    return true;
  }

  async importOneNoteRichClipboardEvent(file: TFile, event: ClipboardEvent) {
    const html = await this.resolveOneNoteClipboardHtml(event);
    return this.importOneNoteRichContent(file, html, this.getImagesFromClipboard(event));
  }

  private async importOneNoteRichContent(file: TFile, html: string, clipboardImages: File[] = []) {
    if (!html.trim()) {
      new Notice("没有读取到 OneNote 富文本，请从 OneNote 复制后在弹窗里粘贴");
      return false;
    }

    const content = await this.buildOneNoteNativeMarkdownContent(file, html, clipboardImages);
    if (!content?.trim()) {
      new Notice("没有识别到可迁移的 OneNote 内容");
      return false;
    }

    await this.createSnapshot(file, "before-onenote-paste", []);
    await this.insertMarkdownBlockAtCursor(file, content);
    this.queueRefreshBurst();
    new Notice("已粘贴 OneNote 原生表格（无增强表格标记）");
    return true;
  }

  convertOneNoteTableToNativeMarkdown(file: TFile, table: HTMLTableElement) {
    const extracted = this.extractOneNoteTableMatrix(file, table);
    if (!extracted || extracted.rows.length === 0) return null;

    const { header, body } = this.splitOneNoteTableHeaderAndBody(extracted.rows);
    const columnCount = Math.max(header.length, ...body.map((row) => row.length), 1);
    const normalizedBody =
      columnCount === 2 && this.oneNoteTableBodyLooksLikeLabelContentRows(body)
        ? body.map((row) => this.normalizeOneNoteLabelContentRow(row, columnCount))
        : body.map((row) => this.normalizeRowCells(row, columnCount));
    const rawTable: ParsedRawTable = {
      header: this.normalizeRowCells(header, columnCount),
      divider: Array.from({ length: columnCount }, () => "---"),
      body: normalizedBody,
    };

    return this.buildOneNoteRawTable(rawTable).join("\n");
  }

  private oneNoteTableBodyLooksLikeLabelContentRows(body: string[][]) {
    if (!body.length) return false;
    const labelRows = body.filter((row) => this.looksLikeOneNoteLabelCell(row[0] ?? ""));
    return labelRows.length >= Math.max(1, Math.ceil(body.length * 0.5));
  }

  private normalizeOneNoteLabelContentRow(row: string[], columnCount: number) {
    const col0 = (row[0] ?? "").trim();
    const col1 = row.slice(1).join("<br>").trim();
    if (col1.includes("• **")) {
      return this.normalizeRowCells(row, columnCount);
    }
    if (this.looksLikeOneNoteLabelCell(col0)) {
      const block = this.flattenTwoColumnNestedTable([[col0, col1]]);
      return this.normalizeRowCells([col0, block], columnCount);
    }
    return this.normalizeRowCells(row, columnCount);
  }

  private async buildOneNoteNativeMarkdownContent(file: TFile, html: string, clipboardImages: File[] = []) {
    const container = await this.buildSanitizedOneNoteContainer(file, html, clipboardImages);
    if (!container) return null;

    const blocks: string[] = [];
    for (const child of Array.from(container.childNodes)) {
      this.appendOneNoteNodeAsNativeMarkdownBlocks(file, child, blocks);
    }

    return this.joinOneNoteMarkdownBlocks(blocks);
  }

  private appendOneNoteNodeAsNativeMarkdownBlocks(file: TFile, node: Node, blocks: string[]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) blocks.push(text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "table") {
      const markdown = this.convertOneNoteTableToNativeMarkdown(file, element as HTMLTableElement);
      if (markdown) blocks.push(markdown);
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const markdown = this.convertOneNoteListToMarkdown(file, element);
      if (markdown) blocks.push(markdown);
      return;
    }

    if (tag === "img") {
      const markdown = this.convertOneNoteImageToMarkdown(element as HTMLImageElement);
      if (markdown) blocks.push(markdown);
      return;
    }

    if (this.shouldExpandOneNoteWrapperElement(element)) {
      for (const child of Array.from(element.childNodes)) {
        this.appendOneNoteNodeAsNativeMarkdownBlocks(file, child, blocks);
      }
      return;
    }

    const markdown = this.convertOneNoteBlockElementToMarkdown(file, element);
    if (markdown) blocks.push(markdown);
  }

  private async insertMarkdownBlockAtCursor(file: TFile, block: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (view as any)?.editor;
    const normalizedBlock = block.endsWith("\n") ? block : `${block}\n`;

    if (view?.file?.path === file.path && editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() ? "\n\n" : "";
      editor.replaceRange(`${prefix}${normalizedBlock}`, cursor);
      return;
    }

    const originalContent = await this.app.vault.cachedRead(file);
    const separator = originalContent.trim().length === 0 ? "" : /\r?\n$/.test(originalContent) ? "\n" : "\n\n";
    await this.app.vault.modify(file, `${originalContent}${separator}${normalizedBlock}`);
  }

  private async insertOneNoteConvertedContentAtCursor(file: TFile, converted: OneNoteConvertedContent) {
    const normalizedContent = converted.content.endsWith("\n") ? converted.content : `${converted.content}\n`;

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    const editor = (view as any)?.editor;
    if (view?.file?.path === file.path && editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() ? "\n\n" : "";
      const preferredStartLine = cursor.line + (prefix ? 2 : 0);
      editor.replaceRange(`${prefix}${normalizedContent}`, cursor);
      const nextContent =
        typeof editor.getValue === "function" ? String(editor.getValue() ?? "") : await this.app.vault.cachedRead(file);
      await this.savePreparedTemplateTableRecords(file, converted.tableRecords, nextContent, preferredStartLine);
      return;
    }

    const originalContent = await this.app.vault.cachedRead(file);
    const separator = originalContent.trim().length === 0 ? "" : /\r?\n$/.test(originalContent) ? "\n" : "\n\n";
    const nextContent = `${originalContent}${separator}${normalizedContent}`;
    await this.app.vault.modify(file, nextContent);
    await this.savePreparedTemplateTableRecords(file, converted.tableRecords, nextContent, originalContent.split(/\r?\n/).length);
  }

  private async buildOneNoteEnhancedMarkdownContent(file: TFile, html: string, clipboardImages: File[] = []) {
    const container = await this.buildSanitizedOneNoteContainer(file, html, clipboardImages);
    if (!container) return null;

    const blocks: string[] = [];
    const tableRecords: TableRecord[] = [];
    for (const child of Array.from(container.childNodes)) {
      this.appendOneNoteNodeAsMarkdownBlocks(file, child, blocks, tableRecords);
    }

    const content = this.joinOneNoteMarkdownBlocks(blocks);
    if (!content.trim()) return null;
    return {
      content,
      tableRecords,
    } satisfies OneNoteConvertedContent;
  }

  private appendOneNoteNodeAsMarkdownBlocks(
    file: TFile,
    node: Node,
    blocks: string[],
    tableRecords: TableRecord[]
  ) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) blocks.push(text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "table") {
      const converted = this.convertOneNoteTableToEnhancedMarkdown(file, element as HTMLTableElement);
      if (!converted) return;
      blocks.push(converted.markdown);
      tableRecords.push(converted.record);
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const markdown = this.convertOneNoteListToMarkdown(file, element);
      if (markdown) blocks.push(markdown);
      return;
    }

    if (tag === "img") {
      const markdown = this.convertOneNoteImageToMarkdown(element as HTMLImageElement);
      if (markdown) blocks.push(markdown);
      return;
    }

    if (this.shouldExpandOneNoteWrapperElement(element)) {
      for (const child of Array.from(element.childNodes)) {
        this.appendOneNoteNodeAsMarkdownBlocks(file, child, blocks, tableRecords);
      }
      return;
    }

    const markdown = this.convertOneNoteBlockElementToMarkdown(file, element);
    if (markdown) blocks.push(markdown);
  }

  private shouldExpandOneNoteWrapperElement(element: HTMLElement) {
    const tag = element.tagName.toLowerCase();
    if (tag !== "div" && tag !== "span") return false;
    return Array.from(element.children).some((child) => {
      const childTag = child.tagName.toLowerCase();
      return ["table", "div", "p", "ul", "ol", "img", "h1", "h2", "h3", "h4", "h5", "h6"].includes(childTag);
    });
  }

  private joinOneNoteMarkdownBlocks(blocks: string[]) {
    return blocks
      .map((block) => block.trim())
      .filter((block) => block.length > 0)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n");
  }

  private convertOneNoteBlockElementToMarkdown(file: TFile, element: HTMLElement) {
    const tag = element.tagName.toLowerCase();
    if (tag === "pre") {
      const text = (element.textContent ?? "").trim();
      return text ? `\`\`\`\n${text}\n\`\`\`` : "";
    }

    const text = this.serializeOneNoteInlineContent(file, Array.from(element.childNodes), false).trim();
    if (!text) return "";

    if (/^h[1-6]$/.test(tag)) {
      const level = Number.parseInt(tag.slice(1), 10);
      return `${"#".repeat(Math.max(1, Math.min(6, level)))} ${text}`;
    }

    if (tag === "blockquote") {
      return text
        .split("\n")
        .map((line) => `> ${line}`.trimEnd())
        .join("\n");
    }

    return text;
  }

  private convertOneNoteListToMarkdown(file: TFile, element: HTMLElement) {
    const ordered = element.tagName.toLowerCase() === "ol";
    const items = Array.from(element.children)
      .filter((child) => child.tagName.toLowerCase() === "li")
      .map((item, index) => {
        const content = this.serializeOneNoteInlineContent(file, Array.from(item.childNodes), false).trim();
        if (!content) return "";
        return ordered ? `${index + 1}. ${content}` : `- ${content}`;
      })
      .filter((item) => item.length > 0);
    return items.join("\n");
  }

  private convertOneNoteImageToMarkdown(image: HTMLImageElement) {
    const src =
      image.dataset.mdtpSrc?.trim() ||
      image.getAttribute("data-mdtp-src")?.trim() ||
      image.getAttribute("data-asset-path")?.trim() ||
      image.getAttribute("src")?.trim() ||
      "";
    if (!src) return "";
    return `![[${src}]]`;
  }

  private serializeOneNoteInlineContent(file: TFile, nodes: Node[], forCell: boolean): string {
    const parts: string[] = [];
    for (const node of nodes) {
      const value = this.serializeOneNoteInlineNode(file, node, forCell);
      if (!value) continue;
      parts.push(value);
    }

    let joined = parts
      .join("")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ");
    joined = this.collapseOneNoteMarkdownMarks(joined);
    return forCell ? joined.replace(/\n/g, "<br>").trim() : joined.trim();
  }

  /** 合并相邻 ** 段、去掉 OneNote 多 span 造成的星号连击 */
  private collapseOneNoteMarkdownMarks(text: string) {
    let out = text;
    out = out.replace(/\*\*\s*\*\*/g, "");
    while (/\*\*([^*]+)\*\*\*\*([^*]+)\*\*/.test(out)) {
      out = out.replace(/\*\*([^*]+)\*\*\*\*([^*]+)\*\*/g, "**$1$2**");
    }
    out = out.replace(/\*\*(\*\*[^*]+\*\*)\*\*/g, "$1");
    out = out.replace(/\*{3,}([^*]+)\*{3,}/g, "**$1**");
    return out;
  }

  private innerAlreadyWrappedInBold(inner: string) {
    const trimmed = inner.trim();
    if (!trimmed.startsWith("**") || !trimmed.endsWith("**")) return false;
    const markers = trimmed.match(/\*\*/g);
    return (markers?.length ?? 0) === 2;
  }

  private serializeOneNoteInlineNode(file: TFile, node: Node, forCell: boolean): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? "").replace(/\u00a0/g, " ");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "br") return "\n";
    if (tag === "img") return this.convertOneNoteImageToMarkdown(element as HTMLImageElement);
    if (tag === "table") return this.serializeNestedOneNoteTable(file, element as HTMLTableElement);
    if (tag === "ul" || tag === "ol") {
      const listMarkdown = this.convertOneNoteListToMarkdown(file, element);
      return forCell ? listMarkdown.replace(/\n/g, "<br>") : listMarkdown;
    }

    const inner = this.serializeOneNoteInlineContent(file, Array.from(element.childNodes), false);
    if (!inner) return "";

    if (tag === "a") {
      const href = element.getAttribute("href")?.trim() ?? "";
      return href ? `[${inner}](${href})` : inner;
    }
    if (tag === "strong" || tag === "b") {
      return this.innerAlreadyWrappedInBold(inner) ? inner : `**${inner}**`;
    }
    if (tag === "em" || tag === "i") {
      const t = inner.trim();
      if (t.startsWith("*") && t.endsWith("*") && !t.startsWith("**")) return inner;
      return `*${inner}*`;
    }
    if (tag === "code") return `\`${inner.replace(/`/g, "")}\``;
    if (tag === "u") return inner;
    if (tag === "s" || tag === "strike") return `~~${inner}~~`;

    if (tag === "span" || tag === "p" || tag === "div") {
      const styled = this.applyOneNoteInlineStyleMarks(element, inner);
      if (tag === "p" || tag === "div") return styled ? `${styled}\n` : "";
      return styled;
    }

    return inner;
  }

  /** OneNote 剪贴板常用 span style 加粗/斜体，需转成 Markdown 才能在 Obsidian 里显示 */
  private applyOneNoteInlineStyleMarks(element: HTMLElement, inner: string) {
    if (!inner) return inner;
    if (this.innerAlreadyWrappedInBold(inner)) return inner;
    const styles = this.readOneNoteStyleMap(element);
    let out = inner;

    const weight = styles["font-weight"]?.trim().toLowerCase() ?? "";
    const weightNum = Number.parseInt(weight, 10);
    if (
      weight === "bold" ||
      weight === "bolder" ||
      (Number.isFinite(weightNum) && weightNum >= 600)
    ) {
      out = this.innerAlreadyWrappedInBold(out) ? out : `**${out}**`;
    }

    const fontStyle = styles["font-style"]?.trim().toLowerCase() ?? "";
    if (fontStyle === "italic" || fontStyle === "oblique") {
      const t = out.trim();
      if (!(t.startsWith("*") && t.endsWith("*") && !t.startsWith("**"))) {
        out = `*${out}*`;
      }
    }

    const decoration = styles["text-decoration"]?.toLowerCase() ?? "";
    if (decoration.includes("line-through")) {
      out = `~~${out}~~`;
    }

    return out;
  }

  private serializeNestedOneNoteTable(file: TFile, table: HTMLTableElement) {
    const matrix = this.extractOneNoteTableMatrix(file, table);
    if (!matrix || matrix.rows.length === 0) return "";

    const rows = matrix.rows.map((row) =>
      row.map((cell) => this.normalizeOneNoteMarkdownTableCell(cell))
    );
    return this.flattenNestedTableToText(rows);
  }

  private stripOneNoteCellPlainText(cell: string) {
    return cell.replace(/<br>/gi, " ").replace(/\*\*/g, "").trim();
  }

  private isOneNoteNumericIndexCell(text: string) {
    const plain = this.stripOneNoteCellPlainText(text);
    return /^\d+[.、．]?$/.test(plain) || /^[①②③④⑤⑥⑦⑧⑨⑩][.、．]?$/.test(plain);
  }

  private looksLikeOneNoteLabelCell(text: string) {
    const plain = this.stripOneNoteCellPlainText(text);
    if (!plain) return false;
    if (plain.length > 48) return false;
    if (this.isOneNoteNumericIndexCell(plain)) return false;
    if (/^\d+[.、．]\s/.test(plain)) return false;
    return true;
  }

  private maybeBoldShortHeading(text: string) {
    const plain = this.stripOneNoteCellPlainText(text);
    if (!plain || plain.length > 24) return text;
    if (this.innerAlreadyWrappedInBold(text)) return text;
    if (/^[一二三四五六七八九十]+[、．.]/.test(plain)) return `**${plain}**`;
    if (plain.includes("（") || plain.includes("(")) {
      return text.replace(/^([^（(]+)/, "**$1**");
    }
    return text;
  }

  private formatNestedCellBody(value: string) {
    const lines = this.parseOneNoteNumberedLines(value, { keepSubBullets: true });
    if (lines.length === 0) return value;
    if (lines.length === 1 && !value.includes("<br>")) return lines[0];
    return this.formatOneNoteNumberedBlock(lines);
  }

  private flattenNestedTableToText(rows: string[][]) {
    if (!rows.length) return "";
    const columnCount = Math.max(...rows.map((row) => row.length), 1);
    const normalized = rows.map((row) => {
      const cells = [...row];
      while (cells.length < columnCount) cells.push("");
      return cells.map((cell) => this.normalizeOneNoteMarkdownTableCell(cell));
    });

    if (columnCount === 1) {
      return normalized.map((row) => row[0]).filter((cell) => cell.length > 0).join("<br>");
    }
    if (columnCount === 2) {
      return this.flattenTwoColumnNestedTable(normalized);
    }
    return this.flattenMultiColumnNestedTable(normalized);
  }

  private flattenTwoColumnNestedTable(rows: string[][]) {
    const blocks: string[] = [];
    let activeLabel = "";
    let activeLines: string[] = [];

    const flushLabelBlock = () => {
      if (!activeLabel && activeLines.length === 0) return;
      const body = activeLines.length > 0 ? this.formatNestedCellBody(activeLines.join("<br>")) : "";
      const label = this.collapseOneNoteMarkdownMarks(activeLabel);
      if (activeLabel) {
        blocks.push(body ? `• **${label}**：${body.includes("<br>") ? `<br>${body}` : body}` : `• **${label}**：`);
      } else {
        blocks.push(...activeLines);
      }
      activeLabel = "";
      activeLines = [];
    };

    const appendToLastBlock = (line: string) => {
      if (!line) return;
      if (blocks.length === 0) {
        blocks.push(line);
        return;
      }
      blocks[blocks.length - 1] = `${blocks[blocks.length - 1]}<br>${line}`;
    };

    for (const row of rows) {
      const col0 = (row[0] ?? "").trim();
      const col1 = (row[1] ?? "").trim();

      if (!col0 && !col1) continue;

      if (!col0 && col1) {
        const cont = this.parseOneNoteNumberedLines(col1, { keepSubBullets: true });
        if (activeLabel) {
          activeLines.push(...cont);
        } else if (cont.length > 0) {
          appendToLastBlock(this.formatOneNoteNumberedBlock(cont));
        }
        continue;
      }

      if (this.isOneNoteNumericIndexCell(col0)) {
        flushLabelBlock();
        const idx = this.stripOneNoteCellPlainText(col0).replace(/[.、．]$/, "");
        blocks.push(`　${idx}. ${col1}`);
        continue;
      }

      if (this.looksLikeOneNoteLabelCell(col0)) {
        flushLabelBlock();
        activeLabel = col0.replace(/\*\*/g, "").trim();
        if (col1) activeLines.push(...this.parseOneNoteNumberedLines(col1, { keepSubBullets: true }));
        continue;
      }

      flushLabelBlock();
      if (col0 && col1) {
        const left = this.maybeBoldShortHeading(col0);
        blocks.push(`${left}：${col1}`);
      } else if (col0) {
        blocks.push(this.maybeBoldShortHeading(col0));
      } else if (col1) {
        blocks.push(col1);
      }
    }

    flushLabelBlock();
    return this.collapseOneNoteMarkdownMarks(blocks.join("<br>"));
  }

  private flattenMultiColumnNestedTable(rows: string[][]) {
    let start = 0;
    if (rows.length > 1 && this.oneNoteFirstRowLooksLikeHeader(rows)) {
      start = 1;
    }

    const blocks: string[] = [];
    let groupKey = "";

    for (let i = start; i < rows.length; i += 1) {
      const row = rows[i];
      const col0 = (row[0] ?? "").trim();
      const rest = row.slice(1).map((c) => c.trim()).filter((c) => c.length > 0);

      if (col0) {
        groupKey = col0;
        const heading = this.maybeBoldShortHeading(col0);
        if (rest.length === 0) {
          blocks.push(heading);
          continue;
        }
        blocks.push(heading);
        blocks.push(this.formatMultiColumnNestedRow(rest, false));
        continue;
      }

      if (!col0 && rest.length > 0) {
        blocks.push(this.formatMultiColumnNestedRow(rest, true));
        continue;
      }

      if (groupKey && rest.length === 0) continue;
      const all = row.map((c) => c.trim()).filter((c) => c.length > 0);
      if (all.length > 0) {
        blocks.push(all.join(" · "));
      }
    }

    return this.collapseOneNoteMarkdownMarks(blocks.join("<br>"));
  }

  private formatMultiColumnNestedRow(cells: string[], indent: boolean) {
    const prefix = indent ? "　　" : "　";
    if (cells.length === 1) return `${prefix}${cells[0]}`;
    return cells.map((cell, index) => `${prefix}${index + 1}. ${cell}`).join("<br>");
  }

  private parseOneNoteNumberedLines(value: string, options?: { keepSubBullets?: boolean }) {
    const lines: string[] = [];
    for (const part of value.split(/<br>|\n/gi)) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const isNumbered = /^\d+[.、．]\s*/.test(trimmed);
      const isSubBullet = /^[·•\-]\s*/.test(trimmed);
      if (options?.keepSubBullets && (isSubBullet || (!isNumbered && lines.length > 0))) {
        lines.push(`　　${trimmed.replace(/^[·•\-]\s*/, "· ")}`);
        continue;
      }
      lines.push(trimmed.replace(/^\d+[.、．]\s*/, "").trim());
    }
    return lines.filter((line) => line.length > 0);
  }

  private formatOneNoteNumberedBlock(lines: string[]) {
    let index = 0;
    return lines
      .map((line) => {
        if (line.startsWith("　　")) return line;
        index += 1;
        return `　${index}. ${line}`;
      })
      .join("<br>");
  }

  private oneNoteFirstRowLooksLikeHeader(rows: string[][]) {
    const first = rows[0];
    if (!first?.length) return false;

    const firstPlain = first.map((cell) => this.stripOneNoteCellPlainText(cell));
    if (firstPlain.some((cell) => !cell)) return false;
    if (!firstPlain.every((cell) => cell.length <= 16)) return false;
    if (firstPlain.some((cell) => this.isOneNoteNumericIndexCell(cell))) return false;

    if (rows.length < 2) return true;

    const body = rows.slice(1);
    const bodyFirstNumeric = body.filter((row) => this.isOneNoteNumericIndexCell(row[0] ?? "")).length;
    if (bodyFirstNumeric >= Math.max(1, Math.floor(body.length * 0.25))) return true;

    const headerLen = firstPlain.reduce((sum, cell) => sum + cell.length, 0) / firstPlain.length;
    const bodyLen =
      body.reduce((sum, row) => sum + this.stripOneNoteCellPlainText(row[0] ?? "").length, 0) /
      Math.max(body.length, 1);
    return bodyLen > headerLen * 1.4;
  }

  private oneNoteTableLooksHeaderless(rows: string[][]) {
    if (rows.length <= 1) return true;
    return !this.oneNoteFirstRowLooksLikeHeader(rows);
  }

  private splitOneNoteTableHeaderAndBody(rows: string[][]) {
    if (this.oneNoteTableLooksHeaderless(rows)) {
      const columnCount = Math.max(...rows.map((row) => row.length), 1);
      const header =
        columnCount <= 2
          ? ["项目", "内容"].slice(0, columnCount)
          : Array.from({ length: columnCount }, (_, index) => `列${index + 1}`);
      return { header: this.normalizeRowCells(header, columnCount), body: rows };
    }
    const [headerRow, ...bodyRows] = rows;
    return {
      header: headerRow,
      body: bodyRows,
    };
  }

  private convertOneNoteTableToEnhancedMarkdown(file: TFile, table: HTMLTableElement): OneNoteTableConversion | null {
    const extracted = this.extractOneNoteTableMatrix(file, table);
    if (!extracted || extracted.rows.length === 0) return null;

    const { header: headerRow, body: bodyRows } = this.splitOneNoteTableHeaderAndBody(extracted.rows);
    const rawTable: ParsedRawTable = {
      header: headerRow,
      divider: Array(headerRow.length).fill("---"),
      body: bodyRows,
    };

    const tableId = this.generateTableId();
    const markdown = this.buildOneNoteRawTable(rawTable).join("\n");
    const now = Date.now();
    return {
      markdown,
      record: {
        tableId,
        mode: "nativeLayout",
        markerless: true,
        filePath: file.path,
        createdAt: now,
        updatedAt: now,
        lastKnownHash: "",
        lastKnownRange: { startLine: 0, endLine: 0 },
        layout: extracted.layout,
      },
    };
  }

  private extractOneNoteTableMatrix(file: TFile, table: HTMLTableElement) {
    const rowElements = this.getDirectOneNoteTableRows(table);
    if (rowElements.length === 0) return null;

    const rows: string[][] = [];
    const occupied = new Map<number, Set<number>>();
    const layout = this.createEmptyLayout();

    rowElements.forEach((row, rowIndex) => {
      rows[rowIndex] = rows[rowIndex] ?? [];
      let colIndex = 0;
      const occupiedCols = occupied.get(rowIndex) ?? new Set<number>();
      this.applyOneNoteRowLayout(row, rowIndex, layout);

      for (const cell of Array.from(row.children).filter((child) => /^(td|th)$/i.test(child.tagName)) as HTMLElement[]) {
        while (occupiedCols.has(colIndex)) {
          colIndex += 1;
        }

        const rowspan = this.readPositiveIntegerAttribute(cell, "rowspan");
        const colspan = this.readPositiveIntegerAttribute(cell, "colspan");
        const value = this.extractOneNoteCellMarkdownValue(file, cell);
        rows[rowIndex][colIndex] = value;

        this.applyOneNoteCellLayout(cell, rowIndex, colIndex, rowspan, colspan, layout);

        const imageWidth = this.extractPreferredImageWidthFromCell(cell);
        if (imageWidth) {
          layout.cellImageWidths[this.getCellKey({ row: rowIndex, col: colIndex })] = imageWidth;
        }

        if (rowspan > 1 || colspan > 1) {
          layout.merges.push({ row: rowIndex, col: colIndex, rowspan, colspan });
        }

        for (let rowOffset = 0; rowOffset < rowspan; rowOffset += 1) {
          const nextRowIndex = rowIndex + rowOffset;
          const targetOccupied = occupied.get(nextRowIndex) ?? new Set<number>();
          occupied.set(nextRowIndex, targetOccupied);
          rows[nextRowIndex] = rows[nextRowIndex] ?? [];
          for (let colOffset = 0; colOffset < colspan; colOffset += 1) {
            const nextColIndex = colIndex + colOffset;
            if (rowOffset === 0 && colOffset === 0) continue;
            targetOccupied.add(nextColIndex);
            if (rows[nextRowIndex][nextColIndex] == null) {
              rows[nextRowIndex][nextColIndex] = "";
            }
          }
        }

        colIndex += colspan;
      }
    });

    const columnCount = Math.max(...rows.map((row) => row.length), 0);
    const normalizedRows = rows.map((row) => this.normalizeRowCells(row, columnCount));
    return {
      rows: normalizedRows,
      layout,
    };
  }

  private applyOneNoteRowLayout(row: HTMLElement, rowIndex: number, layout: TableLayoutMetadata) {
    const styles = this.readOneNoteStyleMap(row);
    const height = this.readOneNoteLengthPx(styles.height);
    if (height) {
      layout.rowHeights[String(rowIndex)] = Math.max(layout.rowHeights[String(rowIndex)] ?? 0, height);
    }

    const background = this.readOneNoteBackgroundColor(styles);
    if (background) {
      layout.rowColors[String(rowIndex)] = background;
    }
  }

  private applyOneNoteCellLayout(
    cell: HTMLElement,
    rowIndex: number,
    colIndex: number,
    rowspan: number,
    colspan: number,
    layout: TableLayoutMetadata
  ) {
    const styles = this.readOneNoteStyleMap(cell);
    const cellKey = this.getCellKey({ row: rowIndex, col: colIndex });

    const width = this.readOneNoteLengthPx(styles.width);
    if (width) {
      const perColumnWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(width / Math.max(1, colspan)));
      for (let offset = 0; offset < colspan; offset += 1) {
        const key = String(colIndex + offset);
        layout.colWidths[key] = Math.max(layout.colWidths[key] ?? 0, perColumnWidth);
      }
    }

    const height = this.readOneNoteLengthPx(styles.height);
    if (height) {
      const perRowHeight = Math.max(MIN_ROW_HEIGHT, Math.round(height / Math.max(1, rowspan)));
      for (let offset = 0; offset < rowspan; offset += 1) {
        const key = String(rowIndex + offset);
        layout.rowHeights[key] = Math.max(layout.rowHeights[key] ?? 0, perRowHeight);
      }
    }

    const background = this.readOneNoteBackgroundColor(styles);
    if (background) {
      layout.cellColors[cellKey] = background;
    }

    const alignment = this.readOneNoteTextAlign(styles);
    if (alignment) {
      layout.cellAlignments[cellKey] = alignment;
    }
  }

  private readOneNoteStyleMap(element: HTMLElement) {
    const result: Record<string, string> = {};
    const raw = element.getAttribute("style") ?? "";
    for (const declaration of raw.split(";")) {
      const [rawName, ...rawValueParts] = declaration.split(":");
      const name = rawName?.trim().toLowerCase();
      const value = rawValueParts.join(":").trim();
      if (!name || !value) continue;
      result[name] = value;
    }
    return result;
  }

  private readOneNoteLengthPx(value: string | undefined) {
    if (!value) return undefined;
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(px|pt|in|cm|mm)?$/i);
    if (!match) return undefined;

    const amount = Number.parseFloat(match[1] ?? "");
    if (!Number.isFinite(amount) || amount <= 0) return undefined;

    const unit = (match[2] ?? "px").toLowerCase();
    const px =
      unit === "in"
        ? amount * 96
        : unit === "pt"
          ? amount * (96 / 72)
          : unit === "cm"
            ? amount * (96 / 2.54)
            : unit === "mm"
              ? amount * (96 / 25.4)
              : amount;
    const rounded = Math.round(px);
    return Number.isFinite(rounded) && rounded > 0 ? rounded : undefined;
  }

  private readOneNoteBackgroundColor(styles: Record<string, string>) {
    const value = styles["background-color"] ?? styles.background;
    if (!value) return "";
    const normalized = value.trim();
    if (!normalized || /url\s*\(/i.test(normalized)) return "";
    if (/^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized;
    if (/^rgba?\([\d\s,%.]+\)$/i.test(normalized)) return normalized;
    if (/^[a-z]+$/i.test(normalized)) return normalized.toLowerCase();
    return "";
  }

  private readOneNoteTextAlign(styles: Record<string, string>) {
    const value = (styles["text-align"] ?? "").trim().toLowerCase();
    return value === "center" || value === "right" || value === "left" ? value : undefined;
  }

  private getDirectOneNoteTableRows(table: HTMLTableElement) {
    const rows: HTMLTableRowElement[] = [];
    for (const child of Array.from(table.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "tr") {
        rows.push(child as HTMLTableRowElement);
        continue;
      }
      if (tag === "thead" || tag === "tbody" || tag === "tfoot") {
        rows.push(
          ...Array.from(child.children).filter((row) => row.tagName.toLowerCase() === "tr") as HTMLTableRowElement[]
        );
      }
    }
    return rows;
  }

  private extractOneNoteCellMarkdownValue(file: TFile, cell: HTMLElement) {
    const value = this.serializeOneNoteInlineContent(file, Array.from(cell.childNodes), true);
    if (value.trim()) return value;

    const fallback = this.normalizeOneNotePlainTextFallback(
      (cell as HTMLElement & { innerText?: string }).innerText ?? cell.textContent ?? ""
    );
    return fallback.replace(/\n/g, "<br>");
  }

  private normalizeOneNotePlainTextFallback(value: string) {
    return value
      .replace(/\u00a0/g, " ")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private readPositiveIntegerAttribute(element: HTMLElement, attribute: string) {
    const value = Number.parseInt(element.getAttribute(attribute) ?? "", 10);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  private extractPreferredImageWidthFromCell(cell: HTMLElement) {
    const image = cell.querySelector("img");
    if (!image || typeof image.getAttribute !== "function") return undefined;

    const widthAttr = Number.parseInt(image.getAttribute("width") ?? "", 10);
    if (Number.isFinite(widthAttr) && widthAttr >= 40 && widthAttr <= 2000) {
      return widthAttr;
    }

    const styleWidthMatch = (image.getAttribute("style") ?? "").match(/width:\s*(\d{2,4})px/i);
    if (styleWidthMatch) {
      const width = Number.parseInt(styleWidthMatch[1] ?? "", 10);
      if (Number.isFinite(width) && width >= 40 && width <= 2000) {
        return width;
      }
    }

    return undefined;
  }

  private async buildSanitizedOneNoteContainer(file: TFile, html: string, clipboardImages: File[] = []) {
    if (typeof DOMParser === "undefined") return null;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const container = document.createElement("div");
    for (const child of Array.from(doc.body.childNodes)) {
      const clean = this.sanitizeOneNoteNode(child);
      if (clean) container.appendChild(clean);
    }

    this.markOneNoteRichTables(container);
    await this.localizeOneNoteRichImages(file, container, clipboardImages);
    this.removeEmptyOneNoteArtifacts(container);
    return container.textContent?.trim() || container.querySelector("table, img, a") ? container : null;
  }

  private sanitizeOneNoteNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? "";
      return value.trim() ? document.createTextNode(value) : null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const blockedTags = new Set(["script", "style", "meta", "link", "iframe", "object", "embed", "svg", "canvas"]);
    if (blockedTags.has(tag)) return null;

    const allowedTags = new Set([
      "a",
      "b",
      "blockquote",
      "br",
      "code",
      "col",
      "colgroup",
      "div",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "i",
      "img",
      "li",
      "ol",
      "p",
      "pre",
      "s",
      "span",
      "strike",
      "strong",
      "sub",
      "sup",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr",
      "u",
      "ul",
    ]);

    if (!allowedTags.has(tag)) {
      const fragment = document.createDocumentFragment();
      for (const child of Array.from(element.childNodes)) {
        const clean = this.sanitizeOneNoteNode(child);
        if (clean) fragment.appendChild(clean);
      }
      return fragment.childNodes.length > 0 ? fragment : null;
    }

    const clean = document.createElement(tag);
    this.copyAllowedOneNoteAttributes(element, clean, tag);

    if (tag === "br" || tag === "img" || tag === "col") {
      return clean;
    }

    for (const child of Array.from(element.childNodes)) {
      const cleanChild = this.sanitizeOneNoteNode(child);
      if (cleanChild) clean.appendChild(cleanChild);
    }
    return clean.childNodes.length > 0 || tag === "table" ? clean : null;
  }

  private copyAllowedOneNoteAttributes(source: HTMLElement, target: HTMLElement, tag: string) {
    const style = this.sanitizeOneNoteStyleAttribute(source.getAttribute("style") ?? "");
    if (style) target.setAttribute("style", style);

    const title = source.getAttribute("title")?.trim();
    if (title) target.setAttribute("title", title);

    if (tag === "a") {
      const href = this.sanitizeOneNoteUrl(source.getAttribute("href") ?? "", false);
      if (href) target.setAttribute("href", href);
      return;
    }

    if (tag === "img") {
      const src = this.sanitizeOneNoteUrl(source.getAttribute("src") ?? "", true);
      if (src) target.setAttribute("src", src);
      const assetPath = source.getAttribute("data-asset-path")?.trim();
      if (assetPath && !/[<>]/.test(assetPath)) {
        target.setAttribute("data-asset-path", assetPath);
      }
      const alt = source.getAttribute("alt")?.trim();
      if (alt) target.setAttribute("alt", alt);
      for (const attr of ["width", "height"]) {
        const value = source.getAttribute(attr)?.trim();
        if (value && /^\d{1,5}$/.test(value)) target.setAttribute(attr, value);
      }
      target.setAttribute("loading", "lazy");
      return;
    }

    if (tag === "td" || tag === "th") {
      for (const attr of ["colspan", "rowspan"]) {
        const value = source.getAttribute(attr)?.trim();
        if (value && /^\d{1,3}$/.test(value)) target.setAttribute(attr, value);
      }
    }

    if (tag === "ol") {
      const start = source.getAttribute("start")?.trim();
      if (start && /^\d{1,4}$/.test(start)) target.setAttribute("start", start);
    }
  }

  private sanitizeOneNoteUrl(value: string, allowImageData: boolean) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (allowImageData && /^data:image\//i.test(trimmed)) return trimmed;
    if (/^\s*javascript:/i.test(trimmed)) return "";
    if (/^\s*data:/i.test(trimmed)) return "";
    if (/^(https?:|mailto:|obsidian:|onenote:|file:|app:|blob:|cid:)/i.test(trimmed)) return trimmed;
    if (/^[./#]|^[^:]+$/i.test(trimmed)) return trimmed;
    return "";
  }

  private sanitizeOneNoteStyleAttribute(value: string) {
    if (!value.trim()) return "";
    const allowed = new Set([
      "background-color",
      "border",
      "border-bottom",
      "border-collapse",
      "border-left",
      "border-right",
      "border-top",
      "color",
      "font-style",
      "font-weight",
      "height",
      "list-style-type",
      "margin-left",
      "padding-left",
      "text-align",
      "text-decoration",
      "vertical-align",
      "white-space",
      "width",
    ]);

    const declarations: string[] = [];
    for (const part of value.split(";")) {
      const [rawName, ...rawValueParts] = part.split(":");
      const name = rawName?.trim().toLowerCase();
      const rawValue = rawValueParts.join(":").trim();
      if (!name || !rawValue || !allowed.has(name)) continue;
      if (/url\s*\(|expression\s*\(|javascript:/i.test(rawValue)) continue;
      declarations.push(`${name}: ${rawValue}`);
    }
    return declarations.join("; ");
  }

  private markOneNoteRichTables(container: HTMLElement) {
    for (const table of Array.from(container.querySelectorAll("table"))) {
      table.classList.add("mdtp-onenote-table");
    }
  }

  private removeEmptyOneNoteArtifacts(container: HTMLElement) {
    for (const element of Array.from(container.querySelectorAll("span, div, p"))) {
      if (element.childNodes.length > 0) continue;
      if ((element.textContent ?? "").trim()) continue;
      element.remove();
    }
  }

  private async localizeOneNoteRichImages(file: TFile, container: HTMLElement, clipboardImages: File[]) {
    const images = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
    let clipboardIndex = 0;

    for (const image of images) {
      const src = image.getAttribute("src") ?? "";
      const assetPath = image.getAttribute("data-asset-path")?.trim() ?? "";
      if (assetPath) {
        image.setAttribute("data-mdtp-src", assetPath);
        image.removeAttribute("srcset");
        image.setAttribute("loading", "lazy");
        continue;
      }

      let imageFile = await this.resolveOneNoteImageSource(src);
      if (!imageFile && this.shouldUseClipboardImageForOneNoteSource(src) && clipboardIndex < clipboardImages.length) {
        imageFile = clipboardImages[clipboardIndex];
        clipboardIndex += 1;
      }

      if (imageFile) {
        try {
          const savedPath = await this.saveClipboardImage(file, imageFile);
          image.setAttribute("src", savedPath);
          image.setAttribute("data-mdtp-src", savedPath);
        } catch (error) {
          console.error("[mdtp] failed to localize OneNote image", error);
        }
      }

      image.removeAttribute("srcset");
      image.setAttribute("loading", "lazy");
    }
  }

  private shouldUseClipboardImageForOneNoteSource(src: string) {
    const trimmed = src.trim();
    return !trimmed || /^(cid:|blob:|file:|data:image\/)/i.test(trimmed);
  }

  private async resolveOneNoteImageSource(src: string) {
    const trimmed = src.trim();
    if (!trimmed) return null;
    if (/^data:image\//i.test(trimmed)) {
      return this.fileFromDataUrl(trimmed);
    }
    if (/^file:/i.test(trimmed) || /^\/.+\.(png|jpe?g|gif|webp|bmp|tiff?|heic)$/i.test(trimmed)) {
      return this.fileFromLocalImagePath(trimmed);
    }
    return null;
  }

  private fileFromDataUrl(dataUrl: string) {
    const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/i);
    if (!match) return null;
    const mimeType = match[1] || "image/png";
    const binary = atob(match[2] || "");
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new File([bytes], this.getPastedImageFileName(this.getImageExtension(mimeType)), { type: mimeType });
  }

  private fileFromLocalImagePath(src: string) {
    try {
      const nodeRequire = typeof window !== "undefined" ? (window as any).require : null;
      const fs = nodeRequire?.("node:fs") ?? nodeRequire?.("fs");
      const pathApi = nodeRequire?.("node:path") ?? nodeRequire?.("path");
      if (!fs || !pathApi) return null;

      const filePath = /^file:/i.test(src) ? decodeURIComponent(new URL(src).pathname) : src;
      const buffer = fs.readFileSync(filePath);
      if (!buffer?.length) return null;
      const fileName = pathApi.basename(filePath) || this.getPastedImageFileName("png");
      const mimeType = this.getImageMimeTypeFromPath(filePath);
      return new File([new Uint8Array(buffer)], fileName, { type: mimeType });
    } catch (error) {
      console.error("[mdtp] failed to read OneNote local image", error);
      return null;
    }
  }

  private getImageMimeTypeFromPath(filePath: string) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".bmp")) return "image/bmp";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    return "image/png";
  }

  private getImageFromClipboard(event: ClipboardEvent) {
    return this.getImagesFromClipboard(event)[0] ?? null;
  }

  private getImagesFromClipboard(event: ClipboardEvent) {
    const files: File[] = [];
    const items = Array.from(event.clipboardData?.items ?? []);
    for (const item of items) {
      if (!item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
    for (const file of Array.from(event.clipboardData?.files ?? [])) {
      if (!file.type.startsWith("image/")) continue;
      if (files.includes(file)) continue;
      files.push(file);
    }
    return files;
  }

  private async readImageFromAvailableClipboard(event?: ClipboardEvent) {
    const eventImage = event ? this.getImageFromClipboard(event) : null;
    if (eventImage) return eventImage;

    const electronImage = this.readImageFromElectronClipboard();
    if (electronImage) return electronImage;

    const systemImage = this.readImageFromSystemClipboardViaPython();
    if (systemImage) return systemImage;

    return this.readImageFromNavigatorClipboard();
  }

  private insertTextIntoTextarea(textarea: HTMLTextAreaElement, text: string) {
    if (this.isExperimentalFeatureEnabled() && this.isImageMarkupFragment(text)) {
      this.insertImageMarkupIntoTextarea(textarea, text.trim());
      return;
    }
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const prefix = textarea.value.slice(0, start);
    const suffix = textarea.value.slice(end);
    textarea.value = `${prefix}${text}${suffix}`;
    const nextCursor = start + text.length;
    textarea.selectionStart = nextCursor;
    textarea.selectionEnd = nextCursor;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private toggleTextareaBold(textarea: HTMLTextAreaElement) {
    const value = textarea.value;
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? start;

    if (start !== end) {
      const selected = value.slice(start, end);
      const before = value.slice(Math.max(0, start - 2), start);
      const after = value.slice(end, end + 2);

      if (before === "**" && after === "**") {
        textarea.value = `${value.slice(0, start - 2)}${selected}${value.slice(end + 2)}`;
        textarea.selectionStart = start - 2;
        textarea.selectionEnd = end - 2;
      } else if (selected.startsWith("**") && selected.endsWith("**") && selected.length >= 4) {
        const unwrapped = selected.slice(2, -2);
        textarea.value = `${value.slice(0, start)}${unwrapped}${value.slice(end)}`;
        textarea.selectionStart = start;
        textarea.selectionEnd = start + unwrapped.length;
      } else {
        textarea.value = `${value.slice(0, start)}**${selected}**${value.slice(end)}`;
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = end + 2;
      }
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

    textarea.value = `${value.slice(0, start)}****${value.slice(end)}`;
    const nextCursor = start + 2;
    textarea.selectionStart = nextCursor;
    textarea.selectionEnd = nextCursor;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private insertImageMarkupIntoTextarea(textarea: HTMLTextAreaElement, imageMarkup: string) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const prefix = textarea.value.slice(0, start);
    const suffix = textarea.value.slice(end);
    const leading =
      prefix.trim().length === 0 ? "" : prefix.endsWith("\n\n") ? "" : prefix.endsWith("\n") ? "\n" : "\n\n";
    const trailing =
      suffix.trim().length === 0 ? "" : suffix.startsWith("\n\n") ? "" : suffix.startsWith("\n") ? "\n" : "\n\n";
    textarea.value = `${prefix}${leading}${imageMarkup}${trailing}${suffix}`;
    const nextCursor = (prefix + leading + imageMarkup).length;
    textarea.selectionStart = nextCursor;
    textarea.selectionEnd = nextCursor;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  private appendImageMarkupToActiveEditor(imageMarkup: string) {
    if (!this.activeEditor) return;
    this.activeEditor.imageMarkups.push(imageMarkup.trim());
    this.renderInlineEditorImages(this.activeEditor);
    this.queueInlineEditorLayout(this.activeEditor);
  }

  private renderInlineEditorImages(editor: InlineEditorState) {
    const container = editor.imageContainer;
    container.replaceChildren();

    const targets = editor.imageMarkups.flatMap((markup) => this.extractImagePreviewTargets(markup, editor.file));
    if (targets.length === 0) {
      container.classList.remove("is-visible");
      return;
    }

    container.classList.add("is-visible");
    const layoutWidth = editor.tableId
      ? this.dataStore.tables[editor.tableId]?.layout.cellImageWidths[this.getCellKey(editor.coord)]
      : undefined;
    for (const target of targets) {
      const image = document.createElement("img");
      image.className = "mdtp-inline-editor-image";
      image.src = target.resourcePath;
      image.alt = target.displayPath;
      image.loading = "lazy";
      image.decoding = "async";
      image.style.width = `${Math.max(80, Math.round(layoutWidth ?? target.width ?? DEFAULT_CELL_IMAGE_WIDTH))}px`;
      image.addEventListener("load", () => this.queueInlineEditorLayout(editor), { once: true });
      image.addEventListener("error", () => this.queueInlineEditorLayout(editor), { once: true });
      container.appendChild(image);
    }
  }

  private extractImagePreviewTargets(value: string, file: TFile) {
    const targets: ImagePreviewTarget[] = [];
    const seen = new Set<string>();
    const addTarget = (rawLink: string) => {
      const resolvedTarget = this.resolveImagePreviewTarget(rawLink, file);
      if (!resolvedTarget || seen.has(resolvedTarget.displayPath)) return;

      seen.add(resolvedTarget.displayPath);
      targets.push(resolvedTarget);
    };

    const wikiPattern = /!\[\[([^[\]]+?)\]\]/g;
    for (const match of value.matchAll(wikiPattern)) {
      addTarget(match[1] ?? "");
    }

    const markdownPattern = /!\[[^\]]*]\(([^)]+)\)/g;
    for (const match of value.matchAll(markdownPattern)) {
      addTarget(match[1] ?? "");
    }

    return targets;
  }

  private splitImageMarkupForCellRender(value: string, file: TFile) {
    const segments: Array<
      | { kind: "text"; value: string }
      | { kind: "image"; raw: string; alt: string; displayPath: string; resourcePath: string; width?: number }
    > = [];
    const normalized = this.normalizeClipboardCellForPlainText(value);
    const pattern = /!\[\[([^[\]]+?)\]\]|!\[([^\]]*)]\(([^)]+)\)/g;
    let lastIndex = 0;

    for (const match of normalized.matchAll(pattern)) {
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        segments.push({ kind: "text", value: normalized.slice(lastIndex, matchIndex) });
      }

      const raw = match[0] ?? "";
      const wikiTarget = match[1];
      const markdownAlt = match[2] ?? "";
      const markdownTarget = match[3];
      const target = this.resolveImagePreviewTarget(wikiTarget ?? markdownTarget ?? "", file);
      if (target) {
        const imageSegment: Extract<(typeof segments)[number], { kind: "image" }> = {
          kind: "image",
          raw,
          alt: markdownAlt,
          displayPath: target.displayPath,
          resourcePath: target.resourcePath,
        };
        if (target.width) {
          imageSegment.width = target.width;
        }
        segments.push(imageSegment);
      } else {
        segments.push({ kind: "text", value: raw });
      }

      lastIndex = matchIndex + raw.length;
    }

    if (lastIndex < normalized.length) {
      segments.push({ kind: "text", value: normalized.slice(lastIndex) });
    }

    return segments.filter((segment) => segment.kind === "image" || segment.value.length > 0);
  }

  private resolveImagePreviewTarget(rawLink: string, file: TFile) {
    const cleaned = rawLink.trim();
    if (!cleaned) return null;
    const linkPath = cleaned.split("|")[0]?.trim().replace(/^<|>$/g, "") ?? "";
    if (!linkPath) return null;

    const resolved =
      this.app.metadataCache.getFirstLinkpathDest(linkPath, file.path) ??
      this.app.vault.getAbstractFileByPath(normalizePath(linkPath));
    if (!(resolved instanceof TFile)) return null;
    if (!/\.(png|jpe?g|gif|webp|svg|bmp|tiff?|heic)$/i.test(resolved.path)) return null;

    const target: ImagePreviewTarget = {
      displayPath: resolved.path,
      resourcePath: this.app.vault.getResourcePath(resolved),
    };
    const width = this.extractImageLinkWidth(cleaned);
    if (width) {
      target.width = width;
    }
    return target;
  }

  private extractImageLinkWidth(rawLink: string) {
    const widthPart = rawLink
      .split("|")
      .slice(1)
      .map((part) => part.trim())
      .find((part) => /^\d{2,4}(?:\s*x\s*\d{2,4})?$/i.test(part));
    if (!widthPart) return undefined;
    const width = Number.parseInt(widthPart, 10);
    if (!Number.isFinite(width) || width < 40 || width > 2000) return undefined;
    return width;
  }

  private async createAttachmentMarkup(file: TFile, imageFile: File) {
    try {
      const savedPath = await this.saveClipboardImage(file, imageFile);
      new Notice(`已粘贴图片：${savedPath.split("/").pop() ?? savedPath}`);
      return `![[${savedPath}]]`;
    } catch (error) {
      console.error("[mdtp] failed to save pasted image", error);
      new Notice("图片粘贴失败");
      return null;
    }
  }

  private async readImageFromNavigatorClipboard() {
    const clipboardAny = navigator.clipboard as any;
    if (typeof clipboardAny?.read !== "function") return null;
    try {
      const items = await clipboardAny.read();
      for (const item of items) {
        const type = Array.from(item.types ?? []).find((value: string) => value.startsWith("image/"));
        if (!type) continue;
        const blob = await item.getType(type);
        return new File([blob], this.getPastedImageFileName(this.getImageExtension(blob.type)), { type: blob.type });
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard read failed", error);
    }
    return null;
  }

  private readImageFromElectronClipboard() {
    try {
      const electron = (window as any).require?.("electron");
      const clipboard = electron?.clipboard;
      const nativeImageApi = electron?.nativeImage;
      if (!clipboard) return null;

      let nativeImage = clipboard.readImage?.();
      if ((!nativeImage || nativeImage.isEmpty?.()) && nativeImageApi?.createFromBuffer) {
        const formats = Array.from(clipboard.availableFormats?.() ?? []);
        const imageFormat = formats.find((value: string) =>
          /^image\//i.test(value) || /tiff|png|jpeg|jpg|gif|webp/i.test(value)
        );

        if (imageFormat && typeof clipboard.readBuffer === "function") {
          const rawBuffer = clipboard.readBuffer(imageFormat);
          if (rawBuffer && rawBuffer.length) {
            nativeImage = nativeImageApi.createFromBuffer(rawBuffer);
          }
        }
      }

      if (!nativeImage || nativeImage.isEmpty?.()) return null;
      const pngBuffer = nativeImage.toPNG?.();
      if (!pngBuffer || !pngBuffer.length) return null;
      return new File(
        [new Uint8Array(pngBuffer)],
        this.getPastedImageFileName("png"),
        { type: "image/png" }
      );
    } catch (error) {
      console.error("[mdtp] electron clipboard read failed", error);
      return null;
    }
  }

  private readImageFromSystemClipboardViaPython() {
    try {
      const nodeRequire = (window as any).require;
      const childProcess = nodeRequire?.("node:child_process");
      const fs = nodeRequire?.("node:fs");
      const os = nodeRequire?.("node:os");
      const path = nodeRequire?.("node:path");
      if (!childProcess || !fs || !os || !path) return null;

      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mdtp-clipboard-"));
      const outputPath = path.join(tempDir, `clipboard-${Date.now()}.png`);
      const script = `
import sys
from AppKit import NSPasteboard, NSImage, NSBitmapImageRep, NSPNGFileType

out_path = sys.argv[1]
pb = NSPasteboard.generalPasteboard()
data = pb.dataForType_("public.tiff") or pb.dataForType_("NeXT TIFF v4.0 pasteboard type")
if data is None:
    raise SystemExit(1)
image = NSImage.alloc().initWithData_(data)
if image is None:
    raise SystemExit(1)
tiff = image.TIFFRepresentation()
if tiff is None:
    raise SystemExit(1)
rep = NSBitmapImageRep.imageRepWithData_(tiff)
if rep is None:
    raise SystemExit(1)
png = rep.representationUsingType_properties_(NSPNGFileType, None)
if png is None:
    raise SystemExit(1)
with open(out_path, "wb") as handle:
    handle.write(bytes(png))
`;

      childProcess.execFileSync("python3", ["-c", script, outputPath], {
        stdio: "ignore",
      });

      if (!fs.existsSync(outputPath)) return null;
      const buffer = fs.readFileSync(outputPath);
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors for temp clipboard fallback
      }

      if (!buffer?.length) return null;
      return new File(
        [new Uint8Array(buffer)],
        this.getPastedImageFileName("png"),
        { type: "image/png" }
      );
    } catch (error) {
      console.error("[mdtp] system clipboard image read failed", error);
      return null;
    }
  }

  private async saveClipboardImage(file: TFile, imageFile: Blob) {
    const extension = this.getImageExtension(imageFile.type);
    const fileName = this.getPastedImageFileName(extension);
    const fileManager = (this.app as any).fileManager;
    let targetPath = "";
    if (typeof fileManager?.getAvailablePathForAttachment === "function") {
      targetPath = await Promise.resolve(fileManager.getAvailablePathForAttachment(fileName, file.path));
    } else {
      const attachmentFolder = await this.getAttachmentFolderPath(file);
      targetPath = await this.getAvailableVaultPath(
        normalizePath(attachmentFolder ? `${attachmentFolder}/${fileName}` : fileName)
      );
    }

    const parentPath = targetPath.split("/").slice(0, -1).join("/");
    if (parentPath) {
      await this.ensureFolderExists(parentPath);
    }

    const data = await imageFile.arrayBuffer();
    const vaultAny = this.app.vault as any;
    if (typeof vaultAny.createBinary === "function") {
      await vaultAny.createBinary(targetPath, data);
    } else {
      await (this.app.vault.adapter as any).writeBinary(targetPath, data);
    }
    return targetPath;
  }

  private async getAttachmentFolderPath(file: TFile) {
    const configPath = normalizePath(`${this.app.vault.configDir}/app.json`);
    try {
      const raw = await this.app.vault.adapter.read(configPath);
      const parsed = JSON.parse(raw);
      const configured = String(parsed?.attachmentFolderPath ?? "").trim();
      if (!configured || configured === "/") {
        return file.parent?.path ?? "";
      }
      if (configured.startsWith("./")) {
        const parent = file.parent?.path ?? "";
        return normalizePath(parent ? `${parent}/${configured.slice(2)}` : configured.slice(2));
      }
      return normalizePath(configured);
    } catch {
      return file.parent?.path ?? "";
    }
  }

  private async getAvailableVaultPath(basePath: string) {
    const adapter = this.app.vault.adapter;
    const normalized = normalizePath(basePath);
    if (!(await adapter.exists(normalized))) return normalized;
    const dotIndex = normalized.lastIndexOf(".");
    const stem = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
    const ext = dotIndex > 0 ? normalized.slice(dotIndex) : "";
    for (let index = 1; index < 5000; index += 1) {
      const candidate = `${stem} ${index}${ext}`;
      if (!(await adapter.exists(candidate))) return candidate;
    }
    throw new Error("No available attachment path");
  }

  private getImageExtension(mimeType: string) {
    if (mimeType === "image/jpeg") return "jpg";
    if (mimeType === "image/gif") return "gif";
    if (mimeType === "image/webp") return "webp";
    return "png";
  }

  private getPastedImageFileName(extension: string) {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
    return `Pasted image ${stamp}.${extension}`;
  }

  private handleTablePointerDown(event: PointerEvent, tableEl: HTMLTableElement) {
    const autoFillHandle = (event.target as HTMLElement | null)?.closest(".mdtp-autofill-handle") as HTMLElement | null;
    if (autoFillHandle) {
      const state = this.runtimeState.get(tableEl);
      const tableId = tableEl.dataset.mdtpTableId || state?.parsedTable?.tableId || "";
      if (!state || !tableId) return;

      const sourceCell = autoFillHandle.closest("th, td") as HTMLTableCellElement | null;
      const sourceCoord = sourceCell ? this.getCellCoord(sourceCell) : null;
      if (!sourceCoord) return;

      event.preventDefault();
      event.stopPropagation();
      this.activeAutoFill = {
        tableEl,
        tableId,
        file: state.file,
        sourceCoord,
        targetCoord: null,
      };
      sourceCell.classList.add("mdtp-autofill-source");
      return;
    }

    const resizeHandle = (event.target as HTMLElement | null)?.closest(".mdtp-resize-handle") as HTMLElement | null;
    if (resizeHandle) {
      const state = this.runtimeState.get(tableEl);
      const tableId = tableEl.dataset.mdtpTableId || state?.parsedTable?.tableId || "";
      if (!state || !tableId) return;

      event.preventDefault();
      event.stopPropagation();

      const index = Number.parseInt(resizeHandle.dataset.mdtpIndex ?? "-1", 10);
      const kind = resizeHandle.dataset.mdtpResizeKind;
      const structure = this.collectTableStructure(tableEl);
      if (kind === "scale") {
        const record = this.dataStore.tables[tableId];
        const scale = record?.mode === "nativeLayout" ? this.getLayoutTableScale(record.layout) : NATIVE_TABLE_DEFAULT_SCALE;
        const sizeBase = record?.mode === "nativeLayout"
          ? this.captureNativeLayoutSizeBase(tableEl, record.layout)
          : { colWidths: {}, rowHeights: {} };
        this.activeResize = {
          kind: "scale",
          tableEl,
          tableId,
          file: state.file,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startScale: scale,
          currentScale: scale,
          sizeBase,
        };
      } else if (kind === "column") {
        const width = this.getColumnWidth(structure, index);
        this.activeResize = {
          kind: "column",
          tableEl,
          tableId,
          file: state.file,
          index,
          startClient: event.clientX,
          startSize: width,
        };
      } else if (kind === "row") {
        const height = this.getRowHeight(structure, index);
        this.activeResize = {
          kind: "row",
          tableEl,
          tableId,
          file: state.file,
          index,
          startClient: event.clientY,
          startSize: height,
        };
      }
      return;
    }

    const isEnhancedTable = this.isInitializedEnhancedTable(tableEl);
    const isNativeLayoutTable = this.isNativeLayoutTable(tableEl);
    if (!isEnhancedTable && !isNativeLayoutTable) return;

    if (event.button !== 0) return;

    const cell = (event.target as HTMLElement | null)?.closest("th, td") as HTMLTableCellElement | null;
    if (!cell || !tableEl.contains(cell)) return;

    const coord = this.getCellCoord(cell);
    if (!coord) return;

    if (isNativeLayoutTable && !isEnhancedTable && !this.shouldCaptureNativeLayoutSelectionPointer(event)) {
      this.updatePassiveNativeLayoutCellContext(tableEl, coord);
      return;
    }

    event.preventDefault();
    this.clearAllEnhancedSelections(tableEl);
    const runtime = this.runtimeState.get(tableEl);
    if (!runtime) return;

    runtime.anchor = coord;
    runtime.selection = this.normalizeSelection(coord, coord);
    this.activeSelectionDrag = {
      tableEl,
      anchor: coord,
    };

    cell.tabIndex = -1;
    cell.focus({ preventScroll: true });
    this.renderSelection(tableEl, runtime.selection, runtime.anchor);
  }

  private shouldCaptureNativeLayoutSelectionPointer(event: PointerEvent) {
    // Native tables must stay zero-intrusion: normal click/double-click belongs to Obsidian editing.
    // Plugin-owned range selection is opt-in so styling tools can still target a visible range.
    return event.shiftKey || event.altKey;
  }

  private updatePassiveNativeLayoutCellContext(tableEl: HTMLTableElement, coord: CellCoord) {
    const runtime = this.runtimeState.get(tableEl);
    if (!runtime) return;
    runtime.anchor = coord;
    runtime.selection = this.normalizeSelection(coord, coord);
    this.renderSelection(tableEl, null, null);
  }

  private handleTableContextMenu(event: MouseEvent, tableEl: HTMLTableElement) {
    const runtime = this.runtimeState.get(tableEl);
    if (!runtime) return;

    const target = event.target as HTMLElement | null;
    const cell = target?.closest("th, td") as HTMLTableCellElement | null;
    const coord = cell ? this.getCellCoord(cell) : null;
    if (coord) {
      runtime.anchor = coord;
      runtime.selection = this.selectionContains(runtime.selection, coord)
        ? runtime.selection
        : this.normalizeSelection(coord, coord);
      this.renderSelection(tableEl, runtime.selection, runtime.anchor);
    }

    const menu = new Menu();
    const tableId = tableEl.dataset.mdtpTableId || runtime.parsedTable?.tableId || "";
    if (!tableId) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable);
      (menu as any).addSeparator?.();
      this.addTemplateMenuItems(menu, {
        plainTableContext: runtime.parsedTable && coord ? {
          file: runtime.file,
          parsedTable: runtime.parsedTable,
          coord,
          tableEl,
        } : null,
      });
      const view = this.getContainingMarkdownView(target);
      this.showTableContextMenu(menu, event, view, {
        parsedTable: runtime.parsedTable,
        coord,
      });
      return;
    }

    const record = this.dataStore.tables[tableId];
    if (record?.mode === "nativeLayout") {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable, tableId);
      if (coord) {
        this.addNativeLayoutRowColorMenuItems(
          menu,
          runtime.file,
          tableId,
          tableEl,
          runtime.selection ?? this.normalizeSelection(coord, coord),
          coord,
          { x: event.clientX, y: event.clientY }
        );
        (menu as any).addSeparator?.();
      }
      this.addTemplateMenuItems(menu, {
        file: runtime.file,
        tableId,
      });
      const view = this.getContainingMarkdownView(target);
      this.showTableContextMenu(menu, event, view, {
        parsedTable: runtime.parsedTable,
        coord,
      });
      return;
    }

    if (this.canConvertEnhancedRecordToNativeLayout(record)) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable, tableId);
      (menu as any).addSeparator?.();
    }

    if (coord) {
      this.addTemplateMenuItems(menu, {
        file: runtime.file,
        tableId,
        tableSelection: runtime.selection ?? this.normalizeSelection(coord, coord),
      });
    }

    const view = this.getContainingMarkdownView(target);
    this.showTableContextMenu(menu, event, view, {
      parsedTable: runtime.parsedTable,
      coord,
    });
  }

  private addNativeLayoutMenuItem(
    menu: Menu,
    file: TFile,
    parsedTable: ParsedTableBlock | null,
    tableId?: string | null
  ) {
    const effectiveTableId = tableId ?? (parsedTable ? this.resolveTableRecordIdForParsedTable(file, parsedTable) : null);
    const currentTableBeautified = this.isTableNativeLayoutBeautified(effectiveTableId);

    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_CURRENT_TABLE_LABEL);
      item.setIcon("rows-3");
      item.setDisabled(currentTableBeautified || !parsedTable);
      if (!currentTableBeautified && parsedTable) {
        item.onClick(() => void this.initializeSpecificTableNativeLayout(file, parsedTable));
      }
    });

    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_PAGE_TABLES_LABEL);
      item.setIcon("table-2");
      item.onClick(() => void this.initializeVisiblePageTablesNativeLayout(file));
    });
  }

  private addNativeLayoutRowColorMenuItems(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_TABLE_STYLE_LABEL);
      item.setIcon("table-properties");
      item.onClick(() => void this.setNativeLayoutTableStyle(tableId, file, tableEl, true));
    });
    (menu as any).addSeparator?.();
    this.addNativeLayoutStyleSubmenu(menu, file, tableId, tableEl, selection, coord, origin);
    this.addNativeLayoutAlignmentSubmenu(menu, file, tableId, tableEl, selection, coord, origin);
    this.addNativeLayoutAutoFillSubmenu(menu, file, tableId, tableEl, coord, origin);
  }

  private addNativeLayoutStyleSubmenu(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    this.addMenuSubmenu(menu, "颜色与样式", "palette", (submenu) => {
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_CLEAR_TABLE_STYLE_LABEL);
        item.setIcon("eraser");
        item.onClick(() => void this.setNativeLayoutTableStyle(tableId, file, tableEl, false));
      });
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_BORDER_ENABLE_LABEL);
        item.setIcon("grid-2x2");
        item.onClick(() => void this.setNativeLayoutTableBorderStyle(tableId, file, tableEl, true));
      });
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_BORDER_DISABLE_LABEL);
        item.setIcon("eraser");
        item.onClick(() => void this.setNativeLayoutTableBorderStyle(tableId, file, tableEl, false));
      });
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_ROW_COLOR_LABEL);
        item.setIcon("paint-bucket");
        item.onClick(() => this.showNativeLayoutRowColorPalette(file, tableEl, tableId, selection, coord, origin));
      });
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_ROW_BANDS_LABEL);
        item.setIcon("palette");
        item.onClick(() => new NativeRowBandColorModal(this, file, tableId, tableEl).open());
      });
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_TEXT_COLOR_LABEL);
        item.setIcon("type");
        item.onClick(() => this.showNativeLayoutTextColorPalette(file, tableEl, tableId, selection, coord, origin));
      });
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_CLEAR_TEXT_COLOR_LABEL);
        item.setIcon("eraser");
        item.onClick(() =>
          void this.setNativeLayoutCellRangeTextColor(tableId, file, tableEl, selection, coord, null)
        );
      });
      submenu.addItem((item) => {
        item.setTitle(NATIVE_LAYOUT_SCALE_LABEL);
        item.setIcon("zoom-in");
        item.onClick(() => this.showNativeLayoutScaleMenu(file, tableEl, tableId, origin));
      });
      submenu.addItem((item) => {
        item.setTitle("恢复选中行默认色");
        item.setIcon("eraser");
        item.onClick(() => {
          const range = this.getSelectedRowRange(selection, coord);
          void this.setNativeLayoutRowRangeColor(tableId, file, tableEl, range.startRow, range.endRow, null);
        });
      });
    }, origin);
  }

  private addNativeLayoutAlignmentSubmenu(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    this.addMenuSubmenu(
      menu,
      "对齐",
      "align-center",
      (submenu) => this.addNativeLayoutAlignmentMenuItems(submenu, file, tableId, tableEl, selection, coord),
      origin
    );
  }

  private addNativeLayoutAutoFillSubmenu(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    this.addMenuSubmenu(
      menu,
      "自动填充",
      "square-mouse-pointer",
      (submenu) => this.addNativeLayoutAutoFillMenuItems(submenu, file, tableId, tableEl, coord),
      origin
    );
  }

  private addMenuSubmenu(
    menu: Menu,
    title: string,
    icon: string,
    build: (submenu: Menu) => void,
    origin?: { x: number; y: number }
  ) {
    const menuAny = menu as any;
    if (typeof menuAny.addSubmenu === "function") {
      menuAny.addSubmenu((submenu: Menu & { setTitle?: (value: string) => unknown; setIcon?: (value: string) => unknown }) => {
        submenu.setTitle?.(title);
        submenu.setIcon?.(icon);
        build(submenu);
      });
      return;
    }

    menu.addItem((item) => {
      item.setTitle(`${title}...`);
      item.setIcon(icon);
      item.onClick(() => {
        const submenu = new Menu();
        build(submenu);
        submenu.showAtPosition(origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      });
    });
  }

  private addNativeLayoutAlignmentMenuItems(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord
  ) {
    const options: Array<{ label: string; icon: string; alignment: "left" | "center" | "right" }> = [
      { label: NATIVE_LAYOUT_ALIGN_LEFT_LABEL, icon: "align-left", alignment: "left" },
      { label: NATIVE_LAYOUT_ALIGN_CENTER_LABEL, icon: "align-center", alignment: "center" },
      { label: NATIVE_LAYOUT_ALIGN_RIGHT_LABEL, icon: "align-right", alignment: "right" },
    ];
    for (const option of options) {
      menu.addItem((item) => {
        item.setTitle(option.label);
        item.setIcon(option.icon);
        item.onClick(() =>
          void this.setNativeLayoutCellRangeAlignment(tableId, file, tableEl, selection, coord, option.alignment)
        );
      });
    }
  }

  private addNativeLayoutAutoFillMenuItems(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    coord: CellCoord
  ) {
    const structure = this.collectTableStructure(tableEl);
    const maxRow = Math.max(0, structure.rows.length - 1);
    const maxCol = Math.max(0, ...structure.matrix.map((row) => row.length - 1));

    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_FILL_DOWN_LABEL);
      item.setIcon("arrow-down-to-line");
      item.setDisabled(coord.row >= maxRow);
      item.onClick(() => void this.applyNativeAutoFill(tableId, file, tableEl, coord, { row: maxRow, col: coord.col }));
    });
    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_FILL_RIGHT_LABEL);
      item.setIcon("arrow-right-to-line");
      item.setDisabled(coord.col >= maxCol);
      item.onClick(() => void this.applyNativeAutoFill(tableId, file, tableEl, coord, { row: coord.row, col: maxCol }));
    });
  }

  private addStableEnhancedTableMenuItems(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    this.addHistoryMenuItems(menu, file, tableId);
    (menu as any).addSeparator?.();
    this.addStructureMenuItems(menu, file, tableId, tableEl, selection, coord);
    (menu as any).addSeparator?.();
    this.addColorMenuItems(menu, file, tableId, tableEl, coord, origin);
  }

  private addHistoryMenuItems(menu: Menu, file: TFile, tableId: string) {
    menu.addItem((item) => {
      item.setTitle("撤回");
      item.setIcon("undo");
      item.setDisabled(!this.canUndoHistoryForFile(file.path, tableId));
      item.onClick(() => void this.undoLastAction(file.path, tableId));
    });
    menu.addItem((item) => {
      item.setTitle("重做");
      item.setIcon("redo");
      item.setDisabled(!this.canRedoHistoryForFile(file.path, tableId));
      item.onClick(() => void this.redoLastAction(file.path, tableId));
    });
  }

  private addStructureMenuItems(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord
  ) {
    menu.addItem((item) => {
      item.setTitle("复制选中内容");
      item.setIcon("copy");
      item.onClick(() =>
        void this.copySelectionToClipboard(file, tableId, selection ?? this.normalizeSelection(coord, coord))
      );
    });
    menu.addItem((item) => {
      item.setTitle("高保真复制");
      item.setIcon("copy-plus");
      item.onClick(() =>
        void this.copySelectionToClipboardHighFidelity(file, tableId, selection ?? this.normalizeSelection(coord, coord))
      );
    });
    menu.addItem((item) => {
      item.setTitle("粘贴到当前单元格");
      item.setIcon("clipboard-paste");
      item.onClick(() => void this.handleClipboardContentPasteForSelectedCell(file, tableId, coord));
    });

    const insertAboveRow = Math.max(1, selection?.startRow ?? coord.row);
    const insertBelowRow = Math.max(1, (selection?.endRow ?? coord.row) + 1);
    const rowDeleteRange = this.getBodyRowDeleteRange(selection, coord);
    const insertLeftCol = selection?.startCol ?? coord.col;
    const insertRightCol = (selection?.endCol ?? coord.col) + 1;
    const colDeleteRange = this.getColumnDeleteRange(selection, coord);
    const structure = this.collectTableStructure(tableEl);

    menu.addItem((item) => {
      item.setTitle("上方插入行");
      item.setIcon("between-horizontal-start");
      item.onClick(() => void this.insertRows(file, tableId, insertAboveRow, 1));
    });
    menu.addItem((item) => {
      item.setTitle("下方插入行");
      item.setIcon("between-horizontal-end");
      item.onClick(() => void this.insertRows(file, tableId, insertBelowRow, 1));
    });
    menu.addItem((item) => {
      item.setTitle(rowDeleteRange ? (rowDeleteRange.count > 1 ? "删除选中行" : "删除当前行") : "当前行不可删除");
      item.setIcon("trash-2");
      item.setDisabled(!rowDeleteRange);
      item.onClick(() => {
        if (!rowDeleteRange) return;
        void this.deleteRows(file, tableId, rowDeleteRange.startRow, rowDeleteRange.count);
      });
    });
    menu.addItem((item) => {
      item.setTitle("左侧插入列");
      item.setIcon("between-vertical-start");
      item.onClick(() => void this.insertColumns(file, tableId, insertLeftCol, 1));
    });
    menu.addItem((item) => {
      item.setTitle("右侧插入列");
      item.setIcon("between-vertical-end");
      item.onClick(() => void this.insertColumns(file, tableId, insertRightCol, 1));
    });
    menu.addItem((item) => {
      item.setTitle(colDeleteRange.count > 1 ? "删除选中列" : "删除当前列");
      item.setIcon("trash-2");
      item.setDisabled(colDeleteRange.count >= structure.matrix[0]?.length);
      item.onClick(() => {
        if (colDeleteRange.count >= structure.matrix[0]?.length) return;
        void this.deleteColumns(file, tableId, colDeleteRange.startCol, colDeleteRange.count);
      });
    });
  }

  private addColorMenuItems(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    menu.addItem((item) => {
      item.setTitle("设置单元格颜色");
      item.setIcon("paint-bucket");
      item.onClick(() =>
        this.showPaletteMenu(
          tableEl,
          coord,
          origin,
          (palette) => void this.setColor(tableId, file, tableEl, "cell", this.getCellKey(coord), palette.value)
        )
      );
    });
    menu.addItem((item) => {
      item.setTitle("设置当前行颜色");
      item.setIcon("paint-bucket");
      item.onClick(() =>
        this.showPaletteMenu(
          tableEl,
          coord,
          origin,
          (palette) => void this.setColor(tableId, file, tableEl, "row", String(coord.row), palette.value)
        )
      );
    });
    menu.addItem((item) => {
      item.setTitle("设置当前列颜色");
      item.setIcon("paint-bucket");
      item.onClick(() =>
        this.showPaletteMenu(
          tableEl,
          coord,
          origin,
          (palette) => void this.setColor(tableId, file, tableEl, "column", String(coord.col), palette.value)
        )
      );
    });
    menu.addItem((item) => {
      item.setTitle("清除颜色");
      item.setIcon("eraser");
      item.onClick(() => this.showClearColorMenu(file, tableId, tableEl, coord, origin));
    });
  }

  private addMergeMenuItems(
    menu: Menu,
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord
  ) {
    void menu;
    void file;
    void tableId;
    void tableEl;
    void selection;
    void coord;
  }

  private getBodyRowDeleteRange(selection: SelectionRect | null, coord: CellCoord) {
    const startRow = Math.max(1, selection?.startRow ?? coord.row);
    const endRow = Math.max(1, selection?.endRow ?? coord.row);
    if (endRow < startRow) return null;
    return {
      startRow,
      count: endRow - startRow + 1,
    };
  }

  private getColumnDeleteRange(selection: SelectionRect | null, coord: CellCoord) {
    const startCol = selection?.startCol ?? coord.col;
    const endCol = selection?.endCol ?? coord.col;
    return {
      startCol,
      count: endCol - startCol + 1,
    };
  }

  private getSelectedRowRange(selection: SelectionRect | null, coord: CellCoord) {
    return {
      startRow: Math.max(0, selection?.startRow ?? coord.row),
      endRow: Math.max(0, selection?.endRow ?? coord.row),
    };
  }

  getNativeRowColorChoicesForTable(tableId: string) {
    const record = this.dataStore.tables[tableId];
    const palette = this.getLayoutNativeColorPalette(record?.layout ?? this.createEmptyLayout()) ?? this.getCurrentNativeColorPalette();
    return [
      { label: "正文白", value: palette.baseRow },
      { label: "浅色块", value: palette.altRow },
      { label: "表头色", value: palette.header },
      ...PALETTE,
    ].map((item) => ({ label: item.label, value: this.normalizeHexColor(item.value, palette.baseRow) }));
  }

  getNativeLayoutResolvedRowColor(tableId: string, rowIndex: number) {
    const record = this.dataStore.tables[tableId];
    if (!record) return NATIVE_COLOR_TABLE_BASE_ROW;
    return this.resolveCellBackgroundColor(record.layout, rowIndex, 0, this.getCellKey({ row: rowIndex, col: 0 })) || NATIVE_COLOR_TABLE_BASE_ROW;
  }

  private showNativeLayoutRowColorPalette(
    file: TFile,
    tableEl: HTMLTableElement,
    tableId: string,
    selection: SelectionRect | null,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    const menu = new Menu();
    for (const palette of this.getNativeRowColorChoicesForTable(tableId)) {
      menu.addItem((item) => {
        item.setTitle(palette.label);
        item.setIcon("paint-bucket");
        item.onClick(() =>
          void this.setNativeLayoutCellRangeBackgroundColor(tableId, file, tableEl, selection, coord, palette.value)
        );
      });
    }
    menu.addItem((item) => {
      item.setTitle("清除选区填充");
      item.setIcon("eraser");
      item.onClick(() => void this.setNativeLayoutCellRangeBackgroundColor(tableId, file, tableEl, selection, coord, null));
    });
    (menu as any).addSeparator?.();
    menu.addItem((item) => {
      item.setTitle("更多行段设置");
      item.setIcon("palette");
      item.onClick(() => new NativeRowBandColorModal(this, file, tableId, tableEl).open());
    });
    const rect = tableEl.getBoundingClientRect();
    menu.showAtPosition(origin ?? { x: rect.left + 24, y: rect.top + 24 });
  }

  private showNativeLayoutTextColorPalette(
    file: TFile,
    tableEl: HTMLTableElement,
    tableId: string,
    selection: SelectionRect | null,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    const menu = new Menu();
    const defaultTextColor = this.getNativeTableDefaultTextColor();
    const choices = [
      { label: "默认文字色", value: defaultTextColor },
      ...TEXT_COLOR_PALETTE.filter((item) => !this.colorsMatch(item.value, defaultTextColor)),
    ];
    for (const palette of choices) {
      menu.addItem((item) => {
        item.setTitle(palette.label);
        item.setIcon("type");
        item.onClick(() =>
          void this.setNativeLayoutCellRangeTextColor(tableId, file, tableEl, selection, coord, palette.value)
        );
      });
    }
    (menu as any).addSeparator?.();
    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_CLEAR_TEXT_COLOR_LABEL);
      item.setIcon("eraser");
      item.onClick(() => void this.setNativeLayoutCellRangeTextColor(tableId, file, tableEl, selection, coord, null));
    });
    const rect = tableEl.getBoundingClientRect();
    menu.showAtPosition(origin ?? { x: rect.left + 24, y: rect.top + 24 });
  }

  private showNativeLayoutScaleMenu(
    file: TFile,
    tableEl: HTMLTableElement,
    tableId: string,
    origin?: { x: number; y: number }
  ) {
    const menu = new Menu();
    const choices = Array.from(new Set([this.getNativeTableDefaultScale(), 0.75, 0.85, 1, 1.15, 1.3, 1.5])).sort(
      (left, right) => left - right
    );
    for (const scale of choices) {
      menu.addItem((item) => {
        item.setTitle(`${Math.round(scale * 100)}%`);
        item.setIcon(scale === 1 ? "zoom-in" : scale > 1 ? "plus" : "minus");
        item.onClick(() => void this.setNativeLayoutTableScale(tableId, file, tableEl, scale));
      });
    }
    const rect = tableEl.getBoundingClientRect();
    menu.showAtPosition(origin ?? { x: rect.left + 24, y: rect.top + 24 });
  }

  async setNativeLayoutRowRangeColor(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    startRow: number,
    endRow: number,
    color: string | null
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;
    const structure = this.collectTableStructure(tableEl);
    const maxRow = Math.max(0, structure.rows.length - 1);
    const safeStart = Math.max(0, Math.min(maxRow, Math.min(startRow, endRow)));
    const safeEnd = Math.max(0, Math.min(maxRow, Math.max(startRow, endRow)));
    const before = await this.captureHistoryState(file, [tableId]);
    const normalizedColor = color ? this.normalizeHexColor(color, this.getNativeLayoutResolvedRowColor(tableId, safeStart)) : null;

    for (let rowIndex = safeStart; rowIndex <= safeEnd; rowIndex += 1) {
      const key = String(rowIndex);
      if (normalizedColor) {
        record.layout.rowColors[key] = normalizedColor;
      } else {
        delete record.layout.rowColors[key];
      }
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: normalizedColor ? "设置行颜色" : "恢复行颜色",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice(normalizedColor ? "已设置选中行颜色" : "已恢复选中行默认色");
  }

  async setNativeLayoutCellRangeBackgroundColor(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    color: string | null
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const range = this.getSelectedCellRange(selection, coord, tableEl);
    const before = await this.captureHistoryState(file, [tableId]);
    const normalizedColor = color ? this.normalizeHexColor(color, this.getNativeLayoutResolvedRowColor(tableId, range.startRow)) : null;

    for (let row = range.startRow; row <= range.endRow; row += 1) {
      for (let col = range.startCol; col <= range.endCol; col += 1) {
        const key = this.getCellKey({ row, col });
        if (normalizedColor) {
          record.layout.cellColors[key] = normalizedColor;
        } else {
          delete record.layout.cellColors[key];
        }
      }
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: normalizedColor ? "设置选区填充" : "清除选区填充",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice(normalizedColor ? "已设置选区填充颜色" : "已清除选区填充颜色");
  }

  async setNativeLayoutCellRangeTextColor(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    color: string | null
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const range = this.getSelectedCellRange(selection, coord, tableEl);
    const before = await this.captureHistoryState(file, [tableId]);
    const normalizedColor = color ? this.normalizeHexColor(color, this.getNativeTableDefaultTextColor()) : null;
    for (let row = range.startRow; row <= range.endRow; row += 1) {
      for (let col = range.startCol; col <= range.endCol; col += 1) {
        const key = this.getCellKey({ row, col });
        if (normalizedColor) {
          record.layout.cellTextColors[key] = normalizedColor;
        } else {
          delete record.layout.cellTextColors[key];
        }
      }
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: normalizedColor ? "设置文字颜色" : "恢复文字颜色",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice(normalizedColor ? "已设置文字颜色" : "已恢复文字颜色");
  }

  async setNativeLayoutTableScale(tableId: string, file: TFile, tableEl: HTMLTableElement, scale: number) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const before = await this.captureHistoryState(file, [tableId]);
    this.materializeNativeLayoutSizeBase(record.layout, this.captureNativeLayoutSizeBase(tableEl, record.layout));
    record.layout.tableScale = this.normalizeNativeTableScale(scale, this.getNativeTableDefaultScale());
    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "调整整体比例",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice(`已调整整体比例为 ${Math.round(record.layout.tableScale * 100)}%`);
  }

  private async adjustNativeLayoutSelectedColumnWidth(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    delta: number
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const range = this.getSelectedCellRange(selection, coord, tableEl);
    const structure = this.collectTableStructure(tableEl);
    const scale = this.getLayoutTableScale(record.layout);
    const before = await this.captureHistoryState(file, [tableId]);
    for (let col = range.startCol; col <= range.endCol; col += 1) {
      const key = String(col);
      const current = record.layout.colWidths[key] ?? Math.round(this.getColumnWidth(structure, col) / scale);
      record.layout.colWidths[key] = this.normalizeNativeTableDefaultSize(current + delta, current, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
    }
    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "调整列宽",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice("已调整列宽");
  }

  private async adjustNativeLayoutSelectedRowHeight(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    delta: number
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const range = this.getSelectedCellRange(selection, coord, tableEl);
    const structure = this.collectTableStructure(tableEl);
    const scale = this.getLayoutTableScale(record.layout);
    const before = await this.captureHistoryState(file, [tableId]);
    for (let row = range.startRow; row <= range.endRow; row += 1) {
      const key = String(row);
      const current = record.layout.rowHeights[key] ?? Math.round(this.getRowHeight(structure, row) / scale);
      record.layout.rowHeights[key] = this.normalizeNativeTableDefaultSize(current + delta, current, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
    }
    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "调整行高",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice("已调整行高");
  }

  async setNativeLayoutTableStyle(tableId: string, file: TFile, tableEl: HTMLTableElement, enabled: boolean) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const before = await this.captureHistoryState(file, [tableId]);
    if (enabled) {
      const palette = this.getCurrentNativeColorPalette();
      record.layout.nativeColorPreset = NATIVE_COLOR_PRESET_BLUE_ZEBRA;
      record.layout.nativeColorPalette = palette;
      if (!record.layout.rowColors["0"]) {
        record.layout.rowColors["0"] = palette.header;
      }
    } else {
      delete record.layout.nativeColorPreset;
      delete record.layout.nativeColorPalette;
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: enabled ? "套用表格样式" : "取消表格样式",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice(enabled ? "已套用表格样式" : "已取消斑马样式");
  }

  async setNativeLayoutTableBorderStyle(tableId: string, file: TFile, tableEl: HTMLTableElement, enabled: boolean) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const before = await this.captureHistoryState(file, [tableId]);
    record.layout.nativeBorderEnabled = enabled === true;
    if (record.layout.nativeBorderEnabled && !record.layout.nativeColorPalette) {
      record.layout.nativeColorPalette = this.getCurrentNativeColorPalette();
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: enabled ? "开启边框样式" : "关闭边框样式",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice(enabled ? "已开启边框样式" : "已关闭边框样式");
  }

  async setNativeLayoutCellRangeAlignment(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    selection: SelectionRect | null,
    coord: CellCoord,
    alignment: "left" | "center" | "right",
    rangeMode: NativeLayoutRangeMode = "selection"
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record || record.mode !== "nativeLayout") return;

    const range = this.getSelectedCellRange(selection, coord, tableEl, rangeMode);
    const before = await this.captureHistoryState(file, [tableId]);
    for (let row = range.startRow; row <= range.endRow; row += 1) {
      for (let col = range.startCol; col <= range.endCol; col += 1) {
        const key = this.getCellKey({ row, col });
        record.layout.cellAlignments[key] = alignment;
      }
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "设置单元格对齐",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice("已设置对齐");
  }

  private getSelectedCellRange(
    selection: SelectionRect | null,
    coord: CellCoord,
    tableEl: HTMLTableElement,
    rangeMode: NativeLayoutRangeMode = "selection"
  ) {
    const structure = this.collectTableStructure(tableEl);
    const maxRow = Math.max(0, structure.rows.length - 1);
    const maxCol = Math.max(0, ...structure.matrix.map((row) => row.length - 1));
    const latestSelection = this.resolveLatestNativeLayoutSelection(tableEl, selection);
    const startRow = Math.max(0, Math.min(maxRow, latestSelection?.startRow ?? coord.row));
    const endRow = Math.max(0, Math.min(maxRow, latestSelection?.endRow ?? coord.row));
    const startCol = Math.max(0, Math.min(maxCol, latestSelection?.startCol ?? coord.col));
    const endCol = Math.max(0, Math.min(maxCol, latestSelection?.endCol ?? coord.col));
    const normalized = {
      startRow: Math.min(startRow, endRow),
      endRow: Math.max(startRow, endRow),
      startCol: Math.min(startCol, endCol),
      endCol: Math.max(startCol, endCol),
    };
    if (rangeMode === "row") {
      return {
        startRow: normalized.startRow,
        endRow: normalized.endRow,
        startCol: 0,
        endCol: maxCol,
      };
    }
    if (rangeMode === "column") {
      return {
        startRow: 0,
        endRow: maxRow,
        startCol: normalized.startCol,
        endCol: normalized.endCol,
      };
    }
    return {
      ...normalized,
    };
  }

  private resolveLatestNativeLayoutSelection(tableEl: HTMLTableElement, fallback: SelectionRect | null) {
    const runtime = this.runtimeState.get(tableEl);
    const runtimeSelection = runtime?.selection ?? null;
    const domSelection = this.getDomSelectedCellRange(tableEl);
    if (domSelection && (!runtimeSelection || this.getSelectionArea(domSelection) >= this.getSelectionArea(runtimeSelection))) {
      return domSelection;
    }
    return runtimeSelection ?? fallback;
  }

  private getDomSelectedCellRange(tableEl: HTMLTableElement): SelectionRect | null {
    const browserSelection = window.getSelection?.() ?? null;
    const coords = Array.from(tableEl.querySelectorAll("th, td"))
      .filter((cell) => {
        const htmlCell = cell as HTMLTableCellElement;
        return htmlCell.classList.contains("mdtp-cell-selected") || this.isPlainTableCellSelected(htmlCell, browserSelection);
      })
      .map((cell) => this.getCellCoord(cell as HTMLTableCellElement))
      .filter((coord): coord is CellCoord => !!coord);
    if (coords.length === 0) return null;
    return {
      startRow: Math.min(...coords.map((coord) => coord.row)),
      endRow: Math.max(...coords.map((coord) => coord.row)),
      startCol: Math.min(...coords.map((coord) => coord.col)),
      endCol: Math.max(...coords.map((coord) => coord.col)),
    };
  }

  private getSelectionArea(selection: SelectionRect) {
    return (selection.endRow - selection.startRow + 1) * (selection.endCol - selection.startCol + 1);
  }

  private async setColor(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    target: "cell" | "row" | "column",
    key: string,
    color: string
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    const before = await this.captureHistoryState(file, [tableId]);

    if (target === "cell") {
      record.layout.cellColors[key] = color;
    } else if (target === "row") {
      record.layout.rowColors[key] = color;
    } else {
      record.layout.colColors[key] = color;
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "设置颜色",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
  }

  private async clearColor(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    target: "cell" | "row" | "column",
    key: string
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    const before = await this.captureHistoryState(file, [tableId]);

    if (target === "cell") {
      delete record.layout.cellColors[key];
    } else if (target === "row") {
      delete record.layout.rowColors[key];
    } else {
      delete record.layout.colColors[key];
    }

    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "清除颜色",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
  }

  private async setCellImageWidth(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    coord: CellCoord,
    width: number
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    const before = await this.captureHistoryState(file, [tableId]);
    record.layout.cellImageWidths[this.getCellKey(coord)] = Math.max(80, Math.round(width));
    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    if (this.activeImageManipulator && this.isSameImageTarget(this.activeImageManipulator, tableId, coord)) {
      this.positionImageManipulator(this.activeImageManipulator.root, this.activeImageManipulator.imageEl);
    }
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "调整图片宽度",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
  }

  private async clearCellImageWidth(tableId: string, file: TFile, tableEl: HTMLTableElement, coord: CellCoord) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    const before = await this.captureHistoryState(file, [tableId]);
    delete record.layout.cellImageWidths[this.getCellKey(coord)];
    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    if (this.activeImageManipulator && this.isSameImageTarget(this.activeImageManipulator, tableId, coord)) {
      this.positionImageManipulator(this.activeImageManipulator.root, this.activeImageManipulator.imageEl);
    }
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "恢复图片宽度",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
  }

  private hideImageToolbar() {
    if (!this.activeImageToolbar) return;
    this.activeImageToolbar.root.remove();
    this.activeImageToolbar = null;
  }

  private showImageManipulator(
    tableEl: HTMLTableElement,
    file: TFile,
    tableId: string,
    coord: CellCoord,
    cell: HTMLTableCellElement,
    imageEl: HTMLImageElement
  ) {
    const existing = this.activeImageManipulator;
    if (
      existing &&
      existing.tableEl === tableEl &&
      existing.coord.row === coord.row &&
      existing.coord.col === coord.col &&
      existing.imageEl === imageEl &&
      document.body.contains(existing.root)
    ) {
      this.positionImageManipulator(existing.root, imageEl);
      return;
    }

    this.hideImageManipulator();

    const root = document.createElement("div");
    root.className = "mdtp-image-manipulator";
    root.addEventListener("pointerdown", (pointerEvent) => {
      pointerEvent.preventDefault();
      pointerEvent.stopPropagation();
      this.handleImageManipulatorPointerDown(pointerEvent, manipulator);
    });
    root.addEventListener("click", (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      const target = clickEvent.target as HTMLElement | null;
      if (target?.closest(".mdtp-image-manipulator-delete")) {
        void this.removeActiveImageFromCell(manipulator);
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mdtp-image-manipulator-delete";
    deleteButton.setAttribute("aria-label", "删除图片");
    deleteButton.textContent = "×";
    root.appendChild(deleteButton);

    const resizeHandle = document.createElement("button");
    resizeHandle.type = "button";
    resizeHandle.className = "mdtp-image-manipulator-handle";
    resizeHandle.setAttribute("aria-label", "拖拽调整图片大小");
    root.appendChild(resizeHandle);

    document.body.appendChild(root);
    const manipulator: ImageManipulatorState = {
      tableEl,
      file,
      tableId,
      coord,
      cell,
      imageEl,
      root,
      resizeHandle,
      deleteButton,
    };
    this.positionImageManipulator(root, imageEl);
    this.activeImageManipulator = manipulator;
  }

  private handleImageManipulatorPointerDown(
    event: PointerEvent,
    manipulator: ImageManipulatorState
  ): "resize" | "align" | "noop" {
    const target = event.target as HTMLElement | null;
    if (target?.closest(".mdtp-image-manipulator-handle")) {
      this.startImageResizeDrag(event, manipulator);
      return "resize";
    }
    return "noop";
  }

  private positionImageManipulator(root: HTMLDivElement, imageEl: HTMLImageElement) {
    const rect = imageEl.getBoundingClientRect();
    root.style.left = `${Math.max(0, Math.round(rect.left))}px`;
    root.style.top = `${Math.max(0, Math.round(rect.top))}px`;
    root.style.width = `${Math.max(24, Math.round(rect.width))}px`;
    root.style.height = `${Math.max(24, Math.round(rect.height))}px`;
  }

  private hideImageManipulator() {
    if (this.activeImageManipulator) {
      this.activeImageManipulator.root.classList.remove("is-resizing");
      this.activeImageManipulator.root.remove();
      this.activeImageManipulator = null;
    }
    this.activeImageDrag = null;
  }

  private openCellImageOriginal(cell: HTMLTableCellElement) {
    const linkEl = cell.querySelector("a[href]") as HTMLAnchorElement | null;
    const imageEl = cell.querySelector("img") as HTMLImageElement | null;
    const href = linkEl?.href || imageEl?.src || "";
    if (!href) {
      new Notice("当前单元格没有可打开的原图");
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  private isImageMarkupFragment(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^!\[\[[^[\]]+?\]\]$/.test(trimmed) || /^!\[[^\]]*\]\([^)]+\)$/.test(trimmed);
  }

  private containsImageMarkup(value: string) {
    return /!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/.test(value);
  }

  private replaceFirstImageMarkup(value: string, imageMarkup: string) {
    return value.replace(/!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/, imageMarkup.trim());
  }

  private stripImageMarkup(value: string) {
    return value
      .replace(/!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private extractImageMarkupFragments(value: string) {
    return Array.from(value.matchAll(/!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/g), (match) => match[0].trim()).filter(
      Boolean
    );
  }

  private resolveImageElement(target: HTMLElement | null) {
    if (!target) return null;
    if (target instanceof HTMLImageElement) {
      return target;
    }
    return target.querySelector("img");
  }

  private getRenderedImageWidth(imageEl: HTMLImageElement) {
    const explicitWidth = Number.parseInt(imageEl.style.width || "", 10);
    if (Number.isFinite(explicitWidth) && explicitWidth > 0) return explicitWidth;
    return Math.max(80, Math.round(imageEl.getBoundingClientRect().width));
  }

  private startImageResizeDrag(event: PointerEvent, manipulator: ImageManipulatorState) {
    const startWidth = this.getRenderedImageWidth(manipulator.imageEl);
    this.activeImageDrag = {
      manipulator,
      startClientX: event.clientX,
      startWidth,
      previewWidth: startWidth,
    };
    manipulator.root.classList.add("is-resizing");
  }

  private isSameImageTarget(manipulator: ImageManipulatorState, tableId: string, coord: CellCoord) {
    return (
      manipulator.tableId === tableId &&
      manipulator.coord.row === coord.row &&
      manipulator.coord.col === coord.col
    );
  }

  private async replaceCellImageFromClipboard(file: TFile, tableId: string, coord: CellCoord) {
    const imageFile = await this.readImageFromAvailableClipboard();
    if (!imageFile) {
      new Notice("当前剪贴板里没有可用图片");
      return false;
    }
    const imageMarkup = await this.createAttachmentMarkup(file, imageFile);
    if (!imageMarkup) return false;
    const currentValue = await this.readCellSourceValue(file, tableId, null, coord);
    const nextValue =
      currentValue && this.containsImageMarkup(currentValue)
        ? this.replaceFirstImageMarkup(currentValue, imageMarkup)
        : this.composeNextCellValueWithImage(currentValue, imageMarkup);
    return this.updateCellSourceValue(file, tableId, null, coord, nextValue);
  }

  private async removeImagesFromCell(file: TFile, tableId: string, coord: CellCoord) {
    const currentValue = await this.readCellSourceValue(file, tableId, null, coord);
    if (!currentValue || !this.containsImageMarkup(currentValue)) {
      new Notice("当前单元格没有可移除的图片");
      return false;
    }
    const nextValue = this.stripImageMarkup(currentValue);
    return this.updateCellSourceValue(file, tableId, null, coord, nextValue);
  }

  private async removeActiveImageFromCell(manipulator: ImageManipulatorState) {
    const currentValue = await this.readCellSourceValue(manipulator.file, manipulator.tableId, null, manipulator.coord);
    if (!currentValue || !this.containsImageMarkup(currentValue)) {
      new Notice("当前单元格没有可删除的图片");
      this.hideImageManipulator();
      return false;
    }

    const selectedSource = this.getSelectedImageSource(manipulator);
    const selectedResourcePath = manipulator.imageEl.src || "";
    const nextValue = this.removeSelectedImageMarkupFromValue(
      currentValue,
      manipulator.file,
      selectedSource,
      selectedResourcePath
    );
    if (nextValue === currentValue) {
      new Notice("未能定位到要删除的图片");
      return false;
    }

    const cellKey = this.getCellKey(manipulator.coord);
    const handled = await this.mutateTableSource(
      manipulator.file,
      manipulator.tableId,
      "before-delete-cell-image",
      "删除单元格图片",
      (rawTable, layout) => {
        const normalizedNextValue = this.normalizeValueAfterImageDeletion(this.normalizeEditedCellValue(nextValue));
        const didSet = this.setCellValue(rawTable, manipulator.coord, normalizedNextValue);
        if (!didSet) return false;
        if (!this.containsImageMarkup(normalizedNextValue)) {
          delete layout.cellImageWidths[cellKey];
        }
        return true;
      }
    );

    if (handled) {
      this.hideImageManipulator();
      new Notice("已删除图片");
    }
    return handled;
  }

  private getSelectedImageSource(manipulator: ImageManipulatorState) {
    const wrapper = manipulator.imageEl.closest(".mdtp-rendered-image-embed") as HTMLElement | null;
    return wrapper?.dataset.mdtpImageSource?.trim() || manipulator.imageEl.alt?.trim() || "";
  }

  private removeSelectedImageMarkupFromValue(
    value: string,
    file: TFile,
    selectedDisplayPath: string,
    selectedResourcePath: string
  ) {
    const imagePattern = /!\[\[[^[\]]+?\]\]|!\[[^\]]*]\([^)]+\)/g;
    const matches = Array.from(value.matchAll(imagePattern));
    if (matches.length === 0) return value;

    const selectedDisplay = selectedDisplayPath.trim();
    const selectedResource = selectedResourcePath.trim();
    const targetMatch =
      matches.find((match) => {
        const raw = match[0] ?? "";
        const target = this.extractImageMarkupTarget(raw);
        if (!target) return false;
        const resolved = this.resolveImagePreviewTarget(target, file);
        if (!resolved) return false;
        return (
          (!!selectedDisplay && resolved.displayPath === selectedDisplay) ||
          (!!selectedResource && resolved.resourcePath === selectedResource)
        );
      }) ?? matches[0];

    const start = targetMatch.index ?? -1;
    const raw = targetMatch[0] ?? "";
    if (start < 0 || !raw) return value;
    return this.normalizeValueAfterImageDeletion(`${value.slice(0, start)}${value.slice(start + raw.length)}`);
  }

  private extractImageMarkupTarget(markup: string) {
    const wikiMatch = markup.match(/^!\[\[([^[\]]+?)\]\]$/);
    if (wikiMatch?.[1]) return wikiMatch[1];
    const markdownMatch = markup.match(/^!\[[^\]]*]\(([^)]+)\)$/);
    return markdownMatch?.[1] ?? "";
  }

  private normalizeValueAfterImageDeletion(value: string) {
    return value
      .replace(/(?:\s*<br\s*\/?>\s*){2,}/gi, "<br>")
      .replace(/^(?:\s*<br\s*\/?>\s*)+/gi, "")
      .replace(/(?:\s*<br\s*\/?>\s*)+$/gi, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private async mergeSelection(file: TFile, tableId: string, tableEl: HTMLTableElement, selection: SelectionRect) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;

    const didMerge = await this.mutateTableSource(
      file,
      tableId,
      "before-merge",
      "合并单元格",
      (rawTable, layout) => {
        const anchor = { row: selection.startRow, col: selection.startCol };
        const anchorValue = this.getCellValue(rawTable, anchor) ?? "";
        if (this.isMeaningfullyEmptyCellValue(anchorValue)) {
          const fallback = this.findFirstNonEmptyCellInSelection(rawTable, selection, anchor);
          if (fallback) {
            const didMoveToAnchor = this.setCellValue(rawTable, anchor, fallback.value);
            const didClearSource = this.setCellValue(rawTable, fallback.coord, "");
            if (!didMoveToAnchor || !didClearSource) return false;
          }
        }

        layout.merges.push({
          row: selection.startRow,
          col: selection.startCol,
          rowspan: selection.endRow - selection.startRow + 1,
          colspan: selection.endCol - selection.startCol + 1,
        });
        return true;
      }
    );
    if (!didMerge) return;
    new Notice("已合并选中单元格");
  }

  private async splitMerge(file: TFile, tableId: string, tableEl: HTMLTableElement, merge: TableMergeMetadata) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;

    const before = await this.captureHistoryState(file, [tableId]);
    await this.createSnapshot(file, "before-split", [tableId]);
    record.layout.merges = record.layout.merges.filter(
      (item) =>
        !(
          item.row === merge.row &&
          item.col === merge.col &&
          item.rowspan === merge.rowspan &&
          item.colspan === merge.colspan
        )
    );
    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "拆分单元格",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    new Notice("已拆分单元格");
  }

  private canMergeSelection(tableEl: HTMLTableElement, layout: TableLayoutMetadata, selection: SelectionRect) {
    const structure = this.collectTableStructure(tableEl);
    const mergeCandidate: TableMergeMetadata = {
      row: selection.startRow,
      col: selection.startCol,
      rowspan: selection.endRow - selection.startRow + 1,
      colspan: selection.endCol - selection.startCol + 1,
    };

    if (!this.isMergeShapeValid(structure, mergeCandidate)) return false;
    if (!this.isMergeWithinSameSection(structure, mergeCandidate)) return false;

    for (const merge of layout.merges) {
      if (this.rectanglesOverlap(selection, this.mergeToRect(merge))) {
        return false;
      }
    }

    return true;
  }

  private mergeToRect(merge: TableMergeMetadata): SelectionRect {
    return {
      startRow: merge.row,
      endRow: merge.row + merge.rowspan - 1,
      startCol: merge.col,
      endCol: merge.col + merge.colspan - 1,
    };
  }

  private rectanglesOverlap(left: SelectionRect, right: SelectionRect) {
    return !(
      left.endRow < right.startRow ||
      right.endRow < left.startRow ||
      left.endCol < right.startCol ||
      right.endCol < left.startCol
    );
  }

  private selectionContains(selection: SelectionRect | null, coord: CellCoord) {
    if (!selection) return false;
    return (
      coord.row >= selection.startRow &&
      coord.row <= selection.endRow &&
      coord.col >= selection.startCol &&
      coord.col <= selection.endCol
    );
  }

  private getCellCoord(cell: HTMLTableCellElement): CellCoord | null {
    const row = Number.parseInt(cell.dataset.mdtpRow ?? "-1", 10);
    const col = Number.parseInt(cell.dataset.mdtpCol ?? "-1", 10);
    if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || col < 0) return null;
    return { row, col };
  }

  private cellContainsImage(cell: HTMLTableCellElement) {
    return !!cell.querySelector("img, .image-embed, .internal-embed, .media-embed");
  }

  private isInitializedTable(tableEl: HTMLTableElement) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return !!tableId && !!this.dataStore.tables[tableId];
  }

  private isInitializedEnhancedTable(tableEl: HTMLTableElement) {
    void tableEl;
    return false;
  }

  private isNativeLayoutTable(tableEl: HTMLTableElement) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return !!tableId && this.getTableRecordMode(this.dataStore.tables[tableId]) === "nativeLayout";
  }

  private getManagedTableId(tableEl: HTMLTableElement) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return tableId && this.dataStore.tables[tableId] ? tableId : null;
  }

  private getInitializedTableId(tableEl: HTMLTableElement) {
    void tableEl;
    return null;
  }

  private normalizeSelection(anchor: CellCoord, current: CellCoord): SelectionRect {
    return {
      startRow: Math.min(anchor.row, current.row),
      endRow: Math.max(anchor.row, current.row),
      startCol: Math.min(anchor.col, current.col),
      endCol: Math.max(anchor.col, current.col),
    };
  }

  private renderSelection(tableEl: HTMLTableElement, selection: SelectionRect | null, anchor: CellCoord | null) {
    for (const cell of Array.from(tableEl.querySelectorAll("th, td"))) {
      cell.classList.remove("mdtp-cell-selected", "mdtp-cell-anchor");
      const htmlCell = cell as HTMLTableCellElement;
      htmlCell.style.boxShadow = "";
      const coord = this.getCellCoord(htmlCell);
      if (!coord || !selection) continue;
      if (this.selectionContains(selection, coord)) {
        htmlCell.classList.add("mdtp-cell-selected");
        htmlCell.style.boxShadow = "inset 0 0 0 2px color-mix(in srgb, var(--color-accent) 65%, transparent)";
      }
      if (anchor && coord.row === anchor.row && coord.col === anchor.col) {
        htmlCell.classList.add("mdtp-cell-anchor");
        htmlCell.style.boxShadow = "inset 0 0 0 3px var(--color-accent)";
      }
    }
  }

  private handleGlobalPointerMove(event: PointerEvent) {
    if (this.activeImageDrag) {
      event.preventDefault();
      const delta = event.clientX - this.activeImageDrag.startClientX;
      const previewWidth = Math.max(80, Math.round(this.activeImageDrag.startWidth + delta));
      this.activeImageDrag.previewWidth = previewWidth;
      this.activeImageDrag.manipulator.imageEl.style.width = `${previewWidth}px`;
      this.positionImageManipulator(
        this.activeImageDrag.manipulator.root,
        this.activeImageDrag.manipulator.imageEl
      );
      return;
    }

    if (this.activeAutoFill) {
      event.preventDefault();
      this.updateNativeAutoFillTarget(event);
      return;
    }

    if (this.activeResize) {
      event.preventDefault();
      if (this.activeResize.kind === "scale") {
        const deltaX = event.clientX - this.activeResize.startClientX;
        const deltaY = event.clientY - this.activeResize.startClientY;
        const nextScale = this.normalizeNativeTableScale(
          this.activeResize.startScale + (deltaX + deltaY) / 520,
          this.activeResize.startScale
        );
        this.activeResize.currentScale = nextScale;
        const record = this.dataStore.tables[this.activeResize.tableId];
        if (record?.mode === "nativeLayout") {
          this.previewNativeLayoutTableScale(this.activeResize.tableEl, record.layout, nextScale, this.activeResize.sizeBase);
        }
        return;
      }
      const delta = (this.activeResize.kind === "column" ? event.clientX : event.clientY) - this.activeResize.startClient;
      const nextSize = Math.max(
        this.activeResize.kind === "column" ? MIN_COLUMN_WIDTH : MIN_ROW_HEIGHT,
        this.activeResize.startSize + delta
      );
      const structure = this.collectTableStructure(this.activeResize.tableEl);
      if (this.activeResize.kind === "column") {
        this.applyColumnWidth(structure, this.activeResize.index, nextSize);
      } else {
        this.applyRowHeight(structure, this.activeResize.index, nextSize);
      }
      return;
    }

    if (!this.activeSelectionDrag || !(event.buttons & 1)) return;
    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    const cell = hovered?.closest?.("th, td") as HTMLTableCellElement | null;
    if (!cell || !this.activeSelectionDrag.tableEl.contains(cell)) return;
    const coord = this.getCellCoord(cell);
    if (!coord) return;
    const runtime = this.runtimeState.get(this.activeSelectionDrag.tableEl);
    if (!runtime) return;
    runtime.selection = this.normalizeSelection(this.activeSelectionDrag.anchor, coord);
    runtime.anchor = this.activeSelectionDrag.anchor;
    this.renderSelection(this.activeSelectionDrag.tableEl, runtime.selection, runtime.anchor);
  }

  private async handleGlobalPointerUp() {
    if (this.activeImageDrag) {
      const imageDrag = this.activeImageDrag;
      this.activeImageDrag = null;
      const manipulator = imageDrag.manipulator;
      manipulator.root.classList.remove("is-resizing");
      const nextWidth = Math.max(80, Math.round(imageDrag.previewWidth));
      await this.setCellImageWidth(
        manipulator.tableId,
        manipulator.file,
        manipulator.tableEl,
        manipulator.coord,
        nextWidth
      );
      this.positionImageManipulator(manipulator.root, manipulator.imageEl);
      return;
    }

    if (this.activeAutoFill) {
      const fill = this.activeAutoFill;
      this.activeAutoFill = null;
      const targetCoord = fill.targetCoord;
      this.clearNativeAutoFillPreview(fill.tableEl);
      if (targetCoord) {
        await this.applyNativeAutoFill(fill.tableId, fill.file, fill.tableEl, fill.sourceCoord, targetCoord);
      }
      return;
    }

    if (this.activeResize) {
      const resize = this.activeResize;
      this.activeResize = null;
      const record = this.dataStore.tables[resize.tableId];
      if (record) {
        const before = await this.captureHistoryState(resize.file, [resize.tableId]);
        const structure = this.collectTableStructure(resize.tableEl);
        const scale = this.getLayoutTableScale(record.layout);
        if (resize.kind === "scale") {
          record.layout.tableScale = resize.currentScale;
          this.materializeNativeLayoutSizeBase(record.layout, resize.sizeBase);
        } else if (resize.kind === "column") {
          record.layout.colWidths[String(resize.index)] = Math.round(this.getColumnWidth(structure, resize.index) / scale);
        } else {
          record.layout.rowHeights[String(resize.index)] = Math.round(this.getRowHeight(structure, resize.index) / scale);
        }
        record.updatedAt = Date.now();
        await this.savePluginData();
        this.refreshEnhancedTable(resize.tableEl, resize.tableId);
        const after = await this.captureHistoryState(resize.file, [resize.tableId]);
        this.pushHistoryEntry({
          label: resize.kind === "scale" ? "调整整体比例" : resize.kind === "column" ? "调整列宽" : "调整行高",
          filePath: resize.file.path,
          tableIds: [resize.tableId],
          before,
          after,
        });
      }
    }

    this.activeSelectionDrag = null;
  }

  private updateNativeAutoFillTarget(event: PointerEvent) {
    const fill = this.activeAutoFill;
    if (!fill) return;

    const hovered = document.elementFromPoint(event.clientX, event.clientY);
    const cell = hovered?.closest?.("th, td") as HTMLTableCellElement | null;
    const coord = cell && fill.tableEl.contains(cell) ? this.getCellCoord(cell) : null;
    const target = coord && this.isAutoFillTarget(fill.sourceCoord, coord) ? coord : null;
    fill.targetCoord = target;
    this.renderNativeAutoFillPreview(fill.tableEl, fill.sourceCoord, target);
  }

  private isAutoFillTarget(source: CellCoord, target: CellCoord) {
    if (source.row === target.row && source.col === target.col) return false;
    return source.row === target.row || source.col === target.col;
  }

  private renderNativeAutoFillPreview(tableEl: HTMLTableElement, source: CellCoord, target: CellCoord | null) {
    this.clearNativeAutoFillPreview(tableEl);
    const structure = this.collectTableStructure(tableEl);
    const sourceCell = structure.matrix[source.row]?.[source.col];
    if (sourceCell) sourceCell.classList.add("mdtp-autofill-source");
    if (!target) return;

    for (const coord of this.getAutoFillTargetCoords(source, target)) {
      const cell = structure.matrix[coord.row]?.[coord.col];
      if (cell) cell.classList.add("mdtp-autofill-preview");
    }
  }

  private clearNativeAutoFillPreview(tableEl: HTMLTableElement) {
    for (const cell of Array.from(tableEl.querySelectorAll(".mdtp-autofill-source, .mdtp-autofill-preview")) as HTMLElement[]) {
      cell.classList.remove("mdtp-autofill-source", "mdtp-autofill-preview");
    }
  }

  private getAutoFillTargetCoords(source: CellCoord, target: CellCoord) {
    const coords: CellCoord[] = [];
    if (source.col === target.col) {
      const step = target.row > source.row ? 1 : -1;
      for (let row = source.row + step; step > 0 ? row <= target.row : row >= target.row; row += step) {
        coords.push({ row, col: source.col });
      }
      return coords;
    }

    if (source.row === target.row) {
      const step = target.col > source.col ? 1 : -1;
      for (let col = source.col + step; step > 0 ? col <= target.col : col >= target.col; col += step) {
        coords.push({ row: source.row, col });
      }
    }
    return coords;
  }

  private async applyNativeAutoFill(
    tableId: string,
    file: TFile,
    tableEl: HTMLTableElement,
    sourceCoord: CellCoord,
    targetCoord: CellCoord
  ) {
    void tableEl;
    if (!this.isAutoFillTarget(sourceCoord, targetCoord)) return false;

    const direction: 1 | -1 = targetCoord.row > sourceCoord.row || targetCoord.col > sourceCoord.col ? 1 : -1;
    const targetCoords = this.getAutoFillTargetCoords(sourceCoord, targetCoord);
    if (targetCoords.length === 0) return false;

    const handled = await this.mutateTableSource(
      file,
      tableId,
      "before-native-autofill",
      "自动填充",
      (rawTable) => {
        const seed = this.getCellValue(rawTable, sourceCoord);
        if (seed === null) return false;
        const values = buildNativeAutoFillValues([seed], targetCoords.length, direction);
        if (values.length === 0) return false;

        let changed = false;
        for (let index = 0; index < targetCoords.length; index += 1) {
          const coord = targetCoords[index];
          if (!coord) continue;
          const current = this.getCellValue(rawTable, coord);
          const nextValue = values[index];
          if (nextValue === undefined) continue;
          if (current === nextValue) continue;
          changed = this.setCellValue(rawTable, coord, nextValue) || changed;
        }
        return changed;
      }
    );

    if (handled) {
      new Notice("已自动填充");
    }
    return handled;
  }

  private getColumnWidth(structure: TableStructure, colIndex: number) {
    const cell = structure.matrix[0]?.[colIndex] ?? structure.matrix.find((row) => !!row[colIndex])?.[colIndex];
    if (!cell) return 160;
    const styledWidth = Number.parseInt(cell.style.getPropertyValue("--mdtp-col-width"), 10);
    if (Number.isFinite(styledWidth) && styledWidth > 0) return styledWidth;
    return Math.max(MIN_COLUMN_WIDTH, Math.round(cell.getBoundingClientRect().width));
  }

  private getRowHeight(structure: TableStructure, rowIndex: number) {
    const row = structure.rows[rowIndex];
    if (!row) return 40;
    const styledHeight = Number.parseInt(row.style.getPropertyValue("--mdtp-row-height"), 10);
    if (Number.isFinite(styledHeight) && styledHeight > 0) return styledHeight;
    return Math.max(MIN_ROW_HEIGHT, Math.round(row.getBoundingClientRect().height));
  }

  private refreshEnhancedTable(tableEl: HTMLTableElement, tableId: string) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;

    this.clearInjectedTableArtifacts(tableEl);
    this.indexTableCells(tableEl);
    if (record.mode === "nativeLayout") {
      tableEl.classList.remove("mdtp-table-enhanced");
      tableEl.classList.add("mdtp-table-native-layout");
      this.applyNativeLayout(tableEl, record.layout);
      const runtime = this.runtimeState.get(tableEl);
      if (runtime?.parsedTable) {
        this.renderNativeTableComputedCells(tableEl, runtime.parsedTable);
      }
      this.injectResizeHandles(tableEl, record.layout);
      this.injectAutoFillHandles(tableEl);
      if (runtime) {
        runtime.selection = null;
        runtime.anchor = null;
        this.renderSelection(tableEl, null, null);
      }
      return;
    }

    this.runtimeState.delete(tableEl);
    this.restoreNativeTable(tableEl);
  }

  private clearAllEnhancedSelections(exceptTableEl?: HTMLTableElement | null) {
    const except = exceptTableEl ?? null;
    for (const [tableEl, runtime] of this.runtimeState.entries()) {
      if (!document.body.contains(tableEl)) continue;
      if (except && tableEl === except) continue;
      runtime.selection = null;
      runtime.anchor = null;
      this.renderSelection(tableEl, null, null);
    }
    if (!except) {
      this.lastTableContext = null;
    }
  }

  private async openInlineEditor(
    tableEl: HTMLTableElement,
    file: TFile,
    tableId: string | null,
    parsedTable: ParsedTableBlock | null,
    cell: HTMLTableCellElement,
    coord: CellCoord
  ) {
    if (this.activeEditor) {
      const isSameCell =
        this.activeEditor.tableId === tableId &&
        this.activeEditor.coord.row === coord.row &&
        this.activeEditor.coord.col === coord.col;
      if (isSameCell) {
        this.activeEditor.textarea.focus();
        return;
      }
      await this.closeActiveEditor("commit");
    }

    const sourceValue = await this.readCellSourceValue(file, tableId, parsedTable, coord);
    if (sourceValue === null) {
      new Notice("当前单元格暂时无法进入编辑");
      return;
    }

    const imageMarkups = this.extractImageMarkupFragments(sourceValue);
    const editorTextValue = imageMarkups.length > 0 ? this.getInlineEditorTextValue(sourceValue) : sourceValue;
    const wrapper = document.createElement("div");
    wrapper.className = "mdtp-inline-editor";

    const textarea = document.createElement("textarea");
    textarea.className = "mdtp-inline-editor-input";
    textarea.value = editorTextValue;
    wrapper.appendChild(textarea);
    const imageContainer = document.createElement("div");
    imageContainer.className = "mdtp-inline-editor-images";
    wrapper.appendChild(imageContainer);
    cell.replaceChildren(wrapper);
    cell.classList.add("mdtp-cell-editing");
    const row = cell.parentElement instanceof HTMLTableRowElement ? cell.parentElement : tableEl.rows.item(coord.row + 1);
    if (!(row instanceof HTMLTableRowElement)) {
      cell.classList.remove("mdtp-cell-editing");
      cell.textContent = sourceValue;
      new Notice("当前表格行暂时无法进入编辑");
      return;
    }
    const originalRowHeight = row.style.height;
    const originalRowMinHeight = row.style.minHeight;
    const originalCellHeight = cell.style.height;
    const originalCellMinHeight = cell.style.minHeight;
    row.style.height = "auto";
    row.style.minHeight = "";
    cell.style.height = "auto";
    cell.style.minHeight = "";
    this.hideTableSidebarPopover();
    this.hideImageToolbar();
    this.hideImageManipulator();

    const editorState: InlineEditorState = {
      tableEl,
      file,
      tableId,
      parsedTable,
      cell,
      row,
      coord,
      wrapper,
      textarea,
      imageContainer,
      imageMarkups,
      initialValue: sourceValue,
      originalRowHeight,
      originalRowMinHeight,
      originalCellHeight,
      originalCellMinHeight,
      layoutFrame: null,
      closing: false,
    };
    this.activeEditor = editorState;

    let pointerInsideEditor = false;
    const markPointerInsideEditor = (event: Event) => {
      event.stopPropagation();
      pointerInsideEditor = true;
      window.setTimeout(() => {
        pointerInsideEditor = false;
      }, 160);
    };
    const stop = (event: Event) => {
      event.stopPropagation();
    };

    wrapper.addEventListener("pointerdown", markPointerInsideEditor);
    wrapper.addEventListener("dblclick", stop);
    wrapper.addEventListener("contextmenu", stop);
    const updateLayout = () => this.queueInlineEditorLayout(editorState);
    textarea.addEventListener("keydown", (event) => {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b" && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        this.toggleTextareaBold(textarea);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void this.closeActiveEditor("commit");
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        void this.closeActiveEditor("cancel");
      }
    });
    textarea.addEventListener("input", () => {
      updateLayout();
    });
    textarea.addEventListener("blur", () => {
      window.setTimeout(() => {
        if (this.activeEditor !== editorState || editorState.closing) return;
        const activeElement = document.activeElement;
        if (
          pointerInsideEditor ||
          (activeElement instanceof Node && wrapper.contains(activeElement))
        ) {
          textarea.focus();
          return;
        }
        void this.closeActiveEditor("commit");
      }, 0);
    });

    this.renderInlineEditorImages(editorState);
    this.syncInlineEditorLayout(editorState);
    textarea.focus();
    const preferredCursor = this.getPreferredInlineEditorCursorPosition(editorTextValue);
    textarea.setSelectionRange(preferredCursor, preferredCursor);
    textarea.scrollTop = 0;
    updateLayout();
  }

  private getInlineEditorTextValue(sourceValue: string) {
    return this.stripImageMarkup(sourceValue).replace(/\n{3,}/g, "\n\n");
  }

  private extractInlineEditorTextContent(value: string) {
    return this.normalizeClipboardCellForPlainText(value)
      .replace(/!\[\[[^[\]]+?\]\]/g, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private getPreferredInlineEditorCursorPosition(value: string) {
    const normalized = this.normalizeClipboardCellForPlainText(value);
    const lines = normalized.split("\n");
    let offset = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      const isImageOnly = this.isStandaloneImageLine(trimmed);
      if (trimmed && !isImageOnly) {
        return offset + line.length;
      }
      offset += line.length + 1;
    }
    return normalized.length;
  }

  private async closeActiveEditor(mode: "commit" | "cancel") {
    const editor = this.activeEditor;
    if (!editor || editor.closing) return;
    editor.closing = true;
    if (editor.layoutFrame !== null && typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function") {
      window.cancelAnimationFrame(editor.layoutFrame);
      editor.layoutFrame = null;
    }
    this.activeEditor = null;

    const nextValue = this.composeInlineEditorSourceValue(editor, editor.textarea.value);
    const displayValue = mode === "cancel" ? editor.initialValue : nextValue;
    editor.wrapper.remove();
    editor.cell.classList.remove("mdtp-cell-editing");
    this.restoreInlineEditorCellDisplay(editor, displayValue);
    editor.cell.style.height = editor.originalCellHeight;
    editor.cell.style.minHeight = editor.originalCellMinHeight;
    editor.row.style.height = editor.originalRowHeight;
    editor.row.style.minHeight = editor.originalRowMinHeight;
    this.queueRefreshBurst();

    if (mode === "commit" && nextValue !== editor.initialValue) {
      const didUpdate = await this.updateCellSourceValue(
        editor.file,
        editor.tableId,
        editor.parsedTable,
        editor.coord,
        nextValue
      );
      if (!didUpdate) {
        this.restoreInlineEditorCellDisplay(editor, editor.initialValue);
        new Notice("单元格内容写回失败，已保留原表格内容");
      }
    }
  }

  private composeInlineEditorSourceValue(editor: InlineEditorState, textValue: string) {
    const typedImageMarkups = this.extractImageMarkupFragments(textValue);
    const imageMarkups = [...editor.imageMarkups, ...typedImageMarkups]
      .map((markup) => markup.trim())
      .filter(Boolean);
    if (imageMarkups.length === 0) return textValue;

    const textPart = this.stripImageMarkup(textValue);
    const parts: string[] = [];
    if (textPart) {
      parts.push(textPart);
    }
    parts.push(...imageMarkups);
    return parts.join("\n\n");
  }

  private restoreInlineEditorCellDisplay(editor: InlineEditorState, value: string) {
    if (this.containsImageMarkup(value)) {
      this.renderCellImageMarkup(editor.cell, editor.file, value);
      const width = editor.tableId ? this.dataStore.tables[editor.tableId]?.layout.cellImageWidths[this.getCellKey(editor.coord)] : undefined;
      this.applyImagePresentationToCell(editor.cell, width);
      return;
    }

    editor.cell.replaceChildren();
    this.appendRenderedCellText(editor.cell, value);
  }

  private syncInlineEditorLayout(editor: InlineEditorState) {
    if (editor.closing) return;
    editor.textarea.style.height = "auto";
    const computedStyle =
      typeof window !== "undefined" && typeof window.getComputedStyle === "function"
        ? window.getComputedStyle(editor.textarea)
        : null;
    const lineHeight = Number.parseFloat(computedStyle?.lineHeight || "") || 20;
    const paddingTop = Number.parseFloat(computedStyle?.paddingTop || "") || 0;
    const paddingBottom = Number.parseFloat(computedStyle?.paddingBottom || "") || 0;
    const lineCount = Math.max(1, editor.textarea.value.split("\n").length);
    const estimatedContentHeight = Math.ceil(lineCount * lineHeight + paddingTop + paddingBottom + 4);
    const textHeight = Math.ceil(Math.max(editor.textarea.scrollHeight, estimatedContentHeight, 42));
    const textHeightPx = `${textHeight}px`;
    if (editor.textarea.style.height !== textHeightPx) {
      editor.textarea.style.height = textHeightPx;
    }
    if (editor.textarea.style.minHeight !== textHeightPx) {
      editor.textarea.style.minHeight = textHeightPx;
    }

    const imageHeight = editor.imageContainer?.classList?.contains("is-visible")
      ? Math.ceil(editor.imageContainer.scrollHeight || 0)
      : 0;
    const gapHeight = imageHeight > 0 ? 4 : 0;
    const wrapperHeight = Math.ceil(Math.max(editor.wrapper.scrollHeight || 0, textHeight + imageHeight + gapHeight, textHeight));
    const wrapperHeightPx = `${wrapperHeight}px`;
    if (editor.wrapper.style.minHeight !== wrapperHeightPx) {
      editor.wrapper.style.minHeight = wrapperHeightPx;
    }
    if (editor.cell.style.minHeight !== wrapperHeightPx) {
      editor.cell.style.minHeight = wrapperHeightPx;
    }
    if (editor.cell.style.height !== "auto") {
      editor.cell.style.height = "auto";
    }
    if (editor.row.style.height !== wrapperHeightPx) {
      editor.row.style.height = wrapperHeightPx;
    }
    if (editor.row.style.minHeight !== wrapperHeightPx) {
      editor.row.style.minHeight = wrapperHeightPx;
    }
  }

  private queueInlineEditorLayout(editor: InlineEditorState) {
    if (editor.closing) return;
    if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
      this.syncInlineEditorLayout(editor);
      return;
    }
    if (editor.layoutFrame !== null) return;
    editor.layoutFrame = window.requestAnimationFrame(() => {
      editor.layoutFrame = null;
      this.syncInlineEditorLayout(editor);
    });
  }

  private async readCellSourceValue(
    file: TFile,
    tableId: string | null,
    parsedTable: ParsedTableBlock | null,
    coord: CellCoord
  ) {
    const sourceTable = tableId
      ? this.findParsedTableForRecordId(await this.app.vault.cachedRead(file), file, tableId)
      : parsedTable;
    if (!sourceTable) return null;
    const rawTable = this.parseRawTable(sourceTable.raw);
    if (!rawTable) return null;

    const value = this.getCellValue(rawTable, coord);
    if (value === null) return null;
    return value.replace(/<br\s*\/?>/gi, "\n");
  }

  private async updateCellSourceValue(
    file: TFile,
    tableId: string | null,
    parsedTable: ParsedTableBlock | null,
    coord: CellCoord,
    nextValue: string
  ) {
    const normalizedValue = this.normalizeEditedCellValue(nextValue);
    if (tableId) {
      return this.mutateTableSource(
        file,
        tableId,
        "before-cell-edit",
        "编辑单元格",
        (rawTable) => this.setCellValue(rawTable, coord, normalizedValue)
      );
    }

    return this.mutateParsedTableSource(file, parsedTable, "before-untracked-cell-edit", (rawTable) =>
      this.setCellValue(rawTable, coord, normalizedValue)
    );
  }

  private async mutateParsedTableSource(
    file: TFile,
    parsedTable: ParsedTableBlock | null,
    snapshotReason: string,
    mutator: (rawTable: ParsedRawTable) => boolean
  ) {
    if (!parsedTable) return false;

    const content = await this.app.vault.cachedRead(file);
    const currentTables = this.parseMarkdownTables(content);
    const targetTable =
      currentTables.find(
        (table) =>
          table.startLine === parsedTable.startLine &&
          table.endLine === parsedTable.endLine &&
          table.raw === parsedTable.raw
      ) ?? currentTables.find((table) => table.startLine === parsedTable.startLine);
    if (!targetTable) return false;

    const rawTable = this.parseRawTable(targetTable.raw);
    if (!rawTable) return false;
    const didMutate = mutator(rawTable);
    if (!didMutate) return false;

    await this.createSnapshot(file, snapshotReason, []);

    const lines = content.split(/\r?\n/);
    const originalEndsWithNewline = /\r?\n$/.test(content);
    const updatedTableLines = this.buildRawTable(rawTable);
    lines.splice(targetTable.startLine, targetTable.endLine - targetTable.startLine + 1, ...updatedTableLines);
    const updatedContent = this.joinLines(lines, originalEndsWithNewline);
    await this.app.vault.modify(file, updatedContent);
    this.queueRefreshBurst();
    return true;
  }

  private async insertRows(file: TFile, tableId: string, startRow: number, count: number) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-row-insert",
      count > 1 ? "插入多行" : "插入行",
      (rawTable, layout) => {
        const bodyIndex = Math.max(0, startRow - 1);
        for (let index = 0; index < count; index += 1) {
          rawTable.body.splice(bodyIndex + index, 0, Array(rawTable.header.length).fill(""));
          this.shiftLayoutForInsertedRow(layout, startRow + index);
        }
        return true;
      }
    );
  }

  private async deleteRows(file: TFile, tableId: string, startRow: number, count: number) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-row-delete",
      count > 1 ? "删除多行" : "删除行",
      (rawTable, layout) => {
        const bodyStart = Math.max(0, startRow - 1);
        if (bodyStart >= rawTable.body.length) return false;
        rawTable.body.splice(bodyStart, count);
        for (let index = 0; index < count; index += 1) {
          this.shiftLayoutForDeletedRow(layout, startRow);
        }
        return true;
      }
    );
  }

  private async insertColumns(file: TFile, tableId: string, startCol: number, count: number) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-column-insert",
      count > 1 ? "插入多列" : "插入列",
      (rawTable, layout) => {
        const insertAt = Math.max(0, Math.min(startCol, rawTable.header.length));
        for (let index = 0; index < count; index += 1) {
          rawTable.header.splice(insertAt + index, 0, "");
          rawTable.divider.splice(insertAt + index, 0, "---");
          for (const row of rawTable.body) {
            row.splice(insertAt + index, 0, "");
          }
          this.shiftLayoutForInsertedColumn(layout, insertAt + index);
        }
        return true;
      }
    );
  }

  private async deleteColumns(file: TFile, tableId: string, startCol: number, count: number) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-column-delete",
      count > 1 ? "删除多列" : "删除列",
      (rawTable, layout) => {
        if (rawTable.header.length <= count) return false;
        const deleteAt = Math.max(0, Math.min(startCol, rawTable.header.length - 1));
        rawTable.header.splice(deleteAt, count);
        rawTable.divider.splice(deleteAt, count);
        for (const row of rawTable.body) {
          row.splice(deleteAt, count);
        }
        for (let index = 0; index < count; index += 1) {
          this.shiftLayoutForDeletedColumn(layout, deleteAt);
        }
        return true;
      }
    );
  }

  private async runNativeLayoutAdvancedTableOperation(
    context: ReturnType<MarkdownTableEnhancerPlugin["getActiveNativeLayoutCommandContext"]>,
    operation: AdvancedTableOperation
  ) {
    if (!context) return false;
    const row = context.coord.row;
    const col = context.coord.col;

    switch (operation) {
      case "format-table":
        return this.formatNativeLayoutTable(context.file, context.tableId);
      case "insert-row":
        return this.insertRows(context.file, context.tableId, Math.max(1, row), 1);
      case "insert-column":
        return this.insertColumns(context.file, context.tableId, col, 1);
      case "delete-row":
        if (row <= 0) {
          new Notice("表头行不能删除");
          return true;
        }
        return this.deleteRows(context.file, context.tableId, row, 1);
      case "delete-column":
        return this.deleteColumns(context.file, context.tableId, col, 1);
      case "move-row-up":
        return this.moveNativeLayoutRow(context.file, context.tableId, row, -1);
      case "move-row-down":
        return this.moveNativeLayoutRow(context.file, context.tableId, row, 1);
      case "move-column-left":
        return this.moveNativeLayoutColumn(context.file, context.tableId, col, -1);
      case "move-column-right":
        return this.moveNativeLayoutColumn(context.file, context.tableId, col, 1);
      case "sort-rows-ascending":
        return this.sortNativeLayoutRows(context.file, context.tableId, col, "ascending");
      case "sort-rows-descending":
        return this.sortNativeLayoutRows(context.file, context.tableId, col, "descending");
      case "transpose":
        return this.transposeNativeLayoutTable(context.file, context.tableId);
      case "evaluate-formulas":
        return this.evaluateNativeLayoutInlineFormulas(context.file, context.tableId);
      case "left-align-column":
      case "center-align-column":
      case "right-align-column": {
        const alignment =
          operation === "left-align-column" ? "left" : operation === "center-align-column" ? "center" : "right";
        await this.setNativeLayoutCellRangeAlignment(
          context.tableId,
          context.file,
          context.tableEl,
          context.selection,
          context.coord,
          alignment,
          "column"
        );
        return true;
      }
      default:
        return false;
    }
  }

  private async formatNativeLayoutTable(file: TFile, tableId: string) {
    return this.mutateTableSource(file, tableId, "before-table-format", "格式化表格", () => true);
  }

  private async moveNativeLayoutRow(file: TFile, tableId: string, rowIndex: number, offset: -1 | 1) {
    if (rowIndex <= 0) {
      new Notice("表头行不能移动");
      return true;
    }
    return this.mutateTableSource(
      file,
      tableId,
      "before-row-move",
      offset < 0 ? "上移行" : "下移行",
      (rawTable, layout) => {
        const fromBodyIndex = rowIndex - 1;
        const toBodyIndex = fromBodyIndex + offset;
        if (fromBodyIndex < 0 || fromBodyIndex >= rawTable.body.length) return false;
        if (toBodyIndex < 0 || toBodyIndex >= rawTable.body.length) return false;
        const [row] = rawTable.body.splice(fromBodyIndex, 1);
        rawTable.body.splice(toBodyIndex, 0, row);
        this.moveNativeLayoutRowMetadata(layout, rowIndex, toBodyIndex + 1);
        return true;
      }
    );
  }

  private async moveNativeLayoutColumn(file: TFile, tableId: string, colIndex: number, offset: -1 | 1) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-column-move",
      offset < 0 ? "左移列" : "右移列",
      (rawTable, layout) => {
        const toIndex = colIndex + offset;
        if (colIndex < 0 || colIndex >= rawTable.header.length) return false;
        if (toIndex < 0 || toIndex >= rawTable.header.length) return false;
        this.moveArrayItem(rawTable.header, colIndex, toIndex);
        this.moveArrayItem(rawTable.divider, colIndex, toIndex);
        for (const row of rawTable.body) {
          this.moveArrayItem(row, colIndex, toIndex);
        }
        this.moveNativeLayoutColumnMetadata(layout, colIndex, toIndex);
        return true;
      }
    );
  }

  private async sortNativeLayoutRows(
    file: TFile,
    tableId: string,
    colIndex: number,
    direction: "ascending" | "descending"
  ) {
    return this.mutateTableSource(
      file,
      tableId,
      `before-row-sort-${direction}`,
      direction === "ascending" ? "升序排序" : "降序排序",
      (rawTable, layout) => {
        if (rawTable.body.length <= 1) return false;
        const indexedRows = rawTable.body.map((row, index) => ({ row, index }));
        const values = indexedRows.map((item) => this.normalizeSortCellValue(item.row[colIndex] ?? ""));
        const numeric = values.every((value) => value !== "" && Number.isFinite(Number(value)));
        indexedRows.sort((a, b) => {
          const aValue = this.normalizeSortCellValue(a.row[colIndex] ?? "");
          const bValue = this.normalizeSortCellValue(b.row[colIndex] ?? "");
          const base = numeric
            ? Number(aValue) - Number(bValue)
            : aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: "base" });
          if (base !== 0) return direction === "ascending" ? base : -base;
          return a.index - b.index;
        });
        const nextOrder = indexedRows.map((item) => item.index);
        const changed = nextOrder.some((oldIndex, newIndex) => oldIndex !== newIndex);
        if (!changed) return false;
        rawTable.body = indexedRows.map((item) => item.row);
        this.reorderNativeLayoutBodyRowMetadata(layout, nextOrder);
        return true;
      }
    );
  }

  private async transposeNativeLayoutTable(file: TFile, tableId: string) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-table-transpose",
      "转置表格",
      (rawTable, layout) => {
        const matrix = [rawTable.header, ...rawTable.body];
        const colCount = Math.max(1, ...matrix.map((row) => row.length));
        const normalized = matrix.map((row) => this.normalizeRowCells(row, colCount));
        const transposed = Array.from({ length: colCount }, (_, col) => normalized.map((row) => row[col] ?? ""));
        if (transposed.length === 0) return false;
        rawTable.header = transposed[0] ?? [""];
        rawTable.divider = Array(rawTable.header.length).fill("---");
        rawTable.body = transposed.slice(1).map((row) => this.normalizeRowCells(row, rawTable.header.length));
        this.transposeNativeLayoutMetadata(layout);
        return true;
      }
    );
  }

  private async evaluateNativeLayoutInlineFormulas(file: TFile, tableId: string) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-formula-evaluate",
      "计算公式",
      (rawTable) => {
        const matrix = this.buildRawTableMatrix(rawTable);
        let changed = false;
        for (let row = 0; row < matrix.length; row += 1) {
          for (let col = 0; col < (matrix[row]?.length ?? 0); col += 1) {
            const value = matrix[row]?.[col] ?? "";
            if (!value.trim().startsWith("=")) continue;
            const result = evaluateNativeTableFormula(value, matrix, { row, col });
            if (!result) continue;
            if (this.setCellValue(rawTable, { row, col }, result.value)) {
              matrix[row][col] = result.value;
              changed = true;
            }
          }
        }
        return changed;
      }
    );
  }

  private async setNativeLayoutColumnAlignment(
    file: TFile,
    tableEl: HTMLTableElement,
    tableId: string,
    colIndex: number,
    alignment: "left" | "center" | "right"
  ) {
    const structure = this.collectTableStructure(tableEl);
    const maxRow = Math.max(0, structure.rows.length - 1);
    await this.setNativeLayoutCellRangeAlignment(
      tableId,
      file,
      tableEl,
      {
        startRow: 0,
        endRow: maxRow,
        startCol: colIndex,
        endCol: colIndex,
      },
      { row: 0, col: colIndex },
      alignment
    );
  }

  private async exportNativeLayoutTableCsv(file: TFile, tableId: string, withHeaders: boolean) {
    const content = await this.app.vault.cachedRead(file);
    const parsedTable = this.findParsedTableForRecordId(content, file, tableId);
    if (!parsedTable) return null;
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return null;
    const rows = withHeaders ? [rawTable.header, ...rawTable.body] : rawTable.body;
    return rows.map((row) => row.map((cell) => String(cell ?? "").replace(/<br\s*\/?>/gi, "\n")).join("\t")).join("\n");
  }

  private async appendImageToCell(file: TFile, tableId: string, coord: CellCoord, imageMarkup: string) {
    const currentValue = await this.readCellSourceValue(file, tableId, null, coord);
    const nextValue = this.composeNextCellValueWithImage(currentValue, imageMarkup);
    return this.updateCellSourceValue(file, tableId, null, coord, nextValue);
  }

  private async appendImageToUninitializedCell(
    file: TFile,
    parsedTable: ParsedTableBlock | null,
    coord: CellCoord,
    imageMarkup: string
  ) {
    const currentValue = await this.readCellSourceValue(file, null, parsedTable, coord);
    const nextValue = this.composeNextCellValueWithImage(currentValue, imageMarkup);
    return this.updateCellSourceValue(file, null, parsedTable, coord, nextValue);
  }

  private composeNextCellValueWithImage(currentValue: string | null, imageMarkup: string) {
    const normalizedImage = imageMarkup.trim();
    const current = (currentValue ?? "").trim();
    if (!current) return normalizedImage;
    if (!this.isExperimentalFeatureEnabled()) {
      return `${current}\n${normalizedImage}`;
    }
    if (this.containsImageMarkup(current)) {
      return `${current}\n${normalizedImage}`;
    }
    return `${current}\n\n${normalizedImage}`;
  }

  private getTextFromClipboardEvent(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return "";
    const plainText = clipboardData.getData("text/plain");
    if (plainText?.trim()) return plainText;
    for (const type of Array.from(clipboardData.types ?? [])) {
      if (/html/i.test(type)) continue;
      if (!/(?:text|plain|utf|string|unicode)/i.test(type)) continue;
      const value = clipboardData.getData(type);
      if (value?.trim()) return value;
    }
    return "";
  }

  private getHtmlFromClipboardEvent(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return "";
    const direct = clipboardData.getData("text/html");
    if (direct?.trim()) return this.extractHtmlFragmentFromClipboardPayload(direct);
    for (const type of Array.from(clipboardData.types ?? [])) {
      if (type === "text/plain") continue;
      if (!/html/i.test(type) && type !== "public.html") continue;
      const value = clipboardData.getData(type);
      if (value?.trim()) return this.extractHtmlFragmentFromClipboardPayload(value);
    }
    return "";
  }

  private async resolveOneNoteClipboardHtml(event?: ClipboardEvent): Promise<string> {
    let html = event ? this.getHtmlFromClipboardEvent(event) : "";
    if (!html.trim()) {
      html = await this.readHtmlFromAvailableClipboard();
    }
    if (!html.trim()) {
      const plain = event ? this.getTextFromClipboardEvent(event) : "";
      const text = plain.trim() ? plain : await this.readTextFromAvailableClipboard();
      html = this.plainTextTableToSyntheticHtml(text);
    }
    return html.trim();
  }

  private extractHtmlFragmentFromClipboardPayload(text: string): string {
    const normalized = text.replace(/\r\n?/g, "\n");
    const startMarker = normalized.indexOf("StartFragment");
    const endMarker = normalized.indexOf("EndFragment");
    if (startMarker >= 0 && endMarker > startMarker) {
      const fragmentStart = normalized.indexOf("<", startMarker);
      const fragmentEnd = normalized.lastIndexOf(">", endMarker);
      if (fragmentStart >= 0 && fragmentEnd > fragmentStart) {
        return normalized.slice(fragmentStart, fragmentEnd + 1);
      }
    }
    const htmlStart = normalized.search(/<(?:html|table|div|meta|body)/i);
    if (htmlStart >= 0) return normalized.slice(htmlStart);
    return normalized;
  }

  private decodeClipboardHtmlBuffer(buffer: unknown): string {
    if (!buffer) return "";
    let bytes: Uint8Array;
    const bufferAny = buffer as { length?: number; byteLength?: number; buffer?: ArrayBuffer };
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(buffer)) {
      bytes = buffer;
    } else if (bufferAny instanceof Uint8Array) {
      bytes = bufferAny;
    } else if (bufferAny?.buffer instanceof ArrayBuffer) {
      bytes = new Uint8Array(bufferAny.buffer);
    } else if (typeof bufferAny?.length === "number" && bufferAny.length > 0) {
      bytes = Uint8Array.from(buffer as ArrayLike<number>);
    } else {
      return "";
    }
    const decode = (encoding: "utf8" | "utf16le") => {
      if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString(encoding);
      }
      const label = encoding === "utf16le" ? "utf-16le" : "utf-8";
      return new TextDecoder(label).decode(bytes);
    };
    let text = decode("utf8");
    if (!/<(?:html|table|div|meta|body)/i.test(text)) {
      const utf16 = decode("utf16le");
      if (/<(?:html|table|div|meta|body)/i.test(utf16)) text = utf16;
    }
    return this.extractHtmlFragmentFromClipboardPayload(text);
  }

  private readHtmlBufferFromElectronFormat(clipboard: { readBuffer?: (format: string) => unknown }, format: string) {
    if (typeof clipboard.readBuffer !== "function") return "";
    try {
      const buffer = clipboard.readBuffer(format);
      if (!buffer) return "";
      const size =
        (buffer as { length?: number }).length ?? (buffer as { byteLength?: number }).byteLength ?? 0;
      if (!size) return "";
      return this.decodeClipboardHtmlBuffer(buffer);
    } catch {
      return "";
    }
  }

  private readHtmlFromElectronClipboard(): string {
    try {
      const electron = (window as any).require?.("electron");
      const clipboard = electron?.clipboard;
      if (!clipboard) return "";

      const preferredFormats = [
        "public.html",
        "Apple HTML pasteboard type",
        "NSHTMLPboardType",
        "text/html",
        "HTML Format",
      ];
      const available = new Set<string>(clipboard.availableFormats?.() ?? []);

      for (const format of preferredFormats) {
        if (!available.has(format)) continue;
        const html = this.readHtmlBufferFromElectronFormat(clipboard, format);
        if (html.trim()) return html;
      }

      for (const format of available) {
        if (preferredFormats.includes(format)) continue;
        if (!/html/i.test(format) && format !== "public.html") continue;
        const html = this.readHtmlBufferFromElectronFormat(clipboard, format);
        if (html.trim()) return html;
      }

      if (typeof clipboard.readHTML === "function") {
        const html = clipboard.readHTML();
        if (html?.trim()) return this.extractHtmlFragmentFromClipboardPayload(html);
      }
    } catch (error) {
      console.error("[mdtp] electron clipboard readHTML failed", error);
    }
    return "";
  }

  private async readHtmlFromAvailableClipboard() {
    const fromElectron = this.readHtmlFromElectronClipboard();
    if (fromElectron.trim()) return fromElectron;

    try {
      const clipboardAny = navigator.clipboard as Clipboard;
      if (typeof clipboardAny?.read === "function") {
        const items = await clipboardAny.read();
        for (const item of items) {
          for (const type of Array.from(item.types ?? [])) {
            if (!/html/i.test(type) && type !== "public.html") continue;
            try {
              const blob = await item.getType(type);
              const html = await blob.text();
              const extracted = this.extractHtmlFragmentFromClipboardPayload(html);
              if (extracted.trim()) return extracted;
            } catch {
              // type not readable in this context
            }
          }
        }
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard readHTML failed", error);
    }

    return "";
  }

  private escapeHtmlForOneNotePaste(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private plainTextTableToSyntheticHtml(text: string): string {
    const matrix = this.parseClipboardMatrix(text);
    if (!matrix?.length) return "";
    const rows = matrix
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${this.escapeHtmlForOneNotePaste(cell)}</td>`)
            .join("")}</tr>`
      )
      .join("");
    return `<table><tbody>${rows}</tbody></table>`;
  }

  private async readTextFromAvailableClipboard() {
    try {
      if (typeof navigator.clipboard?.readText === "function") {
        const text = await navigator.clipboard.readText();
        if (text) return text;
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard readText failed", error);
    }

    try {
      const electron = (window as any).require?.("electron");
      if (typeof electron?.clipboard?.readText === "function") {
        const text = electron.clipboard.readText();
        if (text) return text;
      }
    } catch (error) {
      console.error("[mdtp] electron clipboard readText failed", error);
    }

    return "";
  }

  private parseClipboardMatrix(text: string) {
    const normalized = text
      .replace(/\r\n?/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
    if (!normalized.trim()) return null;

    const lines = normalized.split("\n");
    if (lines.length >= 2 && this.isLikelyTableHeader(lines[0] ?? "", lines[1] ?? "")) {
      const rawTable = this.parseRawTable(normalized);
      if (rawTable) {
        return [rawTable.header, ...rawTable.body].map((row) =>
          row.map((value) => value.replace(/<br\s*\/?>/gi, "\n"))
        );
      }
    }

    return lines.map((line) => line.split("\t"));
  }

  private parseClipboardHtmlMatrix(html: string) {
    if (!html || !/<table[\s>]/i.test(html)) return null;

    if (typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const table = doc.querySelector("table");
      if (table) {
        const rows = Array.from(table.querySelectorAll("tr"));
        const matrix = rows
          .map((row) =>
            Array.from(row.querySelectorAll("th, td")).map((cell) => this.extractHtmlCellText(cell as HTMLElement))
          )
          .filter((row) => row.length > 0);
        if (matrix.length > 0) return matrix;
      }
    }

    return this.parseClipboardHtmlTableWithRegex(html);
  }

  private parseClipboardHtmlTableWithRegex(html: string) {
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) return null;
    const rows: string[][] = [];
    const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
    for (const rowMatch of tableMatch[0].matchAll(rowPattern)) {
      const rowHtml = rowMatch[0] ?? "";
      const cells: string[] = [];
      const cellPattern = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      for (const cellMatch of rowHtml.matchAll(cellPattern)) {
        cells.push(this.normalizeHtmlCellText(cellMatch[1] ?? ""));
      }
      if (cells.length > 0) rows.push(cells);
    }
    return rows.length > 0 ? rows : null;
  }

  private extractHtmlCellText(cell: HTMLElement) {
    const clone = cell.cloneNode(true) as HTMLElement;
    for (const br of Array.from(clone.querySelectorAll("br"))) {
      br.replaceWith("\n");
    }
    for (const block of Array.from(clone.querySelectorAll("p, div, li"))) {
      block.appendChild(document.createTextNode("\n"));
    }
    for (const image of Array.from(clone.querySelectorAll("img"))) {
      const alt = image.getAttribute("alt")?.trim();
      image.replaceWith(alt ? `[图片:${alt}]` : "[图片]");
    }
    return this.normalizeHtmlCellText(clone.textContent ?? "");
  }

  private normalizeHtmlCellText(value: string) {
    return value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private async pasteMatrixIntoTable(file: TFile, tableId: string, anchor: CellCoord, matrix: string[][]) {
    if (matrix.length === 0) return false;
    return this.mutateTableSource(
      file,
      tableId,
      "before-table-paste",
      "粘贴表格内容",
      (rawTable) => {
        const nextColCount = Math.max(
          rawTable.header.length,
          ...matrix.map((row, rowIndex) => {
            const targetRow = anchor.row + rowIndex;
            const startCol = targetRow === 0 ? anchor.col : anchor.col;
            return startCol + row.length;
          })
        );

        while (rawTable.header.length < nextColCount) {
          rawTable.header.push("");
          rawTable.divider.push("---");
          for (const row of rawTable.body) {
            row.push("");
          }
        }

        const requiredBodyRows = Math.max(0, anchor.row + matrix.length - 1);
        while (rawTable.body.length < requiredBodyRows) {
          rawTable.body.push(Array(rawTable.header.length).fill(""));
        }

        for (let matrixRowIndex = 0; matrixRowIndex < matrix.length; matrixRowIndex += 1) {
          const values = matrix[matrixRowIndex] ?? [];
          const targetRow = anchor.row + matrixRowIndex;
          for (let matrixColIndex = 0; matrixColIndex < values.length; matrixColIndex += 1) {
            const nextValue = this.normalizeEditedCellValue(values[matrixColIndex] ?? "");
            const didSet = this.setCellValue(rawTable, { row: targetRow, col: anchor.col + matrixColIndex }, nextValue);
            if (!didSet) return false;
          }
        }
        return true;
      }
    );
  }

  private async pasteMatrixIntoUninitializedTable(
    file: TFile,
    parsedTable: ParsedTableBlock | null,
    anchor: CellCoord,
    matrix: string[][]
  ) {
    if (matrix.length === 0) return false;
    return this.mutateParsedTableSource(file, parsedTable, "before-untracked-table-paste", (rawTable) => {
      const nextColCount = Math.max(rawTable.header.length, ...matrix.map((row) => anchor.col + row.length));

      while (rawTable.header.length < nextColCount) {
        rawTable.header.push("");
        rawTable.divider.push("---");
        for (const row of rawTable.body) {
          row.push("");
        }
      }

      const requiredBodyRows = Math.max(0, anchor.row + matrix.length - 1);
      while (rawTable.body.length < requiredBodyRows) {
        rawTable.body.push(Array(rawTable.header.length).fill(""));
      }

      for (let matrixRowIndex = 0; matrixRowIndex < matrix.length; matrixRowIndex += 1) {
        const values = matrix[matrixRowIndex] ?? [];
        const targetRow = anchor.row + matrixRowIndex;
        for (let matrixColIndex = 0; matrixColIndex < values.length; matrixColIndex += 1) {
          const nextValue = this.normalizeEditedCellValue(values[matrixColIndex] ?? "");
          const didSet = this.setCellValue(rawTable, { row: targetRow, col: anchor.col + matrixColIndex }, nextValue);
          if (!didSet) return false;
        }
      }
      return true;
    });
  }

  private async copySelectionToClipboard(file: TFile, tableId: string, selection: SelectionRect) {
    const matrix = await this.readSelectionSourceMatrix(file, tableId, selection, { preserveRaw: true });
    if (!matrix) return false;
    const text = this.buildClipboardTextFromMatrix(matrix);
    return this.writeTextToClipboard(text);
  }

  private async copySelectionToClipboardHighFidelity(file: TFile, tableId: string, selection: SelectionRect) {
    const matrix = await this.readSelectionSourceMatrix(file, tableId, selection, { preserveRaw: true });
    if (!matrix) return false;
    const text = this.buildHighFidelityClipboardTextFromMatrix(matrix);
    return this.writeTextToClipboard(text);
  }

  private async clearSelectionContents(file: TFile, tableId: string, selection: SelectionRect) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-clear-selection",
      "清空单元格内容",
      (rawTable) => {
        let didMutate = false;
        for (let row = selection.startRow; row <= selection.endRow; row += 1) {
          for (let col = selection.startCol; col <= selection.endCol; col += 1) {
            const currentValue = this.getCellValue(rawTable, { row, col });
            if (this.isMeaningfullyEmptyCellValue(currentValue)) continue;
            const didSet = this.setCellValue(rawTable, { row, col }, "");
            if (!didSet) return false;
            didMutate = true;
          }
        }
        return didMutate;
      }
    );
  }

  private async copyWholeTableToClipboard(file: TFile, tableId: string) {
    if (!tableId) return false;
    const content = await this.app.vault.cachedRead(file);
    const parsedTable = this.findParsedTableForRecordId(content, file, tableId);
    if (!parsedTable) return false;
    return this.writeTextToClipboard(`\n${parsedTable.raw}\n`);
  }

  private async copySelectionToClipboardFromParsedTable(parsedTable: ParsedTableBlock | null, selection: SelectionRect) {
    if (!parsedTable) return false;
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return false;

    const matrix: string[][] = [];
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      const values: string[] = [];
      for (let col = selection.startCol; col <= selection.endCol; col += 1) {
        const value = this.getCellValue(rawTable, { row, col }) ?? "";
        values.push(value);
      }
      matrix.push(values);
    }

    return this.writeTextToClipboard(this.buildClipboardTextFromMatrix(matrix));
  }

  private async readSelectionSourceMatrix(
    file: TFile,
    tableId: string,
    selection: SelectionRect,
    options?: { preserveRaw?: boolean }
  ) {
    const content = await this.app.vault.cachedRead(file);
    const parsedTable = this.findParsedTableForRecordId(content, file, tableId);
    if (!parsedTable) return null;
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return null;

    const matrix: string[][] = [];
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      const values: string[] = [];
      for (let col = selection.startCol; col <= selection.endCol; col += 1) {
        const value = this.getCellValue(rawTable, { row, col }) ?? "";
        values.push(options?.preserveRaw ? value : value.replace(/<br\s*\/?>/gi, "\n"));
      }
      matrix.push(values);
    }
    return matrix;
  }

  private buildClipboardTextFromMatrix(matrix: string[][]) {
    if (matrix.length === 0) return "";
    const normalized = matrix.map((row) => row.map((value) => value ?? ""));
    const rowCount = normalized.length;
    const colCount = Math.max(...normalized.map((row) => row.length), 0);

    if (rowCount <= 1 && colCount <= 1) {
      return this.normalizeClipboardCellForPlainText(normalized[0]?.[0] ?? "");
    }

    const rawTable: ParsedRawTable = {
      header: this.normalizeRowCells(normalized[0] ?? [], colCount),
      divider: Array(colCount).fill("---"),
      body: normalized.slice(1).map((row) => this.normalizeRowCells(row, colCount)),
    };

    return `\n${this.buildRawTable(rawTable).join("\n")}\n`;
  }

  private buildHighFidelityClipboardTextFromMatrix(matrix: string[][]) {
    if (matrix.length === 0) return "";
    const normalized = matrix.map((row) => row.map((value) => value ?? ""));
    const rowCount = normalized.length;
    const colCount = Math.max(...normalized.map((row) => row.length), 0);

    if (rowCount <= 1 && colCount <= 1) {
      const value = normalized[0]?.[0] ?? "";
      if (this.isHighFidelityBodyCandidate(value)) {
        return this.buildRichClipboardMarkdownBody(value);
      }
      return this.normalizeClipboardCellForPlainText(value);
    }

    return this.buildClipboardTextFromMatrix(matrix);
  }

  private normalizeClipboardCellForPlainText(value: string) {
    return value.replace(/<br\s*\/?>/gi, "\n");
  }

  private isMeaningfullyEmptyCellValue(value: string | null | undefined) {
    if (value == null) return true;
    const normalized = this.normalizeClipboardCellForPlainText(value)
      .replace(/!\[\[[^[\]]+?\]\]/g, "__image__")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "__image__")
      .replace(/&nbsp;/gi, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
    return normalized.length === 0;
  }

  private isHighFidelityBodyCandidate(value: string) {
    const normalized = this.normalizeClipboardCellForPlainText(value).trim();
    if (!normalized) return false;
    if (/!\[\[[^\]]+\]\]/.test(normalized)) return true;
    return /!\[[^\]]*\]\([^)]+\)/.test(normalized);
  }

  private isStandaloneImageLine(value: string) {
    if (!value) return false;
    return /^!\[\[[^[\]]+?\]\]$/.test(value) || /^!\[[^\]]*\]\([^)]+\)$/.test(value);
  }

  private buildRichClipboardMarkdownBody(value: string) {
    const normalized = this.normalizeClipboardCellForPlainText(value).trim();
    if (!normalized) return "";

    const lines = normalized.split("\n");
    const blocks: string[] = [];
    let paragraph: string[] = [];
    const flushParagraph = () => {
      if (paragraph.length === 0) return;
      const content = paragraph.join("\n").trim();
      if (content) blocks.push(content);
      paragraph = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        continue;
      }

      const segments = this.splitHighFidelityLineSegments(line);
      let lineHadImage = false;
      if (segments.length === 0) {
        flushParagraph();
        continue;
      }

      for (const segment of segments) {
        if (segment.kind === "image") {
          lineHadImage = true;
          flushParagraph();
          blocks.push(segment.value);
          continue;
        }
        paragraph.push(segment.value.replace(/\s{2,}/g, " ").trim());
      }

      if (lineHadImage) {
        flushParagraph();
      }
    }

    flushParagraph();
    if (blocks.length === 0) return "";
    return `\n${blocks.join("\n\n")}\n`;
  }

  private splitHighFidelityLineSegments(line: string) {
    const segments: Array<{ kind: "text" | "image"; value: string }> = [];
    const pattern = /!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/g;
    let lastIndex = 0;

    for (const match of line.matchAll(pattern)) {
      const matchedText = match[0] ?? "";
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        const textValue = line.slice(lastIndex, matchIndex).trim();
        if (textValue) {
          segments.push({ kind: "text", value: textValue });
        }
      }
      if (matchedText.trim()) {
        segments.push({ kind: "image", value: matchedText.trim() });
      }
      lastIndex = matchIndex + matchedText.length;
    }

    if (lastIndex < line.length) {
      const tail = line.slice(lastIndex).trim();
      if (tail) {
        segments.push({ kind: "text", value: tail });
      }
    }

    if (segments.length === 0) {
      const trimmed = line.trim();
      if (trimmed) {
        segments.push({ kind: "text", value: trimmed });
      }
    }

    return segments;
  }

  private async writeTextToClipboard(text: string) {
    try {
      if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard write failed", error);
    }

    try {
      const electron = (window as any).require?.("electron");
      if (typeof electron?.clipboard?.writeText === "function") {
        electron.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.error("[mdtp] electron clipboard write failed", error);
    }

    try {
      if (navigator.userAgent.toLowerCase().includes("mac")) {
        const execFile = (window as any)?.require?.("child_process")?.execFile;
        if (typeof execFile === "function") {
          await new Promise<void>((resolve, reject) => {
            const child = execFile("/usr/bin/pbcopy", (error: Error | null) => {
              if (error) {
                reject(error);
                return;
              }
              resolve();
            });
            child?.stdin?.on("error", reject);
            child?.stdin?.end(text);
          });
          return true;
        }
      }
    } catch (error) {
      console.error("[mdtp] pbcopy write failed", error);
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      textarea.style.left = "-1000px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const succeeded = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (succeeded) return true;
    } catch (error) {
      console.error("[mdtp] execCommand copy failed", error);
    }

    return false;
  }

  async copyTextToSystemClipboard(text: string) {
    return this.writeTextToClipboard(text);
  }

  private async copyTableAsImage(tableEl: HTMLTableElement) {
    const execFile = (window as any)?.require?.("child_process")?.execFile;
    if (typeof execFile !== "function") return false;
    if (!navigator.userAgent.toLowerCase().includes("mac")) return false;

    const hiddenElements = this.hideExportOnlyChrome();
    const rect = tableEl.getBoundingClientRect();
    const captureLeft = Math.max(0, rect.left);
    const captureTop = Math.max(0, rect.top);
    const captureRight = Math.min(window.innerWidth, rect.right);
    const captureBottom = Math.min(window.innerHeight, rect.bottom);
    const width = Math.max(1, Math.ceil(captureRight - captureLeft));
    const height = Math.max(1, Math.ceil(captureBottom - captureTop));

    const outerDeltaX = Math.max(0, window.outerWidth - window.innerWidth);
    const outerDeltaY = Math.max(0, window.outerHeight - window.innerHeight);
    const borderX = Math.round(outerDeltaX / 2);
    const titleBarY = Math.max(0, outerDeltaY - borderX);

    const screenX = Math.round(window.screenX + captureLeft + borderX);
    const screenY = Math.round(window.screenY + captureTop + titleBarY);
    const region = `-R${screenX},${screenY},${width},${height}`;

    try {
      await new Promise<void>((resolve, reject) => {
        execFile("/usr/sbin/screencapture", ["-x", "-c", region], (error: Error | null) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      return true;
    } catch (error) {
      console.error("[mdtp] copy table as image failed", error);
      return false;
    } finally {
      hiddenElements.forEach(({ element, visibility }) => {
        element.style.visibility = visibility;
      });
    }
  }

  private hideExportOnlyChrome() {
    const selectors = [
      ".mdtp-sidebar-handle",
      ".mdtp-sidebar-popover",
      ".mdtp-image-manipulator",
      ".mdtp-inline-editor",
      ".menu",
      ".popover",
    ];
    const elements = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector))
    );
    const unique = Array.from(new Set(elements));
    return unique.map((element) => {
      const visibility = element.style.visibility;
      element.style.visibility = "hidden";
      return { element, visibility };
    });
  }

  private async mutateTableSource(
    file: TFile,
    tableId: string,
    snapshotReason: string,
    historyLabel: string,
    mutator: (rawTable: ParsedRawTable, layout: TableLayoutMetadata) => boolean
  ) {
    const record = this.dataStore.tables[tableId];
    if (!record) return false;

    const content = await this.app.vault.cachedRead(file);
    const parsedTables = this.parseMarkdownTables(content);
    const targetTable = this.findParsedTableForRecordId(content, file, tableId);
    if (!targetTable) return false;

    const rawTable = this.parseRawTable(targetTable.raw);
    if (!rawTable) return false;

    const before = this.captureHistoryStateFromContent(file.path, content, [tableId]);
    const didMutate = mutator(rawTable, record.layout);
    if (!didMutate) return false;

    await this.createSnapshot(file, snapshotReason, [tableId]);

    const lines = content.split(/\r?\n/);
    const originalEndsWithNewline = /\r?\n$/.test(content);
    const updatedTableLines = this.buildRawTable(rawTable);
    lines.splice(targetTable.startLine, targetTable.endLine - targetTable.startLine + 1, ...updatedTableLines);

    const updatedContent = this.joinLines(lines, originalEndsWithNewline);
    record.updatedAt = Date.now();
    await this.app.vault.modify(file, updatedContent);
    await this.savePluginData();
    const updatedTables = this.parseMarkdownTables(updatedContent);
    await this.syncTableRecords(file, updatedTables);
    const after = this.captureHistoryStateFromContent(file.path, updatedContent, [tableId]);
    this.pushHistoryEntry({
      label: historyLabel,
      filePath: file.path,
      tableIds: [tableId],
      before,
      after,
    });
    this.queueRefreshBurst();
    return true;
  }

  private findFirstNonEmptyCellInSelection(
    table: ParsedRawTable,
    selection: SelectionRect,
    anchor: CellCoord
  ) {
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      for (let col = selection.startCol; col <= selection.endCol; col += 1) {
        if (row === anchor.row && col === anchor.col) continue;
        const value = this.getCellValue(table, { row, col }) ?? "";
        if (!this.isMeaningfullyEmptyCellValue(value)) {
          return {
            coord: { row, col },
            value,
          };
        }
      }
    }
    return null;
  }

  private parseRawTable(raw: string): ParsedRawTable | null {
    const lines = raw.split(/\r?\n/);
    if (lines.length < 2) return null;
    const header = this.parseTableRowLine(lines[0]);
    if (header.length === 0) return null;
    const divider = this.parseDividerRowLine(lines[1], header.length);
    const body = lines.slice(2).map((line) => this.normalizeRowCells(this.parseTableRowLine(line), header.length));
    return {
      header: this.normalizeRowCells(header, header.length),
      divider,
      body,
    };
  }

  private buildRawTableMatrix(table: ParsedRawTable) {
    return [table.header, ...table.body];
  }

  private parseDividerRowLine(line: string, expectedLength: number) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    const segments = trimmed
      .split("|")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
    while (segments.length < expectedLength) {
      segments.push("---");
    }
    return segments.slice(0, expectedLength);
  }

  private parseTableRowLine(line: string) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    const cells: string[] = [];
    let current = "";
    let wikiLinkDepth = 0;
    for (let index = 0; index < trimmed.length; index += 1) {
      const char = trimmed[index];
      const nextChar = trimmed[index + 1];
      if (char === "\\" && (nextChar === "|" || nextChar === "\\")) {
        current += nextChar;
        index += 1;
        continue;
      }

      if (char === "[" && nextChar === "[") {
        wikiLinkDepth += 1;
        current += "[[";
        index += 1;
        continue;
      }

      if (char === "]" && nextChar === "]" && wikiLinkDepth > 0) {
        wikiLinkDepth -= 1;
        current += "]]";
        index += 1;
        continue;
      }

      if (char === "|" && wikiLinkDepth === 0) {
        cells.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    cells.push(current.trim());
    return cells;
  }

  private normalizeRowCells(cells: string[], length: number) {
    const next = [...cells];
    while (next.length < length) {
      next.push("");
    }
    return next.slice(0, length);
  }

  private getCellValue(table: ParsedRawTable, coord: CellCoord) {
    if (coord.col < 0) return null;
    if (coord.row === 0) {
      return table.header[coord.col] ?? null;
    }
    const bodyRow = table.body[coord.row - 1];
    if (!bodyRow) return null;
    return bodyRow[coord.col] ?? null;
  }

  private setCellValue(table: ParsedRawTable, coord: CellCoord, value: string) {
    if (coord.col < 0) return false;
    if (coord.row === 0) {
      if (coord.col >= table.header.length) return false;
      table.header[coord.col] = value;
      return true;
    }

    const bodyRow = table.body[coord.row - 1];
    if (!bodyRow || coord.col >= bodyRow.length) return false;
    bodyRow[coord.col] = value;
    return true;
  }

  private normalizeEditedCellValue(value: string) {
    return value.replace(/\r\n?/g, "\n").replace(/\n/g, "<br>");
  }

  private buildRawTable(table: ParsedRawTable) {
    const columnCount = table.header.length;
    const rows = [table.header, ...table.body];
    const widths = Array.from({ length: columnCount }, (_, index) =>
      Math.max(
        3,
        ...rows.map((row) => this.escapeMarkdownTableCell(row[index] ?? "").length)
      )
    );

    return [
      this.buildTableLine(table.header, widths),
      this.buildDividerLine(table.divider, widths),
      ...table.body.map((row) => this.buildTableLine(row, widths)),
    ];
  }

  private buildOneNoteRawTable(table: ParsedRawTable) {
    return [
      this.buildOneNoteTableLine(table.header),
      this.buildOneNoteDividerLine(table.header.length),
      ...table.body.map((row) => this.buildOneNoteTableLine(this.normalizeRowCells(row, table.header.length))),
    ];
  }

  private buildOneNoteTableLine(cells: string[]) {
    const parts = cells.map((cell) =>
      this.escapeMarkdownTableCell(
        this.stripImageWidthFromTableCell(this.normalizeOneNoteMarkdownTableCell(cell))
      )
    );
    return `| ${parts.join(" | ")} |`;
  }

  private buildOneNoteDividerLine(columnCount: number) {
    return `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`;
  }

  private normalizeOneNoteMarkdownTableCell(value: string) {
    return value
      .replace(/\r\n?/g, "\n")
      .replace(/\n+/g, "<br>")
      .replace(/(?:[ \t]*<br>[ \t]*)+$/gi, "")
      .replace(/^(?:[ \t]*<br>[ \t]*)+/gi, "")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  private buildDividerLine(segments: string[], widths: number[]) {
    const normalized = this.normalizeRowCells(segments, widths.length);
    const parts = widths.map((width, index) => (normalized[index] ?? "---").padEnd(width, "-"));
    return `| ${parts.join(" | ")} |`;
  }

  private buildTableLine(cells: string[], widths: number[]) {
    const parts = widths.map((width, index) => {
      const value = this.escapeMarkdownTableCell(
        this.stripImageWidthFromTableCell(cells[index] ?? "")
      );
      return value.padEnd(width, " ");
    });
    return `| ${parts.join(" | ")} |`;
  }

  /** Obsidian pipe tables cannot contain raw `|width` inside wikilinks — width lives in layout metadata. */
  private stripImageWidthFromTableCell(value: string) {
    return value.replace(
      /!\[\[([^\]|]+?\.(?:png|jpe?g|gif|webp|avif|svg|bmp|tiff?))(?:\\\|(\d+)|\|(\d+))?\]\]/gi,
      (_match, path: string) => `![[${path}]]`
    );
  }

  private escapeMarkdownTableCell(value: string) {
    const wikiEmbedRe = /!\[\[[^\]]+?\]\]/g;
    let result = "";
    let lastIndex = 0;
    for (const match of value.matchAll(wikiEmbedRe)) {
      const start = match.index ?? 0;
      result += this.escapeMarkdownTableCellPlain(value.slice(lastIndex, start));
      result += match[0];
      lastIndex = start + match[0].length;
    }
    return result + this.escapeMarkdownTableCellPlain(value.slice(lastIndex));
  }

  private escapeMarkdownTableCellPlain(value: string) {
    return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
  }

  private shiftLayoutForInsertedRow(layout: TableLayoutMetadata, rowIndex: number) {
    layout.rowHeights = this.shiftIndexedMapForInsert(layout.rowHeights, rowIndex);
    layout.rowColors = this.shiftIndexedMapForInsert(layout.rowColors, rowIndex);
    layout.cellColors = this.shiftCellColorMapForRowInsert(layout.cellColors, rowIndex);
    layout.cellTextColors = this.shiftCellColorMapForRowInsert(layout.cellTextColors, rowIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForRowInsert(layout.cellAlignments, rowIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForRowInsert(layout.cellImageWidths, rowIndex);
    layout.merges = this.shiftMergesForInsertedRow(layout.merges, rowIndex);
  }

  private shiftLayoutForDeletedRow(layout: TableLayoutMetadata, rowIndex: number) {
    layout.rowHeights = this.shiftIndexedMapForDelete(layout.rowHeights, rowIndex);
    layout.rowColors = this.shiftIndexedMapForDelete(layout.rowColors, rowIndex);
    layout.cellColors = this.shiftCellColorMapForRowDelete(layout.cellColors, rowIndex);
    layout.cellTextColors = this.shiftCellColorMapForRowDelete(layout.cellTextColors, rowIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForRowDelete(layout.cellAlignments, rowIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForRowDelete(layout.cellImageWidths, rowIndex);
    layout.merges = this.shiftMergesForDeletedRow(layout.merges, rowIndex);
  }

  private shiftLayoutForInsertedColumn(layout: TableLayoutMetadata, colIndex: number) {
    layout.colWidths = this.shiftIndexedMapForInsert(layout.colWidths, colIndex);
    layout.colColors = this.shiftIndexedMapForInsert(layout.colColors, colIndex);
    layout.cellColors = this.shiftCellColorMapForColumnInsert(layout.cellColors, colIndex);
    layout.cellTextColors = this.shiftCellColorMapForColumnInsert(layout.cellTextColors, colIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForColumnInsert(layout.cellAlignments, colIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForColumnInsert(layout.cellImageWidths, colIndex);
    layout.merges = this.shiftMergesForInsertedColumn(layout.merges, colIndex);
  }

  private shiftLayoutForDeletedColumn(layout: TableLayoutMetadata, colIndex: number) {
    layout.colWidths = this.shiftIndexedMapForDelete(layout.colWidths, colIndex);
    layout.colColors = this.shiftIndexedMapForDelete(layout.colColors, colIndex);
    layout.cellColors = this.shiftCellColorMapForColumnDelete(layout.cellColors, colIndex);
    layout.cellTextColors = this.shiftCellColorMapForColumnDelete(layout.cellTextColors, colIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForColumnDelete(layout.cellAlignments, colIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForColumnDelete(layout.cellImageWidths, colIndex);
    layout.merges = this.shiftMergesForDeletedColumn(layout.merges, colIndex);
  }

  private moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
    const [item] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, item);
  }

  private normalizeSortCellValue(value: string) {
    return String(value ?? "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/\\\|/g, "|")
      .trim();
  }

  private moveNativeLayoutRowMetadata(layout: TableLayoutMetadata, fromRow: number, toRow: number) {
    const transform = (row: number) => this.moveIndex(row, fromRow, toRow);
    this.remapNativeLayoutRows(layout, transform);
  }

  private moveNativeLayoutColumnMetadata(layout: TableLayoutMetadata, fromCol: number, toCol: number) {
    const transform = (col: number) => this.moveIndex(col, fromCol, toCol);
    this.remapNativeLayoutColumns(layout, transform);
  }

  private reorderNativeLayoutBodyRowMetadata(layout: TableLayoutMetadata, oldBodyIndexByNewBodyIndex: number[]) {
    const oldToNew = new Map<number, number>();
    oldBodyIndexByNewBodyIndex.forEach((oldBodyIndex, newBodyIndex) => {
      oldToNew.set(oldBodyIndex + 1, newBodyIndex + 1);
    });
    this.remapNativeLayoutRows(layout, (row) => (row === 0 ? 0 : oldToNew.get(row) ?? row));
  }

  private transposeNativeLayoutMetadata(layout: TableLayoutMetadata) {
    const nextColWidths = this.remapIndexedMap(layout.rowHeights, (row) => row);
    const nextRowHeights = this.remapIndexedMap(layout.colWidths, (col) => col);
    const nextColColors = this.remapIndexedMap(layout.rowColors, (row) => row);
    const nextRowColors = this.remapIndexedMap(layout.colColors, (col) => col);
    layout.colWidths = nextColWidths;
    layout.rowHeights = nextRowHeights;
    layout.colColors = nextColColors;
    layout.rowColors = nextRowColors;
    layout.cellColors = this.remapCellMap(layout.cellColors, (coord) => ({ row: coord.col, col: coord.row }));
    layout.cellTextColors = this.remapCellMap(layout.cellTextColors, (coord) => ({ row: coord.col, col: coord.row }));
    layout.cellAlignments = this.remapCellMap(layout.cellAlignments, (coord) => ({ row: coord.col, col: coord.row }));
    layout.cellImageWidths = this.remapCellMap(layout.cellImageWidths, (coord) => ({ row: coord.col, col: coord.row }));
    layout.merges = layout.merges.map((merge) => ({
      row: merge.col,
      col: merge.row,
      rowspan: merge.colspan,
      colspan: merge.rowspan,
    }));
  }

  private remapNativeLayoutRows(layout: TableLayoutMetadata, transformRow: (row: number) => number | null) {
    layout.rowHeights = this.remapIndexedMap(layout.rowHeights, transformRow);
    layout.rowColors = this.remapIndexedMap(layout.rowColors, transformRow);
    layout.cellColors = this.remapCellMap(layout.cellColors, (coord) => {
      const row = transformRow(coord.row);
      return row === null ? null : { ...coord, row };
    });
    layout.cellTextColors = this.remapCellMap(layout.cellTextColors, (coord) => {
      const row = transformRow(coord.row);
      return row === null ? null : { ...coord, row };
    });
    layout.cellAlignments = this.remapCellMap(layout.cellAlignments, (coord) => {
      const row = transformRow(coord.row);
      return row === null ? null : { ...coord, row };
    });
    layout.cellImageWidths = this.remapCellMap(layout.cellImageWidths, (coord) => {
      const row = transformRow(coord.row);
      return row === null ? null : { ...coord, row };
    });
    layout.merges = layout.merges.map((merge) => {
      const row = transformRow(merge.row);
      return row === null ? merge : { ...merge, row };
    });
  }

  private remapNativeLayoutColumns(layout: TableLayoutMetadata, transformCol: (col: number) => number | null) {
    layout.colWidths = this.remapIndexedMap(layout.colWidths, transformCol);
    layout.colColors = this.remapIndexedMap(layout.colColors, transformCol);
    layout.cellColors = this.remapCellMap(layout.cellColors, (coord) => {
      const col = transformCol(coord.col);
      return col === null ? null : { ...coord, col };
    });
    layout.cellTextColors = this.remapCellMap(layout.cellTextColors, (coord) => {
      const col = transformCol(coord.col);
      return col === null ? null : { ...coord, col };
    });
    layout.cellAlignments = this.remapCellMap(layout.cellAlignments, (coord) => {
      const col = transformCol(coord.col);
      return col === null ? null : { ...coord, col };
    });
    layout.cellImageWidths = this.remapCellMap(layout.cellImageWidths, (coord) => {
      const col = transformCol(coord.col);
      return col === null ? null : { ...coord, col };
    });
    layout.merges = layout.merges.map((merge) => {
      const col = transformCol(merge.col);
      return col === null ? merge : { ...merge, col };
    });
  }

  private moveIndex(index: number, fromIndex: number, toIndex: number) {
    if (index === fromIndex) return toIndex;
    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) return index + 1;
    return index;
  }

  private remapIndexedMap<T extends string | number>(input: Record<string, T>, transformIndex: (index: number) => number | null) {
    const next: Record<string, T> = {};
    for (const [key, value] of Object.entries(input)) {
      const index = Number.parseInt(key, 10);
      if (!Number.isFinite(index)) continue;
      const nextIndex = transformIndex(index);
      if (nextIndex === null || !Number.isFinite(nextIndex)) continue;
      next[String(nextIndex)] = value;
    }
    return next;
  }

  private remapCellMap<T extends string | number>(
    input: Record<string, T>,
    transformCoord: (coord: CellCoord) => CellCoord | null
  ) {
    const next: Record<string, T> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      const nextCoord = transformCoord(coord);
      if (!nextCoord) continue;
      next[this.getCellKey(nextCoord)] = value;
    }
    return next;
  }

  private shiftIndexedMapForInsert<T extends string | number>(input: Record<string, T>, insertIndex: number) {
    const next: Record<string, T> = {};
    for (const [key, value] of Object.entries(input)) {
      const index = Number.parseInt(key, 10);
      if (!Number.isFinite(index)) continue;
      next[String(index >= insertIndex ? index + 1 : index)] = value;
    }
    return next;
  }

  private shiftIndexedMapForDelete<T extends string | number>(input: Record<string, T>, deleteIndex: number) {
    const next: Record<string, T> = {};
    for (const [key, value] of Object.entries(input)) {
      const index = Number.parseInt(key, 10);
      if (!Number.isFinite(index) || index === deleteIndex) continue;
      next[String(index > deleteIndex ? index - 1 : index)] = value;
    }
    return next;
  }

  private shiftCellColorMapForRowInsert(input: Record<string, string>, insertIndex: number) {
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({
        row: coord.row >= insertIndex ? coord.row + 1 : coord.row,
        col: coord.col,
      })] = value;
    }
    return next;
  }

  private shiftCellColorMapForRowDelete(input: Record<string, string>, deleteIndex: number) {
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.row === deleteIndex) continue;
      next[this.getCellKey({
        row: coord.row > deleteIndex ? coord.row - 1 : coord.row,
        col: coord.col,
      })] = value;
    }
    return next;
  }

  private shiftCellColorMapForColumnInsert(input: Record<string, string>, insertIndex: number) {
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({
        row: coord.row,
        col: coord.col >= insertIndex ? coord.col + 1 : coord.col,
      })] = value;
    }
    return next;
  }

  private shiftCellColorMapForColumnDelete(input: Record<string, string>, deleteIndex: number) {
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.col === deleteIndex) continue;
      next[this.getCellKey({
        row: coord.row,
        col: coord.col > deleteIndex ? coord.col - 1 : coord.col,
      })] = value;
    }
    return next;
  }

  private shiftCellAlignmentMapForRowInsert(
    input: Record<string, "left" | "center" | "right">,
    insertIndex: number
  ) {
    const next: Record<string, "left" | "center" | "right"> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row >= insertIndex ? coord.row + 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }

  private shiftCellAlignmentMapForRowDelete(
    input: Record<string, "left" | "center" | "right">,
    deleteIndex: number
  ) {
    const next: Record<string, "left" | "center" | "right"> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.row === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row > deleteIndex ? coord.row - 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }

  private shiftCellAlignmentMapForColumnInsert(
    input: Record<string, "left" | "center" | "right">,
    insertIndex: number
  ) {
    const next: Record<string, "left" | "center" | "right"> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col >= insertIndex ? coord.col + 1 : coord.col })] = value;
    }
    return next;
  }

  private shiftCellAlignmentMapForColumnDelete(
    input: Record<string, "left" | "center" | "right">,
    deleteIndex: number
  ) {
    const next: Record<string, "left" | "center" | "right"> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.col === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col > deleteIndex ? coord.col - 1 : coord.col })] = value;
    }
    return next;
  }

  private shiftCellWidthMapForRowInsert(input: Record<string, number>, insertIndex: number) {
    const next: Record<string, number> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row >= insertIndex ? coord.row + 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }

  private shiftCellWidthMapForRowDelete(input: Record<string, number>, deleteIndex: number) {
    const next: Record<string, number> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.row === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row > deleteIndex ? coord.row - 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }

  private shiftCellWidthMapForColumnInsert(input: Record<string, number>, insertIndex: number) {
    const next: Record<string, number> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col >= insertIndex ? coord.col + 1 : coord.col })] = value;
    }
    return next;
  }

  private shiftCellWidthMapForColumnDelete(input: Record<string, number>, deleteIndex: number) {
    const next: Record<string, number> = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.col === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col > deleteIndex ? coord.col - 1 : coord.col })] = value;
    }
    return next;
  }

  private shiftMergesForInsertedRow(merges: TableMergeMetadata[], insertIndex: number) {
    return merges.map((merge) => {
      const next = { ...merge };
      if (insertIndex <= next.row) {
        next.row += 1;
      } else if (insertIndex < next.row + next.rowspan) {
        next.rowspan += 1;
      }
      return next;
    });
  }

  private shiftMergesForDeletedRow(merges: TableMergeMetadata[], deleteIndex: number) {
    return merges
      .map((merge) => {
        const next = { ...merge };
        const endRow = next.row + next.rowspan - 1;
        if (deleteIndex < next.row) {
          next.row -= 1;
          return next;
        }
        if (deleteIndex > endRow) {
          return next;
        }
        if (next.rowspan === 1) {
          return null;
        }
        next.rowspan -= 1;
        return next.rowspan > 0 ? next : null;
      })
      .filter((merge): merge is TableMergeMetadata => !!merge && (merge.rowspan > 1 || merge.colspan > 1));
  }

  private shiftMergesForInsertedColumn(merges: TableMergeMetadata[], insertIndex: number) {
    return merges.map((merge) => {
      const next = { ...merge };
      if (insertIndex <= next.col) {
        next.col += 1;
      } else if (insertIndex < next.col + next.colspan) {
        next.colspan += 1;
      }
      return next;
    });
  }

  private shiftMergesForDeletedColumn(merges: TableMergeMetadata[], deleteIndex: number) {
    return merges
      .map((merge) => {
        const next = { ...merge };
        const endCol = next.col + next.colspan - 1;
        if (deleteIndex < next.col) {
          next.col -= 1;
          return next;
        }
        if (deleteIndex > endCol) {
          return next;
        }
        if (next.colspan === 1) {
          return null;
        }
        next.colspan -= 1;
        return next.colspan > 0 ? next : null;
      })
      .filter((merge): merge is TableMergeMetadata => !!merge && (merge.rowspan > 1 || merge.colspan > 1));
  }

  private parseCellKey(key: string) {
    const [rowText, colText] = key.split(",");
    const row = Number.parseInt(rowText ?? "", 10);
    const col = Number.parseInt(colText ?? "", 10);
    if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
    return { row, col };
  }

  private captureHistoryStateFromContent(filePath: string, content: string, tableIds: string[]): HistoryState {
    const tableRecords: Record<string, TableRecord> = {};
    for (const tableId of tableIds) {
      const record = this.dataStore.tables[tableId];
      if (record) {
        tableRecords[tableId] = this.cloneTableRecord(record);
      }
    }
    return { filePath, content, tableRecords };
  }

  private async captureHistoryState(file: TFile, tableIds: string[]) {
    const content = await this.app.vault.cachedRead(file);
    return this.captureHistoryStateFromContent(file.path, content, tableIds);
  }

  private pushHistoryEntry(entry: HistoryEntry) {
    if (JSON.stringify(entry.before) === JSON.stringify(entry.after)) return;
    this.undoStack.push(entry);
    if (this.undoStack.length > HISTORY_LIMIT) {
      this.undoStack = this.undoStack.slice(-HISTORY_LIMIT);
    }
    this.redoStack = [];
  }

  private canUndoHistoryForFile(filePath: string, tableId: string) {
    return this.undoStack.some((entry) => entry.filePath === filePath && entry.tableIds.includes(tableId));
  }

  private canRedoHistoryForFile(filePath: string, tableId: string) {
    return this.redoStack.some((entry) => entry.filePath === filePath && entry.tableIds.includes(tableId));
  }

  private async undoLastAction(filePath: string, tableId: string) {
    const entryIndex = this.findLatestHistoryIndex(this.undoStack, filePath, tableId);
    if (entryIndex < 0 || this.historyApplying) return false;
    const [entry] = this.undoStack.splice(entryIndex, 1);
    this.historyApplying = true;
    try {
      await this.applyHistoryState(entry.before, entry.tableIds);
      this.redoStack.push(entry);
      if (this.redoStack.length > HISTORY_LIMIT) {
        this.redoStack = this.redoStack.slice(-HISTORY_LIMIT);
      }
      new Notice(`已撤回：${entry.label}`);
      return true;
    } finally {
      this.historyApplying = false;
    }
  }

  private async redoLastAction(filePath: string, tableId: string) {
    const entryIndex = this.findLatestHistoryIndex(this.redoStack, filePath, tableId);
    if (entryIndex < 0 || this.historyApplying) return false;
    const [entry] = this.redoStack.splice(entryIndex, 1);
    this.historyApplying = true;
    try {
      await this.applyHistoryState(entry.after, entry.tableIds);
      this.undoStack.push(entry);
      if (this.undoStack.length > HISTORY_LIMIT) {
        this.undoStack = this.undoStack.slice(-HISTORY_LIMIT);
      }
      new Notice(`已重做：${entry.label}`);
      return true;
    } finally {
      this.historyApplying = false;
    }
  }

  private findLatestHistoryIndex(stack: HistoryEntry[], filePath: string, tableId: string) {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      const entry = stack[index];
      if (entry.filePath === filePath && entry.tableIds.includes(tableId)) {
        return index;
      }
    }
    return -1;
  }

  private async applyHistoryState(state: HistoryState, tableIds: string[]) {
    const abstractFile = this.app.vault.getAbstractFileByPath(state.filePath);
    if (!(abstractFile instanceof TFile)) return;

    const currentContent = await this.app.vault.cachedRead(abstractFile);
    if (currentContent !== state.content) {
      await this.app.vault.modify(abstractFile, state.content);
    }

    for (const tableId of tableIds) {
      const record = state.tableRecords[tableId];
      if (record) {
        this.dataStore.tables[tableId] = this.cloneTableRecord(record);
      } else {
        delete this.dataStore.tables[tableId];
      }
    }

    const parsedTables = this.parseMarkdownTables(state.content);
    await this.syncTableRecords(abstractFile, parsedTables);
    await this.savePluginData();
    this.queueRefreshBurst();
  }

  private showPaletteMenu(
    tableEl: HTMLTableElement,
    coord: CellCoord,
    origin: { x: number; y: number } | undefined,
    onPick: (palette: (typeof PALETTE)[number]) => void
  ) {
    const menu = new Menu();
    for (const palette of PALETTE) {
      menu.addItem((item) => {
        item.setTitle(palette.label);
        item.setIcon("paint-bucket");
        item.onClick(() => onPick(palette));
      });
    }

    const position = this.resolveMenuPosition(tableEl, coord, origin);
    menu.showAtPosition(position);
  }

  private showClearColorMenu(
    file: TFile,
    tableId: string,
    tableEl: HTMLTableElement,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    const menu = new Menu();
    menu.addItem((item) => {
      item.setTitle("清除单元格颜色");
      item.setIcon("eraser");
      item.onClick(() => void this.clearColor(tableId, file, tableEl, "cell", this.getCellKey(coord)));
    });
    menu.addItem((item) => {
      item.setTitle("清除当前行颜色");
      item.setIcon("eraser");
      item.onClick(() => void this.clearColor(tableId, file, tableEl, "row", String(coord.row)));
    });
    menu.addItem((item) => {
      item.setTitle("清除当前列颜色");
      item.setIcon("eraser");
      item.onClick(() => void this.clearColor(tableId, file, tableEl, "column", String(coord.col)));
    });
    menu.showAtPosition(this.resolveMenuPosition(tableEl, coord, origin));
  }

  private resolveMenuPosition(
    tableEl: HTMLTableElement,
    coord: CellCoord,
    origin?: { x: number; y: number }
  ) {
    if (origin) {
      return { x: origin.x + 12, y: origin.y + 8 };
    }
    const cell = tableEl.querySelector(
      `[data-mdtp-row='${coord.row}'][data-mdtp-col='${coord.col}']`
    ) as HTMLTableCellElement | null;
    if (!cell) {
      const rect = tableEl.getBoundingClientRect();
      return { x: rect.left + 12, y: rect.top + 12 };
    }
    const rect = cell.getBoundingClientRect();
    return { x: rect.right - 8, y: rect.top + 8 };
  }

  private async syncTableRecords(file: TFile, parsedTables: ParsedTableBlock[], options: SyncTableRecordsOptions = {}) {
    const now = Date.now();
    let mutated = false;
    const matchedIds = new Set<string>();

    for (let index = 0; index < parsedTables.length; index += 1) {
      const table = parsedTables[index];
      const tableId =
        table.tableId ??
        this.findBestMarkerlessRecordIdForParsedTable(file, table, index, matchedIds);
      if (!tableId) continue;
      matchedIds.add(tableId);

      const existing = this.dataStore.tables[tableId];
      const mode = options.forceMode ?? options.modeOverrides?.[tableId] ?? this.getTableRecordMode(existing);
      const nextRecord: TableRecord = {
        tableId,
        mode,
        markerless: existing?.markerless === true || !table.tableId,
        identity: this.createNativeTableIdentity(table, index),
        filePath: file.path,
        createdAt: existing?.createdAt ?? now,
        updatedAt: existing?.updatedAt ?? now,
        lastKnownHash: this.hashString(table.raw),
        lastKnownRange: {
          startLine: table.startLine,
          endLine: table.endLine,
        },
        layout: existing?.layout ? this.cloneLayout(existing.layout) : this.createEmptyLayout(),
      };

      if (!existing || JSON.stringify(existing) !== JSON.stringify(nextRecord)) {
        this.dataStore.tables[tableId] = nextRecord;
        mutated = true;
      }
    }

    if (mutated) {
      await this.savePluginData();
    }
  }

  private async createSnapshot(file: TFile, reason: string, tableIds: string[]) {
    const content = await this.app.vault.cachedRead(file);
    const createdAt = Date.now();
    const snapshotId = `${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
    const backupPath = normalizePath(
      `${this.app.vault.configDir}/plugins/${PLUGIN_ID}/backups/${this.getBackupFileName(file, createdAt)}`
    );

    await this.ensureFolderExists(normalizePath(`${this.app.vault.configDir}/plugins/${PLUGIN_ID}`));
    await this.ensureFolderExists(normalizePath(`${this.app.vault.configDir}/plugins/${PLUGIN_ID}/backups`));
    await this.app.vault.adapter.write(backupPath, content);

    const tableRecordSnapshot: Record<string, TableRecord> = {};
    for (const tableId of tableIds) {
      const record = this.dataStore.tables[tableId];
      if (record) {
        tableRecordSnapshot[tableId] = this.cloneTableRecord(record);
      }
    }

    this.dataStore.snapshots.unshift({
      snapshotId,
      filePath: file.path,
      createdAt,
      reason,
      tableIds,
      backupPath,
      tableRecords: tableRecordSnapshot,
    });

    if (this.dataStore.snapshots.length > SNAPSHOT_LIMIT) {
      this.dataStore.snapshots = this.dataStore.snapshots.slice(0, SNAPSHOT_LIMIT);
    }

    await this.savePluginData();
  }

  private cloneTableRecord(record: TableRecord): TableRecord {
    return {
      ...record,
      identity: record.identity ? { ...record.identity } : undefined,
      lastKnownRange: { ...record.lastKnownRange },
      layout: this.cloneLayout(record.layout),
    };
  }

  private cloneLayout(layout: TableLayoutMetadata): TableLayoutMetadata {
    return this.normalizeLayout(layout);
  }

  private normalizeLoadedTableRecord(record: TableRecord): TableRecord {
    const wasLegacyEnhanced = this.getTableRecordMode(record) === "enhanced";
    const layout = this.normalizeLayout(record.layout);
    if (wasLegacyEnhanced) {
      this.stripLegacyEnhancedLayout(layout);
      this.applyNativeColorPresetToLayout(layout);
    }
    return {
      ...record,
      mode: "nativeLayout",
      markerless: record.markerless === true,
      identity: record.identity ? { ...record.identity } : undefined,
      lastKnownRange: { ...record.lastKnownRange },
      layout,
    };
  }

  private getTableRecordMode(record: Partial<TableRecord> | null | undefined): TableRecordMode {
    return record?.mode === "nativeLayout" ? "nativeLayout" : "enhanced";
  }

  private normalizeLayout(layout: Partial<TableLayoutMetadata> | undefined): TableLayoutMetadata {
    const normalized: TableLayoutMetadata = {
      colWidths: { ...(layout?.colWidths ?? {}) },
      rowHeights: { ...(layout?.rowHeights ?? {}) },
      cellColors: { ...(layout?.cellColors ?? {}) },
      rowColors: { ...(layout?.rowColors ?? {}) },
      colColors: { ...(layout?.colColors ?? {}) },
      cellTextColors: { ...(layout?.cellTextColors ?? {}) },
      cellAlignments: { ...(layout?.cellAlignments ?? {}) },
      cellImageWidths: { ...(layout?.cellImageWidths ?? {}) },
      merges: Array.isArray(layout?.merges) ? layout.merges.map((merge) => ({ ...merge })) : [],
    };
    if (layout?.tableScale !== undefined) {
      normalized.tableScale = this.normalizeNativeTableScale(layout.tableScale, NATIVE_TABLE_DEFAULT_SCALE);
    }
    if (layout?.nativeColorPreset === NATIVE_COLOR_PRESET_BLUE_ZEBRA) {
      normalized.nativeColorPreset = NATIVE_COLOR_PRESET_BLUE_ZEBRA;
      normalized.nativeColorPalette = this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
      this.normalizeNativeColorPresetLayout(normalized);
    } else if (layout?.nativeColorPalette) {
      normalized.nativeColorPalette = this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
    }
    if (layout?.nativeBorderEnabled === true) {
      normalized.nativeBorderEnabled = true;
    }
    return normalized;
  }

  private async savePluginData() {
    await this.saveData(this.dataStore);
  }

  private getBackupFileName(file: TFile, createdAt: number) {
    const timestamp = new Date(createdAt).toISOString().replace(/[:.]/g, "-");
    const safePath = file.path.replace(/[\\/]/g, "__");
    return `${timestamp}__${safePath}.md.bak`;
  }

  private async ensureFolderExists(folderPath: string) {
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(folderPath)) return;

    const segments = folderPath.split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!(await adapter.exists(current))) {
        await adapter.mkdir(current);
      }
    }
  }

  parseMarkdownTables(content: string) {
    const lines = content.split(/\r?\n/);
    const tables: ParsedTableBlock[] = [];
    let inFence = false;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex].trim();
      if (/^```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;

      if (!this.isLikelyTableHeader(lines[lineIndex], lines[lineIndex + 1] ?? "")) {
        continue;
      }

      const markerLine = this.findMarkerLineAbove(lines, lineIndex);
      const markerId = markerLine !== null ? this.extractTableMarkerId(lines[markerLine]) : null;
      let endLine = lineIndex + 1;
      while (endLine + 1 < lines.length && this.isLikelyTableRow(lines[endLine + 1])) {
        endLine += 1;
      }

      tables.push({
        startLine: lineIndex,
        endLine,
        markerLine,
        tableId: markerId,
        raw: lines.slice(lineIndex, endLine + 1).join("\n"),
      });

      lineIndex = endLine;
    }

    return tables;
  }

  private isLikelyTableHeader(headerLine: string, dividerLine: string) {
    if (!this.hasPipe(headerLine) || !this.isDividerRow(dividerLine)) {
      return false;
    }

    const trimmed = headerLine.trim();
    if (!trimmed || trimmed.startsWith("<!--")) {
      return false;
    }

    return true;
  }

  private isLikelyTableRow(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (this.extractTableMarkerId(trimmed)) return false;
    return this.hasPipe(trimmed);
  }

  private isDividerRow(line: string) {
    const trimmed = line.trim();
    if (!trimmed || !this.hasPipe(trimmed)) return false;

    const segments = trimmed
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((segment) => segment.trim());

    return segments.length > 0 && segments.every((segment) => /^:?-{3,}:?$/.test(segment));
  }

  private hasPipe(line: string) {
    const pipeCount = [...line].filter((char) => char === "|").length;
    return pipeCount >= 2;
  }

  private generateTableId() {
    return `${TABLE_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  private findMarkerLineAbove(lines: string[], tableStartLine: number) {
    for (let index = tableStartLine - 1; index >= 0; index -= 1) {
      const line = lines[index].trim();
      if (!line) continue;
      return this.extractTableMarkerId(lines[index]) ? index : null;
    }
    return null;
  }

  private normalizeMarkerSpacing(lines: string[], tableStartLine: number) {
    const markerLine = this.findMarkerLineAbove(lines, tableStartLine);
    if (markerLine === null) return false;

    let changed = false;
    let startLine = tableStartLine;

    while (startLine - 1 > markerLine && lines[startLine - 1].trim() === "") {
      lines.splice(startLine - 1, 1);
      startLine -= 1;
      changed = true;
    }

    if (startLine === markerLine + 1) {
      lines.splice(startLine, 0, "");
      changed = true;
    }

    return changed;
  }

  private formatTableMarker(tableId: string) {
    return `%% mdtp:${tableId} %%`;
  }

  private ensureBlankLineAfterTableMarkers(lines: string[]) {
    for (let index = 0; index < lines.length; index += 1) {
      if (!this.extractTableMarkerId(lines[index])) continue;
      const next = lines[index + 1] ?? null;
      if (next === null) continue;
      if (next.trim() === "") continue;
      if (!this.isLikelyTableHeader(lines[index + 1], lines[index + 2] ?? "")) continue;
      lines.splice(index + 1, 0, "");
      index += 1;
    }
    return lines;
  }

  private joinLines(lines: string[], originalEndsWithNewline: boolean) {
    const joined = lines.join("\n");
    return originalEndsWithNewline ? `${joined}\n` : joined;
  }

  private splitContentLines(content: string) {
    const originalEndsWithNewline = /\r?\n$/.test(content);
    const lines = content.split(/\r?\n/);
    if (originalEndsWithNewline && lines[lines.length - 1] === "") {
      lines.pop();
    }
    return { lines, originalEndsWithNewline };
  }

  private createEmptyLayout(): TableLayoutMetadata {
    return {
      colWidths: {},
      rowHeights: {},
      cellColors: {},
      rowColors: {},
      colColors: {},
      cellTextColors: {},
      cellAlignments: {},
      cellImageWidths: {},
      merges: [],
    };
  }

  private getCellKey(coord: CellCoord) {
    return `${coord.row},${coord.col}`;
  }

  private hashString(input: string) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `h${(hash >>> 0).toString(16)}`;
  }

  private extractTableMarkerId(line: string) {
    const htmlMatch = line.match(HTML_TABLE_MARKER_RE);
    if (htmlMatch?.[1]) return htmlMatch[1];
    const obsidianMatch = line.match(OBSIDIAN_TABLE_MARKER_RE);
    if (obsidianMatch?.[1]) return obsidianMatch[1];
    const referenceMatch = line.match(REFERENCE_TABLE_MARKER_RE);
    if (referenceMatch?.[1]) return referenceMatch[1];
    const visibleReferenceMatch = line.match(VISIBLE_REFERENCE_TABLE_MARKER_RE);
    if (visibleReferenceMatch?.[1]) return visibleReferenceMatch[1];
    return null;
  }

  private isHiddenMarkerText(line: string) {
    return !!this.extractTableMarkerId(line) || TEMPLATE_TABLE_METADATA_RE.test(line);
  }

  private async installRuntimeStyles() {
    this.injectedStyleEl?.remove();
    this.injectedStyleEl = null;

    const stylePath = normalizePath(`${this.app.vault.configDir}/plugins/${PLUGIN_ID}/styles.css`);
    if (!(await this.app.vault.adapter.exists(stylePath))) {
      return;
    }

    const css = await this.app.vault.adapter.read(stylePath);
    const styleEl = document.createElement("style");
    styleEl.id = `${PLUGIN_ID}-runtime-style`;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    this.injectedStyleEl = styleEl;
  }
}
