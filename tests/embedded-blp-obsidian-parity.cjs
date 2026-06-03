/**
 * 1) 内联垫片源码优先 window.require
 * 2) 启动前 globalThis.require 异常时，onload 绑定后仍能加载内嵌 BLP
 * 3) 驱逐同名外部实例并替换为内嵌实例
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
    const aliases = { "@codemirror/text": "@codemirror/state" };
    const resolved = aliases[id] || id;
    if (Object.prototype.hasOwnProperty.call(whitelist, resolved)) return whitelist[resolved];
    if (resolved.startsWith("@codemirror/") || resolved.startsWith("@lezer/")) {
      return cmMocks[resolved] ?? cmMocks["@codemirror/state"];
    }
    if (resolved === "moment") return () => ({ format: () => "", isValid: () => true });
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
  assert.ok(fs.existsSync(mainPath), "先运行 npm run build");

  const code = fs.readFileSync(mainPath, "utf8");
  assert.ok(code.includes("require_block_link_plus_bundle"));
  const wIdx = code.indexOf("w.require");
  const gIdx = code.indexOf("globalThis.require");
  assert.ok(wIdx >= 0 && (gIdx < 0 || wIdx < gIdx), "FDTB_BLP_OBSIDIAN_REQUIRE 应优先 window.require");

  const obsReq = createObsidianRequire();
  const brokenGlobalRequire = () => {
    throw new Error("globalThis.require 未绑定");
  };

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
  globalThis.require = brokenGlobalRequire;

  const moduleObj = { exports: {} };
  const wrapped = `"use strict";\nconst window = globalThis.window;\nconst document = globalThis.document;\n${code}`;
  const fn = new Function("require", "module", "exports", wrapped);
  fn(obsReq, moduleObj, moduleObj.exports);

  const PluginClass = moduleObj.exports.default || moduleObj.exports;
  const enabledPlugins = new Set(["feishu-doc-toolbar", "block-link-plus"]);
  const pluginsMap = {
    "block-link-plus": {
      manifest: { id: "block-link-plus", name: "外部残留" },
      onunload: async () => {},
    },
  };
  const app = {
    workspace: {
      layoutReady: true,
      rootSplit: {},
      onLayoutReady(cb) {
        cb();
        return { unregister: () => {} };
      },
      on() {
        return { unregister: () => {} };
      },
      getActiveViewOfType: () => null,
      getLeavesOfType: () => [],
      iterateAllLeaves: () => {},
      revealLeaf: async () => {},
    },
    vault: {
      getName: () => "parity-vault",
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
  plugin.registerView = () => {};
  plugin.unregisterView = () => {};
  plugin.addSettingTab = () => {};
  plugin.addRibbonIcon = () => document.createElement("span");
  plugin.addStatusBarItem = () => document.createElement("span");

  await plugin.onload();
  await new Promise((r) => setTimeout(r, 50));

  assert.equal(typeof globalThis.require, "function", "onload 后应绑定 Obsidian require");
  assert.notEqual(globalThis.require, brokenGlobalRequire);

  const blp = pluginsMap["block-link-plus"];
  assert.ok(blp, "内嵌实例应写入 plugins 映射");
  assert.equal(blp[Symbol.for("feishu-doc-toolbar.embeddedSubPlugin")], true);
  assert.ok(blp.settings, "内嵌 block-link-plus 应完成 loadSettings");
  assert.equal(typeof blp.api?.copyFolderDualLink, "function");

  await plugin.onunload();
  console.log("embedded-blp-obsidian-parity passed");
  process.exit(0);
}

run().catch((error) => {
  console.error("embedded-blp-obsidian-parity FAILED:", error);
  process.exitCode = 1;
});
