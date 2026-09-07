import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, EmptyAttrs, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Options to customize `<Empty/>` Component Theme
 */
export const EmptyThemeOptions: {
    image: FunctionComponent<EmptyAttrs>
} = {
    image: function(){return <span class="vtd-empty-icon" aria-hidden="true">∅</span>}
}

/**
 * Attrs type for `<Empty/>` Component
 */
export type EmptyAttrsType = {
    /** Main message (default: `"No data"`) */
    title?: RenderableElements
    /** Optional smaller supporting text below the title */
    description?: RenderableElements
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areEmptyStylesMounted = false

/**
 * A placeholder shown in place of a list/table/section that has no data, optionally
 * with a `children` slot for a follow-up action (e.g. a "Create one" `Button`)
 */
export const Empty: FunctionComponent<EmptyAttrsType> = function(attrs: EmptyAttrsType, children: RenderableElements[]): HTMLDivElement {
    if (!areEmptyStylesMounted) {
        areEmptyStylesMounted = true
        setStylesheet(`
.vtd-empty{
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
gap:0.5em;
padding:2.5em 1em;
text-align:center;
color:var(--text);
}
.vtd-empty-icon{font-size:2.5em;opacity:0.4;line-height:1;}
.vtd-empty-title{font-weight:bold;}
.vtd-empty-description{opacity:0.7;font-size:0.9em;}
`, "vtd/Empty")
    }

    return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-empty" role="status">
        <EmptyThemeOptions.image/>
        <div class="vtd-empty-title">{attrs.title || "No data"}</div>
        {attrs.description && <div class="vtd-empty-description">{attrs.description}</div>}
        {children}
    </div>, attrs)
}
