# ZengQiang Enhanced 1.14.18

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-06-30

## 摘要

1.14.12–1.14.18 聚焦原生表格 **Advanced Tables 对标**与**零入侵编辑**：接入 MIT `@tgrosinger/md-advanced-tables`，补齐 Tab/Enter 跳格、排序、公式、CSV 等编辑能力，同时逐步去掉正文 `mdtp` marker，改为数据指纹定位配色/长宽高。

## 新增与增强

### Advanced Tables 对标（1.14.12–1.14.13）

- 内置 `@tgrosinger/md-advanced-tables@3.11.0`：Tab/Enter 跳格、格式化、增删移动、排序、转置、公式、CSV
- 一级「表」面板新增「编辑排序」；结构操作同步迁移 layout 元数据
- 补齐官方 `table-control-bar` 命令；CSV 导出改为 Advanced Tables 同款弹窗
- 设置页新增 `bindTab`、`bindEnter`、`formatType`、`showRibbonIcon`

### 选区与默认样式（1.14.14–1.14.15）

- 拖拽选区、填充色/文字色/对齐按选区逐格生效
- 首行/首列自动对齐可配置；默认边框关闭、斑马纹默认开启
- 面板打开前刷新选区缓存；对齐拆成选区/整行/整列

### 零入侵点击编辑（1.14.16–1.14.18）

- **1.14.16**：普通点击交还 Obsidian 原生编辑；Shift/Option 才进入插件选区
- **1.14.17**：对齐菜单简化为居左/居中/居右，范围由当前选区决定
- **1.14.18**：新表不再写 `%% mdtp:tbl_xxx %%` marker；旧表兼容读取
- 新增命令「清理当前笔记旧表格标记」；修复选中格文字变白

## 延续

- 单插件内置原生表格，无需 `markdown-table-enhancer`
- OSS 构建不含个人向「目标进展查漏补缺」
- manifest `description` 英文句号结尾

## 安装

1. 从本 Release 下载 `main.js`、`manifest.json`、`styles.css`
2. 放入 `.obsidian/plugins/feishu-doc-toolbar/` 并启用

## 构建与验收

```bash
npm install
npm run build:oss
npm run test:smoke
npm run audit:css
```

Release 附件：`main.js` · `manifest.json` · `styles.css`
