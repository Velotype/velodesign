import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs } from "@velotype/velotype"

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
} & IdAttr & StylePassthroughAttrs

let areAvatarStylesMounted = false

/**
 * A small circular image (or initials fallback) representing a person or entity
 */
export const Avatar: FunctionComponent<AvatarAttrsType> = function(attrs: AvatarAttrsType, _children: RenderableElements[]): HTMLSpanElement {
    if (!areAvatarStylesMounted) {
        areAvatarStylesMounted = true
        setStylesheet(`
.vtd-avatar{
position:relative;
display:inline-flex;
align-items:center;
justify-content:center;
border-radius:50%;
overflow:hidden;
background-color:var(--primary-3);
color:var(--text);
font-size:0.9em;
font-weight:bold;
user-select:none;
flex-shrink:0;
}
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

    return passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-avatar" style={{width: size, height: size}}>
        {attrs.initials}
        {imageElement}
    </span>, attrs)
}
