import { type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs } from "@velotype/velotype"

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
        setStylesheet(`
.vtd-r-btn-container{
cursor:pointer;
display:inline-flex;
align-items:center;
margin-inline:0.25em;
padding:0.25rem 0.5rem;
border-radius:0.25rem;
}

.vtd-r-btn-container:hover{background-color:var(--background-1);}

.vtd-r-btn-container:hover .vtd-r-btn{background-color:var(--primary-2);border:1px solid var(--primary-7);}

.vtd-r-btn-input {opacity:0;visibility:hidden;height:0;width:0;}

.vtd-r-btn {
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

.vtd-r-btn:active{background-color:var(--primary-6);}

.vtd-r-btn-disabled:hover{background-color:var(--background-2);border:1px solid var(--background-5);}
.vtd-r-btn-disabled:active{background-color:var(--background-2);}

.vtd-r-btn-check{
opacity:0;
transform:scale(0.4);
transition:opacity 0.15s ease-in, transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
border-radius:1em;
width:0.65em;
height:0.65em;
background-color:var(--primary);
}

.vtd-r-btn-input:checked ~ .vtd-r-btn .vtd-r-btn-check{
opacity:1;
transform:scale(1);
}
.vtd-r-btn-input:checked ~ .vtd-r-btn {
background-color:var(--primary-2);
border-color:var(--primary-7);
}

.vtd-r-btn-container:has(> .vtd-r-btn-input:disabled){cursor:not-allowed;}
.vtd-r-btn:focus-visible{border:1px solid var(--primary);outline-color:var(--primary)}
`, "vtd/RadioButton")
    }

    return passthroughAttrsToElement<HTMLLabelElement>(<label class="vtd-r-btn-container">
        <input
            type="radio"
            name={attrs.name}
            class="vtd-r-btn-input"
            disabled={attrs.disabled}
            checked={attrs.checked}
            value={attrs.value}
            onChange={attrs.onChange}/>
        <span class={`vtd-r-btn${attrs.disabled?" vtd-r-btn-disabled":""}`} tabindex={0}>
            <span class="vtd-r-btn-check"/>
        </span>
        {children}
    </label>, attrs)

/*
                onKeyUp={(event: KeyboardEvent)=>{
                    if (event.key === "Enter" || event.keyCode === 13) {
                        event.preventDefault()
                    }
                }}
*/
}
