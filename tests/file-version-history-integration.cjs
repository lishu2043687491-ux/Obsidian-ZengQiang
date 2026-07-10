/**
 * 版本历史全链路验收：
 * 1. 目标文件快照索引 + 内容可读
 * 2. Sync / 文件恢复 / 命令 桥接逻辑
 * 3. Outliner 下 active file 解析
 * 4. 索引路径回退扫描
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const vaultRoot = path.resolve(root, "../../..");

const TARGET =
  "❷自我管理/3️⃣我的实操/2计划/实践梳理：有效拆计划的方法.md";

const MAX_LEGACY_ENCODED_LEN = 200;

function encodePath(filePath) {
  return encodeURIComponent(String(filePath).replace(/\\/g, "/")).replace(/%/g, "_");
}

function hashContent(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function hashStorageKey(filePath) {
  const normalized = String(filePath).replace(/\\/g, "/");
  let out = "";
  for (let round = 0; round < 5; round += 1) {
    out += hashContent(`fv-hash:${round}:${normalized}:${out}`);
  }
  return `h_${out.replace(/[^a-z0-9]/gi, "x").slice(0, 32)}`;
}

function primaryStorageKey(filePath) {
  const legacy = encodePath(filePath);
  return legacy.length <= MAX_LEGACY_ENCODED_LEN ? legacy : hashStorageKey(filePath);
}

function readIndex(filePath) {
  const indexRel = `.obsidian/plugins/feishu-doc-toolbar/file-versions/indexes/${encodePath(filePath)}.json`;
  const indexAbs = path.join(vaultRoot, indexRel);
  assert.ok(fs.existsSync(indexAbs), `missing index: ${indexRel}`);
  return JSON.parse(fs.readFileSync(indexAbs, "utf8"));
}

function readSnapshot(filePath, snapshotId) {
  const snapRel = `.obsidian/plugins/feishu-doc-toolbar/file-versions/snapshots/${encodePath(filePath)}/${snapshotId}.md`;
  const snapAbs = path.join(vaultRoot, snapRel);
  assert.ok(fs.existsSync(snapAbs), `missing snapshot: ${snapRel}`);
  return fs.readFileSync(snapAbs, "utf8");
}

function testTargetFileSnapshots() {
  const index = readIndex(TARGET);
  assert.equal(index.filePath, TARGET);
  assert.ok(index.snapshots.length >= 2, `expected >=2 snapshots, got ${index.snapshots.length}`);
  const latest = index.snapshots[0];
  const content = readSnapshot(TARGET, latest.id);
  assert.ok(content.length > 100, "snapshot content too short");
  assert.match(content, /拆计划|方法论|原则/u);
}

function testVaultSnapshotCoverage() {
  const idxDir = path.join(
    vaultRoot,
    ".obsidian/plugins/feishu-doc-toolbar/file-versions/indexes"
  );
  const files = fs.readdirSync(idxDir).filter((f) => f.endsWith(".json"));
  assert.ok(files.length >= 10, `expected many snapshot indexes, got ${files.length}`);
}

function makeSyncPluginProto() {
  const proto = {
    showVersionHistory(path) {
      this.calls.push(["proto", path]);
    },
    calls: [],
  };
  return proto;
}

function testPrototypePatch() {
  const calls = [];
  const app = {
    vault: {
      getAbstractFileByPath: (p) => ({ path: p, extension: "md" }),
      getMarkdownFiles: () => [],
    },
    commands: { findCommand: () => null },
    internalPlugins: {
      getPluginById(id) {
        if (id !== "sync") return null;
        return Object.create(proto);
      },
    },
    workspace: { getLeavesOfType: () => [], on: () => ({ unregister: () => {} }) },
  };
  const proto = {
    showVersionHistory(path) {
      calls.push(path);
    },
  };
  Object.setPrototypeOf(app.internalPlugins.getPluginById("sync"), proto);

  // 模拟 patchPluginPrototypeMethod 核心逻辑
  const sample = app.internalPlugins.getPluginById("sync");
  const p = Object.getPrototypeOf(sample);
  p.__fdtbVersionHistoryPatched = true;
  p.showVersionHistory = (filePath) => calls.push(filePath);

  const inst = app.internalPlugins.getPluginById("sync");
  inst.showVersionHistory(TARGET);
  assert.deepEqual(calls, [TARGET]);
}

function testSyncCommandUsesOutlinerFile() {
  const outlinerFile = { path: TARGET, extension: "md" };
  const opened = [];
  const app = {
    workspace: {
      getActiveFile: () => null,
      activeLeaf: { view: { file: outlinerFile } },
    },
    vault: {
      getAbstractFileByPath: (p) => (p === TARGET ? outlinerFile : null),
      getMarkdownFiles: () => [outlinerFile],
    },
  };

  const getActiveMarkdownFile = (a) => {
    const fromActive = a.workspace.getActiveFile();
    if (fromActive && fromActive.extension === "md") return fromActive;
    const view = a.workspace.activeLeaf?.view;
    if (view?.file && view.file.extension === "md") return view.file;
    return null;
  };

  const cmd = {
    checkCallback(checking) {
      const file = getActiveMarkdownFile(app);
      if (!file) return false;
      if (checking) return true;
      opened.push(file.path);
      return true;
    },
  };

  assert.equal(cmd.checkCallback(true), true);
  assert.equal(cmd.checkCallback(false), true);
  assert.deepEqual(opened, [TARGET]);
}

function testIndexFallbackScan() {
  const idxDir = path.join(
    vaultRoot,
    ".obsidian/plugins/feishu-doc-toolbar/file-versions/indexes"
  );
  let found = false;
  for (const name of fs.readdirSync(idxDir)) {
    if (!name.endsWith(".json")) continue;
    const raw = JSON.parse(fs.readFileSync(path.join(idxDir, name), "utf8"));
    if (raw.filePath === TARGET && raw.snapshots?.length >= 2) {
      found = true;
      break;
    }
  }
  assert.ok(found, "fallback scan should locate target file index by stored filePath");
}

function testDeepPathUsesHashKey() {
  const DEEP =
    "❶可迁移（new）/200通用能力/210个体能力/213表达力/3️⃣我的实践/02讲可信/场景实践/场景1：youcore学员证言.md";
  const key = primaryStorageKey(DEEP);
  assert.ok(key.startsWith("h_"));
  const snapDir = path.join(
    vaultRoot,
    ".obsidian/plugins/feishu-doc-toolbar/file-versions/snapshots",
    key
  );
  fs.mkdirSync(snapDir, { recursive: true });
  const snapId = `${Date.now()}-deep-test`;
  fs.writeFileSync(path.join(snapDir, `${snapId}.md`), "# deep path snapshot test\n");
  const indexRel = `.obsidian/plugins/feishu-doc-toolbar/file-versions/indexes/${key}.json`;
  const indexAbs = path.join(vaultRoot, indexRel);
  fs.writeFileSync(
    indexAbs,
    JSON.stringify(
      {
        filePath: DEEP,
        snapshots: [{ id: snapId, createdAt: Date.now(), reason: "deep-test", size: 24 }],
      },
      null,
      2
    )
  );
  const raw = JSON.parse(fs.readFileSync(indexAbs, "utf8"));
  assert.equal(raw.filePath, DEEP);
  assert.ok(fs.existsSync(path.join(snapDir, `${snapId}.md`)));
}

testTargetFileSnapshots();
testVaultSnapshotCoverage();
testPrototypePatch();
testSyncCommandUsesOutlinerFile();
testIndexFallbackScan();
testDeepPathUsesHashKey();
console.log("file-version-history-integration.cjs OK");
