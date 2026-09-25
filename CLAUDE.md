# velodesign — component style guide

`@velotype/velodesign` is a UI component library written against `@velotype/velotype` (a custom JSX runtime — not React; see gotchas below). This file documents the conventions every existing component follows, so a new component is indistinguishable in style from the rest rather than a bolted-on second style. Read this before adding or modifying a component. When in doubt, open the most similar existing component and match it exactly — this file explains *why* those patterns exist so you can judge edge cases, not just cite them.

## Layout

- **`src/<category>/<name>.tsx`** — one file per component, in the folder for its category. The
  categories are the showcase's, and they are not decorative: a component's folder and its position
  in the showcase sidebar come from the same fact, so the two cannot drift. When you add a
  component, its story's `group` in `tests/test_modules/explorer-schema.tsx` and its folder must
  agree.

  | Folder | Holds |
  |---|---|
  | `typography/` | Heading, Text, Paragraph, Icon |
  | `layout/` | Stack, Grid |
  | `form/` | Button, Checkbox, Select, TextBox, the text form fields … |
  | `navigation/` | NavLink, Breadcrumbs, Navbar, Sidebar, TableOfContents, Menu, Steps, PageSelector |
  | `feedback/` | Alert, Toast, Tooltip, Spinner, Progress, Skeleton, Empty |
  | `overlays/` | Modal, Drawer, Popover, Popconfirm, ContextMenu, Command |
  | `data-display/` | Badge, Card, Table, DataTable, AsyncDataTable, CodeBlock, Calendar, Tree, Resizable … |
  | `data-entry/` | DatePicker, Slider, Combobox, Upload, Rate, Form |
  | `charts/` | LineChart, AreaChart, BarChart, PieChart, Gauge, Sparkline |
  | `core/` | **Not a category.** Cross-cutting infrastructure imported by components in several categories, so it belongs to none of them: `utilities.ts`, `theme.ts`, `history.ts`, `strings.ts`, `license.ts`, `search-highlight.tsx`, `styles.ts`, `dom-lifecycle.ts`, and the two barrels `velotype.ts` / `jsx-runtime.ts` - **every velotype import in the package goes through those two**, for reasons in *The bundle size is measured, not asserted* below. |

  Two placements are judgement calls rather than showcase facts: `PageSelector` and `Resizable`
  have no story at all, so they went to `navigation/` (client-side routing) and `data-display/`
  (a layout container). Giving them stories is a real gap worth closing.

  **`Icon` lives in `typography/`, and there is no `utility/` category.** An icon here is a glyph:
  `1em` tall, `vertical-align:middle`, drawn in `currentcolor`. It sits in a line of text and
  inherits from it exactly as a letter does, so it belongs beside `Heading`/`Text`/`Paragraph`
  rather than in a category of one - which is what `utility/` had become.

- `src/index.ts` — the only public entrypoint (`deno.json`'s `exports` field points here) and the
  only file at the root of `src/`. Every new component's value + attrs type (+ any other exported
  types) get added here, in the same flat `import` list + single `export { ... }` block style
  already there. Nothing is usable from outside the package unless it's re-exported here.
- `tests/test_modules/<name>.tsx` — a manual "gallery" page per component (see Testing below).
  These stay flat: they are pages served by name, not components.
- **Internal modules live beside the components they serve**, not in `core/`, when only one
  category uses them: `data-display/data-table-view.tsx` is shared by the two tables, and
  `charts/chart-common.ts` + `charts/chart-frame.ts` by the six charts. Neither is re-exported.
- **A component lives in the file its own name predicts**, kebab-cased: `RadioButton` in
  `radio-button.tsx`, `DateTimeRangePicker` in `date-time-range-picker.tsx`. The gallery pages in
  `tests/test_modules/` use the same stems, which are also their URLs and their `bundle-<stem>`
  task names, so all four agree.

  Two deliberate exceptions:
  - **A file named for its primary component may also hold that component's close variants** -
    `overlays/modal.tsx` has `Modal` and `ButtonModal`, `charts/line-chart.ts` has `LineChart` and
    `AreaChart`, `form/text-form-field.tsx` has `TextFormField` plus its non-editable and editable
    siblings. Splitting those would be three files to read to understand one idea.
  - **A module that isn't a component is named for what it does**, not for an export:
    `core/strings.ts` holds `LocalizedString`/`S`/`T`, and `core/utilities.ts`, `core/theme.ts`,
    `charts/chart-common.ts` and the rest follow the same rule.

  **A component's CSS class prefix is its own name, kebab-cased** - `RadioButton` emits
  `vtd-radio-button`, `TableOfContents` emits `vtd-table-of-contents`, and the `setStylesheet` key
  is the PascalCase name. Sub-parts and modifiers extend that prefix
  (`vtd-radio-button-input`, `vtd-button-primary`).

  This was not always so: fifteen prefixes were squashed or abbreviated - `vtd-btn`, `vtd-cb`,
  `vtd-r-btn`, `vtd-tg`, `vtd-toc`, `vtd-datatable`, `vtd-datetimerange` and the rest - and an
  earlier note here called fixing them a breaking change to be avoided. Pre-1.0 there is nothing to
  break, and an abbreviation a consumer cannot guess from the component's name is worse than a long
  class. 478 occurrences were renamed in one pass; the ordering matters if it is ever redone, since
  `vtd-btn` is a substring of `vtd-r-btn` and `vtd-code` of `vtd-codeblock`.

  **Exported names carry their component's prefix when the bare noun would be ambiguous.**
  `PageSelector` exported a type called `Page` - about as collision-prone a name as a UI library can
  put in a consumer's namespace - and it is `PageSelectorPageType` now. Same pass: `TextBoxTypeType`
  lost its doubled suffix to become `TextBoxType`, the colour palette's `ThemeOptions` became
  `ThemeColorOptions` (it had come to read as the base of the `XThemeOptions` family, which it is
  not - those hold glyphs, this holds hex), and `data-table-view.tsx`'s internal `HeaderOptions`/
  `BodyOptions` gained their `DataTable` prefix. `StepType` and `TabType` were considered and left
  alone: the bare noun is unambiguous, and `StepsStepType` would be worse.

  **Until velodesign publishes 1.0, consistency beats compatibility** - there is no downstream code
  to protect, and every inconsistency left standing now becomes permanent the day it ships. That
  applies to class names, exported symbols, attrs and theme-option fields alike. After 1.0 this
  inverts and a rename needs a deprecation path.
- `tests/basic_tests.test.ts` — a small number of real Astral (headless Chrome) assertions, not one per component.

## Component shape: `FunctionComponent` vs `Component` class

`FunctionComponent<AttrsType> = (attrs, children) => RenderableElements` — stateless, no lifecycle. **Default to this.** Used by `Button`, `RadioButton`, `Checkbox`, `Toggle`, `TextBox`, `Textarea`, `Select`, `Link`, `Badge`, `Card`, `Alert`, `Tooltip`, `Spinner`, `Divider`, `Breadcrumbs`, `Pagination`, `Navbar`, `Sidebar`, `TimeAgo`, `Icon`/`I`, `Accordion`, `Avatar`.

A third, rarer shape: an **imperative function**, not a component at all, for something the consumer never places in their own JSX tree - `showToast()` is the only current example. It lazily creates one shared container appended to `document.body` on first call, and each call just appends/removes its own element from that container on a timer. Reach for this only when "mount me somewhere in your tree" genuinely doesn't fit (a global notification queue, not a piece of UI with a natural position) - it's the exception, not an alternative to reach for casually.

`class extends Component<AttrsType>` — only when you need one of:
- **A persistent, imperatively-controllable DOM handle** the component must reference again later (`Modal` builds its `<dialog>` once in the *constructor* and stores it in a private field so `showModal()`/`close()`/`setConfirmDisabled()` can act on it directly; `Menu` does the same for its `<details>` element). When you need this, build the JSX tree in the constructor and have `render()` just `return this.#element` — don't rebuild it in `render()`.
- **Global event listeners that must be added/removed with the component's lifecycle** (`mount()`/`unmount()`). `PageSelector` listens for `popstate`/`locationchange` to know when to reselect a page; `NavLink` listens for the same two events to know when to recompute whether it's the active link; `Menu` listens for document `click` to close itself on an outside click. Always add in `mount()`, remove the *same* bound listener reference in `unmount()` (store it as a class field / arrow-function property, not a fresh closure each time, or `removeEventListener` won't match it).
- **Internal state that changes after construction and must trigger a re-render.** Call `this.refresh()` when it changes. `refresh()` unmounts and deletes the whole subtree and re-runs `render()` from scratch — **this means any `ElementHandle`/DOM reference you held from before the refresh is now stale**; if you're writing an Astral test that clicks something and triggers a refresh, re-query every selector you need *after* the click rather than reusing a handle captured before it (`NavLink`'s test actually failed this way once — reusing a pre-click handle to read a post-click attribute threw; the fix was re-querying with `page.$(...)` after the click).
- **Swapping a sub-tree in place without a full refresh**, when only part of the component changes: `this.replaceChild(oldChild, newChild)` (`TextEditableField` uses this to swap its view/edit halves). Prefer `refresh()` unless you specifically need to avoid re-rendering sibling content. ⚠️ Use `this.replaceChild`, **never** the native `element.replaceChild`/`replaceChildren`/`appendChild` - see *Changing the DOM after construction* immediately below.

### Changing the DOM after construction: `core/dom-lifecycle.ts`, never the native methods

**The rule, in one line: a component never calls `element.replaceChildren(...)`, `element.appendChild(...)` or `element.remove()`. It calls one of three helpers from `core/dom-lifecycle.ts` and passes itself.**

| Instead of | Call |
|---|---|
| `host.replaceChildren(...xs)` | `setChildren(this, host, xs)` |
| `host.appendChild(x)` | `appendChild(this, host, x)` |
| `el.remove()` | `removeElement(this, el)` |
| `el.replaceWith(newEl)` | `this.replaceChild(el, newEl)` |

`core/dom-lifecycle.ts` carries the full reasoning - read it before touching any of this. The short version:

**Why.** Writing `<Foo/>` in JSX constructs the component, runs its `render()`, registers the instance in velotype's key map and stamps that key onto the root element. It does **not** call `mount()` - it cannot, because nothing is on the page yet. `mount()` comes later, from a walk of the freshly-attached subtree looking for those stamped keys, and velotype reaches that walk from exactly three kinds of place: `replaceElementWithRoot` (app boot), `refresh()`, and the `Component` methods `replaceChildrenOfChild` / `appendToChild` / `prependToChild` / `replaceChild` / `removeChild`, which velotype core installs on every instance. `unmount()` is the same walk in reverse. A native DOM call is not among them, so it puts elements on the page and skips both halves:

- **`mount()` never runs.** Everything renders and looks right - the markup is identical either way. What is missing is every subscription the component makes to something *outside* itself: a `popstate`/`locationchange` listener, a `document` click-away handler, a `matchMedia` watcher, a `mountStyles()` call. The component is inert with respect to the rest of the page and looks completely normal.
- **`unmount()` never runs either, and that half leaks.** Unmounting strips a component out of velotype's global listener registry and releases its vtKey. Elements dropped by a native call are gone from the DOM and still in both, holding a detached tree alive. In a list rebuilt per keystroke that is a leak per keystroke.

**This is where the Sidebar's active-page marker bug came from.** Every row is a `NavLink`, a `NavLink` does all of its work in `mount()`, and `setItems` attached its tree with a bare `body.replaceChildren(...)` - so no row ever subscribed to `popstate`, and the sidebar went on pointing at whichever page the reader first loaded however far they browsed from it. `Sidebar#syncActiveLinks` still exists, but for a different reason now: ordering, documented on the method.

**Why helpers rather than the velotype methods directly.** Because the correct call differs between the constructor and everywhere else, and getting it wrong is silent *in both directions*. In the constructor the subtree is not on the page yet, so nothing needs mounting - and the five methods are installed on the instance only *after* the constructor returns, so calling one there hits the base-class stub, which returns `false` and writes nothing at all. After the constructor the native call is the silent one. Most of the components involved - `DataTable`, `AsyncDataTable`, `SelectMenu`, `Calendar`, `CalendarRange` - call the same private `#renderX()` from their constructor *and* from their state handlers, so neither answer is right for the whole method. The helpers branch on `element.isConnected`, which decides it exactly rather than approximately, and throw rather than no-op if handed an element the component does not own.

**Two things this does not cover:**

