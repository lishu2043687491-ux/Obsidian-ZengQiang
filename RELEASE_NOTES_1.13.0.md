# ZengQiang Enhanced 1.13.0

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-06-23

## 摘要

1.13.0 是 1.12.0「原生表格增强内置」之后的修复版：恢复普通 Markdown 表格的右键「美化 / 启用配色 + 长宽高」入口，并把表格设置数据迁移到主插件托管，确保重启后不再退回白底、不可右键的状态。

## 修复

### 1. 原生表格右键启用恢复

- **问题**：1.12.0 内置后，普通 Obsidian 原生表格的右键菜单会被原生菜单抢先处理，导致「对当前表格美化 / 启用颜色 + 长宽高」不可用，表格仍是白底
- **修复**：表格右键在捕获阶段立即拦截（仅限 Markdown 笔记中的表格），解析当前表格后弹出内置原生表格增强菜单

### 2. 表格数据托管与自动迁移

- 内置原生表格增强数据改由主插件 `feishu-doc-toolbar/data.json` 托管
- 首次启动自动从旧 `markdown-table-enhancer/data.json` 迁移已有表格配色 / 长宽高设置

### 3. 旧增强表格持久降级

- 旧 `enhanced` 表格记录在启动时强制持久迁移为 `nativeLayout`
- 仅保留原生表格长宽高与配色能力，避免重启后又回到白底 / 不可右键状态

## 清理

- 外部 `markdown-table-enhancer` 插件目录从 vault 插件根移除，避免继续干扰（源码删除记录保留在开发 Git）
- 保持：不恢复 legacy enhanced；不注册合并 / 拆分 / 图片单元格等非原生增强入口

## 合规

- 无 `os.hostname()` / `localStorage` stub / 个人 vault 路径泄漏（`OSS_RELEASE=1`）
- manifest `description` 英文句号结尾

## 安装

1. 从本 Release 下载 `main.js`、`manifest.json`、`styles.css` 放入 `.obsidian/plugins/feishu-doc-toolbar/`
2. 启用 **ZengQiang Enhanced**；**无需** 安装 `markdown-table-enhancer`

## 构建与验收

```bash
npm install
npm run build:oss
npm run test:smoke
```

Release 附件：`main.js` · `manifest.json` · `styles.css`
