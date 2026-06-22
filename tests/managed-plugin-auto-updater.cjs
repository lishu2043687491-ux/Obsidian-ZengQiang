const assert = require("node:assert/strict");
const path = require("node:path");

const {
  DEFAULT_AUTO_UPDATE_PLUGIN_IDS,
  normalizeAutoUpdatePluginIds,
  normalizeAutoUpdateResults,
  resolveAutoUpdatePluginId,
  formatAutoUpdateResult,
  readPluginUpdatesRecord,
  isAutoUpdateBlockedPluginId,
  isRemotePluginVersionNewer,
} = require(path.resolve(__dirname, "managed-plugin-auto-updater-bundle.cjs"));

assert.deepEqual([...DEFAULT_AUTO_UPDATE_PLUGIN_IDS], ["yolo", "realclaudian"]);

assert.equal(resolveAutoUpdatePluginId("claudian"), "realclaudian");
assert.equal(resolveAutoUpdatePluginId(" yolo "), "yolo");
assert.equal(resolveAutoUpdatePluginId(""), "");

assert.deepEqual(normalizeAutoUpdatePluginIds(undefined), ["yolo", "realclaudian"]);
assert.deepEqual(normalizeAutoUpdatePluginIds(["yolo", "claudian", "yolo", ""]), [
  "yolo",
  "realclaudian",
]);
assert.deepEqual(normalizeAutoUpdatePluginIds([]), ["yolo", "realclaudian"]);
assert.equal(isAutoUpdateBlockedPluginId("feishu-doc-toolbar"), true);
assert.deepEqual(
  normalizeAutoUpdatePluginIds(["yolo", "feishu-doc-toolbar", "realclaudian"]),
  ["yolo", "realclaudian"]
);

const normalizedResults = normalizeAutoUpdateResults({
  yolo: { status: "updated", fromVersion: "1.0.0", toVersion: "1.1.0", at: 100 },
  bad: { status: "unknown", at: 1 },
});
assert.equal(normalizedResults.yolo.status, "updated");
assert.equal(normalizedResults.yolo.fromVersion, "1.0.0");
assert.equal(normalizedResults.yolo.toVersion, "1.1.0");
assert.equal(normalizedResults.bad, undefined);

assert.ok(readPluginUpdatesRecord({ yolo: { repo: "a/b", version: "1.0.0", manifest: { id: "yolo", version: "1.0.0" } } }).yolo);

assert.equal(isRemotePluginVersionNewer("1.0.0", "1.1.0"), true);
assert.equal(isRemotePluginVersionNewer("2.0.1", "2.0.0"), false);

assert.match(
  formatAutoUpdateResult({
    pluginId: "realclaudian",
    status: "updated",
    fromVersion: "2.0.0",
    toVersion: "2.0.1",
    at: Date.now(),
  }),
  /Claudian.*2\.0\.0.*2\.0\.1/
);

console.log("managed-plugin-auto-updater tests passed");
