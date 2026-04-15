# Release Notes

## 1.2.4 - 2026-04-15

### Fixed

- **Partial Paste Workflow:** Partial pasted values now pass through the input mask instead of being blocked outright, so users can paste fragments such as `12-12-` and finish the remaining segments manually. (SEV-2)
- **Invalid Blur Preservation:** Invalid or incomplete typed values are no longer silently replaced with the last committed date on blur; the raw text remains in the input and is exposed as an invalid state for correction. (SEV-2)
- **Validation Semantics:** The input now distinguishes truly invalid raw text from merely suspicious-but-valid dates, preserving `aria-invalid`, status messaging, and styling for actual invalid entry without regressing the suspicious-date warning flow. (SEV-3)

## 1.2.3 - 2026-04-14

### Fixed

- **TypeScript Consumer Packaging:** Removed the root declaration-side CSS side-effect import, added typed CSS subpath exports, and verified external TypeScript consumers can import both the package entrypoint and documented CSS path without TS2882 failures. (SEV-1)
- **Triggerless Warning Infrastructure:** `showCalendarButton: false` now disables only the trigger button instead of silently removing suspicious/revert indicators and assistive status text. (SEV-2)
- **Time Control Semantics:** Popover time controls now follow the effective 12-hour or 24-hour mode, including explicit AM/PM selection when the configured format uses meridiem tokens. (SEV-2)
- **Constraint Setter Revalidation:** `setMinDate()` and `setMaxDate()` now fully revalidate selected value, calendar view state, and emitted change notifications when the current value is clamped. (SEV-2)
- **ISO Input Safety:** Offset-bearing ISO strings are no longer accepted as if they were local wall-clock values, preventing silent timezone corruption during string normalization. (SEV-2)
- **Trusted Types / CSP DOM Construction:** Static SVG icon construction now uses DOM APIs instead of `innerHTML`, eliminating the remaining Trusted Types and strict CSP incompatibility in picker UI scaffolding. (SEV-3)
- **Combobox Semantics:** The input now carries explicit combobox role semantics instead of only partial grid-popup attributes. (SEV-3)

### Changed

- **Public API Contract:** `DateInput` now explicitly includes `null | undefined` in the published types to match actual runtime clearing behavior.
- **Extension Surface Cleanup:** Removed the undocumented, nonfunctional `cssPrefix` option from the public API instead of pretending the shipped CSS supported arbitrary prefixes.
- **Documentation Accuracy:** README and docs now state that CSS must be imported explicitly, clarify trigger-button behavior, and fix the broken unpkg CDN script URL.

## 1.2.2 - 2026-04-11

### Fixed

- **Calendar Week Row Layout:** Restored the showcase and base-theme day grid layout after the ARIA row grouping change so month days render in proper week rows instead of stacking by weekday columns. (SEV-1)
- **Time Input Keyboard Behavior:** Time fields now keep focus-local `ArrowUp` and `ArrowDown` handling for stepping hour and minute values instead of letting calendar navigation intercept those keys. (SEV-2)
- **24-Hour Time Padding:** Time inputs now preserve two-digit `HH:mm` display values such as `09:05` instead of collapsing to unpadded browser-native number formatting. (SEV-2)
- **GitHub Pages Showcase Bootstrapping:** Moved showcase initialization into a bundled module entry so the published Pages build includes the actual runtime setup and no longer ships a broken static page with missing client logic. (SEV-1)

### Changed

- **Showcase Navigation:** Added a GitHub repository link to the showcase sidebar for direct source access from the published demo.

## 1.2.1 - 2026-04-11

### Changed

- **Follow-up Release Alignment:** Bumped package metadata for a follow-up release so the core library and Vue wrapper can be republished and validated together after the npm package-name recovery.

## 1.2.0 - 2026-04-11

### Added

- **Vue Wrapper Package:** Added `thekdatepicker-vue` as a rendered Vue component that creates its own input, forwards standard input attributes, exposes picker methods through refs, and ships with dedicated wrapper tests and README usage docs. (SEV-2)

