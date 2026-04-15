import { BASE_CSS } from './base-css.js';

/**
 * Injects the base CSS styles for ThekDatePicker into the document head.
 * This is useful for zero-config environments where you don't want to
 * manually import the CSS file.
 */
export function injectBaseStyles(): void {
  if (typeof document === 'undefined') return;

  const id = 'thekdp-base-styles';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = BASE_CSS;
  document.head.appendChild(style);
}