1. **Attribute, class, `textContent` and style writes are fine anywhere** - `classList.toggle`, `setAttribute`, `scrollIntoView`, `.value =`. They add and remove no components, so no lifecycle is involved. `Combobox`'s highlight toggling and `SelectMenu`'s `#updateSelectedClasses` are deliberately this.
2. **`charts/` is exempt and stays on raw DOM calls.** Charts build SVG through `document.createElementNS` (velotype's JSX cannot emit `<svg>` at all - gotcha 2), and every one of their content attrs is typed `string`, so there is never a component anywhere in a chart to mount.

**A `FunctionComponent` cannot do any of this** - there is no instance to pass. `Alert` and `Tag` are classes for exactly this reason and no other: both remove themselves from the page on dismiss, and both hold arbitrary consumer `children`. If a new component needs to add or remove content after it is on the page, it is a class. `showToast` is the one case with no component at all, so its container is a `ToastContainer` component mounted through `replaceElementWithRoot`, giving the toasts something to be added and removed *through*.

`tests/basic_tests.test.ts` has a guard - *"swapping a subtree in place runs velotype's mount and unmount lifecycle"* - built on a `MountProbe` in `tests/test_modules/combobox.tsx` that does nothing but count its own `mount()`/`unmount()` calls. Counting is the only way to test this: a missed mount leaves no trace in the DOM.

### `RenderObjectArray` for a list that mutates a point at a time, `setChildren` for one that is recomputed

velotype's `RenderObjectArray` is the canonical way to render a list, and it carries the lifecycle
on every mutation - `push`, `pushAll`, `deleteAt`, `delete`, `clear`, `set`. Reach for it when the
list changes **one item at a time**. `showToast` is the case in this package: one toast arrives, an
earlier one times out, and nothing else on screen is rebuilt - so a toast mid-animation is not
interrupted by the next one arriving.

For a list that is **recomputed whole** from a filter or a page of data, keep `setChildren`.
`Combobox` was migrated to prove the shape and is the reason the rest were not:

1. **`clear()` and `set()` replace the wrapper element.** Both re-run the array's own render
   function and `replaceElement` the result, so a held reference to the wrapper goes stale - taking
   the panel's open/closed class and its scroll position with it. A full rebuild has to be
   `deleteAt` + `pushAll`, which touch only the items.
2. **`deleteAt(0, 0)` deletes one row, not none** (`deleteCount > 0 ? deleteCount : 1`), so every
   clear needs a length guard first.
3. **A row that is not an item cannot live in the array.** `Combobox`'s no-match row is a permanent
   `<li>` toggled with `hidden` rather than added and removed, because taking it off the page would
   release a vtKey that showing it again needs.
4. **The renderFunction gets no index**, so anything index-based - `Combobox`'s highlight - moves to
   a DOM query plus a `findIndex` over the array's values.

None of that buys anything when every item is rebuilt regardless. `Command`, `DataTable`,
`AsyncDataTable`, `Calendar` and `CalendarRange` all have that shape and stay on `setChildren`.

`wrapperElementTag` is worth knowing either way: it makes the wrapper element *itself* the `<ul>` or
`<tbody>`, so nothing sits between a `role="listbox"` and the `role="option"` rows it owns.

Only the default `<div>` wrapper is `display:contents`; a named tag is created unstyled, so the
component's stylesheet decides its display (velotype 0.0.30). Before that every wrapper carried the
inline style, which beats any class - `Combobox`'s panel drew no box and ignored both `display:none`
and its open class, so the showcase's navbar search spilled its results inline and never closed,
while every test that counted option rows passed. *"the combobox panel is hidden when closed and a
positioned box when open"* guards it.

### Avoid `refresh()` on any component that accepts children — via `children` or via an attrs field typed as `RenderableElements`/`RenderableElements[]`

This is the sharpest case of the general rule in the next section: `refresh()` is the largest
possible DOM update, so it is the first thing to rule out.

`refresh()` unmounts and rebuilds the *entire* subtree, and that subtree can include consumer-supplied content you don't own — another component with its own state (a `TextBox` mid-edit, a nested `DataTable`, anything holding focus or internal state). Rebuilding it from scratch on every internal state change of *your* component silently discards that state, and the consumer has no way to opt out. If a component's attrs include a bare `RenderableElements`/`RenderableElements[]`/a row-render callback, or it takes `children`, its internal state transitions should **never** call `this.refresh()` — reach for one of these instead, both already proven out in this package:

1. **Build once in the constructor, then targeted-update via `setChildren`/class toggles on stored element refs** (`setChildren(this, host, xs)`, *never* `host.replaceChildren(...xs)` - see the section above)**.** `Command`'s `#renderList()`, `SelectMenu`'s per-method updates, and `DataTable`'s `#renderTable()` all do this: persistent fields (`#tbodyEl`, `#panelEl`, ...) get built once in the constructor, and every state-changing method rebuilds *only* the specific pieces that actually depend on that state, leaving everything else (a search `TextBox`, an unrelated toolbar button) untouched and never remounted. `DataTable` used to call `refresh()` on every sort/search/page/column-visibility change; the toolbar and column-menu panel don't depend on any of that state, so it was refreshing (and risking mid-interaction stale-reference bugs in) parts of the tree that never needed to change at all.
2. **Keep every consumer-supplied panel mounted permanently, toggle which one is visible with a CSS class.** `Tabs` and `Carousel` both do this now: every tab's `content` / every carousel `slide` is built once in the constructor and stays in the DOM the whole time (same trade-off `Accordion` already made for its sections, via native `<details>`), and switching just toggles a `-active` class on the relevant button/panel pair — the previously-visible one is never torn down, so whatever state it held (typed text, scroll position, a mid-flow child component) survives being switched away from and back to. This does mean *all* panels/slides get constructed up front rather than lazily — an accepted trade-off, matching `Accordion`'s.

The only components still calling `refresh()` are `Calendar` (`#changeMonth`) — its attrs (`value: Date`, `onSelectDate`) don't accept any consumer content at all, every rendered cell is self-generated, so there's no external state at risk and a full re-render is the simplest correct option.

## Typography and layout are the package's primitives

Everything else composes from these two, which is why they sit first in the showcase.

**Typography exists to close one specific trap.** `muted` is `var(--background-6)`, never
`var(--text-alt)` - despite the name, `--text-alt` is the *inverse* text colour, so muted text
styled with it is nearly invisible in dark mode. That was documented in prose and rediscovered
anyway; `<Text type="muted">` encodes it. `Heading` requires its `level` rather than defaulting,
because a default quietly produces a second `<h1>` on a page that already has one, and size comes
from the level so the visual hierarchy and the document outline cannot disagree.

**`Stack` and `Grid` are the components that replace `style={{display: "flex", gap: "0.5rem"}}`.**
Everything they do is a one-line CSS rule - the value is that every consumer spells it the same
way and draws gaps from one scale, so two rows that look "the same" are. This is the gap shadcn
doesn't have because it assumes Tailwind; a package that ships its own CSS has to own spacing or
every consumer reinvents it.

**The spacing scale is in `em`, not `px`** (`layout/spacing.ts`): a gap that doesn't scale with its
container's type is wrong the moment a consumer scales their typography. Six steps, `none` through
`xl`, and any component may take a raw CSS length when it genuinely needs one. If a third component
needs spacing, take it from here rather than inventing a value.

Two behaviours worth knowing before you debug them:

- **A column `Stack` stretches its children** - flexbox's own default, right for stacking cards or
  form fields, surprising for badges. `align="start"` is the fix, and the gallery shows both.
- **`Grid` defaults to `minColumnWidth`, not `columns`.** Auto-fill reflows without a media query;
  a fixed count has to be re-chosen at every breakpoint. A `Grid` showing one column in a narrow
  container is working correctly - a test that asserts a track *count* rather than that the count
  follows the width will fail at the suite's 400px viewport, which is exactly what happened here.

## Interaction must only touch the DOM that actually changed

**Every handler in this package - click, input, hover, scroll, resize - must do the smallest DOM
update that expresses the change, and no update at all when nothing changed.** This is a hard rule,
not an optimisation to get to later: the cost lands on the consumer's page, and rebuilt DOM
silently destroys focus, caret position, text selection, scroll offset and in-flight CSS
transitions - state no component owns and none can restore.

Three questions, in order, for any handler:

1. **Scope** - what is the *smallest* element whose contents depend on this change? Rebuild that
   one, never its ancestor. `DataTable`'s `#renderTable` rewrites the `<colgroup>`/`<thead>`/
   `<tbody>`/footer and deliberately leaves the toolbar and column menu alone; `Calendar` replaces
   only `#gridEl`; `SelectMenu` only `#valueEl`. All correct.
2. **Frequency** - could this handler fire continuously? `pointermove`, `input`, `scroll` and
   `resize` all fire at up to display rate. Derive the state the update depends on, compare it to
   last time, and **return early when it is unchanged**. A handler that fires 120 times a second
   and rebuilds on all 120 is the default outcome if nobody checks.
3. **Granularity** - once you know something changed, change only that:
   - **Text: `textNode.nodeValue = x`, not `element.textContent = x`.** Assigning `textContent`
     *replaces* the text node; `nodeValue` mutates it. A label that updates per interaction is the
     difference between zero node churn and one churn per event.
   - **Appearance: toggle a class**, don't write inline styles per element. `BarChart` dims
     non-hovered bars with one class on the `<svg>` plus one on the hovered `<rect>`, precisely so
     a few hundred bars don't each take a style write on every pointer move.
   - **Never read layout in a handler.** `offsetWidth`, `clientHeight`, `getBoundingClientRect`
     force a synchronous reflow. Cache the value when you draw and read the cache. The charts'
     `containerBounds()` exists only for this.

**Verify it, don't assume it.** A `MutationObserver` over the component's root, counting
`addedNodes`/`removedNodes` across a burst of events, tells you in seconds what review will not:

```ts
const observer = new MutationObserver(() => {})
observer.observe(root, {childList: true, subtree: true, attributes: true, characterData: true})
for (let i = 0; i < 40; i++) { /* fire the same interaction */ }
// Drain by hand - the callback is an async microtask and will NOT have run yet inside a
// synchronous block. Reading counters a callback fills in later is how a churn test passes
// against the very implementation it was written to reject. This happened here.
for (const record of observer.takeRecords()) { /* count */ }
```

An interaction that changes nothing should produce **zero** records. `basic_tests.test.ts`'s
"charts do no DOM work for a hover that changes nothing" is the worked example; copy its shape for
any new component with a continuous handler.

The charts are where this rule was learned: `LineChart`'s tooltip rebuilt its whole subtree on
every `pointermove`, which measured 580 mutation records and 180 new nodes for 60 moves inside a
single column - for a reading that never changed. It now measures zero.

## Attrs types

Every component's attrs type is named `<Name>AttrsType`, with no exceptions left, and is built from these shared mixins, **folded into the type alias itself**, not repeated at each usage site:

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

The generic is declared `<T extends HTMLElement>`. `HTMLDetailsElement` (used this way by `Menu`/`Accordion`/`Collapse`/`Tree`) genuinely satisfies that constraint - it's a real `HTMLElement` subtype - so it needs no cast. `SVGSVGElement` (`Icon`'s `<svg>` root) does *not*: it descends from `SVGElement`/`Element`, not `HTMLElement`, so it's missing real `HTMLElement`-only members (`accessKey`, `autocapitalize`, ...) and fails to type-check against the constraint (confirmed against `@velotype/velotype@0.0.27` - an earlier note here claiming structural typing let `SVGSVGElement` through anyway was wrong, or true only against an older `dom.d.ts`; either way it isn't now). `Icon` handles this with a double cast through `unknown` at its one call site, safe because the attrs `passthroughAttrsToElement` actually reads (`id`/`class`/`style`) are plain `Element`-level concerns - don't reach for `<T>` itself as a way around this on a new SVG-rooted component; cast at the call site the same way.

## Styling

### The CSS is a module-level const, never a literal inside the constructor

Every component in the package declares its stylesheet as a module-scope `const <name>Css: string`
sitting just above the component, and the constructor is one line:

```tsx
/** Stylesheet for `<Stack/>`, mounted once on first construction */
const stackCss: string = `
.vtd-stack{display:flex;width:100%;box-sizing:border-box;}
`

export const Stack: FunctionComponent<StackAttrsType> = function(attrs, children) {
    if (!areStackStylesMounted) {
        areStackStylesMounted = true
        mountStyles(stackCss, "vtd/Stack")
    }
    ...
```

**This is purely for reading.** `Navbar` carries 3.7KB of CSS, `CodeBlock` 7KB, `DataTable` 5KB and
`Sidebar` 32KB - inline, those pushed the actual component logic hundreds of lines down its own
file, and a class was unreadable without scrolling past a stylesheet first. Nothing about *when*
the sheet is attached changes: `mountStyles` is still called lazily on first construction, so
cascade order is exactly what it was.

Naming is mechanical, from the `mountStyles` key: `"vtd/DataTable"` → `dataTableCss`. Keep any
prose comment about the CSS *above* the const rather than between `=` and the template literal.

The one exception is `core/theme.ts`, whose palette sheet is parameterised by selector and by the
caller's colour overrides, so there is no single string to hoist - it is a `themeCss(selector,
options)` builder function instead, split out for the same reason.

### One sheet per component, through `mountStyles`

One `mountStyles(cssText, "vtd/ComponentName")` call per component, from `core/styles.ts`. **Nothing
in `src/` calls `setStylesheet` directly** - that is what makes the cascade deterministic, and the
reason is worth understanding before adding a component.

`setStylesheet` pushes each sheet onto `document.adoptedStyleSheets`, so **cascade order is the
order sheets were attached, and a component's sheet is attached when that component is first
constructed**. Which component constructs first depends on which page the reader lands on and how
they navigated there, so two rules of equal specificity resolve one way on a cold load and the
other way after a click, with no code change between them. Measured on the showcase:
`.vtd-showcase-example-code` was attached 5th against `.vtd-code-block`'s 10th on a direct load, and
39th against 11th when the same page was reached through a category page - so an example's code
block had square corners on one path and round ones on the other. Nothing about the CSS was wrong;
it was a race.

**`mountStyles` puts everything this package ships inside a cascade layer**, and an unlayered rule
beats a layered one whatever its specificity and whatever the source order. So:

- **A consumer's own CSS always wins**, deterministically. That is the relationship a component
  library wants and it previously depended on luck.
- Inside the package, sub-layers order the pieces that genuinely stack:
  `velodesign.reset, velodesign.theme, velodesign.base, velodesign.component, velodesign.composite`.
  `base` is the shared internal modules (`disclosure-view`, `typography-common`, `chart-common`);
  `composite` is a component that styles *another* component's classes and must win - `Sidebar` over
  `Tree` and `Menu`, `CalendarRange` over `Calendar`, `ButtonGroup` over `Button`, the shared
  data-table view over `TextBox`.
- The layer *order* is declared once from `core/styles.ts` before any sheet is attached, because
  layer precedence otherwise follows first appearance - which would put us straight back to
  depending on construction order.

⚠️ **A layer is not a substitute for scoping inside the package.** Two components in the same layer
still tie on source order, so a rule about another component's class must still out-specify it -
scope it under your own root (`.vtd-sidebar-profile .vtd-menu`, not `.vtd-sidebar-profile-menu`).

**And the order is not a coin toss - the other component's sheet always wins.** A component that
*constructs* another mounts its own sheet first, so the one it builds is always later and always
beats it at equal specificity. `Carousel` styled its arrows with an unscoped `.vtd-carousel-nav`
on a `Button`, lost `position:absolute` to `.vtd-button{position:relative}` every single time, and
rendered both arrows stacked in the bottom-left corner in flow rather than over the slide - for as
long as the component has existed. Every test passed throughout: the arrows are present, clickable
and advance the slide wherever they sit, so only a computed-style assertion or a screenshot sees it.
The sweep worth running when touching this: find every site where one component's class is applied
to another component's element, and check each for a property both sides declare.
The layer fixes library-versus-consumer; specificity still settles library-versus-library, and the
`composite` layer is for the handful of cases where scoping alone cannot.

The prevailing style still guards the call with a module-level boolean
(`let areFooStylesMounted = false`) to skip even building the template string after the first mount:

```ts
let areFooStylesMounted = false
// ...
if (!areFooStylesMounted) {
    areFooStylesMounted = true
    mountStyles(`...`, "vtd/Foo")
}
```
For a `Component` class, do this once in the constructor (see `Menu`), not in `render()`.

**A consumer placing a component owns where it goes, and must measure rather than assume.** The
showcase pinned its sidebar with `top:53px` under a header that is actually 55px tall, so once the
page scrolled the sidebar sat two pixels high and painted over the header's bottom border for its
own width - the line between them vanished, but only after a scroll, which is what made it look
intermittent. It publishes the header's real height as a custom property from a `ResizeObserver`
now. A hardcoded offset against another element's height is wrong the moment anything in it
changes size, including the reader's own font settings.

Conventions inside the CSS itself:
- Class names are all `vtd-<component>` / `vtd-<component>-<part>` / `vtd-<component>-<modifier>` (e.g. `vtd-button`, `vtd-button-primary`, `vtd-tabs-tab-active`). Never a bare unprefixed class.
- **Never hardcode a color.** Everything reads CSS custom properties from `theme.ts`'s generated palette (light/dark aware via `[data-theme="light"|"dark"]`):
  - `--text` / `--text-alt` — main text color and its inverse.
  - `--background` (+ `-1` through `-9`, `-alt`) — a light↔dark mix ramp anchored on the page background color; use e.g. `var(--background-1)` for a very subtle hover tint, `var(--background-4)`/`var(--background-5)` for borders/dividers, `var(--background-9)` for a near-inverse accent.
  - `--primary`, `--secondary`, `--warning`, `--accent` — each with the same `-1`..`-9` mix ramp (white→color→black in light mode, inverted in dark). `-2` is a typical hover tint, `-6` a typical active/pressed tint, `-3` a typical "light fill" (badges, alerts).
- Prefer `color: inherit` / `currentColor` over a fixed color when a component is meant to sit inside arbitrarily-colored context (e.g. `Spinner`'s ring uses `currentColor` for exactly this reason — it's used both standalone and inside `Button`'s color-varying `type`s; a first draft hardcoded `var(--primary)`, which would have made the spinner nearly invisible against a primary-colored `Button` — caught and fixed before it ever shipped).

### Full width vs. content width

Every component falls into exactly one of two width behaviors, and which one is intentional, not incidental:

- **Container/layout surfaces default to `width:100%; box-sizing:border-box;`** on their root element — anything whose whole job is to occupy the space its parent gives it: `Table`, `DataTable`, `Card`, `Alert`, `Sidebar`, `Tree`, `Tabs`, `Collapse`, `Accordion`, `List`, `Timeline`, `Steps`, `Navbar`, `Carousel`, `Upload`, `ScrollArea`, `Progress`, `Empty`, `Form`/`FormField`, `Divider` (horizontal only), `Skeleton` (the `text` variant's fallback width, and already true of the `rectangular` variant). Without this, a component that's visually "full width" in normal block flow (a `<div>`/`<table>`/`<ul>` with no explicit width does span its block parent by default) silently shrinks to content size the moment it's placed in a flex or grid container instead — which is a real, easy-to-hit regression, not a hypothetical: it's what broke `Collapse` (a row of two side-by-side sections drifted apart in width between collapsed/expanded) and `Sidebar`/`Tree` (visibly narrower than their allotted column) before each got this treatment. Explicit `width:100%` on the component's own root makes the sizing behavior identical regardless of the surrounding layout context.
- **Inline controls/triggers default to their natural content size** — no `width:100%`, typically a `min-width` instead if anything: `Button`, `Badge`, `Tag`, `Avatar`, `Checkbox`/`RadioButton`/`Toggle`, `Rate`, `Spinner`, every plain form control (`TextBox`, `Textarea`, `Select`, `SelectMenu`, `Combobox`, `DatePicker`, `Slider`, `InputNumber`, `ColorPicker`), every overlay trigger (`Menu`, `Popover`, `Tooltip`, `Popconfirm`, `ContextMenu`), `Link`/`NavLink`, `Breadcrumbs`, `Pagination`, `Statistic`, `Divider` (vertical). These behave like their native counterparts (`<button>`, `<input>`, `<a>`) — sized to their own content/value, stretched by the consumer via `style`/`class` (or a wrapping full-width container) only when that's actually wanted. `Resizable` is a deliberate third case: it takes an explicit `initialSize` because its entire purpose is a manually-set, manually-resized dimension, not either default.

When adding a new component, ask which of these two it is before writing its root CSS rule — don't leave the answer to whatever the browser's default block/inline sizing happens to produce, since that silently breaks the moment someone drops it into a flex/grid layout.

## Language-agnostic by default — never a baked-in English string

velodesign doesn't assume an English-speaking (or any specific language) consumer. No component may default any visible text, placeholder, or accessible label to an English word or phrase — every such default is either an icon/glyph (language-agnostic by nature) or simply absent (`undefined`), always overridable by the consumer with whatever localized string they need. This was audited and enforced across the whole package in one pass; the two shapes that came up, and the fix for each:

- **Visible text with a natural icon substitute** (a button's content, e.g. `Popconfirm`'s confirm/cancel buttons, `Modal`'s cancel button, `Pagination`'s prev/next buttons): default to a symbol via the `XThemeOptions` pattern below (`PopconfirmThemeOptions.confirmSymbol`/`.cancelSymbol` → `✓`/`✕`, `ModalThemeOptions.cancelSymbol` → `✕`, `PaginationThemeOptions.prevSymbol`/`.nextSymbol` → `‹`/`›`), with the attrs field (`cancelButtonChildren`, `prevButtonChildren`, ...) still there for a consumer who wants real text instead. Never `attrs.foo || "Cancel"` - `attrs.foo || <FooThemeOptions.fooSymbol/>`.
- **Placeholder text with no sensible icon substitute** (`Command`'s search placeholder, `DataTable`'s `searchPlaceholder`, `Empty`'s `title`): no default at all - the attr passes straight through (`placeholder={attrs.placeholder}`, no `|| "Search..."`). An empty native placeholder, or `Empty` showing just its `∅` icon with no title line, is the correct default appearance, not a bug to paper over with English text.
- **ARIA-only labels** (`aria-label`s on icon-only buttons, nav landmarks, dynamically-generated per-item labels like `Rate`'s per-star label or `Carousel`'s per-dot label): these have no visual/iconographic substitute at all, since they're never rendered - so they become a plain optional attr (`label`, `dismissLabel`, `removeLabel`, `ariaLabel`, or a builder function like `getStarLabel`/`getDotLabel` for the per-item cases) with **no default value**, full stop. This is a deliberate accessibility trade-off: an unset accessible name for a consumer who never provides one, in exchange for never assuming a language. It matches how unstyled/headless component libraries (Radix, etc.) already handle this rather than trying to have it both ways.

When adding a new component with any button/placeholder/label content, ask "what would a non-English-speaking consumer see by default?" before picking a default value - if the honest answer involves an English word, that's the bug.

⚠️ **This rule was audited "across the whole package in one pass" and two violations survived it**:
`Combobox` rendered `"No matches"` and `Command` rendered `"No results"`, each with no attr and no
theme option to change them. Both were invisible to that audit because they are not defaults at all
- there is no `attrs.x || "..."` to grep for, just a literal inside a list-rebuilding call in a
private render method. Note the fourth pattern below never matched those two either: the strings
sat inside JSX (`<li>No matches</li>`), which the *third* pattern is what actually catches. Both now take a `noMatchMessage` attr defaulting to
`<CommonThemeOptions.emptySymbol/>`.

So grep for the *rendering*, not for the defaulting. These four patterns between them find every
shape the rule cares about, and it was the last one that hid:

```sh
grep -rnE '(\?\?|\|\|)\s*"[^"]{2,}"' src/                 # a defaulted string
grep -rnE '(aria-label|title|placeholder|alt)="[A-Za-z]' src/  # a literal attribute
grep -rnE '>[A-Za-z]{2,}<' src/                                # a JSX text node
grep -rnE 'setChildren\(this, [^,]+, \["|textContent = "[A-Za-z]' src/  # an imperative write
```

One more grep worth keeping to hand, for a different rule - the lifecycle one above. It finds
every native structural DOM call in `src/`, which outside a constructor (and outside `charts/`) is
always a bug:

```sh
grep -rnE '\.(replaceChildren|appendChild|prepend|replaceWith|insertBefore)\(|\.remove\(\)' src/ \
    | grep -v '^src/charts/'
