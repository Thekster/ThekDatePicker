import '../src/themes/base.css';
import './testpage.css';
import { createDatePicker, setGlobalOptions } from '../src/index.ts';

declare global {
  interface Window {
    hljs?: { highlightElement: (element: Element) => void };
    toggleCode: (button: HTMLElement) => void;
  }
}

window.toggleCode = (button: HTMLElement) => {
  const snippet = button.nextElementSibling as HTMLElement | null;
  if (!snippet) return;
  snippet.classList.toggle('visible');
  button.textContent = snippet.classList.contains('visible') ? 'Hide Code' : 'Show Code';
};

function ensureCodeTag(pre: HTMLPreElement, lang?: string): HTMLElement {
  let code = pre.querySelector('code');
  if (!code) {
    code = document.createElement('code');
    code.textContent = pre.textContent ?? '';
    pre.textContent = '';
    pre.appendChild(code);
  }
  if (lang) code.className = `language-${lang}`;
  return code;
}

function inferLang(pre: HTMLPreElement): string {
  const explicit = pre.dataset.lang;
  if (explicit) return explicit;
  const text = pre.textContent || '';
  if (text.includes('&lt;') || text.includes('<script')) return 'html';
  if (text.includes('npm ') || text.includes('pnpm ') || text.includes('yarn ')) return 'bash';
  return 'javascript';
}

function highlightPre(pre: HTMLPreElement, lang?: string): void {
  if (!window.hljs) return;
  const code = ensureCodeTag(pre, lang || inferLang(pre));
  window.hljs.highlightElement(code);
}

function highlightAllCode(): void {
  if (!window.hljs) return;
  document.querySelectorAll('pre').forEach((pre) => {
    if (pre instanceof HTMLPreElement) highlightPre(pre);
  });
}

const pageThemeSelect = document.getElementById('page-theme-select');
if (!(pageThemeSelect instanceof HTMLSelectElement)) {
  throw new Error('Missing page theme select');
}

function applyPageTheme(theme: string): void {
  const resolved = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-showcase-theme', resolved);
  pageThemeSelect.value = resolved;
}

pageThemeSelect.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement) applyPageTheme(target.value);
});

setGlobalOptions({
  theme: 'auto',
  reactiveTheme: true,
  themeAttribute: 'data-showcase-theme'
});

createDatePicker('#basic-input', {
  format: 'DD/MM/YYYY',
  defaultDate: new Date()
});

createDatePicker('#datetime24-input', {
  format: 'YYYY-MM-DD',
  enableTime: true,
  timeFormat: 'HH:mm',
  defaultDate: new Date()
});

createDatePicker('#datetime12-input', {
  format: 'MM/DD/YYYY',
  enableTime: true,
  timeFormat: 'hh:mm A',
  defaultDate: new Date()
});

createDatePicker('#datetime12-lower-input', {
  format: 'DD.MM.YYYY',
  enableTime: true,
  timeFormat: 'hh:mm a',
  defaultDate: new Date()
});

createDatePicker('#open-on-click-input', {
  format: 'DD/MM/YYYY',
  openOnInputClick: true
});

createDatePicker('#no-button-input', {
  format: 'YYYY/MM/DD',
  showCalendarButton: false
});

createDatePicker('#range-input', {
  format: 'MM/DD/YYYY',
  minDate: '2026-01-10',
  maxDate: '2026-12-20'
});

createDatePicker('#monday-start-input', {
  format: 'DD/MM/YYYY',
  weekStartsOn: 1
});

createDatePicker('#suspicious-input', {
  format: 'YYYY-MM-DD',
  suspiciousWarning: true,
  suspiciousYearSpan: 100,
  suspiciousMinYear: 1900,
  suspiciousMaxYear: 2100
});

const eventsLog = document.getElementById('events-log');
if (!(eventsLog instanceof HTMLDivElement)) {
  throw new Error('Missing events log');
}

const appendEvent = (message: string) => {
  const row = document.createElement('div');
  row.className = 'log-entry';
  row.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  eventsLog.prepend(row);
  while (eventsLog.children.length > 30) {
    const lastChild = eventsLog.lastElementChild;
    if (!lastChild) break;
    eventsLog.removeChild(lastChild);
  }
};

