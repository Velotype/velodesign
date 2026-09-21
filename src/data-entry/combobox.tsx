import {Component, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, RenderableElements, StylePassthroughAttrs, TargetedEvent, TargetedInputEvent } from "../core/velotype.ts"
import { highlightMatch, searchHighlightCss } from "../core/search-highlight.tsx"
import { CommonThemeOptions } from "../core/theme-options.ts"

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
    /**
     * Shown in the panel when the query matches no option (default:
     * `CommonThemeOptions.emptySymbol` - a glyph, not English text, so the library doesn't assume
     * a language). Set it to real wording for your users.
     */
    noMatchMessage?: RenderableElements
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

/**
 * A free-text input with a searchable dropdown of suggestions - still a real, freely-editable
 * `<input/>` (unlike `Select`/`SelectMenu`, typing any value not in `options` is allowed), but
 * with a custom-themed suggestion panel instead of the browser's own native `<datalist/>`
 * popup, so it looks and behaves consistently with `Menu`/`SelectMenu`/`Command` rather than
 * whatever the browser's UA styles a `<datalist/>` with (unstyled, un-themed, and inconsistent
 * across browsers).
 *
 * Owns its own open/closed panel state, keyboard navigation (Up/Down/Enter/Escape), and
 * outside-click dismissal by hand, following the same patterns as `SelectMenu`/`Command`.
 * Picking a suggestion (click or Enter) sets the input's value and dispatches real `input`/
 * `change` events on it, so `onInput`/`onChange` fire the same way whether the user typed or
 * picked a suggestion.
 */
export class Combobox extends Component<ComboboxAttrsType> {
    #attrs: ComboboxAttrsType
    #root: HTMLSpanElement
    #inputEl: HTMLInputElement
    #panelEl: HTMLUListElement
    #optionEls: HTMLLIElement[] = []
    #open = false
    #highlightedIndex = 0

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

