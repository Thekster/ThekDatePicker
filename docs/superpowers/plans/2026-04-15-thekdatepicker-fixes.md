# ThekDatePicker Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix layout thrashing, incomplete accessibility, and brittle input masking using modern Web APIs without external dependencies.

**Architecture:** 
- Replace scroll/resize listeners with `ResizeObserver` and `IntersectionObserver`.
- Implement a standalone `FocusTrap` utility for ARIA compliance.
- Refactor input masking to a state-based tokenizer for better caret management and reliability.

**Tech Stack:** TypeScript, Vanilla JS, Vitest.

---

### Task 1: Standalone FocusTrap Utility

**Files:**
- Create: `packages/ThekDatePicker/src/core/focus-trap.ts`
- Test: `packages/ThekDatePicker/tests/core/focus-trap.test.ts`

- [ ] **Step 1: Write the FocusTrap implementation**

```typescript
export class FocusTrap {
  private focusableElements: HTMLElement[] = [];
  private firstFocusable?: HTMLElement;
  private lastFocusable?: HTMLElement;
  private active = false;

  constructor(private container: HTMLElement) {}

  public activate(): void {
    if (this.active) return;
    this.updateFocusableElements();
    this.container.addEventListener('keydown', this.handleKeyDown);
    this.active = true;
  }

  public deactivate(): void {
    if (!this.active) return;
    this.container.removeEventListener('keydown', this.handleKeyDown);
    this.active = false;
  }

  private updateFocusableElements(): void {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.container.querySelectorAll(selector)) as HTMLElement[];
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();
    if (this.focusableElements.length === 0) return;

    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}
```

- [ ] **Step 2: Create unit tests for FocusTrap**
- [ ] **Step 3: Run tests to verify**

Run: `npm test tests/core/focus-trap.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ThekDatePicker/src/core/focus-trap.ts packages/ThekDatePicker/tests/core/focus-trap.test.ts
git commit -m "feat: add standalone FocusTrap utility"
```

---

### Task 2: Observer-Based Positioning

**Files:**
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker.ts`
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker-global.ts`

- [ ] **Step 1: Update thekdatepicker-global.ts to remove viewport listeners**
- [ ] **Step 2: Implement ResizeObserver and IntersectionObserver in thekdatepicker.ts**
- [ ] **Step 3: Update positionPicker to use cached rects and skip redundant writes**
- [ ] **Step 4: Verify performance in showcase or manual test**
- [ ] **Step 5: Commit**

```bash
git add packages/ThekDatePicker/src/core/thekdatepicker.ts packages/ThekDatePicker/src/core/thekdatepicker-global.ts
git commit -m "perf: replace scroll listeners with ResizeObserver and IntersectionObserver"
```

---

### Task 3: ARIA Role Updates & Focus Trap Integration

**Files:**
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker.ts`
- Modify: `packages/ThekDatePicker/tests/integration/thekdatepicker.integration.test.ts`

- [ ] **Step 1: Set role="dialog" and aria-modal="false" on pickerEl**
- [ ] **Step 2: Integrate FocusTrap in open() and close() methods**
- [ ] **Step 3: Implement aria-activedescendant for grid navigation**
- [ ] **Step 4: Update integration tests to verify ARIA roles and focus trapping**
- [ ] **Step 5: Commit**

```bash
git add packages/ThekDatePicker/src/core/thekdatepicker.ts packages/ThekDatePicker/tests/integration/thekdatepicker.integration.test.ts
git commit -m "feat: implement WAI-ARIA dialog pattern and focus trapping"
```

---

### Task 4: Stateful Input Masking

**Files:**
- Modify: `packages/ThekDatePicker/src/core/date-utils.ts`
- Modify: `packages/ThekDatePicker/src/core/thekdatepicker-input.ts`

- [ ] **Step 1: Refactor tokenizer in date-utils.ts to support stateful application**
- [ ] **Step 2: Implement logical caret management in thekdatepicker-input.ts**
- [ ] **Step 3: Update applyMaskToInput to handle partial pastes and auto-separators**
- [ ] **Step 4: Run existing and new input tests**
- [ ] **Step 5: Commit**

```bash
git add packages/ThekDatePicker/src/core/date-utils.ts packages/ThekDatePicker/src/core/thekdatepicker-input.ts
git commit -m "refactor: implement stateful input masking and logical caret tracking"
```

---

### Task 5: Documentation & Cleanup

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add manual CSS import instructions to README.md**
- [ ] **Step 2: Run full test suite**
- [ ] **Step 3: Final commit**

```bash
git add README.md
git commit -m "docs: add CSS import instructions and final cleanup"
```
