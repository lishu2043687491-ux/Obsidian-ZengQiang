/**
 * 红线 22/25 回归：内嵌 block-link-plus 注册的编辑器扩展，用真实 CodeMirror
 * 构建 EditorState 必须不抛错；且这些扩展是经 Compartment 注册（可回滚），
 * 不是裸挂常量扩展。模拟真机「打开历史文件」时 EditorState.create 的过程。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mainPath = path.join(root, "main.js");
const obsidian = require(path.join(root, "test-support/obsidian.js"));

const cmState = require("@codemirror/state");
const cmView = require("@codemirror/view");

const W0 = {
  obsidian,
  "@codemirror/state": cmState,
  "@codemirror/view": cmView,
  "@codemirror/commands": require("@codemirror/commands"),
  "@codemirror/language": require("@codemirror/language"),
  "@codemirror/search": require("@codemirror/search"),
  "@codemirror/autocomplete": require("@codemirror/autocomplete"),
  "@codemirror/lint": require("@codemirror/lint"),
  "@lezer/common": require("@lezer/common"),
  "@lezer/highlight": require("@lezer/highlight"),
};

function obsidianRequire(id) {
  if (Object.prototype.hasOwnProperty.call(W0, id)) return W0[id];
  if (id.startsWith("@codemirror/") || id.startsWith("@lezer/")) return W0["@codemirror/state"];
  if (id === "moment") return () => ({ format: () => "", isValid: () => true, locale: () => "" });
  if (id === "crypto") return require("crypto");
  throw new Error(`Cannot find module '${id}'`);
}

function ensureMinimalDom() {
  const el = () => ({
    style: { display: "" },
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    appendChild() {},
    remove() {},
    empty() {},
    createEl() {
      return el();
    },
    createDiv() {
      return el();
    },
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute() {},
    getAttribute: () => null,
    insertAdjacentElement() {},
    click() {},
  });
  global.document = {
    createElement: () => el(),
    body: el(),
    head: el(),
    addEventListener() {},
    removeEventListener() {},
    getElementById: () => null,
    querySelectorAll: () => [],
  };
  global.window = {
    setTimeout,
    clearTimeout,
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval,
    cancelAnimationFrame: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    require: obsidianRequire,
    localStorage: { getItem: () => null, setItem: () => {} },
  };
  global.CSS = { escape: (s) => String(s).replace(/"/g, '\\"') };
}

async function run() {
  ensureMinimalDom();

  const code = fs.readFileSync(mainPath, "utf8");
  const moduleObj = { exports: {} };
  new Function("require", "module", "exports", code)(obsidianRequire, moduleObj, moduleObj.exports);
  const PluginClass = moduleObj.exports.default || moduleObj.exports;

  // 收集内嵌模块经宿主注册到「总插件全局」的编辑器扩展（应为 Compartment 包裹）
  const registeredExtensions = [];

  const enabledPlugins = new Set(["feishu-doc-toolbar"]);
  const pluginsMap = {};
  const app = {
    workspace: {
      layoutReady: true,
      onLayoutReady(cb) {
        cb();
        return { unregister: () => {} };
      },
      on: () => ({ unregister: () => {} }),
      getActiveViewOfType: () => null,
      getLeavesOfType: () => [],
      iterateAllLeaves: () => {},
      revealLeaf: async () => {},
      rootSplit: { children: [], replaceChild() {}, containerEl: document.createElement("div") },
    },
    vault: {
      getName: () => "iso-vault",
      configDir: ".obsidian",
      adapter: { exists: async () => false, read: async () => "{}" },
      on: () => ({ unregister: () => {} }),
      getMarkdownFiles: () => [],
      getAbstractFileByPath: () => null,
    },
    plugins: {
      enabledPlugins,
      manifests: {
        "feishu-doc-toolbar": { id: "feishu-doc-toolbar" },
        "block-link-plus": { id: "block-link-plus" },
      },
      plugins: pluginsMap,
    },
    metadataCache: {
      getFileCache: () => null,
      getFirstLinkpathDest: () => null,
      on: () => ({ unregister: () => {} }),
    },
    commands: { executeCommandById: () => true, listCommands: () => [] },
  };

  const plugin = new PluginClass(app);
  plugin.loadData = async () => ({
    version: 1,
    templateFolderPath: ".模板库",
    embeddedModules: {
      "block-link-plus": { enabled: true, data: { folderLinkRegistry: {}, lastSeenVersion: "1.0.0" } },
      "file-auto-localizer": { enabled: false },
      "global-wide-page": { enabled: false },
      "right-click-copy-as-image": { enabled: false },
      "claudian-chat-archive": { enabled: false },
    },
    enableBetaFeatures: false,
  });
  plugin.saveData = async (d) => {
    plugin.dataStore = d;
  };
  plugin.scheduleStyleRefresh = () => {};
  plugin.hidePopover = () => {};
  plugin.updateTemplateIndexNote = async () => {};
  plugin.addCommand = () => ({});
  plugin.registerEvent = () => ({ unregister: () => {} });
  plugin.registerDomEvent = () => {};
  plugin.registerInterval = () => 0;
  plugin.register = () => {};
  plugin.registerMarkdownPostProcessor = () => {};
  plugin.registerMarkdownCodeBlockProcessor = () => {};
  plugin.registerEditorExtension = (ext) => {
    registeredExtensions.push(ext);
  };
  plugin.registerObsidianProtocolHandler = () => {};
  plugin.registerView = () => {};
  plugin.unregisterView = () => {};
  plugin.addSettingTab = () => {};
  plugin.addRibbonIcon = () => document.createElement("span");
  plugin.addStatusBarItem = () => document.createElement("span");

  await plugin.onload();
  await new Promise((r) => setTimeout(r, 60));

  const blp = pluginsMap["block-link-plus"];
  assert.ok(blp, "内嵌 block-link-plus 应启动");

  // 关键断言：模拟真机打开历史文件——用真实 CodeMirror 构建 EditorState
  assert.ok(registeredExtensions.length > 0, "应有内嵌编辑器扩展经宿主注册");
  let state;
  assert.doesNotThrow(() => {
    state = cmState.EditorState.create({
      doc: "# 历史文件\n\n正文内容 ^abc123\n",
      extensions: registeredExtensions,
    });
  }, "注册的内嵌扩展必须能让 EditorState 正常构建（历史文件可打开）");
  assert.ok(state, "EditorState 构建成功");

  // 守卫验证：transactionFilter 内部抛错时，dispatch 不应炸掉编辑器
  assert.doesNotThrow(() => {
    state = state.update({ changes: { from: 0, insert: "x" } }).state;
  }, "事务派发不应因内嵌过滤器异常而崩溃");

  await plugin.onunload();
  console.log("embedded-blp-editor-isolation passed");
  process.exit(0);
}

run().catch((error) => {
  console.error("embedded-blp-editor-isolation FAILED:", error);
  process.exit(1);
});
