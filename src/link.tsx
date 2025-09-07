
import { Component } from "jsr:@velotype/velotype"
import type { ChildrenAttr, RenderableElements, CSSProperties } from "jsr:@velotype/velotype"
import {History} from "./history.ts"

/**
 * Attrs type for `<Link/>`
 */
export type LinkAttrsType = {
    to: string
    style?: CSSProperties | string
}
/**
 * Renders an `<a/>` tag intended for internal app navigation by not reloading the page
 * on navigation.
 * 
 * For example an SPA app will use `<Link to="/other/spa/page">click here</Link>` to
 * render links to other pages within the SPA app.
 */
export class Link extends Component<LinkAttrsType & ChildrenAttr> {
    /** Render this Component */
    override render(attrs: LinkAttrsType, children: RenderableElements): HTMLAnchorElement {
        return <a href={attrs.to} style={attrs.style} onClick={(event: Event) => {
            event.preventDefault()
            History.changeLocation(attrs.to)
        }}>{children}</a>
    }
}
