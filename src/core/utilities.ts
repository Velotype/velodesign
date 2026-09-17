
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
