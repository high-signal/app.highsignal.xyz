import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Superadmin API to get all banners for editing
export async function GET() {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: banners, error } = await supabase
        .from("banners")
        .select(
            `
            id,
            type,
            style,
            title,
            content,
            closable,
            enabled,
            internal_name
        `,
        )
        .order("id", { ascending: true })

    if (error) {
        const errorMessage = error.message || "Unknown error"
        console.error("🔍 Banner error:", errorMessage)
        return NextResponse.json({ status: "error", statusCode: 500, error: errorMessage })
    }

    return NextResponse.json({ status: "success", statusCode: 200, data: banners })
}

// Update banners in the database
export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { banner } = body

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Update the banner in the database
        const { error: updateError } = await supabase
            .from("banners")
            .update({
                // type: banner.type,
                style: banner.style,
                title: banner.title,
                content: banner.content,
                closable: banner.closable,
                enabled: banner.enabled,
                internal_name: banner.internal_name,
            })
            .eq("id", banner.id)
            .select()
            .single()

        if (updateError) {
            console.error("Error updating banner:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
