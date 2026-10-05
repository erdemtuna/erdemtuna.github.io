import { cp, rm } from "node:fs/promises";

await rm(new URL("../public/pagefind/", import.meta.url), {
  recursive: true,
  force: true,
});
if (!process.argv.includes("--clean")) {
  await cp(
    new URL("../dist/pagefind/", import.meta.url),
    new URL("../public/pagefind/", import.meta.url),
    { recursive: true }
  );
}
