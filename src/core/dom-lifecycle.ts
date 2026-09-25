import type { RenderableElements } from "./velotype.ts"

/**
 * The five structural-DOM methods velotype core installs on every `Component` instance.
 *
 * Declared structurally rather than as `Component<any>` so this module needs no `any` and so the
 * requirement reads as what it is: "something that can attach children with the lifecycle
 * attached". Every `Component` satisfies it.
 */
export type LifecycleOwner = {
    replaceChildrenOfChild(child: HTMLElement, newChildren: RenderableElements[]): boolean
    appendToChild(child: HTMLElement, toAppendChild: RenderableElements): boolean
    prependToChild(child: HTMLElement, toPrependChild: RenderableElements): boolean
    removeChild(child: HTMLElement): boolean
}

/**
 * Why this module exists, and why a component must never call `element.replaceChildren(...)`,
 * `element.appendChild(...)` or `element.remove()` on anything that is already on the page.
 *
 * ## The mechanism
 *
 * Writing `<Foo/>` in JSX constructs the component, runs its `render()`, registers the instance in
 * velotype's key map and stamps that key onto the root element. It does **not** call `mount()` -
 * it cannot, because nothing is on the page yet. `mount()` comes later, from a walk of the
 * freshly-attached subtree looking for those stamped keys, and velotype reaches that walk from
 * exactly three kinds of place: `replaceElementWithRoot` (app boot), `refresh()`, and the five
 * `Component` methods in `LifecycleOwner` above plus `replaceChild`. `unmount()` is the same walk
 * in reverse.
 *
 * A native DOM call is not one of them. It puts the elements on the page - correctly, and looking
 * exactly right - and skips both halves:
 *
 * - **`mount()` never runs.** The markup is identical either way; what is missing is every
 *   subscription the component makes to something *outside* itself. A `popstate` listener, a
 *   `document` click-away handler, a `matchMedia` watcher, a `mountStyles()` call. The component
 *   is inert with respect to the rest of the page and looks completely normal.
 * - **`unmount()` never runs either, and that half leaks.** Unmounting is what strips a component
 *   out of velotype's global listener registry and releases its vtKey. Elements dropped by a
 *   native call are gone from the DOM and still in both, holding a detached tree alive. In a list
 *   rebuilt per keystroke that is a leak per keystroke.
 *
 * This is not hypothetical: it is where `Sidebar`'s active-page marker bug came from. Every row is
 * a `NavLink`, a `NavLink` does all of its work in `mount()`, and `setItems` attached its tree with
 * a bare `body.replaceChildren(...)` - so no row ever subscribed to `popstate`, and the sidebar
 * went on pointing at whichever page the reader first loaded however far they browsed from it.
 *
 * ## Why a helper rather than calling the methods directly
 *
 * Because the correct call differs between the constructor and everywhere else, and **getting it
 * wrong is silent in both directions**:
 *
 * - In the constructor the subtree is not on the page yet, so nothing needs mounting - it all
 *   mounts as one when the component itself is placed. And velotype installs these five methods on
 *   the instance *after* the constructor returns, so calling one there hits the base-class stub,
 *   which returns `false` and writes nothing at all.
 * - After the constructor the native call is the silent one, in the ways above.
 *
 * Most of the components that need this - `DataTable`, `AsyncDataTable`, `SelectMenu`, `Calendar` -
 * call the same private `#renderX()` from their constructor *and* from their state handlers, so
 * neither answer is right for the whole method. `element.isConnected` decides it exactly rather
 * than approximately: it is false for precisely the case where no mounting is owed, and true for
 * precisely the case where it is.
 *
 * ## What does *not* need this
 *
 * Attribute, class, `textContent` and style writes - `classList.toggle`, `setAttribute`,
 * `scrollIntoView`, `.value =` - add and remove no components, so no lifecycle is involved. The
 * `charts/` modules are also exempt and deliberately stay on raw DOM calls: they build SVG through
 * `document.createElementNS` (velotype's JSX cannot emit `<svg>` at all), every one of their
 * content attrs is typed `string`, and so there is never a component anywhere in a chart to mount.
 */
function hostNotOwned(method: string): never {
    throw new Error(`velodesign: ${method} was given an element that is on the page but is not` +
        ` inside the component that owns it, so velotype cannot run the mount lifecycle for it.` +
        ` Pass an element from this component's own tree.`)
}

/**
 * Replace every child of `host` with `children`, running velotype's unmount/mount lifecycle for
 * the components going out and coming in.
 *
 * The replacement for `host.replaceChildren(...children)`. See this module's docs for why.
 */
export function setChildren(owner: LifecycleOwner, host: HTMLElement, children: RenderableElements[]): void {
    if (!host.isConnected) {
        // Still being built. Nothing here is mounted, so nothing needs unmounting, and the whole
        // subtree mounts together when the owning component is placed.
        host.replaceChildren(...children.map(childToNode))
        return
    }
    if (!owner.replaceChildrenOfChild(host, children)) {
        hostNotOwned("setChildren")
    }
}

/**
 * Append `child` to `host`, running velotype's mount lifecycle for it.
 *
 * The replacement for `host.appendChild(child)`. See this module's docs for why.
 */
export function appendChild(owner: LifecycleOwner, host: HTMLElement, child: RenderableElements): void {
    if (!host.isConnected) {
        host.appendChild(childToNode(child))
        return
    }
    if (!owner.appendToChild(host, child)) {
        hostNotOwned("appendChild")
    }
}

/**
 * Take `element` off the page, running velotype's unmount lifecycle for it and everything inside.
 *
 * The replacement for `element.remove()`. `owner` may be the component that *is* `element` as well
 * as one that contains it - velotype's check is `contains`, and a node contains itself - which is
 * what a self-dismissing `Alert` or `Tag` needs.
 */
export function removeElement(owner: LifecycleOwner, element: HTMLElement): void {
    if (!element.isConnected) {
        element.remove()
        return
    }
    if (!owner.removeChild(element)) {
        hostNotOwned("removeElement")
    }
}

/**
 * Only reached on the not-yet-connected path, where velotype's own conversion is out of reach.
 *
 * Deliberately narrow: it covers what the constructors in this package actually pass - an element
 * or a string - and throws on anything else rather than guessing, because the connected path
 * handles every `RenderableElements` shape and a silent difference between the two paths is
 * exactly the class of bug this module exists to remove.
 */
function childToNode(child: RenderableElements): Node {
    if (child instanceof Node) {
        return child
    }
    if (typeof child == "string" || typeof child == "number" || typeof child == "bigint") {
        return document.createTextNode(String(child))
    }
    throw new Error("velodesign: this helper only converts elements and text before a component is" +
        " on the page - build richer children with JSX first")
}
