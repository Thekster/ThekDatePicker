export function createTriggerButton(cssPrefix: string = "thekdp"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${cssPrefix}-trigger-btn`;
  button.setAttribute("aria-label", "Toggle calendar");
  button.innerHTML = `
    <svg class="${cssPrefix}-trigger-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

function warningSvgMarkup(cssPrefix: string = "thekdp"): string {
  return `
    <svg class="${cssPrefix}-indicator-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.5L21 19.5H3L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
      <line x1="12" y1="9" x2="12" y2="13.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      <circle cx="12" cy="16.4" r="1" fill="currentColor"></circle>
    </svg>
  `;
}

export function createSuspiciousIndicator(cssPrefix: string = "thekdp"): HTMLSpanElement {
  const suspiciousIndicator = document.createElement("span");
  suspiciousIndicator.className = `${cssPrefix}-suspicious-indicator`;
  suspiciousIndicator.setAttribute("aria-hidden", "true");
  suspiciousIndicator.innerHTML = warningSvgMarkup(cssPrefix);
  suspiciousIndicator.hidden = true;
  return suspiciousIndicator;
}

export function createRevertIndicator(cssPrefix: string = "thekdp"): HTMLSpanElement {
  const revertIndicator = document.createElement("span");
  revertIndicator.className = `${cssPrefix}-revert-indicator`;
  revertIndicator.setAttribute("aria-hidden", "true");
  revertIndicator.innerHTML = warningSvgMarkup(cssPrefix);
  revertIndicator.hidden = true;
  return revertIndicator;
}

export function createPickerPopover(cssPrefix: string = "thekdp"): HTMLDivElement {
  const picker = document.createElement("div");
  picker.className = `${cssPrefix}-popover`;
  picker.hidden = true;
  picker.tabIndex = -1;
  picker.setAttribute("role", "dialog");
  picker.setAttribute("aria-modal", "false");
  picker.style.touchAction = "manipulation";
  picker.innerHTML = `
    <div class="${cssPrefix}-header">
      <button type="button" class="${cssPrefix}-nav-btn" data-action="prev-year" aria-label="Previous year">«</button>
      <button type="button" class="${cssPrefix}-nav-btn" data-action="prev-month" aria-label="Previous month">‹</button>
      <span class="${cssPrefix}-current-month" aria-live="polite"></span>
      <button type="button" class="${cssPrefix}-nav-btn" data-action="next-month" aria-label="Next month">›</button>
      <button type="button" class="${cssPrefix}-nav-btn" data-action="next-year" aria-label="Next year">»</button>
    </div>
    <div class="${cssPrefix}-weekdays" role="row"></div>
    <div class="${cssPrefix}-days" role="grid" aria-readonly="true"></div>
    <div class="${cssPrefix}-footer">
      <div class="${cssPrefix}-time"></div>
      <div class="${cssPrefix}-actions">
        <button type="button" class="${cssPrefix}-link-btn" data-action="today">Now</button>
        <button type="button" class="${cssPrefix}-ok-btn" data-action="ok">OK</button>
      </div>
    </div>
  `;
  return picker;
}
