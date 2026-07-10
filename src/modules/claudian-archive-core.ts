import type { ParsedChatMessage } from "./claudian-codex-parser";

function normalizeArchivePath(path: string) {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "");
}

export const ARCHIVE_SCHEMA_VERSION = 1;
export const ARCHIVE_ROOT = ".claudian-sync/chat-archives";
export const CLAUDIAN_META_DIR = ".claudian/sessions";

export type ChatArchiveMessage = {
  role: "user" | "assistant";
  createdAt: number;
  text: string;
  truncated?: boolean;
};

export type ChatArchiveRecord = {
  schemaVersion: typeof ARCHIVE_SCHEMA_VERSION;
  conversationId: string;
  sourceProvider: string;
  sourcePlugin: "claudian";
  archiveType: "lightweight-chat";
  archiveScope: "cross-device";
  canResume: false;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastArchivedAt: number;
  sourceDevice: string;
  currentNote?: string;
  model?: string;
  sessionId?: string;
  messages: ChatArchiveMessage[];
  omitted: {
    toolLogs: true;
    images: true;
    attachments: true;
    largeOutputs: boolean;
    truncatedMessages?: number;
    noLocalSessionFile?: boolean;
    stoppedBySizeLimit?: boolean;
    providerSkipped?: boolean;
  };
};

export type MergedChatArchiveRecord = ChatArchiveRecord & {
  sourceDevices: string[];
  archivePaths: string[];
};

export type ClaudianSessionMeta = {
  id: string;
  providerId?: string;
  title?: string;
  createdAt?: number;
  updatedAt?: number;
  lastResponseAt?: number;
  sessionId?: string;
  currentNote?: string;
  usage?: { model?: string };
  providerState?: {
    sessionFilePath?: string;
    threadId?: string;
    transcriptRootPath?: string;
  };
};

export type ClaudianChatArchiveSettings = {
  enabled: boolean;
  autoArchive: boolean;
  autoArchiveIntervalMinutes: number;
  showCrossDeviceBadge: boolean;
  maxMessageBytes: number;
  maxArchiveBytes: number;
  deviceId: string;
  continuationMap: Record<string, string>;
};

export const DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS: ClaudianChatArchiveSettings = {
  enabled: true,
  autoArchive: true,
  autoArchiveIntervalMinutes: 10,
  showCrossDeviceBadge: true,
  maxMessageBytes: 51200,
  maxArchiveBytes: 1048576,
  deviceId: "",
  continuationMap: {},
};

export function normalizeClaudianArchiveSettings(value: unknown): ClaudianChatArchiveSettings {
  const saved = value && typeof value === "object" ? (value as Partial<ClaudianChatArchiveSettings>) : {};
  const defaults = DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS;
  return {
    enabled: typeof saved.enabled === "boolean" ? saved.enabled : defaults.enabled,
    autoArchive: typeof saved.autoArchive === "boolean" ? saved.autoArchive : defaults.autoArchive,
    autoArchiveIntervalMinutes: clampNumber(saved.autoArchiveIntervalMinutes, 3, 120, 10),
    showCrossDeviceBadge: saved.showCrossDeviceBadge !== false,
    maxMessageBytes: clampNumber(saved.maxMessageBytes, 4096, 512000, 51200),
    maxArchiveBytes: clampNumber(saved.maxArchiveBytes, 65536, 5242880, 1048576),
    deviceId: typeof saved.deviceId === "string" ? saved.deviceId.trim().slice(0, 64) : "",
    continuationMap: normalizeContinuationMap(saved.continuationMap),
  };
}

function normalizeContinuationMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [originId, continuationId] of Object.entries(value)) {
    if (
      typeof originId === "string" &&
      originId.startsWith("conv-") &&
      typeof continuationId === "string" &&
      continuationId.startsWith("conv-")
    ) {
      result[originId] = continuationId;
    }
  }
  return result;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function resolveDeviceId(settings: ClaudianChatArchiveSettings): string {
  if (settings.deviceId) return sanitizePathSegment(settings.deviceId);
  const suffix =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  const deviceId = sanitizePathSegment(`device-${suffix}`);
  settings.deviceId = deviceId;
  return deviceId;
}

export function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "device";
}

