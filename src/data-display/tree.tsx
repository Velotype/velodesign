import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { animateClosed, buildDisclosureContent, flushDisclosureLayout, mountDisclosureStyles } from "./disclosure-view.tsx"

/**
 * A single node in a `<Tree/>`
 */
export type TreeNodeType = {
    /** Unique key identifying this node */
    key: string
    /** Displayed label for this node */
    label: RenderableElements
    /** Child nodes; if omitted (or empty), this node renders as a leaf */
    children?: TreeNodeType[]
    /** Should this node start expanded? */
    defaultOpen?: boolean
}

/**
 * Attrs type for `<Tree/>` Component
 */
export type TreeAttrsType = {
    /** The set of root nodes to show */
    nodes: TreeNodeType[]
    /** Called when a node's label is clicked */
    onSelect?: (node: TreeNodeType) => void
} & IdAttr & StylePassthroughAttrs

let areTreeStylesMounted = false

/**
 * Recursively renders one node, using a native `<details>`/`<summary>` for any node with children.
 *
 * `contents` collects every animated wrapper so the caller can flush layout on them once - see
 * `flushDisclosureLayout`.
 */
function renderNode(node: TreeNodeType, contents: HTMLElement[], onSelect?: (node: TreeNodeType) => void): RenderableElements {
    if (node.children && node.children.length > 0) {
        // A click anywhere on <summary> - including its disclosure-arrow area, drawn via
        // ::before, which has no element of its own to attach a distinct handler to - triggers
        // the browser's native toggle-open/closed behavior, regardless of where onClick is
        // attached. Putting onSelect directly on <summary> (as this used to) therefore fired
        // onSelect on every expand/collapse click too, not just on a genuine label click. Scoping
        // onSelect to only the inner label span, and calling preventDefault() there, cancels the
        // pending toggle specifically for that click while leaving clicks on the rest of the row
        // (the arrow, the row's own padding) to toggle exactly as before, untouched by onSelect.
        const content = buildDisclosureContent(<ul class="vtd-tree-children">
            {node.children.map(child => <li>{renderNode(child, contents, onSelect)}</li>)}
        </ul>)
        contents.push(content)

        const summary: HTMLElement = <summary class="vtd-tree-label">
            <span class="vtd-tree-label-text" onClick={(event: MouseEvent) => {
                event.preventDefault()
                onSelect?.(node)
            }}>{node.label}</span>
        </summary>
        const details: HTMLDetailsElement = <details class="vtd-tree-node" open={node.defaultOpen}>
            {summary}
            {content}
        </details>

        // Closing is sequenced rather than left to the browser, for the reason in
        // `disclosure-view.tsx`: dropping `open` stops the subtree rendering, so the collapse
        // transition never starts and every toggle after the first snaps.
        summary.addEventListener("click", (event: Event) => {
            // The label span above already handled this click as a selection and cancelled the
            // toggle - without this guard the node would animate shut on every label click
            if (event.defaultPrevented || !details.open) {
                return
            }
            event.preventDefault()
            animateClosed({details, content: content as HTMLDivElement})
        })
        return details
    }
    return <div
        class="vtd-tree-leaf"
        role="button"
        tabindex={0}
        onClick={() => onSelect?.(node)}
        onKeyDown={(event: KeyboardEvent) => {
            if (event.key == "Enter" || event.key == " ") {
                event.preventDefault()
                onSelect?.(node)
            }
        }}>{node.label}</div>
}

/**
 * A hierarchical, expandable/collapsible list, built on nested native `<details>`/`<summary>`
 * pairs - each node carries its own open/closed state.
 *
 * Nodes open and close with the same animation as `Collapse` and `Accordion`, from the same
 * `disclosure-view.tsx`. It takes the *mechanism* and not the chrome: a tree row is not a header,
 * so it keeps its own hover, its own chevron and its own indentation, and never gets the border
 * box or header fill those two draw.
 */
export const Tree: FunctionComponent<TreeAttrsType> = function(attrs: TreeAttrsType, _children: RenderableElements[]): HTMLUListElement {
    mountDisclosureStyles()
    if (!areTreeStylesMounted) {
        areTreeStylesMounted = true
        setStylesheet(`
.vtd-tree{width:100%;box-sizing:border-box;list-style:none;padding:0;margin:0;}
.vtd-tree-children{list-style:none;padding-inline-start:1.25em;margin:0;}
.vtd-tree-node{margin-block:0.1em;}
.vtd-tree-label,.vtd-tree-leaf{
cursor:pointer;
display:block;
padding:0.3em 0.5em;
border-radius:0.25rem;
list-style:none;
user-select:none;
}
.vtd-tree-label::-webkit-details-marker{display:none;}
.vtd-tree-label::marker{display:none;content:"";}
.vtd-tree-label::before{
content:"";
display:inline-block;
width:0.5em;
height:0.5em;
margin-inline-end:0.5em;
border:solid var(--text);
border-width:0 0.1em 0.1em 0;
transform:rotate(-45deg);
transition:transform 0.15s ease-in-out;
}
/* Matches the chevron elsewhere: it turns back the moment a close starts, not when it finishes */
.vtd-tree-node[open]:not(.vtd-disclosure-closing) > .vtd-tree-label::before{transform:rotate(45deg);}
.vtd-tree-leaf{margin-inline-start:1.15em;}
.vtd-tree-label:hover,.vtd-tree-leaf:hover{background-color:var(--background-1);}
.vtd-tree-leaf:focus-visible{outline:1px solid var(--primary);outline-offset:1px;}
`, "vtd/Tree")
    }

    const contents: HTMLElement[] = []
    const root = passthroughAttrsToElement<HTMLUListElement>(<ul class="vtd-tree">
        {attrs.nodes.map(node => <li>{renderNode(node, contents, attrs.onSelect)}</li>)}
    </ul>, attrs)
    flushDisclosureLayout(contents)
    return root
}
