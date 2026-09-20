import {
    AlertThemeOptions, BreadcrumbsThemeOptions, ButtonThemeOptions, ChartThemeOptions, MenuThemeOptions,
    CommonThemeOptions, DataTableThemeOptions, DrawerThemeOptions, EmptyThemeOptions,
    ModalThemeOptions, PaginationThemeOptions, PopconfirmThemeOptions, resetThemeOptions,
    TagThemeOptions, TextFormFieldThemeOptions, ToastThemeOptions,
} from "../../../src/index.ts"
import type { ThemeSymbol } from "../../../src/index.ts"

/**
 * Every overridable glyph the package exposes, so the theme builder can edit them and `main.tsx`
 * can re-apply the result at boot.
 *
 * These are plain mutable objects rather than CSS, which is the whole reason they need their own
 * treatment: a colour is a custom property the browser re-resolves, but a symbol is read when a
 * component is *built*. The package's contract is therefore "set them at startup, before the first
 * component exists" - it has no subscription machinery and deliberately never re-renders anything.
 * Everything here that makes an edit visible mid-session (re-applying at boot, re-rendering the
 * page on a change) is the *builder's* job, and lives in the showcase for that reason.
 */
export type SymbolOption = {
    /** The exported object holding it, e.g. `"PaginationThemeOptions"` */
    owner: string
    /** The field on that object, e.g. `"prevSymbol"` */
    field: string
    /**
     * Whether this field falls back to `CommonThemeOptions` while nothing is assigned.
     *
     * There is no separate "which shared field" here on purpose: a delegating field is named
     * exactly after the shared field it delegates to, so the two can never drift apart or be
     * wired to the wrong one. `TagThemeOptions.closeSymbol` follows `CommonThemeOptions.closeSymbol`
     * and could not be made to follow anything else by editing this table.
     */
    inherits?: boolean
    /** What it renders by default, for the input's placeholder - prose where it is not a glyph */
    fallback: string
}

/** The live objects, keyed by the names the docs use */
const owners: Record<string, Record<string, ThemeSymbol>> = {
    CommonThemeOptions: CommonThemeOptions as unknown as Record<string, ThemeSymbol>,
    ButtonThemeOptions: ButtonThemeOptions as unknown as Record<string, ThemeSymbol>,
    AlertThemeOptions: AlertThemeOptions as unknown as Record<string, ThemeSymbol>,
    ToastThemeOptions: ToastThemeOptions as unknown as Record<string, ThemeSymbol>,
    EmptyThemeOptions: EmptyThemeOptions as unknown as Record<string, ThemeSymbol>,
    TagThemeOptions: TagThemeOptions as unknown as Record<string, ThemeSymbol>,
    BreadcrumbsThemeOptions: BreadcrumbsThemeOptions as unknown as Record<string, ThemeSymbol>,
    PaginationThemeOptions: PaginationThemeOptions as unknown as Record<string, ThemeSymbol>,
    ModalThemeOptions: ModalThemeOptions as unknown as Record<string, ThemeSymbol>,
    DrawerThemeOptions: DrawerThemeOptions as unknown as Record<string, ThemeSymbol>,
    MenuThemeOptions: MenuThemeOptions as unknown as Record<string, ThemeSymbol>,
    PopconfirmThemeOptions: PopconfirmThemeOptions as unknown as Record<string, ThemeSymbol>,
    TextFormFieldThemeOptions: TextFormFieldThemeOptions as unknown as Record<string, ThemeSymbol>,
    DataTableThemeOptions: DataTableThemeOptions as unknown as Record<string, ThemeSymbol>,
    ChartThemeOptions: ChartThemeOptions as unknown as Record<string, ThemeSymbol>,
}

/**
 * The shared symbols, listed first because setting one of these is almost always what a consumer
 * actually wants - a per-component box below is for the exception.
 */
export const commonSymbolOptions: SymbolOption[] = [
    {owner: "CommonThemeOptions", field: "closeSymbol", fallback: "x"},
    {owner: "CommonThemeOptions", field: "cancelSymbol", fallback: "✕"},
    {owner: "CommonThemeOptions", field: "confirmSymbol", fallback: "✓"},
    {owner: "CommonThemeOptions", field: "emptySymbol", fallback: "∅"},
    {owner: "CommonThemeOptions", field: "collapseSymbol", fallback: "…"},
    {owner: "CommonThemeOptions", field: "prevSymbol", fallback: "‹"},
    {owner: "CommonThemeOptions", field: "nextSymbol", fallback: "›"},
]

/**
 * The per-component symbols. Anything marked `inherits` shows the shared value until it is
 * given one of its own; the rest are glyphs only one component draws.
 *
 * `ChartThemeOptions.seriesColors` is deliberately absent: it is an array of colours rather than a
 * piece of content, and a text box is the wrong control for it. It is documented on the chart
 * pages all the same.
 */