### Changed

- **Monorepo Validation Scope:** Root test and release-check scripts now validate both the core package and the Vue wrapper package instead of only the core workspace.

### Fixed

- **CI Build/Test Order:** CI now builds packages before running artifact-dependent tests so package verification no longer depends on stale local output. (SEV-1)
- **GitHub Pages Artifact Path:** Pages deployment now uploads the showcase output from the package workspace path used by the monorepo build. (SEV-1)
- **ARIA Role Mismatch:** Removed `role="dialog"` from the popover and updated the input to `aria-haspopup="grid"` to correctly reflect the calendar dropdown pattern without violating focus-trapping requirements for modal dialogs. (SEV-2)
- **Strict Paste Validation:** The paste handler now strictly validates the entire pasted string against the format before allowing it, preventing invalid data (like `99/99/9999`) from being momentarily accepted before blur. (SEV-3)
- **Security & CSP Compliance:** Refactored DOM construction to eliminate `innerHTML` usage in favor of `document.createElement`. This prevents potential XSS vectors and ensures compatibility with strict Content Security Policies (CSP) and Trusted Types. (SEV-4)

## 1.1.2 - 2026-04-09

### Fixed

- **Release Surface Alignment:** Corrected package metadata and build output so the documented CSS entrypoint now ships as `dist/css/base.css`, the bundled CSS still ships as `dist/css/thekdatepicker.css`, and declaration-side CSS imports resolve against a real file in `dist/themes/base.css`. (SEV-1)
- **Publish Artifact Drift:** Rebuilt the package output to match current source modules, preventing `src`/`dist` divergence from shipping stale runtime behavior. (SEV-1)
- **Workflow Readiness:** Fixed CI, publish, and GitHub Pages deployment flow so releases validate with non-watch tests, formatted sources, and an auto-deployed showcase. (SEV-1)
- **Constraint Parsing Consistency:** `setMinDate()` and `setMaxDate()` now accept values in the configured picker format before falling back to ISO parsing, matching the public API contract. (SEV-2)
- **Global Default Date:** New instances now honor `defaultDate` supplied through global options instead of ignoring it during construction. (SEV-2)
- **Popover Placement:** Popover positioning now measures the real panel, shifts within the available container width, and flips above the input when there is not enough vertical space below. (SEV-2)
- **Global Listener Fan-Out:** Document/window interaction listeners are now shared across live picker instances instead of being attached independently by every instance. (SEV-2)
- **SSR-Safe Option Resolution:** Browser-only defaults such as `appendTo` and auto-theme detection are deferred until instantiation so option resolution no longer eagerly touches `document` or `window`. (SEV-2)
- **Time Control Churn:** Time controls now persist across rerenders instead of being rebuilt with fresh listeners on every render pass. (SEV-3)
- **Accessible Status Messaging:** Picker dialog labeling now follows the current month heading, and warning/revert messages are exposed through `aria-describedby` instead of relying only on hidden visual indicators. (SEV-3)
- **Destroy Cleanup:** `destroy()` now removes picker-added input classes and ARIA/input attributes instead of leaving stale DOM state behind. (SEV-3)
- **Day Semantics:** Added `aria-current` to the rendered current-day cell and explicit labels to time inputs for better assistive-technology hints. (SEV-3)

### Changed

- **Release Validation Order:** `release:check` now builds before package-artifact tests so package verification runs against actual generated output.
- **Generated Artifact Tooling:** Package workspace formatter/linter config now ignores `showcase-dist` so local Pages builds do not pollute source-quality checks.
- **Documentation Scope:** README copy now describes the library as browser-first and explicitly notes the current SSR/client-only boundary and accessibility scope.

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

- **Build Pipeline:** CSS is now correctly integrated into the Vite pipeline, ensuring `base.css` is minified and correctly distributed. (SEV-3)

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
