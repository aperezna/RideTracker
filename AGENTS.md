# Code Review Rules

## TypeScript
- Keep TypeScript strict and avoid `any`.
- Prefer small pure functions for domain logic.
- Keep database access isolated under `src/core/db`.

## Testing
- Cover deterministic domain behavior with Vitest.
- Keep tests independent and runnable with `npm run test`.

## Next.js
- Keep configuration typed and compatible with Next.js App Router.
