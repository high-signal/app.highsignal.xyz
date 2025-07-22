import createDOMPurify from "dompurify"
import { JSDOM } from "jsdom"
import outOfCharacter from "out-of-character"

// Initialize DOMPurify with JSDOM for server-side usage
const window = new JSDOM("").window
const DOMPurify = createDOMPurify(window)

/**
 * Sanitizes a string by:
 * 1. Removing invisible/control characters
 * 2. Cleaning potential XSS with DOMPurify
 * @param input The string to sanitize
 * @returns The sanitized string
 */
export function sanitize(input: string): string {
    const strInput = String(input)
    const cleaned = outOfCharacter.replace(strInput)
    return DOMPurify.sanitize(cleaned)
}
