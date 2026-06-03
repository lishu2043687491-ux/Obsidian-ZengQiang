/** 供 Node 下启动内嵌 block-link-plus 的最小 @codemirror 桩 */
function noop() {
  return noop;
}

function ofValue() {
  return {};
}

function chainable() {
  const fn = () => chainable;
  fn.of = ofValue;
  fn.from = ofValue;
  fn.define = ofValue;
  fn.combine = ofValue;
  fn.create = ofValue;
  fn.cursor = ofValue;
  fn.match = ofValue;
  fn.highlight = ofValue;
  fn.highlightSelectionMatches = ofValue;
  fn.setSearchQuery = ofValue;
  fn.findNext = ofValue;
  fn.findPrevious = ofValue;
  fn.selectSelectionMatches = ofValue;
  fn.replaceAll = ofValue;
  fn.replaceNext = ofValue;
  fn.closeSearchPanel = ofValue;
  fn.openSearchPanel = ofValue;
  fn.acceptCompletion = ofValue;
  fn.startCompletion = ofValue;
  fn.closeCompletion = ofValue;
  fn.moveCompletionSelection = ofValue;
  fn.insertCompletionText = ofValue;
  fn.nextSnippetField = ofValue;
  fn.prevSnippetField = ofValue;
  fn.clearSnippet = ofValue;
  fn.nextDiagnostic = ofValue;
  fn.prevDiagnostic = ofValue;
  fn.indentMore = noop;
  fn.indentLess = noop;
  return fn;
}

class RangeSet {
  static empty = new RangeSet();
  static of() {
    return new RangeSet();
  }
}

const Decoration = {
  none: RangeSet.empty,
  mark: chainable,
  widget: chainable,
  replace: chainable,
  line: chainable,
};

class RangeSetBuilder {
  add() {}
  finish() {
    return RangeSet.empty;
  }
}

const ViewPlugin = {
  define: ofValue,
  fromClass: ofValue,
};

const EditorView = chainable();
EditorView.updateListener = { of: ofValue };
EditorView.decorations = { of: ofValue, from: ofValue };
EditorView.theme = { of: ofValue };
EditorView.baseTheme = { of: ofValue };
EditorView.contentAttributes = { of: ofValue };
EditorView.lineWrapping = {};
EditorView.lineNumbers = chainable;
EditorView.keymap = { of: ofValue };

const StateField = { define: ofValue };
const StateEffect = { define: ofValue };
const Annotation = { define: ofValue };
const Transaction = { userEvent: { of: ofValue } };
const EditorState = {
  transactionFilter: { of: ofValue },
  allowMultipleSelections: { of: ofValue },
  create: ofValue,
};
const MatchDecorator = class {
  constructor() {
    this.createDeco = () => RangeSet.empty;
    this.updateDeco = () => RangeSet.empty;
  }
};

function makeCmPackage() {
  const pkg = chainable();
  Object.assign(pkg, {
    RangeSet,
    RangeSetBuilder,
    Decoration,
    MatchDecorator,
    ViewPlugin,
    EditorView,
    StateField,
    StateEffect,
    Annotation,
    EditorState,
    Transaction,
    EditorSelection: { create: ofValue, cursor: ofValue, range: ofValue },
    Facet: { define: () => ({ combine: () => ({}) }) },
    Prec: { highest: (x) => x, low: (x) => x, default: (x) => x },
    Extension: { define: ofValue, set: ofValue },
    Compartment: class {
      of(x) {
        return x;
      }
      reconfigure() {
        return {};
      }
    },
    lineNumbers: chainable,
    highlightActiveLineGutter: chainable,
    highlightSpecialChars: chainable,
    drawSelection: chainable,
    dropCursor: chainable,
    rectangularSelection: chainable,
    crosshairCursor: chainable,
    highlightActiveLine: chainable,
    keymap: { of: ofValue },
    history: chainable,
    foldGutter: chainable,
    indentOnInput: chainable,
    syntaxHighlighting: chainable,
    defaultHighlightStyle: {},
    bracketMatching: chainable,
    foldKeymap: [],
    defaultKeymap: [],
    historyKeymap: [],
    searchKeymap: [],
    completionKeymap: [],
    lintKeymap: [],
    indentWithTab: {},
    autocompletion: chainable,
    closeBrackets: chainable,
    closeBracketsKeymap: [],
    lintGutter: chainable,
    linter: chainable,
    highlightSelectionMatches: chainable,
    search: chainable,
  });
  return pkg;
}

const cmState = makeCmPackage();

module.exports = {
  "@codemirror/view": makeCmPackage(),
  "@codemirror/state": cmState,
  "@codemirror/text": cmState,
  "@codemirror/commands": makeCmPackage(),
  "@codemirror/language": makeCmPackage(),
  "@codemirror/search": makeCmPackage(),
  "@codemirror/autocomplete": makeCmPackage(),
  "@codemirror/lint": makeCmPackage(),
  "@lezer/common": { NodeType: { define: () => ({}) } },
  "@lezer/highlight": { styleTags: () => ({}) },
};
