# ZengQiang Enhanced / 增强写作体验

**插件 id：** `feishu-doc-toolbar`  
**仓库：** https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## 简介（中文）

浮动 **T 工具栏**、**模板库**、**原生表格配色**，以及多种内嵌实用工具（文件本地化、版本历史、宽页面、复制成图、Claudian 聊天记录存档、指向链接增强）。

- 需同时安装 **`markdown-table-enhancer`** 伴生插件（见下方安装说明）。
- **增强表格**无单独按钮；仅在「自研功能开关 → 启用测试功能 → OneNote 高保真粘贴」开启时后台可用。

---

## 隐私与权限说明 / Privacy

本插件**不会**将 vault 内容或系统信息上传到第三方服务器。下列能力仅在您主动使用相关功能时触发：

| 能力 | 用途 | 说明 |
|------|------|------|
| **Vault 枚举** | 模板库、文件版本历史、文件本地化、内嵌链接解析 | 使用 `vault.getFiles` / `getMarkdownFiles` 在本地扫描路径；不上传 |
| **Vault 读写** | 模板、存档、附件本地化、版本快照 | 通过 Obsidian API `vault.read` / `modify` / `create` |
| **剪贴板** | 复制成图、表格/链接复制、OneNote 粘贴 | 仅在您执行复制/粘贴命令时使用 |
| **设备标识** | Claudian 跨设备聊天存档文件名 | 使用插件 `data.json` 中的随机 `deviceId`，**不读取**计算机主机名 |
| **内嵌 block-link-plus** | 段落/文件夹短链 | 已内嵌，无需再装同名社区插件；请关闭独立 `block-link-plus` 以免冲突 |

**Claudian 存档（可选）：** 需已安装 [Claudian](https://github.com/YishenTu/claudian)。首次启用会在设置中生成「本机设备标识」；可手动改回旧名称以延续历史存档文件名。

---

## Requirements (English)

Install **markdown-table-enhancer** as a second plugin in the same vault (bundled copy in the GitHub repo under `companion-plugins/markdown-table-enhancer/`):

1. Copy `companion-plugins/markdown-table-enhancer/` → `.obsidian/plugins/markdown-table-enhancer/`
2. Enable it in Obsidian settings

**Block short links** are built into this plugin. Disable the standalone block-link-plus plugin if both are installed.

## Installation (manual)

1. Install companion `markdown-table-enhancer` (see above)
2. Copy Release assets or this repo into `.obsidian/plugins/feishu-doc-toolbar/`
3. Enable both plugins

```bash
npm install && npm run build
```

## License

MIT
