/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {type ChildrenAttr, Component, type RenderableElements, type FunctionComponent, type TargetedMouseEvent, type StylePassthroughAttrs, type IdAttr, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { Button, type ButtonType } from "../form/button.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<Modal/>` Component Theme
 */
export const ModalThemeOptions: {
    /** Content of the corner close button. Defaults to `CommonThemeOptions.closeSymbol` */
    closeSymbol: ThemeSymbol
    /** Content of the cancel button in the footer. Defaults to `CommonThemeOptions.cancelSymbol` */
    cancelSymbol: ThemeSymbol
} = themeOptions({closeSymbol: "closeSymbol", cancelSymbol: "cancelSymbol"})

/**
 * What a `<Modal/>`'s confirm handler calls when its work is done: it stops the confirm button's
 * spinner and closes the Modal. Pass `{keepOpen: true}` to leave it open - when the work failed
 * and the reader should change something and try again.
 */
export type ModalDoneType = (options?: {keepOpen?: boolean}) => void

/**
 * Attrs type for `<Modal/>` Component
 */
export type ModalAttrsType = {
    /** Should the confirm button start as disabled? */
    startConfirmDisabled?: boolean
    /**
     * Callback for when the confirm button is clicked. The button shows a spinner until the
     * callback calls `done()`, which also closes the Modal - `done({keepOpen: true})` leaves it
     * open. Without a callback, confirming closes the Modal at once.
     */
    confirmButtonOnClick?: (done: ModalDoneType) => void
    /** Title content (usually a string) */
    title: RenderableElements
    /** Confirm button content (usually a string) */
    confirmButtonChildren: RenderableElements
    /** Cancel button content (default: `ModalThemeOptions.cancelSymbol` - a plain "x", not English text, so the library doesn't assume a language) */
    cancelButtonChildren?: RenderableElements
} & ChildrenAttr

/**
 * A Modal that renders over top of the page
 */
export class Modal extends Component<ModalAttrsType> {
    /** Mount this Component */
    override mount() {
        mountStyles(`
.vtd-modal{
margin:auto;
padding:1em;
overflow:auto;
border:none;
}
.vtd-modal::backdrop {
background:rgba(75,75,75,0.6);
backdrop-filter: blur(2px);
}
.vtd-modal-separator{
margin:0.5em 0;
}
.vtd-modal-inner{
padding:0.5em;
}
`, "vtd/Modal")
    }

    /** The underlying `<dialog/>` element */
    #dialog: HTMLDialogElement

    /** A handle for the confirm button element (used for managing disabled state) */
    #confirmButton: HTMLElement

    /** Close the Modal */
    close() {
        this.#dialog.close()
    }
    /** Show the Modal */
    showModal() {
        this.#dialog.showModal()
    }

    /** Toggles the `disabled` attribute on the `confirmButton` */
    setConfirmDisabled(disabled: boolean) {
        if (disabled) {
            this.#confirmButton.setAttribute("disabled","")
        } else {
            this.#confirmButton.removeAttribute("disabled")
        }
    }

    /** Create a new `<Modal/>` Component */
    constructor(attrs: ModalAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#confirmButton = <Button type="primary"
            disabled={attrs.startConfirmDisabled}
            loadingOnClick={!!attrs.confirmButtonOnClick}
            onClick={(_event: TargetedMouseEvent<HTMLButtonElement>, doneLoading?: () => void) => {
                // Confirming is the reader finishing with the Modal, so it closes unless the
                // handler says otherwise - leaving that to every caller left most of them open.
                if (attrs.confirmButtonOnClick && doneLoading) {
                    attrs.confirmButtonOnClick((options) => {
                        doneLoading()
                        if (!options?.keepOpen) {this.#dialog.close()}
                    })
                } else {
                    this.#dialog.close()
                }
            }}>{attrs.confirmButtonChildren}
        </Button>
        this.#dialog = <dialog class="vtd-modal" closedby="any">
            <div style={{display: "flex", alignItems: "center"}}>
                <span style={{marginRight: "auto"}}>{attrs.title}</span>
                <Button type="secondary" onClick={()=>{
                    this.#dialog.close()
                }}><ModalThemeOptions.closeSymbol/></Button>
            </div>
            <hr class="vtd-modal-separator"/>
            <div class="vtd-modal-inner">{children}</div>
            <hr class="vtd-modal-separator"/>
            <div style={{display: "flex", alignItems: "center", justifyContent: "end"}}>
                <Button type="text" onClick={()=>{
                    this.#dialog.close()
                }}>{attrs.cancelButtonChildren || <ModalThemeOptions.cancelSymbol/>}</Button>
                {this.#confirmButton}
            </div>
        </dialog>
    }

    /** Render this Component */
    override render(): HTMLDialogElement {
        return this.#dialog
    }
}

/**
 * Attrs type for `<ButtonModal/>` Component
 */
export type ButtonModalAttrsType = {
    modalAttrs: ModalAttrsType
    openButtonType?: ButtonType
    openButtonText: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * A basic `<Button/>` that renders a simple `<Modal/>`
 */
export const ButtonModal: FunctionComponent<ButtonModalAttrsType> = function(attrs: ButtonModalAttrsType, children: RenderableElements[]): HTMLSpanElement {
    const modal = <Modal {...attrs.modalAttrs}>{children}</Modal>
    return passthroughAttrsToElement<HTMLSpanElement>(<span style={{display: "contents"}}>
        {modal}
        <Button type={attrs.openButtonType || "secondary"} onClick={()=>{
            modal.showModal()
        }}>{attrs.openButtonText}</Button>
    </span>, attrs)
}
