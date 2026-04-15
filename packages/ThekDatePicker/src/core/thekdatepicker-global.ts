interface GlobalManagedPicker {
  onGlobalPointerDown(event: PointerEvent): void;
}

const registeredPickers = new Set<GlobalManagedPicker>();

function handleDocumentPointerDown(event: PointerEvent): void {
  for (const picker of registeredPickers) {
    picker.onGlobalPointerDown(event);
  }
}

function bindGlobalListeners(): void {
  document.addEventListener('pointerdown', handleDocumentPointerDown);
}

function unbindGlobalListeners(): void {
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
}

export function registerGlobalPicker(picker: GlobalManagedPicker): void {
  if (registeredPickers.size === 0) bindGlobalListeners();
  registeredPickers.add(picker);
}

export function unregisterGlobalPicker(picker: GlobalManagedPicker): void {
  registeredPickers.delete(picker);
  if (registeredPickers.size === 0) unbindGlobalListeners();
}
