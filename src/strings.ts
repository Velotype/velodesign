import type { FunctionComponent } from "@velotype/velotype"

export class LocalizedString {
    key: string
    value: string
    pluralValue?: string
    constructor(key: string, value: string, pluralValue?: string) {
        this.key = key
        this.value = value
        this.pluralValue = pluralValue
    }
    resolveString = (num?: number): string => {
        if (this.pluralValue && num!=undefined) {
            if (num == 1) {
                return this.value
            } else {
                return this.pluralValue
            }
        } else {
            return this.value
        }
    }
}

const localeStrings = new Map<string,LocalizedString>()

// ----------------------------------------------------------------------
//                             Strings I18N
// ----------------------------------------------------------------------

/**
 *  S for Strings
 * 
 * This struct provides an interface for registering strings with Freact.
 * These strings may then be rendered via \<T k="key"/> JSX elements or S.g()
 */
export const S = {
    /** add a simple string */
    a: function(key: string, value: string): void {
        localeStrings.set(key, new LocalizedString(key,value))
    },
    /** add a LocalizedString */
    aS: function(str: LocalizedString): void {
        localeStrings.set(str.key, str)
    },
    /** get a resolved localized string */
    g: function(key: string, num?: number): string {
        const selectedString: LocalizedString | undefined = localeStrings.get(key)
        if (!selectedString) {
            console.error("Missing key:", key)
            return `-- ${key} --`
        }
        return selectedString.resolveString(num)
    }
}

/**
 * T for Text
 * 
 * This class renders text onto the page.
 * 
 * @param attrs.k is the key used to lookup a string (required)
 * @param attrs.n is a number used for pluralization (optional)
 */
export type TAttrsType = {
    /** key */
    k: string
    /** associated number (for resolving plurals) */
    n?: number
}
export const T: FunctionComponent<TAttrsType> = function(props: TAttrsType) {
    return S.g(props.k,props.n)
}
