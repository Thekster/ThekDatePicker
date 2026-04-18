# AGENTS.md - Agent Instructions

## Project Overview

ThekDatePicker is a browser-first, framework-agnostic date/time picker library with themes, input masking, and calendar popover.

- **Type**: JavaScript/TypeScript library
- **Package Manager**: npm
- **Build**: Vite + TypeScript
- **Testing**: Vitest
- **Linting**: oxlint
- **Formatting**: oxfmt

## Commands

```bash
npm install           # Install dependencies
npm run dev           # Start dev server with showcase
npm test              # Run tests (watch mode)
npm run coverage      # Run tests with coverage
npm run build         # Build for production
npm run build:showcase # Build showcase for GitHub Pages
npm run lint          # Lint code
npm run format        # Check formatting
npm run format:write  # Fix formatting
npm run release:check # Full release validation (lint, format, build, tests)
```

## Project Structure

- `src/` - Source code
  - `core/` - Main library (thekdatepicker.ts, types.ts, etc.)
  - `utils/` - Utility functions
  - `themes/` - CSS theme files
- `dist/` - Built output
- `tests/` - Test files (unit + integration)
- `showcase/` - Demo HTML page
- `showcase-dist/` - Generated GitHub Pages output (do not commit)
- `.github/workflows/` - CI, npm publish, and GitHub Pages deploy workflows

## Key Files

- `src/core/thekdatepicker.ts` - Main class with all functionality
- `src/core/types.ts` - TypeScript types and interfaces
- `src/core/global-options.ts` - Global config management
- `src/core/date-utils.ts` - Date parsing/formatting utilities
- `.oxfmtrc.json` - Formatter config and ignore rules
- `.oxlintrc.json` - Linter config and ignore rules
- `.github/workflows/ci.yml` - Continuous integration workflow
- `.github/workflows/publish.yml` - npm publish workflow
- `.github/workflows/pages.yml` - GitHub Pages showcase deploy workflow

## Important Patterns

- Uses strict input masking with flexible separators
- Theme system supports light/dark/auto modes with custom object overrides
- DateInput type: `Date | string | null | undefined` (no raw numbers - use setDateFromTimestamp for timestamps)
- Option precedence: instance options override global options override defaults
- Browser-only defaults are resolved at instantiation time; SSR/prerendered usage should stay client-only
- All exported functions from `./index.ts` (use named exports)

## Engineering Standards

- **Accessibility**: Adhere to the date-picker dialog pattern used by the current implementation. Use `aria-haspopup="dialog"` on the input, `role="dialog"` on the popover, and `role="grid"` on the calendar day grid. Keep focus restoration and tests aligned with those semantics.
- **Security & CSP**: Do not inject markup from strings for DOM construction. Prefer `document.createElement`, `textContent`, and `appendChild`; when clearing existing containers, prefer `textContent = ''` over `innerHTML = ''`.
- **Input Masking & Paste**: Ensure all input entry points (including the `paste` event) are strictly validated against the format before acceptance. Deferring validation to `blur` is discouraged for critical parsing.
- **Type Safety**: Use proper type guards (e.g., `instanceof HTMLElement`) instead of `as` casting whenever possible to ensure runtime safety in event handling paths.
