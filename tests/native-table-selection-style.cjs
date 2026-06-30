const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("src/modules/native-table-enhancer-embedded.ts", "utf8");
const settingsSource = fs.readFileSync("src/main.ts", "utf8");
const cssSource = fs.readFileSync("src/modules/native-table-enhancer-embedded.css", "utf8");

assert.match(
  source,
  /const isEnhancedTable = this\.isInitializedEnhancedTable\(tableEl\);[\s\S]*?const isNativeLayoutTable = this\.isNativeLayoutTable\(tableEl\);[\s\S]*?if \(!isEnhancedTable && !isNativeLayoutTable\) return;/,
  "nativeLayout tables must be recognized without forcing ordinary clicks into plugin drag selection"
);

assert.match(
  source,
  /isNativeLayoutTable && !isEnhancedTable && !this\.shouldCaptureNativeLayoutSelectionPointer\(event\)[\s\S]*?updatePassiveNativeLayoutCellContext\(tableEl, coord\);[\s\S]*?return;/,
  "ordinary nativeLayout clicks must pass through so Obsidian can edit cells"
);

assert.match(
  source,
  /shouldCaptureNativeLayoutSelectionPointer\(event: PointerEvent\)[\s\S]*?return event\.shiftKey \|\| event\.altKey;/,
  "plugin-owned nativeLayout selection must be opt-in instead of hijacking normal clicks"
);

