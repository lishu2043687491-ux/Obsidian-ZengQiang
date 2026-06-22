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
  if (request === "obsidian") return obsidianStub;
  if (request === "@codemirror/state") {
    return { RangeSetBuilder: class { add() {} finish() { return []; } } };
  }
  if (request === "@codemirror/view") {
    return {
      Decoration: { line: () => ({}) },
      DecorationSet: class {},
      EditorView: class {},
      ViewUpdate: class {},
      ViewPlugin: { fromClass: (v) => v },
    };
  }
  return originalLoad(request, parent, isMain);
};

const pluginPath = path.resolve(__dirname, "../main.js");
const PluginClass = require(pluginPath).default || require(pluginPath);

if (!global.Node) {
  global.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
}

function createFile(filePath) {
  const { TFile } = require("obsidian");
  const file = new TFile();
  file.path = filePath;
  return file;
}

function createTextNode(text) {
  return { nodeType: Node.TEXT_NODE, textContent: text };
}

function findFirstDescendant(node, predicate) {
  for (const child of node.children ?? []) {
    if (predicate(child)) return child;
    const nested = findFirstDescendant(child, predicate);
    if (nested) return nested;
  }
  return null;
}

function createElement(tagName, options = {}) {
  const attributes = { ...(options.attributes ?? {}) };
  const childNodes = [...(options.childNodes ?? [])];
  const element = {
    nodeType: Node.ELEMENT_NODE,
    tagName: String(tagName).toUpperCase(),
    childNodes,
    children: childNodes.filter((c) => c.nodeType === Node.ELEMENT_NODE),
    textContent: options.textContent ?? childNodes.map((c) => c.textContent ?? "").join(""),
    dataset: { ...(options.dataset ?? {}) },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    querySelector(selector) {
      if (selector === "img") {
        return findFirstDescendant(element, (node) => node.tagName?.toLowerCase() === "img");
      }
      return null;
    },
    querySelectorAll() {
      return [];
    },
    appendChild(child) {
      childNodes.push(child);
      if (child.nodeType === Node.ELEMENT_NODE) element.children.push(child);
      return child;
    },
    classList: { add() {} },
    style: {},
  };
  for (const [k, v] of Object.entries(attributes)) element.setAttribute(k, v);
  return element;
}

function createPlugin() {
  const plugin = Object.create(PluginClass.prototype);
  plugin.app = {
    vault: {
      adapter: { exists: async () => false, read: async () => "", write: async () => {}, getFullPath: (p) => p },
      cachedRead: async () => "",
      getAbstractFileByPath: () => null,
    },
    workspace: { getActiveViewOfType: () => null },
    plugins: { plugins: { "feishu-doc-toolbar": { isOneNoteRichPasteEnabled: () => true } } },
  };
  plugin.dataStore = { experimentalFeatureGate: false, tables: {}, snapshots: [] };
  plugin.loadData = async () => plugin.dataStore;
  plugin.savePluginData = async () => {};
  plugin.saveData = async () => {};
  plugin.registerMarkdownPostProcessor = () => {};
  plugin.registerEvent = () => {};
  plugin.addCommand = () => {};
  plugin.addStatusBarItem = () => ({ addClass() {}, createDiv() { return { addEventListener() {}, setText() {}, setAttr() {}, style: {} }; }, style: {} });
  return plugin;
}

module.exports = { createPlugin, createFile, createElement, createTextNode };
