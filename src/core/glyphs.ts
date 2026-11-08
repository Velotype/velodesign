import { mountStyles } from "./styles.ts"
import { createElementNSHelper, setAttributeHelper, svgNamespace } from "./utilities.ts"

/*
 * Glyphs are cross-cutting: Checkbox, Select, Menu, Table, Spinner, the theme symbols and more
 * draw them, across most categories - so the drawing lives here in core, and `typography/icon.ts`
 * keeps the public `<I/>` component and its registry.
 */

/**
 * An Icon: one SVG path, drawn either filled or as lines.
 *
 * Filled (no `strokeWidth`) is the shape itself, in `currentcolor`. With a `strokeWidth`, the path
 * is drawn as lines of that width with round ends and round corners, in `currentcolor` - the
 * package's own glyphs (`Glyphs`) are all drawn that way. A zero-length segment (`M6 12h0`) draws
 * a round dot as wide as the line, so a glyph with dots is still one path. With a `strokeWidth`
 * and `filled`, the lines are drawn and the shape inside them filled too: a solid shape with
 * round corners (`Glyphs.star`).
 */
export class Icon {
    /** width of the icon's drawing box */
    w: number
    /** height of the icon's drawing box */
    h: number
    /**
     * SVG path to draw the icon
     *
     * Reference: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d
     */
    d: string
    /** Draws the path as lines this wide (in the drawing box's units) instead of filling it */
    strokeWidth?: number
    /** With `strokeWidth`, also fills the shape inside the lines, which round its corners */
    filled?: boolean
    /** Create a new Icon */
    constructor(w: number, h: number, d: string, strokeWidth?: number, filled?: boolean) {
        this.w = w
        this.h = h
        this.d = d
        this.strokeWidth = strokeWidth
        this.filled = filled
    }
}

let iconStylesheetSet: boolean = false
export function mountIconStyles() {
    if (!iconStylesheetSet) {
        iconStylesheetSet = true
        mountStyles('.vtd-icon{height:calc(1em * var(--vtd-icon-scale,1));margin-block:calc((1 - var(--vtd-icon-scale,1)) * 0.5em);width:auto;vertical-align:middle;flex-shrink:0;}','vtd/Icon', "base")
    }
}

/**
 * An icon as an `<svg>` element, sized `1em` tall in `currentcolor` like a letter.
 *
 * `label` names it for assistive tech (`role="img"`); without one it is decoration and hidden
 * from it, which is what a glyph beside or inside text with its own words should be.
 */
export function iconElement(icon: Icon, label?: string): SVGSVGElement {
    mountIconStyles()
    const svg = createElementNSHelper("svg") as SVGSVGElement
    setAttributeHelper(svg,"xmlns",svgNamespace)
    setAttributeHelper(svg,"class", "vtd-icon")
    setAttributeHelper(svg,"viewBox",`0 0 ${icon.w} ${icon.h}`)
    if (label) {
        setAttributeHelper(svg,"role", "img")
        setAttributeHelper(svg,"aria-label", label)
    } else {
        setAttributeHelper(svg,"aria-hidden", "true")
    }
    const path = createElementNSHelper("path") as SVGPathElement
    if (icon.strokeWidth) {
        setAttributeHelper(path,"fill", icon.filled ? "currentcolor" : "none")
        setAttributeHelper(path,"stroke", "currentcolor")
        setAttributeHelper(path,"stroke-width", String(icon.strokeWidth))
        setAttributeHelper(path,"stroke-linecap", "round")
        setAttributeHelper(path,"stroke-linejoin", "round")
    } else {
        setAttributeHelper(path,"fill", "currentcolor")
    }
    setAttributeHelper(path,"d", icon.d)
    svg.appendChild(path)
    return svg
}

/**
 * A glyph as an element, `scale` times the text's height (`1.3` = 1.3em). A glyph's lines sit
 * inside its 24-unit box with room around them, so a glyph standing in for a text character is
 * drawn a little larger than `1em` to match its ink; a negative margin gives the growth back, so
 * the line it sits in keeps its height. Decoration, hidden from assistive tech: the control it
 * sits in carries the name.
 */
export function glyphElement(icon: Icon, scale: number): SVGSVGElement {
    const svg = iconElement(icon)
    // Only the scale is inline - the height it makes is the stylesheet's, so a component can
    // still resize a glyph in one place (a dialog's corner) with an ordinary rule
    if (scale !== 1) {
        setAttributeHelper(svg, "style", `--vtd-icon-scale:${scale}`)
    }
    return svg
}

