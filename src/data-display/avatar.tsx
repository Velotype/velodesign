import {type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"

/**
 * Which of the theme's colours an initials avatar is drawn in.
 *
 * The same set every other coloured component here takes, and that is the point: a colour *name*
 * resolves through the palette, which already has a light and a dark value for each, so one
 * attribute covers all four of the colours a hand-specified avatar would need (text and background,
 * twice). A free-form colour cannot do that - a consumer passing `#e8f0ff` has set a light-mode
 * background and nothing else, and it goes unreadable the moment the reader switches theme.
 */
export type AvatarType = "primary" | "secondary" | "warning" | "danger" | "neutral"

/**
 * Attrs type for `<Avatar/>` Component
 */
export type AvatarAttrsType = {
    /** Image URL to show */
    src?: string
    /** Alt text for the image */
    alt?: string
    /** Fallback content shown when there's no `src`, or the image at `src` fails to load */
    initials?: string
    /** CSS size (default: `"2.5em"`) */
    size?: string
    /**
     * Which theme colour to draw the initials fallback in (default: `"primary"`).
     *
     * Only affects the initials - an avatar showing an image covers its own background.
     */
    type?: AvatarType
} & IdAttr & StylePassthroughAttrs

let areAvatarStylesMounted = false

/**
 * A small circular image (or initials fallback) representing a person or entity
 */
export const Avatar: FunctionComponent<AvatarAttrsType> = function(attrs: AvatarAttrsType, _children: RenderableElements[]): HTMLSpanElement {
    if (!areAvatarStylesMounted) {
        areAvatarStylesMounted = true
        mountStyles(`
.vtd-avatar{
position:relative;
display:inline-flex;
align-items:center;
justify-content:center;
border-radius:50%;
overflow:hidden;
color:var(--text);
font-size:0.9em;
font-weight:bold;
user-select:none;
flex-shrink:0;
}
/*
 * The -3 step of each ramp, which is the package's "light fill" everywhere else (Badge, Tag,
 * Alert), paired with plain --text. Both sides of that pairing flip with the theme, so the
 * contrast holds in light and dark without either being stated - which is the whole reason this
 * takes a colour name rather than a colour.
 */
.vtd-avatar-primary{background-color:var(--primary-3);}
.vtd-avatar-secondary{background-color:var(--secondary-3);}
.vtd-avatar-warning{background-color:var(--warning-3);}
.vtd-avatar-danger{background-color:var(--accent-3);}
.vtd-avatar-neutral{background-color:var(--background-3);}
.vtd-avatar-img{
position:absolute;
inset:0;
width:100%;
height:100%;
object-fit:cover;
}
.vtd-avatar-img-hidden{display:none;}
`, "vtd/Avatar")
    }

    const size = attrs.size || "2.5em"
    const imageElement: HTMLImageElement | undefined = attrs.src ? <img
        class="vtd-avatar-img"
        src={attrs.src}
        alt={attrs.alt || ""}
        onError={() => {
            imageElement?.classList.add("vtd-avatar-img-hidden")
        }}/> : undefined

    return passthroughAttrsToElement<HTMLSpanElement>(<span class={`vtd-avatar vtd-avatar-${attrs.type || "primary"}`} style={{width: size, height: size}}>
        {attrs.initials}
        {imageElement}
    </span>, attrs)
}
