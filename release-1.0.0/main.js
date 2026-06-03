var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => FeishuDocToolbarPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian5 = require("obsidian");

// node_modules/html-to-image/es/util.js
function resolveUrl(url, baseUrl) {
  if (url.match(/^[a-z]+:\/\//i)) {
    return url;
  }
  if (url.match(/^\/\//)) {
    return window.location.protocol + url;
  }
  if (url.match(/^[a-z]+:/i)) {
    return url;
  }
  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement("base");
  const a = doc.createElement("a");
  doc.head.appendChild(base);
  doc.body.appendChild(a);
  if (baseUrl) {
    base.href = baseUrl;
  }
  a.href = url;
  return a.href;
}
var uuid = /* @__PURE__ */ (() => {
  let counter = 0;
  const random = () => (
    // eslint-disable-next-line no-bitwise
    `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
  );
  return () => {
    counter += 1;
    return `u${random()}${counter}`;
  };
})();
function toArray(arrayLike) {
  const arr = [];
  for (let i = 0, l = arrayLike.length; i < l; i++) {
    arr.push(arrayLike[i]);
  }
  return arr;
}
var styleProps = null;
function getStyleProperties(options = {}) {
  if (styleProps) {
    return styleProps;
  }
  if (options.includeStyleProperties) {
    styleProps = options.includeStyleProperties;
    return styleProps;
  }
  styleProps = toArray(window.getComputedStyle(document.documentElement));
  return styleProps;
}
function px(node, styleProperty) {
  const win = node.ownerDocument.defaultView || window;
  const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
  return val ? parseFloat(val.replace("px", "")) : 0;
}
function getNodeWidth(node) {
  const leftBorder = px(node, "border-left-width");
  const rightBorder = px(node, "border-right-width");
  return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
  const topBorder = px(node, "border-top-width");
  const bottomBorder = px(node, "border-bottom-width");
  return node.clientHeight + topBorder + bottomBorder;
}
function getImageSize(targetNode, options = {}) {
  const width = options.width || getNodeWidth(targetNode);
  const height = options.height || getNodeHeight(targetNode);
  return { width, height };
}
function getPixelRatio() {
  let ratio;
  let FINAL_PROCESS;
  try {
    FINAL_PROCESS = process;
  } catch (e) {
  }
  const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
  if (val) {
    ratio = parseInt(val, 10);
    if (Number.isNaN(ratio)) {
      ratio = 1;
    }
  }
  return ratio || window.devicePixelRatio || 1;
}
var canvasDimensionLimit = 16384;
function checkCanvasDimensions(canvas) {
  if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) {
    if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) {
      if (canvas.width > canvas.height) {
        canvas.height *= canvasDimensionLimit / canvas.width;
        canvas.width = canvasDimensionLimit;
      } else {
        canvas.width *= canvasDimensionLimit / canvas.height;
        canvas.height = canvasDimensionLimit;
      }
    } else if (canvas.width > canvasDimensionLimit) {
      canvas.height *= canvasDimensionLimit / canvas.width;
      canvas.width = canvasDimensionLimit;
    } else {
      canvas.width *= canvasDimensionLimit / canvas.height;
      canvas.height = canvasDimensionLimit;
    }
  }
}
function canvasToBlob(canvas, options = {}) {
  if (canvas.toBlob) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, options.type ? options.type : "image/png", options.quality ? options.quality : 1);
    });
  }
  return new Promise((resolve) => {
    const binaryString = window.atob(canvas.toDataURL(options.type ? options.type : void 0, options.quality ? options.quality : void 0).split(",")[1]);
    const len = binaryString.length;
    const binaryArray = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      binaryArray[i] = binaryString.charCodeAt(i);
    }
    resolve(new Blob([binaryArray], {
      type: options.type ? options.type : "image/png"
    }));
  });
}
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      img.decode().then(() => {
        requestAnimationFrame(() => resolve(img));
      });
    };
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
  });
}
async function svgToDataURL(svg) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
}
async function nodeToDataURL(node, width, height) {
  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  const foreignObject = document.createElementNS(xmlns, "foreignObject");
  svg.setAttribute("width", `${width}`);
  svg.setAttribute("height", `${height}`);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("externalResourcesRequired", "true");
  svg.appendChild(foreignObject);
  foreignObject.appendChild(node);
  return svgToDataURL(svg);
}
var isInstanceOfElement = (node, instance) => {
  if (node instanceof instance)
    return true;
  const nodePrototype = Object.getPrototypeOf(node);
  if (nodePrototype === null)
    return false;
  return nodePrototype.constructor.name === instance.name || isInstanceOfElement(nodePrototype, instance);
};

// node_modules/html-to-image/es/clone-pseudos.js
function formatCSSText(style) {
  const content = style.getPropertyValue("content");
  return `${style.cssText} content: '${content.replace(/'|"/g, "")}';`;
}
function formatCSSProperties(style, options) {
  return getStyleProperties(options).map((name) => {
    const value = style.getPropertyValue(name);
    const priority = style.getPropertyPriority(name);
    return `${name}: ${value}${priority ? " !important" : ""};`;
  }).join(" ");
}
function getPseudoElementStyle(className, pseudo, style, options) {
  const selector = `.${className}:${pseudo}`;
  const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style, options);
  return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo, options) {
  const style = window.getComputedStyle(nativeNode, pseudo);
  const content = style.getPropertyValue("content");
  if (content === "" || content === "none") {
    return;
  }
  const className = uuid();
  try {
    clonedNode.className = `${clonedNode.className} ${className}`;
  } catch (err) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.appendChild(getPseudoElementStyle(className, pseudo, style, options));
  clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode, options) {
  clonePseudoElement(nativeNode, clonedNode, ":before", options);
  clonePseudoElement(nativeNode, clonedNode, ":after", options);
}

// node_modules/html-to-image/es/mimes.js
var WOFF = "application/font-woff";
var JPEG = "image/jpeg";
var mimes = {
  woff: WOFF,
  woff2: WOFF,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: JPEG,
  jpeg: JPEG,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function getExtension(url) {
  const match = /\.([^./]*?)$/g.exec(url);
  return match ? match[1] : "";
}
function getMimeType(url) {
  const extension = getExtension(url).toLowerCase();
  return mimes[extension] || "";
}

// node_modules/html-to-image/es/dataurl.js
function getContentFromDataUrl(dataURL) {
  return dataURL.split(/,/)[1];
}
function isDataUrl(url) {
  return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
  return `data:${mimeType};base64,${content}`;
}
async function fetchAsDataURL(url, init, process2) {
  const res = await fetch(url, init);
  if (res.status === 404) {
    throw new Error(`Resource "${res.url}" not found`);
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      try {
        resolve(process2({ res, result: reader.result }));
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(blob);
  });
}
var cache = {};
function getCacheKey(url, contentType, includeQueryParams) {
  let key = url.replace(/\?.*/, "");
  if (includeQueryParams) {
    key = url;
  }
  if (/ttf|otf|eot|woff2?/i.test(key)) {
    key = key.replace(/.*\//, "");
  }
  return contentType ? `[${contentType}]${key}` : key;
}
async function resourceToDataURL(resourceUrl, contentType, options) {
  const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
  if (cache[cacheKey] != null) {
    return cache[cacheKey];
  }
  if (options.cacheBust) {
    resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
  }
  let dataURL;
  try {
    const content = await fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
      if (!contentType) {
        contentType = res.headers.get("Content-Type") || "";
      }
      return getContentFromDataUrl(result);
    });
    dataURL = makeDataUrl(content, contentType);
  } catch (error) {
    dataURL = options.imagePlaceholder || "";
    let msg = `Failed to fetch resource: ${resourceUrl}`;
    if (error) {
      msg = typeof error === "string" ? error : error.message;
    }
    if (msg) {
      console.warn(msg);
    }
  }
  cache[cacheKey] = dataURL;
  return dataURL;
}

// node_modules/html-to-image/es/clone-node.js
async function cloneCanvasElement(canvas) {
  const dataURL = canvas.toDataURL();
  if (dataURL === "data:,") {
    return canvas.cloneNode(false);
  }
  return createImage(dataURL);
}
async function cloneVideoElement(video, options) {
  if (video.currentSrc) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL2 = canvas.toDataURL();
    return createImage(dataURL2);
  }
  const poster = video.poster;
  const contentType = getMimeType(poster);
  const dataURL = await resourceToDataURL(poster, contentType, options);
  return createImage(dataURL);
}
async function cloneIFrameElement(iframe, options) {
  var _a;
  try {
    if ((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body) {
      return await cloneNode(iframe.contentDocument.body, options, true);
    }
  } catch (_b) {
  }
  return iframe.cloneNode(false);
}
async function cloneSingleNode(node, options) {
  if (isInstanceOfElement(node, HTMLCanvasElement)) {
    return cloneCanvasElement(node);
  }
  if (isInstanceOfElement(node, HTMLVideoElement)) {
    return cloneVideoElement(node, options);
  }
  if (isInstanceOfElement(node, HTMLIFrameElement)) {
    return cloneIFrameElement(node, options);
  }
  return node.cloneNode(isSVGElement(node));
}
var isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SLOT";
var isSVGElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SVG";
async function cloneChildren(nativeNode, clonedNode, options) {
  var _a, _b;
  if (isSVGElement(clonedNode)) {
    return clonedNode;
  }
  let children = [];
  if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
    children = toArray(nativeNode.assignedNodes());
  } else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
    children = toArray(nativeNode.contentDocument.body.childNodes);
  } else {
    children = toArray(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
  }
  if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) {
    return clonedNode;
  }
  await children.reduce((deferred, child) => deferred.then(() => cloneNode(child, options)).then((clonedChild) => {
    if (clonedChild) {
      clonedNode.appendChild(clonedChild);
    }
  }), Promise.resolve());
  return clonedNode;
}
function cloneCSSStyle(nativeNode, clonedNode, options) {
  const targetStyle = clonedNode.style;
  if (!targetStyle) {
    return;
  }
  const sourceStyle = window.getComputedStyle(nativeNode);
  if (sourceStyle.cssText) {
    targetStyle.cssText = sourceStyle.cssText;
    targetStyle.transformOrigin = sourceStyle.transformOrigin;
  } else {
    getStyleProperties(options).forEach((name) => {
      let value = sourceStyle.getPropertyValue(name);
      if (name === "font-size" && value.endsWith("px")) {
        const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
        value = `${reducedFont}px`;
      }
      if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && name === "display" && value === "inline") {
        value = "block";
      }
      if (name === "d" && clonedNode.getAttribute("d")) {
        value = `path(${clonedNode.getAttribute("d")})`;
      }
      targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
    });
  }
}
function cloneInputValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
    clonedNode.innerHTML = nativeNode.value;
  }
  if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
    clonedNode.setAttribute("value", nativeNode.value);
  }
}
function cloneSelectValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
    const clonedSelect = clonedNode;
    const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute("value"));
    if (selectedOption) {
      selectedOption.setAttribute("selected", "");
    }
  }
}
function decorate(nativeNode, clonedNode, options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    cloneCSSStyle(nativeNode, clonedNode, options);
    clonePseudoElements(nativeNode, clonedNode, options);
    cloneInputValue(nativeNode, clonedNode);
    cloneSelectValue(nativeNode, clonedNode);
  }
  return clonedNode;
}
async function ensureSVGSymbols(clone, options) {
  const uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
  if (uses.length === 0) {
    return clone;
  }
  const processedDefs = {};
  for (let i = 0; i < uses.length; i++) {
    const use = uses[i];
    const id = use.getAttribute("xlink:href");
    if (id) {
      const exist = clone.querySelector(id);
      const definition = document.querySelector(id);
      if (!exist && definition && !processedDefs[id]) {
        processedDefs[id] = await cloneNode(definition, options, true);
      }
    }
  }
  const nodes = Object.values(processedDefs);
  if (nodes.length) {
    const ns = "http://www.w3.org/1999/xhtml";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    svg.style.display = "none";
    const defs = document.createElementNS(ns, "defs");
    svg.appendChild(defs);
    for (let i = 0; i < nodes.length; i++) {
      defs.appendChild(nodes[i]);
    }
    clone.appendChild(svg);
  }
  return clone;
}
async function cloneNode(node, options, isRoot) {
  if (!isRoot && options.filter && !options.filter(node)) {
    return null;
  }
  return Promise.resolve(node).then((clonedNode) => cloneSingleNode(clonedNode, options)).then((clonedNode) => cloneChildren(node, clonedNode, options)).then((clonedNode) => decorate(node, clonedNode, options)).then((clonedNode) => ensureSVGSymbols(clonedNode, options));
}

// node_modules/html-to-image/es/embed-resources.js
var URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
var URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
var FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
  const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
}
function parseURLs(cssText) {
  const urls = [];
  cssText.replace(URL_REGEX, (raw, quotation, url) => {
    urls.push(url);
    return raw;
  });
  return urls.filter((url) => !isDataUrl(url));
}
async function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
  try {
    const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
    const contentType = getMimeType(resourceURL);
    let dataURL;
    if (getContentFromUrl) {
      const content = await getContentFromUrl(resolvedURL);
      dataURL = makeDataUrl(content, contentType);
    } else {
      dataURL = await resourceToDataURL(resolvedURL, contentType, options);
    }
    return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
  } catch (error) {
  }
  return cssText;
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
  return !preferredFontFormat ? str : str.replace(FONT_SRC_REGEX, (match) => {
    while (true) {
      const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
      if (!format) {
        return "";
      }
      if (format === preferredFontFormat) {
        return `src: ${src};`;
      }
    }
  });
}
function shouldEmbed(url) {
  return url.search(URL_REGEX) !== -1;
}
async function embedResources(cssText, baseUrl, options) {
  if (!shouldEmbed(cssText)) {
    return cssText;
  }
  const filteredCSSText = filterPreferredFontFormat(cssText, options);
  const urls = parseURLs(filteredCSSText);
  return urls.reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
}

// node_modules/html-to-image/es/embed-images.js
async function embedProp(propName, node, options) {
  var _a;
  const propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
  if (propValue) {
    const cssString = await embedResources(propValue, null, options);
    node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
    return true;
  }
  return false;
}
async function embedBackground(clonedNode, options) {
  ;
  await embedProp("background", clonedNode, options) || await embedProp("background-image", clonedNode, options);
  await embedProp("mask", clonedNode, options) || await embedProp("-webkit-mask", clonedNode, options) || await embedProp("mask-image", clonedNode, options) || await embedProp("-webkit-mask-image", clonedNode, options);
}
async function embedImageNode(clonedNode, options) {
  const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
  if (!(isImageElement && !isDataUrl(clonedNode.src)) && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))) {
    return;
  }
  const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
  const dataURL = await resourceToDataURL(url, getMimeType(url), options);
  await new Promise((resolve, reject) => {
    clonedNode.onload = resolve;
    clonedNode.onerror = options.onImageErrorHandler ? (...attributes) => {
      try {
        resolve(options.onImageErrorHandler(...attributes));
      } catch (error) {
        reject(error);
      }
    } : reject;
    const image = clonedNode;
    if (image.decode) {
      image.decode = resolve;
    }
    if (image.loading === "lazy") {
      image.loading = "eager";
    }
    if (isImageElement) {
      clonedNode.srcset = "";
      clonedNode.src = dataURL;
    } else {
      clonedNode.href.baseVal = dataURL;
    }
  });
}
async function embedChildren(clonedNode, options) {
  const children = toArray(clonedNode.childNodes);
  const deferreds = children.map((child) => embedImages(child, options));
  await Promise.all(deferreds).then(() => clonedNode);
}
async function embedImages(clonedNode, options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    await embedBackground(clonedNode, options);
    await embedImageNode(clonedNode, options);
    await embedChildren(clonedNode, options);
  }
}

// node_modules/html-to-image/es/apply-style.js
function applyStyle(node, options) {
  const { style } = node;
  if (options.backgroundColor) {
    style.backgroundColor = options.backgroundColor;
  }
  if (options.width) {
    style.width = `${options.width}px`;
  }
  if (options.height) {
    style.height = `${options.height}px`;
  }
  const manual = options.style;
  if (manual != null) {
    Object.keys(manual).forEach((key) => {
      style[key] = manual[key];
    });
  }
  return node;
}

// node_modules/html-to-image/es/embed-webfonts.js
var cssFetchCache = {};
async function fetchCSS(url) {
  let cache2 = cssFetchCache[url];
  if (cache2 != null) {
    return cache2;
  }
  const res = await fetch(url);
  const cssText = await res.text();
  cache2 = { url, cssText };
  cssFetchCache[url] = cache2;
  return cache2;
}
async function embedFonts(data2, options) {
  let cssText = data2.cssText;
  const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
  const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
  const loadFonts = fontLocs.map(async (loc) => {
    let url = loc.replace(regexUrl, "$1");
    if (!url.startsWith("https://")) {
      url = new URL(url, data2.url).href;
    }
    return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
      cssText = cssText.replace(loc, `url(${result})`);
      return [loc, result];
    });
  });
  return Promise.all(loadFonts).then(() => cssText);
}
function parseCSS(source) {
  if (source == null) {
    return [];
  }
  const result = [];
  const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
  let cssText = source.replace(commentsRegex, "");
  const keyframesRegex = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  while (true) {
    const matches = keyframesRegex.exec(cssText);
    if (matches === null) {
      break;
    }
    result.push(matches[0]);
  }
  cssText = cssText.replace(keyframesRegex, "");
  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
  const combinedCSSRegex = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})";
  const unifiedRegex = new RegExp(combinedCSSRegex, "gi");
  while (true) {
    let matches = importRegex.exec(cssText);
    if (matches === null) {
      matches = unifiedRegex.exec(cssText);
      if (matches === null) {
        break;
      } else {
        importRegex.lastIndex = unifiedRegex.lastIndex;
      }
    } else {
      unifiedRegex.lastIndex = importRegex.lastIndex;
    }
    result.push(matches[0]);
  }
  return result;
}
async function getCSSRules(styleSheets, options) {
  const ret = [];
  const deferreds = [];
  styleSheets.forEach((sheet) => {
    if ("cssRules" in sheet) {
      try {
        toArray(sheet.cssRules || []).forEach((item, index) => {
          if (item.type === CSSRule.IMPORT_RULE) {
            let importIndex = index + 1;
            const url = item.href;
            const deferred = fetchCSS(url).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
              try {
                sheet.insertRule(rule, rule.startsWith("@import") ? importIndex += 1 : sheet.cssRules.length);
              } catch (error) {
                console.error("Error inserting rule from remote css", {
                  rule,
                  error
                });
              }
            })).catch((e) => {
              console.error("Error loading remote css", e.toString());
            });
            deferreds.push(deferred);
          }
        });
      } catch (e) {
        const inline = styleSheets.find((a) => a.href == null) || document.styleSheets[0];
        if (sheet.href != null) {
          deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
            inline.insertRule(rule, inline.cssRules.length);
          })).catch((err) => {
            console.error("Error loading remote stylesheet", err);
          }));
        }
        console.error("Error inlining remote css file", e);
      }
    }
  });
  return Promise.all(deferreds).then(() => {
    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          toArray(sheet.cssRules || []).forEach((item) => {
            ret.push(item);
          });
        } catch (e) {
          console.error(`Error while reading CSS rules from ${sheet.href}`, e);
        }
      }
    });
    return ret;
  });
}
function getWebFontRules(cssRules) {
  return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).filter((rule) => shouldEmbed(rule.style.getPropertyValue("src")));
}
async function parseWebFontRules(node, options) {
  if (node.ownerDocument == null) {
    throw new Error("Provided element is not within a Document");
  }
  const styleSheets = toArray(node.ownerDocument.styleSheets);
  const cssRules = await getCSSRules(styleSheets, options);
  return getWebFontRules(cssRules);
}
function normalizeFontFamily(font) {
  return font.trim().replace(/["']/g, "");
}
function getUsedFonts(node) {
  const fonts = /* @__PURE__ */ new Set();
  function traverse(node2) {
    const fontFamily = node2.style.fontFamily || getComputedStyle(node2).fontFamily;
    fontFamily.split(",").forEach((font) => {
      fonts.add(normalizeFontFamily(font));
    });
    Array.from(node2.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        traverse(child);
      }
    });
  }
  traverse(node);
  return fonts;
}
async function getWebFontCSS(node, options) {
  const rules = await parseWebFontRules(node, options);
  const usedFonts = getUsedFonts(node);
  const cssTexts = await Promise.all(rules.filter((rule) => usedFonts.has(normalizeFontFamily(rule.style.fontFamily))).map((rule) => {
    const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
    return embedResources(rule.cssText, baseUrl, options);
  }));
  return cssTexts.join("\n");
}
async function embedWebFonts(clonedNode, options) {
  const cssText = options.fontEmbedCSS != null ? options.fontEmbedCSS : options.skipFonts ? null : await getWebFontCSS(clonedNode, options);
  if (cssText) {
    const styleNode = document.createElement("style");
    const sytleContent = document.createTextNode(cssText);
    styleNode.appendChild(sytleContent);
    if (clonedNode.firstChild) {
      clonedNode.insertBefore(styleNode, clonedNode.firstChild);
    } else {
      clonedNode.appendChild(styleNode);
    }
  }
}

// node_modules/html-to-image/es/index.js
async function toSvg(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const clonedNode = await cloneNode(node, options, true);
  await embedWebFonts(clonedNode, options);
  await embedImages(clonedNode, options);
  applyStyle(clonedNode, options);
  const datauri = await nodeToDataURL(clonedNode, width, height);
  return datauri;
}
async function toCanvas(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const svg = await toSvg(node, options);
  const img = await createImage(svg);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const ratio = options.pixelRatio || getPixelRatio();
  const canvasWidth = options.canvasWidth || width;
  const canvasHeight = options.canvasHeight || height;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  if (!options.skipAutoScale) {
    checkCanvasDimensions(canvas);
  }
  canvas.style.width = `${canvasWidth}`;
  canvas.style.height = `${canvasHeight}`;
  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
async function toBlob(node, options = {}) {
  const canvas = await toCanvas(node, options);
  const blob = await canvasToBlob(canvas);
  return blob;
}

// src/modules/sub-plugin-host.ts
var SubPluginHost = class {
  constructor(backend, moduleId) {
    __publicField(this, "app");
    __publicField(this, "manifest", { id: "feishu-doc-toolbar-submodule", version: "1.0.0" });
    /** 真正的总插件实例，可作为 Component 传给 MarkdownRenderer 等 Obsidian API */
    __publicField(this, "component");
    __publicField(this, "backend");
    __publicField(this, "moduleId");
    __publicField(this, "disposers", []);
    __publicField(this, "destroyed", false);
    this.backend = backend;
    this.moduleId = moduleId;
    this.app = backend.app;
    this.component = backend.plugin;
  }
  // --- Plugin-like API ---
  addCommand(command) {
    const id = `submodule-${this.moduleId}-${command.id ?? ""}`;
    const wrapped = { ...command, id };
    this.backend.plugin.addCommand(wrapped);
    return wrapped;
  }
  addStatusBarItem() {
    const el = this.backend.plugin.addStatusBarItem();
    this.disposers.push(() => el.remove());
    return el;
  }
  addRibbonIcon(icon, title, callback) {
    const el = this.backend.plugin.addRibbonIcon(icon, title, callback);
    this.disposers.push(() => el.remove());
    return el;
  }
  /** 模块自己的 setting tab；总插件会忽略，由统一设置页接管。 */
  addSettingTab(_tab) {
  }
  registerEvent(eventRef) {
    this.backend.plugin.registerEvent(eventRef);
    this.disposers.push(() => {
      try {
        this.app.workspace.offref(eventRef);
      } catch {
        try {
          this.app.vault.offref?.(eventRef);
        } catch {
        }
      }
    });
  }
  registerDomEvent(el, type, callback, options) {
    el.addEventListener(type, callback, options);
    this.disposers.push(() => el.removeEventListener(type, callback, options));
  }
  registerInterval(handle) {
    this.backend.plugin.registerInterval(handle);
    this.disposers.push(() => window.clearInterval(handle));
    return handle;
  }
  register(callback) {
    this.disposers.push(() => {
      try {
        callback();
      } catch {
      }
    });
  }
  registerMarkdownPostProcessor(processor, sortOrder) {
    const ret = this.backend.plugin.registerMarkdownPostProcessor(processor, sortOrder);
    return ret;
  }
  registerMarkdownCodeBlockProcessor(language, handler, sortOrder) {
    return this.backend.plugin.registerMarkdownCodeBlockProcessor(language, handler, sortOrder);
  }
  // --- data IO routed to host's dataStore[subModuleData][moduleId] ---
  async loadData() {
    return this.backend.loadModuleData(this.moduleId);
  }
  async saveData(data2) {
    await this.backend.saveModuleData(this.moduleId, data2);
  }
  // --- lifecycle ---
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    while (this.disposers.length > 0) {
      const disposer = this.disposers.pop();
      try {
        disposer?.();
      } catch {
      }
    }
  }
};

// src/modules/file-auto-localizer.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  attachmentFolder: "_attachments",
  defaultFolders: [],
  rewriteMode: "markdown",
  overwriteExisting: false,
  autoProcessActiveNote: true,
  autoProcessAllMarkdown: true,
  processWeChatImages: true,
  processCuboxImages: true,
  processOneNoteImages: true,
  processOneNoteLinks: true,
  oneNoteBasePath: "",
  processOtherRemoteImages: true,
  processScatteredLocalImages: true,
  removeTransparentPlaceholders: true
};
var HTTP_RE = /^https?:\/\//i;
var DATA_IMAGE_RE = /^data:image\//i;
var LOCAL_IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/i;
var SCATTERED_ATTACHMENT_RE = /(?:^|\/)(?:assets\/attachments|\.attachments)(?:\/|$)/i;
var FileAutoLocalizerRunner = class {
  constructor(host) {
    this.host = host;
    __publicField(this, "settings", { ...DEFAULT_SETTINGS });
    __publicField(this, "processingPaths", /* @__PURE__ */ new Set());
    __publicField(this, "autoTimers", /* @__PURE__ */ new Map());
  }
  async start() {
    const saved = await this.host.loadData();
    this.settings = normalizeSettings(Object.assign({}, DEFAULT_SETTINGS, saved ?? {}));
    this.host.addCommand({
      id: "localize-current-note-images",
      name: "\u672C\u5730\u5316\u5F53\u524D\u7B14\u8BB0\u56FE\u7247\u548C OneNote \u94FE\u63A5",
      checkCallback: (checking) => {
        const file = this.host.app.workspace.getActiveFile();
        const canRun = file instanceof import_obsidian.TFile && file.extension === "md";
        if (checking) return canRun;
        void this.localizeCurrentFile();
        return true;
      }
    });
    this.host.addCommand({
      id: "localize-folder-images",
      name: "\u672C\u5730\u5316\u6307\u5B9A\u6587\u4EF6\u5939\u56FE\u7247\u548C OneNote \u94FE\u63A5",
      callback: () => {
        new FolderPickerModal(this.host.app, this.settings.defaultFolders, async (folderPaths) => {
          this.settings.defaultFolders = folderPaths.map(normalizeVaultPath).filter(Boolean);
          await this.saveSettings();
          await this.localizeFolders(this.settings.defaultFolders);
        }).open();
      }
    });
    this.host.registerEvent(this.host.app.workspace.on("file-open", (file) => {
      this.queueAutoProcess(file);
    }));
    this.host.registerEvent(this.host.app.vault.on("modify", (file) => {
      this.queueAutoProcess(file);
    }));
    this.host.registerEvent(this.host.app.vault.on("create", (file) => {
      this.queueAutoProcess(file);
    }));
    this.host.register(() => {
      for (const timer of this.autoTimers.values()) {
        window.clearTimeout(timer);
      }
      this.autoTimers.clear();
    });
  }
  async saveSettings() {
    this.settings = normalizeSettings(this.settings);
    await this.host.saveData(this.settings);
  }
  async localizeCurrentFile() {
    const file = this.host.app.workspace.getActiveFile();
    if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") {
      new import_obsidian.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u7BC7 Markdown \u7B14\u8BB0");
      return;
    }
    const result = await this.localizeFile(file);
    new import_obsidian.Notice(`\u6587\u4EF6\u81EA\u52A8\u672C\u5730\u5316\u5B8C\u6210\uFF1A${result.downloaded} \u5F20\u4E0B\u8F7D\uFF0C${result.reused} \u5F20\u590D\u7528\uFF0C${result.links || 0} \u4E2A\u94FE\u63A5\u8F6C\u6362\uFF0C${result.removed || 0} \u4E2A\u5360\u4F4D\u79FB\u9664\uFF0C${result.failed} \u5F20\u5931\u8D25`);
  }
  async localizeFolders(folderPaths) {
    const normalizedFolders = [...new Set((folderPaths || []).map(normalizeVaultPath).filter(Boolean))];
    const files = this.host.app.vault.getMarkdownFiles().filter((file) => normalizedFolders.length === 0 || normalizedFolders.some((folder) => isInsideFolder(file.path, folder)));
    if (files.length === 0) {
      new import_obsidian.Notice(normalizedFolders.length > 0 ? "\u6240\u9009\u6587\u4EF6\u5939\u6CA1\u6709 Markdown \u6587\u4EF6" : "\u5F53\u524D vault \u6CA1\u6709 Markdown \u6587\u4EF6");
      return;
    }
    let downloaded = 0;
    let reused = 0;
    let failed = 0;
    let removed = 0;
    let links = 0;
    let changed = 0;
    new import_obsidian.Notice(`\u5F00\u59CB\u5904\u7406 ${files.length} \u7BC7 Markdown`);
    for (const file of files) {
      const result = await this.localizeFile(file);
      downloaded += result.downloaded;
      reused += result.reused;
      failed += result.failed;
      removed += result.removed || 0;
      links += result.links || 0;
      if (result.changed) changed += 1;
    }
    new import_obsidian.Notice(`\u6279\u91CF\u5B8C\u6210\uFF1A${changed}/${files.length} \u7BC7\u6709\u66F4\u65B0\uFF0C${downloaded} \u5F20\u4E0B\u8F7D\uFF0C${reused} \u5F20\u590D\u7528\uFF0C${links} \u4E2A\u94FE\u63A5\u8F6C\u6362\uFF0C${removed} \u4E2A\u5360\u4F4D\u79FB\u9664\uFF0C${failed} \u5F20\u5931\u8D25`);
  }
  async localizeFile(file) {
    if (this.processingPaths.has(file.path)) {
      return { downloaded: 0, reused: 0, failed: 0, links: 0, removed: 0, migrated: 0, changed: false };
    }
    this.processingPaths.add(file.path);
    try {
      const source = await this.host.app.vault.read(file);
      const legacyResult = this.normalizeLegacyAttachmentLinks(source, file.path);
      const linkResult = this.normalizeOneNoteLinksWrap(legacyResult.markdown);
      let workingMarkdown = linkResult.markdown;
      let changed = legacyResult.changed || linkResult.changed;
      let migrated = 0;
      if (this.settings.processScatteredLocalImages) {
        const scatteredResult = await this.normalizeScatteredLocalImages(workingMarkdown, file.path);
        workingMarkdown = scatteredResult.markdown;
        migrated = scatteredResult.migrated;
        changed = changed || scatteredResult.changed;
      }
      const matches = findProcessableMarkdownImages(workingMarkdown);
      const replacements = /* @__PURE__ */ new Map();
      let downloaded = 0;
      let reused = 0;
      let failed = 0;
      let removed = 0;
      if (matches.length > 0) {
        await this.ensureFolder(this.settings.attachmentFolder);
        for (const match of matches) {
          if (replacements.has(match.raw)) continue;
          try {
            if (match.type === "data" && this.settings.removeTransparentPlaceholders && isTransparentPlaceholderDataUrl(match.url)) {
              replacements.set(match.raw, "");
              removed += 1;
              continue;
            }
            if (!this.shouldProcessImage(match)) {
              continue;
            }
            const asset = match.type === "data" ? await this.resolveDataAsset(match.url) : await this.resolveRemoteAsset(match.url);
            if (asset.created) downloaded += 1;
            else reused += 1;
            const localEmbed = this.buildLocalEmbed(asset.path, asset.basename, file.path);
            replacements.set(match.raw, localEmbed);
          } catch (error) {
            failed += 1;
            console.error("[file-auto-localizer] \u56FE\u7247\u4E0B\u8F7D\u5931\u8D25", match.url, error);
          }
        }
      }
      let updated = workingMarkdown;
      for (const [raw, replacement] of replacements.entries()) {
        updated = replaceAll(updated, raw, replacement);
      }
      if (updated !== source) {
        await this.host.app.vault.modify(file, updated);
        changed = true;
      }
      return {
        downloaded,
        reused,
        failed,
        removed,
        migrated,
        links: linkResult.converted,
        changed
      };
    } finally {
      this.processingPaths.delete(file.path);
    }
  }
  queueAutoProcess(file) {
    if (!this.settings.autoProcessActiveNote) return;
    if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") return;
    const activeFile = this.host.app.workspace.getActiveFile();
    if (!this.settings.autoProcessAllMarkdown && activeFile !== file) return;
    const existingTimer = this.autoTimers.get(file.path);
    if (existingTimer) window.clearTimeout(existingTimer);
    const timer = window.setTimeout(async () => {
      this.autoTimers.delete(file.path);
      const currentlyActive = this.host.app.workspace.getActiveFile();
      const result = await this.localizeFile(file);
      if ((result.changed || result.failed > 0) && currentlyActive === file) {
        new import_obsidian.Notice(`\u6587\u4EF6\u81EA\u52A8\u672C\u5730\u5316\uFF08\u540E\u53F0\uFF09\uFF1A${result.downloaded} \u5F20\u4E0B\u8F7D\uFF0C${result.reused} \u5F20\u590D\u7528\uFF0C${result.links || 0} \u4E2A\u94FE\u63A5\u8F6C\u6362\uFF0C${result.removed || 0} \u4E2A\u5360\u4F4D\u79FB\u9664\uFF0C${result.failed} \u5F20\u5931\u8D25`);
      }
    }, 3e3);
    this.autoTimers.set(file.path, timer);
  }
  async resolveRemoteAsset(url) {
    const hash = stableHash(url);
    const guessedExt = guessExtensionFromUrl(url);
    const initialPath = normalizeVaultPath(`${this.settings.attachmentFolder}/${hash}${guessedExt}`);
    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(initialPath)) {
      return { path: initialPath, basename: `${hash}${guessedExt}`, created: false };
    }
    const response = await (0, import_obsidian.requestUrl)({
      url,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 Obsidian Image Localizer",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      },
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
    const ext = guessExtensionFromContentType(response.headers["content-type"]) || guessedExt;
    const finalPath = normalizeVaultPath(`${this.settings.attachmentFolder}/${hash}${ext}`);
    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(finalPath)) {
      return { path: finalPath, basename: `${hash}${ext}`, created: false };
    }
    await this.ensureFolder(this.settings.attachmentFolder);
    await this.host.app.vault.adapter.writeBinary(finalPath, response.arrayBuffer);
    return { path: finalPath, basename: `${hash}${ext}`, created: true };
  }
  async resolveDataAsset(dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    const ext = guessExtensionFromContentType(parsed.contentType) || ".png";
    const hash = stableHash(dataUrl);
    const finalPath = normalizeVaultPath(`${this.settings.attachmentFolder}/${hash}${ext}`);
    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(finalPath)) {
      return { path: finalPath, basename: `${hash}${ext}`, created: false };
    }
    await this.ensureFolder(this.settings.attachmentFolder);
    await this.host.app.vault.adapter.writeBinary(finalPath, parsed.arrayBuffer);
    return { path: finalPath, basename: `${hash}${ext}`, created: true };
  }
  async ensureFolder(folderPath) {
    const normalized = normalizeVaultPath(folderPath);
    if (!normalized) return;
    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!await this.host.app.vault.adapter.exists(current)) {
        await this.host.app.vault.createFolder(current);
      }
    }
  }
  buildLocalEmbed(path, basename, notePath, suffix = "") {
    if (suffix) {
      if (this.settings.rewriteMode === "basename") {
        return `![[${basename}${suffix}]]`;
      }
      return `![[${path}${suffix}]]`;
    }
    if (this.settings.rewriteMode === "basename") {
      return `![[${basename}]]`;
    }
    if (this.settings.rewriteMode === "wiki-path") {
      return `![[${path}]]`;
    }
    return `![](${encodeMarkdownPath(relativePathFromNote(notePath, path))})`;
  }
  async normalizeScatteredLocalImages(markdown, notePath) {
    if (!this.settings.processScatteredLocalImages) {
      return { markdown, changed: false, migrated: 0 };
    }
    const attachmentFolder = normalizeVaultPath(this.settings.attachmentFolder);
    const matches = findScatteredLocalEmbeds(markdown);
    if (matches.length === 0) {
      return { markdown, changed: false, migrated: 0 };
    }
    await this.ensureFolder(attachmentFolder);
    const replacements = /* @__PURE__ */ new Map();
    let migrated = 0;
    for (const match of matches) {
      if (replacements.has(match.raw)) continue;
      const resolvedPath = resolveLocalImagePath(notePath, match.linkPath, this.host.app);
      if (!resolvedPath || !isScatteredAttachmentPath(resolvedPath, attachmentFolder)) {
        continue;
      }
      try {
        const targetPath = await this.migrateLocalImageToAttachmentFolder(resolvedPath, attachmentFolder);
        const basename = targetPath.split("/").pop() || targetPath;
        replacements.set(match.raw, this.buildLocalEmbed(targetPath, basename, notePath, match.suffix));
        migrated += 1;
      } catch (error) {
        console.error("[file-auto-localizer] \u6563\u843D\u9644\u4EF6\u8FC1\u79FB\u5931\u8D25", resolvedPath, error);
      }
    }
    let next = markdown;
    for (const [raw, replacement] of replacements.entries()) {
      next = replaceAll(next, raw, replacement);
    }
    return { markdown: next, changed: next !== markdown, migrated };
  }
  async migrateLocalImageToAttachmentFolder(sourcePath, attachmentFolder) {
    const normalizedSource = normalizeVaultPath(sourcePath);
    const ext = guessExtensionFromPath(normalizedSource);
    const hash = stableHash(normalizedSource);
    const targetPath = normalizeVaultPath(`${attachmentFolder}/${hash}${ext}`);
    if (!this.settings.overwriteExisting && await this.host.app.vault.adapter.exists(targetPath)) {
      return targetPath;
    }
    const data2 = await this.host.app.vault.adapter.readBinary(normalizedSource);
    await this.ensureFolder(attachmentFolder);
    await this.host.app.vault.adapter.writeBinary(targetPath, data2);
    return targetPath;
  }
  normalizeLegacyAttachmentLinks(markdown, notePath) {
    let changed = false;
    const attachmentFolder = normalizeVaultPath(this.settings.attachmentFolder);
    const replaceLegacy = (name, suffix = "") => {
      changed = true;
      const targetPath = `${attachmentFolder}/${name}`;
      if (this.settings.rewriteMode === "wiki-path") {
        return suffix ? `![[${targetPath}${suffix}]]` : `![[${targetPath}]]`;
      }
      if (this.settings.rewriteMode === "basename") {
        return suffix ? `![[${name}${suffix}]]` : `![[${name}]]`;
      }
      return `![](${encodeMarkdownPath(relativePathFromNote(notePath, targetPath))})`;
    };
    const encodedAttachmentWidthRe = new RegExp(
      "!\\[\\]\\((?:\\.\\./)*_attachments/([^)|]+\\.(?:png|jpe?g|gif|webp|avif|svg|bmp|tiff?))%7C(\\d+)\\)",
      "gi"
    );
    const next = markdown.replace(/!\[\[\.attachments\/([^\]|]+)(\|[^\]]*)?\]\]/g, (_match, name, suffix) => replaceLegacy(name, suffix)).replace(/!\[\]\((?:\.\.\/)*\.attachments\/([^)]+)\)/g, (_match, name) => replaceLegacy(name)).replace(/!\[([\s\S]*?)\]\((?:\.\.\/)*\.attachments\/([^)]+)\)/g, (_match, _alt, name) => replaceLegacy(name)).replace(encodedAttachmentWidthRe, (_match, name, width) => {
      changed = true;
      return `![[_attachments/${name}|${width}]]`;
    }).replace(/!\[([\s\S]*?)\]\(((?:\.\.\/)*_attachments\/[^)]+)\)/g, (_match, alt, ref) => {
      if (!alt || !/[\r\n]/.test(alt)) return _match;
      changed = true;
      return `![](${ref})`;
    });
    return { markdown: next, changed };
  }
  normalizeOneNoteLinksWrap(markdown) {
    if (!this.settings.processOneNoteLinks) {
      return { markdown, changed: false, converted: 0 };
    }
    return normalizeOneNoteLinks(markdown, this.settings);
  }
  shouldProcessImage(match) {
    if (match.type === "data") {
      return Boolean(this.settings.processOneNoteImages);
    }
    const source = classifyRemoteSource(match.url);
    if (source === "cubox") return Boolean(this.settings.processCuboxImages);
    if (source === "wechat") return Boolean(this.settings.processWeChatImages);
    return Boolean(this.settings.processOtherRemoteImages);
  }
};
var FolderPickerModal = class extends import_obsidian.Modal {
  constructor(app, initialFolders, onSubmit) {
    super(app);
    __publicField(this, "selected");
    __publicField(this, "onSubmit");
    __publicField(this, "query");
    this.selected = new Set((initialFolders || []).map(normalizeVaultPath).filter(Boolean));
    this.onSubmit = onSubmit;
    this.query = "";
  }
  onOpen() {
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "\u9009\u62E9\u8981\u5904\u7406\u7684\u6587\u4EF6\u5939" });
    contentEl.createEl("p", { text: "\u53EF\u591A\u9009\uFF1B\u4E0D\u9009\u4EFB\u4F55\u6587\u4EF6\u5939\u65F6\u5904\u7406\u6574\u4E2A vault\u3002" });
    new import_obsidian.Setting(contentEl).setName("\u641C\u7D22\u6587\u4EF6\u5939").addText((text) => {
      text.setPlaceholder("\u8F93\u5165\u5173\u952E\u8BCD\u8FC7\u6EE4").setValue(this.query).onChange((nextValue) => {
        this.query = nextValue;
        this.render();
      });
      text.inputEl.focus();
    });
    const folders = this.app.vault.getAllLoadedFiles().filter((file) => file instanceof import_obsidian.TFolder && !!file.path).map((folder) => folder.path).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
    const visibleFolders = folders.filter((folder) => !this.query || folder.toLowerCase().includes(this.query.toLowerCase()));
    const listEl = contentEl.createDiv();
    listEl.style.maxHeight = "420px";
    listEl.style.overflow = "auto";
    listEl.style.border = "1px solid var(--background-modifier-border)";
    listEl.style.borderRadius = "8px";
    listEl.style.padding = "8px";
    if (visibleFolders.length === 0) {
      listEl.createEl("div", { text: "\u6CA1\u6709\u5339\u914D\u7684\u6587\u4EF6\u5939" });
    }
    for (const folder of visibleFolders) {
      new import_obsidian.Setting(listEl).setName(folder).addToggle((toggle) => toggle.setValue(this.selected.has(folder)).onChange((value) => {
        if (value) this.selected.add(folder);
        else this.selected.delete(folder);
      }));
    }
    new import_obsidian.Setting(contentEl).setName(`\u5DF2\u9009\u62E9 ${this.selected.size} \u4E2A\u6587\u4EF6\u5939`).setDesc(this.selected.size > 0 ? Array.from(this.selected).join("\u3001") : "\u672A\u9009\u62E9\uFF0C\u5C06\u5904\u7406\u6574\u4E2A vault").addButton((button) => {
      button.setButtonText("\u5F00\u59CB\u5904\u7406").setCta().onClick(async () => {
        this.close();
        await this.onSubmit(Array.from(this.selected));
      });
    }).addButton((button) => {
      button.setButtonText("\u6E05\u7A7A\u9009\u62E9").onClick(() => {
        this.selected.clear();
        this.render();
      });
    }).addButton((button) => {
      button.setButtonText("\u53D6\u6D88").onClick(() => this.close());
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function normalizeOneNoteLinks(markdown, settings = {}) {
  let converted = 0;
  let next = String(markdown || "");
  next = next.replace(/\[([^\]\n]+)\]\(\[([^\]\n]+)\]\((onenote:[^)]+)\)\)/gi, (_match, outerLabel, innerLabel, uri) => {
    converted += 1;
    return `[${outerLabel || innerLabel}](${formatOneNoteMarkdownDestination(normalizeOneNoteUri(uri))})`;
  });
  const linked = rewriteMarkdownLinkDestinations(next, settings, () => {
    converted += 1;
  });
  next = linked.markdown;
  next = next.replace(/https:\/\/onedrive\.live\.com\/view\.aspx\?[^\s<>\]]+/gi, (raw) => {
    const { url, suffix } = trimTrailingUrlPunctuation(raw);
    const localUri = buildOneNoteUriFromOneDriveUrl(url, settings);
    if (!localUri) return raw;
    converted += 1;
    return `[OneNote \u672C\u5730\u94FE\u63A5](${formatOneNoteMarkdownDestination(localUri)})${suffix}`;
  });
  next = next.replace(/(^|[\s(])((?:onenote:)?https:\/\/d\.docs\.live\.net\/[^\s<>\]]+)/gi, (raw, prefix, uri) => {
    if (raw.includes("](<")) return raw;
    const { url, suffix } = trimTrailingUrlPunctuation(uri);
    const localUri = normalizeOneNoteUri(url);
    if (!localUri) return raw;
    converted += 1;
    return `${prefix}[OneNote \u672C\u5730\u94FE\u63A5](${formatOneNoteMarkdownDestination(localUri)})${suffix}`;
  });
  next = next.replace(/(^|[\s(])(onenote:https:\/\/[^\s<>\]]+)/gi, (raw, prefix, uri) => {
    if (raw.includes("](<")) return raw;
    const { url, suffix } = trimTrailingUrlPunctuation(uri);
    const localUri = normalizeOneNoteUri(url);
    if (!localUri) return raw;
    converted += 1;
    return `${prefix}[OneNote \u672C\u5730\u94FE\u63A5](${formatOneNoteMarkdownDestination(localUri)})${suffix}`;
  });
  next = collapseConsecutiveDuplicateOneNoteLinks(next);
  return { markdown: next, changed: next !== markdown, converted };
}
function rewriteMarkdownLinkDestinations(markdown, settings, onConvert) {
  let index = 0;
  let last = 0;
  let output = "";
  let changed = false;
  while (index < markdown.length) {
    const labelStart = markdown.indexOf("[", index);
    if (labelStart === -1) break;
    if (labelStart > 0 && markdown[labelStart - 1] === "!") {
      index = labelStart + 1;
      continue;
    }
    const labelEnd = markdown.indexOf("]", labelStart + 1);
    if (labelEnd === -1 || markdown[labelEnd + 1] !== "(") {
      index = labelStart + 1;
      continue;
    }
    const destination = readBalancedParentheses(markdown, labelEnd + 1);
    if (!destination) {
      index = labelEnd + 1;
      continue;
    }
    const label = markdown.slice(labelStart + 1, labelEnd);
    const rawDestination = destination.inner;
    const destinationUrl = extractLinkDestination(rawDestination);
    const localUri = buildOneNoteUriFromOneDriveUrl(destinationUrl, settings) || normalizeOneNoteUri(destinationUrl);
    if (!localUri) {
      index = destination.end + 1;
      continue;
    }
    output += markdown.slice(last, labelStart);
    output += `[${label}](${formatOneNoteMarkdownDestination(localUri)})`;
    last = destination.end + 1;
    index = last;
    changed = true;
    onConvert();
  }
  if (!changed) {
    return { markdown, changed: false };
  }
  output += markdown.slice(last);
  return { markdown: output, changed: true };
}
function buildOneNoteUriFromOneDriveUrl(rawUrl, settings = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (error) {
    return null;
  }
  if (parsed.hostname.toLowerCase() !== "onedrive.live.com" || !parsed.pathname.toLowerCase().endsWith("/view.aspx")) {
    return null;
  }
  const resid = parsed.searchParams.get("resid") || parsed.searchParams.get("wdsectionfileid") || "";
  const driveId = resid.split("!")[0];
  const target = safeDecodeURIComponent(parsed.searchParams.get("wd") || "").trim();
  const targetMatch = target.match(/^target\(([\s\S]*)\)$/i);
  if (!driveId || !targetMatch) return null;
  const targetParts = targetMatch[1].split("|");
  if (targetParts.length < 3) return null;
  const filePath = normalizeVaultPath(targetParts[0]);
  const sectionAndTitle = targetParts[1].trim();
  const titleSep = sectionAndTitle.indexOf("/");
  const sectionId = titleSep === -1 ? sectionAndTitle : sectionAndTitle.slice(0, titleSep);
  const pageTitle = titleSep === -1 ? "" : sectionAndTitle.slice(titleSep + 1);
  const pageId = targetParts[2].replace(/\/+$/g, "").trim();
  if (!filePath || !sectionId || !pageId) return null;
  const rootPath = normalizeVaultPath(settings.oneNoteBasePath || DEFAULT_SETTINGS.oneNoteBasePath);
  const fullPath = rootPath && !filePath.startsWith(`${rootPath}/`) && !filePath.startsWith("\u6587\u6863/") ? `${rootPath}/${filePath}` : filePath;
  const hashPart = pageTitle ? `#${pageTitle}` : "";
  return normalizeOneNoteUri(
    `onenote:https://d.docs.live.net/${driveId}/${fullPath}${hashPart}&section-id=${wrapGuid(sectionId)}&page-id=${wrapGuid(pageId)}&end`
  );
}
function normalizeOneNoteUri(rawUri) {
  const uri = String(rawUri || "").trim();
  if (!uri) return null;
  if (/^onenote:https:\/\/d\.docs\.live\.net\//i.test(uri)) return uri;
  if (/^https:\/\/d\.docs\.live\.net\//i.test(uri)) return `onenote:${uri}`;
  return null;
}
function formatOneNoteMarkdownDestination(uri) {
  return `<${String(uri).replace(/>/g, "%3E")}>`;
}
function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}
function wrapGuid(value) {
  const guid = String(value || "").trim().replace(/[{}]/g, "");
  return `{${guid}}`;
}
function trimTrailingUrlPunctuation(value) {
  let url = String(value || "");
  let suffix = "";
  while (/[，。；;,.]$/.test(url)) {
    suffix = url.slice(-1) + suffix;
    url = url.slice(0, -1);
  }
  while (url.endsWith(")") && countChar(url, "(") < countChar(url, ")")) {
    suffix = ")" + suffix;
    url = url.slice(0, -1);
  }
  return { url, suffix };
}
function countChar(value, char) {
  return Array.from(String(value || "")).filter((item) => item === char).length;
}
function collapseConsecutiveDuplicateOneNoteLinks(markdown) {
  const lines = String(markdown || "").split(/\n/);
  const output = [];
  let previousOneNoteDestination = "";
  for (const line of lines) {
    const destination = extractSingleLineOneNoteMarkdownDestination(line);
    if (destination && destination === previousOneNoteDestination) {
      continue;
    }
    output.push(line);
    previousOneNoteDestination = destination || "";
  }
  return output.join("\n");
}
function extractSingleLineOneNoteMarkdownDestination(line) {
  const match = String(line || "").trim().match(/^\[[^\]\n]+]\(<(onenote:https:\/\/[^>]+)>\)$/i);
  return match ? match[1] : "";
}
function findScatteredLocalEmbeds(markdown) {
  const matches = [];
  const wikiRe = /!\[\[([^\]|]+)(\|[^\]]*)?\]\]/g;
  let wikiMatch;
  while ((wikiMatch = wikiRe.exec(markdown)) !== null) {
    const linkPath = wikiMatch[1].trim();
    if (HTTP_RE.test(linkPath) || DATA_IMAGE_RE.test(linkPath)) continue;
    if (!LOCAL_IMAGE_EXT_RE.test(linkPath)) continue;
    matches.push({
      raw: wikiMatch[0],
      linkPath,
      suffix: wikiMatch[2] || ""
    });
  }
  let index = 0;
  while (index < markdown.length) {
    const imageStart = markdown.indexOf("![", index);
    if (imageStart === -1) break;
    const altEnd = markdown.indexOf("]", imageStart + 2);
    if (altEnd === -1 || markdown[altEnd + 1] !== "(") {
      index = imageStart + 2;
      continue;
    }
    const destination = readBalancedParentheses(markdown, altEnd + 1);
    if (!destination) {
      index = altEnd + 2;
      continue;
    }
    const rawUrl = extractLinkDestination(destination.inner);
    if (HTTP_RE.test(rawUrl) || DATA_IMAGE_RE.test(rawUrl) || !LOCAL_IMAGE_EXT_RE.test(rawUrl)) {
      index = destination.end + 1;
      continue;
    }
    matches.push({
      raw: markdown.slice(imageStart, destination.end + 1),
      linkPath: rawUrl,
      suffix: ""
    });
    index = destination.end + 1;
  }
  return matches;
}
function resolveLocalImagePath(notePath, linkPath, app) {
  const clean = String(linkPath || "").trim().split("|")[0].trim();
  if (!clean || HTTP_RE.test(clean) || DATA_IMAGE_RE.test(clean)) return null;
  const linked = app.metadataCache.getFirstLinkpathDest(clean, notePath);
  if (linked instanceof import_obsidian.TFile) return linked.path;
  const normalized = normalizeVaultPath(clean);
  const direct = app.vault.getAbstractFileByPath(normalized);
  if (direct instanceof import_obsidian.TFile) return direct.path;
  const noteParts = normalizeVaultPath(notePath).split("/");
  noteParts.pop();
  while (noteParts.length >= 0) {
    const candidate = normalizeVaultPath([...noteParts, clean].join("/"));
    const file = app.vault.getAbstractFileByPath(candidate);
    if (file instanceof import_obsidian.TFile) return file.path;
    noteParts.pop();
  }
  return null;
}
function isScatteredAttachmentPath(vaultPath, attachmentFolder) {
  const normalized = normalizeVaultPath(vaultPath);
  const folder = normalizeVaultPath(attachmentFolder);
  if (!normalized || isInsideFolder(normalized, folder)) return false;
  return SCATTERED_ATTACHMENT_RE.test(normalized);
}
function guessExtensionFromPath(path) {
  const match = normalizeVaultPath(path).match(/\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/i);
  return match ? normalizeExtension(match[1]) : ".png";
}
function findProcessableMarkdownImages(markdown) {
  const matches = [];
  let index = 0;
  while (index < markdown.length) {
    const imageStart = markdown.indexOf("![", index);
    if (imageStart === -1) break;
    const altEnd = markdown.indexOf("]", imageStart + 2);
    if (altEnd === -1 || markdown[altEnd + 1] !== "(") {
      index = imageStart + 2;
      continue;
    }
    const destination = readBalancedParentheses(markdown, altEnd + 1);
    if (!destination) {
      index = altEnd + 2;
      continue;
    }
    const rawUrl = extractLinkDestination(destination.inner);
    const type = HTTP_RE.test(rawUrl) ? "remote" : DATA_IMAGE_RE.test(rawUrl) ? "data" : "";
    if (!type) {
      index = destination.end + 1;
      continue;
    }
    matches.push({
      raw: markdown.slice(imageStart, destination.end + 1),
      alt: markdown.slice(imageStart + 2, altEnd),
      url: rawUrl,
      type,
      index: imageStart
    });
    index = destination.end + 1;
  }
  return matches;
}
function readBalancedParentheses(source, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    const previous = source[i - 1];
    if (char === "(" && previous !== "\\") {
      depth += 1;
    } else if (char === ")" && previous !== "\\") {
      depth -= 1;
      if (depth === 0) {
        return {
          inner: source.slice(openIndex + 1, i),
          end: i
        };
      }
    }
  }
  return null;
}
function extractLinkDestination(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("<")) {
    const close = trimmed.indexOf(">");
    if (close !== -1) return trimmed.slice(1, close);
  }
  const titleMatch = trimmed.match(/^(\S+)\s+["'][^"']*["']\s*$/);
  return titleMatch ? titleMatch[1] : trimmed;
}
function isInsideFolder(filePath, folderPath) {
  const normalized = normalizeVaultPath(folderPath);
  if (!normalized) return true;
  return filePath === normalized || filePath.startsWith(`${normalized}/`);
}
function normalizeSettings(settings) {
  const normalized = Object.assign({}, DEFAULT_SETTINGS, settings || {});
  if (!Array.isArray(normalized.defaultFolders)) {
    normalized.defaultFolders = normalized.defaultFolder ? [normalized.defaultFolder] : [];
  }
  normalized.defaultFolders = normalized.defaultFolders.map(normalizeVaultPath).filter(Boolean);
  normalized.oneNoteBasePath = normalizeVaultPath(normalized.oneNoteBasePath || DEFAULT_SETTINGS.oneNoteBasePath);
  normalized.processOneNoteLinks = normalized.processOneNoteLinks !== false;
  normalized.processScatteredLocalImages = normalized.processScatteredLocalImages !== false;
  delete normalized.defaultFolder;
  return normalized;
}
function formatFolderSelection(folderPaths) {
  const folders = (folderPaths || []).map(normalizeVaultPath).filter(Boolean);
  if (folders.length === 0) return "\u672A\u9009\u62E9\u65F6\u5904\u7406\u6574\u4E2A vault\uFF1B\u70B9\u51FB\u6309\u94AE\u53EF\u591A\u9009\u5DF2\u6709\u6587\u4EF6\u5939";
  return `\u5DF2\u9009\u62E9 ${folders.length} \u4E2A\uFF1A${folders.join("\u3001")}`;
}
function classifyRemoteSource(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    return "other";
  }
  const host = parsed.hostname.toLowerCase();
  if (host.includes("cubox.pro")) return "cubox";
  if (host.includes("mmbiz.qpic.cn") || host.includes("mp.weixin.qq.com")) return "wechat";
  const imageUrl = parsed.searchParams.get("imageUrl");
  if (imageUrl) {
    try {
      const nestedHost = new URL(decodeURIComponent(imageUrl)).hostname.toLowerCase();
      if (nestedHost.includes("mmbiz.qpic.cn") || nestedHost.includes("mp.weixin.qq.com")) return "wechat";
    } catch (error) {
      return "other";
    }
  }
  return "other";
}
function normalizeVaultPath(path) {
  return String(path || "").trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
}
function encodeMarkdownPath(path) {
  return String(path || "").split("/").map((part) => encodeURIComponent(part).replace(/%20/g, "%20")).join("/");
}
function relativePathFromNote(notePath, targetPath) {
  const noteParts = normalizeVaultPath(notePath).split("/");
  noteParts.pop();
  const targetParts = normalizeVaultPath(targetPath).split("/");
  while (noteParts.length > 0 && targetParts.length > 0 && noteParts[0] === targetParts[0]) {
    noteParts.shift();
    targetParts.shift();
  }
  const prefix = noteParts.map(() => "..");
  const relativeParts = prefix.concat(targetParts);
  return relativeParts.length > 0 ? relativeParts.join("/") : targetPath;
}
function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;,]+)((?:;[^,]+)*),(.*)$/i);
  if (!match) throw new Error("Invalid data URL");
  const contentType = match[1].toLowerCase();
  const flags = match[2] || "";
  const data2 = match[3] || "";
  const bytes = flags.includes(";base64") ? binaryStringToArrayBuffer(atob(data2)) : new TextEncoder().encode(decodeURIComponent(data2)).buffer;
  return { contentType, arrayBuffer: bytes };
}
function binaryStringToArrayBuffer(binary) {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
function isTransparentPlaceholderDataUrl(dataUrl) {
  try {
    const parsed = parseDataUrl(dataUrl);
    if (parsed.contentType !== "image/svg+xml") return false;
    const svg = new TextDecoder().decode(parsed.arrayBuffer);
    const isOnePixel = /width=['"]1px['"]/i.test(svg) && /height=['"]1px['"]/i.test(svg) && /viewBox=['"]0 0 1 1['"]/i.test(svg);
    const isTransparent = /fill-opacity=['"]0['"]/i.test(svg) || /opacity=['"]0['"]/i.test(svg);
    return isOnePixel && isTransparent;
  } catch (error) {
    return false;
  }
}
function guessExtensionFromUrl(url) {
  const candidates = [url];
  try {
    const parsed = new URL(url);
    const imageUrl = parsed.searchParams.get("imageUrl");
    if (imageUrl) candidates.unshift(decodeURIComponent(imageUrl));
  } catch (error) {
  }
  for (const candidate of candidates) {
    const clean = candidate.split("#")[0].split("?")[0];
    const match = clean.match(/\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?)$/i);
    if (match) return normalizeExtension(match[1]);
  }
  return ".png";
}
function guessExtensionFromContentType(contentType) {
  if (!contentType) return "";
  const type = contentType.split(";")[0].trim().toLowerCase();
  const map = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff"
  };
  return map[type] || "";
}
function normalizeExtension(ext) {
  const lower = ext.toLowerCase().replace(/^\./, "");
  if (lower === "jpeg") return ".jpg";
  if (lower === "tif") return ".tiff";
  return `.${lower}`;
}
function stableHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `img-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
function replaceAll(source, search, replacement) {
  return source.split(search).join(replacement);
}
var activeRunner = null;
var fileAutoLocalizerModule = {
  id: "file-auto-localizer",
  displayName: "\u6587\u4EF6\u81EA\u52A8\u672C\u5730\u5316",
  description: "\u539F OneNote \u672C\u5730\u5316\u63D2\u4EF6\uFF1A\u81EA\u52A8\u628A\u7B14\u8BB0\u4E2D\u7684\u8FDC\u7A0B\u56FE\u7247\u3001OneDrive/OneNote \u94FE\u63A5\u8F6C\u6362\u4E3A\u672C\u5730\u6587\u4EF6\u4E0E\u53EF\u6253\u5F00\u94FE\u63A5",
  defaultEnabled: true,
  replacesExternalPluginId: "image-localizer",
  async load(host) {
    const runner = new FileAutoLocalizerRunner(host);
    activeRunner = runner;
    host.register(() => {
      if (activeRunner === runner) activeRunner = null;
    });
    await runner.start();
  }
};
function renderFileAutoLocalizerSettings(containerEl) {
  const runner = activeRunner;
  if (!runner) {
    containerEl.createEl("p", {
      text: "\u6587\u4EF6\u81EA\u52A8\u672C\u5730\u5316\u672A\u542F\u7528\uFF0C\u542F\u7528\u540E\u53EF\u5728\u6B64\u8C03\u6574\u8BBE\u7F6E\u3002",
      cls: "setting-item-description"
    });
    return;
  }
  containerEl.empty();
  const actions = containerEl.createDiv({ cls: "fdtb-localizer-quick-actions" });
  new import_obsidian.Setting(actions).setName("\u5FEB\u6377\u5904\u7406").setDesc("\u624B\u52A8\u89E6\u53D1\u672C\u5730\u5316\uFF0C\u4E0D\u4F9D\u8D56\u81EA\u52A8\u5904\u7406\u5F00\u5173").addButton(
    (button) => button.setButtonText("\u7ACB\u5373\u5904\u7406\u5F53\u524D\u7B14\u8BB0").onClick(() => {
      void runner.localizeCurrentFile();
    })
  ).addButton(
    (button) => button.setButtonText("\u9009\u62E9\u6587\u4EF6\u5939\u6279\u91CF\u5904\u7406").onClick(() => {
      new FolderPickerModal(runner.host.app, runner.settings.defaultFolders, async (folderPaths) => {
        runner.settings.defaultFolders = folderPaths.map(normalizeVaultPath).filter(Boolean);
        await runner.saveSettings();
        await runner.localizeFolders(runner.settings.defaultFolders);
      }).open();
    })
  );
  const autoSection = containerEl.createEl("details", { cls: "fdtb-localizer-section" });
  autoSection.createEl("summary", { text: "\u81EA\u52A8\u5904\u7406" });
  const autoBody = autoSection.createDiv();
  new import_obsidian.Setting(autoBody).setName("\u81EA\u52A8\u5904\u7406\u5F53\u524D\u7B14\u8BB0").setDesc("\u6253\u5F00\u6216\u5BFC\u5165 Markdown \u540E\uFF0C\u81EA\u52A8\u4E0B\u8F7D\u8FDC\u7A0B\u56FE\u7247\u5E76\u6539\u6210\u672C\u5730\u5F15\u7528").addToggle(
    (toggle) => toggle.setValue(runner.settings.autoProcessActiveNote).onChange(async (value) => {
      runner.settings.autoProcessActiveNote = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(autoBody).setName("\u81EA\u52A8\u5904\u7406\u6240\u6709\u65B0\u6539 Markdown").setDesc("Web Clipper \u540E\u53F0\u521B\u5EFA\u6216\u66F4\u65B0\u7B14\u8BB0\u65F6\u4E5F\u4F1A\u81EA\u52A8\u5904\u7406").addToggle(
    (toggle) => toggle.setValue(runner.settings.autoProcessAllMarkdown).onChange(async (value) => {
      runner.settings.autoProcessAllMarkdown = value;
      await runner.saveSettings();
    })
  );
  const sourceSection = containerEl.createEl("details", { cls: "fdtb-localizer-section" });
  sourceSection.createEl("summary", { text: "\u6765\u6E90\u5F00\u5173\uFF08\u5FAE\u4FE1 \xB7 Cubox \xB7 OneNote \xB7 \u8FDC\u7A0B\u56FE \xB7 \u6563\u843D\u9644\u4EF6\uFF09" });
  const sourceBody = sourceSection.createDiv();
  new import_obsidian.Setting(sourceBody).setName("\u81EA\u52A8\u4E0B\u8F7D\u5FAE\u4FE1\u56FE\u7247").setDesc("\u5904\u7406 mmbiz.qpic.cn\u3001mp.weixin.qq.com \u7B49\u5FAE\u4FE1\u6587\u7AE0\u56FE\u7247").addToggle(
    (toggle) => toggle.setValue(runner.settings.processWeChatImages).onChange(async (value) => {
      runner.settings.processWeChatImages = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(sourceBody).setName("\u81EA\u52A8\u4E0B\u8F7D Cubox \u56FE\u7247").setDesc("\u5904\u7406 Cubox \u4EE3\u7406\u56FE\u7247\u94FE\u63A5\uFF0C\u4F8B\u5982 cubox.pro/c/filters...").addToggle(
    (toggle) => toggle.setValue(runner.settings.processCuboxImages).onChange(async (value) => {
      runner.settings.processCuboxImages = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(sourceBody).setName("\u81EA\u52A8\u4FDD\u5B58 OneNote \u56FE\u7247").setDesc("\u5904\u7406 OneNote \u590D\u5236\u8FDB\u6765\u7684 data:image/base64 \u56FE\u7247\uFF0C\u8F6C\u6210\u672C\u5730\u56FE\u7247\u6587\u4EF6").addToggle(
    (toggle) => toggle.setValue(runner.settings.processOneNoteImages).onChange(async (value) => {
      runner.settings.processOneNoteImages = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(sourceBody).setName("\u81EA\u52A8\u8F6C\u6362 OneNote \u9875\u9762\u94FE\u63A5").setDesc("\u628A OneDrive \u7F51\u9875\u89C6\u56FE\u94FE\u63A5\u8F6C\u6362\u4E3A\u53EF\u6253\u5F00\u672C\u5730 OneNote \u7684 onenote: \u94FE\u63A5").addToggle(
    (toggle) => toggle.setValue(runner.settings.processOneNoteLinks).onChange(async (value) => {
      runner.settings.processOneNoteLinks = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(sourceBody).setName("\u81EA\u52A8\u4E0B\u8F7D\u5176\u4ED6\u8FDC\u7A0B\u56FE\u7247").setDesc("\u5904\u7406\u975E\u5FAE\u4FE1\u3001\u975E Cubox \u7684\u666E\u901A http/https \u56FE\u7247").addToggle(
    (toggle) => toggle.setValue(runner.settings.processOtherRemoteImages).onChange(async (value) => {
      runner.settings.processOtherRemoteImages = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(sourceBody).setName("\u81EA\u52A8\u8FC1\u79FB\u6563\u843D\u672C\u5730\u9644\u4EF6").setDesc("\u628A assets/attachments\u3001.attachments \u7B49\u53EF\u89C1\u76EE\u5F55\u91CC\u7684\u56FE\u7247\u642C\u5230\u9690\u85CF\u9644\u4EF6\u76EE\u5F55\uFF0C\u5E76\u6539\u5199\u7B14\u8BB0\u5F15\u7528").addToggle(
    (toggle) => toggle.setValue(runner.settings.processScatteredLocalImages).onChange(async (value) => {
      runner.settings.processScatteredLocalImages = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(sourceBody).setName("\u79FB\u9664\u900F\u660E\u5360\u4F4D\u56FE").setDesc("\u81EA\u52A8\u6E05\u7406\u5FAE\u4FE1\u526A\u85CF\u91CC\u5E38\u89C1\u7684 1px data:image \u5360\u4F4D\uFF0C\u907F\u514D\u7834\u56FE\u6846").addToggle(
    (toggle) => toggle.setValue(runner.settings.removeTransparentPlaceholders).onChange(async (value) => {
      runner.settings.removeTransparentPlaceholders = value;
      await runner.saveSettings();
    })
  );
  const advancedSection = containerEl.createEl("details", { cls: "fdtb-localizer-section" });
  advancedSection.createEl("summary", { text: "\u9AD8\u7EA7\u8DEF\u5F84\u4E0E\u5F15\u7528\u683C\u5F0F" });
  const advancedBody = advancedSection.createDiv();
  new import_obsidian.Setting(advancedBody).setName("\u9690\u85CF\u9644\u4EF6\u76EE\u5F55").setDesc("\u56FE\u7247\u4F1A\u4E0B\u8F7D\u5230 vault \u5185\u8FD9\u4E2A\u76EE\u5F55\u3002\u9ED8\u8BA4 _attachments\uFF0C\u5E76\u901A\u8FC7 CSS \u5728\u6587\u4EF6\u5217\u8868\u9690\u85CF").addText(
    (text) => text.setPlaceholder("_attachments").setValue(runner.settings.attachmentFolder).onChange(async (value) => {
      runner.settings.attachmentFolder = normalizeVaultPath(value) || DEFAULT_SETTINGS.attachmentFolder;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(advancedBody).setName("\u6279\u91CF\u9ED8\u8BA4\u6587\u4EF6\u5939").setDesc(formatFolderSelection(runner.settings.defaultFolders)).addButton(
    (button) => button.setButtonText("\u9009\u62E9\u6587\u4EF6\u5939").onClick(() => {
      new FolderPickerModal(runner.host.app, runner.settings.defaultFolders, async (folderPaths) => {
        runner.settings.defaultFolders = folderPaths.map(normalizeVaultPath).filter(Boolean);
        await runner.saveSettings();
        renderFileAutoLocalizerSettings(containerEl);
      }).open();
    })
  ).addButton(
    (button) => button.setButtonText("\u6E05\u7A7A").onClick(async () => {
      runner.settings.defaultFolders = [];
      await runner.saveSettings();
      renderFileAutoLocalizerSettings(containerEl);
    })
  );
  new import_obsidian.Setting(advancedBody).setName("\u5F15\u7528\u683C\u5F0F").setDesc("\u63A8\u8350\u6807\u51C6 Markdown \u76F8\u5BF9\u8DEF\u5F84\uFF0C\u907F\u514D Obsidian \u627E\u4E0D\u5230 wiki \u56FE\u7247").addDropdown(
    (dropdown) => dropdown.addOption("markdown", "![](_attachments/xxx.png)").addOption("wiki-path", "![[_attachments/xxx.png]]").addOption("basename", "![[xxx.png]]").setValue(runner.settings.rewriteMode).onChange(async (value) => {
      runner.settings.rewriteMode = value;
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(advancedBody).setName("OneNote \u6839\u8DEF\u5F84").setDesc("\u7528\u4E8E\u4ECE OneDrive \u7F51\u9875\u94FE\u63A5\u8865\u5168\u672C\u5730 OneNote \u8DEF\u5F84\uFF1B\u7559\u7A7A\u5219\u8DF3\u8FC7\u94FE\u63A5\u8F6C\u6362").addText(
    (text) => text.setPlaceholder("\u4F8B\u5982\uFF1ADocuments/MyNotebook/Section").setValue(runner.settings.oneNoteBasePath).onChange(async (value) => {
      runner.settings.oneNoteBasePath = normalizeVaultPath(value);
      await runner.saveSettings();
    })
  );
  new import_obsidian.Setting(advancedBody).setName("\u8986\u76D6\u5DF2\u5B58\u5728\u56FE\u7247").setDesc("\u9ED8\u8BA4\u5173\u95ED\uFF1B\u540C\u4E00 URL \u4F1A\u590D\u7528 hash \u6587\u4EF6\uFF0C\u907F\u514D\u91CD\u590D\u4E0B\u8F7D").addToggle(
    (toggle) => toggle.setValue(runner.settings.overwriteExisting).onChange(async (value) => {
      runner.settings.overwriteExisting = value;
      await runner.saveSettings();
    })
  );
}

// src/modules/global-wide-page.ts
var DEFAULT_SETTINGS2 = {
  enabled: true,
  showStatusBarToggle: true
};
var BODY_CLASS = "global-wide-page-enabled";
var STYLE_ID = "fdtb-module-global-wide-page-style";
var MODULE_STYLE = `
body.global-wide-page-enabled {
  --file-line-width: 100%;
}
body.global-wide-page-enabled .markdown-source-view.is-readable-line-width,
body.global-wide-page-enabled .markdown-preview-view.is-readable-line-width {
  --file-line-width: 100%;
}
body.global-wide-page-enabled .markdown-source-view.is-readable-line-width .cm-sizer,
body.global-wide-page-enabled .markdown-preview-view.is-readable-line-width .markdown-preview-sizer {
  max-width: min(1680px, calc(100% - 3rem));
  width: min(1680px, calc(100% - 3rem));
}
body.global-wide-page-enabled .markdown-source-view.is-readable-line-width .cm-contentContainer,
body.global-wide-page-enabled .markdown-preview-view.is-readable-line-width .markdown-preview-sizer {
  width: 100%;
}
.status-bar-item.plugin-global-wide-page-toggle {
  cursor: pointer;
  user-select: none;
}
.status-bar-item.plugin-global-wide-page-toggle.is-active {
  color: var(--text-accent);
}
`;
function injectModuleStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = MODULE_STYLE;
  document.head.appendChild(style);
}
function removeModuleStyle() {
  document.getElementById(STYLE_ID)?.remove();
}
var GlobalWidePageRunner = class {
  constructor(host) {
    this.host = host;
    __publicField(this, "settings", DEFAULT_SETTINGS2);
    __publicField(this, "statusBarEl", null);
  }
  async start() {
    const saved = await this.host.loadData();
    this.settings = { ...DEFAULT_SETTINGS2, ...saved ?? {} };
    injectModuleStyle();
    this.host.addCommand({
      id: "toggle",
      name: "\u5207\u6362\u5168\u5C40\u5BBD\u9875\u9762",
      callback: () => void this.toggleWidePage()
    });
    if (this.settings.showStatusBarToggle) {
      this.statusBarEl = this.host.addStatusBarItem();
      this.statusBarEl.addClass("plugin-global-wide-page-toggle");
      this.statusBarEl.addEventListener("click", () => {
        void this.toggleWidePage();
      });
    }
    this.host.registerEvent(this.host.app.workspace.on("layout-change", () => this.applyWidePageState()));
    this.host.registerEvent(this.host.app.workspace.on("active-leaf-change", () => this.applyWidePageState()));
    this.host.app.workspace.onLayoutReady(() => this.applyWidePageState());
    this.applyWidePageState();
    this.host.register(() => {
      document.body.classList.remove(BODY_CLASS);
      removeModuleStyle();
    });
  }
  async toggleWidePage() {
    this.settings.enabled = !this.settings.enabled;
    await this.host.saveData(this.settings);
    this.applyWidePageState();
  }
  applyWidePageState() {
    document.body.classList.toggle(BODY_CLASS, this.settings.enabled);
    if (!this.statusBarEl) return;
    this.statusBarEl.setText(this.settings.enabled ? "\u5BBD\u5C4F" : "\u6807\u51C6");
    this.statusBarEl.toggleClass("is-active", this.settings.enabled);
    const tip = this.settings.enabled ? "\u5F53\u524D\u9ED8\u8BA4\u5BBD\u9875\u9762\uFF0C\u70B9\u51FB\u5207\u6362\u4E3A\u6807\u51C6\u5BBD\u5EA6" : "\u5F53\u524D\u6807\u51C6\u5BBD\u5EA6\uFF0C\u70B9\u51FB\u5207\u6362\u4E3A\u5BBD\u9875\u9762";
    this.statusBarEl.setAttribute("aria-label", tip);
    this.statusBarEl.title = tip;
  }
};
var globalWidePageModule = {
  id: "global-wide-page",
  displayName: "\u5168\u5C40\u5BBD\u9875\u9762",
  description: "\u8BA9\u6240\u6709 Markdown \u9875\u9762\u9ED8\u8BA4\u4EE5\u5BBD\u9875\u9762\u663E\u793A\uFF0C\u5E76\u5728\u72B6\u6001\u680F\u63D0\u4F9B\u4E00\u952E\u5207\u6362",
  defaultEnabled: true,
  replacesExternalPluginId: "global-wide-page",
  async load(host) {
    const runner = new GlobalWidePageRunner(host);
    await runner.start();
  }
};

// src/modules/right-click-copy-as-image.ts
var import_obsidian2 = require("obsidian");
var MENU_TITLE = "\u590D\u5236\u6210\u56FE\u7247";
var CANVAS_SUCCESS_NOTICE = "\u5DF2\u590D\u5236\u5F53\u524D\u5361\u7247\u4E3A PNG \u56FE\u7247";
var TABLE_SUCCESS_NOTICE = "\u5DF2\u590D\u5236\u5F53\u524D\u8868\u683C\u4E3A PNG \u56FE\u7247";
var SELECTION_SUCCESS_NOTICE = "\u5DF2\u590D\u5236\u5F53\u524D\u9009\u533A\u4E3A PNG \u56FE\u7247";
var PAGE_SUCCESS_NOTICE = "\u5DF2\u590D\u5236\u6574\u4E2A\u9875\u9762\u4E3A PNG \u56FE\u7247";
var FAILURE_NOTICE = "\u590D\u5236\u56FE\u7247\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5";
var DESKTOP_ONLY_NOTICE = "\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u590D\u5236\u56FE\u7247\u5230\u526A\u8D34\u677F";
var EXPORT_PADDING = 12;
var EXPORT_PIXEL_RATIO = 2;
var EXPORT_STAGING_OFFSET = 16;
var MARKDOWN_MENU_TABLE_TITLE = "\u590D\u5236\u5F53\u524D\u8868\u683C\u6210\u56FE";
var MARKDOWN_MENU_SELECTION_TITLE = "\u590D\u5236\u5F53\u524D\u9009\u533A\u6210\u56FE";
var MARKDOWN_MENU_PAGE_TITLE = "\u590D\u5236\u6574\u4E2A\u9875\u9762\u6210\u56FE";
var CONTEXT_TTL_MS = 1500;
var MENU_AUGMENTED_FLAG = "__canvasCopyAsImageMarkdownAugmented";
var MENU_SELECTION_FLAG = "__canvasCopyAsImageSelectionAdded";
var MENU_TABLE_FLAG = "__canvasCopyAsImageTableAdded";
var MENU_PAGE_FLAG = "__canvasCopyAsImagePageAdded";
var LIVE_REGION_BORDER_PADDING = 2;
var TABLE_SELECTION_SELECTORS = [
  "td[aria-selected='true']",
  "th[aria-selected='true']",
  "[role='gridcell'][aria-selected='true']",
  "[role='columnheader'][aria-selected='true']",
  "[role='rowheader'][aria-selected='true']",
  "td.is-selected",
  "th.is-selected",
  "td.mod-selected",
  "th.mod-selected",
  "td.selected",
  "th.selected",
  "[role='gridcell'].is-selected",
  "[role='gridcell'].mod-selected",
  "[role='gridcell'][data-selected='true']",
  "[data-selected='true']"
].join(", ");
var RightClickCopyAsImageRunner = class {
  constructor(host) {
    this.host = host;
    __publicField(this, "lastMarkdownContext", null);
  }
  async start() {
    const workspace = this.host.app.workspace;
    this.registerMarkdownMenuPatch();
    this.host.registerEvent(
      workspace.on("canvas:node-menu", (menu, node) => {
        if (!this.isExportableNode(node)) return;
        this.addCanvasMenuItem(menu, () => this.copyNodesAsImage(this.getExportPlanForNodes([node], node.canvas)));
      })
    );
    this.host.registerEvent(
      workspace.on("canvas:selection-menu", (menu, canvas) => {
        const selectedNodes = this.getSelectedNodes(canvas);
        if (selectedNodes.length === 0) return;
        this.addCanvasMenuItem(menu, () => this.copyNodesAsImage(this.getExportPlanForNodes(selectedNodes, canvas)));
      })
    );
    this.host.registerDomEvent(
      document,
      "contextmenu",
      (event) => this.handleDocumentContextMenu(event),
      true
    );
    this.host.registerEvent(
      this.host.app.workspace.on("editor-menu", (menu, editor, info) => {
        if (!(info instanceof import_obsidian2.MarkdownView)) return;
        this.addMarkdownMenuItems(menu, info, editor, this.getFreshContextTarget(info));
      })
    );
  }
  handleDocumentContextMenu(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const view = this.getContainingMarkdownView(target);
    if (!view) return;
    this.lastMarkdownContext = {
      at: Date.now(),
      target,
      view,
      clientX: event.clientX,
      clientY: event.clientY
    };
  }
  addCanvasMenuItem(menu, onClick) {
    menu.addItem((item) => {
      item.setTitle(MENU_TITLE);
      item.setIcon("copy");
      item.onClick(() => void onClick());
    });
  }
  addMarkdownMenuItems(menu, view, editor, target) {
    const menuAny = menu;
    let itemCount = 0;
    const tableTarget = this.findTableTarget(target, view);
    const hasSelection = this.hasSelectionExport(view, editor, target);
    const hasPage = this.hasPageExport(view, editor);
    const addOnce = (flag, title, icon, onClick) => {
      if (menuAny[flag]) return;
      menu.addItem((item) => {
        item.setTitle(title);
        item.setIcon(icon);
        item.onClick(() => void onClick());
      });
      menuAny[flag] = true;
      itemCount += 1;
    };
    if (hasSelection) {
      addOnce(
        MENU_SELECTION_FLAG,
        MARKDOWN_MENU_SELECTION_TITLE,
        "image-file",
        () => this.copyCurrentSelectionAsImage(view, editor, target)
      );
    }
    if (tableTarget) {
      addOnce(
        MENU_TABLE_FLAG,
        MARKDOWN_MENU_TABLE_TITLE,
        "table",
        () => this.copyCurrentTableAsImage(view, editor, target)
      );
    }
    if (hasPage) {
      addOnce(
        MENU_PAGE_FLAG,
        MARKDOWN_MENU_PAGE_TITLE,
        "image-file",
        () => this.copyCurrentPageAsImage(view, editor)
      );
    }
    if (itemCount > 0) {
      menuAny[MENU_AUGMENTED_FLAG] = true;
    }
    return itemCount;
  }
  registerMarkdownMenuPatch() {
    const menuPrototype = import_obsidian2.Menu.prototype;
    const originalShowAtPosition = menuPrototype.showAtPosition;
    const originalShowAtMouseEvent = menuPrototype.showAtMouseEvent;
    const runner = this;
    if (typeof originalShowAtPosition === "function") {
      menuPrototype.showAtPosition = function(...args) {
        runner.tryAugmentNativeMarkdownMenu(this);
        return originalShowAtPosition.apply(this, args);
      };
    }
    if (typeof originalShowAtMouseEvent === "function") {
      menuPrototype.showAtMouseEvent = function(...args) {
        runner.tryAugmentNativeMarkdownMenu(this);
        return originalShowAtMouseEvent.apply(this, args);
      };
    }
    this.host.register(() => {
      menuPrototype.showAtPosition = originalShowAtPosition;
      if (typeof originalShowAtMouseEvent === "function") {
        menuPrototype.showAtMouseEvent = originalShowAtMouseEvent;
      }
    });
  }
  tryAugmentNativeMarkdownMenu(menu) {
    const context = this.getFreshMarkdownContext();
    if (!context) return;
    const editor = this.getEditorForView(context.view);
    const itemCount = this.addMarkdownMenuItems(menu, context.view, editor, context.target);
    if (itemCount > 0) {
      this.lastMarkdownContext = null;
    }
  }
  getSelectedNodes(canvas) {
    const selection = canvas.getSelectionData?.();
    const selectedNodes = selection?.nodes ?? [];
    if (selectedNodes.length === 0) return [];
    return selectedNodes.map((selectedNode) => selectedNode?.id ? canvas.nodes?.get(selectedNode.id) : null).filter((node) => node !== null && node !== void 0);
  }
  isExportableNode(node) {
    return !!node?.nodeEl;
  }
  async copyNodesAsImage(plan) {
    if (!plan || plan.nodes.length === 0) {
      new import_obsidian2.Notice(FAILURE_NOTICE);
      return;
    }
    const cleanup = this.cloneNodesForExport(plan.nodes, plan.bounds);
    await this.exportPreparedWrapper(cleanup, CANVAS_SUCCESS_NOTICE);
  }
  async copyCurrentSelectionAsImage(view, editor, target) {
    const tableCells = this.getSelectedTableCells(target, view);
    if (tableCells.length > 0) {
      const table = this.findTableTarget(target, view);
      if (table) {
        const region = this.getElementsBounds(tableCells);
        if (region) {
          await this.copyLiveNodeRegionAsImage(table, region, SELECTION_SUCCESS_NOTICE, "var(--background-primary)");
          return;
        }
      }
    }
    const domRange = this.getSelectionRangeWithinView(view);
    if (domRange) {
      await this.copyRangeAsImage(domRange, this.getRangeExportWidth(domRange, view), SELECTION_SUCCESS_NOTICE);
      return;
    }
    const selectedMarkdown = editor?.getSelection?.() ?? "";
    if (selectedMarkdown.trim()) {
      await this.copyRenderedMarkdownAsImage(
        selectedMarkdown,
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        SELECTION_SUCCESS_NOTICE
      );
      return;
    }
    new import_obsidian2.Notice(FAILURE_NOTICE);
  }
  async copyCurrentTableAsImage(view, editor, target) {
    const tableTarget = this.findTableTarget(target, view);
    if (tableTarget) {
      await this.copyLiveNodeAsImage(tableTarget, TABLE_SUCCESS_NOTICE, "var(--background-primary)");
      return;
    }
    const tableMarkdown = editor ? this.extractMarkdownTableAtSelection(editor) : null;
    if (tableMarkdown) {
      await this.copyRenderedMarkdownAsImage(
        tableMarkdown,
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        TABLE_SUCCESS_NOTICE
      );
      return;
    }
    new import_obsidian2.Notice(FAILURE_NOTICE);
  }
  async copyCurrentPageAsImage(view, editor) {
    if (editor) {
      await this.copyRenderedMarkdownAsImage(
        editor.getValue(),
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        PAGE_SUCCESS_NOTICE
      );
      return;
    }
    const pageEl = this.getPreviewPageElement(view);
    if (pageEl) {
      await this.copyLiveNodeAsImage(pageEl, PAGE_SUCCESS_NOTICE, "var(--background-primary)");
      return;
    }
    const fileText = await this.readMarkdownFile(view.file);
    if (fileText !== null) {
      await this.copyRenderedMarkdownAsImage(
        fileText,
        view.file?.path ?? "",
        this.getPreferredContentWidth(view),
        PAGE_SUCCESS_NOTICE
      );
      return;
    }
    new import_obsidian2.Notice(FAILURE_NOTICE);
  }
  hasSelectionExport(view, editor, target) {
    return this.getSelectedTableCells(target, view).length > 0 || !!this.getSelectionRangeWithinView(view) || !!editor?.getSelection?.().trim();
  }
  hasPageExport(view, editor) {
    return !!editor || !!this.getPreviewPageElement(view) || !!view.file;
  }
  findTableTarget(target, view) {
    if (target) {
      const found = target.closest("table");
      if (found instanceof HTMLElement && view.contentEl.contains(found)) {
        return found;
      }
    }
    const selectionCells = this.getSelectedTableCells(target, view);
    const selectionTable = selectionCells[0]?.closest("table");
    if (selectionTable instanceof HTMLElement && view.contentEl.contains(selectionTable)) {
      return selectionTable;
    }
    return null;
  }
  getSelectedTableCells(target, view) {
    const immediateTable = this.findImmediateTable(target, view);
    const tables = immediateTable ? [immediateTable] : Array.from(view.contentEl.querySelectorAll("table"));
    return tables.flatMap(
      (table) => Array.from(table.querySelectorAll(TABLE_SELECTION_SELECTORS)).filter((element) => this.isProbablyTableCell(element) && table.contains(element))
    );
  }
  findImmediateTable(target, view) {
    if (!target) return null;
    const table = target.closest("table");
    if (table instanceof HTMLElement && view.contentEl.contains(table)) {
      return table;
    }
    return null;
  }
  isProbablyTableCell(element) {
    const tagName = element.tagName.toLowerCase();
    if (tagName === "td" || tagName === "th") return true;
    const role = element.getAttribute("role");
    if (role === "gridcell" || role === "columnheader" || role === "rowheader") return true;
    const className = element.className;
    return typeof className === "string" && /cell/i.test(className);
  }
  extractMarkdownTableAtSelection(editor) {
    const totalLines = editor.lineCount();
    if (totalLines === 0) return null;
    const startLine = editor.getCursor("from").line;
    const endLine = editor.getCursor("to").line;
    let minLine = startLine;
    let maxLine = endLine;
    const isTableLine = (line) => /^\s*\|?.*\|.*\|?\s*$/.test(line.trim()) && line.includes("|");
    let hasTableLine = false;
    for (let line = minLine; line <= maxLine; line += 1) {
      if (isTableLine(editor.getLine(line))) {
        hasTableLine = true;
        break;
      }
    }
    if (!hasTableLine) {
      if (!isTableLine(editor.getLine(startLine))) return null;
      minLine = startLine;
      maxLine = startLine;
    }
    while (minLine > 0 && isTableLine(editor.getLine(minLine - 1))) {
      minLine -= 1;
    }
    while (maxLine < totalLines - 1 && isTableLine(editor.getLine(maxLine + 1))) {
      maxLine += 1;
    }
    const lines = [];
    for (let line = minLine; line <= maxLine; line += 1) {
      lines.push(editor.getLine(line));
    }
    if (lines.length < 2) return null;
    const dividerLine = lines.find((line) => /^(\s*\|)?[\s:|-]+(\|\s*)?$/.test(line.trim()));
    if (!dividerLine) return null;
    return lines.join("\n");
  }
  getSelectionRangeWithinView(view) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    const container = commonAncestor instanceof HTMLElement ? commonAncestor : commonAncestor.parentElement;
    if (!container || !view.contentEl.contains(container)) return null;
    return range.cloneRange();
  }
  getPreviewPageElement(view) {
    const previewSizer = view.contentEl.querySelector(
      ".markdown-preview-sizer, .markdown-source-view.mod-cm6 .cm-sizer"
    );
    if (previewSizer) return previewSizer;
    const readingView = view.contentEl.querySelector(".markdown-reading-view");
    if (readingView) return readingView;
    return null;
  }
  getPreferredContentWidth(view) {
    const candidate = view.contentEl.querySelector(
      ".markdown-preview-sizer, .cm-sizer, .cm-content, .markdown-reading-view"
    );
    const rectWidth = candidate?.getBoundingClientRect().width ?? 0;
    const scrollWidth = candidate?.scrollWidth ?? 0;
    const width = Math.max(rectWidth, scrollWidth, 680);
    return Math.min(1800, Math.max(420, Math.ceil(width)));
  }
  getRangeExportWidth(range, view) {
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
    const rectWidth = rects.length > 0 ? Math.max(...rects.map((rect) => rect.right)) - Math.min(...rects.map((rect) => rect.left)) : range.getBoundingClientRect().width;
    const preferredWidth = this.getPreferredContentWidth(view);
    return Math.min(preferredWidth, Math.max(120, Math.ceil(rectWidth || preferredWidth)));
  }
  async copyRenderedMarkdownAsImage(markdown, sourcePath, width, successNotice) {
    const cleanup = this.createWrapperForDynamicContent(width, 1, "var(--background-primary)");
    const content = document.createElement("div");
    content.className = "markdown-preview-view markdown-rendered";
    content.style.width = `${width}px`;
    content.style.maxWidth = `${width}px`;
    content.style.padding = "0";
    content.style.margin = "0";
    cleanup.stage.appendChild(content);
    try {
      await import_obsidian2.MarkdownRenderer.renderMarkdown(markdown, content, sourcePath, this.host.component);
      this.normalizeRenderedMarkdown(content);
      await this.waitForRenderSettled(content);
      const exportWidth = Math.max(width, Math.ceil(content.scrollWidth || content.getBoundingClientRect().width || width));
      const exportHeight = Math.max(1, Math.ceil(content.scrollHeight || content.getBoundingClientRect().height || 1));
      content.style.width = `${exportWidth}px`;
      content.style.maxWidth = `${exportWidth}px`;
      cleanup.stage.style.width = `${exportWidth}px`;
      cleanup.stage.style.height = `${exportHeight}px`;
      cleanup.wrapper.style.width = `${exportWidth + EXPORT_PADDING * 2}px`;
      cleanup.wrapper.style.height = `${exportHeight + EXPORT_PADDING * 2}px`;
      await this.exportPreparedWrapper(cleanup, successNotice);
    } catch (error) {
      cleanup.destroy();
      console.error("[canvas-copy-as-image] Failed to render markdown for export", error);
      new import_obsidian2.Notice(FAILURE_NOTICE);
    }
  }
  async copyRangeAsImage(range, width, successNotice) {
    const cleanup = this.createWrapperForDynamicContent(width, 1, "var(--background-primary)");
    const content = document.createElement("div");
    content.className = "markdown-preview-view markdown-rendered";
    content.style.width = `${width}px`;
    content.style.maxWidth = `${width}px`;
    content.appendChild(range.cloneContents());
    this.stripNonContentArtifacts(content);
    cleanup.stage.appendChild(content);
    const exportWidth = Math.max(width, Math.ceil(content.scrollWidth || content.getBoundingClientRect().width || width));
    const exportHeight = Math.max(1, Math.ceil(content.scrollHeight || content.getBoundingClientRect().height || 1));
    content.style.width = `${exportWidth}px`;
    content.style.maxWidth = `${exportWidth}px`;
    cleanup.stage.style.width = `${exportWidth}px`;
    cleanup.stage.style.height = `${exportHeight}px`;
    cleanup.wrapper.style.width = `${exportWidth + EXPORT_PADDING * 2}px`;
    cleanup.wrapper.style.height = `${exportHeight + EXPORT_PADDING * 2}px`;
    await this.exportPreparedWrapper(cleanup, successNotice);
  }
  async copyWholeNodeAsImage(sourceNode, successNotice, background) {
    const width = Math.max(1, Math.ceil(Math.max(sourceNode.scrollWidth, sourceNode.getBoundingClientRect().width)));
    const height = Math.max(1, Math.ceil(Math.max(sourceNode.scrollHeight, sourceNode.getBoundingClientRect().height)));
    const cleanup = this.createWrapperForDynamicContent(width, height, background);
    const clone = sourceNode.cloneNode(true);
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.width = `${width}px`;
    clone.style.maxWidth = `${width}px`;
    this.stripNonContentArtifacts(clone);
    cleanup.stage.appendChild(clone);
    await this.exportPreparedWrapper(cleanup, successNotice);
  }
  async copyLiveNodeAsImage(sourceNode, successNotice, background) {
    try {
      await this.waitForRenderSettled(sourceNode);
      const blob = await toBlob(sourceNode, {
        cacheBust: true,
        backgroundColor: this.resolveBackgroundColor(sourceNode, background),
        pixelRatio: Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO),
        filter: (node) => this.shouldIncludeLiveNode(node)
      });
      if (!blob) {
        throw new Error("Failed to export PNG blob");
      }
      await this.writeBlobToClipboard(blob);
      new import_obsidian2.Notice(successNotice);
    } catch (error) {
      console.error("[canvas-copy-as-image] Failed to copy live node image", error);
      new import_obsidian2.Notice(FAILURE_NOTICE);
    }
  }
  async copyNodeRegionAsImage(sourceNode, region, successNotice) {
    const width = Math.max(1, Math.ceil(region.width));
    const height = Math.max(1, Math.ceil(region.height));
    const sourceRect = sourceNode.getBoundingClientRect();
    const cleanup = this.createWrapperForDynamicContent(width, height, "var(--background-primary)");
    const clone = sourceNode.cloneNode(true);
    clone.style.margin = "0";
    clone.style.transform = `translate(${-Math.round(region.left - sourceRect.left)}px, ${-Math.round(region.top - sourceRect.top)}px)`;
    clone.style.transformOrigin = "top left";
    this.stripNonContentArtifacts(clone);
    cleanup.stage.appendChild(clone);
    await this.exportPreparedWrapper(cleanup, successNotice);
  }
  async copyLiveNodeRegionAsImage(sourceNode, region, successNotice, background) {
    try {
      await this.waitForRenderSettled(sourceNode);
      const pixelRatio = Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO);
      const sourceRect = sourceNode.getBoundingClientRect();
      const canvas = await toCanvas(sourceNode, {
        cacheBust: true,
        backgroundColor: this.resolveBackgroundColor(sourceNode, background),
        pixelRatio,
        filter: (node) => this.shouldIncludeLiveNode(node)
      });
      const relativeLeft = Math.max(0, region.left - sourceRect.left - LIVE_REGION_BORDER_PADDING);
      const relativeTop = Math.max(0, region.top - sourceRect.top - LIVE_REGION_BORDER_PADDING);
      const relativeRight = Math.min(sourceRect.width, region.right - sourceRect.left + LIVE_REGION_BORDER_PADDING);
      const relativeBottom = Math.min(sourceRect.height, region.bottom - sourceRect.top + LIVE_REGION_BORDER_PADDING);
      const cropWidth = Math.max(1, Math.ceil((relativeRight - relativeLeft) * pixelRatio));
      const cropHeight = Math.max(1, Math.ceil((relativeBottom - relativeTop) * pixelRatio));
      const cropped = document.createElement("canvas");
      cropped.width = cropWidth;
      cropped.height = cropHeight;
      const context = cropped.getContext("2d");
      if (!context) {
        throw new Error("Failed to create crop canvas");
      }
      context.drawImage(
        canvas,
        Math.round(relativeLeft * pixelRatio),
        Math.round(relativeTop * pixelRatio),
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
      const blob = await new Promise((resolve) => cropped.toBlob((value) => resolve(value), "image/png"));
      if (!blob) {
        throw new Error("Failed to export region PNG blob");
      }
      await this.writeBlobToClipboard(blob);
      new import_obsidian2.Notice(successNotice);
    } catch (error) {
      console.error("[canvas-copy-as-image] Failed to copy live node region image", error);
      new import_obsidian2.Notice(FAILURE_NOTICE);
    }
  }
  createWrapperForDynamicContent(exportWidth, exportHeight, background) {
    const wrapper = document.createElement("div");
    wrapper.className = "canvas-copy-as-image-wrapper";
    wrapper.style.position = "fixed";
    wrapper.style.left = `${EXPORT_STAGING_OFFSET}px`;
    wrapper.style.top = `${EXPORT_STAGING_OFFSET}px`;
    wrapper.style.zIndex = "-1";
    wrapper.style.pointerEvents = "none";
    wrapper.style.background = background;
    wrapper.style.overflow = "hidden";
    wrapper.style.contain = "layout paint style";
    wrapper.style.isolation = "isolate";
    wrapper.style.padding = `${EXPORT_PADDING}px`;
    wrapper.style.boxSizing = "border-box";
    wrapper.style.width = `${exportWidth + EXPORT_PADDING * 2}px`;
    wrapper.style.height = `${exportHeight + EXPORT_PADDING * 2}px`;
    const stage = document.createElement("div");
    stage.className = "canvas-copy-as-image-stage";
    stage.style.position = "relative";
    stage.style.width = `${exportWidth}px`;
    stage.style.height = `${exportHeight}px`;
    stage.style.overflow = "hidden";
    stage.style.background = background;
    wrapper.appendChild(stage);
    document.body.appendChild(wrapper);
    return {
      wrapper,
      stage,
      destroy: () => wrapper.remove()
    };
  }
  async exportPreparedWrapper(cleanup, successNotice) {
    try {
      await this.waitForRenderSettled(cleanup.wrapper);
      const blob = await toBlob(cleanup.wrapper, {
        cacheBust: true,
        pixelRatio: Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO)
      });
      if (!blob) {
        throw new Error("Failed to export PNG blob");
      }
      await this.writeBlobToClipboard(blob);
      new import_obsidian2.Notice(successNotice);
    } catch (error) {
      console.error("[canvas-copy-as-image] Failed to copy image", error);
      new import_obsidian2.Notice(FAILURE_NOTICE);
    } finally {
      cleanup.destroy();
    }
  }
  normalizeRenderedMarkdown(root) {
    root.querySelectorAll("p").forEach((paragraph) => {
      paragraph.style.marginTop = "0";
    });
  }
  async waitForRenderSettled(root) {
    await this.waitForNextFrame();
    await this.waitForNextFrame();
    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(images.map((image) => this.waitForImage(image)));
    await this.waitForNextFrame();
  }
  waitForImage(image) {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  }
  waitForNextFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
  }
  getElementsBounds(elements) {
    if (elements.length === 0) return null;
    const rects = elements.map((element) => element.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0);
    if (rects.length === 0) return null;
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON() {
        return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top };
      }
    };
  }
  stripNonContentArtifacts(root) {
    this.stripSelectionArtifacts(root);
    const selectors = [
      ".cm-cursor",
      ".cm-selectionLayer",
      ".cm-activeLine",
      ".markdown-source-view.mod-cm6 .cm-gutters",
      ".markdown-source-view.mod-cm6 .cm-activeLineGutter",
      ".menu",
      ".suggestion-container",
      ".popover",
      ".workspace-tab-header",
      ".fdtb-handle",
      ".fdtb-popover",
      ".fdtb-submenu",
      ".mdtp-sidebar-handle",
      ".mdtp-sidebar-popover",
      ".mdtp-image-manipulator",
      ".mdtp-inline-editor",
      ".mdtp-resize-handle"
    ];
    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => element.remove());
    }
  }
  shouldIncludeLiveNode(node) {
    if (!(node instanceof HTMLElement)) {
      return true;
    }
    if (this.matchesArtifactSelector(node)) {
      return false;
    }
    const ariaLabel = node.getAttribute("aria-label") || node.getAttribute("aria-description") || "";
    const title = node.getAttribute("title") || "";
    const tooltip = `${ariaLabel} ${title}`.trim();
    if (tooltip && /(新增行|新增列|移动行|移动列|删除行|删除列|复制行|复制列|对齐|排序|更多选项)/.test(tooltip)) {
      return false;
    }
    return true;
  }
  matchesArtifactSelector(element) {
    const selectors = [
      ".cm-cursor",
      ".cm-selectionLayer",
      ".cm-activeLine",
      ".markdown-source-view.mod-cm6 .cm-gutters",
      ".markdown-source-view.mod-cm6 .cm-activeLineGutter",
      ".menu",
      ".suggestion-container",
      ".popover",
      ".workspace-tab-header",
      ".canvas-node-resizer",
      ".canvas-node-handle",
      ".canvas-node-toolbar",
      ".canvas-node-menu",
      ".canvas-node-menu-button",
      ".canvas-node-controls",
      ".canvas-selection-box",
      ".canvas-zoom-btn",
      ".canvas-floating-button",
      ".canvas-node-placeholder",
      ".fdtb-handle",
      ".fdtb-popover",
      ".fdtb-submenu",
      ".mdtp-sidebar-handle",
      ".mdtp-sidebar-popover",
      ".mdtp-image-manipulator",
      ".mdtp-inline-editor",
      ".mdtp-resize-handle"
    ];
    return selectors.some((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
  }
  resolveBackgroundColor(sourceNode, background) {
    const trimmed = background.trim();
    if (trimmed.startsWith("var(")) {
      const variableName = trimmed.slice(4, -1).trim();
      const fromNode = getComputedStyle(sourceNode).getPropertyValue(variableName).trim();
      if (fromNode) return fromNode;
      const fromBody = getComputedStyle(document.body).getPropertyValue(variableName).trim();
      if (fromBody) return fromBody;
    }
    return trimmed || "#ffffff";
  }
  getFreshContextTarget(view) {
    return this.getFreshMarkdownContext(view)?.target ?? null;
  }
  getFreshMarkdownContext(view) {
    if (!this.lastMarkdownContext) return null;
    if (view && this.lastMarkdownContext.view !== view) return null;
    if (Date.now() - this.lastMarkdownContext.at > CONTEXT_TTL_MS) return null;
    if (!this.lastMarkdownContext.view.contentEl.contains(this.lastMarkdownContext.target)) return null;
    return this.lastMarkdownContext;
  }
  getContainingMarkdownView(target) {
    for (const leaf of this.host.app.workspace.getLeavesOfType("markdown")) {
      const view = leaf.view;
      if (view instanceof import_obsidian2.MarkdownView && view.contentEl.contains(target)) {
        return view;
      }
    }
    return null;
  }
  getEditorForView(view) {
    const editor = view?.editor;
    if (editor && typeof editor.getValue === "function") {
      return editor;
    }
    return null;
  }
  async readMarkdownFile(file) {
    if (!file) return null;
    return await this.host.app.vault.cachedRead(file);
  }
  getExportPlanForNodes(selectedNodes, canvas) {
    const exportNodesMap = /* @__PURE__ */ new Map();
    const boundsSources = [];
    for (const node of selectedNodes) {
      if (!this.isExportableNode(node)) continue;
      const nodeId = this.getNodeId(node);
      if (nodeId) exportNodesMap.set(nodeId, node);
      boundsSources.push(node);
      if (this.isGroupNode(node) && canvas?.getContainingNodes) {
        const bounds2 = this.getNodeBounds(node);
        if (!bounds2) continue;
        const containedNodes = canvas.getContainingNodes(bounds2);
        for (const containedNode of containedNodes) {
          if (!this.isExportableNode(containedNode)) continue;
          const containedId = this.getNodeId(containedNode);
          if (!containedId) continue;
          exportNodesMap.set(containedId, containedNode);
        }
      }
    }
    const exportNodes = [...exportNodesMap.values()];
    const bounds = this.combineBounds(boundsSources.length > 0 ? boundsSources : exportNodes);
    if (!bounds || exportNodes.length === 0) return null;
    const sortedNodes = exportNodes.sort((left, right) => this.getNodeZIndex(left) - this.getNodeZIndex(right));
    return { bounds, nodes: sortedNodes };
  }
  cloneNodesForExport(sourceNodes, bounds) {
    const exportWidth = Math.max(1, Math.ceil(bounds.maxX - bounds.minX));
    const exportHeight = Math.max(1, Math.ceil(bounds.maxY - bounds.minY));
    const cleanup = this.createWrapperForDynamicContent(exportWidth, exportHeight, "transparent");
    for (const sourceNode of sourceNodes) {
      if (!this.isExportableNode(sourceNode)) continue;
      const clone = this.cloneSingleNode(sourceNode, bounds);
      cleanup.stage.appendChild(clone);
    }
    return cleanup;
  }
  cloneSingleNode(sourceNode, bounds) {
    const exportSize = this.getExportSize(sourceNode);
    const nodeBounds = this.getNodeBounds(sourceNode);
    const clone = sourceNode.nodeEl.cloneNode(true);
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.position = "absolute";
    clone.style.left = `${Math.round((nodeBounds?.minX ?? bounds.minX) - bounds.minX)}px`;
    clone.style.top = `${Math.round((nodeBounds?.minY ?? bounds.minY) - bounds.minY)}px`;
    clone.style.width = `${exportSize.width}px`;
    clone.style.height = `${exportSize.height}px`;
    clone.style.zIndex = `${this.getNodeZIndex(sourceNode)}`;
    clone.style.setProperty("--canvas-node-width", `${exportSize.width}px`);
    clone.style.setProperty("--canvas-node-height", `${exportSize.height}px`);
    clone.classList.remove("is-selected", "mod-selected", "has-focus", "is-focused", "is-editing");
    this.stripSelectionArtifacts(clone);
    return clone;
  }
  getExportSize(sourceNode) {
    const rect = sourceNode.nodeEl.getBoundingClientRect();
    const computedStyle = getComputedStyle(sourceNode.nodeEl);
    const data2 = sourceNode.getData?.();
    const width = this.getDimensionValue(
      data2?.width,
      sourceNode.nodeEl.style.width,
      computedStyle.getPropertyValue("--canvas-node-width"),
      computedStyle.width,
      sourceNode.nodeEl.clientWidth,
      rect.width
    );
    const height = this.getDimensionValue(
      data2?.height,
      sourceNode.nodeEl.style.height,
      computedStyle.getPropertyValue("--canvas-node-height"),
      computedStyle.height,
      sourceNode.nodeEl.clientHeight,
      rect.height
    );
    return {
      width: Math.max(1, Math.ceil(width)),
      height: Math.max(1, Math.ceil(height))
    };
  }
  getDimensionValue(...values) {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
      }
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    return 1;
  }
  getNumericValue(...values) {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return 0;
  }
  getNodeBounds(node) {
    const data2 = node.getData?.();
    const width = this.getDimensionValue(data2?.width ?? 0);
    const height = this.getDimensionValue(data2?.height ?? 0);
    const x = this.getNumericValue(data2?.x ?? 0);
    const y = this.getNumericValue(data2?.y ?? 0);
    if (width <= 0 || height <= 0) return null;
    return {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height
    };
  }
  combineBounds(nodes) {
    const bounds = nodes.map((node) => this.getNodeBounds(node)).filter((bbox) => bbox !== null);
    if (bounds.length === 0) return null;
    return bounds.reduce((combined, current) => ({
      minX: Math.min(combined.minX, current.minX),
      minY: Math.min(combined.minY, current.minY),
      maxX: Math.max(combined.maxX, current.maxX),
      maxY: Math.max(combined.maxY, current.maxY)
    }));
  }
  isGroupNode(node) {
    return node.getData?.().type === "group";
  }
  getNodeId(node) {
    return node.getData?.().id ?? node.id ?? null;
  }
  getNodeZIndex(node) {
    if (typeof node.zIndex === "number" && Number.isFinite(node.zIndex)) {
      return node.zIndex;
    }
    const styleZIndex = this.isExportableNode(node) ? Number.parseFloat(node.nodeEl.style.zIndex || "0") : 0;
    if (Number.isFinite(styleZIndex)) return styleZIndex;
    return 0;
  }
  stripSelectionArtifacts(root) {
    const selectors = [
      ".canvas-node-resizer",
      ".canvas-node-handle",
      ".canvas-node-toolbar",
      ".canvas-node-menu",
      ".canvas-node-menu-button",
      ".canvas-node-controls",
      ".canvas-selection-box",
      ".canvas-zoom-btn",
      ".canvas-floating-button",
      ".canvas-node-placeholder"
    ];
    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => element.remove());
    }
  }
  async writeBlobToClipboard(blob) {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type || "image/png"]: blob
          })
        ]);
        return;
      } catch (error) {
        console.warn("[canvas-copy-as-image] navigator.clipboard.write failed, falling back to electron clipboard", error);
      }
    }
    const electronClipboard = this.getElectronClipboard();
    if (!electronClipboard) {
      throw new Error(DESKTOP_ONLY_NOTICE);
    }
    const { clipboard, nativeImage } = electronClipboard;
    const buffer = Buffer.from(await blob.arrayBuffer());
    clipboard.writeImage(nativeImage.createFromBuffer(buffer));
  }
  getElectronClipboard() {
    const electron = window?.require?.("electron");
    if (!electron?.clipboard || !electron?.nativeImage) return null;
    return electron;
  }
  async copyTableElementAsImage(view, tableEl) {
    if (!(view.contentEl instanceof HTMLElement) || !view.contentEl.contains(tableEl)) {
      new import_obsidian2.Notice(FAILURE_NOTICE);
      return;
    }
    await this.copyLiveNodeAsImage(tableEl, TABLE_SUCCESS_NOTICE, "var(--background-primary)");
  }
};
var activeCopyAsImageRunner = null;
function getRightClickCopyAsImageRunner() {
  return activeCopyAsImageRunner;
}
var rightClickCopyAsImageModule = {
  id: "right-click-copy-as-image",
  displayName: "\u53F3\u952E\u590D\u5236\u6210\u56FE",
  description: "\u53F3\u952E\u5361\u7247/\u8868\u683C/\u9009\u533A/\u6574\u9875\u590D\u5236\u4E3A PNG \u56FE\u7247\uFF08\u539F canvas-copy-as-image \u63D2\u4EF6\uFF09",
  defaultEnabled: true,
  replacesExternalPluginId: "canvas-copy-as-image",
  async load(host) {
    const runner = new RightClickCopyAsImageRunner(host);
    activeCopyAsImageRunner = runner;
    host.register(() => {
      if (activeCopyAsImageRunner === runner) {
        activeCopyAsImageRunner = null;
      }
    });
    await runner.start();
  }
};

// src/modules/claudian-chat-archive.ts
var import_obsidian3 = require("obsidian");

// src/modules/claudian-archive-core.ts
function normalizeArchivePath(path) {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "");
}
var ARCHIVE_SCHEMA_VERSION = 1;
var ARCHIVE_ROOT = ".claudian-sync/chat-archives";
var CLAUDIAN_META_DIR = ".claudian/sessions";
var DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS = {
  enabled: true,
  autoArchive: true,
  autoArchiveIntervalMinutes: 10,
  showCrossDeviceBadge: true,
  maxMessageBytes: 51200,
  maxArchiveBytes: 1048576,
  deviceId: ""
};
function normalizeClaudianArchiveSettings(value) {
  const saved = value && typeof value === "object" ? value : {};
  const defaults = DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS;
  return {
    enabled: typeof saved.enabled === "boolean" ? saved.enabled : defaults.enabled,
    autoArchive: typeof saved.autoArchive === "boolean" ? saved.autoArchive : defaults.autoArchive,
    autoArchiveIntervalMinutes: clampNumber(saved.autoArchiveIntervalMinutes, 3, 120, 10),
    showCrossDeviceBadge: saved.showCrossDeviceBadge !== false,
    maxMessageBytes: clampNumber(saved.maxMessageBytes, 4096, 512e3, 51200),
    maxArchiveBytes: clampNumber(saved.maxArchiveBytes, 65536, 5242880, 1048576),
    deviceId: typeof saved.deviceId === "string" ? saved.deviceId.trim().slice(0, 64) : ""
  };
}
function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}
function resolveDeviceId(settings) {
  if (settings.deviceId) return sanitizePathSegment(settings.deviceId);
  try {
    const os = require("os");
    return sanitizePathSegment(os.hostname() || "unknown-device");
  } catch {
    return "unknown-device";
  }
}
function sanitizePathSegment(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "device";
}
function getArchiveRelativePath(providerId, conversationId, deviceId) {
  const provider = sanitizePathSegment(providerId || "unknown");
  const conv = sanitizePathSegment(conversationId);
  const device = sanitizePathSegment(deviceId);
  return normalizeArchivePath(`${ARCHIVE_ROOT}/${provider}/${conv}@${device}.json`);
}
function parseSessionMeta(content) {
  try {
    const data2 = JSON.parse(content);
    if (!data2?.id || typeof data2.id !== "string") return null;
    return data2;
  } catch {
    return null;
  }
}
function buildArchiveRecord(meta, messages, deviceId, omittedExtras) {
  const now = Date.now();
  return {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    conversationId: meta.id,
    sourceProvider: meta.providerId ?? "unknown",
    sourcePlugin: "claudian",
    archiveType: "lightweight-chat",
    archiveScope: "cross-device",
    canResume: false,
    title: String(meta.title ?? "\u672A\u547D\u540D\u4F1A\u8BDD"),
    createdAt: Number(meta.createdAt) || now,
    updatedAt: Number(meta.updatedAt) || now,
    lastArchivedAt: now,
    sourceDevice: deviceId,
    currentNote: meta.currentNote,
    model: meta.usage?.model,
    sessionId: meta.sessionId,
    messages,
    omitted: {
      toolLogs: true,
      images: true,
      attachments: true,
      largeOutputs: !!omittedExtras.largeOutputs || !!omittedExtras.stoppedBySizeLimit,
      truncatedMessages: omittedExtras.truncatedMessages,
      noLocalSessionFile: omittedExtras.noLocalSessionFile,
      stoppedBySizeLimit: omittedExtras.stoppedBySizeLimit,
      providerSkipped: omittedExtras.providerSkipped
    }
  };
}

// src/modules/claudian-codex-parser.ts
var SKIP_TEXT_PREFIXES = [
  "<permissions instructions>",
  "<app-context>",
  "<environment_context>",
  "<turn_aborted>"
];
var BASE64_RE = /data:image\/[a-zA-Z0-9+.-]+;base64,/i;
var LOCAL_IMAGES_RE = /local_images/i;
function shouldSkipMessageText(text) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (BASE64_RE.test(trimmed)) return true;
  if (LOCAL_IMAGES_RE.test(trimmed) && trimmed.length > 500) return true;
  if (trimmed.includes("encrypted_content")) return true;
  const lower = trimmed.slice(0, 80).toLowerCase();
  for (const prefix of SKIP_TEXT_PREFIXES) {
    if (lower.startsWith(prefix.toLowerCase())) return true;
  }
  return false;
}
function extractTextFromContentParts(content) {
  if (!Array.isArray(content)) {
    if (typeof content === "string") return content;
    return "";
  }
  const parts = [];
  for (const part of content) {
    if (!part || typeof part !== "object") continue;
    const type = String(part.type ?? "");
    if (type === "input_text" || type === "output_text" || type === "text") {
      const text = part.text;
      if (typeof text === "string" && text.trim()) parts.push(text);
    }
  }
  return parts.join("\n\n").trim();
}
function parseCodexJsonlLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let record;
  try {
    record = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (record.type !== "response_item") return null;
  const payload = record.payload;
  if (!payload || payload.type !== "message") return null;
  const role = payload.role;
  if (role !== "user" && role !== "assistant") return null;
  const text = extractTextFromContentParts(payload.content);
  if (!text || shouldSkipMessageText(text)) return null;
  let createdAt = Date.now();
  if (typeof record.timestamp === "string") {
    const parsed = Date.parse(record.timestamp);
    if (Number.isFinite(parsed)) createdAt = parsed;
  }
  return { role, createdAt, text };
}
function truncateText(text, maxBytes) {
  const buf = Buffer.from(text, "utf-8");
  if (buf.length <= maxBytes) return { text, truncated: false };
  let end = maxBytes;
  while (end > 0 && (buf[end] & 192) === 128) end -= 1;
  return {
    text: `${buf.subarray(0, end).toString("utf-8")}

\u2026\uFF08\u5185\u5BB9\u8FC7\u957F\u5DF2\u622A\u65AD\uFF09`,
    truncated: true
  };
}
async function parseCodexJsonlFilePath(filePath, options) {
  const req = typeof require !== "undefined" ? require : null;
  const fs = req?.("fs");
  const readline = req?.("readline");
  if (!fs?.existsSync?.(filePath) || !readline) {
    return {
      messages: [],
      bytesUsed: 0,
      linesRead: 0,
      stoppedBySizeLimit: false,
      skippedLines: 0
    };
  }
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    const messages = [];
    let bytesUsed = 0;
    let linesRead = 0;
    let skippedLines = 0;
    let stoppedBySizeLimit = false;
    const finish = () => {
      rl.close();
      stream.destroy();
      resolve({ messages, bytesUsed, linesRead, stoppedBySizeLimit, skippedLines });
    };
    rl.on("line", (line) => {
      if (stoppedBySizeLimit) return;
      linesRead += 1;
      if (options.onProgress && linesRead % 500 === 0) options.onProgress(linesRead);
      const parsed = parseCodexJsonlLine(line);
      if (!parsed) {
        skippedLines += 1;
        return;
      }
      let text = parsed.text;
      let truncated = false;
      if (Buffer.byteLength(text, "utf-8") > options.maxMessageBytes) {
        const cut = truncateText(text, options.maxMessageBytes);
        text = cut.text;
        truncated = cut.truncated;
      }
      const nextBytes = bytesUsed + Buffer.byteLength(text, "utf-8");
      if (nextBytes > options.maxTotalBytes) {
        stoppedBySizeLimit = true;
        rl.close();
        stream.destroy();
        resolve({ messages, bytesUsed, linesRead, stoppedBySizeLimit, skippedLines });
        return;
      }
      bytesUsed = nextBytes;
      messages.push({ ...parsed, text, truncated: truncated || void 0 });
    });
    rl.on("close", finish);
    rl.on("error", (err) => {
      rl.close();
      stream.destroy();
      reject(err);
    });
    stream.on("error", (err) => {
      rl.close();
      stream.destroy();
      reject(err);
    });
  });
}
function resolveCodexSessionFilePath(meta) {
  const req = typeof require !== "undefined" ? require : null;
  const fs = req?.("fs");
  const path = req?.("path");
  const os = req?.("os");
  if (!fs || !path || !os) return null;
  const rewriteHome = (p) => p.replace(/^\/Users\/[^/]+/, os.homedir());
  const sessionFilePath = meta.providerState?.sessionFilePath;
  if (sessionFilePath) {
    if (fs.existsSync(sessionFilePath)) return sessionFilePath;
    const rewritten = rewriteHome(sessionFilePath);
    if (rewritten !== sessionFilePath && fs.existsSync(rewritten)) return rewritten;
  }
  const threadId = meta.providerState?.threadId || meta.sessionId || extractThreadIdFromPath(sessionFilePath);
  if (!threadId) return null;
  const roots = [];
  const transcriptRoot = meta.providerState?.transcriptRootPath;
  if (transcriptRoot) roots.push(rewriteHome(transcriptRoot));
  roots.push(path.join(os.homedir(), ".codex", "sessions"));
  const suffix = `${threadId}.jsonl`;
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const found = walkFindJsonl(root, suffix, fs, path);
    if (found) return found;
  }
  return null;
}
function extractThreadIdFromPath(sessionFilePath) {
  if (!sessionFilePath) return null;
  const match = sessionFilePath.match(/([0-9a-f-]{36})\.jsonl$/i);
  return match?.[1] ?? null;
}
function walkFindJsonl(dir, suffix, fs, path) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = walkFindJsonl(full, suffix, fs, path);
      if (inner) return inner;
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      return full;
    }
  }
  return null;
}

// src/modules/claudian-chat-archive.ts
var activeClaudianRunner = null;
var ClaudianChatArchiveRunner = class {
  constructor(host) {
    this.host = host;
    __publicField(this, "settings", { ...DEFAULT_CLAUDIAN_ARCHIVE_SETTINGS });
    __publicField(this, "autoTimer", null);
    __publicField(this, "archiving", false);
  }
  async start() {
    const saved = await this.host.loadData();
    this.settings = normalizeClaudianArchiveSettings(saved);
    if (!this.settings.enabled) {
      await this.updateSettings({ enabled: true });
    }
    this.registerCommands();
    this.syncAutoArchiveTimer();
    if (this.settings.enabled) {
      window.setTimeout(() => void this.scanAndArchiveAll({ manual: false }), 2500);
    }
  }
  async stop() {
    this.clearAutoArchiveTimer();
  }
  async updateSettings(patch) {
    this.settings = normalizeClaudianArchiveSettings({ ...this.settings, ...patch });
    await this.host.saveData(this.settings);
    this.syncAutoArchiveTimer();
  }
  registerCommands() {
    this.host.addCommand({
      id: "claudian-open-archives",
      name: "\u6253\u5F00 Claudian \u8DE8\u8BBE\u5907\u5B58\u6863",
      callback: () => new ArchiveListModal(this.host.app, this).open()
    });
    this.host.addCommand({
      id: "claudian-scan-archives",
      name: "\u626B\u63CF\u5E76\u5F52\u6863 Claudian \u4F1A\u8BDD",
      callback: () => void this.scanAndArchiveAll({ manual: true })
    });
  }
  syncAutoArchiveTimer() {
    this.clearAutoArchiveTimer();
    if (!this.settings.enabled || !this.settings.autoArchive) return;
    const minutes = this.settings.autoArchiveIntervalMinutes;
    this.autoTimer = window.setInterval(
      () => void this.scanAndArchiveAll({ manual: false }),
      minutes * 60 * 1e3
    );
  }
  clearAutoArchiveTimer() {
    if (this.autoTimer !== null) {
      window.clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }
  async scanAndArchiveAll(options) {
    if (this.archiving) {
      if (options.manual) new import_obsidian3.Notice("\u5F52\u6863\u6B63\u5728\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u7A0D\u5019");
      return { archived: 0, skipped: 0, errors: 0 };
    }
    this.archiving = true;
    let archived = 0;
    let skipped = 0;
    let errors = 0;
    try {
      const metas = await this.listSessionMetas();
      const deviceId = resolveDeviceId(this.settings);
      for (const meta of metas) {
        try {
          const result = await this.archiveOneSession(meta, deviceId);
          if (result === "archived") archived += 1;
          else skipped += 1;
        } catch (error) {
          errors += 1;
          console.error("[claudian-archive] archive failed", meta.id, error);
        }
      }
      if (options.manual) {
        new import_obsidian3.Notice(`\u5F52\u6863\u5B8C\u6210\uFF1A${archived} \u4E2A\u4F1A\u8BDD\u5DF2\u66F4\u65B0\uFF0C${skipped} \u4E2A\u8DF3\u8FC7\uFF0C${errors} \u4E2A\u5931\u8D25`);
      }
    } finally {
      this.archiving = false;
    }
    return { archived, skipped, errors };
  }
  async listSessionMetas() {
    const adapter = this.host.app.vault.adapter;
    const dir = (0, import_obsidian3.normalizePath)(CLAUDIAN_META_DIR);
    const listed = await adapter.list(dir).catch(() => null);
    if (!listed?.files?.length) return [];
    const metas = [];
    for (const filePath of listed.files) {
      if (!filePath.endsWith(".meta.json")) continue;
      const content = await adapter.read(filePath).catch(() => "");
      const meta = parseSessionMeta(content);
      if (meta) metas.push(meta);
    }
    metas.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
    return metas;
  }
  async archiveOneSession(meta, deviceId) {
    const providerId = meta.providerId ?? "unknown";
    const relPath = getArchiveRelativePath(providerId, meta.id, deviceId);
    const adapter = this.host.app.vault.adapter;
    let messages = [];
    const omitted = {
      toolLogs: true,
      images: true,
      attachments: true,
      largeOutputs: false
    };
    if (providerId !== "codex") {
      omitted.providerSkipped = true;
    } else {
      const sessionPath = resolveCodexSessionFilePath(meta);
      if (sessionPath) {
        const parsed = await parseCodexJsonlFilePath(sessionPath, {
          maxMessageBytes: this.settings.maxMessageBytes,
          maxTotalBytes: this.settings.maxArchiveBytes
        });
        messages = parsed.messages;
        omitted.stoppedBySizeLimit = parsed.stoppedBySizeLimit;
        omitted.largeOutputs = parsed.stoppedBySizeLimit;
        omitted.truncatedMessages = parsed.messages.filter((m) => m.truncated).length;
        if (messages.length === 0 && parsed.linesRead > 0) {
          omitted.noLocalSessionFile = false;
        }
      } else {
        omitted.noLocalSessionFile = true;
      }
    }
    const record = buildArchiveRecord(meta, messages, deviceId, omitted);
    const json = JSON.stringify(record, null, 2);
    if (Buffer.byteLength(json, "utf-8") > this.settings.maxArchiveBytes * 1.1) {
      record.messages = record.messages.slice(0, Math.max(1, Math.floor(record.messages.length / 2)));
      record.omitted.stoppedBySizeLimit = true;
      record.omitted.largeOutputs = true;
    }
    const existing = await adapter.exists(relPath).catch(() => false);
    const finalJson = JSON.stringify(record, null, 2);
    await adapter.write(relPath, finalJson);
    return existing ? "archived" : "archived";
  }
  async listArchives() {
    const adapter = this.host.app.vault.adapter;
    const root = (0, import_obsidian3.normalizePath)(ARCHIVE_ROOT);
    const currentDevice = resolveDeviceId(this.settings);
    const items = [];
    const walk = async (dir) => {
      const listed = await adapter.list(dir).catch(() => null);
      if (!listed) return;
      for (const file of listed.files) {
        if (!file.endsWith(".json")) continue;
        const content = await adapter.read(file).catch(() => "");
        try {
          const record = JSON.parse(content);
          if (!record?.conversationId) continue;
          items.push({
            path: file,
            record,
            isCrossDevice: record.sourceDevice !== currentDevice
          });
        } catch {
        }
      }
      for (const child of listed.folders) {
        await walk(child);
      }
    };
    await walk(root);
    items.sort((a, b) => (Number(b.record.updatedAt) || 0) - (Number(a.record.updatedAt) || 0));
    return items;
  }
  async cleanupOversizedArchives() {
    const adapter = this.host.app.vault.adapter;
    const items = await this.listArchives();
    let removed = 0;
    let trimmed = 0;
    for (const item of items) {
      const size = Buffer.byteLength(JSON.stringify(item.record), "utf-8");
      if (size <= this.settings.maxArchiveBytes) continue;
      try {
        const half = item.record.messages.slice(0, Math.max(1, Math.floor(item.record.messages.length / 2)));
        if (half.length === 0) {
          await adapter.remove(item.path);
          removed += 1;
        } else {
          item.record.messages = half;
          item.record.omitted.stoppedBySizeLimit = true;
          item.record.omitted.largeOutputs = true;
          await adapter.write(item.path, JSON.stringify(item.record, null, 2));
          trimmed += 1;
        }
      } catch (error) {
        console.error("[claudian-archive] cleanup failed", item.path, error);
      }
    }
    return { removed, trimmed };
  }
};
var ArchiveListModal = class extends import_obsidian3.Modal {
  constructor(app, runner) {
    super(app);
    this.runner = runner;
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("fdtb-claudian-archive-modal");
    contentEl.createEl("h2", { text: "Claudian \u8DE8\u8BBE\u5907\u5B58\u6863" });
    const metas = await this.runner.listSessionMetas();
    const archives = await this.runner.listArchives();
    const showBadge = this.runner.settings.showCrossDeviceBadge;
    const banner = contentEl.createDiv({ cls: "fdtb-claudian-archive-banner" });
    banner.setText(
      `\u5B58\u6863\u76EE\u5F55\uFF1A${ARCHIVE_ROOT}/ \xB7 \u672C\u673A ${resolveDeviceId(this.runner.settings)} \xB7 \u5171 ${archives.length} \u4EFD\u5B58\u6863`
    );
    const toolbar = contentEl.createDiv({ cls: "fdtb-claudian-archive-toolbar" });
    toolbar.createEl("button", { text: "\u91CD\u65B0\u626B\u63CF", cls: "mod-cta" }).addEventListener("click", () => {
      void this.runner.scanAndArchiveAll({ manual: true }).then(() => this.onOpen());
    });
    if (metas.length > 0) {
      const localTitle = contentEl.createDiv({ text: "\u672C\u673A Claudian \u4F1A\u8BDD\uFF08\u5143\u6570\u636E\uFF09" });
      localTitle.addClass("fdtb-claudian-section-title");
      const localList = contentEl.createDiv({ cls: "fdtb-claudian-archive-list" });
      for (const meta of metas) {
        const row = localList.createDiv({ cls: "fdtb-claudian-archive-row fdtb-claudian-archive-row-local" });
        const main = row.createDiv({ cls: "fdtb-claudian-archive-row-main" });
        main.createDiv({ cls: "fdtb-claudian-archive-row-title", text: meta.title ?? meta.id });
        const metaLine = main.createDiv({ cls: "fdtb-claudian-archive-row-meta" });
        metaLine.setText(new Date(Number(meta.updatedAt) || 0).toLocaleString());
        row.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-local", text: "\u672C\u673A" });
      }
    }
    const archiveTitle = contentEl.createDiv({ text: "\u5DF2\u5F52\u6863\uFF08\u53EF\u8DE8\u8BBE\u5907\u67E5\u770B\uFF09" });
    archiveTitle.addClass("fdtb-claudian-section-title");
    if (archives.length === 0) {
      contentEl.createEl("p", {
        cls: "setting-item-description",
        text: "\u6682\u65E0\u5B58\u6863\u3002\u5F00\u542F\u300CClaudian \u804A\u5929\u8BB0\u5F55\u540C\u6B65\u300D\u540E\u4F1A\u81EA\u52A8\u5199\u5165 .claudian-sync/chat-archives/\u3002"
      });
      return;
    }
    const list = contentEl.createDiv({ cls: "fdtb-claudian-archive-list" });
    for (const item of archives) {
      const row = list.createDiv({ cls: "fdtb-claudian-archive-row" });
      row.addEventListener("click", () => {
        new ArchiveViewerModal(this.app, item.record, showBadge && item.isCrossDevice).open();
      });
      const main = row.createDiv({ cls: "fdtb-claudian-archive-row-main" });
      main.createDiv({ cls: "fdtb-claudian-archive-row-title", text: item.record.title });
      const meta = main.createDiv({ cls: "fdtb-claudian-archive-row-meta" });
      meta.setText(
        `${item.record.sourceDevice} \xB7 ${new Date(item.record.lastArchivedAt).toLocaleString()} \xB7 ${item.record.messages.length} \u6761\u6D88\u606F`
      );
      if (showBadge && item.isCrossDevice) {
        const badge = row.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-cross" });
        badge.setText("\u8DE8\u8BBE\u5907");
      } else if (!item.isCrossDevice) {
        row.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-local", text: "\u672C\u673A\u5B58\u6863" });
      }
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var ArchiveViewerModal = class extends import_obsidian3.Modal {
  constructor(app, record, showCrossBadge) {
    super(app);
    this.record = record;
    this.showCrossBadge = showCrossBadge;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("fdtb-claudian-viewer");
    contentEl.createEl("h2", { text: this.record.title });
    const notice = contentEl.createDiv({ cls: "fdtb-claudian-viewer-notice" });
    notice.setText("\u53EA\u8BFB\u5B58\u6863\uFF0C\u4E0D\u53EF\u5728\u6B64\u7EED\u804A\u3002");
    if (this.showCrossBadge) {
      const badge = notice.createSpan({ cls: "fdtb-claudian-badge fdtb-claudian-badge-cross" });
      badge.setText("\u8DE8\u8BBE\u5907");
    }
    const meta = contentEl.createDiv({ cls: "fdtb-claudian-viewer-meta" });
    meta.setText(
      `${this.record.sourceDevice} \xB7 ${this.record.model ?? ""} \xB7 \u66F4\u65B0 ${new Date(this.record.updatedAt).toLocaleString()}`
    );
    const chat = contentEl.createDiv({ cls: "fdtb-claudian-viewer-chat" });
    if (this.record.messages.length === 0) {
      chat.createEl("p", {
        cls: "setting-item-description",
        text: this.record.omitted?.noLocalSessionFile ? "\u672C\u673A\u65E0 Codex \u4F1A\u8BDD\u6587\u4EF6\uFF0C\u4EC5\u540C\u6B65\u4E86\u6807\u9898\u4E0E\u5143\u6570\u636E\u3002" : "\u6682\u65E0\u53EF\u8BFB\u6D88\u606F\u6B63\u6587\u3002"
      });
      return;
    }
    for (const message of this.record.messages) {
      const bubble = chat.createDiv({
        cls: `fdtb-claudian-message fdtb-claudian-message-${message.role}`
      });
      const role = bubble.createDiv({ cls: "fdtb-claudian-message-role" });
      role.setText(message.role === "user" ? "\u4F60" : "\u52A9\u624B");
      const body = bubble.createDiv({ cls: "fdtb-claudian-message-body" });
      body.setText(message.text);
      if (message.truncated) {
        bubble.createDiv({ cls: "fdtb-claudian-message-flag", text: "\uFF08\u5DF2\u622A\u65AD\uFF09" });
      }
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
function renderClaudianChatArchiveSettings(containerEl, onRefresh) {
  const runner = activeClaudianRunner;
  if (!runner) {
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "\u8BF7\u5148\u6253\u5F00\u4E0A\u65B9\u300CClaudian \u804A\u5929\u8BB0\u5F55\u540C\u6B65\u300D\u5F00\u5173\u3002"
    });
    return;
  }
  containerEl.createEl("p", {
    cls: "setting-item-description",
    text: "\u8F7B\u91CF JSON \u5199\u5165 .claudian-sync/chat-archives/\uFF0C\u7ECF iCloud \u8DE8\u8BBE\u5907\u53EA\u8BFB\u67E5\u770B\uFF1B\u4E0D\u4FEE\u6539 Claudian \u6807\u9898\u3002"
  });
  new import_obsidian3.Setting(containerEl).setName("\u6253\u5F00\u8DE8\u8BBE\u5907\u5B58\u6863").addButton(
    (button) => button.setButtonText("\u6253\u5F00\u5217\u8868").onClick(() => new ArchiveListModal(runner.host.app, runner).open())
  );
  new import_obsidian3.Setting(containerEl).setName("\u7ACB\u5373\u626B\u63CF\u5F52\u6863").addButton(
    (button) => button.setButtonText("\u5F00\u59CB\u626B\u63CF").onClick(() => void runner.scanAndArchiveAll({ manual: true }))
  );
  const advanced = containerEl.createEl("details", { cls: "fdtb-claudian-advanced-settings" });
  advanced.createEl("summary", { text: "\u9AD8\u7EA7\u8BBE\u7F6E\uFF08\u53EF\u9009\uFF09" });
  const body = advanced.createDiv({ cls: "fdtb-claudian-advanced-settings-body" });
  const s = runner.settings;
  new import_obsidian3.Setting(body).setName("\u81EA\u52A8\u5F52\u6863\u672C\u673A\u4F1A\u8BDD").setDesc("\u5B9A\u65F6\u626B\u63CF .claudian/sessions \u5E76\u66F4\u65B0\u8F7B\u91CF\u5B58\u6863").addToggle(
    (toggle) => toggle.setValue(s.autoArchive).onChange(async (value) => {
      await runner.updateSettings({ autoArchive: value });
      onRefresh();
    })
  );
  new import_obsidian3.Setting(body).setName("\u81EA\u52A8\u5F52\u6863\u95F4\u9694\uFF08\u5206\u949F\uFF09").addText(
    (text) => text.setPlaceholder("10").setValue(String(s.autoArchiveIntervalMinutes)).onChange(async (value) => {
      await runner.updateSettings({ autoArchiveIntervalMinutes: Number(value) || 10 });
    })
  );
  new import_obsidian3.Setting(body).setName("\u663E\u793A\u8DE8\u8BBE\u5907 badge").addToggle(
    (toggle) => toggle.setValue(s.showCrossDeviceBadge).onChange(async (value) => {
      await runner.updateSettings({ showCrossDeviceBadge: value });
      onRefresh();
    })
  );
  new import_obsidian3.Setting(body).setName("\u5355\u6761\u6D88\u606F\u4E0A\u9650\uFF08\u5B57\u8282\uFF09").addText(
    (text) => text.setValue(String(s.maxMessageBytes)).onChange(async (value) => {
      await runner.updateSettings({ maxMessageBytes: Number(value) || 51200 });
    })
  );
  new import_obsidian3.Setting(body).setName("\u5355\u4F1A\u8BDD\u5B58\u6863\u4E0A\u9650\uFF08\u5B57\u8282\uFF09").addText(
    (text) => text.setValue(String(s.maxArchiveBytes)).onChange(async (value) => {
      await runner.updateSettings({ maxArchiveBytes: Number(value) || 1048576 });
    })
  );
  new import_obsidian3.Setting(body).setName("\u672C\u673A\u8BBE\u5907\u6807\u8BC6").setDesc("\u7559\u7A7A\u5219\u4F7F\u7528\u7CFB\u7EDF\u4E3B\u673A\u540D").addText(
    (text) => text.setValue(s.deviceId).onChange(async (value) => {
      await runner.updateSettings({ deviceId: value.trim() });
    })
  );
  new import_obsidian3.Setting(body).setName("\u6E05\u7406\u8D85\u9650\u5B58\u6863").addButton(
    (button) => button.setButtonText("\u6E05\u7406").onClick(async () => {
      const result = await runner.cleanupOversizedArchives();
      new import_obsidian3.Notice(`\u6E05\u7406\u5B8C\u6210\uFF1A\u5220\u9664 ${result.removed}\uFF0C\u88C1\u526A ${result.trimmed}`);
    })
  );
}
var claudianChatArchiveModule = {
  id: "claudian-chat-archive",
  displayName: "Claudian \u804A\u5929\u8BB0\u5F55\u540C\u6B65",
  description: "\u5C06 Claudian/Codex \u4F1A\u8BDD\u63D0\u53D6\u4E3A\u8F7B\u91CF JSON \u5B58\u5165 vault\uFF0C\u7ECF iCloud \u8DE8\u8BBE\u5907\u53EA\u8BFB\u67E5\u770B\uFF1B\u4E0D\u4FEE\u6539 Claudian \u6807\u9898\u4E0E\u4F1A\u8BDD\u76EE\u5F55",
  defaultEnabled: false,
  load: async (host) => {
    const runner = new ClaudianChatArchiveRunner(host);
    await runner.start();
    activeClaudianRunner = runner;
    host.__claudianRunner = runner;
    const plugin = host.component;
    plugin.claudianArchiveRunner = runner;
  },
  unload: async (host) => {
    activeClaudianRunner = null;
    const plugin = host.component;
    if (plugin.claudianArchiveRunner) {
      await plugin.claudianArchiveRunner.stop();
      plugin.claudianArchiveRunner = null;
    }
  }
};

// src/modules/block-link-plus-bridge.ts
var import_obsidian4 = require("obsidian");
function renderTableBlockIdBridgeSettings(containerEl, plugin, onRefresh) {
  const placement = plugin.settings.tableBlockIdPlacement ?? "inline";
  new import_obsidian4.Setting(containerEl).setName("\u8868\u683C\u590D\u5236\u94FE\u63A5\uFF1A\u5757 ID \u5199\u5165\u4F4D\u7F6E").setDesc("\u672B\u884C\u5185\u8054\uFF1A^id \u5199\u5728\u8868\u683C\u6700\u540E\u4E00\u884C\u672B\u5C3E\uFF0C\u4E0D\u4EA7\u751F\u8868\u540E\u7A7A\u884C\uFF1B\u8868\u540E\u72EC\u5360\u884C\uFF1A\u65E7\u7248 shouldInsertAfter \u884C\u4E3A").addDropdown((dropdown) => {
    dropdown.addOption("inline", "\u672B\u884C\u5185\u8054\uFF08\u63A8\u8350\uFF09");
    dropdown.addOption("after", "\u8868\u540E\u72EC\u5360\u884C\uFF08\u65E7\u884C\u4E3A\uFF09");
    dropdown.setValue(placement === "after" ? "after" : "inline").onChange(async (value) => {
      plugin.settings.tableBlockIdPlacement = value === "after" ? "after" : "inline";
      await plugin.saveSettings();
      onRefresh();
    });
  });
  new import_obsidian4.Setting(containerEl).setName("\u9884\u89C8\u4E2D\u9690\u85CF\u5355\u72EC\u4E00\u884C\u7684 ^\u5757ID").setDesc("\u9605\u8BFB/Live Preview \u9690\u85CF\u4EC5\u542B ^\u5757ID \u7684\u72EC\u5360\u884C\uFF1B\u6E90\u7801\u8C03\u8BD5\u53EF\u5173\u95ED").addToggle(
    (toggle) => toggle.setValue(plugin.settings.hideStandaloneBlockIdLines !== false).onChange(async (value) => {
      plugin.settings.hideStandaloneBlockIdLines = value;
      await plugin.saveSettings();
      onRefresh();
    })
  );
}
function getBlockLinkPlus(app) {
  const plugin = app.plugins.plugins["block-link-plus"];
  if (!plugin?.settings || typeof plugin.saveSettings !== "function") return null;
  return plugin;
}
function renderBlockLinkPlusSettings(containerEl, app, onRefresh) {
  const plugin = getBlockLinkPlus(app);
  if (!plugin) {
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "\u8BF7\u5148\u5728\u4E0A\u65B9\u542F\u7528\u300C\u6307\u5411\u94FE\u63A5\u589E\u5F3A\u300D\uFF08block-link-plus\uFF09\u63D2\u4EF6\u3002"
    });
    return;
  }
  containerEl.createEl("p", {
    cls: "setting-item-description",
    text: "\u6BB5\u843D\u94FE\u63A5\u4F7F\u7528 ^\u5757ID \u8D85\u77ED\u951A\u70B9\uFF1B\u6587\u4EF6\u5939\u94FE\u63A5\u4F7F\u7528 blp-folder://open?id= \u8D85\u77ED URI\uFF08\u226450 \u5B57\u7B26\uFF09\u3002"
  });
  if (plugin.api?.renderFolderLinkSettings) {
    plugin.api.renderFolderLinkSettings(containerEl, onRefresh);
    return;
  }
  new import_obsidian4.Setting(containerEl).setName("\u590D\u5236\u6BB5\u843D\u94FE\u63A5").addToggle(
    (toggle) => toggle.setValue(plugin.settings.enable_right_click_block !== false).onChange(async (value) => {
      plugin.settings.enable_right_click_block = value;
      await plugin.saveSettings();
      onRefresh();
    })
  );
  new import_obsidian4.Setting(containerEl).setName("\u8868\u683C\u53F3\u952E\u6CE8\u5165\u6BB5\u843D\u94FE\u63A5").setDesc("\u5728\u8868\u683C\u4E13\u7528\u53F3\u952E\u83DC\u5355\u5E95\u90E8\u8FFD\u52A0\u300C\u590D\u5236\u6BB5\u843D\u94FE\u63A5\u300D\u7B49\u9879").addToggle(
    (toggle) => toggle.setValue(plugin.settings.injectBlockLinkInTableMenus !== false).onChange(async (value) => {
      plugin.settings.injectBlockLinkInTableMenus = value;
      await plugin.saveSettings();
      onRefresh();
    })
  );
  new import_obsidian4.Setting(containerEl).setName("\u6587\u4EF6\u6811\u9AD8\u4EAE\u65F6\u957F\uFF08\u79D2\uFF09").addSlider(
    (slider) => slider.setLimits(3, 30, 1).setValue(Math.round((plugin.settings.folderRevealHighlightMs ?? 1e4) / 1e3)).setDynamicTooltip().onChange(async (seconds) => {
      plugin.settings.folderRevealHighlightMs = Math.max(3e3, Math.min(3e4, seconds * 1e3));
      await plugin.saveSettings();
      onRefresh();
    })
  );
  new import_obsidian4.Setting(containerEl).setName("\u518D\u6B21\u663E\u793A\u6587\u4EF6\u5939\u94FE\u63A5\u8BF4\u660E").addButton(
    (btn) => btn.setButtonText("\u91CD\u65B0\u663E\u793A\u8BF4\u660E").onClick(async () => {
      plugin.settings.folderLinkIntroDismissed = false;
      await plugin.saveSettings();
      new import_obsidian4.Notice("\u4E0B\u6B21\u590D\u5236\u6216\u6253\u5F00\u6587\u4EF6\u5939\u94FE\u63A5\u65F6\u5C06\u518D\u6B21\u663E\u793A\u8BF4\u660E");
      onRefresh();
    })
  );
  renderTableBlockIdBridgeSettings(containerEl, plugin, onRefresh);
}

// src/main.ts
var EMBEDDED_MODULES = [
  fileAutoLocalizerModule,
  globalWidePageModule,
  rightClickCopyAsImageModule,
  claudianChatArchiveModule
];
var EMBEDDED_MODULE_SETTINGS_RENDERERS = {
  "file-auto-localizer": (containerEl) => renderFileAutoLocalizerSettings(containerEl),
  "claudian-chat-archive": (containerEl, onRefresh) => renderClaudianChatArchiveSettings(containerEl, onRefresh)
};
var EXTERNAL_MODULE_SETTINGS_RENDERER_FACTORIES = {
  "block-link-plus": (app) => (containerEl, onRefresh) => renderBlockLinkPlusSettings(containerEl, app, onRefresh)
};
var HANDLE_SIZE = 28;
var HANDLE_OFFSET = 42;
var COMPACT_HANDLE_SIZE = 22;
var DRAGGER_HANDLE_SELECTOR = ".dnd-drag-handle[data-block-start]";
var HOVER_HIDE_DELAY_MS = 180;
var EXPORT_PIXEL_RATIO2 = 2;
var EXPORT_PADDING2 = 24;
var EXPORT_STAGING_OFFSET2 = -2e4;
var STYLE_MARKER_RE = /^\s*%%\s*fdtb-style:(\{.*\})\s*%%\s*$/;
var BETA_ONLY_MODULE_IDS = /* @__PURE__ */ new Set(["claudian-chat-archive"]);
var OWN_MODULE_DESCRIPTORS = [
  {
    moduleId: "file-auto-localizer",
    displayName: "\u6587\u4EF6\u81EA\u52A8\u672C\u5730\u5316",
    externalPluginId: "image-localizer",
    description: "\u539F OneNote \u672C\u5730\u5316\u63D2\u4EF6\uFF1A\u81EA\u52A8\u628A\u7B14\u8BB0\u4E2D\u7684\u8FDC\u7A0B\u56FE\u7247\u3001OneDrive/OneNote \u94FE\u63A5\u8F6C\u6362\u4E3A\u672C\u5730\u6587\u4EF6\u4E0E\u53EF\u6253\u5F00\u94FE\u63A5",
    status: "merged"
  },
  {
    moduleId: "global-wide-page",
    displayName: "\u5168\u5C40\u5BBD\u9875\u9762",
    externalPluginId: "global-wide-page",
    description: "\u9ED8\u8BA4\u8BA9\u6240\u6709 Markdown \u9875\u9762\u4EE5\u5BBD\u9875\u9762\u663E\u793A\uFF0C\u5E76\u5728\u72B6\u6001\u680F\u63D0\u4F9B\u4E00\u952E\u5207\u6362",
    status: "merged"
  },
  {
    moduleId: "right-click-copy-as-image",
    displayName: "\u53F3\u952E\u590D\u5236\u6210\u56FE",
    externalPluginId: "canvas-copy-as-image",
    description: "\u53F3\u952E\u5361\u7247/\u8868\u683C/\u9009\u533A/\u6574\u9875\u590D\u5236\u4E3A PNG \u56FE\u7247",
    status: "merged"
  },
  {
    moduleId: "claudian-chat-archive",
    displayName: "Claudian \u804A\u5929\u8BB0\u5F55\u540C\u6B65",
    externalPluginId: "claudian",
    description: "\u8F7B\u91CF\u5B58\u6863 Claudian \u4F1A\u8BDD\u5230 vault\uFF0C\u7ECF iCloud \u8DE8\u8BBE\u5907\u53EA\u8BFB\u67E5\u770B\u3002\u9700\u4FDD\u6301 Claudian \u63D2\u4EF6\u542F\u7528\uFF1B\u4E0D\u66FF\u4EE3 Claudian\uFF0C\u4E0D\u4FEE\u6539\u5176\u6807\u9898",
    status: "merged"
  },
  {
    moduleId: "block-link-plus",
    displayName: "\u6307\u5411\u94FE\u63A5\u589E\u5F3A",
    externalPluginId: "block-link-plus",
    description: "\u6BB5\u843D\u94FE\u63A5\u4E0E\u6587\u4EF6\u5939\u94FE\u63A5\u5747\u751F\u6210\u8D85\u77ED\u94FE\u63A5\uFF08^\u5757ID / blp-folder://open?id=\uFF09\uFF1B\u70B9\u51FB\u6587\u4EF6\u5939\u94FE\u63A5\u53EF\u5728\u6587\u4EF6\u6811\u5B9A\u4F4D\u5E76\u81EA\u5B9A\u4E49\u9AD8\u4EAE\u65F6\u957F",
    status: "external"
  }
];
var EXPERIENCE_SETTINGS_TABS = [
  { id: "toolbar", label: "\u6587\u5B57\u5DE5\u5177\u680F" },
  { id: "nativeTable", label: "\u539F\u751F\u8868\u683C\u589E\u5F3A" },
  { id: "templateLibrary", label: "\u6A21\u677F\u5E93\u7BA1\u7406" },
  { id: "modules", label: "\u81EA\u7814\u529F\u80FD\u5F00\u5173" },
  { id: "plugins", label: "\u7B2C\u4E09\u65B9\u63D2\u4EF6\u7BA1\u7406" }
];
var HOSTED_PLUGIN_DESCRIPTIONS = {
  "feishu-doc-toolbar": "\u7EDF\u4E00\u5165\u53E3\u5C42\uFF1AT \u5DE5\u5177\u680F\u3001\u6A21\u677F\u5165\u53E3\u3001\u603B\u8BBE\u7F6E\u9875",
  "markdown-table-enhancer": "\u539F\u751F\u8868\u683C\u989C\u8272/\u957F\u5BBD\u9AD8\u3001\u6A21\u677F\u5E93",
  dragger: "\u5757\u62D6\u52A8\u80FD\u529B\uFF0C\u5F53\u524D\u53EA\u6258\u7BA1\u72B6\u6001\uFF0C\u4E0D\u81EA\u52A8\u542F\u505C",
  "canvas-copy-as-image": "\u53F3\u952E\u590D\u5236\u5361\u7247\u3001\u8868\u683C\u3001\u9009\u533A\u6216\u9875\u9762\u6210\u56FE",
  "global-wide-page": "\u5168\u5C40\u5BBD\u9875\u9762\u548C\u4E00\u952E\u5207\u6362",
  "image-localizer": "\u6587\u4EF6\u81EA\u52A8\u672C\u5730\u5316\uFF1A\u8FDC\u7A0B\u56FE\u7247\u843D\u5730 + OneNote/OneDrive \u94FE\u63A5\u8F6C\u6362",
  "obsidian-html-plugin": "HTML Reader",
  univer: "\u8868\u683C\u5DE5\u5177",
  "obsidian-excel-to-markdown-table": "Excel \u8F6C Markdown \u8868\u683C",
  "block-link-plus": "\u6307\u5411\u94FE\u63A5\u589E\u5F3A",
  "obsidian-style-settings": "\u7B2C\u4E09\u65B9\u6837\u5F0F\u8BBE\u7F6E",
  "recent-files-obsidian": "\u6700\u8FD1\u6587\u4EF6",
  tasknotes: "\u4EFB\u52A1\u7B14\u8BB0",
  "settings-search": "\u8BBE\u7F6E\u641C\u7D22",
  claudian: "Claudian"
};
var MANAGED_PLUGIN_FALLBACK_CATEGORY_ID = "other";
var DEFAULT_MANAGED_PLUGIN_CATEGORIES = [
  { id: "table", name: "\u8868\u683C\u5DE5\u5177" },
  { id: "block", name: "\u5757\u4F53\u9A8C" },
  { id: "automation", name: "\u81EA\u52A8\u5316 / \u4EFB\u52A1" },
  { id: "content", name: "\u5185\u5BB9 / \u9605\u8BFB" },
  { id: "style", name: "\u6837\u5F0F / \u9875\u9762" },
  { id: "file", name: "\u6587\u4EF6 / \u56FE\u7247" },
  { id: "ai", name: "AI / \u5BF9\u8BDD" },
  { id: MANAGED_PLUGIN_FALLBACK_CATEGORY_ID, name: "\u5176\u4ED6\u63D2\u4EF6" }
];
var NATIVE_COLOR_FIELD_LABELS = [
  { key: "header", label: "\u8868\u5934\u5E95\u8272" },
  { key: "headerText", label: "\u8868\u5934\u6587\u5B57" },
  { key: "baseRow", label: "\u6B63\u6587\u5E95\u8272" },
  { key: "altRow", label: "\u4EA4\u66FF\u884C\u5E95\u8272" },
  { key: "border", label: "\u8FB9\u6846\u989C\u8272" }
];
var ONENOTE_COLOR_SWATCHES = [
  "#FFFFFF",
  "#000000",
  "#E7E6E6",
  "#44546A",
  "#5B9BD5",
  "#ED7D31",
  "#A5A5A5",
  "#FFC000",
  "#4472C4",
  "#70AD47",
  "#F2F2F2",
  "#7F7F7F",
  "#D9EAF7",
  "#DDEBF7",
  "#FCE4D6",
  "#EDEDED",
  "#FFF2CC",
  "#D9E2F3",
  "#E2F0D9",
  "#EADCF8",
  "#D9D9D9",
  "#595959",
  "#BDD7EE",
  "#B4C6E7",
  "#F8CBAD",
  "#DBDBDB",
  "#FFE699",
  "#B4C6E7",
  "#C6E0B4",
  "#D9C2E9",
  "#BFBFBF",
  "#404040",
  "#9DC3E6",
  "#8EAADB",
  "#F4B183",
  "#C9C9C9",
  "#FFD966",
  "#8EA9DB",
  "#A9D18E",
  "#B4A7D6",
  "#A6A6A6",
  "#262626",
  "#5B9BD5",
  "#2F75B5",
  "#C65911",
  "#A5A5A5",
  "#BF9000",
  "#305496",
  "#548235",
  "#7030A0",
  "#FF0000",
  "#FFC000",
  "#FFFF00",
  "#92D050",
  "#00B050",
  "#00B0F0",
  "#0070C0",
  "#002060",
  "#7030A0",
  "#990000"
];
var ONENOTE_NATIVE_TABLE_SCHEMES = [
  {
    label: "\u6D45\u84DD\u6E05\u5355",
    palette: { header: "#9CC2E5", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#EAF3FF", border: "#9FBAD8" }
  },
  {
    label: "\u6D45\u7EFF\u590D\u76D8",
    palette: { header: "#A9D18E", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#E2F0D9", border: "#9EAD93" }
  },
  {
    label: "\u9EC4\u7EFF\u6B65\u9AA4",
    palette: { header: "#C6E0B4", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#E2F0D9", border: "#A9B7A0" }
  },
  {
    label: "\u7070\u84DD\u8D44\u6599",
    palette: { header: "#B4C6E7", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#D9EAF7", border: "#9AAAC6" }
  },
  {
    label: "\u6D45\u9EC4\u91CD\u70B9",
    palette: { header: "#FFD966", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#FFF2CC", border: "#C9B05A" }
  },
  {
    label: "\u6D45\u6A59\u95EE\u9898",
    palette: { header: "#F4B183", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#FCE4D6", border: "#C99A78" }
  },
  {
    label: "\u6D45\u7D2B\u5206\u7C7B",
    palette: { header: "#B4A7D6", headerText: "#111111", baseRow: "#FFFFFF", altRow: "#EADCF8", border: "#9C91B8" }
  },
  {
    label: "\u6DF1\u84DD\u767D\u5B57",
    palette: { header: "#2F5F9F", headerText: "#FFFFFF", baseRow: "#FFFFFF", altRow: "#EAF3FF", border: "#9FBAD8" }
  }
];
var COLOR_PRESETS = [
  { action: "colorYellow", label: "\u6D45\u9EC4", color: "#fff3bf" },
  { action: "colorBlue", label: "\u6D45\u84DD", color: "#d0ebff" },
  { action: "colorGreen", label: "\u6D45\u7EFF", color: "#d3f9d8" },
  { action: "colorRed", label: "\u6D45\u7EA2", color: "#ffe3e3" },
  { action: "colorPurple", label: "\u6D45\u7D2B", color: "#e5dbff" },
  { action: "colorGray", label: "\u6D45\u7070", color: "#f1f3f5" }
];
var EXPERIMENTAL_STYLE_GROUPS = [];
var COLOR_ACTION_TO_VALUE = {
  colorYellow: "yellow",
  colorBlue: "blue",
  colorGreen: "green",
  colorRed: "red",
  colorPurple: "purple",
  colorGray: "gray"
};
var EXPERIMENTAL_STYLE_ACTIONS = /* @__PURE__ */ new Set([
  ...EXPERIMENTAL_STYLE_GROUPS.flatMap((group) => group.items.map((item) => item.action))
]);
var TEMPLATE_FOLDER_DEFAULT = ".templates";
var LEGACY_TEMPLATE_FOLDER = "\u6A21\u677F\u5E93";
var TEMPLATE_INDEX_BASENAME = "templates-index.md";
var TEMPLATE_INDEX_NOTE = `${TEMPLATE_FOLDER_DEFAULT}/${TEMPLATE_INDEX_BASENAME}`;
var TEMPLATE_MENU_LIMIT = 8;
var TEMPLATE_FRONTMATTER_ORDER_RE = /^menuOrder:\s*(\d+)\s*$/m;
var TEMPLATE_SYSTEM_LINE_RE = /^\s*%%\s*mdtp(?:-template)?\s*:/i;
var TABLE_PICKER_ROWS = 8;
var TABLE_PICKER_COLS = 8;
var MARKDOWN_TABLE_PLUGIN_ID = "markdown-table-enhancer";
var ENHANCED_TABLE_COMMANDS = {
  insertNativeColorTemplate: `${MARKDOWN_TABLE_PLUGIN_ID}:insert-native-color-table-template`,
  insertTemplate: `${MARKDOWN_TABLE_PLUGIN_ID}:insert-enhanced-table-template`,
  initializeCurrent: `${MARKDOWN_TABLE_PLUGIN_ID}:initialize-current-table-enhancement`,
  initializeBatch: `${MARKDOWN_TABLE_PLUGIN_ID}:initialize-current-file-table-anchors`,
  initializeNativeLayout: `${MARKDOWN_TABLE_PLUGIN_ID}:initialize-current-table-native-layout`,
  setNativeRowColor: `${MARKDOWN_TABLE_PLUGIN_ID}:set-current-native-table-row-color`,
  openNativeRowBands: `${MARKDOWN_TABLE_PLUGIN_ID}:open-current-native-table-row-bands`,
  pasteOneNoteRichTable: `${MARKDOWN_TABLE_PLUGIN_ID}:paste-onenote-rich-table`,
  toggleExperimental: `${MARKDOWN_TABLE_PLUGIN_ID}:toggle-experimental-table-features`,
  showStatus: `${MARKDOWN_TABLE_PLUGIN_ID}:show-current-file-table-enhancement-status`,
  restoreSnapshot: `${MARKDOWN_TABLE_PLUGIN_ID}:restore-last-table-enhancement-snapshot`
};
var DEFAULT_SETTINGS_TAB_ORDER = [
  "toolbar",
  "nativeTable",
  "templateLibrary",
  "modules",
  "plugins"
];
var DEFAULT_DATA = {
  version: 1,
  templateFolderPath: TEMPLATE_FOLDER_DEFAULT,
  templateUngroupedLabel: "\u672A\u5206\u7EC4",
  recentTemplatePaths: [],
  toolbarActionOrder: [],
  managedPluginAliases: {},
  managedPluginNotes: {},
  managedPluginCategories: {},
  managedPluginCategoryNames: {},
  managedPluginCategoryOrder: [],
  managedPluginStatusCheckedAt: 0,
  enableBetaFeatures: false,
  showOneNoteImport: false,
  showTableEnhancerEntrances: false,
  showDraggerIntegrationStatus: true,
  embeddedModules: {},
  settingsTabOrder: [...DEFAULT_SETTINGS_TAB_ORDER],
  managedPluginCategoryRemoved: []
};
var ACTION_ICONS = {
  italic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>',
  strikethrough: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M16 6c0-1.66-1.79-3-4-3S8 4.34 8 6c0 4 8 2 8 6 0 1.66-1.79 3-4 3s-4-1.34-4-3"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg>',
  bullet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
  numbered: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>',
  todo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
  quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 4-1.5 6-3 8Z"></path><path d="M17 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h2c0 4-1.5 6-3 8Z"></path></svg>',
  divider: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  tableMenu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>',
  templateMenu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
  insertImage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
  insertFile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>',
  highlightText: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 4 4L22 6"></path><path d="M2 20h7"></path><path d="M4 16 14 6l4 4L8 20H4z"></path></svg>',
  calloutNote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  calloutFold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="m8 17 4 4 4-4"></path></svg>',
  insertDate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
  insertLink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
  commandPalette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z"></path></svg>'
};
var ACTION_TITLES = {
  heading1: "\u4E00\u7EA7\u6807\u9898",
  heading2: "\u4E8C\u7EA7\u6807\u9898",
  heading3: "\u4E09\u7EA7\u6807\u9898",
  heading4: "\u56DB\u7EA7\u6807\u9898",
  italic: "\u659C\u4F53",
  strikethrough: "\u5220\u9664\u7EBF",
  bullet: "\u65E0\u5E8F\u5217\u8868",
  numbered: "\u6709\u5E8F\u5217\u8868",
  todo: "\u5F85\u529E",
  code: "\u4EE3\u7801\u5757",
  quote: "\u5F15\u7528",
  divider: "\u5206\u5272\u7EBF",
  tableMenu: "\u63D2\u5165\u8868\u683C",
  templateMenu: "\u6A21\u677F\u5E93",
  insertImage: "\u63D2\u5165\u56FE\u7247",
  insertFile: "\u63D2\u5165\u6587\u4EF6",
  highlightText: "\u9AD8\u4EAE",
  copyMarkdown: "\u590D\u5236\u5185\u5BB9",
  copyImage: "\u5BFC\u51FA\u6210\u56FE",
  calloutNote: "\u9AD8\u4EAE\u5757",
  calloutFold: "\u6298\u53E0\u5757",
  insertDate: "\u63D2\u5165\u65E5\u671F",
  insertLink: "\u63D2\u5165\u94FE\u63A5",
  commandPalette: "\u547D\u4EE4\u9762\u677F"
};
var ACTION_MARKDOWN_HINTS = {
  heading1: "#",
  heading2: "##",
  heading3: "###",
  heading4: "####",
  italic: "*\u659C\u4F53*",
  strikethrough: "~~\u5220\u9664\u7EBF~~",
  bullet: "-",
  numbered: "1.",
  todo: "- [ ]",
  code: "```",
  quote: ">",
  highlightText: "==",
  divider: "---",
  calloutNote: "[!note]",
  calloutFold: "[!note]-",
  insertImage: "![]",
  insertFile: "[]()",
  insertLink: "[]()",
  commandPalette: "\u2318P"
};
function normalizeTemplateFolderPath(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text === LEGACY_TEMPLATE_FOLDER) return TEMPLATE_FOLDER_DEFAULT;
  if (text === ".\u6A21\u677F\u5E93") return TEMPLATE_FOLDER_DEFAULT;
  return (0, import_obsidian5.normalizePath)(text);
}
function normalizeRecentTemplatePath(value) {
  const normalized = (0, import_obsidian5.normalizePath)(value.trim());
  if (normalized.startsWith(`${LEGACY_TEMPLATE_FOLDER}/`)) {
    return (0, import_obsidian5.normalizePath)(`${TEMPLATE_FOLDER_DEFAULT}/${normalized.slice(LEGACY_TEMPLATE_FOLDER.length + 1)}`);
  }
  if (normalized.startsWith(".\u6A21\u677F\u5E93/")) {
    return (0, import_obsidian5.normalizePath)(`${TEMPLATE_FOLDER_DEFAULT}/${normalized.slice(".\u6A21\u677F\u5E93/".length)}`);
  }
  return normalized;
}
function confirmUserAction(message) {
  const confirmFn = (typeof window !== "undefined" ? window.confirm : void 0) ?? (typeof globalThis !== "undefined" ? globalThis.confirm : void 0);
  if (typeof confirmFn !== "function") return true;
  return confirmFn(message);
}
var FeishuDocExperienceSettingTab = class extends import_obsidian5.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    __publicField(this, "activeTab", "toolbar");
    __publicField(this, "activeNativeColorField", "header");
  }
  display() {
    const { containerEl } = this;
    containerEl.empty?.();
    if (!containerEl.empty) {
      containerEl.replaceChildren();
    }
    containerEl.addClass?.("fdtb-settings-page");
    const title = document.createElement("h2");
    title.textContent = "Obsidian\u589E\u5F3A\u4F53\u9A8C";
    containerEl.appendChild(title);
    const desc = document.createElement("p");
    desc.className = "fdtb-settings-page-desc";
    desc.textContent = "\u96C6\u4E2D\u7BA1\u7406\u5DF2\u63A5\u5165\u80FD\u529B\uFF1B\u7B2C\u4E09\u65B9\u63D2\u4EF6\u53EA\u505A\u72B6\u6001\u6258\u7BA1\uFF0C\u4E0D\u81EA\u52A8\u542F\u505C\u3002";
    containerEl.appendChild(desc);
    this.renderSettingsTabs(containerEl);
    if (this.activeTab === "toolbar") {
      this.renderToolbarOrderSection(containerEl);
      return;
    }
    if (this.activeTab === "nativeTable") {
      this.renderTableEnhancerSection(containerEl);
      return;
    }
    if (this.activeTab === "templateLibrary") {
      void this.renderTemplateLibrarySection(containerEl);
      return;
    }
    if (this.activeTab === "modules") {
      this.renderOwnModulesSection(containerEl);
      return;
    }
    this.renderPluginHostSection(containerEl);
    this.renderDraggerSection(containerEl);
  }
  renderOwnModulesSection(containerEl) {
    this.appendSectionTitle(containerEl, "\u81EA\u7814\u529F\u80FD\u5F00\u5173");
    void this.plugin.refreshManagedPluginStatus({ silent: true });
    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent = "\u65E5\u5E38\u53EA\u9700\u7528\u53F3\u4FA7\u5F00\u5173\u542F\u505C\u5404\u529F\u80FD\u3002\u5DF2\u5408\u5E76\u8FDB\u603B\u63D2\u4EF6\u7684\u6A21\u5757\u5C55\u5F00\u300C\u8BE6\u7EC6\u8BBE\u7F6E\u300D\u53EF\u6539\u9AD8\u7EA7\u9009\u9879\u3002\u6A21\u677F\u8BF7\u7528\u300C\u6A21\u677F\u5E93\u7BA1\u7406\u300D\u9875\u7B7E\u3002";
    containerEl.appendChild(intro);
    new import_obsidian5.Setting(containerEl).setName("\u542F\u7528\u6D4B\u8BD5\u529F\u80FD").setDesc(
      "\u5F00\u542F\u540E\u663E\u793A\u589E\u5F3A\u8868\u683C\u3001OneNote \u9AD8\u4FDD\u771F\u7C98\u8D34\u3001Claudian \u804A\u5929\u8BB0\u5F55\u5B58\u6863\u7B49\u5B9E\u9A8C\u80FD\u529B\u3002\u9ED8\u8BA4\u5173\u95ED\uFF0C\u4E0D\u5F71\u54CD\u7A33\u5B9A\u5165\u53E3\u3002"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.isBetaFeaturesEnabled()).onChange(async (value) => {
        await this.plugin.setBetaFeaturesEnabled(value);
        this.display();
      })
    );
    for (const descriptor of OWN_MODULE_DESCRIPTORS) {
      if (BETA_ONLY_MODULE_IDS.has(descriptor.moduleId) && !this.plugin.isBetaFeaturesEnabled()) {
        continue;
      }
      this.appendOwnModuleRow(containerEl, descriptor);
    }
  }
  appendOwnModuleRow(containerEl, descriptor) {
    const externalStatus = this.plugin.getManagedPluginStatus(descriptor.externalPluginId);
    const row = document.createElement("div");
    row.className = "fdtb-plugin-manager-row";
    const main = document.createElement("div");
    main.className = "fdtb-plugin-manager-main";
    const title = document.createElement("div");
    title.className = "fdtb-plugin-manager-title";
    title.textContent = descriptor.displayName;
    const meta = document.createElement("div");
    meta.className = "fdtb-plugin-manager-meta";
    const migrationLabel = descriptor.status === "merged" ? "\u5DF2\u5408\u5E76\u5230\u603B\u63D2\u4EF6" : "\u5916\u90E8\u63D2\u4EF6";
    const externalNote = descriptor.status === "merged" ? externalStatus.installed && externalStatus.enabled ? `\uFF08\u6CE8\u610F\uFF1A\u5916\u90E8\u63D2\u4EF6 ${descriptor.externalPluginId} \u4ECD\u662F\u542F\u7528\u72B6\u6001\uFF0C\u5EFA\u8BAE\u624B\u52A8\u5173\u95ED\u4EE5\u514D\u91CD\u590D\uFF09` : externalStatus.installed ? `\uFF08\u5916\u90E8\u540C\u540D\u63D2\u4EF6\u5DF2\u7981\u7528\uFF0C\u53EF\u653E\u5FC3\u4F7F\u7528\uFF09` : "" : `\uFF08\u539F\u63D2\u4EF6 id\uFF1A${descriptor.externalPluginId}\uFF09`;
    meta.textContent = `${migrationLabel}${externalNote}`;
    const desc = document.createElement("div");
    desc.className = "fdtb-plugin-manager-desc";
    desc.textContent = descriptor.description;
    main.append(title, meta, desc);
    const controls = document.createElement("div");
    controls.className = "fdtb-plugin-manager-controls";
    if (descriptor.status === "merged") {
      const isEnabled = this.plugin.isEmbeddedModuleEnabled(descriptor.moduleId);
      const stateLabel = document.createElement("span");
      stateLabel.className = "fdtb-plugin-manager-meta";
      stateLabel.textContent = isEnabled ? "\u5DF2\u542F\u7528\uFF08\u5185\u5D4C\uFF09" : "\u5DF2\u7981\u7528";
      controls.appendChild(stateLabel);
      const toggleLabel = document.createElement("label");
      toggleLabel.className = "fdtb-plugin-manager-toggle";
      toggleLabel.title = "\u542F\u7528\u6216\u5173\u95ED\u8BE5\u5185\u5D4C\u529F\u80FD\uFF08\u4E0D\u9700\u8981\u5916\u90E8\u63D2\u4EF6\uFF09";
      const toggleInput = document.createElement("input");
      toggleInput.type = "checkbox";
      toggleInput.checked = isEnabled;
      const toggleTrack = document.createElement("span");
      toggleTrack.className = "fdtb-plugin-manager-toggle-track";
      toggleLabel.append(toggleInput, toggleTrack);
      toggleInput.addEventListener("change", async () => {
        const nextEnabled = toggleInput.checked;
        toggleInput.disabled = true;
        try {
          await this.plugin.setEmbeddedModuleEnabled(descriptor.moduleId, nextEnabled);
          this.display();
        } catch (error) {
          toggleInput.checked = isEnabled;
          toggleInput.disabled = false;
          new import_obsidian5.Notice(`\u5F00\u5173\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
        }
      });
      controls.appendChild(toggleLabel);
    } else {
      this.appendManagedPluginToggleControls(controls, descriptor.externalPluginId, descriptor.displayName);
    }
    row.append(main, controls);
    containerEl.appendChild(row);
    const showEmbeddedDetail = descriptor.status === "merged" && this.plugin.isEmbeddedModuleEnabled(descriptor.moduleId) && EMBEDDED_MODULE_SETTINGS_RENDERERS[descriptor.moduleId];
    const externalFactory = descriptor.status === "external" && externalStatus.enabled && EXTERNAL_MODULE_SETTINGS_RENDERER_FACTORIES[descriptor.moduleId];
    if (showEmbeddedDetail || externalFactory) {
      const detail = document.createElement("details");
      detail.className = "fdtb-embedded-module-detail";
      const summary = document.createElement("summary");
      summary.textContent = `${descriptor.displayName} \xB7 \u8BE6\u7EC6\u8BBE\u7F6E`;
      detail.appendChild(summary);
      const inner = document.createElement("div");
      inner.className = "fdtb-embedded-module-detail-body";
      detail.appendChild(inner);
      detail.addEventListener("toggle", () => {
        if (!detail.open) return;
        inner.empty();
        try {
          if (showEmbeddedDetail) {
            EMBEDDED_MODULE_SETTINGS_RENDERERS[descriptor.moduleId](inner, () => this.display());
          } else if (externalFactory) {
            externalFactory(this.app)(inner, () => this.display());
          }
        } catch (error) {
          inner.createEl("p", {
            text: `\u6E32\u67D3\u8BBE\u7F6E\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`,
            cls: "setting-item-description"
          });
        }
      });
      containerEl.appendChild(detail);
    }
  }
  appendManagedPluginToggleControls(controls, pluginId, displayName) {
    const externalStatus = this.plugin.getManagedPluginStatus(pluginId);
    const stateLabel = document.createElement("span");
    stateLabel.className = "fdtb-plugin-manager-meta";
    stateLabel.textContent = !externalStatus.installed ? "\u672A\u5B89\u88C5" : externalStatus.enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u5B89\u88C5\u672A\u542F\u7528";
    controls.appendChild(stateLabel);
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "fdtb-plugin-manager-toggle";
    toggleLabel.setAttribute(
      "aria-label",
      `${displayName} ${externalStatus.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}`
    );
    toggleLabel.title = externalStatus.installed ? "\u542F\u7528\u6216\u5173\u95ED\u63D2\u4EF6\uFF08\u4E0E Obsidian \u7B2C\u4E09\u65B9\u63D2\u4EF6\u5217\u8868\u5171\u7528\u540C\u4E00\u5F00\u5173\uFF09" : "\u63D2\u4EF6\u672A\u5B89\u88C5\uFF0C\u65E0\u6CD5\u5207\u6362";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = externalStatus.enabled;
    toggleInput.disabled = !externalStatus.installed;
    const toggleTrack = document.createElement("span");
    toggleTrack.className = "fdtb-plugin-manager-toggle-track";
    toggleLabel.append(toggleInput, toggleTrack);
    toggleInput.addEventListener("change", async () => {
      const nextEnabled = toggleInput.checked;
      toggleInput.disabled = true;
      try {
        const changed = await this.plugin.setManagedPluginEnabled(pluginId, nextEnabled);
        if (!changed) toggleInput.checked = externalStatus.enabled;
        this.display();
      } catch (error) {
        toggleInput.checked = externalStatus.enabled;
        toggleInput.disabled = !externalStatus.installed;
        new import_obsidian5.Notice(`\u5F00\u5173\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
      }
    });
    controls.appendChild(toggleLabel);
  }
  appendManagedPluginToggleRow(containerEl, options) {
    const row = document.createElement("div");
    row.className = "fdtb-plugin-manager-row";
    const main = document.createElement("div");
    main.className = "fdtb-plugin-manager-main";
    const title = document.createElement("div");
    title.className = "fdtb-plugin-manager-title";
    title.textContent = options.displayName;
    if (options.meta) {
      const meta = document.createElement("div");
      meta.className = "fdtb-plugin-manager-meta";
      meta.textContent = options.meta;
      main.appendChild(meta);
    }
    const desc = document.createElement("div");
    desc.className = "fdtb-plugin-manager-desc";
    desc.textContent = options.description;
    main.append(title, desc);
    const controls = document.createElement("div");
    controls.className = "fdtb-plugin-manager-controls";
    this.appendManagedPluginToggleControls(controls, options.pluginId, options.displayName);
    row.append(main, controls);
    containerEl.appendChild(row);
  }
  renderSettingsTabs(containerEl) {
    const wrap = document.createElement("div");
    wrap.className = "fdtb-settings-tabs-wrap";
    const tabs = document.createElement("div");
    tabs.className = "fdtb-settings-tabs";
    const orderedTabs = this.plugin.getOrderedSettingsTabs();
    let draggingTabId = null;
    let longPressTimer = null;
    const clearLongPressTimer = () => {
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    for (const tab of orderedTabs) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-settings-tab";
      button.textContent = tab.label;
      button.dataset.tabId = tab.id;
      button.draggable = true;
      button.toggleClass?.("is-active", this.activeTab === tab.id);
      if (!button.toggleClass && this.activeTab === tab.id) {
        button.classList.add("is-active");
      }
      button.addEventListener("click", () => {
        if (button.classList.contains("is-dragging")) return;
        this.activeTab = tab.id;
        this.display();
      });
      button.addEventListener("pointerdown", () => {
        clearLongPressTimer();
        longPressTimer = window.setTimeout(() => {
          button.classList.add("is-long-press-ready");
        }, 240);
      });
      button.addEventListener("pointerup", clearLongPressTimer);
      button.addEventListener("pointerleave", () => {
        clearLongPressTimer();
        button.classList.remove("is-long-press-ready");
      });
      button.addEventListener("dragstart", (event) => {
        draggingTabId = tab.id;
        button.classList.add("is-dragging");
        event.dataTransfer?.setData("text/fdtb-settings-tab", tab.id);
        event.dataTransfer?.setData("text/plain", tab.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      button.addEventListener("dragend", () => {
        draggingTabId = null;
        button.classList.remove("is-dragging", "is-long-press-ready");
        tabs.querySelectorAll(".is-drag-over").forEach((el) => el.classList.remove("is-drag-over"));
      });
      button.addEventListener("dragover", (event) => {
        if (!draggingTabId || draggingTabId === tab.id) return;
        event.preventDefault();
        button.classList.add("is-drag-over");
      });
      button.addEventListener("dragleave", () => {
        button.classList.remove("is-drag-over");
      });
      button.addEventListener("drop", async (event) => {
        event.preventDefault();
        button.classList.remove("is-drag-over");
        const sourceId = event.dataTransfer?.getData("text/fdtb-settings-tab") || event.dataTransfer?.getData("text/plain") || draggingTabId;
        if (!sourceId || sourceId === tab.id) return;
        const moved = await this.plugin.moveSettingsTab(sourceId, tab.id);
        if (moved) this.display();
      });
      tabs.appendChild(button);
    }
    const hint = document.createElement("p");
    hint.className = "fdtb-settings-tabs-sort-hint";
    hint.textContent = "\u957F\u6309\u62D6\u52A8\u53EF\u6392\u5E8F\u9876\u90E8\u5BFC\u822A\u680F\u3002";
    wrap.append(tabs, hint);
    containerEl.appendChild(wrap);
  }
  renderToolbarOrderSection(containerEl) {
    this.appendSectionTitle(containerEl, "T \u5DE5\u5177\u680F\u9884\u89C8\u4E0E\u6392\u5E8F");
    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent = "\u4E0B\u65B9\u662F\u7F16\u8F91\u65F6\u70B9\u51FB T \u6309\u94AE\u5F39\u51FA\u7684\u5BFC\u822A\u680F\u9884\u89C8\u3002\u62D6\u52A8\u6309\u94AE\u53EF\u8C03\u6574\u987A\u5E8F\uFF0C\u4FDD\u5B58\u540E\u7ACB\u5373\u4F5C\u7528\u4E8E\u6B63\u6587\u4E2D\u7684 T \u5DE5\u5177\u680F\uFF1B\u53EA\u6539\u663E\u793A\u987A\u5E8F\uFF0C\u4E0D\u6539\u6309\u94AE\u529F\u80FD\u3002";
    containerEl.appendChild(intro);
    const workbench = document.createElement("div");
    workbench.className = "fdtb-settings-toolbar-workbench";
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "fdtb-handle fdtb-settings-toolbar-handle-demo";
    handle.disabled = true;
    handle.setAttribute("aria-hidden", "true");
    const handleText = document.createElement("span");
    handleText.className = "fdtb-handle-text";
    handleText.textContent = "T";
    handle.appendChild(handleText);
    const preview = this.plugin.buildSettingsToolbarPreview(() => {
      this.display();
    });
    workbench.append(handle, preview);
    containerEl.appendChild(workbench);
    const hint = document.createElement("p");
    hint.className = "fdtb-settings-toolbar-sort-hint";
    hint.textContent = "\u63D0\u793A\uFF1A\u53EA\u80FD\u5728\u540C\u4E00\u5206\u7EC4\u5185\u62D6\u52A8\uFF08\u300C\u6392\u7248\u300D\u5185\u4E92\u6362\u3001\u300C\u63D2\u5165\u5185\u5BB9\u300D\u5185\u4E92\u6362\uFF09\uFF0C\u4E0D\u80FD\u8DE8\u7EC4\u79FB\u52A8\u3002";
    containerEl.appendChild(hint);
    new import_obsidian5.Setting(containerEl).setName("\u6062\u590D\u9ED8\u8BA4\u987A\u5E8F").setDesc("\u53EA\u91CD\u7F6E T \u5DE5\u5177\u680F\u6309\u94AE\u4F4D\u7F6E\uFF0C\u4E0D\u5F71\u54CD\u6A21\u677F\u3001\u8868\u683C\u3001Dragger \u7B49\u529F\u80FD").addButton(
      (button) => button.setButtonText("\u91CD\u7F6E").onClick(async () => {
        await this.plugin.resetToolbarActionOrder({ keepPopover: false });
        this.display();
      })
    );
  }
  async renderTemplateLibrarySection(containerEl) {
    this.appendSectionTitle(containerEl, "\u6A21\u677F\u5E93\u7BA1\u7406");
    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent = "\u6A21\u677F\u7EDF\u4E00\u4FDD\u5B58\u5728\u9690\u85CF\u76EE\u5F55 .templates/\uFF0C\u53EF\u6309\u5B50\u6587\u4EF6\u5939\u5206\u7EC4\u3002\u4E0B\u65B9\u5217\u8868\u4E0E T \u5DE5\u5177\u680F\u300C\u6A21\u677F\u5E93\u300D\u6309\u94AE\u8054\u52A8\uFF0C\u6539\u5206\u7EC4\u540E\u4F1A\u540C\u6B65\u66F4\u65B0\u3002";
    containerEl.appendChild(intro);
    new import_obsidian5.Setting(containerEl).setName("\u6A21\u677F\u76EE\u5F55").setDesc("\u9ED8\u8BA4 .templates\uFF1B\u7559\u7A7A\u4E5F\u4F1A\u56DE\u9000\u5230\u8BE5\u76EE\u5F55").addText(
      (text) => text.setPlaceholder(TEMPLATE_FOLDER_DEFAULT).setValue(this.plugin.getTemplateFolderPath()).onChange(async (value) => {
        await this.plugin.updateTemplateFolderPath(value);
      })
    );
    this.appendInlineForm(containerEl, {
      label: "\u65B0\u5EFA\u5206\u7EC4",
      desc: "\u5728\u6A21\u677F\u76EE\u5F55\u4E0B\u521B\u5EFA\u5B50\u6587\u4EF6\u5939\uFF0C\u4F8B\u5982\u300C\u590D\u76D8\u300D\u6216\u300C\u5DE5\u4F5C/\u590D\u76D8\u300D",
      placeholder: "\u5206\u7EC4\u540D\u79F0",
      buttonText: "\u521B\u5EFA",
      onSubmit: async (name) => {
        const ok = await this.plugin.createTemplateSubfolder(name);
        if (ok) this.display();
      }
    });
    this.appendInlineForm(containerEl, {
      label: "\u65B0\u5EFA\u7A7A\u6A21\u677F",
      desc: "\u540D\u79F0\u53EF\u7528\u300C\u5206\u7EC4/\u6A21\u677F\u540D\u300D\u76F4\u63A5\u4FDD\u5B58\u5230\u5B50\u6587\u4EF6\u5939",
      placeholder: "\u6A21\u677F\u540D\u79F0\uFF0C\u5982\uFF1A\u590D\u76D8/\u4E8B\u4EF6",
      buttonText: "\u521B\u5EFA",
      onSubmit: async (name) => {
        const ok = await this.plugin.createBlankTemplate(name);
        if (ok) this.display();
      }
    });
    const listHost = document.createElement("div");
    listHost.className = "fdtb-template-settings-list-host";
    containerEl.appendChild(listHost);
    const tree = await this.plugin.buildFullTemplateTree();
    const groupOptions = await this.plugin.getTemplateGroupMoveOptions();
    const hasTemplates = tree.templates.length > 0;
    const hasFolders = tree.folders.size > 0;
    if (!hasTemplates && !hasFolders) {
      listHost.createEl("p", {
        cls: "setting-item-description",
        text: "\u8FD8\u6CA1\u6709\u6A21\u677F\u6216\u5206\u7EC4\u3002\u53EF\u5148\u300C\u65B0\u5EFA\u5206\u7EC4\u300D\uFF0C\u518D\u300C\u65B0\u5EFA\u6A21\u677F\u300D\u6216\u4ECE T \u5DE5\u5177\u680F\u4FDD\u5B58\u5F53\u524D\u5757\u3002"
      });
      return;
    }
    const list = document.createElement("div");
    list.className = "fdtb-template-settings-tree";
    this.renderTemplateUngroupedSection(list, tree, groupOptions);
    const folders = Array.from(tree.folders.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"));
    for (const [folderName, child] of folders) {
      this.renderTemplateFolderSection(list, folderName, child, folderName, groupOptions);
    }
    listHost.appendChild(list);
  }
  renderTemplateUngroupedSection(container, root, groupOptions) {
    const group = document.createElement("details");
    group.className = "fdtb-template-settings-folder";
    group.open = true;
    const summary = document.createElement("summary");
    summary.className = "fdtb-template-settings-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "fdtb-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "fdtb-template-folder-title-text";
    titleText.textContent = this.plugin.getTemplateUngroupedLabel();
    titleWrap.appendChild(titleText);
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "fdtb-template-folder-rename-btn";
    renameBtn.textContent = "\u6539\u540D";
    renameBtn.title = "\u4FEE\u6539\u300C\u672A\u5206\u7EC4\u300D\u5728\u754C\u9762\u4E0A\u7684\u663E\u793A\u540D\u79F0\uFF08\u4E0D\u79FB\u52A8\u6587\u4EF6\uFF09";
    renameBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.beginInlineRename(titleText, {
        initial: this.plugin.getTemplateUngroupedLabel(),
        onCommit: async (value) => {
          await this.plugin.setTemplateUngroupedLabel(value);
          this.display();
        }
      });
    });
    titleWrap.append(renameBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "fdtb-template-folder-delete-btn";
    deleteBtn.textContent = "\u5220\u9664";
    deleteBtn.title = "\u65E0\u6A21\u677F\u65F6\u6062\u590D\u9ED8\u8BA4\u540D\u79F0\u300C\u672A\u5206\u7EC4\u300D\uFF1B\u6709\u6A21\u677F\u65F6\u5220\u9664\u6839\u76EE\u5F55\u5168\u90E8\u6A21\u677F";
    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.deleteUngroupedTemplateGroup().then((ok) => {
        if (ok) this.display();
      });
    });
    titleWrap.append(deleteBtn);
    summary.appendChild(titleWrap);
    group.appendChild(summary);
    const body = document.createElement("div");
    body.className = "fdtb-template-settings-folder-body";
    if (root.templates.length === 0) {
      body.createEl("p", {
        cls: "setting-item-description",
        text: "\u6682\u65E0\u6839\u76EE\u5F55\u6A21\u677F\u3002\u53EF\u7528\u4E0B\u65B9\u300C\u79FB\u5230\u5206\u7EC4\u300D\u628A\u6A21\u677F\u8FC1\u5165\u5176\u4ED6\u5206\u7EC4\u3002"
      });
    } else {
      for (const template of this.plugin.sortTemplateDescriptors(root.templates)) {
        body.appendChild(this.createTemplateSettingsRow(template, groupOptions));
      }
    }
    group.appendChild(body);
    container.appendChild(group);
  }
  beginInlineRename(anchor, options) {
    const parent = anchor.parentElement;
    if (!parent) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fdtb-template-folder-rename-input";
    input.value = options.initial;
    anchor.style.display = "none";
    parent.appendChild(input);
    input.focus();
    input.select();
    const finish = async (commit) => {
      input.remove();
      anchor.style.display = "";
      if (!commit) return;
      const next = input.value.trim();
      if (!next || next === options.initial) return;
      await options.onCommit(next);
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void finish(true);
      if (event.key === "Escape") void finish(false);
    });
    input.addEventListener("blur", () => void finish(true));
  }
  renderTemplateFolderSection(container, folderName, node, relativePath, groupOptions) {
    const group = document.createElement("details");
    group.className = "fdtb-template-settings-folder";
    group.open = true;
    const summary = document.createElement("summary");
    summary.className = "fdtb-template-settings-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "fdtb-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "fdtb-template-folder-title-text";
    titleText.textContent = folderName;
    titleWrap.appendChild(titleText);
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "fdtb-template-folder-rename-btn";
    renameBtn.textContent = "\u6539\u540D";
    renameBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.beginInlineRename(titleText, {
        initial: folderName,
        onCommit: async (value) => {
          const ok = await this.plugin.renameTemplateGroup(relativePath, value);
          if (ok) this.display();
        }
      });
    });
    titleWrap.append(renameBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "fdtb-template-folder-delete-btn";
    deleteBtn.textContent = "\u5220\u9664";
    deleteBtn.title = "\u5220\u9664\u5206\u7EC4\uFF1B\u7EC4\u5185\u6A21\u677F\u5C06\u79FB\u81F3\u6839\u76EE\u5F55";
    deleteBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.plugin.deleteTemplateGroup(relativePath).then((ok) => {
        if (ok) this.display();
      });
    });
    titleWrap.append(deleteBtn);
    summary.appendChild(titleWrap);
    group.appendChild(summary);
    const body = document.createElement("div");
    body.className = "fdtb-template-settings-folder-body";
    if (node.templates.length === 0 && node.folders.size === 0) {
      body.createEl("p", {
        cls: "setting-item-description",
        text: "\u5206\u7EC4\u5DF2\u521B\u5EFA\uFF0C\u6682\u65E0\u6A21\u677F\u3002\u53EF\u5728\u4E0A\u65B9\u300C\u65B0\u5EFA\u6A21\u677F\u300D\u586B\u5199\u300C\u5206\u7EC4\u540D/\u6A21\u677F\u540D\u300D\uFF0C\u6216\u628A\u5176\u4ED6\u6A21\u677F\u79FB\u5165\u672C\u5206\u7EC4\u3002"
      });
    }
    for (const template of this.plugin.sortTemplateDescriptors(node.templates)) {
      body.appendChild(this.createTemplateSettingsRow(template, groupOptions));
    }
    const nested = Array.from(node.folders.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"));
    for (const [childName, childNode] of nested) {
      const childRel = `${relativePath}/${childName}`;
      this.renderTemplateFolderSection(body, childName, childNode, childRel, groupOptions);
    }
    group.appendChild(body);
    container.appendChild(group);
  }
  appendInlineForm(containerEl, options) {
    const wrap = document.createElement("div");
    wrap.className = "fdtb-template-inline-form setting-item";
    const info = document.createElement("div");
    info.className = "setting-item-info";
    const name = document.createElement("div");
    name.className = "setting-item-name";
    name.textContent = options.label;
    const desc = document.createElement("div");
    desc.className = "setting-item-description";
    desc.textContent = options.desc;
    info.append(name, desc);
    const control = document.createElement("div");
    control.className = "setting-item-control fdtb-template-inline-form-control";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "fdtb-template-inline-input";
    input.placeholder = options.placeholder;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mod-cta fdtb-template-inline-btn";
    btn.textContent = options.buttonText;
    btn.disabled = true;
    input.addEventListener("input", () => {
      btn.disabled = !input.value.trim();
    });
    const submit = async () => {
      const value = input.value.trim();
      if (!value) return;
      btn.disabled = true;
      input.disabled = true;
      try {
        await options.onSubmit(value);
      } finally {
        input.disabled = false;
        input.value = "";
        btn.disabled = true;
      }
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void submit();
      if (event.key === "Escape") {
        input.value = "";
        btn.disabled = true;
      }
    });
    btn.addEventListener("click", () => void submit());
    control.append(input, btn);
    wrap.append(info, control);
    containerEl.appendChild(wrap);
  }
  createTemplateSettingsRow(template, groupOptions) {
    const row = document.createElement("div");
    row.className = "fdtb-template-settings-row";
    const main = document.createElement("div");
    main.className = "fdtb-template-settings-row-main";
    const title = document.createElement("div");
    title.className = "fdtb-template-settings-row-title";
    title.textContent = template.title;
    const meta = document.createElement("div");
    meta.className = "fdtb-template-settings-row-meta";
    meta.textContent = template.path;
    main.append(title, meta);
    const actions = document.createElement("div");
    actions.className = "fdtb-template-settings-row-actions";
    const moveWrap = document.createElement("label");
    moveWrap.className = "fdtb-template-move-wrap";
    moveWrap.title = "\u79FB\u5230\u5176\u4ED6\u5206\u7EC4";
    const moveLabel = document.createElement("span");
    moveLabel.className = "fdtb-template-move-label";
    moveLabel.textContent = "\u79FB\u5230";
    const moveSelect = document.createElement("select");
    moveSelect.className = "fdtb-template-move-select";
    const currentGroup = template.folderSegments.join("/");
    for (const option of groupOptions) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      opt.selected = option.value === currentGroup;
      moveSelect.appendChild(opt);
    }
    moveSelect.addEventListener("change", async () => {
      const target = moveSelect.value;
      if (target === currentGroup) return;
      moveSelect.disabled = true;
      const ok = await this.plugin.moveTemplateToGroup(template.path, target);
      if (ok) {
        this.display();
        return;
      }
      moveSelect.disabled = false;
      moveSelect.value = currentGroup;
    });
    moveWrap.append(moveLabel, moveSelect);
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "\u7F16\u8F91";
    editButton.addEventListener("click", () => void this.plugin.editTemplateAtPath(template.path));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "fdtb-template-settings-delete";
    deleteButton.textContent = "\u5220\u9664";
    deleteButton.addEventListener("click", async () => {
      const deleted = await this.plugin.deleteTemplateAtPath(template.path);
      if (deleted) this.display();
    });
    actions.append(moveWrap, editButton, deleteButton);
    row.append(main, actions);
    return row;
  }
  renderTableEnhancerSection(containerEl) {
    void this.plugin.refreshManagedPluginStatus({ silent: true });
    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent = "\u539F\u751F\u8868\u683C\u989C\u8272\u3001\u957F\u5BBD\u9AD8\u4E0E\u6A21\u677F\u5E93\u3002\u589E\u5F3A\u8868\u683C\u4E0E OneNote \u7C98\u8D34\u7B49\u6D4B\u8BD5\u80FD\u529B\u9700\u5148\u5728\u300C\u81EA\u7814\u529F\u80FD\u5F00\u5173\u300D\u9875\u7B7E\u6253\u5F00\u300C\u542F\u7528\u6D4B\u8BD5\u529F\u80FD\u300D\u3002";
    containerEl.appendChild(intro);
    this.appendManagedPluginToggleRow(containerEl, {
      pluginId: MARKDOWN_TABLE_PLUGIN_ID,
      displayName: "\u539F\u751F\u8868\u683C\u589E\u5F3A",
      meta: `\u63D2\u4EF6 id\uFF1A${MARKDOWN_TABLE_PLUGIN_ID}`,
      description: "\u6838\u5FC3\u8868\u683C\u80FD\u529B\u5E95\u5EA7\uFF1A\u5F69\u8272\u539F\u751F\u8868\u3001\u6A21\u677F\u5E93\u4E0E\u53F3\u952E\u83DC\u5355"
    });
    const tableStatus = this.plugin.getManagedPluginStatus(MARKDOWN_TABLE_PLUGIN_ID);
    if (!tableStatus.installed) {
      this.appendStatusRow(
        containerEl,
        "\u672A\u5B89\u88C5",
        "\u2014",
        "\u8BF7\u5148\u5728 Obsidian \u2192 \u7B2C\u4E09\u65B9\u63D2\u4EF6 \u4E2D\u5B89\u88C5 markdown-table-enhancer"
      );
      return;
    }
    if (!tableStatus.enabled) {
      this.appendStatusRow(
        containerEl,
        "\u5DF2\u5B89\u88C5\u672A\u542F\u7528",
        "\u2014",
        "\u6253\u5F00\u4E0A\u65B9\u5F00\u5173\u540E\u5373\u53EF\u914D\u7F6E\u914D\u8272\u4E0E\u4E0B\u65B9\u7BA1\u7406\u547D\u4EE4"
      );
      return;
    }
    this.renderNativeTableColorSettings(containerEl);
    this.appendSectionTitle(containerEl, "\u539F\u751F\u8868\u683C\u7BA1\u7406\u547D\u4EE4");
    this.appendCommandRow(containerEl, "\u63D2\u5165\u5F69\u8272\u539F\u751F\u8868\u683C", "\u6309\u5F53\u524D\u9ED8\u8BA4\u914D\u8272\u63D2\u5165\u7A7A\u767D\u539F\u751F\u8868\u683C", ENHANCED_TABLE_COMMANDS.insertNativeColorTemplate);
    this.appendCommandRow(containerEl, "\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316", "\u7ED9\u5F53\u524D\u539F\u751F\u8868\u683C\u5957\u9ED8\u8BA4\u914D\u8272\uFF0C\u5E76\u4FDD\u7559\u5DF2\u6709\u5185\u5BB9", ENHANCED_TABLE_COMMANDS.initializeNativeLayout);
    this.appendCommandRow(containerEl, "\u8BBE\u7F6E\u9009\u4E2D\u884C\u989C\u8272", "\u7ED9\u5F53\u524D\u539F\u751F\u8868\u683C\u9009\u4E2D\u884C\u5FEB\u901F\u5957\u5F53\u524D\u8272\u7CFB", ENHANCED_TABLE_COMMANDS.setNativeRowColor);
    this.appendCommandRow(containerEl, "\u884C\u6BB5\u914D\u8272", "\u6309\u884C\u53F7\u8BBE\u7F6E\u591A\u884C\u540C\u8272\u6216\u6062\u590D\u9ED8\u8BA4", ENHANCED_TABLE_COMMANDS.openNativeRowBands);
    if (!this.plugin.isBetaFeaturesEnabled()) return;
    this.appendCommandRow(containerEl, "\u67E5\u770B\u5F53\u524D\u6587\u4EF6\u8868\u683C\u589E\u5F3A\u72B6\u6001", "\u68C0\u67E5\u5F53\u524D\u6587\u6863\u4E2D\u8868\u683C\u7684\u589E\u5F3A\u72B6\u6001", ENHANCED_TABLE_COMMANDS.showStatus);
    this.appendSectionTitle(containerEl, "\u589E\u5F3A\u8868\u683C\u80FD\u529B\uFF08\u6D4B\u8BD5\uFF09");
    this.appendCommandRow(containerEl, "\u63D2\u5165\u589E\u5F3A\u8868\u683C\u6A21\u677F", "\u63D2\u5165\u5B8C\u6574\u589E\u5F3A\u8868\u683C\u6A21\u677F", ENHANCED_TABLE_COMMANDS.insertTemplate);
    this.appendCommandRow(containerEl, "\u5BF9\u5F53\u524D\u8868\u542F\u7528\u589E\u5F3A", "\u628A\u5F53\u524D\u539F\u751F Markdown \u8868\u683C\u5347\u7EA7\u4E3A\u589E\u5F3A\u8868\u683C", ENHANCED_TABLE_COMMANDS.initializeCurrent);
    this.appendCommandRow(containerEl, "\u4E3A\u5F53\u524D\u6587\u4EF6\u5168\u90E8\u8868\u683C\u542F\u7528\u589E\u5F3A\uFF08\u6279\u91CF\uFF09", "\u6279\u91CF\u4E3A\u5F53\u524D\u6587\u4EF6\u8868\u683C\u5EFA\u7ACB\u589E\u5F3A\u6807\u8BC6", ENHANCED_TABLE_COMMANDS.initializeBatch);
    this.appendCommandRow(containerEl, "\u6062\u590D\u5F53\u524D\u6587\u4EF6\u6700\u8FD1\u4E00\u6B21\u8868\u683C\u589E\u5F3A\u5FEB\u7167", "\u6062\u590D\u5F53\u524D\u6587\u4EF6\u6700\u8FD1\u4E00\u6B21\u8868\u683C\u589E\u5F3A\u524D\u7684\u5FEB\u7167", ENHANCED_TABLE_COMMANDS.restoreSnapshot);
    this.appendCommandRow(containerEl, "OneNote \u9AD8\u4FDD\u771F\u7C98\u8D34", "\u4ECE OneNote \u526A\u8D34\u677F\u5BFC\u5165\u56FE\u6587/\u8868\u4E2D\u8868\u5185\u5BB9", ENHANCED_TABLE_COMMANDS.pasteOneNoteRichTable);
  }
  renderNativeTableColorSettings(containerEl) {
    const settings = this.plugin.getNativeColorSettingsForManager();
    if (!settings) {
      this.appendStatusRow(containerEl, "\u539F\u751F\u8868\u683C\u914D\u8272", "\u672A\u63A5\u901A", "\u9700\u8981\u542F\u7528 markdown-table-enhancer \u540E\u624D\u80FD\u8BBE\u7F6E\u9ED8\u8BA4\u914D\u8272");
      return;
    }
    const card = document.createElement("div");
    card.className = "fdtb-native-color-card";
    const header = document.createElement("div");
    header.className = "fdtb-native-color-header";
    const title = document.createElement("div");
    title.className = "fdtb-native-color-title";
    title.textContent = "\u9ED8\u8BA4\u539F\u751F\u8868\u683C\u914D\u8272";
    const hint = document.createElement("div");
    hint.className = "fdtb-native-color-hint";
    hint.textContent = "\u65B0\u5EFA\u5F69\u8272\u8868\u683C\u3001\u53F3\u952E\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316\uFF0C\u90FD\u4F1A\u4F7F\u7528\u8FD9\u91CC\u7684\u9ED8\u8BA4\u65B9\u6848\u3002";
    header.append(title, hint);
    card.appendChild(header);
    const presetList = document.createElement("div");
    presetList.className = "fdtb-native-color-presets";
    for (const preset of settings.presets) {
      const presetButton = document.createElement("button");
      presetButton.type = "button";
      presetButton.className = "fdtb-native-color-preset";
      if (settings.defaultPresetId === preset.id) {
        presetButton.classList.add("is-active");
      }
      presetButton.append(
        this.createPalettePreview(preset.palette),
        this.createTextSpan("fdtb-native-color-preset-label", preset.label)
      );
      presetButton.addEventListener("click", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({ defaultPresetId: preset.id });
        this.display();
      });
      presetList.appendChild(presetButton);
    }
    card.appendChild(presetList);
    const activePreset = settings.presets.find((preset) => preset.id === settings.defaultPresetId);
    const previewPalette = activePreset?.palette ?? settings.customPalette;
    const livePreview = this.createNativeColorLivePreview(previewPalette);
    card.appendChild(livePreview);
    const schemeWrap = document.createElement("div");
    schemeWrap.className = "fdtb-native-color-schemes";
    schemeWrap.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "\u63A8\u8350\u56FA\u5B9A\u65B9\u6848"));
    const schemeGrid = document.createElement("div");
    schemeGrid.className = "fdtb-native-color-scheme-grid";
    for (const scheme of ONENOTE_NATIVE_TABLE_SCHEMES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-native-color-scheme";
      button.append(this.createPalettePreview(scheme.palette), this.createTextSpan("fdtb-native-color-preset-label", scheme.label));
      button.addEventListener("click", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({
          defaultPresetId: "custom",
          customPalette: scheme.palette
        });
        this.display();
      });
      schemeGrid.appendChild(button);
    }
    schemeWrap.appendChild(schemeGrid);
    card.appendChild(schemeWrap);
    const editor = document.createElement("div");
    editor.className = "fdtb-native-color-editor";
    editor.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "\u9AD8\u7EA7\u5FAE\u8C03"));
    for (const field of NATIVE_COLOR_FIELD_LABELS) {
      const row = document.createElement("label");
      row.className = "fdtb-native-color-row";
      const label = this.createTextSpan("fdtb-native-color-row-label", field.label);
      const input = document.createElement("input");
      input.type = "color";
      input.value = previewPalette[field.key];
      input.addEventListener("change", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({
          defaultPresetId: "custom",
          customPalette: {
            ...previewPalette,
            [field.key]: input.value
          }
        });
        this.display();
      });
      row.append(label, input);
      editor.appendChild(row);
    }
    card.appendChild(editor);
    const swatchPanel = document.createElement("div");
    swatchPanel.className = "fdtb-onenote-color-panel";
    swatchPanel.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "OneNote \u5E38\u7528\u8272\u5757"));
    const targetList = document.createElement("div");
    targetList.className = "fdtb-native-color-targets";
    for (const field of NATIVE_COLOR_FIELD_LABELS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-native-color-target";
      if (this.activeNativeColorField === field.key) button.classList.add("is-active");
      button.textContent = field.label;
      button.addEventListener("click", () => {
        this.activeNativeColorField = field.key;
        this.display();
      });
      targetList.appendChild(button);
    }
    swatchPanel.appendChild(targetList);
    const swatches = document.createElement("div");
    swatches.className = "fdtb-onenote-color-swatches";
    for (const color of ONENOTE_COLOR_SWATCHES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-onenote-color-swatch";
      button.style.setProperty("--fdtb-swatch-color", color);
      button.title = color;
      button.addEventListener("click", async () => {
        await this.plugin.updateNativeColorSettingsFromManager({
          defaultPresetId: "custom",
          customPalette: {
            ...previewPalette,
            [this.activeNativeColorField]: color
          }
        });
        this.display();
      });
      swatches.appendChild(button);
    }
    swatchPanel.appendChild(swatches);
    card.appendChild(swatchPanel);
    const actions = document.createElement("div");
    actions.className = "fdtb-native-color-actions";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "fdtb-native-color-action";
    saveButton.textContent = "\u4FDD\u5B58\u4E3A\u56FA\u5B9A\u65B9\u6848";
    saveButton.addEventListener("click", async () => {
      const fallback = `\u914D\u8272\u65B9\u6848 ${(settings.savedPalettes?.length ?? 0) + 1}`;
      const label = window.prompt?.("\u7ED9\u8FD9\u4E2A\u989C\u8272\u65B9\u6848\u8D77\u4E2A\u540D\u5B57", fallback) ?? fallback;
      if (!label || !label.trim()) return;
      await this.plugin.saveCurrentNativeColorPaletteAsManager(label);
      this.display();
    });
    actions.appendChild(saveButton);
    card.appendChild(actions);
    const savedPalettes = settings.savedPalettes ?? settings.presets.filter((preset) => preset.saved);
    if (savedPalettes.length > 0) {
      const savedWrap = document.createElement("div");
      savedWrap.className = "fdtb-native-color-saved";
      savedWrap.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "\u56FA\u5B9A\u989C\u8272\u65B9\u6848"));
      for (const preset of savedPalettes) {
        const row = document.createElement("div");
        row.className = "fdtb-native-color-saved-row";
        const apply = document.createElement("button");
        apply.type = "button";
        apply.className = "fdtb-native-color-saved-apply";
        if (settings.defaultPresetId === preset.id) apply.classList.add("is-active");
        apply.append(this.createPalettePreview(preset.palette), this.createTextSpan("fdtb-native-color-preset-label", preset.label));
        apply.addEventListener("click", async () => {
          await this.plugin.updateNativeColorSettingsFromManager({ defaultPresetId: preset.id });
          this.display();
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "fdtb-native-color-saved-delete";
        remove.textContent = "\u5220\u9664";
        remove.addEventListener("click", async () => {
          await this.plugin.deleteNativeColorPaletteFromManager(preset.id);
          this.display();
        });
        row.append(apply, remove);
        savedWrap.appendChild(row);
      }
      card.appendChild(savedWrap);
    }
    containerEl.appendChild(card);
  }
  createPalettePreview(palette) {
    const preview = document.createElement("span");
    preview.className = "fdtb-native-color-preview";
    preview.style.setProperty("--fdtb-preview-header", palette.header);
    preview.style.setProperty("--fdtb-preview-header-text", palette.headerText);
    preview.style.setProperty("--fdtb-preview-base", palette.baseRow);
    preview.style.setProperty("--fdtb-preview-alt", palette.altRow);
    preview.style.setProperty("--fdtb-preview-border", palette.border);
    for (let index = 0; index < 6; index += 1) {
      const cell = document.createElement("span");
      cell.className = index < 3 ? "is-header" : index === 4 ? "is-alt" : "is-base";
      preview.appendChild(cell);
    }
    return preview;
  }
  createNativeColorLivePreview(palette) {
    const wrap = document.createElement("div");
    wrap.className = "fdtb-native-color-live";
    wrap.style.setProperty("--fdtb-live-header", palette.header);
    wrap.style.setProperty("--fdtb-live-header-text", palette.headerText);
    wrap.style.setProperty("--fdtb-live-base", palette.baseRow);
    wrap.style.setProperty("--fdtb-live-alt", palette.altRow);
    wrap.style.setProperty("--fdtb-live-border", palette.border);
    wrap.appendChild(this.createTextSpan("fdtb-native-color-editor-title", "\u5B9E\u65F6\u9884\u89C8"));
    const table = document.createElement("table");
    table.className = "fdtb-native-color-live-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const label of ["\u6B65\u9AA4", "\u81EA\u68C0", "\u5185\u5BB9"]) {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    const rows = [
      ["1", "\u76EE\u6807\u6E05\u695A", "\u5148\u786E\u8BA4\u76EE\u7684\u548C\u6700\u7EC8\u6210\u679C"],
      ["2", "\u8DEF\u5F84\u53EF\u884C", "\u628A\u5173\u952E\u52A8\u4F5C\u62C6\u6210\u53EF\u6267\u884C\u6B65\u9AA4"],
      ["3", "\u590D\u76D8\u6C89\u6DC0", "\u628A\u7A33\u5B9A\u505A\u6CD5\u4FDD\u5B58\u4E3A\u6A21\u677F"]
    ];
    for (const rowData of rows) {
      const tr = document.createElement("tr");
      for (const text of rowData) {
        const td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }
  renderPluginHostSection(containerEl) {
    this.appendSectionTitle(containerEl, "\u7B2C\u4E09\u65B9\u63D2\u4EF6\u7BA1\u7406");
    void this.plugin.refreshManagedPluginStatus({ silent: true });
    const intro = document.createElement("p");
    intro.className = "fdtb-settings-page-desc";
    intro.textContent = "\u63D2\u4EF6\u6309\u5206\u7C7B\u5206\u7EC4\u5C55\u793A\uFF0C\u53EF\u6298\u53E0\u3001\u6539\u540D\u3001\u5220\u9664\u5206\u7C7B\uFF1B\u6BCF\u6761\u63D2\u4EF6\u53F3\u4FA7\u7528\u5C0F\u53F7\u300C\u79FB\u5230\u300D\u5207\u6362\u5206\u7C7B\u3002\u5206\u7C7B\u5220\u9664\u540E\uFF0C\u7EC4\u5185\u63D2\u4EF6\u4F1A\u79FB\u81F3\u300C\u5176\u4ED6\u63D2\u4EF6\u300D\u3002";
    containerEl.appendChild(intro);
    new import_obsidian5.Setting(containerEl).setName("\u81EA\u52A8\u76D1\u6D4B\u63D2\u4EF6\u542F\u7528\u72B6\u6001").setDesc(this.plugin.getPluginStatusMonitorDescription());
    this.appendStatusRow(containerEl, "\u5408\u5E76\u65B9\u5F0F", "\u5B89\u5168\u6258\u7BA1", "\u7EDF\u4E00\u5165\u53E3\u3001\u72B6\u6001\u548C\u663E\u793A\u540D\uFF1B\u5F00\u5173\u8C03\u7528 Obsidian \u81EA\u5E26\u63D2\u4EF6\u542F\u505C\u80FD\u529B");
    this.appendInlineForm(containerEl, {
      label: "\u65B0\u5EFA\u5206\u7C7B",
      desc: "\u521B\u5EFA\u7A7A\u5206\u7C7B\u540E\uFF0C\u53EF\u7528\u6BCF\u6761\u63D2\u4EF6\u65C1\u7684\u300C\u79FB\u5230\u300D\u5F52\u5165",
      placeholder: "\u5206\u7C7B\u540D\u79F0",
      buttonText: "\u521B\u5EFA",
      onSubmit: async (name) => {
        const ok = await this.plugin.createManagedPluginCategory(name);
        if (ok) this.display();
      }
    });
    const list = document.createElement("div");
    list.className = "fdtb-plugin-category-tree";
    const categoryOptions = this.plugin.getManagedPluginCategoryMoveOptions();
    for (const section of this.plugin.getHostedPluginCategorySections()) {
      this.appendPluginCategorySection(list, section.category, section.items, categoryOptions);
    }
    containerEl.appendChild(list);
  }
  appendPluginCategorySection(containerEl, category, items, categoryOptions) {
    const group = document.createElement("details");
    group.className = "fdtb-plugin-category-folder";
    group.open = true;
    group.dataset.categoryId = category.id;
    const summary = document.createElement("summary");
    summary.className = "fdtb-plugin-category-folder-title";
    const titleWrap = document.createElement("span");
    titleWrap.className = "fdtb-template-folder-title-wrap";
    const titleText = document.createElement("span");
    titleText.className = "fdtb-template-folder-title-text";
    titleText.textContent = category.name;
    titleWrap.appendChild(titleText);
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "fdtb-template-folder-rename-btn";
    renameBtn.textContent = "\u6539\u540D";
    renameBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.beginInlineRename(titleText, {
        initial: category.name,
        onCommit: async (value) => {
          const ok = await this.plugin.renameManagedPluginCategory(category.id, value);
          if (ok) this.display();
        }
      });
    });
    titleWrap.append(renameBtn);
    if (category.id !== MANAGED_PLUGIN_FALLBACK_CATEGORY_ID) {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "fdtb-template-folder-delete-btn";
      deleteBtn.textContent = "\u5220\u9664";
      deleteBtn.title = "\u5220\u9664\u5206\u7C7B\uFF1B\u7EC4\u5185\u63D2\u4EF6\u5C06\u79FB\u81F3\u300C\u5176\u4ED6\u63D2\u4EF6\u300D";
      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void this.plugin.deleteManagedPluginCategory(category.id).then((ok) => {
          if (ok) this.display();
        });
      });
      titleWrap.append(deleteBtn);
    }
    const count = document.createElement("span");
    count.className = "fdtb-plugin-category-count";
    count.textContent = `${items.length} \u4E2A\u63D2\u4EF6`;
    summary.append(titleWrap, count);
    group.appendChild(summary);
    const body = document.createElement("div");
    body.className = "fdtb-plugin-category-folder-body";
    if (items.length === 0) {
      body.createEl("p", {
        cls: "setting-item-description",
        text: "\u5206\u7C7B\u5DF2\u521B\u5EFA\uFF0C\u6682\u65E0\u63D2\u4EF6\u3002\u53EF\u7528\u4E0B\u65B9\u6BCF\u6761\u63D2\u4EF6\u7684\u300C\u79FB\u5230\u300D\u628A\u63D2\u4EF6\u5F52\u5165\u672C\u5206\u7C7B\u3002"
      });
    } else {
      for (const item of items) {
        this.appendPluginManagerRow(body, item, categoryOptions, category.id);
      }
    }
    group.appendChild(body);
    containerEl.appendChild(group);
  }
  appendPluginManagerRow(containerEl, item, categoryOptions, currentCategoryId) {
    const row = document.createElement("div");
    row.className = "fdtb-plugin-manager-row";
    row.dataset.pluginId = item.id;
    const main = document.createElement("div");
    main.className = "fdtb-plugin-manager-main";
    const title = document.createElement("div");
    title.className = "fdtb-plugin-manager-title";
    title.textContent = item.name;
    const meta = document.createElement("div");
    meta.className = "fdtb-plugin-manager-meta";
    meta.textContent = `${item.originalName}${item.version ? ` \xB7 ${item.version}` : ""} \xB7 ${item.id}`;
    const desc = document.createElement("div");
    desc.className = "fdtb-plugin-manager-desc";
    desc.textContent = item.description;
    main.append(title, meta, desc);
    const controls = document.createElement("div");
    controls.className = "fdtb-plugin-manager-controls";
    const moveWrap = document.createElement("label");
    moveWrap.className = "fdtb-template-move-wrap";
    moveWrap.title = "\u79FB\u5230\u5176\u4ED6\u5206\u7C7B";
    const moveLabel = document.createElement("span");
    moveLabel.className = "fdtb-template-move-label";
    moveLabel.textContent = "\u79FB\u5230";
    const moveSelect = document.createElement("select");
    moveSelect.className = "fdtb-template-move-select";
    const assignedCategory = this.plugin.dataStore.managedPluginCategories[item.id] ?? currentCategoryId;
    for (const option of categoryOptions) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      opt.selected = option.value === assignedCategory;
      moveSelect.appendChild(opt);
    }
    moveSelect.addEventListener("change", async () => {
      const target = moveSelect.value;
      if (target === assignedCategory) return;
      moveSelect.disabled = true;
      await this.plugin.moveManagedPluginToCategory(item.id, target);
      this.display();
    });
    moveWrap.append(moveLabel, moveSelect);
    const aliasInput = document.createElement("input");
    aliasInput.type = "text";
    aliasInput.className = "fdtb-plugin-manager-input";
    aliasInput.placeholder = "\u663E\u793A\u540D\u79F0";
    aliasInput.value = item.alias;
    aliasInput.addEventListener("change", async () => {
      await this.plugin.updateManagedPluginAlias(item.id, aliasInput.value);
      this.display();
    });
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "fdtb-plugin-manager-toggle";
    toggleLabel.setAttribute("aria-label", `${item.name} ${item.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}`);
    toggleLabel.title = item.toggleable ? "\u542F\u7528\u6216\u5173\u95ED\u63D2\u4EF6" : "\u603B\u5165\u53E3\u4E0D\u80FD\u5728\u81EA\u8EAB\u8BBE\u7F6E\u9875\u5173\u95ED";
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = item.enabled;
    toggleInput.disabled = !item.toggleable;
    const toggleTrack = document.createElement("span");
    toggleTrack.className = "fdtb-plugin-manager-toggle-track";
    toggleLabel.append(toggleInput, toggleTrack);
    toggleInput.addEventListener("change", async () => {
      const nextEnabled = toggleInput.checked;
      toggleInput.disabled = true;
      try {
        const changed = await this.plugin.setManagedPluginEnabled(item.id, nextEnabled);
        if (!changed) toggleInput.checked = item.enabled;
        this.display();
      } catch (error) {
        toggleInput.checked = item.enabled;
        toggleInput.disabled = !item.toggleable;
        new import_obsidian5.Notice(`\u63D2\u4EF6\u5F00\u5173\u5931\u8D25\uFF1A${error instanceof Error ? error.message : String(error)}`);
      }
    });
    controls.append(moveWrap, aliasInput, toggleLabel);
    row.append(main, controls);
    containerEl.appendChild(row);
  }
  renderDraggerSection(containerEl) {
    this.appendSectionTitle(containerEl, "\u5757\u62D6\u52A8 / Dragger");
    new import_obsidian5.Setting(containerEl).setName("\u663E\u793A Dragger \u878D\u5408\u72B6\u6001").setDesc("\u53EA\u5C55\u793A\u72B6\u6001\uFF0C\u4E0D\u81EA\u52A8\u542F\u505C Dragger").addToggle(
      (toggle) => toggle.setValue(this.plugin.dataStore.showDraggerIntegrationStatus).onChange(async (value) => {
        await this.plugin.updateManagementSetting("showDraggerIntegrationStatus", value);
        this.display();
      })
    );
    if (!this.plugin.dataStore.showDraggerIntegrationStatus) return;
    const draggerStatus = this.plugin.getManagedPluginStatus("dragger");
    this.appendStatusRow(containerEl, "Dragger \u63D2\u4EF6", draggerStatus.enabled ? "\u5DF2\u542F\u7528" : draggerStatus.installed ? "\u5DF2\u5B89\u88C5\u672A\u542F\u7528" : "\u672A\u5B89\u88C5", "T \u624B\u67C4\u548C\u8868\u683C\u624B\u67C4\u4F1A\u4F18\u5148\u907F\u8BA9/\u878D\u5408 Dragger \u624B\u67C4");
    this.appendStatusRow(containerEl, "\u624B\u67C4\u878D\u5408", "\u5DF2\u63A5\u5165", "\u5F53\u524D\u901A\u8FC7 Dragger \u624B\u67C4\u5B9A\u4F4D\uFF0C\u51CF\u5C11 T/\u8868\u624B\u67C4\u906E\u6321\u6B63\u6587");
  }
  appendSectionTitle(containerEl, titleText) {
    const title = document.createElement("h3");
    title.className = "fdtb-settings-section-title";
    title.textContent = titleText;
    containerEl.appendChild(title);
  }
  appendStatusRow(containerEl, name, status, description) {
    const row = document.createElement("div");
    row.className = "fdtb-settings-status-row";
    const main = document.createElement("div");
    main.className = "fdtb-settings-status-main";
    const label = document.createElement("div");
    label.className = "fdtb-settings-status-label";
    label.textContent = name;
    const desc = document.createElement("div");
    desc.className = "fdtb-settings-status-desc";
    desc.textContent = description;
    main.append(label, desc);
    const badge = document.createElement("span");
    badge.className = "fdtb-settings-status-badge";
    badge.textContent = status;
    row.append(main, badge);
    containerEl.appendChild(row);
  }
  appendCommandRow(containerEl, name, description, commandId) {
    new import_obsidian5.Setting(containerEl).setName(name).setDesc(description).addButton(
      (button) => button.setButtonText("\u6267\u884C").onClick(async () => {
        await this.plugin.runManagedCommand(commandId);
      })
    );
  }
  createTextSpan(className, text) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }
};
var FeishuDocToolbarPlugin = class extends import_obsidian5.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "handleEl", null);
    __publicField(this, "popoverEl", null);
    __publicField(this, "submenuEl", null);
    __publicField(this, "imagePreviewEl", null);
    __publicField(this, "activeContext", null);
    __publicField(this, "hideTimer", null);
    __publicField(this, "rafHandle", null);
    __publicField(this, "styleRefreshTimer", null);
    __publicField(this, "dataStore", { ...DEFAULT_DATA });
    __publicField(this, "slashTrigger", null);
    __publicField(this, "embeddedHosts", /* @__PURE__ */ new Map());
    __publicField(this, "claudianArchiveRunner", null);
  }
  async onload() {
    this.dataStore = this.normalizeData(await this.loadData());
    this.ensureHandle();
    this.registerCommands();
    this.addSettingTab(new FeishuDocExperienceSettingTab(this.app, this));
    await this.startEnabledEmbeddedModules();
    await this.syncExperimentalFeatureGateToTableEnhancer(this.isBetaFeaturesEnabled());
    this.registerInterval(window.setInterval(() => this.applyManagedPluginAliasesToSettingsSidebar(), 1800));
    this.registerDomEvent(document, "pointermove", (event) => this.schedulePointerUpdate(event), true);
    this.registerDomEvent(document, "pointerdown", (event) => this.handlePointerDown(event), true);
    this.registerDomEvent(document, "click", (event) => this.handleEditorClick(event), true);
    this.registerDomEvent(document, "keydown", (event) => this.handleDocumentKeydown(event), true);
    this.registerDomEvent(document, "dblclick", (event) => this.handleDocumentDoubleClick(event), true);
    this.registerDomEvent(document, "scroll", () => this.hideToolbar(), true);
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.hideToolbar();
        this.scheduleStyleRefresh();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.hideToolbar();
        this.scheduleStyleRefresh();
      })
    );
    this.registerEvent(this.app.workspace.on("file-open", () => this.scheduleStyleRefresh()));
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian5.TFile && file.extension === "md") {
          this.scheduleStyleRefresh();
        }
      })
    );
    const workspaceAny = this.app.workspace;
    if (typeof workspaceAny.on === "function") {
      this.registerEvent(
        workspaceAny.on("editor-change", (editor, info) => {
          this.scheduleStyleRefresh();
          this.handleSlashTrigger(editor, info);
        })
      );
      this.registerEvent(
        workspaceAny.on("editor-menu", (menu, editor, view) => {
          this.extendEditorMenu(menu, editor, view);
        })
      );
    }
    this.scheduleStyleRefresh();
    window.setTimeout(() => this.applyManagedPluginAliasesToSettingsSidebar(), 500);
  }
  onunload() {
    if (this.rafHandle !== null) {
      window.cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }
    if (this.styleRefreshTimer !== null) {
      window.clearTimeout(this.styleRefreshTimer);
      this.styleRefreshTimer = null;
    }
    this.clearHideTimer();
    this.closeNativeTableImagePreview();
    this.clearAllStyledArtifacts();
    this.hideToolbar(true);
    this.stopAllEmbeddedModules();
  }
  // --- 内嵌子模块管理 ---
  getModuleBackend() {
    return {
      app: this.app,
      plugin: this,
      loadModuleData: (moduleId) => this.dataStore.embeddedModules[moduleId]?.data ?? null,
      saveModuleData: async (moduleId, data2) => {
        const current = this.dataStore.embeddedModules[moduleId] ?? { enabled: true };
        this.dataStore.embeddedModules[moduleId] = { ...current, data: data2 };
        await this.saveData(this.dataStore);
      }
    };
  }
  isEmbeddedModuleEnabled(moduleId) {
    const descriptor = EMBEDDED_MODULES.find((m) => m.id === moduleId);
    if (!descriptor) return false;
    const saved = this.dataStore.embeddedModules[moduleId];
    if (!saved) return descriptor.defaultEnabled;
    return saved.enabled !== false;
  }
  async startEnabledEmbeddedModules() {
    const backend = this.getModuleBackend();
    const conflictWarnings = [];
    for (const moduleDef of EMBEDDED_MODULES) {
      if (!this.isEmbeddedModuleEnabled(moduleDef.id)) continue;
      if (moduleDef.replacesExternalPluginId) {
        const externalStatus = this.getManagedPluginStatus(moduleDef.replacesExternalPluginId);
        if (externalStatus.installed && externalStatus.enabled) {
          console.warn(
            `[feishu-doc-toolbar] \u8DF3\u8FC7\u542F\u52A8\u5185\u5D4C\u6A21\u5757\u300C${moduleDef.displayName}\u300D\uFF1A\u68C0\u6D4B\u5230\u5916\u90E8\u63D2\u4EF6 ${moduleDef.replacesExternalPluginId} \u4ECD\u7136\u542F\u7528\uFF0C\u907F\u514D\u529F\u80FD\u91CD\u590D\u89E6\u53D1\u3002\u8BF7\u5728\u300C\u7B2C\u4E09\u65B9\u63D2\u4EF6\u300D\u91CC\u624B\u52A8\u5173\u95ED\u5B83\u3002`
          );
          conflictWarnings.push(`${moduleDef.displayName}\uFF08\u8BF7\u5173\u95ED\u5916\u90E8 ${moduleDef.replacesExternalPluginId}\uFF09`);
          continue;
        }
      }
      try {
        const host = new SubPluginHost(backend, moduleDef.id);
        this.embeddedHosts.set(moduleDef.id, host);
        await moduleDef.load(host);
      } catch (error) {
        console.error(`[feishu-doc-toolbar] \u542F\u52A8\u5185\u5D4C\u6A21\u5757 ${moduleDef.id} \u5931\u8D25`, error);
        new import_obsidian5.Notice(`\u5185\u5D4C\u529F\u80FD\u300C${moduleDef.displayName}\u300D\u542F\u52A8\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0`);
      }
    }
    if (conflictWarnings.length > 0) {
      new import_obsidian5.Notice(
        `Obsidian\u589E\u5F3A\u4F53\u9A8C\uFF1A\u4EE5\u4E0B\u529F\u80FD\u5DF2\u5185\u5D4C\u4F46\u6682\u672A\u542F\u52A8\uFF0C\u56E0\u4E3A\u540C\u540D\u5916\u90E8\u63D2\u4EF6\u8FD8\u542F\u7528\u7740\uFF1A
${conflictWarnings.join("\n")}
\u8BF7\u5230\u300C\u7B2C\u4E09\u65B9\u63D2\u4EF6\u300D\u5173\u95ED\u8FD9\u4E9B\u539F\u63D2\u4EF6\u540E\u91CD\u542F Obsidian\u3002`,
        15e3
      );
    }
  }
  stopAllEmbeddedModules() {
    for (const [moduleId, host] of this.embeddedHosts.entries()) {
      try {
        host.destroy();
      } catch (error) {
        console.error(`[feishu-doc-toolbar] \u5378\u8F7D\u5185\u5D4C\u6A21\u5757 ${moduleId} \u5931\u8D25`, error);
      }
    }
    this.embeddedHosts.clear();
  }
  async setEmbeddedModuleEnabled(moduleId, enabled) {
    const moduleDef = EMBEDDED_MODULES.find((m) => m.id === moduleId);
    if (!moduleDef) return;
    const current = this.dataStore.embeddedModules[moduleId] ?? { enabled: moduleDef.defaultEnabled };
    if (current.enabled === enabled) return;
    this.dataStore.embeddedModules[moduleId] = { ...current, enabled };
    await this.saveData(this.dataStore);
    if (enabled) {
      if (!this.embeddedHosts.has(moduleId)) {
        const host = new SubPluginHost(this.getModuleBackend(), moduleId);
        this.embeddedHosts.set(moduleId, host);
        try {
          await moduleDef.load(host);
        } catch (error) {
          this.embeddedHosts.delete(moduleId);
          host.destroy();
          console.error(`[feishu-doc-toolbar] \u542F\u52A8\u5185\u5D4C\u6A21\u5757 ${moduleId} \u5931\u8D25`, error);
          new import_obsidian5.Notice(`\u5185\u5D4C\u529F\u80FD\u300C${moduleDef.displayName}\u300D\u542F\u52A8\u5931\u8D25`);
        }
      }
    } else {
      const host = this.embeddedHosts.get(moduleId);
      if (host) {
        try {
          host.destroy();
        } catch (error) {
          console.error(`[feishu-doc-toolbar] \u5378\u8F7D\u5185\u5D4C\u6A21\u5757 ${moduleId} \u5931\u8D25`, error);
        }
        this.embeddedHosts.delete(moduleId);
      }
    }
  }
  registerCommands() {
    this.addCommand({
      id: "open-insert-panel",
      name: "\u6253\u5F00\u98DE\u4E66\u63D2\u5165\u9762\u677F",
      callback: () => {
        void this.openInsertPanelFromActiveEditor();
      }
    });
    this.addCommand({
      id: "open-template-panel",
      name: "\u6253\u5F00\u6A21\u677F\u5E93\u9762\u677F",
      callback: () => {
        void this.openTemplatePanelFromActiveEditor();
      }
    });
    this.addCommand({
      id: "open-table-panel",
      name: "\u6253\u5F00\u8868\u683C\u64CD\u4F5C\u9762\u677F",
      callback: () => {
        void this.openTablePanelFromActiveEditor();
      }
    });
  }
  async openInsertPanelFromActiveEditor() {
    const context = this.getActiveEditorBlockContext();
    if (!context) {
      new import_obsidian5.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u7F16\u8F91\u4F4D\u7F6E");
      return;
    }
    this.activeContext = context;
    this.renderHandle(context);
    this.showInsertPanel(context);
  }
  async openTemplatePanelFromActiveEditor() {
    const context = this.getActiveEditorBlockContext();
    if (!context) {
      new import_obsidian5.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u7F16\u8F91\u4F4D\u7F6E");
      return;
    }
    this.activeContext = context;
    this.renderHandle(context);
    await this.showTemplateMenu(context);
  }
  async openTablePanelFromActiveEditor() {
    const context = this.getActiveEditorBlockContext();
    if (!context) {
      new import_obsidian5.Notice("\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u7F16\u8F91\u4F4D\u7F6E");
      return;
    }
    this.activeContext = context;
    this.renderHandle(context);
    await this.showTableMenu(context);
  }
  getActiveEditorBlockContext() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (!view?.file) return null;
    const editor = view.editor;
    const cmView = editor?.cm;
    if (!editor || !cmView) return null;
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : null;
    const line = Math.max(0, cursor?.line ?? 0);
    const blockEl = this.findBlockElementForLine(view, cmView, line);
    if (!blockEl) return null;
    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) return enhancedTableContext;
    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line)
    };
  }
  getEditorBlockContext(view, editor) {
    const cmView = editor?.cm;
    if (!view?.file || !editor || !cmView) return null;
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : null;
    const line = Math.max(0, cursor?.line ?? 0);
    const blockEl = this.findBlockElementForLine(view, cmView, line);
    if (!blockEl) return null;
    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) return enhancedTableContext;
    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line)
    };
  }
  handleSlashTrigger(editor, info) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (!view?.file || !editor?.cm || typeof editor.getCursor !== "function" || typeof editor.getLine !== "function") {
      return;
    }
    const cursor = editor.getCursor();
    const line = Math.max(0, cursor?.line ?? 0);
    const currentLine = String(editor.getLine(line) ?? "");
    const trimmed = currentLine.trim();
    const normalizedFilePath = view.file.path;
    if (trimmed === "/") {
      if (this.slashTrigger?.filePath === normalizedFilePath && this.slashTrigger?.line === line) {
        return;
      }
      const context = this.getEditorBlockContext(view, editor);
      if (!context || context.kind === "table") return;
      this.activeContext = context;
      this.renderHandle(context);
      this.slashTrigger = { filePath: normalizedFilePath, line };
      this.showInsertPanel(context);
      return;
    }
    if (this.slashTrigger && this.slashTrigger.filePath === normalizedFilePath && this.slashTrigger.line === line) {
      this.slashTrigger = null;
    }
    void info;
  }
  extendEditorMenu(menu, editor, view) {
    const context = this.getEditorBlockContext(view, editor);
    if (!context) return;
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle("\u6253\u5F00\u98DE\u4E66\u63D2\u5165\u9762\u677F");
      item.onClick(() => {
        this.activeContext = context;
        this.renderHandle(context);
        this.showInsertPanel(context);
      });
    });
    menu.addItem((item) => {
      item.setTitle("\u6253\u5F00\u6A21\u677F\u5E93\u9762\u677F");
      item.onClick(() => {
        this.activeContext = context;
        this.renderHandle(context);
        void this.showTemplateMenu(context);
      });
    });
    if (context.kind === "table") {
      menu.addItem((item) => {
        item.setTitle("\u5BF9\u5F53\u524D\u8868\u683C\u7F8E\u5316");
        item.onClick(() => {
          void this.executeCommandById(ENHANCED_TABLE_COMMANDS.initializeNativeLayout);
        });
      });
      menu.addItem((item) => {
        item.setTitle("\u9AD8\u4EAE");
        item.onClick(() => {
          this.toggleMarkdownHighlight(context);
        });
      });
      menu.addItem((item) => {
        item.setTitle("\u6253\u5F00\u8868\u683C\u64CD\u4F5C\u9762\u677F");
        item.onClick(() => {
          this.activeContext = context;
          this.renderHandle(context);
          void this.showTableMenu(context);
        });
      });
    }
  }
  normalizeData(value) {
    const saved = value && typeof value === "object" ? value : {};
    return {
      ...DEFAULT_DATA,
      templateFolderPath: normalizeTemplateFolderPath(saved.templateFolderPath),
      templateUngroupedLabel: typeof saved.templateUngroupedLabel === "string" && saved.templateUngroupedLabel.trim() ? saved.templateUngroupedLabel.trim().slice(0, 32) : DEFAULT_DATA.templateUngroupedLabel,
      recentTemplatePaths: Array.isArray(saved.recentTemplatePaths) ? saved.recentTemplatePaths.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => normalizeRecentTemplatePath(item)) : [],
      toolbarActionOrder: this.normalizeToolbarActionOrder(saved.toolbarActionOrder),
      managedPluginAliases: this.normalizePluginTextMap(saved.managedPluginAliases),
      managedPluginNotes: this.normalizePluginTextMap(saved.managedPluginNotes),
      managedPluginCategories: this.normalizePluginTextMap(saved.managedPluginCategories),
      managedPluginCategoryNames: this.normalizePluginTextMap(saved.managedPluginCategoryNames),
      managedPluginCategoryOrder: this.normalizePluginCategoryOrder(
        saved.managedPluginCategoryOrder,
        saved.managedPluginCategoryNames,
        saved.managedPluginCategoryRemoved
      ),
      managedPluginStatusCheckedAt: Number.isFinite(saved.managedPluginStatusCheckedAt) ? Number(saved.managedPluginStatusCheckedAt) : 0,
      enableBetaFeatures: this.resolveEnableBetaFeatures(saved),
      showOneNoteImport: false,
      showTableEnhancerEntrances: false,
      showDraggerIntegrationStatus: saved.showDraggerIntegrationStatus !== false,
      embeddedModules: this.normalizeEmbeddedModulesData(saved.embeddedModules),
      settingsTabOrder: this.normalizeSettingsTabOrder(saved.settingsTabOrder),
      managedPluginCategoryRemoved: this.normalizePluginCategoryRemoved(saved.managedPluginCategoryRemoved)
    };
    return this.applyBetaFeatureFlags(data);
  }
  resolveEnableBetaFeatures(saved) {
    if (saved.enableBetaFeatures === true) return true;
    if (saved.showTableEnhancerEntrances === true || saved.showOneNoteImport === true) return true;
    const tableEnhancer = this.app?.plugins?.plugins?.[MARKDOWN_TABLE_PLUGIN_ID];
    return !!(tableEnhancer?.dataStore?.experimentalFeatureGate ?? tableEnhancer?.data?.experimentalFeatureGate ?? tableEnhancer?.settings?.experimentalFeatureGate);
  }
  applyBetaFeatureFlags(data2) {
    const enabled = !!data2.enableBetaFeatures;
    return {
      ...data2,
      enableBetaFeatures: enabled,
      showTableEnhancerEntrances: enabled,
      showOneNoteImport: enabled
    };
  }
  isBetaFeaturesEnabled() {
    return !!this.dataStore.enableBetaFeatures;
  }
  async setBetaFeaturesEnabled(value) {
    this.dataStore = this.applyBetaFeatureFlags({
      ...this.dataStore,
      enableBetaFeatures: value
    });
    await this.saveData(this.dataStore);
    await this.syncExperimentalFeatureGateToTableEnhancer(value);
    if (!value) {
      for (const moduleId of BETA_ONLY_MODULE_IDS) {
        if (this.isEmbeddedModuleEnabled(moduleId)) {
          await this.setEmbeddedModuleEnabled(moduleId, false);
        }
      }
    }
  }
  async syncExperimentalFeatureGateToTableEnhancer(enabled) {
    const tableEnhancer = this.app?.plugins?.plugins?.[MARKDOWN_TABLE_PLUGIN_ID];
    if (!tableEnhancer) return;
    if (typeof tableEnhancer.setExperimentalFeatureGate === "function") {
      await tableEnhancer.setExperimentalFeatureGate(enabled);
      return;
    }
    if (tableEnhancer.dataStore && typeof tableEnhancer.savePluginData === "function") {
      tableEnhancer.dataStore.experimentalFeatureGate = enabled;
      await tableEnhancer.savePluginData();
    }
  }
  normalizeSettingsTabOrder(value) {
    const allowed = new Set(DEFAULT_SETTINGS_TAB_ORDER);
    const source = Array.isArray(value) ? value : [];
    const result = [];
    for (const item of source) {
      if (typeof item !== "string" || !allowed.has(item)) continue;
      if (result.includes(item)) continue;
      result.push(item);
    }
    for (const tabId of DEFAULT_SETTINGS_TAB_ORDER) {
      if (!result.includes(tabId)) result.push(tabId);
    }
    return result;
  }
  normalizePluginCategoryRemoved(value) {
    if (!Array.isArray(value)) return [];
    return value.filter((item) => typeof item === "string" && /^[a-zA-Z0-9._-]+$/.test(item));
  }
  normalizeEmbeddedModulesData(value) {
    const result = {};
    if (!value || typeof value !== "object") return result;
    for (const [id, entry] of Object.entries(value)) {
      if (!/^[a-zA-Z0-9._-]+$/.test(id)) continue;
      if (!entry || typeof entry !== "object") continue;
      const enabled = entry.enabled !== false;
      const data2 = entry.data;
      result[id] = { enabled, data: data2 };
    }
    return result;
  }
  normalizePluginTextMap(value) {
    const source = value && typeof value === "object" ? value : {};
    const result = {};
    for (const [id, text] of Object.entries(source)) {
      if (!/^[a-zA-Z0-9._-]+$/.test(id) || typeof text !== "string") continue;
      const normalized = text.trim().slice(0, 80);
      if (normalized) result[id] = normalized;
    }
    return result;
  }
  normalizePluginCategoryOrder(orderValue, namesValue, removedValue) {
    const removed = new Set(this.normalizePluginCategoryRemoved(removedValue));
    const defaults = DEFAULT_MANAGED_PLUGIN_CATEGORIES.map((category) => category.id).filter((id) => !removed.has(id));
    const customNames = namesValue && typeof namesValue === "object" ? Object.keys(namesValue) : [];
    const source = Array.isArray(orderValue) ? orderValue.filter((id) => typeof id === "string" && !removed.has(id)) : [];
    const seed = source.length > 0 ? source : defaults;
    const result = [];
    for (const id of [...seed, ...customNames]) {
      if (typeof id !== "string" || !/^[a-zA-Z0-9._-]+$/.test(id) || removed.has(id) || result.includes(id)) continue;
      result.push(id);
    }
    if (!result.includes(MANAGED_PLUGIN_FALLBACK_CATEGORY_ID)) {
      result.push(MANAGED_PLUGIN_FALLBACK_CATEGORY_ID);
    }
    return result;
  }
  getOrderedSettingsTabs() {
    const tabMap = new Map(EXPERIENCE_SETTINGS_TABS.map((tab) => [tab.id, tab]));
    return this.dataStore.settingsTabOrder.map((id) => tabMap.get(id)).filter((tab) => Boolean(tab));
  }
  async updateSettingsTabOrder(order) {
    this.dataStore.settingsTabOrder = this.normalizeSettingsTabOrder(order);
    await this.saveData(this.dataStore);
  }
  async moveSettingsTab(sourceId, targetId) {
    if (sourceId === targetId) return false;
    const order = [...this.dataStore.settingsTabOrder];
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return false;
    order.splice(from, 1);
    order.splice(to, 0, sourceId);
    await this.updateSettingsTabOrder(order);
    return true;
  }
  async updateManagementSetting(key, value) {
    this.dataStore = { ...this.dataStore, [key]: value };
    await this.saveData(this.dataStore);
  }
  normalizeToolbarActionOrder(value) {
    if (!Array.isArray(value)) return [];
    const allowed = new Set(this.getDefaultSortableToolbarActions());
    const result = [];
    for (const item of value) {
      if (typeof item !== "string" || !allowed.has(item) || result.includes(item)) continue;
      result.push(item);
    }
    return result;
  }
  getDefaultSortableToolbarActions() {
    return this.getDefaultStableQuickActionGroupsForContext("paragraph").flatMap((group) => group.items.map((item) => item.action));
  }
  orderToolbarItems(items) {
    const order = this.dataStore.toolbarActionOrder;
    if (order.length === 0) return items;
    const orderMap = new Map(order.map((action, index) => [action, index]));
    return [...items].sort((a, b) => {
      const aIndex = orderMap.get(a.action) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderMap.get(b.action) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return items.indexOf(a) - items.indexOf(b);
    });
  }
  applyToolbarActionOrder(groups) {
    return groups.map((group) => ({
      ...group,
      items: this.orderToolbarItems(group.items)
    }));
  }
  getSortableToolbarGroups() {
    return this.applyToolbarActionOrder(this.getDefaultStableQuickActionGroupsForContext("paragraph"));
  }
  buildSettingsToolbarPreview(onReorder) {
    const preview = document.createElement("div");
    preview.className = "fdtb-popover fdtb-settings-toolbar-preview";
    const section = document.createElement("section");
    section.className = "fdtb-section";
    const groups = this.getSortableToolbarGroups();
    groups.forEach((group, index) => {
      if (index > 0) {
        section.appendChild(this.createPopoverDivider());
      }
      section.appendChild(
        this.createActionGroup(group, {
          sortable: true,
          onReorder
        })
      );
    });
    preview.appendChild(section);
    return preview;
  }
  async moveToolbarAction(sourceAction, targetAction, options) {
    const defaultActions = this.getDefaultSortableToolbarActions();
    const sourceGroup = this.getDefaultStableQuickActionGroupsForContext("paragraph").find(
      (group) => group.items.some((item) => item.action === sourceAction)
    );
    const targetGroup = this.getDefaultStableQuickActionGroupsForContext("paragraph").find(
      (group) => group.items.some((item) => item.action === targetAction)
    );
    if (!sourceGroup || !targetGroup || sourceGroup.label !== targetGroup.label) return false;
    const currentOrder = this.normalizeToolbarActionOrder([
      ...this.dataStore.toolbarActionOrder,
      ...defaultActions.filter((action) => !this.dataStore.toolbarActionOrder.includes(action))
    ]);
    const sourceIndex = currentOrder.indexOf(sourceAction);
    const targetIndex = currentOrder.indexOf(targetAction);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;
    currentOrder.splice(sourceIndex, 1);
    currentOrder.splice(targetIndex, 0, sourceAction);
    this.dataStore = { ...this.dataStore, toolbarActionOrder: currentOrder };
    await this.saveData(this.dataStore);
    if (options?.keepPopover !== false) {
      this.refreshOpenToolbarPopover();
    }
    return true;
  }
  async resetToolbarActionOrder(options) {
    this.dataStore = { ...this.dataStore, toolbarActionOrder: [] };
    await this.saveData(this.dataStore);
    if (options?.keepPopover !== false) {
      this.refreshOpenToolbarPopover();
    }
  }
  refreshOpenToolbarPopover() {
    if (!this.popoverEl || !this.activeContext) {
      this.hidePopover();
      return;
    }
    const context = this.activeContext;
    this.showPopover(context);
  }
  getManagedPluginStatus(pluginId) {
    const pluginManager = this.app?.plugins;
    const enabledPlugins = pluginManager?.plugins ?? {};
    const manifests = pluginManager?.manifests ?? {};
    const enabled = Boolean(enabledPlugins[pluginId]);
    const installed = enabled || Boolean(manifests[pluginId]);
    return { installed, enabled };
  }
  getHostedPluginItems() {
    const pluginManager = this.app?.plugins;
    const enabledPlugins = pluginManager?.plugins ?? {};
    const manifests = pluginManager?.manifests ?? {};
    const ids = /* @__PURE__ */ new Set(["feishu-doc-toolbar", ...Object.keys(manifests), ...Object.keys(enabledPlugins)]);
    return Array.from(ids).map((id) => {
      const manifest = manifests[id] ?? enabledPlugins[id]?.manifest ?? {};
      const enabled = id === "feishu-doc-toolbar" || Boolean(enabledPlugins[id]);
      const installed = enabled || Boolean(manifests[id]);
      const originalName = id === "feishu-doc-toolbar" ? "Obsidian\u589E\u5F3A\u4F53\u9A8C" : String(manifest.name ?? id);
      const alias = this.dataStore.managedPluginAliases[id] ?? "";
      const note = this.dataStore.managedPluginNotes[id] ?? "";
      return {
        id,
        name: alias || originalName,
        originalName,
        alias,
        note,
        version: String(manifest.version ?? ""),
        installed,
        enabled,
        toggleable: id !== "feishu-doc-toolbar" && installed,
        status: enabled ? "\u5DF2\u542F\u7528" : installed ? "\u5DF2\u5B89\u88C5\u672A\u542F\u7528" : "\u672A\u5B89\u88C5",
        description: HOSTED_PLUGIN_DESCRIPTIONS[id] ?? "\u5DF2\u5B89\u88C5\u63D2\u4EF6\uFF0C\u5F53\u524D\u4EC5\u505A\u72B6\u6001\u5C55\u793A"
      };
    }).sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });
  }
  getManagedPluginCategories() {
    const defaultMap = new Map(DEFAULT_MANAGED_PLUGIN_CATEGORIES.map((category) => [category.id, category.name]));
    const ids = this.normalizePluginCategoryOrder(
      this.dataStore.managedPluginCategoryOrder,
      this.dataStore.managedPluginCategoryNames,
      this.dataStore.managedPluginCategoryRemoved
    );
    return ids.map((id) => ({
      id,
      name: this.dataStore.managedPluginCategoryNames[id] || defaultMap.get(id) || id
    }));
  }
  getManagedPluginCategoryMoveOptions() {
    return this.getManagedPluginCategories().map((category) => ({
      value: category.id,
      label: category.name
    }));
  }
  getHostedPluginCategorySections() {
    const categories = this.getManagedPluginCategories();
    const categoryIds = new Set(categories.map((category) => category.id));
    const buckets = new Map(categories.map((category) => [category.id, []]));
    for (const item of this.getHostedPluginItems()) {
      const assigned = this.dataStore.managedPluginCategories[item.id];
      const categoryId = assigned && categoryIds.has(assigned) ? assigned : this.inferManagedPluginCategory(item);
      const safeCategoryId = categoryIds.has(categoryId) ? categoryId : MANAGED_PLUGIN_FALLBACK_CATEGORY_ID;
      if (!buckets.has(safeCategoryId)) buckets.set(safeCategoryId, []);
      buckets.get(safeCategoryId)?.push(item);
    }
    return categories.map((category) => ({
      category,
      items: buckets.get(category.id) ?? []
    }));
  }
  inferManagedPluginCategory(item) {
    const id = item.id.toLowerCase();
    const text = `${item.name} ${item.originalName} ${item.description}`.toLowerCase();
    if (id.includes("table") || id.includes("univer") || id.includes("excel")) return "table";
    if (id.includes("dragger") || id.includes("block-link")) return "block";
    if (id.includes("task") || id.includes("calendar") || id.includes("recent")) return "automation";
    if (id.includes("html") || id.includes("reader") || id.includes("clipper")) return "content";
    if (id.includes("style") || id.includes("wide") || id.includes("setting")) return "style";
    if (id.includes("image") || id.includes("copy") || id.includes("localizer") || text.includes("\u56FE\u7247")) return "file";
    if (id.includes("claudian") || id.includes("yolo") || id.includes("textgenerator") || text.includes("ai")) return "ai";
    return MANAGED_PLUGIN_FALLBACK_CATEGORY_ID;
  }
  async createManagedPluginCategory(name) {
    const normalizedName = name.trim().slice(0, 30);
    if (!normalizedName) return false;
    const id = `custom_${Date.now().toString(36)}`;
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategoryNames: {
        ...this.dataStore.managedPluginCategoryNames,
        [id]: normalizedName
      },
      managedPluginCategoryOrder: [
        ...this.normalizePluginCategoryOrder(
          this.dataStore.managedPluginCategoryOrder,
          this.dataStore.managedPluginCategoryNames,
          this.dataStore.managedPluginCategoryRemoved
        ),
        id
      ]
    };
    await this.saveData(this.dataStore);
    new import_obsidian5.Notice(`\u5DF2\u521B\u5EFA\u5206\u7C7B\uFF1A${normalizedName}`);
    return true;
  }
  async renameManagedPluginCategory(categoryId, newName) {
    const safe = newName.trim().slice(0, 30);
    if (!safe || !/^[a-zA-Z0-9._-]+$/.test(categoryId)) {
      new import_obsidian5.Notice("\u5206\u7C7B\u540D\u79F0\u65E0\u6548");
      return false;
    }
    const exists = this.getManagedPluginCategories().some((category) => category.id === categoryId);
    if (!exists) {
      new import_obsidian5.Notice("\u5206\u7C7B\u4E0D\u5B58\u5728");
      return false;
    }
    const current = this.getManagedPluginCategories().find((category) => category.id === categoryId);
    if (current?.name === safe) return true;
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategoryNames: {
        ...this.dataStore.managedPluginCategoryNames,
        [categoryId]: safe
      }
    };
    await this.saveData(this.dataStore);
    new import_obsidian5.Notice(`\u5206\u7C7B\u5DF2\u6539\u540D\u4E3A\uFF1A${safe}`);
    return true;
  }
  async deleteManagedPluginCategory(categoryId) {
    if (!/^[a-zA-Z0-9._-]+$/.test(categoryId)) return false;
    if (categoryId === MANAGED_PLUGIN_FALLBACK_CATEGORY_ID) {
      new import_obsidian5.Notice("\u300C\u5176\u4ED6\u63D2\u4EF6\u300D\u662F\u7CFB\u7EDF\u9ED8\u8BA4\u5206\u7C7B\uFF0C\u4E0D\u80FD\u5220\u9664");
      return false;
    }
    const categories = this.getManagedPluginCategories();
    if (categories.length <= 1) {
      new import_obsidian5.Notice("\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u5206\u7C7B");
      return false;
    }
    const section = this.getHostedPluginCategorySections().find((entry) => entry.category.id === categoryId);
    const items = section?.items ?? [];
    const displayName = section?.category.name ?? categoryId;
    const fallbackName = this.getManagedPluginCategories().find((category) => category.id === MANAGED_PLUGIN_FALLBACK_CATEGORY_ID)?.name ?? "\u5176\u4ED6\u63D2\u4EF6";
    const confirmMessage = items.length === 0 ? `\u786E\u5B9A\u5220\u9664\u5206\u7C7B\u300C${displayName}\u300D\uFF1F` : `\u5206\u7C7B\u300C${displayName}\u300D\u5185\u6709 ${items.length} \u4E2A\u63D2\u4EF6\uFF0C\u5220\u9664\u540E\u63D2\u4EF6\u5C06\u79FB\u81F3\u300C${fallbackName}\u300D\uFF0C\u786E\u5B9A\u5417\uFF1F`;
    if (!confirmUserAction(confirmMessage)) return false;
    const nextCategories = { ...this.dataStore.managedPluginCategories };
    for (const item of items) {
      nextCategories[item.id] = MANAGED_PLUGIN_FALLBACK_CATEGORY_ID;
    }
    const nextNames = { ...this.dataStore.managedPluginCategoryNames };
    delete nextNames[categoryId];
    const nextRemoved = Array.from(/* @__PURE__ */ new Set([...this.dataStore.managedPluginCategoryRemoved, categoryId]));
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategories: nextCategories,
      managedPluginCategoryNames: nextNames,
      managedPluginCategoryRemoved: nextRemoved,
      managedPluginCategoryOrder: this.normalizePluginCategoryOrder(
        this.dataStore.managedPluginCategoryOrder.filter((id) => id !== categoryId),
        nextNames,
        nextRemoved
      )
    };
    await this.saveData(this.dataStore);
    new import_obsidian5.Notice(`\u5DF2\u5220\u9664\u5206\u7C7B\uFF1A${displayName}`);
    return true;
  }
  async moveManagedPluginToCategory(pluginId, categoryId) {
    if (!/^[a-zA-Z0-9._-]+$/.test(pluginId) || !/^[a-zA-Z0-9._-]+$/.test(categoryId)) return false;
    const categoryIds = new Set(this.getManagedPluginCategories().map((category) => category.id));
    if (!categoryIds.has(categoryId)) return false;
    const current = this.dataStore.managedPluginCategories[pluginId];
    if (current === categoryId) return true;
    this.dataStore = {
      ...this.dataStore,
      managedPluginCategories: {
        ...this.dataStore.managedPluginCategories,
        [pluginId]: categoryId
      }
    };
    await this.saveData(this.dataStore);
    const label = this.getManagedPluginCategories().find((category) => category.id === categoryId)?.name ?? categoryId;
    new import_obsidian5.Notice(`\u5DF2\u79FB\u5230\uFF1A${label}`);
    return true;
  }
  async refreshManagedPluginStatus(options = {}) {
    this.dataStore = { ...this.dataStore, managedPluginStatusCheckedAt: Date.now() };
    await this.saveData(this.dataStore);
    this.applyManagedPluginAliasesToSettingsSidebar();
    if (!options.silent) new import_obsidian5.Notice("\u5DF2\u5237\u65B0\u7B2C\u4E09\u65B9\u63D2\u4EF6\u72B6\u6001");
  }
  getPluginStatusMonitorDescription() {
    const checkedAt = this.dataStore.managedPluginStatusCheckedAt;
    if (!checkedAt) return "\u8FDB\u5165\u672C\u9875\u4F1A\u81EA\u52A8\u8BFB\u53D6 Obsidian \u5F53\u524D\u63D2\u4EF6\u72B6\u6001\uFF1B\u53F3\u4FA7\u5F00\u5173\u7528\u4E8E\u542F\u7528\u6216\u5173\u95ED\u63D2\u4EF6";
    return `\u8FDB\u5165\u672C\u9875\u81EA\u52A8\u8BFB\u53D6 Obsidian \u5F53\u524D\u63D2\u4EF6\u72B6\u6001\uFF1B\u4E0A\u6B21\u81EA\u52A8\u76D1\u6D4B\uFF1A${new Date(checkedAt).toLocaleString()}`;
  }
  async setManagedPluginEnabled(pluginId, enabled) {
    if (!/^[a-zA-Z0-9._-]+$/.test(pluginId)) return false;
    if (pluginId === "feishu-doc-toolbar") {
      new import_obsidian5.Notice("Obsidian\u589E\u5F3A\u4F53\u9A8C\u4E0D\u80FD\u5728\u81EA\u8EAB\u8BBE\u7F6E\u9875\u5173\u95ED");
      return false;
    }
    const pluginManager = this.app?.plugins;
    const status = this.getManagedPluginStatus(pluginId);
    if (!status.installed) {
      new import_obsidian5.Notice("\u8FD9\u4E2A\u63D2\u4EF6\u672A\u5B89\u88C5\uFF0C\u4E0D\u80FD\u5207\u6362\u542F\u7528\u72B6\u6001");
      return false;
    }
    if (status.enabled === enabled) {
      await this.refreshManagedPluginStatus({ silent: true });
      return true;
    }
    if (enabled) {
      if (typeof pluginManager?.enablePluginAndSave === "function") {
        await pluginManager.enablePluginAndSave(pluginId);
      } else if (typeof pluginManager?.enablePlugin === "function") {
        await pluginManager.enablePlugin(pluginId);
      } else {
        throw new Error("\u5F53\u524D Obsidian \u672A\u66B4\u9732\u542F\u7528\u63D2\u4EF6\u63A5\u53E3");
      }
    } else if (typeof pluginManager?.disablePluginAndSave === "function") {
      await pluginManager.disablePluginAndSave(pluginId);
    } else if (typeof pluginManager?.disablePlugin === "function") {
      await pluginManager.disablePlugin(pluginId);
    } else {
      throw new Error("\u5F53\u524D Obsidian \u672A\u66B4\u9732\u5173\u95ED\u63D2\u4EF6\u63A5\u53E3");
    }
    await this.refreshManagedPluginStatus({ silent: true });
    new import_obsidian5.Notice(`${enabled ? "\u5DF2\u542F\u7528" : "\u5DF2\u5173\u95ED"}\uFF1A${pluginId}`);
    return true;
  }
  async updateManagedPluginAlias(pluginId, alias) {
    const previousAlias = this.dataStore.managedPluginAliases[pluginId] ?? "";
    await this.updateManagedPluginTextMap("managedPluginAliases", pluginId, alias);
    this.applyManagedPluginAliasesToSettingsSidebar(pluginId, previousAlias);
  }
  async updateManagedPluginNote(pluginId, note) {
    await this.updateManagedPluginTextMap("managedPluginNotes", pluginId, note);
  }
  async updateManagedPluginTextMap(key, pluginId, value) {
    if (!/^[a-zA-Z0-9._-]+$/.test(pluginId)) return;
    const nextMap = { ...this.dataStore[key] };
    const text = value.trim().slice(0, 80);
    if (text) nextMap[pluginId] = text;
    else delete nextMap[pluginId];
    this.dataStore = { ...this.dataStore, [key]: nextMap };
    await this.saveData(this.dataStore);
  }
  getNativeColorSettingsForManager() {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.getNativeColorSettingsForManager !== "function") return null;
    return enhancer.getNativeColorSettingsForManager();
  }
  async updateNativeColorSettingsFromManager(input) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.updateNativeColorSettingsFromManager !== "function") {
      new import_obsidian5.Notice("\u539F\u751F\u8868\u683C\u589E\u5F3A\u63D2\u4EF6\u672A\u63A5\u901A");
      return null;
    }
    const result = await enhancer.updateNativeColorSettingsFromManager(input);
    new import_obsidian5.Notice("\u5DF2\u66F4\u65B0\u539F\u751F\u8868\u683C\u9ED8\u8BA4\u914D\u8272");
    return result;
  }
  async saveCurrentNativeColorPaletteAsManager(label) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.saveCurrentNativeColorPaletteAsManager !== "function") {
      new import_obsidian5.Notice("\u539F\u751F\u8868\u683C\u589E\u5F3A\u63D2\u4EF6\u672A\u63A5\u901A");
      return null;
    }
    return await enhancer.saveCurrentNativeColorPaletteAsManager(label);
  }
  async deleteNativeColorPaletteFromManager(id) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.deleteNativeColorPaletteFromManager !== "function") {
      new import_obsidian5.Notice("\u539F\u751F\u8868\u683C\u589E\u5F3A\u63D2\u4EF6\u672A\u63A5\u901A");
      return null;
    }
    return await enhancer.deleteNativeColorPaletteFromManager(id);
  }
  applyManagedPluginAliasesToSettingsSidebar(targetPluginId, previousAlias) {
    if (typeof document === "undefined") return;
    const items = Array.from(document.querySelectorAll(".vertical-tab-nav-item"));
    if (items.length === 0) return;
    for (const item of this.getHostedPluginItems()) {
      if (targetPluginId && item.id !== targetPluginId) continue;
      for (const el of items) {
        const text = el.textContent?.trim() ?? "";
        if (text !== item.originalName && text !== item.alias && text !== previousAlias) continue;
        el.textContent = item.alias || item.originalName;
        el.title = `${item.originalName} \xB7 ${item.id}`;
      }
    }
  }
  async runManagedCommand(commandId) {
    return this.executeCommandById(commandId);
  }
  ensureHandle() {
    if (this.handleEl) return;
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "fdtb-handle";
    handle.setAttribute("aria-label", "\u6253\u5F00\u5757\u5DE5\u5177");
    handle.title = "\u6253\u5F00\u5757\u5DE5\u5177";
    handle.innerHTML = `<span class="fdtb-handle-text">T</span>`;
    handle.style.display = "none";
    handle.addEventListener("pointerenter", () => this.clearHideTimer());
    handle.addEventListener("pointerleave", () => {
      if (!this.popoverEl) this.scheduleHideToolbar();
    });
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    handle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.togglePopover();
    });
    document.body.appendChild(handle);
    this.handleEl = handle;
  }
  schedulePointerUpdate(event) {
    if (this.rafHandle !== null) {
      window.cancelAnimationFrame(this.rafHandle);
    }
    this.rafHandle = window.requestAnimationFrame(() => {
      this.rafHandle = null;
      this.handlePointerMove(event);
    });
  }
  handlePointerMove(event) {
    const target = event.target;
    if (!target) {
      this.scheduleHideToolbar();
      return;
    }
    if (target.closest(".fdtb-handle, .fdtb-popover, .fdtb-submenu")) {
      this.clearHideTimer();
      return;
    }
    const draggerContext = this.getDraggerToolbarContext(target);
    if (draggerContext) {
      this.clearHideTimer();
      this.activeContext = draggerContext;
      this.renderHandle(draggerContext);
      return;
    }
    if (this.isTableTarget(target)) {
      this.hideToolbar(true);
      return;
    }
    const context = this.getOrdinaryToolbarContext(target);
    if (!context) {
      this.scheduleHideToolbar();
      return;
    }
    this.clearHideTimer();
    this.activeContext = context;
    this.renderHandle(context);
  }
  handlePointerDown(event) {
    const target = event.target;
    if (!target || target.closest(".fdtb-handle, .fdtb-popover, .fdtb-submenu")) return;
    if (this.isTableTarget(target)) {
      this.hideToolbar(true);
      return;
    }
    if (this.popoverEl) {
      this.hideToolbar(true);
      return;
    }
    const context = this.getOrdinaryToolbarContext(target);
    if (!context) {
      this.hideToolbar(true);
      return;
    }
    this.clearHideTimer();
    this.activeContext = context;
    this.renderHandle(context);
  }
  handleEditorClick(event) {
    const target = event.target;
    if (!target || target.closest(".fdtb-handle, .fdtb-popover, .fdtb-submenu")) return;
    if (this.isTableTarget(target)) {
      this.hideToolbar(true);
      return;
    }
    if (this.popoverEl) {
      this.hideToolbar(true);
      return;
    }
    window.setTimeout(() => {
      const context = this.getCursorOrdinaryToolbarContext(target);
      if (!context) {
        this.hideToolbar(true);
        return;
      }
      this.clearHideTimer();
      this.activeContext = context;
      this.renderHandle(context);
    }, 0);
  }
  handleDocumentKeydown(event) {
    if (event.key !== "Escape" || !this.popoverEl) return;
    this.hideToolbar(true);
  }
  handleDocumentDoubleClick(event) {
    const target = event.target;
    const image = this.getNativeTableImageFromTarget(target);
    if (!image) return;
    event.preventDefault();
    event.stopPropagation();
    this.showNativeTableImagePreview(image);
  }
  getNativeTableImageFromTarget(target) {
    const image = target?.closest?.("img");
    if (!image) return null;
    const table = image.closest("table");
    if (!table) return null;
    if (table.classList.contains("mdtp-table-enhanced")) return null;
    return image;
  }
  showNativeTableImagePreview(sourceImage) {
    const source = sourceImage.currentSrc || sourceImage.src;
    if (!source) return;
    this.closeNativeTableImagePreview();
    const overlay = document.createElement("div");
    overlay.className = "fdtb-image-preview";
    overlay.tabIndex = -1;
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        this.closeNativeTableImagePreview();
      }
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeNativeTableImagePreview();
      }
    });
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "fdtb-image-preview-close";
    closeButton.setAttribute("aria-label", "\u5173\u95ED\u56FE\u7247\u9884\u89C8");
    closeButton.textContent = "\xD7";
    closeButton.addEventListener("click", () => this.closeNativeTableImagePreview());
    const image = document.createElement("img");
    image.className = "fdtb-image-preview-img";
    image.src = source;
    image.alt = sourceImage.alt || "";
    overlay.append(closeButton, image);
    document.body.appendChild(overlay);
    this.imagePreviewEl = overlay;
    overlay.focus();
  }
  closeNativeTableImagePreview() {
    this.imagePreviewEl?.remove();
    this.imagePreviewEl = null;
  }
  getBlockContext(target) {
    const view = this.getContainingMarkdownView(target);
    if (!view?.file || !this.isLivePreviewTarget(target, view)) return null;
    const editor = view.editor;
    const cmView = editor?.cm;
    if (!editor || typeof editor.getLine !== "function" || !cmView?.state?.doc?.lineAt) return null;
    const blockEl = this.findBlockElement(target, view);
    if (!blockEl) return null;
    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) {
      return enhancedTableContext;
    }
    let position = 0;
    try {
      position = cmView.posAtDOM(blockEl, 0);
    } catch {
      try {
        position = cmView.posAtDOM(target, 0);
      } catch {
        position = typeof editor.getCursor === "function" ? Math.max(0, editor.getCursor().line ?? 0) : 0;
        return {
          view,
          file: view.file,
          editor,
          cmView,
          blockEl,
          line: position,
          kind: this.getBlockKind(editor, position)
        };
      }
    }
    const line = Math.max(0, cmView.state.doc.lineAt(position).number - 1);
    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line)
    };
  }
  getCursorBlockContext(target) {
    const view = this.getContainingMarkdownView(target);
    if (!view?.file || !this.isLivePreviewTarget(target, view)) return null;
    const editor = view.editor;
    const cmView = editor?.cm;
    if (!editor || !cmView?.state?.doc?.lineAt) return null;
    const clickedBlock = this.findBlockElement(target, view);
    const enhancedTableContext = clickedBlock ? this.getEnhancedTableContext(view, editor, cmView, clickedBlock) : null;
    if (enhancedTableContext) {
      return enhancedTableContext;
    }
    if (clickedBlock) {
      try {
        const position = cmView.posAtDOM(clickedBlock, 0);
        const line2 = Math.max(0, cmView.state.doc.lineAt(position).number - 1);
        return {
          view,
          file: view.file,
          editor,
          cmView,
          blockEl: clickedBlock,
          line: line2,
          kind: this.getBlockKind(editor, line2)
        };
      } catch {
      }
    }
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : null;
    const line = Math.max(0, cursor?.line ?? 0);
    const blockEl = this.findBlockElementForLine(view, cmView, line);
    if (!blockEl) return null;
    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line)
    };
  }
  getOrdinaryToolbarContext(target) {
    const context = this.getBlockContext(target);
    return this.shouldShowOrdinaryToolbarForContext(context) ? context : null;
  }
  getCursorOrdinaryToolbarContext(target) {
    const context = this.getCursorBlockContext(target);
    return this.shouldShowOrdinaryToolbarForContext(context) ? context : null;
  }
  getDraggerToolbarContext(target) {
    const handle = target.closest(DRAGGER_HANDLE_SELECTOR);
    if (!handle) return null;
    const line = Number.parseInt(handle.dataset.blockStart ?? "", 10);
    if (!Number.isFinite(line) || line < 0) return null;
    const view = this.getContainingMarkdownView(handle);
    if (!view?.file) return null;
    const editor = view.editor;
    const cmView = editor?.cm;
    if (!editor || !cmView) return null;
    const blockEl = this.findBlockElementForLine(view, cmView, line);
    if (!blockEl) return null;
    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) return null;
    const context = {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line)
    };
    return this.shouldShowOrdinaryToolbarForContext(context) ? context : null;
  }
  getContainingMarkdownView(target) {
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (activeView?.contentEl instanceof HTMLElement && activeView.contentEl.contains(target)) {
      return activeView;
    }
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof import_obsidian5.MarkdownView)) continue;
      const contentEl = view.contentEl;
      if (contentEl instanceof HTMLElement && contentEl.contains(target)) {
        return view;
      }
    }
    return null;
  }
  isTableTarget(target) {
    return this.isWithinTableElement(target);
  }
  isLivePreviewTarget(target, view) {
    const contentEl = view.contentEl;
    if (!(contentEl instanceof HTMLElement) || !contentEl.contains(target)) return false;
    return !!target.closest(".markdown-source-view, .cm-editor, .cm-content");
  }
  findBlockElement(target, view) {
    const contentEl = view.contentEl;
    if (!contentEl) return null;
    for (const selector of ["table", "pre", "blockquote", ".callout"]) {
      const structuralBlock = target.closest(selector);
      if (structuralBlock && contentEl.contains(structuralBlock)) {
        return structuralBlock;
      }
    }
    const lineBlock = target.closest(
      [".HyperMD-header", ".HyperMD-list-line", ".HyperMD-quote", ".cm-line"].join(", ")
    );
    if (!lineBlock || !contentEl.contains(lineBlock)) return null;
    return lineBlock;
  }
  getEnhancedTableContext(view, editor, cmView, blockEl) {
    const tableEl = blockEl.closest("table.mdtp-table-shell");
    const tableId = tableEl?.dataset?.mdtpTableId?.trim();
    if (!tableEl || !tableId || !(view.contentEl instanceof HTMLElement) || !view.contentEl.contains(tableEl)) {
      return null;
    }
    const markerLine = this.findEnhancedTableMarkerLine(editor, tableId);
    if (markerLine === null) {
      return null;
    }
    const tableStartLine = this.findNextRenderableLine(editor, markerLine + 1);
    if (tableStartLine === null) {
      return null;
    }
    return {
      view,
      file: view.file,
      editor,
      cmView,
      blockEl: tableEl,
      line: tableStartLine,
      kind: "table"
    };
  }
  findEnhancedTableMarkerLine(editor, tableId) {
    const marker = `%% mdtp:${tableId} %%`;
    const lastLine = Math.max(0, editor.lineCount() - 1);
    for (let line = 0; line <= lastLine; line += 1) {
      if (String(editor.getLine(line) ?? "").trim() === marker) {
        return line;
      }
    }
    return null;
  }
  findBlockElementForLine(view, cmView, line) {
    const contentEl = view.contentEl;
    if (!contentEl) return null;
    const totalLines = Number(cmView?.state?.doc?.lines ?? 0);
    if (!totalLines) return null;
    const docLineNumber = Math.min(totalLines, Math.max(1, line + 1));
    const docLine = cmView.state.doc.line(docLineNumber);
    const positions = [docLine.from, Math.min(docLine.to, docLine.from + 1)];
    for (const pos of positions) {
      try {
        const domAtPos = cmView.domAtPos(pos);
        const node = domAtPos?.node instanceof HTMLElement ? domAtPos.node : domAtPos?.node?.parentElement instanceof HTMLElement ? domAtPos.node.parentElement : null;
        if (!node) continue;
        const block = this.findBlockElement(node, view);
        if (block && contentEl.contains(block)) {
          return block;
        }
      } catch {
        continue;
      }
    }
    return null;
  }
  renderHandle(context) {
    if (!this.handleEl) return;
    if (!this.shouldShowOrdinaryToolbarForContext(context)) {
      this.hideToolbar(true);
      return;
    }
    const draggerHandle = this.findDraggerHandleForContext(context);
    const rect = context.blockEl.getBoundingClientRect();
    if (draggerHandle) {
      const draggerRect = draggerHandle.getBoundingClientRect();
      const top2 = Math.max(64, draggerRect.top + Math.max(0, (draggerRect.height - COMPACT_HANDLE_SIZE) / 2));
      const left2 = Math.max(8, draggerRect.left - COMPACT_HANDLE_SIZE - 3);
      this.handleEl.dataset.fdtbIntegrated = "dragger";
      this.handleEl.style.left = `${left2}px`;
      this.handleEl.style.top = `${top2}px`;
      this.handleEl.style.display = "flex";
      return;
    }
    const top = Math.max(64, rect.top + Math.min(8, Math.max(0, (rect.height - HANDLE_SIZE) / 2)));
    const left = Math.max(12, rect.left - HANDLE_OFFSET);
    delete this.handleEl.dataset.fdtbIntegrated;
    this.handleEl.style.left = `${left}px`;
    this.handleEl.style.top = `${top}px`;
    this.handleEl.style.display = "flex";
  }
  findDraggerHandleForContext(context) {
    const contentEl = context.view?.contentEl;
    if (!(contentEl instanceof HTMLElement)) return null;
    const handles = Array.from(contentEl.querySelectorAll(DRAGGER_HANDLE_SELECTOR));
    for (const handle of handles) {
      if (handle.classList.contains("dnd-hidden")) continue;
      const start = Number.parseInt(handle.dataset.blockStart ?? "", 10);
      const end = Number.parseInt(handle.dataset.blockEnd ?? handle.dataset.blockStart ?? "", 10);
      if (!Number.isFinite(start)) continue;
      const safeEnd = Number.isFinite(end) ? end : start;
      if (context.line >= start && context.line <= safeEnd) {
        return handle;
      }
    }
    return null;
  }
  togglePopover() {
    if (!this.handleEl) return;
    const preferredContext = this.getPreferredToolbarContext();
    if (preferredContext) {
      this.activeContext = preferredContext;
      this.renderHandle(preferredContext);
    }
    if (!this.shouldShowOrdinaryToolbarForContext(this.activeContext)) {
      this.hideToolbar(true);
      return;
    }
    if (this.popoverEl) {
      this.hidePopover();
      return;
    }
    this.showPopover(this.activeContext);
  }
  getPreferredToolbarContext() {
    const fallbackContext = this.shouldShowOrdinaryToolbarForContext(this.activeContext) ? this.activeContext : null;
    const activeView = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    const activeElement = document.activeElement;
    if (!activeView?.file || !(activeView.contentEl instanceof HTMLElement) || !activeElement) {
      return fallbackContext;
    }
    const tableBlock = activeElement.closest("table");
    if (!tableBlock || !activeView.contentEl.contains(tableBlock)) {
      return fallbackContext;
    }
    return null;
  }
  showInsertPanel(context) {
    if (!this.shouldShowOrdinaryToolbarForContext(context)) {
      this.hideToolbar(true);
      return;
    }
    this.hidePopover();
    const popover = document.createElement("div");
    popover.className = "fdtb-popover fdtb-insert-panel";
    popover.addEventListener("pointerenter", () => this.clearHideTimer());
    popover.addEventListener("pointerleave", () => this.clearHideTimer());
    const quickGroups = this.getStableQuickActionGroupsForContext(context.kind);
    if (quickGroups.length > 0) {
      this.appendPopoverSection(popover, this.createPopoverSection("", quickGroups));
    }
    document.body.appendChild(popover);
    this.popoverEl = popover;
    this.positionPopover(context);
  }
  showPopover(context) {
    if (!this.shouldShowOrdinaryToolbarForContext(context)) {
      this.hideToolbar(true);
      return;
    }
    this.hidePopover();
    const popover = document.createElement("div");
    popover.className = "fdtb-popover";
    popover.addEventListener("pointerenter", () => this.clearHideTimer());
    popover.addEventListener("pointerleave", () => this.clearHideTimer());
    const quickGroups = this.getStableQuickActionGroupsForContext(context.kind);
    if (quickGroups.length > 0) {
      this.appendPopoverSection(popover, this.createPopoverSection("", quickGroups));
    }
    const experimentalStyleGroups = this.getExperimentalStyleActionGroupsForContext(context.kind);
    const experimentalColorActions = this.getExperimentalColorActionsForContext(context.kind);
    if (experimentalStyleGroups.length > 0 || experimentalColorActions.length > 0) {
      this.appendPopoverSection(
        popover,
        this.createPopoverSection(
          "\u5B9E\u9A8C\u6837\u5F0F",
          experimentalStyleGroups,
          experimentalColorActions.length > 0 ? this.createColorActionGroup("\u989C\u8272", experimentalColorActions) : void 0
        )
      );
    }
    const utilityGroups = this.getStableUtilityActionGroups();
    if (utilityGroups.length > 0) {
      this.appendPopoverSection(popover, this.createPopoverSection("", utilityGroups));
    }
    document.body.appendChild(popover);
    this.popoverEl = popover;
    this.positionPopover(context);
  }
  getStableQuickActionGroupsForContext(kind) {
    return this.applyToolbarActionOrder(this.getDefaultStableQuickActionGroupsForContext(kind));
  }
  getDefaultStableQuickActionGroupsForContext(kind) {
    if (!this.isTransformableBlockKind(kind)) {
      return [];
    }
    return [
      {
        label: "\u6392\u7248",
        layout: "formatGrid",
        items: [
          { action: "heading1", label: "H1" },
          { action: "heading2", label: "H2" },
          { action: "heading3", label: "H3" },
          { action: "heading4", label: "H4" },
          { action: "italic", label: "\u659C\u4F53" },
          { action: "strikethrough", label: "\u5220\u9664\u7EBF" },
          { action: "bullet", label: "\u2022" },
          { action: "numbered", label: "1." },
          { action: "todo", label: "\u2611" },
          { action: "code", label: "{ }" },
          { action: "quote", label: "\u275D" },
          { action: "highlightText", label: "\u9AD8" },
          { action: "commandPalette", label: "\u547D\u4EE4" },
          { action: "divider", label: "\u2014" }
        ]
      },
      {
        label: "\u63D2\u5165\u5185\u5BB9",
        layout: "insertMixed",
        items: [
          { action: "tableMenu", label: "\u8868\u683C" },
          { action: "calloutNote", label: "\u9AD8\u4EAE\u5757" },
          { action: "insertImage", label: "\u56FE\u7247" },
          { action: "insertFile", label: "\u6587\u4EF6" },
          { action: "templateMenu", label: "\u6A21\u677F\u5E93" },
          { action: "calloutFold", label: "\u6298\u53E0" },
          { action: "insertDate", label: "\u65E5\u671F" },
          { action: "insertLink", label: "\u94FE\u63A5" }
        ]
      }
    ];
  }
  getStableQuickActionsForContext(kind) {
    return this.getStableQuickActionGroupsForContext(kind).flatMap((group) => group.items);
  }
  getStableUtilityActionGroups() {
    return [];
  }
  getStableUtilityActions() {
    return this.getStableUtilityActionGroups().flatMap((group) => group.items);
  }
  getStableStyleActionGroupsForContext(kind) {
    return [];
  }
  getStableStyleActionsForContext(kind) {
    return this.getStableStyleActionGroupsForContext(kind).flatMap((group) => group.items);
  }
  getStableColorActionsForContext(kind) {
    return [];
  }
  getExperimentalStyleActionGroupsForContext(kind) {
    if (!this.canUseExperimentalOrdinaryStyles(kind)) {
      return [];
    }
    return EXPERIMENTAL_STYLE_GROUPS;
  }
  getExperimentalColorActionsForContext(kind) {
    return [];
  }
  isTransformableBlockKind(kind) {
    return kind === "paragraph" || kind === "heading" || kind === "listItem";
  }
  canUseExperimentalOrdinaryStyles(kind) {
    return this.isExperimentalFeatureEnabled() && this.isTransformableBlockKind(kind);
  }
  isExperimentalStyleAction(action) {
    return EXPERIMENTAL_STYLE_ACTIONS.has(action);
  }
  getColorValue(action) {
    if (!(action in COLOR_ACTION_TO_VALUE)) {
      return null;
    }
    return COLOR_ACTION_TO_VALUE[action];
  }
  isExperimentalFeatureEnabled() {
    return this.isBetaFeaturesEnabled();
  }
  isOrdinaryToolbarBlockKind(kind) {
    return kind === "paragraph" || kind === "heading" || kind === "listItem" || kind === "quote" || kind === "callout" || kind === "codeFence";
  }
  isWithinTableElement(element) {
    return !!element?.closest("table");
  }
  shouldShowOrdinaryToolbarForContext(context) {
    if (!context || !this.isOrdinaryToolbarBlockKind(context.kind)) {
      return false;
    }
    const contentEl = context.view?.contentEl;
    if (!(contentEl instanceof HTMLElement) || !(context.blockEl instanceof HTMLElement) || !context.blockEl.isConnected) {
      return false;
    }
    if (!contentEl.contains(context.blockEl)) {
      return false;
    }
    return !this.isWithinTableElement(context.blockEl);
  }
  positionPopover(context) {
    if (!this.popoverEl || !this.handleEl) return;
    const anchorRect = this.handleEl.getBoundingClientRect();
    const fallbackRect = context.blockEl.getBoundingClientRect();
    const rect = anchorRect.width > 0 && anchorRect.height > 0 ? anchorRect : fallbackRect;
    const desiredTop = Math.max(72, rect.top - 8);
    const desiredLeft = Math.min(window.innerWidth - 292, rect.right + 8);
    this.popoverEl.style.top = `${desiredTop}px`;
    this.popoverEl.style.left = `${Math.max(16, desiredLeft)}px`;
  }
  createActionButton(label, action, layout, isSortableMode = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fdtb-action";
    const title = this.getActionDisplayTitle(action, label);
    button.title = title;
    button.setAttribute("aria-label", title);
    button.dataset.fdtbTooltip = title;
    if (layout === "formatGrid") {
      button.classList.add("fdtb-action-icon");
    }
    if (layout === "insertMixed") {
      button.classList.add("fdtb-action-text");
    }
    if (layout === "utility") {
      button.classList.add("fdtb-action-text");
      if (action === "copyImage") {
        button.classList.add("fdtb-action-primary");
      } else {
        button.classList.add("fdtb-action-secondary");
      }
    }
    this.appendActionButtonContent(button, label, action, layout);
    if (action === "insertFile") {
      button.classList.add("fdtb-action-file");
    }
    if (action === "tableMenu" || action === "templateMenu") {
      button.classList.add("fdtb-action-menu");
    }
    if (isSortableMode) {
      button.style.cursor = "grab";
      button.dataset.action = action;
    } else {
      this.bindActionTrigger(button, action);
    }
    return button;
  }
  createWideActionButton(label, action, isSortableMode = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fdtb-action fdtb-action-wide";
    const text = document.createElement("span");
    text.className = "fdtb-action-label";
    text.textContent = label;
    button.appendChild(text);
    const title = this.getActionDisplayTitle(action, label);
    button.title = title;
    button.setAttribute("aria-label", title);
    button.dataset.fdtbTooltip = title;
    if (isSortableMode) {
      button.style.cursor = "grab";
      button.dataset.action = action;
    } else {
      this.bindActionTrigger(button, action);
    }
    return button;
  }
  getActionShortcutHint(action) {
    return ACTION_MARKDOWN_HINTS[action] ?? null;
  }
  getActionDisplayTitle(action, fallbackLabel) {
    const title = ACTION_TITLES[action] ?? fallbackLabel;
    const shortcut = this.getActionShortcutHint(action);
    return shortcut ? `${title} ${shortcut}` : title;
  }
  appendActionButtonContent(button, label, action, layout) {
    const headingMatch = /^H([1-4])$/.exec(label);
    if (layout === "formatGrid" && headingMatch) {
      const mark = document.createElement("span");
      mark.className = "fdtb-heading-mark";
      const h = document.createElement("b");
      h.textContent = "H";
      const tag = document.createElement("span");
      tag.className = "fdtb-heading-level";
      tag.textContent = headingMatch[1];
      mark.appendChild(h);
      mark.appendChild(tag);
      button.appendChild(mark);
      return;
    }
    const icon = ACTION_ICONS[action];
    if (icon && (layout === "formatGrid" || layout === "insertMixed")) {
      const iconEl = document.createElement("span");
      iconEl.className = "fdtb-action-svg";
      iconEl.innerHTML = icon;
      button.appendChild(iconEl);
    }
    if (layout === "formatGrid" && icon) return;
    if (layout !== "formatGrid" || !icon) {
      const text = document.createElement("span");
      text.className = "fdtb-action-label";
      text.textContent = label;
      button.appendChild(text);
    }
  }
  createPopoverDivider() {
    const divider = document.createElement("div");
    divider.className = "fdtb-divider";
    return divider;
  }
  createColorActionButton(label, color, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fdtb-action fdtb-action-wide fdtb-action-color-wide";
    button.setAttribute("aria-label", label);
    button.title = label;
    button.dataset.fdtbTooltip = label;
    const swatch = document.createElement("span");
    swatch.className = "fdtb-color-swatch";
    swatch.style.setProperty("--fdtb-swatch-color", color);
    button.appendChild(swatch);
    const text = document.createElement("span");
    text.className = "fdtb-color-label";
    text.textContent = label;
    button.appendChild(text);
    this.bindActionTrigger(button, action);
    return button;
  }
  createSectionTitle(label) {
    const title = document.createElement("div");
    title.className = "fdtb-section-title";
    title.textContent = label;
    return title;
  }
  createGroupLabel(label) {
    const title = document.createElement("div");
    title.className = "fdtb-section-title";
    title.textContent = label;
    return title;
  }
  createPopoverSection(title, groups, extraGroup) {
    const section = document.createElement("section");
    section.className = "fdtb-section";
    if (title) {
      const sectionTitle = this.createSectionTitle(title);
      section.appendChild(sectionTitle);
    }
    groups.forEach((group, index) => {
      if (index > 0) {
        section.appendChild(this.createPopoverDivider());
      }
      section.appendChild(this.createActionGroup(group));
    });
    if (extraGroup) {
      section.appendChild(extraGroup);
    }
    return section;
  }
  appendPopoverSection(popover, section) {
    if (popover.childElementCount > 0) {
      popover.appendChild(this.createPopoverDivider());
    }
    popover.appendChild(section);
  }
  createActionGroup(group, sortable) {
    const groupEl = document.createElement("div");
    groupEl.className = "fdtb-group";
    if (group.label) {
      groupEl.appendChild(this.createGroupLabel(group.label));
    }
    const row = document.createElement("div");
    row.className = "fdtb-row";
    if (group.layout === "formatGrid") {
      row.classList.add("fdtb-row-format");
    } else if (group.layout === "insertMixed") {
      row.classList.add("fdtb-row-insert");
    } else if (group.layout === "utility") {
      row.classList.add("fdtb-row-utility");
    } else if (group.wide) {
      row.classList.add("fdtb-row-utility");
    }
    const isSortable = !!sortable?.sortable;
    for (const item of group.items) {
      row.appendChild(
        group.wide ? this.createWideActionButton(item.label, item.action, isSortable) : this.createActionButton(item.label, item.action, group.layout, isSortable)
      );
    }
    if (sortable?.sortable) {
      this.attachSortableToolbarRow(row, group.items, sortable.onReorder);
    }
    groupEl.appendChild(row);
    return groupEl;
  }
  attachSortableToolbarRow(row, items, onReorder) {
    let draggingAction = null;
    let longPressTimer = null;
    const clearLongPressTimer = () => {
      if (longPressTimer !== null) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    const buttons = Array.from(row.querySelectorAll(".fdtb-action"));
    buttons.forEach((button, index) => {
      const item = items[index];
      if (!item) return;
      button.dataset.action = item.action;
      const action = item.action;
      button.draggable = true;
      button.addEventListener("pointerdown", () => {
        clearLongPressTimer();
        longPressTimer = window.setTimeout(() => {
          button.classList.add("is-long-press-ready");
        }, 240);
      });
      button.addEventListener("pointerup", () => {
        clearLongPressTimer();
        button.classList.remove("is-long-press-ready");
      });
      button.addEventListener("pointerleave", () => {
        clearLongPressTimer();
        button.classList.remove("is-long-press-ready");
      });
      button.addEventListener("dragstart", (event) => {
        draggingAction = action;
        button.classList.add("is-dragging");
        event.dataTransfer?.setData("text/plain", action);
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
        }
        event.dataTransfer?.setDragImage(button, Math.min(32, button.clientWidth / 2), 16);
      });
      button.addEventListener("dragend", () => {
        draggingAction = null;
        button.classList.remove("is-dragging", "is-long-press-ready");
        row.querySelectorAll(".is-drag-over").forEach((el) => el.classList.remove("is-drag-over"));
      });
      button.addEventListener("dragover", (event) => {
        if (!draggingAction || draggingAction === action) return;
        event.preventDefault();
        button.classList.add("is-drag-over");
      });
      button.addEventListener("dragleave", () => {
        button.classList.remove("is-drag-over");
      });
      button.addEventListener("drop", async (event) => {
        event.preventDefault();
        button.classList.remove("is-drag-over");
        const sourceAction = event.dataTransfer?.getData("text/plain") || draggingAction;
        if (!sourceAction || sourceAction === action) return;
        const moved = await this.moveToolbarAction(sourceAction, action, { keepPopover: true });
        if (moved) {
          await onReorder();
        }
      });
    });
  }
  createColorActionGroup(label, presets = COLOR_PRESETS) {
    const groupEl = document.createElement("div");
    groupEl.style.display = "flex";
    groupEl.style.flexDirection = "column";
    groupEl.style.gap = "6px";
    groupEl.appendChild(this.createGroupLabel(label));
    const row = document.createElement("div");
    row.className = "fdtb-row";
    row.classList.add("fdtb-row-utility");
    row.classList.add("fdtb-row-color-grid");
    row.style.alignItems = "stretch";
    row.style.gap = "8px";
    for (const preset of presets) {
      row.appendChild(this.createColorActionButton(preset.label, preset.color, preset.action));
    }
    groupEl.appendChild(row);
    return groupEl;
  }
  bindActionTrigger(button, action) {
    let fired = false;
    const invoke = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (fired) return;
      fired = true;
      window.setTimeout(() => {
        fired = false;
      }, 0);
      void this.runAction(action);
    };
    button.addEventListener("pointerdown", invoke);
    button.addEventListener("click", invoke);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        invoke(event);
      }
    });
  }
  async runAction(action) {
    const baseContext = this.activeContext;
    if (!baseContext) return;
    const context = this.resolveActionContext(baseContext);
    this.activeContext = context;
    this.consumeSlashTrigger(context);
    if (this.isExperimentalStyleAction(action) && !this.canUseExperimentalOrdinaryStyles(context.kind)) {
      this.hidePopover();
      return;
    }
    if (action === "copyImage") {
      this.hidePopover();
      await this.copyBlockAsImage(context);
      return;
    }
    if (action === "tableMenu") {
      await this.showTableMenu(context);
      return;
    }
    if (action === "templateMenu") {
      await this.showTemplateMenu(context);
      return;
    }
    if (action === "insertImage" || action === "insertFile") {
      this.hidePopover();
      await this.insertAttachmentIntoContext(context, action === "insertImage" ? "image" : "file");
      return;
    }
    if (action === "highlightText") {
      this.toggleMarkdownHighlight(context);
      this.hidePopover();
      return;
    }
    if (action === "italic" || action === "strikethrough") {
      this.toggleInlineMarkdownWrap(context, action === "italic" ? "*" : "~~");
      this.hidePopover();
      return;
    }
    if (action === "calloutNote" || action === "calloutFold") {
      this.convertBlockToCallout(context, action === "calloutFold");
      this.hidePopover();
      return;
    }
    if (action === "insertDate") {
      this.insertDateBelow(context);
      this.hidePopover();
      return;
    }
    if (action === "insertLink") {
      this.insertLinkAtCursor(context);
      this.hidePopover();
      return;
    }
    if (action === "commandPalette") {
      this.hidePopover();
      this.openObsidianCommandPalette();
      return;
    }
    if (action === "copyMarkdown") {
      this.hidePopover();
      await this.copyBlockMarkdown(context);
      return;
    }
    if (action === "duplicateBelow") {
      this.duplicateBelow(context);
      this.hidePopover();
      return;
    }
    if (action === "moveUp" || action === "moveDown") {
      this.moveBlock(context, action === "moveUp" ? "up" : "down");
      this.hidePopover();
      return;
    }
    if (action === "insertBelow") {
      this.insertBelow(context);
      this.hidePopover();
      return;
    }
    if (action === "code") {
      this.wrapCurrentBlockWithCodeFence(context);
      this.hidePopover();
      return;
    }
    if (action === "divider") {
      this.convertBlockToDivider(context);
      this.hidePopover();
      return;
    }
    if (action === "indentMore" || action === "indentLess") {
      this.adjustBlockIndent(this.activateEditorContext(context), action === "indentMore" ? 2 : -2);
      this.hidePopover();
      return;
    }
    if (action === "alignLeft" || action === "alignCenter" || action === "alignRight") {
      this.applyInlineStyleAction(this.activateEditorContext(context), {
        align: action === "alignLeft" ? null : action === "alignCenter" ? "center" : "right"
      });
      this.hidePopover();
      return;
    }
    const color = this.getColorValue(action);
    if (color || action === "clearStyle") {
      this.applyInlineStyleAction(this.activateEditorContext(context), {
        color: action === "clearStyle" ? null : color,
        clearAll: action === "clearStyle"
      });
      this.hidePopover();
      return;
    }
    this.applyLineTransform(context, action);
    this.hidePopover();
  }
  consumeSlashTrigger(context) {
    if (!this.slashTrigger) return;
    if (context.file.path !== this.slashTrigger.filePath || context.line !== this.slashTrigger.line) return;
    const currentLine = String(context.editor.getLine(context.line) ?? "");
    if (currentLine.trim() === "/") {
      context.editor.replaceRange("", { line: context.line, ch: 0 }, { line: context.line, ch: currentLine.length });
    }
    this.slashTrigger = null;
  }
  activateEditorContext(context) {
    let nextContext = this.resolveActionContext(context);
    const { editor } = nextContext;
    const range = this.getLogicalBlockRange(editor, nextContext.line);
    if (typeof editor.focus === "function") {
      try {
        editor.focus();
      } catch {
      }
    }
    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line: range.startLine, ch: 0 });
      nextContext = this.resolveActionContext({
        ...nextContext,
        line: range.startLine
      });
    }
    return nextContext;
  }
  resolveActionContext(context) {
    const { view, file, editor, cmView } = context;
    let blockEl = context.blockEl;
    let line = context.line;
    const enhancedTableContext = this.getEnhancedTableContext(view, editor, cmView, blockEl);
    if (enhancedTableContext) {
      return enhancedTableContext;
    }
    if (blockEl.isConnected) {
      try {
        const position = cmView.posAtDOM(blockEl, 0);
        line = Math.max(0, cmView.state.doc.lineAt(position).number - 1);
      } catch {
      }
    }
    const refreshedBlockEl = this.findBlockElementForLine(view, cmView, line) ?? (blockEl.isConnected ? blockEl : null);
    if (refreshedBlockEl) {
      blockEl = refreshedBlockEl;
    }
    return {
      view,
      file,
      editor,
      cmView,
      blockEl,
      line,
      kind: this.getBlockKind(editor, line)
    };
  }
  applyLineTransform(context, action) {
    const { editor, line } = context;
    const selectedRange = this.getSelectedLineRange(editor);
    if (selectedRange) {
      const lines = this.readBlockLines(editor, selectedRange.startLine, selectedRange.endLine);
      let orderedIndex = 1;
      const nextLines = lines.map((current) => {
        if (!current.trim()) return current;
        const next = this.buildFormattedLine(
          current,
          action,
          action === "numbered" ? orderedIndex : void 0
        );
        if (action === "numbered") orderedIndex += 1;
        return next;
      });
      const replacement = nextLines.join("\n");
      if (replacement === lines.join("\n")) return;
      this.replaceBlockRange(editor, selectedRange.startLine, selectedRange.endLine, replacement);
      editor.setCursor({ line: selectedRange.startLine, ch: nextLines[0]?.length ?? 0 });
      this.scheduleStyleRefresh();
      return;
    }
    const currentLine = String(editor.getLine(line) ?? "");
    const nextLine = this.buildFormattedLine(currentLine, action);
    if (nextLine === currentLine) return;
    editor.replaceRange(
      nextLine,
      { line, ch: 0 },
      { line, ch: currentLine.length }
    );
    editor.setCursor({ line, ch: nextLine.length });
  }
  buildFormattedLine(line, action, orderedIndex = 1) {
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch?.[0] ?? "";
    const raw = line.trimStart();
    const content = this.stripBlockPrefix(raw);
    switch (action) {
      case "paragraph":
        return `${indent}${content}`;
      case "heading1":
        return `${indent}# ${content}`;
      case "heading2":
        return `${indent}## ${content}`;
      case "heading3":
        return `${indent}### ${content}`;
      case "heading4":
        return `${indent}#### ${content}`;
      case "bullet":
        return `${indent}- ${content}`;
      case "numbered":
        return `${indent}${Math.max(1, orderedIndex)}. ${content}`;
      case "todo":
        return `${indent}- [ ] ${content}`;
      case "quote":
        return `${indent}> ${content}`;
      default:
        return line;
    }
  }
  stripBlockPrefix(line) {
    return line.replace(/^#{1,6}\s+/, "").replace(/^[-*+]\s+\[[ xX]\]\s+/, "").replace(/^\d+\.\s+/, "").replace(/^[-*+]\s+/, "").replace(/^>\s+/, "").trim();
  }
  getSelectedLineRange(editor) {
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (!selected) return null;
    const from = this.getEditorCursorPosition(editor, "from");
    const to = this.getEditorCursorPosition(editor, "to");
    if (!from || !to) return null;
    let startLine = Math.min(from.line, to.line);
    let endLine = Math.max(from.line, to.line);
    const endCursor = from.line <= to.line ? to : from;
    if (endCursor.ch === 0 && endLine > startLine) {
      endLine -= 1;
    }
    const lastLine = Math.max(0, Number(editor.lineCount?.() ?? endLine + 1) - 1);
    startLine = Math.max(0, Math.min(startLine, lastLine));
    endLine = Math.max(0, Math.min(endLine, lastLine));
    if (endLine < startLine) return null;
    return { startLine, endLine };
  }
  getEditorCursorPosition(editor, which) {
    try {
      if (typeof editor.getCursor === "function") {
        const cursor2 = editor.getCursor(which);
        if (this.isEditorPosition(cursor2)) return cursor2;
      }
    } catch {
    }
    const selection = editor?.selection;
    const cursor = selection?.[which];
    return this.isEditorPosition(cursor) ? cursor : null;
  }
  isEditorPosition(value) {
    return Number.isFinite(value?.line) && Number.isFinite(value?.ch);
  }
  adjustBlockIndent(context, delta) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    const nextLines = lines.map((line) => {
      if (!line.trim()) return line;
      if (delta > 0) return `${" ".repeat(delta)}${line}`;
      return line.replace(new RegExp(`^ {1,${Math.abs(delta)}}`), "");
    });
    const replacement = nextLines.join("\n");
    if (replacement === lines.join("\n")) return;
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, replacement);
    context.editor.setCursor({ line: range.startLine, ch: 0 });
    this.scheduleStyleRefresh();
  }
  applyInlineStyleAction(context, patch) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const markerInfo = this.getStyleMarkerInfo(context.editor, range.startLine);
    const currentStyle = markerInfo?.style ?? this.normalizeInlineStyle({});
    const nextStyle = this.normalizeInlineStyle({
      align: patch.clearAll ? null : patch.align !== void 0 ? patch.align : currentStyle.align,
      color: patch.clearAll ? null : patch.color !== void 0 ? patch.color : currentStyle.color
    });
    const hasStyle = !!nextStyle.align || !!nextStyle.color;
    if (markerInfo) {
      const currentMarkerLine = String(context.editor.getLine(markerInfo.line) ?? "");
      if (hasStyle) {
        const nextMarkerLine = this.formatStyleMarker(nextStyle);
        if (nextMarkerLine !== currentMarkerLine) {
          context.editor.replaceRange(
            nextMarkerLine,
            { line: markerInfo.line, ch: 0 },
            { line: markerInfo.line, ch: currentMarkerLine.length }
          );
        }
      } else {
        const deleteTo = markerInfo.line < context.editor.lineCount() - 1 ? { line: markerInfo.line + 1, ch: 0 } : { line: markerInfo.line, ch: currentMarkerLine.length };
        context.editor.replaceRange("", { line: markerInfo.line, ch: 0 }, deleteTo);
      }
    } else if (hasStyle) {
      context.editor.replaceRange(`${this.formatStyleMarker(nextStyle)}
`, { line: range.startLine, ch: 0 });
    } else {
      return;
    }
    const cursorDelta = markerInfo ? hasStyle ? 0 : -1 : hasStyle ? 1 : 0;
    context.editor.setCursor({ line: Math.max(0, context.line + cursorDelta), ch: 0 });
    this.scheduleStyleRefresh();
  }
  normalizeInlineStyle(style) {
    return {
      align: style.align ?? null,
      color: style.color ?? null
    };
  }
  parseStyleMarkerLine(line) {
    const match = String(line ?? "").match(STYLE_MARKER_RE);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[1]);
      return this.normalizeInlineStyle({
        align: parsed?.align === "center" || parsed?.align === "right" ? parsed.align : null,
        color: parsed?.color === "yellow" || parsed?.color === "blue" || parsed?.color === "green" || parsed?.color === "red" || parsed?.color === "purple" || parsed?.color === "gray" ? parsed.color : null
      });
    } catch {
      return null;
    }
  }
  formatStyleMarker(style) {
    const payload = {};
    if (style.align) payload.align = style.align;
    if (style.color) payload.color = style.color;
    return `%% fdtb-style:${JSON.stringify(payload)} %%`;
  }
  getStyleMarkerInfo(editor, blockStartLine) {
    if (blockStartLine <= 0) return null;
    const markerLine = blockStartLine - 1;
    const style = this.parseStyleMarkerLine(String(editor.getLine(markerLine) ?? ""));
    if (!style) return null;
    return {
      line: markerLine,
      style
    };
  }
  scheduleStyleRefresh() {
    if (this.styleRefreshTimer !== null) {
      window.clearTimeout(this.styleRefreshTimer);
    }
    this.styleRefreshTimer = window.setTimeout(() => {
      this.styleRefreshTimer = null;
      this.refreshVisibleBlockStyles();
    }, 0);
  }
  refreshVisibleBlockStyles() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof import_obsidian5.MarkdownView)) continue;
      const contentEl = view.contentEl;
      if (!(contentEl instanceof HTMLElement)) continue;
      this.clearStyledArtifacts(contentEl);
      const editor = view.editor;
      const cmView = editor?.cm;
      const totalLines = Number(cmView?.state?.doc?.lines ?? 0);
      if (!editor || !cmView || !totalLines) continue;
      for (let line = 0; line < totalLines; line += 1) {
        const style = this.parseStyleMarkerLine(String(editor.getLine(line) ?? ""));
        if (!style) continue;
        this.hideVisibleStyleMarkerLine(view, cmView, line);
        const nextRenderableLine = this.findNextRenderableLine(editor, line + 1);
        if (nextRenderableLine === null) continue;
        const range = this.getLogicalBlockRange(editor, nextRenderableLine);
        for (let styledLine = range.startLine; styledLine <= range.endLine; styledLine += 1) {
          const blockEl = this.findBlockElementForLine(view, cmView, styledLine);
          if (!blockEl) continue;
          this.applyBlockStyleClasses(blockEl, style);
        }
        line = Math.max(line, range.endLine);
      }
    }
  }
  findNextRenderableLine(editor, startLine) {
    const lastLine = Math.max(0, editor.lineCount() - 1);
    for (let line = Math.max(0, startLine); line <= lastLine; line += 1) {
      const current = String(editor.getLine(line) ?? "");
      if (!current.trim() || this.isStyleMarkerLine(current)) continue;
      return line;
    }
    return null;
  }
  clearStyledArtifacts(root) {
    const styleClasses = [
      "fdtb-block-style",
      "fdtb-style-marker-line",
      "fdtb-align-center",
      "fdtb-align-right",
      "fdtb-bg-yellow",
      "fdtb-bg-blue",
      "fdtb-bg-green",
      "fdtb-bg-red",
      "fdtb-bg-purple",
      "fdtb-bg-gray"
    ];
    root.querySelectorAll("[data-fdtb-style-applied='true'], [data-fdtb-style-marker-hidden='true']").forEach((element) => {
      element.removeAttribute("data-fdtb-style-applied");
      element.removeAttribute("data-fdtb-style-marker-hidden");
      element.classList.remove(...styleClasses);
    });
  }
  clearAllStyledArtifacts() {
    const leaves = this.app.workspace.getLeavesOfType("markdown");
    for (const leaf of leaves) {
      const view = leaf.view;
      if (!(view instanceof import_obsidian5.MarkdownView)) continue;
      const contentEl = view.contentEl;
      if (contentEl instanceof HTMLElement) {
        this.clearStyledArtifacts(contentEl);
      }
    }
  }
  hideVisibleStyleMarkerLine(view, cmView, line) {
    const markerEl = this.findBlockElementForLine(view, cmView, line);
    if (!markerEl) return;
    markerEl.classList.add("fdtb-style-marker-line");
    markerEl.setAttribute("data-fdtb-style-marker-hidden", "true");
  }
  applyBlockStyleClasses(blockEl, style) {
    blockEl.classList.add("fdtb-block-style");
    if (style.align === "center") blockEl.classList.add("fdtb-align-center");
    if (style.align === "right") blockEl.classList.add("fdtb-align-right");
    if (style.color === "yellow") blockEl.classList.add("fdtb-bg-yellow");
    if (style.color === "blue") blockEl.classList.add("fdtb-bg-blue");
    if (style.color === "green") blockEl.classList.add("fdtb-bg-green");
    if (style.color === "red") blockEl.classList.add("fdtb-bg-red");
    if (style.color === "purple") blockEl.classList.add("fdtb-bg-purple");
    if (style.color === "gray") blockEl.classList.add("fdtb-bg-gray");
    blockEl.setAttribute("data-fdtb-style-applied", "true");
  }
  buildStyledLine(line, patch) {
    if (!line.trim() || /^\s*```/.test(line) || this.isTableLine(line)) {
      return line;
    }
    const { indent, prefix, content } = this.splitLinePrefixAndContent(line);
    const currentStyle = this.parseInlineStyle(content);
    const nextStyle = {
      align: patch.clearAll ? null : patch.align !== void 0 ? patch.align : currentStyle.align,
      color: patch.clearAll ? null : patch.color !== void 0 ? patch.color : currentStyle.color
    };
    const nextContent = this.composeInlineStyle(currentStyle.content, nextStyle);
    return `${indent}${prefix}${nextContent}`;
  }
  splitLinePrefixAndContent(line) {
    const indent = line.match(/^\s*/)?.[0] ?? "";
    const raw = line.slice(indent.length);
    const prefixes = [
      /^#{1,6}\s+/,
      /^[-*+]\s+\[[ xX]\]\s+/,
      /^\d+\.\s+/,
      /^[-*+]\s+/,
      /^>\s+/
    ];
    for (const pattern of prefixes) {
      const match = raw.match(pattern);
      if (match) {
        return {
          indent,
          prefix: match[0],
          content: raw.slice(match[0].length)
        };
      }
    }
    return {
      indent,
      prefix: "",
      content: raw
    };
  }
  parseInlineStyle(content) {
    const trimmed = content.trim();
    const match = trimmed.match(/^<span class="([^"]*\bfdtb-inline-style\b[^"]*)">([\s\S]*)<\/span>$/);
    if (!match) {
      return {
        content,
        align: null,
        color: null
      };
    }
    const classes = match[1].split(/\s+/).filter(Boolean);
    return {
      content: match[2],
      align: classes.includes("fdtb-align-center") ? "center" : classes.includes("fdtb-align-right") ? "right" : null,
      color: classes.includes("fdtb-bg-yellow") ? "yellow" : classes.includes("fdtb-bg-blue") ? "blue" : classes.includes("fdtb-bg-green") ? "green" : classes.includes("fdtb-bg-red") ? "red" : classes.includes("fdtb-bg-purple") ? "purple" : classes.includes("fdtb-bg-gray") ? "gray" : null
    };
  }
  composeInlineStyle(content, style) {
    const classes = ["fdtb-inline-style"];
    if (style.align === "center") classes.push("fdtb-align-center");
    if (style.align === "right") classes.push("fdtb-align-right");
    if (style.color === "yellow") classes.push("fdtb-bg-yellow");
    if (style.color === "blue") classes.push("fdtb-bg-blue");
    if (style.color === "green") classes.push("fdtb-bg-green");
    if (style.color === "red") classes.push("fdtb-bg-red");
    if (style.color === "purple") classes.push("fdtb-bg-purple");
    if (style.color === "gray") classes.push("fdtb-bg-gray");
    if (classes.length === 1) {
      return content;
    }
    return `<span class="${classes.join(" ")}">${content}</span>`;
  }
  wrapCurrentBlockWithCodeFence(context) {
    const range = this.getSelectedLineRange(context.editor) ?? this.getLogicalBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    if (lines.length === 0) return;
    if (/^\s*```/.test(lines[0]) && /^\s*```/.test(lines[lines.length - 1])) {
      new import_obsidian5.Notice("\u5F53\u524D\u5757\u5DF2\u7ECF\u662F\u4EE3\u7801\u5757");
      return;
    }
    const replacement = ["```", ...lines, "```"].join("\n");
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, replacement);
    context.editor.setCursor({ line: range.startLine + 1, ch: 0 });
  }
  insertBelow(context) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const insertLine = range.endLine + 1;
    context.editor.replaceRange("\n", { line: insertLine, ch: 0 });
    context.editor.setCursor({ line: insertLine + 1, ch: 0 });
  }
  convertBlockToCallout(context, collapsed) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    if (lines.length > 0 && /^\s*>\s*\[!/.test(lines[0])) {
      new import_obsidian5.Notice("\u5F53\u524D\u5757\u5DF2\u7ECF\u662F\u9AD8\u4EAE\u5757");
      return;
    }
    const bodyLines = lines.length > 0 ? lines : [""];
    const marker = collapsed ? "> [!note]- \u6298\u53E0" : "> [!note] \u9AD8\u4EAE";
    const quotedBody = bodyLines.map((line) => `> ${line.trimEnd()}`);
    const replacement = [marker, ...quotedBody].join("\n");
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, replacement);
    context.editor.setCursor({ line: range.startLine + 1, ch: 2 });
    this.scheduleStyleRefresh();
  }
  insertDateBelow(context) {
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const dateText = this.formatLocalDate(/* @__PURE__ */ new Date());
    const insertLine = range.endLine + 1;
    const lastLine = context.editor.lineCount() - 1;
    if (range.endLine < lastLine) {
      context.editor.replaceRange(`${dateText}
`, { line: insertLine, ch: 0 });
    } else {
      const current = String(context.editor.getLine(range.endLine) ?? "");
      context.editor.replaceRange(`
${dateText}`, { line: range.endLine, ch: current.length });
    }
    context.editor.setCursor({ line: range.endLine + 1, ch: dateText.length });
    this.scheduleStyleRefresh();
  }
  toggleMarkdownHighlight(context) {
    const editor = context.editor;
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (selected) {
      if (typeof editor.replaceSelection === "function") {
        editor.replaceSelection(this.toggleHighlightMarkup(selected));
      } else {
        const cursor2 = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
        editor.replaceRange(this.toggleHighlightMarkup(selected), cursor2);
      }
      this.scheduleStyleRefresh();
      return;
    }
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: 0 };
    const line = Math.max(0, cursor?.line ?? context.line);
    const currentLine = String(editor.getLine(line) ?? "");
    if (!currentLine.trim() || this.isMarkdownTableSeparatorLine(currentLine)) return;
    const nextLine = this.isMarkdownTableRowLine(currentLine) ? this.toggleMarkdownTableRowHighlight(currentLine) : this.toggleLineHighlight(currentLine);
    if (nextLine === currentLine) return;
    editor.replaceRange(nextLine, { line, ch: 0 }, { line, ch: currentLine.length });
    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line, ch: Math.min(nextLine.length, cursor?.ch ?? nextLine.length) });
    }
    this.scheduleStyleRefresh();
  }
  toggleInlineMarkdownWrap(context, marker) {
    const editor = context.editor;
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (selected) {
      const next = this.toggleInlineWrapMarkup(selected, marker);
      if (typeof editor.replaceSelection === "function") {
        editor.replaceSelection(next);
      } else {
        const cursor2 = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
        editor.replaceRange(next, cursor2);
      }
      this.scheduleStyleRefresh();
      return;
    }
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: 0 };
    const insertText = `${marker}${marker}`;
    editor.replaceRange(insertText, cursor);
    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line: cursor.line, ch: cursor.ch + marker.length });
    }
    this.scheduleStyleRefresh();
  }
  toggleInlineWrapMarkup(value, marker) {
    return value.startsWith(marker) && value.endsWith(marker) && value.length >= marker.length * 2 ? value.slice(marker.length, -marker.length) : `${marker}${value}${marker}`;
  }
  openObsidianCommandPalette() {
    const commandIds = ["command-palette:open", "app:open-command-palette"];
    for (const commandId of commandIds) {
      try {
        const executed = this.app.commands?.executeCommandById?.(commandId);
        if (executed !== false) return;
      } catch {
      }
    }
    new import_obsidian5.Notice("\u672A\u627E\u5230\u547D\u4EE4\u9762\u677F\u5165\u53E3");
  }
  toggleLineHighlight(line) {
    const match = line.match(/^(\s*)(.*?)(\s*)$/);
    if (!match) return line;
    const [, leading, content, trailing] = match;
    if (!content) return line;
    return `${leading}${this.toggleHighlightMarkup(content)}${trailing}`;
  }
  toggleMarkdownTableRowHighlight(line) {
    const cells = this.splitMarkdownTableRow(line);
    const hasOuterPipe = cells.length > 1 && cells[0].trim() === "" && cells[cells.length - 1].trim() === "";
    return cells.map((cell, index) => {
      if (hasOuterPipe && (index === 0 || index === cells.length - 1)) return cell;
      return this.toggleTableCellHighlight(cell);
    }).join("|");
  }
  toggleTableCellHighlight(cell) {
    const match = cell.match(/^(\s*)(.*?)(\s*)$/);
    if (!match) return cell;
    const [, leading, content, trailing] = match;
    if (!content) return cell;
    return `${leading}${this.toggleHighlightMarkup(content)}${trailing}`;
  }
  toggleHighlightMarkup(value) {
    return /^==[\s\S]*==$/.test(value) ? value.slice(2, -2) : `==${value}==`;
  }
  isMarkdownTableRowLine(line) {
    return line.includes("|") && !this.isMarkdownTableSeparatorLine(line);
  }
  isMarkdownTableSeparatorLine(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }
  splitMarkdownTableRow(line) {
    const cells = [];
    let current = "";
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === "|" && line[index - 1] !== "\\") {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }
  insertLinkAtCursor(context) {
    const editor = context.editor;
    const selected = typeof editor.getSelection === "function" ? String(editor.getSelection() ?? "") : "";
    if (selected) {
      if (typeof editor.replaceSelection === "function") {
        editor.replaceSelection(`[${selected}]()`);
      } else {
        const cursor2 = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
        editor.replaceRange(`[${selected}]()`, cursor2);
      }
      return;
    }
    const cursor = typeof editor.getCursor === "function" ? editor.getCursor() : { line: context.line, ch: String(editor.getLine(context.line) ?? "").length };
    editor.replaceRange("[]()", cursor);
    if (typeof editor.setCursor === "function") {
      editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
    }
  }
  formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  duplicateBelow(context) {
    const range = this.getPersistedBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    if (lines.length === 0) return;
    const blockText = lines.join("\n");
    const lastLine = context.editor.lineCount() - 1;
    const insertAt = range.endLine < lastLine ? { line: range.endLine + 1, ch: 0 } : { line: range.endLine, ch: String(context.editor.getLine(range.endLine) ?? "").length };
    const prefix = range.endLine < lastLine ? "" : "\n";
    context.editor.replaceRange(`${prefix}${blockText}
`, insertAt);
    const targetLine = range.endLine < lastLine ? range.endLine + 1 : range.endLine + 1;
    context.editor.setCursor({ line: targetLine, ch: 0 });
    this.scheduleStyleRefresh();
  }
  async showTableMenu(context) {
    if (!this.popoverEl) return;
    this.hideSubmenu();
    const submenu = document.createElement("div");
    submenu.className = "fdtb-submenu fdtb-submenu-wide";
    submenu.addEventListener("pointerenter", () => this.clearHideTimer());
    submenu.addEventListener("pointerleave", () => this.scheduleHideToolbar());
    const header = document.createElement("div");
    header.className = "fdtb-submenu-title";
    header.textContent = "\u63D2\u5165\u8868\u683C";
    submenu.appendChild(header);
    const hint = document.createElement("div");
    hint.className = "fdtb-submenu-item-desc";
    hint.textContent = "\u62D6\u52A8\u6216\u60AC\u505C\u9009\u62E9\u8868\u683C\u5C3A\u5BF8";
    hint.style.margin = "0 4px 6px";
    submenu.appendChild(hint);
    const grid = document.createElement("div");
    grid.className = "fdtb-table-grid";
    let activeRows = 1;
    let activeCols = 1;
    let pointerDown = false;
    let selectionCommitted = false;
    let suppressNextClickCommit = false;
    let cleanupGlobalGridDragListeners = null;
    const updateGridSelection = (rows, cols) => {
      activeRows = rows;
      activeCols = cols;
      Array.from(grid.children).forEach((child, index) => {
        const currentRow = Math.floor(index / TABLE_PICKER_COLS) + 1;
        const currentCol = index % TABLE_PICKER_COLS + 1;
        child.classList.toggle("is-active", currentRow <= rows && currentCol <= cols);
      });
    };
    const commitGridSelection = () => {
      if (selectionCommitted) return;
      selectionCommitted = true;
      cleanupGlobalGridDragListeners?.();
      cleanupGlobalGridDragListeners = null;
      pointerDown = false;
      this.insertMarkdownTable(context, activeRows, activeCols);
      this.hidePopover();
    };
    const releaseSelection = () => {
      pointerDown = false;
      cleanupGlobalGridDragListeners?.();
      cleanupGlobalGridDragListeners = null;
    };
    const bindGlobalGridDragListeners = () => {
      cleanupGlobalGridDragListeners?.();
      const handlePointerMove = (event) => {
        if (!pointerDown) return;
        const element = document.elementFromPoint(event.clientX, event.clientY);
        const cell = element?.closest(".fdtb-table-grid-cell");
        if (!cell || !grid.contains(cell)) return;
        const rows = Number.parseInt(cell.dataset.rows ?? "", 10);
        const cols = Number.parseInt(cell.dataset.cols ?? "", 10);
        if (!Number.isFinite(rows) || !Number.isFinite(cols)) return;
        updateGridSelection(rows, cols);
      };
      const handlePointerUp = () => {
        if (!pointerDown) return;
        suppressNextClickCommit = true;
        commitGridSelection();
      };
      const handlePointerCancel = () => {
        releaseSelection();
      };
      window.addEventListener("pointermove", handlePointerMove, true);
      window.addEventListener("pointerup", handlePointerUp, true);
      window.addEventListener("pointercancel", handlePointerCancel, true);
      cleanupGlobalGridDragListeners = () => {
        window.removeEventListener("pointermove", handlePointerMove, true);
        window.removeEventListener("pointerup", handlePointerUp, true);
        window.removeEventListener("pointercancel", handlePointerCancel, true);
      };
    };
    for (let row = 1; row <= TABLE_PICKER_ROWS; row += 1) {
      for (let col = 1; col <= TABLE_PICKER_COLS; col += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "fdtb-table-grid-cell";
        cell.title = `${row} x ${col}`;
        cell.dataset.rows = String(row);
        cell.dataset.cols = String(col);
        const select = () => updateGridSelection(row, col);
        cell.addEventListener("pointerenter", () => {
          select();
        });
        cell.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          pointerDown = true;
          select();
          bindGlobalGridDragListeners();
        });
        cell.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          select();
          commitGridSelection();
        });
        cell.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (suppressNextClickCommit) {
            suppressNextClickCommit = false;
            return;
          }
          select();
          commitGridSelection();
        });
        grid.appendChild(cell);
      }
    }
    grid.addEventListener("pointerleave", () => {
      if (!pointerDown) updateGridSelection(activeRows, activeCols);
    });
    submenu.addEventListener("pointercancel", releaseSelection);
    updateGridSelection(1, 1);
    submenu.appendChild(grid);
    const utilityItems = [
      {
        label: "\u63D2\u5165\u5F69\u8272\u7A7A\u8868\u683C",
        onClick: async () => {
          await this.executeCommandById(ENHANCED_TABLE_COMMANDS.insertNativeColorTemplate);
          this.hidePopover();
        }
      }
    ];
    for (const item of utilityItems) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-submenu-item";
      const main = document.createElement("div");
      main.className = "fdtb-submenu-item-title";
      main.textContent = item.label;
      button.appendChild(main);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void item.onClick();
      });
      submenu.appendChild(button);
    }
    document.body.appendChild(submenu);
    this.submenuEl = submenu;
    const rect = this.popoverEl.getBoundingClientRect();
    submenu.style.left = `${Math.min(window.innerWidth - 360, rect.right + 8)}px`;
    submenu.style.top = `${rect.top}px`;
  }
  async showTemplateMenu(context) {
    if (!this.popoverEl && !this.ensureTemplateMenuHost(context)) return;
    await this.ensureTemplateLibrary();
    const items = await this.buildTemplateMenuItems(context);
    this.showSecondaryMenu("\u6A21\u677F", items);
  }
  async buildTemplateMenuItems(context) {
    const items = [
      {
        label: "\u4FDD\u5B58\u5F53\u524D\u5757\u4E3A\u6A21\u677F",
        onClick: async () => {
          await this.saveCurrentBlockAsTemplate(context);
          this.hidePopover();
        }
      }
    ];
    const tree = await this.buildFullTemplateTree();
    this.appendTemplateTreeMenuItems(items, tree, context, null);
    items.push({
      label: "\u6A21\u677F\u5E93",
      onClick: async () => {
        await this.openTemplateLibrary();
        this.hidePopover();
      }
    });
    return items;
  }
  appendTemplateTreeMenuItems(items, node, context, folderLabel) {
    const headerLabel = folderLabel ?? this.getTemplateUngroupedLabel();
    if (node.templates.length > 0) {
      items.push({ label: headerLabel, header: true });
      for (const template of this.sortTemplateDescriptors(node.templates)) {
        items.push({
          label: template.title,
          onClick: async () => {
            const ok = await this.insertTemplateIntoContext(context, template.path);
            if (ok) await this.rememberTemplate(template.path);
            this.hidePopover();
          }
        });
      }
    }
    const folders = Array.from(node.folders.entries()).sort(([a], [b]) => a.localeCompare(b, "zh-Hans-CN"));
    for (const [folderName, child] of folders) {
      const nextLabel = folderLabel ? `${folderLabel} / ${folderName}` : folderName;
      const hasTemplates = child.templates.length > 0;
      const hasNested = child.folders.size > 0;
      if (hasTemplates || hasNested) {
        if (!hasTemplates) {
          items.push({ label: nextLabel, header: true });
        }
        this.appendTemplateTreeMenuItems(items, child, context, nextLabel);
      } else {
        items.push({ label: `${nextLabel}\uFF08\u7A7A\uFF09`, header: true });
      }
    }
  }
  getTemplateUngroupedLabel() {
    return this.dataStore.templateUngroupedLabel?.trim() || "\u672A\u5206\u7EC4";
  }
  async setTemplateUngroupedLabel(label) {
    const next = label.trim().slice(0, 32) || "\u672A\u5206\u7EC4";
    this.dataStore.templateUngroupedLabel = next;
    await this.saveData(this.dataStore);
    new import_obsidian5.Notice(`\u6839\u76EE\u5F55\u5206\u7EC4\u5DF2\u6539\u540D\u4E3A\uFF1A${next}`);
  }
  async buildFullTemplateTree() {
    const templates = await this.getTemplateDescriptors();
    const tree = this.buildTemplateTree(templates);
    const groupPaths = await this.listTemplateGroupRelativePaths();
    for (const rel of groupPaths) {
      let node = tree;
      for (const segment of rel.split("/").filter(Boolean)) {
        if (!node.folders.has(segment)) {
          node.folders.set(segment, { folders: /* @__PURE__ */ new Map(), templates: [] });
        }
        node = node.folders.get(segment);
      }
    }
    return tree;
  }
  async listTemplateGroupRelativePaths() {
    const root = this.getTemplateFolderPath();
    const adapter = this.app.vault.adapter;
    const paths = /* @__PURE__ */ new Set();
    await this.collectTemplateGroupRelativePaths(root, "", paths);
    return Array.from(paths).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  }
  async collectTemplateGroupRelativePaths(absoluteFolderPath, relativePrefix, out) {
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(absoluteFolderPath)) return;
    let listed = null;
    try {
      listed = await adapter.list(absoluteFolderPath);
    } catch {
      return;
    }
    for (const childFolder of listed?.folders ?? []) {
      const normalizedChild = (0, import_obsidian5.normalizePath)(childFolder);
      const name = normalizedChild.split("/").pop() ?? normalizedChild;
      const rel = relativePrefix ? `${relativePrefix}/${name}` : name;
      out.add(rel);
      await this.collectTemplateGroupRelativePaths(normalizedChild, rel, out);
    }
  }
  async getTemplateGroupMoveOptions() {
    const options = [
      { value: "", label: this.getTemplateUngroupedLabel() }
    ];
    for (const rel of await this.listTemplateGroupRelativePaths()) {
      options.push({ value: rel, label: rel });
    }
    return options;
  }
  async moveTemplateToGroup(templatePath, targetGroupRel, options) {
    const ok = await this.moveTemplateToGroupCore(templatePath, targetGroupRel);
    if (!ok) return false;
    if (!options?.silent) {
      await this.updateTemplateIndexNote();
      const safeTarget = targetGroupRel.split("/").map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-")).filter(Boolean).join("/");
      const groupName = safeTarget || this.getTemplateUngroupedLabel();
      new import_obsidian5.Notice(`\u5DF2\u79FB\u5230\uFF1A${groupName}`);
    }
    return true;
  }
  async moveTemplateToGroupCore(templatePath, targetGroupRel) {
    const normalized = (0, import_obsidian5.normalizePath)(templatePath);
    const root = this.getTemplateFolderPath();
    if (!normalized.startsWith(`${root}/`) || this.isTemplateIndexPath(normalized)) {
      new import_obsidian5.Notice("\u53EA\u80FD\u79FB\u52A8\u6A21\u677F\u5E93\u4E2D\u7684\u6A21\u677F");
      return false;
    }
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(normalized)) {
      new import_obsidian5.Notice("\u6A21\u677F\u6587\u4EF6\u4E0D\u5B58\u5728");
      return false;
    }
    const safeTarget = targetGroupRel.split("/").map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-")).filter(Boolean).join("/");
    const targetFolder = safeTarget ? (0, import_obsidian5.normalizePath)(`${root}/${safeTarget}`) : root;
    if (!await adapter.exists(targetFolder)) {
      await this.app.vault.createFolder(targetFolder);
    }
    const fileName = normalized.split("/").pop() ?? "";
    const destPath = (0, import_obsidian5.normalizePath)(`${targetFolder}/${fileName}`);
    if (destPath === normalized) return true;
    if (await adapter.exists(destPath)) {
      new import_obsidian5.Notice("\u76EE\u6807\u5206\u7EC4\u91CC\u5DF2\u6709\u540C\u540D\u6A21\u677F");
      return false;
    }
    const renamed = await this.renameVaultPath(normalized, destPath);
    if (!renamed) {
      new import_obsidian5.Notice("\u6A21\u677F\u8FC1\u79FB\u5931\u8D25");
      return false;
    }
    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.map(
      (item) => normalizeRecentTemplatePath(item) === normalized ? destPath : item
    );
    await this.saveData(this.dataStore);
    return true;
  }
  async renameVaultPath(from, to) {
    const adapter = this.app.vault.adapter;
    const file = this.app.vault.getAbstractFileByPath?.(from);
    if (file && (file instanceof import_obsidian5.TFile || file instanceof import_obsidian5.TFolder)) {
      await this.app.vault.rename(file, to);
      return true;
    }
    if (typeof adapter.rename === "function") {
      try {
        await adapter.rename(from, to);
        return true;
      } catch (error) {
        console.warn("[fdtb] adapter.rename failed", error);
        return false;
      }
    }
    return false;
  }
  async renameTemplateGroup(relativePath, newName) {
    const safe = newName.trim().replace(/[\\:*?"<>|]/g, "-");
    if (!safe) {
      new import_obsidian5.Notice("\u5206\u7EC4\u540D\u79F0\u65E0\u6548");
      return false;
    }
    const rel = relativePath.split("/").map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-")).filter(Boolean).join("/");
    if (!rel) {
      new import_obsidian5.Notice("\u8BF7\u7528\u300C\u672A\u5206\u7EC4\u300D\u65C1\u7684\u6539\u540D\u4FEE\u6539\u6839\u76EE\u5F55\u663E\u793A\u540D");
      return false;
    }
    const root = this.getTemplateFolderPath();
    const oldPath = (0, import_obsidian5.normalizePath)(`${root}/${rel}`);
    const parentRel = rel.includes("/") ? rel.split("/").slice(0, -1).join("/") : "";
    const parentPath = parentRel ? (0, import_obsidian5.normalizePath)(`${root}/${parentRel}`) : root;
    const newPath = (0, import_obsidian5.normalizePath)(`${parentPath}/${safe}`);
    if (oldPath === newPath) return true;
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(oldPath)) {
      new import_obsidian5.Notice("\u5206\u7EC4\u4E0D\u5B58\u5728");
      return false;
    }
    if (await adapter.exists(newPath)) {
      new import_obsidian5.Notice("\u5DF2\u5B58\u5728\u540C\u540D\u5206\u7EC4");
      return false;
    }
    const renamed = await this.renameVaultPath(oldPath, newPath);
    if (!renamed) {
      new import_obsidian5.Notice("\u5206\u7EC4\u6539\u540D\u5931\u8D25");
      return false;
    }
    const oldPrefix = `${rel}/`;
    const newPrefix = parentRel ? `${parentRel}/${safe}/` : `${safe}/`;
    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.map((item) => {
      const n = normalizeRecentTemplatePath(item);
      if (n.startsWith(`${root}/${oldPrefix}`)) {
        return (0, import_obsidian5.normalizePath)(n.replace(`${root}/${oldPrefix}`, `${root}/${newPrefix}`));
      }
      return item;
    });
    await this.saveData(this.dataStore);
    await this.updateTemplateIndexNote();
    new import_obsidian5.Notice(`\u5206\u7EC4\u5DF2\u6539\u540D\u4E3A\uFF1A${safe}`);
    return true;
  }
  findTemplateTreeNode(root, relativePath) {
    const segments = relativePath.split("/").map((part) => part.trim()).filter(Boolean);
    let node = root;
    for (const segment of segments) {
      const child = node.folders.get(segment);
      if (!child) return null;
      node = child;
    }
    return node;
  }
  collectTemplatesInNode(node) {
    const collected = [...node.templates];
    for (const child of node.folders.values()) {
      collected.push(...this.collectTemplatesInNode(child));
    }
    return collected;
  }
  async deleteTemplateGroup(relativePath) {
    const rel = relativePath.split("/").map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-")).filter(Boolean).join("/");
    if (!rel) {
      new import_obsidian5.Notice("\u6839\u76EE\u5F55\u5206\u7EC4\u4E0D\u80FD\u5220\u9664\uFF0C\u53EA\u80FD\u6539\u663E\u793A\u540D");
      return false;
    }
    const root = this.getTemplateFolderPath();
    const folderPath = (0, import_obsidian5.normalizePath)(`${root}/${rel}`);
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(folderPath)) {
      new import_obsidian5.Notice("\u5206\u7EC4\u4E0D\u5B58\u5728");
      return false;
    }
    const tree = await this.buildFullTemplateTree();
    const node = this.findTemplateTreeNode(tree, rel);
    const templates = node ? this.collectTemplatesInNode(node) : [];
    const displayName = rel.includes("/") ? rel.split("/").pop() : rel;
    const ungroupedLabel = this.getTemplateUngroupedLabel();
    const confirmMessage = templates.length === 0 ? `\u786E\u5B9A\u5220\u9664\u5206\u7EC4\u300C${displayName}\u300D\uFF1F` : `\u5206\u7EC4\u300C${displayName}\u300D\u5185\u6709 ${templates.length} \u4E2A\u6A21\u677F\uFF0C\u5220\u9664\u540E\u6A21\u677F\u5C06\u79FB\u81F3\u300C${ungroupedLabel}\u300D\uFF0C\u786E\u5B9A\u5417\uFF1F`;
    if (!confirmUserAction(confirmMessage)) return false;
    for (const template of templates) {
      const moved = await this.moveTemplateToGroupCore(template.path, "");
      if (!moved) {
        new import_obsidian5.Notice(`\u8FC1\u79FB\u6A21\u677F\u5931\u8D25\uFF1A${template.title}`);
        return false;
      }
    }
    const removed = await this.removeVaultFolder(folderPath);
    if (!removed) {
      new import_obsidian5.Notice("\u5220\u9664\u5206\u7EC4\u5931\u8D25");
      return false;
    }
    await this.updateTemplateIndexNote();
    new import_obsidian5.Notice(`\u5DF2\u5220\u9664\u5206\u7EC4\uFF1A${displayName}`);
    return true;
  }
  async deleteUngroupedTemplateGroup() {
    const label = this.getTemplateUngroupedLabel();
    const defaultLabel = DEFAULT_DATA.templateUngroupedLabel;
    const tree = await this.buildFullTemplateTree();
    const templates = tree.templates;
    if (templates.length === 0) {
      if (label === defaultLabel) {
        new import_obsidian5.Notice("\u6839\u76EE\u5F55\u5206\u7EC4\u5DF2\u662F\u9ED8\u8BA4\u72B6\u6001\uFF0C\u65E0\u9700\u5220\u9664");
        return false;
      }
      if (!confirmUserAction(`\u786E\u5B9A\u5220\u9664\u300C${label}\u300D\uFF1F\u5C06\u6062\u590D\u663E\u793A\u540D\u4E3A\u300C${defaultLabel}\u300D\u3002`)) return false;
      await this.setTemplateUngroupedLabel(defaultLabel);
      return true;
    }
    if (!confirmUserAction(
      `\u300C${label}\u300D\u5185\u6709 ${templates.length} \u4E2A\u6A21\u677F\uFF0C\u5220\u9664\u5206\u7EC4\u5C06\u6C38\u4E45\u5220\u9664\u8FD9\u4E9B\u6A21\u677F\uFF0C\u786E\u5B9A\u5417\uFF1F`
    )) {
      return false;
    }
    for (const template of templates) {
      const deleted = await this.deleteTemplateAtPathCore(template.path);
      if (!deleted) {
        new import_obsidian5.Notice(`\u5220\u9664\u6A21\u677F\u5931\u8D25\uFF1A${template.title}`);
        return false;
      }
    }
    if (label !== defaultLabel) {
      this.dataStore.templateUngroupedLabel = defaultLabel;
      await this.saveData(this.dataStore);
    }
    await this.updateTemplateIndexNote();
    new import_obsidian5.Notice(`\u5DF2\u5220\u9664\u300C${label}\u300D\u53CA\u5176 ${templates.length} \u4E2A\u6A21\u677F`);
    return true;
  }
  async deleteTemplateAtPathCore(templatePath) {
    const normalized = (0, import_obsidian5.normalizePath)(templatePath);
    const root = this.getTemplateFolderPath();
    if (!normalized.startsWith(`${root}/`) || this.isTemplateIndexPath(normalized)) return false;
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(normalized)) return false;
    await adapter.remove(normalized);
    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.filter(
      (item) => normalizeRecentTemplatePath(item) !== normalized
    );
    await this.saveData(this.dataStore);
    return true;
  }
  async removeVaultFolder(folderPath) {
    const adapter = this.app.vault.adapter;
    const normalized = (0, import_obsidian5.normalizePath)(folderPath);
    if (!await adapter.exists(normalized)) return true;
    const folder = this.app.vault.getAbstractFileByPath?.(normalized);
    if (folder instanceof import_obsidian5.TFolder && typeof this.app.vault.delete === "function") {
      try {
        await this.app.vault.delete(folder, true);
        return !await adapter.exists(normalized);
      } catch (error) {
        console.warn("[fdtb] vault.delete folder failed", error);
      }
    }
    if (typeof adapter.rmdir === "function") {
      try {
        await adapter.rmdir(normalized, true);
        return !await adapter.exists(normalized);
      } catch (error) {
        console.warn("[fdtb] adapter.rmdir failed", error);
      }
    }
    try {
      await this.removeVaultFolderContents(normalized);
      if (typeof adapter.rmdir === "function") {
        await adapter.rmdir(normalized, false);
      }
      return !await adapter.exists(normalized);
    } catch (error) {
      console.warn("[fdtb] manual folder remove failed", error);
      return false;
    }
  }
  async removeVaultFolderContents(folderPath) {
    const adapter = this.app.vault.adapter;
    const listing = await adapter.list(folderPath);
    for (const filePath of listing.files ?? []) {
      await adapter.remove((0, import_obsidian5.normalizePath)(filePath));
    }
    for (const childFolder of listing.folders ?? []) {
      const childPath = (0, import_obsidian5.normalizePath)(childFolder);
      await this.removeVaultFolderContents(childPath);
      if (typeof adapter.rmdir === "function") {
        await adapter.rmdir(childPath, false);
      }
    }
  }
  buildTemplateTree(templates) {
    const root = { folders: /* @__PURE__ */ new Map(), templates: [] };
    for (const template of templates) {
      let node = root;
      for (const segment of template.folderSegments) {
        if (!node.folders.has(segment)) {
          node.folders.set(segment, { folders: /* @__PURE__ */ new Map(), templates: [] });
        }
        node = node.folders.get(segment);
      }
      node.templates.push(template);
    }
    return root;
  }
  sortTemplateDescriptors(templates) {
    return [...templates].sort((a, b) => {
      if (a.order !== null && b.order !== null && a.order !== b.order) return a.order - b.order;
      if (a.order !== null) return -1;
      if (b.order !== null) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }
  async updateTemplateFolderPath(value) {
    this.dataStore.templateFolderPath = normalizeTemplateFolderPath(value);
    await this.saveData(this.dataStore);
    await this.ensureTemplateLibrary();
    await this.updateTemplateIndexNote();
  }
  async createTemplateSubfolder(relativePath) {
    const safe = relativePath.split("/").map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-")).filter(Boolean).join("/");
    if (!safe) {
      new import_obsidian5.Notice("\u5206\u7EC4\u540D\u79F0\u65E0\u6548");
      return false;
    }
    await this.ensureTemplateLibrary();
    const folderPath = (0, import_obsidian5.normalizePath)(`${this.getTemplateFolderPath()}/${safe}`);
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(folderPath)) {
      new import_obsidian5.Notice("\u5206\u7EC4\u5DF2\u5B58\u5728");
      return false;
    }
    await this.app.vault.createFolder(folderPath);
    new import_obsidian5.Notice(`\u5DF2\u521B\u5EFA\u5206\u7EC4\uFF1A${safe}`);
    return true;
  }
  async createBlankTemplate(rawName) {
    const segments = rawName.split("/").map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-")).filter(Boolean);
    if (segments.length === 0) {
      new import_obsidian5.Notice("\u6A21\u677F\u540D\u79F0\u65E0\u6548");
      return false;
    }
    const fileName = `${segments.pop()}.md`;
    await this.ensureTemplateLibrary();
    const folderPath = segments.length > 0 ? (0, import_obsidian5.normalizePath)(`${this.getTemplateFolderPath()}/${segments.join("/")}`) : this.getTemplateFolderPath();
    if (!await this.app.vault.adapter.exists(folderPath)) {
      await this.app.vault.createFolder(folderPath);
    }
    const path = await this.allocateUniqueVaultPath(folderPath, fileName);
    await this.app.vault.create(path, "");
    await this.rememberTemplate(path);
    await this.updateTemplateIndexNote();
    new import_obsidian5.Notice(`\u5DF2\u521B\u5EFA\u6A21\u677F\uFF1A${this.getTemplateNameFromPath(path)}`);
    return true;
  }
  async editTemplateAtPath(templatePath) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.openTemplateForEdit === "function") {
      await enhancer.openTemplateForEdit(templatePath);
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(templatePath);
    if (file instanceof import_obsidian5.TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }
  async deleteTemplateAtPath(templatePath) {
    const enhancer = this.getTableEnhancerPlugin();
    if (typeof enhancer?.deleteTemplateByPath === "function") {
      return enhancer.deleteTemplateByPath(templatePath);
    }
    const normalized = (0, import_obsidian5.normalizePath)(templatePath);
    if (!normalized.startsWith(`${this.getTemplateFolderPath()}/`)) {
      new import_obsidian5.Notice("\u53EA\u80FD\u5220\u9664\u6A21\u677F\u5E93\u4E2D\u7684\u6A21\u677F");
      return false;
    }
    const confirmed = confirmUserAction(`\u786E\u5B9A\u5220\u9664\u6A21\u677F\u300C${this.getTemplateNameFromPath(normalized)}\u300D\u5417\uFF1F`);
    if (!confirmed) return false;
    await this.app.vault.adapter.remove(normalized);
    this.dataStore.recentTemplatePaths = this.dataStore.recentTemplatePaths.filter(
      (item) => normalizeRecentTemplatePath(item) !== normalized
    );
    await this.saveData(this.dataStore);
    await this.updateTemplateIndexNote();
    new import_obsidian5.Notice("\u6A21\u677F\u5DF2\u5220\u9664");
    return true;
  }
  ensureTemplateMenuHost(context) {
    if (this.popoverEl) return true;
    if (this.shouldShowOrdinaryToolbarForContext(context)) {
      this.showPopover(context);
      return !!this.popoverEl;
    }
    this.hidePopover();
    const popover = document.createElement("div");
    popover.className = "fdtb-popover fdtb-template-host";
    popover.addEventListener("pointerenter", () => this.clearHideTimer());
    popover.addEventListener("pointerleave", () => this.clearHideTimer());
    const header = document.createElement("div");
    header.className = "fdtb-submenu-title";
    header.textContent = "\u6A21\u677F";
    popover.appendChild(header);
    document.body.appendChild(popover);
    this.popoverEl = popover;
    const rect = context.blockEl.getBoundingClientRect();
    const desiredTop = Math.max(72, rect.top - 8);
    const desiredLeft = Math.min(window.innerWidth - 292, rect.right + 8);
    popover.style.top = `${desiredTop}px`;
    popover.style.left = `${Math.max(16, desiredLeft)}px`;
    return true;
  }
  showSecondaryMenu(title, items) {
    if (!this.popoverEl) return;
    this.hideSubmenu();
    const submenu = document.createElement("div");
    submenu.className = "fdtb-submenu";
    submenu.addEventListener("pointerenter", () => this.clearHideTimer());
    submenu.addEventListener("pointerleave", () => this.clearHideTimer());
    const header = document.createElement("div");
    header.className = "fdtb-submenu-title";
    header.textContent = title;
    submenu.appendChild(header);
    for (const item of items) {
      if (item.header) {
        const section = document.createElement("div");
        section.className = "fdtb-submenu-section-title";
        section.textContent = item.label;
        submenu.appendChild(section);
        continue;
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fdtb-submenu-item";
      const main = document.createElement("div");
      main.className = "fdtb-submenu-item-title";
      main.textContent = item.label;
      button.appendChild(main);
      if (item.description) {
        const desc = document.createElement("div");
        desc.className = "fdtb-submenu-item-desc";
        desc.textContent = item.description;
        button.appendChild(desc);
      }
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void item.onClick?.();
      });
      submenu.appendChild(button);
    }
    document.body.appendChild(submenu);
    this.submenuEl = submenu;
    const rect = this.popoverEl.getBoundingClientRect();
    submenu.style.left = `${Math.min(window.innerWidth - 300, rect.right + 8)}px`;
    submenu.style.top = `${rect.top}px`;
  }
  hideSubmenu() {
    this.submenuEl?.remove();
    this.submenuEl = null;
  }
  async executeCommandById(commandId) {
    const commands = this.app?.commands;
    if (!commands || typeof commands.executeCommandById !== "function") {
      new import_obsidian5.Notice("\u5F53\u524D\u65E0\u6CD5\u8C03\u7528\u5BF9\u5E94\u547D\u4EE4");
      return false;
    }
    const ok = await commands.executeCommandById(commandId);
    if (!ok) {
      new import_obsidian5.Notice("\u5BF9\u5E94\u547D\u4EE4\u5F53\u524D\u4E0D\u53EF\u7528");
      return false;
    }
    return true;
  }
  async ensureTemplateLibrary() {
    const folderPath = this.getTemplateFolderPath();
    const adapter = this.app.vault.adapter;
    if (!await adapter.exists(folderPath)) {
      await this.app.vault.createFolder(folderPath);
    }
  }
  async getTemplateDescriptors() {
    const paths = await this.listTemplateMarkdownPaths();
    const folderPath = this.getTemplateFolderPath();
    const descriptors = await Promise.all(
      paths.map(async (templatePath) => {
        const file = this.app.vault.getAbstractFileByPath?.(templatePath);
        const concreteFile = file instanceof import_obsidian5.TFile ? file : null;
        const content = concreteFile ? await this.app.vault.cachedRead(concreteFile) : await this.app.vault.adapter.read(templatePath);
        const cacheFile = concreteFile ? this.app.metadataCache.getFileCache(concreteFile) : null;
        const cachedOrder = cacheFile?.frontmatter && typeof cacheFile.frontmatter.menuOrder === "number" ? cacheFile.frontmatter.menuOrder : null;
        const order = cachedOrder ?? this.parseTemplateOrderFromContent(content);
        return {
          path: templatePath,
          title: concreteFile?.basename ?? this.getTemplateNameFromPath(templatePath),
          excerpt: this.getTemplateExcerpt(concreteFile, content),
          order,
          updatedAt: concreteFile?.stat?.mtime ?? 0,
          folderSegments: this.getTemplateFolderSegments(templatePath, folderPath)
        };
      })
    );
    return this.sortTemplateDescriptors(descriptors);
  }
  getTemplateFolderSegments(templatePath, folderPath) {
    const normalized = (0, import_obsidian5.normalizePath)(templatePath);
    const root = (0, import_obsidian5.normalizePath)(folderPath);
    if (!normalized.startsWith(`${root}/`)) return [];
    const relative = normalized.slice(root.length + 1);
    const segments = relative.split("/");
    segments.pop();
    return segments.filter(Boolean);
  }
  getTemplateFolderPath() {
    return normalizeTemplateFolderPath(this.dataStore.templateFolderPath);
  }
  getTemplateIndexPath() {
    return (0, import_obsidian5.normalizePath)(`${this.getTemplateFolderPath()}/${TEMPLATE_INDEX_BASENAME}`);
  }
  async listTemplateMarkdownPaths() {
    const folderPath = this.getTemplateFolderPath();
    const paths = /* @__PURE__ */ new Set();
    const markdownFiles = typeof this.app.vault.getMarkdownFiles === "function" ? this.app.vault.getMarkdownFiles() : [];
    for (const file of markdownFiles) {
      if (!file?.path?.startsWith(`${folderPath}/`)) continue;
      if (!file.path.toLowerCase().endsWith(".md")) continue;
      if (this.isTemplateIndexPath(file.path)) continue;
      paths.add((0, import_obsidian5.normalizePath)(file.path));
    }
    const adapter = this.app.vault.adapter;
    await this.collectTemplateMarkdownPaths(folderPath, paths);
    return Array.from(paths);
  }
  async collectTemplateMarkdownPaths(folderPath, paths) {
    const adapter = this.app.vault.adapter;
    try {
      if (adapter && typeof adapter.exists === "function" && typeof adapter.list === "function" && await adapter.exists(folderPath)) {
        const listing = await adapter.list(folderPath);
        for (const filePath of listing.files ?? []) {
          if (!filePath.toLowerCase().endsWith(".md")) continue;
          if (this.isTemplateIndexPath(filePath)) continue;
          paths.add((0, import_obsidian5.normalizePath)(filePath));
        }
        for (const childFolder of listing.folders ?? []) {
          await this.collectTemplateMarkdownPaths((0, import_obsidian5.normalizePath)(childFolder), paths);
        }
      }
    } catch (error) {
      console.warn("[fdtb] list hidden template folder failed", error);
    }
  }
  isTemplateIndexPath(templatePath) {
    return (0, import_obsidian5.normalizePath)(templatePath) === this.getTemplateIndexPath() || templatePath.endsWith(`/${TEMPLATE_INDEX_BASENAME}`);
  }
  getRecentTemplates(templates) {
    const map = new Map(templates.map((item) => [item.path, item]));
    const picked = [];
    for (const path of this.dataStore.recentTemplatePaths) {
      const found = map.get(normalizeRecentTemplatePath(path));
      if (found) picked.push(found);
    }
    return picked;
  }
  parseTemplateOrderFromContent(content) {
    const match = content.match(TEMPLATE_FRONTMATTER_ORDER_RE);
    return match ? Number.parseInt(match[1], 10) : null;
  }
  getTemplateExcerpt(file, content) {
    const cache2 = file ? this.app.metadataCache.getFileCache(file) : null;
    const headings = cache2?.headings ?? [];
    if (headings.length > 0) {
      return headings[0].heading.slice(0, 30);
    }
    if (typeof content === "string") {
      const lines = content.split("\n").map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("---") && !line.startsWith("#") && !this.isTemplateSystemLine(line));
      if (lines.length > 0) {
        return lines[0].slice(0, 30);
      }
    }
    return "\u63D2\u5165\u6A21\u677F\u5185\u5BB9";
  }
  async insertTemplateIntoContext(context, templatePath) {
    const normalizedPath = (0, import_obsidian5.normalizePath)(templatePath);
    const file = this.app.vault.getAbstractFileByPath(normalizedPath);
    const exists = file instanceof import_obsidian5.TFile || await this.app.vault.adapter.exists(normalizedPath);
    if (!exists) {
      new import_obsidian5.Notice("\u6A21\u677F\u6587\u4EF6\u4E0D\u5B58\u5728");
      return false;
    }
    const content = file instanceof import_obsidian5.TFile ? await this.app.vault.read(file) : await this.app.vault.adapter.read(normalizedPath);
    const range = this.getPersistedBlockRange(context.editor, context.line);
    const insertAt = range.endLine < context.editor.lineCount() - 1 ? { line: range.endLine + 1, ch: 0 } : { line: range.endLine, ch: String(context.editor.getLine(range.endLine) ?? "").length };
    const insertedByEnhancer = this.shouldUseTableEnhancerForTemplate(content) ? await this.insertTemplateViaTableEnhancer(context, content, insertAt) : false;
    if (insertedByEnhancer) {
      new import_obsidian5.Notice(`\u5DF2\u63D2\u5165\u6A21\u677F\uFF1A${file instanceof import_obsidian5.TFile ? file.basename : this.getTemplateNameFromPath(normalizedPath)}`);
      return true;
    }
    const prefix = range.endLine < context.editor.lineCount() - 1 ? "" : "\n";
    const body = this.stripTemplateSystemLines(content).replace(/\s+$/g, "");
    context.editor.replaceRange(`${prefix}${body}
`, insertAt);
    new import_obsidian5.Notice(`\u5DF2\u63D2\u5165\u6A21\u677F\uFF1A${file instanceof import_obsidian5.TFile ? file.basename : this.getTemplateNameFromPath(normalizedPath)}`);
    return true;
  }
  async insertTemplateViaTableEnhancer(context, content, insertAt) {
    const enhancer = this.getTableEnhancerPlugin();
    const insertTemplate = typeof enhancer?.insertEnhancedTemplateContentAtCursor === "function" ? enhancer.insertEnhancedTemplateContentAtCursor : typeof enhancer?.insertTemplateContentAtCursor === "function" ? enhancer.insertTemplateContentAtCursor : null;
    if (!insertTemplate) return false;
    try {
      if (typeof context.editor.setCursor === "function") {
        context.editor.setCursor(insertAt);
      }
      return await insertTemplate.call(enhancer, content, insertAt);
    } catch (error) {
      console.warn("[fdtb] enhanced template insertion failed; falling back to plain markdown", error);
      return false;
    }
  }
  getTableEnhancerPlugin() {
    const plugins = this.app.plugins;
    return plugins?.plugins?.[MARKDOWN_TABLE_PLUGIN_ID] ?? plugins?.getPlugin?.(MARKDOWN_TABLE_PLUGIN_ID) ?? null;
  }
  stripTemplateSystemLines(content) {
    const originalEndsWithNewline = /\r?\n$/.test(content);
    const next = content.split(/\r?\n/).filter((line) => !this.isTemplateSystemLine(line)).join("\n");
    return originalEndsWithNewline ? `${next}
` : next;
  }
  isTemplateSystemLine(line) {
    return TEMPLATE_SYSTEM_LINE_RE.test(line);
  }
  shouldUseTableEnhancerForTemplate(content) {
    return content.split(/\r?\n/).some((line) => this.isTemplateSystemLine(line));
  }
  async rememberTemplate(templatePath) {
    const normalizedPath = normalizeRecentTemplatePath(templatePath);
    const next = [normalizedPath, ...this.dataStore.recentTemplatePaths.filter((item) => normalizeRecentTemplatePath(item) !== normalizedPath)].slice(0, TEMPLATE_MENU_LIMIT);
    this.dataStore.recentTemplatePaths = next;
    await this.saveData(this.dataStore);
  }
  async copyCurrentTableAsImage(tableEl) {
    if (!this.isEmbeddedModuleEnabled("right-click-copy-as-image")) {
      new import_obsidian5.Notice("\u8BF7\u5728 Obsidian\u589E\u5F3A\u4F53\u9A8C \u2192 \u81EA\u7814\u529F\u80FD\u5F00\u5173 \u4E2D\u542F\u7528\u300C\u53F3\u952E\u590D\u5236\u6210\u56FE\u300D");
      return false;
    }
    const view = this.app.workspace.getActiveViewOfType(import_obsidian5.MarkdownView);
    if (!view) {
      new import_obsidian5.Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A Markdown \u7B14\u8BB0");
      return false;
    }
    const runner = getRightClickCopyAsImageRunner();
    if (!runner) {
      new import_obsidian5.Notice("\u53F3\u952E\u590D\u5236\u6210\u56FE\u6A21\u5757\u672A\u5C31\u7EEA\uFF0C\u8BF7\u91CD\u8F7D Obsidian\u589E\u5F3A\u4F53\u9A8C");
      return false;
    }
    await runner.copyTableElementAsImage(view, tableEl);
    return true;
  }
  async openTemplateLibrary() {
    const tableEnhancer = this.getTableEnhancerPlugin();
    if (typeof tableEnhancer?.openTemplateLibraryModal === "function") {
      tableEnhancer.openTemplateLibraryModal();
      return;
    }
    await this.ensureTemplateLibrary();
    await this.updateTemplateIndexNote();
    const file = this.app.vault.getAbstractFileByPath(this.getTemplateIndexPath());
    if (!(file instanceof import_obsidian5.TFile)) {
      new import_obsidian5.Notice("\u6A21\u677F\u5E93\u7D22\u5F15\u4E0D\u5B58\u5728");
      return;
    }
    const leaf = this.app.workspace.getMostRecentLeaf();
    await leaf?.openFile(file);
  }
  async saveCurrentBlockAsTemplate(context) {
    const selectedContent = this.getSelectedTemplateContent(context.editor);
    const rawName = window.prompt("\u6A21\u677F\u540D\u79F0\uFF08\u53EF\u7528\u300C\u5206\u7EC4/\u540D\u79F0\u300D\u4FDD\u5B58\u5230\u5B50\u6587\u4EF6\u5939\uFF09", "\u672A\u547D\u540D\u6A21\u677F")?.trim();
    if (!rawName) return false;
    const segments = rawName.split("/").map((part) => part.trim().replace(/[\\:*?"<>|]/g, "-")).filter(Boolean);
    if (segments.length === 0) return false;
    const fileStem = segments.pop() ?? "\u672A\u547D\u540D\u6A21\u677F";
    await this.ensureTemplateLibrary();
    const folderPath = segments.length > 0 ? (0, import_obsidian5.normalizePath)(`${this.getTemplateFolderPath()}/${segments.join("/")}`) : this.getTemplateFolderPath();
    if (!await this.app.vault.adapter.exists(folderPath)) {
      await this.app.vault.createFolder(folderPath);
    }
    const range = this.getPersistedBlockRange(context.editor, context.line);
    const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
    const body = this.normalizeTemplateContentForStorage(selectedContent ?? lines.join("\n"));
    if (!body.trim()) {
      new import_obsidian5.Notice("\u5F53\u524D\u5757\u4E3A\u7A7A\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u6A21\u677F");
      return false;
    }
    const path = await this.allocateUniqueVaultPath(folderPath, `${fileStem}.md`);
    await this.app.vault.create(path, body);
    await this.rememberTemplate(path);
    await this.updateTemplateIndexNote();
    new import_obsidian5.Notice(`\u5DF2\u4FDD\u5B58\u6A21\u677F\uFF1A${fileStem}`);
    return true;
  }
  getSelectedTemplateContent(editor) {
    if (editor && typeof editor.getSelection === "function") {
      const selection = String(editor.getSelection() ?? "");
      if (selection.trim()) return selection;
    }
    const browserSelection = window.getSelection?.();
    const selectedText = String(browserSelection?.toString?.() ?? "");
    return selectedText.trim() ? selectedText : null;
  }
  normalizeTemplateContentForStorage(content) {
    const lines = String(content ?? "").replace(/\r\n?/g, "\n").split("\n");
    while (lines.length > 0 && !lines[0].trim()) lines.shift();
    while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();
    return lines.length > 0 ? `${lines.join("\n")}
` : "";
  }
  async updateTemplateIndexNote() {
    const indexPath = this.getTemplateIndexPath();
    const descriptors = await this.getTemplateDescriptors();
    const links = descriptors.length > 0 ? descriptors.map((item) => `- [[${item.path.replace(/\.md$/i, "")}|${item.title}]]`).join("\n") : "- \u8FD8\u6CA1\u6709\u6A21\u677F";
    const content = `# \u6A21\u677F\u5E93

${links}
`;
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(indexPath)) {
      await adapter.write(indexPath, content);
      return;
    }
    try {
      await this.app.vault.create(indexPath, content);
    } catch {
      await adapter.write(indexPath, content);
    }
  }
  getTemplateNameFromPath(templatePath) {
    return (templatePath.split("/").pop() ?? templatePath).replace(/\.md$/i, "");
  }
  insertMarkdownTable(context, rows, cols) {
    const headers = this.buildDefaultTableHeaders(cols);
    const separator = Array.from({ length: cols }, () => "---");
    const body = Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, () => ""));
    const tableLines = [
      `| ${headers.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...body.map((cells) => `| ${cells.join(" | ")} |`)
    ];
    const tableText = tableLines.join("\n");
    const tableBlockText = `${tableText}

`;
    const editor = context.editor;
    const currentLine = String(editor.getLine(context.line) ?? "");
    const slashTriggered = !!this.slashTrigger && this.slashTrigger.filePath === context.file.path && this.slashTrigger.line === context.line && currentLine.trim() === "/";
    if (slashTriggered) {
      editor.replaceRange(tableBlockText, { line: context.line, ch: 0 }, { line: context.line, ch: currentLine.length });
      this.slashTrigger = null;
      const targetLine = context.line + tableLines.length + 1;
      editor.setCursor({ line: targetLine, ch: 0 });
      this.scheduleStyleRefresh();
      return;
    }
    if (!currentLine.trim()) {
      editor.replaceRange(tableBlockText, { line: context.line, ch: 0 }, { line: context.line, ch: currentLine.length });
      const targetLine = context.line + tableLines.length + 1;
      editor.setCursor({ line: targetLine, ch: 0 });
      this.scheduleStyleRefresh();
      return;
    }
    const range = this.getLogicalBlockRange(editor, context.line);
    const insertLine = range.endLine + 1;
    editor.replaceRange(`
${tableText}
`, { line: insertLine, ch: 0 });
    editor.setCursor({ line: insertLine + tableLines.length + 1, ch: 0 });
    this.scheduleStyleRefresh();
  }
  buildDefaultTableHeaders(cols) {
    const preferredHeaders = ["\u6B65\u9AA4", "\u81EA\u68C0", "\u5185\u5BB9"];
    if (cols > preferredHeaders.length) {
      return Array.from({ length: cols }, () => "");
    }
    return preferredHeaders.slice(0, Math.max(0, cols));
  }
  async insertAttachmentIntoContext(context, kind) {
    const input = document.createElement("input");
    input.type = "file";
    if (kind === "image") {
      input.accept = "image/*";
    }
    const file = await new Promise((resolve) => {
      input.addEventListener("change", () => resolve(input.files?.[0] ?? null), { once: true });
      input.click();
    });
    if (!file) return false;
    const folderPath = this.getAttachmentFolderPath();
    await this.ensureFolderExists(folderPath);
    const targetPath = await this.allocateUniqueVaultPath(folderPath, file.name);
    const data2 = await file.arrayBuffer();
    await this.app.vault.adapter.writeBinary(targetPath, data2);
    const embed2 = kind === "image" ? `![[${targetPath}]]` : `[[${targetPath}]]`;
    const range = this.getLogicalBlockRange(context.editor, context.line);
    const insertLine = range.endLine + 1;
    context.editor.replaceRange(`
${embed2}
`, { line: insertLine, ch: 0 });
    context.editor.setCursor({ line: insertLine + 1, ch: embed2.length });
    new import_obsidian5.Notice(kind === "image" ? "\u5DF2\u63D2\u5165\u56FE\u7247" : "\u5DF2\u63D2\u5165\u6587\u4EF6");
    return true;
  }
  getAttachmentFolderPath() {
    const configured = this.app.vault?.getConfig?.("attachmentFolderPath");
    if (typeof configured === "string" && configured.trim()) {
      return (0, import_obsidian5.normalizePath)(configured.trim());
    }
    return "_attachments";
  }
  async ensureFolderExists(folderPath) {
    const adapter = this.app.vault.adapter;
    if (await adapter.exists(folderPath)) return;
    const parts = folderPath.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!await adapter.exists(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }
  async allocateUniqueVaultPath(folderPath, fileName) {
    const adapter = this.app.vault.adapter;
    const dot = fileName.lastIndexOf(".");
    const base = dot > 0 ? fileName.slice(0, dot) : fileName;
    const ext = dot > 0 ? fileName.slice(dot) : "";
    let candidate = (0, import_obsidian5.normalizePath)(`${folderPath}/${fileName}`);
    let index = 1;
    while (await adapter.exists(candidate)) {
      candidate = (0, import_obsidian5.normalizePath)(`${folderPath}/${base} ${index}${ext}`);
      index += 1;
    }
    return candidate;
  }
  async copyBlockMarkdown(context) {
    try {
      const range = this.getLogicalBlockRange(context.editor, context.line);
      const lines = this.readBlockLines(context.editor, range.startLine, range.endLine);
      const blockKind = this.getBlockKind(context.editor, context.line);
      const blockText = this.normalizeCopiedBlockForPaste(lines.join("\n"), blockKind);
      if (!blockText.trim()) {
        new import_obsidian5.Notice("\u5F53\u524D\u5757\u6CA1\u6709\u53EF\u590D\u5236\u5185\u5BB9");
        return;
      }
      await this.writeTextToClipboard(blockText);
      new import_obsidian5.Notice("\u5DF2\u590D\u5236\u5F53\u524D\u5757\u5185\u5BB9");
    } catch (error) {
      console.error("[feishu-doc-toolbar] copy block markdown failed", error);
      new import_obsidian5.Notice(`\u590D\u5236\u5F53\u524D\u5757\u5185\u5BB9\u5931\u8D25\uFF1A${this.formatError(error)}`);
    }
  }
  normalizeCopiedBlockForPaste(blockText, kind) {
    if (!blockText.trim()) return blockText;
    if (kind === "table" || this.looksLikeMarkdownTableBlock(blockText)) {
      return `
${blockText}
`;
    }
    return blockText;
  }
  looksLikeMarkdownTableBlock(blockText) {
    const lines = String(blockText ?? "").split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length < 2) return false;
    return this.isTableLine(lines[0]) && this.isTableLine(lines[1]);
  }
  convertBlockToDivider(context) {
    const range = this.getSelectedLineRange(context.editor) ?? this.getPersistedBlockRange(context.editor, context.line);
    this.replaceBlockRange(context.editor, range.startLine, range.endLine, "---");
    context.editor.setCursor({ line: range.startLine, ch: 3 });
    this.scheduleStyleRefresh();
  }
  moveBlock(context, direction) {
    const editor = context.editor;
    const current = this.getPersistedBlockRange(editor, context.line);
    const currentLines = this.readBlockLines(editor, current.startLine, current.endLine);
    if (!currentLines.length) return;
    if (direction === "up") {
      const previousLine = this.findPreviousRenderableLine(editor, current.startLine - 1);
      if (previousLine === null) {
        new import_obsidian5.Notice("\u5DF2\u7ECF\u5728\u6700\u4E0A\u65B9");
        return;
      }
      const previous = this.getPersistedBlockRange(editor, previousLine);
      const previousLines = this.readBlockLines(editor, previous.startLine, previous.endLine);
      const gapLines2 = this.readRangeIfAny(editor, previous.endLine + 1, current.startLine - 1);
      const replacement2 = [...currentLines, ...gapLines2, ...previousLines].join("\n");
      this.replaceBlockRange(editor, previous.startLine, current.endLine, replacement2);
      context.editor.setCursor({ line: previous.startLine, ch: 0 });
      this.scheduleStyleRefresh();
      return;
    }
    const nextLine = this.findNextRenderableLine(editor, current.endLine + 1);
    if (nextLine === null) {
      new import_obsidian5.Notice("\u5DF2\u7ECF\u5728\u6700\u4E0B\u65B9");
      return;
    }
    const next = this.getPersistedBlockRange(editor, nextLine);
    const nextLines = this.readBlockLines(editor, next.startLine, next.endLine);
    const gapLines = this.readRangeIfAny(editor, current.endLine + 1, next.startLine - 1);
    const replacement = [...nextLines, ...gapLines, ...currentLines].join("\n");
    this.replaceBlockRange(editor, current.startLine, next.endLine, replacement);
    context.editor.setCursor({ line: current.startLine + nextLines.length + gapLines.length, ch: 0 });
    this.scheduleStyleRefresh();
  }
  getPersistedBlockRange(editor, line) {
    const logical = this.getLogicalBlockRange(editor, line);
    const markerInfo = this.getStyleMarkerInfo(editor, logical.startLine);
    if (!markerInfo) return logical;
    return {
      startLine: markerInfo.line,
      endLine: logical.endLine
    };
  }
  findPreviousRenderableLine(editor, startLine) {
    for (let line = Math.min(startLine, editor.lineCount() - 1); line >= 0; line -= 1) {
      const current = String(editor.getLine(line) ?? "");
      if (!current.trim() || this.isStyleMarkerLine(current)) continue;
      return line;
    }
    return null;
  }
  getLogicalBlockRange(editor, line) {
    const current = String(editor.getLine(line) ?? "");
    if (this.isStyleMarkerLine(current)) {
      const nextRenderableLine = this.findNextRenderableLine(editor, line + 1);
      if (nextRenderableLine !== null) {
        return this.getLogicalBlockRange(editor, nextRenderableLine);
      }
    }
    if (this.isInsideFence(editor, line)) {
      return this.getFenceRange(editor, line);
    }
    if (this.isTableLine(current)) {
      let startLine2 = line;
      let endLine2 = line;
      while (startLine2 > 0 && this.isTableLine(String(editor.getLine(startLine2 - 1) ?? ""))) {
        startLine2 -= 1;
      }
      const lastLine2 = editor.lineCount() - 1;
      while (endLine2 < lastLine2 && this.isTableLine(String(editor.getLine(endLine2 + 1) ?? ""))) {
        endLine2 += 1;
      }
      return { startLine: startLine2, endLine: endLine2 };
    }
    if (this.isQuoteLine(current)) {
      return this.getQuoteBlockRange(editor, line);
    }
    if (this.isListItemLine(current)) {
      return this.getListItemRange(editor, line);
    }
    if (this.isSingleLineBlock(current)) {
      return { startLine: line, endLine: line };
    }
    let startLine = line;
    let endLine = line;
    while (startLine > 0 && String(editor.getLine(startLine - 1) ?? "").trim() && !this.isStyleMarkerLine(String(editor.getLine(startLine - 1) ?? "")) && !this.isStructuredBlockLine(String(editor.getLine(startLine - 1) ?? ""))) {
      startLine -= 1;
    }
    const lastLine = editor.lineCount() - 1;
    while (endLine < lastLine && String(editor.getLine(endLine + 1) ?? "").trim() && !this.isStyleMarkerLine(String(editor.getLine(endLine + 1) ?? "")) && !this.isStructuredBlockLine(String(editor.getLine(endLine + 1) ?? ""))) {
      endLine += 1;
    }
    return { startLine, endLine };
  }
  getBlockKind(editor, line) {
    const current = String(editor.getLine(line) ?? "");
    if (this.isStyleMarkerLine(current)) {
      const nextRenderableLine = this.findNextRenderableLine(editor, line + 1);
      if (nextRenderableLine !== null) {
        return this.getBlockKind(editor, nextRenderableLine);
      }
    }
    if (this.isInsideFence(editor, line)) return "codeFence";
    if (this.isTableLine(current)) return "table";
    if (this.isQuoteLine(current)) {
      const quoteRange = this.getQuoteBlockRange(editor, line);
      const firstLine = String(editor.getLine(quoteRange.startLine) ?? "");
      return this.isCalloutMarkerLine(firstLine) ? "callout" : "quote";
    }
    if (this.isListItemLine(current)) return "listItem";
    const trimmed = current.trim();
    if (/^#{1,6}\s+/.test(trimmed)) return "heading";
    if (/^---+$/.test(trimmed)) return "divider";
    return "paragraph";
  }
  isSingleLineBlock(line) {
    const trimmed = line.trim();
    return /^#{1,6}\s+/.test(trimmed) || /^---+$/.test(trimmed);
  }
  isTableLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return /^\|.*\|$/.test(trimmed) || /^\|?[\s:-]+\|[\s|:-]*$/.test(trimmed);
  }
  isQuoteLine(line) {
    return /^\s*>\s?/.test(String(line ?? ""));
  }
  isCalloutMarkerLine(line) {
    return /^\s*>\s*\[![^\]]+\]/.test(String(line ?? ""));
  }
  isListItemLine(line) {
    return /^\s*(?:[-*+]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)/.test(String(line ?? ""));
  }
  getLineIndent(line) {
    return String(line ?? "").match(/^\s*/)?.[0].length ?? 0;
  }
  isStructuredBlockLine(line) {
    const trimmed = String(line ?? "").trim();
    if (!trimmed) return false;
    return this.isTableLine(trimmed) || /^\s*```/.test(trimmed) || this.isSingleLineBlock(trimmed) || this.isQuoteLine(trimmed) || this.isListItemLine(trimmed);
  }
  isStyleMarkerLine(line) {
    return STYLE_MARKER_RE.test(String(line ?? ""));
  }
  isInsideFence(editor, line) {
    const range = this.getFenceRange(editor, line);
    return range.startLine !== line || range.endLine !== line || /^\s*```/.test(String(editor.getLine(line) ?? ""));
  }
  getFenceRange(editor, line) {
    let startLine = line;
    let endLine = line;
    while (startLine >= 0) {
      if (/^\s*```/.test(String(editor.getLine(startLine) ?? ""))) break;
      startLine -= 1;
    }
    if (startLine < 0) {
      return { startLine: line, endLine: line };
    }
    const lastLine = editor.lineCount() - 1;
    endLine = Math.max(line, startLine + 1);
    while (endLine <= lastLine) {
      if (/^\s*```/.test(String(editor.getLine(endLine) ?? "")) && endLine !== startLine) {
        return { startLine, endLine };
      }
      endLine += 1;
    }
    return { startLine: line, endLine: line };
  }
  getQuoteBlockRange(editor, line) {
    let startLine = line;
    let endLine = line;
    while (startLine > 0 && this.isQuoteLine(String(editor.getLine(startLine - 1) ?? ""))) {
      startLine -= 1;
    }
    const lastLine = editor.lineCount() - 1;
    while (endLine < lastLine && this.isQuoteLine(String(editor.getLine(endLine + 1) ?? ""))) {
      endLine += 1;
    }
    return { startLine, endLine };
  }
  getListItemRange(editor, line) {
    const baseIndent = this.getLineIndent(String(editor.getLine(line) ?? ""));
    let endLine = line;
    const lastLine = editor.lineCount() - 1;
    while (endLine < lastLine) {
      const nextLine = String(editor.getLine(endLine + 1) ?? "");
      if (!nextLine.trim() || this.isStyleMarkerLine(nextLine)) break;
      const nextIndent = this.getLineIndent(nextLine);
      if (this.isListItemLine(nextLine)) {
        if (nextIndent <= baseIndent) break;
        endLine += 1;
        continue;
      }
      if (this.isQuoteLine(nextLine) || this.isTableLine(nextLine) || /^\s*```/.test(nextLine) || this.isSingleLineBlock(nextLine)) {
        if (nextIndent <= baseIndent) break;
        endLine += 1;
        continue;
      }
      if (nextIndent > baseIndent) {
        endLine += 1;
        continue;
      }
      break;
    }
    return { startLine: line, endLine };
  }
  readBlockLines(editor, startLine, endLine) {
    const lines = [];
    for (let index = startLine; index <= endLine; index += 1) {
      lines.push(String(editor.getLine(index) ?? ""));
    }
    return lines;
  }
  readRangeIfAny(editor, startLine, endLine) {
    if (endLine < startLine) return [];
    return this.readBlockLines(editor, startLine, endLine);
  }
  replaceBlockRange(editor, startLine, endLine, text) {
    const endText = String(editor.getLine(endLine) ?? "");
    editor.replaceRange(text, { line: startLine, ch: 0 }, { line: endLine, ch: endText.length });
  }
  async copyBlockAsImage(context) {
    const previousHandleDisplay = this.handleEl?.style.display ?? "";
    this.hideToolbar(true);
    try {
      await this.waitForNextFrame();
      const screenshotCopied = await this.copyBlockAsImageWithMacScreenshot(context);
      if (screenshotCopied) {
        new import_obsidian5.Notice("\u5DF2\u590D\u5236\u5F53\u524D\u5757\u4E3A PNG \u56FE\u7247");
        return;
      }
      const backgroundColor = getComputedStyle(document.body).backgroundColor || "#ffffff";
      const rect = context.blockEl.getBoundingClientRect();
      const width = Math.max(1, Math.ceil(Math.max(context.blockEl.scrollWidth, rect.width)));
      const height = Math.max(1, Math.ceil(Math.max(context.blockEl.scrollHeight, rect.height)));
      const wrapper = this.createExportWrapper(width, height, backgroundColor);
      const clone = context.blockEl.cloneNode(true);
      clone.style.margin = "0";
      clone.style.transform = "none";
      clone.style.width = `${width}px`;
      clone.style.maxWidth = `${width}px`;
      this.stripNonContentArtifacts(clone);
      wrapper.stage.appendChild(clone);
      await this.waitForRenderSettled(wrapper.wrapper);
      const blob = await toBlob(wrapper.wrapper, {
        cacheBust: true,
        skipFonts: true,
        pixelRatio: Math.max(window.devicePixelRatio || 1, EXPORT_PIXEL_RATIO2),
        backgroundColor
      });
      if (!blob) {
        throw new Error("Failed to render block image");
      }
      await this.writeBlobToClipboard(blob);
      new import_obsidian5.Notice("\u5DF2\u590D\u5236\u5F53\u524D\u5757\u4E3A PNG \u56FE\u7247");
    } catch (error) {
      console.error("[feishu-doc-toolbar] copy block image failed", error);
      new import_obsidian5.Notice(`\u590D\u5236\u5F53\u524D\u5757\u56FE\u7247\u5931\u8D25\uFF1A${this.formatError(error)}`);
    } finally {
      const wrappers = document.querySelectorAll(".fdtb-export-wrapper");
      wrappers.forEach((node) => node.remove());
      if (this.handleEl) {
        this.handleEl.style.display = previousHandleDisplay;
      }
    }
  }
  async copyBlockAsImageWithMacScreenshot(context) {
    const execFile = window?.require?.("child_process")?.execFile;
    if (typeof execFile !== "function") return false;
    if (!navigator.userAgent.toLowerCase().includes("mac")) return false;
    const rect = context.blockEl.getBoundingClientRect();
    const width = Math.max(1, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(rect.height));
    const outerDeltaX = Math.max(0, window.outerWidth - window.innerWidth);
    const outerDeltaY = Math.max(0, window.outerHeight - window.innerHeight);
    const borderX = Math.round(outerDeltaX / 2);
    const titleBarY = Math.max(0, outerDeltaY - borderX);
    const screenX = Math.round(window.screenX + rect.left + borderX);
    const screenY = Math.round(window.screenY + rect.top + titleBarY);
    const region = `-R${screenX},${screenY},${width},${height}`;
    await new Promise((resolve, reject) => {
      execFile("/usr/sbin/screencapture", ["-x", "-c", region], (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    return true;
  }
  createExportWrapper(exportWidth, exportHeight, background) {
    const wrapper = document.createElement("div");
    wrapper.className = "fdtb-export-wrapper";
    wrapper.style.position = "fixed";
    wrapper.style.left = `${EXPORT_STAGING_OFFSET2}px`;
    wrapper.style.top = `${EXPORT_STAGING_OFFSET2}px`;
    wrapper.style.zIndex = "-1";
    wrapper.style.pointerEvents = "none";
    wrapper.style.background = background;
    wrapper.style.overflow = "hidden";
    wrapper.style.contain = "layout paint style";
    wrapper.style.isolation = "isolate";
    wrapper.style.padding = `${EXPORT_PADDING2}px`;
    wrapper.style.boxSizing = "border-box";
    wrapper.style.width = `${exportWidth + EXPORT_PADDING2 * 2}px`;
    wrapper.style.height = `${exportHeight + EXPORT_PADDING2 * 2}px`;
    const stage = document.createElement("div");
    stage.className = "fdtb-export-stage";
    stage.style.position = "relative";
    stage.style.width = `${exportWidth}px`;
    stage.style.height = `${exportHeight}px`;
    stage.style.overflow = "hidden";
    stage.style.background = background;
    wrapper.appendChild(stage);
    document.body.appendChild(wrapper);
    return {
      wrapper,
      stage,
      destroy: () => wrapper.remove()
    };
  }
  async writeBlobToClipboard(blob) {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type || "image/png"]: blob
          })
        ]);
        return;
      } catch (error) {
        console.warn("[feishu-doc-toolbar] navigator clipboard write failed", error);
      }
    }
    const electronClipboard = this.getElectronClipboard();
    if (!electronClipboard) {
      throw new Error("Desktop clipboard unavailable");
    }
    const { clipboard, nativeImage } = electronClipboard;
    const buffer = Buffer.from(await blob.arrayBuffer());
    clipboard.writeImage(nativeImage.createFromBuffer(buffer));
  }
  async writeTextToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.warn("[feishu-doc-toolbar] navigator clipboard writeText failed", error);
      }
    }
    const electronClipboard = this.getElectronClipboard();
    if (!electronClipboard?.clipboard || typeof electronClipboard.clipboard.writeText !== "function") {
      throw new Error("Desktop clipboard unavailable");
    }
    electronClipboard.clipboard.writeText(text);
  }
  getElectronClipboard() {
    const electron = window?.require?.("electron");
    if (!electron?.clipboard || !electron?.nativeImage) return null;
    return electron;
  }
  async waitForRenderSettled(root) {
    await this.waitForNextFrame();
    await this.waitForNextFrame();
    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(images.map((image) => this.waitForImage(image)));
    await this.waitForNextFrame();
  }
  waitForImage(image) {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  }
  waitForNextFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
  }
  stripNonContentArtifacts(root) {
    const selectors = [
      ".cm-cursor",
      ".cm-selectionLayer",
      ".cm-activeLine",
      ".cm-gutters",
      ".menu",
      ".suggestion-container",
      ".popover",
      ".fdtb-handle",
      ".fdtb-popover"
    ];
    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((element) => element.remove());
    }
  }
  formatError(error) {
    if (error instanceof Error) return error.message;
    return String(error);
  }
  scheduleHideToolbar() {
    this.clearHideTimer();
    this.hideTimer = window.setTimeout(() => {
      if (this.isToolbarInteractionActive()) return;
      this.hideToolbar();
    }, HOVER_HIDE_DELAY_MS);
  }
  clearHideTimer() {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
  hidePopover() {
    this.hideSubmenu();
    this.popoverEl?.remove();
    this.popoverEl = null;
  }
  hideToolbar(force = false) {
    if (!force && this.isToolbarInteractionActive()) {
      return;
    }
    this.hidePopover();
    if (this.handleEl) {
      this.handleEl.style.display = "none";
    }
    this.activeContext = null;
  }
  isToolbarInteractionActive() {
    const activeElement = document.activeElement;
    return [this.handleEl, this.popoverEl, this.submenuEl].some((el) => {
      if (!el) return false;
      const hasFocus = !!activeElement && el.contains(activeElement);
      const hasPointer = typeof el.matches === "function" && el.matches(":hover");
      return hasFocus || hasPointer;
    });
  }
};
