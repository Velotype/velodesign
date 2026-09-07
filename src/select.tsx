import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs, type TargetedEvent } from "@velotype/velotype"

/**
 * A single option in a `<Select/>`
 */
export type SelectOptionType = {
    /** Value submitted for this option */
    value: string
    /** Displayed label for this option */
    label: RenderableElements
    /** Is this option disabled? */
    disabled?: boolean
}

/**
 * Attrs type for `<Select/>` Component
 */
export type SelectAttrsType = {
    /** `name` for the `<select/>` tag */
    name?: string
    /** The set of selectable options */
    options: SelectOptionType[]
    /** Currently selected value */
    value?: string
    /** If set, renders as a hidden first option with this label (until a real option is chosen) */
    placeholder?: string
    /** If `true`, the placeholder option can't be re-selected once a real option is chosen - i.e. there's no way back to "nothing selected" through the UI (default: `false`, so the user can pick the placeholder again to clear their selection) */
    placeholderDisabled?: boolean
    /** Is the select disabled? */
    disabled?: boolean
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** onChange event handler */
    onChange?: (event: TargetedEvent<HTMLSelectElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areSelectStylesMounted = false

/**
 * A themed dropdown for choosing one of a fixed set of options
 */
export const Select: FunctionComponent<SelectAttrsType> = function(attrs: SelectAttrsType, _children: RenderableElements[]): HTMLSpanElement {
    if (!areSelectStylesMounted) {
        areSelectStylesMounted = true
        setStylesheet(`
.vtd-select-wrapper{
position:relative;
display:inline-block;
}
.vtd-select{
appearance:none;
padding:0.5ex 2em 0.5ex 1ex;
margin-inline-start:1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
cursor:pointer;
}
.vtd-select:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-select:focus-visible{border:1px solid var(--primary);outline-color:var(--primary);}
.vtd-select-chevron{
position:absolute;
top:50%;
right:0.75em;
width:0.6em;
height:0.6em;
margin-inline-start:-1ex;
border:solid var(--text);
border-width:0 0.12em 0.12em 0;
transform:translateY(-70%) rotate(45deg);
pointer-events:none;
}
`, "vtd/Select")
    }

    return passthroughAttrsToElement<HTMLSpanElement>(<span class="vtd-select-wrapper">
        <select
            class="vtd-select"
            name={attrs.name}
            value={attrs.value}
            disabled={attrs.disabled}
            required={attrs.required}
            onChange={attrs.onChange}>
            {attrs.placeholder && <option value="" disabled={attrs.placeholderDisabled} selected={!attrs.value}>{attrs.placeholder}</option>}
            {attrs.options.map(option => <option value={option.value} disabled={option.disabled} selected={option.value == attrs.value}>{option.label}</option>)}
        </select>
        <span class="vtd-select-chevron"/>
    </span>, attrs)
}
