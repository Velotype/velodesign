import type { EmptyAttrs, FunctionComponent } from "@velotype/velotype"

/**
 * A piece of overridable theme content - a component taking no attrs, rendered as
 * `<XThemeOptions.field/>` wherever the package needs a small glyph it must not bake an English
 * word or an icon font into.
 */
export type ThemeSymbol = FunctionComponent<EmptyAttrs>

/** Holds each object's "put everything back" closure, off the enumerable surface consumers see */
const clearOverrides = Symbol("velodesign.clearThemeOptionOverrides")

/**
 * Builds a theme-options object.
 *
 * `inherited` maps this component's field names onto {@link CommonThemeOptions} fields; `own` holds
 * the defaults that belong to this component alone. Both kinds end up as ordinary readable,
 * assignable properties - the difference is only what they fall back to while nothing has been
 * assigned.
 *
 * Every field is an accessor rather than plain data, which buys two things for one `defineProperty`
 * per field and nothing at read time beyond the getter call:
 *
 * - an inherited field resolves `CommonThemeOptions` on *every* read, so a consumer can set the
 *   shared symbol at startup and have it reach components whose own module was evaluated long
 *   before; capturing the value at definition time would silently freeze it.
 * - the package default survives being assigned over, so {@link resetThemeOptions} can restore it.
 *   Nothing else can - the original function is simply gone once a plain field is overwritten.
 *
 * Not exported from `index.ts`: this builds the package's own option objects, and a consumer
 * customizes one by assigning to it rather than by building another.
 *
 * Both parameters are wrapped in `NoInfer` so `T` comes from the annotation on the constant being
 * built - `export const AlertThemeOptions: {dismissSymbol: ThemeSymbol} = themeOptions({...})` -
 * rather than from the arguments, which would infer a field type of `unknown` and make the
 * declared shape unassignable. That keeps the per-field doc comments on the declaration, where an
 * editor shows them, instead of forcing a second exported type per component.
 */
export function themeOptions<T extends object>(
    inherited: NoInfer<{[K in keyof T]?: keyof CommonThemeOptionsType}>,
    own?: NoInfer<{[K in keyof T]?: T[K]}>
): T {
    const target = {} as Record<string | symbol, unknown>
    const overrides = new Map<string, unknown>()
    const defaults = new Map<string, () => unknown>()
    for (const [field, commonField] of Object.entries(inherited) as [string, keyof CommonThemeOptionsType][]) {
        defaults.set(field, function(){return CommonThemeOptions[commonField]})
    }
    for (const [field, value] of Object.entries(own ?? {}) as [string, unknown][]) {
        defaults.set(field, function(){return value})
    }
    for (const field of defaults.keys()) {
        Object.defineProperty(target, field, {
            enumerable: true,
            get: function(){
                return overrides.has(field) ? overrides.get(field) : (defaults.get(field) as () => unknown)()
            },
            // Assigning undefined clears the override rather than blanking the field, which is what
            // makes `resetThemeOptions` a one-liner and lets an emptied box in a theme editor mean
            // "back to the default" rather than "render nothing"
            set: function(value: unknown){
                if (value == undefined) {
                    overrides.delete(field)
                } else {
                    overrides.set(field, value)
                }
            }
        })
    }
    Object.defineProperty(target, clearOverrides, {value: function(){overrides.clear()}})
    return target as T
}

/**
 * The symbols more than one component means the same thing by.
 *
 * Five components draw a "close/dismiss/remove this" control and five draw a previous/next pair;
 * before this object each spelled its own, so a consumer swapping the close glyph had to find all
 * five - and four of the five prev/next pairs had the glyph hardcoded with no override at all. A
 * symbol belongs here when two or more components mean the *same* thing by it; a single-use glyph
 * (`DataTableThemeOptions.columnsSymbol`, `TextFormFieldThemeOptions.editSymbol`) stays on its own component,
 * where its name can say what it is.
 *
 * Every per-component field listed against one of these delegates to it *live*, so assigning here
 * reaches every component that has not been given its own override:
 *
 * ```ts
 * CommonThemeOptions.closeSymbol = () => <MyIcon name="close"/>        // Alert, Toast, Tag, Modal, Drawer
 * ModalThemeOptions.closeSymbol = () => <MyIcon name="window-close"/>  // Modal alone, from now on
 * ```
 */
export type CommonThemeOptionsType = {
    /** Dismisses or removes the thing it sits on - `Alert`, `Toast`, `Tag`, `Modal`, `Drawer` */
    closeSymbol: ThemeSymbol
    /** Rejects a pending action - `Modal`'s footer, `Popconfirm`, an in-progress inline edit */
    cancelSymbol: ThemeSymbol
    /** Accepts a pending action, or marks one already done - `Popconfirm`, an inline edit, a completed `Steps` step */
    confirmSymbol: ThemeSymbol
    /** Stands in for content that isn't there - `Empty`, both tables, every chart */
    emptySymbol: ThemeSymbol
    /** Marks items omitted from a sequence - `Breadcrumbs`' expander, `Pagination`'s gap */
    collapseSymbol: ThemeSymbol
    /** Steps one back through a sequence - `Pagination`, both calendars, `Carousel`, `AsyncDataTable` */
    prevSymbol: ThemeSymbol
    /** Steps one forward through a sequence - the same five */
    nextSymbol: ThemeSymbol
}

/**
 * The package's shared symbols. See {@link CommonThemeOptionsType} for what each one means and
 * which components read it.
 *
 * **Assign to these once at startup, before the first component is built.** A symbol is a field on
 * a plain object read at *build* time, not a CSS custom property the browser re-resolves - so an
 * override reaches the components constructed after it and no others. There is deliberately no
 * subscription, no invalidation and no re-render anywhere in this package: a library that watched
 * these would make every consumer pay for a feature almost none of them use. A consumer who
 * genuinely needs to swap symbols mid-session re-renders the affected subtree themselves, which is
 * exactly what the showcase's theme builder does.
 */
export const CommonThemeOptions: CommonThemeOptionsType = themeOptions<CommonThemeOptionsType>({}, {
    closeSymbol: function(){return "x"},
    cancelSymbol: function(){return "✕"},
    confirmSymbol: function(){return "✓"},
    emptySymbol: function(){return "∅"},
    collapseSymbol: function(){return "…"},
    prevSymbol: function(){return "‹"},
    nextSymbol: function(){return "›"}
})

/**
 * Puts theme options back to what the package ships - all of them, or just the named fields.
 *
 * Meant for a theme editor's reset and for a test that has to undo an override; an application
 * setting its symbols once at startup never needs it. Works on {@link CommonThemeOptions} too, and
 * resetting a shared symbol there is immediately visible through every field that inherits it.
 */
export function resetThemeOptions(options: object, ...fields: string[]): void {
    const target = options as Record<string | symbol, unknown>
    if (fields.length > 0) {
        for (const field of fields) { target[field] = undefined }
    } else {
        (target[clearOverrides] as () => void)()
    }
}
