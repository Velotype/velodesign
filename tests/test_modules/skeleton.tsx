import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Skeleton, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class SkeletonGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "320px", display:"flex", flexDirection:"column", gap:"16px"}}>
            <div id="default-skeleton"><Skeleton lines={3}/></div>
            <div style={{display:"flex", gap:"12px", alignItems:"center"}}>
                <Skeleton variant="circular"/>
                <Skeleton variant="rectangular" width="12em" height="4em"/>
            </div>
        </div>
    }
}

class SkeletonPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><SkeletonGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><SkeletonGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><SkeletonPage/></TestModulePage>, mainPage)
}
