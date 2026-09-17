import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Statistic/>` Component
 */
export type StatisticAttrsType = {
    /** Label shown above the value */
    title: RenderableElements
    /** The value to display */
    value: string | number
    /** Content shown before the value (e.g. a currency symbol) */
    prefix?: RenderableElements
    /** Content shown after the value (e.g. a unit) */
    suffix?: RenderableElements
} & IdAttr & StylePassthroughAttrs

let areStatisticStylesMounted = false

/**
 * A labeled numeric stat tile, for dashboards/KPI summaries
 */
export const Statistic: FunctionComponent<StatisticAttrsType> = function(attrs: StatisticAttrsType, _children: RenderableElements[]): HTMLDivElement {
    if (!areStatisticStylesMounted) {
        areStatisticStylesMounted = true
        setStylesheet(`
.vtd-statistic-title{font-size:0.85em;opacity:0.7;margin-block-end:0.25em;}
.vtd-statistic-value{font-size:1.75em;font-weight:bold;line-height:1.2;}
.vtd-statistic-affix{font-size:0.6em;font-weight:normal;margin-inline:0.15em;}
`, "vtd/Statistic")
    }

    return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-statistic">
        <div class="vtd-statistic-title">{attrs.title}</div>
        <div class="vtd-statistic-value">
            {attrs.prefix && <span class="vtd-statistic-affix">{attrs.prefix}</span>}
            {attrs.value}
            {attrs.suffix && <span class="vtd-statistic-affix">{attrs.suffix}</span>}
        </div>
    </div>, attrs)
}
