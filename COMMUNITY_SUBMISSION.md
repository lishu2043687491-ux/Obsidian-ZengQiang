# Obsidian 社区插件提交清单（目标版本 1.17.0）

仓库：https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## manifest

| 字段 | 值 |
|------|-----|
| `id` | `feishu-doc-toolbar` |
| `name` | `ZengQiang Enhanced` |
| `version` | `1.17.0`（与 Release tag 一致） |

> 审核边界：`manifest.json` 的插件名称保持英文 `ZengQiang Enhanced`；描述不包含 “Obsidian”，并以英文句点结尾。中文定位只出现在 README 和插件详情介绍中，不作为上传名称。

## 本版重点（1.17.0）

- 设置中心改为按使用场景分类：首页功能地图、编辑与排版、知识组织、内容与素材、自动化与 AI、第三方插件管理。
- README 首屏补充完整英文介绍，并保留中文使用说明、权限边界和安装步骤。
- `manifest.description` 使用准确的英文定位，符合社区自动审核规则。
- 根目录提供完整 GPL-3.0-only 许可证文本，便于社区和用户识别。
- 明确隐私边界：公开包不含 vault 内容、个人模板、配置、缓存、备份、本地路径或密钥。
- 工具：`audit:privacy`、`package:oss`、`publish:oss`

## 官方审查对照

| 类别 | 项 | 状态 |
|------|-----|------|
| Manifest | description 不含 `Obsidian` 且以 `.` `!` `?` 结尾 | 已修复 |
| License | 根目录完整 GPL-3.0-only 许可证 | 已修复 |
| README | 包含完整英文介绍 | 已修复 |
| Behavior | 无 os.hostname / 系统身份 | 已修复（随机 deviceId） |
| Behavior | 无 localStorage stub | 已修复 |
| Behavior | Vault Read/Write | Pass（保持） |
| Behavior | Vault 枚举 / 剪贴板 | Recommendation → README 已说明 |
| Releases | artifact attestation | 可选，未做 |
| CSS lint | text-decoration / :has 抽样 | 抽样修复 |
| CSS lint | 大量 !important（BLP/表格） | 部分保留，非阻塞 |
| Dependencies | `lodash` 依赖提示 | 已记录，非本版功能改动范围 |

## Release 附件

- [x] `main.js`
- [x] `manifest.json`
- [x] `styles.css`

## 提交步骤（已自动化）

```bash
cd "$GITHUB_REPO_DIR"
npm run publish:oss
```

脚本顺序：同步源码 → `build:oss` + smoke → git push → `gh release create` → **自动 Check for new releases**

手动兜底： https://community.obsidian.md/account/plugins/feishu-doc-toolbar

## 禁止

- 不要提交 `data.json`、`file-versions/`、`.模板库/` 个人模板
- 单插件叙事：README/安装说明不再要求安装 companion
