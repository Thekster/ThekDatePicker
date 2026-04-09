import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

describe('package artifacts', () => {
  it('ships the documented CSS entrypoints', () => {
    expect(existsSync(resolve(root, 'dist/css/thekdatepicker.css'))).toBe(true);
    expect(existsSync(resolve(root, 'dist/css/base.css'))).toBe(true);
    expect(existsSync(resolve(root, 'dist/themes/base.css'))).toBe(true);
  });

  it('keeps the type entry CSS import aligned with shipped files', () => {
    const dts = readFileSync(resolve(root, 'dist/index.d.ts'), 'utf8');
    expect(dts).toContain('./themes/base.css');
  });
});
