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
  | `typography/` | Heading, Text, Paragraph |
  | `layout/` | Stack, Grid |
  | `form/` | Button, Checkbox, Select, TextBox, the text form fields … |
  | `navigation/` | NavLink, Breadcrumbs, Navbar, Sidebar, Menu, Steps, PageSelector |
  | `feedback/` | Alert, Toast, Tooltip, Spinner, Progress, Skeleton, Empty |
  | `overlays/` | Modal, Drawer, Popover, Popconfirm, ContextMenu, Command |
  | `data-display/` | Badge, Card, Table, DataTable, AsyncDataTable, CodeBlock, Calendar, Tree, Resizable … |
  | `data-entry/` | DatePicker, Slider, Combobox, Upload, Rate, Form |
  | `charts/` | LineChart, AreaChart, BarChart, PieChart, Gauge, Sparkline |
  | `utility/` | Icon |
  | `core/` | **Not a category.** Cross-cutting infrastructure imported by components in several categories, so it belongs to none of them: `utilities.ts`, `theme.ts`, `history.ts`, `strings.ts`, `license.ts`, `search-highlight.tsx`. |

  Two placements are judgement calls rather than showcase facts: `PageSelector` and `Resizable`
  have no story at all, so they went to `navigation/` (client-side routing) and `data-display/`
  (a layout container). Giving them stories is a real gap worth closing.

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

  ⚠️ **CSS class names did not follow the filenames.** `RadioButton` still emits `vtd-radiobutton`,
  `ColorPicker` still emits `vtd-colorpicker`, and their `setStylesheet` keys match those. Those
  strings are public API - a consumer may target them from their own stylesheet - so changing them
  is a breaking change rather than a tidy-up, and it was left out of the rename deliberately.
- `tests/basic_tests.test.ts` — a small number of real Astral (headless Chrome) assertions, not one per component.

## Component shape: `FunctionComponent` vs `Component` class

`FunctionComponent<AttrsType> = (attrs, children) => RenderableElements` — stateless, no lifecycle. **Default to this.** Used by `Button`, `RadioButton`, `Checkbox`, `Toggle`, `TextBox`, `Textarea`, `Select`, `Link`, `Badge`, `Card`, `Alert`, `Tooltip`, `Spinner`, `Divider`, `Breadcrumbs`, `Pagination`, `Navbar`, `Sidebar`, `TimeAgo`, `Icon`/`I`, `Accordion`, `Avatar`.

A third, rarer shape: an **imperative function**, not a component at all, for something the consumer never places in their own JSX tree - `showToast()` is the only current example. It lazily creates one shared container appended to `document.body` on first call, and each call just appends/removes its own element from that container on a timer. Reach for this only when "mount me somewhere in your tree" genuinely doesn't fit (a global notification queue, not a piece of UI with a natural position) - it's the exception, not an alternative to reach for casually.

`class extends Component<AttrsType>` — only when you need one of:
- **A persistent, imperatively-controllable DOM handle** the component must reference again later (`Modal` builds its `<dialog>` once in the *constructor* and stores it in a private field so `showModal()`/`close()`/`setConfirmDisabled()` can act on it directly; `Menu` does the same for its `<details>` element). When you need this, build the JSX tree in the constructor and have `render()` just `return this.#element` — don't rebuild it in `render()`.
- **Global event listeners that must be added/removed with the component's lifecycle** (`mount()`/`unmount()`). `PageSelector` listens for `popstate`/`locationchange` to know when to reselect a page; `NavLink` listens for the same two events to know when to recompute whether it's the active link; `Menu` listens for document `click` to close itself on an outside click. Always add in `mount()`, remove the *same* bound listener reference in `unmount()` (store it as a class field / arrow-function property, not a fresh closure each time, or `removeEventListener` won't match it).
- **Internal state that changes after construction and must trigger a re-render.** Call `this.refresh()` when it changes. `refresh()` unmounts and deletes the whole subtree and re-runs `render()` from scratch — **this means any `ElementHandle`/DOM reference you held from before the refresh is now stale**; if you're writing an Astral test that clicks something and triggers a refresh, re-query every selector you need *after* the click rather than reusing a handle captured before it (`NavLink`'s test actually failed this way once — reusing a pre-click handle to read a post-click attribute threw; the fix was re-querying with `page.$(...)` after the click).
- **Swapping a sub-tree in place without a full refresh**, when only part of the component changes: `this.replaceChild(oldChild, newChild)` (`TextEditableField` uses this to swap its view/edit halves). Prefer `refresh()` unless you specifically need to avoid re-rendering sibling content.

