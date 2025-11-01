import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ username: string }> }) {
    const { username } = await context.params

    if (!username) {
        return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("username, display_name, profile_image_url")
        .eq("username", username)
        .single()

    if (userError) {
        return NextResponse.json({ error: "Error fetching user" }, { status: 500 })
    }

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const formattedUser: UserData = {
        username: user.username,
        displayName: user.display_name,
        profileImageUrl: user.profile_image_url,
    }

    return NextResponse.json(formattedUser)
}
