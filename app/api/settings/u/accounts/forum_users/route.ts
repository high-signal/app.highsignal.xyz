import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
    try {
        const signalStrengthName = "discourse_forum"

        // Parse the request URL params
        const username = request ? new URL(request.url).searchParams.get("username") : null
        const projectUrlSlug = request ? new URL(request.url).searchParams.get("project") : null

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Validate required fields
        if (!username || !projectUrlSlug) {
            return NextResponse.json(
                { error: "Missing required fields: username and project are required" },
                { status: 400 },
            )
        }

        // Lookup the user ID using the username
        const { data: targetUserData, error: targetUserDataError } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single()

        if (targetUserDataError || !targetUserData) {
            console.error("Error fetching target user ID:", targetUserDataError)
            return NextResponse.json({ error: "Error fetching target user ID" }, { status: 500 })
        }

        // Lookup the project ID using the projectUrlSlug
        const { data: projectData, error: projectDataError } = await supabase
            .from("projects")
            .select("id")
            .eq("url_slug", projectUrlSlug)
            .single()

        if (projectDataError || !projectData) {
            console.error("Error fetching project ID:", projectDataError)
            return NextResponse.json({ error: "Error fetching project ID" }, { status: 500 })
        }

        // Lookup the signal strength ID for the discourse_forum signal strength
        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthDataError || !signalStrengthData) {
            console.error("Error fetching signal strength ID:", signalStrengthDataError)
            return NextResponse.json({ error: "Error fetching signal strength ID" }, { status: 500 })
        }

        // Delete the forum_users entry
        const { error: forumUserError } = await supabase
            .from("forum_users")
            .delete()
            .eq("user_id", targetUserData.id)
            .eq("project_id", projectData.id)
            .not("forum_username", "is", null)

        if (forumUserError) {
            console.error("Error deleting forum user:", forumUserError)
            return NextResponse.json({ error: "Error deleting forum user" }, { status: 500 })
        }

        // Delete associated user_signal_strengths entries
        const { error: signalError } = await supabase
            .from("user_signal_strengths")
            .delete()
            .eq("user_id", targetUserData.id)
            .eq("project_id", projectData.id)
            .eq("signal_strength_id", signalStrengthData.id)

        if (forumUserError || signalError) {
            console.error("Error deleting forum user:", forumUserError || signalError)
            return NextResponse.json({ error: "Error deleting forum user" }, { status: 500 })
        }

        return NextResponse.json({ message: "Forum user deleted successfully" })
    } catch (error) {
        console.error("Unhandled error in forum user deletion:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
