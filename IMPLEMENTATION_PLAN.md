# Flexnotes — Implementation Plan

**Tagline:** Your thoughts, with room to move.

A clean, modern, open-source infinite notepad. Client-side web app with browser-based
persistence, deployed as a static site on GitHub Pages.

## Discovery summary (Phase 0)

| Item | Finding |
| --- | --- |
| Working directory | `D:\Codebase\flexnotes` — empty (only `.mimosa/` plugin cache), not a git repo |
| Node.js | v25.2.1 |
| npm | 11.6.2 |
| Git | 2.55.0.windows.5 |
| Git identity | `Temidayo XYZ <temidayoxyz@gmail.com>` (global config, used as-is) |
| GitHub account | `temidayoxyz` (gh CLI authenticated, `repo` + `workflow` scopes) |
| Target repository | `temidayoxyz/flexnotes` — does not exist yet; will be created public |
| Default branch | `main` |

## Architecture

- **Framework:** Next.js (App Router) + React + TypeScript (strict) + Tailwind CSS.
- **Rendering:** The page is a single client component tree (`"use client"`). Static export
  (`output: 'export'`) produces a fully static `out/` directory; no server runtime is used.
- **Canvas model:** A transformed-DOM canvas. Notes are ordinary HTML elements positioned in
  *world coordinates*; the canvas surface is a single wrapper with
  `transform: translate(...) scale(...)`. The viewport is `{ panX, panY, zoom }`. This keeps
  note text selectable/editable (no `<canvas>` bitmap rendering).
- **Coordinate conversions** live in `lib/canvas/viewport.ts` as pure, unit-tested functions:
  - `screenToWorld(screen, viewport, rect)`
  - `worldToScreen(world, viewport, rect)`
  - zoom-at-focal-point math (`zoomAtPoint`) keeps the world point under the cursor fixed.
- **Storage:** `localStorage` behind a storage abstraction (`lib/storage/`). The data model is
  small and text-only (one JSON document: notes array + viewport + schema version), so
  localStorage is sufficient and reliable; IndexedDB would add complexity without benefit.
  Writes are debounced; loads are validated against a versioned schema. Malformed data is
  discarded safely with a user-visible notice. The abstraction isolates the UI from the
  storage engine so it can be swapped later.
- **Backup:** JSON export/import in `lib/backup/` with schema validation, replace-or-merge
  choice, and destructive-action safeguards.
- **State:** React `useReducer`-style state in the top-level canvas store hook. No global
  state library. High-frequency drag updates mutate DOM via refs; persisted state updates are
  batched/debounced.
- **Icons:** lucide-react. **Font:** system font stack (zero runtime/external font dependency).
- **Testing:** Vitest + React Testing Library + jsdom for unit/component tests (coordinate
  math, placement, storage, backup validation, search, reducer logic). Playwright is not
  included in the MVP toolchain (deliberate scope decision — see risks).

## GitHub Pages strategy

- `next.config.ts` reads `NEXT_PUBLIC_BASE_PATH`; CI sets it to `/<repo-name>` so the static
  export works at `https://temidayoxyz.github.io/flexnotes/`. Local dev runs without a base path.
- Deployment via GitHub Actions (official `actions/deploy-pages` flow) triggered on push to
  `main`. Workflow: install → lint → typecheck → test → build static export → upload artifact →
  deploy. Least-privilege permissions (`contents: read`, `pages: write`, `id-token: write`).
- A custom `not-found` page is included; no client-side routing beyond the single page.

## Phase boundaries

1. **Phase 1 — Foundation & visual shell.** Scaffold, design tokens, dotted canvas, floating
   toolbars, brand mark, new-note button. Commit: `chore: initialize Flexnotes application`
2. **Phase 2 — Canvas geometry & navigation.** Pan (mouse/touch/trackpad), zoom (controls,
   wheel with focal-point stability), fit-to-content. Commit: `feat: implement infinite canvas interactions`
3. **Phase 3 — Sticky-note lifecycle.** Create/edit/drag/resize/recolor/delete/duplicate,
   selection & stacking, contextual menu, undo delete. Commit: `feat: add sticky note editing and controls`
4. **Phase 4 — Persistence.** Versioned schema, debounced saves, validated restore, error
   surfacing. Commit: `feat: persist canvas in browser storage`
5. **Phase 5 — Search, shortcuts, portability.** Local search with navigate-to-note, keyboard
   shortcuts + help sheet, JSON export/import. Commit: `feat: add canvas backup and local search`
6. **Phase 6 — Quality pass.** A11y, responsive, error states, tests expanded, cleanup.
   Commit: `test: add interaction and persistence coverage`
7. **Phase 7 — Documentation.** README/CONTRIBUTING/SECURITY/CHANGELOG/LICENSE.
   Commit: `docs: document setup usage and contribution`
8. **Phase 8 — Pages automation.** Commit: `ci: deploy static export to GitHub Pages`
9. **Phase 9 — Production verification.** Test the live site end-to-end.

## Canvas interaction rules

- **Drag on empty canvas or hold Space + drag, or two-finger touch:** pan.
- **Drag a note header/body (when not editing):** move the note.
- **Wheel/trackpad scroll:** pan. **Ctrl/Cmd + wheel or pinch:** zoom at pointer.
- **Click a note:** select; **double-click or Enter:** edit; **Esc:** finish editing.
- Editing a textarea never moves the canvas; text selection inside notes never starts a drag.

## Storage decision

Single JSON document under key `flexnotes:v1`:

```jsonc
{
  "version": 1,
  "notes": [{ "id": "uuid", "text": "", "color": "yellow", "x": 0, "y": 0, "width": 220, "height": 220, "order": 0 }],
  "viewport": { "panX": 0, "panY": 0, "zoom": 1 }
}
```

Schema validation on load; unknown fields ignored; invalid values fall back to defaults
without discarding valid notes. Quota/unavailable storage surfaces a visible (non-blocking)
error banner; saves never silently report success.

## Key technical risks

1. **Pointer-event correctness under zoom** — mitigated by pure, tested conversion functions
   and pointer-capture based drag state machines with `pointercancel` handling.
2. **Base-path asset 404s on Pages** — mitigated by `NEXT_PUBLIC_BASE_PATH` plumbed through
   `basePath`/`assetPrefix` and verified against a local static serve of `out/` before deploy.
3. **localStorage quota/corruption** — mitigated by schema validation, try/catch on every
   access, debounced writes, and visible error states.
4. **IME/textarea quirks** — plain `<textarea>` with uncontrolled-ish value handling and
   cursor-safe updates; composition events respected (no per-keystroke state resets).
5. **No browser-level E2E in MVP** — Playwright deliberately deferred to keep the dependency
   footprint small; coordinate math and persistence logic are covered by Vitest, and the live
   site is verified manually in Phase 9.

## Acceptance criteria

See `§13 Definition of done` in the product brief. In short: functional infinite notepad,
clean modern UI, pan/zoom, full note lifecycle, local persistence, search, shortcuts,
export/import, passing checks, static export, complete docs, meaningful commits pushed,
GitHub Pages deployment verified live.
