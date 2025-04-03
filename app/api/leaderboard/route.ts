import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { calculateSignal } from "../../../utils/calculateSignal"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("project")

    if (!projectSlug) {
        return NextResponse.json({ error: "Project slug is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    try {
        // Get the top 10 users with their scores and user details for the given project slug
        const { data: users, error: usersError } = await supabase
            .from("user_project_scores")
            .select(
                `
                user_id,
                score,
                projects!inner (
                    id
                ),
                users!inner (
                    username,
                    display_name,
                    profile_image_url
                )
            `,
            )
            .eq("projects.url_slug", projectSlug)
            .order("score", { ascending: false })
            .limit(10)

        console.log("users", users)

        if (usersError) {
            console.log("usersError", usersError)
            return NextResponse.json({ error: "Error fetching users" }, { status: 500 })
        }

        // Transform the response to include user details
        const formattedUsers = (
            users as unknown as Array<{
                user_id: string
                score: number
                users: { username: string; display_name: string; profile_image_url: string }
            }>
        ).map((user) => ({
            userId: user.user_id,
            score: user.score,
            username: user.users.username,
            displayName: user.users.display_name,
            profileImageUrl: user.users.profile_image_url,
            signal: calculateSignal(user.score),
        }))

        console.log("formattedUsers", formattedUsers)
        return NextResponse.json(formattedUsers)
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
