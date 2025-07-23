import { NextRequest, NextResponse } from "next/server"
import axios from "axios"

export async function GET(request: NextRequest) {
    const BASE_URL = request.nextUrl.searchParams.get("forumUrl")
    const username = request.nextUrl.searchParams.get("username")

    if (!username || !BASE_URL) {
        return NextResponse.json({ error: "Username and forum URL are required" }, { status: 400 })
    }

    try {
        const url = `${BASE_URL}/u/${username}/activity.json`
        await axios.get(url)

        // Return false if the response from the API is a successful response (200-299)
        return NextResponse.json({ isPrivate: false }, { status: 200 })
    } catch (error) {
        // If it's a 404 error, the account is private or doesn't exist
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return NextResponse.json({ isPrivate: true }, { status: 200 })
        }

        // For other errors, re-throw them
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error(`Error checking forum account for user ${username}:`, errorMessage)
        throw error
    }
}
