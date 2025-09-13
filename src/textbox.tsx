import { Component, type IdAttr, passthroughAttrsToElement, setStylesheet, type StylePassthroughAttrs } from "jsr:@velotype/velotype"

/**
 * The various types of TextBox Components
 */
export type TextBoxTypeType = "password" | "new-password" | "text" | "email" | "phone"

/**
 * Attrs type for `<TextBox/>` Component
 */
export type TextBoxAttrsType = {
    /** Type of the input */
    type: TextBoxTypeType
    /** `name` for the `<input/>` tag */
    name?: string
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
export class TextBox extends Component<TextBoxAttrsType & IdAttr & StylePassthroughAttrs> {
    /** Mount this Component */
    override mount() {
        setStylesheet(`
.vtd-textbox{
padding:0.5ex 1ex;
margin-inline-start:1ex;
}`, "vtd/TextBox")
    }

    /** Render this Component */
    override render(attrs: TextBoxAttrsType & IdAttr & StylePassthroughAttrs): HTMLInputElement {
        let autocomplete = "off"
        if (attrs.type == "password" || attrs.type == "new-password") {
            if (attrs.type == "password") {
                autocomplete="current-password"
            } else if (attrs.type == "new-password") {
                autocomplete="new-password"
            }
            return passthroughAttrsToElement(<input
                class="vtd-textbox"
                name={attrs.name}
                type="password"
                onInput={attrs.onInput}
                onChange={attrs.onChange}
                value={attrs.value}
                autocomplete={autocomplete}
                placeholder={attrs.placeholder}
                required={attrs.required}/>, attrs) as HTMLInputElement
        }
        let inputType: "text" | "email" | "tel" = "text"
        if (attrs.type == "email") {
            inputType = "email"
            autocomplete="email"
        } else if (attrs.type == "phone") {
            inputType = "tel"
            autocomplete="tel"
        }
        return passthroughAttrsToElement(<input
            class="vtd-textbox"
            name={attrs.name}
            type={inputType}
            role="textbox"
            onInput={attrs.onInput}
            onChange={attrs.onChange}
            value={attrs.value}
            autocomplete={autocomplete}
            placeholder={attrs.placeholder}
            required={attrs.required}/>, attrs) as HTMLInputElement
    }
}
