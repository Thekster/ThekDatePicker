# ThekDatePicker

Framework-agnostic date/time picker with strict input masking, flexible separators, calendar popover, and themeable styles.

## Installation

```bash
npm install thekdatepicker
```

## CSS

```ts
import "thekdatepicker/css/base.css";
```

## Quick Start

```html
<input id="my-date" type="text" />
```

```ts
import { createDatePicker, setGlobalOptions } from "thekdatepicker";

setGlobalOptions({
  format: "YYYY-MM-DD",
  theme: "auto",
  reactiveTheme: true,
  themeAttribute: "data-theme",
  useLocaleDefaults: true,
  locale: "en-US",
});

const picker = createDatePicker("#my-date", {
  enableTime: true,
  timeFormat: "hh:mm A",
});
```

## Browser CDN

```html
<link rel="stylesheet" href="https://unpkg.com/thekdatepicker/dist/css/base.css" />
<input id="my-date" type="text" />
<script src="https://unpkg.com/thekdatepicker/dist/thekdatepicker.umd.cjs"></script>
<script>
  ThekDatePicker.setGlobalOptions({
    theme: "auto",
    reactiveTheme: true,
    themeAttribute: "data-theme",
  });
  ThekDatePicker.createDatePicker("#my-date");
</script>
```

## Theme Usage

```ts
import { createDatePicker, setGlobalOptions } from "thekdatepicker";

createDatePicker("#date-a", { theme: "dark" });

createDatePicker("#date-auto", {
  theme: "auto",
  reactiveTheme: true,
  themeAttribute: "data-theme",
});

createDatePicker("#date-b", {
  theme: {
    primary: "#e11d48",
    bgSurface: "#fff1f2",
    border: "#fecdd3",
  },
});

setGlobalOptions({
  format: "YYYY-MM-DD",
  theme: "light",
});
```

## Format Tokens

| Token      | Type       | Description    |
| ---------- | ---------- | -------------- |
| `YYYY`     | year       | 4-digit year   |
| `YY`       | year       | 2-digit year   |
| `MM` / `M` | month      | month number   |
| `DD` / `D` | day        | day number     |
| `HH` / `H` | time (24h) | hour 0-23      |
| `hh` / `h` | time (12h) | hour 1-12      |
| `mm` / `m` | time       | minutes        |
| `A` / `a`  | meridiem   | AM/PM or am/pm |

## Config Options

