export function addUniqueItem<T>(arr: Array<T>, value: T): Array<T> {
    if (arr.indexOf(value) === -1) {
        return arr.concat([value])
    }

    return arr
}

export function removeItem<T>(arr: Array<T>, value: T): Array<T> {
    const index = arr.indexOf(value)

    if (index > -1) {
        arr.splice(index, 1)
    }

    return arr
}