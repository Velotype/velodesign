import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { AsyncDataTable, Badge, setThemeOnSelector, Theme } from "../../src/index.ts"
import type { AsyncDataTableColumnType, AsyncDataTableQuery, AsyncDataTableResult } from "../../src/index.ts"
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

const allRows: PersonRow[] = Array.from({length: 84}, (_, i) => ({
    name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ""),
    role: roles[i % roles.length],
    department: departments[(i * 3) % departments.length],
    status: i % 4 == 0 ? "inactive" : "active"
}))

/**
 * Search strings whose loads have resolved, newest last. Exposed on `globalThis` purely so the
 * out-of-order test can wait for the *slow* query to come back before asserting that it did not
 * overwrite the fast one. Nothing in the component reads it.
 */
const resolvedQueries: string[] = []
;(globalThis as unknown as {__resolvedQueries: string[]}).__resolvedQueries = resolvedQueries

/**
 * Stands in for a server: filters, sorts and pages the full set, then hands back only the page -
 * exactly what a real endpoint does, and exactly what the table must not try to do for itself.
 *
 * `delayFor` gives a *fixed* per-query delay chosen so a shorter search string resolves **later**
 * than a longer one, which is how the out-of-order case is reproduced deliberately rather than
 * hoped for: typing "e" then "riley" issues the "e" request first and lands it last. A table
 * without a sequence guard ends up showing "e"'s results with "riley" in the box.
 *
 * The two strings must also *match different people* - an earlier version of this fixture raced
 * "ja" against "jam", which select exactly the same rows here, so a stale response was
 * indistinguishable from a fresh one and the test passed even with the guard deleted.
 */
function makeLoader(options: {delayFor?: (q: AsyncDataTableQuery) => number, failOn?: string} = {}) {
    return function load(query: AsyncDataTableQuery): Promise<AsyncDataTableResult<PersonRow>> {
        const delay = options.delayFor ? options.delayFor(query) : 120
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Records which queries have actually come back, for the out-of-order test to wait
                // on. A test cannot assert "the stale answer did not overwrite" by sleeping: this
                // page runs in a headless browser that throttles timers unpredictably (a 720ms
                // delay has been observed taking 1476ms), so the only sound way to know the stale
                // response has landed is for the fixture to say so.
                resolvedQueries.push(query.search)
                if (options.failOn && query.search === options.failOn) {
                    reject(new Error("The server is having a bad day"))
                    return
                }
                const needle = query.search.toLowerCase()
                let rows = needle
                    ? allRows.filter(r => `${r.name} ${r.role} ${r.department}`.toLowerCase().includes(needle))
                    : allRows
                if (query.sortKey) {
                    const direction = query.sortDirection === "desc" ? -1 : 1
                    const key = query.sortKey as keyof PersonRow
                    rows = [...rows].sort((a, b) => a[key] < b[key] ? -direction : (a[key] > b[key] ? direction : 0))
                }
                const total = rows.length
                const start = (query.page - 1) * query.pageSize
                resolve({rows: rows.slice(start, start + query.pageSize), total})
            }, delay)
        })
    }
}

const COLUMNS: AsyncDataTableColumnType<PersonRow>[] = [
    {key: "name", header: "Name", render: r => r.name, sortable: true, hideable: false},
    {key: "role", header: "Role", render: r => r.role, sortable: true},
    {key: "department", header: "Department", render: r => r.department, sortable: true},
    {key: "status", header: "Status", align: "end", width: 120, resizable: false,
        render: r => <Badge type={r.status == "active" ? "secondary" : "neutral"}>{r.status}</Badge>}
]

class AsyncDataTableGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop: "10px", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "24px"}}>
            <div>
                <h3>Server-paged, with a known total</h3>
                <div id="default-async-table"><AsyncDataTable<PersonRow>
                    columns={COLUMNS}
                    load={makeLoader()}
                    searchPlaceholder="Search people..."
                    pageSize={5}
                    showPageSizeControl
                    pageSizeOptions={[5, 10, 25]}
                    loadingLabel="Loading"
                    columnToggleChildren="Columns"
                    pageSizeLabel="Rows per page:"
                    emptyMessage="Nobody here yet"
                    noMatchMessage="Nothing matched that search"
                    debounceMs={80}/></div>
            </div>
            <div>
                <h3>A slow short query racing a fast longer one</h3>
                <p>Type <code>e</code> then <code>riley</code> quickly: <code>e</code> takes 720ms while <code>riley</code> takes none, so the stale answer arrives last and must be discarded.</p>
                <div id="race-async-table"><AsyncDataTable<PersonRow>
                    columns={COLUMNS}
                    // Shorter searches deliberately take longer, so a stale response always wins the race
                    load={makeLoader({delayFor: (q) => Math.max(0, 900 - (q.search.length * 180))})}
                    searchPlaceholder="Search people..."
                    pageSize={5}
                    loadingLabel="Loading"
                    debounceMs={0}/></div>
            </div>
            <div>
                <h3>Unknown total (prev/next) and a truncation notice</h3>
                <div id="nototal-async-table"><AsyncDataTable<PersonRow>
                    columns={COLUMNS}
                    load={(q) => makeLoader()(q).then(r => ({rows: r.rows, truncated: true}))}
                    searchPlaceholder="Search people..."
                    pageSize={5}
                    loadingLabel="Loading"
                    truncatedMessage="Showing the first page only"
                    debounceMs={80}/></div>
            </div>
            <div>
                <h3>A loader that rejects</h3>
                <p>Search for <code>boom</code>.</p>
                <div id="error-async-table"><AsyncDataTable<PersonRow>
                    columns={COLUMNS}
                    load={makeLoader({failOn: "boom"})}
                    searchPlaceholder="Search, then try boom"
                    pageSize={5}
                    loadingLabel="Loading"
                    renderError={(error) => <span>{`Could not load: ${error instanceof Error ? error.message : String(error)}`}</span>}
                    debounceMs={80}/></div>
            </div>
        </div>
    }
}

class AsyncDataTablePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><AsyncDataTableGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><AsyncDataTableGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><AsyncDataTablePage/></TestModulePage>, mainPage)
}
