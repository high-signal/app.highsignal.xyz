/**
 * Strips all HTML tags from a given string.
 * This function replicates the behavior of the legacy HTML stripping logic.
 *
 * @param html - The HTML string to sanitize.
 * @returns The string with all HTML tags removed, or an empty string if the input is null or undefined.
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) {
        return ""
    }
    // The regex /<[^>]*>/g matches any character between < and > and removes it.
    return html.replace(/<[^>]*>/g, "")
}

/**
 * Recursively processes an object to strip HTML from all string values.
 * This function replicates the behavior of the legacy processObjectForHtml function.
 *
 * @param obj - The object to process
 * @returns The processed object with HTML stripped from all string values
 */
export function processObjectForHtml<T>(obj: T): T {
    // Create a deep copy of the object to ensure the original is not mutated.
    const newObj = JSON.parse(JSON.stringify(obj))

    // Inner function to perform the recursive stripping on the new object.
    const stripRecursively = (currentObj: any): any => {
        if (currentObj === null || currentObj === undefined) {
            return currentObj
        }

        if (typeof currentObj === "string") {
            return stripHtml(currentObj)
        }

        if (Array.isArray(currentObj)) {
            return currentObj.map(stripRecursively)
        }

        if (typeof currentObj === "object") {
            const result: Record<string, any> = {}
            for (const key in currentObj) {
                if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
                    result[key] = stripRecursively(currentObj[key])
                }
            }
            return result
        }

        return currentObj
    }

    return stripRecursively(newObj)
}
