import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Heading, Paragraph, TableOfContents, setThemeOnSelector, Theme } from "../../src/index.ts"
import type { TableOfContentsItemType } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/**
 * Sections long enough that one of them fills more than the observer's band - that is the case
 * where nothing is intersecting and the component has to fall back to the last section passed.
 */
const sections = [
    {id: "intro", label: "Introduction", level: 1},
    {id: "install", label: "Installation", level: 1},
    {id: "install-deno", label: "With Deno", level: 2},
    {id: "install-npm", label: "With npm", level: 2},
    {id: "usage", label: "Usage", level: 1},
    {id: "usage-basic", label: "Basic", level: 2},
    {id: "usage-advanced", label: "Advanced", level: 2},
    {id: "usage-advanced-edge", label: "An edge case", level: 3},
    {id: "api", label: "API reference", level: 1},
]

function filler(id: string, label: string, level: number, lines: number) {
    return <div>
        <Heading id={id} level={level > 3 ? 4 : (level + 1) as 2 | 3 | 4}>{label}</Heading>
        {Array.from({length: lines}, (_, index) =>
            <Paragraph>Line {index + 1} of the {label} section, here only to make it tall enough to scroll through.</Paragraph>)}
    </div>
}

class TocGallery extends Component<EmptyAttrs> {
    override render() {
        return <div id="toc-gallery" style={{display: "flex", gap: "2em", alignItems: "flex-start", marginTop: "10px"}}>
            <div id="toc-content" style={{flexGrow: 1, minWidth: 0}}>
                {sections.map(section => filler(section.id, section.label, section.level, section.id == "usage" ? 14 : 5))}
            </div>
            <div id="toc-nav" style={{width: "14em", flexShrink: 0, position: "sticky", top: "0"}}>
                <TableOfContents
                    header="On this page"
                    ariaLabel="On this page"
                    items={sections as TableOfContentsItemType[]}/>
            </div>
        </div>
    }
}

class TocPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TocGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TocGallery/></div>
        </div>
    }
}

Theme.injectStyles()
setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TocPage/></TestModulePage>, mainPage)
}
