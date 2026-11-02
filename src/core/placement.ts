/**
 * Keeping a floating part where it can be seen - a tooltip's bubble, a popover, a menu and its
 * submenus, a context menu, a dropdown list, a confirmation bubble.
 *
 * Each component still says where its part goes, in its own CSS or by script: below its trigger,
 * beside it, at the cursor. What they share is the check after that, run when the part shows:
 *
 * 1. **Flip.** Past the edge on its own side, it moves to the opposite side, if that runs past
 *    its edge by less.
 * 2. **Shrink.** A list that has room on neither side is made shorter and scrolls (`scrolls`), and
 *    anything wider than all there is to see wraps within it.
 * 3. **Slide.** Along its side - sideways for a part above or below, up or down for one beside -
 *    until it is inside. It is kept inside the other way too: one with room on neither side, that
 *    can't scroll, or one hung from a trigger at the very edge (a context menu opened in a corner),
 *    moves over its trigger rather than past the edge.
 *
 * "What can be seen" is the viewport, cut down by every ancestor that clips the part's overflow:
 * a `Modal`, or a panel that scrolls, hides a part past its edge as surely as the window does. A
 * part in the top layer or `position:fixed` escapes those, so for it the viewport is all.
 *
 * The slide is the `translate` property, which composes with any `transform` a component's own CSS
 * gives the part, so no stylesheet has to make room for it.
 *
 * **Placing again is cheap, because `keepPlaced` runs it on every frame of a scroll or a resize.**
 * Each frame reads all the layout it needs first and writes after, so the browser lays the page out
 * once (a read after a write forces a layout there and then), and it writes nothing that hasn't
 * changed - a still page costs a few reads and no writes. The other side is never tried out: where
 * the part would sit there is worked out from where it sits now and the anchor it hangs from. The
 * ancestors that clip it are found once, when it opens. `tests/basic_tests.test.ts` records each
 * frame's reads and writes in order and holds it to that.
 */

/** A side of the thing a floating part belongs to */
export type PlacementSide = "top" | "bottom" | "left" | "right"

/** The side a part flips to when its own has no room */
export const OPPOSITE_SIDE: Record<PlacementSide, PlacementSide> = {top: "bottom", bottom: "top", left: "right", right: "left"}

/** How close a floating part may come to the edge of what can be seen, in px */
export const EDGE_MARGIN = 8

/** A rectangle in viewport coordinates - a `DOMRect`, or one made up, like a cursor's point */
export type PlacementBox = {left: number, top: number, right: number, bottom: number}

/** A part's size, as last measured - what `setSide` needs to put it above a point */
export type PlacementSize = {width: number, height: number}

/** Options for `placeInView` and `keepPlaced` */
export type PlaceInViewOptions = {
    /** The side the component asks for */
    side: PlacementSide
    /**
     * Puts the part on a side: a class swap for a part placed by CSS, or coordinates for one placed
     * by script. **Only writes - it must not read layout**, which would undo the point of reading
     * first. `size` is the part's, measured already, for a part placed above a point.
     */
    setSide: (side: PlacementSide, size: PlacementSize) => void
    /**
     * What the part hangs from, read each time it's placed (default: its containing block - the
     * trigger's own box, for a part positioned inside it). A part placed by script passes its own:
     * a cursor's point, or a trigger it sits outside of.
     */
    anchor?: () => PlacementBox
    /** A list that scrolls: made shorter, rather than left running past an edge, when neither side has room for all of it */
    scrolls?: boolean
}

/** What placing a part last did to it, so placing it again can start from there without undoing it first */
type Placed = {
    /** The side it's on */
    side: PlacementSide
    /** The slide written, in px */
    x: number
    y: number
    /** Its height before any shortening - a list's, when it scrolls */
    naturalHeight: number
    /** The height it was shortened to, or none */
    maxHeight: number | null
    /** Wrapped within the visible width, and how wide it was before */
    wrapped: boolean
    naturalWidth: number
    /** The ancestors that clip it - found when it opened; none above the page */
    clippers: Element[]
}

