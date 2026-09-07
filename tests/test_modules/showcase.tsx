import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Accordion, Alert, Avatar, Badge, Breadcrumbs, Button, ButtonGroup, Calendar, Card, Carousel, Checkbox, Collapse, ColorPicker, Combobox, Command, ContextMenu, DataTable, DatePicker, Divider, Drawer, Empty, Form, FormField, InputNumber, List, Menu, Navbar, NavLink, Pagination, Popconfirm, Popover, Progress, RadioButton, Rate, Resizable, ScrollArea, Select, showToast, Sidebar, Skeleton, Slider, Spinner, Statistic, Steps, Table, Tabs, Tag, TextBox, Theme, Timeline, Toggle, Tooltip, Tree, Upload} from "../../src/index.ts"
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
            Example ButtonGroup:
            <div style={{marginTop:"10px"}}><ButtonGroup>
                <Button type="secondary">Left</Button>
                <Button type="secondary">Middle</Button>
                <Button type="secondary">Right</Button>
            </ButtonGroup></div>
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
            Example Toast:
            <div style={{marginTop:"10px"}}><Button type="secondary" onClick={()=>{showToast("Hello from a toast", {type: "success"})}}>Show a toast</Button></div>
            <hr style={{marginTop:"10px"}}/>
            Example Accordion:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Accordion items={[{header:"Section one",content:"Panel one",defaultOpen:true},{header:"Section two",content:"Panel two"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Avatar:
            <div style={{marginTop:"10px", display:"flex", gap:"10px"}}><Avatar initials="JW"/><Avatar initials="AB" size="1.5em"/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Progress:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Progress value={65} showLabel/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Skeleton:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Skeleton lines={2}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Tag:
            <div style={{marginTop:"10px"}}><Tag type="primary">primary</Tag> <Tag type="danger" onRemove={()=>{}}>removable</Tag></div>
            <hr style={{marginTop:"10px"}}/>
            Example Empty:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Empty/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Collapse:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Collapse header="Click to expand">Hidden content.</Collapse></div>
            <hr style={{marginTop:"10px"}}/>
            Example Statistic:
            <div style={{marginTop:"10px"}}><Statistic title="Active users" value={1284}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example List:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><List items={[{key:"1",title:"First item",description:"Supporting text"},{key:"2",title:"Second item"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Timeline:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Timeline items={[{key:"1",title:"Order placed"},{key:"2",title:"Delivered",type:"secondary"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example ScrollArea:
            <div style={{marginTop:"10px", maxWidth:"200px"}}><ScrollArea maxHeight="4em">Line one<br/>Line two<br/>Line three<br/>Line four</ScrollArea></div>
            <hr style={{marginTop:"10px"}}/>
            Example DatePicker, Slider, InputNumber, ColorPicker, Combobox:
            <div style={{marginTop:"10px", display:"flex", flexWrap:"wrap", gap:"14px", alignItems:"center"}}>
                <DatePicker value="2026-01-15"/>
                <Slider value={40} style={{width:"8em"}}/>
                <InputNumber value={5}/>
                <ColorPicker value="#66b2ff"/>
                <Combobox placeholder="Fruit" options={[{value:"Apple"},{value:"Banana"}]}/>
            </div>
            <hr style={{marginTop:"10px"}}/>
            Example Upload:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Upload>Click or drag a file here</Upload></div>
            <hr style={{marginTop:"10px"}}/>
            Example Drawer:
            <div style={{marginTop:"10px"}}>{(() => {
                const drawer = <Drawer title="Settings">Drawer body content.</Drawer>
                return <span style={{display:"contents"}}>{drawer}<Button type="secondary" onClick={()=>drawer.showModal()}>Open drawer</Button></span>
            })()}</div>
            <hr style={{marginTop:"10px"}}/>
            Example Popover:
            <div style={{marginTop:"40px"}}><Popover trigger={<Button type="secondary">Click me</Button>} content="Rich popover content."/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Popconfirm:
            <div style={{marginTop:"40px"}}><Popconfirm title="Are you sure?" onConfirm={()=>{}}><Button type="danger">Delete</Button></Popconfirm></div>
            <hr style={{marginTop:"10px"}}/>
            Example Steps:
            <div style={{marginTop:"10px", maxWidth:"420px"}}><Steps current={1} steps={[{key:"a",title:"Account"},{key:"b",title:"Profile"},{key:"c",title:"Confirm"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Rate:
            <div style={{marginTop:"10px"}}><Rate value={3}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Table:
            <div style={{marginTop:"10px", maxWidth:"420px"}}><Table columns={[{key:"name",header:"Name",render:(row: {name: string})=>row.name}]} rows={[{name:"Jonathan"},{name:"Alex"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example DataTable:
            <div style={{marginTop:"10px", maxWidth:"420px"}}><DataTable
                searchable
                pageSize={3}
                columns={[
                    {key:"name",header:"Name",render:(row: {name: string, role: string})=>row.name, sortValue:(row)=>row.name, filterValue:(row)=>row.name},
                    {key:"role",header:"Role",render:(row: {name: string, role: string})=>row.role, sortValue:(row)=>row.role, filterValue:(row)=>row.role},
                ]}
                rows={[{name:"Jonathan",role:"Engineer"},{name:"Alex",role:"Designer"},{name:"Casey",role:"Support"},{name:"Morgan",role:"Manager"}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Form:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Form><FormField label="Name" required><TextBox type="text"/></FormField></Form></div>
            <hr style={{marginTop:"10px"}}/>
            Example ContextMenu:
            <div style={{marginTop:"10px"}}><ContextMenu items={[{label:"Copy",onClick:()=>{}},{label:"Delete"}]}>
                <div style={{padding:"1em", border:"1px dashed var(--background-5)", borderRadius:"0.25rem"}}>Right-click here</div>
            </ContextMenu></div>
            <hr style={{marginTop:"10px"}}/>
            Example Resizable:
            <div style={{marginTop:"10px"}}><Resizable initialSize="10em" style={{border:"1px solid var(--background-4)", borderRadius:"0.25rem"}}><div style={{padding:"1em"}}>Drag the edge</div></Resizable></div>
            <hr style={{marginTop:"10px"}}/>
            Example Carousel:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Carousel slides={[<div style={{padding:"2em", background:"var(--primary-3)"}}>Slide 1</div>,<div style={{padding:"2em", background:"var(--secondary-3)"}}>Slide 2</div>]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Calendar:
            <div style={{marginTop:"10px"}}><Calendar/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Tree:
            <div style={{marginTop:"10px", maxWidth:"320px"}}><Tree nodes={[{key:"a",label:"src",defaultOpen:true,children:[{key:"b",label:"index.ts"}]}]}/></div>
            <hr style={{marginTop:"10px"}}/>
            Example Command:
            <div style={{marginTop:"10px"}}>{(() => {
                const command = <Command placeholder="Search..." items={[{key:"a",label:"New file",searchText:"new file",onSelect:()=>{}}]}/>
                return <span style={{display:"contents"}}>{command}<Button type="secondary" onClick={()=>command.showModal()}>Open command palette</Button></span>
            })()}</div>
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
