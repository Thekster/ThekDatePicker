# ThekDatePicker Fixes Design (Approach 1)

**Date:** 2026-04-15
**Status:** Draft
**Goal:** Address layout thrashing, incomplete ARIA/accessibility, and brittle input masking in ThekDatePicker using modern Web APIs without external dependencies.

---

## 1. Performance: Observer-Based Positioning
Replace heavy global scroll/resize listeners with a performance-first observer pattern to eliminate layout thrashing.

### 1.1 `ResizeObserver` Integration
- Attach a `ResizeObserver` to both the `input` and the `pickerEl`.
- **Logic:** Trigger `positionPicker()` only when dimensions change.
- **Optimization:** Store the last measured `rect` of the input and picker. If the observer fires but the delta is zero (or below a threshold), skip the DOM write.

### 1.2 `IntersectionObserver` Integration
- Attach an `IntersectionObserver` to the `input`.
- **Logic:** If the input is scrolled out of view (e.g., in a nested container), automatically call `close()` on the picker.
- **Benefit:** Prevents "ghost" popovers floating over other content when their trigger is hidden.

### 1.3 Removal of Synchronous Listeners
- Remove `window.addEventListener('scroll', ...)` and `window.addEventListener('resize', ...)`.
- Remove the `requestAnimationFrame` loop in `onGlobalViewportChange`.

---

## 2. Accessibility: WAI-ARIA & Focus Management
Bring the library into full compliance with the WAI-ARIA Authoring Practices Guide (APG) for Date Pickers.

### 2.1 Standalone `FocusTrap` Utility
- **File:** `src/core/focus-trap.ts`
- **Responsibility:** 
    - Identify focusable elements (buttons, inputs, grid cells) within a container.
    - Listen for `Tab` / `Shift+Tab` and loop focus within the container.
    - Provide `activate()` and `deactivate()` methods.

### 2.2 ARIA Role Updates
- **Popover:** Change to `role="dialog"`.
- **Attributes:** Add `aria-modal="false"`, `aria-label="Choose Date"`.
- **Input:** Maintain `role="combobox"`, but ensure `aria-controls` (picker ID) and `aria-expanded` (true/false) are strictly updated during state changes.

### 2.3 Grid & Navigation
- **`aria-activedescendant`**: Use on the grid container to point to the `id` of the currently "focused" date cell.
- **Roving Tabindex:** Ensure only the "active" date cell (focused or selected) has `tabindex="0"`, while others have `tabindex="-1"`.

---

## 3. Input: Stateful Masking & Tokenizer
Replace regex-heavy masking with a predictable, state-based tokenizer.

### 3.1 `TokenizedMask` Utility
- Pre-parse the `format` (e.g., `YYYY-MM-DD`) into a sequence of `Token` (dynamic) and `Literal` (static separator) objects.
- **Logic:** 
    - `applyMaskToInput`: Iterate through tokens and "consume" digits from the raw input string. 
    - Automatically insert literals (separators) when the preceding token is complete.
    - Handle partial pastes (e.g., `12-12-`) by matching characters to the token sequence.

### 3.2 Logical Caret Management
- Track caret position by "logical index" (which character of which token the cursor is at).
- **Benefit:** Prevents the caret from jumping unpredictably when separators are auto-inserted or when the user deletes a character.

---

## 4. Architecture & Testing

### 4.1 File Changes
- **New:** `src/core/focus-trap.ts`
- **Modify:** 
    - `src/core/thekdatepicker.ts`: Integrate observers and focus trap; remove old listeners.
    - `src/core/thekdatepicker-input.ts`: Implement stateful masking.
    - `src/core/date-utils.ts`: Update `parseDateByFormat` to use the new tokenizer.

### 4.2 Testing Plan
- **Integration:** 
    - Verify `role="dialog"` is present on the popover.
    - Verify `Tab` key loops focus within the picker.
    - Verify `positionPicker` is NOT called during rapid scrolling if dimensions are stable.
- **Unit:** 
    - Test `applyMaskToInput` with various partial and malformed date strings.
    - Test `FocusTrap` with different DOM structures.

---

## 5. Documentation
- Update `README.md` to clarify that `base.css` must be imported manually for ESM/UMD usage, providing a zero-config example snippet.
