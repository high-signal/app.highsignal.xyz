import { PrivyClient } from "@privy-io/server-auth"
import { NextResponse } from "next/server"

const privyClient = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!)

export async function verifyAuth(authHeader: string | null): Promise<
    | {
          isAuthenticated: boolean
          privyId?: string
          error?: string
      }
    | NextResponse
> {
    try {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 })
        }

        const accessToken = authHeader.substring(7) // Remove "Bearer " prefix
        const verifiedClaims = await privyClient.verifyAuthToken(accessToken)

        if (!verifiedClaims.userId) {
            return NextResponse.json({ error: "User ID not found in token" }, { status: 401 })
        }

        return {
            isAuthenticated: true,
            privyId: verifiedClaims.userId,
        }
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid token" }, { status: 401 })
    }
}