/**
 * The package's own glyphs: line drawings in a 24-unit box, round-ended, in `currentcolor`.
 *
 * Every control that shows a small symbol draws it from here rather than from a text character,
 * so it looks the same in every font and on every system. They are exported for a consumer that
 * wants the same marks in its own UI (`<I icon={Glyphs.tick}/>`).
 *
 * Which to use where, kept consistent across the package:
 * - **A chevron: you stay put, and what's shown changes** - a select or disclosure opening, a
 *   submenu, stepping a calendar month or a table page.
 * - **An arrow: something moves** - sorting (the data moves), a sidebar sliding to its edge, a
 *   link that leaves the page.
 */
export const Glyphs = {
    /** A cross, for closing, cancelling or removing - drawn smaller and bolder for small controls */
    cross: new Icon(24, 24, "M7.5 7.5l9 9M16.5 7.5l-9 9", 2.6),
    /** A larger, lighter cross for a corner with room around it (a dialog's, a drawer's) */
    crossLight: new Icon(24, 24, "M7 7l10 10M17 7L7 17", 1.6),
    /** A tick, for confirming, choosing or done */
    tick: new Icon(24, 24, "M5 12.5l4.5 4.5L19 7.5", 2.8),
    /**
     * The tick drawn centred by its ink rather than its box, for a mark that sits alone in the
     * middle of a small square (`Checkbox`): the long arm carries the weight, so a box-centred tick
     * reads low
     */
    tickCentred: new Icon(24, 24, "M5 11.44l4.5 4.5L19 6.44", 3),
    /** A dash, for a checkbox that is partly chosen */
    dash: new Icon(24, 24, "M6.5 12h11", 3),
    /** A chevron pointing down */
    chevronDown: new Icon(24, 24, "M6 9l6 6 6-6", 2),
    /** A chevron pointing up */
    chevronUp: new Icon(24, 24, "M6 15l6-6 6 6", 2),
    /** A chevron pointing left */
    chevronLeft: new Icon(24, 24, "M15 6l-6 6 6 6", 2),
    /** A chevron pointing right */
    chevronRight: new Icon(24, 24, "M9 6l6 6-6 6", 2),
    /** An arrow pointing up */
    arrowUp: new Icon(24, 24, "M12 19V5.5M6.5 11L12 5.5 17.5 11", 2.2),
    /** An arrow pointing down */
    arrowDown: new Icon(24, 24, "M12 5v13.5M6.5 13L12 18.5 17.5 13", 2.2),
    /** An arrow pointing left */
    arrowLeft: new Icon(24, 24, "M19 12H5.5M11 6.5L5.5 12 11 17.5", 2.2),
    /** An arrow pointing right */
    arrowRight: new Icon(24, 24, "M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5", 2.2),
    /** An arrow into an edge on the left: a panel sliding away to that side */
    arrowToEdge: new Icon(24, 24, "M5 5.5v13M19 12H9.5M13.5 8L9.5 12l4 4", 2),
    /** Three dots on a line: more, hidden here */
    dots: new Icon(24, 24, "M6 12h0M12 12h0M18 12h0", 3),
    /** Three lines: a menu */
    menu: new Icon(24, 24, "M4.5 7h15M4.5 12h15M4.5 17h15", 2.2),
    /** A pencil, for editing */
    pencil: new Icon(24, 24, "M5 19l.9-3.9L15.6 5.4a1.9 1.9 0 0 1 2.7 0l.3.3a1.9 1.9 0 0 1 0 2.7L8.9 18.1zM13.6 7.4l3 3", 2),
    /** A five-pointed star, solid with round corners, for a rating */
    star: new Icon(24, 24, "M12 3.1l2.37 6.34 6.76.29-5.3 4.22 1.81 6.52L12 16.73l-5.64 3.74 1.81-6.52-5.3-4.22 6.76-.29z", 1.8, true),
    /** A magnifying glass with a plus: zoom in */
    zoomIn: new Icon(24, 24, "M16.7 10.5a6.2 6.2 0 1 1-12.4 0 6.2 6.2 0 1 1 12.4 0zM15.2 15.2l4.3 4.3M10.5 7.9v5.2M7.9 10.5h5.2", 2),
    /** A magnifying glass with a minus: zoom out */
    zoomOut: new Icon(24, 24, "M16.7 10.5a6.2 6.2 0 1 1-12.4 0 6.2 6.2 0 1 1 12.4 0zM15.2 15.2l4.3 4.3M7.9 10.5h5.2", 2),
    /** An empty tray: nothing here, for a list, a table or a search alike */
    tray: new Icon(24, 24, "M4 13.5l2.4-6.3A1.8 1.8 0 0 1 8.1 6h7.8a1.8 1.8 0 0 1 1.7 1.2L20 13.5v4a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM4 13.5h4.3l1.2 2h5l1.2-2H20", 1.6),
    /** A small table with a header row: its columns */
    columns: new Icon(24, 24, "M6 4.5h12a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 1-2.5-2.5V7A2.5 2.5 0 0 1 6 4.5zM3.5 9h17M9.5 9v10.5M14.5 9v10.5", 2),
}
