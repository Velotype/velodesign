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
} & IdAttr & StylePassthroughAttrs

let areCarouselStylesMounted = false

/**
 * A single-slide-at-a-time carousel with prev/next arrows and optional dot indicators
 */
export class Carousel extends Component<CarouselAttrsType> {
    /** Index of the currently shown slide */
    #currentIndex = 0

    /** Create a new `<Carousel/>` Component */
    constructor(attrs: CarouselAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areCarouselStylesMounted) {
            areCarouselStylesMounted = true
            setStylesheet(`
.vtd-carousel{position:relative;overflow:hidden;border-radius:0.5rem;}
.vtd-carousel-track{position:relative;min-height:8em;}
.vtd-carousel-slide{display:flex;align-items:center;justify-content:center;}
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
    }

    /** Move to `index`, wrapping around, and re-render */
    #goTo(index: number, total: number) {
        this.#currentIndex = ((index % total) + total) % total
        this.refresh()
    }

    /** Render this Component */
    override render(attrs: CarouselAttrsType): RenderableElements {
        const total = attrs.slides.length
        return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-carousel">
            <div class="vtd-carousel-track">
                <div class="vtd-carousel-slide">{attrs.slides[this.#currentIndex]}</div>
                {total > 1 ? <Button class="vtd-carousel-nav vtd-carousel-nav-prev" type="secondary" onClick={() => this.#goTo(this.#currentIndex - 1, total)}>‹</Button> : null}
                {total > 1 ? <Button class="vtd-carousel-nav vtd-carousel-nav-next" type="secondary" onClick={() => this.#goTo(this.#currentIndex + 1, total)}>›</Button> : null}
            </div>
            {(attrs.showDots ?? true) && total > 1 ? <div class="vtd-carousel-dots">
                {attrs.slides.map((_slide, index) => <button
                    type="button"
                    class={`vtd-carousel-dot${index == this.#currentIndex ? " vtd-carousel-dot-active" : ""}`}
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => this.#goTo(index, total)}/>)}
            </div> : null}
        </div>, attrs)
    }
}
