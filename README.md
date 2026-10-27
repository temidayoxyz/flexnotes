# Flexnotes

**Your thoughts, with room to move.**

Flexnotes is a free, open-source **infinite notepad**: sticky notes on an endless,
pannable, zoomable canvas. It runs entirely in your browser — no account, no
server, no setup. Open it and start writing.

> Live app: **https://temidayoxyz.github.io/flexnotes/**

<!-- TODO: replace with an actual screenshot of your canvas
![Flexnotes canvas](docs/screenshot.png)
-->

## Features

- **Infinite canvas** — pan (Space + drag, pan tool, middle-mouse drag,
  two-finger touch) and zoom (mouse wheel, Ctrl/⌘ + scroll pinch, toolbar
  buttons, 25%–300%) with a stable focal point and a live coordinate readout.
- **Sticky notes** — create with sensible non-overlapping placement, edit
  in place, drag anywhere, resize from the corner, recolour from a soft pastel
  palette, duplicate, and delete with undo.
- **Auto-saved locally** — your canvas (notes, positions, viewport) is saved to
  your browser's localStorage as you work and restored when you return.
- **Private by design** — nothing ever leaves your device. No accounts, no
  analytics, no network calls after the app loads.
- **Search** — press `Ctrl/⌘ + K` to search note text and jump straight to a note.
- **Backups** — export the whole canvas as JSON and import it again (merge or
  replace, with explicit confirmation before anything is overwritten).
- **Keyboard friendly** — shortcuts for every common action; press `?` for the
  in-app reference.
- **Tidy up** — "Tile view" arranges all notes into a neat grid.

## Usage

| Action | How |
| --- | --- |
| Create a note | `New note` button or press `N` |
| Edit a note | Click it; `Esc` finishes editing |
| Move a note | Drag it (when not editing) |
| Resize a note | Drag the corner handle while selected |
| Recolour / duplicate / delete | `⋯` button on the note, or `Delete` key |
| Pan the canvas | `Space` + drag, pan tool (hand icon), or middle-mouse drag |
| Zoom | Mouse wheel, `Ctrl/⌘ + scroll` (pinch), toolbar −/+ |
| Fit all notes | `Ctrl/⌘ + 0`, crosshair button, or "Fit All Notes" |
| Undo delete | `Ctrl/⌘ + Z` or the toast's `Undo` button |

The full list lives in the app under the `?` button.

## Development

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/temidayoxyz/flexnotes.git
cd flexnotes
npm install

npm run dev        # start the dev server at http://localhost:3000
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (strict)
npm test           # Vitest unit tests (single run)
npm run test:watch # Vitest in watch mode
npm run build      # production static export into out/
```

The production build is a fully static export (`output: 'export'` in
`next.config.ts`) — the app is plain HTML/CSS/JS plus localStorage and needs no
server at runtime.

## Deployment (GitHub Pages)

Deployment is automated with GitHub Actions: every push to `main` runs lint,
typecheck, tests and the static build, then publishes `out/` to GitHub Pages
via the official `actions/deploy-pages` flow (see
`.github/workflows/deploy.yml`).

Project pages are served from a repository subpath, so CI sets
`NEXT_PUBLIC_BASE_PATH=/flexnotes`, which feeds Next's `basePath`/`assetPrefix`.
Local development needs no base path.

To enable Pages once per repository: **Settings → Pages → Source: GitHub
Actions**. (The first deployment may also enable this automatically if you
trigger the workflow from the Actions tab.)

## Privacy & storage

- Notes live in your browser's **localStorage** under the key `flexnotes.canvas`,
  scoped to this browser and origin. They are never transmitted anywhere.
- Clearing your browser data (or using private/incognito mode) deletes your
  notes. Notes do **not** sync between browsers or devices.
- Use **Canvas actions → Export backup** (top-left menu) to save a JSON file,
  and **Import backup** to restore it. The file format is documented in
  [`docs/backup-format.md`](docs/backup-format.md).
- If saved data can't be read, Flexnotes preserves the raw copy under
  `flexnotes.canvas.corrupt` and starts fresh rather than destroying it.

## Known limitations

- Plain text only — no rich text, images, or markdown (by design).
- Mouse wheel zooms the canvas; trackpad two-finger scroll therefore also
  zooms. Pan with Space + drag, the pan tool, or touch gestures.
- Notes don't sync across devices; localStorage is per browser profile.
- Resize is pointer-only; there is no keyboard resize.
- Performance depends on the browser and note count; the canvas is spatially
  unlimited but rendering is not virtualized (comfortable for hundreds of notes).
- Not an installable PWA — the app works offline once loaded, but there is no
  service worker caching.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to
get started, and [SECURITY.md](SECURITY.md) for reporting security issues.

## Licence

Released under the [MIT Licence](LICENSE).
