const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("src/modules/native-table-enhancer-embedded.ts", "utf8");
const cssSource = fs.readFileSync("src/modules/native-table-enhancer-embedded.css", "utf8");

const formatMarkerCalls = [...source.matchAll(/formatTableMarker\(/g)].map((match) => match.index ?? -1);
assert.equal(
  formatMarkerCalls.length,
  2,
  "only the legacy marker migration helper and the formatter definition may reference formatTableMarker"
);

assert.doesNotMatch(
  source,
  /await this\.migrateLegacyMarkersToHtmlComments\(\);/,
  "plugin startup must not silently rewrite user notes to migrate table markers"
);

assert.match(
  source,
  /id: MIGRATE_CURRENT_FILE_TABLE_MARKERS_COMMAND_ID,[\s\S]*?migrateCurrentFileTableMarkersToMarkerless\(file\)/,
  "legacy marker cleanup must be exposed as an explicit current-file command"
);

assert.match(
  source,
  /migrateCurrentFileTableMarkersToMarkerless\(file: TFile\)[\s\S]*?createSnapshot\(file, "before-markerless-migration"[\s\S]*?markerless: true[\s\S]*?updateTableRecordSource\(record, file, updatedTable, tableIndex, true\)/,
  "legacy marker cleanup must snapshot the note and convert old records to markerless identities"
);

assert.match(
  source,
  /const template = \[tableRaw, ""\]\.join\("\\n"\);[\s\S]*?updateTableRecordSource\(record, file, insertedTable/,
  "color table insertion must insert plain markdown then attach a markerless record after insertion"
);

assert.match(
  source,
  /prepareTemplateContentForInsertion\([\s\S]*?const markerlessContent = this\.stripTableMarkersFromContent\(extracted\.content\);[\s\S]*?markerless: true[\s\S]*?content: markerlessContent/,
  "template insertion must strip old markers and restore styles through markerless records"
);

assert.match(
  source,
  /findParsedTableForRecordId\(content: string, file: TFile, tableId: string\) \{[\s\S]*?const record = this\.dataStore\.tables\[tableId\];[\s\S]*?record\.markerless !== true/,
  "source mutations must resolve markerless records by identity instead of requiring a markdown marker"
);

assert.match(
  source,
  /exportNativeLayoutTableCsv\([\s\S]*?findParsedTableForRecordId\(content, file, tableId\)/,
  "CSV export must work for markerless nativeLayout tables"
);

assert.match(
  source,
  /mutateTableSource\([\s\S]*?findParsedTableForRecordId\(content, file, tableId\)/,
  "row, column, edit, formula, autofill, and image mutations must work for markerless nativeLayout tables"
);

assert.match(
  source,
  /savePreparedTemplateTableRecords\([\s\S]*?updateTableRecordSource\(record, file, parsedTable/,
  "template and OneNote enhanced insertion must save table identities after content is inserted into the target note"
);

assert.match(
  cssSource,
  /color: var\(--mdtp-cell-text-color, var\(--text-normal\)\) !important;[\s\S]*?-webkit-text-fill-color: var\(--mdtp-cell-text-color, var\(--text-normal\)\) !important;/,
  "selected table cells must not become white-on-light after Obsidian applies selection styles"
);

console.log("native table markerless regression guards passed");
