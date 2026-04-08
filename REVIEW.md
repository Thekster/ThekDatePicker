# Verdict
This repository masquerades as a robust, framework-agnostic date picker library, complete with theming, masking, and a clean public API. In reality, it is a dangerously brittle implementation that fundamentally mishandles timezones, local versus UTC date creation, and test reliability. It relies on naive `.getTime()` comparisons instead of safe calendar boundary math, and its automated tests are plagued by local timezone failures. It is a visually pleasing trap built on top of a broken date correctness model.

# Executive Damage Report
- Overall rating: 3/10
- Production readiness: Absolutely not
- Date correctness: 2/10
- API design: 6/10
- Accessibility: 4/10
- Performance: 6/10
- Test quality: 3/10
- Documentation: 7/10
- Maintenance risk: High

# What This Repo Pretends To Be vs What It Actually Is
The README and API design heavily imply a mature, production-ready, framework-agnostic library capable of safely capturing, masking, parsing, and formatting dates. It even boasts features like "Suspicious Date Warning." In actuality, the internal engine manipulates JavaScript `Date` instances using inherently flawed local-time offsets (e.g., stripping time by `setHours(0,0,0,0)` and relying on Unix epoch timestamps for day identity checks), completely collapsing under simple tests in different timezones. It is a naive prototype dressed up in production packaging.

# Top 12 Most Damaging Findings

### 1. Test Suite is Timezone-Hostile (Failing Tests)
- **Severity**: SEV-1: Catastrophic / fundamentally broken / should block release
- **Why this is bad**: The test suite fails out-of-the-box in environments not matching the author's local timezone. Any project with tests that fail depending on the server's region is fundamentally untrustworthy and unmaintainable.
- **Exact evidence from the repo**: `tests/integration/thekdatepicker.integration.test.ts:97:32`. The test "moves focus and selection through the calendar with keyboard navigation" expects `1773014400000` but receives `1770595200000` because it naively creates dates using `new Date(2026, 2, 9).setHours(0, 0, 0, 0)` and compares raw timestamps for equality, completely oblivious to local UTC offsets shifting the epoch milliseconds.
- **Real-world consequence**: CI pipelines will spontaneously fail or pass depending on the host machine's timezone configuration. Other engineers will refuse to contribute to a repository where tests fail locally on a fresh clone.
- **What a competent implementation would do instead**: Use logical day comparisons (e.g., comparing Year, Month, Date integers) rather than comparing Unix timestamps across local time boundaries, or configure the test environment to run in a fixed UTC offset.

### 2. Naive `Date.getTime()` Usage For Day Identity
- **Severity**: SEV-1: Catastrophic / fundamentally broken / should block release
- **Why this is bad**: The library uses `focusedDayTs = toLocalStartOfDay(base).getTime()` and then checks for day equality in the grid by comparing `cell.dataset.ts === String(targetTs)`. This completely falls apart near Daylight Saving Time (DST) transitions, where adding 24 hours or comparing local epoch offsets can unexpectedly shift dates backward or forward.
- **Exact evidence from the repo**: `src/core/thekdatepicker.ts` around line 557 (`this.focusedDayTs = toLocalStartOfDay(base).getTime();`) and `focusCurrentDayCell()` relying on stringified epoch values.
- **Real-world consequence**: Users navigating near a DST boundary will click a date, but the calendar will focus or select the incorrect logical day, or the day cells will lose focus synchronization.
- **What a competent implementation would do instead**: Serialize dates logically (e.g., `"YYYY-MM-DD"`) for `data-*` attributes and day identity comparisons instead of relying on local epoch times.

### 3. Flawed Range Clamp Implementation
- **Severity**: SEV-2: Serious correctness or architectural flaw
- **Why this is bad**: `clampDate` in `src/core/config-utils.ts` compares dates using `.getTime()`. If a user passes a string like `"2026-01-10"`, `parseIsoDateString` creates a local time date `new Date(2026, 0, 10, 0, 0, 0, 0)`. The comparison uses raw timestamps. Because it ignores the semantic date entirely, differences in time components or local offsets could allow out-of-bounds days.
- **Exact evidence from the repo**: `src/core/config-utils.ts` line 144: `if (minDate && ts < minDate.getTime()) return new Date(minDate);`
- **Real-world consequence**: A user tries to select the exact `minDate`, but because of a time component variance from parsing, it gets incorrectly clamped or blocked.
- **What a competent implementation would do instead**: Normalize both dates to their logical start-of-day before applying bounds checks, using Year/Month/Date comparisons.

