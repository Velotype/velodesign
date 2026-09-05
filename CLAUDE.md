# velodesign — component style guide

`@velotype/velodesign` is a UI component library written against `@velotype/velotype` (a custom JSX runtime — not React; see gotchas below). This file documents the conventions every existing component follows, so a new component is indistinguishable in style from the rest rather than a bolted-on second style. Read this before adding or modifying a component. When in doubt, open the most similar existing component and match it exactly — this file explains *why* those patterns exist so you can judge edge cases, not just cite them.

## Layout

- `src/<name>.tsx` (or `.ts` for non-JSX helpers like `theme.ts`, `history.ts`, `strings.ts`) — one file per component/module.
- `src/index.ts` — the only public entrypoint (`deno.json`'s `exports` field points here). Every new component's value + attrs type (+ any other exported types) get added here, in the same flat `import` list + single `export { ... }` block style already there. Nothing is usable from outside the package unless it's re-exported here.
- `tests/test_modules/<name>.tsx` — a manual "gallery" page per component (see Testing below).
- `tests/basic_tests.test.ts` — a small number of real Astral (headless Chrome) assertions, not one per component.

## Component shape: `FunctionComponent` vs `Component` class

`FunctionComponent<AttrsType> = (attrs, children) => RenderableElements` — stateless, no lifecycle. **Default to this.** Used by `Button`, `RadioButton`, `Checkbox`, `Toggle`, `TextBox`, `Textarea`, `Select`, `Link`, `Badge`, `Card`, `Alert`, `Tooltip`, `Spinner`, `Divider`, `Breadcrumbs`, `Pagination`, `Navbar`, `Sidebar`, `TimeAgo`, `Icon`/`I`.

`class extends Component<AttrsType>` — only when you need one of:
- **A persistent, imperatively-controllable DOM handle** the component must reference again later (`Modal` builds its `<dialog>` once in the *constructor* and stores it in a private field so `showModal()`/`close()`/`setConfirmDisabled()` can act on it directly; `Menu` does the same for its `<details>` element). When you need this, build the JSX tree in the constructor and have `render()` just `return this.#element` — don't rebuild it in `render()`.
- **Global event listeners that must be added/removed with the component's lifecycle** (`mount()`/`unmount()`). `PageSelector` listens for `popstate`/`locationchange` to know when to reselect a page; `NavLink` listens for the same two events to know when to recompute whether it's the active link; `Menu` listens for document `click` to close itself on an outside click. Always add in `mount()`, remove the *same* bound listener reference in `unmount()` (store it as a class field / arrow-function property, not a fresh closure each time, or `removeEventListener` won't match it).
- **Internal state that changes after construction and must trigger a re-render.** Call `this.refresh()` when it changes (e.g. `Tabs` calls it after updating `#activeKey` on a tab click). `refresh()` unmounts and deletes the whole subtree and re-runs `render()` from scratch — **this means any `ElementHandle`/DOM reference you held from before the refresh is now stale**; if you're writing an Astral test that clicks something and triggers a refresh, re-query every selector you need *after* the click rather than reusing a handle captured before it (`NavLink`'s test actually failed this way once — reusing a pre-click handle to read a post-click attribute threw; the fix was re-querying with `page.$(...)` after the click, same as the panel re-query `Tabs`'s test already did from the start).
- **Swapping a sub-tree in place without a full refresh**, when only part of the component changes: `this.replaceChild(oldChild, newChild)` (`TextEditableField` uses this to swap its view/edit halves). Prefer `refresh()` unless you specifically need to avoid re-rendering sibling content.

## Attrs types

Every component's attrs type is named `<Name>AttrsType` (or, for a couple of older ones, `<Name>AttrTypes` / `Type<Name>AttrsType` — check the neighbor you're copying) and is built from these shared mixins, **folded into the type alias itself**, not repeated at each usage site:

```ts
export type FooAttrsType = {
    // ...component-specific fields...
} & IdAttr & StylePassthroughAttrs & ChildrenAttr   // only include ChildrenAttr if the component accepts children
```

Then the component signature is just `FunctionComponent<FooAttrsType>` / `Component<FooAttrsType>` — **not** `FunctionComponent<FooAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr>` repeated inline. (This *used* to be written the inline-repeated way throughout the package; it was refactored to the consolidated form in commit `7c0ee34`. If you ever see the old inline-intersection form or an `as HTMLXElement` cast on a `passthroughAttrsToElement` call while editing a file, that file hasn't been touched yet — fold it in as part of your change rather than leaving it inconsistent.)

- `IdAttr` — `{ id?: string }`
- `StylePassthroughAttrs` — `{ class?: string, style?: StyleAttrType }`
- `ChildrenAttr` — `{ children?: RenderableElements }`

None of these three give you arbitrary attribute passthrough (no `aria-*`, no `data-*`) — a custom component only accepts exactly what its own `XAttrsType` declares. If you pass `aria-current` (or anything else) to `<Button>`, that's a type error unless `ButtonAttrsType` explicitly declares it. Native tags (`<div>`, `<a>`, `<li>`, ...) accept the full `HTMLAttributes`/ARIA set directly — this only bites you when wrapping a *custom* component.

## `passthroughAttrsToElement`

Every component's root element gets wrapped in `passthroughAttrsToElement<T>(<element/>, attrs)` — this is what actually applies `id`/`class`/`style` from the attrs onto the rendered DOM node. Always give it the **explicit generic type argument**, never `as T` on the result:

```ts
return passthroughAttrsToElement<HTMLButtonElement>(<button ...>, attrs)   // correct
return passthroughAttrsToElement(<button ...>, attrs) as HTMLButtonElement // don't do this
```

The generic is declared `<T extends HTMLElement>`, but TypeScript's structural typing means `SVGSVGElement` and `HTMLDetailsElement` satisfy it fine too (verified empirically — `passthroughAttrsToElement<SVGSVGElement>(...)` type-checks) — you don't need a cast even for non-`HTMLElement`-shaped roots like `Icon`'s `<svg>` or `Menu`'s `<details>`.

## Styling

One `setStylesheet(cssText, "vtd/ComponentName")` call per component. `setStylesheet` (from `@velotype/velotype`) already dedupes internally by its key argument — calling it on every render is *safe* — but the prevailing style in this package still guards it with a module-level boolean (`let areFooStylesMounted = false`) to skip even building the template string after the first mount, e.g.:

```ts
let areFooStylesMounted = false
// ...
if (!areFooStylesMounted) {
    areFooStylesMounted = true
    setStylesheet(`...`, "vtd/Foo")
}
```
For a `Component` class, do this once in the constructor (see `Menu`), not in `render()`.

Conventions inside the CSS itself:
- Class names are all `vtd-<component>` / `vtd-<component>-<part>` / `vtd-<component>-<modifier>` (e.g. `vtd-btn`, `vtd-btn-primary`, `vtd-tabs-tab-active`). Never a bare unprefixed class.
- **Never hardcode a color.** Everything reads CSS custom properties from `theme.ts`'s generated palette (light/dark aware via `[data-theme="light"|"dark"]`):
  - `--text` / `--text-alt` — main text color and its inverse.
  - `--background` (+ `-1` through `-9`, `-alt`) — a light↔dark mix ramp anchored on the page background color; use e.g. `var(--background-1)` for a very subtle hover tint, `var(--background-4)`/`var(--background-5)` for borders/dividers, `var(--background-9)` for a near-inverse accent.
  - `--primary`, `--secondary`, `--warning`, `--accent` — each with the same `-1`..`-9` mix ramp (white→color→black in light mode, inverted in dark). `-2` is a typical hover tint, `-6` a typical active/pressed tint, `-3` a typical "light fill" (badges, alerts).
- Prefer `color: inherit` / `currentColor` over a fixed color when a component is meant to sit inside arbitrarily-colored context (e.g. `Spinner`'s ring uses `currentColor` for exactly this reason — it's used both standalone and inside `Button`'s color-varying `type`s; a first draft hardcoded `var(--primary)`, which would have made the spinner nearly invisible against a primary-colored `Button` — caught and fixed before it ever shipped).

## The `XThemeOptions` escape hatch

A handful of components need a small piece of glyph/icon-ish content with no baked-in icon-font dependency: `ButtonThemeOptions.spinner`, `ModalThemeOptions.closeSymbol`, `AlertThemeOptions.dismissSymbol`, `TextFormFieldOptions.check`/`.xmark`/`.edit` (note: this one predates the `XThemeOptions` naming and doesn't have "Theme" in its name — a known inconsistency, not a pattern to copy the *name* of, just be aware it exists). Each is an exported, mutable object of `FunctionComponent<EmptyAttrs>` defaults that a consumer can override wholesale (`ButtonThemeOptions.spinner = () => <MyIcon/>`) to reskin that one piece across every instance, without needing a per-instance prop. Add one of these when a component needs a small overridable visual (not for anything structural).

## Native-element wrapping, not reimplemented widgets

`RadioButton`/`Checkbox`/`Toggle` wrap a real (visually hidden) `<input type="radio"|"checkbox">`; `TextBox`/`Textarea` wrap real `<input>`/`<textarea>`; `Select` wraps a real `<select>`; `Menu` wraps native `<details>`/`<summary>`. None of these reimplement keyboard handling, focus management, or form participation from scratch — the browser gives all of that away for free. When you need a new form control or disclosure widget, look for the native HTML element that already does most of the job before reaching for a hand-rolled ARIA pattern. This does mean accepting the native element's limitations as a documented trade-off rather than solving them with more JS — e.g. `Tooltip` is CSS-only `:hover`/`:focus-within` (no JS positioning library, so it can't reposition to stay on-screen near a viewport edge), and `Menu`'s native `<details>` doesn't animate open/closed. Fixing those is a real, separate, bigger investment — don't build it speculatively as part of an unrelated task.

## `@velotype/velotype` JSX gotchas

These are non-obvious and have each caused a real bug in this package at least once:

1. **`{condition && <jsx/>}` renders the literal text `"false"` (or `"0"`) if `condition` is falsy and not `undefined`.** `RenderableElements` includes `BasicTypes = string | bigint | number | boolean` as directly renderable, so a boolean/number `&&` short-circuit doesn't vanish the way it does in React — it prints. This bit `Breadcrumbs`'s separator (`index < items.length - 1 && <span/>` printed `"false"` after the last crumb). Safe pattern: only use `{x && <jsx/>}` when `x`'s type is `SomeType | undefined` (e.g. `attrs.header?: RenderableElements` — `undefined && X` short-circuits to `undefined`, which *is* silently skipped). For a genuine boolean condition, or anything that could be `0`/`""`, use a ternary with `null` for the false branch: `{condition ? <jsx/> : null}`.
2. **No raw `<svg>`/`<path>` JSX tags.** `tsx-core.ts` explicitly documents this: the generic `<HTML tag="...">` escape hatch "does not support `<svg>` or `<math>`". For inline vector art, either register it through `icon.ts`'s `registerIcon`/`<I i="key"/>` (which builds the SVG manually via `document.createElementNS`), or use the exported `<SVG innerHTML="...">` component, or — often simplest — fake it with pure CSS (`border`/`clip-path`/`transform:rotate`), which is what `Checkbox`'s checkmark, `RadioButton`'s/`Toggle`'s dot, and `Select`'s chevron all do instead of touching SVG at all.
3. **A custom component only forwards attrs its own `XAttrsType` declares** (see Attrs types above) — don't assume passing an arbitrary native attribute through a wrapped component will work; add it to the attrs type first, or drop down to the native tag directly if it's a one-off.
4. **`refresh()` on a `Component` remounts its whole subtree** — see the `Component` class section above for the stale-`ElementHandle` implication when testing.

## Testing & showcase harness

Every component gets the same fan-out, even though not every component gets dedicated assertions:

1. `src/<name>.tsx` + `src/index.ts` export (always).
2. `tests/test_modules/<name>.tsx` — a "gallery" page rendering every documented state (disabled/checked/each `type`/etc.) twice, side by side, in `data-theme="light"` and `data-theme="dark"` containers, wrapped in `<TestModulePage>` (adds the "Home page" link + dark-mode toggle), calling `Theme.injectStyles()` and `setThemeOnSelector(...)` on both container ids at module load. Copy the closest existing gallery module's boilerplate rather than writing it from scratch.
3. `tests/deno.json` — one `"bundle-<name>"` task: `deno bundle ./test_modules/<name>.tsx --output ./build/<name>.js --sourcemap=linked` (note: `--sourcemap` requires an explicit value — `linked`/`inline`/`external` — under current Deno; a bare boolean flag errors).
4. `tests/base_server.ts` — add `<name>` to the `setOfModules` array (nothing else in that file needs to change; routing/script-tag serving is already generic over that list).
5. `tests/test_modules/showcase.tsx` — a short section alongside the other components, for a combined at-a-glance view.
6. `tests/basic_tests.test.ts` gets new `itWrap(...)` assertions **only** for components with real interactive/stateful behavior worth regression-testing (state that changes on click, a value that updates, an open/closed toggle) — not for every component. Purely visual/static ones (`Badge`, `Card`, `Divider`, `Breadcrumbs`, `Navbar`, `Sidebar`, `Spinner`) are gallery-only, no assertions.

Running the bundler: use `deno task bundle-<name>` **one at a time**. Passing multiple task names, or a glob like `'bundle*'`, to a single `deno run`/`deno task` invocation has silently only run the first one before — don't trust a "ran clean" result from a multi-name invocation without checking every module's file actually got a fresh timestamp.

### Verification checklist for a new/changed component

1. `deno check src/index.ts` (and any test files you touched) — catches attrs-type/generic mistakes immediately.
2. `cd tests && deno task bundle-<name>` (and `bundle-showcase` if you added a showcase section) — one task per invocation.
3. `deno task test` (from repo root) — runs the full Astral suite; check for individual `ok`/`FAILED` lines per test, not just the final summary line (it can read `0 passed | 0 failed` even when every individual step passed — a pre-existing cosmetic quirk of how the test runner tallies when the suite calls `Deno.exit(0)`).
4. A broader headless-Chrome smoke pass hitting the new gallery page(s) directly and checking for zero `console`/`pageerror` events is worth doing for anything with real interaction, beyond just the handful of `basic_tests.test.ts` assertions — write a small throwaway script using `@astral/astral`'s `launch()` + `startAppServer` from `tests/base_server.ts` (see recent git history for the shape; nothing this specific is checked into the repo).
5. For anything with non-trivial CSS/layout (a new positioning trick, a windowed list, an open/closed state), take an actual screenshot (`page.screenshot()` → `Deno.writeFile(...)`) and look at it in both themes before calling it done. This is the only check that catches rendering-level mistakes `deno check`/automated assertions can't see by construction — e.g. `Breadcrumbs`'s stray literal `"false"` text (gotcha #1 above) was invisible to every other check and only showed up in a screenshot.
