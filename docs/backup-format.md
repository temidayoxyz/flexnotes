# Flexnotes backup format

Flexnotes exports and imports JSON backups so your canvas can be backed up or
moved between browsers and devices. This document describes the format for
maintainers and for anyone who wants to generate or read backups
programmatically.

## File naming

`flexnotes-backup-YYYY-MM-DD.json` (the date is the export date, local time).

## Schema (version 1)

```jsonc
{
  "app": "flexnotes",          // literal, used to recognise the file
  "schema": 1,                 // backup envelope schema version
  "exportedAt": "2026-10-26T12:34:56.789Z",  // ISO-8601, informational only
  "document": {
    "version": 1,              // document schema version — must be 1
    "notes": [
      {
        "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301", // stable unique id (string, ≤128 chars)
        "text": "Hello Flexnotes!",                    // plain text, ≤10,000 chars, newlines preserved
        "color": "yellow",     // see the colour table below
        "x": 120,              // world coordinate (number; may be negative)
        "y": -40,
        "width": 220,          // clamped to [140, 1200] on import
        "height": 220,
        "order": 1             // stacking order; higher renders on top
      }
    ],
    "viewport": {
      "panX": 0,               // screen-space pan offset (number)
      "panY": 0,
      "zoom": 1                // clamped to [0.25, 3]
    },
    "colorIndex": 3            // palette position for the next note's colour
  }
}
```

A bare `document` object (without the `app`/`schema`/`exportedAt` envelope) is
also accepted on import.

### Colours

`color` must be one of:

| Key | Value |
| --- | --- |
| `yellow` | `#FFF0A8` |
| `mint` | `#B9F0E5` |
| `lavender` | `#DCCAFF` |
| `peach` | `#FFD5C9` |
| `sky` | `#C9E4FF` |
| `pink` | `#F7CDE2` |
| `green` | `#DDF3D8` |

## Validation and repair rules

Import (`lib/backup/backup.ts`) never trusts the file:

- The file must be valid JSON; an object; and `version`/`schema` must be `1`.
  Anything else is rejected with a specific error message.
- Notes missing a usable string `id` are dropped; duplicate ids are
  de-duplicated (first wins on load, regenerated on import).
- Numeric fields must be finite. Sizes are clamped to `[140, 1200]`; zoom to
  `[0.25, 3]`; unknown colours fall back to `yellow`; non-string text is
  replaced with an empty string; text over 10,000 characters is dropped.
- Nothing from the file is ever executed; note text is rendered as plain text.

### Replace vs merge

The import dialog asks explicitly:

- **Merge** keeps current notes and appends imported ones. Ids that collide
  with existing notes are regenerated; imported notes stack on top
  (`order` continues after the current maximum). The viewport is unchanged.
- **Replace** discards current notes (with a two-click confirmation when notes
  already exist) and adopts the imported canvas. Ids colliding with the
  pre-import canvas are regenerated.

## Storage keys

- `flexnotes.canvas` — the live `document` (same schema as above, without the
  backup envelope).
- `flexnotes.canvas.corrupt` — raw preserved copy of unreadable saved data,
  kept so a future version can attempt recovery.
