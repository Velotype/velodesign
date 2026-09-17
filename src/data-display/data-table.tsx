import { Component, getComponent, passthroughAttrsToElement } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Pagination } from "../navigation/pagination.tsx"
import { Select } from "../form/select.tsx"
import { TextBox } from "../form/text-box.tsx"
import {
    buildBodyRows, buildColGroup, buildHeaderCells, buildStatusRow, ColumnMenu,
    DataTableThemeOptions, mountDataTableStyles, startColumnResize
} from "./data-table-view.tsx"
import type { DataTableColumnBase, SortDirection } from "./data-table-view.tsx"

/**
 * A single column definition for a `<DataTable/>`
 */
export type DataTableColumnType<RowType> = DataTableColumnBase<RowType> & {
    /** Extracts a comparable value from a row for sorting; omit to make this column unsortable */
    sortValue?: (row: RowType) => string | number
    /** Extracts searchable text from a row for this column; omit to exclude it from search matching */
    filterValue?: (row: RowType) => string
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
    /** Content of the column-visibility button (default: `DataTableThemeOptions.columnsSymbol` - the `▥` glyph, not English text) */
    columnToggleChildren?: RenderableElements
    /** Accessible name for the column-visibility button. No default - the library doesn't assume a language. Set this whenever `columnToggleChildren` is a symbol rather than words, or the button has no name at all */
    columnToggleLabel?: string
    /** Label beside the page-size control. **No default** - there is no icon that means "rows per page", and this package never falls back to English, so an unset label renders the control with no caption */
    pageSizeLabel?: RenderableElements
    /** Shown in place of the rows when nothing matches (default: `DataTableThemeOptions.emptySymbol` - the `∅` glyph, not English text) */
    emptyMessage?: RenderableElements
    /** Shows a search box that filters rows using each column's `filterValue` (default: `false`) */
    searchable?: boolean
    /** Placeholder for the search input */
    searchPlaceholder?: string
    /** Alternate row background colors for readability (default: `false`) */
    zebra?: boolean
    /** Highlight a row's background on hover (default: `true`, matching this component's original behavior) */
    highlightOnHover?: boolean
    /**
     * If set, wraps each row's first visible column in a real `<a href>` spanning the row's
     * full width - a native "stretched link" (see `.vtd-datatable-row-link` in
     * `data-table-view.tsx`), so middle-click/ctrl-click/right-click "open in new tab" all keep
     * working, unlike a JS-only click handler on the row would. Return `undefined` for a given row
     * to leave it non-navigable. Takes priority over `onRowSelect` for a row where both would apply.
     */
    rowHref?: (row: RowType) => string | undefined
    /**
     * Forwarded to every row link built by `rowHref` - see `Link`'s own `spa` attr (default
     * `false`) for the full SPA-vs-multi-page-site explanation. With `spa`, a plain left-click
     * routes client-side via `History.changeLocation` while middle-click, ctrl/cmd-click,
     * right-click "open in new tab" and "copy link address" all keep working, because the row is
     * still a real `<a href>`. Has no effect on `onRowSelect`, which is JS-driven either way.
     */
    rowHrefSpa?: boolean
    /**
     * If set (and `rowHref` doesn't apply for a given row), makes the row a JS-driven "select"
     * action via a stretched `<button>` instead of an `<a>` - for picking a row that should
     * trigger something other than navigation (opening a modal, etc). Either way, a column's
     * own `render` can still put its own links/buttons/etc in any cell - they stay clickable
     * above the row-stretch overlay regardless.
     */
    onRowSelect?: (row: RowType) => void
} & IdAttr & StylePassthroughAttrs

type DataTableInnerAttrsType<RowType> = {
    columns: DataTableColumnType<RowType>[]
    rows: RowType[]
    pageSize: number
    pageSizeOptions: number[]
    showPageSizeControl: boolean
    resizableColumns: boolean
    zebra: boolean
    highlightOnHover: boolean
    pageSizeLabel: RenderableElements | undefined
    emptyMessage: RenderableElements
    rowHref?: (row: RowType) => string | undefined
    rowHrefSpa?: boolean
    onRowSelect?: (row: RowType) => void
}

