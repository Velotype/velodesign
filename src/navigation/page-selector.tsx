import { Component } from "../core/velotype.ts"
import type { FunctionComponent, EmptyAttrs, RenderableElements } from "../core/velotype.ts"
import { addGlobalListener, getPathname, removeGlobalListener } from "../core/utilities.ts"

/**
 * One routable page in a `<PageSelector pages={[...]}/>`
 */
export type PageSelectorPageType = {
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
    pages: PageSelectorPageType[]
    /** Fallback page if no other page matches */
    notFoundPage: typeof Component<EmptyAttrs> | FunctionComponent<EmptyAttrs>
}

/**
 * Renders one out of a set of potential pages based on the `location.pathname`
 */
export class PageSelector extends Component<PageSelectorAttrsType> {

    /** Mount this Component */
    override mount() {
        addGlobalListener('popstate', this.refresh)
        addGlobalListener('locationchange', this.refresh)
    }

    /** Unmount this Component */
    override unmount() {
        removeGlobalListener('popstate', this.refresh)
        removeGlobalListener('locationchange', this.refresh)
    }

    /** Render this Component */
    override render(attrs: PageSelectorAttrsType): RenderableElements {
        const page = attrs.pages.find(function(page: PageSelectorPageType) {
            if (getPathname() == page.basename) {
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
