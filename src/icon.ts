import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, StylePassthroughAttrs } from "@velotype/velotype"
import { createElementNSHelper, setAttributeHelper, svgNamespace } from "./utilities.ts"

/**
 * An Icon 
 */
export class Icon {
    /** width of the icon in px */
    w: number
    /** height of the icon in px */
    h: number
    /**
     * SVG path to draw the icon
     * 
     * Reference: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d
     */
    d: string
    /** Create a new Icon */
    constructor(w: number, h: number, d: string) {
        this.w = w
        this.h = h
        this.d = d
    }
}

/** Map of registered icons */
const icons = new Map<string, Icon>()

/** Attrs type for `<I/>` Component */
export type IAttrsType = {
    /** The key used to lookup the Icon */
    i: string
} & IdAttr & StylePassthroughAttrs
/**
 * I for Icon
 *
 * This Component renders an icon.
 */
export const I: FunctionComponent<IAttrsType> = function(attrs: IAttrsType): SVGSVGElement | null {
    const icon = icons.get(attrs.i)
    if (icon) {
        const svg = createElementNSHelper("svg") as SVGSVGElement
        setAttributeHelper(svg,"xmlns",svgNamespace)
        setAttributeHelper(svg,"class", "vtd-icon")
        setAttributeHelper(svg,"role", "img")
        setAttributeHelper(svg,"viewBox",`0 0 ${icon.w} ${icon.h}`)
        const path = createElementNSHelper("path") as SVGPathElement
        setAttributeHelper(path,"fill", "currentcolor")
        setAttributeHelper(path,"d", icon.d)
        svg.appendChild(path)
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

let iconStylesheetSet: boolean = false
/**
 * Register an icon
 * 
 * Can later use `<I i={key}/>` to render this icon into an SVG Element
 */
export function registerIcon(key: string, icon: Icon) {
    if (!iconStylesheetSet) {
        setStylesheet('.vtd-icon{height:1em;vertical-align:middle;}','Velodesign Icon')
        iconStylesheetSet = true
    }
    icons.set(key, icon)
}
