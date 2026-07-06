# ZengQiang Enhanced 1.14.27

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-07-06

## 摘要

1.14.19–1.14.27 在 1.14.18 之上继续迭代：视频总结时间轴预览、原生表格复制成图恢复、设置页折叠优化；开源构建已强化隐私门禁。

## 新增与增强

### 视频总结（1.14.19–1.14.25 区间）

- 内嵌 `video-timestamp-preview`：点击时间轴在 Obsidian 右侧预览本地/云端媒体
- 设置页「视频总结」：只展示公开配置与脱敏状态；**Cookie / API Key / Agent token / 网页密码不写入 `data.json`**
- 时间轴链接改为 `#video-summary-seek` 内部锚点，减少外部协议弹窗
- OSS 构建：`serviceUrl` 置空，不打包个人服务地址与密钥

### 原生表格（1.14.26–1.14.27）

- **1.14.26**：恢复表格旁独立「图」按钮，复用既有复制成图模块
- **1.14.27**：原生表格设置页将「公式 / Advanced Tables 编辑体验」等高级项默认折叠，首屏保留默认配色

### 工具链

- 新增 `npm run package:oss`：生成 `dist/Obsidian-ZengQiang-版本号.zip` 安装包
- 新增 `npm run audit:privacy`：发布前隐私扫描
- 发布脚本 `npm run publish:oss`：GitHub Release + 社区 Check for new releases

## 合规（OSS 构建）

- 无个人路径 / hostname / localStorage / token / Cookie 明文
- 不含「目标进展查漏补缺」个人命令（`OSS_RELEASE=1`）
- manifest `description` 英文句号结尾

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
