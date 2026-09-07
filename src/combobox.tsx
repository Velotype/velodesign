import { type FunctionComponent, type IdAttr, passthroughAttrsToElement, type RenderableElements, setStylesheet, type StylePassthroughAttrs, type TargetedEvent, type TargetedInputEvent } from "@velotype/velotype"

/**
 * A single suggestion in a `<Combobox/>`
 */
export type ComboboxOptionType = {
    /** Value suggested/submitted for this option */
    value: string
    /** Displayed label for this option (defaults to `value`) */
    label?: string
}

/**
 * Attrs type for `<Combobox/>` Component
 */
export type ComboboxAttrsType = {
    /** `name` for the `<input/>` tag */
    name?: string
    /** Current value */
    value?: string
    /** The set of suggested options */
    options: ComboboxOptionType[]
    /** Placeholder text */
    placeholder?: string
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** Is the combobox disabled? */
    disabled?: boolean
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areComboboxStylesMounted = false
let comboboxInstanceCounter = 0

/**
 * A free-text input with a searchable dropdown of suggestions, wrapping a native
 * `<input/>` paired with a `<datalist/>` - the browser supplies the filtering-as-you-type
 * and keyboard navigation of the suggestion list for free
 */
export const Combobox: FunctionComponent<ComboboxAttrsType> = function(attrs: ComboboxAttrsType, _children: RenderableElements[]): HTMLSpanElement {
    if (!areComboboxStylesMounted) {
        areComboboxStylesMounted = true
        setStylesheet(`
.vtd-combobox{
padding:0.5ex 1ex;
margin-inline-start:1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
}
.vtd-combobox:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-combobox:focus-visible{border:1px solid var(--primary);outline-color:var(--primary);}
`, "vtd/Combobox")
    }

    const listId = `vtd-combobox-list-${comboboxInstanceCounter++}`

    return passthroughAttrsToElement<HTMLSpanElement>(<span style={{display: "contents"}}>
        <input
            type="text"
            class="vtd-combobox"
            name={attrs.name}
            value={attrs.value}
            list={listId}
            placeholder={attrs.placeholder}
            disabled={attrs.disabled}
            required={attrs.required}
            onInput={attrs.onInput}
            onChange={attrs.onChange}/>
        <datalist id={listId}>
            {attrs.options.map(option => <option value={option.value}>{option.label}</option>)}
        </datalist>
    </span>, attrs)
}
