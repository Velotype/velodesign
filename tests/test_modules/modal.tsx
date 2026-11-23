import {replaceElementWithRoot, Component, getComponent} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, ButtonModal, I, Modal, Theme } from "../../src/index.ts"
import { registerExampleIcons } from "./example-icons.ts"
import { TestModulePage } from "./module-page.tsx"


registerExampleIcons()

class ModalGallery extends Component<EmptyAttrs> {
    override render() {
        const modal = <Modal
            title="Test base modal"
            confirmButtonChildren="confirm"
            cancelButtonChildren="cancel"
        >
            inner modal content
        </Modal>
        const reasonModal = <Modal title="Pick first" confirmButtonChildren="add" startConfirmDisabled confirmDisabledReason="Pick someone first">pick someone</Modal>
        // The test enables its confirm through the Modal's own method
        ;(globalThis as unknown as {__reasonModal: Modal}).__reasonModal = getComponent<Modal>(reasonModal)
        return <div>
            {modal}
            <Button type="secondary" onClick={()=>{
                modal.showModal()
            }}>Open base modal</Button>
            <ButtonModal
                modalAttrs = {{
                    title: "Test button modal",
                    confirmButtonChildren: ["confirm", <I i="settings"/>],
                    cancelButtonChildren: "cancel"
                }}
                openButtonText = "Open button modal"
                >inner modal content</ButtonModal>
            {/* Confirming closes the Modal unless the handler asks to keep it open */}
            <div id="closing-modal"><Modal title="Closes on confirm" confirmButtonChildren="confirm"
                confirmButtonOnClick={(done) => done()}>closes</Modal></div>
            <div id="keep-open-modal"><Modal title="Stays open" confirmButtonChildren="confirm"
                confirmButtonOnClick={(done) => done({keepOpen: true})}>stays open</Modal></div>
            <div id="plain-modal"><Modal title="No handler" confirmButtonChildren="confirm">closes</Modal></div>
            {/* Nothing to cancel: the confirm button is the only one in the footer */}
            <div id="no-cancel-modal"><Modal title="Just a message" confirmButtonChildren="close" showCancelButton={false}>read and close</Modal></div>
            {/* A confirm that starts disabled says why, until it's enabled */}
            <div id="reason-modal">{reasonModal}</div>
        </div>
    }
}

Theme.injectStyles()

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ModalGallery/></TestModulePage>, mainPage)
}
