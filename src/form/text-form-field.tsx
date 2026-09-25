import { Component, passthroughAttrsToElement } from "../core/velotype.ts"
import type { RenderBasic, RenderableElements, ChildrenAttr, FunctionComponent, StylePassthroughAttrs, IdAttr } from "../core/velotype.ts"
import { TextBox, type TextBoxType } from "./text-box.tsx"
import { EditableField, EditableFieldThemeOptions } from "./editable-field.tsx"
import { FormField } from "../data-entry/form.tsx"

/**
 * Options to customize `<TextFormField/>` Component Theme
 *
 * @deprecated Use `EditableFieldThemeOptions`. This is the same object under its former name -
 * `editSymbol` belongs to the component that owns it, which is now `EditableField`.
 */
export const TextFormFieldThemeOptions: typeof EditableFieldThemeOptions = EditableFieldThemeOptions

/**
 * Attrs type for `<TextNonEditableField/>` Component
 */
export type TextNonEditableFieldAttrsType = {
    value: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr
/**
 * Display a readonly label/value pair in a style consistent way with other TextFormField Components
 *
 * @deprecated Use `FormField`, which lays out a label with any content and is not limited to a
 * string: `<FormField label="Plan">Pro</FormField>`.
 */
export const TextNonEditableField: FunctionComponent<TextNonEditableFieldAttrsType> = function(attrs: TextNonEditableFieldAttrsType, children: RenderableElements[]): HTMLDivElement {
    return passthroughAttrsToElement<HTMLDivElement>(<div>
        <FormField label={children}>{attrs.value}</FormField>
    </div>, attrs)
}

/**
 * Attrs type for `<TextFormField/>` Component
 */
export type TextFormFieldAttrsType = {
    type?: TextBoxType
    required?: boolean
    field: RenderBasic<string>
    /** If the `field` should have it's value updated each time onInput triggers (default: `true`) */
    updateOnInput?: boolean
    /** If the `field` should have it's value updated each time onChange triggers (default: `false`) */
    updateOnChange?: boolean
} & IdAttr & StylePassthroughAttrs & ChildrenAttr
/**
 * Display a label/value pair where the value is a `<TextBox/>` with value to be provided by the user
 *
 * @deprecated Use `FormField` with `bindValue`, which works with every control in the package
 * rather than only `TextBox`, and adds `hint` and `error`:
 *
 * ```tsx
 * <FormField label="Name" required><TextBox type="text" {...bindValue(name)}/></FormField>
 * ```
 */
export class TextFormField extends Component<TextFormFieldAttrsType> {
    /** Render this Component */
    override render(attrs: TextFormFieldAttrsType, children: RenderableElements[]): HTMLDivElement {
        const updateOnInput = (attrs.updateOnInput === undefined) ? true : attrs.updateOnInput
        // Kept hand-rolled rather than delegating to `bindValue`: this signature takes a
        // `RenderBasic<string>` and two independent update flags, and `bindValue` deliberately
        // dropped the flags. Translating them would change behaviour for callers still on it.
        return passthroughAttrsToElement(<div>
            <FormField label={children} required={attrs.required}>
                <TextBox
                    id={`vtd-${this.vtKey}`}
                    type={attrs.type || "text"}
                    value={attrs.field.get()}
                    onInput={(event: Event) => {
                        if (event.target && (event.target instanceof HTMLInputElement) && updateOnInput) {
                            attrs.field.set(event.target?.value)
                        }
                    }}
                    onChange={(event: Event) => {
                        if (event.target && (event.target instanceof HTMLInputElement) && attrs.updateOnChange) {
                            attrs.field.set(event.target?.value)
                        }
                    }}
                    required={attrs.required}/>
            </FormField>
        </div>, attrs)
    }
}

/**
 * Attrs type for `<TextEditableField/>` Component
 */
export type TextEditableFieldAttrsType = {
    fieldName?: string
    type?: TextBoxType
    field: RenderBasic<string>
} & IdAttr & StylePassthroughAttrs & ChildrenAttr
/**
 * Display a label/value pair where the value has an 'edit' icon next to it,
 * then turning into a `<TextBox/>` with a 'confirm' or 'cancel' pair of icons
 * to save the value as changed (then reverting back to the read view)
 *
 * @deprecated Use `EditableField`, which takes any control rather than only `TextBox` and can save
 * asynchronously - this one wrote straight to `field` with nowhere to persist from:
 *
 * ```tsx
 * <EditableField label="Name" value={name}
 *     edit={(draft) => <TextBox type="text" {...bindValue(draft)}/>}
 *     onSave={async (v) => { await api.save(v) }}/>
 * ```
 */
export class TextEditableField extends Component<TextEditableFieldAttrsType> {
    /** Render this Component */
    override render(attrs: TextEditableFieldAttrsType, children: RenderableElements[]): HTMLDivElement {
        // `field` is a RenderBasic and EditableField wants a RenderObject, which RenderBasic
        // extends - so the saved value lands in the caller's own object, as it always did
        return passthroughAttrsToElement(<div>
            <EditableField<string>
                label={children}
                value={attrs.field}
                edit={(draft) => <TextBox
                    id={`vtd-${this.vtKey}`}
                    name={attrs.fieldName}
                    type={attrs.type || "text"}
                    value={draft.get()}
                    onInput={(event: Event) => {
                        if (event.target instanceof HTMLInputElement) {
                            draft.set(event.target.value)
                        }
                    }}/>}/>
        </div>, attrs)
    }
}
