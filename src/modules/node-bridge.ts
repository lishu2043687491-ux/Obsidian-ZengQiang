/** Obsidian 注入的白名单 require（优先 window.require，bundle 内 @codemirror/* 依赖它） */
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

/** Obsidian 桌面端注入的 Node require（browser 打包后裸 require 可能不可用） */
export function getNodeRequire(): NodeRequire | null {
  return getObsidianRequire();
}

/** 内联 bundle 求值前，确保全局 require 指向 Obsidian 白名单（Electron 内嵌 CJS 偶发丢失绑定） */
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

export function getNodeModule<T = unknown>(name: string): T | null {
  try {
    const req = getNodeRequire();
    if (!req) return null;
    return req(name) as T;
  } catch {
    return null;
  }
}
