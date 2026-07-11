const assert = require("node:assert/strict");
const {
  absolutePathToFileUrl,
  buildOnlineEmbedUrl,
  buildSeekUrl,
  buildVideoSummaryMediaCandidates,
  convertLegacyTimelineLine,
  convertLegacyTimelineMarkdown,
  hasVideoSummarySeekLink,
  mediaTypeFromPath,
  parseSeekUrl,
  parseTimestampToSeconds,
  parseTimelineText,
} = require("./video-timestamp-preview-helpers-bundle.cjs");

assert.equal(parseTimestampToSeconds("00:00"), 0);
assert.equal(parseTimestampToSeconds("01:05"), 65);
assert.equal(parseTimestampToSeconds("01:02:03"), 3723);
assert.equal(parseTimestampToSeconds("bad"), null);

assert.equal(buildSeekUrl(65, 70), "#video-summary-seek?start=65&end=70");
assert.deepEqual(parseSeekUrl("#video-summary-seek?start=65&end=70"), { start: 65, end: 70 });
assert.deepEqual(parseSeekUrl("video-summary://seek?start=65&end=70"), { start: 65, end: 70 });
assert.equal(parseSeekUrl("https://example.com"), null);
assert.deepEqual(parseTimelineText("00:01 - 00:03 今天想跟大家分享"), { start: 1, end: 3 });
assert.deepEqual(parseTimelineText("- [00:10 - 00:13] 可以怎么使用"), { start: 10, end: 13 });
assert.equal(parseTimelineText("没有时间轴"), null);

assert.equal(
  convertLegacyTimelineLine("- [00:01 - 00:03] 今天想跟大家分享"),
  "- [00:01 - 00:03](#video-summary-seek?start=1&end=3) 今天想跟大家分享"
);
assert.equal(
  convertLegacyTimelineMarkdown("正文\n- [00:10 - 00:13] 可以怎么使用"),
  "正文\n- [00:10 - 00:13](#video-summary-seek?start=10&end=13) 可以怎么使用"
);
assert.equal(hasVideoSummarySeekLink("[00:00](#video-summary-seek?start=0)"), true);
assert.equal(hasVideoSummarySeekLink("[00:00](video-summary://seek?start=0)"), true);
assert.equal(hasVideoSummarySeekLink("[00:00](https://example.com)"), false);

assert.equal(
  absolutePathToFileUrl("/Users/mac/Videos/测试 视频.mp4"),
  "file:///Users/mac/Videos/%E6%B5%8B%E8%AF%95%20%E8%A7%86%E9%A2%91.mp4"
);
assert.equal(mediaTypeFromPath("/tmp/a.mp4"), "video");
assert.equal(mediaTypeFromPath("/tmp/a.mp3"), "audio");
assert.equal(mediaTypeFromPath("/tmp/a.txt"), "unknown");
assert.deepEqual(
  buildVideoSummaryMediaCandidates(
    "BV1Sp756vEhs",
    "/Applications/BiliNote.app/Contents/MacOS/data/BV1Sp756vEhs.mp4",
    "bilibili",
    "/Volumes/Mac移动硬盘/视频总结媒体库"
  ).slice(0, 4),
  [
    "/Volumes/Mac移动硬盘/视频总结媒体库/bilibili/BV1Sp756vEhs.preview.mp4",
    "/Volumes/Mac移动硬盘/视频总结媒体库/BV1Sp756vEhs.preview.mp4",
    "开发插件（Obsidian优化）/视频总结（仓库）/_media/BV1Sp756vEhs.preview.mp4",
    "视频总结（仓库）/_media/BV1Sp756vEhs.preview.mp4",
  ]
);
assert.equal(
  buildOnlineEmbedUrl("https://youtu.be/OcKl98ZQbMQ", "youtube", 65),
  "https://www.youtube.com/embed/OcKl98ZQbMQ?start=65&autoplay=1"
);
assert.equal(
  buildOnlineEmbedUrl("https://www.bilibili.com/video/BV198jE6pE8Y/", "bilibili", 5),
  ""
);
assert.equal(buildOnlineEmbedUrl("https://www.douyin.com/video/123", "douyin", 5), "");

console.log("video-timestamp-preview helpers smoke passed");
