const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pluginRoot = path.resolve(__dirname, "..");

function readSource(relativePath) {
  const fullPath = path.join(pluginRoot, relativePath);
  assert.ok(fs.existsSync(fullPath), `missing contract source: ${relativePath}`);
  return fs.readFileSync(fullPath, "utf8");
}

const expectedActionIds = [
  "next-row",
  "next-cell",
  "previous-cell",
  "format-table",
  "format-all-tables",
  "insert-column",
  "insert-row",
  "escape-table",
  "left-align-column",
  "center-align-column",
  "right-align-column",
  "move-column-left",
  "move-column-right",
  "move-row-up",
  "move-row-down",
  "delete-column",
  "delete-row",
  "sort-rows-ascending",
  "sort-rows-descending",
  "transpose",
  "evaluate-formulas",
  "export-csv",
  "table-control-bar",
];

const actionsSource = readSource("src/modules/advanced-tables-embedded/actions.ts");
const floatingControlsSource = readSource("src/modules/advanced-tables-embedded/floating-controls.ts");
const settingsSource = readSource("src/modules/advanced-tables-embedded/settings.ts");
const stylesSource = readSource("styles.css");

const actionIdType = actionsSource.match(
  /export\s+type\s+AdvancedTableActionId\s*=\s*([\s\S]*?);/,
);
assert.ok(actionIdType, "actions.ts must export the AdvancedTableActionId union");

const actionIdsFromType = [...actionIdType[1].matchAll(/["']([^"']+)["']/g)].map((match) => match[1]);
assert.deepEqual(
  [...new Set(actionIdsFromType)].sort(),
  [...expectedActionIds].sort(),
  "AdvancedTableActionId must contain exactly the 23 supported visual-control actions",
);

const actionEntries = [...actionsSource.matchAll(/\{([^{}]*\bid\s*:\s*["'][^"']+["'][^{}]*)\}/g)].map(
  (match) => match[1],
);
const actionEntriesById = new Map();
for (const entry of actionEntries) {
  const id = entry.match(/\bid\s*:\s*["']([^"']+)["']/)?.[1];
  if (id) actionEntriesById.set(id, entry);
}

