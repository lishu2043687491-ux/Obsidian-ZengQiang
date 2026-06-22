const assert = require("node:assert/strict");
const path = require("node:path");

const {
  isRemotePluginVersionNewer,
  readPluginUpdatesRecord,
  resetAutoUpdateCatalogCacheForTests,
  runManagedPluginAutoUpdate,
} = require(path.resolve(__dirname, "managed-plugin-auto-updater-bundle.cjs"));

function makeManifest(id, version) {
  return { id, name: id, version, minAppVersion: "1.0.0" };
}

assert.equal(isRemotePluginVersionNewer("1.5.11", "1.5.12"), true);
assert.equal(isRemotePluginVersionNewer("1.5.11.1", "1.5.11"), false);
assert.equal(isRemotePluginVersionNewer("2.0.21", "2.0.21"), false);

assert.deepEqual(
  readPluginUpdatesRecord({
    yolo: {
      repo: "lapis0x0/obsidian-yolo",
      version: "1.5.12",
      manifest: makeManifest("yolo", "1.5.12"),
    },
  }),
  {
    yolo: {
      repo: "lapis0x0/obsidian-yolo",
      version: "1.5.12",
      manifest: makeManifest("yolo", "1.5.12"),
    },
  }
);

assert.deepEqual(readPluginUpdatesRecord(new Map()), {});
assert.deepEqual(readPluginUpdatesRecord(null), {});

function makeFetchJson(remoteVersions) {
  return async (url) => {
    if (url.includes("community-plugins.json")) {
      return [
        { id: "yolo", repo: "lapis0x0/obsidian-yolo" },
        { id: "realclaudian", repo: "yishentu/claudian" },
      ];
    }
    if (url.includes("lapis0x0/obsidian-yolo")) {
      return makeManifest("yolo", remoteVersions.yolo);
    }
    if (url.includes("yishentu/claudian")) {
      return makeManifest("realclaudian", remoteVersions.realclaudian);
    }
    throw new Error(`unexpected url: ${url}`);
  };
}

async function runObsidianShapeIntegration() {
  resetAutoUpdateCatalogCacheForTests();
  const installed = [];
  const disabled = [];
  const enabled = [];
  const app = {
    plugins: {
      manifests: {
        yolo: makeManifest("yolo", "1.5.11"),
        realclaudian: makeManifest("realclaudian", "2.0.17"),
      },
      enabledPlugins: new Set(["yolo", "realclaudian"]),
      disablePlugin: async (id) => {
        disabled.push(id);
      },
      installPlugin: async (repo, version, manifest) => {
        installed.push({ repo, version, id: manifest.id });
      },
      loadManifest: async () => {},
      enablePluginAndSave: async (id) => {
        enabled.push(id);
      },
    },
  };

  const fetchJson = makeFetchJson({ yolo: "1.5.12", realclaudian: "2.0.18" });
  const { results, summary } = await runManagedPluginAutoUpdate(app, ["yolo", "realclaudian"], {
    fetchJson,
  });
  assert.equal(installed.length, 2);
  assert.deepEqual(disabled, ["yolo", "realclaudian"]);
  assert.deepEqual(enabled, ["yolo", "realclaudian"]);
  assert.equal(results.filter((item) => item.status === "updated").length, 2);
  assert.match(summary, /已自动更新 2 个插件/);
}

async function runUpToDateIntegration() {
  resetAutoUpdateCatalogCacheForTests();
  const installed = [];
  const app = {
    plugins: {
      manifests: {
        yolo: makeManifest("yolo", "1.5.12"),
        realclaudian: makeManifest("realclaudian", "2.0.21"),
      },
      enabledPlugins: new Set(["yolo", "realclaudian"]),
      installPlugin: async () => {
        installed.push("should-not-install");
      },
    },
  };

  const fetchJson = makeFetchJson({ yolo: "1.5.12", realclaudian: "2.0.21" });
  const { results, summary } = await runManagedPluginAutoUpdate(app, ["yolo", "realclaudian"], {
    fetchJson,
  });
  assert.equal(installed.length, 0);
  assert.equal(results.filter((item) => item.status === "up_to_date").length, 2);
  assert.match(summary, /白名单插件均已是最新版本/);
}

Promise.all([runObsidianShapeIntegration(), runUpToDateIntegration()])
  .then(() => {
    console.log("managed-plugin-auto-updater integration tests passed");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
