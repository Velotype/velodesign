import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

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

/** Recursively renders one node, using a native `<details>`/`<summary>` for any node with children */
function renderNode(node: TreeNodeType, onSelect?: (node: TreeNodeType) => void): RenderableElements {
    if (node.children && node.children.length > 0) {
        return <details class="vtd-tree-node" open={node.defaultOpen}>
            <summary class="vtd-tree-label" onClick={() => onSelect?.(node)}>{node.label}</summary>
            <ul class="vtd-tree-children">
                {node.children.map(child => <li>{renderNode(child, onSelect)}</li>)}
            </ul>
        </details>
    }
    return <div class="vtd-tree-leaf" onClick={() => onSelect?.(node)}>{node.label}</div>
}

/**
 * A hierarchical, expandable/collapsible list, built on nested native `<details>`/`<summary>`
 * pairs - each node manages its own open/closed state with zero JS state, same trade-off as
 * `Accordion`/`Collapse`/`Menu`
 */
export const Tree: FunctionComponent<TreeAttrsType> = function(attrs: TreeAttrsType, _children: RenderableElements[]): HTMLUListElement {
    if (!areTreeStylesMounted) {
        areTreeStylesMounted = true
        setStylesheet(`
.vtd-tree{list-style:none;padding:0;margin:0;}
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
.vtd-tree-node[open] > .vtd-tree-label::before{transform:rotate(45deg);}
.vtd-tree-leaf{margin-inline-start:1.15em;}
.vtd-tree-label:hover,.vtd-tree-leaf:hover{background-color:var(--background-1);}
`, "vtd/Tree")
    }

    return passthroughAttrsToElement<HTMLUListElement>(<ul class="vtd-tree">
        {attrs.nodes.map(node => <li>{renderNode(node, attrs.onSelect)}</li>)}
    </ul>, attrs)
}
