import "./listener-count.ts"
import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Badge, Button, DataTable, Popconfirm, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

type PersonRow = {
    name: string
    role: string
    department: string
    status: "active" | "inactive"
}

const names = ["Jamie Rivera", "Alex Baker", "Casey Diaz", "Morgan Lee", "Riley Chen", "Jordan Smith", "Taylor Kim", "Sam Patel", "Drew Nguyen", "Avery Brooks", "Quinn Foster", "Reese Cole"]
const roles = ["Engineer", "Designer", "Support", "Manager", "Analyst"]
const departments = ["Platform", "Growth", "Infra", "Design", "Success"]

const rows: PersonRow[] = Array.from({length: 27}, (_, i) => ({
    name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ""),
    role: roles[i % roles.length],
    department: departments[(i * 3) % departments.length],
    status: i % 4 == 0 ? "inactive" : "active",
}))


class DataTableGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "640px"}}>
            <div id="default-data-table"><DataTable<PersonRow>
                searchable
                columnToggleChildren="Columns"
                columnToggleLabel="Choose columns"
                pageSizeLabel="Rows per page:"
                emptyMessage="No results"
                searchPlaceholder="Search people..."
                pageSize={5}
                showPageSizeControl
                pageSizeOptions={[5, 10, 25]}
                columns={[
                    {key: "name", header: "Name", render: row => row.name, sortValue: row => row.name, filterValue: row => row.name, hideable: false},
                    {key: "role", header: "Role", render: row => row.role, sortValue: row => row.role, filterValue: row => row.role},
                    {key: "department", header: "Department", render: row => row.department, sortValue: row => row.department, filterValue: row => row.department, hideable: true},
                    {key: "status", header: "Status", render: row => <Badge type={row.status == "active" ? "secondary" : "neutral"}>{row.status}</Badge>, align: "end", width: 120, minWidth: 90, resizable: false},
                ]}
                rows={rows}/></div>
            {/* Fewer rows than the smallest page: no page-size control, though asked for */}
            <div id="short-data-table"><DataTable<PersonRow> searchable={false} showColumnToggle={false} pageSize={25}
                showPageSizeControl pageSizeLabel="Rows per page:"
                columns={[{key: "name", header: "Name", render: row => row.name}]}
                rows={rows.slice(0, 3)}/></div>
            {/* More rows than the smallest option, but all on one page: no page-size control either */}
            <div id="fits-data-table"><DataTable<PersonRow> searchable={false} showColumnToggle={false} pageSize={25}
                showPageSizeControl pageSizeLabel="Rows per page:"
                columns={[{key: "name", header: "Name", render: row => row.name}]}
                rows={rows.slice(0, 20)}/></div>
            {/* One page: a sort only moves the rows */}
            <div id="moving-data-table"><DataTable<PersonRow> searchable={false} showColumnToggle={false} pageSize={25}
                columns={[
                    {key: "name", header: "Name", render: row => row.name, sortValue: row => row.name},
                    {key: "remove", header: "", render: row => <Popconfirm title={`Remove ${row.name}?`} onConfirm={() => {}}><Button type="secondary">Remove</Button></Popconfirm>}
                ]}
                rows={rows.slice(0, 8)}/></div>
            {/* Pages, a search, and a Popconfirm a row */}
            <div id="popconfirm-data-table"><DataTable<PersonRow> searchable showColumnToggle={false} pageSize={10}
                columns={[
                    {key: "name", header: "Name", render: row => row.name, sortValue: row => row.name, filterValue: row => row.name},
                    {key: "role", header: "Role", render: row => row.role, sortValue: row => row.role},
                    {key: "remove", header: "", render: row => <Popconfirm title={`Remove ${row.name}?`} onConfirm={() => {}}><Button type="secondary">Remove</Button></Popconfirm>}
                ]}
                rows={rows}/></div>
        </div>
    }
}

class DataTablePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><DataTableGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><DataTableGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><DataTablePage/></TestModulePage>, mainPage)
}
