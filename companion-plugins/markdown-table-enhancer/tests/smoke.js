const assert = require("assert");
const Module = require("module");
const path = require("path");

const originalLoad = Module._load;
const obsidianStub = {
  Plugin: class {},
  Notice: class {},
  Menu: class {},
  Modal: class {
    constructor(app) {
      this.app = app;
      this.contentEl = {
        replaceChildren() {},
        classList: { add() {} },
        appendChild() {},
      };
    }
    open() {}
    close() {}
  },
  MarkdownView: class {},
  MarkdownPostProcessorContext: class {},
  TFile: class {},
  normalizePath: (value) => value,
};
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "obsidian") {
    return obsidianStub;
  }

  if (request === "@codemirror/state") {
    return {
      RangeSetBuilder: class {
        add() {}
        finish() {
          return [];
        }
      },
    };
  }

  if (request === "@codemirror/view") {
    return {
      Decoration: {
        line: () => ({})
      },
      DecorationSet: class {},
      EditorView: class {},
      ViewUpdate: class {},
      ViewPlugin: {
        fromClass: (value) => value,
      },
    };
  }

  return originalLoad(request, parent, isMain);
};

const pluginPath = process.env.MDTP_PLUGIN_PATH
  ? path.resolve(process.env.MDTP_PLUGIN_PATH)
  : path.resolve(__dirname, "../main.js");
const pluginModule = require(pluginPath);
const PluginClass = pluginModule.default || pluginModule;
const plugin = Object.create(PluginClass.prototype);
const { TFile } = require("obsidian");

if (!global.Node) {
  global.Node = {
    TEXT_NODE: 3,
    ELEMENT_NODE: 1,
  };
}

function createFile(filePath) {
  const file = new TFile();
  file.path = filePath;
  return file;
}

function createTextNode(text) {
  return {
    nodeType: Node.TEXT_NODE,
    textContent: text,
  };
}

