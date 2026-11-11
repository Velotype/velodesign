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

/**
 * Slides what just replaced a view in from the side it came from, fading up - a calendar's next
 * month arrives from the right, its last from the left. A transform and opacity only, so nothing is
 * laid out again while it moves. An element already sliding (a title that stays while its text
 * changes, under a quick second click) starts again from the new side. Nothing with reduced motion.
 */
export function slideIn(elements: Iterable<Element>, from: -1 | 1): void {
    if (motionReduced()) {return}
    const keyframes = [{opacity: 0, transform: `translateX(${from * 0.75}em)`}, {opacity: 1, transform: "none"}]
    for (const element of elements) {
        for (const running of element.getAnimations()) {
            if (running.id === SLIDE_ID) {running.cancel()}
        }
        element.animate(keyframes, {id: SLIDE_ID, duration: MOTION_MS, easing: MOTION_EASE})
    }
}

const SLIDE_ID = "vtd-slide-in"

/**
 * A carousel's push: what was on screen (`leaving`) slides all the way out one side while what
 * replaced it (`arriving`) slides in from the other, clipped to `frame` - a calendar's next month
 * pushes the last one off to the left. `leaving` is the old content itself, moved out of the way
 * rather than copied: it's laid over the new content, inert and hidden from assistive technology,
 * and removed once it's gone. `distance` is how far `arriving` starts from its place, in terms of
 * its own box - a calendar's day starts one row's width away, seven cells and six gaps, so nothing
 * is measured. The frame clips only while something moves, so a focus ring at its edge is never
 * cut off at rest. A push while another is still moving finishes that one at once. With reduced
 * motion, the old content simply goes.
 */
export function pushView(frame: HTMLElement, leaving: HTMLElement, arriving: Iterable<Element>, from: -1 | 1, distance: string = "100%"): void {
    for (const earlier of frame.querySelectorAll(":scope > [data-vtd-leaving]")) {earlier.remove()}
    if (motionReduced()) {
        frame.style.overflow = ""
        return
    }
    leaving.setAttribute("data-vtd-leaving", "")
    leaving.setAttribute("aria-hidden", "true")
    leaving.inert = true
    leaving.style.cssText = "position:absolute;inset:0;pointer-events:none;"
    frame.append(leaving)
    frame.style.overflow = "hidden"
    const timing = {duration: MOTION_MS, easing: MOTION_EASE}
    leaving.animate([{transform: "none"}, {transform: `translateX(${-from * 100}%)`}], timing).finished.then(() => {
        leaving.remove()
        if (!frame.querySelector(":scope > [data-vtd-leaving]")) {frame.style.overflow = ""}
    }, () => {})
    const start = from < 0 ? `translateX(calc(-1 * ${distance}))` : `translateX(${distance})`
    for (const element of arriving) {
        element.animate([{transform: start}, {transform: "none"}], {...timing, id: PUSH_ID})
    }
}

const PUSH_ID = "vtd-push-in"

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
