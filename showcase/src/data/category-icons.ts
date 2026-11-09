import { Glyphs, Icon, registerIcon } from "@velotype/velodesign"

/**
 * One icon per component category, for the sidebar and the home page.
 *
 * Line drawings in the package's glyph style - a 24-unit box, round ends, a 2-unit line, in the
 * row's colour - each reviewed before use, and drawn here rather than taken from an icon set:
 * velodesign has no runtime dependencies, and this is the showcase demonstrating `registerIcon`, the
 * mechanism a consumer would use. Data Entry is the package's own pencil, `Glyphs.pencil`.
 */
const categoryIcons: Record<string, Icon> = {
    // Aa: a capital and a small letter
    "Typography": new Icon(24, 24, "M3.5 18.5l5-13 5 13M5.4 13.5h6.2M20.5 13v5.5M20.5 15.75a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 1 1 5.5 0z", 2),
    // A column beside two stacked panels
    "Layout": new Icon(24, 24, "M5 3.5h2.5a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1 -1.5 1.5h-2.5a1.5 1.5 0 0 1 -1.5 -1.5v-14a1.5 1.5 0 0 1 1.5 -1.5zM14 3.5h5a1.5 1.5 0 0 1 1.5 1.5v3.75a1.5 1.5 0 0 1 -1.5 1.5h-5a1.5 1.5 0 0 1 -1.5 -1.5v-3.75a1.5 1.5 0 0 1 1.5 -1.5zM14 13.75h5a1.5 1.5 0 0 1 1.5 1.5v3.75a1.5 1.5 0 0 1 -1.5 1.5h-5a1.5 1.5 0 0 1 -1.5 -1.5v-3.75a1.5 1.5 0 0 1 1.5 -1.5z", 2),
    // An input, a checkbox and its label
    "Form": new Icon(24, 24, "M5 4h14a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1 -1.5 1.5h-14a1.5 1.5 0 0 1 -1.5 -1.5v-2a1.5 1.5 0 0 1 1.5 -1.5zM5 13h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1 -1.5 1.5h-3a1.5 1.5 0 0 1 -1.5 -1.5v-3a1.5 1.5 0 0 1 1.5 -1.5zM13 16h7.5", 2),
    // A paper plane, for going somewhere
    "Navigation": new Icon(24, 24, "M20.5 3.5L3.5 10.5l7 2.8 2.8 7.2zM10.5 13.3l10-9.8", 2),
    // A speech bubble with its tail at the lower left, someone typing in it
    "Feedback": new Icon(24, 24, "M3.5 6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5.5 4.5zM8.5 10h0M12 10h0M15.5 10h0", 2),
    // A window with a drawer at its edge
    "Overlays": new Icon(24, 24, "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2zM14 4v16M16.5 8.5h2M16.5 12h2", 2),
    // A card: a picture over a line of text
    "Data Display": new Icon(24, 24, "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2zM3 12h18M6.5 16h8", 2),
    // A pencil
    "Data Entry": Glyphs.pencil,
    // Not a category: the magnifier that stands in for the search box on the collapsed rail. The zoom
    // lens, with a glint thinner than its line as a second layer
    "Search": new Icon(24, 24, "M16.7 10.5a6.2 6.2 0 1 1-12.4 0 6.2 6.2 0 1 1 12.4 0zM15.2 15.2l4.3 4.3", 2, false, [{d: "M7.6 9.4a3.2 3.2 0 0 1 1.9-1.9", strokeWidth: 1.2}]),
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
        registerIcon(categoryIconKey(group), categoryIcons[group])
    }
}

/** Every category an icon was drawn for, so a test can check none has been left behind */
export function iconedCategories(): string[] {
    return Object.keys(categoryIcons).filter(key => key != "Search")
}

/** The magnifier shown in place of the search box once the sidebar is a rail */
export const searchIconKey: string = categoryIconKey("Search")
