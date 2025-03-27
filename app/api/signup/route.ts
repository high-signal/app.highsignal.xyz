import { NextRequest, NextResponse } from "next/server"

interface EmailRequest {
    email: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const { email } = (await request.json()) as EmailRequest

    if (!email) {
        return NextResponse.json({ status: 400, error: "Email is required" }, { status: 400 })
    }

    try {
        const response = await fetch(process.env.SIGNUP_WEBHOOK_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        })

        if (response.status !== 200) {
            return NextResponse.json({ status: 500, error: "Failed to add email" }, { status: 500 })
        } else {
            return NextResponse.json({ status: 200, message: "Email added successfully" }, { status: 200 })
        }
    } catch (error) {
        console.error(error)
        return NextResponse.json({ status: 500, error: "Failed to add email" }, { status: 500 })
    }
}
