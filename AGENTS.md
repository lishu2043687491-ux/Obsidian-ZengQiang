# Obsidian增强体验 开发入口

这个目录是总插件 `feishu-doc-toolbar`，在 Obsidian 里显示为 `Obsidian增强体验`。

## 接手前先读

1. `/Users/lishu/Obsidian/近期工作/开发插件（Obsidian优化）/0️⃣系统信息库/1-插件是什么.md`
2. `/Users/lishu/Obsidian/近期工作/开发插件（Obsidian优化）/0️⃣系统信息库/2-怎么开发.md`
3. `/Users/lishu/Obsidian/近期工作/开发插件（Obsidian优化）/0️⃣系统信息库/3-不能做什么.md`

## 当前版本收口

- 当前运行版以 `manifest.json` 为准，`package.json` / `package-lock.json` 必须保持同版本。
- 每轮开发后至少跑 `npm run build` 和 `npm run test:smoke`。
- 涉及 UI、菜单、编辑器、表格、粘贴、模板时，还要按系统信息库补 GUI 或专项验收说明。

## 长期决策

- 总插件只做统一入口、设置和已确认稳定的自研能力内置；成熟第三方能力优先托管，不复制源码。
- `legacy enhanced` 表格能力已下线，只保留历史数据降级识别，不新增入口。
- 原生表格启用/美化不得覆盖已有单元格内容；列宽、行高、整体比例只在用户手动调节后写入。
- `.模板库/`、`data.json`、`file-versions/`、备份文件和用户笔记内容不是源码，不应进入开发提交。
- 自研/测试能力不能影响 T 工具栏、普通表格插入、模板库、原生表格长宽高、Dragger、已下线 enhanced 降级这些稳定入口。

## 开发边界

- 不在 `loadData` / `normalize*` 链路静默改写用户路径或模板库。
- 不在 `.obsidian/plugins/` 下放同 id 备份目录。
- 不恢复已经下线的入口，除非先更新系统信息库并明确说明原因。
- 不把开源发行构建产物覆盖日常 vault 运行版。
