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
    /**
     * If set, wraps the item's title in a real `<a href>` spanning the item's full width - a
     * native "stretched link" (see `.vtd-list-item-link::after` below), so middle-click/
     * ctrl-click/right-click "open in new tab" all keep working, unlike a JS-only click handler
     * would. Takes priority over `onSelect` if both are set on the same item.
     */
    href?: string
    /** If set (and `href` isn't), makes the item a JS-driven "select" action via a stretched
     * `<button>` instead of an `<a>` - for picking an item that should trigger something other
     * than navigation. `trailing` content (e.g. a `Button`) stays clickable above the item-level
     * stretch either way - see the `:is(a,button,...)` rule below. */
    onSelect?: () => void
}

/**
 * Attrs type for `<List/>` Component
 */
export type ListAttrsType = {
    /** The set of entries to show */
    items: ListItemType[]
    /** Alternate item background colors for readability (default: `false`) */
    zebra?: boolean
    /** Highlight an item's background on hover (default: `false`) */
    highlightOnHover?: boolean
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
position:relative;
display:flex;
align-items:center;
gap:0.75em;
padding:0.75em 0;
border-block-end:1px solid var(--background-4);
}
.vtd-list-item:last-child{border-block-end:none;}
.vtd-list-zebra .vtd-list-item:nth-child(even){background-color:var(--background-1);}
.vtd-list-hoverable .vtd-list-item:hover{background-color:var(--background-1);}
.vtd-list-zebra.vtd-list-hoverable .vtd-list-item:nth-child(even):hover{background-color:var(--background-2);}
.vtd-list-item-leading{flex-shrink:0;}
.vtd-list-item-body{flex-grow:1;min-width:0;}
.vtd-list-item-title{overflow-wrap:break-word;}
.vtd-list-item-description{font-size:0.9em;opacity:0.7;margin-block-start:0.15em;}
.vtd-list-item-trailing{flex-shrink:0;}
/* See DataTable's identical .vtd-datatable-row-link comment for the full rationale. */
.vtd-list-item-link{color:inherit;text-decoration:none;}
.vtd-list-item-link-button{display:block;width:100%;text-align:inherit;background:transparent;border:none;color:inherit;font:inherit;padding:0;cursor:pointer;}
.vtd-list-item-link::after{content:"";position:absolute;inset:0;z-index:0;}
.vtd-list-item :is(a,button,input,select,textarea):not(.vtd-list-item-link):not(.vtd-list-item-link-button){position:relative;z-index:1;}
`, "vtd/List")
    }

    const listClass = `vtd-list${attrs.zebra ? " vtd-list-zebra" : ""}${attrs.highlightOnHover ? " vtd-list-hoverable" : ""}`

    return passthroughAttrsToElement<HTMLElement>(<ul class={listClass}>
        {attrs.items.map(item => {
            const titleEl = <div class="vtd-list-item-title">{item.title}</div>
            const useButton = !item.href && !!item.onSelect
            return <li class="vtd-list-item">
                {item.leading && <span class="vtd-list-item-leading">{item.leading}</span>}
                <span class="vtd-list-item-body">
                    {item.href
                        ? <a class="vtd-list-item-link" href={item.href}>{titleEl}</a>
                        : useButton
                        ? <button type="button" class="vtd-list-item-link vtd-list-item-link-button" onClick={() => item.onSelect?.()}>{titleEl}</button>
                        : titleEl}
                    {item.description && <div class="vtd-list-item-description">{item.description}</div>}
                </span>
                {item.trailing && <span class="vtd-list-item-trailing">{item.trailing}</span>}
            </li>
        })}
    </ul>, attrs)
}
