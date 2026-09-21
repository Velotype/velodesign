import { passthroughAttrsToElement } from "../core/velotype.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { mountTypographyStyles, textClasses } from "./typography-common.ts"
import type { TextType } from "./typography-common.ts"

/**
 * Attrs type for `<Paragraph/>` Component
 */
export type ParagraphAttrsType = {
    /** Semantic colour; unset is the page's own text colour */
    type?: TextType
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * A block of text: a real `<p>` with the package's line height and spacing.
 *
 * The last paragraph in a container drops its bottom margin, so a card or a panel doesn't end with
 * a band of dead space - the reason hand-rolled prose so often needs a `:last-child` override.
 */
export const Paragraph: FunctionComponent<ParagraphAttrsType> = function(attrs: ParagraphAttrsType, children: RenderableElements[]): HTMLParagraphElement {
    mountTypographyStyles()
    return passthroughAttrsToElement<HTMLParagraphElement>(
        <p class={textClasses("vtd-paragraph", attrs.type)}>{children}</p>, attrs)
}
