import { Component, RenderObject, passthroughAttrsToElement } from "../core/velotype.ts"
import type { AnchorElement, ChildrenAttr, IdAttr, RenderableElements, StylePassthroughAttrs } from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import { Button } from "./button.tsx"
import { FormField } from "../data-entry/form.tsx"
import { themeOptions, type ThemeSymbol } from "../core/theme-options.ts"

/**
 * Options to customize `<EditableField/>` Component Theme
 */
export const EditableFieldThemeOptions: {
    /** Confirms an edit. Defaults to `CommonThemeOptions.confirmSymbol` */
    confirmSymbol: ThemeSymbol
    /** Cancels an edit. Defaults to `CommonThemeOptions.cancelSymbol` */
    cancelSymbol: ThemeSymbol
    /** Starts an edit. No counterpart elsewhere in the package, so it stays local */
    editSymbol: ThemeSymbol
} = themeOptions({confirmSymbol: "confirmSymbol", cancelSymbol: "cancelSymbol"}, {
    editSymbol: function(){return "✎"}
})

/**
 * Attrs type for `<EditableField/>` Component
 */
export type EditableFieldAttrsType<T> = {
    /** Label for the field, shown in both modes */
    label?: RenderableElements
    /** The saved value. Written only once a save succeeds */
    value: RenderObject<T>
    /**
     * Renders the saved value for reading. Defaults to the value itself, via `String`.
     *
     * Give it something for an empty value - a muted "Not set" beats a blank row with an edit
     * control floating beside nothing.
     */
    display?: (value: T) => RenderableElements
    /**
     * Renders the control for editing, given a **draft** to bind to.
     *
     * The draft is a separate `RenderObject<T>` seeded from `value`, which is what makes cancel free
     * and save explicit: nothing the reader types reaches `value` until a save succeeds.
     *
     * ```tsx
     * edit={(draft) => <TextBox type="text" {...bindValue(draft)}/>}
     * ```
     */
    edit: (draft: RenderObject<T>) => RenderableElements
    /**
     * Persists the edit. Returning a promise puts the field in a saving state until it settles, and
     * a rejection keeps the reader in edit mode with their draft intact and the reason shown.
     *
     * Without one the field simply writes `value` and returns to reading.
     */
    onSave?: (value: T) => void | Promise<void>
    /** Guidance shown under the control, in both modes */
    hint?: RenderableElements
    /** Marks the field required. Does not itself validate - that is `onSave`'s to reject */
    required?: boolean
    /** Accessible name for the control that starts an edit (default: `"Edit"`) */
    editLabel?: string
    /** Accessible name for the control that saves (default: `"Save"`) */
    confirmLabel?: string
    /** Accessible name for the control that discards (default: `"Cancel"`) */
    cancelLabel?: string
} & IdAttr & StylePassthroughAttrs & ChildrenAttr

let areEditableFieldStylesMounted = false

/** Stylesheet for `<EditableField/>`, mounted once on first construction */
const editableFieldCss: string = `
.vtd-editable-field-row{display:flex;align-items:center;gap:0.5em;flex-wrap:wrap;}
/* The value takes the slack so the controls sit at the trailing edge rather than against the text */
.vtd-editable-field-value{flex:1;min-width:0;}
.vtd-editable-field-controls{display:inline-flex;align-items:center;gap:0.25em;flex-shrink:0;}
/* Saving keeps the editor readable - dimming the whole row hides the value being saved */
.vtd-editable-field-saving .vtd-editable-field-controls{opacity:0.6;}
`

/**
 * A label/value row that swaps into an editor in place, saves, and swaps back.
 *
 * **It never names a control.** The editor arrives as `edit`, so the same component serves a
 * `TextBox`, a `DatePicker`, a `Select` or anything added later - which is the whole difference from
 * `TextEditableField`, whose `TextBox` was written into it and could not be anything else.
 *
 * ```tsx
 * <EditableField
 *     label="Display name"
 *     value={name}
 *     display={(v) => v || <Text type="muted">Not set</Text>}
 *     edit={(draft) => <TextBox type="text" {...bindValue(draft)}/>}
 *     onSave={async (v) => { await api.saveName(v) }}
 * />
 * ```
 *
 * `T` flows through, so `value` and every callback agree on the type and a `DatePicker` field is
 * not quietly a string one.
 *
 * ⚠️ **A rejected save keeps the draft.** The alternative - returning to reading and dropping the
 * edit - throws away the reader's work at the exact moment they are told it did not save, which is
 * the worst moment to do it.
 */
export class EditableField<T> extends Component<EditableFieldAttrsType<T>> {
    #draft: RenderObject<T> | undefined
    #current: AnchorElement | undefined
    #error: string | undefined
    #saving = false