```

Outside `core/dom-lifecycle.ts`'s own docstrings it returns exactly three hits today, each a case
the rule does not reach:

- `toast.tsx` appends an empty placeholder `<div>` to `document.body`, which
  `replaceElementWithRoot` then swaps for the real container one line later. velotype exports no
  "mount into this parent" entry point, only "replace this element", so a root mount needs
  something already on the page to replace. The placeholder holds nothing, so there is no lifecycle
  to run for it.
- `icon.ts` assembles a detached `<svg>` through `createElementNS`, because velotype's JSX cannot
  emit `<svg>` at all (gotcha 2) - the same exemption as `charts/`.
- `combobox.tsx` adds its no-match row to the panel in the *constructor*, where nothing is on the
  page yet. It is not an array item, so `#options` cannot carry it - see the section below.

**Nothing else builds its tree imperatively, including in a constructor.** A constructor *may*
safely use native calls, since nothing it builds is on the page yet - but "safe" is not a reason to
write it that way, and conditional children belong in the JSX like every other conditional child:

```tsx
{attrs.resizable ? this.#buildResizeHandle() : null}
```

`Sidebar` appended its resize handle imperatively for no reason other than that it was conditional;
as one more line in the panel's JSX it reads the same as the four siblings above it and removes a
call site that looked like the bug. A third hit means someone added one. Check it against the rule.

## Theme options: `CommonThemeOptions` and the `XThemeOptions` escape hatch

A handful of components need a small piece of glyph/icon-ish content with no baked-in icon-font
dependency. Each such object is exported and mutable, holds `ThemeSymbol`
(`FunctionComponent<EmptyAttrs>`) defaults, and lets a consumer reskin that piece across every
instance without a per-instance prop. Add one when a component needs a small overridable visual
(never for anything structural) - it is also the standard way to satisfy the
language-agnostic-defaults rule above whenever the default is button/content text rather than a
placeholder or an ARIA label.

`core/theme-options.ts` holds the whole mechanism: `ThemeSymbol`, `CommonThemeOptions`,
`themeOptions()` (the builder, internal) and `resetThemeOptions()`.

### The consumer contract: set them at startup, and the package never watches them

**A theme option is read when a component is *built*.** It is a field on a plain object, not a CSS
custom property the browser re-resolves, so an assignment reaches the components constructed after
it and no others. The contract is therefore: **assign during application startup, before the first
velodesign component exists.**

**Nothing in `src/` subscribes, invalidates or re-renders when one changes, and nothing should.**
Mid-session symbol swapping is a feature approximately no application wants, and paying for it in
every consumer's bundle and every component's build path to serve the showcase would be exactly
backwards. A consumer who genuinely needs it re-renders the affected subtree themselves.

The showcase *does* need it, and every piece of that lives in `showcase/`, not here:
`main.tsx` re-applies the saved symbols before the first render, `theme-builder.tsx` calls
`refresh()` after an edit, and its inputs fire on `onChange` rather than `onInput` for the same
reason `refresh()` is safe there at all - a commit is a discrete action, a keystroke is not.

### Per-component fields delegate to `CommonThemeOptions`

Five components draw a "close/dismiss/remove this" control; five draw a previous/next pair. Before
`CommonThemeOptions` each spelled its own, so changing the close glyph meant finding all five - and
**four of the five prev/next pairs, plus `Steps`' completed-step check and `Pagination`'s gap, had
the glyph hardcoded in the markup with no override at all**, quietly breaking the
language-agnostic rule. The shared object is what found those.

Seven shared symbols: `closeSymbol`, `cancelSymbol`, `confirmSymbol`, `emptySymbol`,
`collapseSymbol`, `prevSymbol`, `nextSymbol`. **A symbol belongs there when two or more components
mean the same thing by it**; a single-use glyph stays on its own component, where its name can say
what it is - `ButtonThemeOptions.loadingSymbol`, `DataTableThemeOptions.columnsSymbol`,
`TextFormFieldThemeOptions.editSymbol`.

**Naming, and it is a rule rather than a convention: a field that delegates to
`CommonThemeOptions.X` is itself named `X`.** One meaning had three names before this - Alert and
Toast called it `dismissSymbol`, Tag called it `removeSymbol`, Modal and Drawer called it
`closeSymbol` - so a reader could not tell from a field name whether two components would follow
the same override. They are all `closeSymbol` now. A local-only field is named `<role>Symbol`. The
showcase encodes the rule rather than restating it: `SymbolOption` carries a boolean `inherits`
rather than the name of a shared field, so a delegating entry *cannot* be wired to a
differently-named one.

The object itself is `<Component>ThemeOptions` with no exceptions - `TextFormFieldOptions` was the
lone holdout and is now `TextFormFieldThemeOptions`, its `check`/`xmark`/`edit` becoming
`confirmSymbol`/`cancelSymbol`/`editSymbol`.

Three shapes, and which one to reach for:

```ts
// 1. Delegates. Reads CommonThemeOptions live, so a consumer's startup assignment reaches it even
//    though this module was evaluated first. Assigning here overrides just this component.
export const AlertThemeOptions: {closeSymbol: ThemeSymbol} = themeOptions({closeSymbol: "closeSymbol"})

// 2. Local only. No counterpart elsewhere in the package.
export const ButtonThemeOptions: {loadingSymbol: ThemeSymbol} = themeOptions({}, {loadingSymbol: function(){return <Spinner size="1em"/>}})

// 3. Wraps a shared symbol in the component's own chrome. The option is the *whole* visual, so a
//    consumer replacing it isn't stuck inside a 2.5em span; CommonThemeOptions.emptySymbol changes
//    only the glyph, here and in both tables and every chart at once.
export const EmptyThemeOptions: {emptySymbol: ThemeSymbol} = themeOptions({}, {
    emptySymbol: function(){return <span class="vtd-empty-icon" aria-hidden="true"><CommonThemeOptions.emptySymbol/></span>}
})
```

A component with no object of its own reads `CommonThemeOptions` directly - that is what `Calendar`,
`CalendarRange`, `Carousel`, `Steps` and `AsyncDataTable`'s pager do, rather than each growing an
`XThemeOptions` object for one glyph nobody would look for.

Three things about the mechanism that are easy to get wrong:

- **Fields are accessors, not data.** That is what makes delegation live (a captured value would
  freeze at module-evaluation order) and what lets `resetThemeOptions` restore a package default
  after it has been assigned over - the original is otherwise simply gone. Assigning `undefined`
  clears an override rather than blanking the field.
- **`themeOptions()`'s parameters are wrapped in `NoInfer`** so `T` comes from the annotation on
  the constant being declared. Without it TS infers the field type as `unknown` from the arguments
  and the declared shape stops being assignable. The annotation is where the per-field doc comments
  live, so keep it there rather than exporting a second type per component.
- **Never `{...XThemeOptions}`.** Object spread evaluates getters, which silently converts a
  delegating field into a frozen copy of whatever it resolved to at that moment.

**Export a new object from `index.ts` in the same change.** `BreadcrumbsThemeOptions` shipped
unexported: its name appeared in the showcase's Default column while no consumer could reach the
object that name refers to.

Each object is documented on the pages of every component that reads it
(`ComponentDoc.themeOptions`), using the same table as the attributes, with `CommonThemeOptions`
listed first wherever something inherits from it - a Default column reading
`CommonThemeOptions.closeSymbol` is only useful beside a table saying what that is. All 26 editable
glyphs are listed under **Advanced: theme options** in the theme builder, shared ones first.

## Animation

Every animated component in this package is subject to the following, and the first rule is the one
that has actually bitten:

### The animated element must stay rendered for the whole transition

**Un-rendering an element mid-transition does not cancel that transition - it leaves it pending
forever**, at `playState: "running"` with `startTime: null`, and that also pins the element's
*computed* style at the values it had when it stopped rendering. The symptom is not "no animation";
it is an animation that works once and then never again, because the next change has nothing to
transition from.

That is exactly what happened to `Collapse`/`Accordion`: removing `<details open>` stops the
browser rendering that subtree, so the close transition never started, the computed
`grid-template-rows` stayed at the open value, and every toggle after the first snapped. It had
been there since `Accordion` was written and no test caught it, because every test toggled a
disclosure exactly once.

Anything that stops an element rendering does this: `display:none`, removing `<details open>`,
closing a `<dialog>`, or detaching the node. **Where that lands in this package:**

| Pattern | Components | Today |
|---|---|---|
| `display:none` panel | `Popover`, `Popconfirm`, `ContextMenu`, `Menu`, `SelectMenu`, `Combobox`, `Tabs` | No exit animation - safe, but adding a `transition` alone would silently do nothing |
| `<dialog>` | `Modal`, `Drawer`, `Command` | Enter-only (`Drawer`'s keyframes); a close animation needs sequencing |
| `<details open>` | `Collapse`, `Accordion` | Fixed - the close is sequenced in `disclosure-view.tsx`'s `animateClosed` |
| Always-rendered element | `Tree`'s chevron (an element inside the `<summary>`), `Tooltip` | Safe by construction |

**Three ways out, in order of preference:**

1. **Animate something that never un-renders.** `Tree`'s chevron lives inside the `<summary>`, which
   is always rendered, so its rotate works every time - verified, zero stuck animations across four
   toggles. This is why an enter-only animation (`Drawer`, `Toast`) is never a problem.
2. **Hide with `visibility`/`opacity` rather than `display`.** `Tooltip` transitions
   `opacity 0.15s, visibility 0.15s` - the element keeps rendering, so both directions animate.
3. **Sequence it in JS** when the element genuinely must stop rendering: hold the rendered state,
   apply a class that animates it to the hidden values, and only un-render on `transitionend` -
   always with a timer fallback, since an interrupted or zero-duration transition fires no event.
   `animateClosed` is the worked example. Reach for this last; it costs real complexity, listed
   below.

**What sequencing costs, so it is a deliberate choice:**

- **State lags the interaction.** `details.open` now stays `true` for the duration of the close.
  Anything reading it straight after a click sees the old value; an existing test asserted exactly
  that and had to re-read.
- **Native grouping stops being usable.** `<details name>` closes a grouped sibling itself,
  instantly and ahead of any handler, so the displaced section snapped while the clicked one
  animated. `Accordion` had to take the grouping over in JS.
- **A doc comment claiming "pure CSS, no JS" becomes false.** Both files claimed it; both were
  wrong once the close was sequenced, and both were corrected.

### Honour `prefers-reduced-motion`

`@media (prefers-reduced-motion: reduce){ ... transition:none; }` beside the component's own rules -
`charts/chart-common.ts` and `data-display/data-table-view.tsx` set the pattern, and
`disclosure-view.tsx` follows it. **Most animating components still do not**, which is a real gap
worth closing as they are touched rather than in one sweep.

A sequenced animation needs the JS side too, not just the CSS: with the transition zeroed, no
`transitionend` fires, so `animateClosed` checks
`matchMedia("(prefers-reduced-motion: reduce)")` and finishes immediately instead of waiting out
its fallback timer, which would otherwise read as an unexplained delay.

### Verify animation with `getAnimations()`, never by eye

`element.getAnimations()` is the only check that distinguishes "finished" from "stuck": a healthy
interaction leaves **zero** animations behind once it settles, and the bug's signature is an entry
with `startTime == null` that never clears. A screenshot cannot see this, and neither can an
assertion about rendered content. Read it directly rather than inferring from what the element
looks like.

⚠️ **A test that leaves a navigation in flight breaks whatever runs next.** The menu test clicks an
entry whose `href` really navigates, and returned without waiting, so the next test's `page.goto`
raced it - and a selector query landing on a document mid-swap fails with `Unable to get element
from selector: body`, timing out after ten seconds. It failed about one run in eight.

`networkidle2` used to hide this by idling for ~500ms after every navigation; moving to
`waitUntil: "load"` for the speed removed that cushion and the pre-existing bug started showing. The
fix is `preventDefault` on a capture listener before the click: the navigation never starts, while
the component's own handler still runs so the assertion is unchanged. **Clicking a real link in a
test needs one of those two - wait for it, or stop it.**

⚠️ **Neither transitions nor `IntersectionObserver` work inside this test suite.**
`requestAnimationFrame` never ticks, computed values stay at their start, observer callbacks are
never delivered, and any in-page promise running more than about a second trips Astral's own
`evaluate` deadline with `RetryError` (the *function* form of `page.evaluate` awaits a returned
promise; the string form does not - that difference cost three failed attempts). It is the suite's
reused tab, not the viewport: loading the same page standalone at the suite's own 400x200 viewport
works correctly. So split the assertion:

- **In the suite**, assert the frame-independent contract: that the interaction was intercepted,
  that it takes the transition's own wall time rather than completing instantly (throttling can
  only stretch that, never shorten it), and that it holds on *every* cycle rather than the first.
