import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Button, Lightbox, openLightbox, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

/** A picture drawn inline, so the gallery needs no network */
const PICTURE = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#7c9cbf"/><circle cx="700" cy="150" r="80" fill="#f7d774"/><path d="M0 600 L250 300 L450 480 L620 330 L900 600 Z" fill="#3d5a73"/></svg>')

class LightboxGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop: "20px", display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap"}}>
            <Lightbox id="default-lightbox" src={PICTURE} alt="Mountains under a sun" closeLabel="Close">
                <img src={PICTURE} alt="Mountains under a sun" style={{width: "180px", borderRadius: "8px", display: "block"}}/>
            </Lightbox>
            <Button type="secondary" onClick={() => openLightbox({src: PICTURE, alt: "Mountains under a sun", closeLabel: "Close"})}>Open from code</Button>
        </div>
    }
}

class LightboxPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><LightboxGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><LightboxGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><LightboxPage/></TestModulePage>, mainPage)
}
