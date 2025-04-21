import { NextResponse } from "next/server"

export async function GET() {
    const region = process.env.VERCEL_REGION
    if (!region) {
        return NextResponse.json({ region: "VERCEL_REGION not found" })
    }
    return NextResponse.json({ region })
}
