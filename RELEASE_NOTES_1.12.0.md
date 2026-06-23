# ZengQiang Enhanced 1.12.0

> 源：近期工作 vault · 构建：`OSS_RELEASE=1` · 2026-06-23

## 摘要

**重要更新。** 原生表格增强能力（配色、长宽高、行色块、模板库、OneNote 原生粘贴）已**完整内置**进 ZengQiang Enhanced，**无需再单独下载或启用 `markdown-table-enhancer`**。同时修复了一个已知重大缺陷：非原生的「增强表格」会在未授权时乱自动开启、突然套到普通表格上。本版还保留 6 月以来的稳定性改进（Claudian 跨设备续聊、粘贴触发文件本地化）。

## 重大变化

### 1. 原生表格增强完整内置（无需伴生插件）

- 表格能力打包进主插件模块 `src/modules/native-table-enhancer-embedded.ts`
- **单插件即用**：装好 ZengQiang Enhanced 即可使用原生表格配色、列宽行高、行段配色、模板库、OneNote 原生表格粘贴
- 不再要求安装/启用独立的 `markdown-table-enhancer`；设置页「原生表格增强」改为显示「已内置」
- 兼容旧数据：保留 `markdown-table-enhancer:*` 命令与旧表格数据路径的识别
- 防双启动：若 vault 中仍启用了外部同 id 的 `markdown-table-enhancer`，主插件会让外部插件接管，避免重复加载（日常建议关闭外部插件）

### 2. 修复重大 Bug —— 增强表格乱自动开启

- **现象（旧版）**：非原生的「增强表格」（实验性合并/单元格态）会在某些操作或 OneNote 粘贴联动后**未经授权自动开启**，突然把普通 Markdown 表格变成增强态，影响正常编辑与表格显示
- **修复**：
  - 增强表格能力在发布版中**恒定锁定**（`isEnhancedTableFeatureEnabled()`、`isTableEnhancerEntrancesVisible()` 始终返回 `false`）
  - 启动时强制 `showTableEnhancerEntrances = false`，不再从历史数据复活入口
  - OneNote 粘贴**仅产出原生 Markdown 表格**，不再联动 `experimentalFeatureGate` 开启增强态
  - 旧的增强表格降级为普通原生表格，不再拦截输入；插入旧增强模板时自动去掉 `mdtp` 标记
- **结果**：普通表格不会再被「自动增强」，表格行为回归 Obsidian 原生 + 可控的配色/长宽高增强

## 其他保留改进（自 6 月）

- **Claudian 跨设备续聊**：多设备归档合并、续聊映射、存档列表/详情渲染抗崩
- **文件自动本地化**：改为粘贴触发，避免后台扫库导致的卡顿
- **第三方插件白名单自动更新**（YOLO / Claudian）；自研插件禁止被覆盖
- **下线自研版本历史**，回归 Obsidian 官方能力

## 当前内嵌模块

| 模块 | 说明 |
|------|------|
| 内置原生表格增强 | 配色、长宽高、行段配色、模板库、OneNote 原生粘贴 |
| 文件自动本地化 | 粘贴触发附件本地化 |
| 全局宽页面 | 默认宽屏布局 |
| 右键复制成图 | 选区/表格/页面 PNG |
| Claudian 聊天记录同步 | 轻量 JSON 存档 + 跨设备 |
| 指向链接增强 | 内嵌 block-link-plus |
| OneNote 粘贴 | 原生 Markdown 表格 |

另含 **T 工具栏**、**模板库管理**。

## 合规

- manifest `description` 英文句号结尾
- 无 `os.hostname()`；Claudian 使用随机 `deviceId`
- 内嵌 block-link-plus 使用 `__FDTB_BLP_LANG__`，构建产物无 `localStorage`
- `OSS_RELEASE=1` 构建：增强表格实验入口恒锁、脱敏个人 vault 路径

## 安装

1. 从本 Release 下载 `main.js`、`manifest.json`、`styles.css` 放入 `.obsidian/plugins/feishu-doc-toolbar/`
2. 在 Obsidian 设置中启用 **ZengQiang Enhanced**
3. **无需** 再安装 `markdown-table-enhancer`；若此前装过，可在设置中禁用以免冲突

## 构建与验收

```bash
npm install
npm run build:oss
npm run test:smoke
```

Release 附件：`main.js` · `manifest.json` · `styles.css`
