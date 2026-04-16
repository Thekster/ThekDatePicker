import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ThekDatePicker } from '../../src/core/thekdatepicker.js';

describe('ThekDatePicker positioning', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="scroll-container" style="height: 100px; overflow: scroll;">
        <div style="height: 1000px;">
          <input id="date-input" style="margin-top: 500px;" />
        </div>
      </div>
    `;

    // Mock ResizeObserver and IntersectionObserver as before
    class MockResizeObserver {
      observe = vi.fn();
      disconnect = vi.fn();
    }
    class MockIntersectionObserver {
      observe = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('triggers positioning on ancestor scroll via global capture listener', async () => {
    const picker = new ThekDatePicker('#date-input');
    const positionSpy = vi.spyOn(
      picker as unknown as { positionPicker: () => void },
      'positionPicker'
    );

    picker.open();
    // positionPicker is called once on open
    expect(positionSpy).toHaveBeenCalledTimes(1);
    positionSpy.mockClear();

    const container = document.getElementById('scroll-container')!;

    // Simulate scroll event
    container.dispatchEvent(new Event('scroll', { bubbles: true }));

    // The global listener should have called onGlobalViewportChange,
    // which schedules a rAF.

    // Fast-forward or wait for rAF
    await new Promise((resolve) => window.requestAnimationFrame(resolve));

    expect(positionSpy).toHaveBeenCalled();

    picker.destroy();
  });
});
