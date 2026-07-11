#!/usr/bin/env node
/**
 * 首次写入 vault/.claudian-sync/chat-archives/（不依赖 Obsidian 已打开）
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const VAULT =
  process.argv[2] ||
  path.join(os.homedir(), "Library/Mobile Documents/com~apple~CloudDocs/近期工作");

const bundlePath = path.join(__dirname, "../tests/claudian-test-bundle.cjs");
const {
  parseCodexJsonlFilePath,
  resolveCodexSessionFilePath,
  parseSessionMeta,
  buildArchiveRecord,
  getArchiveRelativePath,
  resolveDeviceId,
  DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS,
  ARCHIVE_ROOT,
} = require(bundlePath);

async function main() {
  const settings = { ...DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS };
  const deviceId = resolveDeviceId(settings);
  const metaDir = path.join(VAULT, ".claudian", "sessions");
  const archiveRoot = path.join(VAULT, ARCHIVE_ROOT);

  if (!fs.existsSync(metaDir)) {
    console.error("未找到 .claudian/sessions:", metaDir);
    process.exit(1);
  }

  fs.mkdirSync(archiveRoot, { recursive: true });

  const files = fs.readdirSync(metaDir).filter((f) => f.endsWith(".meta.json"));
  let archived = 0;
  let skipped = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(metaDir, file), "utf-8");
    const meta = parseSessionMeta(content);
    if (!meta) continue;

    const providerId = meta.providerId ?? "unknown";
    const rel = getArchiveRelativePath(providerId, meta.id, deviceId);
    const outPath = path.join(VAULT, rel);

    const omitted = {
      toolLogs: true,
      images: true,
      attachments: true,
      largeOutputs: false,
    };

    let messages = [];
    if (providerId !== "codex") {
      omitted.providerSkipped = true;
    } else {
      const sessionPath = resolveCodexSessionFilePath(meta);
      if (sessionPath) {
        const parsed = await parseCodexJsonlFilePath(sessionPath, {
          maxMessageBytes: settings.maxMessageBytes,
          maxTotalBytes: settings.maxArchiveBytes,
        });
        messages = parsed.messages;
        omitted.stoppedBySizeLimit = parsed.stoppedBySizeLimit;
        omitted.largeOutputs = parsed.stoppedBySizeLimit;
        omitted.truncatedMessages = parsed.messages.filter((m) => m.truncated).length;
      } else {
        omitted.noLocalSessionFile = true;
      }
    }

    const record = buildArchiveRecord(meta, messages, deviceId, omitted);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(record, null, 2), "utf-8");
    console.log("wrote", rel, messages.length ? `(${messages.length} msgs)` : "(meta only)");
    archived += 1;
  }

  const readme = path.join(VAULT, ".claudian-sync", "README.txt");
  fs.writeFileSync(
    readme,
    [
      "Claudian 轻量聊天存档（由 Obsidian增强体验 自动维护）",
      "目录：.claudian-sync/chat-archives/",
      "请勿手改 JSON；跨设备通过 iCloud 同步只读查看。",
      `本机标识：${deviceId}`,
      `最近引导归档：${new Date().toISOString()}`,
    ].join("\n"),
    "utf-8"
  );

  console.log(`\n完成：${archived} 个会话写入，${skipped} 跳过`);
  console.log("存档根目录:", archiveRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
