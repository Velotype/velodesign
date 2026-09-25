import { Icon, registerIcon } from "@velotype/velodesign"

/**
 * One icon per component category, for the sidebar.
 *
 * Drawn here rather than pulled from an icon set: velodesign has no runtime dependencies and this
 * is the showcase demonstrating `registerIcon`, which is the mechanism a consumer would use. Each
 * is a single path in a 24x24 box, because that is all `Icon` carries - `I` builds one `<path>`
 * with `fill="currentcolor"`, so every glyph is a solid silhouette and inherits its colour from
 * the row it sits in.
 *
 * Solid silhouettes also sidestep fill-rule trouble: a shape with a hole needs its inner subpath
 * wound the opposite way to punch through under `nonzero`, which is easy to get subtly wrong and
 * renders as a filled blob when it is.
 */
const categoryIcons: Record<string, string> = {
    // Three text lines, longest first - a paragraph
    "Typography": "M3 4.5h18v3H3zM3 10.5h18v3H3zM3 16.5h12v3H3z",
    // A sidebar column beside two stacked panels
    "Layout": "M3 3h6.5v18H3zM12 3h9v7.5h-9zM12 13.5h9V21h-9z",
    // A filled input, a checkbox and its label
    "Form": "M3 4h18v4.5H3zM3 12h6.5v7H3zM12 14h9v3h-9z",
    // A paper plane, for going somewhere
    "Navigation": "M21.5 2.5L2.5 10.2l7.2 3.1 3.1 7.2z",
    // A speech bubble with its tail at the lower left
    "Feedback": "M3 3.5h18v12.5H8.5L3 21z",
    // A dialog inside a viewport frame: four bars for the frame, one panel inside
    "Overlays": "M2 3h20v2H2zM2 19h20v2H2zM2 5h2v14H2zM20 5h2v14h-2zM7 8h10v8H7z",
    // A table: header band, then four cells
    "Data Display": "M3 4h18v4H3zM3 9.5h8v4.5H3zM13 9.5h8v4.5h-8zM3 15.5h8V20H3zM13 15.5h8V20h-8z",
    // Three ascending bars
    "Charts": "M3 13h4.5v8H3zM9.75 7.5h4.5V21h-4.5zM16.5 3h4.5v18h-4.5z",
    // A pencil, nib at the lower left
    "Data Entry": "M3.5 20.5l1.2-4.4L15.9 4.9l3.2 3.2L7.9 19.3z",
    // Not a category: the magnifier that stands in for the search box on the collapsed rail
    "Search": "M10.5 2a8.5 8.5 0 105.2 15.2l4.6 4.6 2.1-2.1-4.6-4.6A8.5 8.5 0 0010.5 2zm0 3a5.5 5.5 0 110 11 5.5 5.5 0 010-11z",
    /*
     * Not a category either: a paint droplet, for the theme builder's own row.
     *
     * A paint roller was tried first and is the more specific metaphor, but not at this size: a
     * roller is a head, an arm and a grip, and as a flat silhouette in 24px those separate into
     * three unrelated blocks with nothing joining them. The droplet is one closed shape, so it
     * survives being small - and it does not collide with Typography's three lines the way a
     * stack of colour swatches would.
     */
    "Theme": "M12 2C8 8 6 11 6 14a6 6 0 0 0 12 0c0-3-2-6-6-12z",
    // Nor this: a house, for the home page as a search result
    "Home": "M12 2.5L1.5 11h3V21h5v-6h5v6h5V11h3z",
}

let areCategoryIconsRegistered = false

/** The key `<I i={...}/>` renders a category's icon under */
export function categoryIconKey(group: string): string {
    return `showcase-category-${group.toLowerCase().replace(/ /g, "-")}`
}

/** Registers every category icon once, before anything renders one */
export function registerCategoryIcons(): void {
    if (areCategoryIconsRegistered) {
        return
    }
    areCategoryIconsRegistered = true
    for (const group of Object.keys(categoryIcons)) {
        registerIcon(categoryIconKey(group), new Icon(24, 24, categoryIcons[group]))
    }
}

/** Every category an icon was drawn for, so a test can check none has been left behind */
export function iconedCategories(): string[] {
    return Object.keys(categoryIcons).filter(key => !["Search", "Theme", "Home"].includes(key))
}

/** The paint roller shown beside the sidebar's Theme builder row */
export const themeIconKey: string = categoryIconKey("Theme")

/** The house shown beside the Home result in the Navbar search */
export const homeIconKey: string = categoryIconKey("Home")

/** The magnifier shown in place of the search box once the sidebar is a rail */
export const searchIconKey: string = categoryIconKey("Search")
