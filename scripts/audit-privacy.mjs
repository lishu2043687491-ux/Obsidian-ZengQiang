#!/usr/bin/env node
/**
 * 开源隐私门禁：扫描 main.js 与即将提交的源码，阻止密钥/路径/Cookie 泄漏。
 * 用法：npm run build:oss && node scripts/audit-privacy.mjs
 */
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainJs = path.join(root, "main.js");

const BLOCK_PATTERNS = [
  { name: "personal-path-mac", re: /\/Users\/mac\b/i },
  { name: "personal-path-lishu", re: /\/Users\/lishu\b/i },
  { name: "vault-name", re: /近期工作|知识仓库/i },
  { name: "hostname", re: /os\.hostname\s*\(/ },
  { name: "localStorage", re: /localStorage\b/ },
  { name: "github-token", re: /gho_[A-Za-z0-9_]+/ },
  { name: "github-pat", re: /github_pat_[A-Za-z0-9_]+/ },
  { name: "openai-key", re: /sk-[A-Za-z0-9]{20,}/ },
  { name: "google-api-key", re: /AIza[0-9A-Za-z\-_]{20,}/ },
  { name: "bearer-secret", re: /Bearer\s+[A-Za-z0-9._\-]{20,}/ },
  { name: "cookie-value", re: /SESSDATA=[^"'\\s]{20,}/i },
  { name: "session-secret-literal", re: /session[_-]?secret["'\s:=]+["'][A-Za-z0-9+/=]{16,}/i },
  { name: "agent-token-literal", re: /agent[_-]?token["'\s:=]+["'][A-Za-z0-9._\-]{16,}/i },
  { name: "oss-release-disabled", re: /\bOSS_RELEASE\s*=\s*false\b/ },
  { name: "private-video-summary-domain", re: /video-summary\.nimao\.cn/i },
  { name: "private-domain", re: /\bnimao\.cn\b/i },
];

const ALLOWLIST_SNIPPETS = [
  "插件不保存 Cookie",
  "已配置（已隐藏）",
  "由视频总结服务托管",
  "Bearer token、Cookie、API Key 不放在消息里",
  "Work Buddy 远程调用需要 Bearer token",
  "video-summary-service",
  "agentTokenConfigured",
  "agentTokenLength",
  "webPasswordConfigured",
  "sessionSecretConfigured",
];

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`audit-privacy: missing ${filePath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOWLIST_SNIPPETS.some((s) => line.includes(s))) continue;
    for (const { name, re } of BLOCK_PATTERNS) {
      if (re.test(line)) {
        hits.push({ file: path.relative(root, filePath), line: i + 1, rule: name, text: line.trim().slice(0, 160) });
      }
    }
  }
  return hits;
}

const forbiddenInGit = ["data.json", ".env", ".env.local"];
if (process.env.CHECK_GIT === "1") {
  const staged = childProcess.execFileSync("git", ["diff", "--cached", "--name-only"], {
    cwd: root,
    encoding: "utf8",
  });
  for (const rel of forbiddenInGit) {
    if (staged.split("\n").some((line) => line === rel || line.endsWith(`/${rel}`))) {
      console.error(`audit-privacy: forbidden file staged for commit: ${rel}`);
      process.exit(1);
    }
  }
}

const hits = scanFile(mainJs);
if (hits.length) {
  console.error("audit-privacy FAILED:");
  for (const h of hits) {
    console.error(`  [${h.rule}] ${h.file}:${h.line} ${h.text}`);
  }
  process.exit(1);
}

console.log("audit-privacy passed");
