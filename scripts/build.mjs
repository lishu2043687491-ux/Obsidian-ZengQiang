import * as esbuild from "esbuild";
import fs from "node:fs";

/**
 * block-link-plus.bundle.js 必须打进 main.js（require_block_link_plus_bundle），
 * 不能外置为兄弟文件：Obsidian 插件 require 仅白名单（obsidian、@codemirror/* 等），
 * 不支持 require('./block-link-plus.bundle.js')。
 * 内联后 bundle 内的 require('@codemirror/*') 走 Obsidian 注入的 require。
 */
await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "browser",
  format: "cjs",
  target: "es2020",
  outfile: "main.js",
  external: ["obsidian"],
  plugins: [
    {
      name: "obsidian-codemirror-external",
      setup(build) {
        build.onResolve({ filter: /^@codemirror\// }, () => ({ external: true }));
        build.onResolve({ filter: /^@lezer\// }, () => ({ external: true }));
        build.onResolve({ filter: /^(crypto|path|fs|node:.*)$/ }, () => ({ external: true }));
      },
    },
    {
      name: "blp-crypto-shim",
      setup(build) {
        build.onLoad({ filter: /block-link-plus\.bundle\.js$/ }, async (args) => {
          let contents = await fs.promises.readFile(args.path, "utf8");
          const shims = [];
          if (!contents.includes("FDTB_BLP_OBSIDIAN_REQUIRE")) {
            shims.push(`
function FDTB_BLP_OBSIDIAN_REQUIRE(id) {
  var lastError;
  try {
    if (typeof require !== "undefined") return require(id);
  } catch (e) {
    lastError = e;
  }
  try {
    var w = typeof window !== "undefined" ? window : undefined;
    if (w && typeof w.require === "function") return w.require(id);
  } catch (e2) {
    lastError = e2;
  }
  throw lastError || new Error("Cannot find module '" + id + "'");
}
`);
            contents = contents
              .replace(/require\("(@codemirror\/[^"]+)"\)/g, 'FDTB_BLP_OBSIDIAN_REQUIRE("$1")')
              .replace(/require\("(@lezer\/[^"]+)"\)/g, 'FDTB_BLP_OBSIDIAN_REQUIRE("$1")')
              .replace(/require\("obsidian"\)/g, 'FDTB_BLP_OBSIDIAN_REQUIRE("obsidian")');
          }
          if (!contents.includes("FDTB_BLP_CRYPTO")) {
            shims.push(`
function FDTB_BLP_CRYPTO() {
  try {
    var w = typeof window !== "undefined" ? window : undefined;
    if (w && typeof w.require === "function") return w.require("crypto");
  } catch (e) {}
  try {
    if (typeof require !== "undefined") return require("crypto");
  } catch (e) {}
  throw new Error("crypto unavailable");
}
`);
            contents = contents.replace(
              /__toESM\(require\("crypto"\)\)/g,
              "__toESM(FDTB_BLP_CRYPTO())"
            );
          }
          if (shims.length > 0) {
            contents = shims.join("\n") + contents;
          }
          contents = contents.replace(
            /window\.localStorage\.getItem\("language"\)/g,
            '(window.localStorage && window.localStorage.getItem("language"))'
          );
          return { contents, loader: "js" };
        });
      },
    },
  ],
});

console.log("esbuild: main.js (block-link-plus inlined)");

await import("./verify-blp-bundle-patches.mjs");
