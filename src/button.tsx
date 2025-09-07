import {Component, setStylesheet} from "jsr:@velotype/velotype"
import type {ChildrenAttr, RenderableElements, FunctionComponent, CSSProperties, EmptyAttrs} from "jsr:@velotype/velotype"

export const ButtonThemeOptions: {
    spinner: FunctionComponent<EmptyAttrs>
} = {
    spinner: function(){return "..."}
}

export type ButtonType = "primary" | "secondary" | "warning" | "danger" | "text"
export type ButtonAttrsType = {
    isLoading?: boolean,
    disabled?: boolean,
    loadingIcon?: boolean,
    type?: ButtonType,
    onClick?: (doneLoading: () => void) => void,
    style?: CSSProperties | string
}
export class Button<Spinner> extends Component<ButtonAttrsType & ChildrenAttr> {
    override mount() {
        setStylesheet(`
.vtd-btn{
position:relative;
padding:0.25rem 0.5rem;
border-radius:0.25rem;
cursor:pointer;
display:inline-block;
text-align:center;
text-decoration:none;
user-select:none;
vertical-align:middle;
margin-inline:0.25rem;
transition:color 0.25s ease-in-out, background-color 0.25s ease-in-out, border 0.25s ease-in-out;
}

.vtd-btn-primary{background-color:var(--primary);border:1px solid var(--primary-5);}
.vtd-btn-primary:hover{background-color:var(--primary-2);border:1px solid var(--primary-7);}
.vtd-btn-primary:active{background-color:var(--primary-6);}
.vtd-btn-secondary{background-color:var(--secondary);border:1px solid var(--secondary-5);}
.vtd-btn-secondary:hover{background-color:var(--secondary-2);border:1px solid var(--secondary-7);}
.vtd-btn-secondary:active{background-color:var(--secondary-6);}
.vtd-btn-warning{background-color:var(--warning);border:1px solid var(--warning-5);}
.vtd-btn-warning:hover{background-color:var(--warning-2);border:1px solid var(--warning-7);}
.vtd-btn-warning:active{background-color:var(--warning-6);}
.vtd-btn-danger{background-color:var(--accent);border:1px solid var(--accent-5);}
.vtd-btn-danger:hover{background-color:var(--accent-2);border:1px solid var(--accent-7);}
.vtd-btn-danger:active{background-color:var(--accent-6);}

.vtd-btn-text{background-color:transparent;border:1px solid transparent;}
.vtd-btn-text:hover{background-color:var(--background-2);}
.vtd-btn-text:active{background-color:var(--background-5);}

.vtd-btn:disabled:hover{cursor:not-allowed;}
.vtd-btn:focus-visible{border:1px solid var(--accent);}
`, "vtd/Button")
    }

    isLoading = false
    override render(attrs: ButtonAttrsType, children: RenderableElements[]): HTMLButtonElement {
        if (attrs.isLoading) {
            this.isLoading = true
        }
        const spinnerStyle = {
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate3d(-50%, -50%, 0)",
            display: "inline-block",
            visibility: "visible"
        }
        if (attrs.loadingIcon && !this.isLoading) {
            spinnerStyle.visibility = "hidden"
        }
        return <button type="button"
            class={`vtd-btn vtd-btn-${attrs.type||"primary"}`}
            tabindex={0}
            disabled={attrs.disabled}
            style={attrs.style}
            onClick={()=>{
                if (attrs.loadingIcon && this.isLoading) {
                    return
                }
                if (attrs.onClick) {
                    attrs.onClick(()=>{
                        this.isLoading = false
                        this.refresh()
                    })
                }
                if (attrs.loadingIcon) {
                    this.isLoading = true
                    this.refresh()
                }
            }}>
            <span style={(attrs.loadingIcon && this.isLoading)?{color:"transparent"}:{}}>{children}</span>
            {attrs.loadingIcon && <span style={spinnerStyle}><ButtonThemeOptions.spinner/></span> || null}
        </button>
    }
}
