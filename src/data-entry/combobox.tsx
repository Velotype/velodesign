/** @jsxRuntime classic */
/** @jsx h */
import { h } from "../core/jsx.ts"
import {Component, passthroughAttrsToElement} from "../core/velotype.ts"
import { mountStyles } from "../core/styles.ts"
import type { IdAttr, RenderableElements, StylePassthroughAttrs, TargetedEvent, TargetedInputEvent } from "../core/velotype.ts"
import { highlightMatch, searchHighlightCss } from "../core/search-highlight.tsx"
import { CommonThemeOptions } from "../core/theme-options.ts"
import { keepPlaced, placeInView } from "../core/placement.ts"
import type { PlaceInViewOptions } from "../core/placement.ts"

/**
 * A single suggestion in a `<Combobox/>`
 */
export type ComboboxOptionType = {
    /** Value suggested/submitted for this option */
    value: string
    /** Displayed label for this option (defaults to `value`) */
    label?: string
    /** A second, quieter line under the label - an address under a place's name, say */
    detail?: string
    /**
     * Before the label - an avatar's initials, a small icon - so what kind of thing each option is
     * shows at a glance
     */
    leading?: RenderableElements
    /**
     * The heading this option sits under. Options with the same group are shown together, under a
     * heading of that name, the groups in the order they first appear; screen readers hear each
     * as a group of that name. Options without one come first, under no heading.
     */
    group?: string
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
    /** Maximum number of characters accepted */
    maxLength?: number
    /** Is the combobox disabled? */
    disabled?: boolean
    /**
     * Narrow `options` to what's typed (default true). Set false when the options are already
     * the matches - suggestions fetched for the query as it's typed and handed in with
     * `setOptions()` - so they're shown as given, in the order given.
     */
    filter?: boolean
    /**
     * Keep the panel closed while there's nothing to suggest, instead of showing `noMatchMessage`
     * (default false). For a field where suggestions are a shortcut and typing something new is
     * normal - a place, a person - an empty panel under every keystroke is in the way.
     */
    hideWhenEmpty?: boolean
    /** Called with the option itself when one is picked (after the input's `input` and `change` events) */
    onSelectOption?: (option: ComboboxOptionType) => void
    /** Callback for onInput event */
    onInput?: (event: TargetedInputEvent<HTMLInputElement>) => void
    /** Callback for onChange event */
    onChange?: (event: TargetedEvent<HTMLInputElement, Event>) => void
} & IdAttr & StylePassthroughAttrs

let areComboboxStylesMounted = false

/** An option's row in the list: its element, the span its highlighted label goes in, and the query that's highlighted there */
type ComboboxRow = {element: HTMLLIElement, text: HTMLSpanElement, query: string}

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
 *
 * **The list is as wide as its suggestions need**, from the input's width (or 14em) up to 26em
 * and never past the window's edges - a name and an address on one line read better than either
 * squeezed into the width of a narrow field. Past that, a long word wraps rather than overflows.
 *
 * **The list keeps itself in view** (`core/placement.ts`): below the input, or above it when
 * there's no room below; shorter, scrolling, when there's room for all of it on neither side; slid
 * in from a side edge. Placed on open, each time its suggestions change, and on a scroll or a
 * resize while open.
 */
export class Combobox extends Component<ComboboxAttrsType> {
    #attrs: ComboboxAttrsType
    #root: HTMLSpanElement
    #inputEl: HTMLInputElement
    #panelEl: HTMLUListElement
    #optionEls: HTMLLIElement[] = []
    #open = false
    /** Stops placing the list again as the page moves - set while it's open */
    #stopPlacing: (() => void) | undefined

    #placing: PlaceInViewOptions = {side: "bottom", scrolls: true, setSide: side => { this.#panelEl.classList.toggle("vtd-combobox-panel-above", side === "top") }}

