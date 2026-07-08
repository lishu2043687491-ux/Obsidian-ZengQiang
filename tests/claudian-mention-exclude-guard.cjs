const assert = require("node:assert/strict");

const {
  CLAUDIAN_MENTION_GUARD_LOG_PATH,
  CLAUDIAN_SETTINGS_PATH,
  VAULT_IGNORE_PATH,
  ensureClaudianMentionExcludeGuard,
  upsertClaudianExcludedPathsJson,
  upsertVaultIgnoreRules,
} = require("./claudian-mention-exclude-guard-bundle.cjs");

class MemoryAdapter {
  constructor(files = {}) {
    this.files = new Map(Object.entries(files));
    this.folders = new Set([""]);
  }

  async exists(path) {
    return this.files.has(path) || this.folders.has(path);
  }

  async read(path) {
    if (!this.files.has(path)) throw new Error(`missing file: ${path}`);
    return this.files.get(path);
  }

  async write(path, data) {
    this.files.set(path, data);
  }

  async append(path, data) {
    this.files.set(path, `${this.files.get(path) || ""}${data}`);
  }

  async mkdir(path) {
    this.folders.add(path);
  }
}

function makeApp(adapter) {
  return { vault: { adapter } };
}

(async () => {
  {
    const next = upsertClaudianExcludedPathsJson('{"model":"x","excludedPaths":["已有"]}\n');
    const parsed = JSON.parse(next.json);
    assert.equal(next.changed, true);
    assert.deepEqual(parsed.excludedPaths, ["已有", "开发插件（Obsidian优化）"]);
    assert.equal(parsed.model, "x");
  }

  {
    const next = upsertVaultIgnoreRules("# existing\n");
    assert.equal(next.changed, true);
    assert.match(next.content, /开发插件（Obsidian优化）\//);
    assert.match(next.content, /开发插件（Obsidian优化）\/\*\*/);
  }

  {
    const adapter = new MemoryAdapter({
      [CLAUDIAN_SETTINGS_PATH]: '{"provider":"codex"}\n',
      [VAULT_IGNORE_PATH]: "# keep\n",
    });
    const result = await ensureClaudianMentionExcludeGuard(makeApp(adapter), {
      now: () => new Date("2026-07-07T10:00:00+08:00"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.changed, true);
    assert.deepEqual(JSON.parse(adapter.files.get(CLAUDIAN_SETTINGS_PATH)).excludedPaths, [
      "开发插件（Obsidian优化）",
    ]);
    assert.match(adapter.files.get(VAULT_IGNORE_PATH), /开发插件（Obsidian优化）\/\*\*/);
    assert.equal(adapter.files.has(CLAUDIAN_MENTION_GUARD_LOG_PATH), false);
  }

  {
    const notices = [];
    const warnings = [];
    const adapter = new MemoryAdapter({
      [CLAUDIAN_SETTINGS_PATH]: "{broken",
      [VAULT_IGNORE_PATH]: "开发插件（Obsidian优化）/\n开发插件（Obsidian优化）/**\n",
    });
    const result = await ensureClaudianMentionExcludeGuard(makeApp(adapter), {
      now: () => new Date("2026-07-07T10:00:00+08:00"),
      notifyFailure: (message) => notices.push(message),
      console: { info() {}, warn: (...args) => warnings.push(args) },
    });
    assert.equal(result.ok, false);
    assert.equal(adapter.files.get(CLAUDIAN_SETTINGS_PATH), "{broken");
    assert.match(adapter.files.get(CLAUDIAN_MENTION_GUARD_LOG_PATH), /Claudian 设置修复失败/);
    assert.equal(notices.length, 1);
    assert.equal(warnings.length, 1);
  }

  console.log("claudian mention exclude guard tests passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
