export function createTriggerButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'thekdp-trigger-btn';
  button.setAttribute('aria-label', 'Toggle calendar');
  button.innerHTML = `
    <svg class="thekdp-trigger-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"></line>
      <line x1="8" y1="2.5" x2="8" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      <line x1="16" y1="2.5" x2="16" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      <circle cx="8" cy="12.5" r="0.95" fill="currentColor"></circle>
      <circle cx="12" cy="12.5" r="0.95" fill="currentColor"></circle>
      <circle cx="16" cy="12.5" r="0.95" fill="currentColor"></circle>
      <circle cx="8" cy="16.5" r="0.95" fill="currentColor"></circle>
      <circle cx="12" cy="16.5" r="0.95" fill="currentColor"></circle>
    </svg>
  `;
  return button;
}

export function createSuspiciousIndicator(): HTMLSpanElement {
  const suspiciousIndicator = document.createElement('span');
  suspiciousIndicator.className = 'thekdp-suspicious-indicator';
  suspiciousIndicator.setAttribute('aria-hidden', 'true');
  suspiciousIndicator.textContent = '!';
  suspiciousIndicator.hidden = true;
  return suspiciousIndicator;
}

export function createPickerPopover(): HTMLDivElement {
  const picker = document.createElement('div');
  picker.className = 'thekdp-popover';
  picker.hidden = true;
  picker.tabIndex = -1;
  picker.innerHTML = `
    <div class="thekdp-header">
      <button type="button" class="thekdp-nav-btn" data-action="prev-year" aria-label="Previous year">«</button>
      <button type="button" class="thekdp-nav-btn" data-action="prev-month" aria-label="Previous month">‹</button>
      <span class="thekdp-current-month"></span>
      <button type="button" class="thekdp-nav-btn" data-action="next-month" aria-label="Next month">›</button>
      <button type="button" class="thekdp-nav-btn" data-action="next-year" aria-label="Next year">»</button>
    </div>
    <div class="thekdp-weekdays" role="row"></div>
    <div class="thekdp-days" role="grid"></div>
    <div class="thekdp-footer">
      <div class="thekdp-time"></div>
      <div class="thekdp-actions">
        <button type="button" class="thekdp-link-btn" data-action="today">Now</button>
        <button type="button" class="thekdp-ok-btn" data-action="ok">OK</button>
      </div>
    </div>
  `;
  return picker;
}
