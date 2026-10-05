import assert from "node:assert/strict";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
  rm,
  symlink,
} from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
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
const originalRoot = process.cwd();
const fixtureRoot = await mkdtemp(join(tmpdir(), "astro-paper-fixtures-"));
try {
  const excluded = new Set([".git", ".astro", "dist", "node_modules"]);
  const postsRoot = resolve(folder);
  for (const entry of await readdir(originalRoot)) {
    if (excluded.has(entry)) continue;
    await cp(join(originalRoot, entry), join(fixtureRoot, entry), {
      recursive: true,
      filter: path => resolve(path) !== postsRoot,
    });
  }
  await mkdir(join(fixtureRoot, folder), { recursive: true });
  if (process.platform === "win32") {
    await symlink(
      join(originalRoot, "node_modules"),
      join(fixtureRoot, "node_modules"),
      "junction"
    );
  } else {
    // Astro's Linux compiler needs dependency components inside the build root.
    await cp(
      join(originalRoot, "node_modules"),
      join(fixtureRoot, "node_modules"),
      { recursive: true, verbatimSymlinks: true }
    );
  }
} catch (error) {
  await rm(fixtureRoot, { recursive: true, force: true });
  throw error;
}
process.chdir(fixtureRoot);
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
    content("Source validation fixture", "sourceLabel: LinkedIn")
  );
  assert.match(build(false), /sourceUrl/);
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
      `featured: true\ncover: ./${prefix}image.png\ncoverAlt: Olive field for image validation\ncoverCaption: Local validation caption\ncanonicalURL: https://example.com/original/\nsourceUrl: https://example.com/source/\nsourceLabel: LinkedIn\nmodDatetime: 2020-01-02T12:00:00Z\nauthor: Guest Author`,
      `Fixture author's "original punctuation" -- including ... and an existing curly quote: ’.`
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
  assert.match(cover, /href="https:\/\/example.com\/source\/"/);
  assert.ok(
    cover.includes(
      `Fixture author's "original punctuation" -- including ... and an existing curly quote: ’.`
    ),
    "Markdown must not rewrite original punctuation"
  );
  const feed = await readFile(join("dist", "rss.xml"), "utf8");
  const coverItem = feed
    .split("<item>")
    .find(item => item.includes("Cover fixture"));
  assert.match(coverItem, /<pubDate>Wed, 01 Jan 2020 12:00:00 GMT<\/pubDate>/);
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
  try {
    if (!keep || !passed) {
      await cleanup();
      if (passed) {
        build();
        await checkOutput();
        const home = await readFile(join("dist", "index.html"), "utf8");
        assert.match(
          home,
          /No posts yet/,
          "Isolated empty fixture stays valid"
        );
        const search = await readFile(
          join("dist", "search", "index.html"),
          "utf8"
        );
        assert.match(search, /No published writing to search yet/);
      }
    } else {
      process.stdout.write(
        `Local browser fixtures retained at ${fixtureRoot}.\n`
      );
    }
  } finally {
    process.chdir(originalRoot);
    if (!keep || !passed)
      await rm(fixtureRoot, { recursive: true, force: true });
  }
}
