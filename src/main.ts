import {
  App,
  MarkdownRenderer,
  MarkdownView,
  Menu,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  normalizePath,
} from "obsidian";
import * as HtmlToImage from "html-to-image";

import { EmbeddedSubModule, SubPluginHost, ModuleHostBackend } from "./modules/sub-plugin-host";
import { fileAutoLocalizerModule, renderFileAutoLocalizerSettings } from "./modules/file-auto-localizer";
import { globalWidePageModule } from "./modules/global-wide-page";
import {
  getRightClickCopyAsImageRunner,
  rightClickCopyAsImageModule,
} from "./modules/right-click-copy-as-image";
import {
  claudianChatArchiveModule,
  renderClaudianChatArchiveSettings,
  type ClaudianChatArchiveRunner,
} from "./modules/claudian-chat-archive";
import {
  AUTO_UPDATE_PLUGIN_LABELS,
  DEFAULT_AUTO_UPDATE_PLUGIN_IDS,
  formatAutoUpdateResult,
  isAutoUpdateBlockedPluginId,
  normalizeAutoUpdatePluginIds,
  normalizeAutoUpdateResults,
  resolveAutoUpdatePluginId,
  runManagedPluginAutoUpdate,
  type ManagedPluginAutoUpdateResult,
} from "./modules/managed-plugin-auto-updater";
import {
  blockLinkPlusModule,
  getEmbeddedBlockLinkPlusInstance,
} from "./modules/block-link-plus-embedded";
import { videoTimestampPreviewModule } from "./modules/video-timestamp-preview";
import { renderBlockLinkPlusSettings } from "./modules/block-link-plus-bridge";
import { ensureObsidianRequireBinding } from "./modules/node-bridge";
import {
  GOAL_PROGRESS_PLAN_ROOT_PATH,
  GOAL_PROGRESS_REVIEW_PATH,
  GOAL_PROGRESS_TARGET_PATH,
  buildGoalProgressSyncUpdate,
  type GoalProgressPlanFile,
} from "./modules/goal-progress-sync";
import EmbeddedNativeTableEnhancerPlugin from "./modules/native-table-enhancer-embedded";

/** 指向链接优先启动，避免与其它内嵌模块抢 PluginManager / 视图注册 */
const EMBEDDED_MODULES: EmbeddedSubModule[] = [
  blockLinkPlusModule,
  fileAutoLocalizerModule,
  globalWidePageModule,
  videoTimestampPreviewModule,
  rightClickCopyAsImageModule,
  claudianChatArchiveModule,
];

function formatEmbeddedModuleError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

type EmbeddedModuleSettingsRenderer = (containerEl: HTMLElement, onRefresh: () => void) => void;

type ClaudianAgentBridgeScriptResult = {
  ok: boolean;
  output: string;
  code?: number | string;
};

const EMBEDDED_MODULE_SETTINGS_RENDERERS: Record<string, EmbeddedModuleSettingsRenderer> = {
  "file-auto-localizer": (containerEl) => renderFileAutoLocalizerSettings(containerEl),
  "claudian-chat-archive": (containerEl, onRefresh) =>
    renderClaudianChatArchiveSettings(containerEl, onRefresh),
};

type ExternalModuleSettingsRendererFactory = (app: App) => EmbeddedModuleSettingsRenderer;

const EXTERNAL_MODULE_SETTINGS_RENDERER_FACTORIES: Record<string, ExternalModuleSettingsRendererFactory> =
  {
    "imagen-image-manager": (app) => (containerEl) => {
      const runImageCommand = async (commandId: string) => {
        const ok = await app.commands?.executeCommandById?.(commandId);
        if (!ok) new Notice("未找到图片管理命令，请确认 Image Converter 已启用");
      };
      const hint = document.createElement("p");
      hint.className = "fdtb-settings-page-desc";
      hint.textContent =
        "测试版先托管成熟插件 Image Converter：右键图片可做注释/标注/裁剪/删除链接，粘贴或拖入图片时可按规则重命名，命令面板可批量处理当前笔记或整个库。云端上传和孤立图片清理先不自动执行，避免误删或外传。";
      containerEl.appendChild(hint);

      new Setting(containerEl)
        .setName("打开 Image Converter 设置")
        .setDesc("配置粘贴重命名、输出文件夹、图片格式、压缩、注释工具、对齐和批量处理规则。")
        .addButton((button) =>
          button.setButtonText("打开").onClick(async () => {
            await runImageCommand("image-converter:open-image-converter-settings");
          })
        );

      new Setting(containerEl)
        .setName("批量处理当前笔记图片")
        .setDesc("对当前笔记中的图片执行 Image Converter 的批量处理流程。执行前请先在设置里确认规则。")
        .addButton((button) =>
          button.setButtonText("执行").onClick(async () => {
            await runImageCommand("image-converter:process-all-images-current-note");
          })
        );

      new Setting(containerEl)
        .setName("批量处理整个 vault 图片")
        .setDesc("范围很大，建议只在规则确认无误后使用；首次使用前先在单篇笔记试跑。")
        .addButton((button) =>
          button.setButtonText("执行").onClick(async () => {
            if (!confirmUserAction("将调用 Image Converter 批量处理整个 vault 的图片。请确认已先在单篇笔记试跑，继续吗？")) return;
            await runImageCommand("image-converter:process-all-vault-images");
          })
        );

      const previewHint = document.createElement("p");
      previewHint.className = "setting-item-description";
      previewHint.textContent =
        "双击打开图片：已接入笔记内图片预览；关闭「图片管理测试版」时，双击预览会同步停用。";
      containerEl.appendChild(previewHint);

      const todo = document.createElement("p");
      todo.className = "setting-item-description";
      todo.textContent =
        "云端上传和孤立图片清理已拆到下方测试功能；上传、删除、全库批量处理均需手动确认，不做后台自动执行。";
      containerEl.appendChild(todo);
    },
    "image-cloud-upload": (app) => (containerEl) => {
      const runUploadCommand = async () => {
        const ok = await app.commands?.executeCommandById?.("image-upload-toolkit:publish-page");
        if (!ok) new Notice("未找到云端上传命令，请确认 Image Upload Toolkit 已启用并配置完成");
      };
      const hint = document.createElement("p");
      hint.className = "fdtb-settings-page-desc";
      hint.textContent =
        "云端上传测试版托管 Image Upload Toolkit。它支持 Imgur、GitHub、Cloudflare R2、AWS S3、阿里云 OSS、腾讯云 COS、七牛、ImageKit、Backblaze B2、Gyazo 等。首次使用请先打开该插件设置并配置图床；未配置前不要执行上传。";
      containerEl.appendChild(hint);

      new Setting(containerEl)
        .setName("上传当前笔记图片")
        .setDesc("会把当前笔记里的本地图片上传到你配置的云端存储，并按插件设置复制/替换链接。")
        .addButton((button) =>
          button.setButtonText("执行").onClick(async () => {
            if (!confirmUserAction("将调用 Image Upload Toolkit 上传当前笔记图片到已配置的云端存储。确认继续吗？")) return;
            await runUploadCommand();
          })
        );
    },
    "image-orphan-cleanup": (app) => (containerEl) => {
      const runCleanupCommand = async () => {
        const ok = await app.commands?.executeCommandById?.("oz-clear-unused-images:clear-images-obsidian");
        if (!ok) new Notice("未找到孤立图片清理命令，请确认 Clear Unused Images 已启用");
      };
      const hint = document.createElement("p");
      hint.className = "fdtb-settings-page-desc";
      hint.textContent =
        "孤立图片清理测试版托管 Clear Unused Images。建议先在该插件设置里把删除目标设为 Obsidian Trash 或 System Trash，并排除不希望扫描的附件目录。";
      containerEl.appendChild(hint);

      new Setting(containerEl)
        .setName("清理未引用图片")
        .setDesc("会扫描整个 vault 的图片引用并清理未使用图片。此动作有删除风险，执行前请确认插件设置。")
        .addButton((button) =>
          button.setButtonText("执行").onClick(async () => {
            if (!confirmUserAction("将调用 Clear Unused Images 清理未引用图片。请确认删除目标不是永久删除，继续吗？")) return;
            await runCleanupCommand();
          })
        );
    },
  };

const HANDLE_SIZE = 28;
const HANDLE_OFFSET = 42;
const COMPACT_HANDLE_SIZE = 22;
const DRAGGER_HANDLE_SELECTOR = ".dnd-drag-handle[data-block-start]";
const HOVER_HIDE_DELAY_MS = 180;
const EXPORT_PIXEL_RATIO = 2;
const EXPORT_PADDING = 24;
const EXPORT_STAGING_OFFSET = -20000;
const STYLE_MARKER_RE = /^\s*%%\s*fdtb-style:(\{.*\})\s*%%\s*$/;

type BlockAction =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "italic"
  | "strikethrough"
  | "bullet"
  | "numbered"
  | "todo"
  | "insertImage"
  | "insertFile"
  | "quote"
  | "code"
  | "indentMore"
  | "indentLess"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "colorYellow"
  | "colorBlue"
  | "colorGreen"
  | "colorRed"
  | "colorPurple"
  | "colorGray"
  | "clearStyle"
  | "divider"
  | "moveUp"
  | "moveDown"
  | "copyMarkdown"
  | "duplicateBelow"
  | "insertBelow"
  | "copyImage"
  | "tableMenu"
  | "templateMenu"
  | "highlightText"
  | "calloutNote"
  | "calloutFold"
  | "insertDate"
  | "insertLink"
  | "commandPalette";

type BlockKind =
  | "paragraph"
  | "heading"
  | "listItem"
  | "quote"
  | "callout"
  | "codeFence"
  | "table"
  | "divider";

type BlockContext = {
  view: MarkdownView;
  file: TFile;
  editor: any;
  cmView: any;
  blockEl: HTMLElement;
  line: number;
  kind: BlockKind;
};

type InlineStyleState = {
  align: "center" | "right" | null;
  color: "yellow" | "blue" | "green" | "red" | "purple" | "gray" | null;
};

type ToolbarActionItem = {
  action: BlockAction;
  label: string;
};

type ToolbarActionGroup = {
  label: string;
  items: ToolbarActionItem[];
  wide?: boolean;
  layout?: "formatGrid" | "insertMixed" | "utility";
};

type SortableToolbarGroupOptions = {
  sortable: true;
  onReorder: () => void | Promise<void>;
};

type FeishuDocToolbarData = {
  version: 1;
  templateFolderPath: string;
  /** 根目录模板在设置页与 T 菜单中的显示名（非物理文件夹） */
  templateUngroupedLabel: string;
  recentTemplatePaths: string[];
  toolbarActionOrder: BlockAction[];
  managedPluginAliases: Record<string, string>;
  managedPluginNotes: Record<string, string>;
  managedPluginCategories: Record<string, string>;
  managedPluginCategoryNames: Record<string, string>;
  managedPluginCategoryOrder: string[];
  managedPluginStatusCheckedAt: number;
  /** 测试功能总开关：仅解锁「OneNote 高保真粘贴」实验区 UI，不直接打开增强表格 */
  enableBetaFeatures: boolean;
  /** 启用 OneNote 高保真粘贴时后台联动 mte 增强表格能力（无增强表格按钮） */
  showOneNoteImport: boolean;
  showTableEnhancerEntrances: boolean;
  showDraggerIntegrationStatus: boolean;
  /** 内嵌子模块（merged 状态）的开关 + 私有 data 桶 */
  embeddedModules: Record<string, { enabled: boolean; data?: unknown }>;
  /** 已融合的原生表格增强私有数据，替代外部 markdown-table-enhancer/data.json */
  embeddedNativeTableEnhancer?: unknown;
  /** 设置页顶部导航栏顺序 */
  settingsTabOrder: ExperienceSettingsTabId[];
  /** 用户已删除/隐藏的内置插件分类 id */
  managedPluginCategoryRemoved: string[];
  /** 启动时自动更新白名单内的社区插件 */
  autoUpdatePluginsEnabled: boolean;
  /** 允许自动更新的插件 id 列表 */
  autoUpdatePluginIds: string[];
  autoUpdateLastRunAt: number;
  autoUpdateLastResults: Record<string, ManagedPluginAutoUpdateResult>;
  /** 视频总结公开配置；不存 Cookie、API Key、Agent Token 或网页密码 */
  videoSummarySettings: VideoSummaryUserSettings;
};

type ManagementSettingKey = "showDraggerIntegrationStatus" | "showTableEnhancerEntrances" | "showOneNoteImport";

type ManagementStatusItem = {
  label: string;
  status: string;
  description: string;
};

type VideoSummaryPlatformStatus = {
  platform: string;
  label: string;
  configured: boolean;
  length: number;
  error?: string;
};

type VideoSummaryUserSettings = {
  serviceUrl: string;
  agentJobsUrl: string;
  skillName: string;
  outputDir: string;
  defaultPrompt: string;
  enableLocalDiagnostics: boolean;
};
type VideoSummaryStringSettingKey = Exclude<keyof VideoSummaryUserSettings, "enableLocalDiagnostics">;

type VideoSummaryDiagnostics = {
  pluginVersion: string;
  skillPath: string;
  skillExists: boolean;
  scriptPath: string;
  scriptExists: boolean;
  outputDir: string;
  defaultModel: string;
  visualEnabled: boolean;
  providerId: string;
  providerBaseUrl: string;
  serviceUrl: string;
  agentJobsUrl: string;
  serviceHealth: ManagementStatusItem;
  bilibiliNoteHealth: ManagementStatusItem;
  workbenchHealth: ManagementStatusItem;
  configPath: string;
  configExists: boolean;
  agentTokenConfigured: boolean;
  agentTokenLength: number;
  sessionSecretConfigured: boolean;
  webPasswordConfigured: boolean;
  platforms: VideoSummaryPlatformStatus[];
};

type HostedPluginItem = {
  id: string;
  name: string;
  originalName: string;
  alias: string;
  note: string;
  version: string;
  installed: boolean;
  enabled: boolean;
  toggleable: boolean;
  status: string;
  description: string;
};

type ManagedPluginCategory = {
  id: string;
  name: string;
};

type SlashTriggerState = {
  filePath: string;
  line: number;
};

type TemplateDescriptor = {
  path: string;
  title: string;
  excerpt: string;
  order: number | null;
  updatedAt: number;
  folderSegments: string[];
};

type TemplateTreeNode = {
  folders: Map<string, TemplateTreeNode>;
  templates: TemplateDescriptor[];
};

type TrashedTemplateItem = {
  trashPath: string;
  title: string;
  originalGroup: string;
  deletedAt: number;
};

type SecondaryMenuItem = {
  label: string;
  description?: string;
  header?: boolean;
  onClick?: () => void | Promise<void>;
};

type ExperienceSettingsTabId =
  | "toolbar"
  | "nativeTable"
  | "templateLibrary"
  | "modules"
  | "plugins"
  | "videoSummary";

type OwnModuleMigrationStatus = "external" | "merged";

type OwnModuleDescriptor = {
  moduleId: string;
  displayName: string;
  externalPluginId: string;
  description: string;
  status: OwnModuleMigrationStatus;
};

const OWN_MODULE_DESCRIPTORS: OwnModuleDescriptor[] = [
  {
    moduleId: "file-auto-localizer",
    displayName: "文件自动本地化",
    externalPluginId: "image-localizer",
    description: "原 OneNote 本地化插件：自动把笔记中的远程图片、OneDrive/OneNote 链接转换为本地文件与可打开链接",
    status: "merged",
  },
  {
    moduleId: "imagen-image-manager",
    displayName: "图片管理测试版",
    externalPluginId: "image-converter",
    description:
      "对标 Imagen 的测试入口：托管 Image Converter，提供图片注释/标注、裁剪、对齐、拖拽缩放、粘贴重命名、批量处理等能力；云端上传与孤立图片清理后续继续桥接。",
    status: "external",
  },
  {
    moduleId: "image-cloud-upload",
    displayName: "图片云端上传测试版",
    externalPluginId: "image-upload-toolkit",
    description:
      "托管 Image Upload Toolkit，支持 Imgur、GitHub、Cloudflare R2、AWS S3、阿里云 OSS、腾讯云 COS、七牛、ImageKit、Backblaze B2、Gyazo 等图片上传。",
    status: "external",
  },
  {
    moduleId: "image-orphan-cleanup",
    displayName: "孤立图片清理测试版",
    externalPluginId: "oz-clear-unused-images",
    description:
      "托管 Clear Unused Images，用于扫描并清理未被 Markdown/Canvas 引用的图片；删除前必须用户主动确认。",
    status: "external",
  },
  {
    moduleId: "global-wide-page",
    displayName: "全局宽页面",
    externalPluginId: "global-wide-page",
    description: "默认让所有 Markdown 页面以宽页面显示，并在状态栏提供一键切换",
    status: "merged",
  },
  {
    moduleId: "video-timestamp-preview",
    displayName: "视频时间轴预览",
    externalPluginId: "",
    description: "点击视频总结里的时间轴，在 Obsidian 内预览本地视频或音频缓存",
    status: "merged",
  },
  {
    moduleId: "right-click-copy-as-image",
    displayName: "右键复制成图",
    externalPluginId: "canvas-copy-as-image",
    description: "右键卡片/表格/选区/整页复制为 PNG 图片",
    status: "merged",
  },
  {
    moduleId: "claudian-chat-archive",
    displayName: "Claudian 聊天记录同步",
    externalPluginId: "claudian",
    description:
      "轻量同步 Claudian 会话到 vault；换电脑后从 Claudian 原历史入口打开，并创建本机新线程继续聊天。需保持 Claudian 插件启用",
    status: "merged",
  },
  {
    moduleId: "claudian-agent-bridge",
    displayName: "Claudian Agent 接入修复",
    externalPluginId: "realclaudian",
    description:
      "Claudian 官方更新后，一键检测并重新接入本机 Cursor Agent 与 Codex CLI；脚本会先备份，失败时生成 Agent 修复提示。",
    status: "merged",
  },
  {
    moduleId: "block-link-plus",
    displayName: "指向链接增强",
    externalPluginId: "block-link-plus",
    description:
      "段落链接与文件夹链接均生成超短链接（^块ID / blp-folder://open?id=）；点击文件夹链接可在文件树定位并自定义高亮时长",
    status: "merged",
  },
  {
    moduleId: "onenote-rich-paste",
    displayName: "OneNote 粘贴（原生表格）",
    externalPluginId: MARKDOWN_TABLE_PLUGIN_ID,
    description:
      "从 OneNote 复制富文本后，点「粘贴OneNote」在光标处插入官方原生 Markdown 表格（无增强表格标记）；含表中表、链接、图片本地化。原生表格能力已内置。",
    status: "merged",
  },
];

type NativeColorPalette = {
  header: string;
  headerText: string;
  baseRow: string;
  altRow: string;
  border: string;
};

type NativeColorSettings = {
  defaultPresetId: string;
  defaultScale?: number;
  defaultColumnWidth?: number;
  defaultRowHeight?: number;
  defaultTextColor?: string;
  defaultZebraEnabled?: boolean;
  defaultBorderEnabled?: boolean;
  defaultHeaderAlignment?: NativeTableAutoAlignment;
  defaultFirstColumnAlignment?: NativeTableAutoAlignment;
  presets: Array<{
    id: string;
    label: string;
    palette: NativeColorPalette;
    saved?: boolean;
  }>;
  customPalette: NativeColorPalette;
  savedPalettes?: Array<{
    id: string;
    label: string;
    palette: NativeColorPalette;
    saved?: boolean;
  }>;
};

type NativeTableAutoAlignment = "off" | "left" | "center" | "right";

type AdvancedTableSettings = {
  bindTab: boolean;
  bindEnter: boolean;
  formatType: "normal" | "weak";
  showRibbonIcon: boolean;
};

const EXPERIENCE_SETTINGS_TABS: Array<{ id: ExperienceSettingsTabId; label: string }> = [
  { id: "toolbar", label: "文字工具栏" },
  { id: "nativeTable", label: "原生表格增强" },
  { id: "templateLibrary", label: "模板库管理" },
  { id: "modules", label: "自研功能开关" },
  { id: "plugins", label: "第三方插件管理" },
  { id: "videoSummary", label: "视频总结" },
];

const HOSTED_PLUGIN_DESCRIPTIONS: Record<string, string> = {
  "feishu-doc-toolbar": "统一入口层：T 工具栏、模板入口、总设置页",
  "markdown-table-enhancer": "原生表格颜色/长宽高、模板库",
  dragger: "块拖动能力，当前只托管状态，不自动启停",
  "canvas-copy-as-image": "右键复制卡片、表格、选区或页面成图",
  "global-wide-page": "全局宽页面和一键切换",
  "image-localizer": "文件自动本地化：远程图片落地 + OneNote/OneDrive 链接转换",
  "image-converter": "图片管理测试版底座：注释、标注、裁剪、对齐、拖拽缩放、粘贴重命名、批量处理",
  "image-upload-toolkit": "图片云端上传测试版：多图床/对象存储上传",
  "oz-clear-unused-images": "孤立图片清理测试版：扫描并清理未引用图片",
  "obsidian-html-plugin": "HTML Reader",
  univer: "表格工具",
  "obsidian-excel-to-markdown-table": "Excel 转 Markdown 表格",
  "block-link-plus": "指向链接增强",
  "obsidian-style-settings": "第三方样式设置",
  "recent-files-obsidian": "最近文件",
  tasknotes: "任务笔记",
  "settings-search": "设置搜索",
  claudian: "Claudian",
  realclaudian: "Claudian",
  yolo: "YOLO",
};

const MANAGED_PLUGIN_FALLBACK_CATEGORY_ID = "other";
const DEFAULT_MANAGED_PLUGIN_CATEGORIES: ManagedPluginCategory[] = [
  { id: "table", name: "表格工具" },
  { id: "block", name: "块体验" },
  { id: "automation", name: "自动化 / 任务" },
  { id: "content", name: "内容 / 阅读" },
  { id: "style", name: "样式 / 页面" },
  { id: "file", name: "文件 / 图片" },
  { id: "ai", name: "AI / 对话" },
  { id: MANAGED_PLUGIN_FALLBACK_CATEGORY_ID, name: "其他插件" },
];

const NATIVE_COLOR_FIELD_LABELS: Array<{ key: keyof NativeColorPalette; label: string }> = [
  { key: "header", label: "表头底色" },
  { key: "headerText", label: "表头文字" },
  { key: "baseRow", label: "正文底色" },
  { key: "altRow", label: "交替行底色" },
  { key: "border", label: "边框颜色" },
];

const ONENOTE_COLOR_SWATCHES = [
  "#FFFFFF", "#000000", "#E7E6E6", "#44546A", "#5B9BD5", "#ED7D31", "#A5A5A5", "#FFC000", "#4472C4", "#70AD47",
  "#F2F2F2", "#7F7F7F", "#D9EAF7", "#DDEBF7", "#FCE4D6", "#EDEDED", "#FFF2CC", "#D9E2F3", "#E2F0D9", "#EADCF8",
  "#D9D9D9", "#595959", "#BDD7EE", "#B4C6E7", "#F8CBAD", "#DBDBDB", "#FFE699", "#B4C6E7", "#C6E0B4", "#D9C2E9",
  "#BFBFBF", "#404040", "#9DC3E6", "#8EAADB", "#F4B183", "#C9C9C9", "#FFD966", "#8EA9DB", "#A9D18E", "#B4A7D6",
  "#A6A6A6", "#262626", "#5B9BD5", "#2F75B5", "#C65911", "#A5A5A5", "#BF9000", "#305496", "#548235", "#7030A0",
  "#FF0000", "#FFC000", "#FFFF00", "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0", "#990000",
];

