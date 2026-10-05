import assert from "node:assert/strict";
import { readdir, readFile, access } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { loadSource } from "../tests/load-source.mjs";

const types = loadSource("src/types/config.ts");
const config = loadSource("astro-paper.config.ts", {
  "./src/types/config": types,
}).default;
const origin = new URL(config.site.url).origin;

export async function checkOutput(root = "dist") {
  const paths = (await readdir(root, { recursive: true })).filter(path =>
    path.endsWith(".html")
  );
  assert.ok(
    paths.length >= 7,
    "Core routes must be built, including empty /posts/"
  );
  const titles = new Set();
  for (const path of paths) {
    const html = await readFile(join(root, path), "utf8");
    const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
    assert.ok(head, `${path}: head exists`);
    assert.ok(
      !/astro-paper\.pages\.dev|satna\.ing|satnaing|username|yourmail/.test(
        html
      ),
      `${path}: no upstream identity`
    );
    assert.ok(!/noindex/i.test(head), `${path}: production is indexable`);
    const title = head.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title && !titles.has(title), `${path}: unique title`);
    titles.add(title);
    assert.equal(
      (head.match(/rel="canonical"/g) ?? []).length,
      1,
      `${path}: one canonical`
    );
    assert.equal(
      (head.match(/property="og:type"/g) ?? []).length,
      1,
      `${path}: one OG type`
    );
    const canonical = head.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(canonical?.startsWith("https://"), `${path}: absolute canonical`);
    assert.equal(
      head.match(/property="og:url" content="([^"]+)"/)?.[1],
      canonical,
      `${path}: OG URL matches canonical`
    );
    assert.ok(
      head.match(/name="description" content="([^"]+)"/)?.[1],
      `${path}: nonempty description`
    );
    const image = head.match(/property="og:image" content="([^"]+)"/)?.[1];
    assert.ok(image?.startsWith("https://"), `${path}: absolute OG image`);
    if (new URL(image).origin === origin) {
      await access(join(root, decodeURIComponent(new URL(image).pathname)));
    }
    if (html.includes('id="article"')) {
      assert.ok(head.includes('property="og:type" content="article"'));
      const schema = JSON.parse(
        head.match(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
        )?.[1] ?? "null"
      );
      assert.equal(schema["@type"], "BlogPosting");
      assert.equal(schema.url, canonical);
      assert.equal(schema.mainEntityOfPage["@id"], canonical);
      assert.equal(schema.image, image);
      assert.ok(!schema.headline.includes(` | ${config.site.title}`));
      assert.ok(schema.author.name);
      assert.ok(html.includes(schema.author.name));
      assert.ok(schema.datePublished && schema.dateModified);
    }
    for (const href of html.matchAll(/href="([^"#?]+)(?:[?#][^"]*)?"/g)) {
      if (!href[1].startsWith("/") || href[1].startsWith("//")) continue;
      const pathname = decodeURIComponent(href[1].split(/[?#]/)[0]);
      const resolved = join(
        root,
        pathname,
        pathname.endsWith("/") ? "index.html" : ""
      );
      const normalized = relative(root, resolved);
      assert.ok(
        !normalized.startsWith(`..${sep}`),
        `${path}: links stay inside site`
      );
      await access(resolved);
    }
  }
  const sitemap = await readFile(join(root, "sitemap-0.xml"), "utf8");
  assert.ok(sitemap.includes(`${origin}/`));
  const sitemapIndex = await readFile(join(root, "sitemap-index.xml"), "utf8");
  for (const xml of [sitemapIndex, sitemap]) {
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
    assert.ok(locations.length, "Sitemap contains URLs");
    for (const [, url] of locations)
      assert.equal(
        new URL(url).origin,
        origin,
        "Sitemap uses configured origin"
      );
  }
  assert.ok(!/\/404|\/search\//.test(sitemap));
  assert.ok(
    !sitemap.includes("index.png"),
    "Social image endpoints are not sitemap pages"
  );
  const robots = await readFile(join(root, "robots.txt"), "utf8");
  assert.ok(robots.includes(`Sitemap: ${origin}/sitemap-index.xml`));
  const rss = await readFile(join(root, "rss.xml"), "utf8");
  const feedLinks = [...rss.matchAll(/<link>([^<]+)<\/link>/g)];
  assert.ok(feedLinks.length, "RSS contains links");
  for (const [, url] of feedLinks)
    assert.equal(new URL(url).origin, origin, "RSS uses configured origin");
  await access(join(root, "pagefind", "pagefind.js"));
  const searchEntry = JSON.parse(
    await readFile(join(root, "pagefind", "pagefind-entry.json"), "utf8")
  );
  const searchFiles = await readdir(join(root, "pagefind"), {
    recursive: true,
  });
  const fragments = searchFiles.filter(path => path.endsWith(".pf_fragment"));
  const indexedPages = Object.values(searchEntry.languages).reduce(
    (count, language) => count + language.page_count,
    0
  );
  assert.equal(
    fragments.length,
    indexedPages,
    "No obsolete search fragments from previous builds"
  );
  process.stdout.write(
    `Verified ${paths.length} rendered pages: titles, canonical/OG/schema, internal links, sitemap, robots, Pagefind.\n`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await checkOutput();
