# Obsidian 社区插件提交清单（目标版本 1.16.6）

仓库：https://github.com/lishu2043687491-ux/Obsidian-ZengQiang

## manifest

| 字段 | 值 |
|------|-----|
| `id` | `feishu-doc-toolbar` |
| `name` | `ZengQiang Enhanced` |
| `version` | `1.16.6`（与 Release tag 一致） |

> 审核边界：`manifest.json` 的插件名称保持英文 `ZengQiang Enhanced`；“Obsidian 增强办公体验”只作为中文定位，出现在 README、manifest description 和插件详情介绍中，不作为上传名称。

## 本版重点（1.16.6）

- 中文定位明确为“Obsidian 增强办公体验工具”，面向飞书、企微等办公工具迁移用户。
- README 详细补充 T 工具栏、模板库、表格三模式、OneNote 粘贴、文件本地化、宽页面、复制成图和短链接。
- README 详细补充 Claudian 跨设备工作流、视频时间轴预览和可选第三方工具托管。
- 明确隐私边界：公开包不含 vault 内容、个人模板、配置、缓存、备份、本地路径或密钥。
- 保留 1.16.5 的表格交互：点击其他区域自动收起，首行/当前行高亮，斑马纹可选。
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
cd "$GITHUB_REPO_DIR"
npm run publish:oss
```

脚本顺序：同步源码 → `build:oss` + smoke → git push → `gh release create` → **自动 Check for new releases**

手动兜底： https://community.obsidian.md/account/plugins/feishu-doc-toolbar

## 禁止

- 不要提交 `data.json`、`file-versions/`、`.模板库/` 个人模板
- 单插件叙事：README/安装说明不再要求安装 companion