const placedParts = new WeakMap<HTMLElement, Placed>()

/**
 * The ancestors that clip `element`'s overflow, nearest first - found when it opens, since walking
 * them reads every ancestor's computed style.
 *
 * The walk starts at its containing block (`offsetParent`), not its parent: an ancestor's overflow
 * clips only what is positioned inside it, so a clipping box *between* an absolutely positioned
 * part and its containing block does not hide it. It stops at an ancestor fixed to the viewport,
 * which nothing further up clips, and a part fixed or in the top layer has none.
 */
function findClippers(element: HTMLElement): Element[] {
    if (getComputedStyle(element).position === "fixed") {return []}
    try {
        if (element.matches(":popover-open")) {return []}
    } catch {
        // A browser without popovers has no top layer to be in
    }
    const clippers: Element[] = []
    for (let parent: Element | null = element.offsetParent ?? element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.overflowX !== "visible" || style.overflowY !== "visible") {clippers.push(parent)}
        if (style.position === "fixed") {break}
    }
    return clippers
}

/** Where a part can be seen: the viewport, cut down by its clipping ancestors - reads only */
function visibleArea(clippers: Element[]): PlacementBox {
    const area = {left: 0, top: 0, right: innerWidth, bottom: innerHeight}
    for (const clipper of clippers) {
        const rect = clipper.getBoundingClientRect()
        area.left = Math.max(area.left, rect.left)
        area.top = Math.max(area.top, rect.top)
        area.right = Math.min(area.right, rect.right)
        area.bottom = Math.min(area.bottom, rect.bottom)
    }
    return area
}

/** How far past the edge on its own side a part placed there runs, in px - zero or less is inside */
function overflowPast(box: PlacementBox, side: PlacementSide, area: PlacementBox): number {
    switch (side) {
        case "top": return area.top + EDGE_MARGIN - box.top
        case "bottom": return box.bottom - (area.bottom - EDGE_MARGIN)
        case "left": return area.left + EDGE_MARGIN - box.left
        case "right": return box.right - (area.right - EDGE_MARGIN)
    }
}

/** How far to move `start`-`end` so it sits inside `low`-`high` - toward `low` first when it can't fit at all */
function slideInto(start: number, end: number, low: number, high: number): number {
    if (start < low) {return low - start}
    if (end > high) {return Math.max(high - end, low - start)}
    return 0
}

/** Sets an inline style only when it differs, so placing again with nothing changed touches nothing */
function setStyle(element: HTMLElement, property: string, value: string) {
    if (element.style.getPropertyValue(property) !== value) {
        if (value) {element.style.setProperty(property, value)} else {element.style.removeProperty(property)}
    }
}

/** The part's containing block, the default anchor - its trigger's box, for a part positioned inside it */
function containingBox(element: HTMLElement): PlacementBox {
    return (element.offsetParent ?? element.parentElement ?? element).getBoundingClientRect()
}

/** Where a part sits on one side, worked out rather than tried: the same gap from the anchor, the same place along it */
function boxOn(side: PlacementSide, from: PlacementSide, natural: PlacementBox, anchor: PlacementBox, size: PlacementSize): PlacementBox {
    const gap = from === "bottom" ? natural.top - anchor.bottom
        : from === "top" ? anchor.top - natural.bottom
        : from === "right" ? natural.left - anchor.right
        : anchor.left - natural.right
    if (side === "top" || side === "bottom") {
        const top = side === "bottom" ? anchor.bottom + gap : anchor.top - gap - size.height
        return {left: natural.left, right: natural.right, top, bottom: top + size.height}
    }
    const left = side === "right" ? anchor.right + gap : anchor.left - gap - size.width
    return {left, right: left + size.width, top: natural.top, bottom: natural.bottom}
}

/** What a placing decided - written in one go, after every read - and the area it decided it in */
type Decision = {side: PlacementSide, x: number, y: number, maxHeight: number | null, size: PlacementSize, area: PlacementBox}

