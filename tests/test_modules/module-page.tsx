import { ChildrenAttr, Component, EmptyAttrs, RenderableElements } from "jsr:@velotype/velotype/jsx-runtime"
import { Button } from "../../src/button.tsx"
import { ColorScheme } from "../../src/theme.ts"

class NavSchemeSelector extends Component<EmptyAttrs> {
    override render() {
        return <div style="display:contents;">
            <Button style={{marginBlock: "0.25rem"}} onClick={()=>{
                if (ColorScheme.getColorScheme() == "light") {
                    ColorScheme.setColorScheme("dark")
                } else {
                    ColorScheme.setColorScheme("light")
                }
                globalThis.setTimeout(()=>{
                    this.refresh()
                },100)
            }}>Dark mode:{(ColorScheme.getColorScheme() == "light")?'off':'on'}</Button>
        </div>
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
