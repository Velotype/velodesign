import {type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, type StylePassthroughAttrs} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"

/**
 * Attrs type for `<Checkbox/>` Component
 */
export type CheckboxAttrsType = {
    /** `name` for the `<input>` tag */
    name?: string,
    /** Is the checkbox disabled? */
    disabled?: boolean,
    /** Is the checkbox checked? */
    checked?: boolean,
    /**
     * Puts the checkbox into the visual "indeterminate" state (neither checked nor unchecked)
     *
     * Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox#indeterminate_state_checkboxes
     */
    indeterminate?: boolean,
    /**
     * Value to use for this Checkbox during `<form>` submit
     *
     * Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox#value
     */
    value?: string | number,
    /** onChange event handler */
    onChange?: (event: Event) => void
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * Keep track of if Checkbox styles are mounted (boolean lookup here is lighter weight than Map check)
 */
let areCheckboxStylesMounted = false

/** Stylesheet for `<Checkbox/>`, mounted once on first construction */
const checkboxCss: string = `
.vtd-checkbox-container{
cursor:pointer;
display:inline-flex;
align-items:center;
margin-inline:0.25em;
padding:0.25rem 0.5rem;
border-radius:0.25rem;
}

.vtd-checkbox-container:hover{background-color:var(--background-1);}

.vtd-checkbox-container:hover .vtd-checkbox{background-color:var(--primary-2);border:1px solid var(--primary-7);}

.vtd-checkbox-input {position:absolute;opacity:0;height:0;width:0;margin:0;}

.vtd-checkbox {
position:relative;
border-radius:0.3em;
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

.vtd-checkbox:active{background-color:var(--primary-6);}

.vtd-checkbox-disabled:hover{background-color:var(--background-2);border:1px solid var(--background-5);}
.vtd-checkbox-disabled:active{background-color:var(--background-2);}

.vtd-checkbox-check{
position:absolute;
top:50%;
left:50%;
visibility:hidden;
opacity:0;
transition:opacity 0.2s ease-in;
width:0.3em;
height:0.6em;
border:solid var(--text);
border-width:0 0.15em 0.15em 0;
transform:translate(-50%,-65%) rotate(45deg);
}
.vtd-checkbox-dash{
position:absolute;
top:50%;
left:50%;
visibility:hidden;
opacity:0;
transition:opacity 0.2s ease-in;
width:0.7em;
height:0.15em;
background-color:var(--text);
transform:translate(-50%,-50%);
}

.vtd-checkbox-input:checked ~ .vtd-checkbox .vtd-checkbox-check,
.vtd-checkbox-input:indeterminate ~ .vtd-checkbox .vtd-checkbox-dash{
visibility:visible;
opacity:1;
}
.vtd-checkbox-input:checked ~ .vtd-checkbox,
.vtd-checkbox-input:indeterminate ~ .vtd-checkbox {
background-color:var(--primary-3);
border-color:var(--primary-5);
}

.vtd-checkbox-container:has(> .vtd-checkbox-input:disabled){cursor:not-allowed;}
` +
/* The input is 0x0 and transparent, so the ring has to be drawn on the box beside it */
`
.vtd-checkbox-input:focus-visible ~ .vtd-checkbox{outline:2px solid var(--primary-7);outline-offset:2px;}
`

/**
 * An interactable Checkbox
 *
 * `<Checkbox name="some-name"/>Some option</Checkbox>`
 */
export const Checkbox: FunctionComponent<CheckboxAttrsType> = function(attrs: CheckboxAttrsType, children: RenderableElements[]): HTMLLabelElement {
    if (!areCheckboxStylesMounted) {
        areCheckboxStylesMounted = true
        mountStyles(checkboxCss, "vtd/Checkbox")
    }

    return passthroughAttrsToElement<HTMLLabelElement>(<label class="vtd-checkbox-container">
        <input
            type="checkbox"
            name={attrs.name}
            class="vtd-checkbox-input"
            disabled={attrs.disabled}
            checked={attrs.checked}
            indeterminate={attrs.indeterminate}
            value={attrs.value}
            onChange={attrs.onChange}/>
        <span class={`vtd-checkbox${attrs.disabled?" vtd-checkbox-disabled":""}`}>
            <span class="vtd-checkbox-check"/>
            <span class="vtd-checkbox-dash"/>
        </span>
        {children}
    </label>, attrs)
}
