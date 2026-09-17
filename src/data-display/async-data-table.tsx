import { Component, passthroughAttrsToElement } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { Button } from "../form/button.tsx"
import { ButtonGroup } from "../form/button-group.tsx"
import { Pagination } from "../navigation/pagination.tsx"
import { Select } from "../form/select.tsx"
import { Spinner } from "../feedback/spinner.tsx"
import { TextBox } from "../form/text-box.tsx"
import {
    buildBodyRows, buildColGroup, buildHeaderCells, buildStatusRow, ColumnMenu,
    DataTableThemeOptions, mountDataTableStyles, startColumnResize
} from "./data-table-view.tsx"
import type { DataTableColumnBase, SortDirection } from "./data-table-view.tsx"

/**
 * A single column definition for an `<AsyncDataTable/>`.
 *
 * The one difference from `DataTableColumnType` is deliberate and load-bearing: there is no
 * `sortValue` or `filterValue`, because sorting and filtering a *page* in the browser produces a
 * confidently wrong answer - it reorders the rows that happened to come back rather than the set
 * they were drawn from. A column says only *whether* the server can sort by it, and `key` is what
 * gets sent back in the query.
 */
export type AsyncDataTableColumnType<RowType> = DataTableColumnBase<RowType> & {
    /** Whether the loader can sort by this column; its `key` is passed back as `sortKey` (default: `false`) */
    sortable?: boolean
}

/** What the table is asking its loader for */
export type AsyncDataTableQuery = {
    /** The current search text, already trimmed. Empty string when the box is empty */
    search: string
    /** `key` of the column to sort by, or `undefined` for the loader's own default order */
    sortKey?: string
    sortDirection?: SortDirection
    /** 1-indexed */
    page: number
    pageSize: number
}

/** What the loader gives back */
export type AsyncDataTableResult<RowType> = {
    /** This page's rows */
    rows: RowType[]
    /**
     * Total rows matching the query across every page, when the backend knows it. Given, the
     * footer shows real numbered pagination; omitted, it falls back to prev/next, since the page
     * count isn't knowable. Omitting it is a perfectly good choice - a `count(*)` over a large
     * filtered set is often more expensive than the page query itself.
     */
    total?: number
    /**
     * Set when the backend capped the result rather than returning everything that matched. The
     * table says so rather than letting a truncated list look complete, which is the failure a
     * server-side row cap otherwise produces silently.
     */
    truncated?: boolean
}

/**
 * Attrs type for `<AsyncDataTable/>` Component
 */
export type AsyncDataTableAttrsType<RowType> = {
    /** Column definitions, in display order */
    columns: AsyncDataTableColumnType<RowType>[]
    /**
     * Fetches one page. Called once on mount, then on every search change (debounced), sort
     * change, page change and page-size change.
     *
     * Rejections are caught and rendered as an error state, so a loader may throw. Out-of-order
     * resolutions are discarded by the component - see the class docstring.
     */
    load: (query: AsyncDataTableQuery) => Promise<AsyncDataTableResult<RowType>>
    /** Rows per page (default: `25`) */
    pageSize?: number
    /** Options offered by the page-size control, when shown (default: `[10, 25, 50, 100]`) */
    pageSizeOptions?: number[]
    /** Shows a control letting the user change how many rows are requested per page (default: `false`) */
    showPageSizeControl?: boolean
    /** Whether columns can be resized by dragging their trailing edge (default: `true`) */
    resizableColumns?: boolean
    /** Shows the column-visibility customizer button (default: `true`) */
    showColumnToggle?: boolean
    /** Content of the column-visibility button (default: `DataTableThemeOptions.columnsSymbol` - the `▥` glyph, not English text) */
    columnToggleChildren?: RenderableElements
    /** Accessible name for the column-visibility button. No default - the library doesn't assume a language. Set this whenever `columnToggleChildren` is a symbol rather than words, or the button has no name at all */
    columnToggleLabel?: string
    /** Label beside the page-size control. **No default** - there is no icon that means "rows per page", and this package never falls back to English, so an unset label renders the control with no caption */
    pageSizeLabel?: RenderableElements
    /** Shows the search box (default: `true` - an async table without search is usually a `Table`) */
    searchable?: boolean
    /** Placeholder for the search input */
    searchPlaceholder?: string
    /** How long to wait after the last keystroke before calling `load` (default: `200`) */
    debounceMs?: number
    /**
     * Shown when the loader returns no rows and the search box is empty - "there is nothing here"
     * (default: `DataTableThemeOptions.emptySymbol` - the `∅` glyph, not English text).
     *
     * Distinct from `noMatchMessage` on purpose: an empty collection and a search that matched
     * nothing are different facts, and telling a user "no results" when they have not searched for
     * anything is a small lie that makes an empty state look like a broken one.
     */
    emptyMessage?: RenderableElements
    /** Shown when the loader returns no rows for a non-empty search (default: falls back to `emptyMessage`) */
    noMatchMessage?: RenderableElements
    /** Rendered when `load` rejects. Receives the thrown value; return whatever should fill the table */
    renderError?: (error: unknown) => RenderableElements
    /** Accessible label for the loading spinner. No default - this package doesn't assume a language */
    loadingLabel?: string
    /** Shown beside the pagination when a result comes back with `truncated: true` */
    truncatedMessage?: RenderableElements
    /** Alternate row background colors for readability (default: `false`) */
    zebra?: boolean
    /** Highlight a row's background on hover (default: `true`) */
    highlightOnHover?: boolean
    /** See `DataTable`'s `rowHref` - identical behavior */
    rowHref?: (row: RowType) => string | undefined
    /** See `DataTable`'s `rowHrefSpa` - identical behavior */
    rowHrefSpa?: boolean
    /** See `DataTable`'s `onRowSelect` - identical behavior */
    onRowSelect?: (row: RowType) => void
} & IdAttr & StylePassthroughAttrs

