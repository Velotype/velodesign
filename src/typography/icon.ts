import {passthroughAttrsToElement} from "../core/velotype.ts"
import type { FunctionComponent, IdAttr, StylePassthroughAttrs } from "../core/velotype.ts"
import { Icon, iconElement, mountIconStyles } from "../core/glyphs.ts"

export { Icon }

/** Map of registered icons */
const icons = new Map<string, Icon>()

/** Attrs type for `<I/>` Component */
export type IAttrsType = ({
    /** The key used to lookup a registered Icon */
    i: string
    icon?: never
} | {
    /** The Icon to draw, such as one of `Glyphs` */
    icon: Icon
    i?: never
}) & {
    /** Accessible name. Without one the icon is decoration, hidden from assistive tech - no default, the library doesn't assume a language */
    label?: string
} & IdAttr & StylePassthroughAttrs
/**
 * I for Icon
 *
 * This Component renders an icon: a registered one by key (`i`), or one given directly (`icon`).
 */
export const I: FunctionComponent<IAttrsType> = function(attrs: IAttrsType): SVGSVGElement | null {
    const icon = attrs.icon ?? icons.get(attrs.i!)
    if (icon) {
        const svg = iconElement(icon, attrs.label)
        // `passthroughAttrsToElement`'s generic is declared `<T extends HTMLElement>`, and
        // unlike `HTMLDetailsElement` (used the same way by `Menu`/`Accordion`/`Collapse`/
        // `Tree`), `SVGSVGElement` genuinely doesn't structurally satisfy that - it descends
        // from `SVGElement`/`Element`, not `HTMLElement`, so it's missing real HTMLElement-only
        // members (`accessKey`, `autocapitalize`, ...). The `id`/`class`/`style` attrs this
        // actually sets are all plain `Element`-level concerns, so the cast is safe at runtime.
        return passthroughAttrsToElement<HTMLElement>(svg as unknown as HTMLElement, attrs) as unknown as SVGSVGElement
    }
    return null
}

/**
 * Register an icon
 *
 * Can later use `<I i={key}/>` to render this icon into an SVG Element
 */
export function registerIcon(key: string, icon: Icon) {
    mountIconStyles()
    icons.set(key, icon)
}
