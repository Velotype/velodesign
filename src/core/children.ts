import type { Component } from "./velotype.ts"

/**
 * Replaces the children of `element`, an element of `component`'s render, so that the Components
 * in what leaves unmount and the ones in what arrives mount: through the Component's own
 * `replaceChildrenOfChild()` once `element` is on the page. A bare `replaceChildren()` does
 * neither, so a Component in consumer content (a `Popconfirm`, a `Menu`) would never mount, or
 * would keep its document listeners after it left.
 *
 * Before `element` is on the page, directly: nothing in it is mounted yet, and what arrives
 * mounts with the page. That covers a call from the constructor, before the Component has an
 * element and its child methods work.
 */
export function replaceChildrenThrough(component: Component<unknown>, element: HTMLElement, children: (HTMLElement | string)[]): void {
    if (element.isConnected) {
        component.replaceChildrenOfChild(element, children)
    } else {
        element.replaceChildren(...children)
    }
}
