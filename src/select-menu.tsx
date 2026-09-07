import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Attrs type for `<SelectMenu/>` Component
 */
export type SelectMenuAttrsType<OptionType> = {
    /** `name` for a hidden `<input/>` that mirrors the selected value, for `<form>` submission */
    name?: string
    /** The full set of selectable options, in display order (required) */
    options: OptionType[]
    /** Extracts the value used to identify, select, and submit each option; must be unique per option (required) */
    getValue: (option: OptionType) => string
    /**
     * Renders one option's content - used for each entry in the open panel, and, unless
     * `renderValue` is given, for the trigger's display of the current selection too (required)
     */
    renderOption: (option: OptionType) => RenderableElements
    /** Renders the trigger's display of the current selection, when it should differ from the full `renderOption` content (e.g. a compact summary instead of a rich row) */
    renderValue?: (option: OptionType) => RenderableElements
    /** Value of the initially-selected option */
    value?: string
    /** Content shown in the trigger when no option is selected */
    placeholder?: RenderableElements
    /** Marks an option as unselectable */
    isOptionDisabled?: (option: OptionType) => boolean
    /** Is the whole control disabled? */
    disabled?: boolean
    /** Called with the newly selected option whenever the user picks one */
    onChange?: (option: OptionType, value: string) => void
} & IdAttr & StylePassthroughAttrs

let areSelectMenuStylesMounted = false

/**
 * A `<Select/>`-alike for when a plain text label per option isn't enough: each option (and,
 * optionally, the trigger's own display of the current selection) is rendered by a function you
 * provide, so options can carry icons, avatars, secondary text, or any other rich content - a
 * native `<select>`'s `<option>` can only ever display flattened text, which is what `Select`
 * wraps and what this component exists to get around.
 *
 * Not built on a native form control - there's no such thing as a rich-content native select -
 * so this owns its own open/closed state, keyboard navigation (Up/Down/Enter/Escape), and
 * outside-click dismissal by hand, following the same patterns as `Menu` and `Command`.
 *
 * `options`/`value` are read once, at construction, like `DataTable`/`Carousel`/every other
 * stateful `Component` in this package - pass a fresh `<SelectMenu options={...} value={...}/>`
 * (letting your own `refresh()` remount it) to show new data, rather than expecting an
 * already-mounted instance to pick up changed attrs on its own.
 */
export class SelectMenu<OptionType> extends Component<SelectMenuAttrsType<OptionType>> {
    #attrs: SelectMenuAttrsType<OptionType>
    #root: HTMLDivElement
    #triggerEl: HTMLButtonElement
    #valueEl: HTMLSpanElement
    #panelEl: HTMLUListElement
    #optionEls: HTMLLIElement[]
    #hiddenInput: HTMLInputElement | undefined
    #open = false
    #selectedValue: string | undefined
    #highlightedIndex = 0

