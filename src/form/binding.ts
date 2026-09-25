import type { RenderObject } from "../core/velotype.ts"

/**
 * Wires a `RenderObject` to a form control's own props, for any control in the package.
 *
 * Spread the result onto the control:
 *
 * ```tsx
 * const name = new RenderObject("")
 * <FormField label="Display name"><TextBox type="text" {...bindValue(name)}/></FormField>
 * <FormField label="Volume"><Slider min={0} max={100} {...bindValue(volume)}/></FormField>
 * <FormField label="Terms"><Checkbox {...bindChecked(agreed)}/></FormField>
 * ```
 *
 * **Helpers rather than a wrapper component, because controls do not agree on where their state
 * lives.** Most carry it on `value`, `Checkbox` and `Toggle` on `checked`, and `Upload` has no
 * value property at all - its files arrive only on the event. Anything that tried to hide that
 * difference would need a union over every control in the package and an edit every time one is
 * added. Naming the three shapes instead costs one word at the call site and works with controls
 * that do not exist yet.
 *
 * Two facts about spreading make this work, both verified against the components rather than
 * assumed: a handler typed on the broad `Event` satisfies a control's narrower
 * `TargetedInputEvent<HTMLInputElement>` slot, because parameters are checked contravariantly; and
 * a prop the control does not declare is not an error in a JSX spread, so the same object serves
 * `TextBox`, which fires `input`, and `Select`, which does not.
 *
 * ⚠️ **What the compiler does and does not catch.** Handing a helper the wrong kind of field is a
 * type error - `bindValue` on a `RenderObject<boolean>`, `bindChecked` on a `RenderObject<number>`.
 * Spreading the *result* onto the wrong control is not: `{...bindChecked(flag)}` on a `Slider`
 * compiles, because `checked` is simply an undeclared prop and undeclared props are allowed in a
 * spread. That is the same permissiveness the design relies on, so it cannot be had both ways;
 * match the helper to the control's own state property, which is what its name says.
 */

/** What `bindValue` spreads onto a control */
export type ValueBinding<T extends string | number> = {
    value: T
    onInput: (event: Event) => void
    onChange: (event: Event) => void
}

/** What `bindChecked` spreads onto a `Checkbox` or `Toggle` */
export type CheckedBinding = {
    checked: boolean
    onChange: (event: Event) => void
}

/** What `bindFiles` spreads onto an `Upload` */
export type FilesBinding = {
    onChange: (event: Event) => void
}

/** When the field is written: live as the reader types, or once they commit (blur, Enter, pick) */
export type BindWhen = "input" | "change"

function readValue<T extends string | number>(target: EventTarget | null, current: T): T | undefined {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
        return undefined
    }
    if (typeof current != "number") {
        return target.value as T
    }
    // A number field takes the parsed number, not the string - `RenderObject<number>` has no way to
    // hold "12a" or "". An empty or unparseable control keeps the field's last valid value rather
    // than writing NaN, which would render as "NaN" and poison every later comparison.
    const parsed = target instanceof HTMLInputElement ? target.valueAsNumber : Number(target.value)
    return Number.isNaN(parsed) ? undefined : (parsed as T)
}

/**
 * Binds a `RenderObject<string>` or `RenderObject<number>` to a control that carries its state on
 * `value` - `TextBox`, `Textarea`, `Select`, `SelectMenu`, `Combobox`, `Slider`, `InputNumber`,
 * `Rate`, `DatePicker`, `DateTimePicker`, `ColorPicker`.
 *
 * Writes on both `input` and `change` by default, and that is deliberate: a control that only fires
 * one of the two is common - `Select` and `Rate` never fire `input` - so listening to a single
 * event is a field that silently never updates. Writes are skipped when the value has not actually
 * changed, so hearing both costs nothing. Pass `{when: "change"}` for commit-on-blur instead of
 * live editing, which is the one case where the difference is a real choice.
 */
export function bindValue<T extends string | number>(
    field: RenderObject<T>,
    options?: {when?: BindWhen}
): ValueBinding<T> {
    const write = (event: Event) => {
        const next = readValue(event.target, field.get())
        if (next !== undefined && next !== field.get()) {
            field.set(next)
        }
    }
    const ignore = () => {}
    return {
        value: field.get(),
        onInput: options?.when == "change" ? ignore : write,
        onChange: write,
    }
}

/**
 * Binds a `RenderObject<boolean>` to a control that carries its state on `checked` - `Checkbox` and
 * `Toggle`.
 *
 * Their `value` attr is the string submitted with a form, not the state, which is exactly the
 * confusion this helper exists to stop.
 */
export function bindChecked(field: RenderObject<boolean>): CheckedBinding {
    return {
        checked: field.get(),
        onChange: (event: Event) => {
            if (event.target instanceof HTMLInputElement && event.target.checked != field.get()) {
                field.set(event.target.checked)
            }
        },
    }
}

/**
 * Binds a `RenderObject<File[]>` to an `Upload`.
 *
 * Nothing is spread back onto the control: a file input's selection cannot be set from script, so
 * the binding is one-way by the platform's rules rather than by choice.
 */
export function bindFiles(field: RenderObject<File[]>): FilesBinding {
    return {
        onChange: (event: Event) => {
            if (event.target instanceof HTMLInputElement) {
                field.set(Array.from(event.target.files ?? []))
            }
        },
    }
}
