import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Alert, setThemeOnSelector, Theme } from "../../src/index.ts"
import type { AlertType } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const alertTypes: AlertType[] = ["info", "success", "warning", "danger"]

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

class AlertGallery extends Component<EmptyAttrs> {
    override render() {
        return <div>
            {alertTypes.map(type => <div style={{marginTop:"10px"}}><Alert type={type} title={`${type} alert`}>This is a {type} message.</Alert></div>)}
            <div style={{marginTop:"10px"}}><Alert type="info" onDismiss={()=>{}}>dismissible alert</Alert></div>
            {/* Dismissing has to unmount what the consumer put inside, which is why Alert is a
              * class at all - a FunctionComponent has no instance to remove itself through. */}
            <div id="probed-alert" style={{marginTop:"10px"}}><Alert type="info" onDismiss={()=>{}}><MountProbe/></Alert></div>
        </div>
    }
}

class AlertPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><AlertGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><AlertGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><AlertPage/></TestModulePage>, mainPage)
}
