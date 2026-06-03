import { App, Notice, Plugin, Setting } from "obsidian";

/** inline = 表末行内联；after = 表后独占行（旧 shouldInsertAfter 行为） */
type TableBlockIdPlacement = "inline" | "after";

type BlockLinkPlusPlugin = Plugin & {
  settings: {
    folderRevealHighlightMs?: number;
    folderLinkShowLocateNotice?: boolean;
    folderLinkIntroDismissed?: boolean;
    injectBlockLinkInTableMenus?: boolean;
    enable_right_click_block?: boolean;
    enable_right_click_embed?: boolean;
    enable_right_click_url?: boolean;
    tableBlockIdPlacement?: TableBlockIdPlacement;
    hideStandaloneBlockIdLines?: boolean;
  };
  saveSettings: () => Promise<void>;
  api?: {
    renderFolderLinkSettings?: (containerEl: HTMLElement, onRefresh?: () => void) => void;
  };
};

function renderTableBlockIdBridgeSettings(
  containerEl: HTMLElement,
  plugin: BlockLinkPlusPlugin,
  onRefresh: () => void
): void {
  const placement = plugin.settings.tableBlockIdPlacement ?? "inline";

  new Setting(containerEl)
    .setName("表格复制链接：块 ID 写入位置")
    .setDesc("末行内联：^id 写在表格最后一行末尾，不产生表后空行；表后独占行：旧版 shouldInsertAfter 行为")
    .addDropdown((dropdown) => {
      dropdown.addOption("inline", "末行内联（推荐）");
      dropdown.addOption("after", "表后独占行（旧行为）");
      dropdown.setValue(placement === "after" ? "after" : "inline").onChange(async (value) => {
        plugin.settings.tableBlockIdPlacement = value === "after" ? "after" : "inline";
        await plugin.saveSettings();
        onRefresh();
      });
    });

  new Setting(containerEl)
    .setName("预览中隐藏单独一行的 ^块ID")
    .setDesc("阅读/Live Preview 隐藏仅含 ^块ID 的独占行；源码调试可关闭")
    .addToggle((toggle) =>
      toggle.setValue(plugin.settings.hideStandaloneBlockIdLines !== false).onChange(async (value) => {
        plugin.settings.hideStandaloneBlockIdLines = value;
        await plugin.saveSettings();
        onRefresh();
      })
    );
}

function getBlockLinkPlus(app: App): BlockLinkPlusPlugin | null {
  const plugin = app.plugins.plugins["block-link-plus"] as BlockLinkPlusPlugin | undefined;
  if (!plugin?.settings || typeof plugin.saveSettings !== "function") return null;
  return plugin;
}

/** Obsidian增强体验 → 自研功能开关 → 指向链接增强 · 详细设置 */
export function renderBlockLinkPlusSettings(
  containerEl: HTMLElement,
  app: App,
  onRefresh: () => void
): void {
  const plugin = getBlockLinkPlus(app);
  if (!plugin) {
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "请先在上方启用「指向链接增强」（block-link-plus）插件。",
    });
    return;
  }

  containerEl.createEl("p", {
    cls: "setting-item-description",
    text: "段落链接使用 ^块ID 超短锚点；文件夹链接使用 blp-folder://open?id= 超短 URI（≤50 字符）。",
  });

  if (plugin.api?.renderFolderLinkSettings) {
    plugin.api.renderFolderLinkSettings(containerEl, onRefresh);
    return;
  }

  new Setting(containerEl)
    .setName("复制段落链接")
    .addToggle((toggle) =>
      toggle.setValue(plugin.settings.enable_right_click_block !== false).onChange(async (value) => {
        plugin.settings.enable_right_click_block = value;
        await plugin.saveSettings();
        onRefresh();
      })
    );

  new Setting(containerEl)
    .setName("表格右键注入段落链接")
    .setDesc("在表格专用右键菜单底部追加「复制段落链接」等项")
    .addToggle((toggle) =>
      toggle.setValue(plugin.settings.injectBlockLinkInTableMenus !== false).onChange(async (value) => {
        plugin.settings.injectBlockLinkInTableMenus = value;
        await plugin.saveSettings();
        onRefresh();
      })
    );

  new Setting(containerEl)
    .setName("文件树高亮时长（秒）")
    .addSlider((slider) =>
      slider
        .setLimits(3, 30, 1)
        .setValue(Math.round((plugin.settings.folderRevealHighlightMs ?? 10000) / 1000))
        .setDynamicTooltip()
        .onChange(async (seconds) => {
          plugin.settings.folderRevealHighlightMs = Math.max(3000, Math.min(30000, seconds * 1000));
          await plugin.saveSettings();
          onRefresh();
        })
    );

  new Setting(containerEl)
    .setName("再次显示文件夹链接说明")
    .addButton((btn) =>
      btn.setButtonText("重新显示说明").onClick(async () => {
        plugin.settings.folderLinkIntroDismissed = false;
        await plugin.saveSettings();
        new Notice("下次复制或打开文件夹链接时将再次显示说明");
        onRefresh();
      })
    );

  renderTableBlockIdBridgeSettings(containerEl, plugin, onRefresh);
}