- **In a standalone script**, assert the visual half by sampling per frame, where rAF does tick -
  the disclosure measured 12-13 distinct heights on every open and close.

**Beware the assertion that passes for the wrong reason.** "Scrolling produced zero mutations" is
trivially true when the observer that would have produced them never fires - a green test proving
nothing. `TableOfContents` asserts its *click* path in the suite instead, which is observer-
independent and exercises the same early return, and leaves scroll tracking to a standalone script.
If a test can only pass because the thing under test never ran, it is worse than no test.

**Always run the interaction at least three times.** A single toggle is what hid this bug for the
entire life of `Accordion`.

## Three components sharing one disclosure: `Collapse` / `Accordion` / `Tree`

The same split, and the second time this pattern has earned its keep. `Collapse` is one section a
consumer places anywhere and fills with `children`; `Accordion` renders a whole list from `items`
and can group it with the native `<details name>` attribute so only one section stays open.

**Neither is a special case of the other**, which is the question to answer before merging them:
`exclusive` belongs to the *set*, so three `Collapse`es cannot express it, and `Accordion` owns the
list (spacing, `:last-child`) and takes no `children`, so it cannot sit inline where a `Collapse`
does. The APIs are genuinely different shapes over one widget.

**The implementation was the problem, not the split.** They had a stylesheet each; five of
`Collapse`'s eight rules were byte-identical to `Accordion`'s after unprefixing, and they had
already diverged where it showed - measured live, `Accordion` animated open over 200ms
(`grid-template-rows: minmax(0,0fr)` → `minmax(0,1fr)`) while `Collapse` snapped. Choosing a
component on the shape of its API silently chose an open/close behaviour too. `data-display/disclosure-view.tsx`
(internal, not exported) now holds the one stylesheet, the section builder and the layout flush;
each component keeps only what belongs to it - `Accordion`'s item spacing and group name.

**`Tree` takes the mechanism and not the chrome**, which is the distinction that makes the module
reusable rather than just shared. A tree row is not a header: it keeps its own hover, its own
`::before` chevron and its own indentation, and must never pick up the border box, header fill or
content padding the other two draw. Two things make that possible:

- The animation rule is keyed on `details[open]:not(.vtd-disclosure-closing) > .vtd-disclosure-content`
  rather than on `.vtd-disclosure`, so any `<details>` in the package can animate without wearing
  the chrome. Chrome rules stay scoped under `.vtd-disclosure` - including the content padding.
- `buildDisclosureContent` and `animateClosed` are exported from the internal module, because
  `Tree` builds its own `<details>` and drives its own `<summary>` clicks (a click on a node's
  label selects rather than toggles, so it cannot use `buildDisclosureSection`'s handler). Its
  handler bails on `event.defaultPrevented`, which is how a label click stays a selection instead
  of animating the node shut.

**An open section has to look open.** Its header takes a divider and a faint fill
(`background-1`, with hover one step further at `background-2` so hovering an open header still
reads as a hover); the border is carried at all times and merely goes transparent when closed, so
opening doesn't shift the section by a pixel. The content's inner padding is equal on all sides -
it was `0 0.9em 0.9em`, which pushed the first line of content up against the header.

Note this was a deliberate **behaviour change**, not pure refactoring: `Collapse` gained the 200ms
animated open it should always have had. `basic_tests.test.ts`'s "Collapse and Accordion render the
same disclosure widget" compares the computed transition, display, padding, chevron size, border
and radius across the two gallery pages, so the drift cannot come back.

See **Animation** below for why `Collapse`'s close needs JS at all, and what that
costs - it is a general trap, not a disclosure one.

## Two components sharing one look: `DataTable` / `AsyncDataTable`

`DataTable` owns an array and computes over it; `AsyncDataTable` owns a *query* and asks a `load`
callback to answer it. They must look identical, so neither one owns the markup: `data-display/data-table-view.tsx`
(internal, not exported from `index.ts`) holds the shared stylesheet, the `<colgroup>`/`<thead>`/
`<tbody>` builders, the resize drag, and the `ColumnMenu`. Two `setStylesheet` calls would be two
places for a padding value to diverge, which is exactly the drift the split exists to prevent.

**Which one a consumer needs is decided by where the filtering happens, not by preference.** A
server-truncated page handed to `DataTable` silently turns "search everything" into "search the
page you already have" — the search box is right there and quietly lies. That failure is invisible
in review, so the column types are deliberately *different* rather than overlapping: `DataTable`'s
column takes `sortValue`/`filterValue` (functions over a row it has), `AsyncDataTable`'s takes
`sortable: boolean` (a flag the server acts on). A single `columns` type whose fields mean
different things depending on a sibling attr would let a `filterValue` be silently ignored.

**What `AsyncDataTable` owns that a hand-rolled fetch reliably gets wrong**, each worth keeping if
this is ever refactored: a **sequence guard** discarding any response that isn't the newest (a slow
early query landing after a fast later one is routine over a real network and invisible locally);
the search input **never unmounting**; a **debounce**; and loading / empty / no-match / error kept
as four distinct states rather than one blank table. Its `truncated` result flag exists so a
backend row cap can say so instead of a short list looking complete.

Testing the sequence guard needs care, and two ways of writing that test look right and prove
nothing — both were written and thrown away here. The fixture's two search strings must select
**different rows** (racing "ja" against "jam" over data where they match the same people passes
with the guard deleted), and the assertion must **wait for the stale response to have resolved**
rather than sleep: the headless browser throttles timers unpredictably — a 720ms fixture delay was
measured taking 1476ms — so a sleep tuned locally reads the DOM just before the stale answer lands.
`tests/test_modules/async-data-table.tsx` exposes `__resolvedQueries` on `globalThis` for the test
to wait on. **Whenever changing either component, delete the guard, confirm the test fails, then
put it back** — that is the only evidence the test still tests anything.

**Both tables follow the language-agnostic rule**, and the three pieces of text they used to bake
in show all three shapes that rule distinguishes. The column-visibility button and the empty state
had icon substitutes, so they became `DataTableThemeOptions.columnsSymbol` (`▥`) and `.emptySymbol`
(`∅`). "Rows per page:" has no icon that means it, so `pageSizeLabel` simply has **no default** and
renders no caption when unset - the same call `Empty`'s `title` makes. And an icon-only button has
no accessible name, which is why `Button` gained an `ariaLabel` attr and both tables expose
`columnToggleLabel`; setting it is on the consumer, with no default, like every other ARIA label
here.

## `Card` is three regions, and they have to look like three regions

Header, body and footer all carried the card's own background with a hairline between them, so a
card with both slots read as one flat wash - a 1px rule cannot carry that distinction against a
background a shade away from the page. The body is the card's *content* and keeps the plain
surface; the header and footer are chrome around it and take a step of the background ramp.

A step rather than a fill of its own: `--background-2` against `--background-1` is the same
relationship a hover has to a resting row, which is small on purpose. A header announcing itself
with a real colour would make every card on a page compete with its own content.

## A colour attribute is a colour *name*, never a colour

`Avatar` had no way to colour its initials, and the honest reason it is a palette name rather than
a CSS colour is that a consumer passing `#e8f0ff` has specified a light-mode background and nothing
else - not the dark-mode background, and neither text colour. A name resolves through the ramps,
which already carry a light and a dark value each, so **one attribute covers all four colours a
hand-specified avatar would need**, and pairing the `-3` step with plain `--text` keeps the contrast
right in both themes without either side being stated.

The set is the same one every other coloured component takes (`primary | secondary | warning |
danger | neutral`), spelled `type` like `Badge`'s and `Tag`'s. Deriving a colour by hashing the
initials was considered and rejected: four hues means collisions are the normal case rather than the
exception, and a colour that silently changes when someone's name is corrected is worse than one
that never varied.

## Keyboard focus: one ring, and only where there is something to do

### The ring is the package's, not the component's

`core/styles.ts` mounts a single `:focus-visible` rule in the `base` layer, reaching every element
with a `vtd-` class. A component overrides it **only when the element that takes focus is not the
element that should show it** - `Checkbox`, `RadioButton`, `Toggle`, `Rate` and `Upload` all focus a
0x0 transparent input and draw the ring on the visible control beside it, and a popup list marks
the keyboard's position with a filled row instead.

It was twenty-two treatments before, measured by tabbing every gallery page: rings of 1px and 2px,
offsets of 0, 1 and 2, some drawn as a border colour change, five that turned the outline off and
showed a faint background, and **`Button` - the most-used control here - marking focus with a red
`--accent` border**. Most of the rest set no outline at all and inherited the browser's, which is a
different colour in every engine and changes with the page's `color-scheme`.

Three choices in that rule, each load-bearing:

- **`--primary-7`, not `--primary`.** A primary-coloured ring around a primary-filled button is
  nearly invisible. The `-7` step is darker than the mid colour in light mode and lighter in dark,
  so it separates from a fill of its own hue in both. Measured across 336 focus stops, the weakest
  contrast is 3.51:1 - WCAG 2.2 SC 1.4.11 asks 3:1.
- **2px, offset 2px.** One pixel disappears against a border of the same weight; a zero offset
  reads as a thicker border rather than a ring. The gap lets the surface behind show through, which
  is what keeps it legible on a filled control.
- **`outline`, never `border` or `box-shadow`.** An outline takes no space, so nothing moves when it
  appears; it follows the element's own `border-radius`, so a round control gets a round ring free;
  and a component that already has a `box-shadow` does not have to restate it.

### Focus goes where there is something to do

⚠️ **A tab stop with nothing to do at it is worse than no tab stop.** `CodeBlock` set
`tabindex="0"` and `role="region"` on every block, so a page of ten samples was ten tab stops and
ten landmarks, when four of them scrolled. Neither is set now: **Chrome, Edge and Firefox make a
scroll container focusable exactly when it overflows and has no focusable children**, so the
platform gets this right without help. Safari does not, which is a real gap - and the same gap every
scrolling element on the web has there.

The mirror image is a scroll container that is *not* a region a reader navigates: the panels behind
`Combobox`, `SelectMenu` and `Command` scroll, so Chrome made each a tab stop, but arrow keys
already move the highlight inside them. They carry `tabindex="-1"`.

**A role you do not implement is worse than no role.** `Tree` claimed `role="tree"` and
`role="group"` with no `treeitem` anywhere and `role="button"` on its leaves - a shape no assistive
technology can make sense of. Those are gone; the widget is nested native `<details>`/`<summary>`,
which already announces expanded and collapsed. A full APG treeview - one tab stop for the whole
tree, roving `tabindex`, arrow navigation - is a deliberate non-goal: it would change `Sidebar` from
"every entry is reachable by Tab" to "the nav is one stop", which is a worse fit for navigation.

### Where arrow keys operate

`Menu`, `ContextMenu`, `SelectMenu`, `Combobox`, `Command`, `Tabs`, `Calendar`, `CalendarRange` and
now `Carousel` handle them. `Slider`, `Rate`, `RadioButton` and `Select` get them free from the
native elements they wrap - which is the best argument for wrapping natives in the first place.

Deliberately without: `Pagination`, `Breadcrumbs`, `TableOfContents`, `Steps` and `ButtonGroup` are
sets of independent links or buttons, where Tab is the expected way through and arrows would take
away a stop a reader expects. `DataTable` is a table, not a `grid`, so cell-by-cell arrow navigation
is not owed and would be a large thing to own.

⚠️ **Moving a highlight in a scrolling list means scrolling it into view.** `Combobox` and `Command`
both moved a highlight without it, so arrowing past the visible options moved something nobody could
see and the list looked like it had stopped responding. Both call
`scrollIntoView({block: "nearest"})` now - `nearest`, so a highlight already on screen does not yank
the list around under the reader.

## A control has to be big enough to hit with a finger

**24x24 CSS pixels, from WCAG 2.2 SC 2.5.8, and it is stated in `px` rather than `em`** - the one
place in the package that is right to. Everything else here scales with the consumer's typography
on purpose; a *minimum touch target* does not, because the thing it is sized against is a fingertip
and that does not get smaller when someone picks a smaller body font. An `em` floor would silently
drop under 24px for exactly the consumer whose reader needs it most.

Measured at a 390px viewport before any of this, the package had seven controls under that floor,
the worst being a **10x10** carousel dot. Two techniques, and which one to reach for depends on
whether the control's own size is load-bearing:

| Technique | When | Used by |
|---|---|---|
| Grow the control, draw the visual inside it with a pseudo-element | The visual is smaller than the target and nothing depends on the box | `Carousel`'s dots - a transparent 24px button with the 0.6em dot as `::before` |
| Leave the control, extend the hit area past it with an absolutely-positioned `::after` | Making the control bigger would move the layout | `Tag`'s remove control - a 24px overlay centred on an 18px button, so the chip's height is unchanged |
| A `min-width`/`min-height` floor | The control is already close and has room | `Button` (icon-only ones measured 23px across), `Alert`'s dismiss, `DataTable`'s sort button |

`Slider` needed its own shape: a range input **is** its own hit area, and the track was the input's
background, so the whole control was six pixels tall however big the thumb was drawn. The element is
24px and transparent now, with the bar moved into `::-webkit-slider-runnable-track` /
`::-moz-range-track` and the thumb centred by hand with a negative `margin-top`, which is what
`-webkit-` requires once the track is shorter than the element.

⚠️ **A pseudo-element hit area is invisible to `getBoundingClientRect`, so a box measurement cannot
verify it** - `Tag`'s control still reports 18x18 and is correct. Hit-test with
`document.elementFromPoint`, walking outwards from the centre until it stops returning the control.
A sweep that reads boxes will report the fixed component as still broken, which is how this was
nearly "fixed" twice.

**Drag handles need `touch-action:none` or the gesture never arrives.** The browser claims a touch
drag for panning before any `pointermove` fires, so the component looks correct, listens correctly,
and does nothing while the page scrolls under the finger. `Sidebar` and `DataTable` set it;
`Resizable` did not, which made it mouse-only in practice.

## Interactive means it looks interactive, everywhere

`Tag`'s remove control went from `opacity:0.7` to `1` on hover and nothing else - a signal both
faint and unlike every other control in the package, where the sidebar's chevron, a `Menu` row and
`TextBox`'s clear button all take a background. It has a bounded square, a background on hover and a
focus ring now. **The rule generalises: a control's hover and focus treatment is a property of the
package, not of the component**, so a new one copies the nearest existing control rather than
inventing a signal for itself.

The hover fill is `--background` rather than a step of the ramp, because a `Tag` already carries a
tint of its own type: a neighbouring grey reads as muddy where the page's own background reads as a
clear chip, and it flips with the theme where a fixed `rgba()` would not.

## `ColorScheme` distinguishes what is in effect from what was chosen

`getColorScheme()` returns `light` or `dark` and never `default` - `default` has already resolved by
the time anything can read it. That makes it the wrong source for a picker offering all three:
built on it, a picker shows Light selected whether the reader chose Light or chose to follow a
browser that prefers it. `getColorSchemePreference()` answers the other question.

⚠️ **Behaviour change**: with no stored preference the scheme now follows `prefers-color-scheme`.
It used to fall through every branch in `resetColorScheme` and leave the initial `light` in place,
so a first visit ignored a reader whose browser asks for dark - and `default` was a value that could
be set but was never the starting point, which made the whole option half a feature. The
`prefers-color-scheme` branch was already written; it was simply unreachable for the no-value case.
Note this flips the default appearance for any consumer whose users prefer dark, with no code change
on their side.

## Charts

Six components - `LineChart`, `AreaChart`, `BarChart`, `PieChart`, `Gauge`, `Sparkline` - over two
internal modules, `charts/chart-common.ts` (palette, scales, axes, legend, tooltip, one
stylesheet) and `charts/chart-frame.ts` (the `ChartFrame` base class). Neither internal module is exported; `index.ts`
exports the six components, their attrs types, and `ChartThemeOptions`.

