export const EARLY_ACCESS_KEY = "earlyAccessCode"

export const checkEarlyAccess = async (code: string): Promise<boolean> => {
    try {
        const response = await fetch("/api/verify-early-access", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
        })

        return response.ok
    } catch (error) {
        console.error("Error checking early access:", error)
        return false
    }
}

export const getStoredEarlyAccessCode = (): string | null => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(EARLY_ACCESS_KEY)
}

export const setStoredEarlyAccessCode = (code: string): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(EARLY_ACCESS_KEY, code)
}
