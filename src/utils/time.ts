
// TODO debug
export function daysBetweenTimestamps(from: bigint, to: bigint): number {
    const fromTimestamp = new Date((from * BigInt('1000')).toString())
    const toTimestamp = new Date((to * BigInt('1000')).toString())
    const diff = toTimestamp.getTime() - fromTimestamp.getTime()

    const daysDiff = (diff / (1000 * 3600 * 24))

    if (daysDiff < 0) {
        return 0
    }

    return Math.ceil(daysDiff) ? Math.ceil(daysDiff) : 0
}