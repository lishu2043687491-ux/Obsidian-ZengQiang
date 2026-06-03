/**
 * 只读解析 Codex session jsonl，提取 user/assistant 纯文本。
 * 不依赖 Claudian 插件源码；不写入 sessions 目录。
 */

import { getNodeModule } from "./node-bridge";

export type ParsedChatMessage = {
  role: "user" | "assistant";
  createdAt: number;
  text: string;
  truncated?: boolean;
};

export type ParseCodexOptions = {
  maxMessageBytes: number;
  maxTotalBytes: number;
  onProgress?: (lineCount: number) => void;
};

export type ParseCodexResult = {
  messages: ParsedChatMessage[];
  bytesUsed: number;
  linesRead: number;
  stoppedBySizeLimit: boolean;
  skippedLines: number;
};

const SKIP_TEXT_PREFIXES = [
  "<permissions instructions>",
  "<app-context>",
  "<environment_context>",
  "<turn_aborted>",
];

const BASE64_RE = /data:image\/[a-zA-Z0-9+.-]+;base64,/i;
const LOCAL_IMAGES_RE = /local_images/i;

export function shouldSkipMessageText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (BASE64_RE.test(trimmed)) return true;
  if (LOCAL_IMAGES_RE.test(trimmed) && trimmed.length > 500) return true;
  if (trimmed.includes("encrypted_content")) return true;
  const lower = trimmed.slice(0, 80).toLowerCase();
  for (const prefix of SKIP_TEXT_PREFIXES) {
    if (lower.startsWith(prefix.toLowerCase())) return true;
  }
  return false;
}

export function extractTextFromContentParts(content: unknown): string {
  if (!Array.isArray(content)) {
    if (typeof content === "string") return content;
    return "";
  }
  const parts: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const type = String((part as { type?: string }).type ?? "");
    if (type === "input_text" || type === "output_text" || type === "text") {
      const text = (part as { text?: string }).text;
      if (typeof text === "string" && text.trim()) parts.push(text);
    }
  }
  return parts.join("\n\n").trim();
}

export function parseCodexJsonlLine(line: string): ParsedChatMessage | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let record: Record<string, unknown>;
  try {
    record = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (record.type !== "response_item") return null;
  const payload = record.payload as Record<string, unknown> | undefined;
  if (!payload || payload.type !== "message") return null;
  const role = payload.role;
  if (role !== "user" && role !== "assistant") return null;
  const text = extractTextFromContentParts(payload.content);
  if (!text || shouldSkipMessageText(text)) return null;
  let createdAt = Date.now();
  if (typeof record.timestamp === "string") {
    const parsed = Date.parse(record.timestamp);
    if (Number.isFinite(parsed)) createdAt = parsed;
  }
  return { role, createdAt, text };
}

export function truncateText(text: string, maxBytes: number): { text: string; truncated: boolean } {
  const buf = Buffer.from(text, "utf-8");
  if (buf.length <= maxBytes) return { text, truncated: false };
  let end = maxBytes;
  while (end > 0 && (buf[end] & 0xc0) === 0x80) end -= 1;
  return {
    text: `${buf.subarray(0, end).toString("utf-8")}\n\n…（内容过长已截断）`,
    truncated: true,
  };
}

export function parseCodexJsonlContent(content: string, options: ParseCodexOptions): ParseCodexResult {
  const messages: ParsedChatMessage[] = [];
  let bytesUsed = 0;
  let linesRead = 0;
  let skippedLines = 0;
  let stoppedBySizeLimit = false;

  for (const line of content.split("\n")) {
    linesRead += 1;
    if (options.onProgress && linesRead % 500 === 0) options.onProgress(linesRead);
    const parsed = parseCodexJsonlLine(line);
    if (!parsed) {
      skippedLines += 1;
      continue;
    }
    let text = parsed.text;
    let truncated = false;
    if (Buffer.byteLength(text, "utf-8") > options.maxMessageBytes) {
      const cut = truncateText(text, options.maxMessageBytes);
      text = cut.text;
      truncated = cut.truncated;
    }
    const nextBytes = bytesUsed + Buffer.byteLength(text, "utf-8");
    if (nextBytes > options.maxTotalBytes) {
      stoppedBySizeLimit = true;
      break;
    }
    bytesUsed = nextBytes;
    messages.push({ ...parsed, text, truncated: truncated || undefined });
  }

  return { messages, bytesUsed, linesRead, stoppedBySizeLimit, skippedLines };
}

