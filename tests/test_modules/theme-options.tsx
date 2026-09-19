import {replaceElementWithRoot, Component, RenderBasic} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import {
    Alert, Breadcrumbs, CommonThemeOptions, Pagination, PaginationThemeOptions, Popconfirm,
    resetThemeOptions, setThemeOnSelector, Steps, Tag, TextEditableField, Theme,
} from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/**
 * Every component that reads a shared theme symbol, rendered on demand.
 *
 * The point of this page is not how it looks - it is that one assignment to `CommonThemeOptions`
 * reaches all of these, and that a per-component assignment beats it for that component alone. A
 * symbol is read when a component is *built*, so the gallery is rebuilt on each change rather than
 * mounted once: that is the contract the package asks of a consumer (set them at startup) written
 * out as the one thing that legitimately has to do it repeatedly.
 */
class SymbolGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
            <div id="symbols-close" style={{display:"flex", gap:"8px", alignItems:"center"}}>
                <Alert type="info" onDismiss={()=>{}}>alert</Alert>
                <Tag type="primary" onRemove={()=>{}}>tag</Tag>
            </div>
            <div id="symbols-prev-next">
                <Pagination page={2} totalPages={9} onPageChange={()=>{}}/>
            </div>
            <div id="symbols-confirm">
                <Steps current={2} steps={[{key:"a",title:"one"},{key:"b",title:"two"},{key:"c",title:"three"}]}/>
            </div>
            <div id="symbols-cancel">
                <Popconfirm title="sure?" onConfirm={()=>{}}><span>trigger</span></Popconfirm>
            </div>
            <div id="symbols-edit">
                <TextEditableField field={new RenderBasic<string>("editable")}/>
            </div>
            <div id="symbols-collapse">
                <Breadcrumbs maxItems={3} items={[
                    {label:"root", to:"/"},
                    {label:"one", to:"/one"},
                    {label:"two", to:"/two"},
                    {label:"here"},
                ]}/>
            </div>
        </div>
    }
}

/**
 * Rebuilds the gallery whenever a symbol changes, which is the only way to see a change at all.
 *
 * `refresh()` is the right tool here for once: this component takes no children and holds no
 * consumer content, and setting a symbol is about as discrete an action as exists.
 */
class ThemeOptionsPage extends Component<EmptyAttrs> {
    #setCommon(field: "closeSymbol" | "prevSymbol" | "confirmSymbol" | "cancelSymbol" | "collapseSymbol", value: string) {
        const options = CommonThemeOptions as unknown as Record<string, () => string>
        options[field] = function(){return value}
        this.refresh()
    }

    override render() {
        return <div>
            <div style={{display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px"}}>
                <button type="button" id="set-common-close" onClick={() => this.#setCommon("closeSymbol", "CLOSE")}>common close</button>
                <button type="button" id="set-common-prev" onClick={() => this.#setCommon("prevSymbol", "PREV")}>common prev</button>
                <button type="button" id="set-common-confirm" onClick={() => this.#setCommon("confirmSymbol", "YES")}>common confirm</button>
                <button type="button" id="set-common-cancel" onClick={() => this.#setCommon("cancelSymbol", "NO")}>common cancel</button>
                <button type="button" id="set-common-collapse" onClick={() => this.#setCommon("collapseSymbol", "MORE")}>common collapse</button>
                <button type="button" id="set-pagination-prev" onClick={() => {
                    PaginationThemeOptions.prevSymbol = function(){return "PAGER-ONLY"}
                    this.refresh()
                }}>pagination prev only</button>
                <button type="button" id="reset-symbols" onClick={() => {
                    resetThemeOptions(CommonThemeOptions)
                    resetThemeOptions(PaginationThemeOptions)
                    this.refresh()
                }}>reset</button>
            </div>
            <div style={{display: "flex"}}>
                <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SymbolGallery/></div>
                <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SymbolGallery/></div>
            </div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ThemeOptionsPage/></TestModulePage>, mainPage)
}
