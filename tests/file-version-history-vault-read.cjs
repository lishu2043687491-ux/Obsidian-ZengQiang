/**
 * 读 vault 内 youcore 真索引（存储层 + 路径规范化回归）
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const vaultRoot = path.resolve(root, "../../..");
const bundlePath = path.join(__dirname, "file-version-history-bundle.cjs");

if (!fs.existsSync(bundlePath)) {
  execSync("npm run build:fvh-test", { cwd: root, stdio: "inherit" });
}

process.env.NODE_PATH = path.join(root, "test-support");
require("module").Module._initPaths();

const { __test } = require(bundlePath);
const { FileVersionHistoryStore, DEEP_PATH_FIXTURE, canonicalizeVaultPath } = __test;

const adapter = {
  async exists(p) {
    return fs.existsSync(path.join(vaultRoot, p));
  },
  async read(p) {
    return fs.readFileSync(path.join(vaultRoot, p), "utf8");
  },
  async write() {},
  async remove() {},
  async list(dir) {
    const abs = path.join(vaultRoot, dir);
    if (!fs.existsSync(abs)) return { files: [], folders: [] };
    return {
      files: fs.readdirSync(abs).filter((f) => f.endsWith(".json")),
      folders: [],
    };
  },
};

const app = {
  vault: {
    adapter,
    async cachedRead() {
      return "# fixture\n";
    },
    async createFolder() {},
    async modify() {},
  },
};

async function main() {
  const store = new FileVersionHistoryStore(app);
  const page = await store.listSnapshots(DEEP_PATH_FIXTURE, 0, 10);
  assert.ok(page.total >= 1, `expected >=1 snapshot for youcore fixture, got ${page.total}`);

  const halfPath = DEEP_PATH_FIXTURE.replace("：", ":");
  const pageHalf = await store.listSnapshots(halfPath, 0, 10);
  assert.ok(
    pageHalf.total >= 1,
    `half-width colon path should resolve snapshots, got ${pageHalf.total}`
  );

  if (page.items[0]?.id) {
    const content = await store.readSnapshotContent(DEEP_PATH_FIXTURE, page.items[0].id);
    assert.ok(content && content.length > 10, "snapshot content should be readable");
  }

  assert.ok(canonicalizeVaultPath(halfPath).includes("："), "canonicalize converts colon");
  console.log("file-version-history-vault-read.cjs OK", { total: page.total, canonical: canonicalizeVaultPath(DEEP_PATH_FIXTURE).slice(-20) });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
