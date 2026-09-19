import { passthroughAttrsToElement } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { mountTypographyStyles, textClasses } from "./typography-common.ts"
import type { TextType } from "./typography-common.ts"

/**
 * Attrs type for `<Heading/>` Component
 */
export type HeadingAttrsType = {
    /**
     * Which heading level, `1`-`6`, rendered as the matching `<h1>`-`<h6>`.
     *
     * Required on purpose. A default would quietly produce a second `<h1>` on a page that already
     * has one, which is the most common heading-structure mistake and the one screen reader users
     * actually feel - the level is a statement about the document, not a size.
     */
    level: 1 | 2 | 3 | 4 | 5 | 6
    /** Semantic colour; unset is the page's own text colour */
    type?: TextType
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * A heading, `<h1>` through `<h6>`.
 *
 * Size comes from `level`, so the visual hierarchy and the document outline cannot disagree - which
 * is the usual reason a page ends up with an `<h4>` styled to look like an `<h2>`. To make a
 * heading look smaller than its level, style it; don't demote it.
 */
export const Heading: FunctionComponent<HeadingAttrsType> = function(attrs: HeadingAttrsType, children: RenderableElements[]): HTMLHeadingElement {
    mountTypographyStyles()
    const cls = textClasses(`vtd-heading vtd-heading-${attrs.level}`, attrs.type)
    // Six explicit branches rather than a dynamic tag: velotype's generic `<HTML tag="h2">` takes
    // its content as an innerHTML *string*, so it cannot carry these children.
    switch (attrs.level) {
        case 1: return passthroughAttrsToElement<HTMLHeadingElement>(<h1 class={cls}>{children}</h1>, attrs)
        case 2: return passthroughAttrsToElement<HTMLHeadingElement>(<h2 class={cls}>{children}</h2>, attrs)
        case 3: return passthroughAttrsToElement<HTMLHeadingElement>(<h3 class={cls}>{children}</h3>, attrs)
        case 4: return passthroughAttrsToElement<HTMLHeadingElement>(<h4 class={cls}>{children}</h4>, attrs)
        case 5: return passthroughAttrsToElement<HTMLHeadingElement>(<h5 class={cls}>{children}</h5>, attrs)
        default: return passthroughAttrsToElement<HTMLHeadingElement>(<h6 class={cls}>{children}</h6>, attrs)
    }
}