export const componentSymbolOptions: SymbolOption[] = [
    {owner: "ButtonThemeOptions", field: "loadingSymbol", fallback: "a Spinner component"},
    {owner: "AlertThemeOptions", field: "closeSymbol", inherits: true, fallback: "x"},
    {owner: "ToastThemeOptions", field: "closeSymbol", inherits: true, fallback: "x"},
    {owner: "EmptyThemeOptions", field: "emptySymbol", fallback: "the shared empty symbol, in a sized span"},
    {owner: "TagThemeOptions", field: "closeSymbol", inherits: true, fallback: "x"},
    {owner: "BreadcrumbsThemeOptions", field: "collapseSymbol", inherits: true, fallback: "…"},
    {owner: "PaginationThemeOptions", field: "prevSymbol", inherits: true, fallback: "‹"},
    {owner: "PaginationThemeOptions", field: "nextSymbol", inherits: true, fallback: "›"},
    {owner: "ModalThemeOptions", field: "closeSymbol", inherits: true, fallback: "x"},
    {owner: "ModalThemeOptions", field: "cancelSymbol", inherits: true, fallback: "✕"},
    {owner: "DrawerThemeOptions", field: "closeSymbol", inherits: true, fallback: "x"},
    {owner: "MenuThemeOptions", field: "confirmSymbol", inherits: true, fallback: "✓"},
    {owner: "PopconfirmThemeOptions", field: "confirmSymbol", inherits: true, fallback: "✓"},
    {owner: "PopconfirmThemeOptions", field: "cancelSymbol", inherits: true, fallback: "✕"},
    {owner: "TextFormFieldThemeOptions", field: "confirmSymbol", inherits: true, fallback: "✓"},
    {owner: "TextFormFieldThemeOptions", field: "cancelSymbol", inherits: true, fallback: "✕"},
    {owner: "TextFormFieldThemeOptions", field: "editSymbol", fallback: "✎"},
    {owner: "DataTableThemeOptions", field: "columnsSymbol", fallback: "▥"},
    {owner: "DataTableThemeOptions", field: "emptySymbol", fallback: "the shared empty symbol, in a sized span"},
    {owner: "ChartThemeOptions", field: "emptySymbol", inherits: true, fallback: "∅"},
]

/** Every editable symbol, shared ones first */
export const symbolOptions: SymbolOption[] = [...commonSymbolOptions, ...componentSymbolOptions]

export function symbolKey(option: SymbolOption): string {
    return `${option.owner}.${option.field}`
}

/**
 * What a field renders while nothing is assigned to it: the shared symbol's current value if it
 * inherits one, otherwise its own package default.
 */
export function effectiveFallback(option: SymbolOption, overrides: Record<string, string>): string {
    if (!option.inherits) {
        return option.fallback
    }
    return overrides[`CommonThemeOptions.${option.field}`] || option.fallback
}

const storageKey = "vtd-showcase-theme-symbols"

/** Reads the persisted symbol overrides, if any */
export function loadSavedSymbols(): Record<string, string> {
    try {
        const raw = localStorage.getItem(storageKey)
        return raw ? JSON.parse(raw) as Record<string, string> : {}
    } catch {
        return {}
    }
}

function saveSymbols(overrides: Record<string, string>) {
    try {
        if (Object.keys(overrides).length == 0) {
            localStorage.removeItem(storageKey)
        } else {
            localStorage.setItem(storageKey, JSON.stringify(overrides))
        }
    } catch { /* private browsing with storage disabled - the live preview still works */ }
}

/**
 * Applies a set of overrides to the live objects, restoring the package default for anything not
 * named.
 *
 * `resetThemeOptions` comes first so that clearing a box puts the original back rather than
 * leaving the previous override in place - the package remembers its own defaults behind each
 * field's accessor, which is the one thing a caller cannot reconstruct once a field is assigned
 * over.
 */
export function applySymbols(overrides: Record<string, string>): void {
    for (const owner of Object.values(owners)) {
        resetThemeOptions(owner)
    }
    for (const option of symbolOptions) {
        const value = overrides[symbolKey(option)]
        if (value) {
            owners[option.owner][option.field] = function(){return value}
        }
    }
}

/** Applies and persists in one step - what the builder calls on every edit */
export function setSymbols(overrides: Record<string, string>): void {
    applySymbols(overrides)
    saveSymbols(overrides)
}

/** The assignments needed to reproduce these overrides, for the copied theme code */
export function symbolCode(overrides: Record<string, string>): string[] {
    return Object.entries(overrides)
        .filter(([, value]) => value)
        .map(([key, value]) => `${key} = () => ${JSON.stringify(value)}`)
}
