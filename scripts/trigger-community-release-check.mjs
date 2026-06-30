#!/usr/bin/env node
/**
 * 开源发布后自动触发 Obsidian Community 开发者页「Check for new releases」。
 * 首次运行若未登录，会打开可见浏览器窗口，请用 Obsidian 账号登录一次；会话保存在 ~/.config/zengqiang-oss/playwright-profile。
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const PLUGIN_ID = process.env.OBSIDIAN_PLUGIN_ID || "feishu-doc-toolbar";
const ACCOUNT_URL = `https://community.obsidian.md/account/plugins/${PLUGIN_ID}`;
const CONFIG_DIR = path.join(process.env.HOME || "", ".config", "zengqiang-oss");
const PROFILE_DIR = path.join(CONFIG_DIR, "playwright-profile");
const HEADED =
  process.env.OBSIDIAN_COMMUNITY_HEADED === "1" ||
  (process.env.OBSIDIAN_COMMUNITY_HEADED !== "0" &&
    !fs.existsSync(path.join(PROFILE_DIR, "Default", "Cookies")));

function isLoginUrl(url) {
  return /auth\/login|obsidian\.md\/auth/i.test(url);
}

async function ensureLoggedIn(page) {
  await page.waitForTimeout(1500);
  if (!isLoginUrl(page.url()) && /account\/plugins\//i.test(page.url())) return;

  if (!HEADED) {
    throw new Error(
      "未登录 Obsidian Community。请先执行一次：npm run community:login"
    );
  }

  log("请在弹出的浏览器窗口完成 Obsidian 账号登录…");
  await page.waitForURL(/account\/plugins\//, { timeout: 300000 });
  await page.waitForTimeout(1500);
}

function log(...args) {
  console.log("[community-release-check]", ...args);
}

async function waitForMenuItem(page, label) {
  const locators = [
    page.getByRole("menuitem", { name: label }),
    page.getByRole("button", { name: label }),
    page.getByText(label, { exact: true }),
  ];
  for (const locator of locators) {
    if (await locator.count()) return locator.first();
  }
  return null;
}

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  const captured = [];
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !HEADED,
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    viewport: { width: 1440, height: 960 },
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    page.on("request", (req) => {
      const url = req.url();
      if (
        /community\.obsidian\.md\/api\//i.test(url) ||
        /api\.obsidian\.md\//i.test(url)
      ) {
        captured.push({ method: req.method(), url });
      }
    });

    log("open", ACCOUNT_URL);
    await page.goto(ACCOUNT_URL, { waitUntil: "domcontentloaded", timeout: 120000 });
    await ensureLoggedIn(page);

    if (!/account\/plugins\//i.test(page.url())) {
      throw new Error(`未进入插件管理页，当前 URL: ${page.url()}`);
    }

    const menuButton = page
      .locator('button[aria-haspopup="menu"], button:has-text("…"), button:has-text("...")')
      .first();
    if (await menuButton.count()) {
      await menuButton.click({ timeout: 10000 });
      await page.waitForTimeout(500);
    }

    const checkItem = await waitForMenuItem(page, "Check for new releases");
    if (!checkItem) {
      const fallback = page.getByText(/check for new releases/i).first();
      if (!(await fallback.count())) {
        const shot = path.join(CONFIG_DIR, "community-release-check-debug.png");
        await page.screenshot({ path: shot, fullPage: true });
        throw new Error(`未找到「Check for new releases」菜单项，已截图: ${shot}`);
      }
      await fallback.click({ timeout: 10000 });
    } else {
      await checkItem.click({ timeout: 10000 });
    }

    await page.waitForTimeout(4000);

    if (captured.length) {
      log("captured API calls:");
      for (const item of captured) log(`  ${item.method} ${item.url}`);
    } else {
      log("未捕获到 API 请求（可能走 Server Action）；页面操作已执行。");
    }

    log("done");
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error("[community-release-check] failed:", err.message || err);
  process.exit(1);
});