export function getArchiveRelativePath(providerId: string, conversationId: string, deviceId: string) {
  const provider = sanitizePathSegment(providerId || "unknown");
  const conv = sanitizePathSegment(conversationId);
  const device = sanitizePathSegment(deviceId);
  return normalizeArchivePath(`${ARCHIVE_ROOT}/${provider}/${conv}@${device}.json`);
}

export function parseSessionMeta(content: string): ClaudianSessionMeta | null {
  try {
    const data = JSON.parse(content) as ClaudianSessionMeta;
    if (!data?.id || typeof data.id !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

export function buildArchiveRecord(
  meta: ClaudianSessionMeta,
  messages: ParsedChatMessage[],
  deviceId: string,
  omittedExtras: Partial<ChatArchiveRecord["omitted"]>
): ChatArchiveRecord {
  const now = Date.now();
  return {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    conversationId: meta.id,
    sourceProvider: meta.providerId ?? "unknown",
    sourcePlugin: "claudian",
    archiveType: "lightweight-chat",
    archiveScope: "cross-device",
    canResume: false,
    title: String(meta.title ?? "未命名会话"),
    createdAt: Number(meta.createdAt) || now,
    updatedAt: Number(meta.updatedAt) || now,
    lastArchivedAt: now,
    sourceDevice: deviceId,
    currentNote: meta.currentNote,
    model: meta.usage?.model,
    sessionId: meta.sessionId,
    messages,
    omitted: {
      toolLogs: true,
      images: true,
      attachments: true,
      largeOutputs: !!omittedExtras.largeOutputs || !!omittedExtras.stoppedBySizeLimit,
      truncatedMessages: omittedExtras.truncatedMessages,
      noLocalSessionFile: omittedExtras.noLocalSessionFile,
      stoppedBySizeLimit: omittedExtras.stoppedBySizeLimit,
      providerSkipped: omittedExtras.providerSkipped,
    },
  };
}

export function chooseBestArchiveRecord(
  records: Array<{ path: string; record: ChatArchiveRecord }>
): MergedChatArchiveRecord | null {
  if (records.length === 0) return null;
  const ranked = [...records].sort((a, b) => {
    const messageDelta = b.record.messages.length - a.record.messages.length;
    if (messageDelta !== 0) return messageDelta;
    const updatedDelta = (Number(b.record.updatedAt) || 0) - (Number(a.record.updatedAt) || 0);
    if (updatedDelta !== 0) return updatedDelta;
    return (Number(b.record.lastArchivedAt) || 0) - (Number(a.record.lastArchivedAt) || 0);
  });
  const best = ranked[0].record;
  return {
    ...best,
    messages: [...best.messages],
    sourceDevices: Array.from(new Set(ranked.map((item) => item.record.sourceDevice).filter(Boolean))),
    archivePaths: ranked.map((item) => item.path),
  };
}

export function mergeArchiveRecords(
  records: Array<{ path: string; record: ChatArchiveRecord }>
): MergedChatArchiveRecord[] {
  const groups = new Map<string, Array<{ path: string; record: ChatArchiveRecord }>>();
  for (const item of records) {
    if (!item.record?.conversationId) continue;
    const group = groups.get(item.record.conversationId) ?? [];
    group.push(item);
    groups.set(item.record.conversationId, group);
  }
  return Array.from(groups.values())
    .map(chooseBestArchiveRecord)
    .filter((record): record is MergedChatArchiveRecord => record !== null)
    .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
}

export function buildArchiveHandoffPrompt(record: MergedChatArchiveRecord): string {
  const transcript = record.messages
    .map((message) => `${message.role === "user" ? "用户" : "助手"}：${message.text}`)
    .join("\n\n");
  return [
    "<claudian_cross_device_handoff>",
    "以下内容来自另一台设备同步的 Claudian 只读聊天记录。",
    "这是一个新的本机 Codex 线程，不是原 thread 的精确恢复。",
    `原会话标题：${record.title}`,
    `来源设备：${record.sourceDevices.join("、") || record.sourceDevice}`,
    record.currentNote ? `原关联笔记：${record.currentNote}` : "",
    "",
    "原聊天记录：",
    transcript,
    "</claudian_cross_device_handoff>",
    "",
    "请把以上记录作为当前对话的既有上下文，直接衔接处理用户接下来发送的新消息；不要重复复述整段记录。",
  ]
    .filter((line, index, lines) => line !== "" || (index > 0 && lines[index - 1] !== ""))
    .join("\n");
}
