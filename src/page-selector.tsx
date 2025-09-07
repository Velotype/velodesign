import { Component } from "jsr:@velotype/velotype"
import type { FunctionComponent, EmptyAttrs, RenderableElements } from "jsr:@velotype/velotype"

export type Page = {
    basename: string
    page: typeof Component<EmptyAttrs> | FunctionComponent<EmptyAttrs>
}

export type PageSelectorAttrsType = {
    pages: Page[]
    notFoundPage: typeof Component<EmptyAttrs> | FunctionComponent<EmptyAttrs>
}
export class PageSelector extends Component<PageSelectorAttrsType> {
    locationChangeListener = (): void => {
        this.refresh()
    }
    override mount() {
        globalThis.addEventListener('popstate', this.locationChangeListener)
        globalThis.addEventListener('locationchange', this.locationChangeListener)
    }
    override unmount() {
        globalThis.removeEventListener('popstate', this.locationChangeListener)
        globalThis.removeEventListener('locationchange', this.locationChangeListener)
    }
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
