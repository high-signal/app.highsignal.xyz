import { NextRequest, NextResponse } from "next/server"
import { fetchUserData } from "../../../utils/fetchUserData"

export async function GET(request: NextRequest) {
    try {
        // Get the privyId of the logged in user from the headers (set by middleware)
        const privyId = request.headers.get("x-privy-id")!

        const { data: userData, error } = await fetchUserData(privyId)

        if (error) {
            if (error === "User not found") {
                return NextResponse.json({ error }, { status: 404 })
            }
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json(userData)
    } catch (error) {
        console.error("Error in /me route:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
