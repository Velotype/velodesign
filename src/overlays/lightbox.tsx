/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import { passthroughAttrsToElement } from "../core/velotype.ts"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize the `<Lightbox/>` Theme
 */
export const LightboxThemeOptions: {
    /** Content of the corner close button. Defaults to `CommonThemeOptions.closeSymbol` */
    closeSymbol: ThemeSymbol
    /** Content of the zoom button while the picture fits the screen. `+` - only the lightbox draws this, so it stays local */
    zoomInSymbol: ThemeSymbol
    /** Content of the zoom button while the picture is zoomed in. `−` */
    zoomOutSymbol: ThemeSymbol
} = themeOptions({closeSymbol: "closeSymbol"}, {
    zoomInSymbol: function() {return "+"},
    zoomOutSymbol: function() {return "−"}
})

/**
 * What `openLightbox()` shows
 */
export type LightboxOptionsType = {
    /** The picture to show */
    src: string
    /** The picture's alternative text */
    alt?: string
    /**
     * Accessible name for the close button, which shows only `LightboxThemeOptions.closeSymbol`.
     * No default - the library doesn't assume a language
     */
    closeLabel?: string
    /** Accessible name for the zoom button while the picture fits the screen. No default */
    zoomInLabel?: string
    /** Accessible name for the zoom button while the picture is zoomed in. No default */
    zoomOutLabel?: string
}

/**
 * Attrs type for `<Lightbox/>` Component
 */
export type LightboxAttrsType = LightboxOptionsType & IdAttr & StylePassthroughAttrs & ChildrenAttr

/** Zoomed in, the picture is at least this many times its fitted width - more when it has the pixels */
const MIN_ZOOM = 2
/** A press that moves further than this, in px, is a drag to look around, not a click to zoom */
const DRAG_SLOP = 4

let areLightboxStylesMounted = false

function mountLightboxStyles() {
    if (areLightboxStylesMounted) {return}
    areLightboxStylesMounted = true
    mountStyles(`
.vtd-lightbox-trigger{display:inline-block;cursor:zoom-in;}
.vtd-lightbox{
position:fixed;
inset:0;
width:100vw;
height:100vh;
max-width:none;
max-height:none;
margin:0;
padding:0;
box-sizing:border-box;
border:none;
background:transparent;
overflow:hidden;
}
.vtd-lightbox::backdrop{background:rgba(0,0,0,0.85);}
.vtd-lightbox-stage{
position:absolute;
inset:0;
display:flex;
align-items:center;
justify-content:center;
padding:3.5rem 1rem;
box-sizing:border-box;
cursor:zoom-out;
}
.vtd-lightbox-image{display:block;max-width:100%;max-height:100%;object-fit:contain;border-radius:0.25rem;cursor:zoom-in;user-select:none;-webkit-user-drag:none;}
.vtd-lightbox-zoomed .vtd-lightbox-stage{align-items:flex-start;justify-content:flex-start;overflow:auto;padding:0;overscroll-behavior:contain;}
.vtd-lightbox-zoomed .vtd-lightbox-image{flex:none;max-width:none;max-height:none;margin:auto;border-radius:0;cursor:grab;}
.vtd-lightbox-dragging .vtd-lightbox-image{cursor:grabbing;}
.vtd-lightbox-controls{position:absolute;top:0.75rem;inset-inline-end:0.75rem;display:flex;gap:0.5rem;}
.vtd-lightbox-control{
display:flex;
align-items:center;
justify-content:center;
width:2.75rem;
height:2.75rem;
padding:0;
border:none;
border-radius:50%;
background:rgba(255,255,255,0.9);
color:#000;
font:inherit;
font-size:1.1rem;
cursor:pointer;
}
.vtd-lightbox-control:focus-visible{outline:2px solid #fff;outline-offset:2px;}
`, "vtd/Lightbox")
}

type Shared = {
    dialog: HTMLDialogElement
    stage: HTMLDivElement
    image: HTMLImageElement
    zoom: HTMLButtonElement
    zoomIn: HTMLElement
    zoomOut: HTMLElement
    close: HTMLButtonElement
    options: LightboxOptionsType
}

/** The one dialog every Lightbox on the page shares, made on first use */
let shared: Shared | undefined

/** An accessible name, or none */
function setLabel(element: HTMLElement, label: string | undefined) {
    if (label) {
        element.setAttribute("aria-label", label)
    } else {
        element.removeAttribute("aria-label")
    }
}

function isZoomed(s: Shared): boolean {
    return s.dialog.classList.contains("vtd-lightbox-zoomed")
}

/**
 * Zooms in, keeping the point under (x, y) where it is - or zooms back out to fit the screen.
 * Zoomed in, the picture is shown at its own pixels, or at least MIN_ZOOM times its fitted size,
 * and the stage scrolls, so a drag, the wheel or a swipe looks around it.
 */
function setZoom(s: Shared, zoomed: boolean, x?: number, y?: number) {
    if (zoomed == isZoomed(s)) {return}
    if (zoomed) {
        const fitted = s.image.getBoundingClientRect()
        const width = Math.max(s.image.naturalWidth, fitted.width * MIN_ZOOM)
        const scale = width / fitted.width
        // The fraction of the picture under the point, defaulting to its middle
        const fx = x === undefined ? 0.5 : (x - fitted.left) / fitted.width
        const fy = y === undefined ? 0.5 : (y - fitted.top) / fitted.height
        s.dialog.classList.add("vtd-lightbox-zoomed")
        s.image.style.width = `${width}px`
        // After the class, so the stage measures zoomed; the point stays under the pointer, or the middle in the middle
        const stage = s.stage.getBoundingClientRect()
        s.stage.scrollLeft = fx * width - (x === undefined ? stage.width / 2 : x - stage.left)
        s.stage.scrollTop = fy * fitted.height * scale - (y === undefined ? stage.height / 2 : y - stage.top)
    } else {
        s.dialog.classList.remove("vtd-lightbox-zoomed")
        s.image.style.width = ""
    }
    s.zoom.replaceChildren(zoomed ? s.zoomOut : s.zoomIn)
    setLabel(s.zoom, zoomed ? s.options.zoomOutLabel : s.options.zoomInLabel)
    s.zoom.setAttribute("aria-pressed", String(zoomed))
}