### Avoid `refresh()` on any component that accepts children — via `children` or via an attrs field typed as `RenderableElements`/`RenderableElements[]`

This is the sharpest case of the general rule in the next section: `refresh()` is the largest
possible DOM update, so it is the first thing to rule out.

`refresh()` unmounts and rebuilds the *entire* subtree, and that subtree can include consumer-supplied content you don't own — another component with its own state (a `TextBox` mid-edit, a nested `DataTable`, anything holding focus or internal state). Rebuilding it from scratch on every internal state change of *your* component silently discards that state, and the consumer has no way to opt out. If a component's attrs include a bare `RenderableElements`/`RenderableElements[]`/a row-render callback, or it takes `children`, its internal state transitions should **never** call `this.refresh()` — reach for one of these instead, both already proven out in this package:

1. **Build once in the constructor, then targeted-update via `replaceChildren`/class toggles on stored element refs.** `Command`'s `#renderList()`, `SelectMenu`'s per-method updates, and `DataTable`'s `#renderTable()` all do this: persistent fields (`#tbodyEl`, `#panelEl`, ...) get built once in the constructor, and every state-changing method rebuilds *only* the specific pieces that actually depend on that state, leaving everything else (a search `TextBox`, an unrelated toolbar button) untouched and never remounted. `DataTable` used to call `refresh()` on every sort/search/page/column-visibility change; the toolbar and column-menu panel don't depend on any of that state, so it was refreshing (and risking mid-interaction stale-reference bugs in) parts of the tree that never needed to change at all.
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

The generic is declared `<T extends HTMLElement>`. `HTMLDetailsElement` (used this way by `Menu`/`Accordion`/`Collapse`/`Tree`) genuinely satisfies that constraint - it's a real `HTMLElement` subtype - so it needs no cast. `SVGSVGElement` (`Icon`'s `<svg>` root) does *not*: it descends from `SVGElement`/`Element`, not `HTMLElement`, so it's missing real `HTMLElement`-only members (`accessKey`, `autocapitalize`, ...) and fails to type-check against the constraint (confirmed against `@velotype/velotype@0.0.27` - an earlier note here claiming structural typing let `SVGSVGElement` through anyway was wrong, or true only against an older `dom.d.ts`; either way it isn't now). `Icon` handles this with a double cast through `unknown` at its one call site, safe because the attrs `passthroughAttrsToElement` actually reads (`id`/`class`/`style`) are plain `Element`-level concerns - don't reach for `<T>` itself as a way around this on a new SVG-rooted component; cast at the call site the same way.

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

## The `XThemeOptions` escape hatch

