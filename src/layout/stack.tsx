import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { cssAlign, cssJustify, resolveGap } from "./spacing.ts"
import type { AlignItems, GapSize, JustifyContent } from "./spacing.ts"

/**
 * Attrs type for `<Stack/>` Component
 */
export type StackAttrsType = {
    /** Lay children out in a row or a column (default: `"row"`) */
    direction?: "row" | "column"
    /** Space between children - a scale step, or any CSS length (default: `"md"`) */
    gap?: GapSize | string
    /** How children line up across the stack's cross axis */
    align?: AlignItems
    /** How children are distributed along the stack's main axis */
    justify?: JustifyContent
    /** Let children wrap onto further lines when they don't fit (default: `true` for a row) */
    wrap?: boolean
    /** Flow inline with surrounding text instead of taking a line of its own (default: `false`) */
    inline?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areStackStylesMounted = false

/**
 * One-dimensional layout: a row or column of children with a consistent gap.
 *
 * This is the component that replaces `style={{display: "flex", gap: "0.5rem"}}`, which is the
 * single most repeated piece of ad-hoc styling in a product built on this package. Everything it
 * does is a flexbox one-liner - the value is that every consumer spells it the same way and draws
 * from one spacing scale, so two rows that look "the same" are.
 *
 * `wrap` defaults to `true` for a row, because a row of buttons or tags that cannot wrap is a
 * horizontal scrollbar or an overflow at the first narrow viewport. A column never wraps.
 *
 * **A column stretches its children to full width** - flexbox's own default, and the right one for
 * the common case of stacking cards or form fields. Pass `align="start"` for a column of things
 * that should stay their own size, like badges or buttons; a stretched `Badge` spanning the
 * container is the one surprising thing this component does.
 *
 * For two dimensions - a set of cards or form fields filling the available width - use `Grid`.
 */
export const Stack: FunctionComponent<StackAttrsType> = function(attrs: StackAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areStackStylesMounted) {
        areStackStylesMounted = true
        setStylesheet(`
.vtd-stack{display:flex;width:100%;box-sizing:border-box;}
/* An inline stack sizes to its content, like the text it sits among */
.vtd-stack-inline{display:inline-flex;width:auto;}
`, "vtd/Stack")
    }

    const direction = attrs.direction ?? "row"
    return passthroughAttrsToElement<HTMLDivElement>(<div
        class={`vtd-stack${attrs.inline ? " vtd-stack-inline" : ""}`}
        style={{
            flexDirection: direction,
            gap: resolveGap(attrs.gap),
            alignItems: cssAlign(attrs.align),
            justifyContent: cssJustify(attrs.justify),
            flexWrap: (attrs.wrap ?? direction === "row") ? "wrap" : "nowrap"
        }}>{children}</div>, attrs)
}
