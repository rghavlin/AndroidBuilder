import { defineConfig } from 'vitest/config';

// Dedicated Vitest config, intentionally NOT extending the app's vite.config.ts.
// The game logic under client/src/game is plain ESM .js and runs headless in
// Node with no browser shims, so the test runner stays lightweight and isolated
// from the React/Vite app toolchain. See TESTING_STRATEGY_PLAN.md.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.{js,ts}'],
    // Game systems import a shared `engine` singleton; keep suites in one thread
    // so parallel files don't clobber that global state mid-run.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