    #place = () => {
        placeInView(this.#panelEl, this.#placing)
    }
    #highlightedIndex = 0
    /** Tells one combobox's group headings from another's, for `aria-labelledby` */
    static #groupIds = 0

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
        this.#stopPlacing?.()
        this.#stopPlacing = undefined
    }

    /** Options matching the input's current value (all options if it's empty) */
    #filteredOptions(): ComboboxOptionType[] {
        const query = this.#inputEl.value.trim().toLowerCase()
        if (!query || this.#attrs.filter === false) {
            return this.#attrs.options
        }
        return this.#attrs.options.filter(option => (option.label || option.value).toLowerCase().includes(query))
    }

    /**
     * The options as listed, top to bottom - grouped ones together under their group, in the order
     * the groups first appear - which is the order the arrow keys move through
     */
    #shownOptions(): ComboboxOptionType[] {
        return this.#grouped(this.#filteredOptions())
    }

    /** `options` with grouped ones together under their group, in the order the groups first appear */
    #grouped(options: ComboboxOptionType[]): ComboboxOptionType[] {
        if (!options.some(option => option.group)) {return options}
        const groups: (string | undefined)[] = [undefined]
        for (const option of options) {if (!groups.includes(option.group)) {groups.push(option.group)}}
        return groups.flatMap(group => options.filter(option => option.group === group))
    }

    #closePanel() {
        if (!this.#open) {
            return
        }
        this.#open = false
        this.#panelEl.classList.remove("vtd-combobox-panel-open")
        this.#stopPlacing?.()
        this.#stopPlacing = undefined
    }

    #openPanel() {
        if (this.#open || this.#attrs.disabled) {
            return
        }
        this.#open = true
        this.#panelEl.classList.add("vtd-combobox-panel-open")
        this.#place()
        this.#stopPlacing = keepPlaced(this.#panelEl, () => [[this.#panelEl, this.#placing]])
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

    /**
     * Each option's row, for the options as last given: built when they are given, and kept, so
     * typing hides and shows rows in place. An option's `leading` and `detail` are the consumer's
     * own elements, handed over once, so a row that left the page would take them along and
     * unmount them - and they could never be put back. `setOptions()` builds the new rows before
     * the old ones go, so an element handed over again moves into its new row first.
     */
    #rows: Map<ComboboxOptionType, ComboboxRow> | undefined
    #rowsFor: ComboboxOptionType[] | undefined
    /** Each group's wrapping row, with the options in it - hidden when none of them is shown */
    #groupEls: {element: HTMLLIElement, options: ComboboxOptionType[]}[] = []
    /** The no-match row, kept for the same reason - `noMatchMessage` is handed over once too */
    #emptyEl: HTMLLIElement | undefined

    /** Shows the suggestions matching the input's current value, and the highlight */
    #renderOptions() {
        const options = this.#shownOptions()
        if (this.#highlightedIndex >= options.length) {
            this.#highlightedIndex = Math.max(0, options.length - 1)
        }
        if (this.#rowsFor !== this.#attrs.options) {this.#buildRows()}
        const rows = this.#rows as Map<ComboboxOptionType, ComboboxRow>
        if (options.length == 0 && this.#attrs.hideWhenEmpty) {
            this.#optionEls = []
            this.#closePanel()
            return
        }
        const query = this.#attrs.filter !== false ? this.#inputEl.value.trim() : ""
        const shown = new Set(options)
        this.#optionEls = options.map(option => (rows.get(option) as {element: HTMLLIElement}).element)
        rows.forEach((row, option) => {
            const visible = shown.has(option)
            if (row.element.hidden === visible) {row.element.hidden = !visible}
            if (visible && row.query !== query) {
                const label = option.label || option.value
                this.replaceChildrenOfChild(row.text, query ? highlightMatch(label, query) : [label])
                row.query = query
            }
        })
        for (const group of this.#groupEls) {
            const visible = group.options.some(option => shown.has(option))
            if (group.element.hidden === visible) {group.element.hidden = !visible}
        }
        this.#optionEls.forEach((element, index) => {
            element.classList.toggle("vtd-combobox-option-highlighted", index == this.#highlightedIndex)
            element.setAttribute("aria-selected", String(index == this.#highlightedIndex))
        })
        const empty = this.#emptyEl as HTMLLIElement
        if (empty.hidden !== options.length > 0) {empty.hidden = options.length > 0}
        // A different list is a different size: placed again for it
        if (this.#open) {this.#place()}
    }

    /** One row per option, grouped ones under their group's heading, in the order they're listed */
    #buildRows() {
        const options = this.#attrs.options
        const rows: Map<ComboboxOptionType, ComboboxRow> = new Map()
        const ordered = this.#grouped(options)
        for (const option of ordered) {
            const text: HTMLSpanElement = <span>{option.label || option.value}</span>
            const element: HTMLLIElement = <li
                role="option"
                aria-selected={false}
                class="vtd-combobox-option"
                onClick={() => this.#selectOption(option)}
                onPointerEnter={() => this.#setHighlighted(this.#optionEls.indexOf(element))}>
                {option.leading ? <span class="vtd-combobox-option-leading">{option.leading}</span> : null}
                <span class="vtd-combobox-option-text">
                    {text}
                    {option.detail ? <span class="vtd-combobox-option-detail">{option.detail}</span> : null}
                </span>
            </li>
            rows.set(option, {element, text, query: ""})
        }
        // Grouped options sit in a role="group" list named by their heading; the rest stand alone
        const items: HTMLElement[] = []
        this.#groupEls = []
        let at = 0
        while (at < ordered.length) {
            const group = ordered[at].group
            let end = at
            while (end < ordered.length && ordered[end].group === group) {end++}
            const members = ordered.slice(at, end)
            const els = members.map(option => (rows.get(option) as {element: HTMLLIElement}).element)
            if (group === undefined) {
                items.push(...els)
            } else {
                const id = `vtd-combobox-group-${++Combobox.#groupIds}`
                const element: HTMLLIElement = <li role="presentation" class="vtd-combobox-group">
                    <div class="vtd-combobox-group-label" id={id}>{group}</div>
                    <ul role="group" aria-labelledby={id}>{els}</ul>
                </li>
                items.push(element)
                this.#groupEls.push({element, options: members})
            }
            at = end
        }
        const empty: HTMLLIElement = this.#emptyEl ?? <li class="vtd-combobox-empty" hidden>{this.#attrs.noMatchMessage ?? <CommonThemeOptions.emptySymbol/>}</li>
        this.#emptyEl = empty
        this.replaceChildrenOfChild(this.#panelEl, [...items, empty])
        this.#rows = rows
        this.#rowsFor = options
    }

    #selectOption(option: ComboboxOptionType) {
        this.#inputEl.value = option.value
        this.#inputEl.dispatchEvent(new Event("input", {bubbles: true}))
        this.#inputEl.dispatchEvent(new Event("change", {bubbles: true}))
        this.#closePanel()
        this.#inputEl.focus()
        this.#attrs.onSelectOption?.(option)
    }

    /**
     * Replaces the suggestions - for options that arrive as the reader types (with
     * `filter={false}`). The open list redraws in place; the input and what's typed are untouched.
     */
    setOptions(options: ComboboxOptionType[]) {
        this.#attrs = {...this.#attrs, options}
        this.#highlightedIndex = 0
        if (document.activeElement === this.#inputEl && this.#inputEl.value.trim()) {this.#openPanel()}
        if (this.#open) {this.#renderOptions()}
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
            const options = this.#shownOptions()
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
            const option = this.#shownOptions()[this.#highlightedIndex]
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
width:max-content;
max-width:min(26em, calc(100vw - 1rem));
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
.vtd-combobox-panel.vtd-combobox-panel-above{top:auto;bottom:100%;margin-block-start:0;margin-block-end:0.25em;}
.vtd-combobox-option{display:flex;align-items:center;gap:0.65em;padding:0.5em 0.75em;border-radius:0.25rem;cursor:pointer;}
.vtd-combobox-option-leading{flex:none;display:inline-flex;}
.vtd-combobox-option-text{min-width:0;overflow-wrap:anywhere;}
.vtd-combobox-option-detail{display:block;font-size:0.85em;opacity:0.7;}
.vtd-combobox-group ul{list-style:none;margin:0;padding:0;}
.vtd-combobox-group + .vtd-combobox-group, .vtd-combobox-option + .vtd-combobox-group{border-top:1px solid var(--background-3);margin-top:0.25em;padding-top:0.25em;}
.vtd-combobox-group-label{padding:0.4em 0.75em 0.2em;font-size:0.78em;font-weight:600;opacity:0.7;}
` +
/* The keyboard's position in the list - see Menu for why this is a tint and not a ring */
`
.vtd-combobox-option-highlighted{background-color:var(--primary-3);}
.vtd-combobox-empty{padding:0.75em;text-align:center;opacity:0.6;}
.vtd-combobox-panel [hidden]{display:none;}
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
            maxlength={attrs.maxLength}
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
