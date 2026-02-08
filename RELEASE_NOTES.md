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

### Fixed
- Input target validation and initialization flow issues in showcase usage.
- Mask typing behavior for separators and invalid characters.
- Backspace behavior around time separators and AM/PM editing.
- Trigger button/icon visual consistency and input/button vertical alignment.
