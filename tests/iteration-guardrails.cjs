const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const pluginRoot = path.resolve(__dirname, "..");
const vaultRoot = path.resolve(pluginRoot, "..", "..", "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(pluginRoot, relativePath), "utf8"));
}

function readVault(relativePath) {
  return fs.readFileSync(path.join(vaultRoot, relativePath), "utf8");
}

const manifest = readJson("manifest.json");
const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");

assert.strictEqual(
  packageJson.version,
  manifest.version,
  "package.json version must match manifest.json"
);
assert.strictEqual(
  packageLock.version,
  manifest.version,
  "package-lock.json top-level version must match manifest.json"
);
assert.strictEqual(
  packageLock.packages[""].version,
  manifest.version,
  "package-lock root package version must match manifest.json"
);

const agentGuide = fs.readFileSync(path.join(pluginRoot, "AGENTS.md"), "utf8");
[
  "1-插件是什么.md",
  "2-怎么开发.md",
  "3-不能做什么.md",
  "legacy enhanced",
  "file-versions/",
  "data.json",
].forEach((needle) => {
  assert(
    agentGuide.includes(needle),
    `AGENTS.md must include handoff guardrail: ${needle}`
  );
});

const gitDir = path.join(vaultRoot, ".dev-git");
if (fs.existsSync(gitDir)) {
  const gitignore = readVault(".gitignore");
  [
    ".obsidian/plugins/*/data.json",
    ".obsidian/plugins/*/file-versions",
    ".obsidian/plugins/*/*.bak*",
    ".obsidian/plugins/*/**/*.bak*",
    "开发插件（Obsidian优化）/0️⃣系统信息库/**/*.bak*",
  ].forEach((needle) => {
    assert(gitignore.includes(needle), `.gitignore must ignore ${needle}`);
  });

  const trackedRuntimePatterns = [
    ".obsidian/plugins/feishu-doc-toolbar/file-versions",
    ".obsidian/plugins/feishu-doc-toolbar/data.json.bak-*",
    ".obsidian/plugins/feishu-doc-toolbar/main.js.bak-*",
    ".obsidian/plugins/feishu-doc-toolbar/styles.css.bak-*",
    ".obsidian/plugins/feishu-doc-toolbar/package.json.bak-*",
    ".obsidian/plugins/feishu-doc-toolbar/src/*.bak-*",
  ];

  for (const pattern of trackedRuntimePatterns) {
    const result = spawnSync(
      "git",
      [`--git-dir=${gitDir}`, `--work-tree=${vaultRoot}`, "ls-files", pattern],
      { encoding: "utf8" }
    );
    assert.strictEqual(result.status, 0, result.stderr);
    assert.strictEqual(
      result.stdout.trim(),
      "",
      `runtime files must not be tracked: ${pattern}`
    );
  }
}

console.log("iteration guardrails passed");
