import { type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs, type TargetedEvent } from "@velotype/velotype"

/**
 * Attrs type for `<Upload/>` Component
 */
export type UploadAttrsType = {
    /** `name` for the `<input/>` tag */
    name?: string
    /** Accepted file types, e.g. `"image/*"` */
    accept?: string
    /** Allow selecting more than one file */
    multiple?: boolean
    /** Is the upload control disabled? */
    disabled?: boolean
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areUploadStylesMounted = false

/**
 * A themed drop-zone wrapping a visually-hidden native `<input type="file"/>` - clicking
 * or dragging a file onto it opens/fills the browser's native file picker, same trade-off
 * as `Checkbox`/`Toggle` wrapping a hidden native input for their visual box
 */
export const Upload: FunctionComponent<UploadAttrsType> = function(attrs: UploadAttrsType, children: RenderableElements[]): HTMLLabelElement {
    if (!areUploadStylesMounted) {
        areUploadStylesMounted = true
        setStylesheet(`
.vtd-upload{
width:100%;
box-sizing:border-box;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
gap:0.35em;
padding:1.5em;
border:2px dashed var(--background-5);
border-radius:0.5rem;
cursor:pointer;
text-align:center;
transition:background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}
.vtd-upload:hover{background-color:var(--background-1);border-color:var(--primary-6);}
.vtd-upload-input{position:absolute;opacity:0;height:0;width:0;margin:0;}
.vtd-upload-disabled{cursor:not-allowed;opacity:0.6;}
.vtd-upload-disabled:hover{background-color:transparent;border-color:var(--background-5);}
.vtd-upload:has(.vtd-upload-input:focus-visible){outline:2px solid var(--primary);outline-offset:2px;}
`, "vtd/Upload")
    }

    return passthroughAttrsToElement<HTMLLabelElement>(<label class={`vtd-upload${attrs.disabled?" vtd-upload-disabled":""}`}>
        <input
            type="file"
            class="vtd-upload-input"
            name={attrs.name}
            accept={attrs.accept}
            multiple={attrs.multiple}
            disabled={attrs.disabled}
            onChange={attrs.onChange}/>
        {children}
    </label>, attrs)
}
