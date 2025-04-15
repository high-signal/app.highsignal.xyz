import { PrivyClient } from "@privy-io/server-auth"

const privyClient = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

export async function verifyAuth(authHeader: string | null): Promise<{
    isAuthenticated: boolean
    userId?: string
    error?: string
}> {
    try {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return {
                isAuthenticated: false,
                error: "Missing or invalid Authorization header",
            }
        }

        const accessToken = authHeader.substring(7)
        const verifiedClaims = await privyClient.verifyAuthToken(accessToken)

        if (!verifiedClaims.userId) {
            return {
                isAuthenticated: false,
                error: "User ID not found in token",
            }
        }

        return {
            isAuthenticated: true,
            userId: verifiedClaims.userId,
        }
    } catch (error) {
        return {
            isAuthenticated: false,
            error: error instanceof Error ? error.message : "Invalid token",
        }
    }
}
