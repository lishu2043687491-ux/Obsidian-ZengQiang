# ZengQiang Enhanced / 增强写作体验

**插件 id：** `feishu-doc-toolbar`  
**仓库：** https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## 简介（中文）

浮动 **T 工具栏**、**模板库**、**内置原生表格增强**（配色 / 长宽高 / 行段配色 / 模板库 / OneNote 原生粘贴），以及多种实用工具（粘贴触发文件本地化、宽页面、复制成图、Claudian 跨设备存档、内嵌指向链接增强）。

- **单插件即用**：原生表格增强已内置，**无需**再单独安装 `markdown-table-enhancer`。
- 模板功能使用 vault 内 **`.templates/`**（可配置）；仓库 bundled 示例见 `examples/templates/`（不含个人模板库内容）。
- 非原生的「增强表格」实验态在发布版中**恒定关闭**，普通表格不会被自动增强。

---

## 隐私与权限说明 / Privacy

本插件**不会**将 vault 内容或系统信息上传到第三方服务器。下列能力仅在您主动使用相关功能时触发：

| 能力 | 用途 | 说明 |
|------|------|------|
| **Vault 枚举** | 模板库、文件本地化、内嵌链接解析 | 本地扫描路径；不上传 |
| **Vault 读写** | 模板、存档、附件本地化、表格配色 | Obsidian API |
| **剪贴板** | 复制成图、OneNote 粘贴 | 用户主动操作时 |
| **设备标识** | Claudian 跨设备存档文件名 | 随机 `deviceId`，不读主机名 |
| **内嵌 block-link-plus** | 段落/文件夹短链 | 请关闭独立 block-link-plus |

**Claudian（可选）：** 需已安装 [Claudian](https://github.com/YishenTu/claudian)。

---

## Requirements (English)

Single plugin — no companion required. Native table enhancement (colors, column width, row height, template library, OneNote native paste) is **built in**. Block short links are also built in; disable the standalone block-link-plus plugin if both are installed.

## Installation

1. Download `main.js`, `manifest.json`, `styles.css` from the latest Release into `.obsidian/plugins/feishu-doc-toolbar/`
2. Enable **ZengQiang Enhanced** in Obsidian settings
3. No need to install `markdown-table-enhancer`; disable it if previously installed

```bash
npm install && npm run build:oss
```

## Example templates

Bundled starters in [`examples/templates/`](examples/templates/) — copy into your vault `.templates/` folder.

## License

MIT
