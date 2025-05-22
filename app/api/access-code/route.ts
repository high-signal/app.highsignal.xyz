import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get("code")

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Check if the access code exists in the database
        const { data: validAccessCode, error: accessCodeCheckError } = await supabase
            .from("access_codes")
            .select("id")
            .eq("code", code)
            .single()

        if (accessCodeCheckError && accessCodeCheckError.code !== "PGRST116") {
            console.error("Error checking access code:", accessCodeCheckError)
            return NextResponse.json({ error: "Error checking access code" }, { status: 500 })
        }

        if (validAccessCode) {
            return NextResponse.json({ success: true }, { status: 200 })
        }

        return NextResponse.json({ success: false }, { status: 404 })
    } catch (error) {
        console.error("Error checking access code:", error)
        return NextResponse.json({ error: "Error checking access code" }, { status: 500 })
    }
}
