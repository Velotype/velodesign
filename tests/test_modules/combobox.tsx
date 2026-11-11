import {replaceElementWithRoot, Component, getComponent} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Avatar, Combobox, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const countryOptions = [
    "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia",
    "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "India", "Indonesia", "Ireland",
    "Israel", "Italy", "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand",
    "Nigeria", "Norway", "Peru", "Philippines", "Poland", "Portugal", "Singapore", "South Africa",
    "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine",
    "United Kingdom", "United States", "Vietnam",
].map(name => ({value: name}))

class ComboboxGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-combobox"><Combobox
                placeholder="Choose a country"
                options={countryOptions}/></div>
            <div><Combobox placeholder="Disabled" disabled options={countryOptions}/></div>
            {/* A consumer's own wording for the no-match state, which used to be a baked-in "No matches" */}
            <div id="worded-combobox"><Combobox
                placeholder="Choose a country"
                noMatchMessage="Rien ne correspond"
                options={countryOptions}/></div>
            {/* Suggestions fetched as you type: shown as given, not filtered again, with a second line */}
            <div id="async-combobox">{asyncCombobox()}</div>
            {/* Suggestions as a shortcut: with none, the panel stays closed rather than saying so */}
            <div id="quiet-combobox"><Combobox placeholder="Type a name" hideWhenEmpty options={countryOptions}/></div>
            {/* People and groups from an address book, each kind under its heading, in a narrow field */}
            <div id="grouped-combobox" style={{width: "12em"}}>{groupedCombobox()}</div>
            <div id="capped-combobox"><Combobox placeholder="At most 10 characters" maxLength={10} options={countryOptions}/></div>
        </div>
    }
}

/** A combobox fed by a pretend server: whatever is typed, it answers with places whose names don't contain it */
function asyncCombobox(): HTMLElement {
    const ref: {box?: Combobox} = {}
    const el: HTMLElement = <Combobox placeholder="Search places" filter={false} options={[]}
        onInput={() => setTimeout(() => ref.box?.setOptions([
            {value: "place-1", label: "Rosie's", detail: "41 Main St"},
            {value: "place-2", label: "Maple Park", detail: "200 Maple Ave"}
        ]), 50)}
        onSelectOption={option => { (globalThis as unknown as {picked: string}).picked = option.value }}/>
    ref.box = getComponent<Combobox>(el)
    return el
}

/** Suggestions of two kinds, given people first: shown groups first, as they first appear, each under its heading */
function groupedCombobox(): HTMLElement {
    const ref: {box?: Combobox} = {}
    const el: HTMLElement = <Combobox placeholder="Name" filter={false} hideWhenEmpty options={[]}
        onInput={() => setTimeout(() => ref.box?.setOptions([
            {value: "rose@example.com", label: "Grandma Rose", detail: "rose.whitfield-montgomery@example.com", group: "People", leading: <Avatar initials="GR" size="2em"/>},
            {value: "group:1", label: "Room 12 families", detail: "Group · 24 people", group: "Groups", leading: <Avatar initials="R1" size="2em"/>},
            {value: "sam@example.com", label: "Sam", detail: "sam@example.com", group: "People", leading: <Avatar initials="S" size="2em"/>}
        ]), 50)}/>
    ref.box = getComponent<Combobox>(el)
    return el
}

class ComboboxPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ComboboxGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ComboboxGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ComboboxPage/></TestModulePage>, mainPage)
}
