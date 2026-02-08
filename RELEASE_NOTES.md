# Release Notes

## Unreleased

### Added
- Framework-agnostic `ThekDatePicker` core with calendar popover, date/time selection, min/max constraints, and strict masking.
- 12-hour and 24-hour time formats, including AM/PM parsing/masking (`A` / `a`).
- Global defaults API:
  - `setGlobalOptions(options)`
  - `getGlobalOptions()`
  - `resetGlobalOptions()`
- Runtime theme API:
  - `setTheme(theme)`
- Theme option now supports templates and object tokens:
  - `'light' | 'dark' | 'auto' | Partial<ThekDatePickerTheme>`
- Reactive auto-theme support:
  - `reactiveTheme`
  - `themeAttribute`
  - follows page theme attribute and `prefers-color-scheme`.
- Locale-derived initialization options:
  - `useLocaleDefaults`
  - `locale`
  - derives `format`, `timeFormat`, and `weekStartsOn` when enabled.
- Suspicious date warning options:
  - `suspiciousWarning`
  - `suspiciousYearSpan`
  - `suspiciousMinYear`
  - `suspiciousMaxYear`
  - `suspiciousMessage`
  - optional exclamation indicator and warning state styling.
- Invalid-revert indicator options:
  - `revertWarning`
  - `revertMessage`
  - sticky blended-pill warning cue now includes reverted-to value and remains until corrected value or explicit null clear is committed.
- Comprehensive showcase updates:
  - quick docs for ESM and CDN
  - theme configurator with copyable theme object
  - expanded API/theme reference tables
  - syntax-highlighted code blocks.

### Changed
- Default opening behavior uses calendar button (`openOnInputClick: false` by default).
- Base theme now uses system color tokens with dark-mode-aware fallbacks.
- Styling was standardized to rem-based sizing and improved control alignment.
- Docs and README were expanded to cover options, methods, defaults, theme usage, CDN usage, and global options.
- Core refactor: split `ThekDatePicker` support logic into dedicated modules:
  - `thekdatepicker-dom.ts` (DOM/template creation)
  - `thekdatepicker-theme.ts` (theme variable application)
  - `thekdatepicker-suspicious.ts` (suspicious date rules)

### Fixed
- Input target validation and initialization flow issues in showcase usage.
- Mask typing behavior for separators and invalid characters.
- Backspace behavior around time separators and AM/PM editing.
- Trigger button/icon visual consistency and input/button vertical alignment.
- Strict input parsing now avoids native `Date(...)` string fallback, preventing ambiguous values like `---12` from being accepted.
- Typed values that exceed `minDate`/`maxDate` now trigger the same revert warning indicator when clamped on commit.