createDatePicker('#events-input', {
  format: 'DD/MM/YYYY',
  onOpen: () => appendEvent('onOpen'),
  onChange: (_date, formatted) => appendEvent(`onChange: ${formatted || '(empty)'}`),
  onClose: () => appendEvent('onClose')
});

const clearEventsButton = document.getElementById('events-clear-log');
if (clearEventsButton instanceof HTMLButtonElement) {
  clearEventsButton.addEventListener('click', () => {
    eventsLog.textContent = '';
  });
}

const apiPicker = createDatePicker('#api-target', {
  format: 'DD/MM/YYYY HH:mm',
  enableTime: true
});
let configPreviewPicker = createDatePicker('#config-preview-input', {
  format: 'DD/MM/YYYY',
  defaultDate: new Date()
});

const output = document.getElementById('api-output');
if (!(output instanceof HTMLElement)) {
  throw new Error('Missing API output');
}

function renderValue(): void {
  const value = apiPicker.getDate();
  output.textContent = value ? `Current: ${value.toISOString()}` : 'Current: (empty)';
}

const apiOpenButton = document.getElementById('api-open');
if (apiOpenButton instanceof HTMLButtonElement) {
  apiOpenButton.addEventListener('click', () => apiPicker.open());
}

const apiCloseButton = document.getElementById('api-close');
if (apiCloseButton instanceof HTMLButtonElement) {
  apiCloseButton.addEventListener('click', () => apiPicker.close());
}

const apiNowButton = document.getElementById('api-now');
if (apiNowButton instanceof HTMLButtonElement) {
  apiNowButton.addEventListener('click', () => {
    apiPicker.setDate(new Date());
    renderValue();
  });
}

const apiClearButton = document.getElementById('api-clear');
if (apiClearButton instanceof HTMLButtonElement) {
  apiClearButton.addEventListener('click', () => {
    apiPicker.clear();
    renderValue();
  });
}

const configFields = [
  'cfg-primary',
  'cfg-primary-strong',
  'cfg-primary-contrast',
  'cfg-surface',
  'cfg-panel',
  'cfg-border',
  'cfg-text-main',
  'cfg-text-muted',
  'cfg-shadow',
  'cfg-font',
  'cfg-radius',
  'cfg-height'
];

const templateDefaults = {
  light: {
    'cfg-primary': '#2f7fe4',
    'cfg-primary-strong': '#1f6bcc',
    'cfg-primary-contrast': '#ffffff',
    'cfg-surface': '#ffffff',
    'cfg-panel': '#ebf0f7',
    'cfg-border': '#d8dee6',
    'cfg-text-main': '#1d2838',
    'cfg-text-muted': '#6b7a90',
    'cfg-shadow': '0 0.875rem 1.875rem rgba(13, 21, 33, 0.18)',
    'cfg-font': 'inherit',
    'cfg-radius': '0.625rem',
    'cfg-height': '2rem'
  },
  dark: {
    'cfg-primary': '#60a5fa',
    'cfg-primary-strong': '#3b82f6',
    'cfg-primary-contrast': '#0f172a',
    'cfg-surface': '#111827',
    'cfg-panel': '#1f2937',
    'cfg-border': '#374151',
    'cfg-text-main': '#f3f4f6',
    'cfg-text-muted': '#9ca3af',
    'cfg-shadow': '0 1rem 2.125rem rgba(0, 0, 0, 0.45)',
    'cfg-font': 'inherit',
    'cfg-radius': '0.625rem',
    'cfg-height': '2rem'
  }
} as const;

