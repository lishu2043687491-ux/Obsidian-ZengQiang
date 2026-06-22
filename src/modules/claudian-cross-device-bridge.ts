import type { App } from "obsidian";

import {
  buildArchiveHandoffPrompt,
  type ChatArchiveMessage,
  type MergedChatArchiveRecord,
} from "./claudian-archive-core";
import { resolveCodexSessionFilePath } from "./claudian-codex-parser";

type ClaudianConversation = {
  id: string;
  providerId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  sessionId?: string | null;
  currentNote?: string;
  messages: unknown[];
  providerState?: Record<string, unknown>;
};

type ClaudianPlugin = {
  app: App;
  conversations: ClaudianConversation[];
  getConversationList: () => Array<Record<string, unknown>>;
  getConversationSync: (id: string) => ClaudianConversation | null;
  createConversation: (options?: { providerId?: string }) => Promise<ClaudianConversation>;
  updateConversation: (id: string, updates: Record<string, unknown>) => Promise<void>;
  switchConversation: (id: string) => Promise<ClaudianConversation | null>;
  getConversationById?: (id: string) => Promise<ClaudianConversation | null>;
  getAllViews?: () => Array<{
    getTabManager?: () => {
      getAllTabs?: () => Array<Record<string, any>>;
    } | null;
  }>;
};

const ORIGIN_KEY = "claudianArchiveOriginId";
const HANDOFF_KEY = "claudianArchiveHandoffPending";

function toClaudianMessages(messages: ChatArchiveMessage[]) {
  return messages.map((message, index) => ({
    id: `claudian-archive-${index}-${message.createdAt}`,
    role: message.role,
    content: message.text,
    timestamp: message.createdAt,
    ...(message.role === "assistant"
      ? { contentBlocks: [{ type: "text", content: message.text }] }
      : {}),
  }));
}

