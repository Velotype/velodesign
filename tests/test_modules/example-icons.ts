// By package name, like explorer-schema.tsx: the showcase holds "@velotype/velodesign" out of its
// bundle, and a relative path would inline a second copy of the library
import { Icon, registerIcon } from "@velotype/velodesign"

/**
 * The icons the examples register and draw - the Icon gallery, the Sidebar example's entries, a
 * button with an icon in it. Line drawings in the package's glyph style (a 24-unit box, round ends,
 * a 2-unit line), each reviewed before use, rather than drawings taken from an icon set. The showcase
 * reaches them through the explorer schema, so one copy serves every page that shows them.
 */
export const exampleIcons: Record<string, Icon> = {
    // A gear with six broad teeth
    settings: new Icon(24, 24, "M9.96 5.93L10.13 3.20L13.87 3.20L14.04 5.93A6.4 6.4 0 0 1 16.23 7.20L18.69 5.98L20.56 9.22L18.27 10.73A6.4 6.4 0 0 1 18.27 13.27L20.56 14.78L18.69 18.02L16.23 16.80A6.4 6.4 0 0 1 14.04 18.07L13.87 20.80L10.13 20.80L9.96 18.07A6.4 6.4 0 0 1 7.77 16.80L5.31 18.02L3.44 14.78L5.73 13.27A6.4 6.4 0 0 1 5.73 10.73L3.44 9.22L5.31 5.98L7.77 7.20A6.4 6.4 0 0 1 9.96 5.93zM14.8 12a2.8 2.8 0 1 1 -5.6 0a2.8 2.8 0 1 1 5.6 0z", 2),
    // A page with its corner folded, and two lines of text
    reports: new Icon(24, 24, "M6 3.5h8l4.5 4.5v12.5H6zM14 3.5V8h4.5M9 12.5h6M9 16h6", 2),
    // Two people, one behind the other
    people: new Icon(24, 24, "M12 8a3 3 0 1 1-6 0 3 3 0 1 1 6 0zM3.5 19.5a5.5 5.5 0 0 1 11 0M19 9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0zM16.5 14a4.5 4.5 0 0 1 4 5.5", 2),
}

let areExampleIconsRegistered = false

/** Registers every example icon under its key, once, so `<I i="settings"/>` and the rest can draw it */
export function registerExampleIcons(): void {
    if (areExampleIconsRegistered) {
        return
    }
    areExampleIconsRegistered = true
    for (const [key, icon] of Object.entries(exampleIcons)) {
        registerIcon(key, icon)
    }
}
