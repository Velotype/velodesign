import type { FunctionComponent, RenderableElements } from "jsr:@velotype/velotype"

export type TimeAgoAttrsType = {
    timestamp: string
    numeric?: "always" | "auto"
    timestyle?: "long" | "short" | "narrow"
}

const rtfMap = new Map<string, Intl.RelativeTimeFormat>()
function getRtf(numeric: "always" | "auto", style: "long" | "short" | "narrow") {
    const rtf = rtfMap.get(numeric+"+"+style)
    if (rtf) {
        return rtf
    } else {
        const newRtf = new Intl.RelativeTimeFormat(undefined, {
            numeric: numeric,
            style: style
        })
        rtfMap.set(numeric+"+"+style,newRtf)
        return newRtf
    }
}

export const TimeAgo: FunctionComponent<TimeAgoAttrsType> = function(attrs: TimeAgoAttrsType, _children: RenderableElements[]): string {
    const then = new Date(attrs.timestamp)
    const now = new Date()
    const deltaS = Math.floor((now.getTime() - then.getTime())/1000)
    const deltaM = Math.floor(deltaS / 60)
    const deltaH = Math.floor(deltaM / 60)
    const deltaD = Math.floor(deltaH / 24)
    const relM = deltaM % 60
    const relH = deltaH % 24
    const relD = deltaD
    if (relD > 0) {
        return getRtf(attrs.numeric||"auto",attrs.timestyle || "long").format(-1 * relD, "day")
    } else if (relH > 0) {
        return getRtf(attrs.numeric||"auto",attrs.timestyle || "long").format(-1 * relH, "hour")
    } else if (relM > 0) {
        return getRtf(attrs.numeric||"auto",attrs.timestyle || "long").format(-1 * relM, "minute")
    } else {
        return getRtf("auto",attrs.timestyle || "long").format(0, "second")
    }
}
