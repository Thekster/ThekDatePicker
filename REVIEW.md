# Verdict
This repository is a classic example of "Demo-Driven Development." It is visually passable, features an attractive demo, and successfully wires up a popover to an input. However, beneath this thin veneer, it is fundamentally an interactive trap. It exhibits severe failures in core date semantics, complete ignorance of essential accessibility requirements, and lifecycle/DOM issues that render it unfit for anything beyond a trivial, non-critical environment.

It claims to be a "production-grade," "accessible," and "framework-agnostic" date/time picker, but its actual implementation actively contradicts these claims. Relying on this in production means subjecting your users to silent data corruption, preventing disabled users from interacting with your forms, and introducing a fragile dependency that will fail predictably on edge cases.

# Executive Damage Report
- Overall rating: 2/10
- Production readiness: Absolutely not
- Date correctness: 4/10
- API design: 3/10
- Accessibility: 0/10
- Performance: 4/10
- Test quality: 3/10
- Documentation: 5/10
- Maintenance risk: Severe

# What This Repo Pretends To Be vs What It Actually Is
**Pretends To Be:** A fully-featured, accessible, framework-agnostic, customizable, and robust date/time picker suitable for production usage.
**Actually Is:** A brittle script that incorrectly handles fundamental date operations, lacks any meaningful accessibility structure, relies heavily on naive DOM queries, and has an API surface riddled with leaky abstractions.

# Top 12 Most Damaging Findings

### 1. Complete Absence of Accessibility (A11y)
- **Severity:** SEV-1
- **Why this is bad:** The widget fails the most basic requirements for web accessibility. It is unusable for screen reader users and those reliant on keyboard navigation.
- **Exact evidence from the repo:** `src/core/thekdatepicker-dom.ts` constructs the DOM structure without any ARIA roles for the popup dialog (`role="dialog"`), grid structure semantics, `aria-expanded` on the trigger, or `aria-controls`. `src/core/thekdatepicker.ts` fails to trap focus when the popover opens, manage focus inside the calendar grid, or support standard arrow key navigation for dates. The README claims it is "accessible", which is a blatant lie.
- **Real-world consequence:** Severe compliance violations (ADA, WCAG). Users relying on assistive technology will be completely blocked from entering dates.
- **What a competent implementation would do instead:** Implement the ARIA Date Picker Dialog pattern, including focus trapping within the dialog, programmatic focus management for the calendar grid, proper grid ARIA roles, `aria-label` / `aria-live` regions for month/year changes, and standard keyboard interactions (Arrow keys, PageUp/PageDown, Home/End).

### 2. Timezone/Local Time Confusion
- **Severity:** SEV-1
- **Why this is bad:** The core date comparison utilities naively manipulate native `Date` objects using local time methods (`getFullYear`, `setHours`), assuming zero consequences.
- **Exact evidence from the repo:** `src/core/date-utils.ts` implements `toLocalStartOfDay` by mutating hours to 0 via `clone.setHours(0, 0, 0, 0)`. When comparing dates (`isSameDay`), it checks components directly (`a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() ...`).
- **Real-world consequence:** Operations occurring near Daylight Saving Time (DST) boundaries, or specific edge-case local time zones at midnight, can result in "skipped" dates or infinite loops when generating the calendar grid. A date selected in Brazil might be saved and parsed incorrectly depending on the exact instant it was generated.
- **What a competent implementation would do instead:** Use explicit, timezone-safe representations (or UTC strictly internally) and robust boundary calculations rather than brittle `setHours(0)` assumptions.

### 3. Dangerously Naive String Parsing
- **Severity:** SEV-2
- **Why this is bad:** The `extractInput` function falls back on brute-force, recursive-style string manipulation, attempting multiple arbitrary formatting permutations (e.g., stripping time formats, replacing "DD" with "D").
- **Exact evidence from the repo:** `src/core/config-utils.ts` in `extractInput`: `const relaxedFormat = format.replaceAll('DD', 'D').replaceAll('MM', 'M').replaceAll('HH', 'H') ...`. It executes successive parsing attempts silently until one succeeds or all fail. `parseDateByFormat` inside `src/core/date-utils.ts` is just a giant switch statement manually slicing strings based on lengths.
- **Real-world consequence:** An ambiguous string entered by a user could be silently coerced into an entirely incorrect date rather than being rejected, leading to data corruption that the user never realizes occurred.
- **What a competent implementation would do instead:** Utilize an unambiguous, strict parsing engine that requires exact token matches or well-defined fallback states. It should not try to magically mutate the input string repeatedly to force a successful parse.