/**
 * Decides where the part goes, from layout read now - it reads, and writes nothing. `state` is
 * what the last placing did, so the box measured can be taken back to the part as it would be
 * without it: unslid, unshortened, on the side it was on.
 */
function decide(element: HTMLElement, options: PlaceInViewOptions, state: Placed): Decision {
    const measured = element.getBoundingClientRect()
    const anchor = (options.anchor ?? (() => containingBox(element)))()
    const area = visibleArea(state.clippers)
    const aboveOrBelow = options.side === "top" || options.side === "bottom"
    const size = {width: measured.width, height: state.maxHeight === null ? measured.height : state.naturalHeight}
    // As it sits on its side before any slide; a shortened part keeps the edge it hangs from
    let top = measured.top - state.y
    if (state.maxHeight !== null && state.side === "top") {top = measured.bottom - state.y - size.height}
    const natural = {left: measured.left - state.x, right: measured.right - state.x, top, bottom: top + size.height}

    const asked = boxOn(options.side, state.side, natural, anchor, size)
    let side = options.side
    let box = asked
    const past = overflowPast(asked, options.side, area)
    if (past > 0) {
        const flipped = OPPOSITE_SIDE[options.side]
        const other = boxOn(flipped, state.side, natural, anchor, size)
        if (overflowPast(other, flipped, area) < past) {
            side = flipped
            box = other
        }
    }
    // A list with room on neither side: as tall as there's room for, and it scrolls
    let maxHeight: number | null = null
    const stillPast = overflowPast(box, side, area)
    if (options.scrolls && aboveOrBelow && stillPast > 0) {
        maxHeight = Math.max(Math.floor(size.height - stillPast), 0)
        box = side === "bottom" ? {...box, bottom: box.bottom - stillPast} : {...box, top: box.top + stillPast}
    }
    // Inside on both axes: along its side is the usual slide; across it only moves a part that
    // still runs past an edge, which is then better over its trigger than out of sight
    const x = Math.round(slideInto(box.left, box.right, area.left + EDGE_MARGIN, area.right - EDGE_MARGIN))
    const y = Math.round(slideInto(box.top, box.bottom, area.top + EDGE_MARGIN, area.bottom - EDGE_MARGIN))
    return {side, x, y, maxHeight, size, area}
}

/** Writes a decision - only what differs from what the part has */
function apply(element: HTMLElement, options: PlaceInViewOptions, state: Placed, decision: Decision) {
    if (decision.side !== state.side) {options.setSide(decision.side, decision.size)}
    if (options.scrolls) {setStyle(element, "max-height", decision.maxHeight === null ? "" : `${decision.maxHeight}px`)}
    // Written the way the browser reads it back ("4px 0px" reads as "4px"), or every frame would
    // see a difference that isn't one and write it again
    setStyle(element, "translate", decision.x === 0 && decision.y === 0 ? "" : decision.y === 0 ? `${decision.x}px` : `${decision.x}px ${decision.y}px`)
    if (state.maxHeight === null && decision.maxHeight !== null) {state.naturalHeight = decision.size.height}
    state.side = decision.side
    state.x = decision.x
    state.y = decision.y
    state.maxHeight = decision.maxHeight
}

/**
 * Puts a floating part where it can be seen - see the module comment for the three steps - and
 * returns the side it ended up on. Call it when the part shows, and when what's in it changes
 * size; for one that stays open while the page moves, `keepPlaced` places it again. A part that
 * isn't laid out (`display:none`) is left as it is.
 *
 * This first placing starts from nothing: it clears what a last one wrote, puts the part on the
 * side asked for and measures it there. That forces one layout - a second when it has to wrap - on
 * a click, not a frame. Placing again on scroll or resize doesn't.
 */
