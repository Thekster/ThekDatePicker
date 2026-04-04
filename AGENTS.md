# AGENTS.md - Agent Instructions

## Project Overview

ThekDatePicker is a framework-agnostic date/time picker library with themes, input masking, and calendar popover.

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
npm run lint          # Lint code
npm run format        # Check formatting
npm run format:write  # Fix formatting
```

## Project Structure

- `src/` - Source code
  - `core/` - Main library (thekdatepicker.ts, types.ts, etc.)
  - `utils/` - Utility functions
  - `themes/` - CSS theme files
- `dist/` - Built output
- `tests/` - Test files (unit + integration)
- `showcase/` - Demo HTML page

## Key Files

- `src/core/thekdatepicker.ts` - Main class with all functionality
- `src/core/types.ts` - TypeScript types and interfaces
- `src/core/global-options.ts` - Global config management
- `src/core/date-utils.ts` - Date parsing/formatting utilities

## Important Patterns

- Uses strict input masking with flexible separators
- Theme system supports light/dark/auto modes with custom object overrides
- DateInput type: `Date | string | null | undefined` (no raw numbers - use setDateFromTimestamp for timestamps)
- Option precedence: instance options override global options override defaults
- All exported functions from `./index.ts` (use named exports)