export async function parseCodexJsonlFilePath(
  filePath: string,
  options: ParseCodexOptions
): Promise<ParseCodexResult> {
  const fs = getNodeModule<typeof import("fs")>("fs");
  const readline = getNodeModule<typeof import("readline")>("readline");
  if (!fs?.existsSync?.(filePath) || !readline) {
    return {
      messages: [],
      bytesUsed: 0,
      linesRead: 0,
      stoppedBySizeLimit: false,
      skippedLines: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    const messages: ParsedChatMessage[] = [];
    let bytesUsed = 0;
    let linesRead = 0;
    let skippedLines = 0;
    let stoppedBySizeLimit = false;

    const finish = () => {
      rl.close();
      stream.destroy();
      resolve({ messages, bytesUsed, linesRead, stoppedBySizeLimit, skippedLines });
    };

    rl.on("line", (line) => {
      if (stoppedBySizeLimit) return;
      linesRead += 1;
      if (options.onProgress && linesRead % 500 === 0) options.onProgress(linesRead);
      const parsed = parseCodexJsonlLine(line);
      if (!parsed) {
        skippedLines += 1;
        return;
      }
      let text = parsed.text;
      let truncated = false;
      if (Buffer.byteLength(text, "utf-8") > options.maxMessageBytes) {
        const cut = truncateText(text, options.maxMessageBytes);
        text = cut.text;
        truncated = cut.truncated;
      }
      const nextBytes = bytesUsed + Buffer.byteLength(text, "utf-8");
      if (nextBytes > options.maxTotalBytes) {
        stoppedBySizeLimit = true;
        rl.close();
        stream.destroy();
        resolve({ messages, bytesUsed, linesRead, stoppedBySizeLimit, skippedLines });
        return;
      }
      bytesUsed = nextBytes;
      messages.push({ ...parsed, text, truncated: truncated || undefined });
    });

    rl.on("close", finish);
    rl.on("error", (err) => {
      rl.close();
      stream.destroy();
      reject(err);
    });
    stream.on("error", (err) => {
      rl.close();
      stream.destroy();
      reject(err);
    });
  });
}

const SAFE_SESSION_ID_PATTERN = /^[0-9a-f-]{36}$/i;
/** 跨时区、长会话时 meta 与 jsonl 锚点可能相差数小时 */
const HEURISTIC_MATCH_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 本机 Codex jsonl：优先 meta 路径，再按 threadId 在 ~/.codex/sessions 下查找 */
export function resolveCodexSessionFilePath(meta: {
  id?: string;
  createdAt?: number;
  updatedAt?: number;
  lastResponseAt?: number;
  sessionId?: string;
  providerState?: {
    sessionFilePath?: string;
    threadId?: string;
    transcriptRootPath?: string;
  };
}): string | null {
  const fs = getNodeModule<typeof import("fs")>("fs");
  const path = getNodeModule<typeof import("path")>("path");
  const os = getNodeModule<typeof import("os")>("os");
  if (!fs || !path || !os) return null;

  const rewriteHome = (p: string) => p.replace(/^\/Users\/[^/]+/, os.homedir());

  const sessionFilePath = meta.providerState?.sessionFilePath;
  if (sessionFilePath) {
    if (fs.existsSync(sessionFilePath)) return sessionFilePath;
    const rewritten = rewriteHome(sessionFilePath);
    if (rewritten !== sessionFilePath && fs.existsSync(rewritten)) return rewritten;
  }

  const roots = collectCodexSessionRoots(meta.providerState?.transcriptRootPath, rewriteHome, path, os);

  const threadId =
    meta.providerState?.threadId || meta.sessionId || extractThreadIdFromPath(sessionFilePath);
  if (threadId && SAFE_SESSION_ID_PATTERN.test(threadId)) {
    for (const root of roots) {
      const found = findCodexSessionFileInRoot(root, threadId, fs, path);
      if (found) return found;
    }
  }

  return findCodexSessionByHeuristic(meta, roots, fs);
}

