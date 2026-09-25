import {} from "./velotype.ts"
import { mountStyles } from "./styles.ts"
import { setAttributeHelper } from "./utilities.ts"
import { matchMediaHelper, setTimeoutHelper } from "../core/utilities.ts"

//
// TODO make gradients ?
/*
--linearPrimarySecondary: linear-gradient( #66b2ff, #c6ff9e);
--linearPrimaryAccent: linear-gradient( #66b2ff, #ff6666);
--linearSecondaryAccent: linear-gradient( #c6ff9e, #ff6666);
--radialPrimarySecondary: radial-gradient( #66b2ff, #c6ff9e);
--radialPrimaryAccent: radial-gradient( #66b2ff, #ff6666);
--radialSecondaryAccent: radial-gradient( #c6ff9e, #ff6666);
*/

/**
 * Options to customizable theme parameters
 */
export type ThemeColorOptions = {
    textLightColor?: string
    backgroundLightColor?: string
    backgroundLightAltColor?: string
    primaryLightColor?: string
    secondaryLightColor?: string
    warningLightColor?: string
    accentLightColor?: string

    textDarkColor?: string
    backgroundDarkColor?: string
    backgroundDarkAltColor?: string
    primaryDarkColor?: string
    secondaryDarkColor?: string
    warningDarkColor?: string
    accentDarkColor?: string
}

const white = "#fff"
const black = "#000"

// Theme generator: https://www.realtimecolors.com/?colors=050505-fafafa-66b2ff-c6ff9e-ff6666&fonts=Inter-Inter
// Warning color: https://www.realtimecolors.com/?colors=050505-fafafa-66b2ff-ffd666-ff6666&fonts=Inter-Inter
const defaultTextLightColor = "#050505"
const defaultBackgroundLightColor = white
const defaultBackgroundLightAltColor = black
const defaultPrimaryLightColor = "#66b2ff"
const defaultSecondaryLightColor = "#c6ff9e"
const defaultWarningLightColor = "#ffd666"
const defaultAccentLightColor = "#ff6666"

// Theme generator: https://www.realtimecolors.com/?colors=fafafa-202020-004c99-286100-990000&fonts=Inter-Inter
// Warning color: https://www.realtimecolors.com/?colors=fafafa-202020-004c99-997000-990000&fonts=Inter-Inter
const defaultTextDarkColor = "#fafafa"
const defaultBackgroundDarkColor = "#151515"
const defaultBackgroundDarkAltColor = white
const defaultPrimaryDarkColor = "#004c99"
const defaultSecondaryDarkColor = "#286100"
const defaultWarningDarkColor = "#997000"
const defaultAccentDarkColor = "#990000"

const colorMix = ":color-mix(in hsl,"

const middleSpread = [-8,-6,-4,-2,0,2,4,6,8]
/**
 * Creates a spread of colors:
 * 
 * --{cssColorPrefix}-1 -> 80% mix of color1
 * --{cssColorPrefix}-2 -> 60% mix of color1
 * --{cssColorPrefix}-3 -> 40% mix of color1
 * --{cssColorPrefix}-4 -> 20% mix of color1
 * --{cssColorPrefix}-5 ->   exact color2
 * --{cssColorPrefix}-6 -> 20% mix of color3
 * --{cssColorPrefix}-7 -> 40% mix of color3
 * --{cssColorPrefix}-8 -> 60% mix of color3
 * --{cssColorPrefix}-9 -> 80% mix of color3
 * 
 * --{cssColorPrefix}   ->   exact color2
 * 
 * 
 * @param cssColorPrefix the name of the color spread
 * @param color1 the color for 1-3 mixes
 * @param color2 the main color
 * @param color3 the color for 5-7 mixes
 * @returns 
 */
const middleColorSpread = (cssColorPrefix: string, color1: string, color2: string, color3: string) => {
    return middleSpread.map(e=> {
        if (e<0) {
            return `--${cssColorPrefix}-${e/2+5}${colorMix}${color1} ${-1*e}0%,${color2} ${10+e}0%)`
        } else if (e==0) {
            return `--${cssColorPrefix}-5:${color2};--${cssColorPrefix}:${color2}`
        }
        return `--${cssColorPrefix}-${e/2+5}${colorMix}${color2} ${10-e}0%,${color3} ${e}0%)`
    }).join(";")+";"
}
const gradient = [1,2,3,4,5,6,7,8,9]
/**
 * Creates a gradient of colors:
 * 
 * --{cssColorPrefix}   -> exact color1
 * --{cssColorPrefix}-1 -> 10% mix of color2
 * --{cssColorPrefix}-2 -> 20% mix of color2
 * --{cssColorPrefix}-3 -> 30% mix of color2
 * --{cssColorPrefix}-4 -> 40% mix of color2
 * --{cssColorPrefix}-5 -> 50% mix of color2
 * --{cssColorPrefix}-6 -> 60% mix of color2
 * --{cssColorPrefix}-7 -> 70% mix of color2
 * --{cssColorPrefix}-8 -> 80% mix of color2
 * --{cssColorPrefix}-9 -> 90% mix of color2
 * --{cssColorPrefix}-alt   -> exact color2

 * @param cssColorPrefix
 * @param color1 the main color
 * @param color2 
 * @returns 
 */
