import { passthroughAttrsToElement } from "../core/velotype.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { buildDisclosureSection, flushDisclosureLayout, mountDisclosureStyles } from "./disclosure-view.tsx"

/**
 * Attrs type for `<Collapse/>` Component
 */
export type CollapseAttrsType = {
    /** Displayed content for the header */
    header: RenderableElements
    /** Should this section start open? */
    defaultOpen?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * A single collapsible section, built on a native `<details>`/`<summary>` pair.
 *
 * `Collapse` is one section a consumer places wherever they need an independently-toggleable
 * disclosure widget, filled with `children`. `Accordion` renders a whole *list* of sections from
 * `items` and can group them so only one is open at a time - that grouping is a property of the
 * set, not of a section, so it isn't something a row of `Collapse`es can express. The markup,
 * styling and open animation are shared between the two (`disclosure-view.tsx`); only the shape
 * of the API differs.
 */
export const Collapse: FunctionComponent<CollapseAttrsType> = function(attrs: CollapseAttrsType, children: RenderableElements[]): HTMLDetailsElement {
    mountDisclosureStyles()

    const section = buildDisclosureSection({
        header: attrs.header,
        content: children,
        defaultOpen: attrs.defaultOpen,
        rootClass: "vtd-collapse",
    })
    flushDisclosureLayout([section.content])

    return passthroughAttrsToElement<HTMLDetailsElement>(section.details, attrs)
}
