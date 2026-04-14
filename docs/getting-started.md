# Getting Started

## Installation

```bash
npm install thekdatepicker
```

## Quick Start

### 1. Import CSS

```ts
import 'thekdatepicker/css/base.css';
```

CSS is not injected by the JavaScript entrypoint. Import it explicitly.

Or in HTML:

```html
<link rel="stylesheet" href="https://unpkg.com/thekdatepicker/dist/css/base.css" />
```

### 2. Create a Date Picker

```html
<input id="my-date" type="text" />
```

```ts
import { createDatePicker } from 'thekdatepicker';

const picker = createDatePicker('#my-date', {
  format: 'YYYY-MM-DD',
  enableTime: true,
  timeFormat: 'hh:mm A'
});
```

### 3. Use the API

```ts
// Set a date
picker.setDate(new Date('2024-01-15'));

// Get the current date
const date = picker.getDate();
console.log(date); // Date object or null

// Clear the value
picker.clear();

// Open/close the popover
picker.open();
picker.close();

// Destroy when done
picker.destroy();
```

## Browser CDN Usage

```html
<link rel="stylesheet" href="https://unpkg.com/thekdatepicker/dist/css/base.css" />
<input id="my-date" type="text" />
<script src="https://unpkg.com/thekdatepicker/dist/thekdatepicker.umd.cjs"></script>
<script>
  ThekDatePicker.createDatePicker('#my-date');
</script>
```

## Next Steps

- [API Reference](api-reference.md) - Full method and options documentation
- [Theming](theming.md) - Customize colors and styles
- [Format Tokens](api-reference.md#format-tokens) - Date/time formatting options
