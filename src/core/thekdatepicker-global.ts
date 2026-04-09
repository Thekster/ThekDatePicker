interface GlobalManagedPicker {
  onGlobalPointerDown(event: PointerEvent): void;
  onGlobalViewportChange(): void;
}

const registeredPickers = new Set<GlobalManagedPicker>();
const scrollListenerOptions = { capture: true, passive: true };

function handleDocumentPointerDown(event: PointerEvent): void {
  for (const picker of registeredPickers) {
    picker.onGlobalPointerDown(event);
  }
}

function handleViewportChange(): void {
  for (const picker of registeredPickers) {
    picker.onGlobalViewportChange();
  }
}

function bindGlobalListeners(): void {
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('scroll', handleViewportChange, scrollListenerOptions);
}

function unbindGlobalListeners(): void {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
  window.removeEventListener('resize', handleViewportChange);
  window.removeEventListener('scroll', handleViewportChange, scrollListenerOptions);
}

export function registerGlobalPicker(picker: GlobalManagedPicker): void {
  if (registeredPickers.size === 0) bindGlobalListeners();
  registeredPickers.add(picker);
}

export function unregisterGlobalPicker(picker: GlobalManagedPicker): void {
  registeredPickers.delete(picker);
  if (registeredPickers.size === 0) unbindGlobalListeners();
}
