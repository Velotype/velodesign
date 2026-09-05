
import { passthroughAttrsToElement } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import {History} from "./history.ts"

/**
 * Attrs type for `<Link/>`
 */
export type LinkAttrsType = {
    to: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * Renders an `<a/>` tag intended for internal app navigation by not reloading the page
 * on navigation.
 * 
 * For example an SPA app will use `<Link to="/other/spa/page">click here</Link>` to
 * render links to other pages within the SPA app.
 */
export const Link: FunctionComponent<LinkAttrsType> = function(attrs: LinkAttrsType, children: RenderableElements[]): HTMLAnchorElement {
    return passthroughAttrsToElement<HTMLAnchorElement>(<a
        href={attrs.to}
        onClick={(event: Event) => {
            event.preventDefault()
            History.changeLocation(attrs.to)
        }}>
        {children}
    </a>, attrs)
}
