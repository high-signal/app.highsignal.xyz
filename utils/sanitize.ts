import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"

// Initialize DOMPurify with JSDOM for server-side usage
const window = new JSDOM("").window
const DOMPurify = createDOMPurify(window)

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input The string to sanitize
 * @returns The sanitized string
 */
export function sanitize(input: string): string {
    return DOMPurify.sanitize(input)
}