    /** Options matching the input's current value (all options if it's empty) */
    #filteredOptions(): ComboboxOptionType[] {
        const query = this.#inputEl.value.trim().toLowerCase()
        if (!query) {
            return this.#attrs.options
        }
        return this.#attrs.options.filter(option => (option.label || option.value).toLowerCase().includes(query))
    }

    #closePanel() {
        if (!this.#open) {
            return
        }
        this.#open = false
        this.#panelEl.classList.remove("vtd-combobox-panel-open")
    }

    #openPanel() {
        if (this.#open || this.#attrs.disabled) {
            return
        }
        this.#open = true
        this.#panelEl.classList.add("vtd-combobox-panel-open")
    }

    /** Moves the highlight to `index` by toggling a class on the already-built option elements,
     * rather than rebuilding the list - `onPointerEnter` needs this to stay a lightweight,
     * targeted update: rebuilding the whole list on every hover (as this used to) replaces the
     * very `<li>` the pointer is over mid-interaction, which silently swallows the click that's
     * about to land on it. */
    #setHighlighted(index: number) {
        this.#highlightedIndex = index
        this.#optionEls.forEach((el, i) => el.classList.toggle("vtd-combobox-option-highlighted", i == index))
        // The panel scrolls, so the highlight has to be brought along or arrowing down past the
        // visible options moves something nobody can see. `nearest` leaves an already-visible
        // highlight where it is rather than recentring the list under the reader.
        this.#optionEls[index]?.scrollIntoView({block: "nearest"})
    }

    /** Rebuilds the visible suggestion list to match the input's current value and highlight */
    #renderOptions() {
        const options = this.#filteredOptions()
        if (this.#highlightedIndex >= options.length) {
            this.#highlightedIndex = Math.max(0, options.length - 1)
        }
        if (options.length == 0) {
            this.#optionEls = []
            this.#panelEl.replaceChildren(<li class="vtd-combobox-empty">{this.#attrs.noMatchMessage ?? <CommonThemeOptions.emptySymbol/>}</li>)
            return
        }
        const query = this.#inputEl.value.trim()
        this.#optionEls = options.map((option, index) => <li
            role="option"
            aria-selected={index == this.#highlightedIndex}
            class={`vtd-combobox-option${index == this.#highlightedIndex ? " vtd-combobox-option-highlighted" : ""}`}
            onClick={() => this.#selectOption(option)}
            onPointerEnter={() => this.#setHighlighted(index)}>
            {query ? highlightMatch(option.label || option.value, query) : (option.label || option.value)}
        </li>)
        this.#panelEl.replaceChildren(...this.#optionEls)
    }

    #selectOption(option: ComboboxOptionType) {
        this.#inputEl.value = option.value
        this.#inputEl.dispatchEvent(new Event("input", {bubbles: true}))
        this.#inputEl.dispatchEvent(new Event("change", {bubbles: true}))
        this.#closePanel()
        this.#inputEl.focus()
    }

    #handleInput = (event: TargetedInputEvent<HTMLInputElement>) => {
        this.#highlightedIndex = 0
        this.#openPanel()
        this.#renderOptions()
        this.#attrs.onInput?.(event)
    }

    #handleKeyDown = (event: KeyboardEvent) => {
        if (event.key == "ArrowDown") {
            event.preventDefault()
            if (!this.#open) {
                this.#openPanel()
                this.#renderOptions()
                return
            }
            const options = this.#filteredOptions()
            this.#setHighlighted(Math.min(this.#highlightedIndex + 1, options.length - 1))
        } else if (event.key == "ArrowUp") {
            event.preventDefault()
            if (!this.#open) {
                this.#openPanel()
                this.#renderOptions()
                return
            }
            this.#setHighlighted(Math.max(this.#highlightedIndex - 1, 0))
        } else if (event.key == "Enter") {
            if (!this.#open) {
                return
            }
            const option = this.#filteredOptions()[this.#highlightedIndex]
            if (option) {
                event.preventDefault()
                this.#selectOption(option)
            }
        } else if (event.key == "Escape" && this.#open) {
            event.preventDefault()
            this.#closePanel()
        }
    }

    /** Create a new `<Combobox/>` Component */
    constructor(attrs: ComboboxAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#attrs = attrs

        if (!areComboboxStylesMounted) {
            areComboboxStylesMounted = true
            mountStyles(
`
.vtd-combobox-wrapper{position:relative;display:inline-block;}
.vtd-combobox{
display:block;
width:100%;
box-sizing:border-box;
padding:0.5ex 1ex;
border-radius:0.25rem;
border:1px solid var(--background-5);
background-color:var(--background-1);
color:var(--text);
font:inherit;
}
.vtd-combobox:disabled{cursor:not-allowed;opacity:0.6;}
.vtd-combobox-panel{
position:absolute;
top:100%;
left:0;
z-index:1000;
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
.vtd-combobox-panel-open{display:block;}
.vtd-combobox-option{padding:0.5em 0.75em;border-radius:0.25rem;cursor:pointer;}
` +
/* The keyboard's position in the list - see Menu for why this is a tint and not a ring */
`
.vtd-combobox-option-highlighted{background-color:var(--primary-3);}
.vtd-combobox-empty{padding:0.75em;text-align:center;opacity:0.6;}
${searchHighlightCss}
`, "vtd/Combobox")
        }

        // tabindex=-1 because a scrolling listbox is otherwise a dead tab stop. Chrome makes any
        // scrollable element focusable when it has no focusable children, which is right for a
        // region a reader has to scroll themselves and wrong here: the arrow keys already move the
        // highlight and bring it into view, so tabbing into the panel lands somewhere with nothing
        // to do and one more Tab to get out of.
        this.#panelEl = <ul class="vtd-combobox-panel" role="listbox" tabindex={-1}/>
        this.#inputEl = <input
            type="text"
            class="vtd-combobox"
            name={attrs.name}
            value={attrs.value}
            placeholder={attrs.placeholder}
            disabled={attrs.disabled}
            required={attrs.required}
            autocomplete="off"
            role="combobox"
            aria-expanded="false"
            onInput={this.#handleInput}
            onChange={attrs.onChange}
            onKeyDown={this.#handleKeyDown}
            onFocus={() => { this.#openPanel(); this.#renderOptions() }}/>

        this.#root = <span class="vtd-combobox-wrapper">
            {this.#inputEl}
            {this.#panelEl}
        </span>

        passthroughAttrsToElement<HTMLSpanElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLSpanElement {
        return this.#root
    }
}
