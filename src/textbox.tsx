import { Component, setStylesheet, type CSSProperties } from "jsr:@velotype/velotype"

/**
 * Attrs type for `<TextBox/>` Component
 */
export type TextBoxAttrsType = {
    /** Type of the input */
    type: "password" | "new-password" | "text" | "email" | "phone"
    /** `id` for the `<input/>` tag */
    id?: string
    /** `name` for the `<input/>` tag */
    name?: string
    /** Pass-through styles */
    style?: CSSProperties | string
    /** Initial value */
    value?: string | number
    /** Placeholder text */
    placeholder?: string
    /** If this field is required in a `<form/>` */
    required?: boolean
    /** Callback for onInput event */
    onInput?: (event: Event) => void
    /** Callback for onChange event */
    onChange?: (event: Event) => void
}

/**
 * An input box accepting text input from the user
 */
export class TextBox extends Component<TextBoxAttrsType> {
    /** Mount this Component */
    override mount() {
        setStylesheet(`
.vtd-textbox{
padding:0.5ex 1ex;
margin-inline-start:1ex;
}`, "vtd/TextBox")
    }

    /** Render this Component */
    override render(props: TextBoxAttrsType): HTMLInputElement {
        let autocomplete = "off"
        if (props.type == "password" || props.type == "new-password") {
            if (props.type == "password") {
                autocomplete="current-password"
            } else if (props.type == "new-password") {
                autocomplete="new-password"
            }
            return <input
                class="vtd-textbox"
                id={props.id}
                name={props.name}
                type="password"
                style={props.style}
                onInput={props.onInput}
                onChange={props.onChange}
                value={props.value}
                autocomplete={autocomplete}
                placeholder={props.placeholder}
                required={props.required}/>
        }
        let inputType: "text" | "email" | "tel" = "text"
        if (props.type == "email") {
            inputType = "email"
            autocomplete="email"
        } else if (props.type == "phone") {
            inputType = "tel"
            autocomplete="tel"
        }
        return <input
            class="vtd-textbox"
            id={props.id}
            name={props.name}
            type={inputType}
            role="textbox"
            style={props.style}
            onInput={props.onInput}
            onChange={props.onChange}
            value={props.value}
            autocomplete={autocomplete}
            placeholder={props.placeholder}
            required={props.required}/>
    }
}
