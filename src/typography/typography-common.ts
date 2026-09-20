import {} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"

/**
 * Shared internals for `Heading`, `Text` and `Paragraph`.
 *
 * Not exported from `index.ts` - the three components and `TextType` are the public surface.
 */

/**
 * Semantic colour for a piece of text.
 *
 * Unset is the page's own body colour, which is the right answer most of the time; these are for
 * text that means something beyond its content.
 */
export type TextType = "muted" | "primary" | "secondary" | "warning" | "danger"

let areTypographyStylesMounted = false

/**
 * Mounts the stylesheet the three typography components share, once.
 *
 * One key for the category, matching `DataTable`/`AsyncDataTable` and the charts: a heading and a
 * paragraph that disagree about line height are worse than either being wrong on its own.
 */
export function mountTypographyStyles(): void {
    if (areTypographyStylesMounted) {
        return
    }
    areTypographyStylesMounted = true
    mountStyles(`
/*
 * WARNING: muted is var(--background-6), NOT var(--text-alt). Despite the name, --text-alt is the
 * *inverse* text colour - in dark mode it is the light theme's near-black - so muted text styled
 * with it comes out nearly invisible against the page it sits on. --background-N mixes N0% from
 * the page background toward its contrast colour, which makes -6 a real muted foreground in both
 * themes. This is the single trap this component exists to stop every consumer rediscovering.
 */
.vtd-text-muted{color:var(--background-6);}
.vtd-text-primary{color:var(--primary);}
.vtd-text-secondary{color:var(--secondary);}
.vtd-text-warning{color:var(--warning);}
.vtd-text-danger{color:var(--accent);}

.vtd-heading{
margin-block:0.6em 0.4em;
line-height:1.25;
/* Headings are short and read better without one word stranded on its own line */
text-wrap:balance;
}
/* First heading in a block shouldn't push its container open */
.vtd-heading:first-child{margin-block-start:0;}
.vtd-heading-1{font-size:2em;}
.vtd-heading-2{font-size:1.5em;}
.vtd-heading-3{font-size:1.25em;}
.vtd-heading-4{font-size:1.1em;}
.vtd-heading-5{font-size:1em;}
.vtd-heading-6{font-size:0.9em;text-transform:uppercase;letter-spacing:0.05em;}

.vtd-paragraph{margin-block:0 0.75em;line-height:1.55;}
.vtd-paragraph:last-child{margin-block-end:0;}

.vtd-text-strong{font-weight:bold;}
.vtd-text-italic{font-style:italic;}
.vtd-text-underline{text-decoration:underline;}
.vtd-text-strike{text-decoration:line-through;}
/* Tabular figures, so columns of numbers line up and a changing value doesn't shift its neighbours */
.vtd-text-numeric{font-variant-numeric:tabular-nums;}
.vtd-text-code{
font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
font-size:0.9em;
background-color:var(--background-1);
padding:0.1em 0.35em;
border-radius:0.2rem;
}
`, "vtd/Typography", "base")
}

/** Builds the class list for a piece of text from its semantic type and modifiers */
export function textClasses(
    base: string,
    type: TextType | undefined,
    modifiers?: {strong?: boolean, italic?: boolean, underline?: boolean, strike?: boolean, numeric?: boolean}
): string {
    const classes = [base]
    if (type) {
        classes.push(`vtd-text-${type}`)
    }
    if (modifiers?.strong) {
        classes.push("vtd-text-strong")
    }
    if (modifiers?.italic) {
        classes.push("vtd-text-italic")
    }
    if (modifiers?.underline) {
        classes.push("vtd-text-underline")
    }
    if (modifiers?.strike) {
        classes.push("vtd-text-strike")
    }
    if (modifiers?.numeric) {
        classes.push("vtd-text-numeric")
    }
    return classes.join(" ")
}
