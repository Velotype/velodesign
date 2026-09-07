import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Carousel, setThemeOnSelector, TextBox, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const slideStyle = {display:"flex", alignItems:"center", justifyContent:"center", width:"100%", height:"8em"}

class CarouselGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop:"10px", maxWidth: "360px"}}>
            <div id="default-carousel"><Carousel slides={[
                <div style={{...slideStyle, background: "var(--primary-3)"}}>Slide 1</div>,
                <div style={{...slideStyle, background: "var(--secondary-3)"}}>Slide 2</div>,
                <div style={{...slideStyle, background: "var(--warning-3)"}}>Slide 3</div>,
                // A real input here, rather than plain text, so a test can prove navigating away
                // and back doesn't lose whatever the user typed - which it would if Carousel
                // rebuilt slide content via refresh() on every navigation instead of just
                // toggling visibility.
                <div style={{...slideStyle, background: "var(--accent-3)"}}><TextBox id="slide-4-input" type="text" placeholder="Type here"/></div>,
            ]}/></div>
        </div>
    }
}

class CarouselPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CarouselGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CarouselGallery/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CarouselPage/></TestModulePage>, mainPage)
}
