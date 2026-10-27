# Changelog

All notable changes to Flexnotes are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-10-26

First public release.

### Added

- Infinite canvas: pointer/touch panning, wheel & pinch zoom with stable focal
  point (25%–300%), fit-to-content, tile view, dotted grid, coordinate readout.
- Sticky notes: create with spiral placement and cycling pastel palette,
  in-place text editing, drag, resize, recolour, duplicate, delete with undo.
- Local persistence: versioned localStorage schema, debounced saves, validated
  hydration with repair, corrupt-data backup copy, storage error banners.
- Portability: JSON export/import (merge or replace with confirmation);
  documented backup format.
- Local search (`Ctrl/⌘ + K`) with go-to-note.
- Keyboard shortcuts with in-app help panel (`?`).
- Static export build and GitHub Pages deployment workflow.
- Documentation: README, CONTRIBUTING, SECURITY, backup format.