function mergeClaudianMessages(archiveMessages: unknown[], localMessages: unknown[]) {
  const merged: unknown[] = [];
  const seen = new Set<string>();
  for (const message of [...archiveMessages, ...localMessages]) {
    if (!message || typeof message !== "object") continue;
    const item = message as { role?: unknown; content?: unknown };
    const key = `${String(item.role ?? "")}\u0000${String(item.content ?? "")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(message);
  }
  return merged;
}

function hasLocalCodexSession(conversation: ClaudianConversation) {
  if (conversation.providerId !== "codex") return true;
  return !!resolveCodexSessionFilePath({
    sessionId: conversation.sessionId ?? undefined,
    providerState: conversation.providerState as {
      sessionFilePath?: string;
      threadId?: string;
      transcriptRootPath?: string;
    },
  });
}

function getOriginId(conversation: ClaudianConversation) {
  const value = conversation.providerState?.[ORIGIN_KEY];
  return typeof value === "string" ? value : null;
}

export class ClaudianCrossDeviceBridge {
  private plugin: ClaudianPlugin | null = null;
  private originalGetConversationList: ClaudianPlugin["getConversationList"] | null = null;
  private originalSwitchConversation: ClaudianPlugin["switchConversation"] | null = null;
  private originalGetConversationById: ClaudianPlugin["getConversationById"] | null = null;
  private pollTimer: number | null = null;

  constructor(
    private app: App,
    private getArchives: () => Promise<MergedChatArchiveRecord[]>,
    private getContinuationMap: () => Record<string, string> = () => ({}),
    private saveContinuationMap: (value: Record<string, string>) => Promise<void> = async () => {}
  ) {}

  start() {
    this.tryInstall();
    this.pollTimer = window.setInterval(() => {
      this.tryInstall();
      this.patchPendingTabServices();
    }, 500);
  }

  stop() {
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.plugin && this.originalGetConversationList && this.originalSwitchConversation) {
      this.plugin.getConversationList = this.originalGetConversationList;
      this.plugin.switchConversation = this.originalSwitchConversation;
      if (this.originalGetConversationById) {
        this.plugin.getConversationById = this.originalGetConversationById;
      }
    }
    this.plugin = null;
    this.originalGetConversationList = null;
    this.originalSwitchConversation = null;
    this.originalGetConversationById = null;
  }

  private tryInstall() {
    if (this.plugin) return;
    const plugins = (this.app as App & {
      plugins?: { plugins?: Record<string, unknown> };
    }).plugins?.plugins;
    const candidate = (plugins?.realclaudian ?? plugins?.claudian) as Partial<ClaudianPlugin> | undefined;
    if (
      !candidate ||
      !Array.isArray(candidate.conversations) ||
      typeof candidate.getConversationList !== "function" ||
      typeof candidate.switchConversation !== "function" ||
      typeof candidate.createConversation !== "function" ||
      typeof candidate.updateConversation !== "function"
    ) {
      return;
    }
    const plugin = candidate as ClaudianPlugin;
    this.plugin = plugin;
    this.originalGetConversationList = plugin.getConversationList.bind(plugin);
    this.originalSwitchConversation = plugin.switchConversation.bind(plugin);
    this.originalGetConversationById =
      typeof plugin.getConversationById === "function" ? plugin.getConversationById.bind(plugin) : null;
    plugin.getConversationList = () => this.getMergedConversationList();
    plugin.switchConversation = (id) => this.switchConversation(id);
    if (this.originalGetConversationById) {
      plugin.getConversationById = async (id) => {
        const conversation = (await this.originalGetConversationById?.(id)) ?? null;
        await this.hydrateContinuation(id);
        return conversation;
      };
    }
    void this.hydrateExistingContinuations();
  }

  private getMergedConversationList() {
    if (!this.plugin || !this.originalGetConversationList) return [];
    const list = this.originalGetConversationList();
    const continuationByOrigin = new Map(Object.entries(this.getContinuationMap()));
    for (const conversation of this.plugin.conversations) {
      const originId = getOriginId(conversation);
      if (originId) continuationByOrigin.set(originId, conversation.id);
    }
    return list.filter((item) => {
      const id = typeof item.id === "string" ? item.id : "";
      return !continuationByOrigin.has(id);
    });
  }

  private async switchConversation(id: string) {
    if (!this.plugin || !this.originalSwitchConversation) return null;
    const original = this.plugin.getConversationSync(id);
    if (!original) return this.originalSwitchConversation(id);
    if (this.getOriginForContinuation(id)) {
      const loaded = await this.originalSwitchConversation(id);
      await this.hydrateContinuation(id);
      return loaded;
    }
    if (hasLocalCodexSession(original)) {
      return this.originalSwitchConversation(id);
    }
    const archives = await this.getArchives();
    const archive = archives.find((item) => item.conversationId === id && item.messages.length > 0);
    if (!archive) return this.originalSwitchConversation(id);

    const mappedId = this.getContinuationMap()[id];
    const existing =
      (mappedId ? this.plugin.getConversationSync(mappedId) : null) ??
      this.plugin.conversations.find((conversation) => getOriginId(conversation) === id);
    if (existing) return this.originalSwitchConversation(existing.id);

    const continuation = await this.plugin.createConversation({ providerId: "codex" });
    await this.plugin.updateConversation(continuation.id, {
      title: original.title,
      currentNote: archive.currentNote ?? original.currentNote,
      messages: toClaudianMessages(archive.messages),
      providerState: {
        [ORIGIN_KEY]: id,
        [HANDOFF_KEY]: buildArchiveHandoffPrompt(archive),
        sourceDevices: archive.sourceDevices,
      },
    });
    await this.saveContinuationMap({
      ...this.getContinuationMap(),
      [id]: continuation.id,
    });
    const loaded = await this.originalSwitchConversation(continuation.id);
    window.setTimeout(() => this.patchPendingTabServices(), 0);
    return loaded;
  }

  private async hydrateExistingContinuations() {
    if (!this.plugin) return;
    const continuationIds = this.plugin.conversations
      .filter((conversation) => !!this.getOriginForContinuation(conversation.id))
      .map((conversation) => conversation.id);
    for (const id of continuationIds) {
      await this.hydrateContinuation(id);
    }
    for (const view of this.plugin.getAllViews?.() ?? []) {
      const tabs = view.getTabManager?.()?.getAllTabs?.() ?? [];
      for (const tab of tabs) {
        const conversation = this.plugin.getConversationSync(String(tab.conversationId ?? ""));
        if (!conversation || !this.getOriginForContinuation(conversation.id) || conversation.messages.length === 0) {
          continue;
        }
        tab.controllers?.conversationController?.restoreConversation?.(conversation);
      }
    }
    this.patchPendingTabServices();
  }

  private async hydrateContinuation(id: string) {
    if (!this.plugin) return null;
    const continuation = this.plugin.getConversationSync(id);
    const originId = continuation ? this.getOriginForContinuation(id) : null;
    if (!continuation || !originId) return continuation;
    const archive = (await this.getArchives()).find(
      (item) => item.conversationId === originId && item.messages.length > 0
    );
    if (archive) {
      continuation.messages = mergeClaudianMessages(
        toClaudianMessages(archive.messages),
        continuation.messages
      );
      continuation.currentNote = archive.currentNote ?? continuation.currentNote;
    }
    return continuation;
  }

  private getOriginForContinuation(continuationId: string) {
    for (const [originId, mappedContinuationId] of Object.entries(this.getContinuationMap())) {
      if (mappedContinuationId === continuationId) return originId;
    }
    const conversation = this.plugin?.getConversationSync(continuationId);
    return conversation ? getOriginId(conversation) : null;
  }

  private patchPendingTabServices() {
    if (!this.plugin?.getAllViews) return;
    for (const view of this.plugin.getAllViews()) {
      const tabs = view.getTabManager?.()?.getAllTabs?.() ?? [];
      for (const tab of tabs) {
        const conversationId = typeof tab.conversationId === "string" ? tab.conversationId : "";
        const conversation = conversationId ? this.plugin.getConversationSync(conversationId) : null;
        const state = conversation?.providerState;
        const handoff = state?.[HANDOFF_KEY];
        if (!conversation || typeof handoff !== "string") {
          continue;
        }
        this.wrapServiceQuery(tab.service, conversation, handoff);

        const inputController = tab.controllers?.inputController;
        const deps = inputController?.deps;
        if (
          deps &&
          typeof deps.ensureServiceInitialized === "function" &&
          !deps.__claudianArchiveEnsureWrapped
        ) {
          const originalEnsure = deps.ensureServiceInitialized.bind(deps);
          deps.__claudianArchiveEnsureWrapped = true;
          deps.ensureServiceInitialized = async (...args: unknown[]) => {
            const ready = await originalEnsure(...args);
            const currentHandoff = conversation.providerState?.[HANDOFF_KEY];
            if (ready && typeof currentHandoff === "string") {
              this.wrapServiceQuery(tab.service ?? inputController.getAgentService?.(), conversation, currentHandoff);
            }
            return ready;
          };
        }
      }
    }
  }

  private wrapServiceQuery(
    service: Record<string, any> | null | undefined,
    conversation: ClaudianConversation,
    handoff: string
  ) {
    if (!service || service.__claudianArchiveWrapped || typeof service.query !== "function" || !this.plugin) {
      return;
    }
    const originalQuery = service.query;
    const plugin = this.plugin;
    service.__claudianArchiveWrapped = true;
    service.query = async function* (turn: Record<string, unknown>, history: unknown, options: unknown) {
      const prompt = typeof turn.prompt === "string" ? turn.prompt : "";
      const nextTurn = { ...turn, prompt: `${handoff}\n\n用户的新消息：\n${prompt}` };
      const nextState = { ...(conversation.providerState ?? {}) };
      delete nextState[HANDOFF_KEY];
      conversation.providerState = nextState;
      await plugin.updateConversation(conversation.id, { providerState: nextState });
      yield* originalQuery.call(this, nextTurn, history, options);
    };
  }
}
