/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { CSSPropertyValue } from "../core/css-value.ts"
import { Tooltip } from "../feedback/tooltip.tsx"

/**
 * One option of a `<ChoiceCards/>` group
 */
export type ChoiceCardsOptionType = {
    /** Value reported to `onChange`, and submitted in a `<form>`, when this card is picked */
    value: string
    /** The card's heading - what the choice is */
    title: RenderableElements
    /** A line under the title saying what picking it means */
    description?: RenderableElements
    /** Can't be picked */
    disabled?: boolean
    /** Shown on hover or tap while the card is disabled - why it can't be picked */
    disabledHint?: RenderableElements
}

/**
 * Attrs type for `<ChoiceCards/>` Component
 */
export type ChoiceCardsAttrsType = {
    /** Name of the radio group - each card is a native radio input in it */
    name: string
    /** The group's caption, rendered as its `<legend>` */
    label?: RenderableElements
    /** Value of the picked card, if any */
    value?: string
    /** The cards, in order */
    options: ChoiceCardsOptionType[]
    /** Narrowest a card gets before the row wraps - the cards share the width above it */
    minCardWidth?: CSSPropertyValue<"min-width">
    /** Called with the picked card's value */
    onChange?: (value: string, event: Event) => void
} & IdAttr & StylePassthroughAttrs

let areChoiceCardsStylesMounted = false

/**
 * One choice of a few, each a small card with a title and a line saying what it means - for a
 * choice where the options need explaining, which a row of radio buttons or a switch with a note
 * under it can't show all at once.
 *
 * Each card is a native radio input inside a `<label>`, so arrow keys, focus, form submission and
 * a screen reader's "1 of 3" are the browser's. Picking only moves `checked`, which the CSS reads -
 * nothing is rebuilt.
 *
 * `<ChoiceCards name="who" label="Who can reply?" value="list" options={[...]} onChange={v => ...}/>`
 */
export const ChoiceCards: FunctionComponent<ChoiceCardsAttrsType> = function(attrs: ChoiceCardsAttrsType): HTMLFieldSetElement {
    if (!areChoiceCardsStylesMounted) {
        areChoiceCardsStylesMounted = true
        mountStyles(`
.vtd-choice-cards{border:0;padding:0;margin:0;min-width:0;width:100%;box-sizing:border-box;}
.vtd-choice-cards-legend{padding:0;margin-bottom:0.5em;font-weight:600;}
.vtd-choice-cards-row{display:grid;gap:0.6em;}
.vtd-choice-cards-row > .vtd-tooltip-wrapper{display:block;}
.vtd-choice-cards-card{
position:relative;
display:grid;
align-content:start;
gap:0.2em;
height:100%;
box-sizing:border-box;
padding:0.75em 0.9em;
border-radius:0.75em;
border:2px solid var(--background-5);
background-color:var(--background);
cursor:pointer;
transition:border-color 0.15s ease-in, background-color 0.15s ease-in;
}
.vtd-choice-cards-input{position:absolute;opacity:0;width:0;height:0;margin:0;}
.vtd-choice-cards-title{font-weight:600;}
.vtd-choice-cards-description{font-size:0.9em;color:var(--background-6);}
.vtd-choice-cards-card:hover{border-color:var(--primary-7);}
.vtd-choice-cards-card:has(> .vtd-choice-cards-input:checked){border-color:var(--primary);background-color:var(--primary-1);}
.vtd-choice-cards-card:has(> .vtd-choice-cards-input:disabled){cursor:not-allowed;opacity:0.55;border-color:var(--background-4);}
.vtd-choice-cards-card:has(> .vtd-choice-cards-input:focus-visible){outline:2px solid var(--primary-7);outline-offset:2px;}
@media (prefers-reduced-motion: reduce){.vtd-choice-cards-card{transition:none;}}
`, "vtd/ChoiceCards")
    }

    const cards = attrs.options.map(option => {
        const card = <label class="vtd-choice-cards-card">
            <input type="radio" class="vtd-choice-cards-input" name={attrs.name} value={option.value}
                checked={option.value === attrs.value} disabled={option.disabled}
                onChange={(event: Event) => { if ((event.target as HTMLInputElement).checked) {attrs.onChange?.(option.value, event)} }}/>
            <span class="vtd-choice-cards-title">{option.title}</span>
            {option.description === undefined ? null : <span class="vtd-choice-cards-description">{option.description}</span>}
        </label>
        // A disabled card says why, on hover or tap (Tooltip whenDisabled shows only while it is)
        return option.disabledHint === undefined ? card : <Tooltip whenDisabled content={option.disabledHint}>{card}</Tooltip>
    })
    return passthroughAttrsToElement<HTMLFieldSetElement>(<fieldset class="vtd-choice-cards">
        {attrs.label === undefined ? null : <legend class="vtd-choice-cards-legend">{attrs.label}</legend>}
        <div class="vtd-choice-cards-row" style={{gridTemplateColumns: `repeat(auto-fit, minmax(min(${attrs.minCardWidth ?? "12em"}, 100%), 1fr))`}}>{cards}</div>
    </fieldset>, attrs)
}
