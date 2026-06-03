/** 仅验证内联 bundle 在 Obsidian 式 require 下可加载 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const obsidian = require(path.join(__dirname, "../test-support/obsidian.js"));
const cmMocks = require(path.join(__dirname, "../test-support/codemirror-mock.js"));

const mainPath = path.join(__dirname, "../main.js");
const code = fs.readFileSync(mainPath, "utf8");

function createObsidianRequire() {
  return function obsidianRequire(id) {
    if (id === "obsidian") return obsidian;
    if (cmMocks[id]) return cmMocks[id];
    if (id.startsWith("@codemirror/") || id.startsWith("@lezer/")) {
      return cmMocks[id] ?? cmMocks["@codemirror/state"];
    }
    if (id === "moment") return () => ({ format: () => "", isValid: () => true });
    if (id === "crypto") return require("crypto");
    throw new Error(`Cannot find module '${id}'`);
  };
}

const obsidianRequire = createObsidianRequire();

const moduleObj = { exports: {} };
const fn = new Function("require", "module", "exports", code);
fn(obsidianRequire, moduleObj, moduleObj.exports);

const PluginClass = moduleObj.exports.default;
const app = {
  workspace: { layoutReady: true, onLayoutReady: (cb) => { cb(); return { unregister: () => {} }; }, on: () => ({ unregister: () => {} }), getLeavesOfType: () => [], getActiveViewOfType: () => null },
  vault: { getName: () => "t", configDir: ".obsidian", adapter: { exists: async () => false, read: async () => "{}" }, on: () => ({ unregister: () => {} }), getMarkdownFiles: () => [] },
  metadataCache: { getFileCache: () => null, on: () => ({ unregister: () => {} }) },
  commands: { executeCommand: () => false, executeCommandById: () => false, listCommands: () => [] },
  plugins: { enabledPlugins: new Set(), manifests: {}, plugins: {} },
};
const plugin = new PluginClass(app);
plugin.loadData = async () => ({
  version: 1,
  templateFolderPath: ".templates",
  embeddedModules: {
    "block-link-plus": { enabled: true, data: { enable_right_click_block: true, folderLinkRegistry: {} } },
    "file-auto-localizer": { enabled: false },
    "global-wide-page": { enabled: false },
    "right-click-copy-as-image": { enabled: false },
    "claudian-chat-archive": { enabled: false },
  },
});
plugin.saveData = async (d) => { plugin.dataStore = d; };
["scheduleStyleRefresh","hidePopover","updateTemplateIndexNote","addCommand","registerEvent","registerDomEvent","registerInterval","register","registerMarkdownPostProcessor","registerMarkdownCodeBlockProcessor","registerEditorExtension","registerObsidianProtocolHandler","registerView","unregisterView","addSettingTab","addRibbonIcon","addStatusBarItem"].forEach((m) => {
  plugin[m] = () => (m === "addRibbonIcon" || m === "addStatusBarItem" ? { remove() {} } : m === "addCommand" ? {} : m === "registerInterval" ? 0 : { unregister: () => {} });
});

const domEl = () => ({
  type: "button",
  style: { display: "" },
  className: "",
  innerHTML: "",
  title: "",
  classList: { add() {}, remove() {}, contains: () => false },
  appendChild() {},
  remove() {},
  setAttribute() {},
  addEventListener() {},
  removeEventListener() {},
});
global.document = {
  createElement: () => domEl(),
  body: domEl(),
  addEventListener() {},
  querySelectorAll: () => [],
  getElementById: () => null,
};
global.window = {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  cancelAnimationFrame: () => {},
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  require: obsidianRequire,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
};

plugin.onload().then(async () => {
  await new Promise((r) => setTimeout(r, 80));
  assert.ok(app.plugins.plugins["block-link-plus"], "block-link-plus shim installed");
  console.log("embedded-blp-bundle-only passed");
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
