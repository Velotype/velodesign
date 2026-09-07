import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Accordion, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class AccordionGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "360px"}}>
            <div id="exclusive-accordion"><Accordion exclusive items={[
                {header: "Only one open", content: "Opening this closes any other open section."},
                {header: "At a time", content: "This is the second section."},
                {header: "In this group", content: "This is the third section."}
            ]}/></div>
            <hr style={{marginTop:"20px"}}/>
            <div id="independent-accordion" style={{marginTop:"20px"}}><Accordion items={[
                {header: "Section one", content: "Content of section one.", defaultOpen: true},
                {header: "Section two", content: "Content of section two."},
                {header: "Section three", content: "Content of section three."}
            ]}/></div>
            <hr style={{marginTop:"20px"}}/>
            <div id="side-by-side-accordion" style={{marginTop:"20px", display:"flex", gap:"10px"}}>
                <Accordion items={[{header: "Narrow", content: "Short."}]}/>
                <Accordion items={[{header: "Wide", content: "A much longer line of body content than the header, to check that the collapsed and expanded widths stay the same."}]}/>
            </div>
            <div id="long-header-accordion" style={{marginTop:"20px"}}>
                <Accordion items={[{header: "A deliberately long header, to check the minimum gap before the chevron", content: "Body content."}]}/>
            </div>
        </div>
    }
}

class AccordionPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><AccordionGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><AccordionGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><AccordionPage/></TestModulePage>, mainPage)
}
