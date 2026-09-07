import { Component, getComponent, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "./button.tsx"
import { Checkbox } from "./checkbox.tsx"
import { Pagination } from "./pagination.tsx"
import { Select } from "./select.tsx"
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
    /** If `false`, this column can't be hidden via the column-visibility control, and always shows as a disabled, checked entry there instead of being omitted (default: `true`) */
    hideable?: boolean
    /** If `false`, this column's width can't be dragged, regardless of `resizableColumns` (default: `true`) */
    resizable?: boolean
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
    /** Options offered by the page-size control, when shown (default: `[10, 25, 50, 100]`) */
    pageSizeOptions?: number[]
    /** Shows a control letting the user change how many rows are displayed per page (default: `false`) */
    showPageSizeControl?: boolean
    /** Whether columns can be resized by dragging their trailing edge, unless overridden per-column via `resizable` (default: `true`) */
    resizableColumns?: boolean
    /** Shows the column-visibility customizer button (default: `true`) */
    showColumnToggle?: boolean
    /** Shows a search box that filters rows using each column's `filterValue` (default: `false`) */
    searchable?: boolean
    /** Placeholder for the search input */
    searchPlaceholder?: string
} & IdAttr & StylePassthroughAttrs

type SortDirection = "asc" | "desc"

let areDataTableStylesMounted = false

type DataTableInnerAttrsType<RowType> = {
    columns: DataTableColumnType<RowType>[]
    rows: RowType[]
    pageSize: number
    pageSizeOptions: number[]
    showPageSizeControl: boolean
    resizableColumns: boolean
    showColumnToggle: boolean
}

/**
 * Owns every piece of `DataTable`'s state (sort, page, column widths/visibility) and renders
 * the actual `<table>`. Split out from `DataTable` so the search `TextBox` - which needs to
 * stay mounted and keep focus while the user types - never gets caught up in one of this
 * component's own updates; see `setSearchQuery`.
 *
 * Every piece of persistent structure (the column-menu button/panel, the `<colgroup>`/`<thead>`/
 * `<tbody>`, the footer) is built exactly once, in the constructor. State changes (sort, search,
 * page, column visibility, page size) call `#renderTable()`, a targeted update that only
 * replaces the contents of the specific elements that actually need to change, rather than
 * `this.refresh()` - `refresh()` unmounts and rebuilds this *entire* component from scratch,
 * which previously caused two real bugs here: the column-menu panel closing itself immediately
 * after opening (a fresh `refresh()`-built element no longer matched the one a same-tick
 * document click listener still held a reference to) and a resized column's width reverting
 * after an unrelated update. Since `columns[].render(row)` is consumer-supplied and can return
 * anything (including other stateful components), a full `refresh()` on every sort/search/page
 * change would also risk tearing down and losing state in any such cell content, and in the
 * column-menu panel/toolbar even though neither one is actually affected by those changes.
 */
class DataTableInner<RowType> extends Component<DataTableInnerAttrsType<RowType>> {
    #attrs: DataTableInnerAttrsType<RowType>
    #searchQuery = ""
    #sortKey: string | undefined
    #sortDirection: SortDirection = "asc"
    #currentPage = 1
    #currentPageSize: number
    #hiddenColumns = new Set<string>()
    #columnWidths: Record<string, number> = {}
    #columnMenuOpen = false

    #root: HTMLDivElement
    #colgroupEl: HTMLTableColElement = <colgroup/>
    #theadRowEl: HTMLTableRowElement = <tr/>
    #tbodyEl: HTMLTableSectionElement = <tbody/>
    #footerEl: HTMLDivElement = <div class="vtd-datatable-footer"/>
    /** The column-menu's own wrapper; built once, so outside-click detection always checks a stable element */
    #columnMenuWrapperEl: HTMLDivElement
    #columnMenuPanelEl: HTMLDivElement

