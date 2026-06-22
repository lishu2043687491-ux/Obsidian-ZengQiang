/**
 * OneNote 原生粘贴 — 验收测试（开发内循环，礼书不必先跑）
 * 运行：npm run test:onenote-acceptance
 */
const assert = require("assert");
const path = require("path");
const { createPlugin, createFile, createElement, createTextNode } = require("./onenote-test-harness.cjs");

function assertNativeTable(md, label) {
  assert.ok(md && typeof md === "string", `${label}: should return markdown`);
  assert.ok(!md.includes("%% mdtp:tbl_"), `${label}: must not contain enhanced table marker`);
  assert.ok(/^\|[^\n]+\|/m.test(md), `${label}: should be pipe table`);
  assert.ok(md.split("\n").filter((l) => l.startsWith("|")).length >= 3, `${label}: need header+divider+body`);
}

function assertNoAsteriskSpam(md, label) {
  assert.ok(!/\*\*\*\*/.test(md), `${label}: must not have consecutive bold markers`);
  assert.ok(!/\*\*[^*]+\*\*\*\*/.test(md), `${label}: must not double-wrap bold`);
}

function run() {
  const plugin = createPlugin();
  const file = createFile("acceptance/onenote-paste.md");

  // --- C1 wyh nested ---
  {
    const inner = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("论点")] }),
                createElement("td", { childNodes: [createTextNode("理解技巧的价值是，能把繁杂的知识，做清晰地分类")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("论据")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1. 比如学白毛女这部戏剧，有四种学法:"),
                    createElement("br"),
                    createTextNode("2. 记角色、台词"),
                    createElement("br"),
                    createTextNode("3. 学概念，比如阶层压迫、人际心里"),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const outer = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", {
                  childNodes: [createTextNode("为什么"), createElement("br"), createTextNode("（意义/原因）")],
                }),
                createElement("td", { childNodes: [inner] }),
              ],
            }),
          ],
        }),
      ],
    });
    const md = plugin.convertOneNoteTableToNativeMarkdown(file, outer);
    assertNativeTable(md, "wyh-nested");
    assertNoAsteriskSpam(md, "wyh-nested");
    assert.ok(md.includes("• **论据**："), "wyh-nested: 论据 label");
    assert.ok(md.includes("记角色、台词"), "wyh-nested: numbered line 2");
  }

  // --- C2/C4 误区+方法 + 论据内误区 ---
  {
    const innerMistake = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("论据")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1. 事实性知识记忆技巧"),
                    createElement("br"),
                    createTextNode("2. 概念性知识三问"),
                  ],
                }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("误区")] }),
                createElement("td", { childNodes: [createTextNode("误区")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1. 低效率上手"),
                    createElement("br"),
                    createTextNode("· 没有梳理流程，一股脑就开始做"),
                  ],
                }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("方法")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1. 流程化：书面整理出全部的流程"),
                    createElement("br"),
                    createTextNode("· 用表格，搭建时间顺序框架"),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const md = plugin.convertOneNoteTableToNativeMarkdown(file, innerMistake);
    assertNativeTable(md, "lun-dian-with-mistake");
    assert.ok(md.includes("低效率上手"), "lun-dian: 误区 numbered");
    assert.ok(md.includes("流程化"), "lun-dian: 方法 content");
  }

  // --- D1 3、行为技能 序号|框架|主题 + 构建框架内嵌表 ---
  {
    const frameworkInner = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", {
                  childNodes: [createTextNode("为什么"), createElement("br"), createTextNode("（好处/弊端）")],
                }),
                createElement("td", { childNodes: [createTextNode("")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("论点")] }),
                createElement("td", { childNodes: [createTextNode("特点和误区")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("论据")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1. 程序性知识为主要"),
                    createElement("br"),
                    createTextNode("2. 强调熟练度和准确度"),
                  ],
                }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("误区")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1. 只靠直觉，不靠专业示范"),
                    createElement("br"),
                    createTextNode("2. 盲目模仿，没认清自己现有能力边界"),
                    createElement("br"),
                    createTextNode("3. 一昧的重复，没有改进"),
                  ],
                }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", {
                  childNodes: [createTextNode("怎么做"), createElement("br"), createTextNode("（流程/步骤）")],
                }),
                createElement("td", { childNodes: [createTextNode("")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("论点")] }),
                createElement("td", { childNodes: [createTextNode("行为技能的学习步骤")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("论据")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1. 挑选模仿对象"),
                    createElement("br"),
                    createTextNode("2. 量力模仿"),
                    createElement("br"),
                    createTextNode("3. 分解简化"),
                    createElement("br"),
                    createTextNode("4. 局部细化"),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const xuhao = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("序号")] }),
                createElement("td", { childNodes: [createTextNode("框架")] }),
                createElement("td", { childNodes: [createTextNode("主题：行为技能")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("1")] }),
                createElement("td", { childNodes: [createTextNode("明确目的")] }),
                createElement("td", { childNodes: [createTextNode("用 wyh 模型，练习拆文章")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("2")] }),
                createElement("td", { childNodes: [createTextNode("构建框架")] }),
                createElement("td", { childNodes: [frameworkInner] }),
              ],
            }),
          ],
        }),
      ],
    });
    const md = plugin.convertOneNoteTableToNativeMarkdown(file, xuhao);
    assertNativeTable(md, "behavior-skills-xuhao");
    assert.ok(md.includes("序号") && md.includes("框架"), "xuhao: header row");
    assert.ok(md.includes("用 wyh 模型"), "xuhao: row1 body");
    assert.ok(md.includes("程序性知识为主要"), "xuhao: 论据1");
    assert.ok(md.includes("只靠直觉"), "xuhao: 误区1");
    assert.ok(md.includes("挑选模仿对象"), "xuhao: 怎么做论据");
    assert.ok(md.includes("局部细化"), "xuhao: 论据4");
  }

  // --- C-clipboard: Windows HTML Format / StartFragment ---
  {
    const payload = [
      "Version:0.9",
      "StartFragment:00000133",
      "EndFragment:00000180",
      "<html><body><!--StartFragment-->",
      "<table><tr><td>列A</td><td>列B</td></tr></table>",
      "<!--EndFragment--></body></html>",
    ].join("\n");
    const extracted = plugin.extractHtmlFragmentFromClipboardPayload(payload);
    assert.ok(extracted.includes("<table"), "clipboard: fragment has table");
    assert.ok(extracted.includes("列A"), "clipboard: cell text preserved");
  }

  // --- C-clipboard: paste event with non-standard HTML type (macOS OneNote) ---
  {
    const appleHtml = "<table><tbody><tr><td>误区</td><td>1. 示例</td></tr></tbody></table>";
    const event = {
      clipboardData: {
        types: ["Apple HTML pasteboard type", "text/plain"],
        getData(type) {
          if (type === "text/html") return "";
          if (type === "Apple HTML pasteboard type") return appleHtml;
          if (type === "text/plain") return "误区\t1. 示例";
          return "";
        },
      },
    };
    const html = plugin.getHtmlFromClipboardEvent(event);
    assert.ok(html.includes("误区"), "clipboard-event: Apple HTML type");
    assert.ok(html.includes("<table"), "clipboard-event: table html");
  }

  // --- C-clipboard: TSV fallback → synthetic HTML ---
  {
    const tsv = "项目\t内容\n误区\t1. 低效率上手\n方法\t1. 流程化";
    const synthetic = plugin.plainTextTableToSyntheticHtml(tsv);
    assert.ok(synthetic.includes("<table"), "tsv-fallback: synthetic table");
    assert.ok(synthetic.includes("低效率上手"), "tsv-fallback: cell escaped content");
    const matrix = plugin.parseClipboardMatrix(tsv);
    assert.ok(matrix && matrix.length === 3, "tsv-fallback: matrix rows");
  }

  // --- C3: 三列 + 单元格内嵌套表（通用压扁，非硬编码词） ---
  {
    const inner = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("兴起时间")] }),
                createElement("td", { childNodes: [createTextNode("关键历程")] }),
                createElement("td", { childNodes: [createTextNode("兴起原因")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("20世纪50年代")] }),
                createElement("td", { childNodes: [createTextNode("Festinger 实验")] }),
                createElement("td", { childNodes: [createTextNode("观察不一致")] }),
              ],
            }),
          ],
        }),
      ],
    });
    const outer = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("问题")] }),
                createElement("td", { childNodes: [createTextNode("自检清单")] }),
                createElement("td", { childNodes: [createTextNode("示范")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("一，来龙去脉")] }),
                createElement("td", { childNodes: [createTextNode("○ 要点")] }),
                createElement("td", { childNodes: [inner] }),
              ],
            }),
          ],
        }),
      ],
    });
    const md = plugin.convertOneNoteTableToNativeMarkdown(file, outer);
    assertNativeTable(md, "three-col-nested");
    assertNoAsteriskSpam(md, "three-col-nested");
    assert.ok(md.includes("问题") && md.includes("示范"), "three-col: header row kept");
    assert.ok(md.includes("Festinger"), "three-col: nested cell content");
    assert.ok(md.includes("一，来龙去脉") || md.includes("来龙去脉"), "three-col: group key");
  }

  // --- C4: 超链接保留 ---
  {
    const link = createElement("a", {
      attributes: { href: "https://example.com/register" },
      childNodes: [createTextNode("注册流程")],
    });
    const table = createElement("table", {
      childNodes: [
        createElement("tbody", {
          childNodes: [
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("时间顺序")] }),
                createElement("td", { childNodes: [createTextNode("关键内容")] }),
              ],
            }),
            createElement("tr", {
              childNodes: [
                createElement("td", { childNodes: [createTextNode("注册")] }),
                createElement("td", {
                  childNodes: [
                    createTextNode("1、"),
                    link,
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const md = plugin.convertOneNoteTableToNativeMarkdown(file, table);
    assertNativeTable(md, "hyperlink");
    assert.ok(md.includes("[注册流程](https://example.com/register)"), "hyperlink: markdown link");
    assertNoAsteriskSpam(md, "hyperlink");
  }

  // --- flattenNestedTableToText 直接调用 ---
  {
    const flat = plugin.flattenNestedTableToText([
      ["误区", "1. 低效率"],
      ["", "· 子项"],
      ["方法", "1. 流程化"],
    ]);
    assert.ok(flat.includes("• **误区**"), "flatten: label bullet");
    assert.ok(flat.includes("流程化"), "flatten: method body");
    assertNoAsteriskSpam(flat, "flatten-direct");
  }

  console.log("onenote-paste-acceptance: all cases passed");
}

run();
