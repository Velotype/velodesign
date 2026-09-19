import { Component, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"
import { animateClosed, buildDisclosureContent, flushDisclosureLayout, mountDisclosureStyles } from "./disclosure-view.tsx"

/**
 * A single node in a `<Tree/>`
 */
export type TreeNodeType = {
    /** Unique key identifying this node. Must be unique across the whole tree, not just among siblings - the open/close methods address nodes by it */
    key: string
    /** Displayed label for this node */
    label: RenderableElements
    /** Child nodes; if omitted (or empty), this node renders as a leaf */
    children?: TreeNodeType[]
    /** Should this node start expanded? (default: `false`) */
    defaultOpen?: boolean
    /** Content shown before the label - an `Icon`, a `Badge`, an `Avatar`. Matches `ListItemType.leading` */
    leading?: RenderableElements
    /** Content shown after the label, pushed to the trailing edge - a count, a status dot. Matches `ListItemType.trailing` */
    trailing?: RenderableElements
}

/**
 * Attrs type for `<Tree/>` Component
 */
export type TreeAttrsType = {
    /** The set of root nodes to show */
    nodes: TreeNodeType[]
    /**
     * Called when a node's label is clicked.
     *
     * Leaving this unset is meaningful: without it a leaf is a plain container rather than
     * something claiming to be a button, which is what lets a `Link`/`NavLink` be the `label` and
     * own its own click.
     */
    onSelect?: (node: TreeNodeType) => void
    /** Called whenever a branch opens or closes, including from `setOpen`. Use it to persist what the reader expanded */
    onToggle?: (node: TreeNodeType, open: boolean) => void
    /** Accessible name for the tree as a whole. No default - the library doesn't assume a language */
    ariaLabel?: string
} & IdAttr & StylePassthroughAttrs

let areTreeStylesMounted = false

/** What a branch node needs for its open/close state to be read and driven later */
type Branch = {
    node: TreeNodeType
    details: HTMLDetailsElement
    content: HTMLDivElement
}

/**
 * A hierarchical, expandable/collapsible list, built on nested native `<details>`/`<summary>`
 * pairs - each node carries its own open/closed state.
 *
 * Nodes open and close with the same animation as `Collapse` and `Accordion`, from the same
 * `disclosure-view.tsx`. It takes the *mechanism* and not the chrome: a tree row is not a header,
 * so it keeps its own hover, its own chevron and its own indentation, and never gets the border
 * box or header fill those two draw.
 *
 * **A class rather than a `FunctionComponent`, because its open/closed state has to be readable
 * and drivable from outside.** A filterable tree needs exactly that: the filter has to be able to
 * reveal a branch whose child matched, and has to be able to put the reader's own expansions back
 * afterwards. Reading `<details open>` out of the DOM would work and would make a consumer depend
 * on the markup this component happens to emit, so it is a method instead.
 *
 * The tree is built once in the constructor and `render()` returns it, so **never call
 * `refresh()` here**: `label` is `RenderableElements`, so it can hold a consumer's own components,
 * and rebuilding would silently discard whatever state those hold. Every method below does a
 * targeted DOM update instead.
 */
export class Tree extends Component<TreeAttrsType> {
    #root: HTMLUListElement
    /** Every branch node by key, so open/close can address one without walking the DOM */
    #branches = new Map<string, Branch>()
    /**
     * Branch keys in document order, parents before their children.
     *
     * Kept separately because a branch can only register itself *after* its children have been
     * rendered - it needs the content element they build. Iterating the map would therefore
     * report the deepest node first, which is not what a caller reading "in order" expects.
     */
    #branchOrder: string[] = []
    /** Each branch's parent branch, so `reveal` can walk up without searching the DOM */
    #parents = new Map<string, string | undefined>()
    #onToggle?: (node: TreeNodeType, open: boolean) => void

    constructor(attrs: TreeAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        this.#onToggle = attrs.onToggle
        mountDisclosureStyles()
        if (!areTreeStylesMounted) {
            areTreeStylesMounted = true
            setStylesheet(`
.vtd-tree{width:100%;box-sizing:border-box;list-style:none;padding:0;margin:0;}
.vtd-tree-children{list-style:none;padding-inline-start:1.25em;margin:0;}
.vtd-tree-node{margin-block:0.1em;}
.vtd-tree-label,.vtd-tree-leaf{
cursor:pointer;
padding:0.3em 0.5em;
border-radius:0.25rem;
list-style:none;
user-select:none;
}
.vtd-tree-leaf{display:block;}
/*
 * The row is a flex line so the ::before chevron and the label sit on one baseline. It has to be:
 * with a leading/trailing slot the label becomes a block-level flex container, which a plain
 * display:block summary pushes onto the line *below* the chevron, stranding the chevron above it.
 * A flex row makes the chevron a flex item instead, and a text-only label lays out as it always
 * did. (No backticks in here - they close the template literal. CLAUDE.md, fourth occurrence.)
 */
.vtd-tree-label{display:flex;align-items:center;}
.vtd-tree-label::-webkit-details-marker{display:none;}
.vtd-tree-label::marker{display:none;content:"";}
.vtd-tree-label::before{
content:"";
display:inline-block;
flex-shrink:0;
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
/*
 * A row with either slot becomes a flex line: leading, the label, then trailing pushed to the far
 * edge by the label's own growth. The slots sit in reading order in the markup rather than being
 * reordered in CSS, so what a screen reader announces matches what the row looks like.
 */
.vtd-tree-label-content{display:flex;align-items:center;gap:0.4em;flex-grow:1;min-width:0;}
.vtd-tree-label-main{flex-grow:1;min-width:0;}
.vtd-tree-leading,.vtd-tree-trailing{display:inline-flex;align-items:center;flex-shrink:0;}
@media (prefers-reduced-motion: reduce){
.vtd-tree-label::before{transition:none;}
}
`, "vtd/Tree")
        }

        const contents: HTMLElement[] = []
        this.#root = passthroughAttrsToElement<HTMLUListElement>(<ul class="vtd-tree" role="tree" aria-label={attrs.ariaLabel}>
            {attrs.nodes.map(node => <li>{this.#renderNode(node, contents, attrs.onSelect)}</li>)}
        </ul>, attrs)
        flushDisclosureLayout(contents)
    }

    /**
     * Recursively renders one node, using a native `<details>`/`<summary>` for any node with
     * children.
     *
     * `contents` collects every animated wrapper so the caller can flush layout on them once - see
     * `flushDisclosureLayout`.
     */
    #renderNode(node: TreeNodeType, contents: HTMLElement[], onSelect?: (node: TreeNodeType) => void, parentKey?: string): RenderableElements {
        // Only wrap when there is something to wrap: a plain label stays a plain label, so a
        // consumer's own CSS is not fighting a span it did not ask for.
        const labelContent = node.leading || node.trailing
            ? <span class="vtd-tree-label-content">
                {node.leading ? <span class="vtd-tree-leading">{node.leading}</span> : null}
                <span class="vtd-tree-label-main">{node.label}</span>
                {node.trailing ? <span class="vtd-tree-trailing">{node.trailing}</span> : null}
            </span>
            : node.label

        if (node.children && node.children.length > 0) {
            // A click anywhere on <summary> - including its disclosure-arrow area, drawn via
            // ::before, which has no element of its own to attach a distinct handler to - triggers
            // the browser's native toggle-open/closed behavior, regardless of where onClick is
            // attached. Putting onSelect directly on <summary> (as this used to) therefore fired
            // onSelect on every expand/collapse click too, not just on a genuine label click.
            // Scoping onSelect to only the inner label span, and calling preventDefault() there,
            // cancels the pending toggle specifically for that click while leaving clicks on the
            // rest of the row (the arrow, the row's own padding) to toggle exactly as before.
            // Claim this branch's place in the order before descending, so parents are reported
            // ahead of their children
            this.#branchOrder.push(node.key)
            this.#parents.set(node.key, parentKey)
            const content = buildDisclosureContent(<ul class="vtd-tree-children" role="group">
                {node.children.map(child => <li>{this.#renderNode(child, contents, onSelect, node.key)}</li>)}
            </ul>)
            contents.push(content)

            // Without onSelect there is nothing to cancel the toggle for, so the label stays a
            // plain span and a click anywhere on the row expands the branch - which is what a
            // consumer who puts their own link in `label` wants.
            const labelInner = onSelect
                ? <span class="vtd-tree-label-text" onClick={(event: MouseEvent) => {
                    event.preventDefault()
                    onSelect(node)
                }}>{labelContent}</span>
                : labelContent

            const summary: HTMLElement = <summary class="vtd-tree-label">{labelInner}</summary>
            const details: HTMLDetailsElement = <details class="vtd-tree-node" open={node.defaultOpen}>
                {summary}
                {content}
            </details>

            // Closing is sequenced rather than left to the browser, for the reason in
            // `disclosure-view.tsx`: dropping `open` stops the subtree rendering, so the collapse
            // transition never starts and every toggle after the first snaps.
            summary.addEventListener("click", (event: Event) => {
                // The label span above already handled this click as a selection and cancelled the
                // toggle - without this guard the node would animate shut on every label click.
                // A click on a link inside the label defaultPrevents for the same reason.
                if (event.defaultPrevented || !details.open) {
                    return
                }
                event.preventDefault()
                animateClosed({details, content: content as HTMLDivElement})
            })

            // `onToggle` is driven by the element's own `toggle` event rather than from the click
            // handler above, and that is not a stylistic choice: a click handler runs *before* the
            // browser applies the new state, so an `onToggle` that called `getOpenKeys()` - the
            // obvious thing to do with it - would read the state as it was a moment ago. The
            // showcase's sidebar did exactly that and silently lost every expansion. `toggle` fires
            // after the flip, and covers `setOpen` and a sequenced close landing later too, so
            // there is one report per real change from every path.
            details.addEventListener("toggle", () => {
                this.#onToggle?.(node, details.open)
            })

            this.#branches.set(node.key, {node, details, content: content as HTMLDivElement})
            return details
        }

        // A leaf with no onSelect is a container, not a control. Claiming role="button" and taking
        // focus while doing nothing on activation is worse than being inert, and it is what stops
        // a Link/NavLink in `label` from owning its own click.
        // Leaves record their parent as well, so `reveal` can be handed the key of the thing that
        // actually matched rather than the branch a caller worked out holds it
        this.#parents.set(node.key, parentKey)
        if (!onSelect) {
            return <div class="vtd-tree-leaf">{labelContent}</div>
        }
        return <div
            class="vtd-tree-leaf"
            role="button"
            tabindex={0}
            onClick={() => onSelect(node)}
            onKeyDown={(event: KeyboardEvent) => {
                if (event.key == "Enter" || event.key == " ") {
                    event.preventDefault()
                    onSelect(node)
                }
            }}>{labelContent}</div>
    }

    /**
     * Is this branch open?
     *
     * A branch mid-close still carries `open` - the attribute is held for the length of the
     * collapse animation so the subtree keeps rendering - so it is reported as closed here. What a
     * caller wants to know is where the tree is heading, not what the markup says this frame.
     *
     * A leaf, or an unknown key, is `false`: neither is open, and neither can be opened.
     */
    isOpen(key: string): boolean {
        const branch = this.#branches.get(key)
        if (!branch) {
            return false
        }
        return branch.details.open && !branch.details.classList.contains("vtd-disclosure-closing")
    }

    /** Every branch currently open, in document order */
    getOpenKeys(): string[] {
        return this.#branchOrder.filter(key => this.isOpen(key))
    }

    /** Every branch in this tree, open or not, in document order - the keys the methods accept */
    getBranchKeys(): string[] {
        return [...this.#branchOrder]
    }

    /**
     * Opens or closes one branch.
     *
     * `animate` defaults to true, matching a click. Pass `false` when the change is a *consequence*
     * of something else the reader did - revealing the branch that holds their search match, or
     * restoring what they had open before - where a transition reads as lag rather than as
     * feedback.
     */
    setOpen(key: string, open: boolean, animate: boolean = true): void {
        const branch = this.#branches.get(key)
        if (!branch || this.isOpen(key) == open) {
            return
        }
        if (open) {
            // A branch caught mid-close has to lose the closing class, or the rule that animates it
            // back open cannot match and it would reopen with no transition
            branch.details.classList.remove("vtd-disclosure-closing")
            branch.details.open = true
        } else if (animate) {
            animateClosed({details: branch.details, content: branch.content})
        } else {
            branch.details.classList.remove("vtd-disclosure-closing")
            branch.details.open = false
        }
        // No `onToggle` call here: the element's own `toggle` listener reports it, which keeps one
        // report per change whether the change came from a click, from here, or from a close that
        // lands a transition later
    }

    /**
     * Opens a node and every ancestor above it, so it is actually on screen.
     *
     * This is the one to reach for when revealing a search match: `setOpen` on its own opens the
     * branch you name and leaves a closed ancestor hiding it, which looks exactly like nothing
     * happened. Never animated - a chain of branches opening in sequence reads as lag.
     *
     * The key may name a leaf: its ancestors are opened and the leaf itself needs nothing.
     */
    reveal(key: string): void {
        let current: string | undefined = this.#branches.has(key) ? key : this.#parents.get(key)
        while (current) {
            this.setOpen(current, true, false)
            current = this.#parents.get(current)
        }
    }

    /**
     * Makes exactly these branches open and every other one closed.
     *
     * `animate` defaults to **false** here, unlike `setOpen`: this sets the shape of the whole
     * tree at once, and animating several branches in opposite directions simultaneously reads as
     * noise rather than as a transition.
     */
    setOpenKeys(keys: Iterable<string>, animate: boolean = false): void {
        const wanted = new Set(keys)
        for (const key of this.#branchOrder) {
            this.setOpen(key, wanted.has(key), animate)
        }
    }

    override render(): HTMLUListElement {
        return this.#root
    }
}
