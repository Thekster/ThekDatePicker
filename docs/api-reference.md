# API Reference

## Factory Functions

### createDatePicker

Creates a new date picker instance.

```ts
createDatePicker(target: string | HTMLInputElement, options?: ThekDatePickerOptions): ThekDatePicker
```

**Parameters:**
- `target` - CSS selector string or input element
- `options` - Optional configuration object

**Returns:** ThekDatePicker instance

**Example:**
```ts
const picker = createDatePicker("#my-input", {
  format: "DD/MM/YYYY",
  enableTime: true,
});
```

### setGlobalOptions

Sets global default options for all new picker instances.

```ts
setGlobalOptions(options: Partial<ThekDatePickerOptions>): void
```

**Example:**
```ts
setGlobalOptions({
  format: "YYYY-MM-DD",
  theme: "auto",
  useLocaleDefaults: true,
});
```

### getGlobalOptions

Returns the current global options.

```ts
getGlobalOptions(): Partial<ThekDatePickerOptions>
```

### resetGlobalOptions

Clears all global options to defaults.

```ts
resetGlobalOptions(): void
```

## Instance Methods

### open()

Opens the calendar popover.

```ts
picker.open(): void
```

### close()

Closes the calendar popover.

```ts
picker.close(): void
```

### toggle()

Toggles the popover open/closed state.

```ts
picker.toggle(): void
```

### setDate

Sets the date value.

```ts
picker.setDate(value: DateInput, triggerChange?: boolean): void
```

**Parameters:**
- `value` - Date, string, null, or undefined
- `triggerChange` - Whether to fire onChange callback (default: true)

**Note:** Use `setDateFromTimestamp()` for numeric timestamps.

### setDateFromTimestamp

Sets date from Unix timestamp in milliseconds.

```ts
picker.setDateFromTimestamp(timestampMs: number, triggerChange?: boolean): void
```

### getDate

Returns the current date.

```ts
picker.getDate(): Date | null
```

Returns a clone of the internal Date object, or null if no date selected.

### clear

Clears the date value.

```ts
picker.clear(triggerChange?: boolean): void
```

### setMinDate

Sets the minimum allowed date.

```ts
picker.setMinDate(value: DateInput): void
```

### setMaxDate

Sets the maximum allowed date.

```ts
picker.setMaxDate(value: DateInput): void
```

### setDisabled

Enables or disables the picker.

```ts
picker.setDisabled(disabled: boolean): void
```

### setTheme

Sets the theme for this instance.

```ts
picker.setTheme(theme: ThekDatePickerThemeOption): void
```

Accepts: `'light'`, `'dark'`, `'auto'`, or a partial theme object.

### destroy

Removes the picker and cleans up DOM elements.

```ts
picker.destroy(): void
```

## Instance Properties

### input

The underlying input element.

```ts
picker.input: HTMLInputElement
```

### options

The resolved configuration options.

```ts
picker.options: ResolvedOptions
```

## Options

### format

Date format string using tokens.

```ts
format?: string  // Default: 'DD/MM/YYYY'
```

### locale

Locale for deriving defaults.

```ts
locale?: string  // Default: system locale
```

### useLocaleDefaults

Derive format, timeFormat, and weekStartsOn from locale.

```ts
useLocaleDefaults?: boolean  // Default: false
```

### enableTime

Show time picker in popover.

```ts
enableTime?: boolean  // Default: false
```

### timeFormat

Time format when format has no time tokens.

```ts
timeFormat?: string  // Default: 'HH:mm'
```

### minDate

Minimum allowed date.

```ts
minDate?: DateInput
```

### maxDate

Maximum allowed date.

```ts
maxDate?: DateInput
```

### defaultDate

Initial date value.

```ts
defaultDate?: DateInput
```

### placeholder

Custom placeholder text.

```ts
placeholder?: string  // Default: derived from format
```

### disabled

Disable the input and trigger.

```ts
disabled?: boolean  // Default: false
```

### appendTo

Container element for the popover.

