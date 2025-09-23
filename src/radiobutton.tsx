import { type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs } from "jsr:@velotype/velotype"

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
}

/**
 * Keep track of if RadioButton styles are mounted (boolean lookup here is lighter weight than Map check)
 */
let areButtonStylesMounted = false

/**
 * An interactable RadioButton
 */
export const RadioButton: FunctionComponent<RadioButtonAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr> = function(attrs: RadioButtonAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr, children: RenderableElements[]): HTMLSpanElement {
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
display:inline-block;
height:calc(1em - 2px);
width:calc(1em - 2px);
margin-inline-end:0.5ex;
transition:background-color 0.2s ease-in, border 0.3s ease-in;
background-color:var(--background-1);border:1px solid var(--background-5);
}

.vtd-r-btn:active{background-color:var(--primary-6);}

.vtd-r-btn-disabled:hover{background-color:var(--background-2);border:1px solid var(--background-5);}
.vtd-r-btn-disabled:active{background-color:var(--background-2);}

.vtd-r-btn-check{
visibility:hidden;
opacity:0;
transition:opacity 0.4s ease-in;
position:absolute;
border-radius:1em;
margin-left:25%;
margin-top:25%;
width:50%;
height:50%;
background-color:var(--primary-5);
}

.vtd-r-btn-input:checked ~ .vtd-r-btn .vtd-r-btn-check{
visibility:visible;
opacity:1;
}
.vtd-r-btn-input:checked ~ .vtd-r-btn {
background-color:transparent;
border-color:var(--background-9);
}

.vtd-r-btn-container:has(> .vtd-r-btn-input:disabled){cursor:not-allowed;}
.vtd-r-btn:focus-visible{border:1px solid var(--primary-5);outline-color:var(--primary-5)}
`, "vtd/RadioButton")
    }

    return passthroughAttrsToElement(<label class="vtd-r-btn-container">
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
