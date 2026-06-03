/**
 * 模拟 view type 已被占用（外部 BLP / 热重载残留），内嵌启动应释放并成功注册。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mainPath = path.join(root, "main.js");
const obsidian = require(path.join(root, "test-support/obsidian.js"));
const cmMocks = require(path.join(root, "test-support/codemirror-mock.js"));

function createObsidianRequire() {
  const whitelist = { obsidian, electron: {}, ...cmMocks };
  return function obsidianRequire(id) {
    const resolved = id === "@codemirror/text" ? "@codemirror/state" : id;
    if (whitelist[resolved]) return whitelist[resolved];
    if (resolved.startsWith("@codemirror/") || resolved.startsWith("@lezer/")) {
      return cmMocks[resolved] ?? cmMocks["@codemirror/state"];
    }
    if (resolved === "crypto") return require("crypto");
    throw new Error(`Cannot find module '${resolved}'`);
  };
}

function ensureMinimalDom() {
  if (global.document?.head) return;
  const el = () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    appendChild() {},
    remove() {},
    createEl() {
      return el();
    },
    createDiv() {
      return el();
    },
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute() {},
  });
  const head = el();
  global.document = {
    createElement: () => el(),
    body: el(),
    head,
    documentElement: { style: {} },
    addEventListener() {},
    getElementById: () => null,
    querySelectorAll: () => [],
  };
}

async function run() {
  ensureMinimalDom();
  assert.ok(fs.existsSync(mainPath));

  const obsReq = createObsidianRequire();
  global.window = {
    require: obsReq,
    setTimeout,
    clearTimeout,
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval,
    cancelAnimationFrame: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    document: global.document,
    localStorage: { getItem: () => null, setItem: () => {} },
    crypto: require("crypto").webcrypto ?? {
      getRandomValues(arr) {
        return require("crypto").randomFillSync(arr);
      },
    },
  };

  const code = fs.readFileSync(mainPath, "utf8");
  const moduleObj = { exports: {} };
  const fn = new Function("require", "module", "exports", `"use strict";\n${code}`);
  fn(obsReq, moduleObj, moduleObj.exports);

  const PluginClass = moduleObj.exports.default || moduleObj.exports;
  const occupied = new Set(["blp-file-outliner-view", "blp-journal-feed-view"]);
  const enabledPlugins = new Set(["feishu-doc-toolbar", "block-link-plus"]);
  const pluginsMap = {
    "block-link-plus": {
      manifest: { id: "block-link-plus" },
      unregisterView(type) {
        occupied.delete(type);
      },
      onunload: async () => {},
    },
  };

  const app = {
    viewRegistry: {
      unregisterView(type) {
        occupied.delete(type);
      },
    },
    workspace: {
      layoutReady: true,
      rootSplit: {},
      onLayoutReady(cb) {
        cb();
        return { unregister: () => {} };
      },
      on: () => ({ unregister: () => {} }),
      getActiveViewOfType: () => null,
      getLeavesOfType: () => [],
      detachLeavesOfType: (type) => {
        occupied.delete(type);
      },
      iterateAllLeaves: () => {},
      revealLeaf: async () => {},
    },
    vault: {
      getName: () => "view-registry-test",
      configDir: ".obsidian",
      adapter: { exists: async () => false, read: async () => "{}" },
      on: () => ({ unregister: () => {} }),
      getMarkdownFiles: () => [],
      getAbstractFileByPath: () => null,
      getConfig: () => null,
    },
    metadataCache: { on: () => ({ unregister: () => {} }), getFileCache: () => null },
    commands: { executeCommandById: () => true, listCommands: () => [] },
    plugins: {
      enabledPlugins,
      manifests: {
        "feishu-doc-toolbar": { id: "feishu-doc-toolbar" },
        "block-link-plus": { id: "block-link-plus" },
      },
      plugins: pluginsMap,
      disablePluginAndSave: async (id) => {
        enabledPlugins.delete(id);
        delete pluginsMap[id];
      },
    },
  };

  const plugin = new PluginClass(app);
  plugin.loadData = async () => ({
    version: 1,
    embeddedModules: {
      "block-link-plus": { enabled: true, data: { folderLinkRegistry: {} } },
      "file-auto-localizer": { enabled: false },
      "global-wide-page": { enabled: false },
      "right-click-copy-as-image": { enabled: false },
      "claudian-chat-archive": { enabled: false },
    },
  });
  plugin.saveData = async () => {};
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
  plugin.registerEditorExtension = () => {};
  plugin.registerObsidianProtocolHandler = () => {};
  plugin.addSettingTab = () => {};
  plugin.addRibbonIcon = () => document.createElement("span");
  plugin.addStatusBarItem = () => document.createElement("span");

  let registerThrows = false;
  const originalRegisterView = plugin.registerView.bind(plugin);
  plugin.registerView = (type, ctor) => {
    if (occupied.has(type)) {
      registerThrows = true;
      throw new Error(`Attempting to register an existing view type "${type}"`);
    }
    originalRegisterView(type, ctor);
    occupied.add(type);
  };
  plugin.unregisterView = (type) => {
    occupied.delete(type);
  };

  assert.equal(occupied.size, 2, "预置占用两个 view type");

  await plugin.onload();
  await new Promise((r) => setTimeout(r, 50));

  assert.equal(registerThrows, false, "内嵌启动不应触发 duplicate view 错误");
  assert.ok(pluginsMap["block-link-plus"], "内嵌实例应存在");
  assert.equal(
    pluginsMap["block-link-plus"][Symbol.for("feishu-doc-toolbar.embeddedSubPlugin")],
    true
  );

  await plugin.onunload();
  console.log("embedded-blp-view-registry passed");
  process.exit(0);
}

run().catch((error) => {
  console.error("embedded-blp-view-registry FAILED:", error);
  process.exitCode = 1;
});
