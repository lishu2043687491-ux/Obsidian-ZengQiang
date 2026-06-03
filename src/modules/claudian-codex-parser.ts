/**
 * 只读解析 Codex session jsonl，提取 user/assistant 纯文本。
 * 不依赖 Claudian 插件源码；不写入 sessions 目录。
 */

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
  const req = typeof require !== "undefined" ? require : null;
  const fs = req?.("fs") as typeof import("fs") | undefined;
  const readline = req?.("readline") as typeof import("readline") | undefined;
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

/** 本机 Codex jsonl：优先 meta 路径，再按 threadId 在 ~/.codex/sessions 下查找 */
export function resolveCodexSessionFilePath(meta: {
  sessionId?: string;
  providerState?: {
    sessionFilePath?: string;
    threadId?: string;
    transcriptRootPath?: string;
  };
}): string | null {
  const req = typeof require !== "undefined" ? require : null;
  const fs = req?.("fs") as typeof import("fs") | undefined;
  const path = req?.("path") as typeof import("path") | undefined;
  const os = req?.("os") as typeof import("os") | undefined;
  if (!fs || !path || !os) return null;

  const rewriteHome = (p: string) => p.replace(/^\/Users\/[^/]+/, os.homedir());

  const sessionFilePath = meta.providerState?.sessionFilePath;
  if (sessionFilePath) {
    if (fs.existsSync(sessionFilePath)) return sessionFilePath;
    const rewritten = rewriteHome(sessionFilePath);
    if (rewritten !== sessionFilePath && fs.existsSync(rewritten)) return rewritten;
  }

  const threadId =
    meta.providerState?.threadId || meta.sessionId || extractThreadIdFromPath(sessionFilePath);
  if (!threadId) return null;

  const roots: string[] = [];
  const transcriptRoot = meta.providerState?.transcriptRootPath;
  if (transcriptRoot) roots.push(rewriteHome(transcriptRoot));
  roots.push(path.join(os.homedir(), ".codex", "sessions"));

  const suffix = `${threadId}.jsonl`;
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const found = walkFindJsonl(root, suffix, fs, path);
    if (found) return found;
  }
  return null;
}

function extractThreadIdFromPath(sessionFilePath?: string): string | null {
  if (!sessionFilePath) return null;
  const match = sessionFilePath.match(/([0-9a-f-]{36})\.jsonl$/i);
  return match?.[1] ?? null;
}

function walkFindJsonl(
  dir: string,
  suffix: string,
  fs: typeof import("fs"),
  path: typeof import("path")
): string | null {
  let entries: import("fs").Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = walkFindJsonl(full, suffix, fs, path);
      if (inner) return inner;
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      return full;
    }
  }
  return null;
}
