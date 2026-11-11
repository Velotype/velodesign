/**
 * How the library moves: every open, close, slide and fade runs for the same time on the same
 * curve, so a drawer, a modal, a toast, an accordion and a switch all feel like one thing.
 * Picked from pages comparing five speeds and five curves side by side, component by component.
 */

/** How long a motion runs, in milliseconds */
export const MOTION_MS = 300

/** The curve every motion follows */
export const MOTION_EASE = "ease-in-out"

/** A motion's duration and curve together, for a stylesheet's `transition` or `animation` */
export const MOTION = `${MOTION_MS / 1000}s ${MOTION_EASE}`

/** Whether the reader has asked for less motion - then things appear and go at once */
export function motionReduced(): boolean {
    return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
}

/** The exits under way, so a re-open can stop one before it finishes */
const exits = new WeakMap<Element, ReturnType<typeof setTimeout>>()

/**
 * Plays an element's exit - the animation its stylesheet gives it under `exitClass` - then runs
 * `done`. A timer rather than `animationend`: the event never comes when the element isn't
 * rendered or motion is reduced. Asked again while the exit runs, it does nothing.
 */
export function playExit(element: Element, exitClass: string, done: () => void): void {
    if (exits.has(element)) {return}
    if (motionReduced()) {
        done()
        return
    }
    element.classList.add(exitClass)
    exits.set(element, globalThis.setTimeout(() => {
        exits.delete(element)
        done()
        element.classList.remove(exitClass)
    }, MOTION_MS))
}

/** Stops an exit under way, leaving the element as it was before it began */
export function cancelExit(element: Element, exitClass: string): void {
    const timer = exits.get(element)
    if (timer === undefined) {return}
    globalThis.clearTimeout(timer)
    exits.delete(element)
    element.classList.remove(exitClass)
}

/**
 * Closes a `<dialog>` once its exit has played. Escape and a click outside it - the browser's
 * own ways to close one - run through here too, from its `cancel` event; where the browser
 * won't let that event be held back, the dialog closes at once, as it always did.
 */
export function animateDialog(dialog: HTMLDialogElement, exitClass: string): {close: () => void, showModal: () => void} {
    const close = () => {
        if (!dialog.open) {return}
        playExit(dialog, exitClass, () => dialog.close())
    }
    dialog.addEventListener("cancel", (event: Event) => {
        if (!event.cancelable || motionReduced()) {return}
        event.preventDefault()
        close()
    })
    return {
        close,
        showModal: () => {
            cancelExit(dialog, exitClass)
            if (!dialog.open) {dialog.showModal()}
        }
    }
}
