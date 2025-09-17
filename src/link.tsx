
import { passthroughAttrsToElement } from "jsr:@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "jsr:@velotype/velotype"
import {History} from "./history.ts"

/**
 * Attrs type for `<Link/>`
 */
export type LinkAttrsType = {
    to: string
}
/**
 * Renders an `<a/>` tag intended for internal app navigation by not reloading the page
 * on navigation.
 * 
 * For example an SPA app will use `<Link to="/other/spa/page">click here</Link>` to
 * render links to other pages within the SPA app.
 */
export const Link: FunctionComponent<LinkAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr> = function(attrs: LinkAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr, children: RenderableElements[]): HTMLAnchorElement {
    return passthroughAttrsToElement(<a
        href={attrs.to}
        onClick={(event: Event) => {
            event.preventDefault()
            History.changeLocation(attrs.to)
        }}>
        {children}
    </a>, attrs) as HTMLAnchorElement
}
