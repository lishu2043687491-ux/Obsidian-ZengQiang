export type VideoSeekTarget = {
  start: number;
  end?: number;
};

export type VideoSummaryMetadata = {
  sourceUrl: string;
  platform: string;
  title: string;
  videoId: string;
  mediaPath: string;
  mediaType: string;
  duration: number;
};

const SEEK_HASH_PREFIX = "#video-summary-seek";
const SEEK_LEGACY_PREFIX = "video-summary://seek";
const SEEK_URL_RE = /^(?:#video-summary-seek|video-summary:\/\/seek)\?(.+)$/;
const LEGACY_TIMELINE_RE = /^(\s*[-*]\s*)?\[(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)$/;
const TIMELINE_TEXT_RE = /(?:^|\s|\[)(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)(?:\]|\s|$)/;

export function parseTimestampToSeconds(value: string): number | null {
  const parts = String(value || "")
    .trim()
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  if (parts.length !== 2 && parts.length !== 3) return null;
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function formatSecondsForSeek(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.max(0, Math.round(value * 1000) / 1000);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function buildSeekUrl(start: number, end?: number): string {
  const params = [`start=${encodeURIComponent(formatSecondsForSeek(start))}`];
  if (typeof end === "number" && Number.isFinite(end)) {
    params.push(`end=${encodeURIComponent(formatSecondsForSeek(end))}`);
  }
  return `${SEEK_HASH_PREFIX}?${params.join("&")}`;
}

export function parseSeekUrl(rawUrl: string): VideoSeekTarget | null {
  const url = String(rawUrl || "").trim();
  const hashIndex = url.indexOf(SEEK_HASH_PREFIX);
  const legacyIndex = url.indexOf(SEEK_LEGACY_PREFIX);
  const normalized =
    hashIndex >= 0 ? url.slice(hashIndex) : legacyIndex >= 0 ? url.slice(legacyIndex) : url;
  const match = normalized.match(SEEK_URL_RE);
  if (!match) return null;
  const params = new URLSearchParams(match[1]);
  const start = Number(params.get("start"));
  if (!Number.isFinite(start) || start < 0) return null;
  const rawEnd = params.get("end");
  const end = rawEnd === null ? undefined : Number(rawEnd);
  return {
    start,
    end: Number.isFinite(end) && end >= 0 ? end : undefined,
  };
}

export function parseTimelineText(value: string): VideoSeekTarget | null {
  const match = String(value || "").match(TIMELINE_TEXT_RE);
  if (!match) return null;
  const start = parseTimestampToSeconds(match[1]);
  const end = parseTimestampToSeconds(match[2]);
  if (start === null) return null;
  return { start, end: end ?? undefined };
}

export function convertLegacyTimelineLine(line: string): string {
  const match = String(line || "").match(LEGACY_TIMELINE_RE);
  if (!match) return line;
  const prefix = match[1] ?? "";
  const startText = match[2];
  const endText = match[3];
  const rest = match[4] ?? "";
  const start = parseTimestampToSeconds(startText);
  const end = parseTimestampToSeconds(endText);
  if (start === null || end === null) return line;
  return `${prefix}[${startText} - ${endText}](${buildSeekUrl(start, end)}) ${rest}`.trimEnd();
}

export function convertLegacyTimelineMarkdown(markdown: string): string {
  return String(markdown || "")
    .split("\n")
    .map((line) => convertLegacyTimelineLine(line))
    .join("\n");
}

export function hasVideoSummarySeekLink(markdown: string): boolean {
  return /(?:#video-summary-seek|video-summary:\/\/seek)\?/.test(String(markdown || ""));
}

export function absolutePathToFileUrl(path: string): string {
  const normalized = String(path || "").replace(/\\/g, "/");
  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `file://${withLeadingSlash
    .split("/")
    .map((part, index) => (index === 0 ? "" : encodeURIComponent(part)))
    .join("/")}`;
}

export function mediaTypeFromPath(path: string): "video" | "audio" | "unknown" {
  const ext = String(path || "").toLowerCase().split(".").pop() ?? "";
  if (["mp4", "webm", "mov", "mkv", "m4v"].includes(ext)) return "video";
  if (["mp3", "m4a", "wav", "aac", "flac", "ogg"].includes(ext)) return "audio";
  return "unknown";
}

export function buildVideoSummaryMediaCandidates(videoId: string, mediaPath = "", platform = "", mediaLibraryPath = ""): string[] {
  const rawId = String(videoId || "").trim();
  const stems = new Set<string>();
  if (rawId) stems.add(rawId);

  const basename = String(mediaPath || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop();
  if (basename) {
    const stem = basename.replace(/\.[^.]+$/, "");
    if (stem) stems.add(stem.replace(/\.preview$/, ""));
  }

  const platformDir = String(platform || "").trim().toLowerCase();
  const mediaLibrary = String(mediaLibraryPath || "").trim().replace(/\/+$/, "");
  const directories = [
    ...(mediaLibrary && platformDir
      ? [
          `${mediaLibrary}/${platformDir}`,
        ]
      : []),
    ...(mediaLibrary ? [mediaLibrary] : []),
    "开发插件（Obsidian优化）/视频总结（仓库）/_media",
    "视频总结（仓库）/_media",
    "_video-summary-media",
  ];
  const candidates: string[] = [];
  for (const stem of stems) {
    for (const directory of directories) {
      candidates.push(`${directory}/${stem}.preview.mp4`);
    }
    for (const directory of directories) {
      candidates.push(`${directory}/${stem}.mp4`);
    }
    for (const directory of directories) {
      candidates.push(`${directory}/${stem}.mp3`);
    }
  }
  return [...new Set(candidates)];
}

function extractYouTubeId(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace(/^\/+/, "").split("/")[0] ?? "";
    }
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") ?? url.pathname.match(/\/(?:shorts|embed)\/([^/?#]+)/)?.[1] ?? "";
    }
  } catch {
    return "";
  }
  return "";
}

function extractBilibiliBvid(sourceUrl: string): string {
  const match = String(sourceUrl || "").match(/\/video\/(BV[0-9A-Za-z]+)/);
  return match?.[1] ?? "";
}

export function detectVideoPlatform(sourceUrl: string): string {
  const value = String(sourceUrl || "").toLowerCase();
  if (value.includes("bilibili.com") || value.includes("b23.tv")) return "bilibili";
  if (value.includes("douyin.com") || value.includes("iesdouyin.com")) return "douyin";
  if (value.includes("youtube.com") || value.includes("youtu.be")) return "youtube";
  return "";
}

export function buildOnlineEmbedUrl(sourceUrl: string, platform: string, start: number): string {
  const normalizedPlatform = platform || detectVideoPlatform(sourceUrl);
  const startSeconds = Math.max(0, Math.floor(Number.isFinite(start) ? start : 0));
  if (normalizedPlatform === "youtube") {
    const id = extractYouTubeId(sourceUrl);
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}?start=${startSeconds}&autoplay=1` : "";
  }
  // Bilibili's source-site iframe may treat player clicks as a navigation to B站.
  // Use media_url/raw media or local cache instead, where pause/seek stay under our control.
  if (normalizedPlatform === "bilibili") return "";
  return "";
}