const backgroundColorGradient = (cssColorPrefix: string, color1: string, color2: string) => {
    return gradient.map(e=>`--${cssColorPrefix}-${e}${colorMix}${color1} ${10-e}0%,${color2} ${e}0%)`).join(";")+`;--${cssColorPrefix}:${color1};--${cssColorPrefix}-alt:${color2};`
}
/**
 * Creates a pair of text colors:
 * 
 * --{cssColorPrefix}     -> exact color1
 * --{cssColorPrefix}-alt -> exact color2

 * @param cssColorPrefix
 * @param color1 the main text color
 * @param color2 the alternate text color
 * @returns 
 */
const textColors = (cssColorPrefix: string, color1: string, color2: string) => {
    return `--${cssColorPrefix}:${color1};--${cssColorPrefix}-alt:${color2};`
}

const setTheme = function(theme: string) {
    setAttributeHelper(document.getElementsByTagName("html")[0],"data-theme",theme)
}
const localThemeKey = "vtd-preferred-theme"
type ColorSchemeType = "light" | "dark" | "default"
const light = "light"
const dark = "dark"
const defaultScheme = "default"
let currentColorScheme: ColorSchemeType = light

/**
 * A collection of functions to manage the Color scheme
 */
export const ColorScheme: {
    /**
     * The color scheme currently *in effect*, which is only ever `light` or `dark`.
     *
     * `default` resolves here to whichever the browser prefers, so this answers "what does the page
     * look like right now" and never "what did the reader ask for". For the second question - which
     * is what a theme picker has to show as its current value - use `getColorSchemePreference`.
     */
    getColorScheme: () => ColorSchemeType
    /**
     * What the reader chose: `light`, `dark`, or `default` to follow the browser.
     *
     * Distinct from `getColorScheme` and deliberately so. A picker offering all three has no way to
     * say which is selected otherwise: `default` has already resolved to one of the other two by
     * the time anything can read it, so a picker built on `getColorScheme` shows Light selected
     * whether the reader chose Light or chose to follow a browser that prefers it.
     */
    getColorSchemePreference: () => ColorSchemeType
    /** Set the color scheme */
    setColorScheme: (newScheme: ColorSchemeType) => void
    /**
     * Detect the user's preferred color scheme (if set in local storage) and set on the page
     */
    resetColorScheme: () => void
} = {
    getColorScheme: function() {
        return currentColorScheme
    },
    getColorSchemePreference: function() {
        const stored = localStorage.getItem(localThemeKey)
        if (stored == dark) {
            return dark
        }
        if (stored == light) {
            return light
        }
        // Anything else - nothing stored, or a value this version does not recognise - is the
        // browser's preference, which is what resetColorScheme below actually applies
        return defaultScheme
    },
    setColorScheme: function(newScheme: ColorSchemeType) {
        localStorage.setItem(localThemeKey, newScheme)
        ColorScheme.resetColorScheme()
    },
    resetColorScheme: function() {
        const localColorScheme = localStorage.getItem(localThemeKey)
        if (localColorScheme == dark) {
            currentColorScheme = dark
        } else if (localColorScheme == light) {
            currentColorScheme = light
        } else {
            if (localColorScheme && localColorScheme != defaultScheme) {
                //Invalid value, reset localStorage
                localStorage.removeItem(localThemeKey)
            }
            // Use browser default. This is also the no-preference case, which used to fall through
            // every branch and leave currentColorScheme at its initial `light` - so a first visit
            // ignored a reader whose browser asks for dark, and the `default` scheme was a value
            // that could be set but was never the starting point.
            // `?.matches`, because `matchMedia` is genuinely absent off a browser. This branch
            // then reads as "no light preference" and falls to dark, which is the same answer it
            // gives a browser that reports no preference at all.
            currentColorScheme = matchMediaHelper('(prefers-color-scheme: light)')?.matches ? light : dark
        }
        // Set theme on the html element
        if (currentColorScheme == light) {
            setTheme(light)
        } else {
            setTheme(dark)
        }
    }
}

/**
 * The palette for one `selector`, as CSS text.
 *
 * A function rather than a const - unlike every other stylesheet in the package this one is
 * parameterised, by the selector it is scoped to and by the caller's colour overrides, so there is
 * no single string to hoist. Split out all the same, so `setThemeOnSelector` below reads as the
 * one thing it does.
 */
