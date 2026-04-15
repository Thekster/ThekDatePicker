import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { FocusTrap } from '../../src/core/focus-trap.js';

describe('FocusTrap', () => {
  let container: HTMLDivElement;
  let trap: FocusTrap;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <button id="first">First</button>
      <input id="middle">
      <button id="last">Last</button>
    `;
    document.body.appendChild(container);
    trap = new FocusTrap(container);
  });

  afterEach(() => {
    trap.deactivate();
    document.body.removeChild(container);
  });

  it('traps focus from last to first on Tab', () => {
    trap.activate();
    const last = document.getElementById('last') as HTMLElement;
    const first = document.getElementById('first') as HTMLElement;
    
    last.focus();
    expect(document.activeElement).toBe(last);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(event);

    expect(document.activeElement).toBe(first);
  });

  it('traps focus from first to last on Shift+Tab', () => {
    trap.activate();
    const first = document.getElementById('first') as HTMLElement;
    const last = document.getElementById('last') as HTMLElement;
    
    first.focus();
    expect(document.activeElement).toBe(first);

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    container.dispatchEvent(event);

    expect(document.activeElement).toBe(last);
  });

  it('does nothing when deactivated', () => {
    trap.activate();
    trap.deactivate();
    
    const last = document.getElementById('last') as HTMLElement;
    const first = document.getElementById('first') as HTMLElement;
    
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(event);

    // Should NOT have been trapped
    expect(document.activeElement).not.toBe(first);
    expect(document.activeElement).toBe(last);
  });
});
