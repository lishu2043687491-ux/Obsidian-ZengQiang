# Obsidian 社区插件提交清单（目标版本 1.0.5）

仓库：https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## manifest

| 字段 | 值 |
|------|-----|
| `id` | `feishu-doc-toolbar` |
| `name` | `ZengQiang Enhanced` |
| `version` | `1.0.5`（与 Release tag 一致） |

## 官方 1.0.3 审查对照（1.0.5）

| 类别 | 项 | 1.0.5 状态 |
|------|-----|------------|
| Manifest | description 以 `.` `!` `?` 结尾 | 已修复 |
| Behavior | 无 os.hostname / 系统身份 | 已修复（随机 deviceId） |
| Behavior | 无 localStorage stub | 已修复 |
| Behavior | Vault Read/Write | Pass（保持） |
| Behavior | Vault 枚举 / 剪贴板 | Recommendation → README 已说明 |
| Releases | artifact attestation | 可选，未做 |
| CSS lint | text-decoration / :has 抽样 | 1.0.5 已抽样修复 |
| CSS lint | 大量 !important（BLP/表格） | 部分保留，非阻塞 |
| Dependencies | 无漏洞 | Pass（保持） |

## Release 附件

- [ ] `main.js`
- [ ] `manifest.json`
- [ ] `styles.css`

## 提交步骤（由开发者操作）

1. 知识仓库测验通过 → 授权助手推 GitHub **1.0.5**
2. https://obsidian.md/plugins → Manage plugins → 更新仓库 Release
3. https://community.obsidian.md/account/plugins/feishu-doc-toolbar → 等待 Review branch 对 **1.0.5** 扫描

## 禁止

- 不要用 **1.0.4** 作为社区 Current release
- 测验未通过前不要 `gh release create 1.0.5`
