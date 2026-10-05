import assert from "node:assert/strict";
import { access, readdir, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

const origin = new URL(process.argv[2] ?? "http://127.0.0.1:4331");
assert.ok(
  ["127.0.0.1", "localhost"].includes(origin.hostname),
  "Use a local dev server"
);
const folder = join("src", "content", "posts");
const prefix = `validation-fixture-live-${randomUUID()}`;
const files = [join(folder, `${prefix}.md`), join(folder, `${prefix}-mdx.mdx`)];
const markdownRoute = `/posts/${prefix}/`;
const mdxRoute = `/posts/${prefix}-mdx/`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
for (const file of files)
  await assert.rejects(
    access(file),
    /ENOENT/,
    "Do not overwrite author content"
  );
assert.equal(
  (await readdir(folder, { recursive: true })).filter(file =>
    /\.mdx?$/.test(file)
  ).length,
  0,
  "Start dev with an empty posts directory"
);

async function waitFor(path, predicate, description) {
  let last = "";
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await fetch(new URL(path, origin));
    const html = await response.text();
    last = `${response.status}: ${html.slice(0, 150)}`;
    if (predicate(response.status, html)) return html;
    await sleep(500);
  }
  throw new Error(`${description}: ${last}`);
}
const empty = () =>
  waitFor(
    "/posts/",
    (status, html) => status === 200 && html.includes("No posts yet"),
    "Return to empty listing"
  );
const frontmatter = (title, valid = true) =>
  `---\ntitle: ${title}\n${valid ? "description: Local lifecycle regression fixture.\n" : ""}pubDatetime: 2020-01-01T00:00:00Z\ntags: [lifecycle]\n---\n\n`;

try {
  await empty();
  await waitFor(
    "/search/",
    (status, html) =>
      status === 200 && html.includes("No published writing to search yet."),
    "Initial search empty state"
  );
  await writeFile(files[0], frontmatter("Invalid lifecycle sentinel", false), {
    flag: "wx",
  });
  await sleep(1500);
  await empty();
  await writeFile(
    files[0],
    frontmatter("Live Markdown lifecycle sentinel") + "Live Markdown body."
  );
  await waitFor(
    "/posts/",
    (status, html) =>
      status === 200 && html.includes("Live Markdown lifecycle sentinel"),
    "First valid Markdown appears without restarting dev"
  );
  await waitFor(
    markdownRoute,
    (status, html) => status === 200 && html.includes("Live Markdown body."),
    "First Markdown article route"
  );
  await waitFor(
    "/search/",
    (status, html) => status === 200 && html.includes('id="pagefind-search"'),
    "Search controls appear with writing"
  );
  await writeFile(
    files[0],
    frontmatter("Updated Markdown lifecycle sentinel") + "Updated body."
  );
  await waitFor(
    "/posts/",
    (status, html) =>
      status === 200 && html.includes("Updated Markdown lifecycle sentinel"),
    "Upstream change listener updates title"
  );
  await rm(files[0]);
  await empty();
  await waitFor(
    markdownRoute,
    status => status === 404,
    "Deleted Markdown route disappears"
  );
  await writeFile(
    files[1],
    frontmatter("Live MDX lifecycle sentinel") +
      "<span>Live rendered MDX body.</span>",
    { flag: "wx" }
  );
  await waitFor(
    "/posts/",
    (status, html) =>
      status === 200 && html.includes("Live MDX lifecycle sentinel"),
    "First MDX appears from empty state"
  );
  await waitFor(
    mdxRoute,
    (status, html) =>
      status === 200 && html.includes("Live rendered MDX body."),
    "MDX renders through upstream pipeline"
  );
  await rm(files[1]);
  await empty();
  await waitFor(
    "/search/",
    (status, html) =>
      status === 200 && html.includes("No published writing to search yet."),
    "Search returns to empty state"
  );
  await waitFor(
    mdxRoute,
    status => status === 404,
    "Deleted MDX route disappears"
  );
  process.stdout.write(
    "Live dev lifecycle passed without restart: empty → invalid/validated first Markdown → edit → delete → first MDX → delete, article routes and search empty/control states.\n"
  );
} finally {
  for (const file of files) await rm(file, { force: true });
}
