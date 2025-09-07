
import { Component } from "jsr:@velotype/velotype"
import type { ChildrenAttr, RenderableElements, CSSProperties } from "jsr:@velotype/velotype"
import {History} from "./history.ts"

export type LinkAttrsType = {
    to: string
    style?: CSSProperties | string
}
export class Link extends Component<LinkAttrsType & ChildrenAttr> {
    override render(attrs: LinkAttrsType, children: RenderableElements ) {
        return <a href={attrs.to} style={attrs.style} onClick={(event: Event) => {
            event.preventDefault()
            History.changeLocation(attrs.to)
        }}>{children}</a>
    }
}
