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

/** How a push ends - `pushView`'s */
export type PushViewOptions = {
    /**
     * How far what arrives starts from its place, in terms of its own box (default `100%`) - or, for
     * pieces that travel different ways, a function giving each its own: an event calendar's grid
     * day and its list row are both on the page, one of them hidden by a container query
     */
    distance?: string | ((element: Element) => string)
    /** What becomes of `leaving` once it has gone (default: it's removed) - a carousel hides its slide again */
    settle?: (leaving: HTMLElement) => void
}

/** The push still moving in each frame, so the next one can finish it first */
const pushes = new WeakMap<HTMLElement, () => void>()

/**
 * A carousel's push: what was on screen (`leaving`) slides all the way out one side while what
 * replaced it (`arriving`) slides in from the other, clipped to `frame` - a calendar's next month
 * pushes the last one off to the left. `leaving` is the old content itself, never a copy: laid
 * over the new content, inert and hidden from assistive technology, and once it has gone, settled
 * (removed, or hidden again by a carousel whose slides stay mounted). Something that isn't in
 * `frame` yet is put there; something that is stays where it is in the document, so its place in
 * the tab order doesn't change. `distance` is how far `arriving` starts, in terms of its own box -
 * a calendar's day starts one row's width away, seven cells and six gaps, so nothing is measured.
 * The frame clips only while something moves, so a focus ring at its edge is never cut off at
 * rest. A push while another is still moving finishes that one first, there and then - a quick
 * step back must not hide the slide that's just returning. With reduced motion, it settles at once.
 */
export function pushView(frame: HTMLElement, leaving: HTMLElement, arriving: Iterable<Element>, from: -1 | 1, options: PushViewOptions = {}): void {
    pushes.get(frame)?.()
    const settle = options.settle ?? (element => element.remove())
    if (motionReduced()) {
        settle(leaving)
        return
    }
    leaving.setAttribute("data-vtd-leaving", "")
    leaving.setAttribute("aria-hidden", "true")
    leaving.inert = true
    leaving.style.cssText = "position:absolute;inset:0;pointer-events:none;"
    if (leaving.parentElement !== frame) {frame.append(leaving)}
    frame.style.overflow = "hidden"
    const timing = {duration: MOTION_MS, easing: MOTION_EASE}
    const distance = options.distance ?? "100%"
    const moves = [...arriving].map(element => {
        const by = typeof distance === "function" ? distance(element) : distance
        const start = from < 0 ? `translateX(calc(-1 * ${by}))` : `translateX(${by})`
        return element.animate([{transform: start}, {transform: "none"}], {...timing, id: PUSH_ID})
    })
    const out = leaving.animate([{transform: "none"}, {transform: `translateX(${-from * 100}%)`}], timing)
    let done = false
    const finish = () => {
        if (done) {return}
        done = true
        pushes.delete(frame)
        out.cancel()
        for (const move of moves) {move.cancel()}
        leaving.removeAttribute("data-vtd-leaving")
        leaving.removeAttribute("aria-hidden")
        leaving.inert = false
        leaving.style.cssText = ""
        frame.style.overflow = ""
        settle(leaving)
    }
    pushes.set(frame, finish)
    out.finished.then(finish, () => {})
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
