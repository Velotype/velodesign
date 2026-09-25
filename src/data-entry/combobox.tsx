import {Component, passthroughAttrsToElement, RenderObjectArray} from "../core/velotype.ts"
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
    /**
     * Text matched against the query, when the option should be findable by more than it shows.
     *
     * Defaults to `label`, or to `value`. The showcase's own component search sets it to
     * `"Button Form"` so that typing a category finds everything in it, while the row still reads
     * "Button".
     */
    searchText?: string
    /**
     * Called when this option is picked, by click or Enter, after the input has taken its value.
     *
     * This is what makes the panel a way of *going somewhere* rather than only a way of filling in
     * the box - without it, picking an option sets the text and nothing else happens.
     */
    onSelect?: () => void
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
    /**
     * Draws an option as markup - an icon, a trailing category - instead of its label text.
     *
     * Given the current `query` as well as the option, because **the match has to stay visible**:
     * the default rendering marks the part of the label the query matched, and a custom one that
     * ignored the query would silently drop that feedback. Pass the query through `highlightMatch`
     * on whichever text the reader is searching:
     *
     * ```tsx
     * renderOption={(option, query) => <span class="row">
     *     <I i={iconFor(option)}/>
     *     <span>{highlightMatch(option.label ?? option.value, query)}</span>
     *     <Text type="muted">{groupOf(option)}</Text>
     * </span>}
     * ```
     *
     * Named to match `SelectMenu`'s, which does the same job for the same reason.
     */
    renderOption?: (option: ComboboxOptionType, query: string) => RenderableElements
    /**
     * Empties the input after a pick, instead of leaving the chosen value in it (default: `false`).
     *
     * For a box that *finds* something rather than fills in a field - a jump-to search, paired with
     * `onSelect`. Leaving the last thing picked sitting in the box means the reader has to clear it
     * before searching again, and makes a pick that goes nowhere new - the page they are already on
     * - look as though nothing happened at all.
     *
     * No further `input` event is emitted for the clear: the pick already reported its value
     * through `input`/`change`, and a trailing empty one would read as the reader erasing the box.
     */
    clearOnSelect?: boolean
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

