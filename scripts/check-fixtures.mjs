import assert from "node:assert/strict";
import { access, readFile, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import sharp from "sharp";
import { checkOutput } from "./check-output.mjs";

const prefix = "validation-fixture-";
const folder = join("src", "content", "posts");
const names = [
  "image.png",
  "cover.md",
  "draft.md",
  "future.md",
  "text.mdx",
  "one.md",
  "two.md",
  "three.md",
  "four.md",
];
const files = names.map(name => join(folder, `${prefix}${name}`));
const cleanup = async () => {
  for (const file of files) await rm(file, { force: true });
};
const build = (success = true) => {
  assert.ok(process.env.npm_execpath, "Run via pnpm run test:fixtures");
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, "run", "build"],
    {
      encoding: "utf8",
      timeout: 300_000,
      maxBuffer: 10_000_000,
    }
  );
  if (success && result.status !== 0)
    throw new Error(result.stdout + result.stderr);
  if (!success)
    assert.notEqual(
      result.status,
      0,
      "Invalid cover must fail collection validation"
    );
  return result.stdout + result.stderr;
};
const content = (
  title,
  extra = "",
  body = "Fixture body for local automated validation."
) =>
  `---\ntitle: ${JSON.stringify(title)}\ndescription: "Local validation fixture; never published."\npubDatetime: 2020-01-01T12:00:00Z\ntags: [validation]\n${extra}\n---\n\n${body}\n`;

if (process.argv.includes("--cleanup")) {
  await cleanup();
  process.exit(0);
}
for (const file of files) {
  await assert.rejects(
    access(file),
    /ENOENT/,
    `${file} must not overwrite existing content`
  );
}
const keep = process.argv.includes("--keep");
let passed = false;
try {
  await sharp({
    create: { width: 1280, height: 640, channels: 3, background: "#eaeedf" },
  })
    .png()
    .toFile(files[0]);
  await writeFile(
    files[1],
    content("Cover fixture", `cover: ./${prefix}image.png`),
    { flag: "wx" }
  );
  assert.match(build(false), /coverAlt|meaningful/i);
  await writeFile(
    files[1],
    content(
      "Cover fixture",
      `cover: ./${prefix}image.png\ncoverAlt: Olive field for image validation\ncoverCaption: Local validation caption`
    )
  );
  build();
  await checkOutput();
  let cover = await readFile(
    join("dist", "posts", `${prefix}cover`, "index.html"),
    "utf8"
  );
  assert.match(cover, /alt="Olive field for image validation"/);
  assert.match(cover, /width="\d+" height="\d+"/);
  assert.match(cover, /srcset=/);
  assert.match(cover, /Local validation caption/);
  let home = await readFile(join("dist", "index.html"), "utf8");
  assert.ok(
    !home.includes('id="featured-title"'),
    "Nonfeatured post uses recent section"
  );
  assert.match(home, /Cover fixture/);
  assert.ok(!home.includes("No posts yet"));
  await writeFile(
    files[1],
    content(
      "Cover fixture",
      `featured: true\ncover: ./${prefix}image.png\ncoverAlt: Olive field for image validation\ncoverCaption: Local validation caption\ncanonicalURL: https://example.com/original/\nauthor: Guest Author`
    )
  );
  await writeFile(files[2], content("Private draft sentinel", "draft: true"));
  await writeFile(
    files[3],
    content("Future sentinel").replace("2020-01-01", "2099-01-01")
  );
  await writeFile(
    files[4],
    content(
      "An unusually long heading with enough words to exercise wrapping across narrow screens and generated social cards",
      "",
      `## A heading\n\n> An editorial quotation.\n\n- A list item\n- Another item\n\n| First | Second |\n| --- | --- |\n| Value | Value |\n\n\`\`\`js\nconst value = "code";\n\`\`\`\n\n![Inline local image](./${prefix}image.png)\n\n<div className="validation-mdx">Rendered MDX fixture</div>`
    )
  );
  for (let index = 5; index < files.length; index++) {
    await writeFile(
      files[index],
      content(
        `Text-only fixture ${index}`,
        index === 5 ? `ogImage: ./${prefix}image.png` : ""
      )
    );
  }
  const output = build();
  await checkOutput();
  assert.match(
    output,
    /Indexed 7 pages/,
    "Search indexes six public articles and About, not drafts/future"
  );
  home = await readFile(join("dist", "index.html"), "utf8");
  assert.match(home, /id="featured-title"/);
  assert.match(home, /featured-card/);
  assert.match(home, /srcset=/);
  assert.ok(!home.includes("No posts yet"));
  const listing = await readFile(
    join("dist", "posts", "2", "index.html"),
    "utf8"
  );
  assert.match(listing, /Writing - Page 2/);
  await access(join("dist", "tags", "validation", "2", "index.html"));
  cover = await readFile(
    join("dist", "posts", `${prefix}cover`, "index.html"),
    "utf8"
  );
  assert.match(
    cover,
    /rel="canonical" href="https:\/\/example.com\/original\/"/
  );
  assert.match(cover, /"name":"Guest Author"/);
  assert.ok(
    !cover.includes('"name":"Guest Author","url"'),
    "Guest must not inherit site author's profile"
  );
  const text = await readFile(
    join("dist", "posts", `${prefix}text`, "index.html"),
    "utf8"
  );
  for (const pattern of [
    /blockquote/,
    /<table/,
    /astro-code/,
    /Inline local image/,
    /Rendered MDX fixture/,
  ])
    assert.match(text, pattern);
  for (const kind of ["draft", "future"]) {
    await assert.rejects(
      access(join("dist", "posts", `${prefix}${kind}`, "index.html")),
      /ENOENT/
    );
    await assert.rejects(
      access(join("dist", "posts", `${prefix}${kind}`, "index.png")),
      /ENOENT/
    );
  }
  for (const filename of ["rss.xml", "sitemap-0.xml", "index.html"]) {
    const rendered = await readFile(join("dist", filename), "utf8");
    assert.ok(
      !/Private draft sentinel|Future sentinel|validation-fixture-(draft|future)/.test(
        rendered
      )
    );
  }
  process.stdout.write(
    "Fixture matrix passed: cover validation, single/no-featured, multiple pages, MDX/images, canonical override, guest schema, draft/future exclusion.\n"
  );
  passed = true;
} finally {
  if (!keep || !passed) {
    await cleanup();
    build();
    await checkOutput();
  } else {
    process.stdout.write(
      "Local fixtures retained for browser checks only. Run pnpm run test:fixtures --cleanup before committing, then rebuild.\n"
    );
  }
}