assert.match(
  source,
  /setNativeLayoutCellRangeBackgroundColor\([\s\S]*?selection[\s\S]*?coord[\s\S]*?palette\.value/,
  "fill color palette must write to the selected cell range"
);

assert.match(
  source,
  /resolveLatestNativeLayoutSelection\(tableEl, selection\)/,
  "style operations must re-read the latest nativeLayout selection at execution time"
);

assert.match(
  source,
  /getDomSelectedCellRange\(tableEl\)[\s\S]*?querySelectorAll\("th, td"\)[\s\S]*?mdtp-cell-selected[\s\S]*?isPlainTableCellSelected\(htmlCell, browserSelection\)/,
  "style operations must recover both plugin and Obsidian-visible cell selections"
);

assert.match(
  source,
  /appendNativeLayoutSidebarCategories\(root, this\.refreshNativeLayoutSidebarContext\(context\)\)/,
  "opening the nativeLayout sidebar must cache the current selection before button clicks can clear it"
);

assert.match(
  source,
  /refreshNativeLayoutSidebarContext\([\s\S]*?resolveLatestNativeLayoutSelection\(context\.tableEl, context\.selection\)[\s\S]*?runtime\.selection = latestSelection[\s\S]*?selection: latestSelection/,
  "nativeLayout sidebar actions must run against the latest cached table selection"
);

assert.match(
  source,
  /setNativeLayoutCellRangeBackgroundColor\([\s\S]*?const range = this\.getSelectedCellRange\(selection, coord, tableEl\);[\s\S]*?for \(let row = range\.startRow; row <= range\.endRow; row \+= 1\)[\s\S]*?for \(let col = range\.startCol; col <= range\.endCol; col \+= 1\)/,
  "fill color changes must cover every cell in the selected range"
);

assert.match(
  source,
  /setNativeLayoutCellRangeAlignment\([\s\S]*?const range = this\.getSelectedCellRange\(selection, coord, tableEl, rangeMode\);[\s\S]*?for \(let row = range\.startRow; row <= range\.endRow; row \+= 1\)[\s\S]*?for \(let col = range\.startCol; col <= range\.endCol; col \+= 1\)/,
  "alignment changes must cover every cell in the selected range"
);

assert.match(
  source,
  /const alignments: SidebarPopoverAction\[\] = \[[\s\S]*?label: NATIVE_LAYOUT_ALIGN_LEFT_LABEL[\s\S]*?label: NATIVE_LAYOUT_ALIGN_CENTER_LABEL[\s\S]*?label: NATIVE_LAYOUT_ALIGN_RIGHT_LABEL[\s\S]*?\]\.map/,
  "nativeLayout sidebar alignment must expose only left/center/right"
);

assert.match(
  source,
  /addNativeLayoutAlignmentMenuItems\([\s\S]*?label: NATIVE_LAYOUT_ALIGN_LEFT_LABEL[\s\S]*?label: NATIVE_LAYOUT_ALIGN_CENTER_LABEL[\s\S]*?label: NATIVE_LAYOUT_ALIGN_RIGHT_LABEL[\s\S]*?setNativeLayoutCellRangeAlignment\(tableId, file, tableEl, selection, coord, option\.alignment\)/,
  "nativeLayout context alignment menu must expose only left/center/right and use the current selection"
);

assert.doesNotMatch(
  source,
  /NATIVE_LAYOUT_ALIGN_(SELECTION|ROW|COLUMN)_PREFIX|选区居|整行居|整列居|恢复默认对齐/,
  "alignment UI must not duplicate scopes; the selected range decides the target"
);

assert.doesNotMatch(
  source,
  /setNativeLayoutCellRangeTextColor[\s\S]*?if \(row === 0\) continue;/,
  "text color changes must include header cells when they are in the selected range"
);

assert.match(
  source,
  /case "left-align-column":[\s\S]*?setNativeLayoutCellRangeAlignment\([\s\S]*?context\.selection[\s\S]*?context\.coord[\s\S]*?"column"/,
  "Advanced Tables alignment commands must align the active nativeLayout column"
);

assert.match(
  source,
  /resolveNativeCellAlignment\([\s\S]*?getNativeTableDefaultHeaderAlignment\(\)[\s\S]*?getNativeTableDefaultFirstColumnAlignment\(\)/,
  "header and first-column automatic alignment must be resolved during rendering"
);

assert.match(
  source,
  /clearPersistedNativeAutoAlignment\([\s\S]*?scheduleVisibleTableRefresh\(\)/,
  "changing alignment defaults must refresh visible tables and clear stale persisted auto values"
);

assert.match(
  source,
  /type NativeTableIdentity = \{[\s\S]*?tableIndex: number;[\s\S]*?tableHash: string;[\s\S]*?headerHash: string;[\s\S]*?structureHash: string;/,
  "nativeLayout records must have markerless identity data for non-invasive table matching"
);

assert.match(
  source,
  /resolveTableRecordIdForParsedTable\([\s\S]*?findBestMarkerlessRecordIdForParsedTable/,
  "rendering and commands must resolve markerless nativeLayout records without requiring a markdown marker"
);

assert.match(
  source,
  /initializeSpecificTableNativeLayout\([\s\S]*?markerless: true[\s\S]*?createNativeTableIdentity\(targetTable, tableIndex\)[\s\S]*?已对当前表格美化（无正文标记）/,
  "beautifying the current table must create a markerless nativeLayout record instead of inserting %% mdtp"
);

assert.match(
  source,
  /const template = \[tableRaw, ""\]\.join\("\\n"\);/,
  "inserting a colorful native table must write only markdown table text, not a mdtp marker"
);

assert.doesNotMatch(
  source,
  /lines\.splice\([^)]*formatTableMarker\(tableId\)/,
  "new nativeLayout table creation must not insert %% mdtp marker lines"
);

assert.match(
  cssSource,
  /-webkit-text-fill-color: var\(--mdtp-cell-text-color, var\(--text-normal\)\) !important;/,
  "selected nativeLayout cells must keep a legible text color instead of inheriting white selection text"
);

assert.match(
  source,
  /nativeTableDefaultZebraEnabled: true/,
  "zebra style should remain enabled by default"
);

assert.match(
  source,
  /nativeTableDefaultBorderEnabled: false/,
  "border style should be disabled by default"
);

assert.match(
  settingsSource,
  /label: "默认边框样式"[\s\S]*?defaultBorderEnabled/,
  "settings page should expose the default border toggle"
);

assert.match(
  settingsSource,
  /label: "首行自动对齐"[\s\S]*?defaultHeaderAlignment/,
  "settings page should expose the header alignment control"
);

assert.match(
  settingsSource,
  /createEl\("details", \{ cls: "fdtb-local-library-card" \}\)/,
  "local image library paths should render as a collapsible details block"
);

assert.match(
  cssSource,
  /\.mdtp-table-shell\.mdtp-table-bordered th,\n\.mdtp-table-shell\.mdtp-table-bordered td/,
  "border color override should only apply when border style is enabled"
);

console.log("native table selection/style guards passed");
