import { App, Command, EventRef, MarkdownView, Menu, Plugin, PluginSettingTab } from "obsidian";

/**
 * 子插件模块运行需要的"宿主接口"。
 *
 * 每个内嵌模块（原 image-localizer / global-wide-page / canvas-copy-as-image）
 * 原本是独立 Plugin，会调用 this.app / this.addCommand / this.registerEvent / this.addStatusBarItem
 * 等 Plugin 提供的 API。
 *
 * SubPluginHost 提供一个"伪 Plugin"包装：
 * - 转发 app/vault/workspace
 * - 把命令、事件、DOM 事件、状态栏 item 等都注册到总插件，并在模块卸载时统一清理
 * - loadData/saveData 读写总插件 dataStore 的 subModuleData[moduleId] 桶，模块各自独立
 * - addSettingTab 在 host 内默默吞掉（每个模块的 settings UI 由总设置页统一渲染）
 *
 * 模块卸载（用户在功能开关里关闭、或总插件被禁用）时调用 destroy()，所有注册项一次性清理。
 */

export type ModuleHostBackend = {
  readonly app: App;
  readonly plugin: Plugin;
  loadModuleData(moduleId: string): unknown;
  saveModuleData(moduleId: string, data: unknown): Promise<void>;
};

export class SubPluginHost {
  readonly app: App;
  readonly manifest = { id: "feishu-doc-toolbar-submodule", version: "1.0.0" } as any;
  /** 真正的总插件实例，可作为 Component 传给 MarkdownRenderer 等 Obsidian API */
  readonly component: Plugin;

  private readonly backend: ModuleHostBackend;
  private readonly moduleId: string;
  private readonly disposers: Array<() => void> = [];
  private destroyed = false;

  constructor(backend: ModuleHostBackend, moduleId: string) {
    this.backend = backend;
    this.moduleId = moduleId;
    this.app = backend.app;
    this.component = backend.plugin;
  }

  // --- Plugin-like API ---

  addCommand(command: Command): Command {
    const id = `submodule-${this.moduleId}-${command.id ?? ""}`;
    const wrapped = { ...command, id } as Command;
    this.backend.plugin.addCommand(wrapped);
    return wrapped;
  }

  addStatusBarItem(): HTMLElement {
    const el = this.backend.plugin.addStatusBarItem();
    this.disposers.push(() => el.remove());
    return el;
  }

  addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => any): HTMLElement {
    const el = this.backend.plugin.addRibbonIcon(icon, title, callback);
    this.disposers.push(() => el.remove());
    return el;
  }

  /** 模块自己的 setting tab；总插件会忽略，由统一设置页接管。 */
  addSettingTab(_tab: PluginSettingTab): void {
    // intentionally ignored
  }

  registerEvent(eventRef: EventRef): void {
    this.backend.plugin.registerEvent(eventRef);
    this.disposers.push(() => {
      try {
        this.app.workspace.offref(eventRef);
      } catch {
        try {
          (this.app.vault as any).offref?.(eventRef);
        } catch {
          // ignore
        }
      }
    });
  }

  registerDomEvent<K extends keyof DocumentEventMap>(
    el: Document,
    type: K,
    callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  registerDomEvent<K extends keyof WindowEventMap>(
    el: Window,
    type: K,
    callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  registerDomEvent<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  registerDomEvent(el: any, type: any, callback: any, options?: any): void {
    el.addEventListener(type, callback, options);
    this.disposers.push(() => el.removeEventListener(type, callback, options));
  }

  registerInterval(handle: number): number {
    this.backend.plugin.registerInterval(handle);
    this.disposers.push(() => window.clearInterval(handle));
    return handle;
  }

  register(callback: () => void): void {
    this.disposers.push(() => {
      try {
        callback();
      } catch {
        // ignore
      }
    });
  }

  registerMarkdownPostProcessor(processor: (...args: any[]) => any, sortOrder?: number): any {
    const ret = this.backend.plugin.registerMarkdownPostProcessor(processor, sortOrder);
    return ret;
  }

  registerMarkdownCodeBlockProcessor(
    language: string,
    handler: (...args: any[]) => any,
    sortOrder?: number
  ): any {
    return this.backend.plugin.registerMarkdownCodeBlockProcessor(language, handler, sortOrder);
  }

  registerEditorExtension(extension: unknown): void {
    this.backend.plugin.registerEditorExtension(extension as never);
  }

  registerObsidianProtocolHandler(protocol: string, handler: (...args: any[]) => any): void {
    this.backend.plugin.registerObsidianProtocolHandler(protocol, handler);
  }

  registerView(viewType: string, viewConstructor: (...args: any[]) => any): void {
    // 内嵌模块重载/开关时，宿主可能仍持有同名 view type，先 unregister 避免 Obsidian 抛错
    this.unregisterView(viewType);
    try {
      this.backend.plugin.registerView(viewType, viewConstructor);
    } catch (error) {
      this.unregisterView(viewType);
      try {
        this.backend.plugin.registerView(viewType, viewConstructor);
      } catch (retryError) {
        const message = retryError instanceof Error ? retryError.message : String(retryError);
        throw new Error(`registerView(${viewType}) 失败: ${message}`);
      }
    }
  }

  unregisterView(viewType: string): void {
    const plugin = this.backend.plugin as Plugin & {
      unregisterView?: (type: string) => void;
    };
    try {
      plugin.unregisterView?.(viewType);
    } catch {
      // ignore — view may never have been registered
    }
  }

  // --- data IO routed to host's dataStore[subModuleData][moduleId] ---


  async loadData(): Promise<unknown> {
    return this.backend.loadModuleData(this.moduleId);
  }

  async saveData(data: unknown): Promise<void> {
    await this.backend.saveModuleData(this.moduleId, data);
  }

  // --- lifecycle ---

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    while (this.disposers.length > 0) {
      const disposer = this.disposers.pop();
      try {
        disposer?.();
      } catch {
        // ignore
      }
    }
  }
}

/** 内嵌子模块的统一接口。 */
export type EmbeddedSubModule = {
  id: string;
  displayName: string;
  description: string;
  defaultEnabled: boolean;
  isBeta?: boolean;
  /** 提示这个模块覆盖了某个外部插件 id；UI 里建议用户在第三方插件里关掉。 */
  replacesExternalPluginId?: string;
  load(host: SubPluginHost): Promise<void> | void;
  unload?(host: SubPluginHost): Promise<void> | void;
};