    /** Render this Component */
    override render(attrs: EditableFieldAttrsType<T>): HTMLDivElement {
        if (!areEditableFieldStylesMounted) {
            areEditableFieldStylesMounted = true
            mountStyles(editableFieldCss, "vtd/EditableField")
        }
        this.#draft = new RenderObject<T>(attrs.value.get())
        this.#current = this.#viewMode(attrs)
        return passthroughAttrsToElement<HTMLDivElement>(<div class="vtd-editable-field">{this.#current}</div>, attrs)
    }

    #swap(next: AnchorElement): void {
        if (this.#current) {
            this.#current = this.replaceChild(this.#current, next)
        }
    }

    #field(attrs: EditableFieldAttrsType<T>, body: RenderableElements): HTMLElement {
        return <FormField label={attrs.label} hint={attrs.hint} error={this.#error} required={attrs.required}>
            {body}
        </FormField> as HTMLElement
    }

    #viewMode(attrs: EditableFieldAttrsType<T>): HTMLElement {
        const value = attrs.value.get()
        const shown = attrs.display ? attrs.display(value) : String(value)
        return this.#field(attrs, <div class="vtd-editable-field-row">
            <span class="vtd-editable-field-value">{shown}</span>
            <span class="vtd-editable-field-controls">
                <Button type="secondary" ariaLabel={attrs.editLabel ?? "Edit"} onClick={() => {
                    this.#error = undefined
                    this.#draft = new RenderObject<T>(attrs.value.get())
                    this.#swap(this.#editMode(attrs))
                    // Focus the editor, so starting an edit from the keyboard lands in the control
                    // rather than leaving focus on a button that is no longer there
                    const control = this.#current?.querySelector?.("input, select, textarea") as HTMLElement | null
                    control?.focus()
                }}><EditableFieldThemeOptions.editSymbol/></Button>
            </span>
        </div>)
    }

    #editMode(attrs: EditableFieldAttrsType<T>): HTMLElement {
        const draft = this.#draft
        if (!draft) {
            return this.#viewMode(attrs)
        }
        const row = <div class="vtd-editable-field-row" onKeyDown={(event: KeyboardEvent) => {
            // Enter saves and Escape discards, the two keys a reader already expects from an inline
            // edit. Enter is skipped on a textarea, where it is how you type a second line.
            if (this.#saving) { return }
            if (event.key == "Escape") {
                event.preventDefault()
                this.#cancel(attrs)
            } else if (event.key == "Enter" && !(event.target instanceof HTMLTextAreaElement)) {
                event.preventDefault()
                void this.#confirm(attrs)
            }
        }}>
            <span class="vtd-editable-field-value">{attrs.edit(draft)}</span>
            <span class="vtd-editable-field-controls">
                <Button type="primary" ariaLabel={attrs.confirmLabel ?? "Save"}
                    onClick={() => { void this.#confirm(attrs) }}><EditableFieldThemeOptions.confirmSymbol/></Button>
                <Button type="secondary" ariaLabel={attrs.cancelLabel ?? "Cancel"}
                    onClick={() => { this.#cancel(attrs) }}><EditableFieldThemeOptions.cancelSymbol/></Button>
            </span>
        </div>
        return this.#field(attrs, row)
    }

    #cancel(attrs: EditableFieldAttrsType<T>): void {
        this.#error = undefined
        this.#draft = new RenderObject<T>(attrs.value.get())
        this.#swap(this.#viewMode(attrs))
    }

    async #confirm(attrs: EditableFieldAttrsType<T>): Promise<void> {
        const draft = this.#draft
        if (!draft || this.#saving) {
            return
        }
        const next = draft.get()
        if (!attrs.onSave) {
            attrs.value.set(next)
            this.#error = undefined
            this.#swap(this.#viewMode(attrs))
            return
        }
        this.#saving = true
        this.#setSavingClass(true)
        try {
            await attrs.onSave(next)
            attrs.value.set(next)
            this.#error = undefined
            this.#saving = false
            this.#setSavingClass(false)
            this.#swap(this.#viewMode(attrs))
        } catch (thrown) {
            // Stay in edit mode with the draft intact - see the note on the class
            this.#error = thrown instanceof Error ? thrown.message : String(thrown)
            this.#saving = false
            this.#setSavingClass(false)
            this.#swap(this.#editMode(attrs))
        }
    }

    #setSavingClass(saving: boolean): void {
        const root = this.#current?.parentElement
        root?.classList.toggle("vtd-editable-field-saving", saving)
        if (this.#current instanceof HTMLElement) {
            for (const button of this.#current.querySelectorAll("button")) {
                button.toggleAttribute("disabled", saving)
            }
        }
    }
}