const ONENOTE_NATIVE_TABLE_SCHEMES: Array<{ label: string; palette: NativeColorPalette }> = [
  {
    label: "浅蓝清单",
    palette: { header: "#9CC2E5", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#EAF3FF", border: "#9FBAD8" },
  },
  {
    label: "浅绿复盘",
    palette: { header: "#A9D18E", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#E2F0D9", border: "#9EAD93" },
  },
  {
    label: "黄绿步骤",
    palette: { header: "#C6E0B4", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#E2F0D9", border: "#A9B7A0" },
  },
  {
    label: "灰蓝资料",
    palette: { header: "#B4C6E7", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#D9EAF7", border: "#9AAAC6" },
  },
  {
    label: "浅黄重点",
    palette: { header: "#FFD966", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#FFF2CC", border: "#C9B05A" },
  },
  {
    label: "浅橙问题",
    palette: { header: "#F4B183", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#FCE4D6", border: "#C99A78" },
  },
  {
    label: "浅紫分类",
    palette: { header: "#B4A7D6", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#EADCF8", border: "#9C91B8" },
  },
  {
    label: "深蓝白字",
    palette: { header: "#2F5F9F", headerText: "#FFFFFF", baseRow: "#FFFFFF", altRow: "#EAF3FF", border: "#9FBAD8" },
  },
];

const COLOR_PRESETS: Array<{
  action: Extract<
    BlockAction,
    "colorYellow" | "colorBlue" | "colorGreen" | "colorRed" | "colorPurple" | "colorGray"
  >;
  label: string;
  color: string;
}> = [
  { action: "colorYellow", label: "浅黄", color: "#fff3bf" },
  { action: "colorBlue", label: "浅蓝", color: "#d0ebff" },
  { action: "colorGreen", label: "浅绿", color: "#d3f9d8" },
  { action: "colorRed", label: "浅红", color: "#ffe3e3" },
  { action: "colorPurple", label: "浅紫", color: "#e5dbff" },
  { action: "colorGray", label: "浅灰", color: "#f1f3f5" },
];

const STABLE_STYLE_GROUPS: ToolbarActionGroup[] = [
  {
    label: "缩进",
    items: [
      { action: "indentMore", label: "缩+" },
      { action: "indentLess", label: "缩-" },
    ],
    wide: true,
  },
  {
    label: "对齐",
    items: [
      { action: "alignLeft", label: "左" },
      { action: "alignCenter", label: "中" },
      { action: "alignRight", label: "右" },
    ],
    wide: true,
  },
  {
    label: "清除",
    items: [{ action: "clearStyle", label: "清" }],
    wide: true,
  },
];

const EXPERIMENTAL_STYLE_GROUPS: ToolbarActionGroup[] = [];

const COLOR_ACTION_TO_VALUE: Record<
  (typeof COLOR_PRESETS)[number]["action"],
  NonNullable<InlineStyleState["color"]>
> = {
  colorYellow: "yellow",
  colorBlue: "blue",
  colorGreen: "green",
  colorRed: "red",
  colorPurple: "purple",
  colorGray: "gray",
};

const EXPERIMENTAL_STYLE_ACTIONS = new Set<BlockAction>([
  ...EXPERIMENTAL_STYLE_GROUPS.flatMap((group) => group.items.map((item) => item.action)),
]);

const TEMPLATE_FOLDER_DEFAULT = ".templates";
const LEGACY_TEMPLATE_FOLDER = "模板库";
const TEMPLATE_INDEX_BASENAME = "templates-index.md";
const TEMPLATE_INDEX_NOTE = `${TEMPLATE_FOLDER_DEFAULT}/${TEMPLATE_INDEX_BASENAME}`;
const TEMPLATE_TRASH_FOLDER = ".回收站";
const TEMPLATE_MENU_LIMIT = 8;
const TEMPLATE_FRONTMATTER_ORDER_RE = /^menuOrder:\s*(\d+)\s*$/m;
const TEMPLATE_SYSTEM_LINE_RE = /^\s*%%\s*mdtp(?:-template)?\s*:/i;
const LOCAL_IMAGE_LIBRARY_PATH = "_attachments";
const HIDDEN_IMAGE_LIBRARY_PATH = ".assets/attachments";
const PROTECTED_LOCAL_LIBRARY_PATHS = [
  "_attachments",
  ".assets/attachments",
  ".模板库",
  ".obsidian",
  ".dev-git",
  ".claudian",
  ".claudian-sync",
];
const TABLE_PICKER_ROWS = 8;
const TABLE_PICKER_COLS = 8;
const MARKDOWN_TABLE_PLUGIN_ID = "markdown-table-enhancer";
const ENHANCED_TABLE_COMMANDS = {
  insertNativeColorTemplate: `${MARKDOWN_TABLE_PLUGIN_ID}:insert-native-color-table-template`,
  initializeNativeLayout: `${MARKDOWN_TABLE_PLUGIN_ID}:initialize-current-table-native-layout`,
  setNativeRowColor: `${MARKDOWN_TABLE_PLUGIN_ID}:set-current-native-table-row-color`,
  openNativeRowBands: `${MARKDOWN_TABLE_PLUGIN_ID}:open-current-native-table-row-bands`,
  pasteOneNoteRichTable: `${MARKDOWN_TABLE_PLUGIN_ID}:paste-onenote-rich-table`,
};

declare const __OSS_RELEASE__: boolean;
/** 仅 `OSS_RELEASE=1` 构建时为 true；日常本机构建始终为 false。 */
const ENHANCED_TABLE_FEATURE_LOCKED = __OSS_RELEASE__ === true;
const OSS_RELEASE = __OSS_RELEASE__ === true;

const DEFAULT_VIDEO_SUMMARY_SETTINGS: VideoSummaryUserSettings = {
  serviceUrl: "",
  agentJobsUrl: "",
  skillName: "视频总结 / video-summary",
  outputDir: "视频总结（仓库）",
  defaultPrompt:
    "保留完整转写原文，输出可点击时间轴；根据内容自动选择教程步骤、概念性知识三问或事实性知识总结；最终补齐 video_summary frontmatter。",
  enableLocalDiagnostics: !OSS_RELEASE,
};

const DEFAULT_SETTINGS_TAB_ORDER: ExperienceSettingsTabId[] = [
  "toolbar",
  "nativeTable",
  "templateLibrary",
  "modules",
  "plugins",
  "videoSummary",
];

const DEFAULT_DATA: FeishuDocToolbarData = {
  version: 1,
  templateFolderPath: TEMPLATE_FOLDER_DEFAULT,
  templateUngroupedLabel: "未分组",
  recentTemplatePaths: [],
  toolbarActionOrder: [],
  managedPluginAliases: {},
  managedPluginNotes: {},
  managedPluginCategories: {},
  managedPluginCategoryNames: {},
  managedPluginCategoryOrder: [],
  managedPluginStatusCheckedAt: 0,
  enableBetaFeatures: false,
  showOneNoteImport: true,
  showTableEnhancerEntrances: false,
  showDraggerIntegrationStatus: true,
  embeddedModules: {},
  settingsTabOrder: [...DEFAULT_SETTINGS_TAB_ORDER],
  managedPluginCategoryRemoved: [],
  autoUpdatePluginsEnabled: true,
  autoUpdatePluginIds: [...DEFAULT_AUTO_UPDATE_PLUGIN_IDS],
  autoUpdateLastRunAt: 0,
  autoUpdateLastResults: {},
  videoSummarySettings: { ...DEFAULT_VIDEO_SUMMARY_SETTINGS },
};

const ACTION_ICONS: Partial<Record<BlockAction, string>> = {
  italic:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>',
  strikethrough:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6c0-1.66-1.79-3-4-3S8 4.34 8 6c0 4 8 2 8 6 0 1.66-1.79 3-4 3s-4-1.34-4-3"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>',
  bullet:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
  numbered:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>',
  todo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  code:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
  quote:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 4-1.5 6-3 8Z"></path><path d="M17 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 4-1.5 6-3 8Z"></path></svg>',
  divider:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  tableMenu:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>',
  templateMenu:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
  insertImage:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
  insertFile:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
  highlightText:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 4 4L22 6"></path><path d="M2 20h7"></path><path d="M4 16 14 6l4 4L8 20H4z"></path></svg>',
  calloutNote:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  calloutFold:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="m8 17 4 4 4-4"></path></svg>',
  insertDate:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  insertLink:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
  commandPalette:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"></path></svg>',
};

const ACTION_TITLES: Partial<Record<BlockAction, string>> = {
  heading1: "一级标题",
  heading2: "二级标题",
  heading3: "三级标题",
  heading4: "四级标题",
  italic: "斜体",
  strikethrough: "删除线",
  bullet: "无序列表",
  numbered: "有序列表",
  todo: "待办",
  code: "代码块",
  quote: "引用",
  divider: "分割线",
  tableMenu: "插入表格",
  templateMenu: "模板库",
  insertImage: "插入图片",
  insertFile: "插入文件",
  highlightText: "高亮",
  copyMarkdown: "复制内容",
  copyImage: "导出成图",
  calloutNote: "高亮块",
  calloutFold: "折叠块",
  insertDate: "插入日期",
  insertLink: "插入链接",
  commandPalette: "命令面板",
};

const ACTION_MARKDOWN_HINTS: Partial<Record<BlockAction, string>> = {
  heading1: "#",
  heading2: "##",
  heading3: "###",
  heading4: "####",
  italic: "*斜体*",
  strikethrough: "~~删除线~~",
  bullet: "-",
  numbered: "1.",
  todo: "- [ ]",
  code: "```",
  quote: ">",
  highlightText: "==",
  divider: "---",
  calloutNote: "[!note]",
  calloutFold: "[!note]-",
  insertImage: "![]",
  insertFile: "[]()",
  insertLink: "[]()",
  commandPalette: "⌘P",
};

function normalizeTemplateFolderPath(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return TEMPLATE_FOLDER_DEFAULT;
  if (text === LEGACY_TEMPLATE_FOLDER) return TEMPLATE_FOLDER_DEFAULT;
  return normalizePath(text);
}

function normalizeRecentTemplatePath(value: string) {
  const normalized = normalizePath(value.trim());
  if (normalized.startsWith(`${LEGACY_TEMPLATE_FOLDER}/`)) {
    return normalizePath(`${TEMPLATE_FOLDER_DEFAULT}/${normalized.slice(LEGACY_TEMPLATE_FOLDER.length + 1)}`);
  }
  return normalized;
}

function confirmUserAction(message: string) {
  const confirmFn =
    (typeof window !== "undefined" ? window.confirm : undefined) ??
    (typeof globalThis !== "undefined"
      ? (globalThis as typeof globalThis & { confirm?: (msg: string) => boolean }).confirm
      : undefined);
  if (typeof confirmFn !== "function") return true;
  return confirmFn(message);
}

class FeishuDocExperienceSettingTab extends PluginSettingTab {
  private activeTab: ExperienceSettingsTabId = "toolbar";
  private activeNativeColorField: keyof NativeColorPalette = "header";

  constructor(
    app: any,
    private plugin: FeishuDocToolbarPlugin
  ) {
    super(app, plugin);
  }

  display() {
    const { containerEl } = this;
    containerEl.empty?.();
    if (!containerEl.empty) {
      containerEl.replaceChildren();
    }
    containerEl.addClass?.("fdtb-settings-page");

    const header = document.createElement("div");
    header.className = "fdtb-settings-header";
    const title = document.createElement("h2");
    title.textContent = "Obsidian增强体验";
    const version = document.createElement("span");
    version.className = "fdtb-settings-version-badge";
    version.textContent = `版本 ${this.plugin.getPluginVersion()}`;
    header.append(title, version);
    containerEl.appendChild(header);

    const desc = document.createElement("p");
    desc.className = "fdtb-settings-page-desc";
    desc.textContent = "集中管理已接入能力；第三方插件只做状态托管，不自动启停。";
    containerEl.appendChild(desc);

    this.renderSettingsTabs(containerEl);

    if (this.activeTab === "toolbar") {
      this.renderToolbarOrderSection(containerEl);
      return;
    }

    if (this.activeTab === "nativeTable") {
      this.renderTableEnhancerSection(containerEl);
      return;
    }

    if (this.activeTab === "templateLibrary") {
      void this.renderTemplateLibrarySection(containerEl);
      return;
    }

    if (this.activeTab === "modules") {
      this.renderOwnModulesSection(containerEl);
      return;
    }

    if (this.activeTab === "videoSummary") {
      this.renderVideoSummarySection(containerEl);
      return;
    }

    this.renderPluginHostSection(containerEl);
    this.renderDraggerSection(containerEl);
  }

  private renderVideoSummarySection(containerEl: HTMLElement) {
    this.appendSectionTitle(containerEl, "视频总结");

    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent =
      "集中管理视频总结 Skill、服务入口和时间轴预览。密钥、Cookie、Agent token 和网页密码不写入插件数据，也不会在这里明文显示。";
    containerEl.appendChild(intro);

    this.renderVideoSummaryConfig(containerEl);

    const toolbar = document.createElement("div");
    toolbar.className = "fdtb-video-summary-actions";
    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "mod-cta";
    refreshButton.textContent = "刷新状态";
    const webButton = document.createElement("button");
    webButton.type = "button";
    webButton.textContent = "打开网页入口";
    webButton.addEventListener("click", () => {
      const url = this.plugin.getVideoSummarySettings().serviceUrl;
      if (!url) {
        new Notice("请先填写视频总结网页入口 URL");
        return;
      }
      void this.plugin.openExternalUrl(url);
    });
    const copyApiButton = document.createElement("button");
    copyApiButton.type = "button";
    copyApiButton.textContent = "复制 Agent 接口";
    copyApiButton.addEventListener("click", async () => {
      const url = this.plugin.getVideoSummarySettings().agentJobsUrl;
      if (!url) {
        new Notice("请先填写 Agent 接口 URL");
        return;
      }
      await this.plugin.copyTextToClipboard(url);
      new Notice("已复制 Agent 接口 URL；密钥不会复制。");
    });
    toolbar.append(refreshButton, webButton, copyApiButton);
    containerEl.appendChild(toolbar);

    const content = document.createElement("div");
    content.className = "fdtb-video-summary-panel";
    content.textContent = "正在读取视频总结配置状态…";
    containerEl.appendChild(content);

    const load = async () => {
      refreshButton.disabled = true;
      content.empty?.();
      if (!content.empty) content.replaceChildren();
      content.textContent = "正在读取视频总结配置状态…";
      try {
        const data = await this.plugin.getVideoSummaryDiagnostics();
        this.renderVideoSummaryDiagnostics(content, data);
      } catch (error) {
        content.empty?.();
        if (!content.empty) content.replaceChildren();
        this.appendStatusRow(
          content,
          "视频总结状态",
          "读取失败",
          error instanceof Error ? error.message : String(error)
        );
      } finally {
        refreshButton.disabled = false;
      }
    };

    refreshButton.addEventListener("click", () => void load());
    void load();
  }

  private renderVideoSummaryConfig(containerEl: HTMLElement) {
    const settings = this.plugin.getVideoSummarySettings();
    const card = document.createElement("div");
    card.className = "fdtb-video-summary-config";

    const title = document.createElement("div");
    title.className = "fdtb-video-summary-config-title";
    title.textContent = "通用配置";
    const hint = document.createElement("p");
    hint.className = "fdtb-video-summary-config-hint";
    hint.textContent = "这里只保存可公开配置。Cookie、API Key、Agent token、网页密码继续由视频总结服务托管。";
    card.append(title, hint);

    const fields: Partial<Record<VideoSummaryStringSettingKey, HTMLInputElement | HTMLTextAreaElement>> = {};
    const appendInput = (key: VideoSummaryStringSettingKey, labelText: string, placeholder: string) => {
      const label = document.createElement("label");
      label.className = "fdtb-video-summary-field";
      const caption = document.createElement("span");
      caption.textContent = labelText;
      const input = document.createElement("input");
      input.type = "text";
      input.value = settings[key];
      input.placeholder = placeholder;
      label.append(caption, input);
      fields[key] = input;
      card.appendChild(label);
    };
    const appendTextarea = (key: VideoSummaryStringSettingKey, labelText: string, placeholder: string) => {
      const label = document.createElement("label");
      label.className = "fdtb-video-summary-field fdtb-video-summary-field-wide";
      const caption = document.createElement("span");
      caption.textContent = labelText;
      const textarea = document.createElement("textarea");
      textarea.value = settings[key];
      textarea.placeholder = placeholder;
      textarea.rows = 4;
      label.append(caption, textarea);
      fields[key] = textarea;
      card.appendChild(label);
    };

    appendInput("serviceUrl", "网页入口 URL", "https://example.com/");
    appendInput("agentJobsUrl", "Agent 接口 URL", "https://example.com/jobs");
    appendInput("skillName", "Skill 名称", "视频总结 / video-summary");
    appendInput("outputDir", "输出仓库说明", "例如：视频总结（仓库）");
    appendTextarea("defaultPrompt", "默认总结要求", "保留完整原文、可点击时间轴、按内容类型自动总结");

    const localRow = document.createElement("label");
    localRow.className = "fdtb-video-summary-checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = settings.enableLocalDiagnostics;
    const checkboxText = document.createElement("span");
    checkboxText.textContent = "启用本机状态读取（只适合自己的电脑；开源包默认关闭）";
    localRow.append(checkbox, checkboxText);
    card.appendChild(localRow);

    const actions = document.createElement("div");
    actions.className = "fdtb-video-summary-config-actions";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "mod-cta";
    saveButton.textContent = "保存配置";
    saveButton.addEventListener("click", async () => {
      await this.plugin.saveVideoSummarySettings({
        serviceUrl: fields.serviceUrl?.value ?? "",
        agentJobsUrl: fields.agentJobsUrl?.value ?? "",
        skillName: fields.skillName?.value ?? "",
        outputDir: fields.outputDir?.value ?? "",
        defaultPrompt: fields.defaultPrompt?.value ?? "",
        enableLocalDiagnostics: checkbox.checked,
      });
      new Notice("视频总结配置已保存；密钥类信息没有写入插件数据。");
      this.display();
    });
    const copyTemplateButton = document.createElement("button");
    copyTemplateButton.type = "button";
    copyTemplateButton.textContent = "复制调用模板";
    copyTemplateButton.addEventListener("click", async () => {
      const next = this.plugin.getVideoSummarySettings();
      const template = [
        `调用 Skill：${next.skillName}`,
        `网页入口：${next.serviceUrl || "待配置"}`,
        `Agent 接口：${next.agentJobsUrl || "待配置"}`,
        `输出仓库：${next.outputDir || "待配置"}`,
        `默认要求：${next.defaultPrompt}`,
        "注意：Bearer token、Cookie、API Key 不放在消息里，由本机视频总结服务托管。",
      ].join("\n");
      await this.plugin.copyTextToClipboard(template);
      new Notice("已复制视频总结调用模板；不包含密钥。");
    });
    actions.append(saveButton, copyTemplateButton);
    card.appendChild(actions);
    containerEl.appendChild(card);
  }

  private renderVideoSummaryDiagnostics(containerEl: HTMLElement, data: VideoSummaryDiagnostics) {
    containerEl.empty?.();
    if (!containerEl.empty) containerEl.replaceChildren();

    this.appendStatusRow(
      containerEl,
      "Obsidian 插件版本",
      data.pluginVersion,
      "本页只做私有配置状态查看；开源发行时可单独隔离此私有页。"
    );
    const customSummaryMode = data.scriptPath === "插件不读取本机脚本";
    this.appendStatusRow(
      containerEl,
      "视频总结 Skill",
      customSummaryMode ? "自定义配置" : data.skillExists && data.scriptExists ? "已接入" : "缺文件",
      `入口：${data.skillPath}；脚本：${data.scriptPath}`
    );
    this.appendStatusRow(
      containerEl,
      "默认模型",
      data.defaultModel || "未识别",
      data.visualEnabled ? "默认开启视频理解和截图分析" : "当前未开启视频理解"
    );
    this.appendStatusRow(
      containerEl,
      "输出仓库",
      "Obsidian 临时仓库",
      data.outputDir || "未配置输出仓库"
    );

    this.appendSectionTitle(containerEl, "服务入口");
    this.appendStatusRow(containerEl, "视频总结网页", data.serviceHealth.status, data.serviceUrl);
    this.appendStatusRow(containerEl, "Agent 调用接口", "URL 可见", `${data.agentJobsUrl}；调用密钥已隐藏`);
    this.appendStatusRow(containerEl, "BiliNote 后端", data.bilibiliNoteHealth.status, data.bilibiliNoteHealth.description);
    this.appendStatusRow(containerEl, "内容分享工作台", data.workbenchHealth.status, data.workbenchHealth.description);

    this.appendSectionTitle(containerEl, "隐私与密钥");
    this.appendStatusRow(
      containerEl,
      "服务配置文件",
      data.configExists ? "已找到" : "未找到",
      `${data.configPath}；只读取配置项状态，不显示明文密钥。`
    );
    this.appendStatusRow(
      containerEl,
      "Agent 调用密钥",
      data.agentTokenConfigured ? "已配置（已隐藏）" : "未配置",
      data.agentTokenConfigured ? `长度 ${data.agentTokenLength}；页面不会显示或复制 token。` : "Work Buddy 远程调用需要 Bearer token。"
    );
    this.appendStatusRow(
      containerEl,
      "网页访问密码",
      data.webPasswordConfigured ? "已设置（hash）" : "未设置",
      "页面只显示是否存在 hash，不显示生成密码。"
    );
    this.appendStatusRow(
      containerEl,
      "Session Secret",
      data.sessionSecretConfigured ? "已配置（已隐藏）" : "未配置",
      "用于网页登录态签名；不进入插件 data.json。"
    );

    this.appendSectionTitle(containerEl, "平台与 Cookie");
    for (const platform of data.platforms) {
      const delegated = platform.error?.includes("托管") === true;
      this.appendStatusRow(
        containerEl,
        platform.label,
        delegated ? "服务端托管" : platform.configured ? "Cookie 已配置" : "未配置",
        platform.error
          ? platform.error
          : platform.configured
            ? `只显示长度 ${platform.length}，不显示 Cookie 内容。`
            : "需要在 BiliNote 下载配置中补齐。"
      );
    }

    this.appendSectionTitle(containerEl, "工具链");
    this.appendStatusRow(containerEl, "模型供应商", data.providerBaseUrl ? "AutoDL" : "由服务端配置", data.providerBaseUrl || "插件不保存供应商密钥");
    this.appendStatusRow(
      containerEl,
      "Provider ID",
      data.providerId ? "已识别（已隐藏）" : "未识别",
      data.providerId ? "来自 BiliNote 模型配置；只显示识别状态，不显示内部 ID。" : "未从 BiliNote 读取到 provider_id"
    );
    this.appendStatusRow(containerEl, "云端媒体", "工作台发布", "生成端会把可播放 preview mp4 发布到内容分享工作台，并写入 media_url。");
  }

  private renderOwnModulesSection(containerEl: HTMLElement) {
    this.appendSectionTitle(containerEl, "自研功能开关");
    void this.plugin.refreshManagedPluginStatus({ silent: true });

    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent =
      "日常只需用右侧开关启停各功能。点击功能卡片可展开详细设置（交互与「模板库管理」里点分组一致）。模板请用「模板库管理」页签。";
    containerEl.appendChild(intro);

    for (const descriptor of OWN_MODULE_DESCRIPTORS) {
      this.appendOwnModuleRow(containerEl, descriptor);
    }

    this.appendSectionTitle(containerEl, "实验 / 测试功能");

    new Setting(containerEl)
      .setName("启用测试功能")
      .setDesc("解锁文字工具栏中的实验样式（颜色/格式实验项）。OneNote 粘贴已移至上方自研功能卡片。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.isBetaFeaturesEnabled()).onChange(async (value) => {
          await this.plugin.setBetaFeaturesEnabled(value);
          this.display();
        })
      );
  }

  /** OneNote 粘贴：稳定自研功能，开关 showOneNoteImport（不经过 embeddedModules）。 */
  private appendOneNoteRichPasteOwnModuleRow(containerEl: HTMLElement, descriptor: OwnModuleDescriptor) {
    const isEnabled = this.plugin.isOneNoteRichPasteEnabled();

    const card = document.createElement("details");
    card.className = "fdtb-own-module-card";
    card.open = isEnabled;

    const summary = document.createElement("summary");
    summary.className = "fdtb-own-module-card-summary";
    const summaryRow = document.createElement("div");
    summaryRow.className = "fdtb-plugin-manager-row";

    const main = document.createElement("div");
    main.className = "fdtb-plugin-manager-main";
    const title = document.createElement("div");
    title.className = "fdtb-plugin-manager-title";
    title.textContent = descriptor.displayName;
    const meta = document.createElement("div");
    meta.className = "fdtb-plugin-manager-meta";
    meta.textContent = "稳定自研功能（原生表格底座已内置）";
    const desc = document.createElement("div");
    desc.className = "fdtb-plugin-manager-desc";
    desc.textContent = descriptor.description;
    main.append(title, meta, desc);

    const controls = document.createElement("div");
    controls.className = "fdtb-plugin-manager-controls";
    const stateLabel = document.createElement("span");
    stateLabel.className = "fdtb-plugin-manager-meta";
    stateLabel.textContent = isEnabled ? "已启用" : "已禁用";
    controls.appendChild(stateLabel);

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "fdtb-plugin-manager-toggle";
    toggleLabel.title = "启用或关闭 OneNote 粘贴（原生表格）";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = isEnabled;
    const toggleTrack = document.createElement("span");
    toggleTrack.className = "fdtb-plugin-manager-toggle-track";
    toggleLabel.append(toggleInput, toggleTrack);
    toggleLabel.addEventListener("click", (event) => event.stopPropagation());
    toggleLabel.addEventListener("mousedown", (event) => event.stopPropagation());
    toggleInput.addEventListener("change", async () => {
      const nextEnabled = toggleInput.checked;
      toggleInput.disabled = true;
      try {
        await this.plugin.setOneNoteRichPasteEnabled(nextEnabled);
        this.display();
      } catch (error) {
        toggleInput.checked = isEnabled;
        toggleInput.disabled = false;
        new Notice(`开关失败：${error instanceof Error ? error.message : String(error)}`);
      }
    });
    controls.appendChild(toggleLabel);

    summaryRow.append(main, controls);
    summary.appendChild(summaryRow);

    const body = document.createElement("div");
    body.className = "fdtb-own-module-card-body";
    if (isEnabled) {
      body.dataset.rendered = "1";
      const hint = document.createElement("p");
      hint.className = "fdtb-settings-page-desc";
      hint.textContent =
        "从 OneNote 复制后点右下角「粘贴OneNote」，或在此执行命令。产出纯 pipe 表，无 %% mdtp 标记。";
      body.appendChild(hint);
      this.appendCommandRow(
        body,
        "粘贴OneNote",
        "从剪贴板读取 OneNote 富文本并插入当前笔记（含表中表、加粗、图片）",
        ENHANCED_TABLE_COMMANDS.pasteOneNoteRichTable
      );
    } else {
      body.createEl("p", {
        text: "开启上方开关后显示「粘贴OneNote」状态栏按钮。",
        cls: "setting-item-description",
      });
    }

    card.append(summary, body);
    card.addEventListener("toggle", () => {
      if (!card.open || body.dataset.rendered === "1") return;
      body.dataset.rendered = "1";
      body.empty();
      const hint = document.createElement("p");
      hint.className = "fdtb-settings-page-desc";
      hint.textContent =
        "从 OneNote 复制后点右下角「粘贴OneNote」，或在此执行命令。产出纯 pipe 表，无 %% mdtp 标记。";
      body.appendChild(hint);
      if (this.plugin.isOneNoteRichPasteEnabled()) {
        this.appendCommandRow(
          body,
          "粘贴OneNote",
          "从剪贴板读取 OneNote 富文本并插入当前笔记（含表中表、加粗、图片）",
          ENHANCED_TABLE_COMMANDS.pasteOneNoteRichTable
        );
      }
    });

    containerEl.appendChild(card);
  }

  private appendClaudianAgentBridgeOwnModuleRow(containerEl: HTMLElement, descriptor: OwnModuleDescriptor) {
    const card = document.createElement("details");
    card.className = "fdtb-own-module-card";

    const summary = document.createElement("summary");
    summary.className = "fdtb-own-module-card-summary";
    const summaryRow = document.createElement("div");
    summaryRow.className = "fdtb-plugin-manager-row";

    const main = document.createElement("div");
    main.className = "fdtb-plugin-manager-main";
    const title = document.createElement("div");
    title.className = "fdtb-plugin-manager-title";
    title.textContent = descriptor.displayName;
    const meta = document.createElement("div");
    meta.className = "fdtb-plugin-manager-meta";
    meta.textContent = "手动修复工具（只在点击按钮时运行）";
    const desc = document.createElement("div");
    desc.className = "fdtb-plugin-manager-desc";
    desc.textContent = descriptor.description;
    main.append(title, meta, desc);

    const controls = document.createElement("div");
    controls.className = "fdtb-plugin-manager-controls";
    const stateLabel = document.createElement("span");
    stateLabel.className = "fdtb-plugin-manager-meta";
    stateLabel.textContent = "按需执行";
    controls.appendChild(stateLabel);

    summaryRow.append(main, controls);
    summary.appendChild(summaryRow);

    const body = document.createElement("div");
    body.className = "fdtb-own-module-card-body";
    const hint = document.createElement("p");
    hint.className = "fdtb-settings-page-desc";
    hint.textContent =
      "检测会读取当前状态；一键修复会先备份 Claudian，再尝试重新接入 Cursor Agent 与 Codex CLI。若官方更新导致脚本失败，请复制 Agent 修复提示继续处理。";
    body.appendChild(hint);

    const actions = document.createElement("div");
    actions.className = "fdtb-plugin-manager-controls";
    body.appendChild(actions);

    const output = document.createElement("pre");
    output.className = "setting-item-description";
    output.style.whiteSpace = "pre-wrap";
    output.style.maxHeight = "220px";
    output.style.overflow = "auto";
    output.textContent = "尚未检测。";
    body.appendChild(output);

    const setButtonsDisabled = (disabled: boolean) => {
      actions.querySelectorAll("button").forEach((button) => {
        (button as HTMLButtonElement).disabled = disabled;
      });
    };
    const renderResult = (label: string, result: ClaudianAgentBridgeScriptResult) => {
      output.textContent = `${label}${result.ok ? "通过" : "失败"}\n\n${result.output.trim() || "无输出"}`;
      new Notice(result.ok ? `${label}通过` : `${label}失败，请查看输出`, result.ok ? 4000 : 8000);
    };

    this.appendBridgeActionButton(actions, "检测状态", async () => {
      setButtonsDisabled(true);
      output.textContent = "正在检测...";
      try {
        renderResult("检测", await this.plugin.runClaudianAgentBridgeScript("verify.sh"));
      } finally {
        setButtonsDisabled(false);
      }
    });
    this.appendBridgeActionButton(actions, "一键修复", async () => {
      if (!confirmAction("将备份并重建 Claudian 接入文件。确认继续？")) return;
      setButtonsDisabled(true);
      output.textContent = "正在修复，可能需要几分钟...";
      try {
        renderResult("修复", await this.plugin.runClaudianAgentBridgeScript("repair.sh"));
      } finally {
        setButtonsDisabled(false);
      }
    });
    this.appendBridgeActionButton(actions, "打开日志", async () => {
      await this.plugin.openClaudianAgentBridgeFile("logs/latest.log");
    });
    this.appendBridgeActionButton(actions, "复制 Agent 修复提示", async () => {
      const prompt = await this.plugin.readClaudianAgentBridgeFile("agent-repair-prompt.md");
      await this.plugin.copyTextToClipboard(prompt);
      new Notice("已复制 Agent 修复提示");
    });

    card.append(summary, body);
    containerEl.appendChild(card);
  }

  private appendBridgeActionButton(containerEl: HTMLElement, label: string, onClick: () => Promise<void>) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void onClick().catch((error) => {
        new Notice(`执行失败：${error instanceof Error ? error.message : String(error)}`, 8000);
      });
    });
    containerEl.appendChild(button);
  }

  private appendOwnModuleRow(containerEl: HTMLElement, descriptor: OwnModuleDescriptor) {
    if (descriptor.moduleId === "claudian-agent-bridge") {
      this.appendClaudianAgentBridgeOwnModuleRow(containerEl, descriptor);
      return;
    }
    if (descriptor.moduleId === "onenote-rich-paste") {
      this.appendOneNoteRichPasteOwnModuleRow(containerEl, descriptor);
      return;
    }
    const externalStatus = this.plugin.getManagedPluginStatus(descriptor.externalPluginId);
    const showEmbeddedDetail =
      descriptor.status === "merged" &&
      this.plugin.isEmbeddedModuleEnabled(descriptor.moduleId) &&
      (EMBEDDED_MODULE_SETTINGS_RENDERERS[descriptor.moduleId] || descriptor.moduleId === "block-link-plus");
    const externalFactory =
      descriptor.status === "external" &&
      externalStatus.enabled &&
      EXTERNAL_MODULE_SETTINGS_RENDERER_FACTORIES[descriptor.moduleId];
    const hasExpandableDetail = !!(showEmbeddedDetail || externalFactory);

    const mountMainAndControls = (mainHost: HTMLElement, controlsHost: HTMLElement) => {
      const main = document.createElement("div");
      main.className = "fdtb-plugin-manager-main";
      const title = document.createElement("div");
      title.className = "fdtb-plugin-manager-title";
      title.textContent = descriptor.displayName;
      const meta = document.createElement("div");
      meta.className = "fdtb-plugin-manager-meta";
      const migrationLabel = descriptor.status === "merged" ? "已合并到总插件" : "外部插件";
      const externalNote = descriptor.status === "merged"
        ? externalStatus.installed && externalStatus.enabled
          ? `（注意：外部插件 ${descriptor.externalPluginId} 仍是启用状态，建议手动关闭以免重复）`
          : externalStatus.installed
          ? `（外部同名插件已禁用，可放心使用）`
          : ""
        : `（原插件 id：${descriptor.externalPluginId}）`;
      meta.textContent = `${migrationLabel}${externalNote}`;
      const desc = document.createElement("div");
      desc.className = "fdtb-plugin-manager-desc";
      desc.textContent = descriptor.description;
      main.append(title, meta, desc);
      mainHost.appendChild(main);

      const controls = document.createElement("div");
      controls.className = "fdtb-plugin-manager-controls";

      if (descriptor.status === "merged") {
        const isEnabled = this.plugin.isEmbeddedModuleEnabled(descriptor.moduleId);
        const stateLabel = document.createElement("span");
        stateLabel.className = "fdtb-plugin-manager-meta";
        stateLabel.textContent = isEnabled ? "已启用（内嵌）" : "已禁用";
        controls.appendChild(stateLabel);

        const toggleLabel = document.createElement("label");
        toggleLabel.className = "fdtb-plugin-manager-toggle";
        toggleLabel.title = "启用或关闭该内嵌功能（不需要外部插件）";
        const toggleInput = document.createElement("input");
        toggleInput.type = "checkbox";
        toggleInput.checked = isEnabled;
        const toggleTrack = document.createElement("span");
        toggleTrack.className = "fdtb-plugin-manager-toggle-track";
        toggleLabel.append(toggleInput, toggleTrack);
        toggleLabel.addEventListener("click", (event) => event.stopPropagation());
        toggleLabel.addEventListener("mousedown", (event) => event.stopPropagation());

        toggleInput.addEventListener("change", async () => {
          const nextEnabled = toggleInput.checked;
          toggleInput.disabled = true;
          try {
            await this.plugin.setEmbeddedModuleEnabled(descriptor.moduleId, nextEnabled);
            this.display();
          } catch (error) {
            toggleInput.checked = isEnabled;
            toggleInput.disabled = false;
            new Notice(`开关失败：${error instanceof Error ? error.message : String(error)}`);
          }
        });
        controls.appendChild(toggleLabel);
      } else {
        this.appendManagedPluginToggleControls(controls, descriptor.externalPluginId, descriptor.displayName);
      }

      controlsHost.appendChild(controls);
    };

    if (hasExpandableDetail) {
      const card = document.createElement("details");
      card.className = "fdtb-own-module-card";

      const summary = document.createElement("summary");
      summary.className = "fdtb-own-module-card-summary";
      const summaryRow = document.createElement("div");
      summaryRow.className = "fdtb-plugin-manager-row";
      mountMainAndControls(summaryRow, summaryRow);
      summary.appendChild(summaryRow);

      const body = document.createElement("div");
      body.className = "fdtb-own-module-card-body";
      card.append(summary, body);

      card.addEventListener("toggle", () => {
        if (!card.open || body.dataset.rendered === "1") return;
        body.dataset.rendered = "1";
        body.empty();
        try {
          if (descriptor.moduleId === "block-link-plus" && showEmbeddedDetail) {
            renderBlockLinkPlusSettings(body, this.app, () => this.display());
          } else if (showEmbeddedDetail && EMBEDDED_MODULE_SETTINGS_RENDERERS[descriptor.moduleId]) {
            EMBEDDED_MODULE_SETTINGS_RENDERERS[descriptor.moduleId](body, () => this.display());
          } else if (externalFactory) {
            externalFactory(this.app)(body, () => this.display());
          }
        } catch (error) {
          body.createEl("p", {
            text: `渲染设置失败：${error instanceof Error ? error.message : String(error)}`,
            cls: "setting-item-description",
          });
        }
      });

      containerEl.appendChild(card);
      return;
    }

    const row = document.createElement("div");
    row.className = "fdtb-plugin-manager-row";
    mountMainAndControls(row, row);
    containerEl.appendChild(row);
  }

  private appendManagedPluginToggleControls(
    controls: HTMLElement,
    pluginId: string,
    displayName: string
  ) {
    const externalStatus = this.plugin.getManagedPluginStatus(pluginId);
    const stateLabel = document.createElement("span");
    stateLabel.className = "fdtb-plugin-manager-meta";
    stateLabel.textContent = !externalStatus.installed
      ? "未安装"
      : externalStatus.enabled
      ? "已启用"
      : "已安装未启用";
    controls.appendChild(stateLabel);

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "fdtb-plugin-manager-toggle";
    toggleLabel.setAttribute(
      "aria-label",
      `${displayName} ${externalStatus.enabled ? "已启用" : "未启用"}`
    );
    toggleLabel.title = externalStatus.installed
      ? "启用或关闭插件（与 Obsidian 第三方插件列表共用同一开关）"
      : "插件未安装，无法切换";
    toggleLabel.addEventListener("click", (event) => event.stopPropagation());
    toggleLabel.addEventListener("mousedown", (event) => event.stopPropagation());

    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = externalStatus.enabled;
    toggleInput.disabled = !externalStatus.installed;
    const toggleTrack = document.createElement("span");
    toggleTrack.className = "fdtb-plugin-manager-toggle-track";
    toggleLabel.append(toggleInput, toggleTrack);

    toggleInput.addEventListener("change", async () => {
      const nextEnabled = toggleInput.checked;
      toggleInput.disabled = true;
      try {
        const changed = await this.plugin.setManagedPluginEnabled(pluginId, nextEnabled);
        if (!changed) toggleInput.checked = externalStatus.enabled;
        this.display();
      } catch (error) {
        toggleInput.checked = externalStatus.enabled;
        toggleInput.disabled = !externalStatus.installed;
        new Notice(`开关失败：${error instanceof Error ? error.message : String(error)}`);
      }
    });
    controls.appendChild(toggleLabel);
  }

  private appendManagedPluginToggleRow(
    containerEl: HTMLElement,
    options: { pluginId: string; displayName: string; description: string; meta?: string }
  ) {
    const row = document.createElement("div");
    row.className = "fdtb-plugin-manager-row";

    const main = document.createElement("div");
    main.className = "fdtb-plugin-manager-main";
    const title = document.createElement("div");
    title.className = "fdtb-plugin-manager-title";
    title.textContent = options.displayName;
    if (options.meta) {
      const meta = document.createElement("div");
      meta.className = "fdtb-plugin-manager-meta";
      meta.textContent = options.meta;
      main.appendChild(meta);
    }
    const desc = document.createElement("div");
    desc.className = "fdtb-plugin-manager-desc";
    desc.textContent = options.description;
    main.append(title, desc);

    const controls = document.createElement("div");
    controls.className = "fdtb-plugin-manager-controls";
    this.appendManagedPluginToggleControls(controls, options.pluginId, options.displayName);

    row.append(main, controls);
    containerEl.appendChild(row);
  }

  private renderSettingsTabs(containerEl: HTMLElement) {
    const wrap = document.createElement("div");
    wrap.className = "fdtb-settings-tabs-wrap";

    const tabs = document.createElement("div");
    tabs.className = "fdtb-settings-tabs";
    const orderedTabs = this.plugin.getOrderedSettingsTabs();
    let draggingTabId: ExperienceSettingsTabId | null = null;
    let longPressTimer: number | null = null;

    const clearLongPressTimer = () => {
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    for (const tab of orderedTabs) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-settings-tab";
      button.textContent = tab.label;
      button.dataset.tabId = tab.id;
      button.draggable = true;
      button.toggleClass?.("is-active", this.activeTab === tab.id);
      if (!button.toggleClass && this.activeTab === tab.id) {
        button.classList.add("is-active");
      }

      button.addEventListener("click", () => {
        if (button.classList.contains("is-dragging")) return;
        this.activeTab = tab.id;
        this.display();
      });

      button.addEventListener("pointerdown", () => {
        clearLongPressTimer();
        longPressTimer = window.setTimeout(() => {
          button.classList.add("is-long-press-ready");
        }, 240);
      });
      button.addEventListener("pointerup", clearLongPressTimer);
      button.addEventListener("pointerleave", () => {
        clearLongPressTimer();
        button.classList.remove("is-long-press-ready");
      });

      button.addEventListener("dragstart", (event) => {
        draggingTabId = tab.id;
        button.classList.add("is-dragging");
        event.dataTransfer?.setData("text/fdtb-settings-tab", tab.id);
        event.dataTransfer?.setData("text/plain", tab.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      button.addEventListener("dragend", () => {
        draggingTabId = null;
        button.classList.remove("is-dragging", "is-long-press-ready");
        tabs.querySelectorAll(".is-drag-over").forEach((el) => el.classList.remove("is-drag-over"));
      });
      button.addEventListener("dragover", (event) => {
        if (!draggingTabId || draggingTabId === tab.id) return;
        event.preventDefault();
        button.classList.add("is-drag-over");
      });
      button.addEventListener("dragleave", () => {
        button.classList.remove("is-drag-over");
      });
      button.addEventListener("drop", async (event) => {
        event.preventDefault();
        button.classList.remove("is-drag-over");
        const sourceId = (event.dataTransfer?.getData("text/fdtb-settings-tab") ||
          event.dataTransfer?.getData("text/plain") ||
          draggingTabId) as ExperienceSettingsTabId | null;
        if (!sourceId || sourceId === tab.id) return;
        const moved = await this.plugin.moveSettingsTab(sourceId, tab.id);
        if (moved) this.display();
      });

      tabs.appendChild(button);
    }

    const hint = document.createElement("p");
    hint.className = "fdtb-settings-tabs-sort-hint";
    hint.textContent = "长按拖动可排序顶部导航栏。";

    wrap.append(tabs, hint);
    containerEl.appendChild(wrap);
  }

  private renderToolbarOrderSection(containerEl: HTMLElement) {
    this.appendSectionTitle(containerEl, "T 工具栏预览与排序");

    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent =
      "下方是编辑时点击 T 按钮弹出的导航栏预览。拖动按钮可调整顺序，保存后立即作用于正文中的 T 工具栏；只改显示顺序，不改按钮功能。";
    containerEl.appendChild(intro);

    const workbench = document.createElement("div");
    workbench.className = "fdtb-settings-toolbar-workbench";

    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "fdtb-handle fdtb-settings-toolbar-handle-demo";
    handle.disabled = true;
    handle.setAttribute("aria-hidden", "true");
    const handleText = document.createElement("span");
    handleText.className = "fdtb-handle-text";
    handleText.textContent = "T";
    handle.appendChild(handleText);

    const preview = this.plugin.buildSettingsToolbarPreview(() => {
      this.display();
    });

    workbench.append(handle, preview);
    containerEl.appendChild(workbench);

    const hint = document.createElement("p");
    hint.className = "fdtb-settings-toolbar-sort-hint";
    hint.textContent = "提示：只能在同一分组内拖动（「排版」内互换、「插入内容」内互换），不能跨组移动。";
    containerEl.appendChild(hint);

    new Setting(containerEl)
      .setName("恢复默认顺序")
      .setDesc("只重置 T 工具栏按钮位置，不影响模板、表格、Dragger 等功能")
      .addButton((button) =>
        button.setButtonText("重置").onClick(async () => {
          await this.plugin.resetToolbarActionOrder({ keepPopover: false });
          this.display();
        })
      );
  }

  private async renderTemplateLibrarySection(containerEl: HTMLElement) {
    this.appendSectionTitle(containerEl, "模板库管理");

    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent =
      "模板统一保存在隐藏目录 .templates/，可按子文件夹分组。点击模板名可展开预览内容，再点「插入到当前笔记」写入光标处；与 T 工具栏「模板库」联动。";
    containerEl.appendChild(intro);

    this.renderLocalLibraryPathsSection(containerEl);

    new Setting(containerEl)
      .setName("模板目录")
      .setDesc("默认 .templates；留空也会回退到该目录")
      .addText((text) =>
        text
          .setPlaceholder(TEMPLATE_FOLDER_DEFAULT)
          .setValue(this.plugin.getTemplateFolderPath())
          .onChange(async (value) => {
            await this.plugin.updateTemplateFolderPath(value);
          })
      );

    this.appendInlineForm(containerEl, {
      label: "新建分组",
      desc: "在模板目录下创建子文件夹，例如「复盘」或「工作/复盘」",
      placeholder: "分组名称",
      buttonText: "创建",
      onSubmit: async (name) => {
        const ok = await this.plugin.createTemplateSubfolder(name);
        if (ok) this.display();
      },
    });

    this.appendInlineForm(containerEl, {
      label: "新建空模板",
      desc: "名称可用「分组/模板名」直接保存到子文件夹",
      placeholder: "模板名称，如：复盘/事件",
      buttonText: "创建",
      onSubmit: async (name) => {
        const ok = await this.plugin.createBlankTemplate(name);
        if (ok) this.display();
      },
    });

    const listHost = document.createElement("div");
    listHost.className = "fdtb-template-settings-list-host";
    containerEl.appendChild(listHost);

    const tree = await this.plugin.buildFullTemplateTree();
    const groupOptions = await this.plugin.getTemplateGroupMoveOptions();
    const hasTemplates = tree.templates.length > 0;
    const hasFolders = tree.folders.size > 0;

    if (!hasTemplates && !hasFolders) {
      listHost.createEl("p", {
        cls: "setting-item-description",
        text: "还没有模板或分组。可先「新建分组」，再「新建模板」或从 T 工具栏保存当前块。",
      });
    } else {
      const list = document.createElement("div");
      list.className = "fdtb-template-settings-tree";
      this.renderTemplateUngroupedSection(list, tree, groupOptions);
      const folders = Array.from(tree.folders.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"));
      for (const [folderName, child] of folders) {
        this.renderTemplateFolderSection(list, folderName, child, folderName, groupOptions);
      }
      listHost.appendChild(list);
    }

    await this.renderTemplateTrashSection(containerEl);
  }

  private renderLocalLibraryPathsSection(containerEl: HTMLElement) {
    const card = containerEl.createEl("details", { cls: "fdtb-local-library-card" });
    const summary = card.createEl("summary", { cls: "fdtb-local-library-summary" });
    summary.createDiv({ cls: "fdtb-local-library-title", text: "本地图片库位置" });
    summary.createSpan({ cls: "fdtb-local-library-toggle", text: "展开" });

    const desc = card.createDiv({ cls: "fdtb-local-library-desc" });
    desc.textContent = "这里仅展示路径，方便复制和确认；不会移动、删除或改写这些文件夹。";

    this.appendCopyableLocalPath(card, "图片存放位置", LOCAL_IMAGE_LIBRARY_PATH);
    this.appendCopyableLocalPath(card, "隐藏图片库", HIDDEN_IMAGE_LIBRARY_PATH);

    const protectedWrap = card.createDiv({ cls: "fdtb-local-library-protected" });
    protectedWrap.createDiv({ cls: "fdtb-local-library-label", text: "不敢删除的部分" });
    const list = protectedWrap.createEl("ul", { cls: "fdtb-local-library-protected-list" });
    for (const path of PROTECTED_LOCAL_LIBRARY_PATHS) {
      const item = list.createEl("li");
      item.createEl("code", { text: this.plugin.getVaultChildSystemPath(path) });
    }
  }

  private appendCopyableLocalPath(parent: HTMLElement, label: string, relativePath: string) {
    const fullPath = this.plugin.getVaultChildSystemPath(relativePath);
    const row = parent.createDiv({ cls: "fdtb-local-library-row" });
    const main = row.createDiv({ cls: "fdtb-local-library-main" });
    main.createDiv({ cls: "fdtb-local-library-label", text: label });
    main.createEl("code", { cls: "fdtb-local-library-path", text: fullPath });

    const button = row.createEl("button", {
      cls: "mod-cta fdtb-local-library-copy",
      text: "复制",
    });
    button.type = "button";
    button.addEventListener("click", async () => {
      try {
        await this.plugin.copyTextToClipboard(fullPath);
        new Notice(`已复制：${label}`);
      } catch (error) {
        console.error("[fdtb] copy local library path failed", error);
        new Notice("复制失败，请手动选中路径复制");
      }
    });
  }

  private async renderTemplateTrashSection(containerEl: HTMLElement) {
    const trashed = await this.plugin.listTrashedTemplates();

    const section = document.createElement("details");
    section.className = "fdtb-template-settings-trash";

    const summary = document.createElement("summary");
    summary.className = "fdtb-template-settings-trash-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "fdtb-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "fdtb-template-folder-title-text";
    titleText.textContent = trashed.length > 0 ? `模板回收站（${trashed.length}）` : "模板回收站";
    titleWrap.appendChild(titleText);
    summary.appendChild(titleWrap);
    section.appendChild(summary);

    const body = document.createElement("div");
    body.className = "fdtb-template-settings-trash-body";

    const desc = document.createElement("p");
    desc.className = "setting-item-description";
    desc.textContent =
      trashed.length > 0
        ? "删除的模板暂存于此，可恢复至原分组，或永久删除。"
        : "删除模板后会移入回收站。此处为空表示没有待恢复的模板。";
    body.appendChild(desc);

    if (trashed.length > 0) {
      const list = document.createElement("div");
      list.className = "fdtb-template-settings-trash-list";
      for (const item of trashed) {
        list.appendChild(this.createTrashedTemplateRow(item));
      }
      body.appendChild(list);

      const emptyBtn = document.createElement("button");
      emptyBtn.type = "button";
      emptyBtn.className = "fdtb-template-trash-empty-btn";
      emptyBtn.textContent = "清空回收站";
      emptyBtn.addEventListener("click", () => {
        void this.plugin.emptyTemplateTrash().then((ok) => {
          if (ok) this.display();
        });
      });
      body.appendChild(emptyBtn);
    }

    section.appendChild(body);
    containerEl.appendChild(section);
  }

  private createTrashedTemplateRow(item: TrashedTemplateItem) {
    const row = document.createElement("div");
    row.className = "fdtb-template-settings-trash-row";

    const main = document.createElement("div");
    main.className = "fdtb-template-settings-row-main";
    const title = document.createElement("div");
    title.className = "fdtb-template-settings-row-title";
    title.textContent = item.title;
    const meta = document.createElement("div");
    meta.className = "fdtb-template-settings-row-meta";
    const groupLabel = item.originalGroup || this.plugin.getTemplateUngroupedLabel();
    const deletedLabel =
      item.deletedAt > 0
        ? new Date(item.deletedAt).toLocaleString("zh-CN", { hour12: false })
        : "未知时间";
    meta.textContent = `原分组：${groupLabel} · 删除于 ${deletedLabel}`;
    main.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "fdtb-template-settings-row-actions";

    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.textContent = "恢复";
    restoreBtn.addEventListener("click", () => {
      void this.plugin.restoreTemplateFromTrash(item.trashPath).then((ok) => {
        if (ok) this.display();
      });
    });

    const purgeBtn = document.createElement("button");
    purgeBtn.type = "button";
    purgeBtn.className = "fdtb-template-settings-delete";
    purgeBtn.textContent = "永久删除";
    purgeBtn.addEventListener("click", () => {
      void this.plugin.purgeTrashedTemplate(item.trashPath).then((ok) => {
        if (ok) this.display();
      });
    });

    actions.append(restoreBtn, purgeBtn);
    row.append(main, actions);
    return row;
  }

  private renderTemplateUngroupedSection(
    container: HTMLElement,
    root: TemplateTreeNode,
    groupOptions: Array<{ value: string; label: string }>
  ) {
    const group = document.createElement("details");
    group.className = "fdtb-template-settings-folder";
    group.open = true;

    const summary = document.createElement("summary");
    summary.className = "fdtb-template-settings-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "fdtb-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "fdtb-template-folder-title-text";
    titleText.textContent = this.plugin.getTemplateUngroupedLabel();
    titleText.title = "双击可改名";
    this.attachInlineRenameOnDoubleClick(titleText, {
      initial: () => this.plugin.getTemplateUngroupedLabel(),
      onCommit: async (value) => {
        await this.plugin.setTemplateUngroupedLabel(value);
        this.display();
      },
    });
    titleWrap.appendChild(titleText);

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "fdtb-template-folder-rename-btn";
    renameBtn.textContent = "改名";
    renameBtn.title = "修改「未分组」在界面上的显示名称（不移动文件）";
    renameBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.beginInlineRename(titleText, {
        initial: this.plugin.getTemplateUngroupedLabel(),
        onCommit: async (value) => {
          await this.plugin.setTemplateUngroupedLabel(value);
          this.display();
        },
      });
    });
    titleWrap.append(renameBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "fdtb-template-folder-delete-btn";
    deleteBtn.textContent = "删除";
    deleteBtn.title = "无模板时恢复默认名称「未分组」；有模板时删除根目录全部模板";
    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.deleteUngroupedTemplateGroup().then((ok) => {
        if (ok) this.display();
      });
    });
    titleWrap.append(deleteBtn);
    summary.appendChild(titleWrap);
    group.appendChild(summary);

    const body = document.createElement("div");
    body.className = "fdtb-template-settings-folder-body";
    if (root.templates.length === 0) {
      body.createEl("p", {
        cls: "setting-item-description",
        text: "暂无根目录模板。可用下方「移到分组」把模板迁入其他分组。",
      });
    } else {
      for (const template of this.plugin.sortTemplateDescriptors(root.templates)) {
        body.appendChild(this.createTemplateSettingsRow(template, groupOptions));
      }
    }
    group.appendChild(body);
    container.appendChild(group);
  }

  private beginInlineRename(
    anchor: HTMLElement,
    options: { initial: string; onCommit: (value: string) => void | Promise<void> }
  ) {
    const parent = anchor.parentElement;
    if (!parent) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fdtb-template-folder-rename-input";
    input.value = options.initial;
    anchor.style.display = "none";
    parent.appendChild(input);
    input.focus();
    input.select();

    const finish = async (commit: boolean) => {
      input.remove();
      anchor.style.display = "";
      if (!commit) return;
      const next = input.value.trim();
      if (!next || next === options.initial) return;
      await options.onCommit(next);
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void finish(true);
      if (event.key === "Escape") void finish(false);
    });
    input.addEventListener("blur", () => void finish(true));
  }

  private attachInlineRenameOnDoubleClick(
    anchor: HTMLElement,
    options: { initial: string | (() => string); onCommit: (value: string) => void | Promise<void> }
  ) {
    anchor.addEventListener("dblclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const initial = typeof options.initial === "function" ? options.initial() : options.initial;
      this.beginInlineRename(anchor, { initial, onCommit: options.onCommit });
    });
  }

  private renderTemplateFolderSection(
    container: HTMLElement,
    folderName: string,
    node: TemplateTreeNode,
    relativePath: string,
    groupOptions: Array<{ value: string; label: string }>
  ) {
    const group = document.createElement("details");
    group.className = "fdtb-template-settings-folder";
    group.open = true;

    const summary = document.createElement("summary");
    summary.className = "fdtb-template-settings-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "fdtb-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "fdtb-template-folder-title-text";
    titleText.textContent = folderName;
    titleText.title = "双击可改名";
    this.attachInlineRenameOnDoubleClick(titleText, {
      initial: () => folderName,
      onCommit: async (value) => {
        const ok = await this.plugin.renameTemplateGroup(relativePath, value);
        if (ok) this.display();
      },
    });
    titleWrap.appendChild(titleText);

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "fdtb-template-folder-rename-btn";
    renameBtn.textContent = "改名";
    renameBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.beginInlineRename(titleText, {
        initial: folderName,
        onCommit: async (value) => {
          const ok = await this.plugin.renameTemplateGroup(relativePath, value);
          if (ok) this.display();
        },
      });
    });
    titleWrap.append(renameBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "fdtb-template-folder-delete-btn";
    deleteBtn.textContent = "删除";
    deleteBtn.title = "删除分组；组内模板将移至根目录";
    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.deleteTemplateGroup(relativePath).then((ok) => {
        if (ok) this.display();
      });
    });
    titleWrap.append(deleteBtn);
    summary.appendChild(titleWrap);
    group.appendChild(summary);

    const body = document.createElement("div");
    body.className = "fdtb-template-settings-folder-body";

    if (node.templates.length === 0 && node.folders.size === 0) {
      body.createEl("p", {
        cls: "setting-item-description",
        text: "分组已创建，暂无模板。可在上方「新建模板」填写「分组名/模板名」，或把其他模板移入本分组。",
      });
    }

    for (const template of this.plugin.sortTemplateDescriptors(node.templates)) {
      body.appendChild(this.createTemplateSettingsRow(template, groupOptions));
    }

    const nested = Array.from(node.folders.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"));
    for (const [childName, childNode] of nested) {
      const childRel = `${relativePath}/${childName}`;
      this.renderTemplateFolderSection(body, childName, childNode, childRel, groupOptions);
    }

    group.appendChild(body);
    container.appendChild(group);
  }

  private appendInlineForm(
    containerEl: HTMLElement,
    options: {
      label: string;
      desc: string;
      placeholder: string;
      buttonText: string;
      onSubmit: (value: string) => void | Promise<void>;
    }
  ) {
    const wrap = document.createElement("div");
    wrap.className = "fdtb-template-inline-form setting-item";

    const info = document.createElement("div");
    info.className = "setting-item-info";
    const name = document.createElement("div");
    name.className = "setting-item-name";
    name.textContent = options.label;
    const desc = document.createElement("div");
    desc.className = "setting-item-description";
    desc.textContent = options.desc;
    info.append(name, desc);

    const control = document.createElement("div");
    control.className = "setting-item-control fdtb-template-inline-form-control";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "fdtb-template-inline-input";
    input.placeholder = options.placeholder;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mod-cta fdtb-template-inline-btn";
    btn.textContent = options.buttonText;
    btn.disabled = true;

    input.addEventListener("input", () => {
      btn.disabled = !input.value.trim();
    });

    const submit = async () => {
      const value = input.value.trim();
      if (!value) return;
      btn.disabled = true;
      input.disabled = true;
      try {
        await options.onSubmit(value);
      } finally {
        input.disabled = false;
        input.value = "";
        btn.disabled = true;
      }
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void submit();
      if (event.key === "Escape") {
        input.value = "";
        btn.disabled = true;
      }
    });
    btn.addEventListener("click", () => void submit());

    control.append(input, btn);
    wrap.append(info, control);
    containerEl.appendChild(wrap);
  }

  private createTemplateSettingsRow(
    template: TemplateDescriptor,
    groupOptions: Array<{ value: string; label: string }>
  ) {
    const item = document.createElement("details");
    item.className = "fdtb-template-settings-item";

    const summary = document.createElement("summary");
    summary.className = "fdtb-template-settings-item-title";

    const summaryRow = document.createElement("div");
    summaryRow.className = "fdtb-template-settings-row";

    const main = document.createElement("div");
    main.className = "fdtb-template-settings-row-main";
    const title = document.createElement("div");
    title.className = "fdtb-template-settings-row-title";
    title.textContent = template.title;
    title.title = "双击可改名";
    this.attachInlineRenameOnDoubleClick(title, {
      initial: template.title,
      onCommit: async (value) => {
        const ok = await this.plugin.renameTemplateAtPath(template.path, value);
        if (ok) this.display();
      },
    });
    const meta = document.createElement("div");
    meta.className = "fdtb-template-settings-row-meta";
    meta.textContent = template.path;
    main.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "fdtb-template-settings-row-actions";

    const stopToggle = (event: Event) => event.stopPropagation();

    const moveWrap = document.createElement("label");
    moveWrap.className = "fdtb-template-move-wrap";
    moveWrap.title = "移到其他分组";
    moveWrap.addEventListener("click", stopToggle);
    moveWrap.addEventListener("mousedown", stopToggle);
    const moveLabel = document.createElement("span");
    moveLabel.className = "fdtb-template-move-label";
    moveLabel.textContent = "移到";
    const moveSelect = document.createElement("select");
    moveSelect.className = "fdtb-template-move-select";
    const currentGroup = template.folderSegments.join("/");
    for (const option of groupOptions) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      opt.selected = option.value === currentGroup;
      moveSelect.appendChild(opt);
    }
    moveSelect.addEventListener("click", stopToggle);
    moveSelect.addEventListener("mousedown", stopToggle);
    moveSelect.addEventListener("change", async () => {
      const target = moveSelect.value;
      if (target === currentGroup) return;
      moveSelect.disabled = true;
      const ok = await this.plugin.moveTemplateToGroup(template.path, target);
      if (ok) {
        this.display();
        return;
      }
      moveSelect.disabled = false;
      moveSelect.value = currentGroup;
    });
    moveWrap.append(moveLabel, moveSelect);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "编辑";
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void this.plugin.editTemplateAtPath(template.path);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "fdtb-template-settings-delete";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void this.plugin.deleteTemplateAtPath(template.path).then((deleted) => {
        if (deleted) this.display();
      });
    });

    actions.append(moveWrap, editButton, deleteButton);
    summaryRow.append(main, actions);
    summary.appendChild(summaryRow);

    const body = document.createElement("div");
    body.className = "fdtb-template-settings-item-body";

    const preview = document.createElement("div");
    preview.className = "fdtb-template-settings-preview";
    preview.textContent = "点击模板名展开后加载预览…";

    const insertButton = document.createElement("button");
    insertButton.type = "button";
    insertButton.className = "mod-cta fdtb-template-settings-insert-btn";
    insertButton.textContent = "插入到当前笔记";
    insertButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void this.plugin.insertTemplateAtActiveEditor(template.path);
    });

    body.append(preview, insertButton);

    let previewLoaded = false;
    item.addEventListener("toggle", () => {
      if (!item.open || previewLoaded) return;
      previewLoaded = true;
      void this.plugin.renderTemplatePreviewInto(preview, template.path);
    });

    item.append(summary, body);
    return item;
  }


  private renderTableEnhancerSection(containerEl: HTMLElement) {
    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent =
      "原生表格颜色、长宽高、对齐、轻量公式、自动填充与模板库已内置在 Obsidian增强体验中。OneNote 粘贴为原生 Markdown 表，不启用增强表格。";
    containerEl.appendChild(intro);

    const advancedSection = this.createSettingsCollapsibleSection("编辑体验与内置能力", {
      hint: "原生表格增强、公式/自动填充和 Advanced Tables 编辑体验",
      open: false,
    });
    this.appendStatusRow(advancedSection.body, "原生表格增强", "已内置", `内部能力 id：${MARKDOWN_TABLE_PLUGIN_ID}`);
    this.appendStatusRow(advancedSection.body, "公式 / 自动填充", "已内置", "支持 LaTeX 显示、SUM/AVG/MIN/MAX 和拖拽自动填充");
    this.appendStatusRow(advancedSection.body, "Advanced Tables 编辑体验", "已接入", "支持跳格、格式化、增删移动、排序、转置、公式与 CSV");
    this.renderAdvancedTableSettings(advancedSection.body);
    containerEl.appendChild(advancedSection.details);

    this.renderNativeTableColorSettings(containerEl);
  }

  private createSettingsCollapsibleSection(
    titleText: string,
    options?: { hint?: string; open?: boolean }
  ) {
    const details = document.createElement("details");
    details.className = "fdtb-settings-collapsible-section fdtb-settings-collapsible-section-compact";
    details.open = options?.open ?? false;

    const summary = document.createElement("summary");
    summary.className = "fdtb-settings-collapsible-summary";
    const title = document.createElement("span");
    title.className = "fdtb-settings-collapsible-title";
    title.textContent = titleText;
    summary.appendChild(title);
    if (options?.hint) {
      const hint = document.createElement("span");
      hint.className = "fdtb-settings-collapsible-hint";
      hint.textContent = options.hint;
      summary.appendChild(hint);
    }

    const body = document.createElement("div");
    body.className = "fdtb-settings-collapsible-body";
    details.append(summary, body);
    return { details, body };
  }

  private renderAdvancedTableSettings(containerEl: HTMLElement) {
    const settings = this.plugin.getAdvancedTableSettingsForManager();
    if (!settings) {
      this.appendStatusRow(containerEl, "Advanced Tables 设置", "未接通", "需要启用原生表格增强模块后才能设置编辑体验");
      return;
    }

    const card = document.createElement("div");
    card.className = "fdtb-native-color-card";

    const header = document.createElement("div");
    header.className = "fdtb-native-color-header";
    const title = document.createElement("div");
    title.className = "fdtb-native-color-title";
    title.textContent = "Advanced Tables 编辑体验";
    const hint = document.createElement("div");
    hint.className = "fdtb-native-color-hint";
    hint.textContent = "默认对齐成熟插件；遇到中文输入法或其他快捷键冲突时，可关闭 Tab / Enter 绑定。";
    header.append(title, hint);
    card.appendChild(header);

    card.appendChild(
      this.createAdvancedTableToggleRow({
        label: "Tab / Shift+Tab 跳格",
        checked: settings.bindTab,
        onChange: async (checked) => {
          await this.plugin.updateAdvancedTableSettingsFromManager({ bindTab: checked });
          this.display();
        },
      })
    );

    card.appendChild(
      this.createAdvancedTableToggleRow({
        label: "Enter 跳到下一行",
        checked: settings.bindEnter,
        onChange: async (checked) => {
          await this.plugin.updateAdvancedTableSettingsFromManager({ bindEnter: checked });
          this.display();
        },
      })
    );

    card.appendChild(
      this.createAdvancedTableToggleRow({
        label: "显示 Advanced Tables 侧栏图标",
        checked: settings.showRibbonIcon,
        hint: "默认关闭，保留现有「表」按钮作为主入口；打开后需重载插件生效。",
        onChange: async (checked) => {
          await this.plugin.updateAdvancedTableSettingsFromManager({ showRibbonIcon: checked });
          this.display();
        },
      })
    );

    const formatSelect = document.createElement("select");
    formatSelect.value = settings.formatType;
    for (const option of [
      { value: "normal", label: "自动对齐列宽" },
      { value: "weak", label: "轻量格式化" },
    ] as const) {
      const item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      formatSelect.appendChild(item);
    }
    formatSelect.addEventListener("change", async () => {
      await this.plugin.updateAdvancedTableSettingsFromManager({
        formatType: formatSelect.value === "weak" ? "weak" : "normal",
      });
      this.display();
    });
    card.appendChild(
      this.createNativeTableSettingRow({
        label: "格式化方式",
        valueText: settings.formatType === "weak" ? "轻量格式化" : "自动对齐列宽",
        input: formatSelect,
      })
    );

    containerEl.appendChild(card);
  }

  private createAdvancedTableToggleRow(options: {
    label: string;
    checked: boolean;
    hint?: string;
    onChange: (checked: boolean) => Promise<void>;
  }) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = options.checked;
    input.addEventListener("change", () => void options.onChange(input.checked));
    return this.createNativeTableSettingRow({
      label: options.label,
      valueText: options.checked ? "已开启" : "已关闭",
      hint: options.hint,
      input,
    });
  }

  private renderNativeTableColorSettings(containerEl: HTMLElement) {
    const settings = this.plugin.getNativeColorSettingsForManager();
    if (!settings) {
      this.appendStatusRow(containerEl, "原生表格配色", "未接通", "需要启用 markdown-table-enhancer 后才能设置默认配色");
      return;
    }

    const card = document.createElement("div");
    card.className = "fdtb-native-color-card";

    const header = document.createElement("div");
    header.className = "fdtb-native-color-header";
    const title = document.createElement("div");
    title.className = "fdtb-native-color-title";
    title.textContent = "默认原生表格配色";
    const hint = document.createElement("div");
    hint.className = "fdtb-native-color-hint";
    hint.textContent = "新建彩色表格、右键对当前表格美化，只应用配色；长宽高保持原生表格尺寸，手动调节后才生效。";
    header.append(title, hint);
    card.appendChild(header);
    card.appendChild(this.createNativeTableDefaultControls(settings));

    const presetList = document.createElement("div");
    presetList.className = "fdtb-native-color-presets";
    for (const preset of settings.presets) {
      const presetButton = document.createElement("button");
      presetButton.type = "button";
      presetButton.className = "fdtb-native-color-preset";
      if (settings.defaultPresetId === preset.id) {
        presetButton.classList.add("is-active");
      }
      presetButton.append(
        this.createPalettePreview(preset.palette),
        this.createTextSpan("fdtb-native-color-preset-label", preset.label)
      );
      presetButton.addEventListener("click", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({ defaultPresetId: preset.id });
        this.display();
      });
      presetList.appendChild(presetButton);
    }
    card.appendChild(presetList);

    const activePreset = settings.presets.find((preset) => preset.id === settings.defaultPresetId);
    const previewPalette = activePreset?.palette ?? settings.customPalette;
    const livePreview = this.createNativeColorLivePreview(previewPalette);
    card.appendChild(livePreview);

    const schemeWrap = document.createElement("div");
    schemeWrap.className = "fdtb-native-color-schemes";
    schemeWrap.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "推荐固定方案"));
    const schemeGrid = document.createElement("div");
    schemeGrid.className = "fdtb-native-color-scheme-grid";
    for (const scheme of ONENOTE_NATIVE_TABLE_SCHEMES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-native-color-scheme";
      button.append(this.createPalettePreview(scheme.palette), this.createTextSpan("fdtb-native-color-preset-label", scheme.label));
      button.addEventListener("click", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({
          defaultPresetId: "custom",
          customPalette: scheme.palette,
        });
        this.display();
      });
      schemeGrid.appendChild(button);
    }
    schemeWrap.appendChild(schemeGrid);
    card.appendChild(schemeWrap);

    const editor = document.createElement("div");
    editor.className = "fdtb-native-color-editor";
    editor.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "高级微调"));
    for (const field of NATIVE_COLOR_FIELD_LABELS) {
      const row = document.createElement("label");
      row.className = "fdtb-native-color-row";
      const label = this.createTextSpan("fdtb-native-color-row-label", field.label);
      const input = document.createElement("input");
      input.type = "color";
      input.value = previewPalette[field.key];
      input.addEventListener("change", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({
          defaultPresetId: "custom",
          customPalette: {
            ...previewPalette,
            [field.key]: input.value,
          },
        });
        this.display();
      });
      row.append(label, input);
      editor.appendChild(row);
    }
    card.appendChild(editor);

    const swatchPanel = document.createElement("div");
    swatchPanel.className = "fdtb-onenote-color-panel";
    swatchPanel.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "OneNote 常用色块"));
    const targetList = document.createElement("div");
    targetList.className = "fdtb-native-color-targets";
    for (const field of NATIVE_COLOR_FIELD_LABELS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-native-color-target";
      if (this.activeNativeColorField === field.key) button.classList.add("is-active");
      button.textContent = field.label;
      button.addEventListener("click", () => {
        this.activeNativeColorField = field.key;
        this.display();
      });
      targetList.appendChild(button);
    }
    swatchPanel.appendChild(targetList);

    const swatches = document.createElement("div");
    swatches.className = "fdtb-onenote-color-swatches";
    for (const color of ONENOTE_COLOR_SWATCHES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-onenote-color-swatch";
      button.style.setProperty("--fdtb-swatch-color", color);
      button.title = color;
      button.addEventListener("click", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({
          defaultPresetId: "custom",
          customPalette: {
            ...previewPalette,
            [this.activeNativeColorField]: color,
          },
        });
        this.display();
      });
      swatches.appendChild(button);
    }
    swatchPanel.appendChild(swatches);
    card.appendChild(swatchPanel);

    const actions = document.createElement("div");
    actions.className = "fdtb-native-color-actions";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "fdtb-native-color-action";
    saveButton.textContent = "保存为固定方案";
    saveButton.addEventListener("click", async () => {
      const fallback = `配色方案 ${(settings.savedPalettes?.length ?? 0) + 1}`;
      const label = window.prompt?.("给这个颜色方案起个名字", fallback) ?? fallback;
      if (!label || !label.trim()) return;
      await this.plugin.saveCurrentNativeColorPaletteAsManager(label);
      this.display();
    });
    actions.appendChild(saveButton);
    card.appendChild(actions);

    const savedPalettes = settings.savedPalettes ?? settings.presets.filter((preset) => preset.saved);
    if (savedPalettes.length > 0) {
      const savedWrap = document.createElement("div");
      savedWrap.className = "fdtb-native-color-saved";
      savedWrap.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "固定颜色方案"));
      for (const preset of savedPalettes) {
        const row = document.createElement("div");
        row.className = "fdtb-native-color-saved-row";
        const apply = document.createElement("button");
        apply.type = "button";
        apply.className = "fdtb-native-color-saved-apply";
        if (settings.defaultPresetId === preset.id) apply.classList.add("is-active");
        apply.append(this.createPalettePreview(preset.palette), this.createTextSpan("fdtb-native-color-preset-label", preset.label));
        apply.addEventListener("click", async () => {
          await this.plugin.updateNativeColorSettingsFromManager({ defaultPresetId: preset.id });
          this.display();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "fdtb-native-color-saved-delete";
        remove.textContent = "删除";
        remove.addEventListener("click", async () => {
          await this.plugin.deleteNativeColorPaletteFromManager(preset.id);
          this.display();
        });
        row.append(apply, remove);
        savedWrap.appendChild(row);
      }
      card.appendChild(savedWrap);
    }

    containerEl.appendChild(card);
  }

  private createNativeTableDefaultControls(settings: NativeColorSettings) {
    const wrap = document.createElement("div");
    wrap.className = "fdtb-native-table-defaults";
    wrap.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "文字默认色"));

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = String(settings.defaultTextColor ?? "#ED7D31");
    colorInput.addEventListener("change", async () => {
      await this.plugin.updateNativeTableDefaultsFromManager({ defaultTextColor: colorInput.value });
      this.display();
    });
    wrap.appendChild(
      this.createNativeTableSettingRow({
        label: "默认文字色",
        valueText: String(settings.defaultTextColor ?? "#ED7D31").toUpperCase(),
        input: colorInput,
      })
    );

    const zebraInput = document.createElement("input");
    zebraInput.type = "checkbox";
    zebraInput.checked = settings.defaultZebraEnabled !== false;
    zebraInput.addEventListener("change", async () => {
      await this.plugin.updateNativeTableDefaultsFromManager({ defaultZebraEnabled: zebraInput.checked });
      this.display();
    });
    wrap.appendChild(
      this.createNativeTableSettingRow({
        label: "默认斑马纹",
        valueText: zebraInput.checked ? "已开启" : "已关闭",
        hint: "只影响之后新建或新美化的表格；当前默认保持开启。",
        input: zebraInput,
      })
    );

    const borderInput = document.createElement("input");
    borderInput.type = "checkbox";
    borderInput.checked = settings.defaultBorderEnabled === true;
    borderInput.addEventListener("change", async () => {
      await this.plugin.updateNativeTableDefaultsFromManager({ defaultBorderEnabled: borderInput.checked });
      this.display();
    });
    wrap.appendChild(
      this.createNativeTableSettingRow({
        label: "默认边框样式",
        valueText: borderInput.checked ? "已开启" : "已关闭",
        hint: "默认关闭；需要时可在单张表格的「表」面板或右键菜单手动开启。",
        input: borderInput,
      })
    );

    const headerAlignment = this.createNativeTableAlignmentSelect(settings.defaultHeaderAlignment ?? "center", async (value) => {
      await this.plugin.updateNativeTableDefaultsFromManager({ defaultHeaderAlignment: value });
      this.display();
    });
    wrap.appendChild(
      this.createNativeTableSettingRow({
        label: "首行自动对齐",
        valueText: this.getNativeTableAlignmentLabel(settings.defaultHeaderAlignment ?? "center"),
        input: headerAlignment,
      })
    );

    const firstColumnAlignment = this.createNativeTableAlignmentSelect(settings.defaultFirstColumnAlignment ?? "left", async (value) => {
      await this.plugin.updateNativeTableDefaultsFromManager({ defaultFirstColumnAlignment: value });
      this.display();
    });
    wrap.appendChild(
      this.createNativeTableSettingRow({
        label: "首列自动对齐",
        valueText: this.getNativeTableAlignmentLabel(settings.defaultFirstColumnAlignment ?? "left"),
        input: firstColumnAlignment,
      })
    );

    return wrap;
  }

  private createNativeTableAlignmentSelect(
    value: NativeTableAutoAlignment,
    onChange: (value: NativeTableAutoAlignment) => Promise<void>
  ) {
    const input = document.createElement("select");
    const options: Array<{ value: NativeTableAutoAlignment; label: string }> = [
      { value: "off", label: "关闭" },
      { value: "left", label: "居左" },
      { value: "center", label: "居中" },
      { value: "right", label: "居右" },
    ];
    input.value = value;
    for (const option of options) {
      const item = document.createElement("option");
      item.value = option.value;
      item.textContent = option.label;
      input.appendChild(item);
    }
    input.addEventListener("change", () => {
      const next = input.value === "left" || input.value === "center" || input.value === "right" ? input.value : "off";
      void onChange(next);
    });
    return input;
  }

  private getNativeTableAlignmentLabel(value: NativeTableAutoAlignment) {
    if (value === "left") return "居左";
    if (value === "center") return "居中";
    if (value === "right") return "居右";
    return "关闭";
  }

  private createNativeTableSettingRow(options: { label: string; valueText: string; input: HTMLElement; hint?: string }) {
    const row = document.createElement("label");
    row.className = "fdtb-native-table-default-row";
    row.append(
      this.createTextSpan("fdtb-native-table-default-label", options.label),
      this.createTextSpan("fdtb-native-table-default-value", options.valueText),
      options.input
    );
    if (options.hint) {
      const hint = this.createTextSpan("fdtb-native-table-default-hint", options.hint);
      row.appendChild(hint);
    }
    return row;
  }

  private createNativeTableRangeInput(options: {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => Promise<void>;
  }) {
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(options.min);
    input.max = String(options.max);
    input.step = String(options.step);
    input.value = String(options.value);
    input.addEventListener("change", () => void options.onChange(Number(input.value)));
    return input;
  }

  private createNativeTableNumberInput(options: {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => Promise<void>;
  }) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = String(options.min);
    input.max = String(options.max);
    input.step = String(options.step);
    input.value = String(options.value);
    input.addEventListener("change", () => void options.onChange(Number(input.value)));
    return input;
  }

  private createPalettePreview(palette: NativeColorPalette) {
    const preview = document.createElement("span");
    preview.className = "fdtb-native-color-preview";
    preview.style.setProperty("--fdtb-preview-header", palette.header);
    preview.style.setProperty("--fdtb-preview-header-text", palette.headerText);
    preview.style.setProperty("--fdtb-preview-base", palette.baseRow);
    preview.style.setProperty("--fdtb-preview-alt", palette.altRow);
    preview.style.setProperty("--fdtb-preview-border", palette.border);
    for (let index = 0; index < 6; index += 1) {
      const cell = document.createElement("span");
      cell.className = index < 3 ? "is-header" : index === 4 ? "is-alt" : "is-base";
      preview.appendChild(cell);
    }
    return preview;
  }

  private createNativeColorLivePreview(palette: NativeColorPalette) {
    const wrap = document.createElement("div");
    wrap.className = "fdtb-native-color-live";
    wrap.style.setProperty("--fdtb-live-header", palette.header);
    wrap.style.setProperty("--fdtb-live-header-text", palette.headerText);
    wrap.style.setProperty("--fdtb-live-base", palette.baseRow);
    wrap.style.setProperty("--fdtb-live-alt", palette.altRow);
    wrap.style.setProperty("--fdtb-live-border", palette.border);
    wrap.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "实时预览"));

    const table = document.createElement("table");
    table.className = "fdtb-native-color-live-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const label of ["步骤", "自检", "内容"]) {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const rows = [
      ["1", "目标清楚", "先确认目的和最终成果"],
      ["2", "路径可行", "把关键动作拆成可执行步骤"],
      ["3", "复盘沉淀", "把稳定做法保存为模板"],
    ];
    for (const rowData of rows) {
      const tr = document.createElement("tr");
      for (const text of rowData) {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  private renderPluginHostSection(containerEl: HTMLElement) {
    this.appendSectionTitle(containerEl, "第三方插件管理");
    void this.plugin.refreshManagedPluginStatus({ silent: true });

    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent =
      "插件按分类分组展示，可折叠、改名、删除分类；每条插件右侧用小号「移到」切换分类。分类删除后，组内插件会移至「其他插件」。";
    containerEl.appendChild(intro);

    this.renderPluginAutoUpdateSection(containerEl);

    new Setting(containerEl)
      .setName("自动监测插件启用状态")
      .setDesc(this.plugin.getPluginStatusMonitorDescription());
    this.appendStatusRow(containerEl, "合并方式", "安全托管", "统一入口、状态和显示名；开关调用 Obsidian 自带插件启停能力");

    this.appendInlineForm(containerEl, {
      label: "新建分类",
      desc: "创建空分类后，可用每条插件旁的「移到」归入",
      placeholder: "分类名称",
      buttonText: "创建",
      onSubmit: async (name) => {
        const ok = await this.plugin.createManagedPluginCategory(name);
        if (ok) this.display();
      },
    });

    const list = document.createElement("div");
    list.className = "fdtb-plugin-category-tree";
    const categoryOptions = this.plugin.getManagedPluginCategoryMoveOptions();
    for (const section of this.plugin.getHostedPluginCategorySections()) {
      this.appendPluginCategorySection(list, section.category, section.items, categoryOptions);
    }
    containerEl.appendChild(list);
  }

  private renderPluginAutoUpdateSection(containerEl: HTMLElement) {
    this.appendCollapsibleSection(
      containerEl,
      "插件自动更新",
      (bodyEl) => {
        const intro = document.createElement("p");
        intro.className = "fdtb-settings-page-desc";
        intro.textContent =
          "仅对白名单内的第三方社区插件（当前默认 YOLO、Claudian）执行自动更新。自研插件（ZengQiang Enhanced、原生表格增强等）永不自动更新，本地源码才是真相源。";
        bodyEl.appendChild(intro);

        new Setting(bodyEl)
          .setName("启动时自动更新白名单插件")
          .setDesc(this.plugin.getAutoUpdatePluginsDescription())
          .addToggle((toggle) =>
            toggle.setValue(this.plugin.dataStore.autoUpdatePluginsEnabled).onChange(async (value) => {
              await this.plugin.setAutoUpdatePluginsEnabled(value);
              this.display();
            })
          );

        new Setting(bodyEl)
          .setName("立即检查并更新")
          .setDesc("手动触发一次白名单插件更新检查")
          .addButton((button) =>
            button.setButtonText("检查更新").onClick(async () => {
              button.setDisabled(true);
              button.setButtonText("检查中…");
              try {
                await this.plugin.runAutoUpdateManagedPlugins({ manual: true });
                this.display();
              } finally {
                button.setDisabled(false);
                button.setButtonText("检查更新");
              }
            })
          );

        const list = document.createElement("div");
        list.className = "fdtb-auto-update-plugin-list";
        for (const pluginId of this.plugin.dataStore.autoUpdatePluginIds) {
          const row = document.createElement("div");
          row.className = "fdtb-auto-update-plugin-row";
          const label = document.createElement("span");
          label.className = "fdtb-auto-update-plugin-label";
          label.textContent = `${AUTO_UPDATE_PLUGIN_LABELS[pluginId] ?? pluginId} · ${pluginId}`;
          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "fdtb-template-folder-delete-btn";
          removeBtn.textContent = "移除";
          removeBtn.addEventListener("click", async () => {
            await this.plugin.removeAutoUpdatePluginId(pluginId);
            this.display();
          });
          row.append(label, removeBtn);
          list.appendChild(row);
        }
        bodyEl.appendChild(list);

        this.appendInlineForm(bodyEl, {
          label: "添加自动更新插件",
          desc: "填写社区插件 id，例如 yolo、realclaudian（Claudian）",
          placeholder: "插件 id",
          buttonText: "添加",
          onSubmit: async (value) => {
            const ok = await this.plugin.addAutoUpdatePluginId(value);
            if (ok) this.display();
          },
        });

        const lastResults = this.plugin.getAutoUpdateLastResultLines();
        if (lastResults.length > 0) {
          const resultWrap = document.createElement("div");
          resultWrap.className = "fdtb-auto-update-result-list";
          for (const line of lastResults) {
            const item = document.createElement("div");
            item.className = "fdtb-settings-status-desc";
            item.textContent = line;
            resultWrap.appendChild(item);
          }
          bodyEl.appendChild(resultWrap);
        }
      },
      { defaultOpen: true }
    );
  }

  private appendPluginCategorySection(
    containerEl: HTMLElement,
    category: ManagedPluginCategory,
    items: HostedPluginItem[],
    categoryOptions: Array<{ value: string; label: string }>
  ) {
    const group = document.createElement("details");
    group.className = "fdtb-plugin-category-folder";
    group.open = true;
    group.dataset.categoryId = category.id;

    const summary = document.createElement("summary");
    summary.className = "fdtb-plugin-category-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "fdtb-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "fdtb-template-folder-title-text";
    titleText.textContent = category.name;
    titleWrap.appendChild(titleText);

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "fdtb-template-folder-rename-btn";
    renameBtn.textContent = "改名";
    renameBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.beginInlineRename(titleText, {
        initial: category.name,
        onCommit: async (value) => {
          const ok = await this.plugin.renameManagedPluginCategory(category.id, value);
          if (ok) this.display();
        },
      });
    });
    titleWrap.append(renameBtn);

    if (category.id !== MANAGED_PLUGIN_FALLBACK_CATEGORY_ID) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "fdtb-template-folder-delete-btn";
      deleteBtn.textContent = "删除";
      deleteBtn.title = "删除分类；组内插件将移至「其他插件」";
      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.plugin.deleteManagedPluginCategory(category.id).then((ok) => {
          if (ok) this.display();
        });
      });
      titleWrap.append(deleteBtn);
    }

    const count = document.createElement("span");
    count.className = "fdtb-plugin-category-count";
    count.textContent = `${items.length} 个插件`;
    summary.append(titleWrap, count);
    group.appendChild(summary);

    const body = document.createElement("div");
    body.className = "fdtb-plugin-category-folder-body";
    if (items.length === 0) {
      body.createEl("p", {
        cls: "setting-item-description",
        text: "分类已创建，暂无插件。可用下方每条插件的「移到」把插件归入本分类。",
      });
    } else {
      for (const item of items) {
        this.appendPluginManagerRow(body, item, categoryOptions, category.id);
      }
    }
    group.appendChild(body);
    containerEl.appendChild(group);
  }

  private appendPluginManagerRow(
    containerEl: HTMLElement,
    item: HostedPluginItem,
    categoryOptions: Array<{ value: string; label: string }>,
    currentCategoryId: string
  ) {
    const row = document.createElement("div");
    row.className = "fdtb-plugin-manager-row";
    row.dataset.pluginId = item.id;
    const main = document.createElement("div");
    main.className = "fdtb-plugin-manager-main";
    const title = document.createElement("div");
    title.className = "fdtb-plugin-manager-title";
    title.textContent = item.name;
    const meta = document.createElement("div");
    meta.className = "fdtb-plugin-manager-meta";
    meta.textContent = `${item.originalName}${item.version ? ` · ${item.version}` : ""} · ${item.id}`;
    const desc = document.createElement("div");
    desc.className = "fdtb-plugin-manager-desc";
    desc.textContent = item.description;
    main.append(title, meta, desc);

    const controls = document.createElement("div");
    controls.className = "fdtb-plugin-manager-controls";

    const moveWrap = document.createElement("label");
    moveWrap.className = "fdtb-template-move-wrap";
    moveWrap.title = "移到其他分类";
    const moveLabel = document.createElement("span");
    moveLabel.className = "fdtb-template-move-label";
    moveLabel.textContent = "移到";
    const moveSelect = document.createElement("select");
    moveSelect.className = "fdtb-template-move-select";
    const assignedCategory = this.plugin.dataStore.managedPluginCategories[item.id] ?? currentCategoryId;
    for (const option of categoryOptions) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      opt.selected = option.value === assignedCategory;
      moveSelect.appendChild(opt);
    }
    moveSelect.addEventListener("change", async () => {
      const target = moveSelect.value;
      if (target === assignedCategory) return;
      moveSelect.disabled = true;
      await this.plugin.moveManagedPluginToCategory(item.id, target);
      this.display();
    });
    moveWrap.append(moveLabel, moveSelect);

    const aliasInput = document.createElement("input");
    aliasInput.type = "text";
    aliasInput.className = "fdtb-plugin-manager-input";
    aliasInput.placeholder = "显示名称";
    aliasInput.value = item.alias;
    aliasInput.addEventListener("change", async () => {
      await this.plugin.updateManagedPluginAlias(item.id, aliasInput.value);
      this.display();
    });

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "fdtb-plugin-manager-toggle";
    toggleLabel.setAttribute("aria-label", `${item.name} ${item.enabled ? "已启用" : "未启用"}`);
    toggleLabel.title = item.toggleable ? "启用或关闭插件" : "总入口不能在自身设置页关闭";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = item.enabled;
    toggleInput.disabled = !item.toggleable;
    const toggleTrack = document.createElement("span");
    toggleTrack.className = "fdtb-plugin-manager-toggle-track";
    toggleLabel.append(toggleInput, toggleTrack);
    toggleInput.addEventListener("change", async () => {
      const nextEnabled = toggleInput.checked;
      toggleInput.disabled = true;
      try {
        const changed = await this.plugin.setManagedPluginEnabled(item.id, nextEnabled);
        if (!changed) toggleInput.checked = item.enabled;
        this.display();
      } catch (error) {
        toggleInput.checked = item.enabled;
        toggleInput.disabled = !item.toggleable;
        new Notice(`插件开关失败：${error instanceof Error ? error.message : String(error)}`);
      }
    });
    controls.append(moveWrap, aliasInput, toggleLabel);
    row.append(main, controls);
    containerEl.appendChild(row);
  }

  private renderDraggerSection(containerEl: HTMLElement) {
    this.appendSectionTitle(containerEl, "块拖动 / Dragger");
    new Setting(containerEl)
      .setName("显示 Dragger 融合状态")
      .setDesc("只展示状态，不自动启停 Dragger")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.dataStore.showDraggerIntegrationStatus).onChange(async (value) => {
          await this.plugin.updateManagementSetting("showDraggerIntegrationStatus", value);
          this.display();
        })
      );
    if (!this.plugin.dataStore.showDraggerIntegrationStatus) return;
    const draggerStatus = this.plugin.getManagedPluginStatus("dragger");
    this.appendStatusRow(containerEl, "Dragger 插件", draggerStatus.enabled ? "已启用" : draggerStatus.installed ? "已安装未启用" : "未安装", "T 手柄和表格手柄会优先避让/融合 Dragger 手柄");
    this.appendStatusRow(containerEl, "手柄融合", "已接入", "当前通过 Dragger 手柄定位，减少 T/表手柄遮挡正文");
  }

  private appendSectionTitle(containerEl: HTMLElement, titleText: string) {
    const title = document.createElement("h3");
    title.className = "fdtb-settings-section-title";
    title.textContent = titleText;
    containerEl.appendChild(title);
  }

  private appendCollapsibleSection(
    containerEl: HTMLElement,
    titleText: string,
    renderBody: (bodyEl: HTMLElement) => void,
    options?: { defaultOpen?: boolean }
  ) {
    const section = document.createElement("details");
    section.className = "fdtb-settings-collapsible-section";
    if (options?.defaultOpen) section.open = true;

    const summary = document.createElement("summary");
    summary.className = "fdtb-settings-collapsible-summary";
    summary.textContent = titleText;
    section.appendChild(summary);

    const body = document.createElement("div");
    body.className = "fdtb-settings-collapsible-body";
    renderBody(body);
    section.appendChild(body);

    containerEl.appendChild(section);
  }

  private appendStatusRow(containerEl: HTMLElement, name: string, status: string, description: string) {
    const row = document.createElement("div");
    row.className = "fdtb-settings-status-row";
    const main = document.createElement("div");
    main.className = "fdtb-settings-status-main";
    const label = document.createElement("div");
    label.className = "fdtb-settings-status-label";
    label.textContent = name;
    const desc = document.createElement("div");
    desc.className = "fdtb-settings-status-desc";
    desc.textContent = description;
    main.append(label, desc);
    const badge = document.createElement("span");
    badge.className = "fdtb-settings-status-badge";
    badge.textContent = status;
    row.append(main, badge);
    containerEl.appendChild(row);
  }

  private appendCommandRow(containerEl: HTMLElement, name: string, description: string, commandId: string) {
    new Setting(containerEl)
      .setName(name)
      .setDesc(description)
      .addButton((button) =>
        button.setButtonText("执行").onClick(async () => {
          await this.plugin.runManagedCommand(commandId);
        })
      );
  }

  private createTextSpan(className: string, text: string) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }
}