function collectCodexSessionRoots(
  transcriptRootPath: string | undefined,
  rewriteHome: (p: string) => string,
  path: typeof import("path"),
  os: typeof import("os")
): string[] {
  const roots: string[] = [];
  const seen = new Set<string>();
  const addRoot = (value?: string) => {
    if (!value) return;
    const normalized = value.replace(/\\/g, "/");
    if (seen.has(normalized)) return;
    seen.add(normalized);
    roots.push(value);
  };
  if (transcriptRootPath) addRoot(rewriteHome(transcriptRootPath));
  addRoot(path.join(os.homedir(), ".codex", "sessions"));
  return roots;
}

function extractThreadIdFromPath(sessionFilePath?: string): string | null {
  if (!sessionFilePath) return null;
  const rolloutMatch = sessionFilePath.match(/-([0-9a-f-]{36})\.jsonl$/i);
  if (rolloutMatch?.[1]) return rolloutMatch[1];
  const directMatch = sessionFilePath.match(/([0-9a-f-]{36})\.jsonl$/i);
  return directMatch?.[1] ?? null;
}

function findCodexSessionFileInRoot(
  root: string,
  threadId: string,
  fs: typeof import("fs"),
  path: typeof import("path")
): string | null {
  if (!fs.existsSync(root)) return null;

  const directPath = path.join(root, `${threadId}.jsonl`);
  if (fs.existsSync(directPath)) return directPath;

  const rolloutSuffix = `-${threadId}.jsonl`;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries: import("fs").Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(rolloutSuffix)) {
        return full;
      }
    }
  }
  return null;
}

function findCodexSessionByHeuristic(
  meta: {
    id?: string;
    createdAt?: number;
    updatedAt?: number;
    lastResponseAt?: number;
  },
  roots: string[],
  fs: typeof import("fs")
): string | null {
  const anchor =
    Number(meta.lastResponseAt) || Number(meta.updatedAt) || Number(meta.createdAt) || extractConvTimestamp(meta.id);
  if (!Number.isFinite(anchor) || anchor <= 0) return null;

  let bestPath: string | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const filePath of listCodexJsonlFiles(root, fs)) {
      const sessionTime = readCodexSessionAnchorMs(filePath, fs);
      if (sessionTime === null) continue;
      const diff = Math.abs(sessionTime - anchor);
      if (diff >= bestDiff) continue;
      bestDiff = diff;
      bestPath = filePath;
    }
  }

  if (!bestPath || bestDiff > HEURISTIC_MATCH_WINDOW_MS) return null;
  return bestPath;
}

function extractConvTimestamp(conversationId?: string): number | null {
  if (!conversationId) return null;
  const match = conversationId.match(/^conv-(\d+)-/);
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function listCodexJsonlFiles(root: string, fs: typeof import("fs")): string[] {
  const files: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    let entries: import("fs").Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = `${current}/${entry.name}`.replace(/\\/g, "/");
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(full);
      }
    }
  }
  return files;
}

function readCodexSessionAnchorMs(filePath: string, fs: typeof import("fs")): number | null {
  let handle: number | null = null;
  try {
    handle = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(8192);
    const bytesRead = fs.readSync(handle, buffer, 0, buffer.length, 0);
    const firstLine = buffer.toString("utf-8", 0, bytesRead).split("\n")[0]?.trim();
    if (firstLine) {
      const record = JSON.parse(firstLine) as {
        type?: string;
        payload?: { timestamp?: string; id?: string };
      };
      if (record.type === "session_meta" && record.payload?.timestamp) {
        const parsed = Date.parse(record.payload.timestamp);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
  } catch {
    // fall through to mtime
  } finally {
    if (handle !== null) {
      try {
        fs.closeSync(handle);
      } catch {
        // ignore
      }
    }
  }

  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return null;
  }
}
