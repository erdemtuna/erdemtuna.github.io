import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const posts = new URL("../src/content/posts/", import.meta.url);
const archives = [
  [
    "prompt-bank",
    "2026-08-06T13:39:20.501Z",
    null,
    "c0c826a9f33576a8c071fc9a48b66847516f3e4d8046831ed43e0dc1fd503d92",
  ],
  [
    "how-my-ai-assisted-development-practice-evolved",
    "2026-09-04T16:30:25.000+00:00",
    "2026-09-06T14:47:16.000+00:00",
    "8c3c67b67e012b5f003bcf76ce5853083638f4f35b3ef2c3814efd451b587960",
  ],
  [
    "using-the-github-copilot-app-after-months-in-the-cli",
    "2026-09-14T17:47:12.000+00:00",
    "2026-09-14T17:47:39.000+00:00",
    "5b884c203cdc347e2ebb7e874806f5d23e68a81e75108020bc7f270897ecba68",
  ],
  [
    "the-gap-between-shipping-code-and-understanding-it",
    "2026-09-18T19:31:50.000+00:00",
    "2026-09-18T19:32:21.000+00:00",
    "f259c3e93545734288f80d602b76774b3315fd1998a3241513c54ae963d5efaf",
  ],
  [
    "doc-review",
    "2026-09-30T19:26:08.884Z",
    null,
    "395f193a47127857a45f577452038af9c0c7c459406f0d6a662ba71e775d23b5",
  ],
];
const images = [
  [
    "prompt-bank/attachment.jpg",
    "d33a09a914c93831d3acd7e5802f1dae858e165290a4c8c5af3c99323933083e",
  ],
  [
    "how-my-ai-assisted-development-practice-evolved/cover.png",
    "dcd1d81298f79c6ce1a8c3e87ae76477746b09424e24fdff8441a582843c2243",
  ],
  [
    "using-the-github-copilot-app-after-months-in-the-cli/cover.png",
    "86609c003ce0e1bfde0598626d37735ac477ffe1e201388c25cce8162d5c1182",
  ],
  [
    "using-the-github-copilot-app-after-months-in-the-cli/inline-1.png",
    "fb14afd873746e693aca868e70c58637a2dd632ad511ee3016063176e9a7a9b5",
  ],
  [
    "using-the-github-copilot-app-after-months-in-the-cli/inline-2.png",
    "1aff406d411607a5c7d277586b746d3657185f87462aa731120f2523862051a6",
  ],
  [
    "using-the-github-copilot-app-after-months-in-the-cli/inline-3.png",
    "42d5c9e7aa75daffd195990e4ac7daa974768d3e400958a3cf2a4140a6ce76da",
  ],
  [
    "using-the-github-copilot-app-after-months-in-the-cli/inline-4.png",
    "7f4ea783668e36f4e2ab53a9bfee9eba35404cf7b1c39380f96a3a6a698a691d",
  ],
  [
    "the-gap-between-shipping-code-and-understanding-it/cover.png",
    "851c74b604b48b3f6d4dfc64532ead498999b944cf57ac48f21b807624c043fb",
  ],
  [
    "the-gap-between-shipping-code-and-understanding-it/inline-1.png",
    "56cd897c91f02c6ca4b6b65306b56b481a2126bffaaafe221bf1fa704b4a9c38",
  ],
  [
    "the-gap-between-shipping-code-and-understanding-it/inline-2.png",
    "778d1373ffeb37fbfb5229944d57f9bd027f98852a6972262294dfb30606b647",
  ],
  [
    "doc-review/attachment.jpg",
    "2bb5ccdce5d74e00908fd62fb8c497fe54e0848edf323b7d27f9280193715173",
  ],
];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const originalProjectLinks = new Map([
  ["prompt-bank", "[https://lnkd.in/ed2AyPQh](https://lnkd.in/ed2AyPQh)"],
  ["doc-review", "[https://lnkd.in/eP3\\_gpaE](https://lnkd.in/eP3_gpaE)"],
]);

test("five imports retain original bodies and dates except resolved project URLs", async () => {
  for (const [slug, published, modified, bodyHash] of archives) {
    const markdown = (
      await readFile(new URL(`${slug}.md`, posts), "utf8")
    ).replaceAll("\r\n", "\n");
    const [, frontmatter, body] = markdown.split("---\n");
    let originalBody = body;
    const originalLink = originalProjectLinks.get(slug);
    if (originalLink) {
      const url = `https://github.com/erdemtuna/${slug}`;
      const directLink = `[${url}](${url})`;
      assert.equal(
        body.split(directLink).length,
        2,
        `${slug}: direct GitHub URL`
      );
      assert.ok(!body.includes("https://lnkd.in/"), `${slug}: no short links`);
      originalBody = body.replace(directLink, originalLink);
    }
    assert.equal(
      hash(originalBody.trim()),
      bodyHash,
      `${slug}: source-verified body apart from the approved URL replacement`
    );
    assert.ok(frontmatter.includes(`pubDatetime: ${published}\n`));
    if (modified) assert.ok(frontmatter.includes(`modDatetime: ${modified}\n`));
    else assert.ok(!frontmatter.includes("modDatetime:"));
    assert.ok(frontmatter.includes("tags: []\n"));
    assert.ok(frontmatter.includes("sourceUrl: https://www.linkedin.com/"));
    assert.ok(frontmatter.includes("sourceLabel: LinkedIn\n"));
    assert.ok(!frontmatter.includes("canonicalURL:"));
    assert.ok(!frontmatter.includes("featured: true"));
  }
});

test("the eleven selected original images retain their downloaded bytes", async () => {
  for (const [path, expected] of images)
    assert.equal(
      hash(await readFile(new URL(`_images/${path}`, posts))),
      expected,
      path
    );
});
