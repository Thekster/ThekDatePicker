# Theming

ThekDatePicker supports multiple theme modes and custom theme objects.

## Built-in Themes

### Light Theme

```ts
createDatePicker('#my-input', {
  theme: 'light'
});
```

### Dark Theme

```ts
createDatePicker('#my-input', {
  theme: 'dark'
});
```

### Auto Theme

Automatically detects the page theme from the `data-theme` attribute:

```ts
createDatePicker('#my-input', {
  theme: 'auto',
  reactiveTheme: true, // Listen for theme changes
  themeAttribute: 'data-theme' // Default attribute
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
createDatePicker('#my-input', {
  theme: {
    primary: '#e11d48',
    bgSurface: '#fff1f2',
    border: '#fecdd3'
  }
});
```

### Theme Tokens

| Token           | Description                      | Default (light)                            |
| --------------- | -------------------------------- | ------------------------------------------ |
| primary         | Accent color for selected/active | #2f7fe4                                    |
| primaryStrong   | Hover/active accent shade        | #1f6bcc                                    |
| primaryContrast | Text on primary backgrounds      | #ffffff                                    |
| bgSurface       | Input/popover background         | #ffffff                                    |
| bgPanel         | Hover panel background           | #ebf0f7                                    |
| border          | Border color                     | #d8dee6                                    |
| textMain        | Main text color                  | #1d2838                                    |
| textMuted       | Secondary text color             | #6b7a90                                    |
| shadow          | Popover box-shadow               | 0 0.875rem 1.875rem rgba(13, 21, 33, 0.18) |
| radius          | Border radius                    | 0.375rem                                   |
| fontFamily      | Component font                   | inherit                                    |
| controlHeight   | Input/button height              | 2rem                                       |

## Global Theme Defaults

Set theme globally for all pickers:

```ts
import { setGlobalOptions } from 'thekdatepicker';

setGlobalOptions({
  theme: 'auto',
  reactiveTheme: true,
  themeAttribute: 'data-theme'
});
```

## Instance Theme Override

Change theme after creation:

```ts
const picker = createDatePicker('#my-input', { theme: 'light' });

// Later, switch to dark
picker.setTheme('dark');

// Or use custom theme
picker.setTheme({
  primary: '#8b5cf6'
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

| Class                       | Element                 |
| --------------------------- | ----------------------- |
| `.thekdp-input-wrap`        | Input wrapper           |
| `.thekdp-input`             | Input element           |
| `.thekdp-trigger-btn`       | Calendar trigger button |
| `.thekdp-popover`           | Popover container       |
| `.thekdp-days`              | Calendar grid           |
| `.thekdp-time`              | Time picker             |
| `.thekdp-day-cell`          | Day cell                |
| `.thekdp-day-cell-selected` | Selected day            |
| `.thekdp-day-cell-today`    | Current day             |

## Theme Precedence

1. Instance `setTheme()` (runtime override)
2. Instance `theme` option (at creation)
3. Global options `theme` (via setGlobalOptions)
4. Default (empty object = light theme tokens)
