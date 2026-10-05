type Theme = "light" | "dark";
const system = window.matchMedia("(prefers-color-scheme: dark)");
const bound = new WeakSet<Element>();

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem("theme");
    return value === "light" || value === "dark" ? value : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      "Theme storage unavailable; using this session's preference.",
      error
    );
    return null;
  }
}

let manual = storedTheme();
let theme: Theme = manual ?? (system.matches ? "dark" : "light");

function apply(document: Document): void {
  document.documentElement.dataset.js = "";
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function setup(): void {
  apply(document);
  const button = document.querySelector("#theme-btn");
  button?.setAttribute(
    "aria-label",
    `Switch to ${theme === "light" ? "dark" : "light"} theme`
  );
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", getComputedStyle(document.body).backgroundColor);
  if (button && !bound.has(button)) {
    bound.add(button);
    button.addEventListener("click", () => {
      manual = theme = theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", theme);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(
          "Theme choice cannot be saved; it will last for this session.",
          error
        );
      }
      setup();
    });
  }
}

setup();
document.addEventListener("astro:after-swap", setup);
document.addEventListener("astro:before-swap", event => {
  apply((event as Event & { newDocument: Document }).newDocument);
});
system.addEventListener("change", ({ matches }) => {
  if (manual !== null) return;
  theme = matches ? "dark" : "light";
  setup();
});
window.addEventListener("storage", event => {
  if (event.key !== "theme" && event.key !== null) return;
  manual = storedTheme();
  theme = manual ?? (system.matches ? "dark" : "light");
  setup();
});
