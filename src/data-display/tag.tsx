import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, EmptyAttrs, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Options to customize `<Tag/>` Component Theme
 */
export const TagThemeOptions: {
    removeSymbol: FunctionComponent<EmptyAttrs>
} = {
    removeSymbol: function(){return "x"}
}

/**
 * Various types of `<Tag/>`s
 */
export type TagType = "primary" | "secondary" | "warning" | "danger" | "neutral"

/**
 * Attrs type for `<Tag/>` Component
 */
export type TagAttrsType = {
    /** What type of tag is this? (sets the color) */
    type?: TagType
    /** If set, a remove button is shown; called when it's clicked, just before the Tag removes itself from the DOM */
    onRemove?: () => void
    /** Accessible label for the remove button, when shown. No default - the library doesn't assume a language; set this (e.g. to "Remove") to give screen reader users a description */
    removeLabel?: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areTagStylesMounted = false

/**
 * A small inline label, like `Badge`, but optionally removable - for filter chips,
 * multi-select values, etc.
 */
export const Tag: FunctionComponent<TagAttrsType> = function(attrs: TagAttrsType, children: RenderableElements[]): HTMLSpanElement {
    if (!areTagStylesMounted) {
        areTagStylesMounted = true
        setStylesheet(`
.vtd-tag{
display:inline-flex;
align-items:center;
gap:0.35em;
padding:0.1em 0.6em;
border-radius:0.25rem;
font-size:0.85em;
line-height:1.6;
white-space:nowrap;
vertical-align:middle;
}
.vtd-tag-primary{background-color:var(--primary-3);border:1px solid var(--primary-6);}
.vtd-tag-secondary{background-color:var(--secondary-3);border:1px solid var(--secondary-6);}
.vtd-tag-warning{background-color:var(--warning-3);border:1px solid var(--warning-6);}
.vtd-tag-danger{background-color:var(--accent-3);border:1px solid var(--accent-6);}
.vtd-tag-neutral{background-color:var(--background-1);border:1px solid var(--background-6);}
.vtd-tag-remove{
cursor:pointer;
background:transparent;
border:none;
color:inherit;
font:inherit;
line-height:1;
padding:0;
opacity:0.7;
}
.vtd-tag-remove:hover{opacity:1;}
`, "vtd/Tag")
    }

    const tagElement: HTMLSpanElement = <span class={`vtd-tag vtd-tag-${attrs.type||"neutral"}`}>
        {children}
        {attrs.onRemove && <button type="button" class="vtd-tag-remove" aria-label={attrs.removeLabel} onClick={() => {
            attrs.onRemove?.()
            tagElement.remove()
        }}><TagThemeOptions.removeSymbol/></button>}
    </span>
    return passthroughAttrsToElement<HTMLSpanElement>(tagElement, attrs)
}