A handful of components need a small piece of glyph/icon-ish content with no baked-in icon-font dependency: `ButtonThemeOptions.spinner`, `DataTableThemeOptions.columnsSymbol`/`.emptySymbol`, `ModalThemeOptions.closeSymbol`/`.cancelSymbol`, `AlertThemeOptions.dismissSymbol`, `TagThemeOptions.removeSymbol`, `ToastThemeOptions.dismissSymbol`, `DrawerThemeOptions.closeSymbol`, `PopconfirmThemeOptions.confirmSymbol`/`.cancelSymbol`, `PaginationThemeOptions.prevSymbol`/`.nextSymbol`, `EmptyThemeOptions.image`, `TextFormFieldOptions.check`/`.xmark`/`.edit` (note: this one predates the `XThemeOptions` naming and doesn't have "Theme" in its name — a known inconsistency, not a pattern to copy the *name* of, just be aware it exists). Each is an exported, mutable object of `FunctionComponent<EmptyAttrs>` defaults that a consumer can override wholesale (`ButtonThemeOptions.spinner = () => <MyIcon/>`) to reskin that one piece across every instance, without needing a per-instance prop. Add one of these when a component needs a small overridable visual (not for anything structural) - it's also the standard mechanism for satisfying the language-agnostic-defaults rule above whenever the default is a button/content symbol rather than a placeholder or ARIA label.

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
| Always-rendered element | `Tree`'s chevron (a `::before` on the `<summary>`), `Tooltip` | Safe by construction |

**Three ways out, in order of preference:**

1. **Animate something that never un-renders.** `Tree`'s chevron lives on the `<summary>`, which is
   always rendered, so its rotate works every time - verified, zero stuck animations across four
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

⚠️ **Transitions do not progress at all inside this test suite.** `requestAnimationFrame` never
ticks, computed values stay at their start, and any in-page promise running more than about a
second trips Astral's own `evaluate` deadline with `RetryError` (the *function* form of
`page.evaluate` awaits a returned promise; the string form does not - that difference cost three
failed attempts). So split the assertion:

- **In the suite**, assert the frame-independent contract: that the interaction was intercepted,
  that it takes the transition's own wall time rather than completing instantly (throttling can
  only stretch that, never shorten it), and that it holds on *every* cycle rather than the first.
- **In a standalone script**, assert the visual half by sampling per frame, where rAF does tick -
  the disclosure measured 12-13 distinct heights on every open and close.

**Always run the interaction at least three times.** A single toggle is what hid this bug for the
entire life of `Accordion`.

## Two components sharing one look: `Collapse` / `Accordion`

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
`charts/chart-common.ts`'s `svgEl()` wraps `createElementNS` exactly as `utility/icon.ts` does, and every chart
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

## Testing & showcase harness

Every component gets the same fan-out, even though not every component gets dedicated assertions:

1. `src/<name>.tsx` + `src/index.ts` export (always).
2. `tests/test_modules/<name>.tsx` — a "gallery" page rendering every documented state (disabled/checked/each `type`/etc.) twice, side by side, in `data-theme="light"` and `data-theme="dark"` containers, wrapped in `<TestModulePage>` (adds the "Home page" link + dark-mode toggle), calling `Theme.injectStyles()` and `setThemeOnSelector(...)` on both container ids at module load. Copy the closest existing gallery module's boilerplate rather than writing it from scratch.
3. `tests/deno.json` — one `"bundle-<name>"` task: `deno bundle ./test_modules/<name>.tsx --output ./build/<name>.js --sourcemap=linked` (note: `--sourcemap` requires an explicit value — `linked`/`inline`/`external` — under current Deno; a bare boolean flag errors).
4. `tests/base_server.ts` — add `<name>` to the `setOfModules` array (nothing else in that file needs to change; routing/script-tag serving is already generic over that list).
5. `tests/test_modules/showcase.tsx` — a short section alongside the other components, for a combined at-a-glance view.
6. `tests/basic_tests.test.ts` gets new `itWrap(...)` assertions **only** for components with real interactive/stateful behavior worth regression-testing (state that changes on click, a value that updates, an open/closed toggle) — not for every component. Purely visual/static ones (`Badge`, `Card`, `Divider`, `Breadcrumbs`, `Navbar`, `Sidebar`, `Spinner`, `Avatar`) are gallery-only, no assertions.

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

Do not reach for brace-balancing to parse this file's own source. An apostrophe in JSX prose
("doesn't") reads as a string delimiter and swallows the rest of the file - that is why the
showcase's snippet generator keys off line structure instead.

### `showcase/` is built out of this package, deliberately

