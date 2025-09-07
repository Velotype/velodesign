import { setAttrsOnElement, setStylesheet } from "jsr:@velotype/velotype"
import type { CSSProperties, FunctionComponent } from "jsr:@velotype/velotype"
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
    /** Optional additional styles to apply to the `<svg/>` element */
    style?: CSSProperties | string
}
/**
 * I for Icon
 * 
 * This Component renders an icon.
 */
export const I: FunctionComponent<IAttrsType> = function(attrs: IAttrsType) {
    const icon = icons.get(attrs.i)
    if (icon) {
        const svg = createElementNSHelper("svg") as SVGSVGElement
        setAttributeHelper(svg,"xmlns",svgNamespace)
        setAttributeHelper(svg,"class", "vtd-icon")
        setAttributeHelper(svg,"role", "img")
        setAttributeHelper(svg,"viewBox",`0 0 ${icon.w} ${icon.h}`)
        if (attrs.style) {
            setAttrsOnElement(svg,{style: attrs.style})
        }
        const path = createElementNSHelper("path") as SVGPathElement
        setAttributeHelper(path,"fill", "currentcolor")
        setAttributeHelper(path,"d", icon.d)
        svg.appendChild(path)
        return svg
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
