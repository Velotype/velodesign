import { Component, RenderBasic, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements, TargetedEvent } from "@velotype/velotype"

import { Alert, Avatar, Badge, Button, Card, ColorPicker, Heading, Paragraph, Progress, Stack, Text, TextBox, setThemeOnSelector, type ThemeColorOptions } from "@velotype/velodesign"
import { commonSymbolOptions, componentSymbolOptions, effectiveFallback, loadSavedSymbols, setSymbols, symbolCode, symbolKey } from "../data/theme-symbols.ts"
import type { SymbolOption } from "../data/theme-symbols.ts"

const storageKey = "vtd-showcase-custom-theme"

// Mirrors the built-in defaults in ../../../src/theme.ts (not exported from there, so kept in
// sync here) - only used to show a starting swatch/hex value for a role that hasn't been
// customized yet, never sent to setThemeOnSelector directly.
const defaultLight = {text: "#050505", background: "#fff", backgroundAlt: "#000", primary: "#66b2ff", secondary: "#c6ff9e", warning: "#ffd666", accent: "#ff6666"}
const defaultDark = {text: "#fafafa", background: "#151515", backgroundAlt: "#fff", primary: "#004c99", secondary: "#286100", warning: "#997000", accent: "#990000"}

type Role = "text" | "background" | "backgroundAlt" | "primary" | "secondary" | "warning" | "accent"
type Mode = "Light" | "Dark"

const roles: {key: Role, label: string}[] = [
    {key: "text", label: "Text"},
    {key: "background", label: "Background"},
    {key: "backgroundAlt", label: "Background (alt)"},
    {key: "primary", label: "Primary"},
    {key: "secondary", label: "Secondary"},
    {key: "warning", label: "Warning"},
    {key: "accent", label: "Accent"},
]

function optionKey(role: Role, mode: Mode): keyof ThemeColorOptions {
    return `${role}${mode}Color` as keyof ThemeColorOptions
}

/** Reads the persisted custom theme, if any - used at boot in `main.tsx` */
export function loadSavedTheme(): ThemeColorOptions | undefined {
    try {
        const raw = localStorage.getItem(storageKey)
        return raw ? JSON.parse(raw) as ThemeColorOptions : undefined
    } catch {
        return undefined
    }
}

function saveTheme(options: ThemeColorOptions) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(options))
    } catch { /* e.g. private browsing with storage disabled - the live preview still works, it just won't persist */ }
}

function clearSavedTheme() {
    try {
        localStorage.removeItem(storageKey)
    } catch { /* see saveTheme */ }
}

let areThemeBuilderStylesMounted = false

/**
 * Lets a visitor pick every color role `ThemeColorOptions` exposes (for light and dark mode
 * independently) and see the result applied live - both across the whole showcase site
 * (`:root`) and in a side-by-side light/dark preview strip on this page, so a role that only
 * affects the mode you're not currently viewing is still visible without switching. The
 * chosen palette is saved to `localStorage` and copyable as a ready-to-paste
 * `Theme.injectStyles()` call.
 */
export class ThemeBuilderPage extends Component<EmptyAttrs> {
    #options: ThemeColorOptions
    #symbols: Record<string, string>
    #copyLabel = new RenderBasic<string>("Copy theme code")

    constructor(attrs: EmptyAttrs, children: RenderableElements[]) {
        super(attrs, children)
        this.#options = {...(loadSavedTheme() || {})}
        this.#symbols = {...loadSavedSymbols()}
        if (!areThemeBuilderStylesMounted) {
            areThemeBuilderStylesMounted = true
            setStylesheet(`
/* Stack lays the row out; this is only its vertical spacing */
.vtd-theme-builder-actions{margin-block:1.5em;}
/* Stack lays the two columns out; this is only the space below them */
.vtd-theme-builder-columns{margin-block-end:2em;}
/*
 * A field stays a <label> rather than becoming a Stack, so clicking the role's name focuses its
 * colour input - Stack renders a <div> and would drop that for nothing.
 */
.vtd-theme-builder-column{flex:1;min-width:16em;}
.vtd-theme-builder-column .vtd-heading-3{margin-block-end:0.75em;}
.vtd-theme-builder-field{display:flex;align-items:center;gap:0.75em;padding:0.35em 0;}
.vtd-theme-builder-field-label{width:9em;flex-shrink:0;}
.vtd-theme-builder-field-hex{color:var(--background-9);font-size:0.85em;}
.vtd-theme-builder-preview{
flex:1;
min-width:18em;
border:1px solid var(--background-4);
border-radius:0.5rem;
padding:1.5em;
color:var(--text);
background-color:var(--background);
}
.vtd-theme-builder-preview-label{font-size:0.8em;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;color:var(--background-9);margin-block-end:1em;}
/* The advanced half, set apart from the colour controls above it */
.vtd-theme-builder-advanced{margin-block-start:3em;padding-block-start:2em;border-block-start:1px solid var(--background-4);}
.vtd-theme-builder-symbols{display:grid;grid-template-columns:repeat(auto-fill,minmax(20em,1fr));gap:1.5em;}
.vtd-theme-builder-symbol-group .vtd-heading-3,.vtd-theme-builder-symbol-group .vtd-heading-4{font-size:1em;margin-block:0 0.5em;}
.vtd-theme-builder-symbols .vtd-text-box{width:6em;margin-inline-start:0;}
/* The shared symbols lead the section, so they get a card of their own rather than a column in the grid */
.vtd-theme-builder-symbols-common{
border:1px solid var(--background-4);
border-radius:0.5rem;
padding:1.25em;
margin-block-end:2em;
}
.vtd-theme-builder-symbols-common .vtd-paragraph{margin-block:0 1em;max-width:44em;}
`, "velodesign-showcase/ThemeBuilderPage")
        }
    }

