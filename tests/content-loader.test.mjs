import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { join, sep } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { loadSource } from "./load-source.mjs";

function harness() {
  const watcher = new EventEmitter();
  const watched = [];
  watcher.add = path => {
    watched.push(path);
    return watcher;
  };
  const entries = new Map();
  const errors = [];
  let available = false;
  let valid = true;
  let loads = 0;
  let validations = 0;
  const root = join(process.cwd(), "src", "content", "posts");
  const file = join(root, "validation-fixture-live.md");
  const load = async context => {
    loads++;
    if (!available) return;
    validations++;
    if (!valid) throw Error("Required description is missing");
    entries.set("post", "validated");
    context.watcher.add(root);
    const change = () => {
      validations++;
      entries.set("post", "validated");
    };
    context.watcher.on("add", change);
    context.watcher.on("change", change);
    context.watcher.on("unlink", () => entries.delete("post"));
  };
  const { freshGlob } = loadSource("src/utils/contentLoader.ts", {
    "astro/loaders": { glob: () => ({ name: "glob-loader", load }) },
  });
  const loader = freshGlob({
    pattern: "**/[^_]*.{md,mdx}",
    base: "./src/content/posts",
  });
  const context = {
    collection: "posts",
    watcher,
    config: { root: pathToFileURL(process.cwd() + sep) },
    store: { clear: () => entries.clear() },
    logger: { error: message => errors.push(message) },
  };
  const emit = async (event, path = file) => {
    for (const listener of watcher.listeners(event)) await listener(path);
  };
  return {
    watcher,
    watched,
    entries,
    errors,
    loader,
    context,
    root,
    file,
    emit,
    available(value) {
      available = value;
    },
    valid(value) {
      valid = value;
    },
    get loads() {
      return loads;
    },
    get validations() {
      return validations;
    },
  };
}

test("initially empty dev collection bootstraps once then uses upstream validation and deletion", async () => {
  const fixture = harness();
  await fixture.loader.load(fixture.context);
  assert.deepEqual(fixture.watched, [fixture.root]);
  await fixture.emit("add", join(process.cwd(), "unrelated.md"));
  assert.equal(fixture.loads, 1);
  await fixture.loader.load(fixture.context);
  for (const event of ["add", "change", "unlink"])
    assert.equal(fixture.watcher.listenerCount(event), 1);
  fixture.available(true);
  await fixture.emit("add");
  assert.equal(fixture.entries.get("post"), "validated");
  assert.equal(fixture.validations, 1);
  for (const event of ["add", "change", "unlink"])
    assert.equal(fixture.watcher.listenerCount(event), 1);
  await fixture.emit("change");
  assert.equal(fixture.validations, 2);
  await fixture.emit("unlink");
  assert.equal(fixture.entries.size, 0);
  await fixture.emit("add");
  assert.equal(fixture.entries.size, 1);
  await fixture.loader.load(fixture.context);
  for (const event of ["add", "change", "unlink"])
    assert.equal(fixture.watcher.listenerCount(event), 1);
});

test("invalid first post reports its upstream schema error and recovers on correction", async () => {
  const fixture = harness();
  await fixture.loader.load(fixture.context);
  fixture.available(true);
  fixture.valid(false);
  await fixture.emit("add");
  assert.equal(fixture.entries.size, 0);
  assert.match(fixture.errors[0], /Failed to initialize posts:.*description/);
  fixture.valid(true);
  await fixture.emit("change");
  assert.equal(fixture.entries.get("post"), "validated");
  for (const event of ["add", "change", "unlink"])
    assert.equal(fixture.watcher.listenerCount(event), 1);
});
