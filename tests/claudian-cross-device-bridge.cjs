const assert = require("node:assert/strict");

global.window = {
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout,
};

const { ClaudianCrossDeviceBridge } = require("./claudian-test-bundle.cjs");

async function collect(iterable) {
  const values = [];
  for await (const value of iterable) values.push(value);
  return values;
}

async function run() {
  const origin = {
    id: "conv-remote",
    providerId: "codex",
    title: "远端会话",
    createdAt: 1,
    updatedAt: 2,
    sessionId: "remote-thread",
    messages: [],
    providerState: {
      threadId: "remote-thread",
      sessionFilePath: "/Users/another/.codex/sessions/missing.jsonl",
    },
  };
  const conversations = [origin];
  const tab = {
    conversationId: null,
    service: null,
    controllers: {
      inputController: {
        deps: {
          async ensureServiceInitialized() {
            tab.service = {
              async *query(turn) {
                yield turn.prompt;
              },
            };
            return true;
          },
        },
        getAgentService() {
          return tab.service;
        },
      },
    },
  };
  const plugin = {
    conversations,
    getConversationList() {
      return conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages.length,
      }));
    },
    getConversationSync(id) {
      return conversations.find((conversation) => conversation.id === id) ?? null;
    },
    async getConversationById(id) {
      return this.getConversationSync(id);
    },
    async createConversation() {
      const conversation = {
        id: "conv-local",
        providerId: "codex",
        title: "新会话",
        createdAt: 3,
        updatedAt: 3,
        sessionId: null,
        messages: [],
      };
      conversations.unshift(conversation);
      return conversation;
    },
    async updateConversation(id, updates) {
      Object.assign(this.getConversationSync(id), updates);
    },
    async switchConversation(id) {
      tab.conversationId = id;
      return this.getConversationSync(id);
    },
    getAllViews() {
      return [{ getTabManager: () => ({ getAllTabs: () => [tab] }) }];
    },
  };
  const app = { plugins: { plugins: { realclaudian: plugin } } };
  const archive = {
    schemaVersion: 1,
    conversationId: origin.id,
    sourceProvider: "codex",
    sourcePlugin: "claudian",
    archiveType: "lightweight-chat",
    archiveScope: "cross-device",
    canResume: false,
    title: origin.title,
    createdAt: 1,
    updatedAt: 2,
    lastArchivedAt: 3,
    sourceDevice: "MacBook-Pro",
    sourceDevices: ["MacBook-Pro"],
    archivePaths: ["remote.json"],
    messages: [
      { role: "user", createdAt: 10, text: "旧问题" },
      { role: "assistant", createdAt: 11, text: "旧回答" },
    ],
    omitted: {
      toolLogs: true,
      images: true,
      attachments: true,
      largeOutputs: false,
    },
  };

  let continuationMap = {};
  const bridge = new ClaudianCrossDeviceBridge(
    app,
    async () => [archive],
    () => ({ ...continuationMap }),
    async (value) => {
      continuationMap = { ...value };
    }
  );
  bridge.start();

  const loaded = await plugin.switchConversation(origin.id);
  assert.equal(loaded.id, "conv-local", "remote conversation should redirect to a local continuation");
  assert.equal(loaded.title, origin.title);
  assert.equal(loaded.messages.length, 2, "archived messages should remain visible in Claudian");
  assert.equal(continuationMap[origin.id], loaded.id, "origin-to-continuation mapping should persist outside Claudian");
  assert.deepEqual(
    plugin.getConversationList().map((item) => item.id),
    ["conv-local"],
    "origin placeholder and local continuation should render as one history item"
  );

  await new Promise((resolve) => setTimeout(resolve, 5));
  await tab.controllers.inputController.deps.ensureServiceInitialized();
  const output = await collect(tab.service.query({ prompt: "继续分析" }));
  assert.ok(output[0].includes("<claudian_cross_device_handoff>"));
  assert.ok(output[0].includes("旧问题"));
  assert.ok(output[0].includes("用户的新消息：\n继续分析"));
  assert.equal(
    "claudianArchiveHandoffPending" in loaded.providerState,
    false,
    "handoff should be consumed only once"
  );

  loaded.messages = [];
  loaded.providerState = {
    threadId: "local-thread",
    sessionFilePath: "/tmp/local-thread.jsonl",
  };
  const rehydrated = await plugin.getConversationById(loaded.id);
  assert.equal(rehydrated.messages.length, 2, "continuation messages should rehydrate after restart");

  loaded.messages = [{ id: "local-user", role: "user", content: "本机新问题", timestamp: 20 }];
  const mergedAfterResume = await plugin.getConversationById(loaded.id);
  assert.equal(mergedAfterResume.messages.length, 3, "archive history and local thread messages should merge");
  assert.equal(mergedAfterResume.messages[2].content, "本机新问题");

  bridge.stop();
  assert.equal(plugin.getConversationList().length, 2, "unload should restore Claudian's original methods");
  console.log("claudian-cross-device-bridge acceptance passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
