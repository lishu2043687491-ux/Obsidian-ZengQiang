/**
 * 模拟 Obsidian 白名单 require，验证内嵌 block-link-plus 能完成 onload。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const root = path.resolve(__dirname, "..");
const mainPath = path.join(root, "main.js");
const obsidian = require(path.join(root, "test-support/obsidian.js"));
const cmMocks = require(path.join(root, "test-support/codemirror-mock.js"));

function createObsidianRequire() {
  const whitelist = {
    obsidian,
    electron: {},
    ...cmMocks,
  };
  return function obsidianRequire(id) {
    if (Object.prototype.hasOwnProperty.call(whitelist, id)) {
      return whitelist[id];
    }
    if (id.startsWith("@codemirror/") || id.startsWith("@lezer/")) {
      return cmMocks[id] ?? cmMocks["@codemirror/state"];
    }
    if (id === "moment") {
      return () => ({ format: () => "", isValid: () => true });
    }
    if (id === "crypto") {
      return require("crypto");
    }
    throw new Error(`Cannot find module '${id}'`);
  };
}

function loadFeishuPlugin() {
  const code = fs.readFileSync(mainPath, "utf8");
  const moduleObj = { exports: {} };
  const req = createObsidianRequire();
  const wrapped = `"use strict";\nconst window = globalThis.window;\nconst document = globalThis.document;\n${code}`;
  const fn = new Function("require", "module", "exports", wrapped);
  fn(req, moduleObj, moduleObj.exports);
  return moduleObj.exports.default || moduleObj.exports;
}

function ensureMinimalDom() {
  if (global.document) return;
  const el = () => ({
    style: {},
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
  });
  global.document = {
    createElement: () => el(),
    body: el(),
    documentElement: { style: {} },
    addEventListener() {},
    removeEventListener() {},
  };
  global.window = {
    setTimeout,
    clearTimeout,
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval,
    cancelAnimationFrame: () => {},
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    BlockLinkPlus: undefined,
    document: global.document,
    crypto: require("crypto").webcrypto ?? {
      getRandomValues(arr) {
        return require("crypto").randomFillSync(arr);
      },
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
  };
  global.document.getElementById = () => null;
  global.document.querySelectorAll = () => [];
}

async function run() {
  ensureMinimalDom();
  assert.ok(fs.existsSync(mainPath), "先运行 npm run build 生成 main.js");
  const mainSource = fs.readFileSync(mainPath, "utf8");
  assert.ok(mainSource.includes("require_block_link_plus_bundle"), "block-link-plus 必须内联进 main.js");
  assert.ok(
    !mainSource.includes('require("./block-link-plus.bundle.js")'),
    "不得使用 Obsidian 不支持的 sibling require"
  );

  const PluginClass = loadFeishuPlugin();
  const enabledPlugins = new Set(["feishu-doc-toolbar"]);
  const pluginsMap = {};
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
      getName: () => "test-vault",
      configDir: ".obsidian",
      adapter: {
        exists: async () => false,
        read: async () => "{}",
      },
      on: () => ({ unregister: () => {} }),
      getMarkdownFiles: () => [],
      getAbstractFileByPath: () => null,
      getConfig: () => null,
    },
    metadataCache: {
      on: () => ({ unregister: () => {} }),
      getFileCache: () => null,
    },
    commands: {
      executeCommand: () => false,
      executeCommandById: () => false,
    },
    plugins: {
      enabledPlugins,
      manifests: {
        "feishu-doc-toolbar": { id: "feishu-doc-toolbar", name: "Obsidian增强体验" },
        "block-link-plus": { id: "block-link-plus", name: "指向链接增强" },
        "markdown-table-enhancer": { id: "markdown-table-enhancer" },
      },
      plugins: pluginsMap,
    },
    metadataCache: {
      getFileCache: () => null,
      on: () => ({ unregister: () => {} }),
    },
    commands: {
      executeCommandById: () => true,
      listCommands: () => [],
    },
  };

  const plugin = new PluginClass(app);
  plugin.loadData = async () => ({
    version: 1,
    templateFolderPath: ".模板库",
    embeddedModules: {
      "block-link-plus": {
        enabled: true,
        data: {
          enable_right_click_block: true,
          folderLinkRegistry: {},
          lastSeenVersion: "1.0.0",
        },
      },
      "file-auto-localizer": { enabled: false },
      "global-wide-page": { enabled: false },
      "right-click-copy-as-image": { enabled: false },
      "claudian-chat-archive": { enabled: false },
    },
    enableBetaFeatures: false,
  });
  plugin.saveData = async (data) => {
    plugin.dataStore = data;
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
  plugin.registerEditorExtension = () => {};
  plugin.registerObsidianProtocolHandler = () => {};
  plugin.registerView = () => {};
  plugin.unregisterView = () => {};
  plugin.addSettingTab = () => {};
  plugin.addRibbonIcon = () => document.createElement("span");
  plugin.addStatusBarItem = () => document.createElement("span");

  await plugin.onload();

  await new Promise((resolve) => setTimeout(resolve, 50));

  const blp = pluginsMap["block-link-plus"];
  assert.ok(blp, "内嵌 block-link-plus 应注册到 app.plugins.plugins");
  assert.ok(blp.settings, "block-link-plus 应完成 loadSettings");
  assert.equal(
    blp.settings.enable_right_click_block,
    false,
    "宿主应接管 editor-menu，bundle 自带右键复制项应关闭"
  );
  assert.notEqual(blp.settings.protectBlockIdAnchors, false, "默认应开启块 ID 防误删");
  assert.equal(typeof blp.api?.getSettings, "function", "block-link-plus API 应可用");
  assert.equal(typeof blp.api?.appendEditorLinkMenuItems, "function", "统一菜单 API 应可用");
  assert.equal(typeof blp.api?.copyFolderDualLink, "function", "文件夹超短双链 API 应可用");
  assert.ok(
    enabledPlugins.has("block-link-plus"),
    "内嵌 block-link-plus 应被 enabledPlugins 识别为已启用"
  );

  await plugin.onunload();
  console.log("embedded block-link-plus boot test passed");
  process.exit(0);
}

run().catch((error) => {
  console.error("embedded-blp-boot FAILED:", error);
  process.exitCode = 1;
});
