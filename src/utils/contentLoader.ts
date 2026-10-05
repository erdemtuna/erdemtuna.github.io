import { glob, type Loader, type LoaderContext } from "astro/loaders";
import { isAbsolute, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

type Watcher = NonNullable<LoaderContext["watcher"]>;
type Subscription = Parameters<Watcher["on"]>;

export function freshGlob(options: Parameters<typeof glob>[0]): Loader {
  const loader = glob(options);
  let stopWatching: (() => void) | undefined;
  return {
    ...loader,
    name: "fresh-glob-loader",
    async load(context) {
      stopWatching?.();
      // Astro 7.0.3 returns early for an empty glob, retaining deleted posts/assets.
      context.store.clear();
      const watcher = context.watcher;
      if (!watcher) {
        await loader.load(context);
        return;
      }

      let disposed = false;
      let subscriptions: Subscription[] = [];
      const removeSubscriptions = () => {
        for (const subscription of subscriptions) watcher.off(...subscription);
        subscriptions = [];
      };
      const trackedWatcher = new Proxy(watcher, {
        get(target, property) {
          if (property === "on") {
            return (...subscription: Subscription) => {
              if (!disposed) {
                subscriptions.push(subscription);
                target.on(...subscription);
              }
              return target;
            };
          }
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
      const watchedContext = { ...context, watcher: trackedWatcher };
      const base = fileURLToPath(
        new URL(options.base ?? ".", context.config.root)
      );
      const events = ["add", "change", "unlink"] as const;
      const removeBootstrap = () => {
        for (const event of events) watcher.off(event, bootstrap);
      };
      let pending: Promise<void> | undefined;
      let queued = false;
      function bootstrap(file: string) {
        const entry = relative(base, file);
        if (
          disposed ||
          entry === ".." ||
          entry.startsWith(`..${sep}`) ||
          isAbsolute(entry)
        )
          return;
        queued = true;
        if (pending) return pending;
        pending = (async () => {
          do {
            queued = false;
            removeSubscriptions();
            try {
              await loader.load(watchedContext);
            } catch (error) {
              context.logger.error(
                `Failed to initialize ${context.collection}: ${error instanceof Error ? error.message : String(error)}`
              );
            }
          } while (queued && !disposed);
          if (!disposed && subscriptions.some(([event]) => event === "add"))
            removeBootstrap();
        })().finally(() => {
          pending = undefined;
        });
        return pending;
      }
      stopWatching = () => {
        disposed = true;
        removeBootstrap();
        removeSubscriptions();
      };
      await loader.load(watchedContext);
      if (!subscriptions.some(([event]) => event === "add")) {
        // The same early return skips glob's watcher. Bootstrap only this base;
        // hand off to its normal schema/pattern/id/deletion handling once populated.
        watcher.add(base);
        for (const event of events) watcher.on(event, bootstrap);
      }
    },
  };
}
