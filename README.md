# ZengQiang Enhanced / 增强写作体验

**插件 id：** `feishu-doc-toolbar`  
**仓库：** https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## 简介（中文）

浮动 **T 工具栏**、**模板库**、**原生表格配色**，以及多种内嵌实用工具（文件本地化、版本历史、宽页面、复制成图、Claudian 聊天记录存档、指向链接增强）。

- 需同时安装本仓库 **`companion-plugins/markdown-table-enhancer/`** 作为表格底座。
- **增强表格**无单独按钮；仅在「自研功能开关 → 启用测试功能 → OneNote 高保真粘贴」开启时后台可用。
- 内置示例模板见 `examples/templates/`（含 **5why**、**六问法 pro 版**）。

---

## Requirements (English)

Install the bundled **markdown-table-enhancer** companion first (same repo, not a separate community listing):

1. Copy [`companion-plugins/markdown-table-enhancer/`](companion-plugins/markdown-table-enhancer/) → `.obsidian/plugins/markdown-table-enhancer/`
2. Enable **原生表格增强** in Obsidian settings

This main plugin depends on it for native table colors, column width, row height, and template dialogs.

**Paragraph and folder short links** (block-link-plus) are **built in** — no separate block-link-plus plugin needed. Disable the standalone plugin if both are installed to avoid duplicate behavior.

Built-in link UX: unified editor context menu, hidden `^block-id` anchors with optional 30s reveal, accidental-delete protection, and safer anchor placement when a paragraph has blank lines or images.

## Features (stable, enabled by default)

- Floating **T toolbar** — formatting, insert menu, tables, templates
- **Template library** — CRUD in settings, toolbar menu, and table modal (stored in `.templates/`)
- **Native table enhancement** — color presets, row/column sizing via `markdown-table-enhancer`
- **File auto-localizer** — download WeChat, Cubox, OneNote, and remote images to `_attachments/`
- **Global wide page** — default wide reading/editing layout
- **Copy as image** — right-click copy selection, table, or page as PNG
- **Claudian chat archive** — lightweight cross-device chat logs (requires [Claudian](https://github.com/YishenTu/claudian) plugin)

## Beta / experimental features

Off by default. Enable in **Settings → Obsidian Enhanced Experience → 自研功能开关 → 启用测试功能**:

- OneNote rich paste (when test features are on)

**Enhanced table mode** (merge, cell images, snapshots) is **not in this release** — no settings UI; source code is kept for a future version. Only **native** table colors and sizing are available.

## Installation (manual)

1. Install the companion: `companion-plugins/markdown-table-enhancer/` → `.obsidian/plugins/markdown-table-enhancer/`
2. Copy this repo (or download Release assets) into `.obsidian/plugins/feishu-doc-toolbar/`
3. Enable both plugins in Obsidian settings

From source:

```bash
npm install && npm run build
```

## Development

```bash
npm install
npm run build
npm run test:smoke
```

## Example templates (bundled)

Default starter templates ship in [`examples/templates/`](examples/templates/):

| File | Description |
|------|-------------|
| `5why.md` | 5 Why analysis table |
| `六问法 pro 版.md` | Six-questions structured review |

Copy into your vault’s template folder (default `.templates/`, configurable in settings). See `examples/templates/templates-index.md`.

## License

MIT — see [LICENSE](LICENSE).