**The set comes from where Ant Design and shadcn/ui agree.** shadcn ships six (area, bar, line,
pie, radar, radial) plus container/tooltip/legend primitives; Ant ships ~25 plus a "tiny" family.
Their overlap, minus what this package already had, is what's here - `Gauge` is shadcn's radial and
Ant's gauge, `Sparkline` is Ant's TinyLine/TinyArea/TinyColumn. **Radar is the deliberate omission**:
both systems ship it, but it is the least reached-for of the six and it needs polar-axis machinery
nothing else here would share. Add it when something actually needs it.

**SVG is built imperatively, never in JSX** - velotype cannot emit `<svg>` at all (gotcha 2), and
velotype's `<SVG innerHTML="...">` can't carry the per-element event handlers hover needs. So
`charts/chart-common.ts`'s `svgEl()` wraps `createElementNS` exactly as `typography/icon.ts` does, and every chart
draws through it.

**Charts size themselves with a `ResizeObserver`, not a scaling `viewBox`.** Scaling one fixed
viewBox is the cheap way to be responsive and it scales the *text* too - microscopic ticks in a
sidebar, oversized ones on a dashboard, in a package whose whole point is consistent typography.
`ChartFrame` redraws at the container's real pixel width instead; `draw()` is therefore called many
times and must be idempotent. `Sparkline` is the exception and is deliberately fixed-size: it is a
glyph that sits inside a table cell, so it has no observer, no axes, no legend and no tooltip.

**Series colours come from `ChartThemeOptions.seriesColors`** - eight slots built from the theme's
four hues at two lightness steps. Never add a hex literal to a chart: it will look right in one
theme and wrong in the other, which is exactly what the never-hardcode-a-colour rule exists to stop.

Details worth keeping if these are ever reworked, each of which looked fine until it didn't:

- A **full-circle pie slice draws nothing** - an SVG arc whose start and end coincide is empty - so
  `arcPath` splits a 360° sweep into two half arcs. A single-slice pie otherwise renders blank,
  which reads as a data bug.
- A **gauge's value arc is inset** when `bands` are set, so the bands stay visible as a rim. Drawn
  full-thickness it covers them completely and `bands` looks like it does nothing. (It did.)
- A **stacked area's lower edge is the previous series' line**, not the baseline; filling every band
  to zero makes them hide each other.
- The **line chart's hit target is one rect over the whole plot**, tracking the nearest category -
  not a target per point. A 2px line is not a pointer target, and this is the single detail that
  decides whether a line chart is usable.
- **Tooltips show each series' own value, never its stacked running total.** "This contributed 12"
  is the fact a reader wants; "the stack reached 40" is not.
- **The tooltip is placed beside the whole cursor-to-marker span, never on it**, flipping left near
  the right edge and going *above* when the container is too narrow for either side. Anchoring it on
  a single point lets it land on the other end of that span, and a plain horizontal clamp in a
  narrow container drops it straight onto the cursor.
- **No chart sets an SVG `<title>`.** It contributes nothing - `aria-label` already wins the
  accessible-name computation - and it makes browsers pop their own native tooltip on hover, slow
  and unstyled and directly in the way of the chart's. This was in the first cut and had to come out.

**Hover does no DOM work when nothing changed** - see "Interaction must only touch the DOM that
actually changed" above, which this is the worked example of. Concretely: the tooltip pools its row
elements and writes through `Text.nodeValue`, the marker line is rewritten only when the nearest
category changes, and `containerBounds()` returns dimensions cached at draw time so the handler
never forces a reflow.

**Accessibility: a hidden data table, not just a label.** `role="img"` + `aria-label` is a weak
ceiling - it gives a screen reader the chart's *name* and none of its numbers. So every chart with
tabular values implements `dataTable()`, the frame renders it into a visually-hidden `<table>`
(caption = `ariaLabel`, row headers per category), and the drawing itself becomes `aria-hidden`:
the table *is* the content, and the SVG is decoration. Values go through the caller's `formatValue`,
so what is read aloud matches the axis. `Gauge` returns `undefined` and keeps `role="img"` + a
label, because one number against a range is exactly what a label already says and a one-row table
would be more structure for less information.

One gallery page covers the whole category (`tests/test_modules/charts.tsx`) rather than one per
component - the thing worth eyeballing is whether the charts look like *each other*.

## Native-element wrapping, not reimplemented widgets

`RadioButton`/`Checkbox`/`Toggle` wrap a real (visually hidden) `<input type="radio"|"checkbox">`; `TextBox`/`Textarea` wrap real `<input>`/`<textarea>`; `Select` wraps a real `<select>`; `Menu` wraps native `<details>`/`<summary>`; `Accordion` wraps a *list* of them, using the native `name` attribute to get exclusive single-open-at-a-time groups for free with zero JS state. None of these reimplement keyboard handling, focus management, or form participation from scratch — the browser gives all of that away for free. When you need a new form control or disclosure widget, look for the native HTML element that already does most of the job before reaching for a hand-rolled ARIA pattern. This does mean accepting the native element's limitations as a documented trade-off rather than solving them with more JS — e.g. `Tooltip` is CSS-only `:hover`/`:focus-within` (no JS positioning library, so it can't reposition to stay on-screen near a viewport edge), and `Menu`'s native `<details>` doesn't animate open/closed. Fixing those is a real, separate, bigger investment — don't build it speculatively as part of an unrelated task.

## `@velotype/velotype` JSX gotchas

These are non-obvious and have each caused a real bug in this package at least once:

1. **`{condition && <jsx/>}` renders the literal text `"false"` (or `"0"`) if `condition` is falsy and not `undefined`.** `RenderableElements` includes `BasicTypes = string | bigint | number | boolean` as directly renderable, so a boolean/number `&&` short-circuit doesn't vanish the way it does in React — it prints. This bit `Breadcrumbs`'s separator (`index < items.length - 1 && <span/>` printed `"false"` after the last crumb). Safe pattern: only use `{x && <jsx/>}` when `x`'s type is `SomeType | undefined` (e.g. `attrs.header?: RenderableElements` — `undefined && X` short-circuits to `undefined`, which *is* silently skipped). For a genuine boolean condition, or anything that could be `0`/`""`, use a ternary with `null` for the false branch: `{condition ? <jsx/> : null}`.
2. **No raw `<svg>`/`<path>` JSX tags.** `tsx-core.ts` explicitly documents this: the generic `<HTML tag="...">` escape hatch "does not support `<svg>` or `<math>`". For inline vector art, either register it through `icon.ts`'s `registerIcon`/`<I i="key"/>` (which builds the SVG manually via `document.createElementNS`), or use the exported `<SVG innerHTML="...">` component, or — often simplest — fake it with pure CSS (`border`/`clip-path`/`transform:rotate`), which is what `Checkbox`'s checkmark, `RadioButton`'s/`Toggle`'s dot, and `Select`'s chevron all do instead of touching SVG at all.
3. **A custom component only forwards attrs its own `XAttrsType` declares** (see Attrs types above) — don't assume passing an arbitrary native attribute through a wrapped component will work; add it to the attrs type first, or drop down to the native tag directly if it's a one-off.
4. **`refresh()` on a `Component` remounts its whole subtree** — see the `Component` class section above for the stale-`ElementHandle` implication when testing, and the section above that for why to avoid calling it at all on a component that accepts children.
5. **`<ClassComponent/>` JSX evaluates to the rendered DOM element, not the component instance.** `Modal`'s `showModal()`/`close()` calling code (`const modal = <Modal .../>; modal.showModal()`) only works because `<dialog>` happens to have those exact method names *natively* - it's not evidence that JSX returns the instance. If you need to call a genuinely custom method later, use `getComponent<T>(<ClassComponent/>)` (from `@velotype/velotype`) to get the real instance, then embed *that* in your tree instead (`Component` instances are valid `RenderableElements` and get unwrapped correctly on insertion). This bit `tests/test_modules/explorer.tsx`: a naive `const preview = <StoryPreview/>; preview.setStoryAndProps(...)` threw `setStoryAndProps is not a function` at runtime, since `preview` was the `<div>` `StoryPreview` rendered, not the instance.
6. **A bare array of sibling children (from `.map()`) needs its own wrapper element if it sits alongside another element in the same parent** - `<div>{singleElement}{arrayFromMap}</div>` (two `{}` expressions as direct children of the same parent, where the second is an array) silently breaks later DOM-reference-based updates to the array's *own* elements: mutating an attribute on an element you got back from that `.map()` (e.g. toggling a class or a `hidden` attribute you stored a reference to) has no visible effect, even though the elements are genuinely present in the DOM with the right content. `Tabs`' rewrite hit this directly - panels built as `{tabs.map(tab => <div>...)}` as a second child of the same wrapper as the tab-button list never responded to `panel.removeAttribute("hidden")`; wrapping the exact same array in its own `<div class="vtd-tabs-panels">{tabs.map(...)}</div>` fixed it immediately, no other change needed. The fix is mechanical: whenever a `.map()`-produced array is a *sibling* of other JSX content (not the sole child of its parent), give it its own single wrapper element rather than leaving it as a bare array child.
7. **A JSX-constructed value assigned to a shared/module-level constant is built exactly once - reusing it in more than one place moves it, it doesn't clone it.** `<Foo/>` evaluates its `Component`/element immediately, at the point the JSX is evaluated; if that result is stored in a `const` at module scope and then embedded in two different trees (e.g. two instances of a gallery component, both handed the same `const rows = [...]` containing JSX in a `content`/`node` field), the *second* one to actually mount steals the underlying DOM node away from the first, leaving the first with nothing there at all (not an error - just silently empty). Symptom: content that's present and correct in one of two supposedly-identical instances (e.g. a dark-theme gallery column) and inexplicably missing in the other. Two confirmed real occurrences: the showcase's `ExampleDoc.node` (now a `() => RenderableElements` factory, called fresh by every page that shows it, rather than a precomputed value - see its doc comment in `docs.tsx`) and a `Tabs` gallery test fixture with a shared `const sampleTabs` array holding a `<TextBox/>`. The fix is always the same: make the value a factory function and call it fresh at each use site, never a shared precomputed constant, whenever a JSX-built value might be displayed/mounted in more than one place.
8. **A native `<dialog>`'s own UA stylesheet caps its size while open**, independent of anything you write: `dialog:modal { max-width/max-height: calc((100% - 6px) - 2em); }` applies unless an author rule overrides it, and - because UA rules always lose to *any* author rule regardless of selector specificity - even a single conflicting property in your own stylesheet (e.g. `max-height:90vh` on the wrong element) is what was silently masking this in `Drawer` for a while: removing that stray rule didn't fully fix a "doesn't reach the true edge" bug on its own, because nothing was left to override the browser's own `calc(...)` cap either. If a `<dialog>`-based component (`Drawer`, `Modal`, `Command`) needs to genuinely fill its container/viewport, set `max-width:none; max-height:none;` explicitly rather than assuming "I didn't set a max-width" means there isn't one.
9. **A component put on the page with a native DOM call never gets its `mount()`** - and never gets its `unmount()` either, so its listeners and its vtKey leak. `el.replaceChildren(...)`, `el.appendChild(...)` and `el.remove()` are not among the paths velotype dispatches the lifecycle from; `setChildren`/`appendChild`/`removeElement` from `core/dom-lifecycle.ts` are. Nothing about the rendered DOM shows the difference, which is what makes this one dangerous - see *Changing the DOM after construction* above for the mechanism, the exemptions, and the Sidebar bug it caused.
10. **Reach `globalThis` through `core/utilities.ts`, not directly.** `addGlobalListener`, `removeGlobalListener`, `dispatchGlobalEvent`, `setTimeoutHelper`, `clearTimeoutHelper`, `requestFrame`, `matchMediaHelper`, `getPathname`, `setHref`, `pushHistoryState`, `getInnerHeight`, `getScrollY` - the same pattern the file already used for `consoleLog` and `setAttributeHelper`. `globalThis` is a global, so a minifier can shorten neither it nor the property after it; these helpers are module-internal, so esbuild renames them to a letter at every call site. They are wrapper *functions*, never `const x = globalThis.foo` aliases - `console.log` tolerates being called unbound, `addEventListener`/`setTimeout`/`matchMedia` throw "Illegal invocation". ⚠️ **The measured payoff is small and it is not the main reason to do it**: across 31 call sites this saved 178 bytes raw and *cost* 82 after gzip, because gzip already collapses 31 copies of `globalThis.addEventListener` into back-references. What it does buy is one place to change and a uniform call shape - and converting them made the compiler surface three sites that would have thrown off a browser, where `matchMedia` genuinely does not exist.

## Testing & showcase harness

Every component gets the same fan-out, even though not every component gets dedicated assertions:

1. `src/<name>.tsx` + `src/index.ts` export (always).
2. `tests/test_modules/<name>.tsx` — a "gallery" page rendering every documented state (disabled/checked/each `type`/etc.) twice, side by side, in `data-theme="light"` and `data-theme="dark"` containers, wrapped in `<TestModulePage>` (adds the "Home page" link + dark-mode toggle), calling `Theme.injectStyles()` and `setThemeOnSelector(...)` on both container ids at module load. Copy the closest existing gallery module's boilerplate rather than writing it from scratch.
3. `tests/deno.json` — one `"bundle-<name>"` task: `deno bundle ./test_modules/<name>.tsx --output ./build/<name>.js --sourcemap=linked` (note: `--sourcemap` requires an explicit value — `linked`/`inline`/`external` — under current Deno; a bare boolean flag errors).
4. Nothing to register. `tests/base_server.ts` scans `test_modules/` through `allModules()` from `bundle.ts`, so a new gallery is served as soon as the file exists - it only filters out `explorer` (the index page) and `module-page` (the shared chrome). A hand-written list beside the scan is how a module once 404'd as a silent 10s test timeout.
5. `tests/test_modules/showcase.tsx` — a short section alongside the other components, for a combined at-a-glance view.
6. `tests/basic_tests.test.ts` gets new `itWrap(...)` assertions **only** for components with real interactive/stateful behavior worth regression-testing (state that changes on click, a value that updates, an open/closed toggle) — not for every component. Purely visual/static ones (`Badge`, `Card`, `Divider`, `Breadcrumbs`, `Navbar`, `Sidebar`, `Spinner`, `Avatar`) are gallery-only, no assertions.

## `Breadcrumbs` borrows both of its extras rather than reimplementing them

Two opt-in features, each modelled on GitLab's Pajamas breadcrumb and each built out of something
the package already has:

- **`BreadcrumbItemType.leading`** puts an avatar or icon beside a crumb. A `RenderableElements`
  slot rather than Pajamas' `avatarPath`, matching `ListItemType.leading` - a consumer is then not
  limited to one shape of thing, and an `Icon`, a `Badge` or an `Avatar` all fit.
- **`maxItems`** collapses the middle of a long trail behind an expander, keeping the root and the
  current page. **The expander is a `Menu`**, so the hidden crumbs get the keyboard handling,
  outside-click close and focus return that component already owns instead of a second, worse copy
  of them.

**Collapsing is by crumb count, not by measured width.** Pajamas collapses when the trail stops
fitting, which means reading layout on every resize to answer a question the caller already knows,
and it makes the same trail render differently on two screens. A count renders the same everywhere
and a test can pin it down.

Adding this surfaced a gap worth keeping: **`Menu` had no `ariaLabel`**, so a menu whose trigger is
a glyph had no accessible name at all. It takes one now, applied to the `<summary>`, which is what
the expander uses.

## `Sidebar` is the navigation panel, and the showcase must not have its own

The showcase grew a collapsible icon rail, category icons, an active-page marker and a filter - all
of it in `showcase/src/app-shell.tsx`, none of it in the component a consumer would reach for. That
was the failure this file's "showcase is built out of this package" rule exists to prevent, and it
went unnoticed for three changes. **If a navigation behaviour is worth having in the showcase, it
belongs in `Sidebar`.** What is left in the showcase is its own placement of the component, the
search box, the category label and the per-category count.

`Sidebar` is a class, and builds on `Tree` for its groups rather than repeating a disclosure - the
animation, the keyboard handling and the open-state API all come from one place.

### One row, one element, and it is the link

`Sidebar` deliberately does **not** use `Tree`'s `leading`/`trailing` slots. They are siblings of
the label, so a link in the label covers only the text between them - the icon on one side and the
count on the other belong to the row instead, and on a group that means the row's two actions are
interleaved at the pixel level: navigate here, toggle there, navigate again. `#buildRow` puts the
icon, the label and the trailing slot inside one element, and that element *is* the `NavLink` when
the entry has a `to`. The chevron toggles; everything else is a destination you can click anywhere
in, middle-click, or copy the address of.

