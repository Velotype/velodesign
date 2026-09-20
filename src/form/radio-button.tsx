import {type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"

/**
 * Attrs type for `<RadioButton/>` Component
 */
export type RadioButtonAttrsType = {
    /**
     * Name of the RadioGroup this RadioButton participates in
     * 
     * Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/radio#defining_a_radio_group
     */
    name: string,
    /** Is the radiobutton disabled? */
    disabled?: boolean,
    /** Is the radiobutton checked? */
    checked?: boolean,
    /**
     * Value to use for this RadioButton during `<form>` submit
     * 
     * Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/radio#value
     */
    value?: string | number,
    /** onChange event handler */
    onChange?: (event: Event) => void
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * Keep track of if RadioButton styles are mounted (boolean lookup here is lighter weight than Map check)
 */
let areButtonStylesMounted = false

/**
 * An interactable RadioButton
 * 
 * `<RadioButton name="group-name"/>Some option</RadioButton>`
 */
export const RadioButton: FunctionComponent<RadioButtonAttrsType> = function(attrs: RadioButtonAttrsType, children: RenderableElements[]): HTMLLabelElement {
    if (!areButtonStylesMounted) {
        areButtonStylesMounted = true
        mountStyles(`
.vtd-radio-button-container{
cursor:pointer;
display:inline-flex;
align-items:center;
margin-inline:0.25em;
padding:0.25rem 0.5rem;
border-radius:0.25rem;
}

.vtd-radio-button-container:hover{background-color:var(--background-1);}

.vtd-radio-button-container:hover .vtd-radio-button{background-color:var(--primary-2);border:1px solid var(--primary-7);}

.vtd-radio-button-input {position:absolute;opacity:0;height:0;width:0;margin:0;}

.vtd-radio-button {
position:relative;
border-radius:1em;
display:inline-flex;
align-items:center;
justify-content:center;
height:1.5em;
width:1.5em;
margin-inline-end:1ex;
flex-shrink:0;
transition:background-color 0.2s ease-in, border-color 0.2s ease-in;
background-color:var(--background-1);border:1px solid var(--background-5);
}

.vtd-radio-button:active{background-color:var(--primary-6);}

.vtd-radio-button-disabled:hover{background-color:var(--background-2);border:1px solid var(--background-5);}
.vtd-radio-button-disabled:active{background-color:var(--background-2);}

.vtd-radio-button-check{
opacity:0;
transform:scale(0.4);
transition:opacity 0.15s ease-in, transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
border-radius:1em;
width:0.65em;
height:0.65em;
background-color:var(--primary);
}

.vtd-radio-button-input:checked ~ .vtd-radio-button .vtd-radio-button-check{
opacity:1;
transform:scale(1);
}
.vtd-radio-button-input:checked ~ .vtd-radio-button {
background-color:var(--primary-2);
border-color:var(--primary-7);
}

.vtd-radio-button-container:has(> .vtd-radio-button-input:disabled){cursor:not-allowed;}
/* As Checkbox: the ring belongs on the visible control, not the hidden input */
.vtd-radio-button-input:focus-visible ~ .vtd-radio-button{outline:2px solid var(--primary-7);outline-offset:2px;}
`, "vtd/RadioButton")
    }

    return passthroughAttrsToElement<HTMLLabelElement>(<label class="vtd-radio-button-container">
        <input
            type="radio"
            name={attrs.name}
            class="vtd-radio-button-input"
            disabled={attrs.disabled}
            checked={attrs.checked}
            value={attrs.value}
            onChange={attrs.onChange}/>
        <span class={`vtd-radio-button${attrs.disabled?" vtd-radio-button-disabled":""}`}>
            <span class="vtd-radio-button-check"/>
        </span>
        {children}
    </label>, attrs)
}
