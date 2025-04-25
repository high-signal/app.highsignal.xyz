/**
 * Validates a username according to the application rules
 * @param username The username to validate
 * @returns An error message if validation fails, or an empty string if validation passes
 */
export function validateUsername(username: string): string {
    if (!username) {
        return "Username is required"
    }

    if (username.length > 20) {
        return "Username cannot be longer than 20 characters"
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username)) {
        return "Username can only use letters, numbers, underscores, and hyphens"
    }

    return ""
}

/**
 * Validates a display name according to the application rules
 * @param displayName The display name to validate
 * @returns An error message if validation fails, or an empty string if validation passes
 */
export function validateDisplayName(displayName: string): string {
    if (!displayName) {
        return "Display name is required"
    }

    if (displayName.length > 50) {
        return "Display name cannot be longer than 50 characters"
    }

    return ""
}

/**
 * Validates a urlSlug according to the application rules
 * @param urlSlug The urlSlug to validate
 * @returns An error message if validation fails, or an empty string if validation passes
 */
export function validateUrlSlug(urlSlug: string): string {
    if (!urlSlug) {
        return "Url slug is required"
    }

    if (urlSlug.length > 20) {
        return "Url slug cannot be longer than 20 characters"
    }

    const urlSlugRegex = /^[a-zA-Z0-9_-]+$/
    if (!urlSlugRegex.test(urlSlug)) {
        return "Url slug can only use letters, numbers, underscores, and hyphens"
    }

    return ""
}
