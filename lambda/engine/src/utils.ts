/**
 * @file Provides simple utility functions used across the Lambda Engine.
 */

/**
 * Strips all HTML tags from a given string.
 *
 * This function uses a regular expression to remove any character sequence
 * that looks like an HTML tag (e.g., `<p>`, `</p>`, `<br/>`).
 * If the input is not a string, it is returned unmodified to prevent runtime errors,
 * preserving the original behavior.
 *
 * @param html The string from which to strip HTML tags.
 * @returns The sanitized string with HTML tags removed, or the original input if not a string.
 */
export const stripHtml = (html: string): string => {
    if (typeof html !== "string") {
        // To preserve original behavior, return non-string inputs as-is.
        return html
    }
    return html.replace(/<[^>]*>/g, "")
}
