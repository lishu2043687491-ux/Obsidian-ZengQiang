import type { ParsedChatMessage } from "./claudian-codex-parser";
import { getNodeModule } from "./node-bridge";

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
    const os = getNodeModule<typeof import("os")>("os");
    return sanitizePathSegment(os?.hostname?.() || "unknown-device");
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

export type ArchiveListItem = {
  path: string;
  record: ChatArchiveRecord;
  isCrossDevice: boolean;
  /** 同一会话在其它设备上也有存档文件时，列出设备标识（用于 UI 提示） */
  peerSourceDevices?: string[];
};

/** 同一会话多份存档里，优先保留消息更多的那份 */
export function pickRicherArchiveRecord(
  candidates: ChatArchiveRecord[],
  preferDevice?: string
): ChatArchiveRecord | null {
  if (candidates.length === 0) return null;
  let best = candidates[0];
  for (const next of candidates.slice(1)) {
    const bestCount = best.messages?.length ?? 0;
    const nextCount = next.messages?.length ?? 0;
    if (nextCount > bestCount) {
      best = next;
      continue;
    }
    if (nextCount < bestCount) continue;
    const bestAt = Number(best.lastArchivedAt) || 0;
    const nextAt = Number(next.lastArchivedAt) || 0;
    if (nextAt > bestAt) {
      best = next;
      continue;
    }
    if (nextAt < bestAt) continue;
    if (preferDevice && next.sourceDevice === preferDevice && best.sourceDevice !== preferDevice) {
      best = next;
    }
  }
  return best;
}

export function inheritMessagesFromPeerArchive(
  record: ChatArchiveRecord,
  peer: ChatArchiveRecord
): ChatArchiveRecord {
  if (!peer.messages?.length) return record;
  return {
    ...record,
    messages: peer.messages,
    omitted: {
      ...record.omitted,
      noLocalSessionFile: record.omitted.noLocalSessionFile,
      largeOutputs: peer.omitted?.largeOutputs ?? record.omitted.largeOutputs,
      stoppedBySizeLimit: peer.omitted?.stoppedBySizeLimit ?? record.omitted.stoppedBySizeLimit,
      truncatedMessages: peer.omitted?.truncatedMessages ?? record.omitted.truncatedMessages,
    },
  };
}

/** 将同一会话里「空存档」用其它设备已同步过来的 richer 存档补齐正文 */
export function planPeerArchiveUpgrades(items: ArchiveListItem[]): ArchiveListItem[] {
  const byKey = new Map<string, ArchiveListItem[]>();
  for (const item of items) {
    const key = `${item.record.sourceProvider}::${item.record.conversationId}`;
    const group = byKey.get(key) ?? [];
    group.push(item);
    byKey.set(key, group);
  }

  const upgrades: ArchiveListItem[] = [];
  for (const group of byKey.values()) {
    const richest = pickRicherArchiveRecord(group.map((entry) => entry.record));
    if (!richest?.messages?.length) continue;
    for (const item of group) {
      if ((item.record.messages?.length ?? 0) > 0) continue;
      upgrades.push({
        ...item,
        record: inheritMessagesFromPeerArchive(item.record, richest),
      });
    }
  }
  return upgrades;
}

/** 同一会话多设备存档合并：优先保留消息更多的那份（跨设备 iCloud 同步后查看） */
export function dedupeArchiveItems(items: ArchiveListItem[], currentDevice: string): ArchiveListItem[] {
  const byKey = new Map<string, ArchiveListItem[]>();
  for (const item of items) {
    const key = `${item.record.sourceProvider}::${item.record.conversationId}`;
    const group = byKey.get(key) ?? [];
    group.push(item);
    byKey.set(key, group);
  }

  const deduped: ArchiveListItem[] = [];
  for (const group of byKey.values()) {
    const devices = [...new Set(group.map((entry) => entry.record.sourceDevice))];
    const peerSourceDevices = devices.filter((device) => device !== currentDevice);
    const winnerRecord = pickRicherArchiveRecord(
      group.map((entry) => entry.record),
      currentDevice
    );
    if (!winnerRecord) continue;

    const winnerItem =
      group.find((entry) => entry.record === winnerRecord) ??
      group.find((entry) => entry.record.sourceDevice === winnerRecord.sourceDevice) ??
      group[0];

    const hasCrossDevicePeer = peerSourceDevices.length > 0;
    deduped.push({
      ...winnerItem,
      record: winnerRecord,
      isCrossDevice: winnerRecord.sourceDevice !== currentDevice || hasCrossDevicePeer,
      peerSourceDevices: peerSourceDevices.length > 0 ? peerSourceDevices : undefined,
    });
  }

  deduped.sort((a, b) => (Number(b.record.updatedAt) || 0) - (Number(a.record.updatedAt) || 0));
  return deduped;
}
