/**
 * The package's spacing scale, shared by `Stack` and `Grid`.
 *
 * **In `em`, not `px`**, for the same reason every other size in this package is: a gap that
 * doesn't scale with its container's type is wrong the moment a consumer scales their typography,
 * and a layout of fixed pixel gaps around relative text drifts apart at both extremes.
 *
 * Six steps rather than a continuum: a scale exists so that two components spaced "the same" are
 * spaced identically, and any component can take a raw CSS length when it genuinely needs one.
 */
export type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl"

const SCALE: Record<GapSize, string> = {
    none: "0",
    xs: "0.25em",
    sm: "0.5em",
    md: "0.75em",
    lg: "1.25em",
    xl: "2em"
}

/** Resolves a gap to a CSS length - a scale step, or a raw length passed straight through */
export function resolveGap(gap: GapSize | string | undefined, fallback: GapSize = "md"): string {
    if (gap === undefined) {
        return SCALE[fallback]
    }
    return (SCALE as Record<string, string>)[gap] ?? gap
}

/** How items line up across the container's cross axis */
export type AlignItems = "start" | "center" | "end" | "stretch" | "baseline"
/** How items are distributed along the container's main axis */
export type JustifyContent = "start" | "center" | "end" | "between" | "around"

/** CSS values for the shorthand alignment names, which read better than the flexbox spellings */
export function cssAlign(align: AlignItems | undefined): string | undefined {
    if (align === undefined) {
        return undefined
    }
    return align === "start" || align === "end" ? `flex-${align}` : align
}

export function cssJustify(justify: JustifyContent | undefined): string | undefined {
    if (justify === undefined) {
        return undefined
    }
    if (justify === "between" || justify === "around") {
        return `space-${justify}`
    }
    return justify === "start" || justify === "end" ? `flex-${justify}` : justify
}