### 4. Poor Two-Digit Year Sliding Window Logic
- **Severity**: SEV-3: Major weakness / likely future bug source
- **Why this is bad**: `resolveTwoDigitYear` in `src/core/date-utils.ts` uses an arbitrary `50` year look-ahead/look-behind logic built directly into parsing. If a user tries to input a historical date intentionally, it will silently mutate it 100 years into the future or past without warning.
- **Exact evidence from the repo**: `src/core/date-utils.ts` line 67: `if (resolved - currentYear > 50) resolved -= 100;`
- **Real-world consequence**: Entering `"45"` for `1945` in a birthdate field in 2026 might resolve to `2045` or `1945` depending entirely on the exact year the code is run.
- **What a competent implementation would do instead**: Make the century pivot configurable, or explicitly warn the user, or rely strictly on 4-digit years for precise historical dates.

### 5. Masking Logic Drops Characters Silently
- **Severity**: SEV-3: Major weakness / likely future bug source
- **Why this is bad**: `applyMaskToInput` strips out all non-digit and non-meridiem characters eagerly: `const digits = value.replace(/\D/g, "");`. This aggressively destroys any separator the user intentionally typed, completely relying on the predefined format tokens to reconstruct the string.
- **Exact evidence from the repo**: `src/core/date-utils.ts` line 133.
- **Real-world consequence**: If the user pastes a creatively formatted string or types a date quickly with valid but unexpected separators, the UI aggressively mutates their input, causing a frustrating UX.
- **What a competent implementation would do instead**: Build a robust, non-destructive state machine for masking that honors user cursor position and typed separators gracefully.

### 6. Missing Accessibility ARIA State for Focus
- **Severity**: SEV-2: Serious correctness or architectural flaw
- **Why this is bad**: The picker uses a custom focus system by manually setting `tabIndex = 0` on the "focused" day cell but does not use `aria-activedescendant` on the grid or manage focus semantically as a true composite widget.
- **Exact evidence from the repo**: `src/core/thekdatepicker.ts` line 692 sets `cell.tabIndex = !disabled && isFocusedDate ? 0 : -1;` but does not correctly structure the calendar as a `grid` composite with proper active descendant properties linked from the input.
- **Real-world consequence**: Screen reader users navigating via keyboard will struggle to understand which day is currently active before they select it, as the focus is moving around a detached `role="grid"` without proper input-to-grid ARIA linkage.
- **What a competent implementation would do instead**: Implement the W3C ARIA Date Picker pattern properly, using `aria-activedescendant` on the input referencing the active cell ID.

### 7. Overly Complex Event Re-entrancy Guard
- **Severity**: SEV-4: Quality or maintainability problem
- **Why this is bad**: `emitChange` uses a flag `isEmittingChange` to prevent loops if `onChange` updates the date. This is a hack hiding a deeper architectural flaw: the component cannot distinguish between external programmatic changes and internal user interactions.
- **Exact evidence from the repo**: `src/core/thekdatepicker.ts` line 431: `if (this.isEmittingChange) return;`
- **Real-world consequence**: If an external framework (like React or Vue) updates the date via `setDate` in response to an unrelated event while an `onChange` is resolving, the update will be silently dropped.
- **What a competent implementation would do instead**: Distinguish event payloads. Pass an interaction source (e.g., `source: "user" | "api"`) so consumers know why the value changed, and only emit events on user interaction.

