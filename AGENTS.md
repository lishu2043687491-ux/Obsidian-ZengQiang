# ZengQiang Enhanced 开发约定

## 接手前阅读

请先阅读项目说明、开发说明与发布边界文档：`1-插件是什么.md`、`2-怎么开发.md`、`3-不能做什么.md`。公开仓库不得记录个人目录、vault 内容或本机配置。

## 交付边界

- `manifest.json`、`package.json` 与 `package-lock.json` 的版本必须一致。
- 每次改动至少运行构建和 smoke 测试。
- `data.json`、`file-versions/`、备份文件和用户笔记都不是源码，禁止提交。
- `legacy enhanced` 仅保留历史兼容，不恢复旧入口。
- 发布包只允许包含 `main.js`、`manifest.json` 与 `styles.css`。
