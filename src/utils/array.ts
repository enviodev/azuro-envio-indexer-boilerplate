export function addUniqueItem<T>(arr: Array<T>, value: T): Array<T> {
    if (arr.indexOf(value) === -1) {
        return arr.concat([value])
    }

    return arr
}