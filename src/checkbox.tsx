import { type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs } from "@velotype/velotype"

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

/**
 * An interactable Checkbox
 *
 * `<Checkbox name="some-name"/>Some option</Checkbox>`
 */
export const Checkbox: FunctionComponent<CheckboxAttrsType> = function(attrs: CheckboxAttrsType, children: RenderableElements[]): HTMLLabelElement {
    if (!areCheckboxStylesMounted) {
        areCheckboxStylesMounted = true
        setStylesheet(`
.vtd-cb-container{
cursor:pointer;
display:inline-flex;
align-items:center;
margin-inline:0.25em;
padding:0.25rem 0.5rem;
border-radius:0.25rem;
}

.vtd-cb-container:hover{background-color:var(--background-1);}

.vtd-cb-container:hover .vtd-cb{background-color:var(--primary-2);border:1px solid var(--primary-7);}

.vtd-cb-input {opacity:0;visibility:hidden;height:0;width:0;}

.vtd-cb {
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

.vtd-cb:active{background-color:var(--primary-6);}

.vtd-cb-disabled:hover{background-color:var(--background-2);border:1px solid var(--background-5);}
.vtd-cb-disabled:active{background-color:var(--background-2);}

.vtd-cb-check{
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
.vtd-cb-dash{
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

.vtd-cb-input:checked ~ .vtd-cb .vtd-cb-check,
.vtd-cb-input:indeterminate ~ .vtd-cb .vtd-cb-dash{
visibility:visible;
opacity:1;
}
.vtd-cb-input:checked ~ .vtd-cb,
.vtd-cb-input:indeterminate ~ .vtd-cb {
background-color:var(--primary);
border-color:var(--primary-5);
}

.vtd-cb-container:has(> .vtd-cb-input:disabled){cursor:not-allowed;}
.vtd-cb:focus-visible{border:1px solid var(--primary);outline-color:var(--primary)}
`, "vtd/Checkbox")
    }

    return passthroughAttrsToElement<HTMLLabelElement>(<label class="vtd-cb-container">
        <input
            type="checkbox"
            name={attrs.name}
            class="vtd-cb-input"
            disabled={attrs.disabled}
            checked={attrs.checked}
            indeterminate={attrs.indeterminate}
            value={attrs.value}
            onChange={attrs.onChange}/>
        <span class={`vtd-cb${attrs.disabled?" vtd-cb-disabled":""}`} tabindex={0}>
            <span class="vtd-cb-check"/>
            <span class="vtd-cb-dash"/>
        </span>
        {children}
    </label>, attrs)
}
