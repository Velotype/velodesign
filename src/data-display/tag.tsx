import { Component, passthroughAttrsToElement } from "../core/velotype.ts"
import { removeElement } from "../core/dom-lifecycle.ts"
import { mountStyles } from "../core/styles.ts"
import type { ChildrenAttr, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<Tag/>` Component Theme
 */
export const TagThemeOptions: {
    /** Content of the remove button, shown only when `onRemove` is set. Defaults to `CommonThemeOptions.closeSymbol` */
    closeSymbol: ThemeSymbol
} = themeOptions({closeSymbol: "closeSymbol"})

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

/** Stylesheet for `<Tag/>`, mounted once on first construction */
const tagCss: string = `
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
` +
    /*
     * A real target with a real hover, not a glyph that gets slightly darker.
     *
     * Going from opacity 0.7 to 1 is the whole signal this used to give, which is both faint and
     * unlike every other interactive control in the package - the sidebar's chevron, a Menu row and a
     * TextBox's clear button all take a background on hover. An interactive element should say so the
     * same way wherever it appears, so this now does too, and it gets a square big enough to aim at
     * and a focus ring for the keyboard.
     */
    `
.vtd-tag-remove{
position:relative;
cursor:pointer;
display:inline-flex;
align-items:center;
justify-content:center;
box-sizing:border-box;
width:1.35em;
height:1.35em;
margin-inline-end:-0.3em;
background:transparent;
border:1px solid transparent;
border-radius:0.25rem;
color:inherit;
font:inherit;
line-height:1;
padding:0;
opacity:0.7;
transition:opacity 0.12s ease-in-out, background-color 0.12s ease-in-out;
}
` +
    /* --background, not a step of the ramp: the tag already carries a tint of its own type, so a
       neighbouring grey reads as muddy where the page's own background reads as a clear chip - and it
       flips with the theme, which a fixed rgba() would not */
    `
` +
    /*
     * The hit area is extended past the visual control rather than the control being made bigger. A Tag
     * is small by design and a 24px button would set the height of the whole chip; an overlay centred
     * on the 1.35em square reaches WCAG 2.2 SC 2.5.8's 24px without moving a pixel of the layout. It
     * extends about three pixels either side, which is inside the Tag's own padding rather than over a
     * neighbouring control.
     */
    `
.vtd-tag-remove::after{
content:"";
position:absolute;
top:50%;
left:50%;
transform:translate(-50%,-50%);
min-width:24px;
min-height:24px;
width:100%;
height:100%;
}
.vtd-tag-remove:hover{opacity:1;background-color:var(--background);}
.vtd-tag-remove:focus-visible{opacity:1;}
@media (prefers-reduced-motion: reduce){
.vtd-tag-remove{transition:none;}
}
`

/**
 * A small inline label, like `Badge`, but optionally removable - for filter chips,
 * multi-select values, etc.
 *
 * A class rather than a `FunctionComponent` for the same reason as `Alert`: removing takes the tag
 * off the page, and that has to run velotype's unmount lifecycle for the consumer content inside
 * it. `removeElement` needs a Component to do that through. See `core/dom-lifecycle.ts`.
 */
export class Tag extends Component<TagAttrsType> {
    /** Render this Component */
    override render(attrs: TagAttrsType, children: RenderableElements[]): HTMLSpanElement {
        if (!areTagStylesMounted) {
            areTagStylesMounted = true
            mountStyles(tagCss, "vtd/Tag")
        }

        const tagElement: HTMLSpanElement = <span class={`vtd-tag vtd-tag-${attrs.type||"neutral"}`}>
            {children}
            {attrs.onRemove && <button type="button" class="vtd-tag-remove" aria-label={attrs.removeLabel} onClick={() => {
                attrs.onRemove?.()
                removeElement(this, tagElement)
            }}><TagThemeOptions.closeSymbol/></button>}
        </span>
        return passthroughAttrsToElement<HTMLSpanElement>(tagElement, attrs)
    }
}
