import {replaceElementWithRoot, Component, getComponent, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Badge, Button, Link, setThemeOnSelector, Theme, Tree } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const fileTree = () => [
    {key: "src", label: "src", defaultOpen: true, children: [
        {key: "components", label: "components", children: [
            {key: "button", label: "button.tsx"},
            {key: "card", label: "card.tsx"},
        ]},
        {key: "index", label: "index.ts"},
    ]},
    {key: "readme", label: "readme.md"},
]

class TreeGallery extends Component<EmptyAttrs> {
    #openKeys = new RenderBasic<string>("src")
    #selected = new RenderBasic<string>("(none)")

    override render() {
        // With onSelect: a click on the label selects, a click anywhere else on the row toggles.
        const selectable = getComponent<Tree>(<Tree
            id="default-tree"
            ariaLabel="Project files"
            nodes={fileTree()}
            onSelect={(node) => { this.#selected.value = node.key }}
            onToggle={() => { this.#openKeys.value = selectable.getOpenKeys().join(",") || "(none)" }}/>)

        return <div style={{marginTop:"10px", display:"flex", flexDirection:"column", gap:"14px", maxWidth:"340px"}}>
            <div style={{border:"1px dashed var(--background-5)"}}>{selectable}</div>
            <div id="tree-open-keys">Open: {this.#openKeys}</div>
            <div id="tree-selected">Selected: {this.#selected}</div>
            {/*
              * The open/close state is drivable from outside, which is what a filterable tree
              * needs - reveal the branch holding a match, then put the reader's own expansions
              * back when the filter clears.
              */}
            <div style={{display:"flex", gap:"6px", flexWrap:"wrap"}}>
                <Button id="tree-expand-all" type="secondary" onClick={() => selectable.setOpenKeys(selectable.getBranchKeys())}>Expand all</Button>
                <Button id="tree-collapse-all" type="secondary" onClick={() => selectable.setOpenKeys([])}>Collapse all</Button>
                <Button id="tree-reveal-card" type="secondary" onClick={() => selectable.reveal("card")}>Reveal card.tsx</Button>
            </div>

            {/*
              * Without onSelect a leaf is a plain container rather than something claiming to be a
              * button, so a Link in `label` owns its own click - the shape the showcase's sidebar
              * nav uses. `leading` puts a count beside a branch.
              */}
            <div id="linked-tree-wrapper" style={{border:"1px dashed var(--background-5)"}}>
                <Tree id="linked-tree" ariaLabel="Documentation" nodes={[
                    {key: "guides", label: "Guides", defaultOpen: true, leading: <Badge type="neutral">2</Badge>, children: [
                        {key: "install", label: <Link to="/tree#install">Installing</Link>},
                        {key: "theming", label: <Link to="/tree#theming">Theming</Link>},
                    ]},
                    {key: "changelog", label: <Link to="/tree#changelog">Changelog</Link>},
                ]}/>
            </div>
        </div>
    }
}

class TreePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TreeGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TreeGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TreePage/></TestModulePage>, mainPage)
}
