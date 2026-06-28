# ZengQiang Enhanced 1.14.11

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-06-28

## 摘要

1.14.x 是在 1.13.0（原生表格右键修复 + 数据迁移）之上的稳定性与原生表格增强大版本：处理社区 CSS 低风险提醒、大幅增强 nativeLayout 表格编辑体验，并清理个人向 UI。本 Release 打包 1.14.0–1.14.11 全部变更。

## 新增与增强

### 原生表格增强（1.14.3–1.14.11）

- 行列宽拖拽、表格样式/对齐、LaTeX 识别、轻量公式显示与自动填充（仅 `nativeLayout` 官方 Markdown 表）
- 点击态修复：消除 Live Preview 透明 token、官方 `.cm-transparent` 占位导致的空白缩进与掉色
- 美化面板二级分类：美化 / 尺寸调节 / 颜色字体 / 对齐 / 填充 / 公式提示 / 模板导出
- 右下角橙色整体比例拖拽手柄；未手动调过尺寸的表首次缩放也能生效
- 默认文字色（橙色）与单元格文字色；启用/美化时不再写入默认固定列宽/行高/比例
- 普通 Markdown 表格「表」入口三层兜底（DOM 命中 / 光标反查 / 可见表注册）

### 模板库（1.14.2）

- 模板库管理页展示并可复制 `_attachments`、`.assets/attachments` 本地路径
- 增加「不敢删除的部分」只读提示清单

### CSS 与工具（1.14.0）

- 低风险 CSS 官方提醒处理：`text-decoration-line` → `text-decoration`；删除冗余 `:has(+ ul/ol)`；部分 `!important` 改为更具体选择器
- 新增 `npm run audit:css` 统计 warning 与白名单保留项
- 表格 marker、块 ID、BLP 内嵌编辑器等高风险 `!important` 保留

## 修复与清理

- **1.14.1**：移除状态栏「更新目标进展」按钮（保留命令与底层逻辑，降低与目标管理系统重复）
- **1.13.x 延续**：原生表格右键捕获拦截、表格数据主插件托管、旧 `enhanced` 持久降级为 `nativeLayout`
- **1.12.x 延续**：原生表格增强完整内置，单插件即用；非原生 enhanced 入口锁定关闭

## 合规（OSS 构建）

- 无 `os.hostname()` / `localStorage` stub / 个人 vault 路径泄漏（`OSS_RELEASE=1`）
- 开源构建不含「目标进展查漏补缺」个人功能
- manifest `description` 英文句号结尾

## 安装

1. 从本 Release 下载 `main.js`、`manifest.json`、`styles.css` 放入 `.obsidian/plugins/feishu-doc-toolbar/`
2. 启用 **ZengQiang Enhanced**；**无需** 安装 `markdown-table-enhancer`

## 构建与验收

```bash
npm install
npm run build:oss
npm run test:smoke
npm run audit:css
```

Release 附件：`main.js` · `manifest.json` · `styles.css`
