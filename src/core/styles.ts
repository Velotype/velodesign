import { setStylesheet } from "@velotype/velotype"

/**
 * Which cascade layer a stylesheet belongs to. They are ordered, and the order is the whole point.
 *
 * - `reset` - the CSS reset. Loses to everything, including a component's own rules.
 * - `theme` - the generated palette. Below components so a component may set a colour directly,
 *   above the reset because the reset is not about colour at all.
 * - `base` - the shared internal modules several components are built out of
 *   (`disclosure-view`, `typography-common`, `chart-common`). A component that builds on one of
 *   these must be able to override it without reaching for specificity.
 * - `component` - a component's own rules. Where nearly everything lives.
 * - `composite` - a component that styles *another* component's classes, which it must win:
 *   `Sidebar` over `Tree` and `Menu`, `CalendarRange` over `Calendar`, `ButtonGroup` over `Button`,
 *   `DataTable`'s view over `TextBox`.
 */
export type StyleLayer = "reset" | "theme" | "base" | "component" | "composite"

const layerOrder = "@layer velodesign.reset,velodesign.theme,velodesign.base,velodesign.component,velodesign.composite;"

let isLayerOrderDeclared = false

/**
 * Mounts one component's stylesheet inside velodesign's cascade layer.
 *
 * **Every stylesheet this package ships goes through here, and none calls `setStylesheet`
 * directly.** That is what makes the cascade deterministic, and it fixes a whole class of bug
 * rather than one instance of it.
 *
 * `setStylesheet` pushes each sheet onto `document.adoptedStyleSheets`, so the cascade order is the
 * order the sheets were *attached* - and a component's sheet is attached when that component is
 * first constructed. Which component gets constructed first depends on which page the reader
 * happens to land on and how they navigated to it, so two rules of equal specificity could resolve
 * one way on a cold load and the other way after a click, with no code change between them.
 * Measured on the showcase: `.vtd-showcase-example-code` was attached 5th and `.vtd-code-block`
 * 10th on a direct load, and 39th against 11th when the same page was reached through a category
 * page - so the example's code block had square corners on one path and round ones on the other.
 *
 * A layer settles it without anyone having to win a specificity race. Everything velodesign ships
 * is inside `velodesign.*`; **an unlayered rule beats a layered one whatever its specificity and
 * whatever the source order**, so a consumer's own CSS always wins - which is the relationship a
 * component library wants anyway, and previously depended on luck. Inside the package the sub-layers
 * above give the same guarantee between a component and the shared module it is built from.
 *
 * The layer *order* is declared once, from this module, before any sheet is attached: layer
 * precedence otherwise follows first appearance, which would put us right back to depending on
 * construction order. Every component imports this module, so it is evaluated first.
 */
export function mountStyles(cssText: string, key: string, layer: StyleLayer = "component", resetSheet: boolean = false): void {
    if (!isLayerOrderDeclared) {
        isLayerOrderDeclared = true
        setStylesheet(layerOrder, "vtd/LayerOrder")
        mountFocusRing()
    }
    setStylesheet(`@layer velodesign.${layer}{${cssText}}`, key, resetSheet)
}

/**
 * One focus ring, for every control in the package.
 *
 * It used to be per component, and twenty-two components had written their own: rings of 1px and
 * 2px, offsets of 0, 1 and 2, some drawn as an outline and some as a border colour change, five
 * that turned the outline off and showed a faint background instead, and `Button` - the most-used
 * control here - marking focus with a **red `--accent` border**. Most of the rest set no outline at
 * all and inherited the browser's, which is a different colour in every engine and changes with the
 * page's `color-scheme`. Measured by tabbing every gallery page: 22 distinct treatments across 55
 * kinds of control.
 *
 * A focus ring is not a component's decision. It is one of the few things in an interface that has
 * to look identical everywhere, because its whole job is to answer "where am I" at a glance, and a
 * reader who has to learn a new answer per control has been given nothing. So it lives here, once,
 * and a component only overrides it when the element that takes focus is not the element that
 * should show it.
 *
 * Choices worth keeping:
 *
 * - **`--primary-7`, not `--primary`.** The ring has to read against the control it surrounds, and
 *   a primary-coloured ring around a primary-filled button is nearly invisible. The `-7` step is
 *   darker than the mid colour in light mode and lighter in dark, so it separates from a fill of
 *   the same hue in both.
 * - **2px, offset 2px.** One pixel disappears against a border of the same weight, and an offset of
 *   zero reads as a thicker border rather than as a ring. The gap also lets whatever is behind the
 *   control show through, which is what keeps the ring legible on a filled surface.
 * - **`outline`, never `border` or `box-shadow`.** An outline takes no space, so nothing moves when
 *   it appears - a border change shifts layout unless the border was already there at the same
 *   width, and a box-shadow would have to be restated by every component that already has one.
 *   An outline also follows the element's own `border-radius`, so a round control gets a round ring
 *   for free.
 *
 * Mounted in the `base` layer, so a component that genuinely needs something else - a menu row,
 * whose focus is a filled row rather than a ring - overrides it from `component` without a
 * specificity fight.
 */
function mountFocusRing(): void {
    setStylesheet(`@layer velodesign.base{
/*
 * Everything this package renders carries a vtd- class, and nothing else does, so this reaches
 * every control without each one opting in - which is the point: a control added tomorrow gets the
 * ring without anyone remembering to ask for it.
 */
[class^="vtd-"]:focus-visible,[class*=" vtd-"]:focus-visible{
outline:2px solid var(--primary-7);
outline-offset:2px;
}
}`, "vtd/FocusRing")
}
