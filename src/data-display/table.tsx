import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single column definition for a `<Table/>`
 */
export type TableColumnType<RowType> = {
    /** Unique key identifying this column */
    key: string
    /** Displayed content for the column's header */
    header: RenderableElements
    /** Renders a row's value for this column */
    render: (row: RowType) => RenderableElements
    /** If set, the header shows a sort indicator matching this state */
    sortDirection?: "asc" | "desc"
    /** If set, the header becomes clickable, calling this to request a sort change (the
     *  Table itself holds no sort state - sorting `rows` is the caller's responsibility) */
    onSortClick?: () => void
    /** Text alignment for this column's cells (default: `"start"`) */
    align?: "start" | "center" | "end"
}

/**
 * Attrs type for `<Table/>` Component
 */
export type TableAttrsType<RowType> = {
    /** Column definitions, in display order */
    columns: TableColumnType<RowType>[]
    /** The rows to display */
    rows: RowType[]
} & IdAttr & StylePassthroughAttrs

let areTableStylesMounted = false

/**
 * A themed data table, wrapping a native `<table/>`.
 *
 * Generic over the row type (`Table<RowType>`), so it can't be typed as the usual
 * `FunctionComponent<XAttrsType>` alias (that alias isn't generic) - otherwise it follows
 * the same shape as every other `FunctionComponent` in this package.
 *
 * Sorting/pagination/filtering are the caller's responsibility (pass already-sorted `rows`,
 * pair with `Pagination` for paging) - this Component only renders what it's given. For sort/
 * page/search/column-visibility/resize to just work without wiring that state up yourself,
 * use `DataTable` instead.
 */
export function Table<RowType>(attrs: TableAttrsType<RowType>, _children: RenderableElements[]): HTMLTableElement {
    if (!areTableStylesMounted) {
        areTableStylesMounted = true
        setStylesheet(`
.vtd-table{width:100%;border-collapse:collapse;}
.vtd-table th,.vtd-table td{padding:0.6em 0.9em;text-align:start;border-block-end:1px solid var(--background-4);}
.vtd-table th{font-weight:bold;color:var(--text);white-space:nowrap;}
.vtd-table th[aria-sort]{cursor:pointer;user-select:none;}
.vtd-table th[aria-sort]:hover{background-color:var(--background-1);}
.vtd-table-sort-indicator{margin-inline-start:0.3em;opacity:0.6;}
.vtd-table tbody tr:hover{background-color:var(--background-1);}
.vtd-table-align-center{text-align:center;}
.vtd-table-align-end{text-align:end;}
`, "vtd/Table")
    }

    return passthroughAttrsToElement<HTMLTableElement>(<table class="vtd-table">
        <thead>
            <tr>
                {attrs.columns.map(column => <th
                    aria-sort={column.sortDirection ? (column.sortDirection == "asc" ? "ascending" : "descending") : undefined}
                    class={column.align ? `vtd-table-align-${column.align}` : ""}
                    onClick={column.onSortClick}>
                    {column.header}
                    {column.sortDirection ? <span class="vtd-table-sort-indicator" aria-hidden="true">{column.sortDirection == "asc" ? "▲" : "▼"}</span> : null}
                </th>)}
            </tr>
        </thead>
        <tbody>
            {attrs.rows.map(row => <tr>
                {attrs.columns.map(column => <td class={column.align ? `vtd-table-align-${column.align}` : ""}>{column.render(row)}</td>)}
            </tr>)}
        </tbody>
    </table>, attrs)
}
