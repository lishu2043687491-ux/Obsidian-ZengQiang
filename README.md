# Obsidian Enhanced Experience / Obsidian增强体验

Unified Obsidian plugin for a richer writing experience: floating toolbar, template library, native table styling, and embedded utilities.

**Plugin id:** `feishu-doc-toolbar`  
**Repository:** https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## Requirements

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

- Enhanced table mode (merge, cell images, snapshots)
- OneNote rich paste

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

## Example templates

See [`examples/templates/`](examples/templates/). Copy into your vault’s `.templates/` folder or change the template directory in plugin settings.

## License

MIT — see [LICENSE](LICENSE).
