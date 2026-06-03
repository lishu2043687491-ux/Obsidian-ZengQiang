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

  /** 本宿主注册的所有内嵌编辑器扩展，集中放进一个 Compartment，关闭/失败时可整体撤销 */
  private editorCompartment: any = null;
  private editorExtensions: unknown[] = [];
  private editorCompartmentRegistered = false;

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

  /**
   * 内嵌模块的编辑器扩展隔离注册。
   *
   * 红线（22/23）：内嵌模块的 CM 扩展不得裸挂到总插件全局数组——
   *  - 裸挂后单个坏扩展会让所有 MarkdownView 的 EditorState 构建失败（历史文件全打不开）
   *  - 且关闭/启动失败时无法从全局数组撤销，污染会一直残留
   *
   * 对策：统一放进一个 Compartment，destroy() 时整体重配为空并刷新所有打开的编辑器，
   * 实现「可回滚」。拿不到 Compartment（测试 mock / 老环境）时退回原始注册，但仍登记
   * disposer，至少在 destroy 时尽力清理。
   */
  registerEditorExtension(extension: unknown): void {
    const cm = this.getCmStateModule();

    if (cm?.Compartment) {
      const extensions = Array.isArray(extension) ? extension.slice() : [extension];
      this.editorExtensions.push(...extensions);

      if (!this.editorCompartmentRegistered) {
        this.editorCompartment = new cm.Compartment();
        this.editorCompartmentRegistered = true;
        try {
          this.backend.plugin.registerEditorExtension(
            this.editorCompartment.of(this.editorExtensions) as never
          );
        } catch (error) {
          console.warn(`[feishu-doc-toolbar] [${this.moduleId}] 编辑器扩展注册失败`, error);
        }
        this.disposers.push(() => this.clearEditorExtensions());
      } else {
        // compartment 已挂载，追加扩展后重配，刷新已打开编辑器
        this.reconfigureEditorCompartment(this.editorExtensions);
      }
      return;
    }

    // 退路：拿不到 CM Compartment，按原始方式注册（仍登记 disposer 尽力清理）
    try {
      this.backend.plugin.registerEditorExtension(extension as never);
    } catch (error) {
      console.warn(`[feishu-doc-toolbar] [${this.moduleId}] 编辑器扩展注册失败`, error);
    }
  }

  private getCmStateModule(): { Compartment?: new () => any } | null {
    try {
      const req =
        (typeof window !== "undefined"
          ? (window as { require?: (id: string) => unknown }).require
          : undefined) ?? (globalThis as { require?: (id: string) => unknown }).require;
      if (typeof req !== "function") return null;
      return req("@codemirror/state") as { Compartment?: new () => any };
    } catch {
      return null;
    }
  }

  private reconfigureEditorCompartment(extensions: unknown[]): void {
    if (!this.editorCompartment) return;
    const effect = this.editorCompartment.reconfigure(extensions);
    this.forEachEditorView((view) => {
      try {
        view.dispatch({ effects: effect });
      } catch (error) {
        console.warn(`[feishu-doc-toolbar] [${this.moduleId}] 刷新编辑器扩展失败`, error);
      }
    });
  }

  /** 关闭/失败时把本宿主的编辑器扩展整体撤销，避免残留污染全局 */
  private clearEditorExtensions(): void {
    this.editorExtensions = [];
    if (this.editorCompartment) {
      this.reconfigureEditorCompartment([]);
    }
  }

  private forEachEditorView(fn: (view: any) => void): void {
    try {
      const leaves = (this.app.workspace as any).getLeavesOfType?.("markdown") ?? [];
      for (const leaf of leaves) {
        const cmView = leaf?.view?.editor?.cm;
        if (cmView && typeof cmView.dispatch === "function") fn(cmView);
      }
    } catch (error) {
      console.warn(`[feishu-doc-toolbar] [${this.moduleId}] 遍历编辑器视图失败`, error);
    }
  }

  registerObsidianProtocolHandler(protocol: string, handler: (...args: any[]) => any): void {
    this.backend.plugin.registerObsidianProtocolHandler(protocol, handler);
  }

  registerView(viewType: string, viewConstructor: (...args: any[]) => any): void {
    // 内嵌模块重载/开关时，先 detach + viewRegistry 释放全局 view type，再走宿主 unregister
    const appAny = this.app as {
      workspace?: { detachLeavesOfType?: (type: string) => void };
      viewRegistry?: { unregisterView?: (type: string) => void };
    };
    try {
      appAny.workspace?.detachLeavesOfType?.(viewType);
    } catch {
      // ignore
    }
    try {
      appAny.viewRegistry?.unregisterView?.(viewType);
    } catch {
      // ignore
    }
    this.unregisterView(viewType);
    // destroy 时撤销视图注册，避免启动失败/关闭后残留导致下次 registerView 冲突
    this.disposers.push(() => {
      try {
        appAny.workspace?.detachLeavesOfType?.(viewType);
      } catch {
        // ignore
      }
      try {
        appAny.viewRegistry?.unregisterView?.(viewType);
      } catch {
        // ignore
      }
      this.unregisterView(viewType);
    });
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
