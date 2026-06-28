export type NativeFormulaFunction = "sum" | "avg" | "min" | "max";

export type NativeFormulaEvaluation = {
  value: string;
  functionName: NativeFormulaFunction;
  referencedCells: Array<{ row: number; col: number }>;
};

export type NativeFormulaCoord = {
  row: number;
  col: number;
};

const FORMULA_RE = /^=\s*(sum|avg|average|min|max)\s*(?:\(([^)]*)\))?\s*$/i;
const CELL_REF_RE = /^\s*([A-Z]+)(\d+)\s*$/i;
const RANGE_REF_RE = /^\s*([A-Z]+\d+)\s*:\s*([A-Z]+\d+)\s*$/i;
const TRAILING_NUMBER_RE = /^(.*?)(-?\d+(?:\.\d+)?)([^0-9.]*)$/;

export function evaluateNativeTableFormula(
  rawFormula: string,
  table: string[][],
  coord: NativeFormulaCoord
): NativeFormulaEvaluation | null {
  const match = rawFormula.trim().match(FORMULA_RE);
  if (!match) return null;

  const functionName = normalizeFormulaFunction(match[1]);
  const argument = (match[2] ?? "").trim();
  const cells = argument
    ? resolveFormulaArgument(argument, table)
    : resolveImplicitColumnRange(table, coord);
  if (!functionName || cells.length === 0) return null;

  const numericValues = cells
    .map((cell) => parseFormulaNumber(table[cell.row]?.[cell.col] ?? ""))
    .filter((value): value is number => value !== null);
  if (numericValues.length === 0) return null;

  const result = calculateFormulaValues(functionName, numericValues);
  if (result === null) return null;
  return {
    value: formatFormulaNumber(result),
    functionName,
    referencedCells: cells,
  };
}

export function buildNativeAutoFillValues(
  seedValues: string[],
  targetCount: number,
  direction: 1 | -1 = 1
) {
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
  const step =
    previousPattern &&
    previousPattern.prefix === lastPattern.prefix &&
    previousPattern.suffix === lastPattern.suffix
      ? lastPattern.number - previousPattern.number
      : 1;
  const safeStep = step === 0 ? 1 : step;

  return Array.from({ length: targetCount }, (_, index) => {
    const nextNumber = lastPattern.number + safeStep * (index + 1) * direction;
    return `${lastPattern.prefix}${formatFillNumber(nextNumber, lastPattern.decimals)}${lastPattern.suffix}`;
  });
}

export function containsNativeLatex(rawValue: string) {
  const value = String(rawValue ?? "");
  return /\$\S[\s\S]*?\S\$/.test(value) || /\\\([\s\S]+\\\)/.test(value) || /\\\[[\s\S]+\\\]/.test(value);
}

function normalizeFormulaFunction(value: string): NativeFormulaFunction | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "average") return "avg";
  if (normalized === "sum" || normalized === "avg" || normalized === "min" || normalized === "max") {
    return normalized;
  }
  return null;
}

function resolveFormulaArgument(argument: string, table: string[][]) {
  const rangeMatch = argument.match(RANGE_REF_RE);
  if (rangeMatch) {
    const start = parseCellReference(rangeMatch[1]);
    const end = parseCellReference(rangeMatch[2]);
    if (!start || !end) return [];
    const cells: NativeFormulaCoord[] = [];
    const rowStart = Math.min(start.row, end.row);
    const rowEnd = Math.max(start.row, end.row);
    const colStart = Math.min(start.col, end.col);
    const colEnd = Math.max(start.col, end.col);
    for (let row = rowStart; row <= rowEnd; row += 1) {
      for (let col = colStart; col <= colEnd; col += 1) {
        if (table[row]?.[col] !== undefined) cells.push({ row, col });
      }
    }
    return cells;
  }

  const cellRefs = argument
    .split(",")
    .map((part) => parseCellReference(part))
    .filter((coord): coord is NativeFormulaCoord => !!coord && table[coord.row]?.[coord.col] !== undefined);
  return cellRefs;
}

function resolveImplicitColumnRange(table: string[][], coord: NativeFormulaCoord) {
  const cells: NativeFormulaCoord[] = [];
  for (let row = 1; row < coord.row; row += 1) {
    if (table[row]?.[coord.col] !== undefined) cells.push({ row, col: coord.col });
  }
  return cells;
}

function parseCellReference(ref: string): NativeFormulaCoord | null {
  const match = ref.trim().match(CELL_REF_RE);
  if (!match) return null;
  return {
    row: Math.max(0, Number.parseInt(match[2], 10) - 1),
    col: columnNameToIndex(match[1]),
  };
}

function columnNameToIndex(name: string) {
  let index = 0;
  for (const char of name.toUpperCase()) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return index - 1;
}

function parseFormulaNumber(value: string) {
  const normalized = String(value ?? "").trim().replace(/,/g, "");
  if (!normalized || normalized.startsWith("=")) return null;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function calculateFormulaValues(functionName: NativeFormulaFunction, values: number[]) {
  if (values.length === 0) return null;
  if (functionName === "sum") return values.reduce((total, value) => total + value, 0);
  if (functionName === "avg") return values.reduce((total, value) => total + value, 0) / values.length;
  if (functionName === "min") return Math.min(...values);
  if (functionName === "max") return Math.max(...values);
  return null;
}

function formatFormulaNumber(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(6).replace(/0+$/g, "").replace(/\.$/, "");
}

function parseFillPattern(value: string) {
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
    decimals,
  };
}

function formatFillNumber(value: number, decimals: number) {
  if (decimals > 0) return value.toFixed(decimals);
  return String(Math.round(value));
}
