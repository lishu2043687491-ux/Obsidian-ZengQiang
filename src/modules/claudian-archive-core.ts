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
};

export const DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS: ClaudianChatArchiveSettings = {
  enabled: true,
  autoArchive: true,
  autoArchiveIntervalMinutes: 10,
  showCrossDeviceBadge: true,
  maxMessageBytes: 51200,
  maxArchiveBytes: 1048576,
  deviceId: "",
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
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function resolveDeviceId(settings: ClaudianChatArchiveSettings): string {
  if (settings.deviceId) return sanitizePathSegment(settings.deviceId);
  try {
    const os = require("os") as typeof import("os");
    return sanitizePathSegment(os.hostname() || "unknown-device");
  } catch {
    return "unknown-device";
  }
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
