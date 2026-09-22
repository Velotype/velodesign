import {Component, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { Button } from "../form/button.tsx"
import { CommonThemeOptions } from "../core/theme-options.ts"

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
    /**
     * Automatically advance through the slides on a timer (default: `false`). Advancing stops
     * permanently the first time the user interacts with the carousel (clicking a prev/next
     * arrow or a dot) - it never resumes on its own afterward, on the assumption that a user who
     * has taken control of the pace wants to keep it.
     */
    autoplay?: boolean
    /** Delay in ms before the very first automatic advance (default: same as `autoplayDelay`) */
    autoplayFirstDelay?: number
    /** Flat delay in ms between each automatic advance, after the first (default: `5000`) */
    autoplayDelay?: number
    /**
     * Per-slide delay overrides in ms, keyed by the *currently shown* slide's 0-indexed
     * position - how long that slide stays up before auto-advancing away from it. Takes
     * priority over `autoplayFirstDelay`/`autoplayDelay` for whichever indices it defines.
     */
    autoplaySlideDelays?: Record<number, number>
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
    #attrs: CarouselAttrsType
    /** Index of the currently shown slide */
    #currentIndex = 0
    /** Slide wrapper elements, in order */
    #slideEls: HTMLDivElement[] = []
    /** Dot indicator buttons, in order (empty if `showDots` is off or there's only one slide) */
    #dotEls: HTMLButtonElement[] = []
    #root: HTMLDivElement

    /** Whether the autoplay timer is still running - flips to `false` for good the first time
     * the user picks a slide themselves (see `#stopAutoplay`) */
    #autoplayActive: boolean
    /** Handle for the pending `setTimeout` advancing to the next slide, if autoplay is active */
    // `ReturnType<typeof setTimeout>`, not `number` - under Deno's own lib types setTimeout
    // returns a `Timeout` object, so hardcoding `number` only type-checks in a DOM-only project
    #autoplayTimeoutId?: ReturnType<typeof setTimeout>
    /** Whether autoplay has advanced at least once yet - once true, `autoplayFirstDelay` no
     * longer applies even if a later slide happens to have no explicit `autoplaySlideDelays`
     * entry of its own */
    #hasAutoAdvancedOnce = false

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

    /**
     * Left/Right move between slides, Home/End jump to the ends.
     *
     * Scoped to this carousel's *own* controls rather than to the whole component: a slide may hold
     * a text box or another carousel, and a handler on the region would swallow the arrow keys a
     * reader was using to move the caret. Checking that the event started on a dot or a nav button
     * keeps the keys where they belong without having to enumerate what they might have hit.
     *
     * Focus follows the selection back onto the matching dot, so holding Right walks the carousel
     * the way holding Right walks a tab strip - moving the slide while leaving focus on a dot that
     * no longer matches it is the thing that makes a picker feel broken.
     */
    #handleKeyDown = (event: KeyboardEvent) => {
        const total = this.#attrs.slides.length
        const target = event.target instanceof Element ? event.target.closest(".vtd-carousel-dot,.vtd-carousel-nav") : null
        if (!target || total < 2) {
            return
        }
        const step = event.key == "ArrowRight" ? 1 : event.key == "ArrowLeft" ? -1 : 0
        let next = step == 0 ? -1 : this.#currentIndex + step
        if (event.key == "Home") {
            next = 0
        } else if (event.key == "End") {
            next = total - 1
        }
        if (next < 0 && step == 0) {
            return
        }
        event.preventDefault()
        this.#handleUserGoTo(next, total)
        if (target.classList.contains("vtd-carousel-dot")) {
            this.#dotEls[this.#currentIndex]?.focus()
        }
    }

    /** Permanently stops autoplay - called on any user-driven navigation (see class doc comment) */
    #stopAutoplay() {
        this.#autoplayActive = false
        if (this.#autoplayTimeoutId !== undefined) {
            clearTimeout(this.#autoplayTimeoutId)
            this.#autoplayTimeoutId = undefined
        }
    }

    /** A user picked a slide themselves (prev/next/dot) - stop autoplay for good, then navigate */
    #handleUserGoTo(index: number, total: number) {
        this.#stopAutoplay()
        this.#goTo(index, total)
    }

    /** Schedules the next automatic advance, using the current slide's own delay override if
     * `autoplaySlideDelays` has one, else `autoplayFirstDelay` for the very first advance or
     * `autoplayDelay` for every one after that */
    #scheduleAutoAdvance(total: number) {
        if (!this.#autoplayActive) {
            return
        }
        const perSlideDelay = this.#attrs.autoplaySlideDelays?.[this.#currentIndex]
        const delay = perSlideDelay ?? (!this.#hasAutoAdvancedOnce
            ? (this.#attrs.autoplayFirstDelay ?? this.#attrs.autoplayDelay ?? 5000)
            : (this.#attrs.autoplayDelay ?? 5000))
        this.#autoplayTimeoutId = setTimeout(() => {
            this.#hasAutoAdvancedOnce = true
            this.#goTo(this.#currentIndex + 1, total)
            this.#scheduleAutoAdvance(total)
        }, delay)
    }

    /** Mount this Component - autoplay's timers only start once actually on the page, and are
     * torn down on unmount so a removed Carousel never keeps ticking in the background */
    override mount() {
        if (this.#autoplayActive) {
            this.#scheduleAutoAdvance(this.#attrs.slides.length)
        }
    }
    override unmount() {
        this.#stopAutoplay()
    }

    /** Create a new `<Carousel/>` Component */
    constructor(attrs: CarouselAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        this.#autoplayActive = !!attrs.autoplay
        if (!areCarouselStylesMounted) {
            areCarouselStylesMounted = true
            mountStyles(`
.vtd-carousel{width:100%;box-sizing:border-box;position:relative;overflow:hidden;border-radius:0.5rem;}
.vtd-carousel-track{position:relative;}
.vtd-carousel-slide{display:flex;align-items:center;justify-content:center;}
.vtd-carousel-slide[hidden]{display:none;}
` +
/*
 * Scoped under the carousel's own root, and it has to be: these rules land on a `Button`, so they
 * compete with `.vtd-button` at equal specificity in the same layer, where source order decides -
 * and Button's sheet always mounts second, because a Carousel constructs one. `.vtd-button` sets
 * `position:relative` for its loading spinner, so the unscoped rule lost every time and the arrows
 * rendered in flow underneath the slide instead of over it. Measured: computed position was
 * `relative`, with prev and next stacked together at the bottom-left corner.
 */
`
.vtd-carousel .vtd-carousel-nav{
position:absolute;
top:50%;
transform:translateY(-50%);
z-index:1;
}
.vtd-carousel .vtd-carousel-nav-prev{left:0.5em;}
.vtd-carousel .vtd-carousel-nav-next{right:0.5em;left:auto;}
.vtd-carousel-dots{display:flex;justify-content:center;gap:0.5em;padding-block-start:0.75em;}
.vtd-carousel-dot{
`+
/*
 * The dot a reader sees is 0.6em; the control they tap is 24px square, drawn as a transparent box
 * with the dot painted by ::before. Sizing the button itself to the dot made a 10x10 target - the
 * smallest anywhere in the package, and less than half of what WCAG 2.2 SC 2.5.8 asks. The dots
 * keep their 0.5em gap, so at 24px apiece the targets sit edge to edge without overlapping.
 */
`
min-width:24px;
min-height:24px;
display:flex;
align-items:center;
justify-content:center;
background:transparent;
border:none;
cursor:pointer;
padding:0;
}
.vtd-carousel-dot::before{
content:"";
width:0.6em;
height:0.6em;
border-radius:50%;
background-color:var(--background-4);
}
.vtd-carousel-dot-active::before{background-color:var(--primary);}
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
                    onClick={() => this.#handleUserGoTo(index, total)}/>
                this.#dotEls[index] = dot
                return dot
            })}
        </div> : null

        this.#root = <div class="vtd-carousel" onKeyDown={this.#handleKeyDown}>
            <div class="vtd-carousel-track">
                {this.#slideEls}
                {total > 1 ? <Button class="vtd-carousel-nav vtd-carousel-nav-prev" type="secondary" onClick={() => this.#handleUserGoTo(this.#currentIndex - 1, total)}><CommonThemeOptions.prevSymbol/></Button> : null}
                {total > 1 ? <Button class="vtd-carousel-nav vtd-carousel-nav-next" type="secondary" onClick={() => this.#handleUserGoTo(this.#currentIndex + 1, total)}><CommonThemeOptions.nextSymbol/></Button> : null}
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
