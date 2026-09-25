import {passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { buildDisclosureSection, type DisclosureSection, flushDisclosureLayout, mountDisclosureStyles } from "./disclosure-view.tsx"

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

/** Stylesheet for `<Accordion/>`, mounted once on first construction */
const accordionCss: string = `
.vtd-accordion{width:100%;box-sizing:border-box;}
.vtd-accordion-item{margin-block-end:0.5em;}
.vtd-accordion-item:last-child{margin-block-end:0;}
`

/**
 * A list of collapsible sections, built on native `<details>`/`<summary>` pairs.
 *
 * `exclusive` is the reason this is not simply a stack of `Collapse`es: the grouping belongs to
 * the set, and only a component that renders the whole list can hold it. It is *not* the native
 * `<details name>` grouping - the browser closes a grouped sibling itself, instantly and before
 * any handler runs, so the section being displaced snapped shut while the clicked one animated.
 * The group is a plain array the sections share instead. What
 * a section *looks like* - the border, the chevron, the animated open - is shared with `Collapse`
 * through `disclosure-view.tsx`, so the two cannot drift apart again. Everything this file still
 * owns is a property of the list rather than of a section: the spacing between items, and the
 * group name.
 */
export const Accordion: FunctionComponent<AccordionAttrsType> = function(attrs: AccordionAttrsType, _children: RenderableElements[]): HTMLDivElement {
    mountDisclosureStyles()
    if (!areAccordionStylesMounted) {
        areAccordionStylesMounted = true
        // Only what belongs to the list - a section's own look lives in the shared stylesheet
        mountStyles(accordionCss, "vtd/Accordion")
    }

    // Shared and pushed into as each section is built, so every member sees the whole group. Empty
    // when `exclusive` is unset, which is what makes each section independent.
    const group: DisclosureSection[] = []

    const contents: HTMLDivElement[] = []
    const root = passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-accordion">
        {attrs.items.map(item => {
            const section = buildDisclosureSection({
                header: item.header,
                content: item.content,
                defaultOpen: item.defaultOpen,
                group: attrs.exclusive ? group : undefined,
                rootClass: "vtd-accordion-item",
            })
            if (attrs.exclusive) {
                group.push(section)
            }
            contents.push(section.content)
            return section.details
        })}
    </div>, attrs)

    flushDisclosureLayout(contents)

    return root
}
