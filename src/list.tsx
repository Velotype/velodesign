import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single entry in a `<List/>`
 */
export type ListItemType = {
    /** Unique key identifying this item */
    key: string
    /** Main content for this item */
    title: RenderableElements
    /** Optional smaller supporting text below the title */
    description?: RenderableElements
    /** Content shown before the title/description (e.g. an `Avatar` or `Icon`) */
    leading?: RenderableElements
    /** Content shown after the title/description (e.g. a `Button` or `Badge`) */
    trailing?: RenderableElements
}

/**
 * Attrs type for `<List/>` Component
 */
export type ListAttrsType = {
    /** The set of entries to show */
    items: ListItemType[]
} & IdAttr & StylePassthroughAttrs

let areListStylesMounted = false

/**
 * A styled list of items, each with optional leading/trailing slots
 */
export const List: FunctionComponent<ListAttrsType> = function(attrs: ListAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areListStylesMounted) {
        areListStylesMounted = true
        setStylesheet(`
.vtd-list{width:100%;box-sizing:border-box;list-style:none;padding:0;margin:0;}
.vtd-list-item{
display:flex;
align-items:center;
gap:0.75em;
padding:0.75em 0;
border-block-end:1px solid var(--background-4);
}
.vtd-list-item:last-child{border-block-end:none;}
.vtd-list-item-leading{flex-shrink:0;}
.vtd-list-item-body{flex-grow:1;min-width:0;}
.vtd-list-item-title{overflow-wrap:break-word;}
.vtd-list-item-description{font-size:0.9em;opacity:0.7;margin-block-start:0.15em;}
.vtd-list-item-trailing{flex-shrink:0;}
`, "vtd/List")
    }

    return passthroughAttrsToElement<HTMLElement>(<ul class="vtd-list">
        {attrs.items.map(item => <li class="vtd-list-item">
            {item.leading && <span class="vtd-list-item-leading">{item.leading}</span>}
            <span class="vtd-list-item-body">
                <div class="vtd-list-item-title">{item.title}</div>
                {item.description && <div class="vtd-list-item-description">{item.description}</div>}
            </span>
            {item.trailing && <span class="vtd-list-item-trailing">{item.trailing}</span>}
        </li>)}
    </ul>, attrs)
}