### 8. `DateInput` Type Exposes `Date` Mutability
- **Severity**: SEV-3: Major weakness / likely future bug source
- **Why this is bad**: While the integration tests prove it clones Dates passed to `setDate`, `normalizeDateInput` only clones if the input is a `Date`. Min/Max configs are cloned, but the `selectedDate` is held internally and repeatedly cloned when reading. However, this defensive cloning is scattered and ad-hoc.
- **Exact evidence from the repo**: `src/core/thekdatepicker.ts` line 348 (`public getDate(): Date | null { return this.selectedDate ? new Date(this.selectedDate) : null; }`).
- **Real-world consequence**: A missed `.getTime()` call somewhere in the internals referencing `this.options.minDate` without cloning or normalizing could accidentally mutate the developer's original config object.
- **What a competent implementation would do instead**: Convert all incoming boundary strings/dates into strict, immutable internal numeric boundaries (like a Julian day number or a strict ISO string) at the edges.

### 9. Questionable Suspicious Date API
- **Severity**: SEV-4: Quality or maintainability problem
- **Why this is bad**: "Suspicious dates" are flagged entirely on the fly via a hidden toggle and a hardcoded class mutation. This logic conflates core picker responsibility (date capture) with arbitrary business validation.
- **Exact evidence from the repo**: `src/core/thekdatepicker.ts` line 630 calls `isSuspiciousDate` and toggles an arbitrary CSS class (`-input-suspicious`) and tooltip.
- **Real-world consequence**: The library forces business-level validation (e.g. "is this date too old?") into the UI rendering lifecycle. Forms using this component will end up with an unremovable `aria-invalid` state based purely on the picker's opinion, fighting the host application's validation system.
- **What a competent implementation would do instead**: Remove this entirely. Provide a clean `onChange` payload and let the consuming application handle validation and error rendering.

### 10. Memory Leak Potential via ` MutationObserver`
- **Severity**: SEV-3: Major weakness / likely future bug source
- **Why this is bad**: `setupReactiveTheme` registers a `MutationObserver` on `document.documentElement` to watch for theme attribute changes. While `destroy` calls `disconnect`, if the developer forgets to call `destroy()` in a modern SPA (e.g. unmounting a React component), the observer is leaked globally.
- **Exact evidence from the repo**: `src/core/thekdatepicker.ts` line 496.
- **Real-world consequence**: Ghost components will pile up in memory across route navigations, continuing to execute `applyAutoTheme()` on detached DOM fragments whenever the document theme changes.
- **What a competent implementation would do instead**: If doing global theme tracking, use a single global observer registry that uses `WeakRef` to trigger updates on active instances, avoiding hard retention.

### 11. CSS Variables Exposed Globally But Hardcoded Internally
- **Severity**: SEV-4: Quality or maintainability problem
- **Why this is bad**: The library injects CSS variables inline on elements based on a JS object (`THEME_TEMPLATES` in `src/core/config-utils.ts`), essentially doing runtime CSS-in-JS without the safety. Overriding these manually in CSS requires `!important` or fighting the JS inline styles.
- **Exact evidence from the repo**: `src/core/thekdatepicker-theme.ts` applies styles directly to `.style` object properties, overriding stylesheets.
- **Real-world consequence**: Consumers trying to theme the picker via standard CSS stylesheets will be intensely frustrated when the component stomps their CSS custom properties with JS-driven inline styles.
- **What a competent implementation would do instead**: Append a lightweight `<style>` tag or strictly rely on CSS classes mapping to predefined custom properties, rather than writing to element `.style`.

### 12. "Framework-Agnostic" Lie
- **Severity**: SEV-4: Quality or maintainability problem
- **Why this is bad**: It claims to be framework-agnostic but requires a target input selector. It replaces the DOM structurally around the input (`mountInputTrigger` wraps the input in a div).
- **Exact evidence from the repo**: `src/core/thekdatepicker.ts` line 440: `parent.insertBefore(wrap, this.input); wrap.appendChild(this.input);`
- **Real-world consequence**: If used in React, Vue, or Angular, mutating the DOM wrapper around the provided input element will cause the virtual DOM to hard-crash on the next render pass, throwing "Node not found" or hierarchy errors.
- **What a competent implementation would do instead**: Mount the picker strictly to an isolated anchor or portal, and position it via `getBoundingClientRect` or floating-ui without modifying the DOM hierarchy of the user-provided input.