/**
 * Owns every piece of `DataTable`'s state (sort, page, column widths/visibility) and renders
 * the actual `<table>`. Split out from `DataTable` so that nothing in the toolbar - the search
 * `TextBox`, which needs to stay mounted and keep focus while the user types, and the
 * column-visibility menu, whose open/closed state is tracked by a live element reference - ever
 * gets caught up in one of this component's own updates. The toolbar is `DataTable`'s, and it
 * drives this component through the two public methods below (`setSearchQuery`,
 * `toggleColumnVisibility`) rather than by owning any of the state itself.
 *
 * Every piece of persistent structure (the `<colgroup>`/`<thead>`/`<tbody>`, the footer) is
 * built exactly once, in the constructor. State changes (sort, search, page, column visibility,
 * page size) call `#renderTable()`, a targeted update that only replaces the contents of the
 * specific elements that actually need to change, rather than `this.refresh()` - `refresh()`
 * unmounts and rebuilds this *entire* component from scratch, which previously caused two real
 * bugs here: the column-menu panel closing itself immediately after opening (a fresh
 * `refresh()`-built element no longer matched the one a same-tick document click listener still
 * held a reference to) and a resized column's width reverting after an unrelated update. Since
 * `columns[].render(row)` is consumer-supplied and can return anything (including other stateful
 * components), a full `refresh()` on every sort/search/page change would also risk tearing down
 * and losing state in any such cell content.
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

    #root: HTMLDivElement
    #colgroupEl: HTMLTableColElement = <colgroup/>
    #theadRowEl: HTMLTableRowElement = <tr/>
    #tbodyEl: HTMLTableSectionElement = <tbody/>
    #footerEl: HTMLDivElement = <div class="vtd-datatable-footer"/>

    /** Called by `DataTable`'s persistent search input on every keystroke */
    setSearchQuery(query: string) {
        this.#searchQuery = query
        this.#currentPage = 1
        this.#renderTable()
    }

    /**
     * Called by `DataTable`'s column menu. The native checkbox there already updates its own
     * visual state, so this only needs to update which columns the table itself shows.
     */
    toggleColumnVisibility(key: string) {
        if (this.#hiddenColumns.has(key)) {
            this.#hiddenColumns.delete(key)
        } else {
            this.#hiddenColumns.add(key)
        }
        this.#renderTable()
    }

    #setPageSize(size: number) {
        this.#currentPageSize = size
        this.#currentPage = 1
        this.#renderTable()
    }

    #toggleSort(column: DataTableColumnBase<RowType>) {
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
     * Recomputes visible columns/rows/page and rewrites the `<colgroup>`/`<thead>`/`<tbody>`/
     * footer contents in place - never touches the search input, toolbar, or column-menu wrapper,
     * which don't depend on any of this state.
     */
    #renderTable() {
        const attrs = this.#attrs
        const visibleColumns = attrs.columns.filter(column => !this.#hiddenColumns.has(column.key))

        const allRows = this.#processRows()
        const pageSize = this.#currentPageSize
        const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(allRows.length / pageSize)) : 1
        const currentPage = Math.min(this.#currentPage, totalPages)
        const pageRows = pageSize > 0 ? allRows.slice((currentPage - 1) * pageSize, currentPage * pageSize) : allRows

        const {colElements, cols} = buildColGroup(visibleColumns, this.#columnWidths)
        this.#colgroupEl.replaceChildren(...cols)

        this.#theadRowEl.replaceChildren(...buildHeaderCells({
            columns: visibleColumns,
            isSortable: (column) => !!(column as DataTableColumnType<RowType>).sortValue,
            sortKey: this.#sortKey,
            sortDirection: this.#sortDirection,
            onSort: (column) => this.#toggleSort(column),
            resizableColumns: attrs.resizableColumns,
            onResizeStart: (column, thElement, event) => startColumnResize(
                column, colElements[column.key], thElement, event,
                (width) => { this.#columnWidths[column.key] = width }
            )
        }))

        const bodyRows = buildBodyRows({
            rows: pageRows,
            columns: visibleColumns,
            searchQuery: this.#searchQuery,
            rowHref: attrs.rowHref,
            rowHrefSpa: attrs.rowHrefSpa,
            onRowSelect: attrs.onRowSelect
        })
        this.#tbodyEl.replaceChildren(...(allRows.length == 0
            ? [buildStatusRow(visibleColumns.length, attrs.emptyMessage)]
            : bodyRows))
        this.#tbodyEl.classList.toggle("vtd-datatable-zebra", attrs.zebra)
        this.#tbodyEl.classList.toggle("vtd-datatable-hoverable", attrs.highlightOnHover)

        const footerChildren: HTMLDivElement[] = []
        if (pageSize > 0 && (totalPages > 1 || attrs.showPageSizeControl)) {
            footerChildren.push(<div class="vtd-datatable-page-size">
                {attrs.showPageSizeControl ? <label class="vtd-datatable-page-size-label">
                    {attrs.pageSizeLabel ?? null}
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

        this.#root = <div class="vtd-datatable">
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
 * **This is the right table only when the browser already holds every row.** Its search and sort
 * run over `rows` and nothing else, so pointing it at a server-truncated page silently turns
 * "search everything" into "search the first page". For a list the server filters, sorts and
 * pages, use `AsyncDataTable`, which looks identical and delegates all three.
 *
 * For a simple, fully-controlled table with no owned state (sort/page/etc. all driven by props
 * you manage yourself), use `Table` instead - `DataTable` is for when you want the common
 * table interactions to just work without wiring that state up by hand.
 */
export class DataTable<RowType> extends Component<DataTableAttrsType<RowType>> {
    #root: HTMLDivElement
    #columnMenu: ColumnMenu | undefined

    override mount() {
        this.#columnMenu?.attach()
    }
    override unmount() {
        this.#columnMenu?.detach()
    }

    constructor(attrs: DataTableAttrsType<RowType>, children: RenderableElements[]) {
        super(attrs, children)
        mountDataTableStyles()

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
            zebra={attrs.zebra ?? false}
            highlightOnHover={attrs.highlightOnHover ?? true}
            pageSizeLabel={attrs.pageSizeLabel}
            emptyMessage={attrs.emptyMessage ?? <DataTableThemeOptions.emptySymbol/>}
            rowHref={attrs.rowHref}
            rowHrefSpa={attrs.rowHrefSpa}
            onRowSelect={attrs.onRowSelect}/>)

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

        if (showColumnToggle) {
            this.#columnMenu = new ColumnMenu(
                attrs.columns,
                (key) => inner.toggleColumnVisibility(key),
                attrs.columnToggleChildren ?? <DataTableThemeOptions.columnsSymbol/>,
                attrs.columnToggleLabel
            )
        }
        const columnMenuEl = this.#columnMenu?.element

        this.#root = <div class="vtd-datatable-wrapper">
            {searchInput || columnMenuEl
                ? <div class="vtd-datatable-toolbar">
                    {searchInput ? <div class="vtd-datatable-search-wrapper">{searchInput}</div> : null}
                    {columnMenuEl ?? null}
                </div>
                : null}
            {inner}
        </div>

        passthroughAttrsToElement<HTMLDivElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
