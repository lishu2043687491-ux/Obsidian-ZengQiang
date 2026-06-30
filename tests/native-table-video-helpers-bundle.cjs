var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/modules/native-table-video-helpers.ts
var native_table_video_helpers_exports = {};
__export(native_table_video_helpers_exports, {
  buildNativeAutoFillValues: () => buildNativeAutoFillValues,
  containsNativeLatex: () => containsNativeLatex,
  evaluateNativeTableFormula: () => evaluateNativeTableFormula
});
module.exports = __toCommonJS(native_table_video_helpers_exports);
var FORMULA_RE = /^=\s*(sum|avg|average|min|max)\s*(?:\(([^)]*)\))?\s*$/i;
var CELL_REF_RE = /^\s*([A-Z]+)(\d+)\s*$/i;
var RANGE_REF_RE = /^\s*([A-Z]+\d+)\s*:\s*([A-Z]+\d+)\s*$/i;
var TRAILING_NUMBER_RE = /^(.*?)(-?\d+(?:\.\d+)?)([^0-9.]*)$/;
function evaluateNativeTableFormula(rawFormula, table, coord) {
  const match = rawFormula.trim().match(FORMULA_RE);
  if (!match) return null;
  const functionName = normalizeFormulaFunction(match[1]);
  const argument = (match[2] ?? "").trim();
  const cells = argument ? resolveFormulaArgument(argument, table) : resolveImplicitColumnRange(table, coord);
  if (!functionName || cells.length === 0) return null;
  const numericValues = cells.map((cell) => parseFormulaNumber(table[cell.row]?.[cell.col] ?? "")).filter((value) => value !== null);
  if (numericValues.length === 0) return null;
  const result = calculateFormulaValues(functionName, numericValues);
  if (result === null) return null;
  return {
    value: formatFormulaNumber(result),
    functionName,
    referencedCells: cells
  };
}
function buildNativeAutoFillValues(seedValues, targetCount, direction = 1) {
  if (targetCount <= 0) return [];
  const seeds = seedValues.map((value) => String(value ?? ""));
  if (seeds.length === 0) return [];
  const parsedSeeds = seeds.map(parseFillPattern);
  const lastSeed = seeds[seeds.length - 1];
  const lastPattern = parsedSeeds[parsedSeeds.length - 1];
  if (!lastPattern) {
    return Array.from({ length: targetCount }, () => lastSeed);
  }
  const previousPattern = parsedSeeds.length >= 2 ? parsedSeeds[parsedSeeds.length - 2] : null;
  const step = previousPattern && previousPattern.prefix === lastPattern.prefix && previousPattern.suffix === lastPattern.suffix ? lastPattern.number - previousPattern.number : 1;
  const safeStep = step === 0 ? 1 : step;
  return Array.from({ length: targetCount }, (_, index) => {
    const nextNumber = lastPattern.number + safeStep * (index + 1) * direction;
    return `${lastPattern.prefix}${formatFillNumber(nextNumber, lastPattern.decimals)}${lastPattern.suffix}`;
  });
}
function containsNativeLatex(rawValue) {
  const value = String(rawValue ?? "");
  return /\$\S[\s\S]*?\S\$/.test(value) || /\\\([\s\S]+\\\)/.test(value) || /\\\[[\s\S]+\\\]/.test(value);
}
function normalizeFormulaFunction(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "average") return "avg";
  if (normalized === "sum" || normalized === "avg" || normalized === "min" || normalized === "max") {
    return normalized;
  }
  return null;
}
function resolveFormulaArgument(argument, table) {
  const rangeMatch = argument.match(RANGE_REF_RE);
  if (rangeMatch) {
    const start = parseCellReference(rangeMatch[1]);
    const end = parseCellReference(rangeMatch[2]);
    if (!start || !end) return [];
    const cells = [];
    const rowStart = Math.min(start.row, end.row);
    const rowEnd = Math.max(start.row, end.row);
    const colStart = Math.min(start.col, end.col);
    const colEnd = Math.max(start.col, end.col);
    for (let row = rowStart; row <= rowEnd; row += 1) {
      for (let col = colStart; col <= colEnd; col += 1) {
        if (table[row]?.[col] !== void 0) cells.push({ row, col });
      }
    }
    return cells;
  }
  const cellRefs = argument.split(",").map((part) => parseCellReference(part)).filter((coord) => !!coord && table[coord.row]?.[coord.col] !== void 0);
  return cellRefs;
}
function resolveImplicitColumnRange(table, coord) {
  const cells = [];
  for (let row = 1; row < coord.row; row += 1) {
    if (table[row]?.[coord.col] !== void 0) cells.push({ row, col: coord.col });
  }
  return cells;
}
function parseCellReference(ref) {
  const match = ref.trim().match(CELL_REF_RE);
  if (!match) return null;
  return {
    row: Math.max(0, Number.parseInt(match[2], 10) - 1),
    col: columnNameToIndex(match[1])
  };
}
function columnNameToIndex(name) {
  let index = 0;
  for (const char of name.toUpperCase()) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}
function parseFormulaNumber(value) {
  const normalized = String(value ?? "").trim().replace(/,/g, "");
  if (!normalized || normalized.startsWith("=")) return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}
function calculateFormulaValues(functionName, values) {
  if (values.length === 0) return null;
  if (functionName === "sum") return values.reduce((total, value) => total + value, 0);
  if (functionName === "avg") return values.reduce((total, value) => total + value, 0) / values.length;
  if (functionName === "min") return Math.min(...values);
  if (functionName === "max") return Math.max(...values);
  return null;
}
function formatFormulaNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(6).replace(/0+$/g, "").replace(/\.$/, "");
}
function parseFillPattern(value) {
  const match = String(value ?? "").trim().match(TRAILING_NUMBER_RE);
  if (!match) return null;
  const rawNumber = match[2];
  const number = Number(rawNumber);
  if (!Number.isFinite(number)) return null;
  const decimals = rawNumber.includes(".") ? rawNumber.split(".")[1].length : 0;
  return {
    prefix: match[1],
    number,
    suffix: match[3],
    decimals
  };
}
function formatFillNumber(value, decimals) {
  if (decimals > 0) return value.toFixed(decimals);
  return String(Math.round(value));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildNativeAutoFillValues,
  containsNativeLatex,
  evaluateNativeTableFormula
});
