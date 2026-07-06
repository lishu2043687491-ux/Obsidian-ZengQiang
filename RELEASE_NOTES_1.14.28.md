# ZengQiang Enhanced 1.14.28

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-07-07

## 摘要

1.14.28 是 1.14.27 的隐私热修正版：移除公开构建中的个人视频总结服务域名，并补强发布前门禁，防止日常构建产物误作为 OSS Release 附件上传。

## 修复

- 视频总结默认 `serviceUrl` / `agentJobsUrl` 改为空值；个人服务地址只保留在本地配置，不进入源码默认值或 Release 附件。
- OSS Release 附件必须显示 `OSS_RELEASE=true`，若检测到 `OSS_RELEASE=false` 将停止发布。
- 隐私门禁新增个人服务域名拦截：`video-summary.nimao.cn` / `nimao.cn`。

## 工具链

- `npm run audit:privacy` 增加 OSS 构建状态和个人域名检查。
- `npm run publish:oss` 在上传 GitHub Release 前复扫实际附件 `main.js`。

## 合规（OSS 构建）

- 无个人路径 / hostname / localStorage / token / Cookie 明文。
- 无个人视频总结服务域名。
- 不含「目标进展查漏补缺」个人命令（`OSS_RELEASE=1`）。
- manifest `description` 英文句号结尾。

## 安装

1. 从本 Release 下载 `main.js`、`manifest.json`、`styles.css`
2. 放入 `.obsidian/plugins/feishu-doc-toolbar/` 并启用

## 构建与验收

```bash
npm install
npm run build:oss
npm run audit:privacy
npm run test:smoke
npm run audit:css
```

Release 附件：`main.js` · `manifest.json` · `styles.css`
