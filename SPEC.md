# SPEC.md - ThekDatePicker Specification

## Project Overview

- **Project Name**: ThekDatePicker
- **Type**: Framework-agnostic date/time picker library
- **Core Functionality**: A single-date/date-time picker with strict input masking, flexible separators, calendar popover, and themeable styles
- **Target Users**: Web developers needing a vanilla JS date picker that works with any framework

## Technology Stack

- **Language**: TypeScript
- **Build Tool**: Vite
- **Testing**: Vitest
- **Linting**: oxlint
- **Formatting**: oxfmt
- **Output Formats**: ES modules, UMD, TypeScript definitions

## Architecture

### Core Components

1. **ThekDatePicker Class** (`src/core/thekdatepicker.ts`)
   - Main picker instance managing input, popover, and state
   - Methods: open, close, toggle, setDate, getDate, clear, destroy, etc.

2. **Global Options** (`src/core/global-options.ts`)
   - `setGlobalOptions()` - Merge global defaults
   - `getGlobalOptions()` - Retrieve current defaults
   - `resetGlobalOptions()` - Clear all defaults

3. **Types** (`src/core/types.ts`)
   - `ThekDatePickerOptions` - Configuration interface
   - `ThekDatePickerTheme` - Theme tokens
   - `DateInput` - Allowed input types (Date | string | null | undefined)

4. **Date Utilities** (`src/core/date-utils.ts`, `src/utils/date.ts`)
   - `formatDate()` - Format date by tokens
   - `parseDateByFormat()` - Parse string with format
   - `applyMaskToInput()` - Apply typing mask

### CSS Themes

- `src/themes/base.css` - Base styles and theming system
- Theme tokens: primary, primaryStrong, primaryContrast, bgSurface, bgPanel, border, textMain, textMuted, shadow, radius, fontFamily, controlHeight

## Feature Specifications

### Input Masking

- Strict format-based masking (e.g., DD/MM/YYYY)
- Flexible separators: `/`, `-`, `.` all accepted and normalized to configured separator
- Tokens: YYYY, YY, MM, M, DD, D, HH, H, hh, h, mm, m, A, a
- For meridiem (A/a), typing `a` or `p` is accepted and normalized

### Calendar Popover

- Opens on trigger button click (default)
- Optional `openOnInputClick` to open on input focus
- Month view with day grid
- Time picker when `enableTime` is true
- Close on day selection (`closeOnSelect`)

### Theme System

- Built-in themes: `light`, `dark`, `auto`
- Custom theme objects with token overrides
- Reactive theme detection via `data-theme` attribute
- CSS custom properties for runtime theming

### Validation Features

- **Min/Max Date**: Clamps values outside range
- **Suspicious Date Warning**: Warns about dates far from current year
- **Revert Warning**: Shows indicator when invalid input is reverted

### Date Input Handling

- `DateInput` type: `Date | string | null | undefined`
- No raw numbers - use `setDateFromTimestamp(timestampMs)` for timestamps
- Null clears the value

## API Reference

### Factory Function

```ts
createDatePicker(target: string | HTMLInputElement, options?: ThekDatePickerOptions): ThekDatePicker
```

### Instance Methods

| Method                                              | Description                |
| --------------------------------------------------- | -------------------------- |
| `open()`                                            | Opens popover              |
| `close()`                                           | Closes popover             |
| `toggle()`                                          | Toggles popover state      |
| `setDate(value, triggerChange?)`                    | Sets date value            |
| `setDateFromTimestamp(timestampMs, triggerChange?)` | Sets from Unix timestamp   |
| `getDate()`                                         | Returns Date clone or null |
| `clear(triggerChange?)`                             | Clears value               |
| `setMinDate(value)`                                 | Updates min date           |
| `setMaxDate(value)`                                 | Updates max date           |
| `setDisabled(disabled)`                             | Enables/disables control   |
| `setTheme(theme)`                                   | Updates theme              |
| `destroy()`                                         | Cleanup and remove         |

### Options

| Option             | Type          | Default                 | Description                                       |
| ------------------ | ------------- | ----------------------- | ------------------------------------------------- |
| format             | string        | 'DD/MM/YYYY'            | Date format mask                                  |
| locale             | string        | system                  | Locale for defaults                               |
| useLocaleDefaults  | boolean       | false                   | Derive format/timeFormat/weekStartsOn from locale |
| enableTime         | boolean       | false                   | Show time picker                                  |
| timeFormat         | string        | 'HH:mm'                 | Time format when no time tokens in format         |
| minDate            | DateInput     | undefined               | Minimum allowed date                              |
| maxDate            | DateInput     | undefined               | Maximum allowed date                              |
| defaultDate        | DateInput     | undefined               | Initial value                                     |
| placeholder        | string        | derived                 | Placeholder text                                  |
| disabled           | boolean       | false                   | Disable input                                     |
| appendTo           | HTMLElement   | document.body           | Popover container                                 |
| weekStartsOn       | 0-6           | 0                       | First day of week                                 |
| closeOnSelect      | boolean       | true                    | Close after day selection                         |
| showCalendarButton | boolean       | true                    | Show trigger button                               |
| openOnInputClick   | boolean       | false                   | Open on input click                               |
| zIndex             | number        | 9999                    | Popover z-index                                   |
| theme              | string/object | {}                      | Theme template or overrides                       |
| reactiveTheme      | boolean       | false                   | React to document theme                           |
| themeAttribute     | string        | 'data-theme'            | Theme attribute name                              |
| suspiciousWarning  | boolean       | false                   | Enable suspicious date warning                    |
| suspiciousYearSpan | number        | 100                     | Year span for warning                             |
| suspiciousMinYear  | number        | undefined               | Absolute min year                                 |
| suspiciousMaxYear  | number        | undefined               | Absolute max year                                 |
| suspiciousMessage  | string        | 'Suspicious date value' | Warning tooltip                                   |
| revertWarning      | boolean       | true                    | Show revert indicator                             |
| revertMessage      | string        | 'Invalid input value'   | Revert tooltip                                    |

### Events

| Event    | Signature                           | Description    |
| -------- | ----------------------------------- | -------------- |
| onOpen   | (instance) => void                  | Popover opened |
| onChange | (date, formatted, instance) => void | Value changed  |
| onClose  | (instance) => void                  | Popover closed |

## Styling Hooks

| CSS Class           | Description       |
| ------------------- | ----------------- |
| .thekdp-input-wrap  | Input wrapper     |
| .thekdp-input       | Input element     |
| .thekdp-trigger-btn | Calendar button   |
| .thekdp-popover     | Popover container |

## Option Precedence

1. Instance options (highest)
2. Global options (via setGlobalOptions)
3. Default values (lowest)

## Build Outputs

- `dist/thekdatepicker.js` - ES module
- `dist/thekdatepicker.umd.cjs` - UMD
- `dist/thekdatepicker.min.js` - Minified ES
- `dist/thekdatepicker.umd.min.cjs` - Minified UMD
- `dist/index.d.ts` - TypeScript definitions
- `dist/css/base.css` - Documented CSS entrypoint
- `dist/css/thekdatepicker.css` - Canonical bundled CSS asset

## Testing

- Unit tests: `tests/core/`
- Integration tests: `tests/integration/`
- Run with: `npm test` (watch mode) or `npm run coverage`

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start showcase dev server
npm test             # Run tests
npm run build        # Build for production
npm run lint         # Lint code
npm run format       # Check formatting
```