const colorOptions = [
  { label: 'Ocean Blue', value: '#2f7fe4' },
  { label: 'Navy', value: '#1e3a8a' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Forest', value: '#166534' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Slate', value: '#334155' },
  { label: 'Snow', value: '#ffffff' },
  { label: 'Ink', value: '#0f172a' }
];

const colorDefaults = {
  'cfg-primary': '#2f7fe4',
  'cfg-primary-strong': '#1f6bcc',
  'cfg-primary-contrast': '#ffffff',
  'cfg-surface': '#ffffff',
  'cfg-panel': '#ebf0f7',
  'cfg-border': '#d8dee6',
  'cfg-text-main': '#1d2838',
  'cfg-text-muted': '#6b7a90'
};

function ensureSelectOption(select: HTMLSelectElement, value: string): void {
  if (!value) return;
  const exists = Array.from(select.options).some(
    (option) => option.value.toLowerCase() === String(value).toLowerCase()
  );
  if (exists) return;
  const custom = document.createElement('option');
  custom.value = value;
  custom.textContent = `Custom (${value})`;
  select.appendChild(custom);
}

Object.keys(colorDefaults).forEach((id) => {
  const select = document.getElementById(id);
  if (!(select instanceof HTMLSelectElement)) return;
  colorOptions.forEach((option) => {
    const nextOption = document.createElement('option');
    nextOption.value = option.value;
    nextOption.textContent = `${option.label} (${option.value})`;
    select.appendChild(nextOption);
  });
  ensureSelectOption(select, colorDefaults[id as keyof typeof colorDefaults]);
  select.value = colorDefaults[id as keyof typeof colorDefaults];
});

const configCssOutput = document.getElementById('config-css-output');
const cfgTemplate = document.getElementById('cfg-template');
if (!(configCssOutput instanceof HTMLPreElement)) {
  throw new Error('Missing theme config output');
}
if (!(cfgTemplate instanceof HTMLSelectElement)) {
  throw new Error('Missing theme template select');
}

function createThemeFromFields() {
  return {
    primary: (document.getElementById('cfg-primary') as HTMLSelectElement).value,
    primaryStrong: (document.getElementById('cfg-primary-strong') as HTMLSelectElement).value,
    primaryContrast: (document.getElementById('cfg-primary-contrast') as HTMLSelectElement).value,
    bgSurface: (document.getElementById('cfg-surface') as HTMLSelectElement).value,
    bgPanel: (document.getElementById('cfg-panel') as HTMLSelectElement).value,
    border: (document.getElementById('cfg-border') as HTMLSelectElement).value,
    textMain: (document.getElementById('cfg-text-main') as HTMLSelectElement).value,
    textMuted: (document.getElementById('cfg-text-muted') as HTMLSelectElement).value,
    shadow: (document.getElementById('cfg-shadow') as HTMLInputElement).value,
    radius: (document.getElementById('cfg-radius') as HTMLInputElement).value,
    fontFamily: (document.getElementById('cfg-font') as HTMLInputElement).value,
    controlHeight: (document.getElementById('cfg-height') as HTMLInputElement).value
  };
}

function toThemeObjectSnippet(theme: ReturnType<typeof createThemeFromFields>): string {
  return `const theme = ${JSON.stringify(theme, null, 2)};`;
}

function applyConfigurator(): void {
  const theme = createThemeFromFields();
  configPreviewPicker.setTheme(theme);
  configCssOutput.textContent = toThemeObjectSnippet(theme);
  highlightPre(configCssOutput, 'javascript');
}

function applyTemplate(template: string): void {
  const data =
    templateDefaults[template as keyof typeof templateDefaults] ?? templateDefaults.light;
  Object.entries(data).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;
    if (field instanceof HTMLSelectElement) ensureSelectOption(field, value);
    field.value = value;
  });
  applyConfigurator();
}

configFields.forEach((id) => {
  const field = document.getElementById(id);
  if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement)) return;
  field.addEventListener('input', applyConfigurator);
  field.addEventListener('change', applyConfigurator);
});

const copyThemeButton = document.getElementById('copy-theme-css');
if (copyThemeButton instanceof HTMLButtonElement) {
  copyThemeButton.addEventListener('click', async () => {
    const text = configCssOutput.textContent || '';
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op
    }
  });
}

cfgTemplate.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement) applyTemplate(target.value);
});

applyTemplate('light');

const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const selectedTheme = pageThemeSelect.value;
applyPageTheme(selectedTheme || (prefersDark ? 'dark' : 'light'));
highlightAllCode();
renderValue();

window.addEventListener('scroll', () => {
  const sections = document.querySelectorAll('section');
  const links = document.querySelectorAll('nav a');
  let current = '';
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 100) current = section.id;
  });
  links.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
});
