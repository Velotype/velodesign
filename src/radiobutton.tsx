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
position:relative;
display:inline-block;
margin-inline:0.25em;
}

.vtd-r-btn-input {
opacity:0;
visibility:hidden;
height:0;
width:0;
}

.vtd-r-btn {
border-radius:0.75em;
cursor:pointer;
display:inline-block;
height:1.5em;
width:1.5em;
transition:color 0.25s ease-in-out, background-color 0.25s ease-in-out, border 0.25s ease-in-out;

background-color:var(--primary);border:1px solid var(--primary-5);
}

.vtd-r-btn:hover{background-color:var(--primary-2);border:1px solid var(--primary-7);}
.vtd-r-btn:active{background-color:var(--primary-6);}

.vtd-r-btn-container .vtd-r-btn-input:checked ~ .vtd-r-btn {
background-color: var(--accent);
}

.vtd-r-btn-check:after {
content: "";
position: absolute;
display: none;
}

.vtd-r-btn-container .vtd-r-btn-input:checked ~ .vtd-r-btn:after {
display: block;
}

.vtd-r-btn:after {
left: 9px;
top: 5px;
width: 5px;
height: 10px;
border: solid white;
border-width: 0 3px 3px 0;
transform: rotate(45deg);
}

.vtd-r-btn-input:disabled + span:hover{cursor:not-allowed;}
.vtd-r-btn:focus-visible{border:1px solid var(--accent);}
`, "vtd/RadioButton")
    }

    return passthroughAttrsToElement(<span>
        <label class="vtd-r-btn-container">
            <input
                type="radio"
                name={attrs.name}
                class="vtd-r-btn-input"
                disabled={attrs.disabled}
                checked={attrs.checked}
                value={attrs.value}
                onChange={attrs.onChange}/>
            <span
                class={`vtd-r-btn`}
                tabindex={0}
            />
            {children}
        </label>
    </span>, attrs)

/*
                onKeyUp={(event: KeyboardEvent)=>{
                    if (event.key === "Enter" || event.keyCode === 13) {
                        event.preventDefault()
                    }
                }}
*/
}
