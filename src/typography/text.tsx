import { passthroughAttrsToElement } from "../core/velotype.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { mountTypographyStyles, textClasses } from "./typography-common.ts"
import type { TextType } from "./typography-common.ts"

/**
 * Attrs type for `<Text/>` Component
 */
export type TextAttrsType = {
    /** Semantic colour; unset is the page's own text colour */
    type?: TextType
    /** Bold */
    strong?: boolean
    /** Italic */
    italic?: boolean
    underline?: boolean
    /** Struck through */
    strike?: boolean
    /** Tabular figures, so digits line up in a column and a changing value doesn't shift its neighbours */
    numeric?: boolean
    /** Renders a real `<code>` element rather than a `<span>`, with monospace and a subtle fill */
    code?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * Inline text with a semantic colour and the usual modifiers.
 *
 * `type="muted"` is the one to reach for most: secondary text is the single most repeated piece of
 * hand-rolled styling in a product, and getting its colour token wrong is nearly invisible in one
 * theme and unreadable in the other (see the note in `typography-common.ts`).
 *
 * For a *block* of text use `Paragraph`, which adds line height and spacing; this stays inline.
 */
export const Text: FunctionComponent<TextAttrsType> = function(attrs: TextAttrsType, children: RenderableElements[]): HTMLElement {
    mountTypographyStyles()
    const cls = textClasses(attrs.code ? "vtd-text-code" : "", attrs.type, attrs).trim()
    if (attrs.code) {
        return passthroughAttrsToElement<HTMLElement>(<code class={cls}>{children}</code>, attrs)
    }
    return passthroughAttrsToElement<HTMLSpanElement>(<span class={cls}>{children}</span>, attrs)
}
