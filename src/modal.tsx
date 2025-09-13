import { type ChildrenAttr, Component, type RenderableElements, setStylesheet, type EmptyAttrs, type FunctionComponent, type TargetedMouseEvent, StylePassthroughAttrs, IdAttr, passthroughAttrsToElement } from "jsr:@velotype/velotype"
import { Button, type ButtonType } from "./button.tsx"

/**
 * Options to customize `<Modal/>` Component Theme
 */
export const ModalThemeOptions: {
    closeSymbol: FunctionComponent<EmptyAttrs>
} = {
    closeSymbol: function(){return "x"}
}

/**
 * Attrs type for `<Modal/>` Component
 */
export type ModalAttrsType = {
    /** Should the confirm button start as disabled? */
    startConfirmDisabled?: boolean
    /** Callback for when the confirm button is clicked */
    confirmButtonOnClick?: (doneLoading: ()=>void) => void
    /** Title content (usually a string) */
    title: RenderableElements
    /** Confirm button content (usually a string) */
    confirmButtonChildren: RenderableElements
    /** Cancel button content (usually a string) */
    cancelButtonChildren: RenderableElements
}

/**
 * A Modal that renders over top of the page
 */
export class Modal extends Component<ModalAttrsType & ChildrenAttr> {
    /** Mount this Component */
    override mount() {
        setStylesheet(`
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
    constructor(attrs: ModalAttrsType & ChildrenAttr, children: RenderableElements[]) {
        super(attrs, children)
        this.#confirmButton = <Button type="primary"
            disabled={attrs.startConfirmDisabled}
            loadingOnClick={!!attrs.confirmButtonOnClick}
            onClick={(_event: TargetedMouseEvent<HTMLButtonElement>, doneLoading?: () => void) => {
                if (attrs.confirmButtonOnClick && doneLoading) {
                    attrs.confirmButtonOnClick(doneLoading)
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
                }}>{attrs.cancelButtonChildren}</Button>
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
}

/**
 * A basic `<Button/>` that renders a `<Modal/>`
 */
export class ButtonModal extends Component<ButtonModalAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr> {
    /** The underlying `<Modal/>` */
    #modal: Modal

    /** Create a new `<ButtonModal/>` Component */
    constructor(attrs: ButtonModalAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr, children: RenderableElements[]) {
        super(attrs, children)
        this.#modal = <Modal {...attrs.modalAttrs}>{children}</Modal>
    }

    /** Render this component */
    override render(attrs: ButtonModalAttrsType & IdAttr & StylePassthroughAttrs): HTMLSpanElement {
        return passthroughAttrsToElement(<span style={{display: "contents"}}>
            {this.#modal}
            <Button type={attrs.openButtonType || "secondary"} onClick={()=>{
                this.#modal.showModal()
            }}>{attrs.openButtonText}</Button>
        </span>, attrs) as HTMLSpanElement
    }
}