export default class FeishuDocToolbarPlugin extends Plugin {
  private handleEl: HTMLButtonElement | null = null;
  private popoverEl: HTMLDivElement | null = null;
  private submenuEl: HTMLDivElement | null = null;
  private imagePreviewEl: HTMLDivElement | null = null;
  private activeContext: BlockContext | null = null;
  private hideTimer: number | null = null;
  private rafHandle: number | null = null;
  private styleRefreshTimer: number | null = null;
  dataStore: FeishuDocToolbarData = { ...DEFAULT_DATA };
  private slashTrigger: SlashTriggerState | null = null;
  private readonly embeddedHosts: Map<string, SubPluginHost> = new Map();
  private embeddedNativeTableEnhancer: EmbeddedNativeTableEnhancerPlugin | null = null;
  claudianArchiveRunner: ClaudianChatArchiveRunner | null = null;
  private autoUpdateInFlight: Promise<void> | null = null;

  async onload() {
    ensureObsidianRequireBinding();
    this.dataStore = this.normalizeData(await this.loadData());
    this.dataStore.showTableEnhancerEntrances = false;
    this.ensureHandle();
    this.registerCommands();
    this.addSettingTab(new FeishuDocExperienceSettingTab(this.app, this));
    await this.startEmbeddedNativeTableEnhancer();
    await this.startEnabledEmbeddedModules();
    await this.syncExperimentalFeatureGateToTableEnhancer(this.isEnhancedTableFeatureEnabled());
    this.registerInterval(window.setInterval(() => this.applyManagedPluginAliasesToSettingsSidebar(), 1800));

    this.registerDomEvent(document, "pointermove", (event) => this.schedulePointerUpdate(event as PointerEvent), true);
    this.registerDomEvent(document, "pointerdown", (event) => this.handlePointerDown(event as PointerEvent), true);
    this.registerDomEvent(document, "click", (event) => this.handleEditorClick(event as MouseEvent), true);
    this.registerDomEvent(document, "keydown", (event) => this.handleDocumentKeydown(event as KeyboardEvent), true);
    this.registerDomEvent(document, "dblclick", (event) => this.handleDocumentDoubleClick(event as MouseEvent), true);
    this.registerDomEvent(document, "scroll", () => this.hideToolbar(), true);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.hideToolbar();
        this.scheduleStyleRefresh();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.hideToolbar();
        this.scheduleStyleRefresh();
      })
    );
    this.registerEvent(this.app.workspace.on("file-open", () => this.scheduleStyleRefresh()));
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          this.scheduleStyleRefresh();
        }
      })
    );

    const workspaceAny = this.app.workspace as any;
    if (typeof workspaceAny.on === "function") {
      this.registerEvent(
        workspaceAny.on("editor-change", (editor: any, info: unknown) => {
          this.scheduleStyleRefresh();
          this.handleSlashTrigger(editor, info);
        })
      );
      this.registerEvent(
        workspaceAny.on("editor-menu", (menu: Menu, editor: any, view: MarkdownView) => {
          this.extendEditorMenu(menu, editor, view);
        })
      );
    }

    this.scheduleStyleRefresh();
    window.setTimeout(() => this.applyManagedPluginAliasesToSettingsSidebar(), 500);
    this.scheduleStartupManagedPluginAutoUpdate();
  }

  onunload() {
    if (this.rafHandle !== null) {
      window.cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    if (this.styleRefreshTimer !== null) {
      window.clearTimeout(this.styleRefreshTimer);
      this.styleRefreshTimer = null;
    }
    this.clearHideTimer();
    this.closeNativeTableImagePreview();
    this.clearAllStyledArtifacts();
    this.hideToolbar(true);
    this.stopEmbeddedNativeTableEnhancer();
    this.stopAllEmbeddedModules();
  }

  private getExternalTableEnhancerPlugin() {
    const plugins = (this.app as any).plugins;
    return plugins?.plugins?.[MARKDOWN_TABLE_PLUGIN_ID] ?? plugins?.getPlugin?.(MARKDOWN_TABLE_PLUGIN_ID) ?? null;
  }

  private bindEmbeddedNativeTableStorage(plugin: EmbeddedNativeTableEnhancerPlugin) {
    const pluginApi = plugin as any;
    pluginApi.loadData = async () => {
      const embeddedData = this.normalizeEmbeddedNativeTableData(this.dataStore.embeddedNativeTableEnhancer);
      if (embeddedData) return embeddedData;

      const legacyData = await this.loadLegacyExternalNativeTableData();
      if (legacyData) {
        this.dataStore.embeddedNativeTableEnhancer = legacyData;
        await this.saveData(this.dataStore);
        return legacyData;
      }

      return null;
    };
    pluginApi.saveData = async (data: unknown) => {
      this.dataStore.embeddedNativeTableEnhancer = this.normalizeEmbeddedNativeTableData(data);
      await this.saveData(this.dataStore);
    };
  }

  private async loadLegacyExternalNativeTableData() {
    const configDir = String((this.app.vault as any).configDir ?? ".obsidian");
    const dataPath = normalizePath(`${configDir}/plugins/${MARKDOWN_TABLE_PLUGIN_ID}/data.json`);
    try {
      if (!(await this.app.vault.adapter.exists(dataPath))) return null;
      const raw = await this.app.vault.adapter.read(dataPath);
      const parsed = JSON.parse(raw);
      return this.normalizeEmbeddedNativeTableData(parsed) ?? null;
    } catch (error) {
      console.warn("[feishu-doc-toolbar] 读取旧原生表格增强数据失败", error);
      return null;
    }
  }

  private async startEmbeddedNativeTableEnhancer() {
    if (this.getExternalTableEnhancerPlugin()) return;
    if (this.embeddedNativeTableEnhancer) return;
    if (!this.canStartEmbeddedNativeTableEnhancer()) return;

    const manifest = {
      id: MARKDOWN_TABLE_PLUGIN_ID,
      name: "原生表格增强",
      version: this.manifest?.version ?? "1.0.0",
      minAppVersion: this.manifest?.minAppVersion ?? "1.5.0",
      description: "内置于 Obsidian增强体验的原生表格颜色、长宽高、对齐、公式、自动填充、模板库与 OneNote 粘贴能力",
      author: this.manifest?.author ?? "lishu",
      isDesktopOnly: false,
    };
    const plugin = new EmbeddedNativeTableEnhancerPlugin(this.app, manifest as any);
    if (!this.canUseEmbeddedNativeTablePlugin(plugin)) return;
    this.bindEmbeddedNativeTableStorage(plugin);
    this.embeddedNativeTableEnhancer = plugin;
    try {
      const maybePromise = (plugin as any).load?.() ?? plugin.onload();
      await maybePromise;
      console.info("[feishu-doc-toolbar] 已内置启动原生表格增强");
    } catch (error) {
      this.embeddedNativeTableEnhancer = null;
      try {
        (plugin as any).unload?.();
      } catch {
        // ignore
      }
      const detail = error instanceof Error ? error.message : String(error);
      console.error("[feishu-doc-toolbar] 内置原生表格增强启动失败", error);
      new Notice(`原生表格增强启动失败：${detail}`, 10000);
    }
  }

  private canStartEmbeddedNativeTableEnhancer() {
    const pluginApi = this as any;
    return [
      "addCommand",
      "addRibbonIcon",
      "addStatusBarItem",
      "registerDomEvent",
      "registerEditorExtension",
      "registerEvent",
      "registerMarkdownPostProcessor",
    ].every((name) => typeof pluginApi[name] === "function");
  }

  private canUseEmbeddedNativeTablePlugin(plugin: EmbeddedNativeTableEnhancerPlugin) {
    const pluginApi = plugin as any;
    return [
      "addCommand",
      "addRibbonIcon",
      "addStatusBarItem",
      "registerDomEvent",
      "registerEditorExtension",
      "registerEvent",
      "registerMarkdownPostProcessor",
    ].every((name) => typeof pluginApi[name] === "function");
  }

  private stopEmbeddedNativeTableEnhancer() {
    const plugin = this.embeddedNativeTableEnhancer;
    this.embeddedNativeTableEnhancer = null;
    if (!plugin) return;
    try {
      (plugin as any).unload?.();
    } catch (error) {
      console.error("[feishu-doc-toolbar] 卸载内置原生表格增强失败", error);
    }
  }

  // --- 内嵌子模块管理 ---

  private getModuleBackend(): ModuleHostBackend {
    return {
      app: this.app,
      plugin: this,
      loadModuleData: (moduleId) => this.dataStore.embeddedModules[moduleId]?.data ?? null,
      saveModuleData: async (moduleId, data) => {
        const current = this.dataStore.embeddedModules[moduleId] ?? { enabled: true };
        this.dataStore.embeddedModules[moduleId] = { ...current, data };
        await this.saveData(this.dataStore);
      },
    };
  }

  isEmbeddedModuleEnabled(moduleId: string): boolean {
    const descriptor = EMBEDDED_MODULES.find((m) => m.id === moduleId);
    if (!descriptor) return false;
    const saved = this.dataStore.embeddedModules[moduleId];
    if (!saved) return descriptor.defaultEnabled;
    return saved.enabled !== false;
  }

  getBlockLinkPlusInstance() {
    if (!this.isEmbeddedModuleEnabled("block-link-plus")) return null;
    return getEmbeddedBlockLinkPlusInstance();
  }

  isBlockLinkPlusActive(): boolean {
    return !!this.getBlockLinkPlusInstance();
  }

  private async startEnabledEmbeddedModules() {
    const backend = this.getModuleBackend();
    const conflictWarnings: string[] = [];
    for (const moduleDef of EMBEDDED_MODULES) {
      if (!this.isEmbeddedModuleEnabled(moduleDef.id)) continue;

      if (moduleDef.replacesExternalPluginId) {
        const externalStatus = this.getManagedPluginStatus(moduleDef.replacesExternalPluginId);
        if (externalStatus.installed && externalStatus.enabled) {
          const disabled = await this.setManagedPluginEnabled(moduleDef.replacesExternalPluginId, false);
          if (!disabled) {
            conflictWarnings.push(`${moduleDef.displayName}（未能自动关闭外部 ${moduleDef.replacesExternalPluginId}）`);
            continue;
          }
          console.info(
            `[feishu-doc-toolbar] 已自动关闭外部插件 ${moduleDef.replacesExternalPluginId}，改用内嵌「${moduleDef.displayName}」`
          );
        }
      }

      const host = new SubPluginHost(backend, moduleDef.id);
      this.embeddedHosts.set(moduleDef.id, host);
      try {
        await moduleDef.load(host);
      } catch (error) {
        // 红线 23：启动失败必须完全回滚副作用（destroy host + 撤销已挂的编辑器扩展 / DOM 监听），
        // 绝不能「弹个失败 Notice 就走」，残留会污染全局、连带历史文件打不开。
        try {
          host.destroy();
        } catch (destroyError) {
          console.error(`[feishu-doc-toolbar] 回滚内嵌模块 ${moduleDef.id} 失败`, destroyError);
        }
        this.embeddedHosts.delete(moduleDef.id);
        const detail = formatEmbeddedModuleError(error);
        console.error(`[feishu-doc-toolbar] 启动内嵌模块 ${moduleDef.id} 失败`, error);
        new Notice(`内嵌功能「${moduleDef.displayName}」启动失败：${detail}`, 10000);
      }
    }

    if (conflictWarnings.length > 0) {
      new Notice(
        `Obsidian增强体验：以下内嵌功能未能启动：\n${conflictWarnings.join("\n")}\n请查看控制台或联系维护。`,
        12000
      );
    }
  }

  private stopAllEmbeddedModules() {
    for (const [moduleId, host] of this.embeddedHosts.entries()) {
      try {
        host.destroy();
      } catch (error) {
        console.error(`[feishu-doc-toolbar] 卸载内嵌模块 ${moduleId} 失败`, error);
      }
    }
    this.embeddedHosts.clear();
  }

  async setEmbeddedModuleEnabled(moduleId: string, enabled: boolean) {
    const moduleDef = EMBEDDED_MODULES.find((m) => m.id === moduleId);
    if (!moduleDef) return;

    const current = this.dataStore.embeddedModules[moduleId] ?? { enabled: moduleDef.defaultEnabled };
    if (current.enabled === enabled) return;

    this.dataStore.embeddedModules[moduleId] = { ...current, enabled };
    await this.saveData(this.dataStore);

    if (enabled) {
      if (!this.embeddedHosts.has(moduleId)) {
        const host = new SubPluginHost(this.getModuleBackend(), moduleId);
        this.embeddedHosts.set(moduleId, host);
        try {
          await moduleDef.load(host);
        } catch (error) {
          this.embeddedHosts.delete(moduleId);
          host.destroy();
          const detail = formatEmbeddedModuleError(error);
          console.error(`[feishu-doc-toolbar] 启动内嵌模块 ${moduleId} 失败`, error);
          new Notice(`内嵌功能「${moduleDef.displayName}」启动失败：${detail}`, 10000);
        }
      }
    } else {
      const host = this.embeddedHosts.get(moduleId);
      if (host) {
        try {
          host.destroy();
        } catch (error) {
          console.error(`[feishu-doc-toolbar] 卸载内嵌模块 ${moduleId} 失败`, error);
        }
        this.embeddedHosts.delete(moduleId);
      }
    }
  }


  private registerCommands() {
    this.addCommand({
      id: 'open-insert-panel',
      name: '打开飞书插入面板',
      callback: () => {
        void this.openInsertPanelFromActiveEditor();
      },
    });

    this.addCommand({
      id: 'open-template-panel',
      name: '打开模板库面板',
      callback: () => {
        void this.openTemplatePanelFromActiveEditor();
      },
    });

    this.addCommand({
      id: 'open-table-panel',
      name: '打开表格操作面板',
      callback: () => {
        void this.openTablePanelFromActiveEditor();
      },
    });

    this.addCommand({
      id: "auto-update-managed-plugins",
      name: "检查并更新白名单插件",
      callback: () => {
        void this.runAutoUpdateManagedPlugins({ manual: true });
      },
    });

    if (!__OSS_RELEASE__) {
      this.addCommand({
        id: "update-goal-progress-overview",
        name: "查漏补缺目标进展",
        callback: () => {
          void this.updateGoalProgressOverview();
        },
      });
    }
  }

  private async updateGoalProgressOverview() {
    try {
      const reviewFile = this.getMarkdownFileByPath(GOAL_PROGRESS_REVIEW_PATH, "周复盘源");
      const targetFile = this.getMarkdownFileByPath(GOAL_PROGRESS_TARGET_PATH, "目标进展页");
      if (!reviewFile || !targetFile) return;

      const reviewText = await this.app.vault.cachedRead(reviewFile);
      const targetText = await this.app.vault.cachedRead(targetFile);
      const planFiles = this.getGoalProgressPlanFiles();
      const result = buildGoalProgressSyncUpdate({
        reviewText,
        targetText,
        reviewPath: reviewFile.path,
        planFiles,
        generatedAt: this.formatGoalProgressSyncTime(new Date()),
      });

      if (!result.ok) {
        new Notice(`目标进展未更新：${result.reason ?? "未识别到可写入内容"}`, 8000);
        return;
      }

      if (!result.changed) {
        new Notice("目标进展没有发现缺漏", 5000);
        return;
      }

      await this.app.vault.modify(targetFile, result.targetText);
      const uniqueWarnings = Array.from(new Set(result.warnings)).slice(0, 2);
      const warningSuffix = uniqueWarnings.length > 0 ? `；${uniqueWarnings.join("；")}` : "";
      new Notice(`目标进展已查漏补缺：新增 ${result.appendedCount} 行${warningSuffix}`, 8000);
    } catch (error) {
      console.error("[feishu-doc-toolbar] 更新目标进展总览失败", error);
      new Notice(`目标进展更新失败：${this.formatError(error)}`, 8000);
    }
  }

  private getMarkdownFileByPath(filePath: string, label: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(normalizePath(filePath));
    if (file instanceof TFile && file.extension === "md") return file;
    new Notice(`${label}不存在：${filePath}`, 8000);
    return null;
  }

  private getGoalProgressPlanFiles(): GoalProgressPlanFile[] {
    const root = `${normalizePath(GOAL_PROGRESS_PLAN_ROOT_PATH)}/`;
    return this.app.vault
      .getMarkdownFiles()
      .filter((file) => normalizePath(file.path).startsWith(root))
      .map((file) => ({ path: file.path, basename: file.basename }));
  }

  private formatGoalProgressSyncTime(date: Date) {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  private async openInsertPanelFromActiveEditor() {
    const context = this.getActiveEditorBlockContext();
    if (!context) {
      new Notice('当前没有可用的编辑位置');
      return;
    }
    this.activeContext = context;
    this.renderHandle(context);
    this.showInsertPanel(context);
  }

  private async openTemplatePanelFromActiveEditor() {
    const context = this.getActiveEditorBlockContext();
    if (!context) {
      new Notice('当前没有可用的编辑位置');
      return;
    }
    this.activeContext = context;
    this.renderHandle(context);
    await this.showTemplateMenu(context);
  }

  private async openTablePanelFromActiveEditor() {
    const context = this.getActiveEditorBlockContext();
    if (!context) {
      new Notice("当前没有可用的编辑位置");
      return;
    }
    this.activeContext = context;
    this.renderHandle(context);
    await this.showTableMenu(context);
  }

  private getActiveEditorBlockContext(): BlockContext | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) return null;

    const editor = (view as any).editor;
    const cmView = editor?.cm;
    if (!editor || !cmView) return null;

    const cursor = typeof editor.getCursor === 'function' ? editor.getCursor() : null;
    const line = Math.max(0, cursor?.line ?? 0);
    const blockEl = this.findBlockElementForLine(view, cmView, line);
    if (!blockEl) return null;

    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) return enhancedTableContext;

    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line),
    };
  }

  private getEditorBlockContext(view: MarkdownView, editor: any): BlockContext | null {
    const cmView = editor?.cm;
    if (!view?.file || !editor || !cmView) return null;
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : null;
    const line = Math.max(0, cursor?.line ?? 0);
    const blockEl = this.findBlockElementForLine(view, cmView, line);
    if (!blockEl) return null;
    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) return enhancedTableContext;
    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line),
    };
  }

  private handleSlashTrigger(editor: any, info: unknown) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file || !editor?.cm || typeof editor.getCursor !== "function" || typeof editor.getLine !== "function") {
      return;
    }

    const cursor = editor.getCursor();
    const line = Math.max(0, cursor?.line ?? 0);
    const currentLine = String(editor.getLine(line) ?? "");
    const trimmed = currentLine.trim();
    const normalizedFilePath = view.file.path;

    if (trimmed === "/") {
      if (this.slashTrigger?.filePath === normalizedFilePath && this.slashTrigger?.line === line) {
        return;
      }
      const context = this.getEditorBlockContext(view, editor);
      if (!context || context.kind === "table") return;
      this.activeContext = context;
      this.renderHandle(context);
      this.slashTrigger = { filePath: normalizedFilePath, line };
      this.showInsertPanel(context);
      return;
    }

    if (
      this.slashTrigger &&
      this.slashTrigger.filePath === normalizedFilePath &&
      this.slashTrigger.line === line
    ) {
      this.slashTrigger = null;
    }

    void info;
  }

  private extendEditorMenu(menu: Menu, editor: any, view: MarkdownView) {
    const context = this.getEditorBlockContext(view, editor);
    if (!context) return;

    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle("打开飞书插入面板");
      item.onClick(() => {
        this.activeContext = context;
        this.renderHandle(context);
        this.showInsertPanel(context);
      });
    });

    menu.addItem((item) => {
      item.setTitle("打开模板库面板");
      item.onClick(() => {
        this.activeContext = context;
        this.renderHandle(context);
        void this.showTemplateMenu(context);
      });
    });

    if (context.kind === "table") {
      menu.addItem((item) => {
        item.setTitle("对当前表格美化");
        item.onClick(() => {
          void this.executeCommandById(ENHANCED_TABLE_COMMANDS.initializeNativeLayout);
        });
      });
      menu.addItem((item) => {
        item.setTitle("高亮");
        item.onClick(() => {
          this.toggleMarkdownHighlight(context);
        });
      });
      menu.addItem((item) => {
        item.setTitle("打开表格操作面板");
        item.onClick(() => {
          this.activeContext = context;
          this.renderHandle(context);
          void this.showTableMenu(context);
        });
      });
    }
  }

  private normalizeData(value: unknown): FeishuDocToolbarData {
    const saved = value && typeof value === "object" ? (value as Partial<FeishuDocToolbarData>) : {};
    const embeddedNativeTableEnhancer = this.normalizeEmbeddedNativeTableData(saved.embeddedNativeTableEnhancer);
    const data: FeishuDocToolbarData = {
      ...DEFAULT_DATA,
      templateFolderPath: normalizeTemplateFolderPath(saved.templateFolderPath),
      templateUngroupedLabel:
        typeof saved.templateUngroupedLabel === "string" && saved.templateUngroupedLabel.trim()
          ? saved.templateUngroupedLabel.trim().slice(0, 32)
          : DEFAULT_DATA.templateUngroupedLabel,
      recentTemplatePaths: Array.isArray(saved.recentTemplatePaths)
        ? saved.recentTemplatePaths
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => normalizeRecentTemplatePath(item))
        : [],
      toolbarActionOrder: this.normalizeToolbarActionOrder(saved.toolbarActionOrder),
      managedPluginAliases: this.normalizePluginTextMap(saved.managedPluginAliases),
      managedPluginNotes: this.normalizePluginTextMap(saved.managedPluginNotes),
      managedPluginCategories: this.normalizePluginTextMap(saved.managedPluginCategories),
      managedPluginCategoryNames: this.normalizePluginTextMap(saved.managedPluginCategoryNames),
      managedPluginCategoryOrder: this.normalizePluginCategoryOrder(
        saved.managedPluginCategoryOrder,
        saved.managedPluginCategoryNames,
        saved.managedPluginCategoryRemoved
      ),
      managedPluginStatusCheckedAt: Number.isFinite(saved.managedPluginStatusCheckedAt)
        ? Number(saved.managedPluginStatusCheckedAt)
        : 0,
      enableBetaFeatures:
        typeof saved.enableBetaFeatures === "boolean"
          ? saved.enableBetaFeatures
          : this.resolveEnableBetaFeatures(saved),
      showOneNoteImport: saved.showOneNoteImport === true,
      showTableEnhancerEntrances: saved.showTableEnhancerEntrances === true,
      showDraggerIntegrationStatus: saved.showDraggerIntegrationStatus !== false,
      embeddedModules: this.normalizeEmbeddedModulesData(saved.embeddedModules),
      settingsTabOrder: this.normalizeSettingsTabOrder(saved.settingsTabOrder),
      managedPluginCategoryRemoved: this.normalizePluginCategoryRemoved(saved.managedPluginCategoryRemoved),
      autoUpdatePluginsEnabled: saved.autoUpdatePluginsEnabled !== false,
      autoUpdatePluginIds: normalizeAutoUpdatePluginIds(saved.autoUpdatePluginIds),
      autoUpdateLastRunAt: Number.isFinite(saved.autoUpdateLastRunAt) ? Number(saved.autoUpdateLastRunAt) : 0,
      autoUpdateLastResults: normalizeAutoUpdateResults(saved.autoUpdateLastResults),
      videoSummarySettings: this.normalizeVideoSummarySettings(saved.videoSummarySettings),
    };
    if (embeddedNativeTableEnhancer) {
      data.embeddedNativeTableEnhancer = embeddedNativeTableEnhancer;
    }
    return data;
  }

  private resolveEnableBetaFeatures(saved: Partial<FeishuDocToolbarData>) {
    if (saved.enableBetaFeatures === true) return true;
    if (saved.enableBetaFeatures === false) return false;
    const tableEnhancer = (this.app as any)?.plugins?.plugins?.[MARKDOWN_TABLE_PLUGIN_ID];
    return !!(
      tableEnhancer?.dataStore?.experimentalFeatureGate ??
      tableEnhancer?.data?.experimentalFeatureGate ??
      tableEnhancer?.settings?.experimentalFeatureGate
    );
  }

  isBetaFeaturesEnabled() {
    return !!this.dataStore.enableBetaFeatures;
  }

  isOneNoteRichPasteEnabled() {
    return !!this.dataStore.showOneNoteImport;
  }

  /** OneNote 粘贴仅产出原生 Markdown 表，不再联动增强表格后台。 */
  isEnhancedTableFeatureEnabled() {
    if (ENHANCED_TABLE_FEATURE_LOCKED) return false;
    return false;
  }

  isTableEnhancerEntrancesVisible() {
    return false;
  }

  async setOneNoteRichPasteEnabled(value: boolean) {
    this.dataStore = {
      ...this.dataStore,
      showOneNoteImport: value,
      showTableEnhancerEntrances: false,
    };
    await this.saveData(this.dataStore);
    await this.syncExperimentalFeatureGateToTableEnhancer(false);
  }

  async setBetaFeaturesEnabled(value: boolean) {
    this.dataStore = {
      ...this.dataStore,
      enableBetaFeatures: value,
      showTableEnhancerEntrances: false,
    };
    await this.saveData(this.dataStore);
    if (!value) {
      await this.syncExperimentalFeatureGateToTableEnhancer(false);
    }
  }

  getVideoSummarySettings(): VideoSummaryUserSettings {
    return this.normalizeVideoSummarySettings(this.dataStore.videoSummarySettings);
  }

  async saveVideoSummarySettings(value: Partial<VideoSummaryUserSettings>) {
    this.dataStore = {
      ...this.dataStore,
      videoSummarySettings: this.normalizeVideoSummarySettings({
        ...this.dataStore.videoSummarySettings,
        ...value,
      }),
    };
    await this.saveData(this.dataStore);
  }

  private async syncExperimentalFeatureGateToTableEnhancer(enabled: boolean) {
    const tableEnhancer = (this.app as any)?.plugins?.plugins?.[MARKDOWN_TABLE_PLUGIN_ID];
    if (!tableEnhancer) return;
    if (typeof tableEnhancer.setExperimentalFeatureGate === "function") {
      await tableEnhancer.setExperimentalFeatureGate(enabled);
      return;
    }
    if (tableEnhancer.dataStore && typeof tableEnhancer.savePluginData === "function") {
      tableEnhancer.dataStore.experimentalFeatureGate = enabled;
      await tableEnhancer.savePluginData();
    }
  }

  private normalizeSettingsTabOrder(value: unknown): ExperienceSettingsTabId[] {
    const allowed = new Set<ExperienceSettingsTabId>(DEFAULT_SETTINGS_TAB_ORDER);
    const source = Array.isArray(value) ? value : [];
    const result: ExperienceSettingsTabId[] = [];
    for (const item of source) {
      if (typeof item !== "string" || !allowed.has(item as ExperienceSettingsTabId)) continue;
      if (result.includes(item as ExperienceSettingsTabId)) continue;
      result.push(item as ExperienceSettingsTabId);
    }
    for (const tabId of DEFAULT_SETTINGS_TAB_ORDER) {
      if (!result.includes(tabId)) result.push(tabId);
    }
    return result;
  }

  private normalizeVideoSummarySettings(value: unknown): VideoSummaryUserSettings {
    const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const cleanString = (key: VideoSummaryStringSettingKey, maxLength: number) => {
      const raw = source[key];
      return typeof raw === "string" && raw.trim()
        ? raw.trim().slice(0, maxLength)
        : DEFAULT_VIDEO_SUMMARY_SETTINGS[key];
    };
    const serviceUrl = this.normalizeExternalUrl(cleanString("serviceUrl", 500));
    const agentJobsUrl = this.normalizeExternalUrl(cleanString("agentJobsUrl", 500));
    return {
      serviceUrl,
      agentJobsUrl,
      skillName: cleanString("skillName", 80),
      outputDir: cleanString("outputDir", 300),
      defaultPrompt: cleanString("defaultPrompt", 2000),
      enableLocalDiagnostics:
        typeof source.enableLocalDiagnostics === "boolean"
          ? source.enableLocalDiagnostics
          : DEFAULT_VIDEO_SUMMARY_SETTINGS.enableLocalDiagnostics,
    };
  }

  private normalizeExternalUrl(value: string) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (!/^https?:\/\//i.test(text)) return "";
    return text;
  }

  private normalizePluginCategoryRemoved(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === "string" && /^[a-zA-Z0-9._-]+$/.test(item));
  }

  private normalizeEmbeddedModulesData(value: unknown): Record<string, { enabled: boolean; data?: unknown }> {
    const result: Record<string, { enabled: boolean; data?: unknown }> = {};
    if (!value || typeof value !== "object") return result;
    for (const [id, entry] of Object.entries(value as Record<string, unknown>)) {
      if (!/^[a-zA-Z0-9._-]+$/.test(id)) continue;
      if (!entry || typeof entry !== "object") continue;
      const enabled = (entry as any).enabled !== false;
      const data = (entry as any).data;
      result[id] = { enabled, data };
    }
    return result;
  }

  private normalizeEmbeddedNativeTableData(value: unknown) {
    return value && typeof value === "object" ? value : undefined;
  }

  private normalizePluginTextMap(value: unknown) {
    const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const result: Record<string, string> = {};
    for (const [id, text] of Object.entries(source)) {
      if (!/^[a-zA-Z0-9._-]+$/.test(id) || typeof text !== "string") continue;
      const normalized = text.trim().slice(0, 80);
      if (normalized) result[id] = normalized;
    }
    return result;
  }

  private normalizePluginCategoryOrder(orderValue: unknown, namesValue: unknown, removedValue?: unknown) {
    const removed = new Set(this.normalizePluginCategoryRemoved(removedValue));
    const defaults = DEFAULT_MANAGED_PLUGIN_CATEGORIES.map((category) => category.id).filter((id) => !removed.has(id));
    const customNames =
      namesValue && typeof namesValue === "object" ? Object.keys(namesValue as Record<string, unknown>) : [];
    const source = Array.isArray(orderValue) ? orderValue.filter((id) => typeof id === "string" && !removed.has(id)) : [];
    const seed = source.length > 0 ? source : defaults;
    const result: string[] = [];
    for (const id of [...seed, ...customNames]) {
      if (typeof id !== "string" || !/^[a-zA-Z0-9._-]+$/.test(id) || removed.has(id) || result.includes(id)) continue;
      result.push(id);
    }
    if (!result.includes(MANAGED_PLUGIN_FALLBACK_CATEGORY_ID)) {
      result.push(MANAGED_PLUGIN_FALLBACK_CATEGORY_ID);
    }
    return result;
  }

  getOrderedSettingsTabs() {
    const tabMap = new Map(EXPERIENCE_SETTINGS_TABS.map((tab) => [tab.id, tab]));
    return this.dataStore.settingsTabOrder
      .map((id) => tabMap.get(id))
      .filter((tab): tab is (typeof EXPERIENCE_SETTINGS_TABS)[number] => Boolean(tab));
  }

  async updateSettingsTabOrder(order: ExperienceSettingsTabId[]) {
    this.dataStore.settingsTabOrder = this.normalizeSettingsTabOrder(order);
    await this.saveData(this.dataStore);
  }

  async moveSettingsTab(sourceId: ExperienceSettingsTabId, targetId: ExperienceSettingsTabId) {
    if (sourceId === targetId) return false;
    const order = [...this.dataStore.settingsTabOrder];
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return false;
    order.splice(from, 1);
    order.splice(to, 0, sourceId);
    await this.updateSettingsTabOrder(order);
    return true;
  }

  async updateManagementSetting(key: ManagementSettingKey, value: boolean) {
    const nextValue = key === "showTableEnhancerEntrances" ? false : value;
    if (key === "showOneNoteImport") {
      await this.setOneNoteRichPasteEnabled(nextValue);
      return;
    }
    this.dataStore = { ...this.dataStore, [key]: nextValue };
    await this.saveData(this.dataStore);
  }

  private normalizeToolbarActionOrder(value: unknown): BlockAction[] {
    if (!Array.isArray(value)) return [];
    const allowed = new Set(this.getDefaultSortableToolbarActions());
    const result: BlockAction[] = [];
    for (const item of value) {
      if (typeof item !== "string" || !allowed.has(item as BlockAction) || result.includes(item as BlockAction)) continue;
      result.push(item as BlockAction);
    }
    return result;
  }

  private getDefaultSortableToolbarActions() {
    return this.getDefaultStableQuickActionGroupsForContext("paragraph").flatMap((group) => group.items.map((item) => item.action));
  }

  private orderToolbarItems(items: ToolbarActionItem[]) {
    const order = this.dataStore.toolbarActionOrder;
    if (order.length === 0) return items;
    const orderMap = new Map(order.map((action, index) => [action, index]));
    return [...items].sort((a, b) => {
      const aIndex = orderMap.get(a.action) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderMap.get(b.action) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return items.indexOf(a) - items.indexOf(b);
    });
  }

  private applyToolbarActionOrder(groups: ToolbarActionGroup[]) {
    return groups.map((group) => ({
      ...group,
      items: this.orderToolbarItems(group.items),
    }));
  }

  getSortableToolbarGroups() {
    return this.applyToolbarActionOrder(this.getDefaultStableQuickActionGroupsForContext("paragraph"));
  }

  buildSettingsToolbarPreview(onReorder: () => void | Promise<void>) {
    const preview = document.createElement("div");
    preview.className = "fdtb-popover fdtb-settings-toolbar-preview";

    const section = document.createElement("section");
    section.className = "fdtb-section";

    const groups = this.getSortableToolbarGroups();
    groups.forEach((group, index) => {
      if (index > 0) {
        section.appendChild(this.createPopoverDivider());
      }
      section.appendChild(
        this.createActionGroup(group, {
          sortable: true,
          onReorder,
        })
      );
    });

    preview.appendChild(section);
    return preview;
  }

  async moveToolbarAction(sourceAction: BlockAction, targetAction: BlockAction, options?: { keepPopover?: boolean }) {
    const defaultActions = this.getDefaultSortableToolbarActions();
    const sourceGroup = this.getDefaultStableQuickActionGroupsForContext("paragraph").find((group) =>
      group.items.some((item) => item.action === sourceAction)
    );
    const targetGroup = this.getDefaultStableQuickActionGroupsForContext("paragraph").find((group) =>
      group.items.some((item) => item.action === targetAction)
    );
    if (!sourceGroup || !targetGroup || sourceGroup.label !== targetGroup.label) return false;

    const currentOrder = this.normalizeToolbarActionOrder([
      ...this.dataStore.toolbarActionOrder,
      ...defaultActions.filter((action) => !this.dataStore.toolbarActionOrder.includes(action)),
    ]);
    const sourceIndex = currentOrder.indexOf(sourceAction);
    const targetIndex = currentOrder.indexOf(targetAction);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;

    currentOrder.splice(sourceIndex, 1);
    currentOrder.splice(targetIndex, 0, sourceAction);
    this.dataStore = { ...this.dataStore, toolbarActionOrder: currentOrder };
    await this.saveData(this.dataStore);
    if (options?.keepPopover !== false) {
      this.refreshOpenToolbarPopover();
    }
    return true;
  }

  async resetToolbarActionOrder(options?: { keepPopover?: boolean }) {
    this.dataStore = { ...this.dataStore, toolbarActionOrder: [] };
    await this.saveData(this.dataStore);
    if (options?.keepPopover !== false) {
      this.refreshOpenToolbarPopover();
    }
  }

  private refreshOpenToolbarPopover() {
    if (!this.popoverEl || !this.activeContext) {
      this.hidePopover();
      return;
    }
    const context = this.activeContext;
    this.showPopover(context);
  }

  getManagedPluginStatus(pluginId: string) {
    const pluginManager = (this.app as any)?.plugins;
    const pluginsMap = pluginManager?.plugins ?? {};
    const manifests = pluginManager?.manifests ?? {};
    const enabledSet = pluginManager?.enabledPlugins as Set<string> | undefined;
    const installed = Boolean(manifests[pluginId]) || Boolean(pluginsMap[pluginId]);
    const enabled =
      enabledSet && typeof enabledSet.has === "function"
        ? enabledSet.has(pluginId)
        : Boolean(pluginsMap[pluginId]);
    return { installed, enabled };
  }

  getHostedPluginItems(): HostedPluginItem[] {
    const pluginManager = (this.app as any)?.plugins;
    const pluginsMap = pluginManager?.plugins ?? {};
    const manifests = pluginManager?.manifests ?? {};
    const enabledSet = pluginManager?.enabledPlugins as Set<string> | undefined;
    const ids = new Set<string>(["feishu-doc-toolbar", ...Object.keys(manifests), ...Object.keys(pluginsMap)]);
    return Array.from(ids)
      .map((id) => {
        const manifest = manifests[id] ?? pluginsMap[id]?.manifest ?? {};
        const enabled =
          id === "feishu-doc-toolbar" ||
          (enabledSet && typeof enabledSet.has === "function"
            ? enabledSet.has(id)
            : Boolean(pluginsMap[id]));
        const installed = Boolean(manifests[id]) || Boolean(pluginsMap[id]);
        const originalName = id === "feishu-doc-toolbar" ? "Obsidian增强体验" : String(manifest.name ?? id);
        const alias = this.dataStore.managedPluginAliases[id] ?? "";
        const note = this.dataStore.managedPluginNotes[id] ?? "";
        return {
          id,
          name: alias || originalName,
          originalName,
          alias,
          note,
          version: String(manifest.version ?? ""),
          installed,
          enabled,
          toggleable: id !== "feishu-doc-toolbar" && installed,
          status: enabled ? "已启用" : installed ? "已安装未启用" : "未安装",
          description: HOSTED_PLUGIN_DESCRIPTIONS[id] ?? "已安装插件，当前仅做状态展示",
        };
      })
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.name.localeCompare(b.name, "zh-Hans-CN");
      });
  }

  getManagedPluginCategories(): ManagedPluginCategory[] {
    const defaultMap = new Map(DEFAULT_MANAGED_PLUGIN_CATEGORIES.map((category) => [category.id, category.name]));
    const ids = this.normalizePluginCategoryOrder(
      this.dataStore.managedPluginCategoryOrder,
      this.dataStore.managedPluginCategoryNames,
      this.dataStore.managedPluginCategoryRemoved
    );
    return ids.map((id) => ({
      id,
      name: this.dataStore.managedPluginCategoryNames[id] || defaultMap.get(id) || id,
    }));
  }

  getManagedPluginCategoryMoveOptions() {
    return this.getManagedPluginCategories().map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }

  getHostedPluginCategorySections() {
    const categories = this.getManagedPluginCategories();
    const categoryIds = new Set(categories.map((category) => category.id));
    const buckets = new Map(categories.map((category) => [category.id, [] as HostedPluginItem[]]));
    for (const item of this.getHostedPluginItems()) {
      const assigned = this.dataStore.managedPluginCategories[item.id];
      const categoryId = assigned && categoryIds.has(assigned) ? assigned : this.inferManagedPluginCategory(item);
      const safeCategoryId = categoryIds.has(categoryId) ? categoryId : MANAGED_PLUGIN_FALLBACK_CATEGORY_ID;
      if (!buckets.has(safeCategoryId)) buckets.set(safeCategoryId, []);
      buckets.get(safeCategoryId)?.push(item);
    }
    return categories.map((category) => ({
      category,
      items: buckets.get(category.id) ?? [],
    }));
  }

  private inferManagedPluginCategory(item: HostedPluginItem) {
    const id = item.id.toLowerCase();
    const text = `${item.name} ${item.originalName} ${item.description}`.toLowerCase();
    if (id.includes("table") || id.includes("univer") || id.includes("excel")) return "table";
    if (id.includes("dragger") || id.includes("block-link")) return "block";
    if (id.includes("task") || id.includes("calendar") || id.includes("recent")) return "automation";
    if (id.includes("html") || id.includes("reader") || id.includes("clipper")) return "content";
    if (id.includes("style") || id.includes("wide") || id.includes("setting")) return "style";
    if (id.includes("image") || id.includes("copy") || id.includes("localizer") || text.includes("图片")) return "file";
    if (id.includes("claudian") || id.includes("yolo") || id.includes("textgenerator") || text.includes("ai")) return "ai";
    return MANAGED_PLUGIN_FALLBACK_CATEGORY_ID;
  }

  async createManagedPluginCategory(name: string) {
    const normalizedName = name.trim().slice(0, 30);
    if (!normalizedName) return false;
    const id = `custom_${Date.now().toString(36)}`;
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategoryNames: {
        ...this.dataStore.managedPluginCategoryNames,
        [id]: normalizedName,
      },
      managedPluginCategoryOrder: [
        ...this.normalizePluginCategoryOrder(
          this.dataStore.managedPluginCategoryOrder,
          this.dataStore.managedPluginCategoryNames,
          this.dataStore.managedPluginCategoryRemoved
        ),
        id,
      ],
    };
    await this.saveData(this.dataStore);
    new Notice(`已创建分类：${normalizedName}`);
    return true;
  }

  async renameManagedPluginCategory(categoryId: string, newName: string) {
    const safe = newName.trim().slice(0, 30);
    if (!safe || !/^[a-zA-Z0-9._-]+$/.test(categoryId)) {
      new Notice("分类名称无效");
      return false;
    }
    const exists = this.getManagedPluginCategories().some((category) => category.id === categoryId);
    if (!exists) {
      new Notice("分类不存在");
      return false;
    }
    const current = this.getManagedPluginCategories().find((category) => category.id === categoryId);
    if (current?.name === safe) return true;
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategoryNames: {
        ...this.dataStore.managedPluginCategoryNames,
        [categoryId]: safe,
      },
    };
    await this.saveData(this.dataStore);
    new Notice(`分类已改名为：${safe}`);
    return true;
  }

  async deleteManagedPluginCategory(categoryId: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(categoryId)) return false;
    if (categoryId === MANAGED_PLUGIN_FALLBACK_CATEGORY_ID) {
      new Notice("「其他插件」是系统默认分类，不能删除");
      return false;
    }
    const categories = this.getManagedPluginCategories();
    if (categories.length <= 1) {
      new Notice("至少保留一个分类");
      return false;
    }
    const section = this.getHostedPluginCategorySections().find((entry) => entry.category.id === categoryId);
    const items = section?.items ?? [];
    const displayName = section?.category.name ?? categoryId;
    const fallbackName =
      this.getManagedPluginCategories().find((category) => category.id === MANAGED_PLUGIN_FALLBACK_CATEGORY_ID)?.name ??
      "其他插件";
    const confirmMessage =
      items.length === 0
        ? `确定删除分类「${displayName}」？`
        : `分类「${displayName}」内有 ${items.length} 个插件，删除后插件将移至「${fallbackName}」，确定吗？`;
    if (!confirmUserAction(confirmMessage)) return false;

    const nextCategories = { ...this.dataStore.managedPluginCategories };
    for (const item of items) {
      nextCategories[item.id] = MANAGED_PLUGIN_FALLBACK_CATEGORY_ID;
    }
    const nextNames = { ...this.dataStore.managedPluginCategoryNames };
    delete nextNames[categoryId];
    const nextRemoved = Array.from(new Set([...this.dataStore.managedPluginCategoryRemoved, categoryId]));
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategories: nextCategories,
      managedPluginCategoryNames: nextNames,
      managedPluginCategoryRemoved: nextRemoved,
      managedPluginCategoryOrder: this.normalizePluginCategoryOrder(
        this.dataStore.managedPluginCategoryOrder.filter((id) => id !== categoryId),
        nextNames,
        nextRemoved
      ),
    };
    await this.saveData(this.dataStore);
    new Notice(`已删除分类：${displayName}`);
    return true;
  }

  async moveManagedPluginToCategory(pluginId: string, categoryId: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(pluginId) || !/^[a-zA-Z0-9._-]+$/.test(categoryId)) return false;
    const categoryIds = new Set(this.getManagedPluginCategories().map((category) => category.id));
    if (!categoryIds.has(categoryId)) return false;
    const current = this.dataStore.managedPluginCategories[pluginId];
    if (current === categoryId) return true;
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategories: {
        ...this.dataStore.managedPluginCategories,
        [pluginId]: categoryId,
      },
    };
    await this.saveData(this.dataStore);
    const label = this.getManagedPluginCategories().find((category) => category.id === categoryId)?.name ?? categoryId;
    new Notice(`已移到：${label}`);
    return true;
  }

  async refreshManagedPluginStatus(options: { silent?: boolean } = {}) {
    this.dataStore = { ...this.dataStore, managedPluginStatusCheckedAt: Date.now() };
    await this.saveData(this.dataStore);
    this.applyManagedPluginAliasesToSettingsSidebar();
    if (!options.silent) new Notice("已刷新第三方插件状态");
  }

  getPluginStatusMonitorDescription() {
    const checkedAt = this.dataStore.managedPluginStatusCheckedAt;
    if (!checkedAt) return "进入本页会自动读取 Obsidian 当前插件状态；右侧开关用于启用或关闭插件";
    return `进入本页自动读取 Obsidian 当前插件状态；上次自动监测：${new Date(checkedAt).toLocaleString()}`;
  }

  getAutoUpdatePluginsDescription() {
    const ids = this.dataStore.autoUpdatePluginIds
      .map((id) => AUTO_UPDATE_PLUGIN_LABELS[id] ?? id)
      .join("、");
    const lastRunAt = this.dataStore.autoUpdateLastRunAt;
    const lastRunText = lastRunAt ? `上次检查：${new Date(lastRunAt).toLocaleString()}` : "尚未执行自动更新";
    return `当前白名单：${ids || "（空）"}。${lastRunText}`;
  }

  getAutoUpdateLastResultLines() {
    const ids = [...this.dataStore.autoUpdatePluginIds];
    const seen = new Set<string>();
    const lines: string[] = [];
    for (const pluginId of ids) {
      const result = this.dataStore.autoUpdateLastResults[pluginId];
      if (!result || seen.has(pluginId)) continue;
      seen.add(pluginId);
      lines.push(formatAutoUpdateResult(result));
    }
    return lines;
  }

  async setAutoUpdatePluginsEnabled(enabled: boolean) {
    this.dataStore = { ...this.dataStore, autoUpdatePluginsEnabled: enabled };
    await this.saveData(this.dataStore);
  }

  async addAutoUpdatePluginId(pluginId: string) {
    const resolved = resolveAutoUpdatePluginId(pluginId);
    if (!resolved || !/^[a-zA-Z0-9._-]+$/.test(resolved)) {
      new Notice("插件 id 无效");
      return false;
    }
    if (isAutoUpdateBlockedPluginId(resolved)) {
      new Notice("自研插件不能加入自动更新白名单，请保持本地开发版本");
      return false;
    }
    const nextIds = normalizeAutoUpdatePluginIds([
      ...this.dataStore.autoUpdatePluginIds,
      resolved,
    ]);
    if (nextIds.length === this.dataStore.autoUpdatePluginIds.length) {
      new Notice("该插件已在白名单中");
      return false;
    }
    this.dataStore = { ...this.dataStore, autoUpdatePluginIds: nextIds };
    await this.saveData(this.dataStore);
    new Notice(`已加入自动更新白名单：${AUTO_UPDATE_PLUGIN_LABELS[resolved] ?? resolved}`);
    return true;
  }

  async removeAutoUpdatePluginId(pluginId: string) {
    const resolved = resolveAutoUpdatePluginId(pluginId);
    const nextIds = this.dataStore.autoUpdatePluginIds.filter((id) => id !== resolved);
    if (nextIds.length === this.dataStore.autoUpdatePluginIds.length) return false;
    if (nextIds.length === 0) {
      new Notice("至少保留一个自动更新插件");
      return false;
    }
    this.dataStore = { ...this.dataStore, autoUpdatePluginIds: nextIds };
    await this.saveData(this.dataStore);
    new Notice(`已移出自动更新白名单：${AUTO_UPDATE_PLUGIN_LABELS[resolved] ?? resolved}`);
    return true;
  }

  private scheduleStartupManagedPluginAutoUpdate() {
    if (!this.dataStore.autoUpdatePluginsEnabled) return;
    window.setTimeout(() => {
      void this.runAutoUpdateManagedPlugins({ manual: false });
    }, 8000);
  }

  async runAutoUpdateManagedPlugins(options: { manual?: boolean } = {}) {
    if (this.autoUpdateInFlight) {
      if (options.manual) {
        new Notice("上一次更新检查仍在进行，请稍后再试");
      }
      return;
    }

    const task = (async () => {
      if (!options.manual && !this.dataStore.autoUpdatePluginsEnabled) return;
      try {
        const { results, summary } = await runManagedPluginAutoUpdate(
          this.app,
          this.dataStore.autoUpdatePluginIds,
          { force: options.manual }
        );
        const nextResults = { ...this.dataStore.autoUpdateLastResults };
        for (const result of results) {
          nextResults[result.pluginId] = result;
        }
        this.dataStore = {
          ...this.dataStore,
          autoUpdateLastRunAt: Date.now(),
          autoUpdateLastResults: nextResults,
        };
        await this.saveData(this.dataStore);
        await this.refreshManagedPluginStatus({ silent: true });
        new Notice(summary);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        new Notice(`插件自动更新失败：${message}`);
      }
    })();

    this.autoUpdateInFlight = task.finally(() => {
      this.autoUpdateInFlight = null;
    });
    await this.autoUpdateInFlight;
  }

  async setManagedPluginEnabled(pluginId: string, enabled: boolean) {
    if (!/^[a-zA-Z0-9._-]+$/.test(pluginId)) return false;
    if (pluginId === "feishu-doc-toolbar") {
      new Notice("Obsidian增强体验不能在自身设置页关闭");
      return false;
    }
    const pluginManager = (this.app as any)?.plugins;
    const status = this.getManagedPluginStatus(pluginId);
    if (!status.installed) {
      new Notice("这个插件未安装，不能切换启用状态");
      return false;
    }
    if (status.enabled === enabled) {
      await this.refreshManagedPluginStatus({ silent: true });
      return true;
    }

    if (enabled) {
      if (typeof pluginManager?.enablePluginAndSave === "function") {
        await pluginManager.enablePluginAndSave(pluginId);
      } else if (typeof pluginManager?.enablePlugin === "function") {
        await pluginManager.enablePlugin(pluginId);
      } else {
        throw new Error("当前 Obsidian 未暴露启用插件接口");
      }
    } else if (typeof pluginManager?.disablePluginAndSave === "function") {
      await pluginManager.disablePluginAndSave(pluginId);
    } else if (typeof pluginManager?.disablePlugin === "function") {
      await pluginManager.disablePlugin(pluginId);
    } else {
      throw new Error("当前 Obsidian 未暴露关闭插件接口");
    }

    await this.refreshManagedPluginStatus({ silent: true });
    new Notice(`${enabled ? "已启用" : "已关闭"}：${pluginId}`);
    return true;
  }

  async updateManagedPluginAlias(pluginId: string, alias: string) {
    const previousAlias = this.dataStore.managedPluginAliases[pluginId] ?? "";
    await this.updateManagedPluginTextMap("managedPluginAliases", pluginId, alias);
    this.applyManagedPluginAliasesToSettingsSidebar(pluginId, previousAlias);
  }

  async updateManagedPluginNote(pluginId: string, note: string) {
    await this.updateManagedPluginTextMap("managedPluginNotes", pluginId, note);
  }

  private async updateManagedPluginTextMap(
    key: "managedPluginAliases" | "managedPluginNotes",
    pluginId: string,
    value: string
  ) {
    if (!/^[a-zA-Z0-9._-]+$/.test(pluginId)) return;
    const nextMap = { ...this.dataStore[key] };
    const text = value.trim().slice(0, 80);
    if (text) nextMap[pluginId] = text;
    else delete nextMap[pluginId];
    this.dataStore = { ...this.dataStore, [key]: nextMap };
    await this.saveData(this.dataStore);
  }

  getNativeColorSettingsForManager(): NativeColorSettings | null {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.getNativeColorSettingsForManager !== "function") return null;
    return enhancer.getNativeColorSettingsForManager();
  }

  async updateNativeColorSettingsFromManager(input: {
    defaultPresetId?: NativeColorSettings["defaultPresetId"];
    customPalette?: Partial<NativeColorPalette>;
  }) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.updateNativeColorSettingsFromManager !== "function") {
      new Notice("原生表格增强插件未接通");
      return null;
    }
    const result = await enhancer.updateNativeColorSettingsFromManager(input);
    new Notice("已更新原生表格默认配色");
    return result as NativeColorSettings;
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
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.updateNativeTableDefaultsFromManager !== "function") {
      new Notice("原生表格增强插件未接通");
      return null;
    }
    return (await enhancer.updateNativeTableDefaultsFromManager(input)) as NativeColorSettings;
  }

  getAdvancedTableSettingsForManager(): AdvancedTableSettings | null {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.getAdvancedTableSettingsForManager !== "function") return null;
    return enhancer.getAdvancedTableSettingsForManager() as AdvancedTableSettings;
  }

  async updateAdvancedTableSettingsFromManager(input: Partial<AdvancedTableSettings>) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.updateAdvancedTableSettingsFromManager !== "function") {
      new Notice("原生表格增强插件未接通");
      return null;
    }
    const result = await enhancer.updateAdvancedTableSettingsFromManager(input);
    new Notice("已更新表格编辑体验");
    return result as AdvancedTableSettings;
  }

  async saveCurrentNativeColorPaletteAsManager(label: string) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.saveCurrentNativeColorPaletteAsManager !== "function") {
      new Notice("原生表格增强插件未接通");
      return null;
    }
    return (await enhancer.saveCurrentNativeColorPaletteAsManager(label)) as NativeColorSettings;
  }

  async deleteNativeColorPaletteFromManager(id: string) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.deleteNativeColorPaletteFromManager !== "function") {
      new Notice("原生表格增强插件未接通");
      return null;
    }
    return (await enhancer.deleteNativeColorPaletteFromManager(id)) as NativeColorSettings;
  }

  applyManagedPluginAliasesToSettingsSidebar(targetPluginId?: string, previousAlias?: string) {
    if (typeof document === "undefined") return;
    const items = Array.from(document.querySelectorAll<HTMLElement>(".vertical-tab-nav-item"));
    if (items.length === 0) return;
    for (const item of this.getHostedPluginItems()) {
      if (targetPluginId && item.id !== targetPluginId) continue;
      for (const el of items) {
        const text = el.textContent?.trim() ?? "";
        if (text !== item.originalName && text !== item.alias && text !== previousAlias) continue;
        el.textContent = item.alias || item.originalName;
        el.title = `${item.originalName} · ${item.id}`;
      }
    }
  }

  async runManagedCommand(commandId: string) {
    return this.executeCommandById(commandId);
  }

  getPluginVersion() {
    return this.manifest.version || "unknown";
  }

  async openExternalUrl(url: string) {
    const nodeRequire = this.getNodeRequire();
    const childProcess = nodeRequire?.("child_process");
    if (childProcess && typeof childProcess.execFile === "function") {
      childProcess.execFile("/usr/bin/open", [url], (error: Error | null) => {
        if (error) new Notice(`打开失败：${error.message}`, 8000);
      });
      return;
    }
    window.open(url, "_blank");
  }

  async getVideoSummaryDiagnostics(): Promise<VideoSummaryDiagnostics> {
    const settings = this.getVideoSummarySettings();
    const serviceUrl = settings.serviceUrl;
    const agentJobsUrl = settings.agentJobsUrl || (serviceUrl ? this.joinUrl(serviceUrl, "jobs") : "");
    const serviceHealth = serviceUrl
      ? await this.checkHttpEndpoint(this.joinUrl(serviceUrl, "health"), "视频总结服务健康检查")
      : { label: "视频总结服务健康检查", status: "待配置", description: "请先填写视频总结网页入口 URL。" };

    if (OSS_RELEASE || !settings.enableLocalDiagnostics) {
      const delegated = { label: "视频总结服务", status: "服务端托管", description: "Cookie、API Key 和媒体下载由视频总结服务托管，插件不保存密钥。" };
      const delegatedPlatforms: VideoSummaryPlatformStatus[] = [
        { platform: "bilibili", label: "B站 Cookie", configured: false, length: 0, error: "由视频总结服务托管；插件不保存 Cookie。" },
        { platform: "douyin", label: "抖音 Cookie", configured: false, length: 0, error: "由视频总结服务托管；插件不保存 Cookie。" },
        { platform: "youtube", label: "YouTube Cookie", configured: false, length: 0, error: "由视频总结服务托管；插件不保存 Cookie。" },
      ];
      return {
        pluginVersion: this.getPluginVersion(),
        skillPath: settings.skillName,
        skillExists: true,
        scriptPath: "插件不读取本机脚本",
        scriptExists: true,
        outputDir: settings.outputDir,
        defaultModel: "由服务端或 Skill 配置",
        visualEnabled: true,
        providerId: "",
        providerBaseUrl: "",
        serviceUrl: serviceUrl || "未配置",
        agentJobsUrl: agentJobsUrl || "未配置",
        serviceHealth,
        bilibiliNoteHealth: delegated,
        workbenchHealth: delegated,
        configPath: "插件不保存 Cookie/API/Token",
        configExists: false,
        agentTokenConfigured: false,
        agentTokenLength: 0,
        sessionSecretConfigured: false,
        webPasswordConfigured: false,
        platforms: delegatedPlatforms,
      };
    }

    const paths = this.getVideoSummaryPaths();
    const fs = this.getNodeRequire()?.("fs");
    const skillExists = Boolean(fs?.existsSync?.(paths.skill));
    const scriptExists = Boolean(fs?.existsSync?.(paths.script));
    const config = this.readVideoSummaryServiceConfig(paths.config);
    const check = scriptExists ? await this.runVideoSummaryCheck(paths.script) : null;
    const workbenchHealth = await this.checkHttpEndpoint("http://127.0.0.1:4321/__workbench_health", "本地内容分享工作台");

    const model = String(check?.default_model || "Kimi-K2.6");
    const providerId = String(check?.provider_id || "");
    const outputDir = String(check?.output_dir || settings.outputDir || "未配置输出仓库");
    const cookies = check?.cookies && typeof check.cookies === "object" ? check.cookies : {};
    const platforms: VideoSummaryPlatformStatus[] = [
      this.normalizeVideoSummaryPlatformStatus("bilibili", "B站 Cookie", (cookies as any).bilibili),
      this.normalizeVideoSummaryPlatformStatus("douyin", "抖音 Cookie", (cookies as any).douyin),
      this.normalizeVideoSummaryPlatformStatus("youtube", "YouTube Cookie", (cookies as any).youtube),
    ];

    return {
      pluginVersion: this.getPluginVersion(),
      skillPath: paths.skill,
      skillExists,
      scriptPath: paths.script,
      scriptExists,
      outputDir,
      defaultModel: model,
      visualEnabled: check?.video_understanding_enabled_by_default !== false,
      providerId,
      providerBaseUrl: "https://www.autodl.art/api/v1",
      serviceUrl: serviceUrl || "未配置",
      agentJobsUrl: agentJobsUrl || "未配置",
      serviceHealth,
      bilibiliNoteHealth: check
        ? { label: "BiliNote 后端", status: "正常", description: String(check.base_url || "http://127.0.0.1:8483") }
        : { label: "BiliNote 后端", status: "未连接", description: "未能完成 BiliNote 配置检查；请确认 BiliNote 后端正在运行。" },
      workbenchHealth,
      configPath: paths.config,
      configExists: config.exists,
      agentTokenConfigured: config.agentTokenConfigured,
      agentTokenLength: config.agentTokenLength,
      sessionSecretConfigured: config.sessionSecretConfigured,
      webPasswordConfigured: config.webPasswordConfigured,
      platforms,
    };
  }

  private getVideoSummaryPaths() {
    const home = this.getHomeDir();
    return {
      skill: this.joinSystemPath(home, "ai-skills", "video-summary", "SKILL.md"),
      script: this.joinSystemPath(home, "ai-skills", "video-summary", "scripts", "video_summary.py"),
      config: this.joinSystemPath(home, ".config", "video-summary-service", "config.json"),
    };
  }

  private getHomeDir() {
    const nodeRequire = this.getNodeRequire();
    const os = nodeRequire?.("os");
    if (os && typeof os.homedir === "function") return String(os.homedir());
    const processModule = nodeRequire?.("process");
    return String(processModule?.env?.HOME ?? "");
  }

  private readVideoSummaryServiceConfig(configPath: string) {
    const result = {
      exists: false,
      agentTokenConfigured: false,
      agentTokenLength: 0,
      sessionSecretConfigured: false,
      webPasswordConfigured: false,
    };
    const nodeRequire = this.getNodeRequire();
    const fs = nodeRequire?.("fs");
    if (!fs?.existsSync?.(configPath)) return result;
    result.exists = true;
    try {
      const raw = fs.readFileSync(configPath, "utf8");
      const data = JSON.parse(raw || "{}");
      const agentToken = typeof data.agent_token === "string" ? data.agent_token : "";
      result.agentTokenConfigured = agentToken.length > 0;
      result.agentTokenLength = agentToken.length;
      result.sessionSecretConfigured = typeof data.session_secret === "string" && data.session_secret.length > 0;
      result.webPasswordConfigured =
        (typeof data.web_password_hash === "string" && data.web_password_hash.length > 0) ||
        (typeof data.web_password_salt === "string" && data.web_password_salt.length > 0);
    } catch (error) {
      console.warn("[feishu-doc-toolbar] 读取视频总结服务配置失败", error);
    }
    return result;
  }

  private async runVideoSummaryCheck(scriptPath: string): Promise<any | null> {
    try {
      const result = await this.runSystemCommand("python3", [scriptPath, "--check", "--no-open-app"], {
        timeout: 90 * 1000,
        maxBuffer: 2 * 1024 * 1024,
      });
      if (!result.ok) return null;
      return this.extractJsonFromOutput(result.stdout);
    } catch (error) {
      console.warn("[feishu-doc-toolbar] 视频总结配置检查失败", error);
      return null;
    }
  }

  private normalizeVideoSummaryPlatformStatus(
    platform: string,
    label: string,
    value: unknown
  ): VideoSummaryPlatformStatus {
    if (!value || typeof value !== "object") {
      return { platform, label, configured: false, length: 0 };
    }
    const item = value as Record<string, unknown>;
    return {
      platform,
      label,
      configured: item.configured === true,
      length: Number.isFinite(item.length) ? Number(item.length) : 0,
      error: typeof item.error === "string" ? item.error : undefined,
    };
  }

  private joinUrl(base: string, child: string) {
    const root = String(base || "").replace(/\/+$/g, "");
    const tail = String(child || "").replace(/^\/+/g, "");
    return root && tail ? `${root}/${tail}` : root || tail;
  }

  private async checkHttpEndpoint(url: string, label: string): Promise<ManagementStatusItem> {
    try {
      const result = await this.runSystemCommand("/usr/bin/curl", ["-sS", "-m", "8", "-o", "/dev/null", "-w", "%{http_code}", url], {
        timeout: 12 * 1000,
        maxBuffer: 64 * 1024,
      });
      const statusCode = Number(String(result.stdout || "").trim());
      const ok = result.ok && statusCode >= 200 && statusCode < 400;
      return {
        label,
        status: ok ? "正常" : `异常 ${statusCode || "未知"}`,
        description: `${url}${ok ? "" : result.stderr ? `；${result.stderr.trim().slice(0, 160)}` : ""}`,
      };
    } catch (error) {
      return {
        label,
        status: "不可访问",
        description: `${url}；${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private runSystemCommand(
    command: string,
    args: string[],
    options: { timeout?: number; maxBuffer?: number; cwd?: string } = {}
  ): Promise<{ ok: boolean; stdout: string; stderr: string; code?: number | string }> {
    const nodeRequire = this.getNodeRequire();
    const childProcess = nodeRequire?.("child_process");
    const processModule = nodeRequire?.("process");
    if (!childProcess || typeof childProcess.execFile !== "function") {
      return Promise.resolve({ ok: false, stdout: "", stderr: "当前 Obsidian 环境不能调用本机命令" });
    }
    const env = {
      ...(processModule?.env ?? {}),
      PATH: `${processModule?.env?.HOME ?? ""}/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${processModule?.env?.PATH ?? ""}`,
    };
    return new Promise((resolve) => {
      childProcess.execFile(
        command,
        args,
        {
          cwd: options.cwd,
          env,
          timeout: options.timeout ?? 30 * 1000,
          maxBuffer: options.maxBuffer ?? 1024 * 1024,
        },
        (error: Error & { code?: number | string } | null, stdout: string, stderr: string) => {
          resolve({ ok: !error, stdout: stdout || "", stderr: stderr || error?.message || "", code: error?.code });
        }
      );
    });
  }

  private extractJsonFromOutput(output: string) {
    const text = String(output || "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    return JSON.parse(text.slice(start, end + 1));
  }

  getClaudianAgentBridgePaths() {
    const vaultPath = this.getVaultBasePath();
    const dir = this.joinSystemPath(
      vaultPath,
      "开发插件（Obsidian优化）",
      "_tooling",
      "claudian-agent-bridge"
    );
    return {
      dir,
      verify: this.joinSystemPath(dir, "verify.sh"),
      repair: this.joinSystemPath(dir, "repair.sh"),
    };
  }

  async runClaudianAgentBridgeScript(scriptName: "verify.sh" | "repair.sh"): Promise<ClaudianAgentBridgeScriptResult> {
    const nodeRequire = this.getNodeRequire();
    const childProcess = nodeRequire?.("child_process");
    const processModule = nodeRequire?.("process");
    if (!childProcess || typeof childProcess.execFile !== "function") {
      return {
        ok: false,
        output: "当前 Obsidian 环境不能调用本机脚本，请确认正在桌面端使用。",
      };
    }

    const paths = this.getClaudianAgentBridgePaths();
    const scriptPath = this.joinSystemPath(paths.dir, scriptName);
    const timeout = scriptName === "repair.sh" ? 10 * 60 * 1000 : 2 * 60 * 1000;
    const env = {
      ...(processModule?.env ?? {}),
      PATH: `${processModule?.env?.HOME ?? ""}/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${processModule?.env?.PATH ?? ""}`,
      CLAUDIAN_BRIDGE_VAULT: this.getVaultBasePath(),
    };

    return new Promise((resolve) => {
      childProcess.execFile(
        "/bin/bash",
        [scriptPath],
        {
          cwd: paths.dir,
          env,
          timeout,
          maxBuffer: 4 * 1024 * 1024,
        },
        (error: Error & { code?: number | string } | null, stdout: string, stderr: string) => {
          const output = [stdout, stderr, error?.message].filter(Boolean).join("\n").trim();
          resolve({
            ok: !error,
            output,
            code: error?.code,
          });
        }
      );
    });
  }

  async readClaudianAgentBridgeFile(relativePath: string) {
    const nodeRequire = this.getNodeRequire();
    const fs = nodeRequire?.("fs");
    if (!fs || typeof fs.readFileSync !== "function") {
      throw new Error("当前环境不能读取本机文件");
    }
    return fs.readFileSync(this.joinSystemPath(this.getClaudianAgentBridgePaths().dir, relativePath), "utf8");
  }

  async openClaudianAgentBridgeFile(relativePath: string) {
    const nodeRequire = this.getNodeRequire();
    const childProcess = nodeRequire?.("child_process");
    if (!childProcess || typeof childProcess.execFile !== "function") {
      throw new Error("当前环境不能打开本机文件");
    }
    const targetPath = this.joinSystemPath(this.getClaudianAgentBridgePaths().dir, relativePath);
    childProcess.execFile("/usr/bin/open", [targetPath], (error: Error | null) => {
      if (error) new Notice(`打开失败：${error.message}`, 8000);
    });
  }

  async copyTextToClipboard(text: string) {
    await this.writeTextToClipboard(text);
  }

  private getVaultBasePath() {
    const adapter = this.app.vault.adapter as unknown as {
      getBasePath?: () => string;
      basePath?: string;
    };
    const basePath = typeof adapter.getBasePath === "function" ? adapter.getBasePath() : adapter.basePath;
    if (!basePath) throw new Error("无法识别当前 vault 路径");
    return basePath;
  }

  getVaultChildSystemPath(relativePath: string) {
    return this.joinSystemPath(this.getVaultBasePath(), relativePath);
  }

  private getNodeRequire(): ((id: string) => any) | null {
    const fromWindow = (window as any)?.require;
    if (typeof fromWindow === "function") return fromWindow;
    const fromGlobal = (globalThis as any)?.require;
    return typeof fromGlobal === "function" ? fromGlobal : null;
  }

  private joinSystemPath(...parts: string[]) {
    return parts
      .filter(Boolean)
      .map((part, index) => (index === 0 ? part.replace(/\/+$/g, "") : part.replace(/^\/+|\/+$/g, "")))
      .join("/");
  }

  private ensureHandle() {
    if (this.handleEl) return;

    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "fdtb-handle";
    handle.setAttribute("aria-label", "打开块工具");
    handle.title = "打开块工具";
    handle.innerHTML = `<span class="fdtb-handle-text">T</span>`;
    handle.style.display = "none";
    handle.addEventListener("pointerenter", () => this.clearHideTimer());
    handle.addEventListener("pointerleave", () => {
      if (!this.popoverEl) this.scheduleHideToolbar();
    });
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    handle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.togglePopover();
    });

    document.body.appendChild(handle);
    this.handleEl = handle;
  }

  private schedulePointerUpdate(event: PointerEvent) {
    if (this.rafHandle !== null) {
      window.cancelAnimationFrame(this.rafHandle);
    }

    this.rafHandle = window.requestAnimationFrame(() => {
      this.rafHandle = null;
      this.handlePointerMove(event);
    });
  }

  private handlePointerMove(event: PointerEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) {
      this.scheduleHideToolbar();
      return;
    }

    if (target.closest(".fdtb-handle, .fdtb-popover, .fdtb-submenu")) {
      this.clearHideTimer();
      return;
    }

    const draggerContext = this.getDraggerToolbarContext(target);
    if (draggerContext) {
      this.clearHideTimer();
      this.activeContext = draggerContext;
      this.renderHandle(draggerContext);
      return;
    }

    if (this.isTableTarget(target)) {
      this.hideToolbar(true);
      return;
    }

    const context = this.getOrdinaryToolbarContext(target);
    if (!context) {
      this.scheduleHideToolbar();
      return;
    }

    this.clearHideTimer();
    this.activeContext = context;
    this.renderHandle(context);
  }

  private handlePointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest(".fdtb-handle, .fdtb-popover, .fdtb-submenu")) return;

    if (this.isTableTarget(target)) {
      this.hideToolbar(true);
      return;
    }

    if (this.popoverEl) {
      this.hideToolbar(true);
      return;
    }

    const context = this.getOrdinaryToolbarContext(target);
    if (!context) {
      this.hideToolbar(true);
      return;
    }

    this.clearHideTimer();
    this.activeContext = context;
    this.renderHandle(context);
  }

  private handleEditorClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest(".fdtb-handle, .fdtb-popover, .fdtb-submenu")) return;

    if (this.isTableTarget(target)) {
      this.hideToolbar(true);
      return;
    }

    if (this.popoverEl) {
      this.hideToolbar(true);
      return;
    }

    window.setTimeout(() => {
      const context = this.getCursorOrdinaryToolbarContext(target);
      if (!context) {
        this.hideToolbar(true);
        return;
      }

      this.clearHideTimer();
      this.activeContext = context;
      this.renderHandle(context);
    }, 0);
  }

  private handleDocumentKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    if (this.imagePreviewEl) {
      event.preventDefault();
      this.closeImagePreview();
      return;
    }
    if (!this.popoverEl) return;
    this.hideToolbar(true);
  }

  private handleDocumentDoubleClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    const image = this.getPreviewableImageFromTarget(target);
    if (!image) return;

    event.preventDefault();
    event.stopPropagation();
    this.showNativeTableImagePreview(image);
  }

  private getPreviewableImageFromTarget(target: HTMLElement | null) {
    const image = target?.closest?.("img") as HTMLImageElement | null;
    if (!image) return null;
    if (image.closest(".fdtb-image-preview")) return null;

    const table = image.closest("table") as HTMLTableElement | null;
    if (table) {
      if (table.classList.contains("mdtp-table-enhanced")) return null;
      return image;
    }

    if (!this.getManagedPluginStatus("image-converter").enabled) return null;
    if (!image.closest(".markdown-preview-view, .markdown-source-view")) return null;
    return image;
  }

  private showNativeTableImagePreview(sourceImage: HTMLImageElement) {
    const source = sourceImage.currentSrc || sourceImage.src;
    if (!source) return;

    this.closeImagePreview();
    const overlay = document.createElement("div");
    overlay.className = "fdtb-image-preview";
    overlay.tabIndex = -1;
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        this.closeImagePreview();
      }
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeImagePreview();
      }
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "fdtb-image-preview-close";
    closeButton.setAttribute("aria-label", "关闭图片预览");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => this.closeImagePreview());

    const image = document.createElement("img");
    image.className = "fdtb-image-preview-img";
    image.src = source;
    image.alt = sourceImage.alt || "";

    overlay.append(closeButton, image);
    document.body.appendChild(overlay);
    this.imagePreviewEl = overlay;
    overlay.focus();
  }

  private closeImagePreview() {
    this.imagePreviewEl?.remove();
    this.imagePreviewEl = null;
  }

  private closeNativeTableImagePreview() {
    this.closeImagePreview();
  }

  private getBlockContext(target: HTMLElement): BlockContext | null {
    const view = this.getContainingMarkdownView(target);
    if (!view?.file || !this.isLivePreviewTarget(target, view)) return null;

    const editor = (view as any).editor;
    const cmView = editor?.cm;
    if (!editor || typeof editor.getLine !== "function" || !cmView?.state?.doc?.lineAt) return null;

    const blockEl = this.findBlockElement(target, view);
    if (!blockEl) return null;

    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) {
      return enhancedTableContext;
    }

    let position = 0;
    try {
      position = cmView.posAtDOM(blockEl, 0);
    } catch {
      try {
        position = cmView.posAtDOM(target, 0);
      } catch {
        position = typeof editor.getCursor === "function" ? Math.max(0, editor.getCursor().line ?? 0) : 0;
        return {
          view,
          file: view.file,
          editor,
          cmView,
          blockEl,
          line: position,
          kind: this.getBlockKind(editor, position),
        };
      }
    }

    const line = Math.max(0, cmView.state.doc.lineAt(position).number - 1);
    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line),
    };
  }

  private getCursorBlockContext(target: HTMLElement): BlockContext | null {
    const view = this.getContainingMarkdownView(target);
    if (!view?.file || !this.isLivePreviewTarget(target, view)) return null;

    const editor = (view as any).editor;
    const cmView = editor?.cm;
    if (!editor || !cmView?.state?.doc?.lineAt) return null;

    const clickedBlock = this.findBlockElement(target, view);
    const enhancedTableContext = clickedBlock ? this.getEnhancedTableContext(view, editor, cmView, clickedBlock) : null;
    if (enhancedTableContext) {
      return enhancedTableContext;
    }
    if (clickedBlock) {
      try {
        const position = cmView.posAtDOM(clickedBlock, 0);
        const line = Math.max(0, cmView.state.doc.lineAt(position).number - 1);
        return {
          view,
          file: view.file,
          editor,
          cmView,
          blockEl: clickedBlock,
          line,
          kind: this.getBlockKind(editor, line),
        };
      } catch {
        // Fall through to cursor-based lookup when DOM position lookup is unavailable.
      }
    }

    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : null;
    const line = Math.max(0, cursor?.line ?? 0);
    const blockEl = this.findBlockElementForLine(view, cmView, line);

    if (!blockEl) return null;

    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line),
    };
  }

  private getOrdinaryToolbarContext(target: HTMLElement) {
    const context = this.getBlockContext(target);
    return this.shouldShowOrdinaryToolbarForContext(context) ? context : null;
  }

  private getCursorOrdinaryToolbarContext(target: HTMLElement) {
    const context = this.getCursorBlockContext(target);
    return this.shouldShowOrdinaryToolbarForContext(context) ? context : null;
  }

  private getDraggerToolbarContext(target: HTMLElement) {
    const handle = target.closest(DRAGGER_HANDLE_SELECTOR) as HTMLElement | null;
    if (!handle) return null;

    const line = Number.parseInt(handle.dataset.blockStart ?? "", 10);
    if (!Number.isFinite(line) || line < 0) return null;

    const view = this.getContainingMarkdownView(handle);
    if (!view?.file) return null;

    const editor = (view as any).editor;
    const cmView = editor?.cm;
    if (!editor || !cmView) return null;

    const blockEl = this.findBlockElementForLine(view, cmView, line);
    if (!blockEl) return null;

    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) return null;

    const context: BlockContext = {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line),
    };

    return this.shouldShowOrdinaryToolbarForContext(context) ? context : null;
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

  private isTableTarget(target: HTMLElement) {
    return this.isWithinTableElement(target);
  }

  private isLivePreviewTarget(target: HTMLElement, view: MarkdownView) {
    const contentEl = (view as any).contentEl;
    if (!(contentEl instanceof HTMLElement) || !contentEl.contains(target)) return false;
    return !!target.closest(".markdown-source-view, .cm-editor, .cm-content");
  }

  private findBlockElement(target: HTMLElement, view: MarkdownView) {
    const contentEl = (view as any).contentEl as HTMLElement | undefined;
    if (!contentEl) return null;

    for (const selector of ["table", "pre", "blockquote", ".callout"]) {
      const structuralBlock = target.closest(selector) as HTMLElement | null;
      if (structuralBlock && contentEl.contains(structuralBlock)) {
        return structuralBlock;
      }
    }

    const lineBlock = target.closest(
      [".HyperMD-header", ".HyperMD-list-line", ".HyperMD-quote", ".cm-line"].join(", ")
    ) as HTMLElement | null;

    if (!lineBlock || !contentEl.contains(lineBlock)) return null;
    return lineBlock;
  }

  private getEnhancedTableContext(
    view: MarkdownView,
    editor: any,
    cmView: any,
    blockEl: HTMLElement
  ): BlockContext | null {
    const tableEl = blockEl.closest("table.mdtp-table-shell") as HTMLTableElement | null;
    const tableId = tableEl?.dataset?.mdtpTableId?.trim();
    if (!tableEl || !tableId || !(view.contentEl instanceof HTMLElement) || !view.contentEl.contains(tableEl)) {
      return null;
    }

    const markerLine = this.findEnhancedTableMarkerLine(editor, tableId);
    if (markerLine === null) {
      return null;
    }

    const tableStartLine = this.findNextRenderableLine(editor, markerLine + 1);
    if (tableStartLine === null) {
      return null;
    }

    return {
      view,
      file: view.file!,
      editor,
      cmView,
      blockEl: tableEl,
      line: tableStartLine,
      kind: "table",
    };
  }

  private findEnhancedTableMarkerLine(editor: any, tableId: string) {
    const marker = `%% mdtp:${tableId} %%`;
    const lastLine = Math.max(0, editor.lineCount() - 1);
    for (let line = 0; line <= lastLine; line += 1) {
      if (String(editor.getLine(line) ?? "").trim() === marker) {
        return line;
      }
    }
    return null;
  }

  private findBlockElementForLine(view: MarkdownView, cmView: any, line: number) {
    const contentEl = (view as any).contentEl as HTMLElement | undefined;
    if (!contentEl) return null;

    const totalLines = Number(cmView?.state?.doc?.lines ?? 0);
    if (!totalLines) return null;

    const docLineNumber = Math.min(totalLines, Math.max(1, line + 1));
    const docLine = cmView.state.doc.line(docLineNumber);
    const positions = [docLine.from, Math.min(docLine.to, docLine.from + 1)];

    for (const pos of positions) {
      try {
        const domAtPos = cmView.domAtPos(pos);
        const node =
          domAtPos?.node instanceof HTMLElement
            ? domAtPos.node
            : domAtPos?.node?.parentElement instanceof HTMLElement
              ? domAtPos.node.parentElement
              : null;
        if (!node) continue;

        const block = this.findBlockElement(node, view);
        if (block && contentEl.contains(block)) {
          return block;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private renderHandle(context: BlockContext) {
    if (!this.handleEl) return;
    if (!this.shouldShowOrdinaryToolbarForContext(context)) {
      this.hideToolbar(true);
      return;
    }

    const draggerHandle = this.findDraggerHandleForContext(context);
    const rect = context.blockEl.getBoundingClientRect();
    if (draggerHandle) {
      const draggerRect = draggerHandle.getBoundingClientRect();
      const top = Math.max(64, draggerRect.top + Math.max(0, (draggerRect.height - COMPACT_HANDLE_SIZE) / 2));
      const left = Math.max(8, draggerRect.left - COMPACT_HANDLE_SIZE - 3);
      this.handleEl.dataset.fdtbIntegrated = "dragger";
      this.handleEl.style.left = `${left}px`;
      this.handleEl.style.top = `${top}px`;
      this.handleEl.style.display = "flex";
      return;
    }

    const top = Math.max(64, rect.top + Math.min(8, Math.max(0, (rect.height - HANDLE_SIZE) / 2)));
    const left = Math.max(12, rect.left - HANDLE_OFFSET);

    delete this.handleEl.dataset.fdtbIntegrated;
    this.handleEl.style.left = `${left}px`;
    this.handleEl.style.top = `${top}px`;
    this.handleEl.style.display = "flex";
  }

  private findDraggerHandleForContext(context: BlockContext) {
    const contentEl = (context.view as any)?.contentEl as HTMLElement | undefined;
    if (!(contentEl instanceof HTMLElement)) return null;

    const handles = Array.from(contentEl.querySelectorAll(DRAGGER_HANDLE_SELECTOR)) as HTMLElement[];
    for (const handle of handles) {
      if (handle.classList.contains("dnd-hidden")) continue;
      const start = Number.parseInt(handle.dataset.blockStart ?? "", 10);
      const end = Number.parseInt(handle.dataset.blockEnd ?? handle.dataset.blockStart ?? "", 10);
      if (!Number.isFinite(start)) continue;
      const safeEnd = Number.isFinite(end) ? end : start;
      if (context.line >= start && context.line <= safeEnd) {
        return handle;
      }
    }

    return null;
  }

  private togglePopover() {
    if (!this.handleEl) return;
    const preferredContext = this.getPreferredToolbarContext();
    if (preferredContext) {
      this.activeContext = preferredContext;
      this.renderHandle(preferredContext);
    }
    if (!this.shouldShowOrdinaryToolbarForContext(this.activeContext)) {
      this.hideToolbar(true);
      return;
    }
    if (this.popoverEl) {
      this.hidePopover();
      return;
    }
    this.showPopover(this.activeContext);
  }

  private getPreferredToolbarContext() {
    const fallbackContext = this.shouldShowOrdinaryToolbarForContext(this.activeContext) ? this.activeContext : null;
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeView?.file || !(activeView.contentEl instanceof HTMLElement) || !activeElement) {
      return fallbackContext;
    }

    const tableBlock = activeElement.closest("table") as HTMLElement | null;
    if (!tableBlock || !activeView.contentEl.contains(tableBlock)) {
      return fallbackContext;
    }

    return null;
  }


  private showInsertPanel(context: BlockContext) {
    if (!this.shouldShowOrdinaryToolbarForContext(context)) {
      this.hideToolbar(true);
      return;
    }
    this.hidePopover();

    const popover = document.createElement('div');
    popover.className = 'fdtb-popover fdtb-insert-panel';
    popover.addEventListener('pointerenter', () => this.clearHideTimer());
    popover.addEventListener('pointerleave', () => this.clearHideTimer());

    const quickGroups = this.getStableQuickActionGroupsForContext(context.kind);
    if (quickGroups.length > 0) {
      this.appendPopoverSection(popover, this.createPopoverSection("", quickGroups));
    }

    document.body.appendChild(popover);
    this.popoverEl = popover;
    this.positionPopover(context);
  }

  private showPopover(context: BlockContext) {
    if (!this.shouldShowOrdinaryToolbarForContext(context)) {
      this.hideToolbar(true);
      return;
    }
    this.hidePopover();

    const popover = document.createElement("div");
    popover.className = "fdtb-popover";
    popover.addEventListener("pointerenter", () => this.clearHideTimer());
    popover.addEventListener("pointerleave", () => this.clearHideTimer());

    const quickGroups = this.getStableQuickActionGroupsForContext(context.kind);
    if (quickGroups.length > 0) {
      this.appendPopoverSection(popover, this.createPopoverSection("", quickGroups));
    }

    const experimentalStyleGroups = this.getExperimentalStyleActionGroupsForContext(context.kind);
    const experimentalColorActions = this.getExperimentalColorActionsForContext(context.kind);
    if (experimentalStyleGroups.length > 0 || experimentalColorActions.length > 0) {
      this.appendPopoverSection(
        popover,
        this.createPopoverSection(
          "实验样式",
          experimentalStyleGroups,
          experimentalColorActions.length > 0 ? this.createColorActionGroup("颜色", experimentalColorActions) : undefined
        )
      );
    }

    const utilityGroups = this.getStableUtilityActionGroups();
    if (utilityGroups.length > 0) {
      this.appendPopoverSection(popover, this.createPopoverSection("", utilityGroups));
    }

    document.body.appendChild(popover);
    this.popoverEl = popover;
    this.positionPopover(context);
  }

  getStableQuickActionGroupsForContext(kind: BlockKind): ToolbarActionGroup[] {
    return this.applyToolbarActionOrder(this.getDefaultStableQuickActionGroupsForContext(kind));
  }

  private getDefaultStableQuickActionGroupsForContext(kind: BlockKind): ToolbarActionGroup[] {
    if (!this.isTransformableBlockKind(kind)) {
      return [];
    }

    return [
      {
        label: "排版",
        layout: "formatGrid",
        items: [
          { action: "heading1", label: "H1" },
          { action: "heading2", label: "H2" },
          { action: "heading3", label: "H3" },
          { action: "heading4", label: "H4" },
          { action: "italic", label: "斜体" },
          { action: "strikethrough", label: "删除线" },
          { action: "bullet", label: "•" },
          { action: "numbered", label: "1." },
          { action: "todo", label: "☑" },
          { action: "code", label: "{ }" },
          { action: "quote", label: "❝" },
          { action: "highlightText", label: "高" },
          { action: "commandPalette", label: "命令" },
          { action: "divider", label: "—" },
        ],
      },
      {
        label: "插入内容",
        layout: "insertMixed",
        items: [
          { action: "tableMenu", label: "表格" },
          { action: "calloutNote", label: "高亮块" },
          { action: "insertImage", label: "图片" },
          { action: "insertFile", label: "文件" },
          { action: "templateMenu", label: "模板库" },
          { action: "calloutFold", label: "折叠" },
          { action: "insertDate", label: "日期" },
          { action: "insertLink", label: "链接" },
        ],
      },
    ];
  }

  getStableQuickActionsForContext(kind: BlockKind): ToolbarActionItem[] {
    return this.getStableQuickActionGroupsForContext(kind).flatMap((group) => group.items);
  }

  getStableUtilityActionGroups(): ToolbarActionGroup[] {
    return [];
  }

  getStableUtilityActions(): ToolbarActionItem[] {
    return this.getStableUtilityActionGroups().flatMap((group) => group.items);
  }

  getStableStyleActionGroupsForContext(kind: BlockKind): ToolbarActionGroup[] {
    return [];
  }

  getStableStyleActionsForContext(kind: BlockKind): ToolbarActionItem[] {
    return this.getStableStyleActionGroupsForContext(kind).flatMap((group) => group.items);
  }

  getStableColorActionsForContext(kind: BlockKind) {
    return [];
  }

  getExperimentalStyleActionGroupsForContext(kind: BlockKind): ToolbarActionGroup[] {
    if (!this.canUseExperimentalOrdinaryStyles(kind)) {
      return [];
    }

    return EXPERIMENTAL_STYLE_GROUPS;
  }

  getExperimentalColorActionsForContext(kind: BlockKind) {
    return [];
  }

  private isTransformableBlockKind(kind: BlockKind) {
    return kind === "paragraph" || kind === "heading" || kind === "listItem";
  }

  private canUseExperimentalOrdinaryStyles(kind: BlockKind) {
    return this.isExperimentalFeatureEnabled() && this.isTransformableBlockKind(kind);
  }

  private isExperimentalStyleAction(action: BlockAction) {
    return EXPERIMENTAL_STYLE_ACTIONS.has(action);
  }

  private getColorValue(action: BlockAction): NonNullable<InlineStyleState["color"]> | null {
    if (!(action in COLOR_ACTION_TO_VALUE)) {
      return null;
    }
    return COLOR_ACTION_TO_VALUE[action as keyof typeof COLOR_ACTION_TO_VALUE];
  }

  private isExperimentalFeatureEnabled() {
    return this.isBetaFeaturesEnabled();
  }

  private isOrdinaryToolbarBlockKind(kind: BlockKind) {
    return kind === "paragraph" || kind === "heading" || kind === "listItem" || kind === "quote" || kind === "callout" || kind === "codeFence";
  }

  private isWithinTableElement(element: HTMLElement | null) {
    return !!element?.closest("table");
  }

  private shouldShowOrdinaryToolbarForContext(context: BlockContext | null): context is BlockContext {
    if (!context || !this.isOrdinaryToolbarBlockKind(context.kind)) {
      return false;
    }

    const contentEl = (context.view as any)?.contentEl;
    if (!(contentEl instanceof HTMLElement) || !(context.blockEl instanceof HTMLElement) || !context.blockEl.isConnected) {
      return false;
    }

    if (!contentEl.contains(context.blockEl)) {
      return false;
    }

    return !this.isWithinTableElement(context.blockEl);
  }

  private positionPopover(context: BlockContext) {
    if (!this.popoverEl || !this.handleEl) return;

    const anchorRect = this.handleEl.getBoundingClientRect();
    const fallbackRect = context.blockEl.getBoundingClientRect();
    const rect = anchorRect.width > 0 && anchorRect.height > 0 ? anchorRect : fallbackRect;
    const desiredTop = Math.max(72, rect.top - 8);
    const desiredLeft = Math.min(window.innerWidth - 292, rect.right + 8);
    this.popoverEl.style.top = `${desiredTop}px`;
    this.popoverEl.style.left = `${Math.max(16, desiredLeft)}px`;
  }

  private createActionButton(label: string, action: BlockAction, layout?: ToolbarActionGroup["layout"], isSortableMode = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fdtb-action";
    const title = this.getActionDisplayTitle(action, label);
    button.title = title;
    button.setAttribute("aria-label", title);
    button.dataset.fdtbTooltip = title;
    if (layout === "formatGrid") {
      button.classList.add("fdtb-action-icon");
    }
    if (layout === "insertMixed") {
      button.classList.add("fdtb-action-text");
    }
    if (layout === "utility") {
      button.classList.add("fdtb-action-text");
      if (action === "copyImage") {
        button.classList.add("fdtb-action-primary");
      } else {
        button.classList.add("fdtb-action-secondary");
      }
    }
    this.appendActionButtonContent(button, label, action, layout);
    if (action === "insertFile") {
      button.classList.add("fdtb-action-file");
    }
    if (action === "tableMenu" || action === "templateMenu") {
      button.classList.add("fdtb-action-menu");
    }
    
    if (isSortableMode) {
      button.style.cursor = "grab";
      button.dataset.action = action;
    } else {
      this.bindActionTrigger(button, action);
    }
    return button;
  }

  private createWideActionButton(label: string, action: BlockAction, isSortableMode = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fdtb-action fdtb-action-wide";
    const text = document.createElement("span");
    text.className = "fdtb-action-label";
    text.textContent = label;
    button.appendChild(text);
    const title = this.getActionDisplayTitle(action, label);
    button.title = title;
    button.setAttribute("aria-label", title);
    button.dataset.fdtbTooltip = title;
    
    if (isSortableMode) {
      button.style.cursor = "grab";
      button.dataset.action = action;
    } else {
      this.bindActionTrigger(button, action);
    }
    return button;
  }

  getActionShortcutHint(action: BlockAction) {
    return ACTION_MARKDOWN_HINTS[action] ?? null;
  }

  private getActionDisplayTitle(action: BlockAction, fallbackLabel: string) {
    const title = ACTION_TITLES[action] ?? fallbackLabel;
    const shortcut = this.getActionShortcutHint(action);
    return shortcut ? `${title} ${shortcut}` : title;
  }

  private appendActionButtonContent(button: HTMLButtonElement, label: string, action: BlockAction, layout?: ToolbarActionGroup["layout"]) {
    const headingMatch = /^H([1-4])$/.exec(label);
    if (layout === "formatGrid" && headingMatch) {
      const mark = document.createElement("span");
      mark.className = "fdtb-heading-mark";
      const h = document.createElement("b");
      h.textContent = "H";
      const tag = document.createElement("span");
      tag.className = "fdtb-heading-level";
      tag.textContent = headingMatch[1];
      mark.appendChild(h);
      mark.appendChild(tag);
      button.appendChild(mark);
      return;
    }

    const icon = ACTION_ICONS[action];
    if (icon && (layout === "formatGrid" || layout === "insertMixed")) {
      const iconEl = document.createElement("span");
      iconEl.className = "fdtb-action-svg";
      iconEl.innerHTML = icon;
      button.appendChild(iconEl);
    }

    if (layout === "formatGrid" && icon) return;

    if (layout !== "formatGrid" || !icon) {
      const text = document.createElement("span");
      text.className = "fdtb-action-label";
      text.textContent = label;
      button.appendChild(text);
    }
  }

  private createPopoverDivider() {
    const divider = document.createElement("div");
    divider.className = "fdtb-divider";
    return divider;
  }

  private createColorActionButton(label: string, color: string, action: BlockAction) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fdtb-action fdtb-action-wide fdtb-action-color-wide";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.dataset.fdtbTooltip = label;

    const swatch = document.createElement("span");
    swatch.className = "fdtb-color-swatch";
    swatch.style.setProperty("--fdtb-swatch-color", color);
    button.appendChild(swatch);

    const text = document.createElement("span");
    text.className = "fdtb-color-label";
    text.textContent = label;
    button.appendChild(text);

    this.bindActionTrigger(button, action);
    return button;
  }

  private createSectionTitle(label: string) {
    const title = document.createElement("div");
    title.className = "fdtb-section-title";
    title.textContent = label;
    return title;
  }

  private createGroupLabel(label: string) {
    const title = document.createElement("div");
    title.className = "fdtb-section-title";
    title.textContent = label;
    return title;
  }

  private createPopoverSection(title: string, groups: ToolbarActionGroup[], extraGroup?: HTMLElement) {
    const section = document.createElement("section");
    section.className = "fdtb-section";

    if (title) {
      const sectionTitle = this.createSectionTitle(title);
      section.appendChild(sectionTitle);
    }

    groups.forEach((group, index) => {
      if (index > 0) {
        section.appendChild(this.createPopoverDivider());
      }
      section.appendChild(this.createActionGroup(group));
    });

    if (extraGroup) {
      section.appendChild(extraGroup);
    }

    return section;
  }

  private appendPopoverSection(popover: HTMLElement, section: HTMLElement) {
    if (popover.childElementCount > 0) {
      popover.appendChild(this.createPopoverDivider());
    }
    popover.appendChild(section);
  }

  private createActionGroup(group: ToolbarActionGroup, sortable?: SortableToolbarGroupOptions) {
    const groupEl = document.createElement("div");
    groupEl.className = "fdtb-group";

    if (group.label) {
      groupEl.appendChild(this.createGroupLabel(group.label));
    }

    const row = document.createElement("div");
    row.className = "fdtb-row";
    if (group.layout === "formatGrid") {
      row.classList.add("fdtb-row-format");
    } else if (group.layout === "insertMixed") {
      row.classList.add("fdtb-row-insert");
    } else if (group.layout === "utility") {
      row.classList.add("fdtb-row-utility");
    } else if (group.wide) {
      row.classList.add("fdtb-row-utility");
    }

    const isSortable = !!sortable?.sortable;
    for (const item of group.items) {
      row.appendChild(
        group.wide
          ? this.createWideActionButton(item.label, item.action, isSortable)
          : this.createActionButton(item.label, item.action, group.layout, isSortable)
      );
    }

    if (sortable?.sortable) {
      this.attachSortableToolbarRow(row, group.items, sortable.onReorder);
    }

    groupEl.appendChild(row);
    return groupEl;
  }

  private attachSortableToolbarRow(
    row: HTMLElement,
    items: ToolbarActionItem[],
    onReorder: () => void | Promise<void>
  ) {
    let draggingAction: BlockAction | null = null;
    let longPressTimer: number | null = null;

    const clearLongPressTimer = () => {
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>(".fdtb-action"));
    buttons.forEach((button, index) => {
      const item = items[index];
      if (!item) return;
      button.dataset.action = item.action;
      const action = item.action;

      button.draggable = true;

      button.addEventListener("pointerdown", () => {
        clearLongPressTimer();
        longPressTimer = window.setTimeout(() => {
          button.classList.add("is-long-press-ready");
        }, 240);
      });
      button.addEventListener("pointerup", () => {
        clearLongPressTimer();
        button.classList.remove("is-long-press-ready");
      });
      button.addEventListener("pointerleave", () => {
        clearLongPressTimer();
        button.classList.remove("is-long-press-ready");
      });
      button.addEventListener("dragstart", (event) => {
        draggingAction = action;
        button.classList.add("is-dragging");
        event.dataTransfer?.setData("text/plain", action);
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
        }
        event.dataTransfer?.setDragImage(button, Math.min(32, button.clientWidth / 2), 16);
      });
      button.addEventListener("dragend", () => {
        draggingAction = null;
        button.classList.remove("is-dragging", "is-long-press-ready");
        row.querySelectorAll(".is-drag-over").forEach((el) => el.classList.remove("is-drag-over"));
      });
      button.addEventListener("dragover", (event) => {
        if (!draggingAction || draggingAction === action) return;
        event.preventDefault();
        button.classList.add("is-drag-over");
      });
      button.addEventListener("dragleave", () => {
        button.classList.remove("is-drag-over");
      });
      button.addEventListener("drop", async (event) => {
        event.preventDefault();
        button.classList.remove("is-drag-over");
        const sourceAction = (event.dataTransfer?.getData("text/plain") || draggingAction) as BlockAction | null;
        if (!sourceAction || sourceAction === action) return;
        const moved = await this.moveToolbarAction(sourceAction, action, { keepPopover: true });
        if (moved) {
          await onReorder();
        }
      });
    });
  }

  private createColorActionGroup(label: string, presets = COLOR_PRESETS) {
    const groupEl = document.createElement("div");
    groupEl.style.display = "flex";
    groupEl.style.flexDirection = "column";
    groupEl.style.gap = "6px";
    groupEl.appendChild(this.createGroupLabel(label));

    const row = document.createElement("div");
    row.className = "fdtb-row";
    row.classList.add("fdtb-row-utility");
    row.classList.add("fdtb-row-color-grid");
    row.style.alignItems = "stretch";
    row.style.gap = "8px";

    for (const preset of presets) {
      row.appendChild(this.createColorActionButton(preset.label, preset.color, preset.action));
    }
    groupEl.appendChild(row);
    return groupEl;
  }

  private bindActionTrigger(button: HTMLButtonElement, action: BlockAction) {
    let fired = false;
    const invoke = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if (fired) return;
      fired = true;
      window.setTimeout(() => {
        fired = false;
      }, 0);
      void this.runAction(action);
    };

    button.addEventListener("pointerdown", invoke);
    button.addEventListener("click", invoke);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        invoke(event);
      }
    });
  }

  private async runAction(action: BlockAction) {
    const baseContext = this.activeContext;
    if (!baseContext) return;

    const context = this.resolveActionContext(baseContext);
    this.activeContext = context;
    this.consumeSlashTrigger(context);

    if (this.isExperimentalStyleAction(action) && !this.canUseExperimentalOrdinaryStyles(context.kind)) {
      this.hidePopover();
      return;
    }

    if (action === "copyImage") {
      this.hidePopover();
      await this.copyBlockAsImage(context);
      return;
    }

    if (action === "tableMenu") {
      await this.showTableMenu(context);
      return;
    }

    if (action === "templateMenu") {
      await this.showTemplateMenu(context);
      return;
    }

    if (action === "insertImage" || action === "insertFile") {
      this.hidePopover();
      await this.insertAttachmentIntoContext(context, action === "insertImage" ? "image" : "file");
      return;
    }

    if (action === "highlightText") {
      this.toggleMarkdownHighlight(context);
      this.hidePopover();
      return;
    }

    if (action === "italic" || action === "strikethrough") {
      this.toggleInlineMarkdownWrap(context, action === "italic" ? "*" : "~~");
      this.hidePopover();
      return;
    }

    if (action === "calloutNote" || action === "calloutFold") {
      this.convertBlockToCallout(context, action === "calloutFold");
      this.hidePopover();
      return;
    }

    if (action === "insertDate") {
      this.insertDateBelow(context);
      this.hidePopover();
      return;
    }

    if (action === "insertLink") {
      this.insertLinkAtCursor(context);
      this.hidePopover();
      return;
    }

    if (action === "commandPalette") {
      this.hidePopover();
      this.openObsidianCommandPalette();
      return;
    }

    if (action === "copyMarkdown") {
      this.hidePopover();
      await this.copyBlockMarkdown(context);
      return;
    }

    if (action === "duplicateBelow") {
      this.duplicateBelow(context);
      this.hidePopover();
      return;
    }

    if (action === "moveUp" || action === "moveDown") {
      this.moveBlock(context, action === "moveUp" ? "up" : "down");
      this.hidePopover();
      return;
    }

    if (action === "insertBelow") {
      this.insertBelow(context);
      this.hidePopover();
      return;
    }

    if (action === "code") {
      this.wrapCurrentBlockWithCodeFence(context);
      this.hidePopover();
      return;
    }

    if (action === "divider") {
      this.convertBlockToDivider(context);
      this.hidePopover();
      return;
    }

    if (action === "indentMore" || action === "indentLess") {
      this.adjustBlockIndent(this.activateEditorContext(context), action === "indentMore" ? 2 : -2);
      this.hidePopover();
      return;
    }

    if (action === "alignLeft" || action === "alignCenter" || action === "alignRight") {
      this.applyInlineStyleAction(this.activateEditorContext(context), {
        align: action === "alignLeft" ? null : action === "alignCenter" ? "center" : "right",
      });
      this.hidePopover();
      return;
    }

    const color = this.getColorValue(action);
    if (color || action === "clearStyle") {
      this.applyInlineStyleAction(this.activateEditorContext(context), {
        color: action === "clearStyle" ? null : color,
        clearAll: action === "clearStyle",
      });
      this.hidePopover();
      return;
    }

    this.applyLineTransform(context, action);
    this.hidePopover();
  }

  private consumeSlashTrigger(context: BlockContext) {
    if (!this.slashTrigger) return;
    if (context.file.path !== this.slashTrigger.filePath || context.line !== this.slashTrigger.line) return;
    const currentLine = String(context.editor.getLine(context.line) ?? "");
    if (currentLine.trim() === "/") {
      context.editor.replaceRange("", { line: context.line, ch: 0 }, { line: context.line, ch: currentLine.length });
    }
    this.slashTrigger = null;
  }

  private activateEditorContext(context: BlockContext) {
    let nextContext = this.resolveActionContext(context);
    const { editor } = nextContext;
    const range = this.getLogicalBlockRange(editor, nextContext.line);

    if (typeof editor.focus === "function") {
      try {
        editor.focus();
      } catch {
        // Ignore focus errors from editor wrappers that do not expose a stable focus target.
      }
    }

    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line: range.startLine, ch: 0 });
      nextContext = this.resolveActionContext({
        ...nextContext,
        line: range.startLine,
      });
    }

    return nextContext;
  }

  private resolveActionContext(context: BlockContext): BlockContext {
    const { view, file, editor, cmView } = context;
    let blockEl = context.blockEl;
    let line = context.line;

    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) {
      return enhancedTableContext;
    }

    if (blockEl.isConnected) {
      try {
        const position = cmView.posAtDOM(blockEl, 0);
        line = Math.max(0, cmView.state.doc.lineAt(position).number - 1);
      } catch {
        // Fall back to the stored line if the DOM position cannot be resolved.
      }
    }

    const refreshedBlockEl =
      this.findBlockElementForLine(view, cmView, line) ??
      (blockEl.isConnected ? blockEl : null);
    if (refreshedBlockEl) {
      blockEl = refreshedBlockEl;
    }

    return {
      view,
      file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line),
    };
  }

  private applyLineTransform(context: BlockContext, action: Exclude<BlockAction, "code" | "insertBelow" | "copyImage">) {
    const { editor, line } = context;
    const selectedRange = this.getSelectedLineRange(editor);
    if (selectedRange) {
      const lines = this.readBlockLines(editor, selectedRange.startLine, selectedRange.endLine);
      let orderedIndex = 1;
      const nextLines = lines.map((current) => {
        if (!current.trim()) return current;
        const next = this.buildFormattedLine(
          current,
          action,
          action === "numbered" ? orderedIndex : undefined
        );
        if (action === "numbered") orderedIndex += 1;
        return next;
      });
      const replacement = nextLines.join("\n");
      if (replacement === lines.join("\n")) return;
      this.replaceBlockRange(editor, selectedRange.startLine, selectedRange.endLine, replacement);
      editor.setCursor({ line: selectedRange.startLine, ch: nextLines[0]?.length ?? 0 });
      this.scheduleStyleRefresh();
      return;
    }

    const currentLine = String(editor.getLine(line) ?? "");
    const nextLine = this.buildFormattedLine(currentLine, action);
    if (nextLine === currentLine) return;

    editor.replaceRange(
      nextLine,
      { line, ch: 0 },
      { line, ch: currentLine.length }
    );
    editor.setCursor({ line, ch: nextLine.length });
  }

  private buildFormattedLine(
    line: string,
    action: Exclude<BlockAction, "code" | "insertBelow" | "copyImage">,
    orderedIndex = 1
  ) {
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch?.[0] ?? "";
    const raw = line.trimStart();
    const content = this.stripBlockPrefix(raw);

    switch (action) {
      case "paragraph":
        return `${indent}${content}`;
      case "heading1":
        return `${indent}# ${content}`;
      case "heading2":
        return `${indent}## ${content}`;
      case "heading3":
        return `${indent}### ${content}`;
      case "heading4":
        return `${indent}#### ${content}`;
      case "bullet":
        return `${indent}- ${content}`;
      case "numbered":
        return `${indent}${Math.max(1, orderedIndex)}. ${content}`;
      case "todo":
        return `${indent}- [ ] ${content}`;
      case "quote":
        return `${indent}> ${content}`;
      default:
        return line;
    }
  }

  private stripBlockPrefix(line: string) {
    return line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^[-*+]\s+\[[ xX]\]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/^[-*+]\s+/, "")
      .replace(/^>\s+/, "")
      .trim();
  }

  private getSelectedLineRange(editor: any) {
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (!selected) return null;

    const from = this.getEditorCursorPosition(editor, "from");
    const to = this.getEditorCursorPosition(editor, "to");
    if (!from || !to) return null;

    let startLine = Math.min(from.line, to.line);
    let endLine = Math.max(from.line, to.line);
    const endCursor = from.line <= to.line ? to : from;
    if (endCursor.ch === 0 && endLine > startLine) {
      endLine -= 1;
    }

    const lastLine = Math.max(0, Number(editor.lineCount?.() ?? endLine + 1) - 1);
    startLine = Math.max(0, Math.min(startLine, lastLine));
    endLine = Math.max(0, Math.min(endLine, lastLine));
    if (endLine < startLine) return null;
    return { startLine, endLine };
  }

  private getEditorCursorPosition(editor: any, which: "from" | "to") {
    try {
      if (typeof editor.getCursor === "function") {
        const cursor = editor.getCursor(which);
        if (this.isEditorPosition(cursor)) return cursor;
      }
    } catch {
      // Some editor shims only support getCursor() without a side argument.
    }

    const selection = editor?.selection;
    const cursor = selection?.[which];
    return this.isEditorPosition(cursor) ? cursor : null;
  }

  private isEditorPosition(value: any): value is { line: number; ch: number } {
    return Number.isFinite(value?.line) && Number.isFinite(value?.ch);
  }

  private adjustBlockIndent(context: BlockContext, delta: number) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    const nextLines = lines.map((line) => {
      if (!line.trim()) return line;
      if (delta > 0) return `${" ".repeat(delta)}${line}`;
      return line.replace(new RegExp(`^ {1,${Math.abs(delta)}}`), "");
    });
    const replacement = nextLines.join("\n");
    if (replacement === lines.join("\n")) return;
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, replacement);
    context.editor.setCursor({ line: range.startLine, ch: 0 });
    this.scheduleStyleRefresh();
  }

  private applyInlineStyleAction(
    context: BlockContext,
    patch: {
      align?: InlineStyleState["align"];
      color?: InlineStyleState["color"];
      clearAll?: boolean;
    }
  ) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const markerInfo = this.getStyleMarkerInfo(context.editor, range.startLine);
    const currentStyle = markerInfo?.style ?? this.normalizeInlineStyle({});
    const nextStyle = this.normalizeInlineStyle({
      align: patch.clearAll ? null : patch.align !== undefined ? patch.align : currentStyle.align,
      color: patch.clearAll ? null : patch.color !== undefined ? patch.color : currentStyle.color,
    });
    const hasStyle = !!nextStyle.align || !!nextStyle.color;

    if (markerInfo) {
      const currentMarkerLine = String(context.editor.getLine(markerInfo.line) ?? "");
      if (hasStyle) {
        const nextMarkerLine = this.formatStyleMarker(nextStyle);
        if (nextMarkerLine !== currentMarkerLine) {
          context.editor.replaceRange(
            nextMarkerLine,
            { line: markerInfo.line, ch: 0 },
            { line: markerInfo.line, ch: currentMarkerLine.length }
          );
        }
      } else {
        const deleteTo =
          markerInfo.line < context.editor.lineCount() - 1
            ? { line: markerInfo.line + 1, ch: 0 }
            : { line: markerInfo.line, ch: currentMarkerLine.length };
        context.editor.replaceRange("", { line: markerInfo.line, ch: 0 }, deleteTo);
      }
    } else if (hasStyle) {
      context.editor.replaceRange(`${this.formatStyleMarker(nextStyle)}\n`, { line: range.startLine, ch: 0 });
    } else {
      return;
    }

    const cursorDelta = markerInfo ? (hasStyle ? 0 : -1) : hasStyle ? 1 : 0;
    context.editor.setCursor({ line: Math.max(0, context.line + cursorDelta), ch: 0 });
    this.scheduleStyleRefresh();
  }

  private normalizeInlineStyle(style: Partial<InlineStyleState>): InlineStyleState {
    return {
      align: style.align ?? null,
      color: style.color ?? null,
    };
  }

  private parseStyleMarkerLine(line: string): InlineStyleState | null {
    const match = String(line ?? "").match(STYLE_MARKER_RE);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1]);
      return this.normalizeInlineStyle({
        align: parsed?.align === "center" || parsed?.align === "right" ? parsed.align : null,
        color:
          parsed?.color === "yellow" ||
          parsed?.color === "blue" ||
          parsed?.color === "green" ||
          parsed?.color === "red" ||
          parsed?.color === "purple" ||
          parsed?.color === "gray"
            ? parsed.color
            : null,
      });
    } catch {
      return null;
    }
  }

  private formatStyleMarker(style: InlineStyleState) {
    const payload: Record<string, string> = {};
    if (style.align) payload.align = style.align;
    if (style.color) payload.color = style.color;
    return `%% fdtb-style:${JSON.stringify(payload)} %%`;
  }

  private getStyleMarkerInfo(editor: any, blockStartLine: number) {
    if (blockStartLine <= 0) return null;
    const markerLine = blockStartLine - 1;
    const style = this.parseStyleMarkerLine(String(editor.getLine(markerLine) ?? ""));
    if (!style) return null;
    return {
      line: markerLine,
      style,
    };
  }

  private scheduleStyleRefresh() {
    if (this.styleRefreshTimer !== null) {
      window.clearTimeout(this.styleRefreshTimer);
    }
    this.styleRefreshTimer = window.setTimeout(() => {
      this.styleRefreshTimer = null;
      this.refreshVisibleBlockStyles();
    }, 0);
  }

  private refreshVisibleBlockStyles() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) continue;
      const contentEl = (view as any).contentEl;
      if (!(contentEl instanceof HTMLElement)) continue;

      this.clearStyledArtifacts(contentEl);

      const editor = (view as any).editor;
      const cmView = editor?.cm;
      const totalLines = Number(cmView?.state?.doc?.lines ?? 0);
      if (!editor || !cmView || !totalLines) continue;

      for (let line = 0; line < totalLines; line += 1) {
        const style = this.parseStyleMarkerLine(String(editor.getLine(line) ?? ""));
        if (!style) continue;

        this.hideVisibleStyleMarkerLine(view, cmView, line);
        const nextRenderableLine = this.findNextRenderableLine(editor, line + 1);
        if (nextRenderableLine === null) continue;

        const range = this.getLogicalBlockRange(editor, nextRenderableLine);
        for (let styledLine = range.startLine; styledLine <= range.endLine; styledLine += 1) {
          const blockEl = this.findBlockElementForLine(view, cmView, styledLine);
          if (!blockEl) continue;
          this.applyBlockStyleClasses(blockEl, style);
        }

        line = Math.max(line, range.endLine);
      }
    }
  }

  private findNextRenderableLine(editor: any, startLine: number) {
    const lastLine = Math.max(0, editor.lineCount() - 1);
    for (let line = Math.max(0, startLine); line <= lastLine; line += 1) {
      const current = String(editor.getLine(line) ?? "");
      if (!current.trim() || this.isStyleMarkerLine(current)) continue;
      return line;
    }
    return null;
  }

  private clearStyledArtifacts(root: HTMLElement) {
    const styleClasses = [
      "fdtb-block-style",
      "fdtb-style-marker-line",
      "fdtb-align-center",
      "fdtb-align-right",
      "fdtb-bg-yellow",
      "fdtb-bg-blue",
      "fdtb-bg-green",
      "fdtb-bg-red",
      "fdtb-bg-purple",
      "fdtb-bg-gray",
    ];

    root.querySelectorAll<HTMLElement>("[data-fdtb-style-applied='true'], [data-fdtb-style-marker-hidden='true']").forEach((element) => {
      element.removeAttribute("data-fdtb-style-applied");
      element.removeAttribute("data-fdtb-style-marker-hidden");
      element.classList.remove(...styleClasses);
    });
  }

  private clearAllStyledArtifacts() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) continue;
      const contentEl = (view as any).contentEl;
      if (contentEl instanceof HTMLElement) {
        this.clearStyledArtifacts(contentEl);
      }
    }
  }

  private hideVisibleStyleMarkerLine(view: MarkdownView, cmView: any, line: number) {
    const markerEl = this.findBlockElementForLine(view, cmView, line);
    if (!markerEl) return;
    markerEl.classList.add("fdtb-style-marker-line");
    markerEl.setAttribute("data-fdtb-style-marker-hidden", "true");
  }

  private applyBlockStyleClasses(blockEl: HTMLElement, style: InlineStyleState) {
    blockEl.classList.add("fdtb-block-style");
    if (style.align === "center") blockEl.classList.add("fdtb-align-center");
    if (style.align === "right") blockEl.classList.add("fdtb-align-right");
    if (style.color === "yellow") blockEl.classList.add("fdtb-bg-yellow");
    if (style.color === "blue") blockEl.classList.add("fdtb-bg-blue");
    if (style.color === "green") blockEl.classList.add("fdtb-bg-green");
    if (style.color === "red") blockEl.classList.add("fdtb-bg-red");
    if (style.color === "purple") blockEl.classList.add("fdtb-bg-purple");
    if (style.color === "gray") blockEl.classList.add("fdtb-bg-gray");
    blockEl.setAttribute("data-fdtb-style-applied", "true");
  }

  private buildStyledLine(
    line: string,
    patch: {
      align?: InlineStyleState["align"];
      color?: InlineStyleState["color"];
      clearAll?: boolean;
    }
  ) {
    if (!line.trim() || /^\s*```/.test(line) || this.isTableLine(line)) {
      return line;
    }

    const { indent, prefix, content } = this.splitLinePrefixAndContent(line);
    const currentStyle = this.parseInlineStyle(content);
    const nextStyle: InlineStyleState = {
      align: patch.clearAll ? null : patch.align !== undefined ? patch.align : currentStyle.align,
      color: patch.clearAll ? null : patch.color !== undefined ? patch.color : currentStyle.color,
    };
    const nextContent = this.composeInlineStyle(currentStyle.content, nextStyle);
    return `${indent}${prefix}${nextContent}`;
  }

  private splitLinePrefixAndContent(line: string) {
    const indent = line.match(/^\s*/)?.[0] ?? "";
    const raw = line.slice(indent.length);
    const prefixes = [
      /^#{1,6}\s+/,
      /^[-*+]\s+\[[ xX]\]\s+/,
      /^\d+\.\s+/,
      /^[-*+]\s+/,
      /^>\s+/,
    ];

    for (const pattern of prefixes) {
      const match = raw.match(pattern);
      if (match) {
        return {
          indent,
          prefix: match[0],
          content: raw.slice(match[0].length),
        };
      }
    }

    return {
      indent,
      prefix: "",
      content: raw,
    };
  }

  private parseInlineStyle(content: string) {
    const trimmed = content.trim();
    const match = trimmed.match(/^<span class="([^"]*\bfdtb-inline-style\b[^"]*)">([\s\S]*)<\/span>$/);
    if (!match) {
      return {
        content,
        align: null,
        color: null,
      } satisfies { content: string } & InlineStyleState;
    }

    const classes = match[1].split(/\s+/).filter(Boolean);
    return {
      content: match[2],
      align: classes.includes("fdtb-align-center") ? "center" : classes.includes("fdtb-align-right") ? "right" : null,
      color: classes.includes("fdtb-bg-yellow")
        ? "yellow"
        : classes.includes("fdtb-bg-blue")
          ? "blue"
          : classes.includes("fdtb-bg-green")
            ? "green"
            : classes.includes("fdtb-bg-red")
              ? "red"
              : classes.includes("fdtb-bg-purple")
                ? "purple"
                : classes.includes("fdtb-bg-gray")
                  ? "gray"
            : null,
    } satisfies { content: string } & InlineStyleState;
  }

  private composeInlineStyle(content: string, style: InlineStyleState) {
    const classes = ["fdtb-inline-style"];
    if (style.align === "center") classes.push("fdtb-align-center");
    if (style.align === "right") classes.push("fdtb-align-right");
    if (style.color === "yellow") classes.push("fdtb-bg-yellow");
    if (style.color === "blue") classes.push("fdtb-bg-blue");
    if (style.color === "green") classes.push("fdtb-bg-green");
    if (style.color === "red") classes.push("fdtb-bg-red");
    if (style.color === "purple") classes.push("fdtb-bg-purple");
    if (style.color === "gray") classes.push("fdtb-bg-gray");
    if (classes.length === 1) {
      return content;
    }
    return `<span class="${classes.join(" ")}">${content}</span>`;
  }

  private wrapCurrentBlockWithCodeFence(context: BlockContext) {
    const range = this.getSelectedLineRange(context.editor) ?? this.getLogicalBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    if (lines.length === 0) return;
    if (/^\s*```/.test(lines[0]) && /^\s*```/.test(lines[lines.length - 1])) {
      new Notice("当前块已经是代码块");
      return;
    }

    const replacement = ["```", ...lines, "```"].join("\n");
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, replacement);
    context.editor.setCursor({ line: range.startLine + 1, ch: 0 });
  }

  private insertBelow(context: BlockContext) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const insertLine = range.endLine + 1;
    context.editor.replaceRange("\n", { line: insertLine, ch: 0 });
    context.editor.setCursor({ line: insertLine + 1, ch: 0 });
  }

  private convertBlockToCallout(context: BlockContext, collapsed: boolean) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    if (lines.length > 0 && /^\s*>\s*\[!/.test(lines[0])) {
      new Notice("当前块已经是高亮块");
      return;
    }

    const bodyLines = lines.length > 0 ? lines : [""];
    const marker = collapsed ? "> [!note]- 折叠" : "> [!note] 高亮";
    const quotedBody = bodyLines.map((line) => `> ${line.trimEnd()}`);
    const replacement = [marker, ...quotedBody].join("\n");
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, replacement);
    context.editor.setCursor({ line: range.startLine + 1, ch: 2 });
    this.scheduleStyleRefresh();
  }

  private insertDateBelow(context: BlockContext) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const dateText = this.formatLocalDate(new Date());
    const insertLine = range.endLine + 1;
    const lastLine = context.editor.lineCount() - 1;
    if (range.endLine < lastLine) {
      context.editor.replaceRange(`${dateText}\n`, { line: insertLine, ch: 0 });
    } else {
      const current = String(context.editor.getLine(range.endLine) ?? "");
      context.editor.replaceRange(`\n${dateText}`, { line: range.endLine, ch: current.length });
    }
    context.editor.setCursor({ line: range.endLine + 1, ch: dateText.length });
    this.scheduleStyleRefresh();
  }

  private toggleMarkdownHighlight(context: BlockContext) {
    const editor = context.editor;
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (selected) {
      if (typeof editor.replaceSelection === "function") {
        editor.replaceSelection(this.toggleHighlightMarkup(selected));
      } else {
        const cursor = typeof editor.getCursor === "function"
          ? editor.getCursor()
          : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
        editor.replaceRange(this.toggleHighlightMarkup(selected), cursor);
      }
      this.scheduleStyleRefresh();
      return;
    }

    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: 0 };
    const line = Math.max(0, cursor?.line ?? context.line);
    const currentLine = String(editor.getLine(line) ?? "");
    if (!currentLine.trim() || this.isMarkdownTableSeparatorLine(currentLine)) return;

    const nextLine = this.isMarkdownTableRowLine(currentLine)
      ? this.toggleMarkdownTableRowHighlight(currentLine)
      : this.toggleLineHighlight(currentLine);
    if (nextLine === currentLine) return;

    editor.replaceRange(nextLine, { line, ch: 0 }, { line, ch: currentLine.length });
    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line, ch: Math.min(nextLine.length, cursor?.ch ?? nextLine.length) });
    }
    this.scheduleStyleRefresh();
  }

  private toggleInlineMarkdownWrap(context: BlockContext, marker: "*" | "~~") {
    const editor = context.editor;
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (selected) {
      const next = this.toggleInlineWrapMarkup(selected, marker);
      if (typeof editor.replaceSelection === "function") {
        editor.replaceSelection(next);
      } else {
        const cursor = typeof editor.getCursor === "function"
          ? editor.getCursor()
          : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
        editor.replaceRange(next, cursor);
      }
      this.scheduleStyleRefresh();
      return;
    }

    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: 0 };
    const insertText = `${marker}${marker}`;
    editor.replaceRange(insertText, cursor);
    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line: cursor.line, ch: cursor.ch + marker.length });
    }
    this.scheduleStyleRefresh();
  }

  private toggleInlineWrapMarkup(value: string, marker: "*" | "~~") {
    return value.startsWith(marker) && value.endsWith(marker) && value.length >= marker.length * 2
      ? value.slice(marker.length, -marker.length)
      : `${marker}${value}${marker}`;
  }

  private openObsidianCommandPalette() {
    const commandIds = ["command-palette:open", "app:open-command-palette"];
    for (const commandId of commandIds) {
      try {
        const executed = this.app.commands?.executeCommandById?.(commandId);
        if (executed !== false) return;
      } catch {
        // Ignore missing command ids and continue to the next fallback.
      }
    }
    new Notice("未找到命令面板入口");
  }

  private toggleLineHighlight(line: string) {
    const match = line.match(/^(\s*)(.*?)(\s*)$/);
    if (!match) return line;
    const [, leading, content, trailing] = match;
    if (!content) return line;
    return `${leading}${this.toggleHighlightMarkup(content)}${trailing}`;
  }

  private toggleMarkdownTableRowHighlight(line: string) {
    const cells = this.splitMarkdownTableRow(line);
    const hasOuterPipe = cells.length > 1 && cells[0].trim() === "" && cells[cells.length - 1].trim() === "";
    return cells
      .map((cell, index) => {
        if (hasOuterPipe && (index === 0 || index === cells.length - 1)) return cell;
        return this.toggleTableCellHighlight(cell);
      })
      .join("|");
  }

  private toggleTableCellHighlight(cell: string) {
    const match = cell.match(/^(\s*)(.*?)(\s*)$/);
    if (!match) return cell;
    const [, leading, content, trailing] = match;
    if (!content) return cell;
    return `${leading}${this.toggleHighlightMarkup(content)}${trailing}`;
  }

  private toggleHighlightMarkup(value: string) {
    return /^==[\s\S]*==$/.test(value) ? value.slice(2, -2) : `==${value}==`;
  }

  private isMarkdownTableRowLine(line: string) {
    return line.includes("|") && !this.isMarkdownTableSeparatorLine(line);
  }

  private isMarkdownTableSeparatorLine(line: string) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  private splitMarkdownTableRow(line: string) {
    const cells: string[] = [];
    let current = "";
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === "|" && line[index - 1] !== "\\") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }

  private insertLinkAtCursor(context: BlockContext) {
    const editor = context.editor;
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (selected) {
      if (typeof editor.replaceSelection === "function") {
        editor.replaceSelection(`[${selected}]()`);
      } else {
        const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
        editor.replaceRange(`[${selected}]()`, cursor);
      }
      return;
    }

    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
    editor.replaceRange("[]()", cursor);
    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
    }
  }

  private formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private duplicateBelow(context: BlockContext) {
    const range = this.getPersistedBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    if (lines.length === 0) return;

    const blockText = lines.join("\n");
    const lastLine = context.editor.lineCount() - 1;
    const insertAt =
      range.endLine < lastLine
        ? { line: range.endLine + 1, ch: 0 }
        : { line: range.endLine, ch: String(context.editor.getLine(range.endLine) ?? "").length };
    const prefix = range.endLine < lastLine ? "" : "\n";
    context.editor.replaceRange(`${prefix}${blockText}\n`, insertAt);
    const targetLine = range.endLine < lastLine ? range.endLine + 1 : range.endLine + 1;
    context.editor.setCursor({ line: targetLine, ch: 0 });
    this.scheduleStyleRefresh();
  }

  private async showTableMenu(context: BlockContext) {
    if (!this.popoverEl) return;
    this.hideSubmenu();
    const submenu = document.createElement("div");
    submenu.className = "fdtb-submenu fdtb-submenu-wide";
    submenu.addEventListener("pointerenter", () => this.clearHideTimer());
    submenu.addEventListener("pointerleave", () => this.scheduleHideToolbar());

    const header = document.createElement("div");
    header.className = "fdtb-submenu-title";
    header.textContent = "插入表格";
    submenu.appendChild(header);

    const hint = document.createElement("div");
    hint.className = "fdtb-submenu-item-desc";
    hint.textContent = "拖动或悬停选择表格尺寸";
    hint.style.margin = "0 4px 6px";
    submenu.appendChild(hint);

    const grid = document.createElement("div");
    grid.className = "fdtb-table-grid";
    let activeRows = 1;
    let activeCols = 1;
    let pointerDown = false;
    let selectionCommitted = false;
    let suppressNextClickCommit = false;
    let cleanupGlobalGridDragListeners: (() => void) | null = null;
    const updateGridSelection = (rows: number, cols: number) => {
      activeRows = rows;
      activeCols = cols;
      Array.from(grid.children).forEach((child, index) => {
        const currentRow = Math.floor(index / TABLE_PICKER_COLS) + 1;
        const currentCol = (index % TABLE_PICKER_COLS) + 1;
        child.classList.toggle("is-active", currentRow <= rows && currentCol <= cols);
      });
    };
    const commitGridSelection = () => {
      if (selectionCommitted) return;
      selectionCommitted = true;
      cleanupGlobalGridDragListeners?.();
      cleanupGlobalGridDragListeners = null;
      pointerDown = false;
      this.insertMarkdownTable(context, activeRows, activeCols);
      this.hidePopover();
    };
    const releaseSelection = () => {
      pointerDown = false;
      cleanupGlobalGridDragListeners?.();
      cleanupGlobalGridDragListeners = null;
    };
    const bindGlobalGridDragListeners = () => {
      cleanupGlobalGridDragListeners?.();
      const handlePointerMove = (event: PointerEvent) => {
        if (!pointerDown) return;
        const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
        const cell = element?.closest(".fdtb-table-grid-cell") as HTMLElement | null;
        if (!cell || !grid.contains(cell)) return;
        const rows = Number.parseInt(cell.dataset.rows ?? "", 10);
        const cols = Number.parseInt(cell.dataset.cols ?? "", 10);
        if (!Number.isFinite(rows) || !Number.isFinite(cols)) return;
        updateGridSelection(rows, cols);
      };
      const handlePointerUp = () => {
        if (!pointerDown) return;
        suppressNextClickCommit = true;
        commitGridSelection();
      };
      const handlePointerCancel = () => {
        releaseSelection();
      };
      window.addEventListener("pointermove", handlePointerMove, true);
      window.addEventListener("pointerup", handlePointerUp, true);
      window.addEventListener("pointercancel", handlePointerCancel, true);
      cleanupGlobalGridDragListeners = () => {
        window.removeEventListener("pointermove", handlePointerMove, true);
        window.removeEventListener("pointerup", handlePointerUp, true);
        window.removeEventListener("pointercancel", handlePointerCancel, true);
      };
    };
    for (let row = 1; row <= TABLE_PICKER_ROWS; row += 1) {
      for (let col = 1; col <= TABLE_PICKER_COLS; col += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "fdtb-table-grid-cell";
        cell.title = `${row} x ${col}`;
        cell.dataset.rows = String(row);
        cell.dataset.cols = String(col);
        const select = () => updateGridSelection(row, col);
        cell.addEventListener("pointerenter", () => {
          select();
        });
        cell.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          pointerDown = true;
          select();
          bindGlobalGridDragListeners();
        });
        cell.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          select();
          commitGridSelection();
        });
        cell.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (suppressNextClickCommit) {
            suppressNextClickCommit = false;
            return;
          }
          select();
          commitGridSelection();
        });
        grid.appendChild(cell);
      }
    }
    grid.addEventListener("pointerleave", () => {
      if (!pointerDown) updateGridSelection(activeRows, activeCols);
    });
    submenu.addEventListener("pointercancel", releaseSelection);
    updateGridSelection(1, 1);
    submenu.appendChild(grid);

    const utilityItems = [
      {
        label: "插入彩色空表格",
        onClick: async () => {
          await this.executeCommandById(ENHANCED_TABLE_COMMANDS.insertNativeColorTemplate);
          this.hidePopover();
        },
      },
    ];
    for (const item of utilityItems) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-submenu-item";
      const main = document.createElement("div");
      main.className = "fdtb-submenu-item-title";
      main.textContent = item.label;
      button.appendChild(main);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void item.onClick();
      });
      submenu.appendChild(button);
    }

    document.body.appendChild(submenu);
    this.submenuEl = submenu;
    const rect = this.popoverEl.getBoundingClientRect();
    submenu.style.left = `${Math.min(window.innerWidth - 360, rect.right + 8)}px`;
    submenu.style.top = `${rect.top}px`;
  }

  private async showTemplateMenu(context: BlockContext) {
    if (!this.popoverEl && !this.ensureTemplateMenuHost(context)) return;
    await this.ensureTemplateLibrary();
    const items = await this.buildTemplateMenuItems(context);
    this.showSecondaryMenu("模板", items);
  }

  async buildTemplateMenuItems(context: BlockContext): Promise<SecondaryMenuItem[]> {
    const items: SecondaryMenuItem[] = [
      {
        label: "保存当前块为模板",
        onClick: async () => {
          await this.saveCurrentBlockAsTemplate(context);
          this.hidePopover();
        },
      },
    ];
    const tree = await this.buildFullTemplateTree();
    this.appendTemplateTreeMenuItems(items, tree, context, null);
    items.push({
      label: "模板库",
      onClick: async () => {
        await this.openTemplateLibrary();
        this.hidePopover();
      },
    });
    return items;
  }

  private appendTemplateTreeMenuItems(
    items: SecondaryMenuItem[],
    node: TemplateTreeNode,
    context: BlockContext,
    folderLabel: string | null
  ) {
    const headerLabel = folderLabel ?? this.getTemplateUngroupedLabel();
    if (node.templates.length > 0) {
      items.push({ label: headerLabel, header: true });
      for (const template of this.sortTemplateDescriptors(node.templates)) {
        items.push({
          label: template.title,
          onClick: async () => {
            const ok = await this.insertTemplateIntoContext(context, template.path);
            if (ok) await this.rememberTemplate(template.path);
            this.hidePopover();
          },
        });
      }
    }

    const folders = Array.from(node.folders.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"));
    for (const [folderName, child] of folders) {
      const nextLabel = folderLabel ? `${folderLabel} / ${folderName}` : folderName;
      const hasTemplates = child.templates.length > 0;
      const hasNested = child.folders.size > 0;
      if (hasTemplates || hasNested) {
        if (!hasTemplates) {
          items.push({ label: nextLabel, header: true });
        }
        this.appendTemplateTreeMenuItems(items, child, context, nextLabel);
      } else {
        items.push({ label: `${nextLabel}（空）`, header: true });
      }
    }
  }

  getTemplateUngroupedLabel() {
    return this.dataStore.templateUngroupedLabel?.trim() || "未分组";
  }

  async setTemplateUngroupedLabel(label: string) {
    const next = label.trim().slice(0, 32) || "未分组";
    this.dataStore.templateUngroupedLabel = next;
    await this.saveData(this.dataStore);
    new Notice(`根目录分组已改名为：${next}`);
  }

  async buildFullTemplateTree(): Promise<TemplateTreeNode> {
    const templates = await this.getTemplateDescriptors();
    const tree = this.buildTemplateTree(templates);
    const groupPaths = await this.listTemplateGroupRelativePaths();
    for (const rel of groupPaths) {
      let node = tree;
      for (const segment of rel.split("/").filter(Boolean)) {
        if (!node.folders.has(segment)) {
          node.folders.set(segment, { folders: new Map(), templates: [] });
        }
        node = node.folders.get(segment)!;
      }
    }
    return tree;
  }

  async listTemplateGroupRelativePaths(): Promise<string[]> {
    const root = this.getTemplateFolderPath();
    const adapter = this.app.vault.adapter;
    const paths = new Set<string>();
    await this.collectTemplateGroupRelativePaths(root, "", paths);
    return Array.from(paths).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }

  private async collectTemplateGroupRelativePaths(
    absoluteFolderPath: string,
    relativePrefix: string,
    out: Set<string>
  ) {
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(absoluteFolderPath))) return;
    let listed: { folders?: string[] } | null = null;
    try {
      listed = await adapter.list(absoluteFolderPath);
    } catch {
      return;
    }
    for (const childFolder of listed?.folders ?? []) {
      const normalizedChild = normalizePath(childFolder);
      const name = normalizedChild.split("/").pop() ?? normalizedChild;
      if (this.isTemplateTrashFolderName(name)) continue;
      const rel = relativePrefix ? `${relativePrefix}/${name}` : name;
      out.add(rel);
      await this.collectTemplateGroupRelativePaths(normalizedChild, rel, out);
    }
  }

  async getTemplateGroupMoveOptions(): Promise<Array<{ value: string; label: string }>> {
    const options: Array<{ value: string; label: string }> = [
      { value: "", label: this.getTemplateUngroupedLabel() },
    ];
    for (const rel of await this.listTemplateGroupRelativePaths()) {
      options.push({ value: rel, label: rel });
    }
    return options;
  }

  async moveTemplateToGroup(templatePath: string, targetGroupRel: string, options?: { silent?: boolean }) {
    const ok = await this.moveTemplateToGroupCore(templatePath, targetGroupRel);
    if (!ok) return false;
    if (!options?.silent) {
      await this.updateTemplateIndexNote();
      const safeTarget = targetGroupRel
        .split("/")
        .map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-"))
        .filter(Boolean)
        .join("/");
      const groupName = safeTarget || this.getTemplateUngroupedLabel();
      new Notice(`已移到：${groupName}`);
    }
    return true;
  }

  private async moveTemplateToGroupCore(templatePath: string, targetGroupRel: string) {
    const normalized = normalizePath(templatePath);
    const root = this.getTemplateFolderPath();
    if (!normalized.startsWith(`${root}/`) || this.isTemplateIndexPath(normalized)) {
      new Notice("只能移动模板库中的模板");
      return false;
    }
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(normalized))) {
      new Notice("模板文件不存在");
      return false;
    }
    const safeTarget = targetGroupRel
      .split("/")
      .map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-"))
      .filter(Boolean)
      .join("/");
    const targetFolder = safeTarget ? normalizePath(`${root}/${safeTarget}`) : root;
    if (!(await adapter.exists(targetFolder))) {
      await this.app.vault.createFolder(targetFolder);
    }
    const fileName = normalized.split("/").pop() ?? "";
    const destPath = normalizePath(`${targetFolder}/${fileName}`);
    if (destPath === normalized) return true;
    if (await adapter.exists(destPath)) {
      new Notice("目标分组里已有同名模板");
      return false;
    }
    const renamed = await this.renameVaultPath(normalized, destPath);
    if (!renamed) {
      new Notice("模板迁移失败");
      return false;
    }
    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.map((item) =>
      normalizeRecentTemplatePath(item) === normalized ? destPath : item
    );
    await this.saveData(this.dataStore);
    return true;
  }

  private async renameVaultPath(from: string, to: string): Promise<boolean> {
    const adapter = this.app.vault.adapter;
    const file = this.app.vault.getAbstractFileByPath?.(from);
    if (file && (file instanceof TFile || file instanceof TFolder)) {
      await this.app.vault.rename(file, to);
      return true;
    }
    if (typeof adapter.rename === "function") {
      try {
        await adapter.rename(from, to);
        return true;
      } catch (error) {
        console.warn("[fdtb] adapter.rename failed", error);
        return false;
      }
    }
    return false;
  }

  async renameTemplateGroup(relativePath: string, newName: string) {
    const safe = newName.trim().replace(/[\\:*?"<>|]/g, "-");
    if (!safe) {
      new Notice("分组名称无效");
      return false;
    }
    const rel = relativePath
      .split("/")
      .map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-"))
      .filter(Boolean)
      .join("/");
    if (!rel) {
      new Notice("请用「未分组」旁的改名修改根目录显示名");
      return false;
    }
    const root = this.getTemplateFolderPath();
    const oldPath = normalizePath(`${root}/${rel}`);
    const parentRel = rel.includes("/") ? rel.split("/").slice(0, -1).join("/") : "";
    const parentPath = parentRel ? normalizePath(`${root}/${parentRel}`) : root;
    const newPath = normalizePath(`${parentPath}/${safe}`);
    if (oldPath === newPath) return true;
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(oldPath))) {
      new Notice("分组不存在");
      return false;
    }
    if (await adapter.exists(newPath)) {
      new Notice("已存在同名分组");
      return false;
    }
    const renamed = await this.renameVaultPath(oldPath, newPath);
    if (!renamed) {
      new Notice("分组改名失败");
      return false;
    }
    const oldPrefix = `${rel}/`;
    const newPrefix = parentRel ? `${parentRel}/${safe}/` : `${safe}/`;
    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.map((item) => {
      const n = normalizeRecentTemplatePath(item);
      if (n.startsWith(`${root}/${oldPrefix}`)) {
        return normalizePath(n.replace(`${root}/${oldPrefix}`, `${root}/${newPrefix}`));
      }
      return item;
    });
    await this.saveData(this.dataStore);
    await this.updateTemplateIndexNote();
    new Notice(`分组已改名为：${safe}`);
    return true;
  }

  private findTemplateTreeNode(root: TemplateTreeNode, relativePath: string): TemplateTreeNode | null {
    const segments = relativePath
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
    let node = root;
    for (const segment of segments) {
      const child = node.folders.get(segment);
      if (!child) return null;
      node = child;
    }
    return node;
  }

  private collectTemplatesInNode(node: TemplateTreeNode): TemplateDescriptor[] {
    const collected: TemplateDescriptor[] = [...node.templates];
    for (const child of node.folders.values()) {
      collected.push(...this.collectTemplatesInNode(child));
    }
    return collected;
  }

  async deleteTemplateGroup(relativePath: string) {
    const rel = relativePath
      .split("/")
      .map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-"))
      .filter(Boolean)
      .join("/");
    if (!rel) {
      new Notice("根目录分组不能删除，只能改显示名");
      return false;
    }
    const root = this.getTemplateFolderPath();
    const folderPath = normalizePath(`${root}/${rel}`);
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(folderPath))) {
      new Notice("分组不存在");
      return false;
    }

    const tree = await this.buildFullTemplateTree();
    const node = this.findTemplateTreeNode(tree, rel);
    const templates = node ? this.collectTemplatesInNode(node) : [];
    const displayName = rel.includes("/") ? rel.split("/").pop()! : rel;
    const ungroupedLabel = this.getTemplateUngroupedLabel();
    const confirmMessage =
      templates.length === 0
        ? `确定删除分组「${displayName}」？`
        : `分组「${displayName}」内有 ${templates.length} 个模板，删除后模板将移至「${ungroupedLabel}」，确定吗？`;
    if (!confirmUserAction(confirmMessage)) return false;

    for (const template of templates) {
      const moved = await this.moveTemplateToGroupCore(template.path, "");
      if (!moved) {
        new Notice(`迁移模板失败：${template.title}`);
        return false;
      }
    }

    const removed = await this.removeVaultFolder(folderPath);
    if (!removed) {
      new Notice("删除分组失败");
      return false;
    }

    await this.updateTemplateIndexNote();
    new Notice(`已删除分组：${displayName}`);
    return true;
  }

  async deleteUngroupedTemplateGroup() {
    const label = this.getTemplateUngroupedLabel();
    const defaultLabel = DEFAULT_DATA.templateUngroupedLabel;
    const tree = await this.buildFullTemplateTree();
    const templates = tree.templates;

    if (templates.length === 0) {
      if (label === defaultLabel) {
        new Notice("根目录分组已是默认状态，无需删除");
        return false;
      }
      if (!confirmUserAction(`确定删除「${label}」？将恢复显示名为「${defaultLabel}」。`)) return false;
      await this.setTemplateUngroupedLabel(defaultLabel);
      return true;
    }

    if (
      !confirmUserAction(
        `「${label}」内有 ${templates.length} 个模板，删除分组将把这些模板移入回收站，确定吗？`
      )
    ) {
      return false;
    }

    for (const template of templates) {
      const deleted = await this.deleteTemplateAtPathCore(template.path);
      if (!deleted) {
        new Notice(`删除模板失败：${template.title}`);
        return false;
      }
    }

    if (label !== defaultLabel) {
      this.dataStore.templateUngroupedLabel = defaultLabel;
      await this.saveData(this.dataStore);
    }
    await this.updateTemplateIndexNote();
    new Notice(`已将 ${templates.length} 个模板移入回收站`);
    return true;
  }

  private async deleteTemplateAtPathCore(templatePath: string) {
    return this.moveTemplateToTrashCore(templatePath);
  }

  private getTemplateTrashFolderPath() {
    return normalizePath(`${this.getTemplateFolderPath()}/${TEMPLATE_TRASH_FOLDER}`);
  }

  isTemplateTrashPath(templatePath: string) {
    const trashRoot = this.getTemplateTrashFolderPath();
    const normalized = normalizePath(templatePath);
    return normalized === trashRoot || normalized.startsWith(`${trashRoot}/`);
  }

  private isTemplateTrashFolderName(folderName: string) {
    return folderName === TEMPLATE_TRASH_FOLDER;
  }

  private async ensureTemplateTrashFolder() {
    const trashPath = this.getTemplateTrashFolderPath();
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(trashPath))) {
      await this.app.vault.createFolder(trashPath);
    }
  }

  private async moveTemplateToTrashCore(templatePath: string) {
    const normalized = normalizePath(templatePath);
    const root = this.getTemplateFolderPath();
    if (
      !normalized.startsWith(`${root}/`) ||
      this.isTemplateIndexPath(normalized) ||
      this.isTemplateTrashPath(normalized)
    ) {
      return false;
    }
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(normalized))) return false;

    await this.ensureTemplateTrashFolder();
    const relative = normalized.slice(root.length + 1);
    const trashRoot = this.getTemplateTrashFolderPath();
    const trashDest = normalizePath(`${trashRoot}/${relative}`);
    const destFolder = trashDest.includes("/")
      ? trashDest.slice(0, trashDest.lastIndexOf("/"))
      : trashRoot;
    const fileName = trashDest.split("/").pop() ?? "template.md";
    const finalDest =
      (await adapter.exists(trashDest))
        ? await this.allocateUniqueVaultPath(destFolder, fileName)
        : trashDest;

    if (!(await adapter.exists(destFolder))) {
      await this.ensureFolderExists(destFolder);
    }

    const renamed = await this.renameVaultPath(normalized, finalDest);
    if (!renamed) return false;

    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.filter(
      (item) => normalizeRecentTemplatePath(item) !== normalized
    );
    await this.saveData(this.dataStore);
    return true;
  }

  async listTrashedTemplates(): Promise<TrashedTemplateItem[]> {
    const trashRoot = this.getTemplateTrashFolderPath();
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(trashRoot))) return [];

    const items: TrashedTemplateItem[] = [];
    await this.collectTrashedTemplateItems(trashRoot, trashRoot, items);
    return items.sort((a, b) => b.deletedAt - a.deletedAt);
  }

  private async collectTrashedTemplateItems(
    absoluteFolder: string,
    trashRoot: string,
    out: TrashedTemplateItem[]
  ) {
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(absoluteFolder))) return;

    let listing: { files?: string[]; folders?: string[] } | null = null;
    try {
      listing = await adapter.list(absoluteFolder);
    } catch {
      return;
    }

    for (const filePath of listing?.files ?? []) {
      if (!filePath.toLowerCase().endsWith(".md")) continue;
      const normalized = normalizePath(filePath);
      const relativeUnderTrash = normalized.slice(trashRoot.length + 1);
      const segments = relativeUnderTrash.split("/").filter(Boolean);
      segments.pop();
      const file = this.app.vault.getAbstractFileByPath?.(normalized);
      out.push({
        trashPath: normalized,
        title: file instanceof TFile ? file.basename : this.getTemplateNameFromPath(normalized),
        originalGroup: segments.join("/"),
        deletedAt: file instanceof TFile ? file.stat.mtime : 0,
      });
    }

    for (const childFolder of listing?.folders ?? []) {
      await this.collectTrashedTemplateItems(normalizePath(childFolder), trashRoot, out);
    }
  }

  async restoreTemplateFromTrash(trashPath: string) {
    const normalized = normalizePath(trashPath);
    if (!this.isTemplateTrashPath(normalized)) {
      new Notice("只能恢复回收站中的模板");
      return false;
    }
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(normalized))) {
      new Notice("回收站里找不到该模板");
      return false;
    }

    const trashRoot = this.getTemplateTrashFolderPath();
    const relativeUnderTrash = normalized.slice(trashRoot.length + 1);
    const root = this.getTemplateFolderPath();
    let destPath = normalizePath(`${root}/${relativeUnderTrash}`);
    if (await adapter.exists(destPath)) {
      const destFolder = destPath.includes("/") ? destPath.slice(0, destPath.lastIndexOf("/")) : root;
      const fileName = destPath.split("/").pop() ?? "template.md";
      destPath = await this.allocateUniqueVaultPath(destFolder, fileName);
    }

    const destFolder = destPath.includes("/") ? destPath.slice(0, destPath.lastIndexOf("/")) : root;
    if (!(await adapter.exists(destFolder))) {
      await this.ensureFolderExists(destFolder);
    }

    const renamed = await this.renameVaultPath(normalized, destPath);
    if (!renamed) {
      new Notice("恢复模板失败");
      return false;
    }

    await this.cleanupEmptyTrashFolders();
    await this.updateTemplateIndexNote();
    new Notice(`已恢复模板：${this.getTemplateNameFromPath(destPath)}`);
    return true;
  }

  async purgeTrashedTemplate(trashPath: string) {
    const normalized = normalizePath(trashPath);
    if (!this.isTemplateTrashPath(normalized)) {
      new Notice("只能永久删除回收站中的模板");
      return false;
    }
    const templateName = this.getTemplateNameFromPath(normalized);
    if (
      !confirmUserAction(`确定永久删除模板「${templateName}」吗？\n\n此操作不可恢复。`)
    ) {
      return false;
    }

    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(normalized))) {
      new Notice("回收站里找不到该模板");
      return false;
    }

    await adapter.remove(normalized);
    await this.cleanupEmptyTrashFolders();
    new Notice(`已永久删除：${templateName}`);
    return true;
  }

  async emptyTemplateTrash() {
    const trashed = await this.listTrashedTemplates();
    if (trashed.length === 0) {
      new Notice("回收站已是空的");
      return false;
    }
    if (
      !confirmUserAction(
        `确定清空回收站吗？将永久删除 ${trashed.length} 个模板，此操作不可恢复。`
      )
    ) {
      return false;
    }

    for (const item of trashed) {
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(item.trashPath)) {
        await adapter.remove(item.trashPath);
      }
    }
    await this.cleanupEmptyTrashFolders();
    new Notice(`已清空回收站（${trashed.length} 个模板）`);
    return true;
  }

  private async cleanupEmptyTrashFolders() {
    const trashRoot = this.getTemplateTrashFolderPath();
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(trashRoot))) return;
    await this.removeEmptyTrashSubfolders(trashRoot);
  }

  private async removeEmptyTrashSubfolders(folderPath: string) {
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(folderPath))) return;

    let listing: { files?: string[]; folders?: string[] } | null = null;
    try {
      listing = await adapter.list(folderPath);
    } catch {
      return;
    }

    for (const childFolder of listing?.folders ?? []) {
      const childPath = normalizePath(childFolder);
      await this.removeEmptyTrashSubfolders(childPath);
      const childListing = await adapter.list(childPath);
      const hasFiles = (childListing.files ?? []).length > 0;
      const hasFolders = (childListing.folders ?? []).length > 0;
      if (!hasFiles && !hasFolders && typeof adapter.rmdir === "function") {
        try {
          await adapter.rmdir(childPath, false);
        } catch {
          // ignore
        }
      }
    }
  }

  private async removeVaultFolder(folderPath: string): Promise<boolean> {
    const adapter = this.app.vault.adapter;
    const normalized = normalizePath(folderPath);
    if (!(await adapter.exists(normalized))) return true;

    const folder = this.app.vault.getAbstractFileByPath?.(normalized);
    if (folder instanceof TFolder && typeof this.app.vault.delete === "function") {
      try {
        await this.app.vault.delete(folder, true);
        return !(await adapter.exists(normalized));
      } catch (error) {
        console.warn("[fdtb] vault.delete folder failed", error);
      }
    }

    if (typeof adapter.rmdir === "function") {
      try {
        await adapter.rmdir(normalized, true);
        return !(await adapter.exists(normalized));
      } catch (error) {
        console.warn("[fdtb] adapter.rmdir failed", error);
      }
    }

    try {
      await this.removeVaultFolderContents(normalized);
      if (typeof adapter.rmdir === "function") {
        await adapter.rmdir(normalized, false);
      }
      return !(await adapter.exists(normalized));
    } catch (error) {
      console.warn("[fdtb] manual folder remove failed", error);
      return false;
    }
  }

  private async removeVaultFolderContents(folderPath: string) {
    const adapter = this.app.vault.adapter;
    const listing = await adapter.list(folderPath);
    for (const filePath of listing.files ?? []) {
      await adapter.remove(normalizePath(filePath));
    }
    for (const childFolder of listing.folders ?? []) {
      const childPath = normalizePath(childFolder);
      await this.removeVaultFolderContents(childPath);
      if (typeof adapter.rmdir === "function") {
        await adapter.rmdir(childPath, false);
      }
    }
  }

  buildTemplateTree(templates: TemplateDescriptor[]): TemplateTreeNode {
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

  sortTemplateDescriptors(templates: TemplateDescriptor[]) {
    return [...templates].sort((a, b) => {
      if (a.order !== null && b.order !== null && a.order !== b.order) return a.order - b.order;
      if (a.order !== null) return -1;
      if (b.order !== null) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }

  async updateTemplateFolderPath(value: string) {
    this.dataStore.templateFolderPath = normalizeTemplateFolderPath(value);
    await this.saveData(this.dataStore);
    await this.ensureTemplateLibrary();
    await this.updateTemplateIndexNote();
  }

  async createTemplateSubfolder(relativePath: string) {
    const safe = relativePath
      .split("/")
      .map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-"))
      .filter(Boolean)
      .join("/");
    if (!safe) {
      new Notice("分组名称无效");
      return false;
    }
    await this.ensureTemplateLibrary();
    const folderPath = normalizePath(`${this.getTemplateFolderPath()}/${safe}`);
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(folderPath)) {
      new Notice("分组已存在");
      return false;
    }
    await this.app.vault.createFolder(folderPath);
    new Notice(`已创建分组：${safe}`);
    return true;
  }

  async createBlankTemplate(rawName: string) {
    const segments = rawName
      .split("/")
      .map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-"))
      .filter(Boolean);
    if (segments.length === 0) {
      new Notice("模板名称无效");
      return false;
    }
    const fileName = `${segments.pop()}.md`;
    await this.ensureTemplateLibrary();
    const folderPath =
      segments.length > 0
        ? normalizePath(`${this.getTemplateFolderPath()}/${segments.join("/")}`)
        : this.getTemplateFolderPath();
    if (!(await this.app.vault.adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }
    const path = await this.allocateUniqueVaultPath(folderPath, fileName);
    await this.app.vault.create(path, "");
    await this.rememberTemplate(path);
    await this.updateTemplateIndexNote();
    new Notice(`已创建模板：${this.getTemplateNameFromPath(path)}`);
    return true;
  }

  async renderTemplatePreviewInto(hostEl: HTMLElement, templatePath: string) {
    hostEl.replaceChildren();
    const loading = hostEl.createDiv({ cls: "fdtb-template-settings-preview-status" });
    loading.textContent = "加载中…";
    try {
      const markdown = await this.readTemplatePreviewContent(templatePath);
      hostEl.replaceChildren();
      if (!markdown.trim()) {
        const empty = hostEl.createDiv({ cls: "fdtb-template-settings-preview-status" });
        empty.textContent = "（模板为空）";
        return;
      }
      const rendered = hostEl.createDiv({
        cls: "fdtb-template-settings-preview-rendered markdown-rendered markdown-preview-view",
      });
      await MarkdownRenderer.renderMarkdown(markdown, rendered, templatePath, this);
    } catch (error) {
      console.warn("[fdtb] template preview render failed", error);
      hostEl.replaceChildren();
      const failed = hostEl.createDiv({ cls: "fdtb-template-settings-preview-status" });
      failed.textContent = "读取模板失败，请稍后重试。";
    }
  }

  async renameTemplateAtPath(templatePath: string, newTitle: string) {
    const safe = newTitle.trim().replace(/[\\:*?"<>|]/g, "-").replace(/\.+$/g, "");
    if (!safe) {
      new Notice("模板名称无效");
      return false;
    }
    const normalized = normalizePath(templatePath);
    const root = this.getTemplateFolderPath();
    if (!normalized.startsWith(`${root}/`) || this.isTemplateIndexPath(normalized) || this.isTemplateTrashPath(normalized)) {
      new Notice("只能重命名模板库中的模板");
      return false;
    }
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(normalized))) {
      new Notice("模板文件不存在");
      return false;
    }
    const parentDir = normalized.slice(0, normalized.lastIndexOf("/"));
    const nextFileName = safe.toLowerCase().endsWith(".md") ? safe : `${safe}.md`;
    const destPath = normalizePath(`${parentDir}/${nextFileName}`);
    if (destPath === normalized) return true;
    if (await adapter.exists(destPath)) {
      new Notice("同分组里已有同名模板");
      return false;
    }
    const renamed = await this.renameVaultPath(normalized, destPath);
    if (!renamed) {
      new Notice("模板改名失败");
      return false;
    }
    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.map((item) =>
      normalizeRecentTemplatePath(item) === normalized ? destPath : item
    );
    await this.saveData(this.dataStore);
    await this.updateTemplateIndexNote();
    new Notice(`模板已改名为：${this.getTemplateNameFromPath(destPath)}`);
    return true;
  }

  async readTemplatePreviewContent(templatePath: string) {
    const normalizedPath = normalizePath(templatePath);
    if (!(await this.app.vault.adapter.exists(normalizedPath))) {
      return "";
    }
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    const content =
      file instanceof TFile ? await this.app.vault.read(file) : await this.app.vault.adapter.read(normalizedPath);
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.splitTemplateContentForPreview === "function") {
      const split = enhancer.splitTemplateContentForPreview(content);
      const visible = String(split?.visible ?? "").trim();
      if (visible) return visible;
    }
    return this.stripTemplateSystemLines(content);
  }

  async insertTemplateAtActiveEditor(templatePath: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view?.file) {
      new Notice("请先打开一个 Markdown 笔记");
      return false;
    }
    const editor = (view as MarkdownView & { editor?: { cm?: unknown; getCursor?: () => { line: number } } }).editor;
    if (!editor?.cm || typeof editor.getCursor !== "function") {
      new Notice("请先在笔记编辑区里定位光标");
      return false;
    }
    const line = Math.max(0, editor.getCursor()?.line ?? 0);
    let context = this.getEditorBlockContext(view, editor);
    if (!context) {
      const blockEl =
        (view.contentEl?.querySelector?.(".cm-content") as HTMLElement | null) ??
        (view.contentEl instanceof HTMLElement ? view.contentEl : document.createElement("div"));
      context = {
        view,
        file: view.file,
        editor,
        cmView: editor.cm,
        blockEl,
        line,
        kind: this.getBlockKind(editor, line),
      };
    }
    const ok = await this.insertTemplateIntoContext(context, templatePath);
    if (ok) await this.rememberTemplate(templatePath);
    return ok;
  }

  private resolveVaultMarkdownFile(filePath: string): TFile | null {
    const normalized = normalizePath(filePath);
    const fromAbstract = this.app.vault.getAbstractFileByPath(normalized);
    if (fromAbstract instanceof TFile) return fromAbstract;
    return this.app.vault.getFiles().find((file) => file.path === normalized) ?? null;
  }

  async editTemplateAtPath(templatePath: string) {
    const normalized = normalizePath(templatePath);
    if (!(await this.app.vault.adapter.exists(normalized))) {
      new Notice("模板文件不存在");
      return false;
    }

    const file = this.resolveVaultMarkdownFile(normalized);
    if (file) {
      await this.app.workspace.getLeaf(false).openFile(file);
      return true;
    }

    await this.app.workspace.openLinkText(normalized, "", false);
    return true;
  }

  async deleteTemplateAtPath(templatePath: string) {
    const normalized = normalizePath(templatePath);
    const root = this.getTemplateFolderPath();
    if (!normalized.startsWith(`${root}/`) || this.isTemplateIndexPath(normalized)) {
      new Notice("只能删除模板库中的模板");
      return false;
    }
    if (this.isTemplateTrashPath(normalized)) {
      return this.purgeTrashedTemplate(normalized);
    }

    const templateName = this.getTemplateNameFromPath(normalized);
    const confirmed = confirmUserAction(
      `确定删除模板「${templateName}」吗？\n\n删除后将移入模板回收站，可在设置页恢复。`
    );
    if (!confirmed) return false;

    const moved = await this.moveTemplateToTrashCore(normalized);
    if (!moved) {
      new Notice("删除模板失败");
      return false;
    }
    await this.updateTemplateIndexNote();
    new Notice(`已移入回收站：${templateName}`);
    return true;
  }

  private ensureTemplateMenuHost(context: BlockContext) {
    if (this.popoverEl) return true;

    if (this.shouldShowOrdinaryToolbarForContext(context)) {
      this.showPopover(context);
      return !!this.popoverEl;
    }

    this.hidePopover();
    const popover = document.createElement("div");
    popover.className = "fdtb-popover fdtb-template-host";
    popover.addEventListener("pointerenter", () => this.clearHideTimer());
    popover.addEventListener("pointerleave", () => this.clearHideTimer());

    const header = document.createElement("div");
    header.className = "fdtb-submenu-title";
    header.textContent = "模板";
    popover.appendChild(header);

    document.body.appendChild(popover);
    this.popoverEl = popover;

    const rect = context.blockEl.getBoundingClientRect();
    const desiredTop = Math.max(72, rect.top - 8);
    const desiredLeft = Math.min(window.innerWidth - 292, rect.right + 8);
    popover.style.top = `${desiredTop}px`;
    popover.style.left = `${Math.max(16, desiredLeft)}px`;
    return true;
  }

  private showSecondaryMenu(title: string, items: SecondaryMenuItem[]) {
    if (!this.popoverEl) return;
    this.hideSubmenu();
    const submenu = document.createElement("div");
    submenu.className = "fdtb-submenu";
    submenu.addEventListener("pointerenter", () => this.clearHideTimer());
    submenu.addEventListener("pointerleave", () => this.clearHideTimer());

    const header = document.createElement("div");
    header.className = "fdtb-submenu-title";
    header.textContent = title;
    submenu.appendChild(header);

    for (const item of items) {
      if (item.header) {
        const section = document.createElement("div");
        section.className = "fdtb-submenu-section-title";
        section.textContent = item.label;
        submenu.appendChild(section);
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-submenu-item";
      const main = document.createElement("div");
      main.className = "fdtb-submenu-item-title";
      main.textContent = item.label;
      button.appendChild(main);
      if (item.description) {
        const desc = document.createElement("div");
        desc.className = "fdtb-submenu-item-desc";
        desc.textContent = item.description;
        button.appendChild(desc);
      }
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void item.onClick?.();
      });
      submenu.appendChild(button);
    }

    document.body.appendChild(submenu);
    this.submenuEl = submenu;
    const rect = this.popoverEl.getBoundingClientRect();
    submenu.style.left = `${Math.min(window.innerWidth - 300, rect.right + 8)}px`;
    submenu.style.top = `${rect.top}px`;
  }

  private hideSubmenu() {
    this.submenuEl?.remove();
    this.submenuEl = null;
  }

  private async executeCommandById(commandId: string) {
    const commands = (this.app as any)?.commands;
    if (!commands || typeof commands.executeCommandById !== "function") {
      new Notice("当前无法调用对应命令");
      return false;
    }
    const ok = await commands.executeCommandById(commandId);
    if (!ok) {
      new Notice("对应命令当前不可用");
      return false;
    }
    return true;
  }

  private async ensureTemplateLibrary() {
    const folderPath = this.getTemplateFolderPath();
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  async getTemplateDescriptors(): Promise<TemplateDescriptor[]> {
    const paths = await this.listTemplateMarkdownPaths();
    const folderPath = this.getTemplateFolderPath();
    const descriptors = await Promise.all(
      paths.map(async (templatePath) => {
        const file = this.app.vault.getAbstractFileByPath?.(templatePath);
        const concreteFile = file instanceof TFile ? file : null;
        const content = concreteFile
          ? await this.app.vault.cachedRead(concreteFile)
          : await this.app.vault.adapter.read(templatePath);
        const cacheFile = concreteFile ? this.app.metadataCache.getFileCache(concreteFile) : null;
        const cachedOrder =
          cacheFile?.frontmatter && typeof cacheFile.frontmatter.menuOrder === "number" ? cacheFile.frontmatter.menuOrder : null;
        const order = cachedOrder ?? this.parseTemplateOrderFromContent(content);
        return {
          path: templatePath,
          title: concreteFile?.basename ?? this.getTemplateNameFromPath(templatePath),
          excerpt: this.getTemplateExcerpt(concreteFile, content),
          order,
          updatedAt: concreteFile?.stat?.mtime ?? 0,
          folderSegments: this.getTemplateFolderSegments(templatePath, folderPath),
        };
      })
    );

    return this.sortTemplateDescriptors(descriptors);
  }

  private getTemplateFolderSegments(templatePath: string, folderPath: string) {
    const normalized = normalizePath(templatePath);
    const root = normalizePath(folderPath);
    if (!normalized.startsWith(`${root}/`)) return [];
    const relative = normalized.slice(root.length + 1);
    const segments = relative.split("/");
    segments.pop();
    return segments.filter(Boolean);
  }

  private getTemplateFolderPath() {
    return normalizeTemplateFolderPath(this.dataStore.templateFolderPath);
  }

  private getTemplateIndexPath() {
    return normalizePath(`${this.getTemplateFolderPath()}/${TEMPLATE_INDEX_BASENAME}`);
  }

  private async listTemplateMarkdownPaths() {
    const folderPath = this.getTemplateFolderPath();
    const paths = new Set<string>();
    const markdownFiles = typeof this.app.vault.getMarkdownFiles === "function" ? this.app.vault.getMarkdownFiles() : [];
    for (const file of markdownFiles) {
      if (!file?.path?.startsWith(`${folderPath}/`)) continue;
      if (!file.path.toLowerCase().endsWith(".md")) continue;
      if (this.isTemplateIndexPath(file.path)) continue;
      if (this.isTemplateTrashPath(file.path)) continue;
      paths.add(normalizePath(file.path));
    }

    const adapter = this.app.vault.adapter;
    await this.collectTemplateMarkdownPaths(folderPath, paths);
    return Array.from(paths);
  }

  private async collectTemplateMarkdownPaths(folderPath: string, paths: Set<string>) {
    const adapter = this.app.vault.adapter;
    try {
      if (adapter && typeof adapter.exists === "function" && typeof adapter.list === "function" && await adapter.exists(folderPath)) {
        const listing = await adapter.list(folderPath);
        for (const filePath of listing.files ?? []) {
          if (!filePath.toLowerCase().endsWith(".md")) continue;
          if (this.isTemplateIndexPath(filePath)) continue;
          paths.add(normalizePath(filePath));
        }
        for (const childFolder of listing.folders ?? []) {
          const normalizedChild = normalizePath(childFolder);
          const name = normalizedChild.split("/").pop() ?? normalizedChild;
          if (this.isTemplateTrashFolderName(name)) continue;
          await this.collectTemplateMarkdownPaths(normalizedChild, paths);
        }
      }
    } catch (error) {
      console.warn("[fdtb] list hidden template folder failed", error);
    }
  }

  private isTemplateIndexPath(templatePath: string) {
    return normalizePath(templatePath) === this.getTemplateIndexPath() || templatePath.endsWith(`/${TEMPLATE_INDEX_BASENAME}`);
  }

  private getRecentTemplates(templates: TemplateDescriptor[]) {
    const map = new Map(templates.map((item) => [item.path, item]));
    const picked: TemplateDescriptor[] = [];
    for (const path of this.dataStore.recentTemplatePaths) {
      const found = map.get(normalizeRecentTemplatePath(path));
      if (found) picked.push(found);
    }
    return picked;
  }

  private parseTemplateOrderFromContent(content: string) {
    const match = content.match(TEMPLATE_FRONTMATTER_ORDER_RE);
    return match ? Number.parseInt(match[1], 10) : null;
  }

  private getTemplateExcerpt(file: TFile | null, content?: string) {
    const cache = file ? this.app.metadataCache.getFileCache(file) : null;
    const headings = cache?.headings ?? [];
    if (headings.length > 0) {
      return headings[0].heading.slice(0, 30);
    }
    if (typeof content === "string") {
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("---") && !line.startsWith("#") && !this.isTemplateSystemLine(line));
      if (lines.length > 0) {
        return lines[0].slice(0, 30);
      }
    }
    return "插入模板内容";
  }

  private async insertTemplateIntoContext(context: BlockContext, templatePath: string) {
    const normalizedPath = normalizePath(templatePath);
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    const exists = file instanceof TFile || await this.app.vault.adapter.exists(normalizedPath);
    if (!exists) {
      new Notice("模板文件不存在");
      return false;
    }
    const content = file instanceof TFile ? await this.app.vault.read(file) : await this.app.vault.adapter.read(normalizedPath);
    const range = this.getPersistedBlockRange(context.editor, context.line);
    const insertAt = range.endLine < context.editor.lineCount() - 1
      ? { line: range.endLine + 1, ch: 0 }
      : { line: range.endLine, ch: String(context.editor.getLine(range.endLine) ?? "").length };
    const insertedByEnhancer = this.shouldUseTableEnhancerForTemplate(content)
      ? await this.insertTemplateViaTableEnhancer(context, content, insertAt)
      : false;
    if (insertedByEnhancer) {
      new Notice(`已插入模板：${file instanceof TFile ? file.basename : this.getTemplateNameFromPath(normalizedPath)}`);
      return true;
    }
    const prefix = range.endLine < context.editor.lineCount() - 1 ? "" : "\n";
    const body = this.stripTemplateSystemLines(content).replace(/\s+$/g, "");
    context.editor.replaceRange(`${prefix}${body}\n`, insertAt);
    new Notice(`已插入模板：${file instanceof TFile ? file.basename : this.getTemplateNameFromPath(normalizedPath)}`);
    return true;
  }

  private async insertTemplateViaTableEnhancer(context: BlockContext, content: string, insertAt: { line: number; ch: number }) {
    const enhancer = this.getTableEnhancerPlugin();
    const insertTemplate =
      typeof enhancer?.insertTemplateContentAtCursor === "function"
        ? enhancer.insertTemplateContentAtCursor
        : null;
    if (!insertTemplate) return false;
    try {
      if (typeof context.editor.setCursor === "function") {
        context.editor.setCursor(insertAt);
      }
      return await insertTemplate.call(enhancer, content, insertAt);
    } catch (error) {
      console.warn("[fdtb] table template insertion failed; falling back to plain markdown", error);
      return false;
    }
  }

  private getTableEnhancerPlugin() {
    return this.getExternalTableEnhancerPlugin() ?? this.embeddedNativeTableEnhancer;
  }

  private stripTemplateSystemLines(content: string) {
    const originalEndsWithNewline = /\r?\n$/.test(content);
    const next = content
      .split(/\r?\n/)
      .filter((line) => !this.isTemplateSystemLine(line))
      .join("\n");
    return originalEndsWithNewline ? `${next}\n` : next;
  }

  private isTemplateSystemLine(line: string) {
    return TEMPLATE_SYSTEM_LINE_RE.test(line);
  }

  private shouldUseTableEnhancerForTemplate(content: string) {
    return content.split(/\r?\n/).some((line) => this.isTemplateSystemLine(line));
  }

  private async rememberTemplate(templatePath: string) {
    const normalizedPath = normalizeRecentTemplatePath(templatePath);
    const next = [normalizedPath, ...this.dataStore.recentTemplatePaths.filter((item) => normalizeRecentTemplatePath(item) !== normalizedPath)].slice(0, TEMPLATE_MENU_LIMIT);
    this.dataStore.recentTemplatePaths = next;
    await this.saveData(this.dataStore);
  }

  async copyCurrentTableAsImage(tableEl: HTMLTableElement) {
    if (!this.isEmbeddedModuleEnabled("right-click-copy-as-image")) {
      new Notice("请在 Obsidian增强体验 → 自研功能开关 中启用「右键复制成图」");
      return false;
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("请先打开一个 Markdown 笔记");
      return false;
    }

    const runner = getRightClickCopyAsImageRunner();
    if (!runner) {
      new Notice("右键复制成图模块未就绪，请重载 Obsidian增强体验");
      return false;
    }

    await runner.copyTableElementAsImage(view, tableEl);
    return true;
  }

  async openTemplateLibrary() {
    const tableEnhancer = this.getTableEnhancerPlugin();
    if (typeof tableEnhancer?.openTemplateLibraryModal === "function") {
      tableEnhancer.openTemplateLibraryModal();
      return;
    }

    await this.ensureTemplateLibrary();
    await this.updateTemplateIndexNote();
    const file = this.app.vault.getAbstractFileByPath(this.getTemplateIndexPath());
    if (!(file instanceof TFile)) {
      new Notice("模板库索引不存在");
      return;
    }
    const leaf = this.app.workspace.getMostRecentLeaf();
    await leaf?.openFile(file);
  }

  private async saveCurrentBlockAsTemplate(context: BlockContext) {
    const selectedContent = this.getSelectedTemplateContent(context.editor);
    const rawName = window.prompt("模板名称（可用「分组/名称」保存到子文件夹）", "未命名模板")?.trim();
    if (!rawName) return false;
    const segments = rawName
      .split("/")
      .map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-"))
      .filter(Boolean);
    if (segments.length === 0) return false;
    const fileStem = segments.pop() ?? "未命名模板";
    await this.ensureTemplateLibrary();
    const folderPath =
      segments.length > 0
        ? normalizePath(`${this.getTemplateFolderPath()}/${segments.join("/")}`)
        : this.getTemplateFolderPath();
    if (!(await this.app.vault.adapter.exists(folderPath))) {
      await this.app.vault.createFolder(folderPath);
    }
    const range = this.getPersistedBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    const body = this.normalizeTemplateContentForStorage(selectedContent ?? lines.join("\n"));
    if (!body.trim()) {
      new Notice("当前块为空，无法保存模板");
      return false;
    }
    const path = await this.allocateUniqueVaultPath(folderPath, `${fileStem}.md`);
    await this.app.vault.create(path, body);
    await this.rememberTemplate(path);
    await this.updateTemplateIndexNote();
    new Notice(`已保存模板：${fileStem}`);
    return true;
  }

  getTemplateContentForEditor(editor: any, line: number) {
    if (!editor || typeof editor.getLine !== "function" || typeof editor.lineCount !== "function") {
      return null;
    }
    const range = this.getPersistedBlockRange(editor, Math.max(0, line));
    const lines = this.readBlockLines(editor, range.startLine, range.endLine);
    const body = this.normalizeTemplateContentForStorage(lines.join("\n"));
    return body.trim() ? body : null;
  }

  private getSelectedTemplateContent(editor: any) {
    if (editor && typeof editor.getSelection === "function") {
      const selection = String(editor.getSelection() ?? "");
      if (selection.trim()) return selection;
    }

    const browserSelection = window.getSelection?.();
    const selectedText = String(browserSelection?.toString?.() ?? "");
    return selectedText.trim() ? selectedText : null;
  }

  private normalizeTemplateContentForStorage(content: string) {
    const lines = String(content ?? "").replace(/\r\n?/g, "\n").split("\n");
    while (lines.length > 0 && !lines[0].trim()) lines.shift();
    while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();
    return lines.length > 0 ? `${lines.join("\n")}\n` : "";
  }

  private async updateTemplateIndexNote() {
    const indexPath = this.getTemplateIndexPath();
    const descriptors = await this.getTemplateDescriptors();
    const links = descriptors.length > 0
      ? descriptors.map((item) => `- [[${item.path.replace(/\.md$/i, "")}|${item.title}]]`).join("\n")
      : "- 还没有模板";
    const content = `# 模板库\n\n${links}\n`;
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(indexPath)) {
      await adapter.write(indexPath, content);
      return;
    }
    try {
      await this.app.vault.create(indexPath, content);
    } catch {
      await adapter.write(indexPath, content);
    }
  }

  private getTemplateNameFromPath(templatePath: string) {
    return (templatePath.split("/").pop() ?? templatePath).replace(/\.md$/i, "");
  }

  private insertMarkdownTable(context: BlockContext, rows: number, cols: number) {
    const headers = this.buildDefaultTableHeaders(cols);
    const separator = Array.from({ length: cols }, () => "---");
    const body = Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, () => ""));
    const tableLines = [
      `| ${headers.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...body.map((cells) => `| ${cells.join(" | ")} |`),
    ];
    const tableText = tableLines.join("\n");
    const tableBlockText = `${tableText}\n\n`;
    const editor = context.editor;
    const currentLine = String(editor.getLine(context.line) ?? "");
    const slashTriggered =
      !!this.slashTrigger &&
      this.slashTrigger.filePath === context.file.path &&
      this.slashTrigger.line === context.line &&
      currentLine.trim() === "/";

    if (slashTriggered) {
      editor.replaceRange(tableBlockText, { line: context.line, ch: 0 }, { line: context.line, ch: currentLine.length });
      this.slashTrigger = null;
      const targetLine = context.line + tableLines.length + 1;
      editor.setCursor({ line: targetLine, ch: 0 });
      this.scheduleStyleRefresh();
      return;
    }

    if (!currentLine.trim()) {
      editor.replaceRange(tableBlockText, { line: context.line, ch: 0 }, { line: context.line, ch: currentLine.length });
      const targetLine = context.line + tableLines.length + 1;
      editor.setCursor({ line: targetLine, ch: 0 });
      this.scheduleStyleRefresh();
      return;
    }

    const range = this.getLogicalBlockRange(editor, context.line);
    const insertLine = range.endLine + 1;
    editor.replaceRange(`\n${tableText}\n`, { line: insertLine, ch: 0 });
    editor.setCursor({ line: insertLine + tableLines.length + 1, ch: 0 });
    this.scheduleStyleRefresh();
  }

  private buildDefaultTableHeaders(cols: number) {
    const preferredHeaders = ["步骤", "自检", "内容"];
    if (cols > preferredHeaders.length) {
      return Array.from({ length: cols }, () => "");
    }
    return preferredHeaders.slice(0, Math.max(0, cols));
  }

  private async insertAttachmentIntoContext(context: BlockContext, kind: "image" | "file") {
    const input = document.createElement("input");
    input.type = "file";
    if (kind === "image") {
      input.accept = "image/*";
    }
    const file = await new Promise<File | null>((resolve) => {
      input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
      input.click();
    });
    if (!file) return false;

    const folderPath = this.getAttachmentFolderPath();
    await this.ensureFolderExists(folderPath);
    const targetPath = await this.allocateUniqueVaultPath(folderPath, file.name);
    const data = await file.arrayBuffer();
    await (this.app.vault.adapter as any).writeBinary(targetPath, data);

    const embed = kind === "image" ? `![[${targetPath}]]` : `[[${targetPath}]]`;
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const insertLine = range.endLine + 1;
    context.editor.replaceRange(`\n${embed}\n`, { line: insertLine, ch: 0 });
    context.editor.setCursor({ line: insertLine + 1, ch: embed.length });
    new Notice(kind === "image" ? "已插入图片" : "已插入文件");
    return true;
  }

  private getAttachmentFolderPath() {
    const configured = (this.app.vault as any)?.getConfig?.("attachmentFolderPath");
    if (typeof configured === "string" && configured.trim()) {
      return normalizePath(configured.trim());
    }
    return "_attachments";
  }

  private async ensureFolderExists(folderPath: string) {
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(folderPath)) return;
    const parts = folderPath.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await adapter.exists(current))) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  private async allocateUniqueVaultPath(folderPath: string, fileName: string) {
    const adapter = this.app.vault.adapter;
    const dot = fileName.lastIndexOf(".");
    const base = dot > 0 ? fileName.slice(0, dot) : fileName;
    const ext = dot > 0 ? fileName.slice(dot) : "";
    let candidate = normalizePath(`${folderPath}/${fileName}`);
    let index = 1;
    while (await adapter.exists(candidate)) {
      candidate = normalizePath(`${folderPath}/${base} ${index}${ext}`);
      index += 1;
    }
    return candidate;
  }

  private async copyBlockMarkdown(context: BlockContext) {
    try {
      const range = this.getLogicalBlockRange(context.editor, context.line);
      const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
      const blockKind = this.getBlockKind(context.editor, context.line);
      const blockText = this.normalizeCopiedBlockForPaste(lines.join("\n"), blockKind);
      if (!blockText.trim()) {
        new Notice("当前块没有可复制内容");
        return;
      }
      await this.writeTextToClipboard(blockText);
      new Notice("已复制当前块内容");
    } catch (error) {
      console.error("[feishu-doc-toolbar] copy block markdown failed", error);
      new Notice(`复制当前块内容失败：${this.formatError(error)}`);
    }
  }

  private normalizeCopiedBlockForPaste(blockText: string, kind: BlockKind) {
    if (!blockText.trim()) return blockText;
    if (kind === "table" || this.looksLikeMarkdownTableBlock(blockText)) {
      return `\n${blockText}\n`;
    }
    return blockText;
  }

  private looksLikeMarkdownTableBlock(blockText: string) {
    const lines = String(blockText ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length < 2) return false;
    return this.isTableLine(lines[0]) && this.isTableLine(lines[1]);
  }

  private convertBlockToDivider(context: BlockContext) {
    const range = this.getSelectedLineRange(context.editor) ?? this.getPersistedBlockRange(context.editor, context.line);
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, "---");
    context.editor.setCursor({ line: range.startLine, ch: 3 });
    this.scheduleStyleRefresh();
  }

  private moveBlock(context: BlockContext, direction: "up" | "down") {
    const editor = context.editor;
    const current = this.getPersistedBlockRange(editor, context.line);
    const currentLines = this.readBlockLines(editor, current.startLine, current.endLine);
    if (!currentLines.length) return;

    if (direction === "up") {
      const previousLine = this.findPreviousRenderableLine(editor, current.startLine - 1);
      if (previousLine === null) {
        new Notice("已经在最上方");
        return;
      }
      const previous = this.getPersistedBlockRange(editor, previousLine);
      const previousLines = this.readBlockLines(editor, previous.startLine, previous.endLine);
      const gapLines = this.readRangeIfAny(editor, previous.endLine + 1, current.startLine - 1);
      const replacement = [...currentLines, ...gapLines, ...previousLines].join("\n");
      this.replaceBlockRange(editor, previous.startLine, current.endLine, replacement);
      context.editor.setCursor({ line: previous.startLine, ch: 0 });
      this.scheduleStyleRefresh();
      return;
    }

    const nextLine = this.findNextRenderableLine(editor, current.endLine + 1);
    if (nextLine === null) {
      new Notice("已经在最下方");
      return;
    }
    const next = this.getPersistedBlockRange(editor, nextLine);
    const nextLines = this.readBlockLines(editor, next.startLine, next.endLine);
    const gapLines = this.readRangeIfAny(editor, current.endLine + 1, next.startLine - 1);
    const replacement = [...nextLines, ...gapLines, ...currentLines].join("\n");
    this.replaceBlockRange(editor, current.startLine, next.endLine, replacement);
    context.editor.setCursor({ line: current.startLine + nextLines.length + gapLines.length, ch: 0 });
    this.scheduleStyleRefresh();
  }

  private getPersistedBlockRange(editor: any, line: number) {
    const logical = this.getLogicalBlockRange(editor, line);
    const markerInfo = this.getStyleMarkerInfo(editor, logical.startLine);
    if (!markerInfo) return logical;
    return {
      startLine: markerInfo.line,
      endLine: logical.endLine,
    };
  }

  private findPreviousRenderableLine(editor: any, startLine: number) {
    for (let line = Math.min(startLine, editor.lineCount() - 1); line >= 0; line -= 1) {
      const current = String(editor.getLine(line) ?? "");
      if (!current.trim() || this.isStyleMarkerLine(current)) continue;
      return line;
    }
    return null;
  }

  private getLogicalBlockRange(editor: any, line: number) {
    const current = String(editor.getLine(line) ?? "");
    if (this.isStyleMarkerLine(current)) {
      const nextRenderableLine = this.findNextRenderableLine(editor, line + 1);
      if (nextRenderableLine !== null) {
        return this.getLogicalBlockRange(editor, nextRenderableLine);
      }
    }
    if (this.isInsideFence(editor, line)) {
      return this.getFenceRange(editor, line);
    }

    if (this.isTableLine(current)) {
      let startLine = line;
      let endLine = line;
      while (startLine > 0 && this.isTableLine(String(editor.getLine(startLine - 1) ?? ""))) {
        startLine -= 1;
      }
      const lastLine = editor.lineCount() - 1;
      while (endLine < lastLine && this.isTableLine(String(editor.getLine(endLine + 1) ?? ""))) {
        endLine += 1;
      }
      return { startLine, endLine };
    }

    if (this.isQuoteLine(current)) {
      return this.getQuoteBlockRange(editor, line);
    }

    if (this.isListItemLine(current)) {
      return this.getListItemRange(editor, line);
    }

    if (this.isSingleLineBlock(current)) {
      return { startLine: line, endLine: line };
    }

    let startLine = line;
    let endLine = line;
    while (
      startLine > 0 &&
      String(editor.getLine(startLine - 1) ?? "").trim() &&
      !this.isStyleMarkerLine(String(editor.getLine(startLine - 1) ?? "")) &&
      !this.isStructuredBlockLine(String(editor.getLine(startLine - 1) ?? ""))
    ) {
      startLine -= 1;
    }
    const lastLine = editor.lineCount() - 1;
    while (
      endLine < lastLine &&
      String(editor.getLine(endLine + 1) ?? "").trim() &&
      !this.isStyleMarkerLine(String(editor.getLine(endLine + 1) ?? "")) &&
      !this.isStructuredBlockLine(String(editor.getLine(endLine + 1) ?? ""))
    ) {
      endLine += 1;
    }
    return { startLine, endLine };
  }

  private getBlockKind(editor: any, line: number): BlockKind {
    const current = String(editor.getLine(line) ?? "");
    if (this.isStyleMarkerLine(current)) {
      const nextRenderableLine = this.findNextRenderableLine(editor, line + 1);
      if (nextRenderableLine !== null) {
        return this.getBlockKind(editor, nextRenderableLine);
      }
    }

    if (this.isInsideFence(editor, line)) return "codeFence";
    if (this.isTableLine(current)) return "table";
    if (this.isQuoteLine(current)) {
      const quoteRange = this.getQuoteBlockRange(editor, line);
      const firstLine = String(editor.getLine(quoteRange.startLine) ?? "");
      return this.isCalloutMarkerLine(firstLine) ? "callout" : "quote";
    }
    if (this.isListItemLine(current)) return "listItem";

    const trimmed = current.trim();
    if (/^#{1,6}\s+/.test(trimmed)) return "heading";
    if (/^---+$/.test(trimmed)) return "divider";
    return "paragraph";
  }

  private isSingleLineBlock(line: string) {
    const trimmed = line.trim();
    return /^#{1,6}\s+/.test(trimmed) || /^---+$/.test(trimmed);
  }

  private isTableLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return /^\|.*\|$/.test(trimmed) || /^\|?[\s:-]+\|[\s|:-]*$/.test(trimmed);
  }

  private isQuoteLine(line: string) {
    return /^\s*>\s?/.test(String(line ?? ""));
  }

  private isCalloutMarkerLine(line: string) {
    return /^\s*>\s*\[![^\]]+\]/.test(String(line ?? ""));
  }

  private isListItemLine(line: string) {
    return /^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)/.test(String(line ?? ""));
  }

  private getLineIndent(line: string) {
    return String(line ?? "").match(/^\s*/)?.[0].length ?? 0;
  }

  private isStructuredBlockLine(line: string) {
    const trimmed = String(line ?? "").trim();
    if (!trimmed) return false;
    return (
      this.isTableLine(trimmed) ||
      /^\s*```/.test(trimmed) ||
      this.isSingleLineBlock(trimmed) ||
      this.isQuoteLine(trimmed) ||
      this.isListItemLine(trimmed)
    );
  }

  private isStyleMarkerLine(line: string) {
    return STYLE_MARKER_RE.test(String(line ?? ""));
  }

  private isInsideFence(editor: any, line: number) {
    const range = this.getFenceRange(editor, line);
    return range.startLine !== line || range.endLine !== line || /^\s*```/.test(String(editor.getLine(line) ?? ""));
  }

  private getFenceRange(editor: any, line: number) {
    let startLine = line;
    let endLine = line;
    while (startLine >= 0) {
      if (/^\s*```/.test(String(editor.getLine(startLine) ?? ""))) break;
      startLine -= 1;
    }
    if (startLine < 0) {
      return { startLine: line, endLine: line };
    }

    const lastLine = editor.lineCount() - 1;
    endLine = Math.max(line, startLine + 1);
    while (endLine <= lastLine) {
      if (/^\s*```/.test(String(editor.getLine(endLine) ?? "")) && endLine !== startLine) {
        return { startLine, endLine };
      }
      endLine += 1;
    }

    return { startLine: line, endLine: line };
  }

  private getQuoteBlockRange(editor: any, line: number) {
    let startLine = line;
    let endLine = line;
    while (startLine > 0 && this.isQuoteLine(String(editor.getLine(startLine - 1) ?? ""))) {
      startLine -= 1;
    }
    const lastLine = editor.lineCount() - 1;
    while (endLine < lastLine && this.isQuoteLine(String(editor.getLine(endLine + 1) ?? ""))) {
      endLine += 1;
    }
    return { startLine, endLine };
  }

  private getListItemRange(editor: any, line: number) {
    const baseIndent = this.getLineIndent(String(editor.getLine(line) ?? ""));
    let endLine = line;
    const lastLine = editor.lineCount() - 1;

    while (endLine < lastLine) {
      const nextLine = String(editor.getLine(endLine + 1) ?? "");
      if (!nextLine.trim() || this.isStyleMarkerLine(nextLine)) break;

      const nextIndent = this.getLineIndent(nextLine);

      if (this.isListItemLine(nextLine)) {
        if (nextIndent <= baseIndent) break;
        endLine += 1;
        continue;
      }

      if (this.isQuoteLine(nextLine) || this.isTableLine(nextLine) || /^\s*```/.test(nextLine) || this.isSingleLineBlock(nextLine)) {
        if (nextIndent <= baseIndent) break;
        endLine += 1;
        continue;
      }

      if (nextIndent > baseIndent) {
        endLine += 1;
        continue;
      }

      break;
    }

    return { startLine: line, endLine };
  }

  private readBlockLines(editor: any, startLine: number, endLine: number) {
    const lines: string[] = [];
    for (let index = startLine; index <= endLine; index += 1) {
      lines.push(String(editor.getLine(index) ?? ""));
    }
    return lines;
  }

  private readRangeIfAny(editor: any, startLine: number, endLine: number) {
    if (endLine < startLine) return [];
    return this.readBlockLines(editor, startLine, endLine);
  }

  private replaceBlockRange(editor: any, startLine: number, endLine: number, text: string) {
    const endText = String(editor.getLine(endLine) ?? "");
    editor.replaceRange(text, { line: startLine, ch: 0 }, { line: endLine, ch: endText.length });
  }

  private async copyBlockAsImage(context: BlockContext) {
    const previousHandleDisplay = this.handleEl?.style.display ?? "";
    this.hideToolbar(true);
    try {
      await this.waitForNextFrame();

      const screenshotCopied = await this.copyBlockAsImageWithMacScreenshot(context);
      if (screenshotCopied) {
        new Notice("已复制当前块为 PNG 图片");
        return;
      }

      const backgroundColor = getComputedStyle(document.body).backgroundColor || "#ffffff";
      const rect = context.blockEl.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(Math.max(context.blockEl.scrollWidth, rect.width)));
      const height = Math.max(1, Math.ceil(Math.max(context.blockEl.scrollHeight, rect.height)));
      const wrapper = this.createExportWrapper(width, height, backgroundColor);
      const clone = context.blockEl.cloneNode(true) as HTMLElement;
      clone.style.margin = "0";
      clone.style.transform = "none";
      clone.style.width = `${width}px`;
      clone.style.maxWidth = `${width}px`;
      this.stripNonContentArtifacts(clone);
      wrapper.stage.appendChild(clone);

      await this.waitForRenderSettled(wrapper.wrapper);
      const blob = await HtmlToImage.toBlob(wrapper.wrapper, {
        cacheBust: true,
        skipFonts: true,
        pixelRatio: Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO),
        backgroundColor,
      });

      if (!blob) {
        throw new Error("Failed to render block image");
      }

      await this.writeBlobToClipboard(blob);
      new Notice("已复制当前块为 PNG 图片");
    } catch (error) {
      console.error("[feishu-doc-toolbar] copy block image failed", error);
      new Notice(`复制当前块图片失败：${this.formatError(error)}`);
    } finally {
      const wrappers = document.querySelectorAll(".fdtb-export-wrapper");
      wrappers.forEach((node) => node.remove());
      if (this.handleEl) {
        this.handleEl.style.display = previousHandleDisplay;
      }
    }
  }

  private async copyBlockAsImageWithMacScreenshot(context: BlockContext) {
    const execFile = (window as any)?.require?.("child_process")?.execFile;
    if (typeof execFile !== "function") return false;
    if (!navigator.userAgent.toLowerCase().includes("mac")) return false;

    const rect = context.blockEl.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));

    const outerDeltaX = Math.max(0, window.outerWidth - window.innerWidth);
    const outerDeltaY = Math.max(0, window.outerHeight - window.innerHeight);
    const borderX = Math.round(outerDeltaX / 2);
    const titleBarY = Math.max(0, outerDeltaY - borderX);

    const screenX = Math.round(window.screenX + rect.left + borderX);
    const screenY = Math.round(window.screenY + rect.top + titleBarY);
    const region = `-R${screenX},${screenY},${width},${height}`;

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
  }

  private createExportWrapper(exportWidth: number, exportHeight: number, background: string) {
    const wrapper = document.createElement("div");
    wrapper.className = "fdtb-export-wrapper";
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
    stage.className = "fdtb-export-stage";
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
        console.warn("[feishu-doc-toolbar] navigator clipboard write failed", error);
      }
    }

    const electronClipboard = this.getElectronClipboard();
    if (!electronClipboard) {
      throw new Error("Desktop clipboard unavailable");
    }

    const { clipboard, nativeImage } = electronClipboard;
    const buffer = Buffer.from(await blob.arrayBuffer());
    clipboard.writeImage(nativeImage.createFromBuffer(buffer));
  }

  private async writeTextToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.warn("[feishu-doc-toolbar] navigator clipboard writeText failed", error);
      }
    }

    const electronClipboard = this.getElectronClipboard();
    if (!electronClipboard?.clipboard || typeof (electronClipboard.clipboard as any).writeText !== "function") {
      throw new Error("Desktop clipboard unavailable");
    }

    (electronClipboard.clipboard as any).writeText(text);
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

  private stripNonContentArtifacts(root: HTMLElement) {
    const selectors = [
      ".cm-cursor",
      ".cm-selectionLayer",
      ".cm-activeLine",
      ".cm-gutters",
      ".menu",
      ".suggestion-container",
      ".popover",
      ".fdtb-handle",
      ".fdtb-popover",
    ];

    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => element.remove());
    }
  }

  private formatError(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  private scheduleHideToolbar() {
    this.clearHideTimer();
    this.hideTimer = window.setTimeout(() => {
      if (this.isToolbarInteractionActive()) return;
      this.hideToolbar();
    }, HOVER_HIDE_DELAY_MS);
  }

  private clearHideTimer() {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private hidePopover() {
    this.hideSubmenu();
    this.popoverEl?.remove();
    this.popoverEl = null;
  }

  private hideToolbar(force = false) {
    if (!force && this.isToolbarInteractionActive()) {
      return;
    }
    this.hidePopover();
    if (this.handleEl) {
      this.handleEl.style.display = "none";
    }
    this.activeContext = null;
  }

  private isToolbarInteractionActive() {
    const activeElement = document.activeElement;
    return [this.handleEl, this.popoverEl, this.submenuEl].some((el) => {
      if (!el) return false;
      const hasFocus = !!activeElement && el.contains(activeElement);
      const hasPointer = typeof el.matches === "function" && el.matches(":hover");
      return hasFocus || hasPointer;
    });
  }
}