    /** Close the column menu if it's open and the click landed outside of it */
    #handleDocumentClick = (event: MouseEvent) => {
        if (!this.#columnMenuOpen) {
            return
        }
        if (event.target instanceof Node && this.#columnMenuWrapperEl.contains(event.target)) {
            return
        }
        this.#columnMenuOpen = false
        this.#columnMenuPanelEl.classList.remove("vtd-datatable-column-menu-open")
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
        this.#renderTable()
    }

    #setPageSize(size: number) {
        this.#currentPageSize = size
        this.#currentPage = 1
        this.#renderTable()
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
        this.#renderTable()
    }

    /** Native checkbox toggling already updates its own visual state - this only needs to update which columns the table itself shows */
    #toggleColumnVisibility(key: string) {
        if (this.#hiddenColumns.has(key)) {
            this.#hiddenColumns.delete(key)
        } else {
            this.#hiddenColumns.add(key)
        }
        this.#renderTable()
    }

    /** Applies search filtering then sorting (in that order) to `this.#attrs.rows` */
    #processRows(): RowType[] {
        const attrs = this.#attrs
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

    /**
     * Recomputes visible columns/rows/page and rewrites the `<colgroup>`/`<thead>`/`<tbody>`/
     * footer contents in place via `replaceChildren` - never touches the search input, toolbar,
     * or column-menu wrapper, which don't depend on any of this state.
     */
    #renderTable() {
        const attrs = this.#attrs
        const visibleColumns = attrs.columns.filter(column => !this.#hiddenColumns.has(column.key))

        const allRows = this.#processRows()
        const pageSize = this.#currentPageSize
        const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(allRows.length / pageSize)) : 1
        const currentPage = Math.min(this.#currentPage, totalPages)
        const pageRows = pageSize > 0 ? allRows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : allRows

        const colElements: Record<string, HTMLTableColElement> = {}
        this.#colgroupEl.replaceChildren(...visibleColumns.map(column => {
            const width = this.#columnWidths[column.key] ?? column.width
            const colElement: HTMLTableColElement = <col style={{width: width ? `${width}px` : undefined}}/>
            colElements[column.key] = colElement
            return colElement
        }))

        this.#theadRowEl.replaceChildren(...visibleColumns.map(column => {
            const sortDirection: SortDirection | undefined = this.#sortKey == column.key ? this.#sortDirection : undefined
            const thElement: HTMLTableCellElement = <th
                class={`${column.align ? `vtd-datatable-align-${column.align}` : ""}${column.sortValue ? " vtd-datatable-sortable" : ""}`}
                aria-sort={sortDirection ? (sortDirection == "asc" ? "ascending" : "descending") : undefined}
                onClick={column.sortValue ? () => this.#toggleSort(column) : undefined}>
                <span class="vtd-datatable-header-content">
                    {column.header}
                    {sortDirection ? <span class="vtd-datatable-sort-indicator" aria-hidden="true">{sortDirection == "asc" ? "▲" : "▼"}</span> : null}
                </span>
                {(column.resizable ?? true) && attrs.resizableColumns ? <span class="vtd-datatable-resize-handle" onPointerDown={(event: PointerEvent) => this.#startResize(column, colElements[column.key], thElement, event)}/> : null}
            </th>
            return thElement
        }))

        const bodyRows = pageRows.map(row => <tr>
            {visibleColumns.map(column => <td class={column.align ? `vtd-datatable-align-${column.align}` : ""}>{column.render(row)}</td>)}
        </tr>)
        this.#tbodyEl.replaceChildren(...(allRows.length == 0 ? [<tr><td class="vtd-datatable-empty" colspan={visibleColumns.length}>No results</td></tr>] : bodyRows))

        const footerChildren: HTMLDivElement[] = []
        if (pageSize > 0 && (totalPages > 1 || attrs.showPageSizeControl)) {
            footerChildren.push(<div class="vtd-datatable-page-size">
                {attrs.showPageSizeControl ? <label class="vtd-datatable-page-size-label">
                    Rows per page:
                    <Select
                        value={String(pageSize)}
                        options={attrs.pageSizeOptions.map(size => ({value: String(size), label: String(size)}))}
                        onChange={(event: Event) => {
                            if (event.target instanceof HTMLSelectElement) { this.#setPageSize(Number(event.target.value)) }
                        }}/>
                </label> : null}
            </div>)
            if (totalPages > 1) {
                footerChildren.push(<div class="vtd-datatable-pagination">
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={(page) => { this.#currentPage = page; this.#renderTable() }}/>
                </div>)
            }
        }
        this.#footerEl.replaceChildren(...footerChildren)
    }

    /** Create a new `<DataTableInner/>` Component */
    constructor(attrs: DataTableInnerAttrsType<RowType>, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        this.#currentPageSize = attrs.pageSize

        this.#columnMenuPanelEl = <div class="vtd-datatable-column-menu">
            {attrs.columns.map(column => column.hideable === false
                ? <Checkbox checked disabled>{column.header}</Checkbox>
                : <Checkbox checked={!this.#hiddenColumns.has(column.key)} onChange={() => this.#toggleColumnVisibility(column.key)}>{column.header}</Checkbox>)}
        </div>

        this.#columnMenuWrapperEl = <div class="vtd-datatable-column-menu-wrapper">
            <Button type="secondary" onClick={() => {
                this.#columnMenuOpen = !this.#columnMenuOpen
                this.#columnMenuPanelEl.classList.toggle("vtd-datatable-column-menu-open", this.#columnMenuOpen)
            }}>Columns</Button>
            {this.#columnMenuPanelEl}
        </div>

        this.#root = <div class="vtd-datatable">
            {attrs.showColumnToggle ? <div class="vtd-datatable-toolbar">{this.#columnMenuWrapperEl}</div> : null}
            <div class="vtd-datatable-scroll">
                <table class="vtd-datatable-table">
                    {this.#colgroupEl}
                    <thead>{this.#theadRowEl}</thead>
                    {this.#tbodyEl}
                </table>
            </div>
            {this.#footerEl}
        </div>

        this.#renderTable()
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
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
.vtd-datatable-wrapper{width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:0.75em;}
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
.vtd-datatable-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1em;}
.vtd-datatable-page-size-label{display:flex;align-items:center;gap:0.5em;}
.vtd-datatable-pagination{display:flex;justify-content:center;flex-grow:1;}
`, "vtd/DataTable")
        }

        const pageSize = attrs.pageSize ?? 10
        const pageSizeOptions = attrs.pageSizeOptions ?? [10, 25, 50, 100]
        const showPageSizeControl = attrs.showPageSizeControl ?? false
        const resizableColumns = attrs.resizableColumns ?? true
        const showColumnToggle = attrs.showColumnToggle ?? true
        const inner = getComponent<DataTableInner<RowType>>(<DataTableInner<RowType>
            columns={attrs.columns}
            rows={attrs.rows}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            showPageSizeControl={showPageSizeControl}
            resizableColumns={resizableColumns}
            showColumnToggle={showColumnToggle}/>)

        let searchInput: HTMLInputElement | undefined
        if (attrs.searchable) {
            searchInput = <TextBox
                type="text"
                class="vtd-datatable-search"
                placeholder={attrs.searchPlaceholder}
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
