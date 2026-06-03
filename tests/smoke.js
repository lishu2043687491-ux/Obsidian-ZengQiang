const assert = require("node:assert/strict");
const path = require("node:path");
const { TFile, TFolder, normalizePath } = require("obsidian");

const pluginPath = process.env.FEISHU_DOC_TOOLBAR_PLUGIN_PATH || path.resolve(__dirname, "..", "main.js");

class FakeEditor {
  constructor(text) {
    this.lines = String(text).split("\n");
    this.cursor = { line: 0, ch: 0 };
  }

  getLine(line) {
    return this.lines[line] ?? "";
  }

  lineCount() {
    return this.lines.length;
  }

  setCursor(cursor) {
    this.cursor = { ...cursor };
  }

  getCursor(which) {
    if (which === "from" && this.selection) return { ...this.selection.from };
    if (which === "to" && this.selection) return { ...this.selection.to };
    return { ...this.cursor };
  }

  setSelection(from, to) {
    this.selection = { from: { ...from }, to: { ...to } };
  }

  getSelection() {
    if (!this.selection) return "";
    const { from, to } = this.selection;
    if (from.line === to.line) return (this.lines[from.line] ?? "").slice(from.ch, to.ch);
    const parts = [(this.lines[from.line] ?? "").slice(from.ch)];
    for (let line = from.line + 1; line < to.line; line += 1) {
      parts.push(this.lines[line] ?? "");
    }
    parts.push((this.lines[to.line] ?? "").slice(0, to.ch));
    return parts.join("\n");
  }

  replaceSelection(text) {
    if (!this.selection) return;
    const { from, to } = this.selection;
    this.replaceRange(text, from, to);
    this.cursor = { line: from.line, ch: from.ch + String(text).length };
    this.selection = null;
  }

  replaceRange(text, from, to = from) {
    const startLine = from.line;
    const endLine = to.line;
    const startCh = from.ch;
    const endCh = to.ch;

    const before = this.lines[startLine]?.slice(0, startCh) ?? "";
    const after = this.lines[endLine]?.slice(endCh) ?? "";
    const nextLines = String(text).split("\n");
    const replacement = [...nextLines];
    replacement[0] = `${before}${replacement[0] ?? ""}`;
    replacement[replacement.length - 1] = `${replacement[replacement.length - 1] ?? ""}${after}`;

    this.lines.splice(startLine, endLine - startLine + 1, ...replacement);
  }

  toString() {
    return this.lines.join("\n");
  }
}

function createPlugin(PluginClass, options = {}) {
  const experimentalFeatureGate = options.experimentalFeatureGate ?? false;
  const tableEnhancerPlugin = options.tableEnhancerPlugin ?? {
    dataStore: {
      experimentalFeatureGate,
    },
  };
  const fileCaches = options.fileCaches ?? new Map();
  const fileContents = options.fileContents ?? new Map();
  const folderPaths = new Set();
  const activeView = options.activeView ?? null;

  const hasFolderContents = (folderPath) =>
    folderPaths.has(folderPath) ||
    Array.from(fileContents.keys()).some((filePath) => filePath.startsWith(`${folderPath}/`));

  const listFolderChildren = (folderPath) => {
    const prefix = normalizePath(folderPath);
    const directFiles = [];
    const directFolders = new Set();
    for (const filePath of fileContents.keys()) {
      if (!filePath.startsWith(`${prefix}/`)) continue;
      const rest = filePath.slice(prefix.length + 1);
      const segments = rest.split("/");
      if (segments.length === 1) directFiles.push(filePath);
      else directFolders.add(normalizePath(`${prefix}/${segments[0]}`));
    }
    for (const childFolder of folderPaths) {
      if (childFolder === prefix) continue;
      if (!childFolder.startsWith(`${prefix}/`)) continue;
      const rest = childFolder.slice(prefix.length + 1);
      const first = rest.split("/")[0];
      if (first) directFolders.add(normalizePath(`${prefix}/${first}`));
    }
    return {
      files: directFiles,
      folders: Array.from(directFolders),
    };
  };

  const app = {
    workspace: {
      getActiveViewOfType() {
        return activeView;
      },
      getLeavesOfType() {
        return [];
      },
    },
    vault: {
      getConfig(key) {
        if (key === "attachmentFolderPath") return "_attachments";
        return null;
      },
      getMarkdownFiles() {
        return Array.from(fileContents.keys()).map((filePath, index) => ({
          path: filePath,
          basename: filePath.split("/").pop().replace(/\.md$/i, ""),
          stat: { mtime: index + 1 },
        }));
      },
      getAbstractFileByPath(filePath) {
        const normalized = normalizePath(filePath);
        if (fileContents.has(normalized)) {
          const file = new TFile();
          file.path = normalized;
          file.name = normalized.split("/").pop();
          return file;
        }
        if (hasFolderContents(normalized)) {
          const folder = new TFolder();
          folder.path = normalized;
          folder.name = normalized.split("/").pop();
          return folder;
        }
        return null;
      },
      cachedRead(file) {
        return Promise.resolve(fileContents.get(file.path) ?? "");
      },
      read(file) {
        return Promise.resolve(fileContents.get(file.path) ?? "");
      },
      create(filePath, content) {
        fileContents.set(filePath, content);
        return Promise.resolve({ path: filePath, basename: filePath.split("/").pop().replace(/\.md$/i, "") });
      },
      createFolder(folderPath) {
        folderPaths.add(normalizePath(folderPath));
        return Promise.resolve();
      },
      rename(file, newPath) {
        const oldPath = normalizePath(file.path);
        const nextPath = normalizePath(newPath);
        if (file instanceof TFile && fileContents.has(oldPath)) {
          fileContents.set(nextPath, fileContents.get(oldPath));
          fileContents.delete(oldPath);
        } else if (file instanceof TFolder) {
          for (const [key, value] of Array.from(fileContents.entries())) {
            if (key === oldPath || key.startsWith(`${oldPath}/`)) {
              const movedKey = normalizePath(key.replace(oldPath, nextPath));
              fileContents.set(movedKey, value);
              fileContents.delete(key);
            }
          }
          for (const key of Array.from(folderPaths)) {
            if (key === oldPath || key.startsWith(`${oldPath}/`)) {
              folderPaths.delete(key);
              folderPaths.add(normalizePath(key.replace(oldPath, nextPath)));
            }
          }
        }
        file.path = nextPath;
        return Promise.resolve();
      },
      adapter: {
        exists(filePath) {
          const normalized = normalizePath(filePath);
          return Promise.resolve(fileContents.has(normalized) || hasFolderContents(normalized));
        },
        read(filePath) {
          return Promise.resolve(fileContents.get(filePath) ?? "");
        },
        write(filePath, content) {
          fileContents.set(filePath, content);
          return Promise.resolve();
        },
        list(folderPath) {
          return Promise.resolve(listFolderChildren(normalizePath(folderPath)));
        },
        rename(from, to) {
          const oldPath = normalizePath(from);
          const nextPath = normalizePath(to);
          if (fileContents.has(oldPath)) {
            fileContents.set(nextPath, fileContents.get(oldPath));
            fileContents.delete(oldPath);
          } else if (hasFolderContents(oldPath)) {
            for (const [key, value] of Array.from(fileContents.entries())) {
              if (key === oldPath || key.startsWith(`${oldPath}/`)) {
                fileContents.set(normalizePath(key.replace(oldPath, nextPath)), value);
                fileContents.delete(key);
              }
            }
            for (const key of Array.from(folderPaths)) {
              if (key === oldPath || key.startsWith(`${oldPath}/`)) {
                folderPaths.delete(key);
                folderPaths.add(normalizePath(key.replace(oldPath, nextPath)));
              }
            }
          }
          return Promise.resolve();
        },
        rmdir(folderPath, recursive) {
          const normalized = normalizePath(folderPath);
          if (recursive) {
            for (const key of Array.from(fileContents.keys())) {
              if (key.startsWith(`${normalized}/`)) fileContents.delete(key);
            }
            for (const key of Array.from(folderPaths)) {
              if (key === normalized || key.startsWith(`${normalized}/`)) folderPaths.delete(key);
            }
          } else {
            folderPaths.delete(normalized);
          }
          return Promise.resolve();
        },
        remove(filePath) {
          fileContents.delete(normalizePath(filePath));
          return Promise.resolve();
        },
      },
    },
    metadataCache: {
      getFileCache(file) {
        return fileCaches.get(file.path) ?? null;
      },
    },
    commands: {
      executed: [],
      executeCommandById(id) {
        this.executed.push(id);
        return true;
      },
    },
    plugins: {
      manifests: {
        "feishu-doc-toolbar": { name: "Obsidian增强体验", version: "0.6.0" },
        "markdown-table-enhancer": {},
        dragger: {},
      },
      plugins: {
        "markdown-table-enhancer": tableEnhancerPlugin,
        ...(options.draggerEnabled
          ? {
              dragger: {},
            }
          : {}),
      },
    },
  };
  const plugin = new PluginClass(app);
  plugin.scheduleStyleRefresh = () => {};
  plugin.hidePopover = () => {};
  plugin.saveData = async (data) => {
    plugin.dataStore = data;
  };
  plugin.updateTemplateIndexNote = async () => {};
  return plugin;
}