export function placeInView(element: HTMLElement, options: PlaceInViewOptions): PlacementSide {
    setStyle(element, "translate", "")
    setStyle(element, "width", "")
    setStyle(element, "max-width", "")
    setStyle(element, "white-space", "")
    if (options.scrolls) {setStyle(element, "max-height", "")}
    // Not measured yet: the side asked for is the one a part's own placing never needs a size for
    options.setSide(options.side, {width: 0, height: 0})
    const measured = element.getBoundingClientRect()
    if (measured.width === 0 && measured.height === 0) {
        placedParts.delete(element)
        return options.side
    }
    const state: Placed = {side: options.side, x: 0, y: 0, naturalHeight: measured.height, maxHeight: null,
        wrapped: false, naturalWidth: measured.width, clippers: findClippers(element)}
    // Wider than all there is to see: wrap within it. As wide as its words up to that - an
    // absolutely placed part would otherwise wrap to whatever room its offset leaves it, which
    // beside a narrow trigger is a column a few words wide
    const area = visibleArea(state.clippers)
    const across = area.right - area.left - 2 * EDGE_MARGIN
    if (measured.width > across) {
        setStyle(element, "width", "max-content")
        setStyle(element, "max-width", `${Math.max(Math.floor(across), 0)}px`)
        setStyle(element, "white-space", "normal")
        state.wrapped = true
    }
    placedParts.set(element, state)
    const decision = decide(element, options, state)
    apply(element, options, state, decision)
    return decision.side
}

/**
 * Places a part again from where it is: reads, then writes what changed. Falls back to a first
 * placing when there's nothing to start from, or when the part has to start or stop wrapping -
 * which changes its size, so it has to be measured afresh.
 */
function placeAgain(element: HTMLElement, options: PlaceInViewOptions): (() => void) | undefined {
    const state = placedParts.get(element)
    if (!state) {return () => { placeInView(element, options) }}
    const decision = decide(element, options, state)
    const across = decision.area.right - decision.area.left - 2 * EDGE_MARGIN
    // Room now for its words on one line, or less room than it wrapped to: measured afresh
    if (state.wrapped ? state.naturalWidth <= across || decision.size.width > across : decision.size.width > across) {
        return () => { placeInView(element, options) }
    }
    return () => { apply(element, options, state, decision) }
}

/**
 * A setter for `placeInView` that swaps `<prefix>-<side>` classes on `element` - for a part
 * whose stylesheet has a rule per side. Leaves its other classes alone.
 */
export function sideClassSetter(element: HTMLElement, prefix: string): (side: PlacementSide) => void {
    return side => {
        for (const other of ["top", "bottom", "left", "right"] as PlacementSide[]) {
            if (other !== side) {element.classList.remove(`${prefix}-${other}`)}
        }
        element.classList.add(`${prefix}-${side}`)
    }
}

/**
 * Keeps open floating parts placed while what's around them moves: places them again on a resize,
 * or a scroll anywhere except inside `root` (a list scrolled through doesn't move), at most once a
 * frame. `parts` says which parts are open now - a menu and whichever submenu is - and every one of
 * them is read before any is written, so a frame lays the page out once however many there are.
 * Returns what stops it: call that when they close, and on unmount.
 */
export function keepPlaced(root: HTMLElement, parts: () => [HTMLElement, PlaceInViewOptions][]): () => void {
    let frame = 0
    const schedule = (event: Event) => {
        if (event.target instanceof Node && root.contains(event.target)) {return}
        if (frame) {return}
        frame = requestAnimationFrame(() => {
            frame = 0
            // Every read, then every write
            const writes = parts().map(([element, options]) => placeAgain(element, options))
            for (const write of writes) {write?.()}
        })
    }
    globalThis.addEventListener("resize", schedule)
    // Capture: a scroll in any scrolling ancestor, not only the page's
    document.addEventListener("scroll", schedule, {capture: true, passive: true})
    return () => {
        cancelAnimationFrame(frame)
        frame = 0
        globalThis.removeEventListener("resize", schedule)
        document.removeEventListener("scroll", schedule, {capture: true})
    }
}