function sharedLightbox(): Shared {
    if (shared) {return shared}
    mountLightboxStyles()
    const image: HTMLImageElement = <img class="vtd-lightbox-image" alt="" draggable="false"/>
    const stage: HTMLDivElement = <div class="vtd-lightbox-stage">{image}</div>
    const zoom: HTMLButtonElement = <button type="button" class="vtd-lightbox-control vtd-lightbox-zoom" aria-pressed="false"></button>
    const close: HTMLButtonElement = <button type="button" class="vtd-lightbox-control vtd-lightbox-close"><LightboxThemeOptions.closeSymbol/></button>
    const dialog: HTMLDialogElement = <dialog class="vtd-lightbox">{stage}<div class="vtd-lightbox-controls">{zoom}{close}</div></dialog>
    const s: Shared = {dialog, stage, image, zoom, close, options: {src: ""},
        zoomIn: <span><LightboxThemeOptions.zoomInSymbol/></span>, zoomOut: <span><LightboxThemeOptions.zoomOutSymbol/></span>}
    zoom.append(s.zoomIn)

    close.addEventListener("click", () => dialog.close())
    // The dialog itself, outside the stage and the controls, is the backdrop too
    dialog.addEventListener("click", (event: MouseEvent) => { if (event.target === dialog) {dialog.close()} })
    zoom.addEventListener("click", () => setZoom(s, !isZoomed(s)))
    // A click beside the picture closes it; a click on the picture zooms (unless it ended a drag)
    let press: {x: number, y: number, left: number, top: number, moved: boolean} | undefined
    stage.addEventListener("click", (event: MouseEvent) => {
        if (event.target !== image) {
            dialog.close()
            return
        }
        if (press?.moved) {return}
        setZoom(s, !isZoomed(s), event.clientX, event.clientY)
    })
    // Zoomed in, dragging the picture looks around it - the wheel and a touch swipe scroll the stage already
    image.addEventListener("pointerdown", (event: PointerEvent) => {
        press = {x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop, moved: false}
    })
    image.addEventListener("pointermove", (event: PointerEvent) => {
        if (!press || !isZoomed(s) || event.pointerType == "touch" || (event.buttons & 1) == 0) {return}
        const dx = event.clientX - press.x
        const dy = event.clientY - press.y
        if (!press.moved && Math.abs(dx) + Math.abs(dy) < DRAG_SLOP) {return}
        if (!press.moved) {
            press.moved = true
            dialog.classList.add("vtd-lightbox-dragging")
        }
        stage.scrollLeft = press.left - dx
        stage.scrollTop = press.top - dy
    })
    const endDrag = () => {
        dialog.classList.remove("vtd-lightbox-dragging")
        // Cleared after the click this release produces has seen it
        setTimeout(() => { press = undefined }, 0)
    }
    image.addEventListener("pointerup", endDrag)
    image.addEventListener("pointercancel", endDrag)
    // Every opening starts fitted
    dialog.addEventListener("close", () => setZoom(s, false))
    document.body.append(dialog)
    shared = s
    return s
}

/**
 * Shows a picture as large as the screen allows, over a dark backdrop, without leaving the page.
 * A click on the picture, or the zoom button, zooms in to look closer - a drag, the wheel or a
 * swipe looks around it - and again zooms back out. The close button, `Escape`, or a click beside
 * the picture closes it.
 *
 * For a page whose picture links are already in the document (server-rendered markup); otherwise
 * wrap the thumbnail in `<Lightbox/>`.
 */
export function openLightbox(options: LightboxOptionsType): void {
    const s = sharedLightbox()
    s.options = options
    setZoom(s, false)
    s.image.src = options.src
    s.image.alt = options.alt ?? ""
    setLabel(s.close, options.closeLabel)
    setLabel(s.zoom, options.zoomInLabel)
    if (!s.dialog.open) {s.dialog.showModal()}
}

/**
 * A plain left click opens the picture in the lightbox. A click asking for a new tab or window (a
 * modifier key, the middle button) is left to the browser
 */
export function isPlainClick(event: MouseEvent): boolean {
    return event.button == 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

/**
 * Wraps its children - usually a smaller copy of the picture - in a link to the full picture that
 * opens it in the lightbox (`openLightbox`). The link stays a real link: with a modifier key or the
 * middle button, or before the script runs, it opens the picture as the browser would.
 */
export const Lightbox: FunctionComponent<LightboxAttrsType> = function(attrs: LightboxAttrsType, children: RenderableElements[]): HTMLAnchorElement {
    mountLightboxStyles()
    const link: HTMLAnchorElement = <a class="vtd-lightbox-trigger" href={attrs.src}>{children}</a>
    link.addEventListener("click", (event: MouseEvent) => {
        if (!isPlainClick(event)) {return}
        event.preventDefault()
        openLightbox({src: attrs.src, alt: attrs.alt, closeLabel: attrs.closeLabel, zoomInLabel: attrs.zoomInLabel, zoomOutLabel: attrs.zoomOutLabel})
    })
    return passthroughAttrsToElement<HTMLAnchorElement>(link, attrs)
}