class FakeMenu {
  constructor() {
    this.items = [];
  }

  addSeparator() {}

  addItem(builder) {
    const item = {
      title: "",
      setTitle(value) {
        this.title = value;
      },
      onClick(fn) {
        this.click = fn;
      },
    };
    builder(item);
    this.items.push(item);
  }
}

function createContext(plugin, editor, line) {
  return {
    editor,
    line,
    kind: "paragraph",
    blockEl: {
      isConnected: false,
    },
    cmView: {},
    file: {},
    view: {},
  };
}

function createContextWithFile(plugin, editor, line, filePath) {
  const context = createContext(plugin, editor, line);
  context.file = { path: filePath };
  return context;
}

function loadPluginClass() {
  const mod = require(pluginPath);
  return mod.default || mod;
}

async function run() {
  const PluginClass = loadPluginClass();
  const plugin = createPlugin(PluginClass);
  const experimentalPlugin = createPlugin(PluginClass, { experimentalFeatureGate: true });

  {
    assert.deepEqual(
      plugin.normalizeData({}),
      {
        version: 1,
        templateFolderPath: ".模板库",
        templateUngroupedLabel: "未分组",
        recentTemplatePaths: [],
        toolbarActionOrder: [],
        managedPluginAliases: {},
        managedPluginNotes: {},
        managedPluginCategories: {},
        managedPluginCategoryNames: {},
        managedPluginCategoryOrder: ["table", "block", "automation", "content", "style", "file", "ai", "other"],
        managedPluginCategoryRemoved: [],
        managedPluginStatusCheckedAt: 0,
        settingsTabOrder: ["toolbar", "nativeTable", "templateLibrary", "modules", "plugins"],
        embeddedModules: {},
        showOneNoteImport: false,
        showTableEnhancerEntrances: false,
        showDraggerIntegrationStatus: true,
      },
      "management settings should get stable defaults"
    );

    assert.deepEqual(plugin.getManagedPluginStatus("markdown-table-enhancer"), { installed: true, enabled: true });
    assert.deepEqual(plugin.getManagedPluginStatus("dragger"), { installed: true, enabled: false });
    assert.ok(
      plugin.getHostedPluginItems().some((item) => item.id === "feishu-doc-toolbar" && item.name === "Obsidian增强体验"),
      "management center should expose the unified Obsidian experience host plugin"
    );

    let saved = null;
    plugin.saveData = async (data) => {
      saved = data;
    };
    await plugin.updateManagementSetting("showOneNoteImport", false);
    assert.equal(plugin.dataStore.showOneNoteImport, false, "management toggle should update plugin data");
    assert.equal(saved.showOneNoteImport, false, "management toggle should persist plugin data");
    await plugin.updateManagedPluginAlias("dragger", "块拖动");
    await plugin.updateManagedPluginNote("dragger", "稳定可用，保留启用状态");
    assert.equal(
      plugin.getHostedPluginItems().find((item) => item.id === "dragger").name,
      "块拖动",
      "third-party plugin aliases should only change the managed display name"
    );
    assert.equal(
      plugin.getHostedPluginItems().find((item) => item.id === "dragger").originalName,
      "dragger",
      "third-party plugin aliases should not change the original manifest name"
    );
    assert.ok(
      plugin.getHostedPluginCategorySections().some((section) =>
        section.category.id === "block" && section.items.some((item) => item.id === "dragger")
      ),
      "third-party plugin manager should infer a default category"
    );
    await plugin.createManagedPluginCategory("我的插件组");
    const customCategory = plugin.getManagedPluginCategories().find((category) => category.name === "我的插件组");
    assert.ok(customCategory, "third-party plugin manager should allow custom categories");
    await plugin.moveManagedPluginToCategory("dragger", customCategory.id);
    assert.equal(
      plugin.dataStore.managedPluginCategories.dragger,
      customCategory.id,
      "third-party plugin manager should persist category assignments"
    );
    const renamed = await plugin.renameManagedPluginCategory(customCategory.id, "块拖动组");
    assert.equal(renamed, true, "renameManagedPluginCategory should succeed");
    assert.equal(
      plugin.getManagedPluginCategories().find((category) => category.id === customCategory.id)?.name,
      "块拖动组"
    );
    global.confirm = () => true;
    const deleted = await plugin.deleteManagedPluginCategory(customCategory.id);
    assert.equal(deleted, true, "deleteManagedPluginCategory should remove custom category");
    assert.equal(plugin.dataStore.managedPluginCategories.dragger, "other", "deleted category plugins should move to other");
    assert.equal(
      plugin.getManagedPluginCategories().some((category) => category.id === customCategory.id),
      false,
      "deleted custom category should disappear from category list"
    );
    const movedTab = await plugin.moveSettingsTab("plugins", "toolbar");
    assert.equal(movedTab, true, "moveSettingsTab should reorder settings navigation");
    assert.equal(plugin.dataStore.settingsTabOrder[0], "plugins");
    assert.equal(plugin.dataStore.settingsTabOrder[1], "toolbar");
    await plugin.refreshManagedPluginStatus();
    assert.ok(plugin.dataStore.managedPluginStatusCheckedAt > 0, "manual plugin status monitoring should store a check timestamp");

    const commandOk = await plugin.runManagedCommand("markdown-table-enhancer:insert-enhanced-table-template");
    assert.equal(commandOk, true, "management commands should call Obsidian command registry");
    assert.deepEqual(plugin.app.commands.executed, ["markdown-table-enhancer:insert-enhanced-table-template"]);
    const nativeColorCommandOk = await plugin.runManagedCommand("markdown-table-enhancer:insert-native-color-table-template");
    assert.equal(nativeColorCommandOk, true, "native color table command should be callable through the command registry");
    assert.deepEqual(
      plugin.app.commands.executed,
      ["markdown-table-enhancer:insert-enhanced-table-template", "markdown-table-enhancer:insert-native-color-table-template"]
    );

    const normalizedOrder = plugin.normalizeData({
      toolbarActionOrder: ["insertImage", "tableMenu", "insertImage", "unknown"],
    }).toolbarActionOrder;
    assert.deepEqual(normalizedOrder, ["insertImage", "tableMenu"], "toolbar order should keep only known unique toolbar actions");
  }

  {
    const colorCalls = [];
    const savedPaletteCalls = [];
    const deletedPaletteCalls = [];
    const pluginWithNativeColorSettings = createPlugin(PluginClass, {
      tableEnhancerPlugin: {
        getNativeColorSettingsForManager() {
          return {
            defaultPresetId: "green",
            presets: [
              {
                id: "blue",
                label: "蓝色 / 浅蓝",
                palette: {
                  header: "#9CC2E5",
                  headerText: "#111111",
                  baseRow: "#FFFFFF",
                  altRow: "#EAF3FF",
                  border: "#9FBAD8",
                },
              },
              {
                id: "green",
                label: "绿色 / 浅绿",
                palette: {
                  header: "#A9D18E",
                  headerText: "#111111",
	                  baseRow: "#FFFFFF",
	                  altRow: "#E2F0D9",
	                  border: "#9EAD93",
	                },
	              },
              {
                id: "saved_demo",
                label: "固定方案",
                saved: true,
                palette: {
                  header: "#A9D18E",
                  headerText: "#111111",
                  baseRow: "#FFFFFF",
                  altRow: "#E2F0D9",
                  border: "#9EAD93",
                },
              },
              {
                id: "custom",
                label: "自定义",
                palette: {
                  header: "#A9D18E",
                  headerText: "#111111",
                  baseRow: "#FFFFFF",
                  altRow: "#E2F0D9",
                  border: "#9EAD93",
                },
              },
            ],
            customPalette: {
              header: "#A9D18E",
              headerText: "#111111",
              baseRow: "#FFFFFF",
              altRow: "#E2F0D9",
              border: "#9EAD93",
            },
            savedPalettes: [
              {
                id: "saved_demo",
                label: "固定方案",
                saved: true,
                palette: {
                  header: "#A9D18E",
                  headerText: "#111111",
                  baseRow: "#FFFFFF",
                  altRow: "#E2F0D9",
                  border: "#9EAD93",
                },
              },
            ],
          };
        },
        updateNativeColorSettingsFromManager(input) {
          colorCalls.push(input);
          return Promise.resolve({ defaultPresetId: input.defaultPresetId ?? "green" });
        },
        saveCurrentNativeColorPaletteAsManager(label) {
          savedPaletteCalls.push(label);
          return Promise.resolve({ defaultPresetId: "saved_new" });
        },
        deleteNativeColorPaletteFromManager(id) {
          deletedPaletteCalls.push(id);
          return Promise.resolve({ defaultPresetId: "green" });
        },
      },
    });
    assert.equal(
      pluginWithNativeColorSettings.getNativeColorSettingsForManager().defaultPresetId,
      "green",
      "unified settings should read native table color settings from markdown-table-enhancer"
    );
    await pluginWithNativeColorSettings.updateNativeColorSettingsFromManager({
      defaultPresetId: "blue",
    });
    assert.deepEqual(
      colorCalls,
      [{ defaultPresetId: "blue" }],
      "unified settings should delegate native color updates to markdown-table-enhancer"
    );
    await pluginWithNativeColorSettings.saveCurrentNativeColorPaletteAsManager("我的固定色");
    assert.deepEqual(savedPaletteCalls, ["我的固定色"], "unified settings should delegate saved color schemes to markdown-table-enhancer");
    await pluginWithNativeColorSettings.deleteNativeColorPaletteFromManager("saved_demo");
    assert.deepEqual(deletedPaletteCalls, ["saved_demo"], "unified settings should delegate saved color deletion to markdown-table-enhancer");
  }

  {
    assert.deepEqual(
      plugin.getStableQuickActionGroupsForContext("paragraph").map((group) => ({
        label: group.label,
        items: group.items.map((item) => item.label),
      })),
      [
        { label: "排版", items: ["H1", "H2", "H3", "H4", "斜体", "删除线", "•", "1.", "☑", "{ }", "❝", "高", "命令", "—"] },
        { label: "插入内容", items: ["表格", "高亮块", "图片", "文件", "模板库", "折叠", "日期", "链接"] },
      ],
      "quick actions should match the Feishu-like layout and insert groups"
    );
    assert.deepEqual(
      plugin.getStableQuickActionsForContext("paragraph").map((item) => item.label),
      ["H1", "H2", "H3", "H4", "斜体", "删除线", "•", "1.", "☑", "{ }", "❝", "高", "命令", "—", "表格", "高亮块", "图片", "文件", "模板库", "折叠", "日期", "链接"],
      "stable quick actions should stay limited to the approved Feishu-like basic/common whitelist"
    );
    assert.equal(plugin.getActionShortcutHint("italic"), "*斜体*", "italic action should expose a markdown hint");
    assert.equal(plugin.getActionShortcutHint("strikethrough"), "~~删除线~~", "strikethrough action should expose a markdown hint");
    assert.equal(plugin.getActionShortcutHint("commandPalette"), "⌘P", "command palette should expose its keyboard shortcut hint");
    assert.deepEqual(
      plugin.getStableQuickActionGroupsForContext("table"),
      [],
      "table blocks should not reuse the ordinary block quick-action toolbar"
    );
    assert.deepEqual(plugin.getStableStyleActionGroupsForContext("paragraph"), [], "stable toolbar should not expose style groups in phase one");
    assert.deepEqual(
      plugin.getStableUtilityActionGroups().map((group) => ({
        label: group.label,
        items: group.items.map((item) => item.label),
      })),
      [],
      "utility actions should be removed from the T menu"
    );
    assert.deepEqual(
      plugin.getStableUtilityActions().map((item) => item.label),
      [],
      "stable utility action list should be empty after removing copy/export"
    );
    assert.deepEqual(plugin.getStableStyleActionsForContext("paragraph"), [], "stable style action list should be empty in phase one");
    assert.deepEqual(plugin.getStableColorActionsForContext("paragraph"), [], "stable color actions should stay hidden in phase one");
    assert.deepEqual(
      plugin.getExperimentalStyleActionGroupsForContext("paragraph"),
      [],
      "experimental style actions should be completely hidden when the gate is off"
    );
    assert.deepEqual(
      plugin.getExperimentalColorActionsForContext("paragraph"),
      [],
      "experimental color actions should be completely hidden when the gate is off"
    );

    let saved = null;
    plugin.saveData = async (data) => {
      saved = data;
    };
    await plugin.moveToolbarAction("insertImage", "tableMenu");
    assert.deepEqual(
      plugin.getStableQuickActionGroupsForContext("paragraph")[1].items.map((item) => item.label),
      ["图片", "表格", "高亮块", "文件", "模板库", "折叠", "日期", "链接"],
      "custom toolbar order should reorder buttons inside the insert group without changing actions"
    );
    assert.ok(saved.toolbarActionOrder.indexOf("insertImage") < saved.toolbarActionOrder.indexOf("tableMenu"), "toolbar order should persist after sorting");
    await plugin.moveToolbarAction("insertImage", "heading1");
    assert.deepEqual(
      plugin.getStableQuickActionGroupsForContext("paragraph")[0].items.map((item) => item.label),
      ["H1", "H2", "H3", "H4", "斜体", "删除线", "•", "1.", "☑", "{ }", "❝", "高", "命令", "—"],
      "toolbar sorting should not move buttons across stable sections"
    );
    await plugin.resetToolbarActionOrder();
    assert.deepEqual(plugin.dataStore.toolbarActionOrder, [], "reset should clear custom toolbar sorting");
  }

  {
    assert.deepEqual(
      experimentalPlugin.getStableQuickActionsForContext("paragraph").map((item) => item.label),
      ["H1", "H2", "H3", "H4", "斜体", "删除线", "•", "1.", "☑", "{ }", "❝", "高", "命令", "—", "表格", "高亮块", "图片", "文件", "模板库", "折叠", "日期", "链接"],
      "turning on experimental styles must not change the stable quick-action whitelist"
    );
    assert.deepEqual(
      experimentalPlugin.getStableUtilityActions().map((item) => item.label),
      [],
      "turning on experimental styles must not change the stable utility whitelist"
    );
    assert.deepEqual(experimentalPlugin.getStableStyleActionsForContext("paragraph"), [], "stable style whitelist should remain empty in phase one");
    assert.deepEqual(experimentalPlugin.getStableColorActionsForContext("paragraph"), [], "stable color whitelist should remain empty in phase one");
    assert.deepEqual(
      experimentalPlugin.getExperimentalStyleActionGroupsForContext("paragraph").map((group) => ({
        label: group.label,
        items: group.items.map((item) => item.label),
      })),
      [],
      "turning on the experiment should not duplicate stable ordinary-block style controls"
    );
    assert.deepEqual(
      experimentalPlugin.getExperimentalColorActionsForContext("paragraph").map((item) => item.label),
      [],
      "turning on the experiment should not duplicate stable color controls in the experimental toolbar"
    );
    assert.deepEqual(
      experimentalPlugin.getExperimentalStyleActionGroupsForContext("quote"),
      [],
      "non-transformable ordinary blocks should still not expose experimental style controls"
    );
    assert.equal(plugin.getActionShortcutHint("heading1"), "#", "heading buttons should expose native markdown hints");
    assert.equal(plugin.getActionShortcutHint("calloutNote"), "[!note]", "callout buttons should expose concise markdown hints");
    assert.equal(plugin.getActionShortcutHint("tableMenu"), null, "menu buttons without a native markdown form should not show fake hints");
    assert.equal(plugin.getActionDisplayTitle("highlightText", "高亮"), "高亮 ==", "tooltips should append markdown syntax for supported actions");
    assert.equal(plugin.getActionDisplayTitle("tableMenu", "表格"), "插入表格", "tooltips should stay unchanged for actions without markdown syntax");
  }

  {
    const handlers = {};
    const button = {
      addEventListener(type, handler) {
        handlers[type] = handler;
      },
    };
    const previousWindow = global.window;
    const originalRunAction = plugin.runAction;
    global.window = {
      setTimeout,
    };

    const firedActions = [];
    plugin.runAction = async (action) => {
      firedActions.push(action);
    };

    plugin.bindActionTrigger(button, "copyMarkdown");

    handlers.pointerdown({
      preventDefault() {},
      stopPropagation() {},
    });
    assert.deepEqual(
      firedActions,
      ["copyMarkdown"],
      "pointerdown should execute the toolbar action immediately before focus changes"
    );

    handlers.click({
      preventDefault() {},
      stopPropagation() {},
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(
      firedActions.length,
      1,
      "click immediately following pointerdown should not double-run the toolbar action"
    );

    handlers.keydown({
      key: "Enter",
      preventDefault() {},
      stopPropagation() {},
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.deepEqual(
      firedActions,
      ["copyMarkdown", "copyMarkdown"],
      "keyboard activation should still execute the toolbar action once focus is already on the button"
    );

    plugin.runAction = originalRunAction;
    global.window = previousWindow;
  }

  {
    const pluginForSubmenu = createPlugin(PluginClass);
    let hideCount = 0;
    pluginForSubmenu.hideToolbar = () => {
      hideCount += 1;
    };
    const submenuTarget = {
      closest(selector) {
        return selector.includes(".fdtb-submenu") ? {} : null;
      },
    };
    pluginForSubmenu.handlePointerDown({ target: submenuTarget });
    pluginForSubmenu.handleEditorClick({ target: submenuTarget });
    assert.equal(hideCount, 0, "table size submenu interactions must not be closed by global editor handlers");
  }

  {
    const pluginForSubmenuHover = createPlugin(PluginClass);
    let clearCount = 0;
    let scheduleCount = 0;
    pluginForSubmenuHover.clearHideTimer = () => {
      clearCount += 1;
    };
    pluginForSubmenuHover.scheduleHideToolbar = () => {
      scheduleCount += 1;
    };
    const submenuTarget = {
      closest(selector) {
        return selector.includes(".fdtb-submenu") ? {} : null;
      },
    };
    pluginForSubmenuHover.handlePointerMove({ target: submenuTarget });
    assert.equal(clearCount, 1, "moving inside the template submenu should keep the menu open");
    assert.equal(scheduleCount, 0, "moving inside the template submenu must not schedule auto-hide");
  }

  {
    const pluginForImagePreview = createPlugin(PluginClass);
    let previewImage = null;
    pluginForImagePreview.showNativeTableImagePreview = (image) => {
      previewImage = image;
    };
    const nativeImage = {
      closest(selector) {
        if (selector === "img") return this;
        if (selector === "table") return { classList: { contains: () => false } };
        return null;
      },
    };
    const nativeEvent = {
      target: nativeImage,
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {
        this.propagationStopped = true;
      },
    };
    pluginForImagePreview.handleDocumentDoubleClick(nativeEvent);
    assert.equal(previewImage, nativeImage, "native table image double click should open the image preview");
    assert.equal(nativeEvent.defaultPrevented, true);
    assert.equal(nativeEvent.propagationStopped, true);

    previewImage = null;
    const nativeLayoutImage = {
      closest(selector) {
        if (selector === "img") return this;
        if (selector === "table") {
          return {
            classList: {
              contains(className) {
                return className === "mdtp-table-native-layout";
              },
            },
          };
        }
        return null;
      },
    };
    pluginForImagePreview.handleDocumentDoubleClick({
      target: nativeLayoutImage,
      preventDefault() {},
      stopPropagation() {},
    });
    assert.equal(previewImage, nativeLayoutImage, "native-layout table image double click should open the image preview");

    previewImage = null;
    const enhancedImage = {
      closest(selector) {
        if (selector === "img") return this;
        if (selector === "table") {
          return {
            classList: {
              contains(className) {
                return className === "mdtp-table-enhanced";
              },
            },
          };
        }
        return null;
      },
    };
    pluginForImagePreview.handleDocumentDoubleClick({
      target: enhancedImage,
      preventDefault() {
        throw new Error("enhanced table image preview should not prevent default");
      },
      stopPropagation() {
        throw new Error("enhanced table image preview should not stop propagation");
      },
    });
    assert.equal(previewImage, null, "enhanced table images should not use the native table image preview");
  }

  {
    const editor = new FakeEditor([
      "正文第一行",
      "",
      "正文第二行",
    ].join("\n"));
    const context = createContext(plugin, editor, 0);
    plugin.insertMarkdownTable(context, 3, 2);
    assert.equal(
      editor.toString(),
      [
        "正文第一行",
        "",
        "| 步骤 | 自检 |",
        "| --- | --- |",
        "|  |  |",
        "|  |  |",
        "",
        "正文第二行",
      ].join("\n"),
      "table grid insertion should create a markdown table below the current block"
    );
  }

  {
    const editor = new FakeEditor([
      "## 标题",
      "",
      "正文第一行",
      "正文第二行",
      "",
      "尾部",
    ].join("\n"));
    plugin.moveBlock(createContext(plugin, editor, 0), "down");
    assert.equal(
      editor.toString(),
      [
        "正文第一行",
        "正文第二行",
        "",
        "## 标题",
        "",
        "尾部",
      ].join("\n"),
      "heading should move below the next paragraph block"
    );
  }

  {
    const editor = new FakeEditor([
      "正文第一行",
      "正文第二行",
      "## 标题",
      "",
      "尾部",
    ].join("\n"));
    plugin.moveBlock(createContext(plugin, editor, 2), "up");
    assert.equal(
      editor.toString(),
      [
        "## 标题",
        "正文第一行",
        "正文第二行",
        "",
        "尾部",
      ].join("\n"),
      "heading should move above the previous paragraph block"
    );
  }

  {
    const editor = new FakeEditor([
      "%% fdtb-style:{\"color\":\"yellow\"} %%",
      "## 标题",
      "",
      "正文",
    ].join("\n"));
    plugin.convertBlockToDivider(createContext(plugin, editor, 1));
    assert.equal(
      editor.toString(),
      [
        "---",
        "",
        "正文",
      ].join("\n"),
      "divider conversion should replace the styled block and remove its marker"
    );
  }

  {
    const editor = new FakeEditor([
      "## 标题",
      "",
      "正文",
    ].join("\n"));
    let copied = "";
    plugin.writeTextToClipboard = async (text) => {
      copied = text;
    };
    await plugin.copyBlockMarkdown(createContext(plugin, editor, 0));
    assert.equal(copied, "## 标题", "copy block should copy only the current block text");
  }

  {
    const editor = new FakeEditor([
      "## 标题",
      "",
      "正文",
    ].join("\n"));
    plugin.duplicateBelow(createContext(plugin, editor, 0));
    assert.equal(
      editor.toString(),
      [
        "## 标题",
        "## 标题",
        "",
        "正文",
      ].join("\n"),
      "duplicate below should insert a second copy directly under the current block"
    );
  }

  {
    const editor = new FakeEditor([
      "## 标题",
      "",
      "正文",
    ].join("\n"));
    plugin.insertBelow(createContext(plugin, editor, 0));
    assert.equal(
      editor.toString(),
      [
        "## 标题",
        "",
        "",
        "正文",
      ].join("\n"),
      "insert below should create a blank line below the current block"
    );
  }

  {
    const editor = new FakeEditor([
      "这里是一条提醒",
      "",
      "正文",
    ].join("\n"));
    plugin.convertBlockToCallout(createContext(plugin, editor, 0), false);
    assert.equal(
      editor.toString(),
      [
        "> [!note] 高亮",
        "> 这里是一条提醒",
        "",
        "正文",
      ].join("\n"),
      "note callout should convert the current block into an Obsidian callout"
    );
  }

  {
    const editor = new FakeEditor([
      "可折叠内容",
      "",
      "正文",
    ].join("\n"));
    plugin.convertBlockToCallout(createContext(plugin, editor, 0), true);
    assert.equal(
      editor.toString(),
      [
        "> [!note]- 折叠",
        "> 可折叠内容",
        "",
        "正文",
      ].join("\n"),
      "fold callout should create a collapsed Obsidian callout"
    );
  }

  {
    const editor = new FakeEditor([
      "今天计划",
      "正文",
    ].join("\n"));
    plugin.formatLocalDate = () => "2026-04-24";
    plugin.insertDateBelow(createContext(plugin, editor, 0));
    assert.equal(
      editor.toString(),
      [
        "今天计划",
        "正文",
        "2026-04-24",
      ].join("\n"),
      "date insertion should insert a date below the current block"
    );
  }

  {
    const editor = new FakeEditor("当前行");
    editor.getCursor = () => ({ line: 0, ch: 3 });
    plugin.insertLinkAtCursor(createContext(plugin, editor, 0));
    assert.equal(editor.toString(), "当前行[]()", "link insertion should insert an empty Markdown link at the cursor");
    assert.deepEqual(editor.cursor, { line: 0, ch: 4 }, "link insertion should place the cursor inside the link text");
  }

  {
    const editor = new FakeEditor("这一行需要高亮");
    plugin.toggleMarkdownHighlight(createContext(plugin, editor, 0));
    assert.equal(editor.toString(), "==这一行需要高亮==", "highlight should wrap the current line when no text is selected");
    plugin.toggleMarkdownHighlight(createContext(plugin, editor, 0));
    assert.equal(editor.toString(), "这一行需要高亮", "highlight should toggle off an already highlighted line");
  }

  {
    const editor = new FakeEditor("只高亮几个字");
    editor.setSelection({ line: 0, ch: 1 }, { line: 0, ch: 3 });
    plugin.toggleMarkdownHighlight(createContext(plugin, editor, 0));
    assert.equal(editor.toString(), "只==高亮==几个字", "highlight should wrap selected text only");
  }

  {
    const editor = new FakeEditor("| 人物 | 问题 | 原内容 |");
    plugin.toggleMarkdownHighlight({ ...createContext(plugin, editor, 0), kind: "table" });
    assert.equal(
      editor.toString(),
      "| ==人物== | ==问题== | ==原内容== |",
      "highlight on a table row should preserve markdown table pipes and wrap cell content"
    );
  }

  {
    const editor = new FakeEditor([
      "第一段",
      "第二段",
      "第三段",
    ].join("\n"));
    editor.setSelection({ line: 0, ch: 0 }, { line: 2, ch: 3 });
    plugin.applyLineTransform(createContext(plugin, editor, 0), "numbered");
    assert.equal(
      editor.toString(),
      [
        "1. 第一段",
        "2. 第二段",
        "3. 第三段",
      ].join("\n"),
      "numbered list should apply to every selected paragraph"
    );
  }

  {
    const editor = new FakeEditor([
      "第一段",
      "",
      "第二段",
      "第三段",
    ].join("\n"));
    editor.setSelection({ line: 0, ch: 0 }, { line: 3, ch: 3 });
    plugin.applyLineTransform(createContext(plugin, editor, 0), "bullet");
    assert.equal(
      editor.toString(),
      [
        "- 第一段",
        "",
        "- 第二段",
        "- 第三段",
      ].join("\n"),
      "bullet list should apply to selected non-empty paragraphs and preserve blank lines"
    );
  }

  {
    const editor = new FakeEditor([
      "第一段",
      "第二段",
      "第三段",
    ].join("\n"));
    editor.setSelection({ line: 0, ch: 0 }, { line: 3, ch: 0 });
    plugin.applyLineTransform(createContext(plugin, editor, 0), "heading2");
    assert.equal(
      editor.toString(),
      [
        "## 第一段",
        "## 第二段",
        "## 第三段",
      ].join("\n"),
      "formatting should exclude a trailing unselected line when the selection ends at column zero"
    );
  }

  {
    const editor = new FakeEditor([
      "第一段",
      "第二段",
    ].join("\n"));
    editor.setSelection({ line: 0, ch: 0 }, { line: 1, ch: 3 });
    plugin.wrapCurrentBlockWithCodeFence(createContext(plugin, editor, 0));
    assert.equal(
      editor.toString(),
      [
        "```",
        "第一段",
        "第二段",
        "```",
      ].join("\n"),
      "code block should wrap the full selected paragraph range"
    );
  }

  {
    const editor = new FakeEditor([
      "- 父项",
      "  - 子项A",
      "  - 子项B",
      "- 同级项",
    ].join("\n"));
    plugin.moveBlock(createContext(plugin, editor, 0), "down");
    assert.equal(
      editor.toString(),
      [
        "- 同级项",
        "- 父项",
        "  - 子项A",
        "  - 子项B",
      ].join("\n"),
      "nested list item should move together with its children"
    );
  }

  {
    const editor = new FakeEditor([
      "> [!note]",
      "> 第一行",
      "> 第二行",
      "",
      "正文",
    ].join("\n"));
    let copied = "";
    plugin.writeTextToClipboard = async (text) => {
      copied = text;
    };
    await plugin.copyBlockMarkdown(createContext(plugin, editor, 1));
    assert.equal(
      copied,
      [
        "> [!note]",
        "> 第一行",
        "> 第二行",
      ].join("\n"),
      "callout block copy should include the full contiguous quoted block"
    );
  }

  {
    const editor = new FakeEditor([
      "> [!note]",
      "> 第一行",
      "> 第二行",
      "",
      "正文",
    ].join("\n"));
    plugin.moveBlock(createContext(plugin, editor, 1), "down");
    assert.equal(
      editor.toString(),
      [
        "正文",
        "",
        "> [!note]",
        "> 第一行",
        "> 第二行",
      ].join("\n"),
      "callout block should move as one block"
    );
  }

  {
    const editor = new FakeEditor([
      "```ts",
      "const answer = 42;",
      "console.log(answer);",
      "```",
      "",
      "正文",
    ].join("\n"));
    let copied = "";
    plugin.writeTextToClipboard = async (text) => {
      copied = text;
    };
    await plugin.copyBlockMarkdown(createContext(plugin, editor, 1));
    assert.equal(
      copied,
      [
        "```ts",
        "const answer = 42;",
        "console.log(answer);",
        "```",
      ].join("\n"),
      "code fence copy should include the full fenced block"
    );
  }

  {
    const editor = new FakeEditor([
      "```ts",
      "const answer = 42;",
      "console.log(answer);",
      "```",
      "",
      "正文",
    ].join("\n"));
    plugin.moveBlock(createContext(plugin, editor, 1), "down");
    assert.equal(
      editor.toString(),
      [
        "正文",
        "",
        "```ts",
        "const answer = 42;",
        "console.log(answer);",
        "```",
      ].join("\n"),
      "code fence should move as one block"
    );
  }

  {
    const editor = new FakeEditor([
      "| 列1 | 列2 |",
      "| --- | --- |",
      "| A | B |",
      "",
      "正文",
    ].join("\n"));
    plugin.duplicateBelow(createContext(plugin, editor, 1));
    assert.equal(
      editor.toString(),
      [
        "| 列1 | 列2 |",
        "| --- | --- |",
        "| A | B |",
        "| 列1 | 列2 |",
        "| --- | --- |",
        "| A | B |",
        "",
        "正文",
      ].join("\n"),
      "table block duplicate should preserve the full table block"
    );
  }

  {
    const editor = new FakeEditor([
      "| 列1 | 列2 |",
      "| --- | --- |",
      "| A | B |",
      "",
      "正文",
    ].join("\n"));
    plugin.moveBlock(createContext(plugin, editor, 1), "down");
    assert.equal(
      editor.toString(),
      [
        "正文",
        "",
        "| 列1 | 列2 |",
        "| --- | --- |",
        "| A | B |",
      ].join("\n"),
      "table block should move as one block"
    );
  }

  {
    const editor = new FakeEditor([
      "| 列1 | 列2 |",
      "| --- | --- |",
      "| A | B |",
      "",
      "正文",
    ].join("\n"));
    let copied = "";
    plugin.writeTextToClipboard = async (text) => {
      copied = text;
    };
    await plugin.copyBlockMarkdown(createContext(plugin, editor, 1));
    assert.equal(
      copied,
      [
        "",
        "| 列1 | 列2 |",
        "| --- | --- |",
        "| A | B |",
        "",
      ].join("\n"),
      "table block copy should wrap markdown table with blank lines for normal-body paste"
    );
  }

  {
    const fileContents = new Map([
      [".模板库/默认排序靠后.md", ["---", "menuOrder: 9", "---", "", "默认排序靠后"].join("\n")],
      [".模板库/默认排序靠前.md", ["---", "menuOrder: 2", "---", "", "默认排序靠前"].join("\n")],
    ]);
    const pluginWithTemplates = createPlugin(PluginClass, { fileContents });
    pluginWithTemplates.app.vault.getMarkdownFiles = () => [
      { path: ".模板库/默认排序靠后.md", basename: "默认排序靠后", stat: { mtime: 1 } },
      { path: ".模板库/默认排序靠前.md", basename: "默认排序靠前", stat: { mtime: 2 } },
    ];
    const descriptors = await pluginWithTemplates.getTemplateDescriptors();
    assert.deepEqual(
      descriptors.map((item) => item.title),
      ["默认排序靠前", "默认排序靠后"],
      "template descriptors should respect menuOrder from file content when metadata cache is unavailable"
    );
  }

  {
    const fileContents = new Map([
      [
        ".模板库/周计划.md",
        [
          '%% mdtp-template:{"version":1,"tables":{}} %%',
          "%% mdtp:tbl_template_source %%",
          "| 时间 | 类型 |",
          "| --- | --- |",
        ].join("\n"),
      ],
    ]);
    const pluginWithTemplateMetadata = createPlugin(PluginClass, { fileContents });
    const descriptors = await pluginWithTemplateMetadata.getTemplateDescriptors();
    assert.equal(
      descriptors[0].excerpt,
      "| 时间 | 类型 |",
      "template menu previews should hide enhanced-table metadata lines"
    );
  }

  {
    const editor = new FakeEditor("| 字段 | 内容 |\n| --- | --- |");
    const fileContents = new Map([
      [".模板库/事件复盘1.0.md", "==通用事件复盘模板==1.0"],
      [".模板库/未使用.md", "不应该显示"],
    ]);
    const pluginForDetachedTemplateMenu = createPlugin(PluginClass, { fileContents });
    pluginForDetachedTemplateMenu.dataStore.recentTemplatePaths = [".模板库/事件复盘1.0.md"];
    const tableContext = { ...createContext(pluginForDetachedTemplateMenu, editor, 0), kind: "table" };
    let hostContext = null;
    let menuLabels = null;
    let menuItems = null;
    let menuDescriptions = null;
    pluginForDetachedTemplateMenu.ensureTemplateMenuHost = (context) => {
      hostContext = context;
      pluginForDetachedTemplateMenu.popoverEl = { getBoundingClientRect: () => ({ right: 10, top: 20 }) };
      return true;
    };
    pluginForDetachedTemplateMenu.showSecondaryMenu = (title, items) => {
      menuLabels = items.map((item) => item.label);
      menuDescriptions = items.map((item) => item.description);
      menuItems = items;
    };
    await pluginForDetachedTemplateMenu.showTemplateMenu(tableContext);
    assert.equal(hostContext, tableContext, "template menu should create an anchor when opened from a table context menu");
    assert.deepEqual(
      menuLabels,
      ["保存当前块为模板", "未分组", "事件复盘1.0", "未使用", "模板库"],
      "template menu should group root templates under 未分组"
    );
    assert.deepEqual(
      menuDescriptions,
      [undefined, undefined, undefined, undefined, undefined],
      "template menu should show only template names without preview text"
    );
    let openedSharedLibrary = 0;
    pluginForDetachedTemplateMenu.app.plugins.plugins["markdown-table-enhancer"].openTemplateLibraryModal = () => {
      openedSharedLibrary += 1;
    };
    await menuItems.find((item) => item.label === "模板库").onClick();
    assert.equal(openedSharedLibrary, 1, "template library action should open the shared template library modal instead of a separate index page");
  }

  {
    const editor = new FakeEditor("正文");
    const fileContents = new Map(
      Array.from({ length: 9 }, (_, index) => {
        const n = index + 1;
        return [`.模板库/最近${n}.md`, `模板 ${n}`];
      })
    );
    const pluginForRecentTemplateLimit = createPlugin(PluginClass, { fileContents });
    pluginForRecentTemplateLimit.dataStore.recentTemplatePaths = Array.from(
      { length: 9 },
      (_, index) => `.模板库/最近${index + 1}.md`
    );
    pluginForRecentTemplateLimit.ensureTemplateMenuHost = () => {
      pluginForRecentTemplateLimit.popoverEl = { getBoundingClientRect: () => ({ right: 10, top: 20 }) };
      return true;
    };
    let menuLabels = [];
    pluginForRecentTemplateLimit.showSecondaryMenu = (_title, items) => {
      menuLabels = items.map((item) => item.label);
    };
    await pluginForRecentTemplateLimit.showTemplateMenu(createContext(pluginForRecentTemplateLimit, editor, 0));
    assert.deepEqual(
      menuLabels,
      [
        "保存当前块为模板",
        "未分组",
        "最近1",
        "最近2",
        "最近3",
        "最近4",
        "最近5",
        "最近6",
        "最近7",
        "最近8",
        "最近9",
        "模板库",
      ],
      "grouped template menu should list all root templates without the old 8-item quick-list cap"
    );
  }

  {
    const editor = new FakeEditor("正文");
    const fileContents = new Map([
      [".模板库/事件复盘1.0.md", "事件复盘"],
      [".模板库/周计划.md", "周计划"],
      [".模板库/六问法.md", "六问法"],
      [".模板库/解决问题.md", "解决问题"],
    ]);
    const pluginForSharedTemplateBackfill = createPlugin(PluginClass, { fileContents });
    pluginForSharedTemplateBackfill.dataStore.recentTemplatePaths = [
      ".模板库/事件复盘1.0.md",
      ".模板库/周计划.md",
    ];
    pluginForSharedTemplateBackfill.app.vault.getMarkdownFiles = () => [
      { path: ".模板库/事件复盘1.0.md", basename: "事件复盘1.0", stat: { mtime: 10 } },
      { path: ".模板库/周计划.md", basename: "周计划", stat: { mtime: 20 } },
      { path: ".模板库/六问法.md", basename: "六问法", stat: { mtime: 40 } },
      { path: ".模板库/解决问题.md", basename: "解决问题", stat: { mtime: 30 } },
    ];
    pluginForSharedTemplateBackfill.ensureTemplateMenuHost = () => {
      pluginForSharedTemplateBackfill.popoverEl = { getBoundingClientRect: () => ({ right: 10, top: 20 }) };
      return true;
    };
    let menuLabels = [];
    pluginForSharedTemplateBackfill.showSecondaryMenu = (_title, items) => {
      menuLabels = items.map((item) => item.label);
    };
    await pluginForSharedTemplateBackfill.showTemplateMenu(createContext(pluginForSharedTemplateBackfill, editor, 0));
    assert.deepEqual(
      menuLabels,
      ["保存当前块为模板", "未分组", "事件复盘1.0", "周计划", "六问法", "解决问题", "模板库"],
      "grouped template menu should include all shared-library templates under folder headers"
    );
  }

  {
    const fileContents = new Map([
      [".模板库/复盘/事件.md", "事件复盘"],
      [".模板库/周计划.md", "周计划"],
    ]);
    const pluginWithFolders = createPlugin(PluginClass, { fileContents });
    pluginWithFolders.app.vault.getMarkdownFiles = () => [
      { path: ".模板库/复盘/事件.md", basename: "事件", stat: { mtime: 10 } },
      { path: ".模板库/周计划.md", basename: "周计划", stat: { mtime: 20 } },
    ];
    pluginWithFolders.ensureTemplateMenuHost = () => {
      pluginWithFolders.popoverEl = { getBoundingClientRect: () => ({ right: 10, top: 20 }) };
      return true;
    };
    let menuLabels = [];
    pluginWithFolders.showSecondaryMenu = (_title, items) => {
      menuLabels = items.map((item) => item.label);
    };
    await pluginWithFolders.showTemplateMenu(createContext(pluginWithFolders, new FakeEditor("正文"), 0));
    assert.deepEqual(
      menuLabels,
      ["保存当前块为模板", "未分组", "周计划", "复盘", "事件", "模板库"],
      "template menu should expose nested folder groups for T toolbar"
    );
  }

  {
    const pluginForTemplateGroups = createPlugin(PluginClass, {
      fileContents: new Map([[".模板库/六问法.md", "六问法"]]),
    });
    pluginForTemplateGroups.app.vault.getMarkdownFiles = () => [
      { path: ".模板库/六问法.md", basename: "六问法", stat: { mtime: 1 } },
    ];
    const created = await pluginForTemplateGroups.createTemplateSubfolder("自我管理");
    assert.equal(created, true, "createTemplateSubfolder should succeed");
    const tree = await pluginForTemplateGroups.buildFullTemplateTree();
    assert.equal(tree.folders.has("自我管理"), true, "empty template group should appear in full tree");
    const moveOptions = await pluginForTemplateGroups.getTemplateGroupMoveOptions();
    assert.equal(
      moveOptions.some((item) => item.value === "自我管理"),
      true,
      "move options should include newly created empty group"
    );
    pluginForTemplateGroups.dataStore.recentTemplatePaths = [".模板库/六问法.md"];
    pluginForTemplateGroups.app.vault.getAbstractFileByPath = () => null;
    const moved = await pluginForTemplateGroups.moveTemplateToGroup(".模板库/六问法.md", "自我管理");
    assert.equal(moved, true, "moveTemplateToGroup should relocate template even when vault index hides .模板库");
    assert.equal(
      await pluginForTemplateGroups.app.vault.adapter.exists(".模板库/自我管理/六问法.md"),
      true,
      "moved template should exist under target group"
    );
    assert.equal(
      pluginForTemplateGroups.dataStore.recentTemplatePaths.includes(".模板库/自我管理/六问法.md"),
      true,
      "recent template paths should follow moved template"
    );
    const renamed = await pluginForTemplateGroups.renameTemplateGroup("自我管理", "复盘");
    assert.equal(renamed, true, "renameTemplateGroup should rename vault folder");
    assert.equal(
      await pluginForTemplateGroups.app.vault.adapter.exists(".模板库/复盘/六问法.md"),
      true,
      "renamed group should keep nested templates"
    );
    await pluginForTemplateGroups.setTemplateUngroupedLabel("根目录");
    assert.equal(pluginForTemplateGroups.getTemplateUngroupedLabel(), "根目录");
    const menuItems = await pluginForTemplateGroups.buildTemplateMenuItems(
      createContext(pluginForTemplateGroups, new FakeEditor("正文"), 0)
    );
    assert.equal(
      menuItems.some((item) => item.label === "复盘（空）"),
      false,
      "menu should not mark renamed group as empty after move"
    );
    assert.equal(
      menuItems.some((item) => item.label === "根目录" && item.header),
      true,
      "menu should use custom ungrouped label"
    );

    const originalConfirm = global.confirm;
    global.confirm = () => true;
    try {
      const deletedWithTemplates = await pluginForTemplateGroups.deleteTemplateGroup("复盘");
      assert.equal(deletedWithTemplates, true, "deleteTemplateGroup should remove folder and move templates to root");
      assert.equal(
        await pluginForTemplateGroups.app.vault.adapter.exists(".模板库/复盘"),
        false,
        "deleted group folder should be removed"
      );
      assert.equal(
        await pluginForTemplateGroups.app.vault.adapter.exists(".模板库/六问法.md"),
        true,
        "templates from deleted group should move to root"
      );

      await pluginForTemplateGroups.createTemplateSubfolder("临时分组");
      const deletedEmpty = await pluginForTemplateGroups.deleteTemplateGroup("临时分组");
      assert.equal(deletedEmpty, true, "deleteTemplateGroup should remove empty folder");
      assert.equal(
        await pluginForTemplateGroups.app.vault.adapter.exists(".模板库/临时分组"),
        false,
        "empty deleted group folder should be removed"
      );

      await pluginForTemplateGroups.setTemplateUngroupedLabel("默认分组");
      const resetUngrouped = await pluginForTemplateGroups.deleteUngroupedTemplateGroup();
      assert.equal(resetUngrouped, true, "deleteUngroupedTemplateGroup should reset custom empty label");
      assert.equal(pluginForTemplateGroups.getTemplateUngroupedLabel(), "未分组");
    } finally {
      global.confirm = originalConfirm;
    }
  }

  {
    const pluginForTrash = createPlugin(PluginClass, {
      fileContents: new Map([
        [".模板库/思维力/5why.md", "5why content"],
        [".模板库/六问法.md", "six questions"],
      ]),
    });
    pluginForTrash.dataStore.templateFolderPath = ".模板库";
    pluginForTrash.app.vault.getMarkdownFiles = () => [
      { path: ".模板库/思维力/5why.md", basename: "5why", stat: { mtime: 10 } },
      { path: ".模板库/六问法.md", basename: "六问法", stat: { mtime: 20 } },
    ];
    pluginForTrash.app.vault.getAbstractFileByPath = () => null;

    const originalConfirm = global.confirm;
    global.confirm = () => true;
    try {
      const deleted = await pluginForTrash.deleteTemplateAtPath(".模板库/思维力/5why.md");
      assert.equal(deleted, true, "deleteTemplateAtPath should move template to trash");
      assert.equal(
        await pluginForTrash.app.vault.adapter.exists(".模板库/思维力/5why.md"),
        false,
        "original template path should no longer exist"
      );
      assert.equal(
        await pluginForTrash.app.vault.adapter.exists(".模板库/.回收站/思维力/5why.md"),
        true,
        "deleted template should exist under trash folder"
      );

      const descriptors = await pluginForTrash.getTemplateDescriptors();
      assert.equal(
        descriptors.some((item) => item.path.includes("5why")),
        false,
        "trashed template should not appear in active library"
      );

      const trashed = await pluginForTrash.listTrashedTemplates();
      assert.equal(trashed.length, 1, "trash list should contain one item");
      assert.equal(trashed[0].title, "5why");
      assert.equal(trashed[0].originalGroup, "思维力");

      const restored = await pluginForTrash.restoreTemplateFromTrash(trashed[0].trashPath);
      assert.equal(restored, true, "restoreTemplateFromTrash should succeed");
      assert.equal(
        await pluginForTrash.app.vault.adapter.exists(".模板库/思维力/5why.md"),
        true,
        "restored template should return to original group path"
      );

      await pluginForTrash.deleteTemplateAtPath(".模板库/六问法.md");
      const trashedAgain = await pluginForTrash.listTrashedTemplates();
      assert.equal(trashedAgain.length, 1, "trash should contain purged candidate");
      const purged = await pluginForTrash.purgeTrashedTemplate(trashedAgain[0].trashPath);
      assert.equal(purged, true, "purgeTrashedTemplate should permanently delete");
      assert.equal(
        await pluginForTrash.app.vault.adapter.exists(trashedAgain[0].trashPath),
        false,
        "purged template should be removed from trash"
      );
    } finally {
      global.confirm = originalConfirm;
    }
  }

  {
    const editor = new FakeEditor(["正文", "", "尾部"].join("\n"));
    let received = null;
    const tableEnhancerPlugin = {
      dataStore: { experimentalFeatureGate: false },
      async insertEnhancedTemplateContentAtCursor(content, position) {
        received = { content, position };
        editor.replaceRange("ENHANCED\n", position);
        return true;
      },
    };
    const fileContents = new Map([
      [
        ".模板库/周计划.md",
        [
          '%% mdtp-template:{"version":1,"tables":{}} %%',
          "%% mdtp:tbl_template_source %%",
          "| 时间 | 类型 |",
          "| --- | --- |",
        ].join("\n"),
      ],
    ]);
    const pluginWithEnhancerInsert = createPlugin(PluginClass, { fileContents, tableEnhancerPlugin });
    const ok = await pluginWithEnhancerInsert.insertTemplateIntoContext(createContext(pluginWithEnhancerInsert, editor, 0), ".模板库/周计划.md");
    assert.equal(ok, true, "template insertion should succeed through table enhancer bridge");
    assert.equal(received.content.includes("mdtp-template"), true, "enhanced metadata should be handed to table enhancer, not stripped first");
    assert.deepEqual(received.position, { line: 1, ch: 0 }, "table enhancer bridge should preserve the toolbar insertion location");
    assert.equal(editor.toString(), ["正文", "ENHANCED", "", "尾部"].join("\n"), "table enhancer bridge should own the actual insertion");
  }

  {
    const editor = new FakeEditor(["正文", "", "尾部"].join("\n"));
    let enhancerCalled = false;
    const tableEnhancerPlugin = {
      dataStore: { experimentalFeatureGate: false },
      async insertEnhancedTemplateContentAtCursor() {
        enhancerCalled = true;
        return true;
      },
    };
    const normalTemplate = [
      "==通用事件复盘模板==1.0",
      "### 1）事件",
      "| 字段 | 内容 |",
      "| --- | --- |",
      "| 事件名称 | |",
      "",
      "### 2）过程",
      "| 字段 | 内容 |",
      "| --- | --- |",
      "| 核心卡点 | |",
    ].join("\n");
    const fileContents = new Map([[".模板库/事件复盘1.0.md", normalTemplate]]);
    const pluginWithNormalTemplate = createPlugin(PluginClass, { fileContents, tableEnhancerPlugin });
    await pluginWithNormalTemplate.insertTemplateIntoContext(
      createContext(pluginWithNormalTemplate, editor, 0),
      ".模板库/事件复盘1.0.md"
    );
    assert.equal(enhancerCalled, false, "plain text plus table templates should not be routed through the enhanced-table bridge");
    assert.equal(editor.toString().includes("==通用事件复盘模板==1.0"), true, "plain template text should be inserted");
    assert.equal(editor.toString().includes("### 2）过程"), true, "plain template content after the first table should be preserved");
    assert.equal(editor.toString().includes("| 核心卡点 | |"), true, "plain template tables should be inserted intact");
  }

  {
    const editor = new FakeEditor(["正文", "", "尾部"].join("\n"));
    const fileContents = new Map([
      [
        ".模板库/周计划.md",
        [
          '%% mdtp-template:{"version":1,"tables":{}} %%',
          "%% mdtp:tbl_template_source %%",
          "| 时间 | 类型 |",
          "| --- | --- |",
        ].join("\n"),
      ],
    ]);
    const pluginWithPlainFallback = createPlugin(PluginClass, { fileContents });
    await pluginWithPlainFallback.insertTemplateIntoContext(createContext(pluginWithPlainFallback, editor, 0), ".模板库/周计划.md");
    assert.equal(editor.toString().includes("mdtp-template"), false, "plain fallback should not leak enhanced template metadata");
    assert.equal(editor.toString().includes("mdtp:tbl_template_source"), false, "plain fallback should not leak table marker lines");
    assert.equal(editor.toString().includes("| 时间 | 类型 |"), true, "plain fallback should still insert the readable template content");
  }

  {
    const previousWindow = global.window;
    global.window = {
      prompt() {
        return "混合模板";
      },
      getSelection() {
        return { toString: () => "" };
      },
    };
    const fileContents = new Map();
    const pluginForSave = createPlugin(PluginClass, { fileContents });
    pluginForSave.saveData = async () => {};
    const editor = new FakeEditor([
      "前言",
      "",
      "### 事件",
      "| 字段 | 内容 |",
      "| --- | --- |",
      "| 事件名称 | 测试 |",
      "",
      "尾部",
    ].join("\n"));
    editor.setSelection({ line: 2, ch: 0 }, { line: 5, ch: "| 事件名称 | 测试 |".length });
    await pluginForSave.saveCurrentBlockAsTemplate(createContext(pluginForSave, editor, 2));
    const saved = fileContents.get(".模板库/混合模板.md");
    assert.equal(saved.startsWith("# 混合模板"), false, "saving a template should not inject the template name into the content");
    assert.equal(saved.includes("### 事件"), true, "selected template text should be saved");
    assert.equal(saved.includes("| 事件名称 | 测试 |"), true, "selected template table should be saved");
    assert.equal(saved.includes("前言"), false, "saving selected content should not fall back to unrelated surrounding text");
    global.window = previousWindow;
  }

  {
    const pluginForMenu = createPlugin(PluginClass);
    const editor = new FakeEditor("正文");
    const context = createContext(pluginForMenu, editor, 0);
    pluginForMenu.getEditorBlockContext = () => context;
    const ordinaryMenu = new FakeMenu();
    pluginForMenu.extendEditorMenu(ordinaryMenu, editor, { file: {}, contentEl: {} });
    assert.deepEqual(
      ordinaryMenu.items.map((item) => item.title),
      ["打开飞书插入面板", "打开模板库面板"],
      "ordinary block editor menu should expose insert and template panels"
    );

    const tableMenu = new FakeMenu();
    pluginForMenu.getEditorBlockContext = () => ({ ...context, kind: "table" });
    pluginForMenu.extendEditorMenu(tableMenu, editor, { file: {}, contentEl: {} });
    assert.deepEqual(
      tableMenu.items.map((item) => item.title),
      ["打开飞书插入面板", "打开模板库面板", "对当前表格美化", "高亮", "打开表格操作面板"],
      "table editor menu should expose native layout as the first table action"
    );
    await tableMenu.items[2].click();
    assert.deepEqual(
      pluginForMenu.app.commands.executed,
      ["markdown-table-enhancer:initialize-current-table-native-layout"],
      "native layout menu item should call the table enhancer command"
    );
    tableMenu.items[3].click();
    assert.equal(editor.toString(), "==正文==", "table highlight menu item should use the same compact markdown highlight action");
  }

  {
    const pluginForSlash = createPlugin(PluginClass);
    const editor = new FakeEditor(["正文", "/", "尾部"].join("\n"));
    editor.cm = {};
    editor.getCursor = () => ({ line: 1, ch: 1 });
    let opened = 0;
    const activeView = { file: { path: "测试.md" } };
    pluginForSlash.app.workspace.getActiveViewOfType = () => activeView;
    pluginForSlash.getEditorBlockContext = () => createContext(pluginForSlash, editor, 1);
    pluginForSlash.renderHandle = () => {};
    pluginForSlash.showInsertPanel = () => {
      opened += 1;
    };
    pluginForSlash.handleSlashTrigger(editor, {});
    assert.equal(opened, 1, "typing a standalone slash line should open the insert panel");
    pluginForSlash.handleSlashTrigger(editor, {});
    assert.equal(opened, 1, "slash trigger should not reopen repeatedly on the same line");
  }

  {
    const editor = new FakeEditor("/");
    const context = createContextWithFile(plugin, editor, 0, "测试/插表.md");
    plugin.slashTrigger = { filePath: "测试/插表.md", line: 0 };
    plugin.insertMarkdownTable(context, 3, 3);
    assert.equal(
      editor.toString(),
      [
        "| 步骤 | 自检 | 内容 |",
        "| --- | --- | --- |",
        "|  |  |  |",
        "|  |  |  |",
        "",
        "",
      ].join("\n"),
      "table picker should replace a slash trigger with a native markdown table"
    );
  }

  {
    const editor = new FakeEditor("正文");
    const context = createContextWithFile(plugin, editor, 0, "测试/普通块插表.md");
    plugin.insertMarkdownTable(context, 2, 2);
    assert.equal(
      editor.toString(),
      [
        "正文",
        "",
        "| 步骤 | 自检 |",
        "| --- | --- |",
        "|  |  |",
        "",
      ].join("\n"),
      "table picker should append a native markdown table below a non-empty block"
    );
  }

  {
    assert.deepEqual(plugin.buildDefaultTableHeaders(1), ["步骤"], "one-column table should use the first preferred header");
    assert.deepEqual(plugin.buildDefaultTableHeaders(2), ["步骤", "自检"], "two-column table should use preferred headers");
    assert.deepEqual(plugin.buildDefaultTableHeaders(3), ["步骤", "自检", "内容"], "three-column table should use all preferred headers");
    assert.deepEqual(plugin.buildDefaultTableHeaders(4), ["", "", "", ""], "tables over three columns should keep headers blank");
  }

  {
    const claudian = require("./claudian-test-bundle.cjs");
    const fs = require("node:fs");
    const path = require("node:path");
    const fixture = path.join(__dirname, "fixtures", "codex-sample.jsonl");
    const content = fs.readFileSync(fixture, "utf-8");
    const parsed = claudian.parseCodexJsonlContent(content, {
      maxMessageBytes: 51200,
      maxTotalBytes: 1048576,
    });
    assert.equal(parsed.messages.length, 2, "codex parser should keep user and assistant only");
    assert.equal(parsed.messages[0].role, "user");
    assert.equal(parsed.messages[1].role, "assistant");
    assert.ok(!parsed.messages.some((m) => m.text.includes("app-context")), "parser should skip developer context");
    const meta = claudian.parseSessionMeta(
      JSON.stringify({
        id: "conv-test-1",
        providerId: "codex",
        title: "测试会话标题",
        createdAt: 1,
        updatedAt: 2,
      })
    );
    const record = claudian.buildArchiveRecord(meta, parsed.messages, "TestDevice", {
      toolLogs: true,
      images: true,
      attachments: true,
      largeOutputs: false,
    });
    assert.equal(record.title, "测试会话标题", "archive title must stay original without cross-device prefix");
    assert.equal(record.archiveScope, "cross-device");
    assert.equal(record.canResume, false);
    assert.ok(record.title.indexOf("跨设备") < 0, "title must not contain cross-device prefix");
    const rel = claudian.getArchiveRelativePath("codex", "conv-test-1", "Mac");
    assert.ok(rel.includes("conv-test-1@Mac.json"), "archive path should include device suffix");
  }

  console.log("feishu-doc-toolbar smoke tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
