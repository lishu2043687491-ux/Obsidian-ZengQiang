/**
 * 版本历史 Agent 自验（替代礼书点 Obsidian GUI）：
 * - 用真实 FileVersionHistoryStore 逻辑 + mock adapter
 * - 模拟 macOS ENAMETOOLONG（深层中文路径 legacy 键 >255）
 * - 断言：list / create / read 全链路不抛错，且走短哈希键
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const bundlePath = path.join(__dirname, "file-version-history-bundle.cjs");

if (!fs.existsSync(bundlePath)) {
  execSync(
    "npx esbuild src/modules/file-version-history.ts --bundle --platform=node --format=cjs --target=es2020 --external:obsidian --outfile=tests/file-version-history-bundle.cjs",
    { cwd: root, stdio: "inherit" }
  );
}

const { __test } = require(bundlePath);
const { FileVersionHistoryStore, primaryStorageKey, encodePath } = __test;

const DEEP_PATH =
  "❶可迁移（new）/200通用能力/210个体能力/213表达力/3️⃣我的实践/02讲可信/场景实践/场景1：youcore学员证言.md";

const VERSIONS_ROOT = ".obsidian/plugins/feishu-doc-toolbar/file-versions";
const INDEX_DIR = `${VERSIONS_ROOT}/indexes`;
const SNAPSHOT_DIR = `${VERSIONS_ROOT}/snapshots`;

function makeEnametoolongAdapter(rootDir) {
  const files = new Map();
  const norm = (p) => String(p).replace(/\\/g, "/");

  const resolve = (p) => path.join(rootDir, norm(p));

  const throwIfTooLong = (p) => {
    const base = path.basename(norm(p));
    if (base.length > 255) {
      const err = new Error(`ENAMETOOLONG: ${base.length}`);
      err.code = "ENAMETOOLONG";
      throw err;
    }
  };

  return {
    async exists(p) {
      throwIfTooLong(p);
      return files.has(norm(p));
    },
    async read(p) {
      throwIfTooLong(p);
      const key = norm(p);
      if (!files.has(key)) throw new Error(`ENOENT ${key}`);
      return files.get(key);
    },
    async write(p, data) {
      throwIfTooLong(p);
      const key = norm(p);
      files.set(key, data);
      fs.mkdirSync(path.dirname(resolve(key)), { recursive: true });
      fs.writeFileSync(resolve(key), data);
    },
    async remove(p) {
      throwIfTooLong(p);
      files.delete(norm(p));
    },
    async list(dir) {
      throwIfTooLong(dir);
      const prefix = norm(dir) + "/";
      const listed = { files: [], folders: [] };
      for (const key of files.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        if (!rest || rest.includes("/")) continue;
        listed.files.push(rest);
      }
      return listed;
    },
  };
}

function makeApp(adapter) {
  const vault = {
    adapter,
    async cachedRead(file) {
      return file.content;
    },
    async createFolder(dir) {
      if (!(await adapter.exists(dir))) {
        await adapter.write(`${dir}/.keep`, "");
      }
    },
    async modify() {},
  };
  return { vault };
}

async function testDeepPathStoreRoundTrip() {
  const tmp = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "fvh-acc-"));
  const adapter = makeEnametoolongAdapter(tmp);
  const app = makeApp(adapter);
  const store = new FileVersionHistoryStore(app);

  const legacy = encodePath(DEEP_PATH);
  assert.ok(legacy.length > 255, "fixture must exceed fs limit");

  const key = primaryStorageKey(DEEP_PATH);
  assert.ok(key.startsWith("h_"), "deep path must use hash key");

  const file = {
    path: DEEP_PATH,
    extension: "md",
    content: "# youcore 学员证言\n\n验收内容\n",
  };

  const pageBefore = await store.listSnapshots(DEEP_PATH);
  assert.equal(pageBefore.total, 0, "empty before bootstrap");

  const meta = await store.createSnapshot(file, "acceptance-bootstrap", { force: true });
  assert.ok(meta?.id, "createSnapshot should succeed");

  const pageAfter = await store.listSnapshots(DEEP_PATH);
  assert.equal(pageAfter.total, 1, "one snapshot after create");
  assert.equal(pageAfter.items[0].id, meta.id);

  const content = await store.readSnapshotContent(DEEP_PATH, meta.id);
  assert.ok(content?.includes("验收内容"), "snapshot content readable");

  const indexPath = `${INDEX_DIR}/${key}.json`;
  assert.ok(await adapter.exists(indexPath), "index uses hash key not legacy");
  let legacyExists = false;
  try {
    legacyExists = await adapter.exists(`${INDEX_DIR}/${legacy}.json`);
  } catch (err) {
    assert.equal(err.code, "ENAMETOOLONG", "legacy key must be unusable on disk");
  }
  assert.ok(!legacyExists, "legacy index path must not exist");

  const snapPath = `${SNAPSHOT_DIR}/${key}/${meta.id}.md`;
  assert.ok(await adapter.exists(snapPath), "snapshot file uses hash dir");

  fs.rmSync(tmp, { recursive: true, force: true });
}

async function testLegacyPathStillWorks() {
  const tmp = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "fvh-acc-"));
  const adapter = makeEnametoolongAdapter(tmp);
  const app = makeApp(adapter);
  const store = new FileVersionHistoryStore(app);

  const shortPath = "YOLO/skills/wangshimin-youcore/SKILL.md";
  const file = { path: shortPath, extension: "md", content: "# skill\n" };
  const meta = await store.createSnapshot(file, "short-path", { force: true });
  assert.ok(meta?.id);
  const shortKey = primaryStorageKey(shortPath);
  assert.ok(shortKey.startsWith("h_"));
  assert.ok(await adapter.exists(`${INDEX_DIR}/${shortKey}.json`));
  fs.rmSync(tmp, { recursive: true, force: true });
}

(async () => {
  await testDeepPathStoreRoundTrip();
  await testLegacyPathStillWorks();
  console.log("file-version-history-acceptance.cjs OK — Agent 自验通过（深层路径 ENAMETOOLONG 已修复）");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
