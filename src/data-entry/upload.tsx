/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs, type TargetedEvent} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"

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
 * A themed drop-zone wrapping a visually-hidden native `<input type="file"/>` - clicking it
 * opens the browser's native file picker, same trade-off as `Checkbox`/`Toggle` wrapping a
 * hidden native input for their visual box. Files dropped on it fill that input and fire its
 * `change`, so `onChange` sees a drop exactly as it sees a pick (one file unless `multiple`);
 * while files are dragged over it, it shows the hover state (`vtd-upload-over`).
 */
export const Upload: FunctionComponent<UploadAttrsType> = function(attrs: UploadAttrsType, children: RenderableElements[]): HTMLLabelElement {
    if (!areUploadStylesMounted) {
        areUploadStylesMounted = true
        mountStyles(`
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
.vtd-upload:hover,.vtd-upload-over{background-color:var(--background-1);border-color:var(--primary-6);}
.vtd-upload-input{position:absolute;opacity:0;height:0;width:0;margin:0;}
.vtd-upload-disabled{cursor:not-allowed;opacity:0.6;}
.vtd-upload-disabled:hover{background-color:transparent;border-color:var(--background-5);}
.vtd-upload:has(.vtd-upload-input:focus-visible){outline:2px solid var(--primary-7);outline-offset:2px;}
`, "vtd/Upload")
    }

    const input = <input
        type="file"
        class="vtd-upload-input"
        name={attrs.name}
        accept={attrs.accept}
        multiple={attrs.multiple}
        disabled={attrs.disabled}
        onChange={attrs.onChange}/> as HTMLInputElement
    const zone = <label class={`vtd-upload${attrs.disabled?" vtd-upload-disabled":""}`}>
        {input}
        {children}
    </label> as HTMLLabelElement
    // A drag that carries files: taken here rather than by the browser, which would open the file
    const carriesFiles = (event: DragEvent) => !input.disabled && !!event.dataTransfer?.types.includes("Files")
    zone.addEventListener("dragover", (event: DragEvent) => {
        if (!carriesFiles(event)) {return}
        event.preventDefault()
        event.dataTransfer!.dropEffect = "copy"
        zone.classList.add("vtd-upload-over")
    })
    zone.addEventListener("dragleave", (event: DragEvent) => {
        if (!zone.contains(event.relatedTarget as Node | null)) {zone.classList.remove("vtd-upload-over")}
    })
    zone.addEventListener("drop", (event: DragEvent) => {
        zone.classList.remove("vtd-upload-over")
        if (!carriesFiles(event)) {return}
        event.preventDefault()
        const dropped = [...event.dataTransfer!.files]
        if (dropped.length === 0) {return}
        const files = new DataTransfer()
        for (const file of attrs.multiple ? dropped : dropped.slice(0, 1)) {files.items.add(file)}
        input.files = files.files
        input.dispatchEvent(new Event("change", {bubbles: true}))
    })
    return passthroughAttrsToElement<HTMLLabelElement>(zone, attrs)
}
