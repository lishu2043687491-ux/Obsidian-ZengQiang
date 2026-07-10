class Component {
  constructor() {
    this._children = [];
    this._loaded = false;
  }

  addChild(child) {
    this._children.push(child);
    return child;
  }

  load() {}

  unload() {}

  registerEvent() {
    return { unregister: () => {} };
  }

  register() {
    return () => {};
  }
}

class HoverPopover extends Component {}

class WorkspaceSplit {
  constructor() {
    this.children = [];
    this.containerEl = { insertAdjacentElement() {} };
  }

  replaceChild() {}
}

const PopoverState = { Showing: 0 };

class WorkspaceLeaf {}

class Plugin extends Component {
  constructor(app, manifest) {
    super();
    this.app = app;
    this.manifest = manifest ?? { id: "test", version: "0" };
    this._events = [];
    this.viewByType = {};
  }

  registerDomEvent() {}

  registerEvent(eventRef) {
    this._events.push(eventRef);
    return eventRef;
  }

  registerView(type, ctor) {
    if (this.viewByType[type]) {
      throw new Error(`Attempting to register an existing view type "${type}"`);
    }
    this.viewByType[type] = ctor;
  }

  unregisterView(type) {
    delete this.viewByType[type];
  }

  registerEditorExtension(extension) {
    this.editorExtensions = this.editorExtensions || [];
    this.editorExtensions.push(extension);
    return extension;
  }

  registerInterval(interval) {
    return interval;
  }

  registerMarkdownPostProcessor(processor) {
    return processor;
  }

  addCommand(command) {
    this.commands = this.commands || [];
    this.commands.push(command);
    return command;
  }

  addRibbonIcon(icon, title, callback) {
    const ribbonIcon = { icon, title, callback, remove() {} };
    this.ribbonIcons = this.ribbonIcons || [];
    this.ribbonIcons.push(ribbonIcon);
    return ribbonIcon;
  }

  addStatusBarItem() {
    return { remove() {}, empty() {}, setText() {}, addClass() {} };
  }

  load() {
    if (this._loaded) return;
    this._loaded = true;
    const tasks = [];
    const onloadResult = this.onload();
    if (onloadResult) tasks.push(onloadResult);
    for (const child of this._children.slice()) {
      const childLoad = child.load();
      if (childLoad) tasks.push(childLoad);
    }
    return tasks.length > 0 ? Promise.all(tasks) : undefined;
  }

  unload() {
    if (!this._loaded) return;
    this._loaded = false;
    while (this._children.length > 0) {
      this._children.pop()?.unload?.();
    }
    this.onunload();
  }

  onload() {}

  onunload() {}

  addSettingTab(tab) {
    this.settingTab = tab;
  }
}

class Notice {
  constructor(message) {
    Notice.messages.push(message);
    this.message = message;
  }

  static reset() {
    Notice.messages = [];
  }
}

Notice.messages = [];

class MarkdownView {}
class MarkdownRenderChild extends Component {}

class ItemView extends Component {
  constructor(leaf) {
    super();
    this.leaf = leaf;
    this.contentEl = {
      empty() {},
      addClass() {},
      removeClass() {},
      createDiv() {
        return {
          style: {},
          addClass() {},
          createDiv() { return this; },
          createEl() {
            return {
              addEventListener() {}, setAttribute() {}, getAttribute() { return ""; },
              load() {}, play() {}, pause() {},
            };
          },
          appendChild() {},
        };
      },
      createEl() {
        return {
          addEventListener() {}, setAttribute() {}, getAttribute() { return ""; },
          load() {}, play() {}, pause() {},
        };
      },
    };
  }
}

class TextFileView extends Component {
  constructor(leaf) {
    super();
    this.leaf = leaf;
    this.contentEl = {
      empty() {},
      createDiv() {
        return { style: {}, classList: { add() {} }, createDiv() { return this; }, appendChild() {} };
      },
      addClass() {},
      appendChild() {},
    };
  }

  getViewType() {
    return "mock-text-file-view";
  }
}

class AbstractInputSuggest {
  constructor() {
    this.containerEl = { empty() {}, appendChild() {} };
  }
  getSuggestions() {
    return [];
  }
  renderSuggestion() {}
  selectSuggestion() {}
}

class Menu {
  constructor() {
    this.items = [];
  }
  addItem(builder) {
    const item = {
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
    this.items.push(item);
    return this;
  }
  addSeparator() {
    this.items.push({ separator: true });
    return this;
  }
  addSubmenu(builder) {
    const submenu = new Menu();
    submenu.setTitle = function (value) {
      this.title = value;
      return this;
    };
    submenu.setIcon = function (value) {
      this.icon = value;
      return this;
    };
    builder(submenu);
    this.items.push({ title: submenu.title, icon: submenu.icon, submenu });
    return this;
  }
}
Menu.prototype.showAtPosition = function () {};
Menu.prototype.showAtMouseEvent = function () {};

class TFile {}
class TFolder {}
class Editor {}

class Modal {
  constructor(app) {
    this.app = app;
    this.contentEl = {
      empty() {},
      createEl() {
        return { text: "" };
      },
      createDiv() {
        return { style: {}, createEl() { return {}; }, appendChild() {} };
      },
    };
  }
  open() {}
  close() {}
}

const MarkdownRenderer = {
  renderMarkdown() {
    return Promise.resolve();
  },
};

const Platform = { isMobile: false };

function addIcon() {}

function requestUrl() {
  return Promise.resolve({ status: 200, arrayBuffer: new ArrayBuffer(0), headers: {} });
}

class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = {
      empty() {},
      replaceChildren() {},
      addClass() {},
      appendChild() {},
    };
  }
}

class Setting {
  constructor(containerEl) {
    this.containerEl = containerEl;
  }

  setName(value) {
    this.name = value;
    return this;
  }

  setDesc(value) {
    this.desc = value;
    return this;
  }

  addToggle(builder) {
    const toggle = {
      value: false,
      setValue(value) {
        this.value = value;
        return this;
      },
      onChange(handler) {
        this.change = handler;
        return this;
      },
    };
    builder(toggle);
    this.toggle = toggle;
    return this;
  }

  addButton(builder) {
    const button = {
      text: "",
      setButtonText(value) {
        this.text = value;
        return this;
      },
      onClick(handler) {
        this.click = handler;
        return this;
      },
    };
    builder(button);
    this.button = button;
    return this;
  }
}

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "");
}

module.exports = {
  Plugin,
  Component,
  HoverPopover,
  WorkspaceSplit,
  WorkspaceLeaf,
  PopoverState,
  Notice,
  MarkdownView,
  MarkdownRenderChild,
  ItemView,
  TextFileView,
  AbstractInputSuggest,
  Menu,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  Editor,
  Modal,
  MarkdownRenderer,
  Platform,
  addIcon,
  requestUrl,
  normalizePath,
};
