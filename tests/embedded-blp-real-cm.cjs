/** Boot test using real @codemirror packages (Obsidian W0 parity). */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mainPath = path.join(root, "main.js");
const obsidian = require(path.join(root, "test-support/obsidian.js"));

const W0 = {
  obsidian,
  "@codemirror/state": require("@codemirror/state"),
  "@codemirror/view": require("@codemirror/view"),
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
  if (id.startsWith("@codemirror/") || id.startsWith("@lezer/")) {
    return W0["@codemirror/state"];
  }
  if (id === "moment") {
    return () => ({ format: () => "", isValid: () => true, locale: () => "" });
  }
  if (id === "crypto") {
    return require("crypto");
  }
  throw new Error(`Cannot find module '${id}'`);
}

function loadFeishuPlugin() {
  const code = fs.readFileSync(mainPath, "utf8");
  const moduleObj = { exports: {} };
  const fn = new Function("require", "module", "exports", code);
  fn(obsidianRequire, moduleObj, moduleObj.exports);
  return moduleObj.exports.default || moduleObj.exports;
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
    BlockLinkPlus: undefined,
    require: obsidianRequire,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
  };
  global.CSS = { escape: (s) => String(s).replace(/"/g, '\\"') };
}

async function run() {
  ensureMinimalDom();
  const PluginClass = loadFeishuPlugin();
  const enabledPlugins = new Set(["feishu-doc-toolbar"]);
  const pluginsMap = {};
  const app = {
    workspace: {
      layoutReady: true,
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
      createLeafInParent: () => ({ openFile: async () => {}, view: null }),
      rootSplit: { children: [], replaceChild() {}, containerEl: document.createElement("div") },
      floatingSplit: {},
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
    },
    plugins: {
      enabledPlugins,
      manifests: {
        "feishu-doc-toolbar": { id: "feishu-doc-toolbar", name: "Obsidian增强体验" },
        "block-link-plus": { id: "block-link-plus", name: "指向链接增强" },
      },
      plugins: pluginsMap,
    },
    metadataCache: {
      getFileCache: () => null,
      getFirstLinkpathDest: () => null,
      on: () => ({ unregister: () => {} }),
    },
    commands: {
      executeCommand: () => false,
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
  assert.ok(blp, "embedded block-link-plus registered");
  assert.ok(blp.settings, "settings loaded");
  assert.equal(typeof blp.api?.getSettings, "function");
  console.log("embedded-blp-real-cm passed");
  process.exit(0);
}

run().catch((error) => {
  console.error("embedded-blp-real-cm FAILED:", error);
  process.exit(1);
});
