import { NextResponse } from "next/server"
import { PrivyClient } from "@privy-io/server-auth"

const privyClient = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

export async function verifyAuthentication(
    authHeader: string | null,
): Promise<{ success: boolean; privyId?: string; error?: NextResponse }> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
            success: false,
            error: NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 }),
        }
    }

    const accessToken = authHeader.substring(7) // Remove "Bearer " prefix
    const verifiedClaims = await privyClient.verifyAuthToken(accessToken)

    if (!verifiedClaims.userId) {
        return {
            success: false,
            error: NextResponse.json({ error: "User ID not found in token" }, { status: 401 }),
        }
    }

    return {
        success: true,
        privyId: verifiedClaims.userId,
    }
}
