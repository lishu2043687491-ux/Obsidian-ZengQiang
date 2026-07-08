# ZengQiang Enhanced 1.14.35

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-07-08

## 摘要

1.14.35 聚焦两条线：一是把视频总结时间轴预览补成更稳定的在线 / 本地双播放链路；二是把 Claudian 相关设置收口到统一入口，并继续强化公开版本的隐私边界。

## 本版更新

- 视频总结时间轴预览支持外置媒体库，右侧栏可在在线直链与本地缓存之间切换。
- 优先使用有声预览媒体，修复部分本地视频可播但无声或 0:00 的情况。
- 点击时间轴后会沿用当前播放端，减少反复跳回另一种播放模式。
- 默认禁用 B 站源站 iframe 兜底，避免暂停或点击时跳回站外页面。
- Claudian 相关能力收口到统一设置区，便于集中管理跨设备续聊、`@` 排除规则和接入修复。
- 启动后会自动补齐 Claudian `@` 候选排除规则，默认排除开发插件目录，避免把本地开发资料误带进会话候选。
- 视频总结设置继续保持脱敏：公开版本只保留可填写入口，不写入个人服务地址、Cookie、API Key、Agent token 或 session secret。

## 合规（OSS 构建）

- 无个人路径 / hostname / localStorage / token / Cookie 明文。
- 无个人视频总结服务域名。
- Release 附件仅含 `main.js`、`manifest.json`、`styles.css`。
- 发布前对源码目录和实际上传附件做双重隐私扫描。

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
