const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes: Record<string, string>
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function createCalendarIcon(cssPrefix: string): SVGSVGElement {
  const svg = createSvgElement('svg', {
    class: `${cssPrefix}-trigger-icon`,
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false'
  });
  svg.appendChild(
    createSvgElement('rect', {
      x: '3',
      y: '4.5',
      width: '18',
      height: '16',
      rx: '2.5',
      ry: '2.5',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8'
    })
  );
  for (const [x1, y1, x2, y2, extra] of [
    ['3', '9', '21', '9', {}],
    ['8', '2.5', '8', '7', { 'stroke-linecap': 'round' }],
    ['16', '2.5', '16', '7', { 'stroke-linecap': 'round' }]
  ] as const) {
    svg.appendChild(
      createSvgElement('line', {
        x1,
        y1,
        x2,
        y2,
        stroke: 'currentColor',
        'stroke-width': '1.8',
        ...extra
      })
    );
  }
  for (const [cx, cy] of [
    ['8', '12.5'],
    ['12', '12.5'],
    ['16', '12.5'],
    ['8', '16.5'],
    ['12', '16.5']
  ] as const) {
    svg.appendChild(createSvgElement('circle', { cx, cy, r: '0.95', fill: 'currentColor' }));
  }
  return svg;
}

function createWarningIcon(cssPrefix: string): SVGSVGElement {
  const svg = createSvgElement('svg', {
    class: `${cssPrefix}-indicator-icon`,
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false'
  });
  svg.appendChild(
    createSvgElement('path', {
      d: 'M12 3.5L21 19.5H3L12 3.5Z',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linejoin': 'round'
    })
  );
  svg.appendChild(
    createSvgElement('line', {
      x1: '12',
      y1: '9',
      x2: '12',
      y2: '13.2',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linecap': 'round'
    })
  );
  svg.appendChild(
    createSvgElement('circle', { cx: '12', cy: '16.4', r: '1', fill: 'currentColor' })
  );
  return svg;
}

export function createTriggerButton(cssPrefix: string = 'thekdp'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${cssPrefix}-trigger-btn`;
  button.setAttribute('aria-label', 'Toggle calendar');
  button.appendChild(createCalendarIcon(cssPrefix));
  return button;
}

export function createSuspiciousIndicator(cssPrefix: string = 'thekdp'): HTMLSpanElement {
  const suspiciousIndicator = document.createElement('span');
  suspiciousIndicator.className = `${cssPrefix}-suspicious-indicator`;
  suspiciousIndicator.setAttribute('aria-hidden', 'true');
  suspiciousIndicator.appendChild(createWarningIcon(cssPrefix));
  suspiciousIndicator.hidden = true;
  return suspiciousIndicator;
}

export function createRevertIndicator(cssPrefix: string = 'thekdp'): HTMLSpanElement {
  const revertIndicator = document.createElement('span');
  revertIndicator.className = `${cssPrefix}-revert-indicator`;
  revertIndicator.setAttribute('aria-hidden', 'true');
  revertIndicator.appendChild(createWarningIcon(cssPrefix));
  revertIndicator.hidden = true;
  return revertIndicator;
}

export function createAssistiveText(cssPrefix: string = 'thekdp', suffix: string): HTMLSpanElement {
  const text = document.createElement('span');
  text.className = `${cssPrefix}-sr-only`;
  text.id = `${cssPrefix}-${suffix}-${Math.random().toString(36).slice(2, 9)}`;
  return text;
}

export function createPickerPopover(cssPrefix: string = 'thekdp'): HTMLDivElement {
  const picker = document.createElement('div');
  picker.className = `${cssPrefix}-popover`;
  picker.hidden = true;
  picker.tabIndex = -1;
  picker.style.touchAction = 'manipulation';

  const header = document.createElement('div');
  header.className = `${cssPrefix}-header`;

  const createNavBtn = (action: string, label: string, text: string) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `${cssPrefix}-nav-btn`;
    btn.dataset.action = action;
    btn.setAttribute('aria-label', label);
    btn.textContent = text;
    return btn;
  };

  header.appendChild(createNavBtn('prev-year', 'Previous year', '«'));
  header.appendChild(createNavBtn('prev-month', 'Previous month', '‹'));
  const currentMonth = document.createElement('span');
  currentMonth.className = `${cssPrefix}-current-month`;
  currentMonth.setAttribute('aria-live', 'polite');
  header.appendChild(currentMonth);
  header.appendChild(createNavBtn('next-month', 'Next month', '›'));
  header.appendChild(createNavBtn('next-year', 'Next year', '»'));

  const weekdays = document.createElement('div');
  weekdays.className = `${cssPrefix}-weekdays`;
  weekdays.setAttribute('role', 'row');

  const days = document.createElement('div');
  days.className = `${cssPrefix}-days`;
  days.setAttribute('role', 'grid');
  days.setAttribute('aria-readonly', 'true');

  const footer = document.createElement('div');
  footer.className = `${cssPrefix}-footer`;

  const time = document.createElement('div');
  time.className = `${cssPrefix}-time`;

  const actions = document.createElement('div');
  actions.className = `${cssPrefix}-actions`;

  const todayBtn = document.createElement('button');
  todayBtn.type = 'button';
  todayBtn.className = `${cssPrefix}-link-btn`;
  todayBtn.dataset.action = 'today';
  todayBtn.textContent = 'Now';

  const okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.className = `${cssPrefix}-ok-btn`;
  okBtn.dataset.action = 'ok';
  okBtn.textContent = 'OK';

  actions.appendChild(todayBtn);
  actions.appendChild(okBtn);
  footer.appendChild(time);
  footer.appendChild(actions);

  picker.appendChild(header);
  picker.appendChild(weekdays);
  picker.appendChild(days);
  picker.appendChild(footer);

  return picker;
}
