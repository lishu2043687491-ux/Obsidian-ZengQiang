import { App, Plugin } from "obsidian";

/** block-link-plus 注册的自定义视图；Obsidian 内 view type 全局唯一 */
export const BLOCK_LINK_PLUS_VIEW_TYPES = ["blp-file-outliner-view", "blp-journal-feed-view"] as const;

type ViewRegistryLike = { unregisterView?: (type: string) => void };
type WorkspaceLike = { detachLeavesOfType?: (type: string) => void };

function unregisterViewsOnPlugin(plugin: Plugin | null | undefined): void {
  if (!plugin) return;
  const runner = plugin as Plugin & { unregisterView?: (type: string) => void };
  for (const viewType of BLOCK_LINK_PLUS_VIEW_TYPES) {
    try {
      runner.unregisterView?.(viewType);
    } catch {
      // ignore
    }
  }
}

/**
 * 释放 BLP 视图占用（外部插件 / 热重载 / 上次内嵌未清干净时都需要）。
 * 仅 feishu.unregisterView 不够：视图可能挂在外部 block-link-plus 实例上。
 */
export function releaseBlockLinkPlusViewTypes(app: App, hostPlugin?: Plugin): void {
  const workspace = app.workspace as WorkspaceLike;
  const viewRegistry = (app as App & { viewRegistry?: ViewRegistryLike }).viewRegistry;

  for (const viewType of BLOCK_LINK_PLUS_VIEW_TYPES) {
    try {
      workspace.detachLeavesOfType?.(viewType);
    } catch {
      // ignore
    }
    try {
      viewRegistry?.unregisterView?.(viewType);
    } catch {
      // ignore
    }
  }

  const pluginsMap = ((app as any).plugins?.plugins ?? {}) as Record<string, Plugin | undefined>;
  for (const plugin of Object.values(pluginsMap)) {
    unregisterViewsOnPlugin(plugin ?? undefined);
  }
  unregisterViewsOnPlugin(hostPlugin);
}
