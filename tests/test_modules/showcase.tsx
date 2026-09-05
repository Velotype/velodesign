import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Alert, Badge, Breadcrumbs, Button, Card, Checkbox, Divider, Menu, Navbar, NavLink, Pagination, RadioButton, Select, Sidebar, Spinner, Tabs, Theme, Toggle, Tooltip} from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"
import { setThemeOnSelector } from "../../src/theme.ts"

class ShowcaseSide extends Component<EmptyAttrs> {
    override render() {
        const textColorGradient = <div style={{marginTop:"12px"}}>
            <h4>Text</h4>
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text)', backgroundColor: 'var(--background'}}>default</div>
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text-alt)', backgroundColor: 'var(--background-alt'}}>alternate</div>
        </div>
        const textAltMap = [false,false,false,false,false,true,true,true,true]
        const textAndBackground = <div style={{marginTop:"12px"}}>
            <h4>Text + background</h4>
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text)', backgroundColor: 'var(--background'}}>default</div>
            {textAltMap.map((useAlt, index)=><div style={{margin: "4pm", display: "inline-block", padding: "12px", color: `var(--text${useAlt&&"-alt"})`, backgroundColor: `var(--background-${index+1})`}}>{index+1}</div>)}
            <div style={{margin: "4pm", display: "inline-block", padding: "12px", color: 'var(--text-alt)', backgroundColor: 'var(--background-alt'}}>alternate</div>
        </div>
        const middleColorSpread = (cssColorPrefix: string) => {
            const gradient = [1,2,3,4,5,6,7,8,9]
            return <div style={{marginTop:"12px"}}>
                <h4>{cssColorPrefix}</h4>
                {gradient.map((index)=><div style={{margin: "4pm", display: "inline-block", padding: "12px", backgroundColor: `var(--${cssColorPrefix}-${index})`, color: `var(--text${index>=7?"-alt":""})`}}>{index}</div>)}
            </div>
        }
        return <div>
            This is a showcase of many Components:
            <hr/>
            Example Button:
            <div style={{marginTop:"10px"}}><Button type="primary">Example button</Button></div>
            <hr style={{marginTop:"10px"}}/>
            Example RadioButton:
            <div style={{marginTop:"10px"}}><RadioButton name="example-radio" checked>one</RadioButton></div>
            <div><RadioButton name="example-radio" checked={false}>two</RadioButton></div>
            <div><RadioButton name="example-radio" checked={false}>three</RadioButton></div>
            <hr style={{marginTop:"10px"}}/>
            Example Checkbox and Toggle:
            <div style={{marginTop:"10px"}}><Checkbox checked>a checkbox</Checkbox><Toggle checked>a toggle</Toggle></div>
            <hr style={{marginTop:"10px"}}/>
            Example Badge:
            <div style={{marginTop:"10px"}}>
                <Badge type="primary">primary</Badge> <Badge type="secondary">secondary</Badge> <Badge type="warning">warning</Badge> <Badge type="danger">danger</Badge> <Badge type="neutral">neutral</Badge>
            </div>
            <hr style={{marginTop:"10px"}}/>
            Example Spinner:
            <div style={{marginTop:"10px"}}><Spinner/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Divider:
            <div style={{marginTop:"10px"}}><Divider/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Tooltip:
            <div style={{marginTop:"40px"}}><Tooltip content="Hello from a tooltip"><Button type="secondary">hover me</Button></Tooltip></div>
            <hr style={{marginTop:"10px"}}/>
            Example Select:
            <div style={{marginTop:"10px"}}><Select options={[{value:"a",label:"Option A"},{value:"b",label:"Option B"}]} placeholder="Choose one"/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Alert:
            <div style={{marginTop:"10px"}}><Alert type="success" title="Success">Everything worked.</Alert></div>
            <hr style={{marginTop:"10px"}}/>
            Example Card:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Card header="A card">Some card content.</Card></div>
            <hr style={{marginTop:"10px"}}/>
            Example Tabs:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Tabs tabs={[{key:"a",label:"A",content:"Panel A"},{key:"b",label:"B",content:"Panel B"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Breadcrumbs:
            <div style={{marginTop:"10px"}}><Breadcrumbs items={[{label:"Home",to:"/showcase"},{label:"Section",to:"/showcase#s"},{label:"Current"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Pagination:
            <div style={{marginTop:"10px"}}><Pagination page={4} totalPages={10} onPageChange={()=>{}}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Navbar (with NavLink items):
            <div style={{marginTop:"10px"}}>
                <Navbar brand="My App">
                    <NavLink to="/showcase">Home</NavLink>
                    <NavLink to="/showcase/docs">Docs</NavLink>
                </Navbar>
            </div>
            <hr style={{marginTop:"10px"}}/>
            Example Sidebar:
            <div style={{marginTop:"10px"}}><Sidebar header="Sections" items={[{label:"Overview",to:"/showcase"},{label:"Settings",to:"/showcase/settings"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Menu:
            <div style={{marginTop:"40px"}}><Menu trigger="Actions" items={[{label:"Do a thing",onClick:()=>{}},{label:"Disabled",disabled:true}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            {textColorGradient}
            {textAndBackground}
            {middleColorSpread("primary")}
            {middleColorSpread("secondary")}
            {middleColorSpread("warning")}
            {middleColorSpread("accent")}
            <hr style={{marginTop:"10px"}}/>
        </div>
    }
}

class ShowcasePage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><ShowcaseSide/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><ShowcaseSide/></div>
        </div>
    }
}

Theme.injectStyles()

setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

// Place on the page
const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><ShowcasePage/></TestModulePage>, mainPage)
}
