
/** Regular console.log() - used for JS minification */
export const consoleLog = console.log

/** Regular console.error() - used for JS minification */
export const consoleError = console.error

/** call setAttribute() - used for JS minification */
export const setAttributeHelper = function(element: Element | SVGSVGElement | SVGPathElement, qualifiedName: string, value: string) {
    element.setAttribute(qualifiedName, value)
}

/** Namespace for SVG elements - used for JS minification */
export const svgNamespace = "http://www.w3.org/2000/svg"

/** Create Element with SVG namespace - used for JS minification */
export const createElementNSHelper = function(qualifiedName: string) {
    return document.createElementNS(svgNamespace, qualifiedName)
}

/*
 * ---------------------------------------------------------------------------------------------
 * `globalThis` wrappers.
 *
 * Every one of these exists for the same reason as the helpers above: **`globalThis` is a global,
 * so a minifier cannot shorten it, and it cannot shorten the property name after it either.**
 * `globalThis.addEventListener(` is 29 characters that survive minification intact at every call
 * site. Wrapped, the call site becomes a single mangled identifier - these are module-internal
 * (nothing re-exports them from `index.ts`), so esbuild renames them to one or two letters - and
 * the long form is written once, here.
 *
 * They are wrapper *functions*, never `const x = globalThis.foo` aliases the way `consoleLog` is
 * one. `console.log` tolerates being called unbound; `addEventListener`, `setTimeout` and
 * `matchMedia` do not - detached from their receiver they throw "Illegal invocation".
 *
 * Nothing here changes behaviour. `matchMediaHelper` keeps the optional call, so a non-browser
 * host still gets `undefined` rather than a throw, exactly as the one call site that cared already
 * handled.
 * ---------------------------------------------------------------------------------------------
 */

/** call globalThis.addEventListener() - used for JS minification */
export const addGlobalListener = function(type: string, listener: EventListenerOrEventListenerObject): void {
    globalThis.addEventListener(type, listener)
}

/** call globalThis.removeEventListener() - used for JS minification */
export const removeGlobalListener = function(type: string, listener: EventListenerOrEventListenerObject): void {
    globalThis.removeEventListener(type, listener)
}

/** call globalThis.dispatchEvent() - used for JS minification */
export const dispatchGlobalEvent = function(event: Event): boolean {
    return globalThis.dispatchEvent(event)
}

/** call globalThis.setTimeout() - used for JS minification */
export const setTimeoutHelper = function(handler: () => void, timeout?: number): number {
    return globalThis.setTimeout(handler, timeout)
}

/** call globalThis.clearTimeout() - used for JS minification */
export const clearTimeoutHelper = function(id: number | undefined): void {
    globalThis.clearTimeout(id)
}

/** call globalThis.requestAnimationFrame() - used for JS minification */
export const requestFrame = function(callback: FrameRequestCallback): number {
    return globalThis.requestAnimationFrame(callback)
}

/** call globalThis.matchMedia() - used for JS minification. Undefined off a browser. */
export const matchMediaHelper = function(query: string): MediaQueryList | undefined {
    return globalThis.matchMedia?.(query)
}

/** read globalThis.location.pathname - used for JS minification */
export const getPathname = function(): string {
    return globalThis.location.pathname
}

/** assign globalThis.location.href, navigating the page - used for JS minification */
export const setHref = function(href: string): void {
    globalThis.location.href = href
}

/** call globalThis.history.pushState() - used for JS minification */
export const pushHistoryState = function(url: string): void {
    globalThis.history.pushState(null, "", url)
}

/** read globalThis.innerHeight - used for JS minification */
export const getInnerHeight = function(): number {
    return globalThis.innerHeight
}

/** read globalThis.scrollY - used for JS minification */
export const getScrollY = function(): number {
    return globalThis.scrollY
}
