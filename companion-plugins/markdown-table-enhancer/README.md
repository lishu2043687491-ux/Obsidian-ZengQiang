# Native Markdown Table Enhancer / 原生表格增强

Enhance Obsidian’s native Markdown tables with color presets, column width, row height, and a shared template library.

**Plugin id:** `markdown-table-enhancer`

## Features (stable)

- **nativeLayout** — header/zebra colors, resizable columns and rows
- Plain Markdown table insert (via companion toolbar or command palette)
- Template library modal (bridges to Obsidian Enhanced Experience when installed)
- Right-click **启用颜色+长宽高** without overwriting cell content

## Beta features (off by default)

Controlled by **Obsidian Enhanced Experience → 启用测试功能**, or command *切换增强表格测试版能力*:

- Enhanced table mode (merge/split, cell colors, inline images)
- OneNote rich paste
- Table enhancement snapshots

## Installation

```bash
npm install && npm run build
```

Copy to `.obsidian/plugins/markdown-table-enhancer/` and enable in Obsidian.

## Development

```bash
npm run build
npm run test:smoke
```

## License

MIT — see [LICENSE](LICENSE).
