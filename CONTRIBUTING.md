# Contributing to Flexnotes

Thanks for your interest in improving Flexnotes! This project is a small,
focused tool: an infinite notepad with local-only persistence. Scope discipline
is a feature — please keep proposals aligned with that.

## Getting started

1. Fork the repository on GitHub.
2. Clone your fork:

   ```bash
   git clone https://github.com/<your-username>/flexnotes.git
   cd flexnotes
   npm install
   ```

3. Create a topic branch:

   ```bash
   git checkout -b my-change
   ```

4. Start the dev server and make your change:

   ```bash
   npm run dev
   ```

## Before you submit

Run the full check suite — CI runs exactly these commands:

```bash
npm run lint       # ESLint (flat config)
npm run typecheck  # TypeScript strict, no emit
npm test           # Vitest unit tests
npm run build      # static export must succeed
```

Guidelines:

- Keep pull requests focused; one bug fix or feature per PR.
- Add or update tests for anything touching `lib/` (coordinate math, storage,
  backups are the highest-risk areas and are pure/testable by design).
- Match the existing code style — TypeScript strict, no `any`, functional
  React components, Tailwind utilities with the design tokens in
  `app/globals.css`.
- Don't introduce new dependencies without discussing the maintenance cost
  first; the app intentionally has a tiny dependency footprint.
- Don't add network calls, analytics, or anything that would send note data
  off the device.

## Reporting bugs and suggesting features

- **Bugs:** open a GitHub issue with the browser/OS, steps to reproduce, what
  you expected, and what happened. If notes were lost, say whether an export
  backup exists.
- **Features:** open an issue describing the problem you're trying to solve
  before building anything large. If it drifts toward collaboration, sync, or
  a general whiteboard, the answer is probably "out of scope" — that's what
  keeps Flexnotes fast and simple.
- **Security:** do not open public issues for security problems; see
  [SECURITY.md](SECURITY.md).

## Code of conduct

Be kind and assume good faith. Keep discussions on the code and the product.