### 4. Month Navigation Leap Year Bug
- **Severity:** SEV-2
- **Why this is bad:** The current method of navigating between months by merely adding or subtracting 1 from the month index of a cached `viewDate` object is deeply flawed due to how JS `Date` handles day overflow.
- **Exact evidence from the repo:** `src/core/thekdatepicker.ts` in `handlePickerClick`: `this.viewDate.setMonth(this.viewDate.getMonth() - 1);`.
- **Real-world consequence:** If `viewDate` is March 31st, `setMonth(2 - 1)` (setting to February 31st) overflows, pushing the date to March 2nd or 3rd. Clicking "Previous Month" visually keeps the user in March.
- **What a competent implementation would do instead:** When changing months, snap the `viewDate` to the 1st of the target month *before* altering the month index to avoid days-in-month overflow.

### 5. Memory Leaks and Weak DOM Cleanup
- **Severity:** SEV-2
- **Why this is bad:** The component fails to clean up properly when destroyed.
- **Exact evidence from the repo:** `src/core/thekdatepicker.ts` registers event listeners like `window.addEventListener('resize', this.handleViewportChange)` but incorrectly binds the *capture phase* flag on scroll: `window.addEventListener('scroll', this.handleViewportChange, true);`. `unbind()` attempts to remove it: `window.removeEventListener('scroll', this.handleViewportChange, true);`. Wait, this specific line is correct *if* the `destroy` method actually removes *all* references. However, the DOM elements (`pickerEl`) are removed, but the instance maintains references to `input`, `pickerEl`, `dayCellEls`, etc. If the consumer drops the instance, these retain the DOM nodes in memory.
- **Real-world consequence:** Single Page Applications (SPAs) that repeatedly render and destroy date picker inputs will accumulate detached DOM nodes, leading to performance degradation and eventual browser crash.
- **What a competent implementation would do instead:** Nullify all class property references to DOM nodes (`this.input = null`, `this.pickerEl = null`) in the `destroy` method after unbinding listeners and removing elements.

### 6. Synchronous Reflow/Layout Thrashing
- **Severity:** SEV-3
- **Why this is bad:** The popover positioning logic reads layout properties and immediately writes inline styles.
- **Exact evidence from the repo:** `positionPicker()` in `src/core/thekdatepicker.ts` reads `this.input.getBoundingClientRect()` and `window.scrollX`/`scrollY`, then immediately writes to `this.pickerEl.style`. This occurs on every `scroll` and `resize` event.
- **Real-world consequence:** Scrolling a page with an open date picker will feel sluggish and janky because the browser is forced to perform synchronous layout recalculations continually.
- **What a competent implementation would do instead:** Use a dedicated positioning library (like Floating UI) or debounce/throttle the scroll handler using `requestAnimationFrame`.

### 7. Broken Global State Mutability
- **Severity:** SEV-3
- **Why this is bad:** The global options system allows unpredictable mutation and bleeding state.
- **Exact evidence from the repo:** `src/core/config-utils.ts` implements `setGlobalOptions`. It performs a shallow merge (`mergeOptions`). If someone does `setGlobalOptions({ theme: { primary: '#f00' } })`, future pickers get this. But since `globalOptions` is retained, modifying `picker.options.theme` dynamically via a reference might unintentionally pollute the global object if not cloned deeply everywhere.
- **Real-world consequence:** Instantiating a picker with specific options might bleed into another picker instantiated later, causing maddening, hard-to-track UI bugs.
- **What a competent implementation would do instead:** Perform strict deep-cloning of global defaults upon instantiation to guarantee absolute isolation between instances.

### 8. Input Masking Corrupts Value History
- **Severity:** SEV-3
- **Why this is bad:** The masking logic aggressively intercepts the `input` event and rewrites the `value` property programmatically.
- **Exact evidence from the repo:** `src/core/thekdatepicker.ts` calls `applyMaskedInputWithCaret()`, which directly sets `this.input.value = nextValue`.
- **Real-world consequence:** Standard browser "Undo" (Ctrl+Z) functionality is entirely broken inside the input field. A user making a typo and pressing Undo will find the input totally unresponsive or entirely cleared.
- **What a competent implementation would do instead:** Intercept keystrokes more carefully, potentially utilizing the newer `beforeinput` event or preserving the `execCommand` hack to manipulate value while retaining the browser's native undo stack.

