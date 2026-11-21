/**
 * Counts the Components that are mounted while their element is off the page: taken out by a
 * plain DOM call (`remove()`, `replaceChildren()`) rather than through velotype, so they keep
 * whatever `mount()` set up for as long as the page is open.
 *
 * It reads velotype's devtools hook, which every velotype instance registers with, so velotype
 * carries none of this. It also reads two of velotype's internal fields on each Component - `m`,
 * whether it is mounted, and `e`, its element - which a test may depend on and a component may not.
 */
type InternalComponent = {m?: unknown, e?: unknown}
type DevtoolsHook = {instances: Map<number, {domReferences: ReadonlyMap<number, unknown>}>}

;(globalThis as unknown as {__mountedOffPage: () => number}).__mountedOffPage = () => {
    const hook = (globalThis as unknown as {__VELOTYPE_DEVTOOLS_HOOK__?: DevtoolsHook}).__VELOTYPE_DEVTOOLS_HOOK__
    if (!hook) {throw new Error("velotype's devtools hook isn't installed")}
    let count = 0
    for (const instance of hook.instances.values()) {
        for (const reference of instance.domReferences.values()) {
            const component = reference as InternalComponent
            if (component.m === true && component.e instanceof Element && !component.e.isConnected) {count++}
        }
    }
    return count
}