function createElement(tagName, options = {}) {
  const attributes = { ...(options.attributes ?? {}) };
  const childNodes = [...(options.childNodes ?? [])];
  const element = {
    nodeType: Node.ELEMENT_NODE,
    tagName: String(tagName).toUpperCase(),
    childNodes,
    children: [],
    textContent: options.textContent ?? childNodes.map((child) => child.textContent ?? "").join(""),
    dataset: { ...(options.dataset ?? {}) },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
    setAttribute(name, value) {
      attributes[name] = value;
    },
    querySelector(selector) {
      if (selector === "img") {
        return findFirstDescendant(this, (node) => node.tagName?.toLowerCase() === "img");
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
  element.children = childNodes.filter((child) => child.nodeType === Node.ELEMENT_NODE);
  return element;
}

function findFirstDescendant(node, predicate) {
  const children = node.children ?? [];
  for (const child of children) {
    if (predicate(child)) return child;
    const nested = findFirstDescendant(child, predicate);
    if (nested) return nested;
  }
  return null;
}

async function run() {
  const sourceFile = createFile("开发测试/2️⃣codex测试文档/历史测试/增强表格-纯验收.md");
  const imageA = createFile("assets/attachments/preview-a.png");
  const imageB = createFile("assets/attachments/preview-b.jpg");
  const fileMap = new Map([
    [imageA.path, imageA],
    [imageB.path, imageB],
  ]);
  plugin.app = {
    metadataCache: {
      getFirstLinkpathDest(linkPath) {
        return fileMap.get(linkPath) ?? null;
      },
    },
    vault: {
      getAbstractFileByPath(filePath) {
        return fileMap.get(filePath) ?? null;
      },
      getResourcePath(file) {
        return `app://resource/${file.path}`;
      },
    },
  };
  plugin.dataStore = {
    version: 1,
    tables: {},
    snapshots: [],
    experimentalFeatureGate: false,
  };
  plugin.isExperimentalFeatureGateEnabled = function isExperimentalFeatureGateEnabled() {
    return !!this.dataStore?.experimentalFeatureGate;
  };

  {
    const nestedTable = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("子项")] }),
                createElement("td", { childNodes: [createTextNode("说明")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("A")] }),
                createElement("td", { childNodes: [createTextNode("B")] }),
              ],
            }),
          ],
        }),
      ],
    });
    const topTable = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              attributes: { style: "height: 24pt" },
              childNodes: [
                createElement("td", {
                  attributes: { style: "width: 1in; background-color: #FFE9E8; text-align: center" },
                  childNodes: [createTextNode("模块")],
                }),
                createElement("td", {
                  attributes: { style: "width: 2in; background-color: #FFE9E8; text-align: center" },
                  childNodes: [createTextNode("内容")],
                }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("资料")] }),
                createElement("td", {
                  childNodes: [
                    createElement("a", {
                      attributes: { href: "https://example.com/doc" },
                      childNodes: [createTextNode("文档链接")],
                    }),
                    createElement("br"),
                    createElement("img", {
                      attributes: { width: "320", src: "assets/attachments/preview-a.png" },
                      dataset: { mdtpSrc: "assets/attachments/preview-a.png" },
                    }),
                  ],
                }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("子表")] }),
                createElement("td", { childNodes: [nestedTable] }),
              ],
            }),
          ],
        }),
      ],
    });

    const converted = plugin.convertOneNoteTableToEnhancedMarkdown(sourceFile, topTable);
    assert.ok(converted, "OneNote table conversion should produce an enhanced table block");
    assert.ok(
      converted.markdown.includes("%% mdtp:tbl_"),
      "converted OneNote table should include an enhanced table marker"
    );
    assert.ok(
      /^%% mdtp:tbl_[^\n]+ %%\n\n\| 模块 \| 内容 \|/m.test(converted.markdown),
      "converted OneNote table should keep a blank line after the hidden marker so Obsidian renders it as a table"
    );
    assert.ok(
      converted.markdown.split("\n")[3] === "| --- | --- |",
      "converted OneNote table divider should stay compact instead of exposing very long source lines"
    );
    assert.ok(
      converted.markdown.includes("[文档链接](https://example.com/doc)"),
      "converted OneNote table should keep hyperlinks in markdown form"
    );
    assert.ok(
      converted.markdown.includes("![[assets/attachments/preview-a.png]]"),
      "converted OneNote table should keep localized images in markdown form"
    );
    assert.ok(
      converted.markdown.includes("子项 / 说明<br>A / B"),
      "nested OneNote tables should be flattened into readable multiline cell content"
    );
    assert.strictEqual(
      converted.record.layout.cellImageWidths["1,1"],
      320,
      "converted OneNote table should carry image width metadata into enhanced layout"
    );
    assert.strictEqual(converted.record.layout.colWidths["0"], 96, "OneNote inch-based cell width should become column width metadata");
    assert.strictEqual(converted.record.layout.colWidths["1"], 192, "OneNote column width metadata should preserve relative width");
    assert.strictEqual(converted.record.layout.rowHeights["0"], 32, "OneNote point-based row height should become row height metadata");
    assert.strictEqual(converted.record.layout.cellColors["0,0"], "#FFE9E8", "OneNote cell background should become enhanced cell color");
    assert.strictEqual(converted.record.layout.cellAlignments["0,0"], "center", "OneNote text alignment should become enhanced cell alignment");
  }

  {
    const tableWithFallbackText = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("时间顺序")] }),
                createElement("td", { childNodes: [createTextNode("关键内容")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("注册")] }),
                createElement("td", {
                  textContent: "平台约束：个人实名的注册上限；单企业主体注册的上限",
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const converted = plugin.convertOneNoteTableToEnhancedMarkdown(sourceFile, tableWithFallbackText);
    assert.ok(converted?.markdown.includes("平台约束：个人实名的注册上限"), "OneNote table import should keep cell text even when rich child nodes are unavailable");
  }

  {
    const previousDocument = global.document;
    global.document = {
      createElement(tagName) {
        return {
          tagName: String(tagName).toUpperCase(),
          className: "",
          href: "",
          textContent: "",
          target: "",
          rel: "",
          children: [],
          appendChild(child) {
            this.children.push(child);
          },
        };
      },
      createTextNode(text) {
        return { nodeType: Node.TEXT_NODE, textContent: text };
      },
    };
    try {
      const root = {
        children: [],
        appendChild(child) {
          this.children.push(child);
        },
      };
      plugin.appendRenderedCellInlineContent(root, "1、[模板](https://doc.weixin.qq.com/sheet/demo) 后续文字");
      assert.equal(root.children.length, 3, "rendered rich cells should split plain text and markdown links");
      assert.equal(root.children[1].tagName, "A", "markdown links in rendered image cells should become clickable anchors");
      assert.equal(root.children[1].textContent, "模板", "rendered link should keep the visible label");
      assert.equal(root.children[1].href, "https://doc.weixin.qq.com/sheet/demo", "rendered link should keep the href");
    } finally {
      global.document = previousDocument;
    }
  }

  {
    const sourceTableId = "tbl_template_source";
    plugin.dataStore.tables[sourceTableId] = {
      tableId: sourceTableId,
      mode: "enhanced",
      filePath: "模板源.md",
      createdAt: 1,
      updatedAt: 1,
      lastKnownHash: "old",
      lastKnownRange: { startLine: 1, endLine: 3 },
      layout: {
        colWidths: { 0: 120 },
        rowHeights: {},
        cellColors: {},
        rowColors: { 0: "#D0EBFF" },
        colColors: {},
        cellAlignments: {},
        cellImageWidths: {},
        merges: [{ row: 1, col: 0, rowspan: 2, colspan: 1 }],
      },
    };
    const templateContent = [
      plugin.serializeTemplateTableMetadata({
        [sourceTableId]: {
          mode: "enhanced",
          layout: plugin.dataStore.tables[sourceTableId].layout,
        },
      }),
      plugin.formatTableMarker(sourceTableId),
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "| 3 | 4 |",
    ].join("\n");
    const prepared = plugin.prepareTemplateContentForInsertion(templateContent, createFile("目标.md"));
    assert.ok(!prepared.content.includes("mdtp-template:"), "template insertion should strip hidden metadata line");
    assert.ok(!prepared.content.includes(sourceTableId), "template insertion should remap source table ids");
    assert.equal(prepared.tableRecords.length, 1, "template insertion should create a fresh enhanced table record");
    assert.equal(prepared.tableRecords[0].mode, "enhanced", "inserted template table should stay enhanced");
    assert.deepStrictEqual(
      prepared.tableRecords[0].layout,
      plugin.dataStore.tables[sourceTableId].layout,
      "inserted template table should preserve enhanced layout metadata"
    );
    assert.ok(
      /%% mdtp:tbl_[^\n]+ %%\n\n\| A \| B \|/.test(prepared.content),
      "inserted template should keep a blank line between the marker and the table header so Obsidian renders it as a table"
    );
  }

  {
    const sourceTableId = "tbl_template_preview_source";
    const layout = plugin.createEmptyLayout();
    layout.colWidths = { 0: 120 };
    plugin.dataStore.tables[sourceTableId] = {
      tableId: sourceTableId,
      mode: "nativeLayout",
      filePath: "源.md",
      createdAt: 1,
      updatedAt: 1,
      lastKnownHash: "hash",
      lastKnownRange: { startLine: 1, endLine: 3 },
      layout,
    };
    const wholeContent = plugin.buildManagedWholeTableTemplateContent({
      tableId: sourceTableId,
      raw: ["| 时间 | 类型 |", "| --- | --- |", "| 8:00 | 计划 |"].join("\n"),
    });
    assert.ok(
      /%% mdtp:tbl_template_preview_source %%\n\n\| 时间 \| 类型 \|/.test(wholeContent),
      "saving a managed table as template should leave a blank line between the marker and the table header"
    );

    const previewSplit = plugin.splitTemplateContentForPreview(wholeContent);
    assert.ok(
      previewSplit.hiddenPrefix.includes("mdtp-template:"),
      "preview split should hide the mdtp-template metadata line from the user"
    );
    assert.ok(
      previewSplit.hiddenPrefix.includes(`%% mdtp:${sourceTableId} %%`),
      "preview split should hide the mdtp table marker from the user"
    );
    assert.ok(!previewSplit.visible.includes("mdtp-template:"), "preview visible content should not include hidden metadata");
    assert.ok(!previewSplit.visible.includes("mdtp:tbl_"), "preview visible content should not expose hidden table markers");
    assert.ok(previewSplit.visible.startsWith("| 时间 | 类型 |"), "preview visible content should start with the clean table header");
    assert.ok(previewSplit.visible.includes("| 8:00 | 计划 |"), "preview visible content should keep the table body");

    const userEdited = "| 时间 | 类型 |\n| --- | --- |\n| 9:00 | 复盘 |";
    const combined = plugin.combineTemplateContentForSave(previewSplit.hiddenPrefix, userEdited);
    assert.ok(combined.includes("mdtp-template:"), "saving the edited template should keep the hidden metadata prefix");
    assert.ok(
      combined.includes(`%% mdtp:${sourceTableId} %%`),
      "saving the edited template should keep the hidden table marker prefix"
    );
    assert.ok(combined.includes("9:00"), "saving the edited template should write the user's edited table content");
    assert.ok(
      /%% mdtp:tbl_template_preview_source %%\n\n\| 时间 \| 类型 \|/.test(combined),
      "saving the edited template should keep a blank line between the marker and the user-edited table header"
    );
  }

  assert.deepStrictEqual(
    plugin.getNativeSidebarActionDescriptors().map((item) => item.label),
    [
      "对当前表格美化",
      "对本页面所有的表格美化",
      "设置选中行颜色",
      "行段配色",
      "复制当前表格成图",
      "保存当前表格为模板",
      "插入模板",
      "模板库",
    ],
    "native table sidebar should expose stable onboarding and row color actions"
  );

  assert.deepStrictEqual(
    plugin.getNativeLayoutSidebarActionDescriptors().map((item) => item.label),
    [
      "对当前表格美化",
      "对本页面所有的表格美化",
      "设置选中行颜色",
      "行段配色",
      "复制当前表格成图",
      "保存当前表格为模板",
      "插入模板",
      "模板库",
    ],
    "native-layout table sidebar should expose resize-safe actions only"
  );

  {
    const rowColorLayout = plugin.createNativeColorTableLayout();
    plugin.dataStore.tables.tbl_native_row_color = {
      tableId: "tbl_native_row_color",
      mode: "nativeLayout",
      filePath: sourceFile.path,
      createdAt: 1,
      updatedAt: 1,
      lastKnownHash: "hash",
      lastKnownRange: { startLine: 1, endLine: 8 },
      layout: rowColorLayout,
    };
    const previousSave = plugin.savePluginData;
    const previousRefresh = plugin.refreshEnhancedTable;
    const previousCapture = plugin.captureHistoryState;
    const previousPush = plugin.pushHistoryEntry;
    plugin.savePluginData = async () => {};
    plugin.refreshEnhancedTable = () => {};
    plugin.captureHistoryState = async () => ({});
    plugin.pushHistoryEntry = () => {};
    const fakeNativeTableEl = {
      rows: Array.from({ length: 9 }, () => ({ cells: [] })),
    };
    try {
      await plugin.setNativeLayoutRowRangeColor(
        "tbl_native_row_color",
        sourceFile,
        fakeNativeTableEl,
        3,
        6,
        "#E2F0D9"
      );
      assert.equal(rowColorLayout.rowColors["3"], "#E2F0D9", "row-band color should set the first selected row");
      assert.equal(rowColorLayout.rowColors["6"], "#E2F0D9", "row-band color should set the last selected row");
      assert.equal(rowColorLayout.rowColors["2"], undefined, "row-band color should not touch adjacent rows");
      await plugin.setNativeLayoutRowRangeColor(
        "tbl_native_row_color",
        sourceFile,
        fakeNativeTableEl,
        3,
        6,
        null
      );
      assert.equal(rowColorLayout.rowColors["3"], undefined, "clearing row-band color should restore preset row color");
      assert.equal(plugin.getNativeRowColorChoicesForTable("tbl_native_row_color")[0].label, "正文白", "native row color palette should recommend the current table color system first");
    } finally {
      plugin.savePluginData = previousSave;
      plugin.refreshEnhancedTable = previousRefresh;
      plugin.captureHistoryState = previousCapture;
      plugin.pushHistoryEntry = previousPush;
    }
  }

  {
    const menuItems = [];
    const fakeMenu = {
      addItem(builder) {
        const item = {
          title: "",
          icon: "",
          setTitle(value) {
            this.title = value;
            return this;
          },
          setIcon(value) {
            this.icon = value;
            return this;
          },
          setDisabled(value) {
            this.disabled = value;
            return this;
          },
          onClick(handler) {
            this.click = handler;
            return this;
          },
        };
        builder(item);
        menuItems.push(item);
      },
    };
    let nativeLayoutCall = null;
    const parsedTable = { startLine: 1, endLine: 3, raw: "| A |\n|---|\n| B |" };
    plugin.initializeSpecificTableNativeLayout = async (file, table) => {
      nativeLayoutCall = { file, table };
      return true;
    };
    plugin.addNativeLayoutMenuItem(fakeMenu, sourceFile, parsedTable);
    assert.deepStrictEqual(
      menuItems.map((item) => item.title),
      ["── 原生表格增强 ──", "对当前表格美化", "对本页面所有的表格美化"],
      "native table context menu should expose native layout section and beautify actions"
    );
    await menuItems[1].click();
    assert.deepStrictEqual(
      nativeLayoutCall,
      { file: sourceFile, table: parsedTable },
      "native layout context menu item should initialize the target table directly"
    );
  }

  {
    let templateContent = null;
    plugin.openTemplateNameModal = (content) => {
      templateContent = content;
    };
    const parsedTable = {
      raw: ["| 维度 | 内容 |", "| --- | --- |", "| 目标 | 做成模板 |"].join("\n"),
    };
    await plugin.savePlainTableAsTemplate({ parsedTable });
    assert.equal(
      templateContent,
      ["| 维度 | 内容 |", "| --- | --- |", "| 目标 | 做成模板 |", ""].join("\n"),
      "saving the current plain table should preserve the whole markdown table without requiring a cell selection"
    );
  }

  {
    const layout = plugin.createEmptyLayout();
    layout.colWidths = { 0: 120, 1: 240 };
    plugin.dataStore.tables.tbl_native_layout_template = {
      tableId: "tbl_native_layout_template",
      mode: "nativeLayout",
      filePath: sourceFile.path,
      createdAt: 1,
      updatedAt: 2,
      lastKnownHash: "hash",
      lastKnownRange: { startLine: 1, endLine: 3 },
      layout,
    };
    const content = plugin.buildManagedWholeTableTemplateContent({
      tableId: "tbl_native_layout_template",
      raw: ["| 维度 | 内容 |", "| --- | --- |", "| 目标 | 保留长宽 |"].join("\n"),
    });
    assert.ok(content.includes("mdtp-template:"), "native-layout table template should include layout metadata");
    assert.ok(content.includes('"mode":"nativeLayout"'), "native-layout table template should preserve native layout mode");
    assert.ok(content.includes("%% mdtp:tbl_native_layout_template %%"), "managed table template should include the table marker");
    assert.ok(content.includes("| 目标 | 保留长宽 |"), "managed table template should include the full table body");
  }

  {
    const rawTable = plugin.buildNativeColorRawTable();
    assert.deepStrictEqual(
      rawTable.header,
      ["", "", ""],
      "native color template should keep the default table empty"
    );
    assert.strictEqual(rawTable.body.length, 4, "native color template should include blank rows for immediate writing");
    assert.ok(rawTable.body.every((row) => row.every((cell) => cell === "")), "native color template should not seed sample content");
    const layout = plugin.createNativeColorTableLayout();
    assert.strictEqual(layout.rowColors["0"], "#A9D18E", "native color template should store a green header row");
    assert.strictEqual(layout.nativeColorPreset, "blueZebra", "native color template should use the dynamic striped color preset");
    assert.strictEqual(plugin.getNativeColorPresetRowColor(layout, 1), "#FFFFFF", "first body row should stay white");
    assert.strictEqual(plugin.getNativeColorPresetRowColor(layout, 2), "#E2F0D9", "second body row should be soft green");
    assert.strictEqual(plugin.getNativeColorPresetRowColor(layout, 4), "#E2F0D9", "all later even body rows should keep the soft-green stripe color");
    assert.deepStrictEqual(layout.colWidths, { 0: 170, 1: 190, 2: 430 }, "native color template should seed stable readable column widths");
    const record = plugin.createNativeColorTableRecord(sourceFile, "tbl_native_color", plugin.buildRawTable(rawTable).join("\n"));
    assert.strictEqual(record.mode, "nativeLayout", "native color template must stay in nativeLayout mode, not enhanced mode");
    assert.strictEqual(record.layout.rowColors["0"], "#A9D18E", "native color table record should persist the color metadata");
    assert.deepStrictEqual(
      record.layout.nativeColorPalette,
      {
        header: "#A9D18E",
        headerText: "#111111",
        baseRow: "#FFFFFF",
        altRow: "#E2F0D9",
        border: "#9EAD93",
      },
      "native color table records should store the active palette so existing tables stay stable"
    );

    const legacyLayout = plugin.createEmptyLayout();
    legacyLayout.colWidths = { 0: 128, 1: 360 };
    legacyLayout.rowHeights = { 2: 96 };
    legacyLayout.cellColors = { "0,0": "#FFFFFF" };
    legacyLayout.rowColors = { 0: "#A9D18E", 2: "#E2F0D9" };
    legacyLayout.colColors = { 1: "#D0EBFF" };
    plugin.applyNativeColorPresetToLayout(legacyLayout);
    assert.deepStrictEqual(legacyLayout.colWidths, { 0: 128, 1: 360 }, "re-applying native color should preserve existing column widths");
    assert.deepStrictEqual(legacyLayout.rowHeights, { 2: 96 }, "re-applying native color should preserve existing row heights");
    assert.deepStrictEqual(legacyLayout.cellColors, {}, "re-applying native color should clear stale cell colors that can hide header text");
    assert.deepStrictEqual(legacyLayout.colColors, {}, "re-applying native color should clear stale column colors");
    assert.deepStrictEqual(legacyLayout.rowColors, { 0: "#A9D18E" }, "re-applying native color should reset to the dynamic header row only");
    assert.strictEqual(legacyLayout.nativeColorPreset, "blueZebra", "legacy native-layout tables should get the dynamic zebra preset");

    const legacyBlueHeaderLayout = plugin.createEmptyLayout();
    legacyBlueHeaderLayout.nativeColorPreset = "blueZebra";
    legacyBlueHeaderLayout.rowColors = { 0: "#2F5F9F" };
    const normalizedLegacyBlueHeaderLayout = plugin.normalizeLayout(legacyBlueHeaderLayout);
    assert.deepStrictEqual(
      normalizedLegacyBlueHeaderLayout.rowColors,
      { 0: "#A9D18E" },
      "loaded legacy blue native headers should migrate to green headers for readable editing"
    );

    const previousColorSave = plugin.savePluginData;
    const previousColorRefresh = plugin.scheduleVisibleTableRefresh;
    let savedColorSettings = null;
    plugin.savePluginData = async () => {
      savedColorSettings = {
        preset: plugin.dataStore.nativeColorDefaultPresetId,
        custom: plugin.dataStore.nativeColorCustomPalette,
      };
    };
    plugin.scheduleVisibleTableRefresh = () => {};
    try {
      const updatedColorSettings = await plugin.updateNativeColorSettingsFromManager({
        defaultPresetId: "custom",
        customPalette: {
          header: "#123",
          headerText: "#222222",
          baseRow: "#ffffff",
          altRow: "#ddeeff",
          border: "#ABCDEF",
        },
      });
      assert.equal(updatedColorSettings.defaultPresetId, "custom", "manager should update the default native color preset");
      assert.deepStrictEqual(
        updatedColorSettings.customPalette,
        {
          header: "#112233",
          headerText: "#222222",
          baseRow: "#FFFFFF",
          altRow: "#DDEEFF",
          border: "#ABCDEF",
        },
        "manager should normalize custom palette hex colors"
      );
      assert.deepStrictEqual(
        savedColorSettings.custom,
        updatedColorSettings.customPalette,
        "manager color settings should be persisted"
      );
      const customLayout = plugin.createNativeColorTableLayout();
      assert.equal(customLayout.rowColors["0"], "#112233", "new native color layouts should use the selected custom header");
      assert.equal(plugin.getNativeColorPresetRowColor(customLayout, 2), "#DDEEFF", "new native color layouts should use the selected custom stripe");

      const savedPaletteSettings = await plugin.saveCurrentNativeColorPaletteAsManager("夜间复盘");
      const savedPalette = savedPaletteSettings.savedPalettes.find((item) => item.label === "夜间复盘");
      assert.ok(savedPalette, "manager should save the current custom palette as a fixed preset");
      assert.equal(savedPaletteSettings.defaultPresetId, savedPalette.id, "saved palette should become the active default preset");
      const savedLayout = plugin.createNativeColorTableLayout();
      assert.equal(savedLayout.rowColors["0"], "#112233", "saved color layouts should reuse the saved custom header");
      assert.equal(plugin.getNativeColorPresetRowColor(savedLayout, 2), "#DDEEFF", "saved color layouts should reuse the saved custom stripe");
      const afterDeleteSavedPalette = await plugin.deleteNativeColorPaletteFromManager(savedPalette.id);
      assert.equal(
        afterDeleteSavedPalette.savedPalettes.some((item) => item.id === savedPalette.id),
        false,
        "manager should delete saved color presets by id"
      );

      await plugin.updateNativeColorSettingsFromManager({ defaultPresetId: "green" });
    } finally {
      plugin.savePluginData = previousColorSave;
      plugin.scheduleVisibleTableRefresh = previousColorRefresh;
    }

    const legacySizeOnlyId = "tbl_legacy_size_only";
    const legacySizeOnlyContent = [
      `%% mdtp:${legacySizeOnlyId} %%`,
      "",
      "| 要素 | 自检 |",
      "| --- | --- |",
      "| 1 | 2 |",
    ].join("\n");
    const legacyParsedTable = plugin.parseMarkdownTables(legacySizeOnlyContent)[0];
    const legacySizeOnlyRecord = {
      tableId: legacySizeOnlyId,
      mode: "enhanced",
      filePath: sourceFile.path,
      createdAt: 1,
      updatedAt: 1,
      lastKnownHash: "hash",
      lastKnownRange: { startLine: 2, endLine: 4 },
      layout: plugin.createEmptyLayout(),
    };
    legacySizeOnlyRecord.layout.colWidths = { 0: 128 };
    legacySizeOnlyRecord.layout.rowHeights = { 1: 88 };
    legacySizeOnlyRecord.layout.cellColors = { "0,0": "#FFFFFF" };
    plugin.dataStore.tables[legacySizeOnlyId] = legacySizeOnlyRecord;

    assert.strictEqual(
      plugin.canConvertEnhancedRecordToNativeLayout(legacySizeOnlyRecord),
      true,
      "legacy size-only enhanced records should be eligible for native color+layout conversion"
    );

    const mergedEnhancedRecord = {
      ...legacySizeOnlyRecord,
      layout: {
        ...plugin.createEmptyLayout(),
        merges: [{ row: 1, col: 0, rowspan: 2, colspan: 1 }],
      },
    };
    assert.strictEqual(
      plugin.canConvertEnhancedRecordToNativeLayout(mergedEnhancedRecord),
      false,
      "real enhanced records with merge metadata should not be silently converted to native layout"
    );

    const previousApp = plugin.app;
    const previousSync = plugin.syncTableRecords;
    const previousSave = plugin.savePluginData;
    const previousRefresh = plugin.scheduleVisibleTableRefresh;
    let saved = false;
    let refreshed = false;
    plugin.app = {
      vault: {
        cachedRead() {
          return Promise.resolve(legacySizeOnlyContent);
        },
      },
    };
    plugin.syncTableRecords = async () => {};
    plugin.savePluginData = async () => {
      saved = true;
    };
    plugin.scheduleVisibleTableRefresh = () => {
      refreshed = true;
    };
    try {
      const convertedLegacy = await PluginClass.prototype.initializeSpecificTableNativeLayout.call(
        plugin,
        sourceFile,
        legacyParsedTable
      );
      assert.strictEqual(convertedLegacy, true, "native color+layout command should convert legacy size-only records");
      assert.strictEqual(plugin.dataStore.tables[legacySizeOnlyId].mode, "nativeLayout", "legacy size-only record should become nativeLayout");
      assert.deepStrictEqual(plugin.dataStore.tables[legacySizeOnlyId].layout.colWidths, { 0: 128 }, "legacy conversion should preserve column widths");
      assert.deepStrictEqual(plugin.dataStore.tables[legacySizeOnlyId].layout.rowHeights, { 1: 88 }, "legacy conversion should preserve row heights");
      assert.deepStrictEqual(plugin.dataStore.tables[legacySizeOnlyId].layout.cellColors, {}, "legacy conversion should clear stale cell colors");
      assert.strictEqual(plugin.dataStore.tables[legacySizeOnlyId].layout.nativeColorPreset, "blueZebra", "legacy conversion should add striped color preset");
      assert.strictEqual(saved, true, "legacy conversion should persist plugin data");
      assert.strictEqual(refreshed, true, "legacy conversion should refresh visible tables");
    } finally {
      plugin.app = previousApp;
      plugin.syncTableRecords = previousSync;
      plugin.savePluginData = previousSave;
      plugin.scheduleVisibleTableRefresh = previousRefresh;
    }
  }

  assert.deepStrictEqual(
    plugin.getEnhancedSidebarActionDescriptors().map((item) => item.label),
    [
      "上方插入行",
      "下方插入行",
      "左侧插入列",
      "右侧插入列",
      "删除当前行",
      "删除当前列",
      "合并",
      "拆分",
      "单元格颜色",
      "当前行颜色",
      "当前列颜色",
      "清除颜色",
      "复制当前块内容",
      "高保真复制",
      "复制当前块成图",
      "保存当前选区为模板",
      "插入模板",
      "模板库",
    ],
    "enhanced table sidebar should expose the stable white-list including high-fidelity copy"
  );

  assert.strictEqual(
    plugin.getEnhancedSidebarActionDescriptors().find((item) => item.label === "高保真复制")?.experimental,
    undefined,
    "high-fidelity copy should no longer be marked as experimental in the sidebar descriptors"
  );

  {
    const previousWindow = global.window;
    const fileContents = new Map([
      [".模板库/旧模板.md", "旧内容"],
      [".模板库/工作/周计划.md", "周计划"],
      [".模板库/工作/复盘/事件.md", "事件"],
    ]);
    const folders = new Set([".模板库", ".模板库/工作", ".模板库/工作/复盘"]);
    const removedPaths = [];
    const templatePlugin = Object.create(PluginClass.prototype);
    templatePlugin.app = {
      vault: {
        getAbstractFileByPath() {
          return null;
        },
        create(filePath, content) {
          fileContents.set(filePath, content);
          return Promise.resolve({ path: filePath });
        },
        adapter: {
          exists(filePath) {
            return Promise.resolve(folders.has(filePath) || fileContents.has(filePath));
          },
          mkdir(filePath) {
            folders.add(filePath);
            return Promise.resolve();
          },
          list(folderPath) {
            return Promise.resolve({
              files: Array.from(fileContents.keys()).filter((item) => {
                const rest = item.slice(`${folderPath}/`.length);
                return item.startsWith(`${folderPath}/`) && !rest.includes("/");
              }),
              folders: Array.from(folders).filter((item) => {
                if (!item.startsWith(`${folderPath}/`) || item === folderPath) return false;
                const rest = item.slice(`${folderPath}/`.length);
                return rest.length > 0 && !rest.includes("/");
              }),
            });
          },
          read(filePath) {
            return Promise.resolve(fileContents.get(filePath) ?? "");
          },
          write(filePath, content) {
            fileContents.set(filePath, content);
            return Promise.resolve();
          },
          remove(filePath) {
            removedPaths.push(filePath);
            fileContents.delete(filePath);
            return Promise.resolve();
          },
        },
      },
    };
    global.window = Object.assign({}, previousWindow, {
      confirm(message) {
        assert.ok(message.includes("旧模板"), "delete confirmation should name the template");
        return true;
      },
    });
    try {
      const created = await templatePlugin.createEmptyTemplate("新/模板");
      assert.equal(created.path, ".模板库/新/模板.md", "blank template creation should allow nested template folders");
      assert.equal(fileContents.get(".模板库/新/模板.md"), "", "blank templates should be editable empty files");
      assert.equal(folders.has(".模板库/新"), true, "blank template creation should create missing nested folders");
      const records = await templatePlugin.getTemplateRecords();
      assert.deepEqual(
        records.map((item) => item.relativePath),
        ["旧模板.md", "工作/周计划.md", "工作/复盘/事件.md", "新/模板.md"],
        "template records should preserve unlimited nested folder paths"
      );
      const deleted = await templatePlugin.deleteTemplateByPath(".模板库/旧模板.md");
      assert.equal(deleted, true, "template delete should succeed after confirmation");
      assert.deepStrictEqual(removedPaths, [".模板库/旧模板.md"], "template delete should remove only the selected template");
      assert.equal(fileContents.has(".模板库/旧模板.md"), false, "deleted template should disappear from the library backing store");

      const rejected = await templatePlugin.createTemplateFromModalInput("   ", "不会保存");
      assert.equal(rejected, false, "template creation modal should reject a blank template name");
      assert.equal(
        Array.from(fileContents.values()).includes("不会保存"),
        false,
        "template creation modal should not save content when the name is blank"
      );

      const contentTemplate = await templatePlugin.createTemplateFromModalInput("工作/新建内容", "第一行\n第二行");
      assert.equal(contentTemplate, true, "template creation modal should save non-empty template content");
      assert.equal(
        fileContents.get(".模板库/工作/新建内容.md"),
        "第一行\n第二行",
        "template creation modal should preserve typed template content"
      );

      const emptyTemplate = await templatePlugin.createTemplateFromModalInput("空模板", "   ");
      assert.equal(emptyTemplate.path, ".模板库/空模板.md", "template creation modal should still allow blank editable templates");
      assert.equal(fileContents.get(".模板库/空模板.md"), "", "blank templates created from the modal should be empty editable files");
    } finally {
      global.window = previousWindow;
    }
  }

  plugin.dataStore.experimentalFeatureGate = false;
  assert.strictEqual(
    plugin.shouldExposeExperimentalAction(true),
    false,
    "experimental actions should stay hidden when the experimental gate is off"
  );
  assert.strictEqual(
    plugin.shouldExposeExperimentalAction(false),
    true,
    "stable actions should remain visible when the experimental gate is off"
  );

  const single = plugin.buildClipboardTextFromMatrix([["第一格<br>第二行"]]);
  assert.strictEqual(single, "第一格\n第二行", "single-cell copy should produce plain cell text");

  const highFidelitySingle = plugin.buildHighFidelityClipboardTextFromMatrix([
    ["这里测试图片<br>![[assets/attachments/test.png]]"],
  ]);
  assert.strictEqual(
    highFidelitySingle,
    "\n这里测试图片\n\n![[assets/attachments/test.png]]\n",
    "high-fidelity copy should promote single rich text+image cell content into markdown body blocks"
  );

  const highFidelityMarkdownImageSingle = plugin.buildHighFidelityClipboardTextFromMatrix([
    ["图文说明<br>![封面](assets/attachments/preview-b.jpg)"],
  ]);
  assert.strictEqual(
    highFidelityMarkdownImageSingle,
    "\n图文说明\n\n![封面](assets/attachments/preview-b.jpg)\n",
    "high-fidelity copy should also promote markdown-image single cells into markdown body blocks"
  );

  const highFidelityInlineMixedSingle = plugin.buildHighFidelityClipboardTextFromMatrix([
    ["说明 ![[assets/attachments/test.png]] 尾注<br>下一行补充"],
  ]);
  assert.strictEqual(
    highFidelityInlineMixedSingle,
    "\n说明\n\n![[assets/attachments/test.png]]\n\n尾注\n\n下一行补充\n",
    "high-fidelity copy should split inline text-image-text content into natural markdown body blocks"
  );

  const highFidelityPlainSingle = plugin.buildHighFidelityClipboardTextFromMatrix([["纯文本"]]);
  assert.strictEqual(
    highFidelityPlainSingle,
    "纯文本",
    "high-fidelity copy should preserve stable plain-text behavior for simple single cells"
  );

  const highFidelityMultilinePlainSingle = plugin.buildHighFidelityClipboardTextFromMatrix([["第一行<br>第二行"]]);
  assert.strictEqual(
    highFidelityMultilinePlainSingle,
    "第一行\n第二行",
    "high-fidelity copy should keep multiline plain text as plain text when no image markup exists"
  );

  const highFidelityMatrixFallback = plugin.buildHighFidelityClipboardTextFromMatrix([
    ["项目", "备注"],
    ["图文", "说明<br>![[assets/attachments/test.png]]"],
  ]);
  assert.ok(
    highFidelityMatrixFallback.startsWith("\n| "),
    "high-fidelity copy should fall back to markdown table output for multi-cell matrix selections"
  );
  assert.ok(
    highFidelityMatrixFallback.includes("![[assets/attachments/test.png]]"),
    "multi-cell fallback should preserve image markup inside markdown table output"
  );

  plugin.dataStore.experimentalFeatureGate = true;
  assert.strictEqual(
    plugin.shouldExposeExperimentalAction(true),
    true,
    "experimental actions should become visible when the experimental gate is on"
  );

  const matrix = [
    ["项目", "备注"],
    ["第一行", "![[assets/attachments/test.png]]"],
    ["第二行", "多行<br>文本"],
  ];
  const markdown = plugin.buildClipboardTextFromMatrix(matrix);
  assert.ok(markdown.startsWith("\n| "), "multi-cell copy should add a leading blank line for normal markdown paste");
  assert.ok(markdown.endsWith(" |\n"), "multi-cell copy should add a trailing blank line for normal markdown paste");
  assert.ok(markdown.includes("| 项目"), "multi-cell copy should produce markdown table");
  assert.ok(markdown.includes("![[assets/attachments/test.png]]"), "image markup should remain in markdown table copy");

  const parsed = plugin.parseClipboardMatrix(markdown);
  assert.deepStrictEqual(
    parsed,
    [
      ["项目", "备注"],
      ["第一行", "![[assets/attachments/test.png]]"],
      ["第二行", "多行\n文本"],
    ],
    "markdown table copy should round-trip back into matrix form"
  );

  const tsv = "甲\t乙\n丙\t丁";
  assert.deepStrictEqual(
    plugin.parseClipboardMatrix(tsv),
    [["甲", "乙"], ["丙", "丁"]],
    "tsv parsing should still work for in-table paste"
  );

  const wrapped = "\n| 甲 | 乙 |\n| --- | --- |\n| 丙 | 丁 |\n";
  assert.deepStrictEqual(
    plugin.parseClipboardMatrix(wrapped),
    [["甲", "乙"], ["丙", "丁"]],
    "wrapped markdown table copy should still parse back into matrix form"
  );

  assert.deepStrictEqual(
    plugin.extractImagePreviewTargets(
      "文本 ![[assets/attachments/preview-a.png|240]]\n![封面](assets/attachments/preview-b.jpg)",
      sourceFile
    ),
    [
      {
        displayPath: "assets/attachments/preview-a.png",
        resourcePath: "app://resource/assets/attachments/preview-a.png",
        width: 240,
      },
      {
        displayPath: "assets/attachments/preview-b.jpg",
        resourcePath: "app://resource/assets/attachments/preview-b.jpg",
      },
    ],
    "inline editor should resolve both wikilink and markdown image previews"
  );

  assert.deepStrictEqual(
    plugin.splitImageMarkupForCellRender(
      "前文<br>![[assets/attachments/preview-a.png|240]]<br>![封面](assets/attachments/preview-b.jpg)<br>尾注",
      sourceFile
    ),
    [
      { kind: "text", value: "前文\n" },
      {
        kind: "image",
        raw: "![[assets/attachments/preview-a.png|240]]",
        alt: "",
        displayPath: "assets/attachments/preview-a.png",
        resourcePath: "app://resource/assets/attachments/preview-a.png",
        width: 240,
      },
      { kind: "text", value: "\n" },
      {
        kind: "image",
        raw: "![封面](assets/attachments/preview-b.jpg)",
        alt: "封面",
        displayPath: "assets/attachments/preview-b.jpg",
        resourcePath: "app://resource/assets/attachments/preview-b.jpg",
      },
      { kind: "text", value: "\n尾注" },
    ],
    "enhanced table image cells should preserve text-image order while resolving real resources"
  );

  assert.deepStrictEqual(
    plugin.extractImageMarkupFragments("测试\n![[assets/attachments/preview-a.png|220]]\n尾注"),
    ["![[assets/attachments/preview-a.png|220]]"],
    "inline editor should isolate image markup instead of showing it in the text input"
  );
  assert.strictEqual(
    plugin.getInlineEditorTextValue("测试\n![[assets/attachments/preview-a.png|220]]"),
    "测试",
    "inline editor text value should hide image reference markup"
  );
  assert.strictEqual(
    plugin.composeInlineEditorSourceValue(
      { imageMarkups: ["![[assets/attachments/preview-a.png|220]]"] },
      "测试\n这里测试图片"
    ),
    "测试\n这里测试图片\n\n![[assets/attachments/preview-a.png|220]]",
    "inline editor should write text and preserved images back without exposing raw links while editing"
  );
  {
    const events = [];
    const textarea = {
      value: "买号的事",
      selectionStart: 0,
      selectionEnd: 4,
      dispatchEvent(event) {
        events.push(event.type);
      },
    };
    plugin.toggleTextareaBold(textarea);
    assert.strictEqual(textarea.value, "**买号的事**", "Command+B should wrap selected enhanced-table cell text in markdown bold");
    assert.strictEqual(textarea.selectionStart, 2, "bold shortcut should keep the original selected text selected");
    assert.strictEqual(textarea.selectionEnd, 6, "bold shortcut should keep the original selected text selected");
    assert.deepStrictEqual(events, ["input"], "bold shortcut should notify the inline editor layout/update pipeline");
  }
  {
    const textarea = {
      value: "**买号的事**",
      selectionStart: 2,
      selectionEnd: 6,
      dispatchEvent() {},
    };
    plugin.toggleTextareaBold(textarea);
    assert.strictEqual(textarea.value, "买号的事", "Command+B should unwrap text that is already surrounded by bold markers");
    assert.strictEqual(textarea.selectionStart, 0);
    assert.strictEqual(textarea.selectionEnd, 4);
  }
  {
    const textarea = {
      value: "计划",
      selectionStart: 2,
      selectionEnd: 2,
      dispatchEvent() {},
    };
    plugin.toggleTextareaBold(textarea);
    assert.strictEqual(textarea.value, "计划****", "Command+B without selection should insert a bold placeholder");
    assert.strictEqual(textarea.selectionStart, 4, "empty bold placeholder should leave the cursor between markers");
    assert.strictEqual(textarea.selectionEnd, 4);
  }
  {
    const textarea = { scrollHeight: 640, value: "第一行\n第二行", style: { height: "220px" } };
    const wrapper = { scrollHeight: 0, style: { minHeight: "" } };
    const imageContainer = { scrollHeight: 0, classList: { contains: () => false } };
    const cell = { style: { height: "180px", minHeight: "" } };
    const row = { style: { height: "180px", minHeight: "" } };
    plugin.syncInlineEditorLayout({ textarea, wrapper, imageContainer, cell, row, closing: false });
    assert.strictEqual(
      textarea.style.height,
      "640px",
      "inline editor should expand to the full long-text height instead of folding into an inner scrollbar"
    );
    assert.strictEqual(textarea.style.minHeight, "640px", "textarea min height should keep the full text visible");
    assert.strictEqual(wrapper.style.minHeight, "640px", "editor wrapper should grow with the text input");
    assert.strictEqual(cell.style.height, "auto", "editing cell should allow natural content flow while editing");
    assert.strictEqual(cell.style.minHeight, "640px", "editing cell should keep the full text visible");
    assert.strictEqual(row.style.height, "640px", "editing row should follow the expanded editor height");
    assert.strictEqual(row.style.minHeight, "640px", "editing row should not collapse below the editor height");
  }
  {
    const textarea = { scrollHeight: 320, value: "文字区", style: { height: "120px", minHeight: "" } };
    const wrapper = { scrollHeight: 760, style: { minHeight: "" } };
    const imageContainer = { scrollHeight: 420, classList: { contains: (name) => name === "is-visible" } };
    const cell = { style: { height: "180px", minHeight: "" } };
    const row = { style: { height: "180px", minHeight: "" } };
    plugin.syncInlineEditorLayout({ textarea, wrapper, imageContainer, cell, row, closing: false });
    assert.strictEqual(
      wrapper.style.minHeight,
      "760px",
      "mixed text-image editor should reserve the full wrapper height, not only the textarea height"
    );
    assert.strictEqual(row.style.height, "760px", "mixed text-image editor should stretch row height with image previews");
  }

  assert.deepStrictEqual(
    plugin.parseClipboardHtmlMatrix(
      "<table><tbody><tr><th>项目</th><th>说明</th></tr><tr><td>OneNote</td><td>第一行<br>第二行</td></tr></tbody></table>"
    ),
    [
      ["项目", "说明"],
      ["OneNote", "第一行\n第二行"],
    ],
    "html table paste from OneNote or web pages should become an enhanced-table matrix"
  );

  assert.strictEqual(
    plugin.sanitizeOneNoteUrl("javascript:alert(1)", false),
    "",
    "OneNote rich paste should strip script URLs"
  );
  assert.strictEqual(
    plugin.sanitizeOneNoteUrl("https://example.com/doc", false),
    "https://example.com/doc",
    "OneNote rich paste should preserve normal links"
  );
  assert.strictEqual(
    plugin.sanitizeOneNoteStyleAttribute("color: red; position: absolute; background-color: #fff3bf; background-image: url(x)"),
    "color: red; background-color: #fff3bf",
    "OneNote rich paste should only preserve safe, useful style declarations"
  );
  assert.strictEqual(
    plugin.shouldUseClipboardImageForOneNoteSource("cid:image001.png"),
    true,
    "OneNote rich paste should map cid images to clipboard image files"
  );

  const imageWidthRawTable = plugin.parseRawTable(
    [
      "| 项目 | 图片 |",
      "| --- | --- |",
      "| 宽度图 | ![[assets/attachments/preview-a.png|295]] |",
    ].join("\n")
  );
  assert.ok(imageWidthRawTable, "table parser should accept Obsidian image-width wikilinks inside cells");
  assert.strictEqual(
    plugin.getCellValue(imageWidthRawTable, { row: 1, col: 1 }),
    "![[assets/attachments/preview-a.png|295]]",
    "image width pipe inside a wikilink should not split the markdown table cell"
  );

  const originalWindow = global.window;
  const windowOpenCalls = [];
  global.window = Object.assign({}, originalWindow, {
    open: (...args) => {
      windowOpenCalls.push(args);
      return null;
    },
  });
  try {
    plugin.openCellImageOriginal({
      querySelector(selector) {
        if (selector === "a[href]") {
          return { href: "app://resource/assets/attachments/preview-a.png" };
        }
        if (selector === "img") {
          return { src: "app://resource/assets/attachments/fallback.png" };
        }
        return null;
      },
    });
    assert.deepStrictEqual(
      windowOpenCalls,
      [["app://resource/assets/attachments/preview-a.png", "_blank", "noopener,noreferrer"]],
      "open original should prefer the anchor href from the image cell"
    );
  } finally {
    global.window = originalWindow;
  }

  const originalStartResizeDrag = plugin.startImageResizeDrag;
  const imageManipulationCalls = [];
  plugin.startImageResizeDrag = () => {
    imageManipulationCalls.push("resize");
  };

  assert.strictEqual(
    plugin.handleImageManipulatorPointerDown(
      {
        target: {
          closest: () => null,
        },
      },
      {}
    ),
    "noop",
    "image manipulator should keep frame body inert and avoid extra alignment behavior"
  );
  assert.deepStrictEqual(imageManipulationCalls, [], "image manipulator should stay resize-only");

  assert.strictEqual(
    plugin.handleImageManipulatorPointerDown(
      {
        target: {
          closest: (selector) => (selector === ".mdtp-image-manipulator-handle" ? {} : null),
        },
      },
      {}
    ),
    "resize",
    "image manipulator should still support resize handle dragging"
  );
  assert.deepStrictEqual(imageManipulationCalls, ["resize"], "resize handle should trigger resize drag");

  assert.deepStrictEqual(
    plugin.extractImagePreviewTargets(
      "说明文本<br>![[assets/attachments/preview-a.png|360]]<br>尾注",
      sourceFile
    ),
    [
      {
        displayPath: "assets/attachments/preview-a.png",
        resourcePath: "app://resource/assets/attachments/preview-a.png",
        width: 360,
      },
    ],
    "image natural editing smoke should keep preview extraction stable even when wikilink carries width metadata"
  );

  assert.strictEqual(
    plugin.removeSelectedImageMarkupFromValue(
      "前文<br>![[assets/attachments/preview-a.png|360]]<br>中段<br>![[assets/attachments/preview-b.jpg]]<br>尾注",
      sourceFile,
      "assets/attachments/preview-a.png",
      "app://resource/assets/attachments/preview-a.png"
    ),
    "前文<br>中段<br>![[assets/attachments/preview-b.jpg]]<br>尾注",
    "deleting a selected enhanced-table image should remove only the selected image markup"
  );

  const richCopyWithTrailingNarrative = plugin.buildHighFidelityClipboardTextFromMatrix([
    ["图片说明<br>![[assets/attachments/preview-a.png]]<br>补充结论"],
  ]);
  assert.strictEqual(
    richCopyWithTrailingNarrative,
    "\n图片说明\n\n![[assets/attachments/preview-a.png]]\n\n补充结论\n",
    "high-fidelity copy should keep image narrative order stable for single rich cells"
  );

  plugin.startImageResizeDrag = originalStartResizeDrag;

  const rawTable = plugin.parseRawTable(
    [
      "| 项目 | 说明 | 备注 |",
      "| --- | --- | --- |",
      "|  | 这里测试图片<br>![[assets/attachments/preview-a.png]] | 这里观察图片行为 |",
      "| 下方空白 |  | 其他备注 |",
    ].join("\n")
  );
  assert.ok(rawTable, "raw markdown table should parse for merge fallback test");
  const fallback = plugin.findFirstNonEmptyCellInSelection(
    rawTable,
    { startRow: 1, endRow: 2, startCol: 0, endCol: 1 },
    { row: 1, col: 0 }
  );
  assert.deepStrictEqual(
    fallback,
    {
      coord: { row: 1, col: 1 },
      value: "这里测试图片<br>![[assets/attachments/preview-a.png]]",
    },
    "merge should promote the first non-empty cell into the anchor when the anchor is empty"
  );
  assert.strictEqual(plugin.setCellValue(rawTable, { row: 1, col: 0 }, fallback.value), true);
  assert.strictEqual(plugin.setCellValue(rawTable, fallback.coord, ""), true);
  assert.strictEqual(
    plugin.getCellValue(rawTable, { row: 1, col: 0 }),
    "这里测试图片<br>![[assets/attachments/preview-a.png]]",
    "merge fallback should preserve non-empty content in the anchor cell"
  );
  assert.strictEqual(
    plugin.getCellValue(rawTable, { row: 1, col: 1 }),
    "",
    "merge fallback should clear the original source cell after promotion"
  );

  assert.strictEqual(
    plugin.isMeaningfullyEmptyCellValue("<br>"),
    true,
    "visual-empty line break cells should still count as empty during merge promotion"
  );
  assert.strictEqual(
    plugin.isMeaningfullyEmptyCellValue("![[assets/attachments/test.png]]"),
    false,
    "image cells should count as non-empty during merge promotion"
  );

  assert.strictEqual(
    plugin.resolveCursorTableColumn("| alpha | beta |", 3, 2),
    0,
    "cursor inside first native table cell should resolve to first column"
  );

  assert.strictEqual(
    plugin.resolveCursorTableColumn("| alpha | beta |", 11, 2),
    1,
    "cursor inside second native table cell should resolve to second column"
  );

  assert.strictEqual(
    plugin.resolveCursorTableColumn("| 含有\\\\|转义 | 第二列 |", 5, 2),
    0,
    "escaped pipe should not break native table column detection"
  );

  assert.ok(
    plugin.getNativeSidebarActionDescriptors().some((item) => item.label === "对当前表格美化"),
    "native table sidebar should expose the opt-in native color layout entry"
  );
  assert.ok(
    !plugin.getNativeSidebarActionDescriptors().some((item) => item.label === "查看当前文件表格增强状态"),
    "native table sidebar should hide enhanced-table status entry"
  );
  assert.ok(
    !plugin.getNativeLayoutSidebarActionDescriptors().some((item) => item.label === "升级为增强表格"),
    "native-layout sidebar should hide enhanced-table upgrade entry"
  );

  assert.strictEqual(
    plugin.getTableRecordMode({}),
    "enhanced",
    "legacy table records without mode should default to enhanced"
  );
  assert.strictEqual(
    plugin.getTableRecordMode({ mode: "nativeLayout" }),
    "nativeLayout",
    "native layout records should preserve the opt-in layout-only mode"
  );

  let batchContent = [
    "# 批量启用验收",
    "",
    "| 项目 | 说明 |",
    "| --- | --- |",
    "| 第一张表 | 未启用 |",
    "",
    "| 项目 | 备注 |",
    "| --- | --- |",
    "| 第二张表 | 未启用 |",
    "",
  ].join("\n");
  let lastModifiedContent = null;
  let batchSnapshotCall = null;
  let batchSyncTables = null;
  let refreshBurstCount = 0;
  plugin.app.vault.cachedRead = async () => batchContent;
  plugin.app.vault.modify = async (_file, nextContent) => {
    batchContent = nextContent;
    lastModifiedContent = nextContent;
  };
  plugin.createSnapshot = async (file, reason, tableIds) => {
    batchSnapshotCall = { file, reason, tableIds };
  };
  plugin.syncTableRecords = async (_file, parsedTables) => {
    batchSyncTables = parsedTables;
  };
  plugin.savePluginData = async () => {};
  plugin.scheduleVisibleTableRefresh = () => {
    refreshBurstCount += 1;
  };

  await plugin.initializeCurrentFileTables(sourceFile);
  const insertedMarkers = (lastModifiedContent.match(/%% mdtp:tbl_[a-z0-9_-]+ %%/gi) ?? []).length;
  assert.strictEqual(insertedMarkers, 2, "batch initialization should add anchors for every markdown table in the file");
  assert.ok(batchSnapshotCall, "batch initialization should create a restore snapshot before writing");
  assert.strictEqual(batchSnapshotCall.reason, "before-anchor");
  assert.ok(Array.isArray(batchSyncTables) && batchSyncTables.length === 2, "batch initialization should resync two parsed tables");
  assert.strictEqual(refreshBurstCount, 1, "batch initialization should request one visible table refresh");

  let clearCall = null;
  const originalRemoveActiveImageFromCell = plugin.removeActiveImageFromCell;
  let removedImageManipulator = null;
  plugin.activeEditor = null;
  plugin.getActiveInteractionContext = () => ({
    tableId: "tbl_clean_acceptance_20260420",
    file: sourceFile,
    anchor: { row: 1, col: 1 },
    selection: { startRow: 1, endRow: 1, startCol: 1, endCol: 1 },
  });
  plugin.clearSelectionContents = async (file, tableId, selection) => {
    clearCall = { file, tableId, selection };
    return true;
  };
  plugin.removeActiveImageFromCell = async (manipulator) => {
    removedImageManipulator = manipulator;
    return true;
  };
  const deleteEvent = {
    key: "Delete",
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    target: null,
    defaultPrevented: false,
    propagationStopped: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
    stopPropagation() {
      this.propagationStopped = true;
    },
  };
  const activeManipulator = { tableId: "tbl_clean_acceptance_20260420", coord: { row: 1, col: 1 } };
  plugin.activeImageManipulator = activeManipulator;
  await plugin.handleDocumentKeyDown(deleteEvent);
  assert.strictEqual(
    removedImageManipulator,
    activeManipulator,
    "delete on a selected enhanced-table image should remove the selected image before clearing the whole cell"
  );
  assert.strictEqual(clearCall, null, "image delete should not fall through to cell clear");
  assert.strictEqual(deleteEvent.defaultPrevented, true);
  assert.strictEqual(deleteEvent.propagationStopped, true);

  plugin.removeActiveImageFromCell = originalRemoveActiveImageFromCell;
  plugin.activeImageManipulator = null;
  deleteEvent.defaultPrevented = false;
  deleteEvent.propagationStopped = false;
  await plugin.handleDocumentKeyDown(deleteEvent);
  assert.deepStrictEqual(
    clearCall,
    {
      file: sourceFile,
      tableId: "tbl_clean_acceptance_20260420",
      selection: { startRow: 1, endRow: 1, startCol: 1, endCol: 1 },
    },
    "delete on a selected enhanced-table cell should clear contents without opening the editor"
  );
  assert.strictEqual(deleteEvent.defaultPrevented, true);
  assert.strictEqual(deleteEvent.propagationStopped, true);

  clearCall = null;
  const deleteFromCodeMirrorEvent = {
    ...deleteEvent,
    target: {
      closest(selector) {
        return selector.includes(".cm-content") ? {} : null;
      },
    },
    defaultPrevented: false,
    propagationStopped: false,
  };
  await plugin.handleDocumentKeyDown(deleteFromCodeMirrorEvent);
  assert.deepStrictEqual(
    clearCall,
    {
      file: sourceFile,
      tableId: "tbl_clean_acceptance_20260420",
      selection: { startRow: 1, endRow: 1, startCol: 1, endCol: 1 },
    },
    "delete should still clear a selected enhanced-table cell when Obsidian reports the key event from cm-content"
  );
  assert.strictEqual(deleteFromCodeMirrorEvent.defaultPrevented, true);
  assert.strictEqual(deleteFromCodeMirrorEvent.propagationStopped, true);

  clearCall = null;
  const deleteFromTextareaEvent = {
    ...deleteEvent,
    target: {
      closest(selector) {
        return selector.includes("textarea") ? {} : null;
      },
    },
    defaultPrevented: false,
    propagationStopped: false,
  };
  await plugin.handleDocumentKeyDown(deleteFromTextareaEvent);
  assert.strictEqual(clearCall, null, "delete should not clear table cells while a real text input is active");

  console.log("markdown-table-enhancer smoke tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