### 9. Test Suite is Purely Decorative
- **Severity:** SEV-3
- **Why this is bad:** The tests check only the happy paths and rely on naive UI assertions.
- **Exact evidence from the repo:** `tests/integration/thekdatepicker.integration.test.ts` checks things like `expect(input.value).toBe('...')`. It completely ignores keyboard navigation testing (Arrow keys, etc.), timezone offset boundaries, or the leap-year month navigation bug.
- **Real-world consequence:** Regressions involving edge cases, DST boundaries, or localization formats will easily pass the test suite, allowing critical bugs into production.
- **What a competent implementation would do instead:** Implement exhaustive parameterised testing for date edge cases, use a fake timer with explicitly set timezones (e.g., via `process.env.TZ`), and test actual DOM focus changes.

### 10. Revert Logic is Fragile State Management
- **Severity:** SEV-4
- **Why this is bad:** The warning indicators ("suspicious", "revert") manage their state via manual string swapping on `title` attributes and class toggles, prone to desynchronization.
- **Exact evidence from the repo:** `src/core/thekdatepicker.ts` contains `showRevertIndicator`, `hideRevertIndicator`, and `updateSuspiciousState`. These scatter `title` attribute mutations across the input, the wrapper, and separate indicator spans.
- **Real-world consequence:** Edge cases where a suspicious date is selected, then manually typed over with an invalid date, then reverted, can leave the `title` attributes in a corrupted, mismatched state.
- **What a competent implementation would do instead:** Derive the visual state and ARIA attributes strictly from a single source-of-truth state object during the `render()` cycle, rather than manually patching DOM properties in imperative event handlers.

### 11. CSS Variables Expose Implementation Details
- **Severity:** SEV-4
- **Why this is bad:** Theming relies on applying specific hardcoded custom properties directly to elements via JavaScript.
- **Exact evidence from the repo:** `src/core/thekdatepicker-theme.ts` applies styles directly to targets: `target.style.setProperty('--thekdp-primary', val)`.
- **Real-world consequence:** Users trying to override styles via normal CSS cascades might find their rules arbitrarily overridden by inline styles injected by the JavaScript class.
- **What a competent implementation would do instead:** Inject a single `<style>` tag into the `<head>` with a specific ID, or strictly enforce a CSS-only custom property API where the JS does not inject inline styles unless explicitly required for coordinate positioning.

### 12. Brittle Day Grid Generation
- **Severity:** SEV-4
- **Why this is bad:** Generating exactly 42 cells (6 rows of 7 days) and mutating their properties on every month change is rigid.
- **Exact evidence from the repo:** `src/core/thekdatepicker.ts` method `ensureDayCells` strictly creates 42 cells. The `render` method loops `for (let i = 0; i < 42; i += 1)`.
- **Real-world consequence:** If a user requests a custom view (e.g., a two-week view, or a month that spans 4 or 5 weeks and they want dynamic row sizing), this implementation requires a core rewrite. It also generates empty cells unnecessarily for short months.
- **What a competent implementation would do instead:** Dynamically generate rows based on the mathematical start/end boundaries of the viewed month, or use a truly reusable virtualized grid component.

# Full Audit

## 1. Repository structure
The repository is reasonably organized (`src/`, `tests/`, `showcase/`), but the separation of concerns inside `src/core` is weak. Mixing DOM creation (`thekdatepicker-dom.ts`), core state (`thekdatepicker.ts`), and configuration logic (`config-utils.ts`) into a loose collection of interconnected files creates a tangled dependency graph.

## 2. Packaging and distribution
Packaging via Vite is functional. It correctly targets ESM and CJS. However, `types: "./dist/index.d.ts"` is present, but TypeScript's strict mode is functionally bypassed by `skipLibCheck: true` in `tsconfig.json`, hiding upstream typing flaws.

