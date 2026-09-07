import { Component, RenderBasic, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements, TargetedEvent } from "@velotype/velotype"

import { Alert, Avatar, Badge, Button, Card, ColorPicker, Progress, setThemeOnSelector, type ThemeOptions } from "../../../src/index.ts"

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

function optionKey(role: Role, mode: Mode): keyof ThemeOptions {
    return `${role}${mode}Color` as keyof ThemeOptions
}

/** Reads the persisted custom theme, if any - used at boot in `main.tsx` */
export function loadSavedTheme(): ThemeOptions | undefined {
    try {
        const raw = localStorage.getItem(storageKey)
        return raw ? JSON.parse(raw) as ThemeOptions : undefined
    } catch {
        return undefined
    }
}

function saveTheme(options: ThemeOptions) {
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
 * Lets a visitor pick every color role `ThemeOptions` exposes (for light and dark mode
 * independently) and see the result applied live - both across the whole showcase site
 * (`:root`) and in a side-by-side light/dark preview strip on this page, so a role that only
 * affects the mode you're not currently viewing is still visible without switching. The
 * chosen palette is saved to `localStorage` and copyable as a ready-to-paste
 * `Theme.injectStyles()` call.
 */
export class ThemeBuilderPage extends Component<EmptyAttrs> {
    #options: ThemeOptions
    #copyLabel = new RenderBasic<string>("Copy theme code")

    constructor(attrs: EmptyAttrs, children: RenderableElements[]) {
        super(attrs, children)
        this.#options = {...(loadSavedTheme() || {})}
        if (!areThemeBuilderStylesMounted) {
            areThemeBuilderStylesMounted = true
            setStylesheet(`
.vtd-theme-builder-actions{display:flex;gap:1em;align-items:center;margin-block:1.5em;}
.vtd-theme-builder-columns{display:flex;gap:2.5em;flex-wrap:wrap;margin-block-end:2em;}
.vtd-theme-builder-column{flex:1;min-width:16em;}
.vtd-theme-builder-column h3{margin-block-end:0.75em;}
.vtd-theme-builder-field{display:flex;align-items:center;gap:0.75em;padding:0.35em 0;}
.vtd-theme-builder-field-label{width:9em;flex-shrink:0;}
.vtd-theme-builder-field-hex{color:var(--background-9);font-size:0.85em;}
.vtd-theme-builder-preview-row{display:flex;gap:1em;flex-wrap:wrap;}
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
.vtd-theme-builder-preview-content{display:flex;flex-direction:column;gap:1em;}
.vtd-theme-builder-preview-row-inline{display:flex;gap:0.5em;flex-wrap:wrap;}
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

    #reset() {
        this.#options = {}
        clearSavedTheme()
        this.#applyLive()
        this.refresh()
    }

    #copyCode() {
        const entries = Object.entries(this.#options).filter(([, value]) => value != undefined)
        const body = entries.length == 0 ? "" : `{\n${entries.map(([key, value]) => `    ${key}: "${value}",`).join("\n")}\n}`
        const code = `Theme.injectStyles(${body})`
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

    #renderColumn(mode: Mode): RenderableElements {
        const defaults = mode == "Light" ? defaultLight : defaultDark
        return <div class="vtd-theme-builder-column">
            <h3>{mode} mode</h3>
            {roles.map(role => {
                const key = optionKey(role.key, mode)
                const current = (this.#options[key] as string | undefined) || defaults[role.key]
                return <label class="vtd-theme-builder-field">
                    <span class="vtd-theme-builder-field-label">{role.label}</span>
                    <ColorPicker value={current} onChange={(event: TargetedEvent<HTMLInputElement, Event>) => {
                        if (event.target instanceof HTMLInputElement) { this.#setColor(role.key, mode, event.target.value) }
                    }}/>
                    <code class="vtd-theme-builder-field-hex">{current}</code>
                </label>
            })}
        </div>
    }

    #renderPreviewContent(): RenderableElements {
        return <div class="vtd-theme-builder-preview-content">
            <div class="vtd-theme-builder-preview-row-inline">
                <Button type="primary">Primary</Button>
                <Button type="secondary">Secondary</Button>
                <Button type="warning">Warning</Button>
                <Button type="danger">Danger</Button>
            </div>
            <div class="vtd-theme-builder-preview-row-inline">
                <Badge type="primary">primary</Badge>
                <Badge type="secondary">secondary</Badge>
                <Badge type="warning">warning</Badge>
                <Badge type="danger">danger</Badge>
            </div>
            <Alert type="info" title="Heads up">This alert reflects your custom theme.</Alert>
            <Card header="Example card">
                <div style={{display: "flex", alignItems: "center", gap: "0.75em"}}>
                    <Avatar initials="JR"/>
                    <span>Card body content with an Avatar.</span>
                </div>
            </Card>
            <Progress value={65} showLabel/>
        </div>
    }

    override render(): RenderableElements {
        return <div class="vtd-showcase-doc">
            <h1>Theme builder</h1>
            <p class="vtd-showcase-doc-description">Customize velodesign's color palette and see it applied live across
                this whole site. Your choices are saved in this browser and copyable as a ready-to-use
                Theme.injectStyles() call for your own app.</p>

            <div class="vtd-theme-builder-actions">
                <Button type="secondary" onClick={() => this.#reset()}>Reset to defaults</Button>
                <Button type="primary" onClick={() => this.#copyCode()}>{this.#copyLabel}</Button>
            </div>

            <div class="vtd-theme-builder-columns">
                {this.#renderColumn("Light")}
                {this.#renderColumn("Dark")}
            </div>

            <h2>Live preview</h2>
            <div class="vtd-theme-builder-preview-row">
                <div id="theme-builder-preview-light" data-theme="light" class="vtd-theme-builder-preview">
                    <div class="vtd-theme-builder-preview-label">Light</div>
                    {this.#renderPreviewContent()}
                </div>
                <div id="theme-builder-preview-dark" data-theme="dark" class="vtd-theme-builder-preview">
                    <div class="vtd-theme-builder-preview-label">Dark</div>
                    {this.#renderPreviewContent()}
                </div>
            </div>
        </div>
    }
}