type LoadState = "loading" | "ready" | "error"

/**
 * A data table whose filtering, sorting and pagination are done by a server.
 *
 * Visually identical to `DataTable` - both render through `data-table-view.tsx` - and the opposite
 * of it in every other respect: `DataTable` owns an array and computes over it, while this owns a
 * *query* and asks `load` to answer it. Reach for this whenever the backend caps, filters or sorts
 * the rows, because `DataTable` in that position silently narrows "search everything" to "search
 * the page you already have".
 *
 * Four things it owns that a hand-rolled version reliably gets wrong:
 *
 * 1. **Out-of-order responses.** Typing "ann" fires three requests; if the one for "an" resolves
 *    after the one for "ann", the slower, staler answer wins and the table contradicts the input
 *    box. Every request carries a sequence number and a response from anything but the newest is
 *    dropped. This is the bug worth having a component for - it is invisible on a fast local
 *    database and routine over a real network.
 * 2. **The search input is never unmounted.** Like `DataTable`, the toolbar is built once and only
 *    the table's own elements are replaced, so a re-render cannot eat a keystroke or the caret.
 * 3. **Debounce.** A query per keystroke is a query per keystroke all the way down to the
 *    database; `debounceMs` collapses a burst of typing into one.
 * 4. **Three empty-ish states kept distinct** - loading, "nothing here", and "nothing matched
 *    *that*" - plus a loader rejection, which otherwise renders as a convincing empty table.
 *
 * Like every stateful component here, `columns` and `load` are read once at construction; pass a
 * fresh instance to change them.
 */
export class AsyncDataTable<RowType> extends Component<AsyncDataTableAttrsType<RowType>> {
    #attrs: AsyncDataTableAttrsType<RowType>
    #root: HTMLDivElement
    #columnMenu: ColumnMenu | undefined

    #colgroupEl: HTMLTableColElement = <colgroup/>
    #theadRowEl: HTMLTableRowElement = <tr/>
    #tbodyEl: HTMLTableSectionElement = <tbody/>
    #footerEl: HTMLDivElement = <div class="vtd-datatable-footer"/>

    #search = ""
    #sortKey: string | undefined
    #sortDirection: SortDirection = "asc"
    #page = 1
    #pageSize: number
    #hiddenColumns = new Set<string>()
    #columnWidths: Record<string, number> = {}

    #rows: RowType[] = []
    #total: number | undefined
    #truncated = false
    #state: LoadState = "loading"
    #error: unknown
    /** The search text the currently-displayed rows were fetched for, so highlighting matches them */
    #renderedSearch = ""

    /**
     * Incremented for every request issued; a response whose sequence isn't the latest is thrown
     * away. Without this a slow early request can land after a fast later one and overwrite it.
     */
    #seq = 0
    #debounceTimer: ReturnType<typeof setTimeout> | undefined
    /** False once the component unmounts, so a request in flight can't touch a detached tree */
    #live = true

