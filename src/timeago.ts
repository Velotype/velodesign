import type { FunctionComponent, RenderableElements } from "jsr:@velotype/velotype"

export type TimeAgoAttrsType = {
    timestamp: Date | string
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
const defaultNumeric = "always"
const defaultTimestyle = "long"
export const TimeAgo: FunctionComponent<TimeAgoAttrsType> = function(attrs: TimeAgoAttrsType, _children: RenderableElements[]): string {
    const then: Date = (attrs.timestamp instanceof Date) ? attrs.timestamp : new Date(attrs.timestamp)
    const now = new Date()
    const deltaS = Math.floor((then.getTime() - now.getTime())/1000)
    const deltaM = (deltaS<0)?Math.ceil(deltaS / 60):Math.floor(deltaS / 60)
    const deltaH = (deltaS<0)?Math.ceil(deltaM / 60):Math.floor(deltaM / 60)
    const deltaD = (deltaS<0)?Math.ceil(deltaH / 24):Math.floor(deltaH / 24)
    const relM = deltaM % 60
    const relH = deltaH % 24
    const relD = deltaD
    if (relD != 0) {
        return getRtf(attrs.numeric||defaultNumeric,attrs.timestyle || defaultTimestyle).format(relD, "day")
    } else if (relH != 0) {
        return getRtf(attrs.numeric||defaultNumeric,attrs.timestyle || defaultTimestyle).format(relH, "hour")
    } else if (relM != 0) {
        return getRtf(attrs.numeric||defaultNumeric,attrs.timestyle || defaultTimestyle).format(relM, "minute")
    } else {
        return getRtf("auto",attrs.timestyle || defaultTimestyle).format(0, "second")
    }
}
