import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

export function loadSource(path, imports = {}, globals = {}) {
  const source = readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  ).replaceAll("import.meta.env.DEV", "false");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: false,
    },
  });
  const exports = {};
  const require = createRequire(import.meta.url);
  vm.runInNewContext(
    outputText,
    {
      URL,
      exports,
      require: name => (name in imports ? imports[name] : require(name)),
      ...globals,
    },
    { filename: path }
  );
  return exports;
}