# Full Audit

### 1. Repository structure
Scattered but standard for a Vite project. The split between `core/` and `utils/` feels arbitrary since `date-utils.ts` and `config-utils.ts` exist inside `core/`.

### 2. Packaging and distribution
`package.json` correctly defines CJS/ESM exports and types. However, injecting CSS is handled poorly since the build relies on standard Vite CSS extraction. Node tooling will likely choke if not properly configured.

### 3. Public API
The constructor takes a selector string or `HTMLInputElement` and directly modifies its DOM wrapper. The options object is sprawling, with random domain-specific config (like `suspiciousMessage`) muddying an otherwise standard API.

### 4. Date correctness
Severely flawed. Timezone boundaries and DST will easily corrupt the state because local timestamps are used instead of explicit logical dates.

### 5. Rendering architecture
Direct DOM manipulation that rewrites the input's parent hierarchy. This makes it impossible to use safely in a VDOM-based framework without complex wrapper components.

### 6. DOM/event lifecycle
Events are mostly bound/unbound cleanly. However, it relies heavily on native `click` and `keydown` interception directly on the document, which can leak if `destroy()` is omitted.

### 7. Parsing/formatting
Parsing uses a custom, manual token string scanner. It misses a tremendous amount of edge cases and performs string surgery that will easily break on culturally diverse formats.

### 8. Range/constraints/selection logic
`minDate`/`maxDate` logic is present but brittle due to the aforementioned `getTime()` integer comparison issues.

### 9. Accessibility
Basic keyboard support exists, but ARIA attributes are incomplete. The grid lacks `aria-activedescendant`, making keyboard navigation opaque to screen readers.

### 10. Internationalization
Extremely weak. It defaults to English month arrays and relies on native `Intl.DateTimeFormat` for fallbacks, but forces a hardcoded 7-day layout and makes assumptions about standard token alignment across locales.

### 11. Performance
Acceptable for simple use cases. Renders are cheap native DOM updates.

### 12. Error handling
Fails silently or aggressively mutates user input on typing. Unrecoverable states are simply clamped without developer feedback.

### 13. Testing
Decorative and broken. A test is actively failing based on timezones (`tests/integration/thekdatepicker.integration.test.ts`), destroying trust in the suite.

### 14. Documentation
Detailed, but documenting a flawed architecture does not excuse the flaws.

### 15. CI/release hygiene
Includes an npm prepublish script, but no visible GitHub Actions or automation checks.

### 16. Security/dependency risk
Low external dependencies, but its own internal logic is a liability.

### 17. Long-term maintainability
High risk. A complex, brittle custom date parser mixed with manual DOM mutation will turn into a legacy nightmare quickly.

# Edge Cases Most Likely To Break
- Creating a date picker during a DST jump.
- Running the component inside React/Vue.
- Inputting dates rapidly while the parsing mask fights user keystrokes.
- Timezone shifts causing dates to clamp incorrectly.

# Evidence Ledger
- `tests/integration/thekdatepicker.integration.test.ts`: Timezone failing test.
- `src/core/thekdatepicker.ts`: `.getTime()` epoch comparisons, `.style` mutations, DOM hierarchy rewriting (`wrap.appendChild(this.input)`).
- `src/core/date-utils.ts`: `.replace(/\D/g, "")` masking obliteration.
- `src/core/config-utils.ts`: Timestamp range bounding.

# If I Were Blocking This In Code Review
- "BLOCK: Your test suite fails on my machine because you're comparing local `new Date().getTime()` integers across timezone boundaries. Rewrite your tests and the calendar grid to use logical Year/Month/Date tuples or strings."
- "BLOCK: You are physically mutating the DOM hierarchy of the provided input (`parent.insertBefore(wrap, this.input);`). This is a hard violation for any VDOM framework. You must use an absolute positioned portal."
- "BLOCK: Drop the `isSuspiciousDate` feature. Date pickers are not business logic validators. You are polluting the core component."

# Final Sentence
This repository is a textbook example of visual polish completely obscuring fundamentally broken date semantics, rendering it a liability rather than a utility.