function themeCss(selector: string, options?: ThemeColorOptions | undefined): string {
    return `
${selector}[data-theme="light"]{
${textColors("text", options?.textLightColor || defaultTextLightColor, options?.textDarkColor || defaultTextDarkColor)}
${backgroundColorGradient("background", options?.backgroundLightColor || defaultBackgroundLightColor, options?.backgroundLightAltColor || defaultBackgroundLightAltColor)}
${middleColorSpread("primary", white, options?.primaryLightColor || defaultPrimaryLightColor, black)}
${middleColorSpread("secondary", white, options?.secondaryLightColor || defaultSecondaryLightColor, black)}
${middleColorSpread("warning", white, options?.warningLightColor || defaultWarningLightColor, black)}
${middleColorSpread("accent", white, options?.accentLightColor || defaultAccentLightColor, black)}
color-scheme:light;}
${selector}[data-theme="dark"]{
${textColors("text", options?.textDarkColor || defaultTextDarkColor, options?.textLightColor || defaultTextLightColor)}
${backgroundColorGradient("background", options?.backgroundDarkColor || defaultBackgroundDarkColor, options?.backgroundDarkAltColor || defaultBackgroundDarkAltColor)}
${middleColorSpread("primary", black, options?.primaryDarkColor || defaultPrimaryDarkColor, white)}
${middleColorSpread("secondary", black, options?.secondaryDarkColor || defaultSecondaryDarkColor, white)}
${middleColorSpread("warning", black, options?.warningDarkColor || defaultWarningDarkColor, white)}
${middleColorSpread("accent", black, options?.accentDarkColor || defaultAccentDarkColor, white)}
color-scheme:dark;}
${selector}{color:var(--text);background-color:var(--background);}
${selector} a{color:var(--text)}`
}

/**
 * Injects CSS styles for the Velodesign Theme on the `selector` CSS Selector
 *
 * Note: Selected element(s) need `data-theme="light"` or `data-theme="dark"` for theme to
 * work properly
 *
 * `mountStyles` only applies the styles for a given `selector` once by default - calling
 * this again for the same `selector` with different `options` is a no-op unless `resetSheet`
 * is `true`, which replaces the previously-injected stylesheet with one built from the new
 * `options` (e.g. for a live theme editor letting a user preview color changes in real time).
 */
export function setThemeOnSelector(selector: string, options?: ThemeColorOptions | undefined, resetSheet: boolean = false): void {
    mountStyles(themeCss(selector, options), `vtd/Theme on ${selector}`, "theme", resetSheet)
}

/** Stylesheet: the colour transition, mounted a beat after load so the page arrives cleanly */
const themeTransitionCss: string = `body{transition:color 0.25s ease-in-out,background-color 0.25s ease-in-out;}`

/** Stylesheet: Velodesign CSS reset */
const resetCss: string = `*{margin:0;padding:0;line-height:calc(1em + 4px);box-sizing:border-box;}
html{-moz-text-size-adjust:none;-webkit-text-size-adjust:none;text-size-adjust:none;scroll-behavior:smooth;interpolate-size:allow-keywords;}
body{-webkit-font-smoothing:antialiased;min-width:250px}
img,svg{display:inline-block;max-width:100%;}
input,button,textarea,select{font:inherit;}
p,h1,h2,h3{overflow-wrap:break-word;}
p{text-wrap:pretty;}
h1,h2,h3{text-wrap:balance;}
menu,ul,ol{list-style:none;}
button{color:inherit;border:none;}
:target{scroll-margin-block:20ex;}`

/**
 * A collection of functions to manage the Theme
 */
export const Theme: {
    /**
     * Inject CSS Styles for the Velotype Theme
     * 
     * @param options Customizable options
     * @param includeCSSReset If a CSS Reset should be included
     */
    injectStyles: (options?: ThemeColorOptions | undefined, includeCSSReset?: boolean) => void
} = {
    injectStyles(options?: ThemeColorOptions, includeCSSReset: boolean = true) {
        // Optionally add Reset styles
        if (includeCSSReset) {
            // References:
            // -- https://www.joshwcomeau.com/css/custom-css-reset/
            // -- https://www.joshwcomeau.com/snippets/html/interpolate-size/
            // -- https://piccalil.li/blog/a-more-modern-css-reset/
            mountStyles(resetCss,"Velodesign CSS reset", "reset")
        }

        // Set Theme on `<html>` element
        setThemeOnSelector(":root", options)

        // Delay setting transitions so that the page loads cleanly
        setTimeoutHelper(function(){
            mountStyles(themeTransitionCss, "Velodesign Theme Color transitions", "theme")
        },150)

        //Trigger initial color scheme selection
        ColorScheme.resetColorScheme()
    }
}
