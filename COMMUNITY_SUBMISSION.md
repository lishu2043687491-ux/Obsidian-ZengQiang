# Obsidian 社区插件提交清单（目标版本 1.13.0）

仓库：https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## manifest

| 字段 | 值 |
|------|-----|
| `id` | `feishu-doc-toolbar` |
| `name` | `ZengQiang Enhanced` |
| `version` | `1.13.0`（与 Release tag 一致） |

## 本版重点（1.13.0）

- 1.12.0：原生表格增强完整内置，单插件即用，**无需** companion `markdown-table-enhancer`；修复非原生增强表格乱自动开启
- 1.13.0：修复内置后普通表格右键「美化 / 启用配色 + 长宽高」失效；表格数据迁移到主插件托管

## 官方审查对照

| 类别 | 项 | 状态 |
|------|-----|------|
| Manifest | description 以 `.` `!` `?` 结尾 | 已修复 |
| Behavior | 无 os.hostname / 系统身份 | 已修复（随机 deviceId） |
| Behavior | 无 localStorage stub | 已修复 |
| Behavior | Vault Read/Write | Pass（保持） |
| Behavior | Vault 枚举 / 剪贴板 | Recommendation → README 已说明 |
| Releases | artifact attestation | 可选，未做 |
| CSS lint | text-decoration / :has 抽样 | 抽样修复 |
| CSS lint | 大量 !important（BLP/表格） | 部分保留，非阻塞 |
| Dependencies | 无漏洞 | Pass（保持） |

## Release 附件

- [x] `main.js`
- [x] `manifest.json`
- [x] `styles.css`

## 提交步骤（由开发者操作）

1. 推 GitHub Release **1.12.0**（已自动化完成）
2. https://obsidian.md/plugins → Manage plugins → 确认仓库最新 Release 为 1.12.0
3. https://community.obsidian.md/account/plugins/feishu-doc-toolbar → 等待 Review branch 对 **1.12.0** 重新扫描

## 禁止

- 不要提交 `data.json`、`file-versions/`、`.模板库/` 个人模板
- 单插件叙事：README/安装说明不再要求安装 companion
