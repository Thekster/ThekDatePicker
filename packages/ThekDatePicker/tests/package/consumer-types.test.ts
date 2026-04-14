import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const fixtureDir = resolve(root, 'tests/package/fixtures/ts-consumer');
const tscBin = resolve(root, '../../node_modules/typescript/bin/tsc');

describe('package consumer types', () => {
  it('compiles from an external TypeScript consumer entrypoint', () => {
    expect(() =>
      execFileSync(process.execPath, [tscBin, '-p', resolve(fixtureDir, 'tsconfig.json')], {
        cwd: fixtureDir,
        stdio: 'pipe'
      })
    ).not.toThrow();
  });
});