**The padding belongs to that element, not to the container.** Padding the `<summary>` instead
leaves a ring around the row that still toggles, which is the same interleaving one layer out. Both
containers give their padding up entirely.

**The hover belongs to the two controls, not the row.** `Tree` gives every row a hover, which is
right for a tree and wrong here - one wash across a row holding two separate controls says they are
one. Suppressed on the container, the row lights under the link and the chevron lights under the
chevron, so which one a click is about to reach is visible before it happens.

**This is also what marks the group on a category page.** `#syncActiveGroup` asks whether a group
contains a `.vtd-nav-link-active`, and a plain `Link` never claims to be one - so a sidebar whose
category labels were `Link`s could mark the group while a *component* page was open and had nothing
to say while the reader was on the category's own page. Giving the group a `to` makes its row a
`NavLink` and the two cases become one mechanism.

**And it settles what a click on the rail means.** Collapsed, the icon is the only thing there. If
the row toggles, clicking it opens a group whose children are not rendered - nothing the reader can
see happens. If the row navigates, it goes to the group's own page.

### Nothing on the rail leaves layout, and that is what makes it animate

This replaced four different hiding techniques, each of which was got wrong at least once and
each of which *jumped*: the labels were taken out of flow with `position:absolute` + `clip-path`,
the chevron and a group's children with `display:none`. Every one of those lands in the frame of
the click, while the panel then spends 180ms sliding - which is exactly what the reader sees as
the text popping in and out.

The rule now is one idea: **a row is a flex line whose text may shrink to nothing while the icon
holds its size**, so narrowing the panel squeezes the text out continuously, and each piece only
has to fade. Four declarations do it, and none of them is optional:

| Declaration | On | Without it |
|---|---|---|
| `min-width:0` + `overflow:hidden` | label, count, account text | A flex item will not shrink below its content, so the row overflows and the icon is pushed off the rail |
| `white-space:nowrap` | label | A wrapping label at 56px makes its row taller than its neighbours - the drift this component keeps rediscovering |
| `max-width:0` on the rail | the same three | Flex stops shrinking the moment the line *fits*, so the label keeps whatever is left over. On a group's row that is a pixel; on a **leaf** row, which has no padding of its own because its link is the whole row, it was 19px, and the icon sat hard against the leading edge |
| `flex-shrink:0` | the icon box | The icon shrinks along with everything else and the rail has nothing on it |

Two pieces still hide rather than shrink, and both are the right call:

- **A group's children** collapse the grid track `disclosure-view.tsx` already animates
  (`grid-template-rows:minmax(0,0fr)` + `visibility:hidden`). `visibility` alone keeps their
  height, so the rail grows a blank stretch where a group's entries were - measured, a 236px gap
  among 49px ones. `display:none` has no such gap and no animation either.
- **The header's full content** hides with `visibility`, the one place the box is wanted: keeping
  it is what holds the header's height, so collapsing moves the entries sideways rather than up.

⚠️ **Neither `checkVisibility` nor `getBoundingClientRect` answers "is this hidden" on its own
here, and each misses the piece the other catches.** A group's child is clipped by a zero-height
track, so it keeps a full-size box and only `visibility` gives it away; a top-level link is capped
to zero width and faded, so it stays visible to `checkVisibility` and only the box gives it away.
Require both. And measure the label *slot* rather than the link inside it - the link reports its
own 18px of padding from inside a container that is clipping it.

**Testing a transitioned end state means switching transitions off.** Every part of the rail is now
reached by a transition, and a transition never advances in this suite, so a measurement taken
after the click reads the *pre-collapse* value and the test passes however wrong the component is.
Inject `*,*::before,*::after{transition:none !important}` before the interaction and
`getBoundingClientRect` reports what the rules actually declare; leave whether the motion happens
at all to a standalone script, where `requestAnimationFrame` ticks.

**Row heights must not depend on which state you are in.** The icon box is a fixed square stated
in the *row's* em (`width:1.15em` at `font-size:1.365em`) so that *it*, not the label, is the
tallest thing in a row - which makes an expanded row and a collapsed one the same height by
construction rather than by a `min-height` that only matches at one font size. Stating the box in
the row's em rather than the icon's own is also what lets the glyph size change without changing
the row: it was scaled up by a transform on the rail only, so the icons grew as the panel closed
and shrank as it opened, a size change nobody asked for. Two bugs hid behind this: a group's row
carried the padding twice, once on the `<summary>` and again on the label span inside it, and the
`min-height` rule aimed at `.vtd-tree > li > .vtd-tree-label` never matched anything, because a
branch's `<summary>` lives inside the `<details>` rather than directly under the `<li>`. Its
computed value was `0px` in both states.

### What floats the rail back out is a list, and it is written once

Four separate states expand a collapsed sidebar, and a rule that misses one is a bug you only find
by doing the exact thing it missed. They live in a `floatTriggers` constant interpolated into every
rule that depends on it - `:not(...)` for the rail, `:is(...)` for the floated panel - because
there is no way to keep four hand-copied compound selectors honest:

- `:hover` and `:has(:focus-visible)` - the pointer and the keyboard.
- `.vtd-sidebar-resizing` - **a drag leaves the sidebar by definition.** Dragging the trailing edge
  wider moves it out from under the pointer, and without this the panel collapsed mid-drag with the
  button still held down.
- `:has(.vtd-menu[open])` - an open account menu. Without it the menu was left standing over the
  page with the panel gone from under it, clipped to 56px.

**`:focus-within` is the wrong test** and is deliberately absent: the collapse control is inside the
panel, so a mouse click on it leaves focus inside and holds the panel open until the reader clicks
somewhere else entirely. A mouse click does not set `:focus-visible`.

**No `setPointerCapture` on the drag handle.** It looks like the right call for a drag and it is
not needed - the move and up listeners are on `document`, which already sees the pointer wherever
it goes - and it throws outright on a `pointerId` that is not currently active, which turns a
synthetic `pointerdown` (how a test drives this) into a handle that does nothing at all.

**The panel does not hide its overflow.** Once every piece of it narrows along with it there is
nothing left to clip, and clipping cost more than it saved: the account menu opens a submenu
*beside* its own row, past the panel's trailing edge, and a clipping panel cut it in half. The two
places that genuinely have to clip - the scrolling body, a folding header or footer - do it
themselves.

### The collapse state belongs to CSS, not to an inline style

`#syncCollapsed` sets a `--vtd-sidebar-width` custom property and toggles a class; every actual
width is a rule reading that property. Setting `width` inline instead - which is what it did first -
pinned the panel open: **an inline style beats a class**, so the collapsed rule could never narrow
the panel and `:hover` could never widen it. Collapsing shrank the gutter and left a full-width
panel sitting over the page.

**`:focus-within` is the wrong test for "should the rail stay open".** The collapse control lives
inside the panel, so clicking it leaves focus inside and holds the panel open until the reader
clicks somewhere else entirely. `:has(:focus-visible)` is the right one: a mouse click does not set
`:focus-visible`, so the click collapses immediately, while tabbing in still expands.

**A control that resizes the panel has to live inside the panel.** Against the rail the drag handle
tracked the *gutter*, so once collapsed it sat at 56px and stayed there while hovering floated the
panel out to full width - a drag target stranded 200px from the edge it resizes.

### A component never sets `position` on its own root

`position` answers "where does this sit on the page", which belongs to whoever places the
component. `Sidebar` needs a containing block for its absolutely-positioned panel and resize
handle, and took it from its own root - which put it in direct competition with the consumer over
one property.

**The consumer loses that competition every time, and it is not close.** Their class and
`.vtd-sidebar` have the same specificity, so the later rule wins - and a component's stylesheet
mounts when the component is *constructed*, which happens inside the consumer's own render. The
component's rule is always later. The showcase asked for `position:sticky`, got `relative`, and its
leftover `top:53px` then offset the sidebar 53px *downward* rather than pinning it: it sat below
the header with a gap and scrolled away with the page. Two visible bugs, one silently lost
declaration.

**The fix is an element the component owns outright, not a specificity trick.**
`.vtd-sidebar-rail` sits inside the root and is the containing block; the root sets no `position`
at all, so a consumer may use `sticky`, `fixed`, `static` or nothing and none of it has to
out-specify anything. `:where(.vtd-sidebar){position:relative}` was tried first and is worse: it
makes the declaration beatable by *any* selector, so an unrelated consumer rule can silently take
away the containing block the panel depends on.

The rule generalises past `position`: **if a component needs a property that describes where or how
big it is on the page, it needs its own inner element to put it on.** The root carries what the
component *is*, never where it goes. `width` is the exception here and is why `defaultWidth` exists
as an attr - the collapse behaviour has to own it, so it is set as an inline style and documented,
not left in a stylesheet for a consumer to fight.


Four things it does that a list cannot, each one optional and each with a trap behind it:

- **`collapsible`** shrinks it to a rail of icons that floats out over the page on any of the four
  `floatTriggers` above. ⚠️ **The children of an expanded group collapse their grid track, never
  `visibility:hidden`.** Under `visibility` they keep their height, so the rail grows a blank
  stretch where a group's entries would have been - measured, one 236px gap between icons that are
  otherwise 49px apart. Every top-level row also takes a `min-height`, because a group's row is
  naturally taller than a plain link's and that difference reads as a wobble once the labels are
  gone.
- **The active *group*** is marked, not just the active page. On the rail there is no label and no
  open group to show where the reader is, so without it the sidebar names the current page and
  gives no clue which section it belongs to. `NavLink` decides what is active; `#syncActiveGroup`
  only asks which group contains it, so the two cannot disagree. It is drawn as a leading bar
  rather than a fill, so it survives the label being gone.
- **`resizable`** drags the trailing edge. `Resizable` is deliberately *not* reused: it owns the
  width of what it wraps, and this has to reconcile a dragged width with a collapsed one - two
  owners of one property fighting over it.
- **`profile`** pins an account row that opens a `Menu`, so it gets that component's keyboard
  handling, submenus and dividers instead of a second copy. Its list opens *upward*; it sits at the
  foot, and downward is off-screen.

**`setItems` exists so a filterable sidebar is possible at all.** Re-rendering to re-filter
destroys the `header` along with everything else - which is where the search box lives, so the
reader loses focus after one character. Only the body is rebuilt; the header, the profile row, the
collapsed state and the dragged width survive. The open/closed state does not, because the entries
are new - read it off `getTree()` first and put it back through `defaultOpen`, which is what a
filter wants anyway since it must force open whichever groups still hold a match.

**`onToggle` is how a consumer keeps that state.** Migrating the showcase onto the component
dropped it at first, and the reader's expansions stopped surviving a filter - caught by a check,
not by review. Like `Tree`'s, it fires *after* the change, so reading `getOpenKeys()` inside it is
safe.

**The collapse control is an icon, not a word** - a double chevron drawn in CSS that flips to point
the way the panel will move, the same call `Checkbox`'s tick and `Select`'s arrow make. A word
there would be an English default, which this package does not do.

## `Menu` nests, and a divider belongs to the entry below it

Two additions, each with a choice worth keeping:

- **`children` makes an entry a submenu parent, and its own `href`/`onClick` are ignored.** An
  entry that both navigated and opened a flyout would fire whichever the pointer reached first.
- **`dividerBefore` sits on the entry *after* the rule, not as an entry of its own.** A divider in
  the array would force `label` to become optional, weakening every other entry's type, and would
  let a menu open or close on a stray rule. A `dividerBefore` on the first entry is ignored, so a
  group's first item can carry it unconditionally.
- **`selected` makes an entry one of a radio group, scoped to its own list.** `Menu` moves the tick
  itself on a click rather than taking new items back from the consumer: a rebuild would close the
  submenu the entry lives in, which is the one thing `keepOpen` exists to prevent. Scoped to the
  list because a menu may hold two groups - a sort order and a density - and a selection that
  reached across the whole menu would clear the other one on every click. `undefined` is not
  `false`: `false` is an unselected member of a group, `undefined` is an ordinary entry with no
  tick, no space reserved for one, and the plain `menuitem` role.
- **Pass `selected` a function when anything else can change the same setting.** A boolean is a
  reading taken when the menu was built, and a second control for the same setting leaves it
  describing a state that is no longer true - a wrong indicator is worse than none. A function is
  re-read on every open, so two controls over one setting both stay honest without either knowing
  the other exists. ⚠️ The tick is rendered *inside* the entry, so `innerText` reads
  `"(tick)Compact"` whether or not that tick is the visible one. It is `aria-hidden`, so the
  accessible name is unaffected - but a test matching on `innerText` will not find the row, and two
  of mine did not.
- **`keepOpen` leaves the menu, and the submenu the entry sits in, open after the click.** Closing
  is right for navigation - the menu is gone with the page - and wrong for an entry that acts in
  place: a theme or density switch takes effect at the moment the control disappears, so trying it
  both ways costs a second trip through the menu. Off by default, because navigation is the common
  case.

**The navigable set is queried from the DOM on every keypress**, not captured at construction:
opening a submenu changes what is reachable, so a list built once either skips the submenu's
entries or offers entries nobody can see. `#navigableItems()` filters on
`checkVisibility({checkVisibilityCSS: true})`, which is also what a test should assert against -
"is it in the DOM" is not the same question.

**Pointer and keyboard drive one open state, a class, rather than a `:hover` rule plus a scripted
one.** Two mechanisms race: the pointer can open one branch while the keyboard has another open,
and neither knows about the other. `Escape` unwinds one level at a time, which is the APG
behaviour - inside a submenu it closes that submenu and returns focus to the row that opened it,
and only then closes the menu.

## `Tree` is a class, because its open state has to be readable from outside

`Tree` is the one data-display component that is a `class Component` rather than a
`FunctionComponent`, and the reason is a filterable tree. A filter has to be able to reveal the
branch holding a match, and to put the reader's own expansions back when the filter clears - so
something outside the component has to be able to read and drive the open state. Reading
`<details open>` out of the DOM would work and would make every consumer depend on the markup this
component happens to emit, so it is an API instead: `isOpen`, `getOpenKeys`, `getBranchKeys`,
`setOpen`, `setOpenKeys`, `reveal`.

**Never call `refresh()` in it.** `label` is `RenderableElements`, so it can hold a consumer's own
components; every method does a targeted DOM update on the one `<details>` it addresses.

Four things here were found by putting the showcase's sidebar on it, and each is the kind of thing
only a real consumer surfaces:

- **`onToggle` must fire from the element's own `toggle` event, not from the click handler.** A
  click handler runs *before* the browser applies the new state, so the obvious `onToggle` body -
  read `getOpenKeys()` and store it - silently sees the state as it was a moment ago. The sidebar
  lost every expansion that way. `toggle` fires after the flip and also covers `setOpen` and a
  sequenced close landing a transition later, so there is one honest report per real change.
- **A leaf with no `onSelect` is not a button.** It used to render `role="button" tabindex="0"`
  whether or not anything was listening, so a keyboard user could focus it and press Enter to no
  effect. Leaving `onSelect` unset is now meaningful: the leaf is a plain container, which is what
  lets a `NavLink` in `label` own its own click instead of being a link inside a button.
- **`reveal(key)` exists because `setOpen` alone is not enough.** Opening a branch whose ancestor is
  closed leaves it open and invisible, which on screen is indistinguishable from nothing happening.
  `reveal` walks the ancestor chain, and accepts a leaf's key so a caller can name the thing that
  actually matched.
- **`getOpenKeys()` reports document order, parents before children**, which needs its own
  `#branchOrder` array: a branch can only register itself *after* its children are rendered,
  because it needs the content element they build, so iterating the map alone reports the deepest
  node first.

**The chevron is a real element, not a `::before` on the `<summary>`.** A pseudo-element has no hit
area of its own, so every click on the row had to mean the same thing - which is fine for a tree and
breaks the moment a row is also a destination. The label's link then covered only the pixels its
text happened to occupy while the entire rest of the row toggled, so the two actions were neither
distinguishable nor equally easy to hit, and the one that was a *destination* had the smaller
target. With an element the arrow gets a 1.25em box and its own hover, and a consumer can hand the
whole rest of the row to a link. It stays inside the `<summary>`, so toggling is still the browser's
own behaviour and needs no handler. A leaf's `margin-inline-start` has to match the chevron's full
width or leaf content sits left of every branch's label.

