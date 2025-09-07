import { consoleLog } from "./utilities.ts"

/** Map of license names to license content */
export const licenses: Map<string,string> = new Map<string,string>()

/** Represents if the initial set of licenses have been logged */
let initialSetLogged: boolean = false

/**
 * Add open source license text to a collection for logging
 * 
 * @param key a unique key that represents this license
 * @param text the text of the license to log
 */
export function addLicense(key: string, text: string): void {
    if (!licenses.has(key)) {
        licenses.set(key, text)
        if (initialSetLogged) {
            consoleLog(text)
        }
    }
}

// Initial log output of license text
setTimeout(() => {
    licenses.entries().forEach(([_licenseKey, licenseText]) => {
        consoleLog(licenseText)
    })
    initialSetLogged = true
}, 1000)
