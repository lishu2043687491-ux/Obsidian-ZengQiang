/** Obsidian 注入的白名单 require（Electron 下在 window.require，优先于 bundle 内裸 require） */

const OBSIDIAN_MODULE_ALIASES: Record<string, string> = {
  "@codemirror/text": "@codemirror/state",
};

export function getObsidianRequire(): NodeRequire | null {
  const candidates = [
    typeof window !== "undefined" ? (window as { require?: NodeRequire }).require : undefined,
    (globalThis as { require?: NodeRequire }).require,
    typeof require !== "undefined" ? require : undefined,
  ];
  for (const req of candidates) {
    if (typeof req === "function") return req;
  }
  return null;
}

export function getNodeRequire(): NodeRequire | null {
  return getObsidianRequire();
}

/** 内联 bundle 求值前，确保全局 require 指向 Obsidian 白名单 */
export function ensureObsidianRequireBinding(): NodeRequire | null {
  const obsReq = getObsidianRequire();
  if (!obsReq) return null;
  try {
    (globalThis as { require?: NodeRequire }).require = obsReq;
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    try {
      (window as { require?: NodeRequire }).require = obsReq;
    } catch {
      // ignore
    }
  }
  return obsReq;
}

export function resolveObsidianModuleId(id: string): string {
  return OBSIDIAN_MODULE_ALIASES[id] ?? id;
}

/** 与 build.mjs 注入的 FDTB_BLP_OBSIDIAN_REQUIRE 行为一致 */
export function createObsidianModuleResolver(): (id: string) => unknown {
  return (id: string) => {
    const resolved = resolveObsidianModuleId(id);
    const candidates = [
      typeof window !== "undefined" ? (window as { require?: NodeRequire }).require : undefined,
      (globalThis as { require?: NodeRequire }).require,
      typeof require !== "undefined" ? require : undefined,
    ];
    let lastError: unknown;
    for (const req of candidates) {
      if (typeof req !== "function") continue;
      try {
        return req(resolved);
      } catch (error) {
        lastError = error;
      }
    }
    const message = lastError instanceof Error ? lastError.message : String(lastError ?? "");
    throw new Error(`Cannot find module '${id}'${resolved !== id ? ` (resolved as '${resolved}')` : ""}${message ? `: ${message}` : ""}`);
  };
}

export function getNodeModule<T = unknown>(name: string): T | null {
  try {
    const req = getNodeRequire();
    if (!req) return null;
    return req(resolveObsidianModuleId(name)) as T;
  } catch {
    return null;
  }
}
