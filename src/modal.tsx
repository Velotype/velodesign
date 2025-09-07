import { type ChildrenAttr, Component, type RenderableElements, setStylesheet, type EmptyAttrs, type FunctionComponent } from "jsr:@velotype/velotype"
import { Button, type ButtonType } from "./button.tsx"

export const ModalThemeOptions: {
    closeSymbol: FunctionComponent<EmptyAttrs>
} = {
    closeSymbol: function(){return "x"}
}

export type ModalAttrsType = {
    startConfirmDisabled?: boolean
    confirmButtonOnClick?: (doneLoading: ()=>void) => void
    title: string
    confirmButtonChildren: RenderableElements
    cancelButtonChildren: RenderableElements
}
export class Modal extends Component<ModalAttrsType & ChildrenAttr> {
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

    dialog: HTMLDialogElement
    confirmButton: HTMLElement
    close() {
        this.dialog.close()
    }
    showModal() {
        this.dialog.showModal()
    }
    setConfirmDisabled(disabled: boolean) {
        if (disabled) {
            this.confirmButton.setAttribute("disabled","")
        } else {
            this.confirmButton.removeAttribute("disabled")
        }
    }
    constructor(attrs: ModalAttrsType & ChildrenAttr, children: RenderableElements[]) {
        super(attrs, children)
        this.confirmButton = <Button type="primary"
            disabled={attrs.startConfirmDisabled}
            loadingIcon={!!attrs.confirmButtonOnClick}
            onClick={(doneLoading: () => void) => {
                if (attrs.confirmButtonOnClick) {
                    attrs.confirmButtonOnClick(doneLoading)
                }
            }}>{attrs.confirmButtonChildren}
        </Button>
        this.dialog = <dialog class="vtd-modal" closedby="any">
            <div style={{display: "flex", alignItems: "center"}}>
                <span style={{marginRight: "auto"}}>{attrs.title}</span>
                <Button type="secondary" onClick={()=>{
                    this.dialog.close()
                }}><ModalThemeOptions.closeSymbol/></Button>
            </div>
            <hr class="vtd-modal-separator"/>
            <div class="vtd-modal-inner">{children}</div>
            <hr class="vtd-modal-separator"/>
            <div style={{display: "flex", alignItems: "center", justifyContent: "end"}}>
                <Button type="text" onClick={()=>{
                    this.dialog.close()
                }}>{attrs.cancelButtonChildren}</Button>
                {this.confirmButton}
            </div>
        </dialog>
    }
    override render(): HTMLDialogElement {
        return this.dialog
    }
}

export type ButtonModalAttrsType = {
    modalAttrs: ModalAttrsType
    openButtonType?: ButtonType
    openButtonText: string
}
export class ButtonModal extends Component<ButtonModalAttrsType & ChildrenAttr> {
    modal: Modal
    constructor(attrs: ButtonModalAttrsType & ChildrenAttr, children: RenderableElements[]) {
        super(attrs, children)
        this.modal = <Modal {...attrs.modalAttrs}>{children}</Modal>
    }
    override render(attrs: ButtonModalAttrsType): HTMLSpanElement {
        return <span style={{display: "contents"}}>
            {this.modal}
            <Button type={attrs.openButtonType || "secondary"} onClick={()=>{
                this.modal.showModal()
            }}>{attrs.openButtonText}</Button>
        </span>
    }
}