```ts
appendTo?: HTMLElement  // Default: document.body
```

### weekStartsOn

First day of the week.

```ts
weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6  // Default: 0 (Sunday)
```

### closeOnSelect

Close popover after selecting a day.

```ts
closeOnSelect?: boolean  // Default: true
```

### showCalendarButton

Show the calendar trigger button.

```ts
showCalendarButton?: boolean  // Default: true
```

### openOnInputClick

Open popover when clicking the input.

```ts
openOnInputClick?: boolean  // Default: false
```

### zIndex

Popover z-index value.

```ts
zIndex?: number  // Default: 9999
```

### theme

Theme template or custom object.

```ts
theme?: ThekDatePickerThemeOption  // Default: {}
```

### reactiveTheme

React to document theme changes when theme is 'auto'.

```ts
reactiveTheme?: boolean  // Default: false
```

### themeAttribute

Document attribute to read for 'auto' theme.

```ts
themeAttribute?: string  // Default: 'data-theme'
```

### suspiciousWarning

Enable suspicious date warning indicator.

```ts
suspiciousWarning?: boolean  // Default: false
```

### suspiciousYearSpan

Year range around current year for suspicious warning.

```ts
suspiciousYearSpan?: number  // Default: 100
```

### suspiciousMinYear

Absolute minimum year for suspicious warning.

```ts
suspiciousMinYear?: number
```

### suspiciousMaxYear

Absolute maximum year for suspicious warning.

```ts
suspiciousMaxYear?: number
```

### suspiciousMessage

Tooltip text for suspicious warning.

```ts
suspiciousMessage?: string  // Default: 'Suspicious date value'
```

### revertWarning

Show revert indicator when invalid input is reverted.

```ts
revertWarning?: boolean  // Default: true
```

### revertMessage

Tooltip text for revert indicator.

```ts
revertMessage?: string  // Default: 'Invalid input value'
```

### onChange

Callback when value changes.

```ts
onChange?: (date: Date | null, formatted: string, instance: ThekDatePicker) => void
```

### onOpen

Callback when popover opens.

```ts
onOpen?: (instance: ThekDatePicker) => void
```

### onClose

Callback when popover closes.

```ts
onClose?: (instance: ThekDatePicker) => void
```

## Format Tokens

| Token | Type | Description |
|-------|------|-------------|
| YYYY | year | 4-digit year |
| YY | year | 2-digit year |
| MM | month | 2-digit month (01-12) |
| M | month | 1-2 digit month (1-12) |
| DD | day | 2-digit day (01-31) |
| D | day | 1-2 digit day (1-31) |
| HH | time (24h) | 2-digit hour (00-23) |
| H | time (24h) | 1-2 digit hour (0-23) |
| hh | time (12h) | 2-digit hour (01-12) |
| h | time (12h) | 1-2 digit hour (1-12) |
| mm | time | 2-digit minutes (00-59) |
| m | time | 1-2 digit minutes (0-59) |
| A | meridiem | AM or PM |
| a | meridiem | am or pm |

## Utility Functions

### formatDate

Formats a Date object to a string.

```ts
formatDate(date: Date, format: string): string
```

### parseDateByFormat

Parses a string to a Date using strict format matching.

```ts
parseDateByFormat(value: string, format: string): Date | null
```

### applyMaskToInput

Applies input mask to raw text.

```ts
applyMaskToInput(value: string, format: string): string
```

## Type Definitions

### DateInput

```ts
type DateInput = Date | string | null | undefined
```

### ThekDatePickerTheme

```ts
interface ThekDatePickerTheme {
  primary: string;
  primaryStrong: string;
  primaryContrast: string;
  bgSurface: string;
  bgPanel: string;
  border: string;
  textMain: string;
  textMuted: string;
  shadow: string;
  radius: string;
  fontFamily: string;
  controlHeight: string;
}
```

### ThekDatePickerThemeOption

```ts
type ThekDatePickerThemeOption = 'light' | 'dark' | 'auto' | Partial<ThekDatePickerTheme>
```