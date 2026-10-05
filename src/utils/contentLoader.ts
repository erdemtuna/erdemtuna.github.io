import { glob, type Loader } from "astro/loaders";

export function freshGlob(options: Parameters<typeof glob>[0]): Loader {
  const loader = glob(options);
  return {
    ...loader,
    name: "fresh-glob-loader",
    async load(context) {
      // Astro 7.0.3 returns early for an empty glob, retaining deleted posts/assets.
      // Reconcile from source on each sync while keeping its validation and watcher.
      context.store.clear();
      await loader.load(context);
    },
  };
}
