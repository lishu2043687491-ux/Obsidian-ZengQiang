# Obsidian 社区插件提交清单

仓库：https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## manifest 命名（已通过官方规则核对）

| 字段 | 值 | 说明 |
|------|-----|------|
| `id` | `feishu-doc-toolbar` | 小写+连字符，不含 obsidian |
| `name` | `ZengQiang Enhanced` | **英文**显示名；不可含 Obsidian、不可中文 |
| `description` | 中文（见 manifest.json） | 设置页与目录简介 |
| `version` | 与 GitHub Release tag 一致（如 `1.0.3`） |

设置页内标题仍为「Obsidian增强体验」（插件内 UI），与社区 `name` 可不同。

## 提交前检查

- [ ] GitHub Release 最新 tag 与 `manifest.json` 的 `version` 一致
- [ ] Release 附件：`main.js`、`manifest.json`、`styles.css`
- [ ] README 说明需安装 `companion-plugins/markdown-table-enhancer/`
- [ ] 仓库内无 `data.json`、`file-versions/`、个人笔记

## Developer Dashboard 步骤

1. 打开 https://obsidian.md/plugins
2. 登录 → **Manage plugins** → **Submit new plugin**
3. 填写仓库 URL：`https://github.com/lishu2043687491-ux/Obsidian-ZengQiang`
4. 勾选开发者政策与支持承诺 → **Submit**
5. 等待自动检查（通常数分钟～24 小时）；通过后出现在社区目录

## 若再次被拒

- **名称**：只能改 `manifest.json` 的 `name`，再发新 Release
- **描述**：若机器人要求英文，在 `description` 末尾保留中文短句的同时，可改用中英双语（≤250 字符）
