import {replaceElementWithRoot, Component, RenderObject} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import {
    bindChecked, bindValue, Checkbox, EditableField, FormField, Select, setThemeOnSelector,
    Slider, Text, TextBox, Theme,
} from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/* One field per binding shape, so the gallery covers `value`, `checked` and a numeric value */
const name = new RenderObject("Ada")
const agreed = new RenderObject(false)
const volume = new RenderObject(40)
const plan = new RenderObject("pro")

/** Every value `onSave` was called with, so a test can read it back off the page and assert it ran */
const savedCalls: string[] = [];
(globalThis as unknown as {vtdSavedCalls: string[]}).vtdSavedCalls = savedCalls

/* Saves that resolve and reject on demand, so both outcomes can be driven from a test */
const savedName = new RenderObject("")
const failingValue = new RenderObject("keep me")

class EditableFieldGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth:"360px"}}>
            <div id="plain-editable"><EditableField<string>
                label="Display name"
                value={name}
                display={(v) => v || <Text type="muted">Not set</Text>}
                edit={(draft) => <TextBox type="text" {...bindValue(draft)}/>}/></div>

            <div id="saving-editable"><EditableField<string>
                label="Nickname"
                value={savedName}
                display={(v) => v || <Text type="muted">Not set</Text>}
                edit={(draft) => <TextBox type="text" {...bindValue(draft)}/>}
                onSave={(v) => new Promise<void>((resolve) => setTimeout(() => {
                    savedCalls.push(v)
                    resolve()
                }, 10))}/></div>

            <div id="failing-editable"><EditableField<string>
                label="Locked"
                value={failingValue}
                edit={(draft) => <TextBox type="text" {...bindValue(draft)}/>}
                onSave={() => Promise.reject(new Error("Server said no"))}/></div>

            {/* A non-text control, which the old TextEditableField could not host at all */}
            <div id="slider-editable"><EditableField<number>
                label="Volume"
                value={volume}
                display={(v) => `${v}%`}
                edit={(draft) => <Slider min={0} max={100} {...bindValue(draft)}/>}/></div>

            {/* The binding helpers on their own, inside the layout primitive */}
            <div id="bound-checkbox"><FormField label="Terms" hint="Required to continue">
                <Checkbox {...bindChecked(agreed)}/>
            </FormField></div>
            <div id="bound-select"><FormField label="Plan" error="Pick one">
                <Select options={[{value:"free",label:"Free"},{value:"pro",label:"Pro"}]} {...bindValue(plan)}/>
            </FormField></div>
            <div id="bound-slider"><FormField label="Volume">
                <Slider min={0} max={100} {...bindValue(volume)}/>
            </FormField></div>
        </div>
    }
}

class EditableFieldPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><EditableFieldGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><EditableFieldGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><EditableFieldPage/></TestModulePage>, mainPage)
}
