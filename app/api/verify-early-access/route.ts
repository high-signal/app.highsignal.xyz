import { NextResponse } from "next/server"

const VALID_ACCESS_CODE = process.env.EARLY_ACCESS_CODE || "higher"

export async function POST(request: Request) {
    try {
        const { code } = await request.json()

        if (!code) {
            return NextResponse.json({ error: "Access code is required" }, { status: 400 })
        }

        if (code.toLowerCase() === VALID_ACCESS_CODE.toLowerCase()) {
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Invalid access code" }, { status: 401 })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
