import { NextRequest, NextResponse } from "next/server"
import { triggerLambda } from "../../../../../utils/lambda-utils/triggerLambda"
import { createClient } from "@supabase/supabase-js"

export async function PATCH(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json()
        const { signalStrengthName, userId, projectId, signalStrengthUsername } = body

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        // Prepare array of users to process
        let usersToUpdate = []

        if (userId && signalStrengthUsername) {
            // Single user mode
            console.log("Single user mode")
            usersToUpdate = [{ userId, signalStrengthUsername }]
        } else {
            // All users mode
            console.log("All users mode")
            if (!projectId) {
                return NextResponse.json({ error: "Missing projectId for all-users update" }, { status: 400 })
            }
            const { data: forumUsers, error: forumUsersError } = await supabase
                .from("forum_users")
                .select("user_id, forum_username")
                .eq("project_id", projectId)
                .not("forum_username", "is", null)

            if (forumUsersError) {
                console.error("Error fetching forum users:", forumUsersError)
                return NextResponse.json({ error: "Error fetching forum users" }, { status: 500 })
            }
            usersToUpdate = (forumUsers || []).map((u: any) => ({
                userId: u.user_id,
                signalStrengthUsername: u.forum_username,
            }))
        }

        const userIds = usersToUpdate.map((u) => u.userId)
        // if (process.env.NODE_ENV === "development") {
        //     // Clear last_updated for all users in usersToUpdate
        //     if (userIds.length > 0) {
        //         const { error: clearError } = await supabase
        //             .from("forum_users")
        //             .update({ last_updated: null })
        //             .in("user_id", userIds)
        //             .eq("project_id", projectId)
        //         if (clearError) {
        //             console.error("Error clearing last_updated:", clearError)
        //             return NextResponse.json({ error: "Error clearing last_updated" }, { status: 500 })
        //         }
        //     }
        // }

        // Lookup the signal_strength_id for the given signalStrengthName
        const { data: signalStrengthData, error: signalStrengthDataError } = await supabase
            .from("signal_strengths")
            .select("id")
            .eq("name", signalStrengthName)
            .single()

        if (signalStrengthDataError || !signalStrengthData) {
            console.error("Error fetching signal strength ID:", signalStrengthDataError)
            return NextResponse.json({ error: "Error fetching signal strength ID" }, { status: 500 })
        }

        // Delete all user_signal_strengths for these users, project, and signal strength
        // if (process.env.NODE_ENV === "development") {
        //     if (userIds.length > 0) {
        //         const { error: deleteError } = await supabase
        //             .from("user_signal_strengths")
        //             .delete()
        //             .in("user_id", userIds)
        //             .eq("project_id", projectId)
        //             .eq("signal_strength_id", signalStrengthId)
        //         if (deleteError) {
        //             console.error("Error deleting user_signal_strengths:", deleteError)
        //             return NextResponse.json({ error: "Error deleting user_signal_strengths" }, { status: 500 })
        //         }
        //     }
        // }

        // Trigger lambda for each user
        const results = await Promise.all(
            usersToUpdate.map(async ({ userId, signalStrengthUsername }) => {
                const analysisResponse = await triggerLambda(
                    signalStrengthName,
                    userId,
                    projectId,
                    signalStrengthUsername,
                )
                return { userId, signalStrengthUsername, ...analysisResponse }
            }),
        )

        const failed = results.filter((r) => !r.success)
        if (failed.length > 0) {
            return NextResponse.json({ error: "Some analyses failed to start", details: failed }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: `Analysis triggered for ${usersToUpdate.length} user(s)` })
    } catch (error) {
        console.error("Unhandled error in user update:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