assert.equal(
  actionEntriesById.size,
  expectedActionIds.length,
  "actions.ts must define metadata for every AdvancedTableActionId and no extra action",
);
for (const actionId of expectedActionIds) {
  const entry = actionEntriesById.get(actionId);
  assert.ok(entry, `missing visual-control action metadata: ${actionId}`);
  assert.match(
    entry,
    /\blabel\s*:\s*["'][^"']*[\u3400-\u9fff][^"']*["']/,
    `${actionId} needs a Chinese label`,
  );
  assert.match(
    entry,
    /\bicon\s*:\s*["'][^"']+["]|\bicon\s*:\s*'[^']+'/,
    `${actionId} needs a non-empty icon`,
  );
}

assert.match(
  floatingControlsSource,
  /(?:createElement|createEl)\(\s*["']button["']/,
  "floating controls must use semantic button elements",
);
assert.match(
  floatingControlsSource,
  /createHandle\(\s*["']table["']\s*,\s*["']表["']\s*,\s*["'][^"']+["']\s*,\s*["'][^"']*表[^"']*["']\s*\)/,
  "the table floating handle must visibly say 表",
);
assert.match(
  floatingControlsSource,
  /createHandle\(\s*["']image["']\s*,\s*["']图["']\s*,\s*["'][^"']+["']\s*,\s*["'][^"']*图[^"']*["']\s*\)/,
  "the image floating handle must visibly say 图",
);
assert.match(
  floatingControlsSource,
  /createHandle\([\s\S]*?button\.setAttribute\(\s*["']aria-label["']\s*,\s*title\s*\)/,
  "the table and image floating handles must forward their Chinese titles to aria-label",
);
assert.match(
  floatingControlsSource,
  /\bsetIcon\s*\(/,
  "the action popover must render action icons",
);
assert.match(
  floatingControlsSource,
  /\baction\.icon\b[\s\S]{0,320}\baction\.label\b|\baction\.label\b[\s\S]{0,320}\baction\.icon\b/,
  "the action popover must render each action's icon and text label together",
);

assert.match(
  floatingControlsSource,
  /getRightClickCopyAsImageRunner/,
  "the image handle must bridge to the established right-click copy-as-image runner",
);
assert.match(
  floatingControlsSource,
  /copyTableElementAsImage\s*\(\s*[^,]+\s*,\s*[^)]+\s*\)/,
  "the image handle must call the runner's table-image export method",
);
assert.doesNotMatch(
  floatingControlsSource,
  /\bMutationObserver\b/,
  "floating controls must be event-driven and must not poll the DOM with MutationObserver",
);
assert.match(
  floatingControlsSource,
  /(?:\.on\(|addEventListener\(|registerEvent\()/,
  "floating controls must subscribe to lifecycle or pointer events",
);

for (const setting of ["showFloatingControls", "showColorBlocks", "showZebraStripes"]) {
  assert.match(
    settingsSource,
    new RegExp(`\\b${setting}\\s*:\\s*boolean\\b`),
    `settings.ts must type ${setting} as a boolean`,
  );
}
assert.match(settingsSource, /\bshowFloatingControls\s*:\s*true\b/, "showFloatingControls must default to enabled");
assert.match(settingsSource, /\bshowColorBlocks\s*:\s*true\b/, "showColorBlocks must default to enabled");
assert.match(settingsSource, /\bshowZebraStripes\s*:\s*false\b/, "showZebraStripes must default to disabled");

const colorBlocksClass = floatingControlsSource.match(
  /\bconst\s+COLOR_CLASS\s*=\s*["']([a-z0-9_-]*(?:color|colour)[a-z0-9_-]*(?:block|blocks)[a-z0-9_-]*)["']/i,
)?.[1];
assert.ok(colorBlocksClass, "floating controls must name the mature-table color-block body class");
assert.match(
  stylesSource,
  new RegExp(`\\bbody\\.${colorBlocksClass}\\b`),
  "styles.css must define the mature-table color-block body class",
);
assert.match(
  floatingControlsSource,
  /classList\.toggle\(\s*COLOR_CLASS\s*,\s*this\.host\.getShowColorBlocks\(\)\s*\)/,
  "showColorBlocks must toggle the styles.css body class",
);
const zebraClass = floatingControlsSource.match(
  /\bconst\s+ZEBRA_CLASS\s*=\s*["']([a-z0-9_-]*zebra[a-z0-9_-]*)["']/i,
)?.[1];
assert.ok(zebraClass, "floating controls must name the mature-table zebra body class");
assert.match(
  stylesSource,
  new RegExp(`\\bbody\\.${colorBlocksClass}\\.${zebraClass}\\b`),
  "zebra stripes must require both the master color-block and zebra classes",
);
assert.match(
  stylesSource,
  new RegExp(`\\bbody\\.${colorBlocksClass}:not\\(\\.${zebraClass}\\)`),
  "current-row highlighting must be disabled while zebra stripes are enabled",
);
assert.match(
  stylesSource,
  /tr:is\(:hover,\s*:focus-within\)\s*>\s*td/,
  "non-zebra color mode must highlight the hovered or editing-focused whole row",
);
assert.doesNotMatch(
  stylesSource,
  new RegExp(`body\\.${colorBlocksClass}[\\s\\S]{0,1000}tbody\\s*>\\s*tr\\s*>\\s*td:first-child`),
  "the visual color mode must not separately highlight the first column",
);
assert.match(
  floatingControlsSource,
  /hidePopover\(\);[\s\S]{0,240}findTableFromTarget\(target\)/,
  "any click outside the floating controls must close the popover before selecting a table",
);
assert.match(
  floatingControlsSource,
  /target\s+instanceof\s+Element/,
  "outside-click handling must support SVG and other non-HTMLElement targets",
);
assert.match(
  floatingControlsSource,
  /classList\.toggle\(\s*ZEBRA_CLASS\s*,\s*this\.host\.getShowColorBlocks\(\)\s*&&\s*this\.host\.getShowZebraStripes\(\)\s*,?\s*\)/,
  "zebra body styling must remain off while the master color-block switch is disabled",
);
assert.match(
  floatingControlsSource,
  /setShowZebraStripes\(\s*!this\.host\.getShowZebraStripes\(\)\s*\)/,
  "the floating display panel must let users change the zebra preference",
);

const newVisualControlSource = `${actionsSource}\n${floatingControlsSource}`;
assert.doesNotMatch(
  newVisualControlSource,
  /(?:%%\s*)?mdtp\s*:/i,
  "advanced visual controls must not write or introduce mdtp markers",
);

console.log("advanced tables visual controls contract passed");
