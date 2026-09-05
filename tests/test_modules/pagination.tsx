import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Pagination, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class PaginationDemo extends Component<{totalPages: number}> {
    #page = 1
    override render(attrs: {totalPages: number}) {
        return <div>
            <div id={`pagination-current-${attrs.totalPages}`}>Current page: {this.#page}</div>
            <div style={{marginTop:"6px"}}>
                <Pagination
                    page={this.#page}
                    totalPages={attrs.totalPages}
                    onPageChange={(page) => {
                        this.#page = page
                        this.refresh()
                    }}/>
            </div>
        </div>
    }
}

class PaginationGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px"}}>
            <div id="default-pagination"><PaginationDemo totalPages={3}/></div>
            <hr style={{marginTop:"10px"}}/>
            <div id="many-pages-pagination"><PaginationDemo totalPages={20}/></div>
        </div>
    }
}

class PaginationPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><PaginationGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><PaginationGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><PaginationPage/></TestModulePage>, mainPage)
}
