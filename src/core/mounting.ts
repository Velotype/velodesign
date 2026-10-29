import { replaceElementWithRoot } from "./velotype.ts"

/**
 * Puts `children` in `parent` in place of what it held, and mounts them.
 *
 * A plain `parent.replaceChildren(...)` leaves the new content unmounted: a Component inside it (a
 * `Popover`, a `Popconfirm`, a `Modal` in a table cell) never has its `mount()` called, so the
 * document listeners it adds there - closing on an outside click, following a scroll - are never
 * added. Use this wherever a component re-fills part of its own DOM with content its consumer
 * rendered.
 *
 * The old content is removed without being released: a consumer may hand back the same element or
 * RenderObject on the next render (a cached cell), and a released one never mounts or updates
 * again. So a Component that was in the old content keeps its listeners until the page goes, which costs a check per click.
 *
 * While `parent` is not yet in the document nothing is mounted here; velotype mounts it all when
 * the component that owns `parent` is inserted.
 */
export function replaceMountedChildren(parent: HTMLElement, ...children: HTMLElement[]): void {
    parent.replaceChildren()
    for (const child of children) {
        // replaceElementWithRoot mounts what it puts in place of an element already in the document
        const spot = document.createElement("span")
        parent.appendChild(spot)
        replaceElementWithRoot(child, spot)
    }
}
