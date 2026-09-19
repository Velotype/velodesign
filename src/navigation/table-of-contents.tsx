import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * One entry in a `<TableOfContents/>`
 */
export type TableOfContentsItemType = {
    /** `id` of the element this entry links to - the anchor target */
    id: string
    /** Displayed text for this entry */
    label: RenderableElements
    /** Depth, 1 being top level (default: `1`). Levels past 6 render at 6. */
    level?: number
}

/**
 * Attrs type for `<TableOfContents/>` Component
 */
export type TableOfContentsAttrsType = {
    /** The entries to list, in the order they appear on the page */
    items: TableOfContentsItemType[]
    /** Content shown above the list, e.g. "On this page" */
    header?: RenderableElements
    /**
     * Distance in px from the top of the viewport at which a section counts as current.
     *
     * Set this to the height of a sticky header (default: `0`), or the entry for the section
     * sitting *behind* that header reads as the current one.
     */
    topOffset?: number
    /**
     * Accessible label for the nav landmark, e.g. "On this page".
     *
     * No default, like every other ARIA label in this package - see CLAUDE.md's language-agnostic
     * rule. A page usually has more than one `<nav>`, so this is worth setting.
     */
    ariaLabel?: string
} & IdAttr & StylePassthroughAttrs

let areTableOfContentsStylesMounted = false

/**
 * A list of a page's sections, with the one currently in view highlighted and each entry linking
 * to its section.
 *
 * `items` is data the consumer passes, not something scraped out of the DOM. Deriving the list by
 * querying for headings looks convenient and is a lifecycle hazard - it has to run after the
 * content it describes is mounted, and silently produces an empty list when it doesn't. The page
 * already knows its own sections.
 *
 * **Which entry is current is tracked with an `IntersectionObserver`, never a scroll handler.** A
 * `scroll` listener fires at display rate and would have to read layout on every event to answer
 * the same question - precisely what "Interaction must only touch the DOM that actually changed"
 * rules out. The observer instead reports only when a section actually crosses the band, and the
 * callback still returns early when the resulting entry is unchanged, so scrolling the length of
 * one long section does no DOM work at all.
 */
export class TableOfContents extends Component<TableOfContentsAttrsType> {
    #root: HTMLElement
    #links = new Map<string, HTMLAnchorElement>()
    /** Last reported intersection state per id, keyed in `items` order */
    #state = new Map<string, {intersecting: boolean, top: number}>()
    #activeId: string | undefined = undefined
    #observer: IntersectionObserver | undefined = undefined
    #items: TableOfContentsItemType[]
    #topOffset: number