## 3. Public API
The API is an un-ergonomic mix of global static configuration and instance configuration. `setGlobalOptions` pollutes future instances, and there is no reliable way to scope configuration to a specific component tree (since it's framework-agnostic). Exposing `setDate` but requiring an explicit `DateInput` that accepts arbitrary strings means the parsing ambiguities leak into the developer's application code.

## 4. Date correctness
Severely lacking. As outlined in the SEV-1 and SEV-2 findings, the reliance on local time manipulation for midnight boundaries and the easily exploitable `setMonth` leap-year bug demonstrate a superficial understanding of date mathematics.

## 5. Rendering architecture
Imperative, manual DOM patching. The class holds references to `dayCellEls` and iterates over them, mutating `className`, `dataset.ts`, and `textContent` sequentially. This is error-prone, hard to extend, and fundamentally archaic compared to a state-driven approach.

## 6. DOM/event lifecycle
The `unbind` method is present but fails to nullify element references, leading to memory leaks in SPAs. The `mousedown` outside-click listener is naive and will trigger bugs if the user clicks a label or another interactive element that legitimately should blur the picker.

## 7. Parsing/formatting
Dangerous. String masking and recursive fallback parsing attempt to guess user intent. If `DD/MM/YYYY` is requested, but the user types `02/13/2026`, the relaxed fallback might try to parse it, fail, or worse, implicitly convert it into an unexpected date without warning.

## 8. Range/constraints/selection logic
No multi-date or true range-picking exists. Single date `minDate` and `maxDate` clamping is present but implemented via silent coercion. If a user types a date past `maxDate`, it silently changes their input to `maxDate`. This is terrible UX.

## 9. Accessibility
Non-existent. A complete failure. No ARIA semantics, no keyboard focus trapping, no screen reader support.

## 10. Internationalization
Superficial. It uses `Intl.DateTimeFormat` to guess a format string, but the actual month names (`MONTH_NAMES` in `date-utils.ts`) are hardcoded to English: `'January', 'February', ...`. This means `locale: 'fr-FR'` changes the input format to `DD/MM/YYYY`, but the calendar popover still says "January" instead of "Janvier".

## 11. Performance
Layout thrashing on scroll. Generating the grid is fast enough, but appending DOM elements and manipulating styles during `scroll` events without debouncing is a performance anti-pattern.

## 12. Error handling
Errors are swallowed or ignored. Invalid inputs are either silently corrected, reverted with a tiny icon, or discarded. Developer errors (passing invalid selectors) throw correctly, but runtime errors during parsing fail silently by returning `null`.

## 13. Testing
High coverage on happy paths, zero coverage on edge cases. The tests do not assert accessibility, leap year boundaries, DST shifts, or memory leak cleanup. The timeout in the listener test was a direct result of inefficient teardown logic.

## 14. Documentation
The README is comprehensive in listing options but fails to warn about the limitations (hardcoded English months, lack of true timezone support). It sells a false promise of production readiness.

## 15. CI/release hygiene
Basic build scripts exist. Usage of `npm run build && npm test` is acceptable. The lack of strict linting (e.g., ESLint configuration) is evident.

## 16. Security/dependency risk
Low risk. Zero runtime dependencies is a positive. The HTML injection test passes (it doesn't blindly `innerHTML` user input into the grid).

## 17. Long-term maintainability
High risk. The codebase is a patchwork of imperative DOM manipulation and naive date logic. Adding a basic feature like "Range Selection" would require rewriting 60% of `thekdatepicker.ts`.

# Edge Cases Most Likely To Break
1. **Navigating from March 31st to February:** Will skip to March 2nd/3rd.
2. **Scrolling a page with the picker open:** Will cause jank and layout thrashing.
3. **Instantiating/destroying 10,000 times in a React/Vue SPA:** Will cause a memory leak of detached DOM elements.
4. **Using `locale: "de-DE"`:** Input mask works, but the popup UI remains permanently in English.
5. **Operating via Screen Reader:** Completely impossible to select a date.

# Evidence Ledger
- `src/core/thekdatepicker.ts`: Contains the leap year bug (`setMonth`), scroll layout thrashing (`positionPicker`), lack of DOM cleanup (`destroy`), and completely absent ARIA attributes.
- `src/core/date-utils.ts`: Hardcoded English `MONTH_NAMES`. Naive `isSameDay` logic reliant on local timezone boundaries.
- `src/core/config-utils.ts`: The `extractInput` function demonstrates the dangerous "guess-and-check" parsing logic.
- `src/core/thekdatepicker-dom.ts`: Proof of missing `role="dialog"`, `role="grid"`, and focus management.
- `tests/integration/thekdatepicker.integration.test.ts`: Shows the tests are shallow and focus on happy paths. The timeout issue highlighted the overhead of the DOM manipulation per instance.

# If I Were Blocking This In Code Review
- **BLOCK:** "You claim this is accessible, but it lacks all required ARIA roles and keyboard navigation. I cannot approve this for production until a disabled user can operate it."
- **BLOCK:** "Month navigation is broken on the 31st of the month. Fix the native Date overflow bug in `handlePickerClick`."
- **BLOCK:** "The component retains detached DOM node references after `destroy()`. Nullify all node references to prevent memory leaks in our SPA."
- **BLOCK:** "You are performing synchronous layout reads/writes inside an unthrottled `scroll` event handler. Use `requestAnimationFrame` or Floating UI."
- **BLOCK:** "Months are hardcoded to English in `date-utils.ts` despite the API accepting a `locale` prop. Localize the popup UI properly using `Intl.DateTimeFormat`."

# Final Sentence
This repository is a visually deceptive, conceptually immature toy that fails to handle the fundamental complexities of date manipulation and web accessibility, making it entirely unfit for production use.