# velodesign showcase

A component showcase website for `velodesign`, in the spirit of the Ant Design / shadcn/ui
component sites: a searchable, categorized sidebar, a live interactive preview and prop
reference for every component, a landing page introducing the library, and a theme builder
(`/theme`) for customizing its color palette live.

It's its own small Velotype/veloserver app living inside the `velodesign` repo - a real
consumer of the library, not part of the published `@velotype/velodesign` package. It reuses
the component metadata already defined for the internal Explorer dev tool
(`../tests/test_modules/explorer-schema.tsx`) so every live example only has one source of
truth; `src/data/docs.ts` adds the showcase-only prose (descriptions, prop tables) on top.

## Running locally

```sh
deno task dev
```

This bundles the client app and starts the server on `http://localhost:4000`. Re-run
`deno task dev` after making changes (there's no file watcher/hot-reload).

To use a different port:

```sh
PORT=8080 deno task dev
```

## Building and serving separately

```sh
deno task bundle   # writes ./build/main.js (+ sourcemap)
deno task serve     # serves the already-built ./build/ directory
```

Useful when you want to rebuild once and then run the server long-lived (e.g. under a process
manager), rather than always bundling on start.

## Hosting remotely

The showcase is a plain Deno HTTP server (`server.ts`) - it runs anywhere the Deno runtime is
available (a VM, a container, etc.). To deploy:

1. Copy (or `git clone`) the repo to the host, or build a container image that does.
2. `cd showcase && deno task bundle` to produce `build/main.js`.
3. Run `deno run --allow-read --allow-net --allow-sys --allow-env server.ts`, setting:
   - `PORT` - the port to listen on (default `4000`)
   - `HOST` - the hostname/address to bind (default `0.0.0.0`)
4. Put it behind a reverse proxy (nginx, Caddy, etc.) for TLS if it's public-facing.

There's no build-time environment coupling beyond the `velodesign` source tree itself (`../src`)
and the Explorer's story data (`../tests/test_modules/explorer-schema.tsx`) - both are read at
bundle time, not at runtime, so the deployed artifact is just `build/main.js` + `server.ts`.

## Layout

```
showcase/
  server.ts              veloserver App/Router - serves the SPA shell + /build/* static assets
  src/
    main.tsx              client entry point
    app-shell.tsx          persistent header + searchable sidebar + routed content area
    data/docs.ts            component metadata: descriptions + prop tables, layered on the
                             Explorer's `stories` array
    pages/
      home.tsx               landing page: hero, stats, category grid
      component-page.tsx      one component's live preview + prop table + prev/next nav
      theme-builder.tsx        color-palette editor: edits apply live to the whole site and
                               persist to localStorage; exports a Theme.injectStyles() snippet
      not-found.tsx           404 page
  build/                  bundled output (gitignored, produced by `deno task bundle`)
```

## Theme builder

`/theme` lets a visitor pick every color role `ThemeOptions` (from `../src/theme.ts`) exposes,
independently for light and dark mode. Every edit:

- applies immediately across the whole site (`:root`) and to a light/dark preview strip on the
  page itself, using `setThemeOnSelector(selector, options, resetSheet: true)` - the
  `resetSheet` flag (added to `../src/theme.ts` alongside this feature) is needed because
  `setStylesheet` only applies a given selector's styles once by default, so re-theming live
  requires explicitly asking it to replace the previous stylesheet
- is saved to `localStorage` (`vtd-showcase-custom-theme`) and reloaded on boot (`main.tsx`
  calls `loadSavedTheme()` before `Theme.injectStyles()`), so a customization survives a refresh
- is copyable as a ready-to-paste `Theme.injectStyles({...})` call, for taking the palette into
  your own app

"Reset to defaults" clears both the live theme and the saved copy.

Routing is client-side (`History.changeLocation` + `popstate`/`locationchange`, the same
mechanism `NavLink`/`PageSelector` use elsewhere in `velodesign`) - the server always returns
the same HTML shell for `/` and `/components/:name`, and the client picks the right page from
`location.pathname` once it boots. That's also why a full page load/refresh on a deep link
(e.g. `/components/button`) works correctly rather than 404ing.
