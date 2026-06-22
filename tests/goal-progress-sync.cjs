const assert = require("node:assert/strict");

const sync = require("./goal-progress-sync-bundle.cjs");

const reviewText = `
## 6.14周复盘
01、整体目标自检

| 类型     | 周目标                                                       | 现状                     | 差距                                                             |
| ------ | --------------------------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| 工作目标   | 推进完成月绩效的达成<br><br>标准：企微号新增20+可用，投放备用方案测通1个，听课链路测通 1 个备用方案 | 整体完成度 80% 左右           | 1、进度滞后下周：投放备用方案测通1个，目前影响不大，滞后处理也不影响我绩效<br>2、客观原因：管局审核太长，本周五才通过 |
| 生活健康目标 | 睡眠：本周完成5天规律睡眠                                             | 睡眠：本周完成5天规律睡眠          | /                                                              |
|        | 运动：一周30组有负荷的增肌训练，2节拳击课                                    | 运动：一周20组有负荷的增肌训练，3节拳击课 | 缺10 组练腿                                                        |
| 找对象目标  | 没定目标                                                      | 没推进行动                  | /                                                              |

## 6.7-8周复盘

01、整体目标自检

| 类型     | 周目标                                                                       | 现状                          | 差距    |
| ------ | ------------------------------------------------------------------------- | --------------------------- | ----- |
| 工作目标   | 快速推进月绩效，了解实际问题和进展<br><br>标准：把预想月绩效3 件事的完成方案，快速做一轮推进，根据实际情况和风险，拆解安排后 3 周计划 | 全完成                         | /     |
| 生活健康目标 | 睡眠：本周完成5天规律睡眠                                                             | 睡眠：本周完成3天规律睡眠               | 睡眠2 天 |
|        | 运动：一周30组有负荷的增肌训练，1节拳击课                                                    | 运动：一周30组有负荷的增肌训练，3节拳击课      | /     |
| 找对象目标  | 没定目标                                                                      | 参加 1 次线下活动，加到3 个女生微信，但画像不适合 | /     |

## 5.23-24日周复盘
01、整体目标自检

| 类型     | 周目标                                                                                | 现状                            | 差距                             |
| ------ | ---------------------------------------------------------------------------------- | ----------------------------- | ------------------------------ |
| 工作目标   | 目标：推进解决完，绩效优先级1和3的部分<br><br>标准：备用听课链路测通，搞定小程序支付链路（备好拉卡拉商户号/上海芝士圈备用），企微号买号确定好具体做号时间 | 完成度：90%<br>已推进解决完，绩效优先级1和3的部分 | 客观限制：<br>只差备用小程序收款链路（拉卡拉收款过审的） |
| 生活健康目标 | 体力基础：本周完成5天规律睡眠                                                                    | 体力基础：本周完成4天规律睡眠               | 1天按时入睡                         |
|        | 运动：一周40组有负荷的增肌训练，1节拳击课                                                             | 运动：一周 65组有负荷的增肌训练，1节拳击课       | 准备补练了上周感冒缺的25组                 |
| 找对象目标  | 没定目标                                                                               | 没有主动推进                        | /                              |
[[5月第3周计划]]
==**02、复盘分析**==
`;

const planFiles = [
  {
    path: "❷自我管理/3️⃣我的实操/2计划/每周计划进展/2026.6月计划/6 月第1周计划.md",
    basename: "6 月第1周计划",
  },
  {
    path: "❷自我管理/3️⃣我的实操/2计划/每周计划进展/2026.6月计划/6 月第2周计划.md",
    basename: "6 月第2周计划",
  },
  {
    path: "❷自我管理/3️⃣我的实操/2计划/每周计划进展/2026.5月计划/5月第3周计划.md",
    basename: "5月第3周计划",
  },
];

const entries = sync.buildGoalProgressEntries({
  reviewText,
  reviewPath: sync.GOAL_PROGRESS_REVIEW_PATH,
  planFiles,
});

assert.equal(entries.length, 12, "three weekly reviews should produce 12 progress rows");
assert.equal(entries.filter((entry) => entry.category === "工作").length, 3);
assert.equal(entries.filter((entry) => entry.category === "生活健康").length, 6);
assert.equal(entries.filter((entry) => entry.category === "找对象").length, 3);

const juneSecond = entries.find(
  (entry) => entry.weekLabel === "6.14周复盘" && entry.category === "工作"
);
assert.equal(juneSecond.planPath, planFiles[1].path, "6.14 should match June week 2 plan");

