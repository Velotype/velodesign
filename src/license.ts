import { consoleLog } from "./utilities.ts"

/** Map of license names to license content */
export const licenses: Map<string,string> = new Map<string,string>()

// ----------------------------------------------------------------------
//                             License handling
// ----------------------------------------------------------------------

/** Map of license names to track which have been outout to console.log */
const licenseLog: Set<string> = new Set<string>()
let initialSetLogged: boolean = false
export function addLicense(key: string, text: string): void {
    if (!licenses.has(key)) {
        licenses.set(key, text)
        if (initialSetLogged && !licenseLog.has(key)) {
            consoleLog(text)
            licenseLog.add(key)
        }
    }
}

// Initial log output of license text
setTimeout(() => {
    licenses.entries().forEach(([licenseKey, licenseText]) => {
        consoleLog(licenseText)
        licenseLog.add(licenseKey)
    })
    initialSetLogged = true
}, 1000)

// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
