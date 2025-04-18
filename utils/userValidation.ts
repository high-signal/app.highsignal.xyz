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
        return "Username can only contain letters, numbers, underscores, and hyphens"
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
