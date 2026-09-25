import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Combobox, highlightMatch, Text, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const countryOptions = [
    "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia",
    "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "India", "Indonesia", "Ireland",
    "Israel", "Italy", "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand",
    "Nigeria", "Norway", "Peru", "Philippines", "Poland", "Portugal", "Singapore", "South Africa",
    "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine",
    "United Kingdom", "United States", "Vietnam",
].map(name => ({value: name}))

/** Every value `onSelect` fired with, so a test can read back what a pick actually did */
const picked: string[] = []

/*
 * Markup labels with a searchText and an onSelect - the case a plain string option cannot cover.
 * "Buenos Aires" is deliberately not in either the value or the visible name: it is only in
 * searchText, so a query that finds this row proves searchText is what the filter reads.
 */
const richEntries = [
    {value: "Argentina", city: "Buenos Aires", region: "South America"},
    {value: "Austria", city: "Vienna", region: "Europe"},
    {value: "Australia", city: "Canberra", region: "Oceania"},
]
const richOptions = richEntries.map(entry => ({
    value: entry.value,
    searchText: `${entry.value} ${entry.city} ${entry.region}`,
    onSelect: () => { picked.push(entry.value) },
}));
(globalThis as unknown as {vtdPicked: string[]}).vtdPicked = picked

/**
 * Draws a row as markup, and marks what matched in *both* parts of it.
 *
 * The city is shown as well as the name, because a match the reader cannot see explains nothing:
 * `region` stays out of the row on purpose, so the gallery also covers matching on text that is
 * only in `searchText` - the case where there is nothing to highlight and the row is simply there.
 */
function renderRichOption(option: {value: string}, query: string) {
    const entry = richEntries.find(candidate => candidate.value == option.value)
    return <span class="vtd-test-rich-option" style={{display: "flex", gap: "0.5em", width: "100%"}}>
        <span style={{flexGrow: 1}}>{highlightMatch(option.value, query)}</span>
        <Text type="muted">{highlightMatch(entry?.city ?? "", query)}</Text>
    </span>
}

/**
 * Mount/unmount tallies for the lifecycle probe below, read out of the page by the test.
 *
 * A missed `mount()` is invisible in the rendered DOM - the markup is identical either way, and
 * only the component's subscriptions to things outside itself are missing. So the only way to
 * observe it is to count the calls.
 */
const lifecycle = {mounts: 0, unmounts: 0};
(globalThis as unknown as {vtdLifecycle: typeof lifecycle}).vtdLifecycle = lifecycle

/**
 * A component that exists only to record whether velotype ran its lifecycle.
 *
 * Stands in for every real component that does its work in `mount()` - `NavLink` subscribing to
 * `popstate`, anything calling `mountStyles`, anything adding a `document` listener.
 */
class MountProbe extends Component<{label: string}> {
    override mount() { lifecycle.mounts++ }
    override unmount() { lifecycle.unmounts++ }
    override render(attrs: {label: string}) {
        return <span class="vtd-test-probe">{attrs.label}</span>
    }
}

class ComboboxGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="default-combobox"><Combobox
                placeholder="Choose a country"
                options={countryOptions}/></div>
            <div><Combobox placeholder="Disabled" disabled options={countryOptions}/></div>
            {/* A consumer's own wording for the no-match state, which used to be a baked-in "No matches" */}
            <div id="worded-combobox"><Combobox
                placeholder="Choose a country"
                noMatchMessage="Rien ne correspond"
                options={countryOptions}/></div>
            <div id="rich-combobox"><Combobox
                placeholder="Search"
                clearOnSelect
                options={richOptions}
                renderOption={renderRichOption}/></div>
        </div>
    }
}

class ComboboxPage extends Component<EmptyAttrs> {
    override render() {
        return <div>
            <div style={{display: "flex"}}>
                <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1}}><ComboboxGallery/></div>
                <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ComboboxGallery/></div>
            </div>
            {/*
              * Outside both theme columns, and so rendered exactly once - the galleries above are
              * built twice, and a doubled tally would hide an off-by-one in either direction.
              */}
            <div id="lifecycle-combobox" style={{padding:"8px",minHeight:"40vh"}}><Combobox
                placeholder="Lifecycle"
                options={countryOptions}
                renderOption={(option) => <MountProbe label={option.value}/>}/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ComboboxPage/></TestModulePage>, mainPage)
}
