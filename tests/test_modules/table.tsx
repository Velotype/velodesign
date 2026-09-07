import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Badge, setThemeOnSelector, Table, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

type PersonRow = {
    name: string
    role: string
    status: "active" | "inactive"
}

const rows: PersonRow[] = [
    {name: "Jonathan Word", role: "Engineer", status: "active"},
    {name: "Alex Baker", role: "Designer", status: "active"},
    {name: "Casey Diaz", role: "Support", status: "inactive"},
]

class TableGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "480px"}}>
            <div id="default-table"><Table<PersonRow>
                columns={[
                    {key: "name", header: "Name", render: row => row.name},
                    {key: "role", header: "Role", render: row => row.role},
                    {key: "status", header: "Status", render: row => <Badge type={row.status == "active" ? "secondary" : "neutral"}>{row.status}</Badge>, align: "end"},
                ]}
                rows={rows}/></div>
        </div>
    }
}

class TablePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TableGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TableGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TablePage/></TestModulePage>, mainPage)
}
