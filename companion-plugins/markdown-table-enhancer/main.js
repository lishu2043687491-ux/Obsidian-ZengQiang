var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => MarkdownTableEnhancerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_state = require("@codemirror/state");
var import_view = require("@codemirror/view");
var PLUGIN_ID = "markdown-table-enhancer";
var TEMPLATE_LIBRARY_FOLDER = ".\u6A21\u677F\u5E93";
var INITIALIZE_COMMAND_ID = "initialize-current-file-table-anchors";
var INITIALIZE_COMMAND_NAME = "\u4E3A\u5F53\u524D\u6587\u4EF6\u5168\u90E8\u8868\u683C\u542F\u7528\u589E\u5F3A\uFF08\u6279\u91CF\uFF09";
var INITIALIZE_CURRENT_TABLE_COMMAND_ID = "initialize-current-table-enhancement";
var INITIALIZE_CURRENT_TABLE_COMMAND_NAME = "\u5BF9\u5F53\u524D\u8868\u542F\u7528\u589E\u5F3A";
var INITIALIZE_CURRENT_TABLE_LAYOUT_COMMAND_ID = "initialize-current-table-native-layout";
var INITIALIZE_CURRENT_TABLE_LAYOUT_COMMAND_NAME = "\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316";
var INSERT_NATIVE_COLOR_TABLE_COMMAND_ID = "insert-native-color-table-template";
var INSERT_NATIVE_COLOR_TABLE_COMMAND_NAME = "\u63D2\u5165\u5F69\u8272\u539F\u751F\u7A7A\u8868\u683C";
var SET_NATIVE_ROW_COLOR_COMMAND_ID = "set-current-native-table-row-color";
var SET_NATIVE_ROW_COLOR_COMMAND_NAME = "\u8BBE\u7F6E\u5F53\u524D\u539F\u751F\u8868\u683C\u9009\u4E2D\u884C\u989C\u8272";
var OPEN_NATIVE_ROW_BANDS_COMMAND_ID = "open-current-native-table-row-bands";
var OPEN_NATIVE_ROW_BANDS_COMMAND_NAME = "\u6253\u5F00\u5F53\u524D\u539F\u751F\u8868\u683C\u884C\u6BB5\u914D\u8272";
var INSERT_TEMPLATE_COMMAND_ID = "insert-enhanced-table-template";
var INSERT_TEMPLATE_COMMAND_NAME = "\u63D2\u5165\u589E\u5F3A\u8868\u683C\u6A21\u677F";
var OPEN_TEMPLATE_LIBRARY_COMMAND_ID = "open-template-library";
var OPEN_TEMPLATE_LIBRARY_COMMAND_NAME = "\u6A21\u677F\u5E93";
var COPY_TABLE_AS_IMAGE_LABEL = "\u590D\u5236\u5F53\u524D\u8868\u683C\u6210\u56FE";
var COPY_TABLE_AS_IMAGE_SHORT_LABEL = "\u56FE";
var RESTORE_COMMAND_ID = "restore-last-table-enhancement-snapshot";
var RESTORE_COMMAND_NAME = "\u6062\u590D\u5F53\u524D\u6587\u4EF6\u6700\u8FD1\u4E00\u6B21\u8868\u683C\u589E\u5F3A\u5FEB\u7167";
var STATUS_COMMAND_ID = "show-current-file-table-enhancement-status";
var STATUS_COMMAND_NAME = "\u67E5\u770B\u5F53\u524D\u6587\u4EF6\u8868\u683C\u589E\u5F3A\u72B6\u6001";
var SET_SELECTION_YELLOW_COMMAND_ID = "set-current-table-selection-yellow";
var SET_SELECTION_YELLOW_COMMAND_NAME = "\u5C06\u5F53\u524D\u8868\u683C\u9009\u533A\u8BBE\u4E3A\u6D45\u9EC4";
var CLEAR_SELECTION_COLOR_COMMAND_ID = "clear-current-table-selection-color";
var CLEAR_SELECTION_COLOR_COMMAND_NAME = "\u6E05\u9664\u5F53\u524D\u8868\u683C\u9009\u533A\u989C\u8272";
var MERGE_SELECTION_COMMAND_ID = "merge-current-table-selection";
var MERGE_SELECTION_COMMAND_NAME = "\u5408\u5E76\u5F53\u524D\u8868\u683C\u9009\u533A";
var SPLIT_SELECTION_COMMAND_ID = "split-current-table-cell";
var SPLIT_SELECTION_COMMAND_NAME = "\u62C6\u5206\u5F53\u524D\u8868\u683C\u5355\u5143\u683C";
var PASTE_IMAGE_COMMAND_ID = "paste-clipboard-image-to-current-table-cell";
var PASTE_IMAGE_COMMAND_NAME = "\u5C06\u526A\u8D34\u677F\u56FE\u7247\u7C98\u8D34\u5230\u5F53\u524D\u589E\u5F3A\u8868\u683C\u5355\u5143\u683C";
var PASTE_ONENOTE_RICH_TABLE_COMMAND_ID = "paste-onenote-rich-table";
var PASTE_ONENOTE_RICH_TABLE_COMMAND_NAME = "\u4ECE OneNote \u7C98\u8D34\u4E3A\u589E\u5F3A\u8868\u683C";
var TOGGLE_EXPERIMENTAL_FEATURE_GATE_COMMAND_ID = "toggle-experimental-table-features";
var TOGGLE_EXPERIMENTAL_FEATURE_GATE_COMMAND_NAME = "\u5207\u6362\u589E\u5F3A\u8868\u683C\u6D4B\u8BD5\u7248\u80FD\u529B";
var SNAPSHOT_LIMIT = 60;
var TABLE_ID_PREFIX = "tbl_";
var HTML_TABLE_MARKER_RE = /^\s*<!--\s*mdtp:(tbl_[a-z0-9_-]+)\s*-->\s*$/i;
var OBSIDIAN_TABLE_MARKER_RE = /^\s*%%\s*mdtp:(tbl_[a-z0-9_-]+)\s*%%\s*$/i;
var REFERENCE_TABLE_MARKER_RE = /^\s*\[\/\/\]:\s*#\s*\(mdtp:(tbl_[a-z0-9_-]+)\)\s*$/i;
var VISIBLE_REFERENCE_TABLE_MARKER_RE = /^\s*\/\/\s*#\s*\(mdtp:(tbl_[a-z0-9_-]+)\)\s*$/i;
var TEMPLATE_TABLE_METADATA_RE = /^\s*%%\s*mdtp-template:(\{.*\})\s*%%\s*$/i;
var PALETTE = [
  { label: "\u6D45\u9EC4", value: "#FFF3BF" },
  { label: "\u6D45\u84DD", value: "#D0EBFF" },
  { label: "\u6D45\u7EFF", value: "#D3F9D8" },
  { label: "\u6D45\u7EA2", value: "#FFE3E3" },
  { label: "\u6D45\u7070", value: "#F1F3F5" }
];
var NATIVE_COLOR_PRESET_BLUE_ZEBRA = "blueZebra";
var NATIVE_COLOR_DEFAULT_PRESET_ID = "green";
var NATIVE_COLOR_TABLE_HEADER = "#A9D18E";
var NATIVE_COLOR_TABLE_LEGACY_HEADER = "#2F5F9F";
var NATIVE_COLOR_TABLE_HEADER_TEXT = "#111111";
var NATIVE_COLOR_TABLE_BASE_ROW = "#FFFFFF";
var NATIVE_COLOR_TABLE_ALT_ROW = "#E2F0D9";
var NATIVE_LAYOUT_SECTION_LABEL = "\u2500\u2500 \u539F\u751F\u8868\u683C\u589E\u5F3A \u2500\u2500";
var NATIVE_LAYOUT_CURRENT_TABLE_LABEL = "\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316";
var NATIVE_LAYOUT_PAGE_TABLES_LABEL = "\u5BF9\u672C\u9875\u9762\u6240\u6709\u7684\u8868\u683C\u7F8E\u5316";
var NATIVE_LAYOUT_ROW_COLOR_LABEL = "\u8BBE\u7F6E\u9009\u4E2D\u884C\u989C\u8272";
var NATIVE_LAYOUT_ROW_BANDS_LABEL = "\u884C\u6BB5\u914D\u8272";
var MIN_COLUMN_WIDTH = 60;
var MIN_ROW_HEIGHT = 28;
var DRAGGER_HANDLE_SELECTOR = ".dnd-drag-handle[data-block-start]";
var HISTORY_LIMIT = 100;
var PASTE_EVENT_SUPPRESSION_MS = 2e3;
var DEFAULT_CELL_IMAGE_WIDTH = 220;
var HIDDEN_MARKER_LINE_DECORATION = import_view.Decoration.line({
  class: "mdtp-hidden-marker-line"
});
var NATIVE_COLOR_PRESET_PALETTES = {
  blue: {
    label: "\u84DD\u8272 / \u6D45\u84DD",
    header: "#9CC2E5",
    headerText: "#111111",
    baseRow: "#FFFFFF",
    altRow: "#EAF3FF",
    border: "#9FBAD8"
  },
  green: {
    label: "\u7EFF\u8272 / \u6D45\u7EFF",
    header: NATIVE_COLOR_TABLE_HEADER,
    headerText: NATIVE_COLOR_TABLE_HEADER_TEXT,
    baseRow: NATIVE_COLOR_TABLE_BASE_ROW,
    altRow: NATIVE_COLOR_TABLE_ALT_ROW,
    border: "#9EAD93"
  }
};
var NATIVE_COLOR_CUSTOM_DEFAULT = {
  header: "#A9D18E",
  headerText: "#111111",
  baseRow: "#FFFFFF",
  altRow: "#E2F0D9",
  border: "#9EAD93"
};
var DEFAULT_DATA = {
  version: 1,
  tables: {},
  snapshots: [],
  experimentalFeatureGate: false,
  nativeColorDefaultPresetId: NATIVE_COLOR_DEFAULT_PRESET_ID,
  nativeColorCustomPalette: NATIVE_COLOR_CUSTOM_DEFAULT,
  nativeColorSavedPalettes: []
};
var TemplateNameModal = class extends import_obsidian.Modal {
  constructor(plugin, templateContent) {
    super(plugin.app);
    this.plugin = plugin;
    this.templateContent = templateContent;
    __publicField(this, "hiddenMetadataPrefix");
    __publicField(this, "visibleTemplateContent");
    __publicField(this, "previewTextarea", null);
    const split = this.plugin.splitTemplateContentForPreview(templateContent);
    this.hiddenMetadataPrefix = split.hiddenPrefix;
    this.visibleTemplateContent = split.visible;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-template-modal");
    const title = document.createElement("h2");
    title.textContent = "\u4FDD\u5B58\u4E3A\u6A21\u677F";
    contentEl.appendChild(title);
    const label = document.createElement("label");
    label.className = "mdtp-template-field";
    const labelText = document.createElement("span");
    labelText.textContent = "\u6A21\u677F\u540D\u79F0";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "\u4F8B\u5982\uFF1A\u5468\u8BA1\u5212\u8868\u683C";
    input.className = "mdtp-template-input";
    label.append(labelText, input);
    contentEl.appendChild(label);
    const previewLabel = document.createElement("label");
    previewLabel.className = "mdtp-template-field";
    const previewLabelText = document.createElement("span");
    previewLabelText.textContent = "\u6A21\u677F\u5185\u5BB9\uFF08\u53EF\u7F16\u8F91\uFF09";
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
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.addEventListener("click", () => this.close());
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "mod-cta";
    saveButton.textContent = "\u4FDD\u5B58";
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
  async submit(rawName) {
    const name = rawName.trim();
    if (!name) {
      new import_obsidian.Notice("\u8BF7\u5148\u586B\u5199\u6A21\u677F\u540D\u79F0");
      return;
    }
    const visibleValue = this.previewTextarea?.value ?? this.visibleTemplateContent;
    const finalContent = this.plugin.combineTemplateContentForSave(this.hiddenMetadataPrefix, visibleValue);
    const created = await this.plugin.createTemplateFromContent(name, finalContent);
    if (created) this.close();
  }
};
var TemplateCreateModal = class extends import_obsidian.Modal {
  constructor(plugin, onCreated) {
    super(plugin.app);
    this.plugin = plugin;
    this.onCreated = onCreated;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-template-modal");
    const title = document.createElement("h2");
    title.textContent = "\u65B0\u5EFA\u6A21\u677F";
    contentEl.appendChild(title);
    const nameLabel = document.createElement("label");
    nameLabel.className = "mdtp-template-field";
    const nameText = document.createElement("span");
    nameText.textContent = "\u6A21\u677F\u540D\u79F0";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "\u4F8B\u5982\uFF1A\u5468\u8BA1\u5212/\u590D\u76D8\u6A21\u677F";
    input.className = "mdtp-template-input";
    nameLabel.append(nameText, input);
    contentEl.appendChild(nameLabel);
    const contentLabel = document.createElement("label");
    contentLabel.className = "mdtp-template-field";
    const contentText = document.createElement("span");
    contentText.textContent = "\u6A21\u677F\u5185\u5BB9";
    const textarea = document.createElement("textarea");
    textarea.className = "mdtp-template-editor";
    textarea.placeholder = "\u53EF\u4EE5\u5148\u5199\u6A21\u677F\u5185\u5BB9\uFF1B\u4E5F\u53EF\u4EE5\u7559\u7A7A\uFF0C\u65B0\u5EFA\u540E\u518D\u7F16\u8F91\u3002";
    contentLabel.append(contentText, textarea);
    contentEl.appendChild(contentLabel);
    const actions = document.createElement("div");
    actions.className = "mdtp-template-actions";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.addEventListener("click", () => this.close());
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "mod-cta";
    saveButton.textContent = "\u521B\u5EFA";
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
  async submit(rawName, rawContent) {
    const created = await this.plugin.createTemplateFromModalInput(rawName, rawContent);
    if (!created) return;
    await this.onCreated?.();
    this.close();
  }
};
var TemplateLibraryModal = class extends import_obsidian.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  async onOpen() {
    this.contentEl.classList.add("mdtp-template-modal");
    await this.render();
  }
  onClose() {
    this.contentEl.replaceChildren();
  }
  getFeishuToolbarPlugin() {
    const id = "feishu-doc-toolbar";
    return this.plugin.app?.plugins?.plugins?.[id] ?? null;
  }
  async render() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    const title = document.createElement("h2");
    title.textContent = "\u6A21\u677F\u5E93";
    contentEl.appendChild(title);
    const hint = document.createElement("p");
    hint.className = "mdtp-template-hint";
    hint.textContent = "\u6A21\u677F\u4FDD\u5B58\u5728\u9690\u85CF\u6587\u4EF6\u5939\u4E2D\uFF0C\u4E0D\u4F1A\u5360\u7528\u4E3B\u76EE\u5F55\u3002";
    contentEl.appendChild(hint);
    const feishu = this.getFeishuToolbarPlugin();
    const canBridge = !!feishu && typeof feishu.buildFullTemplateTree === "function";
    const toolbar = document.createElement("div");
    toolbar.className = "mdtp-template-toolbar";
    const createButton = document.createElement("button");
    createButton.type = "button";
    createButton.className = "mod-cta";
    createButton.textContent = "\u65B0\u5EFA\u6A21\u677F";
    createButton.addEventListener("click", () => {
      new TemplateCreateModal(this.plugin, () => this.render()).open();
    });
    toolbar.appendChild(createButton);
    if (canBridge && typeof feishu.createTemplateSubfolder === "function") {
      const createGroupButton = document.createElement("button");
      createGroupButton.type = "button";
      createGroupButton.textContent = "\u65B0\u5EFA\u5206\u7EC4";
      createGroupButton.addEventListener("click", () => {
        this.beginInlineRename(createGroupButton, {
          initial: "",
          placeholder: "\u5206\u7EC4\u540D\u79F0\uFF0C\u4F8B\u5982\u300C\u590D\u76D8\u300D\u6216\u300C\u5DE5\u4F5C/\u590D\u76D8\u300D",
          onCommit: async (value) => {
            const ok = await feishu.createTemplateSubfolder(value);
            if (ok) await this.render();
          }
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
      empty.textContent = "\u8FD8\u6CA1\u6709\u6A21\u677F\u3002\u53EF\u4EE5\u5148\u9009\u4E2D\u5185\u5BB9\u53F3\u952E\u4FDD\u5B58\u4E3A\u6A21\u677F\uFF0C\u4E5F\u53EF\u4EE5\u65B0\u5EFA\u7A7A\u6A21\u677F\u540E\u7F16\u8F91\u3002";
      contentEl.appendChild(empty);
      return;
    }
    const list = document.createElement("div");
    list.className = "mdtp-template-list";
    const tree = this.buildTemplateTree(templates);
    this.appendTemplateTree(list, tree, 0);
    contentEl.appendChild(list);
  }
  async renderBridgedTree(contentEl, feishu) {
    let tree;
    let groupOptions;
    try {
      tree = await feishu.buildFullTemplateTree();
      groupOptions = typeof feishu.getTemplateGroupMoveOptions === "function" ? await feishu.getTemplateGroupMoveOptions() : [{ value: "", label: this.getUngroupedLabel(feishu) }];
    } catch (error) {
      console.warn("[mdte] bridged template tree failed", error);
      const fallback = document.createElement("div");
      fallback.className = "mdtp-template-empty";
      fallback.textContent = "\u8BFB\u53D6\u6A21\u677F\u5E93\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002";
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
      empty.textContent = "\u8FD8\u6CA1\u6709\u6A21\u677F\u6216\u5206\u7EC4\u3002\u53EF\u4EE5\u300C\u65B0\u5EFA\u5206\u7EC4\u300D\u3001\u300C\u65B0\u5EFA\u6A21\u677F\u300D\u6216\u53F3\u952E\u4FDD\u5B58\u5F53\u524D\u5185\u5BB9\u3002";
      contentEl.appendChild(empty);
      return;
    }
    this.renderUngroupedSection(list, tree, groupOptions, feishu);
    const folders = Array.from(tree.folders.entries()).sort(
      ([a], [b]) => String(a).localeCompare(String(b), "zh-Hans-CN")
    );
    for (const [folderName, child] of folders) {
      this.renderFolderSection(list, String(folderName), child, String(folderName), groupOptions, feishu);
    }
    contentEl.appendChild(list);
  }
  getUngroupedLabel(feishu) {
    if (feishu && typeof feishu.getTemplateUngroupedLabel === "function") {
      try {
        return feishu.getTemplateUngroupedLabel();
      } catch {
      }
    }
    return "\u672A\u5206\u7EC4";
  }
  sortTemplates(feishu, list) {
    if (feishu && typeof feishu.sortTemplateDescriptors === "function") {
      try {
        return feishu.sortTemplateDescriptors(list);
      } catch {
      }
    }
    return [...list];
  }
  renderUngroupedSection(container, root, groupOptions, feishu) {
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
      renameBtn.textContent = "\u6539\u540D";
      renameBtn.title = "\u4FEE\u6539\u300C\u672A\u5206\u7EC4\u300D\u5728\u754C\u9762\u4E0A\u7684\u663E\u793A\u540D\u79F0\uFF08\u4E0D\u79FB\u52A8\u6587\u4EF6\uFF09";
      renameBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.beginInlineRename(titleText, {
          initial: this.getUngroupedLabel(feishu),
          onCommit: async (value) => {
            await feishu.setTemplateUngroupedLabel(value);
            await this.render();
          }
        });
      });
      titleWrap.appendChild(renameBtn);
    }
    if (typeof feishu.deleteUngroupedTemplateGroup === "function") {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "mdtp-template-folder-delete-btn";
      deleteBtn.textContent = "\u5220\u9664";
      deleteBtn.title = "\u65E0\u6A21\u677F\u65F6\u6062\u590D\u9ED8\u8BA4\u540D\u79F0\u300C\u672A\u5206\u7EC4\u300D\uFF1B\u6709\u6A21\u677F\u65F6\u5220\u9664\u6839\u76EE\u5F55\u5168\u90E8\u6A21\u677F";
      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void feishu.deleteUngroupedTemplateGroup().then((ok) => {
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
      note.textContent = "\u6839\u76EE\u5F55\u6682\u65E0\u6A21\u677F\u3002\u53EF\u7528\u6BCF\u884C\u300C\u79FB\u5230\u300D\u628A\u5176\u4ED6\u5206\u7EC4\u7684\u6A21\u677F\u8FC1\u56DE\u8FD9\u91CC\u3002";
      body.appendChild(note);
    } else {
      for (const template of this.sortTemplates(feishu, root.templates)) {
        body.appendChild(this.createTemplateRow(template, groupOptions, feishu));
      }
    }
    group.appendChild(body);
    container.appendChild(group);
  }
  renderFolderSection(container, folderName, node, relativePath, groupOptions, feishu) {
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
      renameBtn.textContent = "\u6539\u540D";
      renameBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.beginInlineRename(titleText, {
          initial: folderName,
          onCommit: async (value) => {
            const ok = await feishu.renameTemplateGroup(relativePath, value);
            if (ok) await this.render();
          }
        });
      });
      titleWrap.appendChild(renameBtn);
    }
    if (typeof feishu.deleteTemplateGroup === "function") {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "mdtp-template-folder-delete-btn";
      deleteBtn.textContent = "\u5220\u9664";
      deleteBtn.title = "\u5220\u9664\u5206\u7EC4\uFF1B\u7EC4\u5185\u6A21\u677F\u5C06\u79FB\u81F3\u6839\u76EE\u5F55";
      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void feishu.deleteTemplateGroup(relativePath).then((ok) => {
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
      note.textContent = "\u5206\u7EC4\u5DF2\u521B\u5EFA\uFF0C\u6682\u65E0\u6A21\u677F\u3002\u53EF\u5728\u4E0A\u65B9\u300C\u65B0\u5EFA\u6A21\u677F\u300D\u586B\u5199\u300C\u5206\u7EC4\u540D/\u6A21\u677F\u540D\u300D\uFF0C\u6216\u628A\u5176\u4ED6\u6A21\u677F\u79FB\u5165\u672C\u5206\u7EC4\u3002";
      body.appendChild(note);
    }
    for (const template of this.sortTemplates(feishu, node.templates)) {
      body.appendChild(this.createTemplateRow(template, groupOptions, feishu));
    }
    const nested = Array.from(node.folders.entries()).sort(
      ([a], [b]) => String(a).localeCompare(String(b), "zh-Hans-CN")
    );
    for (const [childName, childNode] of nested) {
      const childRel = `${relativePath}/${String(childName)}`;
      this.renderFolderSection(body, String(childName), childNode, childRel, groupOptions, feishu);
    }
    group.appendChild(body);
    container.appendChild(group);
  }
  beginInlineRename(anchor, options) {
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
    const finish = async (commit) => {
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
  buildTemplateTree(templates) {
    const root = { folders: /* @__PURE__ */ new Map(), templates: [] };
    for (const template of templates) {
      let node = root;
      for (const segment of template.folderSegments) {
        if (!node.folders.has(segment)) {
          node.folders.set(segment, { folders: /* @__PURE__ */ new Map(), templates: [] });
        }
        node = node.folders.get(segment);
      }
      node.templates.push(template);
    }
    return root;
  }
  appendTemplateTree(container, node, depth) {
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
  createTemplateRow(template, groupOptions, feishu) {
    const row = document.createElement("div");
    row.className = "mdtp-template-row";
    const name = document.createElement("div");
    name.className = "mdtp-template-name";
    const displayName = template.name ?? template.title ?? "";
    name.textContent = displayName;
    name.title = template.relativePath ?? template.path ?? displayName;
    const actions = document.createElement("div");
    actions.className = "mdtp-template-row-actions";
    if (groupOptions && feishu && typeof feishu.moveTemplateToGroup === "function") {
      const moveWrap = document.createElement("label");
      moveWrap.className = "mdtp-template-move-wrap";
      moveWrap.title = "\u79FB\u5230\u5176\u4ED6\u5206\u7EC4";
      const moveLabel = document.createElement("span");
      moveLabel.className = "mdtp-template-move-label";
      moveLabel.textContent = "\u79FB\u5230";
      const moveSelect = document.createElement("select");
      moveSelect.className = "mdtp-template-move-select";
      const segments = Array.isArray(template.folderSegments) ? template.folderSegments : [];
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
    insertButton.textContent = "\u63D2\u5165";
    insertButton.addEventListener("click", async () => {
      const inserted = await this.plugin.insertTemplateByPath(template.path);
      if (inserted) this.close();
    });
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "\u7F16\u8F91";
    editButton.addEventListener("click", async () => {
      this.close();
      await this.plugin.openTemplateForEdit(template.path);
    });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mdtp-template-delete-button";
    deleteButton.textContent = "\u5220\u9664";
    deleteButton.setAttribute("aria-label", `\u5220\u9664\u6A21\u677F\uFF1A${displayName}`);
    deleteButton.addEventListener("click", async () => {
      const deleted = await this.plugin.deleteTemplateByPath(template.path);
      if (deleted) await this.render();
    });
    actions.append(insertButton, editButton, deleteButton);
    row.append(name, actions);
    return row;
  }
};
var TemplateEditModal = class extends import_obsidian.Modal {
  constructor(plugin, template) {
    super(plugin.app);
    this.plugin = plugin;
    this.template = template;
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-template-modal");
    const title = document.createElement("h2");
    title.textContent = `\u7F16\u8F91\u6A21\u677F\uFF1A${this.template.name}`;
    contentEl.appendChild(title);
    const textarea = document.createElement("textarea");
    textarea.className = "mdtp-template-editor";
    textarea.value = await this.plugin.readTemplateContent(this.template.path);
    contentEl.appendChild(textarea);
    const actions = document.createElement("div");
    actions.className = "mdtp-template-actions";
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "\u53D6\u6D88";
    cancelButton.addEventListener("click", () => this.close());
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "mod-cta";
    saveButton.textContent = "\u4FDD\u5B58";
    saveButton.addEventListener("click", async () => {
      await this.plugin.writeTemplateContent(this.template.path, textarea.value);
      new import_obsidian.Notice("\u6A21\u677F\u5DF2\u66F4\u65B0");
      this.close();
    });
    actions.append(cancelButton, saveButton);
    contentEl.appendChild(actions);
    window.setTimeout(() => textarea.focus(), 50);
  }
  onClose() {
    this.contentEl.replaceChildren();
  }
};
var OneNoteRichPasteModal = class extends import_obsidian.Modal {
  constructor(plugin, file) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.replaceChildren();
    contentEl.classList.add("mdtp-onenote-paste-modal");
    const title = document.createElement("h2");
    title.textContent = "\u7C98\u8D34 OneNote \u589E\u5F3A\u8868\u683C";
    contentEl.appendChild(title);
    const hint = document.createElement("p");
    hint.textContent = "\u4ECE OneNote \u590D\u5236\u9875\u9762\u6216\u8868\u683C\u540E\uFF0C\u70B9\u4E0B\u9762\u533A\u57DF\u6309 \u2318V \u7C98\u8D34\uFF0C\u63D2\u4EF6\u4F1A\u76F4\u63A5\u8F6C\u6210\u53EF\u7F16\u8F91\u589E\u5F3A\u8868\u683C\u3002";
    contentEl.appendChild(hint);
    const pasteZone = document.createElement("div");
    pasteZone.className = "mdtp-onenote-paste-zone";
    pasteZone.tabIndex = 0;
    pasteZone.setAttribute("contenteditable", "true");
    pasteZone.setAttribute("role", "textbox");
    pasteZone.setAttribute("aria-label", "\u7C98\u8D34 OneNote \u5185\u5BB9");
    pasteZone.textContent = "\u5728\u8FD9\u91CC\u7C98\u8D34";
    pasteZone.addEventListener("focus", () => {
      if (pasteZone.textContent === "\u5728\u8FD9\u91CC\u7C98\u8D34") {
        pasteZone.textContent = "";
      }
    });
    pasteZone.addEventListener("paste", (event) => void this.handlePaste(event));
    contentEl.appendChild(pasteZone);
    window.setTimeout(() => pasteZone.focus(), 50);
  }
  onClose() {
    this.contentEl.replaceChildren();
  }
  async handlePaste(event) {
    event.preventDefault();
    event.stopPropagation();
    const ok = await this.plugin.importOneNoteRichClipboardEvent(this.file, event);
    if (ok) {
      this.close();
    }
  }
};
var NativeRowBandColorModal = class extends import_obsidian.Modal {
  constructor(plugin, file, tableId, tableEl) {
    super(plugin.app);
    this.plugin = plugin;
    this.file = file;
    this.tableId = tableId;
    this.tableEl = tableEl;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mdtp-template-modal");
    contentEl.createEl("h2", { text: "\u884C\u6BB5\u914D\u8272" });
    contentEl.createEl("p", {
      text: "\u6309\u884C\u53F7\u6279\u91CF\u8BBE\u7F6E\u5E95\u8272\u3002\u8868\u5934\u662F\u7B2C 0 \u884C\uFF0C\u6B63\u6587\u4ECE\u7B2C 1 \u884C\u5F00\u59CB\u3002",
      cls: "setting-item-description"
    });
    const rowCount = Math.max(1, this.tableEl.rows.length);
    const palette = this.plugin.getNativeRowColorChoicesForTable(this.tableId);
    const controls = contentEl.createDiv({ cls: "mdtp-row-band-controls" });
    const startInput = controls.createEl("input", { type: "number", attr: { min: "0", max: String(rowCount - 1), value: "1" } });
    const endInput = controls.createEl("input", { type: "number", attr: { min: "0", max: String(rowCount - 1), value: "1" } });
    const colorInput = controls.createEl("input", { type: "color" });
    colorInput.value = palette[0]?.value ?? NATIVE_COLOR_TABLE_ALT_ROW;
    const applyBtn = controls.createEl("button", { text: "\u5E94\u7528\u5230\u884C\u6BB5" });
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
      row.createEl("span", { text: rowIndex === 0 ? "\u8868\u5934 0" : `\u6B63\u6587 ${rowIndex}` });
      const rowColorInput = row.createEl("input", { type: "color" });
      rowColorInput.value = this.plugin.getNativeLayoutResolvedRowColor(this.tableId, rowIndex);
      rowColorInput.addEventListener("change", () => {
        void this.plugin.setNativeLayoutRowRangeColor(this.tableId, this.file, this.tableEl, rowIndex, rowIndex, rowColorInput.value);
      });
      const clearBtn = row.createEl("button", { text: "\u6062\u590D\u9ED8\u8BA4" });
      clearBtn.addEventListener("click", () => {
        void this.plugin.setNativeLayoutRowRangeColor(this.tableId, this.file, this.tableEl, rowIndex, rowIndex, null);
      });
    }
  }
  normalizeRowIndex(value, fallback, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.min(max, parsed));
  }
};
var MarkdownTableEnhancerPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "dataStore", DEFAULT_DATA);
    __publicField(this, "runtimeState", /* @__PURE__ */ new Map());
    __publicField(this, "activeResize", null);
    __publicField(this, "activeSelectionDrag", null);
    __publicField(this, "refreshTimer", null);
    __publicField(this, "lastTableContext", null);
    __publicField(this, "refreshBurstToken", 0);
    __publicField(this, "injectedStyleEl", null);
    __publicField(this, "activeEditor", null);
    __publicField(this, "activeNativeTableContext", null);
    __publicField(this, "tableSidebarHandleEl", null);
    __publicField(this, "tableCopyImageHandleEl", null);
    __publicField(this, "tableSidebarPopoverEl", null);
    __publicField(this, "activeTableSidebarContext", null);
    __publicField(this, "activeImageToolbar", null);
    __publicField(this, "activeImageManipulator", null);
    __publicField(this, "activeImageDrag", null);
    __publicField(this, "undoStack", []);
    __publicField(this, "redoStack", []);
    __publicField(this, "historyApplying", false);
    __publicField(this, "suppressDocumentPasteUntil", 0);
    __publicField(this, "oneNoteStatusButtonEl", null);
  }
  async onload() {
    await this.installRuntimeStyles();
    this.registerEditorExtension(this.createHiddenMarkerEditorExtension());
    const savedData = await this.loadData();
    const savedTables = Object.fromEntries(
      Object.entries(savedData?.tables ?? {}).map(([tableId, record]) => [tableId, this.normalizeLoadedTableRecord(record)])
    );
    const savedNativeColorPalettes = this.normalizeNativeColorSavedPalettes(savedData?.nativeColorSavedPalettes);
    this.dataStore = {
      ...DEFAULT_DATA,
      ...savedData ?? {},
      tables: {
        ...DEFAULT_DATA.tables,
        ...savedTables
      },
      snapshots: Array.isArray(savedData?.snapshots) ? savedData.snapshots : [],
      experimentalFeatureGate: !!savedData?.experimentalFeatureGate,
      nativeColorSavedPalettes: savedNativeColorPalettes,
      nativeColorDefaultPresetId: this.normalizeNativeColorPresetId(savedData?.nativeColorDefaultPresetId, savedNativeColorPalettes),
      nativeColorCustomPalette: this.normalizeNativeColorPalette(savedData?.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT)
    };
    await this.migrateLegacyMarkersToHtmlComments();
    this.addCommand({
      id: INITIALIZE_COMMAND_ID,
      name: INITIALIZE_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.initializeCurrentFileTables(file);
        }
        return true;
      }
    });
    this.addCommand({
      id: INITIALIZE_CURRENT_TABLE_COMMAND_ID,
      name: INITIALIZE_CURRENT_TABLE_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.initializeCurrentTable();
        }
        return true;
      }
    });
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
      }
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
      }
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
      }
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
      }
    });
    this.addCommand({
      id: INSERT_TEMPLATE_COMMAND_ID,
      name: INSERT_TEMPLATE_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.insertEnhancedTableTemplate();
        }
        return true;
      }
    });
    this.addCommand({
      id: OPEN_TEMPLATE_LIBRARY_COMMAND_ID,
      name: OPEN_TEMPLATE_LIBRARY_COMMAND_NAME,
      callback: () => {
        this.openTemplateLibraryModal();
      }
    });
    this.addRibbonIcon("copy", OPEN_TEMPLATE_LIBRARY_COMMAND_NAME, () => {
      this.openTemplateLibraryModal();
    });
    this.addCommand({
      id: RESTORE_COMMAND_ID,
      name: RESTORE_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.restoreLatestSnapshot(file);
        }
        return true;
      }
    });
    this.addCommand({
      id: STATUS_COMMAND_ID,
      name: STATUS_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.showCurrentFileStatus(file);
        }
        return true;
      }
    });
    this.addCommand({
      id: SET_SELECTION_YELLOW_COMMAND_ID,
      name: SET_SELECTION_YELLOW_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const context = this.getActiveSelectionCommandContext(checking);
        if (!context) return false;
        if (!checking) {
          void this.setColor(context.tableId, context.file, context.tableEl, "cell", this.getCellKey(context.anchor), PALETTE[0].value);
        }
        return true;
      }
    });
    this.addCommand({
      id: CLEAR_SELECTION_COLOR_COMMAND_ID,
      name: CLEAR_SELECTION_COLOR_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const context = this.getActiveSelectionCommandContext(checking);
        if (!context) return false;
        if (!checking) {
          void this.clearColor(
            context.tableId,
            context.file,
            context.tableEl,
            "cell",
            this.getCellKey(context.anchor)
          );
        }
        return true;
      }
    });
    this.addCommand({
      id: MERGE_SELECTION_COMMAND_ID,
      name: MERGE_SELECTION_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const context = this.getActiveSelectionCommandContext(checking);
        if (!context?.selection) return false;
        if (context.selection.startRow === context.selection.endRow && context.selection.startCol === context.selection.endCol) {
          return false;
        }
        if (!this.canMergeSelection(context.tableEl, this.dataStore.tables[context.tableId].layout, context.selection)) {
          return false;
        }
        if (!checking) {
          void this.mergeSelection(context.file, context.tableId, context.tableEl, context.selection);
        }
        return true;
      }
    });
    this.addCommand({
      id: SPLIT_SELECTION_COMMAND_ID,
      name: SPLIT_SELECTION_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const context = this.getActiveSelectionCommandContext(checking);
        if (!context) return false;
        const merge = this.dataStore.tables[context.tableId].layout.merges.find(
          (item) => item.row === context.anchor.row && item.col === context.anchor.col
        );
        if (!merge) return false;
        if (!checking) {
          void this.splitMerge(context.file, context.tableId, context.tableEl, merge);
        }
        return true;
      }
    });
    this.addCommand({
      id: PASTE_IMAGE_COMMAND_ID,
      name: PASTE_IMAGE_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const context = this.getActiveSelectionCommandContext(checking);
        if (!context) return false;
        if (!checking) {
          void this.handleClipboardPasteForSelectedCell(context.file, context.tableId, context.anchor);
        }
        return true;
      }
    });
    this.addCommand({
      id: PASTE_ONENOTE_RICH_TABLE_COMMAND_ID,
      name: PASTE_ONENOTE_RICH_TABLE_COMMAND_NAME,
      checkCallback: (checking) => {
        if (!this.isExperimentalFeatureEnabled()) return false;
        const file = this.getActiveMarkdownFile(checking);
        if (!file) return false;
        if (!checking) {
          void this.pasteOneNoteFromSystemClipboardOrOpenModal(file);
        }
        return true;
      }
    });
    this.oneNoteStatusButtonEl = this.addStatusBarItem();
    this.oneNoteStatusButtonEl.addClass("mdtp-onenote-status-button");
    this.oneNoteStatusButtonEl.setText("\u7C98\u8D34 OneNote");
    this.oneNoteStatusButtonEl.setAttr("role", "button");
    this.oneNoteStatusButtonEl.setAttr("aria-label", "\u4ECE OneNote \u7C98\u8D34\u4E3A\u589E\u5F3A\u8868\u683C");
    this.oneNoteStatusButtonEl.style.display = "none";
    this.oneNoteStatusButtonEl.addEventListener("click", () => {
      const file = this.getActiveMarkdownFile();
      if (!file) {
        new import_obsidian.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u7B14\u8BB0");
        return;
      }
      void this.pasteOneNoteFromSystemClipboardOrOpenModal(file);
    });
    this.addCommand({
      id: TOGGLE_EXPERIMENTAL_FEATURE_GATE_COMMAND_ID,
      name: TOGGLE_EXPERIMENTAL_FEATURE_GATE_COMMAND_NAME,
      callback: () => void this.toggleExperimentalFeatureGate()
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
        if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") return;
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile?.path !== file.path) return;
        this.queueRefreshBurst();
      })
    );
    this.registerDomEvent(document, "pointerdown", (event) => this.handleDocumentPointerDown(event), true);
    this.registerDomEvent(document, "click", (event) => void this.handleDocumentClick(event), true);
    this.registerDomEvent(document, "dblclick", (event) => void this.handleDocumentDoubleClick(event), true);
    this.registerDomEvent(document, "contextmenu", (event) => void this.handleDocumentContextMenu(event), true);
    this.registerDomEvent(document, "keydown", (event) => void this.handleDocumentKeyDown(event), true);
    this.registerDomEvent(document, "paste", (event) => void this.handleDocumentPaste(event), true);
    this.registerDomEvent(document, "pointermove", (event) => this.handleGlobalPointerMove(event), true);
    this.registerDomEvent(document, "pointerup", () => void this.handleGlobalPointerUp(), true);
    this.registerDomEvent(document, "pointercancel", () => void this.handleGlobalPointerUp(), true);
    this.queueRefreshBurst();
  }
  async migrateLegacyMarkersToHtmlComments() {
    const markdownFiles = this.app.vault.getMarkdownFiles();
    for (const file of markdownFiles) {
      const originalContent = await this.app.vault.cachedRead(file);
      if (!originalContent.includes("[//]: # (mdtp:") && !originalContent.includes("// # (mdtp:") && !originalContent.includes("<!-- mdtp:")) {
        continue;
      }
      const originalEndsWithNewline = /\r?\n$/.test(originalContent);
      const lines = originalContent.split(/\r?\n/);
      const markerIds = [];
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
  onunload() {
    void this.closeActiveEditor("cancel");
    this.hideImageToolbar();
    this.hideImageManipulator();
    this.activeImageDrag = null;
    this.injectedStyleEl?.remove();
    this.injectedStyleEl = null;
  }
  getActiveMarkdownFile(silent = false) {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") {
      if (!silent) {
        new import_obsidian.Notice("\u5F53\u524D\u6CA1\u6709\u6253\u5F00 Markdown \u6587\u4EF6");
      }
      return null;
    }
    return file;
  }
  getActiveInteractionContext(silent = false) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view?.file || !(view.contentEl instanceof HTMLElement)) {
      if (!silent) new import_obsidian.Notice("\u5F53\u524D\u6CA1\u6709\u6253\u5F00 Markdown \u8868\u683C\u89C6\u56FE");
      return null;
    }
    let tableEl = null;
    let anchorCell = view.contentEl.querySelector(
      "table.mdtp-table-shell .mdtp-cell-anchor"
    );
    if (anchorCell) {
      tableEl = anchorCell.closest("table.mdtp-table-shell");
    }
    let runtime = tableEl ? this.runtimeState.get(tableEl) ?? null : null;
    let anchor = anchorCell ? this.getCellCoord(anchorCell) : null;
    if (!tableEl || !runtime || !anchor) {
      const focusedElement = document.activeElement;
      const candidateTables = Array.from(
        view.contentEl.querySelectorAll("table.mdtp-table-shell")
      );
      let fallbackTable = focusedElement?.closest("table.mdtp-table-shell");
      if (!fallbackTable || !candidateTables.includes(fallbackTable)) {
        fallbackTable = candidateTables.find((candidate) => {
          const candidateRuntime = this.runtimeState.get(candidate);
          return !!candidateRuntime?.anchor;
        }) ?? null;
      }
      if (!fallbackTable) {
        if (!silent) new import_obsidian.Notice("\u5F53\u524D\u6CA1\u6709\u9009\u4E2D\u8868\u683C\u5355\u5143\u683C");
        return null;
      }
      tableEl = fallbackTable;
      runtime = this.runtimeState.get(tableEl) ?? null;
      anchor = runtime?.anchor ?? null;
      if (!runtime || !anchor) {
        if (!silent) new import_obsidian.Notice("\u5F53\u524D\u8868\u683C\u9009\u533A\u72B6\u6001\u4E0D\u53EF\u7528");
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
      selection: runtime.selection
    };
  }
  getPlainTableCellCoord(cell) {
    const rowEl = cell.parentElement;
    if (!(rowEl instanceof HTMLTableRowElement)) return null;
    const row = rowEl.rowIndex;
    const col = cell.cellIndex;
    if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || col < 0) return null;
    return { row, col };
  }
  /** Resolve a plain (non-mdtp-shell) markdown table from click/right-click target, including Obsidian Table Widget. */
  resolvePlainMarkdownTableFromTarget(target) {
    if (!target) return null;
    if (target.closest(".mdtp-table-shell")) return null;
    let cell = target.closest("th, td");
    let tableEl = cell?.closest("table");
    if (!tableEl) {
      tableEl = target.closest("table") ?? target.closest(".cm-table-widget")?.querySelector("table");
      if (tableEl && !cell) {
        cell = target.closest("th, td") ?? tableEl.querySelector("th, td");
      }
    }
    if (!tableEl || tableEl.matches(".mdtp-table-shell")) return null;
    const coord = cell ? this.getPlainTableCellCoord(cell) : null;
    return { tableEl, cell, coord };
  }
  async getTargetUninitializedTableContext(target) {
    const focusTarget = target ?? document.activeElement;
    if (!focusTarget) return null;
    const resolved = this.resolvePlainMarkdownTableFromTarget(focusTarget);
    if (!resolved) return null;
    const view = this.getContainingMarkdownView(focusTarget);
    if (!view?.file || !(view.contentEl instanceof HTMLElement)) return null;
    const renderedTables = Array.from(view.contentEl.querySelectorAll("table"));
    const tableIndex = renderedTables.indexOf(resolved.tableEl);
    if (tableIndex < 0) return null;
    const parsedTables = this.parseMarkdownTables(await this.app.vault.cachedRead(view.file));
    const parsedTable = parsedTables[tableIndex] ?? null;
    if (!parsedTable || parsedTable.tableId) return null;
    const coord = resolved.coord ?? { row: 0, col: 0 };
    return {
      file: view.file,
      parsedTable,
      coord,
      tableEl: resolved.tableEl
    };
  }
  async getActiveUninitializedTableContext(target) {
    const targetContext = await this.getTargetUninitializedTableContext(target);
    if (targetContext) return targetContext;
    const focusTarget = target ?? document.activeElement;
    if (focusTarget) {
      const resolved = this.resolvePlainMarkdownTableFromTarget(focusTarget);
      if (resolved) {
        const view = this.getContainingMarkdownView(focusTarget);
        if (view?.file && view.contentEl instanceof HTMLElement) {
          const renderedTables = Array.from(view.contentEl.querySelectorAll("table"));
          const tableIndex = renderedTables.indexOf(resolved.tableEl);
          if (tableIndex >= 0) {
            const parsedTables = this.parseMarkdownTables(await this.app.vault.cachedRead(view.file));
            const parsedTable = parsedTables[tableIndex] ?? null;
            if (parsedTable && !parsedTable.tableId) {
              return {
                file: view.file,
                parsedTable,
                coord: resolved.coord ?? { row: 0, col: 0 },
                tableEl: resolved.tableEl
              };
            }
          }
        }
      }
    }
    return this.getCursorBasedUninitializedTableContext();
  }
  async getCursorBasedUninitializedTableContext() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const file = view?.file;
    const editor = view?.editor;
    if (!file || typeof editor?.getCursor !== "function") return null;
    const cursor = editor.getCursor();
    if (!cursor || !Number.isFinite(cursor.line) || !Number.isFinite(cursor.ch)) return null;
    const content = await this.app.vault.cachedRead(file);
    const parsedTables = this.parseMarkdownTables(content).filter((table) => !table.tableId);
    const parsedTable = parsedTables.find((table) => cursor.line >= table.startLine && cursor.line <= table.endLine) ?? null;
    if (!parsedTable) return null;
    if (cursor.line === parsedTable.startLine + 1) {
      return null;
    }
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return null;
    const lineText = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : content.split(/\r?\n/)[cursor.line] ?? "";
    const col = this.resolveCursorTableColumn(lineText, cursor.ch, rawTable.header.length);
    if (col === null) return null;
    const row = cursor.line === parsedTable.startLine ? 0 : cursor.line - parsedTable.startLine - 1;
    if (row < 0) return null;
    return {
      file,
      parsedTable,
      coord: { row, col },
      tableEl: null
    };
  }
  resolveCursorTableColumn(line, cursorCh, expectedLength) {
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
  getActiveSelectionCommandContext(silent = false) {
    const context = this.getActiveInteractionContext(silent);
    if (!context) return null;
    if (!context.tableId) {
      if (!silent) new import_obsidian.Notice("\u5F53\u524D\u8868\u683C\u8FD8\u6CA1\u6709\u542F\u7528\u589E\u5F3A");
      return null;
    }
    return context;
  }
  getActiveNativeLayoutCommandContext(silent = false) {
    const context = this.getActiveInteractionContext(silent);
    if (!context) return null;
    const tableId = context.tableEl.dataset.mdtpTableId || context.parsedTable?.tableId || "";
    const record = tableId ? this.dataStore.tables[tableId] : null;
    if (!tableId || record?.mode !== "nativeLayout") {
      if (!silent) new import_obsidian.Notice("\u5F53\u524D\u8868\u683C\u8FD8\u6CA1\u6709\u542F\u7528\u989C\u8272+\u957F\u5BBD\u9AD8");
      return null;
    }
    return {
      ...context,
      tableId
    };
  }
  async initializeCurrentFileTables(file) {
    const originalContent = await this.app.vault.cachedRead(file);
    const parsedTables = this.parseMarkdownTables(originalContent);
    if (parsedTables.length === 0) {
      new import_obsidian.Notice("\u5F53\u524D\u6587\u4EF6\u6CA1\u6709\u8BC6\u522B\u5230 Markdown \u8868\u683C");
      return;
    }
    const missingTables = parsedTables.filter((table) => !table.tableId);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const lines = originalContent.split(/\r?\n/);
    let didNormalizeSpacing = false;
    for (const table of [...parsedTables].sort((left, right) => right.startLine - left.startLine)) {
      if (!table.tableId) continue;
      const normalized = this.normalizeMarkerSpacing(lines, table.startLine);
      if (normalized) {
        didNormalizeSpacing = true;
      }
    }
    if (missingTables.length === 0 && !didNormalizeSpacing) {
      await this.syncTableRecords(file, parsedTables, { forceMode: "enhanced" });
      new import_obsidian.Notice(`\u5F53\u524D\u6587\u4EF6 ${parsedTables.length} \u5F20\u8868\u683C\u5DF2\u5177\u5907\u589E\u5F3A\u6807\u8BC6`);
      return;
    }
    await this.createSnapshot(file, "before-anchor", []);
    for (const table of [...missingTables].sort((left, right) => right.startLine - left.startLine)) {
      const tableId = this.generateTableId();
      lines.splice(table.startLine, 0, this.formatTableMarker(tableId), "");
    }
    const updatedContent = this.joinLines(lines, originalEndsWithNewline);
    await this.app.vault.modify(file, updatedContent);
    const updatedTables = this.parseMarkdownTables(updatedContent);
    await this.syncTableRecords(file, updatedTables, { forceMode: "enhanced" });
    this.scheduleVisibleTableRefresh();
    if (missingTables.length > 0) {
      new import_obsidian.Notice(`\u5DF2\u4E3A\u5F53\u524D\u6587\u4EF6 ${missingTables.length} \u5F20\u8868\u683C\u5EFA\u7ACB\u589E\u5F3A\u6807\u8BC6`);
      return;
    }
    if (didNormalizeSpacing) {
      new import_obsidian.Notice("\u5DF2\u4FEE\u590D\u5F53\u524D\u6587\u4EF6\u8868\u683C\u589E\u5F3A\u6807\u8BC6\u7684\u5B89\u5168\u95F4\u8DDD");
      return;
    }
    new import_obsidian.Notice(`\u5F53\u524D\u6587\u4EF6 ${parsedTables.length} \u5F20\u8868\u683C\u5DF2\u5177\u5907\u589E\u5F3A\u6807\u8BC6`);
  }
  async initializeCurrentTable() {
    const context = await this.getActiveUninitializedTableContext();
    if (!context) {
      new import_obsidian.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u542F\u7528\u589E\u5F3A\u7684 Markdown \u8868\u683C");
      return false;
    }
    return this.initializeSpecificTable(context.file, context.parsedTable);
  }
  async initializeCurrentTableNativeLayout() {
    const context = await this.getActiveUninitializedTableContext();
    if (!context) {
      new import_obsidian.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u542F\u7528\u539F\u751F\u8868\u683C\u589E\u5F3A\u7684 Markdown \u8868\u683C");
      return false;
    }
    return this.initializeSpecificTableNativeLayout(context.file, context.parsedTable);
  }
  async initializeSpecificTable(file, parsedTable) {
    if (!parsedTable) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BC6\u522B\u5230\u76EE\u6807\u8868\u683C");
      return false;
    }
    const originalContent = await this.app.vault.cachedRead(file);
    const currentTables = this.parseMarkdownTables(originalContent);
    const targetTable = currentTables.find(
      (table) => table.startLine === parsedTable.startLine && table.endLine === parsedTable.endLine && table.raw === parsedTable.raw
    ) ?? currentTables.find((table) => table.startLine === parsedTable.startLine);
    if (!targetTable) {
      new import_obsidian.Notice("\u5F53\u524D\u8868\u683C\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u9009\u4E2D\u8868\u683C\u540E\u518D\u8BD5");
      return false;
    }
    if (targetTable.tableId) {
      await this.syncTableRecords(file, currentTables);
      const record = this.dataStore.tables[targetTable.tableId];
      if (record?.mode === "nativeLayout") {
        record.mode = "enhanced";
        record.updatedAt = Date.now();
        await this.savePluginData();
        this.scheduleVisibleTableRefresh();
        new import_obsidian.Notice("\u5DF2\u5C06\u5F53\u524D\u8868\u4ECE\u957F\u5BBD\u9AD8\u8C03\u8282\u6A21\u5F0F\u5347\u7EA7\u4E3A\u589E\u5F3A\u8868\u683C");
        return true;
      }
      this.scheduleVisibleTableRefresh();
      new import_obsidian.Notice("\u5F53\u524D\u8868\u683C\u5DF2\u7ECF\u542F\u7528\u589E\u5F3A");
      return true;
    }
    await this.createSnapshot(file, "before-anchor-current-table", []);
    const lines = originalContent.split(/\r?\n/);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const tableId = this.generateTableId();
    lines.splice(targetTable.startLine, 0, this.formatTableMarker(tableId), "");
    const updatedContent = this.joinLines(lines, originalEndsWithNewline);
    await this.app.vault.modify(file, updatedContent);
    const updatedTables = this.parseMarkdownTables(updatedContent);
    await this.syncTableRecords(file, updatedTables, { modeOverrides: { [tableId]: "enhanced" } });
    this.scheduleVisibleTableRefresh();
    new import_obsidian.Notice("\u5DF2\u5BF9\u5F53\u524D\u8868\u542F\u7528\u589E\u5F3A");
    return true;
  }
  async initializeSpecificTableNativeLayout(file, parsedTable) {
    if (!parsedTable) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BC6\u522B\u5230\u76EE\u6807\u8868\u683C");
      return false;
    }
    const originalContent = await this.app.vault.cachedRead(file);
    const currentTables = this.parseMarkdownTables(originalContent);
    const targetTable = currentTables.find(
      (table) => table.startLine === parsedTable.startLine && table.endLine === parsedTable.endLine && table.raw === parsedTable.raw
    ) ?? currentTables.find((table) => table.startLine === parsedTable.startLine);
    if (!targetTable) {
      new import_obsidian.Notice("\u5F53\u524D\u8868\u683C\u5B9A\u4F4D\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u9009\u4E2D\u8868\u683C\u540E\u518D\u8BD5");
      return false;
    }
    if (targetTable.tableId) {
      await this.syncTableRecords(file, currentTables);
      const record2 = this.dataStore.tables[targetTable.tableId];
      if (record2?.mode === "enhanced") {
        if (this.canConvertEnhancedRecordToNativeLayout(record2)) {
          record2.mode = "nativeLayout";
          this.applyNativeColorPresetToLayout(record2.layout);
          record2.updatedAt = Date.now();
          await this.savePluginData();
          this.scheduleVisibleTableRefresh();
          new import_obsidian.Notice("\u5DF2\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316");
          return true;
        }
        new import_obsidian.Notice("\u5F53\u524D\u8868\u5DF2\u542F\u7528\u589E\u5F3A\uFF0C\u5DF2\u7ECF\u652F\u6301\u957F\u5BBD\u9AD8\u8C03\u8282");
        return true;
      }
      if (record2) {
        record2.mode = "nativeLayout";
        this.applyNativeColorPresetToLayout(record2.layout);
        record2.updatedAt = Date.now();
        await this.savePluginData();
      }
      this.scheduleVisibleTableRefresh();
      new import_obsidian.Notice("\u5DF2\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316");
      return true;
    }
    await this.createSnapshot(file, "before-native-layout-color-anchor", []);
    const lines = originalContent.split(/\r?\n/);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const tableId = this.generateTableId();
    lines.splice(targetTable.startLine, 0, this.formatTableMarker(tableId), "");
    const updatedContent = this.joinLines(lines, originalEndsWithNewline);
    await this.app.vault.modify(file, updatedContent);
    const updatedTables = this.parseMarkdownTables(updatedContent);
    await this.syncTableRecords(file, updatedTables, { modeOverrides: { [tableId]: "nativeLayout" } });
    const record = this.dataStore.tables[tableId];
    if (record) {
      this.applyNativeColorPresetToLayout(record.layout);
      record.updatedAt = Date.now();
      await this.savePluginData();
    }
    this.scheduleVisibleTableRefresh();
    new import_obsidian.Notice("\u5DF2\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316");
    return true;
  }
  resolveParsedTableInContent(parsedTable, currentTables) {
    return currentTables.find(
      (table) => table.startLine === parsedTable.startLine && table.endLine === parsedTable.endLine && table.raw === parsedTable.raw
    ) ?? currentTables.find((table) => table.startLine === parsedTable.startLine) ?? null;
  }
  isTableNativeLayoutBeautified(tableId) {
    return !!tableId && this.getTableRecordMode(this.dataStore.tables[tableId]) === "nativeLayout";
  }
  canBeautifyParsedTableAsNativeLayout(parsedTable, record) {
    if (!parsedTable.tableId) return true;
    if (!record) return true;
    if (record.mode === "nativeLayout") return false;
    if (record.mode === "enhanced") return this.canConvertEnhancedRecordToNativeLayout(record);
    return true;
  }
  applyNativeLayoutBeautifyToRecord(record) {
    record.mode = "nativeLayout";
    this.applyNativeColorPresetToLayout(record.layout);
    record.updatedAt = Date.now();
  }
  async getVisibleParsedTablesInActiveView(file) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (!view?.file || view.file.path !== file.path) return [];
    const contentEl = view.contentEl;
    if (!(contentEl instanceof HTMLElement)) return [];
    const renderedTables = this.getRenderedTables(contentEl);
    if (renderedTables.length === 0) return [];
    const parsedTables = this.parseMarkdownTables(await this.app.vault.cachedRead(file));
    const visible = [];
    for (let index = 0; index < renderedTables.length && index < parsedTables.length; index += 1) {
      const parsedTable = parsedTables[index];
      if (parsedTable) visible.push(parsedTable);
    }
    return visible;
  }
  async initializeVisiblePageTablesNativeLayout(file) {
    const visibleTables = await this.getVisibleParsedTablesInActiveView(file);
    if (visibleTables.length === 0) {
      new import_obsidian.Notice("\u5F53\u524D\u9875\u9762\u6CA1\u6709\u53EF\u89C1\u8868\u683C");
      return false;
    }
    const originalContent = await this.app.vault.cachedRead(file);
    let currentTables = this.parseMarkdownTables(originalContent);
    await this.syncTableRecords(file, currentTables);
    const tablesToAnchor = [];
    const tableIdsToConvert = [];
    for (const parsedTable of visibleTables) {
      const targetTable = this.resolveParsedTableInContent(parsedTable, currentTables);
      if (!targetTable) continue;
      const record = targetTable.tableId ? this.dataStore.tables[targetTable.tableId] : null;
      if (!this.canBeautifyParsedTableAsNativeLayout(targetTable, record)) continue;
      if (!targetTable.tableId) {
        tablesToAnchor.push(targetTable);
        continue;
      }
      if (record?.mode === "enhanced" && !this.canConvertEnhancedRecordToNativeLayout(record)) {
        continue;
      }
      tableIdsToConvert.push(targetTable.tableId);
    }
    if (tablesToAnchor.length === 0 && tableIdsToConvert.length === 0) {
      new import_obsidian.Notice("\u5F53\u524D\u9875\u9762\u53EF\u89C1\u8868\u683C\u90FD\u5DF2\u7F8E\u5316");
      return true;
    }
    if (tablesToAnchor.length > 0) {
      await this.createSnapshot(file, "before-native-layout-color-anchor", []);
    }
    let updatedContent = originalContent;
    const modeOverrides = {};
    if (tablesToAnchor.length > 0) {
      const lines = originalContent.split(/\r?\n/);
      const originalEndsWithNewline = /\r?\n$/.test(originalContent);
      for (const table of [...tablesToAnchor].sort((left, right) => right.startLine - left.startLine)) {
        const tableId = this.generateTableId();
        lines.splice(table.startLine, 0, this.formatTableMarker(tableId), "");
        modeOverrides[tableId] = "nativeLayout";
      }
      updatedContent = this.joinLines(lines, originalEndsWithNewline);
      await this.app.vault.modify(file, updatedContent);
      currentTables = this.parseMarkdownTables(updatedContent);
      await this.syncTableRecords(file, currentTables, { modeOverrides });
    }
    let convertedCount = 0;
    for (const tableId of tableIdsToConvert) {
      const record = this.dataStore.tables[tableId];
      if (!record || record.mode === "nativeLayout") continue;
      if (record.mode === "enhanced" && !this.canConvertEnhancedRecordToNativeLayout(record)) continue;
      this.applyNativeLayoutBeautifyToRecord(record);
      convertedCount += 1;
    }
    for (const tableId of Object.keys(modeOverrides)) {
      const record = this.dataStore.tables[tableId];
      if (record) {
        this.applyNativeLayoutBeautifyToRecord(record);
      }
    }
    if (convertedCount > 0 || Object.keys(modeOverrides).length > 0) {
      await this.savePluginData();
    }
    const beautifiedCount = Object.keys(modeOverrides).length + convertedCount;
    this.scheduleVisibleTableRefresh();
    new import_obsidian.Notice(`\u5DF2\u5BF9\u672C\u9875 ${beautifiedCount} \u5F20\u8868\u683C\u7F8E\u5316`);
    return beautifiedCount > 0;
  }
  async insertEnhancedTableTemplate() {
    const file = this.getActiveMarkdownFile();
    if (!file) return false;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const editor = view?.editor;
    const tableId = this.generateTableId();
    const template = [
      this.formatTableMarker(tableId),
      "",
      ...this.buildRawTable({
        header: ["\u52171", "\u52172"],
        divider: ["---", "---"],
        body: [["\u5185\u5BB91", "\u5185\u5BB92"]]
      }),
      ""
    ].join("\n");
    if (editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() ? "\n\n" : "";
      editor.replaceRange(`${prefix}${template}`, cursor);
      window.setTimeout(() => this.queueRefreshBurst(), 120);
      new import_obsidian.Notice("\u5DF2\u63D2\u5165\u589E\u5F3A\u8868\u683C\u6A21\u677F");
      return true;
    }
    const originalContent = await this.app.vault.cachedRead(file);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const separator = originalContent.trim().length === 0 ? "" : originalEndsWithNewline ? "\n" : "\n\n";
    await this.app.vault.modify(file, `${originalContent}${separator}${template}`);
    this.queueRefreshBurst();
    new import_obsidian.Notice("\u5DF2\u63D2\u5165\u589E\u5F3A\u8868\u683C\u6A21\u677F");
    return true;
  }
  async insertNativeColorTableTemplate() {
    const file = this.getActiveMarkdownFile();
    if (!file) return false;
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const editor = view?.editor;
    const tableId = this.generateTableId();
    const rawTable = this.buildNativeColorRawTable();
    const tableLines = this.buildRawTable(rawTable);
    const tableRaw = tableLines.join("\n");
    const template = [this.formatTableMarker(tableId), "", tableRaw, ""].join("\n");
    const record = this.createNativeColorTableRecord(file, tableId, tableRaw);
    this.dataStore.tables[tableId] = record;
    await this.savePluginData();
    if (editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() ? "\n\n" : "";
      editor.replaceRange(`${prefix}${template}
`, cursor);
      window.setTimeout(() => this.queueRefreshBurst(), 120);
      new import_obsidian.Notice("\u5DF2\u63D2\u5165\u5F69\u8272\u539F\u751F\u7A7A\u8868\u683C");
      return true;
    }
    const originalContent = await this.app.vault.cachedRead(file);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const separator = originalContent.trim().length === 0 ? "" : originalEndsWithNewline ? "\n" : "\n\n";
    const updatedContent = `${originalContent}${separator}${template}
`;
    await this.app.vault.modify(file, updatedContent);
    const parsedTables = this.parseMarkdownTables(updatedContent);
    await this.syncTableRecords(file, parsedTables, { modeOverrides: { [tableId]: "nativeLayout" } });
    this.dataStore.tables[tableId] = {
      ...this.dataStore.tables[tableId] ?? record,
      mode: "nativeLayout",
      layout: record.layout
    };
    await this.savePluginData();
    this.queueRefreshBurst();
    new import_obsidian.Notice("\u5DF2\u63D2\u5165\u5F69\u8272\u539F\u751F\u7A7A\u8868\u683C");
    return true;
  }
  buildNativeColorRawTable() {
    return {
      header: ["", "", ""],
      divider: ["---", "---", "---"],
      body: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
      ]
    };
  }
  createNativeColorTableRecord(file, tableId, tableRaw) {
    const now = Date.now();
    const layout = this.createNativeColorTableLayout();
    return {
      tableId,
      mode: "nativeLayout",
      filePath: file.path,
      createdAt: now,
      updatedAt: now,
      lastKnownHash: this.hashString(tableRaw),
      lastKnownRange: {
        startLine: 0,
        endLine: 0
      },
      layout
    };
  }
  createNativeColorTableLayout() {
    const layout = this.createEmptyLayout();
    this.applyNativeColorPresetToLayout(layout);
    layout.colWidths = {
      "0": 170,
      "1": 190,
      "2": 430
    };
    return layout;
  }
  applyNativeColorPresetToLayout(layout) {
    const palette = this.getCurrentNativeColorPalette();
    layout.cellColors = {};
    layout.rowColors = {};
    layout.colColors = {};
    layout.nativeColorPreset = NATIVE_COLOR_PRESET_BLUE_ZEBRA;
    layout.nativeColorPalette = palette;
    layout.rowColors["0"] = palette.header;
  }
  normalizeNativeColorPresetLayout(layout) {
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return;
    const palette = this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
    layout.nativeColorPalette = palette;
    if (!layout.rowColors["0"] || this.isLegacyNativeColorTableHeaderColor(layout.rowColors["0"])) {
      layout.rowColors["0"] = palette.header;
    }
  }
  canConvertEnhancedRecordToNativeLayout(record) {
    if (!record || record.mode !== "enhanced") return false;
    return record.layout.merges.length === 0 && Object.keys(record.layout.cellImageWidths).length === 0;
  }
  getNativeColorSettingsForManager() {
    const savedPresets = this.getNativeColorSavedPalettes().map((item) => ({
      id: item.id,
      label: item.label,
      palette: { ...item.palette },
      saved: true
    }));
    return {
      defaultPresetId: this.normalizeNativeColorPresetId(this.dataStore.nativeColorDefaultPresetId),
      presets: [
        {
          id: "blue",
          label: NATIVE_COLOR_PRESET_PALETTES.blue.label,
          palette: { ...NATIVE_COLOR_PRESET_PALETTES.blue }
        },
        {
          id: "green",
          label: NATIVE_COLOR_PRESET_PALETTES.green.label,
          palette: { ...NATIVE_COLOR_PRESET_PALETTES.green }
        },
        ...savedPresets,
        {
          id: "custom",
          label: "\u81EA\u5B9A\u4E49",
          palette: this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT)
        }
      ],
      customPalette: this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT),
      savedPalettes: savedPresets
    };
  }
  async updateNativeColorSettingsFromManager(input) {
    this.dataStore.nativeColorDefaultPresetId = this.normalizeNativeColorPresetId(input.defaultPresetId);
    if (input.customPalette) {
      this.dataStore.nativeColorCustomPalette = this.normalizeNativeColorPalette(
        input.customPalette,
        this.dataStore.nativeColorCustomPalette ?? NATIVE_COLOR_CUSTOM_DEFAULT
      );
    }
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    new import_obsidian.Notice("\u5DF2\u66F4\u65B0\u539F\u751F\u8868\u683C\u989C\u8272\u9884\u8BBE");
    return this.getNativeColorSettingsForManager();
  }
  async saveCurrentNativeColorPaletteAsManager(label) {
    const now = Date.now();
    const palette = this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT);
    const title = this.normalizeNativeColorSavedPaletteLabel(label, this.getNextNativeColorSavedPaletteLabel());
    const item = {
      id: `saved_${now.toString(36)}`,
      label: title,
      palette,
      createdAt: now,
      updatedAt: now
    };
    this.dataStore.nativeColorSavedPalettes = [...this.getNativeColorSavedPalettes(), item].slice(-12);
    this.dataStore.nativeColorDefaultPresetId = item.id;
    await this.savePluginData();
    this.scheduleVisibleTableRefresh();
    new import_obsidian.Notice(`\u5DF2\u4FDD\u5B58\u914D\u8272\u65B9\u6848\uFF1A${title}`);
    return this.getNativeColorSettingsForManager();
  }
  async deleteNativeColorPaletteFromManager(id) {
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
  normalizeNativeColorPresetId(value, savedPalettes) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (raw === "blue" || raw === "green" || raw === "custom") return raw;
    const saved = savedPalettes ?? this.getNativeColorSavedPalettes();
    return saved.some((item) => item.id === raw) ? raw : NATIVE_COLOR_DEFAULT_PRESET_ID;
  }
  getCurrentNativeColorPalette() {
    const presetId = this.normalizeNativeColorPresetId(this.dataStore.nativeColorDefaultPresetId);
    if (presetId === "custom") {
      return this.normalizeNativeColorPalette(this.dataStore.nativeColorCustomPalette, NATIVE_COLOR_CUSTOM_DEFAULT);
    }
    const savedPreset = this.getNativeColorSavedPalettes().find((item) => item.id === presetId);
    if (savedPreset) {
      return this.normalizeNativeColorPalette(savedPreset.palette, NATIVE_COLOR_CUSTOM_DEFAULT);
    }
    const builtInPresetId = presetId === "blue" || presetId === "green" ? presetId : NATIVE_COLOR_DEFAULT_PRESET_ID;
    return this.normalizeNativeColorPalette(NATIVE_COLOR_PRESET_PALETTES[builtInPresetId], NATIVE_COLOR_PRESET_PALETTES[builtInPresetId]);
  }
  getNativeColorSavedPalettes() {
    return this.normalizeNativeColorSavedPalettes(this.dataStore.nativeColorSavedPalettes);
  }
  normalizeNativeColorSavedPalettes(value) {
    if (!Array.isArray(value)) return [];
    const result = [];
    const seen = /* @__PURE__ */ new Set();
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const candidate = item;
      const id = typeof candidate.id === "string" && candidate.id.trim().startsWith("saved_") ? candidate.id.trim() : "";
      if (!id || seen.has(id)) continue;
      seen.add(id);
      result.push({
        id,
        label: this.normalizeNativeColorSavedPaletteLabel(candidate.label, `\u914D\u8272\u65B9\u6848 ${result.length + 1}`),
        palette: this.normalizeNativeColorPalette(candidate.palette, NATIVE_COLOR_CUSTOM_DEFAULT),
        createdAt: Number.isFinite(candidate.createdAt) ? Number(candidate.createdAt) : Date.now(),
        updatedAt: Number.isFinite(candidate.updatedAt) ? Number(candidate.updatedAt) : Date.now()
      });
    }
    return result.slice(-12);
  }
  normalizeNativeColorSavedPaletteLabel(value, fallback) {
    const text = typeof value === "string" ? value.trim() : "";
    return (text || fallback).slice(0, 24);
  }
  getNextNativeColorSavedPaletteLabel() {
    return `\u914D\u8272\u65B9\u6848 ${this.getNativeColorSavedPalettes().length + 1}`;
  }
  getLayoutNativeColorPalette(layout) {
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return null;
    return this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
  }
  normalizeNativeColorPalette(value, fallback) {
    const candidate = value && typeof value === "object" ? value : {};
    return {
      header: this.normalizeHexColor(candidate.header, fallback.header),
      headerText: this.normalizeHexColor(candidate.headerText, fallback.headerText),
      baseRow: this.normalizeHexColor(candidate.baseRow, fallback.baseRow),
      altRow: this.normalizeHexColor(candidate.altRow, fallback.altRow),
      border: this.normalizeHexColor(candidate.border, fallback.border)
    };
  }
  normalizeHexColor(value, fallback) {
    const raw = typeof value === "string" ? value.trim() : "";
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
      return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toUpperCase();
    }
    return fallback.toUpperCase();
  }
  colorsMatch(left, right) {
    return left.trim().toUpperCase() === right.trim().toUpperCase();
  }
  openTemplateNameModal(templateContent) {
    const normalized = templateContent.trim().length > 0 ? templateContent : "";
    if (!normalized) {
      new import_obsidian.Notice("\u8BF7\u5148\u9009\u4E2D\u8981\u4FDD\u5B58\u4E3A\u6A21\u677F\u7684\u5185\u5BB9");
      return;
    }
    new TemplateNameModal(this, templateContent).open();
  }
  openTemplateLibraryModal() {
    new TemplateLibraryModal(this).open();
  }
  getActiveTemplateSelectionContent(silent = false) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const editor = view?.editor;
    if (editor && typeof editor.getSelection === "function") {
      const selected = String(editor.getSelection() ?? "");
      if (selected.trim().length > 0) return selected;
    }
    const browserSelection = typeof window !== "undefined" ? window.getSelection?.() : null;
    const selectedText = String(browserSelection?.toString?.() ?? "");
    if (selectedText.trim().length > 0) return selectedText;
    if (!silent) {
      new import_obsidian.Notice("\u8BF7\u5148\u9009\u4E2D\u8981\u4FDD\u5B58\u4E3A\u6A21\u677F\u7684\u5185\u5BB9");
    }
    return null;
  }
  isTemplateSectionBoundaryLine(line) {
    const trimmed = String(line ?? "").trim();
    if (!trimmed) return false;
    if (/^#{1,6}\s+/.test(trimmed)) return true;
    if (/^---+$/.test(trimmed)) return true;
    if (/^==.+==$/.test(trimmed)) return true;
    return false;
  }
  getTemplateSectionRangeAtLine(editor, line) {
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
  readEditorLines(editor, startLine, endLine) {
    const lines = [];
    for (let line = startLine; line <= endLine; line += 1) {
      lines.push(String(editor.getLine(line) ?? ""));
    }
    return lines.join("\n");
  }
  getParsedTableAtEditorLine(view) {
    const editor = view.editor;
    if (!editor || typeof editor.getCursor !== "function") return null;
    const line = Math.max(0, editor.getCursor()?.line ?? 0);
    const content = typeof editor.getValue === "function" ? String(editor.getValue() ?? "") : "";
    if (!content.trim()) return null;
    return this.parseMarkdownTables(content).find((table) => line >= table.startLine && line <= table.endLine) ?? null;
  }
  getEditorTemplateSaveContent(view, silent = false) {
    const selected = this.getActiveTemplateSelectionContent(true);
    if (selected?.trim()) return selected;
    const activeView = view ?? this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const editor = activeView?.editor;
    if (editor && typeof editor.getCursor === "function" && typeof editor.lineCount === "function" && typeof editor.getLine === "function") {
      const cursorLine = Math.max(0, editor.getCursor()?.line ?? 0);
      const sectionRange = this.getTemplateSectionRangeAtLine(editor, cursorLine);
      const sectionContent = this.readEditorLines(editor, sectionRange.startLine, sectionRange.endLine);
      if (sectionContent.trim().length > 0) return sectionContent;
    }
    const feishu = this.app.plugins.plugins["feishu-doc-toolbar"];
    if (typeof feishu?.getTemplateContentForEditor === "function" && editor && typeof editor.getCursor === "function") {
      const bridged = feishu.getTemplateContentForEditor(editor, Math.max(0, editor.getCursor()?.line ?? 0));
      if (bridged?.trim()) return bridged;
    }
    if (!silent) {
      new import_obsidian.Notice("\u8BF7\u5148\u9009\u4E2D\u8981\u4FDD\u5B58\u4E3A\u6A21\u677F\u7684\u5185\u5BB9");
    }
    return null;
  }
  async createTemplateFromContent(rawName, templateContent) {
    const content = templateContent.trim().length > 0 ? templateContent : "";
    if (!content) {
      new import_obsidian.Notice("\u6A21\u677F\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u672A\u4FDD\u5B58");
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
    new import_obsidian.Notice(`\u5DF2\u4FDD\u5B58\u6A21\u677F\uFF1A${this.getTemplateNameFromPath(path)}`);
    return true;
  }
  async createTemplateFromModalInput(rawName, rawContent) {
    const name = rawName.trim();
    if (!name) {
      new import_obsidian.Notice("\u8BF7\u5148\u586B\u5199\u6A21\u677F\u540D\u79F0");
      return false;
    }
    const content = String(rawContent ?? "");
    if (content.trim().length > 0) {
      return this.createTemplateFromContent(name, content);
    }
    return this.createEmptyTemplate(name);
  }
  async createEmptyTemplate(rawName) {
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
    new import_obsidian.Notice(`\u5DF2\u65B0\u5EFA\u6A21\u677F\uFF1A${this.getTemplateNameFromPath(path)}`);
    return { name: this.getTemplateNameFromPath(path), path };
  }
  async getTemplateRecords() {
    await this.ensureFolderExists(TEMPLATE_LIBRARY_FOLDER);
    const paths = await this.listTemplateMarkdownPaths(TEMPLATE_LIBRARY_FOLDER);
    return paths.map((filePath) => this.createTemplateRecord(filePath)).sort((a, b) => {
      const folderCompare = a.folderPath.localeCompare(b.folderPath, "zh-Hans-CN");
      if (folderCompare !== 0) return folderCompare;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });
  }
  async insertTemplateByPath(templatePath) {
    const adapter = this.app.vault.adapter;
    const normalizedPath = (0, import_obsidian.normalizePath)(templatePath);
    if (!await adapter.exists(normalizedPath)) {
      new import_obsidian.Notice("\u6A21\u677F\u6587\u4EF6\u4E0D\u5B58\u5728");
      return false;
    }
    const content = await adapter.read(normalizedPath);
    const inserted = await this.insertTemplateContentAtCursor(content);
    if (inserted) {
      new import_obsidian.Notice(`\u5DF2\u63D2\u5165\u6A21\u677F\uFF1A${this.getTemplateNameFromPath(normalizedPath)}`);
    }
    return inserted;
  }
  async openTemplateForEdit(templatePath) {
    const normalizedPath = (0, import_obsidian.normalizePath)(templatePath);
    const template = {
      name: this.getTemplateNameFromPath(normalizedPath),
      path: normalizedPath
    };
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (file instanceof import_obsidian.TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
      return true;
    }
    if (!await this.app.vault.adapter.exists(normalizedPath)) {
      new import_obsidian.Notice("\u6A21\u677F\u6587\u4EF6\u4E0D\u5B58\u5728");
      return false;
    }
    new TemplateEditModal(this, template).open();
    return true;
  }
  async readTemplateContent(templatePath) {
    const normalizedPath = (0, import_obsidian.normalizePath)(templatePath);
    if (!await this.app.vault.adapter.exists(normalizedPath)) return "";
    return this.app.vault.adapter.read(normalizedPath);
  }
  async writeTemplateContent(templatePath, content) {
    const normalizedPath = (0, import_obsidian.normalizePath)(templatePath);
    await this.ensureFolderExists(TEMPLATE_LIBRARY_FOLDER);
    await this.app.vault.adapter.write(normalizedPath, content);
  }
  async deleteTemplateByPath(templatePath) {
    const normalizedPath = (0, import_obsidian.normalizePath)(templatePath);
    if (!normalizedPath.startsWith(`${TEMPLATE_LIBRARY_FOLDER}/`) || !normalizedPath.toLowerCase().endsWith(".md")) {
      new import_obsidian.Notice("\u53EA\u80FD\u5220\u9664\u6A21\u677F\u5E93\u4E2D\u7684\u6A21\u677F\u6587\u4EF6");
      return false;
    }
    const templateName = this.getTemplateNameFromPath(normalizedPath);
    const confirmed = window.confirm(`\u786E\u5B9A\u5220\u9664\u6A21\u677F\u201C${templateName}\u201D\u5417\uFF1F

\u5220\u9664\u540E\u4F1A\u4ECE\u6A21\u677F\u5E93\u79FB\u9664\u3002`);
    if (!confirmed) return false;
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    try {
      if (file instanceof import_obsidian.TFile && typeof this.app.vault.trash === "function") {
        await this.app.vault.trash(file, true);
      } else if (file instanceof import_obsidian.TFile && typeof this.app.vault.delete === "function") {
        await this.app.vault.delete(file);
      } else if (await this.app.vault.adapter.exists(normalizedPath)) {
        await this.app.vault.adapter.remove(normalizedPath);
      } else {
        new import_obsidian.Notice("\u6A21\u677F\u6587\u4EF6\u4E0D\u5B58\u5728");
        return false;
      }
      new import_obsidian.Notice(`\u5DF2\u5220\u9664\u6A21\u677F\uFF1A${templateName}`);
      return true;
    } catch (error) {
      console.warn("[mdtp] delete template failed", error);
      new import_obsidian.Notice("\u5220\u9664\u6A21\u677F\u5931\u8D25");
      return false;
    }
  }
  async insertEnhancedTemplateContentAtCursor(content, position) {
    return this.insertTemplateContentAtCursor(content, position);
  }
  async insertTemplateContentAtCursor(content, position) {
    const file = this.getActiveMarkdownFile();
    if (!file) return false;
    if (content.trim().length === 0) {
      new import_obsidian.Notice("\u6A21\u677F\u5185\u5BB9\u4E3A\u7A7A");
      return false;
    }
    const prepared = this.prepareTemplateContentForInsertion(content, file);
    if (prepared.content.trim().length === 0) {
      new import_obsidian.Notice("\u6A21\u677F\u5185\u5BB9\u4E3A\u7A7A");
      return false;
    }
    for (const record of prepared.tableRecords) {
      this.dataStore.tables[record.tableId] = record;
    }
    if (prepared.tableRecords.length > 0) {
      await this.savePluginData();
    }
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const editor = view?.editor;
    if (editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = position ?? editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() && !prepared.content.startsWith("\n") ? "\n\n" : "";
      editor.replaceRange(`${prefix}${prepared.content}`, cursor);
      window.setTimeout(() => this.queueRefreshBurst(), 120);
      return true;
    }
    const originalContent = await this.app.vault.cachedRead(file);
    const originalEndsWithNewline = /\r?\n$/.test(originalContent);
    const separator = originalContent.trim().length === 0 ? "" : originalEndsWithNewline ? "\n" : "\n\n";
    await this.app.vault.modify(file, `${originalContent}${separator}${prepared.content}`);
    this.queueRefreshBurst();
    return true;
  }
  async saveEnhancedTableSelectionAsTemplate(file, tableId, selection) {
    const content = await this.buildEnhancedTableTemplateContent(file, tableId, selection);
    if (!content) return false;
    this.openTemplateNameModal(content);
    return true;
  }
  async buildEnhancedTableTemplateContent(file, tableId, selection) {
    const content = await this.app.vault.cachedRead(file);
    const parsedTable = this.parseMarkdownTables(content).find((table) => table.tableId === tableId) ?? null;
    if (!parsedTable) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u589E\u5F3A\u8868\u683C");
      return null;
    }
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u8868\u683C\u5185\u5BB9");
      return null;
    }
    const record = this.dataStore.tables[tableId];
    const fullSelection = this.isFullTableSelection(rawTable, selection);
    if (fullSelection) {
      const metadata2 = this.serializeTemplateTableMetadata({
        [tableId]: {
          mode: "enhanced",
          layout: record?.layout ? this.cloneLayout(record.layout) : this.createEmptyLayout()
        }
      });
      return `${metadata2}
${this.formatTableMarker(tableId)}

${parsedTable.raw}
`;
    }
    const matrix = await this.readSelectionSourceMatrix(file, tableId, selection, { preserveRaw: true });
    if (!matrix) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u8868\u683C\u9009\u533A");
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
        mode: "enhanced",
        layout
      }
    });
    return `${metadata}
${this.formatTableMarker(nextTableId)}

${tableMarkdown}
`;
  }
  async savePlainTableSelectionAsTemplate(context) {
    const rawTable = this.parseRawTable(context.parsedTable.raw);
    if (!rawTable) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u8868\u683C\u5185\u5BB9");
      return false;
    }
    const rect = this.resolvePlainTableTemplateSelection(context.tableEl ?? null, context.coord);
    const matrix = [];
    for (let row = rect.startRow; row <= rect.endRow; row += 1) {
      const values = [];
      for (let col = rect.startCol; col <= rect.endCol; col += 1) {
        values.push(this.getCellValue(rawTable, { row, col }) ?? "");
      }
      matrix.push(values);
    }
    const content = this.buildHighFidelityClipboardTextFromMatrix(matrix);
    this.openTemplateNameModal(content);
    return true;
  }
  async savePlainTableAsTemplate(context) {
    const content = this.normalizeTemplateTableContent(context.parsedTable.raw);
    if (!content.trim()) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u8868\u683C\u5185\u5BB9");
      return false;
    }
    this.openTemplateNameModal(content);
    return true;
  }
  async saveManagedTableAsTemplate(file, parsedTable) {
    if (!parsedTable) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u8868\u683C\u5185\u5BB9");
      return false;
    }
    const content = this.buildManagedWholeTableTemplateContent(parsedTable);
    if (!content.trim()) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u8868\u683C\u5185\u5BB9");
      return false;
    }
    this.openTemplateNameModal(content);
    void file;
    return true;
  }
  buildManagedWholeTableTemplateContent(parsedTable) {
    if (!parsedTable.tableId) {
      return this.normalizeTemplateTableContent(parsedTable.raw);
    }
    const record = this.dataStore.tables[parsedTable.tableId];
    const metadata = this.serializeTemplateTableMetadata({
      [parsedTable.tableId]: {
        mode: this.getTableRecordMode(record),
        layout: record?.layout ? this.cloneLayout(record.layout) : this.createEmptyLayout()
      }
    });
    return `${metadata}
${this.formatTableMarker(parsedTable.tableId)}

${this.normalizeTemplateTableContent(parsedTable.raw)}`;
  }
  normalizeTemplateTableContent(raw) {
    const trimmed = String(raw ?? "").trim();
    return trimmed ? `${trimmed}
` : "";
  }
  resolvePlainTableTemplateSelection(tableEl, fallbackCoord) {
    if (!tableEl) return this.normalizeSelection(fallbackCoord, fallbackCoord);
    const selectedCoords = this.collectPlainTableSelectedCoords(tableEl);
    if (selectedCoords.length === 0) return this.normalizeSelection(fallbackCoord, fallbackCoord);
    const rows = selectedCoords.map((coord) => coord.row);
    const cols = selectedCoords.map((coord) => coord.col);
    return {
      startRow: Math.min(...rows),
      endRow: Math.max(...rows),
      startCol: Math.min(...cols),
      endCol: Math.max(...cols)
    };
  }
  collectPlainTableSelectedCoords(tableEl) {
    const selection = window.getSelection?.() ?? null;
    const cells = Array.from(tableEl.querySelectorAll("th, td"));
    const selected = [];
    for (const cell of cells) {
      if (!this.isPlainTableCellSelected(cell, selection)) continue;
      const coord = this.getPlainTableCellCoord(cell);
      if (coord) selected.push(coord);
    }
    return selected;
  }
  isPlainTableCellSelected(cell, selection) {
    if (cell.matches(
      [
        ".is-selected",
        ".mod-selected",
        ".table-cell-selected",
        ".table-editor-cell-selected",
        ".cm-table-widget-cell-selected",
        "[aria-selected='true']",
        "[data-selected='true']",
        "[data-is-selected='true']"
      ].join(",")
    )) {
      return true;
    }
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      for (let index = 0; index < selection.rangeCount; index += 1) {
        const range = selection.getRangeAt(index);
        try {
          if (range.intersectsNode(cell)) return true;
        } catch {
        }
      }
    }
    return document.activeElement === cell || cell.contains(document.activeElement);
  }
  async saveTemplateFromMenuContext(options) {
    const selectedContent = this.getEditorTemplateSaveContent(this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView), true);
    if (selectedContent?.trim()) {
      this.openTemplateNameModal(selectedContent);
      return true;
    }
    if (options?.file && options.tableId && options.tableSelection) {
      return this.saveEnhancedTableSelectionAsTemplate(options.file, options.tableId, options.tableSelection);
    }
    if (options?.plainTableContext) {
      return this.savePlainTableSelectionAsTemplate(options.plainTableContext);
    }
    new import_obsidian.Notice("\u8BF7\u5148\u9009\u4E2D\u8981\u4FDD\u5B58\u4E3A\u6A21\u677F\u7684\u5185\u5BB9");
    return false;
  }
  isFullTableSelection(rawTable, selection) {
    return selection.startRow === 0 && selection.startCol === 0 && selection.endRow === rawTable.body.length && selection.endCol === rawTable.header.length - 1;
  }
  serializeTemplateTableMetadata(tables) {
    return `%% mdtp-template:${JSON.stringify({ version: 1, tables })} %%`;
  }
  splitTemplateContentForPreview(content) {
    const lines = String(content ?? "").split(/\r?\n/);
    const hiddenLines = [];
    let cursor = 0;
    while (cursor < lines.length) {
      const line = lines[cursor];
      if (TEMPLATE_TABLE_METADATA_RE.test(line) || OBSIDIAN_TABLE_MARKER_RE.test(line)) {
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
      visible: visibleLines.join("\n")
    };
  }
  combineTemplateContentForSave(hiddenPrefix, visible) {
    const trimmedVisible = String(visible ?? "").replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
    const trimmedPrefix = String(hiddenPrefix ?? "").trim();
    if (!trimmedVisible) {
      return trimmedPrefix ? `${trimmedPrefix}
` : "";
    }
    if (!trimmedPrefix) {
      return `${trimmedVisible}
`;
    }
    return `${trimmedPrefix}

${trimmedVisible}
`;
  }
  extractTemplateTableMetadata(content) {
    const metadata = { version: 1, tables: {} };
    const lines = content.split(/\r?\n/);
    const kept = [];
    for (const line of lines) {
      const match = line.match(TEMPLATE_TABLE_METADATA_RE);
      if (!match) {
        kept.push(line);
        continue;
      }
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed?.tables && typeof parsed.tables === "object") {
          metadata.tables = { ...metadata.tables, ...parsed.tables };
        }
      } catch (error) {
        console.warn("[mdtp] invalid template table metadata ignored", error);
      }
    }
    return {
      content: kept.join("\n"),
      metadata
    };
  }
  prepareTemplateContentForInsertion(content, file) {
    const extracted = this.extractTemplateTableMetadata(content);
    const originalEndsWithNewline = /\r?\n$/.test(extracted.content);
    const lines = extracted.content.split(/\r?\n/);
    const parsedTables = this.parseMarkdownTables(extracted.content).filter((table) => !!table.tableId);
    const idMap = /* @__PURE__ */ new Map();
    for (const table of parsedTables) {
      if (!table.tableId || idMap.has(table.tableId)) continue;
      idMap.set(table.tableId, this.generateTableId());
    }
    if (idMap.size === 0) {
      return { content: extracted.content, tableRecords: [] };
    }
    for (let index = 0; index < lines.length; index += 1) {
      const tableId = this.extractTableMarkerId(lines[index]);
      const nextId = tableId ? idMap.get(tableId) : null;
      if (nextId) {
        lines[index] = this.formatTableMarker(nextId);
      }
    }
    this.ensureBlankLineAfterTableMarkers(lines);
    const transformedContent = this.joinLines(lines, originalEndsWithNewline);
    const transformedTables = this.parseMarkdownTables(transformedContent).filter((table) => !!table.tableId);
    const now = Date.now();
    const tableRecords = [];
    for (let index = 0; index < parsedTables.length && index < transformedTables.length; index += 1) {
      const sourceTable = parsedTables[index];
      const targetTable = transformedTables[index];
      if (!sourceTable.tableId || !targetTable.tableId) continue;
      const templateRecord = extracted.metadata.tables[sourceTable.tableId];
      const sourceRecord = this.dataStore.tables[sourceTable.tableId];
      const layout = this.normalizeLayout(templateRecord?.layout ?? sourceRecord?.layout ?? this.createEmptyLayout());
      tableRecords.push({
        tableId: targetTable.tableId,
        mode: templateRecord?.mode ?? this.getTableRecordMode(sourceRecord),
        filePath: file.path,
        createdAt: now,
        updatedAt: now,
        lastKnownHash: this.hashString(targetTable.raw),
        lastKnownRange: {
          startLine: targetTable.startLine,
          endLine: targetTable.endLine
        },
        layout
      });
    }
    return {
      content: transformedContent,
      tableRecords
    };
  }
  extractLayoutForSelection(layout, selection) {
    const next = this.createEmptyLayout();
    for (let col = selection.startCol; col <= selection.endCol; col += 1) {
      const value = layout.colWidths[String(col)];
      if (value !== void 0) next.colWidths[String(col - selection.startCol)] = value;
      const color = layout.colColors[String(col)];
      if (color !== void 0) next.colColors[String(col - selection.startCol)] = color;
    }
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      const value = layout.rowHeights[String(row)];
      if (value !== void 0) next.rowHeights[String(row - selection.startRow)] = value;
      const color = layout.rowColors[String(row)];
      if (color !== void 0) next.rowColors[String(row - selection.startRow)] = color;
    }
    for (const [key, value] of Object.entries(layout.cellColors)) {
      const coord = this.parseCellKey(key);
      if (!coord || !this.selectionContains(selection, coord)) continue;
      next.cellColors[this.getCellKey({ row: coord.row - selection.startRow, col: coord.col - selection.startCol })] = value;
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
    next.merges = layout.merges.filter((merge) => {
      const endRow = merge.row + merge.rowspan - 1;
      const endCol = merge.col + merge.colspan - 1;
      return merge.row >= selection.startRow && merge.col >= selection.startCol && endRow <= selection.endRow && endCol <= selection.endCol;
    }).map((merge) => ({
      row: merge.row - selection.startRow,
      col: merge.col - selection.startCol,
      rowspan: merge.rowspan,
      colspan: merge.colspan
    }));
    return next;
  }
  createTemplateRecord(templatePath) {
    const normalizedPath = (0, import_obsidian.normalizePath)(templatePath);
    const relativePath = normalizedPath.startsWith(`${TEMPLATE_LIBRARY_FOLDER}/`) ? normalizedPath.slice(TEMPLATE_LIBRARY_FOLDER.length + 1) : normalizedPath;
    const segments = relativePath.split("/").filter(Boolean);
    const folderSegments = segments.slice(0, -1);
    return {
      name: this.getTemplateNameFromPath(normalizedPath),
      path: normalizedPath,
      folderPath: folderSegments.join("/"),
      relativePath,
      folderSegments
    };
  }
  async listTemplateMarkdownPaths(folderPath) {
    const adapter = this.app.vault.adapter;
    const paths = /* @__PURE__ */ new Set();
    if (!await adapter.exists(folderPath)) return [];
    const collect = async (currentFolder) => {
      const listing = await adapter.list(currentFolder);
      for (const filePath of listing.files ?? []) {
        if (!filePath.toLowerCase().endsWith(".md")) continue;
        paths.add((0, import_obsidian.normalizePath)(filePath));
      }
      for (const childFolder of listing.folders ?? []) {
        await collect((0, import_obsidian.normalizePath)(childFolder));
      }
    };
    await collect(folderPath);
    return Array.from(paths);
  }
  sanitizeTemplateRelativePath(rawName) {
    const rawSegments = rawName.trim().replace(/\\/g, "/").split("/").map((segment) => this.sanitizeTemplatePathSegment(segment)).filter(Boolean);
    if (rawSegments.length === 0) return "\u672A\u547D\u540D\u6A21\u677F";
    return rawSegments.join("/");
  }
  sanitizeTemplatePathSegment(rawName) {
    const sanitized = rawName.trim().replace(/[:*?"<>|\n\r\t]/g, " ").replace(/\s+/g, " ").replace(/^\.+/, "").slice(0, 60).trim();
    return sanitized;
  }
  async getAvailableTemplatePath(safeRelativePath) {
    const adapter = this.app.vault.adapter;
    let index = 1;
    const normalizedRelativePath = (0, import_obsidian.normalizePath)(safeRelativePath);
    const basePath = (0, import_obsidian.normalizePath)(`${TEMPLATE_LIBRARY_FOLDER}/${normalizedRelativePath}`);
    let candidate = `${basePath}.md`;
    while (await adapter.exists(candidate)) {
      index += 1;
      candidate = `${basePath} ${index}.md`;
    }
    return candidate;
  }
  getParentPath(filePath) {
    const normalizedPath = (0, import_obsidian.normalizePath)(filePath);
    const slashIndex = normalizedPath.lastIndexOf("/");
    return slashIndex > 0 ? normalizedPath.slice(0, slashIndex) : "";
  }
  getTemplateNameFromPath(templatePath) {
    const fileName = templatePath.split("/").pop() ?? templatePath;
    return fileName.replace(/\.md$/i, "");
  }
  openOneNoteRichPasteModal(file) {
    new OneNoteRichPasteModal(this, file).open();
  }
  async pasteOneNoteFromSystemClipboardOrOpenModal(file) {
    const html = await this.readHtmlFromAvailableClipboard();
    if (html.trim()) {
      const ok = await this.importOneNoteRichContent(file, html, []);
      if (ok) return;
    }
    this.openOneNoteRichPasteModal(file);
  }
  async restoreLatestSnapshot(file) {
    const snapshot = this.dataStore.snapshots.find((item) => item.filePath === file.path);
    if (!snapshot) {
      new import_obsidian.Notice("\u5F53\u524D\u6587\u4EF6\u6CA1\u6709\u53EF\u6062\u590D\u7684\u8868\u683C\u589E\u5F3A\u5FEB\u7167");
      return;
    }
    const adapter = this.app.vault.adapter;
    const exists = await adapter.exists(snapshot.backupPath);
    if (!exists) {
      new import_obsidian.Notice("\u6700\u8FD1\u4E00\u6B21\u5FEB\u7167\u6587\u4EF6\u4E0D\u5B58\u5728\uFF0C\u65E0\u6CD5\u6062\u590D");
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
    new import_obsidian.Notice("\u5DF2\u6062\u590D\u5F53\u524D\u6587\u4EF6\u6700\u8FD1\u4E00\u6B21\u8868\u683C\u589E\u5F3A\u5FEB\u7167");
  }
  async showCurrentFileStatus(file) {
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
    new import_obsidian.Notice(
      `\u5F53\u524D\u6587\u4EF6\u5171 ${parsedTables.length} \u5F20\u8868\u683C\uFF0C\u5DF2\u6807\u8BC6 ${anchoredCount} \u5F20\uFF0C\u5176\u4E2D\u589E\u5F3A ${enhancedCount} \u5F20\uFF0C\u957F\u5BBD\u9AD8\u8C03\u8282 ${nativeLayoutCount} \u5F20\uFF0C\u53EF\u6062\u590D\u5FEB\u7167 ${snapshotCount} \u4EFD`,
      6e3
    );
  }
  isExperimentalFeatureEnabled() {
    return !!this.dataStore.experimentalFeatureGate;
  }
  async setExperimentalFeatureGate(enabled) {
    this.dataStore.experimentalFeatureGate = !!enabled;
    await this.savePluginData();
    if (!enabled) {
      this.hideImageManipulator();
      if (this.oneNoteStatusButtonEl) {
        this.oneNoteStatusButtonEl.style.display = "none";
      }
    }
  }
  async toggleExperimentalFeatureGate() {
    this.dataStore.experimentalFeatureGate = !this.dataStore.experimentalFeatureGate;
    await this.savePluginData();
    if (!this.isExperimentalFeatureEnabled()) {
      this.hideImageManipulator();
    }
    new import_obsidian.Notice(this.isExperimentalFeatureEnabled() ? "\u5DF2\u5F00\u542F\u589E\u5F3A\u8868\u683C\u6D4B\u8BD5\u7248\u80FD\u529B" : "\u5DF2\u5173\u95ED\u589E\u5F3A\u8868\u683C\u6D4B\u8BD5\u7248\u80FD\u529B");
  }
  decorateOneNoteRichTables(element, context) {
    const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
    if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") return;
    const roots = [
      ...element.matches(".mdtp-onenote-rich-table") ? [element] : [],
      ...Array.from(element.querySelectorAll(".mdtp-onenote-rich-table"))
    ];
    for (const root of roots) {
      for (const table of Array.from(root.querySelectorAll("table"))) {
        table.classList.add("mdtp-onenote-table");
      }
      for (const image of Array.from(root.querySelectorAll("img[data-mdtp-src]"))) {
        const rawPath = image.dataset.mdtpSrc?.trim() ?? "";
        if (!rawPath) continue;
        const resolved = this.app.metadataCache.getFirstLinkpathDest(rawPath, file.path) ?? this.app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(rawPath));
        if (resolved instanceof import_obsidian.TFile) {
          image.src = this.app.vault.getResourcePath(resolved);
        }
      }
    }
  }
  async decorateRenderedTables(element, context) {
    const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
    if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") return;
    const renderedTables = this.getRenderedTables(element);
    if (renderedTables.length === 0) return;
    const content = await this.app.vault.cachedRead(file);
    const parsedTables = this.getRelevantParsedTables(this.parseMarkdownTables(content), context, element);
    if (parsedTables.length === 0) return;
    for (let index = 0; index < renderedTables.length && index < parsedTables.length; index += 1) {
      const tableEl = renderedTables[index];
      const parsedTable = parsedTables[index] ?? null;
      await this.enhanceRenderedTable(tableEl, file, parsedTable);
    }
  }
  scheduleVisibleTableRefresh() {
    if (this.refreshTimer !== null) {
      window.clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshVisibleTablesInWorkspace();
    }, 80);
  }
  queueRefreshBurst() {
    const token = ++this.refreshBurstToken;
    const offsets = [0, 120, 360, 900, 1800];
    for (const offset of offsets) {
      window.setTimeout(() => {
        if (token !== this.refreshBurstToken) return;
        this.scheduleVisibleTableRefresh();
      }, offset);
    }
  }
  async refreshVisibleTablesInWorkspace() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      const file = view?.file;
      if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") continue;
      const contentEl = view?.contentEl;
      if (!(contentEl instanceof HTMLElement)) continue;
      this.hideVisibleMarkerLines(contentEl);
      this.decorateOneNoteRichTables(contentEl, { sourcePath: file.path });
      const tables = this.getRenderedTables(contentEl);
      if (tables.length === 0) continue;
      const content = await this.app.vault.cachedRead(file);
      const parsedTables = this.parseMarkdownTables(content);
      if (parsedTables.length === 0) continue;
      for (let index = 0; index < tables.length && index < parsedTables.length; index += 1) {
        await this.enhanceRenderedTable(tables[index], file, parsedTables[index] ?? null);
      }
    }
  }
  hideVisibleMarkerLines(root) {
    const previouslyHidden = Array.from(root.querySelectorAll("[data-mdtp-marker-hidden='true']"));
    for (const element of previouslyHidden) {
      element.style.display = "";
      element.removeAttribute("data-mdtp-marker-hidden");
      element.classList.remove("mdtp-marker-line");
    }
    const candidates = Array.from(root.querySelectorAll("*"));
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
  resolveMarkerContainer(element, root) {
    const selectors = [
      ".cm-line",
      ".HyperMD-codeblock",
      ".HyperMD-comment",
      "p",
      "li",
      "div"
    ];
    const container = element.closest(selectors.join(", "));
    if (container && root.contains(container)) {
      const normalizedText = (container.textContent ?? "").replace(/\u200b/g, "").trim();
      if (this.isHiddenMarkerText(normalizedText)) {
        return container;
      }
    }
    return root.contains(element) ? element : null;
  }
  createHiddenMarkerEditorExtension() {
    const isMarkerText = (text) => this.isHiddenMarkerText(text.trim());
    const buildDecorations = (view) => {
      const builder = new import_state.RangeSetBuilder();
      const seen = /* @__PURE__ */ new Set();
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
    return import_view.ViewPlugin.fromClass(
      class {
        constructor(view) {
          __publicField(this, "decorations");
          this.decorations = buildDecorations(view);
        }
        update(update) {
          if (update.docChanged || update.viewportChanged || update.selectionSet) {
            this.decorations = buildDecorations(update.view);
          }
        }
      },
      {
        decorations: (value) => value.decorations
      }
    );
  }
  getRenderedTables(element) {
    const tables = Array.from(element.querySelectorAll("table")).filter(
      (table) => !table.closest(".mdtp-onenote-rich-table")
    );
    if (element.matches("table") && !element.closest(".mdtp-onenote-rich-table")) {
      return [element, ...tables];
    }
    return tables;
  }
  getRelevantParsedTables(parsedTables, context, element) {
    const contextAny = context;
    const sectionInfo = contextAny.getSectionInfo?.(element) ?? contextAny.getSectionInfo?.(element.parentElement);
    if (!sectionInfo) return parsedTables;
    return parsedTables.filter((table) => table.endLine >= sectionInfo.lineStart && table.startLine <= sectionInfo.lineEnd);
  }
  async enhanceRenderedTable(tableEl, file, parsedTable) {
    const tableId = parsedTable?.tableId ?? null;
    if (!tableId || !parsedTable) {
      this.runtimeState.delete(tableEl);
      this.restoreNativeTable(tableEl);
      return;
    }
    tableEl.dataset.mdtpBound = "true";
    const runtime = this.runtimeState.get(tableEl) ?? {
      file,
      parsedTable,
      selection: null,
      anchor: null
    };
    runtime.file = file;
    runtime.parsedTable = parsedTable;
    this.runtimeState.set(tableEl, runtime);
    tableEl.classList.add("mdtp-table-shell");
    this.indexTableCells(tableEl);
    this.clearInjectedTableArtifacts(tableEl);
    tableEl.dataset.mdtpTableId = tableId;
    const record = await this.ensureRecordForParsedTable(file, parsedTable);
    if (record.mode === "nativeLayout") {
      runtime.selection = null;
      runtime.anchor = null;
      tableEl.classList.remove("mdtp-table-uninitialized", "mdtp-table-enhanced");
      tableEl.classList.add("mdtp-table-native-layout");
      this.applyNativeLayout(tableEl, record.layout);
      this.injectResizeHandles(tableEl, record.layout);
      return;
    }
    tableEl.classList.remove("mdtp-table-uninitialized", "mdtp-table-native-layout", "mdtp-table-colored");
    tableEl.classList.add("mdtp-table-enhanced");
    this.applyLayout(tableEl, record.layout);
    this.renderImageMarkupInEnhancedCells(tableEl, file, parsedTable, record.layout);
    this.injectResizeHandles(tableEl, record.layout);
    this.renderSelection(tableEl, runtime.selection, runtime.anchor);
  }
  async ensureRecordForParsedTable(file, parsedTable) {
    const tableId = parsedTable.tableId;
    if (!tableId) {
      throw new Error("Cannot ensure record without tableId");
    }
    const existing = this.dataStore.tables[tableId];
    if (existing) {
      return existing;
    }
    const now = Date.now();
    const record = {
      tableId,
      mode: "enhanced",
      filePath: file.path,
      createdAt: now,
      updatedAt: now,
      lastKnownHash: this.hashString(parsedTable.raw),
      lastKnownRange: {
        startLine: parsedTable.startLine,
        endLine: parsedTable.endLine
      },
      layout: this.createEmptyLayout()
    };
    this.dataStore.tables[tableId] = record;
    await this.savePluginData();
    return record;
  }
  indexTableCells(tableEl) {
    const rows = Array.from(tableEl.rows);
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      row.dataset.mdtpRow = String(rowIndex);
      const cells = Array.from(row.cells);
      for (let colIndex = 0; colIndex < cells.length; colIndex += 1) {
        const cell = cells[colIndex];
        cell.dataset.mdtpRow = String(rowIndex);
        cell.dataset.mdtpCol = String(colIndex);
        cell.classList.add("mdtp-cell");
      }
    }
  }
  clearInjectedTableArtifacts(tableEl) {
    for (const element of Array.from(tableEl.querySelectorAll(".mdtp-resize-handle"))) {
      element.remove();
    }
    const rows = Array.from(tableEl.rows);
    for (const row of rows) {
      row.style.removeProperty("--mdtp-row-height");
      row.style.height = "";
      row.classList.remove("mdtp-row-resized");
      const cells = Array.from(row.cells);
      for (const cell of cells) {
        cell.style.removeProperty("--mdtp-col-width");
        cell.style.removeProperty("--mdtp-cell-bg");
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
        cell.classList.remove(
          "mdtp-col-resized",
          "mdtp-cell-selected",
          "mdtp-cell-anchor",
          "mdtp-cell-dark-header",
          "mdtp-merge-start",
          "mdtp-merge-covered"
        );
        for (const wrapper of Array.from(cell.querySelectorAll(".image-embed, .internal-embed, .media-embed"))) {
          wrapper.style.display = "";
          wrapper.style.maxWidth = "";
          wrapper.style.verticalAlign = "";
        }
        for (const image of Array.from(cell.querySelectorAll("img"))) {
          image.style.display = "";
          image.style.width = "";
          image.style.maxWidth = "";
          image.style.height = "";
        }
      }
    }
  }
  restoreNativeTable(tableEl) {
    this.clearInjectedTableArtifacts(tableEl);
    tableEl.classList.remove("mdtp-table-shell", "mdtp-table-enhanced", "mdtp-table-native-layout", "mdtp-table-uninitialized", "mdtp-table-colored");
    tableEl.style.tableLayout = "";
    tableEl.style.removeProperty("--mdtp-native-color-border");
    delete tableEl.dataset.mdtpBound;
    delete tableEl.dataset.mdtpTableId;
    const rows = Array.from(tableEl.rows);
    for (const row of rows) {
      delete row.dataset.mdtpRow;
      const cells = Array.from(row.cells);
      for (const cell of cells) {
        delete cell.dataset.mdtpRow;
        delete cell.dataset.mdtpCol;
        cell.classList.remove("mdtp-cell");
        cell.removeAttribute("tabindex");
      }
    }
  }
  applyLayout(tableEl, layout) {
    tableEl.style.tableLayout = "fixed";
    const structure = this.collectTableStructure(tableEl);
    this.applySizeLayout(tableEl, layout);
    this.applyColors(structure, layout);
    this.applyMerges(structure, layout.merges);
  }
  applyNativeLayout(tableEl, layout) {
    this.normalizeNativeColorPresetLayout(layout);
    const nativePalette = this.getLayoutNativeColorPalette(layout);
    if (nativePalette) {
      tableEl.style.setProperty("--mdtp-native-color-border", nativePalette.border);
    } else {
      tableEl.style.removeProperty("--mdtp-native-color-border");
    }
    tableEl.style.tableLayout = Object.keys(layout.colWidths).length > 0 ? "fixed" : "auto";
    tableEl.classList.toggle("mdtp-table-colored", this.hasLayoutColors(layout));
    this.applySizeLayout(tableEl, layout);
    this.applyColors(this.collectTableStructure(tableEl), layout);
  }
  hasLayoutColors(layout) {
    return layout.nativeColorPreset === NATIVE_COLOR_PRESET_BLUE_ZEBRA || Object.keys(layout.cellColors).length > 0 || Object.keys(layout.rowColors).length > 0 || Object.keys(layout.colColors).length > 0;
  }
  applySizeLayout(tableEl, layout) {
    const structure = this.collectTableStructure(tableEl);
    for (const [colKey, width] of Object.entries(layout.colWidths)) {
      const colIndex = Number.parseInt(colKey, 10);
      if (!Number.isFinite(colIndex)) continue;
      this.applyColumnWidth(structure, colIndex, width);
    }
    for (const [rowKey, height] of Object.entries(layout.rowHeights)) {
      const rowIndex = Number.parseInt(rowKey, 10);
      if (!Number.isFinite(rowIndex)) continue;
      this.applyRowHeight(structure, rowIndex, height);
    }
  }
  collectTableStructure(tableEl) {
    const rows = Array.from(tableEl.rows);
    const matrix = [];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      matrix[rowIndex] = Array.from(rows[rowIndex].cells);
    }
    return { rows, matrix };
  }
  applyColumnWidth(structure, colIndex, width) {
    const storedWidth = Number(width);
    if (!Number.isFinite(storedWidth) || storedWidth <= 0) return;
    const nextWidth = Math.max(MIN_COLUMN_WIDTH, Math.round(storedWidth));
    for (const row of structure.matrix) {
      const cell = row[colIndex];
      if (!cell) continue;
      cell.style.setProperty("--mdtp-col-width", `${nextWidth}px`);
      cell.style.width = `${nextWidth}px`;
      cell.style.minWidth = `${nextWidth}px`;
      cell.classList.add("mdtp-col-resized");
    }
  }
  applyRowHeight(structure, rowIndex, height) {
    const storedHeight = Number(height);
    if (!Number.isFinite(storedHeight) || storedHeight <= 0) return;
    const nextHeight = Math.max(MIN_ROW_HEIGHT, Math.round(storedHeight));
    const row = structure.rows[rowIndex];
    if (!row) return;
    row.style.setProperty("--mdtp-row-height", `${nextHeight}px`);
    row.style.height = `${nextHeight}px`;
    row.classList.add("mdtp-row-resized");
  }
  applyColors(structure, layout) {
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
        if (headerTextColor) {
          cell.style.color = headerTextColor;
          cell.classList.add("mdtp-cell-dark-header");
        }
        const alignment = layout.cellAlignments[cellKey] ?? "";
        cell.style.textAlign = alignment;
        this.applyImagePresentationToCell(cell, layout.cellImageWidths[cellKey]);
      }
    }
  }
  isNativeColorTableHeaderColor(color) {
    const normalized = color.trim().toUpperCase();
    return normalized === NATIVE_COLOR_TABLE_HEADER.toUpperCase() || normalized === NATIVE_COLOR_TABLE_LEGACY_HEADER.toUpperCase() || normalized === NATIVE_COLOR_PRESET_PALETTES.blue.header.toUpperCase();
  }
  isLegacyNativeColorTableHeaderColor(color) {
    return color.trim().toUpperCase() === NATIVE_COLOR_TABLE_LEGACY_HEADER.toUpperCase();
  }
  resolveCellBackgroundColor(layout, rowIndex, colIndex, cellKey) {
    return layout.cellColors[cellKey] ?? layout.rowColors[String(rowIndex)] ?? layout.colColors[String(colIndex)] ?? this.getNativeColorPresetRowColor(layout, rowIndex) ?? "";
  }
  getNativeColorPresetRowColor(layout, rowIndex) {
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return null;
    const palette = this.getLayoutNativeColorPalette(layout) ?? this.getCurrentNativeColorPalette();
    if (rowIndex === 0) return palette.header;
    return rowIndex % 2 === 0 ? palette.altRow : palette.baseRow;
  }
  getNativeHeaderTextColor(layout, color) {
    if (layout.nativeColorPreset !== NATIVE_COLOR_PRESET_BLUE_ZEBRA) return "";
    const palette = this.getLayoutNativeColorPalette(layout) ?? this.getCurrentNativeColorPalette();
    return this.colorsMatch(color, palette.header) || this.isNativeColorTableHeaderColor(color) ? palette.headerText : "";
  }
  applyImagePresentationToCell(cell, width) {
    for (const wrapper of Array.from(
      cell.querySelectorAll(".image-embed, .internal-embed, .media-embed, .mdtp-rendered-image-embed")
    )) {
      wrapper.style.display = "inline-block";
      wrapper.style.maxWidth = "100%";
      wrapper.style.verticalAlign = "top";
    }
    for (const image of Array.from(cell.querySelectorAll("img"))) {
      image.style.display = "inline-block";
      image.style.maxWidth = "100%";
      image.style.height = "auto";
      if (width) {
        image.style.width = `${Math.max(80, Math.round(width))}px`;
      }
    }
  }
  renderImageMarkupInEnhancedCells(tableEl, file, parsedTable, layout) {
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
  renderCellImageMarkup(cell, file, value) {
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
  appendRenderedCellText(root, text) {
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
  appendRenderedCellInlineContent(root, text) {
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
  applyMerges(structure, merges) {
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
  isMergeShapeValid(structure, merge) {
    if (merge.rowspan < 1 || merge.colspan < 1) return false;
    const endRow = merge.row + merge.rowspan - 1;
    const endCol = merge.col + merge.colspan - 1;
    return !!structure.matrix[merge.row]?.[merge.col] && !!structure.matrix[endRow]?.[endCol];
  }
  isMergeWithinSameSection(structure, merge) {
    const startRow = structure.rows[merge.row];
    const endRow = structure.rows[merge.row + merge.rowspan - 1];
    if (!startRow || !endRow) return false;
    return startRow.parentElement?.tagName === endRow.parentElement?.tagName;
  }
  injectResizeHandles(tableEl, layout) {
    const structure = this.collectTableStructure(tableEl);
    const firstRow = structure.matrix[0] ?? [];
    for (let colIndex = 0; colIndex < firstRow.length; colIndex += 1) {
      const cell = firstRow[colIndex];
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
      cell.appendChild(handle);
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
      cell.appendChild(handle);
      if (layout.rowHeights[String(rowIndex)]) {
        structure.rows[rowIndex].style.setProperty("--mdtp-row-height", `${layout.rowHeights[String(rowIndex)]}px`);
        structure.rows[rowIndex].style.height = `${layout.rowHeights[String(rowIndex)]}px`;
      }
    }
  }
  handleDocumentPointerDown(event) {
    const target = event.target;
    if (!target) return;
    if (target.closest(".mdtp-sidebar-handle, .mdtp-sidebar-popover, .mdtp-copy-image-handle")) return;
    if (target.closest(".mdtp-image-manipulator")) return;
    if (target.closest(".mdtp-inline-editor")) return;
    if (this.tableSidebarPopoverEl) {
      this.hideTableSidebarPopover();
    }
    const tableEl = target.closest("table.mdtp-table-shell");
    if (!tableEl) {
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
  async handleDocumentClick(event) {
    const target = event.target;
    if (!target) return;
    if (target.closest(".mdtp-sidebar-handle, .mdtp-sidebar-popover, .mdtp-copy-image-handle")) return;
    if (target.closest(".mdtp-image-manipulator")) return;
    const nativeContext = await this.getTargetUninitializedTableContext(target);
    if (nativeContext) {
      this.activeNativeTableContext = nativeContext;
      if (nativeContext.tableEl) {
        this.showTableSidebar({
          mode: "native",
          file: nativeContext.file,
          parsedTable: nativeContext.parsedTable,
          coord: nativeContext.coord,
          tableEl: nativeContext.tableEl
        });
      }
    } else if (!target.closest("table.mdtp-table-shell")) {
      this.activeNativeTableContext = null;
      this.hideTableSidebar(true);
    }
    const nativeLayoutContext = this.getNativeLayoutTableSidebarContext(target);
    if (nativeLayoutContext) {
      this.activeNativeTableContext = null;
      this.showTableSidebar(nativeLayoutContext);
    }
    if (await this.maybeOpenEnhancedCellEditorFromClick(event, target)) {
      return;
    }
    const imageTarget = target.closest("img, .image-embed, .internal-embed, .media-embed");
    const tableEl = imageTarget?.closest("table.mdtp-table-shell");
    if (!imageTarget || !tableEl || !this.isInitializedEnhancedTable(tableEl)) {
      this.hideImageToolbar();
      this.hideImageManipulator();
      return;
    }
    const runtime = this.runtimeState.get(tableEl);
    const cell = imageTarget.closest("th, td");
    const coord = cell ? this.getCellCoord(cell) : null;
    const tableId = this.getInitializedTableId(tableEl);
    const imageEl = this.resolveImageElement(imageTarget);
    if (!runtime || !cell || !coord || !tableId || !imageEl) {
      this.hideImageToolbar();
      this.hideImageManipulator();
      return;
    }
    this.hideImageToolbar();
    this.showImageManipulator(
      tableEl,
      runtime.file,
      tableId,
      coord,
      cell,
      imageEl
    );
  }
  async maybeOpenEnhancedCellEditorFromClick(event, target) {
    if (event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
    if (target.closest(
      [
        ".mdtp-inline-editor",
        ".mdtp-resize-handle",
        ".mdtp-sidebar-handle",
        ".mdtp-copy-image-handle",
        ".mdtp-sidebar-popover",
        ".mdtp-image-manipulator",
        "img",
        ".image-embed",
        ".internal-embed",
        ".media-embed",
        ".markdown-embed"
      ].join(", ")
    )) {
      return false;
    }
    const cell = target.closest("th, td");
    const tableEl = target.closest("table.mdtp-table-shell");
    if (!cell || !tableEl || !tableEl.contains(cell) || !this.isInitializedEnhancedTable(tableEl)) return false;
    const runtime = this.runtimeState.get(tableEl);
    const tableId = this.getInitializedTableId(tableEl);
    const coord = this.getCellCoord(cell);
    if (!runtime || !tableId || !coord) return false;
    const selection = runtime.selection;
    const isSingleSelected = selection && selection.startRow === coord.row && selection.endRow === coord.row && selection.startCol === coord.col && selection.endCol === coord.col;
    const isAnchor = runtime.anchor?.row === coord.row && runtime.anchor?.col === coord.col;
    if (!isSingleSelected || !isAnchor) return false;
    event.preventDefault();
    event.stopPropagation();
    await this.openInlineEditor(tableEl, runtime.file, tableId, runtime.parsedTable, cell, coord);
    return true;
  }
  async handleDocumentDoubleClick(event) {
    const target = event.target;
    if (!target) return;
    if (target.closest(".mdtp-inline-editor")) return;
    if (target.closest("img, .image-embed, .internal-embed, .media-embed, .markdown-embed")) return;
    const cell = target.closest("th, td");
    const tableEl = target.closest("table.mdtp-table-shell");
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
  async handleDocumentContextMenu(event) {
    const target = event.target;
    if (!target) return;
    const tableEl = target.closest("table.mdtp-table-shell");
    if (!tableEl) {
      const plainContext = await this.getTargetUninitializedTableContext(target);
      if (plainContext) {
        const menu = new import_obsidian.Menu();
        this.addNativeLayoutMenuItem(menu, plainContext.file, plainContext.parsedTable);
        menu.addSeparator?.();
        this.addTemplateMenuItems(menu, { plainTableContext: plainContext });
        const view2 = this.getContainingMarkdownView(target);
        this.showTableContextMenu(menu, event, view2, {
          parsedTable: plainContext.parsedTable,
          coord: plainContext.coord
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
    const cell = target.closest("th, td");
    const coord = cell ? this.getCellCoord(cell) : null;
    if (coord) {
      runtime.anchor = coord;
      runtime.selection = this.selectionContains(runtime.selection, coord) ? runtime.selection : this.normalizeSelection(coord, coord);
      this.renderSelection(tableEl, runtime.selection, runtime.anchor);
    }
    const view = this.getContainingMarkdownView(target);
    if (view) {
      this.lastTableContext = {
        at: Date.now(),
        filePath: view.file?.path ?? runtime.file.path,
        tableEl,
        target,
        x: event.clientX,
        y: event.clientY
      };
    }
    const effectiveTableId = tableEl.dataset.mdtpTableId || runtime.parsedTable?.tableId || "";
    if (effectiveTableId || !this.shouldUseNativeEditorMenu(target, view)) {
      this.handleTableContextMenu(event, tableEl);
    }
  }
  resolveBlockLinkPlusPlugin() {
    const feishu = this.app.plugins.plugins["feishu-doc-toolbar"];
    if (typeof feishu?.getBlockLinkPlusInstance === "function") {
      const embedded = feishu.getBlockLinkPlusInstance();
      if (embedded) {
        return embedded;
      }
    }
    return this.app.plugins.plugins["block-link-plus"];
  }
  isBlockLinkPlusAvailable() {
    const feishu = this.app.plugins.plugins["feishu-doc-toolbar"];
    if (typeof feishu?.isBlockLinkPlusActive === "function" && feishu.isBlockLinkPlusActive()) {
      return true;
    }
    return this.app.plugins.enabledPlugins.has("block-link-plus");
  }
  appendBlockLinkPlusMenuItems(menu, view, hint) {
    const blp = this.resolveBlockLinkPlusPlugin();
    if (!blp?.api?.appendEditorLinkMenuItems || !view || !this.isBlockLinkPlusAvailable() || blp.settings?.injectBlockLinkInTableMenus === false) {
      return;
    }
    const editor = view.editor;
    if (!editor) return;
    const menuAny = menu;
    if (menuAny.__blpLinkMenuAugmented) {
      return;
    }
    let preferLine;
    if (hint?.parsedTable && hint?.coord && blp.api.tableCoordToSourceLine) {
      const line = blp.api.tableCoordToSourceLine(hint.parsedTable, hint.coord);
      if (line != null) preferLine = line;
    }
    if (preferLine != null && typeof editor.setCursor === "function") {
      try {
        editor.setCursor({ line: preferLine, ch: 0 });
      } catch {
      }
    }
    blp.api.appendEditorLinkMenuItems(
      menu,
      editor,
      view,
      preferLine != null ? { preferLine, preferEndLine: preferLine } : void 0
    );
  }
  showTableContextMenu(menu, event, view, hint) {
    this.appendBlockLinkPlusMenuItems(menu, view, hint);
    event.preventDefault();
    event.stopPropagation();
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
  addEditorMenuItems(menu, view) {
    const menuAny = menu;
    if (menuAny.__mdtpAugmented) return;
    const context = this.getEditorMenuContext(view);
    if (!context) {
      const nativeContext = this.activeNativeTableContext && this.activeNativeTableContext.file.path === view.file?.path ? this.activeNativeTableContext : null;
      const parsedTableAtCursor = this.getParsedTableAtEditorLine(view);
      if (nativeContext && nativeContext.file.path === view.file?.path) {
        this.addNativeLayoutMenuItem(menu, nativeContext.file, nativeContext.parsedTable);
        menu.addSeparator?.();
      }
      if (parsedTableAtCursor?.tableId && view.file && this.dataStore.tables[parsedTableAtCursor.tableId]) {
        this.addTemplateMenuItems(menu, {
          file: view.file,
          tableId: parsedTableAtCursor.tableId
        });
      } else {
        this.addTemplateMenuItems(menu, {
          plainTableContext: nativeContext ?? (parsedTableAtCursor && view.file ? {
            file: view.file,
            parsedTable: parsedTableAtCursor,
            coord: { row: 0, col: 0 },
            tableEl: null
          } : null)
        });
      }
      this.appendBlockLinkPlusMenuItems(menu, view, {
        parsedTable: nativeContext?.parsedTable ?? null,
        coord: nativeContext?.coord ?? null
      });
      menuAny.__mdtpAugmented = true;
      return;
    }
    const { runtime, coord, tableId } = context;
    if (!tableId) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable);
      menu.addSeparator?.();
      this.addTemplateMenuItems(menu, {
        plainTableContext: runtime.parsedTable && coord ? {
          file: runtime.file,
          parsedTable: runtime.parsedTable,
          coord,
          tableEl: context.tableEl
        } : null
      });
      this.appendBlockLinkPlusMenuItems(menu, view, {
        parsedTable: runtime.parsedTable,
        coord
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
      menu.addSeparator?.();
      this.addTemplateMenuItems(menu, {
        file: runtime.file,
        tableId
      });
      this.appendBlockLinkPlusMenuItems(menu, view, {
        parsedTable: runtime.parsedTable,
        coord
      });
      menuAny.__mdtpAugmented = true;
      return;
    }
    if (!coord) return;
    if (this.canConvertEnhancedRecordToNativeLayout(record)) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable, tableId);
      menu.addSeparator?.();
    }
    this.addTemplateMenuItems(menu, {
      file: runtime.file,
      tableId,
      tableSelection: runtime.selection ?? this.normalizeSelection(coord, coord)
    });
    this.appendBlockLinkPlusMenuItems(menu, view, {
      parsedTable: runtime.parsedTable,
      coord
    });
    menuAny.__mdtpAugmented = true;
  }
  addTemplateMenuItems(menu, options) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const hasEditorSelection = !!this.getEditorTemplateSaveContent(activeView, true)?.trim();
    const hasTableSelection = !!options?.file && !!options.tableId && !!options.tableSelection;
    const hasPlainTableSelection = !!options?.plainTableContext;
    const parsedTableAtCursor = activeView ? this.getParsedTableAtEditorLine(activeView) : null;
    const hasCurrentTable = !!options?.plainTableContext || !!options?.file && !!options.tableId || !!parsedTableAtCursor;
    menu.addItem((item) => {
      item.setTitle("\u4FDD\u5B58\u5F53\u524D\u8868\u683C\u4E3A\u6A21\u677F");
      item.setIcon("table-properties");
      item.setDisabled(!hasCurrentTable);
      item.onClick(() => {
        void this.saveCurrentTableTemplateFromMenuContext(options);
      });
    });
    menu.addItem((item) => {
      item.setTitle("\u4FDD\u5B58\u9009\u4E2D\u5185\u5BB9\u4E3A\u6A21\u677F");
      item.setIcon("bookmark-plus");
      item.setDisabled(!hasEditorSelection && !hasTableSelection && !hasPlainTableSelection);
      item.onClick(() => {
        void this.saveTemplateFromMenuContext(options);
      });
    });
    menu.addItem((item) => {
      item.setTitle("\u63D2\u5165\u6A21\u677F");
      item.setIcon("list-plus");
      item.onClick(() => this.openTemplateLibraryModal());
    });
    menu.addItem((item) => {
      item.setTitle("\u6A21\u677F\u5E93");
      item.setIcon("folder-open");
      item.onClick(() => this.openTemplateLibraryModal());
    });
  }
  async saveCurrentTableTemplateFromMenuContext(options) {
    if (options?.plainTableContext) {
      return this.savePlainTableAsTemplate(options.plainTableContext);
    }
    if (options?.file && options.tableId) {
      const content = await this.app.vault.cachedRead(options.file);
      const parsedTable = this.parseMarkdownTables(content).find((table) => table.tableId === options.tableId) ?? null;
      return this.saveManagedTableAsTemplate(options.file, parsedTable);
    }
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (view?.file) {
      const parsedTableAtCursor = this.getParsedTableAtEditorLine(view);
      if (parsedTableAtCursor?.tableId && this.dataStore.tables[parsedTableAtCursor.tableId]) {
        return this.saveManagedTableAsTemplate(view.file, parsedTableAtCursor);
      }
      if (parsedTableAtCursor) {
        return this.savePlainTableAsTemplate({
          file: view.file,
          parsedTable: parsedTableAtCursor,
          coord: { row: 0, col: 0 },
          tableEl: null
        });
      }
    }
    new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u5230\u5F53\u524D\u8868\u683C\u5185\u5BB9");
    return false;
  }
  getEnhancedTableSidebarContext(target) {
    if (!target) return null;
    const tableEl = target.closest("table.mdtp-table-shell");
    if (!tableEl || !this.isInitializedEnhancedTable(tableEl)) return null;
    const runtime = this.runtimeState.get(tableEl);
    const cell = target.closest("th, td");
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
      tableEl
    };
  }
  getNativeLayoutTableSidebarContext(target) {
    if (!target) return null;
    const tableEl = target.closest("table.mdtp-table-shell");
    if (!tableEl || !this.isNativeLayoutTable(tableEl)) return null;
    const runtime = this.runtimeState.get(tableEl);
    const tableId = this.getManagedTableId(tableEl);
    const cell = target.closest("th, td");
    const coord = cell ? this.getCellCoord(cell) : runtime?.anchor;
    if (!runtime || !tableId || !coord) return null;
    return {
      mode: "nativeLayout",
      file: runtime.file,
      tableId,
      parsedTable: runtime.parsedTable,
      selection: runtime.selection,
      coord,
      tableEl
    };
  }
  ensureTableSidebarHandle() {
    if (this.tableSidebarHandleEl) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mdtp-sidebar-handle";
    button.textContent = "\u8868";
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
  showTableSidebar(context) {
    if (context.mode === "enhanced") return;
    this.ensureTableSidebarHandle();
    this.ensureTableCopyImageHandle();
    this.activeTableSidebarContext = context;
    this.renderTableSidebarHandle(context);
  }
  ensureTableCopyImageHandle() {
    if (this.tableCopyImageHandleEl) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mdtp-sidebar-handle mdtp-copy-image-handle";
    button.textContent = COPY_TABLE_AS_IMAGE_SHORT_LABEL;
    button.setAttribute("aria-label", COPY_TABLE_AS_IMAGE_LABEL);
    button.title = COPY_TABLE_AS_IMAGE_LABEL;
    button.style.display = "none";
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const context = this.activeTableSidebarContext;
      if (!context) return;
      void this.copyCurrentTableAsImageStable(context.tableEl);
    });
    document.body.appendChild(button);
    this.tableCopyImageHandleEl = button;
  }
  renderTableSidebarHandle(context) {
    if (!this.tableSidebarHandleEl) return;
    const draggerHandle = this.findDraggerHandleForTableSidebarContext(context);
    const positionHandle = (handle, top2, left2, integrated) => {
      if (integrated) {
        handle.dataset.mdtpIntegrated = "dragger";
      } else {
        delete handle.dataset.mdtpIntegrated;
      }
      handle.style.left = `${left2}px`;
      handle.style.top = `${top2}px`;
      handle.style.display = "flex";
    };
    if (draggerHandle) {
      const draggerRect = draggerHandle.getBoundingClientRect();
      const top2 = Math.max(72, draggerRect.top + Math.max(0, (draggerRect.height - 22) / 2));
      const left2 = Math.max(8, draggerRect.left - 25);
      positionHandle(this.tableSidebarHandleEl, top2, left2, true);
      if (this.tableCopyImageHandleEl) {
        positionHandle(this.tableCopyImageHandleEl, top2 + 28, left2, true);
      }
      return;
    }
    const rect = context.tableEl.getBoundingClientRect();
    const top = Math.max(72, rect.top + 8);
    const left = Math.max(12, rect.left - 44);
    positionHandle(this.tableSidebarHandleEl, top, left, false);
    if (this.tableCopyImageHandleEl) {
      positionHandle(this.tableCopyImageHandleEl, top + 28, left, false);
    }
  }
  findDraggerHandleForTableSidebarContext(context) {
    const line = context.parsedTable?.startLine;
    if (typeof line !== "number" || !Number.isFinite(line)) return null;
    const root = context.tableEl.closest(".markdown-source-view, .cm-editor");
    const scope = root ?? document.body;
    const handles = Array.from(scope.querySelectorAll(DRAGGER_HANDLE_SELECTOR));
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
  toggleTableSidebarPopover() {
    const context = this.activeTableSidebarContext;
    if (!context) return;
    if (this.tableSidebarPopoverEl) {
      this.hideTableSidebarPopover();
      return;
    }
    this.showTableSidebarPopover(context);
  }
  hideTableSidebar(force = false) {
    this.hideTableSidebarPopover();
    if (this.tableSidebarHandleEl) {
      this.tableSidebarHandleEl.style.display = "none";
    }
    if (this.tableCopyImageHandleEl) {
      this.tableCopyImageHandleEl.style.display = "none";
    }
    if (force) {
      this.activeTableSidebarContext = null;
    }
  }
  hideTableSidebarPopover() {
    if (!this.tableSidebarPopoverEl) return;
    this.tableSidebarPopoverEl.remove();
    this.tableSidebarPopoverEl = null;
  }
  showTableSidebarPopover(context) {
    this.hideTableSidebarPopover();
    const root = document.createElement("div");
    root.className = "mdtp-sidebar-popover";
    root.addEventListener("pointerdown", (event) => event.stopPropagation());
    root.addEventListener("click", (event) => event.stopPropagation());
    const addSectionTitle = (label) => {
      const title = document.createElement("div");
      title.className = "mdtp-sidebar-section-title";
      title.textContent = label;
      root.appendChild(title);
    };
    const addButton = (label, onClick, options) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mdtp-sidebar-button${options?.wide ? " is-wide" : ""}`;
      button.textContent = options?.experimental ? `${label}\uFF08\u5B9E\u9A8C\uFF09` : label;
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void onClick();
      });
      root.appendChild(button);
    };
    if (context.mode === "native") {
      addSectionTitle("\u539F\u751F\u8868\u683C");
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
        if (descriptor.label === COPY_TABLE_AS_IMAGE_LABEL) {
          addButton(descriptor.label, async () => {
            await this.copyCurrentTableAsImageStable(context.tableEl);
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === "\u4FDD\u5B58\u5F53\u524D\u8868\u683C\u4E3A\u6A21\u677F") {
          addButton(descriptor.label, async () => {
            await this.savePlainTableAsTemplate(context);
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === "\u63D2\u5165\u6A21\u677F" || descriptor.label === "\u6A21\u677F\u5E93") {
          addButton(descriptor.label, () => {
            this.openTemplateLibraryModal();
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
      }
    } else if (context.mode === "nativeLayout") {
      addSectionTitle("\u539F\u751F\u8868\u683C\u5E03\u5C40");
      for (const descriptor of this.getNativeLayoutSidebarActionDescriptors()) {
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
          addButton(descriptor.label, () => {
            this.showNativeLayoutRowColorPalette(context.file, context.tableEl, context.tableId, context.selection, context.coord);
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === NATIVE_LAYOUT_ROW_BANDS_LABEL) {
          addButton(descriptor.label, () => {
            new NativeRowBandColorModal(this, context.file, context.tableId, context.tableEl).open();
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === COPY_TABLE_AS_IMAGE_LABEL) {
          addButton(descriptor.label, async () => {
            await this.copyCurrentTableAsImageStable(context.tableEl);
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === "\u4FDD\u5B58\u5F53\u524D\u8868\u683C\u4E3A\u6A21\u677F") {
          addButton(descriptor.label, async () => {
            await this.saveManagedTableAsTemplate(context.file, context.parsedTable);
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
          continue;
        }
        if (descriptor.label === "\u63D2\u5165\u6A21\u677F" || descriptor.label === "\u6A21\u677F\u5E93") {
          addButton(descriptor.label, () => {
            this.openTemplateLibraryModal();
            this.hideTableSidebarPopover();
          }, { wide: descriptor.wide, experimental: descriptor.experimental });
        }
      }
    }
    document.body.appendChild(root);
    this.tableSidebarPopoverEl = root;
    this.positionTableSidebarPopover(context);
  }
  positionTableSidebarPopover(context) {
    if (!this.tableSidebarPopoverEl) return;
    const anchorRect = this.tableSidebarHandleEl?.getBoundingClientRect();
    const fallbackRect = context.tableEl.getBoundingClientRect();
    const rect = anchorRect && anchorRect.width > 0 && anchorRect.height > 0 ? anchorRect : fallbackRect;
    this.tableSidebarPopoverEl.style.left = `${Math.max(16, rect.right + 8)}px`;
    this.tableSidebarPopoverEl.style.top = `${Math.max(72, rect.top - 4)}px`;
  }
  getNativeSidebarActionDescriptors() {
    return [
      { label: NATIVE_LAYOUT_CURRENT_TABLE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_PAGE_TABLES_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_COLOR_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_BANDS_LABEL, wide: true },
      { label: COPY_TABLE_AS_IMAGE_LABEL, wide: true },
      { label: "\u4FDD\u5B58\u5F53\u524D\u8868\u683C\u4E3A\u6A21\u677F", wide: true },
      { label: "\u63D2\u5165\u6A21\u677F", wide: true },
      { label: "\u6A21\u677F\u5E93", wide: true }
    ];
  }
  getNativeLayoutSidebarActionDescriptors() {
    return [
      { label: NATIVE_LAYOUT_CURRENT_TABLE_LABEL, wide: true },
      { label: NATIVE_LAYOUT_PAGE_TABLES_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_COLOR_LABEL, wide: true },
      { label: NATIVE_LAYOUT_ROW_BANDS_LABEL, wide: true },
      { label: COPY_TABLE_AS_IMAGE_LABEL, wide: true },
      { label: "\u4FDD\u5B58\u5F53\u524D\u8868\u683C\u4E3A\u6A21\u677F", wide: true },
      { label: "\u63D2\u5165\u6A21\u677F", wide: true },
      { label: "\u6A21\u677F\u5E93", wide: true }
    ];
  }
  async copyCurrentTableAsImageStable(tableEl) {
    const feishu = this.app.plugins.plugins["feishu-doc-toolbar"];
    if (typeof feishu?.copyCurrentTableAsImage === "function") {
      await feishu.copyCurrentTableAsImage(tableEl);
      return;
    }
    new import_obsidian.Notice("\u8BF7\u5148\u542F\u7528 Obsidian\u589E\u5F3A\u4F53\u9A8C \u4E2D\u7684\u300C\u53F3\u952E\u590D\u5236\u6210\u56FE\u300D");
  }
  getEnhancedSidebarActionDescriptors() {
    return [
      { label: "\u4E0A\u65B9\u63D2\u5165\u884C" },
      { label: "\u4E0B\u65B9\u63D2\u5165\u884C" },
      { label: "\u5DE6\u4FA7\u63D2\u5165\u5217" },
      { label: "\u53F3\u4FA7\u63D2\u5165\u5217" },
      { label: "\u5220\u9664\u5F53\u524D\u884C" },
      { label: "\u5220\u9664\u5F53\u524D\u5217" },
      { label: "\u5408\u5E76" },
      { label: "\u62C6\u5206" },
      { label: "\u5355\u5143\u683C\u989C\u8272" },
      { label: "\u5F53\u524D\u884C\u989C\u8272" },
      { label: "\u5F53\u524D\u5217\u989C\u8272" },
      { label: "\u6E05\u9664\u989C\u8272" },
      { label: "\u590D\u5236\u5F53\u524D\u5757\u5185\u5BB9", wide: true },
      { label: "\u9AD8\u4FDD\u771F\u590D\u5236", wide: true },
      { label: "\u590D\u5236\u5F53\u524D\u5757\u6210\u56FE", wide: true },
      { label: "\u4FDD\u5B58\u5F53\u524D\u9009\u533A\u4E3A\u6A21\u677F", wide: true },
      { label: "\u63D2\u5165\u6A21\u677F", wide: true },
      { label: "\u6A21\u677F\u5E93", wide: true }
    ];
  }
  shouldExposeExperimentalAction(experimental) {
    return !experimental || !!this.dataStore?.experimentalFeatureGate;
  }
  getEditorMenuContext(view) {
    const freshContext = this.getFreshTableContext(view);
    if (freshContext) {
      const runtime2 = this.runtimeState.get(freshContext.tableEl);
      const cell = freshContext.target.closest("th, td");
      const coord = cell ? this.getCellCoord(cell) : null;
      const parsedTableId = runtime2?.parsedTable?.tableId ?? "";
      const tableId = this.getInitializedTableId(freshContext.tableEl) || (parsedTableId && this.dataStore.tables[parsedTableId] ? parsedTableId : "");
      if (runtime2 && cell && coord) {
        return {
          tableEl: freshContext.tableEl,
          runtime: runtime2,
          cell,
          coord,
          tableId,
          x: freshContext.x,
          y: freshContext.y
        };
      }
    }
    const activeContext = this.getActiveInteractionContext(true);
    if (!activeContext || activeContext.file.path !== view.file?.path) return null;
    const runtime = this.runtimeState.get(activeContext.tableEl);
    if (!runtime) return null;
    const anchorCell = activeContext.tableEl.querySelector(
      `[data-mdtp-row='${activeContext.anchor.row}'][data-mdtp-col='${activeContext.anchor.col}']`
    );
    if (!anchorCell) return null;
    return {
      tableEl: activeContext.tableEl,
      runtime,
      cell: anchorCell,
      coord: activeContext.anchor,
      tableId: activeContext.tableId || (runtime.parsedTable?.tableId && this.dataStore.tables[runtime.parsedTable.tableId] ? runtime.parsedTable.tableId : ""),
      x: 0,
      y: 0
    };
  }
  getFreshTableContext(view) {
    const context = this.lastTableContext;
    if (!context) return null;
    if (Date.now() - context.at > 1500) return null;
    if (!view.file || context.filePath !== view.file.path) return null;
    if (!document.body.contains(context.tableEl)) return null;
    return context;
  }
  resolveMarkdownViewFromMenuInfo(info) {
    if (info instanceof import_obsidian.MarkdownView) {
      return info;
    }
    const infoFilePath = info && typeof info === "object" && "file" in info && info.file instanceof import_obsidian.TFile ? info.file?.path ?? null : null;
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (activeView?.file && (!infoFilePath || activeView.file.path === infoFilePath)) {
      return activeView;
    }
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof import_obsidian.MarkdownView) || !view.file) continue;
      if (!infoFilePath || view.file.path === infoFilePath) {
        return view;
      }
    }
    return null;
  }
  getContainingMarkdownView(target) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    if (activeView?.contentEl instanceof HTMLElement && activeView.contentEl.contains(target)) {
      return activeView;
    }
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof import_obsidian.MarkdownView)) continue;
      const contentEl = view.contentEl;
      if (contentEl instanceof HTMLElement && contentEl.contains(target)) {
        return view;
      }
    }
    return null;
  }
  shouldUseNativeEditorMenu(target, view) {
    if (!target || !view) return false;
    if (target.closest(".mdtp-inline-editor")) return false;
    return !!target.closest(".markdown-source-view, .cm-editor, .cm-content");
  }
  async handleDocumentKeyDown(event) {
    if (event.defaultPrevented || this.historyApplying) return;
    const target = event.target;
    const context = this.getActiveInteractionContext(true);
    const isTypingTarget = !!target?.closest("input, textarea, [contenteditable='true'], .cm-content");
    const isDirectFormTypingTarget = !!target?.closest("input, textarea, select, .mdtp-inline-editor, .mdtp-onenote-paste-zone");
    const isForeignEditableTarget = !!target?.closest("[contenteditable='true']") && !target?.closest(".cm-content") && !target?.closest(".mdtp-onenote-paste-zone");
    if (this.activeImageManipulator && !event.metaKey && !event.ctrlKey && !event.altKey && !isDirectFormTypingTarget && !isForeignEditableTarget && (event.key === "Backspace" || event.key === "Delete")) {
      const handled = await this.removeActiveImageFromCell(this.activeImageManipulator);
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (context?.tableId && !this.activeEditor && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && !isTypingTarget && event.key === "Enter") {
      const runtime = this.runtimeState.get(context.tableEl);
      const cell = context.tableEl.querySelector(
        `[data-mdtp-row='${context.anchor.row}'][data-mdtp-col='${context.anchor.col}']`
      );
      if (runtime && cell) {
        event.preventDefault();
        event.stopPropagation();
        await this.openInlineEditor(context.tableEl, context.file, context.tableId, runtime.parsedTable, cell, context.anchor);
        return;
      }
    }
    if (context?.tableId && !this.activeEditor && !event.metaKey && !event.ctrlKey && !event.altKey && !isDirectFormTypingTarget && !isForeignEditableTarget && (event.key === "Backspace" || event.key === "Delete")) {
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
    if (context?.tableId) {
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
      if (key === "z" && event.shiftKey || key === "y") {
        event.preventDefault();
        event.stopPropagation();
        await this.redoLastAction(context.file.path, context.tableId);
        return;
      }
    }
    if (key !== "c" && key !== "v") return;
    return;
  }
  async handleDocumentPaste(event) {
    const target = event.target;
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
    if (context) {
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
  async handleClipboardPasteForSelectedCell(file, tableId, coord) {
    const imageFile = await this.readImageFromAvailableClipboard();
    if (!imageFile) {
      new import_obsidian.Notice("\u5F53\u524D\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u53EF\u7528\u56FE\u7247");
      return false;
    }
    const imageMarkup = await this.createAttachmentMarkup(file, imageFile);
    if (!imageMarkup) return false;
    await this.appendImageToCell(file, tableId, coord, imageMarkup);
    return true;
  }
  async handleClipboardContentPasteForSelectedCell(file, tableId, coord) {
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
  async handleClipboardContentPasteForUninitializedCell(file, parsedTable, coord) {
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
  async importOneNoteRichClipboardEvent(file, event) {
    const html = this.getHtmlFromClipboardEvent(event);
    return this.importOneNoteRichContent(file, html, this.getImagesFromClipboard(event));
  }
  async importOneNoteRichContent(file, html, clipboardImages = []) {
    if (!html.trim()) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BFB\u53D6\u5230 OneNote \u5BCC\u6587\u672C\uFF0C\u8BF7\u4ECE OneNote \u590D\u5236\u540E\u5728\u5F39\u7A97\u91CC\u7C98\u8D34");
      return false;
    }
    const converted = await this.buildOneNoteEnhancedMarkdownContent(file, html, clipboardImages);
    if (!converted) {
      new import_obsidian.Notice("\u6CA1\u6709\u8BC6\u522B\u5230\u53EF\u8FC1\u79FB\u7684 OneNote \u5185\u5BB9");
      return false;
    }
    await this.createSnapshot(file, "before-onenote-paste", converted.tableRecords.map((record) => record.tableId));
    await this.insertOneNoteConvertedContentAtCursor(file, converted);
    this.queueRefreshBurst();
    new import_obsidian.Notice("\u5DF2\u63D2\u5165 OneNote \u589E\u5F3A\u8868\u683C");
    return true;
  }
  async insertOneNoteConvertedContentAtCursor(file, converted) {
    const normalizedContent = converted.content.endsWith("\n") ? converted.content : `${converted.content}
`;
    const modeOverrides = Object.fromEntries(converted.tableRecords.map((record) => [record.tableId, "enhanced"]));
    for (const record of converted.tableRecords) {
      this.dataStore.tables[record.tableId] = this.cloneTableRecord(record);
    }
    if (converted.tableRecords.length > 0) {
      await this.savePluginData();
    }
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const editor = view?.editor;
    if (view?.file?.path === file.path && editor && typeof editor.getCursor === "function" && typeof editor.replaceRange === "function") {
      const cursor = editor.getCursor();
      const currentLine = typeof editor.getLine === "function" ? String(editor.getLine(cursor.line) ?? "") : "";
      const prefix = currentLine.trim() ? "\n\n" : "";
      editor.replaceRange(`${prefix}${normalizedContent}`, cursor);
      const nextContent2 = typeof editor.getValue === "function" ? String(editor.getValue() ?? "") : await this.app.vault.cachedRead(file);
      const parsedTables2 = this.parseMarkdownTables(nextContent2);
      await this.syncTableRecords(file, parsedTables2, { modeOverrides });
      return;
    }
    const originalContent = await this.app.vault.cachedRead(file);
    const separator = originalContent.trim().length === 0 ? "" : /\r?\n$/.test(originalContent) ? "\n" : "\n\n";
    const nextContent = `${originalContent}${separator}${normalizedContent}`;
    await this.app.vault.modify(file, nextContent);
    const parsedTables = this.parseMarkdownTables(nextContent);
    await this.syncTableRecords(file, parsedTables, { modeOverrides });
  }
  async insertMarkdownBlockAtCursor(file, block) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian.MarkdownView);
    const editor = view?.editor;
    const normalizedBlock = block.endsWith("\n") ? block : `${block}
`;
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
  async buildOneNoteEnhancedMarkdownContent(file, html, clipboardImages = []) {
    const container = await this.buildSanitizedOneNoteContainer(file, html, clipboardImages);
    if (!container) return null;
    const blocks = [];
    const tableRecords = [];
    for (const child of Array.from(container.childNodes)) {
      this.appendOneNoteNodeAsMarkdownBlocks(file, child, blocks, tableRecords);
    }
    const content = this.joinOneNoteMarkdownBlocks(blocks);
    if (!content.trim()) return null;
    return {
      content,
      tableRecords
    };
  }
  appendOneNoteNodeAsMarkdownBlocks(file, node, blocks, tableRecords) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) blocks.push(text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node;
    const tag = element.tagName.toLowerCase();
    if (tag === "table") {
      const converted = this.convertOneNoteTableToEnhancedMarkdown(file, element);
      if (!converted) return;
      blocks.push(converted.markdown);
      tableRecords.push(converted.record);
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const markdown2 = this.convertOneNoteListToMarkdown(file, element);
      if (markdown2) blocks.push(markdown2);
      return;
    }
    if (tag === "img") {
      const markdown2 = this.convertOneNoteImageToMarkdown(element);
      if (markdown2) blocks.push(markdown2);
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
  shouldExpandOneNoteWrapperElement(element) {
    const tag = element.tagName.toLowerCase();
    if (tag !== "div" && tag !== "span") return false;
    return Array.from(element.children).some((child) => {
      const childTag = child.tagName.toLowerCase();
      return ["table", "div", "p", "ul", "ol", "img", "h1", "h2", "h3", "h4", "h5", "h6"].includes(childTag);
    });
  }
  joinOneNoteMarkdownBlocks(blocks) {
    return blocks.map((block) => block.trim()).filter((block) => block.length > 0).join("\n\n").replace(/\n{3,}/g, "\n\n");
  }
  convertOneNoteBlockElementToMarkdown(file, element) {
    const tag = element.tagName.toLowerCase();
    if (tag === "pre") {
      const text2 = (element.textContent ?? "").trim();
      return text2 ? `\`\`\`
${text2}
\`\`\`` : "";
    }
    const text = this.serializeOneNoteInlineContent(file, Array.from(element.childNodes), false).trim();
    if (!text) return "";
    if (/^h[1-6]$/.test(tag)) {
      const level = Number.parseInt(tag.slice(1), 10);
      return `${"#".repeat(Math.max(1, Math.min(6, level)))} ${text}`;
    }
    if (tag === "blockquote") {
      return text.split("\n").map((line) => `> ${line}`.trimEnd()).join("\n");
    }
    return text;
  }
  convertOneNoteListToMarkdown(file, element) {
    const ordered = element.tagName.toLowerCase() === "ol";
    const items = Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "li").map((item, index) => {
      const content = this.serializeOneNoteInlineContent(file, Array.from(item.childNodes), false).trim();
      if (!content) return "";
      return ordered ? `${index + 1}. ${content}` : `- ${content}`;
    }).filter((item) => item.length > 0);
    return items.join("\n");
  }
  convertOneNoteImageToMarkdown(image) {
    const src = image.dataset.mdtpSrc?.trim() || image.getAttribute("data-mdtp-src")?.trim() || image.getAttribute("data-asset-path")?.trim() || image.getAttribute("src")?.trim() || "";
    if (!src) return "";
    return `![[${src}]]`;
  }
  serializeOneNoteInlineContent(file, nodes, forCell) {
    const parts = [];
    for (const node of nodes) {
      const value = this.serializeOneNoteInlineNode(file, node, forCell);
      if (!value) continue;
      parts.push(value);
    }
    const joined = parts.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
    return forCell ? joined.replace(/\n/g, "<br>").trim() : joined.trim();
  }
  serializeOneNoteInlineNode(file, node, forCell) {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? "").replace(/\u00a0/g, " ");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const element = node;
    const tag = element.tagName.toLowerCase();
    if (tag === "br") return "\n";
    if (tag === "img") return this.convertOneNoteImageToMarkdown(element);
    if (tag === "table") return this.serializeNestedOneNoteTable(file, element);
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
    if (tag === "strong" || tag === "b") return `**${inner}**`;
    if (tag === "em" || tag === "i") return `*${inner}*`;
    if (tag === "code") return `\`${inner.replace(/`/g, "")}\``;
    if (tag === "u") return inner;
    if (tag === "p" || tag === "div" || tag === "li") return `${inner}
`;
    return inner;
  }
  serializeNestedOneNoteTable(file, table) {
    const matrix = this.extractOneNoteTableMatrix(file, table);
    if (!matrix || matrix.rows.length === 0) return "";
    return matrix.rows.map(
      (row) => row.map((cell) => cell.trim()).filter((cell) => cell.length > 0).join(" / ")
    ).filter((line) => line.length > 0).join("<br>");
  }
  convertOneNoteTableToEnhancedMarkdown(file, table) {
    const extracted = this.extractOneNoteTableMatrix(file, table);
    if (!extracted || extracted.rows.length === 0) return null;
    const [headerRow, ...bodyRows] = extracted.rows;
    const rawTable = {
      header: headerRow,
      divider: Array(headerRow.length).fill("---"),
      body: bodyRows
    };
    const tableId = this.generateTableId();
    const markdown = [this.formatTableMarker(tableId), "", ...this.buildOneNoteRawTable(rawTable)].join("\n");
    const now = Date.now();
    return {
      markdown,
      record: {
        tableId,
        mode: "enhanced",
        filePath: file.path,
        createdAt: now,
        updatedAt: now,
        lastKnownHash: "",
        lastKnownRange: { startLine: 0, endLine: 0 },
        layout: extracted.layout
      }
    };
  }
  extractOneNoteTableMatrix(file, table) {
    const rowElements = this.getDirectOneNoteTableRows(table);
    if (rowElements.length === 0) return null;
    const rows = [];
    const occupied = /* @__PURE__ */ new Map();
    const layout = this.createEmptyLayout();
    rowElements.forEach((row, rowIndex) => {
      rows[rowIndex] = rows[rowIndex] ?? [];
      let colIndex = 0;
      const occupiedCols = occupied.get(rowIndex) ?? /* @__PURE__ */ new Set();
      this.applyOneNoteRowLayout(row, rowIndex, layout);
      for (const cell of Array.from(row.children).filter((child) => /^(td|th)$/i.test(child.tagName))) {
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
          const targetOccupied = occupied.get(nextRowIndex) ?? /* @__PURE__ */ new Set();
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
      layout
    };
  }
  applyOneNoteRowLayout(row, rowIndex, layout) {
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
  applyOneNoteCellLayout(cell, rowIndex, colIndex, rowspan, colspan, layout) {
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
  readOneNoteStyleMap(element) {
    const result = {};
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
  readOneNoteLengthPx(value) {
    if (!value) return void 0;
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)(px|pt|in|cm|mm)?$/i);
    if (!match) return void 0;
    const amount = Number.parseFloat(match[1] ?? "");
    if (!Number.isFinite(amount) || amount <= 0) return void 0;
    const unit = (match[2] ?? "px").toLowerCase();
    const px = unit === "in" ? amount * 96 : unit === "pt" ? amount * (96 / 72) : unit === "cm" ? amount * (96 / 2.54) : unit === "mm" ? amount * (96 / 25.4) : amount;
    const rounded = Math.round(px);
    return Number.isFinite(rounded) && rounded > 0 ? rounded : void 0;
  }
  readOneNoteBackgroundColor(styles) {
    const value = styles["background-color"] ?? styles.background;
    if (!value) return "";
    const normalized = value.trim();
    if (!normalized || /url\s*\(/i.test(normalized)) return "";
    if (/^#[0-9a-f]{3,8}$/i.test(normalized)) return normalized;
    if (/^rgba?\([\d\s,%.]+\)$/i.test(normalized)) return normalized;
    if (/^[a-z]+$/i.test(normalized)) return normalized.toLowerCase();
    return "";
  }
  readOneNoteTextAlign(styles) {
    const value = (styles["text-align"] ?? "").trim().toLowerCase();
    return value === "center" || value === "right" || value === "left" ? value : void 0;
  }
  getDirectOneNoteTableRows(table) {
    const rows = [];
    for (const child of Array.from(table.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "tr") {
        rows.push(child);
        continue;
      }
      if (tag === "thead" || tag === "tbody" || tag === "tfoot") {
        rows.push(
          ...Array.from(child.children).filter((row) => row.tagName.toLowerCase() === "tr")
        );
      }
    }
    return rows;
  }
  extractOneNoteCellMarkdownValue(file, cell) {
    const value = this.serializeOneNoteInlineContent(file, Array.from(cell.childNodes), true);
    if (value.trim()) return value;
    const fallback = this.normalizeOneNotePlainTextFallback(
      cell.innerText ?? cell.textContent ?? ""
    );
    return fallback.replace(/\n/g, "<br>");
  }
  normalizeOneNotePlainTextFallback(value) {
    return value.replace(/\u00a0/g, " ").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  readPositiveIntegerAttribute(element, attribute) {
    const value = Number.parseInt(element.getAttribute(attribute) ?? "", 10);
    return Number.isFinite(value) && value > 0 ? value : 1;
  }
  extractPreferredImageWidthFromCell(cell) {
    const image = cell.querySelector("img");
    if (!image || typeof image.getAttribute !== "function") return void 0;
    const widthAttr = Number.parseInt(image.getAttribute("width") ?? "", 10);
    if (Number.isFinite(widthAttr) && widthAttr >= 40 && widthAttr <= 2e3) {
      return widthAttr;
    }
    const styleWidthMatch = (image.getAttribute("style") ?? "").match(/width:\s*(\d{2,4})px/i);
    if (styleWidthMatch) {
      const width = Number.parseInt(styleWidthMatch[1] ?? "", 10);
      if (Number.isFinite(width) && width >= 40 && width <= 2e3) {
        return width;
      }
    }
    return void 0;
  }
  async buildSanitizedOneNoteContainer(file, html, clipboardImages = []) {
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
  sanitizeOneNoteNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? "";
      return value.trim() ? document.createTextNode(value) : null;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const element = node;
    const tag = element.tagName.toLowerCase();
    const blockedTags = /* @__PURE__ */ new Set(["script", "style", "meta", "link", "iframe", "object", "embed", "svg", "canvas"]);
    if (blockedTags.has(tag)) return null;
    const allowedTags = /* @__PURE__ */ new Set([
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
      "ul"
    ]);
    if (!allowedTags.has(tag)) {
      const fragment = document.createDocumentFragment();
      for (const child of Array.from(element.childNodes)) {
        const clean2 = this.sanitizeOneNoteNode(child);
        if (clean2) fragment.appendChild(clean2);
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
  copyAllowedOneNoteAttributes(source, target, tag) {
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
  sanitizeOneNoteUrl(value, allowImageData) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (allowImageData && /^data:image\//i.test(trimmed)) return trimmed;
    if (/^\s*javascript:/i.test(trimmed)) return "";
    if (/^\s*data:/i.test(trimmed)) return "";
    if (/^(https?:|mailto:|obsidian:|onenote:|file:|app:|blob:|cid:)/i.test(trimmed)) return trimmed;
    if (/^[./#]|^[^:]+$/i.test(trimmed)) return trimmed;
    return "";
  }
  sanitizeOneNoteStyleAttribute(value) {
    if (!value.trim()) return "";
    const allowed = /* @__PURE__ */ new Set([
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
      "width"
    ]);
    const declarations = [];
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
  markOneNoteRichTables(container) {
    for (const table of Array.from(container.querySelectorAll("table"))) {
      table.classList.add("mdtp-onenote-table");
    }
  }
  removeEmptyOneNoteArtifacts(container) {
    for (const element of Array.from(container.querySelectorAll("span, div, p"))) {
      if (element.childNodes.length > 0) continue;
      if ((element.textContent ?? "").trim()) continue;
      element.remove();
    }
  }
  async localizeOneNoteRichImages(file, container, clipboardImages) {
    const images = Array.from(container.querySelectorAll("img"));
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
  shouldUseClipboardImageForOneNoteSource(src) {
    const trimmed = src.trim();
    return !trimmed || /^(cid:|blob:|file:|data:image\/)/i.test(trimmed);
  }
  async resolveOneNoteImageSource(src) {
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
  fileFromDataUrl(dataUrl) {
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
  fileFromLocalImagePath(src) {
    try {
      const nodeRequire = typeof window !== "undefined" ? window.require : null;
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
  getImageMimeTypeFromPath(filePath) {
    const lower = filePath.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".bmp")) return "image/bmp";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    return "image/png";
  }
  getImageFromClipboard(event) {
    return this.getImagesFromClipboard(event)[0] ?? null;
  }
  getImagesFromClipboard(event) {
    const files = [];
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
  async readImageFromAvailableClipboard(event) {
    const eventImage = event ? this.getImageFromClipboard(event) : null;
    if (eventImage) return eventImage;
    const electronImage = this.readImageFromElectronClipboard();
    if (electronImage) return electronImage;
    const systemImage = this.readImageFromSystemClipboardViaPython();
    if (systemImage) return systemImage;
    return this.readImageFromNavigatorClipboard();
  }
  insertTextIntoTextarea(textarea, text) {
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
  toggleTextareaBold(textarea) {
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
  insertImageMarkupIntoTextarea(textarea, imageMarkup) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const prefix = textarea.value.slice(0, start);
    const suffix = textarea.value.slice(end);
    const leading = prefix.trim().length === 0 ? "" : prefix.endsWith("\n\n") ? "" : prefix.endsWith("\n") ? "\n" : "\n\n";
    const trailing = suffix.trim().length === 0 ? "" : suffix.startsWith("\n\n") ? "" : suffix.startsWith("\n") ? "\n" : "\n\n";
    textarea.value = `${prefix}${leading}${imageMarkup}${trailing}${suffix}`;
    const nextCursor = (prefix + leading + imageMarkup).length;
    textarea.selectionStart = nextCursor;
    textarea.selectionEnd = nextCursor;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  appendImageMarkupToActiveEditor(imageMarkup) {
    if (!this.activeEditor) return;
    this.activeEditor.imageMarkups.push(imageMarkup.trim());
    this.renderInlineEditorImages(this.activeEditor);
    this.queueInlineEditorLayout(this.activeEditor);
  }
  renderInlineEditorImages(editor) {
    const container = editor.imageContainer;
    container.replaceChildren();
    const targets = editor.imageMarkups.flatMap((markup) => this.extractImagePreviewTargets(markup, editor.file));
    if (targets.length === 0) {
      container.classList.remove("is-visible");
      return;
    }
    container.classList.add("is-visible");
    const layoutWidth = editor.tableId ? this.dataStore.tables[editor.tableId]?.layout.cellImageWidths[this.getCellKey(editor.coord)] : void 0;
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
  extractImagePreviewTargets(value, file) {
    const targets = [];
    const seen = /* @__PURE__ */ new Set();
    const addTarget = (rawLink) => {
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
  splitImageMarkupForCellRender(value, file) {
    const segments = [];
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
        const imageSegment = {
          kind: "image",
          raw,
          alt: markdownAlt,
          displayPath: target.displayPath,
          resourcePath: target.resourcePath
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
  resolveImagePreviewTarget(rawLink, file) {
    const cleaned = rawLink.trim();
    if (!cleaned) return null;
    const linkPath = cleaned.split("|")[0]?.trim().replace(/^<|>$/g, "") ?? "";
    if (!linkPath) return null;
    const resolved = this.app.metadataCache.getFirstLinkpathDest(linkPath, file.path) ?? this.app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(linkPath));
    if (!(resolved instanceof import_obsidian.TFile)) return null;
    if (!/\.(png|jpe?g|gif|webp|svg|bmp|tiff?|heic)$/i.test(resolved.path)) return null;
    const target = {
      displayPath: resolved.path,
      resourcePath: this.app.vault.getResourcePath(resolved)
    };
    const width = this.extractImageLinkWidth(cleaned);
    if (width) {
      target.width = width;
    }
    return target;
  }
  extractImageLinkWidth(rawLink) {
    const widthPart = rawLink.split("|").slice(1).map((part) => part.trim()).find((part) => /^\d{2,4}(?:\s*x\s*\d{2,4})?$/i.test(part));
    if (!widthPart) return void 0;
    const width = Number.parseInt(widthPart, 10);
    if (!Number.isFinite(width) || width < 40 || width > 2e3) return void 0;
    return width;
  }
  async createAttachmentMarkup(file, imageFile) {
    try {
      const savedPath = await this.saveClipboardImage(file, imageFile);
      new import_obsidian.Notice(`\u5DF2\u7C98\u8D34\u56FE\u7247\uFF1A${savedPath.split("/").pop() ?? savedPath}`);
      return `![[${savedPath}]]`;
    } catch (error) {
      console.error("[mdtp] failed to save pasted image", error);
      new import_obsidian.Notice("\u56FE\u7247\u7C98\u8D34\u5931\u8D25");
      return null;
    }
  }
  async readImageFromNavigatorClipboard() {
    const clipboardAny = navigator.clipboard;
    if (typeof clipboardAny?.read !== "function") return null;
    try {
      const items = await clipboardAny.read();
      for (const item of items) {
        const type = Array.from(item.types ?? []).find((value) => value.startsWith("image/"));
        if (!type) continue;
        const blob = await item.getType(type);
        return new File([blob], this.getPastedImageFileName(this.getImageExtension(blob.type)), { type: blob.type });
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard read failed", error);
    }
    return null;
  }
  readImageFromElectronClipboard() {
    try {
      const electron = window.require?.("electron");
      const clipboard = electron?.clipboard;
      const nativeImageApi = electron?.nativeImage;
      if (!clipboard) return null;
      let nativeImage = clipboard.readImage?.();
      if ((!nativeImage || nativeImage.isEmpty?.()) && nativeImageApi?.createFromBuffer) {
        const formats = Array.from(clipboard.availableFormats?.() ?? []);
        const imageFormat = formats.find(
          (value) => /^image\//i.test(value) || /tiff|png|jpeg|jpg|gif|webp/i.test(value)
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
  readImageFromSystemClipboardViaPython() {
    try {
      const nodeRequire = window.require;
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
        stdio: "ignore"
      });
      if (!fs.existsSync(outputPath)) return null;
      const buffer = fs.readFileSync(outputPath);
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
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
  async saveClipboardImage(file, imageFile) {
    const extension = this.getImageExtension(imageFile.type);
    const fileName = this.getPastedImageFileName(extension);
    const fileManager = this.app.fileManager;
    let targetPath = "";
    if (typeof fileManager?.getAvailablePathForAttachment === "function") {
      targetPath = await Promise.resolve(fileManager.getAvailablePathForAttachment(fileName, file.path));
    } else {
      const attachmentFolder = await this.getAttachmentFolderPath(file);
      targetPath = await this.getAvailableVaultPath(
        (0, import_obsidian.normalizePath)(attachmentFolder ? `${attachmentFolder}/${fileName}` : fileName)
      );
    }
    const parentPath = targetPath.split("/").slice(0, -1).join("/");
    if (parentPath) {
      await this.ensureFolderExists(parentPath);
    }
    const data = await imageFile.arrayBuffer();
    const vaultAny = this.app.vault;
    if (typeof vaultAny.createBinary === "function") {
      await vaultAny.createBinary(targetPath, data);
    } else {
      await this.app.vault.adapter.writeBinary(targetPath, data);
    }
    return targetPath;
  }
  async getAttachmentFolderPath(file) {
    const configPath = (0, import_obsidian.normalizePath)(`${this.app.vault.configDir}/app.json`);
    try {
      const raw = await this.app.vault.adapter.read(configPath);
      const parsed = JSON.parse(raw);
      const configured = String(parsed?.attachmentFolderPath ?? "").trim();
      if (!configured || configured === "/") {
        return file.parent?.path ?? "";
      }
      if (configured.startsWith("./")) {
        const parent = file.parent?.path ?? "";
        return (0, import_obsidian.normalizePath)(parent ? `${parent}/${configured.slice(2)}` : configured.slice(2));
      }
      return (0, import_obsidian.normalizePath)(configured);
    } catch {
      return file.parent?.path ?? "";
    }
  }
  async getAvailableVaultPath(basePath) {
    const adapter = this.app.vault.adapter;
    const normalized = (0, import_obsidian.normalizePath)(basePath);
    if (!await adapter.exists(normalized)) return normalized;
    const dotIndex = normalized.lastIndexOf(".");
    const stem = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;
    const ext = dotIndex > 0 ? normalized.slice(dotIndex) : "";
    for (let index = 1; index < 5e3; index += 1) {
      const candidate = `${stem} ${index}${ext}`;
      if (!await adapter.exists(candidate)) return candidate;
    }
    throw new Error("No available attachment path");
  }
  getImageExtension(mimeType) {
    if (mimeType === "image/jpeg") return "jpg";
    if (mimeType === "image/gif") return "gif";
    if (mimeType === "image/webp") return "webp";
    return "png";
  }
  getPastedImageFileName(extension) {
    const now = /* @__PURE__ */ new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
    return `Pasted image ${stamp}.${extension}`;
  }
  handleTablePointerDown(event, tableEl) {
    const resizeHandle = event.target?.closest(".mdtp-resize-handle");
    if (resizeHandle) {
      const state = this.runtimeState.get(tableEl);
      const tableId = tableEl.dataset.mdtpTableId || state?.parsedTable?.tableId || "";
      if (!state || !tableId) return;
      event.preventDefault();
      event.stopPropagation();
      const index = Number.parseInt(resizeHandle.dataset.mdtpIndex ?? "-1", 10);
      const kind = resizeHandle.dataset.mdtpResizeKind;
      const structure = this.collectTableStructure(tableEl);
      if (kind === "column") {
        const width = this.getColumnWidth(structure, index);
        this.activeResize = {
          kind: "column",
          tableEl,
          tableId,
          file: state.file,
          index,
          startClient: event.clientX,
          startSize: width
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
          startSize: height
        };
      }
      return;
    }
    if (!this.isInitializedEnhancedTable(tableEl)) return;
    if (event.button !== 0) return;
    const cell = event.target?.closest("th, td");
    if (!cell || !tableEl.contains(cell)) return;
    const coord = this.getCellCoord(cell);
    if (!coord) return;
    event.preventDefault();
    this.clearAllEnhancedSelections(tableEl);
    const runtime = this.runtimeState.get(tableEl);
    if (!runtime) return;
    runtime.anchor = coord;
    runtime.selection = this.normalizeSelection(coord, coord);
    this.activeSelectionDrag = {
      tableEl,
      anchor: coord
    };
    cell.tabIndex = -1;
    cell.focus({ preventScroll: true });
    this.renderSelection(tableEl, runtime.selection, runtime.anchor);
  }
  handleTableContextMenu(event, tableEl) {
    const runtime = this.runtimeState.get(tableEl);
    if (!runtime) return;
    const target = event.target;
    const cell = target?.closest("th, td");
    const coord = cell ? this.getCellCoord(cell) : null;
    if (coord) {
      runtime.anchor = coord;
      runtime.selection = this.selectionContains(runtime.selection, coord) ? runtime.selection : this.normalizeSelection(coord, coord);
      this.renderSelection(tableEl, runtime.selection, runtime.anchor);
    }
    const menu = new import_obsidian.Menu();
    const tableId = tableEl.dataset.mdtpTableId || runtime.parsedTable?.tableId || "";
    if (!tableId) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable);
      menu.addSeparator?.();
      this.addTemplateMenuItems(menu, {
        plainTableContext: runtime.parsedTable && coord ? {
          file: runtime.file,
          parsedTable: runtime.parsedTable,
          coord,
          tableEl
        } : null
      });
      const view2 = this.getContainingMarkdownView(target);
      this.showTableContextMenu(menu, event, view2, {
        parsedTable: runtime.parsedTable,
        coord
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
        menu.addSeparator?.();
      }
      this.addTemplateMenuItems(menu, {
        file: runtime.file,
        tableId
      });
      const view2 = this.getContainingMarkdownView(target);
      this.showTableContextMenu(menu, event, view2, {
        parsedTable: runtime.parsedTable,
        coord
      });
      return;
    }
    if (this.canConvertEnhancedRecordToNativeLayout(record)) {
      this.addNativeLayoutMenuItem(menu, runtime.file, runtime.parsedTable, tableId);
      menu.addSeparator?.();
    }
    if (coord) {
      this.addTemplateMenuItems(menu, {
        file: runtime.file,
        tableId,
        tableSelection: runtime.selection ?? this.normalizeSelection(coord, coord)
      });
    }
    const view = this.getContainingMarkdownView(target);
    this.showTableContextMenu(menu, event, view, {
      parsedTable: runtime.parsedTable,
      coord
    });
  }
  addNativeLayoutMenuItem(menu, file, parsedTable, tableId) {
    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_SECTION_LABEL);
      item.setIcon("table");
      item.setDisabled(true);
    });
    const effectiveTableId = tableId ?? parsedTable?.tableId ?? null;
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
  addNativeLayoutRowColorMenuItems(menu, file, tableId, tableEl, selection, coord, origin) {
    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_ROW_COLOR_LABEL);
      item.setIcon("paint-bucket");
      item.onClick(() => this.showNativeLayoutRowColorPalette(file, tableEl, tableId, selection, coord, origin));
    });
    menu.addItem((item) => {
      item.setTitle(NATIVE_LAYOUT_ROW_BANDS_LABEL);
      item.setIcon("palette");
      item.onClick(() => new NativeRowBandColorModal(this, file, tableId, tableEl).open());
    });
    menu.addItem((item) => {
      item.setTitle("\u6062\u590D\u9009\u4E2D\u884C\u9ED8\u8BA4\u8272");
      item.setIcon("eraser");
      item.onClick(() => {
        const range = this.getSelectedRowRange(selection, coord);
        void this.setNativeLayoutRowRangeColor(tableId, file, tableEl, range.startRow, range.endRow, null);
      });
    });
  }
  addStableEnhancedTableMenuItems(menu, file, tableId, tableEl, selection, coord, origin) {
    this.addHistoryMenuItems(menu, file, tableId);
    menu.addSeparator?.();
    this.addStructureMenuItems(menu, file, tableId, tableEl, selection, coord);
    menu.addSeparator?.();
    this.addColorMenuItems(menu, file, tableId, tableEl, coord, origin);
    menu.addSeparator?.();
    this.addMergeMenuItems(menu, file, tableId, tableEl, selection, coord);
  }
  addHistoryMenuItems(menu, file, tableId) {
    menu.addItem((item) => {
      item.setTitle("\u64A4\u56DE");
      item.setIcon("undo");
      item.setDisabled(!this.canUndoHistoryForFile(file.path, tableId));
      item.onClick(() => void this.undoLastAction(file.path, tableId));
    });
    menu.addItem((item) => {
      item.setTitle("\u91CD\u505A");
      item.setIcon("redo");
      item.setDisabled(!this.canRedoHistoryForFile(file.path, tableId));
      item.onClick(() => void this.redoLastAction(file.path, tableId));
    });
  }
  addStructureMenuItems(menu, file, tableId, tableEl, selection, coord) {
    menu.addItem((item) => {
      item.setTitle("\u590D\u5236\u9009\u4E2D\u5185\u5BB9");
      item.setIcon("copy");
      item.onClick(
        () => void this.copySelectionToClipboard(file, tableId, selection ?? this.normalizeSelection(coord, coord))
      );
    });
    menu.addItem((item) => {
      item.setTitle("\u9AD8\u4FDD\u771F\u590D\u5236");
      item.setIcon("copy-plus");
      item.onClick(
        () => void this.copySelectionToClipboardHighFidelity(file, tableId, selection ?? this.normalizeSelection(coord, coord))
      );
    });
    menu.addItem((item) => {
      item.setTitle("\u7C98\u8D34\u5230\u5F53\u524D\u5355\u5143\u683C");
      item.setIcon("clipboard-paste");
      item.onClick(() => void this.handleClipboardContentPasteForSelectedCell(file, tableId, coord));
    });
    menu.addItem((item) => {
      item.setTitle("\u7C98\u8D34\u526A\u8D34\u677F\u56FE\u7247");
      item.setIcon("image");
      item.onClick(() => void this.handleClipboardPasteForSelectedCell(file, tableId, coord));
    });
    const insertAboveRow = Math.max(1, selection?.startRow ?? coord.row);
    const insertBelowRow = Math.max(1, (selection?.endRow ?? coord.row) + 1);
    const rowDeleteRange = this.getBodyRowDeleteRange(selection, coord);
    const insertLeftCol = selection?.startCol ?? coord.col;
    const insertRightCol = (selection?.endCol ?? coord.col) + 1;
    const colDeleteRange = this.getColumnDeleteRange(selection, coord);
    const structure = this.collectTableStructure(tableEl);
    menu.addItem((item) => {
      item.setTitle("\u4E0A\u65B9\u63D2\u5165\u884C");
      item.setIcon("between-horizontal-start");
      item.onClick(() => void this.insertRows(file, tableId, insertAboveRow, 1));
    });
    menu.addItem((item) => {
      item.setTitle("\u4E0B\u65B9\u63D2\u5165\u884C");
      item.setIcon("between-horizontal-end");
      item.onClick(() => void this.insertRows(file, tableId, insertBelowRow, 1));
    });
    menu.addItem((item) => {
      item.setTitle(rowDeleteRange ? rowDeleteRange.count > 1 ? "\u5220\u9664\u9009\u4E2D\u884C" : "\u5220\u9664\u5F53\u524D\u884C" : "\u5F53\u524D\u884C\u4E0D\u53EF\u5220\u9664");
      item.setIcon("trash-2");
      item.setDisabled(!rowDeleteRange);
      item.onClick(() => {
        if (!rowDeleteRange) return;
        void this.deleteRows(file, tableId, rowDeleteRange.startRow, rowDeleteRange.count);
      });
    });
    menu.addItem((item) => {
      item.setTitle("\u5DE6\u4FA7\u63D2\u5165\u5217");
      item.setIcon("between-vertical-start");
      item.onClick(() => void this.insertColumns(file, tableId, insertLeftCol, 1));
    });
    menu.addItem((item) => {
      item.setTitle("\u53F3\u4FA7\u63D2\u5165\u5217");
      item.setIcon("between-vertical-end");
      item.onClick(() => void this.insertColumns(file, tableId, insertRightCol, 1));
    });
    menu.addItem((item) => {
      item.setTitle(colDeleteRange.count > 1 ? "\u5220\u9664\u9009\u4E2D\u5217" : "\u5220\u9664\u5F53\u524D\u5217");
      item.setIcon("trash-2");
      item.setDisabled(colDeleteRange.count >= structure.matrix[0]?.length);
      item.onClick(() => {
        if (colDeleteRange.count >= structure.matrix[0]?.length) return;
        void this.deleteColumns(file, tableId, colDeleteRange.startCol, colDeleteRange.count);
      });
    });
  }
  addColorMenuItems(menu, file, tableId, tableEl, coord, origin) {
    menu.addItem((item) => {
      item.setTitle("\u8BBE\u7F6E\u5355\u5143\u683C\u989C\u8272");
      item.setIcon("paint-bucket");
      item.onClick(
        () => this.showPaletteMenu(
          tableEl,
          coord,
          origin,
          (palette) => void this.setColor(tableId, file, tableEl, "cell", this.getCellKey(coord), palette.value)
        )
      );
    });
    menu.addItem((item) => {
      item.setTitle("\u8BBE\u7F6E\u5F53\u524D\u884C\u989C\u8272");
      item.setIcon("paint-bucket");
      item.onClick(
        () => this.showPaletteMenu(
          tableEl,
          coord,
          origin,
          (palette) => void this.setColor(tableId, file, tableEl, "row", String(coord.row), palette.value)
        )
      );
    });
    menu.addItem((item) => {
      item.setTitle("\u8BBE\u7F6E\u5F53\u524D\u5217\u989C\u8272");
      item.setIcon("paint-bucket");
      item.onClick(
        () => this.showPaletteMenu(
          tableEl,
          coord,
          origin,
          (palette) => void this.setColor(tableId, file, tableEl, "column", String(coord.col), palette.value)
        )
      );
    });
    menu.addItem((item) => {
      item.setTitle("\u6E05\u9664\u989C\u8272");
      item.setIcon("eraser");
      item.onClick(() => this.showClearColorMenu(file, tableId, tableEl, coord, origin));
    });
  }
  addMergeMenuItems(menu, file, tableId, tableEl, selection, coord) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    const mergeAtCell = record.layout.merges.find((merge) => merge.row === coord.row && merge.col === coord.col);
    if (mergeAtCell) {
      menu.addItem((item) => {
        item.setTitle("\u62C6\u5206\u5355\u5143\u683C");
        item.setIcon("ungroup");
        item.onClick(() => void this.splitMerge(file, tableId, tableEl, mergeAtCell));
      });
    }
    if (!selection) return;
    if (selection.startRow === selection.endRow && selection.startCol === selection.endCol) return;
    if (this.canMergeSelection(tableEl, record.layout, selection)) {
      menu.addItem((item) => {
        item.setTitle("\u5408\u5E76\u9009\u4E2D\u5355\u5143\u683C");
        item.setIcon("group");
        item.onClick(() => void this.mergeSelection(file, tableId, tableEl, selection));
      });
    } else {
      menu.addItem((item) => {
        item.setTitle("\u5F53\u524D\u9009\u533A\u4E0D\u53EF\u5408\u5E76");
        item.setDisabled(true);
      });
    }
  }
  getBodyRowDeleteRange(selection, coord) {
    const startRow = Math.max(1, selection?.startRow ?? coord.row);
    const endRow = Math.max(1, selection?.endRow ?? coord.row);
    if (endRow < startRow) return null;
    return {
      startRow,
      count: endRow - startRow + 1
    };
  }
  getColumnDeleteRange(selection, coord) {
    const startCol = selection?.startCol ?? coord.col;
    const endCol = selection?.endCol ?? coord.col;
    return {
      startCol,
      count: endCol - startCol + 1
    };
  }
  getSelectedRowRange(selection, coord) {
    return {
      startRow: Math.max(0, selection?.startRow ?? coord.row),
      endRow: Math.max(0, selection?.endRow ?? coord.row)
    };
  }
  getNativeRowColorChoicesForTable(tableId) {
    const record = this.dataStore.tables[tableId];
    const palette = this.getLayoutNativeColorPalette(record?.layout ?? this.createEmptyLayout()) ?? this.getCurrentNativeColorPalette();
    return [
      { label: "\u6B63\u6587\u767D", value: palette.baseRow },
      { label: "\u6D45\u8272\u5757", value: palette.altRow },
      { label: "\u8868\u5934\u8272", value: palette.header },
      ...PALETTE
    ].map((item) => ({ label: item.label, value: this.normalizeHexColor(item.value, palette.baseRow) }));
  }
  getNativeLayoutResolvedRowColor(tableId, rowIndex) {
    const record = this.dataStore.tables[tableId];
    if (!record) return NATIVE_COLOR_TABLE_BASE_ROW;
    return this.resolveCellBackgroundColor(record.layout, rowIndex, 0, this.getCellKey({ row: rowIndex, col: 0 })) || NATIVE_COLOR_TABLE_BASE_ROW;
  }
  showNativeLayoutRowColorPalette(file, tableEl, tableId, selection, coord, origin) {
    const range = this.getSelectedRowRange(selection, coord);
    const menu = new import_obsidian.Menu();
    for (const palette of this.getNativeRowColorChoicesForTable(tableId)) {
      menu.addItem((item) => {
        item.setTitle(palette.label);
        item.setIcon("paint-bucket");
        item.onClick(
          () => void this.setNativeLayoutRowRangeColor(tableId, file, tableEl, range.startRow, range.endRow, palette.value)
        );
      });
    }
    menu.addSeparator?.();
    menu.addItem((item) => {
      item.setTitle("\u66F4\u591A\u884C\u6BB5\u8BBE\u7F6E");
      item.setIcon("palette");
      item.onClick(() => new NativeRowBandColorModal(this, file, tableId, tableEl).open());
    });
    const rect = tableEl.getBoundingClientRect();
    menu.showAtPosition(origin ?? { x: rect.left + 24, y: rect.top + 24 });
  }
  async setNativeLayoutRowRangeColor(tableId, file, tableEl, startRow, endRow, color) {
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
      label: normalizedColor ? "\u8BBE\u7F6E\u884C\u989C\u8272" : "\u6062\u590D\u884C\u989C\u8272",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after
    });
    new import_obsidian.Notice(normalizedColor ? "\u5DF2\u8BBE\u7F6E\u9009\u4E2D\u884C\u989C\u8272" : "\u5DF2\u6062\u590D\u9009\u4E2D\u884C\u9ED8\u8BA4\u8272");
  }
  async setColor(tableId, file, tableEl, target, key, color) {
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
      label: "\u8BBE\u7F6E\u989C\u8272",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after
    });
  }
  async clearColor(tableId, file, tableEl, target, key) {
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
      label: "\u6E05\u9664\u989C\u8272",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after
    });
  }
  async setCellImageWidth(tableId, file, tableEl, coord, width) {
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
      label: "\u8C03\u6574\u56FE\u7247\u5BBD\u5EA6",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after
    });
  }
  async clearCellImageWidth(tableId, file, tableEl, coord) {
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
      label: "\u6062\u590D\u56FE\u7247\u5BBD\u5EA6",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after
    });
  }
  hideImageToolbar() {
    if (!this.activeImageToolbar) return;
    this.activeImageToolbar.root.remove();
    this.activeImageToolbar = null;
  }
  showImageManipulator(tableEl, file, tableId, coord, cell, imageEl) {
    const existing = this.activeImageManipulator;
    if (existing && existing.tableEl === tableEl && existing.coord.row === coord.row && existing.coord.col === coord.col && existing.imageEl === imageEl && document.body.contains(existing.root)) {
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
      const target = clickEvent.target;
      if (target?.closest(".mdtp-image-manipulator-delete")) {
        void this.removeActiveImageFromCell(manipulator);
      }
    });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mdtp-image-manipulator-delete";
    deleteButton.setAttribute("aria-label", "\u5220\u9664\u56FE\u7247");
    deleteButton.textContent = "\xD7";
    root.appendChild(deleteButton);
    const resizeHandle = document.createElement("button");
    resizeHandle.type = "button";
    resizeHandle.className = "mdtp-image-manipulator-handle";
    resizeHandle.setAttribute("aria-label", "\u62D6\u62FD\u8C03\u6574\u56FE\u7247\u5927\u5C0F");
    root.appendChild(resizeHandle);
    document.body.appendChild(root);
    const manipulator = {
      tableEl,
      file,
      tableId,
      coord,
      cell,
      imageEl,
      root,
      resizeHandle,
      deleteButton
    };
    this.positionImageManipulator(root, imageEl);
    this.activeImageManipulator = manipulator;
  }
  handleImageManipulatorPointerDown(event, manipulator) {
    const target = event.target;
    if (target?.closest(".mdtp-image-manipulator-handle")) {
      this.startImageResizeDrag(event, manipulator);
      return "resize";
    }
    return "noop";
  }
  positionImageManipulator(root, imageEl) {
    const rect = imageEl.getBoundingClientRect();
    root.style.left = `${Math.max(0, Math.round(rect.left))}px`;
    root.style.top = `${Math.max(0, Math.round(rect.top))}px`;
    root.style.width = `${Math.max(24, Math.round(rect.width))}px`;
    root.style.height = `${Math.max(24, Math.round(rect.height))}px`;
  }
  hideImageManipulator() {
    if (this.activeImageManipulator) {
      this.activeImageManipulator.root.classList.remove("is-resizing");
      this.activeImageManipulator.root.remove();
      this.activeImageManipulator = null;
    }
    this.activeImageDrag = null;
  }
  openCellImageOriginal(cell) {
    const linkEl = cell.querySelector("a[href]");
    const imageEl = cell.querySelector("img");
    const href = linkEl?.href || imageEl?.src || "";
    if (!href) {
      new import_obsidian.Notice("\u5F53\u524D\u5355\u5143\u683C\u6CA1\u6709\u53EF\u6253\u5F00\u7684\u539F\u56FE");
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }
  isImageMarkupFragment(value) {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^!\[\[[^[\]]+?\]\]$/.test(trimmed) || /^!\[[^\]]*\]\([^)]+\)$/.test(trimmed);
  }
  containsImageMarkup(value) {
    return /!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/.test(value);
  }
  replaceFirstImageMarkup(value, imageMarkup) {
    return value.replace(/!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/, imageMarkup.trim());
  }
  stripImageMarkup(value) {
    return value.replace(/!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/g, "").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }
  extractImageMarkupFragments(value) {
    return Array.from(value.matchAll(/!\[\[[^[\]]+?\]\]|!\[[^\]]*\]\([^)]+\)/g), (match) => match[0].trim()).filter(
      Boolean
    );
  }
  resolveImageElement(target) {
    if (!target) return null;
    if (target instanceof HTMLImageElement) {
      return target;
    }
    return target.querySelector("img");
  }
  getRenderedImageWidth(imageEl) {
    const explicitWidth = Number.parseInt(imageEl.style.width || "", 10);
    if (Number.isFinite(explicitWidth) && explicitWidth > 0) return explicitWidth;
    return Math.max(80, Math.round(imageEl.getBoundingClientRect().width));
  }
  startImageResizeDrag(event, manipulator) {
    const startWidth = this.getRenderedImageWidth(manipulator.imageEl);
    this.activeImageDrag = {
      manipulator,
      startClientX: event.clientX,
      startWidth,
      previewWidth: startWidth
    };
    manipulator.root.classList.add("is-resizing");
  }
  isSameImageTarget(manipulator, tableId, coord) {
    return manipulator.tableId === tableId && manipulator.coord.row === coord.row && manipulator.coord.col === coord.col;
  }
  async replaceCellImageFromClipboard(file, tableId, coord) {
    const imageFile = await this.readImageFromAvailableClipboard();
    if (!imageFile) {
      new import_obsidian.Notice("\u5F53\u524D\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u53EF\u7528\u56FE\u7247");
      return false;
    }
    const imageMarkup = await this.createAttachmentMarkup(file, imageFile);
    if (!imageMarkup) return false;
    const currentValue = await this.readCellSourceValue(file, tableId, null, coord);
    const nextValue = currentValue && this.containsImageMarkup(currentValue) ? this.replaceFirstImageMarkup(currentValue, imageMarkup) : this.composeNextCellValueWithImage(currentValue, imageMarkup);
    return this.updateCellSourceValue(file, tableId, null, coord, nextValue);
  }
  async removeImagesFromCell(file, tableId, coord) {
    const currentValue = await this.readCellSourceValue(file, tableId, null, coord);
    if (!currentValue || !this.containsImageMarkup(currentValue)) {
      new import_obsidian.Notice("\u5F53\u524D\u5355\u5143\u683C\u6CA1\u6709\u53EF\u79FB\u9664\u7684\u56FE\u7247");
      return false;
    }
    const nextValue = this.stripImageMarkup(currentValue);
    return this.updateCellSourceValue(file, tableId, null, coord, nextValue);
  }
  async removeActiveImageFromCell(manipulator) {
    const currentValue = await this.readCellSourceValue(manipulator.file, manipulator.tableId, null, manipulator.coord);
    if (!currentValue || !this.containsImageMarkup(currentValue)) {
      new import_obsidian.Notice("\u5F53\u524D\u5355\u5143\u683C\u6CA1\u6709\u53EF\u5220\u9664\u7684\u56FE\u7247");
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
      new import_obsidian.Notice("\u672A\u80FD\u5B9A\u4F4D\u5230\u8981\u5220\u9664\u7684\u56FE\u7247");
      return false;
    }
    const cellKey = this.getCellKey(manipulator.coord);
    const handled = await this.mutateTableSource(
      manipulator.file,
      manipulator.tableId,
      "before-delete-cell-image",
      "\u5220\u9664\u5355\u5143\u683C\u56FE\u7247",
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
      new import_obsidian.Notice("\u5DF2\u5220\u9664\u56FE\u7247");
    }
    return handled;
  }
  getSelectedImageSource(manipulator) {
    const wrapper = manipulator.imageEl.closest(".mdtp-rendered-image-embed");
    return wrapper?.dataset.mdtpImageSource?.trim() || manipulator.imageEl.alt?.trim() || "";
  }
  removeSelectedImageMarkupFromValue(value, file, selectedDisplayPath, selectedResourcePath) {
    const imagePattern = /!\[\[[^[\]]+?\]\]|!\[[^\]]*]\([^)]+\)/g;
    const matches = Array.from(value.matchAll(imagePattern));
    if (matches.length === 0) return value;
    const selectedDisplay = selectedDisplayPath.trim();
    const selectedResource = selectedResourcePath.trim();
    const targetMatch = matches.find((match) => {
      const raw2 = match[0] ?? "";
      const target = this.extractImageMarkupTarget(raw2);
      if (!target) return false;
      const resolved = this.resolveImagePreviewTarget(target, file);
      if (!resolved) return false;
      return !!selectedDisplay && resolved.displayPath === selectedDisplay || !!selectedResource && resolved.resourcePath === selectedResource;
    }) ?? matches[0];
    const start = targetMatch.index ?? -1;
    const raw = targetMatch[0] ?? "";
    if (start < 0 || !raw) return value;
    return this.normalizeValueAfterImageDeletion(`${value.slice(0, start)}${value.slice(start + raw.length)}`);
  }
  extractImageMarkupTarget(markup) {
    const wikiMatch = markup.match(/^!\[\[([^[\]]+?)\]\]$/);
    if (wikiMatch?.[1]) return wikiMatch[1];
    const markdownMatch = markup.match(/^!\[[^\]]*]\(([^)]+)\)$/);
    return markdownMatch?.[1] ?? "";
  }
  normalizeValueAfterImageDeletion(value) {
    return value.replace(/(?:\s*<br\s*\/?>\s*){2,}/gi, "<br>").replace(/^(?:\s*<br\s*\/?>\s*)+/gi, "").replace(/(?:\s*<br\s*\/?>\s*)+$/gi, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  async mergeSelection(file, tableId, tableEl, selection) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    const didMerge = await this.mutateTableSource(
      file,
      tableId,
      "before-merge",
      "\u5408\u5E76\u5355\u5143\u683C",
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
          colspan: selection.endCol - selection.startCol + 1
        });
        return true;
      }
    );
    if (!didMerge) return;
    new import_obsidian.Notice("\u5DF2\u5408\u5E76\u9009\u4E2D\u5355\u5143\u683C");
  }
  async splitMerge(file, tableId, tableEl, merge) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    const before = await this.captureHistoryState(file, [tableId]);
    await this.createSnapshot(file, "before-split", [tableId]);
    record.layout.merges = record.layout.merges.filter(
      (item) => !(item.row === merge.row && item.col === merge.col && item.rowspan === merge.rowspan && item.colspan === merge.colspan)
    );
    record.updatedAt = Date.now();
    await this.savePluginData();
    this.refreshEnhancedTable(tableEl, tableId);
    const after = await this.captureHistoryState(file, [tableId]);
    this.pushHistoryEntry({
      label: "\u62C6\u5206\u5355\u5143\u683C",
      filePath: file.path,
      tableIds: [tableId],
      before,
      after
    });
    new import_obsidian.Notice("\u5DF2\u62C6\u5206\u5355\u5143\u683C");
  }
  canMergeSelection(tableEl, layout, selection) {
    const structure = this.collectTableStructure(tableEl);
    const mergeCandidate = {
      row: selection.startRow,
      col: selection.startCol,
      rowspan: selection.endRow - selection.startRow + 1,
      colspan: selection.endCol - selection.startCol + 1
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
  mergeToRect(merge) {
    return {
      startRow: merge.row,
      endRow: merge.row + merge.rowspan - 1,
      startCol: merge.col,
      endCol: merge.col + merge.colspan - 1
    };
  }
  rectanglesOverlap(left, right) {
    return !(left.endRow < right.startRow || right.endRow < left.startRow || left.endCol < right.startCol || right.endCol < left.startCol);
  }
  selectionContains(selection, coord) {
    if (!selection) return false;
    return coord.row >= selection.startRow && coord.row <= selection.endRow && coord.col >= selection.startCol && coord.col <= selection.endCol;
  }
  getCellCoord(cell) {
    const row = Number.parseInt(cell.dataset.mdtpRow ?? "-1", 10);
    const col = Number.parseInt(cell.dataset.mdtpCol ?? "-1", 10);
    if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || col < 0) return null;
    return { row, col };
  }
  cellContainsImage(cell) {
    return !!cell.querySelector("img, .image-embed, .internal-embed, .media-embed");
  }
  isInitializedTable(tableEl) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return !!tableId && !!this.dataStore.tables[tableId];
  }
  isInitializedEnhancedTable(tableEl) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return !!tableId && this.getTableRecordMode(this.dataStore.tables[tableId]) === "enhanced";
  }
  isNativeLayoutTable(tableEl) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return !!tableId && this.getTableRecordMode(this.dataStore.tables[tableId]) === "nativeLayout";
  }
  getManagedTableId(tableEl) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return tableId && this.dataStore.tables[tableId] ? tableId : null;
  }
  getInitializedTableId(tableEl) {
    const tableId = tableEl.dataset.mdtpTableId || "";
    return tableId && this.getTableRecordMode(this.dataStore.tables[tableId]) === "enhanced" ? tableId : null;
  }
  normalizeSelection(anchor, current) {
    return {
      startRow: Math.min(anchor.row, current.row),
      endRow: Math.max(anchor.row, current.row),
      startCol: Math.min(anchor.col, current.col),
      endCol: Math.max(anchor.col, current.col)
    };
  }
  renderSelection(tableEl, selection, anchor) {
    for (const cell of Array.from(tableEl.querySelectorAll("th, td"))) {
      cell.classList.remove("mdtp-cell-selected", "mdtp-cell-anchor");
      const htmlCell = cell;
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
  handleGlobalPointerMove(event) {
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
    if (this.activeResize) {
      event.preventDefault();
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
    const cell = hovered?.closest?.("th, td");
    if (!cell || !this.activeSelectionDrag.tableEl.contains(cell)) return;
    const coord = this.getCellCoord(cell);
    if (!coord) return;
    const runtime = this.runtimeState.get(this.activeSelectionDrag.tableEl);
    if (!runtime) return;
    runtime.selection = this.normalizeSelection(this.activeSelectionDrag.anchor, coord);
    runtime.anchor = this.activeSelectionDrag.anchor;
    this.renderSelection(this.activeSelectionDrag.tableEl, runtime.selection, runtime.anchor);
  }
  async handleGlobalPointerUp() {
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
    if (this.activeResize) {
      const resize = this.activeResize;
      this.activeResize = null;
      const record = this.dataStore.tables[resize.tableId];
      if (record) {
        const before = await this.captureHistoryState(resize.file, [resize.tableId]);
        const structure = this.collectTableStructure(resize.tableEl);
        if (resize.kind === "column") {
          record.layout.colWidths[String(resize.index)] = this.getColumnWidth(structure, resize.index);
        } else {
          record.layout.rowHeights[String(resize.index)] = this.getRowHeight(structure, resize.index);
        }
        record.updatedAt = Date.now();
        await this.savePluginData();
        this.refreshEnhancedTable(resize.tableEl, resize.tableId);
        const after = await this.captureHistoryState(resize.file, [resize.tableId]);
        this.pushHistoryEntry({
          label: resize.kind === "column" ? "\u8C03\u6574\u5217\u5BBD" : "\u8C03\u6574\u884C\u9AD8",
          filePath: resize.file.path,
          tableIds: [resize.tableId],
          before,
          after
        });
      }
    }
    this.activeSelectionDrag = null;
  }
  getColumnWidth(structure, colIndex) {
    const cell = structure.matrix[0]?.[colIndex] ?? structure.matrix.find((row) => !!row[colIndex])?.[colIndex];
    if (!cell) return 160;
    const styledWidth = Number.parseInt(cell.style.getPropertyValue("--mdtp-col-width"), 10);
    if (Number.isFinite(styledWidth) && styledWidth > 0) return styledWidth;
    return Math.max(MIN_COLUMN_WIDTH, Math.round(cell.getBoundingClientRect().width));
  }
  getRowHeight(structure, rowIndex) {
    const row = structure.rows[rowIndex];
    if (!row) return 40;
    const styledHeight = Number.parseInt(row.style.getPropertyValue("--mdtp-row-height"), 10);
    if (Number.isFinite(styledHeight) && styledHeight > 0) return styledHeight;
    return Math.max(MIN_ROW_HEIGHT, Math.round(row.getBoundingClientRect().height));
  }
  refreshEnhancedTable(tableEl, tableId) {
    const record = this.dataStore.tables[tableId];
    if (!record) return;
    this.clearInjectedTableArtifacts(tableEl);
    this.indexTableCells(tableEl);
    if (record.mode === "nativeLayout") {
      tableEl.classList.remove("mdtp-table-enhanced");
      tableEl.classList.add("mdtp-table-native-layout");
      this.applyNativeLayout(tableEl, record.layout);
    } else {
      tableEl.classList.remove("mdtp-table-native-layout");
      tableEl.classList.add("mdtp-table-enhanced");
      this.applyLayout(tableEl, record.layout);
      const runtime2 = this.runtimeState.get(tableEl);
      if (runtime2?.file && runtime2.parsedTable) {
        this.renderImageMarkupInEnhancedCells(tableEl, runtime2.file, runtime2.parsedTable, record.layout);
      }
    }
    this.injectResizeHandles(tableEl, record.layout);
    const runtime = this.runtimeState.get(tableEl);
    if (runtime && record.mode !== "nativeLayout") {
      this.renderSelection(tableEl, runtime.selection, runtime.anchor);
    } else if (runtime) {
      runtime.selection = null;
      runtime.anchor = null;
      this.renderSelection(tableEl, null, null);
    }
  }
  clearAllEnhancedSelections(exceptTableEl) {
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
  async openInlineEditor(tableEl, file, tableId, parsedTable, cell, coord) {
    if (this.activeEditor) {
      const isSameCell = this.activeEditor.tableId === tableId && this.activeEditor.coord.row === coord.row && this.activeEditor.coord.col === coord.col;
      if (isSameCell) {
        this.activeEditor.textarea.focus();
        return;
      }
      await this.closeActiveEditor("commit");
    }
    const sourceValue = await this.readCellSourceValue(file, tableId, parsedTable, coord);
    if (sourceValue === null) {
      new import_obsidian.Notice("\u5F53\u524D\u5355\u5143\u683C\u6682\u65F6\u65E0\u6CD5\u8FDB\u5165\u7F16\u8F91");
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
      new import_obsidian.Notice("\u5F53\u524D\u8868\u683C\u884C\u6682\u65F6\u65E0\u6CD5\u8FDB\u5165\u7F16\u8F91");
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
    const editorState = {
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
      closing: false
    };
    this.activeEditor = editorState;
    let pointerInsideEditor = false;
    const markPointerInsideEditor = (event) => {
      event.stopPropagation();
      pointerInsideEditor = true;
      window.setTimeout(() => {
        pointerInsideEditor = false;
      }, 160);
    };
    const stop = (event) => {
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
        if (pointerInsideEditor || activeElement instanceof Node && wrapper.contains(activeElement)) {
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
  getInlineEditorTextValue(sourceValue) {
    return this.stripImageMarkup(sourceValue).replace(/\n{3,}/g, "\n\n");
  }
  extractInlineEditorTextContent(value) {
    return this.normalizeClipboardCellForPlainText(value).replace(/!\[\[[^[\]]+?\]\]/g, "").replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/\n{3,}/g, "\n\n").trim();
  }
  getPreferredInlineEditorCursorPosition(value) {
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
  async closeActiveEditor(mode) {
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
        new import_obsidian.Notice("\u5355\u5143\u683C\u5185\u5BB9\u5199\u56DE\u5931\u8D25\uFF0C\u5DF2\u4FDD\u7559\u539F\u8868\u683C\u5185\u5BB9");
      }
    }
  }
  composeInlineEditorSourceValue(editor, textValue) {
    const typedImageMarkups = this.extractImageMarkupFragments(textValue);
    const imageMarkups = [...editor.imageMarkups, ...typedImageMarkups].map((markup) => markup.trim()).filter(Boolean);
    if (imageMarkups.length === 0) return textValue;
    const textPart = this.stripImageMarkup(textValue);
    const parts = [];
    if (textPart) {
      parts.push(textPart);
    }
    parts.push(...imageMarkups);
    return parts.join("\n\n");
  }
  restoreInlineEditorCellDisplay(editor, value) {
    if (this.containsImageMarkup(value)) {
      this.renderCellImageMarkup(editor.cell, editor.file, value);
      const width = editor.tableId ? this.dataStore.tables[editor.tableId]?.layout.cellImageWidths[this.getCellKey(editor.coord)] : void 0;
      this.applyImagePresentationToCell(editor.cell, width);
      return;
    }
    editor.cell.replaceChildren();
    this.appendRenderedCellText(editor.cell, value);
  }
  syncInlineEditorLayout(editor) {
    if (editor.closing) return;
    editor.textarea.style.height = "auto";
    const computedStyle = typeof window !== "undefined" && typeof window.getComputedStyle === "function" ? window.getComputedStyle(editor.textarea) : null;
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
    const imageHeight = editor.imageContainer?.classList?.contains("is-visible") ? Math.ceil(editor.imageContainer.scrollHeight || 0) : 0;
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
  queueInlineEditorLayout(editor) {
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
  async readCellSourceValue(file, tableId, parsedTable, coord) {
    const sourceTable = tableId ? this.parseMarkdownTables(await this.app.vault.cachedRead(file)).find((table) => table.tableId === tableId) ?? null : parsedTable;
    if (!sourceTable) return null;
    const rawTable = this.parseRawTable(sourceTable.raw);
    if (!rawTable) return null;
    const value = this.getCellValue(rawTable, coord);
    if (value === null) return null;
    return value.replace(/<br\s*\/?>/gi, "\n");
  }
  async updateCellSourceValue(file, tableId, parsedTable, coord, nextValue) {
    const normalizedValue = this.normalizeEditedCellValue(nextValue);
    if (tableId) {
      return this.mutateTableSource(
        file,
        tableId,
        "before-cell-edit",
        "\u7F16\u8F91\u5355\u5143\u683C",
        (rawTable) => this.setCellValue(rawTable, coord, normalizedValue)
      );
    }
    return this.mutateParsedTableSource(
      file,
      parsedTable,
      "before-untracked-cell-edit",
      (rawTable) => this.setCellValue(rawTable, coord, normalizedValue)
    );
  }
  async mutateParsedTableSource(file, parsedTable, snapshotReason, mutator) {
    if (!parsedTable) return false;
    const content = await this.app.vault.cachedRead(file);
    const currentTables = this.parseMarkdownTables(content);
    const targetTable = currentTables.find(
      (table) => table.startLine === parsedTable.startLine && table.endLine === parsedTable.endLine && table.raw === parsedTable.raw
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
  async insertRows(file, tableId, startRow, count) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-row-insert",
      count > 1 ? "\u63D2\u5165\u591A\u884C" : "\u63D2\u5165\u884C",
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
  async deleteRows(file, tableId, startRow, count) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-row-delete",
      count > 1 ? "\u5220\u9664\u591A\u884C" : "\u5220\u9664\u884C",
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
  async insertColumns(file, tableId, startCol, count) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-column-insert",
      count > 1 ? "\u63D2\u5165\u591A\u5217" : "\u63D2\u5165\u5217",
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
  async deleteColumns(file, tableId, startCol, count) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-column-delete",
      count > 1 ? "\u5220\u9664\u591A\u5217" : "\u5220\u9664\u5217",
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
  async appendImageToCell(file, tableId, coord, imageMarkup) {
    const currentValue = await this.readCellSourceValue(file, tableId, null, coord);
    const nextValue = this.composeNextCellValueWithImage(currentValue, imageMarkup);
    return this.updateCellSourceValue(file, tableId, null, coord, nextValue);
  }
  async appendImageToUninitializedCell(file, parsedTable, coord, imageMarkup) {
    const currentValue = await this.readCellSourceValue(file, null, parsedTable, coord);
    const nextValue = this.composeNextCellValueWithImage(currentValue, imageMarkup);
    return this.updateCellSourceValue(file, null, parsedTable, coord, nextValue);
  }
  composeNextCellValueWithImage(currentValue, imageMarkup) {
    const normalizedImage = imageMarkup.trim();
    const current = (currentValue ?? "").trim();
    if (!current) return normalizedImage;
    if (!this.isExperimentalFeatureEnabled()) {
      return `${current}
${normalizedImage}`;
    }
    if (this.containsImageMarkup(current)) {
      return `${current}
${normalizedImage}`;
    }
    return `${current}

${normalizedImage}`;
  }
  getTextFromClipboardEvent(event) {
    const plainText = event.clipboardData?.getData("text/plain") ?? "";
    if (plainText) return plainText;
    return "";
  }
  getHtmlFromClipboardEvent(event) {
    return event.clipboardData?.getData("text/html") ?? "";
  }
  async readHtmlFromAvailableClipboard() {
    try {
      const electron = window.require?.("electron");
      if (typeof electron?.clipboard?.readHTML === "function") {
        const html = electron.clipboard.readHTML();
        if (html) return html;
      }
    } catch (error) {
      console.error("[mdtp] electron clipboard readHTML failed", error);
    }
    try {
      const clipboardAny = navigator.clipboard;
      if (typeof clipboardAny?.read === "function") {
        const items = await clipboardAny.read();
        for (const item of items) {
          if (!Array.from(item.types ?? []).includes("text/html")) continue;
          const blob = await item.getType("text/html");
          const html = await blob.text();
          if (html) return html;
        }
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard readHTML failed", error);
    }
    return "";
  }
  async readTextFromAvailableClipboard() {
    try {
      if (typeof navigator.clipboard?.readText === "function") {
        const text = await navigator.clipboard.readText();
        if (text) return text;
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard readText failed", error);
    }
    try {
      const electron = window.require?.("electron");
      if (typeof electron?.clipboard?.readText === "function") {
        const text = electron.clipboard.readText();
        if (text) return text;
      }
    } catch (error) {
      console.error("[mdtp] electron clipboard readText failed", error);
    }
    return "";
  }
  parseClipboardMatrix(text) {
    const normalized = text.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").replace(/^\n+/, "").replace(/\n+$/, "");
    if (!normalized.trim()) return null;
    const lines = normalized.split("\n");
    if (lines.length >= 2 && this.isLikelyTableHeader(lines[0] ?? "", lines[1] ?? "")) {
      const rawTable = this.parseRawTable(normalized);
      if (rawTable) {
        return [rawTable.header, ...rawTable.body].map(
          (row) => row.map((value) => value.replace(/<br\s*\/?>/gi, "\n"))
        );
      }
    }
    return lines.map((line) => line.split("	"));
  }
  parseClipboardHtmlMatrix(html) {
    if (!html || !/<table[\s>]/i.test(html)) return null;
    if (typeof DOMParser !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const table = doc.querySelector("table");
      if (table) {
        const rows = Array.from(table.querySelectorAll("tr"));
        const matrix = rows.map(
          (row) => Array.from(row.querySelectorAll("th, td")).map((cell) => this.extractHtmlCellText(cell))
        ).filter((row) => row.length > 0);
        if (matrix.length > 0) return matrix;
      }
    }
    return this.parseClipboardHtmlTableWithRegex(html);
  }
  parseClipboardHtmlTableWithRegex(html) {
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) return null;
    const rows = [];
    const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
    for (const rowMatch of tableMatch[0].matchAll(rowPattern)) {
      const rowHtml = rowMatch[0] ?? "";
      const cells = [];
      const cellPattern = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      for (const cellMatch of rowHtml.matchAll(cellPattern)) {
        cells.push(this.normalizeHtmlCellText(cellMatch[1] ?? ""));
      }
      if (cells.length > 0) rows.push(cells);
    }
    return rows.length > 0 ? rows : null;
  }
  extractHtmlCellText(cell) {
    const clone = cell.cloneNode(true);
    for (const br of Array.from(clone.querySelectorAll("br"))) {
      br.replaceWith("\n");
    }
    for (const block of Array.from(clone.querySelectorAll("p, div, li"))) {
      block.appendChild(document.createTextNode("\n"));
    }
    for (const image of Array.from(clone.querySelectorAll("img"))) {
      const alt = image.getAttribute("alt")?.trim();
      image.replaceWith(alt ? `[\u56FE\u7247:${alt}]` : "[\u56FE\u7247]");
    }
    return this.normalizeHtmlCellText(clone.textContent ?? "");
  }
  normalizeHtmlCellText(value) {
    return value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  async pasteMatrixIntoTable(file, tableId, anchor, matrix) {
    if (matrix.length === 0) return false;
    return this.mutateTableSource(
      file,
      tableId,
      "before-table-paste",
      "\u7C98\u8D34\u8868\u683C\u5185\u5BB9",
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
  async pasteMatrixIntoUninitializedTable(file, parsedTable, anchor, matrix) {
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
  async copySelectionToClipboard(file, tableId, selection) {
    const matrix = await this.readSelectionSourceMatrix(file, tableId, selection, { preserveRaw: true });
    if (!matrix) return false;
    const text = this.buildClipboardTextFromMatrix(matrix);
    return this.writeTextToClipboard(text);
  }
  async copySelectionToClipboardHighFidelity(file, tableId, selection) {
    const matrix = await this.readSelectionSourceMatrix(file, tableId, selection, { preserveRaw: true });
    if (!matrix) return false;
    const text = this.buildHighFidelityClipboardTextFromMatrix(matrix);
    return this.writeTextToClipboard(text);
  }
  async clearSelectionContents(file, tableId, selection) {
    return this.mutateTableSource(
      file,
      tableId,
      "before-clear-selection",
      "\u6E05\u7A7A\u5355\u5143\u683C\u5185\u5BB9",
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
  async copyWholeTableToClipboard(file, tableId) {
    if (!tableId) return false;
    const content = await this.app.vault.cachedRead(file);
    const parsedTable = this.parseMarkdownTables(content).find((table) => table.tableId === tableId);
    if (!parsedTable) return false;
    return this.writeTextToClipboard(`
${parsedTable.raw}
`);
  }
  async copySelectionToClipboardFromParsedTable(parsedTable, selection) {
    if (!parsedTable) return false;
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return false;
    const matrix = [];
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      const values = [];
      for (let col = selection.startCol; col <= selection.endCol; col += 1) {
        const value = this.getCellValue(rawTable, { row, col }) ?? "";
        values.push(value);
      }
      matrix.push(values);
    }
    return this.writeTextToClipboard(this.buildClipboardTextFromMatrix(matrix));
  }
  async readSelectionSourceMatrix(file, tableId, selection, options) {
    const content = await this.app.vault.cachedRead(file);
    const parsedTable = this.parseMarkdownTables(content).find((table) => table.tableId === tableId);
    if (!parsedTable) return null;
    const rawTable = this.parseRawTable(parsedTable.raw);
    if (!rawTable) return null;
    const matrix = [];
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      const values = [];
      for (let col = selection.startCol; col <= selection.endCol; col += 1) {
        const value = this.getCellValue(rawTable, { row, col }) ?? "";
        values.push(options?.preserveRaw ? value : value.replace(/<br\s*\/?>/gi, "\n"));
      }
      matrix.push(values);
    }
    return matrix;
  }
  buildClipboardTextFromMatrix(matrix) {
    if (matrix.length === 0) return "";
    const normalized = matrix.map((row) => row.map((value) => value ?? ""));
    const rowCount = normalized.length;
    const colCount = Math.max(...normalized.map((row) => row.length), 0);
    if (rowCount <= 1 && colCount <= 1) {
      return this.normalizeClipboardCellForPlainText(normalized[0]?.[0] ?? "");
    }
    const rawTable = {
      header: this.normalizeRowCells(normalized[0] ?? [], colCount),
      divider: Array(colCount).fill("---"),
      body: normalized.slice(1).map((row) => this.normalizeRowCells(row, colCount))
    };
    return `
${this.buildRawTable(rawTable).join("\n")}
`;
  }
  buildHighFidelityClipboardTextFromMatrix(matrix) {
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
  normalizeClipboardCellForPlainText(value) {
    return value.replace(/<br\s*\/?>/gi, "\n");
  }
  isMeaningfullyEmptyCellValue(value) {
    if (value == null) return true;
    const normalized = this.normalizeClipboardCellForPlainText(value).replace(/!\[\[[^[\]]+?\]\]/g, "__image__").replace(/!\[[^\]]*\]\([^)]+\)/g, "__image__").replace(/&nbsp;/gi, " ").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    return normalized.length === 0;
  }
  isHighFidelityBodyCandidate(value) {
    const normalized = this.normalizeClipboardCellForPlainText(value).trim();
    if (!normalized) return false;
    if (/!\[\[[^\]]+\]\]/.test(normalized)) return true;
    return /!\[[^\]]*\]\([^)]+\)/.test(normalized);
  }
  isStandaloneImageLine(value) {
    if (!value) return false;
    return /^!\[\[[^[\]]+?\]\]$/.test(value) || /^!\[[^\]]*\]\([^)]+\)$/.test(value);
  }
  buildRichClipboardMarkdownBody(value) {
    const normalized = this.normalizeClipboardCellForPlainText(value).trim();
    if (!normalized) return "";
    const lines = normalized.split("\n");
    const blocks = [];
    let paragraph = [];
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
    return `
${blocks.join("\n\n")}
`;
  }
  splitHighFidelityLineSegments(line) {
    const segments = [];
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
  async writeTextToClipboard(text) {
    try {
      if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.error("[mdtp] navigator clipboard write failed", error);
    }
    try {
      const electron = window.require?.("electron");
      if (typeof electron?.clipboard?.writeText === "function") {
        electron.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      console.error("[mdtp] electron clipboard write failed", error);
    }
    try {
      if (navigator.userAgent.toLowerCase().includes("mac")) {
        const execFile = window?.require?.("child_process")?.execFile;
        if (typeof execFile === "function") {
          await new Promise((resolve, reject) => {
            const child = execFile("/usr/bin/pbcopy", (error) => {
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
  async copyTableAsImage(tableEl) {
    const execFile = window?.require?.("child_process")?.execFile;
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
      await new Promise((resolve, reject) => {
        execFile("/usr/sbin/screencapture", ["-x", "-c", region], (error) => {
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
  hideExportOnlyChrome() {
    const selectors = [
      ".mdtp-sidebar-handle",
      ".mdtp-copy-image-handle",
      ".mdtp-sidebar-popover",
      ".mdtp-image-manipulator",
      ".mdtp-inline-editor",
      ".menu",
      ".popover"
    ];
    const elements = selectors.flatMap(
      (selector) => Array.from(document.querySelectorAll(selector))
    );
    const unique = Array.from(new Set(elements));
    return unique.map((element) => {
      const visibility = element.style.visibility;
      element.style.visibility = "hidden";
      return { element, visibility };
    });
  }
  async mutateTableSource(file, tableId, snapshotReason, historyLabel, mutator) {
    const record = this.dataStore.tables[tableId];
    if (!record) return false;
    const content = await this.app.vault.cachedRead(file);
    const parsedTables = this.parseMarkdownTables(content);
    const targetTable = parsedTables.find((table) => table.tableId === tableId);
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
      after
    });
    this.queueRefreshBurst();
    return true;
  }
  findFirstNonEmptyCellInSelection(table, selection, anchor) {
    for (let row = selection.startRow; row <= selection.endRow; row += 1) {
      for (let col = selection.startCol; col <= selection.endCol; col += 1) {
        if (row === anchor.row && col === anchor.col) continue;
        const value = this.getCellValue(table, { row, col }) ?? "";
        if (!this.isMeaningfullyEmptyCellValue(value)) {
          return {
            coord: { row, col },
            value
          };
        }
      }
    }
    return null;
  }
  parseRawTable(raw) {
    const lines = raw.split(/\r?\n/);
    if (lines.length < 2) return null;
    const header = this.parseTableRowLine(lines[0]);
    if (header.length === 0) return null;
    const divider = this.parseDividerRowLine(lines[1], header.length);
    const body = lines.slice(2).map((line) => this.normalizeRowCells(this.parseTableRowLine(line), header.length));
    return {
      header: this.normalizeRowCells(header, header.length),
      divider,
      body
    };
  }
  parseDividerRowLine(line, expectedLength) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    const segments = trimmed.split("|").map((segment) => segment.trim()).filter((segment) => segment.length > 0);
    while (segments.length < expectedLength) {
      segments.push("---");
    }
    return segments.slice(0, expectedLength);
  }
  parseTableRowLine(line) {
    const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    const cells = [];
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
  normalizeRowCells(cells, length) {
    const next = [...cells];
    while (next.length < length) {
      next.push("");
    }
    return next.slice(0, length);
  }
  getCellValue(table, coord) {
    if (coord.col < 0) return null;
    if (coord.row === 0) {
      return table.header[coord.col] ?? null;
    }
    const bodyRow = table.body[coord.row - 1];
    if (!bodyRow) return null;
    return bodyRow[coord.col] ?? null;
  }
  setCellValue(table, coord, value) {
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
  normalizeEditedCellValue(value) {
    return value.replace(/\r\n?/g, "\n").replace(/\n/g, "<br>");
  }
  buildRawTable(table) {
    const columnCount = table.header.length;
    const rows = [table.header, ...table.body];
    const widths = Array.from(
      { length: columnCount },
      (_, index) => Math.max(
        3,
        ...rows.map((row) => this.escapeMarkdownTableCell(row[index] ?? "").length)
      )
    );
    return [
      this.buildTableLine(table.header, widths),
      this.buildDividerLine(table.divider, widths),
      ...table.body.map((row) => this.buildTableLine(row, widths))
    ];
  }
  buildOneNoteRawTable(table) {
    return [
      this.buildOneNoteTableLine(table.header),
      this.buildOneNoteDividerLine(table.header.length),
      ...table.body.map((row) => this.buildOneNoteTableLine(this.normalizeRowCells(row, table.header.length)))
    ];
  }
  buildOneNoteTableLine(cells) {
    const parts = cells.map((cell) => this.escapeMarkdownTableCell(this.normalizeOneNoteMarkdownTableCell(cell)));
    return `| ${parts.join(" | ")} |`;
  }
  buildOneNoteDividerLine(columnCount) {
    return `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`;
  }
  normalizeOneNoteMarkdownTableCell(value) {
    return value.replace(/\r\n?/g, "\n").replace(/\n+/g, "<br>").replace(/(?:\s*<br>\s*)+$/gi, "").replace(/^(?:\s*<br>\s*)+/gi, "").replace(/\s+/g, " ").trim();
  }
  buildDividerLine(segments, widths) {
    const normalized = this.normalizeRowCells(segments, widths.length);
    const parts = widths.map((width, index) => (normalized[index] ?? "---").padEnd(width, "-"));
    return `| ${parts.join(" | ")} |`;
  }
  buildTableLine(cells, widths) {
    const parts = widths.map((width, index) => {
      const value = this.escapeMarkdownTableCell(cells[index] ?? "");
      return value.padEnd(width, " ");
    });
    return `| ${parts.join(" | ")} |`;
  }
  escapeMarkdownTableCell(value) {
    return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");
  }
  shiftLayoutForInsertedRow(layout, rowIndex) {
    layout.rowHeights = this.shiftIndexedMapForInsert(layout.rowHeights, rowIndex);
    layout.rowColors = this.shiftIndexedMapForInsert(layout.rowColors, rowIndex);
    layout.cellColors = this.shiftCellColorMapForRowInsert(layout.cellColors, rowIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForRowInsert(layout.cellAlignments, rowIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForRowInsert(layout.cellImageWidths, rowIndex);
    layout.merges = this.shiftMergesForInsertedRow(layout.merges, rowIndex);
  }
  shiftLayoutForDeletedRow(layout, rowIndex) {
    layout.rowHeights = this.shiftIndexedMapForDelete(layout.rowHeights, rowIndex);
    layout.rowColors = this.shiftIndexedMapForDelete(layout.rowColors, rowIndex);
    layout.cellColors = this.shiftCellColorMapForRowDelete(layout.cellColors, rowIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForRowDelete(layout.cellAlignments, rowIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForRowDelete(layout.cellImageWidths, rowIndex);
    layout.merges = this.shiftMergesForDeletedRow(layout.merges, rowIndex);
  }
  shiftLayoutForInsertedColumn(layout, colIndex) {
    layout.colWidths = this.shiftIndexedMapForInsert(layout.colWidths, colIndex);
    layout.colColors = this.shiftIndexedMapForInsert(layout.colColors, colIndex);
    layout.cellColors = this.shiftCellColorMapForColumnInsert(layout.cellColors, colIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForColumnInsert(layout.cellAlignments, colIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForColumnInsert(layout.cellImageWidths, colIndex);
    layout.merges = this.shiftMergesForInsertedColumn(layout.merges, colIndex);
  }
  shiftLayoutForDeletedColumn(layout, colIndex) {
    layout.colWidths = this.shiftIndexedMapForDelete(layout.colWidths, colIndex);
    layout.colColors = this.shiftIndexedMapForDelete(layout.colColors, colIndex);
    layout.cellColors = this.shiftCellColorMapForColumnDelete(layout.cellColors, colIndex);
    layout.cellAlignments = this.shiftCellAlignmentMapForColumnDelete(layout.cellAlignments, colIndex);
    layout.cellImageWidths = this.shiftCellWidthMapForColumnDelete(layout.cellImageWidths, colIndex);
    layout.merges = this.shiftMergesForDeletedColumn(layout.merges, colIndex);
  }
  shiftIndexedMapForInsert(input, insertIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const index = Number.parseInt(key, 10);
      if (!Number.isFinite(index)) continue;
      next[String(index >= insertIndex ? index + 1 : index)] = value;
    }
    return next;
  }
  shiftIndexedMapForDelete(input, deleteIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const index = Number.parseInt(key, 10);
      if (!Number.isFinite(index) || index === deleteIndex) continue;
      next[String(index > deleteIndex ? index - 1 : index)] = value;
    }
    return next;
  }
  shiftCellColorMapForRowInsert(input, insertIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({
        row: coord.row >= insertIndex ? coord.row + 1 : coord.row,
        col: coord.col
      })] = value;
    }
    return next;
  }
  shiftCellColorMapForRowDelete(input, deleteIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.row === deleteIndex) continue;
      next[this.getCellKey({
        row: coord.row > deleteIndex ? coord.row - 1 : coord.row,
        col: coord.col
      })] = value;
    }
    return next;
  }
  shiftCellColorMapForColumnInsert(input, insertIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({
        row: coord.row,
        col: coord.col >= insertIndex ? coord.col + 1 : coord.col
      })] = value;
    }
    return next;
  }
  shiftCellColorMapForColumnDelete(input, deleteIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.col === deleteIndex) continue;
      next[this.getCellKey({
        row: coord.row,
        col: coord.col > deleteIndex ? coord.col - 1 : coord.col
      })] = value;
    }
    return next;
  }
  shiftCellAlignmentMapForRowInsert(input, insertIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row >= insertIndex ? coord.row + 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }
  shiftCellAlignmentMapForRowDelete(input, deleteIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.row === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row > deleteIndex ? coord.row - 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }
  shiftCellAlignmentMapForColumnInsert(input, insertIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col >= insertIndex ? coord.col + 1 : coord.col })] = value;
    }
    return next;
  }
  shiftCellAlignmentMapForColumnDelete(input, deleteIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.col === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col > deleteIndex ? coord.col - 1 : coord.col })] = value;
    }
    return next;
  }
  shiftCellWidthMapForRowInsert(input, insertIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row >= insertIndex ? coord.row + 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }
  shiftCellWidthMapForRowDelete(input, deleteIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.row === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row > deleteIndex ? coord.row - 1 : coord.row, col: coord.col })] = value;
    }
    return next;
  }
  shiftCellWidthMapForColumnInsert(input, insertIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col >= insertIndex ? coord.col + 1 : coord.col })] = value;
    }
    return next;
  }
  shiftCellWidthMapForColumnDelete(input, deleteIndex) {
    const next = {};
    for (const [key, value] of Object.entries(input)) {
      const coord = this.parseCellKey(key);
      if (!coord || coord.col === deleteIndex) continue;
      next[this.getCellKey({ row: coord.row, col: coord.col > deleteIndex ? coord.col - 1 : coord.col })] = value;
    }
    return next;
  }
  shiftMergesForInsertedRow(merges, insertIndex) {
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
  shiftMergesForDeletedRow(merges, deleteIndex) {
    return merges.map((merge) => {
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
    }).filter((merge) => !!merge && (merge.rowspan > 1 || merge.colspan > 1));
  }
  shiftMergesForInsertedColumn(merges, insertIndex) {
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
  shiftMergesForDeletedColumn(merges, deleteIndex) {
    return merges.map((merge) => {
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
    }).filter((merge) => !!merge && (merge.rowspan > 1 || merge.colspan > 1));
  }
  parseCellKey(key) {
    const [rowText, colText] = key.split(",");
    const row = Number.parseInt(rowText ?? "", 10);
    const col = Number.parseInt(colText ?? "", 10);
    if (!Number.isFinite(row) || !Number.isFinite(col)) return null;
    return { row, col };
  }
  captureHistoryStateFromContent(filePath, content, tableIds) {
    const tableRecords = {};
    for (const tableId of tableIds) {
      const record = this.dataStore.tables[tableId];
      if (record) {
        tableRecords[tableId] = this.cloneTableRecord(record);
      }
    }
    return { filePath, content, tableRecords };
  }
  async captureHistoryState(file, tableIds) {
    const content = await this.app.vault.cachedRead(file);
    return this.captureHistoryStateFromContent(file.path, content, tableIds);
  }
  pushHistoryEntry(entry) {
    if (JSON.stringify(entry.before) === JSON.stringify(entry.after)) return;
    this.undoStack.push(entry);
    if (this.undoStack.length > HISTORY_LIMIT) {
      this.undoStack = this.undoStack.slice(-HISTORY_LIMIT);
    }
    this.redoStack = [];
  }
  canUndoHistoryForFile(filePath, tableId) {
    return this.undoStack.some((entry) => entry.filePath === filePath && entry.tableIds.includes(tableId));
  }
  canRedoHistoryForFile(filePath, tableId) {
    return this.redoStack.some((entry) => entry.filePath === filePath && entry.tableIds.includes(tableId));
  }
  async undoLastAction(filePath, tableId) {
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
      new import_obsidian.Notice(`\u5DF2\u64A4\u56DE\uFF1A${entry.label}`);
      return true;
    } finally {
      this.historyApplying = false;
    }
  }
  async redoLastAction(filePath, tableId) {
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
      new import_obsidian.Notice(`\u5DF2\u91CD\u505A\uFF1A${entry.label}`);
      return true;
    } finally {
      this.historyApplying = false;
    }
  }
  findLatestHistoryIndex(stack, filePath, tableId) {
    for (let index = stack.length - 1; index >= 0; index -= 1) {
      const entry = stack[index];
      if (entry.filePath === filePath && entry.tableIds.includes(tableId)) {
        return index;
      }
    }
    return -1;
  }
  async applyHistoryState(state, tableIds) {
    const abstractFile = this.app.vault.getAbstractFileByPath(state.filePath);
    if (!(abstractFile instanceof import_obsidian.TFile)) return;
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
  showPaletteMenu(tableEl, coord, origin, onPick) {
    const menu = new import_obsidian.Menu();
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
  showClearColorMenu(file, tableId, tableEl, coord, origin) {
    const menu = new import_obsidian.Menu();
    menu.addItem((item) => {
      item.setTitle("\u6E05\u9664\u5355\u5143\u683C\u989C\u8272");
      item.setIcon("eraser");
      item.onClick(() => void this.clearColor(tableId, file, tableEl, "cell", this.getCellKey(coord)));
    });
    menu.addItem((item) => {
      item.setTitle("\u6E05\u9664\u5F53\u524D\u884C\u989C\u8272");
      item.setIcon("eraser");
      item.onClick(() => void this.clearColor(tableId, file, tableEl, "row", String(coord.row)));
    });
    menu.addItem((item) => {
      item.setTitle("\u6E05\u9664\u5F53\u524D\u5217\u989C\u8272");
      item.setIcon("eraser");
      item.onClick(() => void this.clearColor(tableId, file, tableEl, "column", String(coord.col)));
    });
    menu.showAtPosition(this.resolveMenuPosition(tableEl, coord, origin));
  }
  resolveMenuPosition(tableEl, coord, origin) {
    if (origin) {
      return { x: origin.x + 12, y: origin.y + 8 };
    }
    const cell = tableEl.querySelector(
      `[data-mdtp-row='${coord.row}'][data-mdtp-col='${coord.col}']`
    );
    if (!cell) {
      const rect2 = tableEl.getBoundingClientRect();
      return { x: rect2.left + 12, y: rect2.top + 12 };
    }
    const rect = cell.getBoundingClientRect();
    return { x: rect.right - 8, y: rect.top + 8 };
  }
  async syncTableRecords(file, parsedTables, options = {}) {
    const now = Date.now();
    let mutated = false;
    for (const table of parsedTables) {
      if (!table.tableId) continue;
      const existing = this.dataStore.tables[table.tableId];
      const mode = options.forceMode ?? options.modeOverrides?.[table.tableId] ?? this.getTableRecordMode(existing);
      const nextRecord = {
        tableId: table.tableId,
        mode,
        filePath: file.path,
        createdAt: existing?.createdAt ?? now,
        updatedAt: existing?.updatedAt ?? now,
        lastKnownHash: this.hashString(table.raw),
        lastKnownRange: {
          startLine: table.startLine,
          endLine: table.endLine
        },
        layout: existing?.layout ? this.cloneLayout(existing.layout) : this.createEmptyLayout()
      };
      if (!existing || JSON.stringify(existing) !== JSON.stringify(nextRecord)) {
        this.dataStore.tables[table.tableId] = nextRecord;
        mutated = true;
      }
    }
    if (mutated) {
      await this.savePluginData();
    }
  }
  async createSnapshot(file, reason, tableIds) {
    const content = await this.app.vault.cachedRead(file);
    const createdAt = Date.now();
    const snapshotId = `${createdAt}-${Math.random().toString(36).slice(2, 8)}`;
    const backupPath = (0, import_obsidian.normalizePath)(
      `${this.app.vault.configDir}/plugins/${PLUGIN_ID}/backups/${this.getBackupFileName(file, createdAt)}`
    );
    await this.ensureFolderExists((0, import_obsidian.normalizePath)(`${this.app.vault.configDir}/plugins/${PLUGIN_ID}`));
    await this.ensureFolderExists((0, import_obsidian.normalizePath)(`${this.app.vault.configDir}/plugins/${PLUGIN_ID}/backups`));
    await this.app.vault.adapter.write(backupPath, content);
    const tableRecordSnapshot = {};
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
      tableRecords: tableRecordSnapshot
    });
    if (this.dataStore.snapshots.length > SNAPSHOT_LIMIT) {
      this.dataStore.snapshots = this.dataStore.snapshots.slice(0, SNAPSHOT_LIMIT);
    }
    await this.savePluginData();
  }
  cloneTableRecord(record) {
    return {
      ...record,
      lastKnownRange: { ...record.lastKnownRange },
      layout: this.cloneLayout(record.layout)
    };
  }
  cloneLayout(layout) {
    return this.normalizeLayout(layout);
  }
  normalizeLoadedTableRecord(record) {
    return {
      ...record,
      mode: this.getTableRecordMode(record),
      lastKnownRange: { ...record.lastKnownRange },
      layout: this.normalizeLayout(record.layout)
    };
  }
  getTableRecordMode(record) {
    return record?.mode === "nativeLayout" ? "nativeLayout" : "enhanced";
  }
  normalizeLayout(layout) {
    const normalized = {
      colWidths: { ...layout?.colWidths ?? {} },
      rowHeights: { ...layout?.rowHeights ?? {} },
      cellColors: { ...layout?.cellColors ?? {} },
      rowColors: { ...layout?.rowColors ?? {} },
      colColors: { ...layout?.colColors ?? {} },
      cellAlignments: { ...layout?.cellAlignments ?? {} },
      cellImageWidths: { ...layout?.cellImageWidths ?? {} },
      merges: Array.isArray(layout?.merges) ? layout.merges.map((merge) => ({ ...merge })) : []
    };
    if (layout?.nativeColorPreset === NATIVE_COLOR_PRESET_BLUE_ZEBRA) {
      normalized.nativeColorPreset = NATIVE_COLOR_PRESET_BLUE_ZEBRA;
      normalized.nativeColorPalette = this.normalizeNativeColorPalette(layout.nativeColorPalette, this.getCurrentNativeColorPalette());
      this.normalizeNativeColorPresetLayout(normalized);
    }
    return normalized;
  }
  async savePluginData() {
    await this.saveData(this.dataStore);
  }
  getBackupFileName(file, createdAt) {
    const timestamp = new Date(createdAt).toISOString().replace(/[:.]/g, "-");
    const safePath = file.path.replace(/[\\/]/g, "__");
    return `${timestamp}__${safePath}.md.bak`;
  }
  async ensureFolderExists(folderPath) {
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(folderPath)) return;
    const segments = folderPath.split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!await adapter.exists(current)) {
        await adapter.mkdir(current);
      }
    }
  }
  parseMarkdownTables(content) {
    const lines = content.split(/\r?\n/);
    const tables = [];
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
        raw: lines.slice(lineIndex, endLine + 1).join("\n")
      });
      lineIndex = endLine;
    }
    return tables;
  }
  isLikelyTableHeader(headerLine, dividerLine) {
    if (!this.hasPipe(headerLine) || !this.isDividerRow(dividerLine)) {
      return false;
    }
    const trimmed = headerLine.trim();
    if (!trimmed || trimmed.startsWith("<!--")) {
      return false;
    }
    return true;
  }
  isLikelyTableRow(line) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (this.extractTableMarkerId(trimmed)) return false;
    return this.hasPipe(trimmed);
  }
  isDividerRow(line) {
    const trimmed = line.trim();
    if (!trimmed || !this.hasPipe(trimmed)) return false;
    const segments = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map((segment) => segment.trim());
    return segments.length > 0 && segments.every((segment) => /^:?-{3,}:?$/.test(segment));
  }
  hasPipe(line) {
    const pipeCount = [...line].filter((char) => char === "|").length;
    return pipeCount >= 2;
  }
  generateTableId() {
    return `${TABLE_ID_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
  findMarkerLineAbove(lines, tableStartLine) {
    for (let index = tableStartLine - 1; index >= 0; index -= 1) {
      const line = lines[index].trim();
      if (!line) continue;
      return this.extractTableMarkerId(lines[index]) ? index : null;
    }
    return null;
  }
  normalizeMarkerSpacing(lines, tableStartLine) {
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
  formatTableMarker(tableId) {
    return `%% mdtp:${tableId} %%`;
  }
  ensureBlankLineAfterTableMarkers(lines) {
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
  joinLines(lines, originalEndsWithNewline) {
    const joined = lines.join("\n");
    return originalEndsWithNewline ? `${joined}
` : joined;
  }
  createEmptyLayout() {
    return {
      colWidths: {},
      rowHeights: {},
      cellColors: {},
      rowColors: {},
      colColors: {},
      cellAlignments: {},
      cellImageWidths: {},
      merges: []
    };
  }
  getCellKey(coord) {
    return `${coord.row},${coord.col}`;
  }
  hashString(input) {
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `h${(hash >>> 0).toString(16)}`;
  }
  extractTableMarkerId(line) {
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
  isHiddenMarkerText(line) {
    return !!this.extractTableMarkerId(line) || TEMPLATE_TABLE_METADATA_RE.test(line);
  }
  async installRuntimeStyles() {
    this.injectedStyleEl?.remove();
    this.injectedStyleEl = null;
    const stylePath = (0, import_obsidian.normalizePath)(`${this.app.vault.configDir}/plugins/${PLUGIN_ID}/styles.css`);
    if (!await this.app.vault.adapter.exists(stylePath)) {
      return;
    }
    const css = await this.app.vault.adapter.read(stylePath);
    const styleEl = document.createElement("style");
    styleEl.id = `${PLUGIN_ID}-runtime-style`;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    this.injectedStyleEl = styleEl;
  }
};
