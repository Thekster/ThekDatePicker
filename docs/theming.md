# Theming

ThekDatePicker supports multiple theme modes and custom theme objects.

## Built-in Themes

### Light Theme

```ts
createDatePicker("#my-input", {
  theme: "light",
});
```

### Dark Theme

```ts
createDatePicker("#my-input", {
  theme: "dark",
});
```

### Auto Theme

Automatically detects the page theme from the `data-theme` attribute:

```ts
createDatePicker("#my-input", {
  theme: "auto",
  reactiveTheme: true,  // Listen for theme changes
  themeAttribute: "data-theme",  // Default attribute
});
```

HTML:
```html
<html data-theme="dark">
  <!-- Page is in dark mode -->
</html>
```

## Custom Theme Object

Override specific theme tokens:

```ts
createDatePicker("#my-input", {
  theme: {
    primary: "#e11d48",
    bgSurface: "#fff1f2",
    border: "#fecdd3",
  },
});
```

### Theme Tokens

| Token | Description | Default (light) |
|-------|-------------|-----------------|
| primary | Accent color for selected/active | #3b82f6 |
| primaryStrong | Hover/active accent shade | #2563eb |
| primaryContrast | Text on primary backgrounds | #ffffff |
| bgSurface | Input/popover background | #ffffff |
| bgPanel | Hover panel background | #f3f4f6 |
| border | Border color | #d1d5db |
| textMain | Main text color | #1f2937 |
| textMuted | Secondary text color | #6b7280 |
| shadow | Popover box-shadow | 0 4px 6px -1px rgba(0,0,0,0.1) |
| radius | Border radius | 0.375rem |
| fontFamily | Component font | system-ui, sans-serif |
| controlHeight | Input/button height | 2.25rem |

## Global Theme Defaults

Set theme globally for all pickers:

```ts
import { setGlobalOptions } from "thekdatepicker";

setGlobalOptions({
  theme: "auto",
  reactiveTheme: true,
  themeAttribute: "data-theme",
});
```

## Instance Theme Override

Change theme after creation:

```ts
const picker = createDatePicker("#my-input", { theme: "light" });

// Later, switch to dark
picker.setTheme("dark");

// Or use custom theme
picker.setTheme({
  primary: "#8b5cf6",
});
```

## CSS Custom Properties

The library uses CSS custom properties for runtime theming. You can override in your own CSS:

```css
:root {
  --thekdp-primary: #3b82f6;
  --thekdp-bg-surface: #ffffff;
  --thekdp-border: #d1d5db;
}
```

## Styling Hooks

Additional CSS classes for custom styling:

| Class | Element |
|-------|---------|
| `.thekdp-input-wrap` | Input wrapper |
| `.thekdp-input` | Input element |
| `.thekdp-trigger-btn` | Calendar trigger button |
| `.thekdp-popover` | Popover container |
| `.thekdp-calendar` | Calendar grid |
| `.thekdp-time` | Time picker |
| `.thekdp-day` | Day cell |
| `.thekdp-day-selected` | Selected day |
| `.thekdp-day-today` | Current day |
| `.thekdp-month-select` | Month dropdown |
| `.thekdp-year-select` | Year input |

## Theme Precedence

1. Instance `setTheme()` (runtime override)
2. Instance `theme` option (at creation)
3. Global options `theme` (via setGlobalOptions)
4. Default (empty object = light theme tokens)