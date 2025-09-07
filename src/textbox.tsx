import { Component, setStylesheet, type CSSProperties } from "jsr:@velotype/velotype"

export type TextBoxAttrsType = {
    type: "password" | "new-password" | "text" | "email" | "phone"
    id?: string
    name?: string
    style?: CSSProperties | string
    value?: string | number
    placeholder?: string
    required?: boolean
    onInput?: (event: Event) => void
    onChange?: (event: Event) => void
}
export class TextBox extends Component<TextBoxAttrsType> {
    override mount() {
        setStylesheet(`
.vtd-textbox{
padding:0.5ex 1ex;
margin-inline-start:1ex;
}`, "vtd/TextBox")
    }
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