/** Stylesheet for `<Combobox/>`, mounted once on first construction */
const comboboxCss: string = `
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
`

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
    #emptyEl: HTMLLIElement
    /** The visible suggestions. The wrapper element it renders into is `#panelEl` */
    #options: RenderObjectArray<ComboboxOptionType>
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
    /** The text an option is matched against, and highlighted in. Markup labels need `searchText` */
    static #optionText(option: ComboboxOptionType): string {
        return option.searchText ?? option.label ?? option.value
    }

    #filteredOptions(): ComboboxOptionType[] {
        const query = this.#inputEl.value.trim().toLowerCase()
        if (!query) {
            return this.#attrs.options
        }
        return this.#attrs.options.filter(option => Combobox.#optionText(option).toLowerCase().includes(query))
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
        const optionEls = this.#optionElements()
        optionEls.forEach((el, i) => {
            el.classList.toggle("vtd-combobox-option-highlighted", i == index)
            el.setAttribute("aria-selected", String(i == index))
        })
        // The panel scrolls, so the highlight has to be brought along or arrowing down past the
        // visible options moves something nobody can see. `nearest` leaves an already-visible
        // highlight where it is rather than recentring the list under the reader.
        optionEls[index]?.scrollIntoView({block: "nearest"})
    }

    /** The option rows currently drawn, read from the DOM rather than kept in a parallel array */
    #optionElements(): HTMLLIElement[] {
        return [...this.#panelEl.querySelectorAll("li.vtd-combobox-option")] as HTMLLIElement[]
    }

    /**
     * Rebuilds the visible suggestion list to match the input's current value and highlight
     *
     * ⚠️ `deleteAt` + `pushAll`, never `clear()` or `set()`. Those two re-run the wrapper's own
     * render function and replace the wrapper element, which would leave `#panelEl` pointing at a
     * `<ul>` no longer on the page - and with it the open/closed class and the scroll position.
     * `deleteAt` and `push` only touch the items.
     */
    #renderOptions() {
        const options = this.#filteredOptions()
        if (this.#highlightedIndex >= options.length) {
            this.#highlightedIndex = Math.max(0, options.length - 1)
        }
        // Guarded because `deleteAt(0, 0)` deletes one row rather than none
        if (this.#options.length > 0) {
            this.#options.deleteAt(0, this.#options.length)
        }
        // The empty row is not an option, so it lives beside the list rather than in it, and is
        // hidden rather than removed - it holds consumer content, and taking it off the page would
        // release a vtKey that showing it again would need
        this.#emptyEl.hidden = options.length > 0
        this.#options.pushAll(options)
        this.#setHighlighted(this.#highlightedIndex)
    }

    /**
     * What an option draws.
     *
     * The label is highlighted where the query matched, so the reader can see *why* a row survived
     * - the same helper the sidebar, Command and both tables use. A `renderOption` is handed the
     * query for exactly that reason, rather than being left to draw a row with no feedback in it.
     */
    /** One suggestion row. Called by `#options` for each item it renders */
    #renderOption(option: ComboboxOptionType): HTMLLIElement {
        const row: HTMLLIElement = <li
            role="option"
            aria-selected="false"
            class="vtd-combobox-option"
            onClick={() => this.#selectOption(option)}
            onPointerEnter={() => this.#setHighlighted(this.#options.value.findIndex((item) => item.value == option))}>
            {this.#optionContent(option, this.#inputEl.value.trim())}
        </li>
        return row
    }

    #optionContent(option: ComboboxOptionType, query: string): RenderableElements {
        if (this.#attrs.renderOption) {
            return this.#attrs.renderOption(option, query)
        }
        const text = option.label ?? option.value
        return query ? highlightMatch(text, query) : text
    }

    #selectOption(option: ComboboxOptionType) {
        this.#inputEl.value = option.value
        this.#inputEl.dispatchEvent(new Event("input", {bubbles: true}))
        this.#inputEl.dispatchEvent(new Event("change", {bubbles: true}))
        this.#closePanel()
        this.#inputEl.focus()
        // Last, so a handler that navigates away sees the input already settled - and so the
        // panel is shut before anything it might do to the page happens
        option.onSelect?.()
        if (this.#attrs.clearOnSelect) {
            // Set directly rather than dispatched: `#handleInput` would reopen the panel on an
            // empty query, which is the whole list, immediately after the reader chose one of them
            this.#inputEl.value = ""
        }
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
            mountStyles(comboboxCss, "vtd/Combobox")
        }

        // `wrapperElementTag`, so the `<ul>` velotype builds for the list *is* the panel - no
        // element sits between `role="listbox"` and the `role="option"` rows it owns.
        this.#options = new RenderObjectArray<ComboboxOptionType>({
            wrapperElementTag: "ul",
            // tabindex=-1 because a scrolling listbox is otherwise a dead tab stop. Chrome makes
            // any scrollable element focusable when it has no focusable children, which is right
            // for a region a reader has to scroll themselves and wrong here: the arrow keys already
            // move the highlight and bring it into view, so tabbing into the panel lands somewhere
            // with nothing to do and one more Tab to get out of.
            wrapperAttrs: {class: "vtd-combobox-panel", role: "listbox", tabindex: -1},
            renderFunction: (option: ComboboxOptionType) => this.#renderOption(option)
        })
        this.#emptyEl = <li class="vtd-combobox-empty" hidden>{attrs.noMatchMessage ?? <CommonThemeOptions.emptySymbol/>}</li>
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
            {this.#options}
        </span>

        // The wrapper element only exists once the list has been rendered, which embedding above
        // just did. One instance, so one element.
        this.#panelEl = this.#options.getElements()[0] as HTMLUListElement
        // Plain `appendChild` is correct here: nothing is on the page yet, so nothing needs
        // mounting, and `#emptyEl` is not an array item for `deleteAt` to take away again
        this.#panelEl.appendChild(this.#emptyEl)

        passthroughAttrsToElement<HTMLSpanElement>(this.#root, attrs)
    }

    /** Render this Component */
    override render(): HTMLSpanElement {
        return this.#root
    }
}
