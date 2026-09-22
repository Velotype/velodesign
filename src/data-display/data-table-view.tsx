import {} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { RenderableElements } from "../core/velotype.ts"
import { Button } from "../form/button.tsx"
import { Checkbox } from "../form/checkbox.tsx"
import { highlightMatch, searchHighlightCss } from "../core/search-highlight.tsx"
import { History } from "../core/history.ts"
import { CommonThemeOptions, themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Shared internals for `DataTable` and `AsyncDataTable`.
 *
 * The two components differ entirely in *where the work happens* - one filters, sorts and pages a
 * fixed array in the browser, the other delegates all three to a server - and not at all in how
 * the result looks. Keeping the markup, the stylesheet and the column-visibility menu here is what
 * stops those two from drifting into two subtly different-looking tables, which is the whole
 * reason the async variant is a sibling rather than a fork.
 *
 * Nothing here is exported from the package: `index.ts` exports the two components and their attrs
 * types, not this module.
 */

/** Fields every column definition carries, whichever table it belongs to */
export type DataTableColumnBase<RowType> = {
    /** Unique key identifying this column */
    key: string
    /** Displayed content for the column's header */
    header: RenderableElements
    /** Renders a row's value for this column */
    render: (row: RowType) => RenderableElements
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

export type SortDirection = "asc" | "desc"

/**
 * Overridable symbols shared by both tables, following the `XThemeOptions` pattern.
 *
 * Both are glyphs rather than words, because this package never defaults visible text to English
 * (see CLAUDE.md's "Language-agnostic by default"). A consumer who wants words overrides these
 * once - `DataTableThemeOptions.columnsSymbol = () => "Columns"` - and gets them on every table in
 * their app, or passes `columnToggleChildren` on a single instance.
 *
 * There is deliberately **no entry here for the page-size label**. "Rows per page:" has no
 * iconographic equivalent, and the rule for that case is no default at all rather than a symbol
 * nobody can read: it is a plain optional attr on each component, exactly like `Empty`'s `title`.
 */
export const DataTableThemeOptions: {
    /** Content of the column-visibility button. `▥` - vertical bands, i.e. columns. Nothing else in the package draws this, so it stays local */
    columnsSymbol: ThemeSymbol
    /** Shown in place of the rows when there are none. The whole visual, sizing included; set `CommonThemeOptions.emptySymbol` to change just the glyph, here and in `Empty` and every chart */
    emptySymbol: ThemeSymbol
} = themeOptions({}, {
    columnsSymbol: function() {return <span aria-hidden="true">▥</span>},
    emptySymbol: function() {return <span class="vtd-data-table-empty-icon" aria-hidden="true"><CommonThemeOptions.emptySymbol/></span>}
})

let areDataTableStylesMounted = false

/**
 * Mounts the stylesheet both tables share, once.
 *
 * One `setStylesheet` key for both components, not one each: two stylesheets would be two places
 * for a padding value to diverge, and the visual consistency between the two tables is the point.
 */
export function mountDataTableStyles(): void {
    if (areDataTableStylesMounted) {
        return
    }
    areDataTableStylesMounted = true
    mountStyles(
`
.vtd-data-table-wrapper{width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:0.75em;}
` +
/*
 * The search box and the "Columns" button share one toolbar row: search takes the leading edge
 * and absorbs the slack, the button sits at the trailing edge. flex-wrap is the escape valve
 * for a container too narrow to hold both - they stack rather than crushing the input - and the
 * search box's flex-basis is what decides when that happens.
 */
`
.vtd-data-table-toolbar{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5em;}
.vtd-data-table-search-wrapper{display:flex;flex:1 1 12em;min-width:0;align-items:center;gap:0.5em;}
.vtd-data-table-search-wrapper .vtd-text-box{width:100%;max-width:20em;margin-inline-start:0;box-sizing:border-box;}
` +
/* The auto margin keeps the button trailing-aligned in the searchable={false} case, where it's the row's only child */
`
.vtd-data-table-column-menu-wrapper{position:relative;margin-inline-start:auto;}
.vtd-data-table-column-menu{
position:absolute;
top:100%;
right:0;
z-index:1000;
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
.vtd-data-table-column-menu-open{display:flex;}
.vtd-data-table-scroll{overflow-x:auto;}
.vtd-data-table-table{width:100%;border-collapse:collapse;}
.vtd-data-table-table th,.vtd-data-table-table td{padding:0.6em 0.9em;text-align:start;border-block-end:1px solid var(--background-4);}
.vtd-data-table-table th{
position:relative;
font-weight:bold;
color:var(--text);
white-space:nowrap;
user-select:none;
}
.vtd-data-table-sortable:hover{background-color:var(--background-1);}
.vtd-data-table-sort-button{
cursor:pointer;
display:flex;
align-items:center;
min-height:24px;
width:100%;
text-align:inherit;
background:transparent;
border:none;
color:inherit;
font:inherit;
font-weight:inherit;
padding:0;
}
.vtd-data-table-header-content{display:inline-flex;align-items:center;}
.vtd-data-table-sort-indicator{margin-inline-start:0.3em;opacity:0.6;}
.vtd-data-table-table tbody tr{position:relative;}
.vtd-data-table-hoverable tr:hover{background-color:var(--background-1);}
.vtd-data-table-zebra tr:nth-child(even){background-color:var(--background-1);}
.vtd-data-table-zebra.vtd-data-table-hoverable tr:nth-child(even):hover{background-color:var(--background-2);}
.vtd-data-table-align-center{text-align:center;}
.vtd-data-table-align-end{text-align:end;}
` +
/*
 * A "clickable row" (rowHref/onRowSelect): the link/button wraps the first visible column's
 * real content (so it keeps a natural, meaningful accessible name from that content, and
 * displays inline exactly as that cell always did) - the actual full-row hit target is a
 * pseudo-element stretched via position:absolute;inset:0 to the row's own position:relative
 * box above. Any other interactive element a column's own render() puts in a cell (a per-row
 * action button in a later column, say) gets position:relative + a higher stacking order here
 * so it stays clickable above that stretch, rather than the row-level link swallowing its clicks.
 */
`
.vtd-data-table-row-link{color:inherit;text-decoration:none;}
.vtd-data-table-row-link-button{display:block;width:100%;text-align:inherit;background:transparent;border:none;color:inherit;font:inherit;padding:0;cursor:pointer;}
.vtd-data-table-row-link::after{content:"";position:absolute;inset:0;z-index:0;}
.vtd-data-table-table td :is(a,button,input,select,textarea):not(.vtd-data-table-row-link):not(.vtd-data-table-row-link-button){position:relative;z-index:1;}
.vtd-data-table-resize-handle{
position:absolute;
top:0;
right:0;
bottom:0;
width:0.4em;
cursor:col-resize;
touch-action:none;
}
.vtd-data-table-resize-handle:hover{background-color:var(--primary-6);}
.vtd-data-table-empty{text-align:center;opacity:0.6;padding:2em;}
` +
/* Sized like Empty's own icon, so a table with no rows and an <Empty/> beside it agree */
`
.vtd-data-table-empty-icon{font-size:2em;line-height:1;display:inline-block;}
.vtd-data-table-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1em;}
.vtd-data-table-page-size-label{display:flex;align-items:center;gap:0.5em;}
.vtd-data-table-pagination{display:flex;justify-content:center;flex-grow:1;}
` +
/*
 * Async-only states. A reload keeps the previous rows in place and fades them rather than
 * swapping in a spinner: replacing the table on every keystroke makes the page jump around, and
 * the stale rows are still the best answer available until the new ones land.
 */
`
.vtd-data-table-body-reloading{opacity:0.45;transition:opacity 120ms ease-out;}
.vtd-data-table-status{display:flex;align-items:center;gap:0.5em;justify-content:center;padding:2em;opacity:0.7;}
.vtd-data-table-truncated{font-size:0.85em;color:var(--warning-8);}
@media (prefers-reduced-motion: reduce){
.vtd-data-table-body-reloading{transition:none;}
}
${searchHighlightCss}
`, "vtd/DataTable", "composite")
}

/** Builds the `<colgroup>` contents, returning each column's `<col>` so a resize can size it */
export function buildColGroup<RowType>(
    columns: DataTableColumnBase<RowType>[],
    widths: Record<string, number>
): {colElements: Record<string, HTMLTableColElement>, cols: HTMLTableColElement[]} {
    const colElements: Record<string, HTMLTableColElement> = {}
    const cols = columns.map(column => {
        const width = widths[column.key] ?? column.width
        const colElement: HTMLTableColElement = <col style={{width: width ? `${width}px` : undefined}}/>
        colElements[column.key] = colElement
        return colElement
    })
    return {colElements, cols}
}

export type DataTableHeaderOptions<RowType> = {
    columns: DataTableColumnBase<RowType>[]
    /** Whether this particular column offers sorting at all - locally computed or server-delegated */
    isSortable: (column: DataTableColumnBase<RowType>) => boolean
    /** The column currently sorted on, if any */
    sortKey: string | undefined
    sortDirection: SortDirection
    onSort: (column: DataTableColumnBase<RowType>) => void
    resizableColumns: boolean
    onResizeStart: (column: DataTableColumnBase<RowType>, thElement: HTMLTableCellElement, event: PointerEvent) => void
}

/** Builds the header row's `<th>` cells */
export function buildHeaderCells<RowType>(options: DataTableHeaderOptions<RowType>): HTMLTableCellElement[] {
    return options.columns.map(column => {
        const sortable = options.isSortable(column)
        const sortDirection: SortDirection | undefined = options.sortKey == column.key ? options.sortDirection : undefined
        // A sortable header's content is a real `<button>` (the ARIA APG "sortable columns"
        // pattern) rather than a click handler on the `<th>` itself - a `<th>` isn't natively
        // focusable/activatable, so without this a keyboard user would have no way to sort
        // at all. An unsortable column just renders the same content as a plain `<span>`.
        const headerContent = <span class="vtd-data-table-header-content">
            {column.header}
            {sortDirection ? <span class="vtd-data-table-sort-indicator" aria-hidden="true">{sortDirection == "asc" ? "▲" : "▼"}</span> : null}
        </span>
        const thElement: HTMLTableCellElement = <th
            class={`${column.align ? `vtd-data-table-align-${column.align}` : ""}${sortable ? " vtd-data-table-sortable" : ""}`}
            aria-sort={sortDirection ? (sortDirection == "asc" ? "ascending" : "descending") : undefined}>
            {sortable
                ? <button type="button" class="vtd-data-table-sort-button" onClick={() => options.onSort(column)}>{headerContent}</button>
                : headerContent}
            {(column.resizable ?? true) && options.resizableColumns
                ? <span class="vtd-data-table-resize-handle" onPointerDown={(event: PointerEvent) => options.onResizeStart(column, thElement, event)}/>
                : null}
        </th>
        return thElement
    })
}

export type DataTableBodyOptions<RowType> = {
    rows: RowType[]
    columns: DataTableColumnBase<RowType>[]
    /** The active search text, used only to highlight matches in plain-text cells */
    searchQuery: string
    rowHref?: (row: RowType) => string | undefined
    rowHrefSpa?: boolean
    onRowSelect?: (row: RowType) => void
}

/** Builds the `<tr>` rows for the body */
export function buildBodyRows<RowType>(options: DataTableBodyOptions<RowType>): HTMLTableRowElement[] {
    const searchQuery = options.searchQuery.trim()
    return options.rows.map(row => {
        const href = options.rowHref?.(row)
        const useButton = !href && !!options.onRowSelect
        return <tr>
            {options.columns.map((column, colIndex) => {
                const rawCellContent = column.render(row)
                // Only a column whose rendered value is plain text can be safely searched
                // through character-by-character - `column.render` is free to return
                // arbitrary consumer content (another component, nested markup, ...), which
                // there's no safe way to splice a <mark> into without knowing its structure.
                const cellContent = searchQuery && (typeof rawCellContent == "string" || typeof rawCellContent == "number" || typeof rawCellContent == "bigint")
                    ? highlightMatch(String(rawCellContent), searchQuery)
                    : rawCellContent
                const cellClass = column.align ? `vtd-data-table-align-${column.align}` : ""
                if (colIndex != 0 || (!href && !useButton)) {
                    return <td class={cellClass}>{cellContent}</td>
                }
                return <td class={cellClass}>
                    {href
                        ? <a
                            class="vtd-data-table-row-link"
                            href={href}
                            onClick={options.rowHrefSpa ? (event: MouseEvent) => {
                                // Only a plain left-click routes client-side. A modified click
                                // (new tab/window, download, or any non-primary button) is left
                                // to the browser, which is the whole point of keeping a real
                                // <a href> here rather than a JS-only handler.
                                if (event.defaultPrevented || event.button != 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {return}
                                event.preventDefault()
                                History.changeLocation(href)
                            } : undefined}>{cellContent}</a>
                        : <button type="button" class="vtd-data-table-row-link vtd-data-table-row-link-button" onClick={() => options.onRowSelect?.(row)}>{cellContent}</button>}
                </td>
            })}
        </tr>
    })
}

/** A full-width row spanning every column - the empty, loading and error states all use one */
export function buildStatusRow(colspan: number, content: RenderableElements): HTMLTableRowElement {
    return <tr><td class="vtd-data-table-empty" colspan={colspan}>{content}</td></tr>
}

/**
 * The three fields the column menu actually reads.
 *
 * Deliberately not `DataTableColumnBase<RowType>`: the menu never touches a row, so taking the
 * generic here would make `ColumnMenu` generic for no reason - and a generic *constructor* on a
 * non-generic class produces a `RowType` unrelated to the caller's, which is a confusing
 * "two different types with this name exist" error rather than a useful one. Both tables' column
 * types are structurally assignable to this.
 */
export type ColumnMenuEntry = {
    key: string
    header: RenderableElements
    hideable?: boolean
}

/**
 * The "Columns" button and its panel, owning its own open/closed state.
 *
 * A class rather than a function because of the outside-click listener: it has to be added and
 * removed with the host component's lifecycle, and `removeEventListener` only matches the *same*
 * function reference, so the handler is a field rather than a fresh closure (see CLAUDE.md's
 * `Component` class notes). Both tables embed one and forward `mount`/`unmount` to it.
 */
export class ColumnMenu {
    readonly element: HTMLDivElement
    #panelEl: HTMLDivElement
    #open = false

    #handleDocumentClick = (event: MouseEvent) => {
        if (!this.#open) {
            return
        }
        if (event.target instanceof Node && this.element.contains(event.target)) {
            return
        }
        this.#open = false
        this.#panelEl.classList.remove("vtd-data-table-column-menu-open")
    }

    constructor(
        columns: ColumnMenuEntry[],
        onToggle: (key: string) => void,
        buttonChildren: RenderableElements,
        /** Accessible name for the button - needed because its default content is a bare symbol */
        buttonLabel: string | undefined
    ) {
        this.#panelEl = <div class="vtd-data-table-column-menu">
            {columns.map(column => column.hideable === false
                ? <Checkbox checked disabled>{column.header}</Checkbox>
                : <Checkbox checked onChange={() => onToggle(column.key)}>{column.header}</Checkbox>)}
        </div>
        const panelEl = this.#panelEl
        this.element = <div class="vtd-data-table-column-menu-wrapper">
            <Button type="secondary" ariaLabel={buttonLabel} onClick={() => {
                this.#open = !this.#open
                panelEl.classList.toggle("vtd-data-table-column-menu-open", this.#open)
            }}>{buttonChildren}</Button>
            {panelEl}
        </div>
    }

    attach(): void {
        document.addEventListener("click", this.#handleDocumentClick)
    }
    detach(): void {
        document.removeEventListener("click", this.#handleDocumentClick)
    }
}

/**
 * Starts a column-resize drag from `column`'s trailing-edge handle.
 *
 * Reads the starting width from `thElement` (a real rendered box) rather than `colElement` - a
 * `<col>` is a layout hint, not a painted box, and its own `getBoundingClientRect()` isn't
 * reliable - and tracks the live width in a local variable through the drag rather than
 * re-reading from either element, handing that same tracked value back on pointerup.
 */
export function startColumnResize<RowType>(
    column: DataTableColumnBase<RowType>,
    colElement: HTMLTableColElement,
    thElement: HTMLTableCellElement,
    event: PointerEvent,
    commit: (width: number) => void
): void {
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
        commit(currentWidth)
        document.removeEventListener("pointermove", handleMove)
        document.removeEventListener("pointerup", handleUp)
    }
    document.addEventListener("pointermove", handleMove)
    document.addEventListener("pointerup", handleUp)
}
