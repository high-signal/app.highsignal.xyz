import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({ status: 200 })
    } catch (error) {
        console.error("Error fetching project settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
