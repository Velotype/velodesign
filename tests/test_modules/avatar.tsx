import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Avatar, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class AvatarGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", display: "flex", alignItems: "center", gap: "16px"}}>
            <Avatar id="avatar-initials" initials="JR"/>
            <Avatar initials="AB" size="1.5em"/>
            <Avatar initials="CD" size="4em"/>
            <Avatar id="avatar-broken-src" src="/this-image-does-not-exist.png" initials="EF"/>
            <Avatar id="avatar-empty"/>
        </div>
    }
}

class AvatarPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><AvatarGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><AvatarGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><AvatarPage/></TestModulePage>, mainPage)
}
