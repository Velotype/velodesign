import {replaceElementWithRoot, Component, getComponent} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Alert, Combobox, Command, DataTable, Progress, SelectMenu, Sidebar, Tag, Theme, showToast } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/**
 * Consumer content with a lifecycle: each Probe counts itself while mounted. On a page where
 * every update goes through velotype, the Probes mounted are exactly the Probes on the page.
 */
let mountedProbes = 0
class Probe extends Component<{label: string}> {
    override mount() {mountedProbes++}
    override unmount() {mountedProbes--}
    override render() {
        return <span class="probe">{this.attrs.label}</span>
    }
}
;(globalThis as unknown as {__probes: () => {mounted: number, onPage: number}}).__probes = () => ({
    mounted: mountedProbes,
    onPage: document.querySelectorAll(".probe").length,
})

type Fruit = {name: string}
const fruits: Fruit[] = ["apple", "banana", "cherry", "damson", "elder"].map(name => ({name}))

class MountAwarePage extends Component<EmptyAttrs> {
    select: HTMLElement = <SelectMenu<Fruit> id="probe-select" options={fruits} getValue={fruit => fruit.name}
        placeholder={<Probe label="nothing picked"/>}
        renderOption={fruit => <span><Probe label={fruit.name}/></span>}/>
    combobox: HTMLElement = <Combobox id="probe-combobox" options={fruits.map(fruit => ({value: fruit.name, leading: <Probe label={fruit.name[0]}/>}))}/>
    command: HTMLDialogElement = <Command items={fruits.map(fruit => ({key: fruit.name, label: <Probe label={fruit.name}/>, searchText: fruit.name, onSelect: () => {}}))}/>
    progress: HTMLElement = <Progress id="probe-progress" value={10} working status={<Probe label="starting"/>}/>
    sidebar: HTMLElement = <Sidebar id="probe-sidebar" items={[{label: <Probe label="first entry"/>}]}/>
    table: HTMLElement = <DataTable<Fruit> id="probe-table" rows={fruits} pageSize={0} searchable
        columns={[{key: "name", header: "Name", render: fruit => <Probe label={fruit.name}/>, filterValue: fruit => fruit.name, sortValue: fruit => fruit.name}]}/>

    override render() {
        return <div id="mount-aware">
            {this.select}
            {this.combobox}
            <button id="open-command" type="button" onClick={() => getComponent<Command>(this.command).showModal()}>command</button>
            {this.command}
            {this.progress}
            <button id="progress-status" type="button" onClick={() => getComponent<Progress>(this.progress).setValue(50, <Probe label="halfway"/>)}>status</button>
            {this.sidebar}
            <button id="sidebar-items" type="button" onClick={() => getComponent<Sidebar>(this.sidebar).setItems([{label: <Probe label="new entry"/>}, {label: <Probe label="another"/>}])}>items</button>
            <div id="probe-alert"><Alert onDismiss={() => {}}><Probe label="alert"/></Alert></div>
            <div id="probe-tag"><Tag onRemove={() => {}}><Probe label="tag"/></Tag></div>
            <button id="toast" type="button" onClick={() => showToast(<Probe label="toast"/>, {duration: 0})}>toast</button>
            {this.table}
        </div>
    }
}

Theme.injectStyles()

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><MountAwarePage/></TestModulePage>, mainPage)
}