The showcase app is a real consumer of velodesign, not a page that merely displays it: its chrome
and every page are `Navbar`/`NavLink`/`Heading`/`Text`/`Paragraph`/`Stack`/`Grid`/`Link`/`Empty`,
and what's left in its own `setStylesheet` blocks is six `display:flex|grid` rules, each a piece of
structural glue no component owns (the shell's `100vh` column, the sidebar's sticky scroll column,
the dotted example frame) and each carrying a comment saying so. **Keep it that way** - it is the
only place the package is used the way a consumer uses it, and it earns its keep:

- Dogfooding is what found `Link` rendering an `<a>` with **no class at all** - the one component a
  consumer had nothing to target, against this file's own "never a bare unprefixed class" rule. It
  emits `vtd-link` now, still with no stylesheet of its own.
- A page reaching into a component should target its **class** (`.vtd-heading-2`), never the tag it
  happens to render (`h2`). The tag is an implementation detail; the class is the API.
- `Stack` does not replace *everything*. A row that must be a `<label>` (so clicking the text
  focuses the control) stays a `<label>`, because `Stack` renders a `<div>` - theme-builder's
  colour fields are the worked example.

**A component page documents `children` in its own section, never as a row in the attributes
table.** Children are passed by nesting content inside the tags; listing them beside real named
attributes told the reader to write `children={...}`, the one thing no component here accepts.
`ComponentDoc.children` carries that prose, and only the 8 genuinely *named* attrs that happen to
end in `Children` (`confirmButtonChildren`, `columnToggleChildren`, …) stay in the table.

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

Running the bundler: use `deno task bundle-<name>` **one at a time**. Passing multiple task names, or a glob like `'bundle*'`, to a single `deno run`/`deno task` invocation has silently only run the first one before — don't trust a "ran clean" result from a multi-name invocation without checking every module's file actually got a fresh timestamp.

### Verification checklist for a new/changed component

1. `deno check src/index.ts` (and any test files you touched) — catches attrs-type/generic mistakes immediately.
2. `cd tests && deno task bundle-<name>` (and `bundle-showcase` if you added a showcase section) — one task per invocation.
3. `deno task test` (from repo root) — runs the full Astral suite; check for individual `ok`/`FAILED` lines per test, not just the final summary line (it can read `0 passed | 0 failed` even when every individual step passed — a pre-existing cosmetic quirk of how the test runner tallies when the suite calls `Deno.exit(0)`). If an assertion intermittently throws `Unable to get stable box model to click on` (or a destroyed-remote-object error from `getAttribute`) on an element that's clickable fine in an isolated throwaway script - this happened writing `Accordion`'s test, specifically only when running as a later test in the full suite - don't chase the exact cause. Stop holding an `ElementHandle` across the interaction entirely and drive the whole assertion through `page.evaluate()` instead (query + click + read state all as plain in-page JS, returning only plain data); that resolved it and is the more robust pattern regardless.
4. A broader headless-Chrome smoke pass hitting the new gallery page(s) directly and checking for zero `console`/`pageerror` events is worth doing for anything with real interaction, beyond just the handful of `basic_tests.test.ts` assertions — write a small throwaway script using `@astral/astral`'s `launch()` + `startAppServer` from `tests/base_server.ts` (see recent git history for the shape; nothing this specific is checked into the repo).
5. **For anything with an interaction, count the DOM churn** (see "Interaction must only touch the DOM that actually changed"): a `MutationObserver` over the component root across ~40 repeats of the same interaction must report **zero** added/removed nodes, and a run that *does* change state must not create nodes where it could mutate text in place. Drain with `takeRecords()` - the observer's callback is an async microtask and will not have run inside a synchronous block. This is the only check that catches a handler which looks correct and rebuilds its subtree on every event; it is invisible to `deno check`, to assertions about rendered content, and to a screenshot.
6. For anything with non-trivial CSS/layout (a new positioning trick, a windowed list, an open/closed state), take an actual screenshot (`page.screenshot()` → `Deno.writeFile(...)`) and look at it in both themes before calling it done. This is the only check that catches rendering-level mistakes `deno check`/automated assertions can't see by construction — e.g. `Breadcrumbs`'s stray literal `"false"` text (gotcha #1 above) was invisible to every other check and only showed up in a screenshot.
