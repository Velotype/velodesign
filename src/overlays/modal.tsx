/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {type ChildrenAttr, Component, type RenderableElements, type FunctionComponent, type TargetedMouseEvent, type StylePassthroughAttrs, type IdAttr, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { Button, type ButtonType } from "../form/button.tsx"
import { Tooltip } from "../feedback/tooltip.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"
import { animateDialog, MOTION } from "../core/motion.ts"

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
     * Why the confirm button is disabled, shown while it is - on hover, focus, or a tap - by a
     * `<Tooltip whenDisabled/>` around it. A disabled control that doesn't say why leaves the reader
     * guessing what to do. No default: the words are the consumer's (see `startConfirmDisabled` and
     * `setConfirmDisabled()`).
     */
    confirmDisabledReason?: RenderableElements
    /**
     * Callback for when the confirm button is clicked. The button shows a spinner until the
     * callback calls `done()`, which also closes the Modal - `done({keepOpen: true})` leaves it
     * open. Without a callback, confirming closes the Modal at once.
     */
    confirmButtonOnClick?: (done: ModalDoneType) => void
    /** Title content (usually a string), drawn as the dialog's heading (an `<h2>`) and its accessible name */
    title: RenderableElements
    /** Confirm button content (usually a string) */
    confirmButtonChildren: RenderableElements
    /** Cancel button content (default: `ModalThemeOptions.cancelSymbol` - a drawn cross, not English text, so the library doesn't assume a language) */
    cancelButtonChildren?: RenderableElements
    /**
     * Show the footer's cancel button (default: `true`).
     *
     * Turn it off for a Modal with nothing to cancel - one that shows something and is closed when
     * read, where the confirm button is the way out ("Close"). A cancel button beside it there is a
     * second button doing the same thing, and the title bar's close button is a third.
     */
    showCancelButton?: boolean
    /** Accessible label for the title bar's close button, which shows only a glyph. No default - the library doesn't assume a language; set this (e.g. to "Close") to give screen reader users a name for it */
    closeLabel?: string
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
` +
/* A modal grows in and fades, from a little smaller. A transform only changes how the finished
   box is drawn - nothing inside it is laid out again, so no line rewraps while it moves. */
`
.vtd-modal[open]{animation:vtd-modal-in ${MOTION};}
.vtd-modal[open]::backdrop{animation:vtd-modal-backdrop-in ${MOTION};}
.vtd-modal.vtd-modal-closing{animation:vtd-modal-out ${MOTION} forwards;}
.vtd-modal.vtd-modal-closing::backdrop{animation:vtd-modal-backdrop-out ${MOTION} forwards;}
@keyframes vtd-modal-in{from{opacity:0;transform:scale(0.94);}to{opacity:1;transform:scale(1);}}
@keyframes vtd-modal-out{from{opacity:1;transform:scale(1);}to{opacity:0;transform:scale(0.94);}}
@keyframes vtd-modal-backdrop-in{from{opacity:0;}to{opacity:1;}}
@keyframes vtd-modal-backdrop-out{from{opacity:1;}to{opacity:0;}}
@media (prefers-reduced-motion: reduce){
.vtd-modal,.vtd-modal::backdrop,.vtd-modal.vtd-modal-closing,.vtd-modal.vtd-modal-closing::backdrop{animation:none;}
}
.vtd-modal-separator{
margin:0.5em 0;
}
.vtd-modal-title{margin:0;font-size:1.25em;font-weight:bold;line-height:1.3;}
.vtd-modal-title-bar{display:flex;align-items:center;justify-content:space-between;gap:0.5em;}
.vtd-modal-footer{display:flex;align-items:center;justify-content:end;gap:0.5em;}
.vtd-modal-inner{
padding:0.5em;
}
.vtd-modal-close .vtd-icon{height:1.6em;margin-block:-0.3em;}
.vtd-modal-close .vtd-icon path{stroke-width:1.6;}
`, "vtd/Modal")
    }

    /** The underlying `<dialog/>` element */
    #dialog: HTMLDialogElement

    /** Opens and closes the dialog with its motion */
    #motion: {close: () => void, showModal: () => void}

    /** Tells one Modal's title from another's, for `aria-labelledby` */
    static #titleIds = 0

    /** A handle for the confirm button element (used for managing disabled state) */
    #confirmButton: HTMLElement

    /** Close the Modal */
    close() {
        this.#motion.close()
    }
    /** Show the Modal */
    showModal() {
        this.#motion.showModal()
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
                        if (!options?.keepOpen) {this.close()}
                    })
                } else {
                    this.close()
                }
            }}>{attrs.confirmButtonChildren}
        </Button>
        const titleId = `vtd-modal-title-${++Modal.#titleIds}`
        this.#dialog = <dialog class="vtd-modal" closedby="any" aria-labelledby={titleId}>
            {/* The bar spaces the title and the close button itself, so a page's own margins on
                its headings (which win over the library's) can't pull the button in beside the title */}
            <div class="vtd-modal-title-bar">
                <h2 class="vtd-modal-title" id={titleId}>{attrs.title}</h2>
                <Button type="secondary" class="vtd-modal-close" ariaLabel={attrs.closeLabel} onClick={()=>{
                    this.close()
                }}><ModalThemeOptions.closeSymbol/></Button>
            </div>
            <hr class="vtd-modal-separator"/>
            <div class="vtd-modal-inner">{children}</div>
            <hr class="vtd-modal-separator"/>
            <div class="vtd-modal-footer">
                {attrs.showCancelButton === false ? null : <Button type="text" onClick={()=>{
                    this.close()
                }}>{attrs.cancelButtonChildren || <ModalThemeOptions.cancelSymbol/>}</Button>}
                {attrs.confirmDisabledReason === undefined
                    ? this.#confirmButton
                    : <Tooltip whenDisabled placement="top-end" content={attrs.confirmDisabledReason}>{this.#confirmButton}</Tooltip>}
            </div>
        </dialog>
        this.#motion = animateDialog(this.#dialog, "vtd-modal-closing")
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
