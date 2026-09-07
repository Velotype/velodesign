import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single entry in a `<Timeline/>`
 */
export type TimelineItemType = {
    /** Unique key identifying this entry */
    key: string
    /** Main content for this entry */
    title: RenderableElements
    /** Optional smaller supporting text below the title */
    description?: RenderableElements
    /** Color of this entry's dot marker (default: `"primary"`) */
    type?: "primary" | "secondary" | "warning" | "danger" | "neutral"
}

/**
 * Attrs type for `<Timeline/>` Component
 */
export type TimelineAttrsType = {
    /** The set of entries to show, in order from first to last */
    items: TimelineItemType[]
} & IdAttr & StylePassthroughAttrs

let areTimelineStylesMounted = false

/**
 * A vertical list of dated/ordered events, each with a dot marker on a connecting line
 */
export const Timeline: FunctionComponent<TimelineAttrsType> = function(attrs: TimelineAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areTimelineStylesMounted) {
        areTimelineStylesMounted = true
        setStylesheet(`
.vtd-timeline{list-style:none;padding:0;margin:0;}
.vtd-timeline-item{
position:relative;
display:flex;
gap:0.75em;
padding-block-end:1.25em;
padding-inline-start:0.1em;
}
.vtd-timeline-item:last-child{padding-block-end:0;}
.vtd-timeline-marker{
position:relative;
flex-shrink:0;
width:0.75em;
display:flex;
justify-content:center;
}
.vtd-timeline-dot{
width:0.75em;
height:0.75em;
border-radius:50%;
margin-block-start:0.3em;
z-index:1;
}
.vtd-timeline-dot-primary{background-color:var(--primary);}
.vtd-timeline-dot-secondary{background-color:var(--secondary);}
.vtd-timeline-dot-warning{background-color:var(--warning);}
.vtd-timeline-dot-danger{background-color:var(--accent);}
.vtd-timeline-dot-neutral{background-color:var(--background-6);}
.vtd-timeline-item:not(:last-child) .vtd-timeline-marker::after{
content:"";
position:absolute;
top:1em;
bottom:-0.3em;
width:2px;
background-color:var(--background-4);
}
.vtd-timeline-body{flex-grow:1;min-width:0;}
.vtd-timeline-title{font-weight:bold;}
.vtd-timeline-description{font-size:0.9em;opacity:0.7;margin-block-start:0.15em;}
`, "vtd/Timeline")
    }

    return passthroughAttrsToElement<HTMLElement>(<ul class="vtd-timeline">
        {attrs.items.map(item => <li class="vtd-timeline-item">
            <span class="vtd-timeline-marker"><span class={`vtd-timeline-dot vtd-timeline-dot-${item.type||"primary"}`}/></span>
            <span class="vtd-timeline-body">
                <div class="vtd-timeline-title">{item.title}</div>
                {item.description && <div class="vtd-timeline-description">{item.description}</div>}
            </span>
        </li>)}
    </ul>, attrs)
}
