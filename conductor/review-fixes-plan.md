# ThekDatePicker Review Fixes Implementation Plan

**Goal:** Address SEV-2 positioning failure in nested containers, aggressive intersection threshold, focus trap performance, and zero-config CSS injection as identified in the principal engineer review.

**Architecture:**
- **Positioning:** Re-implement global capture-based scroll listeners in `thekdatepicker-global.ts` to detect ancestor movement. Use the existing layout cache in `positionPicker` to prevent thrashing.
- **Accessibility:** Optimize `FocusTrap` by moving DOM queries to a manual `refresh()` method called only on re-renders. Set a lenient `rootMargin` for the `IntersectionObserver`.
- **UX/DX:** Provide a `injectBaseStyles()` utility that embeds the CSS directly into the JS bundle for true zero-config usage.

**Tech Stack:** TypeScript, Vanilla JS, Vitest.

---

### Task 1: Focus Trap Optimization (SEV-4)

**Files:**
- Modify: `packages/ThekDatePicker/src/core/focus-trap.ts`
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker.ts`

- [ ] **Step 1: Add refresh() to FocusTrap**
  - Add a public `refresh()` method that calls `updateFocusableElements()`.
  - Remove `updateFocusableElements()` call from `handleKeyDown`.
- [ ] **Step 2: Call refresh() in ThekDatePicker**
  - Call `this.focusTrap.refresh()` at the end of the `render()` method in `thekdatepicker.ts`.
- [ ] **Step 3: Verify**
  - Ensure keyboard navigation still loops correctly in existing tests.

### Task 2: Intersection Observer Lenience (SEV-4)

**Files:**
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker.ts`

- [ ] **Step 1: Update IntersectionObserver config**
  - Change `IntersectionObserver` initialization to include `rootMargin: '50px'`.
- [ ] **Step 2: Verify**
  - Picker stays open even if partially clipped by container.

### Task 3: Global Scroll Positioning (SEV-2)

**Files:**
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker-global.ts`
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker.ts`

- [ ] **Step 1: Re-add scroll listener to global registry**
  - Add `window.addEventListener('scroll', handleViewportChange, { capture: true, passive: true })` to `bindGlobalListeners`.
  - Update `unregisterGlobalPicker` to remove it.
  - Update `GlobalManagedPicker` interface to include `onGlobalViewportChange`.
- [ ] **Step 2: Implement onGlobalViewportChange in ThekDatePicker**
  - Add `onGlobalViewportChange` handler that calls `positionPicker()` throttled by `requestAnimationFrame`.
- [ ] **Step 3: Add regression test for nested scrolling**
  - Create a test case where the input is inside a scrollable container and verify `positionPicker` is called on container scroll.

### Task 4: Zero-Config CSS Injection (SEV-3)

**Files:**
- Create: `packages/ThekDatePicker/src/core/base-css.ts`
- Create: `packages/ThekDatePicker/src/core/inject-styles.ts`
- Modify: `packages/ThekDatePicker/src/index.ts`
- Modify: `README.md`

- [ ] **Step 1: Embed CSS string**
  - Manually (or via script) copy `base.css` content into `base-css.ts` as an exported constant.
- [ ] **Step 2: Implement injectBaseStyles utility**
  - Create a function that adds a `<style id="thekdp-styles">` tag if not present.
- [ ] **Step 3: Export from index**
  - Export `injectBaseStyles` from the main entry point.
- [ ] **Step 4: Update Documentation**
  - Add a section to `README.md` showing how to use `injectBaseStyles()` for zero-config setup.

### Task 5: Final Verification

- [ ] **Step 1: Run all tests**
- [ ] **Step 2: Lint and format**
