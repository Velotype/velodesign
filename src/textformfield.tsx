

import { type RenderBasic, Component, type RenderableElements, type ChildrenAttr, type FunctionComponent, type EmptyAttrs, type AnchorElement, type StylePassthroughAttrs, type IdAttr, passthroughAttrsToElement } from "@velotype/velotype"
import { Button } from "./button.tsx"
import { TextBox, type TextBoxTypeType } from "./textbox.tsx"

/**
 * Options to customize `<TextFormField/>` Component Theme
 */
export const TextFormFieldOptions: {
    check: FunctionComponent<EmptyAttrs>
    xmark: FunctionComponent<EmptyAttrs>
    edit: FunctionComponent<EmptyAttrs>
} = {
    check: function(){return "✓"},
    xmark: function(){return "✗"},
    edit: function(){return "✎"}
}

/**
 * Attrs type for `<TextNonEditableField/>` Component
 */
export type TextNonEditableFieldAttrsType = {
    value: string
}
/**
 * Display a readonly label/value pair in a style consistent way with other TextFormField Components
 */
export const TextNonEditableField: FunctionComponent<TextNonEditableFieldAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr> = function(attrs: TextNonEditableFieldAttrsType & IdAttr & StylePassthroughAttrs, children: RenderableElements[]): HTMLDivElement {
    return passthroughAttrsToElement(<div style={{marginBlockStart: "1ex",marginBlockEnd: "1ex",display:"flex",alignItems:"center"}}>
        <span>{children}</span>
        <span style={{marginInlineStart: "1em"}}>{attrs.value}</span>
    </div>, attrs)
}

/**
 * Attrs type for `<TextFormField/>` Component
 */
export type TextFormFieldAttrTypes = {
    type?: TextBoxTypeType
    required?: boolean
    field: RenderBasic<string>
    updateOnInput: boolean
    updateOnChange?: boolean
}
/**
 * Display a label/value pair where the value is a `<TextBox/>` with value to be provided by the user
 */
export class TextFormField extends Component<TextFormFieldAttrTypes & IdAttr & StylePassthroughAttrs & ChildrenAttr> {
    /** Render this Component */
    override render(attrs: TextFormFieldAttrTypes & IdAttr & StylePassthroughAttrs, children: RenderableElements[]): HTMLDivElement {
        return passthroughAttrsToElement(<div style={{marginBlockStart: "1ex",marginBlockEnd: "1ex",display:"flex",alignItems:"center"}}>
            <label for={`vtd-${this.vtKey}`}>
                {children}
                <TextBox
                    id={`vtd-${this.vtKey}`}
                    type={attrs.type || "text"}
                    value={attrs.field.get()}
                    onInput={(event: Event) => {
                        if (event.target && (event.target instanceof HTMLInputElement) && attrs.updateOnInput) {
                            attrs.field.set(event.target?.value)
                        }
                    }}
                    onChange={(event: Event) => {
                        if (event.target && (event.target instanceof HTMLInputElement) && attrs.updateOnChange) {
                            attrs.field.set(event.target?.value)
                        }
                    }}
                    required={attrs.required}/>
            </label>
        </div>, attrs)
    }
}

/**
 * Attrs type for `<TextEditableField/>` Component
 */
export type TextEditableFieldAttrsType = {
    fieldName?: string
    type?: TextBoxTypeType
    field: RenderBasic<string>
}
/**
 * Display a label/value pair where the value has an 'edit' icon next to it,
 * then turning into a `<TextBox/>` with a 'confirm' or 'cancel' pair of icons
 * to save the value as changed (then reverting back to the read view)
 */
export class TextEditableField extends Component<TextEditableFieldAttrsType & IdAttr & StylePassthroughAttrs & ChildrenAttr> {
    #editValue: string
    constructor(attrs: TextEditableFieldAttrsType & ChildrenAttr, children: RenderableElements[]){
        super(attrs, children)
        this.#editValue = attrs.field.value
    }
    /** Render this Component */
    override render(attrs: TextEditableFieldAttrsType & IdAttr & StylePassthroughAttrs, children: RenderableElements[]): HTMLDivElement {
        const editControls = <span style={{display:"inline-flex",alignItems:"center",gap:"4px"}}>
            <TextBox
                id={`vtd-${this.vtKey}`}
                name={attrs.fieldName}
                type={attrs.type || "text"}
                value={this.#editValue}
                onInput={(event: Event) => {
                    if (event.target && (event.target instanceof HTMLInputElement)) {
                        this.#editValue = event.target?.value
                    }
                }}/>
            <Button type="secondary" onClick={() => {
                attrs.field.value = this.#editValue
                currentControls = this.replaceChild(currentControls, viewControls())
            }}><TextFormFieldOptions.check/></Button>
            <Button type="secondary" onClick={() => {
                this.#editValue = attrs.field.value
                currentControls = this.replaceChild(currentControls, viewControls())
            }}><TextFormFieldOptions.xmark/></Button>
        </span>
        const viewControls = (): HTMLSpanElement => {
            return <span style={{display:"inline-flex",alignItems:"center",gap:"4px"}}>
                <span style={{marginInlineStart: "1em"}}>{attrs.field}</span>
                <Button type="secondary" onClick={() => {
                    currentControls = this.replaceChild(currentControls, editControls)
                }}><TextFormFieldOptions.edit/></Button>
            </span>
        }
        let currentControls: AnchorElement = viewControls()
        return passthroughAttrsToElement(<div style={{marginBlockStart:"1ex",marginBlockEnd:"1ex",display:"flex",alignItems:"center"}}>
            {children}
            {currentControls}
        </div>, attrs)
    }
}
