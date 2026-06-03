import * as esbuild from "esbuild";
import fs from "node:fs";

const FDTB_REQUIRE_SHIM = `
function FDTB_BLP_OBSIDIAN_REQUIRE(id) {
  var aliases = { "@codemirror/text": "@codemirror/state" };
  var resolved = aliases[id] || id;
  var lastError;
  var candidates = [];
  try {
    var w = typeof window !== "undefined" ? window : undefined;
    if (w && typeof w.require === "function") candidates.push(w.require);
  } catch (e) {
    lastError = e;
  }
  try {
    if (typeof globalThis !== "undefined" && typeof globalThis.require === "function") {
      candidates.push(globalThis.require);
    }
  } catch (e2) {
    lastError = e2;
  }
  try {
    if (typeof require !== "undefined") candidates.push(require);
  } catch (e3) {
    lastError = e3;
  }
  for (var i = 0; i < candidates.length; i++) {
    try {
      return candidates[i](resolved);
    } catch (err) {
      lastError = err;
    }
  }
  var hint = lastError && lastError.message ? ": " + lastError.message : "";
  throw new Error("Cannot find module '" + id + "'" + hint);
}
function FDTB_BLP_CRYPTO() {
  var candidates = [];
  try {
    var w = typeof window !== "undefined" ? window : undefined;
    if (w && typeof w.require === "function") candidates.push(w.require);
  } catch (e) {}
  try {
    if (typeof globalThis !== "undefined" && typeof globalThis.require === "function") {
      candidates.push(globalThis.require);
    }
  } catch (e) {}
  try {
    if (typeof require !== "undefined") candidates.push(require);
  } catch (e) {}
  for (var i = 0; i < candidates.length; i++) {
    try {
      return candidates[i]("crypto");
    } catch (err) {}
  }
  throw new Error("crypto unavailable");
}
`;

/**
 * block-link-plus.bundle.js 必须打进 main.js（require_block_link_plus_bundle），
 * 不能外置为兄弟文件：Obsidian 插件 require 仅白名单（obsidian、@codemirror/* 等）。
 * 内联后 bundle 内 FDTB_BLP_OBSIDIAN_REQUIRE 必须优先 window.require（Obsidian Electron）。
 */
const ossRelease = process.env.OSS_RELEASE === "1";

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "browser",
  format: "cjs",
  target: "es2020",
  outfile: "main.js",
  external: ["obsidian"],
  define: {
    __OSS_RELEASE__: ossRelease ? "true" : "false",
  },
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
          if (!contents.includes("FDTB_BLP_OBSIDIAN_REQUIRE")) {
            contents = contents
              .replace(/require\("(@codemirror\/[^"]+)"\)/g, 'FDTB_BLP_OBSIDIAN_REQUIRE("$1")')
              .replace(/require\("(@lezer\/[^"]+)"\)/g, 'FDTB_BLP_OBSIDIAN_REQUIRE("$1")')
              .replace(/require\("obsidian"\)/g, 'FDTB_BLP_OBSIDIAN_REQUIRE("obsidian")');
            contents = FDTB_REQUIRE_SHIM + contents;
          }
          if (!contents.includes("FDTB_BLP_CRYPTO")) {
            contents = contents.replace(
              /__toESM\(require\("crypto"\)\)/g,
              "__toESM(FDTB_BLP_CRYPTO())"
            );
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

console.log(`esbuild: main.js (block-link-plus inlined, OSS_RELEASE=${ossRelease ? "1" : "0"})`);

await import("./verify-blp-bundle-patches.mjs");
