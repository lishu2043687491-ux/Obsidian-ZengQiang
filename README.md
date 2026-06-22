# ZengQiang Enhanced / 增强写作体验

**插件 id：** `feishu-doc-toolbar`  
**仓库：** https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## 简介（中文）

浮动 **T 工具栏**、**模板库**、**原生表格配色**，以及多种内嵌实用工具（粘贴触发文件本地化、宽页面、复制成图、Claudian 跨设备存档、内嵌指向链接增强、OneNote 原生表格粘贴）。

- 需同时安装 **`markdown-table-enhancer`** 伴生插件（见下方安装说明）。
- 模板功能使用 vault 内 **`.templates/`**（可配置）；仓库 bundled 示例见 `examples/templates/`（不含个人模板库内容）。
- **增强表格**实验入口在 OSS 构建中默认锁定；日常以原生表格配色与 OneNote 粘贴为主。

---

## 隐私与权限说明 / Privacy

本插件**不会**将 vault 内容或系统信息上传到第三方服务器。下列能力仅在您主动使用相关功能时触发：

| 能力 | 用途 | 说明 |
|------|------|------|
| **Vault 枚举** | 模板库、文件本地化、内嵌链接解析 | 本地扫描路径；不上传 |
| **Vault 读写** | 模板、存档、附件本地化 | Obsidian API |
| **剪贴板** | 复制成图、OneNote 粘贴 | 用户主动操作时 |
| **设备标识** | Claudian 跨设备存档文件名 | 随机 `deviceId`，不读主机名 |
| **内嵌 block-link-plus** | 段落/文件夹短链 | 请关闭独立 block-link-plus |

**Claudian（可选）：** 需已安装 [Claudian](https://github.com/YishenTu/claudian)。

---

## Requirements (English)

Install **markdown-table-enhancer** from `companion-plugins/markdown-table-enhancer/` into `.obsidian/plugins/markdown-table-enhancer/` and enable it.

Block short links are built in. Disable standalone block-link-plus if both are installed.

## Installation

1. Companion `markdown-table-enhancer` (see above)
2. Release assets or repo → `.obsidian/plugins/feishu-doc-toolbar/`
3. Enable both plugins

```bash
npm install && npm run build:oss
```

## Example templates

Bundled starters in [`examples/templates/`](examples/templates/) — copy into your vault `.templates/` folder.

## License

MIT
