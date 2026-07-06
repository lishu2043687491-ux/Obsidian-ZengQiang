# Obsidian 社区插件提交清单（目标版本 1.14.27）

仓库：https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## manifest

| 字段 | 值 |
|------|-----|
| `id` | `feishu-doc-toolbar` |
| `name` | `ZengQiang Enhanced` |
| `version` | `1.14.27`（与 Release tag 一致） |

## 本版重点（1.14.27）

- 1.14.19–1.14.25：视频总结时间轴预览 + 脱敏配置页（密钥不进 data.json / OSS）
- 1.14.26：原生表格恢复「图」复制成图
- 1.14.27：原生表格设置高级区默认折叠
- 工具：`audit:privacy`、`package:oss`、`publish:oss`

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

## 提交步骤（已自动化）

```bash
cd /Users/mac/Projects/Obsidian-ZengQiang
npm run publish:oss
```

脚本顺序：同步源码 → `build:oss` + smoke → git push → `gh release create` → **自动 Check for new releases**

手动兜底： https://community.obsidian.md/account/plugins/feishu-doc-toolbar

## 禁止

- 不要提交 `data.json`、`file-versions/`、`.模板库/` 个人模板
- 单插件叙事：README/安装说明不再要求安装 companion
