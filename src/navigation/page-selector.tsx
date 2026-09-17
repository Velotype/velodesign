import { Component } from "@velotype/velotype"
import type { FunctionComponent, EmptyAttrs, RenderableElements } from "@velotype/velotype"

/**
 * A potential Page for rendering in a `<PageSelector pages={[<Page/>]}/>`
 */
export type Page = {
    /** URL to match */
    basename: string
    /** Page to render when URL matches `basename` */
    page: typeof Component<EmptyAttrs> | FunctionComponent<EmptyAttrs>
}

/**
 * Attrs type for PageSelector
 */
export type PageSelectorAttrsType = {
    /** The set of potential pages to render */
    pages: Page[]
    /** Fallback page if no other page matches */
    notFoundPage: typeof Component<EmptyAttrs> | FunctionComponent<EmptyAttrs>
}

/**
 * Renders one out of a set of potential pages based on the `location.pathname`
 */
export class PageSelector extends Component<PageSelectorAttrsType> {

    /** Mount this Component */
    override mount() {
        globalThis.addEventListener('popstate', this.refresh)
        globalThis.addEventListener('locationchange', this.refresh)
    }

    /** Unmount this Component */
    override unmount() {
        globalThis.removeEventListener('popstate', this.refresh)
        globalThis.removeEventListener('locationchange', this.refresh)
    }

    /** Render this Component */
    override render(attrs: PageSelectorAttrsType): RenderableElements {
        const page = attrs.pages.find(function(page: Page) {
            if (globalThis.location.pathname == page.basename) {
                return true
            }
            return false
        })
        if (page) {
            return <page.page/>
        } else {
            return <attrs.notFoundPage/>
        }
    }
}