    constructor(attrs: TableOfContentsAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#items = attrs.items
        this.#topOffset = attrs.topOffset ?? 0

        if (!areTableOfContentsStylesMounted) {
            areTableOfContentsStylesMounted = true
            setStylesheet(`
.vtd-table-of-contents{width:100%;box-sizing:border-box;}
.vtd-table-of-contents-header{
font-size:0.75em;
font-weight:bold;
text-transform:uppercase;
letter-spacing:0.05em;
color:var(--background-6);
padding:0 0 0.6em 0.9em;
}
.vtd-table-of-contents-list{list-style:none;margin:0;padding:0;}
.vtd-table-of-contents-link{
display:block;
padding:0.3em 0 0.3em 0.9em;
/* The rail: one continuous line down the list, with the current entry's segment picked out */
border-inline-start:2px solid var(--background-4);
color:var(--background-7);
text-decoration:none;
font-size:0.9em;
line-height:1.4;
transition:color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}
.vtd-table-of-contents-link:hover{color:var(--text);border-inline-start-color:var(--background-6);}
.vtd-table-of-contents-link-active{
color:var(--primary-8);
border-inline-start-color:var(--primary);
font-weight:bold;
}
/* Each level steps in from the rail; past 6 they all sit at the same depth */
.vtd-table-of-contents-level-1{padding-inline-start:0.9em;}
.vtd-table-of-contents-level-2{padding-inline-start:1.8em;}
.vtd-table-of-contents-level-3{padding-inline-start:2.7em;}
.vtd-table-of-contents-level-4{padding-inline-start:3.6em;}
.vtd-table-of-contents-level-5{padding-inline-start:4.5em;}
.vtd-table-of-contents-level-6{padding-inline-start:5.4em;}
@media (prefers-reduced-motion: reduce){
.vtd-table-of-contents-link{transition:none;}
}
`, "vtd/TableOfContents")
        }

        const list: HTMLElement = <ol class="vtd-table-of-contents-list">
            {attrs.items.map(item => {
                const level = Math.min(Math.max(item.level ?? 1, 1), 6)
                const link: HTMLAnchorElement = <a
                    class={`vtd-table-of-contents-link vtd-table-of-contents-level-${level}`}
                    href={`#${item.id}`}
                    onClick={() => {
                        // Highlight the clicked entry immediately rather than waiting for the
                        // scroll to arrive - the observer would get there, but not until the
                        // smooth scroll finishes, which reads as the click not registering
                        this.#setActive(item.id)
                    }}>{item.label}</a>
                this.#links.set(item.id, link)
                return <li class="vtd-table-of-contents-item">{link}</li>
            })}
        </ol>

        this.#root = passthroughAttrsToElement<HTMLElement>(<nav class="vtd-table-of-contents" aria-label={attrs.ariaLabel}>
            {attrs.header ? <div class="vtd-table-of-contents-header">{attrs.header}</div> : null}
            {list}
        </nav>, attrs)
    }

    override mount(): void {
        // A section taller than the band leaves nothing intersecting, so the bottom margin keeps
        // the band thin near the top and `#computeActive` falls back to the last section passed
        const observer = new IntersectionObserver(entries => this.#onIntersect(entries), {
            rootMargin: `-${this.#topOffset}px 0px -70% 0px`,
        })
        for (const item of this.#items) {
            const target = document.getElementById(item.id)
            if (target) {
                observer.observe(target)
            }
        }
        this.#observer = observer
    }

    override unmount(): void {
        this.#observer?.disconnect()
        this.#observer = undefined
    }

    #onIntersect(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            // `boundingClientRect` comes with the entry, so this reads no layout of its own
            this.#state.set(entry.target.id, {
                intersecting: entry.isIntersecting,
                top: entry.boundingClientRect.top,
            })
        }
        this.#setActive(this.#computeActive())
    }

    /**
     * Whether the reader has scrolled a scrollable page as far as it goes.
     *
     * This reads scroll geometry, which "Interaction must only touch the DOM that actually
     * changed" rules out of a *continuous* handler - but the observer callback fires only when a
     * section crosses the band, not at display rate, so the read happens a handful of times per
     * page rather than per frame.
     *
     * The scrollable check matters: on a page short enough not to scroll at all, every position
     * is "the bottom", and treating that as such would pin the highlight to the last entry
     * forever.
     */
    #isScrolledToBottom(): boolean {
        const height = document.documentElement.scrollHeight
        if (height <= globalThis.innerHeight + 2) {
            return false
        }
        return globalThis.scrollY + globalThis.innerHeight >= height - 2
    }

    /** The first section inside the band, or failing that the last one scrolled past */
    #computeActive(): string | undefined {
        // Checked *before* the band, not after: a page that ends shortly after its final section
        // clamps the scroll before that section can reach the band, so some earlier section is
        // still sitting in it and would win every time. The last entry could then never highlight
        // however far the reader scrolled - which is most pages, since the last section is rarely
        // a screen tall.
        if (this.#isScrolledToBottom()) {
            return this.#items[this.#items.length - 1]?.id
        }
        for (const item of this.#items) {
            if (this.#state.get(item.id)?.intersecting) {
                return item.id
            }
        }
        let lastPassed: string | undefined = undefined
        for (const item of this.#items) {
            const state = this.#state.get(item.id)
            if (state && state.top <= this.#topOffset) {
                lastPassed = item.id
            }
        }
        return lastPassed ?? this.#items[0]?.id
    }

    /**
     * Moves the highlight, touching only the two links whose state actually changes.
     *
     * Returns early when the active entry is unchanged, which is the common case while scrolling
     * through a single long section.
     */
    #setActive(id: string | undefined): void {
        if (id === this.#activeId) {
            return
        }
        const previous = this.#activeId === undefined ? undefined : this.#links.get(this.#activeId)
        if (previous) {
            previous.classList.remove("vtd-table-of-contents-link-active")
            previous.removeAttribute("aria-current")
        }
        const next = id === undefined ? undefined : this.#links.get(id)
        if (next) {
            next.classList.add("vtd-table-of-contents-link-active")
            next.setAttribute("aria-current", "true")
        }
        this.#activeId = id
    }

    override render(): RenderableElements {
        return this.#root
    }
}
