# Release Notes

## 1.1.1 - 2026-04-05

### Fixed

- **Timezone-Blind Internationalization:** Fixed a critical bug where localized weekday names shifted in western timezones due to UTC anchor date usage. Now uses a local anchor date for consistent labeling. (SEV-1)
- **Grid Accessibility:** Added `role="row"` to the calendar grid and grouped day cells into rows for full W3C ARIA compliance. (SEV-2)
- **Input Accessibility:** Enhanced the main input with `aria-haspopup`, `aria-expanded`, and `aria-controls` for better screen reader support. (SEV-2)
- **Outside Click Resilience:** Switched to `event.composedPath()` for outside click detection, ensuring the picker doesn't prematurely close when clicking dynamic or unmounting elements. (SEV-3)
- **Memory Leak Protection:** Explicitly cancel pending `requestAnimationFrame` calls during component destruction to prevent ghost callbacks and memory leaks. (SEV-3)
- **Strict Parsing:** Improved `parseDateByFormat` to strictly enforce separator presence, preventing silent format truncation or incorrect date interpretation. (SEV-4)
- **Type Safety:** Refined `DateInput` and `setDate` types to be more explicit about handling `null` and `undefined` values for clearing state. (SEV-4)

### Changed

- **Build Pipeline:** CSS is now correctly integrated into the Vite pipeline, ensuring `base.css` is minified and correctly distributed without manual copy scripts. (SEV-3)

## 1.1.0 - 2026-04-04

### Fixed

- **Parser Resilience:** `parseDateByFormat` now strips zero-width spaces, non-breaking spaces, and other invisible Unicode characters from input. Whitespace between tokens is skipped gracefully, and flexible separators are accepted in literal positions.
- **Safe Date Construction:** `normalizeDateInput` no longer uses the native `new Date(string)` constructor for string inputs. Only ISO 8601 date strings are accepted, eliminating cross-browser parsing inconsistencies (Safari vs Chrome).
- **Render Optimization:** Day cell rendering now builds className strings directly instead of allocating intermediate arrays, reducing GC pressure during rapid month navigation.
- **Mobile & Touch Support:** Switched from `mousedown` to `pointerdown` for unified mouse/touch/stylus handling. Added `touch-action: manipulation` on the popover to eliminate 300ms click delay. Input elements now use `inputmode="text"` and `autocomplete="off"` for better mobile behavior.
- **Clamped Input Preservation:** When a typed date is clamped to `minDate`/`maxDate`, the revert indicator now correctly displays the user's original input in the tooltip, even when the suspicious state would otherwise clear it.

### Added

- **ISO 8601 Parser:** New `parseIsoDateString` utility for safe, explicit parsing of ISO date strings without relying on the native `Date` constructor.
- **Mobile Attributes:** Input elements automatically receive `inputmode="text"` and `autocomplete="off"` on initialization.

## 1.0.1 - 2026-03-22

### Fixed

- **Literal Word Corruption in Formatting:** Date tokens like `D` or `a` are no longer replaced inside literal words (e.g., "Date" no longer becomes "22pmte").
- **False Meridiem Triggers:** Fixed logic where literal letters 'A' or 'a' in the format string incorrectly triggered 12-hour parsing logic.
- **Literal Escaping Support:** Added support for square-bracket escaping (e.g., `[Date]: DD/MM/YYYY`) to explicitly define literal text in format strings.
- **Flexible Normalization:** Improved `normalizeInputSeparatorsToFormat` to correctly handle literal words during flexible date extraction.
- **Relaxed Paste Validation:** Users can now paste fully formatted dates that include literal words.

### Technical

- Migrated test configuration from broken `vite-plus` to `vitest` for improved stability.
- Added comprehensive regression tests for literal word handling and escaping.

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