| Property             | Type                                                          | Default                         | Description                                                                                                                                               |
| -------------------- | ------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `format`             | `string`                                                      | `'DD/MM/YYYY'`                  | Date format used for mask/parse/display.                                                                                                                  |
| `locale`             | `string`                                                      | system locale                   | Locale used for deriving defaults when `useLocaleDefaults` is enabled.                                                                                    |
| `useLocaleDefaults`  | `boolean`                                                     | `false`                         | If true, derives `format`, `timeFormat`, and `weekStartsOn` from locale unless explicitly provided.                                                       |
| `enableTime`         | `boolean`                                                     | `false`                         | Controls visibility of time controls in popover.                                                                                                          |
| `timeFormat`         | `string`                                                      | `'HH:mm'`                       | Time token format used only when `format` has no time tokens and `enableTime` is true.                                                                    |
| `minDate`            | `Date \| string \| null \| undefined`                         | `undefined`                     | Minimum allowed date. Values below are clamped.                                                                                                           |
| `maxDate`            | `Date \| string \| null \| undefined`                         | `undefined`                     | Maximum allowed date. Values above are clamped.                                                                                                           |
| `defaultDate`        | `Date \| string \| null \| undefined`                         | `undefined`                     | Initial value for input/picker.                                                                                                                           |
| `placeholder`        | `string`                                                      | `format` or derived full format | Custom placeholder text.                                                                                                                                  |
| `disabled`           | `boolean`                                                     | `false`                         | Disables input + trigger and blocks opening.                                                                                                              |
| `appendTo`           | `HTMLElement`                                                 | `document.body`                 | Popover mount container.                                                                                                                                  |
| `weekStartsOn`       | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6`                             | `0`                             | First weekday (`0 = Sun`, `1 = Mon`, ...).                                                                                                                |
| `closeOnSelect`      | `boolean`                                                     | `true`                          | In date-only mode, closes popover after day click.                                                                                                        |
| `showCalendarButton` | `boolean`                                                     | `true`                          | Renders trigger button next to input.                                                                                                                     |
| `openOnInputClick`   | `boolean`                                                     | `false`                         | Opens popover when clicking input.                                                                                                                        |
| `zIndex`             | `number`                                                      | `9999`                          | Popover stacking layer value.                                                                                                                             |
| `theme`              | `'light' \| 'dark' \| 'auto' \| Partial<ThekDatePickerTheme>` | `{}`                            | Per-instance theme template or token overrides without changing global theme.                                                                             |
| `reactiveTheme`      | `boolean`                                                     | `false`                         | When true and `theme: 'auto'`, reacts to page theme changes.                                                                                              |
| `themeAttribute`     | `string`                                                      | `'data-theme'`                  | Document attribute that carries page theme (`light`/`dark`).                                                                                              |
| `suspiciousWarning`  | `boolean`                                                     | `false`                         | Enables warning indicator for suspicious date values.                                                                                                     |
| `suspiciousYearSpan` | `number`                                                      | `100`                           | Marks years outside current year ± span as suspicious.                                                                                                    |
| `suspiciousMinYear`  | `number`                                                      | `undefined`                     | Optional absolute lower year threshold for warnings.                                                                                                      |
| `suspiciousMaxYear`  | `number`                                                      | `undefined`                     | Optional absolute upper year threshold for warnings.                                                                                                      |
| `suspiciousMessage`  | `string`                                                      | `'Suspicious date value'`       | Tooltip text shown when warning is active.                                                                                                                |
| `revertWarning`      | `boolean`                                                     | `true`                          | Shows sticky `!` revert pill when invalid input is reverted; hover tooltip includes rejected user input until corrected value or null clear is committed. |
| `revertMessage`      | `string`                                                      | `'Invalid input value'`         | Tooltip text for revert indicator state.                                                                                                                  |
| `onChange`           | `(date, formatted, instance) => void`                         | `undefined`                     | Called when value changes.                                                                                                                                |
| `onOpen`             | `(instance) => void`                                          | `undefined`                     | Called when popover opens.                                                                                                                                |
| `onClose`            | `(instance) => void`                                          | `undefined`                     | Called when popover closes.                                                                                                                               |

## Instance Properties

| Property  | Type               | Default              | Description                     |
| --------- | ------------------ | -------------------- | ------------------------------- |
| `input`   | `HTMLInputElement` | set at init          | Target input element.           |
| `options` | `ResolvedOptions`  | resolved from config | Runtime options after defaults. |

## Factory + Utilities

| Function                             | Type                                                                     | Default | Description                                        |
| ------------------------------------ | ------------------------------------------------------------------------ | ------- | -------------------------------------------------- |
| `createDatePicker(target, options?)` | `(string \| HTMLInputElement, ThekDatePickerOptions?) => ThekDatePicker` | n/a     | Creates a new instance.                            |
| `setGlobalOptions(options)`          | `(Partial<ThekDatePickerOptions>) => void`                               | n/a     | Sets/merges global defaults used by new instances. |
| `getGlobalOptions()`                 | `() => Partial<ThekDatePickerOptions>`                                   | n/a     | Returns current global defaults.                   |
| `resetGlobalOptions()`               | `() => void`                                                             | n/a     | Clears global defaults.                            |
| `formatDate(date, format)`           | `(Date, string) => string`                                               | n/a     | Formats date by tokens.                            |
| `parseDateByFormat(value, format)`   | `(string, string) => Date \| null`                                       | n/a     | Strict token-based parsing.                        |
| `applyMaskToInput(value, format)`    | `(string, string) => string`                                             | n/a     | Applies typing mask to raw text.                   |

## Instance Methods

| Method                                              | Type                                                                    | Default                | Description                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------- |
| `open()`                                            | `() => void`                                                            | n/a                    | Opens popover.                                                       |
| `close()`                                           | `() => void`                                                            | n/a                    | Closes popover.                                                      |
| `toggle()`                                          | `() => void`                                                            | n/a                    | Toggles popover.                                                     |
| `setDate(value, triggerChange?)`                    | `(DateInput, boolean = true) => void`                                   | `triggerChange = true` | Sets value, syncs UI, optional callback trigger.                     |
| `setDateFromTimestamp(timestampMs, triggerChange?)` | `(number, boolean = true) => void`                                      | `triggerChange = true` | Sets value using an explicit Unix timestamp in milliseconds.         |
| `getDate()`                                         | `() => Date \| null`                                                    | n/a                    | Returns selected date clone or `null`.                               |
| `clear(triggerChange?)`                             | `(boolean = true) => void`                                              | `triggerChange = true` | Clears value and UI.                                                 |
| `setMinDate(value)`                                 | `(DateInput) => void`                                                   | n/a                    | Updates min date and revalidates selection.                          |
| `setMaxDate(value)`                                 | `(DateInput) => void`                                                   | n/a                    | Updates max date and revalidates selection.                          |
| `setDisabled(disabled)`                             | `(boolean) => void`                                                     | n/a                    | Enables/disables control.                                            |
| `setTheme(theme)`                                   | `('light' \| 'dark' \| 'auto' \| Partial<ThekDatePickerTheme>) => void` | n/a                    | Replaces runtime theme (template or token object) for this instance. |
| `destroy()`                                         | `() => void`                                                            | n/a                    | Removes listeners/popover and restores DOM.                          |

## Styling Hooks

| Class                 | Type      | Default         | Description                              |
| --------------------- | --------- | --------------- | ---------------------------------------- |
| `.thekdp-input-wrap`  | CSS class | from `base.css` | Wrapper for input + trigger.             |
| `.thekdp-input`       | CSS class | from `base.css` | Input element styling hook.              |
| `.thekdp-trigger-btn` | CSS class | from `base.css` | Calendar trigger button styling hook.    |
| `.thekdp-popover`     | CSS class | from `base.css` | Calendar popover container styling hook. |

## Behavior Notes

- Default opening behavior is trigger-button click (`openOnInputClick` is off by default).
- Input mask allows flexible separators and normalizes to configured format.
- For `A`/`a`, typing `a` or `p` is accepted and normalized.
- Option precedence is: instance options override global options.

## Migration Notes

- `DateInput` no longer accepts `number` to avoid second-vs-millisecond ambiguity.
- If you previously passed numeric timestamps to `setDate`, switch to:
  - `setDateFromTimestamp(timestampMs)`
  - or `setDate(new Date(timestampMs))`

## Global Defaults API

- `setGlobalOptions(options)`: merges defaults for all future instances.
- `getGlobalOptions()`: returns current merged global defaults.
- `resetGlobalOptions()`: clears global defaults.

## Events

```ts
createDatePicker("#events-input", {
  format: "DD/MM/YYYY",
  onOpen: () => console.log("onOpen"),
  onChange: (date, formatted) => console.log("onChange", date, formatted),
  onClose: () => console.log("onClose"),
});
```

| Event      | Signature                                                                   | Description                                                              |
| ---------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `onOpen`   | `(instance: ThekDatePicker) => void`                                        | Fires when popover opens.                                                |
| `onChange` | `(date: Date \| null, formatted: string, instance: ThekDatePicker) => void` | Fires after value changes via typing, calendar click, clear, or API set. |
| `onClose`  | `(instance: ThekDatePicker) => void`                                        | Fires when popover closes.                                               |

## Locale Defaults

```ts
createDatePicker("#locale-date", {
  useLocaleDefaults: true,
  locale: "en-US",
  enableTime: true,
});
```

## Suspicious Date Warning

```ts
createDatePicker("#audit-date", {
  format: "YYYY-MM-DD",
  suspiciousWarning: true,
  suspiciousYearSpan: 100,
  suspiciousMinYear: 1900,
  suspiciousMaxYear: 2100,
  suspiciousMessage: "Please double-check this date",
});
```

## Revert Indicator

```ts
createDatePicker("#date", {
  format: "DD/MM/YYYY",
  revertWarning: true,
  revertMessage: "Invalid value reverted",
});
```

This also applies when a typed value is outside `minDate`/`maxDate` and gets clamped on commit.

## Theme Object

| Property          | Type     | Description                                    |
| ----------------- | -------- | ---------------------------------------------- |
| `primary`         | `string` | Accent color for selected and active UI.       |
| `primaryStrong`   | `string` | Stronger accent shade for hover/active states. |
| `primaryContrast` | `string` | Text color on accent backgrounds.              |
| `bgSurface`       | `string` | Input and popover base background.             |
| `bgPanel`         | `string` | Hover panel background.                        |
| `border`          | `string` | Border color for controls/popover.             |
| `textMain`        | `string` | Main text color.                               |
| `textMuted`       | `string` | Secondary text color.                          |
| `shadow`          | `string` | Popover box-shadow value.                      |
| `radius`          | `string` | Border radius token.                           |
| `fontFamily`      | `string` | Component font family.                         |
| `controlHeight`   | `string` | Input + button control height.                 |

You can also pass a template string:

- `theme: 'light'`
- `theme: 'dark'`
- `theme: 'auto'`

## Default Init (All Defaults Explicit)

```ts
createDatePicker("#my-date", {
  format: "DD/MM/YYYY",
  enableTime: false,
  timeFormat: "HH:mm",
  minDate: undefined,
  maxDate: undefined,
  defaultDate: undefined,
  placeholder: undefined, // defaults to derived format
  disabled: false,
  appendTo: document.body,
  weekStartsOn: 0,
  closeOnSelect: true,
  showCalendarButton: true,
  openOnInputClick: false,
  theme: {},
  reactiveTheme: false,
  themeAttribute: "data-theme",
  suspiciousWarning: false,
  suspiciousYearSpan: 100,
  suspiciousMinYear: undefined,
  suspiciousMaxYear: undefined,
  suspiciousMessage: "Suspicious date value",
  revertWarning: true,
  revertMessage: "Invalid input value",
  onChange: undefined,
  onOpen: undefined,
  onClose: undefined,
});
```

## Development

```bash
npm install
npm run dev
npm test -- --run
npm run build
```
