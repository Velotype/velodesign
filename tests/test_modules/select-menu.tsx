import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Avatar, SelectMenu, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

type PersonOption = {
    id: string
    name: string
    role: string
    disabled?: boolean
}

const people: PersonOption[] = [
    {id: "jamie", name: "Jamie Rivera", role: "Engineer"},
    {id: "alex", name: "Alex Baker", role: "Designer"},
    {id: "casey", name: "Casey Diaz", role: "Support"},
    {id: "morgan", name: "Morgan Lee", role: "Manager", disabled: true},
    {id: "riley", name: "Riley Chen", role: "Analyst"},
]

function renderPersonOption(person: PersonOption) {
    return <span style={{display: "flex", alignItems: "center", gap: "0.6em"}}>
        <Avatar initials={person.name.split(" ").map(part => part[0]).join("")} size="1.75em"/>
        <span style={{display: "flex", flexDirection: "column", lineHeight: "1.2"}}>
            <span>{person.name}</span>
            <span style={{fontSize: "0.8em", opacity: "0.65"}}>{person.role}{person.disabled ? " (unavailable)" : ""}</span>
        </span>
    </span>
}

class SelectMenuGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            <div style={{marginTop:"10px"}}><SelectMenu<PersonOption>
                id="default-select-menu"
                options={people}
                getValue={person => person.id}
                isOptionDisabled={person => !!person.disabled}
                renderOption={renderPersonOption}
                placeholder="Assign to..."/></div>
            <div style={{marginTop:"10px"}}><SelectMenu<PersonOption>
                id="preselected-select-menu"
                options={people}
                value="alex"
                getValue={person => person.id}
                isOptionDisabled={person => !!person.disabled}
                renderOption={renderPersonOption}/></div>
            <div style={{marginTop:"10px"}}><SelectMenu<PersonOption>
                options={people}
                getValue={person => person.id}
                renderOption={renderPersonOption}
                disabled
                placeholder="Disabled"/></div>
        </div>
    }
}

class SelectMenuPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SelectMenuGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SelectMenuGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><SelectMenuPage/></TestModulePage>, mainPage)
}