    /** Close the panel if it's open and the click landed outside of this control */
    #handleDocumentClick = (event: MouseEvent) => {
        if (!this.#open) {
            return
        }
        if (event.target instanceof Node && this.#root.contains(event.target)) {
            return
        }
        this.#closePanel()
    }

    override mount() {
        document.addEventListener("click", this.#handleDocumentClick)
    }
    override unmount() {
        document.removeEventListener("click", this.#handleDocumentClick)
    }

    #isOptionDisabled(option: OptionType): boolean {
        return this.#attrs.isOptionDisabled?.(option) ?? false
    }

    #closePanel() {
        if (!this.#open) {
            return
        }
        this.#open = false
        this.#panelEl.classList.remove("vtd-select-menu-panel-open")
        this.#triggerEl.setAttribute("aria-expanded", "false")
    }

    #openPanel() {
        if (this.#open || this.#attrs.disabled) {
            return
        }
        this.#open = true
        this.#panelEl.classList.add("vtd-select-menu-panel-open")
        this.#triggerEl.setAttribute("aria-expanded", "true")
        const selectedIndex = this.#attrs.options.findIndex(option => this.#attrs.getValue(option) == this.#selectedValue)
        this.#setHighlighted(selectedIndex >= 0 ? selectedIndex : 0)
    }

    /** Moves the highlighted option, skipping disabled ones, and scrolls it into view - doesn't touch selection */
    #setHighlighted(index: number) {
        if (index < 0 || index >= this.#optionEls.length) {
            return
        }
        this.#highlightedIndex = index
        this.#optionEls.forEach((el, i) => el.classList.toggle("vtd-select-menu-option-highlighted", i == index))
        this.#optionEls[index]?.scrollIntoView({block: "nearest"})
    }

    /** Steps the highlight by `delta`, skipping disabled options, without wrapping past either end */
    #moveHighlighted(delta: number) {
        const options = this.#attrs.options
        let next = this.#highlightedIndex
        do {
            next = Math.max(0, Math.min(options.length - 1, next + delta))
        } while (this.#isOptionDisabled(options[next]) && next > 0 && next < options.length - 1)
        this.#setHighlighted(next)
    }

    #selectOption(option: OptionType) {
        if (this.#isOptionDisabled(option)) {
            return
        }
        const value = this.#attrs.getValue(option)
        this.#selectedValue = value
        if (this.#hiddenInput) {
            this.#hiddenInput.value = value
        }
        this.#updateSelectedClasses()
        this.#renderTriggerValue()
        this.#attrs.onChange?.(option, value)
        this.#closePanel()
        this.#triggerEl.focus()
    }

    #updateSelectedClasses() {
        this.#attrs.options.forEach((option, index) => {
            const isSelected = this.#attrs.getValue(option) == this.#selectedValue
            this.#optionEls[index].classList.toggle("vtd-select-menu-option-selected", isSelected)
            this.#optionEls[index].setAttribute("aria-selected", String(isSelected))
        })
    }

    /** Rewrites just the trigger's display content - never the trigger button itself, so it never loses focus */
    #renderTriggerValue() {
        const selected = this.#attrs.options.find(option => this.#attrs.getValue(option) == this.#selectedValue)
        if (!selected) {
            this.#valueEl.replaceChildren(<span class="vtd-select-menu-placeholder" style={{display: "contents"}}>{this.#attrs.placeholder}</span>)
            return
        }
        const renderValue = this.#attrs.renderValue || this.#attrs.renderOption
        this.#valueEl.replaceChildren(<span style={{display: "contents"}}>{renderValue(selected)}</span>)
    }

    #handleTriggerKeyDown = (event: KeyboardEvent) => {
        if (event.key == "ArrowDown") {
            event.preventDefault()
            this.#open ? this.#moveHighlighted(1) : this.#openPanel()
        } else if (event.key == "ArrowUp") {
            event.preventDefault()
            this.#open ? this.#moveHighlighted(-1) : this.#openPanel()
        } else if (event.key == "Enter" || event.key == " ") {
            event.preventDefault()
            if (!this.#open) {
                this.#openPanel()
                return
            }
            const option = this.#attrs.options[this.#highlightedIndex]
            if (option) {
                this.#selectOption(option)
            }
        } else if (event.key == "Escape" && this.#open) {
            event.preventDefault()
            this.#closePanel()
        }
    }

    /** Create a new `<SelectMenu/>` Component */
    constructor(attrs: SelectMenuAttrsType<OptionType>, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs
        this.#selectedValue = attrs.value

        if (!areSelectMenuStylesMounted) {
            areSelectMenuStylesMounted = true
            setStylesheet(`
.vtd-select-menu{position:relative;display:inline-block;}
.vtd-select-menu-trigger{
display:inline-flex;
align-items:center;
gap:0.75em;
min-width:8em;
max-width:100%;
box-sizing:border-box;
padding:0.5ex 1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
text-align:start;
cursor:pointer;
}
.vtd-select-menu-trigger:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-select-menu-trigger:focus-visible{border:1px solid var(--primary);outline-color:var(--primary);}
.vtd-select-menu-value{flex-grow:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.vtd-select-menu-placeholder{opacity:0.6;}
.vtd-select-menu-chevron{
flex-shrink:0;
width:0.6em;
height:0.6em;
border:solid var(--text);
border-width:0 0.12em 0.12em 0;
transform:rotate(45deg);
margin-block-start:-0.3em;
}
.vtd-select-menu-panel{
position:absolute;
top:100%;
left:0;
z-index:1;
min-width:max(100%, 14em);
box-sizing:border-box;
margin:0;
margin-block-start:0.25em;
padding:0.25em;
max-height:16em;
overflow:auto;
list-style:none;
background-color:var(--background-1);
border:1px solid var(--background-4);
border-radius:0.25rem;
box-shadow:0 2px 8px rgba(0,0,0,0.15);
display:none;
}
.vtd-select-menu-panel-open{display:block;}
.vtd-select-menu-option{padding:0.5em 0.75em;border-radius:0.25rem;cursor:pointer;}
.vtd-select-menu-option-highlighted{background-color:var(--background-2);}
.vtd-select-menu-option-selected{background-color:var(--primary-3);}
.vtd-select-menu-option-disabled{opacity:0.5;cursor:not-allowed;}
`, "vtd/SelectMenu")
        }

        this.#optionEls = attrs.options.map(option => {
            const el: HTMLLIElement = <li
                role="option"
                aria-disabled={this.#isOptionDisabled(option) ? "true" : undefined}
                class={`vtd-select-menu-option${this.#isOptionDisabled(option) ? " vtd-select-menu-option-disabled" : ""}`}
                onClick={() => this.#selectOption(option)}
                onPointerEnter={() => { if (!this.#isOptionDisabled(option)) { this.#setHighlighted(this.#attrs.options.indexOf(option)) } }}>
                {attrs.renderOption(option)}
            </li>
            return el
        })

        this.#valueEl = <span class="vtd-select-menu-value"/>
        this.#panelEl = <ul class="vtd-select-menu-panel" role="listbox">{this.#optionEls}</ul>
        this.#triggerEl = <button
            type="button"
            class="vtd-select-menu-trigger"
            disabled={attrs.disabled}
            aria-haspopup="listbox"
            aria-expanded="false"
            onClick={() => { this.#open ? this.#closePanel() : this.#openPanel() }}
            onKeyDown={this.#handleTriggerKeyDown}
            onBlur={() => {
                globalThis.setTimeout(() => {
                    if (!this.#root.contains(document.activeElement)) { this.#closePanel() }
                }, 0)
            }}>
            {this.#valueEl}
            <span class="vtd-select-menu-chevron" aria-hidden="true"/>
        </button>

        this.#hiddenInput = attrs.name ? <input type="hidden" name={attrs.name} value={this.#selectedValue ?? ""}/> : undefined

        this.#root = <div class="vtd-select-menu">
            {this.#triggerEl}
            {this.#hiddenInput}
            {this.#panelEl}
        </div>

        this.#updateSelectedClasses()
        this.#renderTriggerValue()

        passthroughAttrsToElement<HTMLDivElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLDivElement {
        return this.#root
    }
}
