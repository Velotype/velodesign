import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Collapse/>` Component
 */
export type CollapseAttrsType = {
    /** Displayed content for the header */
    header: RenderableElements
    /** Should this section start open? */
    defaultOpen?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areCollapseStylesMounted = false

/**
 * A single collapsible section, built on a native `<details>`/`<summary>` pair.
 *
 * Unlike `Accordion` (which renders a whole list of sections from `items`, optionally
 * `exclusive`-grouped), `Collapse` is a single section a consumer places wherever they need
 * one independently-toggleable disclosure widget.
 */
export const Collapse: FunctionComponent<CollapseAttrsType> = function(attrs: CollapseAttrsType, children: RenderableElements[]): HTMLDetailsElement {
    if (!areCollapseStylesMounted) {
        areCollapseStylesMounted = true
        setStylesheet(`
.vtd-collapse{
border:1px solid var(--background-4);
border-radius:0.25rem;
overflow:hidden;
}
.vtd-collapse-header{
cursor:pointer;
display:flex;
align-items:center;
list-style:none;
padding:0.6em 0.9em;
user-select:none;
}
.vtd-collapse-header::-webkit-details-marker{display:none;}
.vtd-collapse-header::marker{display:none;content:"";}
.vtd-collapse-header:hover{background-color:var(--background-1);}
.vtd-collapse-chevron{
margin-inline-start:auto;
width:0.6em;
height:0.6em;
border:solid var(--text);
border-width:0 0.12em 0.12em 0;
transform:rotate(45deg);
transition:transform 0.15s ease-in-out;
flex-shrink:0;
}
.vtd-collapse[open] .vtd-collapse-chevron{transform:rotate(-135deg);}
.vtd-collapse-content{padding:0 0.9em 0.9em 0.9em;}
`, "vtd/Collapse")
    }

    return passthroughAttrsToElement<HTMLDetailsElement>(<details class="vtd-collapse" open={attrs.defaultOpen}>
        <summary class="vtd-collapse-header">{attrs.header}<span class="vtd-collapse-chevron"/></summary>
        <div class="vtd-collapse-content">{children}</div>
    </details>, attrs)
}
