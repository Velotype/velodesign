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
 */
export const Accordion: FunctionComponent<AccordionAttrsType> = function(attrs: AccordionAttrsType, _children: RenderableElements[]): HTMLDivElement {
    if (!areAccordionStylesMounted) {
        areAccordionStylesMounted = true
        setStylesheet(`
.vtd-accordion-item{
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
.vtd-accordion-content{padding:0 0.9em 0.9em 0.9em;}
`, "vtd/Accordion")
    }

    const groupName = attrs.exclusive ? `vtd-accordion-group-${accordionInstanceCounter++}` : undefined

    return passthroughAttrsToElement<HTMLDivElement>(<div>
        {attrs.items.map(item => <details class="vtd-accordion-item" open={item.defaultOpen} name={groupName}>
            <summary class="vtd-accordion-header">{item.header}<span class="vtd-accordion-chevron"/></summary>
            <div class="vtd-accordion-content">{item.content}</div>
        </details>)}
    </div>, attrs)
}
