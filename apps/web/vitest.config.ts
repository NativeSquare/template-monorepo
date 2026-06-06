import path from "node:path";
import { createRequire } from "node:module";
import { defineConfig } from "vitest/config";

// pnpm's hoisted layout leaves several physical copies of react in the tree
// (a root-hoisted one plus nested copies under react-dom and
// @testing-library/react). React requires that components, react-dom and the
// act() used by Testing Library all see the exact same react instance, so:
// 1. alias `react` to the copy that react-dom itself resolves to, and
// 2. load @testing-library/react's ESM build through Vite so its react
//    import goes through that alias too (its CJS build would natively
//    require its own nested react copy and act() would not work).
const require = createRequire(import.meta.url);
const reactDomRequire = createRequire(require.resolve("react-dom"));
const reactPath = path.dirname(reactDomRequire.resolve("react/package.json"));
const rtlPath = path.dirname(
  require.resolve("@testing-library/react/package.json"),
);

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^react$/, replacement: path.join(reactPath, "index.js") },
      {
        find: /^react\/jsx-runtime$/,
        replacement: path.join(reactPath, "jsx-runtime.js"),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: path.join(reactPath, "jsx-dev-runtime.js"),
      },
      {
        find: /^@testing-library\/react$/,
        replacement: path.join(
          rtlPath,
          "dist/@testing-library/react.esm.js",
        ),
      },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-utils/setup.ts"],
  },
});