`leading` and `trailing` slots match `ListItemType`'s, and **`trailing` is not a leading slot moved
with CSS `order`** - the showcase's category counts sit at the far edge, and reordering visually
would have left a screen reader announcing "3 Typography". The row is `display:flex` for the same
family of reason: with either slot the label becomes a block-level flex container, which a
`display:block` summary pushes onto the line below the `::before` chevron, stranding the chevron
above the label.

⚠️ Writing that last comment reintroduced **the backtick-in-a-CSS-template-literal bug for the
fourth time**. It was invisible because the build output had been piped to `/dev/null` - `deno
check` had not been re-run either. Don't discard build output.

**It has now happened ten times.** The tenth was a comment explaining a navigation race, written
into the `page.evaluate()` literal it was explaining - `` `waitForSelector` `` closed the string.
Caught by `deno check` one command later.

**And nine times before that.** The ninth was a prose comment written *into the showcase's
page-shell template literal* while adding the import map - three backticked specifiers inside
`pageShell`, which ends the literal and turns the rest of `server.ts` into a syntax error. Caught
immediately only because `deno check` was run on the file straight after writing it. The eighth was
not in CSS either - it was a prose comment
inside the template literal passed to `page.evaluate()` in `basic_tests.test.ts`, where a
backticked `` `selected` `` closed the string and produced `SyntaxError: Expected ',', got
'selected'` from a line that looked like a comment. The rule is about template literals, not about
stylesheets: **no backticks in any comment that lives inside one**, and that includes every
`page.evaluate(...)` body in the test suite. A guard for this is still worth writing.

## `TableOfContents` takes items, and watches with an observer

The entries are data the consumer passes, not headings scraped out of the DOM. Deriving them looks
convenient and is a lifecycle hazard - it has to run after the content it describes is mounted and
silently yields an empty list when it doesn't. The page already knows its own sections; the
showcase builds its list from the same `ComponentDoc` it renders, so the two cannot disagree.

**Which entry is current comes from an `IntersectionObserver`, never a `scroll` listener.** A
scroll handler fires at display rate and would read layout on every event to answer the same
question - exactly what "Interaction must only touch the DOM that actually changed" rules out. The
observer reports only on a crossing, and `#setActive` still returns early when the entry is
unchanged, so scrolling the length of one long section produces **zero** mutation records.

One case needs scroll geometry anyway, and it is worth knowing before someone "simplifies" it away:
**a page that ends shortly after its last section clamps the scroll before that section can reach
the band**, so some earlier section stays in it and the final entry could never highlight however
far the reader scrolled. `#isScrolledToBottom` is checked *first* for that reason, guarded by a
scrollable check - on a page too short to scroll, every position is "the bottom", and without the
guard the highlight would pin to the last entry forever.

## A column width belongs on the column, not in the consumer's CSS

`Table`'s `TableColumnType.width` takes a number (px, matching `DataTable`'s) or any CSS length
string, so `"15%"` and `"12em"` work - `DataTable` is px-only because it does arithmetic on the
value mid-drag, and nothing in `Table` is resizable.

**Declaring a width on any column switches the whole table to `table-layout: fixed`**, and that is
the part worth knowing: under the browser's default auto layout a column is sized to its widest
cell and a declared width is only a hint, so one long value still widens its column and squeezes
its neighbours. The attr would appear to do nothing in exactly the case you reached for it. Under
fixed layout the columns that declare no width share what's left, headers stop being `nowrap` and
cells break long words - without those two, a narrow fixed column's content overflows its own cell.
A table that declares no widths gets neither the class nor a `<colgroup>`, so nothing changes for
every existing caller. The showcase reached for consumer-side `nth-child` CSS first; that was the
wrong layer, and the fix belonged here.

## `CodeBlock` highlights with its own scanner, on purpose

`data-display/code-block.tsx` holds a ~60-line tokenizer rather than importing Prism or
highlight.js, because a highlighting library is a runtime dependency and this package has none.
`CodeLanguage` is therefore three values - `tsx` (which also covers TS, JS and JSON), `css`,
`plain` - not thirty: a grammar that is good enough to read and honest about its limits beats one
that claims thirty languages and gets most of them subtly wrong.

Two properties matter more than the colours, and both have tests:

- **Tokenizing is lossless.** Every character of the input lands in exactly one token, including
  the gaps no branch matches - those are emitted as unstyled text before the next match. A scanner
  that drops them looks perfect until someone copies the snippet and it will not compile; deleting
  that one `if` makes the whole sample render as `import{Button,Stack}from"..."` with every space
  and newline gone, which is what the test asserts against.
- **Line numbers are a CSS counter**, not a column of text, so selecting the block copies the code
  alone. Regrouping tokens into lines has to *split* runs that straddle a newline (a block comment,
  a template literal) rather than assume tokens and lines align - they don't, and assuming so drops
  the middle of every multi-line comment.

**The highlighter knows whether it is looking at code or at the prose between JSX tags**, and it
has to. Without that, a sentence inside `<Paragraph>` got the code treatment: `of`, `set`, `as`,
`for` and `in` are ordinary English *and* TypeScript keywords, so half a sentence lit up; an
apostrophe in "package's" can pair with a later one and paint prose as a string; and a digit in a
sentence became a number. `tokenize` therefore tracks element depth, whether it is inside a tag's
angle brackets, and `{}` nesting - and suppresses keywords, strings and numbers in text. It is not
a parser and must not become one.

Three traps in that state machine, each of which produced the *opposite* symptom - real code
rendered as prose - and each found only by checking a specific snippet rather than by eye:

- **A generic is not a tag.** `getComponent<Command>` counted as an opening element, so the depth
  never came back down and every keyword after it was treated as text. A tag's `<` never directly
  follows an identifier, `)` or `]`. ⚠️ **But that test cannot be a lookbehind in the pattern**,
  which is how it was first written and how it stayed wrong for the case it could not see: inside
  JSX text an element routinely butts straight against the words beside it, so
  `<div>Above<Divider/>Below</div>` lost `Divider` entirely - and with no opening tag recognised
  there was no `insideTag` for the following `/>` to close, so the depth stayed up and the rest of
  the snippet was treated as prose (the `"vertical"` in the next example lost its string colour to
  the same cause). The answer depends on state a pattern cannot see, so the guard belongs in the
  handler: **inside JSX text a `<Name` is always a tag, because a generic cannot appear there.**
  This is the same case `</` already had its own branch for; the opening half was simply missed.
- **A closing tag is not ambiguous, and routinely follows text with no space** - `Open</Button>`.
  It gets its own branch with no lookbehind; applying the generic guard to `</` lost every closing
  tag that touched its content.
- **`>` inside braces does not end a tag.** The `=>` in `onClick={() => ...}` ended the tag early,
  after which the real `/>` no longer closed the element - same stuck depth, different cause. Only
  a `>` at brace depth zero closes a tag, so braces are counted inside tags too.

Do not reach for brace-balancing to parse this file's own source. An apostrophe in JSX prose
("doesn't") reads as a string delimiter and swallows the rest of the file - that is why the
showcase's snippet generator keys off line structure instead.

### `showcase/` is built out of this package, deliberately

**The showcase loads three modules, the way a consumer's page does: velotype, velodesign, and the
app.** It imports `@velotype/velodesign` by name like any other consumer - not by relative path -
and the bundle task holds both the framework and the library out of `main.js` with `--external`, so
an import map resolves them at runtime. All three are minified.

That is not a demo detail. **It is the only place velodesign is exercised across a real module
boundary**, and the failures that boundary produces are invisible everywhere else: a duplicated
framework, a stylesheet registry that exists twice, a specifier that resolves one way here and
another way for a consumer. Both bugs found while building it were of exactly that kind, and
neither showed as an error on the page.

Sizes served, which is also what a consumer downloads:

| Module | Minified |
|---|---|
| `velotype.js` | 10.6 KB |
| `velodesign.js` | 160.0 KB |
| `main.js` (the showcase itself) | 202.2 KB |

`velodesign.js` is bundled with the **root** config (`--config ../deno.json`), not the showcase's.
Built under the showcase's it would compile against the showcase's `jsxImportSource` and emit 73 jsx
import statements instead of one - the same asymmetry described under the bundle size below.

Three pieces make the framework module work, and each one matters:

- `showcase/src/velotype-module.ts` is a one-line `export *` that exists only to be a bundle
  entrypoint. `deno bundle` resolves an entrypoint as a **file path rather than through the import
  map**, so bundling velotype directly means writing `jsr:@velotype/velotype@0.0.30` into a task and
  keeping that in step with the `imports` entry by hand. A local module is resolved the ordinary way
  instead, so the version stays declared once.
- `main.tsx` is bundled with `--external` for velodesign *and* both velotype specifiers, so it ships
  bare specifiers a browser cannot resolve on its own. ⚠️ `--external` matches the specifier as
  written, **before** the import map resolves it - which is why `@velotype/velodesign` can be held
  out even though `showcase/deno.json` maps it at a local path, and why a bare specifier cannot be
  used as a bundle *entrypoint* (there it is resolved as a file path and nothing matches).
- `server.ts`'s shell carries the import map that resolves them. **Both specifiers point at one
  file**, because velotype's `.` and `./jsx-runtime` exports are the same module - and they have to
  stay one entry between them, or two module instances exist.

⚠️ **`jsxImportSource` must be spelled the same way `--external` is, or the jsx runtime is silently
inlined and a second velotype exists.** The showcase's was `jsr:@velotype/velotype`, which emits
`jsr:@velotype/velotype/jsx-runtime` - not the specifier `--external` was given - so 12 of
velotype's 25 exports, including `Component`, `createElement`, `registerEventListener` and
`emitEvent`, were bundled into `main.js` alongside the external copy. Two registries of element and
event state, side by side. It is now the bare `@velotype/velotype`, matching the root `deno.json`.

A second one of the same family: `showcase/src/data/docs.tsx` reaches into
`tests/test_modules/explorer-schema.tsx`, which imported velodesign by relative path - so the entire
library was inlined into `main.js` *and* imported from it. That file names the package now.
`main.js` went from 359 KB to 202 KB.

**No browser check can see either of them**, which is the part worth remembering. A duplicate is
tree-shaken down to whatever the importer actually reaches, so the page renders correctly, mounts
every sheet exactly once, and logs nothing. The check has to be a build-time one over the emitted
bundles - and ⚠️ **it has to be a content signature, not a list of declared names**: everything is
minified, so an inlined copy keeps none of its original identifiers. Two checks were written before
one worked, and **both earlier ones passed against the bug they were written for**:

| Check | Why it passed anyway |
|---|---|
| Duplicate adopted stylesheets, counted in the browser | The duplicate carries no stylesheet state |
| `main.js` declares none of `velotype.js`'s export names | Minification renamed every one of them |
| **String literals only minification cannot touch** | Works - `"vtd/Button"` and 67 siblings for velodesign, `adoptedStyleSheets` / `"Invalid tag"` / `"vtwith"` for velotype |

The velotype signature needs all three literals rather than just `adoptedStyleSheets`, because a
partial duplicate - only the jsx factory, which is what the `jsxImportSource` bug produced - never
reaches the stylesheet code. `"Invalid tag"` lives in `createElement`, which any duplicate must
carry.


The showcase app is a real consumer of velodesign, not a page that merely displays it: its chrome
and every page are `Navbar`/`NavLink`/`Heading`/`Text`/`Paragraph`/`Stack`/`Grid`/`Link`/`Empty`,
and what's left in its own `setStylesheet` blocks is six `display:flex|grid` rules, each a piece of
structural glue no component owns (the shell's `100vh` column, the sidebar's sticky scroll column,
the dotted example frame) and each carrying a comment saying so. **Keep it that way** - it is the
only place the package is used the way a consumer uses it, and it earns its keep:

- Dogfooding is what found four gaps in `Tree` (see its section above) the moment the sidebar nav
  moved onto it - including an `onToggle` that reported a frame early and a leaf that claimed to be
  a button with nothing listening.
- Dogfooding is what found `Link` rendering an `<a>` with **no class at all** - the one component a
  consumer had nothing to target, against this file's own "never a bare unprefixed class" rule. It
  emits `vtd-link` now, still with no stylesheet of its own.
- A page reaching into a component should target its **class** (`.vtd-heading-2`), never the tag it
  happens to render (`h2`). The tag is an implementation detail; the class is the API.
- `Stack` does not replace *everything*. A row that must be a `<label>` (so clicking the text
  focuses the control) stays a `<label>`, because `Stack` renders a `<div>` - theme-builder's
  colour fields are the worked example.

**Stacking: the page content is one layer, and the chrome is one step above it.** That is the
whole of the showcase's stacking story - `isolation:isolate` on `.vtd-showcase-main`, and
`z-index:1` on the two chrome elements (header and sidebar wrapper), which never overlap each
other so they share a value.

It replaced two values that looked reasonable and did nothing. **A `z-index` is meaningless unless
you know which stacking context it lands in**, and this bug is the worked example:

- The sidebar panel carried `z-index:3`, but its wrapper is `position:sticky`, which *is already a
  stacking context*. So the 3 ranked the panel against its own siblings inside the sidebar and said
  nothing about the sidebar versus the page.
- `Button` is `position:relative`, because it hosts its loading spinner. Two positioned elements at
  `z-index:auto` paint in **DOM order**, and `main` comes after the `aside`. So every button in the
  page painted over the expanded sidebar, and no number on the panel could have changed it. The
  reported symptom was Save and Cancel sitting on top of the hovered sidebar on the Stack page.

⚠️ **`isolation:isolate` alone does not push content *down*.** A stacking context on a
non-positioned element paints where `z-index:0` would - which is *after* an earlier positioned
sibling, not before it. Isolating `main` on its own made the overlap slightly worse, and the check
caught it. Isolation's job here is containment: it stops `DataTable`'s `z-index:1000` column menu
ranking itself against the site header. Getting the chrome above the content still takes the one
`z-index`.

**That last `z-index:1` is not avoidable without a worse trade.** Same-level positioned elements
paint in DOM order, and the sidebar precedes `main` because it is navigation. Moving it after
`main` would fix the paint order for nothing - and a keyboard user would then tab through the whole
page to reach the nav. The declaration is cheaper than that.

