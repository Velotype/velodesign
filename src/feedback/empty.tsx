import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { ChildrenAttr, FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { CommonThemeOptions, themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<Empty/>` Component Theme
 */
export const EmptyThemeOptions: {
    /**
     * Shown above the title. Replace it with a real illustration to give empty states a house
     * style - this is the whole visual, `vtd-empty-icon` sizing and all, not just the glyph, so an
     * illustration isn't stuck inside a 2.5em span. To change only the glyph, and change it here
     * and in both tables and every chart at once, set `CommonThemeOptions.emptySymbol` instead.
     */
    emptySymbol: ThemeSymbol
} = themeOptions({}, {
    emptySymbol: function(){return <span class="vtd-empty-icon" aria-hidden="true"><CommonThemeOptions.emptySymbol/></span>}
})

/**
 * Attrs type for `<Empty/>` Component
 */
export type EmptyAttrsType = {
    /** Main message. No default - `EmptyThemeOptions.emptySymbol` (the ∅ symbol) is the only default visual, so the library doesn't assume a language */
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
width:100%;
box-sizing:border-box;
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
        <EmptyThemeOptions.emptySymbol/>
        {attrs.title ? <div class="vtd-empty-title">{attrs.title}</div> : null}
        {attrs.description && <div class="vtd-empty-description">{attrs.description}</div>}
        {children}
    </div>, attrs)
}
