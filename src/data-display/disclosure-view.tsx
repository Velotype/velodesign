import { setStylesheet } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

/**
 * Shared internals for `Collapse` and `Accordion`.
 *
 * Not exported from `index.ts` - the two components are the public surface.
 *
 * Both render the same widget: a native `<details>`/`<summary>` pair with a border, a chevron and
 * an animated open. They differ only in what *owns* the set - `Collapse` is one section a consumer
 * places wherever they like and fills with `children`; `Accordion` renders a whole list from
 * `items` and can group them with the native `<details name>` attribute so only one opens at a
 * time. That grouping lives on the set, not the section, which is why three `Collapse`es cannot
 * express it and the two components are not a special case of each other.
 *
 * Neither owns the markup, for the same reason `DataTable`/`AsyncDataTable` don't (see CLAUDE.md's
 * "Two components sharing one look"): they had a stylesheet each, five rules were byte-identical
 * between them, and they had already drifted where it showed - `Accordion` animated open over
 * 200ms and `Collapse` snapped, so picking a component on the shape of its API silently picked an
 * open/close behaviour too.
 */

/** The elements one section is built from, so the caller can hold onto its content wrapper */
export type DisclosureSection = {
    details: HTMLDetailsElement
    content: HTMLDivElement
}

/** How long the open/close transition runs - must match the stylesheet below */
const TRANSITION_MS = 200

let areDisclosureStylesMounted = false

/**
 * Mounts the stylesheet both components share, once.
 *
 * The open/close transition is CSS (the close is sequenced by `animateClosed` - see there for why
 * it cannot be CSS alone). Three non-obvious pieces make it work:
 * - `.vtd-disclosure-content` overrides the browser's default `display:none` on a closed
 *   `<details>`'s body (author styles win over that UA default), replacing it with
 *   `display:grid; grid-template-rows:minmax(0,0fr)` / `minmax(0,1fr)` when open - the
 *   "animate to auto height" trick, since `grid-template-rows` accepts fraction units as an
 *   actually-transitionable value. (A `height:0`/`auto` transition looks simpler but silently
 *   doesn't animate at all without `interpolate-size:allow-keywords`, which - checked directly -
 *   isn't supported by Safari or Firefox and only shipped in Chrome 129+, too narrow a base to
 *   build this on.)
 * - The `minmax(0, ...)` matters, not just `0fr`/`1fr` alone: a lone `fr` track still has an
 *   implicit automatic minimum driven by its content's min-content size, so without wrapping it
 *   the "closed" track measured ~14px (one line of text) instead of 0 in testing, even with
 *   `min-height:0` set on the content wrapper. `.vtd-disclosure-content-inner` still needs
 *   `overflow:hidden` (to clip content while the row is shrunk) and `min-height:0` (grid items
 *   default to `min-height:auto`, which would otherwise also push the row back open regardless of
 *   the track's own sizing).
 * - `visibility` flips at the *end* of the closing transition (via a transition-delay) so closed
 *   content still leaves the tab order immediately, same as it did under the browser's native
 *   `display:none`.
 */
export function mountDisclosureStyles(): void {
    if (areDisclosureStylesMounted) {
        return
    }
    areDisclosureStylesMounted = true
    setStylesheet(`
.vtd-disclosure{
width:100%;
box-sizing:border-box;
border:1px solid var(--background-4);
border-radius:0.25rem;
overflow:hidden;
}
.vtd-disclosure-header{
cursor:pointer;
display:flex;
align-items:center;
gap:0.75em;
list-style:none;
padding:0.6em 0.9em;
user-select:none;
/*
 * Always present, transparent when closed: an open section gets a real rule under its header, so
 * the header reads as a header rather than as the first line of the content. Carrying the border
 * at all times rather than adding it on open keeps the section from shifting by a pixel as it
 * opens.
 */
border-block-end:1px solid transparent;
transition:border-color 0.2s ease-out;
}
.vtd-disclosure-header::-webkit-details-marker{display:none;}
.vtd-disclosure-header::marker{display:none;content:"";}
.vtd-disclosure-header:hover{background-color:var(--background-1);}
.vtd-disclosure-chevron{
margin-inline-start:auto;
width:0.6em;
height:0.6em;
border:solid var(--text);
border-width:0 0.12em 0.12em 0;
transform:rotate(45deg);
transition:transform 0.15s ease-in-out;
flex-shrink:0;
}
.vtd-disclosure[open]:not(.vtd-disclosure-closing) .vtd-disclosure-chevron{transform:rotate(-135deg);}
/* The open state, signalled on the header itself: a divider plus a faint fill behind it */
.vtd-disclosure[open]:not(.vtd-disclosure-closing) .vtd-disclosure-header{
border-block-end-color:var(--background-4);
background-color:var(--background-1);
}
/* ...so hovering an open header still reads as a hover, one step further than its resting fill */
.vtd-disclosure[open]:not(.vtd-disclosure-closing) .vtd-disclosure-header:hover{background-color:var(--background-2);}
.vtd-disclosure-content{
display:grid;
content-visibility:visible;
grid-template-rows:minmax(0,0fr);
visibility:hidden;
transition:grid-template-rows 0.2s ease-out, visibility 0s linear 0.2s;
}
.vtd-disclosure[open]:not(.vtd-disclosure-closing) .vtd-disclosure-content{
grid-template-rows:minmax(0,1fr);
visibility:visible;
transition:grid-template-rows 0.2s ease-out, visibility 0s linear 0s;
}
/* Equal padding all round - a zero top inset pushed the content up against the header */
.vtd-disclosure-content-inner{overflow:hidden;min-height:0;padding:0.9em;}
@media (prefers-reduced-motion: reduce){
.vtd-disclosure-content,.vtd-disclosure-chevron,.vtd-disclosure-header{transition:none;}
}
`, "vtd/Disclosure")
}