**The library still carries 18 `z-index` values, eight of them `1000`** (`Popover`, `Menu`,
`SelectMenu`, `Combobox`, `Popconfirm`, `ContextMenu`, `DataTable`'s column menu, `Toast`). Those
are the ladder this rule exists to discourage: `1000` means "win", which is only true until
something else says `1001`. They work today because consumers rarely isolate their layouts - and
the showcase now does, which is the honest test of whether they were ever right. Worth revisiting
as each is touched.

**`TextBox`'s `clearable` is off by default, and that is a decision rather than caution.** One
component covers every kind of field; most are typed once and submitted, where a clear control is
noise and on a password field worse than that. It earns its place on a box the reader edits
repeatedly and abandons - a search or filter - and those know who they are. Turning it on wraps the
input, so the root becomes a `<span>` and **the consumer's `class` lands on the wrapper**; the
`.vtd-text-box` class stays on the input either way, which is what a stylesheet should target.
Whether the control shows is decided by `:placeholder-shown`, so a clearable field with no
placeholder gets one of a single space - without any placeholder that selector never matches and
the control would never appear.

**A filter has to show *what* matched, not just that something did.** The sidebar's entries run
their names through `highlightMatch` - the same helper `Combobox`, `Command` and both tables use,
now exported from `index.ts` alongside `searchHighlightCss` so a consumer building their own
filtered list gets the same treatment rather than reinventing it. A filtered list that only gets
shorter makes the reader re-derive the match themselves.

**A category name is a search term too, and it is the one a reader who does not yet know a
component's name actually has.** Typing "chart" found nothing while every chart sat one level down
inside a category called Charts. A category that matches keeps *all* of its components rather than
the four whose names happen to contain the word - the match is the category itself - and the mark
goes on the category label, which is what says why the entries under it are there. A check that
demands a mark on every surviving entry is wrong for that reason and had to be relaxed to "marked,
or under a marked category".

**The sidebar collapses to a 56px icon rail and floats back out on hover**, like Datadog's. Three
details are load-bearing:

- The panel is `position:absolute` inside the sticky wrapper, so expanding it lays it *over* the
  page. Growing the wrapper instead would shove the content sideways every time the pointer
  crossed the rail, which is unusable.
- `:has(:focus-visible)` expands it as well as `:hover`, or the sidebar is unreachable from the
  keyboard - and so do a drag in progress and an open account menu. See `floatTriggers`.
- Collapsed rows shrink and fade rather than leaving layout: the rows keep their boxes so nothing
  jumps as the panel slides, and a screen reader still reaches the labels.

The toggle flips one class and persists to `localStorage`. It deliberately does **not** re-render
the sidebar - that would discard the reader's expansions and their search for a change that is
purely presentational.

**Every category has an icon, drawn in `showcase/src/data/category-icons.ts`.** They are single
paths in a 24x24 box because that is all `Icon` carries, and solid silhouettes because a shape with
a hole needs its inner subpath wound the opposite way to punch through under `nonzero` - easy to
get subtly wrong, and it renders as a filled blob when it is. On the rail the icon *is* the row, so
it is not decoration.

**A component page documents `children` in its own section, never as a row in the attributes
table.** Children are passed by nesting content inside the tags; listing them beside real named
attributes told the reader to write `children={...}`, the one thing no component here accepts.
`ComponentDoc.children` carries that prose, and only the 8 genuinely *named* attrs that happen to
end in `Children` (`confirmButtonChildren`, `columnToggleChildren`, …) stay in the table.

**A named type an attribute refers to gets its own documented shape.** A row reading
`items: AccordionItemType[]` gave the reader a name and nothing else. `ComponentDoc.types` carries
those shapes, rendered below the attribute table with *the same columns* - a field of
`AccordionItemType` is the same kind of row as an attribute of `Accordion`, and a table that looked
different would suggest otherwise, so both call `attrColumns()`. `typeDefinitions` holds each type
once and `componentTypes` maps components to them, because the three cartesian charts all point at
`ChartPointType` and a copy per component is how copies drift. Read the fields off the real
`export type` rather than from memory - two of them are a shared base intersected with per-table
additions and are easy to get wrong.

**Headings step one level at a time, in the contents and in the outline.** A level-2 entry with no
level-1 above it has nothing to nest under, which is what an "Examples" heading fixes: the page is
`h1` name → `h2` Examples → `h3` each example, and the contents mirror it. The example labels are
real `<h3>`s styled back down to caption weight rather than loose `Text`, so the document outline
can see them at all.

**A default belongs in the `defaultValue` column, never mid-sentence in the description.** The
table is scanned, not read, and "what happens if I leave this out" was buried in prose.

**An attr has a default whenever the component behaves as though one were passed, whether or not
the source writes it down.** The clearest case is an optional boolean: `disabled` unset is falsy,
so `Button` behaves exactly as if given `false`, and an em dash there hid a fact the reader needed.
All 38 such rows now say `false`, which took documented defaults from 113 to 153.

Two things to do rather than assume, both of which caught something here:

- **Check the inverse before bulk-applying.** Not every optional boolean is `false`:
  `grep -rnE '\?\? true|!== false' src/` finds the ones that aren't - `showColumnToggle`,
  `beginAtZero`, `searchable`, `resizableColumns`, `showLast`, `showPercent`, `showRange`,
  `showDots`, `highlightOnHover`. All were already documented; had one not been, defaulting it to
  `false` would have published the opposite of the truth.
- **Diff the source's fallbacks against the documented defaults.** Every `attrs.x ?? y` in `src/`
  is a default; cross-referencing those against the table found six the docs were silent on, of
  which `Calendar.value ?? today` and `AsyncDataTable.noMatchMessage ?? emptyMessage` were real.
  The others (`?? null`, `?? []`, `?? {}`) are absences, not values, and correctly stay em dashes.

**"There is no default" has exactly one spelling: an omitted `defaultValue`, rendered as an em
dash.** A required attr and an attr the component deliberately leaves unset (every ARIA label and
placeholder here) are the same fact from the reader's side, and spelling one of them as the word
"none" made the table look like it was drawing a distinction the reader then had to decode. It also
collided with `none` as a genuine value - `resize` and `display` both take it. Conditional defaults
("true for a row, never for a column") stay whole and un-monospaced: they are prose, and code type
would claim they were something you could pass.

**Required is a marker on the name, not prose and not a column.** 60 of 335 rows are required, so
marking the exception keeps the signal sparse and visible; a fifth column would have been 275 em
dashes. Optional carries no marker at all, which matches how the attrs types are written
(`foo?: string`). It was `(required).` appended to the description before - the one place a reader
scanning a table cannot see it.

**Three things are not attributes, and none of them belong in that table.** Each got its own
representation because putting it in a column headed "Attribute" told the reader to pass it as one:

| Not an attribute | Where it goes |
|---|---|
| `children` | Its own Children section (see above) |
| A method - `showModal()`, `close()` | Its own Methods section, `ComponentDoc.methods` |
| A function - `showToast` | `kind: "function"`: a Function badge, a Signature block, and its table headed **Parameters** rather than Attributes |

`Toast` is the worked example of the last one. It has no JSX tag, no attributes and no children -
it is *called* - and its page had been documenting `showToast(message, options)` as if it were an
attribute of a component named Toast. Anything else the package exports as a function rather than a
component goes in `functionDocs` and gets the same treatment for free.

**One row per attribute, never two.** `prevButtonChildren / nextButtonChildren` in a single row
saved a line and cost the reader the ability to search the table for the attr they were holding -
and it forced one description to cover two things, which is how "Input/change handlers." ended up
saying nothing about when either fires. Splitting the twenty combined rows turned 317 rows into
341 and is worth every one.

**Every example carries a `code` snippet, and the field is required so a missing one is a type
error.** The snippets were lifted out of the JSX that builds each example rather than hand-written,
so they started faithful; they can still drift, because `node` is a compiled factory and there is
no way to recover its source at runtime. Edit the two together. Prefer trimming showcase
scaffolding (a `<div style={row}>` that only lays the preview out) over adding anything that
teaches nothing about the component.

⚠️ **`Theme` puts `transition: color 0.25s` on `body`.** Anything inheriting body's colour is
mid-animation for a moment after a theme toggle, so a screenshot or a `getComputedStyle` taken
right after the click reads the *previous* theme's text colour on the new theme's ground - dark on
dark, indistinguishable from a real contrast bug, and it cost a debugging detour here. Poll until
`getComputedStyle(document.body).color` stops changing before asserting or capturing. Note the
element to probe is one that inherits (a `Heading`): `.vtd-text-muted` sets its own colour and
keeps looking correct even when the inherited palette is wrong.

`tests/test_modules/explorer.tsx` (+ `explorer-schema.tsx`) is a separate, Storybook-style browsing UI served at `/` — a searchable/grouped sidebar, a live canvas, and a "Controls" panel that live-edits a story's props and re-renders the real component instantly. It's additive to the gallery-page fan-out above, not a replacement: every component still gets its own `/<name>` gallery page, and `basic_tests.test.ts` still drives those routes directly, unaffected by the Explorer. If you want a new component to also show up in the Explorer, add a `ComponentStory` entry for it in `explorer-schema.tsx` (`defaultProps`/`controls`/`render`) — only genuinely scalar props (a string enum → `select`, a `boolean`, a freeform string → `text`, a number → `number`) get a control; arrays/objects/callbacks stay baked into `render` as fixed sample data, same as the gallery pages already do. A story with a click-driven internal state (like `Pagination`'s current page) should route that through the `setProp` callback `render` receives as its second argument, so it stays in sync with the same update path a Controls edit uses - see `explorer.tsx`'s `Pagination`/`Menu` entries.

Running the bundler: `tests/bundle.ts` builds the gallery modules, and `deno task test` runs it first. It skips whatever is already current, so a repeat run costs 0.3s rather than 24s, and takes module names to build a subset. Staleness is deliberately coarse - *any* change under `src/` rebuilds *every* module - because a gallery module's real dependency graph is the whole package, and a per-module graph that was wrong would hand back a green suite built from stale code.

⚠️ **Bundling runs a small pool, not one per core.** Memory is the limit, not CPU: eight concurrent `deno bundle` processes took a four-core machine down with memory pressure. Half the cores, and `VTD_BUNDLE_JOBS` overrides it. Parallelism is not where the win is anyway - it was 26s at two jobs against 35s serially, while skipping what is current costs nothing at all.

## Changes reach `main` through a pull request, and CI is the reviewer

`main` is protected: no direct pushes, no force-pushes, no deletion. Every change goes through a
pull request, and because there is no second developer, **the required checks are the review** -
nothing merges that they do not pass.

| Workflow | Runs on | What it gates |
|---|---|---|
| `ci.yml` - *Typecheck, lint and publish dry run* | PR + push to main | `deno check` on the package, showcase and tests; `deno lint`; `deno publish --dry-run`; and that `showcase/src/data/bundle-size.ts` is current |
| `ci.yml` - *Astral suite* | PR + push to main | `deno task test`, which bundles all 72 gallery modules and drives them |
| `bundle-size.yml` | PR | Comments the gzip/raw size of the whole library against the base branch. Advisory - it reports, it does not block |
| `auto-merge.yml` | PR | Turns on GitHub's auto-merge, so a PR merges itself once the required checks go green |
| `publish.yml` | Manual | `deno publish --dry-run`, then `npx jsr publish` |

Three things worth knowing before you touch any of this:

- **The suite reports a real tally and a real exit code**, which needed veloserver 0.2.0. Before
  that, `Server.serve()` called `Deno.exit(0)` from its shutdown handler and killed the runner
  before it could print, so every run read `0 passed | 0 failed` whatever happened. `serve()` takes
  `exitProcessOnClose` now and defaults to leaving the process alone.
- **Auto-merge does not bypass anything.** It queues the merge and GitHub holds it until every
  required check passes; a red check leaves the PR open. It only arms for a non-draft PR from a
  branch in this repository opened by the repository owner, so a fork's PR still waits for a human.
- **`deno lint` excludes `jsx-key`** in `deno.json`, because velotype's JSX has no `key` prop and
  the rule fires on all 72 list renders. Everything else must be clean; that is why it can gate.

### The bundle size is measured, not asserted

`scripts/bundle-size.ts` bundles `src/index.ts` minified for the browser and reports raw and gzip
bytes. It is the single source for both places the number appears:

- `deno task size --write` regenerates `showcase/src/data/bundle-size.ts`, and the showcase's own
  `deno task bundle` runs it first, so the figure on the home page is measured from the source the
  site was built from and cannot go stale. CI fails if the committed file disagrees with a fresh
  measurement.
- The pull-request comment measures both sides. **The base is measured with the base's own copy of
  the script**, not the branch's - otherwise a PR that changes how measuring works would report the
  difference as if it were a size change.

`src/index.ts` is the only entrypoint, so this is the honest ceiling: every component, every
stylesheet string, nothing tree-shaken. A real app importing three components downloads far less.

**Two figures, because velotype's bytes are not velodesign's.** `raw`/`gzip` are the whole graph
with velotype folded in; `ownRaw`/`ownGzip` are velodesign alone, and they are what the home page
shows. In production velotype is its own module import, shared with everything else built on it -
which is how the showcase itself now loads it - so a figure with velotype inside reports a size no
consumer pays velodesign. Both are kept rather than redefining `raw`/`gzip`, so the pull-request
comment still compares like with like against a base measured before the split.

⚠️ **esbuild emits one import statement per source module that imports an external package, and
keeps it whether or not that module survived tree-shaking** - an external module might have side
effects it cannot rule out. Importing velotype directly from 87 files therefore cost **150
statements and 9,415 bytes in every consumer bundle**, and because the statements survive
tree-shaking that cost was flat: a Button-only bundle measured 15,964 bytes, of which 9,415 were
import statements for components that had been shaken out.

**So `src/core/velotype.ts` is the only module in `src/` that names `@velotype/velotype`**, and
`src/core/jsx-runtime.ts` is the only one that names `@velotype/velotype/jsx-runtime`. Everything
else imports from the barrel, and `deno.json`'s `jsxImportSource` points at velodesign's own
`./jsx-runtime` export so the compiler writes one specifier into all 73 `.tsx` files instead of 73.
Two statements in the bundle, and a Button-only bundle is **6,605 bytes**.

`scripts/bundle-size.ts` asserts exactly two, rather than trusting it. An import that goes around
the barrel still compiles and still renders; it shows up only as bytes, in everyone's bundle.
Proven to fail by pointing one component back at `@velotype/velotype` and watching the measurement
refuse.

Three things about the barrel that are easy to get wrong:

- ⚠️ **Never `export *`.** Against an external package esbuild cannot enumerate the names, so it
  emits a namespace import plus a `__reExport` helper and rewrites every call site to
  `(0, ns.foo)()` - an indirect property access that defeats tree-shaking outright. An explicit list
  costs nothing to keep current: a missing name is a compile error.
- ⚠️ **The JSX barrel must re-export `JSX` as a type.** `jsxImportSource` resolves
  `JSX.IntrinsicElements` through that module, so re-exporting only `jsx`/`jsxs`/`Fragment` leaves
  every intrinsic element untyped - 616 `TS7026` errors, none of which point at the barrel.
- **`./jsx-runtime` is in `exports` for resolution, not for consumers.** A config-local `#alias`
  works when building here, but a published package is resolved by whoever imports it, and a real
  export is one less thing that has to survive that. A consumer has velodesign's own name mapped
  already - that is how they imported it.

⚠️ **Which `jsxImportSource` applies to velodesign's own `.tsx` files depends on who compiles
them.** Compiled as part of a consumer's graph - which is what a relative-path import makes them -
they take the *consumer's*, and emit 73 statements rather than one. That is why the showcase builds
`velodesign.js` as its own module with `--config ../deno.json`: under the root config velodesign's
files take velodesign's own setting, which is also what a published package gets.

A `@jsxImportSource` pragma in each file was tried as a way to make it independent of the compiling
config. It overrides the emitted import but **not** the type resolution, so it fails to typecheck -
`TS2875`, pointing at a module path that is fine. Don't reach for it again.

Both `showcase/deno.json` and `tests/deno.json` map `@velotype/velodesign/jsx-runtime` at
velodesign's barrel, which is what a consumer naming the package gets for free.

An earlier note here said `--external` did not hold velotype out at all. That was wrong - it works,
and `--external "@velotype/velotype"` alone covers the `/jsx-runtime` subpath too, byte for byte.
The generated stand-in for velotype it described is gone, and so is the transform that briefly
replaced it, which collapsed the duplicate statements *after* measuring and so fixed the number
while leaving every consumer to pay the bytes.

### Verification checklist for a new/changed component

1. `deno check src/index.ts` (and any test files you touched) — catches attrs-type/generic mistakes immediately.
2. `cd tests && deno task bundle-<name>` (and `bundle-showcase` if you added a showcase section) — one task per invocation.
3. `deno task test` (from repo root) — runs the full Astral suite, whose summary line is now trustworthy. `deno task test:only button tabs` and `deno task test:changed` narrow the bundling and the tests together for iteration; neither is a substitute for the full run. If an assertion intermittently throws `Unable to get stable box model to click on` (or a destroyed-remote-object error from `getAttribute`) on an element that's clickable fine in an isolated throwaway script - this happened writing `Accordion`'s test, specifically only when running as a later test in the full suite - don't chase the exact cause. Stop holding an `ElementHandle` across the interaction entirely and drive the whole assertion through `page.evaluate()` instead (query + click + read state all as plain in-page JS, returning only plain data); that resolved it and is the more robust pattern regardless.
4. A broader headless-Chrome smoke pass hitting the new gallery page(s) directly and checking for zero `console`/`pageerror` events is worth doing for anything with real interaction, beyond just the handful of `basic_tests.test.ts` assertions — write a small throwaway script using `@astral/astral`'s `launch()` + `startAppServer` from `tests/base_server.ts` (see recent git history for the shape; nothing this specific is checked into the repo).
5. **For anything with an interaction, count the DOM churn** (see "Interaction must only touch the DOM that actually changed"): a `MutationObserver` over the component root across ~40 repeats of the same interaction must report **zero** added/removed nodes, and a run that *does* change state must not create nodes where it could mutate text in place. Drain with `takeRecords()` - the observer's callback is an async microtask and will not have run inside a synchronous block. This is the only check that catches a handler which looks correct and rebuilds its subtree on every event; it is invisible to `deno check`, to assertions about rendered content, and to a screenshot.
6. For anything with non-trivial CSS/layout (a new positioning trick, a windowed list, an open/closed state), take an actual screenshot (`page.screenshot()` → `Deno.writeFile(...)`) and look at it in both themes before calling it done. This is the only check that catches rendering-level mistakes `deno check`/automated assertions can't see by construction — e.g. `Breadcrumbs`'s stray literal `"false"` text (gotcha #1 above) was invisible to every other check and only showed up in a screenshot.
