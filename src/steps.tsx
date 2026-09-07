import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * A single step in a `<Steps/>` sequence
 */
export type StepType = {
    /** Unique key identifying this step */
    key: string
    /** Displayed title for this step */
    title: RenderableElements
    /** Optional smaller supporting text below the title */
    description?: RenderableElements
}

/**
 * Attrs type for `<Steps/>` Component
 */
export type StepsAttrsType = {
    /** The set of steps to show, in order */
    steps: StepType[]
    /** 0-indexed position of the current step */
    current: number
} & IdAttr & StylePassthroughAttrs

let areStepsStylesMounted = false

/**
 * A horizontal sequence of numbered steps, for wizards/checkout flows, showing which are
 * done, current, or upcoming
 */
export const Steps: FunctionComponent<StepsAttrsType> = function(attrs: StepsAttrsType, _children: RenderableElements[]): HTMLElement {
    if (!areStepsStylesMounted) {
        areStepsStylesMounted = true
        setStylesheet(`
.vtd-steps{display:flex;list-style:none;padding:0;margin:0;}
.vtd-steps-item{
position:relative;
flex:1;
display:flex;
flex-direction:column;
align-items:center;
text-align:center;
padding-inline:0.5em;
}
.vtd-steps-item:not(:last-child)::after{
content:"";
position:absolute;
top:1em;
left:calc(50% + 1.4em);
right:calc(-50% + 1.4em);
height:2px;
background-color:var(--background-4);
}
.vtd-steps-item-done:not(:last-child)::after{background-color:var(--primary);}
.vtd-steps-marker{
width:2em;
height:2em;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
background-color:var(--background-2);
border:1px solid var(--background-5);
z-index:1;
font-weight:bold;
}
.vtd-steps-item-current .vtd-steps-marker{background-color:var(--primary);border-color:var(--primary-7);color:var(--text-alt);}
.vtd-steps-item-done .vtd-steps-marker{background-color:var(--primary-3);border-color:var(--primary-6);}
.vtd-steps-title{margin-block-start:0.5em;font-weight:bold;font-size:0.9em;}
.vtd-steps-description{font-size:0.8em;opacity:0.7;margin-block-start:0.15em;}
`, "vtd/Steps")
    }

    return passthroughAttrsToElement<HTMLElement>(<ol class="vtd-steps">
        {attrs.steps.map((step, index) => {
            const status = index < attrs.current ? "done" : (index == attrs.current ? "current" : "upcoming")
            return <li class={`vtd-steps-item vtd-steps-item-${status}`}>
                <span class="vtd-steps-marker">{index < attrs.current ? "✓" : index + 1}</span>
                <span class="vtd-steps-title">{step.title}</span>
                {step.description ? <span class="vtd-steps-description">{step.description}</span> : null}
            </li>
        })}
    </ol>, attrs)
}
