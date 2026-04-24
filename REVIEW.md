# Repository Review: ThekDatePicker

## 1. Verdict

ThekDatePicker presents itself as a framework-agnostic, single-date/date-time picker with strict input masking and themeable styles. While it hits several marks for quality—such as excellent TypeScript strictness, safe DOM manipulation (avoiding `innerHTML`), and clean Vite-based packaging—it fundamentally fails at lifecycle management. It exhibits memory leak risks due to improper cleanup of event listeners and focus traps, uses a naive positioning strategy that will break in complex scrolling layouts, and provides a Vue wrapper that is poorly integrated with Vue's component lifecycle.

The repository is **deceptively acceptable**. It looks clean and well-structured on the surface, but falls apart structurally upon closer inspection of its teardown routines and wrapper design. It is not ready for safe enterprise consumption.

## 2. Executive Damage Report

*   **Overall rating:** 4/10
*   **Production readiness:** Barely / Not ready for external users
*   **Monorepo/Architecture:** 8/10
*   **Vue Wrapper Quality:** 4/10
*   **Type safety:** 9/10
*   **Accessibility:** 7/10
*   **Performance/Memory:** 3/10
*   **Test quality:** 6/10
*   **Maintenance risk:** High

## 3. What It Claims To Be vs What It Actually Is

*   **Claim:** A "framework-agnostic, browser-first single-date/date-time picker with strict input masking."
*   **Reality:** The masking and core parsing are strictly implemented. The build process, packaging, and typings are well-configured.
*   **Claim:** Safe memory lifecycle management and robust popover.
*   **Reality:** The library's `destroy()` and `close()` methods leak memory. It also uses naive absolute positioning for the popover rather than a robust positioning engine like Floating UI.

## 4. Top Findings

### [VERIFIED] Vue Wrapper Memory Leak and Double-Render
*   **Severity:** SEV-1
*   **Status:** VERIFIED
*   **Why this matters:** In `packages/ThekDatePicker-vue/src/index.ts`, `watch` is used with `{ deep: true }` over an array of mapped option props. When options change, it destroys and recreates the entire picker via `recreatePicker()`. Recreating the picker creates new DOM elements, and because `destroy()` leaves lingering events or DOM wrappers in some cases, doing this repeatedly inside a Vue component causes massive DOM churn.
*   **Exact evidence:** `packages/ThekDatePicker-vue/src/index.ts` lines 254-263 (`watch` on props triggering `recreatePicker`).
*   **Real-world consequence:** Changing a prop dynamically in Vue tears down the entire picker and recreates it. If this happens frequently (e.g. minDate changing on a reactive form), it causes massive layout thrashing and eventually leaks memory due to underlying library flaws.
*   **What competent implementation would do instead:** The core library should support updating options dynamically without full recreation, or the wrapper should only watch specific non-destructive props.

### [VERIFIED] Missing Cleanup for `FocusTrap` on Destroy
*   **Severity:** SEV-2
*   **Status:** VERIFIED
*   **Why this matters:** `focusTrap.deactivate()` removes the `keydown` listener, but `destroy()` calls `this.close()`, and `close()` only calls `this.focusTrap.deactivate()`. `destroy()` does not nullify the `focusTrap` reference or adequately free memory.
*   **Exact evidence:** `packages/ThekDatePicker/src/core/thekdatepicker.ts` in `destroy()`.
*   **Real-world consequence:** Stranded focus traps accumulate and persist event listener references across SPA navigations.
*   **What competent implementation would do instead:** Properly dereference instance properties upon class destruction.

### [VERIFIED] Incomplete DOM Teardown in `destroy()`
*   **Severity:** SEV-2
*   **Status:** VERIFIED
*   **Why this matters:** The `unmountInputTrigger()` correctly moves the input back and removes the wrapper, but the `pickerEl` is only removed using `if (this.pickerEl.isConnected) this.pickerEl.remove()`. If the user is unmounting the input's parent dynamically, `isConnected` might be false, leaving the picker stranded in `document.body` if `appendTo` was `document.body`.
*   **Exact evidence:** `packages/ThekDatePicker/src/core/thekdatepicker.ts` in `destroy()`.
*   **Real-world consequence:** Hidden popover nodes accumulating in `document.body` across SPA routes.
*   **What competent implementation would do instead:** Remove the picker DOM node unconditionally if it exists, without guarding by `isConnected`.

### [VERIFIED] Poor Popover Positioning Strategy
*   **Severity:** SEV-2
*   **Status:** VERIFIED
*   **Why this matters:** `positionPicker` uses naive `getBoundingClientRect()` and window scrolls. It does not account for complex stacking contexts, nested scrollable containers, or `z-index` collisions effectively without a robust anchor positioning engine.
*   **Exact evidence:** `packages/ThekDatePicker/src/core/thekdatepicker.ts` inside `positionPicker()`.
*   **Real-world consequence:** Popovers clipping off-screen or detaching from their target anchor inputs inside complex overflow containers or modals.
*   **What competent implementation would do instead:** Use a mature positioning library like `floating-ui` or, at minimum, correct viewport traversal logic.

## 5. Full Audit

*   **Workspace/Monorepo structure:** Excellent. Vite and TypeScript are correctly configured. `sideEffects` and exports are correctly mapped.
*   **Packaging & Bundling:** Solid. UMD, ES modules, and Types are correctly emitted.
*   **Vue Wrapper bridging:** Poor. The wrapper recreates the entire underlying vanilla instance on any prop change, causing severe render churn.
*   **Input behavior & Masking:** Very good. Uses strict separators and robust caret positioning during mask application.
*   **DOM Lifecycle & Memory Leaks:** Flawed. The `destroy()` method fails to nullify internal DOM references (`this.pickerEl`), and Vue wrapper recreation exacerbates this.
*   **Keyboard & Accessibility:** Good. Implements `FocusTrap` and sets `aria-expanded` and `role="dialog"` correctly, though `aria-live` is minimal.
*   **Theming & CSS:** Excellent. Clean CSS variables and a functional theme observer.
*   **Type safety strictness:** Excellent. Little to no `any` casting.
*   **Performance & Layout Thrashing:** Forced synchronous layouts inside `positionPicker` via `getBoundingClientRect()`.
*   **Testing & CI hygiene:** Present, but integration tests for Vue memory leaks or reactive props are lacking.

## 6. Evidence Ledger
*   `packages/ThekDatePicker/src/core/thekdatepicker.ts`
*   `packages/ThekDatePicker-vue/src/index.ts`
*   `packages/ThekDatePicker/package.json`
*   `packages/ThekDatePicker/src/core/thekdatepicker-global.ts`
*   `packages/ThekDatePicker/src/core/focus-trap.ts`

## 7. Blocking Review Comments

> **Vue Wrapper Render Churn:** "Do not recreate the entire `ThekDatePicker` instance on every prop change. This destroys the DOM wrapper, removes event listeners, and reconstructs the popover grid synchronously. You must implement a dynamic option update mechanism in the core library or deeply narrow your watchers."

> **Positioning Engine:** "The popover positioning logic is naive. It relies on `getBoundingClientRect` and basic `window` bounds. This will break in overflow containers. You must use `Floating UI` or a robust positioning strategy."

## 8. Final Sentence
While structurally well-packaged, the library’s naive popover positioning and a Vue wrapper that brute-forces reactivity via constant teardown make it unfit for complex production environments.
