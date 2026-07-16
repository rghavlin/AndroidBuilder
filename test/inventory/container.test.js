import { describe, it, expect } from 'vitest';
// Bridge the existing comprehensive inventory suite into the Vitest runner.
// Container.test.js defines runContainerTests(), which runs ~20 assertions with
// its own throw-based mini-framework and returns a results array. We surface any
// failure as a single Vitest failure with the offending cases named.
import { runContainerTests } from '../../client/src/game/inventory/__tests__/Container.test.js';

// Known-failing legacy assertions (xfail). Empty for now — every bridged case
// passes. If a legacy assertion is later found to encode outdated behavior,
// document it here (with a dated reason) so NEW regressions still turn the suite
// red while the documented gap doesn't. See TESTING_STRATEGY_PLAN.md.
const KNOWN_FAILURES = [];

describe('Inventory / Container (bridged from Container.test.js)', () => {
  it('passes every legacy container assertion (minus documented xfails)', () => {
    const results = runContainerTests();
    // Guard against the suite silently running zero tests.
    expect(results.length).toBeGreaterThan(0);

    const failures = results.filter((r) => r.includes('FAILED'));
    const unexpected = failures.filter(
      (f) => !KNOWN_FAILURES.some((known) => f.includes(known)),
    );
    expect(unexpected, `Unexpected failing cases:\n${unexpected.join('\n')}`).toHaveLength(0);
  });
});
