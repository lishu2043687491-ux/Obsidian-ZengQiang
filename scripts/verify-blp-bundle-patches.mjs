import fs from "node:fs";
import path from "node:path";

const bundlePath = path.join("src", "modules", "block-link-plus.bundle.js");
const required = [
  "blockSectionHasEmptyInterior",
  "shouldUseStandaloneBlockIdInsert",
  "blpAppendFolderDualLinkMenuItem",
  "复制文件夹超短双链",
];

const text = fs.readFileSync(bundlePath, "utf8");
const missing = required.filter((token) => !text.includes(token));
if (missing.length > 0) {
  console.error(
    "[feishu-doc-toolbar] block-link-plus.bundle.js 缺少宿主补丁标记:",
    missing.join(", "),
    "\n若刚执行 sync:block-link-plus，请重新应用段落锚点补丁后再 build。"
  );
  process.exit(1);
}
console.log("verify-blp-bundle-patches: OK");
