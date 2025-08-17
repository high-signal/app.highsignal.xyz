import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Public API to get all enabled banners
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: banner, error } = await supabase
        .from("banners")
        .select(
            `
            type,
            style,
            title,
            content,
            closable
        `,
        )
        .eq("enabled", true)

    if (error) {
        const errorMessage = error.message || "Unknown error"
        console.error("🔍 Banner error:", errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    return NextResponse.json({ status: "success", statusCode: 200, data: banner })
}
