import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Tag, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/**
 * Mount/unmount tallies for the probe below, read out of the page by the test.
 *
 * Deliberately a local copy rather than a shared helper: `tests/bundle.ts` decides a module is
 * stale from its own `.tsx` and from `src/`, so a helper shared across test modules would be
 * edited without anything that imports it being rebuilt. Six lines is the cheaper problem.
 */
const lifecycle = {mounts: 0, unmounts: 0};
(globalThis as unknown as {vtdLifecycle: typeof lifecycle}).vtdLifecycle = lifecycle

/** Records whether velotype ran its lifecycle - a missed `mount()` leaves no trace in the DOM */
class MountProbe extends Component<EmptyAttrs> {
    override mount() { lifecycle.mounts++ }
    override unmount() { lifecycle.unmounts++ }
    override render() { return <span class="vtd-test-probe">probe</span> }
}

class TagGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"14px"}}>
            <div id="default-tag" style={{display:"flex", gap:"8px"}}>
                <Tag type="primary">primary</Tag>
                <Tag type="secondary">secondary</Tag>
                <Tag type="warning">warning</Tag>
                <Tag type="danger">danger</Tag>
                <Tag type="neutral">neutral</Tag>
            </div>
            <div id="removable-tag"><Tag type="primary" onRemove={()=>{}}>removable</Tag></div>
            {/* Removing has to unmount what the consumer put inside - same reason Tag is a class */}
            <div id="probed-tag"><Tag type="primary" onRemove={()=>{}}><MountProbe/></Tag></div>
        </div>
    }
}

class TagPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TagGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TagGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TagPage/></TestModulePage>, mainPage)
}
