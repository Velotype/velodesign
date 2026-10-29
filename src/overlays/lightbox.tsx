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
} = themeOptions({closeSymbol: "closeSymbol"})

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
}

/**
 * Attrs type for `<Lightbox/>` Component
 */
export type LightboxAttrsType = LightboxOptionsType & IdAttr & StylePassthroughAttrs & ChildrenAttr

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
padding:1rem;
box-sizing:border-box;
border:none;
background:transparent;
align-items:center;
justify-content:center;
cursor:zoom-out;
}
.vtd-lightbox[open]{display:flex;}
.vtd-lightbox::backdrop{background:rgba(0,0,0,0.85);}
.vtd-lightbox-image{display:block;max-width:100%;max-height:100%;object-fit:contain;border-radius:0.25rem;cursor:default;}
.vtd-lightbox-close{
position:absolute;
top:0.75rem;
inset-inline-end:0.75rem;
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
.vtd-lightbox-close:focus-visible{outline:2px solid #fff;outline-offset:2px;}
`, "vtd/Lightbox")
}

/** The one dialog every Lightbox on the page shares, made on first use */
let shared: {dialog: HTMLDialogElement, image: HTMLImageElement, close: HTMLButtonElement} | undefined

function sharedLightbox() {
    if (shared) {return shared}
    mountLightboxStyles()
    const image: HTMLImageElement = <img class="vtd-lightbox-image" alt=""/>
    const close: HTMLButtonElement = <button type="button" class="vtd-lightbox-close"><LightboxThemeOptions.closeSymbol/></button>
    const dialog: HTMLDialogElement = <dialog class="vtd-lightbox">{image}{close}</dialog>
    close.addEventListener("click", () => dialog.close())
    // The dialog fills the screen, so a click anywhere but the picture is a click on the backdrop
    dialog.addEventListener("click", (event: MouseEvent) => {
        if (event.target !== image) {dialog.close()}
    })
    document.body.append(dialog)
    shared = {dialog, image, close}
    return shared
}

/**
 * Shows a picture as large as the screen allows, over a dark backdrop, without leaving the page.
 * The close button, `Escape`, or a click anywhere but the picture closes it.
 *
 * For a page whose picture links are already in the document (server-rendered markup); otherwise
 * wrap the thumbnail in `<Lightbox/>`.
 */
export function openLightbox(options: LightboxOptionsType): void {
    const {dialog, image, close} = sharedLightbox()
    image.src = options.src
    image.alt = options.alt ?? ""
    if (options.closeLabel) {
        close.setAttribute("aria-label", options.closeLabel)
    } else {
        close.removeAttribute("aria-label")
    }
    if (!dialog.open) {dialog.showModal()}
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
        openLightbox({src: attrs.src, alt: attrs.alt, closeLabel: attrs.closeLabel})
    })
    return passthroughAttrsToElement<HTMLAnchorElement>(link, attrs)
}
