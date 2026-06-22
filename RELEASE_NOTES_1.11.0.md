# ZengQiang Enhanced 1.11.0

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-06-22

## 摘要

1.11.0 汇总 6 月阶段性迭代：Claudian 跨设备续聊与存档 UI 抗崩、文件本地化改为粘贴触发、下线自研版本历史回归官方能力、OneNote 原生表格粘贴稳定化、第三方插件白名单自动更新，以及社区审查所需的隐私与构建合规修复。**不包含** vault 个人模板库内容；仓库仅保留 `examples/templates/` 通用示例。

## 新功能与增强

### Claudian 跨设备（6-11 ~ 6-16）

- **跨设备桥接**（`claudian-cross-device-bridge`）：同会话多设备归档合并、续聊映射、Codex thread 桥接
- **存档列表/详情抗崩**（6-16）：弹窗渲染 `try/catch`，异常时降级提示，避免白屏
- **设备标识**：首次启用生成随机 `deviceId` 写入插件 data，**不读取主机名**

### 文件自动本地化（6-14）

- 改为 **粘贴触发**：不再监听 `file-open` / `modify` / `create`
- 仅在粘贴远程图、OneNote 链接、data URL 或旧附件格式时处理当前笔记
- 降低 Renderer CPU 占用与启动卡顿风险

### 第三方插件管理（6-09）

- 设置页「第三方插件管理」：默认白名单 YOLO、Claudian（`realclaudian`）
- 启动延迟自动检查；**禁止**自动更新自研插件（feishu-doc-toolbar、mte、block-link-plus 等）

### OneNote 粘贴（稳定入口）

- 自研功能第 7 卡「OneNote 粘贴（原生表格）」；单一粘贴入口
- 通用嵌套表压扁引擎；产出官方 pipe 表
- 状态栏「粘贴 OneNote」快捷按钮

## 移除与调整

- **下线自研「本地文件版本历史」**（6-14）：移除内嵌模块与右键入口，回归 Obsidian 官方版本历史；降低维护面与卡顿排查成本
- **开源构建不含**：礼书个人「目标进展查漏补缺」状态栏与命令（`goal-progress-sync`，仅非 OSS 日常构建）
- **开源构建不含**：vault `.模板库/` 个人模板；请使用仓库 `examples/templates/` 或自建 `.templates/`

## 当前内嵌模块（5 + OneNote 卡片）

| 模块 | 说明 |
|------|------|
| 文件自动本地化 | 粘贴触发附件本地化 |
| 全局宽页面 | 默认宽屏布局 |
| 右键复制成图 | 选区/表格/页面 PNG |
| Claudian 聊天记录同步 | 轻量 JSON 存档 + 跨设备 |
| 指向链接增强 | 内嵌 BLP |
| OneNote 粘贴 | 主插件内稳定卡片 |

另：**T 工具栏**、**模板库管理**、**原生表格配色**（需 **markdown-table-enhancer** 伴生插件）。

## 社区审查与构建合规

- manifest `description` 英文句号结尾
- 移除 `os.hostname()`；Claudian 使用随机 `deviceId`
- 内嵌 BLP 使用 `__FDTB_BLP_LANG__`，构建产物无 `localStorage`
- `OSS_RELEASE=1` 构建锁定增强表格实验入口；脱敏个人 vault 路径

## 安装

1. 复制 `companion-plugins/markdown-table-enhancer/` → `.obsidian/plugins/markdown-table-enhancer/`
2. 从本 Release 下载或覆盖 `feishu-doc-toolbar/`（`main.js` `manifest.json` `styles.css`）
3. 启用两个插件并重启 Obsidian

## 示例模板

仓库 `examples/templates/`：`5why.md`、`六问法 pro 版.md`、`basic-note.md`、`color-table.md` 等（**非**个人 `.模板库`）。

## 构建与测验

```bash
npm install
npm run build:oss
npm run test:smoke
```

Release 附件：`main.js` · `manifest.json` · `styles.css`
