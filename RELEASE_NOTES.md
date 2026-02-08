# Release Notes

## 1.0.0 - 2026-02-08

### Patch Updates

#### Added
- New explicit timestamp API: `setDateFromTimestamp(timestampMs, triggerChange?)`.
- New `zIndex` option to configure popover stacking instead of relying on a hardcoded value.
- Expanded test coverage for edge-cases:
  - re-entrancy (`onChange` calling `setDate`)
  - rapid input masking/caret stability
  - global-options isolation across instances
  - listener cleanup after repeated create/destroy cycles
  - XSS safety with string input
  - leap-year navigation, Date cloning, and Enter-key commit behavior

#### Changed
- `DateInput` is now `Date | string | null | undefined` (numeric timestamps removed for type safety).
- Day grid rendering now reuses existing day cells instead of replacing `innerHTML` each render.
- Keyboard filtering is less aggressive: non-printable keys and system shortcuts are no longer blocked.

#### Fixed
- Prevented `onChange` re-entrancy loops by guarding nested emits.
- Fixed trigger/outside-click interaction ordering so trigger clicks can reliably close an open picker.
- Removed `queueMicrotask` masking race; input masking is now synchronous with caret preservation.

#### Migration
- Replace `setDate(1707399999000)` with:
  - `setDateFromTimestamp(1707399999000)`, or
  - `setDate(new Date(1707399999000))`.

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