const juneFirst = entries.find(
  (entry) => entry.weekLabel === "6.7-8周复盘" && entry.category === "工作"
);
assert.equal(juneFirst.planPath, planFiles[0].path, "6.7-8 should match June week 1 plan");

const explicitMay = entries.find(
  (entry) => entry.weekLabel === "5.23-24日周复盘" && entry.category === "工作"
);
assert.equal(explicitMay.planPath, planFiles[2].path, "explicit wiki link should win for May review");

const targetText = [
  " 背景信息：[对年度目标思考和拆解](https://example.com)",
  "",
  sync.GOAL_PROGRESS_SYNC_START,
  "## 旧的自动同步区",
  "这块内容应该被清理，不继续占用目标页。",
  sync.GOAL_PROGRESS_SYNC_END,
  "",
  "# 一、工作目标",
  "",
  "| 时间 | 目标明细 | 当前现状 | 进展/差距 | 备注栏：有原目标等内容 |",
  "| --- | --- | --- | --- | --- |",
  "| 5月第3周目标 | 目标：推进解决完，绩效优先级1和3的部分 | 完成度：90% | 客观限制 |  |",
  "",
  "# 二、生活目标",
  "",
  "| 时间 | 目标描述 | 现状 | 进展/差距 |",
  "| --- | --- | --- | --- |",
  "| 5月第3周目标 | 体力基础：本周完成5天规律睡眠 | 体力基础：本周完成4天规律睡眠 | 1天按时入睡 |",
  "",
  "# 三、礼书的找女朋友目标",
  "",
  "| 时间 | 目标描述 | 现状 | 进展/差距 |",
  "| --- | --- | --- | --- |",
].join("\n");

const update = sync.buildGoalProgressSyncUpdate({
  reviewText,
  targetText,
  reviewPath: sync.GOAL_PROGRESS_REVIEW_PATH,
  planFiles,
  generatedAt: "2026-06-14 23:30",
});
assert.equal(update.ok, true);
assert.equal(sync.countGoalProgressSyncBlocks(update.targetText), 0, "old generated sync block should be removed");
assert.equal(update.appendedCount, 11, "only fully duplicated rows should be skipped");
assert.ok(!update.targetText.includes("## 目标进展自动同步"));
assert.ok(update.targetText.includes("| 6月第2周目标 | 推进完成月绩效的达成<br><br>标准：企微号新增20+可用，投放备用方案测通1个，听课链路测通 1 个备用方案 | 整体完成度 80% 左右 | 1、进度滞后下周：投放备用方案测通1个，目前影响不大，滞后处理也不影响我绩效<br>2、客观原因：管局审核太长，本周五才通过 |  |"));
assert.ok(update.targetText.includes("| 6月第2周目标 | 睡眠：本周完成5天规律睡眠 | 睡眠：本周完成5天规律睡眠 | / |"));
assert.ok(update.targetText.includes("| / | 运动：一周30组有负荷的增肌训练，2节拳击课 | 运动：一周20组有负荷的增肌训练，3节拳击课 | 缺10 组练腿 |"));
assert.ok(update.targetText.includes("| 6月第1周目标 | 没定目标 | 参加 1 次线下活动，加到3 个女生微信，但画像不适合 | / |"));
assert.ok(update.targetText.includes("# 一、工作目标"), "original target content should be preserved");

const secondUpdate = sync.buildGoalProgressSyncUpdate({
  reviewText,
  targetText: update.targetText,
  reviewPath: sync.GOAL_PROGRESS_REVIEW_PATH,
  planFiles,
  generatedAt: "2026-06-14 23:30",
});
assert.equal(secondUpdate.ok, true);
assert.equal(sync.countGoalProgressSyncBlocks(secondUpdate.targetText), 0, "rerun must not recreate sync block");
assert.equal(secondUpdate.targetText, update.targetText, "same input should be idempotent");

const brokenTarget = "背景信息\n\n# 工作目标";
const protectedUpdate = sync.buildGoalProgressSyncUpdate({
  reviewText,
  targetText: brokenTarget,
  reviewPath: sync.GOAL_PROGRESS_REVIEW_PATH,
  planFiles,
});
assert.equal(protectedUpdate.ok, false, "missing first section should block writing");
assert.equal(protectedUpdate.targetText, brokenTarget, "blocked write should keep target text untouched");

const noTableUpdate = sync.buildGoalProgressSyncUpdate({
  reviewText: "## 6.14周复盘\n没有表格",
  targetText,
  planFiles,
});
assert.equal(noTableUpdate.ok, false, "missing review table should block writing");
assert.equal(noTableUpdate.targetText, targetText);

console.log("goal-progress-sync tests passed");
