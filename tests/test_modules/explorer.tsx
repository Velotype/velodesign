import { replaceElementWithRoot, Component, getComponent, RenderBasic, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"

import { Button, Checkbox, ColorScheme, History, Select, TextBox, Theme } from "../../src/index.ts"
import { stories, type ComponentStory, type ControlDef } from "./explorer-schema.tsx"

/** Renders one labeled control row, reflecting `value` and forwarding edits to `onChange` */
function renderControlRow(key: string, def: ControlDef, value: unknown, onChange: (key: string, value: unknown) => void): RenderableElements {
    if (def.kind == "boolean") {
        return <div class="vtd-explorer-control-row">
            <Checkbox checked={value as boolean} onChange={(event: Event) => {
                if (event.target instanceof HTMLInputElement) { onChange(key, event.target.checked) }
            }}>{def.label}</Checkbox>
        </div>
    }
    if (def.kind == "select") {
        return <div class="vtd-explorer-control-row">
            <label class="vtd-explorer-control-label">{def.label}</label>
            <Select
                options={def.options.map(option => ({value: option, label: option}))}
                value={value as string}
                onChange={(event) => {
                    if (event.target instanceof HTMLSelectElement) { onChange(key, event.target.value) }
                }}/>
        </div>
    }
    if (def.kind == "number") {
        return <div class="vtd-explorer-control-row">
            <label class="vtd-explorer-control-label">{def.label}</label>
            <input type="number" class="vtd-textbox" value={value as number} onInput={(event: Event) => {
                if (event.target instanceof HTMLInputElement) { onChange(key, Number(event.target.value)) }
            }}/>
        </div>
    }
    return <div class="vtd-explorer-control-row">
        <label class="vtd-explorer-control-label">{def.label}</label>
        <TextBox type="text" value={value as string} onInput={(event: Event) => {
            if (event.target instanceof HTMLInputElement) { onChange(key, event.target.value) }
        }}/>
    </div>
}

/**
 * Renders the "Controls" panel for the currently selected story. `switchStory` is the only
 * thing that rebuilds this panel's own DOM (a deliberate story switch); editing a control just
 * calls `onChange` without touching this panel's inputs, so typing never loses focus.
 */
class ControlsPanel extends Component<EmptyAttrs> {
    #story: ComponentStory | undefined
    #props: Record<string, unknown> = {}
    #onChange: (key: string, value: unknown) => void = () => {}

    switchStory(story: ComponentStory, props: Record<string, unknown>, onChange: (key: string, value: unknown) => void) {
        this.#story = story
        this.#props = props
        this.#onChange = onChange
        this.refresh()
    }

    override render(): HTMLDivElement {
        if (!this.#story) { return <div class="vtd-explorer-controls"/> }
        const entries = Object.entries(this.#story.controls)
        return <div class="vtd-explorer-controls">
            <div class="vtd-explorer-controls-header">Controls</div>
            {entries.length == 0
                ? <div class="vtd-explorer-controls-empty">This component has no editable props - see its source for the fixed sample data used here.</div>
                : entries.map(([key, def]) => renderControlRow(key, def, this.#props[key], this.#onChange))}
        </div>
    }
}

/** Renders the live instance of the currently selected story. Only this refreshes on a control edit. */
class StoryPreview extends Component<EmptyAttrs> {
    #story: ComponentStory | undefined
    #props: Record<string, unknown> = {}
    #setProp: (key: string, value: unknown) => void = () => {}

    setStoryAndProps(story: ComponentStory, props: Record<string, unknown>, setProp: (key: string, value: unknown) => void) {
        this.#story = story
        this.#props = props
        this.#setProp = setProp
        this.refresh()
    }

    override render(): HTMLDivElement {
        return <div class="vtd-explorer-canvas">
            {this.#story ? this.#story.render(this.#props, this.#setProp) : "Select a component from the sidebar."}
        </div>
    }
}

type SidebarListAttrsType = {
    stories: ComponentStory[]
    initialActive: string
    onSelect: (name: string) => void
}

/** The grouped, searchable sidebar list. `applyFilter` and `setActive` are the only things that rebuild it. */
class SidebarList extends Component<SidebarListAttrsType> {
    #stories: ComponentStory[]
    #onSelect: (name: string) => void
    #filterText = ""
    #activeName: string

    constructor(attrs: SidebarListAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#stories = attrs.stories
        this.#onSelect = attrs.onSelect
        this.#activeName = attrs.initialActive
    }

    applyFilter(text: string) {
        this.#filterText = text
        this.refresh()
    }

    setActive(name: string) {
        this.#activeName = name
        this.refresh()
    }

    override render(): HTMLDivElement {
        const filterLower = this.#filterText.toLowerCase()
        const filtered = this.#stories.filter(story => story.name.toLowerCase().includes(filterLower))
        const groups = new Map<string, ComponentStory[]>()
        for (const story of filtered) {
            const list = groups.get(story.group) || []
            list.push(story)
            groups.set(story.group, list)
        }
        return <div class="vtd-explorer-sidebar-list">
            {[...groups.entries()].map(([group, storiesInGroup]) => <div class="vtd-explorer-sidebar-group">
                <div class="vtd-explorer-sidebar-group-label">{group}</div>
                {storiesInGroup.map(story => <a
                    href="#"
                    class={`vtd-explorer-sidebar-item${story.name == this.#activeName ? " vtd-explorer-sidebar-item-active" : ""}`}
                    onClick={(event: Event) => { event.preventDefault(); this.#onSelect(story.name) }}>{story.name}</a>)}
            </div>)}
            {filtered.length == 0 ? <div class="vtd-explorer-sidebar-empty">No components match "{this.#filterText}"</div> : null}
        </div>
    }
}

let areExplorerStylesMounted = false

/**
 * The Storybook-style shell: a persistent, searchable/grouped sidebar; a toolbar; a live
 * canvas; and a Controls panel that edits a story's props and re-renders the real component.
 *
 * The whole tree is built once here in the constructor (like `Modal`/`Menu`) and never
 * refreshed as a whole - every update (search, story switch, control edit) goes through a
 * targeted imperative method on an already-mounted child instance, so unrelated inputs never
 * lose focus. See explorer-schema.tsx's `ComponentStory` for the story data.
 */
export class ExplorerApp extends Component<EmptyAttrs> {
    #currentStory: ComponentStory
    #currentProps: Record<string, unknown>
    #preview: StoryPreview
    #controlsPanel: ControlsPanel
    #sidebarList: SidebarList
    #toolbarTitle: HTMLElement
    #root: HTMLDivElement

    #setProp = (key: string, value: unknown) => {
        this.#currentProps = {...this.#currentProps, [key]: value}
        this.#preview.setStoryAndProps(this.#currentStory, this.#currentProps, this.#setProp)
    }

    #syncFromLocation = () => {
        const name = new URLSearchParams(globalThis.location.search).get("story") || stories[0].name
        if (name != this.#currentStory.name) {
            this.selectStory(name, false)
        }
    }

    override mount() {
        globalThis.addEventListener("popstate", this.#syncFromLocation)
        globalThis.addEventListener("locationchange", this.#syncFromLocation)
    }

    override unmount() {
        globalThis.removeEventListener("popstate", this.#syncFromLocation)
        globalThis.removeEventListener("locationchange", this.#syncFromLocation)
    }

    selectStory(name: string, pushHistory: boolean = true) {
        const story = stories.find(candidate => candidate.name == name)
        if (!story) { return }
        this.#currentStory = story
        this.#currentProps = {...story.defaultProps}
        this.#preview.setStoryAndProps(this.#currentStory, this.#currentProps, this.#setProp)
        this.#controlsPanel.switchStory(this.#currentStory, this.#currentProps, this.#setProp)
        this.#toolbarTitle.textContent = story.name
        this.#sidebarList.setActive(name)
        if (pushHistory) {
            History.changeLocation(`/?story=${encodeURIComponent(name)}`)
        }
    }

    constructor(attrs: EmptyAttrs, children: RenderableElements[]) {
        super(attrs, children)
        if (!areExplorerStylesMounted) {
            areExplorerStylesMounted = true
            setStylesheet(`
.vtd-explorer{display:flex;height:100vh;}
.vtd-explorer-sidebar{
width:260px;
flex-shrink:0;
overflow-y:auto;
background-color:var(--background-1);
border-inline-end:1px solid var(--background-4);
}
.vtd-explorer-sidebar-search{padding:0.75em;border-block-end:1px solid var(--background-4);}
.vtd-explorer-sidebar-search .vtd-textbox{width:100%;margin-inline-start:0;box-sizing:border-box;}
.vtd-explorer-sidebar-group-label{
padding:0.75em 0.75em 0.25em 0.75em;
font-size:0.75em;
font-weight:bold;
text-transform:uppercase;
letter-spacing:0.05em;
color:var(--background-9);
}
.vtd-explorer-sidebar-item{
display:block;
padding:0.4em 0.75em;
margin:0 0.5em;
border-radius:0.25rem;
color:inherit;
text-decoration:none;
}
.vtd-explorer-sidebar-item:hover{background-color:var(--background-2);}
.vtd-explorer-sidebar-item-active{background-color:var(--primary-2);font-weight:bold;}
.vtd-explorer-sidebar-empty{padding:0.75em;color:var(--background-9);}
.vtd-explorer-main{flex-grow:1;display:flex;flex-direction:column;min-width:0;}
.vtd-explorer-toolbar{
display:flex;
align-items:center;
gap:1em;
padding:0.6em 1em;
border-block-end:1px solid var(--background-4);
}
.vtd-explorer-toolbar-title{font-weight:bold;margin-inline-end:auto;}
.vtd-explorer-canvas{
flex-grow:1;
overflow:auto;
padding:2.5em;
display:flex;
align-items:center;
justify-content:center;
}
.vtd-explorer-controls{
border-block-start:1px solid var(--background-4);
padding:1em;
max-height:38vh;
overflow-y:auto;
flex-shrink:0;
}
.vtd-explorer-controls-header{font-weight:bold;margin-block-end:0.5em;}
.vtd-explorer-controls-empty{color:var(--background-9);}
.vtd-explorer-control-row{
display:flex;
align-items:center;
gap:1em;
padding:0.35em 0;
}
.vtd-explorer-control-label{
width:9em;
flex-shrink:0;
font-size:0.9em;
color:var(--background-9);
}
`, "velodesign-tests/Explorer")
        }

        const initialName = new URLSearchParams(globalThis.location.search).get("story") || stories[0].name
        const initialStory = stories.find(candidate => candidate.name == initialName) || stories[0]
        this.#currentStory = initialStory
        this.#currentProps = {...initialStory.defaultProps}

        this.#preview = getComponent<StoryPreview>(<StoryPreview/>)
        this.#controlsPanel = getComponent<ControlsPanel>(<ControlsPanel/>)
        this.#toolbarTitle = <span class="vtd-explorer-toolbar-title">{initialStory.name}</span>

        const searchInput: HTMLInputElement = <TextBox
            type="text"
            placeholder="Search components..."
            class="vtd-explorer-search"
            onInput={(event: Event) => {
                if (event.target instanceof HTMLInputElement) { this.#sidebarList.applyFilter(event.target.value) }
            }}/>

        this.#sidebarList = getComponent<SidebarList>(<SidebarList stories={stories} initialActive={initialStory.name} onSelect={(name: string) => this.selectStory(name)}/>)

        const darkModeLabel = new RenderBasic<string>(ColorScheme.getColorScheme() == "light" ? "off" : "on")
        const themeToggle = <Button type="secondary" onClick={() => {
            if (ColorScheme.getColorScheme() == "light") {
                ColorScheme.setColorScheme("dark")
                darkModeLabel.value = "on"
            } else {
                ColorScheme.setColorScheme("light")
                darkModeLabel.value = "off"
            }
        }}>Dark mode: {darkModeLabel}</Button>

        this.#root = <div class="vtd-explorer">
            <div class="vtd-explorer-sidebar">
                <div class="vtd-explorer-sidebar-search">{searchInput}</div>
                {this.#sidebarList}
            </div>
            <div class="vtd-explorer-main">
                <div class="vtd-explorer-toolbar">{this.#toolbarTitle}{themeToggle}</div>
                {this.#preview}
                {this.#controlsPanel}
            </div>
        </div>

        this.#preview.setStoryAndProps(this.#currentStory, this.#currentProps, this.#setProp)
        this.#controlsPanel.switchStory(this.#currentStory, this.#currentProps, this.#setProp)
    }

    override render(): HTMLDivElement {
        return this.#root
    }
}

Theme.injectStyles()

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<ExplorerApp/>, mainPage)
}
