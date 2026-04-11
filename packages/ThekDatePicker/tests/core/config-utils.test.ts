import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAutoThemeTemplate, resolveOptions } from '../../src/core/config-utils';

describe('config utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defers appendTo resolution until runtime instantiation', () => {
    const resolved = resolveOptions({});
    expect(resolved.appendTo).toBeNull();
  });

  it('falls back to light auto theme when matchMedia is unavailable', () => {
    vi.stubGlobal('window', { document, matchMedia: undefined });
    expect(resolveAutoThemeTemplate('data-theme')).toBe('light');
  });
});