/**
 * Builds one `<details>` section.
 *
 * The inner parts carry only the shared `vtd-disclosure-*` classes - there are no per-component
 * aliases, so there is exactly one selector for each piece. `rootClass` is the caller's own
 * identity class on the `<details>` itself (`vtd-collapse` / `vtd-accordion-item`), matching how
 * every other component in the package names its root, and it is where a caller hangs any rule
 * that genuinely belongs to it rather than to the shared widget.
 */
export function buildDisclosureSection(options: {
    header: RenderableElements
    content: RenderableElements
    defaultOpen?: boolean
    /**
     * The other sections this one is exclusive with, if any - opening this one animates every
     * other open member closed.
     *
     * Deliberately *not* the native `<details name>` grouping any more. The browser closes a
     * grouped sibling itself, instantly and before any handler runs, so with `name` the clicked
     * section animated and the one it displaced snapped shut. The array is shared and the caller
     * pushes into it as it builds, so each section sees the whole group.
     */
    group?: DisclosureSection[]
    /** The caller's identity class for the `<details>` itself, e.g. `"vtd-collapse"` */
    rootClass: string
}): DisclosureSection {
    const content: HTMLDivElement = <div class="vtd-disclosure-content">
        <div class="vtd-disclosure-content-inner">{options.content}</div>
    </div>
    const summary: HTMLElement = <summary class="vtd-disclosure-header">
        {options.header}
        <span class="vtd-disclosure-chevron"/>
    </summary>
    const details: HTMLDetailsElement = <details
        class={`vtd-disclosure ${options.rootClass}`}
        open={options.defaultOpen}>
        {summary}
        {content}
    </details>
    const section = {details, content}

    summary.addEventListener("click", (event: Event) => {
        if (details.open) {
            // Closing: hold `open` while the collapse runs, or the transition never starts
            event.preventDefault()
            animateClosed(section)
            return
        }
        // Opening: the browser sets `open` and the CSS animates it, so nothing to intercept here.
        // An exclusive group's other members are closed alongside it rather than first, so both
        // halves of the swap move together.
        for (const other of options.group ?? []) {
            if (other !== section) {
                animateClosed(other)
            }
        }
    })

    return section
}

/**
 * Animates a section closed, then actually closes it.
 *
 * **Why this needs JS at all.** Removing `open` stops the browser rendering that subtree, and an
 * element that is not rendered never gets a start time for its transitions - they sit forever at
 * `playState: "running", startTime: null`, which also pins the computed style at the open values.
 * So the *first* open animated and every toggle after it snapped, in both components. Measured
 * directly rather than inferred: the stuck transition objects are visible through
 * `content.getAnimations()`.
 *
 * The fix is to keep `open` set - so the subtree keeps rendering and the transition can actually
 * run - while a `vtd-disclosure-closing` class collapses it visually, and to drop `open` only once
 * the transition has finished.
 *
 * `::details-content` (Chrome 131+) would let CSS do this alone, but it is not available widely
 * enough to rely on - this browser reports `CSS.supports("selector(::details-content)") === false`.
 */
function animateClosed(section: DisclosureSection): void {
    const {details, content} = section
    if (!details.open || details.classList.contains("vtd-disclosure-closing")) {
        return
    }
    // With motion reduced there is no transition to wait for, and the stylesheet has already
    // zeroed it - close immediately rather than sitting in the closing state until the fallback
    // timer fires, which would read as an unexplained delay
    if (globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        details.open = false
        return
    }
    details.classList.add("vtd-disclosure-closing")

    let settled = false
    const finish = () => {
        if (settled) {
            return
        }
        settled = true
        content.removeEventListener("transitionend", onEnd)
        details.classList.remove("vtd-disclosure-closing")
        details.open = false
    }
    function onEnd(event: TransitionEvent) {
        // Only the row collapse marks the end - `visibility` also transitions here and fires first
        if (event.propertyName == "grid-template-rows") {
            finish()
        }
    }
    content.addEventListener("transitionend", onEnd)
    // A transition that is interrupted (or never runs, e.g. a reduced-motion setting that zeroes
    // its duration) fires no transitionend, and a section stuck in the closing class would be
    // invisible but still `open`. Close it regardless once the transition's own time has passed.
    setTimeout(finish, TRANSITION_MS + 50)
}

/**
 * Forces layout on each section's content once it's connected.
 *
 * Not for the animation itself - only to make sure it reliably *starts*. Without this, a section
 * clicked shortly after being newly mounted (e.g. right after a client-side route change put the
 * whole thing on the page for the first time) can jump open/closed instantly with no animation at
 * all, since the CSS transition spec only animates a property change relative to a style the
 * browser already flushed at least once before. Reading layout is enough to establish that - no
 * open/closed state is read or stored here - it only gives the transition something to start from.
 */
export function flushDisclosureLayout(contents: HTMLElement[]): void {
    requestAnimationFrame(() => {
        for (const content of contents) {
            content.getBoundingClientRect()
        }
    })
}
