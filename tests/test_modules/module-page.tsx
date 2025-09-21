import { ChildrenAttr, Component, EmptyAttrs, RenderableElements, RenderBasic } from "jsr:@velotype/velotype/jsx-runtime"
import { Button } from "../../src/button.tsx"
import { ColorScheme } from "../../src/theme.ts"

class NavSchemeSelector extends Component<EmptyAttrs> {
    darkMode = new RenderBasic<string>("--")
    override render() {
        if (ColorScheme.getColorScheme() == "light") {
            this.darkMode.value = "off"
        } else {
            this.darkMode.value = "on"
        }
        return <Button style={{marginBlock: "0.25rem"}} onClick={()=>{
            if (ColorScheme.getColorScheme() == "light") {
                ColorScheme.setColorScheme("dark")
                this.darkMode.value = "on"
            } else {
                ColorScheme.setColorScheme("light")
                this.darkMode.value = "off"
            }
        }}>Dark mode:{this.darkMode}</Button>
    }
}

export class TestModulePage extends Component<ChildrenAttr> {
    override render(_attrs: EmptyAttrs, children: RenderableElements[]) {
        return <div>
            <div><a href='/'>Home page</a></div>
            <div><NavSchemeSelector/></div>
            <div>{children}</div>
        </div>
    }
}
