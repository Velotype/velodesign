import { Component, getComponent, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "./button.tsx"
import { Checkbox } from "./checkbox.tsx"
import { Pagination } from "./pagination.tsx"
import { TextBox } from "./textbox.tsx"

/**
 * A single column definition for a `<DataTable/>`
 */
export type DataTableColumnType<RowType> = {
    /** Unique key identifying this column */
    key: string
    /** Displayed content for the column's header */
    header: RenderableElements
    /** Renders a row's value for this column */
    render: (row: RowType) => RenderableElements
    /** Extracts a comparable value from a row for sorting; omit to make this column unsortable */
    sortValue?: (row: RowType) => string | number
    /** Extracts searchable text from a row for this column; omit to exclude it from search matching */
    filterValue?: (row: RowType) => string
    /** Text alignment for this column's cells (default: `"start"`) */
    align?: "start" | "center" | "end"
    /** Starting width in px (every column can be resized by dragging its trailing edge, regardless of this) */
    width?: number
    /** Minimum width in px when resized (default: `60`) */
    minWidth?: number
    /** If `false`, this column can't be hidden via the column-visibility control (default: `true`) */
    hideable?: boolean
}

/**
 * Attrs type for `<DataTable/>` Component
 */
export type DataTableAttrsType<RowType> = {
    /** Column definitions, in display order */
    columns: DataTableColumnType<RowType>[]
    /** The full set of rows; filtering/sorting/pagination all happen client-side over this set */
    rows: RowType[]
    /** Rows shown per page. Set to `0` to disable pagination and show every row (default: `10`) */
    pageSize?: number
    /** Shows a search box that filters rows using each column's `filterValue` (default: `false`) */
    searchable?: boolean
    /** Placeholder for the search input (default: `"Search..."`) */
    searchPlaceholder?: string
} & IdAttr & StylePassthroughAttrs

type SortDirection = "asc" | "desc"

let areDataTableStylesMounted = false

type DataTableInnerAttrsType<RowType> = {
    columns: DataTableColumnType<RowType>[]
    rows: RowType[]
    pageSize: number
}

/**
 * Owns every piece of `DataTable`'s state (sort, page, column widths/visibility) and renders
 * the actual `<table>`. Split out from `DataTable` so the search `TextBox` - which needs to
 * stay mounted and keep focus while the user types - never gets caught in one of this
 * component's own `refresh()` calls; see `setSearchQuery`.
 */
class DataTableInner<RowType> extends Component<DataTableInnerAttrsType<RowType>> {
    #searchQuery = ""
    #sortKey: string | undefined
    #sortDirection: SortDirection = "asc"
    #currentPage = 1
    #hiddenColumns = new Set<string>()
    #columnWidths: Record<string, number> = {}
    #columnMenuOpen = false
    /** The column-menu's own wrapper, re-captured each render so outside-click detection always checks the current DOM */
    #columnMenuWrapperEl: HTMLDivElement | undefined

    #handleDocumentClick = (event: MouseEvent) => {
        if (!this.#columnMenuOpen) {
            return
        }
        if (event.target instanceof Node && this.#columnMenuWrapperEl?.contains(event.target)) {
            return
        }
        this.#columnMenuOpen = false
        this.refresh()
    }

    override mount() {
        document.addEventListener("click", this.#handleDocumentClick)
    }
    override unmount() {
        document.removeEventListener("click", this.#handleDocumentClick)
    }

    /** Called by `DataTable`'s persistent search input on every keystroke */
    setSearchQuery(query: string) {
        this.#searchQuery = query
        this.#currentPage = 1
        this.refresh()
    }

    #toggleSort(column: DataTableColumnType<RowType>) {
        if (!column.sortValue) {
            return
        }
        if (this.#sortKey != column.key) {
            this.#sortKey = column.key
            this.#sortDirection = "asc"
        } else if (this.#sortDirection == "asc") {
            this.#sortDirection = "desc"
        } else {
            this.#sortKey = undefined
        }
        this.refresh()
    }

    #toggleColumnVisibility(key: string) {
        if (this.#hiddenColumns.has(key)) {
            this.#hiddenColumns.delete(key)
        } else {
            this.#hiddenColumns.add(key)
        }
        this.refresh()
    }

    /** Applies search filtering then sorting (in that order) to `attrs.rows` */
    #processRows(attrs: DataTableInnerAttrsType<RowType>): RowType[] {
        let rows = attrs.rows
        const query = this.#searchQuery.trim().toLowerCase()
        if (query) {
            rows = rows.filter(row => attrs.columns.some(column => column.filterValue && column.filterValue(row).toLowerCase().includes(query)))
        }
        const sortColumn = attrs.columns.find(column => column.key == this.#sortKey)
        if (sortColumn?.sortValue) {
            const sortValue = sortColumn.sortValue
            const directionMultiplier = this.#sortDirection == "desc" ? -1 : 1
            rows = [...rows].sort((rowA, rowB) => {
                const valueA = sortValue(rowA)
                const valueB = sortValue(rowB)
                if (valueA < valueB) { return -1 * directionMultiplier }
                if (valueA > valueB) { return 1 * directionMultiplier }
                return 0
            })
        }
        return rows
    }

    /**
     * Starts a column-resize drag from `column`'s trailing-edge handle. Reads the starting
     * width from `thElement` (a real rendered box) rather than `colElement` - a `<col>` is a
     * layout hint, not a painted box, and its own `getBoundingClientRect()` isn't reliable -
     * and tracks the live width in a local variable through the drag rather than re-reading
     * from either element, committing that same tracked value to `#columnWidths` on pointerup.
     */
    #startResize(column: DataTableColumnType<RowType>, colElement: HTMLTableColElement, thElement: HTMLTableCellElement, event: PointerEvent) {
        event.preventDefault()
        const minWidth = column.minWidth ?? 60
        const startWidth = thElement.getBoundingClientRect().width
        const startX = event.clientX
        let currentWidth = startWidth
        const handleMove = (moveEvent: PointerEvent) => {
            currentWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX))
            colElement.style.width = `${currentWidth}px`
        }
        const handleUp = () => {
            this.#columnWidths[column.key] = currentWidth
            document.removeEventListener("pointermove", handleMove)
            document.removeEventListener("pointerup", handleUp)
        }
        document.addEventListener("pointermove", handleMove)
        document.addEventListener("pointerup", handleUp)
    }

    override render(attrs: DataTableInnerAttrsType<RowType>): RenderableElements {
        const visibleColumns = attrs.columns.filter(column => !this.#hiddenColumns.has(column.key))
        const hideableColumns = attrs.columns.filter(column => column.hideable !== false)

        const allRows = this.#processRows(attrs)
        const pageSize = attrs.pageSize
        const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(allRows.length / pageSize)) : 1
        const currentPage = Math.min(this.#currentPage, totalPages)
        const pageRows = pageSize > 0 ? allRows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : allRows

        const colElements: Record<string, HTMLTableColElement> = {}
        const colgroup = <colgroup>
            {visibleColumns.map(column => {
                const width = this.#columnWidths[column.key] ?? column.width
                const colElement: HTMLTableColElement = <col style={{width: width ? `${width}px` : undefined}}/>
                colElements[column.key] = colElement
                return colElement
            })}
        </colgroup>

        const headerRow = <tr>
            {visibleColumns.map(column => {
                const sortDirection: SortDirection | undefined = this.#sortKey == column.key ? this.#sortDirection : undefined
                const thElement: HTMLTableCellElement = <th
                    class={`${column.align ? `vtd-datatable-align-${column.align}` : ""}${column.sortValue ? " vtd-datatable-sortable" : ""}`}
                    aria-sort={sortDirection ? (sortDirection == "asc" ? "ascending" : "descending") : undefined}
                    onClick={column.sortValue ? () => this.#toggleSort(column) : undefined}>
                    <span class="vtd-datatable-header-content">
                        {column.header}
                        {sortDirection ? <span class="vtd-datatable-sort-indicator" aria-hidden="true">{sortDirection == "asc" ? "▲" : "▼"}</span> : null}
                    </span>
                    <span class="vtd-datatable-resize-handle" onPointerDown={(event: PointerEvent) => this.#startResize(column, colElements[column.key], thElement, event)}/>
                </th>
                return thElement
            })}
        </tr>

        const bodyRows = pageRows.map(row => <tr>
            {visibleColumns.map(column => <td class={column.align ? `vtd-datatable-align-${column.align}` : ""}>{column.render(row)}</td>)}
        </tr>)

        // The panel is always present in the DOM, gated by a class rather than conditional JSX,
        // and the toggle button mutates that class directly instead of calling this.refresh():
        // refreshing here would tear down and rebuild #columnMenuWrapperEl *while the
        // triggering click is still bubbling* to #handleDocumentClick, which reads that same
        // field - by the time it runs, the field would already point at the new element while
        // the event's target is the old (now-disconnected) button, so `.contains()` would
        // incorrectly read as "outside" and close the menu that was just opened.
        const columnMenuPanel: HTMLDivElement = <div class={`vtd-datatable-column-menu${this.#columnMenuOpen ? " vtd-datatable-column-menu-open" : ""}`}>
            {hideableColumns.map(column => <Checkbox checked={!this.#hiddenColumns.has(column.key)} onChange={() => this.#toggleColumnVisibility(column.key)}>{column.header}</Checkbox>)}
        </div>

        this.#columnMenuWrapperEl = <div class="vtd-datatable-column-menu-wrapper">
            <Button type="secondary" onClick={() => {
                this.#columnMenuOpen = !this.#columnMenuOpen
                columnMenuPanel.classList.toggle("vtd-datatable-column-menu-open", this.#columnMenuOpen)
            }}>Columns</Button>
            {columnMenuPanel}
        </div>

        return <div class="vtd-datatable">
            {hideableColumns.length > 0 ? <div class="vtd-datatable-toolbar">{this.#columnMenuWrapperEl}</div> : null}
            <div class="vtd-datatable-scroll">
                <table class="vtd-datatable-table">
                    {colgroup}
                    <thead>{headerRow}</thead>
                    <tbody>{allRows.length == 0 ? <tr><td class="vtd-datatable-empty" colspan={visibleColumns.length}>No results</td></tr> : bodyRows}</tbody>
                </table>
            </div>
            {pageSize > 0 && totalPages > 1 ? <div class="vtd-datatable-pagination">
                <Pagination page={currentPage} totalPages={totalPages} onPageChange={(page) => { this.#currentPage = page; this.refresh() }}/>
            </div> : null}
        </div>
    }
}

/**
 * A batteries-included data table: sortable columns (click a header), resizable columns (drag
 * a header's trailing edge), user-toggleable column visibility, an optional search box that
 * filters rows client-side, and built-in pagination via `Pagination`.
 *
 * `columns`/`rows` are read once, at construction, and rendered internally from there - like
 * `Carousel`/`Calendar`/every other stateful `Component` in this package, pass a fresh
 * `<DataTable columns={...} rows={...}/>` (letting your own `refresh()` remount it) to show new
 * data, rather than expecting an already-mounted instance to pick up changed attrs on its own.
 *
 * For a simple, fully-controlled table with no owned state (sort/page/etc. all driven by props
 * you manage yourself), use `Table` instead - `DataTable` is for when you want the common
 * table interactions to just work without wiring that state up by hand.
 */
export class DataTable<RowType> extends Component<DataTableAttrsType<RowType>> {
    #root: HTMLDivElement

    constructor(attrs: DataTableAttrsType<RowType>, children: RenderableElements[]) {
        super(attrs, children)
        if (!areDataTableStylesMounted) {
            areDataTableStylesMounted = true
            setStylesheet(`
.vtd-datatable-wrapper{display:flex;flex-direction:column;gap:0.75em;}
.vtd-datatable-search-wrapper{display:flex;}
.vtd-datatable-search-wrapper .vtd-textbox{width:100%;max-width:20em;margin-inline-start:0;box-sizing:border-box;}
.vtd-datatable-toolbar{display:flex;justify-content:flex-end;}
.vtd-datatable-column-menu-wrapper{position:relative;}
.vtd-datatable-column-menu{
position:absolute;
top:100%;
right:0;
z-index:1;
margin-block-start:0.25em;
min-width:12em;
padding:0.5em;
background-color:var(--background-1);
border:1px solid var(--background-4);
border-radius:0.25rem;
box-shadow:0 2px 8px rgba(0,0,0,0.15);
display:none;
flex-direction:column;
gap:0.1em;
}
.vtd-datatable-column-menu-open{display:flex;}
.vtd-datatable-scroll{overflow-x:auto;}
.vtd-datatable-table{width:100%;border-collapse:collapse;}
.vtd-datatable-table th,.vtd-datatable-table td{padding:0.6em 0.9em;text-align:start;border-block-end:1px solid var(--background-4);}
.vtd-datatable-table th{
position:relative;
font-weight:bold;
color:var(--text);
white-space:nowrap;
user-select:none;
}
.vtd-datatable-sortable{cursor:pointer;}
.vtd-datatable-sortable:hover{background-color:var(--background-1);}
.vtd-datatable-header-content{display:inline-flex;align-items:center;}
.vtd-datatable-sort-indicator{margin-inline-start:0.3em;opacity:0.6;}
.vtd-datatable-table tbody tr:hover{background-color:var(--background-1);}
.vtd-datatable-align-center{text-align:center;}
.vtd-datatable-align-end{text-align:end;}
.vtd-datatable-resize-handle{
position:absolute;
top:0;
right:0;
bottom:0;
width:0.4em;
cursor:col-resize;
touch-action:none;
}
.vtd-datatable-resize-handle:hover{background-color:var(--primary-6);}
.vtd-datatable-empty{text-align:center;opacity:0.6;padding:2em;}
.vtd-datatable-pagination{display:flex;justify-content:center;}
`, "vtd/DataTable")
        }

        const pageSize = attrs.pageSize ?? 10
        const inner = getComponent<DataTableInner<RowType>>(<DataTableInner<RowType> columns={attrs.columns} rows={attrs.rows} pageSize={pageSize}/>)

        let searchInput: HTMLInputElement | undefined
        if (attrs.searchable) {
            searchInput = <TextBox
                type="text"
                class="vtd-datatable-search"
                placeholder={attrs.searchPlaceholder || "Search..."}
                onInput={(event: Event) => {
                    if (event.target instanceof HTMLInputElement) { inner.setSearchQuery(event.target.value) }
                }}/>
        }

        this.#root = <div class="vtd-datatable-wrapper">
            {searchInput ? <div class="vtd-datatable-search-wrapper">{searchInput}</div> : null}
            {inner}
        </div>

        passthroughAttrsToElement<HTMLDivElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
