import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "./button.tsx"

/**
 * Attrs type for `<Carousel/>` Component
 */
export type CarouselAttrsType = {
    /** The set of slides to cycle through */
    slides: RenderableElements[]
    /** Show numbered dot indicators below the slides (default: `true`) */
    showDots?: boolean
    /**
     * Builds the accessible label for one dot indicator, given its 0-indexed slide index
     * (e.g. `index => `Go to slide ${index + 1}``). No default - the library doesn't assume a
     * language; without this, the dot buttons have no accessible name at all.
     */
    getDotLabel?: (index: number) => string
} & IdAttr & StylePassthroughAttrs

let areCarouselStylesMounted = false

/**
 * A single-slide-at-a-time carousel with prev/next arrows and optional dot indicators.
 *
 * Every slide stays mounted in the DOM permanently (hidden via the native `hidden` attribute
 * unless it's the current one), rather than only the current slide being present - moving
 * between slides just toggles `hidden`/classes directly on the already-built elements, it never
 * calls `this.refresh()`. `slides` is consumer-supplied and can be arbitrary components with
 * their own state; a `refresh()`-based rebuild on every slide change would tear all of that
 * down and reconstruct it from scratch, losing whatever state an off-screen slide held.
 */
export class Carousel extends Component<CarouselAttrsType> {
    /** Index of the currently shown slide */
    #currentIndex = 0
    /** Slide wrapper elements, in order */
    #slideEls: HTMLDivElement[] = []
    /** Dot indicator buttons, in order (empty if `showDots` is off or there's only one slide) */
    #dotEls: HTMLButtonElement[] = []
    #root: HTMLDivElement

    /** Move to `index`, wrapping around, toggling visibility/classes directly on the already-built elements */
    #goTo(index: number, total: number) {
        const nextIndex = ((index % total) + total) % total
        if (nextIndex == this.#currentIndex) {
            return
        }
        this.#slideEls[this.#currentIndex]?.setAttribute("hidden", "")
        this.#dotEls[this.#currentIndex]?.classList.remove("vtd-carousel-dot-active")
        this.#currentIndex = nextIndex
        this.#slideEls[this.#currentIndex]?.removeAttribute("hidden")
        this.#dotEls[this.#currentIndex]?.classList.add("vtd-carousel-dot-active")
    }

    /** Create a new `<Carousel/>` Component */
    constructor(attrs: CarouselAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areCarouselStylesMounted) {
            areCarouselStylesMounted = true
            setStylesheet(`
.vtd-carousel{width:100%;box-sizing:border-box;position:relative;overflow:hidden;border-radius:0.5rem;}
.vtd-carousel-track{position:relative;min-height:8em;}
.vtd-carousel-slide{display:flex;align-items:center;justify-content:center;}
.vtd-carousel-slide[hidden]{display:none;}
.vtd-carousel-nav{
position:absolute;
top:50%;
transform:translateY(-50%);
z-index:1;
}
.vtd-carousel-nav-prev{left:0.5em;}
.vtd-carousel-nav-next{right:0.5em;}
.vtd-carousel-dots{display:flex;justify-content:center;gap:0.5em;padding-block-start:0.75em;}
.vtd-carousel-dot{
width:0.6em;
height:0.6em;
border-radius:50%;
background-color:var(--background-4);
border:none;
cursor:pointer;
padding:0;
}
.vtd-carousel-dot-active{background-color:var(--primary);}
`, "vtd/Carousel")
        }

        const total = attrs.slides.length
        this.#slideEls = attrs.slides.map((slide, index) => <div class="vtd-carousel-slide" hidden={index != this.#currentIndex}>{slide}</div>)

        const dotsEl = (attrs.showDots ?? true) && total > 1 ? <div class="vtd-carousel-dots">
            {attrs.slides.map((_slide, index) => {
                const dot: HTMLButtonElement = <button
                    type="button"
                    class={`vtd-carousel-dot${index == this.#currentIndex ? " vtd-carousel-dot-active" : ""}`}
                    aria-label={attrs.getDotLabel?.(index)}
                    onClick={() => this.#goTo(index, total)}/>
                this.#dotEls[index] = dot
                return dot
            })}
        </div> : null

        this.#root = <div class="vtd-carousel">
            <div class="vtd-carousel-track">
                {this.#slideEls}
                {total > 1 ? <Button class="vtd-carousel-nav vtd-carousel-nav-prev" type="secondary" onClick={() => this.#goTo(this.#currentIndex - 1, total)}>‹</Button> : null}
                {total > 1 ? <Button class="vtd-carousel-nav vtd-carousel-nav-next" type="secondary" onClick={() => this.#goTo(this.#currentIndex + 1, total)}>›</Button> : null}
            </div>
            {dotsEl}
        </div>

        passthroughAttrsToElement<HTMLDivElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
