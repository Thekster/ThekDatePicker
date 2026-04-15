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

  public refresh(): void {
    if (this.active) {
      this.updateFocusableElements();
    }
  }

  private updateFocusableElements(): void {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.container.querySelectorAll(selector)) as HTMLElement[];
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

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
