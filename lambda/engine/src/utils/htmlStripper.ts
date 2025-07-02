/**
 * Strips all HTML tags from a given string.
 * This function replicates the behavior of the legacy HTML stripping logic.
 *
 * @param html - The HTML string to sanitize.
 * @returns The string with all HTML tags removed, or an empty string if the input is null or undefined.
 */
export function stripHtml(html: string | null | undefined): string {
    if (!html) {
        return "";
    }
    // The regex /<[^>]*>/g matches any character between < and > and removes it.
    return html.replace(/<[^>]*>/g, "");
}
