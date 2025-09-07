import {replaceElementWithRoot, Component, RenderBasic} from "jsr:@velotype/velotype"
import type {EmptyAttrs} from "jsr:@velotype/velotype"

import { Link, PageSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx";

function pageSelectorPage(pagename: string) {
    return function() {
        return <div>
            <div>currently on page: {pagename}</div>
            <div><Link to="/page-selector">link to page none</Link></div>
            <div><Link to="/page-selector/one">link to page one</Link></div>
            <div><Link to="/page-selector/two">link to page two</Link></div>
            <div><Link to="/page-selector/three">link to page three</Link></div>
        </div>
    }
}

class PageSelectorGallery extends Component<EmptyAttrs> {
    buttonClicked = new RenderBasic<boolean>(false)
    override render() {
        return <div>
            <PageSelector
                pages={[
                    {basename: "/page-selector",page: pageSelectorPage("none")},
                    {basename: "/page-selector/one",page: pageSelectorPage("one")},
                    {basename: "/page-selector/two",page: pageSelectorPage("two")},
                    {basename: "/page-selector/three",page: pageSelectorPage("three")}
                ]}
                notFoundPage={function(){return "not found"}}/>
        </div>
    }
}

Theme.addStyles()

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><PageSelectorGallery/></TestModulePage>, mainPage)
}
