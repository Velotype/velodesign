import { type ChildrenAttr, type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<Toggle/>` Component
 */
export type ToggleAttrsType = {
    /** `name` for the `<input>` tag */
    name?: string,
    /** Is the toggle disabled? */
    disabled?: boolean,
    /** Is the toggle switched on? */
    checked?: boolean,
    /**
     * Value to use for this Toggle during `<form>` submit
     *
     * Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox#value
     */
    value?: string | number,
    /** onChange event handler */
    onChange?: (event: Event) => void
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

/**
 * Keep track of if Toggle styles are mounted (boolean lookup here is lighter weight than Map check)
 */
let areToggleStylesMounted = false

/**
 * An interactable Toggle (switch), for boolean settings
 *
 * `<Toggle name="some-name"/>Enable notifications</Toggle>`
 */
export const Toggle: FunctionComponent<ToggleAttrsType> = function(attrs: ToggleAttrsType, children: RenderableElements[]): HTMLLabelElement {
    if (!areToggleStylesMounted) {
        areToggleStylesMounted = true
        setStylesheet(`
.vtd-tg-container{
cursor:pointer;
display:inline-flex;
align-items:center;
margin-inline:0.25em;
padding:0.25rem 0.5rem;
border-radius:0.25rem;
}

.vtd-tg-container:hover{background-color:var(--background-1);}

.vtd-tg-input {opacity:0;visibility:hidden;height:0;width:0;}

.vtd-tg-track{
position:relative;
display:inline-block;
height:1.4em;
width:2.6em;
margin-inline-end:1ex;
border-radius:1em;
transition:background-color 0.2s ease-in, border 0.3s ease-in;
background-color:var(--background-3);
border:1px solid var(--background-6);
flex-shrink:0;
}

.vtd-tg-thumb{
position:absolute;
top:50%;
left:0.15em;
height:1em;
width:1em;
border-radius:1em;
background-color:var(--background-9);
transform:translateY(-50%);
transition:left 0.2s ease-in, background-color 0.2s ease-in;
}

.vtd-tg-input:checked ~ .vtd-tg-track{
background-color:var(--primary);
border-color:var(--primary-7);
}
.vtd-tg-input:checked ~ .vtd-tg-track .vtd-tg-thumb{
left:calc(100% - 1.15em);
background-color:var(--background);
}

.vtd-tg-disabled{opacity:0.5;cursor:not-allowed;}
.vtd-tg-container:has(> .vtd-tg-input:disabled){cursor:not-allowed;}
.vtd-tg-track:focus-visible{outline:1px solid var(--primary);outline-offset:1px;}
`, "vtd/Toggle")
    }

    return passthroughAttrsToElement<HTMLLabelElement>(<label class="vtd-tg-container">
        <input
            type="checkbox"
            name={attrs.name}
            class="vtd-tg-input"
            disabled={attrs.disabled}
            checked={attrs.checked}
            value={attrs.value}
            onChange={attrs.onChange}/>
        <span class={`vtd-tg-track${attrs.disabled?" vtd-tg-disabled":""}`} tabindex={0}>
            <span class="vtd-tg-thumb"/>
        </span>
        {children}
    </label>, attrs)
}
