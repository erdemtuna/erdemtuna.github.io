import assert from "node:assert/strict";
import test from "node:test";
import { loadSource } from "./load-source.mjs";

const { articleStructuredData, jsonForHtml } = loadSource(
  "src/utils/structuredData.ts"
);

test("article schema uses visible author, raw headline, absolute URL/image and ISO dates", () => {
  const schema = articleStructuredData({
    title: "An article",
    description: "A description",
    author: "Guest",
    siteAuthor: "Erdem Tuna",
    profile: "https://github.com/erdemtuna",
    url: "https://example.com/original/",
    image: "https://example.com/posts/article/index.png",
    published: new Date("2020-01-01T12:00:00Z"),
    modified: new Date("2020-02-01T12:00:00Z"),
  });
  assert.equal(schema.headline, "An article");
  assert.equal(schema.author.name, "Guest");
  assert.equal(schema.author.url, undefined);
  assert.equal(schema.url, schema.mainEntityOfPage["@id"]);
  assert.equal(schema.datePublished, "2020-01-01T12:00:00.000Z");
  assert.equal(schema.dateModified, "2020-02-01T12:00:00.000Z");
  assert.ok(schema.image.startsWith("https://"));
});

test("JSON-LD cannot close its HTML script and missing modification date uses publication", () => {
  const schema = articleStructuredData({
    title: "</script><script>alert(1)</script>",
    author: "Erdem Tuna",
    siteAuthor: "Erdem Tuna",
    profile: "https://github.com/erdemtuna",
    url: "https://example.com/posts/test/",
    image: "https://example.com/og.png",
    published: new Date("2020-01-01"),
  });
  const json = jsonForHtml(schema);
  assert.ok(!json.includes("<"));
  assert.equal(JSON.parse(json).headline, schema.headline);
  assert.equal(schema.author.url, "https://github.com/erdemtuna");
  assert.equal(schema.datePublished, schema.dateModified);
});
