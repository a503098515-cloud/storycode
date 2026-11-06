import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Component tests: a browser-like DOM (jsdom) so Testing Library can query
// by role and name, the way assistive tech finds elements.
export default defineConfig({
  // The app tsconfig says jsx: "preserve" (Next compiles JSX); tests compile it here.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.tsx"],
  },
});
