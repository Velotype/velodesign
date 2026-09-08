
import { passthroughAttrsToElement } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import {History} from "./history.ts"

/**
 * Attrs type for `<Link/>`
 */
export type LinkAttrsType = {
    to: string
    /**
     * If `true` (default `false`), clicking intercepts the browser's own navigation and calls
     * `History.changeLocation(to)` instead - a client-side route change with no full page
     * reload, for an SPA. Left `false` - the default, so `Link` behaves like a plain anchor
     * unless a consumer opts in - `to` navigates normally: a real page load, for a multi-page
     * site, or for a `to` that's genuinely external and should never be client-side-routed even
     * from inside an SPA. With this off, every native browser behavior (open-in-new-tab via
     * middle-click/ctrl-click/cmd-click, "copy link address", drag-to-bookmark, ...) works
     * exactly as it would for a hand-written anchor tag - `History.changeLocation` bypasses all
     * of that by design, which is exactly what an SPA route change wants and a multi-page site
     * does not.
     */
    spa?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * Renders an `<a/>` tag intended for internal app navigation.
 *
 * Defaults to plain navigation (`spa: false`) - a real page load, same as a hand-written anchor
 * tag - so `Link` is safe to reach for regardless of what kind of site it ends up in. Set
 * `spa={true}` to opt into SPA-style client-side routing via `History.changeLocation` instead;
 * see the `spa` attr's own doc comment for the full behavioral difference. Either way, `Link`
 * gives the same theming/layout benefit - it's only the navigation *mechanism* that changes.
 */
export const Link: FunctionComponent<LinkAttrsType> = function(attrs: LinkAttrsType, children: RenderableElements[]): HTMLAnchorElement {
    const spa = attrs.spa ?? false
    return passthroughAttrsToElement<HTMLAnchorElement>(<a
        href={attrs.to}
        onClick={spa ? (event: Event) => {
            event.preventDefault()
            History.changeLocation(attrs.to)
        } : undefined}>
        {children}
    </a>, attrs)
}
