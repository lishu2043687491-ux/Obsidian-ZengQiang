import { EmbeddedSubModule, SubPluginHost } from "./sub-plugin-host";

type GlobalWidePageSettings = {
  enabled: boolean;
  showStatusBarToggle: boolean;
};

const DEFAULT_SETTINGS: GlobalWidePageSettings = {
  enabled: true,
  showStatusBarToggle: true,
};

const BODY_CLASS = "global-wide-page-enabled";

const STYLE_ID = "fdtb-module-global-wide-page-style";
const MODULE_STYLE = `
body.global-wide-page-enabled {
  --file-line-width: 100%;
}
body.global-wide-page-enabled .markdown-source-view.is-readable-line-width,
body.global-wide-page-enabled .markdown-preview-view.is-readable-line-width {
  --file-line-width: 100%;
}
body.global-wide-page-enabled .markdown-source-view.is-readable-line-width .cm-sizer,
body.global-wide-page-enabled .markdown-preview-view.is-readable-line-width .markdown-preview-sizer {
  max-width: min(1680px, calc(100% - 3rem));
  width: min(1680px, calc(100% - 3rem));
}
body.global-wide-page-enabled .markdown-source-view.is-readable-line-width .cm-contentContainer,
body.global-wide-page-enabled .markdown-preview-view.is-readable-line-width .markdown-preview-sizer {
  width: 100%;
}
.status-bar-item.plugin-global-wide-page-toggle {
  cursor: pointer;
  user-select: none;
}
.status-bar-item.plugin-global-wide-page-toggle.is-active {
  color: var(--text-accent);
}
`;

function injectModuleStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = MODULE_STYLE;
  document.head.appendChild(style);
}

function removeModuleStyle() {
  document.getElementById(STYLE_ID)?.remove();
}

class GlobalWidePageRunner {
  private settings: GlobalWidePageSettings = DEFAULT_SETTINGS;
  private statusBarEl: HTMLElement | null = null;

  constructor(private host: SubPluginHost) {}

  async start() {
    const saved = (await this.host.loadData()) as Partial<GlobalWidePageSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };

    injectModuleStyle();

    this.host.addCommand({
      id: "toggle",
      name: "切换全局宽页面",
      callback: () => void this.toggleWidePage(),
    });

    if (this.settings.showStatusBarToggle) {
      this.statusBarEl = this.host.addStatusBarItem();
      this.statusBarEl.addClass("plugin-global-wide-page-toggle");
      this.statusBarEl.addEventListener("click", () => {
        void this.toggleWidePage();
      });
    }

    this.host.registerEvent(this.host.app.workspace.on("layout-change", () => this.applyWidePageState()));
    this.host.registerEvent(this.host.app.workspace.on("active-leaf-change", () => this.applyWidePageState()));
    this.host.app.workspace.onLayoutReady(() => this.applyWidePageState());
    this.applyWidePageState();

    this.host.register(() => {
      document.body.classList.remove(BODY_CLASS);
      removeModuleStyle();
    });
  }

  private async toggleWidePage() {
    this.settings.enabled = !this.settings.enabled;
    await this.host.saveData(this.settings);
    this.applyWidePageState();
  }

  private applyWidePageState() {
    document.body.classList.toggle(BODY_CLASS, this.settings.enabled);
    if (!this.statusBarEl) return;

    this.statusBarEl.setText(this.settings.enabled ? "宽屏" : "标准");
    this.statusBarEl.toggleClass("is-active", this.settings.enabled);
    const tip = this.settings.enabled
      ? "当前默认宽页面，点击切换为标准宽度"
      : "当前标准宽度，点击切换为宽页面";
    this.statusBarEl.setAttribute("aria-label", tip);
    this.statusBarEl.title = tip;
  }
}

export const globalWidePageModule: EmbeddedSubModule = {
  id: "global-wide-page",
  displayName: "全局宽页面",
  description: "让所有 Markdown 页面默认以宽页面显示，并在状态栏提供一键切换",
  defaultEnabled: true,
  replacesExternalPluginId: "global-wide-page",
  async load(host) {
    const runner = new GlobalWidePageRunner(host);
    await runner.start();
  },
};
