import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single section in an `<Accordion/>`
 */
export type AccordionItemType = {
    /** Displayed content for this section's header */
    header: RenderableElements
    /** Content shown when this section is open */
    content: RenderableElements
    /** Should this section start open? */
    defaultOpen?: boolean
}

/**
 * Attrs type for `<Accordion/>` Component
 */
export type AccordionAttrsType = {
    /** The set of sections to show */
    items: AccordionItemType[]
    /** If set, opening one section closes any other open section (native `<details name>` grouping) */
    exclusive?: boolean
} & IdAttr & StylePassthroughAttrs

let areAccordionStylesMounted = false
let accordionInstanceCounter = 0

/**
 * A list of collapsible sections, built on native `<details>`/`<summary>` pairs - the browser
 * handles opening/closing (and, when `exclusive` is set, restricting to one open section at a
 * time via the native `name` grouping) with no JS state.
 *
 * The open/close transition is pure CSS, no JS. Three non-obvious pieces make it work:
 * - `.vtd-accordion-content` overrides the browser's default `display:none` on a closed
 *   `<details>`'s body (author styles win over that UA default), replacing it with
 *   `display:grid; grid-template-rows:minmax(0,0fr)` / `minmax(0,1fr)` when open - the
 *   "animate to auto height" trick, since `grid-template-rows` accepts fraction units as an
 *   actually-transitionable value. (A `height:0`/`auto` transition looks simpler but silently
 *   doesn't animate at all without `interpolate-size:allow-keywords`, which - checked directly
 *   - isn't supported by Safari or Firefox and only shipped in Chrome 129+, too narrow a base
 *   to build this on.)
 * - The `minmax(0, ...)` matters, not just `0fr`/`1fr` alone: a lone `fr` track still has an
 *   implicit automatic minimum driven by its content's min-content size, so without wrapping
 *   it the "closed" track measured ~14px (one line of text) instead of 0 in testing, even
 *   with `min-height:0` set on the content wrapper.
 *   `.vtd-accordion-content-inner` still needs `overflow:hidden` (to clip content while the
 *   row is shrunk) and `min-height:0` (grid items default to `min-height:auto`, which would
 *   otherwise also push the row back open regardless of the track's own sizing).
 * - `visibility` flips at the *end* of the closing transition (via a transition-delay) so
 *   closed content still leaves the tab order immediately, same as it did under the browser's
 *   native `display:none`.
 */
export const Accordion: FunctionComponent<AccordionAttrsType> = function(attrs: AccordionAttrsType, _children: RenderableElements[]): HTMLDivElement {
    if (!areAccordionStylesMounted) {
        areAccordionStylesMounted = true
        setStylesheet(`
.vtd-accordion-item{
width:100%;
box-sizing:border-box;
border:1px solid var(--background-4);
border-radius:0.25rem;
margin-block-end:0.5em;
overflow:hidden;
}
.vtd-accordion-item:last-child{margin-block-end:0;}
.vtd-accordion-header{
cursor:pointer;
display:flex;
align-items:center;
gap:0.75em;
list-style:none;
padding:0.6em 0.9em;
user-select:none;
}
.vtd-accordion-header::-webkit-details-marker{display:none;}
.vtd-accordion-header::marker{display:none;content:"";}
.vtd-accordion-header:hover{background-color:var(--background-1);}
.vtd-accordion-chevron{
margin-inline-start:auto;
width:0.6em;
height:0.6em;
border:solid var(--text);
border-width:0 0.12em 0.12em 0;
transform:rotate(45deg);
transition:transform 0.15s ease-in-out;
flex-shrink:0;
}
.vtd-accordion-item[open] .vtd-accordion-chevron{transform:rotate(-135deg);}
.vtd-accordion-content{
display:grid;
content-visibility:visible;
grid-template-rows:minmax(0,0fr);
visibility:hidden;
transition:grid-template-rows 0.2s ease-out, visibility 0s linear 0.2s;
}
.vtd-accordion-item[open] .vtd-accordion-content{
grid-template-rows:minmax(0,1fr);
visibility:visible;
transition:grid-template-rows 0.2s ease-out, visibility 0s linear 0s;
}
.vtd-accordion-content-inner{overflow:hidden;min-height:0;padding:0 0.9em 0.9em 0.9em;}
.vtd-accordion{width:100%;box-sizing:border-box;}
`, "vtd/Accordion")
    }

    const groupName = attrs.exclusive ? `vtd-accordion-group-${accordionInstanceCounter++}` : undefined

    return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-accordion">
        {attrs.items.map(item => <details class="vtd-accordion-item" open={item.defaultOpen} name={groupName}>
            <summary class="vtd-accordion-header">{item.header}<span class="vtd-accordion-chevron"/></summary>
            <div class="vtd-accordion-content"><div class="vtd-accordion-content-inner">{item.content}</div></div>
        </details>)}
    </div>, attrs)
}