    override mount() {
        this.#columnMenu?.attach()
    }

    override unmount() {
        this.#live = false
        this.#columnMenu?.detach()
        if (this.#debounceTimer !== undefined) {
            clearTimeout(this.#debounceTimer)
        }
    }

    /** Issues a fresh request for the current query, discarding whatever is already in flight */
    #run() {
        const seq = ++this.#seq
        // A reload keeps the existing rows on screen (faded by `#renderBody`) rather than blanking
        // the table; only the very first load has nothing better to show than a spinner.
        this.#state = "loading"
        this.#renderBody()
        this.#renderFooter()
        const query: AsyncDataTableQuery = {
            search: this.#search.trim(),
            sortKey: this.#sortKey,
            sortDirection: this.#sortKey === undefined ? undefined : this.#sortDirection,
            page: this.#page,
            pageSize: this.#pageSize
        }
        this.#attrs.load(query).then((result) => {
            if (!this.#live || seq !== this.#seq) {
                return
            }
            this.#rows = result.rows
            this.#total = result.total
            this.#truncated = result.truncated ?? false
            this.#renderedSearch = query.search
            this.#state = "ready"
            this.#renderBody()
            this.#renderFooter()
        }).catch((error: unknown) => {
            if (!this.#live || seq !== this.#seq) {
                return
            }
            this.#error = error
            this.#state = "error"
            this.#renderBody()
            this.#renderFooter()
        })
    }

    /** Called by the search box; resets to page 1 and debounces */
    #setSearch(value: string) {
        this.#search = value
        this.#page = 1
        if (this.#debounceTimer !== undefined) {
            clearTimeout(this.#debounceTimer)
        }
        this.#debounceTimer = setTimeout(() => {
            this.#debounceTimer = undefined
            this.#run()
        }, this.#attrs.debounceMs ?? 200)
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
        // A different order can change which rows fall on the first page, so a sort restarts at it
        this.#page = 1
        this.#renderHead()
        this.#run()
    }

    #toggleColumnVisibility(key: string) {
        if (this.#hiddenColumns.has(key)) {
            this.#hiddenColumns.delete(key)
        } else {
            this.#hiddenColumns.add(key)
        }
        // Purely a display concern - no refetch, the rows are already here
        this.#renderHead()
        this.#renderBody()
    }

    #visibleColumns(): AsyncDataTableColumnType<RowType>[] {
        return this.#attrs.columns.filter(column => !this.#hiddenColumns.has(column.key))
    }

    #renderHead() {
        const visibleColumns = this.#visibleColumns()
        const {colElements, cols} = buildColGroup(visibleColumns, this.#columnWidths)
        this.#colgroupEl.replaceChildren(...cols)
        this.#theadRowEl.replaceChildren(...buildHeaderCells({
            columns: visibleColumns,
            isSortable: (column) => !!(column as AsyncDataTableColumnType<RowType>).sortable,
            sortKey: this.#sortKey,
            sortDirection: this.#sortDirection,
            onSort: (column) => this.#toggleSort(column),
            resizableColumns: this.#attrs.resizableColumns ?? true,
            onResizeStart: (column, thElement, event) => startColumnResize(
                column, colElements[column.key], thElement, event,
                (width) => { this.#columnWidths[column.key] = width }
            )
        }))
    }

    #renderBody() {
        const attrs = this.#attrs
        const visibleColumns = this.#visibleColumns()
        const colspan = Math.max(1, visibleColumns.length)

        if (this.#state === "error") {
            this.#tbodyEl.replaceChildren(buildStatusRow(colspan,
                attrs.renderError ? attrs.renderError(this.#error) : String(this.#error)))
        } else if (this.#state === "loading" && this.#rows.length === 0) {
            // Only the first load shows a spinner in place of content; a reload with rows already
            // on screen keeps them and fades instead (the class toggle below).
            this.#tbodyEl.replaceChildren(buildStatusRow(colspan,
                <span class="vtd-datatable-status"><Spinner label={attrs.loadingLabel}/></span>))
        } else if (this.#rows.length === 0) {
            const message = this.#renderedSearch
                ? (attrs.noMatchMessage ?? attrs.emptyMessage ?? <DataTableThemeOptions.emptySymbol/>)
                : (attrs.emptyMessage ?? <DataTableThemeOptions.emptySymbol/>)
            this.#tbodyEl.replaceChildren(buildStatusRow(colspan, message))
        } else {
            this.#tbodyEl.replaceChildren(...buildBodyRows({
                rows: this.#rows,
                columns: visibleColumns,
                searchQuery: this.#renderedSearch,
                rowHref: attrs.rowHref,
                rowHrefSpa: attrs.rowHrefSpa,
                onRowSelect: attrs.onRowSelect
            }))
        }
        this.#tbodyEl.classList.toggle("vtd-datatable-zebra", attrs.zebra ?? false)
        this.#tbodyEl.classList.toggle("vtd-datatable-hoverable", attrs.highlightOnHover ?? true)
        this.#tbodyEl.classList.toggle("vtd-datatable-body-reloading", this.#state === "loading" && this.#rows.length > 0)
    }

    #goToPage(page: number) {
        this.#page = page
        this.#run()
    }

    #renderFooter() {
        const attrs = this.#attrs
        const children: HTMLElement[] = []

        if (attrs.showPageSizeControl) {
            children.push(<div class="vtd-datatable-page-size">
                <label class="vtd-datatable-page-size-label">
                    {attrs.pageSizeLabel ?? null}
                    <Select
                        value={String(this.#pageSize)}
                        options={(attrs.pageSizeOptions ?? [10, 25, 50, 100]).map(size => ({value: String(size), label: String(size)}))}
                        onChange={(event: Event) => {
                            if (event.target instanceof HTMLSelectElement) {
                                this.#pageSize = Number(event.target.value)
                                this.#page = 1
                                this.#run()
                            }
                        }}/>
                </label>
            </div>)
        }

        if (this.#truncated && attrs.truncatedMessage) {
            children.push(<div class="vtd-datatable-truncated">{attrs.truncatedMessage}</div>)
        }

        if (this.#total !== undefined) {
            const totalPages = Math.max(1, Math.ceil(this.#total / this.#pageSize))
            if (totalPages > 1) {
                children.push(<div class="vtd-datatable-pagination">
                    <Pagination
                        page={Math.min(this.#page, totalPages)}
                        totalPages={totalPages}
                        onPageChange={(page) => this.#goToPage(page)}/>
                </div>)
            }
        } else if (this.#page > 1 || this.#rows.length >= this.#pageSize) {
            // Without a total there is no page count to render, so this degrades to prev/next.
            // "There may be a next page" is inferred from a full page having come back - the only
            // signal available, and why `total` is worth providing when it is cheap.
            const atEnd = this.#rows.length < this.#pageSize
            children.push(<div class="vtd-datatable-pagination">
                <ButtonGroup>
                    <Button type="secondary" disabled={this.#page <= 1} onClick={() => this.#goToPage(this.#page - 1)}>‹</Button>
                    <Button type="secondary" disabled={atEnd} onClick={() => this.#goToPage(this.#page + 1)}>›</Button>
                </ButtonGroup>
            </div>)
        }

        this.#footerEl.replaceChildren(...children)
    }

    constructor(attrs: AsyncDataTableAttrsType<RowType>, children: RenderableElements[]) {
        super(attrs, children)
        mountDataTableStyles()
        this.#attrs = attrs
        this.#pageSize = attrs.pageSize ?? 25

        let searchInput: HTMLInputElement | undefined
        if (attrs.searchable ?? true) {
            searchInput = <TextBox
                type="text"
                class="vtd-datatable-search"
                placeholder={attrs.searchPlaceholder}
                onInput={(event: Event) => {
                    if (event.target instanceof HTMLInputElement) { this.#setSearch(event.target.value) }
                }}/>
        }

        if (attrs.showColumnToggle ?? true) {
            this.#columnMenu = new ColumnMenu(
                attrs.columns,
                (key) => this.#toggleColumnVisibility(key),
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
            <div class="vtd-datatable">
                <div class="vtd-datatable-scroll">
                    <table class="vtd-datatable-table">
                        {this.#colgroupEl}
                        <thead>{this.#theadRowEl}</thead>
                        {this.#tbodyEl}
                    </table>
                </div>
                {this.#footerEl}
            </div>
        </div>

        this.#renderHead()
        this.#renderBody()
        this.#run()

        passthroughAttrsToElement<HTMLDivElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