    override mount() {
        // Make sure the two preview panels (and :root, in case a saved theme differs from
        // what main.tsx booted with) reflect #options from the very first render, not just
        // after the first edit.
        this.#applyLive()
    }

    #applyLive() {
        // resetSheet: true - setStylesheet (which setThemeOnSelector calls internally) only
        // applies a given selector's styles once by default; without this flag every edit
        // after the first would be silently ignored.
        setThemeOnSelector(":root", this.#options, true)
        setThemeOnSelector("#theme-builder-preview-light", this.#options, true)
        setThemeOnSelector("#theme-builder-preview-dark", this.#options, true)
        saveTheme(this.#options)
    }

    #setColor(role: Role, mode: Mode, value: string) {
        this.#options = {...this.#options, [optionKey(role, mode)]: value}
        this.#applyLive()
        this.refresh()
    }

    /**
     * Sets one theme-option symbol.
     *
     * Driven by `onChange` rather than `onInput`, so this runs when the field is committed rather
     * than on every keystroke - `refresh()` rebuilds the whole subtree, which is correct after a
     * discrete action and would destroy the input mid-word otherwise. The refresh is what makes
     * the change visible at all: a symbol is read when a component is built, so the preview has to
     * be rebuilt to show it.
     */
    #setSymbol(key: string, value: string) {
        const next = {...this.#symbols}
        if (value) {
            next[key] = value
        } else {
            delete next[key]
        }
        this.#symbols = next
        setSymbols(this.#symbols)
        this.refresh()
    }

    #reset() {
        this.#options = {}
        this.#symbols = {}
        clearSavedTheme()
        setSymbols(this.#symbols)
        this.#applyLive()
        this.refresh()
    }

    #copyCode() {
        const entries = Object.entries(this.#options).filter(([, value]) => value != undefined)
        const body = entries.length == 0 ? "" : `{\n${entries.map(([key, value]) => `    ${key}: "${value}",`).join("\n")}\n}`
        // The symbol overrides are assignments rather than arguments, so they follow the call
        const symbols = symbolCode(this.#symbols)
        const code = [`Theme.injectStyles(${body})`, ...symbols].join("\n")
        const showResult = (label: string) => {
            this.#copyLabel.value = label
            globalThis.setTimeout(() => { this.#copyLabel.value = "Copy theme code" }, 1500)
        }
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => showResult("Copied!")).catch(() => showResult("Copy failed"))
        } else {
            showResult("Copy failed")
        }
    }

    /** One editable glyph, with a note saying where its current value is coming from */
    #renderSymbolField(option: SymbolOption): RenderableElements {
        const key = symbolKey(option)
        const inherited = effectiveFallback(option, this.#symbols)
        const source = this.#symbols[key]
            ? "overridden"
            : (option.inherits ? `inherited ${inherited}` : `default ${inherited}`)
        return <label class="vtd-theme-builder-field">
            <Text class="vtd-theme-builder-field-label">{option.field}</Text>
            <TextBox
                type="text"
                value={this.#symbols[key] ?? ""}
                placeholder={inherited}
                onChange={(event: TargetedEvent<HTMLInputElement, Event>) => {
                    if (event.target instanceof HTMLInputElement) {
                        this.#setSymbol(key, event.target.value.trim())
                    }
                }}/>
            <Text type="muted" class="vtd-theme-builder-field-hex">{source}</Text>
        </label>
    }

    /**
     * The advanced half of the builder: the `XThemeOptions` glyphs.
     *
     * `CommonThemeOptions` comes first and on its own, because setting a symbol there is what a
     * consumer almost always wants - one assignment reaching every component that means the same
     * thing by it. The per-component groups below are the exception, and each field that inherits
     * says so rather than showing a default that is no longer what it renders.
     *
     * Kept below the colours and clearly separated, because these are a different kind of thing.
     * A colour is a CSS custom property the browser re-resolves everywhere at once; a symbol is a
     * mutable object field read when a component is *built*. The package therefore asks a consumer
     * to set these at startup and never watches them; re-rendering the page on an edit is this
     * builder's own doing, not something velodesign does for anyone.
     */
    #renderSymbols(): RenderableElements {
        const byOwner = new Map<string, SymbolOption[]>()
        for (const option of componentSymbolOptions) {
            const list = byOwner.get(option.owner) ?? []
            list.push(option)
            byOwner.set(option.owner, list)
        }
        return <div>
            <div class="vtd-theme-builder-symbol-group vtd-theme-builder-symbols-common">
                <Heading level={3}><Text code>CommonThemeOptions</Text></Heading>
                <Paragraph type="muted">The symbols more than one component means the same thing by.
                    Set one here and every component that has not been given its own override follows.</Paragraph>
                <div class="vtd-theme-builder-symbols">
                    {commonSymbolOptions.map(option => this.#renderSymbolField(option))}
                </div>
            </div>
            <Heading level={3}>Per-component overrides</Heading>
            <div class="vtd-theme-builder-symbols">
                {[...byOwner].map(([owner, options]) => <div class="vtd-theme-builder-symbol-group">
                    <Heading level={4}><Text code>{owner}</Text></Heading>
                    {options.map(option => this.#renderSymbolField(option))}
                </div>)}
            </div>
        </div>
    }

    #renderColumn(mode: Mode): RenderableElements {
        const defaults = mode == "Light" ? defaultLight : defaultDark
        return <div class="vtd-theme-builder-column">
            <Heading level={3}>{mode} mode</Heading>
            {roles.map(role => {
                const key = optionKey(role.key, mode)
                const current = (this.#options[key] as string | undefined) || defaults[role.key]
                return <label class="vtd-theme-builder-field">
                    <Text class="vtd-theme-builder-field-label">{role.label}</Text>
                    <ColorPicker value={current} onChange={(event: TargetedEvent<HTMLInputElement, Event>) => {
                        if (event.target instanceof HTMLInputElement) { this.#setColor(role.key, mode, event.target.value) }
                    }}/>
                    <code class="vtd-theme-builder-field-hex">{current}</code>
                </label>
            })}
        </div>
    }

    #renderPreviewContent(): RenderableElements {
        return <Stack direction="column" gap="lg">
            <Stack gap="sm" align="center">
                <Button type="primary">Primary</Button>
                <Button type="secondary">Secondary</Button>
                <Button type="warning">Warning</Button>
                <Button type="danger">Danger</Button>
            </Stack>
            <Stack gap="sm" align="center">
                <Badge type="primary">primary</Badge>
                <Badge type="secondary">secondary</Badge>
                <Badge type="warning">warning</Badge>
                <Badge type="danger">danger</Badge>
            </Stack>
            <Alert type="info" title="Heads up">This alert reflects your custom theme.</Alert>
            <Card header="Example card">
                <Stack align="center" gap="md">
                    <Avatar initials="JR"/>
                    <Text>Card body content with an Avatar.</Text>
                </Stack>
            </Card>
            <Progress value={65} showLabel/>
        </Stack>
    }

    override render(): RenderableElements {
        return <div class="vtd-showcase-doc">
            <Heading level={1}>Theme builder</Heading>
            <Paragraph type="muted" class="vtd-showcase-doc-description">Customize velodesign's color palette and see it applied live across
                this whole site. Your choices are saved in this browser and copyable as a ready-to-use
                Theme.injectStyles() call for your own app.</Paragraph>

            <Stack gap="sm" class="vtd-theme-builder-actions">
                <Button type="secondary" onClick={() => this.#reset()}>Reset to defaults</Button>
                <Button type="primary" onClick={() => this.#copyCode()}>{this.#copyLabel}</Button>
            </Stack>

            <Stack gap="xl" class="vtd-theme-builder-columns">
                {this.#renderColumn("Light")}
                {this.#renderColumn("Dark")}
            </Stack>

            <Heading level={2}>Live preview</Heading>
            <Stack gap="lg">
                <div id="theme-builder-preview-light" data-theme="light" class="vtd-theme-builder-preview">
                    <div class="vtd-theme-builder-preview-label">Light</div>
                    {this.#renderPreviewContent()}
                </div>
                <div id="theme-builder-preview-dark" data-theme="dark" class="vtd-theme-builder-preview">
                    <div class="vtd-theme-builder-preview-label">Dark</div>
                    {this.#renderPreviewContent()}
                </div>
            </Stack>

            <div class="vtd-theme-builder-advanced">
                <Heading level={2}>Advanced: theme options</Heading>
                <Paragraph type="muted">
                    Beyond colour, each component reads a small set of overridable content from an
                    exported object - the glyphs it uses instead of English words, so the package
                    never assumes a language and carries no icon font. Unlike a colour, these are
                    read when a component is built, so assign them once while your app is starting
                    up, before the first velodesign component exists. velodesign does not watch them
                    and will not re-render anything when one changes; this page re-renders itself
                    because it is a builder. Leave a box empty to keep the inherited value; the
                    copied theme code includes whatever you set here.
                </Paragraph>
                {this.#renderSymbols()}
            </div>
        </div>
    }
}
