# 1.0.4

社区自动审查修复：

- `manifest.json`：`description` 以英文句号结尾（符合官方标点规则）
- Claudian 跨设备存档：不再读取 `os.hostname()`；首次启用时在插件 `data.json` 写入随机设备标识
- 内嵌 block-link-plus：语言偏好改用 `window.__FDTB_BLP_LANG__`，不再 stub `window.localStorage`

Release 附件：`main.js`、`manifest.json`、`styles.css`
