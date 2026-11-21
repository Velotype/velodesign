/**
 * Counts the listeners on `document`, by type: added less removed. A gallery imports this first,
 * before anything adds one, so a test can read `__documentListeners()` and check that what a
 * component takes off the page takes its listeners with it.
 */
const live = new Map<string, number>()
const add = EventTarget.prototype.addEventListener
const remove = EventTarget.prototype.removeEventListener

EventTarget.prototype.addEventListener = function(this: EventTarget, type: string, ...rest: unknown[]) {
    if (this === document) {live.set(type, (live.get(type) ?? 0) + 1)}
    return (add as (...args: unknown[]) => void).call(this, type, ...rest)
}
EventTarget.prototype.removeEventListener = function(this: EventTarget, type: string, ...rest: unknown[]) {
    if (this === document) {live.set(type, (live.get(type) ?? 0) - 1)}
    return (remove as (...args: unknown[]) => void).call(this, type, ...rest)
}

;(globalThis as unknown as {__documentListeners: () => Record<string, number>}).__documentListeners = () => Object.fromEntries(live)
